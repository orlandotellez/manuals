# 44. Troubleshooting de Routing

**La metodología que convierte el caos en un diagnóstico — cuando la red no responde, vos sí sabés qué mirar**

---

Este manual es el más distinto de todos los que venís leyendo. Los anteriores te enseñaron cómo funciona una red cuando funciona: direcciones, máscaras, rutas estáticas, OSPF, EIGRP, BGP. Este te enseña lo otro, lo que pasa el 90 % del tiempo en un trabajo real: **la red no funciona y hay que averiguar por qué**.

**Troubleshooting** es una palabra inglesa que se usa tal cual en la jerga: *trouble* es "problema" y *shooting* es "cazar". Traducida a la vida diaria: **cazar problemas con método**. En español se dice "diagnóstico de fallas", y eso es exactamente lo que vamos a hacer: diagnosticar, no adivinar.

Antes de arrancar, cinco palabras que vas a ver todo el tiempo:

- Una **red** es un conjunto de equipos conectados que se pueden mandar mensajes entre sí. Cada mensaje viaja en porciones chiquitas llamadas **paquetes**: el sobrecito con una dirección de origen, una de destino y un pedazo de los datos.
- Un **router** (en español, encaminador) es el equipo que decide por dónde sigue un paquete cuando tiene que saltar de una red a otra. Cada conexión del router se llama **interfaz**, y cada interfaz tiene una dirección **IP** (*Internet Protocol*): el número que identifica a ese equipo dentro de la red.
- Una **ruta** es una frase que el router guarda en su memoria: "para llegar a tal red, mandá el paquete por tal interfaz, entregándoselo a tal equipo". El conjunto de esas frases es la **tabla de rutas**, y es lo único que el router mira cuando tiene que decidir.
- El **next-hop** ("próximo salto") es el equipo al que le entregás el paquete para que lo siga llevando. Es la estafeta de la posta: no necesitás saber todo el camino, alcanza con saber a quién dárselo ahora.
- **Routing** (enrutamiento) es la parte del trabajo que consiste en elegir y mantener esas rutas. **Troubleshooting de routing** es, entonces, averiguar por qué un paquete no encuentra camino hacia donde debería.

**La promesa de este manual:** al final vas a tener un método para ir de "la red no anda" a "el router de borde tiene una estática apuntando a una IP que ya no existe", sin tirar comandos al azar. No vas a memorizar una lista de fallas: vas a aprender a **descartar capas** hasta que quede una sola causa posible.

---

## Índice

- [El problema: la red "no anda" y nadie sabe por qué](#1-el-problema-la-red-no-anda-y-nadie-sabe-por-qué)
- [La metodología: síntoma → hipótesis → verificación](#2-la-metodología-síntoma--hipótesis--verificación)
- [El árbol de diagnóstico: 7 preguntas en orden](#3-el-árbol-de-diagnóstico-7-preguntas-en-orden)
- [Los comandos show que resuelven TODO](#4-los-comandos-show-que-resuelven-todo)
- [Troubleshooting por protocolo](#5-troubleshooting-por-protocolo)
- [El caso real resuelto: de "no hay internet" a la causa raíz](#6-el-caso-real-resuelto-de-no-hay-internet-a-la-causa-raíz)
- [Los 10 síntomas clásicos y su causa](#7-los-10-síntomas-clásicos-y-su-causa)
- [Herramientas: ping, traceroute y la lectura de sus misterios](#8-herramientas-ping-traceroute-y-la-lectura-de-sus-misterios)
- [Comprobá lo que aprendiste](#9-comprobá-lo-que-aprendiste)
- [Glosario](#10-glosario)
- [Resumen en 10 puntos](#11-resumen-en-10-puntos)

Cómo usar este índice: cada título es un capítulo y también es la dirección (la URL) con la que se publica la página. Si tenés poco tiempo, el camino corto es el capítulo 2 (el método), el 3 (el árbol de preguntas) y el 7 (la tabla de síntomas a comando). Con esos tres ya podés diagnosticar. Los capítulos 4, 5 y 6 son la caja de herramientas y el caso completo; el 8 es el detalle de las dos pruebas más viejas y más útiles de la profesión.

Una advertencia de entrada: este manual no se lee como los otros. Los otros se leen para entender; este se lee para **tener a mano**. Cuando algo se rompa, volvé al capítulo 3 y empezá por la primera pregunta.

### Resumen

- Troubleshooting es diagnóstico con método, no una colección de comandos memorizados.
- Un paquete viaja por routers que consultan una tabla de rutas y lo entregan a un next-hop.
- Este manual enseña a descartar capas, no a recitar una lista de fallas.
- El camino corto son los capítulos 2, 3 y 7; el resto es herramienta y práctica.
- Está pensado para volver cuando algo falle, no solo para leer una vez.

---

## 1. El problema: la red "no anda" y nadie sabe por qué

Llegaste a este manual con toda la teoría de routing encima: estáticas, RIP, OSPF, EIGRP, IS-IS, BGP, redistribución. Ahora llega el día que a todos les toca: **algo no funciona**. El usuario dice "no tengo internet", el jefe dice "la VPN no responde", y vos tenés 20 comandos en la cabeza pero por dónde empezar.

Empecemos por separar dos cosas que se confunden todo el tiempo:

- El **síntoma** es lo que la persona percibe: "no anda", "está lento", "no abre la página". Es la queja, no la causa.
- La **causa** es el hecho técnico que produce la queja: un cable desenchufado, una IP repetida, una ruta que apunta a un equipo que ya no existe.

El trabajo completo consiste en cruzar ese puente: del síntoma a la causa. Y el puente no se cruza con intuición, se cruza con **evidencia**: la salida de un comando que solo puede verse de una manera si la causa está presente, y de otra manera si no lo está.

**La analogía del auto:** son las siete de la mañana, el auto no arranca. ¿Qué hacés? No abrís el motor. Primero te fijás si tiene combustible, si la batería tiene carga, si la llave está girada, si la palanca está en punto muerto. Esas cuatro cosas se miran en dos minutos y explican la mayoría de los "no arranca". Recién si todas están bien abrís el capó y empezás a revisar el motor. Nadie sensato empieza por desarmar el motor: se empieza por lo barato, lo externo y lo que se puede ver sin herramientas.

Con la red es igual, y esa es la idea central de todo este manual: **se revisa de afuera hacia adentro**. Primero el cable y la luz del puerto (lo físico), después la dirección (¿este equipo tiene identidad en la red?), después el camino (¿el router sabe por dónde ir?), y solo al final la aplicación (¿el servicio del otro lado está funcionando?). Ese orden no es capricho: cada capa depende de la anterior, y si la de abajo está rota, la de arriba no puede funcionar por más que esté bien configurada.

> **El error número uno del troubleshooting** no es técnico, es de método: **tirar comandos al azar** ("a ver si con `show run` aparece algo..."). Eso funciona una de cada diez veces, y pierde horas. El profesional no es el que conoce más comandos: es el que **reduce el espacio de búsqueda con método** hasta que la causa raíz queda expuesta.

Fijate en la palabra: **reduce**. Diagnosticar no es agregar información, es sacar posibilidades. Si al principio hay cincuenta causas posibles y cada prueba descarta la mitad, en pocos pasos queda una. El que adivina, en cambio, agrega comandos y sigue con cincuenta posibilidades.

**La analogía del médico:** el médico no te receta a ciegas. Te pregunta, te toca, te manda análisis PRIMERO (historia clínica), y recién después hipótesis y tratamiento. El troubleshooting es medicina de redes: anamnesia (¿qué cambió?), signos vitales (ping, show), análisis dirigido (show ip route/protocols), y el diagnóstico con evidencia.

Hay una diferencia entre las dos analogías que conviene tener clara. El auto se revisa de afuera hacia adentro porque así se gasta menos; el médico pregunta antes de tocar porque el paciente le puede decir dónde duele. En la red pasan las dos cosas: el usuario te da la pista de **dónde** duele ("solo falla lo que sale a internet") y las capas te dicen **en qué orden** revisar. Un buen diagnóstico usa las dos: la pista acota el mapa, las capas ordenan el recorrido.

Y una última idea antes de pasar al método: el síntoma del usuario casi nunca es el síntoma técnico. "No hay internet" puede ser una ruta por defecto ausente, un DNS mal configurado, un cable, o el proveedor caído. Son cuatro causas en cuatro capas distintas, y la única forma de distinguirlas es bajar capa por capa. Por eso el método empieza preguntando, no comandando.

### Resumen

- El síntoma es la queja; la causa es el hecho técnico que la produce. El diagnóstico es el puente entre los dos.
- La red se revisa de afuera hacia adentro: física, dirección, ruta, aplicación. Como el auto antes de abrir el motor.
- Diagnosticar es descartar posibilidades, no acumular comandos.
- Tirar comandos al azar es el error número uno y el que más horas cuesta.
- El síntoma del usuario ("no hay internet") puede corresponder a causas de capas muy distintas.

---

## 2. La metodología: síntoma → hipótesis → verificación

El método completo tiene 5 pasos — y son SIEMPRE los mismos, para cualquier falla:

```text
PASO 1 — REPRODUCIR Y ACOTAR
   ¿Qué falla exactamente? ¿Desde cuándo? ¿A quién le afecta (uno o todos)?
   ¿Qué cambió hace poco? (¡la pregunta de oro! 90% de las veces alguien tocó algo)

PASO 2 — DIVIDIR LA RED EN CAPAS
   Aplicación → Transporte → Red (routing) → Enlace → Física
   ¿El problema es de ruteo o estoy buscando en el piso equivocado?
   (Si no hay link, no hay ruteo que valga: primero el enlace.)

PASO 3 — HIPÓTESIS (en orden de probabilidad)
   La más probable primero. NUNCA "todas a la vez".

PASO 4 — VERIFICAR CADA HIPÓTESIS CON EVIDENCIA
   Un comando show, un ping, un traceroute. La hipótesis se confirma o se descarta
   con DATOS, no con intuición.

PASO 5 — ARREGLAR Y VERIFICAR
   Aplicás el fix, comprobás que el síntoma desapareció y que NO rompiste otra cosa.
```

Este bloque es el método entero, escrito como una receta de cinco pasos. Se lee de arriba hacia abajo y no se saltea ninguno. Las palabras en mayúscula son las acciones: **reproducir y acotar**, **dividir**, **hipotetizar**, **verificar**, **arreglar y verificar**. Lo que está debajo de cada una, con sangría, es lo que hay que preguntarse o hacer en ese paso.

Paso por paso, con el significado de cada palabra:

1. **Reproducir** quiere decir provocar la falla a voluntad: "hacé de nuevo eso que no anda". Si no podés reproducirla, no podés comprobar que la arreglaste. **Acotar** es reducir el alcance: ¿falla un equipo o todos? ¿falla una red o todas? ¿falla siempre o a ratos? Cada respuesta elimina la mitad del mapa.
2. **Dividir en capas** es ubicar la falla en un piso del edificio. La lista del bloque va de arriba hacia abajo (aplicación, transporte, red, enlace, física) porque así se nombran las capas; el recorrido práctico va al revés, de abajo hacia arriba, por la razón que está entre paréntesis: si el enlace está caído, no hay ruta que valga. La capa **física** es el cable, el conector, el puerto y su luz. La de **enlace** es la conversación entre dos equipos directamente conectados. La de **red** es el routing: la decisión de por dónde va el paquete. La de **transporte** son los puertos y la confiabilidad (TCP y UDP). La de **aplicación** es el programa: el navegador, el servidor web, la VPN.
3. **Hipótesis** es una sospecha con forma de frase comprobable: "la ruta por defecto no está". No es "algo anda mal". Una hipótesis sirve solo si podés decir qué comando la confirma y qué comando la descarta.
4. **Verificar con evidencia** es ir a mirar. Datos, no intuición: la salida del comando, no "me parece que".
5. **Arreglar y verificar** tiene dos mitades. La segunda es la que se olvida: después del fix hay que comprobar que el síntoma desapareció **y** que no rompiste otra cosa que antes funcionaba.

> **HACELO VOS (la regla del diagnóstico profesional):** antes de tocar CUALQUIER configuración, formulá en voz alta la hipótesis y el comando que la confirma. Si no podés decir "si pasa X, `show ip route` me va a mostrar Y", todavía no diagnosticaste: estás adivinando. El diagnóstico termina cuando tenés la **evidencia** que conecta causa y efecto.

Esa regla tiene una versión corta que podés repetir en voz alta en medio de un incidente: **"¿qué espero ver, y qué vería si me equivoco?"**. Si no tenés las dos respuestas, el comando que estás por escribir no es una prueba, es una lotería.

**La analogía del mecánico, otra vez, pero aplicada al método:** el mecánico no dice "puede ser cualquier cosa". Dice "si es la batería, al dar arranque las luces bajan; probemos". Hace una predicción, la prueba, y con el resultado descarta o confirma. Eso es el paso 3 y el 4 trabajando juntos. Un mecánico que cambia piezas hasta que arranca no es más rápido: es más caro, y no sabe qué estaba roto.

Un detalle que define la diferencia entre un técnico y un profesional: al terminar, el profesional puede contar la historia completa. "El usuario no navegaba porque la estática por defecto apuntaba a una IP que dejó de existir cuando cambiaron el router del ISP; lo confirmé con `show ip route 0.0.0.0`, que respondió que la red no estaba en la tabla." Si no podés contar esa historia con evidencia en la mano, el problema no está resuelto: está tapado.

### Resumen

- El método son cinco pasos fijos: reproducir y acotar, dividir en capas, hipotetizar, verificar, arreglar y verificar.
- Las capas se recorren de abajo hacia arriba en la práctica: sin enlace no hay routing.
- Una hipótesis sirve solo si podés decir qué comando la confirma y cuál la descarta.
- Antes de tocar configuración, formulá la predicción: qué esperás ver y qué verías si te equivocás.
- Después del fix se verifica dos veces: que el síntoma se fue y que no rompiste otra cosa.

---

## 3. El árbol de diagnóstico: 7 preguntas en orden

Cuando algo no rutea, hay exactamente 7 lugares donde puede estar el problema. Recorrelos EN ORDEN, sin saltearte:

```text
PREGUNTA                                COMANDO / PRUEBA
─────────────────────────────────────────────────────────────────────
1. ¿Está la interfaz prendida y con IP?  show ip interface brief
2. ¿Tiene el enlace "up/up" y no errores? show interfaces
3. ¿Tengo la ruta?                       show ip route <destino>
4. ¿La ruta es la CORRECTA?              show ip route (AD/métrica, next-hop)
5. ¿El next-hop es alcanzable?           ping <next-hop> ; show ip arp
6. ¿El vecino/protocolo está sano?       show ip protocols / show ip ospf neighbor
7. ¿Hay filtros/política interviniendo?  show ip access-lists / route-map / PBR
```

Este bloque es el árbol de decisión, escrito como una tabla de dos columnas: a la izquierda las siete preguntas en orden, a la derecha el comando que las responde. La línea de guiones separa el encabezado de las preguntas. Se lee de arriba hacia abajo y **cada fila supone que la anterior ya dio "sí"**: si la 1 falla, no tiene sentido preguntar la 5.

Qué significa cada pregunta, y qué te está diciendo el comando:

1. **¿Está la interfaz prendida y con IP?** `show ip interface brief` lista todas las interfaces con su dirección y su estado en dos columnas cortas. Una interfaz puede estar apagada por configuración (**administratively down**, alguien le puso `shutdown`) o puede estar prendida pero sin dirección. Si no hay interfaz con IP, todo lo demás es teórico.
2. **¿Tiene el enlace "up/up" y no errores?** `show interfaces` da el detalle largo de cada interfaz. **up/up** significa dos cosas: la interfaz está habilitada (primer *up*) y el cable del otro lado está vivo (segundo *up*). Un `up/down` es el caso clásico del cable cortado o del puerto del otro equipo apagado. Ahí también se ven los contadores de errores: CRC, colisiones, paquetes perdidos.
3. **¿Tengo la ruta?** `show ip route <destino>` pregunta por un destino concreto y no por la tabla entera. Si el router no tiene ninguna ruta que cubra ese destino, responde que la red no está en la tabla.
4. **¿La ruta es la CORRECTA?** Tener ruta no es tener la ruta buena. Acá se miran la **AD** (*Administrative Distance*, "distancia administrativa": cuánto confía el router en la fuente que le contó esa ruta) y la **métrica** (el costo del camino según el protocolo). Si la ruta que gana es la que no esperabas, el paquete sale por donde no debe.
5. **¿El next-hop es alcanzable?** De nada sirve una ruta que apunta a un equipo inalcanzable. Se prueba con `ping` al next-hop y se mira la tabla **ARP** (*Address Resolution Protocol*: la tabla que traduce una IP a la dirección física de la placa, la **MAC**, *Media Access Control*). Si el next-hop no responde, la ruta existe pero es un caminito al vacío.
6. **¿El vecino/protocolo está sano?** `show ip protocols` dice qué protocolos de routing corren y con qué parámetros; `show ip ospf neighbor` muestra si el router vecino está sincronizado. Un protocolo puede estar configurado y no tener ningún vecino: eso es una pista enorme.
7. **¿Hay filtros/política interviniendo?** Las **ACL** (*Access Control List*, "lista de control de acceso") son reglas de permitir o bloquear tráfico. Un **route-map** es una regla que modifica o filtra rutas, y **PBR** (*Policy Based Routing*) es routing por política: decidir el camino por algo distinto del destino. Cualquiera de los tres puede hacer que todo esté bien y el paquete igual no pase.

Regla de oro del árbol:

> **NUNCA saltees del 1 al 6.** El error más común de todos los tiempos: sospechar del protocolo (¿estará caída la sesión OSPF?) cuando el problema era la interfaz apagada o una IP mal puesta. El enlace y la IP son la base: sin "up/up" y sin dirección, NO HAY protocolo que funcione.

Para que lo veas como lo verías en la vida real, el árbol completo con los desvíos:

```text
¿HAY LINK?          → ¿la interfaz dice up/up?          no → cable, puerto, shutdown
¿HAY DIRECCIÓN?     → ¿tiene IP y máscara?              no → ip address / DHCP
¿HAY RUTA?          → ¿show ip route la muestra?        no → falta ruta (estática o protocolo)
¿ES LA RUTA BUENA?  → ¿AD y métrica esperadas?          no → selección de rutas
¿LLEGA AL NEXT-HOP? → ¿el ping al vecino responde?      no → enlace o ARP
¿PROTOCOLO SANO?    → ¿vecinos FULL / ESTABLISHED?      no → timers, ASN, MTU
¿HAY FILTRO?        → ¿ACL, route-map o PBR?            sí → la política es la causa
```

Este segundo bloque es el mismo árbol, pero dibujado como recorrido: cada línea es un control y cada flecha `no →` es el desvío cuando el control falla. La columna de la izquierda es la pregunta, el medio es cómo se responde y la derecha es a dónde ir si la respuesta es "no". Se lee bajando: la primera línea que conteste "no" es la que te dice en qué capa está el problema, y las de abajo ya no importan hasta arreglarla.

Fijate en la lógica: el árbol no busca la causa, busca **la primera capa que falla**. Esa es toda la diferencia entre perder una tarde y resolver en diez minutos. Y fijate también que las siete preguntas cubren el recorrido completo del auto: la luz del puerto (link), la identidad (dirección), el camino (ruta), el prójimo que recibe el paquete (next-hop), el acuerdo entre vecinos (protocolo) y la barrera de entrada (filtros).

**La pregunta número 0 (la más importante de todas): ¿qué cambió?**
Si alguien tocó una config hace 40 minutos y el problema empezó hace 40 minutos... ahí está. El changelog mental (o el `show run` comparado con el backup) gana más troubleshooting que cualquier comando avanzado.

La pregunta 0 va antes de la 1 y no necesita ningún comando: se pregunta a las personas. "¿Qué tocaron?", "¿qué se actualizó?", "¿se cayó la luz?", "¿cambió algo en el proveedor?". La mayoría de los incidentes tienen dueño humano y hora de nacimiento. Cuando el problema apareció a las 10:40 y el cambio se hizo a las 10:35, la causa está en ese cambio, y todo el árbol sirve solo para confirmarlo.

### Resumen

- Hay siete lugares donde puede estar un problema de routing, y se recorren en orden: interfaz, enlace, ruta, ruta correcta, next-hop, protocolo, filtros.
- Cada pregunta supone que la anterior respondió "sí"; saltearse las primeras es el error más común.
- El árbol busca la primera capa que falla, no la causa: eso es lo que ahorra horas.
- La pregunta 0 es "¿qué cambió?" y se hace antes de cualquier comando.
- La mayoría de los incidentes tienen dueño humano y hora de nacimiento.

---

## 4. Los comandos show que resuelven TODO

### 4.1. La tríada base (para cualquier sospecha)

```text
show ip interface brief   ← ¿interfaces activas? ¿IPs? (¿algo está "administratively down"?)
show ip route             ← ¿existe la ruta? ¿por qué protocolo? ¿con qué métrica?
show running-config       ← ¿qué está configurado REALMENTE? (el que "se ve" en memoria)
```

Estos tres comandos son la tríada base: los primeros que corrés en cualquier router, sin importar el síntoma. La flecha y el texto que sigue a cada uno indican **qué estás buscando** en esa salida. No son tres comandos para escribir de memoria: son tres preguntas.

- **`show ip interface brief`** es la foto de las patas del router. Muestra, por interfaz, la dirección IP, si está habilitada y si el cable está vivo. Lo que un principiante tiene que mirar es la columna de estado: `up` y `up` es sano; `administratively down` es "alguien la apagó con `shutdown`"; `down` en la segunda columna es "el cable o el otro extremo no están".
- **`show ip route`** es la tabla de rutas completa. Muestra cada red conocida, por qué protocolo llegó, con qué AD y métrica, y por qué interfaz sale. Es la respuesta a "¿el router sabe llegar?". Si la tabla tiene pocas líneas o le falta la red sospechosa, ya tenés una pista fuerte.
- **`show running-config`** es la configuración que el router está usando en este momento, en memoria. Es distinto del archivo guardado: un router puede estar corriendo algo que no se guardó (y se pierde al reiniciar), o tener guardado algo que no está corriendo. Cuando alguien dice "yo lo configuré", este es el comando que dice si es verdad.

El orden importa: primero interfaces (¿existen las patas?), después rutas (¿sabe caminar?), después configuración (¿qué le pidieron que haga?). Es el mismo orden del árbol del capítulo 3, con tres comandos en lugar de siete.

### 4.2. La lectura experta de `show ip route` (la selección de rutas aplicada)

```text
R1# show ip route 10.1.1.0
Routing entry for 10.1.1.0/24
  Known via "ospf 1", distance 110, metric 20   ← AD y métrica: ¿es la ruta que esperabas?
  Last update from 10.0.0.2 on GigabitEthernet0/1
  * 10.0.0.2, from 10.0.0.2, via GigabitEthernet0/1  ← next-hop y salida
```

Este bloque es la salida de `show ip route` preguntando por un destino puntual, `10.1.1.0`. La primera línea confirma que el router tiene una entrada para esa red. Después vienen tres datos y una línea final con el next-hop. Las flechas señalan las dos cosas que se miran siempre: **quién contó la ruta con qué costo** (arriba) y **por dónde sale** (abajo).

- `Known via "ospf 1"` dice qué protocolo instaló la ruta y en qué proceso. `distance 110` es la **AD** de OSPF: el número con el que el router rankea la confiabilidad de la fuente. `metric 20` es el costo que calculó OSPF para ese camino.
- `Last update from 10.0.0.2 on GigabitEthernet0/1` dice de qué vecino vino el último anuncio y por qué interfaz entró.
- `*` marca la ruta **activa**: la que el router realmente usa. Una ruta sin asterisco está en la tabla pero no se usa, porque otra ganó.

La tabla que sigue traduce cada campo a lenguaje llano y agrega la columna que más sirve en un incidente: qué significa que ese campo se vea raro.

| Campo | Qué te dice | Si es raro |
|-------|------------|------------|
| `Known via` | Protocolo que la instaló | ¿EIGRP donde esperabas OSPF? Alguien redistribuyó |
| `distance` | AD (selección de rutas) | AD 200 iBGP para una ruta interna = sospechoso |
| `metric` | Costo/camino | ¿Metric 20 fija en vez de la suma? Ruta redistribuida E2 |
| `Last update` | De dónde vino el anuncio | ¿Un vecino que no esperabas? |
| `*` | Ruta activa (usable) | Sin `*` = ruta presente pero NO en uso |

La tabla tiene tres columnas: el **campo** tal como aparece en pantalla, **qué te dice** en una frase, y **si es raro**, o sea, la señal de alarma que justifica investigar. Se lee bajando por el campo que te llamó la atención, no de corrido.

Fila por fila, con el detalle que hace falta para no confundirse:

1. **`Known via`** es el origen de la ruta. Si esperabas OSPF y aparece EIGRP, no es un misterio: alguien configuró una **redistribución**, que es la operación de tomar rutas de un protocolo y meterlas en otro. La ruta existe, pero llegó por una puerta que no imaginabas.
2. **`distance`** es la AD, y es lo que decide quién gana cuando dos protocolos conocen la misma red. Los valores que hay que tener en la cabeza: conectada 0, estática 1, EIGRP 90, OSPF 110, RIP 120, eBGP 20, iBGP 200. La **iBGP** es la sesión BGP entre routers del mismo sistema autónomo; una ruta interna aprendida por iBGP con AD 200 es sospechosa porque pierde contra casi todo.
3. **`metric`** es el costo del camino según el protocolo. En OSPF es un costo que se suma salto por salto; si ves una métrica fija y baja en una ruta que debería ser larga, es una ruta **redistribuida** con el costo por defecto (lo que se llama E2). El paquete va a preferir un camino que en la realidad es peor.
4. **`Last update`** dice quién te contó la novedad por última vez. Si el vecino que aparece no es el que esperabas, o cambia todo el tiempo, ahí hay algo.
5. **`*`** es el campo más importante y el más ignorado. Sin asterisco, la ruta está en la tabla pero **no se usa**: existe otra mejor. Ver la ruta no alcanza; hay que ver si gana.

Y el caso que más vas a encontrar: la ruta **no existe**. Cuando el router no tiene ninguna entrada para ese destino, la respuesta es una sola línea que dice que la red no está en la tabla (`% Network not in table`). No es un error del comando: es el comando diciéndote que el router no sabe llegar. En el capítulo 6 vas a ver ese mensaje salvando un incidente completo en dos segundos.

### Resumen

- La tríada base es `show ip interface brief`, `show ip route` y `show running-config`, en ese orden.
- `show ip route` con un destino concreto responde si el router sabe llegar; sin la red en la tabla, el mensaje es `% Network not in table`.
- `Known via` dice quién instaló la ruta, `distance` es la AD y `metric` el costo: los tres explican el "por qué".
- El `*` dice si la ruta está en uso; sin asterisco, existe pero pierde.
- Una ruta redistribuida con métrica fija es la causa clásica de "va por el camino raro".

---

## 5. Troubleshooting por protocolo

Antes de las tablas, una advertencia que vale por todo el capítulo: **cuando un protocolo de routing "no anda", casi nunca es el protocolo**. Es una configuración que no coincide entre los dos extremos, una interfaz que no está como creés, o una capa de abajo que falló primero. Los protocolos hacen exactamente lo que les pediste, incluso cuando les pediste mal. Por eso este capítulo se usa **después** del árbol del capítulo 3, nunca antes.

Cada subcapítulo tiene la misma forma: los comandos de verificación del protocolo, una tabla de síntoma, causa y arreglo, y la explicación de qué mirar. Si venís de los manuales de OSPF, EIGRP y BGP, los comandos ya te suenan; lo nuevo es la lectura en modo diagnóstico.

### 5.1. OSPF (conceptos y avanzado)

**OSPF** son las siglas de *Open Shortest Path First*, "primero el camino más corto, y abierto". Es un protocolo de estado de enlace: cada router arma un mapa de la red y calcula el camino más corto. Sus tres comandos de salud son estos:

```text
show ip ospf neighbor     ← ¿el vecino está FULL/2WAY? (no FULL = problema)
show ip ospf interface    ← ¿área correcta? ¿cost? ¿está en el proceso?
show ip ospf database     ← ¿están llegando los LSA? (LSDB = la salud del área)
```

El bloque lista tres comandos y, con la flecha, la pregunta que responde cada uno. Los tres se corren seguidos: el primero dice si el vecino está sincronizado, el segundo si la interfaz está bien parametrizada, el tercero si la información del área está completa.

- **`show ip ospf neighbor`** muestra la lista de vecinos con su estado. `FULL` es el estado sano: los dos routers ya se contaron todo. `2WAY` puede ser normal en un segmento con un router que no es ni **DR** ni **BDR** (los dos routers designados que centralizan la conversación en una red compartida). Cualquier otro estado (`INIT`, `EXSTART`, `EXCHANGE`, `LOADING`) es un problema. Si la lista está vacía, no hay vecino: y sin vecino no hay rutas.
- **`show ip ospf interface`** muestra, por interfaz, el área, el costo, los timers y si la interfaz está dentro del proceso. Un `cost` distinto al esperado desvía el tráfico; un área distinta impide la vecindad.
- **`show ip ospf database`** muestra la **LSDB** (*Link State Database*, la base de datos del estado de los enlaces), que se llena con **LSA** (*Link State Advertisement*: los anuncios con los que cada router cuenta su parte del mapa). Si la base está vacía o le faltan anuncios, el problema no es de rutas: es de vecindad.

| Síntoma | Causa clásica | Fix |
|---------|---------------|-----|
| Vecino en EXSTART/EXCHANGE | MTU distinto entre vecinos | Igualar MTU (o eliminar el mismatch) |
| Vecino pegado en estado "DOWN/ATTEMPT" | Hello/Dead timers distintos, o área distinta | Verificar `ip ospf hello-interval` / `area` |
| Vecino que aparece y desaparece (flapping) | Interfaz inestable o red de broadcast con máscaras distintas | Revisar física + wildcard/máscara |
| Ruta con AD 110 pero "no se instala" | AD/métrica peor que la de otro protocolo (selección de rutas) | Verificar TODA la tabla, no solo OSPF |

La tabla tiene tres columnas: el **síntoma** que ves en pantalla, la **causa clásica** que lo explica, y el **fix**, el arreglo. Se usa al revés de como se lee: empezás por el síntoma que tenés, encontrás la fila y te llevás la causa con su solución.

- **EXSTART/EXCHANGE** es el estado en el que los dos routers están negociando el intercambio de la base de datos y no se ponen de acuerdo. La causa número uno es el **MTU** (*Maximum Transmission Unit*: el tamaño máximo de paquete que una interfaz acepta). Si un lado tiene 1500 y el otro 1400, el saludo grande nunca pasa y la sesión se queda trabada ahí. El fix es igualar el MTU; no es un problema de OSPF, es de la interfaz.
- **DOWN/ATTEMPT** es "no te escucho". Los **timers** son los cronómetros del saludo: `hello-interval` es cada cuánto saluda y `dead-interval` cuánto espera antes de declarar muerto al vecino. Si los dos extremos no coinciden, uno saluda y el otro ya lo declaró muerto. El área distinta produce el mismo efecto: se hablan, pero no se reconocen como del mismo grupo.
- **Flapping** es el vecino que sube y baja todo el tiempo. Casi siempre es física inestable (cable, puerto, fuente) o una red compartida donde las máscaras no coinciden y los routers ven rangos distintos. Acá la pista está en el `show interfaces`: contadores de errores que suben.
- **Ruta con AD 110 que no se instala** es el caso más elegante de la lista: OSPF hizo todo bien y la ruta perdió por selección de rutas contra otro protocolo con mejor AD. Mirar solo OSPF no lo explica; hay que mirar la tabla completa.

### 5.2. EIGRP

**EIGRP** son las siglas de *Enhanced Interior Gateway Routing Protocol*, "protocolo mejorado de enrutamiento entre pasarelas interiores". Es el protocolo propietario de Cisco: aprende por rumores de sus vecinos y guarda un plan B calculado de antemano. Sus tres comandos de salud:

```text
show ip eigrp neighbors         ← ¿el vecino existe? (tabla de vecinos = tabla de salud)
show ip eigrp topology          ← ¿hay sucesor? ¿feasible successor? ¿rutas en "passive"?
show ip eigrp interfaces        ← ¿qué interfaces están DENTRO del proceso?
```

El bloque sigue la misma forma que el de OSPF: el comando y, a la derecha, la pregunta que contesta. La diferencia es qué considera "sano" cada protocolo.

- **`show ip eigrp neighbors`** lista los vecinos con su dirección, su interfaz, el **Hold** (el cronómetro que cuenta cuánto falta para declararlo muerto) y el **Uptime** (hace cuánto está arriba). Sin filas no hay vecindad, y sin vecindad no hay rutas: es el equivalente al `show ip ospf neighbor`.
- **`show ip eigrp topology`** muestra la tabla de topología, donde EIGRP guarda los caminos con sus dos etiquetas: el **sucesor** (el camino que usa) y el **feasible successor** (el plan B ya validado, sin bucles). También avisa si alguna ruta quedó en estado **Active**, que en EIGRP no significa "activa" sino "esperando respuestas de los vecinos".
- **`show ip eigrp interfaces`** responde una pregunta que casi nadie se hace: qué interfaces están realmente dentro del proceso. Una interfaz puede tener IP y estar `up/up` y no participar de EIGRP, y entonces la red de esa interfaz no se anuncia.

| Síntoma | Causa clásica | Fix |
|---------|---------------|-----|
| Sin vecinos | K-values distintos, o `passive-interface` mal puesta, o ASN distinto | Comparar `router eigrp N` y K-values en `show ip protocols` |
| Ruta en estado "Active" que no converge | Cambio de topología; DUAL esperando respuestas | Esperar (o revisar vecinos para saber quién no responde) |
| Ruta EIGRP v6 sin instalar | ¡El AF quedó en `shutdown`! (la trampa de EIGRPv6) | `address-family ipv6 → no shutdown` |
| AD 90 cuando esperabas 110 | Redistribución de OSPF a EIGRP (tema de redistribución) | Rastrear el redistribute con `show ip protocols` |

Misma estructura de tres columnas: síntoma, causa, fix. Lo importante es entender por qué la columna del medio tiene tres o cuatro candidatos por fila.

- **Sin vecinos** es el síntoma mudo: no hay error, no hay log, simplemente la lista está vacía. Las causas son tres y todas son "configuración que no coincide". Los **K-values** son los pesos con los que EIGRP calcula la métrica: si un router usa unos y el otro otros, no se aceptan como vecinos. `passive-interface` es una orden que deja la interfaz fuera de las conversaciones de routing (útil en la interfaz que va a los usuarios, letal en la que va a otro router). El **ASN** es el número de sistema autónomo, el identificador del dominio: dos routers con ASN distinto pertenecen a dominios distintos y no se hablan.
- **Ruta en estado "Active" que no converge** es la única fila donde la respuesta puede ser "esperar". **DUAL** es el algoritmo de EIGRP, y cuando pierde un camino pregunta a los vecinos; si un vecino no contesta, la ruta se queda en ese estado. Antes de esperar, revisá quién no responde.
- **Ruta EIGRP v6 sin instalar** es la trampa más famosa del protocolo: la **AF** (*address family*, la familia de direcciones: IPv4 o IPv6) arranca apagada. Todo está configurado y no funciona porque falta `no shutdown` adentro de la familia.
- **AD 90 cuando esperabas 110** es la huella digital de una redistribución: alguien metió las rutas de OSPF dentro de EIGRP, y ahora las rutas internas tienen la AD de EIGRP. El `show ip protocols` muestra qué protocolo redistribuye a cuál.

### 5.3. BGP

**BGP** son las siglas de *Border Gateway Protocol*, "protocolo de pasarela de borde". Es el protocolo que conecta sistemas autónomos entre sí: el que hace funcionar internet. Es distinto de los otros dos en una cosa fundamental: no busca el camino más corto, aplica **políticas**. Sus tres comandos de salud:

```text
show ip bgp summary       ← ¿ESTABLISHED? ¿cuántos prefijos recibí? (2 columnas = TODO)
show ip bgp neighbors X   ← ¿timer? ¿últimos errores? ¿capabilities?
show ip bgp <prefijo>     ← ¿los atributos son los esperados? (LocalPref, AS-Path, MED)
```

El bloque tiene tres comandos y, a la derecha, la pregunta. La nota entre paréntesis del primero —"2 columnas = TODO"— es la clave de lectura de todo el subcapítulo: hay dos columnas de esa salida que, juntas, dicen si la sesión está sana y si está sirviendo.

- **`show ip bgp summary`** lista los vecinos BGP. La columna **State/PfxRcd** muestra dos cosas en una: si dice `Established`, la sesión está arriba; si dice un número, la sesión está arriba y ese número son los **prefijos** (bloques de red) que el vecino te anunció. `Active` o `Idle` en esa columna significan que la sesión no está.
- **`show ip bgp neighbors X`** es el detalle de un vecino: temporizadores, últimos errores, capacidades negociadas. Es el comando al que se va cuando la sesión no sube.
- **`show ip bgp <prefijo>`** muestra los atributos con los que llegó una ruta: **LocalPref** (preferencia local, cuánto te gusta ese camino), **AS-Path** (la lista de sistemas autónomos por los que pasó el anuncio) y **MED** (*Multi-Exit Discriminator*: la sugerencia de por dónde entrar a tu red). Los atributos son la política: si están mal, el tráfico va por donde no querés.

| Síntoma | Causa clásica | Fix |
|---------|---------------|-----|
| Vecino en "Active" eterno | TCP 179 bloqueado, o ASN mal, o IP de sesión inalcanzable | `show ip bgp neighbors` + ping al peer + revisar ACL/firewall |
| ESTABLISHED con **0 prefijos** | `network ... mask` de un prefijo que NO está en la tabla (la regla de BGP) | Verificar que el prefijo exista en `show ip route` |
| iBGP sin rutas | Falta full mesh o `next-hop-self` (regla de BGP) | Configurar el next-hop-self en los bordes |
| AS-Path raro en rutas recibidas | Redistribución masiva o filtros mal puestos (tema de redistribución) | Revisar route-maps `in`/`out` del vecino |

Tres columnas otra vez: síntoma, causa, fix. Las dos primeras filas son las que hay que saber de memoria, porque explican casi todos los incidentes de BGP.

- **"Active" eterno** es el estado de un vecino BGP que está intentando conectar y no puede. BGP usa **TCP** (*Transmission Control Protocol*, el transporte confiable de internet) en el puerto **179**. Si una ACL o un firewall bloquea ese puerto, la sesión queda en `Active` para siempre. Otras dos causas: el **ASN** mal configurado (el `remote-as` no coincide con el del vecino) o la IP de la sesión inalcanzable. El diagnóstico es en capas: primero ping al peer, después el puerto, después el ASN.
- **ESTABLISHED con 0 prefijos** es el caso más instructivo de BGP: la sesión está perfecta y no pasa nada. La razón es una regla del protocolo: BGP solo anuncia un prefijo que ya está en la tabla de rutas. Si el `network ... mask` apunta a un prefijo que no existe en `show ip route`, no hay nada que anunciar. La sesión está sana, el dato no está.
- **iBGP sin rutas** es un problema de diseño, no de configuración. La **iBGP** es la sesión entre routers del mismo sistema autónomo, y tiene dos reglas duras: todos los routers tienen que estar conectados entre sí (full mesh) o usar reflectores, y el next-hop que se anuncia no se reescribe. `next-hop-self` es la orden que corrige eso en los routers de borde.
- **AS-Path raro** es el síntoma de la política mal puesta: un `route-map` que filtra de más, o una redistribución masiva que mete ruido en el anuncio. Los route-maps tienen dirección: `in` filtra lo que entra y `out` lo que sale.

### Resumen

- Cuando un protocolo falla, casi nunca es el protocolo: es configuración que no coincide o una capa de abajo rota.
- En OSPF se miran vecinos (`FULL`), interfaz (área, costo) y base de datos (LSA).
- En EIGRP se miran vecinos, topología (sucesor y plan B) e interfaces dentro del proceso.
- En BGP se miran dos columnas: sesión `Established` y cantidad de prefijos; cero prefijos es una falla silenciosa.
- Las tablas síntoma → causa → fix se consultan desde el síntoma, no de corrido.

---

## 6. El caso real resuelto: de "no hay internet" a la causa raíz

### 6.1. El reporte

> "Desde las 10:40, nadie en la oficina puede navegar. La red interna anda: los archivos compartidos abren, el ping al servidor de archivos funciona. Solo falla lo que sale a Internet."

Leé el reporte dos veces: es un ejemplo perfecto de cómo un usuario, sin saberlo, ya hizo la mitad del diagnóstico. "La red interna anda" acota el problema a la **frontera**, el punto por donde la red de la oficina se conecta con el **ISP** (*Internet Service Provider*, el proveedor de internet). "Solo falla lo que sale" descarta la física interna, el direccionamiento interno y hasta el servidor de archivos.

### 6.2. Aplicando la metodología (miralo conmigo paso a paso)

Primero los tres primeros pasos, que son de razonamiento y no de comandos:

```text
PASO 1 — Acotar: 
   "lo interno anda" → el problema está en la FRONTERA (o en la ruta por defecto, o en BGP).
   ¿Qué cambió a las 10:40? → "Se tocó la config del router de borde esta mañana".

PASO 2 — Capa: los usuarios internos funcionan entre sí → enlace e IP internos OK.
   Subo a la capa de red y a la frontera.

PASO 3 — Hipótesis (en orden):
   H1: Se cayó la ruta por defecto (más probable: tocaron el borde).
   H2: La sesión BGP con el ISP se cayó.
   H3: Algún filtro/ACL nuevo corta la salida.

```

Este bloque es el razonamiento previo a tocar el router: acotar, ubicar la capa y ordenar las sospechas. La palabra **borde** se usa para el router de la frontera; **ruta por defecto** es la ruta comodín, la que se usa cuando no hay una más específica, y es la que hace que "todo lo que no es de casa" salga a internet.

- El **paso 1** usa la pista del usuario y la pregunta 0. Las dos apuntan al mismo lugar: la frontera, y un cambio de esa mañana. Eso ya vale media investigación.
- El **paso 2** descarta capas: si la red interna funciona, la física y las direcciones internas están bien. Queda la capa de red (routing) y la frontera.
- El **paso 3** ordena por probabilidad y, sobre todo, por costo de verificación. H1 se prueba con un comando; H2 requiere mirar sesiones y logs. Se empieza por lo barato. Fijate también en la forma de cada hipótesis: es una frase que se puede confirmar o descartar, no una corazonada.

Ahora sí, la verificación y el fix:

```text
PASO 4 — Verificación en orden:

R-borde# show ip route 0.0.0.0
% Network not in table                    ← ¡H1 CONFIRMADA! No hay default route.
                  (la hipótesis 2 queda para revisar DESPUÉS: sin default,
                   no importa si BGP está bien)

[investigación de causa raíz — no arreglar el síntoma:]
R-borde# show run | section router bgp
router bgp 65001
 neighbor 198.51.100.2 remote-as 65002
R-borde# show run | include default
                                 ← nada. ¿Dónde está la default route?

[`show run` completo al borde muestra:]
ip route 0.0.0.0 0.0.0.0 198.51.100.1
            └── ¡el next-hop de la estática apunta a una IP que ya no existe!
                El cambio de esta mañana: se reemplazó el router del ISP
                y con él su direccionamiento. La estática quedó apuntando al vacío.

PASO 5 — Fix y verificación:
R-borde(config)# ip route 0.0.0.0 0.0.0.0 203.0.113.1   ← el nuevo peer del ISP
R-borde# show ip route 0.0.0.0
S*   0.0.0.0/0 [1/0] via 203.0.113.1      ← default OK
R-borde# ping 8.8.8.8                     ← y el usuario ya navega.
```

Este bloque es la parte de comandos del caso, y está partido con corchetes: los corchetes son comentarios del que escribe, no salida del router. Se lee como una conversación con el equipo, donde cada comando es una pregunta y cada respuesta achica el problema.

- **`show ip route 0.0.0.0`** pregunta por la ruta por defecto. La respuesta `% Network not in table` no es un error: es el router diciendo "no sé llegar a ningún lado que no sea mi red". H1 confirmada, en una línea, sin tocar nada. Y hay una decisión de método importante: H2 (la sesión BGP) **no se revisa todavía**, porque sin ruta por defecto la sesión puede estar perfecta y el usuario igual no navega.
- **`show run | section router bgp`** muestra solo el bloque de BGP de la configuración. La orden `| section` es un filtro: te ahorra leer cien líneas buscando tres. Ahí se ve el ASN local (`65001`) y el vecino (`remote-as 65002`).
- **`show run | include default`** busca la palabra "default" en toda la configuración y no encuentra nada. Es una pista negativa: si la default no está en la configuración, ¿cómo llegaba antes? La respuesta aparece al mirar el `show run` completo: la default **no** está escrita como `default`, está escrita como `ip route 0.0.0.0 0.0.0.0 198.51.100.1`.
- **`ip route 0.0.0.0 0.0.0.0 198.51.100.1`** es una **ruta estática**: una ruta escrita a mano. Los dos `0.0.0.0` significan "cualquier destino" (red y máscara), y `198.51.100.1` es el next-hop. La anotación del bloque es la causa raíz: ese next-hop ya no existe, porque el router del ISP que se cambió esa mañana trajo otro direccionamiento.
- **El fix** cambia el next-hop por el nuevo peer (`203.0.113.1`). No borra la ruta: corrige el dato que quedó viejo.
- **`S*   0.0.0.0/0 [1/0] via 203.0.113.1`** es la verificación: la `S` dice que la ruta es estática, el `*` que está activa, `0.0.0.0/0` que es la ruta por defecto, `[1/0]` que tiene AD 1 y métrica 0, y `via` el next-hop nuevo.
- **`ping 8.8.8.8`** es la prueba final desde el punto de vista del usuario: si el ping llega, el paquete sale y vuelve.

> **Las dos lecciones del caso:** (1) el `show ip route` a la red sospechosa respondió ANTES de tocar nada — la hipótesis más barata primero; (2) el fix NO fue "recrear la estática a ciegas": fue encontrar POR QUÉ quedó apuntando a una IP muerta (el cambio de esta mañana). Si hubieras recreado la estática con la misma IP vieja, el problema volvía a los 5 minutos. **Causa raíz, no parche.**

**Causa raíz** es el motivo original del fallo, no el síntoma. El parche es tapar el síntoma: el usuario navega y el problema vuelve mañana. La causa raíz es entender por qué la ruta quedó apuntando a una IP que ya no existe y arreglar eso: en este caso, actualizar el next-hop al direccionamiento nuevo. La prueba de que arreglaste la causa raíz es simple: podés explicar por qué se rompió, cuándo, y por qué no va a volver a pasar solo.

Y una lección de método que se repite en todos los incidentes: **el comando más barato va primero**. `show ip route 0.0.0.0` cuesta un segundo y descartó la hipótesis más probable. Si hubieras empezado por los logs de BGP, habrías encontrado una sesión sana y una tarde perdida.

### Resumen

- El reporte del usuario ya acota el problema: si lo interno anda, la falla está en la frontera.
- La pregunta 0 ("¿qué cambió?") apuntó al router de borde y resultó ser la causa raíz.
- `show ip route 0.0.0.0` respondió `% Network not in table` y confirmó la hipótesis en un comando.
- La causa no era la sesión BGP sino una estática con un next-hop que dejó de existir.
- Arreglar la causa raíz evita que el problema vuelva; tapar el síntoma lo posterga.

---

## 7. Los 10 síntomas clásicos y su causa

Esta es la tabla que vas a querer tener abierta cuando suene el teléfono:

```text
SÍNTOMA                                      CAUSA MÁS PROBABLE (en orden)
────────────────────────────────────────────────────────────────────────
1.  "No tengo internet"                       Ruta por defecto ausente/rota (caso 6)
2.  "Una sola red no responde"                Falta ruta específica o enlace caído
3.  "Va por caminos raros"                    AD/métrica con ruta rival (selección de rutas)
4.  "La VPN no sube"                          TCP/UDP de la VPN bloqueado (o ruta de retorno)
5.  "OSPF no levanta"                         Timers/área/MTU distinto (sección 5.1)
6.  "EIGRP sin vecinos"                       K-values/passive-interface/ASN (sección 5.2)
7.  "BGP Active eterno"                       TCP 179/ASN/IP de sesión (sección 5.3)
8.  "Rutas que van y vienen"                  Feedback loop de redistribución (tema de redistribución)
9.  "Funciona RARO": lentísimo pero ping ok   Métrica E2 fija, o enlace saturándose (o MTU)
10. "Andaba y se rompió solo"                  Alguien tocó algo — encontrá QUIÉN (pregunta 0)
```

El bloque es una tabla de dos columnas: a la izquierda el **síntoma** tal como lo dice el usuario (entre comillas, porque es su frase, no un término técnico), a la derecha la **causa más probable**. Los paréntesis remiten al capítulo donde está el detalle. Se lee buscando tu síntoma en la columna izquierda; nunca de arriba hacia abajo.

Ahora la parte que falta en la tabla, y que es la que te convierte en alguien que diagnostica en vez de alguien que adivina: **el comando que confirma o descarta cada causa, y qué se ve cuando está sano y cuando está roto**.

| Síntoma | Comando que confirma o descarta | Sano | Roto |
|---------|--------------------------------|------|------|
| 1. No hay internet | `show ip route 0.0.0.0` | `S* 0.0.0.0/0 [1/0] via …` | `% Network not in table` |
| 2. Una sola red no responde | `show ip route <red>` | `Routing entry for …` | `% Network not in table` |
| 3. Va por caminos raros | `show ip route <destino>` | la ruta esperada, con su AD y métrica | `Known via` de otro protocolo o métrica rara |
| 4. La VPN no sube | `ping <IP del peer de VPN>` | respuestas seguidas (`!!!!!`) | `.....` (timeout) o `UUUUU` |
| 5. OSPF no levanta | `show ip ospf neighbor` | `FULL/DR` o `FULL/BDR` | lista vacía, `INIT`, `EXSTART` |
| 6. EIGRP sin vecinos | `show ip eigrp neighbors` | una fila por vecino, con `Uptime` | tabla vacía |
| 7. BGP Active eterno | `show ip bgp summary` | `Established` o un número de prefijos | `Active` o `Idle` |
| 8. Rutas que van y vienen | `show ip route <prefijo>` dos veces | la misma ruta con `*` las dos veces | la ruta cambia de `Known via` o desaparece |
| 9. Funciona raro | `show ip route <destino>` + `ping` largo | 0 % de pérdida y la salida esperada | pérdida intermitente o salida por otro enlace |
| 10. Andaba y se rompió solo | `show running-config` contra el backup | no hay diferencias | una sección distinta en el equipo tocado |

Esta segunda tabla es la traducción operativa de la primera: cuatro columnas que van del síntoma al comando, y del comando a las dos salidas posibles. La columna **Sano** es lo que tenés que ver para seguir buscando en otro lado; la columna **Roto** es la evidencia que confirma la causa. Si la salida no coincide con ninguna de las dos, no descartes la causa: anotá lo que viste y pasá a la siguiente hipótesis.

Fila por fila, lo que hay que entender:

1. **"No tengo internet"** es el síntoma rey y tiene una sola causa dominante: falta la ruta por defecto. Se confirma con un comando, en un segundo. Si la default está, el problema está más arriba: DNS, NAT o el ISP.
2. **"Una sola red no responde"** es el síntoma de la ruta específica. Alguien cambió una subred, o el enlace hacia ella se cayó, o la ruta nunca se anunció.
3. **"Va por caminos raros"** no se queja nadie hasta que se mide: el usuario nota que "anda lento" o que el tráfico sale por el proveedor caro. Se diagnostica leyendo qué protocolo ganó y con qué métrica.
4. **"La VPN no sube"** casi siempre es un filtro en el camino o una **ruta de retorno** faltante: el paquete va y la respuesta no sabe volver. La **VPN** (*Virtual Private Network*) es el túnel cifrado que conecta dos puntos por internet, y cuando el túnel no sube, el primer ping al extremo separa el problema de red del problema de configuración del túnel.
5. **"OSPF no levanta"** se confirma en la lista de vecinos: si está vacía o hay estados intermedios, el problema es de vecindad, no de rutas.
6. **"EIGRP sin vecinos"** es la versión EIGRP del anterior, con sus tres causas de configuración: K-values, `passive-interface` y ASN.
7. **"BGP Active eterno"** es el estado que más confunde, porque `Active` suena a "activo" y significa todo lo contrario: intentando conectar y sin lograrlo.
8. **"Rutas que van y vienen"** es el síntoma del bucle de redistribución: un protocolo se come las rutas del otro, las devuelve, y la red oscila. Se detecta mirando el mismo prefijo dos veces seguidas: si cambió de `Known via`, ahí está.
9. **"Funciona raro"** es el síntoma más caro, porque nada está caído. La pista está en la métrica de la ruta (una E2 fija puede estar eligiendo un camino peor) o en el enlace saturado. El ping largo y el traceroute separan latencia de pérdida.
10. **"Andaba y se rompió solo"** es el único síntoma donde el comando no sirve primero: sirve la pregunta 0. Nada se rompe solo; algo cambió. El `show run` comparado con el backup encuentra ese algo.

Un detalle de higiene que vale para las diez filas: **anotá lo que ves**. La salida de un comando que hoy te parece obvia, mañana no lo es. Y en un incidente con varias personas, la única forma de no repetir pruebas es que alguien lleve la lista de lo descartado.

### Resumen

- Los diez síntomas clásicos se resuelven con un comando cada uno, y casi siempre ese comando es un `show`.
- La tabla de dos columnas sirve para ubicarse; la de cuatro, para confirmar con evidencia y distinguir sano de roto.
- "No hay internet" es casi siempre la ruta por defecto; "una sola red" es la ruta específica.
- "BGP Active" no significa activo: significa que la sesión no sube.
- "Se rompió solo" no existe: algo cambió, y la pregunta 0 encuentra el cambio.

---

## 8. Herramientas: ping, traceroute y la lectura de sus misterios

### 8.1. ping — la lectura fina de las respuestas

**ping** es la prueba más vieja de la red: manda un paquete chiquito llamado **echo request** (pedido de eco) y espera el **echo reply** (la respuesta). Los dos viajan en **ICMP** (*Internet Control Message Protocol*), el protocolo de mensajes de control de IP: no lleva datos de usuario, lleva avisos.

```text
Éxito RÁPIDO y estable  → ruta de ida y vuelta OK
Éxito LENTO             → latencia alta: ¿enlace saturado? ¿MQ? ¿recorrido largo? (traceroute)
!!!.!!!.!!!.            → paquetes que se PIERDEN intermitentemente (¿congestión? ¿duplex?)
.UUUUU                  → destino inalcanzable en la RUTA (ruteo de ida o vuelta)
U = destination unreachable — "alguien en el medio sabe que no hay camino"
```

Este bloque es una leyenda: a la izquierda el patrón de símbolos que devuelve el ping, a la derecha lo que significa. Se lee como el mapa de un electrocardiograma: cada símbolo es un latido y el patrón cuenta la historia.

- **`!`** es una respuesta recibida. Cinco `!` seguidas es un destino sano y alcanzable.
- **`.`** es un tiempo de espera agotado (**timeout**): el paquete salió y no volvió. Uno o dos puntos en medio de una prueba son normales; todos puntos es un destino que no responde.
- **`U`** es *destination unreachable*, "destino inalcanzable". No es que el paquete se perdió: es que **alguien en el camino avisó** que no hay ruta hacia ese destino. Es la diferencia más importante de toda la sección: `U` habla de ruteo, `.` habla de silencio.
- **`!H`** es la variante *host unreachable*: el router llegó a la red pero no encontró al equipo. Ese caso aparece en el traceroute del subcapítulo siguiente.
- **La latencia** es el tiempo de ida y vuelta, medido en milisegundos (ms). El ping resume tres números: mínimo, promedio y máximo. Un promedio estable es una red sana; un promedio con picos cuenta otra cosa (congestión, un enlace lento, un camino más largo).
- **El `duplex`** es la forma en que dos equipos usan el cable: si uno transmite y escucha a la vez (full) o si tiene que turnarse (half). Cuando los dos extremos no coinciden, aparecen pérdidas y colisiones: el síntoma es "anda lento y a veces se corta".

Ahora la lectura fina, que es lo que separa al que mira del que entiende:

- **Éxito rápido y estable** significa que hay camino de ida y de vuelta. Ojo: el ping prueba el camino **hasta el destino**, no el servicio. Que el ping funcione no significa que el servidor web esté arriba.
- **Éxito lento** significa que el camino funciona pero cuesta. Ahí entra el traceroute, para ver si el recorrido es largo o si hay un salto saturado. (El original de este manual escribe "¿MQ?" en esta línea; no es un término de redes: lo más probable es que haya querido decir MTU o cola de espera —*queue*—, y el sentido es "algo en el camino está frenando los paquetes".)
- **Pérdida intermitente** (`!!!.!!!.!!!.`) es la firma de la congestión o del duplex mal negociado. No es una falla limpia: es una falla que aparece y desaparece, y por eso el ping hay que correrlo varias veces y con más de cinco paquetes.
- **`U` persistente** es ruteo. Alguien sabe que no hay camino: revisá `show ip route` en el router del camino, empezando por el tuyo.
- **Timeout persistente** es silencio: o el destino no existe, o un filtro corta el ICMP, o el enlace se cayó. Un firewall que bloquea ICMP produce exactamente el mismo síntoma que un equipo apagado, y por eso el ping nunca se interpreta solo.

Una salida sana típica, en palabras: cinco paquetes enviados, cinco recibidos, cero por ciento de pérdida, y tres tiempos parecidos abajo. Una salida rota típica: cinco enviados, cero recibidos, cien por ciento de pérdida. El número de pérdida es el dato duro; los símbolos son el detalle de qué pasó con cada paquete.

### 8.2. traceroute — la escalera hacia el problema

Si el ping dice **si** hay camino, el **traceroute** dice **por dónde** va y **dónde** se corta. Funciona con un truco: manda paquetes con un **TTL** (*Time To Live*, "tiempo de vida") que arranca en 1 y sube de a uno. El TTL es un contador de saltos: cada router lo baja en uno y, cuando llega a cero, devuelve un aviso. Así, el primer paquete muere en el primer router, el segundo en el segundo, y la lista de avisos dibuja el camino.

```text
R1# traceroute 8.8.8.8
 1  10.0.0.2       1 ms    1 ms    1 ms     ← salto 1 OK
 2  203.0.113.1    2 ms    1 ms    2 ms     ← salto 2 OK
 3  * * *                                    ← salto 3: no responde (o lo ICMP-cortan)
 4  8.8.8.8        5 ms    4 ms    5 ms     ← ¡no! siguió viajando OK

▶ "¿Dónde se corta la escalera?": el salto donde * * * se vuelve permanente es
  LA FRONTERA del problema:
   - Si el propio destino sale con * * * pero es alcanzable → filtra ICMP (normal).
   - Si se corta en un salto intermedio y NO hay más saltos → el problema está ahí
     (o en el retorno de ese salto).
   - Si responde con "!H" (host unreachable) en el salto 3 → el ROUTER 3 dice
     "yo no sé llegar": problema de RUTEO en ese router... en el camino de IDA.
```

Este bloque tiene dos partes. Arriba, una salida de traceroute real con cuatro saltos: la columna del número es el salto, la dirección es el router que respondió, y los tres tiempos son las tres pruebas que manda el comando por cada salto. Abajo, la guía de lectura, que empieza con la flecha `▶`.

Cómo se lee, línea por línea:

- **Salto 1 y 2** responden con tiempos bajos: la escalera arranca bien. El salto 1 suele ser tu propio router y el 2 el del proveedor.
- **Salto 3 con `* * *`** es un router que no contesta. La tentación es gritar "¡acá se corta!", y el bloque justamente te frena: el salto 4 responde. Un `* * *` aislado en el medio es normal, porque muchos routers no contestan los avisos de ICMP (les bajan la prioridad o los filtran).
- **Salto 4, el destino, responde**: el camino está completo. La conclusión correcta es "el salto 3 no contesta, pero el tráfico pasa".
- **Si el destino también sale con `* * *`** pero el ping funciona, el destino filtra ICMP: es normal en servidores grandes y no es una falla.
- **Si la escalera se corta en un salto y no hay más** (todos `* * *` de ahí en adelante), ese salto es la frontera del problema. O el router no tiene ruta hacia adelante, o el camino de vuelta está roto.
- **`!H`** (*host unreachable*) es un aviso explícito de un router: "llegué a la red, pero ese equipo no está". Aparece cuando el equipo de destino está apagado o mal direccionado y el router de la última red no lo encuentra por **ARP**.

> **HACELO VOS (la lectura final):** `ping` te dice EL QUÉ (hay/no hay camino). `traceroute` te dice EL DÓNDE (en qué salto se corta). `show ip route` te dice EL POR QUÉ (qué regla manda el tráfico). Los tres juntos, en ese orden, convierten "no anda" en "el router X no tiene ruta de retorno hacia Y" — que ya es una causa, no un misterio.

Ese orden —qué, dónde, por qué— es el método del capítulo 2 aplicado a tres herramientas que existen desde los años ochenta. No hacen falta comandos más modernos para diagnosticar: hacen falta las tres preguntas en el orden correcto.

### Resumen

- ping manda un eco ICMP y su patrón de símbolos cuenta si hay camino: `!` responde, `.` no, `U` es inalcanzable.
- `U` habla de ruteo; el timeout habla de silencio o de un filtro. No son lo mismo.
- traceroute sube el TTL salto por salto y dibuja el camino hasta el destino.
- Un `* * *` aislado es normal; la escalera cortada sin más saltos marca la frontera del problema.
- ping dice qué, traceroute dice dónde, `show ip route` dice por qué.

---

## 9. Comprobá lo que aprendiste

Ocho preguntas. Tapá la respuesta, contestá en voz alta y recién después compará.

**1. ¿Cuál es el error número uno del troubleshooting?**

**Ver respuesta:** Tirar comandos al azar sin método. El profesional reduce el espacio de búsqueda: reproduce, acota, formula hipótesis y las verifica con evidencia — nunca toca configuración antes de tener una hipótesis con comando de confirmación.

**2. ¿Cuál es la pregunta número 0 y por qué gana casi siempre?**

**Ver respuesta:** "¿Qué cambió?" La mayoría de los incidentes empiezan cuando alguien tocó algo (config, IP, router nuevo). Encontrar el cambio = encontrar el problema; el `show run` comparado con el backup lo expone.

**3. Ordená los 7 lugares donde puede estar un problema de routing.**

**Ver respuesta:** 1) Interfaz prendida + IP → 2) Enlace up/up sin errores → 3) ¿Tengo la ruta? → 4) ¿Es la ruta correcta (AD/métrica)? → 5) ¿El next-hop es alcanzable? → 6) ¿El protocolo/vecino está sano? → 7) ¿Hay filtros/política? Nunca saltearse los primeros.

**4. En `show ip route`, ¿qué indica una ruta SIN el asterisco (`*`)?**

**Ver respuesta:** Que existe en la tabla pero NO está activa/en uso (otra ruta la está ganando por AD o métrica — tema de selección de rutas). Ver la ruta no alcanza: hay que ver cuál gana.

**5. BGP en "Active" eterno: ¿cuáles son las 3 causas más probables, en orden?**

**Ver respuesta:** 1) TCP 179 bloqueado por ACL/firewall; 2) ASN mal en `remote-as` (no coincide con el del vecino); 3) IP de la sesión inalcanzable. Verificación: `show ip bgp neighbors` + ping al peer + revisar filtros.

**6. En el caso real del manual, ¿por qué recrear la default route a la IP vieja era el parche equivocado?**

**Ver respuesta:** Porque la causa raíz era el cambio del router del ISP (direccionamiento nuevo). Recrear la estática a la IP vieja arreglaba el síntoma 5 minutos... hasta darse cuenta de que esa IP ya no existe. Causa raíz, no parche.

**7. ¿Qué significan en ping `U`, `!` y `*`?**

**Ver respuesta:** `!` = respuesta (reached/time); `U` = destination unreachable (alguien en la ruta sabe que no hay camino — problema de ruteo en el medio); `*` = timeout (sin respuesta: se perdió o lo cortan). `U` persistente = ruteo; `*` persistente = firewall/filtro o enlace caído.

**8. ¿Por qué primero `ping` y después `show ip route`?**

**Ver respuesta:** El `ping` te dice el QUÉ (¿hay camino o no?) en una prueba de caja negra; el `show ip route` te dice el POR QUÉ (qué regla rutea o no rutea al destino). Diagnóstico en capas: primero el hecho, después la causa.

Si contestaste bien la 1, la 2 y la 3, ya tenés el manual: el método, la pregunta que gana sola y el orden que evita buscar en el piso equivocado. Las demás son detalles de herramienta que se aprenden en el camino.

### Resumen

- Las preguntas cubren método, pregunta 0, el árbol de siete, la lectura de rutas y las herramientas.
- Las tres que resumen el manual son la 1 (método), la 2 (qué cambió) y la 3 (orden de capas).
- Las respuestas se razonan con los capítulos; no hace falta memorizarlas.
- Si dudás, volvé al capítulo del tema antes que repetir la respuesta de memoria.

---

## 10. Glosario

| Término | Qué es |
|---------|--------|
| **Troubleshooting** | Diagnóstico sistemático de fallas: reproducir, hipótesis, verificar con evidencia, arreglar y confirmar |
| **Causa raíz** | El motivo ORIGINAL del fallo (no el síntoma): arreglarla evita que reaparezca |
| **Síntoma** | Lo que el usuario percibe ("no hay internet") — el diagnóstico lo conecta con causa y efecto |
| **Show ip route** | La tabla de rutas: protocolo, AD, métrica, next-hop, activa (`*`) |
| **Show ip protocols** | Qué protocolos corren, con qué proceso, K-values/áreas y qué interfaces |
| **Pregunta 0** | "¿Qué cambió?" — la pregunta que gana la mayoría de los incidentes |
| **`U` / `!` / `*`** | Unreachable (ruteo) / respuesta / timeout (filtro o pérdida) |
| **Traceroute** | La escalera de saltos: localiza la frontera donde el camino se corta |
| **Paquete** | La porción de datos que viaja por la red, con dirección de origen y destino |
| **Router** | Equipo que decide por dónde sigue un paquete cuando salta de una red a otra |
| **Interfaz** | Cada conexión del router: el puerto con su cable y su dirección IP |
| **Next-hop** | El equipo al que se le entrega el paquete para que lo siga llevando |
| **Ruta por defecto** | La ruta comodín (`0.0.0.0/0`) que se usa cuando no hay una más específica |
| **AD** | Distancia administrativa: cuánto confía el router en la fuente de una ruta |
| **Métrica** | El costo de un camino según el protocolo; más chica, mejor |
| **ACL** | Lista de control de acceso: reglas de permitir o bloquear tráfico |
| **ICMP** | Protocolo de mensajes de control: los avisos que usan ping y traceroute |
| **Salto (hop)** | Cada router que un paquete atraviesa en el camino al destino |

Esta tabla es el diccionario del manual. Tiene dos columnas: el **término** en negrita y **qué es**, en una línea. Las primeras ocho filas son las del vocabulario de diagnóstico; las que siguen son las palabras de infraestructura que aparecen en todos los capítulos.

Cómo usarla: si en un capítulo te cruzás con una palabra que no recordás, buscala acá antes de volver atrás. Y si un término no lo podés explicar con tus palabras, volvé al capítulo donde se usa: el glosario es un atajo de repaso, no un reemplazo de la explicación.

Dos filas merecen una aclaración. **AD** y **métrica** se confunden todo el tiempo: la AD compara *fuentes* (¿le creo a OSPF o a la estática?) y la métrica compara *caminos dentro de la misma fuente* (¿cuál de los dos caminos que me da OSPF es mejor?). Una ruta puede tener mejor métrica y perder igual, porque la AD de su protocolo es peor. Y **ruta por defecto** no es "la ruta principal": es la última de la lista, la que se usa cuando ninguna otra coincide.

### Resumen

- El glosario es el diccionario del manual: término y definición en una línea.
- Los términos de método son troubleshooting, causa raíz, síntoma y pregunta 0.
- Los términos de herramienta son show ip route, show ip protocols, ping y traceroute.
- AD compara fuentes; métrica compara caminos. No son lo mismo.
- La ruta por defecto es la última de la lista, no "la principal".

---

## 11. Resumen en 10 puntos

1. **Método antes que comandos**: reproducir → acotar → capa → hipótesis → evidencia → fix → verificación.
2. **La pregunta 0 manda**: "¿qué cambió?" — 90% de los incidentes tienen dueño humano reciente.
3. **El árbol de 7 preguntas en orden**: interfaz → enlace → ruta existe → ruta correcta → next-hop → protocolo → filtros. Sin saltos.
4. **La tríada base**: `show ip interface brief`, `show ip route`, `show running-config`.
5. **`show ip route` se lee fino**: AD y métrica explican el POR QUÉ; el `*` dice si está en uso.
6. **OSPF**: vecinos FULL, timers/área/MTU, LSDB — la salud está en `show ip ospf neighbor`.
7. **EIGRP**: vecinos, sucesor/FS, K-values, passive-interface — y el AF en shutdown (v6).
8. **BGP**: ESTABLISHED con prefijos; "ESTABLISHED con 0" = `network` del prefijo que no está en la tabla.
9. **Las rutas que van y vienen** = feedback loop de redistribución (tema de redistribución), siempre.
10. **Causa raíz, no parche**: si el fix no explica por qué se rompió, el problema va a volver. El diagnóstico termina con evidencia, no con esperanza.

Leé esta lista como el índice al revés: cada punto condensa un capítulo. Si te llevás uno solo, llevate el 1: el método es lo único que sirve cuando el problema es distinto de todos los que estudiaste. Si te llevás dos, sumá el 3: el orden de las siete preguntas es el método convertido en rutina.

Y una idea final que no está en ningún comando: **el diagnóstico termina cuando podés explicar la causa, no cuando el usuario deja de quejarse**. Un síntoma tapado vuelve; una causa entendida no. La diferencia entre el que apaga incendios y el que arregla redes es esa frase.

### Resumen

- Los diez puntos condensan el manual entero: método, pregunta 0, árbol de siete y tríada base.
- `show ip route` se lee por AD, métrica y asterisco; ahí está el "por qué" del camino.
- Cada protocolo tiene su comando de salud: vecinos en OSPF y EIGRP, sesión y prefijos en BGP.
- Causa raíz, no parche: si el fix no explica por qué se rompió, el problema vuelve.
- El diagnóstico termina con evidencia en la mano, no cuando el usuario deja de quejarse.

---

> **Fuente:** Documentación propia basada en CCNA 200-301 Official Cert Guide (W. Odom), Cisco IOS Troubleshooting Guide, RFC 792 (ICMP), RFC 2151 (ping/traceroute utilities) y material educativo de redes.

# 36. Enrutamiento Dinámico: Vector de Distancia y Estado de Enlace

**Cómo los routers aprenden solos, sin que nadie les escriba cada ruta a mano**

Este manual arranca de cero, así que vamos a definir las palabras a medida que aparecen. Igual, cinco van a sonar desde la primera página y conviene tenerlas claras antes de seguir:

- Un **router** (en español, encaminador) es un equipo con varias patas, cada una conectada a una red distinta, cuyo trabajo es pasar paquetes de una red a otra. Cada pata es una **interfaz**: el conector por donde entra y sale el cable. El router de tu casa es exactamente eso, con dos patas: una hacia tu red y otra hacia el proveedor de internet.
- Un **paquete** es el sobrecito de datos que viaja por la red. Lleva una dirección de origen y una de destino, igual que una carta.
- Una **ruta** es una frase que el router guarda en su memoria: "para llegar a tal red, mandá el paquete por tal interfaz, entregándoselo a tal vecino". El conjunto de rutas es la **tabla de enrutamiento**, y es la única herramienta que el router consulta para decidir por dónde sale cada paquete.
- El **ancho de banda** es la cantidad de datos por segundo que puede entrar por un cable. Un cable más rápido tiene más ancho de banda. No es "más rápido" en el sentido de llegar antes a un solo destino: es una autopista más ancha, con más carriles.
- "**Enrutar**" es decidir y ejecutar ese paso de paquete en paquete. En muchos textos vas a ver el término en inglés, *routing*, y en algunos manuales viejos, *encaminamiento*. Son la misma cosa.

Con eso alcanza para empezar. Lo que vas a aprender acá es cómo un router **se entera** de las rutas que no están pegadas a su propio cable, sin que un humano las escriba una por una. Y vas a aprender las dos maneras que existen de hacerlo, porque esas dos maneras explican casi todo lo que viene después en la serie: OSPF, EIGRP, IS-IS y BGP no son invenciones sueltas, son variantes de dos ideas que caben en una frase cada una.

Si además querés entender por qué la red "se cae y se levanta sola" cuando alguien desenchufa un cable en la otra punta del edificio, este es el manual: el fenómeno se llama **convergencia** y lo vas a poder explicar con tus palabras al final.

---

## Índice

- [El problema: las rutas estáticas no escalan](#1-el-problema-las-rutas-estáticas-no-escalan)
- [Qué es el enrutamiento dinámico](#2-qué-es-el-enrutamiento-dinámico)
- [Los dos grandes grupos: la bifurcación del camino](#3-los-dos-grandes-grupos-la-bifurcación-del-camino)
- [Distance Vector: aprender por rumores](#4-distance-vector-aprender-por-rumores)
- [Los tres fantasmas del vector de distancia](#5-los-tres-fantasmas-del-vector-de-distancia)
- [RIP: el abuelo que todavía se estudia](#6-rip-el-abuelo-que-todavía-se-estudia)
- [Link-State: aprender dibujando el mapa](#7-link-state-aprender-dibujando-el-mapa)
- [El algoritmo SPF: Dijkstra en cristiano](#8-el-algoritmo-spf-dijkstra-en-cristiano)
- [Convergencia: el reloj de la red](#9-convergencia-el-reloj-de-la-red)
- [La comparación honesta: DV vs LS](#10-la-comparación-honesta-dv-vs-ls)
- [Aplicación: elegir el protocolo correcto](#11-aplicación-elegir-el-protocolo-correcto)
- [Qué viene después: el puente hacia OSPF](#12-qué-viene-después-el-puente-hacia-ospf)
- [Comprobá lo que aprendiste](#13-comprobá-lo-que-aprendiste)
- [Glosario](#14-glosario)
- [Resumen en 10 puntos](#15-resumen-en-10-puntos)

Cómo usar este índice: cada título de esta lista es un capítulo y también es la dirección (la URL) con la que se publica la página, así que no cambian nunca. Si tenés poco tiempo, el camino corto es el capítulo 1 (por qué la estática no alcanza), el 3 (las dos familias), el 4 (cómo piensa la que aprende por rumores), el 5 (sus tres enfermedades) y el 7 (cómo piensa la que dibuja el mapa). Con esos cinco ya entendés el 80 % del tema. Los demás capítulos son el detalle: el algoritmo, la convergencia, las comparaciones y el puente hacia OSPF.

Un aviso importante sobre el tono de este manual: **acá no vas a configurar nada en serio**. Todos los protocolos que se nombran (RIP, OSPF, EIGRP, IS-IS, BGP) tienen su propio manual más adelante en la serie. Este capítulo es el mapa del territorio: qué problema resuelven, en qué familia cae cada uno y por qué existen dos familias en lugar de una.

### Resumen

- Un router decide con su tabla de rutas, y este manual trata de cómo esa tabla se llena sola.
- Se definen desde el principio las palabras base: router, interfaz, paquete, ruta, tabla, ancho de banda.
- Toda la materia se reduce a dos familias: la que aprende por rumores y la que dibuja el mapa.
- Los protocolos concretos (RIP, OSPF, EIGRP, IS-IS, BGP) se ven en sus propios manuales; acá se entiende el porqué.

---

## 1. El problema: las rutas estáticas no escalan

### 1.1. El límite del manual anterior

Ya aprendiste a configurar rutas estáticas a mano. Una **ruta estática** es una línea que un humano escribe en la configuración del router, y que el equipo obedece sin discutir: "para llegar a la red tal, salí por esta interfaz". Son fantásticas en una red chica: predecibles, seguras, no consumen un solo byte de ancho de banda en avisos. Pero pongamos el caso real:

> Una empresa tiene **50 routers** con **200 redes**. Cada red tiene que llegar a todas las demás (o, al menos, a las que importan). Con rutas estáticas, un humano tiene que escribir **miles de líneas** de configuración, y en cada cambio de topología (un enlace nuevo, una red nueva, un router que se cae) hay que **reescribir todo a mano**.

Fijate en la palabra clave del párrafo anterior: **topología**. La topología es el dibujo de la red: qué equipo está conectado con cuál, por dónde. Cuando decimos "cambia la topología" queremos decir que ese dibujo cambió: se sumó un cable, se agregó un router, se murió un enlace, apareció una red nueva.

Y hay algo peor que el trabajo: la reacción. Si un enlace se cae a las 3 de la mañana, la estática **no se entera**. Recordá lo que viste: una ruta estática no tiene ojos ni oídos, es una orden escrita que el router obedece aunque el mundo haya cambiado. El tráfico se corta hasta que un humano se despierta, diagnostica y reconfigura.

Pensemos el costo en tres renglones, porque es el argumento de todo el capítulo:

- **Costo de escribir**: cada router necesita saber cómo llegar a las redes que no tiene pegadas. Si son 200 redes y 50 routers, las líneas se multiplican y ninguna se escribe sola.
- **Costo de mantener**: cada vez que algo cambia, hay que tocar varios routers. Y si te olvidás de uno, ese router queda con una ruta muerta que nadie nota hasta que un usuario llama.
- **Costo de reaccionar**: entre la caída y el arreglo hay un humano en el medio. En una red chica eso es un rato. En una red grande es una caída de servicio con acta.

> **Analogía:** las rutas estáticas son el **recorrido fijo de un micro** que pasa siempre por la misma calle. Si esa calle se corta por obras a las 3 AM, el micro se queda atascado hasta que alguien del taller modifica el recorrido en papel. Nadie le avisa al chofer que la calle se cortó. Y si mañana abren una avenida nueva, el micro tampoco se entera: sigue yendo por el camino viejo porque es el que está escrito.

### 1.2. La idea madre de este manual

> **El enrutamiento dinámico resuelve exactamente eso: los routers se AVISAN ENTRE SÍ cómo está la red.** Cada router le cuenta a sus vecinos las redes que conoce, escucha lo que los otros le cuentan, y arma su tabla de rutas sin intervención humana. Cuando algo cambia (un enlace cae, una red aparece), los routers se enteran y **recalculan solos**.

Ese "avisarse entre sí" no es charla libre: tiene reglas. El conjunto de reglas con el que dos routers conversan sobre rutas se llama **protocolo de enrutamiento dinámico**. Un protocolo, en redes, es un acuerdo escrito sobre cómo hablar: qué mensajes existen, en qué orden van, qué significa cada uno y qué se hace cuando llega. Sin acuerdo no hay conversación útil: dos routers que hablan protocolos distintos se escuchan pero no se entienden, igual que dos personas que hablan idiomas diferentes.

Una aclaración que evita confusiones desde ahora: **protocolo de enrutamiento** no es lo mismo que **protocolo de red**. Un protocolo de red (como IP, *Internet Protocol*) dice cómo se escribe la dirección de un paquete para que llegue a destino. Un protocolo de enrutamiento dice cómo los routers se cuentan entre ellos por dónde se llega a esas direcciones. Uno habla del sobre; el otro, del reparto del sobre.

Y los protocolos de enrutamiento se dividen en dos grandes familias, con formas de pensar MUY distintas: **vector de distancia** y **estado de enlace**. Este manual te hace entender por qué existen las dos, cómo piensa cada una, y por qué OSPF (el tema estrella de los próximos manuales) eligió ser de una de ellas.

### Resumen

- Las rutas estáticas son una orden escrita: no se enteran de nada, ni reaccionan solas.
- Con muchas redes y routers, escribirlas y mantenerlas a mano no cierra por ningún lado.
- La solución es que los routers se avisen entre sí, siguiendo reglas acordadas: protocolos de enrutamiento.
- Un protocolo de enrutamiento habla del reparto; un protocolo de red habla de la dirección del sobre.
- Existen dos familias de protocolos de enrutamiento: vector de distancia y estado de enlace.

---

## 2. Qué es el enrutamiento dinámico

### 2.1. Los tres ingredientes de todo protocolo dinámico

Cualquier protocolo de enrutamiento dinámico, sin importar su familia, hace estas tres cosas:

| Ingrediente | Qué es | En cristiano |
|-------------|--------|--------------|
| **Descubrimiento** | Los routers se encuentran y se reconocen | "Hola, soy R1, ¿quién sos vos?" |
| **Intercambio** | Se pasan información sobre las redes | "Yo conozco la red X, la Y y la Z; ¿vos?" |
| **Cálculo** | Cada uno actualiza su propia tabla | "Con lo que me contaron, actualizo mi mapa" |

Esta tabla es la receta común: tres columnas y tres pasos. Leela así:

- **Ingrediente**: el nombre del paso, el que vas a encontrar en cualquier libro y en cualquier clase.
- **Qué es**: la definición en lenguaje técnico, corta.
- **En cristiano**: la misma idea dicha como una frase de conversación entre dos routers. Si algún día te trabás con la definición, volvé a esta columna.

Lo que CAMBIA entre protocolos no es la receta, sino la forma de hacer el paso 2 (qué se cuentan) y el paso 3 (cómo calculan). Ahí está toda la diferencia. Y es una diferencia grande: de esos dos pasos sale la mitad de los problemas y virtudes de cada familia.

Un detalle que sorprende a los principiantes: el **descubrimiento** es el paso más olvidado y el más importante en la práctica. Un router no puede hablar con cualquiera: solo habla con sus **vecinos**, es decir, con los routers que están del otro lado de uno de sus cables. Si el saludo inicial no llega (porque hay un switch mal configurado, una VLAN distinta o un cable cruzado mal puesto), el resto de la receta nunca arranca y la red queda sin rutas aunque todos los equipos estén encendidos.

### 2.2. Qué le pedimos a un protocolo dinámico

Antes de comparar familias, definamos qué hace a un protocolo "bueno":

| Característica | Qué significa |
|----------------|---------------|
| **Convergencia rápida** | ¿Cuánto tarda toda la red en ponerse de acuerdo tras un cambio? |
| **Escalabilidad** | ¿Aguanta 10 routers? ¿1.000? ¿50.000? |
| **Uso de recursos** | ¿Cuánto ancho de banda y CPU consume "avisarse"? |
| **Libertad de bucles** | ¿Evita que los paquetes den vueltas en círculos? |
| **Métrica sensible** | ¿Elige según calidad real (ancho de banda, delay) o solo por un contador simple? |
| **Clase / estándar** | ¿Es abierto (cualquier fabricante) o propietario? |

Esta tabla es la lista de compras: cada fila es una cosa que se le puede pedir a un protocolo, y ningún protocolo las tiene todas perfectas. Cómo leerla:

- **Convergencia rápida**: la palabra **convergencia** aparece en el capítulo 9 entera, pero acá alcanza con esta idea: es el tiempo que tarda la red en dejar de estar confundida después de un cambio. Un protocolo converge rápido cuando en segundos todos los routers tienen la misma versión de la realidad.
- **Escalabilidad**: la pregunta es si el protocolo sigue funcionando cuando la red crece mucho. Hay protocolos que andan hermoso con diez routers y se caen de rodillas con mil.
- **Uso de recursos**: "avisarse" cuesta. Cada mensaje ocupa ancho de banda del cable y cada cálculo come **CPU** (el procesador del router) y memoria. Un protocolo que manda tablas enteras cada medio minuto gasta ancho de banda; uno que recalcula todo el mapa ante cada cambio gasta procesador.
- **Libertad de bucles**: un **bucle** es el peor accidente del enrutamiento y lo vas a ver en detalle en el capítulo 5. En criollo: dos routers se pasan el mismo paquete de ida y vuelta hasta que el paquete muere de viejo, y el ancho de banda del enlace se llena de basura que no llega a ningún lado.
- **Métrica sensible**: la **métrica** es el número con el que un protocolo mide qué tan bueno es un camino. Un contador simple cuenta cuántos routers atraviesa el paquete. Una métrica sensible mira el ancho de banda o la demora. La diferencia es elegir el camino más corto en cantidad de saltos aunque sea un cable de dos megas, o elegir el camino más ancho aunque tenga un router más.
- **Clase / estándar**: **abierto** quiere decir que cualquier fabricante puede implementarlo y funciona entre marcas distintas; **propietario** quiere decir que es de una sola empresa. Un protocolo abierto es de todos; uno propietario te ata a un proveedor.

Guardá esta tabla: la vas a usar para comparar DV y LS (y más adelante, OSPF vs EIGRP vs BGP). Y guardá también el orden, porque es el orden en el que conviene discutir cualquier protocolo nuevo que te presenten: primero cuánto tarda en reaccionar, después cuánto aguanta, después cuánto cuesta.

### Resumen

- Todo protocolo dinámico hace lo mismo: descubre vecinos, intercambia información y calcula.
- La diferencia entre protocolos está en qué se intercambia y cómo se calcula, no en la receta.
- Solo se habla con vecinos directos; si el saludo no llega, no hay rutas.
- Un protocolo se juzga por convergencia, escalabilidad, recursos, bucles, métrica y si es abierto.
- Ningún protocolo gana en las seis: cada uno elige qué sacrificar.

---

## 3. Los dos grandes grupos: la bifurcación del camino

Todo protocolo dinámico de enrutamiento pertenece a una de dos familias. El dibujo completo de la clasificación es este:

```text
                ENRUTAMIENTO DINÁMICO
                        │
        ┌───────────────┴───────────────┐
        │                               │
   VECTOR DE DISTANCIA             ESTADO DE ENLACE
   (Distance Vector)               (Link-State)
        │                               │
   "Solo sé lo que               "Yo construyo un
    me cuentan"                  mapa de toda la red"
        │                               │
   RIP (y su legado)              OSPF, IS-IS
   EIGRP (híbrido,                (los grandes, y los
   mejora la fórmula)             que vas a estudiar)
```

Este diagrama es el índice mental de toda la materia. Se lee de arriba hacia abajo:

- Arriba está el **enrutamiento dinámico**, el tema general.
- En el medio, las **dos familias**: vector de distancia y estado de enlace. Los nombres en inglés son los que vas a ver en los libros y en las consolas de los equipos; los podés usar en cualquiera de los dos idiomas.
- A la izquierda, la frase que resume la familia de rumores: "solo sé lo que me cuentan". A la derecha, la que resume la familia del mapa: "yo construyo un mapa de toda la red".
- Abajo, los protocolos de cada familia. **RIP** son las siglas de *Routing Information Protocol* (protocolo de información de rutas) y es el representante histórico. **OSPF** son las siglas de *Open Shortest Path First* ("primero el camino más corto, y abierto") e **IS-IS** significa *Intermediate System to Intermediate System* ("sistema intermedio a sistema intermedio"): los dos son estado de enlace y son los que se usan hoy en redes grandes. **EIGRP** (*Enhanced Interior Gateway Routing Protocol*, protocolo mejorado de enrutamiento entre pasarelas) aparece anotado como **híbrido** porque empezó como vector de distancia y le agregó mañas de mapa: es el que genera discusión, y tiene su propio manual.

> **La diferencia en una frase:** el **vector de distancia** es el que **le cuenta a su vecino qué redes conoce y a qué distancia**, sin saber cómo es el recorrido más allá del vecino. El **estado de enlace** es el que **publica "así es MI pedacito de red"** para que todos armen el mapa completo y calculen SOLO el mejor camino.

Usemos el sistema postal otra vez. Son las dos analogías que vas a necesitar para todo el manual, así que vale la pena leerlas dos veces:

> **Vector de distancia = la cadena de rumores**: cada oficina de correo le dice a la de al lado "yo sé llegar a Mendoza, te cuento y pasame esto a vos". Nadie tiene el mapa completo; confían en lo que les contaron. Si el de al lado se equivoca, el error viaja con el mismo entusiasmo que la verdad.
>
> **Estado de enlace = el mapa colaborativo**: cada oficina publica "yo estoy conectado a estas tres rutas, con estos costos". Con las publicaciones de todos, cada oficina dibuja el mapa COMPLETO del país y calcula la mejor ruta. Todos ven lo mismo, y por eso todos llegan a la misma conclusión.

El punto fino de la diferencia es **de quién es la información**. En la cadena de rumores, el dato sobre una red lejana llega transformado: nadie te dice "así es el país", te dicen "así me dijeron que es el país". En el mapa colaborativo, cada router solo habla de sí mismo ("esto es lo que yo tengo enchufado") y nunca opina sobre el resto. Parece un detalle chico; es la razón por la que existen dos familias.

Y fijate en la consecuencia práctica, que es la que te va a salvar en un examen: si preguntan "¿este protocolo sabe la topología de toda la red?", la respuesta es una sola palabra que se deduce de la familia. Vector de distancia: no. Estado de enlace: sí, y además todos tienen exactamente la misma copia.

Ahora veamos cada familia en detalle, empezando por la más antigua (y la que explica por qué existe la otra).

### Resumen

- Hay dos familias y todo protocolo cae en una: vector de distancia o estado de enlace.
- Vector de distancia: cada router confía en el chisme de sus vecinos sobre qué tan lejos está cada cosa.
- Estado de enlace: cada router arma el mismo mapa y calcula el camino más corto él mismo.
- RIP es el abuelo de los rumores; OSPF e IS-IS son los del mapa; EIGRP es el híbrido que mezcla.
- La diferencia de fondo es de quién es la información: rumores de otros o la verdad de cada uno.

---

## 4. Distance Vector: aprender por rumores

### 4.1. Cómo piensa un router vector de distancia

Un router de esta familia NO sabe cómo es la red más allá de su vecino. Solo guarda dos datos por cada red que conoce:

```
VECTOR = (destino, DISTANCIA)
         así se llama la familia: un "vector" (destino + distancia)
         + el vecino por quien llegar
```

Este bloque define el corazón de la familia, así que vamos despacio. Un **vector**, en matemática, es una lista de valores; acá la lista tiene dos valores y tres datos en total:

- **Destino**: la red a la que se quiere llegar, escrita como dirección de red (por ejemplo, una red de oficina).
- **Distancia**: cuánto cuesta llegar según la vara de medición de ese protocolo. En RIP, la vara son los **saltos**.
- **El vecino por quien llegar**: el dato que el dibujo agrega al final. No alcanza con saber "está a tres"; hace falta saber a quién entregarle el paquete para que llegue. Ese vecino se llama **próximo salto** o *next hop*.

Ese tercer dato es el que hace que un vector sea útil y no una trivia: el router no guarda el camino completo, guarda **la primera patita** del camino. Y confía en que el vecino se encarga del resto.

Su forma de aprender es primitiva y efectiva:

```text
1. R1 le dice a R2: "Yo conozco la red A a distancia 0 (es mía)."
2. R2 escucha y piensa: "Si R1 conoce la A a 0, y R1 está a 1 salto de mí,
   entonces yo la conozco a 0 + 1 = 1."
3. R2 le dice a R3: "Yo conozco la red A a distancia 1."
4. R3 piensa: "1 + 1 = 2." Y así sucesivamente.
```

Este bloque es la mecánica del rumor en cuatro líneas. Leelo como una conversación con un solo movimiento: **sumar uno**.

- Línea 1: el router que tiene la red pegada a su cable la anuncia con distancia **cero**. Cero significa "esto es mío, no me cuesta nada llegar".
- Línea 2: el vecino escucha y aplica la regla de oro: **distancia que me contaron + 1**. El uno es el costo de su propio cable, el tramo que él conoce de primera mano.
- Líneas 3 y 4: el que aprendió el dato lo repite a su vez, ya con la distancia sumada. Y así sigue, router por router.

Cada router recibe el rumor, le **suma 1** (el costo del propio salto) y lo guarda. El rumor **avanza como una onda** de router en router. Un **salto** es cada router que el paquete atraviesa en el camino: si el paquete pasa por R2 y R3 antes de llegar, son dos saltos.

> **Analogía (la cadena de rumores):** "¿Dónde queda la mejor panadería?" → "No sé, pero el vecino de al lado dijo que queda a dos cuadras de su casa." Nadie caminó hasta la panadería: **todos se fían del que les contó, y le suman el tramo que ellos conocen.** El conocimiento es de segunda, tercera, cuarta mano... Y si el primer vecino se confundió de cuadra, todos los demás repiten el error con total seguridad.

### 4.2. El "solo sé lo que me cuentan": el problema de raíz

Esta forma de pensar tiene una consecuencia inevitable y profunda:

> **Un router vector de distancia NUNCA sabe la topología completa. No sabe si el "recorrido" que le contaron es directo o da diez vueltas. Solo sabe: "red X a distancia N, por el vecino Y".**

Por eso la métrica de estos protocolos es casi siempre un contador simple (saltos): es todo lo que el "rumor" puede transmitir con honestidad. No podés transmitir "ancho de banda de todo el camino" cuando nadie tiene el mapa. Fijate la lógica: para decir "este camino tiene 100 Mbps en el tramo más lento" habría que conocer todos los tramos, y nadie los conoce.

De ahí sale una ceguera que hay que tener presente, porque es la que después se cobra caro:

- Un camino de **dos saltos** por dos cables de 10 Gbps (rapidísimos) y un camino de **dos saltos** por dos cables de 2 Mbps (lentos) **tienen la misma distancia** para un protocolo que cuenta saltos. El router los ve iguales y elige uno, quizás el lento.
- Un camino más corto en saltos puede ser mucho más largo en tiempo real. El contador no mide tiempo ni grosor del cable: mide cantidad de routers atravesados.

Por eso el **hop count** (conteo de saltos) es la métrica más simple que existe y la más criticada: es honesta con lo que un rumor puede saber, pero es pobre como descripción de la realidad.

### 4.3. El intercambio: periodos y vecinos

Las actualizaciones **periódicas** y los **vecinos directos** definen el ritmo:

- Cada `X` segundos (en RIP, 30), el router le manda SU tabla completa a sus vecinos directos.
- Los vecinos solo son los conectados directamente (los que comparten un enlace). No hay "vecinos de vecinos".
- El router escucha, compara, y **reemplaza lo que sabe** según lo que le cuenten (si el rumor tiene mejor métrica, lo acepta; si no, lo ignora).

Subrayemos las tres palabras de este párrafo, porque cada una tiene consecuencias:

- **Periódicas**: no espera a que algo cambie. Cada 30 segundos, pase lo que pase, manda. Eso da robustez (si se perdió un mensaje, el siguiente lo repite) y también un gasto fijo de ancho de banda que no para nunca.
- **Directos**: el mensaje no viaja lejos. Va de router a router vecino, nada más. La propagación a toda la red es la suma de muchos pasos de a uno.
- **Tabla completa**: el router no manda "solo lo que cambió", manda todo lo que sabe. Es generoso y es caro: en una red grande, cada 30 segundos se repite el mapa de la red entera por todos los cables.

> **Dato importante:** cuando un protocolo DV manda "su tabla completa", no es que el vecino "copie todo": el vecino compara con lo que ya tiene y actualiza solo lo que mejora o lo que no conocía. La confianza es ciega: **si un vecino dice "yo tengo esto", el otro le cree**... y de esa confianza ciega nacen los problemas de la sección 5.

Fijate en el detalle del "compara": el router no obedece, elige. Si el rumor que llega mejora su distancia actual, lo adopta y cambia de camino; si es peor, lo descarta y se queda con lo que tenía. Ese mecanismo, que parece razonable, es exactamente el que produce los problemas del capítulo siguiente, porque también le cree al vecino cuando el vecino repite un dato que el propio router le había dado.

### Resumen

- Un router vector de distancia guarda tres datos: destino, distancia y por qué vecino llegar.
- Aprende sumando uno a lo que le cuentan, y repite el rumor ya corregido.
- Su distancia es un contador simple (saltos): no sabe si el camino es ancho, rápido o un desastre.
- Habla solo con vecinos directos, cada 30 segundos, y manda la tabla completa.
- Confía en el vecino sin verificar: de ahí salen todos los fantasmas que vienen ahora.

---

## 5. Los tres fantasmas del vector de distancia

Acá está el corazón de por qué existen los protocolos de estado de enlace: las enfermedades del vector de distancia. Cuando entendés estas tres, entendés TODA la historia del routing.

### 5.1. Fantasma 1 — Count to Infinity (contar hasta el infinito)

**El escenario:** R1 conoce la red A (distancia 0). R2 la conoce a 1, R3 a 2. **El enlace de R1 se cae.**

**Qué pasa en un DV naif:**

```text
1. R1 ya no tiene la red A... pero R2 LE CUENTA: "Yo tengo la A a distancia 1."
2. R1 creé (confianza ciega) y piensa: "Entonces yo la tengo a 1 + 1 = 2, por R2."
   → ¡R1 "recuperó" una red que se le cayó, por un rumor que vino de él mismo!
   (R2 le había aprendido la A a R1, y ahora se la devuelve como si fuera propia)
3. R2 recibe el rumor de R1: "la A a 2". Piensa: "Entonces yo a 2 + 1 = 3."
4. R1 recibe: "la A a 3". → "Yo a 4." R2 a 5...
```

Este bloque es la película del desastre, cuadro por cuadro. "Naif" quiere decir ingenuo: un protocolo de vector de distancia sin ningún remedio de los que vienen después. Y el orden importa, así que seguilo:

- Cuadro 1: se cayó el cable de R1. La red A ya no existe para R1. Pero R2 todavía tiene la ruta en su tabla y sigue anunciándola, porque para R2 nada cambió: su cable está sano.
- Cuadro 2: R1 escucha el anuncio de R2 y le cree. Le suma uno. Resultado: R1 "recupera" una red que acaba de perder, y por un camino que pasa por el vecino a quien él mismo le había enseñado esa red. El dato dio la vuelta completa y volvió como si fuera nuevo.
- Cuadros 3 y 4: ahora R2 escucha la distancia 2 que anuncia R1, le suma uno, y corrige su propia ruta a 3. R1 escucha 3, suma a 4. Y así.

**El número crece de a 1 en cada ida y vuelta: la red "cuenta hasta el infinito".** Cada ronda, la distancia sube. Los paquetes a la red A quedan **rebotando entre R1 y R2 en un bucle**, y los routers no se dan cuenta de que la red murió.

Ese bucle tiene un costo concreto que conviene nombrar: el enlace R1-R2 se llena de paquetes que no van a llegar a ningún lado, y mientras tanto el resto de la red sigue creyendo que hay un camino válido hacia A. No es un error de configuración; es la lógica del rumor funcionando tal como fue diseñada.

Para cortarlo se usa un límite: en RIP, **16 = infinito**: cuando la distancia llega a 16, la ruta se declara inalcanzable y se borra. Ese 16 no es un número mágico del universo: es un tope elegido a mano, el más chico que se les ocurrió que fuera claramente "más grande que cualquier red razonable de la época". **Inalcanzable** significa "no hay ruta": el router deja de anunciarla y de usarla. Pero llegar a 16 **tarda** (16 rondas × 30 segundos = ¡8 minutos de bucle!). Esa es la "convergencia lenta" del DV: los routers sí se enteran, pero ocho minutos después.

> **Analogía:** el vecino "amable" que devuelve un objeto que perdiste... sin saber que el objeto lo habías dejado en su casa. "¿Buscás la pelota? Yo la vi, está en tu casa." → "Ah, si está en mi casa, gracias... espera, ¡yo la tenía!" El objeto (los datos) da vueltas entre las dos casas mientras discuten quién la tiene.

Fijate que el fantasma tiene dos partes y hay que entender las dos: el **bucle** (los paquetes giran) y el **conteo** (la distancia sube hasta el tope). El bucle es el síntoma visible; el conteo es lo que hace que se arregle solo pero tarde. Y "tarde" en una red que factura por segundo es un problema serio.

### 5.2. Fantasma 2 — Split Horizon (horizonte dividido)

**El remedio número 1:** regla simple que evita el caso más común del count to infinity.

> **Regla del split horizon: "Nunca le cuentes a un vecino lo que aprendiste DE ESE vecino."**

```text
R2 aprendió la red A de R1 → R2 NO le cuenta la red A de vuelta a R1.
```

Este bloque es la regla en una línea, y conviene entender qué evita exactamente. Si R2 no puede devolverle a R1 el dato que aprendió de R1, entonces el circuito del capítulo anterior se corta en su primer paso: cuando se cae el enlace de R1, R2 no le "vuelve" la ruta, R1 se queda sin ruta (que es la verdad) y el conteo nunca arranca. El nombre "horizonte dividido" viene de la idea de que el router tiene dos horizontes: hacia un lado cuenta lo que sabe de todos, hacia el lado del que aprendió algo, no lo repite.

> **Analogía:** "no le devuelvas la pelota a quien te la prestó": si la pelota se la dieron a vos en custodia, no la "recomiendes" de vuelta a la misma persona como si fuera tuya.

Ojo con una consecuencia práctica de esta regla: el split horizon funciona bien en enlaces de dos puntas (un cable entre dos routers) y se pone incómodo cuando hay varios routers en el mismo medio compartido, porque "por dónde lo aprendí" deja de ser una sola dirección. Ese matiz es la razón por la que existe la versión que viene ahora.

Y hay un caso todavía más difícil, que conviene tener visto porque es el que hace fracasar al split horizon solo. Imaginate un triángulo: R1, R2 y R3, los tres conectados entre sí, y una red colgada de R1. Si esa red se cae, R1 se queda sin ruta; R2 la aprende de R1 y R3 la aprende de R2. Ahora R2 le cuenta su ruta a R3, pero R3 ya la tenía por R2, así que no cambia nada... hasta que R3 se la cuenta a R1. Y R1, que aprendió ese dato de R3 (no de R2), puede contárselo a R2 sin violar la regla, porque el dato no volvió por donde vino: dio la vuelta larga. El conteo arranca igual, un poco más lento.

Moraleja: el split horizon corta la **devolución directa**, no la **vuelta larga**. Por eso no alcanza solo, y por eso los protocolos de rumores serios combinan varias herramientas a la vez: el envenenamiento explícito, el temporizador de espera y un tope de distancia. Ninguna cura la enfermedad; entre todas la mantienen a raya. Y esa es, otra vez, la razón por la que alguien terminó proponiendo el mapa.

Andá a la configuración real en el laboratorio: RIP la aplica automáticamente. No hay un comando que tengas que escribir: viene encendida de fábrica en el protocolo, y por eso casi nadie la estudia hasta que un día arma una topología rara, la desactiva para "probar", y descubre para qué servía.

### 5.3. Fantasma 2 bis — Poison Reverse (la devolución envenenada)

El split horizon tiene una versión más agresiva y más explícita, que es la que se usa en la práctica. Se llama **split horizon con poison reverse**, o "horizonte dividido con devolución envenenada":

> **Regla del poison reverse: en vez de callarte, contale al vecino la verdad incómoda: "esa red que aprendí de vos está a distancia infinita".**

La diferencia con el split horizon simple es sutil pero importante, y hay que decirla con precisión:

- **Split horizon simple**: el router **se calla**. No menciona la ruta cuando le habla al vecino del que la aprendió. El silencio, en teoría, alcanza.
- **Poison reverse**: el router **habla y envenena**. Menciona la ruta explícitamente, pero con la métrica al tope (en RIP, 16). Es decir: "de vos la aprendí, y por vos ahora vale infinito".

¿Por qué molestarse en mandar un dato malo en lugar de no mandar nada? Por dos razones que en la vida real importan:

1. **El silencio es ambiguo.** Si el vecino no escucha nada sobre esa red, puede pensar que no hay novedades y quedarse con la ruta vieja hasta que se le venza el temporizador. Un envenenamiento explícito le dice "no es que no tenga noticias: tengo la noticia de que esto no sirve".
2. **Rompe el circuito de forma activa.** El conteo al infinito necesita que alguien crea que la ruta sigue viva. Si el vecino recibe 16 por esa ruta, la marca inalcanzable en el acto y no hay nada que contar.

> **Analogía:** es la diferencia entre no contestar el teléfono y contestar para decir "no, no tengo tu pelota". Las dos cosas evitan que el otro se ilusione, pero solo la segunda le ahorra la duda.

Un aviso honesto, porque acá hay dos nombres que se parecen y conviene no mezclarlos: **poison reverse** es el envenenamiento dirigido a un vecino puntual (el que te enseñó esa ruta), y **route poisoning** (el que viene en el punto siguiente) es el anuncio de una ruta que se murió, hacia todos. Comparten la idea de "métrica infinita = no hay ruta", pero no son la misma herramienta ni se disparan por el mismo motivo. Los manuales viejos a veces usan un nombre por el otro; cuando leas "poisoning" fijate en el contexto si habla de un vecino o de todos.

### 5.4. Fantasma 3 — Route Poisoning y Hold-Down (envenenar y aguantar)

**Route poisoning:** cuando un router detecta que una red murió, en lugar de quedarse callado (o mentir), **"envenena" la ruta: la anuncia con distancia 16 (infinita)**. Es la forma de decir "ESTA RED ESTÁ MUERTA, no me la devuelvan". Los vecinos, al ver 16, la marcan inalcanzable. Fijate la diferencia con el poison reverse: acá no hay un vecino puntual al que devolverle nada; hay un hecho nuevo (la red murió) y el router lo publica hacia todos, con la métrica al tope en lugar de simplemente borrar la ruta y callarse.

**Hold-down (timer de espera):** el vecino receptor no "dropea" la ruta al instante: la mantiene en estado "sospechosa" durante un tiempo (timer). Mientras el timer corre, **ignora rumores de otros vecinos** que digan que la ruta volvió a la vida con métrica peor que la anterior. Así se evita que un rumor "viento en popa" reintroduzca una red que recién se cayó (por si realmente está viva pero tambaleando, y que se estabilice). Un **timer** es, en redes, un contador de tiempo que corre solo: cuando llega a cero, pasa algo. Es la forma que tienen los equipos de esperar sin quedarse dormidos.

> **La idea detrás:** el routing de los 80 era un mundo de enlaces que se caían y volvían. El hold-down es "no cambiés de opinión cada 5 segundos": esperá, aguantá, y recién después aceptá el nuevo estado. Equilibra estabilidad contra velocidad.

Y ahí está el compromiso que vas a volver a ver en cada protocolo de la serie: **estabilidad contra velocidad**. Cuanto más esperás antes de aceptar un cambio, menos rebotes tenés y más lento convergés. Cuanto menos esperás, más rápido reaccionás y más fácil es que un enlace inestable haga vibrar la tabla de rutas entera. No hay una respuesta única: hay una decisión de diseño, y cada protocolo la toma distinto.

### 5.5. El resumen de los fantasmas

| Fantasma | Problema | Remedio |
|----------|----------|---------|
| **Count to infinity** | Ruta muerta "revive" por rumores propios y el número sube hasta el infinito | Límite de hop (en RIP, 16 = infinito) |
| **Bucle de ida y vuelta** | R1↔R2 devolviéndose la misma ruta | **Split horizon**: no devolver lo aprendido de ese vecino |
| **Cambios bruscos indecisos** | Ruta que muere y "revive" por rumores nuevos | **Route poisoning** (anunciar 16) + **hold-down timer** |

Esta tabla junta los tres fantasmas con su cura, y es la que conviene tener a mano para repasar. Tres columnas: el **fantasma** (el nombre del problema), el **problema** (qué pasa en la red, contado como una historia) y el **remedio** (la herramienta que lo frena). Fijate que los remedios no son "arreglos" completos: son parches. El límite de 16 hace que el conteo termine, pero tarda minutos. El split horizon evita el caso más común, pero no todos. El hold-down evita el rebote, pero agrega lentitud. Ninguno cura la enfermedad de fondo.

> **Mensaje clave:** estos tres fantasmas NO son "bugs de RIP": son las limitaciones lógicas de pensar "por rumores". Cualquier protocolo de distancia va a chocar con ellos. La historia del routing es, literalmente, la historia de los ingenieros tratando de curar estas enfermedades... hasta que alguien propuso "y si en vez de rumores, dibujamos el mapa". Ese "alguien" es el estado de enlace, sección 7.

### Resumen

- El count to infinity hace que una red muerta "reviva" por un rumor que el propio router generó, y la distancia sube de a uno.
- El tope de 16 en RIP corta el conteo, pero puede tardar minutos de bucle real.
- El split horizon prohíbe devolverle a un vecino lo que se aprendió de él.
- El poison reverse hace lo mismo pero avisando explícitamente con métrica infinita.
- El route poisoning y el hold-down manejan la caída sin rebotes, a cambio de lentitud.

---

## 6. RIP: el abuelo que todavía se estudia

### 6.1. La ficha técnica

**RIP** (*Routing Information Protocol*) es el protocolo dinámico más viejo que sigue vigente (RFC 1058, 1988; nacido en los 80). Es el ejemplo canónico de vector de distancia. Un **RFC** (*Request for Comments*, "pedido de comentarios") es el documento donde se publica un estándar de internet: si querés saber exactamente cómo funciona un protocolo, se lee el RFC.

| Característica | Valor |
|----------------|-------|
| Familia | Vector de distancia puro |
| Métrica | **Hop count** (saltos) |
| Límite | **15 saltos máx.** (16 = infinito) |
| Envío de updates | Cada **30 segundos**, tabla completa |
| AD | 120 |
| Puerto | UDP 520 |
| Entorno real | Redes chicas o legado; hoy casi no se usa en producción |

Esta es la ficha de identidad de RIP: siete datos, y cada uno lo vas a volver a ver. Cómo leerla:

- **Familia**: de qué lado del árbol del capítulo 3 está. "Vector de distancia puro" quiere decir que no tiene ninguna maña de mapa.
- **Métrica**: con qué vara mide. En RIP, saltos: cuántos routers atraviesa el paquete.
- **Límite**: el tope del conteo al infinito. **15 saltos máximo** quiere decir que una red a 16 saltos de distancia es, para RIP, inexistente.
- **Envío de updates**: cada cuánto y qué manda. Cada 30 segundos, la tabla completa. Un *update* es un mensaje de actualización.
- **AD**: la **distancia administrativa**, un número que dice cuánto confía el router en esta fuente cuando compite con otra. Cuanto más bajo, más confianza. RIP tiene 120: bastante desconfianza.
- **Puerto**: por dónde viaja. **UDP** son las siglas de *User Datagram Protocol*, el protocolo de transporte que manda datitos sueltos sin garantizar entrega (el hermano apurado de TCP). El **puerto 520** es el número de ventanilla donde RIP atiende. Los routers de la red se hablan por ahí.
- **Entorno real**: dónde se lo encuentra hoy. Redes chicas, equipos viejos, laboratorios de estudio. En producción seria, casi no se usa.

Su límite de 15 saltos no es un capricho: es la consecuencia de la sección 5 (el conteo al infinito necesita un tope alcanzable-pronto). Una red con más de 15 routers... RIP no la ve entera. Y fijate el detalle cruel: si tenés una red de 20 routers, no es que RIP funcione "peor"; es que hay destinos que directamente le resultan inalcanzables aunque estén conectados y sanos.

Hacé la cuenta con una cadena, que es el caso donde se ve más claro. Poné los routers en línea, uno atrás del otro, con una red al final de la cadena. La red pegada al primer router está a distancia 0; la del segundo, a 1; la del tercero, a 2. La red que está detrás del router número 16 queda a 15 saltos: justo en el borde, todavía alcanzable. La que está detrás del router número 17 queda a **16**, y 16 es el número reservado para decir "infinito". Resultado: esa red existe, funciona, tiene usuarios, y RIP la declara inalcanzable. No hay ningún comando que arregle eso, porque el problema no es de configuración sino del tamaño de la vara con la que mide el protocolo.

### 6.2. RIPv1 vs RIPv2: la historia en dos versiones

| Característica | RIPv1 | RIPv2 |
|----------------|-------|-------|
| Año | 1988 | 1994 (actualización) |
| Clase completa / VLSM | **NO**: no envía máscara (clases puras; no entiende subredes variable) | **SÍ**: envía máscara (VLSM y CIDR) |
| Envío | Broadcast | **Multicast** (224.0.0.9) |
| Autenticación | No | Sí (texto claro o MD5) |
| Elegir para estudiar | Solo contexto histórico | Es el que verías configurado |

Esta tabla compara las dos versiones del mismo protocolo, y es la historia del routing en miniatura: lo que se aprendió en seis años. Columna por columna:

- **Año**: cuándo salió cada una. Seis años de diferencia, y una diferencia enorme de capacidades.
- **Clase completa / VLSM**: el punto más importante de la tabla. **VLSM** son las siglas de *Variable Length Subnet Mask* (máscara de subred de longitud variable) y **CIDR** es *Classless Inter-Domain Routing* (enrutamiento sin clases). La idea, sin entrar en el detalle de direcciones: antes las redes venían en tamaños fijos (clase A, B, C) y desperdiciaban direcciones; VLSM y CIDR permiten cortar la red en pedazos del tamaño que necesites. RIPv1 **no manda la máscara** en sus mensajes: el receptor tiene que adivinar el tamaño de la red, y adivina mal en cuanto hay subredes. RIPv2 sí la manda. Por eso RIPv1 no puede convivir con un direccionamiento moderno.
- **Envío**: cómo se manda el mensaje. **Broadcast** es "para todos los que estén en este cable, aunque no les interese"; **multicast** es "para un grupo de interesados". La dirección **224.0.0.9** es la dirección de grupo que eligió RIPv2 para decir "esto es para routers que hablan RIP". Multicast es más prolijo: no despierta a las PCs que no tienen nada que ver.
- **Autenticación**: si el protocolo puede verificar que el mensaje viene de un router legítimo. **MD5** es una función de hash, o sea una huella digital del mensaje: sirve para comprobar que nadie lo alteró en el camino. RIPv1 no tiene nada: cualquiera que sepa hablar RIP puede anunciar rutas falsas y desviar el tráfico. RIPv2 sí.
- **Elegir para estudiar**: el consejo práctico. RIPv1 se estudia para entender de dónde viene todo; RIPv2 es lo que podés llegar a encontrarte configurado en un equipo real.

Configuración (por si la ves en un laboratorio):

```cisco
R1(config)# router rip
R1(config-router)# version 2
R1(config-router)# network 192.168.1.0
R1(config-router)# network 10.0.0.0
R1(config-router)# no auto-summary
```

Este bloque es una configuración de RIP en un router Cisco, línea por línea. No hace falta que la memorices: alcanza con saber leerla, porque es la clase de cosa que aparece en un laboratorio o en un examen. Qué hace cada línea:

- `router rip`: entra al modo de configuración del protocolo RIP. El prompt cambia de `R1(config)#` a `R1(config-router)#`, que es la señal de que ahora estás configurando el protocolo y no el equipo.
- `version 2`: elige RIPv2 en vez de la versión 1. Sin esta línea, el router arranca en la versión vieja y no entiende subredes.
- `network 192.168.1.0` y `network 10.0.0.0`: le dicen a RIP en qué redes va a participar. Fijate que son las redes conectadas al router.
- `no auto-summary`: desactiva el **auto-resumen**, la maña de RIPv1 de agrupar redes en su clase (por ejemplo, anunciar 10.0.0.0/8 en lugar de las subredes reales). Sin esta línea, RIPv2 se comporta como su abuelo y anuncia de más.

Qué tenés que ver vos en pantalla: nada espectacular, y esa es justamente la señal de que salió bien. No hay mensaje de "listo, todo convergido". Si escribís `show ip protocols` vas a ver que RIP está corriendo, con su versión, su métrica y sus vecinos. Si ves los vecinos listados, el saludo funcionó.

> **Ojo con `network` en RIP:** a diferencia de OSPF, acá `network` identifica las redes que RIP va a ANUNCIAR (las redes conectadas), no "en qué área participar". RIP asume que sabés cuáles son tus redes. Es un detalle que confunde a todos cuando migran de RIP a OSPF.

### 6.3. Por qué se estudia RIP si "ya no se usa"

Respuesta honesta y corta: **para entender los problemas que OSPF vino a resolver.** Cada característica "rara" de RIP (15 saltos, conteo al infinito, split horizon, updates cada 30 s) es la razón de existir de algo en los protocolos modernos:

| Límite de RIP | Lo que explica en el mundo moderno |
|---------------|-------------------------------------|
| 15 saltos | Por qué las redes grandes necesitan protocolos que no cuenten saltos |
| Updates cada 30 s | Por qué OSPF usa "incrementales" (solo avisás cuando algo cambia) |
| Count to infinity | Por qué se inventó el estado de enlace (cada router calcula con el mapa) |
| Hop count | Por qué OSPF/EIGRP usan métricas que consideran el ancho de banda |

Esta tabla es el puente entre el pasado y el presente: en la columna izquierda, un límite de RIP; en la derecha, el invento moderno que nació para superarlo. Leela como una lista de causas y efectos. "Incremental" significa que el protocolo solo habla cuando hay novedades, en lugar de repetir todo cada 30 segundos. Y fijate que las cuatro filas apuntan al mismo lugar: cada límite de RIP es un argumento a favor del estado de enlace, que es el capítulo que viene.

No le dediques más de una tarde. Cuando veas OSPF, agradecé que no es RIP. Y si algún día tenés que tocar una red con RIP de verdad, acordate de las tres cosas que ya sabés: cuenta saltos, tiene un techo de 15, y tarda en darse cuenta de las caídas.

### Resumen

- RIP es el ejemplo puro de vector de distancia: saltos, 15 de tope, updates cada 30 segundos.
- La ficha técnica dice familia, métrica, límite, temporizador, confianza, puerto y vigencia.
- RIPv2 arregla lo que RIPv1 no podía: máscara, multicast y autenticación.
- `network` en RIP anuncia redes conectadas; no es "en qué área participo".
- Se estudia para entender por qué existen los protocolos modernos, no para usarlo.

---

## 7. Link-State: aprender dibujando el mapa

### 7.1. La idea revolucionaria

Los protocolos de **estado de enlace** (link-state) cambian el paradigma por completo. En vez de rumores ("yo conozco la red X a distancia N"), cada router publica **la verdad sobre SU pedacito** y todos arman el mapa completo:

> **La idea madre del link-state:** cada router construye **una base de datos idéntica a la de los demás**: el mapa COMPLETO de la red. Sobre ese mapa, cada router calcula SOLO el mejor camino hacia cada destino. Nadie "le cree a un rumor": todos ven el mismo dibujo.

La palabra "idéntica" es la clave de todo. En la familia de rumores, cada router tiene una versión distinta de la realidad, y la versión de uno puede ser la mentira que le contó otro. En la familia del mapa, todos tienen el mismo dibujo, y por lo tanto todos sacan las mismas conclusiones. Si dos routers tienen mapas distintos, algo se rompió (y el capítulo 7.4 te cuenta qué).

### 7.2. Las piezas del link-state (memorizá estas cuatro)

```text
Router
  │ 1. SALUDO: encuentra vecinos (Hello)
  ▼
LSA  ← "Link-State Advertisement": la "publicación" de cada router:
        "Yo, R3, estoy conectado a R2 (costo 1) y a R4 (costo 5). Eso es todo."
  │ 2. FLOODING: cada LSA se COPIA a todos (inundación controlada, hop a hop)
  ▼
LSDB  ← Link-State Database: la colección de TODOS los LSA = el MAPA COMPLETO
        (idéntica en todos los routers del área)
  │ 3. SPF: cada router calcula el árbol de caminos
  ▼
Tabla de enrutamiento
```

Este diagrama es el proceso completo del estado de enlace, de arriba hacia abajo, y cada flecha es un paso que ocurre en ese orden. Leelo como una receta de cocina:

- **Router → SALUDO**: el router arranca presentándose. El mensaje de saludo se llama **Hello**, y su trabajo es doble: descubrir quién está del otro lado y avisar que uno sigue vivo. Si el Hello deja de llegar, el vecino se considera caído.
- **LSA**: la **publicación** de cada router sobre sí mismo. **LSA** son las siglas de *Link-State Advertisement* (anuncio de estado de enlace). Fijate en el ejemplo lo importante: R3 habla solo de R3. Dice qué cables tiene y cuánto cuesta cada uno. No opina sobre el resto de la red, porque del resto no sabe nada más que lo que va a leer en el mapa.
- **FLOODING**: la publicación se copia a todos, salto a salto. "Copia a todos" suena a caos; ya vas a ver que está controlado.
- **LSDB**: la **base de datos de estado de enlace** (*Link-State Database*): la colección de todos los LSA de la red, es decir, el mapa completo. Es idéntica en todos los routers del área, y esa igualdad es lo que hace que todos calculen lo mismo.
- **SPF**: el cálculo. **SPF** son las siglas de *Shortest Path First* ("primero el camino más corto"), y es el algoritmo que transforma el mapa en una tabla de rutas. Tiene su propio capítulo, el 8.
- **Tabla de enrutamiento**: el resultado final, lo único que el router usa para decidir por dónde sale cada paquete.

Las cuatro piezas, en una tabla con analogía:

| Pieza | Qué es | Analogía |
|-------|--------|----------|
| **Hello** | Paquete de saludo: descubrir vecinos y mantenerlos vivos | El "¿seguís ahí?" del protocolo |
| **LSA** | La declaración de cada router: qué enlaces tiene y a qué costo | La ficha que cada oficina publica: "mis rutas y sus peajes" |
| **LSDB** | La colección de todos los LSA = el mapa | El mapa nacional completo, armado con las fichas de todos |
| **SPF** | El cálculo del mejor camino sobre el mapa | El GPS que calcula la ruta óptima mirando el mapa |

Esta tabla es el vocabulario mínimo del estado de enlace, y es la que te va a permitir leer cualquier manual de OSPF sin perderte. Tres columnas: la **pieza** (el nombre técnico que vas a escuchar), **qué es** (la función en una línea) y la **analogía** (la misma cosa en la vida diaria). Si un día te olvidás de qué es la LSDB, acordate de la columna tres: es el mapa nacional armado con las fichas de todos.

> **Analogía completa:** cada ciudad publica un cartel: "Yo estoy conectada a Córdoba (ruta nacional 9) y a Rosario (autopista)." El estado publica todos los carteles en el boletín oficial. Con el boletín, cada intendente traza el mapa de TODO el país y calcula la mejor ruta a cualquier ciudad. **Todos usan el mismo boletín → todos dibujan el mismo mapa → todos calculan bien.**

### 7.3. Flooding: la inundación controlada

Cuando un router publica su LSA (porque encendió, o algo cambió), esa publicación tiene que llegar a TODOS los routers del área. El mecanismo es el **flooding**:

```text
R3 publica su LSA
  → se lo manda a R2 y R4
  → R2 se lo manda a R1 (y a los demás que conozca)
  → R1 se lo manda a todo el mundo que aún no lo tenga
  → cuando un router recibe un LSA que YA tiene, lo descarta (inundación finita)
```

Este bloque es el recorrido de una publicación por la red, y la última línea es la que evita el infinito. "Flooding" quiere decir inundación: el mensaje se copia por todos lados hasta que no queda nadie sin enterarse. Sin control, eso sería una tormenta de copias eternas (cada router reenviando lo que recibe, para siempre). El control está en las dos reglas del bloque:

- **Se reenvía a los que aún no lo tienen**: nadie repite el mensaje hacia atrás por donde vino, si ese vecino ya lo mandó.
- **Si ya lo tengo, lo descarto**: cada router reconoce un LSA que ya recibió y no lo vuelve a propagar. La inundación termina cuando todos tienen una copia y no hay a quién contarle nada nuevo.

Cada router, al recaerle el LSA, **lo guarda en su LSDB, lo registra (lo marca como visto) y lo reenvía** a todos menos al que se lo mandó. La inundación está **controlada** por dos cosas: cada LSA tiene un número de secuencia (si ya lo tenés, no lo copiás) y un timer de vida (expira y se borra). Un **número de secuencia** es un contador que sube con cada versión nueva de la publicación: sirve para distinguir "esta es la noticia de hoy" de "esta es la noticia de ayer".

> **La belleza del flooding:** cuando R3 publica un cambio (un enlace se cayó), en **segundos** TODOS los routers tienen el cambio en su LSDB. Nadie necesita "contar hasta 16". La red entera se entera a la vez. Eso es convergencia rápida.

Y acá está el otro lado de la moneda, que es la parte que suele omitirse: **cada cambio se paga en toda la red**. En el capítulo 9 vas a ver el detalle, pero adelantemos la idea. Cada vez que un enlace sube o baja, todos los routers del área tienen que (1) recibir el LSA nuevo, (2) actualizar su mapa y (3) volver a correr el algoritmo sobre el mapa entero. En una red con cien routers, un cable que se mueve hace trabajar a los cien. El estado de enlace compra velocidad de convergencia pagando con procesador y memoria en cada equipo, y con un diseño cuidadoso (las áreas) para que el mapa no crezca sin límite.

### 7.4. Por qué esto cura los fantasmas del DV

| Fantasma del DV | Por qué el link-state NO lo tiene |
|-----------------|-----------------------------------|
| Count to infinity | No hay "rumores": si el enlace de R1 se cae, R1 publica SU verdad (un LSA nuevo: "ya no tengo ese enlace"). Todos lo ven y recalculan |
| Bucle de ida y vuelta | El SPF calcula sobre el mapa COMPLETO: nunca va a elegir "volver al que te contó" porque VE el circuito completo |
| Confianza ciega | No hay confianza ciega: es TU LSA (el tuyo real) el que se propaga, no un rumor distorsionado por cada salto |

Esta tabla contesta la pregunta que todo el mundo hace en este punto: "¿y entonces el mapa no tiene los mismos problemas?". La respuesta, fila por fila, es que el problema desaparece porque cambia de quién es la información. Los dos primeros fantasmas necesitan que alguien repita un dato ajeno; acá nadie repite nada ajeno: cada router publica lo suyo y lo demás se lee del mapa. El tercero necesita que el dato se deforme al pasar de mano en mano; acá el LSA no se modifica, se copia igual. Nadie suma uno, porque nadie está contando saltos con rumores: la distancia se calcula después, sobre el mapa, con todos los costos a la vista.

> **El precio, porque todo tiene precio:** el link-state consume más CPU (cada router corre SPF) y más memoria (guarda la LSDB entera). Y necesita que toda la red esté **sincronizada**: si dos routers tienen LSDB distintas, calculan caminos distintos y pueden armar bucles. Por eso divide las redes en **áreas** (lo vas a ver en OSPF multi-área): para que las LSDB no crezcan al infinito.

Un **área**, en este contexto, es un grupo de routers que comparten una misma LSDB. En vez de que toda la red sea un solo mapa gigante, se parte en zonas y cada zona mantiene su mapa chico, con información resumida de las demás. Es la misma idea que un plano de ciudad por barrios en lugar de un plano único de todo el país: más manejable, y cada uno solo carga el detalle del lugar donde está.

### Resumen

- El estado de enlace cambia rumores por publicaciones: cada router cuenta solo lo suyo.
- Cuatro piezas: Hello (saludo), LSA (publicación), LSDB (mapa) y SPF (cálculo).
- El flooding copia cada publicación a todos, controlado por número de secuencia y tiempo de vida.
- Con el mapa completo desaparecen el conteo al infinito y los bucles por rumor.
- El precio es CPU, memoria y la necesidad de mantener los mapas sincronizados por áreas.

---

## 8. El algoritmo SPF: Dijkstra en cristiano

### 8.1. Qué es

El **SPF** (*Shortest Path First*) es el algoritmo que cada router de estado de enlace corre sobre su LSDB para calcular el mejor camino a cada destino. Su nombre técnico es **algoritmo de Dijkstra** (Edsger Dijkstra, 1959). Un **algoritmo** es una receta de pasos que siempre termina y siempre da el mismo resultado con los mismos datos: no es magia ni intuición, es procedimiento.

No hace falta programarlo: hace falta entender LA idea, porque es la misma que usás vos cuando elegís una ruta:

> **Dijkstra en cristiano: "desde donde estoy, mirá el vecino con el costo total más barato, marcá ese camino como resuelto, extendé la mirada, repetí."** Al final tenés el **árbol de caminos más cortos** desde TU router hacia todos los demás.

Un **árbol**, acá, es un dibujo sin vueltas cerradas: un camino principal del que salen ramas, sin ningún círculo. El "árbol de caminos más cortos" es entonces la lista de mejores rutas desde tu router hacia todos los demás, sin ciclos posibles.

### 8.2. El ejemplo paso a paso

Topología (los números son costos de enlace):

```text
         R2
       1/  \2
      /     \
    R1       R4
      \     /
       3\  /1
         R3
```

Este dibujo es la red de ejemplo: cuatro routers y cinco cables, y cada número al lado de un cable es su **costo**. El costo es un número inventado por el protocolo (o por el administrador) que representa cuánto "pesa" usar ese enlace: cuanto más caro, menos deseable. Se lee así: R1 está conectado a R2 con costo 1, R1 a R3 con costo 3, R2 a R4 con costo 2 y R3 a R4 con costo 1.

Querés los caminos más cortos desde R1:

```text
PASO 1: R1 mira sus vecinos directos:
        → a R2 cuesta 1 ← el más barato hasta ahora
        → a R3 cuesta 3
        CAMINO RESUELTO: R1→R2 (costo 1)

PASO 2: desde R2 (ya resuelto), extiende la mirada:
        → R2→R4 cuesta 2  → R1→R4 total = 1 + 2 = 3
        → a R3 seguía en 3 directo
        Empate entre R1→R3 (3) y R1→R2→R4 (3): el SPF elige uno (desempata)
        CAMINO RESUELTO: R1→R3 (3) o R1→R2→R4 (3)

PASO 3: desde R3 o R4, se extiende y se verifica:
        → R3→R4 cuesta 1: R1→R3→R4 = 3 + 1 = 4 → PEOR que R1→R2→R4 (3). Se descarta.
        → R4→R3 cuesta 1: R1→R2→R4→R3 = 1+2+1 = 4 → PEOR que R1→R3 (3). Se descarta.
```

Este bloque es el algoritmo trabajando, en tres pasos. "Desempatar" quiere decir elegir uno de los dos cuando valen lo mismo (los protocolos reales tienen una regla fija para eso, y no cambia el resultado). Seguí el orden:

- **Paso 1**: se empieza por lo único que se sabe con certeza absoluta, que son los cables propios. El más barato se marca como resuelto: ya no se discute más, ese camino es el mejor posible hacia ese vecino.
- **Paso 2**: desde el camino resuelto, se mira un paso más allá y se **suman** los costos. Aparece el primer empate, y con él la primera decisión: dos caminos distintos que cuestan lo mismo. Al SPF le da igual cuál elegir; lo importante es que no elige "el más lindo en el dibujo".
- **Paso 3**: se sigue extendiendo y, sobre todo, se **verifica**. Los caminos que se arman dando vueltas resultan más caros, y se descartan. Fijate que el algoritmo se frena solo: no hay ningún paso que diga "y si insisto por acá".

**Resultado final (el árbol SPF de R1):**

```text
R1 → R2 (costo 1)
R1 → R3 (costo 3)
R1 → R2 → R4 (costo 3)
```

Este bloque es la salida: la tabla de rutas que R1 va a usar, con el costo total de cada camino. Tres renglones, tres destinos, tres caminos ya decididos. Y ojo con el detalle de R4: no está el camino directo por R3, porque el árbol eligió pasar por R2.

Fijate lo importante: **R1 calculó el camino a R4 a través de R2 aunque R3 "queda más cerca en el dibujo"** — porque sumó los costos reales. El SPF no adivina: calcula con el mapa.

> **La garantía del SPF:** sobre una LSDB correcta, el algoritmo SIEMPRE encuentra el camino de costo mínimo. No hay "tal vez", no hay "fluke de rumor": es matemática. Por eso el link-state puede afirmar "yo elijo la mejor ruta" y por eso OSPF (que usa SPF) tiene una métrica basada en el costo real de los enlaces.

Esa garantía tiene una condición escrita en letra chica, y es la que hay que respetar siempre: **"sobre una LSDB correcta"**. Si el mapa está mal (porque dos routers tienen versiones distintas), el algoritmo es impecable y el resultado es equivocado. Un cálculo perfecto sobre datos malos sigue siendo un error, y encima uno en el que el router confía plenamente. Por eso el estado de enlace se obsesiona con la sincronización del mapa.

### 8.3. Costo del enlace: el input del SPF

El SPF necesita que cada enlace tenga un **costo**. Ese costo lo define cada protocolo:

- En **OSPF**: `100 Mbps ÷ ancho de banda` (el costo es menor en enlaces más rápidos). Lo ves a fondo con OSPF avanzado.
- En **IS-IS**: historically una métrica de 10 por defecto (también customizable).
- El administrador puede **sobreescribir** el costo a mano (`ip ospf cost X`) — esa es la base de la "ingeniería de tráfico" del tema de redistribución.

Estas tres viñetas son la respuesta a "¿de dónde sale el número que el algoritmo suma?". Fijate en la lógica de la primera: el costo se calcula **dividiendo**, así que a mayor ancho de banda, menor costo. Es una forma elegante de decir "prefiero el cable más ancho" sin que el protocolo tenga que entender de cables. La segunda dice que en IS-IS el valor por defecto es un número fijo y que igual se puede cambiar a mano. La tercera es la más importante en la vida real: el administrador puede **pisar** el cálculo automático y poner el costo que quiera. Eso se llama **ingeniería de tráfico**: en lugar de dejar que el algoritmo decida, se le dan los números para que decida lo que a uno le conviene. Y es una herramienta de doble filo: cambiás un costo y cambian todos los caminos de la red, no solo el que estabas mirando.

**Nota honesta:** las tres viñetas anteriores vienen del original con dos términos en inglés ("historically" y "customizable") y con el ejemplo de la fórmula de OSPF. La idea que enseñan es correcta; solo tené presente que hoy los equipos modernos usan valores de referencia más altos que 100 Mbps, porque si no, todos los enlaces rápidos terminan con el mismo costo mínimo y el algoritmo deja de distinguirlos.

### Resumen

- El SPF es el algoritmo de Dijkstra: extender la mirada siempre por el camino más barato.
- Cada router lo corre sobre su propia copia del mapa y obtiene su árbol de rutas.
- Suma costos reales, no cantidad de saltos: por eso puede preferir un camino con más routers.
- Garantiza el costo mínimo solo si el mapa está bien; con mapas distintos el error es seguro.
- El costo de cada enlace lo define el protocolo (o el administrador, para ingeniería de tráfico).

---

## 9. Convergencia: el reloj de la red

### 9.1. Qué es

La **convergencia** es el tiempo (y el proceso) que tarda toda la red en **ponerse de acuerdo** sobre el estado actual después de un cambio (un enlace cae, una red nace, un router se apaga).

```text
  CAMBIO ──► routers se enteran ──► recalculan ──► TODOS de acuerdo (convergido)
              │                         │                │
              │                         │                └── tiempo de convergencia
              │                         └── mientras tanto: rutas viejas, hay
              │                             paquetes perdidos o bucles temporales
              └── nadie se entera: la red sigue con rutas muertas
                  (el problema de la estática y del RIP con 16)
```

Este bloque dibuja la línea de tiempo de un cambio, y conviene leerlo como una carrera con tres etapas:

- **Cambio**: el cable se cae (o se agrega una red). Nadie sabe nada todavía.
- **Routers se enteran**: empieza la propagación. Acá se ve la diferencia entre familias: unos se enteran por un rumor que viaja de a un router, otros porque reciben una publicación directa.
- **Recalculan**: cada router rehace su tabla con la información nueva.
- **TODOS de acuerdo (convergido)**: ya no queda nadie con la versión vieja. Ahí termina el tiempo de convergencia.

Y la línea de abajo es la que duele: la rama que dice "nadie se entera" es la de las rutas estáticas, donde la red sigue convencida de que el cable roto funciona. La nota del paréntesis, "el RIP con 16", es el caso del vector de distancia: se entera, pero puede tardar minutos.

> **Analogía:** es una asamblea de vecinos decidiendo qué hacer cuando se corta la calle principal. Convergencia = el tiempo entre "se cortó la calle" y "todos los vecinos usan el desvío". Mientras no convergen, algunos autos siguen yendo a la calle cortada.

### 9.2. Por qué la convergencia importa tanto

| Protocolo | Convergencia típica | Por qué |
|-----------|---------------------|---------|
| Estáticas | **No converge**: nadie se entera hasta que un humano interviene | No hay aviso automático |
| RIP | Segundos a **minutos** (y a veces "contando hasta 16") | Updates cada 30 s + conteo al infinito |
| EIGRP | **Muy rápida** (subsegundos a segundos) | DUAL: cálculo local inmediato + aviso a vecinos |
| OSPF | Rápida (segundos) | Flooding inmediato del LSA + SPF local |

Esta tabla pone los tiempos uno al lado del otro, y es la tabla que hay que mirar cuando alguien dice "esta red reacciona bien". Tres columnas: el **protocolo**, la **convergencia típica** (cuánto tarda en promedio) y el **por qué** (el mecanismo que explica esa velocidad). Los tiempos son orientativos: dependen del tamaño de la red, de los temporizadores configurados y de la calidad de los enlaces. Y fijate el caso de EIGRP, que menciona **DUAL** (*Diffusing Update Algorithm*, algoritmo de actualización difusa): es la maña del híbrido, que guarda rutas de respaldo ya calculadas para no tener que preguntar nada cuando algo se cae.

La convergencia es **el reloj de la red**: todo el mundo la mide y la promete, porque una red que converge lento es una red donde los paquetes se pierden cada vez que algo cambia. Y en redes de verdad, algo cambia SIEMPRE.

### 9.3. El costo real de un cambio de topología

Vale la pena bajar a tierra qué pasa exactamente en esos segundos, porque es el argumento más honesto a favor de una familia y en contra de la otra. Un cambio de topología se paga en tres monedas distintas:

- **Moneda 1: los paquetes.** Mientras la red no converge, hay routers que siguen mandando tráfico por un camino que ya no existe. Esos paquetes se pierden, y el usuario lo nota como "se cortó un segundo". Si además el cambio produjo un bucle temporal, el daño es mayor: paquetes girando y ancho de banda ocupado por tráfico que nunca llega.
- **Moneda 2: el tiempo de la gente.** En un protocolo de rumores, cada ronda de actualización es un paso más cerca de la verdad. Si el rumor tiene que cruzar diez routers y cada ronda tarda lo que tarda el temporizador, la cuenta se hace en minutos. En un protocolo de mapa, la publicación llega a todos en paralelo (por el flooding) y el cálculo es local: segundos.
- **Moneda 3: los recursos del equipo.** Acá la balanza se invierte. El protocolo de rumores gasta poco procesador y mucha charla (tablas enteras cada 30 segundos, siempre, haya cambio o no). El protocolo de mapa gasta poca charla (solo habla cuando algo cambia) y mucho procesador y memoria, y encima el gasto se dispara justo cuando hay un cambio, porque todos recalculan a la vez.

Moraleja de las tres monedas: **no hay protocolo gratis, hay protocolos que cobran en distintos momentos**. El de rumores te cobra todos los días un poquito de ancho de banda y, cuando algo se rompe, te cobra minutos. El de mapa casi no te cobra nada en régimen normal y, cuando algo se rompe, te cobra un pico de procesamiento en todos los equipos a la vez.

Y una consecuencia de diseño que se deduce sola: si el cambio cuesta en todos los equipos, conviene que el mapa no sea gigante. De ahí las áreas que ya mencionamos, y de ahí que el tamaño de la red sea una decisión de arquitectura y no un accidente.

Hagamos la cuenta de la moneda 2 con números redondos, para que se vea de dónde salen los minutos. En el modelo ingenuo del vector de distancia, la noticia avanza un router por ronda de actualización, y la ronda dura lo que dura el temporizador: 30 segundos en RIP. Si el router que se enteró de la caída está a cinco saltos del router que necesita saberlo, la noticia tarda cinco rondas, o sea dos minutos y medio, y en el medio ese router sigue mandando tráfico por un camino muerto. Si además el conteo al infinito se dispara, hay que sumarle las rondas que faltan para llegar al tope. En el estado de enlace, la misma noticia es una publicación que se copia por todos los cables en paralelo: llega en milisegundos y el cálculo local tarda milisegundos también. La diferencia entre "dos minutos y medio" y "dos segundos" no es un detalle de rendimiento: es la diferencia entre una red que el usuario percibe como caída y una que ni se nota.

Falta una pieza que casi ningún manual principiante nombra y que en la práctica es la que más se sufre: los **micro-bucles**. Durante los pocos segundos que tarda la reconvergencia, es posible que dos routers tengan versiones ligeramente distintas del mapa y que se pasen paquetes entre ellos, convencidos cada uno de que el otro tiene el camino bueno. No es un bucle eterno: dura hasta que ambos terminan de recalcular. Pero en una red grande, con miles de flujos, esos segundos de desacuerdo alcanzan para perder tráfico de verdad. Por eso hasta los protocolos rápidos tienen mañas adicionales para ordenar el cambio (avisar antes, recalcular de a etapas, mantener el camino viejo un ratito mientras el nuevo se confirma). Es un tema de manual avanzado; acá alcanza con saber que existe y que se paga en la misma moneda: paquetes perdidos justo después de un cambio.

### Resumen

- Converger es ponerse de acuerdo: desde el cambio hasta que todos tienen la misma versión.
- Mientras no converge hay rutas viejas, paquetes perdidos y a veces bucles temporales.
- Las estáticas no convergen nunca solas; RIP tarda minutos; OSPF y EIGRP, segundos.
- Un cambio de topología se paga en paquetes perdidos, en tiempo y en recursos de los equipos.
- Los rumores gastan ancho de banda todos los días; el mapa gasta procesador en cada cambio.

---

## 10. La comparación honesta: DV vs LS

| Criterio | Vector de Distancia (RIP) | Estado de Enlace (OSPF/IS-IS) |
|----------|---------------------------|-------------------------------|
| **Conocimiento** | Solo vecinos directos y "rumores" | Mapa completo (LSDB) de toda el área |
| **Qué se transmite** | Tabla completa, periódicamente (rumores) | Solo cambios (LSA), solo cuando algo cambia |
| **Métrica** | Simple (hop count) | Basada en costo/ancho de banda (más realista) |
| **Convergencia** | Lenta (minutos, conteo al infinito) | Rápida (segundos) |
| **Escalabilidad** | Muy baja (15 saltos) | Alta (áreas lo multiplican) |
| **Consumo de recursos** | Poco CPU, pero MUCHO ancho de banda (tablas enteras cada 30 s) | Poco ancho de banda (incremental), más CPU/memoria (SPF + LSDB) |
| **Riesgos típicos** | Bucles y rumores | LSDB desincronizadas (por eso las áreas) |
| **Familia de uso actual** | Prácticamente legado (se estudia por historia) | **Los protocolos serios de hoy** (y de la empresa) |
| **Ejemplos** | RIP, RIPv2 | **OSPF**, **IS-IS** |

Esta tabla es el resumen del manual en nueve comparaciones, y cada fila es un capítulo condensado. La forma de leerla no es comparar casilleros de a uno, sino buscar el patrón: fijate que el vector de distancia gana en simplicidad y en casi nada más, y que el estado de enlace gana en todo lo que importa cuando la red crece, a cambio de recursos. Fijate también la fila de "Riesgos típicos": cada familia tiene su talón de Aquiles, y ninguna está libre de problemas. La diferencia es qué tipo de problema: el DV arma bucles circulares por confiar en rumores; el estado de enlace puede romperse si los mapas se desincronizan, y su defensa es la misma que su costo (las áreas).

Dos filas que merecen un comentario aparte:

- **"Qué se transmite"** es la fila que explica el gasto. El DV manda todo siempre; el estado de enlace manda solo lo que cambió. En una red estable, el DV está charlando sin parar sobre cosas que nadie necesita; el de mapa está callado.
- **"Consumo de recursos"** es la fila que explica el otro gasto. No hay ganancia sin costo: el ahorro de ancho de banda del estado de enlace se paga en procesador y memoria en cada router.

> **La conclusión de los 90:** cuando las redes crecieron, el vector de distancia (puro) no dio más. El estado de enlace es el estándar de facto de las redes internas modernas. Y ojo con un dato histórico-cómico: la respuesta de Cisco no fue "cambiemos a link-state" sino **EIGRP: un híbrido** (vector de distancia con "inteligencia" extra: guarda más estado, calcula rutas backup antes de que fallen). Causa de interminables debates. Lo vas a ver con EIGRP; por ahora, quedate con que la clasificación "DV vs LS" tiene un tercero con sombrero: el híbrido.

### Resumen

- El vector de distancia sabe poco y barato; el estado de enlace sabe todo y caro.
- Uno manda tablas enteras siempre; el otro manda solo los cambios.
- Uno mide saltos; el otro mide costo real de los enlaces.
- Uno tarda minutos en reaccionar; el otro, segundos, a costa de procesador y memoria.
- EIGRP es el híbrido que intentó quedarse con lo mejor de las dos familias.

---

## 11. Aplicación: elegir el protocolo correcto

### 11.1. La guía de decisión honesta

Cuando tengas que armar una red real, este árbol te ordena las opciones:

```text
¿Cuántos routers y cuán crítica es la red?

  ≤ 5 routers, topología estable
  │   → ESTÁTICAS (sencillas, predecibles, cero protocolo)
  │
  Empresa/media: decenas de routers, cambios frecuentes
  │   → OSPF (estándar abierto, multi-fabricante, área 0)
  │   → EIGRP si TODO el parque es Cisco (mejor convergencia, menos tuning)
  │
  Proveedor / ISP / red gigante
  │   → IS-IS (diseñado para dominios enormes) + BGP hacia afuera
  │
  Borde hacia otro operador/empresa (rutas externas)
  → BGP (el protocolo de la interconexión entre sistemas autónomos)
```

Este árbol es una guía de decisión: se lee de arriba hacia abajo y se corta en la primera rama que describa tu caso. "Tuning" quiere decir ajuste fino de parámetros; "parque" quiere decir el conjunto de equipos de la empresa. Tres cosas para notar:

- **"Área 0"** es el nombre del área central de OSPF, a la que se conectan las demás. Todavía no la vas a configurar: alcanza con saber que es la columna vertebral del diseño.
- **"ISP"** son las siglas de *Internet Service Provider*, el proveedor de internet. Y **BGP** es *Border Gateway Protocol* (protocolo de pasarela de borde), el que se usa entre organizaciones distintas.
- **"Sistemas autónomos"**: un sistema autónomo es una red grande administrada por una sola organización, con sus propias reglas hacia adentro. BGP es el protocolo que habla **entre** sistemas autónomos, no dentro de uno.

Fijate la lógica del árbol: no empieza por "cuál es el mejor protocolo", empieza por **cuántos routers y cuán crítica es la red**. Primero el tamaño y el riesgo, después la marca y el gusto. Es el orden correcto para decidir, y es exactamente al revés de como lo decide el que se enamora de un protocolo.

### 11.2. Reglas de oro de diseño

| Regla | Por qué |
|-------|---------|
| **Nunca mezcles protocolos sin plan** | Cada protocolo anuncia aparte; la redistribución es delicada y crea loops si no se domina |
| **La estática no es un pecado** | La default route estática "hacia el ISP" existe hasta en redes gigantes: lo que no escala es cientos de estáticas internas |
| **Preferí estándares abiertos** | OSPF funciona en cualquier fabricante; EIGRP te ata a Cisco |
| **Diseñá las áreas ANTES de configurar** | La estructura OSPF se dibuja en papel primero: áreas mal pensadas = LSDB gigantes = SPF lento |
| **Documentá la métrica** | "Costos OSPF: banda de referencia X" es un dato de mantenimiento que todos necesitan cuando algo anda raro |

Esta tabla es la parte que no enseña ningún comando y que igual decide si la red funciona en dos años. Dos columnas: la **regla** y el **por qué** (la consecuencia de romperla). La palabra **redistribución**, que aparece en la primera fila, es el acto de tomar rutas aprendidas por un protocolo y anunciarlas en otro: es la operación más delicada de todo el enrutamiento y tiene su propio manual en la serie. Y **loop**, en la primera fila, está usado en el sentido de bucle de enrutamiento: paquetes girando porque dos protocolos se pasan rutas contradictorias.

> **Regla de oro:** el protocolo correcto depende del TAMAÑO y del NEGOCIO, no de tu gusto. Una oficina de 4 routers con OSPF bien diseñado es sobre-ingeniería; un campus de 80 routers con RIP es una catástrofe lenta y anunciada. "Herramienta adecuada, no herramienta favorita."

### Resumen

- Primero el tamaño y la criticidad de la red; después la marca y el gusto.
- Pocas rutas y estables: estáticas. Empresa: OSPF o EIGRP. Escala de proveedor: IS-IS.
- Entre organizaciones distintas se habla con BGP, no con un protocolo interno.
- No mezcles protocolos sin plan: la redistribución mal hecha arma bucles.
- La default estática al borde es buena práctica hasta en redes enormes.

---

## 12. Qué viene después: el puente hacia OSPF

Este manual te dio la FUNDACIÓN conceptual. El próximo paso de la serie es convertirla en el protocolo real que vas a configurar:

```text
Enrutamiento dinámico (este): DV vs LS, LSA, LSDB, SPF, convergencia
      │
      ▼
OSPFv2 — vecinos, estados y configuración
      │   (el link-state llevado a la práctica: Hello, RID, áreas)
      ▼
OSPFv2 avanzado — DR/BDR, LSA en serio, multi-área, sumarización
      ▼
OSPFv3 e IPv6
      ▼
EIGRP (el híbrido) · IS-IS (el otro link-state)
      ▼
BGP (el mundo exterior)
```

Este bloque es el mapa de la serie: cada flecha es un manual, y el de arriba es el que acabás de leer. Los nombres nuevos que aparecen son solo eso, nombres: **OSPFv2** es OSPF para IPv4 y **OSPFv3** es OSPF para IPv6 (la versión nueva del direccionamiento IP). **RID** es el *Router ID*, el nombre único con el que se identifica cada router dentro de OSPF. **DR/BDR** son *Designated Router* y *Backup Designated Router*, dos routers elegidos para centralizar el intercambio en un medio compartido. **Sumarización** es resumir muchas redes en una sola línea al anunciarlas. Nada de esto hace falta entenderlo hoy: está acá para que veas que cada manual de la serie es un capítulo de la misma historia, y que no hay saltos.

Cuando llegues a OSPF, ya vas a saber por qué existe cada pieza:

| Término que vas a ver en OSPF | Tu conocimiento previo de ESTE manual |
|-------------------------------|----------------------------------------|
| Hello / Dead timers | La pieza "descubrimiento de vecinos" del link-state |
| LSA / LSDB | Las piezas "publicación" y "mapa" que acabás de aprender |
| SPF / área 0 | El algoritmo Dijkstra del link-state + la solución al problema de escalabilidad |
| Convergencia | El porqué de TODO el diseño de OSPF |

Esta tabla es la prueba de que este manual sirvió: cada término de OSPF ya tiene un lugar donde encajar. Los **Dead timers** son los temporizadores que cuentan cuánto tiempo puede pasar sin recibir un Hello antes de declarar muerto al vecino. Si leés la columna derecha y decís "eso ya lo sé", el manual cumplió.

> **Consejo de estudio:** si te preguntan "¿qué es OSPF?" y podés responder "un protocolo de estado de enlace que usa la LSDB y el SPF de Dijkstra para converger rápido y elegir rutas por costo", ya aprobaste el 50% de cualquier examen. Lo demás (configurar) es práctica.

### Resumen

- Con las dos familias, el mapa, el algoritmo y la convergencia ya tenés la base completa.
- OSPF es estado de enlace llevado a la práctica: Hello, LSDB, SPF y áreas.
- Los nombres nuevos del mapa de la serie (RID, DR/BDR, sumarización) se ven en su manual.
- Cada pieza de OSPF corresponde a algo que ya entendés de este capítulo.
- Configurar es práctica; entender el porqué es este manual.

---

## 13. Comprobá lo que aprendiste

Ocho preguntas. Tapá la respuesta, contestá en voz alta y recién después compará.

**1. ¿Cuáles son las dos grandes familias del enrutamiento dinámico y qué las diferencia?**

**Ver respuesta:** **Vector de distancia** (RIP, EIGRP como híbrido): los routers se pasan "rumores" (destino + distancia) de vecino a vecino; nadie tiene el mapa completo. **Estado de enlace** (OSPF, IS-IS): cada router publica su pedacito (LSA) y todos arman la misma LSDB (mapa completo), sobre la que cada uno calcula con SPF. Rumores vs mapa colaborativo.

**2. ¿Qué es el count to infinity y por qué existe?**

**Ver respuesta:** Cuando una red muere, el rumor corre: los vecinos se devuelven la ruta que aprendieron del otro ("confianza ciega"), y la distancia crece de a 1 en cada ronda hasta "infinito". Es consecuencia de que el DV no tiene mapa: no puede darse cuenta de que la ruta murió. Se corta con un límite (RIP: 16 = infinito), pero llegar a 16 tarda (convergencia lenta). El link-state lo elimina: el LSA del router afectado declara la verdad y todos recalculan.

**3. ¿Qué es el split horizon?**

**Ver respuesta:** Regla: "no le devuelvas a un vecino lo que aprendiste de ese vecino". Evita que R1 y R2 se devuelvan la misma ruta en bucle cuando se cae la red de R1. Es un remedio barato contra el caso más común de count to infinity. Su versión explícita es el **poison reverse**, que en lugar de callarse anuncia esa ruta con métrica infinita (16) para que el vecino no se quede con la duda.

**4. ¿Qué es un LSA y qué es la LSDB?**

**Ver respuesta:** El **LSA** (Link-State Advertisement) es la publicación de un router: "yo estoy conectado a estos enlaces, con estos costos". La **LSDB** (Link-State Database) es la colección de TODOS los LSA: el mapa completo de la red, idéntico en todos los routers del área. Sobre la LSDB, cada router corre SPF para calcular sus mejores rutas.

**5. ¿Qué calcula el algoritmo de Dijkstra (SPF)?**

**Ver respuesta:** El árbol de caminos más cortos desde el router hacia todos los destinos, sumando los costos de los enlaces según la LSDB. "Mirá el vecino con el costo total menor, marcá ese camino, extendé la mirada, repetí." Garantiza el costo mínimo SIEMPRE, si la LSDB es correcta.

**6. ¿Por qué el link-state converge más rápido que el DV?**

**Ver respuesta:** Porque ante un cambio solo se propaga el **LSA del router afectado** (inundación controlada, segundos) y cada uno recalcula localmente con SPF. El DV, en cambio, depende de updates periódicos (cada 30 s en RIP) y de la lenta propagación de rumores (que además puede contar hasta el infinito).

**7. RIP usa hop count y OSPF usa costo basado en ancho de banda. ¿Qué implica esa diferencia?**

**Ver respuesta:** RIP elige por cantidad de saltos aunque el camino sea lentísimo (un enlace de 2 Mbps "vale" lo mismo que uno de 10 Gbps si tienen los mismos saltos). OSPF elige por **calidad del camino** (menos costo = más ancho de banda), porque el SPF necesita un costo real por enlace. Es la diferencia entre "cuento pasos" y "mido el camino".

**8. ¿Cuándo conviene usar estáticas, OSPF, EIGRP o IS-IS?**

**Ver respuesta:** Estáticas: redes chicas/estables o como default route de borde. OSPF: estándar abierto para redes de empresa, cualquier fabricante. EIGRP: parque 100% Cisco que quiera convergencia rapidísima. IS-IS: dominios enormes de proveedores. BGP queda para la interconexión con otros sistemas (lo ves con BGP). El protocolo se elige por tamaño y negocio, no por gusto.

### Resumen

- Las ocho preguntas recorren familias, fantasmas, piezas del mapa, algoritmo y elección.
- Si contestaste bien la 1, la 2 y la 6, ya tenés el núcleo del tema.
- La respuesta corta de casi todas: rumores contra mapa, y qué le cuesta a cada uno.
- Cuando dudes, volvé al capítulo de la familia que corresponda en lugar de memorizar.

---

## 14. Glosario

| Término | Qué es |
|---------|--------|
| **Enrutamiento dinámico** | Los routers aprenden rutas solos, intercambiando información entre sí |
| **Vector de distancia (DV)** | Familia que transmite "destino + distancia" a vecinos; nadie tiene el mapa |
| **Estado de enlace (LS)** | Familia que publica el pedacito de cada router (LSA) y arma el mapa común |
| **Híbrido** | EIGRP: vector de distancia con características de link-state (estado extra, rutas backup) |
| **Hop count** | Métrica de RIP: cantidad de saltos; máximo 15 (16 = infinito) |
| **Count to infinity** | Bucle del DV donde la métrica crece hasta el límite tras una caída |
| **Split horizon** | Regla: no devolver a un vecino rutas aprendidas de ese vecino |
| **Route poisoning** | Anunciar una ruta muerta con métrica infinita para que nadie la reintroduzca |
| **Hold-down timer** | Espera antes de aceptar nuevos rumores sobre una ruta que acaba de caer |
| **LSA** | Publicación de un router: sus enlaces y costos |
| **LSDB** | Base de datos de todos los LSA: el mapa completo, idéntico entre routers |
| **Flooding** | Propagación de un LSA a todos los routers (controlada por secuencia y vida) |
| **SPF / Dijkstra** | Algoritmo que calcula el árbol de caminos más cortos sobre la LSDB |
| **Convergencia** | Tiempo en que toda la red se pone de acuerdo tras un cambio |
| **RIP** | Protocolo DV histórico (RFC 1058/2453), hop count, límite 15, AD 120 |

Este glosario es la lista de términos que tienen que quedar claros al terminar, y está ordenado en el mismo orden en que aparecieron. Dos columnas: el **término** y **qué es**, en una línea. Los cinco primeros son los que necesitás para cualquier examen; los del medio son los remedios y las piezas del mapa; el último es el protocolo que sirve de ejemplo de todo. Si un término de esta lista te suena pero no lo podés explicar en una frase, volvé al capítulo donde se usa: cada uno tiene su analogía.

### Resumen

- Los cinco primeros términos son las dos familias y sus dos formas de medir.
- Los remedios del DV (split horizon, poisoning, hold-down) son parches, no curas.
- Las piezas del mapa (LSA, LSDB, flooding, SPF) van juntas y en ese orden.
- Convergencia es el término que conecta todo: mide el resultado de las decisiones.
- Si podés explicar cada fila en una frase, el manual cumplió.

---

## 15. Resumen en 10 puntos

1. **La estática no escala**: 50 routers × 200 redes = miles de líneas a mano y reacción nula ante caídas. El dinámico resuelve eso: los routers se avisan y recalculan solos.
2. **Todo protocolo dinámico hace tres cosas**: descubrir vecinos, intercambiar información, calcular rutas. Lo que cambia es cómo.
3. **DV = rumores**: "destino + distancia", de vecino en vecino, sin mapa. **LS = mapa**: cada router publica su pedacito (LSA) y todos arman la LSDB completa.
4. **Los fantasmas del DV** (count to infinity, split horizon, poisoning/hold-down) no son bugs: son la enfermedad lógica de pensar sin mapa.
5. **RIP es el ejemplo DV puro**: hop count, 15 saltos, updates cada 30 s. Se estudia para entender POR QUÉ existen los protocolos modernos.
6. **Link-state = LSA + flooding + LSDB + SPF**: publicar, inundar, juntar el mapa, calcular con Dijkstra.
7. **Dijkstra en cristiano**: desde tu router, seguí extendiendo la mirada por el vecino más barato; al final tenés el árbol de costos mínimos.
8. **El link-state converge rápido** porque solo propaga el cambio (un LSA) y cada uno recalcula local.
9. **DV vs LS es una batalla por de recursos**: LS gana en escalabilidad, métrica y convergencia; paga con CPU y memoria. EIGRP es el híbrido que intentó lo mejor de ambos.
10. **Elegí el protocolo por tamaño y negocio, no por gusto**: estáticas en chica, OSPF en empresa, EIGRP en Cisco puro, IS-IS en proveedores, BGP afuera. Y la default estática al borde es buena práctica hasta en redes enormes.

Leé esta lista como el índice al revés: cada punto es un capítulo condensado en una línea. Si alguno no te cierra, el número te dice a dónde volver. Y si tenés que llevarte una sola cosa, llevate el punto 3: rumores contra mapa. Todo lo demás (los fantasmas, los remedios, el algoritmo, la convergencia) es consecuencia de esa única diferencia.

### Resumen

- Dos familias, dos formas de saber: rumores de los vecinos o un mapa compartido.
- La familia de rumores es simple y barata, y arrastra fantasmas que solo se parchean.
- La familia del mapa es precisa y rápida, y se paga con procesador, memoria y diseño.
- La convergencia es la medida de todo: cuánto tarda la red en decir la verdad otra vez.
- Elegir protocolo es elegir tamaño y negocio, nunca preferencia personal.

---

> **Fuente:** Documentación propia basada en RFC 1058 (RIPv1), RFC 2453 (RIPv2), RFC 2328 (OSPFv2), RFC 1142 (IS-IS), CCNA 200-301 Official Cert Guide (W. Odom) y material educativo de redes.

# 37. OSPF: El Protocolo de Estado de Enlace en Acción

**Cómo un protocolo de verdad convierte los LSA, la LSDB y el SPF en una red que converge sola**

---

Este manual es el primero de la familia OSPF, y está escrito para alguien que nunca configuró un protocolo de enrutamiento. No hace falta que sepas nada de OSPF para empezar: la idea se construye de a poco, primero el modelo mental y recién después los comandos.

**OSPF** son las siglas de *Open Shortest Path First*, "primero el camino más corto, y abierto". Es un **protocolo de enrutamiento dinámico**: un programa que corre dentro de los routers, se habla con los routers vecinos y descubre solo los caminos, sin que nadie escriba las rutas a mano. "Abierto" quiere decir que es un estándar público: funciona igual en un router Cisco, en uno Juniper o en uno de cualquier otro fabricante.

Antes de seguir, tres palabras que vas a leer en cada página:

- Un **router** (en español, encaminador) es un equipo con varias patas, cada una conectada a una red distinta. Su trabajo es pasar paquetes de una red a otra. Cada pata es una **interfaz**: el conector por donde entra y sale el cable.
- Un **paquete** es el sobrecito de datos que viaja por la red, con una dirección de origen y una de destino, igual que una carta.
- Una **ruta** es una frase que el router guarda en su memoria: "para llegar a tal red, mandá el paquete por tal interfaz". Al conjunto de esas frases se lo llama **tabla de enrutamiento**, y es lo único que el router consulta para decidir por dónde sale cada paquete.

Si venís del manual de enrutamiento dinámico, esto te va a sonar. Si no, no importa: acá repetimos lo necesario y lo explicamos desde cero. Lo que sí conviene tener a mano es la idea de que un router decide **paquete por paquete**, mirando su tabla.

---

## Índice

- [Del enrutamiento dinámico a OSPF: el salto a la práctica](#1-del-enrutamiento-dinámico-a-ospf-el-salto-a-la-práctica)
- [La ficha técnica de OSPF](#2-la-ficha-técnica-de-ospf)
- [El Router ID: el DNI del router](#3-el-router-id-el-dni-del-router)
- [Saludos y vecinos: el protocolo Hello](#4-saludos-y-vecinos-el-protocolo-hello)
- [Los estados de la vecindad: de no conocerse a Full](#5-los-estados-de-la-vecindad-de-no-conocerse-a-full)
- [Los tipos de red: cómo se comporta OSPF en cada medio](#6-los-tipos-de-red-cómo-se-comporta-ospf-en-cada-medio)
- [La métrica: por qué el costo ya no es un contador](#7-la-métrica-por-qué-el-costo-ya-no-es-un-contador)
- [Configuración básica: tres routers y una red](#8-configuración-básica-tres-routers-y-una-red)
- [Verificación: las preguntas que hay que hacerle a la red](#9-verificación-las-preguntas-que-hay-que-hacerle-a-la-red)
- [Los 5 errores más comunes (y su diagnóstico)](#10-los-5-errores-más-comunes-y-su-diagnóstico)
- [El invitado de piedra: la multi-área](#11-el-invitado-de-piedra-la-multi-área)
- [Comprobá lo que aprendiste](#12-comprobá-lo-que-aprendiste)
- [Glosario](#13-glosario)
- [Resumen en 10 puntos](#14-resumen-en-10-puntos)

Cómo usar este índice: cada título es un capítulo y también es la dirección (la URL) con la que se publica la página. Si tenés poco tiempo, el camino corto es el capítulo 1 (el modelo mental: qué es OSPF y cómo piensa), el 4 (cómo se conocen los routers), el 7 (cómo se mide un camino) y el 8 (la configuración mínima). Con esos cuatro ya podés armar un laboratorio de tres routers y hacerlo funcionar. El resto del manual es lo que necesitás para **diagnosticar** cuando algo no levanta: los estados del capítulo 5, la verificación del 9 y los errores del 10.

Una advertencia de método: este manual no empieza con comandos. Empieza con la idea. Un router no "ejecuta OSPF": un router **compara mapas** con los demás. Si entendés esa frase, los comandos del capítulo 8 se vuelven obvios, porque cada uno hace exactamente una cosa del mapa.

### Resumen

- OSPF es un protocolo de enrutamiento dinámico: descubre caminos solo, sin rutas escritas a mano.
- Es un estándar abierto, así que funciona en routers de cualquier fabricante.
- Este manual construye primero el modelo mental y después baja a los comandos.
- El camino corto son los capítulos 1, 4, 7 y 8; el resto es diagnóstico.

---

## 1. Del enrutamiento dinámico a OSPF: el salto a la práctica

En el tema de enrutamiento dinámico aprendiste qué es un protocolo de **estado de enlace**:

> Cada router publica su pedacito de red (un **LSA**), todos arman la misma **LSDB** (el mapa completo) y cada uno calcula su árbol con **SPF** (Dijkstra).

Eso era la teoría. Ahora llega la pregunta que separa a los que estudiaron de memoria de los que entendieron:

> **¿Y eso cómo se ve en un router de verdad? ¿Cómo se "publica" un LSA? ¿Cómo se descubre un vecino? ¿Qué comandos se configuran?**

La respuesta es **OSPF** (*Open Shortest Path First*, RFC 2328): el protocolo de estado de enlace más usado del mundo en redes internas. **RFC** son las siglas de *Request for Comments*, los documentos donde se publican los estándares de Internet (el capítulo 2 lo retoma). Y lo que acabás de aprender NO es teoría abstracta: cada pieza del tema anterior tiene su nombre de pila acá adentro.

Antes de la tabla, las cinco siglas que aparecen ahí, definidas de una vez:

- **LSA** son las siglas de *Link State Advertisement*, "anuncio de estado de enlace". Es el mensajito con el que un router cuenta qué tiene conectado y a qué costo. Es su pedacito del mapa.
- **LSDB** es *Link State Database*, "base de datos de estados de enlace". Es el mapa completo: la colección de todos los LSA que ese router recibió y guardó.
- **SPF** es *Shortest Path First*, "primero el camino más corto". Es el algoritmo (el de Dijkstra) con el que cada router, mirando el mapa completo, calcula cuál es su mejor camino hacia cada destino.
- **Flooding** es "inundación": la forma en que OSPF propaga un LSA nuevo a todos los routers del área, de vecino en vecino, como cuando tirás una piedra en un estanque.
- **Convergencia** es el momento en que todos los routers ya tienen el mismo mapa actualizado y tomaron la misma decisión. Una red "convergió" cuando dejó de haber desacuerdos.

Ahora sí, la tabla que traduce la teoría a nombres reales:

| Enrutamiento dinámico (teoría) | OSPF (realidad) |
|---------------------|------------------------|
| "Los routers se descubren" | Protocolo **Hello** (y los timers) |
| "Cada router publica su pedacito" | **LSA tipo 1 y 2** (en OSPF avanzado vas a ver los demás) |
| "Todos arman el mapa completo" | **LSDB** |
| "Cada uno calcula con Dijkstra" | El **SPF** que corre cada router al recibir un cambio |
| "Convergencia rápida" | Flooding inmediato del LSA + recálculo local |

Esta tabla tiene dos columnas y se lee como un diccionario de traducción: a la izquierda, la frase que aprendiste en el manual de enrutamiento dinámico; a la derecha, el nombre con el que esa misma idea aparece en un router Cisco. No son dos temas distintos: es el mismo tema contado dos veces, una en lenguaje abstracto y otra en lenguaje de máquina.

Fila por fila:

- **"Los routers se descubren" → Protocolo Hello.** Nadie escribe a mano la lista de vecinos. Cada router manda un saludo periódico y así se entera de quién está del otro lado del cable. En el capítulo 4 lo desarmamos.
- **"Cada router publica su pedacito" → LSA tipo 1 y 2.** El tipo 1 es el "router LSA": dice qué interfaces tiene ese router y cuánto cuestan. El tipo 2 es el "network LSA": lo genera el router designado (DR) de un segmento compartido y describe ese segmento. En este manual los usás sin mirarlos; en OSPF avanzado aparecen los otros tipos.
- **"Todos arman el mapa completo" → LSDB.** Cada router guarda una copia de todos los LSA del área. El objetivo de la vecindad, como vas a ver en el capítulo 5, es que las copias sean idénticas.
- **"Cada uno calcula con Dijkstra" → SPF.** El algoritmo corre local: cada router calcula su propio árbol de caminos. No hay un router "jefe" que calcule por todos.
- **"Convergencia rápida" → Flooding inmediato + recálculo local.** Cuando algo cambia, el LSA sale disparado hacia todos y cada router recalcula. Eso es lo que hace que OSPF reaccione en segundos y no en minutos.

> **Analogía:** el enrutamiento dinámico te enseñó el CÓDIGO DE TRÁNSITO (qué es un mapa, cómo se traza una ruta óptima). OSPF te entrega el AUTO y las LLAVES: cómo se enciende, cómo se conduce y qué significan los testigos del tablero. No podés manejar sin el auto, pero el auto sin el código tampoco te lleva a ningún lado.

### 1.1. El problema que OSPF resuelve

Imaginate una empresa con veinte routers. Cada router tiene que saber llegar a todas las redes de la empresa: la de Contaduría, la del depósito, la del servidor de facturación. Sin un protocolo, alguien tendría que escribir a mano, en cada uno de los veinte routers, una ruta hacia cada una de esas redes. Y cuando se rompe un cable o se agrega una sucursal, ese alguien tiene que volver a tocar los veinte.

Eso no escala, y no es solo cuestión de trabajo: es cuestión de tiempo. Un enlace se cae a las tres de la mañana y la red queda rota hasta que un humano reacciona.

OSPF resuelve exactamente eso: **que la red se entere sola del cambio y se reacomode sola**. Los routers se avisan entre ellos, cada uno actualiza su mapa y cada uno recalcula su mejor camino. A eso se lo llama **convergencia**, y es la razón de existir de todo protocolo de enrutamiento dinámico.

### 1.2. La idea central: el mismo mapa en todos, una ruta distinta en cada uno

Acá está el corazón del tema. Si te llevás una sola idea de este manual, que sea esta:

> **OSPF es un grupo de routers que se ponen de acuerdo en un mapa compartido. Primero todos dibujan exactamente el mismo mapa de la red; después, cada uno calcula su propia mejor ruta sobre ese mapa.**

Fijate en las dos mitades de la frase, porque son dos trabajos distintos y el orden importa:

1. **Ponerse de acuerdo en el mapa (sincronización).** Los routers se cuentan qué tienen conectado y cuánto cuesta cada enlace, hasta que todos tienen la misma copia. Mientras esa copia no sea idéntica, nadie calcula nada. Esto es lo que hacen los capítulos 4 y 5.
2. **Calcular la ruta propia (cálculo local).** Con el mapa ya igual para todos, cada router corre su propio algoritmo y decide por dónde manda sus paquetes. Dos routers con el mismo mapa llegan a rutas distintas, y está perfecto: cada uno está en un lugar distinto del mapa. Esto es el SPF del capítulo 7 y del 9.

> **Analogía de la ciudad:** pensá en un grupo de bomberos con varios cuarteles repartidos por la ciudad. Todos usan el **mismo plano** de la ciudad: las mismas calles, los mismos semáforos, las mismas obras. Ese plano compartido es la **LSDB**. Pero cada cuartel calcula **su** salida más rápida hasta el incendio, porque cada cuartel está en otra esquina. Ese cálculo propio es el **SPF**. Y si se corta una calle, alguien avisa, todos corrigen el plano y cada cuartel recalcula su recorrido. Nadie tiene que llamar a los cuatro cuarteles por teléfono.

Ese es todo OSPF. Lo demás son los detalles de cómo se avisan, cómo se ponen de acuerdo y cómo se mide "más rápido".

### 1.3. Vecinos: OSPF empieza con una conversación

Para compartir un mapa hay que hablarse. OSPF no tiene una lista de quién está conectado: lo **descubre**. En cada interfaz donde OSPF está activado, el router manda un saludo cada cierto tiempo a una dirección especial que todos los routers OSPF escuchan. Ese saludo se llama **Hello**, y el router del otro lado del cable, si también habla OSPF, contesta con el suyo.

Cuando los dos se escuchan y están de acuerdo en una serie de datos (capítulo 4), se declaran **vecinos**. Un **vecino** es, en este contexto, el router que está del otro lado de un enlace directo y con el que ya hay conversación OSPF. No es "cualquier router de la red": es el que está a un cable de distancia.

> **Analogía:** es el grupo de WhatsApp del edificio. No sabés de antemano quién vive en el 3.º B; mandás un mensaje al grupo y el que está ahí contesta. El Hello es ese mensaje: "acá estoy, soy este, estoy en este piso". Si el del 3.º B deja de contestar por un buen rato, lo sacás de tu lista de vecinos activos.

Los dos tiempos que hay que retener desde ahora: el Hello sale cada **10 segundos** y, si pasan **40 segundos** sin recibir uno, el vecino se declara caído (el **Dead timer**, el temporizador de muerte). Los dos números se desarrollan en el capítulo 4.

### 1.4. Áreas: el mapa se reparte en barrios, y el área 0 es la avenida central

Si la red es chica, todos los routers comparten un solo mapa. Pero cuando la red crece a cientos de routers, ese mapa único se vuelve enorme: cada router guarda todo y recalcula todo, aunque la mitad del mapa no le importe.

La solución de OSPF es partir el mapa en **áreas**: grupos de routers que comparten un mapa propio, más chico. Cada área tiene su propia LSDB. Los routers que están en el borde de dos áreas (los **ABR**, *Area Border Router*) son las puertas entre mapas: resumen lo de adentro y lo anuncian afuera.

Y hay una regla que no se negocia: **toda área tiene que tocar el área 0**. El **área 0** (o *backbone*, "columna vertebral") es el área central, y el tráfico entre áreas distintas pasa siempre por ella. No es un capricho de diseño: es la forma de evitar bucles y de que el mapa siga siendo predecible.

> **Analogía:** las áreas son **barrios** y el área 0 es la **avenida central**. Podés ir de un barrio a otro, pero el camino pasa por la avenida. Si un barrio no tiene salida a la avenida, queda aislado del resto de la ciudad aunque sus calles internas funcionen.

En este manual vas a configurar **una sola área: el área 0**. Eso se llama OSPF de área única y es lo que se usa en redes de decenas de routers. La multi-área es el capítulo 11, y el detalle fino queda para el manual de OSPF avanzado.

### 1.5. El costo: la métrica que se mide en ancho de banda

Cada protocolo tiene su forma de decidir qué camino es mejor. **RIP** (el protocolo viejo) cuenta **saltos**: cuántos routers hay en el camino, y listo. El problema es que un enlace de 10 Mbps y uno de 10 Gbps cuentan igual: los dos son "un salto". En una red moderna eso es como elegir el camino por cantidad de semáforos sin mirar si la avenida está free o hecha un nudo.

OSPF mide distinto: cada enlace tiene un **costo**, y ese costo sale del **ancho de banda** del enlace. Más rápido el enlace, menos costo. El costo de un camino es la **suma** de los costos de todos los enlaces por los que pasa, y OSPF elige el camino de menor costo total.

> **Analogía del peaje:** el costo es el peaje combinado de la ruta. Un camino de tres autopistas (3 peajes de 1) le gana a uno de dos rutas de montaña (2 peajes de 64), aunque el segundo tenga menos tramos. OSPF no cuenta tramos: suma peajes.

La fórmula exacta y sus consecuencias (incluido el problema de que todos los enlaces rápidos terminan costando lo mismo) están en el capítulo 7. Por ahora alcanza con la idea: **más ancho de banda, menos costo, camino preferido**.

### 1.6. Los LSA: qué publica cada router, en términos simples

El mapa no aparece de la nada: se arma con los pedazos que publica cada router. Cada pedazo es un **LSA**, y un LSA es una frase del tipo "yo, el router 2.2.2.2, tengo un enlace hacia la red 10.0.0.0/30 y cuesta 1".

Hay dos tipos que importan en este manual:

- **LSA tipo 1 (router LSA):** lo genera cada router, y describe sus enlaces y sus costos. Es la lista de calles que salen de esa esquina.
- **LSA tipo 2 (network LSA):** lo genera el router designado de un segmento compartido (por ejemplo, un switch con varios routers colgados) y describe ese segmento como si fuera un nodo más del mapa.

Los routers intercambian estos LSA hasta que todos tienen la misma colección: la LSDB. Y cuando llega un LSA nuevo o cambia uno viejo, el router lo inunda a sus vecinos y todos recalculan. Eso es lo que hace que la red converja sola.

> **Detalle que evita una confusión:** el LSA no dice "el camino a tal red es este". El LSA dice solamente "este cable cuesta esto". El camino lo calcula cada router. Por eso dos routers pueden tener el mismo mapa y rutas distintas: el mapa es el mismo, la posición en el mapa no.

### 1.7. Qué promete este manual

**Promesa de este manual:** al final vas a poder configurar OSPF en tres routers, ver la vecindad en `Full`, ver las rutas `O` en la tabla y — lo más importante — **diagnosticar por qué un vecino no levanta**. Eso último es el 50% de cualquier examen real.

### Resumen

- OSPF es un grupo de routers que acuerdan un mismo mapa y después cada uno calcula su propia mejor ruta.
- Los vecinos se descubren con el Hello, que sale cada 10 s y declara muerto al que no contesta en 40 s.
- Las áreas son barrios del mapa; el área 0 es la avenida central y toda área tiene que tocarla.
- El costo sale del ancho de banda: más rápido el enlace, menos costo, y los costos se suman en el camino.
- Los LSA son los pedazos del mapa que publica cada router; la LSDB es la colección de todos.

---

## 2. La ficha técnica de OSPF

Antes de tocar un comando, el retrato hablado:

| Característica | Valor |
|----------------|-------|
| Familia | **Estado de enlace** (link-state) |
| Métrica | **Costo** (basada en ancho de banda del enlace) |
| AD | **110** |
| Transporte | **IP protocol 89** (no TCP ni UDP) |
| Multicast | **224.0.0.5** (todos los routers OSPF) · **224.0.0.6** (solo DR/BDR) |
| Hello / Dead | 10 s / 40 s por defecto (en broadcast y point-to-point) |
| Versiones | OSPFv2 = IPv4 (este tema) · OSPFv3 = IPv6 (tema de OSPFv3) |
| Áreas | Dividido en **áreas**; la **área 0** (backbone) siempre existe |
| Estándar | Abierto (RFC) — funciona en cualquier fabricante |
| Escenario típico | Red interna de empresa: decenas a miles de routers |

Esta tabla es la ficha del protocolo: nueve datos que sirven para reconocerlo en cualquier examen o conversación técnica. La primera columna nombra la **característica** y la segunda da su **valor**. Vale la pena leerla dos veces, porque casi todos los datos de acá reaparecen más adelante en el manual.

Fila por fila:

- **Familia: estado de enlace.** Hay dos grandes familias de protocolos dinámicos. Los de **vector distancia** (como RIP) funcionan como un chisme: cada router le pregunta al vecino "¿vos por dónde llegás?", y confía. Los de **estado de enlace** funcionan como un plano: cada uno publica sus propios cables y todos arman el mapa completo. OSPF es de los segundos.
- **Métrica: costo.** Ya la presentamos en el capítulo 1; el capítulo 7 la desarma con fórmula. Es un número por enlace, basado en el ancho de banda, y se suma a lo largo del camino.
- **AD: 110.** **AD** son las siglas de *Administrative Distance*, "distancia administrativa": un número que expresa cuánto confía el router en la **fuente** de una ruta. Menor es más confiable. OSPF tiene 110; una ruta estática tiene 1 y RIP tiene 120. Si te perdiste esta parte, está explicada completa en el manual de selección de rutas; acá basta con saber que OSPF pierde contra una estática y gana contra RIP.
- **Transporte: IP protocol 89.** OSPF no usa **TCP** (*Transmission Control Protocol*) ni **UDP** (*User Datagram Protocol*), los dos protocolos de transporte que seguramente viste. Habla directo sobre **IP** (*Internet Protocol*), el protocolo que mueve los paquetes, y se identifica con el número 89. Ojo con la diferencia: TCP y UDP usan **puertos** (como el 80 o el 443), pero el "protocolo IP" es un campo aparte del paquete, que dice qué hay adentro.
- **Multicast: 224.0.0.5 y 224.0.0.6.** **Multicast** es el envío a un grupo de destinatarios con una sola dirección: un mensaje que llega a todos los anotados en la lista. La 224.0.0.5 es la lista "todos los routers OSPF de este segmento": ahí van los Hellos. La 224.0.0.6 es la lista "solo los routers designados (DR y BDR)": ahí van las actualizaciones en redes compartidas.
- **Hello / Dead: 10 s / 40 s.** El saludo sale cada 10 segundos y el vecino se declara muerto a los 40 sin saludos. Esos son los valores por defecto en redes **broadcast** (como Ethernet) y **point-to-point** (un cable de un router a otro). En otros tipos de red los valores cambian; el capítulo 6 lo menciona.
- **Versiones: OSPFv2 y OSPFv3.** **OSPFv2** es la versión que transporta direcciones **IPv4** (la versión 4 de IP, la que se escribe como cuatro números separados por puntos). **OSPFv3** es la versión para **IPv6**, la versión más nueva y más larga. Se parecen mucho en concepto y cambian en los detalles; este manual es OSPFv2.
- **Áreas: dividido en áreas, con el área 0 siempre presente.** Ya lo vimos en el capítulo 1: el área 0 es el backbone y es obligatoria. Es la única "regla de arquitectura" de OSPF que no admite excepciones prácticas.
- **Estándar: abierto (RFC).** **RFC** son las siglas de *Request for Comments*, los documentos donde se publican los estándares de Internet. Como OSPF está en una RFC, cualquier fabricante puede implementarlo y todos se entienden. Es la diferencia grande con protocolos propietarios como EIGRP, que solo funciona entre equipos del mismo fabricante.
- **Escenario típico: red interna de empresa.** OSPF es el protocolo de las redes corporativas y de las universidades: desde una oficina con diez routers hasta una red con miles. Los proveedores de Internet suelen usar otro (IS-IS o BGP), pero eso es otro manual.

Tres datos de esta tabla merecen párrafo propio: el Router ID (§3), el Hello (§4) y el costo (§7). El resto, lo vas tocando en el camino.

> **Dato para la mesa de examen:** OSPF no usa TCP ni UDP — habla directo por **IP protocol 89**. Cuando veas "protocolo IP 89" en un filtro de ACL o un examen, pensá OSPF. (RIP usa UDP 520, BGP usa TCP 179: cada protocolo elige su transporte.)

Una **ACL** (*Access Control List*, lista de control de acceso) es una lista de reglas que dice qué tráfico pasa y qué tráfico se descarta en un router. Se escribe mirando direcciones y protocolos, y por eso el "IP 89" aparece ahí: si querés bloquear OSPF, tenés que saber que no es TCP ni UDP.

### 2.1. Lo que esta ficha no te dice

La tabla dice qué es OSPF, pero no dice cómo se comporta. Eso es lo que viene: cómo se identifica cada router (capítulo 3), cómo se conocen (4), cómo se saludan hasta sincronizarse (5), cómo se adapta al cable (6), cómo mide (7), cómo se configura (8) y cómo se verifica (9).

Si en algún momento te perdés, volvé acá: nueve datos, dos columnas. Es la lista de control de que estás hablando de OSPF y no de otro protocolo.

### Resumen

- OSPF es de la familia de estado de enlace: cada router publica sus enlaces y todos arman el mismo mapa.
- Su métrica es el costo por ancho de banda, su AD es 110 y no usa TCP ni UDP: va por IP protocol 89.
- Usa dos direcciones multicast (224.0.0.5 para todos, 224.0.0.6 para los designados) y saluda cada 10 s con un Dead de 40 s.
- Es un estándar abierto, así que funciona en cualquier fabricante; el escenario típico es la red interna de una empresa.

---

## 3. El Router ID: el DNI del router

### 3.1. Qué es y para qué sirve

El **Router ID (RID)** es un número de 32 bits (una dirección IPv4 cualquiera) que identifica **de forma única** a cada router dentro del dominio OSPF. No tiene que ser una IP real de la red: es como el DNI, un identificador.

Conviene separar dos cosas que se confunden todo el tiempo:

- La **dirección IP de una interfaz** es la dirección con la que ese router es alcanzable por ese cable. Sirve para mandarle paquetes.
- El **Router ID** es el nombre con el que ese router firma sus LSA. Sirve para saber **quién dijo qué** dentro del mapa.

Pueden coincidir (y de hecho es lo recomendable), pero no son lo mismo. Un router puede tener un RID `1.1.1.1` que no sea la dirección de ninguna de sus interfaces, y OSPF funciona igual: en el mapa va a figurar como "el router 1.1.1.1".

**Para qué importa:** en la LSDB, tu `router-id 1.1.1.1` identifica que "tal LSA lo publicó tal router". Si dos routers tienen el MISMO RID... la red se vuelve un caos: los LSA se pisan, las adyacencias no levantan o levantan mal. Es la primera causa de "no me anda y no sé por qué".

Pensalo así: si en una oficina hay dos empleados con el mismo número de legajo, cada trámite que llegue con ese número es una lotería. OSPF hace lo mismo: cuando ve un LSA firmado "1.1.1.1" no sabe si es el router de la sala de servidores o el del segundo piso, así que descarta o pisa información.

> **Analogía:** el RID es el **DNI del router**. El DNI no dice dónde vivís ni sirve para mandarte una carta: sirve para que no te confundan con otro. La dirección IP es la dirección de tu casa; el RID es tu número de documento.

### 3.2. Cómo se elige (la regla de oro)

OSPF elige su RID automáticamente, en este orden:

```text
1. Si configuraste `router-id X.X.X.X` a mano → ESE (manda siempre)
2. Si no: el IPv4 más alto de las interfaces LOOPBACK
3. Si no hay loopback: el IPv4 más alto de las interfaces actividad
4. Como último recurso: elige y listo (y te banca con un mensaje feo)
```

Este bloque es la receta que sigue OSPF para elegir su propio nombre. Son cuatro pasos y se prueban **en orden**: el primero que da resultado gana y los siguientes no se miran. Leelo de arriba hacia abajo, como una lista de prioridades.

Paso por paso:

1. **`router-id X.X.X.X` configurado a mano.** Si vos le pusiste un nombre, OSPF lo respeta siempre, pase lo que pase con las interfaces. Es el único caso en que el RID es predecible de verdad.
2. **La loopback con la IP más alta.** Si no configuraste nada, OSPF busca entre las interfaces de tipo **loopback** (una interfaz virtual, que no depende de ningún cable; la explicamos en el capítulo 8) y elige la dirección IPv4 más alta.
3. **La interfaz activa con la IP más alta.** Si no hay ninguna loopback, mira las interfaces que están activas (con cable, con IP y en estado "up") y se queda con la dirección más alta.
4. **Último recurso.** Si no hay ninguna interfaz con IP, el router elige algo por su cuenta y avisa con un mensaje de advertencia. Ese caso es el que hay que evitar: un RID que depende de la nada cambia cuando cambia la nada.

> **Nota de una línea:** en el paso 3 el original escribe "interfaces actividad"; la palabra correcta es "interfaces activas" (las que están up). El sentido del paso es ese.

> **La regla de oro que te va a salvar la vida:** **JAMÁS dependas de la elección automática.** Configurá `router-id` a mano en cada router de la red. ¿Por qué? Porque si el router apaga una interfaz o cambia una IP, el RID automático **puede cambiar**, y OSPF reinicia las vecindades (con su corte de tráfico). Un RID fijo = estabilidad.

Un detalle que completa la idea: si el RID cambia, lo que cambia es la **firma de todos los LSA de ese router**. Los vecinos ven aparecer un router "nuevo" y desaparecer el viejo, y toda la vecindad se rearma. Por eso un RID estable no es un detalle cosmético: es lo que evita que la red se sacuda sin motivo.

### 3.3. El patrón de buen vecino

Convención práctica (la ves en todas las empresas serias): el RID es la IP de la **loopback 0**, que además se usa para conectividad de gestión:

```text
R1: loopback 0 = 1.1.1.1
R2: loopback 0 = 2.2.2.2
R3: loopback 0 = 3.3.3.3
```

Este bloque muestra la convención aplicada a los tres routers del laboratorio del capítulo 8. Cada línea tiene el mismo formato: el nombre del router, la interfaz `loopback 0` y la dirección que le toca. No es un comando, es un plan de direccionamiento: lo que vas a escribir después en la configuración.

Y el porqué de cada línea: el router uno usa `1.1.1.1`, el dos usa `2.2.2.2` y el tres usa `3.3.3.3`. El número del router se repite en los cuatro octetos. Es una convención, no una obligación: podrías usar cualquier dirección. La gracia es que sea **fácil de leer de un vistazo**.

Así de un vistazo al `show ip ospf neighbor` sabés QUIÉN es quién. Y no lo digo yo: es el patrón de diseño que ves en los laboratorios del CCNA y en producción.

> **HACELO VOS:** en el laboratorio de la sección 8, la loopback 0 de cada router llevará su RID. Configurá SIEMPRE `router-id` explícito. Cuando en el futuro veas el vecino "2.2.2.2", vas a saber sin mirar un diagrama que es R2.

Este patrón tiene un premio escondido: la loopback 0 no se cae cuando se cae un cable. Si además la anunciás por OSPF (capítulo 8), cada router alcanza la "IP de gestión" de los demás por la red y no por una ruta escrita a mano. Eso es lo que permite administrar un router que está a diez saltos de distancia.

### Resumen

- El Router ID es el nombre único con el que cada router firma sus LSA; no es la dirección de una interfaz.
- Se elige en orden: `router-id` manual, después la loopback más alta, después la interfaz activa más alta.
- Nunca lo dejes librado al azar: si cambia, se rearman las vecindades y se corta el tráfico.
- La convención sana es loopback 0 = RID, con un número fácil de recordar por router (1.1.1.1, 2.2.2.2…).
- RID duplicado significa LSA pisados y vecindades inestables: es la primera causa de fallas raras.

---

## 4. Saludos y vecinos: el protocolo Hello

### 4.1. La primera pieza de OSPF: encontrarse

OSPF no "asume" que su vecino existe: lo **descubre** con el protocolo **Hello** (RFC dice "saludo"). Cada router, en cada interfaz OSPF, manda Hellos periódicos (por defecto cada **10 segundos**) al multicast **224.0.0.5**.

```text
R1 ── Hello (router-id 1.1.1.1, área 0, timers 10/40) ──► R2
R2 ── Hello (router-id 2.2.2.2, área 0, timers 10/40) ──► R1
      ... y así cada 10 segundos ...
```

Este bloque dibuja la conversación mínima de OSPF. Se lee así: a la izquierda el router que manda, la flecha indica la dirección del mensaje y a la derecha el que recibe. Entre paréntesis va el **contenido** del saludo, que es la parte importante: no es un "hola" vacío, es una ficha con datos.

Desarmemos el contenido, porque es lo que después vas a verificar:

- **`router-id`**: quién soy. Es la firma del capítulo 3.
- **`área 0`**: en qué barrio del mapa estoy. Si el otro está en otra área, no vamos a ser vecinos.
- **`timers 10/40`**: cada cuánto saludo y cuánto espero antes de declararte muerto. Los dos routers tienen que tener los mismos números.
- **`... y así cada 10 segundos ...`**: el saludo no es un evento único, es un latido que se repite. Si se corta, se nota.

El Hello es la declaración de presencia: "Acá estoy, soy este, estoy en esta área, con estos timers". Es también el **latido**: si no llega un Hello de R2 en **40 segundos** (el Dead timer), R1 declara a R2 caído y **recalcula**.

> **Analogía:** el Hello es el "¿seguís ahí?" de WhatsApp. Mientras el otro responde, la amistad sigue. Cuando deja de responder 40 segundos, OSPF corta la relación, avisa a todos (flooding de un LSA) y recalcula. ¿Quién manda los avisos? El título de la sección 9 te cuenta.

Una precisión sobre el "avisa a todos": cuando un vecino se cae, el router que lo detectó genera un LSA nuevo diciendo "ese enlace ya no está" y lo inunda por el área. Los demás routers actualizan el mapa y recalculan. Es exactamente el mecanismo de la ciudad del capítulo 1: alguien avisa que se cortó la calle y todos corrigen el plano.

> **Nota de una línea:** el original escribe "Hells" en varios lugares; el paquete se llama **Hello** y el plural es **Hellos**. Dejamos las líneas originales tal cual para no perder contenido, pero escribilo bien en un examen.

### 4.2. ¿Cuándo dos routers se vuelven "vecinos"?

No alcanza con escucharse. Para formar vecindad, los Hellos deben coincidir en:

| Requisito | Si no coincide... |
|-----------|-------------------|
| **Misma área** | No se vuelven vecinos |
| **Mismos timers** (Hello/Dead) | No se vuelven vecinos (los timers van en el Hello) |
| **Misma área de red** (stub, NSSA — tipos que vienen con OSPF avanzado) | No se vuelven vecinos |
| **Misma autenticación** (si está habilitada) | No se vuelven vecinos |
| **Misma subred / misma máscara** | No se vuelven vecinos (¡salvo en point-to-point con parámetros aparte!) |
| RID únicos | El fantasma del RID duplicado (sección 10) |

Esta tabla es, sin exagerar, la herramienta de diagnóstico más útil del manual. Tiene dos columnas: el **requisito** que los dos routers tienen que compartir, y **qué pasa si no coincide**. Si un vecino no levanta, se recorre esta lista de arriba hacia abajo y casi siempre se encuentra el culpable.

Fila por fila:

- **Misma área.** El campo "área" viaja en el Hello. Si R1 está configurado en el área 0 y R2 en el área 1, los dos se escuchan pero no se aceptan: cada uno cree que el otro pertenece a otro mapa. Es el error número 4 del capítulo 10.
- **Mismos timers (Hello/Dead).** El Hello de R1 dice "saludo cada 10 y te espero 40"; el de R2 tiene que decir exactamente lo mismo. No se negocia ni se promedia: o son iguales, o no hay vecindad.
- **Misma área de red (stub, NSSA).** Además del número de área, importa el **tipo** de área. Un área **stub** es un área que no recibe rutas externas, y un **NSSA** (*Not-So-Stubby Area*) es una variante que sí las recibe de forma controlada. Los dos routers del enlace tienen que coincidir en el tipo. Son temas de OSPF avanzado; acá solo necesitás saber que existen y que también se comparan.
- **Misma autenticación.** OSPF puede pedir una contraseña (autenticación) para aceptar Hellos. Si un lado la tiene activada y el otro no, o si las claves no coinciden, los saludos se descartan aunque lleguen.
- **Misma subred / misma máscara.** Los dos extremos de un enlace tienen que estar en la misma red y con la misma máscara, porque si no, cada uno considera que el otro está "en otra red" y no hay enlace directo. La excepción que menciona la fila es el enlace **point-to-point** (un cable entre dos routers), donde OSPF puede aceptar extremos en subredes distintas si se configura así.
- **RID únicos.** No es un campo que se compare en el Hello, pero rompe la vecindad igual: si los dos routers se presentan con el mismo nombre, la relación se cae y vuelve en un ciclo. Es el "fantasma" del capítulo 10.

**Memorizá esta tabla.** Cuando algo "no levanta" en OSPF, el 90% de las veces el motivo está acá: un timer distinto, un área mal puesta, una máscara que no matchea. El `show ip ospf neighbor` te muestra el síntoma; esta tabla te da la causa.

> **Dato curioso que enamora a los examinadores:** el Dead timer no se negocia — se iguala. En Cisco, si R1 tiene Hello 10 / Dead 40 y R2 Hello 5 / Dead 20, **ninguno de los dos se adapta**: la vecindad NO se forma hasta que coincidan exactamente. OSPF no transa en los timers.

### 4.3. Cómo se ve un Hello cuando falla

Si los timers no coinciden, el síntoma típico es un vecino que aparece un instante y desaparece, o que se queda clavado en un estado temprano. Si el área no coincide, el vecino ni siquiera aparece en la lista. Si lo que falla es la autenticación, los paquetes llegan pero se descartan y el vecino tampoco aparece.

Esa diferencia de síntomas es la que te permite adivinar la causa antes de mirar la configuración: **lo que no aparece es un problema de aceptación** (área, autenticación, subred), y **lo que aparece y no avanza es un problema de acuerdo** (timers distintos, RID repetido, configuración que no coincide). El capítulo 5 le pone nombre a cada uno de esos momentos.

### Resumen

- El Hello es el saludo periódico (10 s) que descubre y mantiene vecinos; va al multicast 224.0.0.5.
- Si en 40 s no llega un Hello, el vecino se declara caído y la red recalcula.
- Para ser vecinos hay que coincidir en área, timers, tipo de área, autenticación y subred, y tener RID únicos.
- Los timers no se negocian: o son idénticos en los dos extremos, o no hay vecindad.
- Esta tabla de requisitos es la lista de sospechosos cuando una vecindad no levanta.

---

## 5. Los estados de la vecindad: de no conocerse a Full

Cuando forman vecindad, los routers pasan por **estados** (en orden):

```text
Down ──► Init ──► 2-Way ──► ExStart ──► Exchange ──► Loading ──► FULL
 │        │         │         │           │            │           │
 │        │         │         │           │            │           └── ¡acuerdo total!
 │        │         │         │           │            └── pide los LSA que le faltan
 │        │         │         │           └── intercambia DBD (descripciones)
 │        │         │         └── elige maestro/esclavo (RID mayor = maestro)
 │        │         └── ¡se ven! (en broadcast, acá se eligen DR/BDR — tema de OSPF avanzado)
 │        └── recibió un Hello que lo menciona a él... llevo así un rato
 └── no recibió nada todavía
```

Este bloque es una línea de tiempo dibujada en vertical. La fila de arriba tiene los siete estados en orden, de izquierda a derecha, unidos por flechas: se avanza de uno al siguiente, nunca se saltea. Cada columna tiene debajo, en vertical, una frase que explica qué pasa en ese estado; la línea que baja desde cada nombre y el codo `└──` la conectan con su descripción.

Leelo como el recorrido de una amistad que se formaliza:

- **Down**: la columna de la izquierda, con la descripción más abajo de todo: "no recibió nada todavía". Es el punto de partida.
- **Init**: "recibió un Hello que lo menciona a él". Acá el original está impreciso: Init es el estado en el que **recibí un Hello pero mi nombre todavía no aparece en él**. Cuando el Hello del otro **sí me menciona**, se pasa a 2-Way. La descripción del dibujo describe, en realidad, esa transición; la tabla de abajo lo dice con más precisión. Lo dejamos anotado para que no te confunda.
- **2-Way**: "¡se ven!" — los dos se nombraron mutuamente. En las redes de tipo broadcast, acá se eligen el **DR** (*Designated Router*, router designado) y el **BDR** (*Backup Designated Router*, designado de respaldo). Es tema de OSPF avanzado; por ahora quedate con que existen y con que son una optimización.
- **ExStart**: "elige maestro/esclavo (RID mayor = maestro)". Los dos se ponen de acuerdo en quién lleva la conversación. El que tiene el RID más alto es el maestro.
- **Exchange**: "intercambia DBD (descripciones)". Se pasan los **DBD** (*Database Description*, descripción de base de datos): un índice de qué LSA tiene cada uno, sin los LSA completos.
- **Loading**: "pide los LSA que le faltan". Con el índice en la mano, cada uno pide los tomos que no tiene.
- **FULL**: "¡acuerdo total!". Las dos LSDB son idénticas. Recién acá OSPF confía en el mapa y corre el cálculo.

La palabra **adyacencia** merece una aclaración, porque en el resto del manual aparece: dos routers son **vecinos** apenas se ven en los Hellos (estado 2-Way), pero son **adyacentes** cuando llegan a Full. La adyacencia es la amistad completa: mapa compartido y sincronizado.

Ahora la misma información en tabla, que es como la vas a necesitar en un examen:

| Estado | Qué pasa | En cristiano |
|--------|----------|--------------|
| **Down** | No recibió ningún Hello | "No sé que existís" |
| **Init** | Recibió Hells pero no lo mencionan a él | "Veo que alguien saluda, pero no me nombra" |
| **2-Way** | Se vieron mutuamente en los Hells | "¡Nos saludamos los dos!" (en broadcast acá se elige al DR) |
| **ExStart** | Negocian quién empieza (el RID mayor) | "Vos arrancás o arranco yo" |
| **Exchange** | Se pasan los DBD (resúmenes de LSDB) | "Te muestro el índice de mi enciclopedia" |
| **Loading** | Piden los LSA que no tienen | "Pasame el tomo 3, no lo tengo" |
| **Full** | LSDB sincronizadas | "Tenemos la misma enciclopedia" → corren SPF |

Esta tabla tiene tres columnas: el **estado** (el nombre técnico que vas a ver en pantalla), **qué pasa** en términos del protocolo y una traducción **en cristiano**, que es la frase que te tenés que repetir para entender el momento. La segunda columna es la definición; la tercera es la que te va a servir en el diagnóstico, porque es la que te dice si el proceso está sano o trabado.

Leela de arriba hacia abajo, como el avance de una conversación:

- **Down → Init:** el router pasó de no escuchar nada a escuchar saludos. Pero los saludos ajenos no lo nombran, así que todavía no hay confirmación mutua.
- **Init → 2-Way:** ahora el Hello del otro lo nombra a él. Ahí sí: se conocen oficialmente. En una red compartida, en este momento se elige el DR del segmento.
- **2-Way → ExStart:** empieza el trabajo pesado. Negocian los números de secuencia y quién manda en el intercambio (el RID más alto).
- **ExStart → Exchange:** cada uno manda el índice de su base de datos. Todavía no viajaron los LSA: solo los títulos.
- **Exchange → Loading:** comparando índices, cada uno detecta qué le falta y lo pide.
- **Loading → Full:** se completan los pedidos y las dos bases quedan iguales. Desde acá, cualquier cambio se inunda y se recalcula.

> **El estado que te van a preguntar (siempre):** **Full** es el estado de una relación sana. **2-Way** es sano SOLO en redes broadcast entre routers que no son DR ni BDR (se explican con OSPF avanzado). Cualquier otro estado "trabado" (Init que no avanza, ExStart eterno, Loading que no termina) es un problema para diagnosticar.

> **Analogía (el algoritmo del viaje):** Down = "no conozco a nadie". Init = "veo viajeros pero no me registran". 2-Way = "nos reconocemos". ExStart = "¿vos traés el mapa o lo traigo yo?" Exchange = "nos mostramos nuestros mapas". Loading = "me faltan tres zonas, pasámelas". Full = "tenemos la MISMA enciclopedia" — recién ahí confiás en el cálculo del otro... y en el tuyo.

### 5.1. Dónde se traba y qué significa

Un vecino que no avanza se queda clavado en un estado, y cada estado clavado apunta a un sospechoso distinto:

- **Clavado en Down:** no llega ningún Hello. O la interfaz está apagada, o no tiene IP, o el otro extremo no tiene OSPF en esa interfaz, o hay un `passive-interface` de por medio (capítulo 10).
- **Clavado en Init:** llegan Hellos pero no me nombran. Casi siempre es un problema de **timers** distintos, o de un extremo que no está aceptando al otro.
- **En 2-Way para siempre:** puede ser normal en una red compartida (si ninguno es DR ni BDR), pero entre dos routers que deberían ser adyacentes indica que la elección de DR/BDR no terminó de resolver.
- **Clavado en ExStart:** los dos no se ponen de acuerdo en quién manda. Suele haber algo distinto entre los dos lados: un RID repetido o una configuración que no coincide.
- **Clavado en Loading:** se pidieron LSA y no llegan. El intercambio empezó pero no se completa.

El patrón es siempre el mismo: **el estado te dice en qué paso de la conversación se cortó, y la tabla del capítulo 4 te dice por qué**. No hace falta adivinar.

### 5.2. La regla de oro de la lectura de estados

Cuando mires `show ip ospf neighbor` (capítulo 9), no te preguntes "¿está bien o mal?". Preguntate **"¿en qué estado está y qué le falta para el siguiente?"**. Full es el final feliz; 2-Way puede ser un final feliz en un caso específico; todo lo demás es una conversación a medio terminar, y una conversación a medio terminar siempre tiene una causa concreta en la tabla de requisitos.

### Resumen

- La vecindad avanza en siete estados, siempre en orden: Down, Init, 2-Way, ExStart, Exchange, Loading y Full.
- Full significa LSDB sincronizadas: es el estado sano y el único en el que se corre el cálculo.
- 2-Way es sano solo en redes compartidas entre routers que no son DR ni BDR.
- Vecino y adyacente no son lo mismo: se es vecino en 2-Way y adyacente en Full.
- Cada estado clavado apunta a un sospechoso distinto de la tabla de requisitos.

---

## 6. Los tipos de red: cómo se comporta OSPF en cada medio

OSPF se adapta al medio físico. Los tipos que verás en el 95% de los casos:

| Tipo de red | Cómo se comporta | Cuándo lo ves |
|-------------|------------------|---------------|
| **Broadcast** | Forma adyacencias FULL solo con el **DR/BDR** (los demás quedan en 2-Way entre sí) · multicast 224.0.0.5/6 | Ethernet (switches) |
| **Point-to-point** | Forma FULL directo con el único vecino · sin elección de DR | Serial, enlaces punto a punto, tuneles |
| **Non-broadcast (NBMA)** | Como broadcast pero necesita configuración manual del vecino (Frame Relay — legado) | Redes viejas con Frame Relay |
| **Point-to-multipoint** | Trata cada destino como un punto a punto | Redes satelitales, hub-and-spoke |

Esta tabla tiene tres columnas: el **tipo de red** tal como lo nombra OSPF, **cómo se comporta** el protocolo en ese medio y **cuándo lo ves**, o sea en qué tecnología real aparece. La segunda columna es la que importa para entender el comportamiento; la tercera es la que te permite reconocerlo en un laboratorio.

Antes de las filas, dos definiciones que la tabla usa todo el tiempo:

- Una red **broadcast** es la que comparte el medio: todos los equipos conectados al mismo switch se escuchan entre sí, y un mensaje enviado a "todos" llega a todos. Es el caso de **Ethernet**, la tecnología de cable de red que usás todos los días.
- Una red **point-to-point** ("punto a punto") es un cable que une exactamente dos equipos: no hay terceros escuchando. Es el caso de un enlace **serial** (los cables de routers viejos) o de un enlace dedicado entre dos sedes.

Fila por fila:

- **Broadcast.** Todos los routers del segmento se ven entre sí, pero no forman adyacencia con todos: eligen un **DR** (designado) y un **BDR** (respaldo) y todos se sincronizan solo con esos dos. Los demás quedan en 2-Way entre ellos. Usa las dos direcciones multicast: la 224.0.0.5 para los Hellos de todos y la 224.0.0.6 para los mensajes que solo van al DR.
- **Point-to-point.** No hay terceros, así que no hace falta elegir representante: los dos routers forman FULL directo. Sin DR, sin BDR, sin elección. Es el caso de un serial o de un enlace dedicado.
- **Non-broadcast (NBMA).** **NBMA** son las siglas de *Non-Broadcast Multi-Access*, "multi-acceso sin difusión": un medio que se comporta como broadcast (varios routers comparten el medio) pero no soporta el envío a "todos" de forma nativa, así que hay que decirle a mano quiénes son los vecinos. El ejemplo clásico es **Frame Relay**, una tecnología de los años noventa que hoy casi no se usa (por eso la columna dice "legado": algo que quedó del pasado).
- **Point-to-multipoint.** Un router central habla con varios remotos como si cada uno fuera un enlace punto a punto. Aparece en redes satelitales y en diseños **hub-and-spoke** ("centro y radios"): una sede central y varias sucursales colgando de ella.

> **Impacto práctico (esto explica OSPF avanzado):** en un enlace **Ethernet** (broadcast), si hubiera 10 routers en el mismo segmento, cada router tendría que formar adyacencia con los otros 9: 45 adyacencias, un festival de LSA. OSPF resuelve con la elección de **DR/BDR** (Designated/BDR): todos se sincronizan solo con el DR (adiós festival). Ese es el tema estrella de OSPF avanzado. Por ahora: **sabé que en broadcast se elige un DR, y que eso es OPTIMIZACIÓN, no capricho.**

La cuenta de las 45 adyacencias sale de contar pares: con 10 routers, cada uno tiene 9 posibles interlocutores, y como la conversación es de a dos, son 10 × 9 / 2 = 45. Con 100 routers en el mismo segmento serían 4950. El DR reduce todo eso a una conversación por router.

> **Dato de configuración que salva vidas:** en Cisco, los enlaces **seriales** (HDLC/PPP) son point-to-point por defecto → sin DR, vecindad directa, FULL con el vecino. Si tu vecindad Ethernet "trabada" te confunde, recordá la regla de segmento de broadcast y el DR.

**HDLC** (*High-Level Data Link Control*) y **PPP** (*Point-to-Point Protocol*) son dos formas de encapsular datos en un enlace serial: las dos definen cómo se arma la trama que viaja por ese cable de dos puntas. No hace falta el detalle: alcanza con saber que las dos son point-to-point, y que por eso OSPF no elige DR ahí.

### 6.1. Por qué importa saber el tipo de red

El tipo de red cambia tres cosas de golpe: si hay DR o no, qué dirección multicast se usa y qué timers corren por defecto. Por eso, cuando una vecindad no levanta, una de las primeras preguntas es "¿qué tipo de red cree cada extremo que es?". Si un lado cree que es broadcast y el otro que es point-to-point, los dos hablan idiomas distintos en el mismo cable.

En el laboratorio del manual todo es Ethernet, así que todo es broadcast y hay DR. Con eso alcanza para el 90% de los casos reales de una red de empresa.

### Resumen

- OSPF cambia de comportamiento según el medio: broadcast, point-to-point, NBMA o point-to-multipoint.
- En broadcast se elige un DR (y un BDR) y todos se sincronizan con él; los demás quedan en 2-Way entre sí.
- El DR no es un capricho: evita que N routers formen N×(N−1)/2 adyacencias.
- En point-to-point no hay DR: los dos routers van directo a Full.
- Si los dos extremos no coinciden en el tipo de red, hablan idiomas distintos y la vecindad no cierra.

---

## 7. La métrica: por qué el costo ya no es un contador

### 7.1. La fórmula

OSPF usa **costo** por enlace, y el costo es inversamente proporcional al ancho de banda:

```text
costo = costo-referencia / ancho de banda del enlace

costo-referencia por defecto = 100 Mbps (100.000.000 bits/s)

┌──────────────────┬─────────────┐
│ Enlace           │ Costo OSPF  │
├──────────────────┼─────────────┤
│ 100 Mbps         │ 100/100 = 1 │
│ 1 Gbps           │ 100/1000 → 1 (mínimo 1) │
│ 10 Mbps          │ 100/10 = 10 │
│ 1.544 Mbps (T1)  │ 100/1.544 ≈ 64 │
│ 10 Gbps          │ 100/10000 → 1 (¡atrapado en 1!) │
└──────────────────┴─────────────┘
```

Este bloque tiene dos partes: arriba la fórmula, abajo una tabla de ejemplos ya calculados. La fórmula ocupa una línea y se lee como una división común: el **costo-referencia** (un número fijo que elige el administrador) dividido por el **ancho de banda** del enlace (cuántos bits por segundo entran). La segunda línea aclara el valor por defecto de esa referencia: **100 Mbps**, o sea cien millones de bits por segundo.

La parte de abajo es una tabla dibujada con caracteres de caja, con dos columnas: a la izquierda el **enlace** y a la derecha el **costo OSPF** que le corresponde, con la cuenta a la vista. Los símbolos `→` y `≈` significan "da como resultado" y "aproximadamente".

Fila por fila:

- **100 Mbps:** `100/100 = 1`. Es el enlace que define la referencia: siempre cuesta 1.
- **1 Gbps:** `100/1000 → 1 (mínimo 1)`. Un gigabit por segundo es diez veces más rápido, así que la cuenta daría 0,1. Pero el costo mínimo es 1: OSPF no usa decimales ni ceros, así que lo empuja a 1.
- **10 Mbps:** `100/10 = 10`. Cuanto más lento, más caro: un enlace diez veces más lento cuesta diez veces más.
- **1.544 Mbps (T1):** `100/1.544 ≈ 64`. Un enlace **T1** es un tipo de enlace dedicado de 1,544 Mbps, típico de las redes telefónicas de Estados Unidos. La cuenta da 64,7 y OSPF se queda con la parte entera: 64.
- **10 Gbps:** `100/10000 → 1 (¡atrapado en 1!)`. Diez gigabit por segundo debería costar 0,01, pero otra vez el mínimo lo deja en 1. El signo de admiración del original no es un adorno: es la advertencia.

> **El problema del mundo moderno:** como el costo mínimo es 1, **todos los enlaces ≥ 100 Mbps cuestan 1**. Si tu diseño depende de elegir entre un enlace de 1 Gbps y otro de 10 Gbps... OSPF los ve IDÉNTICOS (costo 1 y 1). Por eso en redes modernas se ajusta la referencia:

```text
(global) auto-cost reference-bandwidth 10000
```

Este bloque es un comando de configuración, y el `(global)` de la izquierda indica el modo en el que se escribe: el modo de configuración global, al que se entra desde el router sin estar dentro de una interfaz. El comando se llama `auto-cost reference-bandwidth` y el número final es la referencia nueva, expresada en **Mbps**: `10000` significa 10.000 Mbps, o sea 10 Gbps.

Con referencia **10 Gbps (10.000 Mbps)**, el 1 Gbps cuesta 10 y el 10 Gbps cuesta 1: la métrica vuelve a discriminar. **Ojo:** este comando debe ser IGUAL en TODOS los routers del área, o cada uno calcula distinto (y adiós consistencia de la LSDB).

¿Por qué tiene que ser igual en todos? Porque el costo no viaja solo: viaja dentro de los LSA. Si R1 calcula el costo de su enlace con una referencia y R2 con otra, el mapa tiene números que no significan lo mismo, y la comparación de caminos se vuelve basura. Es como si un plano estuviera en metros y otro en pies sin avisar.

### 7.2. El costo en la práctica

- El **costo de una ruta** = la SUMA de los costos de todos los enlaces por los que pasa (exit interface de cada hop).
- El SPF elige el camino de **menor costo total** (no de menor cantidad de saltos: el costo 1 de un Gbps "vale" lo mismo que el de 100 Mbps solo si ambos cuestan 1).
- Podés **sobreescribir el costo de una interfaz** a mano (`ip ospf cost 50` o `bandwidth 100000`) — es la herramienta para "hacer que el tráfico vaya por donde quiero" (ingeniería de tráfico, tema de redistribución).

Estos tres puntos son las tres consecuencias prácticas de la fórmula. Vamos uno por uno.

**El costo se suma.** La **interfaz de salida** (en inglés *exit interface*) es la pata por la que el router manda el paquete hacia el siguiente salto. Cada salto aporta el costo de su interfaz de salida, y el total es la suma de todos. Si un camino pasa por tres enlaces que cuestan 1, 10 y 1, el costo de ese camino es 12.

**Gana el menor costo total, no el menor número de saltos.** Es la diferencia con RIP, que cuenta routers. Un camino con tres saltos de 1 (total 3) le gana a uno de dos saltos de 10 y 10 (total 20). Por eso la frase "más saltos pero más rápido" es perfectamente entendible para OSPF: lo que mide es la calidad de los enlaces, no la cantidad de paradas.

**El costo se puede tocar a mano.** Hay dos formas y conviene no confundirlas:

- `ip ospf cost 50` fija el costo OSPF de esa interfaz en 50, sin importar el ancho de banda. Es directo: le decís a OSPF cuánto querés que cueste.
- `bandwidth 100000` cambia el **ancho de banda declarado** de la interfaz, en **kilobits** por segundo. `100000` kbps son 100 Mbps, así que el costo calculado pasa a ser 1. Es indirecto: cambiás el dato del que se calcula el costo.

Las dos se usan para **ingeniería de tráfico**: hacer que el tráfico vaya por el camino que vos querés, aunque el cálculo automático prefiera otro. El caso clásico es tener un enlace de respaldo caro y no querer que OSPF lo elija. El detalle de cómo se combina esto con redistribución está en su manual.

> **Analogía:** el costo es el peaje combinado de la ruta. Un camino con 3 autopistas (3×1 = costo 3) le gana a uno con 2 rutas de montaña (2×64 = costo 128), aunque el segundo tenga menos tramos. OSPF no cuenta tramos: SUMA peajes. Por eso "más saltos pero más rápido" es una frase que OSPF entiende perfecto.

### 7.3. El costo en el laboratorio del capítulo 8

En el laboratorio vas a ver dos enlaces de 100 Mbps (los `10.0.0.0/30` y `10.0.1.0/30`) y tres loopbacks. Con la referencia por defecto, cada enlace de 100 Mbps cuesta 1, y una loopback también cuesta 1.

Entonces: para llegar desde R1 a la loopback de R2, el costo es 1 (el enlace de 100 Mbps). Para llegar a la loopback de R3, el costo es 1 + 1 = 2, porque pasa por dos enlaces. Los números que vas a ver en el capítulo 9 (`[110/2]` y `[110/3]`) salen exactamente de esta cuenta; si los entendés acá, allá no te sorprenden.

### Resumen

- El costo de un enlace es la referencia (100 Mbps por defecto) dividida por su ancho de banda, con mínimo 1.
- El costo de un camino es la suma de los costos de sus enlaces, y gana el menor total (no el de menos saltos).
- Con la referencia por defecto, todo enlace de 100 Mbps o más cuesta 1: un Gbps y un 10 Gbps empatan.
- Para que la métrica vuelva a distinguir se sube `auto-cost reference-bandwidth`, igual en todos los routers del área.
- El costo se puede fijar a mano con `ip ospf cost` o cambiando el `bandwidth` de la interfaz.

---

## 8. Configuración básica: tres routers y una red

### 8.1. La topología

Tres routers en serie, con sus loopbacks de gestión, todos en área 0:

```text
  R1 ──── 10.0.0.0/30 ──── R2 ──── 10.0.1.0/30 ──── R3
  │                        │                        │
  .1                       .2        (10.0.0.1/30)   .1 (10.0.1.2/30)
lo0 1.1.1.1            lo0 2.2.2.2              lo0 3.3.3.3
   (RID)                  (RID)                   (RID)
```

Este dibujo es el plano del laboratorio. Se lee de izquierda a derecha: R1 está conectado a R2 por la red `10.0.0.0/30`, y R2 está conectado a R3 por la red `10.0.1.0/30`. R1 y R3 no están conectados directamente: para ir de uno al otro hay que pasar por R2.

Las etiquetas de abajo son las **loopbacks** (las direcciones de gestión, que además van a ser los RID) y las etiquetas con punto son las direcciones de cada extremo del enlace. El original tiene esas etiquetas un poco corridas respecto de las columnas: los datos que valen son los de la configuración de la sección 8.2, y con ellos el dibujo cierra así:

| Router | Interfaz | Dirección | Para qué |
|--------|----------|-----------|----------|
| R1 | Loopback 0 | 1.1.1.1/32 | RID y gestión |
| R1 | GigabitEthernet0/0 | 10.0.0.1/30 | Enlace hacia R2 |
| R2 | Loopback 0 | 2.2.2.2/32 | RID y gestión |
| R2 | GigabitEthernet0/0 | 10.0.0.2/30 | Enlace hacia R1 |
| R2 | GigabitEthernet0/1 | 10.0.1.1/30 | Enlace hacia R3 |
| R3 | Loopback 0 | 3.3.3.3/32 | RID y gestión |
| R3 | GigabitEthernet0/0 | 10.0.1.2/30 | Enlace hacia R2 |

Esta tabla no está en el original: la armamos a partir de su configuración para que puedas copiar el laboratorio sin adivinar direcciones. La primera columna es el **router**, la segunda la **interfaz**, la tercera la **dirección con su máscara** y la cuarta **para qué sirve** esa dirección. Leela junto al dibujo y todo cierra.

Dos explicaciones que hacen falta para leer esas direcciones:

- **`/30` es una máscara de subred que deja exactamente dos direcciones usables.** En un enlace entre dos routers no necesitás más que dos: una para cada punta. Por eso el laboratorio usa `/30` (máscara `255.255.255.252`) en los enlaces. Si no tenés fresco qué significa la barra, está explicado en los manuales de direcciones IP y de análisis de IPv4.
- **`/32` es una máscara de un solo equipo.** Una loopback no es una red: es una dirección suelta que representa al router. Por eso se configura con `255.255.255.255`, que es lo mismo que `/32`.

### 8.2. La configuración (completa y comentada)

```cisco
! R1
interface loopback 0
 ip address 1.1.1.1 255.255.255.255
!
interface GigabitEthernet0/0
 ip address 10.0.0.1 255.255.255.252
 no shutdown
!
router ospf 1
 router-id 1.1.1.1
 network 10.0.0.0 0.0.0.3 area 0
 network 1.1.1.1 0.0.0.0 area 0
```

```cisco
! R2
interface loopback 0
 ip address 2.2.2.2 255.255.255.255
!
interface GigabitEthernet0/0
 ip address 10.0.0.2 255.255.255.252
 no shutdown
!
interface GigabitEthernet0/1
 ip address 10.0.1.1 255.255.255.252
 no shutdown
!
router ospf 1
 router-id 2.2.2.2
 network 10.0.0.0 0.0.0.3 area 0
 network 10.0.1.0 0.0.0.3 area 0
 network 2.2.2.2 0.0.0.0 area 0
```

```cisco
! R3
interface loopback 0
 ip address 3.3.3.3 255.255.255.255
!
interface GigabitEthernet0/0
 ip address 10.0.1.2 255.255.255.252
 no shutdown
!
router ospf 1
 router-id 3.3.3.3
 network 10.0.1.0 0.0.0.3 area 0
 network 3.3.3.3 0.0.0.0 area 0
```

Estos tres bloques son la configuración completa de cada router, en el lenguaje de comandos de Cisco (**IOS**, *Internetwork Operating System*, el sistema operativo de los routers Cisco). Se leen de arriba hacia abajo y se escriben en el mismo orden. Las líneas que empiezan con `!` son **comentarios**: el router las ignora, están para separar secciones y para que un humano lea más fácil.

Cada bloque tiene la misma forma, así que alcanza con entender uno:

- `! R1` es el comentario que dice de qué router es el bloque.
- `interface loopback 0` entra a la configuración de la interfaz virtual número 0. Una **loopback** es una interfaz que no existe físicamente: la inventa el router y está siempre "arriba", aunque se caiga cualquier cable.
- ` ip address 1.1.1.1 255.255.255.255` le pone dirección y máscara a esa interfaz. La máscara de todos los 255 equivale a `/32`: una sola dirección.
- `!` separa secciones.
- `interface GigabitEthernet0/0` entra a la interfaz física del primer puerto. `GigabitEthernet` es el tipo de puerto (Ethernet de 1 Gbps) y `0/0` es su ubicación física en el equipo.
- ` ip address 10.0.0.1 255.255.255.252` le pone la dirección del extremo y la máscara `/30`.
- ` no shutdown` **enciende** la interfaz. En Cisco las interfaces nacen apagadas ("administratively down") y este comando las activa. Sin esta línea, el cable está puesto pero la pata está muerta.
- `router ospf 1` entra al proceso OSPF número 1. Un **proceso** es la instancia del protocolo que corre en ese router. El número es local: no tiene que coincidir con el de los vecinos.
- ` router-id 1.1.1.1` fija el RID a mano, como pide el capítulo 3.
- ` network 10.0.0.0 0.0.0.3 area 0` le dice a OSPF qué interfaces entran al protocolo y en qué área. Se lee: "toda interfaz cuya dirección caiga dentro de `10.0.0.0` con wildcard `0.0.0.3` participa del área 0".
- ` network 1.1.1.1 0.0.0.0 area 0` hace lo mismo con la loopback: el wildcard `0.0.0.0` matchea exactamente esa dirección.

Comparando los tres bloques se ve el patrón: R2 tiene dos interfaces físicas y por eso dos `network` de enlace, mientras que R1 y R3 tienen una sola. Cada router anuncia su loopback por separado. Y fijate en algo importante: **no hay ningún comando que diga "estos son mis vecinos"**. OSPF los descubre solo con los Hellos, en cuanto las interfaces quedan dentro del proceso.

> **Ojo con `network`:** no es "la red que quiero anunciar", es "en qué interfaces quiero correr OSPF". El anuncio de la red sale como consecuencia: si la interfaz entra al proceso, su red se publica. Es la confusión número uno de los que vienen de rutas estáticas.

### 8.3. La sintaxis explicada (esto es lo que preguntan)

```text
router ospf 1            ← el "1" es el process ID: importa SOLO a nivel local
                           (cada router puede usar un número distinto: no se negocia)

network 10.0.0.0 0.0.0.3 area 0
        └───────┘ └───────┘   └─ en qué área participan las interfaces que matcheen
        │         └─ WILDCARD: la "anti-máscara" (inversa)
        └─ direccion de la red a matchear

network 1.1.1.1 0.0.0.0 area 0   ← /32 (0.0.0.0 wildcard) matchea SOLO esa IP
```

Este bloque es el detalle fino de los dos comandos que más se preguntan. Usa corchetes y líneas para señalar cada pedazo de la sintaxis, y flechas para explicar qué hace cada uno. Se lee como un mapa del comando: el texto de la izquierda es lo que escribís, y lo que sale de los corchetes es la explicación de cada parte.

Parte por parte:

- **`router ospf 1`**: entra al proceso. El `1` es el **process ID** (identificador de proceso) y es puramente local: podés tener R1 con proceso 1, R2 con proceso 10 y R3 con proceso 100, y la red funciona igual. No viaja en ningún paquete ni se negocia con nadie.
- **`network 10.0.0.0 0.0.0.3 area 0`**: la dirección de la red a matchear, la **wildcard** y el área. La wildcard es la "anti-máscara": en lugar de marcar qué bits son de red, marca qué bits pueden variar. El `0.0.0.3` deja libres los dos últimos bits, así que matchea cuatro direcciones (de la `.0` a la `.3`), que es exactamente el bloque de un `/30`.
- **`network 1.1.1.1 0.0.0.0 area 0`**: con wildcard `0.0.0.0` no queda ningún bit libre, así que matchea **solo** esa dirección. Es la forma de meter una loopback `/32` en el proceso.

**El wildcard, la pesadilla clásica:** la wildcard es la máscara "al revés": `0.0.0.255` = /24, `0.0.0.3` = /30, `0.0.0.0` = /32 (exacta). **Nunca pongas la máscara de subred en `network`** — poner `255.255.255.252` donde va `0.0.0.3` es el error #1 de config OSPF.

¿Por qué ese error es tan común? Porque en las rutas estáticas escribís la máscara normal (`ip route ... 255.255.255.0`), y en OSPF escribís lo contrario. El router no te avisa: acepta el comando, pero matchea cualquier cosa (o nada), y la interfaz nunca entra al proceso. El síntoma es un router que "no tiene OSPF" aunque la configuración parezca completa.

> **HACELO VOS — el truco del examen (lo que nadie te dice):** APRENDÉ a convertir máscara → wildcard en segundos:
> wildcard = 255.255.255.255 MENOS la máscara.
>  /24 = 255.255.255.0 → 0.0.0.255
>  /30 = 255.255.255.252 → 0.0.0.3
>  /32 = 255.255.255.255 → 0.0.0.0
> Hacé la resta. Siempre. No la memorices.

La resta se hace octeto por octeto, y como los valores de las máscaras son siempre 255, 254, 252, 248, 240, 224, 192, 128 o 0, la cuenta es corta: 255 menos 255 es 0; 255 menos 252 es 3; 255 menos 0 es 255. Con eso resolvés cualquier wildcard en dos segundos, en el examen y en el trabajo.

### 8.4. ¿Por qué publicar la loopback en OSPF?

Las 3 loopbacks (1.1.1.1/32, etc.) se anuncian en OSPF como rutas `/32`: así cada router alcanza la "IP de gestión" de los demás **por OSPF** (no por rutas estáticas). Es la base de la gestión de la red por OSPF. Y de paso, la loopback **nunca se cae** (no depende de un enlace físico): la gestión sigue funcionando aunque un enlace falle.

Hay dos ideas juntas en ese párrafo, y las dos valen la pena:

1. **Publicar la loopback convierte la gestión en una ruta más.** Si querés hacer `telnet`, SSH o `ping` a la IP de gestión de R3 desde R1, necesitás que R1 sepa cómo llegar. Anunciando las loopbacks por OSPF, la ruta aparece sola en todos los routers del área, sin que nadie escriba una estática.
2. **La loopback es estable por naturaleza.** No depende de un cable ni de un puerto: existe mientras el router esté encendido. Por eso es la dirección perfecta para gestión y para RID: siempre está, siempre es la misma.

Si mañana se cae el enlace entre R2 y R3, la loopback de R3 sigue existiendo; lo que cambia es el camino para llegar. OSPF recalcula y, si hay otro camino, la gestión sigue funcionando. Con una dirección de interfaz física, en cambio, esa dirección desaparece cuando el enlace se cae.

### Resumen

- El laboratorio son tres routers en serie, todos en área 0, con enlaces `/30` y loopbacks `/32`.
- Cada router necesita: direcciones en las interfaces, `no shutdown`, un proceso OSPF, `router-id` manual y un `network` por cada red que participa.
- El número del proceso OSPF es local; el área y los timers sí tienen que coincidir con los vecinos.
- El `network` usa wildcard, que es la máscara invertida: `255.255.255.255` menos la máscara.
- Publicar las loopbacks da rutas de gestión estables, porque la loopback nunca se cae.

---

## 9. Verificación: las preguntas que hay que hacerle a la red

Configurar fue la parte fácil. **Verificar es la parte que te va a pagar el sueldo.** Cuatro comandos, cuatro preguntas:

### 9.1. `show ip ospf neighbor` — ¿con quién me llevo bien?

```text
R1# show ip ospf neighbor

Neighbor ID     Pri   State           Dead Time   Address         Interface
2.2.2.2           1   FULL/DR         00:00:38    10.0.0.2        GigabitEthernet0/0
```

Este bloque es la salida de un comando de verificación en el router R1. La primera línea es lo que escribís (`R1#` es el prompt, o sea la invitación del router a escribir). Después viene una tabla con una fila por vecino: en este caso hay uno solo, R2.

La salida tiene cinco columnas, y hay que saber leer las cinco:

| Columna | Qué te dice |
|---------|-------------|
| Neighbor ID | El RID del vecino (2.2.2.2 = R2, el DNI que configuraste con amor) |
| State | **FULL/DR**: relación sana, y además R2 es el DR del segmento (lo ves con OSPF avanzado) |
| Dead Time | Cuántos segundos faltan para declarar muerto al vecino si no llega Hello (va de 40 → 0 y se reinicia) |
| Interface | Por dónde está el vecino |

Esta tabla explica las columnas de la salida anterior, una por una. La primera columna de la tabla es el **nombre de la columna en pantalla** (tal cual aparece en el router) y la segunda es **qué te dice** en castellano. Es la traducción oficial de la pantalla.

Detalle por detalle:

- **Neighbor ID**: el RID del vecino, no su dirección IP. Por eso la convención de la loopback 0 con el número del router sirve: `2.2.2.2` te dice "es R2" sin abrir el diagrama.
- **Pri**: la **prioridad** del vecino en la elección de DR. Es un número que se configura por interfaz y que decide quién gana la elección; el valor por defecto es 1. En el laboratorio, con un solo vecino, no cambia nada.
- **State**: el estado de la vecindad, el del capítulo 5. `FULL/DR` son dos datos juntos: `FULL` es el estado (sincronizados) y `DR` es el rol de ese vecino en el segmento (es el router designado). Si el enlace fuera punto a punto, verías `FULL/ -`, porque no hay DR.
- **Dead Time**: una cuenta regresiva. Arranca en 40 (el Dead timer), baja segundo a segundo y se reinicia cada vez que llega un Hello. Si llega a cero, el vecino se declara muerto. Verlo bajar y resetearse es la prueba de que los Hellos están llegando.
- **Address**: la dirección IP del vecino por ese enlace. En este caso `10.0.0.2`, que es la pata de R2 en la red `10.0.0.0/30`.
- **Interface**: la interfaz local por la que se ve a ese vecino. En este caso, `GigabitEthernet0/0` de R1.

> Recordá la regla de la sección 5: **FULL = sano**. Ver 2-Way entre dos routers que no son DR/BDR también es sano (se explica con OSPF avanzado). Ver `Init` o `ExStart` clavado = problema → sección 10.

Y un detalle que completa la lectura: el `Pri` y el rol (`DR`, `BDR` o nada) se refieren al **segmento**, no al router en general. Un router puede ser DR en una interfaz y no serlo en otra. En el laboratorio, con un enlace por router, no hay competencia posible.

### 9.2. `show ip route ospf` — ¿qué aprendió?

```text
R1# show ip route ospf

O    10.0.1.0/30 [110/2] via 10.0.0.2, 00:12:44, GigabitEthernet0/0
O    3.3.3.3/32 [110/3] via 10.0.0.2, 00:12:44, GigabitEthernet0/0

     [110/2]  ← AD 110 + costo 2 (10.0.0.0/30 costo 1 + 10.0.1.0/30 costo 1)
     O        ← rutas aprendidas por OSPF (interiores = intra-area)
```

Este bloque muestra la tabla de rutas de R1 filtrada a las rutas que aprendió OSPF. Tiene dos líneas de rutas y dos líneas de anotación debajo, que explican los dos símbolos importantes.

Las anotaciones dicen:
- **`[110/2]`** son dos números entre corchetes, separados por una barra: el primero es la **AD** (110, la de OSPF) y el segundo es el **costo** del camino (2). En el ejemplo, el costo 2 sale de sumar dos enlaces de 100 Mbps, uno a 1 cada uno.
- **`O`** es el código que Cisco usa para las rutas aprendidas por OSPF. Las que empiezan con `O` a secas son **intra-área** (dentro de la misma área); las que empiezan con `O IA` son **inter-área** (entre áreas distintas, con la "IA" de *inter-area*). En este laboratorio, todo es área 0, así que todo es `O`.

Ahora el resto de la línea, que es donde un principiante se pierde:

- **`10.0.1.0/30`** es la red de destino que se aprendió. En este caso, el enlace entre R2 y R3, que R1 no tiene conectado pero conoce por OSPF.
- **`via 10.0.0.2`** es el **próximo salto** (*next hop*): la dirección del vecino al que R1 le entrega el paquete para llegar a esa red. Es la pata de R2 del otro lado del cable.
- **`00:12:44`** es la antigüedad de la ruta: hace cuánto que está instalada, en formato horas:minutos:segundos. Sirve para saber si la ruta se acaba de instalar (poco tiempo) o si viene estable.
- **`GigabitEthernet0/0`** es la interfaz local por la que sale el paquete.

Y la segunda ruta: `3.3.3.3/32` es la loopback de R3, publicada como `/32`. Su costo es 3 porque el camino es: enlace R1–R2 (1) + enlace R2–R3 (1) + la loopback de R3 (1). Ahí se ve la suma del capítulo 7 funcionando.

Qué tiene que ver un principiante acá: que aparezcan las redes que **no** están conectadas directamente a R1 (la `10.0.1.0/30` y la `3.3.3.3/32`) con código `O`. Si esas dos rutas están, OSPF está funcionando. Si falta alguna, el problema está en la vecindad o en un `network` mal escrito.

### 9.3. `show ip ospf interface` — ¿cómo está MI interfaz?

```text
R1# show ip ospf interface GigabitEthernet0/0

GigabitEthernet0/0 is up
  Internet Address 10.0.0.1/30, Area 0, Attached via Network Statement
  Process ID 1, Router ID 1.1.1.1, Network Type BROADCAST, Cost: 1
  Timer intervals configured, Hello 10, Dead 40, Wait 40, Retransmit 5
  Neighbor Count is 1, Adjacent neighbor count is 1
    Adjacent with neighbor 2.2.2.2 (Designated Router)
```

Este bloque es el informe completo de una interfaz desde el punto de vista de OSPF. Es la salida más densa de las cuatro, y también la más útil cuando algo no funciona: acá se ven de una sola vez el área, los timers, el costo y el tipo de red.

Línea por línea:

- **`GigabitEthernet0/0 is up`**: la interfaz está arriba (el cable está conectado y la interfaz encendida). Si dijera "down", nada de lo demás importa: primero hay que resolver el cable o el `no shutdown`.
- **`Internet Address 10.0.0.1/30, Area 0, Attached via Network Statement`**: la dirección de la interfaz, el área en la que participa y **cómo entró** a OSPF. "Attached via Network Statement" quiere decir que entró por un comando `network`, no por configuración directa en la interfaz. Si el área dice 0 y esperabas otra, ahí está el problema.
- **`Process ID 1, Router ID 1.1.1.1, Network Type BROADCAST, Cost: 1`**: el proceso local, el RID que está usando este router, el tipo de red que OSPF detectó (broadcast, la del capítulo 6) y el costo de la interfaz, que con un enlace de 100 Mbps y la referencia por defecto es 1.
- **`Timer intervals configured, Hello 10, Dead 40, Wait 40, Retransmit 5`**: los cuatro tiempos de la interfaz. **Hello** es cada cuánto saluda; **Dead** cuánto espera antes de declarar muerto al vecino; **Wait** cuánto espera antes de elegir DR (en broadcast); **Retransmit** cada cuánto reenvía un paquete que no fue confirmado. Con estos números se compara contra el vecino cuando la vecindad no levanta.
- **`Neighbor Count is 1, Adjacent neighbor count is 1`**: cuántos vecinos se ven en esta interfaz y cuántos llegaron a adyacencia plena. Los dos números iguales indican que todos los vecinos están en Full. Si el primero es mayor que el segundo, hay alguien trabado a mitad de camino.
- **`Adjacent with neighbor 2.2.2.2 (Designated Router)`**: el detalle del adyacente: quién es (su RID) y qué rol cumple en el segmento. Acá R2 es el DR.

Acá ves TODO lo que importa de este manual en una sola pantalla: área, timers, costo, tipo de red, y quién es el DR.

Y una advertencia útil: esta salida es **por interfaz**. Si tenés ocho interfaces y no sabés cuál mirar, el comando sin el nombre de la interfaz te muestra todas, una después de otra. Es la forma rápida de encontrar la que tiene el área equivocada.

### 9.4. `show ip protocols` — el resumen de la bestia

```text
R1# show ip protocols

Routing Protocol is "ospf 1"
  Router ID 1.1.1.1
  Number of areas in this router is 1. 1 normal 0 stub 0 nssa
  Maximum path: 4    (ECMP: hasta 4 rutas iguales — tema de selección de rutas)
  Routing Information Sources:
    Gateway         Distance      Last Update
    2.2.2.2             110      00:12:44
    3.3.3.3             110      00:12:44
```

Este bloque es el resumen general del protocolo en ese router: qué protocolo corre, con qué identidad, cuántas áreas tiene, cuántos caminos iguales puede instalar y de quién aprendió rutas. Es la vista "de arriba" que complementa la vista "de abajo" del comando anterior.

Línea por línea:

- **`Routing Protocol is "ospf 1"`**: el protocolo que corre y el número de proceso, que es el mismo `router ospf 1` de la configuración.
- **`Router ID 1.1.1.1`**: confirma el RID que está usando. Si acá ves un número que no configuraste, el RID se está eligiendo solo (capítulo 3) y ahí tenés un problema latente.
- **`Number of areas in this router is 1. 1 normal 0 stub 0 nssa`**: cuántas áreas tiene el router y de qué tipo. En el laboratorio: una sola, de tipo **normal** (ni stub ni NSSA, los tipos del capítulo 4). Es la comprobación rápida de que no configuraste un tipo de área de más.
- **`Maximum path: 4    (ECMP: hasta 4 rutas iguales — tema de selección de rutas)`**: cuántas rutas de igual costo puede instalar a la vez para el mismo destino. **ECMP** es *Equal-Cost Multi-Path*, "varios caminos de igual costo": el balanceo del manual de selección de rutas. El valor 4 es el máximo por defecto en OSPF.
- **`Routing Information Sources:`**: el encabezado de la lista de fuentes. Lo que sigue es la tabla.
- **`Gateway` / `Distance` / `Last Update`**: las tres columnas de esa tabla: **quién** te contó las rutas (el RID del vecino), con qué **distancia administrativa** (110, la de OSPF) y **cuándo** fue la última actualización.
- **`2.2.2.2    110    00:12:44`** y **`3.3.3.3    110    00:12:44`**: los dos vecinos que aportaron información, los dos con AD 110 y actualizados hace 12 minutos y 44 segundos. Es la prueba de que la información viene de dos fuentes y de que está fresca.

Qué tiene que ver un principiante: que el RID sea el que configuraste, que haya una sola área normal, que el máximo de caminos sea el esperado y que la última actualización no esté vieja. Si `Last Update` mostrara horas en vez de minutos, querría decir que hace mucho que no hay novedades (lo cual puede ser normal en una red estable, pero es un dato para pensar).

> **El ritual de verificación (aprendételo de memoria):** **1)** `show ip ospf neighbor` → ¿FULL? **2)** `show ip route ospf` → ¿están las rutas O? **3)** `ping` a la loopback del vecino → ¿el camino funciona? En ese orden. Cuando un lab "no anda", este ritual de 3 pasos te dice EXACTAMENTE dónde está cortado.

El orden no es capricho, y cada paso descarta una capa distinta:

1. **La vecindad.** Si no hay `FULL`, el problema es de conversación (capítulos 4 y 5): timers, área, autenticación, RID. No tiene sentido mirar rutas todavía.
2. **La tabla de rutas.** Si hay `FULL` pero no están las rutas `O`, la conversación funciona pero el anuncio no: casi siempre un `network` mal escrito o una red que no entró al proceso.
3. **El `ping`.** Si la ruta está pero el ping no responde, el problema ya no es OSPF: es la red de destino, un filtro, o un equipo apagado del otro lado.

> **`ping`** es el comando que manda un paquete de prueba a una dirección y espera respuesta. Si responde, hay camino de ida y de vuelta. Es la forma más simple de comprobar que todo el trabajo de OSPF sirvió para algo.

### Resumen

- `show ip ospf neighbor` responde "¿con quién hablo?": buscá `FULL`, mirá el Dead Time bajando y el rol del vecino.
- `show ip route ospf` responde "¿qué aprendí?": rutas con `O`, con AD 110 y el costo del camino entre corchetes.
- `show ip ospf interface` responde "¿cómo está mi interfaz?": área, timers, costo, tipo de red y cuántos vecinos.
- `show ip protocols` responde "¿qué está corriendo?": proceso, RID, áreas y de quién aprendió.
- El ritual de tres pasos (vecino, ruta, ping) te dice en un minuto en qué capa se cortó.

---

## 10. Los 5 errores más comunes (y su diagnóstico)

| # | Error | Síntoma | Diagnóstico / Fix |
|---|-------|---------|-------------------|
| 1 | **Wildcard mal puesta** (máscara en vez de wildcard) | Ninguna vecindad levanta | Revisá `show ip ospf interface`: si dice "Attached via Network Statement" para la interfaz equivocada... `network 10.0.0.0 0.0.0.3 area 0` |
| 2 | **Timers distintos** | El vecino aparece en Init y no avanza | `show ip ospf interface`: usá `ip ospf hello-interval`/`dead-interval` o igualá a mano |
| 3 | **RID duplicado** | Vecindades que suben y bajan solas, LSA pisados | Cada router debe tener RID único: forzá `router-id` en todos (sección 3.2/3.3) |
| 4 | **Área distinta en cada lado** | No se ven, o vecino "Down" eterno | `network ... area X` debe coincidir en AMBOS extremos |
| 5 | **Interface apagada o sin IP** (o `passive-interface` que se comió al vecino) | Down en `show ip ospf neighbor` | `show ip interface brief` + revisar `passive-interface` (los Hells no salen por interfaces passive) |

Esta tabla es el catálogo de las cinco fallas que vas a encontrar en el 90% de los casos. Tiene cuatro columnas: el **número** del error, el **error** en sí, el **síntoma** que ves en pantalla y el **diagnóstico o arreglo**. Se lee de izquierda a derecha: empezás por el síntoma, buscás la fila y te llevás la causa y el comando que la confirma.

Fila por fila:

1. **Wildcard mal puesta.** En lugar de `0.0.0.3` escribiste `255.255.255.252`, la máscara normal. El resultado es que la interfaz no entra al proceso OSPF (o entran otras), así que no hay Hellos y no hay vecindad. El chequeo es `show ip ospf interface`: si la interfaz que esperabas no aparece, o aparece "Attached via Network Statement" cuando la configuraste de otra forma, mirá el `network` primero. La solución es la resta de la sección 8.3.
2. **Timers distintos.** Alguien cambió el Hello o el Dead en un solo extremo. El síntoma es un vecino que aparece en `Init` y no avanza, porque los dos se escuchan pero no se aceptan. Se confirma con `show ip ospf interface` en los dos routers: los cuatro números (Hello, Dead, Wait, Retransmit) tienen que coincidir. Se arregla con `ip ospf hello-interval` y `ip ospf dead-interval` (los comandos de interfaz que fijan esos tiempos) o volviendo a los valores por defecto.
3. **RID duplicado.** Dos routers con el mismo nombre. Las vecindades suben y bajan en ciclo y los LSA se pisan, porque el mapa no puede distinguir a un router del otro. Se arregla forzando `router-id` único en todos, siguiendo la convención de las secciones 3.2 y 3.3.
4. **Área distinta en cada lado.** Un extremo dice `area 0` y el otro `area 1`. No se ven (o el vecino queda en Down para siempre) porque cada uno pertenece a otro mapa. La solución es que el `network ... area X` coincida en **ambos** extremos del enlace.
5. **Interfaz apagada, sin IP, o `passive-interface`.** Si la interfaz está apagada o sin dirección, no hay por dónde mandar Hellos; si tiene `passive-interface`, el router decide no mandarlos. En los dos casos el vecino queda en Down. Se confirma con `show ip interface brief` (que muestra el estado y la IP de cada interfaz en una línea) y revisando la configuración de `passive-interface`.

> **El caso #5 es el más "invisible" de todos:** `passive-interface` evita mandar Hellos (se usa en interfaces hacia LAN donde no hay vecinos — buena práctica para ahorrar recursos). Pero si pusiste passive en la interfaz que SÍ tiene vecino... el vecino nunca va a ver tus Hellos y la vecindad jamas levanta. Misma interface, dos caras: la misma.

Vale la pena entender por qué existe `passive-interface`: en un router de sucursal, la interfaz hacia la LAN de los empleados no tiene ningún router vecino. Mandar Hellos por ahí sería ruido inútil y, peor, podría "descubrir" a un router no deseado. Marcándola como pasiva, el router anuncia la red igual (los empleados la alcanzan) pero no intenta formar vecindad en esa pata.

> **Regla de oro del diagnóstico:** OSPF casi NUNCA es "un bug del protocolo". Si algo no levanta, es una de las 5 razones de arriba (o una combinación). El `show ip ospf neighbor` + `show ip ospf interface` te cuentan la historia; aprendé a leerla.

### 10.1. El método, en tres preguntas

Cuando algo no anda, no empieces por cambiar configuración al azar. Hacé estas tres preguntas en orden:

1. **¿La interfaz está dentro de OSPF y en el área correcta?** Lo dice `show ip ospf interface`. Si no aparece, el problema es el `network` o la interfaz.
2. **¿Los dos extremos coinciden en todo lo de la tabla del capítulo 4?** Área, timers, tipo de área, autenticación, subred. Si algo no coincide, la vecindad no cierra.
3. **¿El vecino llegó a Full y la ruta aparece?** Si llegó a Full y la ruta no está, el problema es el anuncio. Si no llegó a Full, volvé a la pregunta 2.

Ninguna de las tres requiere adivinar: cada una tiene un comando que la responde.

### Resumen

- Los cinco errores clásicos son: wildcard, timers, RID duplicado, área distinta e interfaz apagada o pasiva.
- Cada error tiene un síntoma distinto en pantalla, y el síntoma ya te dice cuál es.
- Casi ninguna falla de OSPF es un bug del protocolo: es configuración que no coincide.
- `show ip ospf neighbor` y `show ip ospf interface` son los dos comandos que resuelven el diagnóstico.
- `passive-interface` es útil hacia las LAN, pero mata la vecindad si se aplica donde hay un router.

---

## 11. El invitado de piedra: la multi-área

Configuraste área 0 en todos lados: eso es **OSPF single-area** (todo en backbone). Funciona perfecto en redes de decenas de routers. Pero cuando la red crece (cientos de routers, miles de rutas), la LSDB crece con todo: cada router guarda el mapa completo y corre SPF completo.

**La solución que diseñaron los ingenieros (y que vas a dominar con OSPF avanzado):** dividir la red en **áreas** (por eso OSPF es "áreas"). Cada área tiene su propia LSDB chica; los routers **ABR** (Area Border Routers) resumen lo que sale y entra a otras áreas, como fronteras que no dejan pasar "todo el detalle".

```text
          ÁREA 0 (backbone)          Área 1            Área 2
   ┌────────────────────────┐   ┌────────────┐   ┌────────────┐
   │  R1 ── R2 ── R3 ── ABR1│──│ ABR1 ─ R6   │   │ ABR2 ─ R8   │
   │                        │   │       │    │   │       │    │
   └────────────────────────┘   │       R7   │   │       R9   │
                                └────────────┘   └────────────┘
                                     ↑ LSDB chica de área 1   ↑ LSDB chica de área 2
```

Este bloque es el plano de una red multi-área. Se lee como tres cajas: la de la izquierda es el **área 0** (el backbone), la del medio es el **área 1** y la de la derecha es el **área 2**. Las dos líneas `──` que unen las cajas son los enlaces entre áreas, y cada uno pasa por un **ABR**: el router que está en el borde de las dos áreas.

Los detalles del dibujo:

- Dentro de cada caja están los routers de esa área, unidos por `──`, que son los enlaces internos.
- **ABR1** aparece en las dos primeras cajas: está en el borde del área 0 y del área 1, y por eso es la puerta entre las dos.
- **ABR2** es la puerta entre el área 0 y el área 2. En el dibujo está en la caja del área 2; la idea es la misma.
- Las dos flechas de abajo (`↑`) apuntan a las etiquetas que explican lo importante: **cada área tiene su propia LSDB chica**, no el mapa de toda la red. Eso es todo el beneficio.

Por qué esto escala mejor: con áreas, el router de R7 no necesita saber cómo está armada el área 2. Le alcanza con saber que hay un ABR que llega. La LSDB de su área es chica, el cálculo es corto y la memoria que usa es menor. Es la misma lógica que un plano de ciudad por barrios: para moverte por tu barrio no necesitás el detalle de las calles del otro extremo de la ciudad, te alcanza con saber por qué avenida se llega.

> **Dato de arquitectura (lo que todo el mundo repite pero pocos entienden):** TODA área debe tocar el **área 0 (backbone)**. No existe una red OSPF sana sin backbone, porque las rutas entre áreas SIEMPRE pasan por el área 0 (hay excepciones de diseño feo, tipo virtual links, que se evitan). La regla mental: **áreas = vecindarios, backbone = la avenida que los conecta.**

Un **virtual link** es un enlace lógico que se configura para "estirar" el área 0 a través de otra área cuando un área quedó mal conectada. Existe, funciona y se evita: si tu diseño necesita un virtual link, probablemente el diseño esté mal. Es el equivalente a poner un puente provisorio porque la avenida no llega al barrio.

En este manual no configurás multi-área: todo es área 0. Lo que sí tenés que llevarte es la regla de arquitectura y la razón: **las áreas existen para que el mapa no crezca sin control, y el área 0 existe para que el mapa siga siendo uno solo**. El resto (tipos de área, resumen de rutas, ABR, virtual links) es el manual de OSPF avanzado.

### Resumen

- El OSPF de área única funciona bien hasta decenas de routers; con cientos, la LSDB y el cálculo se vuelven pesados.
- Multi-área divide el mapa en áreas con LSDB propia y usa ABR como puertas entre ellas.
- Toda área tiene que tocar el área 0, porque el tráfico entre áreas pasa por el backbone.
- Las áreas son barrios y el backbone es la avenida que los conecta: si un barrio no llega a la avenida, queda aislado.
- Este manual configura solo área 0; el detalle de multi-área es el manual de OSPF avanzado.

---

## 12. Comprobá lo que aprendiste

Ocho preguntas. Tapá la respuesta, contestá en voz alta y recién después compará.

**1. ¿Qué transporte usa OSPF y por qué eso importa para una ACL?**

**Ver respuesta:** IP protocol 89 (directo sobre IP, ni TCP ni UDP). Si en una ACL o examen ves "protocolo IP 89", es OSPF. En cambio RIP usa UDP 520 y BGP TCP 179. Importa porque una ACL filtra por protocolo y puerto: para bloquear OSPF no alcanza con "bloquear UDP", hay que mirar el campo de protocolo del paquete IP.

**2. ¿Cuál es la regla de oro del Router ID?**

**Ver respuesta:** Configurarlo SIEMPRE a mano (`router-id`), idealmente con la IP de loopback 0 (1.1.1.1, 2.2.2.2...). El RID automático puede cambiar cuando se apaga una interfaz y reinicia vecindades. RID duplicados = caos en la LSDB.

**3. ¿Qué requisitos deben cumplir dos routers para volverse vecinos OSPF?**

**Ver respuesta:** Misma área, mismos timers (Hello/Dead), misma máscara/subred (en la mayoría de los medios), misma configuración de área (stub/NSSA) y misma autenticación si existe. Si algo no levanta, revisá esta lista en orden.

**4. Nombra los estados de vecindad en orden, del peor al mejor escenario.**

**Ver respuesta:** Down → Init → 2-Way → ExStart → Exchange → Loading → Full. 2-Way es un estado "intermedio sano" en broadcast (un router que no es DR ni BDR con otros que tampoco lo son). Full = LSDB sincronizadas: el objetivo.

**5. ¿Qué es la wildcard y cómo calculás la de una /30?**

**Ver respuesta:** Es la anti-máscara: `wildcard = 255.255.255.255 − máscara`. Para /30 (255.255.255.252) → 0.0.0.3. Para /24 → 0.0.0.255. Para /32 → 0.0.0.0. Nunca confundas máscara con wildcard en `network`.

**6. ¿Por qué en redes modernas hay que ajustar `auto-cost reference-bandwidth`?**

**Ver respuesta:** El costo mínimo es 1 y con la referencia por defecto (100 Mbps) todos los enlaces ≥ 100 Mbps cuestan 1: OSPF no distingue un Gbps de un 10 Gbps. Con referencia 10000 (10 Gbps), el 1 Gbps cuesta 10 y el 10 Gbps cuesta 1. Debe ser igual en TODA el área.

**7. ¿Qué significa ver `FULL/DR` en `show ip ospf neighbor`?**

**Ver respuesta:** Dos cosas: la vecindad está sana (Full: LSDB sincronizadas) y además el vecino es el Designated Router del segmento broadcast. El DR concentra las adyacencias — tema de OSPF avanzado.

**8. ¿Qué es el Dead timer y qué pasa cuando se vence?**

**Ver respuesta:** Es el tiempo máximo (40 s por defecto) sin recibir Hellos antes de declarar muerto al vecino. Al vencer, OSPF actualiza la LSDB (flooding del cambio) y recalcula con SPF. Es la pieza de convergencia del enrutamiento dinámico cobrando vida.

Si contestaste bien la 4, la 5 y la 8, ya tenés el manual entero: los estados, la wildcard y el latido son las tres cosas que más se preguntan y las que más se usan en un diagnóstico real.

### Resumen

- Las ocho preguntas cubren transporte, RID, requisitos de vecindad, estados, wildcard, costo, DR y Dead timer.
- Si contestás bien la 4, la 5 y la 8, tenés lo esencial del manual.
- La respuesta corta de casi todas: misma área, mismos timers, wildcard bien puesta y RID fijo.
- Cuando dudes, volvé al capítulo del tema antes que memorizar la respuesta.

---

## 13. Glosario

| Término | Qué es |
|---------|--------|
| **OSPF (Open Shortest Path First)** | Protocolo de estado de enlace estándar (RFC 2328), AD 110, métrica por costo |
| **Router ID (RID)** | Identificador único de 32 bits por router en el dominio OSPF |
| **Hello** | Protocolo de saludo periódico (10 s) que descubre y mantiene vecinos |
| **Dead timer** | 40 s por defecto: sin Hells en ese tiempo, el vecino se da por caído |
| **Área** | División lógica de la red OSPF; el área 0 es el backbone obligatorio |
| **Wildcard** | Anti-máscara en `network` (255.255.255.255 − máscara) |
| **Costo** | Métrica OSPF = referencia / ancho de banda (mínimo 1) |
| **SPF** | Algoritmo de Dijkstra que corre cada router sobre la LSDB (enrutamiento dinámico) |
| **Full / 2-Way** | Estados de vecindad: Full = LSDB sincronizadas; 2-Way = se reconocieron |
| **DBD / LSR / LSU** | Paquetes del intercambio de LSDB (descripción, requests, updates) |
| **DR/BDR** | Designated/BDR: concentradores de adyacencia en redes broadcast (OSPF avanzado) |
| **Multicast 224.0.0.5/6** | Hells y updates a todos los routers (224.0.0.5) o solo DR (224.0.0.6) |

Esta tabla es el diccionario del manual. Tiene dos columnas: el **término** y **qué es**, en una línea. Los primeros cinco son los que aparecen en cualquier examen; los últimos son los que ves cuando mirás un router de verdad o abrís el manual de OSPF avanzado.

Cómo usarla: si en un capítulo te cruzás con una palabra que no recordás, buscala acá antes de volver atrás. Y si un término no lo podés explicar en una frase propia, volvé al capítulo donde se usa: el glosario es un atajo de repaso, no un reemplazo de la explicación.

Una línea sobre la fila de **DBD / LSR / LSU**, que es la más críptica: son los tres paquetes del intercambio del capítulo 5. **DBD** es la descripción de la base (el índice de la enciclopedia); **LSR** es *Link State Request* (el pedido de un tomo que falta); **LSU** es *Link State Update* (el envío del tomo). Se piden, se mandan y se confirman.

### Resumen

- El glosario es el diccionario del manual: término y definición en una línea.
- Los cinco primeros términos son los de examen; los últimos, los del router real.
- DBD, LSR y LSU son los tres paquetes del intercambio de LSDB.
- Si no podés explicar un término con tus palabras, volvé al capítulo donde aparece.

---

## 14. Resumen en 10 puntos

1. **OSPF es el estado de enlace del enrutamiento dinámico con nombre y apellidos**: Hello, LSA, LSDB, SPF — todo lo que aprendiste es el motor de OSPF.
2. **OSPF habla por IP protocolo 89** (ni TCP ni UDP): useful para ACLs y exámenes.
3. **El Router ID se configura a mano, SIEMPRE** — idealmente con la loopback 0; el automático es inestable y el duplicado es un caos.
4. **El Hello cada 10 s descubre y mantiene vecinos; el Dead de 40 s declara muertos** a los que dejan de responder (y eso dispara la convergencia).
5. **Para ser vecinos: misma área, mismos timers, misma máscara** — la tabla de requisitos es tu checklist de diagnóstico.
6. **Los estados de vecindad van de Down a Full**; Full = LSDB sincronizadas. Cualquier estado clavado = problema en la tabla de requisitos.
7. **En redes broadcast hay DR/BDR** (optimización de adyacencias) — el tema central de OSPF avanzado.
8. **El costo = referencia/ancho de banda** (mínimo 1): en redes ≥ 1 Gbps ajustá `auto-cost reference-bandwidth` igual en todos.
9. **La wildcard es la anti-máscara**: restá `255.255.255.255 − máscara`. Nunca pongas la máscara en `network`.
10. **Verificá con el ritual de 3 pasos**: `show ip ospf neighbor` (¿FULL?) → `show ip route ospf` (¿rutas O?) → ping a la loopback del vecino. Y cuando la red crezca, áreas (con OSPF avanzado).

Leé esta lista como el índice al revés: cada punto condensa un capítulo. Si te llevás uno solo, llevate el 1: la idea del mapa compartido. Todo lo demás es consecuencia de respetarla.

> **Nota de una línea:** en el punto 2 el original escribe "useful" (en inglés); en castellano va "útil". Lo dejamos anotado para que no se te escape en una entrega.

### Resumen

- OSPF es un protocolo de estado de enlace: mapa compartido, cálculo local.
- Los pilares son el Hello (10/40), el Router ID fijo, la wildcard bien puesta y el costo por ancho de banda.
- La vecindad sana se llama Full; los estados clavados se diagnostican con la tabla de requisitos.
- En broadcast hay DR/BDR, y el área 0 es el backbone obligatorio de toda la red.
- El ritual de tres comandos (vecino, ruta, ping) resuelve casi cualquier falla.

---

> **Fuente:** Documentación propia basada en RFC 2328 (OSPFv2), CCNA 200-301 Official Cert Guide (W. Odom), Cisco IOS Configuration Guides y material educativo de redes.

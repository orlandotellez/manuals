# 41. IS-IS: El Estado de Enlace que los Proveedores Aman

**El primo de OSPF que nació en la OSI, no en Internet — y que hoy es el caballito de batalla de los grandes ISP**

---

Este manual es para alguien que nunca configuró un protocolo de enrutamiento. No hace falta que sepas qué es IS-IS para empezar: primero armamos el modelo mental (qué problema resuelve, de dónde viene y de qué está hecho) y recién después bajamos a los comandos y a las pantallas del router.

Cinco palabras que vas a leer en cada capítulo, definidas antes de usarlas:

- Un **router** (en español, encaminador) es un equipo con varias patas, y cada pata está conectada a una red distinta. Su trabajo es pasar paquetes de una red a otra. Cada pata es una **interfaz**: el conector por donde entra y sale el cable.
- Un **paquete** es el sobrecito de datos que viaja por la red, con una dirección de origen y una de destino, igual que una carta. La dirección de esas cartas en Internet se llama **IP** (*Internet Protocol*).
- Una **ruta** es una frase que el router guarda en su memoria: "para llegar a tal red, mandá el paquete por tal interfaz". Al conjunto de esas frases se lo llama **tabla de enrutamiento**, y es lo único que el router consulta para decidir por dónde sale cada paquete.
- Un **protocolo de enrutamiento** es un programa que corre dentro de los routers y que arma esas frases solo, sin que nadie las escriba a mano. Los routers se hablan entre ellos, se cuentan cómo está la red y cada uno calcula sus rutas. IS-IS es uno de esos programas.
- Un **ISP** (*Internet Service Provider*) es un proveedor de Internet: la empresa que te vende la conexión. Un **backbone** (red troncal) es la autopista central de esa empresa, el conjunto de enlaces grandes por donde pasa el tráfico de todos sus clientes.

**IS-IS** son las siglas de *Intermediate System to Intermediate System*, "de sistema intermedio a sistema intermedio". Traducido: es el protocolo con el que los routers (los "sistemas intermedios") se cuentan entre sí cómo llegar a las redes. Tiene un hermano famoso, **OSPF** (*Open Shortest Path First*, "camino más corto primero"), que es el que se enseña en los cursos. Este manual es, en el fondo, la historia de dos hermanos: por qué se parecen tanto, por qué no son iguales, y por qué el menos famoso terminó manejando las autopistas más grandes del mundo.

**Promesa de este manual:** al final vas a poder explicar de dónde viene IS-IS, leer un NET sin miedo, decir si un router es L1, L2 o L1/L2 y por qué, configurar IS-IS en un equipo Cisco, verificar que levantó, y decidir con argumentos cuándo conviene IS-IS y cuándo OSPF. Y vas a poder contar la historia que hay detrás: por qué un protocolo pensado para una pila de protocolos que perdió la guerra terminó ganando las redes de los proveedores.

---

## Índice

- [El gigante silencioso](#1-el-gigante-silencioso)
- [La historia que lo explica todo: nació en la OSI](#2-la-historia-que-lo-explica-todo-nació-en-la-osi)
- [La ficha técnica](#3-la-ficha-técnica)
- [El vocabulario nuevo: IS, ES y NET](#4-el-vocabulario-nuevo-is-es-y-net)
- [Nivel 1 y Nivel 2: el "área" que no se llama área](#5-nivel-1-y-nivel-2-el-área-que-no-se-llama-área)
- [LSP, flooding y SPF: la maquinaria es la misma (pero distinta)](#6-lsp-flooding-y-spf-la-maquinaria-es-la-misma-pero-distinta)
- [La métrica: del 10 fijo a la wide metric](#7-la-métrica-del-10-fijo-a-la-wide-metric)
- [Configuración: IS-IS en 10 minutos](#8-configuración-is-is-en-10-minutos)
- [Verificación: cómo preguntarle a la red](#9-verificación-cómo-preguntarle-a-la-red)
- [IS-IS vs OSPF: la comparación que siempre preguntan](#10-is-is-vs-ospf-la-comparación-que-siempre-preguntan)
- [Los 5 errores más comunes](#11-los-5-errores-más-comunes)
- [Comprobá lo que aprendiste](#12-comprobá-lo-que-aprendiste)
- [Glosario](#13-glosario)
- [Resumen en 10 puntos](#14-resumen-en-10-puntos)

Cómo usar este índice: cada título es un capítulo y también es la dirección (la URL) con la que se publica la página, así que no cambian nunca. Si tenés poco tiempo, el camino corto es el capítulo 2 (de dónde viene), el 5 (la jerarquía por niveles, que es el corazón del asunto), el 8 (la configuración mínima) y el 9 (la verificación). Con esos cuatro ya podés armar un laboratorio y hacerlo andar. El resto es para **diagnosticar** cuando algo no levanta: el capítulo 6 (las piezas), el 11 (los cinco errores clásicos) y el 13 (el glosario, para volver cuando una sigla se te escape).

Una advertencia de método: IS-IS no se entiende por los comandos. Se entiende por una sola idea, que es la del título: **cambiar el edificio no cambia la gente**. OSPF organiza la red en áreas con un área central obligatoria; IS-IS organiza la red en dos niveles donde no hay centro geográfico, solo "quién conoce el detalle" y "quién conoce el mapa grande". Si te llevás esa idea, el vocabulario raro (NET, L1, L2, DIS) deja de ser un diccionario y pasa a ser una consecuencia lógica.

### Resumen

- IS-IS es un protocolo de enrutamiento dinámico: los routers arman sus rutas solos, hablando entre ellos.
- Es el hermano menos famoso de OSPF, y es el que se usa en los backbones de los proveedores de Internet.
- Nació para una pila de protocolos (la OSI) que perdió la guerra comercial, y eso explica todas sus rarezas.
- El corazón del manual es la jerarquía por niveles (L1 y L2) en lugar de áreas con área 0.

---

## 1. El gigante silencioso

OSPF domina los libros de CCNA. Pero en las redes de los **proveedores de Internet (ISP)** y en los **backbones de las grandes telecomunicaciones**, el protocolo que más se ve (junto a BGP) tiene otro nombre: **IS-IS**.

> **Analogía:** OSPF es el auto que aprendés a manejar en la escuela de manejo (el CCNA). IS-IS es el camión pesado que usan los profesionales del transporte: mismo código de tránsito (ambos son estado de enlace, mismo Dijkstra), pero licencia, mecánica y operación distintas — y está pensado para rutas enormes.

Dato que rompe mitos: **IS-IS es anterior a OSPF** (nacido en los 80) y, pese a la fama de OSPF en los cursos, IS-IS ganó la batalla de los ISP por una razón técnica de fondo que vas a entender en la sección 5 (el diseño L1/L2 y su escalabilidad brutal). "Ganó el protocolo menos famoso", y saber por qué te pone un escalón por encima del promedio.

Vale la pena desarmar la analogía del camión, porque ahí está todo el asunto. En la escuela de manejo te enseñan con un auto chico: maniobrable, perdona errores, y con él aprendés las reglas (los semáforos, las prioridades, el carril). Eso es OSPF: las reglas del enrutamiento de estado de enlace, en un vehículo cómodo para aprender. El camión pesado no es "mejor" en abstracto: es el vehículo que sirve cuando la carga es enorme y el recorrido es de miles de kilómetros. Tiene otra licencia, otra mecánica, otros espejos y otros tiempos de frenado. Nadie aprende a manejar en un camión, y nadie mueve veinte toneladas en un auto de escuela.

Dos siglas que aparecieron y conviene dejar claras:

- **Dijkstra** es el nombre del matemático que inventó el algoritmo del camino más corto. Todo protocolo de **estado de enlace** (una familia de protocolos donde cada router arma un mapa completo de la red y calcula el camino más corto sobre ese mapa) lo usa. Por eso decimos "mismo Dijkstra": el motor de cálculo es el mismo en OSPF y en IS-IS.
- **BGP** (*Border Gateway Protocol*, "protocolo de pasarela de frontera") es el protocolo con el que se hablan los proveedores **entre sí**, para intercambiar las rutas de todo Internet. IS-IS no compite con BGP: IS-IS organiza el mapa **adentro** del proveedor y BGP conecta ese proveedor con el resto del mundo. En un backbone grande conviven los dos, cada uno en lo suyo.

Y una aclaración sobre el alcance, porque es la pregunta que más se repite en las entrevistas: si IS-IS es tan bueno, ¿por qué no se usa en todas partes? Porque "bueno" siempre es "bueno para qué". En una empresa de veinte routers, OSPF es más fácil de enseñar, tiene más gente que lo conoce y funciona perfecto. En un backbone con cientos de routers, dónde el protocolo tiene que sobrevivir a cambios constantes, mallas gigantes y una capa de MPLS encima, IS-IS tiene ventajas concretas que vamos a ir nombrando. Este manual no vende humo: al final del capítulo 10 vas a poder decidir vos, con la tabla en la mano.

### Resumen

- En los cursos se enseña OSPF, pero en los backbones de los proveedores el protocolo que manda es IS-IS.
- Ambos son de estado de enlace y usan el mismo algoritmo de camino más corto (Dijkstra).
- IS-IS es más viejo que OSPF: nació en los 80, en otro mundo, y eso dejó marcas en su diseño.
- IS-IS no reemplaza a BGP: organiza el mapa de adentro del proveedor; BGP conecta al proveedor con el resto de Internet.
- "Mejor" no existe en abstracto: cada uno gana en su escenario (empresa vs backbone).

---

## 2. La historia que lo explica todo: nació en la OSI

Para entender IS-IS hay que entender su origen:

| Hito | Año | Qué pasó |
|------|-----|----------|
| Nace el modelo OSI | 1977-1980 | La ISO quería su propia pila de protocolos (no TCP/IP) |
| Se define IS-IS | mediados de los 80 | El protocolo de enrutamiento de la pila OSI (IS = router, ES = host) |
| Llega a IP | 1990 | Se adapta para enrutar IPv4 (RFC 1195, "Integrated IS-IS") |
| Los ISP lo adoptan | década del 90 | Juniper, luego Cisco para backbones grandes: gana por escalar sin áreas "duras" |
| Hoy | actualidad | El estándar de facto de los backbones de ISP; también en MPLS |

**La herencia OSI explica las rarezas**: las direcciones de red (NET), la terminología (IS/ES, L1/L2, PDU) y el hecho de que IS-IS **no depende de IP para funcionar**: se anuncia a sí mismo sobre el enlace directamente (no usa IP ni multicast IP — usa sus propias PDUs). Esto es VENTAJA en redes MPLS y en IPv6 (no hay OSPFv2/v3, la adaptación a v6 es natural: el protocolo ya es "agnóstico").

Vamos fila por fila, porque cada una explica un pedazo del protocolo que hoy usás.

**Fila 1 — Nace el modelo OSI (1977-1980).** En los 70 había dos grandes proyectos para decidir "cómo se hablan las computadoras". Uno era **TCP/IP**, financiado por la agencia de defensa de Estados Unidos y adoptado por las universidades: simple, práctico, ya funcionaba. El otro era el modelo **OSI** (*Open Systems Interconnection*, "interconexión de sistemas abiertos"), empujado por la **ISO** (la Organización Internacional de Normalización, el mismo organismo que hoy certifica calidades y normas de todo tipo), con apoyo de las telefónicas y los gobiernos europeos, y pensado como un proyecto completo y formal: siete capas, protocolos para cada capa, normas escritas. El modelo OSI de siete capas se sigue enseñando hoy (lo viste en el manual de modelos de red), pero la pila de protocolos OSI completa perdió la carrera comercial contra TCP/IP. Lo importante para nosotros: IS-IS fue una pieza de ese proyecto que perdió, y sobrevivió.

**Fila 2 — Se define IS-IS (mediados de los 80).** La pila OSI necesitaba su propio protocolo de enrutamiento, porque no podía usar los de IP (no existía "IP" en ese mundo). Así nació IS-IS: el protocolo con el que los routers de una red OSI se cuentan el mapa. Y de ahí vienen los nombres: en el vocabulario OSI un **IS** (*Intermediate System*, sistema intermedio) es un router y un **ES** (*End System*, sistema final) es un host, una computadora que no reenvía nada. En el mundo OSI nadie dice "router": dicen "sistema intermedio". Por eso el protocolo se llama "de intermedio a intermedio": es el diálogo entre routers, con nombre formal.

**Fila 3 — Llega a IP (1990, RFC 1195).** Alguien se dio cuenta de que el motor de IS-IS era buenísimo y que sería un desperdicio dejarlo encerrado en una pila que casi nadie usaba. La solución fue elegante: agregarle la capacidad de transportar información de rutas de IP, sin cambiar el motor. Ese trabajo se documentó en el **RFC 1195**. Un **RFC** (*Request for Comments*, "pedido de comentarios") es el documento donde se publican las normas de Internet: aunque el nombre suene a borrador, un RFC es la especificación oficial de un protocolo. El resultado se llamó **Integrated IS-IS** ("IS-IS integrado"), y es el que usamos hoy. Cuando alguien dice "IS-IS" en la práctica, está diciendo "Integrated IS-IS".

**Fila 4 — Los ISP lo adoptan (década del 90).** Primero Juniper y después Cisco lo llevaron a los backbones grandes. La razón está en la última columna de la tabla: "gana por escalar sin áreas duras". "Área dura" quiere decir un área que obliga a una estructura rígida, como el área 0 de OSPF, que todos tienen que tocar y que hay que diseñar con cuidado. IS-IS no tiene ese cuello de botella: su jerarquía es más flexible (capítulo 5). En una red que crece todos los meses y donde cada cambio de diseño cuesta dinero y ventanas de mantenimiento, esa flexibilidad vale más que cualquier detalle.

**Fila 5 — Hoy.** Es el estándar de facto de los backbones de ISP, y también se usa mucho en redes **MPLS**. **MPLS** (*Multiprotocol Label Switching*) es la técnica de los proveedores para transportar tráfico etiquetando los paquetes en lugar de mirar la dirección IP completa en cada salto; la etiqueta se decide en el borde, y para decidir hacen falta rutas confiables por dentro. IS-IS es uno de los protocolos preferidos para distribuir esa información. Si te interesa la carrera profesional en proveedores, este es el protocolo que te van a pedir.

> **La frase que resume el porqué:** "OSPF depende de IP para hablar (multicast 224.0.0.5, protocol 89); IS-IS habla su propio idioma sobre el enlace (PDU multicast a todos los routers, sin depender de direcciones IP). Tuvo una década de ventaja para escalar, y los ISP la aprovecharon."

Esa frase tiene tres cosas que conviene desarmar, porque son la base de todo lo que sigue.

Primero, **"OSPF depende de IP para hablar"**: OSPF manda sus mensajes dentro de paquetes IP. Para eso usa una dirección de multicast especial, `224.0.0.5`, que es una dirección IP reservada que significa "todos los routers OSPF de este enlace", y el campo "protocolo" del paquete IP vale `89`, que es el número oficial que identifica a OSPF. Todo eso funciona bárbaramente, pero quiere decir que OSPF necesita que la capa IP esté configurada y andando para poder saludar al vecino.

Segundo, **"IS-IS habla su propio idioma sobre el enlace"**: IS-IS no arma paquetes IP. Arma sus propias unidades, llamadas **PDU** (*Protocol Data Unit*, "unidad de datos del protocolo"), y las manda directamente sobre el enlace de capa 2, con direcciones de multicast del mundo OSI. No necesita una dirección IP para saludar. La consecuencia es enorme y es la que hace la diferencia: IS-IS puede construir el mapa de rutas de IPv4, de IPv6, o de cualquier otra cosa, **con el mismo motor y el mismo proceso**, porque el transporte de sus mensajes no depende de lo que está enrutando.

Tercero, **"una década de ventaja"**: cuando IPv6 llegó, OSPF tuvo que sacar una versión nueva (OSPFv3) porque su forma de hablar estaba atada a IPv4. IS-IS no: ya hablaba en su idioma, así que solo hubo que agregarle un casillero más de información para las direcciones nuevas. Esa es la ventaja que los proveedores aprovecharon y que sigue vigente.

### Resumen

- IS-IS nació para la pila de protocolos OSI, un proyecto formal de la ISO que perdió contra TCP/IP.
- En el vocabulario OSI, router se dice IS (sistema intermedio) y host se dice ES (sistema final).
- En 1990 se adaptó para enrutar IPv4 (RFC 1195, "Integrated IS-IS"): mismo motor, ahora con rutas de IP.
- Como no depende de IP para hablar, sirve igual para IPv4, IPv6 y MPLS: un solo proceso en lugar de dos versiones.
- Los proveedores lo adoptaron en los 90 y hoy es el estándar de facto de los backbones.

---

## 3. La ficha técnica

| Característica | Valor |
|----------------|-------|
| Familia | **Estado de enlace** (link-state puro) |
| Algoritmo | **SPF (Dijkstra)** |
| AD | **115** (Cisco) |
| Métrica | **Default 10 por enlace** (narrow) o **wide metric** (hasta 16 millones) |
| Transporte | *PDU propias* (OSI), **no usa IP**: multicast de nivel OSI a todos los routers |
| LSA-equivalente | **LSP** (Link State PDU) |
| Jerarquía | **Nivel 1 / Nivel 2** (no "áreas" con área 0) |
| Requiere IP para funcionar | **NO** (diseño OSI) |
| IPv4 / IPv6 | Ambas, naturalmente (mismo proceso) |
| Escenario típico | **Backbones de ISP**, redes MPLS, grandes operadores |

Compará con OSPF (AD 110) y notá la diferencia **115 vs 110**: si un router aprende la misma ruta por OSPF y por IS-IS, gana OSPF por 5 puntos. Es un dato fino de examen, pero aparece.

Qué significa cada fila, en criollo:

- **Familia: estado de enlace.** Hay dos grandes familias de protocolos de enrutamiento. Los de **vector de distancia** (como RIP) son chismosos: cada router le cuenta a su vecino lo que sabe, y el vecino repite el chisme. Los de **estado de enlace** son cartógrafos: cada router reparte la lista de sus propios enlaces, todos juntan esas listas y cada uno arma un mapa completo con sus propios ojos. IS-IS es de los cartógrafos, "puro": no mezcla métodos.
- **Algoritmo: SPF (Dijkstra).** **SPF** es *Shortest Path First*, "camino más corto primero": el cálculo que, sobre el mapa completo, encuentra la ruta más barata hacia cada destino. Es el mismo cálculo que hace OSPF. La diferencia entre los dos protocolos nunca está acá.
- **AD: 115.** La **AD** (*Administrative Distance*, "distancia administrativa") es el orden de confianza que un router le da a cada fuente de rutas. Pensalo como la lista de prioridades de una casa: si el dato viene de un hermano mayor confiable, le creés antes que al vecino. Cuanto más bajo el número, más confianza. Cisco usa 115 para IS-IS, 110 para OSPF, 90 para EIGRP y 20 para una ruta estática. Por eso, si la misma red llega por OSPF y por IS-IS, el router se queda con la de OSPF: confía un poquito más.
- **Métrica.** Es el número con el que el protocolo mide "qué tan bueno es un camino": cuanto más chico, mejor. En IS-IS clásico todos los enlaces cuestan 10, y en la versión moderna (wide) el costo lo definís vos, con un techo de 16 millones. Esto tiene capítulo propio (el 7) porque es la fuente de la mitad de las confusiones.
- **Transporte.** Es el punto que ya explicamos: PDU propias, sin IP. Es la firma de identidad de IS-IS.
- **LSA-equivalente: LSP.** Un **LSA** (*Link State Advertisement*, "anuncio de estado de enlace") es el boletín que cada router OSPF publica con sus enlaces. En IS-IS ese boletín se llama **LSP** (*Link State PDU*). Misma función, otro nombre: si entendiste OSPF, entendiste el 90 por ciento de la mecánica y solo te falta el vocabulario.
- **Jerarquía.** OSPF divide por áreas y una de ellas (la 0) es obligatoria. IS-IS divide por **niveles** y no tiene área obligatoria. Es la diferencia más importante de las diez filas y por eso tiene su propio capítulo (el 5).
- **¿Requiere IP para funcionar? No.** Ya lo vimos: puede armar el mapa sin que exista una sola dirección IP configurada.
- **IPv4 / IPv6: ambas, naturalmente.** Un solo proceso de IS-IS anuncia las dos familias al mismo tiempo. En OSPF son dos configuraciones distintas (OSPFv2 para IPv4, OSPFv3 para IPv6), con dos bases de datos y dos vecindades.
- **Escenario típico.** Backbones de ISP, MPLS, grandes operadores. No es un protocolo "de empresa chica", y eso también explica por qué no aparece en los cursos básicos.

Un detalle de prudencia: la AD es una decisión del fabricante, no del protocolo. Los valores 115 y 110 son los de Cisco y son los que vas a ver en los exámenes; en equipos de otros fabricantes la lista puede ser distinta. Cuando compares protocolos entre marcas, comparás implementaciones, no normas.

### Resumen

- IS-IS es de estado de enlace puro: mapa completo en cada router y cálculo SPF, igual que OSPF.
- Su AD en Cisco es 115, cinco puntos por detrás de OSPF (110): si la misma ruta llega por los dos, gana OSPF.
- La métrica clásica es 10 fijo por enlace; la moderna (wide) permite costos a medida hasta 16 millones.
- No necesita IP para hablar, y con un solo proceso anuncia IPv4 e IPv6 a la vez.
- Su territorio natural son los backbones de proveedores y las redes MPLS, no la empresa chica.

---

## 4. El vocabulario nuevo: IS, ES y NET

IS-IS usa el vocabulario OSI. Son pocas piezas, pero son MANDATORIAS:

| Sigla | Nombre OSI | En cristiano |
|-------|------------|--------------|
| **IS** | Intermediate System | Un **router** (intermediario que reenvía) |
| **ES** | End System | Un **host** (final, no reenvía) |
| **NET** | Network Entity Title | La "dirección" del router en el mundo OSI: su DNI de nivel 3 |
| **NSAP** | Network Service Access Point | La dirección completa OSI (el NET es el NSAP del propio router) |
| **LSP** | Link State PDU | El "LSA" de IS-IS (lo que cada router publica) |
| **SNPA** | Subnetwork Point of Attachment | La dirección de capa 2 (MAC, DLCI...) del enlace |

> **Analogía:** NET es la **matrícula del router en el mundo OSI**. No es una IP: es "49.0001.0000.0000.0001.00". Cada router del área comparte la parte de área (49.0001), y la parte de sistema lo identifica a él (0000.0000.0001). Con la matrícula, los routers se reconocen y arman el mapa. Sin NET configurado, IS-IS ni arranca.

Fila por fila, porque estas seis siglas son las que hacen que la configuración parezca un idioma extranjero:

- **IS (Intermediate System).** El router. La palabra "intermedio" es literal: está en el medio, entre el que manda el paquete y el que lo recibe. En un examen, cuando dice "IS", pensá "router".
- **ES (End System).** El host: tu computadora, un servidor, una impresora. Es "final" porque es el principio o el fin del viaje, nunca el medio. En un examen, cuando dice "ES", pensá "host".
- **NET (Network Entity Title).** Es lo que en IP sería la dirección del router. Pero cambia una cosa fundamental: en IP la dirección se configura por **interfaz** (cada pata tiene la suya), y el NET se configura **una sola vez por router**, como identidad del equipo entero. Es el DNI del router, no la dirección de cada pata.
- **NSAP (Network Service Access Point).** Es la dirección completa del mundo OSI. El NET es un caso particular de NSAP: el NSAP del propio router, con el selector de servicio en cero. Dicho de otro modo: todo NET es un NSAP, pero no todo NSAP es un NET. En la práctica de IS-IS vas a escribir siempre NET y nunca vas a escribir "NSAP", pero en los libros aparece y conviene saber que son parientes.
- **LSP (Link State PDU).** El boletín que cada router publica con la lista de sus enlaces y vecinos. Es el equivalente exacto del LSA de OSPF.
- **SNPA (Subnetwork Point of Attachment).** La dirección física del enlace, la de capa 2. Si el enlace es Ethernet, es la dirección **MAC** (la dirección de fábrica de la placa de red). Si el enlace es Frame Relay, es el **DLCI** (el identificador del circuito virtual). Traducido: cómo se llama la pata del router en el cable, no en el mapa.

Un detalle que vale la pena saber: todo este vocabulario viene de **CLNS** (*Connectionless Network Service*, "servicio de red sin conexión"), el servicio de red de la pila OSI: el equivalente OSI de lo que IP hace en el mundo TCP/IP. Cuando en los comandos veas `show clns`, no te asustes: es "mostrame las cosas del mundo OSI", o sea, de IS-IS. Es el mismo protocolo con su ropa de fábrica.

### 4.1. El NET en detalle (la pieza más rara de la serie)

```text
NET =  49.0001 . 0000.0000.0001 . 00
       └──┬──┘   └─────┬──────┘   └┬┘
       ID de    System ID     NSEL
       área     (6 bytes:     (selector
       (1-13     el "nombre"   de servicio:
        bytes)   del router)   siempre "00"
                              para IS-IS)
```

Ese dibujito merece una lectura lenta, porque el NET es lo primero que se rompe en un laboratorio. Son tres pedazos separados por puntos, y cada pedazo tiene un trabajo distinto.

Primer pedazo, el **ID de área**: `49.0001`. Es el número de área al que pertenece el router. Arranca con `49`, que en la norma OSI es el valor reservado para las direcciones privadas (el equivalente de los rangos privados de IP: nadie te lo va a asignar ni choca con nadie). Puede ocupar de 1 a 13 bytes, pero en la práctica se usan dos bytes: `49.0001` o `49.0002`. **Todos los routers de la misma área comparten este pedazo exacto.**

Segundo pedazo, el **System ID**: `0000.0000.0001`. Son 6 bytes que identifican al router **dentro de todo el dominio**. Es su nombre único: no puede haber dos routers con el mismo System ID, ni siquiera en áreas distintas. Acá está el primer error clásico de laboratorio: copiar y pegar la configuración de R1 en R2 sin cambiar este pedazo. Los dos routers creen llamarse igual, los boletines (LSP) se pisan y el mapa queda roto. El síntoma es rarísimo y cuesta encontrarlo; el remedio es trivial: un número distinto por router.

Tercer pedazo, el **NSEL**: `00`. Es el selector de servicio, un byte que dice "esta dirección es del propio protocolo de enrutamiento". Para IS-IS **siempre** es `00`, no se negocia, no se elige. Si ves otra cosa, está mal.

**Regla de oro del NET: el System ID debe ser único** en todo el dominio IS-IS. Convención (la misma del RID de OSPF, ahora en 6 bytes): el System ID es la loopback en formato "raro": `0000.0000.0001` para R1, `0000.0000.0002` para R2... Formato: 13 dígitos en total, agrupados 3-4-4-2 (autoridad de área - system - nsel). No es complicado: es INEXORABLE — si falla el NET, no hay protocolo.

Sobre esa última frase, dos aclaraciones honestas, porque acá el original se enreda un poco:

- El **RID** que se menciona es el *Router ID* de OSPF: el nombre único de cada router, que se suele configurar con la dirección de una interfaz de loopback (una interfaz virtual que siempre está arriba). La convención es la misma en IS-IS: usar un número prolijo y estable, distinto por router.
- **Nota de una línea:** la agrupación "3-4-4-2" y los "13 dígitos" no cierran con el NET del ejemplo. La forma canónica es: área (1 a 13 bytes, en la práctica 2), después el System ID de 6 bytes escrito en tres grupos de 4 dígitos hexadecimales, y al final el NSEL de 1 byte. Con el ejemplo `49.0001.0000.0000.0001.00` eso da los grupos `49` + `0001` (área, 3 bytes), `0000.0000.0001` (System ID, 6 bytes) y `00` (NSEL, 1 byte). Los bytes son los que manda; la forma de agrupar es solo comodidad para los ojos.

Para que quede fijo, armemos los NET de tres routers del mismo dominio, cada uno en su área:

- R1, en el área 49.0001: `49.0001.0000.0000.0001.00`
- R2, en el área 49.0001: `49.0001.0000.0000.0002.00`
- R3, en el área 49.0002: `49.0002.0000.0000.0003.00`

Fijate las dos reglas al mismo tiempo: el pedazo del medio cambia siempre (son tres routers distintos), y el pedazo del área cambia solo entre R2 y R3 (están en áreas distintas). Si te equivocás en el medio, dos routers chocan de nombre. Si te equivocás en el primero, dos routers que deberían ser vecinos de área se ven como de áreas distintas y no comparten el mapa interno.

### Resumen

- En IS-IS, router se dice IS y host se dice ES: es el vocabulario de la pila OSI.
- El NET es el DNI del router: se configura una vez por equipo, no por interfaz, y sin él IS-IS no arranca.
- El NET tiene tres partes: área, System ID (único en todo el dominio) y NSEL (siempre 00).
- El área vive dentro del NET: no hay un comando de "área" aparte.
- Todo el vocabulario viene de CLNS, el servicio de red de la pila OSI; `show clns` es "mostrame lo de IS-IS".

---

## 5. Nivel 1 y Nivel 2: el "área" que no se llama área

### 5.1. La diferencia con OSPF que explica TODO

OSPF divide con **áreas**, y el área 0 (backbone) es obligatoria: un ABR pertenece a dos áreas. IS-IS NO tiene "área 0": tiene **NIVELES**, y un router puede ser:

```text
L1  (Level 1)        → enrutamiento DENTRO del área (como "interno de área")
L2  (Level 2)        → enrutamiento ENTRE áreas (como el "backbone")
L1/L2               → ambos (como el ABR de OSPF: un pie en cada nivel)
```

La diferencia clave de diseño:

```text
OSPF:  un router tiene interfaces en área 0 y área 1 → ABR
       (la LSDB de cada área viaja por sus routers)

IS-IS: un L1/L2 tiene un pie en su área (L1) y el otro en el BACKBONE L2
       (el backbone L2 es CONTINUO: se forma entre L2 y L1/L2 en todas las áreas)
```

> **El backbone de IS-IS no es un área: es un "nivel" distribuido.** Cualquier router L2 con otro L2 forma segmento del backbone, estén donde estén. Estructura distinta, resultado parecido: el tráfico inter-área pasa por el backbone (L2).

Antes de seguir, tres siglas de OSPF que aparecen en los bloques de arriba y que conviene tener a mano, porque las vamos a usar todo el tiempo como traducción: **LSDB** es la *Link State Database*, la base de datos con todos los boletines que el router recibió (el mapa); **ABR** es el *Area Border Router*, el router que está en dos áreas al mismo tiempo y hace de puente entre ellas.

Y ahora la analogía que ordena todo el capítulo, porque si entendés esto entendés IS-IS.

> **Analogía de la empresa:** pensá en una empresa con varias plantas. En cada planta hay un **jefe de piso**. El jefe de piso conoce el detalle de su planta: cada escritorio, cada persona, cada pasillo, quién se sentó dónde. Los jefes de piso no necesitan saber el detalle de las otras plantas, y sería un desperdicio que lo supieran: les alcanza con saber que las otras plantas existen y a quién preguntar. Arriba está el **gerente regional**: no sabe qué hay en cada escritorio, pero sabe qué plantas hay y cómo se llega de una a otra. Cuando alguien de la planta 1 tiene que mandar algo a la planta 2, el jefe de piso le dice "eso no es mío, eso va por el regional", y el regional lo encamina.
>
> Eso es IS-IS, exactamente: los routers **L1 son jefes de piso** (saben todo de su área, nada de las demás), los routers **L2 son gerentes regionales** (saben cómo se conectan las áreas, no el detalle interno), y un router **L1/L2 es la persona que hace los dos trabajos**: jefe de piso de la suya y además va a la reunión regional. Por eso el L1/L2 es el equivalente del ABR de OSPF: tiene un pie en cada nivel.
>
> La consecuencia más linda de la analogía: para el jefe de piso, "todo lo de afuera" es una sola instrucción ("mandalo al regional"). No necesita una lista de las otras plantas. Eso es la **ruta por defecto** del capítulo 5.2, y es la razón por la que IS-IS escala.

Con la analogía en la cabeza, leamos los dos bloques de arriba. El primero dice que hay tres roles: **L1** enruta dentro del área (el jefe de piso), **L2** enruta entre áreas (el regional) y **L1/L2** hace las dos cosas (el jefe de piso que además es regional). El segundo bloque compara con OSPF y ahí está la diferencia de fondo: en OSPF, un router es de frontera porque tiene **interfaces en dos áreas distintas** (una pata en el área 0 y otra en el área 1). En IS-IS, un router es de frontera porque **tiene un pie en su área y el otro en el nivel 2**, y el nivel 2 no es un área: es una capa que atraviesa todas las áreas.

Pensalo con la empresa otra vez. En OSPF, para que las plantas se conecten hay que construir un edificio central (el área 0) y llevar a todos hasta ahí: cada router de frontera tiene una oficina en el edificio central y otra en su planta. En IS-IS no hay edificio central: hay **una reunión de regionales**, y a esa reunión va un representante de cada planta. La reunión existe en todas las plantas a la vez. Eso es lo que el bloque llama "backbone continuo": no es un lugar, es una conversación.

> **El backbone de IS-IS no es un área: es un "nivel" distribuido.** Cualquier router L2 con otro L2 forma segmento del backbone, estén donde estén. Estructura distinta, resultado parecido: el tráfico inter-área pasa por el backbone (L2).

Esa frase es la que hay que poder repetir de memoria. Estructura distinta (niveles en lugar de áreas), resultado parecido (el tráfico entre áreas pasa por arriba). Y la ventaja práctica: como el backbone no es un área con número, no hay que "renumerar" nada cuando la red crece, no hay que decidir quién es área 0 y quién no, y un router puede pasar de L1 a L1/L2 sin tocar sus direcciones.

### 5.2. Los tipos de routers (la tabla que hay que saber)

| Tipo | Qué enruta | Equivalencia OSPF (mental) |
|------|-----------|-----------------------------|
| **L1** | Solo su área | Internal router |
| **L2** | Solo el backbone (áreas enteras entre sí) | Backbone router (área 0 puro) |
| **L1/L2** | Ambos niveles | **ABR** |

Regla de oro del L1 (el detalle determinante): un router **L1 puro** enruta hacia fuera del área mediante la **ruta por defecto** (default) que le inyecta el L1/L2. No conoce el detalle de otras áreas: solo "para afuera, por acá". Ese es el ahorro de estado que hace a IS-IS tan escalable — y es idéntico en espíritu a un área stub de OSPF (que viste con OSPF avanzado).

Las tres filas, con la analogía de la empresa:

- **L1 — el jefe de piso.** Sabe todo de su área y nada de las demás. Su tabla de rutas tiene las redes de adentro y **una** entrada para todo lo de afuera: "por acá, al regional". Es el rol más liviano y el que más routers tiene en una red real.
- **L2 — el gerente regional.** No le interesa el detalle interno de cada área: para él, cada área es un punto en el mapa. Su tabla tiene las áreas y cómo se llega de una a otra. Es el que sostiene la conversación del backbone.
- **L1/L2 — el que hace los dos trabajos.** Es el router más importante del diseño, porque es el único que traduce entre los dos mundos: hacia adentro es jefe de piso (L1) y hacia arriba es regional (L2). Es el equivalente del ABR de OSPF y el que inyecta la ruta por defecto a los L1.

La **ruta por defecto** merece su explicación, porque es la clave del ahorro. Una ruta por defecto es la frase "para cualquier destino que no tenga en mi lista, andá por acá". Es una sola línea en la tabla que cubre **todo** lo desconocido. En la analogía: el jefe de piso no tiene la lista de todas las plantas del mundo, tiene la instrucción "lo de afuera se manda al regional". Con eso le alcanza para todo, y su tabla queda cortísima.

Ese ahorro es lo que hace a IS-IS escalable: en una red con cincuenta áreas, un router L1 del fondo guarda las rutas de su área (ponele, veinte redes) más una línea de default. Si tuviera que guardar el detalle de las cincuenta áreas, tendría miles de líneas y cada cambio en cualquier planta le obligaría a recalcular. Comparalo con la memoria de una persona: es distinto saberse el organigrama entero de la empresa que saberse tu piso al detalle y una sola regla para lo demás.

### 5.3. ¿Y el "área 0 obligatoria" de IS-IS?

IS-IS **no tiene área 0**: tiene la exigencia de que **el backbone L2 sea contiguo**. Los routers L1/L2 y L2 forman una malla L2 continua a través de las áreas. Si el backbone L2 se parte en dos, las áreas quedan desconectadas en L2 (con el mismo problema de diseño de "área sin backbone" de OSPF).

> **Dato de examen que enamora:** en OSPF, "área 0 obligatoria". En IS-IS: "backbone L2 contiguo obligatorio". Misma necesidad lógica, dos implementaciones distintas. Si te preguntan "¿IS-IS tiene área 0?" la respuesta correcta es: **no, no hay área 0: el backbone es el nivel 2, y debe ser contiguo.**

Ese párrafo es corto pero es el que separa a quien aprobó de quien aprobó de casualidad, así que lo desarmamos con la analogía.

"Backbone L2 contiguo" quiere decir: todos los gerentes regionales tienen que poder hablar entre ellos. Si la empresa tiene plantas en dos ciudades y la reunión de regionales de una ciudad no se comunica con la de la otra, entonces un empleado de la planta A no puede mandar nada a la planta B: su jefe de piso le dice "mandalo al regional", pero el regional no tiene cómo llegar. Las dos mitades de la empresa quedan aisladas aunque cada una funcione bien por dentro.

Fijate que el problema es **exactamente el mismo** que en OSPF cuando un área no toca el área 0: la red anda adentro de cada área y no anda entre áreas. Cambia la implementación (un área con número vs un nivel distribuido), pero la necesidad lógica es una sola: **el nivel que conecta todo tiene que estar conectado**. Por eso los exámenes lo preguntan tanto: es la misma lección dos veces.

Y una consecuencia de diseño que vale para tu trabajo: cuando dibujes una red IS-IS, la pregunta "¿este router es L1, L2 o L1/L2?" no se contesta mirando la topología física, se contesta mirando **quién necesita hablar con quién**. Un router de borde de sucursal, que solo tiene que llegar a su propia área y salir por un solo camino, es L1. Un router de la malla central es L2 o L1/L2. Si dudás, preguntate: "¿este equipo necesita conocer el mapa grande o le alcanza con saber a quién preguntar?".

### Resumen

- IS-IS no usa áreas con número: usa niveles. L1 es adentro del área, L2 es el backbone, L1/L2 es los dos.
- La analogía que ordena todo: L1 es jefe de piso (sabe su planta al detalle), L2 es gerente regional (sabe cómo se conectan las plantas), L1/L2 hace los dos trabajos.
- El backbone de IS-IS no es un lugar: es un nivel distribuido que atraviesa todas las áreas y tiene que ser contiguo.
- El L1 puro no guarda el mapa del mundo: usa una ruta por defecto que le inyecta el L1/L2, y ahí está su escalabilidad.
- No existe "área 0" en IS-IS; el requisito equivalente es que el backbone L2 no se parta en dos.

---

## 6. LSP, flooding y SPF: la maquinaria es la misma (pero distinta)

### 6.1. Las piezas (comparadas con OSPF)

| Pieza OSPF | Pieza IS-IS | Diferencia |
|------------|-------------|------------|
| LSA | **LSP** | Misma idea: la publicación del router. Se floode por nivel (L1 o L2) |
| LSDB | **LSDB per level** | Cada nivel tiene su propia base: los L1 no ven los L2 |
| SPF | **SPF per level** | Se corre un SPF para L1 y otro para L2 (dos árboles) |
| DR/BDR (broadcast) | **DIS** (Designated IS) | Same idea: elegir un representante en segmentos multiacceso |
| Timers Hello | **Hello PDU** cada 10 s (broadcast) | Misma idea, otros nombres |

Si la tabla te resultó familiar, es porque lo es: las piezas son las mismas, con otros nombres. Antes de explicarlas, dos palabras que aparecen y que son las que más asustan:

- **Flooding** (inundación) es el mecanismo por el que un router le pasa un boletín nuevo a **todos** sus vecinos, y cada vecino a los suyos, hasta que todos lo tienen. Como cuando alguien manda un comunicado a todos los jefes de área y cada uno lo reenvía a su equipo: no hay un centro que distribuya, se propaga por la red. En IS-IS, el flooding va **por nivel**: un boletín de L1 se inunda dentro del área y no sale de ahí; uno de L2 se inunda por el backbone.
- **Multiacceso** es un segmento donde hay más de dos equipos conectados al mismo medio, como un switch con varios routers colgados. Ahí todos se escuchan entre todos, y para no armar una vecindad completa entre todos, se elige un representante.

Fila por fila:

- **LSA → LSP.** El boletín. Cambia el nombre, no la función: cada router publica lo que tiene (sus enlaces, sus vecinos, sus redes) y lo inunda. En IS-IS el flooding se organiza por nivel, que es el detalle nuevo.
- **LSDB → LSDB per level.** La base de datos donde se juntan los boletines recibidos, o sea, el mapa. La diferencia es que IS-IS tiene **dos bases separadas**: una de L1 y una de L2. Un router L1 puro solo tiene la de su área; un L1/L2 tiene las dos, y son independientes. En la analogía de la empresa: el jefe de piso tiene el plano de su planta y, si además es regional, tiene aparte el mapa de las plantas; nunca los mezcla.
- **SPF → SPF per level.** El cálculo del camino más corto se corre una vez sobre cada base. Dos bases, dos cálculos, dos resultados. El router guarda **dos árboles** de caminos, uno por nivel, y no se contaminan.
- **DR/BDR → DIS (Designated IS).** El representante del segmento multiacceso. **DIS** es *Designated Intermediate System*, "sistema intermedio designado". Cumple el papel del DR de OSPF: en lugar de que todos hablen con todos, todos hablan con uno y ese uno replica. La diferencia importante (que no hay BDR) está en el capítulo 6.3.
- **Timers Hello → Hello PDU.** El saludo periódico para descubrir y mantener vecinos. En IS-IS se llama **Hello PDU** y en un segmento broadcast sale cada **10 segundos**, igual que en OSPF. Si el vecino deja de contestar los saludos, se lo declara caído y se recalcula.

Una pieza que la tabla no nombra pero que es la gran ventaja de IS-IS: los **TLV**. Un TLV (*Type-Length-Value*, "tipo, largo, valor") es la forma en que IS-IS empaqueta **toda** su información dentro de los LSP: cada dato es una pequeña ficha con tres campos, un número que dice qué dato es (el tipo), cuánto mide (el largo) y el contenido (el valor). Pensalo como una ficha de archivo con etiqueta: "tipo 22, largo 4, valor 10.0.0.0". La gracia es que **agregar** información nueva es agregar un tipo de ficha nuevo, sin romper nada: un router viejo simplemente ignora las fichas cuyo tipo no conoce y sigue funcionando. Por eso IS-IS pudo aprender IPv6 o ingeniería de tráfico sin cambiar de versión. Es el mismo principio que hace que puedas agregar una tecla nueva a un control remoto sin que el televisor viejo deje de andar.

> **Nota de una línea:** en la fila del DIS el original dice "Same idea" en inglés; en castellano va "misma idea: elegir un representante en segmentos multiacceso".

### 6.2. El detalle de los dos SPF (lo que separa a los que entienden)

En un router L1/L2 corren **DOS procesos SPF**: uno sobre la LSDB de nivel 1 (su área) y otro sobre la de nivel 2 (el backbone). Esa separación es parte de por qué IS-IS escala: cada nivel aísla su "mapa" y su recálculo. Cuando algo cambia en el área 1, solo los L1 de esa área recalculan el SPF L1; el resto del mundo ni se entera (su SPF L2 no cambió).

Traducido a la empresa: el jefe de piso que además es regional tiene dos reuniones separadas y dos planos separados. Si cambian un escritorio de lugar en la planta 1, se actualiza el plano de esa planta y listo: el mapa de las plantas no cambia, y las otras plantas no se enteran de nada. Nadie convoca una reunión regional porque movieron una silla.

Económicamente, esto es oro, y vale entender por qué. Recalcular el camino más corto cuesta procesador, y en un router grande la base de datos puede tener cientos de routers y miles de enlaces. Si cada cambio en cualquier rincón obligara a recalcular todo el mapa, el equipo pasaría el día recalculando. Con la separación por niveles, el costo de un cambio se paga donde ocurrió: adentro de un área, y no en el backbone entero. Es la misma idea que separar la contabilidad de cada sucursal de la contabilidad central: si se rompe una caja chica, no se rehace el balance de la empresa.

### 6.3. El DIS (y por qué NO hay backup)

En un segmento broadcast, IS-IS elige un **DIS** (Designated Intermediate System) — el equivalente del DR de OSPF. Diferencia clave:

| DR OSPF | DIS IS-IS |
|---------|-----------|
| Elige DR **y BDR** (backup) | **NO hay BDR/disaster**: si el DIS muere, se reelige y punto |
| Elección por prioridad + RID | Elección por prioridad + **MAC/sistema ID** (desempate más "físico") |
| Reelección NO preemptiva | También NO preemptiva (misma regla que en OSPF avanzado) |

> **El dato fino que muchos se llevan puestos:** OSPF tiene BDR (DR/BDR). IS-IS **no**: solo DIS. La "seguridad" del segmento broadcast no está en un backup temporal sino en que el flood de LSP es más robusto (los LSP se reenvían por CSNP/PSNP — "listados de qué tengo" periódicos que permiten resincronizar sin depender del DIS). Es otra filosofía: no "respaldo al representante", sino "resincronizar fácil".

Las tres filas de la tabla, más el dato fino, en palabras simples:

**Fila 1 — backup.** En OSPF se eligen dos: un DR (el que manda) y un BDR (el suplente, que ya tiene todo listo para el día que el DR se caiga). En IS-IS se elige **uno solo**. Si el DIS se cae, los demás detectan que dejó de mandar saludos y eligen otro. No hay suplente esperando. A un principiante esto le suena a "menos seguro", y es la intuición correcta de la tabla, pero con un matiz: IS-IS compensa por otro lado (los CSNP/PSNP), y el resultado es que la red se resincroniza rápido aunque no haya suplente. La palabra "disaster" de la tabla es un juego de palabras con las siglas: DR y BDR de OSPF, DIS de IS-IS.

**Fila 2 — cómo se elige.** En OSPF manda la prioridad y, si hay empate, el RID (el Router ID). En IS-IS manda la prioridad y, si hay empate, el System ID o la MAC, que la tabla llama "desempate más físico" porque sale de un número de la máquina y no de una dirección IP configurada. Consecuencia práctica: en IS-IS el resultado depende de cosas que no cambiaste vos, así que si te importa quién es el DIS, configurá la prioridad a mano.

**Fila 3 — preempción.** "Preemptiva" querría decir que, si aparece un router mejor, le saca el puesto al actual. Ninguno de los dos lo hace: el que está, se queda. Nada de "llega el jefe nuevo y reordena todo". Es más estable, y por eso el que llega tarde no se convierte en DIS aunque tenga mejor prioridad.

**CSNP y PSNP.** Son dos tipos de mensaje con los que los routers se ponen de acuerdo sobre qué boletines tienen. El **CSNP** (*Complete Sequence Number PDU*) es el listado completo de "estos son los boletines que tengo, con este número de versión cada uno". El **PSNP** (*Partial Sequence Number PDU*) es el listado parcial, y se usa para pedir o confirmar lo que falta. En la analogía: son las listas de "qué documentos tengo" que se intercambian dos oficinas para detectar qué les falta y pedirse copia, sin depender de que el gerente esté presente. Por eso IS-IS no necesita un BDR: la resincronización no cuelga de una persona, cuelga de un procedimiento.

### Resumen

- Las piezas de IS-IS son las mismas que las de OSPF con otros nombres: LSA se llama LSP, y el resto cambia de sigla, no de función.
- El flooding va por nivel, y hay dos bases de datos (una por nivel) y dos cálculos SPF separados.
- Esa separación por niveles es lo que hace barato un cambio: se recalcula donde ocurrió y el resto del mundo no se entera.
- En un segmento con varios equipos se elige un DIS; no hay suplente (no hay BDR), y la red se resincroniza con CSNP/PSNP.
- Toda la información viaja en TLV: fichas de tipo, largo y valor que permiten agregar cosas nuevas sin romper nada.

---

## 7. La métrica: del 10 fijo a la wide metric

### 7.1. Narrow vs wide (la evolución)

| Métrica | Valor por enlace | Alcance total | Cuándo |
|---------|------------------|---------------|--------|
| **Narrow** (vieja) | **10 fijo** por defecto (todos los enlaces cuestan lo mismo) | máx 1023 | IS-IS clásico, redes chicas |
| **Wide** (moderna) | customizable (hasta **16.777.215** por enlace) | máx 16 millones | Redes grandes, MPLS, TE |

> **La confusión clásica:** en IS-IS clásico, TODOS los enlaces cuestan **10** por defecto — no hay "ancho de banda en la métrica" como en OSPF. Elegir rutas solo por cantidad de saltos era el default histórico (de ahí que el CCNA no lo profundice: parece "menos inteligente" que OSPF). La **wide metric** llegó para permitir ingeniería de tráfico de verdad (con costos finos por enlace). Si ves `metric-style wide`, es red moderna.

La métrica es el número con el que el protocolo decide qué camino es mejor. Es el "precio del peaje" de cada ruta: si dos caminos llegan al mismo destino, gana el que suma menos. Y acá IS-IS tiene una historia curiosa que vale contar, porque explica una fama injusta.

En IS-IS clásico, **cada enlace cuesta 10**. Siempre. Un enlace de 10 Mbps y un enlace de 10 Gbps cuestan lo mismo: 10. Eso quiere decir que el protocolo elige el camino por **cantidad de saltos**, no por velocidad. En la analogía del transporte: es como si el camión eligiera la ruta contando cuántas ciudades atraviesa, sin mirar si la ruta es una autopista o un camino de tierra. Funciona, y con enlaces parejos funciona bien, pero no es lo que uno quiere en una red grande donde hay enlaces de capacidades muy distintas.

De ahí viene la fama de "menos inteligente que OSPF", que el original marca y que conviene matizar: no es que IS-IS no sepa medir; es que **el default histórico era contar saltos**. En OSPF el costo por defecto es proporcional al ancho de banda (más rápido, más barato), y por eso parece más fino de entrada.

La solución se llama **wide metric** ("métrica ancha", la versión moderna) y hace dos cosas: te deja poner **el costo que vos quieras** en cada enlace, hasta 16.777.215, y amplía el techo total a 16 millones (contra 1023 del clásico, que se quedaba corto enseguida). Con costos a medida podés hacer **ingeniería de tráfico**: por ejemplo, poner un costo alto a un enlace que no querés usar y bajo a uno que sí, sin tocar la topología física. Eso es lo que la tabla llama **TE**, *Traffic Engineering*, "ingeniería de tráfico": decidir por dónde va el tráfico por decisión de diseño y no por lo que salga del cálculo.

Las dos filas, entonces: **narrow** es la métrica vieja, 10 fijo por enlace, techo 1023, para redes chicas y para cuando querés compatibilidad con equipos antiguos. **wide** es la moderna, costo por enlace configurable, techo 16 millones, obligatoria si querés MPLS o ingeniería de tráfico.

### 7.2. El comando

```text
router isis
 metric-style wide          ← en redes modernas: SIEMPRE wide (compatible con TE/MPLS)
```

> **Regla de oro práctica:** si monto IS-IS hoy, `metric-style wide` y costos fino por interfaz (`isis metric 1000` sobre el enlace que quiero "achicar"). El narrow era la década del 90; no lo copies en diseño nuevo.

Qué hace este bloque, línea por línea:

- `router isis` entra al modo de configuración del proceso de IS-IS. Todo lo que sigue, mientras no salgas con `exit`, es configuración del protocolo, no de una interfaz. Fijate que no lleva número: un router Cisco soporta un solo proceso de IS-IS, así que no hay "router isis 1".
- `metric-style wide` le dice al proceso que use la métrica ancha. Es la línea que define si el router habla el IS-IS moderno o el clásico.

Qué tenés que ver en pantalla después: nada. Este comando no imprime salida. Lo verificás más tarde con `show isis protocol` o mirando que las rutas aparezcan con costos que no sean todos múltiplos de 10.

Y una advertencia que es el error número 3 de este manual: **`metric-style wide` tiene que estar en todos los routers del dominio**. Si un router quedó en narrow y otro en wide, los datos que intercambian no coinciden (los TLV de métrica son de otro tipo) y la vecindad no sube, o sube pero las rutas no aparecen. En un laboratorio con tres routers es fácil de revisar; en una red grande esto causa incidentes de horas.

El complemento del comando está en la interfaz, no en el proceso: `isis metric 1000` sobre una interfaz le pone costo 1000 a ese enlace puntual. Así se hace el diseño fino: costo bajo al enlace que querés preferir, costo alto al que querés dejar de respaldo. En la analogía del peaje: no cambiás las ciudades ni las rutas, cambiás el precio de cada tramo para que el camión elija el que vos querés.

### Resumen

- La métrica es el precio de cada enlace: gana el camino que suma menos.
- En el IS-IS clásico (narrow) todos los enlaces cuestan 10 fijo, así que se elige por saltos y no por velocidad.
- La métrica wide permite costo por enlace hasta 16 millones y es requisito para MPLS e ingeniería de tráfico.
- `metric-style wide` se configura una vez en el proceso, y tiene que estar igual en todos los routers del dominio.
- El costo puntual de un enlace se ajusta con `isis metric` en la interfaz.

---

## 8. Configuración: IS-IS en 10 minutos

### 8.1. La topología

```text
     ÁREA 49.0001            ÁREA 49.0002
  R1 ────── L1/L2 ──────── R2 (L2) ─────── L1/L2 ────── R3
  (L1)        │                │                (L1)
          R4 (L1)         R5 (L2)              R6 (L1)
```

Este dibujo hay que leerlo como el organigrama de la empresa del capítulo 5, no como un mapa de cables. Te lo traduzco:

- Arriba, dos áreas: `49.0001` a la izquierda y `49.0002` a la derecha. Son las dos plantas.
- En el medio hay una **fila de routers que se conectan entre sí** (los que están en la línea horizontal). Esa fila es el backbone, el nivel 2: la reunión de regionales. Fijate que atraviesa las dos áreas: eso es exactamente "backbone continuo".
- **R1 es L1**: está en el área 49.0001 y solo conoce su planta. Tiene un único camino hacia arriba, al router L1/L2.
- **R4 también es L1**: está colgando del L1/L2 por una pata vertical, dentro de la misma área.
- **R2 es L2**: no está en ninguna área; solo vive en el backbone. Es puro gerente regional.
- **R5 también es L2**, colgando del backbone.
- Los dos routers marcados **L1/L2** son los que hacen los dos trabajos: uno en cada área, un pie en su planta y otro en el backbone.
- **R3 y R6 son L1** en el área 49.0002, del otro lado.

La consecuencia importante del dibujo: R1 y R3 están en áreas distintas, así que **no se conocen ni se van a conocer**. R1 manda todo lo que no es de su área a su L1/L2, y ese lo pasa al backbone, y el otro L1/L2 lo baja al área 49.0002. Ningún router del camino tiene el mapa completo de las dos áreas. Si en un laboratorio te piden "que R1 vea la red de R3", la respuesta no es "configurar más", es "así funciona": R1 ve una ruta por defecto y un salto; el detalle lo maneja el L1/L2.

Un detalle de nomenclatura que confunde al principio: `49.0001` y `49.0002` son los identificadores de área, y no tienen nada que ver con las direcciones IP de los enlaces. Las dos cosas conviven: las IPs sirven para llegar a los hosts, el NET sirve para que los routers se reconozcan entre ellos. Son dos mapas superpuestos sobre el mismo cable.

### 8.2. La configuración (los 4 pasos de oro)

```cisco
! PASO 1: activar el proceso y darle el NET (obligatorio — sin NET no arranca)
router isis
 net 49.0001.0000.0000.0001.00     ! 49 + área 0001 + system-id + 00
 metric-style wide                  ! red moderna
 is-type level-1                    ! (R1 es L1; el L1/L2 usa "level-1-2" que es default)
!
! PASO 2: cada interfaz ENTRAR al proceso
interface GigabitEthernet0/0
 ip address 10.0.0.1 255.255.255.252
 ip router isis                     ! ← así la interfaz participa (no hay "network ... area")
!
! PASO 3: para los L1/L2, el otro lado
! (en el router que es L1/L2, las interfaces hacia el backbone L2 también llevan "ip router isis";
!  el nivel de la interfaz se controla con "isis circuit-type level-1/level-2/level-1-2")
```

Este es el bloque que hay que saber de memoria, así que lo leemos línea por línea. Es la configuración de R1 (el L1 del dibujo).

- `! PASO 1: ...` y cualquier línea que empiece con `!` es un **comentario**. El router la ignora. Sirve para que el que lea la configuración dentro de seis meses entienda qué quisiste hacer. Comentar la configuración no es de prolijo: es de profesional.
- `router isis` entra al proceso. Sin esta línea, todo lo demás no existe.
- `net 49.0001.0000.0000.0001.00` da la identidad. Acá se ve la anatomía del capítulo 4: área `49.0001`, System ID `0000.0000.0001` (R1), selector `00`. **Sin NET, IS-IS no arranca**, y no te avisa con un error simpático: el proceso queda ahí, mudo.
- `metric-style wide` ya lo conocemos: métrica moderna. Es la línea que hay que repetir igual en todos.
- `is-type level-1` le dice a este router que es **solo L1**. En R1 es lo correcto: es un router de borde de área, no necesita el mapa grande. En los L1/L2 no se pone nada, porque `level-1-2` es el valor por defecto.
- El `!` solo cierra el paso y separa visualmente.
- `! PASO 2: cada interfaz ENTRAR al proceso` es el concepto que rompe costumbres, y lo vemos en las tres líneas siguientes.
- `interface GigabitEthernet0/0` entra a la interfaz: la pata del router donde está el cable.
- `ip address 10.0.0.1 255.255.255.252` le pone la dirección IP y la máscara. La `255.255.255.252` es una máscara de 30 bits: deja lugar para dos equipos, que es justo lo que hay en un enlace punto a punto entre dos routers. No tiene nada que ver con IS-IS: es la dirección del sobrecito.
- `ip router isis` **engancha** esa interfaz al proceso: "en esta pata, hablá IS-IS". Es el equivalente del `network ... area` de OSPF, pero al revés: en OSPF declarás rangos de direcciones y el router adivina qué interfaces entran; en IS-IS vas interfaz por interfaz y decís "esta sí". Más trabajo, menos sorpresas: nunca te queda una interfaz adentro del protocolo sin que lo hayas querido.
- `! PASO 3: para los L1/L2, el otro lado` y las dos líneas de abajo son una nota para el lector, no configuración: explican que el router L1/L2 lleva `ip router isis` en **todas** sus interfaces (las de adentro del área y las del backbone) y que el nivel de cada interfaz se ajusta con `isis circuit-type`. Ese es el comando que decide, pata por pata, si esa interfaz habla L1, L2 o los dos.

Sobre `isis circuit-type`, un aviso de una línea que te va a ahorrar un laboratorio perdido: **en IOS los valores exactos del comando son `level-1`, `level-2-only` y `level-1-2`**. El `level-2` que aparece en el texto del bloque y en el error número 4 del capítulo 11 no es el literal que acepta el equipo: es la forma abreviada de hablar de "nivel 2". Si lo escribís tal cual, el router te lo rechaza.

Qué tenés que ver después de este bloque: el router **no** te dice "listo". La verificación es siempre la misma rutina de tres pasos que vimos en el manual de OSPF, adaptada: primero `show isis neighbors` (¿aparece el vecino?), después `show ip route isis` (¿aparecieron las rutas?), después un `ping` a una red del otro lado. Si el primero falla, el problema está en el enganche (NET, `ip router isis`, nivel, métrica). Si el primero anda y el segundo no, el problema está en el mapa (niveles mal ubicados, rutas por defecto ausentes).

Y un consejo de diseño que no está en el bloque pero es la diferencia entre un laboratorio y una red: acostumbrate a configurar el NET con el System ID derivado de una **loopback** (una interfaz virtual que siempre está arriba, aunque el cable esté desconectado), con un número prolijo tipo `0000.0000.0001`. Si derivás el System ID de la IP de un enlace real y ese enlace se cae, el router cambia de identidad y la red se entera de un cambio que no existió.

### 8.3. La sintaxis explicada (los 3 misterios resueltos)

```text
net 49.0001.0000.0000.0001.00
        └┬─┘ └────┬─────┘   └┬┘
     ID de área   System ID  NSEL (00)
     (define el    (único por   (siempre 00
      área del      router)      para IS-IS)
      router)

is-type level-1          ← roles:
is-type level-2             - L1 puro: solo su área (usa default hacia afuera)
is-type level-1-2           - L2 puro: solo backbone
                            - L1/L2: ambos (default; no hace falta configurarlo)

ip router isis           ← la interfaz entra al proceso (NO hay network X area Y)
```

Este bloque es un resumen visual de lo que ya explicamos, pero con los tres misterios juntos, que es como aparecen en un examen.

**Misterio 1: el NET.** El dibujo repite la anatomía de la sección 4.1, ahora con la flecha apuntando al pedazo que define el **área**: `49.0001`. Ese pedazo es lo único que decide en qué área está el router, y está adentro del NET, no en un comando aparte. Consecuencia práctica, y es la respuesta a la pregunta 7 del cuestionario: **cambiar de área es cambiar el NET**. No hay `area 1` ni nada parecido. Y como el System ID tiene que ser único en todo el dominio, cuando cambiás el área no cambiás el System ID: el router sigue siendo el mismo, solamente se mudó de planta.

**Misterio 2: los roles.** `is-type` tiene tres valores y el bloque los asocia a los tres roles: `level-1` para el L1 puro (que usa default hacia afuera), `level-2` para el L2 puro (solo backbone) y `level-1-2` para el que hace los dos trabajos, que **es el valor por defecto** (o sea, si no configurás nada, sos L1/L2). Ese default explica una confusión típica del laboratorio: si configurás un router, lo dejás así y le ponés `ip router isis` en dos interfaces de áreas distintas, te va a quedar un router que habla en los dos niveles y hace cosas raras. El default es cómodo, pero en una red diseñada se configura explícito.

De nuevo el aviso de una línea: en IOS el valor para L2 puro se escribe **`is-type level-2-only`**. El `level-2` del bloque es la forma de nombrar el nivel, no el literal del comando.

**Misterio 3: `ip router isis`.** La flecha del bloque lo dice con todas las letras: "la interfaz entra al proceso (NO hay network X area Y)". Este es el cambio de costumbre más grande que hay que hacer al venir de OSPF. En OSPF declarás "la red 10.0.0.0 con wildcard 0.0.0.3 pertenece al área 0" y el router busca qué interfaces caen en ese rango. En IS-IS no hay rangos: entrás a la interfaz y la enganchás. Ventaja: sabés exactamente qué interfaces participan, sin adivinar con wildcards. Desventaja: si te olvidás de una interfaz, esa interfaz simplemente no habla IS-IS y no hay ningún mensaje de error que te lo diga. Es el error número 2 del capítulo 11.

El orden que funciona en la práctica, para no olvidarse de nada:

1. Elegir el rol del router (L1, L2 o L1/L2) y anotarlo antes de configurar. Si dudás, volvé al capítulo 5.3.
2. Armar el NET: área según el diseño y System ID único derivado de la loopback.
3. `router isis`, después `net`, después `metric-style wide`, después `is-type` si no es L1/L2.
4. `ip router isis` en cada interfaz que tenga que participar, y `isis circuit-type` en las que van al backbone.
5. Verificar con la rutina de tres pasos (vecino, ruta, ping).

### Resumen

- La topología tiene dos áreas unidas por una fila de routers L2: ese es el backbone continuo del capítulo 5.
- La configuración son cuatro cosas: `router isis`, un `net` único, `metric-style wide` igual en todos, y `ip router isis` en cada interfaz.
- A diferencia de OSPF, no hay `network ... area`: cada interfaz se engancha explícitamente al proceso.
- El área está dentro del NET, así que cambiar de área es cambiar el NET (y el System ID se mantiene).
- `is-type` define el rol y su default es L1/L2; en IOS el L2 puro se escribe `level-2-only`.

---

## 9. Verificación: cómo preguntarle a la red

```text
R1# show isis neighbors

System Id      Type  Interface   IP Address      State  Holdtime  Circuit Id
0000.0000.0002 L2    Gi0/0       10.0.1.2        Up     9         01
                └─ el vecino      └─ nivel de la   └─ Up = vecindad viva
                   (system-id!)      adyacencia
```

Este es el primer comando que corrés siempre, y responde una sola pregunta: **¿tengo vecinos?**. Sin vecinos no hay mapa, y sin mapa no hay rutas. La salida tiene una línea por vecino, y cada columna es una respuesta:

- **System Id**: el nombre del vecino, en el mismo formato que el NET. Fijate que dice `0000.0000.0002`: es R2, con su System ID. Acá se ve por qué el System ID tenía que ser único: es el nombre con el que el vecino te aparece en pantalla.
- **Type**: el nivel de la adyacencia. `L2` quiere decir que esta vecindad es de backbone. Si esperabas una vecindad L1 y ves L2, hay un problema de `is-type` o de `circuit-type`.
- **Interface**: por qué pata del router se habla con ese vecino (`Gi0/0` es GigabitEthernet0/0).
- **IP Address**: la dirección del vecino en ese enlace. Ojo con esto: IS-IS no necesita IP para hablar, pero **sí** la necesita para que las rutas de IP sirvan; por eso aparece.
- **State**: el estado de la vecindad. **`Up` es lo que querés ver**. Si dice `Init` o `Down`, la conversación no se estableció.
- **Holdtime**: cuántos segundos faltan para que el vecino se declare caído si deja de mandar saludos. Es una cuenta regresiva: arranca en el valor del timer y se renueva con cada Hello. Ver un número que baja es normal; lo que no es normal es que llegue a cero.
- **Circuit Id**: el identificador del circuito, que en un segmento compartido dice quién es el DIS. En un enlace punto a punto es un detalle que podés ignorar.

El chequeo de un principiante, en una frase: **¿aparece el vecino y dice Up?** Si sí, la capa de vecindad está bien y el problema, si hay, está más arriba (niveles, rutas). Si no aparece nada, el problema está en el enganche: NET, `ip router isis`, `is-type`, o `metric-style` desalineado.

```text
R1# show ip route isis
I L1 10.0.2.0/30 [115/20] via 10.0.1.2, 00:10:00, GigabitEthernet0/0
│                        └── AD 115
└─ I = IS-IS    └─ L1: dentro del área (L2 = entre áreas)
```

El segundo comando responde la pregunta siguiente: **¿qué aprendió?**. Y esta línea tiene seis pedazos que hay que saber leer de corrido, porque es la salida que vas a mirar mil veces:

- **`I`**: el código de la fuente de la ruta. En la tabla de rutas cada protocolo tiene una letra, y `I` es IS-IS.
- **`L1`**: el nivel por el que se aprendió. `L1` es una ruta de adentro del área; `L2` sería una ruta que vino por el backbone. Es información que solo da IS-IS: en OSPF no ves "por qué área" vino una ruta dentro de la tabla.
- **`10.0.2.0/30`**: la red de destino, con su máscara en la notación `/30` (30 bits de máscara, dos equipos posibles).
- **`[115/20]`**: los dos números de la ruta. El primero, `115`, es la **AD**: la confianza que le tenés a esta fuente. El segundo, `20`, es la **métrica**: el costo acumulado hasta ese destino. Con la métrica narrow, 20 son dos saltos de 10. Si ves números raros, revisá `metric-style`.
- **`via 10.0.1.2`**: el próximo salto, o sea, a quién le tengo que entregar el paquete para que llegue. Es la IP del vecino.
- **`00:10:00`**: cuánto tiempo hace que esta ruta está en la tabla. Sirve para saber si la ruta es estable o si está cambiando todo el tiempo (un número chico y que se reinicia es señal de inestabilidad).
- **`GigabitEthernet0/0`**: por qué interfaz sale.

| Comando | Qué te dice |
|---------|-------------|
| `show isis neighbors` | Vecinos por system-id, nivel y estado |
| `show isis database` | La LSDB (LSPs): quienes publican y los sequence numbers |
| `show isis topology` | La visión de la red desde este router |
| `show ip route isis` | Rutas IS-IS (I = IS-IS; I L1 = intra-área, I L2 = inter-área) |
| `show clns neighbors` | Lo mismo pero en el mundo OSI (detalle fino) |

Los cinco comandos, con para qué sirve cada uno en un diagnóstico real:

- **`show isis neighbors`**: el primero de la lista y el primero que corrés. Responde "¿con quién me hablo y a qué nivel?".
- **`show isis database`**: muestra la base de datos de boletines, o sea el mapa. Ahí ves qué routers publican, con qué nombre y con qué **sequence number** (el número de versión de cada boletín, que sube cada vez que el router publica uno nuevo). Si el mapa parece incompleto, este comando te dice quién falta. Si ves un sequence number que no para de subir, hay un router inestable.
- **`show isis topology`**: la versión resumida y ordenada del mapa: quién llega a quién y a qué costo, por nivel. Es la foto que necesitás para entender por qué eligió el camino que eligió.
- **`show ip route isis`**: ya lo leímos. Es la respuesta final: qué rutas quedaron en la tabla.
- **`show clns neighbors`**: lo mismo que `show isis neighbors`, pero mostrado en el formato del mundo OSI. Como `clns` es el nombre OSI del servicio (capítulo 4), este comando es el mismo dato con otra ropa. Lo nombramos porque aparece en los libros y en los exámenes; en el día a día alcanza con el primero.

> **El código de tabla que confunde a todos:** en `show ip route`, IS-IS usa la letra **I**... y ¡EIGRP también usaba "D", OSPF "O", BGP "B", RIP "R"! No hay choque: cada letra es única. Pero OJO: la "I" de IS-IS NO es "interface". Aprendé las letras de la tabla de enrutamiento (las viste en selección de rutas) y leés la tabla sin pensar: D = EIGRP, O = OSPF, I = IS-IS, B = BGP.

Vale la pena insistir con eso de la `I`, porque es la confusión más frecuente de todas. Uno mira `I L1 10.0.2.0/30` y lee "interface, level 1", y no es eso: la `I` es el protocolo que aprendió la ruta. Y a propósito, la `D` de EIGRP no viene de "distance" ni de "dynamic": viene de **DUAL**, el nombre del algoritmo de EIGRP. Las letras son nombres propios, no iniciales descriptivas. Aprendelas como se aprenden los nombres de las calles: de memoria y sin buscarle la lógica.

La rutina completa de verificación, en orden, con qué conclusión sacás de cada paso:

1. `show isis neighbors` → ¿vecino `Up`? Si no, problema de enganche o de parámetros (NET, `ip router isis`, `is-type`, `metric-style`).
2. `show isis database` → ¿están todos los routers del área? Si falta alguno, el flooding no llegó: revisá niveles y enlaces.
3. `show ip route isis` → ¿aparecen las rutas esperadas, con `L1` adentro del área y `L2` para lo de afuera? Si falta una ruta, compará con `show isis topology` para ver si el mapa la tiene.
4. `ping` a una dirección del otro lado → la prueba final. Si el ping falla con rutas presentes, el problema ya no es de enrutamiento.

### Resumen

- `show isis neighbors` es el primer comando siempre: dice con quién hablás, a qué nivel y si está Up.
- `show ip route isis` se lee en seis pedazos: letra, nivel, red, [AD/métrica], próximo salto e interfaz.
- La letra de IS-IS en la tabla de rutas es `I`, y no significa "interface": significa IS-IS.
- Los cinco comandos de la tabla cubren vecindad, mapa y resultado; con dos de ellos ya diagnosticás casi todo.
- La rutina es siempre vecino, mapa, ruta y ping, en ese orden.

---

## 10. IS-IS vs OSPF: la comparación que siempre preguntan

| Criterio | OSPF | IS-IS |
|----------|------|-------|
| Familia | Estado de enlace | Estado de enlace |
| Algoritmo | SPF | SPF |
| AD | 110 | 115 |
| Requiere IP | Sí (multicast, protocolo 89) | **No** (PDU OSI, agnóstico del cómputo de direcciones) |
| Jerarquía | Áreas + **área 0 obligatoria** | **Niveles L1/L2** + backbone L2 contiguo |
| Rol frontera | ABR (interfaz en 2 áreas) | L1/L2 (un pie L1, un pie L2) |
| Métrica | Costo = ref/BW | Default 10 (narrow) o wide |
| Representante broadcast | DR **+ BDR** | **DIS sin backup** |
| IPv6 | OSPFv3 (otro proceso/familia) | Mismo proceso, natural |
| Escalabilidad | Muy alta (áreas) | Muy alta (L1/L2, pensado para ISP) |
| ¿Dónde brilla? | Empresa, CCNA, multi-fabricante | Backbones de ISP, MPLS, Juniper/Cisco |

> **La conclusión profesional:** no es "cuál es mejor": es **dónde juega cada uno**. En la empresa (y en el CCNA), OSPF. En un backbone de ISP con cientos de routers y MPLS encima, IS-IS (su no-dependencia de IP y su diseño L2 lo hacen excepcional ahí). Saber decir eso — con la tabla de arriba como evidencia — es más valioso que memorizar "115".

Leamos las once filas como un partido, no como una lista para memorizar. Las dos primeras ("familia" y "algoritmo") son empate: los dos son cartógrafos y los dos usan el mismo cálculo. Si un examen te pregunta "¿en qué se diferencia IS-IS de OSPF?", y contestás "en el algoritmo", está mal: en eso son idénticos.

"AD" es una diferencia administrativa de Cisco, no técnica: 110 contra 115. Importa para predecir qué ruta gana cuando llega la misma red por los dos, no para decidir el diseño.

"¿Requiere IP?" es la diferencia grande número uno. OSPF habla dentro de paquetes IP (multicast y protocolo 89); IS-IS habla en su propio idioma sobre el enlace. De ahí sale todo lo demás: la independencia de la familia de direcciones y la naturalidad con IPv6.

"Jerarquía" y "rol frontera" son la diferencia grande número dos, y van juntas: áreas con área 0 obligatoria y routers de frontera con interfaces en dos áreas, contra niveles L1/L2 con backbone contiguo y routers que tienen un pie en cada nivel. Es la misma necesidad resuelta de dos maneras.

"Métrica" es la diferencia que más se malinterpreta: el default de OSPF es un costo calculado a partir del ancho de banda de referencia (la fila lo escribe como "ref/BW": referencia dividido ancho de banda), mientras que el default de IS-IS clásico es 10 fijo. Con wide metric, IS-IS alcanza a OSPF y lo supera en fineza, pero el default histórico es el que la gente recuerda.

"Representante broadcast" es la diferencia de diseño más citada en los exámenes finos: DR más BDR contra DIS sin backup. Con la explicación del capítulo 6.3 a mano, esta fila se defiende sola.

"IPv6" se explica con el punto de "requiere IP": OSPF necesitó una versión nueva (OSPFv3, que es otro proceso con otra configuración), IS-IS sumó un tipo de TLV y listo, con el mismo proceso.

"Escalabilidad" es empate con matiz: los dos escalan muy bien, pero IS-IS fue pensado para el caso extremo. Y "¿dónde brilla?" es la fila que hay que poder decir en voz alta en una entrevista, porque demuestra criterio y no memoria.

Un cierre honesto sobre el "multi-fabricante" de la última fila: OSPF es un estándar abierto implementado por prácticamente todo el mundo, así que en una red con equipos de varias marcas es la apuesta segura. IS-IS también es un estándar abierto, pero el ecosistema que lo usa está concentrado en los operadores y en los equipos de las marcas grandes. Esa es la razón práctica por la que en una empresa chica nadie te va a pedir IS-IS, y en un proveedor te lo van a pedir el primer día.

### Resumen

- En lo importante son iguales: estado de enlace, algoritmo SPF, mapa completo en cada router.
- Las dos diferencias de fondo son que IS-IS no depende de IP y que usa niveles (L1/L2) en lugar de áreas con área 0.
- La AD 115 contra 110 es un detalle de Cisco que decide empates, no diseños.
- En métrica, OSPF arranca midiendo ancho de banda y el IS-IS clásico cuenta saltos; con wide metric, IS-IS empareja.
- La respuesta profesional es por escenario: OSPF en la empresa, IS-IS en el backbone del proveedor.

---

## 11. Los 5 errores más comunes

| # | Error | Síntoma | Fix |
|---|-------|---------|-----|
| 1 | **Falta el NET** (o NET con system-id duplicado) | IS-IS no levanta / vecindades que se pisan | NET único por router: `net 49.0001.0000.0000.000X.00` |
| 2 | **Falta `ip router isis` en la interfaz** | Proceso corriendo pero sin vecinos | "enganchar" cada interfaz: `ip router isis` (no hay `network`) |
| 3 | **Narrow vs wide desalineados** | Vecindad que no sube (los "TLV" no matchean) | `metric-style wide` igual en todo el dominio |
| 4 | **Circuit-type mal** (L1 donde debería L2) | Rutas inter-área ausentes | `isis circuit-type level-2` en la interfaz del backbone |
| 5 | **System ID mal formateado** (grupos de 4) | NET inválido: no arranca | Formato 3-4-4-2: `49.0001.0000.0000.0001.00` — 13 dígitos de autoridad+system |

> **El error #1 es el "sin NET no hay IS-IS":** a diferencia de OSPF (que elige RID solo), IS-IS te exige el NET a mano. Y si dos routers tienen el MISMO system-id... los LSP se pisan como con RID duplicado en OSPF (mismo síntoma, mismo remedio: unicidad absoluta).

Los cinco, con el diagnóstico en palabras de todos los días:

1. **Falta el NET o está duplicado.** Es el error de arranque: sin NET el proceso no existe (el router no tiene identidad en el mundo OSI), y con dos System ID iguales la red tiene dos routers con el mismo nombre. El síntoma del duplicado es el peor de todos porque es intermitente: las vecindades suben y bajan, las rutas aparecen y desaparecen, y no hay ningún mensaje de error que diga "hay dos routers con el mismo nombre". Remedio: un NET por router, con el System ID derivado de su propia loopback.
2. **Falta `ip router isis` en la interfaz.** El proceso está corriendo, el NET está bien, y no pasa nada: cero vecinos. La causa es que ninguna interfaz está enganchada (capítulo 8.2). Como no hay `network ... area`, no hay nada que "adivine" qué interfaces entran. Chequeo rápido: `show isis interface` te dice qué interfaces están enganchadas.
3. **Narrow contra wide desalineados.** Un router con métrica ancha y otro con la clásica intercambian datos que no se entienden (los TLV de métrica son de distinto tipo), y la vecindad no sube o sube a medias. Remedio: `metric-style wide` en todos, y revisar que no haya quedado ninguno viejo.
4. **Circuit-type mal puesto.** Un enlace al backbone configurado como si fuera de adentro del área. La vecindad sube (los dos hablan L1 y se entienden), pero las rutas entre áreas no aparecen, porque nunca se armó la conversación del nivel 2. El síntoma es el más confuso: "hay vecinos, hay rutas de mi área, pero no llego a la otra área". Remedio: `isis circuit-type` correcto en la interfaz del backbone. Y el aviso de siempre: en IOS el literal es `level-2-only`, no `level-2`.
5. **System ID mal formateado.** El NET no entra o el router no arranca el protocolo. Pasa por escribir los grupos con otro largo (cinco dígitos, tres grupos en vez de tres de cuatro, un punto de más) o por copiar un NET de un apunte sin revisar. Remedio: el System ID son tres grupos de cuatro dígitos hexadecimales, y el NET completo termina en `.00`. Sobre la nota "3-4-4-2 / 13 dígitos" de la tabla, vale la aclaración del capítulo 4.1: lo que manda es la cantidad de bytes (área, 6 bytes de System ID, 1 byte de selector), no la forma de agrupar los dígitos.

Un consejo transversal para los cinco: en IS-IS, **casi todos los errores son de configuración estática, no de convergencia**. El protocolo no "falla solo": alguien olvidó una línea. Por eso la lista de verificación del capítulo 8.3 (rol, NET, métrica, interfaces, verificación) evita el 90 por ciento de estos casos, y por eso el capítulo 9 empieza siempre por "¿tengo vecinos?".

### Resumen

- Los cinco errores son de configuración: falta el NET, falta el enganche de la interfaz, métrica desalineada, nivel mal puesto o NET mal escrito.
- El NET duplicado es el peor porque es intermitente y no da mensaje de error.
- Sin `ip router isis` el proceso corre y no hay vecinos: no existe un `network ... area` que lo haga por vos.
- Narrow y wide tienen que coincidir en todo el dominio, si no las vecindades no suben.
- Un nivel mal puesto se ve como "hay vecinos y rutas locales pero no llego a la otra área".

---

## 12. Comprobá lo que aprendiste

**1. ¿Por qué IS-IS no depende de IP para funcionar?**

**Ver respuesta:** Porque nació en la pila OSI: usa sus propias PDUs sobre el enlace (nivel 2 directo), no multicast IP ni protocolo IP (a diferencia de OSPF con 224.0.0.5 / protocolo 89). Eso lo hace agnóstico del tipo de dirección (IPv4/IPv6/CLNS) y muy robusto en backbones — y es la razón histórica de que los ISP lo eligieran.

**2. ¿Qué es un NET y por qué es obligatorio?**

**Ver respuesta:** NET = Network Entity Title: la dirección OSI del router, formato 49.área.system-id.00. Define el área (en la porción de autoridad+área) Y la identidad (system-id, único por router). Sin NET configurado IS-IS no arranca — es su "matrícula".

**3. ¿Qué son L1, L2 y L1/L2?**

**Ver respuesta:** L1 = enrutamiento dentro del área (usa default hacia afuera). L2 = enrutamiento entre áreas (el backbone, que debe ser contiguo). L1/L2 = ambos niveles: el equivalente del ABR de OSPF, con un pie en su área y otro en el backbone L2.

**4. ¿IS-IS tiene "área 0"?**

**Ver respuesta:** No. No existe área 0 en IS-IS: la jerarquía es por niveles y el backbone es el nivel 2 (contiguo). La exigencia equivalente a "todo toca el área 0" es "el backbone L2 debe ser contiguo".

**5. ¿Qué es el DIS y en qué se diferencia del DR de OSPF?**

**Ver respuesta:** DIS = Designated Intermediate System: el representante del segmento broadcast (como el DR). Diferencias: NO hay BDR/backup (si muere, se reelige), el desempate es prioridad + system-id/MAC, y la resincronización se apoya en CSNP/PSNP.

**6. ¿Qué significa `metric-style wide`?**

**Ver respuesta:** Usar métrica amplia (ancho): costos por enlace hasta ~16 millones (vs narrow, default 10 fijo, máx 1023). Es lo correcto en redes modernas y requisito para ingeniería de tráfico/MPLS.

**7. ¿Cómo se configura el área en IS-IS?**

**Ver respuesta:** El área está DENTRO del NET (parte de autoridad+área del NET: 49.0001, 49.0002...). No existe un comando "area" separado; y las interfaces se enganchan al proceso con `ip router isis`, no con `network ... area`.

**8. ¿Qué letra usa IS-IS en la tabla de rutas y qué AD tiene?**

**Ver respuesta:** **I** (I L1 = intra-área, I L2 = inter-área) y AD **115**. Ojo: no confundir con OSPF (O, 110) ni con EIGRP (D, 90). Detalle fino: si un router aprende la misma ruta por OSPF y IS-IS, gana OSPF por 5 puntos de AD.

Si contestaste las ocho sin mirar, ya podés defender el protocolo en una entrevista. Si te trabaste en la 4 o en la 5, volvé al capítulo 5 (jerarquía) y al 6.3 (DIS): esas dos son las que separan "leí el manual" de "entendí el protocolo". Y si te trabaste en la 1, volvé al capítulo 2: la historia es la explicación.

### Resumen

- El cuestionario cubre los ocho conceptos que se preguntan siempre: origen, NET, niveles, área 0, DIS, métrica, configuración del área y letra/AD.
- Las respuestas cortas sirven para el examen; el desarrollo está en los capítulos que cada pregunta referencia.
- Si podés explicar el NET y los niveles sin mirar, el resto del protocolo se ordena solo.

---

## 13. Glosario

| Término | Qué es |
|---------|--------|
| **IS / ES** | Intermediate System (router) / End System (host) — vocabulario OSI |
| **NET** | Network Entity Title: la dirección OSI del router (49.área.system-id.00) |
| **System ID** | Identidad de 6 bytes del router dentro del dominio (única) |
| **L1 / L2 / L1-L2** | Niveles de enrutamiento: dentro del área / entre áreas (backbone) / ambos |
| **LSP** | Link State PDU: el "LSA" de IS-IS |
| **DIS** | Designated IS: representante del segmento broadcast (sin BDR) |
| **CSNP/PSNP** | PDUs de resincronización de la LSDB (completas/parciales) |
| **SNPA** | Dirección de capa 2 del enlace (MAC, etc.) |
| **Narrow / Wide metric** | Métrica vieja (10 fijo, máx 1023) vs moderna (hasta 16M, para TE) |
| **AD 115** | Administrative Distance de IS-IS en Cisco (vs 110 OSPF) |

Cada término, en una frase que puedas repetir:

- **IS / ES**: el router y el host, con los nombres formales del mundo OSI.
- **NET**: el DNI del router. Se configura una vez por equipo y sin él no hay protocolo.
- **System ID**: los 6 bytes del medio del NET. Es el nombre único del router en todo el dominio; si se repite, el mapa se rompe.
- **L1 / L2 / L1-L2**: los tres roles. Adentro del área, el backbone, y los dos a la vez.
- **LSP**: el boletín que cada router publica con sus enlaces. Es el LSA de OSPF con otro nombre.
- **DIS**: el vocero del segmento compartido. Uno solo, sin suplente.
- **CSNP/PSNP**: las listas de "qué boletines tengo" que permiten resincronizar sin depender del DIS. La primera es completa, la segunda parcial.
- **SNPA**: cómo se llama la pata del router en el cable (la MAC en Ethernet).
- **Narrow / Wide metric**: la métrica vieja de 10 fijo y la moderna de costo libre. La moderna es la que se usa hoy.
- **AD 115**: la confianza que Cisco le da a IS-IS. Cinco puntos menos que OSPF.

Cuatro más que no están en la tabla del original y que te van a aparecer leyendo cualquier libro del tema:

- **CLNS**: el servicio de red de la pila OSI (el equivalente de IP en ese mundo). Es de donde viene todo el vocabulario y el nombre de los comandos `show clns`.
- **TLV**: la ficha de tipo, largo y valor con la que IS-IS empaqueta cada dato. Es lo que le permitió crecer sin cambiar de versión.
- **Backbone**: la red troncal, el nivel 2 en IS-IS. No es un área: es el nivel que atraviesa todas las áreas.
- **ISP**: el proveedor de Internet. El cliente típico de IS-IS y la razón por la que el protocolo está diseñado como está.

### Resumen

- El glosario es la tabla de traducción entre el mundo OSI y el mundo IP: IS es router, ES es host, NET es la dirección del router.
- Los tres términos que más se usan son NET (identidad), System ID (nombre único) y los niveles L1/L2.
- DIS, CSNP y PSNP son la parte de la maquinaria que reemplaza al DR/BDR de OSPF.
- CLNS y TLV son las dos palabras que explican por qué IS-IS es tan flexible.

---

## 14. Resumen en 10 puntos

1. **IS-IS es el otro link-state**: mismo SPF/Dijkstra que OSPF, pero nacido en la OSI — por eso los ISP lo aman (agnóstico de IP).
2. **No depende de IP**: habla con PDUs propias sobre el enlace; IPv4 e IPv6 en el mismo proceso, naturalmente.
3. **El NET es la matrícula**: 49.área.system-id.00 — obligatorio, con system-id único por router; el área vive DENTRO del NET.
4. **Jerarquía por niveles, no por áreas**: L1 (intra-área), L2 (entre áreas, backbone contiguo), L1/L2 (ambos — el "ABR").
5. **Sin área 0**: la exigencia equivalente es "backbone L2 contiguo". Todos los caminos inter-área pasan por L2.
6. **Dos SPF por router L1/L2**: uno por LSDB de nivel — el aislamiento por nivel es parte de la escalabilidad brutal.
7. **El DIS no tiene BDR**: el representante del segmento broadcast se reelige si muere; la robustez la dan los CSNP/PSNP.
8. **Métrica**: narrow (10 fijo) en el clásico; **wide** (hasta 16M) para redes modernas y MPLS — usá wide.
9. **Config en 4 pasos**: `router isis` + `net` + `metric-style wide` + `ip router isis` en cada interfaz (no hay `network area`).
10. **AD 115, letra I en la tabla**: y la decisión profesional es por escenario: OSPF en la empresa, IS-IS en el backbone del ISP.

Leé esta lista como el índice al revés: cada punto condensa un capítulo. Si te llevás uno solo, llevate el 4: la jerarquía por niveles es la idea que hace que todo lo demás tenga sentido. Los niveles explican por qué no hace falta un área 0, por qué hay dos SPF, por qué el L1 puede vivir con una ruta por defecto y por qué un proveedor con cientos de routers duerme tranquilo.

Y si te llevás dos, sumá el 2: la independencia de IP es la razón histórica. Un protocolo que habla en su propio idioma sobre el cable puede enrutar cualquier cosa, y esa libertad es la que en 1990 parecía un detalle y en 2024 es una ventaja estructural.

> **Nota de una línea:** el punto 1 dice "link-state": en castellano, "estado de enlace", la misma familia de protocolos que OSPF.

### Resumen

- IS-IS es estado de enlace con nombre propio: mismo motor que OSPF, otro origen y otra jerarquía.
- Las dos ideas que hay que retener son la independencia de IP y la jerarquía por niveles L1/L2.
- Con cuatro comandos se configura, y con dos de verificación se diagnostica.
- El NET es obligatorio y único; el backbone L2 tiene que ser contiguo; la letra de la tabla es I y la AD es 115.
- La elección entre IS-IS y OSPF se hace por escenario, no por preferencia.

---

> **Fuente:** Documentación propia basada en RFC 1142 (IS-IS), RFC 1195 (Integrated IS-IS), CCNA 200-301 Official Cert Guide (W. Odom), Cisco IOS Configuration Guides y material educativo de redes.

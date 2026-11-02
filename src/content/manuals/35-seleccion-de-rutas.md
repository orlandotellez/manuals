# 35. Selección de Rutas: AD, Métricas y Longest Prefix Match

**Cuando un router conoce varios caminos, ¿cuál elige?**

Este manual responde una sola pregunta, pero es la pregunta que ordena todo el enrutamiento: cuando un router tiene **varias rutas que sirven** para el mismo paquete, ¿cuál usa?

Vamos a definir las palabras a medida que aparecen, así que no hace falta que sepas nada de redes para arrancar. Aun así, tres términos van a aparecer en la primera página y conviene tenerlos desde el principio:

- Un **router** (en español, encaminador) es un equipo con varias patas, cada una en una red distinta, cuyo trabajo es pasar paquetes de una red a otra. Una pata es una **interfaz**: el conector por donde sale el cable. Un router de tu casa es exactamente eso, con dos interfaces: una hacia tu red y una hacia el proveedor.
- Un **paquete** es el sobrecito de datos que viaja por la red. Tiene una dirección de origen y una de destino, igual que una carta.
- Una **ruta** es una frase que el router guarda en la memoria: "para llegar a tal red, mandá el paquete por tal interfaz, entregándoselo a tal vecino". El conjunto de rutas es la **tabla de enrutamiento**, y es la única herramienta que el router consulta para decidir.

Con eso alcanza para empezar. Lo que vas a aprender acá es a **predecir** esa decisión. No "más o menos": exactamente. Si entendés el orden de tres comparaciones, podés mirar la tabla de cualquier router del mundo y decir por dónde va a salir el próximo paquete antes de que salga.

Y hay un motivo práctico: cuando algo "no anda" en una red, la causa casi siempre es una ruta que ganó cuando vos querías otra. Con este orden, el diagnóstico son tres preguntas que se responden en un minuto.

---

## Índice

- [El problema: muchos caminos, una sola decisión](#1-el-problema-muchos-caminos-una-sola-decisión)
- [La jerarquía de decisión: el orden exacto](#2-la-jerarquía-de-decisión-el-orden-exacto)
- [Longest Prefix Match: la regla del más específico](#3-longest-prefix-match-la-regla-del-más-específico)
- [Administrative Distance: la confianza en la fuente](#4-administrative-distance-la-confianza-en-la-fuente)
- [Métrica: la comparación dentro del mismo protocolo](#5-métrica-la-comparación-dentro-del-mismo-protocolo)
- [El orden completo aplicado a casos reales](#6-el-orden-completo-aplicado-a-casos-reales)
- [Balanceo de carga: cuando hay empate](#7-balanceo-de-carga-cuando-hay-empate)
- [La ruta por defecto en el proceso de selección](#8-la-ruta-por-defecto-en-el-proceso-de-selección)
- [Verificación: cómo ver la decisión en el router](#9-verificación-cómo-ver-la-decisión-en-el-router)
- [Aplicación: ejercicios resueltos y laboratorio](#10-aplicación-ejercicios-resueltos-y-laboratorio)
- [Errores comunes](#11-errores-comunes)
- [Comprobá lo que aprendiste](#12-comprobá-lo-que-aprendiste)
- [Glosario](#13-glosario)
- [Resumen en 10 puntos](#14-resumen-en-10-puntos)

Cómo usar este índice: cada título es un capítulo y también es la dirección (la URL) con la que se publica la página. Si tenés poco tiempo, el camino corto es el capítulo 2 (el orden de la decisión), el 3 (la ruta más específica gana), el 4 (de qué fuente me fío más) y el 5 (cuál es la mejor dentro de la misma fuente). Con esos cuatro ya podés resolver cualquier tabla. Los demás capítulos son los casos donde la decisión duele: empates, rutas por defecto, cómo mirarlo en el router y qué hacer cuando "no gana la que yo quería".

### Resumen

- El manual enseña a predecir qué ruta elige un router cuando hay varias candidatas para el mismo paquete.
- Todo se reduce a tres comparaciones en un orden fijo: especificidad, confianza en la fuente y métrica.
- Las palabras técnicas (router, paquete, ruta, tabla) se definen antes de usarlas.
- El camino corto son los capítulos 2, 3, 4 y 5; el resto son los casos difíciles.

---

## 1. El problema: muchos caminos, una sola decisión

### 1.1. "¿Por dónde voy?"

En el tema de rutas estáticas viste que cada router decide **paquete por paquete** con su tabla de enrutamiento. Pero hay un caso que no tocamos: ¿qué pasa cuando el router tiene **DOS rutas para el MISMO destino**?

Ejemplo real: R1 puede llegar a la red `172.16.0.0/16` por dos caminos:

```text
         ┌── R2 ──┐
R1 ──────┤        ├── 172.16.0.0/16
         └── R3 ──┘
```

Leé el dibujo como se leen todos los diagramas de red: la `R` es de router, el número es solo un nombre (R1 es "el router uno") y las líneas son cables. El texto de la derecha, `172.16.0.0/16`, es la **red de destino**. Esa forma se llama notación **CIDR** (*Classless Inter-Domain Routing*, enrutamiento sin clases): el número después de la barra dice cuántos bits, contados desde la izquierda, identifican la red. Cuanto más grande, más chica y más precisa es la red. En el capítulo 3 lo desarmamos.

Entonces, volviendo al dibujo: desde R1 salen dos cables, uno hacia R2 y otro hacia R3, y los dos routers llegan a la misma red de destino. R1 tiene dos rutas para el mismo lugar, y las dos son técnicamente válidas.

- Por R2 aprendió una ruta **estática** (la puso el administrador a mano).
- Por R3 aprendió la misma red por **OSPF** (un protocolo dinámico).

**OSPF** son las siglas de *Open Shortest Path First*, "primero el camino más corto, y abierto". Es un protocolo de enrutamiento dinámico: un programa que corre en los routers, se habla con los routers vecinos y **descubre solo** los caminos, sin que nadie escriba las rutas a mano. En cambio, una **ruta estática** es una línea que un humano escribió en la configuración y que el router obedece sin discutir. Si querés el detalle de las estáticas, está en el manual de rutas estáticas; acá nos importa solo que existen las dos y que pueden apuntar al mismo destino.

Y hay tres preguntas posibles, de distinta naturaleza:

- ¿Cuál gana, la estática o la que aprendió OSPF? (dos **fuentes** distintas)
- ¿Y si en vez de dos fuentes distintas fuera la misma fuente ofreciendo dos caminos? (dos caminos de OSPF)
- ¿Y si hay una ruta a `172.16.0.0/16` y otra a `172.16.5.0/24`, y el paquete va a `172.16.5.7`? (dos rutas de distinta **precisión**)

Las tres preguntas se responden con el mismo procedimiento, pero con piezas distintas. Y ahí está el problema del principiante: mezcla las tres y termina cambiando la configuración equivocada.

> **La idea madre de este manual:** cuando un router conoce varias rutas, NO elige "al azar" ni "la primera que vio". Sigue un **orden fijo y jerárquico** de tres preguntas, siempre en el mismo orden: ¿cuál es más específica? → ¿de qué fuente vino? → ¿cuál tiene mejor métrica? Si sabés ese orden, podés predecir la decisión de CUALQUIER router del mundo.

### 1.2. El cimiento: distinguir dos tipos de comparación

Antes del orden, el concepto que evita el 80% de las confusiones:

> Hay DOS comparaciones distintas, y los principiantes las mezclan:
>
> 1. **Comparación ENTRE fuentes** (estática contra OSPF, OSPF contra EIGRP...) → se resuelve con **Administrative Distance (AD)**.
> 2. **Comparación DENTRO de la misma fuente** (dos rutas OSPF, dos rutas EIGRP...) → se resuelve con **métrica**.
>
> "¿Gana la estática o el OSPF?" es una pregunta de AD. "¿Gana esta ruta OSPF o esta otra ruta OSPF?" es una pregunta de métrica. NUNCA se compara la métrica de un protocolo con la de otro: la métrica solo decide dentro de su propia familia.

Aclaremos las dos siglas nuevas de una vez, porque van a aparecer en cada página:

La **AD** (*Administrative Distance*, distancia administrativa) es un número que mide **cuánto confía el router en la fuente que le contó esa ruta**. No mide calidad del camino ni velocidad: mide confianza en el que avisa. Es un número chico cuando la fuente es muy confiable, y grande cuando es dudosa.

La **métrica** es un número que mide **qué tan bueno es el camino**, según la forma de medir de esa fuente. Ahí sí hay distancia, costo o cantidad de saltos. Y como cada protocolo mide a su manera, el número de uno no se puede comparar con el número de otro.

La metáfora que lo resume:

> **Analogía:** la AD es la **jerarquía de la empresa** (el gerente gana al pasante, sin importar cuánto se esfuercen). La métrica es el **desempeño dentro del mismo cargo** (entre dos gerentes, gana el que entrega más rápido). No comparás el gerente con el pasante por "rapidez": el gerente gana primero, y recién después comparás entre gerentes.

Y la versión de la vida diaria, que es la que vas a usar para la AD en todo el manual:

> **Analogía del ranking de confianza:** imaginate que tenés que llegar a una casa y te dan indicaciones tres personas. Primero te habla alguien que vive en esa misma cuadra: le creés sin dudar. Después te habla un amigo que la conoce de nombre: le creés, pero con menos fe. Y por último un desconocido que pasaba por ahí: lo escuchás, pero si lo que dice choca con lo que te dijo el vecino, gana el vecino. Eso es la AD: un ranking de confianza **entre fuentes**, establecido de antemano, que no se discute caso por caso. El vecino no es "más rápido" que el desconocido: tiene mejor puesto en tu ranking.

Un detalle que conviene fijar ahora: las dos comparaciones nunca se mezclan porque **la AD decide primero**. Si dos rutas vienen de fuentes distintas, se mira la AD y se termina ahí: el número de la métrica de la perdedora no importa, no se compara, no se suma. Por eso este manual insiste tanto con "entre fuentes" y "dentro de la fuente".

### Resumen

- Un router puede tener varias rutas válidas al mismo destino, y tiene que elegir una.
- Hay dos comparaciones distintas: **entre fuentes** (se resuelve con AD) y **dentro de una fuente** (se resuelve con métrica).
- La AD es un ranking de confianza en la fuente; la métrica mide qué tan bueno es el camino dentro de esa fuente.
- Nunca se compara la métrica de un protocolo contra la de otro: la AD ya decidió la familia.
- La analogía para sostener todo el manual: jerarquía (AD) y desempeño (métrica).

---

## 2. La jerarquía de decisión: el orden exacto

El proceso que sigue TODO router Cisco (y la lógica es igual en cualquier fabricante) cuando le llega un paquete es este:

```text
PASO 1 — LONGEST PREFIX MATCH
"¿Cuál de mis rutas es la más específica para este destino?"
   → Se comparan TODAS las rutas, sin importar la fuente.
   → Gana la máscara más larga (el prefijo más largo).
          │
          ▼
   (si más de una ruta tiene el MISMO prefijo más largo)
          │
PASO 2 — ADMINISTRATIVE DISTANCE
"¿De qué fuente vino cada una? Gana la de menor AD"
   (la fuente "más confiable")
          │
          ▼
   (si la misma fuente tiene varias rutas con el mismo prefijo)
          │
PASO 3 — MÉTRICA
"¿Cuál tiene la mejor métrica dentro de ese protocolo?"
   → Gana la de menor métrica.
          │
          ▼
   (si TODAVÍA hay empate: varias rutas idénticas)
          │
PASO 4 — EMPATE FINAL
→ Puede haber balanceo de carga (sección 7) o
   el router elige por criterios internos de desempeño
```

Este bloque es el esqueleto del manual, así que vamos línea por línea. Las mayúsculas son los nombres de los pasos, y esos nombres aparecen en los comandos del router: `distance` es el paso 2 y `metric` el paso 3. Lo que está entre comillas es la pregunta que el router se hace en ese paso. Las flechas que bajan (`│` y `▼`) marcan el orden: no se saltea un paso, y solo se baja si el anterior empató. Los paréntesis con "si" son esa condición. Las flechas con `→` a la derecha son la respuesta del paso. El último renglón, "criterios internos de desempeño", es un desempate propio del router que casi nunca hace falta predecir.

Fijate en algo que este dibujo deja clarísimo y que mucha gente no tiene claro: **la AD no es el primer paso**. El primer paso es la especificidad de la ruta, y se aplica a todas las rutas sin mirar de dónde vinieron. La AD aparece recién cuando ya hay empate en especificidad.

> **El truco mental para no olvidarlo:** primero **especificidad** (¿cuál le queda más fina al destino? → LPM), después **confianza** (¿en quién confío más? → AD), después **performance** (¿cuál es mejor dentro de su familia? → métrica). Especificidad → Confianza → Performance. "Cómo de fina, de quién, y qué tan buena".

Antes de seguir, la sigla del paso 1: **LPM** es *Longest Prefix Match*, "coincidencia del prefijo más largo". Es el nombre técnico de "gana la ruta más precisa". El **prefijo** es la parte de la dirección que identifica la red (lo que está antes de la barra en `/24`), y "más largo" quiere decir "con más bits de red", o sea más específico, o sea una porción más chica del mundo.

### 2.1. La receta: qué hacer con la tabla de rutas en la mano

Esto es lo que viniste a buscar. Dejalo al lado del teclado: la próxima vez que tengas un `show ip route` en pantalla y un paquete que no va por donde querés, seguí estos seis pasos en orden.

1. **Escribí el destino completo.** Anotá en un papel la dirección IP del paquete (por ejemplo `172.16.5.7`). No la red: la dirección del paquete, con todos sus números. Todo lo que sigue se hace contra ese número.
2. **Listá solo las rutas que matchean.** Recorré la tabla y quedate con las rutas cuya red **contiene** esa dirección. Una ruta contiene la dirección si, al comparar los bits de red, coinciden todos. Las que no matchean se tachan y no se vuelven a mirar. Si no matchea ninguna y hay una ruta por defecto (`0.0.0.0/0`), esa es la única candidata; si tampoco hay default, el paquete se descarta y no hay nada más que decidir.
3. **Contá el prefijo de cada candidata y descartá todas menos las del prefijo más largo.** Ese número después de la barra es la única medida que importa en este paso: `/26` le gana a `/24`, y `/24` le gana a `/8`, siempre, sin importar la fuente ni el protocolo ni el orden en que se configuraron.
4. **Si te quedó una sola, listo: esa gana.** Pará acá. No mires la AD: no hay con quién compararla.
5. **Si te quedaron varias con el mismo prefijo, mirá la AD de cada una y quedate con la de menor número.** Menor AD = fuente más confiable. Estática (1) le gana a OSPF (110). Si después de esto queda una sola, esa gana.
6. **Si siguen empatadas en la AD (o sea, son todas de la misma fuente), mirá la métrica y quedate con la de menor número.** Si incluso la métrica empata, el router instala todas y reparte el tráfico: eso es el balanceo de carga del capítulo 7.

La misma receta, en formato de tabla para tener a mano:

| Paso | Pregunta que te hacés | Qué gana |
|------|-----------------------|----------|
| 1-2 | ¿Qué rutas contienen la dirección del paquete? | Las que matchean pasan; el resto se descarta |
| 3-4 | ¿Cuál tiene el prefijo más largo? | La más específica, sin importar la fuente |
| 5 | Mismo prefijo, ¿de qué fuente vienen y cuál es más confiable? | La de menor AD |
| 6 | Misma fuente, ¿cuál camino es mejor? | La de menor métrica |
| — | Todo empatado | Balanceo de carga (ECMP) |

Leé las columnas así: la primera dice en qué paso estás (los pasos 1 y 2 van juntos porque son la misma operación mental: buscar y descartar), la segunda es la pregunta en castellano y la tercera es la respuesta que escribís en el papel. La rayita de la última fila no es un paso: es el caso en que no hay ganadora. Y **ECMP** son las siglas de *Equal-Cost Multi-Path*, "varios caminos de igual costo": el nombre técnico del balanceo (capítulo 7).

### 2.2. Un matiz que aclara todo

El **Longest Prefix Match NO es una "fuente" ni un "protocolo": es una propiedad matemática de la máscara** y se aplica PRIMERO, siempre. Este es el punto que el temario remarca y que casi nadie explica bien:

> Una ruta estática poco específica NO gana contra una ruta OSPF más específica. La especificidad manda ANTES que la confianza. Si tenés una OSPF a `10.1.1.0/24` y una estática a `10.0.0.0/8`, un paquete a `10.1.1.5` va por OSPF — porque `/24` es más específica que `/8`, y la especificidad se compara primero, sin importar que la estática sea "más confiable".

Traducido al ranking de confianza: si el vecino te dice "anda al barrio de Flores" y la app te dice "anda a Av. Rivadavia 5000, tercer piso", no ganó el que da la dirección exacta porque sea más confiable: ganó porque **su dato es más preciso**. La confianza desempata entre datos igual de precisos. Y esto es el error más caro del enrutamiento: mucha gente "arregla" subiendo la AD cuando el problema era de especificidad, y después de dos horas la ruta sigue perdiendo, porque la AD nunca fue la que decidía.

### Resumen

- El orden es fijo: primero la ruta más específica (**LPM**), después la fuente más confiable (**AD**) y después el mejor camino (**métrica**).
- La AD no es el primer paso: solo se usa cuando varias rutas empatan en especificidad.
- La receta de seis pasos con el destino en la mano: matchear, contar prefijos, comparar AD, comparar métrica, y si todo empata, balanceo.
- Una ruta precisa le gana a una ruta confiable pero vaga: es el error más común y el más caro.
- Si nada matchea y no hay ruta por defecto, el paquete se descarta.

---

## 3. Longest Prefix Match: la regla del más específico

### 3.1. Qué es

Cuando el router busca una ruta para el destino `X.Y.Z.W`, compara el destino contra TODAS sus rutas y se queda con la que tenga **el prefijo (máscara) más largo** que matchee. A más bits de red en la ruta, más específica es.

Para entenderlo hay que tener clara la pareja dirección/máscara. Una dirección **IP** (*Internet Protocol*, Protocolo de Internet) es el número de 32 bits que identifica una interfaz, escrito como cuatro números de 0 a 255 separados por puntos (por ejemplo `192.168.1.77`). La **máscara** es otro número de 32 bits que dice qué parte de la dirección identifica la red y qué parte identifica al equipo dentro de esa red: la parte de red es lo que está "tapado" con unos, y lo demás es el equipo. El **prefijo** `/24` es la forma corta de escribir esa máscara: "los primeros 24 bits son de red". Una ruta a `192.168.1.0/24` significa "toda la red cuyos primeros 24 bits son `192.168.1`". Y una dirección "matchea" con esa ruta cuando sus primeros 24 bits son los mismos.

> **Analogía:** es la diferencia entre saber "vive en Buenos Aires" (algo ayuda) y saber "vive en Av. Siempre Viva 742, departamento 3B" (todo). Las dos sirven para aproximar, pero la dirección completa gana siempre: es más específica. El router, ante el paquete, quiere la dirección más exacta que tenga.

Y una consecuencia que sorprende: **cuanto más específica es una ruta, menos destinos abarca**. `192.168.0.0/16` cubre 65.536 direcciones; la `/24` cubre 256; la `/26` cubre 64. El router prefiere la más chica porque describe un rincón más exacto de la red.

### 3.2. Ejemplo resuelto, paso a paso

Destino del paquete: **192.168.1.77**

Rutas en la tabla de R1:

| Ruta | Máscara (bits) | ¿Matchea con 192.168.1.77? | Especificidad |
|------|----------------|:--------------------------:|:-------------:|
| `192.168.0.0/16` | 16 | Sí (192.168.*) | Baja |
| `192.168.1.0/24` | 24 | Sí (192.168.1.*) | Media |
| `192.168.1.64/26` | 26 | Sí (192.168.1.64–127) | Alta |
| `192.168.2.0/24` | 24 | **NO** (es otra red) | — |
| `0.0.0.0/0` (default) | 0 | Sí (todo) | Mínima |

Esta tabla es la tabla de rutas de R1, recortada a lo que importa. La primera columna es la **ruta** tal como la muestra el router: red y prefijo. La segunda traduce ese prefijo a la cantidad de bits de red, para que puedas comparar de un vistazo (más bits, más específica). La tercera es el resultado de la comparación contra el destino, y entre paréntesis te dice **por qué**: los asteriscos son comodines, quieren decir "acá puede ir cualquier número". La cuarta columna es una etiqueta en castellano de esa misma cuenta, para que no tengas que leer números mientras aprendés.

Mirá la tercera columna fila por fila, porque ahí está toda la cuenta:

- `192.168.0.0/16`: los primeros 16 bits son `192.168` y el destino empieza igual. **Matchea**, pero deja libres los dos últimos números: es una ruta vaga.
- `192.168.1.0/24`: fija `192.168.1`. **Matchea**, y ya fija tres de los cuatro números.
- `192.168.1.64/26`: fija `192.168.1` más dos bits del último número. Con 6 bits de equipo el bloque va de `.64` a `.127`, y el 77 cae adentro. **Matchea**.
- `192.168.2.0/24`: el destino es `192.168.1`, no `192.168.2`. Ahí se corta: **no matchea**. Es el caso que más se equivoca la gente: se parece, pero no es. La comparación es de bits, no de "parecido".
- `0.0.0.0/0`: cero bits de red, así que no compara nada. **Matchea siempre**. Es la ruta por defecto (capítulo 8).

**Respuesta:** gana `192.168.1.64/26`. ¿Por qué? Porque matchea (el 77 cae entre el 64 y el 127) y tiene el prefijo más largo de todas las que matchean (26 > 24 > 16 > 0).

> **Ojo con un error común:** el orden de la tabla NO importa. Aunque la `/16` se haya aprendido "primero", gana la `/26`. El router no toma por orden de llegada: **compara la longitud de máscara, siempre.**

### 3.3. Tres rutas que matchean el mismo paquete

Este es el caso que hay que saber resolver sin pensar, porque es el que aparece en los exámenes y en el trabajo. Tres rutas, tres prefijos distintos, todas matchean, y hay que decir cuál gana.

**Caso A — el mismo destino del ejemplo anterior, contado en binario.** Destino `192.168.1.77`. Las tres candidatas son `/16`, `/24` y `/26`. Escribamos solo el cuarto número del destino en binario, porque los tres primeros ya son iguales en las tres rutas:

```text
77  = 01001101
/26 → los primeros 2 bits del cuarto número son de red:  01 | 001101
/25 → el primer bit del cuarto número es de red:          0 | 1001101
/24 → ninguno de los bits del cuarto número es de red:      | 01001101
```

Leé las tres líneas como tres recortes del mismo número: el `77` en binario es `01001101`, y cada línea lo corta en otro lugar. La barra vertical `|` es la frontera entre red y equipo: lo de la izquierda son bits que la ruta fija, lo de la derecha son bits que pueden variar. Cuanto más a la derecha caiga la barra, más específica es la ruta.

Con la `/26` la barra cae después de dos bits del cuarto número: la ruta fija `192.168.1.` y además los bits `01`. Con 6 bits de equipo, el bloque va de `01000000` a `01111111`, o sea de 64 a 127. Por eso la ruta que contiene al 77 es `192.168.1.64/26` y no `192.168.1.0/26`. Gana la `/26` porque es la que fija más bits.

**Caso B — otro destino, para practicar la cuenta.** Destino `10.1.1.5`, con tres rutas en la tabla: `10.0.0.0/8` (matchea, abarca 16 millones de direcciones), `10.1.1.0/24` (matchea, 256 direcciones) y `10.1.1.0/26` (matchea, 64 direcciones: de `.0` a `.63`, y el 5 está adentro). Gana la `/26`. Y si el paquete fuera a `10.1.1.200`, la `/26` de `10.1.1.0` **no** matchearía (200 está fuera del bloque 0–63): quedarían dos candidatas y ganaría la `/24`. Moraleja: no alcanza con mirar el prefijo, hay que confirmar que el bloque contiene la dirección.

**Caso C — cuando el LPM no puede decidir.** Destino `172.16.0.5`, y en la tabla hay una estática a `172.16.0.0/16` y una OSPF a `172.16.0.0/16`. Las dos matchean, las dos tienen 16 bits de red: **el paso 1 empata**. Ahí el prefijo ya no decide nada y hay que bajar al paso 2, la AD. Ese caso es el capítulo 4, y el 6 lo resuelve completo.

La conclusión de los tres casos, en una línea: el LPM solo mira **cuántos bits de red** tiene cada candidata y **si esa red contiene la dirección**. Todo lo demás (quién la configuró, con qué protocolo, cuándo llegó) no entra en este paso.

### 3.4. La tabla de "coincidencias" para el análisis rápido

Para decidir rápido si una ruta matchea, usá la tabla de red/broadcast por máscara del tema de análisis de IPv4:

```text
192.168.1.77 con /26 → red 192.168.1.64 (el rango es .64–.127) → MATCHEA
192.168.1.77 con /25 → red 192.168.1.0  (rango .0–.127)       → MATCHEA
192.168.1.77 con /24 → red 192.168.1.0  (rango .0–.255)       → MATCHEA
```

Este bloque es la cuenta hecha para el mismo destino del ejemplo, con tres máscaras distintas. A la izquierda está la dirección del paquete y la máscara que estás probando; en el medio, la **red** que resulta (la dirección con los bits de equipo en cero) y entre paréntesis el **rango** de direcciones que abarca esa red; a la derecha, el veredicto. Es la misma tabla de red y broadcast del manual de análisis de IPv4, aplicada a la pregunta "¿esta ruta contiene a este paquete?".

Todas matchean; gana la de máscara más larga (`/26`). Fijate en el detalle más útil del bloque: el rango. Para saber si una ruta contiene una dirección no hace falta binario: calculás el rango y ves si la dirección cae adentro. En los ejercicios del capítulo 10 vas a practicar esto.

Atajo para el rango: si el prefijo es `/n`, el bloque mide `2^(32−n)` direcciones. La `/26` deja 6 bits de equipo (bloques de 64), la `/24` deja 8 (de 256) y la `/25` deja 7 (de 128). Con eso sabés dónde empieza y dónde termina cualquier ruta, que es justo lo que pide el paso 2 de la receta.

### Resumen

- Gana la ruta con el prefijo más largo (la más específica) entre las que contienen la dirección del paquete.
- Una ruta contiene la dirección si los bits de red coinciden todos; se comprueba comparando con el rango de la ruta.
- Si tres rutas matchean, gana la de más bits de red, sin importar la fuente ni el orden de configuración.
- Más específico no es "mejor camino": es "más preciso", y abarca menos direcciones.
- Cuando dos rutas tienen el mismo prefijo, el LPM empata y hay que bajar al paso siguiente: la AD.

---

## 4. Administrative Distance: la confianza en la fuente

### 4.1. Qué es

La **Administrative Distance (AD)** es un número del 0 al 255 que Cisco asigna a cada **fuente de rutas** para expresar cuánto confía en ella. Cuanto **menor** el número, **más confiable** la fuente. "Cero" significa "te hago caso siempre"; "255" significa "ni te miro".

Acá hay tres cosas que conviene separar:

- La AD **no mide el camino**. No dice si el enlace es rápido ni si está congestionado: solo dice de quién viene la información.
- La AD **la asigna el fabricante**. Cisco publicó la tabla que ves en los exámenes y en Packet Tracer, y es la que usamos acá.
- La AD **se compara solo entre rutas del mismo prefijo**. Es el paso 5 de la receta, y llega cuando el paso 3 ya empató.

Volvamos al ranking de confianza: **lo que pusiste vos gana a lo que averiguó la máquina, y lo que viene de adentro gana a lo que viene de afuera**. Entender esa lógica te evita memorizar doce números sueltos.

La tabla que hay que conocer (los valores pueden variar levemente según el fabricante; estos son los de Cisco, los que vas a ver en Packet Tracer, el simulador de redes, y en el examen):

| Fuente de la ruta | AD | Comentario |
|-------------------|:--:|------------|
| Interfaz conectada | **0** | Lo más confiable que existe: es mi propio cable |
| Ruta local (`L`) | 0 | Es mi propia IP |
| Ruta estática | **1** | La escribió un ser humano con criterio |
| EIGRP (resumen) | 5 | Resúmenes automáticos |
| BGP exterior (eBGP) | 20 | Viene de otro sistema autónomo |
| EIGRP (interna) | 90 | Muy confiable, usa DUAL (lo ves con EIGRP) |
| OSPF | **110** | El estándar abierto (lo ves con OSPF) |
| IS-IS | 115 | El favorito de los proveedores (lo ves con IS-IS) |
| RIP | 120 | Histórico, hop count (lo ves con enrutamiento dinámico) |
| EIGRP (externa) | 170 | Rutas redistribuidas hacia EIGRP |
| BGP interior (iBGP) | 200 | El "menos confiable" de los que se usan |
| Ruta inalcanzable | 255 | Nunca se instala en la tabla |

Antes de leerla fila por fila, las siglas que aparecen y que todavía no definimos. **IOS** es *Internetwork Operating System*, el sistema operativo con el que trabajan los routers Cisco: es el programa que interpreta los comandos que escribís y que mantiene la tabla de rutas. **EIGRP** es *Enhanced Interior Gateway Routing Protocol*, "protocolo de enrutamiento de puerta de enlace interior mejorado", un protocolo dinámico de Cisco que mide el camino con una fórmula (lo ves en el manual de EIGRP). **BGP** es *Border Gateway Protocol*, el protocolo con el que se hablan los proveedores de Internet entre sí; **eBGP** es su versión "exterior" (entre sistemas autónomos distintos) e **iBGP** la "interior". Un **sistema autónomo** es un conjunto de redes bajo una sola administración, como el de un proveedor. **IS-IS** es *Intermediate System to Intermediate System*, otro protocolo dinámico, muy usado dentro de los proveedores de Internet. **RIP** es *Routing Information Protocol*, el protocolo dinámico más viejo que sigue en uso, que mide el camino contando routers. **DUAL** es *Diffusing Update Algorithm*, el algoritmo con el que EIGRP calcula y garantiza sus caminos sin bucles.

Ahora sí, qué significa cada columna y cada fila:

- La primera columna es la **fuente**: quién le contó esa ruta al router. Las dos primeras filas ni siquiera son "alguien contando": son el router sabiendo de su propio cable y de su propia dirección.
- La segunda columna es la **AD**, el número que se compara. Menor gana. Está centrada y en negrita en los casos que más vas a usar.
- La tercera columna es un comentario en castellano, y varias filas traen entre paréntesis en qué manual de esta serie se ve ese protocolo. No hace falta que lo conozcas hoy: acá solo importa su número.

Y así se lee el ranking completo, agrupado por la lógica que mencionamos antes:

- **0 para lo propio.** La **interfaz conectada** es una red que está enchufada directamente a una pata del router: nadie te la contó, la estás viendo. La **ruta local** (`L`, la letra que muestra el router) es la dirección IP del propio router. Con AD 0, estas rutas ganan siempre que compitan con algo del mismo prefijo: son la verdad de tus ojos.
- **1 para lo que escribió un humano.** La **ruta estática**, la que pusiste vos con criterio. Confianza altísima, pero no infinita: si el cable de tu propia interfaz dice algo, gana el cable.
- **5 para un resumen de EIGRP.** Un **resumen** es una ruta que representa muchas redes juntas; al ser un dato más "amplio", queda por encima de EIGRP normal.
- **20 para lo externo que viene de un proveedor.** eBGP trae rutas de afuera de tu organización: valiosas, pero no tanto como las de tu propia red.
- **90 para EIGRP interno.** EIGRP es de Cisco, propietario, y la tabla lo premia con mejor AD que los protocolos abiertos. Es una decisión comercial: en una red Cisco, EIGRP gana a OSPF si los dos anuncian el mismo prefijo.
- **110 para OSPF.** El estándar abierto más usado. Perder contra EIGRP es consecuencia de la fila anterior, y es la causa de un montón de "por qué gana el otro protocolo" en redes mixtas.
- **115 para IS-IS.** Un poco menos confiable que OSPF según Cisco, aunque en la práctica de los proveedores es igual de serio.
- **120 para RIP.** El protocolo histórico: se lo respeta, pero va último entre los dinámicos "normales" porque su forma de medir (contar saltos) es muy pobre.
- **170 para EIGRP externo.** Rutas que entraron a EIGRP desde otro protocolo (eso se llama **redistribución**, y lo ves en su manual). Como el dato pasó por una traducción, baja la confianza.
- **200 para iBGP.** Rutas de BGP dentro de tu propio sistema autónomo. Es el más bajo de los que se usan de verdad, y con razón: BGP está pensado para hablar entre organizaciones, no para mover tráfico interno.
- **255 para lo inalcanzable.** Es el "no me importa": una ruta con AD 255 nunca se instala en la tabla. Se usa justamente para eso, para anular una ruta sin borrarla.

> **Cómo leer la tabla:** la AD decide ENTRE fuentes. "Entre una estática (1) y un OSPF (110) para el mismo destino con la misma máscara, gana la estática." Cuando un administrador quiere que el OSPF gane, le sube la AD manualmente a la estática (eso es exactamente la floating static route del tema de rutas estáticas, pero para protocolos: "que la estática pierda contra el dinámico").

Una **floating static route** (ruta estática flotante) es una estática a la que se le puso una AD artificialmente alta para que quede dormida, y que solo se activa si la ruta principal desaparece. Flota, por así decirlo: sube cuando el piso de abajo se hunde. En el capítulo 7 la comparamos con el balanceo, porque son dos cosas distintas que la gente confunde todo el tiempo.

### 4.2. La AD se cambia, pero con criterio

Puede modificarse con `ip route ... <ad>` o con `distance` dentro de un protocolo. Ejemplo: querés que tu estática sea el "último recurso" contra OSPF (AD 110), así que le ponés AD 150:

```cisco
! Esta estática PIERDE contra OSPF (110 < 150) pero gana contra RIP (120... no, 120 < 150 también pierde)
! En la práctica: se usa para respaldos muy flojos
ip route 172.16.0.0 255.255.0.0 10.0.0.2 150
```

Este bloque tiene tres líneas y solo una es un comando: las dos que empiezan con `!` son **comentarios**, o sea texto que el router ignora y que sirve para que un humano entienda la configuración. El comando es la última línea, y se lee así: `ip route` (quiero una ruta estática), `172.16.0.0` (la red de destino), `255.255.0.0` (su máscara, que equivale a `/16`), `10.0.0.2` (el **next-hop**, o sea la IP del vecino al que le entrego el paquete) y `150` (la AD que le quiero poner a mano, en lugar de la AD 1 que tendría por defecto).

Ojo con el comentario de la primera línea, porque está mal y hay que decirlo: con AD 150 la estática **pierde contra RIP también**, porque 120 es menor que 150. El comentario del original intenta corregirse a sí mismo en el paréntesis y no termina de aclararlo, así que lo dejamos claro acá: para que la estática pierda contra OSPF (110) pero gane contra RIP (120), la AD tiene que estar **entre 111 y 119**. Con 150 pierde contra las dos. No es un detalle menor: si copiás ese número sin pensarlo, la ruta de respaldo no va a hacer lo que esperás.

Qué tiene que ver un principiante en pantalla después de escribir eso: con `show ip route` la red `172.16.0.0/16` sigue apareciendo, pero en la columna de la izquierda vas a ver una `S` (de static) y, en el detalle de la ruta, `distance 150`. Ese 150 es tu firma: es la prueba de que tu ruta quedó con la confianza que le pusiste.

> **Regla práctica:** no toques ADs a menos que tengas UN motivo claro y escrito. Cada AD es un diseño: la tabla de arriba está pensada para que "lo manual gane a lo automático, y lo externo pierda contra lo interno". Cambiarla sin motivo es como cambiar la jerarquía de una empresa por capricho: algún día, algo explota sin que sepas por qué.

### 4.3. Lo que la AD no puede hacer

Para cerrar el capítulo, el límite que hay que tener grabado. La AD **no compite contra la especificidad**. Si tu ruta tiene un prefijo más corto que otra, la AD nunca entra en juego: ganó la otra en el paso 3 y tu número, aunque sea 1, no se mira.

Imaginate la escena: tenés una estática con AD 1 a `10.0.0.0/8` y un OSPF con AD 110 a `10.5.5.0/24`. Llega un paquete a `10.5.5.9`. Las dos matchean. Gana la `/24` de OSPF. Podés mover las ADs todo lo que quieras y no cambia nada: el empate que la AD necesita para opinar nunca ocurrió. La solución real es escribir la estática con el prefijo adecuado, y eso lo resolvemos en el capítulo 10.

### Resumen

- La AD es un número de 0 a 255 que mide cuánto confía el router en la **fuente** de una ruta; menor es más confiable.
- El ranking tiene una lógica: lo propio (0) gana a lo manual (1), lo manual gana a lo automático (90, 110, 120), y lo externo (170, 200) queda abajo.
- Sirve para comparar rutas del **mismo prefijo**: no mide velocidad ni calidad del camino.
- Se puede cambiar a mano (`ip route ... <ad>`, `distance`), pero cada cambio es una decisión de diseño que hay que poder justificar.
- La AD nunca le gana a una ruta más específica: primero se compara el prefijo, siempre.

---

## 5. Métrica: la comparación dentro del mismo protocolo

### 5.1. Qué es y por qué no hay una sola

Cuando la fuente es la misma (dos rutas OSPF, dos EIGRP, dos estáticas...), la AD no alcanza para decidir. Ahí entra la **métrica**: un valor que cada protocolo calcula a su manera para comparar rutas DENTRO de sí mismo. Menor = mejor.

La clave para no confundirse: **cada protocolo define su propia métrica**:

| Protocolo | Métrica | Qué mide |
|-----------|---------|----------|
| **RIP** | Hop count | Cantidad de saltos (routers) hasta el destino. Máximo 15 |
| **OSPF** | Cost | 100 Mbps ÷ ancho de banda de la interfaz (o configuración manual) |
| **EIGRP** | Compuesta | Combinación de ancho de banda + delay (+ carga y confiabilidad con K-values) |
| **BGP** | Atributos | Una lista de atributos comparados en orden (lo ves con BGP) |
| **Estática** | 0 | No hay comparación: la puso un humano, es única (salvo empate → balanceo) |

Esta tabla tiene tres columnas y conviene leerla dos veces, porque es la que explica por qué no existe "la métrica" en general. La primera columna es el **protocolo** (la fuente de la ruta). La segunda es **cómo se llama** su métrica, y ahí ya se ve el problema: no comparten ni el nombre. La tercera dice **qué mide** ese número, o sea qué está contando el protocolo para decidir que un camino es mejor que otro.

Fila por fila:

- **RIP** usa **hop count**, "cuenta de saltos": cuántos routers hay entre el origen y el destino. Tres routers, métrica 3. Es fácil de entender y malísimo como medida: no distingue un enlace de 10 Mbps de uno de 10 Gbps, porque los dos son "un salto". El máximo de 15 es histórico: 16 se considera "infinito", o sea inalcanzable.
- **OSPF** usa **cost**, "costo": por defecto se calcula como `100 Mbps ÷ ancho de banda de la interfaz`, así que un enlace más rápido tiene menos costo, y los costos de todos los enlaces del camino se suman. Un enlace de 100 Mbps aporta 1; uno de 10 Mbps aporta 10. También se puede fijar a mano.
- **EIGRP** usa una métrica **compuesta**: una fórmula que combina **ancho de banda** (el del enlace más lento del camino) y **delay** (la suma de los retardos), y que puede sumar carga y confiabilidad si se activan los **K-values** (los coeficientes de la fórmula). Es la más elaborada de las tres.
- **BGP** no usa un número único: usa una **lista de atributos** que se compara en orden, como un desempate escalonado (local preference, longitud del camino de sistemas autónomos, origen, y varios más). Si querés el detalle, está en el manual de BGP.
- **Estática** tiene **métrica 0**, pero eso no es un cálculo: significa "no hay nada que comparar". La escribió un humano y no hay dos estáticas "mejores" entre sí; si hay dos idénticas, se empatan y se balancean.

> **Analogía:** la métrica es el **sistema de puntaje de cada deporte**. No comparás a un jugador de fútbol con uno de ajedrez por "goles": cada juego tiene su propia regla para decidir quién gana. RIP cuenta saltos, OSPF suma costos, EIGRP calcula una fórmula. Lo que tienen en común: el número más chico gana.

### 5.2. Un ejemplo: dos rutas OSPF, distinto costo

R1 llega a `192.168.10.0/24` por dos caminos OSPF:

```text
Camino A: por R2, enlaces de 100 Mbps  → costo 1 + 1 = 2
Camino B: por R3, enlaces de 10 Mbps   → costo 10 + 10 = 20
```

Este bloque muestra dos caminos posibles desde el mismo router, y la cuenta de costo de cada uno, hecha con la fórmula de OSPF que acabamos de ver. A la izquierda, el nombre del camino y por qué router pasa; en el medio, la velocidad de los enlaces; a la derecha, la suma. "100 Mbps" se lee "cien megabits por segundo" y es la capacidad del enlace: cuántos datos entran por segundo. El `+` está porque el costo se acumula salto por salto: el camino A tiene dos enlaces de 100 Mbps y cada uno aporta 1, así que el total es 2.

Ambas son OSPF (misma AD 110), mismo prefijo (`/24`). Gana la de **menor métrica**: el camino A (costo 2). El router instala esa ruta y la otra queda como candidata (se usa si la primera muere).

Y acá aparece una idea que vale para todo el manual: **la ruta que pierde no se borra**. Queda como candidata en la base del protocolo, esperando. Si el camino A se corta, el router recalcula, la candidata pasa a ser la mejor disponible y el tráfico se va por el B sin que hagas nada. Por eso en la tabla solo ves las ganadoras: las demás existen, en otro estante.

### 5.3. La jerarquía completa en una sola imagen

```text
    Destino 10.1.1.5

    ¿Qué ruta matchea con el prefijo más largo?
    ┌───────────────────┴───────────────────┐
    │ Si una sola: esa gana ✓               │
    │ Si varias con el MISMO prefijo largo:  │
    └───────────────────┬───────────────────┘
                        ▼
    ¿De qué fuente (AD)? → gana menor AD     ──► ¿una sola? gana ✓
                        │
                        ▼
    ¿Misma fuente? → gana menor MÉTRICA      ──► ¿una sola? gana ✓
                        │
                        ▼
    ¿Empate total (mismo prefijo, misma AD, misma métrica)?
    → BALANCEO DE CARGA (ECMP) ── la sección 7
```

Este es el mismo procedimiento del capítulo 2, pero con un destino concreto (`10.1.1.5`) en lugar de la teoría. Se lee de arriba hacia abajo, y cada caja es una pregunta con su respuesta posible:

- La primera caja es el paso 1: se buscan las rutas que matchean y se queda con la más específica. Si sale **una sola** ganadora, el tilde marca el final: esa gana y no se sigue.
- La flecha que baja significa "solo si hubo empate". Si varias rutas tienen el mismo prefijo más largo, se pasa a la pregunta de la **fuente**, que es la AD. Otra vez: si queda una sola, listo.
- Si las que empataron son de la **misma fuente** (o sea, mismo protocolo), se compara la **métrica**. Y si también empatan ahí, se llega a la última línea.
- La última línea no tiene ganadora: hay **balanceo de carga** (ECMP), el capítulo 7. El dibujo dice "la sección 7" porque se escribió antes de numerar los capítulos: es el mismo.

Fijate que el dibujo, leído de arriba hacia abajo, es exactamente la receta de seis pasos del capítulo 2, pero en versión de diagrama. Si te olvidás de la receta, este dibujo la reconstruye.

### 5.4. Por qué la métrica nunca cruza de protocolo

Este es el punto donde más gente se equivoca. Dos rutas a `192.168.10.0/24`: una por **RIP** con métrica **1** (un solo salto) y otra por **OSPF** con métrica **20**. ¿Gana RIP porque 1 es menor que 20? **No.** RIP tiene AD 120 y OSPF tiene AD 110, así que gana OSPF. La métrica de RIP (1) nunca se compara con la de OSPF (20): son unidades distintas, como "1 cuadra" y "20 minutos". Si las dos rutas fueran OSPF, ahí sí gana el costo menor; y si las dos fueran RIP, gana la de menos saltos. La métrica es un idioma local: sirve para comparar rutas que hablan ese idioma, y nada más.

### Resumen

- La métrica compara rutas **dentro de la misma fuente**, y en todos los protocolos gana el número más chico.
- Cada protocolo mide a su manera: RIP cuenta saltos, OSPF suma costos, EIGRP calcula una fórmula, BGP compara atributos en orden.
- Dos rutas de fuentes distintas se deciden por AD, jamás por métrica: los números no son comparables entre protocolos.
- La ruta que pierde no se borra: queda como candidata y puede activarse si la ganadora desaparece.
- El diagrama de la jerarquía es la receta de seis pasos dibujada de arriba hacia abajo.

---

## 6. El orden completo aplicado a casos reales

Los cuatro casos de este capítulo son el manual entero en cuatro escenas. En cada uno hay dos rutas, un paquete y una respuesta. Leelos en orden: cada caso agrega una comparación y deja las anteriores en su lugar.

### 6.1. Caso 1: la especificidad gana a la confianza

**Topología:** R1 quiere llegar a `10.1.1.5`.

- Ruta A: **estática** (AD 1) a `10.0.0.0/8` vía R2.
- Ruta B: **OSPF** (AD 110) a `10.1.1.0/24` vía R3.

**Pregunta trampa:** "la estática tiene AD 1 y OSPF 110, así que gana la estática". **FALSO.**

**Respuesta correcta:** el LPM se aplica primero. `10.1.1.0/24` es más específica que `10.0.0.0/8`, y ambas matchean con `10.1.1.5`. Gana **OSPF** (la /24), sin importar que su AD sea peor.

El paquete a `10.1.1.5` cae dentro de las dos rutas: la `/8` abarca todo lo que empieza con `10.`, y la `/24` solo lo que empieza con `10.1.1.`. Las dos son candidatas, y el paso 3 pregunta por el prefijo: 24 le gana a 8. Solo si hubiera dos rutas `/24` habría que mirar la AD.

> **La lección que resume la tabla entera:** la AD compara rutas del MISMO prefijo. Cuando los prefijos difieren, la especificidad ya decidió antes de que la AD pueda opinar.

### 6.2. Caso 2: misma especificidad, distinta fuente

**Topología:** R1 quiere llegar a `172.16.0.5`.

- Ruta A: **estática** (AD 1) a `172.16.0.0/16` vía R2.
- Ruta B: **OSPF** (AD 110) a `172.16.0.0/16` vía R3.

Mismo prefijo `/16` → el LPM no decide → paso 2: **AD. Gana la estática (1 < 110) vía R2.** La OSPF queda durmiendo como candidata de respaldo.

Esta es la escena del ranking de confianza funcionando: las dos rutas dicen exactamente lo mismo sobre el mismo pedazo de red (porque tienen el mismo prefijo), y para desempatar el router consulta de quién viene cada una. La que puso un humano gana a la que averiguó sola.

### 6.3. Caso 3: misma fuente, distinta métrica

**Topología:** R1 quiere llegar a `192.168.5.0/24`. OSPF ofrece dos caminos:

- Camino A: costo 10.
- Camino B: costo 20.

Mismo prefijo, misma AD (110 para ambas, son OSPF) → paso 3: **métrica. Gana el camino A (costo 10).**

Acá ya no hay nada que decir sobre confianza: las dos rutas vienen del mismo protocolo, así que son igual de confiables. La única diferencia es la calidad del camino medida por ese protocolo, y en OSPF menos costo es mejor camino.

### 6.4. Caso 4: el empate que hace balancear

**Topología:** dos rutas ESTÁTICAS idénticas (mismo destino, mismo prefijo, ambas AD 1, ambas métrica 0):

```cisco
ip route 192.168.9.0 255.255.255.0 10.0.1.2
ip route 192.168.9.0 255.255.255.0 10.0.2.2
```

Dos comandos idénticos salvo el next-hop: `10.0.1.2` en la primera línea y `10.0.2.2` en la segunda. Las dos van a la misma red `192.168.9.0/24` (la máscara `255.255.255.0` es la `/24`) y ninguna lleva un número extra al final, así que las dos tienen la AD por defecto de una estática: 1.

Prefijo igual, AD igual, métrica igual... **no hay "una ganadora"**: el router instala AMBAS y reparte los paquetes entre las dos (balanceo, sección 7).

### 6.5. Las tres rutas que matchean, resueltas de punta a punta

Ahora el ejercicio completo, el que mezcla todo. En la tabla de R1 hay **tres** rutas y llega un paquete a `10.10.20.9`:

- Ruta A: estática a `10.0.0.0/8` (AD 1), vía R2.
- Ruta B: OSPF a `10.10.0.0/16` (AD 110), vía R3.
- Ruta C: estática a `10.10.20.0/24` (AD 1), vía R4.

Se resuelve con la receta, sin atajos:

1. Destino: `10.10.20.9`.
2. ¿Cuáles matchean? Las tres. La `/8` porque empieza con `10.`; la `/16` porque empieza con `10.10.`; la `/24` porque empieza con `10.10.20.`.
3. Prefijos: 8, 16 y 24. La más larga es 24.
4. Quedó una sola con prefijo 24: gana la **ruta C**, por R4. Y acá se corta: la AD de las otras dos nunca se miró, aunque la ruta A también fuera estática y confiable.
5. (No se llega.) La AD no participa.

Y ahora el mismo paquete, con una tabla distinta: supongamos que además de la ruta C hay una **cuarta** ruta, también a `10.10.20.0/24`, pero aprendida por OSPF con costo 30. Entonces:

1. Destino: `10.10.20.9`.
2. Matchean las cuatro.
3. Prefijo más largo: 24. Quedan dos candidatas, la C (estática) y la nueva (OSPF).
4. Hay empate, así que se mira la AD: estática 1 contra OSPF 110. Gana la **C**.
5. (No se llega.) La métrica de la OSPF (30) no se compara con la de la estática (0): son de fuentes distintas.

Y una tercera variante: si las dos rutas a `10.10.20.0/24` fueran **las dos OSPF**, una con costo 30 y otra con 12, el prefijo empata, la AD empata (110 y 110) y decide la métrica: gana la de costo 12. Tres escenas, tres pasos distintos, una sola receta.

### Resumen

- Con prefijos distintos gana la más específica, aunque su fuente sea menos confiable.
- Con el mismo prefijo y fuentes distintas gana la de menor AD.
- Con el mismo prefijo y la misma fuente gana la de menor métrica.
- Si todo empata, el router instala todas y balancea.
- La receta de seis pasos resuelve los tres casos sin memorizar excepciones.

---

## 7. Balanceo de carga: cuando hay empate

### 7.1. Qué es

Cuando dos o más rutas son **idénticas** (mismo destino, mismo prefijo, misma AD, misma métrica), el router no elige una: **las usa todas**. A eso se llama **balanceo de carga por rutas de costo igual** (ECMP, *Equal-Cost Multi-Path*).

```text
R1 ────── R2 ──────┐
   \               ├── 192.168.9.0/24
    ────── R3 ──────┘
```

Es el mismo tipo de dibujo del capítulo 1: R1 en el medio, dos caminos, R2 y R3, y los dos llegando a la misma red. La diferencia es que acá los caminos son **iguales en todo lo que el router mide**, así que no hay motivo para preferir uno. La barra vertical de la derecha es solo el punto donde se juntan.

Con dos rutas idénticas por R2 y R3, los paquetes de R1 hacia esa red se reparten entre ambos caminos. Ventaja: se aprovechan los dos enlaces. La desventaja: el balanceo **no suma capacidades** de forma mágica. Con dos enlaces de 10 Mbps no tenés una conexión de 20 Mbps para una misma conversación: tenés dos conversaciones de 10.

### 7.2. Cómo verlo

```cisco
R1# show ip route 192.168.9.0
Routing entry for 192.168.9.0/24
  Known via "static", distance 1, metric 0
  Redistributing via static
  Last update from 10.0.2.2 on GigabitEthernet0/1
  Routing Descriptor Blocks:
  * 10.0.1.2, via GigabitEthernet0/0
       Route metric is 0, traffic share count is 1
  * 10.0.2.2, via GigabitEthernet0/1
       Route metric is 0, traffic share count is 1
```

Este es el comando `show ip route` con una red como argumento: "mostrame todo lo que sabés de esta red". La primera línea repite el destino. Las líneas siguientes son el detalle de esa ruta, con la misma información que el capítulo 9 explica campo por campo; acá nos importan los últimos cuatro renglones, que son los dos **Routing Descriptor Blocks** (bloques descriptores de ruta): cada bloque es un camino instalado, con su next-hop, su interfaz de salida y su métrica.

Los dos `*` y los dos "Routing Descriptor Blocks" = las dos rutas están instaladas y activas. Reparten tráfico.

`GigabitEthernet0/0` es el nombre de la interfaz: "Gigabit Ethernet", la pata de 1000 Mbps, en el módulo 0 y el puerto 0. Ver dos interfaces distintas es la prueba visual de que hay dos caminos. Y "traffic share count is 1" en los dos quiere decir que a cada camino le toca la misma porción del tráfico: mitades iguales. Si uno dijera "count 2", se llevaría el doble.

> **Dato para netamente curiosos:** el reparto en IOS clásico es por destinos (hash), no "paquete sí, paquete no" sobre la misma conversación: el flujo entre dos hosts siempre toma el mismo camino (así los paquetes de una misma comunicación no llegan desordenados). Por eso "balancear" significa repartir FLUJOS, no partir conversaciones.

### 7.3. La diferencia con la floating static route

No confundir los dos usos de "más de una ruta":

| Situación | Qué se configura | Resultado |
|-----------|------------------|-----------|
| Mismas AD y métrica | Dos rutas idénticas | **Balanceo**: las dos activas a la vez |
| AD distinta | Ruta principal + floating (AD 200) | **Respaldo**: una activa, otra dormida |

Esta tabla compara los dos escenarios que la gente confunde, y lo hace con tres columnas: **cuál es la diferencia** entre las dos rutas, **qué se configuró** para lograrlo y **qué resultado** se obtiene. Leela de arriba abajo con la idea del ranking de confianza en la cabeza.

En la primera fila las dos rutas son iguales en confianza y en camino, así que el router no tiene motivo para descartar ninguna: las dos quedan instaladas y el tráfico se reparte. En la segunda fila hay una diferencia deliberada de confianza: la ruta de respaldo tiene AD 200, o sea que está muy abajo en el ranking, y por eso queda dormida. No se usa mientras la principal esté viva, pero se activa sola si la principal desaparece.

Una duda: "¿y cómo sé cuál de las dos está activa?" → `show ip route <red>` del caso 2 te dice exactamente eso: si está con `*` y "traffic share count", está activa; si queda como candidata, aparece en el "Routing Descriptor Blocks" sin asterisco (o directamente en `show ip route` solo si gana).

### Resumen

- Cuando dos rutas empatan en prefijo, AD y métrica, el router las instala todas: eso es ECMP.
- El balanceo reparte flujos completos, no paquetes sueltos de una misma conversación.
- Se comprueba con `show ip route <red>`: dos Routing Descriptor Blocks con `*` son dos caminos activos.
- Una floating static (AD distinta) no balancea: es un respaldo dormido que despierta solo si la principal cae.
- Balancear no duplica el ancho de banda de una conversación: reparte conversaciones entre caminos.

---

## 8. La ruta por defecto en el proceso de selección

### 8.1. La última de todas

La default route (`0.0.0.0/0`) tiene prefijo **0**: es la menos específica posible. En el proceso de decisión:

1. Se comparan todos los prefijos: cualquier ruta real (con máscara ≥ 1) matchea antes que la /0.
2. **Solo si NADA matchea**, cae en la default.

Ojo con la frase "matchea antes": la default no se guarda para el final por educación. Con cero bits de red ocupa el último lugar en la comparación de especificidad, así que **cualquier** otra ruta que matchee tiene un prefijo más largo y la derrota. Gana únicamente cuando las demás no existen o no matchean.

Por eso se llama "gateway of last resort" (viste el término en el tema de rutas estáticas): es literalmente el último recurso.

### 8.2. El ejemplo que lo hace ver

Destino: `200.1.1.99`. Tabla de R1:

| Ruta | ¿Matchea? |
|------|:---------:|
| `10.0.0.0/8` | No |
| `192.168.1.0/24` | No |
| `0.0.0.0/0` | **Sí** (todo matchea con /0) |

Esta tabla tiene solo dos columnas: la **ruta** y si **matchea o no** con el destino `200.1.1.99`. Es el paso 2 de la receta, hecho y anotado.

La `/8` no matchea porque `200.x` no empieza con `10.`. La `/24` tampoco, porque no empieza con `192.168.1.`. La default sí, porque no compara nada. Y así, la que en cualquier otra tabla sería la peor ruta, acá gana por descarte: es la única que quedó en pie.

La `/0` matchea SIEMPRE (es el universo), así que en este caso gana por ser la única que matchea. Nota conceptual importante: la default no "gana a las demás" — **gana cuando las demás no existen o no matchean**. Su "triunfo" es por descarte.

### 8.3. Y si hay DOS rutas por defecto...

Misma regla: mismo prefijo (/0 y /0) → AD decide → si misma AD, métrica → si todo igual, **balanceo entre las dos defaults**. En routers de borde con dos ISP, es común ver dos defaults con métricas distintas para que una sea la principal y la otra el respaldo (misma idea de floating static, pero con defaults).

Un router de borde es el que está en el límite de tu red, conectado al proveedor. **ISP** son las siglas de *Internet Service Provider*, la empresa que te vende la conexión; tener dos es lo normal en una oficina que no puede quedarse sin internet.

```cisco
! Default principal (salida preferida)
ip route 0.0.0.0 0.0.0.0 10.0.0.1

! Default de respaldo hacia el otro ISP
ip route 0.0.0.0 0.0.0.0 10.0.1.1 150
```

Dos líneas, dos defaults, y la diferencia está en el final. La primera no lleva número extra: es una estática normal, con AD 1, y por eso es la **principal**. La segunda lleva `150` al final, así que tiene AD 150 y queda en el puesto 150 del ranking: existe, está configurada, pero no se usa mientras la de AD 1 esté viva. Las dos usan la dirección comodín `0.0.0.0` y la máscara `0.0.0.0`, que es la forma de escribir "cualquier destino" en una ruta estática.

Qué tiene que ver un principiante: en `show ip route` aparece **una sola** default, la de AD 1, marcada con la letra `S` y con la palabra `*` adelante (el asterisco delante de la ruta significa "candidata a default"). La otra no se ve, pero está: si el proveedor principal se cae, la de AD 150 sube sola.

### Resumen

- La ruta por defecto es `0.0.0.0/0`, con cero bits de red: la menos específica de todas.
- Pierde contra cualquier ruta que matchee; gana solo cuando nada más matchea.
- Es el último recurso del router, y por eso se llama gateway of last resort.
- Se pueden tener dos defaults: la de menor AD es la principal y la otra queda de respaldo.
- Dos defaults con la misma AD y métrica se balancean, igual que cualquier par de rutas idénticas.

---

## 9. Verificación: cómo ver la decisión en el router

### 9.1. Los tres comandos estrellas

| Comando | Qué responde |
|---------|--------------|
| `show ip route` | La tabla completa con todas las rutas instaladas (las que GANARON) |
| `show ip route <red>` | El detalle de UNA ruta: de dónde viene, qué AD/métrica, si hay varias (balanceo) |
| `show ip route ?` o `show ip route ospf` / `show ip route static` | Filtrar por fuente |

Esta tabla es la caja de herramientas: dos columnas, el **comando** y **qué pregunta responde**. El signo `?` en la tercera fila es el comando de ayuda del router: si lo escribís después de `show ip route` y un espacio, el equipo te lista las opciones disponibles. Y las variantes `ospf` y `static` filtran la salida por fuente, para no leer cuarenta líneas cuando te interesan tres.

La diferencia entre las dos primeras filas es la clave: sin argumentos ves la tabla resumida, con **solo las ganadoras**; con una red ves el detalle, incluidos los varios caminos. Para diagnosticar, empezá por la segunda.

### 9.2. El detalle de una ruta: leer la decisión

```cisco
R1# show ip route 10.1.1.0
Routing entry for 10.1.1.0/24
  Known via "ospf 1", distance 110, metric 2
  Tag 0, type intra area
  Last update from 10.0.12.2 on GigabitEthernet0/0, 00:03:22 ago
  Routing Descriptor Blocks:
  * 10.0.12.2, via GigabitEthernet0/0
      Route metric is 2, traffic share count is 1
```

Esta es la salida real del comando, y es la que tenés que saber leer sin ayuda. El símbolo `R1#` al principio es el **prompt**: te dice que estás en el router R1 y que el equipo está esperando un comando. Todo lo que sigue es la respuesta del equipo, no algo que haya que escribir.

Leer la "etiqueta" de la ruta:

```text
Known via "ospf 1"  → la fuente es OSPF (proceso 1)
distance 110        → la AD que le correspondió
metric 2            → la métrica dentro de OSPF
type intra area     → es una ruta del MISMO área (lo ves en OSPF)
* 10.0.12.2         → el next-hop instalado (el * = la elegida)
```

Este bloque es la guía de lectura de la salida anterior: a la izquierda, el texto tal cual aparece en pantalla; a la derecha, su traducción.

- `Known via "ospf 1"`: la ruta la aprendió el proceso OSPF número 1. El número es un identificador, no una cantidad.
- `distance 110`: la AD. Si esto fuera una estática, diría `distance 1`.
- `metric 2`: la métrica dentro de OSPF, o sea la suma de costos del camino.
- `type intra area`: es una ruta de dentro de la misma área. Un **área** es una división interna del dominio OSPF, para que el protocolo no tenga que conocer toda la red de una sola vez; "intra" quiere decir "adentro de".
- `* 10.0.12.2`: el next-hop que el router eligió de verdad. El asterisco marca la que está instalada.

> **Dato de verificación:** la tabla de rutas muestra solo las rutas que GANARON. Las que perdieron (por AD o métrica) no aparecen ahí: quedan en la base de datos del protocolo. Sí aparecen en `show ip route <red>` como "Routing Descriptor Blocks" sin `*`, o se ven con los comandos del protocolo (ej. `show ip ospf database`, que vas a conocer con OSPF avanzado).

### Resumen

- `show ip route` muestra la tabla completa, pero solo las rutas que ganaron.
- `show ip route <red>` muestra el detalle: fuente, AD, métrica y todos los caminos disponibles.
- `show ip route ospf` y `show ip route static` filtran por fuente y ahorran lectura.
- En el detalle, el `*` marca el camino instalado y `distance` es la AD que se comparó.
- Las rutas perdedoras no desaparecen: viven en la base del protocolo hasta que las necesites.

---

## 10. Aplicación: ejercicios resueltos y laboratorio

Ahora la parte práctica. Tres ejercicios cortos y un laboratorio para hacer en Packet Tracer. Tené la receta de seis pasos a mano: en los cuatro casos se usa igual.

### 10.1. Ejercicio 1 — "¿Por qué mi estática no gana?"

**Síntoma:** configuraste una estática a `10.0.0.0/8` y el tráfico hacia `10.5.5.5` sigue yendo por OSPF.

**Diagnóstico:** OSPF anunció `10.5.5.0/24`. LPM: `/24` > `/8` → la /24 gana ANTES de que la AD importe. Tu estática es menos específica; no es un bug de AD.

**Solución correcta:** escribí la estática con el mismo prefijo o más específico que la ruta que querés ganar:

```cisco
! Antes (pierde por especificidad)
ip route 10.0.0.0 255.0.0.0 10.0.0.2

! Después (gana por especificidad, AD 1 < 110 también ayudaría si fuera empate)
ip route 10.5.5.0 255.255.255.0 10.0.0.2
```

Las dos primeras líneas son comentarios (empiezan con `!`) y marcan qué versión es cada cosa. Los dos comandos son idénticos salvo la red y la máscara: la primera estática apunta a `10.0.0.0` con `255.0.0.0` (la `/8`), y la segunda a `10.5.5.0` con `255.255.255.0` (la `/24`). El next-hop es el mismo en las dos (`10.0.0.2`): lo que cambió es la precisión de la ruta.

Qué ves en pantalla: `show ip route 10.5.5.0` muestra una sola entrada, con la `S` de estática y `distance 1`, y la OSPF ya no aparece como ganadora. Ninguna AD se tocó.

### 10.2. Ejercicio 2 — Ordenar la decisión

R1 recibe un paquete a `192.168.10.7` con esta tabla:

| # | Ruta | Fuente |
|---|------|--------|
| A | `192.168.0.0/16` | estática |
| B | `192.168.10.0/24` | OSPF |
| C | `192.168.10.0/25` | estática |
| D | `0.0.0.0/0` | estática |

Tres columnas: un identificador para nombrarlas en la respuesta, la **ruta** y de qué **fuente** viene. Tapá la solución y resolvelo con la receta.

#### Solución

Paso 1 (LPM): ¿qué matchea con 192.168.10.7?

- A (`/16`): matchea. Especificidad 16.
- B (`/24`): matchea. Especificidad 24.
- C (`/25`): 192.168.10.0/25 = .0–.127 → el 7 cae adentro → matchea. Especificidad 25.
- D (`/0`): matchea siempre. Especificidad 0.

Gana la más específica: **C (la /25 estática)**, sin importar que B sea OSPF y A sea estática. La especificidad se comparó primero.

Fijate en el detalle de la ruta C, porque es donde se pierde la gente: la `/25` deja 7 bits de equipo, así que el bloque mide 128 direcciones y va de `.0` a `.127`. El 7 está adentro, la ruta matchea. Como además quedó sola con el prefijo más largo, el paso 5 (AD) no se ejecutó nunca. Las fuentes de la tercera columna, en este ejercicio, son un dato de color.

### 10.3. Ejercicio 3 — Empate y balanceo

Tenés estas dos rutas estáticas:

```cisco
ip route 172.16.4.0 255.255.255.0 10.0.1.2
ip route 172.16.4.0 255.255.255.0 10.0.2.2
```

**¿Qué pasa?**

#### Solución

Mismo destino, mismo prefijo `/24`, misma fuente (estática, AD 1), misma métrica (0). Empate total → el router instala las DOS y balancea (ECMP): los flujos se reparten entre 10.0.1.2 y 10.0.2.2. Se ve con `show ip route 172.16.4.0`: dos "Routing Descriptor Blocks" activos.

Las dos líneas son iguales hasta el último número, que es el next-hop: `10.0.1.2` en una y `10.0.2.2` en la otra. Ninguna lleva un número de AD al final, así que las dos tienen AD 1. Y la estática no tiene métrica que comparar (es 0 para todas): no queda nada por desempatar, así que se instalan las dos.

### 10.4. Laboratorio exprés en Packet Tracer

> Si venís del tema de rutas estáticas, tenés la topología R1–R2 con estáticas. Modificála así:

**Topología:** R1 con DOS caminos hacia `192.168.2.0/24`: uno por R2 y uno por R3.

```
R1 ──── R2 ────┐
   \           ├── 192.168.2.0/24
    ──── R3 ────┘
```

Misma forma de siempre: R1 en el medio, dos caminos, y la red de destino a la derecha. **Packet Tracer** es el simulador de redes de Cisco que se usa en los cursos: armás el dibujo, configurás los equipos y ves los paquetes moverse. No hace falta hardware.

**Objetivo:** ver en vivo las tres decisiones.

1. Configurá las interfaces (una subred /30 entre R1-R2 y otra /30 entre R1-R3, como en el tema de rutas estáticas).
2. En R2 y R3 poné sus rutas conectadas a la red 192.168.2.0/24.
3. En R1:
   ```cisco
   ! Camino por R2 (estática, AD 1)
   ip route 192.168.2.0 255.255.255.0 10.0.12.2
   ! Camino por R3 (estática con AD 200 — el respaldo flotante)
   ip route 192.168.2.0 255.255.255.0 10.0.13.2 200
   ```
4. `show ip route` → ¿qué ves? Solo la de AD 1 (la de R2). La otra está dormida.
5. **Apagá la interfaz de R1 hacia R2** (`interface g0/0` → `shutdown`). Volvé a mirar `show ip route`.
   → La ruta por R2 desapareció y **la de R3 se activó sola**. Eso es la floating static funcionando.
6. Volvé a encender (`no shutdown`). La principal vuelve a ganar.

En el paso 1, una **subred /30** es un bloque de 4 direcciones con 2 utilizables: se usa para los enlaces entre routers. En el paso 3, el primer comando es la ruta principal (sin número de AD, o sea AD 1) y el segundo es el mismo destino con `200` al final, que lo convierte en respaldo. El `g0/0` del paso 5 es la abreviación de `GigabitEthernet0/0`, la interfaz del camino a R2; `shutdown` la apaga y `no shutdown` la prende.

> **HACELO VOS:** ahora reemplazá la estática por DOS estáticas SIN AD modificada (mismas, las dos AD 1). Mirá `show ip route 192.168.2.0`: ¿cuántos "Routing Descriptor Blocks" hay? Eso es el balanceo. Apagá un camino y mirá cómo el otro absorbe todo el tráfico.

### Resumen

- El síntoma "mi estática no gana" casi siempre se arregla con una ruta más específica, no tocando la AD.
- En un ejercicio con cuatro rutas candidatas, primero se tachan las que no matchean y después se compara el prefijo.
- Dos rutas idénticas no se pelean: se instalan las dos y se reparte el tráfico.
- El laboratorio muestra las tres decisiones en vivo: float, especificidad y balanceo.
- En Packet Tracer se ve todo lo que el manual explica, sin necesidad de hardware.

---

## 11. Errores comunes

| # | Error conceptual | La verdad |
|---|------------------|-----------|
| 1 | "La AD decide antes que todo" | La AD decide ENTRE rutas del MISMO prefijo. La **especificidad (LPM) va primero, siempre** |
| 2 | Comparar métricas entre protocolos | La métrica de OSPF no se compara con la de EIGRP: la AD ya eligió la familia; dentro de la familia recién se usa su métrica |
| 3 | "La default route es la más rápida por algo" | La /0 es la ÚLTIMA: matchea todo, pero con prefijo 0 pierde contra cualquier ruta real que matchee |
| 4 | Creer que la tabla muestra todas las rutas | La tabla muestra las que GANARON. Las perdedoras viven en la base del protocolo |
| 5 | Cambiar ADs "para probar" | Cada AD es un diseño; cambiarla sin motivo rompe decisiones futuras que no imaginaste |
| 6 | Confundir floating (AD distinta) con balanceo (AD igual) | AD distinta = respaldo dormido. AD + métrica iguales = ambos activos repartiendo |
| 7 | Pensar que el orden de configuración importa | El orden NO importa: la comparación es de prefijo, AD y métrica, no de "quién llegó primero" |

La tabla tiene tres columnas: el **número** del error, el **error conceptual** (lo que la gente dice o cree) y **la verdad** (lo que pasa de verdad). Están ordenados de más frecuente a menos, y los primeros cuatro son los que más tiempo hacen perder en un diagnóstico real.

Todos los errores de la lista tienen la misma raíz: usar una comparación en el lugar de otra, o saltarse un paso de la receta. Volviendo a los seis pasos en orden, ninguno de los siete te puede pasar.

### Resumen

- Casi todos los errores vienen de mezclar especificidad con confianza, o métrica con AD.
- La tabla de rutas muestra solo las ganadoras; las demás siguen en la base del protocolo.
- La default es el último recurso, no la primera opción.
- Cambiar ADs sin un diseño claro rompe decisiones futuras.
- Repasar la receta en orden evita los siete errores de la lista.

---

## 12. Comprobá lo que aprendiste

Siete preguntas. Tapá la respuesta, contestá en voz alta y recién después compará.

**1. ¿Cuál es el orden exacto de decisión del router?**

**Ver respuesta:** 1. **Longest Prefix Match**: la ruta que matchee con el prefijo (máscara) más largo. 2. **Administrative Distance**: entre rutas del mismo prefijo, la de menor AD. 3. **Métrica**: entre rutas de la misma fuente, la de menor métrica. 4. Empate total → balanceo de carga (ECMP). Especificidad → Confianza → Performance.

**2. Una estática (AD 1) a `10.0.0.0/8` y un OSPF (AD 110) a `10.5.5.0/24`: ¿qué ruta usan los paquetes a `10.5.5.5`?**

**Ver respuesta:** La **OSPF `/24`**. El longest prefix match se aplica primero: `/24` es más específica que `/8` y ambas matchean. La AD recién compara cuando los prefijos son iguales. Error clásico: "gana la estática porque AD 1" — falso, la especificidad manda primero.

**3. ¿Qué es la AD y qué expresa?**

**Ver respuesta:** La Administrative Distance es un número (0–255) que expresa qué tan confiable es la FUENTE de una ruta. Menor = más confiable. Compara rutas ENTRE fuentes (estática 1, EIGRP 90, OSPF 110, RIP 120, iBGP 200...). No compara rutas del mismo protocolo: ahí se usa la métrica.

**4. ¿Cuál es la métrica de RIP, OSPF y EIGRP?**

**Ver respuesta:** RIP: **hop count** (cantidad de saltos, máx. 15). OSPF: **cost** (100 Mbps ÷ ancho de banda de cada interfaz, sumando los saltos; o valor manual). EIGRP: una **fórmula compuesta** (ancho de banda + delay como base, con K-values que pueden sumar carga y confiabilidad). En todos: menor = mejor, y solo se comparan dentro del mismo protocolo.

**5. ¿Cuándo un router balancea (ECMP)?**

**Ver respuesta:** Cuando dos o más rutas son idénticas en todo lo que importa: mismo destino, mismo prefijo, misma AD y misma métrica. Ahí no hay "ganadora": se instalan todas y se reparten los flujos. El reparto es por flujo (hash por destino), no paquete por paquete de la misma conversación.

**6. La default route (`0.0.0.0/0`) ¿gana o pierde contra una ruta a `200.1.1.0/24` para un paquete a `200.1.1.9`?**

**Ver respuesta:** **Pierde** (y es lo correcto): la `/24` matchea con prefijo 24 y la `/0` con prefijo 0. La más específica gana. La default solo se usa cuando nada más matchea: es el "last resort", no la "primera opción".

**7. ¿Cómo se hace para que una estática le gane a una OSPF más específica?**

**Ver respuesta:** No alcanza con bajar la AD (ya es 1, la mínima que tiene sentido). Hay que escribir la estática con **el mismo prefijo o más específico** que la ruta OSPF que se quiere vencer: `ip route 10.5.5.0 255.255.255.0 ...` para ganarle a una OSPF `/24`. La especificidad se decide primero; la AD solo desempata dentro del mismo prefijo.

### Resumen

- Las siete preguntas cubren el orden completo, la AD, las métricas, el balanceo y la default.
- Si contestaste bien la 2 y la 7, ya tenés el 80 % del manual.
- La respuesta corta de todas: prefijo primero, después fuente, después métrica.
- Cuando dudes, volvé a la receta de seis pasos en lugar de memorizar casos.

---

## 13. Glosario

| Término | Qué es |
|---------|--------|
| **Longest Prefix Match (LPM)** | Regla de selección: gana la ruta que matchea con la máscara más larga (la más específica) |
| **Administrative Distance (AD)** | Número 0–255 de confiabilidad de la FUENTE de una ruta; menor = más confiable |
| **Métrica** | Valor que compara rutas DENTRO del mismo protocolo; menor = mejor |
| **Prefijo** | La parte de red de una ruta (la /n de la máscara). Más largo = más específico |
| **Gateway of last resort** | La ruta por defecto (`0.0.0.0/0`), el último recurso del router |
| **ECMP (Equal-Cost Multi-Path)** | Balanceo de carga usando rutas idénticas (mismo prefijo, AD y métrica) a la vez |
| **Ruta instalada** | Ruta que ganó la selección y quedó en la tabla de enrutamiento |
| **Ruta candidata** | Ruta que perdió la selección pero queda en la base del protocolo por si la ganadora muere |
| **Floating static route** | Estática con AD alta usada como respaldo (se activa si la principal desaparece) |
| **Traffic share count** | Campo de `show ip route` que indica cuánto tráfico reparte una ruta en un balanceo |

Dos columnas: el **término** y **qué es**, en una línea. Los cinco primeros son los de cualquier examen; los cinco últimos aparecen cuando mirás el router de verdad. Si un término no lo podés explicar en una frase, volvé al capítulo donde se usa.

### Resumen

- Los cinco términos centrales: LPM, AD, métrica, prefijo y gateway of last resort.
- Instalada y candidata son dos estados de una misma ruta, no dos tipos de ruta.
- Floating static es respaldo; ECMP es balanceo: no son lo mismo.
- Traffic share count es el campo que delata un balanceo en la salida del router.

---

## 14. Resumen en 10 puntos

1. **El router decide con un orden fijo**: especificidad (LPM) → confianza (AD) → performance (métrica) → empate (balanceo).
2. **El LPM va SIEMPRE primero**: la ruta con la máscara más larga que matchee gana, sin importar su fuente.
3. **La AD compara fuentes**: estática 1, EIGRP 90, OSPF 110, RIP 120, iBGP 200... menor = más confiable.
4. **La métrica compara dentro de la familia**: cada protocolo usa SU métrica (RIP cuenta saltos, OSPF suma costos, EIGRP calcula fórmula).
5. **Nunca se compara la métrica de un protocolo con la de otro**: la AD ya eligió la familia antes.
6. **"Mi estática no gana" casi siempre es un problema de especificidad, no de AD**: si OSPF anuncia un prefijo más largo, ese gana.
7. **La default route pierde contra cualquier ruta real que matchee**: su triunfo es por descarte ("last resort").
8. **Empate total = balanceo (ECMP)**: rutas idénticas se instalan todas y reparten flujos.
9. **Floating static (AD distinta) NO es balanceo**: es un respaldo dormido que despierta solo si la principal muere.
10. **La tabla muestra las ganadoras**: las perdedoras viven en la base del protocolo hasta que las necesiten.

Leé esta lista como el índice al revés: cada punto condensa un capítulo. Si te llevás uno solo, llevate el 1: el orden. Todo lo demás es consecuencia de respetarlo.

### Resumen

- Tres comparaciones en orden: prefijo, fuente y métrica; después, empate.
- La especificidad manda sobre la confianza, siempre.
- Cada protocolo mide a su manera y no se compara con otro.
- Los empates se balancean; las AD distintas son respaldo.
- La tabla de rutas muestra solo las ganadoras.

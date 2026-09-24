# 36. Enrutamiento Dinámico: Vector de Distancia y Estado de Enlace

**Cómo los routers aprenden solos, sin que nadie les escriba cada ruta a mano**

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

---

## 1. El problema: las rutas estáticas no escalan

### 1.1. El límite del manual anterior

Ya aprendiste a configurar rutas estáticas a mano. Son fantásticas en una red chica: predecibles, seguras, sin consumo de ancho de banda. Pero pongamos el caso real:

> Una empresa tiene **50 routers** con **200 redes**. Cada red tiene que llegar a todas las demás (o, al menos, a las que importan). Con rutas estáticas, un humano tiene que escribir **miles de líneas** de configuración, y en cada cambio de topología (un enlace nuevo, una red nueva, un router que se cae) hay que **reescribir todo a mano**.

Y hay algo peor que el trabajo: la reacción. Si un enlace se cae a las 3 de la mañana, la estática **no se entera** (recordá: no tiene ojos ni oídos). El tráfico se corta hasta que un humano se despierta, diagnostica y reconfigura.

> **Analogía:** las rutas estáticas son el **recorrido fijo de un micro** que pasa siempre por la misma calle. Si esa calle se corta por obras a las 3 AM, el micro se queda atascado hasta que alguien del taller modifica el recorrido en papel. Nadie le avisa al chofer que la calle se cortó.

### 1.2. La idea madre de este manual

> **El enrutamiento dinámico resuelve exactamente eso: los routers se AVISAN ENTRE SÍ cómo está la red.** Cada router le cuenta a sus vecinos las redes que conoce, escucha lo que los otros le cuentan, y arma su tabla de rutas sin intervención humana. Cuando algo cambia (un enlace cae, una red aparece), los routers se enteran y **recalculan solos**.

Ese "avisarse entre sí" tiene reglas: **protocolos de enrutamiento dinámico**. Y los protocolos se dividen en dos grandes familias con formas de pensar MUY distintas: **vector de distancia** y **estado de enlace**. Este manual te hace entender por qué existen las dos, cómo piensa cada una, y por qué OSPF (el tema estrella de los próximos manuales) eligió ser de una de ellas.

---

## 2. Qué es el enrutamiento dinámico

### 2.1. Los tres ingredientes de todo protocolo dinámico

Cualquier protocolo de enrutamiento dinámico, sin importar su familia, hace estas tres cosas:

| Ingrediente | Qué es | En cristiano |
|-------------|--------|--------------|
| **Descubrimiento** | Los routers se encuentran y se reconocen | "Hola, soy R1, ¿quién sos vos?" |
| **Intercambio** | Se pasan información sobre las redes | "Yo conozco la red X, la Y y la Z; ¿vos?" |
| **Cálculo** | Cada uno actualiza su propia tabla | "Con lo que me contaron, actualizo mi mapa" |

Lo que CAMBIA entre protocolos no es la receta, sino la forma de hacer el paso 2 (qué se cuentan) y el paso 3 (cómo calculan). Ahí está toda la diferencia.

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

Guardá esta tabla: la vas a usar para comparar DV y LS (y más adelante, OSPF vs EIGRP vs BGP).

---

## 3. Los dos grandes grupos: la bifurcación del camino

Todo protocolo dinámico de enrutamiento pertenece a una de dos familias:

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

> **La diferencia en una frase:** el **vector de distancia** es el que **le cuenta a su vecino qué redes conoce y a qué distancia**, sin saber cómo es el recorrido más allá del vecino. El **estado de enlace** es el que **publica "así es MI pedacito de red"** para que todos armen el mapa completo y calculen SOLO el mejor camino.

Usemos el sistema postal otra vez:

> **Vector de distancia = la cadena de rumores**: cada oficina de correo le dice a la de al lado "yo sé llegar a Mendoza, te cuento y pasame esto a vos". Nadie tiene el mapa completo; confían en lo que les contaron.
>
> **Estado de enlace = el mapa colaborativo**: cada oficina publica "yo estoy conectado a estas tres rutas, con estos costos". Con las publicaciones de todos, cada oficina dibuja el mapa COMPLETO del país y calcula la mejor ruta. Todos ven lo mismo.

Ahora veamos cada familia en detalle, empezando por la más antigua (y la que explica por qué existe la otra).

---

## 4. Distance Vector: aprender por rumores

### 4.1. Cómo piensa un router vector de distancia

Un router de esta familia NO sabe cómo es la red más allá de su vecino. Solo guarda dos datos por cada red que conoce:

```
VECTOR = (destino, DISTANCIA)
         así se llama la familia: un "vector" (destino + distancia)
         + el vecino por quien llegar
```

Su forma de aprender es primitiva y efectiva:

```text
1. R1 le dice a R2: "Yo conozco la red A a distancia 0 (es mía)."
2. R2 escucha y piensa: "Si R1 conoce la A a 0, y R1 está a 1 salto de mí,
   entonces yo la conozco a 0 + 1 = 1."
3. R2 le dice a R3: "Yo conozco la red A a distancia 1."
4. R3 piensa: "1 + 1 = 2." Y así sucesivamente.
```

Cada router recibe el rumor, le **suma 1** (el costo del propio salto) y lo guarda. El rumor **avanza como una onda** de router en router.

> **Analogía (la cadena de rumores):** "¿Dónde queda la mejor panadería?" → "No sé, pero el vecino de al lado dijo que queda a dos cuadras de su casa." Nadie caminó hasta la panadería: **todos se fían del que les contó, y le suman el tramo que ellos conocen.** El conocimiento es de segunda, tercera, cuarta mano...

### 4.2. El "solo sé lo que me cuentan": el problema de raíz

Esta forma de pensar tiene una consecuencia inevitable y profunda:

> **Un router vector de distancia NUNCA sabe la topología completa. No sabe si el "recorrido" que le contaron es directo o da diez vueltas. Solo sabe: "red X a distancia N, por el vecino Y".**

Por eso la métrica de estos protocolos es casi siempre un contador simple (saltos): es todo lo que el "rumor" puede transmitir con honestidad. No podés transmitir "ancho de banda de todo el camino" cuando nadie tiene el mapa.

### 4.3. El intercambio: periodos y vecinos

Las actualizaciones **periódicas** y los **vecinos directos** definen el ritmo:

- Cada `X` segundos (en RIP, 30), el router le manda SU tabla completa a sus vecinos directos.
- Los vecinos solo son los conectados directamente (los que comparten un enlace). No hay "vecinos de vecinos".
- El router escucha, compara, y **reemplaza lo que sabe** según lo que le cuenten (si el rumor tiene mejor métrica, lo acepta; si no, lo ignora).

> **Dato importante:** cuando un protocolo DV manda "su tabla completa", no es que el vecino "copie todo": el vecino compara con lo que ya tiene y actualiza solo lo que mejora o lo que no conocía. La confianza es ciega: **si un vecino dice "yo tengo esto", el otro le cree**... y de esa confianza ciega nacen los problemas de la sección 5.

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

**El número crece de a 1 en cada ida y vuelta: la red "cuenta hasta el infinito".** Cada ronda, la distancia sube. Los paquetes a la red A quedan **rebotando entre R1 y R2 en un bucle**, y los routers no se dan cuenta de que la red murió.

Para cortarlo se usa un límite: en RIP, **16 = infinito**: cuando la distancia llega a 16, la ruta se declara inalcanzable y se borra. Pero llegar a 16 **tarda** (16 rondas × 30 segundos = ¡8 minutos de bucle!). Esa es la "convergencia lenta" del DV.

> **Analogía:** el vecino "amable" que devuelve un objeto que perdiste... sin saber que el objeto lo habías dejado en su casa. "¿Buscás la pelota? Yo la vi, está en tu casa." → "Ah, si está en mi casa, gracias... espera, ¡yo la tenía!" El objeto (los datos) da vueltas entre las dos casas mientras discuten quién la tiene.

### 5.2. Fantasma 2 — Split Horizon (horizonte dividido)

**El remedio número 1:** regla simple que evita el caso más común del count to infinity.

> **Regla del split horizon: "Nunca le cuentes a un vecino lo que aprendiste DE ESE vecino."**

```text
R2 aprendió la red A de R1 → R2 NO le cuenta la red A de vuelta a R1.
```

Así, cuando el enlace de R1 a A se cae, R2 ya no le devuelve el rumor: R1 queda sin la ruta (correcto) y no arranca el conteo. El bucle R1↔R2 se evita.

> **Analogía:** "no le devuelvas la pelota a quien te la prestó": si la pelota se la dieron a vos en custodia, no la "recomiendes" de vuelta a la misma persona como si fuera tuya.

Andá a la configuración real en el laboratorio: RIP la aplica automáticamente.

### 5.3. Fantasma 3 — Route Poisoning y Hold-Down (envenenar y aguantar)

**Route poisoning:** cuando un router detecta que una red murió, en lugar de quedarse callado (o mentir), **"envenena" la ruta: la anuncia con distancia 16 (infinita)**. Es la forma de decir "ESTA RED ESTÁ MUERTA, no me la devuelvan". Los vecinos, al ver 16, la marcan inalcanzable.

**Hold-down (timer de espera):** el vecino receptor no "dropea" la ruta al instante: la mantiene en estado "sospechosa" durante un tiempo (timer). Mientras el timer corre, **ignora rumores de otros vecinos** que digan que la ruta volvió a la vida con métrica peor que la anterior. Así se evita que un rumor "viento en popa" reintroduzca una red que recién se cayó (por si realmente está viva pero tambaleando, y que se estabilice).

> **La idea detrás:** el routing de los 80 era un mundo de enlaces que se caían y volvían. El hold-down es "no cambiés de opinión cada 5 segundos": esperá, aguantá, y recién después aceptá el nuevo estado. Equilibra estabilidad contra velocidad.

### 5.4. El resumen de los fantasmas

| Fantasma | Problema | Remedio |
|----------|----------|---------|
| **Count to infinity** | Ruta muerta "revive" por rumores propios y el número sube hasta el infinito | Límite de hop (en RIP, 16 = infinito) |
| **Bucle de ida y vuelta** | R1↔R2 devolviéndose la misma ruta | **Split horizon**: no devolver lo aprendido de ese vecino |
| **Cambios bruscos indecisos** | Ruta que muere y "revive" por rumores nuevos | **Route poisoning** (anunciar 16) + **hold-down timer** |

> **Mensaje clave:** estos tres fantasmas NO son "bugs de RIP": son las limitaciones lógicas de pensar "por rumores". Cualquier protocolo de distancia va a chocar con ellos. La historia del routing es, literalmente, la historia de los ingenieros tratando de curar estas enfermedades... hasta que alguien propuso "y si en vez de rumores, dibujamos el mapa". Ese "alguien" es el estado de enlace, sección 7.

---

## 6. RIP: el abuelo que todavía se estudia

### 6.1. La ficha técnica

**RIP** (*Routing Information Protocol*) es el protocolo dinámico más viejo que sigue vigente (RFC 1058, 1988; nacido en los 80). Es el ejemplo canónico de vector de distancia:

| Característica | Valor |
|----------------|-------|
| Familia | Vector de distancia puro |
| Métrica | **Hop count** (saltos) |
| Límite | **15 saltos máx.** (16 = infinito) |
| Envío de updates | Cada **30 segundos**, tabla completa |
| AD | 120 |
| Puerto | UDP 520 |
| Entorno real | Redes chicas o legado; hoy casi no se usa en producción |

Su límite de 15 saltos no es un capricho: es la consecuencia de la sección 5 (el conteo al infinito necesita un tope alcanzable-pronto). Una red con más de 15 routers... RIP no la ve entera.

### 6.2. RIPv1 vs RIPv2: la historia en dos versiones

| Característica | RIPv1 | RIPv2 |
|----------------|-------|-------|
| Año | 1988 | 1994 (actualización) |
| Clase completa / VLSM | **NO**: no envía máscara (clases puras; no entiende subredes variable) | **SÍ**: envía máscara (VLSM y CIDR) |
| Envío | Broadcast | **Multicast** (224.0.0.9) |
| Autenticación | No | Sí (texto claro o MD5) |
| Elegir para estudiar | Solo contexto histórico | Es el que verías configurado |

Configuración (por si la ves en un laboratorio):

```cisco
R1(config)# router rip
R1(config-router)# version 2
R1(config-router)# network 192.168.1.0
R1(config-router)# network 10.0.0.0
R1(config-router)# no auto-summary
```

> **Ojo con `network` en RIP:** a diferencia de OSPF, acá `network` identifica las redes que RIP va a ANUNCIAR (las redes conectadas), no "en qué área participar". RIP asume que sabés cuáles son tus redes. Es un detalle que confunde a todos cuando migran de RIP a OSPF.

### 6.3. Por qué se estudia RIP si "ya no se usa"

Respuesta honesta y corta: **para entender los problemas que OSPF vino a resolver.** Cada característica "rara" de RIP (15 saltos, conteo al infinito, split horizon, updates cada 30 s) es la razón de existir de algo en los protocolos modernos:

| Límite de RIP | Lo que explica en el mundo moderno |
|---------------|-------------------------------------|
| 15 saltos | Por qué las redes grandes necesitan protocolos que no cuenten saltos |
| Updates cada 30 s | Por qué OSPF usa "incrementales" (solo avisás cuando algo cambia) |
| Count to infinity | Por qué se inventó el estado de enlace (cada router calcula con el mapa) |
| Hop count | Por qué OSPF/EIGRP usan métricas que consideran el ancho de banda |

No le dediques más de una tarde. Cuando veas OSPF, agradecé que no es RIP.

---

## 7. Link-State: aprender dibujando el mapa

### 7.1. La idea revolucionaria

Los protocolos de **estado de enlace** (link-state) cambian el paradigma por completo. En vez de rumores ("yo conozco la red X a distancia N"), cada router publica **la verdad sobre SU pedacito** y todos arman el mapa completo:

> **La idea madre del link-state:** cada router construye **una base de datos idéntica a la de los demás**: el mapa COMPLETO de la red. Sobre ese mapa, cada router calcula SOLO el mejor camino hacia cada destino. Nadie "le cree a un rumor": todos ven el mismo dibujo.

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

| Pieza | Qué es | Analogía |
|-------|--------|----------|
| **Hello** | Paquete de saludo: descubrir vecinos y mantenerlos vivos | El "¿seguís ahí?" del protocolo |
| **LSA** | La declaración de cada router: qué enlaces tiene y a qué costo | La ficha que cada oficina publica: "mis rutas y sus peajes" |
| **LSDB** | La colección de todos los LSA = el mapa | El mapa nacional completo, armado con las fichas de todos |
| **SPF** | El cálculo del mejor camino sobre el mapa | El GPS que calcula la ruta óptima mirando el mapa |

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

Cada router, al recaerle el LSA, **lo guarda en su LSDB, lo registra (lo marca como visto) y lo reenvía** a todos menos al que se lo mandó. La inundación está **controlada** por dos cosas: cada LSA tiene un número de secuencia (si ya lo tenés, no lo copiás) y un timer de vida (expira y se borra).

> **La belleza del flooding:** cuando R3 publica un cambio (un enlace se cayó), en **segundos** TODOS los routers tienen el cambio en su LSDB. Nadie necesita "contar hasta 16". La red entera se entera a la vez. Eso es convergencia rápida.

### 7.4. Por qué esto cura los fantasmas del DV

| Fantasma del DV | Por qué el link-state NO lo tiene |
|-----------------|-----------------------------------|
| Count to infinity | No hay "rumores": si el enlace de R1 se cae, R1 publica SU verdad (un LSA nuevo: "ya no tengo ese enlace"). Todos lo ven y recalculan |
| Bucle de ida y vuelta | El SPF calcula sobre el mapa COMPLETO: nunca va a elegir "volver al que te contó" porque VE el circuito completo |
| Confianza ciega | No hay confianza ciega: es TU LSA (el tuyo real) el que se propaga, no un rumor distorsionado por cada salto |

> **El precio, porque todo tiene precio:** el link-state consume más CPU (cada router corre SPF) y más memoria (guarda la LSDB entera). Y necesita que toda la red esté **sincronizada**: si dos routers tienen LSDB distintas, calculan caminos distintos y pueden armar bucles. Por eso divide las redes en **áreas** (lo vas a ver en OSPF multi-área): para que las LSDB no crezcan al infinito.

---

## 8. El algoritmo SPF: Dijkstra en cristiano

### 8.1. Qué es

El **SPF** (*Shortest Path First*) es el algoritmo que cada router de estado de enlace corre sobre su LSDB para calcular el mejor camino a cada destino. Su nombre técnico es **algoritmo de Dijkstra** (Edsger Dijkstra, 1959).

No hace falta programarlo: hace falta entender LA idea, porque es la misma que usás vos cuando elegís una ruta:

> **Dijkstra en cristiano: "desde donde estoy, mirá el vecino con el costo total más barato, marcá ese camino como resuelto, extendé la mirada, repetí."** Al final tenés el **árbol de caminos más cortos** desde TU router hacia todos los demás.

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

**Resultado final (el árbol SPF de R1):**

```text
R1 → R2 (costo 1)
R1 → R3 (costo 3)
R1 → R2 → R4 (costo 3)
```

Fijate lo importante: **R1 calculó el camino a R4 a través de R2 aunque R3 "queda más cerca en el dibujo"** — porque sumó los costos reales. El SPF no adivina: calcula con el mapa.

> **La garantía del SPF:** sobre una LSDB correcta, el algoritmo SIEMPRE encuentra el camino de costo mínimo. No hay "tal vez", no hay "fluke de rumor": es matemática. Por eso el link-state puede afirmar "yo elijo la mejor ruta" y por eso OSPF (que usa SPF) tiene una métrica basada en el costo real de los enlaces.

### 8.3. Costo del enlace: el input del SPF

El SPF necesita que cada enlace tenga un **costo**. Ese costo lo define cada protocolo:

- En **OSPF**: `100 Mbps ÷ ancho de banda` (el costo es menor en enlaces más rápidos). Lo ves a fondo con OSPF avanzado.
- En **IS-IS**: historically una métrica de 10 por defecto (también customizable).
- El administrador puede **sobreescribir** el costo a mano (`ip ospf cost X`) — esa es la base de la "ingeniería de tráfico" del tema de redistribución.

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

> **Analogía:** es una asamblea de vecinos decidiendo qué hacer cuando se corta la calle principal. Convergencia = el tiempo entre "se cortó la calle" y "todos los vecinos usan el desvío". Mientras no convergen, algunos autos siguen yendo a la calle cortada.

### 9.2. Por qué la converge importa tanto

| Protocolo | Convergencia típica | Por qué |
|-----------|---------------------|---------|
| Estáticas | **No converge**: nadie se entera hasta que un humano interviene | No hay aviso automático |
| RIP | Segundos a **minutos** (y a veces "contando hasta 16") | Updates cada 30 s + conteo al infinito |
| EIGRP | **Muy rápida** (subsegundos a segundos) | DUAL: cálculo local inmediato + aviso a vecinos |
| OSPF | Rápida (segundos) | Flooding inmediato del LSA + SPF local |

La convergencia es **el reloj de la red**: todo el mundo la mide y la promete, porque una red que converge lento es una red donde los paquetes se pierden cada vez que algo cambia. Y en redes de verdad, algo cambia SIEMPRE.

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

> **La conclusión de los 90:** cuando las redes crecieron, el vector de distancia (puro) no dio más. El estado de enlace es el estándar de facto de las redes internas modernas. Y ojo con un dato histórico-cómic: la respuesta de Cisco no fue "cambiemos a link-state" sino **EIGRP: un híbrido** (vector de distancia con "inteligencia" extra: guarda más estado, calcula rutas backup antes de que fallen). Causa de interminables debates. Lo vas a ver con EIGRP; por ahora, quedate con que la clasificación "DV vs LS" tiene un tercero con sombrero: el híbrido.

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

### 11.2. Reglas de oro de diseño

| Regla | Por qué |
|-------|---------|
| **Nunca mezcles protocolos sin plan** | Cada protocolo anuncia aparte; la redistribución es delicada y crea loops si no se domina |
| **La estática no es un pecado** | La default route estática "hacia el ISP" existe hasta en redes gigantes: lo que no escala es cientos de estáticas internas |
| **Preferí estándares abiertos** | OSPF funciona en cualquier fabricante; EIGRP te ata a Cisco |
| **Diseñá las áreas ANTES de configurar** | La estructura OSPF se dibuja en papel primero: áreas mal pensadas = LSDB gigantes = SPF lento |
| **Documentá la métrica** | "Costos OSPF: banda de referencia X" es un dato de mantenimiento que todos necesitan cuando algo anda raro |

> **Regla de oro:** el protocolo correcto depende del TAMAÑO y del NEGOCIO, no de tu gusto. Una oficina de 4 routers con OSPF bien diseñado es sobre-ingeniería; un campus de 80 routers con RIP es una catástrofe lenta y anunciada. "Herramienta adecuada, no herramienta favorita."

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

Cuando llegues a OSPF, ya vas a saber por qué existe cada pieza:

| Término que vas a ver en OSPF | Tu conocimiento previo de ESTE manual |
|-------------------------------|----------------------------------------|
| Hello / Dead timers | La pieza "descubrimiento de vecinos" del link-state |
| LSA / LSDB | Las piezas "publicación" y "mapa" que acabás de aprender |
| SPF / área 0 | El algoritmo Dijkstra del link-state + la solución al problema de escalabilidad |
| Convergencia | El porqué de TODO el diseño de OSPF |

> **Consejo de estudio:** si te preguntan "¿qué es OSPF?" y podés responder "un protocolo de estado de enlace que usa la LSDB y el SPF de Dijkstra para converger rápido y elegir rutas por costo", ya aprobaste el 50% de cualquier examen. Lo demás (configurar) es práctica.

---

## 13. Comprobá lo que aprendiste

**1. ¿Cuáles son las dos grandes familias del enrutamiento dinámico y qué las diferencia?**
<details>
<summary>Ver respuesta</summary>

**Vector de distancia** (RIP, EIGRP como híbrido): los routers se pasan "rumores" (destino + distancia) de vecino a vecino; nadie tiene el mapa completo. **Estado de enlace** (OSPF, IS-IS): cada router publica su pedacito (LSA) y todos arman la misma LSDB (mapa completo), sobre la que cada uno calcula con SPF. Rumores vs mapa colaborativo.
</details>

**2. ¿Qué es el count to infinity y por qué existe?**
<details>
<summary>Ver respuesta</summary>

Cuando una red muere, el rumor corre: los vecinos se devuelven la ruta que aprendieron del otro ("confianza ciega"), y la distancia crece de a 1 en cada ronda hasta "infinito". Es consecuencia de que el DV no tiene mapa: no puede darse cuenta de que la ruta murió. Se corta con un límite (RIP: 16 = infinito), pero llegara a 16 tarda (convergencia lenta). El link-state lo elimina: el LSA del router afectado declara la verdad y todos recalculan.
</details>

**3. ¿Qué es el split horizon?**
<details>
<summary>Ver respuesta</summary>

Regla: "no le devuelvas a un vecino lo que aprendiste de ese vecino". Evita que R1 y R2 se devuelvan la misma ruta en bucle cuando se cae la red de R1. Es un remedio barato contra el caso más común de count to infinity.
</details>

**4. ¿Qué es un LSA y qué es la LSDB?**
<details>
<summary>Ver respuesta</summary>

El **LSA** (Link-State Advertisement) es la publicación de un router: "yo estoy conectado a estos enlaces, con estos costos". La **LSDB** (Link-State Database) es la colección de TODOS los LSA: el mapa completo de la red, idéntico en todos los routers del área. Sobre la LSDB, cada router corre SPF para calcular sus mejores rutas.
</details>

**5. ¿Qué calcula el algoritmo de Dijkstra (SPF)?**
<details>
<summary>Ver respuesta</summary>

El árbol de caminos más cortos desde el router hacia todos los destinos, sumando los costos de los enlaces según la LSDB. "Mirá el vecino con el costo total menor, marcá ese camino, extendé la mirada, repetí." Garantiza el costo mínimo SIEMPRE, si la LSDB es correcta.
</details>

**6. ¿Por qué el link-state converge más rápido que el DV?**
<details>
<summary>Ver respuesta</summary>

Porque ante un cambio solo se propaga el **LSA del router afectado** (inundación controlada, segundos) y cada uno recalcula localmente con SPF. El DV, en cambio, depende de updates periódicos (cada 30 s en RIP) y de la lenta propagación de rumores (que además puede contar hasta el infinito).
</details>

**7. RIP usa hop count y OSPF usa costo basado en ancho de banda. ¿Qué implica esa diferencia?**
<details>
<summary>Ver respuesta</summary>

RIP elige por cantidad de saltos aunque el camino sea lentísimo (un enlace de 2 Mbps "vale" lo mismo que uno de 10 Gbps si tienen los mismos saltos). OSPF elige por **calidad del camino** (menos costo = más ancho de banda), porque el SPF necesita un costo real por enlace. Es la diferencia entre "cuento pasos" y "mido el camino".
</details>

**8. ¿Cuándo conviene usar estáticas, OSPF, EIGRP o IS-IS?**
<details>
<summary>Ver respuesta</summary>

Estáticas: redes chicas/estables o como default route de borde. OSPF: estándar abierto para redes de empresa, cualquier fabricante. EIGRP: parque 100% Cisco que quiera convergencia rapidísima. IS-IS: dominios enormes de proveedores. BGP queda para la interconexión con otros sistemas (lo ves con BGP). El protocolo se elige por tamaño y negocio, no por gusto.
</details>

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

---

> **Fuente:** Documentación propia basada en RFC 1058 (RIPv1), RFC 2453 (RIPv2), RFC 2328 (OSPFv2), RFC 1142 (IS-IS), CCNA 200-301 Official Cert Guide (W. Odom) y material educativo de redes.
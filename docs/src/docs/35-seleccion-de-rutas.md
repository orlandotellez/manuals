# 35. Selección de Rutas: AD, Métricas y Longest Prefix Match

**Cuando un router conoce varios caminos, ¿cuál elige?**

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

- Por R2 aprendió una ruta **estática** (la puso el administrador a mano).
- Por R3 aprendió la misma red por **OSPF** (un protocolo dinámico).

¿Cuál gana? ¿Y si en vez de dos fuentes distintas fuera la misma fuente ofreciendo dos caminos? Y el caso más fino todavía: ¿qué pasa si hay una ruta a `172.16.0.0/16` y otra a `172.16.5.0/24`, y el paquete va a `172.16.5.7`?

> **La idea madre de este manual:** cuando un router conoce varias rutas, NO elige "al azar" ni "la primera que vio". Sigue un **orden fijo y jerárquico** de tres preguntas, siempre en el mismo orden: ¿cuál es más específica? → ¿de qué fuente vino? → ¿cuál tiene mejor métrica? Si sabés ese orden, podés predecir la decisión de CUALQUIER router del mundo.

### 1.2. El cimiento: distinguir dos tipos de comparación

Antes del orden, el concepto que evita el 80% de las confusiones:

> Hay DOS comparaciones distintas, y los principiantes las mezclan:
>
> 1. **Comparación ENTRE fuentes** (estática contra OSPF, OSPF contra EIGRP...) → se resuelve con **Administrative Distance (AD)**.
> 2. **Comparación DENTRO de la misma fuente** (dos rutas OSPF, dos rutas EIGRP...) → se resuelve con **métrica**.
>
> "¿Gana la estática o el OSPF?" es una pregunta de AD. "¿Gana esta ruta OSPF o esta otra ruta OSPF?" es una pregunta de métrica. NUNCA se compara la métrica de un protocolo con la de otro: la métrica solo decide dentro de su propia familia.

La metáfora que lo resume:

> **Analogía:** la AD es la **jerarquía de la empresa** (el gerente gana al pasante, sin importar cuánto se esfuercen). La métrica es el **desempeño dentro del mismo cargo** (entre dos gerentes, gana el que entrega más rápido). No comparás el gerente con el pasante por "rapidez": el gerente gana primero, y recién después comparás entre gerentes.

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

> **El truco mental para no olvidarlo:** primero **especificidad** (¿cuál le queda más fina al destino? → LPM), después **confianza** (¿en quién confío más? → AD), después **performance** (¿cuál es mejor dentro de su familia? → métrica). Especificidad → Confianza → Performance. "Cómo de fina, de quién, y qué tan buena".

### 2.1. Un matiz que aclara todo

El **Longest Prefix Match NO es una "fuente" ni un "protocolo": es una propiedad matemática de la máscara** y se aplica PRIMERO, siempre. Este es el punto que el temario remarca y que casi nadie explica bien:

> Una ruta estática poco específica NO gana contra una ruta OSPF más específica. La especificidad manda ANTES que la confianza. Si tenés una OSPF a `10.1.1.0/24` y una estática a `10.0.0.0/8`, un paquete a `10.1.1.5` va por OSPF — porque `/24` es más específica que `/8`, y la especificidad se compara primero, sin importar que la estática sea "más confiable".

Este es el error conceptual más caro del enrutamiento: mucha gente "arregla" un problema de rutas subiendo la AD de la estática, cuando el verdadero problema era de especificidad. A partir de acá, cada pieza con su detalle.

---

## 3. Longest Prefix Match: la regla del más específico

### 3.1. Qué es

Cuando el router busca una ruta para el destino `X.Y.Z.W`, compara el destino contra TODAS sus rutas y se queda con la que tenga **el prefijo (máscara) más largo** que matchee. A más bits de red en la ruta, más específica es.

> **Analogía:** es la diferencia entre saber "vive en Buenos Aires" (algo ayuda) y saber "vive en Av. Siempre Viva 742, departamento 3B" (todo). Las dos sirven para aproximar, pero la dirección completa gana siempre: es más específica. El router, ante el paquete, quiere la dirección más exacta que tenga.

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

**Respuesta:** gana `192.168.1.64/26`. ¿Por qué? Porque matchea (el 77 cae entre el 64 y el 127) y tiene el prefijo más largo de todas las que matchean (26 > 24 > 16 > 0).

> **Ojo con un error común:** el orden de la tabla NO importa. Aunque la `/16` se haya aprendido "primero", gana la `/26`. El router no toma por orden de llegada: **compara la longitud de máscara, siempre.**

### 3.3. La tabla de "coincidencias" para el análisis rápido

Para decidir rápido si una ruta matchea, usá la tabla de red/broadcast por máscara del tema de análisis de IPv4:

```text
192.168.1.77 con /26 → red 192.168.1.64 (el rango es .64–.127) → MATCHEA
192.168.1.77 con /25 → red 192.168.1.0  (rango .0–.127)       → MATCHEA
192.168.1.77 con /24 → red 192.168.1.0  (rango .0–.255)       → MATCHEA
```

Todas matchean; gana la de máscara más larga (`/26`). En los ejercicios de la sección 10 vas a practicar exactamente esto.

---

## 4. Administrative Distance: la confianza en la fuente

### 4.1. Qué es

La **Administrative Distance (AD)** es un número del 0 al 255 que Cisco asigna a cada **fuente de rutas** para expresar cuánto confía en ella. Cuanto **menor** el número, **más confiable** la fuente. "Cero" significa "te hago caso siempre"; "255" significa "ni te miro".

La tabla que hay que conocer (los valores pueden variar levemente según el fabricante; estos son los de Cisco IOS, que son los que vas a ver en Packet Tracer y en el examen):

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

> **Cómo leer la tabla:** la AD decide ENTRE fuentes. "Entre una estática (1) y un OSPF (110) para el mismo destino con la misma máscara, gana la estática." Cuando un administrador quiere que el OSPF gane, le sube la AD manualmente a la estática (eso es exactamente la floating static route del tema de rutas estáticas, pero para protocolos: "que la estática pierda contra el dinámico").

### 4.2. La AD se cambia, pero con criterio

Puede modificarse con `ip route ... <ad>` o con `distance` dentro de un protocolo. Ejemplo: querés que tu estática sea el "último recurso" contra OSPF (AD 110), así que le ponés AD 150:

```cisco
! Esta estática PIERDE contra OSPF (110 < 150) pero gana contra RIP (120... no, 120 < 150 también pierde)
! En la práctica: se usa para respaldos muy flojos
ip route 172.16.0.0 255.255.0.0 10.0.0.2 150
```

> **Regla práctica:** no toques ADs a menos que tengas UN motivo claro y escrito. Cada AD es un diseño: la tabla de arriba está pensada para que "lo manual gane a lo automático, y lo externo pierda contra lo interno". Cambiarla sin motivo es como cambiar la jerarquía de una empresa por capricho: algún día, algo explota sin que sepas por qué.

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

> **Analogía:** la métrica es el **sistema de puntaje de cada deporte**. No comparás a un jugador de fútbol con uno de ajedrez por "goles": cada juego tiene su propia regla para decidir quién gana. RIP cuenta saltos, OSPF suma costos, EIGRP calcula una fórmula. Lo que tienen en común: el número más chico gana.

### 5.2. Un ejemplo: dos rutas OSPF, distinto costo

R1 llega a `192.168.10.0/24` por dos caminos OSPF:

```text
Camino A: por R2, enlaces de 100 Mbps  → costo 1 + 1 = 2
Camino B: por R3, enlaces de 10 Mbps   → costo 10 + 10 = 20
```

Ambas son OSPF (misma AD 110), mismo prefijo (`/24`). Gana la de **menor métrica**: el camino A (costo 2). El router instala esa ruta y la otra queda como candidata (se usa si la primera muere).

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

---

## 6. El orden completo aplicado a casos reales

### 6.1. Caso 1: la especificidad gana a la confianza

**Topología:** R1 quiere llegar a `10.1.1.5`.

- Ruta A: **estática** (AD 1) a `10.0.0.0/8` vía R2.
- Ruta B: **OSPF** (AD 110) a `10.1.1.0/24` vía R3.

**Pregunta trampa:** "la estática tiene AD 1 y OSPF 110, así que gana la estática". **FALSO.**

**Respuesta correcta:** el LPM se aplica primero. `10.1.1.0/24` es más específica que `10.0.0.0/8`, y ambas matchean con `10.1.1.5`. Gana **OSPF** (la /24), sin importar que su AD sea peor.

> **La lección que resume la tabla entera:** la AD compara rutas del MISMO prefijo. Cuando los prefijos difieren, la especificidad ya decidió antes de que la AD pueda opinar.

### 6.2. Caso 2: misma especificidad, distinta fuente

**Topología:** R1 quiere llegar a `172.16.0.5`.

- Ruta A: **estática** (AD 1) a `172.16.0.0/16` vía R2.
- Ruta B: **OSPF** (AD 110) a `172.16.0.0/16` vía R3.

Mismo prefijo `/16` → el LPM no decide → paso 2: **AD. Gana la estática (1 < 110) vía R2.** La OSPF queda durmiendo como candidata de respaldo.

### 6.3. Caso 3: misma fuente, distinta métrica

**Topología:** R1 quiere llegar a `192.168.5.0/24`. OSPF ofrece dos caminos:

- Camino A: costo 10.
- Camino B: costo 20.

Mismo prefijo, misma AD (110 para ambas, son OSPF) → paso 3: **métrica. Gana el camino A (costo 10).**

### 6.4. Caso 4: el empate que hace balancear

**Topología:** dos rutas ESTÁTICAS idénticas (mismo destino, mismo prefijo, ambas AD 1, ambas métrica 0):

```cisco
ip route 192.168.9.0 255.255.255.0 10.0.1.2
ip route 192.168.9.0 255.255.255.0 10.0.2.2
```

Prefijo igual, AD igual, métrica igual... **no hay "una ganadora"**: el router instala AMBAS y reparte los paquetes entre las dos (balanceo, sección 7).

---

## 7. Balanceo de carga: cuando hay empate

### 7.1. Qué es

Cuando dos o más rutas son **idénticas** (mismo destino, mismo prefijo, misma AD, misma métrica), el router no elige una: **las usa todas**. A eso se llama **balanceo de carga por rutas de costo igual** (ECMP, *Equal-Cost Multi-Path*).

```text
R1 ────── R2 ──────┐
   \               ├── 192.168.9.0/24
    ────── R3 ──────┘
```

Con dos rutas idénticas por R2 y R3, los paquetes de R1 hacia esa red se reparten entre ambos caminos. Ventaja: se aprovechan los dos enlaces.

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

Los dos `*` y los dos "Routing Descriptor Blocks" = las dos rutas están instaladas y activas. Reparten tráfico.

> **Dato para netamente curiosos:** el reparto en IOS clásico es por destinos (hash), no "paquete sí, paquete no" sobre la misma conversación: el flujo entre dos hosts siempre toma el mismo camino (así los paquetes de una misma comunicación no llegan desordenados). Por eso "balancear" significa repartir FLUJOS, no partir conversaciones.

### 7.3. La diferencia con la floating static route

No confundir los dos usos de "más de una ruta":

| Situación | Qué se configura | Resultado |
|-----------|------------------|-----------|
| Mismas AD y métrica | Dos rutas idénticas | **Balanceo**: las dos activas a la vez |
| AD distinta | Ruta principal + floating (AD 200) | **Respaldo**: una activa, otra dormida |

Una duda: "¿y cómo sé cuál de las dos está activa?" → `show ip route <red>` del caso 2 te dice exactamente eso: si está con `*` y "traffic share count", está activa; si queda como candidata, aparece en el "Routing Descriptor Blocks" sin asterisco (o directamente en `show ip route` solo si gana).

---

## 8. La ruta por defecto en el proceso de selección

### 8.1. La última de todas

La default route (`0.0.0.0/0`) tiene prefijo **0**: es la menos específica posible. En el proceso de decisión:

1. Se comparan todos los prefijos: cualquier ruta real (con máscara ≥ 1) matchea antes que la /0.
2. **Solo si NADA matchea**, cae en la default.

Por eso se llama "gateway of last resort" (viste el término en el tema de rutas estáticas): es literalmente el último recurso.

### 8.2. El ejemplo que lo hace ver

Destino: `200.1.1.99`. Tabla de R1:

| Ruta | ¿Matchea? |
|------|:---------:|
| `10.0.0.0/8` | No |
| `192.168.1.0/24` | No |
| `0.0.0.0/0` | **Sí** (todo matchea con /0) |

La `/0` matchea SIEMPRE (es el universo), así que en este caso gana por ser la única que matchea. Nota conceptual importante: la default no "gana a las demás" — **gana cuando las demás no existen o no matchean**. Su "triunfo" es por descarte.

### 8.3. Y si hay DOS rutas por defecto...

Misma regla: mismo prefijo (/0 y /0) → AD decide → si misma AD, métrica → si todo igual, **balanceo entre las dos defaults**. En routers de borde con dos ISP, es común ver dos defaults con métricas distintas para que una sea la principal y la otra el respaldo (misma idea de floating static, pero con defaults).

```cisco
! Default principal (salida preferida)
ip route 0.0.0.0 0.0.0.0 10.0.0.1

! Default de respaldo hacia el otro ISP
ip route 0.0.0.0 0.0.0.0 10.0.1.1 150
```

---

## 9. Verificación: cómo ver la decisión en el router

### 9.1. Los tres comandos estrellas

| Comando | Qué responde |
|---------|--------------|
| `show ip route` | La tabla completa con todas las rutas instaladas (las que GANARON) |
| `show ip route <red>` | El detalle de UNA ruta: de dónde viene, qué AD/métrica, si hay varias (balanceo) |
| `show ip route ?` o `show ip route ospf` / `show ip route static` | Filtrar por fuente |

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

Leer la "etiqueta" de la ruta:

```text
Known via "ospf 1"  → la fuente es OSPF (proceso 1)
distance 110        → la AD que le correspondió
metric 2            → la métrica dentro de OSPF
type intra area     → es una ruta del MISMO área (lo ves en OSPF)
* 10.0.12.2         → el next-hop instalado (el * = la elegida)
```

> **Dato de verificación:** la tabla de rutas muestra solo las rutas que GANARON. Las que perdieron (por AD o métrica) no aparecen ahí: quedan en la base de datos del protocolo. Sí aparecen en `show ip route <red>` como "Routing Descriptor Blocks" sin `*`, o se ven con los comandos del protocolo (ej. `show ip ospf database`, que vas a conocer con OSPF avanzado).

---

## 10. Aplicación: ejercicios resueltos y laboratorio

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

### 10.2. Ejercicio 2 — Ordenar la decisión

R1 recibe un paquete a `192.168.10.7` con esta tabla:

| # | Ruta | Fuente |
|---|------|--------|
| A | `192.168.0.0/16` | estática |
| B | `192.168.10.0/24` | OSPF |
| C | `192.168.10.0/25` | estática |
| D | `0.0.0.0/0` | estática |

**¿Por dónde va?**

<details>
<summary>Solución</summary>

Paso 1 (LPM): ¿qué matchea con 192.168.10.7?
- A (`/16`): matchea. Especificidad 16.
- B (`/24`): matchea. Especificidad 24.
- C (`/25`): 192.168.10.0/25 = .0–.127 → el 7 cae adentro → matchea. Especificidad 25.
- D (`/0`): matchea siempre. Especificidad 0.

Gana la más específica: **C (la /25 estática)**, sin importar que B sea OSPF y A sea estática. La especificidad se comparó primero.
</details>

### 10.3. Ejercicio 3 — Empate y balanceo

Tenés estas dos rutas estáticas:

```cisco
ip route 172.16.4.0 255.255.255.0 10.0.1.2
ip route 172.16.4.0 255.255.255.0 10.0.2.2
```

**¿Qué pasa?**

<details>
<summary>Solución</summary>

Mismo destino, mismo prefijo `/24`, misma fuente (estática, AD 1), misma métrica (0). Empate total → el router instala las DOS y balancea (ECMP): los flujos se reparten entre 10.0.1.2 y 10.0.2.2. Se ve con `show ip route 172.16.4.0`: dos "Routing Descriptor Blocks" activos.
</details>

### 10.4. Laboratorio exprés en Packet Tracer

> Si venís del tema de rutas estáticas, tenés la topología R1–R2 con estáticas. Modificála así:

**Topología:** R1 con DOS caminos hacia `192.168.2.0/24`: uno por R2 y uno por R3.

```
R1 ──── R2 ────┐
   \           ├── 192.168.2.0/24
    ──── R3 ────┘
```

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

> **HACELO VOS:** ahora reemplazá la estática por DOS estáticas SIN AD modificada (mismas, las dos AD 1). Mirá `show ip route 192.168.2.0`: ¿cuántos "Routing Descriptor Blocks" hay? Eso es el balanceo. Apagá un camino y mirá cómo el otro absorbe todo el tráfico.

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

---

## 12. Comprobá lo que aprendiste

**1. ¿Cuál es el orden exacto de decisión del router?**
<details>
<summary>Ver respuesta</summary>

1. **Longest Prefix Match**: la ruta que matchee con el prefijo (máscara) más largo. 2. **Administrative Distance**: entre rutas del mismo prefijo, la de menor AD. 3. **Métrica**: entre rutas de la misma fuente, la de menor métrica. 4. Empate total → balanceo de carga (ECMP). Especificidad → Confianza → Performance.
</details>

**2. Una estática (AD 1) a `10.0.0.0/8` y un OSPF (AD 110) a `10.5.5.0/24`: ¿qué ruta usan los paquetes a `10.5.5.5`?**
<details>
<summary>Ver respuesta</summary>

La **OSPF `/24`**. El longest prefix match se aplica primero: `/24` es más específica que `/8` y ambas matchean. La AD recién compara cuando los prefijos son iguales. Error clásico: "gana la estática porque AD 1" — falso, la especificidad manda primero.
</details>

**3. ¿Qué es la AD y qué expresa?**
<details>
<summary>Ver respuesta</summary>

La Administrative Distance es un número (0–255) que expresa qué tan confiable es la FUENTE de una ruta. Menor = más confiable. Compara rutas ENTRE fuentes (estática 1, EIGRP 90, OSPF 110, RIP 120, iBGP 200...). No compara rutas del mismo protocolo: ahí se usa la métrica.
</details>

**4. ¿Cuál es la métrica de RIP, OSPF y EIGRP?**
<details>
<summary>Ver respuesta</summary>

RIP: **hop count** (cantidad de saltos, máx. 15). OSPF: **cost** (100 Mbps ÷ ancho de banda de cada interfaz, sumando los saltos; o valor manual). EIGRP: una **fórmula compuesta** (ancho de banda + delay como base, con K-values que pueden sumar carga y confiabilidad). En todos: menor = mejor, y solo se comparan dentro del mismo protocolo.
</details>

**5. ¿Cuándo un router balancea (ECMP)?**
<details>
<summary>Ver respuesta</summary>

Cuando dos o más rutas son idénticas en todo lo que importa: mismo destino, mismo prefijo, misma AD y misma métrica. Ahí no hay "ganadora": se instalan todas y se reparten los flujos. El reparto es por flujo (hash por destino), no paquete por paquete de la misma conversación.
</details>

**6. La default route (`0.0.0.0/0`) ¿gana o pierde contra una ruta a `200.1.1.0/24` para un paquete a `200.1.1.9`?**
<details>
<summary>Ver respuesta</summary>

**Pierde** (y es lo correcto): la `/24` matchea con prefijo 24 y la `/0` con prefijo 0. La más específica gana. La default solo se usa cuando nada más matchea: es el "last resort", no la "primera opción".
</details>

**7. ¿Cómo se hace para que una estática le gane a una OSPF más específica?**
<details>
<summary>Ver respuesta</summary>

No alcanza con bajar la AD (ya es 1, la mínima que tiene sentido). Hay que escribir la estática con **el mismo prefijo o más específico** que la ruta OSPF que se quiere vencer: `ip route 10.5.5.0 255.255.255.0 ...` para ganarle a una OSPF `/24`. La especificidad se decide primero; la AD solo desempata dentro del mismo prefijo.
</details>

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

---

> **Fuente:** Documentación propia basada en Cisco IOS IP Routing Protocols Configuration Guide, RFC 1812 (router requirements, sección de route selection), CCNA 200-301 Official Cert Guide (W. Odom) y material educativo de redes.
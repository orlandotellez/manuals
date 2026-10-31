# 40. EIGRP: El Híbrido que Piensa Antes de Caerse

**El protocolo de Cisco que aprende por "rumores"... pero guarda los planos y tiene la salida de emergencia ya calculada**

---

## Índice

- [El lugar de EIGRP en la familia](#1-el-lugar-de-eigrp-en-la-familia)
- [La ficha técnica: lo que hay que saber de entrada](#2-la-ficha-técnica-lo-que-hay-que-saber-de-entrada)
- [El corazón: el algoritmo DUAL](#3-el-corazón-el-algoritmo-dual)
- [Successor y Feasible Successor: el plan A y el plan B](#4-successor-y-feasible-successor-el-plan-a-y-el-plan-b)
- [La métrica: ya no es un simple contador](#5-la-métrica-ya-no-es-un-simple-contador)
- [Los vecinos: el protocolo de saludo propio](#6-los-vecinos-el-protocolo-de-saludo-propio)
- [La tabla de topología: donde vive la inteligencia](#7-la-tabla-de-topología-donde-vive-la-inteligencia)
- [Configuración: EIGRP en 10 minutos](#8-configuración-eigrp-en-10-minutos)
- [La joya escondida: el balanceo de carga desigual (variance)](#9-la-joya-escondida-el-balanceo-de-carga-desigual-variance)
- [EIGRP para IPv6 y address families](#10-eigrp-para-ipv6-y-address-families)
- [Verificación: las preguntas que le hacés a la red](#11-verificación-las-preguntas-que-le-hacés-a-la-red)
- [EIGRP vs OSPF: la comparación honesta](#12-eigrp-vs-ospf-la-comparación-honesta)
- [Los 5 errores más comunes](#13-los-5-errores-más-comunes)
- [Comprobá lo que aprendiste](#14-comprobá-lo-que-aprendiste)
- [Glosario](#15-glosario)
- [Resumen en 10 puntos](#16-resumen-en-10-puntos)

---

## 1. El lugar de EIGRP en la familia

En el tema del enrutamiento dinámico viste la gran bifurcación:

```text
      Vector de Distancia (RIP)          Estado de Enlace (OSPF)
   "aprendo por rumores"              "todos tienen el mapa"
```

Y ahí quedó prometido un intruso: **"EIGRP: un híbrido (vector de distancia con inteligencia extra: guarda más estado, calcula rutas backup antes de que fallen)".** Este manual es la promesa cumplida.

**EIGRP** (*Enhanced Interior Gateway Routing Protocol*) es la respuesta de Cisco a los problemas del DV: aprendé por vecinos (como RIP), pero:

- Guardá **más estado** que un DV puro: una tabla de topología con TODOS los caminos conocidos, no solo el mejor.
- **Calculá la ruta de respaldo ANTES de que falle** la principal (¡esa es la magia de DUAL!).
- Propaga solo **cambios** (no tablas enteras cada 30 s) — conducta de link-state, sin el mapa completo.
- Elegí rutas con una **métrica de varios factores** (ancho de banda + delay), no un contador de saltos.

> **Analogía:** RIP es el repartidor que toma la ruta que le dijeron y, si se corta la calle, llama a la central y espera (y mientras, pierde paquetes). OSPF es el repartidor con GPS y mapa de toda la ciudad. EIGRP es el repartidor con GPS QUE YA MARCÓ LA RUTA ALTERNATIVA EN EL MAPA: si se corta la principal, tira del plan B al instante, sin llamar a nadie.

**Regla de oro empresarial:** EIGRP es **propietario de Cisco** — funciona de maravilla en redes 100% Cisco, y NO es interoperable con otros fabricantes. OSPF y IS-IS son abiertos (RFC). En un parque mixto, EIGRP no escala de diseño; en un parque Cisco puro, es veloz y simple.

---

## 2. La ficha técnica: lo que hay que saber de entrada

| Característica | Valor |
|----------------|-------|
| Familia | **Híbrido** (DV con características de LS) |
| Algoritmo | **DUAL** (Diffusing Update Algorithm) |
| AD | **90** (interno) / **170** (externo, redistribuido) |
| Métrica | **Ancho de banda + delay** (por defecto) |
| Transporte | **IP protocol 88** (ni TCP ni UDP) |
| Multicast | **224.0.0.10** (vecinos EIGRP) |
| Hello / Hold | **5 s / 15 s** (por defecto; se adapta en WAN lentas) |
| Actualizaciones | **Solo cambios** (incrementales), con acuse (RTP) |
| Escala | Mayor que RIP, menor que OSPF multi-área (límite práctico de saltos alto pero no infinito) |
| Estándar | **Propietario Cisco** (info pública desde RFC 7868, pero no interoperable igual) |

Dos datos que definen el diseño:

- **AD 90 < OSPF 110**: si un router aprende la misma ruta por EIGRP y por OSPF, gana EIGRP. Esto importa en redes de transición (tema de redistribución).
- **Protocolo 88 + multicast 224.0.0.10**: EIGRP habla directo por IP (como OSPF usa el 89) y los vecinos se buscan en el grupo 224.0.0.10.

> **El dato que separa a los que entienden:** EIGRP usa **RTP** (*Reliable Transport Protocol*). No es el RTP de video: es "transporte confiable" propio — cada actualización se acusa recibo (ACK). Por eso puede mandar solo cambios: si un cambio se pierde, el vecino lo pide de nuevo. El "rumor" de EIGRP no se pierde en el aire.

---

## 3. El corazón: el algoritmo DUAL

### 3.1. La pregunta que resuelve

Todo protocolo de enrutamiento responde: *¿cuál es el mejor camino?* DUAL agrega la pregunta que nadie más se hace antes: **¿y si ese camino se cae, cuál es el plan B?** — y la responde ANTES de que el plan A falle.

> **Analogía:** DUAL es el conductor que, cuando va por la autopista, ya tiene en la cabeza la ruta alternativa por si la autopista se corta. Cuando el cartel dice "desvío", él YA SABE a dónde gira. Los demás protocolos recién empiezan a calcular ahí.

### 3.2. Los dos estados (la fase del examen)

Todo camino en la tabla de topología EIGRP está en UNO de estos estados:

| Estado | Qué significa | Cuándo pasa |
|--------|---------------|-------------|
| **Passive** | El camino es estable y está calculado (feliz) | El 99,9% del tiempo |
| **Active** | El camino sufrió un cambio y el router está **buscando** un reemplazo (preguntando a vecinos) | Cuando el plan B tampoco sirve y no hay backup local |

> **La frase que examinan: "¿cuándo una ruta pasa a estado ACTIVE?" → cuando pierde el successor (plan A) y **no hay feasible successor** (plan B) local.** Recién ahí EIGRP difunde la consulta a los vecinos. Si un camino queda clavado en "Active" mucho tiempo, es síntoma de red mal diseñada (o de un problema de convergencia).

### 3.3. La garantía de DUAL: cero bucles

DUAL aplica la **suficiencia de difusión**: solo difunde la consulta cuando es necesario, y el criterio del Feasible Successor (sección 4) garantiza matemáticamente **caminos sin bucles a nivel de diseño** (a diferencia de los loop-prevention "parches" de RIP: split horizon, poisoning, etc. — que EIGRP supera con el criterio DUAL).

> **La comparación que cierra el punto:** RIP evita bucles con reglas (split horizon, hold-down). OSPF evita bucles con el mapa completo. EIGRP evita bucles con **matemática de DUAL**: el Feasible Successor garantiza que el backup es más corto que el principal, y por lo tanto no puede pasar por el router que lo está anunciando. Es la tercera vía, elegante y barata.

---

## 4. Successor y Feasible Successor: el plan A y el plan B

### 4.1. Los tres números que hay que saber

Para cada destino, EIGRP maneja:

```text
FD  (Feasible Distance) = la métrica TOTAL del MEJOR camino (la que va a la tabla de rutas)
RD  (Reported Distance) = la métrica que el VECINO dice que tiene hacia ese destino
                          (lo que el vecino REPORTÓ, su propio FD)
AD ya usado = Administrative Distance (90/170) — OJO: no confundir AD (tabla de rutas)
             con RD (reportado por el vecino). Iniciales parecidas, conceptos distintos.
```

### 4.2. La condición del Feasible Successor (la fórmula estrella)

```text
Un vecino SERÁ Feasible Successor (plan B) si:
        RD del vecino  <  FD propio

Es decir: el camino que el vecino dice tener hacia el destino,
tiene que ser MÁS CORTO que el mejor camino que yo ya tengo.
```

> **Analicemos por qué esta condición es genial (la parte que nadie explica):** si el vecino dice "yo llego a la red X con métrica 10" y mi mejor camino tiene métrica 20, entonces **el camino del vecino NO puede pasar por mí** — porque si pasara por mí, su métrica sería mayor que la mía (20 + algo > 10... imposible). Como su camino no pasa por mí, no hay bucle. **La condición garantiza que el plan B es seguro SIN calcular nada más.** Esa es la matemática que reemplaza al split horizon.

### 4.3. El ejemplo completo

Topología (cada enlace con su costo):

```text
        R1 ──── (costo 20) ──── R2
         │                      │
     (costo 40)            (costo 10)
         │                      │
        R3 ──── (costo 10) ──── R4 destina a la red 10.0.0.0/8
```

R1 aprende la red 10.0.0.0/8:

```text
Via R2: costo total = 20 + 10 = 30  → FD = 30 (el mejor) → SUCCESSOR (R2)
         R2 reportó RD = 10 (su propio costo)   → ¿10 < 30? SÍ → R2 también da Feasible? no: R2 ES el successor

Via R3: costo total = 40 + 10 + 10 = 60  → candidato
         R3 reportó RD = 20 (R3→R4=10 + R4→red=10)
         ¿RD de R3 (20) < FD propio (30)? SÍ → R3 = FEASIBLE SUCCESSOR (plan B, listo)
```

"Vía R4 directo" no existe (no hay enlace R1-R4): el ejemplo queda así. R1 tiene plan A (R2) y plan B (R3) **ya calculados**. Si R2 se cae → **DUAL no difunde nada**: reemplaza el successor por R3 al instante y listo. Convergencia en microsegundos, sin tráfico de consulta.

> **HACELO VOS:** aprendé la condición de memoria, con su lógica: "RD < FD". En el examen, te la preguntan con números: te dan FD=30, y vecinos con RD 10, 25, 35... → los que tienen RD < 30 son Feasible Successors. Los que no, NO (aunque su camino total sea mejor, sin la condición no se puede garantizar ausencia de bucle a costo cero).

---

## 5. La métrica: ya no es un simple contador

### 5.1. La fórmula (la versión "por defecto" que usás siempre)

La fórmula completa de EIGRP tiene 5 componentes (con los pesos K1-K5). Por defecto, solo importan **dos**:

```text
métrica = 256 × (10^7 / ancho de banda mínimo del camino  +  delay total / 10)

Ese "ancho de banda mínimo" = el enlace MÁS LENTO del recorrido (cuello de botella)
Ese "delay total" = suma de los delays de TODOS los enlaces del recorrido
```

Fijate la inteligencia: **mide lo ancho (BW) y lo lento del recorrido (delay)** — dos factores con significado físico, no un contador. La métrica de EIGRP es más "de verdad" que el hop count de RIP, aunque menos fina que el costo OSPF (que considera solo BW).

### 5.2. Los K-values: la palanca avanzada

```text
metric weights  K1  K2  K3  K4  K5
              (BW)(Load)(Delay)(Reliability)(MTU)

Por defecto: K1=1, K3=1, los demás 0 → solo BW y Delay.

⚠️ REGLA DE ORO: los K-values deben ser IGUALES en TODOS los routers
   del dominio EIGRP. Si R1 tiene K1=1 y R2 tiene K1=0 → no forman vecindad.
   (Como los timers en OSPF: EIGRP no negocia los K.)
```

> **Analogía:** la métrica de EIGRP es la nota de un viaje: cuenta la velocidad de la autopista más lenta (BW mínimo) y los peajes/tiempo de cada tramo (delay). Los K-values son "cuánto pesa cada factor en la nota" — y solo sirven si TODOS pesan igual en todas las escuelas.

---

## 6. Los vecinos: el protocolo de saludo propio

### 6.1. El Hello de EIGRP

Como OSPF, EIGRP saluda: Hello cada **5 segundos** por defecto (multicast 224.0.0.10). El **Hold timer** (15 s) es el "si te morís": si no llega Hello en 15 s, el vecino se declara caído y se dispara DUAL.

| Parámetro | Default | En WAN lentas |
|-----------|---------|---------------|
| Hello | 5 s | Se sube a 60 s (¡no a 5!) |
| Hold | 15 s | Se ajusta a > 3× el Hello (p.ej. 180 s) |

> **La trampa de examen que nadie ve venir:** el **Hold NO se auto-regula solo** — si cambiás el Hello a 60 s y dejás el Hold en 15 s, el vecino se cae a los 15 s aunque siga vivo (¡el Hello llega a los 60!). Regla: **Hold ≥ 3 × Hello.** Cuando veas "ip hello-interval eigrp", configurá también "ip hold-time eigrp".

### 6.2. Requisitos de vecindad (la mini-tabla que salva exámenes)

| Requisito | Si no coincide |
|-----------|----------------|
| Mismo **AS** (`router eigrp <AS>`) | No se ven |
| Mismos **K-values** | No forman vecindad |
| **Autenticación** (si está puesta) | No forman vecindad |
| **IPv4/IPv6 correctos** (AF) | No forman vecindad |

> **Dato curioso y determinante:** a diferencia de OSPF, EIGRP **NO exige la misma subred/máscara** entre los vecinos directos para formar vecindad (en modo clásico). Puede haber vecinos en enlaces con máscaras distintas. Eso lo convierte en un "detalle fino" que algunos examinadores usan para diferenciar EIGRP de OSPF.

---

## 7. La tabla de topología: donde vive la inteligencia

### 7.1. Las dos tablas de EIGRP (recordá la diferencia)

```text
TABLA DE TOPOLOGÍA (show ip eigrp topology)
   → TODOS los caminos aprendidos (successor + feasible + candidatos)
   → Acá vive DUAL: los FD, RD y el estado Passive/Active

TABLA DE RUTAS (show ip route)
   → SOLO el successor (el mejor camino)
   → Como cualquier otra tabla de rutas (la que realmente enruta paquetes)
```

### 7.2. Cómo se ve (salida real comentada)

```text
R1# show ip eigrp topology

P 10.0.0.0/8, 1 successors, FD is 25600     ← P = Passive (feliz), FD = métrica del mejor
        via 10.1.1.2 (25600/2560), GigabitEthernet0/0   ← successor: (FD total / RD reportado)
        via 10.1.2.2 (38400/5120), GigabitEthernet0/1   ← feasible successor (plan B)
```

Cada "via" lleva **(FD / RD)**: la métrica total por ese vecino, y lo que el vecino reportó. La comparación "RD < FD" que usaste en el examen... ES EXACTAMENTE ESTA COLUMNA. La teoría no está en un libro: está en `show ip eigrp topology`.

> **La conexión que cierra el manual:** cuando el enrutamiento dinámico dijo "EIGRP guarda más estado", esto es el estado: la **topology table completa**. OSPF guarda la LSDB (el mapa); EIGRP guarda la lista de caminos alternativos ya evaluados. Ambos logran convergencia rápida, con estrategias distintas.

---

## 8. Configuración: EIGRP en 10 minutos

### 8.1. La topología (la clásica de 3 routers)

```text
  R1 ──── 10.0.0.0/30 ──── R2 ──── 10.0.1.0/30 ──── R3
  lo0 1.1.1.1           lo0 2.2.2.2             lo0 3.3.3.3
```

### 8.2. La configuración (modo clásico, el que ves en el CCNA)

```cisco
! R1
interface loopback 0
 ip address 1.1.1.1 255.255.255.255
!
interface GigabitEthernet0/0
 ip address 10.0.0.1 255.255.255.252
 no shutdown
!
router eigrp 100
 network 10.0.0.0 0.0.0.3       ! igual que OSPF: wildcard (anti-máscara)
 network 1.1.1.1 0.0.0.0
 no auto-summary
```

### 8.3. La sintaxis explicada (los detalles que diferencian)

```text
router eigrp 100              ← el "100" es el número de SISTEMA AUTÓNOMO (AS)
                                 ¡NO el process-id de OSPF! Debe MATCHEAR entre vecinos
network 10.0.0.0 0.0.0.3      ← wildcard, como OSPF (¿te acordás? 255.255.255.255 − máscara)
                                 Nota: en modo clásico, EIGRP NO exige la wildcard exacta
                                 de la interfaz: con "network 10.0.0.0 0.0.0.255" ya matchea 10.0.0.0/30
no auto-summary               ← CRÍTICO: sin esto, EIGRP (antiguo) resumía por clases
                                 (10.0.0.0/8) y rompía el enrutamiento con VLSM.
                                 En IOS moderno es default... pero no confíes: ponelo.
```

> **La trampa clásica del AS:** `router eigrp 100` en R1 y `router eigrp 200` en R2 → **no son vecinos** (AS distinto = no se saludan, punto). El AS de EIGRP es un número interno arbitrario (1-65535) pero **debe ser el mismo** en todo el dominio. No es el ASN de BGP: eso es otra cosa.

### 8.4. La configuración "named mode" (el modo moderno)

La forma nueva (desde IOS 15) usa "named mode", orientado a address families:

```cisco
router eigrp RED-EMPRESA
 address-family ipv4 unicast autonomous-system 100
  network 10.0.0.0 0.0.0.3
  network 1.1.1.1 0.0.0.0
  exit-address-family
```

> **Para tu vida práctica:** el named mode es el futuro (y lo que Cisco recomienda), el clásico es lo que ves en los labs viejos y en los exámenes. Sabé que existen los dos; en el CCNA alcanza con el clásico bien dominado.

---

## 9. La joya escondida: el balanceo de carga desigual (variance)

### 9.1. El problema

OSPF y RIP hacen **ECMP** (balanceo igual: todas las rutas con la misma métrica). Pero ¿y si el plan A va por un enlace de 1 Gbps y el plan B por uno de 100 Mbps? OSPF manda TODO por el de 1 Gbps (métrica más baja) y deja el otro al pedo. EIGRP... puede **partir el tráfico entre ambos, proporcional a la métrica**: eso es el **balanceo de carga desigual** (`variance`).

### 9.2. El comando

```text
router eigrp 100
 variance 2     ← acepta rutas alternativas cuyo FD ≤ 2× el FD del successor
```

Con `variance 2`, todas las rutas con métrica hasta el **doble** del successor entran a la tabla de rutas y EIGRP reparte tráfico entre ellas de forma proporcional (el tráfico se distribuye según la métrica — no 50/50).

### 9.3. Los requisitos (el detalle fino)

```text
variance 2   → condición 1: la ruta alternativa debe ser FEASIBLE SUCCESSOR
               (RD < FD)  ← ¡la condición del manual! variance NO salta esa regla
             → condición 2: FD del backup ≤ variance × FD del successor
```

> **Analogía:** varianza es el "transporte multimodal": si el plan A es el camión de 10 toneladas y el plan B es el de 5, la varianza te dice "ufa, el de 5 también puede llevar carga" — y repartís los bultos según capacidad, no mitad y mitad. La condición RD < FD sigue protegiendo que el plan B no haga un bucle.

---

## 10. EIGRP para IPv6 y address families

EIGRP se adaptó a IPv6 con el mismo enfoque de AF:

```text
En el CLÁSICO:   router eigrp 100          → solo IPv4
                 (nada de IPv6 en clásico; para v6 se usa AF)

En NAMED MODE:   router eigrp RED-EMPRESA
                  address-family ipv6 unicast autonomous-system 100
                   network 2001:db8:1:1::/64    ← el "network" es con prefijo v6
```

| Detalle | EIGRP IPv4 | EIGRP IPv6 |
|---------|------------|------------|
| Comando del proceso | `router eigrp 100` | `router eigrp RED` + `address-family ipv6` |
| `no shutdown` en la AF | innecesario | **OBLIGATORIO** (las AF v6 nacen apagadas) |
| Verificación | `show ip eigrp neighbors` | `show ipv6 eigrp neighbors` |

> **La trampa que rompe el lab de EIGRPv6:** en IPv6, EIGRP arranca con la AF **apagada**: si no ponés `no shutdown` dentro de la address-family... no hay vecinos, no hay rutas, y el lab "no anda" sin error visible. Es el hermano gemelo de "olvidé `ipv6 unicast-routing` en OSPFv3" (la misma trampa). Mismo síntoma, distinta causa.

---

## 11. Verificación: las preguntas que le hacés a la red

| Comando | Qué te dice |
|---------|-------------|
| `show ip eigrp neighbors` | Vecinos: dirección, interfaz, **Hold time**, uptime, Q (cola) |
| `show ip route eigrp` | Las rutas `D` (y `D EX` para las redistribuidas) en la tabla |
| `show ip eigrp topology` | Todo el estado DUAL: successors, feasible successors, Passive/Active |
| `show ip eigrp interfaces` | Interfaces activas en el proceso + hello/hold reales |
| `debug eigrp neighbors` | El último recurso (vecindades en vivo) |

Salida comentada (la lectura que tenés que saber):

```text
R1# show ip eigrp neighbors
H   Address         Interface       Hold Uptime   SRTT  RTO  Q  Seq
0   10.0.0.2        Gi0/0             13  1w6d      1   200  0  12
    └── el vecino    └── por dónde    └─ Hold countdown   └─ Q=0: sin cola de mensajes pendientes
                                                                 (Q=1+ = problema de RTP)

R1# show ip route eigrp
D    10.0.1.0/30 [90/30720] via 10.0.0.2, 00:20:11, GigabitEthernet0/0
│               └── AD 90 (¡la prueba de que EIGRP gana ante OSPF en transición!)
└─ D = EIGRP    └── métrica compuesta
```

> **El dato que cierra el círculo de la selección de rutas:** `[90/30720]` es AD 90 + métrica compuesta. Fijate cómo EIGRP "se codea" como una letra `D` en la tabla Cisco — cada protocolo tiene su código: O = OSPF, D = EIGRP (la D viene de "DUAL"), B = BGP, I = IS-IS. Conocé las letras y leés la tabla de un vistazo.

---

## 12. EIGRP vs OSPF: la comparación honesta

| Criterio | EIGRP | OSPF |
|----------|-------|------|
| Familia | Híbrido (DV con LS) | Estado de enlace puro |
| Algoritmo | DUAL | SPF (Dijkstra) |
| AD | 90/170 | 110 |
| Métrica | BW + delay (K-values) | Costo (BW inverso) |
| Convergencia | Muy rápida (plan B precalculado) | Rápida (flood + SPF) |
| Las rutas alternativas | Feasible successors (tabla de topología) | No las guarda (recalcula con SPF) |
| Balanceo | **Igual Y desigual** (variance) | Solo igual (ECMP) |
| Interoperabilidad | Cisco only | Abierto (multi-fabricante) |
| Tamaño de red | Media (no escala como multi-área) | Alta (áreas) |
| Transmisión | Incremental con ACK (RTP) | LSA + flood |

> **La decisión honesta (la que te va a servir en la vida):** parque **100% Cisco** y querés convergencia instantánea y balanceo desigual → EIGRP. Red **multi-fabricante**, grandes, o con futuro de crecer → **OSPF**. Y el día que tengas que conectar BGP, a los dos los redistribuís por igual (tema de redistribución). No es "cuál es mejor": es "cuál encaja con tu entorno".

---

## 13. Los 5 errores más comunes

| # | Error | Síntoma | Fix |
|---|-------|---------|-----|
| 1 | **AS distinto** en cada extremo | Vecinos no aparecen | Mismo `router eigrp <AS>` en todo el dominio |
| 2 | **Falta `no auto-summary`** (IOS viejo) | Rutas resumidas por clase (10.0.0.0/8) que rompen VLSM | `no auto-summary` (en IOS moderno es default; en lab viejo, ponelo) |
| 3 | **K-values distintos** | Vecinos no forman adyacencia | Mismos `metric weights` en todos |
| 4 | **Hold < 3× Hello** después de tocar el Hello | Vecino cae y vuelve solo (flap) | `hold-time` ≥ 3× hello-interval |
| 5 | **EIGRPv6 sin `no shutdown`** en la AF | Sin vecinos, sin rutas, sin error visible | `no shutdown` dentro de `address-family ipv6` |

> **El error #4 es el más "fantasma":** el vecino aparece y desaparece solo (flap). La red "anda a ratos". Causa clásica: se cambió hello-interval y el hold quedó en default. Revisá `show ip eigrp neighbors` (columna Hold en countdown corto) — si el Hold baja de golpe a cero y el vecino se reinicia, es esto.

---

## 14. Comprobá lo que aprendiste

**1. ¿Qué hace a EIGRP un "híbrido" entre DV y LS?**
<details>
<summary>Ver respuesta</summary>

Aprende de vecinos directos como un DV (ripples), pero guarda el estado de todos los caminos (tabla de topología, conducta LS), propaga solo cambios con ACK (RTP) y precalcula plan B (feasible successor) — conducta LS, sin el mapa completo.
</details>

**2. ¿Qué es la condición del Feasible Successor?**
<details>
<summary>Ver respuesta</summary>

RD del vecino < FD propio. Garantiza que el camino del vecino no pasa por mí (si pasara, su métrica sería mayor a la mía), por lo que es seguro como backup SIN calcular nada. Eso evita bucles a costo cero.
</details>

**3. ¿Qué le pasa a una ruta cuando se cae el successor y NO hay feasible successor?**
<details>
<summary>Ver respuesta</summary>

Pasa a estado ACTIVE: DUAL difunde la consulta a los vecinos para encontrar un reemplazo. Si hay feasible successor, DUAL NO consulta nada: cambia de camino al instante (estado Passive sigue).
</details>

**4. ¿Cómo se calcula la métrica EIGRP por defecto?**
<details>
<summary>Ver respuesta</summary>

256 × (10^7 / BW mínimo del camino + delay total / 10). Por defecto solo pesan BW y Delay (K1 y K3 = 1). El BW mínimo es el cuello de botella del recorrido; el delay se suma en todos los enlaces. Los K-values deben ser iguales en todo el dominio.
</details>

**5. ¿Qué es variance y qué requisitos exige?**
<details>
<summary>Ver respuesta</summary>

Permite balancear tráfico entre rutas de métrica DISTINTA (hasta N veces la del successor). Requisitos: la ruta debe ser feasible successor (RD < FD) y su FD ≤ variance × FD del successor. EIGRP reparte el tráfico proporcional a la métrica, no 50/50.
</details>

**6. ¿Qué peligro hay en `show ip eigrp neighbors` con Q=1+?**
<details>
<summary>Ver respuesta</summary>

Q es la cola de mensajes sin ACK. Q=1 o más indica que el vecino no está acusando recibo de las actualizaciones RTP: problema de conectividad, buffer o ADJENCY degradada. Idealmente Q=0 siempre.
</details>

**7. ¿EIGRP exige la misma máscara entre vecinos como OSPF?**
<details>
<summary>Ver respuesta</summary>

NO en modo clásico. EIGRP no exige misma subred/máscara en vecinos directos para formar adyacencia (a diferencia de OSPF). Es un detalle fino de examen que diferencia ambos protocolos.
</details>

**8. ¿Por qué AD 90 de EIGRP vs 110 de OSPF? ¿Y en qué orden van las preferencias?**
<details>
<summary>Ver respuesta</summary>

AD menor = más preferido (recordá la selección de rutas). EIGRP (90) gana sobre OSPF (110) cuando ambos conocen la misma ruta. Orden clásico que hay que saber: conectada (0) > estática (1) > EIGRP (90) > OSPF (110) > RIP (120) > externa (170+).
</details>

---

## 15. Glosario

| Término | Qué es |
|---------|--------|
| **EIGRP** | Protocolo híbrido propietario de Cisco (IP 88, AD 90/170) |
| **DUAL** | Algoritmo de EIGRP: successors + feasible successors, estados Passive/Active |
| **FD** | Feasible Distance: métrica total del mejor camino (la que va a la tabla) |
| **RD** | Reported Distance: la métrica que reporta el vecino candidato |
| **Successor** | El vecino con el mejor camino (plan A) |
| **Feasible Successor** | Vecino con RD < FD (plan B garantizado sin bucles) |
| **RTP** | Reliable Transport Protocol: transporte confiable con ACKs de EIGRP |
| **K-values** | Pesos de la métrica (K1 BW, K3 Delay por defecto); iguales en todo el dominio |
| **Variance** | Balanceo de carga desigual (rutas hasta N× la métrica del successor) |
| **224.0.0.10** | Multicast de vecinos EIGRP |
| **AS de EIGRP** | Número interno (1-65535) que debe coincidir entre vecinos; ≠ ASN de BGP |
| **Named mode / AF** | Modo moderno de config (router eigrp NOMBRE + address-family) |

---

## 16. Resumen en 10 puntos

1. **EIGRP es el híbrido**: aprende por vecinos (DV) pero guarda estado y propaga solo cambios con ACK (LS), sin el mapa completo.
2. **DUAL es el corazón**: el plan B (feasible successor) se calcula ANTES de que falle el plan A → convergencia casi instantánea.
3. **La condición del feasible successor (RD < FD)** es la que verdaderamente evita bucles a costo cero — mejor que split horizon.
4. **La métrica mide BW mínimo + delay**, no saltos: 256 × (10^7/BW mín + delay/10), con K-values globales.
5. **AD 90** (interno) / **170** (externo): EIGRP gana ante OSPF (110) cuando ambos conocen la misma ruta.
6. **Hello 5 s / Hold 15 s**, multicast 224.0.0.10, IP protocolo 88, con RTP que acusa recibo.
7. **La tabla de topología** (show ip eigrp topology) es donde vive la inteligencia: successors + feasible successors + estado Passive/Active.
8. **variance** = balanceo de carga DESIGUAL: reparte el tráfico entre rutas de distinta métrica (proporcional), condición RD < FD incluida.
9. **Config clásica**: `router eigrp 100` + `network` con wildcard + `no auto-summary`; los K-values y el AS deben coincidir entre vecinos.
10. **EIGRP es Cisco-only**: en parque mixto o grandes redes, OSPF (abiertos) es la elección; la decisión es de entorno, no de fanatismo.

---

> **Fuente:** Documentación propia basada en RFC 7868 (EIGRP, info pública), CCNA 200-301 Official Cert Guide (W. Odom), Cisco IOS Configuration Guides y material educativo de redes.
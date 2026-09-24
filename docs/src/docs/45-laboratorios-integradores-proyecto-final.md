# 45. Laboratorios Integradores y Proyecto Final

**Todo lo que aprendiste, en una red que funciona — el examen final de la serie es PRÁCTICO**

---

## Índice

- [La meta final: integrar toda la serie](#1-la-meta-final-integrar-toda-la-serie)
- [Reglas del laboratorio](#2-reglas-del-laboratorio)
- [Lab 1 — Repaso: estáticas, floating y balanceo](#3-lab-1--repaso-estáticas-floating-y-balanceo)
- [Lab 2 — OSPF multiárea con DR/BDR y sumarización](#4-lab-2--ospf-multiárea-con-drbdr-y-sumarización)
- [Lab 3 — EIGRP con variance y EIGRPv6](#5-lab-3--eigrp-con-variance-y-eigrpv6)
- [Lab 4 — BGP: eBGP + iBGP con next-hop-self](#6-lab-4--bgp-ebgp--ibgp-con-next-hop-self)
- [PROYECTO FINAL — La red integral](#7-proyecto-final--la-red-integral)
- [La matriz de auto-evaluación](#8-la-matriz-de-auto-evaluación)
- [Comprobá lo que aprendiste](#9-comprobá-lo-que-aprendiste)
- [Glosario](#10-glosario)
- [Resumen en 10 puntos](#11-resumen-en-10-puntos)

---

## 1. La meta final: integrar toda la serie

Este es el último manual de "Redes de Datos II" — y el cierre no es un resumen de teoría: es **práctica integradora**. Toda la serie te dio las piezas; acá las armamos TODAS juntas en una red que sirve para algo real.

> **La filosofía de este manual:** NO hay teoría nueva. Miralo como el examen práctico de la serie: cada lab te pide que construyas algo que ya conocés, con la diferencia de que al final todo convive en la misma red. Si podés armar el Proyecto Final completo y defenderlo, te llevás la serie entera adentro.

**El mapa mental de la serie (miralo antes de cada lab):**

```text
Rutas estáticas y selección de rutas → AD, ECMP, floating static = la FUNDACIÓN
Enrutamiento dinámico · RIP → el DV que te enseña la métrica = la TRANSICIÓN
OSPF (v2 y v3) → LS, áreas, DR/BDR, LSA, v6 = el INTERIOR serio
EIGRP e IS-IS → los "otros" IGPs = el PANORAMA completo
BGP → eBGP/iBGP, atributos = la FRONTERA
Redistribución → route-maps = el PEGAMENTO
Troubleshooting → el MÉTODO
Este manual → labs + proyecto final = TÚ, armándolo todo
```

---

## 2. Reglas del laboratorio

Antes de tocar un router, estas reglas te ahorran horas (son las del mundo real):

1. **Todo en Packet Tracer** (tenés de referencia el tema de Packet Tracer de la serie de redes) o en tu simulador favorito (GNS3/EVE-NG si tenés imágenes reales).
2. **Nomenclatura estricta**: nombres de host, IPs y descripciones con formato consistente (ej. `Sucursal-A`, descripciones en las interfaces). Un lab sin nombres es un lab imposible de debuggear.
3. **Verificá en cada paso**: después de CADA bloque de configuración, un `show` que confirme lo que acabás de hacer (no al final: al final es tarde).
4. **Redistribución SIEMPRE con filtro** (tema de redistribución): si no hay route-map, no hay redistribución.
5. **Cambiá una cosa a la vez** (tema de troubleshooting): cuando algo no funcione, el culpable es el último cambio.

> **HACELO VOS (la regla invisible):** el lab no se entrega cuando "anda": se entrega cuando PODÉS EXPLICAR por qué anda. Si te preguntan "¿por qué esta ruta tiene AD 110?" y no sabés responderlo, el lab está a medias por más que el ping responda.

---

## 3. Lab 1 — Repaso: estáticas, floating y balanceo

**Objetivo:** rearmar rutas estáticas y selección de rutas en un escenario de doble salida.

### 3.1. Topología

```text
                      192.168.10.0/24 (LAN)
                          │
                     ┌────┴────┐
                     │   R1    │
                     └────┬────┘
              (enlace A)  │  (enlace B)
                10.0.0.0/30│  10.0.1.0/30
                     ┌─────┴──┐─────┐
                     │   R2    │   R3    (dos "proveedores")
                     └────────┘   └────┘
```

### 3.2. Consignas

1. En R1, ruta por defecto por el enlace A (R2), **administrative distance 5**.
2. La MISMA default por el enlace B (R3) pero con **AD 10** → floating static (tema de rutas estáticas): R3 solo se usa si R2 cae.
3. A la red 192.168.10.0/24, ECMP: **dos estáticas con la misma AD y métrica** (balanceo, tema de selección de rutas).
4. Verificá con `show ip route` que las tres (default + ECMP) coexisten y que `sh ip route 0.0.0.0` muestra la lista de candidatas con `[5/0]` y `[10/0]`.
5. **Prueba de fuego:** apagá la interfaz hacia R2 (`shutdown`) y verificá que la default migra sola a R3 (AD 10) y vuelve cuando R2 reaparece.

**Verificación esperada (R1):**

```text
S*   0.0.0.0/0 [5/0] via 10.0.0.2                    ← la que gana (AD 5)
                 [10/0] via 10.0.1.2                 ← la de respaldo (AD 10)
S    192.168.10.0/24 [1/0] via 10.0.0.2
                     [1/0] via 10.0.1.2              ← ECMP: dos caminos, misma AD
```

---

## 4. Lab 2 — OSPF multiárea con DR/BDR y sumarización

**Objetivo:** rearmar OSPF (single-area y avanzado) con áreas y un toque de diseño.

### 4.1. Topología

```text
               ÁREA 0 (backbone)                ÁREA 1
   R1 ─── R2 ─── R3 ─── R4 ─── R5
        (loopbacks: 1.1.1.1, 2.2.2.2, 3.3.3.3, 4.4.4.4, 5.5.5.5)
   R2 y R4 en el backbone; R5 (y su LAN 172.16.0.0/16) en área 1
```

### 4.2. Consignas

1. OSPF proceso 1 con `router-id` explícito en CADA router (1.1.1.1 → 5.5.5.5).
2. R2 y R4 son ABR (área 0 + área 1): las reds de área 1 viven detrás de R5.
3. **Sumarización en el ABR** (OSPF avanzado): R4 anuncia a área 0 un resumen `area 1 range 172.16.0.0 255.255.0.0` si R5 tiene la /16 particionada.
4. Verificá **DR/BDR** en el segmento compartido del backbone: `show ip ospf neighbor` debe mostrar `FULL/DR` y `FULL/BDR` (en OSPF, primero arranca el de mayor RID).
5. Confirmá en `show ip ospf database` que los **LSA tipo 3** (sumarios) entran a área 0 y los tipo 1 solo viven en su área.

**Pregunta de cierre del lab:** si R3 tiene AD 110 y EIGRP le inyecta la misma ruta con AD 90... ¿quién gana y qué dice `show ip route`? (Respuesta: EIGRP, y la ves como `D` — tema de selección de rutas.)

---

## 5. Lab 3 — EIGRP con variance y EIGRPv6

**Objetivo:** rearmar EIGRP con los dos trucos que diferencian al que sabe: variance y el IPv6.

### 5.1. Topología (IPv4)

```text
           10.0.0.0/30 (rápido, 1 Gbps)      ← camino A
     R1 ─────────────────────────── R2
     └─────────────────────────────┘
           10.0.1.0/30 (lento, 100 Mbps)     ← camino B
   (R1 y R2 unidos por DOS enlaces: EIGRP 100)
```

### 5.2. Consignas

1. EIGRP 100 con las dos interfaces en el proceso (uso **named mode** al configurar, como práctica del tema de EIGRP).
2. **Variance**: con el camino A como sucesor y el B como feasible successor, configurá `variance 4` y verificá que la tabla muestra AMBAS rutas con `*` (balanceo desigual — el truco de EIGRP).
3. Fijate la condición: variance solo funciona si el camino B cumple **RD < FD** del sucesor. Si no lo cumple, no entra (aunque subas variance; ese es el punto).
4. Verificá en `show ip eigrp topology` que el camino B figura como `via ... (` en la columna de las alternativas.

### 5.3. Consigna de IPv6 (retando a EIGRP)

Configurá EIGRPv6 en un enlace con direcciones `2001:db8::/64` de ida y vuelta, y acordate de la **trampa**: el AF viene en `shutdown` por defecto. Verificá que sin `no shutdown` NO hay vecinos, y que con `no shutdown` aparecen.

---

## 6. Lab 4 — BGP: eBGP + iBGP con next-hop-self

**Objetivo:** rearmar BGP con la topología clásica de examen.

### 6.1. Topología

```text
   AS 65001 (tuyo)                         AS 65002 (ISP)
   R1 ─────── R2 ─────────────────────── R3 ─────── R4
   lo0 1.1.1.1  lo0 2.2.2.2  10.0.0.0/30   lo0 3.3.3.3   lo0 4.4.4.4
   ←─ iBGP ─→  (R1↔R2)   ←──── eBGP ────→  (R2↔R3)   (R3↔R4 en el ISP)
```

### 6.2. Consignas

1. En R2: sesión **eBGP** con R3 (`remote-as 65002`) y sesión **iBGP** con R1 (`remote-as 65001`) sobre **loopbacks** con `update-source loopback 0`.
2. **next-hop-self** en R2 hacia R1 (BGP, regla 2): sin esto, R1 hereda el next-hop de R3 y no puede resolverlo.
3. En R1, verificá que recibe el prefijo del ISP y que su next-hop es **2.2.2.2** (R2), no el del ISP: `show ip bgp` debe decir `*>i ... via 2.2.2.2` con `i` (iBGP).
4. Para la parte eBGP de R2→R3: usá `ebgp-multihop 2` si la sesión vive en loopbacks — y fijate qué pasa si NO lo ponés (sesión que nunca levanta: BGP, error #4).
5. **Verificación final:** `show ip bgp summary` en R2 mostrando DOS vecinos ESTABLISHED (uno eBGP `65002` y uno iBGP `65001`).

---

## 7. PROYECTO FINAL — La red integral

**Este es el examen:** una sola topología que usa TODA la serie. La red de una empresa ficticia con dos sucursales, un núcleo EIGRP, un área OSPF en cada sucursal, un borde BGP hacia el ISP — y una redistribución que no rompe nada.

### 7.1. Arquitectura del proyecto

```text
                                     INTERNET
                                        │
                                    [ISP R9]  (AS 65002)
                                        │ eBGP
                        ┌────────────── R6 (BORDER, AS 65001) ──────────────┐
                        │            │                                      │
                    [R5] (núcleo)  [R7] (núcleo)                       [R8] (backup)
                      │  EIGRP 100  │  EIGRP 100                           │ eBGP (respaldo)
                     OSPF area 0   OSPF area 0                             │
                      │                │                                   │
                  [R1]──[R2]        [R3]──[R4]                    (R8→ISP por 2° enlace)
                  Sucursal Norte    Sucursal Sur
                  10.10.0.0/16      10.20.0.0/16
                        (cada sucursal: OSPF el área 0 + sus áreas 1 si querés V2 empezar)
```

### 7.2. Requerimientos (la lista de entrega)

| # | Requerimiento | Temas que evaluás |
|---|---------------|-------------------|
| 1 | **Direccionamiento**: plan VLSM con etiquetas por rol (loopbacks, enlaces, LANs) | Rutas estáticas, redistribución |
| 2 | **IGP interno**: EIGRP 100 en el núcleo (R5-R6-R7), cada sucursal con OSPF (el norte y el sur) | OSPF, EIGRP |
| 3 | **Redistribución**: OSPF ↔ EIGRP en R5 y R7, con route-map filtrando el retorno (¡nada de feedback loop!) | Redistribución |
| 4 | **BGP en el borde**: R6 = eBGP principal con el ISP (default route), R8 = backup | BGP |
| 5 | **Default route propagada** a toda la red: desde R6 hacia el EIGRP (y de ahí al OSPF) | Rutas estáticas, OSPF, EIGRP, redistribución |
| 6 | **Redundancia**: si R6 cae, R8 asume (floating o BGP); si el enlace del norte cae, el sur sigue sirviendo | Rutas estáticas, selección de rutas, BGP |
| 7 | **Verificación documentada** (matriz de la sección 8) | Troubleshooting |

### 7.3. El plan de armado (el orden que te salva)

```text
FASE A — Capa física y direccionamiento: TODAS las IPs y loopbacks PRIMERO
        (sin IPs, nada de lo que sigue existe: es la pregunta 1 del tema de troubleshooting)
FASE B — IGP del núcleo: EIGRP 100 entre R5, R6, R7 (y las interfaces del núcleo)
FASE C — OSPF por sucursal: R1-R2 (norte) y R3-R4 (sur) en sus áreas
FASE D — Redistribución en R5 y R7: dos route-maps, uno por sentido, filtrado el retorno
FASE E — BGP en R6 (+R8 backup) y propagación de la default: EIGRP → OSPF
FASE F — Verificación integral (matriz de la sección 8) y regrabado de configs a .txt
```

> **HACELO VOS (el orden es parte del lab):** por QUÉ en ese orden — porque cada fase se verifica ANTES de construir la siguiente. Si armás BGP y después el IGP, cuando algo no funciona no sabés si es BGP, el IGP o la redistribución. En el orden de arriba, cuando llegás a F ya verificaste E, y cuando llegaste a E verificaste D... **el error queda acotado a la ÚLTIMA fase que tocaste** (troubleshooting en la práctica).

### 7.4. El resumen de config crítica (lo que tu proyecto TIENE que tener bien)

```text
! R6 (border) — el corazón del proyecto
router eigrp 100
 redistribute static metric 10000 100 255 1 1500      ! la default entra al EIGRP
 ! (la static es la default que BGP instaló — o directamente:
 redistribute bgp 65001 metric 10000 100 255 1 1500)  ! BGP ya instaló la default
router bgp 65001
 network 0.0.0.0 mask 0.0.0.0            ! opportunidad: ¡la default se anuncia a veces!
 neighbor 203.0.113.2 remote-as 65002    ! eBGP con el ISP
 neighbor 10.0.0.5 remote-as 65001
 neighbor 10.0.0.5 next-hop-self         ! iBGP a R5 (regla de BGP)

! R5 (redistributor OSPF↔EIGRP, con filtro de retorno — tema de redistribución)
access-list 15 permit 10.0.0.0 0.255.255.255
route-map RETORNO permit 10
 match ip address 15
router ospf 1
 redistribute eigrp 100 subnets route-map RETORNO metric 30
router eigrp 100
 redistribute ospf 1 metric 10000 100 255 1 1500
```

### 7.5. La entrega

El proyecto se entrega con:

1. El archivo `.pkt` (o la topología exportada) **funcionando**.
2. Un documento con el plan de direccionamiento completo (tabla: red / VLSM / dispositivo / interfaz / IP).
3. Las **configuraciones guardadas** (una por router, en `.txt`, con nombres de host y descripciones).
4. La **matriz de verificación** (sección 8) con las salidas reales de cada prueba.
5. La **respuesta escrita** a la pregunta de oro: "¿por qué tu redistribución no genera bucles?" (si no la podés responder, el lab tiene un problema, no vos).

---

## 8. La matriz de auto-evaluación

Corré ESTAS pruebas en tu proyecto final y marcá cada una ✅ (con la salida real pegada):

```text
PRUEBA                                          COMANDO                     ESPERADO
──────────────────────────────────────────────────────────────────────────────────────
1. Todas las interfaces up/up con IP            show ip interface brief      Ninguna "administratively down"
2. El núcleo ve toda la red                     show ip route | include D    rutas D (EIGRP) a TODO
3. El norte rutea al sur                        ping 10.20.0.1 (desde R1)    !!!!! éxito
4. La sucursal sur ve el norte por EIGRP        show ip route                ruta D + O E1 (redistribuída)
5. ESPICA: rutas externas E1 / D / B cohexisten show ip route                tres códigos visibles luego de los IGPs
6. Desde una LAN salís a Internet               ping 8.8.8.8 (desde R1)      !!!!!
7. Redundancia: apagás R6 → internet sigue      shutdown en R6               por R8 (floating/backup) ✔
8. Sin feedback loop: la ruta no late           show ip route <red> 2 veces  IDÉNTICA (sin flapping)
9. BGP: vecinos ESTABLISHED con prefijos        show ip bgp summary          2 vecinos, prefijos > 0
10. El método de troubleshooting documentado    (escrito en la entrega)      cada falla: hipótesis → evidencia
```

> **El criterio de aprobación honesto:** si 9 de 10 pruebas pasan y la #10 está documentada, el proyecto está aprobado. Si la #8 falla (rutas que laten), el proyecto NO está aprobado aunque el ping responda: tenés un feedback loop de redistribución (tema de redistribución) y lo vas a sufrir en producción.

---

## 9. Comprobá lo que aprendiste

**1. ¿Por qué Lab 1 usa AD 5 y AD 10 en lugar de AD 1 en las dos default routes?**
<details>
<summary>Ver respuesta</summary>

Para que la default "principal" (AD 5) gane SIEMPRE sobre la de respaldo (AD 10) mientras esté viva (selección de rutas: menor AD gana). Si tuvieran la misma AD, entrarían en ECMP y balancearían hacia un enlace que quizás querés solo de backup. La AD distinta implementa "activo + respaldo" (floating static, tema de rutas estáticas).
</details>

**2. En Lab 2, ¿cómo sabés sin mirar cuál router será el DR del segmento?**
<details>
<summary>Ver respuesta</summary>

En un segmento multipunto, gana primero el de mayor prioridad de interfaz (default 1) y desempata el mayor **router-id** (OSPF). Con `router-id` explícito, controlás quién es el DR: en el lab, el de RID más alto del segmento.
</details>

**3. ¿Qué condición tiene que cumplir el camino B de Lab 3 para que `variance` lo deje balancear?**
<details>
<summary>Ver respuesta</summary>

Ser **feasible successor**: su Reported Distance (RD) debe ser MENOR que la Feasible Distance (FD) del sucesor (EIGRP). Si no cumple RD < FD, subir variance no lo mete — EIGRP lo descarta por no cumplir la condición de loop-free.
</details>

**4. En Lab 4, ¿qué pasa en R1 si R2 NO tiene `next-hop-self`?**
<details>
<summary>Ver respuesta</summary>

R1 hereda el next-hop del eBGP original (el router del ISP, R3) y no puede resolverlo (esa ruta no está en su tabla de rutas internas → BGP, regla 2). La ruta iBGP aparece "instalada" pero no usable; el ping al ISP falla desde R1 aunque la sesión esté ESTABLISHED.
</details>

**5. En el Proyecto Final, ¿por qué la redistribución OSPF↔EIGRP se hace con route-map en SOLO UNO de los sentidos?**
<details>
<summary>Ver respuesta</summary>

Para evitar el feedback loop (tema de redistribución): la ruta que sale del OSPF al EIGRP, y la que vuelve del EIGRP al OSPF, deben estar filtrando el retorno. El patrón sano: un sentido redistribuye TODO, el otro redistribuye filtrado (solo las rutas PROPIAS del otro lado). Si redistribuís ambos sentidos completos, las rutas vuelven eternamente.
</details>

**6. ¿Cuál es la fase del plan que NO se puede saltear y por qué?**
<details>
<summary>Ver respuesta</summary>

La Fase A (direccionamiento completo primero). Sin IPs no hay interfaz que verificar, ni IGP que levante, ni BGP que peeree — y el troubleshooting sin línea base es imposible (troubleshooting, pregunta 1 del árbol de diagnóstico).
</details>

**7. La prueba #8 de la matriz: ¿por qué es la que define la aprobación?**
<details>
<summary>Ver respuesta</summary>

Porque detecta el feedback loop de redistribución: una ruta que "late" (cambia entre protocolos/AD en dos `show ip route` seguidos) es inestabilidad real que en producción significa flapping, CPU al máximo y usuarios que pierden conexión. Un proyecto sin esta prueba puede "andar" en el simulador y romper todo en producción.
</details>

---

## 10. Glosario

| Término | Qué es |
|---------|--------|
| **Floating static** | Estática de respaldo con AD mayor (tema de rutas estáticas): solo actúa si la principal cae |
| **ECMP** | Equal-Cost Multi-Path: varias rutas con misma AD y métrica balancean (selección de rutas) |
| **DR/BDR** | Designated/Backup Designated Router de OSPF en segmentos multipunto (OSPF) |
| **ABR** | Area Border Router: router OSPF en dos áreas (OSPF avanzado) |
| **Variance** | Multiplicador EIGRP que habilita el balanceo desigual (EIGRP) |
| **Named mode** | Forma moderna de configurar EIGRP (modo AF de EIGRP) |
| **Next-hop-self** | Fuerza en iBGP que el next-hop sea el router de borde (BGP) |
| **Feedback loop** | Bucle de redistribución: rutas que van y vuelven entre protocolos (redistribución) |
| **Route-map** | Filtro + modificación de rutas; el control de toda redistribución (redistribución) |
| **Matriz de verificación** | Lista de pruebas con comando y resultado esperado (troubleshooting, aplicado) |

---

## 11. Resumen en 10 puntos

1. **Este manual es el examen PRÁCTICO de la serie**: Labs 1-4 repasan la teoría; el Proyecto Final la integra.
2. **Lab 1 = rutas estáticas y selección**: floating static (AD 5 vs 10) y ECMP; la prueba de fuego es apagar un enlace.
3. **Lab 2 = OSPF**: OSPF multiárea, DR/BDR controlado por router-id, sumarización en el ABR.
4. **Lab 3 = EIGRP**: variance con la condición RD < FD, y EIGRPv6 con la trampa del `no shutdown`.
5. **Lab 4 = BGP**: eBGP + iBGP, next-hop-self y ebgp-multihop; ESTABLISHED con prefijos.
6. **El Proyecto Final usa TODO**: EIGRP de núcleo, OSPF por sucursal, BGP al ISP, redistribución filtrada.
7. **El orden de armado es parte del lab**: cada fase se verifica antes de la siguiente; el error queda acotado.
8. **La redistribución con filtro es innegociable**: un solo sentido completo y el otro filtrado (o feedback loop).
9. **La matriz de 10 pruebas evalúa el proyecto**: la #8 (sin flapping) define la aprobación.
10. **Entregás evidencia, no promesas**: salidas reales de cada prueba + configs exportadas + la defensa de por qué tu diseño no genera bucles.

---

> **Fuente:** Documentación propia basada en CCNA 200-301 Official Cert Guide (W. Odom), Cisco Networking Academy (Packet Tracer), RFC 2328 (OSPFv2), RFC 4271 (BGP-4) y material educativo de redes. Proyecto final diseñado como integración pedagógica de toda la serie.
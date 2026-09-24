# 39. OSPFv3: el Estado de Enlace para IPv6

**El mismo protocolo, rediseñado para un mundo de direcciones de 128 bits (y sin los amarres de IPv4)**

---

## Índice

- [El futuro que ya llegó: por qué IPv6 no es opcional](#1-el-futuro-que-ya-llegó-por-qué-ipv6-no-es-opcional)
- [Los 5 minutos de IPv6 que necesitás antes de OSPFv3](#2-los-5-minutos-de-ipv6-que-necesitás-antes-de-ospfv3)
- [OSPFv3 vs OSPFv2: la nueva máquina](#3-ospfv3-vs-ospfv2-la-nueva-máquina)
- [Las novedades de verdad: LSA, direcciones y el protocolo en sí](#4-las-novedades-de-verdad-lsa-direcciones-y-el-protocolo-en-sí)
- [El router ID y los procesos: la herencia](#5-el-router-id-y-los-procesos-la-herencia)
- [Configuración: OSPFv3 en 10 minutos](#6-configuración-ospfv3-en-10-minutos)
- [Verificación: cómo preguntarle a la red](#7-verificación-cómo-preguntarle-a-la-red)
- [OSPFv3 con address families: el truco de los dos protocolos en uno](#8-ospfv3-con-address-families-el-truco-de-los-dos-protocolos-en-uno)
- [Los 5 errores más comunes (diagnóstico)](#9-los-5-errores-más-comunes-diagnóstico)
- [La hoja de ruta: OSPFv3 en el mundo real](#10-la-hoja-de-ruta-ospfv3-en-el-mundo-real)
- [Comprobá lo que aprendiste](#11-comprobá-lo-que-aprendiste)
- [Glosario](#12-glosario)
- [Resumen en 10 puntos](#13-resumen-en-10-puntos)

---

## 1. El futuro que ya llegó: por qué IPv6 no es opcional

Las direcciones IPv4 se agotaron. No es teoría de manual: los bloques nuevos ya no se asignan hace años, y las redes del mundo conviven con NAT (el porqué ya lo viste en su tema) para estirar la vida de IPv4. Pero NAT tiene su costo: destruye el modelo "una identidad por equipo", complica la transparencia de las aplicaciones y es un dolor en redes punto a punto (¡y en juegos online!).

> **IPv6 resuelve el problema de raíz:** 340 sextillones de direcciones (3,4 × 10^38), de las cuales la Tierra no va a agotar ni un porcentaje ridículo. Y con eso viene **OSPFv3**: el protocolo de estado de enlace, rediseñado para el mundo de 128 bits.

**La promesa de este manual:** si dominás OSPFv2, el 90% del conocimiento se **transfiere tal cual** a OSPFv3: mismas vecindades, mismos estados, mismo DR/BDR, mismas áreas, mismo SPF de Dijkstra. Lo que CAMBIA es la parte "dirección específica" — y ese cambio es la arquitectura (y la elegancia) de OSPFv3.

> **Analogía:** OSPFv2 y OSPFv3 son como el mismo sistema de transporte de una ciudad, con dos tipos de vehículos: v2 reparte con la vieja moto de 2 cilindros que solo conoce calles numeradas hasta 32 bits; v3 es el camión nuevo que navega calles de 128 bits. Mismas reglas de tránsito, mismo mapa (LSDB), mismo GPS (SPF): cambia el vehículo y las calles.

---

## 2. Los 5 minutos de IPv6 que necesitás antes de OSPFv3

### 2.1. La dirección: 128 bits, 8 grupos

```text
2001:0db8:85a3:0000:0000:8a2e:0370:7334
└──┬──────────────────────────────────┴───┘
   8 grupos de 4 dígitos hexadecimales (16 bits cada uno)
```

**Reglas de abreviación (las que todos necesitan):**

```text
1. Podés omitir CEROS LÍDERES en cada grupo:
   2001:0db8:85a3:0000 → 2001:db8:85a3:0
2. UNA sola vez, podés reemplazar un bloque de grupos 0 por "::":
   2001:db8:0:0:0:0:0:1 → 2001:db8::1
3. Ojo: "::" se usa UNA vez (si hay 2 bloques de ceros, el router no sabe cuánto mide cada uno)
```

> **HACELO VOS (el truco de la longitud):** una dirección IPv6 "abreviada" apunta a 128 bits totales: contá 4 dígitos hex por grupo (16 bits), y el `::` "tapona" lo que falta. `2001:db8::1` = 2001:0db8:0000:0000:0000:0000:0000:0001. Aprendé a expandir, no a truncar.

### 2.2. El prefijo: el mismo LPM que en IPv4

```text
2001:0db8:85a3::/48
                   └─ 48 = longitud del prefijo (red), el resto = el host

/64  → el estándar de subred IPv6 (suficientes direcciones para "todo")
/48  → el bloque típico que asigna un proveedor a una empresa
/128 → UNA dirección exacta (como el host en IPv4, pero "exacto")
```

Y lo importante de la selección de rutas sigue vigente: la tabla de rutas IPv6 usa **LPM** (longest prefix match) igual que IPv4. `2001:db8:1::/64` gana sobre `2001:db8::/48` para un destino dentro de `2001:db8:1::/64`. Nada cambia en el cerebro de las rutas: cambia el tamaño de los números.

### 2.3. Los tres tipos de direcciones que vas a ver en OSPFv3

| Tipo | Ejemplo | Uso |
|------|---------|-----|
| **Link-local** | `fe80::1` (siempre `fe80::/10`) | Sólo en el enlace local: **OSPFv3 usa estas para los vecinos y los Hells** |
| **Global** | `2001:db8:1::1` (rutas globales) | La "pública" IPv6 — lo que se anuncia y se enruta |
| **Multicast** | `ff02::5` (todos los routers OSPF) `ff02::6` (DR/BDR) | La versión IPv6 de 224.0.0.5/6 |

> **El dato que desbloquea OSPFv3:** los Hells y las vecindades se arman por **link-local** (`fe80::`), no por la global. El vecino OSPFv3 se identifica por su link-local + su Router ID. Eso te va a parecer raro al principio (¿y la global dónde está?), pero es el diseño limpio de OSPFv3 — vas a ver por qué en la sección 4.

---

## 3. OSPFv3 vs OSPFv2: la nueva máquina

### 3.1. Lo que NO cambia (el 80% que ya sabés)

| Pieza | OSPFv2 | OSPFv3 |
|-------|--------|--------|
| Familia | Estado de enlace | Estado de enlace |
| AD | 110 | **110** |
| Métrica | Costo | Costo |
| SPF / Dijkstra | Sí | Sí |
| Vecindades y estados | Down…Full | Down…Full |
| Hello / Dead | 10 / 40 s | **10 / 40 s** |
| DR/BDR en broadcast | Sí | Sí |
| Áreas + área 0 | Sí | Sí |
| ABR / ASBR / stubs / NSSA | Sí | Sí |

### 3.2. Lo que SÍ cambia (las tres diferencias de arquitectura)

| Cambio | OSPFv2 | OSPFv3 |
|--------|--------|--------|
| **1. Procesos por familia** | Un proceso OSPF para IPv4 | Proceso OSPF por **address family** (IPv4 O/IPv6) — seccion 8 |
| **2. Los LSA llevan direcciones?** | El LSA tipo 1 llevaba las IPs dentro | Los LSA **ya no llevan direcciones adentro**: el *prefix* se anuncia con LSA separado (tipo 8/9) |
| **3. Vecinos por link-local** | Vector con la IP global/específica | Vecinos y Hells **solo por link-local** (`fe80::`) |
| **4. Instancias** | Protocolo 89 directo | Protocolo 89 + **instance ID** (múltiples OSPFv3 en el mismo enlace) |

> **La realización que separa a los que entienden:** OSPFv3 fue diseñado para ser **agnóstico de la dirección** (RFC 2740/5340). Por eso separó "el mapa de routers" (T1/T2 con interface IDs) del "mapa de direcciones" (LSA de prefijos). Ese diseño es lo que permite que el MISMO proceso OSPFv3 pueda correr IPv4 e IPv6 a la vez. OSPFv2 era "el protocolo + IPv4 pegados con fideos"; OSPFv3 es "protocolo por un lado, direcciones por otro".

---

## 4. Las novedades de verdad: LSA, direcciones y el protocolo en sí

### 4.1. Los LSA de OSPFv3 (los tipos que cambian la tabla)

La tabla de tipos de OSPF avanzado se **adapta al diseño agnóstico**:

```text
Tipo 1 (Router)        → igual idea: las interfaces del router (con IDs, sin IPs)
Tipo 2 (Network)       → igual idea: el segmento (¿quién es el DR?, sin IPs)
Tipo 3 (Inter-area)    → prefijos resumidos entre áreas
Tipo 4 (ASBR)          → misma idea: cómo llegar al ASBR
Tipo 5 (External)      → prefijos de fuera de OSPF (redistribución)
Tipo 8 (Link-local)    → NUEVO: prefijo link-local del enlace (fe80)
Tipo 9 (Intra-area-Prefix) → NUEVO: los prefijos DENTRO del área ("esto va con el T1/T2 de quién")
```

> **La regla mental (el patrón de oro):** en OSPFv3, el T1 te dice "tal router tiene las interfaces 1, 2, 3"; el **T9** te dice "y esas interfaces tienen estos prefijos". Mismo mapa, dos capas: la capa de routers y la capa de direcciones. Por eso cuando una subred IPv6 cambia, solo se regenera el **T9** (no todo el árbol SPF).

### 4.2. El Router ID: el DNI que se hereda

OSPFv3 necesita un **Router ID igual de 32 bits**, y lo toma... ¡de IPv4! (si existe):

```text
Router ID 1.1.1.1
      │
      ├── En OSPFv2: identifica al router en el mundo IPv4
      └── En OSPFv3: identifica al router en el mundo IPv6
          (aunque no haya IPv4 en el router, el RID es un número de 32 bits — se configura igual)
```

> **El detalle que confunde en el 90% de los labs:** si el router NO tiene IPv4 y no configuraste `router-id`, OSPFv3 NO arranca y te grita "Router ID is not configured". El RID es obligatorio en OSPFv3 (a diferencia de v2, que "eligía solito"). Por eso la receta de la sección 6 SIEMPRE empieza con `router-id`.

### 4.3. Instancias: varios OSPFv3 en un mismo enlace

OSPFv3 agrega un **instance ID** al protocolo 89 (por ejemplo `ipv6 ospf 1 area 0 instance 5`). Sirve para correr múltiples procesos OSPFv3 independientes sobre el mismo segmento físico (redes MPLS, VPNs, separación lógica). Es avanzado — para CCNA alcanza con saber que existe y que los Hells llevan el instance: si dos routers tienen instancias distintas, no se ven.

---

## 5. El router ID y los procesos: la herencia

### 5.1. La regla de plata de OSPF (v2 o v3)

Ya la pusiste en práctica con OSPF y aplica igual acá:

> **`router-id` SIEMPRE explícito.** RID duplicado = caos en la LSDB, adyacencias que bailan. Configurá `router-id 1.1.1.1` / `2.2.2.2` / `3.3.3.3`... y si lo cambiás despuéreas config, reiniciá con `clear ipv6 ospf process` o reiniciá el proceso.

### 5.2. Dos procesos en un mismo router

Con "address families" (sección 8) un router puede tener OSPFv2 (IPv4) Y OSPFv3 (IPv6) **al mismo tiempo** — son dos procesos independientes, cada uno con su propia LSDB, su propio SPF y su propia tabla:

```text
  R1
  ├── proceso OSPFv2 (protocolo 89, IPv4)  → tabla IPv4 (rutas O)
  └── proceso OSPFv3 (protocolo 89, IPv6)  → tabla IPv6 (rutas OI/O)
         ↑ cada uno con su router-id, sus áreas, sus timers
```

Es la norma en redes de transición (IPv4 + IPv6 conviviendo): los dos procesos no se pelean, no comparten LSDB, no se redistribuyen entre sí salvo que se los pidas. Conviven en paz porque el diseño agnóstico de v3 lo permite limpio.

---

## 6. Configuración: OSPFv3 en 10 minutos

### 6.1. La topología (la misma de OSPFv2, en IPv6)

```text
  R1 ──── 2001:db8:0:1::/64 ──── R2 ──── 2001:db8:0:2::/64 ──── R3
  .1                           .2        .1                     .2
lo0 2001:db8:1::1/128      lo0 2001:db8:2::2/128        lo0 2001:db8:3::3/128
RID 1.1.1.1               RID 2.2.2.2                  RID 3.3.3.3
```

### 6.2. La configuración (completa, versión clásica)

```cisco
! R1 — activá IPv6 en las interfaces y OSPFv3 con router-id
ipv6 unicast-routing                      ! habilita el forwarding IPv6 en el router
!
interface loopback 0
 ipv6 address 2001:db8:1::1/128
 ipv6 ospf 1 area 0
!
interface GigabitEthernet0/0
 ipv6 address 2001:db8:0:1::1/64
 ipv6 ospf 1 area 0
 ipv6 ospf 1 ! ← acá, el proceso OSPFv3 y el área se aplican POR INTERFAZ
!
router ospf 1
 router-id 1.1.1.1
```

```cisco
! R2 (mismo patrón, dos interfaces)
ipv6 unicast-routing
!
interface loopback 0
 ipv6 address 2001:db8:2::2/128
 ipv6 ospf 1 area 0
!
interface GigabitEthernet0/0
 ipv6 address 2001:db8:0:1::2/64
 ipv6 ospf 1 area 0
!
interface GigabitEthernet0/1
 ipv6 address 2001:db8:0:2::1/64
 ipv6 ospf 1 area 0
!
router ospf 1
 router-id 2.2.2.2
```

```cisco
! R3
ipv6 unicast-routing
!
interface loopback 0
 ipv6 address 2001:db8:3::3/128
 ipv6 ospf 1 area 0
!
interface GigabitEthernet0/0
 ipv6 address 2001:db8:0:2::2/64
 ipv6 ospf 1 area 0
!
router ospf 1
 router-id 3.3.3.3
```

### 6.3. La sintaxis explicada (comparada con v2)

| Paso | OSPFv2 (`network ... area`) | OSPFv3 (`interface`) |
|------|----------------------------|----------------------|
| Arrancar el proceso | `router ospf 1` | `router ospf 1` |
| RID | `router-id X.X.X.X` | `router-id X.X.X.X` |
| Meter la interfaz al área | `network 10.0.0.0 0.0.0.3 area 0` (global) | `ipv6 ospf 1 area 0` (interface) |
| Habilitar IPv6 en el router | (no aplica) | `ipv6 unicast-routing` (global) |

> **La diferencia de filosofía en una línea:** OSPFv2 te hace matchear por `network` (configuración global); **OSPFv3 es config en la interfaz** (`ipv6 ospf 1 area 0`). Más directo, sin wildcard ni máscara inversa: el router mira la interfaz y dice "esta interfaz está en el área 0 del proceso 1".

---

## 7. Verificación: cómo preguntarle a la red

### 7.1. El par de comandos que ves siempre

```text
R1# show ipv6 ospf neighbor

Neighbor ID     Pri   State           Dead Time   Interface ID    Interface
2.2.2.2           1   FULL/DR         00:00:39     5              GigabitEthernet0/0

R1# show ipv6 route ospf

OI  2001:db8:0:2::/64 [110/2]
     via FE80::1, GigabitEthernet0/0          ← ¡el next-hop es LINK-LOCAL!
O   2001:db8:3::3/128 [110/3]
     via FE80::1, GigabitEthernet0/0
```

Fijate en dos detalles que son la firma de OSPFv3:

```text
OI → rutas inter-área (con multi-área, el OI aparece como en v2)
via FE80::1 → el next-hop es la link-local del vecino (¡no la global!)
```

> **El "ahá" de la verificación:** en IPv6, el next-hop de las rutas OSPFv3 es la **dirección link-local** del vecino, no su global. Por eso aprendiste el fe80:: en la sección 2 — sin link-local no hay vecino, y sin vecino no hay ruta. La link-local es el "número de interno" del router en ese enlace; la global es la "dirección pública" para alcanzarlo de afuera.

### 7.2. La batería completa (el ritual del nivel senior)

```text
show ipv6 ospf neighbor          → ¿FULL? ¿DR/BDR?
show ipv6 ospf interface Gi0/0   → área, timers, costo, tipo de red, instance
show ipv6 route ospf             → las rutas O/OI con next-hop link-local
show ipv6 protocols              → el resumen del proceso (RID, áreas, sources)
debug ipv6 ospf adj              → el útimo recurso (vecindades en vivo)
```

---

## 8. OSPFv3 con address families: el truco de los dos protocolos en uno

### 8.1. La configuración AF (una sola, la completa)

OSPFv3 "address families" permite **un solo proceso con dos familias**: la IPv4 y la IPv6. En vez de dos procesos, un proceso con dos familias (esto es lo que ves en los exámenes modernos y en Packet Tracer 8+):

```cisco
router ospfv3 1
 router-id 1.1.1.1
 !
 address-family ipv6 unicast
  exit-address-family
 !
 address-family ipv4 unicast
  exit-address-family
!
interface GigabitEthernet0/0
 ipv6 address 2001:db8:0:1::1/64
 ip address 10.0.0.1 255.255.255.252
 ospfv3 1 ipv6 area 0
 ospfv3 1 ipv4 area 0
```

> **El porqué (sube el telón):** OSPFv3 está diseñado "agnóstico de dirección", así que el MISMO proceso puede servir a IPv4 e IPv6 a la vez. En entornos de **doble pila** (IPv4 + IPv6 conviviendo), una sola config, un solo RID, un solo juego de áreas, y ambas tablas se pueblan. Es la forma moderna de hacer OSPF — y la que vas a ver en producción.

### 8.2. Los comandos de verificación para AF

```text
show ospfv3 neighbor
show ospfv3 ipv6 database
show ospfv3 ipv4 route ospf
```

Los mismos rituales, con el prefijo `ospfv3` y la familia explícita. No hay magia nueva: es la misma máquina, con dos puertas (ipv4 / ipv6).

---

## 9. Los 5 errores más comunes (diagnóstico)

| # | Error | Síntoma | Fix |
|---|-------|---------|-----|
| 1 | **Falta `ipv6 unicast-routing`** | IPv6 ni enruta ni OSPFv3 arranca | `ipv6 unicast-routing` global, PUNTO |
| 2 | **Falta `router-id`** | OSPFv3 no levanta ("Router ID is not configured") | Configurá `router-id X.X.X.X` antes de activar las interfaces |
| 3 | **Link-local ausente** (interfaz sin IPv6) | No hay Hells, vecino Down | Toda interfaz con `ipv6 address` genera su fe80:: automáticamente; sin IPv6 no hay vecino |
| 4 | **Instance distinto / área distinta** | Hells que se cruzan y no forman vecindad | Misma `area` y mismo `instance` en ambos extremos |
| 5 | **Confundir v2 con v3** (`network` en v3) | Comando no existe / interfaz fuera del proceso | En v3 la config es por interfaz: `ipv6 ospf 1 area 0`, no `network` |

> **El caso #1 es el más traicionero:** sin `ipv6 unicast-routing`, el router NO REENVÍA paquetes IPv6: ni rutas propias, ni vecinos, ni ping de un lado al otro. Es el equivalente IPv6 de "el chip de enrutamiento apagado". Se configura una sola vez por router y te olvidas… hasta que migrás una config y no está.

---

## 10. La hoja de ruta: OSPFv3 en el mundo real

### 10.1. ¿Cuándo aparece OSPFv3 en la calle?

| Escenario | Por qué OSPFv3 |
|-----------|----------------|
| Redes nuevas enteras en IPv6 | El protocolo pensado para el futuro: único camino NAT-free |
| Doble pila (IPv4+IPv6 juntos) | AF en un solo proceso (sección 8) |
| Grandes proveedores (ISP) | IS-IS convive, pero OSPFv3 es estándar abierto |
| Empresas con direccionamiento IPv6 | La red interna ya no puede esperar más |

### 10.2. La transición no es binaria

No es "todos IPv6 mañana": es **doble pila** mientras migra. Y en la doble pila, OSPFv2 (o AF ipv4) y OSPFv3 (o AF ipv6) conviven: el tráfico IPv4 sigue su camino, el IPv6 el suyo, y las tablas se resuelven por separado. El día que IPv4 se apague, OSPFv2 se retira y queda v3 solo (o el AF ipv6). Por eso los dos temas (OSPF y OSPFv3/IPv6) son complementarios, no opcionales.

> **La frase para el examen y para la vida:** "OSPFv3 no es OSPFv2 con IPs más largas: es el protocolo de estado de enlace **rediseñado para ser independiente del tipo de dirección**, y por eso puede servir a IPv4 y IPv6 a la vez." Si podés decir eso con seguridad, ya entendiste la arquitectura.

---

## 11. Comprobá lo que aprendiste

**1. ¿Cuál es la diferencia de filosofía entre OSPFv2 y OSPFv3?**
<details>
<summary>Ver respuesta</summary>

OSPFv2 tenía las direcciones "pegadas" al protocolo (los LSA llevaban IPs IPv4 adentro). OSPFv3 se rediseñó **agnóstico de dirección**: el mapa de routers (T1/T2, sin IPs) y el mapa de prefijos (T8/T9) van separados. Eso permite un solo proceso sirviendo IPv4 e IPv6 (address families) y cambios de prefijo sin regenerar todo el SPF.
</details>

**2. ¿Qué dirección usan los Hells y las vecindades OSPFv3?**
<details>
<summary>Ver respuesta</summary>

La **link-local** (fe80::/10) de cada interfaz. Por eso el next-hop de las rutas OSPFv3 es siempre una direccion fe80::, y por eso sin IPv6 activa en la interfaz no hay vecino.
</details>

**3. ¿Qué pasa si no configurás `router-id` en OSPFv3?**
<details>
<summary>Ver respuesta</summary>

OSPFv3 NO levanta y te lo dice: "Router ID is not configured". A diferencia de v2 (que elegía solo), en v3 el RID es obligatorio (igual de 32 bits). Configurarlo siempre explícito, como en v2.
</details>

**4. ¿Qué comando habilita el reenvío IPv6 en el router y por qué es crítico?**
<details>
<summary>Ver respuesta</summary>

`ipv6 unicast-routing` (global). Sin él, el router no reenvía paquetes IPv6: no hay rutas, no hay vecinos OSPFv3, no hay ping. Es la llave de encendido del enrutamiento IPv6.
</details>

**5. ¿Cómo se configura OSPFv3 (vs el `network` de v2)?**
<details>
<summary>Ver respuesta</summary>

Por interfaz: `ipv6 ospf 1 area 0` sobre cada interfaz que participa (más la loopback). No hay wildcard ni máscara inversa: el proceso y el área se aplican directamente en la interfaz. Incluso se puede activar v4/v6 en la misma interfaz con `ospfv3 1 ipv4 area 0` / `ospfv3 1 ipv6 area 0`.
</details>

**6. ¿Qué LSA son nuevos en OSPFv3 y qué resuelven?**
<details>
<summary>Ver respuesta</summary>

El tipo 8 (prefijos link-local) y el tipo 9 (intra-area-prefix). El T9 separa "los prefijos de una interfaz" del T1 que describe la topología: así cambiar un prefijo solo regenera T9, no todo el árbol SPF.
</details>

**7. ¿Qué es la doble pila en el contexto OSPF?**
<details>
<summary>Ver respuesta</summary>

IPv4 e IPv6 conviviendo en el mismo router y la misma red: OSPFv2 (o AF ipv4) llena la tabla IPv4 y OSPFv3 (o AF ipv6) la de IPv6. Dos procesos (o dos familias de un mismo proceso) independientes que no comparten LSDB.
</details>

**8. ¿Por qué el next-hop de una ruta OSPFv3 es fe80:: y no la dirección global?**
<details>
<summary>Ver respuesta</summary>

Porque la vecindad se mantiene por link-local: el vecino "vive" en su fe80:: dentro de ese enlace. La global no es necesaria para el forwarding local — la link-local es suficiente y más estable (no cambia si se renumera la global).
</details>

---

## 12. Glosario

| Término | Qué es |
|---------|--------|
| **IPv6** | Esquema de direcciones de 128 bits (8 grupos hex); reemplaza a IPv4 agotada |
| **Link-local** | Dirección IPv6 `fe80::/10` válida solo en el enlace; base de Hells y next-hops OSPFv3 |
| **Global address** | Dirección IPv6 pública/global (`2001:db8::/32` en ejemplos); lo que se anuncia |
| **OSPFv3** | OSPF rediseñado (RFC 2740/5340): agnóstico de dirección, config por interfaz, LSA separados |
| **Address family (AF)** | Modo en que UN proceso OSPFv3 sirve a IPv4 e IPv6 (`address-family ipv4/ipv6 unicast`) |
| **Instance ID** | Identificador de proceso OSPFv3 dentro del protocolo 89 (instancias en un enlace) |
| **Router ID** | 32 bits obligatorios en v3 (igual que v2); identifica al router en la LSDB |
| **Tipo 8 / Tipo 9** | Link-local prefixes y Intra-area-prefix: los LSA nuevos de OSPFv3 |
| **`ipv6 unicast-routing`** | Llave global que habilita el reenvío IPv6 en el router |
| **Doble pila** | IPv4 + IPv6 simultáneos; v2 y v3 conviviendo en el mismo router |

---

## 13. Resumen en 10 puntos

1. **IPv6 llegó para quedarse** (IPv4 agotada) y con él OSPFv3: el estado de enlace rediseñado, no "v2 con IPs más largas".
2. **La dirección es 128 bits** en 8 grupos hex; el prefijo (`/64`, `/48`, `/128`) maneja el mismo LPM que en IPv4.
3. **OSPFv3 conserva TODO lo que sabés**: AD 110, costo, SPF, vecindades Down→Full, DR/BDR, áreas, área 0 obligatoria.
4. **La diferencia de diseño**: LSA sin direcciones adentro + prefijos en LSA separados (T8/T9) = protocolo agnóstico de dirección.
5. **Vecinos y next-hops viven en la link-local** (`fe80::`): sin IPv6 en la interfaz, no hay vecino ni ruta.
6. **El RID es obligatorio en v3** (32 bits igual que v2): sin `router-id`, OSPFv3 no arranca.
7. **Config por interfaz**: `ipv6 ospf 1 area 0` — sin `network` ni wildcard; y `ipv6 unicast-routing` global para encender el enrutamiento.
8. **Address families**: un solo proceso OSPFv3 con `ipv4 unicast` e `ipv6 unicast` = el protocolo sirviendo a ambas familias (doble pila).
9. **Verificación**: `show ipv6 ospf neighbor` (FULL/DR), `show ipv6 route ospf` (next-hop fe80::), `show ipv6 protocols` (RID/áreas).
10. **Los 2 errores campeones**: olvidar `ipv6 unicast-routing` y olvidar el `router-id`. Configurá ambos primero y la red se enciende sola.

---

> **Fuente:** Documentación propia basada en RFC 2740 (OSPFv3, reemplazada por RFC 5340), RFC 4291 (IPv6 addressing), CCNA 200-301 Official Cert Guide (W. Odom), Cisco IOS Configuration Guides y material educativo de redes.
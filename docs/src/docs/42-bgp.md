# 42. BGP: El Pegamento de Internet

**El protocolo que decide cómo viaja el tráfico entre sistemas autónomos — donde la política vale más que la velocidad**

---

## Índice

- [El protocolo que no vive en tu red](#1-el-protocolo-que-no-vive-en-tu-red)
- [Los sistemas autónomos: el mapa político de Internet](#2-los-sistemas-autónomos-el-mapa-político-de-internet)
- [Path Vector: la familia nueva](#3-path-vector-la-familia-nueva)
- [eBGP e iBGP: las dos caras de BGP](#4-ebgp-e-ibgp-las-dos-caras-de-bgp)
- [Los atributos: la moneda de la política](#5-los-atributos-la-moneda-de-la-política)
- [El algoritmo de selección de camino (en orden)](#6-el-algoritmo-de-selección-de-camino-en-orden)
- [Las 3 reglas de iBGP que rompen cabezas](#7-las-3-reglas-de-ibgp-que-rompen-cabezas)
- [Configuración: eBGP e iBGP en 10 minutos](#8-configuración-ebgp-e-ibgp-en-10-minutos)
- [¿Por qué no usar BGP para todo? El caso de uso honesto](#9-por-qué-no-usar-bgp-para-todo-el-caso-de-uso-honesto)
- [Verificación: cómo leer a BGP](#10-verificación-cómo-leer-a-bgp)
- [Los 5 errores más comunes](#11-los-5-errores-más-comunes)
- [Comprobá lo que aprendiste](#12-comprobá-lo-que-aprendiste)
- [Glosario](#13-glosario)
- [Resumen en 10 puntos](#14-resumen-en-10-puntos)

---

## 1. El protocolo que no vive en tu red

Hasta acá, todos los protocolos que estudiaste (OSPF, EIGRP, IS-IS) son de **red interna**: deciden cómo viaja el tráfico DENTRO de una organización. Ahora llega el que vive en la frontera: **BGP** (*Border Gateway Protocol*).

> **BGP es el protocolo de routing de Internet.** Cuando tu casa navega, el tráfico atraviesa un puñado de redes de proveedores (ISP) que "hablan" BGP entre sí. BGP no decide "cuál es el camino más rápido": decide **cuál es el camino MÁS APROPIADO según las reglas políticas y comerciales** de cada red. Es dinero, contratos y soberanía técnica convertidos en un protocolo.

**Analogía madre de este manual:** OSPF elige la ruta como un GPS (más corta, más rápida). BGP elige la ruta como una **decisión de tráfico internacional**: "¿por qué país hago pasar la mercadería?" — por acuerdos comerciales, por seguridad, por a quién le pago y a quién no. La métrica "más rápido" es secundaria: gana "por dónde me conviene".

> **La frase que hay que memorizar (y entender):** OSPF/EIGRP/IS-IS eligen por **métrica de red**; BGP elige por **política**. BGP no calcula el camino más corto: ejecuta las reglas del administrador de cada sistema autónomo.

---

## 2. Los sistemas autónomos: el mapa político de Internet

### 2.1. ¿Qué es un AS?

Un **Sistema Autónomo (AS)** es un conjunto de redes (routers) bajo **una sola administración técnica** — una empresa, un ISP, un organismo — con una **política de routing única** y un **número identificatorio (ASN)**.

```text
             AS65001 (tu empresa)                 AS65002 (el ISP)
     ┌─────────────────────────┐         ┌─────────────────────────┐
     │   R1 ── R2 ── R3        │         │  R4 ── R5 ── R6         │
     │      (OSPF interno)     │         │     (IS-IS interno)     │
     │         │    │          │         │          │              │
     └─────────┼────┼──────────┘         └──────────┼──────────────┘
               │    │        ◄──BGP──►              │
               └────┴────  (frontera eBGP)  ────────┘
```

Datos fundamentales:

| Dato | Valor |
|------|-------|
| ASN público | 1 - 64511 (registrados, únicos en Internet, por RIR) |
| ASN privado | **64512 - 65535** (para uso interno, como las IPs privadas que ya conocés) |
| Quién asigna | Los RIR (ARIN, RIPE, LACNIC...) |

> **La regla de oro (el "interior vs exterior" que ordena todo):** **BGP = entre sistemas autónomos (inter-AS)**. **OSPF/EIGRP/IS-IS = dentro de un sistema autónomo (intra-AS)**. Hasta podés ver un ISP usando IS-IS *adentro* de su AS y BGP *entre* los AS. Son capas distintas, no competidores excluyentes.

---

## 3. Path Vector: la familia nueva

En el tema de enrutamiento dinámico viste las dos familias (DV y LS). BGP es la **tercera familia**: **path vector** (vector de caminos).

| Familia | Qué guarda | Ejemplo |
|---------|-----------|---------|
| Distance Vector | destino + distancia (rumor) | RIP |
| Link-State | mapa completo (LSA/LSP + SPF) | OSPF, IS-IS |
| **Path Vector** | **la lista COMPLETA de AS por los que pasa el camino** | **BGP** |

```text
Camino hacia 203.0.113.0/24:
AS-PATH = 65001 65002 65010      ← la "cadena" de AS que atraviesa el anuncio
                                 (es el "vector" de actores del camino)
```

**La potencia de la lista:** con el AS-PATH completo, BGP puede:

1. **Detectar bucles al instante**: si un anuncio vuelve conteniendo TU AS, lo descartás (lo anunciaste vos). Sin rumores, sin contar hasta 16: la lista física del viaje.
2. **Aplicar política por actor**: "si el camino pasa por el AS 65010, no lo quiero" — un solo atributo de lista habilita política sin precedentes.
3. **Evaluar "qué tan directo"**: menos AS en la lista suele preferir caminos más directos (regla 4 del path selection).

> **Analogía:** el AS-PATH es la **etiqueta de origen del viaje**: "Hecho en China; transitó: Argentina, Brasil, París...". Cada actor que toca el producto le suma su nombre. Si la etiqueta vuelve al país de origen, el paquete se descarta (está en bucle). Y el comprador puede decidir por etiqueta: "si pasa por X, no lo quiero".

---

## 4. eBGP e iBGP: las dos caras de BGP

BGP tiene dos modalidades según QUIÉN es el peer:

```text
eBGP = BGP entre AS DISTINTOS   (vecino con remote-as ≠ el mío)
iBGP = BGP dentro del MISMO AS  (vecino con remote-as = el mío)
```

| Característica | eBGP | iBGP |
|----------------|------|------|
| Vecino (peer) | En otro AS | En mi propio AS |
| Distancia (AD) | **20** | **200** |
| Next-hop | Cambia (el router de borde vecino) | **NO cambia** (se mantiene el next-hop del eBGP: por eso existe `next-hop-self`) |
| Loop prevention | AS-PATH (si tu AS aparece, descartás) | **Split horizon de iBGP** (no se re-anuncia una ruta aprendida por iBGP a OTRO iBGP — de ahí la regla de full mesh) |
| TTL en el salto | 1 por defecto (un solo salto) | 255 (multi-hop típicamente) |

> **Los AD que ya conocés de la tabla de selección de rutas:** eBGP 20 e iBGP 200. Ver `[20/0]` en la tabla de rutas = ruta BGP externa. Y nota la asimetría: el propio fabricante de BGP hace que lo externo (20, más confiable que todo lo interno) gane sobre iBGP (200, menos que RIP 120 y que EIGRP externo 170) — porque lo interno ya debería estar resuelto por OSPF/IS-IS adentro.

---

## 5. Los atributos: la moneda de la política

### 5.1. La tabla de los atributos que gobiernan

Cada ruta BGP viaja con sus **atributos**: metadatos que los routers usan para decidir a quién prefieren y qué anuncian. Los cuatro que importan (ordenados por la selección):

```text
WEIGHT (Cisco, solo local)   → "este camino me gusta, más alto mejor"
LOCAL_PREF (dentro del AS)   → "este camino le conviene a MI AS, más alto mejor"
AS_PATH (en todos los anuncios) → "cuánto viajó", MÁS CORTO mejor (y bucle si muestra mi AS)
MED (entra a mi AS)          → "el costo que el vecino sugiere para entrar", MÁS BAJO mejor
```

| Atributo | Ámbito | Preferencia | Analogía |
|----------|--------|-------------|----------|
| **Weight** | Solo este router (Cisco) | Mayor = mejor | "A mí me conviene este proveedor, punto" |
| **Local Preference** | Todo mi AS | Mayor = mejor | "A TODA la empresa le conviene salir por acá" |
| **AS-Path** | Global (en cada anuncio) | **Menor = mejor** | "Menos intermediarios = más directo" |
| **MED** | Entre vecinos externos | Menor = mejor | "Entrá por mi puerta A (barata) y no por la B" |
| Next-hop | Global | (se usa para reenviar) | "El siguiente salto físico" |

### 5.2. La clave conceptual (lo que nadie entiende al principio)

> **BGP no "mide" rutas: LAS NEGOCIA.** Cada atributo es una "seducción": el atributo dice "preferime". Weight dice "yo (router) prefiero"; Local-Pref dice "nosotros (AS) preferimos"; MED dice "el vecino me seduce con precio barato". El path selection (sección 6) es el orden de precedencia de esas seducciones. Nadie se come el mapa completo: se comen los atributos.

> **Analogía:** elegir proveedor de internet en tu casa: Weight = "mi máquina de gaming prefiere esta línea". Local-Pref = "en casa todos prefieren fibra". AS-Path = "fibra directa de Telefónica (1 intermediario) vs fibra con reventa (3 intermediarios)". MED = "el ISP A me ofrece más por menos". BGP pondera en ese orden y elige.

---

## 6. El algoritmo de selección de camino (en orden)

Cuando BGP tiene MÚLTIPLES caminos hacia el mismo prefijo, corre esta lista **en orden** — el primer empate desempatado gana, y el que rompe el empate decide:

```text
1.  Mayor WEIGHT (solo Cisco, local)          ← "yo prefiero"
2.  Mayor LOCAL_PREF                          ← "mi AS prefiere"
3.  Rutas ORIGINADAS por el propio router     ← "yo la generé"
4.  AS_PATH más CORTO                        ← "más directo"
5.  Menor ORIGIN (IGP < EGP < incomplete)     ← "de dónde salió"
6.  Menor MED                                ← "me seduce el precio"
7.  eBGP > iBGP                              ← "externa antes que interna"
8.  Menor costo IGP hacia el next-hop         ← "el enlace físico más barato"
9.  ... (desempates finales: RID, etc.)
```

> **HACELO VOS (la regla mnemotécnica del examen y de la vida):** recordá el **orden de acción**: "Weight y LocalPref primero (míos y de mi AS); después el AS-PATH; después el ORIGEN; después el MED". Y la dirección de la preferencia: **Weight/LocalPref = más alto gana; AS-Path = más corto gana; MED = más bajo gana.** Tres direcciones distintas, el 90% de los errores son confundir una con otra.

### 6.1. LocalPref vs MED: la confusión más cara de BGP (resuelta)

| Pregunta | Local-Pref | MED |
|----------|------------|-----|
| ¿Quién la usa? | **Mi** AS (para elegir SALIDA) | El **vecino** (para sugerir ENTRADA) |
| Dirección del tráfico | Tráfico que SALE | Tráfico que ENTRA |
| Valor preferido | Mayor mejor | Menor mejor |

> **La regla de pulgar:** querés que tu tráfico salga por X → subís LocalPref en X. Querés que los vecinos entren por X (y no por Y) → bajás MED en X (o lo subís en Y). Una controla la salida, la otra persuade la entrada. Nunca mezcles las dos cuando diagnostiques "¿por qué sale/entra por allá?".

---

## 7. Las 3 reglas de iBGP que rompen cabezas

Dentro de tu AS, iBGP tiene tres reglas que parecen arbitrarias... hasta que ves el motivo:

### 7.1. Regla 1: Full Mesh obligatorio (o route reflectors)

```text
Regla: lo que aprendo por iBGP NO se lo re-anuncio a otro peer iBGP.
       (splithorizon de iBGP: "el rumor no vuelve a circular dentro del AS")

Consecuencia: para que TODOS tengan todo, cada router iBGP debe ser vecino
de TODOS los demás → FULL MESH (N routers = N×(N-1)/2 sesiones)
```

¿Por qué existe la regla? Para **impedir bucles en un AS**: el AS-PATH no cambia dentro del AS (mismo AS), así que no sirve para detectar bucles internos. El splithorizon de iBGP es la protección: "lo que entró por iBGP no sale por iBGP" → no hay ciclos.

Cuando el full mesh explota (50 routers = 1.225 sesiones), se usan **Route Reflectors** (un RR "refleja" el rumor a sus clientes, centralizando el full mesh). Es un capítulo avanzado — para este manual alcanza con saber que existe la solución al problema del full mesh.

### 7.2. Regla 2: el next-hop NO cambia (y el `next-hop-self`)

En iBGP el next-hop **sigue siendo el del eBGP original**:

```text
R1 (borde, eBGP con el ISP) aprende 203.0.113.0/24 con next-hop = 198.51.100.2 (el ISP)
R1 se lo anuncia a R2 (iBGP): el next-hop sigue siendo 198.51.100.2 (NO cambia)
R2 necesita RESOLVER 198.51.100.2... fuera de su área/seciencia → por IGP interno
```

¿Por qué? Porque iBGP asume que "la ruta interna para llegar al borde la resuelve el IGP" (OSPF/IS-IS). Pero si R1 no redistribuye la red del next-hop... R2 no sabe cómo llegar. **La solución estándar: `neighbor X next-hop-self`** en el router de borde: fuerza a que el next-hop sea él mismo (R1), y R2 resuelve con el IGP.

### 7.3. Regla 3: la sincronización (legado — y la trampa de examen)

Históricamente, un router iBGP NO anunciaba a eBGP rutas iBGP-descubiertas si la ruta no estaba también en el IGP (evitaba "huecos negros" en redes viejas). Hoy, con el full mesh moderno y el next-hop-self, la regla de sincronización **está deshabilitada por defecto** y es irrelevante. Pero sigue apareciendo en exámenes viejos: sabé que existe, que se desactiva con `no synchronization`, y que en el 99% de las configs modernas ya está apagada.

---

## 8. Configuración: eBGP e iBGP en 10 minutos

### 8.1. La topología

```text
  AS65001 (tuyo)                    AS65002 (ISP)
  R1 ─────────── R2              R3 ─────────── R4
  lo0 1.1.1.1    │               │              lo0 4.4.4.4
     iBGP (R1-R2)│               │
                 └─ eBGP ────────┘
                 10.0.0.0/30     (R2 = 10.0.0.2, R3 = 10.0.0.3)
```

### 8.2. La configuración (los 4 pasos de oro)

```cisco
! R2 (el router de frontera de TU AS)
router bgp 65001
 bgp router-id 2.2.2.2
 neighbor 10.0.0.3 remote-as 65002          ! eBGP: el ISP (AS distinto)
 neighbor 1.1.1.1 remote-as 65001           ! iBGP: R1 (tu mismo AS)
 neighbor 1.1.1.1 update-source loopback 0  ! iBGP siempre sobre loopback (estable)
 neighbor 1.1.1.1 next-hop-self             ! Regla 2 resuelta: R1 aprende a llegar a R2 vía IGP
!
! ¿Qué anunciamos? Solo lo que esté en la TABLA DE RUTAS (¡ojo, igual que con OSPF!)
network 10.0.0.0 mask 255.255.255.252       ! la subred entre R2-R3 (sí, "mask" explícito)
network 192.168.1.0 mask 255.255.255.0      ! una red interna que querés anunciar al mundo
```

### 8.3. La sintaxis explicada (los 3 misterios de BGP)

```text
router bgp 65001                ← el ASN PROPIO (≠ el AS de EIGRP de eBGP 65002: apunta al VECINO)
neighbor X remote-as Y          ← "X es mi vecino, y pertenece al AS Y"
neighbor X update-source loopback 0 ← iBGP: la sesión "vive" en la loopback (si una interfaz
                                  cae, la sesión no muere) — con el IGP garantizando el camino
neighbor X next-hop-self        ← Regla 2: R1 (iBGP) aprenderá next-hop = R2 (no el ISP)
network 10.0.0.0 mask ...       ← ¡DIFERENTE A OSPF! En BGP, "network" NO activa interfaces:
                                  ANUNCIA un prefijo que YA está en la tabla de rutas.
                                  Si no está en la tabla → no se anuncia (y no "aparece")
```

> **La trampa clásica de BGP (`network`):** en OSPF, `network` matchea interfaces y las mete al proceso. En BGP, `network` **declara qué prefijos de mi tabla de rutas voy a anunciar**. Si el prefijo no está en la tabla (o no se alcanza exacto), BGP no anuncia NADA — y no da error visible. Diagnóstico: `show ip bgp` sin la ruta, o en "not in table".

### 8.4. eBGP multihop (el caso "vecino no directo")

```text
router bgp 65001
 neighbor 10.0.0.3 remote-as 65002
 neighbor 10.0.0.3 ebgp-multihop 2    ← permite que eBGP salte más de 1 hop (default TTL=1)
 neighbor 10.0.0.3 update-source loopback 0  ← con multihop, la sesión puede vivir en loopbacks
```

> **Regla del eBGP default:** el eBGP clásico asume que el vecino está a **un salto** (TTL=1). Si lo definís con `update-source loopback` (para estabilidad), necesitás `ebgp-multihop` con el TTL suficiente. Sin eso, la sesión no sube — "estoy enviando a un vecino a 2 saltos y el vecino no responde".

---

## 9. ¿Por qué no usar BGP para todo? El caso de uso honesto

Pregunta que TODOS se hacen en clase: "¿por qué no reemplazo OSPF por BGP y listo?" Respuesta honesta:

| Criterio | OSPF/IS-IS (IGP) | BGP (EGP) |
|----------|------------------|-----------|
| Objetivo | Convergencia rápida + métrica | Política + estabilidad |
| Convergencia | Segundos | **Minutos** (los timers y la cautela) |
| Auto-descubrimiento | Sí (Hello) | **NO**: cada vecino se configura a mano |
| Métrica | Costo/BW | **No hay "métrica de red"**: solo política |
| Uso típico | Dentro del AS | Entre AS y en el borde |
| "Escala" | Hasta miles de routers | El ENTERO de Internet |

> **La conclusión profesional (sección 11 del mercado real):** BGP se usa en el **borde**: para conectar tu AS con el ISP (default route o tablas parciales), para multi-homing (dos ISP, redundancia con política: "por acá salen los videos, por allá el resto"), y para peering entre ISP. **Dentro** de tu red, seguís usando OSPF/IS-IS/EIGRP: rápido, auto-descubrible, con métrica real. BGP no reemplaza al IGP: lo acompaña en la frontera.

---

## 10. Verificación: cómo leer a BGP

```text
R1# show ip bgp summary
BGP router identifier 2.2.2.2, local AS number 65001
Neighbor    V   AS  MsgRcvd  MsgSent  TblVer  InQ OutQ  Up/Down  State/PfxRcd
10.0.0.3     4 65002     123     121      17    0    0 00:12:34     2  ← eBGP OK, 2 prefijos
1.1.1.1      4 65001      89      90      17    0    0 00:11:02     1  ← iBGP OK
                    │                      │                 │        └─ Estado del vecino
                    └─ Estado que importa:     └─ Tabla estable    ("2" = 2 rutas recibidas)
                       en "State/PfxRcd" los
                       estados son: Idle → Connect → Active…
                       → OpenSent → OpenConfirm → ESTABLISHED
```

**La escala de estados (la leés en "State/PfxRcd"):**

```text
Idle → Connect → Active → OpenSent → OpenConfirm → ESTABLISHED
  └─ fases de "levantar la sesión TCP" (BGP usa TCP 179)
  ESTABLISHED con un número = TODO BIEN (las rutas están fluyendo)
  "Active" o "Idle" o "Established sin prefijos" = problema (sección 11)
```

```text
R1# show ip bgp
BGP table version is 17...
     Network          Next Hop            Metric LocPrf Weight Path
 *   203.0.113.0/24   10.0.0.3                 0         32768 i      ← eBGP del ISP
 *>i 192.168.1.0/24   1.1.1.1                  0    100      0 i      ← iBGP (LocPrf 100, "*>" = mejor)
```

| Comando | Qué te dice |
|---------|-------------|
| `show ip bgp summary` | Estado de cada vecino + cantidad de prefijos recibidos (ESTABLISHED = sano) |
| `show ip bgp` | La tabla BGP completa: rutas, next-hop, LocPrf, Weight, AS-Path |
| `show ip bgp <red>` | Análisis de UNA ruta: atributos y caminos disponibles |
| `show ip bgp neighbors 10.0.0.3` | Detalle de sesión: timers, capabilities, mensajes, estados |

---

## 11. Los 5 errores más comunes

| # | Error | Síntoma | Fix |
|---|-------|---------|-----|
| 1 | **ASN mal en `remote-as`** (invertido) | La sesión nunca queda ESTABLISHED (rebota entre Connect/Active) | `neighbor X remote-as <AS DEL VECINO>`, no el tuyo |
| 2 | **`network ... mask` de un prefijo que NO está en la tabla de rutas** | Sesión ESTABLISHED pero 0 prefijos anunciados (¡sin error!) | Verificar que el prefijo exista en `show ip route` (exacto) |
| 3 | **iBGP sin full mesh / sin next-hop-self** | Rutas que faltan en R1: no se re-anuncian (Regla 1) o next-hop irresoluble (Regla 2) | Full mesh o route reflector; `next-hop-self` en los bordes |
| 4 | **eBGP con loopback sin `ebgp-multihop`** | Sesión nunca sube (TTL=1 por defecto) | `ebgp-multihop 2` + `update-source loopback` |
| 5 | **Firewall/ACL bloqueando TCP 179** | Sesión en "Active" eterno (BGP necesita la sesión TCP) | Permitir TCP 179 hacia/desde los peers |

> **El error #2 es el más traicionero de la serie:** ESTABLISHED con cero prefijos. No hay mensaje de error: BGP simplemente "no tiene qué anunciar". La sesión está viva y tu ruta no se anuncia porque el prefijo no está en la tabla. Verificá SIEMPRE con `show ip bgp` si el prefijo aparece (o figura "not in table") antes de tocar timers o ACLs.

---

## 12. Comprobá lo que aprendiste

**1. ¿Cuál es la diferencia esencial entre BGP y los protocolos de red interna?**
<details>
<summary>Ver respuesta</summary>

Los IGPs (OSPF/EIGRP/IS-IS) eligen por MÉTRICA (más corto/rápido). BGP elige por **POLÍTICA**: los atributos (Weight, LocalPref, AS-Path, MED) son reglas administrativas/comerciales sobre "por dónde conviene". Es dinero y preferencia convertidos en protocolo.
</details>

**2. ¿Qué es el AS-PATH y qué resuelve?**
<details>
<summary>Ver respuesta</summary>

Es la lista completa de AS por los que pasa el anuncio (el "vector" del path vector). Resuelve: (a) detección de bucles instantánea (si tu AS aparece en el path, descartás el anuncio) y (b) política por actor y evaluación de "directura" (path más corto gana en la regla 4).
</details>

**3. ¿Qué es eBGP y qué es iBGP? ¿Y sus AD?**
<details>
<summary>Ver respuesta</summary>

eBGP = sesión entre AS distintos (vecino con otro ASN), AD 20, next-hop cambia, TTL=1. iBGP = dentro del mismo AS, AD 200, next-hop NO cambia (por eso next-hop-self), TTL multi-hop (loopbacks), y splithorizon propio (no se reanuncia iBGP a iBGP → full mesh).
</details>

**4. Ordená los pasos principales de la selección de camino BGP.**
<details>
<summary>Ver respuesta</summary>

1. Mayor Weight → 2. Mayor Local-Pref → 3. Originadas por el router → 4. AS-Path más corto → 5. Mejor Origin → 6. Menor MED → 7. eBGP antes que iBGP → 8. Menor costo IGP al next-hop. Preferencias: Weight/LocalPref más alto, AS-Path más corto, MED más bajo.
</details>

**5. LocalPref vs MED: ¿quién la usa y con qué tráfico?**
<details>
<summary>Ver respuesta</summary>

LocalPref la usa MI AS para elegir SALIDA (más alto mejor). MED la usa el VECINO para persuadir la ENTRADA (más bajo mejor). No mezclarlas al diagnosticar: una controla por dónde sale mi tráfico, la otra por dónde entra el del vecino.
</details>

**6. ¿Por qué iBGP necesita full mesh?**
<details>
<summary>Ver respuesta</summary>

Por el splithorizon de iBGP: lo aprendido por iBGP no se reanuncia a otro iBGP (protección contra bucles dentro del AS, donde el AS-PATH no ayuda). Consecuencia: todos deben ser vecinos de todos (N×N). La escala de eso se resuelve con Route Reflectors.
</details>

**7. ¿Qué hace `network ... mask` en BGP (vs OSPF)?**
<details>
<summary>Ver respuesta</summary>

En BGP NO activa interfaces: **anuncia un prefijo que ya está en la tabla de rutas** (con esa máscara exacta). Si el prefijo no está en la tabla, no se anuncia y no hay error visible — la trampa clásica.
</details>

**8. ¿Por qué no usar BGP en lugar del IGP dentro de mi red?**
<details>
<summary>Ver respuesta</summary>

Porque BGP no descubre vecinos (todo manual), no tiene métrica de red (solo política), y converge en MINUTOS (los IGPs en segundos). BGP es para el borde y la interconexión; el IGP sigue siendo el corazón rápido de la red.
</details>

---

## 13. Glosario

| Término | Qué es |
|---------|--------|
| **AS / ASN** | Sistema Autónomo: conjunto de redes bajo una administración/política única, con su número (1-64511 públicos, 64512-65535 privados) |
| **Path Vector** | Familia de BGP: guarda la lista completa de AS del camino (AS-PATH), no solo destino+distancia |
| **eBGP / iBGP** | Sesión entre AS distintos (AD 20) / dentro del mismo AS (AD 200) |
| **AS-PATH** | La cadena de AS que atraviesa el anuncio: loop prevention + preferencia (más corto gana) |
| **WEIGHT** | Preferencia local a un router (Cisco): mayor mejor |
| **LOCAL_PREF** | Preferencia de salida de todo el AS: mayor mejor |
| **MED** | Sugerencia de entrada del vecino: menor mejor |
| **Next-hop-self** | Fuerza que el next-hop de iBGP sea el router de borde (resuelve la Regla 2) |
| **Full mesh / RR** | Obligación de iBGP (todos con todos) y su solución (Route Reflector) |
| **Estados BGP** | Idle→Connect→Active→OpenSent→OpenConfirm→ESTABLISHED |
| **TCP 179** | El transporte de BGP: sesión TCP (por eso los firewalls lo bloquean) |

---

## 14. Resumen en 10 puntos

1. **BGP es el protocolo de Internet**: interconecta sistemas autónomos; lo demás (OSPF/EIGRP/IS-IS) vive DENTRO del AS.
2. **Tercera familia**: path vector — la lista completa de AS (AS-PATH) en cada anuncio; bucle = "tu AS aparece".
3. **eBGP (AD 20) entre AS; iBGP (AD 200) dentro del AS** — dos caras, reglas distintas (next-hop, full mesh).
4. **Los atributos son la moneda de la política**: Weight y LocalPref (más alto), AS-Path (más corto), MED (más bajo).
5. **Solamente el path selection en orden decide**: Weight → LocalPref → origen → AS-Path → origin → MED → eBGP → IGP.
6. **LocalPref controla SALIDA; MED persuade ENTRADA** — no se mezclan al diagnosticar.
7. **iBGP: no re-anuncio iBGP a iBGP** → full mesh (o route reflectors); next-hop no cambia (→ `next-hop-self`).
8. **Config**: `router bgp <ASN>` + `neighbor X remote-as Y` + anunciar con `network ... mask` SOLO prefijos que ya están en la tabla.
9. **eBGP default TTL=1**: si usás loopbacks, `ebgp-multihop`; y siempre revisá TCP 179 en los firewalls.
10. **No reemplaza al IGP**: BGP es el borde (multi-homing, peering); el IGP es el corazón. Saber elegir y combinar = nivel senior.

---

> **Fuente:** Documentación propia basada en RFC 4271 (BGP-4), RFC 1997 (BGP communities), CCNA 200-301 Official Cert Guide (W. Odom), Cisco IOS Configuration Guides y material educativo de redes.
# 43. Redistribución e Ingeniería de Tráfico

**Interconectar protocolos sin romper una red — y hacer que el tráfico vaya por donde vos querés**

---

## Índice

- [El problema: una red con varios protocolos](#1-el-problema-una-red-con-varios-protocolos)
- [Redistribución: qué es y por qué es peligrosa](#2-redistribución-qué-es-y-por-qué-es-peligrosa)
- [Seed Metric: la confusión número uno](#3-seed-metric-la-confusión-número-uno)
- [Configuración: el comando redistribute](#4-configuración-el-comando-redistribute)
- [Route-Map: el corazón del control](#5-route-map-el-corazón-del-control)
- [Filtrado de rutas: distribute-list](#6-filtrado-de-rutas-distribute-list)
- [PBR: ingeniería de tráfico de verdad](#7-pbr-ingeniería-de-tráfico-de-verdad)
- [Caso práctico: OSPF + EIGRP + BGP sin romper nada](#8-caso-práctico-ospf--eigrp--bgp-sin-romper-nada)
- [Los 6 errores más comunes de redistribución](#9-los-6-errores-más-comunes-de-redistribución)
- [Comprobá lo que aprendiste](#10-comprobá-lo-que-aprendiste)
- [Glosario](#11-glosario)
- [Resumen en 10 puntos](#12-resumen-en-10-puntos)

---

## 1. El problema: una red con varios protocolos

Hasta ahora cada manual te mostró un protocolo en su "mundo ideal": toda la red corriendo OSPF, o todo EIGRP, o todo RIP. En la vida real NO es así:

- Comprás una empresa que ya tenía OSPF y vos usás EIGRP.
- Dos empresas se fusionan y cada una tenía su protocolo.
- Un ISP te da BGP pero tu red interna sigue con OSPF.
- Un proveedor de voz usa RIP para una VLAN que nadie quiere tocar.

> **El problema: los protocolos NO se hablan entre sí.** Una ruta aprendida por OSPF no aparece en la tabla de EIGRP automáticamente. Son idiomas distintos: cada uno tiene sus propias métricas, sus propios timers y sus propias reglas. Que un router corra dos protocolos no conecta las redes: solo significa que habla dos idiomas pero no TRADUCE entre ellos.

**Analogía madre:** pensá en contratar a dos traductores para un evento internacional. OSPF traduce del alemán; EIGRP del francés. Si no hay nadie parado entre los dos que pase las frases de uno al otro, los invitados alemanes no entienden nada de los franceses. Ese traductor es la **redistribución**.

---

## 2. Redistribución: qué es y por qué es peligrosa

**Redistribuir** es tomar las rutas aprendidas por un protocolo (o las estáticas, o las conectadas) y **inyectarlas al otro protocolo** como si fueran propias. El router de frontera traduce: "estas rutas que sé por OSPF, ahora las anuncio por EIGRP".

```text
            AS interno (EIGRP)              AS interno (OSPF)
     ┌──────────────────────────┐   ┌──────────────────────────┐
     │  R1 ──── R2 ──── R3      │   │  R4 ──── R5 ──── R6      │
     │       (EIGRP 90)         │   │       (OSPF 110)         │
     └───────────┬──────────────┘   └───────────┬──────────────┘
                 │ R2 = REDISTRIBUTOR           │ R4 = REDISTRIBUTOR
                 └───────────────►◄─────────────┘
                          (R2 y R4 son el mismo router
                           físico en el mundo real)
```

**El riesgo: el bucle de redistribución (feedback loop).**

```text
[1] R2 aprende 10.0.0.0/8 por EIGRP        → lo redistribuye a OSPF
[2] R2 vuelve a aprender 10.0.0.0/8 por OSPF (LEL! yo se la mandé)
[3] R2 la vuelve a redistribuir a EIGRP... → ¡y así hasta el infinito!
```

Cada protocolo tiene su protección contra bucles (split horizon, SPF, AS-PATH) **PERO SOLO DENTRO DE SÍ MISMO**. La redistribución cruza las fronteras: EIGRP no sabe que esa ruta vino de OSPF que la recibió de EIGRP. El resultado es la **inestabilidad**: convergencias eternas, flapping, CPU al máximo y una red que "late" sin parar.

> **La regla de oro de la redistribución (memorizala):** NUNCA redistribuyas en ambos sentidos sin filtros. La redistribución bidireccional SIN control es el bug más grave y más común de las redes reales. Todo protocolo redistribuido hacia afuera DEBE estar filtrado para que lo que sale jamás vuelva a entrar por la otra puerta.

**La segunda regla**: la métrica de "destino" le da igual al protocolo de "origen". Por eso existe la **seed metric** (métrica semilla): la métrica con la que el protocolo receptor recibe la ruta redistribuida. Ahí está la confusión número uno del tema, y va en la próxima sección.

---

## 3. Seed Metric: la confusión número uno

Cuando un protocolo recibe una ruta redistribuida, no tiene forma de calcular su métrica (¡esa ruta no la descubrió él!). Entonces usa un valor por defecto llamado **seed metric**. Y acá está la trampa clásica:

| Protocolo receptor | Seed metric por defecto | Resultado de anunciarla "tal cual" |
|--------------------|------------------------|-----------------------------------|
| **RIP** | infinito (16) | ¡La ruta NO se anuncia (inalcanzable)! |
| **OSPF** | 20 (tipo E2) | Se anuncia con costo 20 fijo (no importa el enlace) |
| **EIGRP** | **¡no tiene!** | Si no definís la métrica, **no se redistribuye nada** (silencioso) |

> **Podés apreciar el chiste:** RIP por defecto redistribuye con 16 = inalcanzable [en el tema de enrutamiento dinámico](./36-enrutamiento-dinamico.md). OSPF la redistribuye con 20 sin mirar el enlace. Y EIGRP **se queda mudo** si no le das una métrica manual. Tres protocolos, tres comportamientos distintos, todos "correctos según su spec" — y todos rompen algo si no sabés qué esperabas.

**La sintaxis que arregla cada uno:**

```text
! RIP — la seed metric se define al redistribuir
router rip
 redistribute ospf 1 metric 2          ! la recibe con métrica 2 (hops)

! OSPF — seed metric 20 por defecto; la cambiás con metric o metric-type
router ospf 1
 redistribute eigrp 100 subnets         ! sin 'subnets' solo redistribuye classful
 redistribute eigrp 100 metric 50      ! la recibe con costo 50
 redistribute eigrp 100 metric-type 1  ! E1 (costo = seed + costo de tráfico)

! EIGRP — OBLIGATORIO definir la métrica (los 5 componentes)
router eigrp 100
 redistribute ospf 1 metric 10000 100 255 1 1500
 !                              BW   delay  reli  load MTU
```

> **HACELO VOS (la regla mental):** cuando redistribuís, preguntate SOLO UNA cosa: **"¿con qué métrica va a entrar al protocolo receptor?"**. Si no la definiste, OSPF le pone 20, RIP le pone 16 (¡muerta!) y EIGRP no redistribuye NADA. La seed metric es EL primer lugar donde mirar cuando "no aparece la ruta".

---

## 4. Configuración: el comando redistribute

### 4.1. Afuera de qué podés redistribuir

Dentro de cualquier protocolo (en modo configuración del proceso), el comando es:

```text
redistribute {ospf | eigrp | rip | static | connected | bgp} [opciones]
```

| Fuente | Qué trae | Ejemplo |
|--------|----------|---------|
| **static** | Tus rutas estáticas (vistas en [enrutamiento IP](./34-enrutamiento-ip-rutas-estaticas.md)) | `redistribute static` |
| **connected** | Las subredes conectadas directo al router | `redistribute connected` |
| **ospf 1** | El proceso OSPF que corre en este router | `redistribute ospf 1 subnets` |
| **eigrp 100** | El proceso EIGRP | `redistribute eigrp 100` |
| **rip** | El proceso RIP | `redistribute rip` |
| **bgp 65001** | El proceso BGP (cuidado: ¡arrastra todo el AS!) | `redistribute bgp 65001` |

### 4.2. Los parámetros que siempre tenés que mirar

```text
redistribute ospf 1 subnets            ← OSPF: sin 'subnets' solo redistribuye classful.
                                          (Clásico: "redistribuí y solo aparecen las /8 o /16")
redistribute ospf 1 metric 30          ← la seed metric con que entra
redistribute ospf 1 metric-type 1      ← OSPF: E1 suma el costo de tráfico; E2 (default) no
redistribute eigrp 100 metric 10000 100 255 1 1500  ← EIGRP: ¡obligatoria y completa!
redistribute static route-map FILTRO   ← ¡Y la pieza que falta: el filtro! (sección 5)
```

> **El reflejo profesional que tenés que entrenar:** SIEMPRE que veas un `redistribute` sin `route-map` al lado, tu sexto sentido tiene que encenderse. Redistribuir sin filtrar es abrir la canilla de toda tu tabla al otro protocolo. A veces es lo que querés... y a veces es el feedback loop del que hablamos (sección 2).

---

## 5. Route-Map: el corazón del control

### 5.1. La idea: un "semáforo con ficha"

Un **route-map** es una lista ordenada de reglas que decide **qué rutas pasan, qué rutas se rechazan y qué atributos se les cambia**. Trabaja con dos bloques:

```text
route-map NOMBRE permit|deny SECUENCIA
 match <condición>        ← qué rutas tomamos en cuenta
 set   <modificación>     ← qué les cambiamos si pasan

El router evalúa las secuencias DE ARRIBA HACIA ABAJO:
- Si una ruta MATCHEA una secuencia permit  → pasa (y puede tener 'set')
- Si matchea una deny                        → queda afuera (no sigue evaluando)
- Si no matchea ninguna                      → DENY implícito al final (¡se cae!)
```

> **Analogía:** el route-map es el boliche: el de la puerta (match) chequea la lista (IPs, next-hop, AS-PATH...). Si matchea, entra (permit) y le ponen un sello (set). Si matchea un deny, no entra. Y si la lista no lo menciona... tampoco entra: **deny implícito**. La trampa clásica: armar un route-map permit y olvidar que las rutas no listadas se caen.

### 5.2. El ejemplo de oro: controlar una redistribución

```text
! Solo dejo pasar las redes del bloque 10.x hacia OSPF
access-list 1 permit 10.0.0.0 0.255.255.255   ! ACL de ORIGENES (wildcard, visto en selección de rutas)

route-map ENTRADA-OSPF permit 10
 match ip address 1                 ! solo rutas con origen 10.x
 set metric-type type-1             ! y que entren como E1 (suma costo)

route-map ENTRADA-OSPF deny 20      ! (opcional: explícito, para documentar)
! (deny implícito al final: todo lo demás NO entra)

router ospf 1
 redistribute eigrp 100 subnets route-map ENTRADA-OSPF
```

> **HACELO VOS:** la ruta de pensamiento correcta: (1) ACL que define "cuáles me interesan", (2) route-map que las deja pasar y/o les cambia atributos, (3) el `redistribute ... route-map`. El route-map SIN el ACL no matchea nada (vacío) y el ACL sin route-map no se aplica. Los dos van siempre juntos hacia el redistribute.

---

## 6. Filtrado de rutas: distribute-list

El route-map controla la redistribución (lo que ENTRA a otro protocolo). Pero a veces querés algo más simple: **que el protocolo simplemente no anuncie o no acepte ciertas rutas**. Ahí van las **distribute-list**: una ACL que se aplica dentro del proceso:

```text
! No anunciar la 172.16.0.0/16 por EIGRP hacia vecinos
access-list 5 deny   172.16.0.0 0.0.255.255
access-list 5 permit any

router eigrp 100
 distribute-list 5 out              ! filtra lo que SALE por EIGRP
 distribute-list 5 in               ! filtra lo que ENTRA del vecino EIGRP
```

| Dirección | Qué filtra |
|-----------|-----------|
| `distribute-list X in` | Las rutas que RECIBE el router por ese protocolo |
| `distribute-list X out` | Las rutas que ANUNCIA (out en redistribución = filtra lo redistribuido) |

> **No confundas:** distribute-list filtra rutas (anuncios); route-map filtra Y modifica (set). Si solo querés cortar, ACL + distribute-list. Si querés controlar una redistribución o cambiar atributos, route-map. El 90% de las veces que redistribuís, el route-map es la herramienta — el distribute-list queda para recortes puntuales dentro de un solo protocolo.

---

## 7. PBR: ingeniería de tráfico de verdad

### 7.1. El problema que PBR resuelve

TODO lo que viste hasta acá decide la ruta mirando el **destino**. El router dice: "para llegar a X, salgo por Y". Pero la vida real pregunta cosas que el destino no responde:

- "El tráfico de la VPN de contabilidad va por la línea MPLS; el resto por Internet."
- "El tráfico de voz viaja por el enlace dedicado, sin importar el destino."
- "Desde la sucursal de Buenos Aires, todo sale por el enlace de 10 Gbps; desde Córdoba, por el otro."

Eso NO se puede con las tablas de rutas clásicas. Se puede con **Policy-Based Routing (PBR)** — enrutamiento basado en política: **"según ESTE tráfico (origen, puerto, tamaño...), mandalo por AQUELLA salida"**.

### 7.2. La sintaxis (una configuración, tres partes)

```text
! 1) route-map con match de TRÁFICO (no de rutas como en redistribución)
access-list 101 permit tcp any any eq 8080    ! tráfico HTTP(s) — ¡ojo! ACL extendida

route-map RUTEO-VOZ permit 10
 match ip address 101                 ! el tráfico que matchea...
 set ip next-hop 10.0.0.1             ! ...se mandaa este next-hop (¡fuerza el camino!)

! 2) aplicar el route-map EN LA INTERFAZ (no en un proceso!)
interface GigabitEthernet0/0
 ip policy route-map RUTEO-VOZ
```

| Parte | Dónde | Qué hace |
|-------|-------|----------|
| ACL extendida | global | Define QUÉ tráfico (origen, destino, puerto) |
| route-map con `set ip next-hop` | global | Define A DÓNDE mandarlo además de políticamente |
| `ip policy route-map` | **interfaz** | Activa PBR en esa entrada: ¡el tráfico que ENTRA por ahí se evalúa contra la política! |

> **HACELO VOS (la diferencia que todos confunden):** **redistribución = qué RUTAS entro a otro protocolo**; **PBR = qué TRÁFICO mando por otro camino**. El route-map de redistribución matchea RUTAS (con `match ip address` sobre ACL estándar de distribución). El route-map de PBR matchea TRÁFICO (con ACL extendida, puertos incluidos) y se aplica EN LA INTERFAZ, no en un proceso. Dos usos del mismo comando, dos mundos distintos.

---

## 8. Caso práctico: OSPF + EIGRP + BGP sin romper nada

### 8.1. La red

```text
          AS 65001 (TU empresa)
┌─────────┬─────────────────────────────┬─────────┐
│  OSPF   │      EIGRP (núcleo)         │   OSPF  │
│  área 0 │                            │  área 0 │
│ R1 ─ R2 ── R3 (REDISTRIBUTOR) ── R4 ── R5      │
│         (R3 redistribuye OSPF↔EIGRP)            │
│   │                                           │
│   └── R6 (BORDER) ── eBGP ── R7 (ISP)          │
└────────────────────────────────────────────────┘
```

### 8.2. Configuración segura (los principios en acción)

```text
! R3 — el redistributor central (la pieza delicada del sistema)

! 1) SOLO un sentido de redistribución por protocolo (evita feedback):
!    OSPF → EIGRP: todas (necesitamos que EIGRP conozca el área 0)
router eigrp 100
 redistribute ospf 1 metric 10000 100 255 1 1500   ! seed metric COMPLETA (obligación EIGRP)

! 2) EIGRP → OSPF: SOLO el núcleo, filtrando para no reinyectar lo ya redistribuido
access-list 10 permit 10.0.0.0 0.255.255.255      ! nuestras redes, nada más
access-list 10 deny any                           ! (explicito, por documentación)
route-map SOLO-NUCLEO permit 10
 match ip address 10
router ospf 1
 redistribute eigrp 100 subnets route-map SOLO-NUCLEO metric 30 metric-type 1

! 3) BGP solo en el borde: nada de redistribución masiva a BGP
router bgp 65001
 network 10.0.0.0 mask 255.0.0.0      ! (BGP: solo prefijos ya en la tabla)
 neighbor 198.51.100.2 remote-as 65002
```

### 8.3. La verificación del caso

```text
R3# show ip route | include ^D|^O|^B
D     10.1.0.0/16 [90/768000] via 10.0.0.4        ← EIGRP (90) core
O E1  10.2.0.0/16 [110/50] via 10.0.0.1           ← OSPF externa, E1 (costo suma)
B     203.0.113.0/24 [20/0] via 198.51.100.2      ← eBGP del ISP
```

> **Los tres principios del caso (los vas a ver en TODO diseño sano):** (1) seed metric definida en cada salto ["cómo entra"], (2) route-map en cada redistribución ["qué entra"], (3) una sola dirección de flujo por par ["por qué no entra de vuelta"]. Si respetás esos tres, la redistribución no te muerde.

---

## 9. Los 6 errores más comunes de redistribución

| # | Error | Síntoma | Fix |
|---|-------|---------|-----|
| 1 | **EIGRP sin seed metric** | La ruta no aparece: EIGRP no redistribuye nada en silencio | `redistribute ospf 1 metric BW delay reli load MTU` |
| 2 | **RIP redistribuye con seed 16** | La ruta aparece... como inalcanzable (¡la anuncia muerta!) | `redistribute ospf 1 metric 2` |
| 3 | **OSPF sin `subnets`** | Solo aparecen las redes classful (/8, /16, /24 "puras") | `redistribute eigrp 100 subnets` |
| 4 | **Redistribución bidireccional sin filtro** | Flapping, CPU al máximo, rutas que "respiran" (feedback loop, sección 2) | route-map o distribute-list cortando el retorno |
| 5 | **Route-map sin ACL (o sin deny implícito en mente)** | Nada pasa o TODO pasa | Unir ACL + route-map; recordá el deny implícito final |
| 6 | **PBR aplicado en la interfaz equivocada** | La política "no funciona" (se aplica al tráfico que ENTRA por esa interfaz) | `ip policy route-map` en la interfaz de entrada correcta |

> **El error #4 es el que muerde de verdad:** una red "inestable" que nadie entiende por qué late. Mirá los dos sentidos de redistribución: si A→B y B→A están activos sin filtro, tenés el loop. El fix clásico: **redistribuir A→B completo y B→A filtrado** (solo rutas propias de B), nunca los dos completos.

---

## 10. Comprobá lo que aprendiste

**1. ¿Qué es la redistribución y por qué es peligrosa?**
<details>
<summary>Ver respuesta</summary>

Es tomar rutas aprendidas por un protocolo e inyectarlas a otro (traducción entre idiomas de routing). Es peligrosa porque cada protocolo protege SUS bucles pero no los ajenos: la redistribución bidireccional sin filtros crea el feedback loop (rutas que van y vuelven eternamente, flapping e inestabilidad).
</details>

**2. ¿Qué es la seed metric y cuál es el comportamiento por defecto de RIP, OSPF y EIGRP?**
<details>
<summary>Ver respuesta</summary>

Es la métrica con la que el protocolo receptor recibe una ruta redistribuida (no la calculó él). RIP: 16 (¡inalcanzable!); OSPF: 20 (E2); EIGRP: no tiene — si no la definís, NO redistribuye (en silencio).
</details>

**3. ¿Qué hace el `subnets` en la redistribución a OSPF?**
<details>
<summary>Ver respuesta</summary>

Sin `subnets`, OSPF solo redistribuye rutas classful (las "limpias" /8, /16, /24 por defecto). Con `subnets`, redistribuye cualquier prefijo con máscara (VLSM). Clásico: "redistribuí y solo aparecen algunas redes".
</details>

**4. Route-map de redistribución vs route-map de PBR: ¿en qué se diferencian?**
<details>
<summary>Ver respuesta</summary>

El de redistribución matchea RUTAS (ACL estándar, origenes) y se aplica en `redistribute ... route-map`. El de PBR matchea TRÁFICO (ACL extendida con puertos) y se aplica en la INTERFAZ con `ip policy route-map`. Ambos usan match/set, pero el objeto (rutas vs tráfico) y el lugar de aplicación (proceso vs interfaz) cambian.
</details>

**5. ¿Por qué la redistribución bidireccional necesita filtros?**
<details>
<summary>Ver respuesta</summary>

Porque la protección de bucle de cada protocolo no cruza fronteras: EIGRP no sabe que la ruta que recibe por OSPF salió de él. Sin filtro, la ruta entra por A, sale por B, vuelve a entrar por A... ciclo infinito (feedback loop). Se corta filtrando el retorno (solo rutas propias del otro lado).
</details>

**6. ¿Qué matchea un route-map y qué pasa si una ruta no matchea NINGUNA secuencia?**
<details>
<summary>Ver respuesta</summary>

Matchea según las `match` de cada secuencia (origen de ACL, next-hop, tag, etc.). Si no matchea ninguna secuencia, cae en el **deny implícito al final**: NO pasa. Es la trampa clásica: armar solo secuencias permit y sorprenderse de que "algo no entra".
</details>

**7. ¿Con qué seed metric entra una ruta redistribuida a RIP? ¿Y qué significa eso para tu red?**
<details>
<summary>Ver respuesta</summary>

Con 16 = inalcanzable: RIP anuncia la ruta redistribuida como muerta. Hay que definirla con `metric` al redistribuir (`redistribute ospf 1 metric 2`, por ejemplo). Sin eso, la ruta "aparece" pero nadie la usa.
</details>

**8. ¿Dónde se aplica `ip policy route-map` y sobre qué tráfico actúa?**
<details>
<summary>Ver respuesta</summary>

En una INTERFAZ, y actúa sobre el tráfico que ENTRA por esa interfaz (no sobre el que sale). Se evalúa contra el route-map: si matchea, se fuerza el `set ip next-hop` u otras acciones. Si no matchea, se rutea normalmente.
</details>

---

## 11. Glosario

| Término | Qué es |
|---------|--------|
| **Redistribución** | Inyectar rutas de un protocolo (o estáticas/conectadas) a otro, traduciendo entre idiomas de routing |
| **Seed metric** | La métrica con que el protocolo receptor recibe la ruta redistribuida (RIP 16, OSPF 20/E2, EIGRP sin valor) |
| **Feedback loop** | Bucle de redistribución: la ruta entra por A, sale por B y vuelve a entrar — inestabilidad eterna |
| **Route-map** | Secuencias match/set con permit/deny: filtra Y modifica rutas (redistribución) o tráfico (PBR) |
| **Deny implícito** | Al final de todo route-map: lo que no matchea ninguna secuencia, NO pasa |
| **Distribute-list** | Filtrar anuncios de rutas (in/out) con una ACL dentro de un proceso |
| **PBR** | Policy-Based Routing: enrutar por política (qué tráfico va por dónde), no por destino |
| **`subnets`** | Parámetro OSPF para redistribuir prefijos no classful (VLSM) |
| **E1 / E2** | Métricas de rutas externas OSPF: E1 suma el costo de tráfico; E2 (default) no |

---

## 12. Resumen en 10 puntos

1. **Los protocolos no se hablan**: OSPF, EIGRP, RIP y BGP tienen idiomas distintos (métricas, timers, reglas) — la redistribución es la traducción.
2. **La seed metric decide cómo entra**: RIP 16 (muerta), OSPF 20 (E2), EIGRP sin métrica = no redistribuye.
3. **Redistribuir sin filtros es abrir la canilla**: el feedback loop (rutas que vuelven) es el bug más grave de redes reales.
4. **EIGRP exige la métrica completa**: `redistribute ospf 1 metric BW delay reli load MTU` (5 componentes).
5. **OSPF y el `subnets`**: sin él, solo redistribuye classful — la trampa de "faltan redes".
6. **Route-map = semáforo con ficha**: match (condición) + set (modificación) + permit/deny, evaluados de arriba hacia abajo.
7. **El deny implícito te espera al final**: lo que no matchea ninguna secuencia, no pasa.
8. **Distribute-list filtra anuncios** (in/out dentro de un proceso); route-map filtra Y modifica.
9. **PBR ≠ redistribución**: la primera fuerza TRÁFICO por política (en la interfaz, ACL extendida); la segunda mueve RUTAS entre protocolos.
10. **El diseño sano de redistribución**: seed metric definida + route-map en cada salto + una sola dirección de flujo por par. Respetá los tres y la red no te muerde.

---

> **Fuente:** Documentación propia basada en CCNA 200-301 Official Cert Guide (W. Odom), Cisco IOS Configuration Guides (redistributing routing protocols, route-maps, PBR), RFC 2453 (RIP-2), RFC 2328 (OSPFv2), RFC 4271 (BGP-4) y material educativo de redes.
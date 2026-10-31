# 37. OSPF: El Protocolo de Estado de Enlace en Acción

**Cómo un protocolo de verdad convierte los LSA, la LSDB y el SPF en una red que converge sola**

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

---

## 1. Del enrutamiento dinámico a OSPF: el salto a la práctica

En el tema de enrutamiento dinámico aprendiste qué es un protocolo de **estado de enlace**:

> Cada router publica su pedacito de red (un **LSA**), todos arman la misma **LSDB** (el mapa completo) y cada uno calcula su árbol con **SPF** (Dijkstra).

Eso era la teoría. Ahora llega la pregunta que separa a los que estudiaron de memoria de los que entendieron:

> **¿Y eso cómo se ve en un router de verdad? ¿Cómo se "publica" un LSA? ¿Cómo se descubre un vecino? ¿Qué comandos se configuran?**

La respuesta es **OSPF** (*Open Shortest Path First*, RFC 2328): el protocolo de estado de enlace más usado del mundo en redes internas. Y lo que acabás de aprender NO es teoría abstracta: cada pieza del tema anterior tiene su nombre de pila acá adentro.

| Enrutamiento dinámico (teoría) | OSPF (realidad) |
|---------------------|------------------------|
| "Los routers se descubren" | Protocolo **Hello** (y los timers) |
| "Cada router publica su pedacito" | **LSA tipo 1 y 2** (en OSPF avanzado vas a ver los demás) |
| "Todos arman el mapa completo" | **LSDB** |
| "Cada uno calcula con Dijkstra" | El **SPF** que corre cada router al recibir un cambio |
| "Convergencia rápida" | Flooding inmediato del LSA + recálculo local |

> **Analogía:** el enrutamiento dinámico te enseñó el CÓDIGO DE TRÁNSITO (qué es un mapa, cómo se traza una ruta óptima). OSPF te entrega el AUTO y las LLAVES: cómo se enciende, cómo se conduce y qué significan los testigos del tablero. No podés manejar sin el auto, pero el auto sin el código tampoco te lleva a ningún lado.

**Promesa de este manual:** al final vas a poder configurar OSPF en tres routers, ver la vecindad en `Full`, ver las rutas `O` en la tabla y — lo más importante — **diagnosticar por qué un vecino no levanta**. Eso último es el 50% de cualquier examen real.

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

Tres datos de esta tabla merecen párrafo propio: el Router ID (§3), el Hello (§4) y el costo (§7). El resto, lo vas tocando en el camino.

> **Dato para la mesa de examen:** OSPF no usa TCP ni UDP — habla directo por **IP protocol 89**. Cuando veas "protocolo IP 89" en un filtro de ACL o un examen, pensá OSPF. (RIP usa UDP 520, BGP usa TCP 179: cada protocolo elige su transporte.)

---

## 3. El Router ID: el DNI del router

### 3.1. Qué es y para qué sirve

El **Router ID (RID)** es un número de 32 bits (una dirección IPv4 cualquiera) que identifica **de forma única** a cada router dentro del dominio OSPF. No tiene que ser una IP real de la red: es como el DNI, un identificador.

**Para qué importa:** en la LSDB, tu `router-id 1.1.1.1` identifica que "tal LSA lo publicó tal router". Si dos routers tienen el MISMO RID... la red se vuelve un caos: los LSA se pisan, las adyacencias no levantan o levantan mal. Es la primera causa de "no me anda y no sé por qué".

### 3.2. Cómo se elige (la regla de oro)

OSPF elige su RID automáticamente, en este orden:

```text
1. Si configuraste `router-id X.X.X.X` a mano → ESE (manda siempre)
2. Si no: el IPv4 más alto de las interfaces LOOPBACK
3. Si no hay loopback: el IPv4 más alto de las interfaces actividad
4. Como último recurso: elige y listo (y te banca con un mensaje feo)
```

> **La regla de oro que te va a salvar la vida:** **JAMÁS dependas de la elección automática.** Configurá `router-id` a mano en cada router de la red. ¿Por qué? Porque si el router apaga una interfaz o cambia una IP, el RID automático **puede cambiar**, y OSPF reinicia las vecindades (con su corte de tráfico). Un RID fijo = estabilidad.

### 3.3. El patrón de buen vecino

Convención práctica (la ves en todas las empresas serias): el RID es la IP de la **loopback 0**, que además se usa para conectividad de gestión:

```text
R1: loopback 0 = 1.1.1.1
R2: loopback 0 = 2.2.2.2
R3: loopback 0 = 3.3.3.3
```

Así de un vistazo al `show ip ospf neighbor` sabés QUIÉN es quién. Y no lo digo yo: es el patrón de diseño que ves en los laboratorios del CCNA y en producción.

> **HACELO VOS:** en el laboratorio de la sección 8, la loopback 0 de cada router llevará su RID. Configurá SIEMPRE `router-id` explícito. Cuando en el futuro veas el vecino "2.2.2.2", vas a saber sin mirar un diagrama que es R2.

---

## 4. Saludos y vecinos: el protocolo Hello

### 4.1. La primera pieza de OSPF: encontrarse

OSPF no "asume" que su vecino existe: lo **descubre** con el protocolo **Hello** (RFC dice "saludo"). Cada router, en cada interfaz OSPF, manda Hells periódicos (por defecto cada **10 segundos**) al multicast **224.0.0.5**.

```text
R1 ── Hello (router-id 1.1.1.1, área 0, timers 10/40) ──► R2
R2 ── Hello (router-id 2.2.2.2, área 0, timers 10/40) ──► R1
      ... y así cada 10 segundos ...
```

El Hello es la declaración de presencia: "Acá estoy, soy este, estoy en esta área, con estos timers". Es también el **latido**: si no llega un Hello de R2 en **40 segundos** (el Dead timer), R1 declara a R2 caído y **recalcula**.

> **Analogía:** el Hello es el "¿seguís ahí?" de WhatsApp. Mientras el otro responde, la amistad sigue. Cuando deja de responder 40 segundos, OSPF corta la relación, avisa a todos (flooding de un LSA) y recalcula. ¿Quién manda los avisos? El título de la sección 9 te cuenta.

### 4.2. ¿Cuándo dos routers se vuelven "vecinos"?

No alcanza con escucharse. Para formar vecindad, los Hells deben coincidir en:

| Requisito | Si no coincide... |
|-----------|-------------------|
| **Misma área** | No se vuelven vecinos |
| **Mismos timers** (Hello/Dead) | No se vuelven vecinos (los timers van en el Hello) |
| **Misma área de red** (stub, NSSA — tipos que vienen con OSPF avanzado) | No se vuelven vecinos |
| **Misma autenticación** (si está habilitada) | No se vuelven vecinos |
| **Misma subred / misma máscara** | No se vuelven vecinos (¡salvo en point-to-point con parámetros aparte!) |
| RID únicos | El fantasma del RID duplicado (sección 10) |

**Memorizá esta tabla.** Cuando algo "no levanta" en OSPF, el 90% de las veces el motivo está acá: un timer distinto, un área mal puesta, una máscara que no matchea. El `show ip ospf neighbor` te muestra el síntoma; esta tabla te da la causa.

> **Dato curioso que enamora a los examinadores:** el Dead timer no se negocia — se iguala. En Cisco, si R1 tiene Hello 10 / Dead 40 y R2 Hello 5 / Dead 20, **ninguno de los dos se adapta**: la vecindad NO se forma hasta que coincidan exactamente. OSPF no transa en los timers.

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

| Estado | Qué pasa | En cristiano |
|--------|----------|--------------|
| **Down** | No recibió ningún Hello | "No sé que existís" |
| **Init** | Recibió Hells pero no lo mencionan a él | "Veo que alguien saluda, pero no me nombra" |
| **2-Way** | Se vieron mutuamente en los Hells | "¡Nos saludamos los dos!" (en broadcast acá se elige al DR) |
| **ExStart** | Negocian quién empieza (el RID mayor) | "Vos arrancás o arranco yo" |
| **Exchange** | Se pasan los DBD (resúmenes de LSDB) | "Te muestro el índice de mi enciclopedia" |
| **Loading** | Piden los LSA que no tienen | "Pasame el tomo 3, no lo tengo" |
| **Full** | LSDB sincronizadas | "Tenemos la misma enciclopedia" → corren SPF |

> **El estado que te van a preguntar (siempre):** **Full** es el estado de una relación sana. **2-Way** es sano SOLO en redes broadcast entre routers que no son DR ni BDR (se explican con OSPF avanzado). Cualquier otro estado "trabado" (Init que no avanza, ExStart eterno, Loading que no termina) es un problema para diagnosticar.

> **Analogía (el algoritmo del viaje):** Down = "no conozco a nadie". Init = "veo viajeros pero no me registran". 2-Way = "nos reconocemos". ExStart = "¿vos traés el mapa o lo traigo yo?" Exchange = "nos mostramos nuestros mapas". Loading = "me faltan tres zonas, pasámelas". Full = "tenemos la MISMA enciclopedia" — recién ahí confiás en el cálculo del otro... y en el tuyo.

---

## 6. Los tipos de red: cómo se comporta OSPF en cada medio

OSPF se adapta al medio físico. Los tipos que verás en el 95% de los casos:

| Tipo de red | Cómo se comporta | Cuándo lo ves |
|-------------|------------------|---------------|
| **Broadcast** | Forma adyacencias FULL solo con el **DR/BDR** (los demás quedan en 2-Way entre sí) · multicast 224.0.0.5/6 | Ethernet (switches) |
| **Point-to-point** | Forma FULL directo con el único vecino · sin elección de DR | Serial, enlaces punto a punto, tuneles |
| **Non-broadcast (NBMA)** | Como broadcast pero necesita configuración manual del vecino (Frame Relay — legado) | Redes viejas con Frame Relay |
| **Point-to-multipoint** | Trata cada destino como un punto a punto | Redes satelitales, hub-and-spoke |

> **Impacto práctico (esto explica OSPF avanzado):** en un enlace **Ethernet** (broadcast), si hubiera 10 routers en el mismo segmento, cada router tendría que formar adyacencia con los otros 9: 45 adyacencias, un festival de LSA. OSPF resuelve con la elección de **DR/BDR** (Designated/BDR): todos se sincronizan solo con el DR (adiós festival). Ese es el tema estrella de OSPF avanzado. Por ahora: **sabé que en broadcast se elige un DR, y que eso es OPTIMIZACIÓN, no capricho.**

> **Dato de configuración que salva vidas:** en Cisco, los enlaces **seriales** (HDLC/PPP) son point-to-point por defecto → sin DR, vecindad directa, FULL con el vecino. Si tu vecindad Ethernet "trabada" te confunde, recordá la regla de segmento de broadcast y el DR.

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

> **El problema del mundo moderno:** como el costo mínimo es 1, **todos los enlaces ≥ 100 Mbps cuestan 1**. Si tu diseño depende de elegir entre un enlace de 1 Gbps y otro de 10 Gbps... OSPF los ve IDÉNTICOS (costo 1 y 1). Por eso en redes modernas se ajusta la referencia:

```text
(global) auto-cost reference-bandwidth 10000
```

Con referencia **10 Gbps (10.000 Mbps)**, el 1 Gbps cuesta 10 y el 10 Gbps cuesta 1: la métrica vuelve a discriminar. **Ojo:** este comando debe ser IGUAL en TODOS los routers del área, o cada uno calcula distinto (y adiós consistencia de la LSDB).

### 7.2. El costo en la práctica

- El **costo de una ruta** = la SUMA de los costos de todos los enlaces por los que pasa (exit interface de cada hop).
- El SPF elige el camino de **menor costo total** (no de menor cantidad de saltos: el costo 1 de un Gbps "vale" lo mismo que el de 100 Mbps solo si ambos cuestan 1).
- Podés **sobreescribir el costo de una interfaz** a mano (`ip ospf cost 50` o `bandwidth 100000`) — es la herramienta para "hacer que el tráfico vaya por donde quiero" (ingeniería de tráfico, tema de redistribución).

> **Analogía:** el costo es el peaje combinado de la ruta. Un camino con 3 autopistas (3×1 = costo 3) le gana a uno con 2 rutas de montaña (2×64 = costo 128), aunque el segundo tenga menos tramos. OSPF no cuenta tramos: SUMA peajes. Por eso "más saltos pero más rápido" es una frase que OSPF entiende perfecto.

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

**El wildcard, la pesadilla clásica:** la wildcard es la máscara "al revés": `0.0.0.255` = /24, `0.0.0.3` = /30, `0.0.0.0` = /32 (exacta). **Nunca pongas la máscara de subred en `network`** — poner `255.255.255.252` donde va `0.0.0.3` es el error #1 de config OSPF.

> **HACELO VOS — el truco del examen (lo que nadie te dice):** APRENDÉ a convertir máscara → wildcard en segundos:
> wildcard = 255.255.255.255 MENOS la máscara.
>  /24 = 255.255.255.0 → 0.0.0.255
>  /30 = 255.255.255.252 → 0.0.0.3
>  /32 = 255.255.255.255 → 0.0.0.0
> Hacé la resta. Siempre. No la memorices.

### 8.4. ¿Por qué publicar la loopback en OSPF?

Las 3 loopbacks (1.1.1.1/32, etc.) se anuncian en OSPF como rutas `/32`: así cada router alcanza la "IP de gestión" de los demás **por OSPF** (no por rutas estáticas). Es la base de la gestión de la red por OSPF. Y de paso, la loopback **nunca se cae** (no depende de un enlace físico): la gestión sigue funcionando aunque un enlace falle.

---

## 9. Verificación: las preguntas que hay que hacerle a la red

Configurar fue la parte fácil. **Verificar es la parte que te va a pagar el sueldo.** Cuatro comandos, cuatro preguntas:

### 9.1. `show ip ospf neighbor` — ¿con quién me llevo bien?

```text
R1# show ip ospf neighbor

Neighbor ID     Pri   State           Dead Time   Address         Interface
2.2.2.2           1   FULL/DR         00:00:38    10.0.0.2        GigabitEthernet0/0
```

| Columna | Qué te dice |
|---------|-------------|
| Neighbor ID | El RID del vecino (2.2.2.2 = R2, el DNI que configuraste con amor) |
| State | **FULL/DR**: relación sana, y además R2 es el DR del segmento (lo ves con OSPF avanzado) |
| Dead Time | Cuántos segundos faltan para declarar muerto al vecino si no llega Hello (va de 40 → 0 y se reinicia) |
| Interface | Por dónde está el vecino |

> Recordá la regla de la sección 5: **FULL = sano**. Ver 2-Way entre dos routers que no son DR/BDR también es sano (se explica con OSPF avanzado). Ver `Init` o `ExStart` clavado = problema → sección 10.

### 9.2. `show ip route ospf` — ¿qué aprendió?

```text
R1# show ip route ospf

O    10.0.1.0/30 [110/2] via 10.0.0.2, 00:12:44, GigabitEthernet0/0
O    3.3.3.3/32 [110/3] via 10.0.0.2, 00:12:44, GigabitEthernet0/0

     [110/2]  ← AD 110 + costo 2 (10.0.0.0/30 costo 1 + 10.0.1.0/30 costo 1)
     O        ← rutas aprendidas por OSPF (interiores = intra-area)
```

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

Acá ves TODO lo que importa de este manual en una sola pantalla: área, timers, costo, tipo de red, y quién es el DR.

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

> **El ritual de verificación (aprendételo de memoria):** **1)** `show ip ospf neighbor` → ¿FULL? **2)** `show ip route ospf` → ¿están las rutas O? **3)** `ping` a la loopback del vecino → ¿el camino funciona? En ese orden. Cuando un lab "no anda", este ritual de 3 pasos te dice EXACTAMENTE dónde está cortado.

---

## 10. Los 5 errores más comunes (y su diagnóstico)

| # | Error | Síntoma | Diagnóstico / Fix |
|---|-------|---------|-------------------|
| 1 | **Wildcard mal puesta** (máscara en vez de wildcard) | Ninguna vecindad levanta | Revisá `show ip ospf interface`: si dice "Attached via Network Statement" para la interfaz equivocada... `network 10.0.0.0 0.0.0.3 area 0` |
| 2 | **Timers distintos** | El vecino aparece en Init y no avanza | `show ip ospf interface`: usá `ip ospf hello-interval`/`dead-interval` o igualá a mano |
| 3 | **RID duplicado** | Vecindades que suben y bajan solas, LSA pisados | Cada router debe tener RID único: forzá `router-id` en todos (sección 3.2/3.3) |
| 4 | **Área distinta en cada lado** | No se ven, o vecino "Down" eterno | `network ... area X` debe coincidir en AMBOS extremos |
| 5 | **Interface apagada o sin IP** (o `passive-interface` que se comió al vecino) | Down en `show ip ospf neighbor` | `show ip interface brief` + revisar `passive-interface` (los Hells no salen por interfaces passive) |

> **El caso #5 es el más "invisible" de todos:** `passive-interface` evita mandar Hells (se usa en interfaces hacia LAN donde no hay vecinos — buena práctica para ahorrar recursos). Pero si pusiste passive en la interfaz que SÍ tiene vecino... el vecino nunca va a ver tus Hells y la vecindad jamas levanta. Misma interface, dos caras: la misma.

> **Regla de oro del diagnóstico:** OSPF casi NUNCA es "un bug del protocolo". Si algo no levanta, es una de las 5 razones de arriba (o una combinación). El `show ip ospf neighbor` + `show ip ospf interface` te cuentan la historia; aprendé a leerla.

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

> **Dato de arquitectura (lo que todo el mundo repite pero pocos entienden):** TODA área debe tocar el **área 0 (backbone)**. No existe una red OSPF sana sin backbone, porque las rutas entre áreas SIEMPRE pasan por el área 0 (hay excepciones de diseño feo, tipo virtual links, que se evitan). La regla mental: **áreas = vecindarios, backbone = la avenida que los conecta.**

---

## 12. Comprobá lo que aprendiste

**1. ¿Qué transporte usa OSPF y por qué eso importa para una ACL?**
<details>
<summary>Ver respuesta</summary>

IP protocol 89 (directo sobre IP, ni TCP ni UDP). Si en una ACL o examen ves "protocolo IP 89", es OSPF. En cambio RIP usa UDP 520 y BGP TCP 179.
</details>

**2. ¿Cuál es la regla de oro del Router ID?**
<details>
<summary>Ver respuesta</summary>

Configurarlo SIEMPRE a mano (`router-id`), idealmente con la IP de loopback 0 (1.1.1.1, 2.2.2.2...). El RID automático puede cambiar cuando se apaga una interfaz y reinicia vecindades. RID duplicados = caos en la LSDB.
</details>

**3. ¿Qué requisitos deben cumplir dos routers para volverse vecinos OSPF?**
<details>
<summary>Ver respuesta</summary>

Misma área, mismos timers (Hello/Dead), misma máscara/subred (en la mayoría de los medios), misma configuración de área (stub/NSSA) y misma autenticación si existe. Si algo no levanta, revisá esta lista en orden.
</details>

**4. Nombra los estados de vecindad en orden, del peor al mejor escenario.**
<details>
<summary>Ver respuesta</summary>

Down → Init → 2-Way → ExStart → Exchange → Loading → Full. 2-Way es un estado "intermedio sano" en broadcast (un router que no es DR ni BDR con otros que tampoco lo son). Full = LSDB sincronizadas: el objetivo.
</details>

**5. ¿Qué es la wildcard y cómo calculás la de una /30?**
<details>
<summary>Ver respuesta</summary>

Es la anti-máscara: `wildcard = 255.255.255.255 − máscara`. Para /30 (255.255.255.252) → 0.0.0.3. Para /24 → 0.0.0.255. Para /32 → 0.0.0.0. Nunca confundas máscara con wildcard en `network`.
</details>

**6. ¿Por qué en redes modernas hay que ajustar `auto-cost reference-bandwidth`?**
<details>
<summary>Ver respuesta</summary>

El costo mínimo es 1 y con la referencia por defecto (100 Mbps) todos los enlaces ≥ 100 Mbps cuestan 1: OSPF no distingue un Gbps de un 10 Gbps. Con referencia 10000 (10 Gbps), el 1 Gbps cuesta 10 y el 10 Gbps cuesta 1. Debe ser igual en TODA el área.
</details>

**7. ¿Qué significa ver `FULL/DR` en `show ip ospf neighbor`?**
<details>
<summary>Ver respuesta</summary>

Dos cosas: la vecindad está sana (Full: LSDB sincronizadas) y además el vecino es el Designated Router del segmento broadcast. El DR concentra las adyacencias — tema de OSPF avanzado.
</details>

**8. ¿Qué es el Dead timer y qué pasa cuando se vence?**
<details>
<summary>Ver respuesta</summary>

Es el tiempo máximo (40 s por defecto) sin recibir Hells antes de declarar muerto al vecino. Al vencer, OSPF actualiza la LSDB (flooding del cambio) y recalcula con SPF. Es la pieza de convergencia del enrutamiento dinámico cobrando vida.
</details>

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

---

> **Fuente:** Documentación propia basada en RFC 2328 (OSPFv2), CCNA 200-301 Official Cert Guide (W. Odom), Cisco IOS Configuration Guides y material educativo de redes.
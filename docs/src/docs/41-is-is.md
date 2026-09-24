# 41. IS-IS: El Estado de Enlace que los Proveedores Aman

**El primo de OSPF que nació en la OSI, no en Internet — y que hoy es el caballito de batalla de los grandes ISP**

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

---

## 1. El gigante silencioso

OSPF domina los libros de CCNA. Pero en las redes de los **proveedores de Internet (ISP)** y en los **backbones de las grandes telecomunicaciones**, el protocolo que más se ve (junto a BGP) tiene otro nombre: **IS-IS**.

> **Analogía:** OSPF es el auto que aprendés a manejar en la escuela de manejo (el CCNA). IS-IS es el camión pesado que usan los profesionales del transporte: mismo código de tránsito (ambos son estado de enlace, mismo Dijkstra), pero licencia, mecánica y operación distintas — y está pensado para rutas enormes.

Dato que rompe mitos: **IS-IS es anterior a OSPF** (nacido en los 80) y, pese a la fama de OSPF en los cursos, IS-IS ganó la batalla de los ISP por una razón técnica de fondo que vas a entender en la sección 5 (el diseño L1/L2 y su escalabilidad brutal). "Ganó el protocolo menos famoso", y saber por qué te pone un escalón por encima del promedio.

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

> **La frase que resume el porqué:** "OSPF depende de IP para hablar (multicast 224.0.0.5, protocol 89); IS-IS habla su propio idioma sobre el enlace (PDU multicast a todos los routers, sin depender de direcciones IP). Tuvo una década de ventaja para escalar, y los ISP la aprovecharon."

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

Regla de oro del NET: **el System ID debe ser único** en todo el dominio IS-IS. Convención (la misma del RID de OSPF, ahora en 6 bytes): el System ID es la loopback en formato "raro": `0000.0000.0001` para R1, `0000.0000.0002` para R2... Formato: 13 dígitos en total, agrupados 3-4-4-2 (autoridad de área - system - nsel). No es complicado: es INEXORABLE — si falla el NET, no hay protocolo.

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

### 5.2. Los tipos de routers (la tabla que hay que saber)

| Tipo | Qué enruta | Equivalencia OSPF (mental) |
|------|-----------|-----------------------------|
| **L1** | Solo su área | Internal router |
| **L2** | Solo el backbone (áreas enteras entre sí) | Backbone router (área 0 puro) |
| **L1/L2** | Ambos niveles | **ABR** |

Regla de oro del L1 (el detalle determinante): un router **L1 puro** enruta hacia fuera del área mediante la **ruta por defecto** (default) que le inyecta el L1/L2. No conoce el detalle de otras áreas: solo "para afuera, por acá". Ese es el ahorro de estado que hace a IS-IS tan escalable — y es idéntico en espíritu a un área stub de OSPF (que viste con OSPF avanzado).

### 5.3. ¿Y el "área 0 obligatoria" de IS-IS?

IS-IS **no tiene área 0**: tiene la exigencia de que **el backbone L2 sea contiguo**. Los routers L1/L2 y L2 forman una malla L2 continua a través de las áreas. Si el backbone L2 se parte en dos, las áreas quedan desconectadas en L2 (con el mismo problema de diseño de "área sin backbone" de OSPF).

> **Dato de examen que enamora:** en OSPF, "área 0 obligatoria". En IS-IS: "backbone L2 contiguo obligatorio". Misma necesidad lógica, dos implementaciones distintas. Si te preguntan "¿IS-IS tiene área 0?" la respuesta correcta es: **no, no hay área 0: el backbone es el nivel 2, y debe ser contiguo.**

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

### 6.2. El detalle de los dos SPF (lo que separa a los que entienden)

En un router L1/L2 corren **DOS procesos SPF**: uno sobre la LSDB de nivel 1 (su área) y otro sobre la de nivel 2 (el backbone). Esa separación es parte de por qué IS-IS escala: cada nivel aísla su "mapa" y su recálculo. Cuando algo cambia en el área 1, solo los L1 de esa área recalculan el SPF L1; el resto del mundo ni se entera (su SPF L2 no cambió).

### 6.3. El DIS (y por qué NO hay backup)

En un segmento broadcast, IS-IS elige un **DIS** (Designated Intermediate System) — el equivalente del DR de OSPF. Diferencia clave:

| DR OSPF | DIS IS-IS |
|---------|-----------|
| Elige DR **y BDR** (backup) | **NO hay BDR/disaster**: si el DIS muere, se reelige y punto |
| Elección por prioridad + RID | Elección por prioridad + **MAC/sistema ID** (desempate más "físico") |
| Reelección NO preemptiva | También NO preemptiva (misma regla que en OSPF avanzado) |

> **El dato fino que muchos se llevan puestos:** OSPF tiene BDR (DR/BDR). IS-IS **no**: solo DIS. La "seguridad" del segmento broadcast no está en un backup temporal sino en que el flood de LSP es más robusto (los LSP se reenvían por CSNP/PSNP — "listados de qué tengo" periódicos que permiten resincronizar sin depender del DIS). Es otra filosofía: no "respaldo al representante", sino "resincronizar fácil".

---

## 7. La métrica: del 10 fijo a la wide metric

### 7.1. Narrow vs wide (la evolución)

| Métrica | Valor por enlace | Alcance total | Cuándo |
|---------|------------------|---------------|--------|
| **Narrow** (vieja) | **10 fijo** por defecto (todos los enlaces cuestan lo mismo) | máx 1023 | IS-IS clásico, redes chicas |
| **Wide** (moderna) | customizable (hasta **16.777.215** por enlace) | máx 16 millones | Redes grandes, MPLS, TE |

> **La confusión clásica:** en IS-IS clásico, TODOS los enlaces cuestan **10** por defecto — no hay "ancho de banda en la métrica" como en OSPF. Elegir rutas solo por cantidad de saltos era el default histórico (de ahí que el CCNA no lo profundice: parece "menos inteligente" que OSPF). La **wide metric** llegó para permitir ingeniería de tráfico de verdad (con costos finos por enlace). Si ves `metric-style wide`, es red moderna.

### 7.2. El comando

```text
router isis
 metric-style wide          ← en redes modernas: SIEMPRE wide (compatible con TE/MPLS)
```

> **Regla de oro práctica:** si monto IS-IS hoy, `metric-style wide` y costos fino por interfaz (`isis metric 1000` sobre el enlace que quiero "achicar"). El narrow era la década del 90; no lo copies en diseño nuevo.

---

## 8. Configuración: IS-IS en 10 minutos

### 8.1. La topología

```text
     ÁREA 49.0001            ÁREA 49.0002
  R1 ────── L1/L2 ──────── R2 (L2) ─────── L1/L2 ────── R3
  (L1)        │                │                (L1)
          R4 (L1)         R5 (L2)              R6 (L1)
```

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

> **La diferencia de config que rompe costumbres:** en OSPF configurás `network ... area`; en IS-IS, **cada interfaz se "engancha" al proceso** con `ip router isis`. Y el NET define el área — no hay un comando "área" separado: el área del router ES su NET. Por eso "cambiar de área" = cambiar el NET (y reconfigurar el neighbor).

---

## 9. Verificación: cómo preguntarle a la red

```text
R1# show isis neighbors

System Id      Type  Interface   IP Address      State  Holdtime  Circuit Id
0000.0000.0002 L2    Gi0/0       10.0.1.2        Up     9         01
                └─ el vecino      └─ nivel de la   └─ Up = vecindad viva
                   (system-id!)      adyacencia
```

```text
R1# show ip route isis
I L1 10.0.2.0/30 [115/20] via 10.0.1.2, 00:10:00, GigabitEthernet0/0
│                        └── AD 115
└─ I = IS-IS    └─ L1: dentro del área (L2 = entre áreas)
```

| Comando | Qué te dice |
|---------|-------------|
| `show isis neighbors` | Vecinos por system-id, nivel y estado |
| `show isis database` | La LSDB (LSPs): quienes publican y los sequence numbers |
| `show isis topology` | La visión de la red desde este router |
| `show ip route isis` | Rutas IS-IS (I = IS-IS; I L1 = intra-área, I L2 = inter-área) |
| `show clns neighbors` | Lo mismo pero en el mundo OSI (detalle fino) |

> **El código de tabla que confunde a todos:** en `show ip route`, IS-IS usa la letra **I**... y ¡EIGRP también usaba "D", OSPF "O", BGP "B", RIP "R"! No hay choque: cada letra es única. Pero OJO: la "I" de IS-IS NO es "interface". Aprendé las letras de la tabla de enrutamiento (las viste en selección de rutas) y leés la tabla sin pensar: D = EIGRP, O = OSPF, I = IS-IS, B = BGP.

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

---

## 12. Comprobá lo que aprendiste

**1. ¿Por qué IS-IS no depende de IP para funcionar?**
<details>
<summary>Ver respuesta</summary>

Porque nació en la pila OSI: usa sus propias PDUs sobre el enlace (nivel 2 directo), no multicast IP ni protocolo IP (a diferencia de OSPF con 224.0.0.5 / protocolo 89). Eso lo hace agnóstico del tipo de dirección (IPv4/IPv6/CLNS) y muy robusto en backbones — y es la razón histórica de que los ISP lo eligieran.
</details>

**2. ¿Qué es un NET y por qué es obligatorio?**
<details>
<summary>Ver respuesta</summary>

NET = Network Entity Title: la dirección OSI del router, formato 49.área.system-id.00. Define el área (en la porción de autoridad+área) Y la identidad (system-id, único por router). Sin NET configurado IS-IS no arranca — es su "matrícula".
</details>

**3. ¿Qué son L1, L2 y L1/L2?**
<details>
<summary>Ver respuesta</summary>

L1 = enrutamiento dentro del área (usa default hacia afuera). L2 = enrutamiento entre áreas (el backbone, que debe ser contiguo). L1/L2 = ambos niveles: el equivalente del ABR de OSPF, con un pie en su área y otro en el backbone L2.
</details>

**4. ¿IS-IS tiene "área 0"?**
<details>
<summary>Ver respuesta</summary>

No. No existe área 0 en IS-IS: la jerarquía es por niveles y el backbone es el nivel 2 (contiguo). La exigencia equivalente a "todo toca el área 0" es "el backbone L2 debe ser contiguo".
</details>

**5. ¿Qué es el DIS y en qué se diferencia del DR de OSPF?**
<details>
<summary>Ver respuesta</summary>

DIS = Designated Intermediate System: el representante del segmento broadcast (como el DR). Diferencias: NO hay BDR/backup (si muere, se reelige), el desempate es prioridad + system-id/MAC, y la resincronización se apoya en CSNP/PSNP.
</details>

**6. ¿Qué significa `metric-style wide`?**
<details>
<summary>Ver respuesta</summary>

Usar métrica amplia (ancho): costos por enlace hasta ~16 millones (vs narrow, default 10 fijo, máx 1023). Es lo correcto en redes modernas y requisito para ingeniería de tráfico/MPLS.
</details>

**7. ¿Cómo se configura el área en IS-IS?**
<details>
<summary>Ver respuesta</summary>

El área está DENTRO del NET (parte de autoridad+área del NET: 49.0001, 49.0002...). No existe un comando "area" separado; y las interfaces se enganchan al proceso con `ip router isis`, no con `network ... area`.
</details>

**8. ¿Qué letra usa IS-IS en la tabla de rutas y qué AD tiene?**
<details>
<summary>Ver respuesta</summary>

**I** (I L1 = intra-área, I L2 = inter-área) y AD **115**. Ojo: no confundir con OSPF (O, 110) ni con EIGRP (D, 90). Detalle fino: si un router aprende la misma ruta por OSPF y IS-IS, gana OSPF por 5 puntos de AD.
</details>

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

---

> **Fuente:** Documentación propia basada en RFC 1142 (IS-IS), RFC 1195 (Integrated IS-IS), CCNA 200-301 Official Cert Guide (W. Odom), Cisco IOS Configuration Guides y material educativo de redes.
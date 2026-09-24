# 38. OSPF Avanzado: DR/BDR, LSA y Multi-Área

**Las piezas que hacen que OSPF escale de 10 a 10.000 routers (y los tipos de LSA que examinan de verdad)**

---

## Índice

- [Lo que viene después del single-area: la escalabilidad](#1-lo-que-viene-después-del-single-area-la-escalabilidad)
- [DR y BDR: el representante del segmento](#2-dr-y-bdr-el-representante-del-segmento)
- [La elección: quién se vuelve DR (la prioridad que todo el mundo calcula mal)](#3-la-elección-quién-se-vuelve-dr-la-prioridad-que-todo-el-mundo-calcula-mal)
- [Los tipos de LSA: los mensajes que arman el mapa](#4-los-tipos-de-lsa-los-mensajes-que-arman-el-mapa)
- [Multi-área: el aplanamiento del mapa](#5-multi-área-el-aplanamiento-del-mapa)
- [ABR y ASBR: los dos roles que hay que saber](#6-abr-y-asbr-los-dos-roles-que-hay-que-saber)
- [Tipos de área especiales: stub, totally stubby y NSSA](#7-tipos-de-área-especiales-stub-totally-stubby-y-nssa)
- [Sumarización: la ruta que condensa miles](#8-sumarización-la-ruta-que-condensa-miles)
- [Configuración de multi-área: la receta completa](#9-configuración-de-multi-área-la-receta-completa)
- [Verificación avanzada: los comandos que revelan todo](#10-verificación-avanzada-los-comandos-que-revelan-todo)
- [Los 5 errores avanzados más comunes](#11-los-5-errores-avanzados-más-comunes)
- [Comprobá lo que aprendiste](#12-comprobá-lo-que-aprendiste)
- [Glosario](#13-glosario)
- [Resumen en 10 puntos](#14-resumen-en-10-puntos)

---

## 1. Lo que viene después del single-area: la escalabilidad

En el tema de OSPF configuraste single-area (todo en el área 0). Funcionó: vecinos `Full`, rutas `O`, ping a todo el mundo. La red era chica, entonces nunca te choqué con las preguntas incómodas:

> - Si meto 50 routers en el mismo segmento Ethernet, ¿cada uno tiene que ser vecino de los otros 49? (45 adyacencias por router...)
> - ¿Qué contiene EXACTAMENTE la LSDB? ¿Cómo viaja "el pedacito de cada router"?
> - ¿Cómo se conectan dos áreas grandes SIN pasar toda la información de una a otra?
> - ¿Qué pasa cuando quiero traer rutas de OTRO protocolo (EIGRP, BGP, estáticas) a OSPF?

Ese es este manual: **las respuestas a esas cuatro preguntas**. Las cuatro respuestas tienen nombre propio: **DR/BDR**, los **tipos de LSA**, **multi-área con ABR**, y **redistribución (ASBR)**.

> **Analogía:** con OSPF aprendiste a manejar un auto en una ciudad chica. Este es el manual de la RUTA NACIONAL: autopistas con peajes (DR/BDR), los tipos de cartel que existen (LSA), cómo se dividen las provincias (áreas) y cómo se entra a otra red de caminos (ASBR). Mismo auto, reglas más grandes.

---

## 2. DR y BDR: el representante del segmento

### 2.1. El problema que resuelven

Imaginá un segmento Ethernet (broadcast) con 6 routers:

```text
       sin DR (el infierno de las adyacencias)
       R1─┬─R2─┬─R3
          │    │
       R4─┴─R5─┴─R6
       Cada router = vecino de los otros 5 = 15 adyacencias
       Cada cambio = flood a 5 vecinos = mucho tráfico y CPU
```

Con **DR (Designated Router)** y **BDR (Backup)**:

```text
            DR = R3 (el representante)
         ┌─────────────────────────┐
       R1─┤                        ├─R2
          │  adyacencias FULL solo │
       R4─┤  con DR y BDR          ├─R5
          └─────────────────────────┘
            BDR = R5 (el suplente)
       DROthers (R1,R2,R4,R6) quedan en 2-Way entre sí
       Adyacencias: cada router con DR + con BDR = mucho menos
```

**Las reglas de oro del DR (memorizá estas tres, son las que examinan):**

| Regla | Detalle |
|-------|---------|
| **El DR se sincroniza con TODOS** | Todos forman adyacencia `Full` con el DR (y con el BDR) |
| **Los DROthers no forman Full entre ellos** | Quedan en **2-Way** — y eso es SALUDABLE, no un problema |
| **El DR reemplaza al hub** | En Ethernet, el DR es el "hub": todos hablan con él, y él con todos (multicast 224.0.0.6 solo DR/BDR) |

> **Analogía:** el DR es el **representante del curso**. No todos hablan con todos (60 adyacencias): todos le hablan a él, y él les pasa los comunicados (flooding de LSA). Si el representante se va (se cayó), el **BDR**, que venía observando todo, toma el cargo al instante.

### 2.2. Qué pasa si el DR se cae

El **BDR** ya estaba en `Full` con todos: tenía la LSDB sincronizada. Cuando el DR muere (Dead timer vencido), el BDR **se convierte en DR** sin re-elección de todo el segmento — porque ya estaba al día. Se elige un BDR nuevo. Eso es "convergencia rápida de OSPF hecha diseño": el backup de LSA ya está listo, no hay que re-sincronizar nada.

> **Cuidado (el mito que todos repiten):** "Si el DR se cae, se elige el DROther con mayor prioridad." MAL. El **BDR es quien sube** (siempre tiene la LSDB al día); recién después se elige un BDR nuevo entre los DROthers. El DR no se "reelige": se REEMPLAZA por el BDR que estaba esperando.

---

## 3. La elección: quién se vuelve DR (la prioridad que todo el mundo calcula mal)

### 3.1. Los criterios, en orden

Cuando un segmento broadcast despierta, los routers eligen al DR/BDR así:

```text
1. Mayor PRIORIDAD (interface)          → `ip ospf priority X` (0-255, default 1)
2. Si empatan: mayor ROUTER ID          → el RID más alto gana
3. Regla implícita: lo que es DR, sigue siendo DR
   ("el que está, está": no hay re-elección salvo caída)
```

**Priority 0** = "nunca quiero ser DR ni BDR" (inútil: quedás DROther data). Priority 255 = "quiero ser DR, por favor".

### 3.2. El detalle que rompe a todos en los labs

> **La elección OSPF es NO PREEMPTIVA.** Si configurás prioridad 200 en R4 DESPUÉS de que R3 ya ganó como DR... R3 sigue siendo DR. La elección ocurre UNA vez (cuando el segmento forma las primeras adyacencias), y no se repite hasta que el DR se cae o reiniciás el proceso OSPF.

Esto explica el 90% de los dolores de cabeza del laboratorio:

```text
"Configuré ip ospf priority 255 en R4 y sigue siendo DR R3... ¿bug de Packet Tracer?"
→ No es bug: la elección ya pasó. clear ip ospf process (o reiniciar) para re-elegir.
```

> **HACELO VOS:** para controlar QUIÉN es el DR de un segmento, configurá la prioridad ANTES de encender OSPF (o reiniciá el proceso después de cambiarla: `clear ip ospf process` — reinicia las vecindades, así que hacelo en ventana de mantenimiento).

### 3.3. Por qué los DROthers siguen escuchando 224.0.0.5

Los Hells los escucha TODO el segmento (224.0.0.5). Los LSA que genera el DR van al 224.0.0.6 (solo DR/BDR) y el DR los retransmite. Los DROthers escuchan el canal general: están al día de los cambios SIN tener adyacencia Full entre sí. Listo: nadie se pierde nada, pero nadie paga el costo de adyacencia con todos.

---

## 4. Los tipos de LSA: los mensajes que arman el mapa

### 4.1. La ficha de los que examinan (tipo 1 al 5)

Cada LSA es un "pedacito de mapa". La LSDB (la del enrutamiento dinámico) se arma con ESTOS tipos:

```text
┌────────┬──────────────────────────┬──────────────────────────────────────┐
│ Tipo   │ Nombre                   │ Qué contiene / quién lo genera        │
├────────┼──────────────────────────┼──────────────────────────────────────┤
│ T1     │ Router LSA               │ "Las interfaces de UN router"         │
│        │                          │ Cada router genera uno por área       │
│ T2     │ Network LSA              │ "Los routers de UN segmento"          │
│        │                          │ Lo genera el DR del segmento          │
│ T3     │ Network Summary          │ "Las redes de la OTRA área"           │
│        │                          │ Lo genera el ABR (resumen de área)    │
│ T4     │ ASBR Summary             │ "Cómo llegar al ASBR"                 │
│        │                          │ Lo genera el ABR                      │
│ T5     │ External (AS-external)   │ "Redes de FUERA de OSPF"              │
│        │                          │ Lo genera el ASBR (redistribución)    │
│ T7     │ NSSA External            │ "Redes externas dentro de NSSA"       │
│        │                          │ (raro pero aparece en exámenes)       │
└────────┴──────────────────────────┴──────────────────────────────────────┘
```

### 4.2. Cómo leerlos (el truco de la LSDB)

> **El patrón que desbloquea todo:** T1 y T2 son "dentro de tu área" (intra-area). T3 y T4 son "lo que el ABR resume de otras áreas" (inter-area). T5 es "lo que vino de afuera" (externo). Cuando veas un LSA en `show ip ospf database`, hacete la pregunta: ¿quién lo generó y para qué área? Con esa pregunta, la tabla de arriba te da la respuesta sola.

Ejemplo de la vida real:

```text
R1# show ip ospf database (resumen)

       Link ID         ADV Router      Age  Seq#       Type
10.0.1.0/30            2.2.2.2         123  0x80000006  Network   ← T2 (el DR, segmento)
10.0.2.0/30            3.3.3.3         95   0x80000004  Router    ← T1 (R3, su red)
192.168.1.0/24         5.5.5.5         400  0x80000008  External  ← T5 (ASBR, redistribuye)
```

El T5 con link ID `192.168.1.0/24` y ADV Router `5.5.5.5` te está diciendo: "esa red NO es OSPF nativa, vino de afuera por el router 5.5.5.5".

### 4.3. El flood (cómo se propaga un LSA)

Recordá lo que viste en el enrutamiento dinámico: el flooding. En OSPF real:

```text
1. R4 detecta un cambio → genera un LSA tipo 1
2. Se lo manda a los vecinos en FULL (al DR también)
3. Cad/Todo router que lo recibe: 1) lo copia a su LSDB,
   2) lo reenvía a todos los vecinos menos al que vino
4. Si llega un LSA repetido (mismo Seq#) → se descarta (inundación finita)
5. Cada router corre SPF y actualiza su tabla
```

El **Seq#** (número de secuencia) es lo que hace al flood FINITO: cada LSA nuevo tiene un numero más alto, y los duplicados se tiran. Sin eso, el LSA daría vueltas para siempre (el fantasma del count to infinity, pero del lado link-state — OSPF lo resuelve de raíz).

> **Dato de examen clásico:** la edad (Age) del LSA sube con el tiempo; si un LSA viejo (Age alto) llega opacado por uno nuevo, se descarta el viejo. La **LSDB siempre gana con el LSA más nuevo**. Esa es la regla de oro del flood.

---

## 5. Multi-área: el aplanamiento del mapa

### 5.1. Por qué una sola área no escala

Con single-area, TODOS los routers comparten la MISMA LSDB: el mapa completo. Con 500 routers y 2.000 redes, cada router guarda 2.000+ LSA y corre SPF sobre todo eso. Cada cambio en cualquier lado → recálculo de TODOS. Es el muro de la escala (LSA en la CPU, memoria y ancho de banda).

### 5.2. La solución: dividir el mapa en provincias

```text
                ÁREA 0 (backbone)
        ┌──────────────────────────────┐
        │  R1 ──── R2 ──── ABR1 ──────│──┐
        │  R9 ──── R10 ─── ABR2 ──────│──│──┐
        └──────────────────────────────┘  │  │
               ┌──────────────────┐       │  │
               │  ÁREA 1 (R6,R7)  │◄──────┘  │
               └──────────────────┘          │
                    ┌──────────────────┐     │
                    │ ÁREA 2 (R8,R11)  │◄────┘
                    └──────────────────┘
```

**Las reglas de oro de multi-área (las que rigen TODO el diseño):**

| Regla | Por qué |
|-------|---------|
| **El área 0 es OBLIGATORIA** (backbone) | Todas las áreas se conectan al backbone; sin él no hay diseño válido |
| **Un ABR separa las LSDB** | Los routers de área 1 NO reciben los LSA internos del área 2: reciben un RESUMEN (T3) |
| **El tráfico entre áreas SIEMPRE pasa por el área 0** | Por diseño del protocolo: los T3 viajan por el backbone |
| **Un router en single-area = toda su OSPF en el área 0** | El single-area ya era multi-área en potencia: solo que con un área |

> **El beneficio invisible pero gigante:** el SPF se corre **por área** en cada router. Un router del área 1 solo corre SPF sobre SU área + los resúmenes (T3) del resto. La CPU, la memoria y el ancho de banda del flood caen en picada. OSPF multi-área no es "una opción de diseño": es el mecanismo de escalabilidad del protocolo.

---

## 6. ABR y ASBR: los dos roles que hay que saber

### 6.1. Los tipos de router OSPF

```text
┌────────────────┐   ┌────────────────┐   ┌────────────────┐
│ Internal       │   │ ABR            │   │ ASBR           │
│ (que no es     │   │ (Area Border   │   │ (Autonomous    │
│  ni ABR ni     │   │  Router)       │   │  System        │
│  ASBR)         │   │                │   │  Boundary      │
│                │   │ ≥2 áreas       │   │  Router)       │
│ 100% OSPF      │   │ Entre área y   │   │ Redistribuye   │
│ (T1 y T2)      │   │  área          │   │  de OTRO       │
└────────────────┘   └────────────────┘   │  protocolo     │
Tipos:              Inter-area (T3/T4)    └────────────────┘
  2. ABR            Genera T3/T4          Sombrero:
  3. ASBR                                    Redistribución
                                            (T5) → tema de redistribución
```

| Rol | Qué hace | Qué genera |
|-----|----------|------------|
| **Internal** | Vive en una sola área | T1, T2 |
| **ABR (Área Border Router)** | En el borde entre 2+ áreas; resume una área para la otra | **T3** (redes), **T4** (ASBR reachability) |
| **ASBR (Autonomous System Boundary Router)** | Trae redes de OTRO protocolo a OSPF (redistribución) | **T5** (externals) |

> **La confusión clásica (resuelta de una vez):** ABR y ASBR NO son excluyentes. Un router puede ser ABR (borde de áreas) Y ASBR (redistribuye) a la vez. Y el ASBR NO necesita estar en el borde de áreas: puede redistribuir dentro de su propia área. Roles, no títulos: cada router puede acumularlos.

> **Analogía:** el ABR es la **aduana entre provincias**: no deja pasar el detalle de cada calle, solo "el resumen de la provincia". El ASBR es el **puerto internacional**: por ahí entra mercadería de otro país (EIGRP, BGP, estáticas) al territorio OSPF.

---

## 7. Tipos de área especiales: stub, totally stubby y NSSA

### 7.1. El problema que resuelven

Las áreas filtran LSA internos (eso ya lo viste: T1/T2 quedan adentro). Pero TODAS las áreas reciben los **T5** (rutas externas del ASBR): si tenés 10.000 rutas redistribuidas, todas llegan a todas las áreas. ¿Y si una área chica no las necesita (solo necesita "salir por la default")? Para eso existen los tipos especiales.

### 7.2. El menú de áreas (la tabla que tenés que dominar)

```text
┌────────────────┬────────────────┬───────────────────────────┬─────────────┐
│ Tipo de área   │ T3 (summaries) │ T5 (externals)            │ Default     │
├────────────────┼────────────────┼───────────────────────────┼─────────────┤
│ Normal         │ ✔ sí          │ ✔ sí                      │ según LSA   │
│ Stub           │ ✔ sí          │ ✘ NO (las bloquea)        │ genera 1    │
│ Totally Stubby │ ✘ NO (solo    │ ✘ NO                       │ genera 1    │
│                │   la default) │                            │             │
│ NSSA           │ ✔ sí          │ ✘ NO (las bloquea;        │ genera 1    │
│                │               │   pero DEJA pasar T7 si    │             │
│                │               │   hay ASBR propio)         │             │
└────────────────┴────────────────┴───────────────────────────┴─────────────┘
```

| Área | Uso típico | Comando |
|------|-----------|---------|
| **Stub** | "Acá no hay ASBR, solo quiero salir" | `area 1 stub` (en TODOS los routers del área) |
| **Totally stubby** | El área más "tranquila" posible | `area 1 stub no-summary` (solo en el ABR) |
| **NSSA** | Stub con ASBR propio adentro | `area 1 nssa` |

> **Regla de oro (la corta y filosa):** `stub` y `nssa` se configuran en TODOS los routers del área (todos hacen la misma area). `no-summary` se configura SOLO en el ABR. ¿Por qué? Porque el ABR es quien decide qué resúmenes deja pasar. El resto del área solo "obedece" con su `stub`/`nssa` a juego.

### 7.3. El caso NSSA explicado en una línea

Un área **NSSA** es "un stub que no puede ser tan tonto": tiene un router que redistribuye (ASBR propio). Como stub no acepta T5, el ASBR de la NSSA genera **T7** (NSSA-external), que el ABR traduce a T5 cuando salen al resto de OSPF. El área queda "aislada" de externos ajenos, pero puede meter los suyos propios.

> **Regla práctica:** si NO hay ASBR en el área → Stub/Totally Stubby. Si HAY ASBR en el área → NSSA. Sin excepción en la mayoría de los casos de examen.

---

## 8. Sumarización: la ruta que condensa miles

### 8.1. El concepto (la secuencia mágica)

Una sumarización es: **una ruta que representa a muchas**. Ya la conocés del tema de selección de rutas (y del de direcciones IP): `192.168.0.0/22` cubre 4 × /24. En OSPF multi-área hay **dos tipos de sumarización** (confundirlos desaprueba):

| Tipo | Dónde se hace | Comando | Qué resume |
|------|---------------|---------|------------|
| **Inter-area** | En el **ABR** | `area 1 range 192.168.0.0 255.255.252.0` | Las redes del área 1 vistas desde afuera (T3) |
| **External** | En el **ASBR** | `summary-address 192.168.0.0 255.255.252.0` | Las rutas redistribuidas (T5) |

### 8.2. El ejemplo que lo aclara todo

Tenés el área 1 con cuatro redes /24 (192.168.0.0, .1.0, .2.0, .3.0). Sin sumarizar, el ABR genera **4 T3** hacia el área 0. Con `area 1 range 192.168.0.0 255.255.252.0`, genera **1 T3**: `192.168.0.0/22`.

```text
ÁREA 1 (4 redes /24)          ABR                  ÁREA 0
192.168.0.0/24   ─┐
192.168.1.0/24   ─┼──►  area 1 range 192.168.0.0 255.255.252.0
192.168.2.0/24   ─┤         │
192.168.3.0/24   ─┘         └───────────────►   UN solo T3: 192.168.0.0/22
```

### 8.3. Los pros y contras (para que no la apliques a ciegas)

| Pro | Contra |
|-----|--------|
| Menos LSA en el backbone (LSDB chica) | Pierde el detalle: si 192.168.1.0 está caída, el T3 /22 sigue anunciándola (rutas "fantasma") |
| Más rápido el SPF de todos | Enrutamiento subóptimo en casos raros (una ruta /22 "de palo" a un destino que tiene camino mejor) |
| Menos memoria en los routers | Requiere que las redes sean **contiguas y consecutivas** (no sirve resumir redes sueltas) |

> **La regla de oro de la sumarización:** solo resumí redes que son **contiguas y del mismo tamaño** (o múltiplos). `192.168.0.0/22` requiere 4 redes /24 seguidas de 0 a 3. Si tenés 192.168.0.0/24 y 192.168.5.0/24, NO son resumibles sin colar redes que no existen. Y el "rastro fantasma": el enrutamiento hacia la red caída se va a la default/sumaría hasta que expire — aceptalo o no lo diferencies.

---

## 9. Configuración de multi-área: la receta completa

### 9.1. La topología (ABR de por medio)

```text
              ÁREA 0                        ÁREA 1
   ┌─────────────────────────┐      ┌──────────────────┐
   │  R1 ── R2 ──── ABR1     │──────│ ABR1 ── R4       │
   │  (10.0.0.0/30)    R3    │ 10.0.1.0/30  R5         │
   │       └─ 10.0.2.0/30 ──  │      │ (10.0.3.0/30)   │
   └─────────────────────────┘      └──────────────────┘
        ABR1 interface:
        G0/0 10.0.1.1/30 → área 0   (sí, el ABR tiene UN pie en cada área)
        G0/1 10.0.0.1/30 → área 1
        loopback 0: 4.4.4.4
```

### 9.2. La configuración del ABR (solo el ABR es distinto)

```cisco
! ABR1
interface loopback 0
 ip address 4.4.4.4 255.255.255.255
!
interface GigabitEthernet0/0      ! hacia el backbone (área 0)
 ip address 10.0.1.1 255.255.255.252
 no shutdown
!
interface GigabitEthernet0/1      ! hacia el área 1
 ip address 10.0.0.1 255.255.255.252
 no shutdown
!
router ospf 1
 router-id 4.4.4.4
 network 10.0.1.0 0.0.0.3 area 0      ! interfaz del backbone → area 0
 network 10.0.0.0 0.0.0.3 area 1      ! interfaz del área 1 → area 1
 network 4.4.4.4 0.0.0.0 area 0       ! la loopback, adonde la pongas
 area 1 range 192.168.0.0 255.255.252.0   ! sumarización inter-area (si las redes del área 1 son esas)
```

```cisco
! R4 (área 1, internal)
interface loopback 0
 ip address 5.5.5.5 255.255.255.255
!
interface GigabitEthernet0/0
 ip address 10.0.0.2 255.255.255.252
 no shutdown
!
router ospf 1
 router-id 5.5.5.5
 network 10.0.0.0 0.0.0.3 area 1
 network 5.5.5.5 0.0.0.0 area 1
```

> **La sintaxis que desbloquea multi-área:** `network X wildcard area N` — el **mismo proceso OSPF puede tener interfaces en áreas distintas**: es el ABR. La magia no es un comando "soy ABR": es TENER interfaces en 2+ áreas. Reconocelo por eso, no por un check "ABR feature".

### 9.3. La receta paso a paso (multi-área en 5 pasos)

```text
1. Diseñá las áreas en papel (NUNCA configures sin dibujar el mapa)
2. Definí el ABR (el router que tocara 2 áreas) y su RID (loopback)
3. Configurá cada interfaz del ABR con su `network ... area N` correcta
4. Configurá los internals de cada área (todo su OSPF en SU area)
5. Verificá: `show ip ospf neighbor` en el ABR muestra vecinos en 2 áreas
   (ver un vecino en área 0 y otro en área 1 confirma que sos ABR)
```

---

## 10. Verificación avanzada: los comandos que revelan todo

### 10.1. Los 4 comandos que definen el nivel

| Comando | Qué revela |
|---------|------------|
| `show ip ospf neighbor` | Prioridad, estado (FULL/DR, FULL/BDR, 2-Way/DROther) |
| `show ip ospf database` | Los LSA: quién los generó (ADV Router), de qué tipo (T1-T5) |
| `show ip ospf database router 4.4.4.4` | El detalle de UN LSA tipo 1 (qué redes anunció 4.4.4.4) |
| `show ip ospf border-routers` | Cómo se llega al ABR/ASBR (rutas hacia los roles) |

### 10.2. La lectura de un neighbor (modo detective)

```text
R1# show ip ospf neighbor

Neighbor ID     Pri   State           Dead Time   Address         Interface
2.2.2.2           1   FULL/BDR        00:00:39    10.0.0.2        Gi0/0
4.4.4.4           5   FULL/DR         00:00:37    10.0.1.2        Gi0/1
```

Del ejemplo: R2 es BDR de un segmento, el ABR (RID 4.4.4.4) es DR con prioridad 5, y el vecino del Gi0/1 (área 1) está FULL. Tres datos, tres historias: segmento con DR/BDR, prioridad configurada en el ABR, y vecino del área 1 arriba.

### 10.3. El show que casi nadie hace (y que salva vidas)

```text
R1# show ip ospf border-routers

OSPF Process 1 internal Routing Table
Codes: i - Intra-area route, I - Inter-area route

i 4.4.4.4 [1] via 10.0.1.2, ABR, Area 0, SPF 5
I 5.5.5.5 [2] via 10.0.1.2, ASBR, Area 0, SPF 3
```

> Acá ves el mapa de los ROLES: 4.4.4.4 es ABR (intra-area, costo 1), 5.5.5.5 es ASBR (inter-area, costo 2). **¿Pregunta de examen en serio? "¿Qué comando muestra los ABR y ASBR conocidos?" → `show ip ospf border-routers`.** No lo olvides.

---

## 11. Los 5 errores avanzados más comunes

| # | Error | Síntoma | Fix |
|---|-------|---------|-----|
| 1 | **Configurar `area X stub` solo en un lado** | Vecindad no levanta (los tipos de área no matchean) | `stub` en TODOS los routers del área |
| 2 | **Esperar que el DR cambie al subir prioridad** | R3 sigue siendo DR con R4 ya en 255 | La elección no es preemptiva: `clear ip ospf process` |
| 3 | **Sacar T5 del área con stub sin querer** | Las rutas externas desaparecen del área | Neutral: stub bloquea T5 POR DISEÑO; si necesitás externos → NSSA |
| 4 | **OJO con el ABR + `network` en la loopback** | La loopback queda en un área que no querés | Elegí conscientemente en qué área publicás la loopback (convención: área 0) |
| 5 | **Sumarización mal hecha (redes no contiguas)** | Rutas fantasma o tráfico a ninguna parte | `area N range` exige contigüidad + consecutividad |

> **El error campeón de los labs multitarea:** "configuré stub en R5 (área 1) pero el ABR sigue mandando T3" — porque `stub no-summary` (totally) es el que borra T3, y además va SOLO en el ABR. Stub plano solo borra T5. Tipo de área por tipo de área, no "más o menos filtro": la tabla del 7.2 es tu mapa.

---

## 12. Comprobá lo que aprendiste

**1. ¿Por qué existe el DR en un segmento broadcast?**
<details>
<summary>Ver respuesta</summary>

Para evitar el festival de adyacencias: con N routers, sin DR serían N×(N−1)/2 adyacencias Full y floods a todos. Con DR, todos se sincronizan SOLO con el DR (y con el BDR); los DROthers quedan en 2-Way entre sí. Menos CPU, menos tráfico, convergencia más controlada.
</details>

**2. ¿Qué pasa cuando se cae el DR? ¿Se "reeelige"?**
<details>
<summary>Ver respuesta</summary>

NO se reelige desde cero: el BDR ya tiene la LSDB al día (estaba en Full con todos) y asciende a DR al instante. Después se elige un BDR nuevo entre los DROthers. El BDR es el reemplazo diseñado, no un sorteo.
</details>

**3. ¿Cómo se elige al DR en un segmento?**
<details>
<summary>Ver respuesta</summary>

Mayor prioridad (`ip ospf priority`, default 1; 0 = nunca), y si empatan, mayor Router ID. La elección es NO preemptiva: lo que es DR sigue siendo DR hasta que caiga o se reinicie el proceso (`clear ip ospf process`). Prioridad 255 = "quiero ganar".
</details>

**4. Nombra los tipos de LSA 1-5 y quién genera cada uno.**
<details>
<summary>Ver respuesta</summary>

T1 Router LSA (cada router, por área). T2 Network LSA (el DR del segmento). T3 Network Summary (el ABR, resumiendo áreas). T4 ASBR Summary (el ABR, hacia el ASBR). T5 External (el ASBR, redes de fuera de OSPF). Patrón: T1/T2 intra-área, T3/T4 inter-área, T5 externo.
</details>

**5. ¿Qué diferencia hay entre ABR y ASBR?**
<details>
<summary>Ver respuesta</summary>

ABR: router con interfaces en 2+ áreas; resume áreas entre sí (genera T3/T4). ASBR: router que redistribuye rutas de OTRO protocolo (o estáticas) hacia OSPF (genera T5). Un mismo router puede ser ambos. Se ven con `show ip ospf border-routers`.
</details>

**6. ¿Cuál es la diferencia entre stub y totally stubby?**
<details>
<summary>Ver respuesta</summary>

Stub bloquea T5 (externas) pero recibe T3 (resúmenes inter-área). Totally stubby (`no-summary`, configurado en el ABR) bloquea también T3 y solo deja la default. NSSA es el "stub con ASBR propio" (usa T7).
</details>

**7. ¿Cómo y dónde se suma una ruta en OSPF multi-área?**
<details>
<summary>Ver respuesta</summary>

En el ABR con `area N range X wildcard` (resume las redes del área N para el resto). En el ASBR con `summary-address` (resume lo redistribuido, T5). Regla: redes contiguas y consecutivas; el beneficio es LSDB chica, el costo es rutas "fantasma" hacia redes caídas.
</details>

**8. ¿Qué comando muestra ABR y ASBR conocidos?**
<details>
<summary>Ver respuesta</summary>

`show ip ospf border-routers` — muestra la tabla interna hacia los routers de borde con su tipo (ABR/ASBR) y costo. Pregunta clásica de examen, respuesta clásica.
</details>

---

## 13. Glosario

| Término | Qué es |
|---------|--------|
| **DR / BDR** | Designated Router / Backup: concentradores de adyacencia en segmentos broadcast; el BDR reemplaza al DR si cae |
| **DROther** | Router que no es DR ni BDR; se sincroniza solo con ambos, queda en 2-Way con los demás |
| **LSA tipo 1-5** | Router/Network/Summary/ASBR-Summary/External: los "pedacitos de mapa" que arman la LSDB |
| **Seq#, Age** | Número de secuencia y edad del LSA: controlan el flood (duplicados se descartan) |
| **Multi-área** | División de la red en áreas para aislar LSDB; el área 0 (backbone) es obligatoria |
| **ABR** | Router con interfaces en 2+ áreas; resume (T3/T4) entre áreas |
| **ASBR** | Router que redistribuye rutas externas hacia OSPF (T5); la redistribución tiene su propio tema |
| **Stub / Totally Stubby / NSSA** | Áreas que filtran T5 (stub), T3+T5 (totally) o aceptan solo externos propios (NSSA, T7) |
| **Sumarización** | Una ruta que representa a muchas: `area N range` (ABR) o `summary-address` (ASBR) |
| **Flooding** | Propagación de LSA a toda el área; finito gracias a Seq# |

---

## 14. Resumen en 10 puntos

1. **El DR resuelve el infierno de adyacencias**: en broadcast, todos se sincronizan solo con DR/BDR; los DROthers en 2-Way entre sí es sano.
2. **Elección del DR**: mayor prioridad (default 1, 0 = nunca), empate por RID. Y NO es preemptiva: reiniciá el proceso si cambiás prioridad.
3. **BDR = plan B diseñado**: sube a DR cuando este cae, con la LSDB ya al día — convergencia rápida garantizada por diseño.
4. **Los LSA son el mapa**: T1/T2 intra-área (router/segmento), T3/T4 inter-área (lo que resume el ABR), T5 externo (lo que trae el ASBR).
5. **Multi-área = escalabilidad**: cada área mantiene su LSDB; el SPF corre por área; todo pasa por el área 0.
6. **ABR ≠ ASBR**: ABR cruza áreas (T3/T4); ASBR cruza protocolos (T5); un router puede ser ambos.
7. **Áreas especiales**: stub (no T5), totally stubby (ni T3, solo default), NSSA (stub con ASBR propio vía T7).
8. **Sumarización**: `area N range` en el ABR, `summary-address` en el ASBR; exige redes contiguas; crea rutas fantasma.
9. **`show ip ospf border-routers`** revela ABR/ASBR conocidos; `show ip ospf database` muestra los LSA con su generador (ADV Router).
10. **Diagnóstico avanzado**: tipo de área que no matchea y DR que no se reelige son los dos errores campeones de los labs.

---

> **Fuente:** Documentación propia basada en RFC 2328 (OSPFv2), RFC 3101 (NSSA), CCNA 200-301 Official Cert Guide (W. Odom), Cisco IOS Configuration Guides y material educativo de redes.
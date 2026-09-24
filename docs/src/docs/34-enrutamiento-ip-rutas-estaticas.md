# 34. Enrutamiento IP y Rutas Estáticas

**Cómo un router decide hacia dónde mandar cada paquete**

---

## Índice

- [El problema que resuelve el enrutamiento](#1-el-problema-que-resuelve-el-enrutamiento)
- [¿Qué hace un router? La decisión de reenvío](#2-qué-hace-un-router-la-decisión-de-reenvío)
- [La tabla de enrutamiento: el mapa del router](#3-la-tabla-de-enrutamiento-el-mapa-del-router)
- [Cómo leer `show ip route`: el idioma de las rutas](#4-cómo-leer-show-ip-route-el-idioma-de-las-rutas)
- [Rutas conectadas y locales: la memoria del router](#5-rutas-conectadas-y-locales-la-memoria-del-router)
- [Rutas estáticas: el administrador tiene la última palabra](#6-rutas-estáticas-el-administrador-tiene-la-última-palabra)
- [Next-hop vs interfaz de salida: dos formas de decir lo mismo](#7-next-hop-vs-interfaz-de-salida-dos-formas-de-decir-lo-mismo)
- [La ruta por defecto: el Plan B universal](#8-la-ruta-por-defecto-el-plan-b-universal)
- [Floating static route: la redundancia manual](#9-floating-static-route-la-redundancia-manual)
- [El viaje de un paquete paso a paso](#10-el-viaje-de-un-paquete-paso-a-paso)
- [Aplicación: laboratorio guiado en Packet Tracer](#11-aplicación-laboratorio-guiado-en-packet-tracer)
- [Errores comunes y cómo diagnosticarlos](#12-errores-comunes-y-cómo-diagnosticarlos)
- [Comprobá lo que aprendiste](#13-comprobá-lo-que-aprendiste)
- [Glosario](#14-glosario)
- [Resumen en 10 puntos](#15-resumen-en-10-puntos)

---

## 1. El problema que resuelve el enrutamiento

### 1.1. El edificio con dos direcciones

En los manuales anteriores viste que cada dispositivo tiene una dirección IP, que las redes se dividen en subredes y que los paquetes viajan envueltos en sobres (encapsulación). Ahora viene la pregunta que todo eso dejó pendiente:

> Si R1 está conectado solo a R2, y R2 está conectado a una red que R1 ni siquiera conoce... **¿cómo sabe R1 que tiene que mandar el paquete por R2?** ¿Y por qué no por R3, que también está conectado?

Esa es exactamente la pregunta que resuelve el **enrutamiento** (routing): la disciplina que decide **por dónde** viaja cada paquete para llegar de su origen a su destino, aunque el origen y el destino estén separados por muchas redes intermedias.

> **Analogía del sistema postal (la continuamos):** en el manual de modelos viste que el correo funciona por capas. El enrutamiento es la **oficina de clasificación**: cuando llega una carta con un código postal, alguien mira un mapa (o una tabla) y decide "esta carta va por la ruta 9 al centro de distribución de Córdoba". Ese "alguien con el mapa" es el router. La tabla con los códigos postales y las rutas es la **tabla de enrutamiento**.

### 1.2. La idea madre de este manual

> **Un router NO "sabe" hacia dónde va un paquete por arte de magia. Toma decisiones paquete por paquete, mirando SU tabla de enrutamiento: para cada destino, elige la entrada más específica que tenga y manda el paquete al "próximo salto" (next-hop) que esa entrada le indica.**

Todo lo que sigue en este manual (y en los próximos dos: selección de rutas y enrutamiento dinámico) es una profundización de esa frase. Si la entendés, ya ganaste la mitad de la batalla.

### 1.3. Qué vas a aprender acá

- Qué decide un router y con qué herramienta (la tabla de enrutamiento).
- A leer una tabla de rutas como un profesional (`show ip route`).
- De dónde salen las rutas: conectadas, locales, estáticas.
- Cómo se escribe una **ruta estática** y la **ruta por defecto**.
- Qué es una **floating static route** (la primera idea de redundancia).
- Un laboratorio guiado para verlo funcionando en Packet Tracer.

---

## 2. ¿Qué hace un router? La decisión de reenvío

### 2.1. Dos trabajos distintos: enrutar y reenviar

Los routers hacen dos trabajos que los principiantes confunden:

| Trabajo | Nombre técnico | Qué es | Cada cuánto |
|---------|----------------|--------|-------------|
| **Decidir la ruta** | Enrutamiento (routing) | Elegir la mejor ruta para llegar a cada destino y guardarla en la tabla | Cuando se aprende una ruta nueva (cambio de topología, configuración) |
| **Mandar los paquetes** | Reenvío (forwarding) | Mirar la tabla, encontrar la entrada para el destino, enviar el paquete al next-hop | Por CADA paquete que llega, millones de veces por segundo |

> **Analogía:** el enrutamiento es el trabajo del que **diseña** los recorridos de los micros en una ciudad (una vez por mes). El reenvío es el trabajo del **chofer** que sigue el recorrido con su micro (cada viaje, todos los días). Uno piensa, el otro ejecuta.

En este manual estudiamos el primero (cómo se arma la tabla); el segundo es mecánico y rapidísimo, y solo te interesa cuando algo no funciona (eso lo ves en el manual de troubleshooting).

### 2.2. El router no tiene "cerebro": tiene tablas

Momento importante, porque separa a los que entienden de los que memorizan:

> **El router NO analiza el contenido de tus datos.** Nunca mira "la carta". Solo mira la **etiqueta**: la dirección IP destino del paquete. Con esa sola información consulta su tabla y decide.

Por eso los routers pueden procesar millones de paquetes por segundo: porque no *piensan*, **comparan y reenvían**. Todo el "pensamiento" está en la tabla, y todo el trabajo de armar esa tabla está en los protocolos de enrutamiento (o en tu mano, cuando configurás rutas estáticas).

### 2.3. Las tres preguntas de cada paquete

Cuando un paquete llega a un router, este se hace tres preguntas:

1. **¿Está el destino en una red conectada a mí?** → Entonces lo mando directamente por esa interfaz (a la MAC de ese vecino, como viste en capa 2).
2. **¿Tengo una ruta hacia ese destino?** → Entonces lo mando al next-hop que dice mi tabla.
3. **¿No tengo nada?** → Si tengo ruta por defecto, la uso. Si no tengo ni eso... **el paquete se descarta** y el router manda un ICMP "destination unreachable" al origen.

> **Dato que sorprende a todos:** un router NO reenvía un paquete "porque sí" a todos lados. Si no tiene ruta (ni siquiera default), **tira el paquete**. Eso explica por qué un router mal configurado "se come" el tráfico: no es que lo pierda, es que no sabe a quién pasárselo.

---

## 3. La tabla de enrutamiento: el mapa del router

### 3.1. Qué es

La **tabla de enrutamiento** (tabla de rutas, routing table) es una lista que el router mantiene en memoria con todas las rutas que conoce: para cada red de destino, guarda el *próximo salto* y la *interfaz de salida*.

En Cisco IOS se mira con:

```cisco
show ip route
```

### 3.2. Una tabla real, anotada

Mirá esta salida real (topología R1 conectado a dos redes):

```cisco
R1# show ip route
Codes: C - connected, S - static, R - RIP, M - mobile, B - BGP
       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area
       N1 - OSPF NSSA external type 1, N2 - OSPF NSSA external type 2
       E1 - OSPF external type 1, E2 - OSPF external type 2, E - EGP
       i - IS-IS, L1 - IS-IS level-1, L2 - IS-IS level-2, ia - IS-IS inter area
       * - candidate default, U - per-user static route, o - ODR
       P - periodic downloaded static route

Gateway of last resort is 10.0.0.2 to network 0.0.0.0

     10.0.0.0/8 is variably subnetted, 2 subnets, 2 masks
C       10.0.12.0/30 is directly connected, GigabitEthernet0/0
L       10.0.12.1/32 is directly connected, GigabitEthernet0/0
S       192.168.1.0/24 [1/0] via 10.0.12.2, GigabitEthernet0/0
S*      0.0.0.0/0 [1/0] via 10.0.12.2, GigabitEthernet0/0
```

Cada línea tiene partes que ya podés empezar a leer:

```
S   192.168.1.0/24  [1/0]  via 10.0.12.2,  GigabitEthernet0/0
│         │           │           │              │
│         │           │           │              └── Interfaz de salida
│         │           │           └── Next-hop (a quién se lo paso)
│         │           └── [Administrative Distance / Métrica]
│         └── Red destino (con su máscara /24)
└── Origen de la ruta (S = static, C = connected, etc.)
```

> **Analogía:** la tabla es la guía de rutas de un chofer de micro: lista de destinos (redes), con la indicación "para llegar a X, doblá en la calle Y" (el next-hop) y "salí por la puerta Z" (la interfaz). El chofer no decide nada: **sigue la guía**.

### 3.3. El "gateway of last resort"

Fijate la línea que dice:

```cisco
Gateway of last resort is 10.0.0.2 to network 0.0.0.0
```

Eso significa: "si no encuentro ninguna otra ruta, mando todo al 10.0.0.2". Es la **ruta por defecto** (sección 8). La vas a ver marcada con `S*` (el asterisco = candidate default).

---

## 4. Cómo leer `show ip route`: el idioma de las rutas

### 4.1. Las letras que tenés que reconocer

Cada ruta de la tabla empieza con una letra que dice **de dónde vino**. Esas letras aparecen en la cabecera del comando y son EL idioma del enrutamiento:

| Código | Origen | Quién la pone |
|:------:|--------|---------------|
| `C` | **Connected** (conectada) | El router mismo: es una red pegada a una de sus interfaces |
| `L` | **Local** (local) | El router mismo: la IP propia de esa interfaz |
| `S` | **Static** (estática) | Vos, el administrador, a mano |
| `S*` | Static por defecto | Vos, con destino `0.0.0.0/0` |
| `D` | **EIGRP** | Protocolo dinámico (lo ves más adelante, con cada protocolo en su tema) |
| `O` | **OSPF** | Protocolo dinámico |
| `R` | **RIP** | Protocolo dinámico (histórico) |
| `B` | **BGP** | Protocolo dinámico externo |
| `i` | **IS-IS** | Protocolo dinámico (proveedores) |

> **Consejo de estudio:** en este manual solo necesitás dominar `C`, `L` y `S`. Las demás (`O`, `D`, `B`...) aparecen cuando los protocolos dinámicos las aprenden solos — eso es literalmente el tema de los protocolos dinámicos, que vienen enseguida.

### 4.2. Las dos columnas de la derecha: [AD/métrica]

Fijate este detalle:

```cisco
S       192.168.1.0/24 [1/0] via 10.0.12.2
```

El par `[1/0]` son dos números clavados:

- **1** = **Administrative Distance** (AD): qué tan "confiable" es la fuente de esta ruta. Las estáticas tienen AD 1 (muy confiables, porque las escribiste vos).
- **0** = **métrica** de la ruta. En estáticas es 0 casi siempre.

No profundices todavía: el tema de selección de rutas está dedicado entero a "cuando hay dos rutas para el mismo destino, ¿cuál gana?" — y esa pregunta se responde con AD y métrica. Acá solo anotá que existen.

### 4.3. Subredes variables

La línea `10.0.0.0/8 is variably subnetted, 2 subnets, 2 masks` es solo una forma que tiene IOS de agrupar: dice "dentro de este bloque /8 hay subredes de distinto tamaño". No es una ruta en sí; es un aviso de organización.

---

## 5. Rutas conectadas y locales: la memoria del router

### 5.1. Las rutas "gratis"

Cuando prendés un router y le ponés IP a una interfaz bien configurada (activa, con cable y link up), el router **aprende solo** dos rutas:

```cisco
C       10.0.12.0/30 is directly connected, GigabitEthernet0/0
L       10.0.12.1/32 is directly connected, GigabitEthernet0/0
```

| Ruta | Qué significa |
|------|---------------|
| `C` | "Conozco la red **10.0.12.0/30** porque está pegada a mi interfaz G0/0. Los paquetes para esa red salen por acá." |
| `L` | "La dirección **10.0.12.1** es la mía, la de mi interfaz G0/0. Los paquetes dirigidos a esa IP soy yo." |

> **Analogía:** las rutas conectadas son el **barrio donde vivo**: no necesito que nadie me lo enseñe, lo conozco. La ruta local es **mi propia casa**: sé exactamente que esa dirección soy yo.

### 5.2. La condición de oro de toda ruta conectada

> **Regla de oro:** una ruta conectada aparece SOLO si la interfaz está **up/up** (capa 1 y capa 2 funcionando: cable conectado, línea activa). Si la interfaz está *administratively down* o el cable está cortado, la ruta `C` desaparece de la tabla.

Este es el primer y más común "fantasma" de todo troubleshooting: *"el router no tiene la ruta"* cuando en realidad **la interfaz está apagada**. Siempre, SIEMPRE, verificá primero las interfaces:

```cisco
show ip interface brief
```

```cisco
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0     10.0.12.1       YES manual up                    up
GigabitEthernet0/1     192.168.1.254   YES manual up                    up
```

Si ves `administratively down`, el problema no es de ruta: es que alguien apagó la interfaz (o no la encendió con `no shutdown`).

---

## 6. Rutas estáticas: el administrador tiene la última palabra

### 6.1. Qué es una ruta estática

Una **ruta estática** es una ruta que **vos escribís a mano** en la configuración del router. Le decís: "para llegar a la red X, pasale el paquete al router Y".

Se configura así:

```cisco
ip route <red_destino> <máscara> <next-hop>
```

Ejemplo clásico: R1 quiere llegar a la red `192.168.2.0/24`, que está del otro lado de R2 (IP `10.0.12.2`):

```cisco
R1(config)# ip route 192.168.2.0 255.255.255.0 10.0.12.2
```

Después de ese comando, la tabla de R1 muestra:

```cisco
S       192.168.2.0/24 [1/0] via 10.0.12.2, GigabitEthernet0/0
```

> **Analogía:** la ruta estática es el **recorrido escrito a mano** que le dejás en el asiento al chofer nuevo: "Para ir al depósito, doblá en la estación de servicio". El chofer lee eso y obedece. No pregunta, no aprende, no duda.

### 6.2. Qué se puede (y qué no) con estáticas

| Lo que podés hacer | Lo que NO podés hacer cómodamente |
|--------------------|-----------------------------------|
| Conectar redes chicas (2-5 routers) | Redes grandes: son cientos de rutas escritas a mano |
| Crear rutas por defecto (default route) | Reaccionar a fallas: si un enlace cae, la estática no "se entera" |
| Redundancia simple (floating static) | Adaptarse a caminos alternativos automáticamente (hay que escribir todas las combinaciones a mano) |
| Laboratorios y exámenes (rápidas y predecibles) | Mantenimiento: cada cambio de topología = cambiar rutas a mano |

> **Ventaja clave de la estática:** NO consume ancho de banda (no "habla" con nadie), NO es vulnerable a ataques de protocolos, y su comportamiento es 100% predecible. Por eso en la práctica se usa mucho la default route estática "hacia internet", incluso en redes gigantes.

### 6.3. El "camino de ida" no alcanza: el problema del ping que no vuelve

Este es EL error de principiante por excelencia del enrutamiento:

> Configuraste la estática en R1 hacia R2, hacés `ping 192.168.2.2` desde R1... y no responde. ¿Por qué? **Porque la ruta de vuelta no existe.** El paquete llega a la red 192.168.2.0 (R2 lo recibe), pero R2 no tiene ninguna ruta para volver a la red de R1. Sin ruta de retorno, descarta el paquete de respuesta... o la respuesta se pierde en el vacío.

**El enrutamiento es simétrico en teoría pero NO se deduce solo:** cada router DEBE tener rutas para llegar a todos los destinos por donde tiene que volver el tráfico. Regla del profesional:

> **Regla de oro:** SIEMPRE que configures una ruta en un router, preguntate: "¿y el router del otro lado, cómo vuelve?". El ping que no vuelve casi siempre es una ruta de vuelta que falta.

---

## 7. Next-hop vs interfaz de salida: dos formas de decir lo mismo

### 7.1. Las dos variantes del comando

Hay (principalmente) dos formas de escribir una ruta estática en Cisco:

```cisco
! Variante A: next-hop (la más común y recomendada)
ip route 192.168.2.0 255.255.255.0 10.0.12.2

! Variante B: interfaz de salida
ip route 192.168.2.0 255.255.255.0 g0/0
```

| Variante | Le dice al router | Cuándo se usa |
|----------|-------------------|---------------|
| **A. Next-hop** | "Pasale el paquete a la IP 10.0.12.2" | Casi siempre. El router resuelve la MAC del vecino con ARP y manda. |
| **B. Interfaz** | "Sacalo por mi interfaz g0/0 y que se arregle" | Enlaces punto a punto (seriales) o cuando no conocés la IP del vecino. |

> **Ojo con la variante B en Ethernet:** si ponés solo `g0/0` en un enlace Ethernet compartido por varios routers, el router manda el paquete por esa interfaz **sin saber a quién** — pregunta con ARP por el destino final, y si el destino final no está en ese segmento, puede fallar. En enlaces seriales punto a punto no hay problema. Por eso, **regla práctica: en Ethernet, usá siempre next-hop.**

La forma completa combina ambas para ser muy explícito:

```cisco
ip route 192.168.2.0 255.255.255.0 10.0.12.2 g0/0
```

### 7.2. Y si el next-hop no es alcanzable...

Si el next-hop que pones NO existe o no es alcanzable (no tenés ruta hacia él), el router rechaza la configuración o la marca como inactiva. Verás la ruta pero con una `?` o directamente no funcionará el reenvío. La verificación honesta de una estática siempre es un ping **desde el destino hacia atrás** o `show ip route` bien leído.

---

## 8. La ruta por defecto: el Plan B universal

### 8.1. Qué es

La **ruta por defecto** (default route) le dice al router: *"todo lo que no sepas a dónde mandar, mandalo acá"*. Es el "cajón de todo lo que no tiene lugar".

> **Analogía:** es el número de **informes** del edificio postal: cuando el cartero no sabe en qué piso vive alguien, pregunta en informes. La respuesta casi nunca es "volvé a tu casa": es "mirá, todo lo que no sabés mandalo a la central".

### 8.2. Cómo se configura

```cisco
R1(config)# ip route 0.0.0.0 0.0.0.0 10.0.12.2
```

¿Por qué `0.0.0.0 0.0.0.0`? Porque esa "red" con máscara de todo ceros es la menos específica posible: **matchea con cualquier destino**. Cualquier paquete que no tenga una ruta más específica cae en esta.

En la tabla aparece así:

```cisco
S*      0.0.0.0/0 [1/0] via 10.0.12.2, GigabitEthernet0/0
```

El `*` marca que es la default candidate (la "gateway of last resort").

### 8.3. Por qué es tan importante

| Escenario | Por qué la default es la solución |
|-----------|-----------------------------------|
| Router de borde de una empresa | "Todo lo que no es de mi empresa, salí por acá hacia el ISP" — UNA ruta reemplaza a millones |
| Router de tu casa | Tu router doméstico tiene una default route hacia el módem del ISP: no conoce "internet", solo conoce "salí por la puerta de afuera" |
| Simplicidad | En vez de escribir rutas para cada red lejana, escribís UNA para todo lo desconocido |

> **Dato clave para entender internet:** ningún router de internet tiene una ruta para "toda internet". Tienen rutas para redes específicas... y una **default route** para todo lo demás. Internet no es una red gigante que todos conocen: es una red donde cada uno **sabe un pedacito y pasa el resto hacia arriba**.

---

## 9. Floating static route: la redundancia manual

### 9.1. El problema: ¿y si el enlace principal se cae?

Pensá en dos routers conectados por DOS caminos: un enlace principal (rápido, caro) y uno de respaldo (lento, barato, olvidado). Si el principal se cae, lo ideal es que el tráfico pase automáticamente por el respaldo.

Con una sola estática, eso NO pasa: cuando el enlace principal cae, la ruta desaparece y no hay reemplazo. La red se queda sin camino.

### 9.2. La solución: dos rutas con AD distintas

Acá entra la **Administrative Distance** (AD) que viste en la sección 4: el número que dice "qué tan confiable es la fuente".

Podés escribir DOS rutas estáticas al mismo destino con AD diferentes:

```cisco
! Ruta principal (AD 1, la default de las estáticas)
ip route 192.168.2.0 255.255.255.0 10.0.12.2

! Ruta de respaldo (AD 200 — solo se usa si la principal desaparece)
ip route 192.168.2.0 255.255.255.0 10.0.13.2 200
```

| Ruta | AD | Estado |
|------|:--:|--------|
| Principal (`via 10.0.12.2`) | 1 | **Activa**: gana siempre que exista |
| Respaldo (`via 10.0.13.2`) | 200 | **Dormida**: esperando en la tabla |

**¿Cuándo se activa el respaldo?** Cuando la principal **desaparece** de la tabla (porque el enlace se cayó o el next-hop dejó de ser alcanzable). Ahí el router elige la siguiente con menor AD, y el respaldo —¡que estaba guardado como "candidate"!— se activa.

> **Analogía:** es el **neumático de auxilio**. Está en el auto (guardado en la tabla), pero solo se usa cuando la rueda principal falla. Nadie conduce toda la vida con el auxilio; es un plan de contingencia. En redes, ese patrón se llama **floating static route** porque "flota" en la tabla esperando que la principal se hunda.

### 9.3. El detalle que hay que entender

> La ruta de respaldo **está configurada pero dormida**: no aparece como ruta activa mientras la principal exista. Si hacés `show ip route`, solo vas a ver la principal. El respaldo aparece recién cuando la principal muere. "Floating" significa exactamente eso: aparece y desaparece según la salud de la principal.

Regla práctica del AD en estáticas:

| Usamos | AD | Por qué |
|:------:|:--:|---------|
| Estática normal | 1 (default) | Gana a casi todo |
| Floating static | 200 o más | Pierde contra dinámicas, gana contra nada (es el último recurso) |

---

## 10. El viaje de un paquete paso a paso

### 10.1. La topología completa

Armemos el caso que vamos a usar en el laboratorio:

```text
PC-A (192.168.1.10)
   │
   │  red 192.168.1.0/24
   │
┌──┴──┐       10.0.12.0/30      ┌──┴──┐
│ R1  │ ────────────────────── │ R2  │
│  .1 │                         │  .2 │
└──┬──┘                         └──┬──┘
   │                                │  red 192.168.2.0/24
   │                                │
                                PC-B (192.168.2.10)
```

Interfaces:

```text
R1: g0/0 = 10.0.12.1/30    g0/1 = 192.168.1.254/24
R2: g0/0 = 10.0.12.2/30    g0/1 = 192.168.2.254/24
```

### 10.2. Las tablas antes de configurar nada

Estado natural (sin configurar estáticas), con solo las rutas conectadas:

```cisco
! TABLA DE R1                          ! TABLA DE R2
C  192.168.1.0/24  via g0/1            C  192.168.2.0/24  via g0/1
L  192.168.1.254/32 via g0/1           L  192.168.2.254/32 via g0/1
C  10.0.12.0/30    via g0/0            C  10.0.12.0/30    via g0/0
L  10.0.12.1/32    via g0/0            L  10.0.12.2/32    via g0/0
```

**Problema:** R1 no conoce `192.168.2.0/24` y R2 no conoce `192.168.1.0/24`. Si PC-A pingea a PC-B: el paquete llega a R1 → R1 mira la tabla → **no tiene ruta** → lo descarta (ni siquiera tiene default). *Ping fail.*

### 10.3. Configurando las estáticas (las dos famosas)

```cisco
! R1
R1(config)# ip route 192.168.2.0 255.255.255.0 10.0.12.2

! R2  ← la ruta de VUELTA, el error más común es olvidarla
R2(config)# ip route 192.168.1.0 255.255.255.0 10.0.12.1
```

### 10.4. Qué pasa cuando PC-A pingea a PC-B

Seguí el paquete salto por salto (esto es oro para diagnosticar):

```text
1. PC-A arma el paquete: origen 192.168.1.10 → destino 192.168.2.10.
   Como el destino NO está en su red, lo manda a su gateway: 192.168.1.254 (R1).

2. R1 recibe el paquete. Consulta su tabla:
   → "192.168.2.0/24 = via 10.0.12.2, g0/0".
   → Cambia el sobre Ethernet (la MAC destino ahora es la de R2, 10.0.12.2)
     y lo manda por g0/0. El paquete IP no cambia.

3. R2 recibe el paquete. Consulta su tabla:
   → "192.168.2.0/24 está conectada a mi g0/1" (ruta C).
   → Cambia el sobre Ethernet y lo manda directo a PC-B.
     PC-B responde el echo.

4. Ahora la RESPUESTA: origen 192.168.2.10 → destino 192.168.1.10.
   PC-B manda al gateway 192.168.2.254 (R2).

5. R2 consulta su tabla:
   → "192.168.1.0/24 = via 10.0.12.1, g0/0"   ← ¡LA ESTÁTICA QUE CONFIGURASTE!
   → La manda por g0/0 a R1.

6. R1 consulta su tabla:
   → "192.168.1.0/24 conectada a g0/1" (ruta C).
   → La manda a PC-A. ¡Ping exitoso!
```

> **El momento que resume TODO este manual:** cada router decide **independientemente** con SU tabla. PC-A y PC-B nunca "saben" que existen routers entre ellos: los routers se pasan el paquete como una posta, y cada uno solo conoce su pedacito del camino. El ping funciona SOLO SI TODOS tienen su pedacito — ida Y vuelta.

---

## 11. Aplicación: laboratorio guiado en Packet Tracer

> Este laboratorio extiende el Lab 5 de rutas estáticas de la serie de Packet Tracer. Si no tenés Packet Tracer abierto, este es el momento perfecto: la teoría de las secciones 1-10 se entiende el doble viendo las tablas en vivo.

### Paso 1 — Armar la topología

1. Tres routers no hacen falta: usá **2 routers (R1, R2)** y **2 PCs (PC-A, PC-B)**, como la topología de la sección 10.
2. Cables **Copper Straight-Through** entre PC→Router.
3. Entre R1 y R2: cable directo también (en Packet Tracer los routers modernos usan GigabitEthernet, autonegociado).

### Paso 2 — IPs de las interfaces

```cisco
! R1
interface g0/0
 ip address 10.0.12.1 255.255.255.252
 no shutdown
interface g0/1
 ip address 192.168.1.254 255.255.255.0
 no shutdown

! R2
interface g0/0
 ip address 10.0.12.2 255.255.255.252
 no shutdown
interface g0/1
 ip address 192.168.2.254 255.255.255.0
 no shutdown
```

### Paso 3 — IPs de las PCs

| PC | IP | Máscara | Gateway |
|----|-----|---------|---------|
| PC-A | 192.168.1.10 | 255.255.255.0 | 192.168.1.254 |
| PC-B | 192.168.2.10 | 255.255.255.0 | 192.168.2.254 |

> **Ojo:** el gateway de cada PC es el router de SU red. PC-B no "sabe" que existe R1: su gateway es R2, y punto.

### Paso 4 — El momento de la verdad

Sin configurar nada más, corré desde PC-A:

```text
ping 192.168.2.10
```

**Va a fallar** (timeout). Esto NO es un bug: es la teoría funcionando. R1 no tiene ruta a la red de PC-B. Verificá:

```cisco
R1# show ip route
```

Fijate que NO aparece ninguna `S`. Ahora configurá las estáticas (ida y vuelta):

```cisco
! R1
R1(config)# ip route 192.168.2.0 255.255.255.0 10.0.12.2

! R2
R2(config)# ip route 192.168.1.0 255.255.255.0 10.0.12.1
```

### Paso 5 — Verificar

```cisco
R1# show ip route
```

Vas a ver las dos `S` (la de 192.168.2.0 y quizás una default si la agregás). Y el ping:

```text
ping 192.168.2.10
```

**PRIMER REPLIES!** (si no, revisá el Paso 3: gateway de PC-B o la ruta de vuelta en R2).

### Paso 6 — El experimento que mata el mito

Ahora borrá la estática de R2:

```cisco
R2(config)# no ip route 192.168.1.0 255.255.255.0 10.0.12.1
```

Y repetí el ping desde PC-A... **falla de nuevo**, aunque la ruta de IDA siga existiendo en R1. ¿Por qué? Porque la vuelta murió. Este experimento de 30 segundos te enseña más que diez capítulos de teoría: **sin ruta de vuelta no hay ping**. Dejá la ruta puesta de nuevo antes de terminar.

> **HACELO VOS:** con la topología arriba y sin mirar las soluciones, escribí para cada router las rutas estáticas que hacen falta para que PC-A llegue a PC-B Y PC-B a PC-A. Después configurá y verificá con `show ip route` y un ping. Si algo no anda, seguí la regla de la sección 12.

---

## 12. Errores comunes y cómo diagnosticarlos

### 12.1. La lista de los clásicos

| # | Error | Síntoma | Diagnóstico y solución |
|---|-------|---------|------------------------|
| 1 | Falta la **ruta de vuelta** | Ping de ida "anda" pero no responde | Revisá `show ip route` en el router de DESTINO: ¿tiene ruta para volver a tu red? |
| 2 | **Interfaz apagada** | La ruta `C` no aparece en la tabla | `show ip interface brief`: si dice `administratively down`, falta `no shutdown` |
| 3 | **Next-hop inalcanzable** | La estática no reenvía | El next-hop debe estar en una red conectada Y ser alcanzable. Ping al next-hop desde el router |
| 4 | **Máscara o IP mal escrita** | Ruta existe pero nunca matchea | Revisá la red y la máscara contra el diagrama. Un dígito y la ruta apunta a otra parte |
| 5 | Variante interfaz en Ethernet sin next-hop | Paquete sale por la interfaz pero no llega | Cambiá a next-hop explícito |
| 6 | **Gateway mal puesto en la PC** | El PC habla con el switch pero "no sale" | Verificá que el gateway del PC sea la IP del router de SU red |
| 7 | Confundir el ping que "no vuelve" con red caída | Mismo síntoma, causa distinta | Seguí la regla: primero ida, después vuelta, después el resto |

### 12.2. La metodología en 5 pasos para "no llego a la red X"

Cuando un destino es inalcanzable, esta es la secuencia profesional:

```text
1. ¿Las interfaces del camino están up/up?        → show ip interface brief (en cada router)
2. ¿La tabla del router de mi red tiene la ruta?  → show ip route <red_destino>
3. ¿El siguiente router también?                  → repetir en cada salto
4. ¿El next-hop es alcanzable?                    → ping al next-hop desde el router
5. ¿La vuelta existe en el destino?               → show ip route en el router del destino
```

Con `traceroute` (de la PC o el router) ves DÓNDE se corta la cadena: el salto que deja de responder es el router mal configurado.

> **Regla de oro final:** el enrutamiento casi nunca falla por magia. Falló porque alguien le puso mal una IP, olvidó una ruta de vuelta o no encendió una interfaz. El 90% de los problemas de rutas están en esa lista de la sección 12.1.

---

## 13. Comprobá lo que aprendiste

Respondé antes de mirar las respuestas, después destapá cada una con el detalle.

**1. ¿Cuáles son los dos trabajos distintos de un router?**
<details>
<summary>Ver respuesta</summary>

**Enrutamiento** (decidir cuál es la mejor ruta para cada destino y guardarla en la tabla, pasa ante cambios de topología) y **reenvío** (mirar la tabla y mandar cada paquete al next-hop correspondiente, pasa millones de veces por segundo). Uno piensa, el otro ejecuta.
</details>

**2. Un router recibe un paquete hacia una red que no conoce. ¿Qué hace?**
<details>
<summary>Ver respuesta</summary>

El router **descarta el paquete** y (según configuración) manda un ICMP "destination unreachable" al origen. NO lo manda "a todos lados" ni lo guarda esperando aprender. Salvo que tenga una **ruta por defecto** (`0.0.0.0/0`), en cuyo caso lo envía por esa ruta.
</details>

**3. ¿Qué significa cada parte de `S 192.168.2.0/24 [1/0] via 10.0.12.2, g0/0`?**
<details>
<summary>Ver respuesta</summary>

`S` = ruta estática. `192.168.2.0/24` = red destino con su máscara. `[1/0]` = AD 1 (confiable, la escribió el administrador) y métrica 0. `via 10.0.12.2` = next-hop (a quién pasar el paquete). `g0/0` = interfaz de salida. Traducción: "para llegar a la red 192.168.2.0/24, pasale el paquete a 10.0.12.2 por mi g0/0".
</details>

**4. ¿Por qué aparece una ruta `L` en la tabla de rutas?**
<details>
<summary>Ver respuesta</summary>

La ruta `L` (local) identifica la dirección IP propia de una interfaz del router. Es la "casa" del router: los paquetes dirigidos a esa IP están dirigidos al propio router (por ejemplo, un ping a 10.0.12.1 desde el vecino). Aparece sola, junto a la `C` (conectada).
</details>

**5. Configuraste la estática de ida y el ping no vuelve. ¿Qué revisás primero?**
<details>
<summary>Ver respuesta</summary>

La **ruta de vuelta**: en el router del DESTINO, `show ip route` — ¿tiene alguna ruta (estática, por defecto o dinámica) para volver a tu red? El enrutamiento es salto por salto e independiente: cada router decide con su tabla, y sin ruta de retorno la respuesta se descarta.
</details>

**6. ¿Qué es una floating static route y cuándo se activa?**
<details>
<summary>Ver respuesta</summary>

Es una ruta estática de respaldo con **AD alta** (ej. 200) hacia el mismo destino que una principal (AD 1). Mientras la principal exista en la tabla, la de respaldo está dormida. Se activa automáticamente cuando la principal **desaparece** (el enlace o el next-hop se cayó). Es la forma manual de lograr redundancia.
</details>

**7. ¿Por qué la ruta por defecto se escribe `0.0.0.0 0.0.0.0`?**
<details>
<summary>Ver respuesta</summary>

Porque esa combinación (todo ceros en red y en máscara) es la menos específica posible: matchea con CUALQUIER dirección destino. Es el "cajón de todo lo desconocido": si ninguna otra ruta matchea, el paquete va por ahí. Por eso un router de borde usa una sola default route hacia el ISP en lugar de conocer "toda internet".
</details>

---

## 14. Glosario

| Término | Qué es |
|---------|--------|
| **Enrutamiento (routing)** | La decisión de elegir la mejor ruta hacia cada destino y mantenerla en la tabla |
| **Reenvío (forwarding)** | La acción mecánica de enviar cada paquete según la tabla (millones de veces por segundo) |
| **Tabla de enrutamiento** | La lista en memoria del router: destinos, next-hops e interfaces de salida |
| **Ruta conectada (C)** | Ruta que el router aprende solo porque la red está pegada a una de sus interfaces |
| **Ruta local (L)** | La dirección IP propia de una interfaz del router |
| **Ruta estática (S)** | Ruta configurada a mano por el administrador |
| **Ruta por defecto** | Ruta a `0.0.0.0/0`: el plan B para todo destino desconocido |
| **Next-hop** | La IP del próximo router al que hay que pasarle el paquete |
| **Interfaz de salida** | Por qué interfaz del router sale el paquete |
| **Administrative Distance (AD)** | Número que indica la confiabilidad de la fuente de la ruta (menor = más confiable) |
| **Métrica** | Valor que compara rutas DENTRO de una misma fuente (menor = mejor) |
| **Floating static route** | Ruta estática de respaldo con AD alta que se activa si la principal muere |
| **Gateway of last resort** | La ruta por defecto: adónde va todo lo que no matchea otra ruta |
| **Destination unreachable** | Mensaje ICMP de un router que no tiene ruta hacia el destino |

---

## 15. Resumen en 10 puntos

1. **El router no piensa: consulta.** Para cada paquete mira la dirección IP destino y decide con SU tabla de enrutamiento.
2. **Enrutar** (armar la tabla) y **reenviar** (mandar paquetes) son trabajos distintos; el segundo es mecánico y rapidísimo.
3. **Sin ruta, el paquete se descarta.** Un router no reenvía "a ver qué pasa": sin ruta ni default, tira el paquete.
4. **`show ip route` es el idioma del enrutamiento**: `C` conectada, `L` local, `S` estática, y después `O`, `D`, `R`, `B` cuando lleguen los protocolos dinámicos.
5. **Las conectadas y locales son gratis**: aparecen solas cuando la interfaz está up/up (y desaparecen si se apaga).
6. **La estática se escribe a mano**: `ip route <red> <máscara> <next-hop>`. Predictible, sin consumo de banda, pero no se adapta sola.
7. **La ruta de vuelta es sagrada**: configurar la ida sin la vuelta es el error de principiante número uno.
8. **En Ethernet siempre next-hop**: la variante "solo interfaz" sirve para enlaces punto a punto.
9. **La default route (`0.0.0.0/0`) es el plan B universal**: una sola frase reemplaza "conocer todo lo desconocido".
10. **La floating static route (AD 200) es la primera idea de redundancia**: duerme en la tabla y se despierta cuando la principal muere.

---

> **Fuente:** Documentación propia basada en RFC 1812 (requirements for IPv4 routers), documentación oficial Cisco IOS (IP Routing: Static Configuration Guide), CCNA 200-301 Official Cert Guide (W. Odom) y material educativo de redes.
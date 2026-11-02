# 34. Enrutamiento IP y Rutas Estáticas

**Cómo un router decide hacia dónde mandar cada paquete**

---

Este manual arranca desde cero. No hace falta que sepas configurar nada ni que hayas tocado un
router en tu vida: vamos a construir la idea de "enrutamiento" de a una pieza por vez, primero
con una situación de la vida diaria y después con la definición técnica. Cada vez que aparece una
sigla, la definimos en el momento en que la usamos por primera vez.

El tema del manual es una sola pregunta: **cuando un paquete tiene que viajar de una computadora
a otra que está lejos, ¿quién decide por dónde va cada tramo del camino?** La respuesta corta es
"un router, mirando una tabla". La respuesta larga es todo lo que sigue.

### Las tres piezas que necesitás para arrancar

Antes de la primera analogía, tres definiciones mínimas. Si ya las tenés, saltealas y seguí.

**Paquete.** Cuando mandás una foto por mensajería, la foto no viaja entera de una punta a la
otra. Se corta en pedazos chicos, y cada pedazo viaja por su cuenta dentro de un sobre con dos
datos escritos afuera: de dónde sale y a dónde va. Ese sobre con datos adentro es un **paquete**.
Un paquete es, entonces, la unidad de transporte de una red: un bloque de datos más una etiqueta
con la dirección de destino.

**Dirección IP.** **IP** son las siglas de *Internet Protocol* (Protocolo de Internet): el
conjunto de reglas que usan los equipos para mandarse paquetes aunque estén en redes distintas.
Para que esas reglas funcionen, cada equipo necesita un identificador único dentro de su red: eso
es la **dirección IP**, un número como `192.168.1.10`. Es la dirección postal del sobre.

**Router.** Un **router** (en español también se dice *enrutador* o *encaminador*) es un equipo
que tiene varias conexiones, cada una a una red distinta, y cuyo trabajo es decidir por cuál de
esas conexiones sale cada paquete que le llega. No es un switch: el switch reparte dentro de una
misma red; el router conecta redes diferentes. Si el switch es el portero de un edificio, el
router es el centro de distribución de encomiendas de la ciudad.

Con esas tres piezas ya se puede contar la historia. El resto del manual es ponerles nombre
técnico a las cosas y aprender a leer lo que el router te muestra en pantalla.

### Cómo está armado el recorrido

El recorrido: los capítulos 1 a 3 explican el problema, el router y la tabla. Los capítulos 4 y 5
enseñan a leer una tabla real, columna por columna. Los capítulos 6 a 8 son el corazón práctico:
ruta estática, next-hop y ruta por defecto. El 9 agrega la primera idea de redundancia, el 10 sigue
un paquete salto por salto, el 11 lo repite en un simulador y el 12 lista los errores clásicos.
Los últimos tres son repaso.

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

Cómo usar este índice: cada entrada es un capítulo, y cada título es además la dirección (URL)
con la que se publica la página. Si estás apurado, con el capítulo 1, el 3, el 6 y el 8 ya
entendés el mecanismo completo; el resto son las variantes, el laboratorio y el diagnóstico.

### Resumen

- El manual enseña enrutamiento desde cero, sin dar por sabida ninguna sigla.
- La pregunta que ordena todo es quién decide por dónde va cada paquete y con qué información.
- El recorrido corto es: problema (capítulo 1), tabla (3), ruta estática (6) y ruta por defecto (8).

---

## 1. El problema que resuelve el enrutamiento

### 1.1. El edificio con dos direcciones

Imaginá un edificio grande en una esquina. Tiene una puerta principal sobre la avenida y otra
puerta sobre la calle de atrás, y por eso tiene **dos direcciones postales**: una por cada puerta.
Adentro, en la planta baja, hay una mesa de entradas con un encargado.

Ahora seguí una carta. Llega por la puerta de la avenida, con la dirección de la calle de atrás
escrita en el sobre. El encargado podría hacer lo fácil: pasarla por la misma puerta por la que
entró. Pero no. Mira la dirección, mira su lista interna de "a qué calle corresponde cada piso y
cada sector", y decide que esa carta tiene que salir por la otra puerta, la de atrás.

Ese encargado es un router. La lista interna que consulta es su **tabla de enrutamiento**. Y la
decisión que toma —"esta carta sale por la puerta de atrás"— es el **enrutamiento**.

Lo importante del cuento es esto: el encargado **no elige la salida por donde entró**. Elige la
salida según el destino. Y como el edificio tiene dos puertas, hay dos caminos posibles para el
mismo papel, y alguien tiene que decidir cuál corresponde.

Ese es exactamente el problema de las redes. Antes de este manual ya sabés que cada dispositivo
tiene una dirección IP y que los paquetes viajan envueltos en sobres. Ahora viene la pregunta que
todo eso dejó pendiente:

> Si R1 está conectado solo a R2, y R2 está conectado a una red que R1 ni siquiera conoce... **¿cómo sabe R1 que tiene que mandar el paquete por R2?** ¿Y por qué no por R3, que también está conectado?

(En este manual, "R1", "R2" y "R3" son simplemente nombres de routers. La letra R y un número,
como cuando en un plano de una casa ponés "dormitorio 1" y "dormitorio 2".)

La respuesta es la que veníamos construyendo: **R1 no lo sabe por magia**. R1 tiene una tabla
donde dice "para llegar a tal red, pasale el paquete a tal vecino". El vecino tiene otra tabla
parecida. Y así, de a una decisión por vez, el paquete cruza el país.

Esa disciplina —decidir por dónde viaja cada paquete para llegar de su origen a su destino aunque
haya muchas redes en el medio— se llama **enrutamiento** (en inglés *routing*). Fijate que no dice
nada de "cómo se llaman los cables" ni "qué protocolo usa tu programa de mensajería". Es
puramente geografía: por dónde conviene ir.

> **Analogía del sistema postal (la continuamos):** en el manual de modelos viste que el correo funciona por capas. El enrutamiento es la **oficina de clasificación**: cuando llega una carta con un código postal, alguien mira un mapa (o una tabla) y decide "esta carta va por la ruta 9 al centro de distribución de Córdoba". Ese "alguien con el mapa" es el router. La tabla con los códigos postales y las rutas es la **tabla de enrutamiento**.

Quedate con la parte más útil de la analogía: en la oficina de clasificación nadie lee la carta.
Se mira el sobre. Se mira el destino. Se busca en la tabla. Se tira la carta a la bolsa que
corresponde. Nada más. Y eso es una virtud, no una limitación: un router tiene que tomar esa
decisión millones de veces por segundo, así que no puede ponerse a "pensar".

### 1.2. La idea madre de este manual

> **Un router NO "sabe" hacia dónde va un paquete por arte de magia. Toma decisiones paquete por paquete, mirando SU tabla de enrutamiento: para cada destino, elige la entrada más específica que tenga y manda el paquete al "próximo salto" (next-hop) que esa entrada le indica.**

Todo lo que sigue en este manual (y en los próximos dos: selección de rutas y enrutamiento
dinámico) es una profundización de esa frase. Si la entendés, ya ganaste la mitad de la batalla.

Desarmala en cuatro pedazos, porque cada uno es un capítulo del manual:

- **"paquete por paquete"**: no hay una decisión por sesión. Hay una por cada sobre que pasa, y dos
  paquetes del mismo video pueden salir por caminos distintos.
- **"SU tabla"**: cada router decide con la suya, y por eso existe el error más famoso del tema
  (capítulo 6): configurar la ida y olvidar la vuelta.
- **"la entrada más específica"**: si dos rutas sirven, gana la que describe el destino con más
  precisión. Eso es la selección de rutas, tema del manual siguiente.
- **"próximo salto"**: el router no conoce el camino completo, solo el siguiente equipo, como en
  una carrera de relevos.

### 1.3. Qué vas a aprender acá

- Qué decide un router y con qué herramienta (la tabla de enrutamiento).
- A leer una tabla de rutas como un profesional (`show ip route`).
- De dónde salen las rutas: conectadas, locales, estáticas.
- Cómo se escribe una **ruta estática** y la **ruta por defecto**.
- Qué es una **floating static route** (la primera idea de redundancia).
- Un laboratorio guiado para verlo funcionando en Packet Tracer.

### Resumen

- Un router decide la salida mirando el destino del paquete, no la puerta por la que entró.
- El enrutamiento es la disciplina de elegir por dónde viaja cada paquete entre redes distintas.
- La herramienta de la decisión es la tabla de enrutamiento, y cada router tiene la suya.
- El router no conoce el camino completo: solo el próximo salto, y confía en el vecino.
- Si no tiene ninguna entrada que sirva, el paquete se descarta: eso también es enrutamiento.

---

## 2. ¿Qué hace un router? La decisión de reenvío

### 2.1. Dos trabajos distintos: enrutar y reenviar

Los routers hacen dos trabajos que los principiantes confunden:

| Trabajo | Nombre técnico | Qué es | Cada cuánto |
|---------|----------------|--------|-------------|
| **Decidir la ruta** | Enrutamiento (routing) | Elegir la mejor ruta para llegar a cada destino y guardarla en la tabla | Cuando se aprende una ruta nueva (cambio de topología, configuración) |
| **Mandar los paquetes** | Reenvío (forwarding) | Mirar la tabla, encontrar la entrada para el destino, enviar el paquete al next-hop | Por CADA paquete que llega, millones de veces por segundo |

**Qué hace esta tabla:** separa las dos tareas que un router cumple todo el tiempo, y sobre todo
separa sus frecuencias. No es lo mismo "pensar el camino" que "recorrerlo".

**Columna por columna:**

- **Trabajo:** el nombre en lenguaje llano. "Decidir la ruta" es planeación; "mandar los
  paquetes" es ejecución.
- **Nombre técnico:** cómo se dice en la jerga. *Routing* es enrutamiento; *forwarding* es
  reenvío. En las entrevistas de trabajo y en los manuales de Cisco vas a ver las dos palabras en
  inglés, así que conviene reconocerlas.
- **Qué es:** la definición operativa de cada tarea. Fijate en el verbo: la primera *elige*, la
  segunda *envía*.
- **Cada cuánto:** la columna que explica todo. La primera tarea pasa cuando cambia algo (se
  agregó un cable, se cayó un enlace, alguien escribió un comando). La segunda pasa con cada
  paquete, sin excepción, a una velocidad que no se mide en segundos.

> **Analogía:** el enrutamiento es el trabajo del que **diseña** los recorridos de los micros en una ciudad (una vez por mes). El reenvío es el trabajo del **chofer** que sigue el recorrido con su micro (cada viaje, todos los días). Uno piensa, el otro ejecuta.

En este manual estudiamos el primero (cómo se arma la tabla); el segundo es mecánico y
rapidísimo, y solo te interesa cuando algo no funciona (eso lo ves en el manual de
troubleshooting). Dicho de otro modo: el diseño del recorrido es lento y pensado; el viaje es
rápido y automático. Y si el recorrido está mal diseñado, el chofer va a hacer todo bien... hacia
el lugar equivocado.

### 2.2. El router no tiene "cerebro": tiene tablas

Momento importante, porque separa a los que entienden de los que memorizan:

> **El router NO analiza el contenido de tus datos.** Nunca mira "la carta". Solo mira la **etiqueta**: la dirección IP destino del paquete. Con esa sola información consulta su tabla y decide.

Por eso los routers pueden procesar millones de paquetes por segundo: porque no *piensan*,
**comparan y reenvían**. Todo el "pensamiento" está en la tabla, y todo el trabajo de armar esa
tabla está en los protocolos de enrutamiento (o en tu mano, cuando configurás rutas estáticas).

Ese "mirar la etiqueta" no es una metáfora: el paquete IP tiene un encabezado con campos fijos, y
uno de ellos es la dirección de destino. El router lee ese campo y lo compara con su tabla; nunca
abre el contenido. Por eso tampoco distingue aplicaciones: si la red está mal, se cae todo junto.

### 2.3. Las tres preguntas de cada paquete

Cuando un paquete llega a un router, este se hace tres preguntas:

1. **¿Está el destino en una red conectada a mí?** → Entonces lo mando directamente por esa interfaz (a la MAC de ese vecino, como viste en capa 2).
2. **¿Tengo una ruta hacia ese destino?** → Entonces lo mando al next-hop que dice mi tabla.
3. **¿No tengo nada?** → Si tengo ruta por defecto, la uso. Si no tengo ni eso... **el paquete se descarta** y el router manda un ICMP "destination unreachable" al origen.

**Qué dice cada pregunta:** la primera es la más barata (el destino está pegado a mí); la segunda
es el caso normal de un router en el medio del camino; la tercera es el caso triste: sin
información no hay reenvío posible.

Dos siglas para definir acá, porque aparecen en los tres pasos:

- **MAC** (*Media Access Control*, control de acceso al medio): la dirección física de una placa
  de red, grabada en el hardware. Es la dirección que se usa para entregar un sobre dentro de una
  misma red local, y cambia en cada salto. La IP, en cambio, es la dirección de destino final y
  no cambia en todo el viaje.
- **ICMP** (*Internet Control Message Protocol*, protocolo de mensajes de control de Internet):
  el idioma con el que los equipos de red se avisan problemas. El mensaje "destination
  unreachable" (destino inalcanzable) es un ICMP, y es el mismo protocolo que usa el `ping` para
  preguntar "¿estás ahí?" y recibir "sí, estoy acá".

> **Dato que sorprende a todos:** un router NO reenvía un paquete "porque sí" a todos lados. Si no tiene ruta (ni siquiera default), **tira el paquete**. Eso explica por qué un router mal configurado "se come" el tráfico: no es que lo pierda, es que no sabe a quién pasárselo.

### Resumen

- Un router hace dos trabajos: armar la tabla (enrutamiento) y usarla para cada paquete (reenvío).
- El reenvío es mecánico y masivo; el enrutamiento es lento y ocurre cuando cambia la red.
- El router no mira el contenido: lee la dirección IP de destino y compara con su tabla.
- Sus tres preguntas son: ¿está en una red conectada?, ¿tengo ruta?, ¿tengo ruta por defecto?
- Si no hay respuesta a ninguna, el paquete se descarta y el origen se entera por ICMP o por timeout.

---

## 3. La tabla de enrutamiento: el mapa del router

### 3.1. Qué es

La **tabla de enrutamiento** (tabla de rutas, routing table) es una lista que el router mantiene en memoria con todas las rutas que conoce: para cada red de destino, guarda el *próximo salto* y la *interfaz de salida*.

Pensala como la lista pegada al lado del teléfono del encargado: una fila por destino y qué hacer
con cada uno. No es un mapa: es una **tabla de decisiones**.

Una **interfaz** es cada una de las conexiones del router: el conector hembra donde entra el cable,
con su nombre (`GigabitEthernet0/0`, `g0/1`, `Serial0/0/0`). Un router con cuatro interfaces puede
estar conectado a cuatro redes distintas, y por eso tiene cuatro puertas posibles de salida.

En Cisco IOS se mira con:

```cisco
show ip route
```

**Qué hace el comando:** muestra la tabla completa del router en el que estás parado. Es el comando
más importante del manual, y el que vas a escribir cien veces si trabajás con redes.

**Qué significa lo que escribís:** `show` es "mostrar", `ip` indica información del protocolo IP y
`route` es "ruta". Se lee "mostrame las rutas IP", y se ejecuta desde el modo privilegiado.

**Qué tenés que ver vos en pantalla:** una lista de líneas que empiezan con una letra mayúscula y
una red con barra. Si está vacía (o solo tiene las redes de tus propios cables), el router no sabe
ir a ningún lado más que a su barrio: está sin configurar.

**IOS** son las siglas de *Internetwork Operating System* (sistema operativo de interconexión de
redes): el sistema operativo de los equipos Cisco. Cuando veas `R1#` o `R1(config)#`, es su símbolo
del sistema: `#` es modo privilegiado (mirar) y `(config)#` es modo configuración (cambiar).

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

**Qué hace el bloque:** es la foto completa de lo que este router sabe. Arriba está la leyenda de
letras (la misma que viste en el capítulo anterior, pero completa), después una línea de resumen
sobre la ruta por defecto, después un aviso de agrupación y al final las rutas, una por línea.

**Cómo leerlo sin marearte:** no lo leas como un texto. Ignorá la leyenda, y buscá las líneas que
empiezan con una letra pegada al borde izquierdo y una dirección con barra: esas son las rutas.
Todo lo demás es contexto.

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

**Qué hace este bloque:** es la misma línea de antes, dibujada con flechas para que cada pedazo
tenga nombre. Leela de abajo hacia arriba si te ayuda: origen, destino, confiabilidad, a quién, por
dónde.

**Qué significa cada renglón de la anotación:**

- **Origen de la ruta:** la letra de la izquierda dice *de dónde vino*. `S` es static (la
escribió una persona), `C` es connected (la red está pegada a una interfaz). Es lo primero que hay
que mirar.
- **Red destino:** a qué red llega esa entrada, con su máscara. `192.168.1.0/24` es "la red que
empieza en 192.168.1.0, con 24 bits de red"; el `/24` es la forma corta de `255.255.255.0`.
- **[Administrative Distance / Métrica]:** dos números que dicen qué tan confiable es la fuente y
cuánto cuesta la ruta. Los vemos en el capítulo 4.
- **Next-hop:** la IP del equipo al que hay que pasarle el paquete. Es el próximo salto, no el
destino final.
- **Interfaz de salida:** por cuál de las puertas del router sale el paquete físicamente.

> **Analogía:** la tabla es la guía de rutas de un chofer de micro: lista de destinos (redes), con la indicación "para llegar a X, doblá en la calle Y" (el next-hop) y "salí por la puerta Z" (la interfaz). El chofer no decide nada: **sigue la guía**.

Y si el chofer llega a una parada que no está en la guía, no inventa: se detiene. Eso es
exactamente lo que hace el router cuando no encuentra la red de destino en la tabla.

### 3.3. El "gateway of last resort"

Fijate la línea que dice:

```cisco
Gateway of last resort is 10.0.0.2 to network 0.0.0.0
```

**Qué hace:** te avisa que hay una ruta por defecto configurada. "Gateway of last resort" es
"puerta de último recurso": "si no encuentro nada mejor, mando todo por acá".

**Qué significa cada parte:** `Gateway` es la puerta (el next-hop); `10.0.0.2` es la IP de ese
equipo; `to network 0.0.0.0` es "para la red 0.0.0.0", la red comodín que representa cualquier
destino. La sección 8 está dedicada a esta idea.

**Qué tenés que ver vos en pantalla:** si la línea no aparece, el router **no tiene** ruta por
defecto, y todo paquete hacia una red que no esté en su tabla se descarta. Esa sola ausencia
explica muchísimos "no tengo internet" de laboratorio.

Eso significa: "si no encuentro ninguna otra ruta, mando todo al 10.0.0.2". Es la **ruta por defecto** (sección 8). La vas a ver marcada con `S*` (el asterisco = candidate default).

### 3.4. La leyenda de letras, traducida

La cabecera del comando tiene una línea por cada origen posible. No hace falta memorizarla hoy,
pero sí saber que existe y que se lee como un diccionario:

- **C** — *connected*: la red está pegada a una interfaz del router.
- **L** — *local*: la IP propia de una interfaz (una ruta de 32 bits, o sea una sola dirección).
- **S** — *static*: ruta escrita a mano por el administrador.
- **R** — *RIP* (*Routing Information Protocol*, protocolo de información de rutas): dinámico,
  histórico.
- **M** — *mobile*: equipos móviles; casi no se usa.
- **B** — *BGP* (*Border Gateway Protocol*, protocolo de puerta de enlace fronteriza): el que usan
  los proveedores para intercambiar rutas entre sí.
- **D** — *EIGRP* (*Enhanced Interior Gateway Routing Protocol*): dinámico, de Cisco.
- **EX** — *EIGRP external*: una ruta EIGRP importada desde otro protocolo.
- **O** — *OSPF* (*Open Shortest Path First*, primero la ruta más corta abierta): el dinámico más
  usado dentro de las empresas.
- **IA** — *OSPF inter area*: una ruta OSPF que viene de otra área del mismo dominio.
- **N1, N2** — ruta externa de OSPF en un área especial llamada NSSA (*Not-So-Stubby Area*);
  **E1, E2**, externas redistribuidas desde otro protocolo; **E**, *EGP* (*Exterior Gateway
  Protocol*), el antecesor de BGP.
- **i** — *IS-IS* (*Intermediate System to Intermediate System*): muy usado por proveedores.
- **L1, L2, ia** — niveles y rutas entre áreas de IS-IS.
- **\*** — *candidate default*: candidata a ruta por defecto.
- **U** — *per-user static route*: estática de un usuario que entra por línea telefónica.
- **o** — *ODR* (*On-Demand Routing*): descubrimiento en topologías de estrella; poco usado.
- **P** — *periodic downloaded static route*: estática bajada desde un servidor de configuración.

No te preocupes por las que no entiendas: en este manual solo necesitás dominar `C`, `L` y `S`.
Las demás aparecen cuando los protocolos dinámicos las aprenden solos, y cada una tiene su manual
más adelante en la serie.

### Resumen

- La tabla de enrutamiento es una tabla de decisiones: destino, next-hop e interfaz de salida.
- `show ip route` la muestra completa; es el comando que más vas a usar en toda tu vida de redes.
- Cada línea tiene cinco partes: origen, red destino, [AD/métrica], next-hop e interfaz.
- La leyenda de letras dice de dónde salió cada ruta; hoy alcanza con `C`, `L` y `S`.
- "Gateway of last resort" es la puerta de último recurso, y si falta, lo desconocido se descarta.

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

**Qué hace esta tabla:** es el diccionario mínimo para leer cualquier tabla de rutas. Con la
primera columna sola ya podés interpretar el 90% de las salidas que vas a ver en un laboratorio o
en un equipo de producción chico.

**Columna por columna:**

- **Código:** la letra exacta que aparece al principio de la línea en `show ip route`. Ojo con las
  mayúsculas: no es lo mismo `D` (EIGRP) que `d`; y `i` minúscula es IS-IS, no "i" de internet.
- **Origen:** el nombre completo del origen de la ruta. Acá se define la sigla, que es la misma
  que aparece en la leyenda del comando.
- **Quién la pone:** el dato más importante para entender de dónde salió. Si dice "el router
  mismo", la ruta es gratis y automática. Si dice "vos", es una decisión humana. Si dice
  "protocolo dinámico", la ruta la aprendió el router hablando con otros routers.

**Qué tenés que ver vos en pantalla:** si ves una `C` en la línea del destino al que querés
llegar, el problema no es de ruta: la red está pegada al router. Si ves una `S`, alguien la
escribió a mano y podés buscarla en la configuración. Si no ves nada para ese destino, no hay
ruta y el paquete muere ahí.

> **Consejo de estudio:** en este manual solo necesitás dominar `C`, `L` y `S`. Las demás (`O`, `D`, `B`...) aparecen cuando los protocolos dinámicos las aprenden solos — eso es literalmente el tema de los protocolos dinámicos, que vienen enseguida.

Atajo mental: **la letra contesta "¿quién decidió esto?"**. `C` y `L`: el cable está puesto. `S`:
lo decidiste vos. `O`, `D`, `R`, `B`, `i`: los routers hablando entre ellos.

### 4.2. Las dos columnas de la derecha: [AD/métrica]

Fijate este detalle:

```cisco
S       192.168.1.0/24 [1/0] via 10.0.12.2
```

**Qué hace:** es la misma línea de ruta, recortada, para mirar solamente los dos números entre
corchetes. Esos dos números son los que el router usa para desempatar cuando hay más de una ruta
hacia el mismo destino.

El par `[1/0]` son dos números clavados:

- **1** = **Administrative Distance** (AD): qué tan "confiable" es la fuente de esta ruta. Las estáticas tienen AD 1 (muy confiables, porque las escribiste vos).
- **0** = **métrica** de la ruta. En estáticas es 0 casi siempre.

**Qué significa "confiable" acá:** no es la calidad del enlace, es una jerarquía administrativa.
Si dos fuentes te dicen cómo llegar al mismo lugar, el router le cree a la de número más bajo: una
conectada (AD 0) le gana a una estática (AD 1), y una estática le gana a una de OSPF (AD 110).

**Cómo se lee el par:** siempre en el mismo orden, `[AD/métrica]`. El de la izquierda es de dónde
vino; el de la derecha, cuánto cuesta. Si el número de la derecha te parece enorme en una ruta
dinámica, no es un error: la métrica puede medir saltos, ancho de banda o una fórmula propia de
cada protocolo.

**Qué tenés que ver vos en pantalla:** en una estática normal vas a ver `[1/0]`. Si ves `[200/0]`,
es una estática de respaldo: está configurada pero pierde contra casi todo.

No profundices todavía: el tema de selección de rutas está dedicado entero a "cuando hay dos rutas para el mismo destino, ¿cuál gana?" — y esa pregunta se responde con AD y métrica. Acá solo anotá que existen.

Advertencia para el manual siguiente: AD y métrica no son lo mismo. La AD compara **fuentes** (a
quién creerle); la métrica compara **rutas de la misma fuente**. Primero la AD, después la métrica.

### 4.3. Subredes variables

La línea `10.0.0.0/8 is variably subnetted, 2 subnets, 2 masks` es solo una forma que tiene IOS de agrupar: dice "dentro de este bloque /8 hay subredes de distinto tamaño". No es una ruta en sí; es un aviso de organización.

**Qué significa cada palabra:** *variably subnetted* quiere decir que dentro de ese bloque conviven
subredes con máscaras de distinto largo (un `/30` y un `/24`, por ejemplo). `2 subnets` es la
cantidad de subredes y `2 masks` la cantidad de máscaras distintas. No es una ruta: es un subtítulo
que te avisa cómo está organizado lo que viene abajo.

**Qué tenés que ver vos en pantalla:** contá las rutas que están debajo. Tiene que haber tantas
como dice el aviso.

### Resumen

- Cada ruta empieza con una letra que dice quién la puso: `C`, `L`, `S` o un protocolo dinámico.
- `[AD/métrica]` son dos números: a quién creerle y cuánto cuesta la ruta.
- La AD compara fuentes distintas; la métrica compara rutas de la misma fuente.
- `is variably subnetted` no es una ruta: es un aviso de que abajo hay subredes de distinto tamaño.
- Hoy alcanza con dominar `C`, `L` y `S`; el resto llega con los protocolos dinámicos.

---

## 5. Rutas conectadas y locales: la memoria del router

### 5.1. Las rutas "gratis"

Cuando prendés un router y le ponés IP a una interfaz bien configurada (activa, con cable y link up), el router **aprende solo** dos rutas:

```cisco
C       10.0.12.0/30 is directly connected, GigabitEthernet0/0
L       10.0.12.1/32 is directly connected, GigabitEthernet0/0
```

**Qué hace este bloque:** muestra las dos rutas que el router se fabrica solo, sin que nadie se
las enseñe, apenas una interfaz queda operativa. Son las primeras dos líneas que vas a ver en
cualquier router recién configurado.

**Qué significa cada palabra:** `10.0.12.0/30` es la red de la interfaz. El `/30`
(`255.255.255.252`) deja lugar para dos equipos: las dos puntas de un cable entre routers.
`10.0.12.1/32` es la dirección propia de la interfaz; un `/32` es "esta dirección exacta y ninguna
otra". `is directly connected` se lee "está directamente conectada": esto no me lo contó nadie, lo
veo yo. `GigabitEthernet0/0` es la interfaz por la que se llega a esa red.

**Qué tenés que ver vos en pantalla:** si configuraste una interfaz y no aparece la `C`, el
problema no es de enrutamiento: la interfaz no está operativa. La `L` siempre acompaña a la `C`.

| Ruta | Qué significa |
|------|---------------|
| `C` | "Conozco la red **10.0.12.0/30** porque está pegada a mi interfaz G0/0. Los paquetes para esa red salen por acá." |
| `L` | "La dirección **10.0.12.1** es la mía, la de mi interfaz G0/0. Los paquetes dirigidos a esa IP soy yo." |

**Columna por columna:** **Ruta** es la letra que aparece en la tabla. **Qué significa** es la
frase que representa esa entrada: la `C` habla de una **red** (varios equipos posibles) y la `L` de
**una dirección** (un solo equipo, el router).

**Qué tenés que ver vos en pantalla:** un `ping` a la IP del router desde un vecino lo contesta el
propio router (ruta `L`); un paquete a otro equipo de esa red sale por la interfaz (ruta `C`).

> **Analogía:** las rutas conectadas son el **barrio donde vivo**: no necesito que nadie me lo enseñe, lo conozco. La ruta local es **mi propia casa**: sé exactamente que esa dirección soy yo.

### 5.2. La condición de oro de toda ruta conectada

> **Regla de oro:** una ruta conectada aparece SOLO si la interfaz está **up/up** (capa 1 y capa 2 funcionando: cable conectado, línea activa). Si la interfaz está *administratively down* o el cable está cortado, la ruta `C` desaparece de la tabla.

Este es el primer y más común "fantasma" de todo troubleshooting: *"el router no tiene la ruta"* cuando en realidad **la interfaz está apagada**. Siempre, SIEMPRE, verificá primero las interfaces:

```cisco
show ip interface brief
```

**Qué hace el comando:** muestra un resumen de todas las interfaces: su IP, cómo la obtuvo y, sobre
todo, su estado. Es el segundo comando que hay que escribir siempre, después de `show ip route`.

**Qué significa cada palabra:** `ip interface` es "interfaz IP" y `brief` es "resumido": una línea
por interfaz en vez de cincuenta de detalle.

**Qué tenés que ver vos en pantalla:** dos palabras al final: `up` o `down`. Si dice `up` en las
dos, está operativa. Si dice `administratively down`, alguien la apagó a propósito.

```cisco
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0     10.0.12.1       YES manual up                    up
GigabitEthernet0/1     192.168.1.254   YES manual up                    up
```

**Qué hace este bloque:** es una salida típica de un router sano con dos interfaces configuradas a
mano. Cada fila es una interfaz.

**Columna por columna:** **Interface** es el nombre físico (`GigabitEthernet0/0`: módulo 0,
puerto 0; en la jerga, `g0/0`). **IP-Address** es la dirección de esa interfaz; si está vacía, no
participa del enrutamiento IP. **OK?** es si la dirección es válida (`YES`). **Method** es cómo se
obtuvo (`manual` = a mano, `DHCP` = automática). **Status** es la capa 1: `up` hay señal, `down`
no hay, `administratively down` está apagada por configuración. **Protocol** es la capa 2: `up` es
línea negociada.

**Qué tenés que ver vos en pantalla:** las dos últimas columnas se leen juntas y se pronuncian
"up/up": ese es el estado que necesitás para que exista una ruta `C`. `up/down` es cable bien y
capa 2 sin negociar; `down/down` es falta de señal; `administratively down` es un `shutdown` que
nadie deshizo.

Si ves `administratively down`, el problema no es de ruta: es que alguien apagó la interfaz (o no la encendió con `no shutdown`).

**Qué es `no shutdown`:** `shutdown` apaga una interfaz a propósito; `no shutdown` la vuelve a
habilitar. Es la frase que más veces vas a escribir en un laboratorio. El router la marca como
*administratively down* para que sepas que no fue una falla: fue configuración.

### 5.3. Qué se lleva puesto una interfaz caída

Cuando una interfaz se apaga, no desaparece solo su ruta `C`: también desaparece su `L`, y pueden
quedar inutilizables las rutas estáticas cuyo next-hop estaba en esa red. Si el router no puede
llegar a la red del vecino, tampoco puede entregarle un paquete.

La lección: **antes de tocar rutas, mirá las interfaces**. Es el orden que separa al que
diagnostica del que adivina.

### Resumen

- El router crea solo dos rutas por cada interfaz operativa: la de la red (`C`) y la de su propia IP (`L`).
- La `C` describe un vecindario; la `L` describe la puerta exacta del router (máscara `/32`).
- Una ruta conectada existe solo si la interfaz está up/up; si está apagada, desaparece.
- `show ip interface brief` es el comando para ver el estado real de cada interfaz.
- Si una interfaz se cae, se lleva su `C`, su `L` y la validez de las rutas que dependían de ella.

---

## 6. Rutas estáticas: el administrador tiene la última palabra

### 6.1. Qué es una ruta estática

Una **ruta estática** es una ruta que **vos escribís a mano** en la configuración del router. Le decís: "para llegar a la red X, pasale el paquete al router Y".

Se configura así:

```cisco
ip route <red_destino> <máscara> <next-hop>
```

**Qué hace este bloque:** es la plantilla del comando, con los tres datos que tenés que completar.
No se copia tal cual: los `<...>` son marcas de "acá va tu valor", no texto que se escriba.

**Qué significa cada pieza:**

- `ip route` es el comando en sí. `ip` porque es enrutamiento de IP, `route` porque es una ruta.
- `<red_destino>` es la red a la que querés llegar, en formato de dirección de red (por ejemplo
  `192.168.2.0`). No es la IP de un equipo: es la red entera.
- `<máscara>` es la máscara de esa red, escrita en formato decimal (`255.255.255.0`). Cisco acepta
  también el formato de barra (`/24`), pero el clásico es el decimal y es el que vas a ver en casi
  todos los ejemplos y exámenes.
- `<next-hop>` (o "próximo salto") es la IP del equipo vecino al que hay que entregarle el
  paquete. Es la dirección del router que sigue en el camino, no la del destino final.

**Qué tenés que ver vos en pantalla:** después de escribir el comando no pasa nada visible. IOS
vuelve al símbolo del sistema sin mensaje de éxito. Para comprobar que quedó, se mira la tabla.

Ejemplo clásico: R1 quiere llegar a la red `192.168.2.0/24`, que está del otro lado de R2 (IP `10.0.12.2`):

```cisco
R1(config)# ip route 192.168.2.0 255.255.255.0 10.0.12.2
```

**Qué hace este bloque:** configura, en el router llamado R1, una ruta hacia la red
`192.168.2.0` con máscara `255.255.255.0`, entregándole los paquetes a `10.0.12.2`.

**Qué significa el símbolo del sistema:** `R1` es el nombre del equipo y `(config)#` indica modo de
configuración global, el único donde los comandos cambian algo. Si escribís `ip route` desde `R1#`,
el router te va a decir que el comando no existe: estás en el modo equivocado.

**Qué tenés que ver vos en pantalla:** nada. Cero confirmación, cero "ok". La única verificación
honesta es mirar la tabla después, y es lo que hacemos en el bloque siguiente.

Después de ese comando, la tabla de R1 muestra:

```cisco
S       192.168.2.0/24 [1/0] via 10.0.12.2, GigabitEthernet0/0
```

**Qué hace este bloque:** confirma que la ruta entró y que el router ya sabe por dónde mandar los
paquetes hacia esa red.

**Qué significa cada parte:** `S` es que la ruta es estática (la escribiste vos); `192.168.2.0/24`
es la red destino; `[1/0]` es AD 1 y métrica 0, el par típico de una estática; `via 10.0.12.2` es el
next-hop; `GigabitEthernet0/0` es la interfaz por la que sale.

**Qué tenés que ver vos en pantalla:** una línea `S` con **la interfaz al final**. Si la interfaz
aparece vacía o la ruta no figura, el next-hop no es alcanzable: el router aceptó el comando pero
no puede usarlo, porque no tiene cómo llegar a `10.0.12.2`. Esa es la primera cosa que hay que
revisar cuando una estática "no aparece".

> **Analogía:** la ruta estática es el **recorrido escrito a mano** que le dejás en el asiento al chofer nuevo: "Para ir al depósito, doblá en la estación de servicio". El chofer lee eso y obedece. No pregunta, no aprende, no duda.

### 6.2. Qué se puede (y qué no) con estáticas

| Lo que podés hacer | Lo que NO podés hacer cómodamente |
|--------------------|-----------------------------------|
| Conectar redes chicas (2-5 routers) | Redes grandes: son cientos de rutas escritas a mano |
| Crear rutas por defecto (default route) | Reaccionar a fallas: si un enlace cae, la estática no "se entera" |
| Redundancia simple (floating static) | Adaptarse a caminos alternativos automáticamente (hay que escribir todas las combinaciones a mano) |
| Laboratorios y exámenes (rápidas y predecibles) | Mantenimiento: cada cambio de topología = cambiar rutas a mano |

**Qué hace esta tabla:** pone en dos columnas lo que la ruta estática resuelve bien y lo que no,
para que sepas cuándo usarla y cuándo pasarte a un protocolo dinámico. Es una tabla de decisión,
no de definiciones.

**Columna por columna:**

- **Lo que podés hacer:** los casos donde escribir a mano es razonable. Fijate el patrón: redes
  chicas, situaciones simples, y todo lo que necesita ser predecible.
- **Lo que NO podés hacer cómodamente:** el mismo caso, del otro lado del mostrador. La palabra
  clave es *cómodamente*: técnicamente podrías escribir cien rutas a mano; el problema es el
  costo humano de mantenerlas.

**Qué tenés que ver vos en pantalla:** nada, pero sí en el diagrama de la red. Si tu red tiene
más de cuatro o cinco routers y más de un camino posible entre sedes, la tabla te está diciendo
que las estáticas se te van a volver un trabajo de tiempo completo.

> **Ventaja clave de la estática:** NO consume ancho de banda (no "habla" con nadie), NO es vulnerable a ataques de protocolos, y su comportamiento es 100% predecible. Por eso en la práctica se usa mucho la default route estática "hacia internet", incluso en redes gigantes.

Dos ventajas más que se valoran en el trabajo: es **fácil de auditar** (mirás una lista corta y
escrita por una persona) y **no reacciona a nada**, que acá es bueno: nadie puede inyectarte rutas
falsas. La desventaja es la otra cara: si el enlace se cae, no se entera de que hay otro camino.

### 6.3. El "camino de ida" no alcanza: el problema del ping que no vuelve

Este es EL error de principiante por excelencia del enrutamiento:

> Configuraste la estática en R1 hacia R2, hacés `ping 192.168.2.2` desde R1... y no responde. ¿Por qué? **Porque la ruta de vuelta no existe.** El paquete llega a la red 192.168.2.0 (R2 lo recibe), pero R2 no tiene ninguna ruta para volver a la red de R1. Sin ruta de retorno, descarta el paquete de respuesta... o la respuesta se pierde en el vacío.

**Qué es un `ping`:** es una herramienta de diagnóstico que manda un paquete ICMP de tipo *echo
request* (pedido de eco) y espera un *echo reply* (respuesta de eco). Es la forma más simple de
preguntar "¿llegás hasta acá y podés volver?". Y ojo con esa frase: el ping no mide solo la ida,
mide el viaje completo de ida **y** vuelta. Por eso es el detector perfecto de rutas faltantes.

**El enrutamiento es simétrico en teoría pero NO se deduce solo:** cada router DEBE tener rutas para llegar a todos los destinos por donde tiene que volver el tráfico. Regla del profesional:

> **Regla de oro:** SIEMPRE que configures una ruta en un router, preguntate: "¿y el router del otro lado, cómo vuelve?". El ping que no vuelve casi siempre es una ruta de vuelta que falta.

### Resumen

- Una ruta estática se escribe a mano con `ip route <red> <máscara> <next-hop>`.
- No confirma nada al escribirla: se verifica con `show ip route`, buscando la `S` y su interfaz.
- Sirve para redes chicas, rutas por defecto y redundancia simple; no reacciona a fallas.
- Es predecible y no consume ancho de banda; también es fácil de auditar y de romper.
- El error número uno es configurar la ida y olvidar la vuelta: el ping mide las dos.

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

**Qué hace este bloque:** muestra las dos maneras de completar el tercer dato del comando. La red
destino y la máscara son iguales; cambia qué le decís al router sobre cómo salir.

**Qué significa cada parte:** la línea que empieza con `!` es un comentario: IOS la ignora y sirve
para que un humano entienda la configuración. La variante A termina en una **dirección IP**; la B,
en un **nombre de interfaz**. Esa es toda la diferencia, y no es menor.

**Qué tenés que ver vos en pantalla:** las dos crean una ruta `S` hacia la misma red. En la
variante A aparece `via 10.0.12.2`; en la B no hay `via`, solo la interfaz.

| Variante | Le dice al router | Cuándo se usa |
|----------|-------------------|---------------|
| **A. Next-hop** | "Pasale el paquete a la IP 10.0.12.2" | Casi siempre. El router resuelve la MAC del vecino con ARP y manda. |
| **B. Interfaz** | "Sacalo por mi interfaz g0/0 y que se arregle" | Enlaces punto a punto (seriales) o cuando no conocés la IP del vecino. |

**Qué hace esta tabla:** compara las dos variantes por lo que cada una le dice al router y por el
caso de uso donde tiene sentido.

**Columna por columna:**

- **Variante:** el nombre con el que vas a encontrar cada forma en los libros y en las clases.
- **Le dice al router:** la frase que representa cada comando. Fijate el contraste: la primera es
  una instrucción con nombre y apellido (una IP); la segunda es una instrucción a ciegas ("salí
  por ahí").
- **Cuándo se usa:** la recomendación práctica. Next-hop casi siempre; interfaz solo en enlaces
  punto a punto (un cable entre exactamente dos equipos, como los seriales clásicos) o cuando no
  tenés la IP del vecino.

**Qué es ARP:** **ARP** son las siglas de *Address Resolution Protocol* (protocolo de resolución de
direcciones). Su trabajo es traducir una dirección IP a una dirección MAC dentro de la red local:
"che, ¿quién tiene la IP 10.0.12.2? Pasame tu dirección física". El router pregunta, el vecino
contesta, y con esa respuesta arma el sobre de capa 2. Por eso la variante A funciona: el router
sabe a qué IP entregar, y ARP le consigue la MAC.

En la variante B, en cambio, el router no tiene a quién preguntarle por el vecino: le dijiste
"salí por g0/0" y nada más. Entonces pregunta con ARP por la **IP de destino final**, esperando
que el destino final esté en ese mismo segmento. Si el destino está a varios saltos, nadie le
contesta: el paquete se pierde.

> **Ojo con la variante B en Ethernet:** si ponés solo `g0/0` en un enlace Ethernet compartido por varios routers, el router manda el paquete por esa interfaz **sin saber a quién** — pregunta con ARP por el destino final, y si el destino final no está en ese segmento, puede fallar. En enlaces seriales punto a punto no hay problema. Por eso, **regla práctica: en Ethernet, usá siempre next-hop.**

**Qué es Ethernet:** la red cableada de tu casa u oficina. Varios equipos comparten el mismo
cable o switch, así que "salir por la interfaz" no alcanza para saber a quién entregar. Un enlace
serial punto a punto es lo contrario: hay un solo vecino del otro lado.

La variante B, entonces, obliga al router a preguntar con ARP por la **IP de destino final**,
esperando que esté en ese mismo segmento. Si el destino está a varios saltos, nadie contesta.

La forma completa combina ambas para ser muy explícito:

```cisco
ip route 192.168.2.0 255.255.255.0 10.0.12.2 g0/0
```

**Qué hace este bloque:** escribe la ruta con las dos cosas a la vez: el vecino (next-hop) y la
puerta de salida (interfaz).

**Qué significa cada pieza:** los tres primeros datos son los mismos de siempre; el cuarto,
`g0/0`, le dice al router por dónde sacar el paquete para llegar a ese vecino. Es redundante pero
útil: evita que el router tenga que buscar la interfaz en su tabla y, en algunos equipos, permite
que la ruta quede activa aunque el next-hop se aprenda por otra vía.

**Qué tenés que ver vos en pantalla:** la ruta aparece igual que la variante A, con `via` y con la
interfaz. La diferencia es interna; para el examen alcanza con saber que las tres formas existen
y cuál conviene.

### 7.2. Y si el next-hop no es alcanzable...

Si el next-hop que pones NO existe o no es alcanzable (no tenés ruta hacia él), el router rechaza la configuración o la marca como inactiva. Verás la ruta pero con una `?` o directamente no funcionará el reenvío. La verificación honesta de una estática siempre es un ping **desde el destino hacia atrás** o `show ip route` bien leído.

Una precisión para que no te confundan en un examen ni en el trabajo: en IOS el comando **se
acepta igual**. Lo que pasa es que la ruta **no se instala en la tabla** hasta que el next-hop sea
alcanzable. Si la buscás con `show running-config`, está; con `show ip route`, no aparece. Cuando el
vecino vuelve a ser alcanzable, aparece sola. Si leíste que el router "rechaza la configuración",
la versión correcta es esta: la acepta y la deja durmiendo.

**Qué significa "alcanzable" acá:** que el router tenga en su tabla alguna entrada que le permita
llegar a la IP del next-hop, normalmente una ruta `C` (el vecino está en una red pegada).

**Qué tenés que ver vos en pantalla:** `show ip route` te dice si la ruta está activa; `show
running-config | include ip route` te dice si está configurada. Si aparece en el segundo y no en el
primero, el next-hop es inalcanzable.

### Resumen

- Una estática se puede escribir con next-hop (IP del vecino) o con interfaz de salida.
- En Ethernet usá siempre next-hop: la interfaz sola no dice a quién entregar el paquete.
- En enlaces punto a punto la variante de interfaz es aceptable, porque hay un solo vecino.
- ARP es el que traduce IP a MAC para poder entregar el paquete al vecino.
- Si el next-hop no es alcanzable, IOS acepta el comando pero no instala la ruta en la tabla.

---

## 8. La ruta por defecto: el Plan B universal

### 8.1. Qué es

La **ruta por defecto** (default route) le dice al router: *"todo lo que no sepas a dónde mandar, mandalo acá"*. Es el "cajón de todo lo que no tiene lugar".

Es la entrada más humilde de la tabla: no pretende conocer el mundo, solo ofrece una salida para
lo desconocido. Casi todo el tráfico que sale de tu casa viaja gracias a una.

> **Analogía:** es el número de **informes** del edificio postal: cuando el cartero no sabe en qué piso vive alguien, pregunta en informes. La respuesta casi nunca es "volvé a tu casa": es "mirá, todo lo que no sabés mandalo a la central".

### 8.2. Cómo se configura

```cisco
R1(config)# ip route 0.0.0.0 0.0.0.0 10.0.12.2
```

**Qué hace este bloque:** configura en R1 una ruta que dice "cualquier destino que no conozca,
mandalo a 10.0.12.2".

**Qué significa cada pieza:** `0.0.0.0` como red y `0.0.0.0` como máscara son la combinación de
todo ceros: la red más grande posible, la que abarca cualquier dirección. El tercer dato es el
next-hop, igual que en cualquier estática.

**Qué tenés que ver vos en pantalla:** nada al escribirla; después, en la tabla, una línea `S*`.
Ese asterisco es la marca de que el router la reconoce como su puerta de último recurso.

¿Por qué `0.0.0.0 0.0.0.0`? Porque esa "red" con máscara de todo ceros es la menos específica posible: **matchea con cualquier destino**. Cualquier paquete que no tenga una ruta más específica cae en esta.

La lógica de fondo es la misma que gobierna toda la selección de rutas: una ruta es un conjunto de
direcciones, y la máscara dice cuán grande es. Una `/24` abarca 256 direcciones; una `/0` abarca
**todas**. Menos específica imposible: sirve como último recurso para cualquier destino.

En la tabla aparece así:

```cisco
S*      0.0.0.0/0 [1/0] via 10.0.12.2, GigabitEthernet0/0
```

**Qué hace este bloque:** muestra la ruta por defecto ya instalada. Es la misma línea de siempre
con dos marcas distintivas: el asterisco y el destino `0.0.0.0/0`.

**Qué significa cada parte:** `S` es estática (la configuraste vos); `*` es que es candidata a
ruta por defecto; `0.0.0.0/0` es "cualquier destino"; `[1/0]` es AD 1 y métrica 0; `via
10.0.12.2` es el vecino al que se le entrega todo lo desconocido; `GigabitEthernet0/0` es la
puerta de salida.

**Qué tenés que ver vos en pantalla:** el asterisco. Si no está, la ruta existe pero no es la
puerta de último recurso; si la línea no está, no hay plan B y todo lo desconocido se descarta.

El `*` marca que es la default candidate (la "gateway of last resort").

### 8.3. Por qué es tan importante

| Escenario | Por qué la default es la solución |
|-----------|-----------------------------------|
| Router de borde de una empresa | "Todo lo que no es de mi empresa, salí por acá hacia el ISP" — UNA ruta reemplaza a millones |
| Router de tu casa | Tu router doméstico tiene una default route hacia el módem del ISP: no conoce "internet", solo conoce "salí por la puerta de afuera" |
| Simplicidad | En vez de escribir rutas para cada red lejana, escribís UNA para todo lo desconocido |

**Qué hace esta tabla:** muestra los tres casos donde una sola ruta reemplaza a miles. Es la
justificación práctica de la ruta por defecto.

**Columna por columna:**

- **Escenario:** dónde aparece el problema. Los dos primeros son los casos reales; el tercero es
  el principio general.
- **Por qué la default es la solución:** la razón concreta. Fijate la palabra que se repite:
  "todo lo que no es…". La default no describe el mundo, describe el borde del mundo conocido.

**Qué tenés que ver vos en pantalla:** en tu router de casa, la tabla de rutas tiene una línea
`0.0.0.0/0` apuntando a la IP del módem o de la ONT del proveedor. Esa línea es la razón por la
que podés abrir cualquier sitio: tu router no sabe dónde está ese sitio, solo sabe por dónde
preguntar.

**Qué es ISP:** *Internet Service Provider* (proveedor de servicio de Internet): la empresa que te
vende la conexión. Su router es el "vecino" al que le entregás todo lo que no es tuyo.

> **Dato clave para entender internet:** ningún router de internet tiene una ruta para "toda internet". Tienen rutas para redes específicas... y una **default route** para todo lo demás. Internet no es una red gigante que todos conocen: es una red donde cada uno **sabe un pedacito y pasa el resto hacia arriba**.

Un matiz para que la frase no te mienta cuando la repitas: los routers de borde y los de una
empresa suelen tener default; los routers grandes de un proveedor, los que están en el centro de
la red, muchas veces llevan la tabla completa de rutas de Internet y **no** usan default, porque
necesitan distinguir los caminos. La idea que importa es la otra: nadie tiene un mapa único, todos
tienen un pedazo y una política para lo que les falta.

### Resumen

- La ruta por defecto es el plan B: todo lo que no está en la tabla sale por ahí.
- Se escribe `0.0.0.0 0.0.0.0`, que es la red más grande posible (un `/0`).
- En la tabla aparece como `S*`, con asterisco de candidata a defecto.
- Ahorra miles de rutas: una sola entrada cubre todo lo desconocido.
- En Internet cada router conoce un pedazo y deriva el resto, pero no todos usan default.

---

## 9. Floating static route: la redundancia manual

### 9.1. El problema: ¿y si el enlace principal se cae?

Pensá en dos routers conectados por DOS caminos: un enlace principal (rápido, caro) y uno de respaldo (lento, barato, olvidado). Si el principal se cae, lo ideal es que el tráfico pase automáticamente por el respaldo.

Con una sola estática, eso NO pasa: cuando el enlace principal cae, la ruta desaparece y no hay reemplazo. La red se queda sin camino.

Y hay un detalle que agrava el problema: la estática no "se entera" de nada. No tiene un
protocolo que le avise que el camino se rompió; deja de ser utilizable porque su next-hop ya no
es alcanzable, y el router la saca de la tabla sin tener con qué reemplazarla.

En una red chica con dos caminos, eso se arregla escribiendo las dos rutas desde el principio y
diciéndole al router cuál preferir.

### 9.2. La solución: dos rutas con AD distintas

Acá entra la **Administrative Distance** (AD) que viste en la sección 4: el número que dice "qué tan confiable es la fuente".

Podés escribir DOS rutas estáticas al mismo destino con AD diferentes:

```cisco
! Ruta principal (AD 1, la default de las estáticas)
ip route 192.168.2.0 255.255.255.0 10.0.12.2

! Ruta de respaldo (AD 200 — solo se usa si la principal desaparece)
ip route 192.168.2.0 255.255.255.0 10.0.13.2 200
```

**Qué hace este bloque:** configura dos rutas hacia la misma red destino. La primera usa el
camino normal y tiene la AD por defecto de las estáticas. La segunda usa otro camino y lleva un
`200` al final, que es el cuarto dato opcional del comando: la AD.

**Qué significa cada pieza:** las dos primeras líneas de cada ruta son iguales (red y máscara);
cambia el next-hop (`10.0.12.2` contra `10.0.13.2`, dos vecinos distintos) y, en la segunda, el
número final `200`. Ese número es la distancia administrativa: cuanto más alto, menos se cree en
la ruta.

**Qué tenés que ver vos en pantalla:** después de configurar las dos, `show ip route` muestra
**solo la principal**. La de respaldo está en la configuración pero no en la tabla: está dormida.
Eso no es un error, es exactamente el comportamiento buscado.

| Ruta | AD | Estado |
|------|:--:|--------|
| Principal (`via 10.0.12.2`) | 1 | **Activa**: gana siempre que exista |
| Respaldo (`via 10.0.13.2`) | 200 | **Dormida**: esperando en la tabla |

**Qué hace esta tabla:** resume el estado de las dos rutas y por qué. Es la foto de la
redundancia funcionando.

**Columna por columna:**

- **Ruta:** el camino, identificado por su next-hop. Es la forma más rápida de distinguirlas
  cuando el destino es el mismo.
- **AD:** el número de confiabilidad. 1 gana; 200 pierde.
- **Estado:** qué hace cada una mientras la otra existe. La palabra "dormida" es la clave: no está
  borrada, está esperando.

**Qué tenés que ver vos en pantalla:** una sola línea para ese destino. Si ves dos, algo raro
pasa: o tienen la misma AD (y entonces el router desempata por métrica o por orden) o estás
mirando la configuración, no la tabla.

**¿Cuándo se activa el respaldo?** Cuando la principal **desaparece** de la tabla (porque el enlace se cayó o el next-hop dejó de ser alcanzable). Ahí el router elige la siguiente con menor AD, y el respaldo —¡que estaba guardado como "candidate"!— se activa.

> **Analogía:** es el **neumático de auxilio**. Está en el auto (guardado en la tabla), pero solo se usa cuando la rueda principal falla. Nadie conduce toda la vida con el auxilio; es un plan de contingencia. En redes, ese patrón se llama **floating static route** porque "flota" en la tabla esperando que la principal se hunda.

### 9.3. El detalle que hay que entender

> La ruta de respaldo **está configurada pero dormida**: no aparece como ruta activa mientras la principal exista. Si hacés `show ip route`, solo vas a ver la principal. El respaldo aparece recién cuando la principal muere. "Floating" significa exactamente eso: aparece y desaparece según la salud de la principal.

**Qué significa "flotante" en la práctica:** la ruta sube y baja de la tabla según la salud de la
principal. No está apagada: está compitiendo y pierde. Cuando la que ganaba desaparece, la que
perdía ocupa su lugar; si la principal vuelve, la flotante se hunde sola.

Regla práctica del AD en estáticas:

| Usamos | AD | Por qué |
|:------:|:--:|---------|
| Estática normal | 1 (default) | Gana a casi todo |
| Floating static | 200 o más | Pierde contra dinámicas, gana contra nada (es el último recurso) |

**Qué hace esta tabla:** fija los dos valores de AD que vas a usar en la vida real y el motivo de
cada uno.

**Columna por columna:**

- **Usamos:** para qué sirve cada valor, en lenguaje de receta.
- **AD:** el número concreto. El primero es el que viene por defecto cuando no lo escribís; el
  segundo hay que escribirlo a mano al final del comando.
- **Por qué:** la consecuencia de elegir ese número. Fijate que el 200 está pensado para perder:
  pierde contra las rutas dinámicas, que tienen AD más baja, y por eso solo se usa cuando no queda
  nada.

**Qué tenés que ver vos en pantalla:** en la línea de la ruta de respaldo vas a ver `[200/0]` en
vez de `[1/0]`. Ese número entre corchetes es la huella digital de una floating static.

### Resumen

- Una sola estática no reemplaza nada cuando el enlace principal se cae.
- La solución es escribir dos rutas al mismo destino con AD distinta (1 y 200).
- La de AD 200 queda dormida: está configurada, pero no aparece en la tabla.
- Se activa sola cuando la principal desaparece, y se vuelve a dormir si la principal vuelve.
- Se llama floating static porque "flota": sube y baja según la salud de la principal.

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

**Cómo se lee:** las líneas verticales y horizontales son cables; los recuadros, routers; los
nombres con IP entre paréntesis, computadoras. Arriba de cada cable aparece la red que conecta a
sus dos puntas.

**Qué significa cada parte:** `192.168.1.0/24` es la red de PC-A (256 direcciones: `.10` es la PC y
`.254` el router). `10.0.12.0/30` es la red del cable del medio: un `/30` tiene cuatro direcciones,
o sea **dos utilizables**, justo las que necesitan dos routers. `192.168.2.0/24` es la red de PC-B.
Los `.1` y `.2` de los recuadros son las puntas de la red del medio: `10.0.12.1` y `10.0.12.2`.

**Qué tenés que ver vos en pantalla:** en Packet Tracer, cuatro dispositivos y tres cables. Si te
sobra o te falta uno, el laboratorio no va a funcionar.

**Qué es una puerta de enlace (gateway):** el router que un equipo usa para salir de su red. PC-A
no puede entregarle un paquete a alguien de otra red: se lo entrega a su gateway, y el gateway se
encarga. Es el portero al que le dejás la carta para otra dirección.

Interfaces:

```text
R1: g0/0 = 10.0.12.1/30    g0/1 = 192.168.1.254/24
R2: g0/0 = 10.0.12.2/30    g0/1 = 192.168.2.254/24
```

**Qué hace este bloque:** lista qué dirección tiene cada interfaz de cada router. Es el dato que
necesitás para escribir las rutas sin inventar nada.

**Qué significa cada parte:** `R1` y `R2` son los routers; `g0/0` y `g0/1` son sus interfaces (la
abreviación de `GigabitEthernet0/0` y `GigabitEthernet0/1`); el `=` separa la interfaz de su IP.
Fijate el patrón: **g0/0 mira al otro router, g0/1 mira a la PC**.

**Qué tenés que ver vos en pantalla:** son las mismas direcciones que tiene que mostrar `show ip
interface brief`. Si una no coincide, la ruta que escribas apunta a la nada.

### 10.2. Las tablas antes de configurar nada

Estado natural (sin configurar estáticas), con solo las rutas conectadas:

```cisco
! TABLA DE R1                          ! TABLA DE R2
C  192.168.1.0/24  via g0/1            C  192.168.2.0/24  via g0/1
L  192.168.1.254/32 via g0/1           L  192.168.2.254/32 via g0/1
C  10.0.12.0/30    via g0/0            C  10.0.12.0/30    via g0/0
L  10.0.12.1/32    via g0/0            L  10.0.12.2/32    via g0/0
```

**Qué hace este bloque:** muestra, lado a lado, las tablas de los dos routers antes de configurar
nada. A la izquierda R1, a la derecha R2. Es un resumen didáctico, no una salida literal: en un
router real cada tabla se ve como una lista vertical.

**Cómo se lee:** cada fila es una ruta: letra de origen, red con máscara, interfaz de salida. Las
dos primeras filas de cada columna son la red de la PC; las dos últimas, el cable entre routers.

**Qué significa el patrón:** cada router conoce **su** red de PC, **su** IP en el cable del medio y
la red del cable del medio. Ninguno conoce la red del otro lado. Esa simetría se rompe con las
estáticas.

**Qué tenés que ver vos en pantalla:** si aparece alguna `S` en este punto, hay algo configurado de
antes. Empezá de cero para que el experimento tenga sentido.

**Problema:** R1 no conoce `192.168.2.0/24` y R2 no conoce `192.168.1.0/24`. Si PC-A pingea a PC-B: el paquete llega a R1 → R1 mira la tabla → **no tiene ruta** → lo descarta (ni siquiera tiene default). *Ping fail.*

Fijate que el fallo no es de cable ni de IP: es de información. Los cables están bien, las IPs
están bien, y aun así no hay comunicación, porque a R1 le falta una línea en su tabla.

### 10.3. Configurando las estáticas (las dos famosas)

```cisco
! R1
R1(config)# ip route 192.168.2.0 255.255.255.0 10.0.12.2

! R2  ← la ruta de VUELTA, el error más común es olvidarla
R2(config)# ip route 192.168.1.0 255.255.255.0 10.0.12.1
```

**Qué hace este bloque:** completa las dos tablas. R1 aprende cómo llegar a la red de PC-B y R2
aprende cómo llegar a la red de PC-A.

**Qué significa cada línea:** en R1, la red destino es `192.168.2.0/24` (la de PC-B) y el vecino
es `10.0.12.2` (R2). En R2 es al revés. La flecha `←` del comentario no es sintaxis: señala la
línea que todos olvidan.

**Qué tenés que ver vos en pantalla:** una `S` en cada router. Si en R1 está y en R2 no, ya sabés
por qué el ping va a fallar: la vuelta no existe.

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

**Qué hace este bloque:** cuenta la película completa del `ping`, en seis pasos, con las dos
vueltas del viaje. Los números impares (1, 3, 5) son un equipo decidiendo; los pares (2, 4, 6)
son el enrutamiento en acción.

**Cómo se lee:** cada paso tiene la decisión y su motivo; la flecha `→` introduce la línea de la
tabla que el router consultó. En la ida el par es `192.168.1.10 → 192.168.2.10`; en la vuelta se
invierte.

**Qué significa cada concepto que aparece:** el **gateway** es la IP del router de la propia red;
el **sobre Ethernet** es el marco de capa 2 que envuelve al paquete en cada tramo y cuyas MAC
cambian en cada salto; la **ruta `C`** es una red pegada a la interfaz, que el router entrega
directo; el **echo** es el pedido y la respuesta del `ping`.

**Qué tenés que ver vos en pantalla:** en el laboratorio, líneas `Reply from 192.168.2.10` con
tiempos en milisegundos y un resumen con los paquetes enviados y recibidos. Si dice `0 received`,
el paquete no volvió: falta la ruta de vuelta.

> **El momento que resume TODO este manual:** cada router decide **independientemente** con SU tabla. PC-A y PC-B nunca "saben" que existen routers entre ellos: los routers se pasan el paquete como una posta, y cada uno solo conoce su pedacito del camino. El ping funciona SOLO SI TODOS tienen su pedacito — ida Y vuelta.

Una precisión honesta sobre el paso 2, porque el detalle importa cuando estudies capas: la
dirección IP de origen y la de destino **no** cambian en el viaje, pero el paquete IP sí se
modifica en un campo. Cada router baja en uno el **TTL** (*Time To Live*, tiempo de vida), un
contador que evita que un paquete quede girando para siempre si hay un bucle. Cuando el TTL llega
a cero, el paquete se descarta. Así que "el paquete IP no cambia" vale para las direcciones, no
para el contador.

### Resumen

- En la topología del manual, cada router conoce solo su red de PC y el cable del medio.
- Por eso el ping falla antes de configurar: no es un cable roto, es información faltante.
- Se arregla con dos estáticas, una en cada router, cada una apuntando al vecino.
- El viaje completo son seis pasos: tres de ida y tres de vuelta, cada uno con su consulta a la tabla.
- La IP de origen y destino no cambia; la MAC cambia en cada salto y el TTL baja en uno.

---

## 11. Aplicación: laboratorio guiado en Packet Tracer

> Este laboratorio extiende el Lab 5 de rutas estáticas de la serie de Packet Tracer. Si no tenés Packet Tracer abierto, este es el momento perfecto: la teoría de las secciones 1-10 se entiende el doble viendo las tablas en vivo.

**Qué es Packet Tracer:** un simulador de redes de Cisco, gratuito para estudiantes, que imita el
comportamiento de routers y switches para practicar comandos sin comprar equipos.

### Paso 1 — Armar la topología

1. Tres routers no hacen falta: usá **2 routers (R1, R2)** y **2 PCs (PC-A, PC-B)**, como la topología de la sección 10.
2. Cables **Copper Straight-Through** entre PC→Router.
3. Entre R1 y R2: cable directo también (en Packet Tracer los routers modernos usan GigabitEthernet, autonegociado).

**Qué significa cada paso:** dos routers alcanzan para ver el fenómeno completo. *Copper
Straight-Through* es el cable de cobre directo (los ocho hilos en el mismo orden en las dos
puntas), el que se usa entre equipos distintos. Entre los routers, la interfaz GigabitEthernet
**autonegocia** velocidad y dúplex, así que un cable directo funciona.

**Qué tenés que ver vos en pantalla:** los cuatro equipos conectados según el dibujo de la sección
10, con los puntos de conexión en verde. Si un punto queda rojo o naranja, revisá el tipo de cable
o esperá a que negocie.

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

**Qué hace este bloque:** entra en cada interfaz y le pone dirección y máscara, y la enciende.

**Qué significa cada línea:** `interface g0/0` selecciona la interfaz (lo que sigue se aplica a
ella); `ip address` le asigna dirección y máscara; `255.255.255.252` es la máscara del `/30`; `no
shutdown` la enciende, y es la línea que más se olvida del laboratorio.

**Qué tenés que ver vos en pantalla:** los triángulos de las interfaces en verde, y en `show ip
interface brief`, `up` y `up` en las dos columnas de estado. Si ves `administratively down`, faltó
el `no shutdown`.

### Paso 3 — IPs de las PCs

| PC | IP | Máscara | Gateway |
|----|-----|---------|---------|
| PC-A | 192.168.1.10 | 255.255.255.0 | 192.168.1.254 |
| PC-B | 192.168.2.10 | 255.255.255.0 | 192.168.2.254 |

**Qué hace esta tabla:** dice qué configurar en la ventana de cada PC. Es lo que hace que la PC
sepa a quién entregarle los paquetes que no son de su red.

**Columna por columna:** **IP** es la dirección dentro de la red que le toca; **Máscara** es
`255.255.255.0`, la del `/24`, que le dice a la PC cuál es el límite de su red; **Gateway** es la
IP del router de su red, el dato que más se equivoca.

**Qué tenés que ver vos en pantalla:** si el gateway está mal, la PC no sale de su red. Es un error
silencioso: nadie te avisa que lo escribiste mal, simplemente no funciona.

> **Ojo:** el gateway de cada PC es el router de SU red. PC-B no "sabe" que existe R1: su gateway es R2, y punto.

### Paso 4 — El momento de la verdad

Sin configurar nada más, corré desde PC-A:

```text
ping 192.168.2.10
```

**Qué hace este bloque:** manda cuatro pedidos de eco desde PC-A hacia PC-B con el `ping` de la PC
simulada. Se escribe en la consola de la pestaña Escritorio, igual que en Windows o Linux.

**Qué tenés que ver vos en pantalla:** `Request timed out` cuatro veces, o puntos (`.`) en la vista
de simulación. Eso es un *timeout*: el paquete salió y no volvió nada.

**Va a fallar** (timeout). Esto NO es un bug: es la teoría funcionando. R1 no tiene ruta a la red de PC-B. Verificá:

```cisco
R1# show ip route
```

**Qué hace este bloque:** muestra la tabla de R1 en el momento del fallo. Es la prueba de que el
problema es de información, no de cables.

**Qué tenés que ver vos en pantalla:** ninguna línea `S` y ninguna línea con `192.168.2.0`. Si
aparece la red de PC-B, ya está configurada de antes.

Fijate que NO aparece ninguna `S`. Ahora configurá las estáticas (ida y vuelta):

```cisco
! R1
R1(config)# ip route 192.168.2.0 255.255.255.0 10.0.12.2

! R2
R2(config)# ip route 192.168.1.0 255.255.255.0 10.0.12.1
```

**Qué hace este bloque:** es la misma configuración de la sección 10.3, ahora en el simulador.
Primero la ida en R1, después la vuelta en R2.

**Qué significa cada línea:** las direcciones salen del paso 3: la red de PC-B es `192.168.2.0/24`
y se llega por `10.0.12.2`; la de PC-A es `192.168.1.0/24` y se llega por `10.0.12.1`.

**Qué tenés que ver vos en pantalla:** nada al escribir. La comprobación es el paso 5.

### Paso 5 — Verificar

```cisco
R1# show ip route
```

**Qué hace este bloque:** vuelve a mostrar la tabla de R1, ahora con las estáticas puestas.

**Qué tenés que ver vos en pantalla:** una línea `S` con destino `192.168.2.0/24`, `[1/0] via
10.0.12.2` y la interfaz `GigabitEthernet0/0` al final.

Vas a ver las dos `S` (la de 192.168.2.0 y quizás una default si la agregás). Y el ping:

```text
ping 192.168.2.10
```

**Qué hace este bloque:** repite el ping del paso 4, ahora que las tablas están completas.

**Qué tenés que ver vos en pantalla:** cuatro líneas `Reply from 192.168.2.10`, con tiempos de
respuesta (por ejemplo `time=1ms`) y un resumen `4/4` o `100%`. En la vista de simulación, cada `!`
es una respuesta recibida y cada `.` un paquete perdido.

**PRIMER REPLIES!** (si no, revisá el Paso 3: gateway de PC-B o la ruta de vuelta en R2).

Traducido: tenés que ver respuestas, no timeouts. Si ves `!!!!`, el camino completo funciona; si
ves `...`, no hay vuelta; una mezcla es un camino inestable (tema de troubleshooting).

### Paso 6 — El experimento que mata el mito

Ahora borrá la estática de R2:

```cisco
R2(config)# no ip route 192.168.1.0 255.255.255.0 10.0.12.1
```

**Qué hace este bloque:** elimina la ruta de vuelta. El prefijo `no` delante de un comando de
configuración es la forma de deshacerlo en IOS: `no ip route ...` borra exactamente esa ruta, con
los mismos datos con los que la creaste.

**Qué significa cada parte:** es el mismo comando del paso 4 con `no` adelante. Si te equivocás en
un número, IOS no borra nada y no avisa: copiá el comando original en vez de escribirlo de memoria.

**Qué tenés que ver vos en pantalla:** inmediatamente después, `show ip route` en R2 ya no
muestra la ruta hacia `192.168.1.0/24`.

Y repetí el ping desde PC-A... **falla de nuevo**, aunque la ruta de IDA siga existiendo en R1. ¿Por qué? Porque la vuelta murió. Este experimento de 30 segundos te enseña más que diez capítulos de teoría: **sin ruta de vuelta no hay ping**. Dejá la ruta puesta de nuevo antes de terminar.

Para dejarla puesta, volvés a escribir el mismo comando sin `no`:

```cisco
R2(config)# ip route 192.168.1.0 255.255.255.0 10.0.12.1
```

**Qué hace este bloque:** restaura la ruta de vuelta que borraste. Es el mismo comando del paso 4,
y sirve para comprobar que el ping vuelve a funcionar.

**Qué tenés que ver vos en pantalla:** la `S` de vuelta en `show ip route` y el ping exitoso otra
vez. Si no vuelve, revisá la red y el next-hop.

> **HACELO VOS:** con la topología arriba y sin mirar las soluciones, escribí para cada router las rutas estáticas que hacen falta para que PC-A llegue a PC-B Y PC-B a PC-A. Después configurá y verificá con `show ip route` y un ping. Si algo no anda, seguí la regla de la sección 12.

### Resumen

- El laboratorio arma la topología del capítulo 10 con dos routers y dos PCs.
- Cada interfaz necesita IP, máscara y `no shutdown`; sin eso no hay ruta conectada.
- El gateway de cada PC es el router de su propia red, no el del otro lado.
- El ping falla hasta que existan las dos estáticas, y vuelve a fallar si borrás la de vuelta.
- Ese experimento demuestra en 30 segundos lo que la teoría explica en diez capítulos.

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

**Qué hace esta tabla:** es la lista de los siete errores que explican la enorme mayoría de los
problemas de enrutamiento en redes chicas y medianas. Está ordenada por frecuencia, no por
dificultad.

**Columna por columna:** **#** es el número del caso; **Error** lo nombra en dos palabras;
**Síntoma** es lo que ves vos, y la clave es que varios errores producen el mismo; **Diagnóstico y
solución** es el comando que los separa y qué hacer. Leé esa última columna como un procedimiento.

**Qué tenés que ver vos en pantalla:** "no hay ping" es el síntoma 1 y el 7; "no aparece la ruta"
es el 2; "la ruta existe pero no anda" es el 3, el 4 y el 5. El síntoma te dice por dónde empezar,
no la respuesta. Y el error 6 es el único que no se arregla desde el router.

### 12.2. La metodología en 5 pasos para "no llego a la red X"

Cuando un destino es inalcanzable, esta es la secuencia profesional:

```text
1. ¿Las interfaces del camino están up/up?        → show ip interface brief (en cada router)
2. ¿La tabla del router de mi red tiene la ruta?  → show ip route <red_destino>
3. ¿El siguiente router también?                  → repetir en cada salto
4. ¿El next-hop es alcanzable?                    → ping al next-hop desde el router
5. ¿La vuelta existe en el destino?               → show ip route en el router del destino
```

**Qué hace este bloque:** ordena el diagnóstico en cinco preguntas, de la más básica a la más
profunda. El orden no es arbitrario: cada paso descarta una capa de problemas y te deja el
siguiente más chico.

**Cómo se lee:** a la izquierda, la pregunta; a la derecha, el comando que la responde. La flecha
`→` significa "la contestás con".

**Qué significa cada paso:** sin interfaces arriba no hay nada (paso 1); el router de tu red es el
primero de la cadena (paso 2); si no tiene la ruta, no hay nada que buscar más adelante (paso 3);
aunque exista, el next-hop tiene que ser alcanzable (paso 4); y falta la vuelta, el error más
común y el último que se revisa (paso 5).

**Qué tenés que ver vos en pantalla:** no es un comando único, son cinco. Buscás el primer punto de
la cadena donde la respuesta es "no": ese es el culpable.

Con `traceroute` (de la PC o el router) ves DÓNDE se corta la cadena: el salto que deja de responder es el router mal configurado.

**Qué es `traceroute`:** manda paquetes con un TTL cada vez más grande y anota quién contesta en
cada salto. El resultado es la lista de routers, en orden, hasta el destino: si se corta en el
salto 3, ya sabés dónde mirar.

> **Regla de oro final:** el enrutamiento casi nunca falla por magia. Falló porque alguien le puso mal una IP, olvidó una ruta de vuelta o no encendió una interfaz. El 90% de los problemas de rutas están en esa lista de la sección 12.1.

**Qué hacer con esta regla en la mano:** antes de abrir un ticket o de culpar al proveedor,
recorré la lista de siete. Cuando no alcance, ya tenés el diagnóstico fino para escalarlo con
datos.

### Resumen

- Siete errores explican casi todo: ruta de vuelta, interfaz apagada, next-hop, máscara, variante, gateway.
- Varios errores producen el mismo síntoma, por eso hay que diagnosticar, no adivinar.
- La metodología es de cinco pasos, de la interfaz hacia la ruta de vuelta.
- `traceroute` muestra el salto donde se corta la cadena, y con eso acotás el router culpable.
- El enrutamiento no falla por magia: falla por una IP mal puesta o una ruta que falta.

---

## 13. Comprobá lo que aprendiste

Respondé antes de mirar las respuestas, después destapá cada una con el detalle.

Siete preguntas de repaso. Si contestás cinco sin mirar, el manual cumplió su función.

**1. ¿Cuáles son los dos trabajos distintos de un router?**

#### Ver respuesta

**Enrutamiento** (decidir cuál es la mejor ruta para cada destino y guardarla en la tabla, pasa ante cambios de topología) y **reenvío** (mirar la tabla y mandar cada paquete al next-hop correspondiente, pasa millones de veces por segundo). Uno piensa, el otro ejecuta.

**2. Un router recibe un paquete hacia una red que no conoce. ¿Qué hace?**

#### Ver respuesta

El router **descarta el paquete** y (según configuración) manda un ICMP "destination unreachable" al origen. NO lo manda "a todos lados" ni lo guarda esperando aprender. Salvo que tenga una **ruta por defecto** (`0.0.0.0/0`), en cuyo caso lo envía por esa ruta.

**3. ¿Qué significa cada parte de `S 192.168.2.0/24 [1/0] via 10.0.12.2, g0/0`?**

#### Ver respuesta

`S` = ruta estática. `192.168.2.0/24` = red destino con su máscara. `[1/0]` = AD 1 (confiable, la escribió el administrador) y métrica 0. `via 10.0.12.2` = next-hop (a quién pasar el paquete). `g0/0` = interfaz de salida. Traducción: "para llegar a la red 192.168.2.0/24, pasale el paquete a 10.0.12.2 por mi g0/0".

**4. ¿Por qué aparece una ruta `L` en la tabla de rutas?**

#### Ver respuesta

La ruta `L` (local) identifica la dirección IP propia de una interfaz del router. Es la "casa" del router: los paquetes dirigidos a esa IP están dirigidos al propio router (por ejemplo, un ping a 10.0.12.1 desde el vecino). Aparece sola, junto a la `C` (conectada).

**5. Configuraste la estática de ida y el ping no vuelve. ¿Qué revisás primero?**

#### Ver respuesta

La **ruta de vuelta**: en el router del DESTINO, `show ip route` — ¿tiene alguna ruta (estática, por defecto o dinámica) para volver a tu red? El enrutamiento es salto por salto e independiente: cada router decide con su tabla, y sin ruta de retorno la respuesta se descarta.

**6. ¿Qué es una floating static route y cuándo se activa?**

#### Ver respuesta

Es una ruta estática de respaldo con **AD alta** (ej. 200) hacia el mismo destino que una principal (AD 1). Mientras la principal exista en la tabla, la de respaldo está dormida. Se activa automáticamente cuando la principal **desaparece** (el enlace o el next-hop se cayó). Es la forma manual de lograr redundancia.

**7. ¿Por qué la ruta por defecto se escribe `0.0.0.0 0.0.0.0`?**

#### Ver respuesta

Porque esa combinación (todo ceros en red y en máscara) es la menos específica posible: matchea con CUALQUIER dirección destino. Es el "cajón de todo lo desconocido": si ninguna otra ruta matchea, el paquete va por ahí. Por eso un router de borde usa una sola default route hacia el ISP en lugar de conocer "toda internet".

### Resumen

- Las siete preguntas cubren los conceptos que hay que poder explicar sin mirar.
- Si te salen cinco, el manual hizo su trabajo; las que fallen marcan qué capítulo releer.
- Las respuestas usan el vocabulario del manual a propósito: es el que vas a necesitar en el trabajo.

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

**Qué hace esta tabla:** es la versión de bolsillo del manual. Cada fila define un término en una
línea, sin depender del resto del texto.

**Columna por columna:**

- **Término:** la sigla o el nombre corto, en negrita, tal como aparece en la tabla de rutas, en
  un libro o en una conversación de trabajo.
- **Qué es:** la definición operativa. Está escrita para leerse sola, así que sirve como chuleta
  cuando estás frente a un equipo y no querés releer un capítulo.

**Qué tenés que ver vos en pantalla:** si un mensaje de error o una línea de `show ip route` tiene
una palabra que no reconocés, buscala acá primero. Las cinco filas que resuelven la mayoría de los
casos son **Tabla de enrutamiento**, **Ruta estática**, **Next-hop**, **Administrative Distance** y
**Gateway of last resort**.

### Resumen

- El glosario es la versión de bolsillo: término y definición en una línea.
- Sirve para consultar durante un diagnóstico, no para leer de corrido.
- Las definiciones usan el mismo vocabulario que la tabla de rutas.
- Con cinco filas alcanza para el 80% de las consultas reales.

---

## 15. Resumen en 10 puntos

Diez frases para llevarte. Si tuvieras que explicarle el enrutamiento a alguien en cinco minutos,
estas son las que dirías, en este orden.

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

**Cómo leer esta lista.** Los puntos 1 a 3 son el mecanismo: quién decide, con qué y qué pasa si
no hay información. Los puntos 4 y 5 son la lectura de la tabla: el idioma y las rutas que
aparecen solas. Los puntos 6 a 9 son la parte práctica: cómo se escribe una ruta, por dónde sale,
quién la recibe de vuelta y cómo se cubre lo desconocido. El punto 10 es la primera idea de
redundancia, que es la puerta de entrada a los protocolos dinámicos.

---

> **Fuente:** Documentación propia basada en RFC 1812 (requirements for IPv4 routers), documentación oficial Cisco IOS (IP Routing: Static Configuration Guide), CCNA 200-301 Official Cert Guide (W. Odom) y material educativo de redes.

### Resumen

- Diez puntos: tres de mecanismo, dos de lectura de tabla, cuatro de práctica y uno de redundancia.
- Si te llevás una sola idea, que sea esta: el router decide paquete por paquete con su propia tabla, y sin entrada no hay reenvío.
- Si te llevás dos, agregá esta: la ruta de vuelta es parte de la ruta, y olvidarla es el error más común de todos.


# 43. Redistribución e Ingeniería de Tráfico

**Interconectar protocolos sin romper una red — y hacer que el tráfico vaya por donde vos querés**

---

Este manual es para alguien que ya sabe qué es una ruta y qué hace un router, pero que nunca juntó dos protocolos de enrutamiento en la misma red. No hace falta que sepas configurar de memoria los protocolos que van a aparecer: en el capítulo 1 los definimos uno por uno, con nombre y apellido.

Cinco palabras que vas a leer en cada capítulo:

- Un **router** (en español, encaminador) es un equipo con varias patas; cada pata está conectada a una red distinta. Su trabajo es pasar paquetes de una red a otra.
- Una **ruta** es una frase que el router guarda en su memoria: "para llegar a tal red, mandá el paquete por tal salida". Al conjunto de esas frases se lo llama **tabla de enrutamiento**, y es lo único que el router consulta para decidir por dónde sale cada paquete.
- Un **protocolo de enrutamiento** es el programa que corre dentro de los routers y arma esa tabla solo, hablando con los routers vecinos. Sin protocolo, las rutas habría que escribirlas a mano (las llamadas **rutas estáticas**).
- La **métrica** es el número con el que cada protocolo mide "qué tan bueno es un camino". Cuanto más chico, mejor. El detalle importante: cada protocolo mide con su propia vara, y esas varas no se pueden comparar entre sí.
- La **distancia administrativa** (AD) es un número que dice cuánto confía el router en la *fuente* de una ruta. Menor es más confiable: una ruta conectada vale 0, una estática 1, EIGRP 90, OSPF 110, RIP 120. La AD compara rutas de distinta fuente; la métrica compara rutas de la misma fuente.

**Promesa de este manual:** al final vas a poder conectar dos protocolos distintos sin que la red se caiga, vas a saber por qué la ruta "no aparece" cuando te olvidás de un número, y vas a poder cambiar a propósito el camino que la red elige. Y vas a poder diagnosticar los tres o cuatro errores que explican casi todas las fallas reales de este tema.

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

Cómo usar este índice: cada título es un capítulo y también es la dirección (la URL) con la que se publica la página. Si tenés poco tiempo, el camino corto es el capítulo 2 (por qué esto es peligroso), el 3 (la métrica con la que entra la ruta) y el 5 (el filtro que evita el desastre). Con esos tres ya podés redistribuir en un laboratorio sin romperlo. Los capítulos 4, 6 y 7 son la caja de herramientas; el 8 y el 9 son la parte que se usa cuando algo anda mal.

### Resumen

- Un protocolo de enrutamiento arma la tabla de rutas hablando con los vecinos; sin él, las rutas se escriben a mano.
- Cada protocolo mide los caminos con su propia métrica, y esas métricas no se comparan entre protocolos.
- La AD compara fuentes (conectada, estática, EIGRP, OSPF, RIP) y la métrica compara dentro de la misma fuente.
- Este manual empieza por el peligro, sigue por la mecánica y termina por el diagnóstico.

---

## 1. El problema: una red con varios protocolos

Hasta ahora cada manual te mostró un protocolo en su "mundo ideal": toda la red corriendo OSPF, o todo EIGRP, o todo RIP. En la vida real NO es así:

- Comprás una empresa que ya tenía OSPF y vos usás EIGRP.
- Dos empresas se fusionan y cada una tenía su protocolo.
- Un ISP te da BGP pero tu red interna sigue con OSPF.
- Un proveedor de voz usa RIP para una VLAN que nadie quiere tocar.

Leé esos cuatro casos como situaciones de oficina, no como teoría:

- **Comprás una empresa.** Vos administrás tu red con un protocolo y la empresa comprada trae el suyo. Nadie va a reconfigurar doscientas sucursales un domingo: en algún router hay que hacer que los dos mundos se entiendan.
- **Dos empresas se fusionan.** Es el mismo caso, pero simétrico: hay dos redes grandes, cada una sana por su lado, y una sola frontera donde se tocan.
- **El ISP te da BGP.** **ISP** son las siglas de *Internet Service Provider*, el proveedor de Internet. **BGP** es el *Border Gateway Protocol*, el protocolo que usan los proveedores para intercambiar rutas de Internet entre sí. Tu red interna no habla BGP: habla OSPF. En el borde hay que traducir.
- **El proveedor de voz usa RIP.** **RIP** es el *Routing Information Protocol*, el protocolo dinámico más viejo: mide los caminos contando saltos y considera inalcanzable todo lo que pase de 15 saltos. A veces un equipo de telefonía queda con una VLAN vieja que nadie quiere tocar. **VLAN** es una *Virtual LAN*, una red local separada por software dentro de los mismos switches.

Los tres protocolos que van a aparecer una y otra vez son:

- **OSPF**, *Open Shortest Path First* ("primero el camino más corto, y abierto"). Es un protocolo **de estado de enlace**: cada router publica su pedazo de red, todos arman el mismo mapa y cada uno calcula su camino más corto sobre ese mapa. Es estándar abierto, o sea que funciona entre fabricantes distintos.
- **EIGRP**, *Enhanced Interior Gateway Routing Protocol*. Es un protocolo de Cisco, pensado para redes internas grandes. Calcula una métrica compuesta (ancho de banda, retardo, confiabilidad, carga y MTU, el tamaño máximo de paquete que acepta un enlace) y guarda un camino de respaldo ya calculado.
- **BGP**, *Border Gateway Protocol*. Es el protocolo de los proveedores: conecta **AS**, o *Autonomous Systems* (sistemas autónomos), que son conjuntos de redes bajo una misma administración. Se usa entre organizaciones, no dentro de una casa.

> **El problema: los protocolos NO se hablan entre sí.** Una ruta aprendida por OSPF no aparece en la tabla de EIGRP automáticamente. Son idiomas distintos: cada uno tiene sus propias métricas, sus propios timers y sus propias reglas. Que un router corra dos protocolos no conecta las redes: solo significa que habla dos idiomas pero no TRADUCE entre ellos.

**Analogía madre:** pensá en contratar a dos traductores para un evento internacional. OSPF traduce del alemán; EIGRP del francés. Si no hay nadie parado entre los dos que pase las frases de uno al otro, los invitados alemanes no entienden nada de los franceses. Ese traductor es la **redistribución**.

### 1.1. Un router con dos protocolos no alcanza

Este es el malentendido número uno. Alguien ve que el router tiene configurado OSPF y también EIGRP y concluye: "listo, ya está conectado". No.

Un router puede correr varios procesos a la vez. Cada proceso mantiene su propia base de datos de rutas, como si fueran dos cuadernos separados. El router, al final, escribe en la **tabla de enrutamiento** una sola ruta por prefijo (la mejor, según la AD). Pero que las dos rutas estén en el mismo equipo no hace que un protocolo le cuente nada al otro: OSPF sigue sin saber qué redes conoce EIGRP, y EIGRP sigue sin saber qué redes conoce OSPF. Cada cuaderno ignora al otro.

Para que se enteren hay que hacer dos cosas:

1. **Inyectar** las rutas de un protocolo dentro del otro. Eso es redistribuir.
2. **Decidir qué se inyecta y con qué número entra**, porque el protocolo que recibe no puede calcular una métrica de algo que no descubrió él. De eso se trata el resto del manual.

### 1.2. Por qué la métrica no sirve como puente

Imaginá que OSPF dice "esta red está a costo 50" y EIGRP dice "esta red está a métrica 768000". Si los dos números conviven en la misma tabla, ¿cuál es mejor? La pregunta no tiene respuesta: son unidades distintas, como comparar kilómetros con kilos. Por eso el router primero usa la AD (confía en la fuente) y recién después la métrica (compara dentro de la misma fuente).

Cuando redistribuís, el protocolo receptor no hereda la métrica del protocolo de origen: **le inventa un valor de entrada**. Ese valor se llama métrica semilla, y es el tema del capítulo 3. Si no lo definís bien, la ruta puede entrar con un número absurdo, entrar como inalcanzable o no entrar nunca.

### Resumen

- En la realidad una red mezcla protocolos: compras, fusiones, el ISP con BGP, equipos viejos con RIP.
- OSPF, EIGRP, RIP y BGP miden distinto y no se hablan entre sí.
- Un router con dos procesos tiene dos cuadernos separados: no traduce nada por sí solo.
- La AD compara fuentes y la métrica compara dentro de una fuente; ninguna de las dos sirve para "pasar" una ruta de un protocolo a otro.

---

## 2. Redistribución: qué es y por qué es peligrosa

**Redistribuir** es tomar las rutas aprendidas por un protocolo (o las estáticas, o las conectadas) y **inyectarlas al otro protocolo** como si fueran propias. El router de frontera traduce: "estas rutas que sé por OSPF, ahora las anuncio por EIGRP".

Antes del dibujo, la analogía que ordena todo el capítulo. Pensá en **dos empresas que se fusionan y cada una tiene su directorio interno de empleados**. La empresa A ordena las fichas por apellido; la empresa B las ordena por número de legajo. Para que todos se encuentren, alguien fotocopia las fichas de A y las mete en el directorio de B. Eso es redistribuir. Y ahí aparecen los tres peligros:

- Si las fichas copiadas se vuelven a copiar al directorio de origen, la misma ficha se multiplica y los dos directorios quedan llenos de duplicados que se contradicen. Ese es el **bucle de redistribución**.
- Si una ficha dice "diríjase al piso 3" pero en el edificio de la otra empresa no existe el piso 3, la persona camina hasta un lugar donde nadie la puede atender. Ese es el **agujero negro**.
- Si la ficha se copia solo en un sentido, la persona llega pero no hay manera de avisarle a nadie de vuelta. Eso es la **falta de camino de retorno**.

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

Este dibujo muestra dos dominios: a la izquierda, tres routers que hablan EIGRP; a la derecha, tres routers que hablan OSPF. Los números 90 y 110 que aparecen entre paréntesis son las **distancias administrativas** de cada protocolo (cuánto confía el router en esa fuente), y el dibujo los usa como etiqueta. No los confundas con el **número de proceso**, que es una etiqueta local que se elige al configurar y solo tiene que coincidir entre los routers del mismo dominio. El `AS interno` quiere decir "sistema autónomo propio": la red de una misma organización.

Las dos flechas del medio son la clave: cada dominio tiene un router marcado como **REDISTRIBUTOR**. Es el que está conectado a las dos redes, corre los dos protocolos y hace la traducción. La nota entre paréntesis aclara que, en la vida real, R2 y R4 son el **mismo equipo físico**: un router con una interfaz en el mundo EIGRP y otra en el mundo OSPF. El dibujo lo parte en dos solo para que se vea el puente.

**El riesgo: el bucle de redistribución (feedback loop).**

```text
[1] R2 aprende 10.0.0.0/8 por EIGRP        → lo redistribuye a OSPF
[2] R2 vuelve a aprender 10.0.0.0/8 por OSPF (LEL! yo se la mandé)
[3] R2 la vuelve a redistribuir a EIGRP... → ¡y así hasta el infinito!
```

Leé el bloque paso por paso, porque es el corazón del problema:

1. El router redistribuidor aprende la red `10.0.0.0/8` por EIGRP. Hasta acá, todo normal: es una ruta del lado EIGRP.
2. La redistribuye hacia OSPF. Ahora OSPF la conoce y la anuncia.
3. Pero el mismo router también corre OSPF, así que **vuelve a aprender la misma red por OSPF**. Y no tiene forma de saber que esa información la puso él mismo: para OSPF es una ruta externa legítima, aprendida de un vecino.
4. Si el router vuelve a redistribuir EIGRP hacia OSPF (o si el otro extremo también redistribuye en el sentido contrario), la ruta se reinyecta una y otra vez. La métrica va cambiando en cada vuelta, la ruta aparece y desaparece, y la red entra en **flapping**.

Cada protocolo tiene su protección contra bucles (split horizon, SPF, AS-PATH) **PERO SOLO DENTRO DE SÍ MISMO**. La redistribución cruza las fronteras: EIGRP no sabe que esa ruta vino de OSPF que la recibió de EIGRP. El resultado es la **inestabilidad**: convergencias eternas, flapping, CPU al máximo y una red que "late" sin parar.

Para leer esa frase sin quedar afuera: **split horizon** es la regla de no anunciar una ruta por la misma interfaz por donde se aprendió; **SPF** (*Shortest Path First*) es el cálculo del camino más corto que hace OSPF sobre su mapa; **AS-PATH** es la lista de sistemas autónomos por los que pasó un anuncio de BGP, y sirve para descartar anuncios que ya pasaron por el propio AS. **CPU** es el procesador del router: cuando una ruta no para de cambiar, el equipo pasa el día recalculando.

Definamos los dos términos que aparecen ahí: **flapping** es que una ruta aparezca y desaparezca de forma repetida; **convergencia** es el momento en que todos los routers de la red ya coinciden en cómo llegar a cada destino. Una red que no converge es una red donde cada router cree una cosa distinta, y eso se nota como lentitud, cortes intermitentes y llamadas de usuarios que dicen "a veces anda y a veces no".

> **La regla de oro de la redistribución (memorizala):** NUNCA redistribuyas en ambos sentidos sin filtros. La redistribución bidireccional SIN control es el bug más grave y más común de las redes reales. Todo protocolo redistribuido hacia afuera DEBE estar filtrado para que lo que sale jamás vuelva a entrar por la otra puerta.

### 2.1. El agujero negro: la ruta existe y el paquete se pierde

El segundo peligro es más silencioso que el bucle, y por eso asusta más. Un **agujero negro** (black hole) es una ruta que el router acepta y usa, pero que manda el paquete a un lugar donde nadie lo puede entregar. El router no avisa nada: no hay error, no hay "red inalcanzable". El paquete simplemente desaparece.

Volvé a la analogía del directorio: la ficha está, el empleado camina, pero del otro lado no existe la oficina. En una red eso pasa por tres motivos típicos:

- **Redistribución en un solo sentido.** El paquete llega al destino, pero la respuesta no tiene ruta de vuelta. La conexión se queda "colgada": el pedido salió, la respuesta se descartó en algún router del camino.
- **Resumen demasiado grande.** Alguien redistribuye `10.0.0.0/8` para ahorrar anuncios, pero las subredes reales viven detrás de un router que no las conoce. Todos mandan el tráfico hacia el resumen y ese router lo descarta.
- **Filtro demasiado agresivo.** El filtro corta la ruta buena pero deja viva una más general (por ejemplo, la ruta por defecto). Los paquetes siguen saliendo por ahí y mueren más adelante.

Fijate el patrón: en los tres casos la tabla de rutas se ve "completa" y el `ping` no funciona. Por eso el diagnóstico de este tema no empieza mirando si hay ruta, sino **preguntando si la ruta que hay es la que corresponde y si el otro lado tiene cómo volver**.

### 2.2. La segunda regla: la métrica de destino no es la de origen

La métrica de "destino" le da igual al protocolo de "origen". Por eso existe la **seed metric** (métrica semilla): la métrica con la que el protocolo receptor recibe la ruta redistribuida. Ahí está la confusión número uno del tema, y va en la próxima sección.

Pensalo así: cuando la empresa B copia la ficha de la empresa A, el número de legajo de A no significa nada en B, que usa otro sistema. Alguien tiene que decidir **con qué número entra esa ficha al sistema de B**. Si no lo decide, B la archiva con el número que traía (y queda mal clasificada) o directamente no la archiva.

### Resumen

- Redistribuir es inyectar rutas de un protocolo en otro, como copiar fichas de un directorio a otro.
- Copiar sin control hace que la ruta vuelva y se reinyecte: bucle, flapping y red inestable.
- Copiar mal también crea agujeros negros: la ruta existe, el paquete se descarta en silencio.
- Cada protocolo protege sus propios bucles, pero ninguno protege la frontera entre protocolos.
- Regla de oro: nunca redistribuyas en los dos sentidos sin filtros.

---

## 3. Seed Metric: la confusión número uno

Cuando un protocolo recibe una ruta redistribuida, no tiene forma de calcular su métrica (¡esa ruta no la descubrió él!). Entonces usa un valor por defecto llamado **seed metric**. Y acá está la trampa clásica:

| Protocolo receptor | Seed metric por defecto | Resultado de anunciarla "tal cual" |
|--------------------|------------------------|-----------------------------------|
| **RIP** | infinito (16) | ¡La ruta NO se anuncia (inalcanzable)! |
| **OSPF** | 20 (tipo E2) | Se anuncia con costo 20 fijo (no importa el enlace) |
| **EIGRP** | **¡no tiene!** | Si no definís la métrica, **no se redistribuye nada** (silencioso) |

Esta tabla tiene tres columnas y hay que leerla en orden. La primera dice **quién recibe** la ruta (el protocolo de destino, no el de origen). La segunda dice **con qué número entra si no configurás nada**: es el valor de fábrica. La tercera dice **qué consecuencia tiene dejarlo así**, que es la parte que se sufre en el laboratorio: con RIP la ruta entra muerta, con OSPF entra con un costo inventado y con EIGRP no entra nada.

Ahora el detalle que la tabla no muestra y que conviene separar bien, porque son dos cosas distintas:

- La **seed metric** es el número con el que *esa* ruta entra. Se define en el mismo `redistribute`, con la opción `metric`.
- El **default metric** es el número de respaldo que el proceso usa para *todas* las redistribuciones que no traigan métrica. Se define con el comando `default-metric` dentro del proceso.

Son parientes, no sinónimos. La seed metric manda cuando está escrita en ese `redistribute`; el default metric actúa cuando no lo está. Y en EIGRP, si no existe ninguna de las dos, el resultado es el mismo: no se redistribuye nada.

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

Este bloque tiene tres recetas, una por protocolo receptor. Leelo por partes, porque cada línea es una decisión distinta:

- **`router rip`**: entra al proceso RIP. **`redistribute ospf 1 metric 2`** toma todo lo que el proceso OSPF 1 conoce y lo inyecta en RIP con métrica 2. En RIP la métrica es la cantidad de **saltos** (hops), o sea cuántos routers atraviesa el paquete; 2 significa "está a dos saltos". Cualquier valor de 1 a 15 sirve; 16 es "inalcanzable" y equivale a no anunciarla.
- **`router ospf 1`**: entra al proceso OSPF. Las tres líneas que siguen son alternativas, no se escriben las tres juntas en producción: la primera muestra el `subnets` (sin él, OSPF solo redistribuye redes "classful", es decir /8, /16 o /24 sin subdividir); la segunda define la métrica en 50; la tercera define el **tipo** de ruta externa. `metric-type 1` (E1) hace que el costo final sea la semilla más el costo interno del camino; el tipo 2 (E2), que es el default, deja el costo fijo en la semilla sin importar por dónde pase.
- **`router eigrp 100`**: entra al proceso EIGRP 100. La línea **`redistribute ospf 1 metric 10000 100 255 1 1500`** trae las rutas de OSPF y les asigna los cinco componentes de la métrica EIGRP, en este orden: ancho de banda en kbps (kilobits por segundo; 10000 = 10 Mbps), retardo en decenas de microsegundos (100 = 1 ms), confiabilidad sobre 255 (255 = enlace confiable), carga sobre 255 (1 = enlace descargado) y MTU (1500 bytes, el tamaño máximo de paquete).

Los cinco números del final no son decorativos: EIGRP los exige todos. Si escribís `redistribute ospf 1` a secas dentro de EIGRP, el router acepta el comando y **no redistribuye nada**, sin mensaje de error. Ese silencio es la razón por la que este error encabeza la tabla del capítulo 9.

Cuando el problema es que hay muchas fuentes y todas merecen el mismo número, existe el respaldo:

```text
router eigrp 100
 default-metric 10000 100 255 1 1500   ! la misma métrica para todo redistribute sin métrica
```

Este bloque muestra `default-metric` dentro del proceso EIGRP. Los cinco números son los mismos que antes, en el mismo orden (ancho de banda, retardo, confiabilidad, carga, MTU). La diferencia es el alcance: no se aplica a una fuente en particular, sino a **cualquier** `redistribute` de ese proceso que no traiga su propia métrica. Sirve cuando todas las fuentes valen lo mismo; es peligroso cuando no, porque esconde la decisión: dos rutas de origen muy distinto entran con el mismo número y después nadie sabe por qué la red prefiere una.

> **HACELO VOS (la regla mental):** cuando redistribuís, preguntate SOLO UNA cosa: **"¿con qué métrica va a entrar al protocolo receptor?"**. Si no la definiste, OSPF le pone 20, RIP le pone 16 (¡muerta!) y EIGRP no redistribuye NADA. La seed metric es EL primer lugar donde mirar cuando "no aparece la ruta".

### Resumen

- La seed metric es el número con el que el protocolo receptor acepta una ruta que no descubrió él.
- RIP entra con 16 por defecto, que es inalcanzable: la anuncia muerta.
- OSPF entra con 20 fijo (tipo E2) y no mira el enlace.
- EIGRP no tiene valor por defecto: sin métrica completa no redistribuye, y no avisa.
- `default-metric` es el respaldo del proceso; la seed metric del `redistribute` manda cuando está.

---

## 4. Configuración: el comando redistribute

### 4.1. Afuera de qué podés redistribuir

Dentro de cualquier protocolo (en modo configuración del proceso), el comando es:

```text
redistribute {ospf | eigrp | rip | static | connected | bgp} [opciones]
```

Este bloque es la **forma general** del comando, no un comando para copiar tal cual. Se lee así: la palabra `redistribute`, después una llave con las fuentes posibles separadas por barras (elegís una), y al final `[opciones]`, que es todo lo que puede ir después: `metric`, `metric-type`, `subnets`, `route-map`. Los corchetes indican "opcional"; la llave indica "una de estas".

| Fuente | Qué trae | Ejemplo |
|--------|----------|---------|
| **static** | Tus rutas estáticas (vistas en [enrutamiento IP](./34-enrutamiento-ip-rutas-estaticas.md)) | `redistribute static` |
| **connected** | Las subredes conectadas directo al router | `redistribute connected` |
| **ospf 1** | El proceso OSPF que corre en este router | `redistribute ospf 1 subnets` |
| **eigrp 100** | El proceso EIGRP | `redistribute eigrp 100` |
| **rip** | El proceso RIP | `redistribute rip` |
| **bgp 65001** | El proceso BGP (cuidado: ¡arrastra todo el AS!) | `redistribute bgp 65001` |

Esta tabla responde a la pregunta "¿qué puedo meter?". La primera columna es la **fuente** que se escribe después de `redistribute`; la segunda, **qué rutas trae** esa fuente; la tercera, un **ejemplo** concreto. Los dos primeros casos no son protocolos: `static` son las rutas que escribiste a mano y `connected` son las redes de las interfaces del propio router. Los otros cuatro son procesos que corren en el equipo, y por eso llevan número o nombre de proceso.

Dos advertencias sobre las filas de abajo:

- **`redistribute bgp 65001`** no trae "las rutas de BGP" en abstracto: trae **toda la tabla BGP** que ese proceso tenga, que en un borde de Internet puede ser cientos de miles de prefijos. Por eso el comentario del original dice "arrastra todo el AS": el riesgo es meter Internet entero dentro de tu OSPF o tu EIGRP.
- **`connected`** suele ser la fuente más subestimada: si el router tiene una interfaz con una red que el otro protocolo no conoce, sin `connected` esa red no se anuncia. Es la causa típica de "el ping llega hasta el router y no pasa".

### 4.2. Los parámetros que siempre tenés que mirar

```text
redistribute ospf 1 subnets            ← OSPF: sin 'subnets' solo redistribuye classful.
                                          (Clásico: "redistribuí y solo aparecen las /8 o /16")
redistribute ospf 1 metric 30          ← la seed metric con que entra
redistribute ospf 1 metric-type 1      ← OSPF: E1 suma el costo de tráfico; E2 (default) no
redistribute eigrp 100 metric 10000 100 255 1 1500  ← EIGRP: ¡obligatoria y completa!
redistribute static route-map FILTRO   ← ¡Y la pieza que falta: el filtro! (sección 5)
```

Este bloque es una lista de control, no una configuración: cada línea es un parámetro que conviene revisar antes de dar por terminada una redistribución. Vamos de arriba hacia abajo:

- **`subnets`**: es exclusivo de OSPF y habilita redistribuir prefijos que no son classful. Sin `subnets`, OSPF solo acepta redes /8, /16 o /24 "puras". Si tus redes son `10.1.0.0/24`, `10.1.1.0/24` y `10.1.2.0/24`, sin `subnets` vas a ver aparecer solo algunas (o ninguna), y el síntoma es exactamente el que dice el comentario: "redistribuí y faltan redes".
- **`metric 30`**: define la seed metric, o sea con qué costo entra la ruta. Si no la ponés, OSPF usa 20. El número no tiene que ver con el ancho de banda real del enlace: es una decisión administrativa.
- **`metric-type 1`**: cambia el tipo de ruta externa. E1 significa que el costo total es la semilla más el costo interno del camino (se suman); E2, el default, deja el costo clavado en la semilla para siempre. La diferencia se ve cuando hay dos caminos internos de distinta longitud hacia el mismo destino.
- **`metric 10000 100 255 1 1500`**: la métrica completa de EIGRP, los cinco componentes en orden. Sin esto, EIGRP no redistribuye.
- **`route-map FILTRO`**: la parte que decide *qué* se redistribuye y *con qué atributos*. Es el tema del capítulo 5; por ahora alcanza con saber que sin esto se redistribuye todo lo que la fuente tenga.

> **El reflejo profesional que tenés que entrenar:** SIEMPRE que veas un `redistribute` sin `route-map` al lado, tu sexto sentido tiene que encenderse. Redistribuir sin filtrar es abrir la canilla de toda tu tabla al otro protocolo. A veces es lo que querés... y a veces es el feedback loop del que hablamos (sección 2).

### 4.3. La palabra "classful" y por qué te va a morder

Classful quiere decir "con clases": el diseño viejo de Internet, donde cada dirección pertenecía a una clase y la máscara estaba implícita (clase A = /8, clase B = /16, clase C = /24). Hoy las redes se subdividen con **VLSM**, *Variable Length Subnet Mask* (máscaras de distinta longitud), y por eso una red puede ser `/26`, `/27` o `/30`.

OSPF, por herencia de ese diseño viejo, cuando redistribuye sin `subnets` toma solo los prefijos que coinciden con su clase. Con `subnets`, acepta cualquier máscara. En EIGRP y en RIP el problema no aparece igual, pero RIP tiene su propio límite: mide en saltos y todo lo que pase de 15 es inalcanzable, así que una ruta redistribuida con métrica alta puede entrar "muerta".

### Resumen

- `redistribute` acepta protocolos, rutas estáticas y redes conectadas; cada fuente tiene su riesgo.
- `subnets` es obligatorio en OSPF si tus redes no son /8, /16 o /24 puras.
- La seed metric (`metric`) decide con qué número entra la ruta; el `metric-type` decide si el costo se suma al camino (E1) o queda fijo (E2).
- Un `redistribute` sin `route-map` mete todo; el filtro es la pieza que falta en la mitad de las configuraciones reales.

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

Este bloque describe la estructura de un route-map y el orden en que se evalúa. La primera línea tiene tres partes: el **nombre** (una etiqueta que elegís vos), la **acción** (`permit` deja pasar, `deny` rechaza) y la **secuencia** (un número que fija el orden, tipo 10, 20, 30).

La segunda y la tercera línea son las dos herramientas internas: `match` elige qué rutas entran en la regla (por red de destino, por next-hop, por tag, etc.) y `set` cambia atributos (métrica, tipo de métrica, tag, next-hop). Una secuencia puede tener solo `match`, solo `set`, o los dos.

Después vienen las tres reglas de evaluación, que hay que leer como el recorrido de una lista:

- Se evalúa **de arriba hacia abajo**, por número de secuencia.
- Si la ruta matchea una secuencia `permit`, **pasa** y se le aplican los `set` de esa secuencia. No se sigue mirando el resto.
- Si matchea una `deny`, **queda afuera** y tampoco se sigue evaluando.
- Si no matchea ninguna secuencia, cae en el **deny implícito** del final: no pasa.

**Analogía:** el route-map es el boliche: el de la puerta (match) chequea la lista (IPs, next-hop, AS-PATH...). Si matchea, entra (permit) y le ponen un sello (set). Si matchea un deny, no entra. Y si la lista no lo menciona... tampoco entra: **deny implícito**. La trampa clásica: armar un route-map permit y olvidar que las rutas no listadas se caen.

Un detalle que ayuda a no confundirse: el route-map **no es un filtro de paquetes**. Acá las "fichas" que pasan son rutas, no tráfico. El mismo comando, aplicado en otro lugar, filtra tráfico (eso es PBR, capítulo 7). Dos usos, dos mundos.

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

Este bloque es el patrón completo de una redistribución controlada. Vamos línea por línea:

- **`access-list 1 permit 10.0.0.0 0.255.255.255`**: una **ACL** (*Access Control List*, lista de control de acceso) que permite las redes que empiezan con 10. El segundo número es la **wildcard**: es una máscara invertida que dice qué bits se ignoran al comparar. `0.255.255.255` significa "el primer byte tiene que ser 10 y el resto no importa", o sea todo el bloque `10.0.0.0/8`. El comentario del original dice "ACL de ORIGENES"; en un route-map de redistribución la ACL compara la **red de destino de la ruta**, no el router que la originó.
- **`route-map ENTRADA-OSPF permit 10`**: abre una secuencia permit número 10 llamada `ENTRADA-OSPF`. El nombre es tuyo; la secuencia marca que esta regla se evalúa primero.
- **`match ip address 1`**: condición. La ruta solo entra en esta regla si su red de destino matchea la ACL 1.
- **`set metric-type type-1`**: modificación. Si la ruta pasó, entra a OSPF como externa tipo 1, o sea con el costo sumado al camino interno.
- **`route-map ENTRADA-OSPF deny 20`**: una secuencia deny explícita, que rechaza todo lo que llegue hasta acá. Es opcional, porque el deny implícito del final hace lo mismo; se escribe para que el que lea la configuración entienda la intención sin tener que recordar la regla.
- **`redistribute eigrp 100 subnets route-map ENTRADA-OSPF`**: la unión de todo. Toma las rutas de EIGRP 100, las pasa por el route-map y las inyecta en OSPF. Solo sobreviven las que matchean la secuencia permit 10.

El orden importa y es la parte que más se equivoca: primero se define el filtro (ACL), después la política (route-map), y recién al final se aplica en el `redistribute`. Si te falta la ACL, el `match` no matchea nada y no pasa ninguna ruta. Si te falta el `route-map` en el `redistribute`, la política existe pero nadie la usa y pasa todo. Las tres piezas van juntas.

> **HACELO VOS:** la ruta de pensamiento correcta: (1) ACL que define "cuáles me interesan", (2) route-map que las deja pasar y/o les cambia atributos, (3) el `redistribute ... route-map`. El route-map SIN el ACL no matchea nada (vacío) y el ACL sin route-map no se aplica. Los dos van siempre juntos hacia el redistribute.

> **Aviso de corrección (una línea):** donde el original llama a la ACL "de ORIGENES", la versión precisa es que la ACL de un `match ip address` en redistribución compara la **red de destino de la ruta** (el prefijo que se anuncia), no el router que la originó; para marcar el origen se usa un **tag**.

### 5.3. Los tags: marcar la ficha para que no vuelva

La forma más limpia de cortar el bucle de la sección 2 es ponerle una marca a lo que redistribuís y rechazar esa marca cuando vuelve. Se llama **tag** (etiqueta) y es un número que viaja con la ruta dentro del protocolo:

```text
! Al sacar rutas de EIGRP hacia OSPF, las marco con 100
route-map EIGRP-A-OSPF permit 10
 set tag 100

! Cuando vuelven por el otro lado, las rechazo por la marca
route-map OSPF-A-EIGRP deny 10
 match tag 100
route-map OSPF-A-EIGRP permit 20      ! el resto sí entra (si no, el deny implícito corta todo)

router ospf 1
 redistribute eigrp 100 subnets route-map EIGRP-A-OSPF
```

Este bloque tiene dos route-maps que trabajan en equipo. El primero, `EIGRP-A-OSPF`, no filtra nada: deja pasar todas las rutas de EIGRP hacia OSPF, pero a cada una le pega la etiqueta 100 con `set tag 100`. El segundo, `OSPF-A-EIGRP`, hace lo contrario: `match tag 100` atrapa las rutas que llevan esa marca y la secuencia `deny 10` las rechaza, así que no vuelven a entrar al dominio EIGRP. La secuencia `permit 20`, sin `match`, deja pasar todo lo demás: es la que evita que el deny implícito se lleve puesto el resto de las rutas legítimas.

El resto del bloque es la aplicación: `redistribute eigrp 100 subnets route-map EIGRP-A-OSPF` dentro de OSPF es la pata de ida. La pata de vuelta iría en EIGRP con `redistribute ospf 1 ... route-map OSPF-A-EIGRP`, que no está en el bloque y es la que completa el círculo.

Lo importante: la marca resuelve el problema que la dirección no puede resolver. Una ruta que vuelve se ve igual que una ruta nueva; una ruta con tag 100 se reconoce como "esto ya pasó por acá". Es la misma idea que escribir el nombre de tu empresa en el reverso de las fotocopias antes de mandarlas al directorio compartido.

### Resumen

- Un route-map es una lista ordenada de secuencias con `match` y `set`, evaluadas de arriba hacia abajo.
- `permit` deja pasar y aplica los `set`; `deny` rechaza; lo que no matchea ninguna secuencia se rechaza por el deny implícito.
- ACL más route-map más `redistribute ... route-map` es el patrón completo del control.
- El tag marca las rutas redistribuidas para poder rechazarlas si vuelven, y así cortar el bucle.
- En redistribución el route-map filtra rutas, no paquetes.

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

Este bloque hace un recorte puntual dentro de un solo protocolo. Las dos primeras líneas arman la ACL: la primera **niega** la red `172.16.0.0/16` (la wildcard `0.0.255.255` dice "los dos primeros bytes son 172.16 y el resto no importa"), y la segunda **permite todo lo demás** con `permit any`. Ese `permit any` del final es imprescindible: la ACL termina con un deny implícito, así que sin él se caería todo.

Las dos líneas de abajo aplican la ACL dentro del proceso EIGRP, y la palabra `in` u `out` decide el sentido:

- **`distribute-list 5 out`**: filtra lo que el router **anuncia** a sus vecinos. En una redistribución, esto filtra lo redistribuido: la ruta existe en la tabla y no se manda.
- **`distribute-list 5 in`**: filtra lo que el router **recibe** de sus vecinos. La ruta no entra a la tabla, aunque el vecino la esté anunciando.

| Dirección | Qué filtra |
|-----------|-----------|
| `distribute-list X in` | Las rutas que RECIBE el router por ese protocolo |
| `distribute-list X out` | Las rutas que ANUNCIA (out en redistribución = filtra lo redistribuido) |

Esta tabla tiene dos columnas: la **dirección** del comando y **qué filtra** en la práctica. Leela desde el punto de vista del router que la configura: `in` es lo que le llega, `out` es lo que manda. La aclaración entre paréntesis de la segunda fila es la que más se usa: cuando el problema es "se está redistribuyendo algo que no quiero", se corta con `out`.

> **No confundas:** distribute-list filtra rutas (anuncios); route-map filtra Y modifica (set). Si solo querés cortar, ACL + distribute-list. Si querés controlar una redistribución o cambiar atributos, route-map. El 90% de las veces que redistribuís, el route-map es la herramienta — el distribute-list queda para recortes puntuales dentro de un solo protocolo.

Una advertencia de alcance: la distribute-list no cambia la métrica ni el tipo de ruta, solo deja pasar o no. Si necesitás que la ruta entre con otro número, no es la herramienta. Y si aplicás una distribute-list `out` en un protocolo que además redistribuye, estás filtrando dos veces: primero lo que entra a la tabla y después lo que sale. Cuando algo "no aparece", revisá las dos.

### Resumen

- La distribute-list es una ACL aplicada dentro de un proceso, para dejar pasar o cortar anuncios.
- `in` filtra lo que el router recibe; `out` filtra lo que anuncia.
- La ACL necesita un `permit any` final, porque termina en deny implícito.
- No modifica atributos: para eso va route-map.
- Es para recortes puntuales, no para diseñar una redistribución.

---

## 7. PBR: ingeniería de tráfico de verdad

Hasta acá todo fue hacer que dos protocolos se entiendan. Este capítulo es el otro tema del título: **ingeniería de tráfico**, es decir, cambiar a propósito lo que la red prefiere. Hay dos maneras de hacerlo, y la primera es PBR; la segunda, más silenciosa, son las métricas y atributos que vimos en los capítulos anteriores.

### 7.1. El problema que PBR resuelve

TODO lo que viste hasta acá decide la ruta mirando el **destino**. El router dice: "para llegar a X, salgo por Y". Pero la vida real pregunta cosas que el destino no responde:

- "El tráfico de la VPN de contabilidad va por la línea MPLS; el resto por Internet."
- "El tráfico de voz viaja por el enlace dedicado, sin importar el destino."
- "Desde la sucursal de Buenos Aires, todo sale por el enlace de 10 Gbps; desde Córdoba, por el otro."

Definamos las siglas de esos ejemplos: **VPN** es *Virtual Private Network*, una red privada que viaja cifrada sobre una red pública; **MPLS** es *Multiprotocol Label Switching*, la tecnología con la que un proveedor transporta tráfico por etiquetas dentro de su red. En los tres casos el destino no alcanza para decidir: hay que mirar **quién** manda el tráfico, **desde dónde** o **por qué puerto**.

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

Este bloque tiene tres partes que funcionan como una sola máquina:

- **`access-list 101 permit tcp any any eq 8080`**: una **ACL extendida**. A diferencia de la estándar (que solo mira la dirección de origen), la extendida mira origen, destino, protocolo y puerto. Acá: permitir **TCP** (*Transmission Control Protocol*, el protocolo de transporte que usan las páginas web y muchas otras aplicaciones) desde cualquier origen hacia cualquier destino en el puerto 8080. `any any` significa "cualquier origen, cualquier destino"; `eq 8080` significa "puerto igual a 8080".
- **`route-map RUTEO-VOZ permit 10`** con **`match ip address 101`**: el route-map matchea **tráfico** (los paquetes que cumplen la ACL 101), no rutas. Es la diferencia clave con el capítulo 5.
- **`set ip next-hop 10.0.0.1`**: la acción. Si el paquete matchea, se lo manda a ese next-hop aunque la tabla de rutas diga otra cosa. "Next-hop" es el próximo salto: la dirección del router vecino que debe recibir el paquete.
- **`interface GigabitEthernet0/0`** y **`ip policy route-map RUTEO-VOZ`**: la aplicación. Se aplica en la **interfaz**, no en un proceso de enrutamiento. Y actúa sobre el tráfico que **entra** por esa interfaz.

Fijate en el detalle del comentario del original: dice "se mandaa" (con dos aes). Es un error de tipeo del texto original; el comando correcto es `set ip next-hop`.

| Parte | Dónde | Qué hace |
|-------|-------|----------|
| ACL extendida | global | Define QUÉ tráfico (origen, destino, puerto) |
| route-map con `set ip next-hop` | global | Define A DÓNDE mandarlo además de políticamente |
| `ip policy route-map` | **interfaz** | Activa PBR en esa entrada: ¡el tráfico que ENTRA por ahí se evalúa contra la política! |

Esta tabla ordena las tres piezas por **dónde** vive cada una y **qué** aporta. La primera columna es la pieza, la segunda el lugar donde se configura (global quiere decir "en el router, no en una interfaz") y la tercera la función. Leela como una receta: sin la ACL no hay definición de tráfico; sin el `set` no hay decisión de salida; sin el `ip policy route-map` en la interfaz no hay aplicación, y todo lo anterior queda escrito pero inerte.

> **HACELO VOS (la diferencia que todos confunden):** **redistribución = qué RUTAS entro a otro protocolo**; **PBR = qué TRÁFICO mando por otro camino**. El route-map de redistribución matchea RUTAS (con `match ip address` sobre ACL estándar de distribución). El route-map de PBR matchea TRÁFICO (con ACL extendida, puertos incluidos) y se aplica EN LA INTERFAZ, no en un proceso. Dos usos del mismo comando, dos mundos distintos.

> **Aviso de corrección (una línea):** el original comenta "tráfico HTTP(s)" sobre el puerto 8080; el puerto estándar de **HTTP** (el protocolo de las páginas web) es 80 y el de **HTTPS** (su versión cifrada) es 443, mientras que 8080 es un puerto alternativo de HTTP, así que conviene leerlo como "un servicio web en 8080".

### 7.3. Ingeniería de tráfico sin PBR: cambiar lo que la red prefiere

PBR decide por **tráfico**. La otra mitad de la ingeniería de tráfico decide por **ruta**: se cambian las métricas y los atributos para que el protocolo prefiera un camino sobre otro. No hace falta una política por paquete: alcanza con que la ruta buena gane la comparación.

Tres palancas concretas, una por protocolo:

- **OSPF**: el costo de una interfaz se cambia con `ip ospf cost N` (dentro de la interfaz), o se recalibra todo con `auto-cost reference-bandwidth`. Subir el costo de un enlace lo vuelve menos atractivo; bajarlo, más atractivo.
- **EIGRP**: el retardo de la interfaz se cambia con `delay N`, donde N se mide en decenas de microsegundos. Como el retardo se suma en todo el camino, un enlace con más delay empuja el tráfico hacia el otro.
- **BGP**: se usan atributos. `local-preference` alto gana dentro del propio AS; `as-path prepend` alarga artificialmente el camino para que los vecinos lo prefieran menos; `metric` (el **MED**, *Multi-Exit Discriminator*) es una sugerencia al AS vecino sobre qué entrada usar. **AS-PATH** es la lista de sistemas autónomos por los que pasó un anuncio, y cuanto más larga, menos atractiva es la ruta.

Y hay una cuarta palanca que ya conocés y es la más directa en este tema: el `set metric` o `set metric-type` dentro del route-map de redistribución. Ahí la ruta entra con el número que vos querés y todo el protocolo la compara con ese número.

La advertencia es siempre la misma: **cambiar la preferencia es fácil, entender el efecto es difícil**. Una métrica tocada a mano puede resolver un enlace saturado o puede crear un camino asimétrico que rompe aplicaciones. Documentá cada cambio con el motivo y la fecha; si no, en seis meses nadie sabe por qué ese `delay` vale 500.

### Resumen

- La tabla de rutas decide por destino; PBR decide por tráfico (origen, puerto, protocolo) y se aplica en la interfaz de entrada.
- PBR usa una ACL extendida, un route-map con `set ip next-hop` y `ip policy route-map` en la interfaz.
- Redistribución mueve rutas entre protocolos; PBR desvía tráfico por una política.
- La otra ingeniería de tráfico es por ruta: costos OSPF, delay EIGRP, atributos BGP o `set metric` al redistribuir.
- Todo cambio de preferencia se documenta, porque el efecto se olvida y la causa queda escondida.

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

Este dibujo es la topología del caso: una empresa (AS 65001) con dos dominios OSPF a los costados y un núcleo EIGRP en el medio. Leelo de izquierda a derecha: R1 y R2 están en un área OSPF; R3 es el **redistribuidor** que traduce entre OSPF y EIGRP; R4 y R5 están en el otro dominio OSPF; R6 es el router de borde que habla **eBGP** (BGP externo, entre sistemas autónomos distintos) con R7, que es el ISP.

Dos aclaraciones que el dibujo da por sabidas: **área 0** es el área central de OSPF, el lugar por donde se conecta todo; y el `AS 65001` es el número de sistema autónomo de la empresa, un identificador que se usa en BGP.

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

Este bloque es toda la configuración del router redistribuidor, dividida en tres decisiones numeradas. Vamos una por una:

- **Decisión 1, OSPF hacia EIGRP.** `router eigrp 100` entra al proceso EIGRP. `redistribute ospf 1 metric 10000 100 255 1 1500` inyecta las rutas de OSPF con la métrica completa: 10000 kbps de ancho de banda, 100 de retardo, 255 de confiabilidad, 1 de carga y 1500 de MTU. Es el sentido "completo": todo lo que OSPF sabe entra a EIGRP, porque el núcleo necesita conocer las áreas OSPF.
- **Decisión 2, EIGRP hacia OSPF, pero filtrado.** `access-list 10 permit 10.0.0.0 0.255.255.255` permite solo las redes propias; `access-list 10 deny any` niega explícitamente el resto (es opcional, porque la ACL ya termina en deny implícito, pero deja la intención escrita). `route-map SOLO-NUCLEO permit 10` con `match ip address 10` aplica esa ACL. Y `redistribute eigrp 100 subnets route-map SOLO-NUCLEO metric 30 metric-type 1` mete en OSPF solo esas redes, con costo 30 y como externas tipo 1. La asimetría es deliberada: un sentido completo, el otro filtrado.
- **Decisión 3, BGP solo en el borde.** `router bgp 65001` abre el proceso con el número de AS de la empresa. `network 10.0.0.0 mask 255.0.0.0` anuncia el bloque propio, pero con una condición importante: BGP solo anuncia un prefijo si ese prefijo ya está en la tabla de rutas. No es una redistribución: es una autorización. `neighbor 198.51.100.2 remote-as 65002` define al vecino BGP y su AS. La idea es que BGP no se use como transporte interno: se anuncia lo justo y se acabó.

Fijate que el comentario de la decisión 1 dice "OSPF → EIGRP: todas" y el de la 2 dice "SOLO el núcleo". Esa es la regla de oro del capítulo 2 aplicada en la práctica: **un sentido completo y el otro filtrado**, nunca los dos completos.

### 8.3. La verificación del caso

```text
R3# show ip route | include ^D|^O|^B
D     10.1.0.0/16 [90/768000] via 10.0.0.4        ← EIGRP (90) core
O E1  10.2.0.0/16 [110/50] via 10.0.0.1           ← OSPF externa, E1 (costo suma)
B     203.0.113.0/24 [20/0] via 198.51.100.2      ← eBGP del ISP
```

Este bloque es la salida del router después de aplicar la configuración. La primera línea es el comando: `show ip route` muestra la tabla de rutas, y el `| include` filtra solo las líneas que empiezan con `D`, `O` o `B` (el acento circunflejo significa "al principio de la línea" y la barra vertical significa "o"). Cada letra es el código de origen de la ruta: `D` es EIGRP, `O` es OSPF y `B` es BGP.

Las tres líneas de abajo se leen igual, y cada parte tiene significado:

- **`D 10.1.0.0/16 [90/768000] via 10.0.0.4`**: una ruta EIGRP hacia la red `10.1.0.0/16`. Entre corchetes, el primer número es la **AD** (90, la de EIGRP) y el segundo es la **métrica** (768000). `via 10.0.0.4` es el next-hop: el vecino que entrega esos paquetes.
- **`O E1 10.2.0.0/16 [110/50] via 10.0.0.1`**: una ruta OSPF externa tipo 1. La `O` es OSPF, `E1` dice que es externa y que el costo se suma al camino interno. La AD es 110 y la métrica 50 (la semilla de 30 más 20 de costo interno, por ejemplo).
- **`B 203.0.113.0/24 [20/0] via 198.51.100.2`**: una ruta BGP. `B` es BGP, la AD 20 corresponde a **eBGP** (BGP externo, entre AS distintos) y el 0 es el campo de métrica, que en BGP no funciona como un costo de camino. El BGP interno, el que corre entre routers del mismo AS, se llama **iBGP** y tiene AD 200.

Lo que un principiante tiene que mirar acá: que aparezcan las tres letras. Si falta la `D`, el problema está del lado EIGRP (métrica, filtro o vecindad). Si falta la `O E1`, el problema está del lado OSPF (falta `subnets`, el route-map rechazó todo, o el tipo de métrica no es el esperado). Si falta la `B`, el problema es del borde: el prefijo no está en la tabla o el vecino no está establecido.

> **Los tres principios del caso (los vas a ver en TODO diseño sano):** (1) seed metric definida en cada salto ["cómo entra"], (2) route-map en cada redistribución ["qué entra"], (3) una sola dirección de flujo por par ["por qué no entra de vuelta"]. Si respetás esos tres, la redistribución no te muerde.

### Resumen

- El caso tiene dos dominios OSPF y un núcleo EIGRP, con un router redistribuidor en el medio y BGP solo en el borde.
- OSPF hacia EIGRP va completo y con métrica EIGRP completa; EIGRP hacia OSPF va filtrado y con `subnets`.
- BGP no se redistribuye: se anuncia con `network` solo lo que ya está en la tabla.
- En `show ip route`, la letra dice el protocolo y los corchetes dicen AD y métrica.
- Los tres principios: métrica definida, filtro aplicado y un solo sentido por par.

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

Esta tabla es la lista de sospechosos. Las columnas son: el **número** (para nombrarlos en una reunión), el **error** (qué se hizo mal), el **síntoma** (qué se ve en la red o en el router) y el **fix** (el comando o la decisión que lo arregla). No hace falta memorizarla: hace falta reconocer el síntoma, porque el síntoma es lo único que te da la red cuando algo falla.

Los dos primeros son primos hermanos y son los más frecuentes en un laboratorio:

- El **error 1** no da ningún mensaje. Configurás `redistribute ospf 1` dentro de EIGRP, el comando se acepta, y la ruta simplemente no está. Si no sabés que EIGRP exige los cinco números, podés perder una tarde buscando un problema de vecindad que no existe.
- El **error 2** es peor porque la ruta **sí** aparece: la ves en la tabla de RIP con métrica 16, que es "inalcanzable". Parece que funcionó, pero nadie la usa. El `metric 2` de la columna del fix es la corrección.

El **error 3** es el rey de los "faltan redes": redistribuiste y solo aparecen las /8, /16 o /24 puras. Se arregla agregando `subnets` al `redistribute` de OSPF.

> **El error #4 es el que muerde de verdad:** una red "inestable" que nadie entiende por qué late. Mirá los dos sentidos de redistribución: si A→B y B→A están activos sin filtro, tenés el loop. El fix clásico: **redistribuir A→B completo y B→A filtrado** (solo rutas propias de B), nunca los dos completos.

Los errores 5 y 6 son de aplicación, no de concepto. En el 5, el route-map está escrito pero no matchea nada (ACL que no coincide) o matchea todo (falta el `deny`); en el 6, la política de PBR está perfecta pero aplicada en la interfaz de salida cuando PBR mira la de entrada. En los dos casos el router hace exactamente lo que le pediste, y vos esperabas otra cosa.

### 9.1. Cómo diagnosticar, en orden

Cuando "no aparece la ruta" o "la red anda raro", no empieces tocando configuración. Preguntale al router, en este orden:

```text
show ip route 10.2.0.0            ! ¿existe la ruta? ¿con qué código, AD y métrica?
show ip protocols                 ! ¿qué redistribuye cada proceso y con qué route-map?
show route-map ENTRADA-OSPF        ! ¿cuántas rutas matchearon cada secuencia?
show ip ospf database external     ! ¿qué rutas externas está viendo OSPF?
show ip eigrp topology             ! ¿EIGRP tiene la ruta como interna o como externa?
```

Cada comando responde una pregunta distinta y el orden importa:

- **`show ip route 10.2.0.0`**: la primera pregunta es si la ruta existe. Si está, mirá el código (D, O, B), la AD y la métrica: eso te dice quién la puso y con qué número. Si no está, el problema es de origen o de filtro, no de preferencia.
- **`show ip protocols`**: muestra, por proceso, qué fuentes está redistribuyendo, con qué métrica y con qué route-map. Es la forma más rápida de detectar un `redistribute` que falta o que apunta a la fuente equivocada.
- **`show route-map ENTRADA-OSPF`**: muestra el route-map con sus secuencias y un contador de coincidencias. Si la secuencia permit tiene cero matches, el problema está en el `match` (ACL mal escrita, red mal escrita). Si todo el tráfico cae en la secuencia deny, el filtro está haciendo su trabajo y el error es de diseño.
- **`show ip ospf database external`**: lista las rutas externas tipo 5 que OSPF conoce, o sea las que entraron por redistribución. Si la ruta no está acá, no entró a OSPF. (Las áreas **NSSA**, *Not-So-Stubby Area*, usan otro tipo de anuncio, el tipo 7, que se mira con `show ip ospf database nssa-external`.)
- **`show ip eigrp topology`**: la tabla de topología de EIGRP distingue las rutas internas de las externas (las redistribuidas). Si una ruta redistribuida no figura, el problema está en el `redistribute` o en la métrica.

Después de esos cinco, quedan dos sospechosos que no son de configuración:

- **El camino de vuelta.** Si la ida funciona y la vuelta no, el problema es asimetría: un lado redistribuye y el otro no, o un filtro corta el retorno. Probalo con `traceroute` desde los dos extremos y compará los caminos.
- **El resumen y el filtro.** Si la ruta existe pero el ping no llega, revisá si estás anunciando un resumen más grande que las redes reales (agujero negro) o si un filtro está dejando pasar solo la ruta general.

Una última recomendación: `debug ip routing` muestra los cambios de la tabla en vivo y es excelente en un laboratorio, pero en producción puede saturar el router y la consola. Se usa con las dos manos: se prende, se mira treinta segundos y se apaga.

### Resumen

- Los seis errores clásicos: EIGRP sin métrica, RIP con 16, OSPF sin `subnets`, bucle sin filtro, route-map mal armado y PBR en la interfaz equivocada.
- El síntoma manda: "no aparece" apunta a métrica o filtro; "aparece y no sirve" apunta a métrica inalcanzable o agujero negro.
- El diagnóstico se hace preguntando al router: ruta, procesos, route-map, base de datos y topología.
- Si la ida anda y la vuelta no, pensá en asimetría y en el camino de retorno.
- El bucle se evita con un sentido completo y el otro filtrado, o con tags.

---

## 10. Comprobá lo que aprendiste

Ocho preguntas. Tapá la respuesta, contestá en voz alta y recién después compará.

**1. ¿Qué es la redistribución y por qué es peligrosa?**

**Ver respuesta:** Es tomar rutas aprendidas por un protocolo e inyectarlas a otro (traducción entre idiomas de routing). Es peligrosa porque cada protocolo protege SUS bucles pero no los ajenos: la redistribución bidireccional sin filtros crea el feedback loop (rutas que van y vuelven eternamente, flapping e inestabilidad).

**2. ¿Qué es la seed metric y cuál es el comportamiento por defecto de RIP, OSPF y EIGRP?**

**Ver respuesta:** Es la métrica con la que el protocolo receptor recibe una ruta redistribuida (no la calculó él). RIP: 16 (¡inalcanzable!); OSPF: 20 (E2); EIGRP: no tiene — si no la definís, NO redistribuye (en silencio). El `default-metric` del proceso es el respaldo cuando el `redistribute` no trae métrica.

**3. ¿Qué hace el `subnets` en la redistribución a OSPF?**

**Ver respuesta:** Sin `subnets`, OSPF solo redistribuye rutas classful (las "limpias" /8, /16, /24 por defecto). Con `subnets`, redistribuye cualquier prefijo con máscara (VLSM). Clásico: "redistribuí y solo aparecen algunas redes".

**4. Route-map de redistribución vs route-map de PBR: ¿en qué se diferencian?**

**Ver respuesta:** El de redistribución matchea RUTAS (ACL estándar, redes de destino) y se aplica en `redistribute ... route-map`. El de PBR matchea TRÁFICO (ACL extendida con puertos) y se aplica en la INTERFAZ con `ip policy route-map`. Ambos usan match/set, pero el objeto (rutas vs tráfico) y el lugar de aplicación (proceso vs interfaz) cambian.

**5. ¿Por qué la redistribución bidireccional necesita filtros?**

**Ver respuesta:** Porque la protección de bucle de cada protocolo no cruza fronteras: EIGRP no sabe que la ruta que recibe por OSPF salió de él. Sin filtro, la ruta entra por A, sale por B, vuelve a entrar por A... ciclo infinito (feedback loop). Se corta filtrando el retorno (solo rutas propias del otro lado) o marcando con tag lo que ya se redistribuyó.

**6. ¿Qué matchea un route-map y qué pasa si una ruta no matchea NINGUNA secuencia?**

**Ver respuesta:** Matchea según las `match` de cada secuencia (red de destino de la ACL, next-hop, tag, etc.). Si no matchea ninguna secuencia, cae en el **deny implícito al final**: NO pasa. Es la trampa clásica: armar solo secuencias permit y sorprenderse de que "algo no entra".

**7. ¿Con qué seed metric entra una ruta redistribuida a RIP? ¿Y qué significa eso para tu red?**

**Ver respuesta:** Con 16 = inalcanzable: RIP anuncia la ruta redistribuida como muerta. Hay que definirla con `metric` al redistribuir (`redistribute ospf 1 metric 2`, por ejemplo). Sin eso, la ruta "aparece" pero nadie la usa.

**8. ¿Dónde se aplica `ip policy route-map` y sobre qué tráfico actúa?**

**Ver respuesta:** En una INTERFAZ, y actúa sobre el tráfico que ENTRA por esa interfaz (no sobre el que sale). Se evalúa contra el route-map: si matchea, se fuerza el `set ip next-hop` u otras acciones. Si no matchea, se rutea normalmente.

### Resumen

- Redistribuir traduce rutas entre protocolos; el peligro es el bucle y el agujero negro.
- La seed metric decide cómo entra la ruta y tiene tres comportamientos por defecto distintos.
- El route-map de redistribución matchea rutas; el de PBR matchea tráfico y va en la interfaz.
- El deny implícito y el `permit any` final de las ACL son las dos trampas de configuración.
- PBR actúa sobre el tráfico que entra por la interfaz donde se aplica.

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

Esta tabla es el vocabulario mínimo del manual. La primera columna es el **término** y la segunda **qué es**, en una línea. Los cinco primeros son los que hay que poder explicar sin dudar; los cuatro últimos son los que aparecen cuando abrís la configuración y ves un comando que no reconocés. Si un término no lo podés explicar en una frase, volvé al capítulo donde se usa: cada uno tiene su sección.

### Resumen

- El vocabulario central: redistribución, seed metric, feedback loop, route-map y deny implícito.
- Los cuatro términos de configuración: distribute-list, PBR, `subnets` y E1/E2.
- Cada término se explica en una frase; si no sale, falta repasar el capítulo correspondiente.

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

Leé esta lista como el índice al revés: cada punto condensa un capítulo. Si te llevás uno solo, llevate el 3: la red que se cae sola casi siempre es una redistribución sin filtro.

### Resumen

- Redistribuir es traducir rutas entre protocolos; sin control, la traducción se vuelve un bucle.
- Cada protocolo receptor tiene su propia métrica de entrada y hay que definirla siempre.
- El control se hace con route-map (rutas) y distribute-list (anuncios), no con la intuición.
- PBR es otra cosa: mueve tráfico por política, no rutas entre protocolos.
- Métrica definida, filtro aplicado y un solo sentido por par: las tres reglas del diseño sano.

---

> **Fuente:** Documentación propia basada en CCNA 200-301 Official Cert Guide (W. Odom), Cisco IOS Configuration Guides (redistributing routing protocols, route-maps, PBR), RFC 2453 (RIP-2), RFC 2328 (OSPFv2), RFC 4271 (BGP-4) y material educativo de redes.

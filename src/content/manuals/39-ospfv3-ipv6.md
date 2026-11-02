# 39. OSPFv3: el Estado de Enlace para IPv6

**El mismo protocolo, rediseñado para un mundo de direcciones de 128 bits (y sin los amarres de IPv4)**

---

Este manual junta dos temas que casi todo el mundo mezcla en la misma frase: **la dirección IPv6** (el número que identifica a un equipo) y **OSPFv3** (el protocolo con el que los routers se pasan rutas para esas direcciones). Son dos cosas distintas, y la mitad de las dudas de laboratorio nacen de no separarlas: alguien ve un `fe80::1` en pantalla y no sabe si el problema es de direccionamiento o de protocolo.

Por eso el orden es este: primero entendés **qué cambió en el mundo de las direcciones** (capítulos 1 y 2). Después entendés **qué tuvo que adaptar OSPF para vivir en ese mundo** (capítulos 3, 4 y 5). Recién ahí configurás (capítulo 6) y verificás (capítulo 7). Si empezás por los comandos, vas a copiar líneas sin saber qué estás encendiendo, y cuando algo no levante no vas a tener de dónde agarrarte.

Vocabulario base, definido una vez y para siempre:

- **IP** son las siglas de *Internet Protocol*, el protocolo que le pone dirección a los paquetes para que viajen de una red a otra. **IPv4** es la versión 4, con direcciones de 32 bits del estilo `192.168.1.10`. **IPv6** es la versión 6, con direcciones de 128 bits del estilo `2001:db8::1`. Son dos protocolos que hoy conviven en la misma red.
- Un **router** (en español, encaminador) es un equipo con varias patas, cada una conectada a una red distinta, cuyo trabajo es pasar paquetes de una red a otra. Cada pata es una **interfaz**: el conector por donde entra y sale el cable.
- Un **paquete** es el sobrecito de datos que viaja por la red, con una dirección de origen y una de destino, igual que una carta.
- Una **ruta** es una frase que el router guarda en su memoria: "para llegar a tal red, mandá el paquete por tal interfaz". Al conjunto de rutas se lo llama **tabla de enrutamiento**, y es lo único que el router consulta para decidir por dónde sale cada paquete.
- Un **protocolo de enrutamiento** es el acuerdo con el que los routers se cuentan entre ellos cómo llegar a las redes que no tienen pegadas al cable. **OSPF** son las siglas de *Open Shortest Path First*, "primero el camino más corto, y abierto". Es de la familia de **estado de enlace**: cada router publica sus propios cables y todos arman el mismo mapa.
- **OSPFv2** es la versión de OSPF que transporta direcciones IPv4. **OSPFv3** es la versión que transporta direcciones IPv6. Mismo apellido, misma familia, otra generación.
- Un **LSA** (*Link State Advertisement*, "anuncio de estado de enlace") es el pedacito de mapa que publica un router. La **LSDB** (*Link State Database*, "base de datos de estados de enlace") es la colección de todos esos pedazos: el mapa completo. Y el **SPF** (*Shortest Path First*) es el algoritmo, el de Dijkstra, con el que cada router calcula su mejor camino sobre ese mapa.

Si nunca viste OSPF, este manual se sigue igual: cada pieza se explica cuando aparece, y no hace falta haber configurado nada antes. Si ya venís del manual de OSPF, vas a reconocer casi todo, y eso es justamente la noticia: **OSPFv3 no es un protocolo nuevo, es el mismo protocolo con otra ropa**.

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

Cómo usar este índice: cada título de esta lista es un capítulo y también es la dirección (la URL) con la que se publica la página, así que no cambian nunca. Si tenés poco tiempo, el camino corto es el capítulo 2 (la dirección IPv6 en cinco minutos), el 3 (qué se queda igual y qué cambia entre v2 y v3) y el 6 (la configuración). Con esos tres ya podés armar el laboratorio. El capítulo 7 es el que vas a usar todos los días después: verificar es el 50 % del trabajo real.

Una aclaración de método: acá vas a ver **dos protocolos** conviviendo (v2 y v3) y **dos familias de direcciones** (IPv4 e IPv6). Cuando algo te confunda, preguntate primero en cuál de las cuatro combinaciones estás parado. La mitad de los errores de este tema se explican porque alguien creía estar en una y estaba en otra.

### Resumen

- Este manual separa dos temas que se confunden: la dirección IPv6 y el protocolo OSPFv3.
- Primero se entiende el direccionamiento, después qué adaptó OSPF, y recién al final se configura.
- OSPFv3 no es un protocolo nuevo: es el mismo OSPF de estado de enlace, adaptado a direcciones de 128 bits.
- El camino corto del manual es: capítulo 2 (dirección), capítulo 3 (comparación) y capítulo 6 (configuración).

---

## 1. El futuro que ya llegó: por qué IPv6 no es opcional

### 1.1. El problema que IPv4 nunca resolvió

IPv4 tiene **32 bits** de dirección, y 32 bits dan 2^32 combinaciones: algo más de 4.300 millones de números. En los años ochenta, cuando se diseñó, cuatro mil millones parecían infinitos. Hoy hay más dispositivos conectados que personas en el mundo, y cada casa tiene varios: el teléfono, la notebook, la tele, la consola, la heladera inteligente.

Las direcciones IPv4 se agotaron. No es teoría de manual: los bloques nuevos ya no se asignan hace años, y las redes del mundo conviven con NAT (el porqué ya lo viste en su tema) para estirar la vida de IPv4.

**NAT** son las siglas de *Network Address Translation*, "traducción de direcciones de red". Es el truco con el que tu router de casa le presta una sola dirección pública al mundo y reparte direcciones privadas adentro: el router reescribe la dirección de cada paquete que sale y la vuelve a reescribir cuando entra la respuesta. Funciona, y por eso estamos acá quince años después.

Pero NAT tiene su costo: destruye el modelo "una identidad por equipo", complica la transparencia de las aplicaciones y es un dolor en redes punto a punto (¡y en juegos online!). Si sos un servidor detrás de NAT, nadie de afuera puede iniciar una conversación con vos: primero hay que abrir un agujero a mano en la traducción. Y si sos una aplicación que necesita saber cuál es tu propia dirección para anunciarla (una llamada de voz, un juego en red), NAT te miente.

> **Analogía:** IPv4 con NAT es una oficina donde todos comparten un solo teléfono. Funciona, pero cada llamada tiene que pasar por la recepcionista, que anota quién llamó y a quién le corresponde. Si vos querés llamar a alguien de esa oficina, no podés marcar directo a su escritorio: tenés que llamar a la recepción y pedir por esa persona. Y si dos empleados quieren llamar al mismo tiempo, la recepcionista hace malabares.

> **IPv6 resuelve el problema de raíz:** 340 sextillones de direcciones (3,4 × 10^38), de las cuales la Tierra no va a agotar ni un porcentaje ridículo. Y con eso viene **OSPFv3**: el protocolo de estado de enlace, rediseñado para el mundo de 128 bits.

### 1.2. La promesa de este manual: el 90 % se transfiere

**La promesa de este manual:** si dominás OSPFv2, el 90% del conocimiento se **transfiere tal cual** a OSPFv3: mismas vecindades, mismos estados, mismo DR/BDR, mismas áreas, mismo SPF de Dijkstra. Lo que CAMBIA es la parte "dirección específica" — y ese cambio es la arquitectura (y la elegancia) de OSPFv3.

Antes de seguir, tres siglas de esa frase, porque aparecen todo el tiempo: el **DR** (*Designated Router*, router designado) y el **BDR** (*Backup Designated Router*, designado de respaldo) son los dos routers que se eligen en un segmento compartido para concentrar las conversaciones y no armar un enredo de todos contra todos. Y las **áreas** son divisiones del mapa: grupos de routers que comparten una LSDB propia, con el **área 0** como centro obligatorio.

> **Analogía:** OSPFv2 y OSPFv3 son como el mismo sistema de transporte de una ciudad, con dos tipos de vehículos: v2 reparte con la vieja moto de 2 cilindros que solo conoce calles numeradas hasta 32 bits; v3 es el camión nuevo que navega calles de 128 bits. Mismas reglas de tránsito, mismo mapa (LSDB), mismo GPS (SPF): cambia el vehículo y las calles.

Guarda esa analogía, porque explica el manual entero: no vas a aprender un sistema de tránsito nuevo. Vas a aprender **qué cambia en el vehículo y en las calles**, y por qué esos cambios obligaron a rediseñar dos o tres piezas del motor.

### 1.3. Las dos preguntas que hay que separar

Cuando armes un laboratorio de OSPFv3 y algo no funcione, hacete estas dos preguntas en este orden, nunca mezcladas:

1. **¿La dirección existe y está bien?** Es decir: ¿la interfaz tiene una IPv6, la link-local apareció, el prefijo es coherente con el otro extremo? Esto es direccionamiento, y se verifica con `show ipv6 interface brief`.
2. **¿El protocolo está corriendo y los dos extremos coinciden?** Es decir: ¿OSPFv3 está activado en esa interfaz y en esa área, los timers coinciden, el instance coincide? Esto es protocolo, y se verifica con `show ipv6 ospf neighbor`.

La pregunta 1 siempre va primero. Sin dirección no hay link-local, y sin link-local OSPFv3 no puede ni mandar un saludo. Es el error número 3 del capítulo 9, y es el más común de todos en un laboratorio nuevo.

Un detalle de nomenclatura que vas a ver en la calle: a la convivencia de IPv4 e IPv6 en el mismo equipo se la llama **doble pila** (*dual stack*). El router tiene las dos direcciones en la misma interfaz y atiende a las dos. Ese es el estado normal de las redes de hoy, y el capítulo 8 lo usa a fondo.

### Resumen

- IPv4 tiene 32 bits y se quedó sin direcciones; NAT lo estiró, pero rompe la idea de una identidad por equipo.
- IPv6 tiene 128 bits y resuelve el problema de raíz, sin necesidad de traducción.
- OSPFv3 es el mismo OSPF de estado de enlace adaptado a IPv6: el 90 % de lo que sabés se transfiere.
- Antes de tocar el protocolo, hay que separar dos preguntas: ¿la dirección está bien? y ¿el protocolo está bien?

---

## 2. Los 5 minutos de IPv6 que necesitás antes de OSPFv3

### 2.1. La dirección: 128 bits, 8 grupos

Empecemos por lo que ves. Una dirección IPv6 se escribe así:

```text
2001:0db8:85a3:0000:0000:8a2e:0370:7334
└──┬──────────────────────────────────┴───┘
   8 grupos de 4 dígitos hexadecimales (16 bits cada uno)
```

Este bloque tiene tres líneas y cada una cumple una función distinta. La primera es **la dirección**: ocho grupos separados por dos puntos (`:`). La segunda es un corchete decorativo que marca el conjunto: el `┬` señala el comienzo y el `┴` el final; los grupos son los ocho bloques que quedan separados por `:`, no las partes que el dibujo abraza. La tercera línea es la cuenta que hay que saber de memoria: **8 grupos × 16 bits = 128 bits**.

¿Por qué hexadecimal? Porque cada dígito hexadecimal representa exactamente **4 bits** (los valores del 0 al 9 y de la A a la F son dieciséis combinaciones). Con hexadecimal, cuatro dígitos cubren 16 bits y se lee mucho más corto que con binario. Una dirección IPv6 en binario son 128 ceros y unos seguidos: imposible de dictar por teléfono.

Y acá va la diferencia mental más importante con IPv4: en IPv4 la dirección tiene dos partes (red y host), y se separan con la máscara. En IPv6 la dirección también las tiene, pero el corte se escribe **al final, con una barra**: `2001:db8:1::/64`. Eso es un **prefijo**, y lo vemos en 2.3.

### 2.2. Las reglas de abreviación (las que todos necesitan)

Nadie escribe una dirección IPv6 completa a mano salvo que esté dictando por teléfono. Existen dos reglas para acortarla, y una trampa:

```text
1. Podés omitir CEROS LÍDERES en cada grupo:
   2001:0db8:85a3:0000 → 2001:db8:85a3:0
2. UNA sola vez, podés reemplazar un bloque de grupos 0 por "::":
   2001:db8:0:0:0:0:0:1 → 2001:db8::1
3. Ojo: "::" se usa UNA vez (si hay 2 bloques de ceros, el router no sabe cuánto mide cada uno)
```

Este bloque es la lista de las dos reglas y la advertencia que las acompaña. Se lee como un recetario, y cada regla trae su ejemplo con la flecha `→`, que significa "se convierte en".

Línea por línea, porque acá se pierde mucha gente:

- **Regla 1, ceros líderes.** Dentro de cada grupo podés borrar los ceros de la izquierda. `0db8` queda `db8`; `0000` queda `0`; `0370` queda `370`. Ojo con la palabra **líderes**: son los ceros de adelante, no los de atrás. `0370` es `370`, no `37`.
- **Regla 2, el doble dos puntos.** Un bloque de grupos consecutivos que valen cero se puede reemplazar por `::` (dos puntos, no tres). `2001:db8` + cinco grupos en cero + `1` se escribe `2001:db8::1`.
- **Regla 3, la trampa.** `::` se usa **una sola vez** por dirección. Si hay dos bloques de ceros separados, tenés que escribir uno de los dos con un `0` explícito, porque si no el router no sabe cuántos grupos tapó cada `::`. Por ejemplo, `2001:db8:0:0:1:0:0:1` tiene dos bloques de ceros y no se puede comprimir entero: se escribe `2001:db8::1:0:0:1` o `2001:db8:0:0:1::1`, pero nunca con dos `::`.

> **HACELO VOS (el truco de la longitud):** una dirección IPv6 "abreviada" apunta a 128 bits totales: contá 4 dígitos hex por grupo (16 bits), y el `::` "tapona" lo que falta. `2001:db8::1` = 2001:0db8:0000:0000:0000:0000:0000:0001. Aprendé a expandir, no a truncar.

Ese consejo es el que evita el 90 % de los errores de tipeo. Si sabés expandir, podés comparar dos direcciones y descubrir si son la misma escritas distinto. Hay cuatro atajos que vas a ver todo el tiempo:

```text
::1                      → la loopback de IPv6 (equivale a 127.0.0.1 en IPv4)
::                       → la dirección "no especificada" (todavía no tengo dirección)
fe80::1                  → una link-local del router (el capítulo 2.5 la explica)
2001:db8::/32            → el prefijo reservado para ejemplos y documentación
```

Las cuatro líneas son las direcciones comodín del tema. La primera es el `ping ::1`, que prueba la pila IPv6 del propio equipo. La segunda aparece cuando una interfaz todavía no tiene dirección. La tercera va a ser la estrella de OSPFv3. Y la cuarta es el `2001:db8` de todos los ejemplos: no es una dirección real de internet, es el equivalente a los teléfonos 555 de las películas.

### 2.3. El prefijo: el mismo LPM que en IPv4

```text
2001:0db8:85a3::/48
                   └─ 48 = longitud del prefijo (red), el resto = el host

/64  → el estándar de subred IPv6 (suficientes direcciones para "todo")
/48  → el bloque típico que asigna un proveedor a una empresa
/128 → UNA dirección exacta (como el host en IPv4, pero "exacto")
```

Este bloque explica la barra. La primera parte muestra un prefijo escrito completo: la dirección y, después de la barra, un número. La flecha `└─` señala ese número y lo define: es la **longitud del prefijo**, o sea cuántos bits de la izquierda identifican la red. Los bits que sobran identifican al equipo dentro de esa red. Después vienen las tres longitudes que hay que reconocer de un vistazo.

Las tres, en criollo:

- **`/64` es la subred estándar.** Es la que se usa para una red de área local: alcanza para 2^64 direcciones, que es más de lo que cualquier edificio va a necesitar. Y no es un capricho: la autoconfiguración de direcciones de IPv6 (el mecanismo por el que un equipo se arma su propia dirección sin DHCP) exige 64 bits para la parte de red. Un `/64` es la unidad mínima de diseño.
- **`/48` es el bloque de una empresa.** Un proveedor de internet (**ISP**, *Internet Service Provider*) le entrega a la empresa un `/48`, y con eso la empresa puede armar 65.536 subredes `/64`, una por cada oficina, piso o VLAN.
- **`/128` es una sola dirección.** Exactamente un equipo. En IPv4, una ruta a un solo host se escribe con máscara `/32`; acá es `/128`, y se usa muchísimo para las loopbacks de los routers (la interfaz virtual que después va a llevar el Router ID).

Y lo importante de la selección de rutas sigue vigente: la tabla de rutas IPv6 usa **LPM** (longest prefix match) igual que IPv4. `2001:db8:1::/64` gana sobre `2001:db8::/48` para un destino dentro de `2001:db8:1::/64`. Nada cambia en el cerebro de las rutas: cambia el tamaño de los números.

**LPM** significa *longest prefix match*, "la coincidencia de prefijo más larga". Es la regla con la que el router elige, entre varias rutas que podrían servir, la más específica. Si tengo una ruta hacia `2001:db8::/48` y otra hacia `2001:db8:1::/64`, y el paquete va a `2001:db8:1::55`, gana la `/64` porque describe mejor el destino. Es la misma regla que ya usás en IPv4, y es la razón por la que un prefijo mal escrito genera rutas que "existen pero no se usan".

> **Analogía del LPM:** tenés dos direcciones para llegar a una casa. Una dice "andá al barrio X" y la otra dice "andá al barrio X, calle 5, número 12". Las dos te acercan, pero la más específica te deja en la puerta. El router siempre prefiere la más específica.

### 2.4. Los tres tipos de direcciones que vas a ver en OSPFv3

| Tipo | Ejemplo | Uso |
|------|---------|-----|
| **Link-local** | `fe80::1` (siempre `fe80::/10`) | Sólo en el enlace local: **OSPFv3 usa estas para los vecinos y los Hells** |
| **Global** | `2001:db8:1::1` (rutas globales) | La "pública" IPv6 — lo que se anuncia y se enruta |
| **Multicast** | `ff02::5` (todos los routers OSPF) `ff02::6` (DR/BDR) | La versión IPv6 de 224.0.0.5/6 |

Esta tabla es el mapa de direcciones del tema, y es la que tenés que tener pegada al lado del monitor la primera semana. Tiene tres columnas: el **tipo** de dirección, un **ejemplo** concreto y el **uso** que le da OSPFv3. Se lee de izquierda a derecha, y cada fila es un mundo distinto.

Fila por fila:

- **Link-local.** Empieza siempre con `fe80::` (el rango es `fe80::/10`) y **sólo vale dentro del cable**. No se enruta: un paquete con destino link-local nunca cruza un router. Es la dirección que OSPFv3 usa para saludar y para identificar al vecino. El capítulo 2.5 la desarrolla, porque es la pieza que desbloquea todo el protocolo.
- **Global.** Es la dirección "pública", la que se anuncia por OSPF y la que aparece en la tabla de rutas. Es la que le darías a un servidor para que lo alcancen desde otra red. En los ejemplos se usa el rango `2001:db8::/32`, que está reservado justamente para documentación.
- **Multicast.** Es el envío a un grupo: una sola dirección que llega a todos los anotados en la lista. `ff02::5` es "todos los routers OSPFv3 de este enlace" (ahí van los saludos) y `ff02::6` es "sólo el DR y el BDR" (ahí van las actualizaciones en redes compartidas). Son las herederas directas de `224.0.0.5` y `224.0.0.6` de IPv4.

> **Nota de una línea:** el original escribe "los Hells" en varias líneas; el paquete se llama **Hello** y el plural es **Hellos**. Dejamos las líneas tal cual para no perder contenido, pero escribilo bien en un examen.

Un detalle que ordena mucho: en IPv6 **no hay dirección de broadcast**. Donde IPv4 usaba `255.255.255.255`, IPv6 usa multicast (`ff02::1` es "todos los nodos de este enlace"). Esa es la razón por la que el multicast aparece tanto en la tabla de arriba y por la que OSPFv3 no necesita casos especiales.

### 2.5. Link-local: la dirección que aparece sola

Acá está el concepto que más confunde al principio, así que vamos despacio.

Cuando activás IPv6 en una interfaz, el router se genera **automáticamente** una dirección link-local. No la configurás, no la pedís: aparece. Es siempre del rango `fe80::/10`, y se arma combinando un prefijo fijo con un identificador derivado de la interfaz (en IOS, tradicionalmente a partir de la dirección MAC; en equipos modernos, de forma aleatoria y estable).

> **Analogía:** la link-local es el **nombre con el que te conocen en tu casa**. No sirve para mandarte una carta desde otra ciudad, pero alcanza para que te llamen a la cocina. Y podés llamarte "Juan" en tu casa y también "Juan" en la casa de al lado: no hay conflicto, porque cada casa es un mundo separado. Así funciona `fe80::1`: puede estar repetida en todos los routers del planeta sin que se peleen, porque cada una sólo vale en su propio cable.

Cuatro propiedades que hay que saber, y que explican todo lo que viene:

1. **No se enruta.** Un router no reenvía un paquete con destino link-local por otra interfaz. Vive y muere en el enlace.
2. **Es obligatoria.** Toda interfaz con IPv6 la tiene, aunque vos no la hayas escrito. Y si la interfaz no tiene IPv6 activada, no hay link-local, y sin link-local no hay vecino OSPFv3.
3. **Se puede fijar a mano.** El comando `ipv6 address fe80::1 link-local` (dentro de la interfaz) te deja elegirla. Esto es lo que se hace en los laboratorios y en producción para que el vecino sea predecible: si sabés que R2 es `fe80::2` en ese cable, el `show` te dice de un vistazo quién es quién.
4. **Es la que usan los protocolos de control.** OSPFv3, y también el descubrimiento de vecinos de IPv6 (**NDP**, *Neighbor Discovery Protocol*, el reemplazo de ARP), funcionan con link-local.

> **El dato que desbloquea OSPFv3:** los Hells y las vecindades se arman por **link-local** (`fe80::`), no por la global. El vecino OSPFv3 se identifica por su link-local + su Router ID. Eso te va a parecer raro al principio (¿y la global dónde está?), pero es el diseño limpio de OSPFv3 — vas a ver por qué en la sección 4.

Ese "por qué" tiene una respuesta corta que conviene adelantar: una interfaz IPv6 puede tener **varias** direcciones globales al mismo tiempo (una del proveedor viejo, una del nuevo, una temporal). Si OSPF tuviera que elegir con cuál identificarse, cualquier renumeración rompería las vecindades. La link-local, en cambio, siempre está y siempre es la misma dentro del cable: es el ancla estable del protocolo.

### 2.6. Tres cosas que IPv6 ya no tiene (para no buscarlas)

Para cerrar el capítulo, tres ausencias que ahorran horas de búsqueda:

- **No hay broadcast.** Se reemplazó por multicast. Si buscás una dirección "de todos" en IPv6, es `ff02::1` (todos los nodos del enlace).
- **No hay ARP.** El descubrimiento de la dirección física del vecino lo hace NDP, sobre ICMPv6. Si buscás la tabla ARP, en IPv6 se llama tabla de vecinos.
- **No hay checksum en el encabezado IPv6.** Lo sacaron porque las capas de abajo ya verifican, y así los routers no recalculan nada en cada salto. Es una de las razones por las que enrutar IPv6 es más liviano para el procesador.

**ICMPv6** son las siglas de *Internet Control Message Protocol versión 6*, el protocolo de mensajes de control: los avisos de "no encontrado", "paquete demasiado grande" y los mensajes con los que se descubre a los vecinos. En IPv4, ICMP era un ayudante; en IPv6 es parte estructural.

### Resumen

- Una dirección IPv6 son 128 bits en 8 grupos hexadecimales, que se abrevian quitando ceros líderes y comprimiendo un solo bloque de ceros con `::`.
- El prefijo se escribe con barra (`/64`, `/48`, `/128`) y las rutas se eligen con la misma regla de prefijo más largo que en IPv4.
- Hay tres tipos de dirección en juego: link-local (sólo en el cable), global (la que se enruta) y multicast (la de los grupos, como `ff02::5`).
- La link-local `fe80::` aparece sola en toda interfaz con IPv6 y es la que OSPFv3 usa para vecinos y next-hops.
- IPv6 no tiene broadcast, ni ARP, ni checksum de encabezado: cambiaron las piezas, no la lógica.

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

Esta tabla es la comparación honesta entre las dos versiones, y es la primera que hay que mirar antes de asustarse. Tiene tres columnas: la **pieza** del protocolo, cómo funciona en **OSPFv2** y cómo funciona en **OSPFv3**. Si las dos últimas columnas dicen lo mismo, no hay nada nuevo que aprender: es herencia.

Fila por fila, sin saltear ninguna:

- **Familia: estado de enlace.** Las dos versiones hacen lo mismo: cada router publica sus cables, todos arman el mismo mapa, cada uno calcula su camino. No es vector de distancia, no hay rumores.
- **AD: 110.** La **AD** (*Administrative Distance*, "distancia administrativa") es el número con el que el router decide en quién confiar cuando dos fuentes le ofrecen la misma ruta. Menor es más confiable: una ruta estática tiene 1, OSPF tiene 110, RIP tiene 120. OSPFv3 conserva el 110, así que sigue perdiendo contra una estática y ganando contra RIP.
- **Métrica: costo.** El costo de un enlace sale de su ancho de banda: más rápido el enlace, menos costo, y los costos se suman a lo largo del camino. En IPv6 y IPv4 la fórmula es la misma.
- **SPF / Dijkstra.** El algoritmo que calcula el árbol de caminos es idéntico. **Dijkstra** es el nombre del matemático que lo inventó; **SPF** es el nombre que le da OSPF.
- **Vecindades y estados.** Los siete estados (Down, Init, 2-Way, ExStart, Exchange, Loading, Full) son los mismos, en el mismo orden, con el mismo significado.
- **Hello / Dead: 10 / 40 s.** El saludo sale cada 10 segundos y el vecino se declara muerto a los 40 sin recibir uno. Los dos números son iguales en v2 y en v3, y siguen sin negociarse: o coinciden, o no hay vecindad.
- **DR/BDR en broadcast.** En un segmento compartido (un switch con varios routers) se eligen un DR y un BDR para concentrar las conversaciones, en las dos versiones.
- **Áreas + área 0.** La división en áreas y la obligación de tocar el área 0 son idénticas.
- **ABR / ASBR / stubs / NSSA.** Las cuatro siglas del diseño multi-área sobreviven: **ABR** (*Area Border Router*, el router en el borde de dos áreas), **ASBR** (*Autonomous System Boundary Router*, el que conecta con otro dominio de enrutamiento), **stub** (un área que no recibe rutas externas) y **NSSA** (*Not-So-Stubby Area*, la variante que las recibe de forma controlada).

Si te llevás una sola idea de esta tabla: **no estás aprendiendo un protocolo nuevo**. Estás aprendiendo una versión nueva del mismo protocolo, y la mayor parte de tu conocimiento previo vale igual.

### 3.2. Lo que SÍ cambia (las tres diferencias de arquitectura)

| Cambio | OSPFv2 | OSPFv3 |
|--------|--------|--------|
| **1. Procesos por familia** | Un proceso OSPF para IPv4 | Proceso OSPF por **address family** (IPv4 O/IPv6) — seccion 8 |
| **2. Los LSA llevan direcciones?** | El LSA tipo 1 llevaba las IPs dentro | Los LSA **ya no llevan direcciones adentro**: el *prefix* se anuncia con LSA separado (tipo 8/9) |
| **3. Vecinos por link-local** | Vector con la IP global/específica | Vecinos y Hells **solo por link-local** (`fe80::`) |
| **4. Instancias** | Protocolo 89 directo | Protocolo 89 + **instance ID** (múltiples OSPFv3 en el mismo enlace) |

Esta es la tabla que importa, y tiene la misma estructura que la anterior: **cambio**, cómo era en **v2** y cómo es en **v3**. Acá están las cuatro diferencias que hay que entender de verdad. Ninguna es cosmética: las cuatro salen de la misma decisión de diseño, que explicamos en 3.3.

Fila por fila:

- **1. Procesos por familia.** En v2, un proceso OSPF es de IPv4 y punto. En v3 podés tener un proceso que sirva IPv4 e IPv6 a la vez, declarando familias dentro del proceso. A eso se lo llama **address family** (familia de direcciones), y es el tema del capítulo 8. (El original escribe "seccion" sin tilde; es "sección".)
- **2. Las direcciones salen de los LSA.** Este es el cambio arquitectónico. En v2, el LSA tipo 1 (el "router LSA") llevaba adentro las direcciones IP de las interfaces. En v3, el LSA tipo 1 describe interfaces por un número interno y **no lleva ninguna dirección**; los prefijos se anuncian por separado, en los LSA tipo 8 y 9.
- **3. Vecinos por link-local.** En v2 el router identificaba al vecino por la dirección IP del enlace. En v3 usa la link-local, esa que vimos en 2.5. Consecuencia práctica: el next-hop de las rutas OSPFv3 es `fe80::...`, no la global.
- **4. Instancias.** OSPF corre sobre el **protocolo IP 89** (un número que va en el encabezado IP y dice "esto es OSPF"). En v3, además, cada paquete lleva un **instance ID**: un número que permite tener varios OSPFv3 independientes en el mismo cable. Dos routers con instancias distintas se escuchan y se ignoran.

> **La realización que separa a los que entienden:** OSPFv3 fue diseñado para ser **agnóstico de la dirección** (RFC 2740/5340). Por eso separó "el mapa de routers" (T1/T2 con interface IDs) del "mapa de direcciones" (LSA de prefijos). Ese diseño es lo que permite que el MISMO proceso OSPFv3 pueda correr IPv4 e IPv6 a la vez. OSPFv2 era "el protocolo + IPv4 pegados con fideos"; OSPFv3 es "protocolo por un lado, direcciones por otro".

**RFC** son las siglas de *Request for Comments*, los documentos donde se publican los estándares de internet. El 5340 es el que define OSPFv3 para IPv6, y reemplazó al 2740.

### 3.3. La razón de fondo: un protocolo que no sabe qué es una dirección

Vale la pena entender *por qué* alguien se tomaría el trabajo de reescribir un protocolo que funcionaba. La respuesta es una sola palabra: **renumeración**.

Pensá en una empresa que cambia de proveedor de internet. Con IPv4 y OSPFv2, cada interfaz cambia de dirección, cada LSA tipo 1 cambia, todos los routers del área recalculan el árbol SPF completo, y mientras tanto hay cortes. Con IPv6, esa misma empresa tiene un `/48` nuevo y renumera todo: si el protocolo tuviera las direcciones metidas en la topología, sería el mismo desastre.

La solución de OSPFv3 fue **separar dos mapas**:

1. **El mapa de routers:** quién está conectado con quién, con qué costo. Se arma con los LSA tipo 1 y 2, que describen interfaces por identificador, sin una sola dirección.
2. **El mapa de direcciones:** qué prefijo tiene cada interfaz. Se arma con los LSA tipo 8 y 9, que son una capa aparte.

Con los dos mapas separados, cambiar un prefijo **no toca la topología**: se regenera el LSA de prefijos y el árbol SPF queda como estaba. La red ni se entera.

> **Analogía:** es la diferencia entre un plano de calles y una guía de direcciones. El plano dice cómo se conectan las calles (eso no cambia si le cambian el nombre a una calle). La guía dice qué número tiene cada puerta. Si el municipio renumera las puertas, no hace falta redibujar el plano: se actualiza la guía. OSPFv2 tenía todo escrito en el mismo papel; OSPFv3 lo separó en dos cuadernos.

### 3.4. Qué tuvo que adaptar OSPF, en cinco decisiones

Si querés contarle a alguien "qué cambió en OSPFv3" sin repetir la tabla, contá estas cinco decisiones. Todas salen de la misma raíz: **una interfaz IPv6 no es una dirección, es un conjunto de direcciones**.

1. **La configuración se mudó a la interfaz.** En v2 activabas OSPF con una sentencia global (`network 10.0.0.0 0.0.0.3 area 0`) que decía "las interfaces que caigan en esta red entran al área". En v3 se activa en la interfaz misma (`ipv6 ospf 1 area 0`). Tiene sentido: si una interfaz puede tener tres direcciones de tres prefijos distintos, "la red" no alcanza para identificarla.
2. **Los vecinos se identifican por link-local.** Es la única dirección que toda interfaz IPv6 tiene, y es estable frente a renumeraciones. Por eso el protocolo se ancla ahí.
3. **Las direcciones salieron de los LSA de topología.** Es la decisión de 3.3, y es la que permite renumerar sin recalcular el árbol.
4. **Apareció el instance ID.** Como OSPFv3 ya no puede distinguir procesos por la familia de direcciones (puede servir las dos), necesitaba otra marca para separar instancias en el mismo cable.
5. **El Router ID siguió siendo de 32 bits.** Aunque el protocolo sea de IPv6, el identificador del router es un número de 32 bits con forma de dirección IPv4. Es una decisión de compatibilidad y de estabilidad: el nombre del router no tiene por qué cambiar cuando cambian sus direcciones. Esto es tan importante que tiene su propio capítulo (el 4.2 y el 5).

Las cinco decisiones, juntas, explican el 100 % de las diferencias que vas a ver en los comandos. Cuando en el capítulo 6 escribas `ipv6 ospf 1 area 0` en la interfaz, acordate de que no es un capricho de sintaxis: es la consecuencia de la decisión 1.

### Resumen

- OSPFv3 conserva lo esencial de v2: estado de enlace, AD 110, costo, SPF, estados de vecindad, DR/BDR, áreas y área 0.
- Lo que cambia es la relación con las direcciones: los LSA de topología ya no llevan prefijos y aparecen los LSA tipo 8 y 9.
- Los vecinos y los next-hops usan link-local, no la dirección global.
- La configuración pasó de ser global (`network`) a ser por interfaz, y apareció el instance ID.
- Todo el rediseño persigue un objetivo: renumerar una red sin recalcular la topología.

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

Este bloque es la lista de los siete tipos de LSA que importan en OSPFv3. Se lee como una lista de ingredientes: a la izquierda el número y el nombre del tipo, a la derecha qué aporta al mapa. Los dos últimos están marcados **NUEVO** porque no existen en OSPFv2 con esa función.

Tipo por tipo, porque esta lista es la que separa a los que saben de los que repiten:

- **Tipo 1 (Router):** lo genera cada router. Describe sus interfaces con un identificador interno (**Interface ID**) y sus vecinos. Lo importante: **no lleva direcciones**. Es la lista de cables de esa esquina.
- **Tipo 2 (Network):** lo genera el DR de un segmento compartido. Describe el segmento como si fuera un nodo más del mapa, y dice quién es el DR. Tampoco lleva direcciones.
- **Tipo 3 (Inter-area):** lo generan los ABR. Anuncia, hacia otras áreas, los prefijos que hay dentro de la suya. Es el "resumen" del área.
- **Tipo 4 (ASBR):** también lo genera un ABR, y sirve para decir cómo llegar al ASBR que anunció rutas externas.
- **Tipo 5 (External):** anuncia prefijos de afuera de OSPF, los que entraron por redistribución. Es el tipo que llena la tabla con rutas `O E2`.
- **Tipo 8 (Link-local):** nuevo. Anuncia la dirección link-local de la interfaz y los prefijos que están en ese enlace. Es la capa de direcciones del enlace.
- **Tipo 9 (Intra-area-prefix):** nuevo. Anuncia los prefijos que van asociados a un router del área. Es el que dice "y esas interfaces del tipo 1 tienen estos prefijos".

> **La regla mental (el patrón de oro):** en OSPFv3, el T1 te dice "tal router tiene las interfaces 1, 2, 3"; el **T9** te dice "y esas interfaces tienen estos prefijos". Mismo mapa, dos capas: la capa de routers y la capa de direcciones. Por eso cuando una subred IPv6 cambia, solo se regenera el **T9** (no todo el árbol SPF).

Hay dos detalles que completan el cuadro y que no están en el bloque, pero conviene saber:

- El **tipo 7** (NSSA) existe en las dos versiones y se usa en áreas NSSA. No aparece en la lista porque el original muestra sólo los tipos que cambian de función; en v3 sigue existiendo.
- OSPFv2 tenía un **tipo 6** para grupos multicast. OSPFv3 lo eliminó, porque las direcciones multicast ya no separan a los routers en grupos distintos. Si lo buscás en v3, no está: no es un error tuyo.

Consecuencia práctica de todo esto: cuando mires una LSDB de OSPFv3 con `show ipv6 ospf database`, vas a ver una entrada por cada tipo. Si te falta un tipo 9 para un prefijo, ese prefijo no va a aparecer en la tabla de rutas, aunque el vecino esté en Full. Es un síntoma muy característico y lo vas a ver en el capítulo 9.

### 4.2. El Router ID: el DNI que se hereda

OSPFv3 necesita un **Router ID igual de 32 bits**, y lo toma... ¡de IPv4! (si existe):

```text
Router ID 1.1.1.1
      │
      ├── En OSPFv2: identifica al router en el mundo IPv4
      └── En OSPFv3: identifica al router en el mundo IPv6
          (aunque no haya IPv4 en el router, el RID es un número de 32 bits — se configura igual)
```

Este bloque dibuja una sola idea: el mismo número sirve para las dos versiones. Se lee de arriba hacia abajo: arriba está el valor (`Router ID 1.1.1.1`), la barra vertical baja desde él y se abre en dos ramas con `├──` y `└──`, una por cada versión del protocolo. La última línea, entre paréntesis, es la aclaración importante: el número es de 32 bits aunque el router no tenga una sola dirección IPv4.

El **Router ID (RID)** es el nombre con el que cada router firma sus LSA dentro del mapa. No es una dirección de una interfaz: es un identificador. Puede coincidir con una (y es recomendable que coincida con la loopback 0), pero no tiene por qué.

> **Analogía:** el RID es el **DNI del router**. El DNI no dice dónde vivís ni sirve para mandarte una carta: sirve para que no te confundan con otro. La dirección IP es la dirección de tu casa; el RID es tu número de documento.

¿Por qué 32 bits y no 128? Porque el identificador tiene que ser **estable y corto**, y porque OSPFv3 se diseñó para poder hablar de routers que también están en IPv4. Es una decisión de compatibilidad: un router que corre las dos familias tiene un solo nombre en las dos.

> **El detalle que confunde en el 90% de los labs:** si el router NO tiene IPv4 y no configuraste `router-id`, OSPFv3 NO arranca y te grita "Router ID is not configured". El RID es obligatorio en OSPFv3 (a diferencia de v2, que "eligía solito"). Por eso la receta de la sección 6 SIEMPRE empieza con `router-id`.

Ese mensaje es literal: en IOS, un router sin ninguna dirección IPv4 y sin `router-id` no puede levantar el proceso OSPFv3, y el log lo dice con esas palabras. No es un bug: es que el protocolo no tiene con qué firmar sus LSA. Y como en un laboratorio de IPv6 puro no hay ninguna IPv4, el `router-id` deja de ser una buena práctica y pasa a ser un requisito.

### 4.3. Instancias: varios OSPFv3 en un mismo enlace

OSPFv3 agrega un **instance ID** al protocolo 89 (por ejemplo `ipv6 ospf 1 area 0 instance 5`). Sirve para correr múltiples procesos OSPFv3 independientes sobre el mismo segmento físico (redes MPLS, VPNs, separación lógica). Es avanzado — para CCNA alcanza con saber que existe y que los Hellos llevan el instance: si dos routers tienen instancias distintas, no se ven.

**MPLS** son las siglas de *Multiprotocol Label Switching*, una técnica con la que los proveedores arman redes privadas sobre una infraestructura compartida; **VPN** es *Virtual Private Network*, una red privada montada sobre otra red. En esos ambientes conviven varios clientes en el mismo cable, y cada uno necesita su propio OSPFv3 sin mezclarse con el vecino. Para eso está el instance.

Lo importante para un principiante es el síntoma: dos routers con instance distinto **se escuchan y no se aceptan**. En `show ipv6 ospf neighbor` el vecino no aparece, igual que si el área estuviera mal. La diferencia se nota mirando la configuración de la interfaz, que muestra el `instance` si lo tiene.

### 4.4. Lo que cambió dentro del paquete

Hay tres cambios internos que explican varios comportamientos raros:

- **El encabezado es más corto.** El paquete OSPFv3 tiene un encabezado de 16 bytes; el de OSPFv2 tiene 24. Se sacaron la versión y la autenticación, y el resto se reacomodó.
- **No hay autenticación propia.** OSPFv2 traía campos de autenticación (contraseña en claro o hash). OSPFv3 los eliminó y delega la seguridad en **IPsec**, que es la suite de cifrado y autenticación de IP. En un examen te pueden preguntar esto: en v3, la autenticación no es del protocolo, es de IP.
- **El protocolo corre por enlace, no por subred.** OSPFv2 asumía que un enlace tenía una sola subred. OSPFv3 corre "por link": dos vecinos en el mismo cable pueden estar en prefijos distintos y aun así ser vecinos. Esto es coherente con 3.3: el protocolo no necesita saber qué direcciones hay para formar la vecindad.

Los cinco tipos de paquete, en cambio, son los mismos que en v2: **Hello** (saludo), **DBD** (*Database Description*, el índice de la base), **LSR** (*Link State Request*, el pedido de un LSA que falta), **LSU** (*Link State Update*, el envío del LSA) y **LSAck** (*Link State Acknowledgment*, el acuse de recibo). Si aprendiste esos cinco en v2, no cambian.

### Resumen

- Los LSA tipo 1 y 2 describen la topología sin direcciones; los prefijos van en los tipos 8 y 9.
- El tipo 9 es la capa de direcciones del área: separa "quién es quién" de "qué prefijo tiene".
- El Router ID sigue siendo de 32 bits y en OSPFv3 es obligatorio: sin `router-id`, el proceso no arranca.
- El instance ID permite varios OSPFv3 en el mismo enlace, y si no coincide, no hay vecindad.
- El paquete cambió por dentro: encabezado más corto, sin autenticación propia (usa IPsec) y vecindad por enlace.

---

## 5. El router ID y los procesos: la herencia

### 5.1. La regla de plata de OSPF (v2 o v3)

Ya la pusiste en práctica con OSPF y aplica igual acá:

> **`router-id` SIEMPRE explícito.** RID duplicado = caos en la LSDB, adyacencias que bailan. Configurá `router-id 1.1.1.1` / `2.2.2.2` / `3.3.3.3`... y si lo cambiás despuéreas config, reiniciá con `clear ipv6 ospf process` o reiniciá el proceso.

(El original dice "despuéreas"; es "después de".) El motivo de fondo es el de siempre: si dos routers firman sus LSA con el mismo número, el mapa no puede distinguirlos y las vecindades suben y bajan en ciclo. En OSPFv3 esto es peor que en v2, porque el RID es obligatorio y no hay elección automática que lo salve: si dos routers tienen el mismo, el conflicto es permanente hasta que alguien lo cambie a mano.

Y el "reiniciá" de la cita no es un consejo vago: cambiar el `router-id` en la configuración **no** cambia el RID de un proceso que ya está corriendo. El proceso lo toma al arrancar. Para que tome el nuevo hay que reiniciarlo (`clear ipv6 ospf process`) o reiniciar el router. Si no lo hacés, vas a jurar que configuraste bien y el `show` te va a mostrar el viejo.

### 5.2. Dos procesos en un mismo router

Con "address families" (sección 8) un router puede tener OSPFv2 (IPv4) Y OSPFv3 (IPv6) **al mismo tiempo** — son dos procesos independientes, cada uno con su propia LSDB, su propio SPF y su propia tabla:

```text
  R1
  ├── proceso OSPFv2 (protocolo 89, IPv4)  → tabla IPv4 (rutas O)
  └── proceso OSPFv3 (protocolo 89, IPv6)  → tabla IPv6 (rutas OI/O)
         ↑ cada uno con su router-id, sus áreas, sus timers
```

Este bloque dibuja un router con dos motores. Se lee como un árbol: arriba el equipo (`R1`), y debajo dos ramas, una por proceso. Las flechas `→` indican a qué tabla de rutas alimenta cada uno, y la flecha `↑` de abajo apunta a la nota que vale para las dos: cada proceso tiene su propio router-id, sus áreas y sus timers.

Los detalles que importan:

- **Las rutas `O` y `OI`.** El código `O` en la tabla de rutas significa "aprendida por OSPF intra-área"; `OI` significa "aprendida por OSPF inter-área". En la tabla IPv6 los vas a ver con esos códigos, y son la señal de que OSPFv3 está trabajando.
- **El protocolo 89 es el mismo para los dos.** No hay dos protocolos IP distintos: los dos procesos hablan "IP protocol 89". Lo que los separa es la familia de direcciones (IPv4 o IPv6) y, si hace falta, el instance.
- **No comparten nada.** Ni LSDB, ni SPF, ni timers. Que uno esté sano no dice nada del otro.

Es la norma en redes de transición (IPv4 + IPv6 conviviendo): los dos procesos no se pelean, no comparten LSDB, no se redistribuyen entre sí salvo que se los pidas. Conviven en paz porque el diseño agnóstico de v3 lo permite limpio.

> **Analogía:** es un edificio con dos ascensores independientes, uno para cada ala. Comparten la puerta de entrada y el mismo número de protocolo, pero si se rompe uno, el otro sigue funcionando. Nadie espera que el ascensor del ala A "se entere" de lo que pasa en el ala B.

### 5.3. Cuándo hay que reiniciar el proceso

Tres cambios no se aplican en caliente, y conviene tenerlos anotados:

1. **Cambiar el `router-id`.** El proceso toma el RID al arrancar. Cambiarlo en config no lo cambia en vivo.
2. **Cambiar el instance de una interfaz.** La vecindad se rearma con el instance nuevo, y los vecinos que tenían el viejo dejan de verte.
3. **Cambiar el área de una interfaz.** El router deja de ser vecino de los del área vieja y empieza de cero con los del área nueva.

Un reinicio de proceso OSPFv3 no reinicia el router: sólo tira las vecindades y vuelve a empezar. En una red en producción eso es un corte breve de rutas, así que se hace en ventana de mantenimiento. En un laboratorio, en cambio, es tu herramienta de todos los días.

### Resumen

- El Router ID se configura siempre a mano y con un número único por router.
- Cambiar el `router-id` en la configuración no cambia el RID en vivo: hay que reiniciar el proceso.
- Un router puede correr OSPFv2 y OSPFv3 a la vez: son dos procesos con LSDB, SPF y timers propios.
- Los dos hablan IP protocol 89, pero no comparten nada ni se redistribuyen solos.
- Reiniciar el proceso tira las vecindades y las vuelve a levantar: es corte breve, no reinicio del equipo.

---

## 6. Configuración: OSPFv3 en 10 minutos

### 6.1. La topología (la misma de OSPFv2, en IPv6)

```text
  R1 ──── 2001:db8:0:1::/64 ──── R2 ──── 2001:db8:0:2::/64 ──── R3
  .1                           .2        .1                     .2
lo0 2001:db8:1::1/128      lo0 2001:db8:2::2/128        lo0 2001:db8:3::3/128
RID 1.1.1.1               RID 2.2.2.2                  RID 3.3.3.3
```

Este bloque es el plano del laboratorio, y hay que leerlo en tres pasadas porque cada renglón cuenta una cosa distinta.

- **Primera pasada, la fila de arriba:** los tres routers y los dos cables que los unen. `R1` está conectado a `R2` por la red `2001:db8:0:1::/64`, y `R2` a `R3` por `2001:db8:0:2::/64`. R1 y R3 **no** están conectados directamente: para hablar tienen que pasar por R2, y esa es la gracia del ejercicio.
- **Segunda pasada, la fila de abajo:** los últimos octetos de cada interfaz (`.1`, `.2`) alineados con el router que les corresponde. R1 es `.1` en el primer cable y R2 es `.2`; en el segundo cable R2 es `.1` y R3 es `.2`. Los `.1` y `.2` están puestos debajo del tramo que les toca, no debajo del router.
- **Tercera pasada, las dos últimas filas:** las loopbacks y los Router IDs. Cada router tiene una **loopback** (una interfaz virtual que no depende de ningún cable) con un `/128`, y su RID coincide con esa dirección pero en formato IPv4: `1.1.1.1`, `2.2.2.2`, `3.3.3.3`.

Las loopbacks son las direcciones de gestión: son las que se anuncian por OSPF para poder administrar el router desde cualquier punto de la red, y las que se usan para probar conectividad con un `ping`. Como no dependen de un cable, no se caen cuando se cae un enlace.

Este laboratorio es el mismo de OSPFv2, con las direcciones traducidas a IPv6. Esa es la mejor forma de estudiar el tema: si el plano es idéntico, cualquier diferencia que aparezca en la configuración o en la verificación es una diferencia **del protocolo**, no del ejercicio.

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

Este bloque es la configuración completa de R1, y se lee de arriba hacia abajo como una receta. Las líneas que empiezan con `!` son comentarios: el router las ignora, están para el humano. Las demás son comandos de verdad.

Línea por línea:

- **`! R1 — activá IPv6...`** es el comentario de cabecera: dice qué hace el bloque.
- **`ipv6 unicast-routing`** es la llave de encendido. Sin este comando, el router **no reenvía** paquetes IPv6: puede tener direcciones en las interfaces, puede responder un ping a sí mismo, pero no enruta nada. Es global, va una sola vez por router, y es el error número 1 del capítulo 9. El comentario al costado lo dice: habilita el *forwarding* (el reenvío) de IPv6.
- **`!`** sola separa bloques, como un renglón en blanco.
- **`interface loopback 0`** entra a la interfaz virtual 0.
- **`ipv6 address 2001:db8:1::1/128`** le pone la dirección de gestión, con prefijo `/128` porque es una sola dirección.
- **`ipv6 ospf 1 area 0`** es el comando central de todo el manual: mete esta interfaz en el proceso OSPFv3 número 1, dentro del área 0. Se repite en cada interfaz que participa.
- **`interface GigabitEthernet0/0`** entra a la interfaz del cable hacia R2.
- **`ipv6 address 2001:db8:0:1::1/64`** le pone la dirección del enlace, con `/64` porque es una subred.
- **`ipv6 ospf 1 area 0`** activa OSPFv3 en esa interfaz también. Mirá que es la misma línea que en la loopback: no hay nada especial para el cable ni para la loopback.
- **`ipv6 ospf 1 ! ← acá, el proceso...`** es una anotación de repaso del original: la flecha señala que el proceso y el área se aplican **por interfaz**. Ojo: `ipv6 ospf 1` solo, sin área, no es un comando válido de IOS. El comando real es el de las líneas anteriores, `ipv6 ospf 1 area 0`. Lo aclaramos para que no lo copies a ciegas en un equipo.
- **`router ospf 1`** entra al proceso OSPF (el mismo número 1 que usaste en las interfaces; si los números no coinciden, la interfaz queda fuera del proceso).
- **`router-id 1.1.1.1`** le pone el nombre al router. Va al final del bloque por costumbre, pero tiene que estar: sin él, en un router sin IPv4, el proceso no arranca.

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

Este bloque es R2, y es el patrón de R1 repetido con una interfaz más. Se lee igual: primero la llave de encendido, después cada interfaz con su dirección y su activación de OSPFv3, y al final el proceso con su RID.

Lo único nuevo respecto de R1:

- **Tiene dos interfaces de cable** (`GigabitEthernet0/0` y `GigabitEthernet0/1`), porque es el router del medio. Una va hacia R1 y la otra hacia R3.
- **`ipv6 address 2001:db8:0:1::2/64`** es la punta `.2` de la primera red, y **`ipv6 address 2001:db8:0:2::1/64`** es la punta `.1` de la segunda. Fijate que R2 es `.2` en un cable y `.1` en el otro: el número no identifica al router, identifica a la interfaz.
- **`router-id 2.2.2.2`** es el único valor que cambia en el proceso.

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

Este bloque es R3, el espejo de R1 del otro lado. Se lee igual que los anteriores, y no tiene ninguna línea nueva: una loopback, un cable, el proceso y el RID.

Lo que hay que mirar acá es la simetría: **el mismo esqueleto, tres veces, con los números cambiados**. Si entendiste el de R1, entendiste los tres. Y si en un examen te dan una topología nueva, la receta es esta: `ipv6 unicast-routing` global, después por cada interfaz `ipv6 address` + `ipv6 ospf 1 area 0` (con tu número de proceso y tu área), y al final el proceso con `router-id`.

> **HACELO VOS:** antes de configurar OSPFv3, verificá que las interfaces tengan su dirección y su link-local con `show ipv6 interface brief`. Si la columna de link-local está vacía, no sigas: sin eso el protocolo no puede ni saludar.

### 6.3. La sintaxis explicada (comparada con v2)

| Paso | OSPFv2 (`network ... area`) | OSPFv3 (`interface`) |
|------|----------------------------|----------------------|
| Arrancar el proceso | `router ospf 1` | `router ospf 1` |
| RID | `router-id X.X.X.X` | `router-id X.X.X.X` |
| Meter la interfaz al área | `network 10.0.0.0 0.0.0.3 area 0` (global) | `ipv6 ospf 1 area 0` (interface) |
| Habilitar IPv6 en el router | (no aplica) | `ipv6 unicast-routing` (global) |

Esta tabla es el "diccionario de traducción" entre las dos versiones. Tiene tres columnas: el **paso** que querés dar, cómo se hace en **OSPFv2** y cómo se hace en **OSPFv3**. Se lee de izquierda a derecha, y la gracia es ver qué pasos son idénticos y cuál cambió.

Paso por paso:

- **Arrancar el proceso: idéntico.** `router ospf 1` en las dos versiones. El número es local al router (no tiene que coincidir con el del vecino), pero sí tiene que coincidir con el que usaste en las interfaces.
- **RID: idéntico.** `router-id X.X.X.X`, con la diferencia de que en v3 es obligatorio de hecho (porque puede no haber IPv4 de dónde sacarlo).
- **Meter la interfaz al área: acá está el cambio grande.** En v2 se hace desde el proceso, con `network` y una **wildcard**: `network 10.0.0.0 0.0.0.3 area 0`. La wildcard es la máscara invertida (en una `/30`, la máscara es `255.255.255.252` y la wildcard `0.0.0.3`), y sirve para decir "las interfaces cuya dirección caiga en este rango entran al área". En v3 se hace desde la interfaz: `ipv6 ospf 1 area 0`. No hay wildcard, no hay rango, no hay adivinanza.
- **Habilitar IPv6 en el router: sólo en v3.** `ipv6 unicast-routing` no tiene equivalente en v2 porque IPv4 viene habilitado de fábrica. En v3 es un paso obligatorio y global.

> **La diferencia de filosofía en una línea:** OSPFv2 te hace matchear por `network` (configuración global); **OSPFv3 es config en la interfaz** (`ipv6 ospf 1 area 0`). Más directo, sin wildcard ni máscara inversa: el router mira la interfaz y dice "esta interfaz está en el área 0 del proceso 1".

Vale la pena entender por qué cambiaron: con IPv6 una interfaz puede tener varias direcciones, de varios prefijos. Un `network` con wildcard tendría que decidir cuál de todas mirar, y cualquier dirección nueva podría meter la interfaz en otra área sin que nadie lo pidiera. La configuración por interfaz elimina la ambigüedad de raíz.

> **Nota de una línea:** la fila del RID dice `X.X.X.X`, o sea una dirección con forma de IPv4. No es un error: el Router ID es de 32 bits, como vimos en 4.2, aunque el protocolo transporte IPv6.

### 6.4. El orden correcto, para no renegar

Si armás el laboratorio desde cero, este es el orden que evita el 90 % de los problemas:

1. **Direcciones primero.** `ipv6 unicast-routing` global y `ipv6 address` en cada interfaz. Verificá con `show ipv6 interface brief` que cada interfaz tenga su global y su link-local.
2. **Conectividad después.** Un `ping` entre vecinos, usando las direcciones globales del enlace. Si no hay ping, no sigas: OSPF no arregla lo que la capa 3 no tiene.
3. **OSPFv3 al final.** `ipv6 ospf 1 area 0` en cada interfaz y `router-id` en el proceso.
4. **Verificación inmediata.** `show ipv6 ospf neighbor` y esperá el `FULL`. Si no llega en unos segundos, es el capítulo 9.

El paso 2 es el que la gente se saltea, y es el que ahorra más tiempo: si el ping entre los extremos del cable no funciona, el problema es de direccionamiento (máscara, prefijo, interfaz apagada) y ningún comando de OSPF lo va a resolver.

### Resumen

- La topología del laboratorio es la misma de OSPFv2, traducida a IPv6: tres routers, dos enlaces y una loopback por router.
- La configuración tiene tres piezas por router: `ipv6 unicast-routing`, `ipv6 address` + `ipv6 ospf 1 area 0` en cada interfaz, y `router-id` en el proceso.
- La diferencia de filosofía con v2 es que en v3 el área se declara en la interfaz, no con `network` y wildcard.
- El RID sigue siendo un número con forma de IPv4, aunque el protocolo sea de IPv6.
- El orden sano es: direcciones, ping, OSPF, verificación.

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

Este bloque tiene **dos comandos** y sus salidas, una debajo de la otra. Las líneas que empiezan con `R1#` son lo que vos escribís (el `#` es el prompt de modo privilegiado); lo que sigue es lo que el router contesta. Se lee de arriba hacia abajo, como una conversación.

Primera salida, `show ipv6 ospf neighbor` (los vecinos OSPFv3 y su estado). Tiene seis columnas y cada una responde una pregunta distinta:

- **Neighbor ID:** el Router ID del vecino. Acá dice `2.2.2.2`, así que el vecino es R2. Es un número de 32 bits con forma de IPv4, como ya sabés.
- **Pri:** la prioridad de elección de DR. Por defecto es 1. Cuanto más alta, más chances tiene ese vecino de ser elegido DR en un segmento compartido.
- **State:** el estado de la vecindad. `FULL/DR` son **dos datos en uno**: la parte de la izquierda dice que la vecindad llegó a **Full** (las LSDB están sincronizadas, que es lo que querés ver), y la parte de la derecha dice que ese vecino es el **DR** del segmento. Si ves `FULL/BDR`, es el designado de respaldo. Si ves `2WAY/DROTHER`, es un router que no es DR ni BDR y está sano igual.
- **Dead Time:** cuánto falta para declarar muerto al vecino si no llega un Hello. Arranca en 40 segundos y baja; cuando llega a cero, el vecino se cae y la red recalcula. Si este número no baja nunca, sospechá: puede estar congelado.
- **Interface ID:** el identificador interno que el vecino le dio a esa interfaz en su LSA tipo 1. Es el número que reemplazó a las direcciones en el mapa de topología (capítulo 4.1). No es el nombre de la interfaz ni un número que tengas que configurar.
- **Interface:** la interfaz **local** por la que se ve a ese vecino. Acá, `GigabitEthernet0/0` de R1. Si esta columna te muestra una interfaz que no esperabas, el problema es de diseño o de cable, no de OSPF.

Lo que un principiante tiene que mirar primero: **que diga FULL**. Todo lo demás es contexto. Si dice `FULL`, la vecindad está sana y el problema (si hay uno) está en otra capa.

Segunda salida, `show ipv6 route ospf` (las rutas que OSPFv3 puso en la tabla IPv6). Tiene el formato clásico de una tabla de rutas, y cada línea dice mucho:

- **`OI` y `O`** son los **códigos de origen** de la ruta. `O` es "aprendida por OSPF intra-área" (dentro del área 0, en este laboratorio). `OI` es "aprendida por OSPF inter-área" (vino de otra área a través de un ABR).
- **`2001:db8:0:2::/64`** es el destino, con su prefijo. Es la red que está entre R2 y R3, que R1 no tiene conectada.
- **`[110/2]`** son dos números entre corchetes: **110** es la **AD** (la confianza en la fuente, la misma de siempre) y **2** es la **métrica**, el costo acumulado. El costo 2 se explica fácil: un enlace hasta R2 (costo 1) más el enlace de R2 a R3 (costo 1). Para la loopback de R3 el costo es 3, porque son tres enlaces, y la tercera línea lo muestra: `O 2001:db8:3::3/128 [110/3]`.
- **`via FE80::1`** es el **next-hop**: la dirección del vecino al que hay que entregarle el paquete para llegar a ese destino. Y acá está la firma de OSPFv3: es una **link-local**, no una global.
- **`GigabitEthernet0/0`** es la interfaz de salida.

Fijate en dos detalles que son la firma de OSPFv3:

```text
OI → rutas inter-área (con multi-área, el OI aparece como en v2)
via FE80::1 → el next-hop es la link-local del vecino (¡no la global!)
```

Este bloque son dos recordatorios de una línea cada uno, y se leen como carteles al costado del camino. El primero asocia el código `OI` con las rutas inter-área (y avisa que el código es el mismo que en v2). El segundo señala lo que más desconcierta al principio: el next-hop es `fe80::`, una link-local.

> **Nota de una línea:** en un laboratorio de **una sola área** (todo en área 0, como este), la red `2001:db8:0:2::/64` es intra-área y en pantalla aparece como **`O`**, no como `OI`. El `OI` sólo aparece cuando la ruta viene de otra área. La salida del original muestra `OI` por costumbre de las topologías multi-área; si ves `O` en tu laboratorio, está perfecto.

> **El "ahá" de la verificación:** en IPv6, el next-hop de las rutas OSPFv3 es la **dirección link-local** del vecino, no su global. Por eso aprendiste el fe80:: en la sección 2 — sin link-local no hay vecino, y sin vecino no hay ruta. La link-local es el "número de interno" del router en ese enlace; la global es la "dirección pública" para alcanzarlo de afuera.

### 7.2. La batería completa (el ritual del nivel senior)

```text
show ipv6 ospf neighbor          → ¿FULL? ¿DR/BDR?
show ipv6 ospf interface Gi0/0   → área, timers, costo, tipo de red, instance
show ipv6 route ospf             → las rutas O/OI con next-hop link-local
show ipv6 protocols              → el resumen del proceso (RID, áreas, sources)
debug ipv6 ospf adj              → el útimo recurso (vecindades en vivo)
```

Este bloque es la lista de comandos que se corren en orden cuando hay que diagnosticar. Cada línea tiene el comando a la izquierda y, después de la flecha `→`, la pregunta que ese comando responde. Se lee como una checklist, de arriba hacia abajo, de lo más general a lo más específico.

Línea por línea, y qué mirar en pantalla:

- **`show ipv6 ospf neighbor`:** la primera pregunta siempre. Buscás `FULL` y el estado del DR/BDR. Si el vecino no aparece, el problema es de área, instance o link-local. Si aparece en un estado intermedio, el problema es de timers o de MTU.
- **`show ipv6 ospf interface Gi0/0`:** el detalle de una interfaz. Te dice en qué **área** está, los **timers** (Hello y Dead), el **costo**, el **tipo de red** (broadcast, point-to-point) y el **instance**. Es el comando que confirma si la interfaz entró al proceso y con qué parámetros. Si acá el área no es la que esperabas, no busques más.
- **`show ipv6 route ospf`:** las rutas que OSPF puso en la tabla, con sus códigos `O` y `OI`, su costo y su next-hop link-local. Si el vecino está en Full pero acá no hay rutas, el problema está en el anuncio (un prefijo que no se generó, un LSA tipo 9 que falta), no en la vecindad.
- **`show ipv6 protocols`:** el resumen de todos los protocolos de enrutamiento IPv6 activos, con el RID, las áreas y las interfaces que participan de cada uno. Es el comando que te dice de un vistazo si el proceso existe, si tiene RID y cuántas interfaces entraron.
- **`debug ipv6 ospf adj`:** el último recurso. Muestra en vivo el ida y vuelta de los saludos y de la formación de vecindad. Es útil y es peligroso: en un router con tráfico, llena la pantalla y consume CPU. Se usa en laboratorio o en una ventana muy corta, y se apaga con `undebug all`.

(El original dice "útimo"; es "último". Lo dejamos anotado para que no se te escape.)

Los **timers** que muestra el segundo comando son los dos números de siempre: el **Hello** (cada cuánto saluda) y el **Dead** (cuánto espera antes de declarar muerto al vecino). Y el **tipo de red** es la forma en que OSPF trata el medio: `BROADCAST` en Ethernet, `POINT_TO_POINT` en un enlace dedicado. En broadcast hay elección de DR/BDR; en point-to-point no hace falta.

### 7.3. El orden de lectura cuando algo no anda

Con los cinco comandos de arriba, el diagnóstico se ordena solo. Esta es la secuencia que conviene memorizar:

1. **¿El proceso existe y tiene RID?** `show ipv6 protocols`. Si el proceso no está o no tiene RID, nada de lo demás importa.
2. **¿La interfaz entró al proceso, en el área correcta, con el instance correcto?** `show ipv6 ospf interface`. Acá se caen la mitad de los problemas.
3. **¿El vecino llegó a Full?** `show ipv6 ospf neighbor`. Si no, el problema es de coincidencia entre los dos extremos (capítulo 9).
4. **¿La ruta aparece?** `show ipv6 route ospf`. Si el vecino está en Full y la ruta no está, el problema es el anuncio del prefijo.
5. **¿El paquete llega?** Un `ping` a la dirección global del otro extremo, con `-S` para elegir la interfaz de salida si hace falta.

Cada paso tiene un comando y una respuesta binaria: sí o no. Eso es lo que hace que el diagnóstico sea rápido: no se trata de "probar cosas", se trata de descartar capas en orden.

### Resumen

- `show ipv6 ospf neighbor` es el primer comando: buscás `FULL` y nada más.
- En el vecino, cada columna responde una pregunta: quién es, su prioridad, su estado, cuánto le queda de vida, su interface ID y por qué interfaz lo ves.
- `show ipv6 route ospf` muestra las rutas `O` y `OI` con su AD (110), su costo y un next-hop link-local.
- La batería completa es neighbor, interface, route, protocols y, como último recurso, debug.
- El diagnóstico se hace por capas: proceso, interfaz, vecindad, ruta y ping.

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

Este bloque es la configuración de un router **de doble pila** con un solo proceso OSPFv3. Se lee en dos mitades: la primera, el proceso con sus dos familias; la segunda, la interfaz con sus dos direcciones y sus dos activaciones.

Primera mitad, el proceso:

- **`router ospfv3 1`** entra al proceso. Fijate en la diferencia de nombre: es `ospfv3`, no `ospf`. Ese `v3` en el comando es el que habilita el modo multi-familia.
- **`router-id 1.1.1.1`** es el RID, uno solo para las dos familias. Ese es uno de los beneficios: un solo nombre para todo el router.
- **`address-family ipv6 unicast`** abre el bloque de configuración de IPv6. `unicast` significa "tráfico normal, de uno a uno" (lo contrario de multicast).
- **`exit-address-family`** cierra ese bloque. Es obligatorio: si no lo ponés, los comandos siguientes se interpretan dentro de la familia anterior.
- **`address-family ipv4 unicast`** y su `exit-address-family` hacen lo mismo para IPv4. Los dos bloques están vacíos porque en este ejemplo no hay nada que ajustar dentro de cada familia; existen para declarar que el proceso sirve a las dos.

Segunda mitad, la interfaz:

- **`ipv6 address 2001:db8:0:1::1/64`** y **`ip address 10.0.0.1 255.255.255.252`** le dan a la misma interfaz una dirección de cada familia. Eso es la doble pila: un cable, dos protocolos.
- **`ospfv3 1 ipv6 area 0`** activa el proceso 1 para IPv6 en el área 0. Notá que el comando es `ospfv3` (con `v3`) y que ahora la familia se declara en la interfaz, no en el proceso.
- **`ospfv3 1 ipv4 area 0`** hace lo mismo para IPv4. Las dos líneas conviven en la misma interfaz, igual que las dos direcciones.

> **El porqué (sube el telón):** OSPFv3 está diseñado "agnóstico de dirección", así que el MISMO proceso puede servir a IPv4 e IPv6 a la vez. En entornos de **doble pila** (IPv4 + IPv6 conviviendo), una sola config, un solo RID, un solo juego de áreas, y ambas tablas se pueblan. Es la forma moderna de hacer OSPF — y la que vas a ver en producción.

### 8.2. Los comandos de verificación para AF

```text
show ospfv3 neighbor
show ospfv3 ipv6 database
show ospfv3 ipv4 route ospf
```

Este bloque son los tres comandos de verificación del modo multi-familia. Se leen como una lista: los tres empiezan con `ospfv3` (sin `ipv6` adelante) porque el proceso es uno solo y hay que decirle de qué familia hablás.

Línea por línea:

- **`show ospfv3 neighbor`** lista los vecinos del proceso, con la familia indicada al costado. Si un vecino aparece en IPv6 y no en IPv4, el problema está en la activación de esa familia en la interfaz.
- **`show ospfv3 ipv6 database`** muestra la LSDB de IPv6: todos los LSA que ese router guardó para esa familia. Es el comando para verificar que los prefijos estén anunciados (los famosos tipos 8 y 9).
- **`show ospfv3 ipv4 route ospf`** muestra las rutas que el proceso aprendió para IPv4. Si tu versión de IOS no acepta esta variante, el mismo dato sale de `show ip route ospf` (IPv4) y de `show ipv6 route ospf` (IPv6), que son los comandos clásicos de toda la vida.

Los mismos rituales, con el prefijo `ospfv3` y la familia explícita. No hay magia nueva: es la misma máquina, con dos puertas (ipv4 / ipv6).

### 8.3. ¿AF o dos procesos? Cómo elegir

Las dos formas funcionan, y la elección es de diseño:

- **Dos procesos separados** (`router ospf 1` para IPv4 y `router ospf 1` + `ipv6 ospf 1 area 0` para IPv6) es lo que ves en la mayoría de las redes que migraron de a poco. Ventaja: cada familia se toca sin riesgo de romper la otra. Desventaja: dos configuraciones, dos RID potencialmente distintos, dos juegos de áreas.
- **Un proceso con address families** (`router ospfv3 1`) es lo moderno y lo que aparece en los exámenes actuales. Ventaja: un solo RID, un solo juego de áreas, una sola política. Desventaja: un error en el proceso afecta a las dos familias a la vez.

Regla práctica: si estás armando una red nueva de doble pila, AF. Si estás manteniendo una red vieja que ya tiene OSPFv2 andando, no la toques: agregá OSPFv3 al lado y conviví.

> **Cuidado con el nombre del comando:** `router ospf 1` (sin `v3`) es el proceso clásico, donde el área se declara por interfaz con `ipv6 ospf`. `router ospfv3 1` (con `v3`) es el proceso multi-familia, donde el área se declara por interfaz con `ospfv3 1 ipv6 area 0`. Mezclar los dos nombres en el mismo router es una fuente de confusión clásica: elegí uno y sostenelo en todas las interfaces.

### Resumen

- Address family permite que un solo proceso OSPFv3 sirva IPv4 e IPv6 a la vez.
- Se configura con `router ospfv3 1`, dos bloques `address-family` y, por interfaz, `ospfv3 1 ipv6 area 0` y `ospfv3 1 ipv4 area 0`.
- La ventaja es un solo RID y un solo juego de áreas para las dos familias.
- La verificación usa los mismos comandos con el prefijo `ospfv3` y la familia explícita.
- Si la red ya tiene OSPFv2 andando, conviene agregar OSPFv3 al lado en lugar de reescribir todo.

---

## 9. Los 5 errores más comunes (diagnóstico)

| # | Error | Síntoma | Fix |
|---|-------|---------|-----|
| 1 | **Falta `ipv6 unicast-routing`** | IPv6 ni enruta ni OSPFv3 arranca | `ipv6 unicast-routing` global, PUNTO |
| 2 | **Falta `router-id`** | OSPFv3 no levanta ("Router ID is not configured") | Configurá `router-id X.X.X.X` antes de activar las interfaces |
| 3 | **Link-local ausente** (interfaz sin IPv6) | No hay Hells, vecino Down | Toda interfaz con `ipv6 address` genera su fe80:: automáticamente; sin IPv6 no hay vecino |
| 4 | **Instance distinto / área distinta** | Hells que se cruzan y no forman vecindad | Misma `area` y mismo `instance` en ambos extremos |
| 5 | **Confundir v2 con v3** (`network` en v3) | Comando no existe / interfaz fuera del proceso | En v3 la config es por interfaz: `ipv6 ospf 1 area 0`, no `network` |

Esta tabla es el catálogo de las cinco fallas que explican casi todo. Tiene cuatro columnas: el **número** del error, el **error** en sí, el **síntoma** que ves en pantalla y el **fix**, o sea el arreglo. Se lee de izquierda a derecha, y en la práctica se lee al revés: empezás por el síntoma, buscás la fila y te llevás la causa.

Fila por fila:

1. **Falta `ipv6 unicast-routing`.** El router tiene direcciones pero no reenvía. Síntoma: no hay rutas, no hay vecinos, no hay ping. El fix es una línea global, y la palabra PUNTO del original es en serio: sin eso no hay nada que hacer.
2. **Falta `router-id`.** En un router sin IPv4, OSPFv3 no arranca y el log dice "Router ID is not configured". El fix es configurarlo **antes** de activar las interfaces, porque si activás primero vas a ver el proceso caerse y no vas a saber por qué.
3. **Link-local ausente.** Pasa cuando la interfaz no tiene IPv6 (te olvidaste del `ipv6 address`, o la interfaz está apagada). Sin IPv6 no se genera la link-local, y sin link-local no hay Hellos. El fix es darle una dirección a la interfaz, y la link-local aparece sola.
4. **Instance distinto o área distinta.** Los dos routers se mandan Hellos, se ven, y no se aceptan. Síntoma: el vecino no aparece, o aparece y desaparece. El fix es que `area` e `instance` coincidan en los dos extremos.
5. **Confundir v2 con v3.** Escribir `network 2001:db8::/64 area 0` en OSPFv3. El comando no existe (o no hace lo que creés) y la interfaz queda fuera del proceso. El fix es cambiar el enfoque: en v3 se activa por interfaz con `ipv6 ospf 1 area 0`.

> **El caso #1 es el más traicionero:** sin `ipv6 unicast-routing`, el router NO REENVÍA paquetes IPv6: ni rutas propias, ni vecinos, ni ping de un lado al otro. Es el equivalente IPv6 de "el chip de enrutamiento apagado". Se configura una sola vez por router y te olvidas… hasta que migrás una config y no está.

Los otros cuatro tienen algo en común: **son problemas de coincidencia**. Dos extremos que no comparten área, instance, timers o estado de IPv6 no se vuelven vecinos, y el protocolo no tiene forma de "negociar" la diferencia. OSPF no transa: si algo no coincide, no hay vecindad, y el síntoma siempre es el mismo (el vecino no está o no avanza).

### 9.1. El método, en tres preguntas

Cuando algo no anda, no empieces a cambiar configuración al azar. Hacé estas tres preguntas, en este orden:

1. **¿La interfaz tiene IPv6 y link-local?** `show ipv6 interface brief`. Si falta, el problema es de direccionamiento, no de OSPF.
2. **¿La interfaz está en el proceso, en el área y con el instance correctos?** `show ipv6 ospf interface`. Si no está, el problema es la activación.
3. **¿Los dos extremos coinciden en todo lo que se compara?** Área, instance, timers, tipo de red. Si algo no coincide, la vecindad no cierra y el `show ipv6 ospf neighbor` te lo muestra como ausencia o como estado clavado.

Ninguna de las tres requiere adivinar: cada una tiene un comando que la responde. Y si las tres dan bien, entonces el problema está más arriba: el prefijo no se está anunciando, o algo lo está filtrando.

### Resumen

- Los cinco errores clásicos son: falta `ipv6 unicast-routing`, falta `router-id`, falta link-local, instance o área distintos, y confundir la sintaxis de v2 con la de v3.
- El más traicionero es el primero: sin reenvío IPv6 no hay nada, ni siquiera ping.
- Los otros cuatro son problemas de coincidencia entre los dos extremos.
- El método de diagnóstico son tres preguntas: ¿hay IPv6?, ¿está en el proceso?, ¿coinciden los extremos?

---

## 10. La hoja de ruta: OSPFv3 en el mundo real

### 10.1. ¿Cuándo aparece OSPFv3 en la calle?

| Escenario | Por qué OSPFv3 |
|-----------|----------------|
| Redes nuevas enteras en IPv6 | El protocolo pensado para el futuro: único camino NAT-free |
| Doble pila (IPv4+IPv6 juntos) | AF en un solo proceso (sección 8) |
| Grandes proveedores (ISP) | IS-IS convive, pero OSPFv3 es estándar abierto |
| Empresas con direccionamiento IPv6 | La red interna ya no puede esperar más |

Esta tabla responde la pregunta "¿esto se usa o es de libro?". Tiene dos columnas: el **escenario** y **por qué** ahí aparece OSPFv3. Se lee como una lista de casos, y cada fila es un tipo de red distinta.

Fila por fila:

- **Redes nuevas enteras en IPv6.** Cuando no hay IPv4 que heredar, no hay razón para usar OSPFv2. OSPFv3 es el camino directo y sin NAT, que es la razón por la que IPv6 existe.
- **Doble pila.** Es el caso más común hoy: la empresa tiene IPv4 e IPv6 al mismo tiempo, y con address families un solo proceso cubre las dos. Es el escenario del capítulo 8.
- **Grandes proveedores (ISP).** En el backbone de un proveedor convive **IS-IS** (*Intermediate System to Intermediate System*, el protocolo de estado de enlace que usan muchas operadoras), pero OSPFv3 tiene la ventaja de ser estándar abierto y de estar en todos los equipos.
- **Empresas con direccionamiento IPv6.** Cuando la red interna ya tiene IPv6 (por crecimiento, por clientes, por regulación), OSPFv3 es la forma de enrutarlo.

### 10.2. La transición no es binaria

No es "todos IPv6 mañana": es **doble pila** mientras migra. Y en la doble pila, OSPFv2 (o AF ipv4) y OSPFv3 (o AF ipv6) conviven: el tráfico IPv4 sigue su camino, el IPv6 el suyo, y las tablas se resuelven por separado. El día que IPv4 se apague, OSPFv2 se retira y queda v3 solo (o el AF ipv6). Por eso los dos temas (OSPF y OSPFv3/IPv6) son complementarios, no opcionales.

Esa convivencia tiene una consecuencia práctica que conviene tener presente: **un problema en una familia no se ve en la otra**. Si el ping por IPv4 funciona y por IPv6 no, no es "la red" la que está mal: es una de las dos pilas. Y como las tablas son separadas, el diagnóstico también lo es.

> **La frase para el examen y para la vida:** "OSPFv3 no es OSPFv2 con IPs más largas: es el protocolo de estado de enlace **rediseñado para ser independiente del tipo de dirección**, y por eso puede servir a IPv4 y IPv6 a la vez." Si podés decir eso con seguridad, ya entendiste la arquitectura.

### Resumen

- OSPFv3 aparece en redes nuevas de IPv6, en redes de doble pila, en proveedores y en empresas que ya direccionan IPv6.
- La transición real es doble pila: las dos familias conviven durante años.
- En doble pila, cada familia tiene su tabla y su diagnóstico por separado.
- La idea que hay que poder explicar: OSPFv3 es independiente del tipo de dirección, y por eso sirve a las dos familias.

---

## 11. Comprobá lo que aprendiste

Ocho preguntas. Tapá la respuesta, contestá en voz alta y recién después compará.

**1. ¿Cuál es la diferencia de filosofía entre OSPFv2 y OSPFv3?**

**Ver respuesta:** OSPFv2 tenía las direcciones "pegadas" al protocolo (los LSA llevaban IPs IPv4 adentro). OSPFv3 se rediseñó **agnóstico de dirección**: el mapa de routers (T1/T2, sin IPs) y el mapa de prefijos (T8/T9) van separados. Eso permite un solo proceso sirviendo IPv4 e IPv6 (address families) y cambios de prefijo sin regenerar todo el SPF. Dicho en una frase: v2 era "protocolo + direcciones en el mismo paquete"; v3 separó el protocolo de las direcciones.

**2. ¿Qué dirección usan los Hells y las vecindades OSPFv3?**

**Ver respuesta:** La **link-local** (fe80::/10) de cada interfaz. Por eso el next-hop de las rutas OSPFv3 es siempre una direccion fe80::, y por eso sin IPv6 activa en la interfaz no hay vecino. (El original escribe "direccion" sin tilde; es "dirección".) La razón de fondo: la global puede cambiar con una renumeración, la link-local no.

**3. ¿Qué pasa si no configurás `router-id` en OSPFv3?**

**Ver respuesta:** OSPFv3 NO levanta y te lo dice: "Router ID is not configured". A diferencia de v2 (que elegía solo), en v3 el RID es obligatorio (igual de 32 bits). Configurarlo siempre explícito, como en v2. Y si lo cambiás después, acordate de reiniciar el proceso: el RID se toma al arrancar.

**4. ¿Qué comando habilita el reenvío IPv6 en el router y por qué es crítico?**

**Ver respuesta:** `ipv6 unicast-routing` (global). Sin él, el router no reenvía paquetes IPv6: no hay rutas, no hay vecinos OSPFv3, no hay ping. Es la llave de encendido del enrutamiento IPv6, se configura una sola vez por router y es el error número 1 de todos los laboratorios.

**5. ¿Cómo se configura OSPFv3 (vs el `network` de v2)?**

**Ver respuesta:** Por interfaz: `ipv6 ospf 1 area 0` sobre cada interfaz que participa (más la loopback). No hay wildcard ni máscara inversa: el proceso y el área se aplican directamente en la interfaz. Incluso se puede activar v4/v6 en la misma interfaz con `ospfv3 1 ipv4 area 0` / `ospfv3 1 ipv6 area 0`.

**6. ¿Qué LSA son nuevos en OSPFv3 y qué resuelven?**

**Ver respuesta:** El tipo 8 (prefijos link-local) y el tipo 9 (intra-area-prefix). El T9 separa "los prefijos de una interfaz" del T1 que describe la topología: así cambiar un prefijo solo regenera T9, no todo el árbol SPF. Es la razón por la que OSPFv3 aguanta una renumeración sin que la red se entere.

**7. ¿Qué es la doble pila en el contexto OSPF?**

**Ver respuesta:** IPv4 e IPv6 conviviendo en el mismo router y la misma red: OSPFv2 (o AF ipv4) llena la tabla IPv4 y OSPFv3 (o AF ipv6) la de IPv6. Dos procesos (o dos familias de un mismo proceso) independientes que no comparten LSDB. Es el estado normal de las redes de hoy, no una etapa de transición pasajera.

**8. ¿Por qué el next-hop de una ruta OSPFv3 es fe80:: y no la dirección global?**

**Ver respuesta:** Porque la vecindad se mantiene por link-local: el vecino "vive" en su fe80:: dentro de ese enlace. La global no es necesaria para el forwarding local — la link-local es suficiente y más estable (no cambia si se renumera la global). Además, una interfaz puede tener varias globales: la link-local es la única que siempre está.

Si contestaste bien la 1, la 2 y la 6, ya tenés el manual entero: la separación entre topología y direcciones es el corazón del tema, y todo lo demás (link-local, LSA 8/9, address families) sale de ahí.

### Resumen

- Las preguntas cubren filosofía, link-local, Router ID, reenvío IPv6, configuración, LSA nuevos, doble pila y next-hops.
- Las tres que resumen el manual son la 1 (la separación topología/direcciones), la 2 (link-local) y la 6 (LSA 8 y 9).
- Casi todas las respuestas se reducen a una idea: OSPFv3 separó el protocolo de las direcciones.
- Si dudás, volvé al capítulo del tema antes que memorizar la respuesta.

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

Esta tabla es el diccionario del manual. Tiene dos columnas: el **término** y **qué es**, en una línea. Los primeros cinco son los que aparecen en cualquier examen; los últimos son los que ves cuando mirás un router de verdad.

Cómo usarla: si en un capítulo te cruzás con una palabra que no recordás, buscala acá antes de volver atrás. Y si un término no lo podés explicar con tus palabras, volvé al capítulo donde se usa: el glosario es un atajo de repaso, no un reemplazo de la explicación.

Una aclaración sobre la fila de **Address family**: "familia de direcciones" no es un tipo de dirección, es la forma en que un proceso declara a qué protocolo sirve. Por eso un mismo proceso puede tener dos familias y, en cambio, una interfaz tiene una link-local y una o varias globales. Son dos ejes distintos, y confundirlos es el error conceptual más común del capítulo 8.

### Resumen

- El glosario es el diccionario del manual: término y definición en una línea.
- Los términos de examen son IPv6, link-local, global, OSPFv3 y address family.
- Tipo 8 y tipo 9 son los LSA nuevos, y el Router ID es obligatorio en v3.
- Si no podés explicar un término con tus palabras, volvé al capítulo donde aparece.

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

Leé esta lista como el índice al revés: cada punto condensa un capítulo. Si te llevás uno solo, llevate el 4: la separación entre el mapa de routers y el mapa de prefijos es la razón de existir de OSPFv3. Todo lo demás (la config por interfaz, la link-local como next-hop, el instance, las address families) es consecuencia de esa decisión.

Y si te llevás dos, llevate también el 10: los dos errores que se comen la mitad de los laboratorios son de configuración, no de protocolo. Un router con `ipv6 unicast-routing` y `router-id` explícito ya tiene el 80 % del trabajo hecho.

### Resumen

- OSPFv3 es el mismo OSPF de estado de enlace, adaptado a direcciones de 128 bits y separado de ellas.
- La dirección IPv6 se abrevia con dos reglas (`::` una sola vez) y su prefijo se lee con la barra.
- La link-local es la base de la vecindad y del next-hop; sin ella no hay protocolo.
- El RID es de 32 bits y obligatorio; la configuración es por interfaz, no con `network`.
- Los dos errores campeones son la falta de `ipv6 unicast-routing` y la falta de `router-id`.

---

> **Fuente:** Documentación propia basada en RFC 2740 (OSPFv3, reemplazada por RFC 5340), RFC 4291 (IPv6 addressing), CCNA 200-301 Official Cert Guide (W. Odom), Cisco IOS Configuration Guides y material educativo de redes.

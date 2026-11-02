# 09. Direcciones IP y Subredes

---

## Índice

- [El problema que resuelven las direcciones IP](#1-el-problema-que-resuelven-las-direcciones-ip)
- [Binario y hexadecimal: las herramientas](#2-binario-y-hexadecimal-las-herramientas)
- [La anatomía de una dirección IPv4: red + host](#3-la-anatomía-de-una-dirección-ipv4-red--host)
- [La máscara de subred](#4-la-máscara-de-subred)
- [Las clases de direcciones: el legado](#5-las-clases-de-direcciones-el-legado)
- [Direcciones especiales y privadas](#6-direcciones-especiales-y-privadas)
- [Dirección de red y dirección de broadcast: los dos bordes](#7-dirección-de-red-y-dirección-de-broadcast-los-dos-bordes)
- [Subredes: por qué dividir y cómo se hace](#8-subredes-por-qué-dividir-y-cómo-se-hace)
- [La tabla de máscaras completa](#9-la-tabla-de-máscaras-completa)
- [El cálculo práctico en 4 pasos](#10-el-cálculo-práctico-en-4-pasos)
- [IPv6: lo que tenés que saber](#11-ipv6-lo-que-tenés-que-saber)
- [DHCP: de dónde sale tu IP](#12-dhcp-de-dónde-sale-tu-ip)
- [La resolución de nombres: DNS](#13-la-resolución-de-nombres-dns)
- [Tu IP en la práctica](#14-tu-ip-en-la-práctica)
- [Comprobá lo que aprendiste](#15-comprobá-lo-que-aprendiste)
- [Glosario](#16-glosario)
- [Resumen en 10 puntos](#17-resumen-en-10-puntos)

---

Este es el capítulo más técnico de la primera sección y el que más gente abandona, casi nunca por dificultad sino por el orden en que se explican las cosas. Acá cada idea va así: **qué problema resuelve**, una **analogía de la vida diaria** (la calle, el edificio, el departamento) y al final la **definición precisa** con la cuenta paso a paso. Todas las cuentas se hacen a mano: potencias de dos, restas contra 256 y múltiplos.

### Resumen

- Este es el capítulo más técnico de la sección y el que más se abandona: el problema no es la dificultad, es el orden en que se explican las cosas.
- Cada concepto se presenta en tres pasos: el problema que resuelve, una analogía de la vida diaria y la definición precisa con la cuenta hecha.
- Todas las cuentas se hacen a mano, y al final del capítulo hay un cuestionario con las respuestas explicadas.

---

## 1. El problema que resuelven las direcciones IP

### 1.1. El sistema de direcciones del correo

Pensá en el correo postal: para que una carta llegue, no alcanza con escribirle al "vecino de la casa amarilla". Necesitás un sistema de direcciones que TODOS respeten: calle, número, ciudad, país. Sin ese sistema, los carteros del mundo no podrían hacer su trabajo — cada uno repartiría a su manera y la carta se perdería siempre.

**La analogía:** el cartero. No conoce a las personas, conoce direcciones. Si le decís "dale esto a Marcela", no puede hacer nada. Si le decís "Calle del Sol 1234, 3º B", llega solo. Nadie le explica quién es Marcela: la dirección alcanza.

Internet es exactamente igual, pero a escala planetaria: hay **miles de millones de dispositivos** conectados entre sí, y cada uno necesita una dirección única para que los datos lleguen a destino sin confundirse.

Esa dirección es la **dirección IP** (*Internet Protocol* address, o sea: la dirección del Protocolo de Internet).

> **Idea central de este manual:** cada dispositivo conectado a una red tiene una dirección IP: un número único que identifica *dónde está* ese dispositivo para poder mandarle datos. Y como hay muchísimos dispositivos, esas direcciones se organizan en **redes** y se subdividen en **subredes** — como las calles, cuadras y manzanas de una ciudad.

Fijate en la palabra "dónde": la dirección IP no dice *quién* sos, dice dónde estás parado.

### 1.2. Qué es exactamente una dirección IP

Hay una precisión fina que separa a los que entienden de los que memorizan:

> **Una dirección IP no identifica a un dispositivo: identifica a una *interfaz* de red.**

Si tu notebook tiene cable Ethernet y Wi-Fi, tiene DOS direcciones IP — una por cada interfaz. Un servidor con dos placas de red tiene dos IPs. La dirección IP le dice a la red: "los datos para esta dirección se entregan en esta entrada".

**La analogía:** un edificio con dos puertas, una sobre la calle y otra sobre el pasaje. El edificio es uno, pero tiene dos direcciones: la dirección nombra la **puerta**, no el edificio entero.

**Por qué te importa en la práctica:** cuando en tu compu ves dos IPs distintas, no es un error: tenés dos puertas y cada una está en una red distinta (sección 14).

### 1.3. El tamaño del problema

Hoy conviven dos versiones del protocolo IP:

| Versión | Longitud de la dirección | Cantidad teórica de direcciones | Formato |
|---------|--------------------------|--------------------------------|---------|
| **IPv4** | 32 bits | 2³² = 4.294.967.296 (≈ 4.300 millones) | Decimal punteado: `192.168.1.10` |
| **IPv6** | 128 bits | 2¹²⁸ ≈ 3,4 × 10³⁸ | Hexadecimal con dos puntos: `2001:0db8::1` |

**Qué significa cada columna:** **versión** es el nombre del protocolo (**IP** = *Internet Protocol*; v4 y v6 no son compatibles entre sí y no existió un IPv5); **longitud** es cuántos **bits** mide (un **bit** es un 0 o un 1, la unidad mínima de información); **cantidad teórica** son las combinaciones posibles, o sea 2 elevado a los bits, porque cada bit tiene 2 valores; y **formato** es cómo se escribe para que lo lea un humano: cuatro números separados por puntos, u ocho grupos con letras separados por `:`.

**Qué significa cada fila, y de dónde sale el número:**

- **IPv4:** 32 bits → 2³². Para que veas que no es magia: 2¹⁰ = 1.024 (≈ mil), 2²⁰ ≈ un millón y 2³⁰ ≈ mil millones. Entonces 2³² = 2³⁰ × 2² = 1.073.741.824 × 4 = **4.294.967.296**. Redondeando, 4.300 millones.
- **IPv6:** 128 bits → 2¹²⁸ ≈ **3,4 × 10³⁸**, o sea un 34 con 37 ceros detrás. Es tantas veces más grande que IPv4 que la comparación deja de tener sentido intuitivo.

Ojo con una trampa que aparece en todos lados: el total teórico no es el total utilizable. Hay direcciones reservadas (privadas, de prueba, de multicast, de broadcast), así que el número real de direcciones públicas utilizables es menor.

**Chequeo que podés hacer vos:** contá los números separados por puntos de cualquier IP de tu casa. Son cuatro, y cada uno se llama **octeto** porque son 8 bits: 4 × 8 = 32.

### 1.4. Por qué IPv4 es "la madre" de todo

Casi todo lo que vas a configurar en tu vida profesional (y en tu casa) es IPv4: `192.168.1.1`, `10.0.0.5`, `172.16.0.24`… Por eso este manual se centra en IPv4 y deja IPv6 para la sección 11: primero hay que dominar el sistema que está en la calle hoy.

Hay una razón práctica para ese orden: todo lo que aprendas de máscaras y subredes en IPv4 se traduce casi uno a uno a IPv6, y hacerlo con 32 bits es mucho más cómodo que con 128.

### Resumen

- Una dirección IP es el domicilio de un dispositivo en la red: dice *dónde* está, no *quién* es, igual que la dirección de una carta.
- Una IP identifica una **interfaz**, no un equipo: la notebook con Wi-Fi y cable tiene dos IPs, como un edificio con dos puertas.
- IPv4 mide 32 bits (2³² ≈ 4.300 millones) y se escribe en decimal punteado; IPv6 mide 128 bits, en hexadecimal con dos puntos, y existe porque IPv4 se agotó.

---

## 2. Binario y hexadecimal: las herramientas

### 2.1. Las computadoras no cuentan como nosotros

La dirección IP es un número binario de 32 bits. Los humanos lo escribimos en decimal para poder leerlo, pero la máquina lo ve como una tira de ceros y unos. Si no sabés leer binario, vas a memorizar reglas sin entender por qué existen. Con tabla de potencias y un ejemplo, se aprende en cinco minutos.

**El problema que resuelve el binario:** `168` y `10101000` son el mismo dato escrito de dos maneras. Cuando la red decide si una dirección es de su red o de otra, no compara decimales: compara bit por bit.

**La analogía:** una bandeja de ocho lugares numerados del 128 al 1. Cada lugar está ocupado (un `1`) o vacío (un `0`), y el número decimal del octeto es la suma de lo que hay en los lugares ocupados.

**La definición:** un **octeto** es un grupo de 8 bits, y por eso puede representar 256 valores distintos (2⁸), del 0 al 255. Una dirección IPv4 son cuatro octetos: 4 × 8 = 32 bits.

Un octeto (8 bits) representa las potencias de 2:

```
 128   64   32   16    8    4    2    1   ← valor de cada posición
  1    0    1    0    1    0    0    0   ← los bits
─────────────────────────────────────────
 128 + 0  + 32 + 0  + 8  + 0  + 0  + 0  = 168
```

**Cómo leer este bloque:** la primera línea son los valores de cada posición, que valen el doble que la de su derecha (1, 2, 4, 8, 16, 32, 64, 128), así que el bit "más importante" queda a la izquierda; la segunda son los bits del octeto (acá hay `1` en 128, 32 y 8); la tercera es una raya; y la cuarta es la suma de las posiciones con `1`.

**Regla:** sumá el valor de las posiciones donde hay un `1`.

**Qué tenés que ver vos:** si volvés a mirar el mismo octeto escrito como `168`, ahora sabés que ese número no es un capricho: es la suma 128 + 32 + 8. Y que `168` no podría ser `268` porque el máximo posible, con los ocho lugares ocupados, es 255.

**Chequeo que podés hacer vos:** sumá las potencias de la primera línea: 255. Ese es el techo de un octeto. Si un ejercicio te da un octeto mayor a 255, el ejercicio está mal escrito.

Ejemplo completo — la dirección `168.212.226.204` en binario:

```
168 = 10101000     128+32+8
212 = 11010100     128+64+16+4
226 = 11100010     128+64+32+2
204 = 11001100     128+64+8+4

168.212.226.204 = 10101000.11010100.11100010.11001100
```

**Cómo leerlo:** cada línea convierte un octeto y muestra a la derecha qué potencias se sumaron; la última junta los cuatro octetos binarios en el mismo orden que tenían en decimal.

**Verificalo vos, línea por línea:** `168` = 128 + 32 + 8 → `10101000`; `212` = 128 + 64 + 16 + 4 → `11010100`; `226` = 128 + 64 + 32 + 2 → `11100010`; `204` = 128 + 64 + 8 + 4 → `11001100`. Las cuatro cierran.

> **Dato que ahorra años:** el valor máximo de un octeto es 255 (todos los bits en 1), y el mínimo es 0 (todos en 0). Por eso los octetos van de 0 a 255 — y por eso una IP jamás tiene un octeto mayor a 255.

### 2.2. De binario a decimal en 3 pasos

1. Escribí las potencias sobre los bits: `128 64 32 16 8 4 2 1`.
2. Marcá las posiciones donde hay un `1`.
3. Sumá los valores marcados.

**El truco:** de izquierda a derecha, preguntá "¿me alcanza con este número?". Si el octeto es mayor o igual a 128, ponés un `1` y te quedás con el resto; si es menor, ponés `0` y seguís. Con `200`: 200 ≥ 128 → `1`, quedan 72; 72 ≥ 64 → `1`, quedan 8; salteás 32 y 16; 8 ≥ 8 → `1` → `11001000`.

Hacelo vos con `11000000`:

```
 128 64 32 16 8 4 2 1
  1   1  0  0 0 0 0 0  → 128 + 64 = 192
```

**Cómo leerlo:** arriba están las potencias; abajo, el byte con dos unos al principio. A la derecha, la suma de las dos posiciones ocupadas: 128 + 64 = 192. Ese `192` no es un número cualquiera: es el que vas a ver todo el tiempo en las máscaras (sección 9) y en las direcciones de red.

### 2.3. Hexadecimal: el formato de IPv6

IPv6 es tan largo que ni en decimal se puede manejar: usa **hexadecimal** (base 16). Los dígitos son `0 1 2 3 4 5 6 7 8 9 A B C D E F` (donde A=10, B=11, …, F=15), y un grupo de **4 bits** se escribe como UN dígito hexadecimal:

```
1010 = A       1111 = F
0011 = 3       0001 = 1
```

**Cómo leerlo:** a la izquierda, cuatro bits; a la derecha, el único dígito hexadecimal que los representa. Cuatro bits tienen 16 combinaciones, y por eso la base 16 entra justa: cada dígito hexadecimal es un cuarteto de bits.

**Lo que valen las dos líneas del bloque:** `1010` = 8 + 2 = 10 → `A`; `1111` = 15 → `F` (el máximo); `0011` = 3; `0001` = 1.

Por eso las direcciones IPv6 se ven raras: cada grupo de 4 dígitos hexadecimales representa 16 bits. No hace falta más que eso por ahora — lo vas a usar en la sección 11.

### Resumen

- Un **octeto** son 8 bits y vale entre 0 y 255; una dirección IPv4 son cuatro octetos, o sea 32 bits.
- Para pasar de binario a decimal sumás las potencias (128, 64, 32, 16, 8, 4, 2, 1) de las posiciones que tienen `1`; para el camino inverso restás de izquierda a derecha.
- El hexadecimal es base 16 y cada dígito resume exactamente 4 bits; por eso IPv6 lo usa en lugar del decimal.

---

## 3. La anatomía de una dirección IPv4: red + host

### 3.1. Las dos partes de toda dirección

**El problema que resuelve:** si cada dirección fuera solo un número suelto, un router tendría que saber dónde está cada uno de los 4.000 millones de dispositivos del planeta. Imposible de guardar y peor de actualizar. Partiendo la dirección en dos, el router solo necesita saber cómo llegar a la red, y el último equipo se encarga de encontrar al host exacto adentro.

**La analogía, que es la misma del correo pero con más niveles:** "Calle del Sol 1234, 3º B". La **calle** identifica la zona grande y es la parte de red; el **número del edificio** identifica el edificio dentro de la calle y, cuando la red es más fina, es el nivel de subred; el **departamento** es la puerta exacta adentro del edificio y ese es el host.

Cuanto más larga es la dirección, más niveles tiene: una casa se escribe "calle y número"; un departamento necesita "calle, número y piso". Cada nivel nuevo es un bit más de red, y cada bit de red achica la red. Eso es todo lo que hace una máscara.

**La definición:** toda dirección IPv4 tiene **dos partes**:

- La parte de **RED**: identifica la red (el "barrio" o la "manzana").
- La parte de **HOST**: identifica el dispositivo puntual *dentro* de esa red (la "casa").

`192.168.1.10` con máscara `255.255.255.0` significa: red `192.168.1` + host `.10`. El número que separa las dos partes NO lo dice la dirección: lo dice la **máscara de subred**, que viste por primera vez en el manual de modelos de red — acá la vamos a dominar.

> **Analogía del correo (la que no se te va a olvidar):**
> - La dirección IP es el **domicilio completo**: `Calle del Sol 1234`.
> - La parte de red es **la calle**: `Calle del Sol`.
> - La parte de host es **el número**: `1234`.
> - La máscara de subred es **la regla que dice qué parte es la calle y qué parte es el número**.

**Chequeo que podés hacer vos:** mirá `192.168.1.10/24` y contá los octetos `255` de la máscara: son tres, y esos son la red. No hace falta binario para ver dónde está el corte.

### 3.2. Por qué dividir en red + host

Porque si TODOS los dispositivos del planeta estuvieran en una sola red gigante, cada router tendría que saber el camino hasta cada uno de los 4.000 millones de dispositivos — imposible. Al dividir en redes, los routers solo necesitan saber **cómo llegar a la red**, y dentro de la red, el último equipo (el switch, el router local) se encarga de encontrar al host exacto.

**La analogía:** el repartidor de una ciudad no memoriza 4.000 millones de domicilios: sabe qué calles son de su zona y el resto se lo pasa a otros repartidores. Si abren una casa nueva en su zona, no necesita ningún mapa nuevo.

### 3.3. La notación del prefijo: /24

Acá aparece la segunda herramienta que asusta y que en realidad es una abreviatura. Mirá la tabla:

| Forma | Ejemplo |
|-------|---------|
| Decimal punteada | `255.255.255.0` |
| Prefijo (CIDR) | `192.168.1.0/24` |

**Qué significa cada fila:** **decimal punteada** es la máscara escrita como una dirección completa (`255.255.255.0`); **prefijo (CIDR)** es la misma máscara con una barra y la cantidad de bits de red (`/24`).

**Qué es CIDR:** *Classless Inter-Domain Routing* (enrutamiento entre dominios sin clases). Es el nombre que tiene la notación de barra justamente porque no depende de las clases A, B y C de la sección 5, sino de la cantidad de bits que quieras. Cuando alguien dice "CIDR", está hablando de esta barra.

El `/24` es **la cantidad de bits en 1 de la máscara**: 24 bits de red. `/8` = 8 bits de red, `/16` = 16, `/24` = 24. Cuanto más grande el número del prefijo, más chica la red.

**Por qué "más grande el número, más chica la red":** los bits son un recurso fijo de 32. Si 24 se usan para red, quedan 8 para hosts: 256 direcciones. Si usás 16 para red, quedan 16 para hosts: 65.536. Más bits de red = menos hosts por red, pero muchas más redes posibles.

**El chequeo rápido:** `255` en un octeto son ocho unos, así que contar los octetos en `255` y multiplicar por 8 te da el prefijo cuando la máscara es redonda: `255.255.255.0` → 24 → `/24`. Cuando no termina justo (`255.255.255.192`), hace falta la sección 4.

### Resumen

- Toda dirección IPv4 se parte en **red** (la calle) y **host** (el número del domicilio); el corte lo decide la máscara, no la dirección.
- Partir en red + host es lo que permite que los routers guarden redes y no dispositivos: nadie memoriza 4.000 millones de domicilios.
- `/24` (CIDR) es la misma cosa que `255.255.255.0` escrita como cantidad de bits en `1`, y contar octetos en `255` y multiplicar por 8 da el prefijo cuando la máscara es redonda.

---

## 4. La máscara de subred

### 4.1. Qué es

**El problema que resuelve:** la dirección sola no dice dónde termina la calle y dónde empieza el número. `192.168.1.10` podría ser "red `192` + host `168.1.10`" o "red `192.168.1` + host `10`, y las dos lecturas son válidas en abstracto. La máscara es la que saca la ambigüedad: es una segunda tira de 32 bits donde los `1` marcan lo que es red y los `0` marcan lo que es host.

**La analogía:** es la regla escrita en el pizarrón de la oficina de correos: "en este barrio, los primeros tres números de la dirección son la calle y el último es la casa". Sin esa regla, cada cartero podría cortar la dirección en otro lugar y el reparto sería un caos. La máscara es esa regla, escrita en binario para que la lean las máquinas.

> **Definición en una línea:** la máscara de subred es un número de 32 bits, igual de largo que la dirección IP, que marca con `1`s la parte de red y con `0`s la parte de host.

En binario, se ve así (para /24):

```
Dirección:  192.168.1.10  →  11000000.10101000.00000001.00001010
Máscara:    255.255.255.0 →  11111111.11111111.11111111.00000000
                              ↑ 24 bits en 1     ↑ 8 bits en 0
                              ←── parte de RED ──→  ← parte de HOST →
```

**Cómo leer este bloque:** la línea 1 es la IP y la línea 2 la máscara, cada una en decimal y en binario. La línea 3 marca los 24 unos y los 8 ceros de la máscara, y la 4 es la conclusión: los bits que caen debajo de un `1` son **red** (los tres primeros octetos) y los que caen debajo de un `0` son **host** (el último). Si alineás las dos tiras y bajás una vertical donde la máscara cambia de `1` a `0`, esa vertical es el corte: a la izquierda la calle, a la derecha el número. No hay que hacer ninguna cuenta, es mirar y separar.

**Regla de oro:** los `1` de la máscara son consecutivos y van primero. Nunca vas a ver una máscara "trucha" como `11101111...` — los unos van todos juntos al inicio, los ceros al final.

### 4.2. La trampa del 255

`255` es el número engañoso: en binario es `11111111`, ocho unos. Por eso:

- `255.0.0.0` = 8 unos = **/8** → red de 16 millones de hosts (gigantesca)
- `255.255.0.0` = 16 unos = **/16** → red grande
- `255.255.255.0` = 24 unos = **/24** → la red clásica de las casas y oficinas chicas
- `255.255.255.255` = 32 unos = **/32** → un único host (nada de red)

Para saber el prefijo, contá cuántos `1`s tiene la máscara en binario. Para saber la máscara a partir del prefijo, poné ese número de `1`s al principio y completá con `0`s.

**La trampa, explicada sin vueltas:** la tentación es leer `255.255.255.0` como "255 es el número grande, entonces la red es enorme". Es al revés: cada octeto en `255` se come 8 bits para la parte de red. `255.255.255.0` deja 8 bits para hosts (256 direcciones); `255.0.0.0` deja 24 (16 millones). La máscara **más generosa con los hosts es la que tiene menos 255**.

**La escalera de la máscara: la tabla que te ahorra todas las cuentas.** Cuando el prefijo no cae en un octeto entero, el octeto de la máscara toma uno de estos ocho valores, siempre los mismos. Memorizá esta escalera y podés resolver cualquier máscara sin calculadora:

| Bits en 1 en ese octeto | Octeto de la máscara | Tamaño del bloque |
|:---:|:---:|:---:|
| 1 | `128` | 128 |
| 2 | `192` | 64 |
| 3 | `224` | 32 |
| 4 | `240` | 16 |
| 5 | `248` | 8 |
| 6 | `252` | 4 |
| 7 | `254` | 2 |
| 8 | `255` | 1 |

**Cómo leer esta tabla:** la primera columna es cuántos unos lleva la máscara en ese octeto (un `/26` deja 2 bits ahí); la segunda es el número decimal de esos bits (2 bits = 128 + 64 = `192`); la tercera es cuántas direcciones abarca cada subred, o sea `256 − octeto`. Esa tercera columna es la que usás en las secciones 8 y 10 para armar los rangos.

**Cómo leerla fila por fila:** cada fila nueva suma la potencia siguiente y su bloque es la mitad del anterior. `128` es un solo uno; `192` = 128 + 64; `224` = 192 + 32; `240` = 224 + 16; `248` = 240 + 8; `252` = 248 + 4; `254` = 252 + 2; `255` = 254 + 1, el octeto entero en red. Con la primera fila y la regla de la suma tenés las ocho.

**La cuenta que hay que saber hacer en los dos sentidos:**

- **De bits a octeto:** sumá las potencias de izquierda a derecha. 4 bits = 128 + 64 + 32 + 16 = 240.
- **De octeto a bloque:** restá de 256. 256 − 240 = 16.
- **De bloque a bits:** preguntate cuántas veces entra 2 en el bloque. 16 = 2 × 2 × 2 × 2 → 4 bits. El bloque 1 es 8 bits, y el bloque 128 es 1 bit.

**Chequeo que podés hacer vos:** para cualquier fila de la escalera, `octeto + bloque = 256`. 128 + 128, 192 + 64, 224 + 32, 240 + 16, 248 + 8, 252 + 4, 254 + 2, 255 + 1. Si esa suma no da 256, te equivocaste en algún lado, siempre.

### 4.3. Otro truco: el octeto "interesante"

Cuando la máscara NO termina en un octeto entero (ej: `/26` = `255.255.255.192`, `/28` = `255.255.255.240`), el octeto donde aparecen el último `1` y los primeros `0` juntos se llama **octeto interesante**: es ahí donde se juega el cálculo de subredes. El resto de la máscara (los `255`) solo indica "este octeto es 100% red".

**Por qué se llama así, y por qué importa:** porque es el único octeto donde hay algo que decidir. Los octetos en `255` son todo red y los octetos en `0` son todo host: en ninguno de los dos hay nada que calcular. El único donde la dirección puede caer en el medio de un bloque es el interesante, y por eso todos los cálculos de la sección 10 se hacen ahí.

**Cómo encontrarlo en dos segundos:** recorré la máscara de izquierda a derecha y quedate con el primer octeto que no sea `255` **ni** `0`.

- `/24` = `255.255.255.0` → no hay octeto interesante (todos son 255 o 0). El cálculo es trivial: la red es la dirección con el último octeto en 0.
- `/26` = `255.255.255.192` → el cuarto octeto, que vale 192.
- `/20` = `255.255.240.0` → el tercero, que vale 240. El cuarto es 0, así que va entero de 0 a 255.
- `/12` = `255.240.0.0` → el segundo, que vale 240.

### Resumen

- La máscara es una segunda tira de 32 bits: `1` donde hay red, `0` donde hay host; siempre son unos consecutivos seguidos de ceros.
- `255` engaña: cuantos más `255` tiene la máscara, menos hosts entran, porque se come bits para la parte de red.
- La escalera `128, 192, 224, 240, 248, 252, 254, 255` con bloques `128, 64, 32, 16, 8, 4, 2, 1` resuelve cualquier máscara, y siempre se cumple `octeto + bloque = 256`.
- El **octeto interesante** es el primero que no es `255` ni `0`: el único lugar donde hay que calcular algo.

---

## 5. Las clases de direcciones: el legado

### 5.1. De dónde salen

Antes de que existiera CIDR (la notación `/24` de hoy), el espacio IPv4 estaba dividido en **clases fijas**: A, B, C (para redes de distinto tamaño), D (multicast) y E (reservada). Se reconocen por los **primeros bits del primer octeto**, o directamente por el rango del primer número.

**El problema que resolvían:** en los años ochenta hacía falta una manera rápida y sin ambigüedad de saber cuántos bits eran de red y cuántos de host, y la solución fue tallar el espacio en tres tamaños fijos y decidirlo mirando el primer número de la dirección: un router podía clasificar sin consultar ninguna tabla.

**La analogía:** es como si en una ciudad los edificios solo pudieran tener tres tamaños: casa, edificio de cuatro pisos y torre. A una familia de dos personas le dan la torre igual y a una empresa de 300 empleados la casa le queda chica: el molde es simple de administrar y pésimo para asignar.

| Clase | Primeros bits | Primer octeto | Tamaño de red | Tamaño de host | Direcciones por red | Uso |
|-------|:-------------:|---------------|---------------|----------------|--------------------:|-----|
| **A** | `0` | 1 – 126 | 8 bits (N) | 24 bits (H) | 16.777.216 | Redes gigantes (pocas, enormes) |
| **B** | `10` | 128 – 191 | 16 bits (N) | 16 bits (H) | 65.536 | Redes grandes |
| **C** | `110` | 192 – 223 | 24 bits (N) | 8 bits (H) | 256 | Redes chicas (las clásicas de casa/empresa) |
| **D** | `1110` | 224 – 239 | — | — | — | Multicast (grupos, no hosts) |
| **E** | `1111` | 240 – 255 | — | — | — | Reservada para experimentación |

**Cómo leer esta tabla:** cada columna es un dato de la clase y cada fila es una clase. **Primeros bits** son los bits con los que empieza la dirección (son los que definen la clase); **primer octeto** es el mismo dato en decimal, que es como lo mirás en la práctica; **tamaño de red** son los bits de red (`N` de *Network*) y **tamaño de host** los que quedan para equipos (`H` de *Host*); **direcciones por red** es 2 elevado a los bits de host; y **uso** es para qué estaba pensada. Las clases D y E no asignan hosts, por eso sus columnas de tamaños llevan una raya.

**Cómo leerla fila por fila:** la A empieza con `0` (en la práctica, primer octeto 1–126), tiene 8 bits de red y 24 de host: 2²⁴ = 16.777.216 direcciones. La B empieza con `10` (128–191), 16 y 16 bits: 2¹⁶ = 65.536. La C empieza con `110` (192–223), 24 y 8 bits: 2⁸ = 256, y es la clase de tu `192.168.1.x`. La D (`1110`, 224–239) es **multicast**: un paquete a un grupo de interesados, no a una máquina puntual. La E (`1111`, 240–255) estaba reservada para experimentación y nunca se usó para direcciones comunes.

Fijate que el 127 no aparece: **todo `127.x.x.x` es loopback** (la propia máquina).

Ahí hay un detalle que conviene decir claro, porque está en todos los libros y todos lo repiten mal: la clase A en teoría llega hasta el 127, pero el bloque `127` se reservó completo para loopback, así que en la práctica las direcciones de clase A asignables van del 1 al 126. El 0 también está reservado. Por eso la tabla dice 1 – 126.

> **Aviso honesto sobre esta tabla:** las clases están obsoletas desde 1993 y hoy nadie diseña una red "clase B". Si el material de estudio te pide clasificar direcciones, la tabla sirve; si te pide diseñar una red con clases, está enseñando algo que ya no se usa. La versión correcta y vigente es CIDR, con el prefijo `/n` que quieras.

### 5.2. La notación de letras: N, n, H, h

Una convención clásica para visualizar las partes:

| Clase | Estructura |
|-------|-----------|
| A | **N**.H.H.H (red de 1 octeto, host de 3) |
| B | **N**.N.H.H (red de 2 octetos, host de 2) |
| C | **N**.N.N.H (red de 3 octetos, host de 1) |

**Cómo leer esta tabla:** cada letra es un octeto de la dirección. La **N** mayúscula es un octeto de red, la **H** mayúscula es un octeto de host, y siempre hay cuatro letras porque una IPv4 tiene cuatro octetos: lo único que cambia es dónde está el corte. En clase A el primer octeto es red y los tres siguientes host; en B, dos y dos; en C, tres y uno. Es la tabla de clases dicha con letras.

Ejemplo clase C: en `192.168.1.10` la red es `192.168.1` y el host es `.10`. En clase B, `172.16.5.9` → red `172.16`, host `5.9`.

Los dos ejemplos se parten igual aunque el corte caiga en otro lugar: lo que queda a la izquierda es la red. Cuando empezás a ver las direcciones como cuatro cajitas y una raya en el medio, dejás de memorizar.

### 5.3. Por qué hoy se usa CIDR y no clases

Las clases eran un molde rígido: tu empresa tenía 300 dispositivos → clase B (65.536 direcciones) era demasiado, clase C (256) no alcanzaba. **Desperdicio o escasez, siempre.** Con CIDR se puede tener `192.168.1.0/25` (128 direcciones), `/26` (64), `/27` (32)… cualquier tamaño. Por eso las clases son historia, pero las seguís viendo en exámenes y material viejo — y porque la notación N/H viene de ahí.

> **Regla rápida para clasificar:** mirá solo el primer octeto. ¿1 a 126? Clase A. ¿128 a 191? B. ¿192 a 223? C. ¿224 a 239? D. ¿240+? E. 15 segundos, sin calculadora.

### Resumen

- Las clases A, B, C, D y E fueron la primera forma de decidir cuántos bits eran de red y cuántos de host: se reconocen por el primer octeto de la dirección.
- La notación `N.H.H.H` es la versión con letras de lo mismo: N es octeto de red, H es octeto de host, y siempre son cuatro letras.
- Hoy se usa CIDR porque las clases obligaban a elegir entre desperdiciar direcciones o no tener suficientes; sobreviven en exámenes y en la jerga.

---

## 6. Direcciones especiales y privadas

### 6.1. Las direcciones que NO se usan como host

**El problema que resuelven:** no todas las direcciones sirven para identificar una máquina. Algunas están reservadas para decir cosas como "yo mismo", "todos los de acá" o "no tengo dirección todavía", y si no las conocieras verías un `169.254.x.x` y pensarías que la red funciona bien.

**La analogía:** son las palabras que en el correo no son direcciones de nadie pero están en el sistema. "Apartado de correos" no es una casa, pero es una dirección válida. "A quien corresponda" no llega a nadie en particular: llega a todos. "Remitente desconocido" no es una dirección: es un aviso de que falta el dato.

| Dirección | Propósito |
|-----------|-----------|
| `0.0.0.0` | "Esta red de momento" — no se usa como destino; significa "cualquier red" en configuraciones |
| `127.0.0.0/8` | **Loopback**: siempre apunta a la propia máquina. `127.0.0.1` es "yo mismo" |
| `169.254.0.0/16` | **Link-local (APIPA)**: la IP que se pone sola el equipo cuando no consigue una por DHCP |
| `224.0.0.0/4` | **Multicast**: envío a un grupo, no a una dirección puntual |
| `255.255.255.255` | **Broadcast limitado**: llega a todas las interfaces de la red local |

**Cómo leer esta tabla:** la izquierda es el rango reservado (con prefijo, cuando es un rango entero) y la derecha el propósito. Fila por fila: `0.0.0.0` significa "cualquier red" o "esta red de momento" y no se usa como destino de un paquete; `127.0.0.0/8` es **loopback** (bucle local), un camino que no sale de tu máquina y vuelve a ella, con `127.0.0.1` como el "yo mismo" clásico; `169.254.0.0/16` es **link-local** o **APIPA** (*Automatic Private IP Addressing*), la que se autoasigna un equipo cuando pidió IP por DHCP y nadie contestó; `224.0.0.0/4` es **multicast**, un canal de radio donde hablás una vez y escuchan los suscritos; y `255.255.255.255` es **broadcast limitado**, el "grito al aire" que oyen todos los del mismo cable.

> **El dato que te salva un diagnóstico:** si tu notebook tiene una IP `169.254.x.x`, no es que haya "elegido" esa dirección: es que **el DHCP no le contestó** y se la autoasignó. Eso grita "problema de conexión con el servidor de IPs", no de tu placa.

**Chequeo que podés hacer vos:** buscá en tu configuración (sección 14) si tu IP empieza con `169.254`. Si sí, el problema no es la máscara ni el gateway: es que el equipo no está viendo el servidor DHCP. Ese solo dato te ahorra media hora de prueba y error.

### 6.2. Las direcciones privadas: el barrio cerrado

Hay tres rangos reservados para **redes privadas**: cualquiera puede usarlos adentro de su red, y los routers de internet **no los enrutan** (no salen al mundo). Gracias a ellos, todos los routers de casas del planeta usan `192.168.x.x` sin pisarse entre sí.

**El problema que resuelven:** con 4.300 millones de direcciones y más de 20.000 millones de dispositivos, el mundo se quedó sin números públicos. Las privadas resuelven eso: adentro de tu casa usás números que no significan nada para internet y el router los traduce al salir, así que tu vecino puede usar `192.168.1.0` sin pisarse con vos.

**La analogía:** el número de departamento adentro de un edificio. Hay un "1º A" en miles de edificios del país y no se confunden porque el cartero primero va al edificio y después busca el departamento; el router completa la dirección al sacarla a la calle pública.

| Rango | Notación CIDR | De dónde viene |
|-------|---------------|----------------|
| `10.0.0.0` – `10.255.255.255` | `10.0.0.0/8` | El clásico de redes empresariales grandes |
| `172.16.0.0` – `172.31.255.255` | `172.16.0.0/12` | Empresas medianas |
| `192.168.0.0` – `192.168.255.255` | `192.168.0.0/16` | El de las casas y oficinas chicas |

**Cómo leer esta tabla:** la primera columna es el rango que podés usar sin pedir permiso, la segunda el mismo rango en CIDR y la tercera el uso típico, que es costumbre y no regla. Fila por fila: el `/8` tiene 8 bits de red fijos (el `10`) y 24 de host → 2²⁴ = 16.777.216 direcciones; el `/12` tiene 12 bits de red y 20 de host → 2²⁰ = 1.048.576; el `/16` tiene 16 y 16 → 2¹⁶ = 65.536, y es el que ves en tu casa (`192.168.1.x`).

Fijate el detalle fino: el rango privado de la clase B **no es todo el 172**: es solo de `172.16` a `172.31`. `172.32.0.0` ya es pública.

**Por qué el 172 se corta justo en 31:** el octeto interesante de un `/12` es el segundo, vale `240` y su bloque es 16: los bloques son `172.16`, `172.32`, `172.48`… y solo el primero está reservado para uso privado. Si el segundo octeto cae fuera de 16–31, la dirección no es privada.

> **Cómo salen las privadas a internet:** cuando un paquete de tu casa (`192.168.1.10`) quiere llegar a Google, tu router le cambia la dirección de origen por la **pública** que te dio el proveedor. Ese cambio se llama NAT y es el tema de un manual entero — acá solo necesitás saber que las privadas existen y que sin esa traducción no saldrían de tu red.

**Qué es NAT, en una línea:** *Network Address Translation* (traducción de direcciones de red). Es el portero del barrio cerrado que anota quién sale y con qué número vuelve.

### 6.3. Privada vs pública: la regla en una línea

| | Privada | Pública |
|---|---|---|
| La asigna | Tu red (el router/DHCP) | El proveedor de internet (o el registro regional) |
| ¿Se enruta por internet? | NO | SÍ |
| ¿Puedo elegirla yo? | Sí (dentro de los rangos) | No (son únicas y asignadas) |
| Ejemplo | `192.168.1.10` | `181.164.5.2` |

**Cómo leer esta tabla:** las columnas son los dos tipos de dirección y las filas las cuatro preguntas que resuelven la duda (la primera columna no tiene encabezado porque es la pregunta). La privada te la da tu red y la elegís vos, no se enruta por internet y se repite en miles de casas; la pública te la da el proveedor, sí se enruta y es única en el mundo. Y ojo: una `169.254` no es ni una cosa ni la otra, es de emergencia.

**La regla en una línea:** si empieza con `10.`, `172.16` a `172.31` o `192.168`, es privada; cualquier otra cosa es pública (o reservada). Con eso ya sabés si tu dirección puede salir sola a internet o si necesita que el router la traduzca.

**Chequeo que podés hacer vos:** mirá tu IP y decí "privada" o "pública". Si estás en una red privada, la IP con la que te ve internet (la que muestra cualquier sitio de "cuál es mi IP") va a ser distinta de la de tu compu: esa diferencia es NAT trabajando.

### Resumen

- Algunas direcciones no identifican máquinas: `0.0.0.0` (cualquier red), `127.0.0.1` (yo mismo), `169.254.x.x` (me la puse solo porque no hubo DHCP), `224/4` (multicast) y `255.255.255.255` (todos los de acá).
- Las privadas (`10/8`, `172.16/12`, `192.168/16`) se repiten en cada casa u oficina porque no se enrutan por internet; el router las traduce al salir con NAT.
- Una IP que empieza con `169.254` no es una dirección elegida: es un diagnóstico de que el DHCP no contestó.

---

## 7. Dirección de red y dirección de broadcast: los dos bordes

### 7.1. Cada red tiene DOS direcciones que no son de ningún host

**El problema que resuelven:** cuando un router tiene que hablar de una red entera, necesita un nombre para referirse a ella, y cuando un equipo tiene que hablarle a todos los de la red, necesita una dirección para eso. Si esas dos funciones usaran direcciones de hosts reales, esos hosts no podrían tener IP propia.

**La analogía:** en un edificio hay dos cosas que no son departamentos: la **puerta de entrada** (que representa al edificio entero cuando alguien dice "el edificio de la calle X 1234") y el **altavoz del hall** (que cuando suena lo escuchan todos los departamentos al mismo tiempo). Ninguna de las dos es una vivienda, y por eso no se le puede asignar a una familia.

**La definición:** en toda red, la primera y la última dirección están reservadas:

- **Dirección de RED**: todos los bits de host en `0`. Es la "esquina de la cuadra": identifica a la red entera cuando hablamos de ella.
- **Dirección de BROADCAST**: todos los bits de host en `1`. Es el "megáfono del barrio": el mensaje que se manda a esa dirección lo reciben TODOS los hosts de la red.

Por eso los hosts utilizables son siempre **el total menos 2**.

**La cuenta:** si tenés `h` bits de host hay 2^h direcciones, y dos están reservadas (la de todos ceros y la de todos unos), así que los hosts utilizables son 2^h − 2. En un /24, `h` = 8 → 256 − 2 = 254.

### 7.2. El ejemplo clásico: 192.168.1.0/24

```
Red:         192.168.1.0      (hosts en 0)
Primer host: 192.168.1.1      ← suele ser el router (gateway)
┆            192.168.1.2
┆            …               ← 252 direcciones más
┆            192.168.1.254
Último host: 192.168.1.254
Broadcast:   192.168.1.255    (hosts en 1)
```

**Cómo leer este bloque:** cada línea es una de las cinco partes de la red. **Red** es la dirección con la parte de host toda en `0`: es el nombre de la red y no se le asigna a nadie. **Primer host** es la siguiente (`.1`), que por convención es el router (*gateway*, la puerta de salida). Las líneas con `┆` son la lista resumida para no escribir 254 renglones, y el `…` significa "acá siguen las intermedias". **Último host** es `.254` y **Broadcast** es `.255`, la de los bits de host todos en `1`, el megáfono de la red.

- Direcciones totales: 2⁸ = **256**
- Hosts utilizables: 256 − 2 = **254**
- El host `.1` es casi siempre el router, pero es una convención, no una regla.

**Qué tiene que ver un principiante en pantalla:** con IP `192.168.1.10` y máscara `255.255.255.0` ya podés decir que la red es `192.168.1.0`, el broadcast `192.168.1.255` y que hay 254 lugares. Y si el gateway es `192.168.1.1`, cae donde tiene que caer: como primer host.

### 7.3. Cómo se calcula en binario (para no memorizar)

Con `192.168.1.10/24`:

```
Hosts:  .10  = 11001010   ← bits de host (los últimos 8)
Red:    .0   = 00000000   ← poner todos los bits de host en 0
Broadcast: .255 = 11111111 ← poner todos los bits de host en 1
```

**Cómo leer este bloque:** las tres líneas son el mismo octeto en tres versiones. La primera es el octeto del host tal como está en la dirección; las otras dos son las dos operaciones de siempre: poner los bits de host todos en `0` (red) o todos en `1` (broadcast).

> **Corrección honesta de este ejemplo:** el bloque sirve como ilustración de la operación, pero el binario del `.10` está mal: `11001010` es 202, no 10. El `.10` es `00001010` (8 + 2). Los `.0` y `.255` finales sí son `00000000` y `11111111`, así que leelo como la operación a hacer y no como la conversión exacta de `.10`.

Poner todos los bits de host en 0 te da la red; ponerlos todos en 1 te da el broadcast. Esa es LA operación. Todo el resto del manual es practicar esta misma idea con redes más chicas.

**Chequeo que podés hacer vos, con la cuenta a mano:** tomá `192.168.1.10/24` y escribí el cuarto octeto de la IP en binario: 10 = `00001010`. Cambiá todos esos ocho bits por ceros → `0` → red `192.168.1.0`. Cambiá todos por unos → `255` → broadcast `192.168.1.255`. Si el resultado que obtuviste no coincide con lo que dice la configuración, el error está en algún paso de la cuenta, nunca en la máscara.

### Resumen

- En cada red, la primera dirección (host todo en `0`) es la red y la última (host todo en `1`) es el broadcast; ninguna se le asigna a un equipo.
- Por eso los hosts utilizables son siempre 2^h − 2: en un `/24`, 256 − 2 = 254.
- La operación de fondo es una sola: poner los bits de host en `0` te da la red y ponerlos en `1` te da el broadcast.

---

## 8. Subredes: por qué dividir y cómo se hace

### 8.1. Por qué dividir una red

Tomar tu red de 256 direcciones y partirla en cuatro de 64 tiene beneficios reales:

| Beneficio | Qué pasa en la práctica |
|-----------|------------------------|
| **Menos tráfico broadcast** | El megáfono de una subred no llega a la otra: cada subred solo oye lo suyo |
| **Orden y organización** | Una subred para ventas, otra para administración, otra para invitados |
| **Seguridad** | Las subredes no se ven entre sí: para comunicarse, sí o sí pasa por un router (donde se puede filtrar) |
| **Escalabilidad** | Crecés por partes sin rediseñar toda la red |

**Cómo leer esta tabla:** la primera columna es el motivo y la segunda el efecto que vas a notar. Fila por fila: menos broadcast porque el grito de una subred no llega a la otra; orden porque una subred por área hace que la configuración se explique sola; seguridad porque para pasar de una subred a otra hay un router en el medio donde se puede filtrar; y escalabilidad porque agregás una subred nueva sin tocar las existentes.

**La analogía:** es la diferencia entre un galpón único y un edificio con departamentos. En el galpón, si alguien grita escuchan todos y no hay privacidad posible; en el edificio cada departamento tiene puerta y número, y para pasar de uno a otro hay que usar la escalera común, donde hay una puerta que se puede cerrar.

### 8.2. La operación: tomar bits prestados

Subdividir es **tomar bits de la parte de host y transformarlos en bits de red**.

- Cada bit prestado **duplica** la cantidad de subredes: 1 bit → 2 subredes, 2 bits → 4, 3 bits → 8.
- Pero cada bit prestado **reduce a la mitad** los hosts por subred.

Las dos fórmulas que hay que saber:

```
Cantidad de subredes = 2^bits prestados (s)
Hosts por subred     = 2^bits de host restantes (h) − 2
```

**Cómo leer este bloque:** son dos fórmulas, no dos comandos. La primera dice en cuántas partes podés cortar la red y la segunda cuántos equipos entran en cada parte; `s` son los bits que prestás y `h` los bits de host que te quedan.

**La relación que hay que tener clara:** `s + h` = los bits de host que tenías al principio (en un `/24` que presta 2, quedan 6: 2 + 6 = 8). El bit prestado no se destruye: cambia de bando, y la cantidad total de direcciones no cambia.

**Chequeo que podés hacer vos:** sumá las direcciones de todas las subredes que creaste y te tiene que dar exactamente el total original. Cuatro subredes de 64 = 256, igual que el `/24` de partida. Si te da menos, perdiste un bloque en el camino; si te da más, te superpusiste con otra subred.

### 8.3. El ejemplo completo: partir 192.168.1.0/24 en 4 subredes

**Paso 1 — ¿Cuántos bits presto?** Necesito 4 subredes → 2² = 4 → **s = 2 bits**.

**Paso 2 — ¿Cuál es la nueva máscara?** Originalmente era /24; presto 2 → **/26** (`255.255.255.192`).

**Paso 3 — ¿Cuántos hosts por subred?** Quedan 6 bits de host → 2⁶ − 2 = **62 hosts** por subred.

**Paso 4 — ¿Cuáles son los rangos?** El bloque salta de a 64 (2⁶):

```
Subred 1: 192.168.1.0   a 192.168.1.63    (hosts: .1 a .62, broadcast .63)
Subred 2: 192.168.1.64  a 192.168.1.127   (hosts: .65 a .126, broadcast .127)
Subred 3: 192.168.1.128 a 192.168.1.191   (hosts: .129 a .190, broadcast .191)
Subred 4: 192.168.1.192 a 192.168.1.255   (hosts: .193 a .254, broadcast .255)
```

**Cómo leer este bloque:** está alineado en cuatro columnas. La primera es solo un número de orden (no es parte de la dirección); **desde – hasta** son la primera y la última dirección del bloque, o sea la red y el broadcast de esa subred; **hosts** es el rango utilizable y **broadcast** la última dirección del bloque. Fila por fila: la 1 va del `.0` al `.63` (64 números: hosts `.1`–`.62`, broadcast `.63`); la 2 arranca en `.64` y termina en `.127`; la 3 va del `.128` al `.191`; y la 4 del `.192` al `.255`, el final de la red original.

Cada subred se comporta como una red independiente: su propia dirección de red, su propio broadcast, sus propios 62 hosts.

**La cuenta completa, para que la puedas repetir con otros números:** cada subred empieza en un múltiplo de 64 (0, 64, 128, 192) y termina en el número anterior al múltiplo siguiente (63, 127, 191, 255). Los múltiplos se obtienen sumando 64 una y otra vez. Y la verificación final: las cuatro filas cubren del 0 al 255 sin huecos ni superposiciones, que es exactamente lo que había antes de partir.

### 8.4. La regla del tamaño del bloque

Para saber de cuánto en cuánto saltan las subredes hay un atajo que usan todos los profesionales:

> **Tamaño del bloque = 256 − último octeto de la máscara.**

- Máscara `/26` = `255.255.255.192` → bloque de 256 − 192 = **64**
- Máscara `/27` = `255.255.255.224` → bloque de **32**
- Máscara `/28` = `255.255.255.240` → bloque de **16**

Con eso, armás todos los rangos sin tocar binario — pero recién después de haber entendido el binario, que es lo que te salva cuando la máscara no cae en octeto entero.

**Por qué el atajo funciona:** la resta hace la misma cuenta que el binario, mirada desde el otro lado: el octeto interesante marca el paso.

**El chequeo de la regla:** el bloque tiene que ser una potencia de 2 (1, 2, 4, 8, 16, 32, 64, 128). Si te dio 24, 48 o 100, la resta está mal o la máscara no es válida. Las máscaras solo producen esos ocho tamaños de bloque, nunca otros.

### 8.5. Comunicación entre subredes

Dos subredes distintas **no se ven entre sí sin un router**. El router es el que tiene una interfaz en cada subred y reenvía los paquetes de una a otra — por eso cada subred termina en el gateway (la IP del router en ESE barrio). Si las subredes tienen que comunicarse, el tráfico pasa por el router: ahí es donde se controla, se filtra y se cobra peaje.

**La analogía:** dos departamentos del mismo edificio no comparten living: para ir del 3º A al 5º B salís al pasillo, donde hay un portero (el router) que decide si pasás. Cada corte que hacés al subdividir es una frontera donde después vas a configurar algo, no solo un ejercicio de números.

### 8.6. Redes punto a punto

Cuando solo conectás DOS equipos (un router con otro router), usar una subred entera es desperdicio. Se usa un **/30** (2 hosts) o en la práctica moderna un **/31** (2 hosts, sin broadcast):

```
192.168.1.0/30 → red .0, hosts .1 y .2, broadcast .3
```

**Cómo leer este bloque:** es una subred de cuatro direcciones. La primera (`.0`) es la red, la última (`.3`) es el broadcast, y en el medio quedan dos utilizables (`.1` y `.2`): exactamente los dos extremos del cable.

**La cuenta:** `/30` = `255.255.255.252` → bloque = 256 − 252 = 4. Cuatro direcciones, dos hosts, un broadcast. Si en cambio usás un `/24` para conectar dos routers, gastás 254 direcciones para nada.

El /31 existe porque un enlace de 2 equipos no necesita red ni broadcast: se usan las dos direcciones directamente. Con `/30` gastás cuatro direcciones para dos equipos y se pierde el 50 %; con `/31` gastás dos para dos, y por eso es el estándar moderno entre routers.

### Resumen

- Dividir una red en subredes reduce el tráfico de broadcast, ordena la configuración, agrega fronteras de seguridad y permite crecer por partes.
- Subdividir es prestar bits de host: cada bit prestado duplica las subredes y reduce a la mitad los hosts; `s + h` sigue sumando lo mismo que antes.
- Con la regla del bloque (`256 − octeto interesante`) armás todos los rangos sin binario, y el bloque siempre es una potencia de 2.
- Las subredes no se ven sin un router en el medio; los enlaces de dos equipos usan `/30` y, en la práctica moderna, `/31`.

---

## 9. La tabla de máscaras completa

La referencia que usás toda la vida, desde /8 hasta /32:

| Prefijo | Máscara decimal | Direcciones | Hosts utilizables | Para qué se usa |
|:-------:|-----------------|------------:|------------------:|-----------------|
| /8 | 255.0.0.0 | 16.777.216 | 16.777.214 | Redes enormes (los `10.x` privados) |
| /9 | 255.128.0.0 | 8.388.608 | 8.388.606 | |
| /10 | 255.192.0.0 | 4.194.304 | 4.194.302 | |
| /11 | 255.224.0.0 | 2.097.152 | 2.097.150 | |
| /12 | 255.240.0.0 | 1.048.576 | 1.048.574 | El privado `172.16/12` |
| /13 | 255.248.0.0 | 524.288 | 524.286 | |
| /14 | 255.252.0.0 | 262.144 | 262.142 | |
| /15 | 255.254.0.0 | 131.072 | 131.070 | |
| /16 | 255.255.0.0 | 65.536 | 65.534 | El privado `192.168/16` clásico de empresas |
| /17 | 255.255.128.0 | 32.768 | 32.766 | |
| /18 | 255.255.192.0 | 16.384 | 16.382 | |
| /19 | 255.255.224.0 | 8.192 | 8.190 | |
| /20 | 255.255.240.0 | 4.096 | 4.094 | |
| /21 | 255.255.248.0 | 2.048 | 2.046 | |
| /22 | 255.255.252.0 | 1.024 | 1.022 | |
| /23 | 255.255.254.0 | 512 | 510 | |
| /24 | 255.255.255.0 | 256 | 254 | LA red de casa/oficina chica |
| /25 | 255.255.255.128 | 128 | 126 | Media red /24 |
| /26 | 255.255.255.192 | 64 | 62 | Un cuarto de /24 |
| /27 | 255.255.255.224 | 32 | 30 | |
| /28 | 255.255.255.240 | 16 | 14 | Segmentos chicos |
| /29 | 255.255.255.248 | 8 | 6 | Redes de 6 equipos |
| /30 | 255.255.255.252 | 4 | 2 | Enlaces punto a punto |
| /31 | 255.255.255.254 | 2 | 2 | Punto a punto moderno (sin red/broadcast) |
| /32 | 255.255.255.255 | 1 | 1 | Un solo host (reglas de firewall, VPN) |

> **Cómo leerla:** la columna de "hosts utilizables" es siempre `direcciones − 2`, salvo /31 y /32 que son casos especiales sin broadcast.

### 9.1. Las cinco columnas, una por una

**Prefijo.** Los bits de red, escritos `/n`. Es el dato de entrada: con este número reconstruís toda la fila. Arranca en 8 porque los prefijos menores son redes de más de 16 millones de direcciones y casi no se usan.

**Máscara decimal.** La misma máscara en decimal punteado: `255` a la izquierda (todo red), `0` a la derecha (todo host) y, cuando el prefijo no cae justo, un octeto intermedio de la escalera `128, 192, 224, 240, 248, 252, 254`.

**Direcciones.** 2 elevado a los bits de host: en un `/26` son 6 bits, así que 2⁶ = 64. Cada fila que bajás vale la mitad de la anterior, porque cada bit de red que ganás es un bit de host que perdés.

**Hosts utilizables.** Direcciones − 2, por la red y el broadcast de la sección 7. Es el número con el que se responde "¿me alcanza?".

**Para qué se usa.** La columna para orientarte: "dos routers" → `/30`; "una casa" → `/24`; "la privada de una empresa grande" → `/8` o `/12`.

### 9.2. Cómo leer cada fila, de la /8 a la /32

Leer la tabla no es memorizarla: es saber reconstruir cada fila. Igual, acá va el recorrido completo: la segunda columna dice cuántos bits de host quedan, que es la cuenta que genera todo lo demás.

| Prefijo | Bits de host | Cuenta de direcciones | Octeto interesante (binario) | Bloque |
|:---:|:---:|---|---|:---:|
| /8 | 24 | 2²⁴ = 16.777.216 | no hay: `255.0.0.0` | — |
| /9 | 23 | 2²³ = 8.388.608 | 2º octeto `10000000` = 128 | 128 |
| /10 | 22 | 2²² = 4.194.304 | 2º octeto `11000000` = 192 | 64 |
| /11 | 21 | 2²¹ = 2.097.152 | 2º octeto `11100000` = 224 | 32 |
| /12 | 20 | 2²⁰ = 1.048.576 | 2º octeto `11110000` = 240 | 16 |
| /13 | 19 | 2¹⁹ = 524.288 | 2º octeto `11111000` = 248 | 8 |
| /14 | 18 | 2¹⁸ = 262.144 | 2º octeto `11111100` = 252 | 4 |
| /15 | 17 | 2¹⁷ = 131.072 | 2º octeto `11111110` = 254 | 2 |
| /16 | 16 | 2¹⁶ = 65.536 | no hay: `255.255.0.0` | — |
| /17 | 15 | 2¹⁵ = 32.768 | 3º octeto `10000000` = 128 | 128 |
| /18 | 14 | 2¹⁴ = 16.384 | 3º octeto `11000000` = 192 | 64 |
| /19 | 13 | 2¹³ = 8.192 | 3º octeto `11100000` = 224 | 32 |
| /20 | 12 | 2¹² = 4.096 | 3º octeto `11110000` = 240 | 16 |
| /21 | 11 | 2¹¹ = 2.048 | 3º octeto `11111000` = 248 | 8 |
| /22 | 10 | 2¹⁰ = 1.024 | 3º octeto `11111100` = 252 | 4 |
| /23 | 9 | 2⁹ = 512 | 3º octeto `11111110` = 254 | 2 |
| /24 | 8 | 2⁸ = 256 | no hay: `255.255.255.0` | — |
| /25 | 7 | 2⁷ = 128 | 4º octeto `10000000` = 128 | 128 |
| /26 | 6 | 2⁶ = 64 | 4º octeto `11000000` = 192 | 64 |
| /27 | 5 | 2⁵ = 32 | 4º octeto `11100000` = 224 | 32 |
| /28 | 4 | 2⁴ = 16 | 4º octeto `11110000` = 240 | 16 |
| /29 | 3 | 2³ = 8 | 4º octeto `11111000` = 248 | 8 |
| /30 | 2 | 2² = 4 | 4º octeto `11111100` = 252 | 4 |
| /31 | 1 | 2¹ = 2 | 4º octeto `11111110` = 254 | 2 |
| /32 | 0 | 2⁰ = 1 | no hay: `255.255.255.255` | 1 |

**Cómo leer esta segunda tabla:** es la misma información, ordenada para que puedas recalcular cada fila. Las dos primeras columnas son el prefijo y los bits de host; la tercera es la cuenta de "Direcciones"; la cuarta es el octeto interesante en binario y decimal, que te permite escribir la máscara; y la quinta es el paso entre subredes, el número de la sección 10.

> **El aviso que corresponde:** si comparás con otros libros, vas a ver la columna de hosts utilizables escrita como `2^h − 2` para todos los prefijos. Eso no es exacto para `/31` y `/32`: en el `/31` las dos direcciones se usan (por eso el estándar lo definió así) y en el `/32` hay una sola dirección y es el host. La tabla de acá ya trae la versión correcta.

### 9.3. Cómo reconstruir cualquier fila sin la tabla

Con estas tres operaciones resolvés cualquier prefijo, y de paso ya no necesitás memorizar la tabla:

1. **Bits de host:** 32 − prefijo.
2. **Direcciones:** 2 elevado a los bits de host.
3. **Hosts utilizables:** direcciones − 2.

Y para la máscara, la cuarta operación:

4. **Máscara:** escribí `n` unos y completá con ceros hasta 32, agrupando de a 8 bits por octeto.

**Conversión trabajada 1 — de prefijo a máscara, con `/27`:** 27 bits en uno. Los primeros tres octetos son 8 + 8 + 8 = 24 bits, así que el cuarto necesita 3 unos más: `11100000`. Ese octeto en decimal es 128 + 64 + 32 = **224**. Máscara: `255.255.255.224`. Y el bloque: 256 − 224 = **32**.

**Conversión trabajada 2 — de prefijo a máscara, con `/20`:** 20 bits en uno. Los primeros dos octetos son 16, así que al tercero le tocan 4 unos: `11110000` = 128 + 64 + 32 + 16 = **240**. Máscara: `255.255.240.0`. Bloque: 256 − 240 = **16**.

**Conversión trabajada 3 — de máscara a prefijo, con `255.255.255.248`:** tres octetos completos son 24 unos; el cuarto, `248`, es `11111000` = 5 unos. 24 + 5 = **29**. Es un `/29`: 3 bits de host, 8 direcciones, 6 hosts utilizables.

**Conversión trabajada 4 — de máscara a cantidad de hosts, con `255.255.254.0`:** los dos primeros octetos son 16 unos; el tercero, `254`, es `11111110` = 7 unos; el cuarto, `0`, no aporta. Total 23 → `/23`. Bits de host: 32 − 23 = 9. Direcciones: 2⁹ = 512. Hosts: 512 − 2 = **510**.

**Chequeo que podés hacer vos, en cuatro pasos:** (1) contá los unos de la máscara y te tiene que dar el prefijo; (2) prefijo + bits de host = 32; (3) el octeto interesante restado de 256 te tiene que dar el bloque; (4) el bloque multiplicado por 256 una vez por cada octeto que quede a la derecha del interesante te tiene que dar la columna "Direcciones" (en el `/27` no queda ninguno: 32; en el `/20` queda el cuarto: 16 × 256 = 4.096). Si alguna no cierra, el error es de aritmética, no de concepto.

### Resumen

- La tabla de máscaras es una sola idea repetida 25 veces: prefijo → bits de host → direcciones (2^h) → hosts utilizables (direcciones − 2) → máscara.
- Cada fila que bajás parte los hosts a la mitad y duplica las subredes; el bloque es siempre una potencia de 2 y sale de `256 − octeto interesante`.
- `/8`, `/16`, `/24` y `/32` no tienen octeto interesante; el resto tiene uno solo, y es el que hay que mirar.
- `/31` y `/32` son los dos casos especiales sin red/broadcast: 2 hosts en 2 direcciones y 1 host en 1 dirección.

---

## 10. El cálculo práctico en 4 pasos

### 10.1. El método

Cuando te den una IP y un prefijo y necesites red, broadcast, primer y último host, el método es siempre el mismo:

1. **Ubicá el octeto interesante** (donde la máscara no es 255 ni 0).
2. **Calculá el tamaño del bloque**: `256 − valor del octeto en la máscara`.
3. **Encontrá la red**: el múltiplo del bloque más cercano, menor o igual a la IP.
4. **Completá**: broadcast = red + bloque − 1; hosts = red+1 hasta broadcast−1.

**Por qué el paso 3 dice "más cercano, menor o igual":** porque la red es la primera del bloque, y el bloque donde cae tu IP es el que empieza en el último múltiplo que no la pasa. Con IP 137 y bloque 64, los múltiplos son 0, 64, 128, 192: el último que no pasa a 137 es 128, ahí está tu red. Nunca se redondea para arriba: eso te manda a la subred siguiente.

**El paso de control, que casi nadie hace y hay que hacer:** confirmá que la IP original cae entre la red y el broadcast, y que el bloque no se solapa con el de al lado. Si la IP no cae adentro, el error está en el paso 3.

### 10.2. Ejemplo resuelto 1: 192.168.4.137/26

**Paso 1:** máscara /26 = `255.255.255.192` → octeto interesante: el 4º (valor 192).
**Paso 2:** bloque = 256 − 192 = **64**.
**Paso 3:** múltiplos de 64: …, 64, **128**, 192… → 137 está entre 128 y 192 → **red = 192.168.4.128**.
**Paso 4:**

```
Red:        192.168.4.128
Primer host: 192.168.4.129
Último host: 192.168.4.190
Broadcast:   192.168.4.191
```

**Cómo leer este bloque:** son las cuatro respuestas que se piden siempre, en orden: red, primer host, último host y broadcast. Entre red y broadcast hay 64 direcciones, de las cuales 62 se pueden asignar.

**Paso 5 (la verificación):** ¿la IP original cae entre primer y último host? 137 sí, y su número de host adentro de la subred es 137 − 128 = 9.

### 10.3. Ejemplo resuelto 2: 10.20.30.40/20

**Paso 1:** /20 = `255.255.240.0` → octeto interesante: el 3º (240), el 4º es 0 (todo host).
**Paso 2:** bloque = 256 − 240 = **16**.
**Paso 3:** múltiplos de 16 en el 3º octeto: 16, **32**, 48… → 30 está entre 16 y 32 → red = `10.20.16.0`.
**Paso 4:**

```
Red:        10.20.16.0
Primer host: 10.20.16.1
Último host: 10.20.31.254
Broadcast:   10.20.31.255
```

Fijate que el 4º octeto va de 0 a 255 dentro del bloque (los 8 bits de host + los 4 del octeto interesante dan 12 bits de host: los últimos 4 bits del 3º octeto + los 8 del 4º).

**Cómo leer este bloque:** acá el bloque no está contenido en un octeto: empieza en el 3º y termina en el 4º. Por eso el último host es `10.20.31.254` y no `10.20.16.254`: el bloque va de `10.20.16.0` a `10.20.31.255`. El primer host solo cambia el último octeto; el último host cambia los dos últimos.

**La cuenta completa:** 30 está entre 16 y 32, entonces la red es `10.20.16.0`; el tercer octeto llega hasta 31 (16 + 16 − 1) y con el cuarto en 255 el final es `10.20.31.255`. Hosts: 4.096 − 2 = 4.094, el número de la tabla para `/20`.

**Chequeo que podés hacer vos acá:** el tercer octeto de la red es múltiplo de 16 (16 = 16 × 1). El tercer octeto de la IP original (30) tiene que estar entre 16 y 31. Y el broadcast tiene que terminar en `.255` porque el 4º octeto de la máscara es `0`: cuando el octeto interesante no es el último, el último octeto siempre va entero.

### 10.4. Ejemplo resuelto 3: 172.20.5.77/30

**Paso 1:** /30 = `255.255.255.252` → octeto interesante: el 4º (252).
**Paso 2:** bloque = 256 − 252 = **4**.
**Paso 3:** múltiplos de 4: 72, **76**, 80… → 77 está entre 76 y 80 → red = `172.20.5.76`.
**Paso 4:**

```
Red:        172.20.5.76
Primer host: 172.20.5.77   ← ¡la propia IP!
Último host: 172.20.5.78
Broadcast:   172.20.5.79
```

Este es el típico enlace punto a punto: dos direcciones utilizables.

**Cómo leer este bloque:** la flecha de la segunda línea señala que la IP del enunciado es el primer host de la subred. No es casualidad: los enlaces punto a punto se numeran así, un extremo en `.1` y el otro en `.2` del bloque, y una IP de router con `/30` casi siempre cae en una de esas dos posiciones.

**La cuenta a mano y el control:** 77 ÷ 4 = 19, con resto 1. La red es 19 × 4 = 76. El bloque va de 76 a 79 (76 + 4 − 1). Los hosts son 77 y 78, y otra vez: 77 es la IP del enunciado, así que la cuenta cierra.

> **HACELO VOS:** agarrá papel y lápiz y resolvé `192.168.10.99/27` con el método de 4 pasos. Después compará con la respuesta del pie de esta sección.

**Respuesta del ejercicio:** /27 = 255.255.255.224 → bloque 32 → múltiplos: 64, 96, 128… → 99 está entre 96 y 128 → red `192.168.10.96`, primer host `.97`, último host `.126`, broadcast `.127`.

**Cómo verificar tu propio resultado, sin mirar la respuesta:** (1) el bloque tiene que ser 32, o sea 256 − 224; (2) la red tiene que ser múltiplo de 32 y el múltiplo tiene que ser el último que no pasa a 99 → 96; (3) el broadcast tiene que ser 96 + 32 − 1 = 127; (4) la IP original tiene que caer entre el primer host y el último. Si los cuatro chequeos pasan, tu respuesta es correcta aunque la escribas con otro orden.

### Resumen

- El método es siempre el mismo: octeto interesante, bloque (`256 − octeto`), múltiplo que no pasa a la IP, y de ahí red, hosts y broadcast.
- Se redondea **para abajo** siempre: la red es el múltiplo del bloque que queda por debajo de la IP, nunca el de arriba.
- Cuando el octeto interesante no es el último, el bloque se extiende sobre el octeto siguiente y el broadcast termina en `.255`.
- Los `/30` son enlaces de dos equipos: red, dos hosts y broadcast, cuatro direcciones en total.
- Verificá siempre que la IP original caiga entre el primer y el último host: es el control que detecta casi todos los errores.

---

## 11. IPv6: lo que tenés que saber

### 11.1. Por qué existe

**El problema que resuelve:** IPv4 se quedó sin direcciones: en 2011 el registro central anunció que no quedaban bloques grandes para entregar. Cada dirección nueva tenía que salir de reciclar o de NAT, y NAT resuelve el síntoma (varios equipos comparten una pública) pero no el problema.

**La analogía:** es el cambio de numeración telefónica de un país cuando se le acaban los números. Al principio alcanzaba con cinco dígitos; después hubo que pasar a siete, y luego a diez. IPv6 es el mismo movimiento: un sistema de numeración más largo para un mundo con más teléfonos.

IPv4 tiene 4.300 millones de direcciones, pero el mundo tiene más dispositivos que eso. Los últimos bloques grandes de IPv4 se agotaron en 2011. IPv6 nació para eso: **128 bits, más direcciones que átomos en la superficie de la Tierra** (exageramos poco: hay 3,4 × 10³⁸, y se estiman ~10³⁰ átomos en un planeta).

> **Una aclaración honesta sobre esa comparación:** la frase de los átomos es folclore de redes y depende de qué superficie y qué planeta se tomen. El dato que no tiene discusión es 2¹²⁸ ≈ 3,4 × 10³⁸ direcciones.

### 11.2. Cómo se lee

Ocho grupos de 4 dígitos hexadecimales, separados por dos puntos:

```
2001:0db8:0000:0000:0000:ff00:0042:8329
└─┬─┘└─┬─┘  └──┬──┘ └──┬──┘  └──┬──┘  └──┬──┘
 grupo1 grupo2  ...    ...    ...    grupo8 → 8 grupos × 16 bits = 128 bits
```

**Cómo leer este bloque:** la línea 1 es la dirección completa, sin abreviar; la línea 2 son corchetes que marcan qué caracteres pertenecen a cada grupo; y la línea 3 son las etiquetas de los grupos con los del medio resumidos en `...`, más la cuenta final: 8 grupos de 16 bits son 128 bits.

**Por qué cuatro dígitos por grupo:** cada dígito hexadecimal son 4 bits y 4 × 4 = 16 bits por grupo; ocho grupos × 16 = 128.

### 11.3. Las dos reglas de abreviatura

1. **Ceros iniciales se eliminan**: `0db8` → `db8`, `0042` → `42`. (Ojo: los ceros *finales* NO se tocan: `0080` no es `8`, es `80`.)
2. **Un solo bloque de ceros consecutivos se comprime con `::`** (una sola vez por dirección):

```
2001:0db8:0000:0000:0000:ff00:0042:8329
→ 2001:db8::ff00:42:8329

::1    → la dirección de loopback (antes: 0000…0001)
```

**Cómo leer este bloque:** la primera línea es la dirección completa y la segunda la misma después de las dos reglas; la cuarta es el caso más famoso, el loopback de IPv6. El `→` marca "queda escrito así".

**Las reglas aplicadas paso a paso:** primero se quitan los ceros a la izquierda de cada grupo (`0db8` → `db8`, `0042` → `42`); después se busca el tramo más largo de grupos todo ceros y se reemplaza por `::`. Como `::` se usa una sola vez, si hubiera dos tramos de ceros hay que elegir el más largo y dejar el otro con sus ceros.

**Y el `::1`:** es el loopback de IPv6, el equivalente exacto del `127.0.0.1` de IPv4.

### 11.4. Lo que SÍ tenés que saber para trabajar

| Dato | Valor |
|------|-------|
| Privadas | `FC00::/7` (**ULA**): no se enrutan por internet, como los privados de IPv4 |
| Loopback | `::1` (equivalente a `127.0.0.1`) |
| Tamaño típico de subred | **/64** — las subredes IPv6 casi siempre son de 64 bits de red y 64 de host |
| Enlace punto a punto | /127 (equivalente moderno del /30) |

**Cómo leer esta tabla:** dos columnas y cuatro filas. La izquierda es el concepto de IPv4 y la derecha cómo se llama y se escribe en IPv6: es una tabla de traducción, no de datos nuevos. **Privadas** son las **ULA** (*Unique Local Address*), el `10/8` de IPv6; **loopback** es `::1`; la **subred típica** es `/64` (media dirección para red y media para host, una costumbre fuerte aunque no obligatoria); y el **enlace punto a punto** usa `/127`, como el `/30`.

En IPv6, la idea de red+host es la misma que en IPv4, pero con números tan enormes que "ahorrar direcciones" dejó de ser una preocupación: cada subred /64 tiene 2⁶⁴ hosts, más que toda internet IPv4 junta.

**Chequeo que podés hacer vos:** una dirección con dos puntos y letras es IPv6; si empieza con `fe80` es link-local (el `169.254` de IPv4) y si empieza con `fc` o `fd` es ULA, o sea privada.

### Resumen

- IPv6 existe porque IPv4 se quedó sin direcciones: 128 bits en lugar de 32, escritos como ocho grupos hexadecimales separados por dos puntos.
- Se abrevia quitando ceros a la izquierda y comprimiendo **una sola vez** el tramo más largo de ceros con `::`; los ceros finales no se tocan.
- `::1` es el loopback y `FC00::/7` son las privadas (ULA): las mismas ideas de IPv4 con otra escritura.

---

## 12. DHCP: de dónde sale tu IP

### 12.1. Cargar IPs a mano: insostenible

**El problema que resuelve:** alguien tiene que decidir qué dirección le toca a cada equipo. Si lo hacés a mano, hay tres formas de equivocarte y las tres pasan siempre: dos equipos terminan con la misma dirección, alguien tipea `192.168.1.1O` con la letra O, y nadie sabe qué dirección está libre cuando llega un equipo nuevo.

**La analogía:** el acomodador de un teatro: no dejás que cada espectador elija su butaca, hay alguien en la puerta que sabe cuáles están libres, te da una y anota que la ocupaste.

En una red de 200 equipos, ponerle la IP a cada uno a mano es un error asegurado: errores de tipeo, dos equipos con la misma IP, cambios que nadie registra. Por eso existe el **DHCP** (*Dynamic Host Configuration Protocol*): el protocolo que le asigna la dirección automáticamente a cada equipo que se conecta.

### 12.2. Las cuatro letras: DORA

El diálogo entre tu equipo y el servidor DHCP (a menudo el router) es famoso por sus siglas en inglés:

```
  TU EQUIPO                        SERVIDOR DHCP
     │                                   │
     │ 1. DISCOVER  "¿Hay alguien que me dé IP?"  ►
     │                                   │
     │ 2. OFFER     "Sí: te propongo 192.168.1.50" ◄
     │                                   │
     │ 3. REQUEST   "Acepto, dame esa"    ►
     │                                   │
     │ 4. ACK       "Queda tuya. ¡Bienvenido!" ◄
     │                                   │
```

**Cómo leer este bloque:** es un diálogo entre dos columnas. La izquierda sos vos (tu equipo); la derecha es el servidor DHCP. Las flechas `►` y `◄` indican quién habla y los números marcan el orden; las comillas son el contenido de cada mensaje en criollo.

**Mensaje por mensaje, con su nombre técnico:**

- **DISCOVER** (descubrir): tu equipo grita a la red "¿hay algún servidor DHCP acá?". No tiene dirección, así que no puede hablarle a uno en particular.
- **OFFER** (ofrecer): los servidores contestan con una dirección disponible. Es una propuesta, no una asignación.
- **REQUEST** (pedir): tu equipo elige una oferta y la pide formalmente, para que si hay dos servidores todos se enteren de cuál ganó.
- **ACK** (*acknowledgement*, acuse): el servidor confirma y reserva la dirección por un tiempo (el *lease*, o alquiler).

El DHCP no te da solo la IP: te da también la **máscara**, el **gateway** (la IP del router para salir) y el **DNS** (para resolver nombres). Todo lo que tu equipo necesita para vivir, en un solo servicio, y por eso cuando el DHCP falla fallan los cuatro a la vez.

### 12.3. Cuando DHCP no contesta

Si el equipo no recibe respuesta (cable cortado, servidor caído), se autoasigna una dirección del rango `169.254.0.0/16` — la **APIPA**. Es la "IP de emergencia": sirve para comunicarse con equipos de la misma red que también fallaron, pero NO da acceso a nada más. Si ves un `169.254.x.x`, ya sabés: problema de DHCP.

**El diagnóstico en dos pasos, sin comandos nuevos:** mirá tu IP. Si empieza con `169.254`, el DHCP no contestó. Antes de culpar al servidor, revisá lo físico: el cable, el Wi-Fi, el switch. El DHCP no puede contestar si el pedido nunca llegó.

### Resumen

- DHCP es el protocolo que asigna direcciones automáticamente, y evita los tres errores clásicos del reparto a mano: direcciones repetidas, errores de tipeo y registros desactualizados.
- El diálogo se llama DORA: DISCOVER (pregunto), OFFER (me ofrecen), REQUEST (acepto), ACK (me confirman).
- En el mismo mensaje llegan la IP, la máscara, el gateway y el DNS; una IP `169.254.x.x` (APIPA) es un diagnóstico, no una dirección elegida.

---

## 13. La resolución de nombres: DNS

### 13.1. El problema

**El problema que resuelve:** los humanos recordamos nombres y las máquinas usan números. Alguien tiene que hacer la traducción, y hacerla bien, millones de veces por segundo.

**La analogía:** la agenda del teléfono. Nadie se acuerda del número de su hermana: se acuerda de "hermana" y el teléfono busca el número. El DNS es la agenda de internet.

Recordar `142.250.64.14` es imposible; recordar `google.com`, no. El **DNS** (*Domain Name System*, sistema de nombres de dominio) es el traductor: convierte los nombres que usamos (`google.com`) en las direcciones IP que usa la red.

### 13.2. Cómo funciona en una línea

Tu equipo le pregunta al servidor DNS (el "directorio de internet"): *"¿qué IP tiene google.com?"* — y el servidor responde con la dirección. Después, todos los paquetes usan la IP.

**El paso a paso, para que no quede en una frase:** escribís el nombre; tu equipo mira si lo preguntó hace poco; si no, le pregunta al servidor DNS que le indicó el DHCP; el servidor contesta con la IP; y recién ahí tu equipo arma los paquetes, que ya no llevan el nombre sino la IP.

Esto explica un síntoma clásico: "tengo internet pero no abre ninguna página". Si el `ping` a una IP funciona pero el navegador no carga, sospechá del DNS: el camino existe, lo que falla es el traductor.

**Por qué ese síntoma es tan útil:** porque separa dos fallas que se parecen. Si el `ping` a una IP funciona, tu red, tu máscara, tu gateway y la ruta a internet están bien y el problema es solo el traductor; si tampoco funciona, el problema está más abajo.

**Chequeo que podés hacer vos:** si no hay DNS configurado, o es una dirección que no responde, ya sabés por qué los nombres no abren: es lo que distingue "no hay internet" de "internet no me traduce los nombres".

### Resumen

- DNS es el traductor entre los nombres que recordamos y las IPs que usan las máquinas; sin él, todo funciona pero nada se abre por nombre.
- El DHCP te entrega la dirección del servidor DNS junto con la IP, la máscara y el gateway.
- Si el `ping` a una IP anda y el navegador no carga, la red está bien y el sospechoso es el DNS.

---

## 14. Tu IP en la práctica

### 14.1. Mirá tu propia configuración

Abrí una terminal y corré el comando de tu sistema:

```
Windows:  ipconfig /all
Linux:    ip addr
```

**Cómo leer este bloque:** son dos comandos, uno por sistema operativo. La etiqueta de la izquierda dice en qué sistema se usa; a la derecha está el comando tal cual se escribe. El `Windows:` y el `Linux:` no forman parte del comando: son la etiqueta.

**Qué hace cada uno:** `ipconfig /all` (Windows) muestra la configuración de red de todos los adaptadores, y el `/all` es la opción que pide el detalle completo; `ip addr` (Linux) muestra las interfaces y sus direcciones, y es el comando moderno que reemplazó a `ifconfig`.

**Qué tiene que ver un principiante en pantalla:** en Windows, un bloque por adaptador con la etiqueta a la izquierda y el valor después de los dos puntos; en Linux, un bloque por interfaz empezando por su nombre (`eth0`, `wlan0`). En los dos casos buscá lo mismo: IPv4, máscara, gateway y DNS.

Vas a ver algo así:

```
IPv4 Address. . . . . . . . . . . : 192.168.1.10
Subnet Mask . . . . . . . . . . . : 255.255.255.0
Default Gateway . . . . . . . . . : 192.168.1.1
DNS Servers . . . . . . . . . . . : 8.8.8.8
```

**Cómo leer este bloque:** es la salida de `ipconfig /all` recortada a las cuatro líneas que importan. Los puntos suspensivos son relleno para alinear la columna y el dato está después de los dos puntos.

Ahora sabés leerlo como un profesional:

- **IPv4**: tu dirección en la red local.
- **Máscara**: 255.255.255.0 = /24 = tu red es `192.168.1.0` y hay 254 hosts posibles.
- **Gateway**: la IP del router, la puerta de salida a internet. Tu equipo manda ahí todo lo que no es local.
- **DNS**: el traductor que se usa para resolver nombres.

**Fila por fila, con la cuenta al lado:**

- **IPv4 Address:** `192.168.1.10`. Es tu puerta en esta red. Si tenés Wi-Fi y cable, vas a ver dos bloques con dos direcciones distintas: son dos interfaces, como en la sección 1.2.
- **Subnet Mask:** `255.255.255.0`. Es un `/24`: los tres primeros octetos son red, el último es host. Por eso tu red es `192.168.1.0` y el broadcast, `192.168.1.255`.
- **Default Gateway:** `192.168.1.1`. El router. Está dentro de tu red (empieza igual que tu IP), y es lo que hace que puedas salir. Si el gateway está vacío o en otra red, no salís a ningún lado.
- **DNS Servers:** `8.8.8.8`. El traductor de nombres. Puede haber más de uno; el segundo es el de respaldo.

### 14.2. Comprobá que tu red y tu broadcast dan bien

Con `192.168.1.10/24`: red = `192.168.1.0` (hosts en 0), broadcast = `192.168.1.255` (hosts en 1). Coincide con lo que viste en la sección 7 — la teoría y la práctica son la misma cuenta.

**Los cinco chequeos que podés hacer solo, con lo que ya está en pantalla:**

1. **La máscara es válida:** sus octetos tienen que ser `255`, `0` o uno de la escalera (`128, 192, 224, 240, 248, 252, 254`). Cualquier otro número no es una máscara.
2. **El gateway cae adentro de tu red:** comparalo con tu IP y tu máscara. `192.168.1.1` con `/24` está en `192.168.1.0`–`192.168.1.255`, sí. Si cayera afuera, tu equipo no podría hablarle al router.
3. **Tu IP no es la dirección de red ni el broadcast:** si tu IP terminara en `.0` o en `.255` con un `/24`, hay un error de configuración en algún lado.
4. **La IP no empieza con `169.254`:** si empieza, el DHCP no contestó (sección 12.3) y nada de lo demás importa.
5. **Hay DNS configurado:** si la línea de DNS está vacía, los nombres no van a resolver.

**Y un sexto chequeo, con el `ping` que ya usa este manual:** probá `ping 127.0.0.1` (el loopback de la sección 6.1) y después `ping` a tu gateway. Si el loopback contesta y el gateway no, el problema está en el cable o en el router; si el gateway contesta y `ping 8.8.8.8` (el DNS del ejemplo) no, el problema está más arriba. Ese orden —yo, mi router, el mundo— es el diagnóstico más rápido que existe y no necesita ninguna herramienta nueva.

### Resumen

- `ipconfig /all` en Windows y `ip addr` en Linux muestran tu IP, tu máscara, tu gateway y tu DNS: los cuatro datos que entrega el DHCP.
- Los chequeos propios son cinco: máscara válida, gateway adentro de la red, IP que no sea red ni broadcast, IP que no sea `169.254` y DNS presente.
- El orden de diagnóstico es siempre el mismo: yo (loopback), mi router (gateway), el mundo (una IP pública).

---

## 15. Comprobá lo que aprendiste

Respondé antes de mirar y leé la respuesta recién después de intentarlo.

**1. ¿Cuánto vale `10110000` en decimal?**

Respuesta: 128 + 32 + 16 = **176**. (Posiciones con 1: 128, 64, 32, 16, 8, 4, 2, 1 → 1,0,1,1,0,0,0,0 → 128+32+16.)

**2. ¿Qué parte de la dirección es red y cuál host en `172.16.5.9/16`?**

Respuesta: /16 = 16 bits de red → red `172.16`, host `5.9`. Con /12 (la máscara privada de clase B), la cuenta sería distinta: red `172.16`, host `5.9` también, pero por otras razones — el límite cae a la mitad del 2º octeto.

**3. ¿Por qué una red /24 tiene 254 hosts y no 256?**

Respuesta: porque la primera dirección es la de red (bits de host en 0) y la última es el broadcast (bits de host en 1). Hosts utilizables = 2⁸ − 2 = **254**.

**4. ¿Cuál es la dirección de red, broadcast y los hosts de `10.10.10.5/28`?**

Respuesta: /28 = 255.255.255.240 → bloque de 16 → múltiplos: 0, 16, 32… → red `10.10.10.0`, broadcast `10.10.10.15`, hosts `.1` a `.14`.

**5. ¿Qué significan estas direcciones: `127.0.0.1`, `169.254.1.5`, `255.255.255.255`?**

Respuesta: `127.0.0.1`: loopback, la propia máquina. `169.254.1.5`: link-local/APIPA, autoasignada porque el DHCP no contestó. `255.255.255.255`: broadcast limitado, llega a todos los equipos de la red local.

**6. Tu empresa tiene 500 equipos y te dan `10.0.0.0/23`. ¿Alcanza?**

Respuesta: /23 = 512 direcciones, 510 hosts utilizables. **Sí, alcanza justito** (500 ≤ 510). Si fueran 520, haría falta /22 (1022 hosts).

**7. ¿Qué es el octeto interesante y cuál es en `192.168.50.77/22`?**

Respuesta: es el octeto donde conviven el último 1 y los primeros 0 de la máscara — ahí se juega el cálculo de subredes. En /22 = 255.255.252.0 es el **3º octeto** (252).

**8. ¿Qué tan grande es una subred IPv6 típica?**

Respuesta: /64: 64 bits de red y 64 de host, es decir 2⁶⁴ direcciones posibles — más que todos los equipos de internet IPv4 actual. El desperdicio dejó de ser un problema en IPv6.

### Resumen

- Las ocho preguntas cubren las ocho herramientas del capítulo y están ordenadas igual que las secciones: si fallás una, sabés exactamente a dónde volver.
- Las respuestas se verifican con las mismas cuentas que usaste en los ejemplos, no con memoria: binario por suma de potencias y subredes por bloque.
- El cuestionario sirve como control final: si las ocho salen, el capítulo está entendido y podés pasar al de NAT.

---

## 16. Glosario

**Para qué sirve este glosario:** es la página a la que volvés cuando en el manual siguiente aparece una palabra y no te acordás qué era. Está en el orden en que aparecen los conceptos en el capítulo, así que también sirve de repaso.

| Término | Qué es |
|---------|--------|
| **Dirección IP** | Identificador numérico único de una interfaz en una red |
| **IPv4** | Versión de 32 bits del protocolo IP (formato decimal punteado) |
| **IPv6** | Versión de 128 bits (formato hexadecimal con `:`) |
| **Octeto** | 8 bits: el bloque básico de una dirección IPv4 (0–255) |
| **Bit** | Dígito binario: 0 o 1 |
| **Binario** | Sistema numérico de base 2, el idioma de las computadoras |
| **Hexadecimal** | Sistema de base 16 (0-9, A-F), usado en IPv6 |
| **Parte de red** | La porción de la dirección que identifica la red (la "calle") |
| **Parte de host** | La porción que identifica al dispositivo (el "número") |
| **Máscara de subred** | 32 bits con 1s consecutivos que marcan la parte de red |
| **Prefijo / CIDR** | Notación del tipo `/24`: cantidad de bits de red |
| **Octeto interesante** | El octeto donde la máscara no es 255 ni 0: el del cálculo |
| **Clase A/B/C** | Divisiones históricas del espacio IPv4 por tamaño fijo |
| **Dirección de red** | La primera de la subred: bits de host en 0 |
| **Broadcast** | Mensaje para todos: la última dirección (bits de host en 1) |
| **Hosts utilizables** | Total de direcciones menos red y broadcast (2^h − 2) |
| **Loopback** | `127.0.0.1` / `::1`: la propia máquina |
| **Privada** | Dirección no enrutada por internet (10/8, 172.16/12, 192.168/16) |
| **Pública** | Dirección única en internet, asignada por el proveedor |
| **APIPA / Link-local** | `169.254.0.0/16`: autoasignada cuando el DHCP no responde |
| **Subred** | División lógica de una red; se comunica con otras solo vía router |
| **Bit prestado** | Bit de host convertido en bit de red para crear subredes |
| **Bloque** | 256 − octeto de la máscara: el paso entre subredes |
| **DHCP** | Protocolo que asigna IP, máscara, gateway y DNS automáticamente |
| **DORA** | El diálogo del DHCP: Discover, Offer, Request, Ack |
| **DNS** | Traductor de nombres a IPs |
| **Gateway** | La IP del router de tu red: la puerta de salida |
| **ULA** | Privadas IPv6 (`FC00::/7`), el equivalente de los rangos privados de IPv4 |
| **Multicast** | Envío a un grupo de destinatarios (224/4 en IPv4) |

**Cómo leer esta tabla:** a la izquierda el término y a la derecha la definición en una línea, para que la puedas leer de un vistazo en medio de otra cosa.

**Los seis que no podés olvidarte:** *máscara* (la tira de 1s que dice dónde está el corte), *prefijo* (lo mismo escrito `/24`), *dirección de red* (la primera, no se asigna), *broadcast* (la última, habla a todos), *gateway* (la puerta de salida) y *bloque* (el paso entre subredes).

### Resumen

- El glosario es una página de consulta, no de memorización: está en el orden en que aparecen los conceptos en el capítulo.
- Los seis términos que sostienen todo son máscara, prefijo, dirección de red, broadcast, gateway y bloque.
- Si una definición no se entiende, es porque usa otra palabra del mismo glosario que hay que resolver antes.

---

## 17. Resumen en 10 puntos

**Para qué sirve este cierre:** son los diez puntos que te permiten seguir con el manual de NAT sin volver atrás, en el orden del capítulo.

1. **Cada dispositivo tiene una dirección IP** que identifica su interfaz: sin ella, los datos no saben a dónde ir.
2. **Las direcciones son binarias de 32 bits** (IPv4) o 128 (IPv6); las escribimos en decimal o hexadecimal para poder leerlas.
3. **Toda dirección tiene dos partes**: red (la calle) y host (el número). La **máscara** dice dónde está el corte.
4. **La máscara son 1s consecutivos** (red) seguidos de 0s (host); se abrevia como prefijo `/n` (cantidad de 1s).
5. **Las clases A/B/C son historia**, pero la notación sobrevivió: se reconocen por el primer octeto y sirven para hablar rápido.
6. **Existen direcciones reservadas**: loopback (`127.0.0.1`), privadas (10/8, 172.16/12, 192.168/16), APIPA (169.254), multicast y broadcast — cada una con su uso exacto.
7. **En cada red, la primera dirección es la red y la última el broadcast**: hosts utilizables = 2^h − 2.
8. **Subdividir es prestar bits de host**: cada bit duplica las subredes y reduce a la mitad los hosts — con la regla del bloque (256 − máscara) armás los rangos.
9. **El método de 4 pasos** (octeto interesante → bloque → red → extremos) resuelve cualquier IP/prefijo sin memorizar.
10. **La IP no aparece sola**: el DHCP la asigna (DORA) y el DNS traduce los nombres que sí podemos recordar.

### Resumen

- Diez puntos cierran el capítulo: IP, binario, red + host, máscara, clases, direcciones reservadas, red y broadcast, subredes, método de 4 pasos y DHCP/DNS.
- Cada punto tiene su sección de respaldo: si no sale con tus palabras, sabés exactamente dónde volver a estudiar.
- La idea que sostiene los diez: una dirección es un domicilio, la máscara dice qué parte es la calle y qué parte es la casa, y las subredes son edificios dentro de esa calle.

---

> **Fuente:** Documentación propia basada en RFC 791, RFC 1918, RFC 4291 y material educativo de redes.

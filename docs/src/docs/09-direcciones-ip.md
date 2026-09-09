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

## 1. El problema que resuelven las direcciones IP

### 1.1. El sistema de direcciones del correo

Pensá en el correo postal: para que una carta llegue, no alcanza con escribirle al "vecino de la casa amarilla". Necesitás un sistema de direcciones que TODOS respeten: calle, número, ciudad, país. Sin ese sistema, los carteros del mundo no podrían hacer su trabajo — cada uno repartiría a su manera y la carta se perdería siempre.

Internet es exactamente igual, pero a escala planetaria: hay **miles de millones de dispositivos** conectados entre sí, y cada uno necesita una dirección única para que los datos lleguen a destino sin confundirse.

Esa dirección es la **dirección IP** (*Internet Protocol* address).

> **Idea central de este manual:** cada dispositivo conectado a una red tiene una dirección IP: un número único que identifica *dónde está* ese dispositivo para poder mandarle datos. Y como hay muchísimos dispositivos, esas direcciones se organizan en **redes** y se subdividen en **subredes** — como las calles, cuadras y manzanas de una ciudad.

### 1.2. Qué es exactamente una dirección IP

Hay una precisión fina que separa a los que entienden de los que memorizan:

> **Una dirección IP no identifica a un dispositivo: identifica a una *interfaz* de red.**

Si tu notebook tiene cable Ethernet y Wi-Fi, tiene DOS direcciones IP — una por cada interfaz. Un servidor con dos placas de red tiene dos IPs. La dirección IP le dice a la red: "los datos para esta dirección se entregan en esta entrada".

### 1.3. El tamaño del problema

Hoy conviven dos versiones del protocolo IP:

| Versión | Longitud de la dirección | Cantidad teórica de direcciones | Formato |
|---------|--------------------------|--------------------------------|---------|
| **IPv4** | 32 bits | 2³² = 4.294.967.296 (≈ 4.300 millones) | Decimal punteado: `192.168.1.10` |
| **IPv6** | 128 bits | 2¹²⁸ ≈ 3,4 × 10³⁸ | Hexadecimal con dos puntos: `2001:0db8::1` |

Ojo con una trampa que aparece en todos lados: el total teórico no es el total utilizable. Hay direcciones reservadas (privadas, de prueba, de multicast, de broadcast), así que el número real de direcciones públicas utilizables es menor.

### 1.4. Por qué IPv4 es "la madre" de todo

Casi todo lo que vas a configurar en tu vida profesional (y en tu casa) es IPv4: `192.168.1.1`, `10.0.0.5`, `172.16.0.24`… Por eso este manual se centra en IPv4 y deja IPv6 para la sección 11: primero hay que dominar el sistema que está en la calle hoy.

---

## 2. Binario y hexadecimal: las herramientas

### 2.1. Las computadoras no cuentan como nosotros

La dirección IP es un número binario de 32 bits. Los humanos lo escribimos en decimal para poder leerlo, pero la máquina lo ve como una tira de ceros y unos. Si no sabés leer binario, vas a memorizar reglas sin entender por qué existen. Con tabla de potencias y un ejemplo, se aprende en cinco minutos.

Un octeto (8 bits) representa las potencias de 2:

```
 128   64   32   16    8    4    2    1   ← valor de cada posición
  1    0    1    0    1    0    0    0   ← los bits
─────────────────────────────────────────
 128 + 0  + 32 + 0  + 8  + 0  + 0  + 0  = 168
```

**Regla:** sumá el valor de las posiciones donde hay un `1`.

Ejemplo completo — la dirección `168.212.226.204` en binario:

```
168 = 10101000     128+32+8
212 = 11010100     128+64+16+4
226 = 11100010     128+64+32+2
204 = 11001100     128+64+8+4

168.212.226.204 = 10101000.11010100.11100010.11001100
```

> **Dato que ahorra años:** el valor máximo de un octeto es 255 (todos los bits en 1), y el mínimo es 0 (todos en 0). Por eso los octetos van de 0 a 255 — y por eso una IP jamás tiene un octeto mayor a 255.

### 2.2. De binario a decimal en 3 pasos

1. Escribí las potencias sobre los bits: `128 64 32 16 8 4 2 1`.
2. Marcá las posiciones donde hay un `1`.
3. Sumá los valores marcados.

Hacelo vos con `11000000`:

```
 128 64 32 16 8 4 2 1
  1   1  0  0 0 0 0 0  → 128 + 64 = 192
```

### 2.3. Hexadecimal: el formato de IPv6

IPv6 es tan largo que ni en decimal se puede manejar: usa **hexadecimal** (base 16). Los dígitos son `0 1 2 3 4 5 6 7 8 9 A B C D E F` (donde A=10, B=11, …, F=15), y un grupo de **4 bits** se escribe como UN dígito hexadecimal:

```
1010 = A       1111 = F
0011 = 3       0001 = 1
```

Por eso las direcciones IPv6 se ven raras: cada grupo de 4 dígitos hexadecimales representa 16 bits. No hace falta más que eso por ahora — lo vas a usar en la sección 11.

---

## 3. La anatomía de una dirección IPv4: red + host

### 3.1. Las dos partes de toda dirección

Toda dirección IPv4 tiene **dos partes**:

- La parte de **RED**: identifica la red (el "barrio" o la "manzana").
- La parte de **HOST**: identifica el dispositivo puntual *dentro* de esa red (la "casa").

`192.168.1.10` con máscara `255.255.255.0` significa: red `192.168.1` + host `.10`. El número que separa las dos partes NO lo dice la dirección: lo dice la **máscara de subred**, que viste por primera vez en el manual de modelos de red — acá la vamos a dominar.

> **Analogía del correo (la que no se te va a olvidar):**
> - La dirección IP es el **domicilio completo**: `Calle del Sol 1234`.
> - La parte de red es **la calle**: `Calle del Sol`.
> - La parte de host es **el número**: `1234`.
> - La máscara de subred es **la regla que dice qué parte es la calle y qué parte es el número**.

### 3.2. Por qué dividir en red + host

Porque si TODOS los dispositivos del planeta estuvieran en una sola red gigante, cada router tendría que saber el camino hasta cada uno de los 4.000 millones de dispositivos — imposible. Al dividir en redes, los routers solo necesitan saber **cómo llegar a la red**, y dentro de la red, el último equipo (el switch, el router local) se encarga de encontrar al host exacto.

### 3.3. La notación del prefijo: /24

La máscara se puede escribir de dos formas equivalentes:

| Forma | Ejemplo |
|-------|---------|
| Decimal punteada | `255.255.255.0` |
| Prefijo (CIDR) | `192.168.1.0/24` |

El `/24` es **la cantidad de bits en 1 de la máscara**: 24 bits de red. `/8` = 8 bits de red, `/16` = 16, `/24` = 24. Cuanto más grande el número del prefijo, más chica la red.

---

## 4. La máscara de subred

### 4.1. Qué es

> **Definición en una línea:** la máscara de subred es un número de 32 bits, igual de largo que la dirección IP, que marca con `1`s la parte de red y con `0`s la parte de host.

En binario, se ve así (para /24):

```
Dirección:  192.168.1.10  →  11000000.10101000.00000001.00001010
Máscara:    255.255.255.0 →  11111111.11111111.11111111.00000000
                              ↑ 24 bits en 1     ↑ 8 bits en 0
                              ←── parte de RED ──→  ← parte de HOST →
```

**Regla de oro:** los `1` de la máscara son consecutivos y van primero. Nunca vas a ver una máscara "trucha" como `11101111...` — los unos van todos juntos al inicio, los ceros al final.

### 4.2. La trampa del 255

`255` es el número engañoso: en binario es `11111111`, ocho unos. Por eso:

- `255.0.0.0` = 8 unos = **/8** → red de 16 millones de hosts (gigantesca)
- `255.255.0.0` = 16 unos = **/16** → red grande
- `255.255.255.0` = 24 unos = **/24** → la red clásica de las casas y oficinas chicas
- `255.255.255.255` = 32 unos = **/32** → un único host (nada de red)

Para saber el prefijo, contá cuántos `1`s tiene la máscara en binario. Para saber la máscara a partir del prefijo, poné ese número de `1`s al principio y completá con `0`s.

### 4.3. Otro truco: el octeto "interesante"

Cuando la máscara NO termina en un octeto entero (ej: `/26` = `255.255.255.192`, `/28` = `255.255.255.240`), el octeto donde aparecen el último `1` y los primeros `0` juntos se llama **octeto interesante**: es ahí donde se juega el cálculo de subredes. El resto de la máscara (los `255`) solo indica "este octeto es 100% red".

---

## 5. Las clases de direcciones: el legado

### 5.1. De dónde salen

Antes de que existiera CIDR (la notación `/24` de hoy), el espacio IPv4 estaba dividido en **clases fijas**: A, B, C (para redes de distinto tamaño), D (multicast) y E (reservada). Se reconocen por los **primeros bits del primer octeto**, o directamente por el rango del primer número.

| Clase | Primeros bits | Primer octeto | Tamaño de red | Tamaño de host | Direcciones por red | Uso |
|-------|:-------------:|---------------|---------------|----------------|--------------------:|-----|
| **A** | `0` | 1 – 126 | 8 bits (N) | 24 bits (H) | 16.777.216 | Redes gigantes (pocas, enormes) |
| **B** | `10` | 128 – 191 | 16 bits (N) | 16 bits (H) | 65.536 | Redes grandes |
| **C** | `110` | 192 – 223 | 24 bits (N) | 8 bits (H) | 256 | Redes chicas (las clásicas de casa/empresa) |
| **D** | `1110` | 224 – 239 | — | — | — | Multicast (grupos, no hosts) |
| **E** | `1111` | 240 – 255 | — | — | — | Reservada para experimentación |

Fijate que el 127 no aparece: **todo `127.x.x.x` es loopback** (la propia máquina).

### 5.2. La notación de letras: N, n, H, h

Una convención clásica para visualizar las partes:

| Clase | Estructura |
|-------|-----------|
| A | **N**.H.H.H (red de 1 octeto, host de 3) |
| B | **N**.N.H.H (red de 2 octetos, host de 2) |
| C | **N**.N.N.H (red de 3 octetos, host de 1) |

Ejemplo clase C: en `192.168.1.10` la red es `192.168.1` y el host es `.10`. En clase B, `172.16.5.9` → red `172.16`, host `5.9`.

### 5.3. Por qué hoy se usa CIDR y no clases

Las clases eran un molde rígido: tu empresa tenía 300 dispositivos → clase B (65.536 direcciones) era demasiado, clase C (256) no alcanzaba. **Desperdicio o escasez, siempre.** Con CIDR se puede tener `192.168.1.0/25` (128 direcciones), `/26` (64), `/27` (32)… cualquier tamaño. Por eso las clases son historia, pero las seguís viendo en exámenes y material viejo — y porque la notación N/H viene de ahí.

> **Regla rápida para clasificar:** mirá solo el primer octeto. ¿1 a 126? Clase A. ¿128 a 191? B. ¿192 a 223? C. ¿224 a 239? D. ¿240+? E. 15 segundos, sin calculadora.

---

## 6. Direcciones especiales y privadas

### 6.1. Las direcciones que NO se usan como host

| Dirección | Propósito |
|-----------|-----------|
| `0.0.0.0` | "Esta red de momento" — no se usa como destino; significa "cualquier red" en configuraciones |
| `127.0.0.0/8` | **Loopback**: siempre apunta a la propia máquina. `127.0.0.1` es "yo mismo" |
| `169.254.0.0/16` | **Link-local (APIPA)**: la IP que se pone sola el equipo cuando no consigue una por DHCP |
| `224.0.0.0/4` | **Multicast**: envío a un grupo, no a una dirección puntual |
| `255.255.255.255` | **Broadcast limitado**: llega a todas las interfaces de la red local |

> **El dato que te salva un diagnóstico:** si tu notebook tiene una IP `169.254.x.x`, no es que haya "elegido" esa dirección: es que **el DHCP no le contestó** y se la autoasignó. Eso grita "problema de conexión con el servidor de IPs", no de tu placa.

### 6.2. Las direcciones privadas: el barrio cerrado

Hay tres rangos reservados para **redes privadas**: cualquiera puede usarlos adentro de su red, y los routers de internet **no los enrutan** (no salen al mundo). Gracias a ellos, todos los routers de casas del planeta usan `192.168.x.x` sin pisarse entre sí.

| Rango | Notación CIDR | De dónde viene |
|-------|---------------|----------------|
| `10.0.0.0` – `10.255.255.255` | `10.0.0.0/8` | El clásico de redes empresariales grandes |
| `172.16.0.0` – `172.31.255.255` | `172.16.0.0/12` | Empresas medianas |
| `192.168.0.0` – `192.168.255.255` | `192.168.0.0/16` | El de las casas y oficinas chicas |

Fijate el detalle fino: el rango privado de la clase B **no es todo el 172**: es solo de `172.16` a `172.31`. `172.32.0.0` ya es pública.

> **Cómo salen las privadas a internet:** cuando un paquete de tu casa (`192.168.1.10`) quiere llegar a Google, tu router le cambia la dirección de origen por la **pública** que te dio el proveedor. Ese cambio se llama NAT y es el tema de un manual entero — acá solo necesitás saber que las privadas existen y que sin esa traducción no saldrían de tu red.

### 6.3. Privada vs pública: la regla en una línea

| | Privada | Pública |
|---|---|---|
| La asigna | Tu red (el router/DHCP) | El proveedor de internet (o el registro regional) |
| ¿Se enruta por internet? | NO | SÍ |
| ¿Puedo elegirla yo? | Sí (dentro de los rangos) | No (son únicas y asignadas) |
| Ejemplo | `192.168.1.10` | `181.164.5.2` |

---

## 7. Dirección de red y dirección de broadcast: los dos bordes

### 7.1. Cada red tiene DOS direcciones que no son de ningún host

En toda red, la primera y la última dirección están reservadas:

- **Dirección de RED**: todos los bits de host en `0`. Es la "esquina de la cuadra": identifica a la red entera cuando hablamos de ella.
- **Dirección de BROADCAST**: todos los bits de host en `1`. Es el "megáfono del barrio": el mensaje que se manda a esa dirección lo reciben TODOS los hosts de la red.

Por eso los hosts utilizables son siempre **el total menos 2**.

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

- Direcciones totales: 2⁸ = **256**
- Hosts utilizables: 256 − 2 = **254**
- El host `.1` es casi siempre el router, pero es una convención, no una regla.

### 7.3. Cómo se calcula en binario (para no memorizar)

Con `192.168.1.10/24`:

```
Hosts:  .10  = 11001010   ← bits de host (los últimos 8)
Red:    .0   = 00000000   ← poner todos los bits de host en 0
Broadcast: .255 = 11111111 ← poner todos los bits de host en 1
```

Poner todos los bits de host en 0 te da la red; ponerlos todos en 1 te da el broadcast. Esa es LA operación. Todo el resto del manual es practicar esta misma idea con redes más chicas.

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

### 8.2. La operación: tomar bits prestados

Subdividir es **tomar bits de la parte de host y transformarlos en bits de red**.

- Cada bit prestado **duplica** la cantidad de subredes: 1 bit → 2 subredes, 2 bits → 4, 3 bits → 8.
- Pero cada bit prestado **reduce a la mitad** los hosts por subred.

Las dos fórmulas que hay que saber:

```
Cantidad de subredes = 2^bits prestados (s)
Hosts por subred     = 2^bits de host restantes (h) − 2
```

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

Cada subred se comporta como una red independiente: su propia dirección de red, su propio broadcast, sus propios 62 hosts.

### 8.4. La regla del tamaño del bloque

Para saber de cuánto en cuánto saltan las subredes hay un atajo que usan todos los profesionales:

> **Tamaño del bloque = 256 − último octeto de la máscara.**

- Máscara `/26` = `255.255.255.192` → bloque de 256 − 192 = **64**
- Máscara `/27` = `255.255.255.224` → bloque de **32**
- Máscara `/28` = `255.255.255.240` → bloque de **16**

Con eso, armás todos los rangos sin tocar binario — pero recién después de haber entendido el binario, que es lo que te salva cuando la máscara no cae en octeto entero.

### 8.5. Comunicación entre subredes

Dos subredes distintas **no se ven entre sí sin un router**. El router es el que tiene una interfaz en cada subred y reenvía los paquetes de una a otra — por eso cada subred termina en el gateway (la IP del router en ESE barrio). Si las subredes tienen que comunicarse, el tráfico pasa por el router: ahí es donde se controla, se filtra y se cobra peaje.

### 8.6. Redes punto a punto

Cuando solo conectás DOS equipos (un router con otro router), usar una subred entera es desperdicio. Se usa un **/30** (2 hosts) o en la práctica moderna un **/31** (2 hosts, sin broadcast):

```
192.168.1.0/30 → red .0, hosts .1 y .2, broadcast .3
```

El /31 existe porque un enlace de 2 equipos no necesita red ni broadcast: se usan las dos direcciones directamente.

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

---

## 10. El cálculo práctico en 4 pasos

### 10.1. El método

Cuando te den una IP y un prefijo y necesites red, broadcast, primer y último host, el método es siempre el mismo:

1. **Ubicá el octeto interesante** (donde la máscara no es 255 ni 0).
2. **Calculá el tamaño del bloque**: `256 − valor del octeto en la máscara`.
3. **Encontrá la red**: el múltiplo del bloque más cercano, menor o igual a la IP.
4. **Completá**: broadcast = red + bloque − 1; hosts = red+1 hasta broadcast−1.

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

**Paso 5 (la verificación):** ¿la IP original cae entre primer y último host? 137 sí. ✓

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

> **HACELO VOS:** agarrá papel y lápiz y resolvé `192.168.10.99/27` con el método de 4 pasos. Después compará con el final de esta sección (la respuesta está al pie, tapada).

<details>
<summary>Respuesta del ejercicio</summary>

/27 = 255.255.255.224 → bloque 32 → múltiplos: 64, 96, 128… → 99 está entre 96 y 128 → red `192.168.10.96`, primer host `.97`, último host `.126`, broadcast `.127`.
</details>

---

## 11. IPv6: lo que tenés que saber

### 11.1. Por qué existe

IPv4 tiene 4.300 millones de direcciones, pero el mundo tiene más dispositivos que eso. Los últimos bloques grandes de IPv4 se agotaron en 2011. IPv6 nació para eso: **128 bits, más direcciones que átomos en la superficie de la Tierra** (exageramos poco: hay 3,4 × 10³⁸, y se estiman ~10³⁰ átomos en un planeta).

### 11.2. Cómo se lee

Ocho grupos de 4 dígitos hexadecimales, separados por dos puntos:

```
2001:0db8:0000:0000:0000:ff00:0042:8329
└─┬─┘└─┬─┘  └──┬──┘ └──┬──┘  └──┬──┘  └──┬──┘
 grupo1 grupo2  ...    ...    ...    grupo8 → 8 grupos × 16 bits = 128 bits
```

### 11.3. Las dos reglas de abreviatura

1. **Ceros iniciales se eliminan**: `0db8` → `db8`, `0042` → `42`. (Ojo: los ceros *finales* NO se tocan: `0080` no es `8`, es `80`.)
2. **Un solo bloque de ceros consecutivos se comprime con `::`** (una sola vez por dirección):

```
2001:0db8:0000:0000:0000:ff00:0042:8329
→ 2001:db8::ff00:42:8329

::1    → la dirección de loopback (antes: 0000…0001)
```

### 11.4. Lo que SÍ tenés que saber para trabajar

| Dato | Valor |
|------|-------|
| Privadas | `FC00::/7` (**ULA**): no se enrutan por internet, como los privados de IPv4 |
| Loopback | `::1` (equivalente a `127.0.0.1`) |
| Tamaño típico de subred | **/64** — las subredes IPv6 casi siempre son de 64 bits de red y 64 de host |
| Enlace punto a punto | /127 (equivalente moderno del /30) |

En IPv6, la idea de red+host es la misma que en IPv4, pero con números tan enormes que "ahorrar direcciones" dejó de ser una preocupación: cada subred /64 tiene 2⁶⁴ hosts, más que toda internet IPv4 junta.

---

## 12. DHCP: de dónde sale tu IP

### 12.1. Cargar IPs a mano: insostenible

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

El DHCP no te da solo la IP: te da también la **máscara**, el **gateway** (la IP del router para salir) y el **DNS** (para resolver nombres). Todo lo que tu equipo necesita para vivir, en un solo servicio.

### 12.3. Cuando DHCP no contesta

Si el equipo no recibe respuesta (cable cortado, servidor caído), se autoasigna una dirección del rango `169.254.0.0/16` — la **APIPA**. Es la "IP de emergencia": sirve para comunicarse con equipos de la misma red que también fallaron, pero NO da acceso a nada más. Si ves un `169.254.x.x`, ya sabés: problema de DHCP.

---

## 13. La resolución de nombres: DNS

### 13.1. El problema

Recordar `142.250.64.14` es imposible; recordar `google.com`, no. El **DNS** (*Domain Name System*) es el traductor: convierte los nombres que usamos (`google.com`) en las direcciones IP que usa la red.

### 13.2. Cómo funciona en una línea

Tu equipo le pregunta al servidor DNS (el "directorio de internet"): *"¿qué IP tiene google.com?"* — y el servidor responde con la dirección. Después, todos los paquetes usan la IP.

Esto explica un síntoma clásico: "tengo internet pero no abre ninguna página". Si el `ping` a una IP funciona pero el navegador no carga, sospechá del DNS: el camino existe, lo que falla es el traductor.

---

## 14. Tu IP en la práctica

### 14.1. Mirá tu propia configuración

Abrí una terminal y corré el comando de tu sistema:

```
Windows:  ipconfig /all
Linux:    ip addr
```

Vas a ver algo así:

```
IPv4 Address. . . . . . . . . . . : 192.168.1.10
Subnet Mask . . . . . . . . . . . : 255.255.255.0
Default Gateway . . . . . . . . . : 192.168.1.1
DNS Servers . . . . . . . . . . . : 8.8.8.8
```

Ahora sabés leerlo como un profesional:

- **IPv4**: tu dirección en la red local.
- **Máscara**: 255.255.255.0 = /24 = tu red es `192.168.1.0` y hay 254 hosts posibles.
- **Gateway**: la IP del router, la puerta de salida a internet. Tu equipo manda ahí todo lo que no es local.
- **DNS**: el traductor que se usa para resolver nombres.

### 14.2. Comprobá que tu red y tu broadcast dan bien

Con `192.168.1.10/24`: red = `192.168.1.0` (hosts en 0), broadcast = `192.168.1.255` (hosts en 1). Coincide con lo que viste en la sección 7 — la teoría y la práctica son la misma cuenta.

---

## 15. Comprobá lo que aprendiste

Respondé antes de mirar, y destapá cada respuesta recién después de intentarlo.

**1. ¿Cuánto vale `10110000` en decimal?**
<details>
<summary>Ver respuesta</summary>

128 + 32 + 16 = **176**. (Posiciones con 1: 128, 64, 32, 16, 8, 4, 2, 1 → 1,0,1,1,0,0,0,0 → 128+32+16.)
</details>

**2. ¿Qué parte de la dirección es red y cuál host en `172.16.5.9/16`?**
<details>
<summary>Ver respuesta</summary>

/16 = 16 bits de red → red `172.16`, host `5.9`. Con /12 (la máscara privada de clase B), la cuenta sería distinta: red `172.16`, host `5.9` también, pero por otras razones — el límite cae a la mitad del 2º octeto.
</details>

**3. ¿Por qué una red /24 tiene 254 hosts y no 256?**
<details>
<summary>Ver respuesta</summary>

Porque la primera dirección es la de red (bits de host en 0) y la última es el broadcast (bits de host en 1). Hosts utilizables = 2⁸ − 2 = **254**.
</details>

**4. ¿Cuál es la dirección de red, broadcast y los hosts de `10.10.10.5/28`?**
<details>
<summary>Ver respuesta</summary>

/28 = 255.255.255.240 → bloque de 16 → múltiplos: 0, 16, 32… → red `10.10.10.0`, broadcast `10.10.10.15`, hosts `.1` a `.14`.
</details>

**5. ¿Qué significan estas direcciones: `127.0.0.1`, `169.254.1.5`, `255.255.255.255`?**
<details>
<summary>Ver respuesta</summary>

`127.0.0.1`: loopback, la propia máquina. `169.254.1.5`: link-local/APIPA, autoasignada porque el DHCP no contestó. `255.255.255.255`: broadcast limitado, llega a todos los equipos de la red local.
</details>

**6. Tu empresa tiene 500 equipos y te dan `10.0.0.0/23`. ¿Alcanza?**
<details>
<summary>Ver respuesta</summary>

/23 = 512 direcciones, 510 hosts utilizables. **Sí, alcanza justito** (500 ≤ 510). Si fueran 520, haría falta /22 (1022 hosts).
</details>

**7. ¿Qué es el octeto interesante y cuál es en `192.168.50.77/22`?**
<details>
<summary>Ver respuesta</summary>

Es el octeto donde conviven el último 1 y los primeros 0 de la máscara — ahí se juega el cálculo de subredes. En /22 = 255.255.252.0 es el **3º octeto** (252).
</details>

**8. ¿Qué tan grande es una subred IPv6 típica?**
<details>
<summary>Ver respuesta</summary>

/64: 64 bits de red y 64 de host, es decir 2⁶⁴ direcciones posibles — más que todos los equipos de internet IPv4 actual. El desperdicio dejó de ser un problema en IPv6.
</details>

---

## 16. Glosario

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

---

## 17. Resumen en 10 puntos

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

---

> **Fuente:** Documentación propia basada en RFC 791, RFC 1918, RFC 4291 y material educativo de redes.

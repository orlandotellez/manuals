# 10. Análisis de Direcciones IPv4 (Ejercicios Guiados)

Este no es un manual de lectura: es un cuaderno de ejercicios. Vas a sentarte con lápiz y papel, vas a tomar nueve direcciones IPv4 y, para cada una, vas a sacar siempre los mismos seis datos: la notación, la máscara, la dirección de red, el broadcast, la cantidad de hosts y el rango de hosts.

La diferencia con un libro de teoría: acá no alcanza con leer y decir "sí, tiene sentido". Tenés que poder tapar la respuesta, resolver el ejercicio y llegar solo al mismo número. Por eso el manual va del método al ejemplo resuelto, y de ahí al ejercicio con la respuesta a un costado.

### ¿Qué problema resuelve todo esto?

Una computadora tiene una dirección IPv4 y una máscara. Con esos dos datos y nada más, vos podés responder preguntas que en el trabajo real aparecen todo el tiempo:

- ¿Este equipo puede hablar con aquel, o necesitan un router en el medio?
- ¿Qué direcciones le puedo dar a los otros equipos de esta red sin pisar la mía?
- ¿Cuál es la última dirección de esta red? (esa que el switch usa para mandar un mensaje a todos).
- ¿Cuántos equipos entran acá? ¿Alcanza para la oficina entera?

Todo eso sale de una cuenta de treinta segundos. El problema es que nadie te enseña la cuenta: te enseñan la definición de máscara y te mandan a producir. Este manual es la cuenta, paso por paso, hecha en voz alta, nueve veces.

### La analogía que vamos a usar todo el tiempo

Pensá en un edificio con varios pisos. La **dirección IPv4** es el domicilio completo: calle, número, piso, departamento. La **máscara de subred** es la información de dónde termina la calle y empieza el departamento: es la parte que te dice "todo lo que comparte la calle es el mismo barrio; el departamento es lo que identifica a cada vecino".

Sobre esa imagen se construye todo lo demás:

- La primera dirección del barrio (la del portón, digamos) es la **dirección de red**.
- La última (el altavoz del consorcio) es el **broadcast**: un mensaje dirigido ahí llega a todos los vecinos.
- Las del medio son los **hosts utilizables**: los departamentos de verdad, donde vive gente.

Nadie vive en el portón ni en el altavoz. Por eso a la cuenta total siempre se le restan dos.

---

## Índice

- [Qué necesitás tener fresco](#1-qué-necesitás-tener-fresco)
- [La caja de herramientas: binario rápido](#2-la-caja-de-herramientas-binario-rápido)
- [El método en 6 pasos](#3-el-método-en-6-pasos)
- [El atajo de los profesionales: la regla del bloque](#4-el-atajo-de-los-profesionales-la-regla-del-bloque)
- [La tabla de ejercicios](#5-la-tabla-de-ejercicios)
- [Soluciones paso a paso](#6-soluciones-paso-a-paso)
- [Tabla consolidada](#7-tabla-consolidada)
- [Errores comunes](#8-errores-comunes)
- [Ejercicios para practicar solo](#9-ejercicios-para-practicar-solo)
- [Resumen de fórmulas](#10-resumen-de-fórmulas)
- [Comprobá lo que aprendiste](#11-comprobá-lo-que-aprendiste)
- [Glosario](#12-glosario)
- [Resumen en 10 puntos](#13-resumen-en-10-puntos)

---

## 1. Qué necesitás tener fresco

Este manual es pura práctica: vas a tomar direcciones IPv4 y sacarles la **red**, el **broadcast** y el **rango de hosts** — el análisis que un profesional hace mil veces en su vida. La buena noticia: todo se reduce a UNA idea.

> **La idea madre:** una dirección IP tiene dos partes. La **red** (el barrio) y el **host** (la casa). La **máscara** marca dónde termina una y empieza la otra. Cuando los bits de host quedan todos en `0` → es la **dirección de red**. Cuando quedan todos en `1` → es el **broadcast**. Lo del medio: **hosts utilizables**.

Tres datos que van a aparecer en cada ejercicio:

- El **prefijo** `/n` te dice cuántos bits son de red. `/24` = 24 bits de red, 8 de host.
- **Cuántos más bits de red, menos hosts** puede haber, y al revés.
- Los hosts utilizables siempre son `2^bits de host − 2` (se descuentan red y broadcast).

### El vocabulario mínimo, en criollo

Antes de arrancar, seis palabras. Si no tenés claras estas seis, los ejercicios se vuelven memorización y no se te quedan.

**IP** significa *Internet Protocol*, Protocolo de Internet: es el conjunto de reglas con las que las computadoras se mandan paquetes. Una **dirección IP** es el número que identifica a cada equipo dentro de esa conversación. Nadie te la inventa a mano en internet: te la da un proveedor o un servidor de DHCP. Pero en una red interna, configurarla bien o mal está en tus manos, y ahí es donde duele.

**IPv4** es la versión 4 de ese protocolo. Su dirección son 32 bits, escritos como cuatro números separados por puntos. Cada uno de esos números se llama **octeto**, porque son exactamente 8 bits. Por eso cada octeto va de 0 a 255: no hay forma de escribir 256 con ocho bits.

**Máscara de subred**: otro número de 32 bits, siempre con unos a la izquierda y ceros a la derecha. Su único trabajo es decir "hasta acá llega la red". Una máscara típica es `255.255.255.0`.

**Prefijo** o **CIDR**: la forma corta de escribir la máscara. *CIDR* viene de *Classless Inter-Domain Routing*, enrutamiento sin clases, la notación que reemplazó a las viejas clases A/B/C. En vez de escribir `255.255.255.0` escribís `/24`, que se lee "veinticuatro bits de red". Las dos cosas son lo mismo y en los ejercicios vas a pasar de una a la otra todo el tiempo.

**Host**: cualquier equipo que tiene una dirección y no es infraestructura de la red. Una PC, una impresora, una cámara, la pata de un router que da a la LAN. En estos ejercicios, "host" es sinónimo de "lugar donde puede ir una dirección utilizable".

**Broadcast**: la dirección con la que se le habla a todos los hosts de la subred a la vez. Un mensaje dirigido al broadcast lo recibe todo el barrio. Existe uno por subred, siempre es la última dirección, y por eso no se le puede asignar a un equipo.

---

## 2. La caja de herramientas: binario rápido

El análisis de subredes se hace EN BINARIO, no en decimal. La única herramienta que necesitás es la tabla de potencias de un octeto:

```
 128   64   32   16    8    4    2    1   ← valor de cada posición
```

Leé esta línea de izquierda a derecha y mirá qué es cada cosa. Hay ocho columnas porque un octeto tiene ocho bits. Cada columna tiene un valor fijo, y esos valores son las potencias de dos, de la más grande a la más chica: 128, 64, 32, 16, 8, 4, 2, 1. La flecha de la derecha es solo una anotación del original, un comentario que te recuerda que esos números son el valor de cada posición, no datos de una red.

La regla es una sola: **cada posición está encendida o apagada**. Un bit vale `1` y aporta su valor, o vale `0` y no aporta nada. No hay medios bits ni valores intermedios. Si memorizás esa fila de ocho números, ya tenés el 80 % del manual resuelto, porque todo lo demás es sumar.

Para convertir un número, sumá los valores de las posiciones con `1`:

```
  1    0    1    1    0    0    0    0   = 128 + 32 + 16 = 176
```

Acá está la cuenta hecha en voz alta: la primera posición vale 128 y está encendida, así que sumamos 128. La segunda (64) está apagada, no suma. La tercera (32) está encendida: 128 + 32 = 160. La cuarta (16) está encendida: 160 + 16 = 176. Las cuatro últimas (8, 4, 2, 1) están apagadas, no suman nada. Total: **176**. Ese número es el valor decimal del octeto `10110000`.

Y ojo con dos valores que aparecen en TODOS los ejercicios:

```
00000000 = 0       10000000 = 128       11000000 = 192
11100000 = 224      11110000 = 240       11111000 = 248
11111100 = 252      11111111 = 255
```

Esa lista es la máscara del cuarto octeto para /25, /26, /27, /28, /29, /30 y /24. Si la memorizás, la mitad del trabajo ya está.

Leela con cuidado, porque acá se concentra el 90 % de los errores de todo el mundo. Cada línea trae un patrón de bits y su valor decimal. La primera línea arranca con el octeto todo en cero (0), sigue con un solo uno a la izquierda (128) y después con dos unos (192). La segunda línea: tres unos (224), cuatro unos (240), cinco unos (248). La tercera: seis unos (252) y los ocho unos (255).

Mirá la forma: **los unos siempre entran por la izquierda y son consecutivos**. Nunca vas a ver `11010000` en una máscara. Si en tu cuenta aparece un patrón con un cero en el medio de los unos, no es una máscara: es un error.

### Cómo convertir decimal a binario a mano, sin calculadora

El camino largo es el que sirve para aprender, y es el que vas a usar los primeros días. Se hace restando potencias de dos, de mayor a menor:

1. ¿Entra 128 en el número? Si sí, escribís `1` y restás 128. Si no, escribís `0`.
2. Repetís con 64, 32, 16, 8, 4, 2, 1.
3. Cuando el resto llega a 0, el resto de las posiciones son ceros.

Probemos con 227, que aparece en el ejercicio 3. 128 entra: `1`, resto 99. 64 entra: `1`, resto 35. 32 entra: `1`, resto 3. 16 no entra: `0`. 8 no entra: `0`. 4 no entra: `0`. 2 entra: `1`, resto 1. 1 entra: `1`, resto 0. Resultado: `11100011`. Y si sumás 128 + 64 + 32 + 2 + 1 te da 227. Listo.

El mismo método con 117, del ejercicio 6: 128 no entra (`0`), 64 entra (`1`, resto 53), 32 entra (`1`, resto 21), 16 entra (`1`, resto 5), 8 no entra (`0`), 4 entra (`1`, resto 1), 2 no entra (`0`), 1 entra (`1`, resto 0). Resultado: `01110101`. Suma: 64 + 32 + 16 + 4 + 1 = 117.

### El error de binario que arruina todo

Hay un par de valores que se confunden siempre, y conviene decirlos juntos antes de que aparezcan:

- `11111111` = **255** (ocho unos).
- `11111110` = **254** (siete unos y un cero al final).
- `11111100` = **252** (seis unos y dos ceros).

La diferencia entre 255 y 254 es un solo bit, y cambia la máscara entera. Cuando escribas una máscara, contá los unos: tienen que ser exactamente los del prefijo. Si el prefijo es `/26`, tiene que haber 26 unos y ningún cero en el medio de ellos.

---

## 3. El método en 6 pasos

El orden exacto para resolver cualquier ejercicio, siempre igual:

| Paso | Qué hacés | Resultado |
|------|-----------|-----------|
| 1 | Leé el prefijo `/n` | Bits de red (n) y bits de host (h = 32 − n) |
| 2 | Escribí la **notación** N/n/H/h | La "radiografía" de la dirección |
| 3 | Poné `n` unos consecutivos y pasalo a decimal | Máscara de subred |
| 4 | Poné todos los bits de host en `0` | Dirección de red |
| 5 | Poné todos los bits de host en `1` | Dirección de broadcast |
| 6 | Sumá 1 a la red y restá 1 al broadcast | Rango de hosts (y cant. = 2^h − 2) |

Esta tabla es el corazón del manual: es el procedimiento completo, en seis renglones. Cada fila te dice qué hacés y qué obtenés, y las seis se hacen siempre en ese orden, sin saltear ninguna.

Recorré las filas una por una:

**Fila 1 — el prefijo.** Lo único que hacés es leer el número que va después de la barra y restarlo de 32. Si el prefijo es `/26`, tenés 26 bits de red y 32 − 26 = 6 bits de host. Ese 6 es el número más importante de todo el ejercicio: de él salen el tamaño del bloque y la cantidad de hosts.

**Fila 2 — la notación.** Traducís el prefijo a una "radiografía" hecha de letras. No es un adorno: es lo que evita que te equivoques después, porque te obliga a ver en qué octeto cae el corte. Lo vemos en detalle en el próximo apartado.

**Fila 3 — la máscara.** Escribís `n` unos seguidos y rellenás con ceros hasta llegar a 32 bits. Agrupás de a ocho y convertís cada grupo a decimal. El resultado es la máscara de subred. Para `/26` son 26 unos: `11111111.11111111.11111111.11000000`, o sea `255.255.255.192`.

**Fila 4 — la red.** Tomás la dirección original, dejás intactos los bits de red y ponés en `0` todos los bits de host. Lo que queda es la primera dirección de la subred. Es la dirección del "barrio".

**Fila 5 — el broadcast.** Mismo corte, pero los bits de host ahora van todos en `1`. Lo que queda es la última dirección de la subred. Es el "altavoz del consorcio".

**Fila 6 — el rango.** Sumás 1 a la red y restás 1 al broadcast. Ese par de números es lo que podés repartir entre equipos. La cantidad sale de la cuenta `2^h − 2`.

Un detalle que parece cosmético y no lo es: **los pasos 4 y 5 usan el mismo corte**. Si en el paso 4 te quedaste con tres bits de red, en el paso 5 también son tres. Cuando la red y el broadcast no comparten el corte, uno de los dos está mal, siempre.

### La notación N/n/H/h

Se usa para "ver" la división de un vistazo:

| Símbolo | Significado |
|---------|-------------|
| `N` | Un octeto COMPLETO de red (8 bits) |
| `n` | Un bit individual de red |
| `H` | Un octeto COMPLETO de host (8 bits) |
| `h` | Un bit individual de host |

Esta tabla es un alfabeto de cuatro letras, nada más. La lógica es simple: la letra mayúscula representa un octeto entero (ocho bits del mismo tipo), la minúscula representa un bit suelto. `N` es un octeto que es todo red; `n` es un bit de red dentro de un octeto mezclado. Lo mismo con `H` y `h` para el lado del host.

Para qué sirve: cuando escribís la notación, contás los bits sin darte cuenta. Si tu notación suma el prefijo, el corte está bien. Si no suma, te equivocaste de octeto. Ese control gratuito es la razón por la que este paso existe.

Los puntos separan octetos reales; dentro de un octeto que mezcla red y host, los `n` y `h` se escriben juntos, sin punto.

```
/24  →  N.N.N.H         (los 3 primeros octetos son red, el último es host)
/26  →  N.N.N.nnhhhhhh  (2 bits de red + 6 de host en el 4º octeto)
/23  →  N.N.nnnnnnnh.H  (7 bits de red + 1 de host en el 3er octeto, y el 4º completo de host)
```

Leé los tres ejemplos con el alfabeto al lado. En `/24` hay tres octetos `N` completos y uno `H` completo: 8 + 8 + 8 = 24 bits de red, y 8 de host. En `/26` hay tres octetos `N` (24 bits) y en el cuarto dos `n` más seis `h`: 24 + 2 = 26 de red, 6 de host. En `/23` hay dos octetos `N` (16 bits), en el tercero siete `n` y una `h` (7 + 1), y el cuarto entero `H` de host: 16 + 7 = 23 de red, y 1 + 8 = 9 de host.

Ese último es el que más confunde, así que lo repetimos: en `/23` el corte **no** cae en el cuarto octeto, cae en el tercero, y por eso el cuarto octeto es todo host (`H`, mayúscula). Si escribís `N.N.N.hhhhhhhh` para una `/23` te están sobrando bits: esa notación suma 24 de red, no 23.

### Ejemplo guiado, completo: 209.165.202.140/27

Antes de los nueve ejercicios, resolvemos uno entero juntos. Este ejemplo es el que vas a imitar en todos los demás, y la dirección es la misma que después aparece como ejercicio 8: si te sale ahora, después lo resolvés solo en dos minutos.

**Paso 1 — Prefijo.** `/27` → 27 bits de red, h = 32 − 27 = **5 bits de host**.

La resta 32 − 27 es la única cuenta del paso 1. Cinco bits de host quiere decir que el bloque tiene 2⁵ = 32 direcciones, y que los hosts utilizables son 30. Ya sabemos el tamaño antes de tocar la dirección.

**Paso 2 — Notación.** 27 = 3 octetos completos (24) + 3 bits en el cuarto octeto. El cuarto octeto queda de 3 bits de red + 5 de host:

```
N.N.N.nnnhhhhh
```

Contá las letras: tres `N` son 24 bits, tres `n` son 3, total 27. Y cinco `h` cierran el octeto: 3 + 5 = 8. La notación cierra por los dos lados: suma el prefijo y completa el octeto. Ese doble control es lo que la hace confiable.

**Paso 3 — Máscara.** 27 unos:

```
11111111.11111111.11111111.11100000  =  255.255.255.224
```

Los primeros tres octetos son ocho unos cada uno: 255, 255 y 255. El cuarto tiene tres unos y cinco ceros, o sea `11100000`. Ese patrón está en la lista de memoria del capítulo 2: vale **224**. Máscara completa: `255.255.255.224`. Y si contás los unos de la máscara te dan 27, igual que el prefijo: bien.

**Paso 4 — Dirección de red.** Poné los 5 bits de host en `0`. El cuarto octeto de la IP (140) en binario es `10001100`. Conservando los 3 bits de red (`100`), los 5 restantes en 0:

```
10000000 = 128   →   red = 209.165.202.128
```

Acá está la cuenta hecha despacio. El 140 en binario es `10001100`: 128 + 8 + 4 = 140. Ese octeto tiene ocho bits; los tres primeros son de red y los cinco últimos de host. Los tres primeros son `100`, y no se tocan nunca. Los cinco últimos (`01100`) los apagamos todos: `00000`. El octeto queda `10000000`. Ese patrón tiene un solo uno, en la posición de 128: vale 128. Los otros tres octetos de la dirección también son de red, así que quedan tal cual: 209, 165, 202. Red = `209.165.202.128`.

**Paso 5 — Broadcast.** Mismos 3 bits de red, pero ahora los 5 bits de host en `1`:

```
10011111 = 159   →   broadcast = 209.165.202.159
```

Otra vez: los tres bits de red siguen siendo `100`, y los cinco de host ahora son `11111`. El octeto queda `10011111`. Para pasarlo a decimal sumamos las posiciones encendidas: 128 + 16 + 8 + 4 + 2 + 1 = 159. El broadcast es `209.165.202.159`.

Mirá lo que pasó entre el paso 4 y el paso 5: el octeto pasó de 128 a 159. La diferencia es 31, que es exactamente el bloque menos uno (32 − 1). Esa es la forma rápida de chequear el broadcast: red + bloque − 1.

**Paso 6 — Rango.** De red + 1 a broadcast − 1:

```
Primer host:    209.165.202.129
Último host:    209.165.202.158
Cantidad: 2⁵ − 2 = 30 hosts
```

El primer host es la red más uno: 128 + 1 = 129. El último es el broadcast menos uno: 159 − 1 = 158. Y la cantidad es 2⁵ − 2 = 32 − 2 = 30. Si contás de 129 a 158 inclusive te dan 30 números: 158 − 129 + 1 = 30. La cuenta cierra por los tres lados.

> **Verificación rápida:** 140 cae entre 129 y 158 → la IP original vive en esta subred. Si la IP no cayera en el rango, hay un error en la cuenta.

Fijate que la verificación no es un trámite: es el único control de calidad del método. Vos partiste de la dirección 140 y llegaste a un rango que va de 129 a 158. Si el 140 no está adentro, alguna de las seis cuentas está mal y hay que volver. En los nueve ejercicios que siguen, esta línea de control se repite siempre.

---

## 4. El atajo de los profesionales: la regla del bloque

Para no convertir a binario en cada ejercicio, existe el atajo que usa todo el mundo:

> **Tamaño del bloque = 2^(bits de host)** — el número total de direcciones de la subred. Y en el octeto donde cae el límite, las subredes saltan de a ese valor.

Pero hay una segunda versión, más rápida todavía, que funciona cuando el límite está en el cuarto octeto:

> **Bloque = 256 − valor del cuarto octeto de la máscara.**

Para `/28` (máscara `…240`): 256 − 240 = **16**. Para `/26` (`…192`): 256 − 192 = **64**. Las dos fórmulas dan lo mismo — elegí la que prefieras.

Antes de seguir, entendamos por qué funcionan, porque una fórmula que no se entiende se olvida el lunes. Un bloque es un pedazo de la recta de direcciones. Si tenés 8 bits de host, ese pedazo mide 2⁸ = 256 direcciones: la subred entera. Si tenés 4 bits de host, mide 2⁴ = 16. **Cada bit de host que perdés parte el pedazo en dos**, así que el bloque se hace la mitad.

La segunda fórmula es la misma cuenta vista desde la máscara. Si el cuarto octeto de la máscara vale 240, eso son cuatro unos y cuatro ceros: cuatro bits de host, o sea 2⁴ = 16. Y 256 − 240 = 16. La resta funciona porque 256 es el tamaño del octeto completo y la máscara te dice cuánto ya está ocupado por la red.

**Cómo se usa:** dividís el octeto relevante de la IP por el bloque, truncás, y multiplicás de nuevo:

```
192.168.28.45/28   →  bloque 16
45 ÷ 16 = 2 (truncado)   →   2 × 16 = 32
Red = 192.168.28.32      →  Broadcast = 32 + 16 − 1 = 47 → 192.168.28.47
```

Leé las tres líneas en orden, porque acá está el atajo completo en tres pasos. La primera línea identifica el caso: la dirección es `.45` y el bloque es 16. La segunda hace la cuenta clave: 45 dividido 16 da 2,8125, y **truncamos**, o sea nos quedamos con el 2 y tiramos los decimales. Multiplicamos 2 × 16 = 32, que es el múltiplo de 16 inmediatamente menor o igual a 45. La tercera línea usa ese 32 como red y suma el bloque menos uno para obtener el broadcast: 32 + 16 − 1 = 47.

¿Por qué se trunca y no se redondea? Porque las subredes son bloques fijos que arrancan en múltiplos del tamaño. La dirección 45 no "está más cerca" de 48: está **dentro** del bloque que empieza en 32 y termina en 47. Redondear hacia arriba te pondría en otra subred, que es exactamente el error que hay que evitar.

El atajo tiene un requisito: saber en qué octeto cae el corte. Si el prefijo es mayor que 24, es el cuarto; si está entre 16 y 24, el tercero. Y la resta `256 − máscara` solo vale en ese octeto, el único donde la máscara no es ni 0 ni 255.

**La tabla completa de bloques** (memorizá la que uses seguido):

| Prefijo | Bits de host | Hosts utilizables | Total de direcciones (bloque) | Dónde salta |
|:-------:|:------------:|:-----------------:|:-----------------------------:|-------------|
| /24 | 8 | 254 | 256 | 4º octeto entero |
| /25 | 7 | 126 | 128 | 4º octeto, de a 128 |
| /26 | 6 | 62 | 64 | 4º octeto, de a 64 |
| /27 | 5 | 30 | 32 | 4º octeto, de a 32 |
| /28 | 4 | 14 | 16 | 4º octeto, de a 16 |
| /29 | 3 | 6 | 8 | 4º octeto, de a 8 |
| /30 | 2 | 2 | 4 | 4º octeto, de a 4 |
| /23 | 9 | 510 | 512 | 3er octeto, de a 2 |
| /22 | 10 | 1.022 | 1.024 | 3er octeto, de a 4 |
| /21 | 11 | 2.046 | 2.048 | 3er octeto, de a 8 |
| /20 | 12 | 4.094 | 4.096 | 3er octeto, de a 16 |
| /19 | 13 | 8.190 | 8.192 | 3er octeto, de a 32 |
| /18 | 14 | 16.382 | 16.384 | 3er octeto, de a 64 |

Esta tabla es la versión de consulta rápida de todo el capítulo. Leé las columnas en orden, porque cada una alimenta a la siguiente:

- **Prefijo**: el `/n` de la dirección, la puerta de entrada a la tabla.
- **Bits de host**: `32 − prefijo`. Es la columna que usás para la cuenta de hosts.
- **Hosts utilizables**: `2^(bits de host) − 2`. Los dos que se restan son la red y el broadcast.
- **Total de direcciones (bloque)**: `2^(bits de host)`, sin restar nada. Es el tamaño del pedazo.
- **Dónde salta**: en qué octeto cae el corte y de cuánto es el salto entre subredes consecutivas.

Fijate el patrón: **cada bit de host que perdés, duplicás el bloque**. Y en los prefijos altos (de /24 para abajo), el "dónde salta" te dice en qué octeto trabajás con la división.

Dos filas para mirar con atención, porque son las que más se usan en la vida real:

- **`/30`**: bloque de 4, dos hosts. Es el tamaño clásico de un enlace punto a punto entre dos routers: un cable, dos puntas, ni un equipo más.
- **`/28`**: bloque de 16, catorce hosts. Es el tamaño típico de una subred chica dentro de una empresa.

---

## 5. La tabla de ejercicios

Analizá las 9 direcciones de esta tabla. Cada una te pide los mismos 6 datos:

| # | Dirección IP/Prefijo | Notación Red/Host | Máscara de Subred | Dirección de Red | Dirección de Broadcast | Hosts Utilizables | Rango de Hosts |
|---|----------------------|-------------------|-------------------|------------------|-----------------------|:-:|----------------|
| 1 | 192.168.10.10/24 | ? | ? | ? | ? | ? | ? |
| 2 | 10.101.99.17/23 | ? | ? | ? | ? | ? | ? |
| 3 | 209.165.200.227/27 | ? | ? | ? | ? | ? | ? |
| 4 | 172.31.45.252/24 | ? | ? | ? | ? | ? | ? |
| 5 | 10.1.8.200/26 | ? | ? | ? | ? | ? | ? |
| 6 | 172.16.117.77/20 | ? | ? | ? | ? | ? | ? |
| 7 | 10.1.1.101/25 | ? | ? | ? | ? | ? | ? |
| 8 | 209.165.202.140/27 | ? | ? | ? | ? | ? | ? |
| 9 | 192.168.28.45/28 | ? | ? | ? | ? | ? | ? |

**Hacelo vos primero con 1, 4 y 5** (todos caen en el cuarto octeto: son los más fáciles). Después mirá las soluciones y recién ahí encará los que cruzan el tercer octeto.

Las columnas de la tabla son, una por una, los seis datos del método más el identificador:

- **#**: el número del ejercicio, el mismo que vas a buscar en el capítulo 6.
- **Dirección IP/Prefijo**: el dato de entrada, lo único que te dan.
- **Notación Red/Host**: la radiografía del paso 2, con letras `N`, `n`, `H`, `h`.
- **Máscara de Subred**: el resultado del paso 3 en decimal.
- **Dirección de Red**: el paso 4.
- **Dirección de Broadcast**: el paso 5.
- **Hosts Utilizables**: la cantidad `2^h − 2`, no la lista de direcciones.
- **Rango de Hosts**: el par primero–último del paso 6, escrito como "desde – hasta".

### Cómo practicar sin hacer trampa

El manual está pensado para que lo uses con la mano encima de la respuesta. Tres reglas simples:

1. **Elegí el ejercicio, tapá todo lo que sigue y escribí los seis datos.** No importa si tardás cinco minutos: importa que llegues sin mirar.
2. **Verificá con la regla de oro**: la IP original tiene que estar entre el primer y el último host. Si no está, no sigas: volvé al paso 1.
3. **Recién ahí destapá.** Si acertaste, pasá al siguiente. Si fallaste, buscá en qué paso te fuiste, no "la respuesta correcta".

Un error corregido en el paso 3 vale más que cinco ejercicios copiados.

---

## 6. Soluciones paso a paso

> **Regla de oro de la verificación:** en cada respuesta, la IP original TIENE que estar entre el primer y el último host. Si no está, hay un error.

Cada solución de acá abajo tiene la misma estructura, para que puedas comparar tus cuentas con las del manual sin perderte: qué te piden, los seis pasos con la aritmética a la vista, la verificación y la respuesta en una sola línea. La línea final es la que tenés que poder escribir de memoria cuando termines el capítulo.

### Solución 1: 192.168.10.10/24

**Qué te piden y por qué.** Te dan una dirección privada de las más comunes que existen y te piden los seis datos. Este es el caso base: si entendés este, entendés el 24 % de las redes del mundo real, porque `/24` es el prefijo que más vas a ver en una oficina chica.

**Paso 1:** `/24` → 24 bits de red, 8 de host.

La resta es 32 − 24 = 8. Ocho bits de host quiere decir bloque de 2⁸ = 256 direcciones, o sea el último octeto entero, de 0 a 255.

**Paso 2:** 24 = 3 octetos completos → **N.N.N.H**.

Tres octetos completos de red (24 bits) y el cuarto entero de host. Ni un bit mezclado, así que en este ejercicio no hay que partir ningún octeto en dos.

**Paso 3:** 24 unos = `255.255.255.0`.

Los tres primeros octetos son 255 y el último es 0. Es la máscara más famosa que existe, y su prefijo es 24.

**Paso 4:** bits de host en 0 → **red `192.168.10.0`**.

El último octeto de la IP es 10. Los ocho bits de ese octeto son de host, así que los apagamos todos: `00000000` = 0. Los tres primeros octetos son de red y quedan igual: 192.168.10. Red = `192.168.10.0`.

**Paso 5:** los 8 bits de host en 1 → `11111111` = **255** → broadcast `192.168.10.255`.

Ocho unos seguidos son 255; la suma es 128 + 64 + 32 + 16 + 8 + 4 + 2 + 1. Ese es el último valor del último octeto, el techo del bloque. Broadcast = `192.168.10.255`.

**Paso 6:** primer host `.1`, último `.254`, cantidad 2⁸ − 2 = **254**.

El primer host es la red más uno: `.1`. El último es el broadcast menos uno: `.254`. La cantidad es 2⁸ − 2 = 256 − 2 = 254. Y si contás de 1 a 254 inclusive, son 254 números.

**Verificación.** La IP original termina en 10, y 10 está entre 1 y 254. Está adentro de su propia subred: la cuenta cierra.

```
Red: 192.168.10.0   Broadcast: 192.168.10.255   Hosts: 192.168.10.1 – 192.168.10.254 (254)
```

### Solución 2: 10.101.99.17/23

**Qué te piden y por qué.** Misma consigna, pero acá el prefijo es `/23`: el corte no cae en el cuarto octeto, cae en el tercero. Este es el ejercicio que separa a los que entienden el método de los que memorizaron "la red termina en el último punto". Un `/23` es el tamaño típico de una red de planta con varias VLAN juntas.

**Paso 1:** `/23` → 23 bits de red, 9 de host.

32 − 23 = 9. Nueve bits de host es un bloque grande: 2⁹ = 512 direcciones, repartidas entre dos octetos (un pedazo del tercero y el cuarto completo).

**Paso 2:** 23 = 2 octetos completos (16) + 7 bits en el tercero → tercer octeto con 7 bits de red + 1 de host → **N.N.nnnnnnnh.H**.

Contá las letras para confirmar: dos `N` (16), siete `n` (7) y una `h` (1) suman 24 bits en la parte del corte... y el cuarto octeto es `H`, ocho bits de host. Total de red: 16 + 7 = 23. Total de host: 1 + 8 = 9. Cierra por los dos lados.

**Paso 3:** 23 unos = `11111111.11111111.11111110.00000000` = **255.255.254.0**.

El tercer octeto tiene siete unos y un cero: `11111110`. Ese patrón vale 254 (ojo: 254, no 255; el cero final es un bit apagado). El cuarto es todo ceros. Máscara = `255.255.254.0`.

**Paso 4:** el tercer octeto de la IP es 99 = `01100011`. Conservá los 7 bits de red (`0110001`), el último bit en 0: `01100010` = 98. Cuarto octeto en 0 → **red `10.101.98.0`**.

Despacito, porque acá se rompe todo si uno se apura. El 99 en binario es `01100011`: 64 + 32 + 2 + 1. Los siete primeros bits son de red y el octavo (el último) es de host. Ese último bit es un `1`, y es el que vamos a apagar: `0110001` + `0` = `01100010`. Ese octeto vale 64 + 32 + 2 = 98. El cuarto octeto de la IP (17) es todo host, así que lo apagamos entero: 0. Red = `10.101.98.0`.

**Paso 5:** mismo cálculo pero el bit de host del tercer octeto en 1: `01100011` = 99; cuarto octeto todo en 1 = 255 → **broadcast `10.101.99.255`**.

Ahora el bit de host del tercer octeto se enciende: `01100011` = 99 (el mismo valor que tenía la IP, porque la IP ya tenía ese bit encendido). Y el cuarto octeto, que es host entero, va todo en unos: 255. Broadcast = `10.101.99.255`.

**Paso 6:** 2⁹ − 2 = **510** → primer host `10.101.98.1`, último `10.101.99.254`.

2⁹ = 512; menos 2, 510. El primer host es la red más uno: `10.101.98.1`. El último es el broadcast menos uno, y ese "menos uno" baja el cuarto octeto de 255 a 254: `10.101.99.254`.

**Verificación.** La IP es `10.101.99.17`. ¿Está entre `10.101.98.1` y `10.101.99.254`? Sí: el tercer octeto 99 entra en el rango 98–99, y el cuarto 17 está dentro de 1–254. La dirección vive en esta subred.

```
Red: 10.101.98.0   Broadcast: 10.101.99.255   Hosts: 10.101.98.1 – 10.101.99.254 (510)
```

**Atajo:** bloque = 512 (2⁹) → 3er octeto salta de a 2 → 99 ÷ 2 = 49 (truncado) → 49 × 2 = 98 ✓.

### Solución 3: 209.165.200.227/27

**Qué te piden y por qué.** Un `/27` en una dirección pública. Este prefijo es el de las subredes chicas de verdad: 30 hosts es lo que necesita un aula, una oficina de cinco personas o un segmento de invitados. Y el octeto interesante está bien cerca del borde (227), así que sirve para practicar el caso en el que la red y el broadcast están "pegados" al final del octeto.

**Paso 1:** `/27` → 27 bits de red, 5 de host.

32 − 27 = 5. Bloque de 2⁵ = 32 direcciones, 30 utilizables. Ya sabemos que este ejercicio se parece al ejemplo guiado del capítulo 3, porque comparte el prefijo.

**Paso 2:** 27 = 24 + 3 → cuarto octeto con 3 bits de red + 5 de host → **N.N.N.nnnhhhhh**.

Tres octetos completos (24) más tres bits en el cuarto. El cuarto octeto queda partido 3 y 5.

**Paso 3:** 27 unos = `11111111.11111111.11111111.11100000` = **255.255.255.224**.

El cuarto octeto, `11100000`, tiene tres unos: 128 + 64 + 32 = 224. Máscara `255.255.255.224`.

**Paso 4:** cuarto octeto 227 = `11100011`; 3 bits de red (`111`), los 5 de host en 0 → `11100000` = 224 → **red `209.165.200.224`**.

Veamos el 227 en binario: 128 + 64 + 32 + 2 + 1 = 227, o sea `11100011`. Los tres primeros bits (`111`) son red y los cinco últimos (`00011`) son host. Apagamos los cinco de host: `111` + `00000` = `11100000` = 224. Red = `209.165.200.224`.

**Paso 5:** los 5 de host en 1 → `11111111` = 255 → **broadcast `209.165.200.255`**.

Los tres bits de red siguen en `111` y los cinco de host se encienden: `11111111` = 255. Broadcast = `209.165.200.255`, que en este caso es el techo del octeto.

**Paso 6:** 2⁵ − 2 = **30** → `209.165.200.225` a `209.165.200.254`.

Primer host: 224 + 1 = 225. Último: 255 − 1 = 254. Cantidad: 2⁵ − 2 = 30. Contá de 225 a 254: 254 − 225 + 1 = 30 ✓.

**Verificación.** La IP 227 está entre 225 y 254: sí, y además está muy cerca del final, que es lo esperable en un bloque que termina en 255.

```
Red: 209.165.200.224   Broadcast: 209.165.200.255   Hosts: 209.165.200.225 – 209.165.200.254 (30)
```

### Solución 4: 172.31.45.252/24

**Qué te piden y por qué.** Es un `/24` como el ejercicio 1, pero la dirección termina en `.252`: casi el borde del bloque. Está acá a propósito, para que veas que un número grande en el último octeto no cambia nada del método. Mucha gente ve `252` y piensa "esto es una máscara"; no lo es, es un host perfectamente válido.

**Paso 1:** `/24` → 24 bits de red, 8 de host.

Igual que el ejercicio 1: 32 − 24 = 8, bloque de 256.

**Paso 2:** **N.N.N.H**.

Tres octetos de red y el cuarto completo de host. No hay octeto partido.

**Paso 3:** `255.255.255.0`.

Los 24 unos de siempre.

**Paso 4:** → **red `172.31.45.0`**.

El último octeto de la IP es 252 (`11111100`), y como sus ocho bits son de host, se apagan todos: `00000000` = 0. Red = `172.31.45.0`.

**Paso 5:** → **broadcast `172.31.45.255`**.

Los ocho bits de host en unos: 255. Broadcast = `172.31.45.255`.

**Paso 6:** 2⁸ − 2 = **254** → `.45.1` a `.45.254`.

Primer host `.1`, último `.254`, cantidad 254. Acá hay un detalle que vale la pena frenar a mirar: la dirección original es `.252`, así que está **dentro** del rango utilizable, a dos direcciones del broadcast.

**Verificación.** 252 está entre 1 y 254 ✓. Y ojo con la intuición: el hecho de que 252 sea también un valor de máscara posible no lo convierte en red ni en broadcast. El rol de un número lo decide su posición respecto del corte, no su valor.

```
Red: 172.31.45.0   Broadcast: 172.31.45.255   Hosts: 172.31.45.1 – 172.31.45.254 (254)
```

### Solución 5: 10.1.8.200/26

**Qué te piden y por qué.** Un `/26` con el octeto interesante en un valor alto y redondo (200). Este es el prefijo de las subredes de 62 hosts: dos de estas entran justo en un `/24`, así que si alguna vez ves una red `/24` partida al medio, estás mirando dos `/26`.

**Paso 1:** `/26` → 26 bits de red, 6 de host.

32 − 26 = 6. Bloque de 2⁶ = 64 direcciones, 62 utilizables.

**Paso 2:** 26 = 24 + 2 → **N.N.N.nnhhhhhh**.

Dos bits de red y seis de host en el cuarto octeto. Dos `n` más seis `h` completan los ocho bits.

**Paso 3:** `11111111.11111111.11111111.11000000` = **255.255.255.192**.

Dos unos en el cuarto octeto: 128 + 64 = 192. Máscara `255.255.255.192`.

**Paso 4:** cuarto octeto 200 = `11001000`; 2 bits de red (`11`), host en 0 → `11000000` = 192 → **red `10.1.8.192`**.

El 200 es 128 + 64 + 8 = 200, o sea `11001000`. Los dos primeros bits (`11`) son red; los seis últimos (`001000`) son host y se apagan: `11000000` = 192. Red = `10.1.8.192`.

**Paso 5:** host en 1 → `11111111` = 255 → **broadcast `10.1.8.255`**.

Los dos bits de red en `11` y los seis de host en unos: `11111111` = 255. Broadcast = `10.1.8.255`.

**Paso 6:** 2⁶ − 2 = **62** → `10.1.8.193` a `10.1.8.254`.

Primer host 192 + 1 = 193; último 255 − 1 = 254; cantidad 64 − 2 = 62. Contá: 254 − 193 + 1 = 62 ✓.

**Verificación.** La IP es 200, y 200 está entre 193 y 254 ✓. Fijate además que el bloque arranca en 192: los múltiplos de 64 son 0, 64, 128, 192, 256. El 192 es el cuarto, y el siguiente arrancaría en 256, o sea ya en el octeto de al lado.

```
Red: 10.1.8.192   Broadcast: 10.1.8.255   Hosts: 10.1.8.193 – 10.1.8.254 (62)
```

### Solución 6: 172.16.117.77/20

**Qué te piden y por qué.** Acá el prefijo es `/20`, así que el octeto interesante es el **tercero** y el cuarto octeto es host completo. Este es el ejercicio más grande del capítulo: 4.094 hosts, una red de campus, no de oficina. La cuenta es la misma de siempre; lo único distinto es que tenés que sostener dos octetos a la vez.

**Paso 1:** `/20` → 20 bits de red, 12 de host.

32 − 20 = 12. Bloque de 2¹² = 4.096 direcciones, 4.094 utilizables. Doce bits de host son un octeto entero (8) más cuatro bits del tercero.

**Paso 2:** 20 = 16 + 4 → tercer octeto con 4 bits de red + 4 de host, cuarto completo de host → **N.N.nnnnhhhh.H**.

Dos `N` (16), cuatro `n` (4) y cuatro `h` en el tercero, más un `H` entero en el cuarto. Red: 16 + 4 = 20. Host: 4 + 8 = 12. Cierra.

**Paso 3:** `11111111.11111111.11110000.00000000` = **255.255.240.0**.

El tercer octeto tiene cuatro unos y cuatro ceros: `11110000` = 128 + 64 + 32 + 16 = 240. El cuarto es todo ceros. Máscara `255.255.240.0`.

**Paso 4:** tercer octeto 117 = `01110101`; 4 bits de red (`0111`), host en 0 → `01110000` = 112; cuarto octeto en 0 → **red `172.16.112.0`**.

El 117 es 64 + 32 + 16 + 4 + 1 = 117, o sea `01110101`. Los cuatro primeros bits (`0111`) son red y los cuatro últimos (`0101`) son host: los apagamos y queda `01110000`, que vale 64 + 32 + 16 = 112. El cuarto octeto de la IP (77) es host entero y se apaga completo: 0. Red = `172.16.112.0`.

**Paso 5:** tercero con host en 1 → `01111111` = 127; cuarto todo en 1 → **broadcast `172.16.127.255`**.

Los cuatro bits de red siguen en `0111` y los cuatro de host se encienden: `01111111` = 64 + 32 + 16 + 8 + 4 + 2 + 1 = 127. El cuarto octeto va todo en unos: 255. Broadcast = `172.16.127.255`.

**Paso 6:** 2¹² − 2 = **4094** → `172.16.112.1` a `172.16.127.254`.

Primer host: tercer octeto 112, cuarto 1 → `172.16.112.1`. Último: tercer octeto 127, cuarto 254 → `172.16.127.254`. Cantidad: 4.096 − 2 = 4.094. Ojo con esto: el rango **atraviesa** tres valores del tercer octeto (112, 113... hasta 127), y eso es correcto: la subred entera vive entre 172.16.112.0 y 172.16.127.255.

**Verificación.** La IP es `172.16.117.77`. El tercer octeto 117 está entre 112 y 127 ✓; el cuarto 77 está entre 1 y 254 ✓. Adentro.

```
Red: 172.16.112.0   Broadcast: 172.16.127.255   Hosts: 172.16.112.1 – 172.16.127.254 (4094)
```

**Verificación con el atajo:** bloque = 2¹² = 4096; en el 3er octeto salta de a 16 → 117 ÷ 16 = 7 → 112 ✓.

### Solución 7: 10.1.1.101/25

**Qué te piden y por qué.** Un `/25` es medio `/24`, y es el ejemplo más claro de "una red partida al medio". Este ejercicio tiene una particularidad que vale oro: el bit de red del cuarto octeto es un **cero** en la dirección original, así que la red da `.0` y la intuición de "la red siempre es la dirección con el último octeto en cero" parece funcionar... cuando en realidad lo que hizo fue apagar el bit de host.

**Paso 1:** `/25` → 25 bits de red, 7 de host.

32 − 25 = 7. Bloque de 2⁷ = 128 direcciones, 126 utilizables.

**Paso 2:** 25 = 24 + 1 → **N.N.N.nhhhhhhh**.

Un solo bit de red en el cuarto octeto, y siete de host. La notación más desbalanceada del capítulo.

**Paso 3:** `...10000000` = **255.255.255.128**.

Los tres primeros octetos en 255 y el cuarto con un único uno a la izquierda: 128. Máscara `255.255.255.128`.

**Paso 4:** cuarto octeto 101 = `01100101`; 1 bit de red (`0`), host en 0 → `00000000` = 0 → **red `10.1.1.0`**.

El 101 es 64 + 32 + 4 + 1 = 101, o sea `01100101`. El primer bit (`0`) es de red y los siete restantes son de host. Apagamos los siete: `00000000` = 0. Red = `10.1.1.0`.

**Paso 5:** host en 1 → `01111111` = 127 → **broadcast `10.1.1.127`**.

El bit de red sigue en `0` y los siete de host pasan a unos: `01111111` = 127. Broadcast = `10.1.1.127`.

**Paso 6:** 2⁷ − 2 = **126** → `10.1.1.1` a `10.1.1.126`.

Primer host `.1`, último `.126`, cantidad 126. Y acá está la trampa del ejercicio: la red es `.0` y el broadcast es `.127`, pero en la subred "hermana" (la de la otra mitad del `/24`) la red sería `.128` y el broadcast `.255`. Que el último octeto sea 0 no es lo que define la red.

**Verificación.** 101 está entre 1 y 126 ✓. Si te hubiera dado red `.128`, la IP 101 no caería adentro y sabrías que te equivocaste.

```
Red: 10.1.1.0   Broadcast: 10.1.1.127   Hosts: 10.1.1.1 – 10.1.1.126 (126)
```

### Solución 8: 209.165.202.140/27

**Qué te piden y por qué.** Es exactamente el ejemplo guiado del capítulo 3, y está acá a propósito: es el control de que el ejemplo se entendió. Si resolvés esto sin mirar atrás y te da lo mismo, el método está instalado. Si no, volvé al capítulo 3 y repetí el ejemplo hasta que salga solo.

**Paso 1:** `/27` → 27 bits de red, 5 de host.

32 − 27 = 5. Bloque de 32, 30 utilizables.

**Paso 2:** **N.N.N.nnnhhhhh**.

Tres `N`, tres `n`, cinco `h`.

**Paso 3:** **255.255.255.224**.

`11100000` en el cuarto octeto: 128 + 64 + 32 = 224.

**Paso 4:** cuarto octeto 140 = `10001100`; 3 bits de red (`100`), host en 0 → `10000000` = 128 → **red `209.165.202.128`**.

El 140 es 128 + 8 + 4 = 140, o sea `10001100`. Los tres primeros bits (`100`) son red; los cinco últimos (`01100`) son host y se apagan: `10000000` = 128. Red = `209.165.202.128`.

**Paso 5:** host en 1 → `10011111` = 159 → **broadcast `209.165.202.159`**.

Red `100` intacta, host `11111` encendido: `10011111` = 128 + 16 + 8 + 4 + 2 + 1 = 159. Broadcast = `209.165.202.159`.

**Paso 6:** 2⁵ − 2 = **30** → `209.165.202.129` a `209.165.202.158`.

Primer host 129, último 158, cantidad 30. Contá: 158 − 129 + 1 = 30 ✓.

**Verificación.** 140 está entre 129 y 158 ✓. Y el atajo confirma: 140 ÷ 32 = 4 (truncado), 4 × 32 = 128 ✓; broadcast = 128 + 32 − 1 = 159 ✓.

```
Red: 209.165.202.128   Broadcast: 209.165.202.159   Hosts: 209.165.202.129 – 209.165.202.158 (30)
```

### Solución 9: 192.168.28.45/28

**Qué te piden y por qué.** El último ejercicio del capítulo es un `/28`: bloque de 16, catorce hosts. Es el prefijo más chico que se usa con comodidad en la vida real, y el que más se presta a la cuenta del atajo, porque el bloque es un número redondo y chico. Además, esta es la misma dirección que aparece en el ejemplo del atajo en el capítulo 4: si resolviste ese ejemplo, ya tenés la mitad del ejercicio.

**Paso 1:** `/28` → 28 bits de red, 4 de host.

32 − 28 = 4. Bloque de 2⁴ = 16 direcciones, 14 utilizables.

**Paso 2:** 28 = 24 + 4 → **N.N.N.nnnnhhhh**.

Cuatro bits de red y cuatro de host en el cuarto octeto, mitad y mitad.

**Paso 3:** `...11110000` = **255.255.255.240**.

Cuatro unos en el cuarto octeto: 128 + 64 + 32 + 16 = 240. Máscara `255.255.255.240`.

**Paso 4:** cuarto octeto 45 = `00101101`; 4 bits de red (`0010`), host en 0 → `00100000` = 32 → **red `192.168.28.32`**.

El 45 es 32 + 8 + 4 + 1 = 45, o sea `00101101`. Los cuatro primeros bits (`0010`) son red y los cuatro últimos (`1101`) son host: se apagan y queda `00100000` = 32. Red = `192.168.28.32`.

**Paso 5:** host en 1 → `00101111` = 47 → **broadcast `192.168.28.47`**.

Red `0010` intacta, host `1111` encendido: `00101111` = 32 + 8 + 4 + 2 + 1 = 47. Broadcast = `192.168.28.47`.

**Paso 6:** 2⁴ − 2 = **14** → `192.168.28.33` a `192.168.28.46`.

Primer host 32 + 1 = 33; último 47 − 1 = 46; cantidad 16 − 2 = 14. Contá: 46 − 33 + 1 = 14 ✓.

**Verificación.** 45 está entre 33 y 46 ✓. Con el atajo: 45 ÷ 16 = 2, 2 × 16 = 32 ✓; broadcast 32 + 15 = 47 ✓.

```
Red: 192.168.28.32   Broadcast: 192.168.28.47   Hosts: 192.168.28.33 – 192.168.28.46 (14)
```

### Cómo saber si acertaste sin mirar la respuesta

Terminaste los nueve. Cuatro controles que sirven para cualquier ejercicio:

1. **La IP original cae dentro del rango.** Es la regla de oro y descarta el 90 % de los errores.
2. **La máscara tiene tantos unos como dice el prefijo.** Contalos: si no coinciden, el paso 3 está mal.
3. **La notación suma el prefijo y completa los octetos.** Ocho letras por octeto, sin excepción.
4. **El broadcast es red + bloque − 1.** Una suma para confirmar el paso 5.

Si los cuatro pasan, la respuesta es correcta aunque la hayas escrito con otro formato.

---

## 7. Tabla consolidada

| Dirección IP/Prefijo | Notación | Máscara | Red | Broadcast | Hosts | Rango de Hosts |
|----------------------|----------|-------------------|------------------|-----------|:-----:|----------------|
| 192.168.10.10/24 | N.N.N.H | 255.255.255.0 | 192.168.10.0 | 192.168.10.255 | 254 | 192.168.10.1 – 192.168.10.254 |
| 10.101.99.17/23 | N.N.nnnnnnnh.H | 255.255.254.0 | 10.101.98.0 | 10.101.99.255 | 510 | 10.101.98.1 – 10.101.99.254 |
| 209.165.200.227/27 | N.N.N.nnnhhhhh | 255.255.255.224 | 209.165.200.224 | 209.165.200.255 | 30 | 209.165.200.225 – 209.165.200.254 |
| 172.31.45.252/24 | N.N.N.H | 255.255.255.0 | 172.31.45.0 | 172.31.45.255 | 254 | 172.31.45.1 – 172.31.45.254 |
| 10.1.8.200/26 | N.N.N.nnhhhhhh | 255.255.255.192 | 10.1.8.192 | 10.1.8.255 | 62 | 10.1.8.193 – 10.1.8.254 |
| 172.16.117.77/20 | N.N.nnnnhhhh.H | 255.255.240.0 | 172.16.112.0 | 172.16.127.255 | 4094 | 172.16.112.1 – 172.16.127.254 |
| 10.1.1.101/25 | N.N.N.nhhhhhhh | 255.255.255.128 | 10.1.1.0 | 10.1.1.127 | 126 | 10.1.1.1 – 10.1.1.126 |
| 209.165.202.140/27 | N.N.N.nnnhhhhh | 255.255.255.224 | 209.165.202.128 | 209.165.202.159 | 30 | 209.165.202.129 – 209.165.202.158 |
| 192.168.28.45/28 | N.N.N.nnnnhhhh | 255.255.255.240 | 192.168.28.32 | 192.168.28.47 | 14 | 192.168.28.33 – 192.168.28.46 |

Esta tabla es el capítulo 5 con las respuestas puestas. Las columnas son las mismas: la dirección original, la notación, la máscara, la red, el broadcast, la cantidad de hosts y el rango. La diferencia es que acá no hay casilleros vacíos.

Para qué te sirve si ya resolviste todo:

- **Para chequear de un vistazo.** Si tu respuesta de un ejercicio no coincide con su fila, buscá el paso donde se separaron. No hace falta rehacer todo.
- **Para ver el patrón.** Las filas 1 y 4 son `/24` con 254 hosts; 3 y 8 son `/27` con 30. El prefijo manda; la dirección solo decide dónde cae el bloque.
- **Para estudiar al revés.** Tapá la columna "Dirección IP/Prefijo" y tratá de reconstruir el dato de entrada a partir de la red, el broadcast y la máscara. Es un ejercicio más difícil y muy útil.

---

## 8. Errores comunes

Estos son los que aparecen una y otra vez, no solo en los exámenes sino en redes reales que dejan de funcionar. Leelos como una lista de control.

1. **Confundir red con broadcast.** Red = bits de host en `0`. Broadcast = bits de host en `1`. Son las DOS direcciones reservadas de cada subred.

2. **Olvidar el −2.** La primera dirección es la red y la última el broadcast: los hosts utilizables son `2^h − 2`, no `2^h`. Si te olvidás, en un `/29` vas a decir 8 hosts cuando hay 6, y vas a asignar direcciones que no existen.

3. **Equivocarse en la conversión binaria.** El error más común de todos: `11111110` NO es 255 — es **254**. `255` es `11111111`, ocho unos. Un "uno de más o de menos" en la máscara cambia toda la subred.

4. **Contar mal los bits del prefijo.** `/26` tiene 26 unos: `11111111.11111111.11111111.11000000`. Contá los `1` de la máscara y tienen que coincidir con el prefijo SIEMPRE.

5. **Confundir bloque con hosts.** El bloque (2^h) es el total de direcciones de la subred — incluye red y broadcast. Los hosts utilizables son bloque − 2. Para `/28`: bloque 16, hosts 14. Si en un examen te piden "cuántas direcciones entran", la respuesta es 16; si te piden "cuántos equipos", es 14.

6. **Escribir mal la notación.** En `/22`, el tercer octeto tiene 6 bits de red y 2 de host (`nnnnnnhh`), NO "8 de red" (`nnnnnnnn`). Contá los bits: 16 + 6 = 22. Si tu notación no suma el prefijo, está mal.

Un séptimo error, de trabajo real: **elegir la máscara por la cantidad de equipos y no por la topología**. Dos equipos con la misma red pero máscaras distintas (`/24` y `/25`) creen estar en la misma subred y no se ven.

---

## 9. Ejercicios para practicar solo

Ahora la parte que importa: seis ejercicios nuevos, sin solución a la vista. La respuesta está abajo de cada uno, pero el orden correcto es siempre el mismo: leé el enunciado, tapá lo que sigue, resolvé los seis datos y recién ahí bajá a comparar.

### Ejercicio 1: 192.168.50.100/22

Calculá notación, máscara, red, broadcast y rango.

Un `/22` en una dirección privada. El corte cae en el tercer octeto, así que este ejercicio es el hermano chico del ejercicio 6 del capítulo anterior. Pista: el bloque es de 1.024 direcciones, y en el tercer octeto el salto es de 4.

**Respuesta** (tapala antes de leer):

| Campo | Valor |
|-------|-------|
| Notación | N.N.nnnnnnhh.H |
| Máscara | 255.255.252.0 |
| Red | 192.168.48.0 |
| Broadcast | 192.168.51.255 |
| Hosts utilizables | 1.022 |
| Rango de hosts | 192.168.48.1 – 192.168.51.254 |

**Explicación:** /22 = 16 + 6 → tercer octeto con 6 bits de red + 2 de host. Bloque = 2¹⁰ = 1024 → en el 3er octeto salta de a 4. 50 ÷ 4 = 12 → 48. El siguiente bloque arranca en 52 → broadcast .51.255.

### Ejercicio 2: 10.200.150.75/21

Acá el tercer octeto vuelve a ser el interesante, con bloque de 2.048 y salto de 8. Es el mismo tipo de cuenta que el ejercicio anterior, pero con el octeto en 150: un valor que no es múltiplo de nada cómodo, así que la división truncada es la que decide todo.

**Respuesta** (tapala antes de leer):

| Campo | Valor |
|-------|-------|
| Notación | N.N.nnnnnhhh.H |
| Máscara | 255.255.248.0 |
| Red | 10.200.144.0 |
| Broadcast | 10.200.151.255 |
| Hosts utilizables | 2.046 |
| Rango de hosts | 10.200.144.1 – 10.200.151.254 |

**Explicación:** /21 = 16 + 5 → tercer octeto con 5 bits de red + 3 de host. Bloque = 2¹¹ = 2048 → salta de a 8 en el 3er octeto. 150 ÷ 8 = 18 (truncado) → 144. El siguiente bloque arranca en 152 → broadcast .151.255.

La cuenta clave: 150 ÷ 8 = 18,75; truncado es 18; 18 × 8 = 144. Si hubieras redondeado a 19, te daba 152 y la IP 150 no habría caído en el rango: ese es el control que te avisa del error.

### Ejercicio 3: 172.16.200.200/19

Bloque grande: 8.192 direcciones, salto de 32 en el tercer octeto. Es el ejercicio para practicar el caso en el que el octeto interesante está bien arriba, cerca del final.

**Respuesta** (tapala antes de leer):

| Campo | Valor |
|-------|-------|
| Notación | N.N.nnnhhhhh.H |
| Máscara | 255.255.224.0 |
| Red | 172.16.192.0 |
| Broadcast | 172.16.223.255 |
| Hosts utilizables | 8.190 |
| Rango de hosts | 172.16.192.1 – 172.16.223.254 |

**Explicación:** /19 = 16 + 3 → tercer octeto con 3 bits de red + 5 de host. Bloque = 2¹³ = 8192 → salta de a 32. 200 ÷ 32 = 6 → 192. Broadcast: 192 + 32 − 1 = 223.

Los tres bits de red del tercer octeto son `110` en el 200, y por eso la red da 192. Con el host encendido, `11011111` = 223.

### Ejercicio 4: 10.10.10.10/29

Un `/29` con una dirección "linda" (10.10.10.10) que igual cae en una subred que no arranca en cero. Bloque de 8, seis hosts: el tamaño de una subred de servicios o de un enlace chico.

**Respuesta** (tapala antes de leer):

| Campo | Valor |
|-------|-------|
| Notación | N.N.N.nnnnnhhh |
| Máscara | 255.255.255.248 |
| Red | 10.10.10.8 |
| Broadcast | 10.10.10.15 |
| Hosts utilizables | 6 |
| Rango de hosts | 10.10.10.9 – 10.10.10.14 |

**Explicación:** /29 = 24 + 5 → cuarto octeto con 5 bits de red + 3 de host. Bloque = 2³ = 8. 10 ÷ 8 = 1 → 8. Broadcast = 8 + 7 = 15. Solo 6 hosts.

Este es el ejercicio donde el error del −2 se nota más: si te olvidás de restar, vas a decir 8 hosts y a ofrecer las direcciones .8 y .15, que son la red y el broadcast.

### Ejercicio 5: 203.0.113.7/30

Un clásico del mundo real: el enlace entre dos routers.

Es el caso más chico que se usa en producción: dos hosts, un cable, dos puntas. Si alguna vez configuraste un enlace punto a punto, esta es la cuenta que había detrás. Ojo con la fila de notación de la tabla: está mal a propósito, para que la caces.

**Respuesta** (tapala antes de leer):

| Campo | Valor |
|-------|-------|
| Notación | N.N.N.nnhhhhhh... NO — revisá: /30 = 24 + 6 → N.N.N.nnnnnnhh |
| Máscara | 255.255.255.252 |
| Red | 203.0.113.4 |
| Broadcast | 203.0.113.7 |
| Hosts utilizables | 2 |
| Rango de hosts | 203.0.113.5 – 203.0.113.6 |

**Trampa pedagógica:** ¿viste qué fácil es escribir mal una notación por no contar bits? /30 = 24 bits + 6 bits en el cuarto octeto → 6 n + 2 h. Los dos hosts (`.5` y `.6`) son el router de cada lado.

Sobre esa fila: la notación correcta de un `/30` es `N.N.N.nnnnnnhh` (24 + 6 = 30, y 6 + 2 completa el octeto). La versión `nnhhhhhh` corresponde a un `/26`, no a un `/30`: suma 26 bits de red. El manual la deja escrita así, marcada con "NO — revisá", para que veas el error en el lugar donde aparece. Y el resto de la tabla está bien: bloque de 4, red 4, broadcast 7, hosts `.5` y `.6`.

### Ejercicio 6: 198.51.100.10/25

Cierra con un `/25`: medio bloque de 256, salto de 128. Es el último ejercicio y el más tranquilo, pero tiene una particularidad: la dirección 10 es tan chica que la división da cero, y eso desconcierta.

**Respuesta** (tapala antes de leer):

| Campo | Valor |
|-------|-------|
| Notación | N.N.N.nhhhhhhh |
| Máscara | 255.255.255.128 |
| Red | 198.51.100.0 |
| Broadcast | 198.51.100.127 |
| Hosts utilizables | 126 |
| Rango de hosts | 198.51.100.1 – 198.51.100.126 |

**Explicación:** /25 = 24 + 1 → un bit de red en el cuarto octeto. Bloque = 2⁷ = 128. 10 ÷ 128 = 0 → red .0. La subred "hermana" de esta es la .128/.255.

Que la división dé cero es correcto y no es un error: el primer bloque de un `/25` va de 0 a 127, y la dirección 10 cae justo ahí. La subred hermana arranca en 128 y llega a 255. Entre las dos tenés el `/24` completo.

---

## 10. Resumen de fórmulas

| Concepto | Fórmula |
|----------|---------|
| Bits de host | 32 − prefijo |
| Total de direcciones (bloque) | 2^(32 − prefijo) |
| Hosts utilizables | 2^(32 − prefijo) − 2 |
| Salto entre subredes | 256 − valor del octeto de la máscara |
| Dirección de red | IP con todos los bits de host en `0` |
| Broadcast | Red + bloque − 1 |
| Primer host | Red + 1 |
| Último host | Broadcast − 1 |

Son ocho fórmulas, y en realidad son dos ideas: el corte (`32 − prefijo`) y el tamaño (`2^h`). Todo el resto es aritmética alrededor de esas dos.

Fila por fila, con un ejemplo usando el `/27` del capítulo 3:

- **Bits de host**: 32 − 27 = 5.
- **Total de direcciones (bloque)**: 2⁵ = 32.
- **Hosts utilizables**: 32 − 2 = 30.
- **Salto entre subredes**: 256 − 224 = 32. Ojo: esta fórmula solo aplica al octeto donde está el corte (en un `/27`, el cuarto).
- **Dirección de red**: la IP con los bits de host en 0. Es el paso 4, no una cuenta nueva.
- **Broadcast**: red + bloque − 1 → 128 + 32 − 1 = 159.
- **Primer host**: red + 1 → 129.
- **Último host**: broadcast − 1 → 158.

---

## 11. Comprobá lo que aprendiste

Respondé antes de destapar — son las preguntas que separan al que memorizó del que entiende.

**1. ¿Cuántos bits de host tiene una /22 y cuántos hosts utilizables?**

**Respuesta:**

32 − 22 = **10 bits de host** → 2¹⁰ − 2 = **1.022 hosts**.

**2. ¿Cuál es la notación correcta de una /19?**

**Respuesta:**

19 = 16 + 3 → tercer octeto con 3 bits de red + 5 de host → **N.N.nnnhhhhh.H**. (La notación tiene que sumar el prefijo: 16 + 3 = 19.)

**3. ¿Por qué está mal `255.255.255.254` como máscara?**

**Respuesta:**

Porque los unos de la máscara son **consecutivos** y van primero. `254` en binario es `11111110` — termina en 0 dentro de la parte de unos, cosa imposible. Las máscaras válidas del cuarto octeto son 0, 128, 192, 224, 240, 248, 252, 254 (para /31) y 255. `...254` = /31, que es un caso especial punto a punto.

**4. Con `10.0.0.77/27`, ¿en qué subred cae la IP?**

**Respuesta:**

Bloque 32 → 77 ÷ 32 = 2 → red `10.0.0.64`, broadcast `.95`, hosts `.65` a `.94` (30 hosts). La IP 77 está en el rango → ✓.

**5. Dos hosts con IP `192.168.1.5/28` y `192.168.1.20/28`. ¿Están en la misma subred?**

**Respuesta:**

NO. Bloque 16: la `.5` cae en la subred `192.168.1.0` (hosts .1-.14) y la `.20` en la `192.168.1.16` (hosts .17-.30). Para comunicarse necesitan un router — son redes distintas, aunque compartan los primeros tres octetos. Este es el clásico "tengo IP pero no ping" por mala elección de máscara.

**6. ¿Qué le cambia a una subred agregarle UN bit de red (pasar de /27 a /28)?**

**Respuesta:**

Se **duplica** la cantidad de subredes (de 1 a 2) y se **reduce a la mitad** el tamaño de cada una (de 32 a 16 direcciones, de 30 a 14 hosts). Siempre: cada bit prestado = doble de subredes, mitad de hosts.

---

## 12. Glosario

| Término | Qué es |
|---------|--------|
| **Prefijo /n** | Cantidad de bits de red de la dirección (CIDR) |
| **Notación N/n/H/h** | Radiografía de la dirección: octetos completos (N/H) y bits sueltos (n/h) |
| **Bits de red** | Los que "pertenecen" a la red — marcados por la máscara con 1 |
| **Bits de host** | Los que identifican al dispositivo — marcados por la máscara con 0 |
| **Máscara de subred** | 32 bits con unos consecutivos que definen el límite red/host |
| **Dirección de red** | Primera de la subred: bits de host en 0 |
| **Broadcast** | Última de la subred: bits de host en 1; llega a todos |
| **Hosts utilizables** | 2^h − 2: todo lo que está entre la red y el broadcast |
| **Bloque** | 2^(32 − prefijo): el total de direcciones de la subred |
| **Salto** | 256 − máscara: el paso entre subredes consecutivas |
| **Octeto interesante** | El octeto donde el límite cae en el medio (la máscara no es 0 ni 255 ahí) |
| **CIDR** | La notación `/n` que reemplazó a las clases fijas |

---

## 13. Resumen en 10 puntos

1. **Todo ejercicio se resuelve igual**: prefijo → notación → máscara → red → broadcast → rango.
2. **La notación tiene que sumar el prefijo**: si `/22` no te da `N.N.nnnnnnhh.H`, está mal.
3. **La máscara son unos consecutivos** empezando por la izquierda; contá los unos y debe dar el prefijo.
4. **Red = bits de host en 0. Broadcast = bits de host en 1.** Esa es toda la matemática.
5. **Hosts utilizables = 2^h − 2**, siempre — red y broadcast se descartan.
6. **El atajo del bloque** (2^h, o 256 − máscara) te da la red con una división y media, sin binario.
7. **Verificá SIEMPRE**: la IP original tiene que caer entre el primer y el último host.
8. **Cada bit prestado duplica subredes y reduce a la mitad hosts.**
9. **`255` es `11111111`** — `11111110` es 254, y no existe como octeto de máscara normal.
10. **El más común error del mundo real**: dos equipos con IPs de subredes distintas creen que se ven — y no se ven sin un router.

---

> **Fuente:** Documentación propia basada en estándares de direccionamiento IPv4 y CIDR.

### Resumen

- Un ejercicio de análisis IPv4 son seis pasos fijos: prefijo, notación, máscara, red, broadcast y rango. Siempre en ese orden, siempre los mismos.
- La máscara es el corte: dice cuántos bits son de red (unos) y cuántos de host (ceros). La red es la dirección con los bits de host en 0; el broadcast, con los bits de host en 1.
- Los hosts utilizables son el bloque menos dos, y el rango va de red + 1 a broadcast − 1. Si te olvidás del −2, regalás dos direcciones que no existen.
- El atajo del bloque (2^h, o 256 − máscara) evita el binario: dividís el octeto interesante, truncás y multiplicás. Sirve para chequear cualquier solución binaria.
- El control final es siempre el mismo: la IP original tiene que caer dentro del rango. Si no cae, hay un error y hay que volver al paso 1.

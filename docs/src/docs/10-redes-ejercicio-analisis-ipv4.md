# 10. Análisis de Direcciones IPv4 (Ejercicios Guiados)

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

## 2. La caja de herramientas: binario rápido

El análisis de subredes se hace EN BINARIO, no en decimal. La única herramienta que necesitás es la tabla de potencias de un octeto:

```
 128   64   32   16    8    4    2    1   ← valor de cada posición
```

Para convertir un número, sumá los valores de las posiciones con `1`:

```
  1    0    1    1    0    0    0    0   = 128 + 32 + 16 = 176
```

Y ojo con dos valores que aparecen en TODOS los ejercicios:

```
00000000 = 0       10000000 = 128       11000000 = 192
11100000 = 224      11110000 = 240       11111000 = 248
11111100 = 252      11111111 = 255
```

Esa lista es la máscara del cuarto octeto para /25, /26, /27, /28, /29, /30 y /24. Si la memorizás, la mitad del trabajo ya está.

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

### La notación N/n/H/h

Se usa para "ver" la división de un vistazo:

| Símbolo | Significado |
|---------|-------------|
| `N` | Un octeto COMPLETO de red (8 bits) |
| `n` | Un bit individual de red |
| `H` | Un octeto COMPLETO de host (8 bits) |
| `h` | Un bit individual de host |

Los puntos separan octetos reales; dentro de un octeto que mezcla red y host, los `n` y `h` se escriben juntos, sin punto.

```
/24  →  N.N.N.H         (los 3 primeros octetos son red, el último es host)
/26  →  N.N.N.nnhhhhhh  (2 bits de red + 6 de host en el 4º octeto)
/23  →  N.N.nnnnnnnh.H  (7 bits de red + 1 de host en el 3er octeto, y el 4º completo de host)
```

### Ejemplo guiado, completo: 209.165.202.140/27

**Paso 1 — Prefijo.** `/27` → 27 bits de red, h = 32 − 27 = **5 bits de host**.

**Paso 2 — Notación.** 27 = 3 octetos completos (24) + 3 bits en el cuarto octeto. El cuarto octeto queda de 3 bits de red + 5 de host:

```
N.N.N.nnnhhhhh
```

**Paso 3 — Máscara.** 27 unos:

```
11111111.11111111.11111111.11100000  =  255.255.255.224
```

**Paso 4 — Dirección de red.** Poné los 5 bits de host en `0`. El cuarto octeto de la IP (140) en binario es `10001100`. Conservando los 3 bits de red (`100`), los 5 restantes en 0:

```
10000000 = 128   →   red = 209.165.202.128
```

**Paso 5 — Broadcast.** Mismos 3 bits de red, pero ahora los 5 bits de host en `1`:

```
10011111 = 159   →   broadcast = 209.165.202.159
```

**Paso 6 — Rango.** De red + 1 a broadcast − 1:

```
Primer host:    209.165.202.129
Último host:    209.165.202.158
Cantidad: 2⁵ − 2 = 30 hosts
```

> **Verificación rápida:** 140 cae entre 129 y 158 → la IP original vive en esta subred. Si la IP no cayera en el rango, hay un error en la cuenta.

## 4. El atajo de los profesionales: la regla del bloque

Para no convertir a binario en cada ejercicio, existe el atajo que usa todo el mundo:

> **Tamaño del bloque = 2^(bits de host)** — el número total de direcciones de la subred. Y en el octeto donde cae el límite, las subredes saltan de a ese valor.

Pero hay una segunda versión, más rápida todavía, que funciona cuando el límite está en el cuarto octeto:

> **Bloque = 256 − valor del cuarto octeto de la máscara.**

Para `/28` (máscara `…240`): 256 − 240 = **16**. Para `/26` (`…192`): 256 − 192 = **64**. Las dos fórmulas dan lo mismo — elegí la que prefieras.

**Cómo se usa:** dividís el octeto relevante de la IP por el bloque, truncás, y multiplicás de nuevo:

```
192.168.28.45/28   →  bloque 16
45 ÷ 16 = 2 (truncado)   →   2 × 16 = 32
Red = 192.168.28.32      →  Broadcast = 32 + 16 − 1 = 47 → 192.168.28.47
```

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

Fijate el patrón: **cada bit de host que perdés, duplicás el bloque**. Y en los prefijos altos (de /24 para abajo), el "dónde salta" te dice en qué octeto trabajás con la división.

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

## 6. Soluciones paso a paso

> **Regla de oro de la verificación:** en cada respuesta, la IP original TIENE que estar entre el primer y el último host. Si no está, hay un error.

### Solución 1: 192.168.10.10/24

**Paso 1:** `/24` → 24 bits de red, 8 de host.
**Paso 2:** 24 = 3 octetos completos → **N.N.N.H**.
**Paso 3:** 24 unos = `255.255.255.0`.
**Paso 4:** bits de host en 0 → **red `192.168.10.0`**.
**Paso 5:** los 8 bits de host en 1 → `11111111` = **255** → broadcast `192.168.10.255`.
**Paso 6:** primer host `.1`, último `.254`, cantidad 2⁸ − 2 = **254**.

```
Red: 192.168.10.0   Broadcast: 192.168.10.255   Hosts: 192.168.10.1 – 192.168.10.254 (254)
```

### Solución 2: 10.101.99.17/23

**Paso 1:** `/23` → 23 bits de red, 9 de host.
**Paso 2:** 23 = 2 octetos completos (16) + 7 bits en el tercero → tercer octeto con 7 bits de red + 1 de host → **N.N.nnnnnnnh.H**.
**Paso 3:** 23 unos = `11111111.11111111.11111110.00000000` = **255.255.254.0**.
**Paso 4:** el tercer octeto de la IP es 99 = `01100011`. Conservá los 7 bits de red (`0110001`), el último bit en 0: `01100010` = 98. Cuarto octeto en 0 → **red `10.101.98.0`**.
**Paso 5:** mismo cálculo pero el bit de host del tercer octeto en 1: `01100011` = 99; cuarto octeto todo en 1 = 255 → **broadcast `10.101.99.255`**.
**Paso 6:** 2⁹ − 2 = **510** → primer host `10.101.98.1`, último `10.101.99.254`.

```
Red: 10.101.98.0   Broadcast: 10.101.99.255   Hosts: 10.101.98.1 – 10.101.99.254 (510)
```

**Atajo:** bloque = 512 (2⁹) → 3er octeto salta de a 2 → 99 ÷ 2 = 49 (truncado) → 49 × 2 = 98 ✓.

### Solución 3: 209.165.200.227/27

**Paso 1:** `/27` → 27 bits de red, 5 de host.
**Paso 2:** 27 = 24 + 3 → cuarto octeto con 3 bits de red + 5 de host → **N.N.N.nnnhhhhh**.
**Paso 3:** 27 unos = `11111111.11111111.11111111.11100000` = **255.255.255.224**.
**Paso 4:** cuarto octeto 227 = `11100011`; 3 bits de red (`111`), los 5 de host en 0 → `11100000` = 224 → **red `209.165.200.224`**.
**Paso 5:** los 5 de host en 1 → `11111111` = 255 → **broadcast `209.165.200.255`**.
**Paso 6:** 2⁵ − 2 = **30** → `209.165.200.225` a `209.165.200.254`.

```
Red: 209.165.200.224   Broadcast: 209.165.200.255   Hosts: 209.165.200.225 – 209.165.200.254 (30)
```

### Solución 4: 172.31.45.252/24

**Paso 1:** `/24` → 24 bits de red, 8 de host.
**Paso 2:** **N.N.N.H**.
**Paso 3:** `255.255.255.0`.
**Paso 4:** → **red `172.31.45.0`**.
**Paso 5:** → **broadcast `172.31.45.255`**.
**Paso 6:** 2⁸ − 2 = **254** → `.45.1` a `.45.254`.

```
Red: 172.31.45.0   Broadcast: 172.31.45.255   Hosts: 172.31.45.1 – 172.31.45.254 (254)
```

### Solución 5: 10.1.8.200/26

**Paso 1:** `/26` → 26 bits de red, 6 de host.
**Paso 2:** 26 = 24 + 2 → **N.N.N.nnhhhhhh**.
**Paso 3:** `11111111.11111111.11111111.11000000` = **255.255.255.192**.
**Paso 4:** cuarto octeto 200 = `11001000`; 2 bits de red (`11`), host en 0 → `11000000` = 192 → **red `10.1.8.192`**.
**Paso 5:** host en 1 → `11111111` = 255 → **broadcast `10.1.8.255`**.
**Paso 6:** 2⁶ − 2 = **62** → `10.1.8.193` a `10.1.8.254`.

```
Red: 10.1.8.192   Broadcast: 10.1.8.255   Hosts: 10.1.8.193 – 10.1.8.254 (62)
```

### Solución 6: 172.16.117.77/20

**Paso 1:** `/20` → 20 bits de red, 12 de host.
**Paso 2:** 20 = 16 + 4 → tercer octeto con 4 bits de red + 4 de host, cuarto completo de host → **N.N.nnnnhhhh.H**.
**Paso 3:** `11111111.11111111.11110000.00000000` = **255.255.240.0**.
**Paso 4:** tercer octeto 117 = `01110101`; 4 bits de red (`0111`), host en 0 → `01110000` = 112; cuarto octeto en 0 → **red `172.16.112.0`**.
**Paso 5:** tercero con host en 1 → `01111111` = 127; cuarto todo en 1 → **broadcast `172.16.127.255`**.
**Paso 6:** 2¹² − 2 = **4094** → `172.16.112.1` a `172.16.127.254`.

```
Red: 172.16.112.0   Broadcast: 172.16.127.255   Hosts: 172.16.112.1 – 172.16.127.254 (4094)
```

**Verificación con el atajo:** bloque = 2¹² = 4096; en el 3er octeto salta de a 16 → 117 ÷ 16 = 7 → 112 ✓.

### Solución 7: 10.1.1.101/25

**Paso 1:** `/25` → 25 bits de red, 7 de host.
**Paso 2:** 25 = 24 + 1 → **N.N.N.nhhhhhhh**.
**Paso 3:** `...10000000` = **255.255.255.128**.
**Paso 4:** cuarto octeto 101 = `01100101`; 1 bit de red (`0`), host en 0 → `00000000` = 0 → **red `10.1.1.0`**.
**Paso 5:** host en 1 → `01111111` = 127 → **broadcast `10.1.1.127`**.
**Paso 6:** 2⁷ − 2 = **126** → `10.1.1.1` a `10.1.1.126`.

```
Red: 10.1.1.0   Broadcast: 10.1.1.127   Hosts: 10.1.1.1 – 10.1.1.126 (126)
```

### Solución 8: 209.165.202.140/27

**Paso 1:** `/27` → 27 bits de red, 5 de host.
**Paso 2:** **N.N.N.nnnhhhhh**.
**Paso 3:** **255.255.255.224**.
**Paso 4:** cuarto octeto 140 = `10001100`; 3 bits de red (`100`), host en 0 → `10000000` = 128 → **red `209.165.202.128`**.
**Paso 5:** host en 1 → `10011111` = 159 → **broadcast `209.165.202.159`**.
**Paso 6:** 2⁵ − 2 = **30** → `209.165.202.129` a `209.165.202.158`.

```
Red: 209.165.202.128   Broadcast: 209.165.202.159   Hosts: 209.165.202.129 – 209.165.202.158 (30)
```

### Solución 9: 192.168.28.45/28

**Paso 1:** `/28` → 28 bits de red, 4 de host.
**Paso 2:** 28 = 24 + 4 → **N.N.N.nnnnhhhh**.
**Paso 3:** `...11110000` = **255.255.255.240**.
**Paso 4:** cuarto octeto 45 = `00101101`; 4 bits de red (`0010`), host en 0 → `00100000` = 32 → **red `192.168.28.32`**.
**Paso 5:** host en 1 → `00101111` = 47 → **broadcast `192.168.28.47`**.
**Paso 6:** 2⁴ − 2 = **14** → `192.168.28.33` a `192.168.28.46`.

```
Red: 192.168.28.32   Broadcast: 192.168.28.47   Hosts: 192.168.28.33 – 192.168.28.46 (14)
```

**Verificación con el atajo:** bloque = 16 → 45 ÷ 16 = 2 → 32 ✓; broadcast = 32 + 16 − 1 = 47 ✓.

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

## 8. Errores comunes

1. **Confundir red con broadcast.** Red = bits de host en `0`. Broadcast = bits de host en `1`. Son las DOS direcciones reservadas de cada subred.

2. **Olvidar el −2.** La primera dirección es la red y la última el broadcast: los hosts utilizables son `2^h − 2`, no `2^h`.

3. **Equivocarse en la conversión binaria.** El error más común de todos: `11111110` NO es 255 — es **254**. `255` es `11111111`, ocho unos. Un "uno de más o de menos" en la máscara cambia toda la subred.

4. **Contar mal los bits del prefijo.** `/26` tiene 26 unos: `11111111.11111111.11111111.11000000`. Contá los `1` de la máscara y tienen que coincidir con el prefijo SIEMPRE.

5. **Confundir bloque con hosts.** El bloque (2^h) es el total de direcciones de la subred — incluye red y broadcast. Los hosts utilizables son bloque − 2.

6. **Escribir mal la notación.** En `/22`, el tercer octeto tiene 6 bits de red y 2 de host (`nnnnnnhh`), NO "8 de red" (`nnnnnnnn`). Contá los bits: 16 + 6 = 22. Si tu notación no suma el prefijo, está mal.

## 9. Ejercicios para practicar solo

### Ejercicio 1: 192.168.50.100/22

Calculá notación, máscara, red, broadcast y rango.

<details>
<summary>Ver respuesta</summary>

| Campo | Valor |
|-------|-------|
| Notación | N.N.nnnnnnhh.H |
| Máscara | 255.255.252.0 |
| Red | 192.168.48.0 |
| Broadcast | 192.168.51.255 |
| Hosts utilizables | 1.022 |
| Rango de hosts | 192.168.48.1 – 192.168.51.254 |

**Explicación:** /22 = 16 + 6 → tercer octeto con 6 bits de red + 2 de host. Bloque = 2¹⁰ = 1024 → en el 3er octeto salta de a 4. 50 ÷ 4 = 12 → 48. El siguiente bloque arranca en 52 → broadcast .51.255.
</details>

### Ejercicio 2: 10.200.150.75/21

<details>
<summary>Ver respuesta</summary>

| Campo | Valor |
|-------|-------|
| Notación | N.N.nnnnnhhh.H |
| Máscara | 255.255.248.0 |
| Red | 10.200.144.0 |
| Broadcast | 10.200.151.255 |
| Hosts utilizables | 2.046 |
| Rango de hosts | 10.200.144.1 – 10.200.151.254 |

**Explicación:** /21 = 16 + 5 → tercer octeto con 5 bits de red + 3 de host. Bloque = 2¹¹ = 2048 → salta de a 8 en el 3er octeto. 150 ÷ 8 = 18 (truncado) → 144. El siguiente bloque arranca en 152 → broadcast .151.255.
</details>

### Ejercicio 3: 172.16.200.200/19

<details>
<summary>Ver respuesta</summary>

| Campo | Valor |
|-------|-------|
| Notación | N.N.nnnhhhhh.H |
| Máscara | 255.255.224.0 |
| Red | 172.16.192.0 |
| Broadcast | 172.16.223.255 |
| Hosts utilizables | 8.190 |
| Rango de hosts | 172.16.192.1 – 172.16.223.254 |

**Explicación:** /19 = 16 + 3 → tercer octeto con 3 bits de red + 5 de host. Bloque = 2¹³ = 8192 → salta de a 32. 200 ÷ 32 = 6 → 192. Broadcast: 192 + 32 − 1 = 223.
</details>

### Ejercicio 4: 10.10.10.10/29

<details>
<summary>Ver respuesta</summary>

| Campo | Valor |
|-------|-------|
| Notación | N.N.N.nnnnnhhh |
| Máscara | 255.255.255.248 |
| Red | 10.10.10.8 |
| Broadcast | 10.10.10.15 |
| Hosts utilizables | 6 |
| Rango de hosts | 10.10.10.9 – 10.10.10.14 |

**Explicación:** /29 = 24 + 5 → cuarto octeto con 5 bits de red + 3 de host. Bloque = 2³ = 8. 10 ÷ 8 = 1 → 8. Broadcast = 8 + 7 = 15. Solo 6 hosts.
</details>

### Ejercicio 5: 203.0.113.7/30

Un clásico del mundo real: el enlace entre dos routers.

<details>
<summary>Ver respuesta</summary>

| Campo | Valor |
|-------|-------|
| Notación | N.N.N.nnhhhhhh... NO — revisá: /30 = 24 + 6 → N.N.N.nnnnnnhh |
| Máscara | 255.255.255.252 |
| Red | 203.0.113.4 |
| Broadcast | 203.0.113.7 |
| Hosts utilizables | 2 |
| Rango de hosts | 203.0.113.5 – 203.0.113.6 |

**Trampa pedagógica:** ¿viste qué fácil es escribir mal una notación por no contar bits? /30 = 24 bits + 6 bits en el cuarto octeto → 6 n + 2 h. Los dos hosts (`.5` y `.6`) son el router de cada lado.
</details>

### Ejercicio 6: 198.51.100.10/25

<details>
<summary>Ver respuesta</summary>

| Campo | Valor |
|-------|-------|
| Notación | N.N.N.nhhhhhhh |
| Máscara | 255.255.255.128 |
| Red | 198.51.100.0 |
| Broadcast | 198.51.100.127 |
| Hosts utilizables | 126 |
| Rango de hosts | 198.51.100.1 – 198.51.100.126 |

**Explicación:** /25 = 24 + 1 → un bit de red en el cuarto octeto. Bloque = 2⁷ = 128. 10 ÷ 128 = 0 → red .0. La subred "hermana" de esta es la .128/.255.
</details>

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

## 11. Comprobá lo que aprendiste

Respondé antes de destapar — son las preguntas que separan al que memorizó del que entiende.

**1. ¿Cuántos bits de host tiene una /22 y cuántos hosts utilizables?**
<details>
<summary>Ver respuesta</summary>

32 − 22 = **10 bits de host** → 2¹⁰ − 2 = **1.022 hosts**.
</details>

**2. ¿Cuál es la notación correcta de una /19?**
<details>
<summary>Ver respuesta</summary>

19 = 16 + 3 → tercer octeto con 3 bits de red + 5 de host → **N.N.nnnhhhhh.H**. (La notación tiene que sumar el prefijo: 16 + 3 = 19.)
</details>

**3. ¿Por qué está mal `255.255.255.254` como máscara?**
<details>
<summary>Ver respuesta</summary>

Porque los unos de la máscara son **consecutivos** y van primero. `254` en binario es `11111110` — termina en 0 dentro de la parte de unos, cosa imposible. Las máscaras válidas del cuarto octeto son 0, 128, 192, 224, 240, 248, 252, 254 (para /31) y 255. `...254` = /31, que es un caso especial punto a punto.
</details>

**4. Con `10.0.0.77/27`, ¿en qué subred cae la IP?**
<details>
<summary>Ver respuesta</summary>

Bloque 32 → 77 ÷ 32 = 2 → red `10.0.0.64`, broadcast `.95`, hosts `.65` a `.94` (30 hosts). La IP 77 está en el rango → ✓.
</details>

**5. Dos hosts con IP `192.168.1.5/28` y `192.168.1.20/28`. ¿Están en la misma subred?**
<details>
<summary>Ver respuesta</summary>

NO. Bloque 16: la `.5` cae en la subred `192.168.1.0` (hosts .1-.14) y la `.20` en la `192.168.1.16` (hosts .17-.30). Para comunicarse necesitan un router — son redes distintas, aunque compartan los primeros tres octetos. Este es el clásico "tengo IP pero no ping" por mala elección de máscara.
</details>

**6. ¿Qué le cambia a una subred agregarle UN bit de red (pasar de /27 a /28)?**
<details>
<summary>Ver respuesta</summary>

Se **duplica** la cantidad de subredes (de 1 a 2) y se **reduce a la mitad** el tamaño de cada una (de 32 a 16 direcciones, de 30 a 14 hosts). Siempre: cada bit prestado = doble de subredes, mitad de hosts.
</details>

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

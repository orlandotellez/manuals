# Redes - Ejercicio: Análisis de Direcciones IPv4

## Introducción

Este manual te guiará paso a paso para analizar direcciones IPv4 y determinar la **parte de red**, la **parte de host**, la **máscara de subred**, la **dirección de red**, la **dirección de broadcast** y el **rango de hosts utilizables**. Este es un ejercicio fundamental para entender cómo funcionan las subredes y cómo los routers enrutan paquetes entre diferentes redes.

---

## Índice

- [Conceptos Fundamentales](#1-conceptos-fundamentales)
- [Metodología Paso a Paso](#2-metodología-paso-a-paso)
- [Resolución del Ejercicio](#3-resolución-del-ejercicio)
- [Tabla Completa Resuelta](#4-tabla-completa-resuelta)
- [Tips y Trucos](#5-tips-y-trucos)
- [Ejercicios Adicionales para Practicar](#6-ejercicios-adicionales-para-practicar)
- [Resumen de Fórmulas](#7-resumen-de-fórmulas)
- [Conclusión](#conclusión)

---

## 1. Conceptos Fundamentales

### 1.1 ¿Qué es el Prefijo CIDR?

El prefijo CIDR (Classless Inter-Domain Routing) es una notación que indica cuántos bits de la dirección IP corresponden a la parte de red. Se expresa como `/XX` donde **XX** es un número del 0 al 32.

> **Cuantos más bits de red, menos hosts pueden existir en la subred, y viceversa.**

**Ejemplos:**
- `/24` → 24 bits de red, 8 bits de host → 2⁸ − 2 = **254 hosts**
- `/26` → 26 bits de red, 6 bits de host → 2⁶ − 2 = **62 hosts**
- `/28` → 28 bits de red, 4 bits de host → 2⁴ − 2 = **14 hosts**

---

### 1.2 La Notación N, n, H, h

Para representar visualmente la división entre red y host, usamos una notación especial:

| Símbolo | Significado | Descripción |
|---------|-------------|-------------|
| `N` | 8 bits de red | Octeto **completo** en la porción de red |
| `n` | bit individual de red | Un solo bit en la porción de red |
| `H` | 8 bits de host | Octeto **completo** en la porción de host |
| `h` | bit individual de host | Un solo bit en la porción de host |

> Los puntos (`.`) separan octetos reales. Dentro de un octeto que mezcla red y host, se escriben los bits `n` y `h` juntos sin punto intermedio.

**Ejemplo visual para /24:**
```
N.N.N.H    → equivalente a:  NNN.H
```
Los primeros 3 octetos (24 bits) son red, y el último octeto es host.

**Ejemplo visual para /26:**
```
N.N.N.nnhhhhhh
```
- 24 bits de red completos (3 octetos)
- 2 bits adicionales de red en el cuarto octeto (`nn`)
- Los 6 bits restantes del cuarto octeto son de host (`hhhhhh`)

**Ejemplo visual para /23:**
```
N.N.nnnnnnnh.H
```
- 16 bits de red completos (2 octetos)
- 7 bits adicionales de red + 1 bit de host en el tercer octeto (`nnnnnnnh`)
- 1 octeto completo de host (`H`)

### 1.3 Cómo Calcular la Máscara de Subred

La máscara de subred se calcula tomando los primeros **X** bits del prefijo y poniéndolos en `1`:

**Para /24:**
```
11111111.11111111.11111111.00000000 = 255.255.255.0
```

**Para /20:**
```
11111111.11111111.11110000.00000000 = 255.255.240.0
```

**Para /27:**
```
11111111.11111111.11111111.11100000 = 255.255.255.224
```

#### Tabla de referencia rápida:

| CIDR | Bits de red | Bits de host | Hosts utilizables | Máscara Decimal | Binario del Cuarto Octeto |
|------|:-----------:|:------------:|:-----------------:|----------------|--------------------------|
| /24  | 24 | 8  | 254  | 255.255.255.0   | `00000000` |
| /25  | 25 | 7  | 126  | 255.255.255.128 | `10000000` |
| /26  | 26 | 6  | 62   | 255.255.255.192 | `11000000` |
| /27  | 27 | 5  | 30   | 255.255.255.224 | `11100000` |
| /28  | 28 | 4  | 14   | 255.255.255.240 | `11110000` |
| /29  | 29 | 3  | 6    | 255.255.255.248 | `11111000` |
| /30  | 30 | 2  | 2    | 255.255.255.252 | `11111100` |

---

### 1.4 Cómo Calcular la Dirección de Red

La dirección de red se obtiene aplicando una operación **AND** bit a bit entre la dirección IP y la máscara de subred. En la práctica, todos los bits de la porción de host se ponen a `0`.

**Ejemplo con 192.168.10.10/24:**
```
IP:       192.168.10.10
Máscara:  255.255.255.0
-------------------------
Red:      192.168.10.0
```

### 1.5 Cómo Calcular la Dirección de Broadcast

La dirección de broadcast se obtiene poniendo **todos los bits de host en `1`**. Es la última dirección de cada subred.

**Ejemplo con 192.168.10.10/24:**
```
Red:      192.168.10.0   (bits de host = 00000000)
Broadcast: 192.168.10.255 (bits de host = 11111110 → 255)
```

### 1.6 Rango de Hosts Utilizables

El rango de hosts utilizables va desde la **primera IP después de la red** hasta la **última IP antes del broadcast**:

```
Rango = Red + 1  hasta  Broadcast − 1
```

> **¿Por qué se restan 2?** La dirección de red identifica a la subred y la de broadcast envía a todos los hosts. Ningún dispositivo puede usarlas.

---

## 2. Metodología Paso a Paso

### Paso 1: Identificar el Prefijo
Del ejercicio, identificamos el prefijo CIDR de cada dirección.

### Paso 2: Determinar la Notación N/n/H/h
Contamos cuántos bits son de red (primeros X bits del prefijo) y cuántos son de host (los restantes hasta 32).

### Paso 3: Calcular la Máscara de Subred
Convertimos el prefijo a notación decimal con puntos.

### Paso 4: Calcular la Dirección de Red
Aplicamos la máscara a la dirección IP (todos los bits de host = 0).

### Paso 5: Calcular la Dirección de Broadcast
Ponemos todos los bits de host en 1.

### Paso 6: Determinar el Rango de Hosts Utilizables
Desde `Red + 1` hasta `Broadcast − 1`.

---

## 3. Resolución del Ejercicio

### Ejercicio: Analiza la siguiente tabla

| # | Dirección IP/Prefijo | Notación Red/Host | Máscara de Subred | Dirección de Red | Dirección de Broadcast | Hosts Utilizables | Rango de Hosts |
|---|---------------------|-------------------|-------------------|------------------|-----------------------|:-:|----------------|
| 1 | 192.168.10.10/24 | ? | ? | ? | ? | ? | ? |
| 2 | 10.101.99.17/23 | ? | ? | ? | ? | ? | ? |
| 3 | 209.165.200.227/27 | ? | ? | ? | ? | ? | ? |
| 4 | 172.31.45.252/24 | ? | ? | ? | ? | ? | ? |
| 5 | 10.1.8.200/26 | ? | ? | ? | ? | ? | ? |
| 6 | 172.16.117.77/20 | ? | ? | ? | ? | ? | ? |
| 7 | 10.1.1.101/25 | ? | ? | ? | ? | ? | ? |
| 8 | 209.165.202.140/27 | ? | ? | ? | ? | ? | ? |
| 9 | 192.168.28.45/28 | ? | ? | ? | ? | ? | ? |

---

### Solución 1: 192.168.10.10/24

**Paso 1: Prefijo /24 = 24 bits de red**

**Paso 2: Notación**
- 24 bits ÷ 8 bits por octeto = 3 octetos completos de red
- Notación: `N.N.N.H`

**Paso 3: Máscara de subred**
- 24 bits en 1 = `11111111.11111111.11111111.00000000`
- Decimal: `255.255.255.0`

**Paso 4: Dirección de red**
- IP: `192.168.10.10`
- Aplicando máscara: `192.168.10.0`

**Paso 5: Dirección de broadcast**
- Bits de host: 8 → todos en `1` = `11111111` = 255
- Broadcast: `192.168.10.255`

**Paso 6: Rango de hosts utilizables**
- Primer host: `192.168.10.1`
- Último host: `192.168.10.254`
- Total de hosts: 2⁸ − 2 = **254**

**Respuesta:**

| Campo | Valor |
|-------|-------|
| Notación | N.N.N.H |
| Máscara | 255.255.255.0 |
| Red | 192.168.10.0 |
| Broadcast | 192.168.10.255 |
| Hosts utilizables | 254 |
| Rango de hosts | 192.168.10.1 – 192.168.10.254 |

---

### Solución 2: 10.101.99.17/23

**Paso 1: Prefijo /23 = 23 bits de red**

**Paso 2: Notación**
- 23 bits = 2 octetos completos (16 bits) + 7 bits del tercer octeto
- Tercer octeto: 7 bits de red + 1 bit de host → `nnnnnnnh`
- Notación: `N.N.nnnnnnnh.H`

**Paso 3: Máscara de subred**
- 23 bits en 1 = `11111111.11111111.11111110.00000000`
- Decimal: `255.255.254.0`

**Paso 4: Dirección de red**
- IP: `10.101.99.17`
- Tercer octeto en binario: `01100011` (99)
- Conservando los 7 bits de red: `0110001_` → `01100010` = 98
- Cuarto octeto: todos los bits de host → `00000000` = 0
- Dirección de red: `10.101.98.0`

**Paso 5: Dirección de broadcast**
- Bits de host: 9 (1 bit en 3er octeto + 8 en 4to)
- Tercer octeto: `01100011` → `0110001_` → `01100011` = 99
- Cuarto octeto: todos en `1` = `11111111` = 255
- Broadcast: `10.101.99.255`

**Paso 6: Rango de hosts utilizables**
- Primer host: `10.101.98.1`
- Último host: `10.101.99.254`
- Total de hosts: 2⁹ − 2 = **510**

**Respuesta:**

| Campo | Valor |
|-------|-------|
| Notación | N.N.nnnnnnnh.H |
| Máscara | 255.255.254.0 |
| Red | 10.101.98.0 |
| Broadcast | 10.101.99.255 |
| Hosts utilizables | 510 |
| Rango de hosts | 10.101.98.1 – 10.101.99.254 |

---

### Solución 3: 209.165.200.227/27

**Paso 1: Prefijo /27 = 27 bits de red**

**Paso 2: Notación**
- 27 bits = 3 octetos completos (24 bits) + 3 bits del cuarto octeto
- Cuarto octeto: 3 bits de red + 5 bits de host → `nnnhhhhh`
- Notación: `N.N.N.nnnhhhhh`

**Paso 3: Máscara de subred**
- 27 bits en 1 = `11111111.11111111.11111111.11100000`
- Decimal: `255.255.255.224`

**Paso 4: Dirección de red**
- IP: `209.165.200.227`
- Cuarto octeto en binario: `11100011` (227)
- Conservando los 3 bits de red: `111_____` → `11100000` = 224
- Dirección de red: `209.165.200.224`

**Paso 5: Dirección de broadcast**
- Cuarto octeto: `111_____` → `11111111` = 255
- Broadcast: `209.165.200.255`

**Paso 6: Rango de hosts utilizables**
- Primer host: `209.165.200.225`
- Último host: `209.165.200.254`
- Total de hosts: 2⁵ − 2 = **30**

**Respuesta:**

| Campo | Valor |
|-------|-------|
| Notación | N.N.N.nnnhhhhh |
| Máscara | 255.255.255.224 |
| Red | 209.165.200.224 |
| Broadcast | 209.165.200.255 |
| Hosts utilizables | 30 |
| Rango de hosts | 209.165.200.225 – 209.165.200.254 |

---

### Solución 4: 172.31.45.252/24

**Paso 1: Prefijo /24 = 24 bits de red**

**Paso 2: Notación**
- 24 bits = 3 octetos completos de red
- Notación: `N.N.N.H`

**Paso 3: Máscara de subred**
- `255.255.255.0`

**Paso 4: Dirección de red**
- IP: `172.31.45.252`
- Aplicando máscara: `172.31.45.0`

**Paso 5: Dirección de broadcast**
- Cuarto octeto: todos en `1` = 255
- Broadcast: `172.31.45.255`

**Paso 6: Rango de hosts utilizables**
- Primer host: `172.31.45.1`
- Último host: `172.31.45.254`
- Total de hosts: 2⁸ − 2 = **254**

**Respuesta:**

| Campo | Valor |
|-------|-------|
| Notación | N.N.N.H |
| Máscara | 255.255.255.0 |
| Red | 172.31.45.0 |
| Broadcast | 172.31.45.255 |
| Hosts utilizables | 254 |
| Rango de hosts | 172.31.45.1 – 172.31.45.254 |

---

### Solución 5: 10.1.8.200/26

**Paso 1: Prefijo /26 = 26 bits de red**

**Paso 2: Notación**
- 26 bits = 3 octetos completos (24 bits) + 2 bits del cuarto octeto
- Cuarto octeto: 2 bits de red + 6 bits de host → `nnhhhhhh`
- Notación: `N.N.N.nnhhhhhh`

**Paso 3: Máscara de subred**
- 26 bits en 1 = `11111111.11111111.11111111.11000000`
- Decimal: `255.255.255.192`

**Paso 4: Dirección de red**
- IP: `10.1.8.200`
- Cuarto octeto en binario: `11001000` (200)
- Conservando los 2 bits de red: `11______` → `11000000` = 192
- Dirección de red: `10.1.8.192`

**Paso 5: Dirección de broadcast**
- Cuarto octeto: `11______` → `11111111` = 255
- Broadcast: `10.1.8.255`

**Paso 6: Rango de hosts utilizables**
- Primer host: `10.1.8.193`
- Último host: `10.1.8.254`
- Total de hosts: 2⁶ − 2 = **62**

**Respuesta:**

| Campo | Valor |
|-------|-------|
| Notación | N.N.N.nnhhhhhh |
| Máscara | 255.255.255.192 |
| Red | 10.1.8.192 |
| Broadcast | 10.1.8.255 |
| Hosts utilizables | 62 |
| Rango de hosts | 10.1.8.193 – 10.1.8.254 |

---

### Solución 6: 172.16.117.77/20

**Paso 1: Prefijo /20 = 20 bits de red**

**Paso 2: Notación**
- 20 bits = 2 octetos completos (16 bits) + 4 bits del tercer octeto
- Tercer octeto: 4 bits de red + 4 bits de host → `nnnnhhhh`
- Cuarto octeto: completo de host → `H`
- Notación: `N.N.nnnnhhhh.H`

**Paso 3: Máscara de subred**
- 20 bits en 1 = `11111111.11111111.11110000.00000000`
- Decimal: `255.255.240.0`

**Paso 4: Dirección de red**
- IP: `172.16.117.77`
- Tercer octeto en binario: `01110101` (117)
- Conservando los 4 bits de red: `0111____` → `01110000` = 112
- Cuarto octeto: todos los bits de host → `00000000` = 0
- Dirección de red: `172.16.112.0`

> **Verificación rápida:** El tamaño de bloque para /20 en el tercer octeto es 2⁴ = 16. Los múltiplos de 16 más cercanos: ...96, 112, 128... → 112 es el que contiene al 117. ✅

**Paso 5: Dirección de broadcast**
- Tercer octeto: `0111____` → `01111111` = 127
- Cuarto octeto: todos en `1` = 255
- Broadcast: `172.16.127.255`

**Paso 6: Rango de hosts utilizables**
- Primer host: `172.16.112.1`
- Último host: `172.16.127.254`
- Total de hosts: 2¹² − 2 = **4094**

**Respuesta:**

| Campo | Valor |
|-------|-------|
| Notación | N.N.nnnnhhhh.H |
| Máscara | 255.255.240.0 |
| Red | 172.16.112.0 |
| Broadcast | 172.16.127.255 |
| Hosts utilizables | 4094 |
| Rango de hosts | 172.16.112.1 – 172.16.127.254 |

---

### Solución 7: 10.1.1.101/25

**Paso 1: Prefijo /25 = 25 bits de red**

**Paso 2: Notación**
- 25 bits = 3 octetos completos (24 bits) + 1 bit del cuarto octeto
- Cuarto octeto: 1 bit de red + 7 bits de host → `nhhhhhhh`
- Notación: `N.N.N.nhhhhhhh`

**Paso 3: Máscara de subred**
- 25 bits en 1 = `11111111.11111111.11111111.10000000`
- Decimal: `255.255.255.128`

**Paso 4: Dirección de red**
- IP: `10.1.1.101`
- Cuarto octeto en binario: `01100101` (101)
- Conservando el 1 bit de red: `0_______` → `00000000` = 0
- Dirección de red: `10.1.1.0`

**Paso 5: Dirección de broadcast**
- Cuarto octeto: `0_______` → `01111111` = 127
- Broadcast: `10.1.1.127`

**Paso 6: Rango de hosts utilizables**
- Primer host: `10.1.1.1`
- Último host: `10.1.1.126`
- Total de hosts: 2⁷ − 2 = **126**

**Respuesta:**

| Campo | Valor |
|-------|-------|
| Notación | N.N.N.nhhhhhhh |
| Máscara | 255.255.255.128 |
| Red | 10.1.1.0 |
| Broadcast | 10.1.1.127 |
| Hosts utilizables | 126 |
| Rango de hosts | 10.1.1.1 – 10.1.1.126 |

---

### Solución 8: 209.165.202.140/27

**Paso 1: Prefijo /27 = 27 bits de red**

**Paso 2: Notación**
- 27 bits = 3 octetos completos (24 bits) + 3 bits del cuarto octeto
- Cuarto octeto: 3 bits de red + 5 bits de host → `nnnhhhhh`
- Notación: `N.N.N.nnnhhhhh`

**Paso 3: Máscara de subred**
- `255.255.255.224`

**Paso 4: Dirección de red**
- IP: `209.165.202.140`
- Cuarto octeto en binario: `10001100` (140)
- Conservando los 3 bits de red: `100_____` → `10000000` = 128
- Dirección de red: `209.165.202.128`

**Paso 5: Dirección de broadcast**
- Cuarto octeto: `100_____` → `10011111` = 159
- Broadcast: `209.165.202.159`

**Paso 6: Rango de hosts utilizables**
- Primer host: `209.165.202.129`
- Último host: `209.165.202.158`
- Total de hosts: 2⁵ − 2 = **30**

**Respuesta:**

| Campo | Valor |
|-------|-------|
| Notación | N.N.N.nnnhhhhh |
| Máscara | 255.255.255.224 |
| Red | 209.165.202.128 |
| Broadcast | 209.165.202.159 |
| Hosts utilizables | 30 |
| Rango de hosts | 209.165.202.129 – 209.165.202.158 |

---

### Solución 9: 192.168.28.45/28

**Paso 1: Prefijo /28 = 28 bits de red**

**Paso 2: Notación**
- 28 bits = 3 octetos completos (24 bits) + 4 bits del cuarto octeto
- Cuarto octeto: 4 bits de red + 4 bits de host → `nnnnhhhh`
- Notación: `N.N.N.nnnnhhhh`

**Paso 3: Máscara de subred**
- 28 bits en 1 = `11111111.11111111.11111111.11110000`
- Decimal: `255.255.255.240`

**Paso 4: Dirección de red**
- IP: `192.168.28.45`
- Cuarto octeto en binario: `00101101` (45)
- Conservando los 4 bits de red: `0010____` → `00100000` = 32
- Dirección de red: `192.168.28.32`

**Paso 5: Dirección de broadcast**
- Cuarto octeto: `0010____` → `00101111` = 47
- Broadcast: `192.168.28.47`

**Paso 6: Rango de hosts utilizables**
- Primer host: `192.168.28.33`
- Último host: `192.168.28.46`
- Total de hosts: 2⁴ − 2 = **14**

**Respuesta:**

| Campo | Valor |
|-------|-------|
| Notación | N.N.N.nnnnhhhh |
| Máscara | 255.255.255.240 |
| Red | 192.168.28.32 |
| Broadcast | 192.168.28.47 |
| Hosts utilizables | 14 |
| Rango de hosts | 192.168.28.33 – 192.168.28.46 |

---

## 4. Tabla Completa Resuelta

| Dirección IP/Prefijo | Notación | Máscara de Subred | Dirección de Red | Broadcast | Hosts Utilizables | Rango de Hosts |
|----------------------|----------|-------------------|------------------|-----------|:-----------------:|----------------|
| 192.168.10.10/24 | N.N.N.H | 255.255.255.0 | 192.168.10.0 | 192.168.10.255 | 254 | 192.168.10.1 – 192.168.10.254 |
| 10.101.99.17/23 | N.N.nnnnnnnh.H | 255.255.254.0 | 10.101.98.0 | 10.101.99.255 | 510 | 10.101.98.1 – 10.101.99.254 |
| 209.165.200.227/27 | N.N.N.nnnhhhhh | 255.255.255.224 | 209.165.200.224 | 209.165.200.255 | 30 | 209.165.200.225 – 209.165.200.254 |
| 172.31.45.252/24 | N.N.N.H | 255.255.255.0 | 172.31.45.0 | 172.31.45.255 | 254 | 172.31.45.1 – 172.31.45.254 |
| 10.1.8.200/26 | N.N.N.nnhhhhhh | 255.255.255.192 | 10.1.8.192 | 10.1.8.255 | 62 | 10.1.8.193 – 10.1.8.254 |
| 172.16.117.77/20 | N.N.nnnnhhhh.H | 255.255.240.0 | 172.16.112.0 | 172.16.127.255 | 4094 | 172.16.112.1 – 172.16.127.254 |
| 10.1.1.101/25 | N.N.N.nhhhhhhh | 255.255.255.128 | 10.1.1.0 | 10.1.1.127 | 126 | 10.1.1.1 – 10.1.1.126 |
| 209.165.202.140/27 | N.N.N.nnnhhhhh | 255.255.255.224 | 209.165.202.128 | 209.165.202.159 | 30 | 209.165.202.129 – 209.165.202.158 |
| 192.168.28.45/28 | N.N.N.nnnnhhhh | 255.255.255.240 | 192.168.28.32 | 192.168.28.47 | 14 | 192.168.28.33 – 192.168.28.46 |

---

## 5. Tips y Trucos

### 5.1 Cálculo Mental Rápido

**Para determinar la dirección de red:**

1. Calcula el **tamaño de bloque**: 2^(32 − prefijo)
2. Divide el octeto relevante de la IP por el tamaño de bloque (ignorando decimales)
3. Multiplica el resultado por el tamaño de bloque

> **Atajo:** El tamaño de bloque te dice cuántas direcciones hay por subred, y también cuál es el incremento entre cada red consecutiva.

**Ejemplo con /28 (tamaño de bloque = 16):**
- IP: `192.168.28.45`
- 45 ÷ 16 = 2 (ignorando decimales)
- 2 × 16 = **32**
- Dirección de red: `192.168.28.32` ✅
- Broadcast: 32 + 16 − 1 = **47** → `192.168.28.47` ✅

**Ejemplo con /20 (tamaño de bloque en el 3er octeto = 16):**
- IP: `172.16.117.77`
- 117 ÷ 16 = 7 (ignorando decimales)
- 7 × 16 = **112**
- Dirección de red: `172.16.112.0` ✅
- Broadcast: 112 + 16 − 1 = **127** → `172.16.127.255` ✅

**Tabla de tamaños de bloque por prefijo:**

| Prefijo | Bits de host | Hosts utilizables | Tamaño de bloque |
|:-------:|:------------:|:-----------------:|:----------------:|
| /24 | 8 | 254 | 1 |
| /25 | 7 | 126 | 1 |
| /26 | 6 | 62 | 2 |
| /27 | 5 | 30 | 4 |
| /28 | 4 | 14 | 16 |
| /29 | 3 | 6 | 32 |
| /30 | 2 | 2 | 64 |
| /23 | 9 | 510 | 1 (en 3er octeto, saltos de 2) |
| /22 | 10 | 1022 | 4 (en 3er octeto, saltos de 4) |
| /21 | 11 | 2046 | 8 (en 3er octeto, saltos de 8) |
| /20 | 12 | 4094 | 16 (en 3er octeto, saltos de 16) |
| /19 | 13 | 8190 | 32 (en 3er octeto, saltos de 32) |

---

### 5.2 Errores Comunes

1. **Confundir la dirección de red con la de broadcast**: La dirección de red tiene todos los bits de host en `0`. La dirección de broadcast tiene todos los bits de host en `1`. Son direcciones reservadas; ningún dispositivo puede usarlas.

2. **Olvidar que el primer y último host no se usan**: En cada subred, la primera dirección es la de red y la última es broadcast. Los hosts usan las direcciones intermedias.

3. **No convertir correctamente a binario**: Siempre es útil convertir a binario para visualizar mejor la división entre red y host. Un error común es equivocarse en la conversión decimal ↔ binario.

4. **Contar mal los bits del prefijo**: Asegúrate de que la cantidad de `1` en la máscara coincida exactamente con el prefijo. Por ejemplo, `/26` tiene 26 unos: `11111111.11111111.11111111.11000000`.

5. **Confundir el tamaño de bloque**: El tamaño de bloque (2^(32−prefijo)) nos da el número total de direcciones en la subred, no la cantidad de hosts. Para obtener hosts utilizables: tamaño de bloque − 2.

---

## 6. Ejercicios Adicionales para Practicar

### Ejercicio 1
Dada la IP `192.168.50.100/22`:
- Determina la notación N/n/H/h
- Calcula la máscara de subred
- Calcula la dirección de red
- Calcula la dirección de broadcast
- Indica el rango de hosts utilizables

<details>
<summary>💡 Verificar respuesta</summary>

| Campo | Valor |
|-------|-------|
| Notación | N.N.nnnnnnnn.HH |
| Máscara | 255.255.252.0 |
| Red | 192.168.48.0 |
| Broadcast | 192.168.51.255 |
| Hosts utilizables | 1022 |
| Rango de hosts | 192.168.48.1 – 192.168.51.254 |

**Explicación:** /22 = 22 bits de red = 2 octetos completos + 6 bits en el tercer octeto. Tamaño de bloque = 2^(32−22) = 1024 direcciones. 48 ÷ 4 = 12 exacto → la red es .48.0. El siguiente bloque empieza en .52.0, así que el broadcast es .51.255.

</details>

---

### Ejercicio 2
Dada la IP `10.200.150.75/21`:
- Determina la notación N/n/H/h
- Calcula la máscara de subred
- Calcula la dirección de red
- Calcula la dirección de broadcast
- Indica el rango de hosts utilizables

<details>
<summary>💡 Verificar respuesta</summary>

| Campo | Valor |
|-------|-------|
| Notación | N.N.nnnnnnnn.n.H |
| Máscara | 255.255.248.0 |
| Red | 10.200.144.0 |
| Broadcast | 10.200.151.255 |
| Hosts utilizables | 2046 |
| Rango de hosts | 10.200.144.1 – 10.200.151.254 |

**Explicación:** /21 = 21 bits de red = 2 octetos completos + 5 bits en el tercer octeto. Tamaño de bloque = 2^(32−21) = 2048 direcciones. 150 ÷ 8 = 18 (truncado) → 18 × 8 = 144. Red = .144.0, broadcast = .151.255.

</details>

---

### Ejercicio 3
Dada la IP `172.16.200.200/19`:
- Determina la notación N/n/H/h
- Calcula la máscara de subred
- Calcula la dirección de red
- Calcula la dirección de broadcast
- Indica el rango de hosts utilizables

<details>
<summary>💡 Verificar respuesta</summary>

| Campo | Valor |
|-------|-------|
| Notación | N.N.nnnnnnnn.nnn.H |
| Máscara | 255.255.224.0 |
| Red | 172.16.192.0 |
| Broadcast | 172.16.223.255 |
| Hosts utilizables | 8190 |
| Rango de hosts | 172.16.192.1 – 172.16.223.254 |

**Explicación:** /19 = 19 bits de red = 2 octetos completos + 3 bits en el tercer octeto. Tamaño de bloque = 2^(32−19) = 8192 direcciones. 200 ÷ 32 = 6 (truncado) → 6 × 32 = 192. Red = .192.0, broadcast = .223.255.

</details>

---

### Ejercicio 4
Dada la IP `10.10.10.10/29`:
- Determina la notación N/n/H/h
- Calcula la máscara de subred
- Calcula la dirección de red
- Calcula la dirección de broadcast
- Indica el rango de hosts utilizables
- ¿Cuántos hosts se pueden asignar en esta subred?

<details>
<summary>💡 Verificar respuesta</summary>

| Campo | Valor |
|-------|-------|
| Notación | N.N.N.nnnnnnnh |
| Máscara | 255.255.255.248 |
| Red | 10.10.10.8 |
| Broadcast | 10.10.10.15 |
| Hosts utilizables | 6 |
| Rango de hosts | 10.10.10.9 – 10.10.10.14 |

**Explicación:** /29 = 29 bits de red, 3 bits de host. Tamaño de bloque = 2^3 = 8. 10 ÷ 8 = 1 (truncado) → 1 × 8 = 8. Red = .8, broadcast = .15 (8 + 7). Solo caben 6 hosts (8 − 2).

</details>

---

## 7. Resumen de Fórmulas

| Concepto | Fórmula |
|----------|---------|
| Bits de host | 32 − Prefijo |
| Total de direcciones | 2^(32 − Prefijo) |
| Hosts utilizables | 2^(32 − Prefijo) − 2 |
| Tamaño de bloque | 2^(32 − Prefijo) |
| Dirección de broadcast | Red + Tamaño de bloque − 1 |
| Primer host utilizable | Red + 1 |
| Último host utilizable | Broadcast − 1 |

---

## Conclusión

El análisis de direcciones IPv4 es una habilidad fundamental en redes. La clave está en entender cómo el prefijo CIDR determina la división entre red y host, y cómo la máscara de subred se aplica para obtener la dirección de red, el broadcast y el rango de hosts utilizables.

**Recordatorio:** Siempre se pierden 2 direcciones por subred — la de red (identifica la subred) y la de broadcast (envía a todos). Solo los hosts intermedios son asignables a dispositivos.

> **Tip:** Practica convirtiendo números decimales a binario y viceversa hasta que lo hagas de forma natural. Es la base de todo análisis de subredes.

---

> **Fuente:** Documentación propia basada en estándares de direccionamiento IPv4 y CIDR.
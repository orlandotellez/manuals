# Redes - Ejercicio: Análisis de Direcciones IPv4

## Introducción

Este manual te guiará paso a paso para analizar direcciones IPv4 y determinar cuál es la parte de red y cuál es la parte de host. Este es un ejercicio fundamental para entender cómo funcionan las subredes y cómo los routers enrutan paquetes entre diferentes redes.

---

## 1. Conceptos Fundamentales

### 1.1 ¿Qué es el Prefijo CIDR?

El prefijo CIDR (Classless Inter-Domain Routing) es una notación que indica cuántos bits de la dirección IP corresponden a la parte de red. Se expresa como `/XX` donde XX es un número del 0 al 32.

**Ejemplos:**
- `/24` significa que los primeros 24 bits son de red
- `/26` significa que los primeros 26 bits son de red
- `/28` significa que los primeros 28 bits son de red

### 1.2 La Notación N, n, H, h

Para representar visualmente la división entre red y host, usamos una notación especial:

| Símbolo | Significado | Descripción |
|---------|-------------|-------------|
| `N` | 8 bits de red | octeto completo en la porción de red |
| `n` | bit individual de red | un solo bit en la porción de red |
| `H` | 8 bits de host | octeto completo en la porción de host |
| `h` | bit individual de host | un solo bit en la porción de host |

**Ejemplo visual para /24:**
```
NNNH.HHHH.HHHH.HHHH
```
Esto significa que los primeros 3 octetos (24 bits) son red, y el último octeto es host.

**Ejemplo visual para /26:**
```
NNNnnHH.HHHH.HHHH.HHHH
```
Esto significa:
- 24 bits de red completos (3 octetos)
- 2 bits adicionales de red (por eso `nn`)
- Los 6 bits restantes del cuarto octeto son de host (por eso `hhHHHH`)

### 1.3 Cómo Calcular la Máscara de Subred

La máscara de subred se calcula tomando los primeros X bits del prefijo y poniéndolos en 1:

**Para /24:**
```
11111111.11111111.11111111.00000000
= 255.255.255.0
```

**Para /26:**
```
11111111.11111111.11111111.11000000
= 255.255.255.192
```

**Tabla de referencia rápida:**

| CIDR | Máscara Decimal | Binario del Cuarto Octeto |
|------|----------------|--------------------------|
| /24 | 255.255.255.0 | 00000000 |
| /25 | 255.255.255.128 | 10000000 |
| /26 | 255.255.255.192 | 11000000 |
| /27 | 255.255.255.224 | 11100000 |
| /28 | 255.255.255.240 | 11110000 |
| /29 | 255.255.255.248 | 11111000 |
| /30 | 255.255.255.252 | 11111100 |

### 1.4 Cómo Calcular la Dirección de Red

La dirección de red se obtiene aplicando una operación AND bit a bit entre la dirección IP y la máscara de subred. En términos simples: todos los bits de la porción de host se ponen a 0.

**Ejemplo con 192.168.10.10/24:**
```
IP:       192.168.10.10
Máscara:  255.255.255.0
------------------------
Red:      192.168.10.0
```

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

---

## 3. Resolución del Ejercicio

### Ejercicio: Analiza la siguiente tabla

| Dirección IP/Prefijo | Notación Red/Host | Máscara de Subred | Dirección de Red |
|---------------------|-------------------|-------------------|------------------|
| 192.168.10.10/24 | ? | ? | ? |
| 10.101.99.17/23 | ? | ? | ? |
| 209.165.200.227/27 | ? | ? | ? |
| 172.31.45.252/24 | ? | ? | ? |
| 10.1.8.200/26 | ? | ? | ? |
| 172.16.117.77/20 | ? | ? | ? |
| 10.1.1.101/25 | ? | ? | ? |
| 209.165.202.140/27 | ? | ? | ? |
| 192.168.28.45/28 | ? | ? | ? |

---

### Solución 1: 192.168.10.10/24

**Paso 1: Prefijo /24 = 24 bits de red**

**Paso 2: Notación**
- 24 bits ÷ 8 bits por octeto = 3 octetos completos de red
- Notación: `NNNH.HHHH.HHHH.HHHH` → simplificado: `NNNH`

**Paso 3: Máscara de subred**
- 24 bits en 1 = `11111111.11111111.11111111.00000000`
- Decimal: `255.255.255.0`

**Paso 4: Dirección de red**
- IP: `192.168.10.10`
- Aplicando máscara: `192.168.10.0`

**Respuesta:**
| Notación | Máscara | Red |
|----------|---------|-----|
| NNNH | 255.255.255.0 | 192.168.10.0 |

---

### Solución 2: 10.101.99.17/23

**Paso 1: Prefijo /23 = 23 bits de red**

**Paso 2: Notación**
- 23 bits = 2 octetos completos (16 bits) + 7 bits del tercer octeto
- Tercer octeto: 7 bits de red + 1 bit de host = `nnnnnnn` + `h`
- Notación: `NN.nnnnnnn.hHHHHHHH`

**Paso 3: Máscara de subred**
- 23 bits en 1 = `11111111.11111111.11111110.00000000`
- Decimal: `255.255.254.0`

**Paso 4: Dirección de red**
- IP: `10.101.99.17`
- Tercer octeto en binario: `01100011`
- Con máscara (7 bits de red): `01100010` = 98
- Cuarto octeto = 0
- Dirección de red: `10.101.98.0`

**Respuesta:**
| Notación | Máscara | Red |
|----------|---------|-----|
| NNnnnnnnn.HHHHHHHH | 255.255.254.0 | 10.101.98.0 |

---

### Solución 3: 209.165.200.227/27

**Paso 1: Prefijo /27 = 27 bits de red**

**Paso 2: Notación**
- 27 bits = 3 octetos completos (24 bits) + 3 bits del cuarto octeto
- Cuarto octeto: 3 bits de red + 5 bits de host = `nnn` + `hhhhh`
- Notación: `NNNnnnhhhhh`

**Paso 3: Máscara de subred**
- 27 bits en 1 = `11111111.11111111.11111111.11100000`
- Decimal: `255.255.255.224`

**Paso 4: Dirección de red**
- IP: `209.165.200.227`
- Cuarto octeto: `11100011`
- Con máscara (3 bits de red): `11100000` = 224
- Dirección de red: `209.165.200.224`

**Respuesta:**
| Notación | Máscara | Red |
|----------|---------|-----|
| NNNnnnhhhhh | 255.255.255.224 | 209.165.200.224 |

---

### Solución 4: 172.31.45.252/24

**Paso 1: Prefijo /24 = 24 bits de red**

**Paso 2: Notación**
- 24 bits = 3 octetos completos
- Notación: `NNNH`

**Paso 3: Máscara de subred**
- `255.255.255.0`

**Paso 4: Dirección de red**
- IP: `172.31.45.252`
- Aplicando máscara: `172.31.45.0`

**Respuesta:**
| Notación | Máscara | Red |
|----------|---------|-----|
| NNNH | 255.255.255.0 | 172.31.45.0 |

---

### Solución 5: 10.1.8.200/26

**Paso 1: Prefijo /26 = 26 bits de red**

**Paso 2: Notación**
- 26 bits = 3 octetos completos (24 bits) + 2 bits del cuarto octeto
- Cuarto octeto: 2 bits de red + 6 bits de host = `nn` + `hhhhhh`
- Notación: `NNNnnhhhhhh`

**Paso 3: Máscara de subred**
- 26 bits en 1 = `11111111.11111111.11111111.11000000`
- Decimal: `255.255.255.192`

**Paso 4: Dirección de red**
- IP: `10.1.8.200`
- Cuarto octeto: `11001000`
- Con máscara (2 bits de red): `11000000` = 192
- Dirección de red: `10.1.8.192`

**Respuesta:**
| Notación | Máscara | Red |
|----------|---------|-----|
| NNNnnhhhhhh | 255.255.255.192 | 10.1.8.192 |

---

### Solución 6: 172.16.117.77/20

**Paso 1: Prefijo /20 = 20 bits de red**

**Paso 2: Notación**
- 20 bits = 2 octetos completos (16 bits) + 4 bits del tercer octeto
- Tercer octeto: 4 bits de red + 4 bits de host = `nnnn` + `HHHH`
- Cuarto octeto: completo de host
- Notación: `NNnnnnHH.HHHH.HHHH`

**Paso 3: Máscara de subred**
- 20 bits en 1 = `11111111.11111111.11110000.00000000`
- Decimal: `255.255.240.0`

**Paso 4: Dirección de red**
- IP: `172.16.117.77`
- Tercer octeto: `01110101`
- Con máscara (4 bits de red): `01110000` = 112
- Cuarto octeto = 0
- Dirección de red: `172.16.112.0`

**Respuesta:**
| Notación | Máscara | Red |
|----------|---------|-----|
| NNnnnnHHHH.HHHH.HHHH | 255.255.240.0 | 172.16.112.0 |

---

### Solución 7: 10.1.1.101/25

**Paso 1: Prefijo /25 = 25 bits de red**

**Paso 2: Notación**
- 25 bits = 3 octetos completos (24 bits) + 1 bit del cuarto octeto
- Cuarto octeto: 1 bit de red + 7 bits de host = `n` + `hhhhhhh`
- Notación: `NNNnhhhhhhh`

**Paso 3: Máscara de subred**
- 25 bits en 1 = `11111111.11111111.11111111.10000000`
- Decimal: `255.255.255.128`

**Paso 4: Dirección de red**
- IP: `10.1.1.101`
- Cuarto octeto: `01100101`
- Con máscara (1 bit de red): `0` + `0000000` = 0
- Dirección de red: `10.1.1.0`

**Respuesta:**
| Notación | Máscara | Red |
|----------|---------|-----|
| NNNnhhhhhhh | 255.255.255.128 | 10.1.1.0 |

---

### Solución 8: 209.165.202.140/27

**Paso 1: Prefijo /27 = 27 bits de red**

**Paso 2: Notación**
- 27 bits = 3 octetos completos (24 bits) + 3 bits del cuarto octeto
- Mismo patrón que el ejercicio 3
- Notación: `NNNnnnhhhhh`

**Paso 3: Máscara de subred**
- `255.255.255.224`

**Paso 4: Dirección de red**
- IP: `209.165.202.140`
- Cuarto octeto: `10001100`
- Con máscara (3 bits de red): `10000000` = 128
- Dirección de red: `209.165.202.128`

**Respuesta:**
| Notación | Máscara | Red |
|----------|---------|-----|
| NNNnnnhhhhh | 255.255.255.224 | 209.165.202.128 |

---

### Solución 9: 192.168.28.45/28

**Paso 1: Prefijo /28 = 28 bits de red**

**Paso 2: Notación**
- 28 bits = 3 octetos completos (24 bits) + 4 bits del cuarto octeto
- Cuarto octeto: 4 bits de red + 4 bits de host = `nnnn` + `hhhh`
- Notación: `NNNnnnnhhhh`

**Paso 3: Máscara de subred**
- 28 bits en 1 = `11111111.11111111.11111111.11110000`
- Decimal: `255.255.255.240`

**Paso 4: Dirección de red**
- IP: `192.168.28.45`
- Cuarto octeto: `00101101`
- Con máscara (4 bits de red): `00100000` = 32
- Dirección de red: `192.168.28.32`

**Respuesta:**
| Notación | Máscara | Red |
|----------|---------|-----|
| NNNnnnnhhhh | 255.255.255.240 | 192.168.28.32 |

---

## 4. Tabla Completa Resuelta

| Dirección IP/Prefijo | Notación Red/Host | Máscara de Subred | Dirección de Red |
|---------------------|-------------------|-------------------|------------------|
| 192.168.10.10/24 | NNNH | 255.255.255.0 | 192.168.10.0 |
| 10.101.99.17/23 | NNnnnnnnn.HHHHHHHH | 255.255.254.0 | 10.101.98.0 |
| 209.165.200.227/27 | NNNnnnhhhhh | 255.255.255.224 | 209.165.200.224 |
| 172.31.45.252/24 | NNNH | 255.255.255.0 | 172.31.45.0 |
| 10.1.8.200/26 | NNNnnhhhhhh | 255.255.255.192 | 10.1.8.192 |
| 172.16.117.77/20 | NNnnnnHHHH.HHHH.HHHH | 255.255.240.0 | 172.16.112.0 |
| 10.1.1.101/25 | NNNnhhhhhhh | 255.255.255.128 | 10.1.1.0 |
| 209.165.202.140/27 | NNNnnnhhhhh | 255.255.255.224 | 209.165.202.128 |
| 192.168.28.45/28 | NNNnnnnhhhh | 255.255.255.240 | 192.168.28.32 |

---

## 5. Tips y Trucos

### 5.1 Cálculo Mental Rápido

**Para determinar la dirección de red:**

1. Identifica el cuarto octeto de la IP
2. Calcula el "tamaño de bloque" restando el prefijo de 32 y calculando 2^(32-prefijo)
3. Divide el valor del cuarto octeto por el tamaño de bloque
4. Multiplica el resultado por el tamaño de bloque

**Ejemplo /28:**
- Tamaño de bloque: 2^(32-28) = 2^4 = 16
- IP cuarto octeto: 45
- 45 ÷ 16 = 2 (ignorando decimales)
- 2 × 16 = 32
- Dirección de red: terminación en .32

### 5.2Errores Comunes

1. **Confundir la dirección de red con la de broadcast**: La dirección de red tiene todos los bits de host en 0. La dirección de broadcast tiene todos los bits de host en 1.

2. **Olvidar que el primer y último host no se usan**: En cada subred, la primera dirección es la de red y la última es broadcast. Los hosts usan las intermedias.

3. **No convertir correctamente a binario**: Siempre es útil convertir a binario para visualizar mejor la división.

---

## 6. Ejercicios Adicionales para Practicar

### Ejercicio 1
Identifica la parte de red y host de: `192.168.50.100/22`

### Ejercicio 2
Calcula la máscara de subred para: `/19`

### Ejercicio 3
Determina la dirección de red para: `10.200.150.75/21`

### Ejercicio 4
Given IP: `172.16.200.200/19`, ¿cuál es la dirección de broadcast?

---

## Conclusión

El análisis de direcciones IPv4 es una habilidad fundamental en redes. La clave está en entender cómo el prefijo CIDR determina la división entre red y host, y cómo la máscara de subred se aplica para obtener la dirección de red.

Practica con diferentes prefijos y direcciones para dominar este concepto.

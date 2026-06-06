# 22. Direcciones MAC y Switches

---

## Índice

- [Introducción a la Capa de Enlace de Datos](#introducción-a-la-capa-de-enlace-de-datos)
- [¿Qué es una Dirección MAC?](#qué-es-una-dirección-mac)
- [Estructura de la Dirección MAC](#estructura-de-la-dirección-mac)
- [Tipos de Direcciones MAC](#tipos-de-direcciones-mac)
- [La Trama Ethernet](#la-trama-ethernet)
- [La Tabla de Direcciones MAC (CAM)](#la-tabla-de-direcciones-mac-cam)
- [El Algoritmo del Switch: Aprendizaje y Reenvío](#el-algoritmo-del-switch-aprendizaje-y-reenvío)
- [Métodos de Reenvío del Switch](#métodos-de-reenvío-del-switch)
- [Caso Práctico Analizado Paso a Paso](#caso-práctico-analizado-paso-a-paso)
- [Dominios de Colisión y Broadcast](#dominios-de-colisión-y-broadcast)
- [VLANs: Segmentación Lógica](#vlans-segmentación-lógica)
- [Spanning Tree Protocol (STP)](#spanning-tree-protocol-stp)
- [Seguridad en la Capa 2](#seguridad-en-la-capa-2)
- [Comandos de Configuración y Verificación (Cisco IOS)](#comandos-de-configuración-y-verificación-cisco-ios)
- [Ejercicios Prácticos](#ejercicios-prácticos)
- [Resumen](#resumen)

---

## Introducción a la Capa de Enlace de Datos

La **capa de enlace de datos** (Capa 2 del modelo OSI) es responsable de la transferencia fiable de datos entre dos nodos adyacentes en una misma red. Su función principal es tomar los paquetes de la capa de red y encapsularlos en **tramas** (*frames*) para transmitirlos a través del medio físico.

### Dispositivos de Capa 2

| Dispositivo | Característica |
|-------------|----------------|
| **Switch** | Dispositivo inteligente que aprende direcciones MAC, segmenta la red y filtra tráfico. Crea dominios de colisión independientes por puerto. |
| **Bridge** | Versión primitiva del switch (2 puertos). Segmenta la red en dos dominios de colisión. |
| **Hub** | No es de Capa 2, es de Capa 1. Repite señales por todos los puertos sin inteligencia. |

> **Dato clave:** El switch es el núcleo de la capa de enlace en redes modernas. A diferencia de un hub, que replica las señales por todos sus puertos, el switch **segmenta la red**, creando dominios de colisión independientes para cada puerto y optimizando el uso del ancho de banda.

---

## ¿Qué es una Dirección MAC?

Una dirección **MAC** (*Media Access Control*) es un identificador único de 48 bits (6 bytes) asignado de fábrica a cada interfaz de red (NIC — *Network Interface Card*).

### Características Fundamentales

| Propiedad | Descripción |
|-----------|-------------|
| **Longitud** | 48 bits (6 bytes) |
| **Formato** | Hexadecimal con separadores (`:` , `-` o `.`) |
| **Asignación** | Grabada en la NIC por el fabricante (ROM) |
| **Alcance** | Local (solo relevante dentro del mismo segmento de red) |
| **Capa OSI** | Capa 2 — Enlace de Datos |
| **Modificación** | Puede sobrescribirse por software (spoofing), pero no se recomienda |

### Formas de Representación

```
Formato Cisco (AAA):  00:1A:2B:3C:4D:5E
Formato Windows (-):  00-1A-2B-3C-4D-5E
Formato Cisco IOS (.): 001A.2B3C.4D5E
```

> **Nota:** Los primeros 3 bytes (24 bits) identifican al fabricante (OUI). Los últimos 3 bytes son el identificador único del dispositivo asignado por el fabricante.

---

## Estructura de la Dirección MAC

```
    48 bits (6 bytes)
┌──────────────────────────────┬──────────────────────────────┐
│         OUI (24 bits)        │      NIC ID (24 bits)        │
│     Identificador Fabricante  │   Identificador Dispositivo  │
└──────────────────────────────┴──────────────────────────────┘
```

### OUI (Organizationally Unique Identifier)

El OUI es asignado por la **IEEE** a los fabricantes. Se puede consultar públicamente en el registro de la IEEE.

| OUI (hex) | Fabricante |
|-----------|------------|
| `00:1A:2B` | Cisco Systems |
| `00:50:56` | VMware |
| `08:00:27` | Oracle VirtualBox |
| `3C:52:82` | Intel |
| `BC:AE:C5` | Dell |
| `F8:32:E4` | Samsung |

### Bits Especiales del Primer Byte

El primer byte tiene dos bits con significado especial:

```
Bit 7 (LSB): I/G — Individual/Group
Bit 6:       U/L — Universal/Local

Byte 0: [U/L][I/G][...6 bits de OUI...]

Ejemplo: 00:1A:2B:3C:4D:5E
          ^^
          00 = 0000 0000
              ||--> I/G = 0 → Unicast
              |---> U/L = 0 → Universal
```

| Bit | Nombre | Significado |
|:---:|--------|-------------|
| **I/G** (bit 7) | Individual/Group | `0` = Unicast, `1` = Multicast/Broadcast |
| **U/L** (bit 6) | Universal/Local | `0` = Universal (asignada por IEEE), `1` = Administrada localmente |

---

## Tipos de Direcciones MAC

### Por Tipo de Comunicación

| Tipo | Bit I/G | Descripción | Ejemplo |
|------|:-------:|-------------|---------|
| **Unicast** | 0 | Identifica una única interfaz | `00:1A:2B:3C:4D:5E` |
| **Multicast** | 1 | Grupo de dispositivos | `01:00:5E:XX:XX:XX` (IPv4 multicast) |
| **Broadcast** | 1 (todos FF) | Todos los dispositivos | `FF:FF:FF:FF:FF:FF` |

### Por Asignación

| Tipo | Descripción |
|------|-------------|
| **Universal (UAA)** | Asignada por el fabricante, única globalmente |
| **Local (LAA)** | Asignada por software, solo válida en la red local |

### Por Registro en el Switch

| Tipo | Descripción | Persistencia |
|------|-------------|--------------|
| **Dinámica** | Aprendida automáticamente al recibir tramas | Se elimina tras el *aging time* |
| **Estática** | Configurada manualmente en la CAM | Permanente hasta reinicio |
| **Permanente** | Similar a estática, sobrevive a reinicios | Configurada en startup-config |

---

## La Trama Ethernet

Los datos en Capa 2 viajan dentro de **tramas Ethernet**. La trama es la unidad de datos (PDU) de la capa de enlace.

### Estructura de la Trama Ethernet IEEE 802.3

```
┌────────┬────────┬────────┬──────────┬──────────────┬────────┬──────────────┐
│ Preámb │  SFD   │ Destino│ Origen   │ EtherType /  │ Payload│      FCS     │
│   ulo   │        │   MAC  │   MAC    │    Length    │        │   (CRC-32)   │
│ 7 bytes│ 1 byte │ 6 bytes│ 6 bytes  │   2 bytes    │46-1500b│    4 bytes   │
└────────┴────────┴────────┴──────────┴──────────────┴────────┴──────────────┘
                               ← Trama mínima 64 bytes →
                                          ← Trama máxima 1518 bytes →
```

### Campos de la Trama

| Campo | Tamaño | Descripción |
|-------|:------:|-------------|
| **Preámbulo** | 7 B | Patrón de sincronización `10101010` repetido 7 veces |
| **SFD** | 1 B | *Start Frame Delimiter* — `10101011` marca el inicio de la trama |
| **MAC Destino** | 6 B | Dirección MAC del destinatario |
| **MAC Origen** | 6 B | Dirección MAC del emisor |
| **EtherType / Length** | 2 B | Tipo de protocolo superior (EtherType) o longitud (802.3) |
| **Payload** | 46-1500 B | Datos de capa superior (IP, ARP, etc.) |
| **FCS** | 4 B | *Frame Check Sequence* — CRC-32 para detección de errores |

> **Dato clave:** La trama mínima es de **64 bytes** (incluye todo excepto preámbulo y SFD). Si el payload es menor a 46 bytes, se añade *padding* para alcanzar el mínimo. Esto previene que una colisión pase desapercibida.

### EtherTypes Comunes

| EtherType | Protocolo |
|:---------:|-----------|
| `0x0800` | IPv4 |
| `0x0806` | ARP |
| `0x86DD` | IPv6 |
| `0x8100` | VLAN Tagged (802.1Q) |
| `0x88CC` | LLDP |

---

## La Tabla de Direcciones MAC (CAM)

Los switches utilizan la memoria **CAM** (*Content Addressable Memory*) para almacenar la Tabla de Direcciones MAC. La CAM es un tipo especial de memoria que permite búsquedas por contenido en lugar de por dirección, lo que la hace extremadamente rápida para consultas de reenvío.

### Estructura de la Tabla CAM

| Campo | Descripción |
|-------|-------------|
| **Dirección MAC** | MAC del dispositivo aprendida |
| **Puerto** | Puerto físico del switch por donde se aprendió |
| **VLAN** | VLAN a la que pertenece el puerto |
| **Tipo** | Dinámica, estática o permanente |
| **Edad** | Tiempo desde el último refresco (*aging time*) |

### Funcionamiento de la CAM

1. **Aprendizaje**: Cuando una trama entra, el switch registra la MAC de origen + puerto + VLAN.
2. **Búsqueda**: Para cada trama entrante, busca la MAC de destino en la CAM.
3. **Reenvío**: Si encuentra la MAC, envía solo por el puerto asociado. Si no, inunda.
4. **Envejecimiento**: Las entradas dinámicas tienen un *aging time* configurable (por defecto 300 segundos en Cisco).

### Aging Time

| Escenario | Comportamiento |
|-----------|----------------|
| Trama recibida con MAC existente | El temporizador se reinicia (refresh) |
| Sin tráfico de una MAC por > aging time | La entrada se elimina de la tabla |
| Aging time = 0 | Las entradas nunca envejecen (no recomendado) |

---

## El Algoritmo del Switch: Aprendizaje y Reenvío

Un switch basa sus decisiones en **dos direcciones** dentro de la trama Ethernet: la **MAC de Origen** y la **MAC de Destino**.

```
                   [ TRAMA ETHERNET ]
┌─────────────────────┬──────────────────┬──────────────────┐
│   MAC de Destino    │   MAC de Origen  │  Datos / Payload │
│     6 bytes         │     6 bytes      │  46-1500 bytes   │
└─────────────────────┴──────────────────┴──────────────────┘
         │                      │
         │                      └──→ ¡Para APRENDER! (Llenar la tabla CAM)
         │
         └──────────────────────────→ ¡Para REENVIAR! (Tomar decisiones de forwarding)
```

### A. Aprendizaje (Learning)

1. El switch examina la **MAC de origen** de cada trama entrante.
2. Si la MAC **no está** en la tabla CAM, la registra junto al puerto de entrada y la VLAN.
3. Si la MAC **ya existe**, actualiza el temporizador de envejecimiento (refresca la entrada).
4. Si la MAC existe **pero en otro puerto**, el switch actualiza la entrada (la MAC se movió físicamente).

### B. Reenvío y Filtrado (Forwarding / Filtering)

El switch examina la **MAC de destino** y decide qué hacer:

| Caso | Situación | Acción |
|:----:|-----------|--------|
| **1** | MAC de destino conocida (en tabla) | **Forwarding**: reenvía únicamente por el puerto asociado. Esto es filtrar — el resto de puertos no reciben la trama. |
| **2** | MAC de destino desconocida (no está en tabla) | **Flooding**: inunda la trama por todos los puertos **excepto** el de origen. |
| **3** | MAC de destino = Broadcast (`FF:FF:FF:FF:FF:FF`) | **Broadcast**: reenvía por todos los puertos excepto el de origen. |
| **4** | MAC de destino = Multicast | Depende de si hay suscriptores registrados. Sin IGMP snooping, se inunda. |

### C. Flooding por Broadcast / Multicast

- **Broadcast**: El switch SIEMPRE reenvía las tramas con destino `FF:FF:FF:FF:FF:FF` por todos los puertos (excepto el de origen). Es obligatorio por el estándar.
- **Multicast**: Sin configuraciones especiales (IGMP snooping), el switch trata el multicast como broadcast, inundando por todos los puertos.

### Pseudocódigo del Algoritmo

```
PARA CADA trama recibida en puerto P y VLAN V:

  // FASE 1: APRENDIZAJE
  MAC_origen = extraer_MAC_origen(trama)
  actualizar_CAM(MAC_origen, P, V)

  // FASE 2: REENVÍO
  MAC_destino = extraer_MAC_destino(trama)

  SI MAC_destino ES broadcast:
    reenviar_por_todos_excepto(P)

  SINO SI MAC_destino ES multicast Y sin IGMP snooping:
    reenviar_por_todos_excepto(P)

  SINO:
    puerto_salida = buscar_en_CAM(MAC_destino)
    SI puerto_salida ENCONTRADO Y puerto_salida != P:
      reenviar_por_puerto(puerto_salida)     // Forwarding
    SINO:
      reenviar_por_todos_excepto(P)           // Unicast Flooding
```

> **Nota importante:** Si el puerto de salida es el mismo que el de entrada, el switch **descarta** la trama. Esto sucede cuando ambos dispositivos están en el mismo puerto (con un hub intermedio, por ejemplo).

---

## Métodos de Reenvío del Switch

Los switches pueden reenviar tramas usando diferentes métodos que afectan la latencia y el filtrado de errores:

| Método | Descripción | Latencia | Filtrado de errores |
|--------|-------------|:--------:|:-------------------:|
| **Store-and-Forward** | Recibe toda la trama, verifica FCS, luego reenvía | Alta | Sí |
| **Cut-Through** | Lee solo MAC destino (6 bytes después del SFD) y empieza a reenviar | Baja | No |
| **Fragment-Free** | Lee los primeros 64 bytes (tamaño mínimo) y luego reenvía | Media | Parcial (evita fragmentos de colisión) |

### Store-and-Forward (el más usado)

```
Llega trama → [Recibir completa] → [Verificar FCS] → [Si OK → Reenviar]
                                                      [Si error → Descartar]
```

- **Ventaja**: Garantiza que solo tramas sin errores circulan por la red.
- **Desventaja**: Mayor latencia (especialmente con tramas grandes).
- **Uso**: Switches empresariales Cisco, capa de distribución/core.

### Cut-Through

```
Llega trama → [Leer MAC destino] → [Reenviar inmediatamente]
```

- **Ventaja**: Mínima latencia (ideal para entornos de alta performance).
- **Desventaja**: Puede propagar tramas corruptas por la red.
- **Variantes**:
  - *Fast Forward*: Reenvía inmediatamente tras leer la MAC destino.
  - *Fragment Free*: Espera a recibir 64 bytes (evita *runts*).

---

## Caso Práctico Analizado Paso a Paso

### Escenario de Red

Imagina un switch de 4 puertos con la tabla MAC inicialmente vacía. Se conectan cuatro computadoras:

| Dispositivo | Puerto | Dirección MAC |
|:-----------:|:------:|:-------------:|
| **PC-A** | Fa0/1 | `AAAA.AAAA.AAAA` |
| **PC-B** | Fa0/2 | `BBBB.BBBB.BBBB` |
| **PC-C** | Fa0/3 | `CCCC.CCCC.CCCC` |
| **PC-D** | Fa0/4 | `DDDD.DDDD.DDDD` |

```
  [PC-A] (AAAA)         [PC-B] (BBBB)
      |                     |
   +--v---------------------v--+
   |                            |
   |  Fa0/1              Fa0/2  |
   |         SWITCH             |
   |  Fa0/3              Fa0/4  |
   |                            |
   +--^---------------------^--+
      |                     |
  [PC-C] (CCCC)         [PC-D] (DDDD)
```

### Estado Inicial

```
Tabla CAM: Vacía
```

### Evento 1: PC-A envía un ping a PC-C

**Trama**: Origen = `AAAA.AAAA.AAAA`, Destino = `CCCC.CCCC.CCCC`

1. **Aprendizaje (Origen)**: El switch examina la MAC de origen `AAAA`. No está en la tabla → la registra en el puerto Fa0/1.
2. **Reenvío (Destino)**: El switch examina la MAC de destino `CCCC`. No está en la tabla.
3. **Resultado**: El switch **inunda** (flooding) la trama por Fa0/2, Fa0/3 y Fa0/4.
4. PC-B recibe la trama, ve que el destino no es su MAC → la **descarta**.
5. PC-D recibe la trama, ve que el destino no es su MAC → la **descarta**.
6. PC-C recibe la trama, ve que el destino ES su MAC → la **procesa** y genera una respuesta.

**Tabla MAC resultante**:

| Puerto | Dirección MAC | Tipo |
|:------:|:-------------:|:----:|
| Fa0/1 | `AAAA.AAAA.AAAA` | Dinámico |

### Evento 2: PC-C responde a PC-A

**Trama**: Origen = `CCCC.CCCC.CCCC`, Destino = `AAAA.AAAA.AAAA`

1. **Aprendizaje (Origen)**: El switch registra la MAC `CCCC` en el puerto Fa0/3.
2. **Reenvío (Destino)**: Busca la MAC `AAAA`. ¡Ya existe en la tabla asociada al puerto Fa0/1!
3. **Resultado**: Envío **Unicast Directo**. La trama va únicamente al puerto Fa0/1. Nadie más la recibe. Esto es el **Filtrado**.

**Tabla MAC resultante**:

| Puerto | Dirección MAC | Tipo |
|:------:|:-------------:|:----:|
| Fa0/1 | `AAAA.AAAA.AAAA` | Dinámico |
| Fa0/3 | `CCCC.CCCC.CCCC` | Dinámico |

### Evento 3: PC-B envía datos a PC-A

**Trama**: Origen = `BBBB.BBBB.BBBB`, Destino = `AAAA.AAAA.AAAA`

1. **Aprendizaje (Origen)**: El switch registra la MAC `BBBB` en Fa0/2.
2. **Reenvío (Destino)**: `AAAA` ya está en la tabla → reenvía solo por Fa0/1.
3. **Resultado**: Unicast directo. Sin flooding.

**Tabla MAC resultante**:

| Puerto | Dirección MAC | Tipo |
|:------:|:-------------:|:----:|
| Fa0/1 | `AAAA.AAAA.AAAA` | Dinámico |
| Fa0/2 | `BBBB.BBBB.BBBB` | Dinámico |
| Fa0/3 | `CCCC.CCCC.CCCC` | Dinámico |

### Evento 4: PC-D envía datos a PC-C

**Trama**: Origen = `DDDD.DDDD.DDDD`, Destino = `CCCC.CCCC.CCCC`

1. **Aprendizaje (Origen)**: El switch registra la MAC `DDDD` en Fa0/4.
2. **Reenvío (Destino)**: `CCCC` ya está en la tabla → reenvía solo por Fa0/3.
3. **Resultado**: Unicast directo.

**Tabla MAC final**:

| Puerto | Dirección MAC | Tipo |
|:------:|:-------------:|:----:|
| Fa0/1 | `AAAA.AAAA.AAAA` | Dinámico |
| Fa0/2 | `BBBB.BBBB.BBBB` | Dinámico |
| Fa0/3 | `CCCC.CCCC.CCCC` | Dinámico |
| Fa0/4 | `DDDD.DDDD.DDDD` | Dinámico |

> **Conclusión del caso:** Después de que cada dispositivo envía al menos una trama, el switch conoce todas las MAC y puede reenviar tráfico de forma óptima sin inundación innecesaria.

---

## Dominios de Colisión y Broadcast

### Dominio de Colisión

Conjunto de dispositivos donde, si dos transmiten al mismo tiempo, sus señales colisionan.

| Dispositivo | Dominios de Colisión |
|-------------|:--------------------:|
| **Hub** | 1 dominio (todos los puertos) |
| **Switch** | 1 dominio **por puerto** |
| **Router** | Separa dominios de colisión (cada interfaz es un dominio distinto) |

### Dominio de Broadcast

Conjunto de dispositivos que reciben una trama broadcast (`FF:FF:FF:FF:FF:FF`).

| Dispositivo | Separación de Broadcast |
|-------------|:----------------------:|
| **Hub** | No separa broadcast |
| **Switch** | **No** separa broadcast (todos los puertos en la misma VLAN) |
| **Router** | Separa dominios de broadcast (cada interfaz) |
| **VLAN** | Separa dominios de broadcast dentro del mismo switch |

```
Hub:      [Broadcast] → Todos los puertos (1 dominio de colisión)
Switch:   [Broadcast] → Todos los puertos (pero 1 dominio de colisión por puerto)
VLAN:     [Broadcast] → Solo puertos en la misma VLAN
Router:   [Broadcast] → Solo la interfaz donde se originó
```

---

## VLANs: Segmentación Lógica

Las **VLAN** (*Virtual LANs*) permiten dividir un switch físico en múltiples redes lógicas aisladas a nivel de Capa 2.

### Problema sin VLANs

```
Switch sin VLAN:
┌──────────────────────────────────────┐
│   Depto Ventas  │  Depto Ingeniería  │
│    PC-A Fa0/1   │    PC-C Fa0/3      │
│    PC-B Fa0/2   │    PC-D Fa0/4      │
├──────────────────────────────────────┤
│  Broadcast de Ventas → ¡Llega a todos! │
└──────────────────────────────────────┘
```

### Solución con VLANs

```
Switch con VLANs:
┌──────────────────────────────────────┐
│   VLAN 10: Ventas   VLAN 20: Infra   │
│    PC-A Fa0/1       PC-C Fa0/3       │
│    PC-B Fa0/2       PC-D Fa0/4       │
├──────────────────────────────────────┤
│  Broadcast de VLAN 10 → Solo Fa0/1-2 │
│  Broadcast de VLAN 20 → Solo Fa0/3-4 │
└──────────────────────────────────────┘
```

### Ventajas de las VLANs

| Ventaja | Descripción |
|---------|-------------|
| **Seguridad** | Aísla tráfico entre departamentos o grupos |
| **Reducción de broadcast** | Los broadcasts no cruzan los límites de VLAN |
| **Flexibilidad** | Dispositivos pueden estar en la misma VLAN sin importar su ubicación física |
| **Facilidad de gestión** | Cambios lógicos sin necesidad de recablear |

### Trunking (802.1Q)

Para que tramas de múltiples VLANs viajen entre switches, se usa un **trunk** (enlace troncal) que agrega una etiqueta VLAN a cada trama:

```
Trama Ethernet sin VLAN:
┌──────┬──────┬──────────┬──────┐
│ MAC  │ MAC  │ EtherType│ Data │
│ Dest │ Orig │  0x0800  │      │
└──────┴──────┴──────────┴──────┘

Trama Ethernet con VLAN 802.1Q:
┌──────┬──────┬──────────┬──────────────┬──────┐
│ MAC  │ MAC  │ 0x8100  │ VLAN ID (12b)│ Data │
│ Dest │ Orig │ (Tagged)│  Prioridad(3b)│      │
└──────┴──────┴──────────┴──────────────┴──────┘
                  ←── 4 bytes extra ──→
```

---

## Spanning Tree Protocol (STP)

Cuando hay **enlaces redundantes** entre switches, se forman bucles de Capa 2 que pueden causar tormentas de broadcast. **STP** (IEEE 802.1D) previene esto desactivando lógicamente puertos redundantes.

### El Problema: Bucles de Capa 2

```
       ┌──────────┐
       │ Switch A │
       └──┬────┬──┘
          │    │
    ┌─────┘    └─────┐
    │                │
  ┌─┴──┐          ┌──┴─┐
  │ Sw │          │ Sw │
  │  B │──────────│  C │
  └────┘          └────┘
```

Sin STP, un broadcast de Switch A sería reenviado por B a C, que lo reenvía de vuelta a A, y así infinitamente → **tormenta de broadcast**.

### La Solución: STP

STP elige un **puerto raíz** y bloquea los puertos redundantes para crear un árbol libre de bucles:

```
       ┌──────────┐
       │ Sw A (RB) │ ← Root Bridge
       └──┬────┬──┘
          │ RP │ RP        RP = Root Port
          │    │           DP = Designated Port
    ┌─────┘    └─────┐
    │ DP              │ DP
  ┌─┴──┐          ┌──┴─┐
  │ Sw │          │ Sw │
  │  B │──────────│  C │
  └────┘          └────┘
   RP   BLK      BLK   RP  BLK = Blocked
```

Estados de un puerto en STP:

| Estado | Ciclo | Comportamiento |
|--------|:-----:|----------------|
| **Blocking** | 20s | No reenvía tramas, solo escucha BPDUs |
| **Listening** | 15s | No reenvía, comienza a participar en elección |
| **Learning** | 15s | No reenvía, pero aprende direcciones MAC |
| **Forwarding** | - | Reenvía tramas normalmente |
| **Disabled** | - | Puerto apagado administrativamente |

> **Dato clave:** STP tarda ~30-50 segundos en converger (Blocking → Forwarding). Para redes modernas, se usa **RSTP** (Rapid STP, 802.1w) que converge en ~3-6 segundos.

---

## Seguridad en la Capa 2

### Ataques Comunes y Mitigaciones

| Ataque | Descripción | Mitigación |
|--------|-------------|------------|
| **MAC Flooding** | Inundar el switch con MACs falsas para llenar la CAM y forzar flooding (el switch se comporta como hub) | Port Security, límite de MACs dinámicas |
| **MAC Spoofing** | Suplantar la MAC de otro dispositivo | Port Security con MAC estables, 802.1X |
| **ARP Spoofing** | Enviar ARP falsos para interceptar tráfico | DAI (Dynamic ARP Inspection), DHCP Snooping |
| **VLAN Hopping** | Saltar de una VLAN a otra | Deshabilitar trunking en puertos de acceso, usar VLAN nativa diferente |
| **STP Attacks** | Enviar BPDUs falsos para alterar la topología STP | BPDU Guard, Root Guard, PortFast |

### Port Security

Port Security limita la cantidad de direcciones MAC que pueden aprenderse en un puerto.

```
Switch(config)# interface fa0/1
Switch(config-if)# switchport mode access
Switch(config-if)# switchport port-security
Switch(config-if)# switchport port-security maximum 2
Switch(config-if)# switchport port-security mac-address sticky
Switch(config-if)# switchport port-security violation shutdown
```

| Parámetro | Descripción |
|-----------|-------------|
| `maximum` | Número máximo de MACs permitidas en el puerto (default: 1) |
| `mac-address` | MAC específica permitida (`sticky` = aprende automáticamente la primera) |
| `violation` | Acción ante violación: `protect`, `restrict`, `shutdown` |

### BPDU Guard

Protege puertos de acceso contra la recepción de BPDUs (evita STP attacks):

```
Switch(config-if)# spanning-tree bpduguard enable
```

Si se recibe un BPDU en un puerto con BPDU Guard, el puerto pasa a estado errdisable.

---

## Comandos de Configuración y Verificación (Cisco IOS)

### Comandos de Visualización

| Comando | Descripción |
|---------|-------------|
| `show mac address-table` | Muestra la tabla CAM completa |
| `show mac address-table dynamic` | Solo entradas dinámicas |
| `show mac address-table static` | Solo entradas estáticas |
| `show mac address-table vlan {id}` | Tabla CAM para una VLAN específica |
| `show mac address-table address {mac}` | Buscar una MAC específica |
| `show mac address-table count` | Cantidad de entradas por VLAN |
| `show interfaces {int} | include address` | MAC de una interfaz |
| `show interfaces status` | Estado de todas las interfaces |
| `show port-security` | Configuración de port security |
| `show port-security address` | MACs seguras configuradas |
| `show spanning-tree` | Estado de STP |

### Comandos de Administración

| Comando | Descripción |
|---------|-------------|
| `clear mac address-table dynamic` | Limpia todas las entradas dinámicas |
| `clear mac address-table dynamic interface {int}` | Limpia MACs de una interfaz |
| `clear mac address-table dynamic address {mac}` | Limpia una MAC específica |
| `clear port-security sticky` | Limpia MACs sticky |
| `clear port-security sticky interface {int}` | Limpia MACs sticky de una interfaz |

### Ejemplo Práctico de CLI

```
Switch> enable
Switch# show mac address-table
          Mac Address Table
---------------------------------------------
Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
   1    001a.2b3c.4d5e    DYNAMIC     Fa0/1
   1    0050.56c0.0001    DYNAMIC     Fa0/2
   1    aaaa.bbbb.cccc    DYNAMIC     Fa0/3
Switch#
```

---

## Ejercicios Prácticos

### Ejercicio 1: Llenado de Tabla MAC e Inundación

Basándote en el escenario del caso práctico (PCs A, B, C, D con MACs AAAA, BBBB, CCCC, DDDD), y continuando desde la tabla del Evento 2 (que contiene AAAA en Fa0/1 y CCCC en Fa0/3), analiza la siguiente secuencia:

| Transmisión | Origen | Destino |
|:-----------:|:------:|:-------:|
| **X** | PC-B (`BBBB`) | PC-A (`AAAA`) |
| **Y** | PC-D (`DDDD`) | PC-C (`CCCC`) |
| **Z** | PC-A (`AAAA`) | PC-B (`BBBB`) |

**Tareas del estudiante:**

1. Dibuje la tabla MAC final después de la Transmisión Z.
2. Identifique qué puertos recibieron la trama de forma innecesaria (Unicast Flooding) durante la Transmisión X.
3. Explique por qué la Transmisión Y no genera flooding.

<details>
<summary>Ver respuesta</summary>

**Respuesta 1 — Tabla MAC final:**

| Puerto | Dirección MAC | Tipo |
|:------:|:-------------:|:----:|
| Fa0/1 | `AAAA.AAAA.AAAA` | Dinámico |
| Fa0/2 | `BBBB.BBBB.BBBB` | Dinámico |
| Fa0/3 | `CCCC.CCCC.CCCC` | Dinámico |
| Fa0/4 | `DDDD.DDDD.DDDD` | Dinámico |

**Respuesta 2:** Durante la Transmisión X, el único puerto que recibe la trama es Fa0/1 (destino `AAAA` ya estaba en la tabla). **No hay flooding** porque el switch ya aprendió la MAC `AAAA` en el Evento 1.

**Respuesta 3:** En la Transmisión Y, `CCCC` ya está en la tabla (Evento 2), por lo que el switch reenvía directamente por Fa0/3. Además, el switch aprende `DDDD` en Fa0/4. No hay flooding.
</details>

---

### Ejercicio 2: Análisis de Comportamiento con Tabla Vacía

Un switch tiene la tabla CAM completamente vacía. Ocurren las siguientes transmisiones en orden:

1. PC-1 envía una trama a PC-2 (ninguna MAC en la tabla).
2. PC-3 envía una trama a PC-1.
3. PC-2 envía una trama a PC-3.

**Preguntas:**
1. ¿Cuántas tramas genera la transmisión 1 (incluyendo réplicas del switch)?
2. ¿En qué transmisión el switch comienza a filtrar tráfico?
3. ¿Cuántas entradas hay en la tabla CAM después de la transmisión 3?

<details>
<summary>Ver respuesta</summary>

1. **Transmisión 1:** Como la tabla está vacía, el switch inunda por **todos los puertos excepto el de origen**. Si hay N puertos activos, se generan N-1 copias. Con 4 puertos: 3 copias.
2. El switch comienza a filtrar en la **transmisión 2** porque PC-1 ya está en la tabla (aprendida en la transmisión 1).
3. Después de la transmisión 3, hay **3 entradas** en la tabla (PC-1, PC-2, PC-3).
</details>

---

### Ejercicio 3: Laboratorio con Packet Tracer / Cisco

**Objetivo:** Observar el aprendizaje de MAC en un switch real o simulado.

**Instrucciones:**

1. Arma la siguiente topología en Packet Tracer:
   - 1 switch 2960
   - 3 PCs conectados a Fa0/1, Fa0/2 y Fa0/3

2. Accede a la CLI del switch y limpia la tabla:

```
Switch> enable
Switch# clear mac address-table dynamic
Switch# show mac address-table
```

3. Desde PC1, haz ping a PC2:
   ```
   PC> ping 192.168.1.2
   ```

4. Verifica la tabla MAC:
   ```
   Switch# show mac address-table
   ```

5. **Pregunta de ingeniería:** ¿Por qué aparecen **dos** direcciones MAC en la tabla si solo ejecutó un comando `ping`?

<details>
<summary>Ver respuesta</summary>

El comando `ping` genera tráfico en **dos direcciones**:

1. PC-1 envía un **Echo Request** (ICMP) a PC-2. El switch aprende la MAC de PC-1.
2. PC-2 recibe el Echo Request y envía un **Echo Reply** a PC-1. El switch aprende la MAC de PC-2.

Aunque el usuario ejecutó un solo comando, el protocolo ICMP Echo implica una **solicitud y una respuesta**, cada una generando una trama separada. El switch aprende ambas direcciones porque ambas tramas cruzan el switch en direcciones opuestas.
</details>

---

### Ejercicio 4: Diseño de Red con VLANs

Diseña un switch para una empresa con dos departamentos que deben estar aislados a nivel de Capa 2:

| Departamento | Dispositivos | Requisitos |
|:------------:|:------------:|------------|
| **RRHH** | 2 PCs, 1 impresora | Aislados de otras áreas |
| **IT** | 3 PCs, 1 servidor | Aislados de otras áreas |

**Tareas:**
1. Asigna VLANs para cada departamento.
2. Asigna puertos del switch a cada VLAN.
3. ¿Qué se necesita para que los departamentos se comuniquen entre sí?

<details>
<summary>Ver respuesta</summary>

1. **Asignación de VLANs:**
   - VLAN 10 — RRHH
   - VLAN 20 — IT

2. **Asignación de puertos:**
   ```
   VLAN 10: Fa0/1, Fa0/2, Fa0/3 (PC RRHH 1, PC RRHH 2, Impresora)
   VLAN 20: Fa0/4, Fa0/5, Fa0/6, Fa0/7 (PC IT 1-3, Servidor)
   ```

3. **Comunicación entre VLANs:** Las VLANs operan en Capa 2 y están aisladas entre sí. Para que RRHH e IT se comuniquen, se necesita un **dispositivo de Capa 3** (router o switch multicapa) que realice el enrutamiento inter-VLAN (*router-on-a-stick* o SVI).
</details>

---

### Ejercicio 5: Identificación de MAC y OUI

Dada la siguiente dirección MAC: `F8:32:E4:12:AB:CD`

1. ¿Cuál es el OUI?
2. ¿Es una dirección unicast o multicast? ¿Cómo lo sabes?
3. ¿Es universal o localmente administrada?

<details>
<summary>Ver respuesta</summary>

1. **OUI:** `F8:32:E4` (Intel Corporation).
2. **Unicast.** El primer byte (`F8`) en binario es `1111 1000`. El bit I/G (LSB) es `0` → Unicast.
3. **Universal.** El bit U/L (bit 6 del primer byte) es `1`. En `F8 = 1111 1000`, el bit 6 es `1`... Revisemos: `F8` = `1111 1000`. Bit 7 = 0 (I/G), Bit 6 = 1 (U/L). U/L = 1 indica **administrada localmente**.

Corrección: `F8` = `1111 1000`. Bit positions (0-indexed LSB): bit 0 = 0, bit 1 = 0, bit 2 = 0, bit 3 = 1, bit 4 = 1, bit 5 = 1, bit 6 = 1, bit 7 = 1.
- I/G = bit 0 = 0 → Unicast ✓
- U/L = bit 1 = 0 → Universal ✓

La MAC es **Unicast Universal** asignada por Intel.
</details>

---

## Resumen

| Concepto | Descripción |
|----------|-------------|
| **Dirección MAC** | Identificador único de 48 bits (6 bytes) para cada NIC |
| **Formato** | Hexadecimal: `XX:XX:XX:XX:XX:XX`. OUI (3B) + NIC ID (3B) |
| **Tipos** | Unicast, Multicast, Broadcast (según bit I/G) |
| **Tabla CAM** | Memoria del switch que asocia MAC → Puerto → VLAN |
| **Aprendizaje** | El switch registra la MAC de origen de cada trama |
| **Reenvío** | Si la MAC destino está en CAM → unicast directo. Si no → flooding |
| **Flooding** | Enviar por todos los puertos excepto el de origen |
| **Filtrado** | Enviar solo por el puerto específico de la MAC destino |
| **Broadcast** | MAC `FF:FF:FF:FF:FF:FF` → siempre se inunda |
| **VLAN** | Segmentación lógica de Capa 2 para aislar tráfico |
| **STP** | Protocolo que previene bucles en redes con redundancia |
| **Métodos de reenvío** | Store-and-Forward (verifica errores), Cut-Through (baja latencia) |

### Correspondencia con el Modelo OSI

```
Capa 3 (Red)       ← Paquetes IP
     │
     ▼
Capa 2 (Enlace)    ← Tramas Ethernet, Direcciones MAC, Switches
     │
     ▼
Capa 1 (Física)    ← Bits, señales eléctricas, cables
```

> **Fuente:** Documentación propia basada en estándares IEEE 802.3, documentación Cisco CCNA y material educativo de redes.

---

## Comandos Rápidos de Referencia

```bash
# Ver tabla de direcciones MAC (Cisco IOS)
show mac address-table

# Limpiar entradas dinámicas
clear mac address-table dynamic

# Ver direcciones MAC de interfaces
show interfaces | include "Hardware is"

# Ver tabla ARP (relación IP ↔ MAC)
show ip arp
```

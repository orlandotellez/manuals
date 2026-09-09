# 22. Direcciones MAC y Switches

---

## Índice

- [El punto de partida: el chasis y la patente](#1-el-punto-de-partida-el-chasis-y-la-patente)
- [¿Qué es una dirección MAC?](#2-qué-es-una-dirección-mac)
- [La anatomía de una MAC: OUI y número de serie](#3-la-anatomía-de-una-mac-oui-y-número-de-serie)
- [Tipos de direcciones MAC](#4-tipos-de-direcciones-mac)
- [La trama Ethernet: el sobre de la capa 2](#5-la-trama-ethernet-el-sobre-de-la-capa-2)
- [El switch: el cerebro de la capa 2](#6-el-switch-el-cerebro-de-la-capa-2)
- [El algoritmo del switch: aprender, reenviar, envejecer](#7-el-algoritmo-del-switch-aprender-reenviar-envejecer)
- [Métodos de reenvío: latencia contra pureza](#8-métodos-de-reenvío-latencia-contra-pureza)
- [Caso práctico paso a paso: un ping que llena la tabla](#9-caso-práctico-paso-a-paso-un-ping-que-llena-la-tabla)
- [Dominios de colisión y broadcast](#10-dominios-de-colisión-y-broadcast)
- [VLANs: cortar un switch en pedazos lógicos](#11-vlans-cortar-un-switch-en-pedazos-lógicos)
- [STP: cuando la redundancia arma bucles](#12-stp-cuando-la-redundancia-arma-bucles)
- [Seguridad en la capa 2](#13-seguridad-en-la-capa-2)
- [Comandos de referencia (Cisco IOS)](#14-comandos-de-referencia-cisco-ios)
- [Ejercicios prácticos](#15-ejercicios-prácticos)
- [Comprobá lo que aprendiste](#16-comprobá-lo-que-aprendiste)
- [Glosario](#17-glosario)
- [Resumen en 10 puntos](#18-resumen-en-10-puntos)

---

## 1. El punto de partida: el chasis y la patente

Antes de hablar de direcciones MAC, pensá en un auto. Un auto tiene DOS identificadores que casi nunca coinciden:

- **El número de chasis (VIN):** lo asigna el fabricante en la fábrica. Es único en el mundo, no se puede cambiar, y está grabado en el metal. Describe *qué es* ese auto.
- **La patente:** se la asigna el Estado, y puede cambiar. Si vendés el auto o te mudás de provincia, la patente cambia. Describe *dónde/dentro de qué jurisdicción* se identifica el auto en ese momento.

En una red pasa exactamente igual, con dos "números":

- **La dirección IP** identifica al dispositivo dentro de la red. Es lógica: la asigna un administrador (o un servidor DHCP), y **puede cambiar**. Es la "patente".
- **La dirección MAC** identifica la placa de red física. Viene grabada de fábrica, es única en el mundo y **no cambia**. Es el "número de chasis".

> **La idea madre de este manual:** el tráfico dentro de una red se entrega usando MAC (capítulo 2 del modelo OSI, la capa de enlace), mientras que el tráfico entre redes se enruta usando IP (la capa de red). Para entender los switches hay que domar los dos: entender **qué hace cada uno**, **cuándo se usa cada uno** y **cómo conviven** en la misma trama.

Hay un detalle que separa al que memoriza del que entiende: la MAC **no viaja de punta a punta** como la IP. Cada vez que una trama cruza un router, la dirección MAC destino se reescribe con la del *próximo* salto. En un viaje con varias escalas, el pasajero (la IP) siempre es el mismo; el número de asiento y el embarque (la MAC) cambian en cada tramo.

Este manual te lleva de cero al detalle fino: qué es una MAC, cómo se construye, cómo viaja dentro de una trama Ethernet, y cómo el **switch** — el dispositivo más común del mundo — usa esas MAC para aprender y decidir por dónde mandar cada cosa.

---

## 2. ¿Qué es una dirección MAC?

**MAC** significa *Media Access Control* (Control de Acceso al Medio). Es un identificador de **48 bits (6 bytes)** asignado de fábrica a cada interfaz de red — a cada placa de red, a cada puerto Ethernet, a cada chip Wi-Fi.

### 2.1. Características fundamentales

| Propiedad | Descripción |
|-----------|-------------|
| **Longitud** | 48 bits (6 bytes) |
| **Formato** | Hexadecimal, con separadores (`:`, `-` o `.`) |
| **Asignación** | Grabada en la placa por el fabricante (se guarda en ROM) |
| **Alcance** | Local: solo importa dentro del mismo segmento de red |
| **Capa OSI** | Capa 2 — Enlace de Datos |
| **Modificación** | Se puede sobrescribir por software (spoofing), pero en general no conviene |

> **Ojo con el "única en el mundo".** Es único para *identificar* un dispositivo, pero la MAC no es una garantía de seguridad: cualquiera con una computadora puede leer la MAC de su placa y **fingir** que tiene otra (spoofing). La unicidad es una convención de fábrica, no un mecanismo de autenticación. Lo vas a ver en la sección de seguridad.

### 2.2. Formas de representación

La MAC se escribe en hexadecimal porque 48 bits en decimal serían ilegibles. Las tres notaciones más comunes:

```
Formato estándar:        00:1A:2B:3C:4D:5E
Formato Windows:         00-1A-2B-3C-4D-5E
Formato Cisco (IOS):     001A.2B3C.4D5E
```

Son la MISMA dirección, escrita distinto. Si ves `001a.2b3c.4d5e` en un switch Cisco y `00-1A-2B-3C-4D-5E` en Windows, son idénticas (las minúsculas y mayúsculas no cambian nada en hexadecimal).

---

## 3. La anatomía de una MAC: OUI y número de serie

Los 48 bits se reparten en dos mitades de 24 bits (3 bytes) cada una:

```
     48 bits (6 bytes)
┌──────────────────────────────┬──────────────────────────────┐
│        OUI (24 bits)         │     Identificador (24 bits)   │
│   Identifica al FABRICANTE   │   Identifica al DISPOSITIVO   │
└──────────────────────────────┴──────────────────────────────┘
        00:1A:2B                    3C:4D:5E
```

### 3.1. El OUI: el "código de fábrica"

El **OUI** (*Organizationally Unique Identifier*) identifica al fabricante de la placa. Lo asigna la **IEEE** (el organismo que también define los estándares Ethernet) y se puede consultar públicamente en su registro. Por eso, con solo mirar los primeros 3 bytes, sabés quién fabricó el dispositivo:

| OUI (hex) | Fabricante |
|-----------|------------|
| `00:1A:2B` | Cisco Systems |
| `00:50:56` | VMware (máquinas virtuales) |
| `08:00:27` | Oracle VirtualBox |
| `3C:52:82` | Intel |
| `BC:AE:C5` | Dell |
| `F8:32:E4` | Samsung |

**Dato útil en la práctica:** si en tu red aparece una MAC que empieza con `00:50:56` o `08:00:27`, es una máquina virtual, no un equipo físico. Esto sirve muchísimo para detectar dispositivos raros.

### 3.2. Los dos bits especiales del primer byte

Acá está el detalle que casi nadie explica bien, y que separa a los que entienden de los que repiten. El **primer byte** de la MAC tiene DOS bits con significado especial, y están **al final del byte** (los bits de menor peso), no al principio:

```
Primer byte de la MAC (por ejemplo 00:1A:2B:3C:4D:5E → el "00")
Posición de bits:   [7] [6] [5] [4] [3] [2] [1] [0]
                                          ^   ^
                                          |   +--- Bit 0 = I/G
                                          +------- Bit 1 = U/L
```

| Bit | Nombre | Qué indica | Valor |
|:---:|--------|------------|:-----:|
| **0** (el último) | **I/G** — Individual/Group | ¿La MAC habla de UNA placa o de UN GRUPO? | `0` = unicast, `1` = multicast/broadcast |
| **1** (el anteúltimo) | **U/L** — Universal/Local | ¿Quién asignó la MAC? | `0` = universal (la IEEE/fábrica), `1` = administrada localmente |

Fijate que para leerlos con notación hexadecimal conviene pasar el primer byte a binario y mirar los últimos dos dígitos binarios:

```
00  →  0000 0000  →  I/G = 0 (unicast),  U/L = 0 (universal)   ← la inmensa mayoría
01  →  0000 0001  →  I/G = 1 (multicast), U/L = 0 (universal)  ← multicast IPv4
02  →  0000 0010  →  I/G = 0 (unicast),  U/L = 1 (local)       ← MAC local hecha a mano
```

> **Regla mnemotécnica:** si el primer byte es `00`, es una MAC "normal" de fábrica, individual y universal. Si viste `01:00:5E:...` es multicast. Si viste `FF:FF:FF:FF:FF:FF` es el broadcast. Una MAC local administrada suele arrancar en `02`, `06`, `0A`, `0E` (bits U/L en 1).

---

## 4. Tipos de direcciones MAC

### 4.1. Según el destino (bit I/G)

| Tipo | Bit I/G | Descripción | Ejemplo |
|------|:-------:|-------------|---------|
| **Unicast** | `0` | Apunta a UNA única interfaz | `00:1A:2B:3C:4D:5E` |
| **Multicast** | `1` | Apunta a UN GRUPO de dispositivos | `01:00:5E:XX:XX:XX` (multicast IPv4) |
| **Broadcast** | `1` (todos `FF`) | Apunta a TODOS los dispositivos del segmento | `FF:FF:FF:FF:FF:FF` |

El broadcast es el caso extremo del multicast: un grupo al que pertenecen todos. Cuando una trama va con destino `FF:FF:FF:FF:FF:FF`, cada placa de red del segmento la recibe y la procesa.

### 4.2. Según la asignación (bit U/L)

| Tipo | Descripción |
|------|-------------|
| **Universal (UAA)** | Asignada por el fabricante bajo la coordinación de la IEEE. Única en el mundo (en teoría). |
| **Local (LAA)** | Asignada "a mano" por software. Solo tiene sentido dentro de la red donde se configura. Útil para ocultar la MAC real o para imitar otra en entornos controlados. |

### 4.3. Según cómo las registra el switch

Cuando el switch aprende MAC (lo ves en la sección 7), las entradas pueden ser:

| Tipo | Descripción | Persistencia |
|------|-------------|--------------|
| **Dinámica** | Aprendida automáticamente al recibir tráfico | Se borra sola si no hay tráfico (aging time) |
| **Estática** | Configurada a mano en la tabla del switch | Vive solo en la config actual (se pierde al reiniciar si no se guarda) |
| **Permanente** | Como la estática, pero guardada en la configuración de arranque | Sobrevive a reinicios |

---

## 5. La trama Ethernet: el sobre de la capa 2

Los datos en capa 2 viajan dentro de **tramas Ethernet**. Si la capa de red trabaja con paquetes (IP), la capa de enlace los envuelve en tramas: agrega la MAC destino, la MAC origen y un mecanismo de detección de errores. Es la PDU (*Protocol Data Unit*) de la capa 2.

### 5.1. La estructura de la trama IEEE 802.3

```
┌────────┬──────┬────────────────┬────────────────┬──────────────┬──────────────┬──────┬──────────────┐
│ Preám- │ SFD  │ MAC Destino    │ MAC Origen     │ EtherType    │ Payload      │ FCS  │              │
│ bulo   │      │ (6 bytes)      │ (6 bytes)      │ / Length     │ 46-1500      │ CRC  │              │
│ 7 bytes│1 byte│                │                │ (2 bytes)    │ bytes        │ 4 B  │              │
└────────┴──────┴────────────────┴────────────────┴──────────────┴──────────────┴──────┴──────────────┘
        ←──────────── Trama mínima 64 bytes ────────────→
                          ←──────── Trama máxima 1518 bytes ────────→
```

### 5.2. Campo por campo

| Campo | Tamaño | Qué hace |
|-------|:------:|----------|
| **Preámbulo** | 7 B | Patrón de sincronización `10101010` repetido 7 veces. Sirve para que el receptor "se ajuste" al ritmo de la señal. |
| **SFD** | 1 B | *Start Frame Delimiter* — `10101011`. Marca el final de la sincronización y el inicio real de la trama. |
| **MAC Destino** | 6 B | A quién va dirigida la trama (unicast, multicast o broadcast). |
| **MAC Origen** | 6 B | Quién la envía. Este campo es el que usa el switch para APRENDER (sección 7). |
| **EtherType / Length** | 2 B | Qué protocolo trae adentro el payload (`0x0800` = IPv4, `0x0806` = ARP...). En tramas 802.3 antiguas, indica la longitud. |
| **Payload** | 46–1500 B | Los datos de capa superior (el paquete IP, etc.). |
| **FCS** | 4 B | *Frame Check Sequence* — un CRC-32 calculado sobre toda la trama. Si al llegar el receptor recalcula y no coincide: la trama está corrupta y se descarta. |

> **¿Por qué la trama mínima es de 64 bytes?** El teléfono viejo de los estándares Ethernet era compartido (un cable coaxial, luego hubs): si dos equipos transmitían a la vez, había colisión. Para que el emisor tuviera tiempo de DETECTAR la colisión antes de terminar de enviar, la trama no podía ser demasiado corta. Si el payload trae menos de 46 bytes, se agrega *padding* (relleno) para alcanzar el mínimo. Hoy con switches no se necesitaría, pero el estándar quedó.

### 5.3. EtherTypes que te vas a encontrar siemppre

| EtherType | Protocolo |
|:---------:|-----------|
| `0x0800` | IPv4 |
| `0x0806` | ARP |
| `0x86DD` | IPv6 |
| `0x8100` | VLAN tagged (802.1Q) |
| `0x88CC` | LLDP (descubrimiento de vecinos) |

### 5.4. El puente entre IP y MAC: ARP

Si la MAC se usa para entregar dentro del segmento y la IP para llegar lejos, alguien tiene que traducir de una a otra. Ese alguien es **ARP** (*Address Resolution Protocol*):

> **ARP en una frase:** un equipo que conoce la IP (por ejemplo, la del gateway) pero no la MAC, grita por la red "¿quién tiene la IP `192.168.1.1`?" — y el dueño contesta "yo, mi MAC es `00:1A:2B:3C:4D:5E`". Con esa respuesta, arma la trama correcta.

El resultado de esa conversación se guarda en la **tabla ARP** del equipo (en Windows: `arp -a`; en Cisco: `show ip arp`). Las entradas se refrescan cada vez que se usan y expiran solas.

---

## 6. El switch: el cerebro de la capa 2

### 6.1. Un hub no piensa, un switch no adivina

El **hub** (capa 1) repite cada señal que recibe por TODOS los puertos. Es un megáfono: todos escuchan todo, siempre. Simple, pero derrochador y con un solo dominio de colisión (si dos hablan a la vez, chocan).

El **switch** (capa 2) toma una decisión por cada trama: **solo la envía por el puerto donde está el destinatario**. Es un cartero inteligente que, después de entregar una vez, ya sabe en qué departamento vive cada vecino.

| Dispositivo | Capa | Qué hace |
|-------------|:----:|----------|
| **Hub** | 1 | Repite la señal por todos los puertos. No sabe nada. |
| **Bridge** | 2 | El abuelo del switch: 2 puertos, aprende MAC y segmenta en dos dominios. |
| **Switch** | 2 | El bridge multiplicado: muchos puertos, aprende MAC, filtra y reenvía. |

La clave de la inteligencia del switch está en una tabla.

### 6.2. La tabla CAM: la memoria del switch

El switch guarda cada MAC aprendida en una tabla que vive en una memoria especial llamada **CAM** (*Content Addressable Memory*). A diferencia de la RAM normal, en la CAM se busca **por contenido** (no por dirección de memoria), en una sola operación. Para un switch, cuyo trabajo es "dada esta MAC, decirme el puerto" millones de veces por segundo, es exactamente la herramienta correcta.

| Campo | Descripción |
|-------|-------------|
| **Dirección MAC** | La MAC aprendida |
| **Puerto** | Por qué puerto se aprendió |
| **VLAN** | A qué VLAN pertenece ese puerto |
| **Tipo** | Dinámica, estática o permanente |
| **Edad** | Tiempo desde la última vez que se vio esa MAC |

> **Dato clave del envejecimiento:** una MAC aprendida NO vive para siempre. Si pasa el *aging time* sin que esa MAC vuelva a transmitir, la entrada se borra. En Cisco el default es **300 segundos**, y cada vez que la MAC transmite, el contador se reinicia. Si el equipo se apaga o se mueve de puerto, el switch termina aprendiendo de nuevo sola.

---

## 7. El algoritmo del switch: aprender, reenviar, envejecer

Todo el comportamiento de un switch se reduce a mirar **dos direcciones** en cada trama que entra:

- La **MAC de origen** → para **APRENDER** (llenar la tabla CAM).
- La **MAC de destino** → para **REENVIAR** (decidir por dónde sale).

```
                    [ TRAMA ETHERNET ]
┌─────────────────────┬──────────────────┬──────────────────┐
│   MAC de Destino    │   MAC de Origen  │  Datos / Payload │
│     6 bytes         │     6 bytes      │  46-1500 bytes   │
└─────────────────────┴──────────────────┴──────────────────┘
         │                      │
         │                      └──→ Para APRENDER (llenar la tabla)
         │
         └──────────────────────────→ Para REENVIAR (tomar la decisión)
```

### 7.1. Fase de aprendizaje

1. El switch lee la **MAC de origen** de cada trama entrante.
2. Si la MAC **no está** en la tabla → la registra con el puerto de entrada y la VLAN.
3. Si la MAC **ya está** → refresca el temporizador de envejecimiento.
4. Si la MAC está **pero asociada a otro puerto** → actualiza la entrada (el equipo se movió de puerto físicamente).

### 7.2. Fase de reenvío/filtrado

Con el destino en la mano, el switch elige entre cuatro caminos:

| Caso | Situación | Acción |
|:----:|-----------|--------|
| **1** | MAC destino CONOCIDA (está en la tabla) | **Forwarding:** reenvía solo por el puerto asociado. El resto de puertos NO reciben nada — eso es **filtrar**. |
| **2** | MAC destino DESCONOCIDA (no está en la tabla) | **Flooding:** inunda por todos los puertos **excepto** el de origen. |
| **3** | MAC destino = Broadcast `FF:FF:FF:FF:FF:FF` | **Broadcast:** reenvía por todos los puertos excepto el de origen (obligatorio por estándar). |
| **4** | MAC destino = Multicast | Depende de si hay suscriptores registrados. Sin IGMP snooping, se inunda como si fuera broadcast. |

Una perla que suena rara: **inundar también es correcto**. Cuando el switch no sabe dónde está el destino, la única salida es mandar la trama a todos lados y dejar que el destinatario la tome y los demás la descarten. Es ineficiente, pero funciona — y se soluciona solo: apenas el destinatario responde, su MAC entra en la tabla y el siguiente envío ya es directo.

### 7.3. El pseudocódigo del algoritmo

```
PARA CADA trama recibida en puerto P y VLAN V:

  // FASE 1: APRENDIZAJE
  MAC_origen = extraer_MAC_origen(trama)
  actualizar_CAM(MAC_origen, P, V)

  // FASE 2: REENVÍO
  MAC_destino = extraer_MAC_destino(trama)

  SI MAC_destino ES broadcast:
    reenviar_por_todos_excepto(P)

  SINO SI MAC_destino ES multicast Y no hay IGMP snooping:
    reenviar_por_todos_excepto(P)

  SINO:
    puerto_salida = buscar_en_CAM(MAC_destino)
    SI puerto_salida ENCONTRADO Y puerto_salida != P:
      reenviar_por_puerto(puerto_salida)      // Forwarding
    SINO:
      reenviar_por_todos_excepto(P)            // Unicast flooding
```

> **El caso del puerto de entrada = puerto de salida:** si la MAC destino se aprendió por el MISMO puerto por donde entró la trama, el switch la **descarta**. Eso pasa cuando dos equipos comparten un puerto (por ejemplo a través de un hub o un cable directo entre ambos): como el destino está "del otro lado" del mismo puerto, el propio receptor ya la va a escuchar — el switch no tiene que hacer nada.

---

## 8. Métodos de reenvío: latencia contra pureza

El switch puede decidir en qué momento soltar la trama. Son tres estrategias con un tradeoff clásico: **qué tan rápido** vs **qué tan limpio**.

| Método | Cómo funciona | Latencia | Filtra errores |
|--------|--------------|:--------:|:--------------:|
| **Store-and-Forward** | Recibe la trama COMPLETA, verifica el FCS y recién entonces reenvía | Alta | Sí |
| **Cut-Through** | Lee solo la MAC destino y empieza a reenviar sin esperar el resto | Baja | No |
| **Fragment-Free** | Espera los primeros 64 bytes (el mínimo) y luego reenvía | Media | Parcial |

### 8.1. Store-and-Forward (el estándar en empresas)

```
Llega trama → [Recibir completa] → [Verificar FCS] → [Si OK → Reenviar]
                                                    [Si error → Descartar]
```

- **Ventaja:** por la red solo circulan tramas sin errores. Nada de basura propagándose.
- **Desventaja:** latencia mayor, sobre todo con tramas grandes (tiene que tragarse 1500 bytes antes de soltar el primero).
- **Uso:** la mayoría de los switches de distribución y core.

### 8.2. Cut-Through (para mínima latencia)

```
Llega trama → [Leer MAC destino] → [Reenviar de inmediato]
```

- **Ventaja:** latencia mínima, en el orden de los microsegundos.
- **Desventaja:** propaga tramas corruptas (el FCS llega al final, que es justo lo que NO esperó).
- **Variantes:** *fast-forward* reenvía apenas lee el destino; *fragment-free* espera los primeros 64 bytes para descartar los fragmentos de colisión (los "runts").

> **Regla rápida:** si la red está sana y requiere velocidad extrema, cut-through. Si la red es ruidosa o los equipos son viejos, store-and-forward. La mayoría de los switches modernos traen store-and-forward por defecto — y muchos ya mezclan los métodos dinámicamente.

---

## 9. Caso práctico paso a paso: un ping que llena la tabla

Nada de teoría sin bajar a tierra. Escenario: un switch de 4 puertos, tabla CAM vacía, y estas cuatro computadoras:

| Dispositivo | Puerto | Dirección MAC |
|:-----------:|:------:|:-------------:|
| **PC-A** | Fa0/1 | `AAAA.AAAA.AAAA` |
| **PC-B** | Fa0/2 | `BBBB.BBBB.BBBB` |
| **PC-C** | Fa0/3 | `CCCC.CCCC.CCCC` |
| **PC-D** | Fa0/4 | `DDDD.DDDD.DDDD` |

```
  [PC-A] (AAAA)         [PC-B] (BBBB)
      |                     |
   +--v---------------------v---+
   |                             |
   |   Fa0/1             Fa0/2   |
   |          SWITCH             |
   |   Fa0/3             Fa0/4   |
   |                             |
   +--^---------------------^---+
      |                     |
  [PC-C] (CCCC)         [PC-D] (DDDD)
```

**Estado inicial:** tabla CAM vacía.

### Evento 1: PC-A hace ping a PC-C

Trama: origen `AAAA`, destino `CCCC`.

1. **Aprender:** el switch lee el origen `AAAA`. No está en la tabla → la guarda en **Fa0/1**.
2. **Reenviar:** busca el destino `CCCC`. No está → **flooding** por Fa0/2, Fa0/3 y Fa0/4.
3. PC-B y PC-D revisan el destino, no es para ellas... **descartan**.
4. PC-C revisa el destino, ¡es su MAC! → **procesa** y arma la respuesta.

```
Tabla CAM tras el Evento 1:
┌───────────┬──────────────────┬──────────┐
│ Puerto    │ MAC              │ Tipo     │
├───────────┼──────────────────┼──────────┤
│ Fa0/1     │ AAAA.AAAA.AAAA   │ Dinámico │
└───────────┴──────────────────┴──────────┘
```

### Evento 2: PC-C responde a PC-A

Trama: origen `CCCC`, destino `AAAA`.

1. **Aprender:** el switch registra `CCCC` en **Fa0/3**.
2. **Reenviar:** busca `AAAA`. ¡Ya existe, en **Fa0/1**! → **unicast directo**.
3. La trama sale SOLO por Fa0/1. Nadie más la ve. Eso es el **filtrado**.

```
Tabla CAM tras el Evento 2:
┌───────────┬──────────────────┬──────────┐
│ Puerto    │ MAC              │ Tipo     │
├───────────┼──────────────────┼──────────┤
│ Fa0/1     │ AAAA.AAAA.AAAA   │ Dinámico │
│ Fa0/3     │ CCCC.CCCC.CCCC   │ Dinámico │
└───────────┴──────────────────┴──────────┘
```

### Evento 3: PC-B manda datos a PC-A

Trama: origen `BBBB`, destino `AAAA`.

1. **Aprender:** `BBBB` entra a la tabla por **Fa0/2**.
2. **Reenviar:** `AAAA` ya está → unicast directo por Fa0/1. Sin flooding.

### Evento 4: PC-D manda datos a PC-C

Trama: origen `DDDD`, destino `CCCC`.

1. **Aprender:** `DDDD` entra por **Fa0/4**.
2. **Reenviar:** `CCCC` ya está → unicast directo por Fa0/3.

```
Tabla CAM final:
┌───────────┬──────────────────┬──────────┐
│ Puerto    │ MAC              │ Tipo     │
├───────────┼──────────────────┼──────────┤
│ Fa0/1     │ AAAA.AAAA.AAAA   │ Dinámico │
│ Fa0/2     │ BBBB.BBBB.BBBB   │ Dinámico │
│ Fa0/3     │ CCCC.CCCC.CCCC   │ Dinámico │
│ Fa0/4     │ DDDD.DDDD.DDDD   │ Dinámico │
└───────────┴──────────────────┴──────────┘
```

> **La conclusión de oro del caso:** el switch solo inundó UNA vez (Evento 1). A partir de ahí, cada MAC aprendida convirtió tráfico de "gritarle a todos" en "entregar exacto". El costo del primer envío es la inundación; la recompensa es que todos los siguientes viajan derechos. Por eso una red "caliente" (con tráfico constante en los dos sentidos) es una red rápida: el switch ya conoce a todos.

---

## 10. Dominios de colisión y broadcast

### 10.1. Dominio de colisión

Es el conjunto de equipos donde, si dos transmiten al mismo tiempo, sus señales **colisionan** y se corrompen.

| Dispositivo | Dominios de colisión |
|-------------|:--------------------:|
| **Hub** | 1 — todo el hub es un solo dominio |
| **Switch** | 1 **por puerto** — cada equipo habla sin chocar con los demás |
| **Router** | Cada interfaz es un dominio distinto |

Con un hub, dos PCs que transmiten juntos colisionan (y hay backoff, esperas, retransmisiones). Con un switch, cada PC tiene el medio para sí solo — por eso los switches eliminaron el problema de colisiones en las redes modernas.

### 10.2. Dominio de broadcast

Es el conjunto de equipos que reciben una trama con destino `FF:FF:FF:FF:FF:FF`.

| Dispositivo | ¿Separa broadcast? |
|-------------|:------------------:|
| **Hub** | No |
| **Switch** | No (todos los puertos de la misma VLAN reciben el broadcast) |
| **VLAN** | Sí — cada VLAN es su propio dominio de broadcast |
| **Router** | Sí — cada interfaz, y cada VLAN a la que enruta |

```
Hub:      [Broadcast] → llega a TODOS los puertos      (además 1 solo dominio de colisión)
Switch:   [Broadcast] → llega a TODOS los puertos      (pero dominio de colisión por puerto)
VLAN:     [Broadcast] → solo a los puertos de esa VLAN
Router:   [Broadcast] → solo sale por la interfaz donde se originó
```

> **La idea clave:** el switch hace invisible el problema de colisiones, pero NO el de broadcasts. Una red con 500 dispositivos en la misma VLAN significa 500 equipos recibiéndose los broadcasts de todos. Cuando eso molesta, se corta en VLANs (sección siguiente).

---

## 11. VLANs: cortar un switch en pedazos lógicos

Una **VLAN** (*Virtual LAN*) convierte UN switch físico en VARIAS redes lógicas de capa 2, completamente aisladas entre sí. Los broadcasts de una VLAN jamás llegan a otra.

### 11.1. El problema sin VLANs

```
Switch sin VLAN:              ¡Todos los broadcasts de Ventas llegan a todos!
┌────────────────────────────────────────────────────┐
│   Depto. Ventas     │    Depto. Ingeniería         │
│    PC-A → Fa0/1     │    PC-C → Fa0/3              │
│    PC-B → Fa0/2     │    PC-D → Fa0/4              │
├────────────────────────────────────────────────────┤
│  Broadcast de Ventas → ¡llega también a Ingeniería! │
└────────────────────────────────────────────────────┘
```

### 11.2. La solución con VLANs

```
Switch con VLANs:            Aislamiento total de capa 2
┌────────────────────────────────────────────────────┐
│   VLAN 10: Ventas     │   VLAN 20: Ingeniería      │
│    PC-A → Fa0/1       │    PC-C → Fa0/3            │
│    PC-B → Fa0/2       │    PC-D → Fa0/4            │
├────────────────────────────────────────────────────┤
│  Broadcast VLAN 10 → solo Fa0/1 y Fa0/2            │
│  Broadcast VLAN 20 → solo Fa0/3 y Fa0/4            │
└────────────────────────────────────────────────────┘
```

### 11.3. Las ventajas, en la práctica

| Ventaja | Qué te da |
|---------|-----------|
| **Seguridad** | El tráfico de un departamento no se mezcla con el de otro |
| **Menos broadcast** | Cada dominio de broadcast encoge al tamaño de su VLAN |
| **Flexibilidad** | Dos equipos en la misma VLAN pueden estar en pisos distintos (mismo switch, distintos puertos — o incluso switches distintos) |
| **Gestión simple** | Reorganizar departamentos es cambiar un puerto de VLAN, no recablear |

### 11.4. Trunking: cómo viajan las VLANs entre switches

Si tenés dos switches y la VLAN 10 tiene equipos en ambos, las tramas de la VLAN 10 tienen que cruzar el enlace entre switches SIN mezclarse con las de la VLAN 20. La solución es el **trunk**: un enlace que **etiqueta** cada trama con su VLAN.

```
Trama Ethernet normal:
┌────────┬────────┬────────────┬──────────┐
│ MAC D  │ MAC O  │ EtherType  │ Datos    │
│        │        │  0x0800    │          │
└────────┴────────┴────────────┴──────────┘

Trama con etiqueta 802.1Q:
┌────────┬────────┬────────┬─────────────────┬──────────┐
│ MAC D  │ MAC O  │ 0x8100 │ VLAN ID (12 bits)│ Datos    │
│        │        │(Tagged)│ Prioridad (3 b) │          │
└────────┴────────┴────────┴─────────────────┴──────────┘
              ←────── 4 bytes extra ──────→
```

El estándar es **802.1Q**: inserta 4 bytes entre la MAC origen y el EtherType, y ahí va el ID de la VLAN (12 bits = hasta 4094 VLANs). El puerto que conecta los dos switches se configura como **trunk**; los puertos de los equipos se configuran como **acceso** (pertenecen a UNA VLAN, y sus tramas viajan sin etiqueta).

> **Detalle fino:** la trama etiquetada crece 4 bytes → el máximo pasa de 1518 a **1522 bytes**. Por eso a veces ves "MTU 1522" en puertos trunk.

---

## 12. STP: cuando la redundancia arma bucles

En redes serias no hay un solo camino entre switches: se tienden **enlaces redundantes** para que, si uno falla, el tráfico siga vivo. Pero la redundancia trae un monstruo: los **bucles de capa 2**.

### 12.1. El problema: la tormenta de broadcast

```
        ┌──────────┐
        │ Switch A │
        └──┬────┬──┘
           │    │
     ┌─────┘    └─────┐
     │                │
   ┌─┴──┐          ┌──┴─┐
   │ Sw │──────────│ Sw │
   │  B │          │  C │
   └────┘          └────┘
```

Un broadcast sale de A. B lo reenvía, C lo reenvía, y vuelve a A... que lo reenvía de nuevo. La trama da vueltas infinitamente, multiplicándose y saturando la red — **tormenta de broadcast**. Y mientras tanto, las tablas CAM se llenan de entradas que cambian de puerto a cada instante (flap), empeorando todo.

### 12.2. La solución: Spanning Tree Protocol

**STP** (IEEE 802.1D) construye un **árbol** lógico sobre el mapa físico: elige una **raíz** (root bridge) y **bloquea** los puertos redundantes para que NO exista ningún bucle. Los enlaces bloqueados quedan como repuestos: si el camino activo falla, STP recalcula y desbloquea.

```
        ┌────────────┐
        │ Sw A (RB)  │ ← Root Bridge (raíz)
        └──┬──────┬──┘
           │ RP   │ RP        RP = Root Port (puerto raíz)
           │      │           DP = Designated Port (puerto designado)
     ┌─────┘      └─────┐     BLK = Blocked (bloqueado — de repuesto)
     │ DP                │ DP
   ┌─┴──┐            ┌──┴─┐
   │ Sw │────────────│ Sw │
   │  B │            │  C │
   └────┘            └────┘
    RP    BLK       BLK    RP
```

Los switches se comunican con **BPDUs** (*Bridge Protocol Data Units*) y cada puerto pasa por estados:

| Estado | Duración típica | Comportamiento |
|--------|:---------------:|----------------|
| **Blocking** | ~20 s | No reenvía tramas; solo escucha BPDUs |
| **Listening** | ~15 s | No reenvía; participa en la elección de puertos |
| **Learning** | ~15 s | No reenvía, pero aprende direcciones MAC |
| **Forwarding** | — | Reenvía tramas normalmente |
| **Disabled** | — | Puerto apagado administrativamente |

> **Dato clave:** STP clásico tarda ~30–50 segundos en converger (de blocking a forwarding). En redes modernas se usa **RSTP** (*Rapid Spanning Tree*, IEEE 802.1w), que converge en **3–6 segundos** — el mismo concepto, pero con negociación activa en vez de temporizadores a ciegas.

---

## 13. Seguridad en la capa 2

La capa 2 está llena de trampas: como el medio es compartido y el protocolo asume buena fe, un atacante conectado al mismo switch tiene mucho poder. Los ataques y sus contramedidas:

| Ataque | Qué hace | Mitigación |
|--------|----------|------------|
| **MAC Flooding** | Inunda el switch con miles de MAC falsas hasta llenar la CAM. Al no tener tabla, el switch se ve forzado a inundar todo → se comporta como un hub | **Port Security** (límite de MAC por puerto) |
| **MAC Spoofing** | Finge tener la MAC de otro equipo para recibir su tráfico | Port Security con MAC fija, 802.1X |
| **ARP Spoofing** | Envía respuestas ARP falsas ("yo soy el gateway") para interceptar el tráfico de otros | **DAI** (Dynamic ARP Inspection) + DHCP Snooping |
| **VLAN Hopping** | Salta de una VLAN a otra aprovechando trunks mal configurados | Deshabilitar la negociación automática de trunks (DTP), cambiar la VLAN nativa, VLAN 1 fuera de uso |
| **STP Attack** | Envía BPDUs falsas para alterar la topología y convertirse en la raíz | **BPDU Guard** + Root Guard + PortFast |

### 13.1. Port Security: la llave del edificio

Limita cuántas MAC puede aprender un puerto — y qué pasa si aparece una de más:

```
Switch(config)# interface fa0/1
Switch(config-if)# switchport mode access
Switch(config-if)# switchport port-security
Switch(config-if)# switchport port-security maximum 2
Switch(config-if)# switchport port-security mac-address sticky
Switch(config-if)# switchport port-security violation shutdown
```

| Parámetro | Qué hace |
|-----------|----------|
| `maximum` | Máximo de MACs permitidas en el puerto (default: 1) |
| `mac-address sticky` | Aprende automáticamente las primeras MAC vistas y las vuelve estáticas |
| `violation` | Acción ante una MAC ilegítima: `protect` (descarta), `restrict` (descarta y registra), `shutdown` (apaga el puerto — el más común) |

### 13.2. BPDU Guard: nadie toca la raíz

Protege los puertos de acceso: si llega un BPDU (señal de otro switch intentando armar STP), el puerto pasa a estado *errdisable*:

```
Switch(config-if)# spanning-tree bpduguard enable
```

---

## 14. Comandos de referencia (Cisco IOS)

### 14.1. Verificación

| Comando | Qué muestra |
|---------|-------------|
| `show mac address-table` | La tabla CAM completa |
| `show mac address-table dynamic` | Solo entradas dinámicas |
| `show mac address-table static` | Solo estáticas |
| `show mac address-table vlan {id}` | La tabla filtrada por VLAN |
| `show mac address-table address {mac}` | Dónde está una MAC puntual |
| `show mac address-table count` | Cantidad de entradas por VLAN |
| `show interfaces {int}` | Estado de una interfaz (incluye su MAC) |
| `show interfaces status` | Estado de todas las interfaces |
| `show port-security` | Config de Port Security por puerto |
| `show port-security address` | Las MACs seguras configuradas |
| `show spanning-tree` | Topología STP actual |
| `show ip arp` | La tabla ARP (IP ↔ MAC del propio switch) |

### 14.2. Administración

| Comando | Qué hace |
|---------|----------|
| `clear mac address-table dynamic` | Borra todas las entradas dinámicas |
| `clear mac address-table dynamic interface {int}` | Borra las de una interfaz |
| `clear mac address-table dynamic address {mac}` | Borra una MAC puntual |
| `clear port-security sticky` | Borra las MACs sticky |

### 14.3. Ejemplo real de salida

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

Fijate la columna `Vlan`: si TODOS los puertos muestran VLAN 1, es que el switch está "pelado", sin VLANs definidas (la VLAN 1 existe por defecto). Eso es normal en una red recién armada.

---

## 15. Ejercicios prácticos

### Ejercicio 1: ¿Inunda o filtra?

Usando el escenario del caso práctico (PCs A, B, C, D con MACs `AAAA`, `BBBB`, `CCCC`, `DDDD`), partís de la tabla que quedó en el Evento 2 (`AAAA` en Fa0/1 y `CCCC` en Fa0/3). Ahora ocurren estas transmisiones:

| Transmisión | Origen | Destino |
|:-----------:|:------:|:-------:|
| **X** | PC-B (`BBBB`) | PC-A (`AAAA`) |
| **Y** | PC-D (`DDDD`) | PC-C (`CCCC`) |
| **Z** | PC-A (`AAAA`) | PC-B (`BBBB`) |

**Preguntas:**

1. Dibujá la tabla MAC final después de la transmisión Z.
2. Durante la transmisión X, ¿qué puertos recibieron la trama? ¿Hubo flooding?
3. ¿Por qué la transmisión Y no genera flooding?

<details>
<summary>Ver respuestas</summary>

**1 — Tabla final (después de Z):**

| Puerto | MAC | Tipo |
|:------:|:---:|:----:|
| Fa0/1 | `AAAA.AAAA.AAAA` | Dinámico |
| Fa0/2 | `BBBB.BBBB.BBBB` | Dinámico |
| Fa0/3 | `CCCC.CCCC.CCCC` | Dinámico |
| Fa0/4 | `DDDD.DDDD.DDDD` | Dinámico |

**2 — Transmisión X:** `AAAA` ya está en la tabla (Evento 1) → el switch reenvía **solo por Fa0/1**. Los demás puertos NO reciben la trama. **No hay flooding**, y además se aprende `BBBB` en Fa0/2.

**3 — Transmisión Y:** el destino `CCCC` ya está aprendido (Evento 2) → envío directo por Fa0/3. Se aprende `DDDD` en Fa0/4. Sin flooding.
</details>

### Ejercicio 2: tabla vacía de cero

Un switch tiene la CAM completamente vacía y ocurren, en orden: (1) PC-1 manda una trama a PC-2; (2) PC-3 manda una trama a PC-1; (3) PC-2 manda una trama a PC-3.

**Preguntas:**

1. ¿Cuántas tramas físicas genera la transmisión 1 (contando las réplicas que hace el switch)?
2. ¿En qué transmisión el switch empieza a FILTRAR en vez de inundar?
3. ¿Cuántas entradas hay en la CAM después de la transmisión 3?

<details>
<summary>Ver respuestas</summary>

1. La tabla está vacía y el destino no se conoce → **inundación** por todos los puertos excepto el de origen. Con 4 puertos activos: la trama original + 3 réplicas = 4 copias físicas circulando.
2. En la **transmisión 2**: PC-1 ya está en la tabla (aprendida en la 1), así que el envío a PC-1 sale directo. (PC-3 causará una inundación en esa misma transmisión porque todavía no se conoce... y recién ahí se aprende.)
3. Después de la 3 hay **3 entradas**: PC-1, PC-2 y PC-3. Faltaría PC-4, que nunca transmitió.
</details>

### Ejercicio 3: el ping que deja DOS MAC

En Packet Tracer, conectá 3 PCs a un switch 2960 (Fa0/1, Fa0/2, Fa0/3). Limpiá la tabla y lanzá UN solo ping desde PC1 a PC2:

```
Switch# clear mac address-table dynamic
PC1> ping 192.168.1.2
Switch# show mac address-table
```

**Pregunta de ingeniería:** ejecutaste UN comando `ping`, ¿por qué aparecen DOS direcciones MAC nuevas en la tabla?

<details>
<summary>Ver respuesta</summary>

El `ping` es un diálogo de dos pasos:

1. PC1 envía un **Echo Request** (ICMP) hacia PC2 → el switch aprende la MAC de PC1.
2. PC2 recibe la petición y responde con un **Echo Reply** hacia PC1 → el switch aprende la MAC de PC2.

El comando `ping` que escribiste dispara UNA petición, pero el protocolo ICMP implica **ida y vuelta**: dos tramas en direcciones opuestas cruzan el switch, y cada una enseña el origen que trae. Por eso la tabla queda con las dos MAC.
</details>

### Ejercicio 4: VLANs para una empresa

Diseñá un switch para una empresa con dos áreas que deben quedar aisladas en capa 2:

| Área | Dispositivos |
|:----:|:------------:|
| **RRHH** | 2 PCs + 1 impresora |
| **IT** | 3 PCs + 1 servidor |

**Tareas:**

1. Asigná una VLAN a cada área.
2. Asigná los puertos del switch.
3. ¿Qué se necesita para que las dos áreas puedan comunicarse?

<details>
<summary>Ver respuesta</summary>

1. **VLAN 10 — RRHH** y **VLAN 20 — IT** (los números son libres; lo importante es que sean distintas).
2. **VLAN 10:** Fa0/1, Fa0/2, Fa0/3 (PC RRHH 1, PC RRHH 2, impresora). **VLAN 20:** Fa0/4, Fa0/5, Fa0/6, Fa0/7 (PCs IT 1-3 y servidor).
3. Las VLANs están aisladas en capa 2: un broadcast de RRHH jamás llega a IT. Para que se comuniquen hace falta **un dispositivo de capa 3** — un router (con subinterfaces, *router-on-a-stick*) o un switch multicapa con SVIs — que haga el enrutamiento inter-VLAN.
</details>

### Ejercicio 5: leer una MAC como un profesional

Dada la MAC `F8:32:E4:12:AB:CD`:

1. ¿Cuál es el OUI?
2. ¿Es unicast o multicast? ¿Cómo lo sabés?
3. ¿Es universal (de fábrica) o administrada localmente?

<details>
<summary>Ver respuesta</summary>

1. **OUI = `F8:32:E4`** (Samsung). El resto (`12:AB:CD`) es el identificador del dispositivo.
2. **Unicast.** El bit I/G es el bit 0 (el último) del primer byte. `F8` en binario es `1111 1000` → el bit 0 vale `0` → individual, unicast.
3. **Universal.** El bit U/L es el bit 1 (el penúltimo) del primer byte. En `F8 = 1111 1000`, el bit 1 vale `0` → asignada por el fabricante (UAA). Es la MAC normal de fábrica: unicast + universal.

> **Truco para hacerlo de cabeza:** el primer byte es `F8`. Los bits 0 y 1 (los dos últimos del binario) son `00` → unicast + universal. Si el primer byte terminara en 1 (impar, como `01`) → multicast. Este tipo de ejercicio aparece siempre en las certificaciones.
</details>

---

## 16. Comprobá lo que aprendiste

Respondé antes de destapar.

**1. ¿Cuántos bits tiene una MAC y en qué capa trabaja?**
<details>
<summary>Ver respuesta</summary>

**48 bits (6 bytes).** Trabaja en la capa 2 (enlace de datos) del modelo OSI: identifica la interfaz dentro del segmento local.
</details>

**2. ¿Qué diferencia hay entre la IP y la MAC?**
<details>
<summary>Ver respuesta</summary>

La IP es **lógica y puede cambiar** (la asigna DHCP o un administrador, y sirve para enrutar entre redes). La MAC es **física y de fábrica** (grabada en la placa, identifica el dispositivo dentro del segmento). Analogía: la IP es la patente, la MAC es el número de chasis.
</details>

**3. Una MAC termina en `FF:FF:FF:FF:FF:FF`. ¿Qué es?**
<details>
<summary>Ver respuesta</summary>

Es el **broadcast**: todos los bits en 1. Cualquier trama con ese destino es recibida por TODOS los dispositivos del segmento, y el switch la reenvía por todos los puertos excepto el de origen.
</details>

**4. Un switch recibe una trama con destino desconocido. ¿Qué hace y por qué?**
<details>
<summary>Ver respuesta</summary>

**Inunda** por todos los puertos menos el de origen. No sabe dónde vive el destino, así que la única forma de que llegue es copiarla a todos lados. Apenas el destinatario responda, su MAC entra en la tabla y las siguientes entregas serán directas.
</details>

**5. ¿En qué se diferencia el flooding del filtrado?**
<details>
<summary>Ver respuesta</summary>

**Flooding** = reenviar por todos los puertos menos el de origen (destino desconocido). **Filtrado** = reenviar SOLO por el puerto asociado al destino (destino conocido), ocultando la trama al resto.
</details>

**6. Una trama llega al switch por el mismo puerto por donde estaría el destino. ¿Qué pasa?**
<details>
<summary>Ver respuesta</summary>

El switch la **descarta**. Si el destino está "del otro lado" del mismo puerto (por ejemplo detrás de un hub), el receptor ya va a escuchar la trama directamente; reenviarla por el mismo puerto sería un loop inútil.
</details>

**7. ¿Qué hace STP y en qué se diferencia de RSTP?**
<details>
<summary>Ver respuesta</summary>

STP detecta bucles de capa 2 (enlaces redundantes) y **bloquea** los puertos sobrantes para formar un árbol sin loops, evitando tormentas de broadcast. RSTP es la versión rápida: converge en segundos en vez de ~30–50 s.
</details>

**8. Nombrá DOS ataques de capa 2 y su mitigación.**
<details>
<summary>Ver respuesta</summary>

**MAC Flooding** → Port Security (limitar MAC por puerto). **ARP Spoofing** → DAI (Dynamic ARP Inspection) + DHCP Snooping. (También valen: MAC Spoofing → Port Security fija, VLAN Hopping → deshabilitar DTP/tunking automático, STP Attack → BPDU Guard.)
</details>

---

## 17. Glosario

| Término | Qué es |
|---------|--------|
| **Dirección MAC** | Identificador de 48 bits grabado de fábrica en cada interfaz de red |
| **OUI** | Los primeros 24 bits de la MAC; identifican al fabricante (lo asigna la IEEE) |
| **Bit I/G** | Bit 0 del primer byte: `0` = unicast, `1` = multicast/broadcast |
| **Bit U/L** | Bit 1 del primer byte: `0` = universal (fábrica), `1` = administrada localmente |
| **Unicast** | Direccionamiento a una única interfaz |
| **Multicast** | Direccionamiento a un grupo de interfaces |
| **Broadcast** | Direccionamiento a todas: `FF:FF:FF:FF:FF:FF` |
| **Trama** | La PDU de la capa 2: MAC destino + MAC origen + EtherType + payload + FCS |
| **EtherType** | Campo que dice qué protocolo trae la trama (0x0800 = IPv4, 0x0806 = ARP) |
| **FCS / CRC** | Suma de verificación que detecta tramas corruptas |
| **Tabla CAM** | La memoria del switch: MAC → puerto → VLAN |
| **Aging time** | Tiempo de vida de una MAC dinámica sin tráfico (300 s por defecto en Cisco) |
| **Flooding** | Enviar por todos los puertos excepto el de origen (destino desconocido) |
| **Filtrado** | Enviar solo por el puerto del destino (destino conocido) |
| **Dominio de colisión** | Zona donde dos transmisiones simultáneas chocan |
| **Dominio de broadcast** | Zona alcanzada por una trama broadcast |
| **VLAN** | Segmento lógico de capa 2 dentro de un switch |
| **Trunk (802.1Q)** | Enlace que etiqueta las tramas con su VLAN |
| **STP / RSTP** | Protocolo que elimina bucles de capa 2 bloqueando puertos redundantes |
| **Port Security** | Límite de MACs por puerto para frenar MAC flooding |
| **BPDU Guard** | Apaga el puerto si recibe BPDUs (evita ataques a STP) |
| **ARP** | Protocolo que traduce IP → MAC en el segmento local |

---

## 18. Resumen en 10 puntos

1. **MAC = número de chasis; IP = patente.** Una es de fábrica e inmutable; la otra es lógica y cambia.
2. **48 bits, hexadecimal, 3+3 bytes:** OUI (fabricante) + identificador (dispositivo).
3. **Bit 0 = I/G** (unicast/multicast), **bit 1 = U/L** (universal/local). Los dos, al final del primer byte.
4. **La trama es el sobre de la capa 2:** MAC destino, MAC origen, EtherType, payload y CRC.
5. **ARP es el traductor** entre IP y MAC dentro del segmento.
6. **El switch aprende del ORIGEN y decide con el DESTINO**, siempre con los mismos 4 casos: conocido → filtra; desconocido → inunda; broadcast → siempre a todos; multicast → según suscriptores.
7. **La inundación es UNA vez:** apenas el destino responde, su MAC entra en la tabla y el tráfico se vuelve directo.
8. **Switch = cero colisiones (por puerto), pero NO separa broadcasts:** eso lo hacen los routers y las VLANs.
9. **La redundancia necesita STP/RSTP**, o los bucles convierten la red en una tormenta de broadcast.
10. **La capa 2 se ataca fácil y se defiende fácil:** Port Security, DAI, BPDU Guard y trunks bien configurados contra flooding, spoofing y hopping.

---

> **Fuente:** Documentación propia basada en estándares IEEE 802.3 y 802.1Q, documentación Cisco CCNA y material educativo de redes.

# 22. Direcciones MAC y Switches

Este manual arranca desde cero: no hace falta que hayas visto una red en tu vida. Cada concepto
llega en el mismo orden: primero el problema que hay que resolver, después una situación de la
vida diaria que se parece, y recién al final la definición técnica con su nombre propio. Cuando
aparece una sigla —IP, MAC, ARP, VLAN— la explicamos en el momento en que la usamos por primera
vez.

El tema se entiende mejor si arrancás con una pregunta simple: **si cada equipo ya tiene una
dirección IP, ¿para qué quiere una segunda dirección?** Pensá en una persona. Tiene un documento
de identidad con un número que la identifica esté donde esté: no cambia si se muda, no depende
del barrio, no lo emite el municipio donde vive. Y tiene, además, la dirección de la casa donde
hoy vive: esa sí cambia, la comparte con la familia y sirve para que le llegue el correo. El
documento dice **quién sos**; la dirección dice **dónde estás parado ahora**.

En una red pasan las dos cosas al mismo tiempo. La dirección IP (*Internet Protocol*, protocolo de
Internet) es la dirección de la casa: sirve para que los datos lleguen hasta la red correcta, y
puede cambiar. La **dirección MAC** es el documento de identidad de la placa de red: viene de
fábrica, viaja con la placa y no depende de ningún router. Y acá está el punto que ordena todo el
manual: **una tarjeta de red necesita poder ser identificada antes de que exista un router en el
medio**. Dentro de un mismo tramo de cable, entre dos equipos conectados al mismo switch, no hay
ningún router: hay dos placas hablándose. Para eso existe la MAC.

**MAC** significa *Media Access Control* (control de acceso al medio): es el identificador de una
interfaz de red —una placa Ethernet, un chip Wi-Fi, un puerto de un switch— y vive en la **capa
2** del modelo **OSI** (*Open Systems Interconnection*, el mapa de siete capas que ordena las
tareas de una red; la capa 2 es la de "enlace de datos", la que mueve datos entre equipos vecinos).
Los datos que viajan en esa capa no se llaman paquetes sino **tramas**.

**La idea madre de este manual:** para que dos equipos se hablen dentro de la misma red alcanza con
la MAC, porque están conectados al mismo medio; para salir de esa red hace falta la IP y un router
que la enrute. El **switch** (conmutador) es el aparato que aprende MACs y decide por qué puerto
mandar cada trama; el **router** (enrutador) es el que une redes distintas y trabaja con IP. Este
manual es sobre el primero: cómo aprende, cómo decide, cómo se equivoca y cómo se lo puede atacar.

Un detalle que separa al que memoriza del que entiende: la MAC **no viaja de punta a punta** como
la IP. Cada vez que una trama cruza un router, la MAC de destino se reescribe con la del *próximo*
salto. En un viaje con escalas, el pasajero (la IP) siempre es el mismo; el número de asiento y el
embarque (la MAC) cambian en cada tramo.

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

Cómo usar este índice: cada entrada es un capítulo y cada título es, además, la dirección (URL)
con la que se publica la página. Si estás apurado, con los capítulos 1, 5, 6 y 7 entendés el
mecanismo completo; el resto son los casos donde ese mecanismo se rompe: bucles, ataques, VLANs.

### Resumen

- Este manual enseña desde cero: qué es una MAC, por qué existe y cómo la usa un switch.
- La MAC es el documento de identidad de la placa; la IP es la dirección de la casa donde está hoy.
- El recorrido corto es: por qué hay dos direcciones (1), qué es una MAC (2), la trama (5) y el switch (6, 7).

---

## 1. El punto de partida: el chasis y la patente

Antes de entrar en redes, quedémonos un minuto en el problema. Tenés una oficina con cuatro
computadoras conectadas a un mismo aparato. La computadora A quiere mandarle un archivo a la C. Las
direcciones IP dicen "A es 192.168.1.10 y C es 192.168.1.12", pero esas direcciones son parte de
una configuración: las inventó alguien, se pueden repetir en otra red, y cambian si alguien las
reconfigura. El aparato del medio, el switch, tiene que decidir por cuál de sus cuatro cables
mandar la trama. Si solo tuviera IPs, tendría que confiar en una información que no es propiedad
física de ningún equipo. Lo que necesita es un identificador **grabado en el fierro**: algo que
diga "esta placa es esta y no otra", sin importar qué IP le tocó. Ese identificador es la MAC.

Volvamos al ejemplo de la persona, ahora con un auto, que es la imagen que usa este capítulo. Un
auto tiene DOS identificadores que casi nunca coinciden:

- **El número de chasis (VIN):** lo asigna el fabricante en la fábrica. Es único en el mundo, no se puede cambiar, y está grabado en el metal. Describe *qué es* ese auto.
- **La patente:** se la asigna el Estado, y puede cambiar. Si vendés el auto o te mudás de provincia, la patente cambia. Describe *dónde/dentro de qué jurisdicción* se identifica el auto en ese momento.

En una red pasa exactamente igual, con dos "números":

- **La dirección IP** identifica al dispositivo dentro de la red. Es lógica: la asigna un administrador (o un servidor DHCP), y **puede cambiar**. Es la "patente".
- **La dirección MAC** identifica la placa de red física. Viene grabada de fábrica, es única en el mundo y **no cambia**. Es el "número de chasis".

**DHCP** son las siglas de *Dynamic Host Configuration Protocol* (protocolo de configuración
dinámica de equipos): el servicio que, cuando te conectás a una red, te presta una IP por un rato
en vez de que la escribas a mano. Es el que hace que tu casa funcione sin que nadie configure nada.

Las dos analogías —documento contra domicilio, chasis contra patente— dicen lo mismo: hay un
identificador que **es** del equipo y otro que **le tocó** en un momento. Y hay una diferencia
práctica enorme entre las dos: al documento de identidad lo puede leer cualquiera que esté cerca,
sin preguntarle a ninguna oficina central. Eso es exactamente lo que hace el switch con la MAC.

> **La idea madre de este manual:** el tráfico dentro de una red se entrega usando MAC (capítulo 2 del modelo OSI, la capa de enlace), mientras que el tráfico entre redes se enruta usando IP (la capa de red). Para entender los switches hay que domar los dos: entender **qué hace cada uno**, **cuándo se usa cada uno** y **cómo conviven** en la misma trama.

Este manual te lleva de cero al detalle fino: qué es una MAC, cómo se construye, cómo viaja dentro
de una trama Ethernet (el formato de trama del estándar Ethernet, el de las redes de cable), y cómo
el **switch** —el dispositivo más común del mundo— usa esas MAC para aprender y decidir por dónde
mandar cada cosa.

### Qué vas a poder hacer al terminar

- Mirar una MAC y decir si es de fábrica o inventada, si es individual o de grupo y quién la fabricó.
- Leer una trama Ethernet campo por campo y saber qué hace cada uno.
- Explicar, con una tabla en la mano, por qué el switch inundó una trama y no otra.
- Diagnosticar por qué un equipo "no aparece" en la red mirando la tabla de MACs del switch.

### Resumen

- Hay dos identificadores porque resuelven dos problemas distintos: uno dice quién es el equipo, el otro dónde está.
- La MAC está grabada en la placa y no depende de ninguna configuración; por eso sirve para entregar datos entre equipos vecinos.
- La IP es lógica, la asigna un administrador o DHCP, y sirve para atravesar redes.
- El switch decide con MAC; el router decide con IP; una misma trama lleva las dos cosas.

---

## 2. ¿Qué es una dirección MAC?

**MAC** significa *Media Access Control* (Control de Acceso al Medio). Es un identificador de **48 bits (6 bytes)** asignado de fábrica a cada interfaz de red — a cada placa de red, a cada puerto Ethernet, a cada chip Wi-Fi.

**Qué es un bit y qué es un byte.** Un **bit** es la unidad mínima de información: un 0 o un 1.
Un **byte** son 8 bits. Una MAC ocupa 48 bits, o sea 6 bytes. Si te preguntás por qué 48 y no 32
como la IP, la respuesta histórica es simple: se eligió un espacio lo bastante grande como para que
no se agotara nunca (2^48 son unos 281 billones de combinaciones) y lo bastante chico como para no
gastar demasiado espacio en cada trama. La IP, en cambio, se diseñó cuando nadie imaginaba que cada
persona tendría cinco dispositivos.

### 2.1. Características fundamentales

| Propiedad | Descripción |
|-----------|-------------|
| **Longitud** | 48 bits (6 bytes) |
| **Formato** | Hexadecimal, con separadores (`:`, `-` o `.`) |
| **Asignación** | Grabada en la placa por el fabricante (se guarda en ROM) |
| **Alcance** | Local: solo importa dentro del mismo segmento de red |
| **Capa OSI** | Capa 2 — Enlace de Datos |
| **Modificación** | Se puede sobrescribir por software (spoofing), pero en general no conviene |

**Qué es esta tabla.** Seis propiedades de una MAC, una por fila. Leela como la ficha técnica del
documento de identidad de la placa. Fila por fila:

- **Longitud:** 48 bits, 6 bytes. Con eso alcanza para que no se repita en la práctica.
- **Formato:** se escribe en **hexadecimal** (base 16, con los dígitos 0-9 y las letras A-F), porque
  escribir 48 bits en decimal sería ilegible. Los separadores (`:`, `-`, `.`) son solo comodidad de
  quien la escribe: no son parte de la dirección.
- **Asignación:** la graba el fabricante y queda en una memoria **ROM** (*Read Only Memory*, memoria
  de solo lectura) de la placa. Vos no la elegís.
- **Alcance:** es **local**. Esto es central y suele pasarse por alto: la MAC importa dentro del
  segmento (el tramo de red donde los equipos se ven directamente), no en Internet. Un router no
  enruta por MAC; la usa solo para el salto siguiente.
- **Capa OSI:** capa 2, enlace de datos. Es la capa que arma las tramas.
- **Modificación:** se puede sobrescribir por software (*spoofing*, falsificación), pero no conviene:
  rompe la unicidad y, en redes con defensas, te deja afuera.

> **Ojo con el "única en el mundo".** Es único para *identificar* un dispositivo, pero la MAC no es una garantía de seguridad: cualquiera con una computadora puede leer la MAC de su placa y **fingir** que tiene otra (spoofing). La unicidad es una convención de fábrica, no un mecanismo de autenticación. Lo vas a ver en la sección de seguridad.

### 2.2. Formas de representación

La MAC se escribe en hexadecimal porque 48 bits en decimal serían ilegibles. Las tres notaciones más comunes:

```
Formato estándar:        00:1A:2B:3C:4D:5E
Formato Windows:         00-1A-2B-3C-4D-5E
Formato Cisco (IOS):     001A.2B3C.4D5E
```

**Qué es este bloque.** La misma dirección escrita de tres maneras, tal como la muestra cada
sistema. Tres renglones, tres convenciones:

- **Formato estándar:** pares hexadecimales separados por dos puntos. Es el que vas a ver en Linux,
  en macOS y en la mayoría de la documentación.
- **Formato Windows:** idéntico, pero con guiones. Windows lo usa en `ipconfig /all` y en el panel
  de propiedades de la placa.
- **Formato Cisco (IOS):** grupos de cuatro dígitos separados por punto. **IOS** es el sistema
  operativo de los switches y routers Cisco (*Internetwork Operating System*); sus tablas de MAC
  usan este formato, y por eso tenés que saberlo leer.

**Qué mirar vos en pantalla:** contá los grupos. Siempre son 12 dígitos hexadecimales, sin importar
los separadores: 12 dígitos = 48 bits = 6 bytes. Si ves `001a.2b3c.4d5e` en un switch Cisco y
`00-1A-2B-3C-4D-5E` en Windows, son idénticas: las minúsculas y las mayúsculas no cambian nada en
hexadecimal (la letra `a` y la `A` valen diez en las dos formas).

### Resumen

- Una MAC es un identificador de 48 bits (6 bytes) grabado de fábrica en cada interfaz de red.
- Se escribe en hexadecimal de tres maneras distintas, con el mismo contenido: `00:1A:2B:3C:4D:5E`.
- Es única en teoría, pero se puede falsificar: es una convención, no una credencial de seguridad.
- Su alcance es local: sirve para entregar dentro del segmento, no para atravesar Internet.

---

## 3. La anatomía de una MAC: OUI y número de serie

Una MAC no es un número tirado al azar: está partida en dos mitades y cada mitad cuenta algo. Los 48 bits se reparten en dos bloques de 24 bits (3 bytes) cada uno:

```
     48 bits (6 bytes)
┌──────────────────────────────┬──────────────────────────────┐
│        OUI (24 bits)         │     Identificador (24 bits)   │
│   Identifica al FABRICANTE   │   Identifica al DISPOSITIVO   │
└──────────────────────────────┴──────────────────────────────┘
        00:1A:2B                    3C:4D:5E
```

**Qué es este bloque.** Un dibujo de la MAC `00:1A:2B:3C:4D:5E` cortada en dos. La mitad izquierda
dice quién fabricó la placa; la derecha, qué placa es dentro de la producción de ese fabricante.
Mirá los tamaños: los dos bloques son iguales (24 bits), y juntos suman los 48 bits del capítulo
anterior. Es el mismo esquema de un documento de identidad: una parte la emite el organismo (el
prefijo) y la otra la asigna el emisor para distinguir un documento de otro.

### 3.1. El OUI: el "código de fábrica"

El **OUI** (*Organizationally Unique Identifier*, identificador único por organización) identifica
al fabricante de la placa. Lo asigna la **IEEE** (el organismo internacional que también define los
estándares Ethernet) y se puede consultar públicamente en su registro. Por eso, con solo mirar los
primeros 3 bytes, sabés quién fabricó el dispositivo:

| OUI (hex) | Fabricante |
|-----------|------------|
| `00:1A:2B` | Cisco Systems |
| `00:50:56` | VMware (máquinas virtuales) |
| `08:00:27` | Oracle VirtualBox |
| `3C:52:82` | Intel |
| `BC:AE:C5` | Dell |
| `F8:32:E4` | Samsung |

**Qué es esta tabla.** Seis prefijos reales con su fabricante. Dos columnas y nada más: el prefijo
(la mitad izquierda de la MAC) y quién lo tiene registrado. Para usarla se busca la fila cuyo
prefijo coincide con los primeros tres bytes de la MAC que estás investigando.

**Qué mirar vos en pantalla:** si en tu red aparece una MAC que empieza con `00:50:56` o
`08:00:27`, es una máquina virtual, no un equipo físico — VMware y VirtualBox se reservaron esos
prefijos. Es un dato que sirve muchísimo para detectar dispositivos raros en una red de oficina: un
servidor que debería ser físico y aparece como VMware es, como mínimo, una sorpresa que hay que
explicar.

Un detalle que confunde: el OUI es del **fabricante de la interfaz**, no de la marca del equipo. Una
notebook Dell puede tener una placa Wi-Fi Intel; en ese caso la MAC del Wi-Fi arranca con el OUI de
Intel y la del cable con el de Dell.

### 3.2. Los dos bits especiales del primer byte

Acá está el detalle que casi nadie explica bien, y que separa a los que entienden de los que repiten. El **primer byte** de la MAC tiene DOS bits con significado especial, y están **al final del byte** (los bits de menor peso), no al principio:

```
Primer byte de la MAC (por ejemplo 00:1A:2B:3C:4D:5E → el "00")
Posición de bits:   [7] [6] [5] [4] [3] [2] [1] [0]
                                          ^   ^
                                          |   +--- Bit 0 = I/G
                                          +------- Bit 1 = U/L
```

**Qué es este bloque.** El primer byte abierto en sus ocho bits. Arriba está la posición de cada
bit, numerada de 7 a 0: el bit 7 es el de más peso (el que vale 128) y el bit 0 el de menos peso (el
que vale 1). Las flechas señalan los dos únicos bits que no son parte del número del fabricante: el
**bit 0** y el **bit 1**. Todo lo demás del byte es OUI, o sea identificación del fabricante.

| Bit | Nombre | Qué indica | Valor |
|:---:|--------|------------|:-----:|
| **0** (el último) | **I/G** — Individual/Group | ¿La MAC habla de UNA placa o de UN GRUPO? | `0` = unicast, `1` = multicast/broadcast |
| **1** (el anteúltimo) | **U/L** — Universal/Local | ¿Quién asignó la MAC? | `0` = universal (la IEEE/fábrica), `1` = administrada localmente |

**Qué es esta tabla.** Dos filas, un bit cada una. La columna **Bit** dice cuál es (contando desde
0, sobre el primer byte); **Nombre** trae las siglas en inglés; **Qué indica** plantea la pregunta
que responde; y **Valor** dice qué significa encontrarlo en 0 o en 1.

- **I/G** viene de *Individual/Group*: individual (una sola placa) o grupo (varias). Con 0, la trama
  va dirigida a una placa; con 1, a un conjunto de placas.
- **U/L** viene de *Universal/Local*: universal (la asignó la IEEE, viene de fábrica) o local (la
  puso un software en tu equipo).

Fijate que para leerlos con notación hexadecimal conviene pasar el primer byte a binario y mirar los últimos dos dígitos binarios:

```
00  →  0000 0000  →  I/G = 0 (unicast),  U/L = 0 (universal)   ← la inmensa mayoría
01  →  0000 0001  →  I/G = 1 (multicast), U/L = 0 (universal)  ← multicast IPv4
02  →  0000 0010  →  I/G = 0 (unicast),  U/L = 1 (local)       ← MAC local hecha a mano
```

**Qué es este bloque.** Tres ejemplos del primer byte, ya convertidos a binario, con la conclusión
al costado. Sirve como tabla de traducción: mirás el byte, mirás los dos últimos bits binarios y ya
sabés qué clase de MAC tenés. Los tres casos:

- `00`: los dos bits en 0. Es el caso normal: unicast y universal. Si tu placa es de fábrica, su
  primer byte casi seguro termina en 0.
- `01`: el bit 0 en 1 → multicast (la MAC es de un grupo), y el bit 1 en 0 → universal. Es el
  prefijo típico del multicast de IPv4 y el que se usa en protocolos que hablan a varios equipos a
  la vez.
- `02`: el bit 0 en 0 → unicast, pero el bit 1 en 1 → local. Es una MAC inventada por software.

> **Regla mnemotécnica:** si el primer byte es `00`, es una MAC "normal" de fábrica, individual y universal. Si viste `01:00:5E:...` es multicast. Si viste `FF:FF:FF:FF:FF:FF` es el broadcast. Una MAC local administrada suele arrancar en `02`, `06`, `0A`, `0E` (bits U/L en 1).

**Cómo leer el truco de cabeza.** En hexadecimal, cada dígito vale 4 bits. Para saber si el primer
byte es par o impar mirá el último dígito: `0`,`2`,`4`,`6`,`8`,`A`,`C`,`E` son pares (bit 0 en 0) y
`1`,`3`,`5`,`7`,`9`,`B`,`D`,`F` son impares (bit 0 en 1). Después, para el bit 1, mirá si el último
dígito está en el grupo `0-3` (bit 1 en 0) o en `4-7`, `8-B`, `C-F` (bit 1 en 1). Con esas dos
cuentas resolvés cualquier MAC sin calculadora.

### Resumen

- La MAC se parte en OUI (24 bits del fabricante) e identificador del dispositivo (24 bits).
- El OUI se consulta en el registro de la IEEE; sirve para saber quién fabricó una placa y para detectar máquinas virtuales.
- Los dos bits bajos del primer byte cambian el significado de toda la dirección: I/G (individual o grupo) y U/L (fábrica o local).
- Leer esos dos bits es cuestión de mirar el último dígito hexadecimal del primer byte.

---

## 4. Tipos de direcciones MAC

No todas las MAC se comportan igual. Hay tres maneras de clasificarlas y las tres importan para
entender qué hace un switch con cada trama que le llega: según a quién apuntan, según quién las
asignó, y según cómo las guarda el switch.

### 4.1. Según el destino (bit I/G)

| Tipo | Bit I/G | Descripción | Ejemplo |
|------|:-------:|-------------|---------|
| **Unicast** | `0` | Apunta a UNA única interfaz | `00:1A:2B:3C:4D:5E` |
| **Multicast** | `1` | Apunta a UN GRUPO de dispositivos | `01:00:5E:XX:XX:XX` (multicast IPv4) |
| **Broadcast** | `1` (todos `FF`) | Apunta a TODOS los dispositivos del segmento | `FF:FF:FF:FF:FF:FF` |

**Qué es esta tabla.** Tres formas de apuntar, de la más precisa a la más amplia. La columna **Bit
I/G** es la que ya conocés del capítulo anterior: es lo que distingue una MAC de las otras en el
primer byte. **Descripción** dice a cuántas placas llega y **Ejemplo** muestra una dirección real
(o un patrón, cuando las X son los dígitos que cambian).

- **Unicast:** conversación uno a uno. Es lo normal: tu PC pidiéndole una página a un servidor.
- **Multicast:** conversación de uno a un grupo, como un canal de radio. Los equipos que quieren
  escuchar se suscriben; los que no, ignoran.
- **Broadcast:** conversación de uno a todos, como un altavoz en el pasillo.

El broadcast es el caso extremo del multicast: un grupo al que pertenecen todos. Cuando una trama va con destino `FF:FF:FF:FF:FF:FF`, cada placa de red del segmento la recibe y la procesa.

**Por qué existe el broadcast.** Porque hay preguntas que solo se pueden hacer al aire: "¿quién
tiene la IP `192.168.1.1`?" no tiene destinatario conocido de antemano. Más adelante vas a ver que
ese tipo de preguntas son la causa de la mitad de los problemas de una red grande.

### 4.2. Según la asignación (bit U/L)

| Tipo | Descripción |
|------|-------------|
| **Universal (UAA)** | Asignada por el fabricante bajo la coordinación de la IEEE. Única en el mundo (en teoría). |
| **Local (LAA)** | Asignada "a mano" por software. Solo tiene sentido dentro de la red donde se configura. Útil para ocultar la MAC real o para imitar otra en entornos controlados. |

**Qué es esta tabla.** Dos formas de haber conseguido la MAC. **UAA** viene de *Universally
Administered Address* (dirección administrada universalmente) y **LAA** de *Locally Administered
Address* (administrada localmente). Es el bit U/L del capítulo 3 puesto en palabras.

**Qué mirar vos en pantalla:** la regla precisa es que el bit 1 del primer byte esté en 1. Los casos
más comunes son los primeros bytes `02`, `06`, `0A` y `0E`, pero también valen `12`, `16`, `22` o
cualquier otro con esa condición; por eso no alcanza con memorizar cuatro números, hay que mirar el
bit. En un servidor es común (balanceadores y clústeres lo hacen para poder moverse); en una
notebook de un usuario es una señal de alarma, porque alguien la cambió a mano. Y como el prefijo
local no está registrado, el OUI de esas direcciones no te dice nada del fabricante.

### 4.3. Según cómo las registra el switch

Cuando el switch aprende MAC (lo ves en la sección 7), las entradas pueden ser:

| Tipo | Descripción | Persistencia |
|------|-------------|--------------|
| **Dinámica** | Aprendida automáticamente al recibir tráfico | Se borra sola si no hay tráfico (aging time) |
| **Estática** | Configurada a mano en la tabla del switch | Vive solo en la config actual (se pierde al reiniciar si no se guarda) |
| **Permanente** | Como la estática, pero guardada en la configuración de arranque | Sobrevive a reinicios |

**Qué es esta tabla.** Las tres clases de entrada que puede haber en la memoria de un switch.
**Descripción** dice de dónde salió la entrada y **Persistencia** dice cuánto dura: las dinámicas se
borran solas, las estáticas viven hasta el próximo reinicio y las permanentes quedan guardadas en
la configuración de arranque.

**Qué mirar vos en pantalla:** la palabra clave está en la segunda columna. Si la entrada es
`DYNAMIC`, el switch la dedujo del tráfico y es un dato de contexto: se puede ir en cualquier
momento. Si es `STATIC`, alguien la escribió, y si alguien la escribió es porque **espera** que ese
equipo esté siempre ahí. Cuando una MAC estática empieza a aparecer por otro puerto, es que hay algo
que ese alguien no sabía.

### Resumen

- Según a quién apuntan: unicast (una placa), multicast (un grupo) y broadcast (todas).
- Según quién las asignó: universal de fábrica (UAA) o local puesta por software (LAA).
- Según cómo las guarda el switch: dinámicas (se borran solas), estáticas (hasta reiniciar) y permanentes (sobreviven).
- Clasificar una MAC es mirar dos bits del primer byte y una palabra de la tabla del switch.

---

## 5. La trama Ethernet: el sobre de la capa 2

Los datos en capa 2 viajan dentro de **tramas Ethernet**. Si la capa de red trabaja con paquetes (IP), la capa de enlace los envuelve en tramas: agrega la MAC destino, la MAC origen y un mecanismo de detección de errores. Es la PDU (*Protocol Data Unit*, unidad de datos del protocolo) de la capa 2.

La analogía es el sobre de una carta. Vos escribís la carta (son tus datos), pero para que viaje
hace falta un sobre con dos datos imprescindibles: a quién va y de quién viene. Ethernet es ese
sobre, y el estándar que lo define es **IEEE 802.3**.

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

**Qué es este bloque.** La trama vista como una fila de casilleros, de izquierda a derecha, en el
orden en que salen por el cable. Cada casillero es un campo y abajo está su tamaño en bytes. Las
dos flechas de abajo marcan los límites: una trama Ethernet nunca es menor a 64 bytes ni mayor a
1518 bytes. Si te dan ganas de contar, fijate que los campos no llegan a 64 por sí solos: el
payload se rellena cuando hace falta.

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

**Qué es esta tabla.** El detalle de cada casillero del dibujo anterior. La columna **Campo** dice
el nombre, **Tamaño** cuántos bytes ocupa y **Qué hace** explica para qué está. Léela de arriba
abajo, que es el orden del cable:

- **Preámbulo (7 bytes):** no es información, es música de espera. Una secuencia de bits alternados
  que le da tiempo al receptor a engancharse al ritmo de la señal. Sin él, el receptor no sabría
  cuándo empieza a contar bits.
- **SFD (1 byte):** la última señal de sincronización, distinta a las anteriores (`...1011`), que
  funciona como el disparo de largada: "acá empieza la trama de verdad".
- **MAC Destino (6 bytes):** el destinatario del sobre. Puede ser una placa, un grupo o todos.
- **MAC Origen (6 bytes):** el remitente. Es el campo más importante para un switch: de acá saca lo
  que aprende.
- **EtherType / Length (2 bytes):** la etiqueta que dice qué hay adentro. `0x0800` es IPv4, `0x0806`
  es ARP, `0x86DD` es IPv6. El `0x` delante solo avisa que el número está en hexadecimal.
- **Payload (46 a 1500 bytes):** el contenido. El mínimo de 46 no es capricho: es lo que hace que la
  trama llegue a 64 bytes.
- **FCS (4 bytes):** la suma de control. El emisor calcula un **CRC** (*Cyclic Redundancy Check*,
  verificación por redundancia cíclica, un cálculo matemático sobre todos los bits) y el receptor lo
  repite. Si no coincide, algo se corrompió en el camino y la trama se tira a la basura.

> **¿Por qué la trama mínima es de 64 bytes?** El teléfono viejo de los estándares Ethernet era compartido (un cable coaxial, luego hubs): si dos equipos transmitían a la vez, había colisión. Para que el emisor tuviera tiempo de DETECTAR la colisión antes de terminar de enviar, la trama no podía ser demasiado corta. Si el payload trae menos de 46 bytes, se agrega *padding* (relleno) para alcanzar el mínimo. Hoy con switches no se necesitaría, pero el estándar quedó.

### 5.3. EtherTypes que te vas a encontrar siempre

| EtherType | Protocolo |
|:---------:|-----------|
| `0x0800` | IPv4 |
| `0x0806` | ARP |
| `0x86DD` | IPv6 |
| `0x8100` | VLAN tagged (802.1Q) |
| `0x88CC` | LLDP (descubrimiento de vecinos) |

**Qué es esta tabla.** Los cinco valores de EtherType que aparecen todo el tiempo en capturas y en
documentación. La primera columna es el número que va en el campo EtherType; la segunda, el
protocolo que anuncia. Los tres primeros ya los conocés: IPv4, ARP (el que traduce IP a MAC, lo
vemos en el próximo apartado) e IPv6 (la versión nueva de IP, de 128 bits). Los otros dos son de
capa 2 pura: `0x8100` avisa que la trama lleva una etiqueta de VLAN, y `0x88CC` es **LLDP** (*Link
Layer Discovery Protocol*, protocolo de descubrimiento de vecinos: dos switches se anuncian quiénes
son).

**Qué mirar vos en pantalla:** si abrís una captura y ves `0x0806`, la trama siguiente en la lista
casi seguro es la respuesta: es un pedido de ARP. Si ves `0x8100`, estás mirando un enlace entre
switches, no la conexión de un equipo.

### 5.4. El puente entre IP y MAC: ARP

Si la MAC se usa para entregar dentro del segmento y la IP para llegar lejos, alguien tiene que traducir de una a otra. Ese alguien es **ARP** (*Address Resolution Protocol*, protocolo de resolución de direcciones):

> **ARP en una frase:** un equipo que conoce la IP (por ejemplo, la del gateway) pero no la MAC, grita por la red "¿quién tiene la IP `192.168.1.1`?" — y el dueño contesta "yo, mi MAC es `00:1A:2B:3C:4D:5E`". Con esa respuesta, arma la trama correcta.

El resultado de esa conversación se guarda en la **tabla ARP** del equipo (en Windows: `arp -a`; en Cisco: `show ip arp`). Las entradas se refrescan cada vez que se usan y expiran solas.

```
$ arp -a
? (192.168.1.1) at 00:1a:2b:3c:4d:5e [ether] on eth0
? (192.168.1.12) at f8:32:e4:12:ab:cd [ether] on eth0
```

**Qué es este bloque.** La tabla ARP de una PC, tal como la muestra `arp -a` en Linux. Dos filas, dos
vecinos. Se lee así: primero la IP entre paréntesis, después `at` y la MAC, después el tipo de
dirección (`ether` significa Ethernet) y al final la interfaz por la que se aprendió (`eth0`, la
placa de cable).

**Qué mirar vos en pantalla:** las dos filas alcanzan para reconstruir la red. La primera
(`192.168.1.1`) es el gateway, el equipo por el que se sale a Internet: si esa MAC cambia de un día
para el otro sin que nadie haya cambiado el router, sospechá. La segunda es un vecino al que esta PC
le habló hace poco. Y si la tabla se llena de direcciones que no reconocés, es una red con más
gente de la que pensabas.

### Resumen

- La trama Ethernet es el sobre de la capa 2: sincronización, MAC destino, MAC origen, tipo, datos y verificación.
- El campo MAC Origen es la materia prima del aprendizaje del switch; el destino es lo que decide el reenvío.
- La trama mínima de 64 bytes y la máxima de 1518 son herencia del Ethernet compartido, y siguen vigentes.
- ARP es el puente entre IP y MAC: pregunta al segmento y guarda la respuesta en una tabla temporal.

---

## 6. El switch: el cerebro de la capa 2

Ya tenemos la dirección y el sobre. Falta el aparato que los usa. Para entender qué aporta un
switch hay que ver primero qué había antes, porque el switch nació como respuesta a un problema muy
concreto.

### 6.1. Un hub no piensa, un switch no adivina

El **hub** (concentrador, capa 1) repite cada señal que recibe por TODOS los puertos. Es un megáfono: todos escuchan todo, siempre. Simple, pero derrochador y con un solo dominio de colisión (si dos hablan a la vez, chocan).

El **switch** (capa 2) toma una decisión por cada trama: **solo la envía por el puerto donde está el destinatario**. Es un cartero inteligente que, después de entregar una vez, ya sabe en qué departamento vive cada vecino.

| Dispositivo | Capa | Qué hace |
|-------------|:----:|----------|
| **Hub** | 1 | Repite la señal por todos los puertos. No sabe nada. |
| **Bridge** | 2 | El abuelo del switch: 2 puertos, aprende MAC y segmenta en dos dominios. |
| **Switch** | 2 | El bridge multiplicado: muchos puertos, aprende MAC, filtra y reenvía. |

**Qué es esta tabla.** Tres aparatos que se parecen por fuera y no tienen nada que ver por dentro.
La columna **Capa** dice en qué piso del modelo OSI trabajan (capa 1 es el cable y las señales;
capa 2 es la trama y las MAC) y **Qué hace** resume su comportamiento.

- **Hub:** no tiene memoria ni criterio. Lo que entra por un puerto sale por todos los demás. Por eso
  es un solo dominio de colisión: si dos equipos transmiten a la vez, las señales se pisan.
- **Bridge (puente):** el primer aparato que aprendió MACs. Dos puertos nomás, pero suficiente para
  partir una red en dos y dejar de repetir todo.
- **Switch:** el mismo mecanismo, con decenas de puertos y hardware dedicado.

**Qué mirar vos en pantalla:** si en una oficina ves un aparato chico con muchos puertos y ninguna
luz de actividad por puerto, es un hub barato o un switch muy básico; si tiene una luz por puerto y
parpadea solo en los puertos con tráfico, es un switch. La diferencia práctica es inmediata: con hub,
todos los equipos comparten la velocidad; con switch, cada puerto tiene la suya.

La clave de la inteligencia del switch está en una tabla.

### 6.2. La tabla CAM: la memoria del switch

El switch guarda cada MAC aprendida en una tabla que vive en una memoria especial llamada **CAM** (*Content Addressable Memory*, memoria direccionable por contenido). A diferencia de la RAM normal, en la CAM se busca **por contenido** (no por dirección de memoria), en una sola operación. Para un switch, cuyo trabajo es "dada esta MAC, decirme el puerto" millones de veces por segundo, es exactamente la herramienta correcta.

**Qué significa buscar por contenido.** En una memoria común vos pedís "dame el dato que está en la
posición 300". En una CAM pedís "¿tenés esta MAC?" y la memoria contesta el puerto ella misma, sin
recorrer nada. Compará con una guía telefónica: buscar un número leyendo la lista entera es RAM;
gritar un nombre y que la persona levante la mano es CAM.

| Campo | Descripción |
|-------|-------------|
| **Dirección MAC** | La MAC aprendida |
| **Puerto** | Por qué puerto se aprendió |
| **VLAN** | A qué VLAN pertenece ese puerto |
| **Tipo** | Dinámica, estática o permanente |
| **Edad** | Tiempo desde la última vez que se vio esa MAC |

**Qué es esta tabla.** Los cinco datos que el switch guarda de cada MAC. No es una tabla teórica: es
la que ves cuando escribís `show mac address-table` en un switch Cisco, y cada fila es un vecino
conocido. Columna por columna:

- **Dirección MAC:** el identificador de la placa. Es la clave de búsqueda.
- **Puerto:** por dónde se vio esa MAC (por ejemplo `Fa0/3`). Con este dato el switch reenvía.
- **VLAN:** el número de red lógica a la que pertenece ese puerto. **VLAN** significa *Virtual LAN*
  (red de área local virtual): una red separada dentro del mismo switch, como un edificio con
  departamentos que comparten pasillo pero no llaves. Si el switch no tiene VLANs configuradas,
  todas las entradas dicen `1`, porque la VLAN 1 existe por defecto.
- **Tipo:** cómo llegó la entrada ahí (dinámica, estática o permanente, del capítulo 4).
- **Edad:** cuánto hace que no se ve tráfico de esa MAC. Es la que se usa para borrar entradas
  viejas.

> **Dato clave del envejecimiento:** una MAC aprendida NO vive para siempre. Si pasa el *aging time* sin que esa MAC vuelva a transmitir, la entrada se borra. En Cisco el default es **300 segundos**, y cada vez que la MAC transmite, el contador se reinicia. Si el equipo se apaga o se mueve de puerto, el switch termina aprendiendo de nuevo sola.

**Por qué el envejecimiento es una virtud y no un defecto.** Un switch de una oficina ve pasar
notebooks, celulares y visitas: si guardara todo para siempre, la tabla se llenaría de fantasmas.
Con el borrado automático, la tabla tiende a reflejar la realidad de los últimos cinco minutos.
Cuando un equipo se muda de puerto, no hace falta borrar nada a mano: en cinco minutos la entrada
vieja se va sola y la nueva ya se aprendió. Y cuando un equipo está apagado, desaparece de la tabla
en vez de quedar como una promesa incumplida.

### Resumen

- El hub repite por todos los puertos; el switch aprende MACs y manda solo por donde corresponde.
- La memoria del switch se llama CAM y se busca por contenido, no por dirección.
- Cada entrada guarda MAC, puerto, VLAN, tipo y antigüedad.
- Las entradas dinámicas se borran solas a los 300 segundos sin tráfico (valor por defecto en Cisco).

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

**Qué es este bloque.** La misma trama del capítulo 5, ahora mirada desde el switch. Arriba, los
tres campos que le importan; abajo, dos flechas que salen de los campos de direcciones y van a las
dos tareas del aparato. La idea que hay que llevarse: **el origen se usa para aprender y el destino
para decidir**. Nunca al revés. Si te confundís con esto, todos los casos prácticos te van a salir
mal.

### 7.1. Fase de aprendizaje

1. El switch lee la **MAC de origen** de cada trama entrante.
2. Si la MAC **no está** en la tabla → la registra con el puerto de entrada y la VLAN.
3. Si la MAC **ya está** → refresca el temporizador de envejecimiento.
4. Si la MAC está **pero asociada a otro puerto** → actualiza la entrada (el equipo se movió de puerto físicamente).

**Qué significan esos cuatro pasos en la vida real.** El switch no pregunta nada: aprende de lo que
pasa. Cada trama que entra es una declaración "esta MAC está de este lado", y el switch la cree sin
verificar. De ahí salen dos consecuencias: la tabla se llena sola y rápido (bueno), y cualquiera
puede mentir sobre su MAC (malo, lo vemos en el capítulo 13). El paso 4 explica por qué mover un
cable no rompe nada: el switch se entera en la siguiente trama.

### 7.2. Fase de reenvío/filtrado

Con el destino en la mano, el switch elige entre cuatro caminos:

| Caso | Situación | Acción |
|:----:|-----------|--------|
| **1** | MAC destino CONOCIDA (está en la tabla) | **Forwarding:** reenvía solo por el puerto asociado. El resto de puertos NO reciben nada — eso es **filtrar**. |
| **2** | MAC destino DESCONOCIDA (no está en la tabla) | **Flooding:** inunda por todos los puertos **excepto** el de origen. |
| **3** | MAC destino = Broadcast `FF:FF:FF:FF:FF:FF` | **Broadcast:** reenvía por todos los puertos excepto el de origen (obligatorio por estándar). |
| **4** | MAC destino = Multicast | Depende de si hay suscriptores registrados. Sin IGMP snooping, se inunda como si fuera broadcast. |

**Qué es esta tabla.** Las cuatro únicas respuestas posibles del switch ante una trama. La columna
**Situación** describe qué encontró en la tabla; **Acción** dice qué hace con la trama. Vale la pena
memorizarla, porque con estas cuatro filas se resuelve cualquier ejercicio:

- **Caso 1, conocida:** entrega dirigida. El resto de los puertos ni se enteran. Eso es el
  **filtrado**, y es la razón por la que un switch mejora el rendimiento: la trama no molesta a
  quien no le corresponde.
- **Caso 2, desconocida:** **flooding** (inundación). Todos reciben una copia y cada uno decide si
  era para él. Es el precio de no saber, y dura poco.
- **Caso 3, broadcast:** la excepción obligatoria. `FF:FF:FF:FF:FF:FF` va a todos, siempre, por
  estándar. Nadie puede "filtrar" un broadcast.
- **Caso 4, multicast:** parecido al broadcast, pero con posibilidad de ahorro. **IGMP** es el
  protocolo con el que los equipos avisan que quieren recibir un grupo (*Internet Group Management
  Protocol*), y el **IGMP snooping** es la función del switch que escucha esos avisos. Sin snooping,
  el switch no sabe quién quiere el grupo y lo trata como broadcast.

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

**Qué es este bloque.** El switch escrito como receta. No es un lenguaje de programación real: es
pseudocódigo, la forma de escribir un algoritmo en castellano con estructura. Se lee de arriba
abajo y se ejecuta **por cada trama**, millones de veces por segundo.

- `PARA CADA trama recibida en puerto P y VLAN V`: el switch sabe por qué puerto entró cada trama y
  en qué VLAN; esos dos datos son los que va a guardar si aprende algo.
- `actualizar_CAM(...)`: una sola instrucción que resume los cuatro pasos del aprendizaje. Fijate
  que se ejecuta **siempre**, antes de decidir nada: aprender no depende del destino.
- `SI MAC_destino ES broadcast` y su `SINO SI` de multicast: los dos atajos que van a todos lados.
- `buscar_en_CAM(...)`: la consulta a la memoria del switch.
- `puerto_salida != P`: la condición que evita devolver la trama por donde entró.
- Los comentarios `//` explican cada rama: `Forwarding` es entrega dirigida y `Unicast flooding` es
  inundación por destino desconocido.

**Qué mirar vos en pantalla:** no vas a ver este pseudocódigo en ningún equipo, pero sí sus
efectos. Si en una captura de red ves la misma trama repetida en varios puertos, el switch está en
la rama de flooding; si la ves en uno solo, está en la rama de forwarding.

> **El caso del puerto de entrada = puerto de salida:** si la MAC destino se aprendió por el MISMO puerto por donde entró la trama, el switch la **descarta**. Eso pasa cuando dos equipos comparten un puerto (por ejemplo a través de un hub o un cable directo entre ambos): como el destino está "del otro lado" del mismo puerto, el propio receptor ya la va a escuchar — el switch no tiene que hacer nada.

### Resumen

- El switch aprende siempre del origen y decide siempre con el destino.
- Con destino conocido entrega por un solo puerto y filtra el resto; con destino desconocido inunda.
- El broadcast va a todos los puertos menos el de entrada: es obligatorio, no una falla.
- Si el destino está del mismo lado por donde entró la trama, la descarta en vez de devolverla.

---

## 8. Métodos de reenvío: latencia contra pureza

El switch puede decidir en qué momento soltar la trama. Son tres estrategias con un tradeoff clásico: **qué tan rápido** vs **qué tan limpio**.

| Método | Cómo funciona | Latencia | Filtra errores |
|--------|--------------|:--------:|:--------------:|
| **Store-and-Forward** | Recibe la trama COMPLETA, verifica el FCS y recién entonces reenvía | Alta | Sí |
| **Cut-Through** | Lee solo la MAC destino y empieza a reenviar sin esperar el resto | Baja | No |
| **Fragment-Free** | Espera los primeros 64 bytes (el mínimo) y luego reenvía | Media | Parcial |

**Qué es esta tabla.** Tres formas de hacer el mismo trabajo, ordenadas de la más cuidadosa a la más
apresurada. La columna **Latencia** dice cuánto tarda la trama en salir; **Filtra errores** dice si
el switch detecta tramas rotas antes de propagarlas.

- **Store-and-Forward:** "guardar y reenviar". Se come la trama entera y la revisa antes de soltarla.
- **Cut-Through:** "cortar y pasar". Apenas lee el destino, ya está reenviando.
- **Fragment-Free:** un punto medio. Espera los primeros 64 bytes, que es donde ocurren casi todas
  las colisiones, y de ahí en adelante reenvía sin esperar el resto.

**Qué mirar vos en pantalla:** el dato no aparece en la tabla de MACs; aparece en la hoja de datos del
switch o en su configuración. En switches administrables se puede cambiar el modo por puerto, y en
los de gama alta se mezcla solo según el estado del enlace.

### 8.1. Store-and-Forward (el estándar en empresas)

```
Llega trama → [Recibir completa] → [Verificar FCS] → [Si OK → Reenviar]
                                                    [Si error → Descartar]
```

**Qué es este bloque.** El camino de una trama en un switch store-and-forward, en cuatro pasos. El
cuarto paso se abre en dos: si la verificación da bien, la trama sale; si da mal, se descarta ahí
mismo. Es el único de los tres métodos que puede descartar, porque para verificar el FCS necesita la
trama completa (el FCS está al final).

- **Ventaja:** por la red solo circulan tramas sin errores. Nada de basura propagándose.
- **Desventaja:** latencia mayor, sobre todo con tramas grandes (tiene que tragarse 1500 bytes antes de soltar el primero).
- **Uso:** la mayoría de los switches de distribución y core.

### 8.2. Cut-Through (para mínima latencia)

```
Llega trama → [Leer MAC destino] → [Reenviar de inmediato]
```

**Qué es este bloque.** El camino corto: dos pasos y listo. El switch lee los primeros bytes, saca la
MAC destino y empieza a transmitir por el puerto de salida sin esperar el resto de la trama. La
latencia es mínima porque la trama sale mientras todavía está entrando.

- **Ventaja:** latencia mínima, en el orden de los microsegundos.
- **Desventaja:** propaga tramas corruptas (el FCS llega al final, que es justo lo que NO esperó).
- **Variantes:** *fast-forward* reenvía apenas lee el destino; *fragment-free* espera los primeros 64 bytes para descartar los fragmentos de colisión (los "runts").

> **Regla rápida:** si la red está sana y requiere velocidad extrema, cut-through. Si la red es ruidosa o los equipos son viejos, store-and-forward. La mayoría de los switches modernos traen store-and-forward por defecto — y muchos ya mezclan los métodos dinámicamente.

### Resumen

- El switch puede esperar la trama completa o reenviarla mientras la recibe; eso es el tradeoff.
- Store-and-forward verifica el FCS y descarta lo corrupto, a costa de latencia.
- Cut-through gana velocidad y pierde la capacidad de filtrar errores.
- Fragment-free espera 64 bytes: un compromiso entre los dos extremos.

---

## 9. Caso práctico paso a paso: un ping que llena la tabla

Nada de teoría sin bajar a tierra. Escenario: un switch de 4 puertos, tabla CAM vacía, y estas cuatro computadoras:

| Dispositivo | Puerto | Dirección MAC |
|:-----------:|:------:|:-------------:|
| **PC-A** | Fa0/1 | `AAAA.AAAA.AAAA` |
| **PC-B** | Fa0/2 | `BBBB.BBBB.BBBB` |
| **PC-C** | Fa0/3 | `CCCC.CCCC.CCCC` |
| **PC-D** | Fa0/4 | `DDDD.DDDD.DDDD` |

**Qué es esta tabla.** El inventario del laboratorio: qué equipo está en qué puerto y con qué MAC.
La columna **Puerto** usa la notación de Cisco (`Fa0/1` = *FastEthernet*, interfaz 1), y la columna
**Dirección MAC** usa MACs inventadas para el ejemplo, con letras repetidas para que se lean fácil.
En un switch real esas MACs serían del estilo `001a.2b3c.4d5e`.

**Qué mirar vos en pantalla:** antes de tocar nada, fijate que todos los puertos son del mismo tipo y
que las cuatro MACs son distintas. Si dos equipos tuvieran la misma MAC, el switch aprendería una y
luego la otra en otro puerto, y la red haría cosas raras sin ningún mensaje de error.

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

**Qué es este bloque.** El plano del escenario. El rectángulo del medio es el switch; las cuatro `v`
y `^` son los cables que entran por cada puerto. Arriba están A y B, abajo C y D, y cada equipo tiene
su MAC entre paréntesis. Este dibujo es el mapa que vamos a recorrer evento por evento.

**Estado inicial:** tabla CAM vacía.

### Evento 1: PC-A hace ping a PC-C

**Ping** es el comando que manda un paquete **ICMP** (*Internet Control Message Protocol*, protocolo
de mensajes de control de Internet) para preguntar "¿estás?": un *Echo Request* que espera un
*Echo Reply*. Sirve para probar si un equipo responde.

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

**Qué es este bloque.** La tabla del switch después del primer evento. Tres columnas: **Puerto** (por
dónde se vio), **MAC** (qué placa) y **Tipo** (cómo llegó ahí). Una sola fila: solo PC-A transmitió,
así que solo PC-A fue aprendida. Las otras tres placas existen, pero el switch todavía no las vio
escribir nada.

**Qué mirar vos en pantalla:** en un switch real esa tabla tiene una columna más, `Vlan`, que acá
omitimos porque todo está en la VLAN 1. Y fijate en el detalle importante: la respuesta de PC-C
*todavía no ocurrió*, así que `CCCC` no está en la tabla aunque PC-C ya recibió la trama.

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

**Qué es este bloque.** La tabla después del segundo evento: dos filas, las dos MACs que ya
hablaron. Cada fila apunta a un puerto distinto porque las dos placas están en puertos distintos.

**Qué mirar vos en pantalla:** compará el Evento 1 con el 2. En el 1 hubo una sola fila y cuatro
copias de la trama circulando; en el 2 hay dos filas y la trama salió una sola vez. Ese cambio, que
parece chiquito, es todo el negocio del switch.

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

**Qué es este bloque.** La tabla completa: cuatro equipos, cuatro puertos, cuatro MACs, todas
dinámicas. El switch conoce el mapa entero de su propia red y no le preguntó a nadie.

**Qué mirar vos en pantalla:** si esta tabla te quedó igual a la del inventario del principio, la red
está sana. Si un puerto tiene una MAC que no esperabas, tenés un equipo desconectado o alguien
moviendo cables. Y si una MAC aparece y desaparece cada pocos minutos, hay un equipo inestable.

> **La conclusión de oro del caso:** el switch solo inundó UNA vez (Evento 1). A partir de ahí, cada MAC aprendida convirtió tráfico de "gritarle a todos" en "entregar exacto". El costo del primer envío es la inundación; la recompensa es que todos los siguientes viajan derechos. Por eso una red "caliente" (con tráfico constante en los dos sentidos) es una red rápida: el switch ya conoce a todos.

### Resumen

- El switch aprende la MAC del que escribe y decide con la MAC del que recibe, trama por trama.
- La primera trama a un destino desconocido se inunda; las siguientes van directo.
- Un solo `ping` produce dos aprendizajes, porque hay ida y vuelta.
- La tabla final del ejemplo refleja el inventario exacto del laboratorio.

---

## 10. Dominios de colisión y broadcast

Acá aparecen dos conceptos que suenan parecidos y no tienen nada que ver. Uno es sobre **choques**
entre señales; el otro, sobre **alcance** de una trama. Confundirlos es el error más común al
estudiar switches, así que van por separado.

### 10.1. Dominio de colisión

Es el conjunto de equipos donde, si dos transmiten al mismo tiempo, sus señales **colisionan** y se corrompen.

| Dispositivo | Dominios de colisión |
|-------------|:--------------------:|
| **Hub** | 1 — todo el hub es un solo dominio |
| **Switch** | 1 **por puerto** — cada equipo habla sin chocar con los demás |
| **Router** | Cada interfaz es un dominio distinto |

**Qué es esta tabla.** Cuántos dominios de colisión crea cada aparato. Una colisión es lo que pasa
cuando dos equipos transmiten a la vez en el mismo cable: las dos señales se suman, se deforman y
ninguno de los dos mensajes llega bien. La columna **Dominios de colisión** cuenta cuántos espacios
independientes de choque tiene cada uno.

- **Hub:** uno solo para todo el aparato. Dos PCs que transmiten juntas chocan, esperan un tiempo
  aleatorio (*backoff*) y reintentan.
- **Switch:** uno por puerto. Cada equipo tiene su propio cable y su propio canal: no hay con quién
  chocar.
- **Router:** cada interfaz es un mundo aparte, porque el router corta el dominio en seco.

Con un hub, dos PCs que transmiten juntos colisionan (y hay backoff, esperas, retransmisiones). Con un switch, cada PC tiene el medio para sí solo — por eso los switches eliminaron el problema de colisiones en las redes modernas.

### 10.2. Dominio de broadcast

Es el conjunto de equipos que reciben una trama con destino `FF:FF:FF:FF:FF:FF`.

| Dispositivo | ¿Separa broadcast? |
|-------------|:------------------:|
| **Hub** | No |
| **Switch** | No (todos los puertos de la misma VLAN reciben el broadcast) |
| **VLAN** | Sí — cada VLAN es su propio dominio de broadcast |
| **Router** | Sí — cada interfaz, y cada VLAN a la que enruta |

**Qué es esta tabla.** Qué aparato frena un broadcast y cuál lo deja pasar. La pregunta de la
segunda columna es la más importante de todo el capítulo, porque la respuesta separa dos problemas
distintos: el de las colisiones (que el switch resolvió) y el del ruido de broadcast (que el switch
NO resuelve).

**Qué mirar vos en pantalla:** si una red tiene 500 equipos y anda lenta sin motivo aparente, la
pregunta es cuántas VLANs hay. Un switch plano con 500 equipos es un solo dominio de broadcast:
cada broadcast de cada equipo le llega a los otros 499.

```
Hub:      [Broadcast] → llega a TODOS los puertos      (además 1 solo dominio de colisión)
Switch:   [Broadcast] → llega a TODOS los puertos      (pero dominio de colisión por puerto)
VLAN:     [Broadcast] → solo a los puertos de esa VLAN
Router:   [Broadcast] → solo sale por la interfaz donde se originó
```

**Qué es este bloque.** Los cuatro aparatos comparados en una línea cada uno. Se lee así: a la
izquierda el aparato, después una trama de broadcast entrando y a la derecha hasta dónde llega. Los
paréntesis aclaran el detalle que no se ve.

**Qué mirar vos en pantalla:** las dos primeras líneas son casi iguales y ahí está la trampa. El
hub y el switch tratan igual al broadcast; lo que cambia es el dominio de colisión. Por eso decir
"el switch separa las colisiones pero no los broadcasts" es la frase que resume el capítulo.

> **La idea clave:** el switch hace invisible el problema de colisiones, pero NO el de broadcasts. Una red con 500 dispositivos en la misma VLAN significa 500 equipos recibiéndose los broadcasts de todos. Cuando eso molesta, se corta en VLANs (sección siguiente).

### Resumen

- El dominio de colisión es la zona donde dos transmisiones simultáneas se pisan; el switch lo reduce a un puerto.
- El dominio de broadcast es la zona que alcanza una trama `FF:FF:FF:FF:FF:FF`; el switch no lo reduce.
- Hubs y switches no separan broadcast; las VLANs y los routers sí.
- Una red grande en una sola VLAN es una red que se habla a los gritos.

---

## 11. VLANs: cortar un switch en pedazos lógicos

Una **VLAN** (*Virtual LAN*, red de área local virtual) convierte UN switch físico en VARIAS redes lógicas de capa 2, completamente aisladas entre sí. Los broadcasts de una VLAN jamás llegan a otra.

La analogía es el edificio de oficinas: un mismo inmueble, un mismo pasillo, pero cada empresa con
su puerta y su llave. Desde la calle el edificio es uno; adentro, los empleados de una empresa no
escuchan las conversaciones de la otra.

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

**Qué es este bloque.** Un switch plano con dos departamentos mezclados. La caja grande es el switch,
las dos columnas son las áreas y abajo está el problema: un broadcast de Ventas llega también a
Ingeniería porque no hay nada que los separe.

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

**Qué es este bloque.** El mismo switch, el mismo cableado, pero ahora cada mitad es una VLAN. La
línea de abajo muestra el resultado: cada broadcast se queda en sus dos puertos. Ningún cable cambió;
lo que cambió es la configuración.

**Qué mirar vos en pantalla:** en un switch real esto se ve en la tabla de MACs, donde la columna
`Vlan` pasa de tener todo `1` a tener `10` y `20`. Si ves dos VLANs en la tabla, hay dos redes
lógicas conviviendo en el mismo aparato.

### 11.3. Las ventajas, en la práctica

| Ventaja | Qué te da |
|---------|-----------|
| **Seguridad** | El tráfico de un departamento no se mezcla con el de otro |
| **Menos broadcast** | Cada dominio de broadcast encoge al tamaño de su VLAN |
| **Flexibilidad** | Dos equipos en la misma VLAN pueden estar en pisos distintos (mismo switch, distintos puertos — o incluso switches distintos) |
| **Gestión simple** | Reorganizar departamentos es cambiar un puerto de VLAN, no recablear |

**Qué es esta tabla.** Cuatro motivos para usar VLANs, cada uno con lo que te da en concreto. Es la
lista que conviene tener a mano cuando alguien pregunta "¿y para qué tanto lío?":

- **Seguridad:** sin VLANs, cualquiera conectado al switch ve los broadcasts de todos. Con VLANs, no.
- **Menos broadcast:** el dominio de broadcast pasa a ser del tamaño de la VLAN, no del switch.
- **Flexibilidad:** la ubicación física deja de importar. Dos personas de la misma área pueden estar
  en pisos distintos y compartir VLAN.
- **Gestión simple:** mover a alguien de área es reconfigurar un puerto, no pasar un cable nuevo.

**Qué mirar vos en pantalla:** la prueba de que las VLANs funcionan es negativa: un equipo de la
VLAN 10 no puede hacer `ping` a uno de la VLAN 20 aunque estén en el mismo switch. Si el ping
funciona, o no hay VLANs o alguien configuró un router entre ellas.

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

**Qué es este bloque.** Dos tramas comparadas. Arriba, la trama normal de siempre: MAC destino, MAC
origen, EtherType y datos. Abajo, la misma trama con un campo extra de 4 bytes metido entre la MAC
origen y el EtherType. El campo `0x8100` es el aviso de "vengo etiquetada", y adentro van el número
de VLAN (12 bits) y una prioridad (3 bits).

**Qué mirar vos en pantalla:** el número de VLAN va en 12 bits, y eso pone un techo: 4094 VLANs
útiles por dominio. Si alguien te pide "la VLAN 5000", no existe.

El estándar es **802.1Q**: inserta 4 bytes entre la MAC origen y el EtherType, y ahí va el ID de la VLAN (12 bits = hasta 4094 VLANs). El puerto que conecta los dos switches se configura como **trunk**; los puertos de los equipos se configuran como **acceso** (pertenecen a UNA VLAN, y sus tramas viajan sin etiqueta).

> **Detalle fino:** la trama etiquetada crece 4 bytes → el máximo pasa de 1518 a **1522 bytes**. Por eso a veces ves "MTU 1522" en puertos trunk.

**MTU** significa *Maximum Transmission Unit* (unidad máxima de transmisión): el tamaño máximo de
unidad de datos que un enlace acepta. Un trunk necesita 4 bytes más porque lleva la etiqueta.

### Resumen

- Una VLAN es una red de capa 2 separada dentro del mismo switch: los broadcasts no la cruzan.
- Sirve para seguridad, para achicar el dominio de broadcast y para mover gente sin recablear.
- Entre switches, las VLANs viajan por un trunk que etiqueta cada trama con el estándar 802.1Q.
- Los puertos de los equipos son de acceso (sin etiqueta); los de switch a switch, trunks (etiquetados).

---

## 12. STP: cuando la redundancia arma bucles

En redes serias no hay un solo camino entre switches: se tienden **enlaces redundantes** para que, si uno falla, el tráfico siga vivo. Pero la redundancia trae un monstruo: los **bucles de capa 2**.

La analogía es una red de calles con el mismo barrio dibujado dos veces en el mapa: si el cartero no
sabe cuál camino tomar, puede quedar dando vueltas para siempre. Y en una red, esa vuelta no cansa a
nadie: se reproduce y crece.

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

**Qué es este bloque.** Tres switches en triángulo: A arriba, B y C abajo, y un enlace entre B y C.
Ese triángulo es la redundancia (si un enlace se corta, queda camino) y, al mismo tiempo, el
problema: hay un círculo cerrado por donde una trama puede girar sin parar.

Un broadcast sale de A. B lo reenvía, C lo reenvía, y vuelve a A... que lo reenvía de nuevo. La trama da vueltas infinitamente, multiplicándose y saturando la red — **tormenta de broadcast**. Y mientras tanto, las tablas CAM se llenan de entradas que cambian de puerto a cada instante (flap), empeorando todo.

**Por qué una trama no se cansa.** La trama Ethernet no tiene contador de saltos como el paquete IP
(que lleva **TTL**, *Time To Live*: un número que baja en cada router y al llegar a cero descarta el
paquete). En capa 2 no hay nada de eso: una trama que encuentra un círculo gira para siempre, y cada
vuelta genera copias. En segundos, el enlace queda saturado al 100% y la red se cae entera.

### 12.2. La solución: Spanning Tree Protocol

**STP** (IEEE 802.1D) construye un **árbol** lógico sobre el mapa físico: elige una **raíz** (root bridge) y **bloquea** los puertos redundantes para que NO exista ningún bucle. Los enlaces bloqueados quedan como repuestos: si el camino activo falla, STP recalcula y desbloquea.

**Spanning Tree** significa "árbol de expansión": un árbol, en el sentido matemático, no tiene
círculos. STP mira el mapa físico con triángulos y lo convierte en un árbol lógico apagando los
enlaces que sobran.

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

**Qué es este bloque.** El mismo triángulo, ahora con roles asignados. A quedó como raíz (RB) y el
enlace entre B y C quedó bloqueado (BLK) en las dos puntas. Las siglas son las que vas a ver en
`show spanning-tree`: **RP** es el puerto que mira hacia la raíz, **DP** es el puerto que da servicio
hacia abajo y **BLK** es el que está apagado esperando su turno.

**Qué mirar vos en pantalla:** si un puerto aparece en estado `BLK` o `blocking`, no está roto: está
haciendo su trabajo. Y fijate que los enlaces bloqueados siguen recibiendo BPDUs (los mensajes de
control de STP), aunque no pasen datos de usuarios.

**BPDU** significa *Bridge Protocol Data Unit* (unidad de datos del protocolo de puentes): el mensaje
con el que los switches se cuentan quién es la raíz y cómo está la topología. Los switches se comunican con **BPDUs** y cada puerto pasa por estados:

| Estado | Duración típica | Comportamiento |
|--------|:---------------:|----------------|
| **Blocking** | ~20 s | No reenvía tramas; solo escucha BPDUs |
| **Listening** | ~15 s | No reenvía; participa en la elección de puertos |
| **Learning** | ~15 s | No reenvía, pero aprende direcciones MAC |
| **Forwarding** | — | Reenvía tramas normalmente |
| **Disabled** | — | Puerto apagado administrativamente |

**Qué es esta tabla.** Los cinco estados por los que pasa un puerto de switch cuando arranca o cuando
la topología cambia. La columna **Duración típica** es cuánto se queda en cada uno (con STP clásico) y
**Comportamiento** dice qué hace mientras está ahí.

- **Blocking:** no pasa datos, solo escucha. Es el estado de los puertos de repuesto.
- **Listening:** ya participa de la elección, pero todavía no aprende ni reenvía.
- **Learning:** aprende MACs para no tener que inundar todo cuando empiece a reenviar.
- **Forwarding:** el estado normal, el único en el que el puerto pasa tramas.
- **Disabled:** apagado a mano por el administrador.

**Qué mirar vos en pantalla:** si ves un puerto en `listening` o `learning` durante más de un minuto,
algo está recalculando. Y si ves un puerto que sube y baja de estado todo el tiempo, hay un bucle o
un cable malo: el puerto "flapea" y STP nunca termina de converger.

> **Dato clave:** STP clásico tarda ~30–50 segundos en converger (de blocking a forwarding). En redes modernas se usa **RSTP** (*Rapid Spanning Tree*, IEEE 802.1w), que converge en **3–6 segundos** — el mismo concepto, pero con negociación activa en vez de temporizadores a ciegas.

**Converger** significa que todos los switches llegaron a un acuerdo sobre la topología y los puertos
quedaron en su estado definitivo. Mientras no converge, la red está en transición: unos puertos
todavía bloqueados, otros ya reenviando.

### Resumen

- Dos switches con dos caminos entre ellos arman un círculo, y en capa 2 un círculo significa tormenta de broadcast.
- STP elige una raíz y bloquea los enlaces sobrantes para que la topología sea un árbol.
- Los puertos pasan por blocking, listening, learning y forwarding antes de pasar tráfico.
- RSTP hace lo mismo que STP pero converge en segundos en vez de en casi un minuto.

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

**Qué es esta tabla.** Cinco ataques de capa 2, qué logra cada uno y con qué se frena. La primera
columna nombra el ataque; **Qué hace** describe el mecanismo; **Mitigación** dice qué configuración
lo detiene. Léela como un mapa de amenazas, no como una receta:

- **MAC Flooding:** llenar la tabla hasta que el switch no tenga dónde guardar y empiece a inundar
  todo. Resultado: el switch se vuelve un hub y el atacante puede escuchar. **Port Security** lo
  frena limitando cuántas MAC se aceptan por puerto.
- **MAC Spoofing:** hacerse pasar por otro. Port Security con MAC fija o **802.1X** (el estándar de
  autenticación de puerto: el equipo tiene que identificarse antes de que el puerto lo deje pasar).
- **ARP Spoofing:** responder "yo soy el gateway" con una MAC propia, para que todos le manden el
  tráfico. **DAI** (*Dynamic ARP Inspection*) revisa cada respuesta ARP contra una tabla confiable y
  descarta las falsas; **DHCP Snooping** es lo que construye esa tabla de confianza.
- **VLAN Hopping:** pasar de una VLAN a otra aprovechando un trunk mal configurado. Se frena
  desactivando **DTP** (*Dynamic Trunking Protocol*, el protocolo que negocia trunks automáticamente),
  cambiando la VLAN nativa y sacando la VLAN 1 del medio.
- **STP Attack:** meterse como raíz de la topología. **BPDU Guard** apaga el puerto si ve un BPDU
  donde no corresponde; Root Guard impide que un vecino se convierta en raíz.

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

**Qué es este bloque.** Seis líneas de configuración de un switch Cisco, en orden. La primera entra
al puerto; las otras cinco lo configuran. Cada línea se explica en la tabla de abajo, pero el orden
importa: primero el modo, después la función y recién ahí los límites.

| Parámetro | Qué hace |
|-----------|----------|
| `maximum` | Máximo de MACs permitidas en el puerto (default: 1) |
| `mac-address sticky` | Aprende automáticamente las primeras MAC vistas y las vuelve estáticas |
| `violation` | Acción ante una MAC ilegítima: `protect` (descarta), `restrict` (descarta y registra), `shutdown` (apaga el puerto — el más común) |

**Qué es esta tabla.** Tres parámetros de Port Security y qué hace cada uno. El primero pone el
límite, el segundo decide cómo se guardan las MACs permitidas y el tercero decide qué pasa cuando
llega una que no corresponde.

- `maximum`: cuántas MACs distintas tolera el puerto. Con 1, el puerto acepta un solo equipo; con 2,
  tolera un switch o un access point colgado ahí.
- `mac-address sticky`: hace que el switch aprenda la primera MAC que ve y la escriba como si fuera
  estática. Práctico para no tipear 48 bits a mano.
- `violation`: el castigo. `protect` descarta en silencio, `restrict` descarta y cuenta, `shutdown`
  apaga el puerto hasta que alguien lo reactive.

**Qué mirar vos en pantalla:** en la línea de comandos, `Switch(config)#` es modo de configuración
global y `Switch(config-if)#` es modo de configuración de interfaz. Si escribís un comando de
interfaz en el modo global, el switch te lo rechaza: es el error más común cuando recién empezás.

### 13.2. BPDU Guard: nadie toca la raíz

Protege los puertos de acceso: si llega un BPDU (señal de otro switch intentando armar STP), el puerto pasa a estado *errdisable*:

```
Switch(config-if)# spanning-tree bpduguard enable
```

**Qué es este bloque.** Una sola línea, aplicada sobre un puerto de acceso. Activa BPDU Guard: si por
esa boca entra un BPDU, el switch apaga el puerto automáticamente.

**Qué mirar vos en pantalla:** el puerto queda en estado `err-disabled` y hay que reactivarlo a mano
(`shutdown` y después `no shutdown`). Si un usuario dice "se me cortó la red y no vuelve", revisá si
colgó un switch o un router casero en la boca de la pared: BPDU Guard hizo su trabajo.

### Resumen

- La capa 2 asume buena fe: quien se conecta puede inundar, falsificar o cambiar la topología.
- Port Security limita cuántas MACs acepta un puerto y qué hace con las demás.
- DAI y DHCP Snooping defienden del ARP Spoofing; BPDU Guard defiende de los ataques a STP.
- Desactivar la negociación automática de trunks evita el VLAN Hopping.

---

## 14. Comandos de referencia (Cisco IOS)

Esta sección es la caja de herramientas: qué escribir para ver y para tocar. Todo es de switches
Cisco, que es lo que vas a encontrar en laboratorios y en la mayoría de las empresas.

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

**Qué es esta tabla.** Doce comandos de consulta. La primera columna es lo que escribís; la segunda,
qué te devuelve. Todos empiezan con `show`, que en IOS significa "mostrame". Los lugares entre
llaves (`{id}`, `{mac}`, `{int}`) son huecos que reemplazás por un valor real: `vlan 10`,
`address 001a.2b3c.4d5e`, `interfaces fa0/1`.

**Qué mirar vos en pantalla:** los primeros seis son variantes de la misma tabla: completa, por tipo,
por VLAN, por MAC puntual y contada. Los dos de `interfaces` te dicen si el puerto está arriba y con
qué MAC. Los de `port-security` y `spanning-tree` son la parte defensiva. Y `show ip arp` no es del
switch como switch: es la tabla ARP de su propia CPU, útil para ver si el equipo ve a sus vecinos.

### 14.2. Administración

| Comando | Qué hace |
|---------|----------|
| `clear mac address-table dynamic` | Borra todas las entradas dinámicas |
| `clear mac address-table dynamic interface {int}` | Borra las de una interfaz |
| `clear mac address-table dynamic address {mac}` | Borra una MAC puntual |
| `clear port-security sticky` | Borra las MACs sticky |

**Qué es esta tabla.** Cuatro comandos que **borran**, no que muestran. `clear` en IOS significa
"vaciar". Son los que se usan para probar: limpiás la tabla, mandás un paquete y mirás qué aprendió.

**Qué mirar vos en pantalla:** después de un `clear`, la tabla se llena sola en segundos si hay
tráfico. Ojo con el tercero: borra una MAC puntual, no toda la tabla. Y el cuarto borra las MACs
sticky de Port Security, o sea que el puerto vuelve a aprender las primeras que vea.

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

**Qué es este bloque.** Una sesión real de un switch: dos comandos y su respuesta. Vale la pena
leerlo renglón por renglón, porque es exactamente lo que vas a ver la primera vez que te conectes:

- `Switch> enable`: el *prompt* con `>` indica modo usuario (solo consultas básicas). `enable` sube a
  modo privilegiado.
- `Switch# show mac address-table`: el `#` confirma que ya estás en privilegiado. El comando pide la
  tabla de MACs.
- `Mac Address Table`: el título del reporte.
- La línea de guiones: separador, no es dato.
- `Vlan Mac Address Type Ports`: los títulos de las cuatro columnas.
- `---- ----------- -------- -----`: el subrayado de los títulos.
- `1    001a.2b3c.4d5e    DYNAMIC     Fa0/1`: la primera entrada. VLAN 1, MAC `001a.2b3c.4d5e`
  (formato Cisco), tipo `DYNAMIC` y puerto `Fa0/1`. Ese equipo está en el primer puerto y su prefijo
  `001a.2b` es de un fabricante de los de la tabla del capítulo 3.
- `1    0050.56c0.0001    DYNAMIC     Fa0/2`: otra entrada, en el segundo puerto. El prefijo
  `0050.56` es de VMware: es una máquina virtual.
- `1    aaaa.bbbb.cccc    DYNAMIC     Fa0/3`: la tercera, con una MAC que parece inventada a
  propósito (las `a` y `b` repetidas).
- `Switch#`: el prompt vuelve, listo para el próximo comando.

Fijate la columna `Vlan`: si TODOS los puertos muestran VLAN 1, es que el switch está "pelado", sin VLANs definidas (la VLAN 1 existe por defecto). Eso es normal en una red recién armada.

**Qué mirar vos en pantalla:** contá filas y compará con los equipos conectados. Tres filas y cuatro
puertos conectados significa que uno de los equipos no transmitió nada todavía (o el puerto está
abajo). Y si aparece una MAC que no es de nadie conocido, tenés un intruso o un equipo de prueba
olvidado.

### Resumen

- `show` para ver, `clear` para vaciar: esos son los dos verbos que necesitás.
- La tabla de MACs se lee en cuatro columnas: VLAN, MAC, tipo y puertos.
- Todos los puertos en VLAN 1 es lo normal en un switch sin configurar.
- Un prefijo conocido en la tabla te dice qué tipo de dispositivo es cada entrada.

---

## 15. Ejercicios prácticos

Cinco ejercicios en orden de dificultad. Tratá de resolverlos antes de leer la respuesta: pensarlos
cuesta dos minutos y te queda para siempre; leer la solución cuesta diez segundos y se olvida
mañana.

### Ejercicio 1: ¿Inunda o filtra?

Usando el escenario del caso práctico (PCs A, B, C, D con MACs `AAAA`, `BBBB`, `CCCC`, `DDDD`), partís de la tabla que quedó en el Evento 2 (`AAAA` en Fa0/1 y `CCCC` en Fa0/3). Ahora ocurren estas transmisiones:

| Transmisión | Origen | Destino |
|:-----------:|:------:|:-------:|
| **X** | PC-B (`BBBB`) | PC-A (`AAAA`) |
| **Y** | PC-D (`DDDD`) | PC-C (`CCCC`) |
| **Z** | PC-A (`AAAA`) | PC-B (`BBBB`) |

**Qué es esta tabla.** Tres transmisiones marcadas con letra, con quién manda y a quién le manda.
La columna **Origen** siempre trae una MAC que el switch quizás no conoce todavía; **Destino** trae
una que puede estar o no en la tabla. Ese contraste es el ejercicio entero.

**Preguntas:**

1. Dibujá la tabla MAC final después de la transmisión Z.
2. Durante la transmisión X, ¿qué puertos recibieron la trama? ¿Hubo flooding?
3. ¿Por qué la transmisión Y no genera flooding?

#### Ver respuestas

**1 — Tabla final (después de Z):**

| Puerto | MAC | Tipo |
|:------:|:---:|:----:|
| Fa0/1 | `AAAA.AAAA.AAAA` | Dinámico |
| Fa0/2 | `BBBB.BBBB.BBBB` | Dinámico |
| Fa0/3 | `CCCC.CCCC.CCCC` | Dinámico |
| Fa0/4 | `DDDD.DDDD.DDDD` | Dinámico |

**2 — Transmisión X:** `AAAA` ya está en la tabla (Evento 1) → el switch reenvía **solo por Fa0/1**. Los demás puertos NO reciben la trama. **No hay flooding**, y además se aprende `BBBB` en Fa0/2.

**3 — Transmisión Y:** el destino `CCCC` ya está aprendido (Evento 2) → envío directo por Fa0/3. Se aprende `DDDD` en Fa0/4. Sin flooding.

**Cómo se lee la tabla de la respuesta 1.** Cuatro filas, una por equipo, con las cuatro MACs en
orden de puerto. Es la misma tabla que quedó al final del capítulo 9: después de las tres
transmisiones, todos los equipos hablaron al menos una vez, así que todos están aprendidos.

### Ejercicio 2: tabla vacía de cero

Un switch tiene la CAM completamente vacía y ocurren, en orden: (1) PC-1 manda una trama a PC-2; (2) PC-3 manda una trama a PC-1; (3) PC-2 manda una trama a PC-3.

**Preguntas:**

1. ¿Cuántas tramas físicas genera la transmisión 1 (contando las réplicas que hace el switch)?
2. ¿En qué transmisión el switch empieza a FILTRAR en vez de inundar?
3. ¿Cuántas entradas hay en la CAM después de la transmisión 3?

#### Ver respuestas

1. La tabla está vacía y el destino no se conoce → **inundación** por todos los puertos excepto el de origen. Con 4 puertos activos: la trama original + 3 réplicas = 4 copias físicas circulando.
2. En la **transmisión 2**: PC-1 ya está en la tabla (aprendida en la 1), así que el envío a PC-1 sale directo. (PC-3 causará una inundación en esa misma transmisión porque todavía no se conoce... y recién ahí se aprende.)
3. Después de la 3 hay **3 entradas**: PC-1, PC-2 y PC-3. Faltaría PC-4, que nunca transmitió.

**El detalle fino de la respuesta 2.** En una misma transmisión pueden pasar las dos cosas: el switch
filtra hacia el destino conocido e inunda hacia el desconocido. No es una elección global del
aparato, es una decisión por trama y por destino.

### Ejercicio 3: el ping que deja DOS MAC

En Packet Tracer, conectá 3 PCs a un switch 2960 (Fa0/1, Fa0/2, Fa0/3). Limpiá la tabla y lanzá UN solo ping desde PC1 a PC2:

```
Switch# clear mac address-table dynamic
PC1> ping 192.168.1.2
Switch# show mac address-table
```

**Qué es este bloque.** Tres comandos de una sesión de laboratorio. `clear` vacía la tabla para
empezar limpio; `ping` desde la PC 1 a la IP de la PC 2; `show` para ver qué quedó. El `>` del
segundo renglón significa que ese comando se escribe en la PC, no en el switch. **Packet Tracer** es
el simulador de redes de Cisco, y el **2960** es uno de sus switches de práctica.

**Pregunta de ingeniería:** ejecutaste UN comando `ping`, ¿por qué aparecen DOS direcciones MAC nuevas en la tabla?

#### Ver respuesta

El `ping` es un diálogo de dos pasos:

1. PC1 envía un **Echo Request** (ICMP) hacia PC2 → el switch aprende la MAC de PC1.
2. PC2 recibe la petición y responde con un **Echo Reply** hacia PC1 → el switch aprende la MAC de PC2.

El comando `ping` que escribiste dispara UNA petición, pero el protocolo ICMP implica **ida y vuelta**: dos tramas en direcciones opuestas cruzan el switch, y cada una enseña el origen que trae. Por eso la tabla queda con las dos MAC.

### Ejercicio 4: VLANs para una empresa

Diseñá un switch para una empresa con dos áreas que deben quedar aisladas en capa 2:

| Área | Dispositivos |
|:----:|:------------:|
| **RRHH** | 2 PCs + 1 impresora |
| **IT** | 3 PCs + 1 servidor |

**Qué es esta tabla.** El requerimiento del cliente, en dos filas. La primera columna es el área
(RRHH es Recursos Humanos; IT es Tecnología) y la segunda, cuántos equipos hay que conectar en cada
una. Sumando: siete equipos en total.

**Tareas:**

1. Asigná una VLAN a cada área.
2. Asigná los puertos del switch.
3. ¿Qué se necesita para que las dos áreas puedan comunicarse?

#### Ver respuesta

1. **VLAN 10 — RRHH** y **VLAN 20 — IT** (los números son libres; lo importante es que sean distintas).
2. **VLAN 10:** Fa0/1, Fa0/2, Fa0/3 (PC RRHH 1, PC RRHH 2, impresora). **VLAN 20:** Fa0/4, Fa0/5, Fa0/6, Fa0/7 (PCs IT 1-3 y servidor).
3. Las VLANs están aisladas en capa 2: un broadcast de RRHH jamás llega a IT. Para que se comuniquen hace falta **un dispositivo de capa 3** — un router (con subinterfaces, *router-on-a-stick*) o un switch multicapa con SVIs — que haga el enrutamiento inter-VLAN.

**Dos palabras de la respuesta 3.** *Router-on-a-stick* ("router en un palito") es el router que
atiende varias VLAN con una sola cable, usando una subinterfaz por VLAN. **SVI** significa
*Switch Virtual Interface* (interfaz virtual del switch): una interfaz lógica que representa a la VLAN
entera y que puede tener IP, convirtiendo al switch en un equipo de capa 3.

### Ejercicio 5: leer una MAC como un profesional

Dada la MAC `F8:32:E4:12:AB:CD`:

1. ¿Cuál es el OUI?
2. ¿Es unicast o multicast? ¿Cómo lo sabés?
3. ¿Es universal (de fábrica) o administrada localmente?

#### Ver respuesta

1. **OUI = `F8:32:E4`** (Samsung). El resto (`12:AB:CD`) es el identificador del dispositivo.
2. **Unicast.** El bit I/G es el bit 0 (el último) del primer byte. `F8` en binario es `1111 1000` → el bit 0 vale `0` → individual, unicast.
3. **Universal.** El bit U/L es el bit 1 (el penúltimo) del primer byte. En `F8 = 1111 1000`, el bit 1 vale `0` → asignada por el fabricante (UAA). Es la MAC normal de fábrica: unicast + universal.

> **Truco para hacerlo de cabeza:** el primer byte es `F8`. Los bits 0 y 1 (los dos últimos del binario) son `00` → unicast + universal. Si el primer byte terminara en 1 (impar, como `01`) → multicast. Este tipo de ejercicio aparece siempre en las certificaciones.

### Resumen

- Inundar o filtrar depende de una sola cosa: si el destino está en la tabla o no.
- Cada trama enseña el origen que trae, y por eso un `ping` deja dos MACs.
- Las VLANs se diseñan asignando números y puertos; para unirlas hace falta capa 3.
- Leer una MAC es mirar el primer byte en binario y consultar el prefijo del fabricante.

---

## 16. Comprobá lo que aprendiste

Respondé antes de destapar.

**1. ¿Cuántos bits tiene una MAC y en qué capa trabaja?**

#### Ver respuesta

**48 bits (6 bytes).** Trabaja en la capa 2 (enlace de datos) del modelo OSI: identifica la interfaz dentro del segmento local.

**2. ¿Qué diferencia hay entre la IP y la MAC?**

#### Ver respuesta

La IP es **lógica y puede cambiar** (la asigna DHCP o un administrador, y sirve para enrutar entre redes). La MAC es **física y de fábrica** (grabada en la placa, identifica el dispositivo dentro del segmento). Analogía: la IP es la patente, la MAC es el número de chasis.

**3. Una MAC termina en `FF:FF:FF:FF:FF:FF`. ¿Qué es?**

#### Ver respuesta

Es el **broadcast**: todos los bits en 1. Cualquier trama con ese destino es recibida por TODOS los dispositivos del segmento, y el switch la reenvía por todos los puertos excepto el de origen.

**4. Un switch recibe una trama con destino desconocido. ¿Qué hace y por qué?**

#### Ver respuesta

**Inunda** por todos los puertos menos el de origen. No sabe dónde vive el destino, así que la única forma de que llegue es copiarla a todos lados. Apenas el destinatario responda, su MAC entra en la tabla y las siguientes entregas serán directas.

**5. ¿En qué se diferencia el flooding del filtrado?**

#### Ver respuesta

**Flooding** = reenviar por todos los puertos menos el de origen (destino desconocido). **Filtrado** = reenviar SOLO por el puerto asociado al destino (destino conocido), ocultando la trama al resto.

**6. Una trama llega al switch por el mismo puerto por donde estaría el destino. ¿Qué pasa?**

#### Ver respuesta

El switch la **descarta**. Si el destino está "del otro lado" del mismo puerto (por ejemplo detrás de un hub), el receptor ya va a escuchar la trama directamente; reenviarla por el mismo puerto sería un loop inútil.

**7. ¿Qué hace STP y en qué se diferencia de RSTP?**

#### Ver respuesta

STP detecta bucles de capa 2 (enlaces redundantes) y **bloquea** los puertos sobrantes para formar un árbol sin loops, evitando tormentas de broadcast. RSTP es la versión rápida: converge en segundos en vez de ~30–50 s.

**8. Nombrá DOS ataques de capa 2 y su mitigación.**

#### Ver respuesta

**MAC Flooding** → Port Security (limitar MAC por puerto). **ARP Spoofing** → DAI (Dynamic ARP Inspection) + DHCP Snooping. (También valen: MAC Spoofing → Port Security fija, VLAN Hopping → deshabilitar DTP/tunking automático, STP Attack → BPDU Guard.)

### Resumen

- Las ocho respuestas son las ocho ideas que hay que poder explicar sin apuntes.
- La MAC identifica la placa; la IP ubica el equipo en una red.
- El switch aprende del origen y decide con el destino; inunda solo cuando no sabe.
- Las defensas de capa 2 se construyen con Port Security, inspección de ARP y control de BPDUs.

---

## 17. Glosario

Todos los términos del manual en una sola tabla. Está pensada para volver: cuando en el capítulo 12
aparezca una palabra que ya no te acordás, vení acá.

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

**Cómo leer esta tabla.** Dos columnas: el **Término** en negrita y **Qué es** en una línea. La
segunda columna está escrita para leerse sola, sin el resto del manual, así que sirve de chuleta
cuando estás apurado.

**Qué mirar vos en pantalla:** si estás diagnosticando algo, buscá en la tabla la palabra que
aparece en el mensaje de error o en la salida del comando. Las cinco filas que resuelven el 80% de
los casos son **Tabla CAM**, **Aging time**, **Flooding**, **Filtrado** y **Dominio de broadcast**.

### Resumen

- El glosario es la versión de bolsillo del manual: término y definición en una línea.
- Sirve para consultar durante un diagnóstico, no para leer de corrido.
- Las filas de tabla CAM, flooding y filtrado resumen el mecanismo completo del switch.

---

## 18. Resumen en 10 puntos

Diez frases para llevarte. Si tuvieras que explicar todo esto en cinco minutos, estas son las que
dirías, en este orden.

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

**Cómo leer esta lista.** Los puntos 1 a 5 son las piezas: la dirección, su anatomía, sus bits, el
sobre y el traductor. Los puntos 6 a 9 son el comportamiento del switch y sus límites. El punto 10
es la parte que casi nunca se enseña y siempre se sufre: la capa 2 es atacable porque fue diseñada
confiando en que todos se portan bien.

> **Fuente:** Documentación propia basada en estándares IEEE 802.3 y 802.1Q, documentación Cisco CCNA y material educativo de redes.

### Resumen

- Diez puntos: cinco de piezas, cuatro de comportamiento y uno de seguridad.
- Si te llevás una sola idea, que sea esta: el switch decide con la MAC de destino y aprende con la de origen.
- Si te llevás dos, agregá esta: la MAC identifica la placa antes de que exista ningún router, y por eso puede entregar dentro de la red sin ayuda de nadie.

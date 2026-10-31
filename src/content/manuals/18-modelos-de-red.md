# 18. Modelos de Red

---

## Índice

- [El problema que resuelven los modelos](#1-el-problema-que-resuelven-los-modelos)
- [Qué es un modelo de capas](#2-qué-es-un-modelo-de-capas)
- [El modelo OSI: las 7 capas](#3-el-modelo-osi-las-7-capas)
- [El modelo TCP/IP: las 4 capas](#4-el-modelo-tcpip-las-4-capas)
- [OSI vs TCP/IP: la comparación honesta](#5-osi-vs-tcpip-la-comparación-honesta)
- [La capa de Aplicación](#6-la-capa-de-aplicación)
- [La capa de Transporte: TCP y UDP](#7-la-capa-de-transporte-tcp-y-udp)
- [La capa de Internet](#8-la-capa-de-internet)
- [La capa de Acceso a Red](#9-la-capa-de-acceso-a-red)
- [La encapsulación: las muñecas rusas](#10-la-encapsulación-las-muñecas-rusas)
- [El viaje completo de un paquete](#11-el-viaje-completo-de-un-paquete)
- [Cómo resolver problemas por capas](#12-cómo-resolver-problemas-por-capas)
- [Herramientas que ven las capas](#13-herramientas-que-ven-las-capas)
- [Comprobá lo que aprendiste](#14-comprobá-lo-que-aprendiste)
- [Glosario](#15-glosario)
- [Resumen en 10 puntos](#16-resumen-en-10-puntos)

---

## 1. El problema que resuelven los modelos

### 1.1. La torre de Babel de las redes

Imaginá el año 1980. Cada fabricante de computadoras tenía su propia forma de conectar sus equipos: sus propios cables, sus propias señales, su propio "idioma". La máquina de la empresa A no podía hablar con la de la empresa B, y si lo hacía, era a los gritos y con acento — cuando no se rompía en el intento.

Conectar computadoras entre sí no es un problema de un solo paso. Es una cadena larguísima de decisiones:

- ¿Cómo se representa un 1 y un 0 en el cable?
- ¿Cómo sé que ese grupo de bits viene de tu máquina y no de otra?
- ¿Cómo hago para que mi mensaje atraviese diez redes distintas y llegue a la máquina correcta?
- ¿Cómo me doy cuenta si un dato se perdió en el camino y lo pido de nuevo?
- ¿Y si quiero que dos programas distintos usen la red a la vez?

Si cada fabricante resolvía todo eso a su manera, teníamos la torre de Babel: **nadie se entendía con nadie**.

> **Idea central de este manual:** los modelos de red son el **acuerdo de cómo se habla**. Dividen la comunicación en **capas**, y a cada capa le asignan una responsabilidad clara. Cuando todos respetan el mismo acuerdo, cualquier equipo puede hablar con cualquier otro — aunque lo fabriquen empresas distintas y a miles de kilómetros.

### 1.2. La metáfora que vas a usar toda la vida: las muñecas rusas

Guardá esta imagen porque aparece en TODO el manual:

> **Una comunicación de red es como una muñeca rusa (matrioshka): un sobre dentro de otro sobre, dentro de otro sobre. Cada capa envuelve los datos con su propio sobre y le escribe información útil en la tapa. Quien recibe, abre los sobres en orden inverso.**

El dato que querés mandar (un correo, una foto, esta página que estás leyendo) es el contenido de la muñeca más chica. Y alrededor se van armando capas: en cada paso, se envuelve todo lo anterior y se le agregan instrucciones de viaje.

Al final del manual vas a ver el video completo de cómo se arma y se desarma esa muñeca — y por qué ese proceso se llama **encapsulación**.

### 1.3. Qué vas a aprender acá

- Por qué las redes se piensan en capas.
- El modelo **OSI** (7 capas): el que se usa para *entender*.
- El modelo **TCP/IP** (4 capas): el que *realmente funciona* en internet.
- El proceso de **encapsulación**: los sobres dentro de sobres.
- El **viaje completo de un paquete**, capa por capa, desde tu PC hasta un servidor.
- Cómo usar las capas para **encontrar fallas** cuando algo no funciona.

---

## 2. Qué es un modelo de capas

### 2.1. La idea: dividir para gobernar

Ningún problema complejo se resuelve de una sola pieza. Pensá en una carta que viaja por el correo: hay muchísimos pasos — escribirla, ponerle el sobre, pegar la estampilla, llevarla a la sucursal, clasificarla, transportarla, repartirla en el destino. Si lo pensás como "un solo proceso gigante", es imposible de organizar. Si lo dividís en etapas con responsables claros, cualquier empleado nuevo aprende su parte en un día.

Las redes hacen exactamente eso: **dividen la comunicación en capas**. Cada capa:

- Tiene **una sola responsabilidad** (y esas responsabilidades no se mezclan).
- Le presta un servicio a la capa de arriba ("pasame esto ya listo").
- Usa los servicios de la capa de abajo ("esto me lo entrega el transporte").
- Solo se comunica, en el otro extremo, con su **capa gemela** (su *par* o *peer*).

### 2.2. Las reglas del juego

Imaginate cuatro equipos en una empresa: el que recibe pedidos, el que prepara cajas, el que pega etiquetas y el que las lleva al camión.

- El que recibe pedidos **no necesita saber** qué camión va a llevar la caja. Solo entrega el pedido al siguiente equipo.
- El que prepara cajas **no lee** el pedido: solo lo guarda y lo envuelve.
- Si una caja se daña en el viaje, el que la preparó se entera y la rearma — sin molestar a los otros tres equipos.

Eso es un modelo de capas: **cada piso del edificio hace su trabajo y le pasa el resultado al piso de al lado**. Si algo falla, se arregla en el piso donde falló, sin tirar el edificio entero.

### 2.3. Qué ganás con las capas

| Lo que ganás | Qué significa en la práctica |
|---|---|
| **Estandarización** | Todos los fabricantes siguen las mismas reglas; sus equipos no necesitan "conocerse" para entenderse |
| **Interoperabilidad** | Un cable de marca A, un switch de marca B y una PC de marca C funcionan juntos sin drama |
| **Solución de problemas** | Si algo falla, se aísla el piso del edificio donde está el problema en vez de revisar todo |
| **Evolución independiente** | Se puede cambiar el Wi-Fi (capa 1) sin tocar el HTTP (capa de aplicación): cada piso se renueva aparte |
| **Vocabulario común** | "Es un problema de capa 3" se entiende igual en Buenos Aires, Tokio o Berlín |

### 2.4. Una regla de oro antes de seguir

> **Regla de oro:** cada capa agrega **información de control propia** (el "sobre" con instrucciones de viaje) sin modificar el contenido que le pasaron de arriba. Cuando el dato llega al destino, cada capa lee su propio sobre, lo retira y le pasa el interior a la capa de arriba.

Recordala. Es la base de TODO lo que viene: el dato original viaja intacto, y cada capa sabe exactamente cuál sobre es suyo.

---

## 3. El modelo OSI: las 7 capas

### 3.1. Qué es el modelo OSI

**OSI** significa *Open Systems Interconnection* (interconexión de sistemas abiertos). Fue desarrollado por la **ISO** (Organización Internacional de Normalización) y publicado en 1984. Su objetivo era ambicioso: definir el **estándar universal** de la comunicación entre equipos de cualquier fabricante.

En la práctica, el modelo OSI no se implementó tal cual (llegó tarde y "perfecto, pero teórico"), pero se volvió **la herramienta educativa y de diagnóstico más importante de las redes**. Todavía hoy, decir "problema de capa 2" o "capa 7" es la forma universal de ubicar una falla.

### 3.2. La pila de 7 capas

De arriba hacia abajo (la que ve el usuario) hacia abajo (el cable):

```
                      MODELO OSI
    ┌─────────────────────────────────┐
    │ 7. APLICACIÓN    Lo que ves     │   El navegador, el correo, el chat
    ├─────────────────────────────────┤
    │ 6. PRESENTACIÓN  La forma       │   Traduce, cifra, comprime los datos
    ├─────────────────────────────────┤
    │ 5. SESIÓN        El diálogo     │   Abre y cierra la conversación
    ├─────────────────────────────────┤
    │ 4. TRANSPORTE    La garantía     │   TCP/UDP: entrega, orden, errores
    ├─────────────────────────────────┤
    │ 3. RED           El camino       │   IP: direcciones y rutas
    ├─────────────────────────────────┤
    │ 2. ENLACE        El vecino       │   Ethernet: tramas, MAC
    ├─────────────────────────────────┤
    │ 1. FÍSICA        El cable        │   Bits, voltajes, ondas
    └─────────────────────────────────┘
```

Podés memorizarlas con esta frase (de arriba hacia abajo):

> **A**plicación, **P**resentación, **S**esión, **T**ransporte, **R**ed, **E**nlace, **F**ísica
> = **"A Pesar Solo Tengo Redes Efectivas Funcionando"**

### 3.3. Qué hace cada capa (la tabla completa)

| Capa | Nombre | Función en cristiano | Qué maneja (PDU) | Dónde "vive" |
|------|--------|----------------------|------------------|--------------|
| **7** | Aplicación | La interfaz con los programas que vos usás (navegador, correo, chat) | Datos | El programa (Chrome, Outlook…) |
| **6** | Presentación | Traduce formatos, cifra y comprime para que la capa 7 entienda | Datos | El sistema operativo |
| **5** | Sesión | Abre, mantiene y cierra el diálogo entre dos aplicaciones | Datos | El sistema operativo |
| **4** | Transporte | Garantiza que los datos lleguen completos, en orden y sin errores (o elige no garantizarlo, por velocidad) | **Segmento** (TCP) / **Datagrama** (UDP) | El sistema operativo de los hosts |
| **3** | Red | Asigna direcciones lógicas (IP) y decide la mejor ruta | **Paquete** | El router |
| **2** | Enlace de Datos | Entrega datos al dispositivo vecino inmediato, con direcciones físicas (MAC) y detección de errores | **Trama** (frame) | El switch, la placa de red |
| **1** | Física | Transmite los bits crudos por el medio: voltajes, luz, ondas de radio | **Bits** | El cable, la antena, el hub |

El dato que transporta cada capa tiene nombre propio: se llama **PDU** (*Protocol Data Unit* — unidad de datos de protocolo). Fijate en la columna "Qué maneja": a cada capa le corresponde una "caja" distinta — **bits → tramas → paquetes → segmentos → datos**.

> **Clave de memoria:** "¿Me pasás el *segmento*?" decime **T**ransporte. "¿El *paquete*?" → **R**ed. "¿La *trama*?" → **E**nlace. Cada piso de la muñeca rusa tiene su propio nombre de caja.

### 3.4. Cómo funciona (y el diagrama que casi siempre sale mal)

El flujo es simple: los datos **bajan** por la pila en el emisor (cada capa agrega su sobre) y **suben** por la pila en el receptor (cada capa abre su sobre). Esto se llama **encapsulación** (al bajar) y **desencapsulación** (al subir).

El diagrama correcto — fijate que van en *paralelo*, capa contra capa, y no en fila como suele dibujarse mal — es este:

```
 EMISOR                                  RECEPTOR
┌─────────────┐  7º agrega datos       ┌─────────────┐
│ 7 Aplicación │ ────────► ──────────► │ 7 Aplicación │
├─────────────┤                        ├─────────────┤
│ 6 Presentac. │ ────────► ──────────► │ 6 Presentac. │
├─────────────┤                        ├─────────────┤
│ 5 Sesión     │ ────────► ──────────► │ 5 Sesión     │
├─────────────┤                        ├─────────────┤
│ 4 Transporte │ ────────► ──────────► │ 4 Transporte │
├─────────────┤                        ├─────────────┤
│ 3 Red        │ ────────► ──────────► │ 3 Red        │
├─────────────┤                        ├─────────────┤
│ 2 Enlace     │ ────────► ──────────► │ 2 Enlace     │
├─────────────┤                        ├─────────────┤
│ 1 Física     │ ──── bits por el ───► │ 1 Física     │
└─────────────┘       medio físico     └─────────────┘
      │  cada capa agrega su sobre         │  cada capa abre su sobre
      └───────── ENCAPSULACIÓN ────────────┘  DESENCAPSULACIÓN
```

Lo importante: cada capa del emisor le habla "directamente" a su gemela en el receptor — aunque en la práctica los datos solo viajen por el cable físico y las capas intermedias simplemente los empujen hacia abajo o arriba.

> **Ojo con un error común:** se suele dibujar el flujo como una fila horizontal (Aplicación → Presentación → Sesión → …) — eso está mal. Las capas se apilan en paralelo: **bajan en el emisor y suben en el receptor**.

---

## 4. El modelo TCP/IP: las 4 capas

### 4.1. El modelo que sí funciona

El modelo TCP/IP nació por el lado práctico: lo desarrollaron los que construyeron **ARPANET** (la red del Departamento de Defensa de EE.UU. que dio origen a internet) y después lo estandarizó la **IETF**. Su regla era simple: *primero que funcione, después que sea lindo*. Los protocolos ya existían (TCP, IP); el modelo se escribió después, para explicarlos.

Hoy, **todo internet funciona con TCP/IP**. Cuando decís "la red anda mal", hablando en serio estás hablando de estas 4 capas.

### 4.2. Las 4 capas

| Capa | Nombre | Función | Protocolos típicos |
|------|--------|---------|--------------------|
| **4** | **Aplicación** | Junta las capas 7, 6 y 5 del OSI: los servicios que usan los programas | HTTP, HTTPS, DNS, DHCP, FTP, SSH, SMTP, SNMP |
| **3** | **Transporte** | Igual que la capa 4 del OSI: comunicación extremo a extremo, fiable o rápida | TCP, UDP |
| **2** | **Internet** | Enrutamiento y direccionamiento lógico (equivale a la capa 3 del OSI) | IP, ICMP, ARP |
| **1** | **Acceso a Red** | Junta las capas 2 y 1 del OSI: comunicación con el vecino y el medio físico | Ethernet, Wi-Fi, PPP, Frame Relay |

¿Por qué 4 capas y no 7? Porque en la práctica, Presentación y Sesión casi siempre se resuelven dentro de la propia aplicación (el navegador cifra, comprime y maneja sus sesiones él mismo), y la frontera entre Enlace y Física es difusa en tecnologías reales como Ethernet.

### 4.3. El mapeo entre modelos

```
        MODELO OSI                 MODELO TCP/IP
┌──────────────────────┐    ┌──────────────────────┐
│ 7 Aplicación         │    │                      │
│ 6 Presentación       │───►│  4 Aplicación        │
│ 5 Sesión             │    │                      │
├──────────────────────┤    ├──────────────────────┤
│ 4 Transporte         │───►│  3 Transporte        │
├──────────────────────┤    ├──────────────────────┤
│ 3 Red                │───►│  2 Internet          │
├──────────────────────┤    ├──────────────────────┤
│ 2 Enlace de Datos    │    │                      │
│ 1 Física             │───►│  1 Acceso a Red      │
└──────────────────────┘    └──────────────────────┘
```

Las flechas resumen todo: **las capas 5-6-7 del OSI viven juntas en la capa de Aplicación del TCP/IP, y las capas 1-2 viven juntas en la de Acceso a Red.**

---

## 5. OSI vs TCP/IP: la comparación honesta

### 5.1. ¿Cuál uso, cuál estudio?

| Característica | Modelo OSI | Modelo TCP/IP |
|----------------|-----------|---------------|
| **Número de capas** | 7 | 4 |
| **Quién lo creó** | La ISO (organización de estándares) | Los ingenieros de ARPANET / la IETF |
| **Orden de creación** | Primero el modelo, después los protocolos | Primero los protocolos, después el modelo |
| **Uso real** | Teórico y educativo (no se implementó tal cual) | La base real de internet |
| **Protocolo de red** | Independiente de protocolo (es genérico) | Atado a IP |
| **Evolución** | Rígido: cambiar una capa requiere renegociarlo todo | Flexible: las capas evolucionan juntas con internet |
| **Para qué sirve hoy** | Entender conceptos, ubicar fallas, estudiar | Trabajar de verdad, configurar, operar |

### 5.2. La verdad de a pie

> **Resumen honesto:** el OSI es para **pensar**; el TCP/IP es para **funcionar**. Cuando un técnico dice "problema de capa 3", está usando la numeración del OSI aunque la red corra con TCP/IP — el OSI es el idioma común, TCP/IP es la calle.

Por eso el resto de este manual usa la **numeración del OSI** (capa 1, capa 2, capa 3…) pero los **nombres y protocolos del TCP/IP** (la realidad).

### 5.3. El modelo híbrido real

En la práctica, nadie implementa "OSI puro" ni "TCP/IP puro": se usa un **modelo híbrido**. Casi todos los textos modernos y las herramientas de análisis (como **Wireshark**) hablan de las 5 capas que ves acá:

```
 5. Aplicación        HTTP, DNS, SMTP…
 4. Transporte        TCP / UDP
 3. Red               IP, ICMP
 2. Enlace de Datos   Ethernet (tramas, MAC)
 1. Física            cable / ondas
```

No te asustes si ves libros que dibujan 5 capas: es exactamente lo mismo, con los nombres del OSI y la cantidad del TCP/IP.

---

## 6. La capa de Aplicación

### 6.1. La ventanilla del correo

La capa de Aplicación es la única que ve el usuario. Es la **ventanilla del correo**: el lugar donde entregás tu carta (el programa que usás) y recibís la respuesta.

No es "la aplicación" en sí (Chrome no es una capa): es el **protocolo** que la aplicación usa para hablar por la red. El navegador no habla "red": habla **HTTP**. El correo electrónico habla **SMTP** (para enviar) e **IMAP/POP3** (para recibir). El chat habla HTTPS. Cada servicio tiene su protocolo y su **puerto** (el "número de ventanilla" que identifica al servicio en el servidor).

### 6.2. Los protocolos que tenés que conocer

| Protocolo | Puerto | Para qué sirve |
|-----------|:------:|----------------|
| **HTTP** | 80 | Páginas web (sin cifrar) |
| **HTTPS** | 443 | Páginas web cifradas (las de hoy en día) |
| **DNS** | 53 | Traduce nombres (`google.com`) a direcciones IP |
| **DHCP** | 67/68 | Asigna IP automáticamente a los dispositivos |
| **FTP** | 20/21 | Transferencia de archivos (legado, sin cifrar) |
| **SSH** | 22 | Acceso remoto seguro a servidores |
| **Telnet** | 23 | Acceso remoto sin cifrar (hoy, en desuso) |
| **SMTP** | 25/587 | Envío de correo electrónico |
| **POP3** | 110 | Recepción de correo (descarga y borra del servidor) |
| **IMAP** | 143 | Recepción de correo (sincroniza con el servidor) |
| **SNMP** | 161 | Monitoreo y gestión de dispositivos de red |

> **Cómo leer la tabla:** cuando tu PC quiere abrir un sitio web, manda un mensaje "al puerto 443" del servidor. El puerto le dice al servidor *qué servicio* está pidiendo. Es como llamar a una empresa y pedir "pasame con ventanilla 443": sabés que ahí atienden HTTPS.

---

## 7. La capa de Transporte: TCP y UDP

### 7.1. El problema de la capa 4

La capa de Red ya sabe *cómo llegar* (las rutas). A la capa de Transporte le toca otra pregunta: **¿cómo garantizo que lo que se mandó llegó bien?**

Acá hay dos personalidades opuestas, y ambas son correctas según lo que necesites:

- **TCP**: la carta certificada con acuse de recibo y seguimiento.
- **UDP**: el correo aéreo sin confirmación, rápido, sin vueltas.

### 7.2. TCP: la carta certificada

> **Analogía:** TCP es mandar una carta **con acuse de recibo y seguimiento postal**: te avisan cuándo salió, te avisan cuándo llegó, y si se pierde, se reenvía. El costo: es más lento y más pesado (cada carta lleva más papeles).

El acuse de recibo tiene nombre: el **three-way handshake** (saludo de tres pasos), la forma en que dos equipos se ponen de acuerdo antes de hablar:

```
  Emisor                     Receptor
    │                            │
    │  ─── SYN ───────────────►  │   "¿Estás listo para hablar?"
    │                            │
    │  ◄─── SYN + ACK ─────────  │   "Estoy listo. ¿Y vos?"
    │                            │
    │  ─── ACK ───────────────►  │   "Listo, hablemos."
    │                            │
    │  ▼ (empieza la conversación) 
```

Con la conexión armada, TCP agrega otras dos garantías:

- **Numeración de segmentos**: cada segmento lleva un número; el receptor los rearma **en orden** y detecta si falta alguno.
- **Control de flujo**: si el receptor está saturado, le dice al emisor "bajá un cambio" (la *ventana*). Así nadie ahoga a nadie.
- **Checksum**: cada segmento lleva una "huella" de verificación; si el dato se corrompió en el camino, se detecta y se retransmite.

| Característica TCP | Qué significa |
|---|---|
| Conexión | Conectado: arma una sesión antes de transmitir (handshake) |
| Fiabilidad | Garantiza entrega y orden de los segmentos |
| Control de flujo | El receptor puede frenar al emisor si se satura |
| Control de errores | Detecta pérdidas/corrupciones y retransmite |
| Velocidad | Más lento, por todo el control que lleva |
| Se usa en | Web, correo, transferencia de archivos, bases de datos — todo lo que no puede perderse |

### 7.3. UDP: el correo sin acuse

> **Analogía:** UDP es tirar la carta al buzón **sin acuse de recibo**: sale rápido, no pesa nada… y si se pierde, te enterás (o no). No hay seguimiento, pero tampoco demoras.

Es literalmente el "protocolo de datagramas de usuario" y hace solo lo mínimo: pone un número de puerto y manda. Sin handshake, sin orden garantizado, sin retransmisión. ¿Por qué existe entonces? Por tres razones de oro:

1. **Velocidad**: sin handshake ni confirmaciones, cada mensaje viaja al ritmo máximo posible.
2. **En vivo**: en una videollamada, un segundo de audio perdido se puede descartar; retransmitirlo sería un desastre (llegaría tarde igual). Mejor **perder un cuadro que frenar toda la llamada**.
3. **Mensajes cortos de una sola vez**: pedir una dirección DNS o el estado de un juego no necesita "sesión".

| Característica UDP | Qué significa |
|---|---|
| Conexión | Sin conexión: manda y listo |
| Fiabilidad | No garantiza entrega ni orden |
| Control de errores | Solo un checksum básico (si falla, descarta) |
| Velocidad | Más rápido, menos overhead |
| Se usa en | Streaming, VoIP, juegos online, DNS, DHCP |

### 7.4. La tabla que resume la pelea

| Criterio | TCP | UDP |
|----------|-----|-----|
| Conexión | Conectado (handshake) | Sin conexión |
| Fiabilidad | Alta (entrega + orden) | Baja (mejor esfuerzo) |
| Velocidad | Más lento | Más rápido |
| Overhead (carga extra) | Mayor (cabecera de 20 bytes) | Menor (cabecera de 8 bytes) |
| Control de flujo | Sí | No |
| Retransmisión | Sí | No |
| Idea | "Que llegue, aunque tarde" | "Que llegue rápido, aunque pierda algo" |

> **Regla práctica:** ¿El dato se puede repetir? **TCP.** ¿El dato se puede perder un poquito sin drama? **UDP.** Descargás un archivo → TCP (un byte faltante corrompe todo). Mirás una transmisión en vivo → UDP (un cuadro perdido no se nota).

---

## 8. La capa de Internet

### 8.1. La oficina de clasificación del correo

La capa de Internet (capa 3, Red, en el OSI) es la **oficina de clasificación postal**: recibe tu carta, le escribe la dirección de origen y destino en términos lógicos (las **direcciones IP**) y decide **por qué ruta** la manda. Si hay diez caminos entre tu ciudad y el destino, esta capa elige uno (y si ese camino falla, prueba con otro).

Lo que maneja se llama **paquete**, y dentro va (con su sobre puesto) el segmento de la capa 4.

### 8.2. IP: el protocolo de los paquetes

**IP** (*Internet Protocol*) es el protocolo estrella de esta capa. Existe en dos versiones:

| Característica | IPv4 | IPv6 |
|----------------|------|------|
| Longitud de la dirección | 32 bits | 128 bits |
| Formato | Decimal punteado: `192.168.1.1` | Hexadecimal con dos puntos: `2001:0db8::1` |
| Cantidad de direcciones | ~4.300 millones | Prácticamente ilimitada (3.4 × 10³⁸) |
| Cabecera del paquete | 20 bytes mínimo | 40 bytes fijos |
| Estado hoy | Sigue siendo la norma | En crecimiento, obligatoria en redes nuevas |

> **La razón del IPv6:** en el mundo hay más dispositivos que direcciones IPv4. IPv6 no existe "porque sí": existe porque los 4.300 millones de IPv4 se agotaron. Cada celular, notebook, smart TV y sensor necesita una dirección — y dos IPv6 son más que los granos de arena de todas las playas (exageramos poco).

El paquete IP lleva un dato muy importante en su sobre: el **TTL** (*Time To Live*). Es un contador que baja en cada salto y evita que un paquete perdido dé vueltas por internet para siempre. Cuando llega a cero, el router lo descarta y avisa.

### 8.3. Los otros protocolos de la capa de Red

| Protocolo | Función |
|-----------|---------|
| **ICMP** | Mensajes de control y diagnóstico: lo usa el `ping` y el `traceroute` |
| **IGMP** | Maneja los grupos *multicast* (enviar a varios destinos a la vez) |
| **IPSec** | Seguridad: cifra y autentica a nivel de paquete (base de las VPN) |
| **ARP** | Traduce direcciones IP a direcciones MAC *dentro de una misma red* (el "agenda del vecindario") |

> **Ojo con un error común:** ARP aparece listado en esta capa, pero en la práctica trabaja en el borde entre la capa 2 y la 3: resuelve "¿qué dispositivo físico es este IP de mi red?" — solo alcanza a los vecinos, no cruza routers.

---

## 9. La capa de Acceso a Red

### 9.1. El cartero del barrio

Si la capa de Internet es la oficina de clasificación, la capa de Acceso a Red (capas 1 y 2 del OSI juntas) es **el cartero que conoce cada casa del barrio**: entrega el sobre al vecino exacto, casa por casa, y se asegura de que la trama llegue en buen estado.

Esta capa es la única que **conoce el medio físico** (el cable o las ondas) y trabaja con **direcciones físicas** (MAC), no lógicas. Su unidad de datos se llama **trama** (*frame*).

### 9.2. Las funciones del piso de abajo

| Función | Qué es |
|---------|--------|
| **Encuadre (framing)** | Armá la trama: un inicio, el dato, un fin, y delimitadores para saber dónde empieza y termina cada mensaje |
| **Control de acceso al medio** | Decide CUÁNDO un dispositivo puede hablar (para que dos no hablen a la vez y se pisen) |
| **Direccionamiento físico** | Usa las direcciones **MAC** (48 bits) para identificar sin ambigüedad cada placa de red |
| **Detección de errores** | Un **CRC** (huella matemática) al final de cada trama: si la huella no coincide al llegar, se descarta la trama |

### 9.3. Las tecnologías de esta capa

| Tecnología | Medio físico | Uso típico |
|------------|--------------|------------|
| **Ethernet (IEEE 802.3)** | Cable de par trenzado, fibra óptica | Toda LAN cableada moderna |
| **Wi-Fi (IEEE 802.11)** | Ondas de radio | LAN inalámbrica |
| **PPP** | Línea serial / punto a punto | Dial-up histórico, algunas VPN |
| **Frame Relay** | Redes WAN de operador | Conexiones entre sedes (legado, en extinción) |

> **Clave de memoria:** en esta capa las direcciones son **MAC** (físicas, de la placa de red) y las cajas se llaman **tramas**. En la capa de arriba, las direcciones son **IP** (lógicas) y las cajas se llaman **paquetes**. Son dos "universos" distintos, y confundirlos es el error de principiante más común de las redes.

---

## 10. La encapsulación: las muñecas rusas

### 10.1. El concepto estrella de este manual

Llegó el momento: **la encapsulación**, la muñeca rusa. Es el proceso que arma todo lo que viste, y si te llevás una sola idea de este manual, que sea esta.

Cuando el navegador manda una página, el dato no viaja "pelado". Viaja envuelto. Mirá el orden exacto:

```
  PASO 1: La aplicación genera los datos
  ┌─────────────────────────────────────────────┐
  │  GET /index.html  (el pedido HTTP)          │
  └─────────────────────────────────────────────┘

  PASO 2: TCP lo envuelve con su sobre (puertos, nº de secuencia)
  ┌─────────────────────────────────────────────┐
  │ [TCP: puerto 443] GET /index.html           │
  └─────────────────────────────────────────────┘
                       ↑ esto se llama SEGMENTO

  PASO 3: IP lo envuelve con su sobre (IP origen/destino, TTL)
  ┌─────────────────────────────────────────────┐
  │ [IP: 190.12.3.4 → 142.250.64.14]            │
  │ [TCP: puerto 443] GET /index.html           │
  └─────────────────────────────────────────────┘
                       ↑ esto se llama PAQUETE

  PASO 4: Ethernet lo envuelve con su sobre (MAC origen/destino, CRC)
  ┌─────────────────────────────────────────────┐
  │ [ETH: MACpc → MACrouter]                    │
  │ [IP: 190.12.3.4 → 142.250.64.14]            │
  │ [TCP: puerto 443] GET /index.html           │
  └─────────────────────────────────────────────┘
                       ↑ esto se llama TRAMA
                       ↓ y esto viaja como BITS por el cable
```

¿Ves el patrón? **Cada capa envuelve TODO lo anterior y le agrega su propio sobre por delante.** El contenido original (el `GET /index.html`) queda intacto en el centro — nadie lo modifica. Así, en el receptor, cada capa lee su sobre (que es el primero que le toca del lado de afuera), lo saca y pasa el resto hacia arriba:

```
 RECEPTOR:
 1º Ethernet abre su sobre   → le quedan [IP][TCP] GET /index.html
 2º IP abre su sobre         → le quedan [TCP] GET /index.html
 3º TCP abre su sobre        → le quedan GET /index.html
 4º La aplicación recibe el dato limpio → el navegador dibuja la página
```

> **Regla de oro (la repetimos con intención):** cada capa agrega su sobre **sin mirar ni modificar** lo que lleva adentro. Encapsulación al bajar, desencapsulación al subir. El dato original viaja siempre intacto.

### 10.2. El costo de los sobres: el overhead

Envolver no es gratis. Cada sobre ocupa bytes. En Ethernet, una trama clásica puede llevar como máximo **1500 bytes de contenido** (el **MTU**): si tu dato mide más, la capa de Red lo **fragmenta** en paquetes más chicos y TCP lo rearma en el destino.

Un cálculo simple para que veas el costo:

- Datos reales de la aplicación: **1460 bytes**
- Sobre TCP (20 bytes) + sobre IP (20 bytes) = **40 bytes extra**
- Total que viaja: **1500 bytes**
- Eficiencia: 1460 / 1500 ≈ **97%** — los sobres cuestan solo el 3%.

Por eso los que diseñan redes miran el *overhead* con lupa: en links de muchísimo tráfico, un 3% por mensaje es muchísimo dinero.

> **HACELO VOS:** agarrá una hoja, escribí una palabra en el centro. Andá envolviéndola con tres sobres, y en cada uno anotá un dato de viaje: destinatario (IP), ventanilla (puerto), dirección de calle (MAC). Después abrí los sobres de atrás hacia adelante y anotá qué leíste en cada uno — recién ahí "llegó el dato a la aplicación". Eso, exactamente eso, es la encapsulación.

---

## 11. El viaje completo de un paquete

### 11.1. La historia completa, capa por capa

Unís todas las piezas. Escribís `google.com`, tocás Enter, y esto pasa — ahora sí, con nombres de capas y con el detalle de quién hace qué:

**1. Tu PC — capa de Aplicación (5)**
El navegador arma el pedido HTTP y se lo pasa a la pila. TCP hace el handshake con el servidor, IP le pone las direcciones, Ethernet envuelve todo en la trama. Los bits salen por el cable a la velocidad de tu placa (1 Gbps, por ejemplo).

**2. El switch — solo capa 2**
El switch recibe la trama, mira **solo la dirección MAC destino** de la tapa del sobre y la reenvía por el puerto correcto. Ni siquiera se entera de que adentro hay un paquete IP. Es como el empleado que reparte cartas por el número de casa: no sabe ni le importa de qué trata la carta.

**3. Tu router — capa 3 (y un poco de 2)**
El router recibe la trama y abre **su** sobre: el de Ethernet. ¿Por qué? Porque el destino no está en su red: hay que mandar el paquete a otro barrio. El router **descarta el sobre Ethernet viejo** (la trama) y arma un **sobre nuevo** con las MAC de su propio vecino (el router del proveedor). Al paquete IP no lo toca: le cambia de sobre, pero el paquete sigue intacto. Y de camino, aplica la traducción de direcciones (NAT) que permite que miles de casas compartan una sola IP pública.

**4. Los routers de internet — capa 3**
Cada router del camino (ISP tras ISP) mira la dirección IP destino, consulta su **tabla de enrutamiento** (el mapa de rutas), elige el próximo salto, le cambia el sobre Ethernet y lo manda. El TTL baja una unidad en cada salto: si llegara a 0, el paquete se descarta — así ningún paquete perdido vaga eternamente.

**5. El servidor de Google — capas 5 a 1, en orden inverso**
El servidor recibe la trama, abre el sobre Ethernet, luego el IP, luego el TCP, y el pedido HTTP original queda a la vista, tal cual lo escribió tu navegador. La aplicación de Google procesa el pedido, y la **respuesta vuelve por el mismo camino con los mismos pasos** — ahora con una muñeca rusa nueva del lado de Google.

```
 TU PC            SWITCH            TU ROUTER         ROUTER ISP      SERVIDOR GOOGLE
┌─────────┐      ┌─────────┐      ┌──────────┐      ┌──────────┐      ┌─────────┐
│ Aplicac.│      │         │      │          │      │          │      │ Aplicac.│
│ Transp. │      │         │      │          │      │          │      │ Transp. │
│ Internet│      │         │      │ Internet │      │ Internet │      │ Internet│
│ Acceso  │─trama─│ Acceso  │─trama─│ Acceso  │─trama─│ Acceso  │─trama─│ Acceso  │
└─────────┘      └─────────┘      └──────────┘      └──────────┘      └─────────┘
   ↑ arma la      solo mira         cambia el          cambia el         abre los
   muñeca rusa    la MAC (c2)       sobre ETH (c2)     sobre ETH (c2)    sobres (c2→5)
                                     sin tocar el       sin tocar el
                                     paquete IP (c3)    paquete IP (c3)
```

### 11.2. La regla que ordena todo: qué cambia y qué no

| Elemento | ¿Cambia en el camino? | Detalle |
|----------|:---------------------:|---------|
| Direcciones **MAC** | **SÍ, en cada salto** | Cada tramo tiene su propio sobre: la MAC del vecino de HOY, no del destino final |
| Direcciones **IP** | **NO** | La IP de origen y destino es la misma de punta a punta (salvo la traducción NAT del router) |
| El **dato** (HTTP) | **NO** | Viaja intacto, envuelto por capas, hasta el final |
| El **TTL** | SÍ, baja en cada salto | Contador anti-paquetes-perdidos |

Esta es la clave mental que separa a los que entienden redes de los que memorizan:

> **La MAC cambia en cada tramo (barrio por barrio); la IP es fija de punta a punta (de dirección a dirección). El cartero cambia, la carta no.**

---

## 12. Cómo resolver problemas por capas

### 12.1. El método del piso en llamas

Cuando algo falla, lo peor es adivinar. El método profesional es **bajar por la pila desde arriba, o subir desde abajo, comprobando capa por capa** hasta encontrar la primera que falla.

> **Regla de oro del diagnóstico:** el problema está en la **primera capa que falla** — y ninguna capa de arriba puede funcionar si una de abajo no anda. Si el cable está cortado (capa 1), da igual lo que haga el navegador (capa 5): no va a haber página.

### 12.2. El caso clásico: "no me anda internet"

Abrir el navegador y que no cargue nada puede ser un problema de cualquiera de las capas. El checklist profesional, de abajo hacia arriba:

| Paso | Capa | Comprobación | Si falla acá… |
|------|------|--------------|---------------|
| 1 | **Física (1)** | ¿El cable está enchufado? ¿El Wi-Fi está activado? ¿La luz de red en la PC y en el router? | Arreglá el medio físico: es el 80% de los "no anda nada" reales |
| 2 | **Enlace (2)** | ¿La PC tiene IP del DHCP? (`ipconfig` / `ip addr`) | Problema de DHCP o del switch: sin IP no hay paquete que mandar |
| 3 | **Red (3)** | ¿Puedo llegar hasta el router? (`ping 192.168.1.1`) | Problema de rutas o del router |
| 4 | **Red (3+)** | ¿Puedo llegar a internet? (`ping 8.8.8.8`) | Problema del ISP o del cable *hacia afuera* |
| 5 | **Aplicación (5)** | ¿Puedo resolver nombres? (`ping google.com`) | Problema de DNS: hay IP, pero no "agenda" |
| 6 | **Aplicación (5)** | ¿Abre la página en el navegador? | Problema del servidor, del HTTP o del propio navegador |

Fijate la lógica: **cada prueba depende de la anterior**. Si `ping 8.8.8.8` funciona (capa 3 OK) pero `ping google.com` no (capa 5 DNS), ya sabés que el problema es el DNS y no el cable.

### 12.3. Las preguntas que hace un profesional

Cuando llega un "no anda", las primeras preguntas siempre separan capas:

- ¿**Un solo sitio** anda mal, o todos? → Uno solo: probablemente capa 5 (ese servidor o ese DNS). Todos: probablemente capa 1-3 (tu conexión).
- ¿Anda **por cable** y no por Wi-Fi? → Capa 1 (radio, distancia, interferencia).
- ¿Anda en **otra hora**? → Posiblemente saturación (capa 3/4, congestión).
- ¿Le pasa a **un solo dispositivo**? → La placa, la configuración IP o el cable de ese equipo (capas 1-2).
- ¿Le pasa a **todos**? → El router, el ISP o el servicio (capas 3+).

> **Ejemplo resuelto:** "No abro un sitio, pero el resto de internet anda." → Capa 1-3 OK (ping a 8.8.8.8 anda). DNS OK (otros sitios abren). El problema es específico de ESE servidor: lo apuntás con una IP directa para confirmar y listo. Ningún técnico adivina: **descarta capas con pruebas**.

---

## 13. Herramientas que ven las capas

### 13.1. Ping (ICMP — capa 3)

`ping` manda un mensaje ICMP de ida y vuelta y mide el tiempo. Te dice **si hay camino** hasta el destino:

```
$ ping 8.8.8.8
64 bytes from 8.8.8.8: icmp_seq=1 ttl=116 time=4.32 ms
```

- `ttl=116`: cuántas vidas le quedaban al paquete al llegar (si es cercano a 255, está cerca; si es bajo, dio muchas vueltas).
- `time=4.32 ms`: latencia de ida y vuelta.
- Si no responde: o no hay ruta, o el destino bloquea ICMP (común). Por eso "ping no anda" no siempre significa "red caída".

### 13.2. Traceroute (capa 3 + 2)

`traceroute` (o `tracert` en Windows) le muestra TODOS los saltos entre vos y el destino: el mapa de la ruta. Cada línea es un router intermedio:

```
$ traceroute google.com
 1  router-casa (192.168.1.1)       1.2 ms
 2  isp-01.ar.isp.net (10.5.0.1)    8.1 ms
 3  core-3.ar.isp.net (170.0.2.1)   12.4 ms
 4  google-gw (142.250.70.1)        18.0 ms
```

El `* * *` en un salto significa "ese router no contesta ICMP" — no necesariamente que esté caído. La herramienta de diagnóstico definitiva para saber EN QUÉ capa y en QUÉ tramo se corta la ruta.

### 13.3. Wireshark (todas las capas a la vista)

**Wireshark** es el microscopio: captura tramas reales y les muestra la muñeca rusa completa — la trama Ethernet, el paquete IP, el segmento TCP y el dato de aplicación, cada uno en su sección. Cuando leas un capture en Wireshark, vas a ver *exactamente* los sobres que este manual te enseñó a reconocer.

### 13.4. Comandos de configuración (capas 2 y 3)

| Comando | Qué te muestra | Capas |
|---------|----------------|-------|
| `ipconfig /all` (Windows) / `ip addr` (Linux) | Tu IP, tu máscara, tu gateway, tu DNS | 2-3 |
| `arp -a` | La tabla que traduce IP → MAC de tu red local | 2-3 |
| `netstat` | Las conexiones TCP activas y sus puertos | 4 |
| `route print` / `ip route` | Tu tabla de enrutamiento local | 3 |

> **HACELO VOS:** abrí una terminal y corré `ping 8.8.8.8`, después `traceroute google.com` y mirá con `ipconfig` tu IP y tu gateway. Cada dato que veas corresponde a una capa de este manual — ahora ya sabés leerlos.

---

## 14. Comprobá lo que aprendiste

Respondé antes de mirar las respuestas, después destapá cada una con el detalle. Si alguna te resulta difícil, volvé a esa sección — no sigas de largo.

**1. ¿Por qué las redes se dividen en capas y no se resuelven de una sola pieza?**
<details>
<summary>Ver respuesta</summary>

Porque la comunicación de extremo a extremo es una cadena de problemas enormes (señales, direcciones, rutas, errores, orden). Dividirla en capas con una responsabilidad cada una permite estandarizar cada pieza por separado, evolucionar una sin romper las otras, y aislar fallas: el problema está donde la primera capa falla.
</details>

**2. Numerá las 7 capas del OSI de abajo hacia arriba.**
<details>
<summary>Ver respuesta</summary>

1 Física → 2 Enlace de Datos → 3 Red → 4 Transporte → 5 Sesión → 6 Presentación → 7 Aplicación. (El TCP/IP las agrupa en 4: Acceso a Red = 1+2, Internet = 3, Transporte = 4, Aplicación = 5+6+7.)
</details>

**3. ¿Qué nombre recibe el dato que maneja cada capa? (PDU)**
<details>
<summary>Ver respuesta</summary>

Física: **bits**. Enlace: **trama**. Red: **paquete**. Transporte: **segmento** (TCP) o **datagrama** (UDP). Aplicación: **datos**. La PDU es la "caja" que cada capa produce.
</details>

**4. ¿Cuándo usarías TCP y cuándo UDP?**
<details>
<summary>Ver respuesta</summary>

TCP cuando el dato no puede perderse ni desordenarse: descargas, correo, páginas web (handshake + retransmisión + orden). UDP cuando la velocidad manda y la pérdida es tolerable o la retransmisión llegaría tarde: videollamadas, streaming en vivo, juegos, DNS.
</details>

**5. ¿Qué es la encapsulación y cuántos sobres tiene una trama Ethernet con HTTP adentro?**
<details>
<summary>Ver respuesta</summary>

Es el proceso de envolver los datos con la información de control de cada capa: cada una agrega su sobre (cabecera) sin tocar el contenido. Una trama que lleva HTTP tiene 3 sobres: **Ethernet** (el más externo), **IP** y **TCP**. El dato HTTP está en el centro, intacto.
</details>

**6. Las direcciones IP ¿cambian o no en cada salto? ¿Y las MAC?**
<details>
<summary>Ver respuesta</summary>

Las **IP no cambian** de punta a punta (salvo NAT): identifican el destino final. Las **MAC sí cambian en cada tramo**: cada nuevo sobre Ethernet se arma con las MAC del vecino inmediato. "El cartero cambia, la carta no."
</details>

**7. A alguien "no le abre un sitio, pero el resto de internet anda". ¿Qué capas descartás con qué pruebas?**
<details>
<summary>Ver respuesta</summary>

Capa 1-3 descartadas si `ping 8.8.8.8` funciona. DNS descartado si otros sitios abren. El problema es específico del servidor o de su resolución puntual (capa 5): probás la IP directa del sitio para confirmar. Adivinar sin pruebas es el error de principiante.
</details>

---

## 15. Glosario

| Término | Qué es |
|---------|--------|
| **Capa** | Nivel de la pila con una responsabilidad única; se comunica con su capa gemela en el otro equipo |
| **Modelo OSI** | Estándar de referencia de 7 capas creado por la ISO en 1984; se usa para entender y diagnosticar |
| **Modelo TCP/IP** | El modelo de 4 capas que realmente usa internet |
| **PDU** | Unidad de datos de protocolo: la "caja" que produce cada capa (bits, trama, paquete, segmento, datos) |
| **Encapsulación** | Proceso de envolver los datos agregando la cabecera de cada capa al bajar por la pila |
| **Desencapsulación** | Proceso inverso: abrir los sobres capa por capa al subir por la pila del receptor |
| **Cabecera (header)** | El "sobre" con la información de control que cada capa agrega por delante del dato |
| **Trama (frame)** | PDU de la capa de Enlace: datos con cabecera + cola (CRC) y direcciones MAC |
| **Paquete** | PDU de la capa de Red: datos con dirección IP origen/destino y TTL |
| **Segmento** | PDU de la capa de Transporte TCP: datos con puertos y número de secuencia |
| **Datagrama** | PDU de la capa de Transporte UDP |
| **Puerto** | Número que identifica un servicio en un servidor (ej: 443 = HTTPS, 53 = DNS) |
| **TCP** | Protocolo de transporte confiable: handshake, orden, retransmisión |
| **UDP** | Protocolo de transporte rápido sin garantías |
| **Three-way handshake** | El saludo SYN → SYN+ACK → ACK con el que TCP arma una conexión |
| **IP** | Protocolo de la capa de Red que direcciona y enruta paquetes |
| **TTL** | Contador de saltos del paquete IP; al llegar a 0 el paquete se descarta |
| **MTU** | Tamaño máximo de contenido que acepta una trama (1500 bytes en Ethernet clásico) |
| **ICMP** | Protocolo de control y diagnóstico de la capa de Red (usa `ping` y `traceroute`) |
| **ARP** | Traduce IP a MAC dentro de una misma red |
| **MAC** | Dirección física única de 48 bits de cada placa de red |
| **CRC** | Huella matemática al final de la trama que detecta errores de transmisión |
| **Enrutamiento** | Decisión de qué camino toma cada paquete según la tabla de rutas |
| **Overhead** | Bytes "extra" que agregan los sobres de las capas sobre los datos reales |
| **Wireshark** | Herramienta que captura tramas y muestra todas las capas superpuestas |

---

## 16. Resumen en 10 puntos

1. **Los modelos de red son el acuerdo de cómo se habla**: dividen la comunicación en capas con responsabilidades únicas.
2. **Cada capa envuelve los datos con su propio sobre (cabecera)** sin tocar el contenido: eso es la **encapsulación**, y al recibir se invierte (desencapsulación).
3. **El modelo OSI tiene 7 capas** (Física, Enlace, Red, Transporte, Sesión, Presentación, Aplicación) y sirve para entender y diagnosticar.
4. **El modelo TCP/IP tiene 4 capas** (Acceso a Red, Internet, Transporte, Aplicación) y es el que funciona de verdad en internet.
5. **Cada capa produce una PDU distinta**: bits → trama → paquete → segmento/datagrama → datos.
6. **TCP es la carta certificada** (handshake, orden, retransmisión); **UDP es el correo sin acuse** (rápido, sin garantías). "¿Se puede repetir?" TCP — "¿Se puede perder un poco?" UDP.
7. **La capa de Red trabaja con IP** (direcciones lógicas, rutas, TTL); la capa de Enlace trabaja con **MAC** (direcciones físicas, tramas, CRC).
8. **La MAC cambia en cada tramo; la IP es fija de punta a punta.** El cartero cambia, la carta no.
9. **El diagnóstico es por capas**: subir de abajo hacia arriba probando, y el problema está en la primera capa que falla — nunca adivinar.
10. **El dato viaja intacto**: desde el `GET /index.html` hasta la página dibujada en pantalla, solo cambian los sobres que lo envuelven.

---

> **Fuente:** Documentación propia basada en estándares ISO, IETF y material educativo de redes.

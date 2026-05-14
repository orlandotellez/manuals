# 18. Modelos de Red

---

## ¿Qué es un Modelo de Red?

Un **modelo de red** es una representación estructurada y organizada de las funciones necesarias para la comunicación entre dispositivos en una red. Define cómo los datos viajan desde el origen hasta el destino, dividiendo el proceso en **capas** con responsabilidades específicas.

> **Nota:** Los modelos de red sirven como guía teórica y práctica para el diseño, la implementación y la resolución de problemas en redes de comunicación.

---

## Importancia de los Modelos de Red

| Aspecto | Beneficio |
|---------|-----------|
| **Estandarización** | Permite que fabricantes y desarrolladores trabajen con estándares comunes |
| **Interoperabilidad** | Garantiza que dispositivos de distintos fabricantes se comuniquen correctamente |
| **Solución de problemas** | Facilita la identificación de fallos al aislar problemas por capa |
| **Diseño modular** | Cada capa puede evolucionar independientemente sin afectar a las demás |
| **Comunicación clara** | Proporciona un vocabulario y estructura universal para profesionales de TI |

---

## Modelo OSI (Open Systems Interconnection)

El modelo OSI fue desarrollado por la **ISO** (International Organization for Standardization) en 1984. Divide la comunicación de red en **7 capas**, cada una con una función específica.

### Las 7 Capas del Modelo OSI

| Capa | Nombre | Función | Ejemplos de Protocolos/Tecnologías |
|------|--------|---------|-------------------------------------|
| **7** | **Aplicación** | Interfaz entre la red y las aplicaciones del usuario. Proporciona servicios de red directamente al software. | HTTP, FTP, SMTP, DNS, SNMP, DHCP |
| **6** | **Presentación** | Traduce, cifra y comprime los datos para que la capa de aplicación pueda interpretarlos. | SSL/TLS, JPEG, MPEG, GIF, ASCII |
| **5** | **Sesión** | Establece, gestiona y termina las sesiones de comunicación entre dispositivos. | NetBIOS, RPC, PPTP |
| **4** | **Transporte** | Garantiza la entrega fiable o rápida de los datos entre extremos. Controla el flujo y el control de errores. | TCP, UDP, SCTP |
| **3** | **Red** | Determina la mejor ruta lógica para los datos desde el origen hasta el destino. Maneja direccionamiento lógico. | IP, ICMP, IPSec, OSPF, BGP |
| **2** | **Enlace de Datos** | Proporciona transferencia fiable de datos entre dos nodos adyacentes en una red. Controla el acceso al medio físico. | Ethernet (MAC), PPP, Frame Relay, ARP, Switches |
| **1** | **Física** | Transmite bits sin procesar a través del medio físico. Define especificaciones eléctricas, mecánicas y funcionales. | Cables (UTP, fibra óptica), hubs, conectores, señales eléctricas |

### Cómo Funciona el Modelo OSI

1. Los datos se generan en la capa **7** (Aplicación) y descienden capa por capa.
2. En cada nivel, se añade un **encabezado** (y en algunos casos un **trailer**) con información de control propia. Este proceso se llama **encapsulación**.
3. Los datos llegan a la capa **1** (Física) y se transmiten al dispositivo receptor.
4. En el destino, los datos ascienden capa por capa, eliminando los encabezados en cada nivel. Este proceso se llama **desencapsulación**.

```
Dispositivo A                                        Dispositivo B
┌──────────────┐      Encapsulación      Desencapsulación      ┌──────────────┐
│  Aplicación  │ ──► │ Presentación │ ──► │  Sesión  │ ──► ... │  Aplicación  │
└──────────────┘      └──────────────────┘                     └──────────────┘
```

> **Dato clave:** En la práctica, muchas implementaciones combinan o simplifican capas. Por eso surgió el modelo TCP/IP.

---

## Modelo TCP/IP (Transmission Control Protocol / Internet Protocol)

El modelo TCP/IP fue desarrollado por el **Departamento de Defensa de EE.UU.** (DoD). Es el modelo que realmente se utiliza en Internet. Se compone de **4 capas** que agrupan funcionalmente las 7 del modelo OSI.

### Las 4 Capas del Modelo TCP/IP

| Capa | Nombre | Función | Ejemplos de Protocolos/Tecnologías |
|------|--------|---------|-------------------------------------|
| **4** | **Aplicación** | Combina las capas 7, 6 y 5 del OSI. Gestiona los servicios de red de alto nivel. | HTTP, FTP, SMTP, DNS, SSH, SNMP |
| **3** | **Transporte** | Igual que la capa 4 del OSI. Comunicación extremo a extremo. | TCP, UDP |
| **2** | **Internet** | Equivalente a la capa 3 del OSI. Enrutamiento y direccionamiento lógico. | IP, ICMP, ARP, IPSec |
| **1** | **Acceso a Red (Link)** | Combina las capas 2 y 1 del OSI. Comunicación directa con el medio físico. | Ethernet, Wi-Fi, PPP, Frame Relay |

### Comparación Rápida con el Modelo OSI

| Modelo OSI | Modelo TCP/IP |
|:----------:|:--------------:|
| Capa 7 - Aplicación | **Capa de Aplicación** (4) |
| Capa 6 - Presentación | **Capa de Aplicación** (4) |
| Capa 5 - Sesión | **Capa de Aplicación** (4) |
| Capa 4 - Transporte | **Capa de Transporte** (3) |
| Capa 3 - Red | **Capa de Internet** (2) |
| Capa 2 - Enlace de Datos | **Capa de Acceso a Red** (1) |
| Capa 1 - Física | **Capa de Acceso a Red** (1) |

---

## Comparación Detallada: OSI vs TCP/IP

| Característica | Modelo OSI | Modelo TCP/IP |
|----------------|-----------|---------------|
| **Número de capas** | 7 | 4 |
| **Origen** | Organización (ISO) | Práctico (DoD / IETF) |
| **Uso real** | Principalmente teórico y educativo | Base de Internet y redes reales |
| **Protocolo de red** | Independiente de protocolo | Basado en IP |
| **Servicios definidos** | Cada capa tiene servicios bien definidos | Más flexible y menos rígido |
| **Adaptabilidad** | Difícil de adaptar a nuevas tecnologías | Escalable y adaptable |
| **Desarrollo** | Se creó primero el modelo, luego los protocolos | Se desarrollaron los protocolos primero, luego el modelo |

> **En resumen:** El modelo OSI es ideal para **entender y enseñar** los conceptos de redes. El modelo TCP/IP es el que **realmente se usa** en la práctica.

---

## Capa de Aplicación TCP/IP en Profundidad

La capa de Aplicación es la más cercana al usuario y engloba múltiples protocolos según el servicio:

### Protocolos Principales

| Protocolo | Puerto Predeterminado | Función |
|-----------|:--------------------:|---------|
| **HTTP** | 80 | Transferencia de páginas web (sin cifrar) |
| **HTTPS** | 443 | Transferencia web cifrada con TLS |
| **FTP** | 20 / 21 | Transferencia de archivos |
| **SSH** | 22 | Acceso remoto seguro |
| **Telnet** | 23 | Acceso remoto (sin cifrar) |
| **SMTP** | 25 / 587 | Envío de correo electrónico |
| **POP3** | 110 | Recepción de correo (descarga) |
| **IMAP** | 143 | Recepción de correo (sincronización) |
| **DNS** | 53 | Resolución de nombres de dominio a IP |
| **DHCP** | 67 / 68 | Asignación dinámica de direcciones IP |
| **SNMP** | 161 | Gestión y monitorización de dispositivos |

---

## Capa de Transporte en Profundidad

La capa de Transporte permite la comunicación entre procesos en hosts distintos. Ofrece dos modos principales:

### TCP (Transmission Control Protocol)

| Característica | Descripción |
|----------------|-------------|
| **Tipo de conexión** | Conectado (establece sesión antes de transmitir) |
| **Fiabilidad** | Garantiza la entrega y el orden de los paquetes |
| **Control de flujo** | Evita que el emisor sature al receptor |
| **Control de errores** | Detecta y retransmite paquetes perdidos |
| **Uso ideal** | Web, correo electrónico, transferencia de archivos |

> **Analogía:** TCP es como enviar una carta con acuse de recibo y seguimiento postal: sabes que llegó y en orden.

### UDP (User Datagram Protocol)

| Característica | Descripción |
|----------------|-------------|
| **Tipo de conexión** | Sin conexión (no establece sesión) |
| **Fiabilidad** | No garantiza entrega ni orden |
| **Control de flujo** | No implementa control de flujo |
| **Control de errores** | Solo verificación básica con checksum |
| **Uso ideal** | Streaming de video/audio, VoIP, juegos en línea, DNS |

> **Analogía:** UDP es como enviar una carta sin acuse de recibo: es más rápido, pero no sabes si llegó.

### Comparación TCP vs UDP

| Criterio | TCP | UDP |
|----------|-----|-----|
| **Conexión** | Conectado | Sin conexión |
| **Fiabilidad** | Alta | Baja |
| **Velocidad** | Más lento | Más rápido |
| **Overhead** | Mayor (más cabeceras) | Menor |
| **Orden de paquetes** | Garantizado | No garantizado |
| **Control de flujo** | Sí | No |

---

## Capa de Internet en Profundidad

La capa de Internet es responsable de **direccionamiento lógico** y **enrutamiento** de los datos a través de redes.

### IP (Internet Protocol)

Existen dos versiones en uso:

#### IPv4

| Característica | Detalle |
|----------------|---------|
| **Longitud de dirección** | 32 bits |
| **Formato** | Decimal punteado (ej: `192.168.1.1`) |
| **Espacio de direcciones** | ~4.300 millones de direcciones |
| **Encabezado** | 20 bytes mínimo (sin opciones) |

#### IPv6

| Característica | Detalle |
|----------------|---------|
| **Longitud de dirección** | 128 bits |
| **Formato** | Hexadecimal separado por dos puntos (ej: `2001:0db8::1`) |
| **Espacio de direcciones** | Prácticamente ilimitado (~3.4 × 10³⁸) |
| **Encabezado** | 40 bytes fijos, más eficiente |

> **Motivo de la migración a IPv6:** El agotamiento del espacio de direcciones IPv4 y la necesidad de más dispositivos conectados.

### Otros Protocolos de la Capa de Internet

| Protocolo | Función |
|-----------|---------|
| **ICMP** | Mensajes de control y diagnóstico (utilizado por `ping` y `traceroute`) |
| **ICMPv6** | Versión para IPv6, incluye Neighbor Discovery |
| **IGMP** | Gestión de grupos multicast |
| **IPSec** | Seguridad mediante cifrado y autenticación a nivel de IP |

---

## Capa de Acceso a Red en Profundidad

La capa de Acceso a Red (también llamada **capa de enlace de datos** y **capa física** combinadas) gestiona la comunicación directa con el medio de transmisión.

### Funciones Principales

| Función | Descripción |
|---------|-------------|
| **Encuadre (Framing)** | Encapsula los datos en tramas con delimitadores |
| **Control de acceso al medio** | Determina cuándo un dispositivo puede transmitir (MAC) |
| **Detección y corrección de errores** | Mecanismos como CRC para verificar la integridad |
| **Direccionamiento físico** | Uso de direcciones MAC (48 bits) para identificar dispositivos |

### Tecnologías de la Capa de Acceso a Red

| Tecnología | Medio | Uso típico |
|------------|-------|------------|
| **Ethernet (IEEE 802.3)** | Cable (par trenzado, fibra) | Redes LAN cableadas |
| **Wi-Fi (IEEE 802.11)** | Ondas de radio | Redes inalámbricas LAN |
| **PPP** | Serial | Conexiones punto a punto (dial-up, VPN) |
| **Frame Relay** | WAN empresarial | Conexiones entre sedes |

---

## Flujo Completo de Comunicación (Ejemplo)

A continuación se muestra qué ocurre cuando un usuario abre una página web:

1. **Aplicación (HTTP/HTTPS):** El navegador genera una solicitud HTTP al servidor web.
2. **Transporte (TCP):** TCP segmenta los datos, numera los paquetes y establece la conexión (three-way handshake).
3. **Internet (IP):** IP encapsula los segmentos en paquetes con direcciones IP de origen y destino.
4. **Acceso a Red (Ethernet/Wi-Fi):** Los paquetes se encapsulan en tramas con direcciones MAC y se transmiten por el medio físico (cables o ondas).

```
Datos de usuario
    │
    ▼
[Aplicación]  HTTP
    │
    ▼
[Transporte]  TCP → Puerto 80 / 443
    │
    ▼
[Internet]    IP  → IP origen + IP destino
    │
    ▼
[Acceso a Red] Ethernet → Dirección MAC origen + Dirección MAC destino
    │
    ▼
Señales eléctricas / ondas de radio
```

---

## Otros Modelos y Referencias

### Modelo Híbrido (Modelo de Internet)

En la práctica, la mayoría de las implementaciones modernas utilizan un **modelo híbrido** que combina elementos del OSI y del TCP/IP. Las herramientas de análisis de red como **Wireshark** y los sistemas operativos modernos no siguen estrictamente un solo modelo, sino que integran conceptos de ambos.

### Modelo de Red en la Nube

Con la evolución de la computación en la nube, surgen nuevas capas conceptuales:

| Capa | Nombre | Ejemplo |
|------|--------|---------|
| **SaaS** | Software como Servicio | Google Docs, Office 365 |
| **PaaS** | Plataforma como Servicio | Heroku, Google App Engine |
| **IaaS** | Infraestructura como Servicio | AWS, Azure, Google Cloud |

> Esta clasificación (modelo SPI) no reemplaza los modelos OSI o TCP/IP, sino que complementa la perspectiva desde el punto de vista de los **servicios**.

---

## Resumen Comparativo

| Característica | OSI | TCP/IP |
|----------------|-----|--------|
| **Capas** | 7 | 4 |
| **Propósito** | Referencia teórica y educativa | Implementación práctica |
| **Protocolo base** | Independiente | IP |
| **Sesión/Presentación** | Capas separadas | Integradas en Aplicación |
| **Despliegue real** | No se implementó como estándar | Base de Internet |
| **Enfoque** | Primero el modelo, luego los protocolos | Primero los protocolos, luego el modelo |

---

> **Fuente:** Documentación propia basada en estándares ISO, IETF y material educativo de redes.
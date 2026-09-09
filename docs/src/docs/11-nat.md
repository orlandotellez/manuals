# 11. NAT: el traductor de la red

---

## Índice

- [El problema de fondo: no alcanzan las direcciones](#1-el-problema-de-fondo-no-alcanzan-las-direcciones)
- [Direcciones públicas y privadas: quién vive en qué vecindario](#2-direcciones-públicas-y-privadas-quién-vive-en-qué-vecindario)
- [Qué es NAT: el conserje que reescribe los sobres](#3-qué-es-nat-el-conserje-que-reescribe-los-sobres)
- [El problema del puerto: por qué existe PAT](#4-el-problema-del-puerto-por-qué-existe-pat)
- [Tipos de NAT](#5-tipos-de-nat)
- [La tabla NAT en acción](#6-la-tabla-nat-en-acción)
- [NAT y seguridad: lo que da y lo que NO da](#7-nat-y-seguridad-lo-que-da-y-lo-que-no-da)
- [Ventajas y desventajas](#8-ventajas-y-desventajas)
- [Impacto en el rendimiento](#9-impacto-en-el-rendimiento)
- [CG-NAT: el NAT en manos del proveedor](#10-cg-nat-el-nat-en-manos-del-proveedor)
- [NAT en la vida real: cinco escenarios](#11-nat-en-la-vida-real-cinco-escenarios)
- [NAT transversal: el arte de hablar a través del traductor](#12-nat-transversal-el-arte-de-hablar-a-través-del-traductor)
- [Ejercicios prácticos](#13-ejercicios-prácticos)
- [Comprobá lo que aprendiste](#14-comprobá-lo-que-aprendiste)
- [Glosario](#15-glosario)
- [Resumen en 10 puntos](#16-resumen-en-10-puntos)

---

## 1. El problema de fondo: no alcanzan las direcciones

Imaginá un edificio de departamentos. Tiene UNA sola dirección postal para todo el mundo: `Av. Siempre Viva 742`. Adentro viven 200 familias, cada una en su departamento (1A, 2B, 3C...). Cuando llega el correo, el **conserje** lo recibe en la puerta, mira el nombre del destinatario y lo reparte por el pasillo correcto. Cuando un vecino manda una carta, el conserje escribe el remitente de la calle y la saca él mismo, sin que nadie en la vereda sepa de qué departamento salió.

Ese edificio es tu red. Las familias son tus dispositivos (celulares, PCs, tablets, impresoras, cámaras). El número de calle es la **IP pública**. Los departamentos son las **IP privadas**. Y el conserje es... bueno, exactamente lo que vamos a estudiar: **NAT**.

> **La idea madre de este manual:** NAT es el mecanismo que permite que TODA una red privada salga a Internet usando UNA sola dirección IP pública, reescribiendo las direcciones (y los puertos) en cada paquete que cruza el borde. Sin NAT, la red IPv4 actual — con sus ~4.300 millones de direcciones teóricas — ya habría colapsado hace décadas.

Ahora viene la parte que casi nadie explica bien: NAT no es solo "traducir direcciones". Podés comerte meses de carrera creyendo que es un simple buscar-y-reemplazar, y después te encontrás con llamadas VoIP que no entran, juegos que no conectan y cámaras que no se ven. Todo eso es el mismo fantasma: **NAT con un agujero, y cómo lograr que las comunicaciones en tiempo real lo atraviesen**. Al final del manual vas a entender por qué pasa y qué se hace en el mundo real (STUN, TURN, ICE) para resolverlo.

---

## 2. Direcciones públicas y privadas: quién vive en qué vecindario

Antes de NAT, el repaso mínimo que necesitás tener firme:

- **IP pública:** única en el mundo, asignada por el proveedor de Internet (ISP). Es la "dirección postal" visible desde cualquier lugar de Internet.
- **IP privada:** usada dentro de la red local, no enrutable en Internet. Cualquier red del planeta puede usar los mismos rangos privados sin pisarse, porque nunca salen a la calle.

Los rangos privados que define el estándar **RFC 1918**:

| Rango | Máscara | Espacio |
|-------|---------|---------|
| `10.0.0.0` – `10.255.255.255` | /8 | Enorme: 16,7 millones de direcciones |
| `172.16.0.0` – `172.31.255.255` | /12 | 1.048.576 direcciones |
| `192.168.0.0` – `192.168.255.255` | /16 | 65.536 direcciones (el clásico de los routers hogareños) |

Además de esos, existen otros dos rangos que importan mucho en el mundo NAT:

| Rango | Qué es |
|-------|--------|
| `169.254.0.0/16` | **APIPA / link-local:** auto-asignada cuando no hay DHCP. Tu equipo se inventa una IP; funciona solo en el segmento local. |
| `100.64.0.0/10` | **Espacio compartido (RFC 6598):** lo usa el ISP cuando aplica CG-NAT (sección 10). Si tu router tiene una IP WAN de este rango, estás detrás de un NAT del proveedor. |

Y la pregunta que cruza todo el manual: ¿IP fija o cambiante? Tanto públicas como privadas pueden ser:

- **Estáticas:** siempre la misma. Imprescindible para servicios que RECIBEN conexiones (un servidor, una cámara).
- **Dinámicas:** cambian con el tiempo (el típico DHCP del ISP). Baratas, pero complican recibir conexiones entrantes.

> **Regla para elegir (y la usamos en los escenarios de la sección 11):** si tu dispositivo solo INICIA conexiones hacia afuera (navegar, IoT que reporta, celular), una IP privada dinámica le alcanza. Si tu dispositivo debe RECIBIR conexiones desde Internet sin intermediarios (alojar un servidor, atender llamadas entrantes), ahí necesitás IP pública, port forwarding o un servicio de relevo.

---

## 3. Qué es NAT: el conserje que reescribe los sobres

**NAT** (*Network Address Translation*, Traducción de Direcciones de Red) es el proceso que traduce un conjunto de direcciones — típicamente las privadas de la red local — a otro conjunto — típicamente una o más públicas — y viceversa. Vive en el punto de borde: el router de tu casa, el firewall de la empresa, el router del proveedor.

Volviendo al edificio: cuando un departamento manda una carta, el conserje la saca reescribiendo el remitente con la dirección del edificio. Cuando llega la respuesta, la recibe él, mira su libreta (la **tabla NAT**) y la entrega al departamento correcto.

En la red es igual, pero con tres pasos:

```
   PC (192.168.1.20)          Router con NAT           Servidor web en Internet
        │                          │                          │
        │  "Quiero google.com"     │                          │
        │  Origen: 192.168.1.20    │                          │
        │─────────────────────────>│                          │
        │                          │  Reescribe el origen:    │
        │                          │  Origen: 203.0.113.5     │
        │                          │──────────────────────────>│
        │                          │                          │
        │                          │  Respuesta para          │
        │                          │  "203.0.113.5"           │
        │                          │<──────────────────────────│
        │  ¡Anda!                  │                          │
        │  Destino: 192.168.1.20   │  Busca en la tabla NAT:  │
        │<─────────────────────────│  "esta conexión era de   │
        │                          │  192.168.1.20"           │
```

El router de borde tiene dos caras:

- **Interfaz interna** (LAN): cara a las direcciones privadas `192.168.x.x`.
- **Interfaz externa** (WAN): cara a la Internet pública, con la IP asignada por el ISP.

**Cuando un paquete sale** (privada → pública): NAT reescribe la dirección de origen y, si hace falta, el puerto. **Cuando la respuesta entra** (pública → privada): NAT consulta su tabla y reescribe el destino al dispositivo correcto de adentro.

> **Momento clave para no marearse:** NAT es *stateful*: recuerda las conexiones en curso. Solo reescribe y entrega paquetes que corresponden a una conexión que alguien de adentro inició. Si un paquete entra sin que exista una entrada en la tabla → se descarta. Ese "por defecto se descarta" es lo que da origen al viejísimo mito de que "NAT es un firewall" (sección 7, ahí lo vemos con honestidad).

---

## 4. El problema del puerto: por qué existe PAT

Ahora la pregunta inevitable: el conserje reparte cartas mirando el **nombre** del destinatario. ¿Y si dos departamentos mandan cartas al mismo tiempo y cuando llegan las respuestas son idénticas salvo el nombre que el conserje borró?

Pongámoslo técnico. Dos hosts de la red, A y B, abren cada uno una conexión al MISMO servidor, desde el MISMO puerto de origen, al MISMO tiempo:

```
A → 192.168.1.10 : 1000  →  servidor : 80
B → 192.168.1.11 : 1000  →  servidor : 80
```

Si NAT solo tradujera direcciones IP, ambos paquetes saldrían como:

```
203.0.113.5 : 1000  →  servidor : 80     (¿de A o de B?)
203.0.113.5 : 1000  →  servidor : 80     (¿de A o de B?)
```

Cuando el servidor responda a `203.0.113.5:1000`, el conserje mira la libreta y... hay DOS entradas idénticas. Imposible saber a quién entregar. Respuesta de la respuesta se pierde, y las dos conexiones fallan.

La solución es la que hace funcionar a Internet tal como la conocemos: **PAT** (*Port Address Translation*, también llamado *NAT overload*). Además de la dirección IP, NAT reescribe el **puerto de origen** para que cada conexión sea única:

```
A → (192.168.1.10 : 1000)  se traduce a  (203.0.113.5 : 40512)
B → (192.168.1.11 : 1000)  se traduce a  (203.0.113.5 : 40513)
```

Ahora cada entrada de la tabla es única: el par `203.0.113.5:40512` identifica exactamente la conexión de A, y `203.0.113.5:40513` la de B. Las respuestas llegan, el conserje mira el puerto y entrega sin dudar.

> **La idea para llevarte a casa:** un puerto TCP o UDP tiene 16 bits → 65.535 valores. Con PAT, una sola IP pública puede sostener hasta 65.535 conexiones simultáneas *por cada puerto en uso* (en la práctica, menos por otros límites del sistema). Por eso un router hogareño con UNA IP pública sirve para una casa entera, y por eso el agotamiento de IPv4 no derrumbó Internet: la combinación IP+puerto multiplica el espacio utilizable.

---

## 5. Tipos de NAT

Hay tres sabores, y entender sus diferencias te ahorra horas de troubleshooting:

### 5.1. NAT estática (1:1)

Una dirección privada se asocia a UNA pública fija, de forma permanente:

```
192.168.1.50 (servidor)  ↔  203.0.113.10 (pública fija)
```

- **Cuándo se usa:** hosting de servicios (web, mail, cámara) que necesitan ser alcanzables SIEMPRE desde el mismo lugar.
- **Costo:** cada equipo expuesto consume una IP pública. Con muchas, sale caro.
- **Detalle fino:** como la asociación es fija, las conexiones ENTRANTES funcionan sin reenvíos raros: cualquier paquete a `203.0.113.10` va directo al servidor interno.

### 5.2. NAT dinámica (pool)

Hay un conjunto (pool) de IPs públicas. Un dispositivo interno pide salir, y NAT le presta UNA pública del pool mientras dura la conexión:

```
Pool: 203.0.113.20 – 203.0.113.29  (10 públicas)
192.168.1.10 → 203.0.113.21  (prestada)
192.168.1.11 → 203.0.113.22  (prestada)
```

- **Limitación clave:** si el pool se agota, el siguiente dispositivo... se queda afuera. El paquete se descarta.
- **Cuándo se usa:** redes donde la mayoría inicia conexiones salientes y conviene repartir la carga entre varias públicas.
- **Costo:** sigue necesitando varias públicas. En la era de la escasez de IPv4, quedó poco usado salvo en grandes empresas.

### 5.3. PAT: el campeón indiscutido

Todo el mundo lo usa sin saber su nombre. Es el NAT del router de tu casa: **muchísimas direcciones privadas → una única IP pública**, diferenciadas por puerto:

```
192.168.1.10:1000 → 203.0.113.5:40512
192.168.1.11:1000 → 203.0.113.5:40513
192.168.1.12:5000 → 203.0.113.5:40514
```

Comportamiento real:

1. PAT **preserva el puerto de origen** si puede: si el dispositivo usó el puerto 5000 y el 5000 está libre en la pública, lo deja igual.
2. Si el puerto ya está en uso por otra conexión, toma el **siguiente disponible** (5001, 5002...).
3. Sigue así hasta agotar puertos — evento que en la práctica casi nunca ocurre en entornos hogareños.

> **Por qué gana PAT:** miles de usuarios, una sola IP pública, costo mínimo y sin gestión. Es EL motivo por el cual millones de routers caseros funcionan con una única dirección del ISP.

---

## 6. La tabla NAT en acción

La libreta del conserje es la **tabla NAT**. Veamos una sesión completa con 3 dispositivos compartiendo la IP pública `203.0.113.5`:

```
Dispositivo interno   ←→   Público traducción    ←→   Destino externo
───────────────────        ──────────────────         ────────────────
192.168.1.20:51000   ←→   203.0.113.5:40512    ←→   8.8.8.8:53     (DNS)
192.168.1.21:52000   ←→   203.0.113.5:40513    ←→   198.51.100.7:443 (web)
192.168.1.22:1024    ←→   203.0.113.5:40514    ←→   203.0.113.99:22 (SSH)
```

Que esa tabla exista y esté completa es lo que permite que las RESPONSES entren. Regla de oro:

> **NAT solo traduce tráfico que tiene entrada en la tabla.** Entrada = alguien de adentro inició la conversación (o un admin configuró un reenvío de puertos). Sin entrada, el paquete entrante se descarta en silencio.

Los routers modernos lo hacen con **conexiones / flujos** (no entradas por paquete): cuando el primer paquete de una conexión sale, se crea la entrada; la respuesta usa la misma entrada; y cuando la conexión termina (FIN, RST o timeout), la entrada se borra. El estado se refresca con cada paquete que pasa — igual que el aging time de las MACs que ya viste en los switches, pero a nivel de conexión.

---

## 7. NAT y seguridad: lo que da y lo que NO da

Hay una frase que se repite en foros y cursos, y conviene desarmarla con honestidad: **"NAT es una capa de seguridad"**. Verdad a medias.

**Lo que SÍ es cierto:**

- Oculta las direcciones internas: nadie desde afuera ve `192.168.1.50`; solo ve la pública.
- Por defecto descarta tráfico entrante no solicitado: sobreviven menos escaneos de puertos y menos intentos directos contra dispositivos internos.
- Dificulta mapear tu red: un atacante no sabe cuántos equipos hay ni dónde.

**Lo que NO es cierto:**

- NAT **no es un firewall**. Un firewall toma decisiones por política (quién, qué protocolo, qué aplicación, a qué hora) y registra/audita. NAT solo traduce direcciones. Es como decir que la puerta del edificio "protege" porque nadie ve los departamentos — pero si un vecino abre la puerta a un extraño (vulnerabilidad, puerto abierto por reenvío, malware que inicia conexión), el conserje no lo va a frenar.
- La ocultación no resiste ataques que usen conexiones salientes (la enorme mayoría del malware funciona así).
- El mito se derrumba con IPv6: con IPv6 las direcciones globales abundan, NAT puede no existir, y aún así un buen firewall sigue siendo imprescindible.

> **La conclusión madura:** NAT reduce la superficie de exposición, sí — tómala como un beneficio gratis, pero la seguridad real son dos cosas: (1) un firewall correctamente configurado en el borde, y (2) los dispositivos parcheados y endurecidos. Ocultar no es proteger.

---

## 8. Ventajas y desventajas

### Lo bueno

| Ventaja | Por qué |
|---------|---------|
| **Ahorro de direcciones** | Miles de dispositivos internos con una sola IP pública (PAT) |
| **Seguridad pasiva** | Oculta la topología interna y descarta lo no solicitado |
| **Menos costos** | Pocas (o una) públicas = menos contratos, menos gestión |
| **Flexibilidad** | Podés cambiar de proveedor o de esquema público sin retocar la red interna: los equipos siguen en privado |
| **Balanceo sencillo** | Varias públicas en pool: si una cae, otra toma el tráfico |

### Lo malo

| Desventaja | Por qué |
|------------|---------|
| **Rompe la conectividad de punta a punta** | El modelo original de Internet asumía que cualquiera podía iniciar una conexión hacia cualquiera. NAT lo elimina: nadie "empuja" hacia adentro |
| **Latencia extra** | Cada paquete se inspecciona, se consulta la tabla, se reescribe. Hojas de ruta añadidas en cada cruce |
| **Problemas con protocolos que no toleran el cambio de dirección** | Firmas digitales, IPsec (verifica integridad de los encabezados que NAT modifica), FTP pasivo, SIP... |
| **Pérdida de trazabilidad** | Entre dos CG-NAT, un paquete cambió de dirección dos o tres veces: rastrear la origen real es un dolor |
| **Complejidad de configuración** | Reglas de reenvío por aplicación, puertos estáticos, ALG que rompe más de lo que arregla |
| **Conexiones entrantes sufren** | Servicios que deben RECIBIR conexiones requieren reenvío de puertos, DMZ o VPN — y aun así fallan en ciertos escenarios (juegos P2P, VoIP) |

---

## 9. Impacto en el rendimiento

Dos caras, otra vez:

- **Reduce carga de direcciones:** una sola pública sostiene toda la LAN; la asignación de IPs se vuelve trivial. Eso además permite "equilibrio": con pocas públicas bien administradas se sirve a mucha gente.
- **Pero suma latencia y puede saturar:** en redes con mucho tráfico simultáneo (una oficina con PAT, un ISP con CG-NAT), la traducción constante es CPU y memoria del router. Si las tablas se llenan o el equipo es chico, aparece congestión: paquetes descartados, retransmisiones y una experiencia que se siente "pesada" — especialmente en aplicaciones de tiempo real (videollamadas, juegos), que no toleran bien el jitter.

La regla práctica: en un hogar, un router decente con PAT aguanta de sobra. En una empresa o ISP, NAT se diseña: hardware pensado para *throughput* de millones de flujos, o se migra a IPv6 para sacárselo de encima.

---

## 10. CG-NAT: el NAT en manos del proveedor

**CG-NAT** (*Carrier-Grade NAT*), también llamado NAT masivo / *Large-Scale NAT* (LSN), es NAT aplicado al revés de como lo viste hasta acá: **el ISP lo corre en sus propios equipos**, compartiendo UNA dirección pública entre MUCHOS clientes.

¿Por qué? Porque los ISP ya no tienen suficientes IPv4 públicas para darle una a cada cliente. Su solución temporal mientras IPv6 se masifica: meter a todos los clientes detrás de un NAT gigante, usando el rango **`100.64.0.0/10`** (el espacio compartido del RFC 6598) para identificarlos internamente.

```
     Tu casa                      ISP (CG-NAT)
┌──────────────────┐      ┌──────────────────────────────┐
│ Router del cliente│      │  Tu router es "100.64.x.x"   │
│  LAN: 192.168.1.x │─────>│  CG-NAT lo traduce a         │
│  WAN: 100.64.0.17 │      │  la pública real: 203.0.113.7 │──> Internet
└──────────────────┘      └──────────────────────────────┘
       NAT casero                      NAT del ISP
```

Fijate qué pasó: hay **dos NAT encadenados** (doble NAT). Tu tráfico sale así: `192.168.1.20` → NAT casero → `100.64.0.17` → CG-NAT → `203.0.113.7` → Internet.

### Cómo saber si estás detrás de un CG-NAT

**Método 1 (directo):** entrá al panel de tu router y mirá la IP de la interfaz WAN. Si arranca con `100.64.x.x` (o `100.64.0.0/10` en general) → CG-NAT, sin lugar a dudas.

**Método 2 (con comandos):** desde tu PC, hacé una traza hacia tu IP pública:

- Windows: `tracert <tu_IP_pública>`
- Linux/macOS: `traceroute <tu_IP_pública>`

```
1 salto   → la pública está en TU router → no hay CG-NAT
2+ saltos → hay un equipo del ISP en el medio → CG-NAT confirmado
```

### Qué significa para vos

| Tipo de usuario | Impacto |
|-----------------|---------|
| **Estándar** (navegar, redes sociales, streaming) | Ninguno. Ni te enterás. |
| **Avanzado** (port forwarding, VPN entrante, servidores caseros, túneles) | Todo se complica: el reenvío de puertos de tu router apunta a una IP que NO controlás. Es la causa #1 de "configuré el reenvío y no funciona". |
| **Empresa / teletrabajo** | Las VPN entrantes y algunas videollamadas se ven afectadas; el acceso remoto necesita tecnologías de relevo (TURN, sección 12) o un túnel saliente (WireGuard/ZeroTier) en vez de conexión entrante. |
| **Gamer** | El P2P y el NAT de consolas saltan por los aires: el tipo de NAT empeora, aparecen los "strict" y los partidos que no conectan. |
| **IoT industrial / telemetría** | Si los sensores solo reportan hacia afuera: cero problema. Si la empresa necesita llegar a ellos desde afuera: problema serio. |

> **Conclusión del CG-NAT:** no es un bug, es un parche de ingeniería para estirar la vida útil de IPv4. Y explica muchísimos dolores del mundo real: "abrí los puertos y no entran", "el juego no conecta", "la cámara no se ve". Antes de pelear con configuraciones, chequeá si sos víctima del doble NAT.

---

## 11. NAT en la vida real: cinco escenarios

Teoría suficiente. Estos cinco casos cubren el 95% de lo que te vas a encontrar, y cada uno usa NAT distinto.

### Escenario 1 — La casa: todos navegando (PAT)

4 personas, 9 dispositivos, 1 IP pública del ISP, router de fibra. Todo el tráfico sale por PAT en `203.0.113.5`. Un celular en TikTok, una notebook en Zoom, una TV en Netflix y una consola descargando — simultáneamente.

- **NAT usado:** PAT. Cada salida, una entrada única (IP+puerto) en la tabla.
- **Tip:** si alguna aplicación se queja de NAT "moderate/strict", resolverlo suele ser: UPnP activado, o reenvío manual para esa consola (escenario 3).

### Escenario 2 — La oficina: servidor interno + acceso remoto

Una pyme tiene un servidor de archivos `192.168.0.10` al que los empleados entran por VPN, y una impresora. Nadie necesita que Internet "entre" salvo el servidor de correo.

- **NAT usado:** PAT para todo el tráfico saliente + **NAT estática o reenvío de puertos** para el correo (`192.168.0.10:25` ↔ pública fija `203.0.113.10:25`).
- **VPN:** los empleados no entran "hacia" el servidor: el servidor o el firewall inician un túnel saliente (WireGuard/OpenVPN de cliente) hacia el host del proveedor de VPN. NAT no se entera: la conexión la inició el lado interno, así que la tabla NAT la sostiene sin problemas. **Esta inversión (conexión saliente en vez de entrante) es LA solución universal para el acceso remoto con NAT.**

### Escenario 3 — El gamer: P2P y los tres tipos de NAT de consolas

Los juegos modernos no usan servidor central: conectan jugadores **entre sí (P2P)**. Para eso, un jugador tiene que recibir una conexión de otro — justo lo que NAT bloquea por defecto. Las consolas clasifican tu situación en tres niveles:

| Tipo | Qué significa | Experiencia |
|------|---------------|-------------|
| **Open** (abierto) | Nadie te bloquea: recibís conexiones directas | Hosteas partidas, todo conecta |
| **Moderate** (moderado) | Tenés NAT pero con UPnP o puertos abiertos | Conectás con Open y algunos Moderate; jamás sos host |
| **Strict** (estricto) | NAT cerrado / doble NAT | Solamente conectás con Open; buena parte de las partidas falla |

**Soluciones, en orden:** (1) activar **UPnP** en el router: la consola pide sola los puertos que necesita y NAT los abre automáticamente; (2) **reenvío manual** de los puertos del juego (suele ser un rango de UDP) hacia la IP fija de la consola (dale IP estática por DHCP reservation); (3) si sos víctima de CG-NAT, el reenvío NO va a servir: la última carta es un túnel con tecnología P2P amistosa (ZeroTier, Hamachi) que negocia atraviesos UDP por vos — o pedir IP pública al ISP.

### Escenario 4 — La cámara y el servidor casero: recibir conexiones

Una cámara IP y un NAS que querés ver desde afuera.

- **Opción clásica:** reenvío de puertos en el router: `WAN : 8080 → 192.168.1.80 : 80`. Ojo: exponer un admin web a Internet es pedir una invitación. Mejor cerrar en firewall y usar VPN.
- **Opción moderna (recomendada hoy):** la cámara/NAS inicia una conexión saliente hacia la nube del fabricante (o a tu propio servidor WireGuard). Vos entrás por la nube/el túnel. Cero puertos abiertos, cero CG-NAT que te joda. Es el mismo principio de inversión del escenario 2.

### Escenario 5 — IoT industrial / telemetría: solo reportar

Sensores, medidores, PLCs que mandan datos al servidor del fabricante cada 30 segundos.

- **NAT usado:** PAT, y ni siquiera lo pensás: el equipo inicia la conexión y ya.
- **La ley del IoT:** mientras el dispositivo SOLO hable hacia afuera, NAT (incluido CG-NAT) es invisible e irrelevante. El dolor aparece solo si la empresa necesita EMPUJAR configuraciones hacia el dispositivo (túneles salientes al rescate otra vez: los fabricantes serios usan colas/relevo en la nube para "llegar" a dispositivos detrás de cualquier NAT).

> **El patrón que atraviesa los cinco escenarios:** NAT no es problema cuando la comunicación sale; es problema cuando tiene que ENTRAR. Cada escenario tiene su palanca: puertos abiertos (1 y 3), NAT estática (2), UPnP (3), nube/túnel saliente (2, 4, 5). Y cuando ni eso alcanza... llega la sección que sigue.

---

## 12. NAT transversal: el arte de hablar a través del traductor

Acá está el plato fuerte, y lo que realmente distingue este manual: **por qué las comunicaciones en tiempo real (VoIP, videollamadas, juegos) se quiebran contra NAT, y cómo se resuelve en el mundo real.**

### 12.1. El problema: las conexiones entrantes no existen

Una llamada VoIP entrante es una conexión INICIADA DESDE AFUERA: un teléfono IP o softphone recibe un **INVITE** (una invitación SIP) de un servidor de telefonía. Pero el softphone vive detrás de NAT, sin entrada en la tabla. El INVITE llega al router, no hay entrada, y se descarta en silencio. El teléfono jamás suena.

Y hay un segundo problema, peor: la voz (RTP) no viaja por el mismo canal que la señalización (SIP). La llamada abre DOS flujos:

- **SIP** (señalización): arma, negocia y cuelga la llamada. TCP o UDP, comúnmente puerto 5060.
- **RTP** (la voz/video): stream continuo de paquetes UDP, unidireccional o bidireccional. **Los puertos RTP se negocian en el momento de cada llamada** y cambian en cada una — con rangos amplios (típicamente miles de puertos UDP pares, p. ej. 16384–32767 en muchas plataformas).

Traducido al edificio: no solo es que el conserje descarte cartas no pedidas — encima, los vecinos negocian entre llamada y llamada qué puerta van a usar para la voz. Adivinar por qué puerta va a intentar entrar el audio de una llamada de terceros es un juego de 1 entre 16.000.

> **Por qué "tiempo real" es la palabra clave:** en una llamada, el audio no puede esperar. Si un paquete de voz se retrasa o se pierde, no hay retransmisión útil: ya pasó el instante que transportaba. Por eso VoIP/video/juegos son los primero en romperse con NAT: no admiten el reintento que sí admiten una web o un correo.

### 12.2. El primer intento: comportamientos de NAT y la "regla del puerto simétrico"

No todos los NAT se comportan igual, y de eso depende TODO. La clasificación clásica (de los años del protocolo STUN original):

| Comportamiento | Qué hace con los paquetes SALIENTES | Qué hace con los ENTRANTES |
|----------------|--------------------------------------|----------------------------|
| **Full-Cone** | Mapea `interno:puerto` → `público:puerto` **una vez** | Acepta desde CUALQUIER origen hacia ese mapeo |
| **Address-Restricted Cone** | Idem | Solo acepta desde la dirección que YA recibió paquetes |
| **Port-Restricted Cone** | Idem | Solo desde dirección **y puerto** que ya hablaron |
| **Symmetric** | Crea un mapeo NUEVO por cada destino distinto | Prácticamente bloquea todo lo que no fue exactamente respondido al mismo mapeo |

Hoy se describe más preciso con dos ejes: **mapping** (cómo crea el mapeo: *endpoint-independent*, *address-dependent* o *address-and-port-dependent*) y **filtering** (qué deja entrar). Pero la intuición es la misma:

> **Full-cone es un conserje distraído:** una vez que el departamento 2B "abre" la puerta del edificio, cualquiera de afuera puede llamar a esa puerta y el conserje se la pasa. **Symmetric es un conserje paranoico:** cada vecino que quiere hablar con un destino distinto tiene que abrir una puerta nueva, y las respuestas solo entran por la puerta exacta que se abrió para ese remitente.

Esta diferencia explica los "tipos NAT" de los juegos: **Open** suele corresponder a full-cone (o puertos reenviados), **Strict** a symmetric (o doble NAT). Y explica por qué una técnica que "funciona para mi amigo" no te funciona a vos: no son el mismo tipo de conserje.

### 12.3. El truco que funciona a medias: "hablar por donde te hablan" (symmetric RTP)

La mayoría de los endpoints VoIP hacen algo elegantísimo y barato: **recibir RTP por el MISMO puerto por el que lo enviaron** (*RTP symmetric*). ¿Por qué ayuda? Porque si vos ya le mandaste audio a alguien, tu NAT creó la entrada para las respuestas. Mientras el flujo sea bidireccional y los dos extremos usen el mismo par de puertos, el audio cruza NAT sin configuración.

¿Cuándo se rompe? Cuando el flujo NO es completamente bidireccional, o cuando hay un NAT symmetric de por medio que crea un mapeo distinto por cada destino (y el stream entrante no coincide con el mapeo de salida). Ahí el truco del puerto simétrico se queda corto, y hay que pasar a las armas grandes.

### 12.4. STUN: "¿cómo me ve el mundo?"

**STUN** (*Session Traversal Utilities for NAT*) es un servidor en Internet que te dice tu dirección "vista desde afuera":

```
Tu softphone:  "Hola, soy 192.168.1.50:50002. ¿Quién soy para el mundo?"
Servidor STUN: "Todos te ven como 203.0.113.5:40512. Contale eso a tus interlocutores."
```

El softphone toma esa IP+puerto público, la mete en los mensajes SIP/RTP y le dice a la otra punta: "mandame el audio a `203.0.113.5:40512`, que es mi puerta" — y como esa puerta se abrió cuando el propio softphone habló con el servidor STUN, las respuestas entran.

**La letra chica:** STUN funciona con NAT full-cone y restricted y con port-restricted, pero **NO con symmetric**: el mapeo que STUN descubre es contra el servidor STUN, y un NAT symmetric crearía otro mapeo distinto contra el destinatario real. La respuesta del servidor STUN "sirve" pero el audio no llega.

### 12.5. TURN: el relevo cuando no queda otra

**TURN** (*Traversal Using Relays around NAT*) es el plan B (o C): si no hay forma de abrir un agujero directo entre los dos extremos — típicamente por NAT symmetric o por firewalls estrictos — el tráfico **se relega por un servidor intermedio**:

```
Softphone A ──> Tu NAT ──> Servidor TURN ──> NAT del otro ──> Softphone B
              (casa)      (en Internet)      (oficina)
```

A y B hablan con el TURN (conexiones salientes, que NAT deja pasar), y el TURN junta los dos hilos: el audio va casa → TURN → oficina. Todo el cruce de NAT se elimina porque **nadie intenta entrar por la puerta de nadie**: las dos puntas solo SALEN.

**El costo:** el relevo paga ancho de banda y latencia — cada llamada consume el doble de tráfico y pasa por una pierna intermedia. Por eso TURN es el último recurso: funciona siempre, pero cuesta. Las conferencias multitudinarias (WebRTC masivo) son TURN a lo grande.

### 12.6. ICE: la negociación que lo intenta TODO

Lo mejor de todo: nadie elige a ciegas. **ICE** (*Interactive Connectivity Establishment*) reúne STUN + TURN + conectividad directa en un solo proceso de negociación automática:

1. Cada extremo junta **todas sus direcciones candidatas**: la privada, la pública descubierta con STUN, y (si hay) el relevo del TURN.
2. Los dos intercambian listas (via SIP/WebRTC).
3. **Prueban en orden** de menor costo: directo primero, STUN/pinhole después, TURN al final.
4. La primera que funcione, gana. El resto se descarta.

Es el standard moderno: tu celular con videollamada, tu navegador con WebRTC, los softphones corporativos, TODOS usan ICE (con STUN y TURN adentro) sin que sepás nada.

### 12.7. SIP ALG: el plugin que rompe más de lo que arregla

Muchos routers hogareños traen "SIP ALG" (Application Layer Gateway) activado: un agente que "ayuda" reescribiendo los mensajes SIP para el NAT automáticamente.

Suena perfecto. En la práctica, los ALG caseros reescriben mal (o a medias) los encabezados SIP/SDP, rompen el RTP simétrico, trituran el SIP cifrado (que no se puede reescribir — y el router lo descarta o lo corrompe), y generan los síntomas más raros: llamadas que suenan pero no tienen audio, o audio en un solo sentido.

**La recomendación de la industria (y de este manual):** si tu VoIP sufre y tu router tiene SIP ALG — **desactivado generalmente arregla los problemas, no los causa**. La solución correcta son STUN/ICE de los endpoints, no un interceptor mágico. (Los ALG empresariales de verdad — los SBC, que siguen — son otra historia: están hechos por especialistas y son parte de la solución.)

> **Regla de oro del VoIP:** señalización (SIP) y voz (RTP) son canales distintos que se negocian en cada llamada. Si un solo elemento de la cadena no traduce bien esa negociación, la llamada se rompe. Por eso la respuesta moderna es: que los PROPIA endpoints negocien (ICE/STUN), NO que un router del medio "ayude" (ALG).

### 12.8. SBC: el orquestador del proveedor

En el lado del servicio de telefonía, el equivalente serio del ALG es el **SBC** (*Session Border Controller*): un equipo de borde que controla TODO el tráfico SIP/RTP hacia la red del proveedor. Funciones: autenticación de troncales, traducción de numeración, control de ancho de banda por llamada, topología escondida y — clave para el tema — **actúa como TURN gigante**: los endpooints detrás de NAT hablan con el SBC (saliente), y el SBC los conecta con el resto de la red telefónica. Por eso las llamadas VoIP "de empresa" funcionan: el SBC orquesta el cruce de NAT de toda la telefonía de la operadora.

### 12.9. El caso completo: una llamada VoIP real

Armemos todos los fierros. Un empleado en su casa (detrás del router de fibra, que además es CG-NAT del ISP) llama al número fijo de la oficina:

1. El softphone arranca y hace **registro SIP** contra el SBC del proveedor (el registro se renueva cada pocos minutos — cada renovación refresca la entrada NAT, matando dos pájaros: "estoy vivo" y "manteneme el agujero abierto").
2. Al marcar, **ICE** junta candidatos: la IP privada, la pública que le dijo el STUN, y el relevo del TURN.
3. El **INVITE** va por el canal saliente al SBC — entra en la tabla NAT como cualquier web — y el SBC ya sabe cómo encontrar al softphone: por el que el propio softphone usó para registrarse.
4. El SBC conecta con la central de la oficina y establece la llamada.
5. El audio **RTP** prueba: directo primero (con suerte, y con el truco del puerto simétrico alcanza); si el camino directo falla (CG-NAT + symmetric), **ICE elige TURN** y el audio viaja casa → TURN → oficina.
6. Al colgar, se liberan los puertos y las entradas NAT expiran.

Ninguna de esas piezas es opcional si el empleado está detrás de NAT doble. Por eso el acceso remoto, la telefonía y los juegos modernos — las tres cosas más sensibles al tiempo real — terminan TODAS en el mismo set de herramientas: **STUN para mirarse, TURN para relevar, ICE para negociar** — y reconocimiento humilde de que NAT, el salvador de IPv4, es también su única maldición.

---

## 13. Ejercicios prácticos

### Ejercicio 1: leé una tabla NAT

Esta es una tabla real de un router casero:

```
Protocolo  Local externo             Externo local
TCP        192.168.1.20:51000   ->   203.0.113.5:40512
UDP        192.168.1.21:53000   ->   203.0.113.5:40513
UDP        192.168.1.30:1024    ->   203.0.113.5:40514
```

1. ¿Qué tipo de NAT muestra la tabla?
2. Si llega un paquete para `203.0.113.5:40512`, ¿a qué equipo interno va?
3. ¿Y si llega uno para `203.0.113.5:8000` (sin entrada)? ¿Qué pasa?

<details>
<summary>Ver respuestas</summary>

1. **PAT** (NAT overload): tres dispositivos internos distintos comparten la misma IP pública `203.0.113.5`, diferenciados por puerto.
2. Va a `192.168.1.20` (puerto 51000). Esa es la conexión que la PC-20 inició hacia afuera.
3. **Se descarta.** No hay entrada en la tabla → paquete no solicitado → a la basura. Esto, y no otra cosa, es lo que "protege" NAT por defecto.
</details>

### Ejercicio 2: clasificá el comportamiento

Un NAT mapea `192.168.1.10:5000` → `203.0.113.5:5000` y acepta tráfico entrante a ese mapeo SOLO desde `8.8.8.8` (porque el equipo interno ya le mandó paquetes a `8.8.8.8`). ¿Qué tipo de NAT es: full-cone, address-restricted, port-restricted o symmetric?

<details>
<summary>Ver respuesta</summary>

**Address-restricted cone**: acepta desde CUALQUIER puerto de una dirección ya "conocida" (que recibió tráfico saliente del interno), pero NO desde direcciones que nunca hablaron. Si además filtrara por puerto exacto (`8.8.8.8:53` y nada más), sería port-restricted.
</details>

### Ejercicio 3: ¿STUN o TURN?

Dos softphones detrás de NAT symmetric (ambos extremos). Los endpoints usan ICE. ¿Qué candidato terminará funcionando para el audio?

<details>
<summary>Ver respuesta</summary>

**TURN (relevo).** Con NAT symmetric, los mapeos se crean por destino: el candidato STUN descubierto contra el servidor STUN no sirve para llegar al otro endpoint (el mapeo es distinto). Los candidatos directos tampoco. ICE probará en orden y terminará eligiendo el relevo — a costa de latencia y ancho de banda, pero con la llamada funcionando.
</details>

### Ejercicio 4: diagnóstico de VoIP

"Llamo desde el softphone de mi casa y la llamada suena, pero no hay audio, ni en un sentido ni en el otro. Mi router tiene SIP ALG activado." ¿Cuál es el siguiente paso lógico y por qué?

<details>
<summary>Ver respuesta</summary>

**Desactivar SIP ALG** (y configurar STUN/ICE en el softphone si hace falta). El síntoma "suena pero no hay audio" es el clásico de ALG que reescribe los mensajes SIP/SDP (o el RTP que no se negocia). Con ALG **apagado**, los endpoints negocian la voz por los puertos correctos y — con STUN/ICE — cruzan NAT limpio. Desactivar ALG es la primera prueba de todo técnico VoIP; en la mayoría de los casos arregla, no rompe.
</details>

### Ejercicio 5: detectar CG-NAT

Conectás tu router y la IP WAN muestra `100.73.12.9`. ¿Qué significa, y qué les decís a tus amigos gamers cuando se quejan de NAT Strict?

<details>
<summary>Ver respuesta</summary>

**Estás detrás de un CG-NAT del ISP** (`100.64.0.0/10` = espacio de RFC 6598). El reenvío de puertos de tu router NO va a servir: apunta a una IP (`100.73.12.9`) que no controlás y que el ISP traduce de nuevo hacia su pública. A los gamers: NAT Strict permanente aunque abran puertos; las soluciones reales son pedir IP pública al ISP (a veces paga/costo), usar VPN/P2P con cifrado (ZeroTier, etc.) o servicios de relevo.
</details>

---

## 14. Comprobá lo que aprendiste

**1. ¿Cuál es la función real de NAT en una red IPv4?**
<details>
<summary>Ver respuesta</summary>

Estirar el espacio de direcciones IPv4: permitir que MUCHOS dispositivos privados (RFC 1918) compartan UNA o pocas IPs públicas, traduciendo dirección y puerto en los paquetes que cruzan el borde (PAT).
</details>

**2. ¿Por qué no alcanza con traducir solo la IP?**
<details>
<summary>Ver respuesta</summary>

Porque dos hosts internos pueden usar el mismo puerto de origen hacia el mismo destino; sin traducir puertos, las respuestas serían indistinguibles (dos entradas idénticas en la tabla).
</details>

**3. Diferencia entre NAT estática, NAT dinámica y PAT.**
<details>
<summary>Ver respuesta</summary>

Estática: 1:1 fija (para servicios que reciben conexiones). Dinámica: una pública prestada de un pool mientras dura la conexión (si se agota, descarta). PAT: todos contra una sola pública por puertos distintos (el estándar de hogares y oficinas).
</details>

**4. ¿NAT es un firewall?**
<details>
<summary>Ver respuesta</summary>

No. Oculta direcciones y descarta lo no solicitado, pero no filtra por política ni audita. Es una capa pasiva de reducción de exposición; la seguridad real está en firewalls, parches y configuración.
</details>

**5. ¿Qué es CG-NAT y cómo se detecta?**
<details>
<summary>Ver respuesta</summary>

Un NAT masivo del ISP (doble NAT) para compartir públicas entre varios clientes, usando `100.64.0.0/10`. Se detecta mirando la IP WAN del router (100.64.x.x) o con `tracert`/`traceroute` a tu IP pública: 2+ saltos = CG-NAT.
</details>

**6. ¿Por qué las llamadas VoIP se rompen con NAT?**
<details>
<summary>Ver respuesta</summary>

Porque las llamadas entrantes son conexiones iniciadas desde AFUERA (no hay entrada NAT), y porque la voz (RTP) usa puertos UDP negociados en cada llamada por un canal distinto del de señalización (SIP). El tiempo real no admite retransmisiones: si el audio no cruza, la llamada se pierde o queda muda.
</details>

**7. STUN, TURN e ICE: ¿cuál es cada uno?**
<details>
<summary>Ver respuesta</summary>

STUN: un servidor que te dice tu dirección pública vista de afuera (descubrimiento). TURN: un servidor que releva el tráfico entre los dos extremos (funciona siempre, cuesta latencia/banda). ICE: la negociación que reúne STUN + TURN + conexión directa y prueba en orden de costo.
</details>

**8. ¿Cuándo conviene desactivar SIP ALG?**
<details>
<summary>Ver respuesta</summary>

Cuando hay problemas de VoIP (llamadas sin audio, un solo sentido, registro que falla). El ALG casero reescribe mal SIP/SDP y rompe RTP simétrico y SIP cifrado. La solución correcta son STUN/ICE en los endpoints; los SBC (enterprise) son otra liga.
</details>

---

## 15. Glosario

| Término | Qué es |
|---------|--------|
| **NAT** | Traducción de direcciones de red: privadas ↔ públicas en el borde |
| **PAT** | NAT con traducción de puertos: muchas internas → una pública |
| **NAT estática** | Traducción 1:1 fija para servicios que reciben conexiones |
| **NAT dinámica** | Traducción con pool de públicas asignadas temporalmente |
| **Tabla NAT** | Registro de conexiones en curso: interno ↔ público ↔ destino |
| **RFC 1918** | Estándar de rangos privados (10/8, 172.16/12, 192.168/16) |
| **RFC 6598** | Espacio compartido 100.64.0.0/10, usado por CG-NAT |
| **CG-NAT** | NAT masivo del ISP (doble NAT) para compartir IPs públicas |
| **Doble NAT** | Dos traducciones encadenadas (fastidio: reenvío de puertos muerto) |
| **Port forwarding** | Reenvío manual de un puerto público a un equipo interno |
| **UPnP** | Protocolo que deja que un dispositivo pida solo su reenvío de puertos |
| **Full-Cone / Restricted / Symmetric** | Comportamientos de NAT que definen qué entrante aceptan |
| **STUN** | Servidor que te dice tu IP pública "vista desde afuera" |
| **TURN** | Servidor que releva (relay) el tráfico cuando el directo falla |
| **ICE** | Negociación que prueba STUN + TURN + directo en orden de costo |
| **SIP** | Protocolo de señalización de VoIP (invita, negocia, cuelga) |
| **RTP** | Protocolo que transporta la voz/video (UDP, puertos negociados por llamada) |
| **SDP** | El cuerpo del mensaje SIP que describe los puertos/códecs de esa llamada |
| **RTP simétrico** | Recibir audio por el mismo puerto por el que se envía (truco anti-NAT) |
| **SIP ALG** | Interceptor de routers caseros que "ayuda" con SIP (suele romperlo) |
| **SBC** | Controlador de borde de sesión: el ALG serio del proveedor/empresa |
| **NAT traversal** | El conjunto de técnicas para cruzar NAT (STUN/TURN/ICE) |

---

## 16. Resumen en 10 puntos

1. **NAT nació por necesidad:** ~4.300 millones de IPv4 no alcanzan; NAT hace que millones de redes compartan pocas públicas.
2. **El conserje del edificio:** UNA IP pública (dirección del edificio), muchas privadas (departamentos), una tabla (la libreta).
3. **PAT es el rey:** IP + puerto = unicidad; sin traducir puertos, las respuestas serían indistinguibles.
4. **NAT es stateful:** solo traduce lo que tiene entrada en la tabla; lo no solicitado se descarta.
5. **NAT no es firewall:** oculta y descarta, pero no filtra ni audita. La seguridad de verdad vive en el firewall, los parches y la configuración.
6. **CG-NAT = doble NAT:** el ISP traduce a sus clientes con 100.64.0.0/10; detectalo en la IP WAN o con una traza de 2+ saltos — y entendé por qué tu reenvío de puertos "no funciona".
7. **NAT mata las conexiones entrantes:** todo drama (juegos, cámaras, servidores, VoIP) es ese mismo problema con distinta ropa.
8. **La regla del tiempo real:** si tu comunicación no admite retransmisión (voz, video, juegos), NAT es tu enemigo número uno.
9. **La tríada mágica:** STUN para mirarte, TURN para relevar, ICE para negociar — así se cruzan los NAT sin tocarlos.
10. **En VoIP, desconfiá del ALG:** SIP y RTP son canales distintos que se negocian por llamada; los endpoints con STUN/ICE lo resuelven mejor que cualquier interceptor casero.

---

> **Fuente:** Documentación propia basada en RFC 1918, RFC 6598, RFC 5389 (STUN), RFC 5766 (TURN), RFC 8445 (ICE), RFC 3261 (SIP) y RFC 3550 (RTP), con experiencias de troubleshooting reales.

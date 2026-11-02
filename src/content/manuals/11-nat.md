# 11. NAT: el traductor de la red

Este manual arranca desde cero. No hace falta que sepas nada de redes: vamos a construir la
idea de a una pieza por vez, siempre con una situación de la vida diaria primero y la
definición técnica después. Cuando aparece una sigla (IP, NAT, PAT, TCP, UDP) la definimos en
el momento en que la usamos por primera vez.

El tema del manual es una sola cosa: **cómo hace una casa entera, con nueve o diez
dispositivos, para salir a Internet con una única dirección**. Ese truco se llama NAT (*Network
Address Translation*, traducción de direcciones de red), lo usás todos los días sin saberlo, y
también es la causa de la mitad de los dolores de cabeza que vas
a tener cuando quieras *recibir* conexiones desde afuera: cámaras que no se ven, partidas que no
conectan, llamadas que suenan pero nadie escucha.

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

Cómo usar este índice: cada entrada es un capítulo y cada título es además la dirección (URL)
con la que se publica la página. Si estás apurado, con el capítulo 1, el 3, el 4 y el 6 ya
entendés el mecanismo completo; el resto son los casos donde el mecanismo duele.

### Resumen

- El manual enseña NAT desde cero, sin dar por sabida ninguna sigla.
- Cada concepto aparece primero como problema cotidiano, después como definición técnica.
- El recorrido corto es: problema (capítulo 1), mecanismo (3), puertos (4) y tabla (6).

---

## 1. El problema de fondo: no alcanzan las direcciones

Imaginá un edificio de departamentos. Tiene UNA sola dirección postal para todo el mundo: `Av. Siempre Viva 742`. Adentro viven 200 familias, cada una en su departamento (1A, 2B, 3C...). Cuando llega el correo, el **conserje** lo recibe en la puerta, mira el nombre del destinatario y lo reparte por el pasillo correcto. Cuando un vecino manda una carta, el conserje escribe el remitente de la calle y la saca él mismo, sin que nadie en la vereda sepa de qué departamento salió.

Ese edificio es tu red. Las familias son tus dispositivos (celulares, PCs, tablets, impresoras, cámaras). El número de calle es la **IP pública**. Los departamentos son las **IP privadas**. Y el conserje es... bueno, exactamente lo que vamos a estudiar: **NAT**.

### Qué es una dirección IP, en dos minutos

Antes de seguir, la pieza más chica del rompecabezas. **IP** significa *Internet Protocol*
(Protocolo de Internet): son las reglas que usan dos equipos para mandarse datos aunque estén
en redes distintas. Para mandarse algo, cada equipo necesita un identificador: eso es la
**dirección IP**.

En la versión que usamos todos los días, **IPv4** (Protocolo de Internet versión 4), esa
dirección es un número de 32 bits. Escrito como lo ves en todos lados, son cuatro números de 0
a 255 separados por puntos: `192.168.1.20`. Treinta y dos bits dan 2^32 combinaciones, o sea
**4.294.967.296** direcciones posibles. Redondeando, las ~4.300 millones que se repiten en
todos los artículos sobre el tema.

### Por qué ese número se quedó corto

Cuando se diseñó IPv4, 4.300 millones parecía una enormidad: ¿quién iba a necesitar más? El
error de cálculo fue suponer que "una dirección = una computadora". Hoy una casa tiene un
router, tres celulares, dos televisores, una consola, una impresora, la heladera inteligente y
la cámara de la puerta. Una oficina chica tiene cien cosas conectadas. Y cada cosa, en el
diseño original, necesitaba su propia dirección pública y única en el planeta.

Hay una versión más nueva del protocolo, **IPv6**, con direcciones de 128 bits (un espacio
astronómicamente más grande), y es el destino final de todo esto. Pero cambiar el protocolo de
base de Internet entera lleva décadas, y mientras tanto hay que hacer que IPv4 siga funcionando.
Ese "mientras tanto" es NAT.

### La cuenta que explica todo

Si cada dispositivo del planeta necesitara una IP pública, no habría direcciones ni para una
fracción de los equipos que hay hoy. La solución que se popularizó fue la del edificio: **un
solo número de calle hacia afuera y muchos números de puerta adentro**. Adentro de tu casa los
equipos usan direcciones que no significan nada para el resto del mundo (privadas); en el borde,
un equipo hace de conserje y traduce.

> **La idea madre de este manual:** NAT es el mecanismo que permite que TODA una red privada salga a Internet usando UNA sola dirección IP pública, reescribiendo las direcciones (y los puertos) en cada paquete que cruza el borde. Sin NAT, la red IPv4 actual — con sus ~4.300 millones de direcciones teóricas — ya habría colapsado hace décadas.

Fijate en las tres palabras importantes de esa frase, porque son el esqueleto del manual:

- **reescribiendo**: NAT no esconde ni bloquea; *cambia el texto* del sobre mientras pasa.
- **en cada paquete**: no una vez al conectarse, sino paquete por paquete, en los dos sentidos.
- **el borde**: la frontera entre "adentro mío" y "el resto de Internet". Es el router de tu casa,
  el firewall de la empresa o el equipo del proveedor.

### Lo que este manual va a destrabar

Ahora viene la parte que casi nadie explica bien: NAT no es solo "traducir direcciones". Podés comerte meses de carrera creyendo que es un simple buscar-y-reemplazar, y después te encontrás con llamadas VoIP que no entran, juegos que no conectan y cámaras que no se ven. Todo eso es el mismo fantasma: **NAT con un agujero, y cómo lograr que las comunicaciones en tiempo real lo atraviesen**. Al final del manual vas a entender por qué pasa y qué se hace en el mundo real (STUN, TURN, ICE) para resolverlo.

Acá van los dos términos de esa frase, así no te frenan después: **VoIP** (*Voice over IP*,
voz sobre IP) es hablar por teléfono usando la red de datos en vez de la red telefónica
tradicional; **tiempo real** quiere decir que la información sirve solo en el instante en que se
genera, y si llega tarde ya no se puede recuperar (el audio de una llamada, el video de una
videollamada, la posición de tu personaje en un juego).

Y esos tres nombres que aparecieron entre paréntesis son las herramientas que resuelven el problema:
**STUN** te dice cómo te ve el mundo desde afuera, **TURN** hace de relevo cuando no hay camino
directo e **ICE** prueba todas las opciones y elige la que funcione. Los desarrollamos enteros en el
capítulo 12.

### Resumen

- Una dirección IP es el identificador de un equipo en la red; en IPv4 hay unos 4.300 millones.
- Esas direcciones se quedaron cortas cuando cada casa y cada oficina empezó a tener decenas de equipos.
- La salida fue el edificio con un solo número de calle: una IP pública hacia afuera, muchas privadas adentro.
- El conserje que traduce entre esos dos mundos es NAT, y trabaja en el borde de la red.
- NAT no solo traduce direcciones: también tiene que recordar quién pidió qué, y ahí nacen todos los problemas.

---

## 2. Direcciones públicas y privadas: quién vive en qué vecindario

Antes de NAT, el repaso mínimo que necesitás tener firme:

- **IP pública:** única en el mundo, asignada por el proveedor de Internet (ISP). Es la "dirección postal" visible desde cualquier lugar de Internet.
- **IP privada:** usada dentro de la red local, no enrutable en Internet. Cualquier red del planeta puede usar los mismos rangos privados sin pisarse, porque nunca salen a la calle.

**ISP** son las siglas de *Internet Service Provider* (proveedor de servicio de Internet): la
empresa que te vende la conexión — la de la fibra que entra a tu casa, la del cable, la del
celular. Esa empresa es la única que puede darte una IP pública, y te la presta mientras seas
su cliente.

La diferencia entre pública y privada es la diferencia entre el número de calle y el número de
departamento. El número de calle tiene que ser único en la ciudad, si no el cartero no llega.
El número de departamento solo tiene que ser único dentro del edificio: que en otra ciudad
exista un "2B" no molesta a nadie, porque ese "2B" nunca aparece en un sobre que viaje por la
calle.

### Los rangos privados del estándar RFC 1918

Los rangos privados que define el estándar **RFC 1918**:

| Rango | Máscara | Espacio |
|-------|---------|---------|
| `10.0.0.0` – `10.255.255.255` | /8 | Enorme: 16,7 millones de direcciones |
| `172.16.0.0` – `172.31.255.255` | /12 | 1.048.576 direcciones |
| `192.168.0.0` – `192.168.255.255` | /16 | 65.536 direcciones (el clásico de los routers hogareños) |

**Qué es un RFC.** Un **RFC** (*Request for Comments*, pedido de comentarios) es un documento
del organismo que estandariza Internet (la IETF, *Internet Engineering Task Force*). A pesar
del nombre —que suena a borrador abierto a opiniones— un RFC publicado es la norma: si dice que
`192.168.x.x` es privado, es privado. **RFC 1918** es el documento que reservó estos tres
bloques de direcciones para uso interno, y por eso en la jerga se dice "una 1918" para hablar de
una dirección privada.

Ahora, columna por columna:

- **Rango:** las dos puntas del bloque, primera y última dirección. Entre `10.0.0.0` y
  `10.255.255.255` entran todas las direcciones que empiezan con `10.`. Ese es el bloque grande,
  el que usa una empresa o un datacenter.
- **Máscara:** cuántos bits de la izquierda están "fijos" y definen la red. Esa barra con un
  número (`/8`, `/12`, `/16`) se llama *prefijo* y es la forma corta de escribir la máscara de
  subred. Un `/8` fija 8 bits (el primer número) y deja 24 bits libres para equipos: 2^24 =
  16.777.216 direcciones. Un `/12` fija 12 bits y deja 20 libres: 2^20 = 1.048.576. Un `/16`
  fija 16 bits y deja 16 libres: 2^16 = 65.536. Cuanto más chico el número después de la barra,
  más grande el bloque.
- **Espacio:** cuántas direcciones utilizables tiene el bloque, ya calculado. Es la columna que
  te dice de un vistazo si el rango es para una casa o para una empresa.

**Qué mirar vos en pantalla:** si en la configuración de tu compu o de tu router ves una
dirección que empieza con `192.168.`, estás en una red privada, o sea adentro del edificio. Casi
seguro el router es `192.168.0.1` o `192.168.1.1`, y tu equipo es alguno de los siguientes
números. Ese dato ya te dice que para salir a Internet hace falta un conserje: tu equipo, solo,
no puede aparecer en Internet.

### Los otros dos rangos que te vas a cruzar

Además de esos, existen otros dos rangos que importan mucho en el mundo NAT:

| Rango | Qué es |
|-------|--------|
| `169.254.0.0/16` | **APIPA / link-local:** auto-asignada cuando no hay DHCP. Tu equipo se inventa una IP; funciona solo en el segmento local. |
| `100.64.0.0/10` | **Espacio compartido (RFC 6598):** lo usa el ISP cuando aplica CG-NAT (sección 10). Si tu router tiene una IP WAN de este rango, estás detrás de un NAT del proveedor. |

Dos siglas en esas filas, y las dos te van a salvar alguna tarde de soporte técnico:

- **APIPA** (*Automatic Private IP Addressing*, direccionamiento privado automático) y su nombre
  técnico **link-local**: cuando tu equipo arranca y no encuentra a nadie que le asigne una
  dirección, se inventa una del rango `169.254.x.x`. **DHCP** (*Dynamic Host Configuration
  Protocol*, protocolo de configuración dinámica de host) es justamente el servicio que asigna
  direcciones automáticamente en una red; si ese servicio no contesta, tu equipo se queda con la
  APIPA.
- **CG-NAT** (*Carrier-Grade NAT*, NAT de nivel de operador): el NAT gigante que corre el propio
  ISP, tema del capítulo 10. **WAN** (*Wide Area Network*, red de área amplia) es la pata del
  router que da hacia afuera; la de adentro se llama **LAN** (*Local Area Network*, red de área
  local).

Columna por columna de esa tabla:

- **Rango:** el bloque completo. `169.254.0.0/16` y `100.64.0.0/10` se leen con la misma lógica
  del `/16` y del `/12` de arriba: cuántos bits quedan fijos.
- **Qué es:** para qué existe el bloque y qué significa encontrarlo. Es la columna que hay que
  leer con atención: no son "rangos raros", son dos señales de diagnóstico.

**Qué mirar vos en pantalla:** una IP `169.254.x.x` en tu compu no es una IP de trabajo, es un
mensaje de error disfrazado. El cable está bien, pero nadie te dio dirección: revisá que el
router esté prendido o que el Wi-Fi al que te conectaste sea el tuyo. Una IP `100.64.x.x` en la
pata WAN del router es otra cosa: la conexión anda, pero estás detrás del NAT del proveedor.

### IP fija o cambiante: estática y dinámica

Y la pregunta que cruza todo el manual: ¿IP fija o cambiante? Tanto públicas como privadas pueden ser:

- **Estáticas:** siempre la misma. Imprescindible para servicios que RECIBEN conexiones (un servidor, una cámara).
- **Dinámicas:** cambian con el tiempo (el típico DHCP del ISP). Baratas, pero complican recibir conexiones entrantes.

La analogía: una **IP estática** es un número de teléfono fijo que figura en la guía y al que
cualquiera puede llamar cuando quiera. Una **IP dinámica** es un teléfono que cambia de número
cada tanto: funciona perfecto para vos, que llamás; es un desastre para el que necesita llamarte.

> **Regla para elegir (y la usamos en los escenarios de la sección 11):** si tu dispositivo solo INICIA conexiones hacia afuera (navegar, IoT que reporta, celular), una IP privada dinámica le alcanza. Si tu dispositivo debe RECIBIR conexiones desde Internet sin intermediarios (alojar un servidor, atender llamadas entrantes), ahí necesitás IP pública, port forwarding o un servicio de relevo.

Dos siglas de esa regla, para que no queden colgadas: **IoT** (*Internet of Things*, Internet de
las cosas) son los aparatos que se conectan solos para mandar o recibir datos —sensores,
medidores, cámaras, electrodomésticos— y **port forwarding** es "reenvío de puertos", la
configuración del router que dice "todo lo que llegue al puerto X, pasalo a tal equipo de
adentro". Ese segundo lo explicamos a fondo en el capítulo 11, cuando veamos qué se rompe.

### Resumen

- Una IP pública es única en el mundo y la presta el ISP; una IP privada solo vale dentro de tu red.
- Los rangos privados del RFC 1918 son `10.x.x.x`, `172.16` a `172.31` y `192.168.x.x`, cada uno con un tamaño distinto según su prefijo.
- `169.254.x.x` significa "nadie me dio dirección" (APIPA); `100.64.x.x` significa "estoy detrás del NAT del proveedor".
- Una IP estática sirve para recibir conexiones; una dinámica alcanza para iniciarlas.
- La máscara o prefijo (`/8`, `/12`, `/16`) dice cuántos bits identifican la red y, por lo tanto, cuántas direcciones entran.

---

## 3. Qué es NAT: el conserje que reescribe los sobres

**NAT** (*Network Address Translation*, Traducción de Direcciones de Red) es el proceso que traduce un conjunto de direcciones — típicamente las privadas de la red local — a otro conjunto — típicamente una o más públicas — y viceversa. Vive en el punto de borde: el router de tu casa, el firewall de la empresa, el router del proveedor.

Volviendo al edificio: cuando un departamento manda una carta, el conserje la saca reescribiendo el remitente con la dirección del edificio. Cuando llega la respuesta, la recibe él, mira su libreta (la **tabla NAT**) y la entrega al departamento correcto.

### El conserje que se acuerda de todo

La analogía conviene afinarla, porque de ahí sale el 90% de lo que viene después.

Hay un edificio con un solo número de calle. En la puerta hay un conserje con una libreta. Las
reglas del conserje son tres:

1. **Todo lo que sale lo firma él.** Si el 2B manda una carta, el conserje la reescribe y pone
   como remitente la dirección del edificio. Afuera nadie sabe que existe el 2B.
2. **Anota quién pidió qué.** En la libreta escribe: "carta que salió a las 14:03, era del 2B".
   Ese renglón es lo que después le permite entregar la respuesta.
3. **Lo que llega sin renglón, no entra.** Si toca el timbre un sobre dirigido a la dirección del
   edificio y en la libreta no hay nada anotado para ese sobre, el conserje no adivina: lo deja
   afuera. No es maldad, es que no tiene a quién entregárselo.

Ese punto 3 es el que hay que entender de verdad, porque explica casi todos los problemas que
vas a vivir: **NAT no es una puerta cerrada, es un conserje con una libreta**. Si la conversación
la empezó alguien de adentro, la libreta tiene el renglón y la respuesta entra. Si la conversación
la quiere empezar alguien de afuera, no hay renglón, y el conserje descarta.

### Los tres pasos, dibujados

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

**Qué es este dibujo.** No es un comando: es un esquema de tiempo. Hay tres columnas —tu PC a la
izquierda, el router en el medio, el servidor de Google a la derecha— y cada renglón es un momento
de la conversación. Las flechas horizontales son paquetes viajando. **Paquete** es la unidad en
que viaja todo por una red: un sobrecito con una dirección de origen, una de destino y un pedazo
de datos adentro.

Línea por línea:

- `PC (192.168.1.20)`: el equipo que inicia. Entre paréntesis va su dirección privada, la que
  solo vale dentro de tu casa.
- `Router con NAT`: el conserje, en el medio. Todo lo que va y viene pasa por él.
- `Servidor web en Internet`: el destino, del otro lado del mundo.
- `"Quiero google.com"`: el contenido del pedido. En la realidad no dice eso: es la abstracción
  de "abrí una página web". Lo que importa es lo que viene en el renglón siguiente.
- `Origen: 192.168.1.20`: la dirección que el paquete lleva escrita como remitente cuando sale de
  tu PC. Si ese paquete llegara así a Internet, el servidor no sabría a dónde contestar: las
  direcciones privadas no existen para el resto del mundo.
- `Reescribe el origen: Origen: 203.0.113.5`: acá está NAT, en una sola línea. El router cambia
  el remitente por su propia dirección pública antes de dejar salir el paquete.
- `Respuesta para "203.0.113.5"`: el servidor contesta a la dirección que vio, que es la del
  router. Tu PC, para el servidor, no existe.
- `Busca en la tabla NAT: "esta conexión era de 192.168.1.20"`: el router recibe la respuesta y
  consulta la libreta. Ahí está anotado que esa conversación la había iniciado tu PC.
- `Destino: 192.168.1.20`: el router reescribe el destino y entrega el paquete a tu equipo. Para
  tu PC, la conversación nunca tuvo intermediarios: mandó un pedido y recibió una respuesta.
- `¡Anda!`: el navegador muestra la página. Todo lo anterior pasó en milisegundos y sin que nadie
  lo notara.

**Qué mirar vos en pantalla:** nada, y esa es justamente la gracia. NAT es invisible cuando
funciona. Solo te enterás de que existe cuando algo que *debería* entrar desde afuera no entra.

Dos siglas del dibujo que vas a ver en todos lados: la dirección `203.0.113.5` es una IP pública,
y las direcciones `203.0.113.x`, `198.51.100.x` y `192.0.2.x` están reservadas por los estándares
para usarse en ejemplos y documentación. Si ves una de esas en un manual, es un ejemplo: no existe
en la Internet real.

### Las dos caras del router de borde

El router de borde tiene dos caras:

- **Interfaz interna** (LAN): cara a las direcciones privadas `192.168.x.x`.
- **Interfaz externa** (WAN): cara a la Internet pública, con la IP asignada por el ISP.

**Interfaz**, en este contexto, es el conector lógico por donde el router participa de una red:
puede ser un puerto físico (el cable) o una interfaz inalámbrica. El router tiene una pata
adentro —donde habla `192.168.1.x` con tus equipos— y una pata afuera, donde le habla al mundo con
la dirección que le dio el ISP. Todos los equipos de tu casa comparten esa pata de afuera. Esa es
toda la magia, y también toda la limitación.

**Cuando un paquete sale** (privada → pública): NAT reescribe la dirección de origen y, si hace falta, el puerto. **Cuando la respuesta entra** (pública → privada): NAT consulta su tabla y reescribe el destino al dispositivo correcto de adentro.

### El detalle que cambia todo: NAT es stateful

> **Momento clave para no marearse:** NAT es *stateful*: recuerda las conexiones en curso. Solo reescribe y entrega paquetes que corresponden a una conexión que alguien de adentro inició. Si un paquete entra sin que exista una entrada en la tabla → se descarta. Ese "por defecto se descarta" es lo que da origen al viejísimo mito de que "NAT es un firewall" (sección 7, ahí lo vemos con honestidad).

**Stateful** significa "con estado": el equipo guarda memoria de lo que está pasando. Lo contrario
es **stateless**, "sin estado": cada paquete se decide solo, sin mirar atrás. Un router que
solamente mira direcciones para decidir por dónde mandar un paquete es stateless; el NAT de ese
mismo router no lo es, porque necesita recordar la conversación que abrió cada renglón de la
libreta.

Y como la libreta tiene memoria, tiene también vencimiento: si una conversación queda inactiva
mucho tiempo, el renglón se borra para liberar lugar. Ese tiempo de vencimiento es la razón por la
cual una conexión "abierta" puede morirse sola si nadie la usa, y por la que las aplicaciones de
tiempo real mandan paquetitos periódicos para mantenerla viva.

### Dónde vive NAT en el mundo real

En un hogar, NAT vive en el router que te dio el ISP (o en el que compraste y pusiste en su
lugar). En una empresa, vive en el firewall o en el router de borde, a veces con reglas distintas
por red interna. En un proveedor, vive en equipos diseñados para traducir millones de
conversaciones a la vez (capítulo 10). En un celular, vive en el equipo de la red móvil, siempre.

Lo importante: **NAT no es un programa que instalás, es una función del equipo que está en el
borde**. Y cada borde tiene su propia libreta, independiente de las demás.

### Resumen

- NAT traduce direcciones privadas a una dirección pública al salir, y al revés al volver.
- La analogía es un conserje con una libreta: reescribe el remitente y anota quién pidió qué.
- El router de borde tiene dos caras: LAN (adentro, privada) y WAN (afuera, pública).
- NAT es stateful: si el paquete entrante no tiene renglón en la libreta, se descarta en silencio.
- Esa libreta explica todo: lo que sale funciona, lo que quiere entrar sin permiso no entra.

---

## 4. El problema del puerto: por qué existe PAT

Ahora la pregunta inevitable: el conserje reparte cartas mirando el **nombre** del destinatario. ¿Y si dos departamentos mandan cartas al mismo tiempo y cuando llegan las respuestas son idénticas salvo el nombre que el conserje borró?

Pongámoslo técnico. Dos hosts de la red, A y B, abren cada uno una conexión al MISMO servidor, desde el MISMO puerto de origen, al MISMO tiempo:

```
A → 192.168.1.10 : 1000  →  servidor : 80
B → 192.168.1.11 : 1000  →  servidor : 80
```

Antes de explicar ese bloque hay que definir la palabra que aparece dos veces: **puerto**.

### Qué es un puerto

Una dirección IP identifica un **equipo**. Un puerto identifica **una conversación dentro de ese
equipo**. Es un número de 0 a 65535 que viaja junto con la dirección, y su función es que la
computadora sepa a qué programa entregar el paquete que llegó.

La analogía: la IP es la dirección del edificio y el puerto es la ventanilla. En la misma dirección
puede haber una ventanilla de correo, una de pagos y una de reclamos; el sobre dice "edificio tal,
ventanilla 3" y así llega a la persona correcta. Un mismo equipo, con una sola IP, puede estar
manteniendo decenas de conversaciones a la vez: cada una tiene su ventanilla.

En el bloque de arriba, el `: 80` del final es el puerto del servidor. El 80 es el puerto
convencional del servicio web; ver un 80 en el destino significa "este paquete va a un servidor
web". Y el `: 1000` es el puerto de origen: la ventanilla que el equipo de origen eligió para
recibir la respuesta. Los puertos de origen suelen ser números altos elegidos al azar por el
sistema; los de destino son los que identifican el servicio (80 web, 443 web cifrada, 53 DNS, 22
SSH).

Los dos protocolos de transporte que usan puertos, y que vas a ver nombrados en todas las tablas:

- **TCP** (*Transmission Control Protocol*, protocolo de control de transmisión): transporte
  confiable y ordenado, con confirmaciones y retransmisión. Es el que usan las páginas web, el
  correo, las descargas: si falta un pedazo, se vuelve a pedir.
- **UDP** (*User Datagram Protocol*, protocolo de datagramas de usuario): transporte sin
  confirmación ni orden garantizado. Más liviano y más rápido, sin red de seguridad. Es el que
  usan el DNS, la voz, el video y los juegos.

**Qué mirar vos en pantalla:** cada línea de la tabla NAT del router, y cada fila de una captura de
tráfico, tiene un par dirección:puerto de cada lado. Si te acostumbrás a leer ese par como
"edificio:ventanilla", el resto del manual se vuelve mucho más liviano.

### El choque de ventanillas

Volviendo al problema: A y B están en equipos distintos, pero los dos eligieron la misma
ventanilla de origen (1000) y los dos van al mismo servidor. Si NAT solo tradujera direcciones IP, ambos paquetes saldrían como:

```
203.0.113.5 : 1000  →  servidor : 80     (¿de A o de B?)
203.0.113.5 : 1000  →  servidor : 80     (¿de A o de B?)
```

**Qué es este bloque.** Son los mismos dos paquetes de antes, ya traducidos por un NAT que
solamente cambia direcciones. Comparalo con el bloque anterior: lo único que cambió fue
`192.168.1.10` y `192.168.1.11` por `203.0.113.5` en los dos renglones.

El resultado se lee así:

- Los dos renglones son **idénticos**. El par dirección:puerto de origen ya no distingue a A de B.
- El paréntesis `(¿de A o de B?)` no es parte del paquete: es la pregunta que el router no puede
  contestar cuando vuelva la respuesta.
- La seta `→` indica la dirección del viaje: sale de tu red, va al servidor.

Cuando el servidor responda a `203.0.113.5:1000`, el conserje mira la libreta y... hay DOS entradas idénticas. Imposible saber a quién entregar. Respuesta de la respuesta se pierde, y las dos conexiones fallan.

Traducido al edificio: dos departamentos mandaron cartas y el conserje, al reescribir el
remitente, borró el nombre. Cuando vuelven las respuestas, tiene dos sobres iguales y una libreta
con dos renglones iguales. No hay forma de saber cuál va al 2B y cuál al 5A.

### La solución: traducir también el puerto

La solución es la que hace funcionar a Internet tal como la conocemos: **PAT** (*Port Address Translation*, también llamado *NAT overload*). Además de la dirección IP, NAT reescribe el **puerto de origen** para que cada conexión sea única:

```
A → (192.168.1.10 : 1000)  se traduce a  (203.0.113.5 : 40512)
B → (192.168.1.11 : 1000)  se traduce a  (203.0.113.5 : 40513)
```

**Qué es este bloque.** El mismo escenario, ahora con PAT. Cada renglón dice: "lo que salía así,
sale así". Los paréntesis agrupan el par dirección:puerto; la flecha del medio es la traducción;
el `+` de la etiqueta es un `se traduce a` en palabras.

- Renglón 1: A salía con `192.168.1.10:1000` y ahora sale con `203.0.113.5:40512`.
- Renglón 2: B salía con `192.168.1.11:1000` y ahora sale con `203.0.113.5:40513`.
- Fijate en el detalle fino: el puerto de origen **cambió** (1000 → 40512 y 40513). Ese cambio es
  lo que PAT agrega sobre NAT. El puerto del servidor (`: 80`, que no aparece acá pero sigue
  igual) no se toca.

Ahora cada entrada de la tabla es única: el par `203.0.113.5:40512` identifica exactamente la conexión de A, y `203.0.113.5:40513` la de B. Las respuestas llegan, el conserje mira el puerto y entrega sin dudar.

El conserje ahora tiene una libreta que sí sirve: "ventanilla 40512 = departamento 2B",
"ventanilla 40513 = departamento 5A". Cuando vuelve una respuesta a la ventanilla 40512, no hay
duda posible.

### Cuántos agujeros entran en una dirección

> **La idea para llevarte a casa:** un puerto TCP o UDP tiene 16 bits → 65.535 valores. Con PAT, una sola IP pública puede sostener hasta 65.535 conexiones simultáneas *por cada puerto en uso* (en la práctica, menos por otros límites del sistema). Por eso un router hogareño con UNA IP pública sirve para una casa entera, y por eso el agotamiento de IPv4 no derrumbó Internet: la combinación IP+puerto multiplica el espacio utilizable.

Una aclaración honesta sobre ese número, porque conviene tener la cuenta bien: 16 bits dan
**65.536** valores posibles (de 0 a 65.535), y en la práctica el 0 no se usa para conexiones, así
que quedan **65.535** utilizables. La diferencia no cambia la conclusión: con una sola IP pública
y el espacio de puertos encima, una casa entera navega sin problemas.

La clave conceptual para llevarte: una conexión no se identifica con la IP sola, se identifica con
**la cuádrupla** origen-IP, origen-puerto, destino-IP, destino-puerto. Mientras esas cuatro cosas
sean distintas, dos conversaciones no se confunden. NAT solo tiene que poder cambiar una de ellas
—el puerto de origen— para que la cuádrupla sea única.

### Resumen

- Una dirección IP identifica un equipo; un puerto identifica la conversación dentro de ese equipo.
- Si NAT tradujera solo direcciones, dos equipos con el mismo puerto de origen quedarían indistinguibles.
- PAT traduce además el puerto de origen, y con eso cada conversación queda identificada sin ambigüedad.
- Hay 65.535 puertos utilizables por dirección, y por eso una sola IP pública alcanza para toda una casa.
- La identidad de una conexión es la cuádrupla origen-IP, origen-puerto, destino-IP, destino-puerto.

---

## 5. Tipos de NAT

Hay tres sabores, y entender sus diferencias te ahorra horas de troubleshooting:

Los tres resuelven el mismo problema —muchos equipos adentro, pocas direcciones afuera— pero con
reglas distintas. La diferencia práctica se resume en dos preguntas: **¿cuántas IP públicas se
gastan?** y **¿qué pasa cuando alguien de afuera quiere iniciar la conversación?**.

### 5.1. NAT estática (1:1)

Una dirección privada se asocia a UNA pública fija, de forma permanente:

```
192.168.1.50 (servidor)  ↔  203.0.113.10 (pública fija)
```

**Qué es este bloque.** Una sola línea, una sola regla: "esta dirección de adentro es siempre esta
dirección de afuera".

- `192.168.1.50 (servidor)`: el equipo de adentro, con nombre entre paréntesis para que se lea
  qué rol cumple.
- `↔`: la flecha de doble punta quiere decir "en los dos sentidos". No es una traducción que se
  arma al vuelo: la equivalencia está escrita de antemano.
- `203.0.113.10 (pública fija)`: la dirección de afuera. "Fija" es la palabra clave: no se presta
  ni se negocia, es siempre la misma.

El `1:1` del título se lee "uno a uno": una privada por cada pública. Diez servidores expuestos
necesitan diez públicas.

- **Cuándo se usa:** hosting de servicios (web, mail, cámara) que necesitan ser alcanzables SIEMPRE desde el mismo lugar.
- **Costo:** cada equipo expuesto consume una IP pública. Con muchas, sale caro.
- **Detalle fino:** como la asociación es fija, las conexiones ENTRANTES funcionan sin reenvíos raros: cualquier paquete a `203.0.113.10` va directo al servidor interno.

**Qué mirar vos en pantalla:** en el panel del router, la NAT estática aparece como una lista de
pares "adentro ↔ afuera". Si ves una regla de este tipo, el equipo de adentro es alcanzable desde
Internet sin que nadie tenga que hacer nada raro. Es la forma más limpia de exponer un servicio, y
la más cara en direcciones.

### 5.2. NAT dinámica (pool)

Hay un conjunto (pool) de IPs públicas. Un dispositivo interno pide salir, y NAT le presta UNA pública del pool mientras dura la conexión:

```
Pool: 203.0.113.20 – 203.0.113.29  (10 públicas)
192.168.1.10 → 203.0.113.21  (prestada)
192.168.1.11 → 203.0.113.22  (prestada)
```

**Qué es este bloque.** Tres renglones con roles distintos:

- `Pool: 203.0.113.20 – 203.0.113.29  (10 públicas)`: el inventario disponible. El guion entre las
  dos direcciones es un rango, y el paréntesis te confirma cuántas hay: diez.
- `192.168.1.10 → 203.0.113.21  (prestada)`: el equipo de adentro se quedó, por ahora, con la
  primera del pool.
- `192.168.1.11 → 203.0.113.22  (prestada)`: el segundo equipo, con la siguiente.

La palabra `prestada` es la que hay que subrayar: nadie es dueño de esa dirección. Se presta
mientras dura la conexión y vuelve al pool cuando termina, como una biblioteca.

- **Limitación clave:** si el pool se agota, el siguiente dispositivo... se queda afuera. El paquete se descarta.
- **Cuándo se usa:** redes donde la mayoría inicia conexiones salientes y conviene repartir la carga entre varias públicas.
- **Costo:** sigue necesitando varias públicas. En la era de la escasez de IPv4, quedó poco usado salvo en grandes empresas.

Fijate en la diferencia con la estática: acá no hay equivalencia fija. El equipo que hoy sale con
`203.0.113.21` mañana puede salir con otra, y eso rompe cualquier cosa de afuera que apunte a una
dirección puntual. `Pool` (*pool* es "pila" o "reserva" en inglés) se usa en informática para
nombrar un conjunto de recursos que se prestan y se devuelven.

**Qué mirar vos en pantalla:** en un equipo hogareño casi no vas a ver esto. Si lo ves, estás en
una red grande. La señal de que el pool se agotó es desagradable y clara: algunas conexiones
nuevas simplemente no salen, sin mensaje de error.

### 5.3. PAT: el campeón indiscutido

Todo el mundo lo usa sin saber su nombre. Es el NAT del router de tu casa: **muchísimas direcciones privadas → una única IP pública**, diferenciadas por puerto:

```
192.168.1.10:1000 → 203.0.113.5:40512
192.168.1.11:1000 → 203.0.113.5:40513
192.168.1.12:5000 → 203.0.113.5:40514
```

**Qué es este bloque.** Tres conexiones reales, tres traducciones. Leelo de izquierda a derecha
como "lo que el equipo mandó → lo que salió del router":

- Los tres renglones salen por **la misma** IP pública, `203.0.113.5`. Ahí está el ahorro: una
  sola dirección para todo el edificio.
- Los puertos de la derecha (`40512`, `40513`, `40514`) son todos distintos. Eso es lo que hace
  PAT: inventa una ventanilla única en la fachada para cada conversación.
- Fijate en el tercer renglón: el equipo de adentro usó el puerto `5000` y salió igual con `40514`,
  porque el `5000` de la fachada ya estaba ocupado. Ese es el comportamiento que sigue.

Comportamiento real:

1. PAT **preserva el puerto de origen** si puede: si el dispositivo usó el puerto 5000 y el 5000 está libre en la pública, lo deja igual.
2. Si el puerto ya está en uso por otra conexión, toma el **siguiente disponible** (5001, 5002...).
3. Sigue así hasta agotar puertos — evento que en la práctica casi nunca ocurre en entornos hogareños.

Esos tres puntos son la política de asignación de ventanillas. El primero es una cortesía: si el
puerto está libre, se mapea igual, porque así muchos protocolos que arrastran el número de puerto
dentro de sus mensajes (el caso clásico es la telefonía IP, capítulo 12) siguen funcionando sin
ayuda extra. El segundo y el tercero son la consecuencia lógica: cuando no hay ventanilla libre,
se busca otra; cuando no queda ninguna, la conexión nueva no sale.

> **Por qué gana PAT:** miles de usuarios, una sola IP pública, costo mínimo y sin gestión. Es EL motivo por el cual millones de routers caseros funcionan con una única dirección del ISP.

**Qué mirar vos en pantalla:** si entrás al panel de tu router y buscás la sección de NAT o de
"reenvío de puertos", vas a ver una lista de traducciones con puertos altos tipo el de arriba.
Esa lista es PAT trabajando. Los números de puerto de la derecha cambian todo el tiempo: no son
configuración tuya, son la libreta llenándose y vaciándose sola.

### Resumen

- NAT estática es uno a uno y fija: sirve para exponer un servidor y cuesta una IP pública por equipo.
- NAT dinámica presta direcciones de un pool mientras dura la conexión; si el pool se agota, el tráfico nuevo se descarta.
- PAT es el que usás en tu casa: muchas privadas salen por una sola pública, distinguidas por puerto.
- PAT intenta conservar el puerto de origen y, si está ocupado, toma otro.
- Las tres variantes gastan distinta cantidad de direcciones públicas y tratan distinto las conexiones entrantes.

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

**Qué es este bloque.** Es la tabla NAT mostrada como tres bloques de columnas unidos por flechas
de doble punta. Cada renglón es una conversación viva en este instante.

Columna por columna:

- **Dispositivo interno** (primera columna): la dirección privada y el puerto de origen del equipo
  de tu red que empezó la conversación. `192.168.1.20:51000` se lee "el equipo `.20`, ventanilla
  51000". Ese puerto lo eligió el sistema operativo del equipo, no vos.
- **Público traducción** (segunda columna): la dirección pública y el puerto con los que esa
  conversación sale a Internet. La IP es siempre la misma para todos los renglones (eso es PAT); el
  puerto es único por conversación.
- **Destino externo** (tercera columna): a dónde va la conversación, con la IP del servidor de
  afuera y el puerto de su servicio. Acá el puerto sí tiene significado fijo: `53` es **DNS**
  (*Domain Name System*, sistema de nombres de dominio: el servicio que traduce `google.com` a una
  dirección IP), `443` es web cifrada, `22` es **SSH** (*Secure Shell*, intérprete seguro: el
  servicio que te deja abrir una terminal remota en otro equipo).
- **Las flechas `←→`**: no son un viaje, son una equivalencia. Dicen "esto de acá es lo mismo que
  esto de allá". Por eso están en los dos sentidos: la traducción sirve para ir y para volver.
- **Los paréntesis del final** (`DNS`, `web`, `SSH`): pistas de para qué es cada conversación. Es
  la única columna que un router no te muestra: es ayuda para leer el ejemplo.

**Qué mirar vos en pantalla:** si vieras esta tabla en tu router, la columna del medio te dice qué
está pasando ahora mismo en tu casa: un pedido de nombre (DNS), una página cifrada (web) y una
sesión de terminal (SSH) hacia otro equipo. Y te dice algo más importante: **tres equipos distintos
comparten un solo `203.0.113.5`, y las respuestas no se confunden**, porque cada uno tiene su
puerto en la columna del medio.

Que esa tabla exista y esté completa es lo que permite que las RESPONSES entren. Regla de oro:

> **NAT solo traduce tráfico que tiene entrada en la tabla.** Entrada = alguien de adentro inició la conversación (o un admin configuró un reenvío de puertos). Sin entrada, el paquete entrante se descarta en silencio.

**Descartar en silencio** significa sin avisar: no hay un mensaje de error que diga "te bloqueé",
no hay un rebote. El paquete simplemente se tira, y del otro lado la aplicación se queda esperando
hasta que se cansa y muestra un "no se pudo conectar". Por eso este tipo de problema es tan
frustrante de diagnosticar: desde adentro todo parece andar.

Los routers modernos lo hacen con **conexiones / flujos** (no entradas por paquete): cuando el primer paquete de una conexión sale, se crea la entrada; la respuesta usa la misma entrada; y cuando la conexión termina (FIN, RST o timeout), la entrada se borra. El estado se refresca con cada paquete que pasa — igual que el aging time de las MACs que ya viste en los switches, pero a nivel de conexión.

### Las palabras de ese párrafo, una por una

- **Flujo** (*flow*): todas las conversaciones que comparten la misma cuádrupla de origen y destino.
  En vez de anotar un renglón por cada paquete, el router anota un renglón por flujo y lo reutiliza.
  Es la diferencia entre anotar cada carta que sale y anotar "abrí una cuenta con tal remitente".
- **FIN y RST**: son señales de TCP, el protocolo confiable. `FIN` (*finish*) es "terminé, cerremos
  ordenadamente"; `RST` (*reset*) es "cortá todo, algo se rompió". Cuando llega cualquiera de las
  dos, la conversación terminó y el renglón de la libreta ya no hace falta.
- **Timeout**: el vencimiento por inactividad. Si durante N minutos no pasa ningún paquete de esa
  conversación, se borra el renglón aunque nadie haya dicho FIN.
- **MAC** (*Media Access Control*): la dirección física de una tarjeta de red, un número fijo que
  viene grabado en el hardware. Los switches (los equipos que conectan los cables de una misma red
  local) también tienen una tabla con vencimiento: aprenden por qué puerto se ve cada MAC y borran
  lo que no se usa hace un rato. La lógica es idéntica a la de la tabla NAT, pero con direcciones
  físicas en vez de conversaciones.

### Qué es el reenvío de puertos, y por qué está en esta misma tabla

Si la regla de oro es "solo entra lo que tiene renglón", hay una consecuencia obvia: para que algo
entre desde afuera, alguien tiene que **fabricar el renglón a mano**. Eso es el **reenvío de
puertos** (*port forwarding*): una regla fija que le dice al router "todo lo que llegue a la
dirección pública en el puerto 8080, entregalo siempre al `192.168.1.80`, ventanilla 80".

Fijate que esa regla es exactamente una fila de la tabla NAT, pero escrita por vos y sin
vencimiento. La diferencia con las filas automáticas es la dirección: las filas automáticas nacen
de adentro hacia afuera; la regla de reenvío hace lo contrario, permite que el primer paquete
venga de afuera.

Eso tiene una consecuencia que vas a ver en el capítulo 10 y que explica miles de "abrí los
puertos y no funciona": el reenvío de puertos apunta a una IP pública que el router cree tener.
Si el router está, a su vez, detrás del NAT del proveedor, esa dirección no es la que se ve desde
Internet, y la regla apunta a la nada.

### Un ejemplo de ida y vuelta, contado

Para que la tabla deje de ser abstracta: abrís `google.com` en el celular.

1. El celular pide un nombre al DNS: sale un paquete a `8.8.8.8:53` desde `192.168.1.20:51000`.
2. El router anota el renglón y lo manda como `203.0.113.5:40512`.
3. Vuelve la respuesta a `203.0.113.5:40512`. El router busca ese puerto, ve que era del `.20` y
   se lo entrega.
4. El celular ahora conoce la dirección del servidor y abre una conexión web a `:443`. Nuevo
   renglón, nuevo puerto de fachada.
5. Cuando cerrás la pestaña, los flujos terminan (FIN) y los renglones se borran.

Todo eso, tres veces por página, sin que lo notes.

### Resumen

- La tabla NAT tiene tres columnas: equipo interno, traducción pública y destino externo.
- Cada renglón es una conversación viva, identificada por IP y puerto de cada lado.
- Solo entra lo que tiene renglón; lo que no lo tiene se descarta sin avisar a nadie.
- Los renglones nacen de adentro hacia afuera y se borran con FIN, RST o por inactividad.
- El reenvío de puertos es un renglón escrito a mano que permite que la conversación empiece desde afuera.

---

## 7. NAT y seguridad: lo que da y lo que NO da

Hay una frase que se repite en foros y cursos, y conviene desarmarla con honestidad: **"NAT es una capa de seguridad"**. Verdad a medias.

La analogía del edificio sirve para ver por qué es a medias. Que nadie sepa cuántos departamentos
hay, ni quién vive en cada uno, es un beneficio real: un desconocido no puede ir a golpear la
puerta del 2B porque ni sabe que existe. Pero el conserje no revisa documentos, no pregunta a
qué viene cada visita y no anota nada para el registro. Si el 2B le dice "dejá entrar a este
señor", el conserje lo deja pasar sin chistar.

**Lo que SÍ es cierto:**

- Oculta las direcciones internas: nadie desde afuera ve `192.168.1.50`; solo ve la pública.
- Por defecto descarta tráfico entrante no solicitado: sobreviven menos escaneos de puertos y menos intentos directos contra dispositivos internos.
- Dificulta mapear tu red: un atacante no sabe cuántos equipos hay ni dónde.

**Lo que NO es cierto:**

- NAT **no es un firewall**. Un firewall toma decisiones por política (quién, qué protocolo, qué aplicación, a qué hora) y registra/audita. NAT solo traduce direcciones. Es como decir que la puerta del edificio "protege" porque nadie ve los departamentos — pero si un vecino abre la puerta a un extraño (vulnerabilidad, puerto abierto por reenvío, malware que inicia conexión), el conserje no lo va a frenar.
- La ocultación no resiste ataques que usen conexiones salientes (la enorme mayoría del malware funciona así).
- El mito se derrumba con IPv6: con IPv6 las direcciones globales abundan, NAT puede no existir, y aún así un buen firewall sigue siendo imprescindible.

Definamos el término que aparece en el primer punto, porque es el corazón del asunto: un
**firewall** (cortafuegos) es un equipo o programa que decide, según reglas escritas, qué tráfico
pasa y qué no, y que además puede dejar registro de lo que vio. La diferencia con NAT es de
naturaleza, no de grado: NAT decide **a quién entregar**; el firewall decide **si corresponde
entregar**.

> **La conclusión madura:** NAT reduce la superficie de exposición, sí — tómala como un beneficio gratis, pero la seguridad real son dos cosas: (1) un firewall correctamente configurado en el borde, y (2) los dispositivos parcheados y endurecidos. Ocultar no es proteger.

**Qué mirar vos en pantalla:** si en el panel de tu router hay una sección de firewall separada de
la de NAT (casi siempre la hay), esa es la que filtra de verdad. NAT, en cambio, no tiene reglas
que configurar para "protegerse": su descarte por defecto es una consecuencia del diseño, no una
política que vos elegiste.

### Resumen

- NAT oculta las direcciones internas y descarta lo que nadie pidió: eso reduce la exposición.
- NAT no decide por política ni deja registro; eso es trabajo de un firewall.
- El malware que inicia conexiones salientes no se ve afectado por NAT.
- En IPv6 puede no haber NAT y la necesidad de firewall no cambia.
- Regla mental: ocultar no es proteger.

---

## 8. Ventajas y desventajas

Nada es gratis. NAT resolvió el problema de las direcciones y a cambio cobró una factura que
pagás cada vez que querés que algo entre desde afuera. Acá están las dos caras.

### Lo bueno

| Ventaja | Por qué |
|---------|---------|
| **Ahorro de direcciones** | Miles de dispositivos internos con una sola IP pública (PAT) |
| **Seguridad pasiva** | Oculta la topología interna y descarta lo no solicitado |
| **Menos costos** | Pocas (o una) públicas = menos contratos, menos gestión |
| **Flexibilidad** | Podés cambiar de proveedor o de esquema público sin retocar la red interna: los equipos siguen en privado |
| **Balanceo sencillo** | Varias públicas en pool: si una cae, otra toma el tráfico |

**Cómo leer esta tabla.** Tiene dos columnas:

- **Ventaja:** el nombre corto del beneficio. La negrita es solo para que lo escanees rápido.
- **Por qué:** la justificación concreta. Es la columna que hay que leer si el nombre no te dice
  nada.

Renglón por renglón, en lenguaje llano:

- *Ahorro de direcciones*: la razón por la que NAT existe. Una pública para toda la casa.
- *Seguridad pasiva*: "pasiva" es la palabra importante. No es seguridad que alguien configuró;
  es un efecto secundario de cómo funciona. Oculta el mapa y tira lo no pedido.
- *Menos costos*: cada IP pública es un recurso que el ISP cobra o limita. Una sola es la cuenta
  más barata posible.
- *Flexibilidad*: como tus equipos usan direcciones privadas, cambiar de ISP —o de esquema de
  direccionamiento hacia afuera— no te obliga a retocar ni una máquina de adentro.
- *Balanceo sencillo*: si tenés varias públicas en un pool, repartís la salida entre ellas y si una
  se cae el tráfico sigue por las otras. Para un hogar es irrelevante; para una empresa, no.

**Qué mirar vos en pantalla:** ninguna de estas ventajas se "ve". Se ven las desventajas —cuando
un servicio no conecta— y se agradecen las ventajas en la factura del ISP.

### Lo malo

| Desventaja | Por qué |
|------------|---------|
| **Rompe la conectividad de punta a punta** | El modelo original de Internet asumía que cualquiera podía iniciar una conexión hacia cualquiera. NAT lo elimina: nadie "empuja" hacia adentro |
| **Latencia extra** | Cada paquete se inspecciona, se consulta la tabla, se reescribe. Hojas de ruta añadidas en cada cruce |
| **Problemas con protocolos que no toleran el cambio de dirección** | Firmas digitales, IPsec (verifica integridad de los encabezados que NAT modifica), FTP pasivo, SIP... |
| **Pérdida de trazabilidad** | Entre dos CG-NAT, un paquete cambió de dirección dos o tres veces: rastrear la origen real es un dolor |
| **Complejidad de configuración** | Reglas de reenvío por aplicación, puertos estáticos, ALG que rompe más de lo que arregla |
| **Conexiones entrantes sufren** | Servicios que deben RECIBIR conexiones requieren reenvío de puertos, DMZ o VPN — y aun así fallan en ciertos escenarios (juegos P2P, VoIP) |

**Cómo leer esta tabla.** Mismas dos columnas que la anterior: el nombre de la desventaja y el
motivo. La diferencia es que acá cada renglón es un problema que vas a reconocer en el mundo real.

Renglón por renglón, con la sigla que aparezca ya definida:

- *Rompe la conectividad de punta a punta*: "punta a punta" (*end to end*) es el principio de
  diseño original de Internet: cualquier equipo podía hablar con cualquier otro sin pedir permiso
  a nadie en el medio. NAT mete un intermediario obligatorio y con eso rompe el principio.
- *Latencia extra*: **latencia** es el tiempo que tarda un paquete en ir y volver. Cada paquete
  paga un peaje: mirar la tabla, decidir, reescribir. Es poco por paquete, pero se multiplica por
  millones.
- *Protocolos que no toleran el cambio de dirección*: algunos protocolos meten direcciones y
  puertos **dentro** de los datos, o firman los encabezados para verificar que nadie los tocó. Si
  NAT reescribe un encabezado, la firma deja de cerrar. **IPsec** (*Internet Protocol Security*)
  es la familia de protocolos que cifra y autentica tráfico IP y sufre justamente por eso; **FTP**
  (*File Transfer Protocol*, protocolo de transferencia de archivos) tiene un modo "pasivo" que
  negocia puertos aparte y también se enreda.
- *Pérdida de trazabilidad*: si un usuario hizo algo indebido, hay que poder saber qué equipo era.
  Con NAT, un registro muestra la IP pública y un puerto que ya venció y se reasignó: la pista se
  enfría.
- *Complejidad de configuración*: hay que abrir puertos a mano por aplicación, fijar direcciones
  para que las reglas no se rompan, y lidiar con los **ALG** (*Application Layer Gateway*, pasarela
  de capa de aplicación): un ayudante automático del router que reescribe protocolos y que, en su
  versión hogareña, suele romper más de lo que arregla (capítulo 12).
- *Conexiones entrantes sufren*: el tema central del manual. La solución clásica es **DMZ**
  (*DeMilitarized Zone*, zona desmilitarizada): una subred separada donde se pone el equipo
  expuesto para que, si lo comprometen, no tenga acceso directo a la red interna. **VPN** (*Virtual
  Private Network*, red privada virtual) es un túnel cifrado que te hace aparecer como si estuvieras
  dentro de otra red; **P2P** (*peer to peer*, entre pares) es la comunicación directa entre dos
  equipos sin servidor central, la que usan los juegos y las descargas colaborativas.

**Qué mirar vos en pantalla:** el renglón que te va a tocar es el último. Los demás se sienten como
"todo un poco más lento"; ese se siente como "no funciona y no sé por qué".

### Resumen

- NAT ahorra direcciones, plata y gestión, y oculta la red interna como efecto secundario.
- A cambio, rompe la conectividad de punta a punta: el que está afuera ya no puede iniciar.
- Suma latencia, complica protocolos que llevan direcciones dentro de los datos y borra la trazabilidad.
- La factura se paga en configuración: reenvíos de puertos, direcciones fijas y ayudantes que fallan.

---

## 9. Impacto en el rendimiento

Dos caras, otra vez:

- **Reduce carga de direcciones:** una sola pública sostiene toda la LAN; la asignación de IPs se vuelve trivial. Eso además permite "equilibrio": con pocas públicas bien administradas se sirve a mucha gente.
- **Pero suma latencia y puede saturar:** en redes con mucho tráfico simultáneo (una oficina con PAT, un ISP con CG-NAT), la traducción constante es CPU y memoria del router. Si las tablas se llenan o el equipo es chico, aparece congestión: paquetes descartados, retransmisiones y una experiencia que se siente "pesada" — especialmente en aplicaciones de tiempo real (videollamadas, juegos), que no toleran bien el jitter.

Tres palabras de ese párrafo que conviene tener claras:

- **CPU** (*Central Processing Unit*, unidad central de proceso): el chip que hace las cuentas.
  Traducir es hacer cuentas, y las cuentas cuestan.
- **Memoria**: donde vive la tabla NAT. Cada conversación viva ocupa un renglón; miles de
  conversaciones ocupan miles de renglones.
- **Jitter**: la variación del retraso. No es que los paquetes lleguen tarde, es que llegan
  **desparejos**: uno a 20 ms, el siguiente a 90 ms. Para una descarga da igual (se reordena), para
  una videollamada es la diferencia entre una voz fluida y una voz a tirones.

La regla práctica: en un hogar, un router decente con PAT aguanta de sobra. En una empresa o ISP, NAT se diseña: hardware pensado para *throughput* de millones de flujos, o se migra a IPv6 para sacárselo de encima.

**Throughput** es la cantidad de datos por segundo que un equipo puede mover; un router hogareño se
mide en cientos de megabits, uno de operador en decenas o cientos de gigabits. La frase final es la
más importante del capítulo: en redes grandes, NAT no es un detalle de configuración, es una
decisión de arquitectura con hardware dedicado.

### Dónde se siente el costo, en orden

1. **En el borde saturado**: el router chico con demasiadas conversaciones es el primer cuello de
   botella. Se nota como lentitud general y cortes en videollamadas.
2. **En la tabla llena**: cuando no quedan renglones libres, las conexiones nuevas fallan. Es raro
   en un hogar, común en un equipo mal dimensionado.
3. **En el tiempo real**: es lo primero que se degrada, porque no tolera ni el retraso ni la
   variación. Una web se adapta; una llamada, no.

### Resumen

- Una sola IP pública para toda la red simplifica la administración de direcciones.
- Traducir cuesta CPU y memoria en el router, y ese costo crece con la cantidad de conversaciones.
- Cuando el equipo o la tabla se llenan, aparecen descartes, retransmisiones y sensación de red pesada.
- Las aplicaciones de tiempo real son las primeras en sufrir, porque no toleran el jitter.
- En hogares alcanza con un router decente; en empresas y proveedores, NAT se diseña.

---

## 10. CG-NAT: el NAT en manos del proveedor

**CG-NAT** (*Carrier-Grade NAT*), también llamado NAT masivo / *Large-Scale NAT* (LSN), es NAT aplicado al revés de como lo viste hasta acá: **el ISP lo corre en sus propios equipos**, compartiendo UNA dirección pública entre MUCHOS clientes.

Hasta ahora el conserje estaba en la puerta de tu edificio. Con CG-NAT aparece un segundo
conserje, en la entrada del barrio: cien edificios comparten un único número de calle, y el
conserje del barrio es el que reparte. Tu conserje sigue existiendo y sigue haciendo su trabajo,
pero ahora le pasa las cartas a otro conserje que también reescribe y también tiene su libreta.
Dos libretas encadenadas, dos traducciones.

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

**Qué es este dibujo.** Dos cajas (una a cada lado del enlace) y una flecha que las cruza. Las
cajas son los dos routers con NAT; la flecha es el cable (o la fibra) entre ellos.

Línea por línea, columna por columna:

- `Tu casa` (arriba a la izquierda): el título de la primera caja.
- `ISP (CG-NAT)` (arriba a la derecha): el título de la segunda.
- `│ Router del cliente│`: el equipo del borde de tu casa. En la línea siguiente verás que tiene
  dos direcciones, una por cada cara.
- `│ LAN: 192.168.1.x │`: la cara de adentro, donde viven tus equipos con direcciones privadas.
  La `x` significa "cualquier número": toda tu red empieza igual.
- `│ WAN: 100.64.0.17 │`: la cara de afuera, que ya no tiene una dirección pública de verdad sino
  una del rango compartido `100.64.0.0/10`. Ese es el dato que delata al CG-NAT.
- `│  Tu router es "100.64.x.x"   │`: lo que el ISP ve cuando mira tu equipo. No es tu dirección
  en Internet: es tu turno en la fila.
- `│  CG-NAT lo traduce a         │`: la acción del segundo conserje.
- `│  la pública real: 203.0.113.7 │`: la dirección con la que de verdad salís al mundo. Esa la
  comparten muchísimos clientes del mismo ISP.
- `──> Internet`: la salida final.
- `NAT casero` / `NAT del ISP` (abajo): la etiqueta de cada traducción. Son dos, encadenadas.

Fijate qué pasó: hay **dos NAT encadenados** (doble NAT). Tu tráfico sale así: `192.168.1.20` → NAT casero → `100.64.0.17` → CG-NAT → `203.0.113.7` → Internet.

**Doble NAT** es el nombre de ese encadenamiento, y es la explicación de miles de problemas. Cada
capa traduce y cada capa tiene su libreta, y ninguna de las dos puede abrir un agujero en la otra.

### Cómo saber si estás detrás de un CG-NAT

**Método 1 (directo):** entrá al panel de tu router y mirá la IP de la interfaz WAN. Si arranca con `100.64.x.x` (o `100.64.0.0/10` en general) → CG-NAT, sin lugar a dudas.

Es el método más rápido y el más confiable, porque no depende de interpretar nada: el rango
`100.64.0.0/10` está reservado justamente para esto. Si tu WAN tiene una dirección de ese bloque,
hay un CG-NAT en el camino, siempre.

**Método 2 (con comandos):** desde tu PC, hacé una traza hacia tu IP pública:

- Windows: `tracert <tu_IP_pública>`
- Linux/macOS: `traceroute <tu_IP_pública>`

Los dos comandos hacen lo mismo con distinto nombre: `tracert` es el de Windows y `traceroute`
el de Linux y macOS. **Una traza** (o *trace route*, rastreo de ruta) muestra, salto por salto, por
qué equipos va pasando un paquete hasta llegar a destino. `<tu_IP_pública>` es un marcador: ahí va
el número real, el que averiguaste antes, sin los paréntesis angulares.

```
1 salto   → la pública está en TU router → no hay CG-NAT
2+ saltos → hay un equipo del ISP en el medio → CG-NAT confirmado
```

**Qué es este bloque.** No es la salida literal de ningún comando: es la regla para interpretar lo
que el comando te devuelva. Son dos casos, uno por renglón.

- `1 salto`: el paquete llegó a la dirección pública en un solo paso. Ese paso es tu propio
  router, que es dueño de esa dirección. Conclusión del renglón: no hay nadie más traduciendo.
- `2+ saltos`: hicieron falta dos o más equipos para llegar. El primero es tu router y el segundo
  es un equipo del ISP que también tradujo. Ese segundo equipo es el CG-NAT.
- El `→` separa la observación de la conclusión, y la conclusión es lo que te importa.

**Qué mirar vos en pantalla.** La salida real tiene una línea por salto, y cada línea trae tres
cosas: el número de salto, tres tiempos de ida y vuelta (los milisegundos que tardó cada uno de
los tres intentos) y la dirección del equipo que contestó. Un salto que no contesta aparece con
asteriscos en lugar de tiempos; eso es normal y no invalida la traza. Lo que tenés que contar es
**cuántas líneas hay antes de llegar a tu dirección pública**:

- Si la traza muestra tu dirección pública en la línea 1, listo: la dirección es de tu router.
- Si aparece recién en la línea 2 o más adelante, hubo un equipo del ISP en el medio: CG-NAT.

Es una prueba de olfato, no un certificado: un ISP puede tener equipos intermedios que no
traduzcan nada. Si querés certeza, el Método 1 manda.

### Qué significa para vos

| Tipo de usuario | Impacto |
|-----------------|---------|
| **Estándar** (navegar, redes sociales, streaming) | Ninguno. Ni te enterás. |
| **Avanzado** (port forwarding, VPN entrante, servidores caseros, túneles) | Todo se complica: el reenvío de puertos de tu router apunta a una IP que NO controlás. Es la causa #1 de "configuré el reenvío y no funciona". |
| **Empresa / teletrabajo** | Las VPN entrantes y algunas videollamadas se ven afectadas; el acceso remoto necesita tecnologías de relevo (TURN, sección 12) o un túnel saliente (WireGuard/ZeroTier) en vez de conexión entrante. |
| **Gamer** | El P2P y el NAT de consolas saltan por los aires: el tipo de NAT empeora, aparecen los "strict" y los partidos que no conectan. |
| **IoT industrial / telemetría** | Si los sensores solo reportan hacia afuera: cero problema. Si la empresa necesita llegar a ellos desde afuera: problema serio. |

**Cómo leer esta tabla.** Dos columnas:

- **Tipo de usuario:** el perfil, con un paréntesis que aclara qué hace esa persona con la red.
  No es una jerarquía de importancia: es una lista de casos de uso.
- **Impacto:** qué le pasa al CG-NAT en ese caso. La palabra que se repite es "conexión entrante":
  si no necesitás recibir, no hay impacto; si necesitás recibir, hay impacto siempre.

**Qué mirar vos en pantalla:** ubicá tu perfil en la primera columna. Si sos "estándar", cerraste el
capítulo; si sos de los otros cuatro, el resto del manual es para vos.

Dos términos de la tabla: **streaming** es la reproducción de audio o video mientras se descarga
(no esperás a tener el archivo completo), y **WireGuard**/**ZeroTier** son dos tecnologías de túnel
—la primera es un protocolo de VPN moderno, la segunda arma una red privada virtual entre equipos
aunque estén detrás de NAT— que funcionan justamente porque **salen** en vez de esperar que algo
**entre**.

> **Conclusión del CG-NAT:** no es un bug, es un parche de ingeniería para estirar la vida útil de IPv4. Y explica muchísimos dolores del mundo real: "abrí los puertos y no entran", "el juego no conecta", "la cámara no se ve". Antes de pelear con configuraciones, chequeá si sos víctima del doble NAT.

### Resumen

- CG-NAT es el NAT del ISP: muchos clientes comparten una sola IP pública de verdad.
- Se reconoce por la WAN en el rango `100.64.0.0/10` o por una traza que tarda 2 o más saltos en llegar a tu dirección pública.
- Encadena dos traducciones (doble NAT), cada una con su propia tabla.
- Para navegar no cambia nada; para recibir conexiones desde afuera lo complica todo.
- Antes de pelear con un reenvío de puertos que "no funciona", descartá el CG-NAT.

---

## 11. NAT en la vida real: cinco escenarios

Teoría suficiente. Estos cinco casos cubren el 95% de lo que te vas a encontrar, y cada uno usa NAT distinto.

Antes de arrancar, la herramienta que resuelve cuatro de los cinco: **UPnP** (*Universal Plug and
Play*, conexión y uso inmediatos). Es un protocolo que le permite a un programa de tu red pedirle
al router, automáticamente, que le abra un puerto. La consola o la aplicación dice "necesito el
puerto tal" y el router, si UPnP está activado, escribe el renglón en la tabla solo. Es cómodo y
es también un riesgo: cualquier programa de tu red puede pedir lo mismo, incluido uno malicioso.

### Escenario 1 — La casa: todos navegando (PAT)

4 personas, 9 dispositivos, 1 IP pública del ISP, router de fibra. Todo el tráfico sale por PAT en `203.0.113.5`. Un celular en TikTok, una notebook en Zoom, una TV en Netflix y una consola descargando — simultáneamente.

- **NAT usado:** PAT. Cada salida, una entrada única (IP+puerto) en la tabla.
- **Tip:** si alguna aplicación se queja de NAT "moderate/strict", resolverlo suele ser: UPnP activado, o reenvío manual para esa consola (escenario 3).

Es el caso base, el que NAT resuelve perfecto: nueve equipos, nueve conversaciones simultáneas,
una sola dirección pública y ninguna configuración. Nadie de afuera necesita entrar, así que la
regla de oro de la libreta nunca se pone a prueba.

**Qué mirar vos en pantalla:** la tabla NAT del router va a tener decenas de renglones con puertos
de fachada distintos y todos con la misma IP pública en la columna del medio. Eso es exactamente
lo que tiene que pasar.

### Escenario 2 — La oficina: servidor interno + acceso remoto

Una pyme tiene un servidor de archivos `192.168.0.10` al que los empleados entran por VPN, y una impresora. Nadie necesita que Internet "entre" salvo el servidor de correo.

- **NAT usado:** PAT para todo el tráfico saliente + **NAT estática o reenvío de puertos** para el correo (`192.168.0.10:25` ↔ pública fija `203.0.113.10:25`).
- **VPN:** los empleados no entran "hacia" el servidor: el servidor o el firewall inician un túnel saliente (WireGuard/OpenVPN de cliente) hacia el host del proveedor de VPN. NAT no se entera: la conexión la inició el lado interno, así que la tabla NAT la sostiene sin problemas. **Esta inversión (conexión saliente en vez de entrante) es LA solución universal para el acceso remoto con NAT.**

Fijate en el detalle del correo: el `:25` es el puerto convencional del correo saliente. Ahí la
regla de reenvío deja entrar desde afuera porque el servidor de correo **tiene** que recibir
conexiones de otros servidores de correo del mundo. Es el único de la oficina con esa necesidad,
así que es el único con regla.

Y fijate en la inversión del segundo punto, que es el truco más importante de todo el manual:
**la solución a "no puedo entrar" es "que salga él"**. En vez de esperar una conexión entrante que
NAT va a descartar, el equipo de adentro abre una conexión saliente y la mantiene viva. Por esa
conexión viaja todo lo que necesita. El conserje no ve nada raro: hay un renglón en la libreta
porque alguien de adentro inició la conversación.

**OpenVPN** es otro cliente y servidor de VPN, muy usado por ser libre y funcionar en cualquier
sistema. "De cliente" quiere decir que la conexión la inicia el lado de adentro, no el de afuera.

### Escenario 3 — El gamer: P2P y los tres tipos de NAT de consolas

Los juegos modernos no usan servidor central: conectan jugadores **entre sí (P2P)**. Para eso, un jugador tiene que recibir una conexión de otro — justo lo que NAT bloquea por defecto. Las consolas clasifican tu situación en tres niveles:

| Tipo | Qué significa | Experiencia |
|------|---------------|-------------|
| **Open** (abierto) | Nadie te bloquea: recibís conexiones directas | Hosteas partidas, todo conecta |
| **Moderate** (moderado) | Tenés NAT pero con UPnP o puertos abiertos | Conectás con Open y algunos Moderate; jamás sos host |
| **Strict** (estricto) | NAT cerrado / doble NAT | Solamente conectás con Open; buena parte de las partidas falla |

**Cómo leer esta tabla.** Tres columnas:

- **Tipo:** el nombre que la consola te muestra en su pantalla de diagnóstico de red, con la
  traducción al español entre paréntesis.
- **Qué significa:** la situación técnica que corresponde a ese nombre.
- **Experiencia:** lo que vas a vivir jugando. Es la columna que le importa a tu sobrino y la que
  explica por qué "a mí no me encuentra partida".

**Qué mirar vos en pantalla:** la consola te muestra uno de estos tres nombres y, casi siempre, un
número de puerto que dice estar usando. Si dice *Strict*, el problema no es el juego, es la libreta
del conserje.

**Soluciones, en orden:** (1) activar **UPnP** en el router: la consola pide sola los puertos que necesita y NAT los abre automáticamente; (2) **reenvío manual** de los puertos del juego (suele ser un rango de UDP) hacia la IP fija de la consola (dale IP estática por DHCP reservation); (3) si sos víctima de CG-NAT, el reenvío NO va a servir: la última carta es un túnel con tecnología P2P amistosa (ZeroTier, Hamachi) que negocia atraviesos UDP por vos — o pedir IP pública al ISP.

Dos conceptos de ese párrafo: **DHCP reservation** (reserva de DHCP) es una regla del router que
asocia la dirección física de un equipo con una dirección IP fija, para que ese equipo reciba
siempre la misma sin que vos la configures a mano. Es lo que hace que un reenvío de puertos siga
apuntando al equipo correcto después de un reinicio. Y **atravesar UDP** (*UDP hole punching*) es
la técnica de que dos equipos detrás de NAT se manden paquetes simultáneamente para que cada
conserje anote un renglón a la vez y el camino quede abierto en los dos sentidos.

Fijate en el orden de las soluciones, porque está pensado: primero lo automático, después lo
manual y ordenado, último lo que cuesta plata o depende del proveedor.

### Escenario 4 — La cámara y el servidor casero: recibir conexiones

Una cámara IP y un NAS que querés ver desde afuera.

**NAS** (*Network Attached Storage*, almacenamiento conectado a la red) es un equipo con discos que
comparte archivos por la red; en la práctica, tu nube privada.

- **Opción clásica:** reenvío de puertos en el router: `WAN : 8080 → 192.168.1.80 : 80`. Ojo: exponer un admin web a Internet es pedir una invitación. Mejor cerrar en firewall y usar VPN.
- **Opción moderna (recomendada hoy):** la cámara/NAS inicia una conexión saliente hacia la nube del fabricante (o a tu propio servidor WireGuard). Vos entrás por la nube/el túnel. Cero puertos abiertos, cero CG-NAT que te joda. Es el mismo principio de inversión del escenario 2.

Leé la regla clásica como una fila de la tabla NAT escrita a mano: **lo que llegue a la dirección
pública en el puerto 8080, mandalo siempre al equipo `192.168.1.80`, puerto 80**. El puerto público
(8080) y el interno (80) no tienen por qué coincidir; de hecho conviene que no coincidan, para no
exponer el puerto convencional del panel.

Y leé la advertencia: el panel de administración de una cámara suele ser una web con contraseña
débil y firmware viejo. Abrirlo a Internet es regalarle una puerta a cualquiera que escanee. La
opción moderna evita el problema entero, porque no abre nada: la cámara sale y mantiene el túnel
abierto desde adentro.

**Qué mirar vos en pantalla:** en el panel del router, la opción clásica aparece en la lista de
reenvío de puertos con una dirección de destino fija. La moderna no aparece en ningún lado: no hay
nada que ver porque no hay nada abierto, y eso es una buena señal.

### Escenario 5 — IoT industrial / telemetría: solo reportar

Sensores, medidores, PLCs que mandan datos al servidor del fabricante cada 30 segundos.

**PLC** (*Programmable Logic Controller*, controlador lógico programable) es el equipo industrial
que controla una máquina o un proceso; **telemetría** es la medición automática a distancia:
mandar lecturas desde donde están los sensores hacia donde se analizan.

- **NAT usado:** PAT, y ni siquiera lo pensás: el equipo inicia la conexión y ya.
- **La ley del IoT:** mientras el dispositivo SOLO hable hacia afuera, NAT (incluido CG-NAT) es invisible e irrelevante. El dolor aparece solo si la empresa necesita EMPUJAR configuraciones hacia el dispositivo (túneles salientes al rescate otra vez: los fabricantes serios usan colas/relevo en la nube para "llegar" a dispositivos detrás de cualquier NAT).

> **El patrón que atraviesa los cinco escenarios:** NAT no es problema cuando la comunicación sale; es problema cuando tiene que ENTRAR. Cada escenario tiene su palanca: puertos abiertos (1 y 3), NAT estática (2), UPnP (3), nube/túnel saliente (2, 4, 5). Y cuando ni eso alcanza... llega la sección que sigue.

### Resumen

- En una casa con PAT no hay nada que configurar: todos inician y la libreta hace el resto.
- Una oficina que expone un servicio necesita NAT estática o reenvío de puertos; para el resto, túnel saliente.
- Las consolas clasifican tu NAT en Open, Moderate o Strict, y de eso depende con quién podés jugar.
- Cámaras y NAS se resuelven hoy con conexión saliente a la nube: no se abre ningún puerto.
- La regla que une los cinco casos: lo que sale funciona; lo que tiene que entrar, necesita una palanca.

---

## 12. NAT transversal: el arte de hablar a través del traductor

Acá está el plato fuerte, y lo que realmente distingue este manual: **por qué las comunicaciones en tiempo real (VoIP, videollamadas, juegos) se quiebran contra NAT, y cómo se resuelve en el mundo real.**

**NAT traversal** (atravesar NAT) es el nombre del conjunto de técnicas que resuelven esto sin
tocar la configuración del router. No es un protocolo único: es una caja de herramientas que las
aplicaciones usan para abrirse paso a través de libretas ajenas.

### 12.1. El problema: las conexiones entrantes no existen

Una llamada VoIP entrante es una conexión INICIADA DESDE AFUERA: un teléfono IP o softphone recibe un **INVITE** (una invitación SIP) de un servidor de telefonía. Pero el softphone vive detrás de NAT, sin entrada en la tabla. El INVITE llega al router, no hay entrada, y se descarta en silencio. El teléfono jamás suena.

Tres palabras de esa frase. Un **softphone** es un programa que hace de teléfono en tu compu o en
tu celular. **SIP** (*Session Initiation Protocol*, protocolo de inicio de sesión) es el protocolo
de señalización de la telefonía IP: el que arma, negocia y cuelga la llamada. **INVITE** es el
mensaje con el que SIP invita a alguien a una llamada: es literalmente el "te estoy llamando".

Traducido al conserje: la carta que inicia la conversación viene de afuera, y el conserje no tiene
renglón. La tira. El teléfono no suena nunca y del otro lado escuchan el tono normal: el sistema
cree que la llamada salió.

Y hay un segundo problema, peor: la voz (RTP) no viaja por el mismo canal que la señalización (SIP). La llamada abre DOS flujos:

- **SIP** (señalización): arma, negocia y cuelga la llamada. TCP o UDP, comúnmente puerto 5060.
- **RTP** (la voz/video): stream continuo de paquetes UDP, unidireccional o bidireccional. **Los puertos RTP se negocian en el momento de cada llamada** y cambian en cada una — con rangos amplios (típicamente miles de puertos UDP pares, p. ej. 16384–32767 en muchas plataformas).

**RTP** (*Real-time Transport Protocol*, protocolo de transporte en tiempo real) es el que lleva el
audio y el video: paquetes chicos, uno atrás del otro, sin esperar confirmación. Un **stream** es
justamente eso: un chorro continuo de datos, no un archivo. Y "se negocian en cada llamada" quiere
decir que los números de puerto no están fijados de antemano: los dos extremos se los dicen en el
momento, dentro de la señalización.

Traducido al edificio: no solo es que el conserje descarte cartas no pedidas — encima, los vecinos negocian entre llamada y llamada qué puerta van a usar para la voz. Adivinar por qué puerta va a intentar entrar el audio de una llamada de terceros es un juego de 1 entre 16.000.

> **Por qué "tiempo real" es la palabra clave:** en una llamada, el audio no puede esperar. Si un paquete de voz se retrasa o se pierde, no hay retransmisión útil: ya pasó el instante que transportaba. Por eso VoIP/video/juegos son los primero en romperse con NAT: no admiten el reintento que sí admiten una web o un correo.

La comparación con la web ayuda: si se pierde un pedazo de una página, el navegador lo vuelve a
pedir y nadie nota nada. Si se pierde un pedazo de una sílaba, el que escucha nota un hueco. No hay
manera de recuperar el tiempo perdido: el audio de hace medio segundo ya no sirve.

### 12.2. El primer intento: comportamientos de NAT y la "regla del puerto simétrico"

No todos los NAT se comportan igual, y de eso depende TODO. La clasificación clásica (de los años del protocolo STUN original):

| Comportamiento | Qué hace con los paquetes SALIENTES | Qué hace con los ENTRANTES |
|----------------|--------------------------------------|----------------------------|
| **Full-Cone** | Mapea `interno:puerto` → `público:puerto` **una vez** | Acepta desde CUALQUIER origen hacia ese mapeo |
| **Address-Restricted Cone** | Idem | Solo acepta desde la dirección que YA recibió paquetes |
| **Port-Restricted Cone** | Idem | Solo desde dirección **y puerto** que ya hablaron |
| **Symmetric** | Crea un mapeo NUEVO por cada destino distinto | Prácticamente bloquea todo lo que no fue exactamente respondido al mismo mapeo |

**Cómo leer esta tabla.** Tres columnas, y la tercera es la que define si tu llamada funciona:

- **Comportamiento:** el nombre del tipo de NAT. **Mapeo** (*mapping*) es el par
  "dirección:puerto de adentro" traducido a "dirección:puerto de afuera"; es el renglón de la
  libreta.
- **Qué hace con los paquetes SALIENTES:** cómo se crean esos renglones. Fijate que los tres
  primeros dicen `Idem`, o sea "hacen lo mismo que el primero": mapean una sola vez. El cuarto es
  el distinto.
- **Qué hace con los ENTRANTES:** qué deja pasar de vuelta. Va de más permisivo (acepta de
  cualquiera) a más restrictivo (bloquea casi todo).

**Qué mirar vos en pantalla:** este tipo no se configura, se sufre. Lo vas a deducir por el
síntoma: si el audio entra con un STUN, tu NAT no es symmetric; si no entra nunca, sospechá
symmetric.

Hoy se describe más preciso con dos ejes: **mapping** (cómo crea el mapeo: *endpoint-independent*, *address-dependent* o *address-and-port-dependent*) y **filtering** (qué deja entrar). Pero la intuición es la misma:

Esos dos ejes son las dos preguntas separadas que la tabla vieja mezclaba: **¿el mapeo depende del
destino?** (mapping) y **¿el filtro depende del origen?** (filtering). Un NAT puede ser generoso en
una y estricto en la otra, y por eso la clasificación moderna es más precisa.

> **Full-cone es un conserje distraído:** una vez que el departamento 2B "abre" la puerta del edificio, cualquiera de afuera puede llamar a esa puerta y el conserje se la pasa. **Symmetric es un conserje paranoico:** cada vecino que quiere hablar con un destino distinto tiene que abrir una puerta nueva, y las respuestas solo entran por la puerta exacta que se abrió para ese remitente.

Esta diferencia explica los "tipos NAT" de los juegos: **Open** suele corresponder a full-cone (o puertos reenviados), **Strict** a symmetric (o doble NAT). Y explica por qué una técnica que "funciona para mi amigo" no te funciona a vos: no son el mismo tipo de conserje.

### 12.3. El truco que funciona a medias: "hablar por donde te hablan" (symmetric RTP)

La mayoría de los endpoints VoIP hacen algo elegantísimo y barato: **recibir RTP por el MISMO puerto por el que lo enviaron** (*RTP symmetric*). ¿Por qué ayuda? Porque si vos ya le mandaste audio a alguien, tu NAT creó la entrada para las respuestas. Mientras el flujo sea bidireccional y los dos extremos usen el mismo par de puertos, el audio cruza NAT sin configuración.

Un **endpoint** es cada punta de la comunicación: tu softphone, el teléfono del otro lado, el
servidor. **RTP simétrico** es entonces una convención: "mandame el audio por la misma ventanilla
por la que te mandé el mío". Como esa ventanilla ya tiene renglón en la libreta (la abriste vos al
mandar), la respuesta entra sin pedir permiso.

¿Cuándo se rompe? Cuando el flujo NO es completamente bidireccional, o cuando hay un NAT symmetric de por medio que crea un mapeo distinto por cada destino (y el stream entrante no coincide con el mapeo de salida). Ahí el truco del puerto simétrico se queda corto, y hay que pasar a las armas grandes.

El caso típico de "no es completamente bidireccional": un video que solo se mira, un audio donde
uno habla y el otro escucha, o un mensaje de voz. Si nunca mandaste audio, no hay ventanilla abierta,
y el que llega no entra.

### 12.4. STUN: "¿cómo me ve el mundo?"

**STUN** (*Session Traversal Utilities for NAT*) es un servidor en Internet que te dice tu dirección "vista desde afuera":

```
Tu softphone:  "Hola, soy 192.168.1.50:50002. ¿Quién soy para el mundo?"
Servidor STUN: "Todos te ven como 203.0.113.5:40512. Contale eso a tus interlocutores."
```

**Qué es este bloque.** Es un diálogo de dos líneas: tu equipo pregunta, el servidor contesta. Las
comillas no son decoración: es el contenido de los dos mensajes, escrito como si fueran personas
hablando.

- `Tu softphone:` quién habla primero. La consulta sale de adentro hacia afuera, así que abre un
  renglón en la tabla NAT como cualquier otra conexión.
- `"Hola, soy 192.168.1.50:50002. ¿Quién soy para el mundo?"`: el mensaje. El equipo se presenta con
  su dirección privada y su puerto, y hace la única pregunta que no puede contestar solo: ¿con qué
  cara me ve el resto de Internet?
- `Servidor STUN:` la otra punta, un servidor público en Internet.
- `"Todos te ven como 203.0.113.5:40512. Contale eso a tus interlocutores."`: la respuesta. Es la
  traducción que hizo tu propio router: el `40512` es el puerto de fachada que le tocó a esa
  consulta. "Contale eso a tus interlocutores" es la instrucción práctica: meté esa dirección en
  la negociación para que el otro sepa a dónde mandar el audio.

El softphone toma esa IP+puerto público, la mete en los mensajes SIP/RTP y le dice a la otra punta: "mandame el audio a `203.0.113.5:40512`, que es mi puerta" — y como esa puerta se abrió cuando el propio softphone habló con el servidor STUN, las respuestas entran.

**La letra chica:** STUN funciona con NAT full-cone y restricted y con port-restricted, pero **NO con symmetric**: el mapeo que STUN descubre es contra el servidor STUN, y un NAT symmetric crearía otro mapeo distinto contra el destinatario real. La respuesta del servidor STUN "sirve" pero el audio no llega.

Es el detalle más importante de la sección: STUN te dice la verdad, pero una verdad con fecha y
destino. "Así te ve **el servidor STUN**" no es lo mismo que "así te va a ver **tu interlocutor**",
y en un NAT symmetric esas dos cosas son distintas.

### 12.5. TURN: el relevo cuando no queda otra

**TURN** (*Traversal Using Relays around NAT*) es el plan B (o C): si no hay forma de abrir un agujero directo entre los dos extremos — típicamente por NAT symmetric o por firewalls estrictos — el tráfico **se relega por un servidor intermedio**:

```
Softphone A ──> Tu NAT ──> Servidor TURN ──> NAT del otro ──> Softphone B
              (casa)      (en Internet)      (oficina)
```

**Qué es este bloque.** Una cadena de cinco eslabones, leída de izquierda a derecha, con el nombre
de cada tramo debajo entre paréntesis.

- `Softphone A ──>`: el que llama, en tu casa.
- `Tu NAT ──>`: el conserje de tu casa. Fijate que la flecha sale: la conexión es **saliente**.
- `Servidor TURN ──>`: el equipo de relevo, en Internet. Es el que junta los dos hilos.
- `NAT del otro ──>`: el conserje de la oficina del que recibe.
- `Softphone B`: el que atiende.
- Las etiquetas de abajo (`casa`, `en Internet`, `oficina`) dicen dónde está cada tramo: dos
  extremos privados y un punto público en el medio.

**Relay** (relevo) es la palabra clave: el servidor no traduce nada, **reenvía**. Recibe de un lado
y entrega del otro, como una estafeta.

A y B hablan con el TURN (conexiones salientes, que NAT deja pasar), y el TURN junta los dos hilos: el audio va casa → TURN → oficina. Todo el cruce de NAT se elimina porque **nadie intenta entrar por la puerta de nadie**: las dos puntas solo SALEN.

**El costo:** el relevo paga ancho de banda y latencia — cada llamada consume el doble de tráfico y pasa por una pierna intermedia. Por eso TURN es el último recurso: funciona siempre, pero cuesta. Las conferencias multitudinarias (WebRTC masivo) son TURN a lo grande.

**WebRTC** (*Web Real-Time Communication*, comunicación en tiempo real desde la web) es el conjunto
de estándares que permite videollamadas y audio dentro del navegador sin instalar nada. Y "masivo"
significa que con veinte participantes el servidor de relevo tiene que copiar cada flujo a cada
uno: el costo crece rápido.

### 12.6. ICE: la negociación que lo intenta TODO

Lo mejor de todo: nadie elige a ciegas. **ICE** (*Interactive Connectivity Establishment*) reúne STUN + TURN + conectividad directa en un solo proceso de negociación automática:

1. Cada extremo junta **todas sus direcciones candidatas**: la privada, la pública descubierta con STUN, y (si hay) el relevo del TURN.
2. Los dos intercambian listas (via SIP/WebRTC).
3. **Prueban en orden** de menor costo: directo primero, STUN/pinhole después, TURN al final.
4. La primera que funcione, gana. El resto se descarta.

Los cuatro pasos, en palabras: juntar candidatos, pasarse las listas, probar de la más barata a la
más cara, quedarse con la primera que funcione. Un **candidato** es simplemente "una dirección
posible por la que me podés encontrar". **Pinhole** es el agujero que se abre en el filtro cuando
un paquete sale: uno de esos renglones de la libreta que habilita la vuelta.

Es el standard moderno: tu celular con videollamada, tu navegador con WebRTC, los softphones corporativos, TODOS usan ICE (con STUN y TURN adentro) sin que sepas nada.

### 12.7. SIP ALG: el plugin que rompe más de lo que arregla

Muchos routers hogareños traen "SIP ALG" (Application Layer Gateway) activado: un agente que "ayuda" reescribiendo los mensajes SIP para el NAT automáticamente.

Más arriba ya definimos **ALG**: la pasarela de capa de aplicación, el ayudante que reescribe
mensajes de protocolos que llevan direcciones adentro. Acá ves por qué es un problema.

Suena perfecto. En la práctica, los ALG caseros reescriben mal (o a medias) los encabezados SIP/SDP, rompen el RTP simétrico, trituran el SIP cifrado (que no se puede reescribir — y el router lo descarta o lo corrompe), y generan los síntomas más raros: llamadas que suenan pero no tienen audio, o audio en un solo sentido.

**SDP** (*Session Description Protocol*, protocolo de descripción de sesión) es el cuerpo del mensaje
SIP que dice qué puertos, qué códecs y qué direcciones se van a usar en esa llamada. Un **códec**
es el algoritmo con el que se comprime y descomprime la voz. Cuando el ALG reescribe mal ese cuerpo,
la llamada se arma igual (la señalización pasó) pero el audio va a la dirección equivocada: sonó,
y no se escucha nada.

**La recomendación de la industria (y de este manual):** si tu VoIP sufre y tu router tiene SIP ALG — **desactivado generalmente arregla los problemas, no los causa**. La solución correcta son STUN/ICE de los endpoints, no un interceptor mágico. (Los ALG empresariales de verdad — los SBC, que siguen — son otra historia: están hechos por especialistas y son parte de la solución.)

> **Regla de oro del VoIP:** señalización (SIP) y voz (RTP) son canales distintos que se negocian en cada llamada. Si un solo elemento de la cadena no traduce bien esa negociación, la llamada se rompe. Por eso la respuesta moderna es: que los PROPIA endpoints negocien (ICE/STUN), NO que un router del medio "ayude" (ALG).

### 12.8. SBC: el orquestador del proveedor

En el lado del servicio de telefonía, el equivalente serio del ALG es el **SBC** (*Session Border Controller*): un equipo de borde que controla TODO el tráfico SIP/RTP hacia la red del proveedor. Funciones: autenticación de troncales, traducción de numeración, control de ancho de banda por llamada, topología escondida y — clave para el tema — **actúa como TURN gigante**: los endpooints detrás de NAT hablan con el SBC (saliente), y el SBC los conecta con el resto de la red telefónica. Por eso las llamadas VoIP "de empresa" funcionan: el SBC orquesta el cruce de NAT de toda la telefonía de la operadora.

Una **troncal** es el enlace entre dos centrales telefónicas: la "línea" del proveedor, en versión
profesional. Las funciones que lista el párrafo son las de un portero de consorcio grande: verifica
quién entra, traduce los números, controla cuánto ocupa cada uno y no deja ver la distribución
interna del edificio.

### 12.9. El caso completo: una llamada VoIP real

Armemos todos los fierros. Un empleado en su casa (detrás del router de fibra, que además es CG-NAT del ISP) llama al número fijo de la oficina:

1. El softphone arranca y hace **registro SIP** contra el SBC del proveedor (el registro se renueva cada pocos minutos — cada renovación refresca la entrada NAT, matando dos pájaros: "estoy vivo" y "manteneme el agujero abierto").
2. Al marcar, **ICE** junta candidatos: la IP privada, la pública que le dijo el STUN, y el relevo del TURN.
3. El **INVITE** va por el canal saliente al SBC — entra en la tabla NAT como cualquier web — y el SBC ya sabe cómo encontrar al softphone: por el que el propio softphone usó para registrarse.
4. El SBC conecta con la central de la oficina y establece la llamada.
5. El audio **RTP** prueba: directo primero (con suerte, y con el truco del puerto simétrico alcanza); si el camino directo falla (CG-NAT + symmetric), **ICE elige TURN** y el audio viaja casa → TURN → oficina.
6. Al colgar, se liberan los puertos y las entradas NAT expiran.

Ese caso mezcla todo lo anterior, y conviene verlo como una película: primero el teléfono se
presenta (registro), después se negocian las puertas (ICE), después se pide la llamada (INVITE),
después se arma el audio, y al final se limpia. Si cualquiera de esos pasos falla en el medio de
una cadena con doble NAT, el síntoma aparece en el paso 5: la llamada suena, el audio no.

Ninguna de esas piezas es opcional si el empleado está detrás de NAT doble. Por eso el acceso remoto, la telefonía y los juegos modernos — las tres cosas más sensibles al tiempo real — terminan TODAS en el mismo set de herramientas: **STUN para mirarse, TURN para relevar, ICE para negociar** — y reconocimiento humilde de que NAT, el salvador de IPv4, es también su única maldición.

### Resumen

- Una llamada entrante es una conexión iniciada desde afuera: sin renglón en la libreta, se descarta sin aviso.
- SIP lleva la señalización y RTP la voz, en flujos distintos cuyos puertos se negocian por llamada.
- Hay NAT full-cone, restricted y symmetric, y el symmetric es el que arruina el audio.
- STUN te dice cómo te ve el mundo; TURN releva cuando no hay camino directo; ICE prueba todo en orden de costo.
- SIP ALG casero suele romper la llamada, y lo primero que hay que probar es desactivarlo.

---

## 13. Ejercicios prácticos

Cinco ejercicios, en orden de dificultad. Tratá de contestarlos antes de leer la respuesta:
leer la solución cuesta diez segundos, pensarla cuesta dos minutos y te queda para siempre.

### Ejercicio 1: leé una tabla NAT

Esta es una tabla real de un router casero:

```
Protocolo  Local externo             Externo local
TCP        192.168.1.20:51000   ->   203.0.113.5:40512
UDP        192.168.1.21:53000   ->   203.0.113.5:40513
UDP        192.168.1.30:1024    ->   203.0.113.5:40514
```

**Qué es este bloque.** La tabla de traducciones tal como la muestra el panel de un router: tres
conversaciones activas. Antes de contestar las preguntas, leela columna por columna, porque los
títulos están en un orden que confunde a cualquiera:

- **`Protocolo`** (primera columna): si la conversación es TCP o UDP. Importa porque la traducción
  se mantiene por protocolo: el mismo número de puerto puede estar usado a la vez por una
  conversación TCP y una UDP sin conflicto.
- **`Local externo`** (segunda columna): a pesar del nombre, es **la dirección de adentro** —el
  equipo de tu red y el puerto desde el que salió—. "Externo" acá no significa "de Internet": el
  panel lo llama así porque es el extremo externo *respecto de la traducción*, o sea el lado que
  no es del router. Es la etiqueta más confusa de todo el tema, y por eso conviene fijarla:
  **`Local externo` = adentro**.
- **`Externo local`** (tercera columna): al revés, es **la dirección de afuera**, la pública con el
  puerto de fachada. **`Externo local` = afuera**.
- El formato de cada renglón: la dirección y el puerto van pegados con dos puntos
  (`192.168.1.20:51000`), sin espacios en el medio. Leelo como "edificio:ventanilla".
- La flecha `->` es la traducción: lo de la izquierda sale como lo de la derecha.

**Qué mirar vos en pantalla:** tres equipos distintos (`.20`, `.21`, `.30`) comparten la misma
dirección pública `203.0.113.5` y nadie se pisa, porque cada uno tiene su puerto de fachada. Y
fijate en el detalle del tercer renglón: el equipo de adentro usó el puerto `1024` y salió con
`40514`; el router no conservó el `1024` porque en la fachada ya estaba ocupado por otra
conversación, así que le dio el siguiente puerto libre.

1. ¿Qué tipo de NAT muestra la tabla?
2. Si llega un paquete para `203.0.113.5:40512`, ¿a qué equipo interno va?
3. ¿Y si llega uno para `203.0.113.5:8000` (sin entrada)? ¿Qué pasa?

#### Ver respuestas

1. **PAT** (NAT overload): tres dispositivos internos distintos comparten la misma IP pública `203.0.113.5`, diferenciados por puerto.
2. Va a `192.168.1.20` (puerto 51000). Esa es la conexión que la PC-20 inició hacia afuera.
3. **Se descarta.** No hay entrada en la tabla → paquete no solicitado → a la basura. Esto, y no otra cosa, es lo que "protege" NAT por defecto.

### Ejercicio 2: clasificá el comportamiento

Un NAT mapea `192.168.1.10:5000` → `203.0.113.5:5000` y acepta tráfico entrante a ese mapeo SOLO desde `8.8.8.8` (porque el equipo interno ya le mandó paquetes a `8.8.8.8`). ¿Qué tipo de NAT es: full-cone, address-restricted, port-restricted o symmetric?

#### Ver respuesta

**Address-restricted cone**: acepta desde CUALQUIER puerto de una dirección ya "conocida" (que recibió tráfico saliente del interno), pero NO desde direcciones que nunca hablaron. Si además filtrara por puerto exacto (`8.8.8.8:53` y nada más), sería port-restricted.

La pista para resolverlo está en la palabra "SOLO desde `8.8.8.8`": hay un filtro por dirección, pero
no por puerto. Si el enunciado dijera "solo desde `8.8.8.8:53`", sería port-restricted. Si dijera
"desde cualquier dirección", sería full-cone.

### Ejercicio 3: ¿STUN o TURN?

Dos softphones detrás de NAT symmetric (ambos extremos). Los endpoints usan ICE. ¿Qué candidato terminará funcionando para el audio?

#### Ver respuesta

**TURN (relevo).** Con NAT symmetric, los mapeos se crean por destino: el candidato STUN descubierto contra el servidor STUN no sirve para llegar al otro endpoint (el mapeo es distinto). Los candidatos directos tampoco. ICE probará en orden y terminará eligiendo el relevo — a costa de latencia y ancho de banda, pero con la llamada funcionando.

### Ejercicio 4: diagnóstico de VoIP

"Llamo desde el softphone de mi casa y la llamada suena, pero no hay audio, ni en un sentido ni en el otro. Mi router tiene SIP ALG activado." ¿Cuál es el siguiente paso lógico y por qué?

#### Ver respuesta

**Desactivar SIP ALG** (y configurar STUN/ICE en el softphone si hace falta). El síntoma "suena pero no hay audio" es el clásico de ALG que reescribe los mensajes SIP/SDP (o el RTP que no se negocia). Con ALG **apagado**, los endpoints negocian la voz por los puertos correctos y — con STUN/ICE — cruzan NAT limpio. Desactivar ALG es la primera prueba de todo técnico VoIP; en la mayoría de los casos arregla, no rompe.

### Ejercicio 5: detectar CG-NAT

Conectás tu router y la IP WAN muestra `100.73.12.9`. ¿Qué significa, y qué les decís a tus amigos gamers cuando se quejan de NAT Strict?

#### Ver respuesta

**Estás detrás de un CG-NAT del ISP** (`100.64.0.0/10` = espacio de RFC 6598). El reenvío de puertos de tu router NO va a servir: apunta a una IP (`100.73.12.9`) que no controlás y que el ISP traduce de nuevo hacia su pública. A los gamers: NAT Strict permanente aunque abran puertos; las soluciones reales son pedir IP pública al ISP (a veces paga/costo), usar VPN/P2P con cifrado (ZeroTier, etc.) o servicios de relevo.

### Resumen

- Leer una tabla NAT es leer dos pares dirección:puerto y una flecha en el medio.
- El par completo —origen, origen-puerto, destino, destino-puerto— es lo que identifica una conversación.
- Reconocer el comportamiento del NAT se hace por el síntoma: qué entra y qué no.
- "Suena pero no hay audio" apunta primero al SIP ALG del router.
- Una WAN en `100.64.x.x` cierra el diagnóstico: hay CG-NAT y ningún reenvío va a funcionar.

---

## 14. Comprobá lo que aprendiste

Ocho preguntas de repaso. Si contestás seis sin mirar, el manual cumplió su función.

**1. ¿Cuál es la función real de NAT en una red IPv4?**

#### Ver respuesta

Estirar el espacio de direcciones IPv4: permitir que MUCHOS dispositivos privados (RFC 1918) compartan UNA o pocas IPs públicas, traduciendo dirección y puerto en los paquetes que cruzan el borde (PAT).

**2. ¿Por qué no alcanza con traducir solo la IP?**

#### Ver respuesta

Porque dos hosts internos pueden usar el mismo puerto de origen hacia el mismo destino; sin traducir puertos, las respuestas serían indistinguibles (dos entradas idénticas en la tabla).

**3. Diferencia entre NAT estática, NAT dinámica y PAT.**

#### Ver respuesta

Estática: 1:1 fija (para servicios que reciben conexiones). Dinámica: una pública prestada de un pool mientras dura la conexión (si se agota, descarta). PAT: todos contra una sola pública por puertos distintos (el estándar de hogares y oficinas).

**4. ¿NAT es un firewall?**

#### Ver respuesta

No. Oculta direcciones y descarta lo no solicitado, pero no filtra por política ni audita. Es una capa pasiva de reducción de exposición; la seguridad real está en firewalls, parches y configuración.

**5. ¿Qué es CG-NAT y cómo se detecta?**

#### Ver respuesta

Un NAT masivo del ISP (doble NAT) para compartir públicas entre varios clientes, usando `100.64.0.0/10`. Se detecta mirando la IP WAN del router (100.64.x.x) o con `tracert`/`traceroute` a tu IP pública: 2+ saltos = CG-NAT.

**6. ¿Por qué las llamadas VoIP se rompen con NAT?**

#### Ver respuesta

Porque las llamadas entrantes son conexiones iniciadas desde AFUERA (no hay entrada NAT), y porque la voz (RTP) usa puertos UDP negociados en cada llamada por un canal distinto del de señalización (SIP). El tiempo real no admite retransmisiones: si el audio no cruza, la llamada se pierde o queda muda.

**7. STUN, TURN e ICE: ¿cuál es cada uno?**

#### Ver respuesta

STUN: un servidor que te dice tu dirección pública vista de afuera (descubrimiento). TURN: un servidor que releva el tráfico entre los dos extremos (funciona siempre, cuesta latencia/banda). ICE: la negociación que reúne STUN + TURN + conexión directa y prueba en orden de costo.

**8. ¿Cuándo conviene desactivar SIP ALG?**

#### Ver respuesta

Cuando hay problemas de VoIP (llamadas sin audio, un solo sentido, registro que falla). El ALG casero reescribe mal SIP/SDP y rompe RTP simétrico y SIP cifrado. La solución correcta son STUN/ICE en los endpoints; los SBC (enterprise) son otra liga.

### Resumen

- Las ocho respuestas son las ocho ideas que hay que poder explicar sin apuntes.
- La función de NAT es estirar IPv4 compartiendo públicas, con puertos como desambiguador.
- NAT no es un firewall, y en VoIP la duda se resuelve con STUN/ICE y sin ALG casero.

---

## 15. Glosario

Todos los términos del manual, en una sola tabla, en orden alfabético de la sigla. Está pensada
para volver: cuando en el capítulo 12 aparezca una palabra que ya no te acordás, vení acá.

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

**Cómo leer esta tabla.** Dos columnas: el **Término** (la sigla o el nombre corto, en negrita) y
**Qué es** (la definición en una línea). La segunda columna está escrita para leerse sola, sin el
resto del manual, así que sirve como chuleta de consulta rápida.

**Qué mirar vos en pantalla:** si estás diagnosticando algo, buscá en la tabla la palabra que
aparece en el mensaje de error del programa o en el panel del router y leé la definición. Las cinco
filas que resuelven el 80% de los casos reales son **Tabla NAT**, **Doble NAT**, **Port
forwarding**, **CG-NAT** y **SIP ALG**.

### Resumen

- El glosario es la versión de bolsillo del manual: sigla y definición en una línea.
- Sirve para consultar durante un diagnóstico, no para leer de corrido.
- Las filas de tabla NAT, doble NAT y reenvío de puertos resumen el mecanismo completo.

---

## 16. Resumen en 10 puntos

Diez frases para llevarte. Si tuvieras que explicarle NAT a alguien en cinco minutos, estas son
las que dirías, en este orden.

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

**Cómo leer esta lista.** Los puntos 1 a 4 son el mecanismo: por qué existe NAT, cuál es la
analogía, por qué hace falta el puerto y por qué la libreta manda. Los puntos 5 a 7 son las
consecuencias: no es un firewall, el CG-NAT agrava todo, y lo que quiere entrar sufre. Los puntos 8
a 10 son las herramientas: el tiempo real es el caso difícil y STUN/TURN/ICE son la respuesta.

> **Fuente:** Documentación propia basada en RFC 1918, RFC 6598, RFC 5389 (STUN), RFC 5766 (TURN), RFC 8445 (ICE), RFC 3261 (SIP) y RFC 3550 (RTP), con experiencias de troubleshooting reales.

### Resumen

- Diez puntos: cuatro de mecanismo, tres de consecuencias y tres de herramientas.
- Si te llevás una sola idea, que sea esta: NAT hace que muchos equipos compartan una dirección, y esa libreta es la que decide qué entra.
- Si te llevás dos, agregá esta: todo lo que quiere entrar desde afuera necesita permiso explícito o un camino que salga primero.

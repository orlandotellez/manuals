# 15. Cisco Packet Tracer: Laboratorios Guiados

**Router · Switch · DHCP · Rutas estáticas · VLANs**

Este manual arranca con una suposición incómoda: nunca abriste un simulador de redes. No sabés
qué es Packet Tracer, no viste una consola de router en tu vida y la palabra "CLI" te suena a
cosa de especialistas. Está perfecto. Eso es exactamente lo que vamos a resolver acá, y no hace
falta ningún conocimiento previo: cada sigla se define la primera vez que aparece y cada comando
se explica antes de que lo tengas que escribir.

**Cisco Packet Tracer** (de acá en adelante, **PT**) es un programa de Cisco que te deja armar
una red entera adentro de la computadora: routers, switches, cables y PCs que no existen
físicamente, pero que se comportan como si existieran. Vos arrastrás un router al lienzo, lo
conectás con un cable virtual, abrís su consola y le escribís los mismos comandos que
escribirías en un equipo real que está en un rack. Si te equivocás no se cae ninguna empresa: se
cae un dibujito que borrás y volvés a armar.

> **La idea madre de este manual:** no es una lista de comandos para memorizar. Es una secuencia
> de laboratorios para **hacer**. Cada lab arma UNA pieza: primero el router, después el switch,
> después el reparto automático de direcciones, después las rutas, después las VLANs. Al final, el
> Lab 7 une todo en una red completa. Los comandos se aprenden usándolos, no repasándolos de una
> tabla.

Una advertencia de arranque: este manual no se lee, se ejecuta. Si solo leés, en el capítulo 7 vas a
estar perdido, porque cada lab usa lo que armaste en el anterior.

---

## Índice

- [El simulador de vuelo del técnico de redes](#1-el-simulador-de-vuelo-del-técnico-de-redes)
- [Laboratorio 0: el primer plano](#2-laboratorio-0-el-primer-plano)
- [Laboratorio 1: el router — acceso y seguridad básica](#3-laboratorio-1-el-router-acceso-y-seguridad-básica)
- [Laboratorio 2: una red con router — IPs y verificación](#4-laboratorio-2-una-red-con-router-ips-y-verificación)
- [Laboratorio 3: el switch — administración y MACs](#5-laboratorio-3-el-switch-administración-y-macs)
- [Laboratorio 4: DHCP en el router](#6-laboratorio-4-dhcp-en-el-router)
- [Laboratorio 5: dos routers — rutas estáticas y el ping que no vuelve](#7-laboratorio-5-dos-routers-rutas-estáticas-y-el-ping-que-no-vuelve)
- [Laboratorio 6: VLANs y router on a stick](#8-laboratorio-6-vlans-y-router-on-a-stick)
- [Laboratorio 7: el lab completo](#9-laboratorio-7-el-lab-completo)
- [Referencia rápida](#10-referencia-rápida)
- [Errores comunes y cómo diagnosticarlos](#11-errores-comunes-y-cómo-diagnosticarlos)
- [Ejercicios guiados](#12-ejercicios-guiados)
- [Comprobá lo que aprendiste](#13-comprobá-lo-que-aprendiste)
- [Glosario](#14-glosario)
- [Resumen en 10 puntos](#15-resumen-en-10-puntos)

Cada entrada del índice es un capítulo, y cada título es además la dirección (URL) con la que se
publica la página. El capítulo 1 es la introducción al programa y a los modos de la consola: sin
eso, el resto no se entiende. Los capítulos 2 a 9 son los siete laboratorios, en orden, y cada uno
depende del anterior. Los capítulos 10 a 12 son de consulta: la referencia de comandos, la tabla de
errores y los ejercicios.

### Cómo está armado cada laboratorio

Todos los labs siguen la misma estructura: **qué vas a probar**, la **topología en palabras** (qué
aparato hay y qué cable va de qué enchufe a qué enchufe), los **comandos paso a paso** con el modo en
que se escriben y lo que tenés que ver en pantalla, **cómo sabés que funcionó**, y **qué pasa si te
saltás un paso**. Ese último punto es el que convierte un error en aprendizaje en vez de en una tarde
perdida.

### Resumen

- Este manual se hace, no se lee: siete laboratorios encadenados, cada uno con una pieza nueva.
- Packet Tracer es el simulador de vuelo del técnico de redes: comandos reales, riesgo cero.
- Cada lab trae objetivo, topología en palabras, comandos con su modo, verificación y el costo de
  saltearse un paso.

---

## 1. El simulador de vuelo del técnico de redes

Cisco Packet Tracer (PT) es, literalmente, el simulador de vuelo del técnico de redes: un entorno
donde armás redes con routers, switches, PCs y servidores **virtuales**, y practicás la
configuración sin romper nada real.

Nadie aprende a volar en un avión de pasajeros. Se aprende en simulador, con errores gratis. Con
Packet Tracer pasa lo mismo: cada comando que escribís acá es EXACTAMENTE el mismo que se escribe
en un router de verdad, pero si te equivocás no cae ninguna red — cae un routercito virtual que
podés borrar y empezar de nuevo.

> **La idea madre de este manual:** no es una lista de comandos para memorizar — es una secuencia
> de laboratorios para **hacer**. Cada lab arma UNA pieza: primero el router, después el switch,
> después DHCP, después rutas, después VLANs. Al final, el Lab 7 une todo en una red completa. Los
> comandos se aprenden usándolos, no repasándolos.

La progresión de este manual es deliberada. Si te salteás labs, los comandos posteriores no te
van a cerrar. Hacelos en orden — y cuando termines el 7, habrás construido una red que podría ser
la de una oficina chica de verdad.

### 1.1. Lo básico de Packet Tracer

- **Panel de dispositivos** (abajo a la izquierda): routers, switches, PCs, servidores, cables.
  Arrastrás al lienzo y conectás.
- **Modo Realtime:** la red funciona "en vivo". Ping, navegar, ver tablas — todo real, pero
  virtual.
- **Modo Simulación:** podés ver cada paquete **viajando** paquete a paquete por los cables, PDU
  por PDU. Es oro puro para entender qué pasa adentro — lo usamos en el Lab 5.
- **CLI:** para configurar un dispositivo, click sobre él → pestaña **CLI**. Ahí escribís los
  comandos como en un equipo real.
- **PCs:** click → pestaña **Desktop** → **IP Configuration** para poner IPs, o **Command Prompt**
  para `ping` e `ipconfig`.

Cada una resuelve un problema distinto, y conviene saber cuál. El **panel de dispositivos** es la
caja de herramientas: elegís una categoría (Routers, Switches, End Devices, Connections), ves los
modelos a la derecha y arrastrás el que quieras al lienzo. El **modo Realtime** es el tiempo
normal: hacés un ping y ves la respuesta, abrís una tabla y ves el estado actual; el 95 % de este
manual se hace así. El **modo Simulación** congela el tiempo para que veas cada **PDU** (*Protocol
Data Unit*, la unidad de datos que viaja por la red) caminando por los cables, como ver una
película cuadro por cuadro: es la diferencia entre entender y adivinar. La pestaña **CLI** es la
**CLI** (*Command Line Interface*, interfaz de línea de comandos): una pantalla negra donde
escribís texto y el equipo contesta con texto, sin botones ni menús, igual que la consola que usa
un técnico en el datacenter. Y la pestaña **Desktop** de la PC es la ventanita gráfica (**IP
Configuration**) para poner dirección, máscara y puerta de enlace, más un **Command Prompt**
simplificado donde corrés `ping` e `ipconfig`.

### 1.2. Los cuatro aparatos que vas a arrastrar al lienzo

Antes del primer lab, cinco definiciones que vas a ver todo el tiempo. Las pongo con la analogía
primero y la definición precisa después, porque así se quedan.

**Router (enrutador).** Imaginá un edificio de oficinas con varios pisos, y en la planta baja un
portero que sabe exactamente qué piso corresponde a cada número de teléfono interno. Si le pedís
algo que no es de su edificio, sabe a qué otro edificio mandarlo. Eso es un router: el equipo que
conecta **redes distintas** y decide por dónde mandar cada paquete. Técnicamente trabaja en la
**capa 3** (la capa de red del modelo de capas, donde viven las direcciones IP): tiene una
dirección IP por cada una de sus interfaces y una **tabla de rutas** que le dice qué camino tomar.

**Switch (conmutador).** Imaginá el acomodador de un teatro: sabe en qué butaca está sentada cada
persona y, cuando alguien le pasa un mensaje a "la butaca 14", lo lleva derecho ahí sin gritarlo a
toda la sala. Eso es un switch: el equipo que conecta aparatos que están en la **misma red** y los
comunica entre sí por dentro. Trabaja en **capa 2** (la capa de enlace, donde viven las direcciones
MAC), y aprende solo: mira de qué puerto viene cada mensaje y anota quién vive ahí.

**PC.** La computadora del usuario final: un aparato con una interfaz de red y una pestaña Desktop, y
la que hace los pings con los que vas a verificar todo.

**Dirección IP.** El identificador lógico de un equipo dentro de una red, un número de cuatro partes
como `192.168.1.10`. **IP** significa *Internet Protocol*, las reglas con las que dos equipos se mandan
datos aunque estén en redes distintas. Es la dirección postal del equipo.

**Dirección MAC.** La dirección física, grabada en la plaqueta de red, de 48 bits, que se escribe
como seis pares en hexadecimal (`0050.7966.6801`). **MAC** significa *Media Access Control*. Si la
IP es la dirección postal (cambia si te mudás de red), la MAC es el número de documento (viaja con
el aparato a donde vaya).

**Interfaz.** El "enchufe" lógico de un equipo, con nombre propio: `GigabitEthernet0/0`,
`FastEthernet0/1`, abreviados `Gi0/0` y `Fa0/1`. **Fast Ethernet** es el puerto de 10/100 Mbps;
**Gigabit Ethernet**, el de 1000 Mbps.

**LAN.** *Local Area Network*, red de área local: la red chica de un lugar (una casa, un aula).

**Cable directo y cruzado.** El **directo** (*straight-through*) va de un equipo a un switch o a un
router; el **cruzado** (*crossover*), entre equipos del mismo tipo (switch a switch, PC a PC). Packet
Tracer respeta la regla clásica: con el cable equivocado, el enlace no levanta y el LED queda ámbar.

### 1.3. Los modos del IOS: el prompt te dice dónde estás

Esta es la parte que más gente traba al principio, así que la resolvemos una sola vez.

**IOS** son las siglas de *Internetwork Operating System*, el sistema operativo que corre adentro de
los routers y switches Cisco. No tiene ventanas ni menús: tiene **modos**, o sea niveles de permiso. El
equipo te dice en qué modo estás con el **prompt**, ese texto que aparece antes del cursor. Para
*mirar* necesitás poco permiso; para *cambiar*, más; y para cambiar algo muy específico tenés que bajar
un escalón más, hasta el objeto exacto. Como en un edificio: desde la puerta de calle ves el cartel, en
el pasillo leés los expedientes, y para escribir en uno tenés que entrar a esa oficina.

| Prompt que ves | Nombre del modo | Para qué sirve | Cómo entrás | Cómo salís |
|----------------|-----------------|----------------|-------------|------------|
| `Router>` | EXEC de usuario | Mirar poquísimo | es el modo en el que arrancás | `exit` (cierra la sesión) |
| `Router#` | EXEC privilegiado | Ver todo, guardar, borrar | `enable` | `disable` |
| `Router(config)#` | Configuración global | Cambiar el sistema | `configure terminal` | `end` |
| `Router(config-if)#` | Configuración de interfaz | IP, activar el puerto, describirlo | `interface Gi0/0` | `exit` |
| `Router(config-line)#` | Configuración de línea | Consola y acceso remoto | `line console 0` o `line vty 0 4` | `exit` |
| `Router(config-subif)#` | Subinterfaz | Router on a stick | `interface Gi0/0.10` | `exit` |
| `Router(config-vlan)#` | Configuración de VLAN | Crear y nombrar una VLAN | `vlan 10` | `exit` |
| `Router(config-if-range)#` | Rango de interfaces | Varios puertos de una vez | `interface range Fa0/3 - 4` | `exit` |
| `Router(dhcp-config)#` | Configuración de pool DHCP | Repartir direcciones | `ip dhcp pool NOMBRE` | `exit` |

Leé la tabla como un mapa, no como algo para memorizar. Lo que hay que retener: **`>`** es el modo en
el que entrás (mirar casi nada), **`#`** el privilegiado (ver todo y guardar) y **`(config)#`** donde se
cambia la configuración; el resto son variantes de `(config)#` que aparecen cuando entrás a un objeto
puntual. **`exit`** sube un escalón (`(config-if)#` → `(config)#` → `#`) y **`end`** te devuelve de un
saque a `#` desde donde estés.

Y una advertencia que vale oro: los comandos de configuración **no existen** en modo `>`. Si escribís
`configure terminal` en `Router>` vas a ver un error de comando no reconocido, y no es que el comando
esté mal escrito: es que estás en el modo equivocado. Cuando algo "no existe" en un router Cisco, la
primera sospecha siempre es el modo.

### 1.4. El `?` y el TAB: la ayuda que ya está adentro

Nadie memoriza los comandos de Cisco. Se usan dos teclas y se aprende en el camino.

**`?` pregunta.** Escribí un signo de pregunta y apretá Enter: el equipo te muestra los comandos
disponibles **en el modo en el que estás parado**. `?` solo responde "¿qué puedo escribir acá?"; `ip ?`
responde "tengo un comando que empieza con `ip`, ¿qué puede llevar después?"; y `show ip ?` baja un
escalón más. Así se descubre un comando sin abrir un manual.

**TAB completa.** Escribí las primeras letras y apretá TAB: el IOS termina la palabra solo. `conf` +
TAB se convierte en `configure`. Es la forma de escribir rápido sin equivocarte en la ortografía,
que en Cisco es implacable.

**La regla de oro:** `?` es tu mejor amigo. Escribí cualquier comando a medias y `?` te muestra las
opciones. El IOS se autocompleta con **TAB**.

Si la lista de ayuda es larga, la consola se detiene con un `--More--` abajo: barra espaciadora para
seguir, `q` para cortar. No está trabado, te está mostrando de a una pantalla.

### 1.5. Cómo leer los bloques de comandos de este manual

Todos los bloques están escritos como los ves en pantalla, con el prompt adelante. Tres reglas para
leerlos:

1. **El prompt te dice el modo** (`R1>`, `R1#`, `R1(config)#`, `R1(config-if)#`) y **solo se escribe
   lo que va después del prompt**.
2. **Lo que sigue a `!` o a `←` es un comentario.** El `!` lo ignora el equipo; la flecha `←` es una
   anotación de este manual. Ninguna se escribe.
3. **Los espacios de más no importan.** Las columnas alineadas están para que se lea.

Y una distinción que confunde al principio: los bloques que empiezan con `PC0>` **no** se escriben en
el router, sino en el **Command Prompt** de la PC (Desktop → Command Prompt).

### Resumen

- Packet Tracer es un simulador: mismos comandos que un equipo real, cero riesgo, errores gratis.
- Realtime para trabajar, Simulación para entender: en simulación ves cada paquete viajar.
- El IOS no tiene menús, tiene modos, y el prompt te dice en cuál estás: `>`, `#` o `(config)#`.

---

## 2. Laboratorio 0: el primer plano

**Objetivo:** armar la topología más simple que existe y verificar que las PCs se ven entre sí.

**Qué vas a probar.** Que dos computadoras conectadas por un cable, con direcciones del mismo
rango, se pueden mandar un mensaje y recibir respuesta. Nada más que eso. Suena trivial y es la
base de todo lo que viene: si este ping no funciona, ningún lab posterior va a funcionar, porque
todos terminan con un ping igual a este.

### La topología, en palabras

Dos PCs, un cable. Nada de router, nada de switch. El cable sale del enchufe de red de la PC0 y
llega al enchufe de red de la PC1. Las dos PCs van a tener una dirección del mismo bloque
(`192.168.1.x`) y la misma máscara (`255.255.255.0`), que es lo que les dice "vos y yo estamos en
la misma red".

### Paso 1 — Armar la red

1. Abrí Packet Tracer.
2. Del panel, elegí **End Devices** → arrastrá **2 × PC** al lienzo.
3. Elegí **Connections** (cable) → seleccioná el cable **Copper Straight-Through**.
4. Hacé click en PC0, elegí **FastEthernet0**, y conectá al FastEthernet0 de PC1.

Los pasos 1 y 2 son puro arrastrar: **End Devices** (dispositivos finales) es donde viven las PCs,
impresoras y servidores, los aparatos que *consumen* la red en vez de transportarla. El paso 3 es el
que tiene truco: **Connections** es la caja de cables y adentro hay varios tipos; el que querés es el
**Copper Straight-Through**. El paso 4 es el que más se equivoca: al hacer click en la PC no se
conecta nada, se abre una lista de **interfaces** y vos elegís cuál usar, en los dos extremos. Recién
cuando elegiste los dos el cable queda tendido.

> **Dato que aparece en todos los exámenes:** PC a switch/PC se conecta con **cable directo**
> (straight-through); switch a switch o PC a PC se conecta con **cable cruzado** (crossover). Los
> equipos modernos detectan solos, pero Packet Tracer replica la regla clásica: si usás el cable
> equivocado, el link no levanta.

Fijate en la contradicción aparente de esa nota: dice que PC a PC va cruzado, y en el paso 4 usamos
directo. Packet Tracer, en la práctica, acepta el directo entre dos PCs; el enunciado clásico es el
que tenés que saber para el examen. Si el enlace no levanta, probá con cruzado.

### Paso 2 — Poner IPs

1. Click en **PC0** → **Desktop** → **IP Configuration**.
2. IP: `192.168.1.1` — Máscara: `255.255.255.0` (la máscara se completa sola si escribís la IP y
   tabulás).
3. Repetí en **PC1** con `192.168.1.2`.

Los LEDs de las interfaces deben estar en **verde** (link activo). Si están ámbar o apagados,
revisá el cable.

La **máscara de subred** (`255.255.255.0`) le dice a la PC qué parte de la dirección identifica a la
red y qué parte al equipo: con esa máscara, `192.168.1` es "mi red" y el último número es "quién soy
yo". Por eso las dos tienen que compartir los tres primeros números: si una fuera `192.168.1.1` y la
otra `192.168.2.2`, cada una pensaría que la otra está en un edificio ajeno y no le hablaría sin un
router en el medio.

El LED verde es la confirmación visual de capa 1: significa que hay electricidad y que los dos
extremos se reconocen. Un LED ámbar significa que hay cable pero los extremos no se ponen de
acuerdo; un LED apagado, que no hay nada conectado.

### Paso 3 — Verificar

En el **Command Prompt** de PC0:

```
PC0> ping 192.168.1.2
```

Debés recibir las 4 respuestas `Reply from 192.168.1.2...`. Si falla, andá repasando: ¿cable bien
conectado? ¿misma red? ¿mascaras iguales?

**Qué hace el comando.** `ping` manda cuatro mensajes chiquitos llamados *echo request* (pedido de
eco) a la dirección que le indicás, y espera un *echo reply* (respuesta de eco) por cada uno. Es el
mismo mecanismo que cuando chocás las manos en la oscuridad para saber si el otro está ahí.

**Qué significa cada línea de la salida.** Cada respuesta `Reply from 192.168.1.2: bytes=32
time<1ms TTL=128` te dice cuatro cosas: quién contestó, cuántos bytes viajaron (32), cuánto tardó y
cuántos saltos de router le quedan de vida al paquete (TTL, *Time To Live*). En una red local el
tiempo es casi cero y no hay saltos.

**Qué tenés que ver.** Cuatro respuestas y un resumen abajo que dice cuántos paquetes se enviaron,
cuántos volvieron y cuántos se perdieron. Si el resumen dice `4 sent, 4 received, 0% loss`, la red
funciona. Si dice `0 received, 100% loss`, no hay camino de ida o no hay camino de vuelta.

**Lo que acabás de aprender, sin darte cuenta:** el ping es el martillo universal del diagnóstico de
redes. Lo vas a usar en TODOS los labs de acá en adelante como prueba final de cada etapa.

### Si te saltás un paso

- **Sin cable:** el ping dice `Destination host unreachable` o directamente no sale. Los LEDs están
  apagados.
- **Con cable equivocado:** los LEDs quedan ámbar y el ping falla igual. Es el mismo síntoma que no
  tener cable, y por eso conviene mirar los LEDs antes de tocar configuraciones.
- **Con una IP mal escrita** (por ejemplo `192.168.1.1` y `192.168.1.12` con máscara
  `255.255.255.0`): funciona, porque las dos están en la misma red. La máscara es la que manda, no
  el número que elegiste.

### Resumen

- Dos PCs y un cable directo ya son una red: lo mínimo que existe.
- La máscara `255.255.255.0` define qué parte de la IP es la red y qué parte es el equipo.
- El LED verde confirma el cable; el ping confirma que hay camino de ida y de vuelta.

---

## 3. Laboratorio 1: el router — acceso y seguridad básica

**Objetivo:** entrar al router, ponerle nombre, protegerlo con contraseñas y guardar la
configuración.

**Qué vas a probar.** Que un router recién sacado de la caja no está protegido, que cualquiera con
un cable puede entrar, y que en cinco comandos lo dejás con nombre propio, con contraseña para el
acceso físico y para el acceso remoto, y con la configuración guardada para que sobreviva a un
corte de luz.

Este lab no tiene PCs ni cables de red: es el router solo, y vos entrando por la consola. Es el
lab más importante de todos, porque todo lo que sigue se hace con los comandos que aprendés acá.

### La topología, en palabras

Un router, nada más. Del panel arrastrás el aparato al lienzo y te conectás a él de la única forma
en que se puede sin red: por la consola. En Packet Tracer no hay cable de consola que tender: la
pestaña **CLI** del router *es* la consola.

### Paso 1 — Armar la red

1. Del panel, elegí **Routers** → arrastrá un **1941**.
2. Click sobre el router → pestaña **CLI**. Apretá Enter si hace falta.

El **1941** es el modelo de router que usa Packet Tracer para los labs: tiene dos puertos
GigabitEthernet, que son los que vas a configurar en el próximo lab. Cuando apretás Enter en la
pestaña CLI, el equipo te muestra su prompt. Al principio es `Router>`, porque el equipo todavía no
tiene nombre. El nombre se lo vas a poner vos en el paso 3.

### Paso 2 — Los modos del IOS

Todo el laboratorio depende de entender los modos. Cada modo te deja hacer más cosas; la config se
hace en el último:

```
Router> enable                     ← modo EXEC privilegiado (comandos de "ver")
Router# configure terminal         ← modo configuración global (comandos de "cambiar")
Router(config)#                    ← acá ya se configuran servicios
```

- `>` = modo EXEC de usuario (solo ver, casi nada).
- `#` después de `enable` = modo EXEC privilegiado (ver todo, borrar, guardar).
- `(config)#` = modo configuración global (cambiar el sistema).

**La regla de oro:** `?` es tu mejor amigo. Escribí cualquier comando a medias y `?` te muestra las
opciones. El IOS se autocompleta con **TAB**.

Este bloque es la versión en vivo de la tabla del capítulo 1.3: `enable` no configura nada, solo te
sube de nivel de permiso; `configure terminal` (que se abrevia `conf t`) te mete en el modo donde se
cambian las cosas; y el prompt cambia para que sepas siempre en cuál estás.

**Qué tenés que ver.** Después de `enable`, el `>` se convierte en `#`. Después de `configure
terminal`, aparece `(config)` en el medio. Si el prompt no cambió, el comando no entró.

**EXEC** es la abreviación de *executive*: el modo donde el equipo *ejecuta* cosas (mostrar, probar,
guardar) en vez de *definirlas*.

### Paso 3 — Nombre y contraseñas

```
Router>  enable
Router#  configure terminal
Router(config)#  hostname R1            ! Cambia el nombre del equipo

R1(config)#  enable secret cisco123     ! Contraseña CIFRADA para el modo privilegiado

R1(config)#  line console 0             ! Consola = acceso físico directo al equipo
R1(config-line)#  password cisco
R1(config-line)#  login                 ! Exige contraseña para entrar
R1(config-line)#  exit

R1(config)#  line vty 0 4               ! VTY = acceso remoto (Telnet/SSH), líneas 0 a 4
R1(config-line)#  password cisco
R1(config-line)#  login
R1(config-line)#  exit

R1(config)#  service password-encryption   ! Cifra las contraseñas "en claro" que quedaron
```

Vamos línea por línea, porque este es el bloque que más vas a reusar en tu vida.

**`hostname R1`** le pone nombre al equipo, y no es decorativo: ese nombre aparece en el prompt (`R1>`
en vez de `Router>`) y en los logs. En una red con diez routers es la única forma de saber en cuál
estás escribiendo. Por eso el bloque cambia de `Router(config)#` a `R1(config)#` a mitad de camino:
es el efecto del comando, no un error del manual.

**`enable secret cisco123`** pone la contraseña que te van a pedir para pasar de `>` a `#`. Se
guarda **cifrada**. Es la contraseña más importante del equipo, porque con acceso a `#` podés ver
toda la configuración y guardar cambios.

**`line console 0`** entra al modo de configuración de la **línea de consola**, el acceso físico: el
que tenés cuando enchufás un cable en el puerto de consola. El `0` es el número de esa línea (hay una
sola consola, la cero). Ahí adentro:

- **`password cisco`** define la contraseña de esa línea.
- **`login`** es el que hace que la contraseña se **exija**. Sin `login`, la contraseña está escrita
  pero nadie te la pide: es el error clásico de "puse la contraseña y no funciona".
- **`exit`** sube un escalón, de vuelta a `(config)#`.

**`line vty 0 4`** hace lo mismo para las **VTY**, las *virtual teletype*: las líneas de acceso
**remoto**, las que llegan por la red (Telnet o SSH). El `0 4` significa "las líneas 0, 1, 2, 3 y 4",
o sea cinco sesiones remotas simultáneas.

**`service password-encryption`** cifra las contraseñas que quedaron en texto plano (`password
cisco` de la consola y de las VTY). No toca `enable secret`, que ya estaba cifrada.

**Qué tenés que ver.** Después de `hostname R1`, el prompt cambia a `R1`. Después de cada bloque de
`line`, volvés a `R1(config)#` con `exit`. No hay mensaje de "ok": en Cisco, cuando un comando de
configuración sale bien, el equipo simplemente te devuelve el prompt. Silencio = éxito. El único
mensaje es el aviso que aparece al escribir `login` en la consola, recordándote que ahora va a pedir
contraseña.

> **Diferencia fina que preguntan siempre:** `enable password` guarda la contraseña en texto plano;
> `enable secret` la guarda cifrada (usá SIEMPRE secret). `service password-encryption` cifra las
> demás (consola, vty) — es criptografía débil, pero al menos no es texto plano. En el mundo real,
> además, usás SSH y no Telnet — en Packet Tracer el vty con password alcanza para practicar el
> concepto.

**Telnet** y **SSH** son los dos protocolos de acceso remoto por consola. Telnet manda todo en texto
plano, contraseña incluida; **SSH** (*Secure Shell*) va cifrado. Por eso en el mundo real se usa SSH y
Telnet está prohibido; en Packet Tracer, para practicar el concepto de línea VTY, con contraseña
alcanza.

### Paso 4 — Guardar (esta parte NO se saltea nunca)

Todo lo que configuraste vive en la **RAM** (running-config). Si apagás, se pierde. Para que
sobreviva:

```
R1#  copy running-config startup-config
```

Respuesta: `Destination filename [startup-config]?` → **Enter**.

**Qué hace el comando.** Copia la configuración activa en memoria (`running-config`) a la memoria que
no se borra (`startup-config`). El equipo te pregunta a qué archivo la querés copiar y te sugiere el
nombre entre corchetes: si apretás Enter, acepta la sugerencia.

**Qué tenés que ver.** Primero la pregunta del nombre del archivo, después una línea de progreso y
finalmente un `[OK]`, que es la confirmación de que quedó guardada.

> **El detalle de la RAM vs NVRAM:** `running-config` es la configuración ACTIVA (vive en RAM, se
> pierde al apagar). `startup-config` es la configuración GUARDADA (vive en NVRAM, persiste). La
> secuencia de tu vida profesional: configurar → verificar → guardar. Si no guardás, el router
> "olvida" todo al cortarse la luz.

**RAM** es la memoria de trabajo, la que se vacía cuando se corta la luz. **NVRAM** es *Non-Volatile
RAM*, memoria que no se borra sin energía: ahí vive la configuración guardada. Cuando el router
arranca, lee la NVRAM y la carga en la RAM. Es lo que hace un procesador de texto: mientras escribís
está en memoria, y si no guardás y se corta la luz, perdiste el trabajo.

**Si te saltás este paso**, todo lo demás funciona hasta que apagás el equipo o lo reiniciás: ahí el
router vuelve a estar sin nombre, sin contraseñas y sin IPs. En Packet Tracer se ve clarísimo porque
el prompt vuelve a decir `Router>`.

### Paso 5 — Verificación

```
R1#  show running-config         ! La config activa completa
R1#  show startup-config         ! La config guardada
R1#  show version                ! Modelo, cantidad de RAM, uptime
```

Los tres son comandos de `#`, no de `(config)#`: se ejecutan desde el modo privilegiado (si estás en
configuración, escribí `end` primero).

**`show running-config`** te muestra la configuración activa completa: nombre, contraseñas, líneas,
interfaces. Es el "¿cómo está este equipo ahora mismo?".

**`show startup-config`** te muestra lo que está guardado en NVRAM. Si dice lo mismo que el anterior,
guardaste bien; si está vacío o más corto, te olvidaste el paso 4.

**`show version`** te da el modelo exacto, la versión del IOS, cuánta RAM tiene el equipo y cuánto
lleva encendido (*uptime*). El uptime es un dato de diagnóstico: si un equipo se reinició solo, acá lo
ves.

**Qué tenés que ver.** En `show running-config` buscá tu nombre (`hostname R1`), tu `enable secret` y
los dos bloques `line`. En `show startup-config`, lo mismo. En `show version`, el modelo `1941` y el
uptime.

Una advertencia sobre las contraseñas: `enable secret cisco123` no aparece legible, aparece como un
hash, y eso es correcto. En cambio `password cisco` de las líneas, antes de
`service password-encryption`, sí aparece en texto plano — y por eso existe ese comando.

### Si te saltás un paso

- **Sin `enable secret`:** cualquiera que se conecte entra a `#` sin que le pidan nada y ve todo.
- **Sin `login`:** escribiste la contraseña pero el equipo no la pide. Es el error más común del lab.
- **Sin `service password-encryption`:** las contraseñas de consola y VTY quedan legibles en
  `show running-config`.

### Resumen

- El router arranca sin nombre y sin contraseñas: protegerlo son cinco comandos.
- `enable secret` para el modo privilegiado; `password` + `login` para consola y VTY.
- `login` es el que exige la contraseña; sin él, la contraseña está escrita pero no se usa.

---

## 4. Laboratorio 2: una red con router — IPs y verificación

**Objetivo:** conectar PCs al router, asignar IPs y activar el paso más olvidado: `no shutdown`.

**Qué vas a probar.** Que un router es lo que le permite a una PC salir de su propia red, y que una
interfaz de router está configurada pero **muerta** hasta que la activás. Este lab introduce el
comando que más exámenes hace perder y la salida de pantalla que te dice, en una sola línea, si el
equipo está bien o mal.

### La topología, en palabras

Tres aparatos. Un router (el R1 del lab anterior, con su nombre y sus contraseñas), un switch de 24
puertos, y dos PCs. El cableado, de izquierda a derecha:

- PC0 → switch, puerto `Fa0/1`
- PC1 → switch, puerto `Fa0/2`
- switch → router, desde el puerto `Gi0/1` del switch al puerto `Gi0/0` del router

Los dos primeros cables son directos (PC a switch). El tercero también es directo (switch a router).
La diferencia está en qué puerto del switch usás: los de PC van a los FastEthernet numerados, y el
que va al router va a uno de los dos GigabitEthernet.

- **1 router 1941** (R1, el del lab anterior), **1 switch 2960**, **2 PCs**.
- Conectá: PC0 → switch Fa0/1, PC1 → switch Fa0/2, switch Gi0/1 → router **GigabitEthernet 0/0**.

> **Por qué al router van los cables del switch por Gi0/1 y no por Fa0/1:** los switches 2960 tienen
> 24 puertos FastEthernet (10/100 Mbps) y 2 GigabitEthernet (arriba). Los enlaces "de columna"
> (switch → router, switch → switch) usan los gigabit. Es una convención, pero es la que se ve en
> todas las topologías reales.

La lógica de la convención: los gigabit son más rápidos y hay pocos, así que se reservan para los
enlaces que llevan el tráfico de **muchas** PCs juntas. Un FastEthernet tiene una PC atrás; un
GigabitEthernet tiene un router u otro switch, o sea todo el resto de la red. Si en tu lab igual usás
Fa0/24 para el router, funciona; pero cuando trabajes con topologías ajenas, el Gi de arriba es el
uplink.

### Paso 2 — Configurar el router

```
R1>  enable
R1#  configure terminal
R1(config)#  interface gigabitEthernet 0/0
R1(config-if)#  description LAN - Hacia el Switch   ! Etiqueta para los humanos
R1(config-if)#  ip address 192.168.1.1 255.255.255.0
R1(config-if)#  no shutdown                          ! ACTIVA la interfaz
R1(config-if)#  end
```

**El comando que se olvida en el 90% de los exámenes: `no shutdown`.** Las interfaces de los routers
arrancan en estado *administratively down*. Sin `no shutdown`, la interfaz está configurada pero no
transmite NADA — es como un grifo con el agua cortada.

**`interface gigabitEthernet 0/0`** entra al modo de configuración de esa interfaz puntual: el prompt
pasa a `(config-if)#`, o sea bajaste del equipo entero a un enchufe. **`description LAN - Hacia el
Switch`** es una etiqueta de texto libre que el router ignora: sirve para que dentro de seis meses
sepas para qué era ese cable. **`ip address 192.168.1.1 255.255.255.0`** le asigna dirección y
máscara, y esa IP es la que va a ser el **gateway** de las PCs. **`no shutdown`** activa la interfaz:
es literalmente "apagar el apagado", porque viene apagada de fábrica. **`end`** te devuelve a `R1#`
de un saque.

**Qué tenés que ver.** Después de `no shutdown`, el equipo imprime un par de líneas de estado
avisando que la interfaz cambió a `up`. Si el cable está mal, vas a ver `changed state to down` y ahí
ya sabés dónde está el problema.

### Paso 3 — Configurar las PCs

- **PC0:** IP `192.168.1.10`, Máscara `255.255.255.0`, Gateway `192.168.1.1`.
- **PC1:** IP `192.168.1.11`, Máscara `255.255.255.0`, Gateway `192.168.1.1`.

En la PC: **Desktop** → **IP Configuration**, y completás los tres campos. El tercero es el nuevo
respecto del Lab 0.

> **¿Por qué el gateway?** El gateway es la puerta de salida hacia OTRAS redes. Cuando la PC quiere
> llegar a algo que NO está en su red (192.168.1.x), entrega el paquete al gateway — que es el
> router. Sin gateway, las PCs se ven entre sí pero no salen de la LAN.

**Gateway** (*default gateway*, puerta de enlace predeterminada) es el equipo al que la PC le entrega
todo lo que no sabe entregar: el portero del edificio. Si el destinatario está en tu mismo piso, vas
vos; si está en otro edificio, se lo dejás al portero. Técnicamente: cuando la PC ve que la IP destino
no está en su propia red (según su máscara), manda el paquete a la MAC del gateway en vez de buscar la
MAC del destino.

Fijate en los números: las IPs de las PCs son `.10` y `.11`, y el router es `.1`. La convención de usar
`.1` para el gateway es universal, y conviene respetarla.

### Paso 4 — Verificar

En el router:

```
R1#  show ip interface brief
```

Salida esperada:

```
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0     192.168.1.1     YES manual up                    up
GigabitEthernet0/1     unassigned      YES unset  administratively down down
```

El estado que buscás: **up/up**. Si dice *administratively down* → falta `no shutdown`. Si dice
*down/down* → el cable o el otro lado no están conectados.

**Qué hace el comando.** `show ip interface brief` (a veces abreviado `sh ip int br`) muestra, en una
tabla de dos líneas por router, todas las interfaces con su dirección y su estado. Es el primer
comando que se escribe en cualquier troubleshooting.

**Qué significa cada columna:**

| Columna | Qué te dice |
|---------|-------------|
| `Interface` | El nombre del puerto |
| `IP-Address` | La IP asignada, o `unassigned` si no tiene |
| `OK?` | Si la IP es válida (`YES` casi siempre) |
| `Method` | De dónde salió la IP: `manual` (la escribiste vos), `unset` (no hay), `DHCP` (la pidió) |
| `Status` | Estado **físico**: `up`, `down` o `administratively down` |
| `Protocol` | Estado del **protocolo** de línea: `up` si el otro extremo responde |

Las dos últimas columnas son las importantes, y su combinación es el diagnóstico: **`up`/`up`** es todo
bien; **`administratively down`/`down`** es que la apagaste vos o nadie la prendió, o sea falta `no
shutdown`; **`down`/`down`** es que está prendida pero no hay nada del otro lado (cable desconectado o
equipo de enfrente apagado).

En la salida de ejemplo, `GigabitEthernet0/1` está en `administratively down` porque en este lab no la
tocamos: es la interfaz que va a usar el Lab 5 para el enlace entre routers.

Desde la PC0:

```
PC0> ping 192.168.1.11      ← contra la otra PC
PC0> ping 192.168.1.1       ← contra el gateway
```

Ambos deben responder. Con eso ya tenés una LAN funcional con salida controlada por el router.

**Qué estás probando con cada ping.** El primero va de PC a PC: atraviesa el switch dos veces y no
toca el router. El segundo va de PC a router: prueba que el gateway existe y responde. Si el primero
funciona y el segundo no, el problema está en el router o en el cable al router; si el segundo
funciona y el primero no, el problema está en el switch o en la PC1.

**Qué tenés que ver.** Cuatro respuestas en cada ping, y en el segundo la respuesta viene de
`192.168.1.1`. Si el ping al gateway dice `Destination host unreachable`, casi siempre es `no
shutdown` olvidado.

### Si te saltás un paso

- **Sin `no shutdown`:** las PCs se ven entre sí (el switch no necesita al router) pero el ping al
  gateway falla. `show ip interface brief` lo delata con `administratively down`.
- **Sin gateway en las PCs:** todo lo de este lab sigue funcionando, porque las dos PCs están en la
  misma red. El problema aparece recién en el Lab 5, cuando haya que salir a otra red. Y ese es el
  punto del lab: el gateway no se nota hasta que hace falta.
- **Con la IP del router repetida en una PC:** Packet Tracer te avisa del conflicto de direcciones y
  el ping se comporta de forma errática.

### Resumen

- Una red con router tiene tres piezas: PCs, switch y el router como puerta de salida.
- `ip address` define la IP de la interfaz; `no shutdown` la activa. Sin lo segundo, no transmite.
- El gateway es la dirección del router dentro de la red de las PCs.

---

## 5. Laboratorio 3: el switch — administración y MACs

**Objetivo:** darle IP de administración al switch y ver con tus ojos cómo aprende las direcciones
MAC de los equipos que tiene conectados.

**Qué vas a probar.** Dos cosas que parecen contradictorias y no lo son: que un switch funciona sin
configurar absolutamente nada, y que igual necesita una IP para que vos puedas administrarlo. Y
además: que el switch arma solo una tabla de quién vive en cada puerto, mirando pasar el tráfico.

### Paso 1 — Lo que ya tenés armado

Usá la topología del Lab 2 (R1 + S1 + 2 PCs). El switch funciona sin configuración: es capa 2 pura.
Pero para **administrarlo** (entrar por red y no solo por consola) necesita una IP — y para que
responda desde una red remota, un gateway por defecto.

**Capa 2** es la capa de enlace: la que lleva datos de un aparato al de al lado, dentro de la misma
red, usando direcciones MAC. Un switch es capa 2 puro: no mira direcciones IP ni decide rutas, y por
eso funciona recién sacado de la caja.

El switch de este lab no tiene nombre (`Switch>`) ni IP: si querés administrarlo desde otra
computadora de la red, no hay a dónde conectarse. Eso es lo que resuelve este lab.

### Paso 2 — Configurar el switch

```
Switch>  enable
Switch#  configure terminal
Switch(config)#  hostname S1

S1(config)#  interface vlan 1              ! La interfaz virtual de administración
S1(config-if)#  ip address 192.168.1.254 255.255.255.0
S1(config-if)#  no shutdown
S1(config-if)#  exit

S1(config)#  ip default-gateway 192.168.1.1   ! La puerta hacia otras redes
S1(config)#  end
S1#  copy running-config startup-config
```

Los primeros tres comandos son los mismos del Lab 1, aplicados a otro aparato: subir de modo, entrar
a configuración y ponerle nombre. Después cambia todo, porque un switch no se configura como un
router.

**`interface vlan 1`** es lo raro del bloque. Una **VLAN** (*Virtual Local Area Network*, red de área
local virtual) es una red lógica dentro del switch: un switch se puede partir en varias redes
separadas, y la **VLAN 1** es la que existe siempre, la de fábrica. `interface vlan 1` no es un
enchufe físico: es una interfaz **virtual** que representa a todo el switch, y la IP que le pongas ahí
es la dirección del switch como aparato.

**`ip address 192.168.1.254 255.255.255.0`** le da la última dirección útil de la red, una convención
para equipos de infraestructura.

**`no shutdown`** también acá: la interfaz virtual viene apagada.

**`ip default-gateway 192.168.1.1`** le dice al switch cuál es la puerta de salida para cuando él mismo
quiera hablar con alguien de otra red; es `default-gateway`, no `ip route`, porque un switch de capa 2
no tiene tabla de rutas.

**`end`** y **`copy running-config startup-config`** son los de siempre: salir y guardar, que es
parte de configurar y no un extra.

**Qué tenés que ver.** El prompt pasa de `Switch` a `S1` después del `hostname`. Después de
`no shutdown` aparece el aviso de que la interfaz `Vlan1` cambió a `up`. Y al final, el `[OK]` del
guardado.

> **La idea que confunde a todos:** el switch NO enruta. La IP en `interface vlan 1` es SOLO para que
> vos (o un servidor de monitoreo) puedas entrar "por la red" a administrarlo. El tráfico de las PCs
> pasa por el switch sin tocar esa IP. Es como tener un número de interno de la recepción: no es la
> central, pero podés llamar a la recepción.

### Paso 3 — Ver el aprendizaje de MACs

Ejecutá un ping entre PC0 y PC1 y mirá:

```
S1#  show mac address-table
```

Salida esperada:

```
Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
   1    0050.7966.6801    DYNAMIC     Fa0/1
   1    0050.7966.6802    DYNAMIC     Fa0/2
```

Dos MACs, cada una en su puerto: el switch **aprendió** quién vive en cada puerto, solo viendo las
tramas pasar. Ese mecanismo (aprender del origen, reenviar por el destino) es el corazón de la capa 2
que ya estudiaste: acá lo estás viendo en vivo.

**Qué hace el comando.** Muestra la **tabla de direcciones MAC**: la lista de "quién está en qué
puerto" que el switch construyó solo. No la configuraste vos: la armó mirando de qué puerto entraba
cada trama.

**Por qué hay que hacer el ping primero.** Al principio la tabla está vacía. El switch aprende **del
origen**: cuando llega una trama, anota "la MAC que mandó esto vive en este puerto". Si nadie manda
nada, no hay nada que aprender. El ping es lo que llena la tabla; si la mirás antes, vas a ver una
tabla vacía y vas a creer que está roto.

**Qué significa cada columna:**

| Columna | Qué te dice |
|---------|-------------|
| `Vlan` | En qué VLAN está ese puerto (acá todas en la 1, la de fábrica) |
| `Mac Address` | La dirección física del equipo, en formato de tres grupos de cuatro hexadecimales |
| `Type` | `DYNAMIC` = la aprendió sola mirando tráfico; `STATIC` = la escribió un humano |
| `Ports` | En qué puerto del switch se la vio entrar |

**Qué tenés que ver.** Dos líneas, una por PC, cada una en su puerto (`Fa0/1` y `Fa0/2`), todas
`DYNAMIC`. Si ves una sola, la otra PC no mandó tráfico todavía. Y si ves una MAC repetida en dos
puertos distintos, hay un loop: eso se resuelve con STP (*Spanning Tree Protocol*, el protocolo que
apaga enlaces redundantes para evitar bucles).

Las entradas `DYNAMIC` se vencen si el equipo deja de mandar tráfico un rato; las `STATIC` quedan hasta
que las borres.

Otros shows de switch que vas a usar siempre:

```
S1#  show interfaces status      ! Estado de TODOS los puertos de un vistazo
S1#  show vlan brief             ! VLANs existentes y qué puertos están en cada una
S1#  show ip interface brief     ! La IP de administración
```

**`show interfaces status`** es la vista de panel completo: una línea por puerto con su estado, su
velocidad y su VLAN, ideal para detectar de un vistazo un puerto que debería estar conectado y está
caído. **`show vlan brief`** lista las VLANs y qué puertos pertenecen a cada una; acá todavía no creaste
ninguna, así que vas a ver todo en la VLAN 1. **`show ip interface brief`** te muestra la `Vlan1` con la
IP `.254`, la prueba de que la IP de administración quedó puesta.

### Si te saltás un paso

- **Sin `interface vlan 1` ni IP:** el switch sigue reenviando tráfico entre las PCs sin problema
  (el ping del paso 3 funciona), pero no lo podés administrar por red. Es el ejemplo perfecto de que
  administración y tráfico son dos cosas distintas.
- **Sin `ip default-gateway`:** lo administrás desde la misma red, pero no desde otra. No lo notás
  hasta que intentás entrar desde afuera.
- **Sin el ping previo:** la tabla de MACs aparece vacía y parece un error. No lo es: el switch solo
  aprende de lo que ve pasar.

### Resumen

- El switch funciona sin configurar: es capa 2 y no necesita IP para reenviar tráfico.
- La IP de `interface vlan 1` es para administrarlo, no para que las PCs naveguen.
- `ip default-gateway` le da salida al switch para su propia administración remota.

---

## 6. Laboratorio 4: DHCP en el router

**Objetivo:** que el router reparta IPs solas, sin configurar una a una.

**Qué vas a probar.** Que configurar direcciones a mano no escala: con tres PCs es un trámite, con
trescientas es imposible. Y que el router puede hacer de repartidor automático, con reglas: qué rango
entrega, qué dirección le dice a cada PC que es su puerta de salida, y cuáles direcciones se guarda
para no repartirlas nunca.

**DHCP** son las siglas de *Dynamic Host Configuration Protocol*, protocolo de configuración dinámica
de equipos: es el mecanismo por el cual una computadora pide "¿me das una dirección?" al conectarse y
alguien le contesta con una IP, una máscara, un gateway y hasta un servidor de nombres. Es lo que pasa
en tu casa cuando te conectás al wifi.

### Paso 1 — Sacarle la IP manual a las PCs

Con las PCs del Lab 3, andá a **IP Configuration** de cada PC y cambiá a **DHCP** (el botón de radio).
Las PCs pierden su IP y se quedan esperando... que alguien les conteste. Todavía nadie las va a
atender: configurá el router.

Fijate en lo que pasa en pantalla: al elegir DHCP, la PC manda un pedido a gritos (un **broadcast**,
un mensaje dirigido a todos los de la red, porque todavía no sabe a quién preguntarle) y se queda
esperando. Si nadie contesta en unos segundos, se rinde y muestra `0.0.0.0` o un error. Ese momento de
silencio es la mejor demostración de por qué existe DHCP: sin servidor, no hay dirección.

### Paso 2 — Configurar el pool

```
R1#  configure terminal

R1(config)#  ip dhcp excluded-address 192.168.1.1 192.168.1.20
```

Ese comando le dice a DHCP: "estas IPs NO las repartas" (son las que ya tienen el router, el switch, y
las que más adelante tendrán servidores o impresoras).

**Cómo se lee.** `excluded-address` recibe un rango: desde la primera dirección hasta la última. Acá va
de `.1` a `.20`, o sea veinte direcciones reservadas. La razón: el router es `.1`, el switch es `.254`,
y los servidores e impresoras suelen tener direcciones fijas. Si DHCP las repartiera, tendrías dos
equipos con la misma IP y una red rota de una forma muy difícil de diagnosticar.

```
R1(config)#  ip dhcp pool LAN1
R1(dhcp-config)#  network 192.168.1.0 255.255.255.0   ! La red a repartir
R1(dhcp-config)#  default-router 192.168.1.1           ! Gateway que recibirán las PCs
R1(dhcp-config)#  dns-server 8.8.8.8                   ! DNS que les va a decir
R1(dhcp-config)#  lease 7                              ! Duración del arriendo en días
R1(dhcp-config)#  end
```

**`ip dhcp pool LAN1`** crea un **pool** (un lote) de direcciones y le pone nombre; el prompt cambia a
`(dhcp-config)#` y todo lo que escribas le pertenece a ese pool. **`network 192.168.1.0
255.255.255.0`** define qué red va a repartir: la red entera, y el rango concreto sale de restarle las
excluidas.

**`default-router 192.168.1.1`** es el gateway que DHCP les va a decir a las PCs que usen;
sin esta línea reciben IP pero no tienen puerta de salida. **`dns-server 8.8.8.8`** les dice qué
servidor de nombres usar (**DNS**, *Domain Name System*: el servicio que traduce nombres como
`google.com` a direcciones IP); en Packet Tracer es solo un dato que se entrega.

**`lease 7`** define la
duración del **arriendo** en días: pasados los siete, la PC tiene que renovar, y así las direcciones se
reciclan cuando un equipo se va.

**Qué tenés que ver.** El prompt cambiando a `(dhcp-config)#` al entrar al pool y volviendo a
`R1(config)#` al salir. Y, del lado de las PCs, que al cabo de unos segundos dejan de decir
`0.0.0.0` y muestran una IP del rango repartible.

### Paso 3 — Verificar

Las PCs ya deberían tener IP automática. En el router mirá quién se llevó qué:

```
R1#  show ip dhcp binding
```

Salida esperada:

```
Bindings from all pools not separated by VRF:
IP address          Client-ID/            Lease expiration        Type
                    Hardware address/
                    User name
192.168.1.21        0050.7966.6801         000017.00000000        Automatic
```

> **Fijate en el detalle del "cómo se asigna":** la primera PC se llevó la `.21`. Las `.1` a `.20`
> quedaron excluidas de la repartición. Y ojo lo que aprendió el router: la tabla `binding` asocia IP
> asignada con la **MAC** del cliente — DHCP y MAC trabajan juntos, uno reparte y el otro identifica.

**Qué hace el comando.** `show ip dhcp binding` muestra los **arriendos activos**: qué IP se entregó, a
qué equipo y por cuánto tiempo. Es la lista de "quién tiene qué" en este momento.

**Qué significa cada columna:**

| Columna | Qué te dice |
|---------|-------------|
| `IP address` | La dirección entregada |
| `Client-ID/ Hardware address/ User name` | A quién se la entregó: normalmente la MAC del equipo |
| `Lease expiration` | Cuánto le queda al arriendo (días y horas) |
| `Type` | `Automatic` = entregada sola por el pool; también existen `Manual` (fija) y `Static` |

La primera línea de la salida (`Bindings from all pools not separated by VRF:`) es un encabezado del
IOS: **VRF** es *Virtual Routing and Forwarding*, una técnica para tener varias tablas de rutas
separadas en el mismo equipo. Acá no usás VRF, así que es solo ruido que podés ignorar.

**Qué tenés que ver.** Una línea por PC, con IP entre `.21` y `.254` y la MAC del equipo. Y el detalle
que confirma que las exclusiones funcionaron: **nunca** una IP entre `.1` y `.20`.

Una aclaración sobre el `000017` de la salida: es la salida de ejemplo que traía el manual original,
copiada de una sesión con otro `lease`. Con `lease 7` lo que vas a ver al lado de tu IP es un arriendo
de siete días. No compares ese número dígito por dígito: mirá que haya un valor, que es lo que
confirma que el arriendo está activo.

Otros shows útiles:

```
R1#  show ip dhcp pool          ! Configuración del pool y estadísticas
R1#  show ip dhcp conflict      ! IPs que dos equipos reclamaron (conflictos)
```

**`show ip dhcp pool`** muestra la configuración de cada pool (red, gateway, DNS, lease) y sus
estadísticas: cuántas direcciones hay en total, cuántas se entregaron y cuántas quedan libres. Es el
comando para saber si te estás quedando sin direcciones.

**`show ip dhcp conflict`** lista las direcciones que DHCP detectó como conflictivas, porque dos
equipos las reclamaron. Es la primera parada cuando la red se comporta de forma rara y sospechás de
una IP duplicada.

### Paso 4 (opcional pero valioso): DHCP en otra red

¿Y si el servidor DHCP está en OTRA red? Los mensajes DHCP son **broadcasts** — y los broadcasts no
cruzan routers. La solución es una línea en la interfaz que está del lado de las PCs:

```
R1(config)#  interface gigabitEthernet 0/0
R1(config-if)#  ip helper-address 192.168.2.10   ! IP del servidor DHCP de la otra red
```

Sin esa línea, las PCs de esta LAN jamás le "hablan" al servidor de la red 2.

**Qué hace el comando.** `ip helper-address` convierte al router en intermediario: cuando llega un
broadcast DHCP por esa interfaz, en vez de descartarlo lo reenvía como mensaje dirigido a la IP que le
indicas. Es un ayudante que le lleva el pedido al servidor que está lejos.

**Por qué hace falta.** El router, por diseño, no reenvía broadcasts a otras redes (si lo hiciera, un
broadcast inundaría todas). Pero DHCP depende de broadcasts, así que sin el helper el pedido muere en
el router.

**Qué tenés que ver.** Si el servidor `192.168.2.10` existe y tiene un pool para esta red, las PCs
reciben IP. Si no existe, las PCs se quedan sin dirección y en el router no ves ningún arriendo.

### Si te saltás un paso

- **Sin `excluded-address`:** DHCP puede entregar `.1` (la del router) o `.254` (la del switch) a una
  PC, y ahí tenés dos equipos con la misma IP. El síntoma es un ping que funciona a veces.
- **Sin `default-router`:** las PCs reciben IP y máscara pero no gateway: se ven entre ellas y no salen
  de la red. Es el mismo síntoma del Lab 2 cuando faltaba el gateway a mano.
- **Sin `network`:** el pool existe pero está vacío; ninguna PC recibe nada.

### Resumen

- DHCP es el repartidor automático de direcciones: la PC pide, el servidor contesta.
- `ip dhcp excluded-address` reserva las IPs que nunca se reparten (router, switch, servidores).
- El pool define red, gateway, DNS y duración del arriendo.

---

## 7. Laboratorio 5: dos routers — rutas estáticas y el ping que no vuelve

**Objetivo:** conectar dos redes con dos routers y enseñarles a llegar el uno al otro.

**Qué vas a probar.** El experimento más importante del manual: un ping que sale, llega a destino, y
la respuesta se pierde en el camino de vuelta. Vas a ver con tus ojos que el enrutamiento necesita dos
rutas, la de ida y la de vuelta, y que tener una sola no alcanza.

### Paso 1 — Armar la red

```
[LAN1 192.168.1.0] -- R1 -- 10.0.0.0/30 -- R2 -- [LAN2 192.168.2.0]
```

Ese dibujo, en palabras: a la izquierda está la red de la PC0 (`192.168.1.0`), conectada al router R1.
En el medio, un cable que une R1 con R2, y ese cable es su propia red chiquita (`10.0.0.0`). A la
derecha, la red de la PC1 (`192.168.2.0`), conectada al router R2. O sea: dos redes de usuarios y una
red de tránsito entre los dos routers.

- **R1** (1941): Gi0/0 → PC0 (`192.168.1.1`), Gi0/1 → R2 (`10.0.0.1`).
- **R2** (1941): Gi0/0 → PC1 (`192.168.2.1`), Gi0/1 → R1 (`10.0.0.2`).
- Cable entre routers: **Crossover** (o uso el cable automático de PT).
- Las conexiones reales de R1-Gi0/0 y R2-Gi0/0 pueden ir con switches, pero para el lab alcanza
  directo a las PCs.

Fijate en la lógica: cada router tiene una pata en su red de usuarios y otra en la red de tránsito,
que comparten los dos. Por eso se ven entre sí sin ninguna configuración extra.

> **Una corrección al dibujo, avisada como corresponde:** el diagrama dice `10.0.0.0/30`, pero los
> bloques de configuración de abajo usan `255.255.255.0`, que es un `/24`. Las dos cosas no pueden ser
> ciertas a la vez. En este manual usamos la configuración tal como está escrita (`/24`), y el lab
> funciona igual; si en tu examen te piden `/30`, la lógica es idéntica y solo cambia la máscara.

**Qué significa `/30` y `/24`.** El número después de la barra cuenta cuántos bits identifican a la red:
`/24` es `255.255.255.0` (254 equipos útiles) y `/30` es `255.255.255.252` (solo 2 equipos útiles). Para
un cable entre dos routers, `/30` no desperdicia direcciones; para el lab, `/24` se lee más fácil.

### Paso 2 — Configurar los dos routers

R1:

```
R1(config)#  interface gigabitEthernet 0/0
R1(config-if)#  ip address 192.168.1.1 255.255.255.0
R1(config-if)#  no shutdown
R1(config-if)#  exit
R1(config)#  interface gigabitEthernet 0/1
R1(config-if)#  ip address 10.0.0.1 255.255.255.0
R1(config-if)#  no shutdown
R1(config-if)#  end
```

R2 (el espejo):

```
R2(config)#  interface gigabitEthernet 0/0
R2(config-if)#  ip address 192.168.2.1 255.255.255.0
R2(config-if)#  no shutdown
R2(config-if)#  exit
R2(config)#  interface gigabitEthernet 0/1
R2(config-if)#  ip address 10.0.0.2 255.255.255.0
R2(config-if)#  no shutdown
R2(config-if)#  end
```

Los dos bloques son el mismo patrón repetido cuatro veces: entrar a la interfaz, ponerle IP, activarla,
salir. El `exit` del medio te devuelve a `(config)#` para entrar a la otra interfaz; el `end` final te
deja en `#`. Y son espejos: en el cable del medio R1 es `.1` y R2 es `.2`, y los dos están en la misma
red `10.0.0.0`, así que se ven sin rutas.

**Qué tenés que ver.** En cada router, dos avisos de interfaz que pasa a `up`. Y si después corrés
`show ip interface brief`, las dos interfaces en `up`/`up` con sus IPs.

Y las PCs: PC0 con IP `192.168.1.10`, máscara `255.255.255.0` y gateway `192.168.1.1`; PC1 con IP
`192.168.2.10`, máscara `255.255.255.0` y gateway `192.168.2.1`. Ojo con el gateway de PC1: es `.1` de
**su** red, no de la red de la PC0.

### Paso 3 — El experimento que enseña más que mil diapositivas

Desde PC0:

```
PC0> ping 192.168.1.1      ← su gateway: ✓
PC0> ping 10.0.0.1         ← el otro lado de R1: ✓ (conectado directo)
PC0> ping 10.0.0.2         ← R2: ✓ (¿por qué? porque es una red directa de R1... esperá, NO es directa de R1. Lo es de R2. R1 la ve porque 10.0.0.0/24 es SU red directa también — ambos routers están en el mismo segmento 10.0.0.0/24)
PC0> ping 192.168.2.1      ← ¡FALLA! ¿Y por qué si todo lo anterior funcionó? ESTE es el momento de entender.
```

Los primeros tres pings funcionan y el cuarto no. La diferencia entre el tercero y el cuarto es todo el
capítulo.

**Ping 1, al gateway.** Sale de la PC0, llega a R1 y R1 contesta: están en la misma red.

**Ping 2, a `10.0.0.1`.** La PC0 no sabe dónde está esa dirección y se la entrega a su gateway. R1 sí
sabe: `10.0.0.0` es una red **directamente conectada** a su Gi0/1, y `10.0.0.1` es él mismo.

**Ping 3, a `10.0.0.2`.** Mismo camino, y funciona **sin ninguna ruta configurada**: `10.0.0.2` es la
punta del cable del otro lado, o sea R2, y `10.0.0.0/24` es red directa de **los dos** routers porque
los dos tienen una interfaz en ese cable. El comentario del bloque original se enreda con esto; lo que
importa es eso.

**Ping 4, a `192.168.2.1`.** Acá se rompe. Y no es que el paquete no llegue: llega. Lo que no vuelve es
la respuesta.

> **El título del lab se explica solo:** el ping va... y no vuelve. PC0 llega a R1, R1 lo manda a R2 (la
> red 10.0.0.0 es directa), R2 lo entrega a PC1. PC1 responde a `192.168.1.10` — y ahí R2 se queda
> mirando: "¿192.168.1.0? No es una red directa para mí. No tengo idea de dónde está." **El paquete de
> respuesta se cae en R2.** Por eso: el ping "va pero no regresa" = problema de ruta de VUELTA.

Detalle fino: la dirección del ping es `192.168.2.1` (el gateway de la PC1), no la PC1 misma. Da igual:
la respuesta tiene que salir hacia `192.168.1.10` y R2 no tiene por dónde.

**Qué tenés que ver.** Los tres primeros pings con cuatro respuestas, y el cuarto con el mensaje de
destino no alcanzable o con cuatro timeouts. En el modo Simulación vas a ver el paquete de ida llegar a
destino y el de vuelta morir en R2 con una X roja.

### Paso 4 — La solución: rutas estáticas

Cada router necesita saber cómo llegar a la red del otro:

```
R1(config)#  ip route 192.168.2.0 255.255.255.0 10.0.0.2
R2(config)#  ip route 192.168.1.0 255.255.255.0 10.0.0.1
```

Sintaxis: `ip route [red destino] [máscara] [siguiente salto]`. "Para llegar a 192.168.2.0, dale el
paquete a 10.0.0.2."

**Qué hace el comando.** Le agrega a mano una entrada a la **tabla de rutas** del router. Una **ruta
estática** es un camino que alguien escribió, en vez de uno que el router aprendió solo.

**Cómo se lee cada parte.** La **red destino** y la **máscara** dicen "esto es lo que quiero alcanzar".
El **siguiente salto** (*next hop*) dice "y para eso, entregáselo a este equipo". R1 dice: "para
`192.168.2.0`, dale el paquete a `10.0.0.2`", que es R2. R2 dice lo simétrico: "para `192.168.1.0`,
dale el paquete a `10.0.0.1`", que es R1.

**Por qué hacen falta las dos.** Si configurás solo la de R1, el pedido llega a PC1 pero la respuesta
sigue muriendo en R2. Es el error más común de este lab, y por eso las dos líneas van juntas: son una
sola decisión.

**Qué tenés que ver.** Después de escribir cada `ip route`, el prompt vuelve y no dice nada. Silencio =
la ruta entró.

Verificá de nuevo:

```
PC0> ping 192.168.2.1
```

Ahora SÍ. Y mirá la tabla de rutas:

```
R1#  show ip route
```

Salida esperada (las letras que importan):

```
C    192.168.1.0/24 is directly connected, GigabitEthernet0/0
C    10.0.0.0/24    is directly connected, GigabitEthernet0/1
S    192.168.2.0/24 [1/0] via 10.0.0.2
```

**Qué hace el comando.** `show ip route` muestra la tabla de rutas: la lista de redes que este router
sabe alcanzar y por dónde. Es el mapa mental del router, impreso.

**Qué significa cada parte de la salida.** Una letra que dice el origen de la ruta, la red destino con
su máscara, y la forma de llegar. `is directly connected` + la interfaz significa que esa red está
pegada al equipo. `[1/0] via 10.0.0.2` trae en el corchete la **distancia administrativa** (cuán
confiable es la fuente) y la **métrica** (el costo), y `via` dice el siguiente salto.

**Qué tenés que ver.** Las dos `C` de las redes que toca el router, y la `S` de la red que le
enseñaste. Si falta la `S`, la ruta no entró: revisá la máscara y el siguiente salto.

| Letra | Significado |
|-------|-------------|
| **C** | Connected — la red está pegada a la interfaz |
| **S** | Static — la aprendimos del comando `ip route` |
| R / O / D | RIP / OSPF / EIGRP — protocolos de enrutamiento dinámico (viajan solos) |

**Cómo se lee esta tabla.** La letra es el **origen** de la información: `C` viene de las interfaces
(si la interfaz tiene IP y está `up`, la red aparece sola) y `S` de un `ip route` que escribiste vos.

La tercera fila junta tres protocolos de enrutamiento **dinámico**, que hacen que los routers se cuenten
las rutas entre ellos sin que vos escribas nada: **RIP** (*Routing Information Protocol*), **OSPF**
(*Open Shortest Path First*, el más usado en empresa) y **EIGRP** (*Enhanced Interior Gateway Routing
Protocol*, de Cisco). "Viajan solos": si un enlace se cae, la ruta desaparece y buscan otro camino,
mientras que una `S` queda escrita aunque el camino ya no exista. Acá no los configuramos.

### Paso 5 (modo Simulación): ver el paquete viajar

Este es el momento de pegarle al botón **Simulation** de Packet Tracer, lanzar un ping de PC0 a PC1 y
hacer click en **Capture/Forward**:

1. El paquete sale de PC0 → **switch/R1** → cambia de capa → **R1** lo reenvía con nueva MAC al cable
   10.0.0.0 → **R2** → **PC1**.
2. La respuesta hace el camino inverso — ahora SÍ, porque R2 ya tiene la ruta estática.

Lo que estás viendo es el viaje completo: la PC empaca (capa 2 con MAC), el router reescribe (capa 3 con
IP que no cambia, MAC que sí), y el destino responde. Este lab ES la foto que vale por mil palabras.

**Cómo se usa el modo Simulación.** Al entrar, el tiempo se detiene: el panel de la derecha lista los
eventos y **Capture/Forward** avanza uno por vez. Cada paquete se dibuja como un sobre de color según
su tipo, y si hacés click en él ves las direcciones de cada capa.

**Qué tenés que ver.** El paquete de ida avanzando hasta PC1 y el de vuelta haciendo el camino inverso.
Hacé las dos corridas, primero sin rutas y después con rutas: la diferencia entre las dos es la lección
completa del capítulo.

### Ruta por defecto (default route)

Cuando un router no tiene ninguna ruta que coincida con el destino, tira el paquete a la basura. La ruta
por defecto es el "y si nada coincide, mandalo acá":

```
R1(config)#  ip route 0.0.0.0 0.0.0.0 10.0.0.2
```

`0.0.0.0 0.0.0.0` significa "cualquier red, cualquier máscara". Es la que configuran los routers de
borde hacia el ISP: todo lo que no conozco, al proveedor.

**Por qué se escribe con ceros.** Una ruta se elige comparando la red destino con la dirección del
paquete, y `0.0.0.0` con máscara `0.0.0.0` no exige que coincida ningún bit: coincide con todo. Por eso
es la última opción de la tabla.

**ISP** son las siglas de *Internet Service Provider*, proveedor de servicios de Internet: el router de
tu casa tiene una ruta por defecto que apunta a él, y por eso todo lo que no es de tu red sale afuera.

**Qué tenés que ver.** Una línea con la letra `S` y el destino `0.0.0.0/0`. Si ya tenías una ruta más
específica para una red, esa sigue ganando: la ruta por defecto es la última de la fila, nunca la
primera.

### Si te saltás un paso

- **Sin rutas estáticas:** el ping a la otra red falla con el síntoma del paso 3: sale y no vuelve.
- **Con la ruta en un solo router:** el mismo síntoma, aunque hayas "hecho algo". Es la trampa del lab.
- **Con el siguiente salto equivocado** (por ejemplo `10.0.0.1` en R1, que es él mismo): la ruta existe
  pero no lleva a ningún lado, y el ping sigue fallando. `show ip route` la muestra igual, así que no
  te confíes: mirá que el `via` sea la IP del **otro** router.

### Resumen

- Dos redes se unen con dos routers y un cable que es, él mismo, una tercera red.
- Un ping puede ir y no volver: eso significa que falta la ruta de **regreso**.
- `ip route RED MÁSCARA SALTO` es una ruta estática: "para llegar a esta red, dale el paquete a este
  equipo".

---

## 8. Laboratorio 6: VLANs y router on a stick

**Objetivo:** dividir el switch en redes lógicas separadas y habilitar la comunicación entre ellas con
UN solo cable al router.

**Qué vas a probar.** Que un switch de un solo aparato puede comportarse como dos switches
independientes, que los equipos de una VLAN no ven a los de la otra aunque estén enchufados al mismo
aparato, y que un router puede conectar esas dos redes usando una sola interfaz física.

**Qué es una VLAN, con analogía.** Imaginá un edificio de oficinas con un solo pasillo largo y todas
las puertas abiertas: cualquiera escucha lo que se habla en cualquier oficina. Ahora poné puertas
cerradas con llave y un cartel que dice qué piso pertenece a qué área: el pasillo es el mismo, el
cableado es el mismo, pero Ventas y RRHH ya no se escuchan entre sí. Eso es una **VLAN**: una red
lógica separada dentro del mismo switch. Técnicamente, cada VLAN es un **dominio de broadcast**
distinto: un mensaje a todos se queda adentro de su VLAN.

### Paso 1 — Armar la red

- **1 switch 2960**, **1 router 1941**, **4 PCs**.
- PC0 y PC1 → switch Fa0/1 y Fa0/2 (VLAN 10).
- PC2 y PC3 → switch Fa0/3 y Fa0/4 (VLAN 20).
- Switch Gi0/1 → router Gi0/0.

En palabras: cuatro PCs enchufadas al mismo switch, dos que van a vivir en la VLAN 10 (Ventas) y dos en
la VLAN 20 (RRHH), y un único cable que sale del switch al router por el puerto GigabitEthernet. Ese
cable es el que va a llevar el tráfico de **las dos** VLANs a la vez, y por eso tiene un nombre propio:
**trunk**.

### Paso 2 — Crear las VLANs y asignar puertos

```
Switch(config)#  vlan 10
Switch(config-vlan)#  name VENTAS
Switch(config-vlan)#  exit

Switch(config)#  vlan 20
Switch(config-vlan)#  name RRHH
Switch(config-vlan)#  exit

! Dos puertos para VLAN 10, uno por uno
Switch(config)#  interface fastEthernet 0/1
Switch(config-if)#  switchport mode access
Switch(config-if)#  switchport access vlan 10
Switch(config-if)#  exit

Switch(config)#  interface fastEthernet 0/2
Switch(config-if)#  switchport mode access
Switch(config-if)#  switchport access vlan 10
Switch(config-if)#  exit

! O un RANGO de una sola vez (mismo resultado, menos tipeo)
Switch(config)#  interface range fastEthernet 0/3 - 4
Switch(config-if-range)#  switchport mode access
Switch(config-if-range)#  switchport access vlan 20
Switch(config-if-range)#  exit
```

**`vlan 10`** crea la VLAN y te mete adentro (el prompt pasa a `(config-vlan)#`); si ya existía, no la
duplica, solo te deja editarla. **`name VENTAS`** le pone un nombre legible: el número es lo que usa el
switch, el nombre es para los humanos.

**`interface fastEthernet 0/1`** entra al puerto físico, y ahí adentro van siempre dos comandos juntos:
**`switchport mode access`** declara el puerto como **access**, un puerto de una sola VLAN (el que va a
una PC o una impresora), y **`switchport access vlan 10`** dice **cuál** es esa VLAN.

**`interface range fastEthernet 0/3 - 4`** es el atajo: entra a los puertos 3 y 4 a la vez (prompt
`(config-if-range)#`) y todo lo que escribas se aplica a los dos. La sintaxis es "desde el 3 hasta el
4", con guion.

**Qué tenés que ver.** Después de cada `switchport access vlan`, silencio y prompt de vuelta. En
`show vlan brief` (lo ves en el paso 5) tienen que aparecer las dos VLANs con sus puertos.

### Paso 3 — El trunk hacia el router

El enlace switch-router debe llevar tráfico de las DOS VLANs al mismo tiempo. Eso es un **trunk**:

```
Switch(config)#  interface gigabitEthernet 0/1
Switch(config-if)#  switchport mode trunk
Switch(config-if)#  switchport trunk allowed vlan 10,20
Switch(config-if)#  end
```

**`switchport mode trunk`** convierte el puerto en un enlace multi-VLAN. La diferencia con `access` es
conceptual: access entrega las tramas "peladas", sin decir a qué VLAN pertenecen; trunk las entrega
**etiquetadas**, con una marca que dice "esto es de la VLAN 10". La etiqueta se llama **802.1Q** y es
un estándar: son cuatro bytes que se agregan a la trama.

**`switchport trunk allowed vlan 10,20`** es la lista blanca: por este trunk solo pasan esas dos VLANs.
Sin la línea deja pasar todas, lo cual funciona pero es un riesgo: si mañana creás una VLAN 30 para
invitados, se filtra sola por el enlace al router.

**Qué tenés que ver.** En `show interfaces trunk` (paso 5) el puerto Gi0/1 aparece como trunk con las
VLANs 10 y 20 permitidas.

### Paso 4 — Router on a stick (ROAS)

El router tiene UNA interfaz física (Gi0/0) pero creamos **subinterfaces** — una por VLAN, cada una como
si fuera una interfaz aparte:

```
R1(config)#  interface gigabitEthernet 0/0
R1(config-if)#  no shutdown          ! La física se activa SIN IP (la tienen las subinterfaces)
R1(config-if)#  exit

R1(config)#  interface gigabitEthernet 0/0.10
R1(config-subif)#  encapsulation dot1Q 10          ! Etiqueta: esta subinterfaz = VLAN 10
R1(config-subif)#  ip address 192.168.10.1 255.255.255.0
R1(config-subif)#  exit

R1(config)#  interface gigabitEthernet 0/0.20
R1(config-subif)#  encapsulation dot1Q 20
R1(config-subif)#  ip address 192.168.20.1 255.255.255.0
R1(config-subif)#  end
```

**`interface gigabitEthernet 0/0`** + **`no shutdown`**: la interfaz física se activa pero **sin IP**.
Es raro al principio: acá la física es solo el caño y las direcciones viven en las subinterfaces.

**`interface gigabitEthernet 0/0.10`** crea la **subinterfaz** `.10` colgada de la física: una interfaz
lógica inventada por software (prompt `(config-subif)#`). **`encapsulation dot1Q 10`** es el comando que
la une con la VLAN: "todo lo que llegue etiquetado como VLAN 10, atendelo vos". **`dot1Q`** es el nombre
del estándar de etiquetado (802.1Q). Sin esa línea, la subinterfaz no sabe qué tráfico le corresponde.
**`ip address 192.168.10.1 255.255.255.0`** le da la IP de gateway de esa VLAN.

La técnica se llama **router on a stick** ("router en un palito"): un solo cable, un solo router, muchas
redes. El router recibe la trama etiquetada, lee la etiqueta, la entrega a la subinterfaz correcta,
decide a dónde va y la vuelve a etiquetar para la VLAN de destino.

**Qué tenés que ver.** La subinterfaz `.10` y `.20` en `up`/`up` en `show ip interface brief`, y la
física `0/0` también `up` aunque sin IP.

### Paso 5 — IPs de las PCs y verificación

| PC | IP | Gateway |
|----|-----|---------|
| PC0 | 192.168.10.10 | 192.168.10.1 |
| PC1 | 192.168.10.11 | 192.168.10.1 |
| PC2 | 192.168.20.10 | 192.168.20.1 |
| PC3 | 192.168.20.11 | 192.168.20.1 |

**Cómo se lee.** Cada PC lleva, en el gateway, la IP de la subinterfaz de **su** VLAN: las de Ventas
apuntan a `.10.1` y las de RRHH a `.20.1`. El gateway no es "el router" en abstracto: es la dirección
del router **dentro de la red de esa PC**.

Probá:

```
PC0> ping 192.168.10.11     ← misma VLAN: ✓ (pasa por el switch, sin router)
PC0> ping 192.168.20.10     ← otra VLAN: ✓ (pasa por el router: PC0 → switch trunk → subinterfaz .10 → subinterfaz .20 → switch → PC2)
```

**Qué prueba cada ping.** El primero no toca el router: las dos PCs están en la misma VLAN y el switch
las conecta por dentro. El segundo sí: la PC0 entrega el paquete a su gateway (`.10.1`), el switch lo
manda etiquetado por el trunk, el router lo recibe en la subinterfaz `.10`, ve que el destino es de la
red `.20`, lo pasa a la subinterfaz `.20`, lo etiqueta como VLAN 20 y lo devuelve por el mismo cable.

> **La trampa conceptual:** si el gateway de cada PC no es la IP de SU subinterfaz, el ping entre VLANs
> falla. El router recibe el paquete etiquetado con VLAN 10 y responde por la subinterfaz que
> corresponde a esa etiqueta. Cada VLAN es un dominio de broadcast distinto: sin router (o switch
> multicapa), son mundos separados.

Verificaciones de switch que cierran el lab:

```
Switch#  show vlan brief              ! Qué puertos van en cada VLAN
Switch#  show interfaces trunk        ! El trunk activo y las VLANs permitidas
Switch#  show interfaces Fa0/1 switchport    ! El detalle de un puerto
```

**`show vlan brief`** lista las VLANs y, al lado de cada una, sus puertos: confirma el paso 2.

**`show interfaces trunk`** muestra los puertos en trunk con el **VLAN nativo** (el que viaja sin etiqueta) y las
VLANs permitidas: confirma el paso 3.

**`show interfaces Fa0/1 switchport`** muestra el detalle de un
puerto puntual (modo administrativo, modo operativo, VLAN asignada): es el comando fino, para cuando un
puerto "debería" estar en una VLAN y no lo está.

**Qué tenés que ver.** En el primero, `10 VENTAS` con `Fa0/1, Fa0/2` y `20 RRHH` con `Fa0/3, Fa0/4`. En
el segundo, `Gi0/1` como trunk con `10,20` permitidas. En el tercero, `Administrative Mode: static
access` y `Access Mode VLAN: 10`.

Tabla resumen de la topología típica:

| VLAN | Nombre | Red | Gateway | Puertos switch |
|------|--------|-----|---------|----------------|
| 10 | VENTAS | 192.168.10.0/24 | 192.168.10.1 | Fa0/1 – Fa0/2 |
| 20 | RRHH | 192.168.20.0/24 | 192.168.20.1 | Fa0/3 – Fa0/4 |
| 1 | Nativa (default) | — | — | Gi0/1 (Trunk) |

**Cómo se lee.** Es el mapa del lab en cuatro líneas: número de VLAN, nombre, red IP, puerta de salida y
puertos. La última fila es la VLAN 1, la de fábrica: no tiene red ni gateway propios porque no le
asignamos IP, y aparece asociada a Gi0/1 porque es la **VLAN nativa** del trunk, la que viaja sin
etiqueta.

### Si te saltás un paso

- **Sin `switchport mode access` + `switchport access vlan`:** los cuatro puertos quedan en la VLAN 1 y
  las cuatro PCs se ven entre todas. El lab "funciona" y no prueba nada.
- **Sin trunk:** el router recibe tramas sin etiqueta y no sabe a qué subinterfaz entregarlas. El ping
  entre VLANs falla aunque las subinterfaces estén perfectas.
- **Sin `encapsulation dot1Q`:** la subinterfaz existe, tiene IP, y no procesa nada. El síntoma es un
  ping que no sale del router.

### Resumen

- Una VLAN es una red lógica dentro del mismo switch: mismo cableado, dominios de broadcast separados.
- Puerto **access** = una VLAN; puerto **trunk** = muchas VLANs etiquetadas con 802.1Q.
- Router on a stick: una interfaz física, una subinterfaz por VLAN con `encapsulation dot1Q`.

---

## 9. Laboratorio 7: el lab completo

**Objetivo:** unir TODOS los conceptos en una sola red de oficina: router + DHCP + switch con VLANs +
rutas + PCs.

**Qué vas a probar.** Que las piezas de los seis labs anteriores encajan. Este lab no introduce ningún
comando nuevo: es el mismo repertorio, en orden, hasta que la red funciona sola de punta a punta, con
las PCs tomando dirección automáticamente y cruzando de un departamento al otro y hasta la salida.

### Paso 1 — Topología completa

```
                     [R2] 192.168.30.1/24
                      |      (servidor y salida)
            10.0.0.0/24 enlace
                      |
[R1] 192.168.1.1 ──────┘
  | Gi0/0 router on a stick hacia S1
  |
[S1] 2960
  ├── VLAN 10 VENTAS: Fa0/1-5  → PC0, PC1 (192.168.10.x, gateway .10.1)
  ├── VLAN 20 RRHH:    Fa0/6-10 → PC2, PC3 (192.168.20.x, gateway .20.1)
  └── Gi0/1 trunk hacia R1
```

**El dibujo, en palabras.** Abajo, el switch S1 con dos VLANs: la 10 (Ventas, puertos 1 a 5) y la 20
(RRHH, puertos 6 a 10). Del switch sale un trunk por Gi0/1 hacia R1, que hace router on a stick por su
Gi0/0, con las dos subinterfaces. R1 se conecta con R2 por un enlace `10.0.0.0/24`, y R2 tiene del otro
lado la red `192.168.30.0/24`, donde vive el servidor y por donde se sale.

**Dos aclaraciones honestas sobre el dibujo.** El `192.168.1.1` al lado de R1 no es una tercera red: en
este lab las redes de R1 son las dos VLANs. Y la IP de R1 en el enlace hacia R2 no está dibujada, pero
el bloque de rutas la delata: como el salto del lado de R2 es `10.0.0.2`, R1 usa `10.0.0.1` ahí, igual
que en el Lab 5.

### Paso 2 — La receta completa (en orden)

1. **Switch:** crear VLAN 10 y 20, asignar access ports, trunk hacia R1.
2. **Router R1:** subinterfaces `.10` y `.20` con `encapsulation dot1Q`, IPs `192.168.10.1` y
   `192.168.20.1`.
3. **Router R1:** pool DHCP por VLAN:

```
R1(config)#  ip dhcp excluded-address 192.168.10.1 192.168.10.20
R1(config)#  ip dhcp pool VENTAS
R1(dhcp-config)#  network 192.168.10.0 255.255.255.0
R1(dhcp-config)#  default-router 192.168.10.1
R1(dhcp-config)#  dns-server 8.8.8.8
R1(dhcp-config)#  exit

R1(config)#  ip dhcp excluded-address 192.168.20.1 192.168.20.20
R1(config)#  ip dhcp pool RRHH
R1(dhcp-config)#  network 192.168.20.0 255.255.255.0
R1(dhcp-config)#  default-router 192.168.20.1
R1(dhcp-config)#  dns-server 8.8.8.8
R1(dhcp-config)#  end
```

Los dos pools son la misma receta repetida con otros números: excluir las direcciones de
infraestructura (`.1` a `.20` de cada red), crear el pool, declarar la red, decir cuál es el gateway y
cuál el DNS. El `default-router` de cada pool es la IP de la subinterfaz de esa misma VLAN: si te
equivocás ahí, las PCs de esa VLAN reciben dirección pero no salen a ningún lado.

**Ojo con un detalle:** las dos exclusiones son sobre redes distintas, y el router solo reparte cada red
por la subinterfaz correspondiente. Una PC de Ventas nunca va a recibir una dirección de RRHH porque el
pedido entra por la subinterfaz `.10` y el pool que contesta es el de la red `192.168.10.0`.

4. **PCs en DHCP** (Desktop → IP Configuration → DHCP): deben recibir IPs de sus VLANs correspondientes.

5. **Rutas:** los routers se conectan por el enlace 10.0.0.0/24 — si hay más redes, cada lado necesita la
   ruta del otro:

```
R1(config)#  ip route 192.168.30.0 255.255.255.0 10.0.0.2
R2(config)#  ip route 192.168.10.0 255.255.255.0 10.0.0.1
R2(config)#  ip route 192.168.20.0 255.255.255.0 10.0.0.1
```

**Por qué tres líneas y no dos.** R1 solo necesita llegar a la red de R2 (`192.168.30.0`), porque las
dos VLANs están pegadas a sus subinterfaces. R2 no sabe nada de las VLANs y necesita una ruta por cada
una: cada router necesita su propia ruta, y las rutas no se contagian solas.

6. **Guardar TODO**: `copy running-config startup-config` en router y switch.

En los dos aparatos, y en ese orden: primero verificás que todo anda, después guardás. Guardar una
configuración que no probaste es guardar un problema para mañana.

### Paso 3 — Verificación final

```
PC0> ipconfig /all          ← ¿IP correcta? ¿Gateway? ¿DNS?
PC0> ping 192.168.10.1      ← gateway VLAN 10
PC0> ping 192.168.20.1      ← gateway VLAN 20 (cruza el router)
PC0> ping 192.168.30.1      ← R2 (salida)
R1#  show ip dhcp binding   ← ¿quién recibió qué?
R1#  show ip route          ← todas las rutas en la tabla
S1#  show vlan brief        ← puertos en sus VLANs
```

**`ipconfig /all`** muestra la configuración completa de la PC: IP, máscara, gateway, DNS y la MAC. Es
el comando que te dice si DHCP le entregó todo o solo una parte.

**Los tres pings suben de nivel.** El primero no sale del router (es su propia subinterfaz); el segundo
cruza de una VLAN a otra por dentro del router; el tercero cruza a otro router, o sea que usa la ruta
estática. Si el primero anda y el segundo no, el problema es de VLAN o de gateway; si el segundo anda y
el tercero no, es de rutas. Y los tres `show` cierran el lab: `show ip dhcp binding` confirma el reparto
automático, `show ip route` las rutas, y `show vlan brief` los puertos.

**Qué tenés que ver.** Cuatro respuestas en cada ping, arriendos para las cuatro PCs con IPs de su VLAN,
una `S` por cada red remota en la tabla de rutas de cada router, y los diez puertos repartidos entre las
dos VLANs.

Si todo responde: acabaste de construir una red de oficina pequeña y real — con DHCP automático,
segmentación por departamentos y salida hacia otra red. Ese es el vuelo. Las piezas sueltas de los labs
anteriores, todas encajadas.

### Si te saltás un paso

- **Sin el trunk:** las VLANs funcionan por dentro pero nada cruza al router, y DHCP no contesta porque
  los pedidos no llegan a las subinterfaces.
- **Sin las subinterfaces:** las PCs de las dos VLANs se quedan sin gateway y sin DHCP.
- **Con un solo pool:** una de las dos VLANs no recibe dirección, y sus PCs se quedan en `0.0.0.0`.

### Resumen

- El lab completo no trae comandos nuevos: es el orden correcto de todo lo anterior.
- Primero la capa 2 (VLANs y trunk), después la capa 3 (subinterfaces y rutas), después el reparto (DHCP).
- Cada pool DHCP apunta al gateway de su propia VLAN.

---

## 10. Referencia rápida

Estas tres tablas son para consultar mientras trabajás, no para leer de corrido. Están separadas por
aparato porque cada uno tiene su propio repertorio: lo que existe en el router no siempre existe en el
switch, y viceversa. La columna de la izquierda es lo que escribís; la de la derecha, qué problema
resuelve. Y en todas vale la misma regla: el modo en el que se escribe cada comando es el que indica el
prompt, y los `show` son de `#`.

### Router — todos los comandos

| Comando | Qué hace |
|---------|----------|
| `enable` / `configure terminal` | Entra a modo privilegiado / configuración global |
| `hostname NOMBRE` | Cambia el nombre del equipo |
| `enable secret PASS` | Contraseña cifrada para el modo privilegiado |
| `line console 0` / `line vty 0 4` | Acceso físico / remoto |
| `interface Gi0/0` | Entra a configurar una interfaz |
| `ip address IP MASK` | Asigna IP a la interfaz |
| `no shutdown` | ACTIVA la interfaz (¡obligatorio!) |
| `description TEXTO` | Etiqueta de humanos para la interfaz |
| `ip route RED MASK SIGUIENTE` | Ruta estática |
| `ip route 0.0.0.0 0.0.0.0 SALTO` | Ruta por defecto |
| `ip dhcp pool NOMBRE` | Crea pool DHCP |
| `ip dhcp excluded-address X Y` | Excluye IPs del rango a repartir |
| `ip helper-address IP` | Reenvía broadcasts DHCP a otra red |
| `interface Gi0/0.10` | Subinterfaz (router on a stick) |
| `encapsulation dot1Q ID` | Asocia la subinterfaz a una VLAN |
| `show ip interface brief` | Interfaces + estado + IPs |
| `show ip route` | Tabla de enrutamiento |
| `show ip dhcp binding` | IPs asignadas con su MAC |
| `show running-config` / `startup-config` | Config activa (RAM) / guardada (NVRAM) |
| `copy running-config startup-config` | Guarda la configuración (¡siempre!) |

**Cómo se lee.** Las cinco primeras filas son de navegación y seguridad; las cinco siguientes, de capa
3 (IP, activación, descripción, rutas); las cuatro que siguen, de reparto automático de direcciones; las
dos de ROAS; y las últimas cuatro son `show` y guardado, que no cambian nada: solo muestran el estado.
Fijate en la fila de `no shutdown`: si un lab no funciona y no sabés por dónde empezar, buscá ahí.

### Switch — todos los comandos

| Comando | Qué hace |
|---------|----------|
| `interface vlan 1` | IP de administración del switch |
| `ip default-gateway IP` | Puerta de administración hacia otras redes |
| `vlan ID` + `name NOMBRE` | Crea y nombra una VLAN |
| `interface range Fa0/3 - 4` | Configura varios puertos juntos |
| `switchport mode access` | Puerto para PC/servidor (una sola VLAN) |
| `switchport access vlan ID` | Asigna el puerto a una VLAN |
| `switchport mode trunk` | Puerto multi-VLAN (hacia router/switch) |
| `switchport trunk allowed vlan X,Y` | VLANs permitidas en el trunk |
| `show vlan brief` | VLANs y sus puertos |
| `show interfaces trunk` | Trunks activos |
| `show mac address-table` | MACs aprendidas por puerto |
| `show interfaces status` | Estado de todos los puertos |

**Cómo se lee.** Las dos primeras filas son de administración (darle identidad en la red al switch);
las seis siguientes, de capa 2 (VLANs, puertos, trunks); y las cuatro últimas son `show`, las que vas a
usar el 90 % del tiempo. La diferencia clave está entre `mode access` y `mode trunk`: access es una sola
VLAN (una PC), trunk son muchas etiquetadas (un router u otro switch). Elegir mal ese modo es la causa
número uno de "las VLANs no se comunican".

### PC (Command Prompt de Packet Tracer)

| Comando | Qué hace |
|---------|----------|
| `ipconfig` / `ipconfig /all` | IPs del equipo / detalle completo (incluye MAC) |
| `ping IP` | Prueba de conectividad |
| `arp -a` | Tabla ARP (IP ↔ MAC) del equipo |

**Cómo se lee.** Se escriben en el Command Prompt de la PC, no en la consola del router. `ipconfig`
da lo mínimo y `/all` agrega DNS y MAC. `arp -a` muestra la **tabla ARP** (*Address Resolution
Protocol*): la lista de "qué MAC le corresponde a cada IP" que la PC aprendió en los últimos minutos, o
sea la respuesta a "¿a quién le estoy hablando realmente?".

### Resumen

- La tabla del router es navegación, seguridad, capa 3, DHCP, ROAS y verificación, en ese orden.
- La del switch es administración, capa 2 (VLANs y trunk) y `show` de diagnóstico.
- La de la PC son tres comandos que se escriben en el Command Prompt, no en el router.

---

## 11. Errores comunes y cómo diagnosticarlos

**Objetivo:** que un ping que falla no te deje mirando la pantalla. Cada síntoma de esta tabla tiene una
causa probable y una solución concreta, y todos son errores que ya cometiste (o vas a cometer) en los
labs anteriores.

| Problema | Causa más probable | Solución |
|----------|--------------------|----------|
| Interfaz `administratively down` | Falta `no shutdown` | Aplicar `no shutdown` en la interfaz |
| Interfaz `down/down` | Cable mal conectado o el otro lado apagado | Revisar cable y equipo físico en PT |
| LED ámbar o apagado | Cable equivocado (directo vs cruzado) | Usar crossover entre switches/PCs; directo a switch/router |
| PC sin IP en DHCP | Pool mal definido o VLAN no coincide | Verificar `network`, `excluded-address` y que el puerto esté en la VLAN correcta |
| Ping "va pero no vuelve" | Falta ruta estática del lado de la respuesta | `ip route` en AMBOS routers |
| PCs de la misma VLAN no se ven | Gateway incorrecto o puerto en VLAN equivocada | Verificar `switchport access vlan` y gateway |
| PCs de VLANs distintas no se ven | Falta router (o trunk sin subinterfaces) | Router on a stick con `encapsulation dot1Q` por VLAN |
| Trunk no lleva tráfico | Puerto en `access` o VLANs no permitidas | `switchport mode trunk` + `allowed vlan` |
| Todo configurado y al apagar se pierde | No se guardó | `copy running-config startup-config` |
| DHCP no cruza redes | Faltan *broadcasts* que el router no reenvía | `ip helper-address` en la interfaz del lado de las PCs |

**Cómo se lee.** Las tres columnas son síntoma, causa y remedio. Empezá por la izquierda: buscá lo que
ves, no lo que creés que hiciste mal. Las tres primeras filas son de capa 1 y 2 (cable, LED, interfaz
apagada); las cinco del medio son de configuración (VLAN, rutas, gateway); las dos últimas son de
olvido puro (guardar, helper). Ese orden —de lo físico a lo lógico— es también el orden en que conviene
diagnosticar.

> **El método de diagnóstico en 3 pasos que nunca falla:** (1) `show ip interface brief` en los routers —
> ¿están las interfaces up/up con las IPs correctas? (2) `ping` al gateway desde la PC — si no responde,
> es capa 1/2 (cable, VLAN); si responde, el problema está más lejos. (3) `show ip route` — ¿existe la
> ruta hacia el destino y la de vuelta? El 90% de los problemas de los labs se resuelven con esos tres
> comandos.

**Por qué funciona ese método.** Porque va de abajo hacia arriba: si la interfaz no está `up`, nada de
arriba importa; si el gateway no responde, el problema está en tu propia red y no tiene sentido mirar
rutas; y si el gateway responde pero el destino lejano no, entonces sí, es la tabla de rutas.

### Resumen

- Diagnosticá de lo físico a lo lógico: cable, LED, interfaz, VLAN, IP, ruta.
- `administratively down` es `no shutdown` olvidado; `down/down` es cable o equipo apagado.
- El ping que va y no vuelve es siempre falta de ruta de regreso.

---

## 12. Ejercicios guiados

Cinco ejercicios cortos para fijar lo que ya hiciste con las manos. Intentá responder antes de leer la
respuesta: el valor está en el intento, no en la lectura.

### Ejercicio 1: completá la config

Un router tiene esto configurado en Gi0/0:

```
R1(config-if)#  ip address 192.168.5.1 255.255.255.0
```

Falta UN comando para que la interfaz funcione. ¿Cuál es? ¿Por qué?

**Respuesta:** `no shutdown`. Las interfaces del router arrancan en *administratively down*: la IP está
asignada, pero la interfaz no transmite. Sin `no shutdown`, el estado queda `administratively down`, el
teléfono no suena y ningún ping responde. Es el comando olvidado #1 de la historia de Cisco.

### Ejercicio 2: el diagnóstico del ping que falla

PC0 (192.168.1.10) hace ping a PC1 (192.168.1.11), ambas conectadas a un switch, y falla. Audité: IPs y
máscaras correctas, cable directo, LEDs verdes. ¿Qué te falta revisar?

**Respuesta:** si IPs, máscaras y cables están bien y las dos PCs están en la misma VLAN (o el switch no
tiene VLANs, es decir, todo en VLAN 1 por defecto)... el ping entre dos equipos de la misma red ni
siquiera necesita el router. Lo siguiente a revisar es el **firewall de la PC** (en Packet Tracer no
aplica, pero en la vida real es la causa #1) o el **cable cruzado vs directo** (PC↔PC directo requiere
crossover en redes clásicas). Ah, y confirmá que ambas PCs estén en la misma red lógica (subred) — si una
está en 192.168.1.0/24 y la otra en 192.168.2.0/24 sin router entre medio, jamás se van a ver.

### Ejercicio 3: diseño de subredes con VLANs

Tenés un switch 2960 (24 puertos) y la siguiente necesidad: 6 PCs de Ventas, 8 PCs de RRHH, 2 impresoras
de uso compartido. Diseñá la segmentación con VLANs y decí cuál es el mínimo de puertos que necesita el
router para el enrutamiento inter-VLAN.

**Respuesta:**

- **VLAN 10 — VENTAS:** 6 PCs → Fa0/1–Fa0/6.
- **VLAN 20 — RRHH:** 8 PCs → Fa0/7–Fa0/14.
- **VLAN 30 — IMPRESORAS:** 2 impresoras → Fa0/15–Fa0/16.
- **Router:** alcanza con **1 puerto físico** (Gi0/1, trunk) usando router on a stick: una subinterfaz por
  VLAN (`.10`, `.20`, `.30`) con `encapsulation dot1Q`. Gateway por VLAN: 192.168.10.1 / 192.168.20.1 /
  192.168.30.1.
- Las PCs usan la impresora de su VLAN; si RRHH quiere imprimir, la impresora compartida podría estar en
  la VLAN 30 y RRHH la alcanza vía el router.

### Ejercicio 4: la secuencia completa

Poné en orden lógico esta configuración: (a) `no shutdown` en Gi0/0, (b) `ip address 192.168.1.1
255.255.255.0` en Gi0/0, (c) `hostname R1`, (d) `copy running-config startup-config`, (e) `enable
secret`.

**Respuesta:**

1. `enable` / `configure terminal`
2. **c)** `hostname R1`
3. **e)** `enable secret`
4. **b)** `interface Gi0/0` → `ip address 192.168.1.1 255.255.255.0`
5. **a)** mismo contexto: `no shutdown`
6. **d)** `end` → `copy running-config startup-config`

El orden conceptual: identidad del equipo → seguridad → IPs → activar interfaces → guardar. Cualquier
otro orden "funciona", pero este es el que no te deja nada colgado.

**Por qué el orden importa.** No es una regla del IOS, es una regla de trabajo: si guardás primero y
configurás después, guardaste un estado intermedio; si activás la interfaz antes de tener la IP, queda
`up` sin dirección.

### Ejercicio 5: modo simulación

En el Lab 5, con el ping que "va pero no vuelve" (sin rutas estáticas aún), ¿qué ves en el modo
simulación cuando PC0 pinguea a PC1? ¿Dónde se corta el paquete?

**Respuesta:** el paquete ICMP Echo Request viaja: PC0 → R1 → R2 → PC1 (todo en verde). La respuesta
(Echo Reply) sale de PC1 hacia R2... y ahí: **se cae en R2** con una X roja (o queda en "dropped
silently"). R2 no tiene ruta hacia 192.168.1.0 (su tabla solo conoce su LAN y el enlace). La respuesta
jamás sale de R2. Ese es el momento exacto en que aprendés que el enrutamiento necesita la ruta de IDA
**y** la de VUELTA.

**ICMP** son las siglas de *Internet Control Message Protocol*, el protocolo que usa el ping: el *Echo
Request* es el pedido y el *Echo Reply* la respuesta. En simulación se ven como dos sobres de colores
distintos, y esa distinción es la que te deja ver que el problema está en la vuelta.

### Resumen

- Los cinco ejercicios repasan los errores que más se cometen en los labs.
- `no shutdown` falta en el 90 % de las configuraciones que no andan.
- Un solo puerto de router alcanza para enrutar muchas VLANs, si es trunk.

---

## 13. Comprobá lo que aprendiste

Diez preguntas para cerrar. Respondé antes de leer la respuesta.

**1. ¿Cuál es la diferencia entre `running-config` y `startup-config`?**

**Respuesta:** `running-config` es la config activa en RAM (se pierde al apagar); `startup-config` es la
guardada en NVRAM (persiste). Se pasa de una a otra con `copy running-config startup-config`.

**2. ¿Por qué `no shutdown` es tan importante?**

**Respuesta:** las interfaces del router arrancan *administratively down*: aunque tengan IP asignada, no
transmiten. `no shutdown` activa la interfaz. Sin él, todo lo demás (IP, ruta, DHCP) está "configurado"
pero muerto.

**3. ¿Qué comando muestra el estado de todas las interfaces del router?**

**Respuesta:** `show ip interface brief` — y el estado que buscás es `up/up` (físico + protocolo).

**4. ¿Qué significa la letra `S` en `show ip route`, y qué hay entre las `C` y `S`?**

**Respuesta:** `S` = ruta estática (configurada a mano con `ip route`); `C` = red conectada directamente
(aprendida sola). Las `C` nunca se borran; las `S` las escribís vos.

**5. ¿Para qué sirve `ip helper-address`?**

**Respuesta:** para que los broadcasts de DHCP de una LAN crucen hasta un servidor DHCP que está en OTRA
red. Sin esa línea, los broadcasts no atraviesan el router y las PCs jamás reciben IP.

**6. ¿Qué es un puerto trunk y en qué se diferencia de un puerto access?**

**Respuesta:** access = una sola VLAN (PCs, impresoras, servidores). Trunk = lleva tráfico de MÚLTIPLES
VLANs etiquetadas (802.1Q), usado hacia routers y entre switches.

**7. ¿Cómo se llama la técnica de enrutar entre VLANs con una sola interfaz física del router, y qué
comando la define?**

**Respuesta:** **Router on a stick** (ROAS): subinterfaces `Gi0/0.10`, `Gi0/0.20`... con `encapsulation
dot1Q <ID>` y una IP por subinterfaz. El switch debe tener el enlace hacia el router en modo trunk.

**8. En el ping entre dos redes, ¿por qué el paquete puede ir pero no volver?**

**Respuesta:** porque el enrutamiento es asimétrico: cada router necesita su propia ruta. El destino puede
recibir el paquete, pero si su router no sabe cómo llegar a la red de origen, la respuesta se descarta.
Ruta estática en AMBOS lados (o en todos los que intervienen).

**9. ¿Cuál es la secuencia mínima de verificación ante un ping que falla?**

**Respuesta:** (1) `show ip interface brief` — ¿interfaces up/up con IPs? (2) ping al gateway — ¿problema
local? (3) `show ip route` — ¿existe la ruta (y la de vuelta)? Después, cableado y VLANs.

**10. ¿Por qué el switch necesita IP y gateway si no enruta?**

**Respuesta:** para ADMINISTRACIÓN remota (SSH/HTTP de gestión), no para el tráfico de datos. La IP en
`interface vlan 1` + `ip default-gateway` te dejan entrar al switch desde otra red; el tráfico de las PCs
lo atraviesa sin tocarla.

### Resumen

- Las diez preguntas cubren modos, guardado, interfaces, rutas, DHCP y VLANs.
- Las respuestas cortas son las que tenés que poder decir sin pensar.
- Si fallás la 4 o la 8, volvé al Lab 5; si fallás la 6 o la 7, al Lab 6; si fallás la 2 o la 3, al Lab 2.

---

## 14. Glosario

Todos los términos que aparecieron en el manual, en orden alfabético de aparición temática. Si una sigla
te quedó colgando, está acá.

| Término | Qué es |
|---------|--------|
| **Packet Tracer (PT)** | Simulador de redes de Cisco: routers, switches y PCs virtuales |
| **Modo Realtime** | La red "funciona en vivo" |
| **Modo Simulación** | Ves los paquetes viajar PDU por PDU |
| **CLI** | Interfaz de línea de comandos del dispositivo (donde se configura todo) |
| **Modo EXEC usuario (`>`)** | Acceso básico, casi solo para ver |
| **Modo EXEC privilegiado (`#`)** | Comandos de verificación, borrado y guardado |
| **Configuración global (`(config)#`)** | El modo donde se cambia la configuración |
| **Running-config** | Config activa en RAM (volátil) |
| **Startup-config** | Config guardada en NVRAM (persistente) |
| **`no shutdown`** | Comando que activa una interfaz |
| **Gateway por defecto** | La puerta de salida hacia otras redes |
| **Interface VLAN 1** | IP virtual de administración del switch |
| **`ip default-gateway`** | Gateway del switch para administración |
| **Pool DHCP** | Rango de IPs que el router reparte automáticamente |
| **`ip helper-address`** | Reenvía broadcasts DHCP a otra red |
| **Ruta estática** | `ip route red máscara salto` — camino aprendido a mano |
| **Ruta por defecto** | `0.0.0.0 0.0.0.0` — el "si nada coincide, mandalo acá" |
| **Tabla de rutas** | Lo que el router sabe sobre cómo llegar a redes |
| **VLAN** | Segmento lógico de capa 2 dentro de un switch |
| **Puerto access** | Puerto de una sola VLAN |
| **Puerto trunk** | Puerto multi-VLAN con etiquetas 802.1Q |
| **Router on a stick (ROAS)** | Subinterfaces por VLAN en una sola interfaz física |
| **`encapsulation dot1Q`** | La etiqueta que une subinterfaz ↔ VLAN |
| **PDU** | La unidad de datos que viaja capa por capa (lo que ves en simulación) |

### Resumen

- El glosario repite, en una línea cada uno, todos los términos que aparecieron.
- Los tres primeros son del simulador; los tres siguientes, de los modos de la consola.
- El resto se agrupa por tema: memorias, direcciones, rutas y capa 2.

---

## 15. Resumen en 10 puntos

1. **Packet Tracer es el simulador de vuelo** del técnico de redes: mismos comandos que un equipo real,
   cero riesgo de romper algo.
2. **Los modos son la base:** `>` para mirar, `#` para ver de verdad, `(config)#` para cambiar.
3. **`no shutdown` es el comando olvidado #1** de Cisco: sin él, la interfaz está muerta aunque tenga IP.
4. **Guardá siempre:** `copy running-config startup-config` — la RAM olvida, la NVRAM no.
5. **El estado que buscás es `up/up`** — fijate en `show ip interface brief`.
6. **El gateway es la puerta de salida:** sin él, la PC solo ve su propia red.
7. **El ping que va pero no vuelve = falta ruta de regreso** — verifica `show ip route` en los dos
   routers.
8. **El switch no enruta:** su IP es de administración; las VLANs necesitan router (ROAS) para
   comunicarse.
9. **El default route (`0.0.0.0`) es el "y si nada, mandalo al proveedor"** — la estrella de los routers
   de borde.
10. **El modo Simulación es tu mejor maestro:** cuando veas el paquete cortarse en un router con una X,
    no lo vas a olvidar más.

**Cómo leer esta lista.** Los puntos 1 a 4 son el entorno; los 5 a 7, la verificación; los 8 a 10, la
arquitectura: quién enruta, quién no, y cómo se ve todo eso en movimiento.

> **Orden recomendado de práctica:** Router (IPs + rutas) → Switch (VLANs + puertos) → Servidor/DHCP →
> PCs → Verificar con `ping` e `ipconfig`. Este manual te dio los 7 labs que llevan a ese orden: hacelos,
> desarmalos, rompelos a propósito y volvelos a armar.

### Resumen

- Diez puntos: cuatro de entorno, tres de verificación y tres de arquitectura.
- Si te llevás una sola idea: el prompt te dice en qué modo estás, y el modo decide qué podés hacer.
- Si te llevás dos: todo se verifica con `show ip interface brief`, un ping al gateway y `show ip
  route`.

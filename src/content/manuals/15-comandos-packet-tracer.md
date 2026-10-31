# 15. Cisco Packet Tracer: Laboratorios Guiados

**Router · Switch · DHCP · Rutas estáticas · VLANs**

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

---

## 1. El simulador de vuelo del técnico de redes

Cisco Packet Tracer (PT) es, literalmente, el simulador de vuelo del técnico de redes: un entorno donde armás redes con routers, switches, PCs y servidores **virtuales**, y practicás la configuración sin romper nada real.

Nadie aprende a volar en un avión de pasajeros. Se aprende en simulador, con errores gratis. Con Packet Tracer pasa lo mismo: cada comando que escribís acá es EXACTAMENTE el mismo que se escribe en un router de verdad, pero si te equivocás no cae ninguna red — cae un routercito virtual que podés borrar y empezar de nuevo.

> **La idea madre de este manual:** no es una lista de comandos para memorizar — es una secuencia de laboratorios para **hacer**. Cada lab arma UNA pieza: primero el router, después el switch, después DHCP, después rutas, después VLANs. Al final, el Lab 7 une todo en una red completa. Los comandos se aprenden usándolos, no repasándolos.

### 1.1. Lo básico de Packet Tracer

- **Panel de dispositivos** (abajo a la izquierda): routers, switches, PCs, servidores, cables. Arrastrás al lienzo y conectás.
- **Modo Realtime:** la red funciona "en vivo". Ping, navegar, ver tablas — todo real, pero virtual.
- **Modo Simulación:** podés ver cada paquete **viajando** paquete a paquete por los cables, PDU por PDU. Es oro puro para entender qué pasa adentro — lo usamos en el Lab 5.
- **CLI:** para configurar un dispositivo, click sobre él → pestaña **CLI**. Ahí escribís los comandos como en un equipo real.
- **PCs:** click → pestaña **Desktop** → **IP Configuration** para poner IPs, o **Command Prompt** para `ping` e `ipconfig`.

La progresión de este manual es deliberada. Si te salteás labs, los comandos posteriores no te van a cerrar. Hacelos en orden — y cuando termines el 7, habrás construido una red que podría ser la de una oficina chica de verdad.

---

## 2. Laboratorio 0: el primer plano

**Objetivo:** armar la topología más simple que existe y verificar que las PCs se ven entre sí.

### Paso 1 — Armar la red

1. Abrí Packet Tracer.
2. Del panel, elegí **End Devices** → arrastrá **2 × PC** al lienzo.
3. Elegí **Connections** (cable) → seleccioná el cable **Copper Straight-Through**.
4. Hacé click en PC0, elegí **FastEthernet0**, y conectá al FastEthernet0 de PC1.

> **Dato que aparece en todos los exámenes:** PC a switch/PC se conecta con **cable directo** (straight-through); switch a switch o PC a PC se conecta con **cable cruzado** (crossover). Los equipos modernos detectan solos, pero Packet Tracer replica la regla clásica: si usás el cable equivocado, el link no levanta.

### Paso 2 — Poner IPs

1. Click en **PC0** → **Desktop** → **IP Configuration**.
2. IP: `192.168.1.1` — Máscara: `255.255.255.0` (la máscara se completa sola si escribís la IP y tabulás).
3. Repetí en **PC1** con `192.168.1.2`.

Los LEDs de las interfaces deben estar en **verde** (link activo). Si están ámbar o apagados, revisá el cable.

### Paso 3 — Verificar

En el **Command Prompt** de PC0:

```
PC0> ping 192.168.1.2
```

Debés recibir las 4 respuestas `Reply from 192.168.1.2...`. Si falla, andá repasando: ¿cable bien conectado? ¿misma red? ¿mascaras iguales?

**Lo que acabás de aprender, sin darte cuenta:** el ping es el martillo universal del diagnóstico de redes. Lo vas a usar en TODOS los labs de acá en adelante como prueba final de cada etapa.

---

## 3. Laboratorio 1: el router — acceso y seguridad básica

**Objetivo:** entrar al router, ponerle nombre, protegerlo con contraseñas y guardar la configuración.

### Paso 1 — Armar la red

1. Del panel, elegí **Routers** → arrastrá un **1941**.
2. Click sobre el router → pestaña **CLI**. Apretá Enter si hace falta.

### Paso 2 — Los modos del IOS

Todo el laboratorio depende de entender los modos. Cada modo te deja hacer más cosas; la config se hace en el último:

```
Router> enable                     ← modo EXEC privilegiado (comandos de "ver")
Router# configure terminal         ← modo configuración global (comandos de "cambiar")
Router(config)#                    ← acá ya se configuran servicios
```

- `>` = modo EXEC de usuario (solo ver, casi nada).
- `#` después de `enable` = modo EXEC privilegiado (ver todo, borrar, guardar).
- `(config)#` = modo configuración global (cambiar el sistema).

**La regla de oro:** `?` es tu mejor amigo. Escribí cualquier comando a medias y `?` te muestra las opciones. El IOS se autocompleta con **TAB**.

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

> **Diferencia fina que preguntan siempre:** `enable password` guarda la contraseña en texto plano; `enable secret` la guarda cifrada (usá SIEMPRE secret). `service password-encryption` cifra las demás (consola, vty) — es criptografía débil, pero al menos no es texto plano. En el mundo real, además, usás SSH y no Telnet — en Packet Tracer el vty con password alcanza para practicar el concepto.

### Paso 4 — Guardar (esta parte NO se saltea nunca)

Todo lo que configuraste vive en la **RAM** (running-config). Si apagás, se pierde. Para que sobreviva:

```
R1#  copy running-config startup-config
```

Respuesta: `Destination filename [startup-config]?` → **Enter**.

> **El detalle de la RAM vs NVRAM:** `running-config` es la configuración ACTIVA (vive en RAM, se pierde al apagar). `startup-config` es la configuración GUARDADA (vive en NVRAM, persiste). La secuencia de tu vida profesional: configurar → verificar → guardar. Si no guardás, el router "olvida" todo al cortarse la luz.

### Paso 5 — Verificación

```
R1#  show running-config         ! La config activa completa
R1#  show startup-config         ! La config guardada
R1#  show version                ! Modelo, cantidad de RAM, uptime
```

---

## 4. Laboratorio 2: una red con router — IPs y verificación

**Objetivo:** conectar PCs al router, asignar IPs y activar el paso más olvidado: `no shutdown`.

### Paso 1 — Armar la red

- **1 router 1941** (R1, el del lab anterior), **1 switch 2960**, **2 PCs**.
- Conectá: PC0 → switch Fa0/1, PC1 → switch Fa0/2, switch Gi0/1 → router **GigabitEthernet 0/0**.

> **Por qué al router van los cables del switch por Gi0/1 y no por Fa0/1:** los switches 2960 tienen 24 puertos FastEthernet (10/100 Mbps) y 2 GigabitEthernet (arriba). Los enlaces "de columna" (switch → router, switch → switch) usan los gigabit. Es una convención, pero es la que se ve en todas las topologías reales.

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

**El comando que se olvida en el 90% de los exámenes: `no shutdown`.** Las interfaces de los routers arrancan en estado *administratively down*. Sin `no shutdown`, la interfaz está configurada pero no transmite NADA — es como un grifo con el agua cortada.

### Paso 3 — Configurar las PCs

- **PC0:** IP `192.168.1.10`, Máscara `255.255.255.0`, Gateway `192.168.1.1`.
- **PC1:** IP `192.168.1.11`, Máscara `255.255.255.0`, Gateway `192.168.1.1`.

> **¿Por qué el gateway?** El gateway es la puerta de salida hacia OTRAS redes. Cuando la PC quiere llegar a algo que NO está en su red (192.168.1.x), entrega el paquete al gateway — que es el router. Sin gateway, las PCs se ven entre sí pero no salen de la LAN.

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

El estado que buscás: **up/up**. Si dice *administratively down* → falta `no shutdown`. Si dice *down/down* → el cable o el otro lado no están conectados.

Desde la PC0:

```
PC0> ping 192.168.1.11      ← contra la otra PC
PC0> ping 192.168.1.1       ← contra el gateway
```

Ambos deben responder. Con eso ya tenés una LAN funcional con salida controlada por el router.

---

## 5. Laboratorio 3: el switch — administración y MACs

**Objetivo:** darle IP de administración al switch y para el momento de ver cómo aprende las MACs.

### Paso 1 — Lo que ya tenés armado

Usá la topología del Lab 2 (R1 + S1 + 2 PCs). El switch funciona sin configuración: es capa 2 pura. Pero para **administrarlo** (entrar por red y no solo por consola) necesita una IP — y para que responda desde una red remota, un gateway por defecto.

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

> **La idea que confunde a todos:** el switch NO enruta. La IP en `interface vlan 1` es SOLO para que vos (o un servidor de monitoreo) puedas entrar "por la red" a administrarlo. El tráfico de las PCs pasa por el switch sin tocar esa IP. Es como tener un número de interno de la recepción: no es la central, pero podés llamar a la recepción.

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

Dos MACs, cada una en su puerto: el switch **aprendió** quién vive en cada puerto, solo viendo las tramas pasar. Ese mecanismo (aprender del origen, reenviar por el destino) es el corazón de la capa 2 que ya estudiaste: acá lo estás viendo en vivo.

Otros shows de switch que vas a usar siempre:

```
S1#  show interfaces status      ! Estado de TODOS los puertos de un vistazo
S1#  show vlan brief             ! VLANs existentes y qué puertos están en cada una
S1#  show ip interface brief     ! La IP de administración
```

---

## 6. Laboratorio 4: DHCP en el router

**Objetivo:** que el router reparta IPs solas, sin configurar una a una.

### Paso 1 — Sacarle la IP manual a las PCs

Con las PCs del Lab 3, andá a **IP Configuration** de cada PC y cambiá a **DHCP** (el botón de radio). Las PCs pierden su IP y se quedan esperando... que alguien les conteste. Todavía nadie las va a atender: configurá el router.

### Paso 2 — Configurar el pool

```
R1#  configure terminal

R1(config)#  ip dhcp excluded-address 192.168.1.1 192.168.1.20
```

Ese comando le dice a DHCP: "estas IPs NO las repartas" (son las que ya tienen el router, el switch, y las que más adelante tendrán servidores o impresoras).

```
R1(config)#  ip dhcp pool LAN1
R1(dhcp-config)#  network 192.168.1.0 255.255.255.0   ! La red a repartir
R1(dhcp-config)#  default-router 192.168.1.1           ! Gateway que recibirán las PCs
R1(dhcp-config)#  dns-server 8.8.8.8                   ! DNS que les va a decir
R1(dhcp-config)#  lease 7                              ! Duración del arriendo en días
R1(dhcp-config)#  end
```

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

> **Fijate en el detalle del "cómo se asigna":** la primera PC se llevó la `.21`. Las `.1` a `.20` quedaron excluidas de la repartición. Y ojo lo que aprendió el router: la tabla `binding` asocia IP asignada con la **MAC** del cliente — DHCP y MAC trabajan juntos, uno reparte y el otro identifica.

Otros shows útiles:

```
R1#  show ip dhcp pool          ! Configuración del pool y estadísticas
R1#  show ip dhcp conflict      ! IPs que dos equipos reclamaron (conflictos)
```

### Paso 4 (opcional pero valioso): DHCP en otra red

¿Y si el servidor DHCP está en OTRA red? Los mensajes DHCP son **broadcasts** — y los broadcasts no cruzan routers. La solución es una línea en la interfaz que está del lado de las PCs:

```
R1(config)#  interface gigabitEthernet 0/0
R1(config-if)#  ip helper-address 192.168.2.10   ! IP del servidor DHCP de la otra red
```

Sin esa línea, las PCs de esta LAN jamás le "hablan" al servidor de la red 2.

---

## 7. Laboratorio 5: dos routers — rutas estáticas y el ping que no vuelve

**Objetivo:** conectar dos redes con dos routers y enseñarles a llegar el uno al otro.

### Paso 1 — Armar la red

```
[LAN1 192.168.1.0] -- R1 -- 10.0.0.0/30 -- R2 -- [LAN2 192.168.2.0]
```

- **R1** (1941): Gi0/0 → PC0 (`192.168.1.1`), Gi0/1 → R2 (`10.0.0.1`).
- **R2** (1941): Gi0/0 → PC1 (`192.168.2.1`), Gi0/1 → R1 (`10.0.0.2`).
- Cable entre routers: **Crossover** (o uso el cable automático de PT).
- Las conexiones reales de R1-Gi0/0 y R2-Gi0/0 pueden ir con switches, pero para el lab alcanza directo a las PCs.

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

### Paso 3 — El experimento que enseña más que mil diapositivas

Desde PC0:

```
PC0> ping 192.168.1.1      ← su gateway: ✓
PC0> ping 10.0.0.1         ← el otro lado de R1: ✓ (conectado directo)
PC0> ping 10.0.0.2         ← R2: ✓ (¿por qué? porque es una red directa de R1... esperá, NO es directa de R1. Lo es de R2. R1 la ve porque 10.0.0.0/24 es SU red directa también — ambos routers están en el mismo segmento 10.0.0.0/24)
PC0> ping 192.168.2.1      ← ¡FALLA! ¿Y por qué si todo lo anterior funcionó? ESTE es el momento de entender.
```

> **El título del lab se explica solo:** el ping va... y no vuelve. PC0 llega a R1, R1 lo manda a R2 (la red 10.0.0.0 es directa), R2 lo entrega a PC1. PC1 responde a `192.168.1.10` — y ahí R2 se queda mirando: "¿192.168.1.0? No es una red directa para mí. No tengo idea de dónde está." **El paquete de respuesta se cae en R2.** Por eso: el ping "va pero no regresa" = problema de ruta de VUELTA.

### Paso 4 — La solución: rutas estáticas

Cada router necesita saber cómo llegar a la red del otro:

```
R1(config)#  ip route 192.168.2.0 255.255.255.0 10.0.0.2
R2(config)#  ip route 192.168.1.0 255.255.255.0 10.0.0.1
```

Sintaxis: `ip route [red destino] [máscara] [siguiente salto]`. "Para llegar a 192.168.2.0, dale el paquete a 10.0.0.2."

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

| Letra | Significado |
|-------|-------------|
| **C** | Connected — la red está pegada a la interfaz |
| **S** | Static — la aprendimos del comando `ip route` |
| R / O / D | RIP / OSPF / EIGRP — protocolos de enrutamiento dinámico (viajan solos) |

### Paso 5 (modo Simulación): ver el paquete viajar

Este es el momento de pegarle al botón **Simulation** de Packet Tracer, lanzar un ping de PC0 a PC1 y hacer click en **Capture/Forward**:

1. El paquete sale de PC0 → **switch/R1** → cambia de capa → **R1** lo reenvía con nueva MAC al cable 10.0.0.0 → **R2** → **PC1**.
2. La respuesta hace el camino inverso — ahora SÍ, porque R2 ya tiene la ruta estática.

Lo que estás viendo es el viaje completo: la PC empaca (capa 2 con MAC), el router reescribe (capa 3 con IP que no cambia, MAC que sí), y el destino responde. Este lab ES la foto que vale por mil palabras.

### Ruta por defecto (default route)

Cuando un router no tiene ninguna ruta que coincida con el destino, tira el paquete a la basura. La ruta por defecto es el "y si nada coincide, mandalo acá":

```
R1(config)#  ip route 0.0.0.0 0.0.0.0 10.0.0.2
```

`0.0.0.0 0.0.0.0` significa "cualquier red, cualquier máscara". Es la que configuran los routers de borde hacia el ISP: todo lo que no conozco, al proveedor.

---

## 8. Laboratorio 6: VLANs y router on a stick

**Objetivo:** dividir el switch en redes lógicas separadas y habilitar la comunicación entre ellas con UN solo cable al router.

### Paso 1 — Armar la red

- **1 switch 2960**, **1 router 1941**, **4 PCs**.
- PC0 y PC1 → switch Fa0/1 y Fa0/2 (VLAN 10).
- PC2 y PC3 → switch Fa0/3 y Fa0/4 (VLAN 20).
- Switch Gi0/1 → router Gi0/0.

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

### Paso 3 — El trunk hacia el router

El enlace switch-router debe llevar tráfico de las DOS VLANs al mismo tiempo. Eso es un **trunk**:

```
Switch(config)#  interface gigabitEthernet 0/1
Switch(config-if)#  switchport mode trunk
Switch(config-if)#  switchport trunk allowed vlan 10,20
Switch(config-if)#  end
```

### Paso 4 — Router on a stick (ROAS)

El router tiene UNA interfaz física (Gi0/0) pero creamos **subinterfaces** — una por VLAN, cada una como si fuera una interfaz aparte:

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

### Paso 5 — IPs de las PCs y verificación

| PC | IP | Gateway |
|----|-----|---------|
| PC0 | 192.168.10.10 | 192.168.10.1 |
| PC1 | 192.168.10.11 | 192.168.10.1 |
| PC2 | 192.168.20.10 | 192.168.20.1 |
| PC3 | 192.168.20.11 | 192.168.20.1 |

Probá:

```
PC0> ping 192.168.10.11     ← misma VLAN: ✓ (pasa por el switch, sin router)
PC0> ping 192.168.20.10     ← otra VLAN: ✓ (pasa por el router: PC0 → switch trunk → subinterfaz .10 → subinterfaz .20 → switch → PC2)
```

> **La trampa conceptual:** si el gateway de cada PC no es la IP de SU subinterfaz, el ping entre VLANs falla. El router recibe el paquete etiquetado con VLAN 10 y responde por la subinterfaz que corresponde a esa etiqueta. Cada VLAN es un dominio de broadcast distinto: sin router (o switch multicapa), son mundos separados.

Verificaciones de switch que cierran el lab:

```
Switch#  show vlan brief              ! Qué puertos van en cada VLAN
Switch#  show interfaces trunk        ! El trunk activo y las VLANs permitidas
Switch#  show interfaces Fa0/1 switchport    ! El detalle de un puerto
```

Tabla resumen de la topología típica:

| VLAN | Nombre | Red | Gateway | Puertos switch |
|------|--------|-----|---------|----------------|
| 10 | VENTAS | 192.168.10.0/24 | 192.168.10.1 | Fa0/1 – Fa0/2 |
| 20 | RRHH | 192.168.20.0/24 | 192.168.20.1 | Fa0/3 – Fa0/4 |
| 1 | Nativa (default) | — | — | Gi0/1 (Trunk) |

---

## 9. Laboratorio 7: el lab completo

**Objetivo:** unir TODOS los conceptos en una sola red de oficina: router + DHCP + switch con VLANs + rutas + PCs.

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

### Paso 2 — La receta completa (en orden)

1. **Switch:** crear VLAN 10 y 20, asignar access ports, trunk hacia R1.
2. **Router R1:** subinterfaces `.10` y `.20` con `encapsulation dot1Q`, IPs `192.168.10.1` y `192.168.20.1`.
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

4. **PCs en DHCP** (Desktop → IP Configuration → DHCP): deben recibir IPs de sus VLANs correspondientes.
5. **Rutas:** los routers se conectan por el enlace 10.0.0.0/24 — si hay más redes, cada lado necesita la ruta del otro:

```
R1(config)#  ip route 192.168.30.0 255.255.255.0 10.0.0.2
R2(config)#  ip route 192.168.10.0 255.255.255.0 10.0.0.1
R2(config)#  ip route 192.168.20.0 255.255.255.0 10.0.0.1
```

6. **Guardar TODO**: `copy running-config startup-config` en router y switch.

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

Si todo responde: acabaste de construir una red de oficina pequeña y real — con DHCP automático, segmentación por departamentos y salida hacia otra red. Ese es el vuelo. Las piezas sueltas de los labs anteriores, todas encajadas.

---

## 10. Referencia rápida

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

### PC (Command Prompt de Packet Tracer)

| Comando | Qué hace |
|---------|----------|
| `ipconfig` / `ipconfig /all` | IPs del equipo / detalle completo (incluye MAC) |
| `ping IP` | Prueba de conectividad |
| `arp -a` | Tabla ARP (IP ↔ MAC) del equipo |

---

## 11. Errores comunes y cómo diagnosticarlos

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

> **El método de diagnóstico en 3 pasos que nunca falla:** (1) `show ip interface brief` en los routers — ¿están las interfaces up/up con las IPs correctas? (2) `ping` al gateway desde la PC — si no responde, es capa 1/2 (cable, VLAN); si responde, el problema está más lejos. (3) `show ip route` — ¿existe la ruta hacia el destino y la de vuelta? El 90% de los problemas de los labs se resuelven con esos tres comandos.

---

## 12. Ejercicios guiados

### Ejercicio 1: completá la config

Un router tiene esto configurado en Gi0/0:

```
R1(config-if)#  ip address 192.168.5.1 255.255.255.0
```

Falta UN comando para que la interfaz funcione. ¿Cuál es? ¿Por qué?

<details>
<summary>Ver respuesta</summary>

`no shutdown`. Las interfaces del router arrancan en *administratively down*: la IP está asignada, pero la interfaz no transmite. Sin `no shutdown`, el estado queda `administratively down`, el teléfono no suena y ningún ping responde. Es el comando olvidado #1 de la historia de Cisco.
</details>

### Ejercicio 2: el diagnóstico del ping que falla

PC0 (192.168.1.10) hace ping a PC1 (192.168.1.11), ambas conectadas a un switch, y falla. Audité: IPs y máscaras correctas, cable directo, LEDs verdes. ¿Qué te falta revisar?

<details>
<summary>Ver respuesta</summary>

Si IPs, máscaras y cables están bien y las dos PCs están en la misma VLAN (o el switch no tiene VLANs, es decir, todo en VLAN 1 por defecto)... el ping entre dos equipos de la misma red ni siquiera necesita el router. Lo siguiente a revisar es el **firewall de la PC** (en Packet Tracer no aplica, pero en la vida real es la causa #1) o el **cable cruzado vs directo** (PC↔PC directo requiere crossover en redes clásicas). Ah, y confirmá que ambas PCs estén en la misma red lógica (subred) — si una está en 192.168.1.0/24 y la otra en 192.168.2.0/24 sin router entre medio, jamás se van a ver.
</details>

### Ejercicio 3: diseño de subredes con VLANs

Tenés un switch 2960 (24 puertos) y la siguiente necesidad: 6 PCs de Ventas, 8 PCs de RRHH, 2 impresoras de uso compartido. Diseñá la segmentación con VLANs y decí cuál es el mínimo de puertos que necesita el router para el enrutamiento inter-VLAN.

<details>
<summary>Ver respuesta</summary>

- **VLAN 10 — VENTAS:** 6 PCs → Fa0/1–Fa0/6.
- **VLAN 20 — RRHH:** 8 PCs → Fa0/7–Fa0/14.
- **VLAN 30 — IMPRESORAS:** 2 impresoras → Fa0/15–Fa0/16.
- **Router:** alcanza con **1 puerto físico** (Gi0/1, trunk) usando router on a stick: una subinterfaz por VLAN (`.10`, `.20`, `.30`) con `encapsulation dot1Q`. Gateway por VLAN: 192.168.10.1 / 192.168.20.1 / 192.168.30.1.
- Las PCs usan la impresora de su VLAN; si RRHH quiere imprimir, la impresora compartida podría estar en la VLAN 30 y RRHH la alcanza vía el router.
</details>

### Ejercicio 4: la secuencia completa

Poné en orden lógico esta configuración: (a) `no shutdown` en Gi0/0, (b) `ip address 192.168.1.1 255.255.255.0` en Gi0/0, (c) `hostname R1`, (d) `copy running-config startup-config`, (e) `enable secret`.

<details>
<summary>Ver respuesta</summary>

1. `enable` / `configure terminal`
2. **c)** `hostname R1`
3. **e)** `enable secret`
4. **b)** `interface Gi0/0` → `ip address 192.168.1.1 255.255.255.0`
5. **a)** mismo contexto: `no shutdown`
6. **d)** `end` → `copy running-config startup-config`

El orden conceptual: identidad del equipo → seguridad → IPs → activar interfaces → guardar. Cualquier otro orden "funciona", pero este es el que no te deja nada colgado.
</details>

### Ejercicio 5: modo simulación

En el Lab 5, con el ping que "va pero no vuelve" (sin rutas estáticas aún), ¿qué ves en el modo simulación cuando PC0 pinguea a PC1? ¿Dónde se corta el paquete?

<details>
<summary>Ver respuesta</summary>

El paquete ICMP Echo Request viaja: PC0 → R1 → R2 → PC1 (todo en verde). La respuesta (Echo Reply) sale de PC1 hacia R2... y ahí: **se cae en R2** con una X roja (o queda en "dropped silently"). R2 no tiene ruta hacia 192.168.1.0 (su tabla solo conoce su LAN y el enlace). La respuesta jamás sale de R2. Ese es el momento exacto en que aprendés que el enrutamiento necesita la ruta de IDA **y** la de VUELTA.
</details>

---

## 13. Comprobá lo que aprendiste

**1. ¿Cuál es la diferencia entre `running-config` y `startup-config`?**
<details>
<summary>Ver respuesta</summary>

`running-config` es la config activa en RAM (se pierde al apagar); `startup-config` es la guardada en NVRAM (persiste). Se pasa de una a otra con `copy running-config startup-config`.
</details>

**2. ¿Por qué `no shutdown` es tan importante?**
<details>
<summary>Ver respuesta</summary>

Las interfaces del router arrancan *administratively down*: aunque tengan IP asignada, no transmiten. `no shutdown` activa la interfaz. Sin él, todo lo demás (IP, ruta, DHCP) está "configurado" pero muerto.
</details>

**3. ¿Qué comando muestra el estado de todas las interfaces del router?**
<details>
<summary>Ver respuesta</summary>

`show ip interface brief` — y el estado que buscás es `up/up` (físico + protocolo).
</details>

**4. ¿Qué significa la letra `S` en `show ip route`, y qué hay entre las `C` y `S`?**
<details>
<summary>Ver respuesta</summary>

`S` = ruta estática (configurada a mano con `ip route`); `C` = red conectada directamente (aprendida sola). Las `C` nunca se borran; las `S` las escribís vos.
</details>

**5. ¿Para qué sirve `ip helper-address`?**
<details>
<summary>Ver respuesta</summary>

Para que los broadcasts de DHCP de una LAN crucen hasta un servidor DHCP que está en OTRA red. Sin esa línea, los broadcasts no atraviesan el router y las PCs jamás reciben IP.
</details>

**6. ¿Qué es un puerto trunk y en qué se diferencia de un puerto access?**
<details>
<summary>Ver respuesta</summary>

Access = una sola VLAN (PCs, impresoras, servidores). Trunk = lleva tráfico de MÚLTIPLES VLANs etiquetadas (802.1Q), usado hacia routers y entre switches.
</details>

**7. ¿Cómo se llama la técnica de enrutar entre VLANs con una sola interfaz física del router, y qué comando la define?**
<details>
<summary>Ver respuesta</summary>

**Router on a stick** (ROAS): subinterfaces `Gi0/0.10`, `Gi0/0.20`... con `encapsulation dot1Q <ID>` y una IP por subinterfaz. El switch debe tener el enlace hacia el router en modo trunk.
</details>

**8. En el ping entre dos redes, ¿por qué el paquete puede ir pero no volver?**
<details>
<summary>Ver respuesta</summary>

Porque el enrutamiento es asimétrico: cada router necesita su propia ruta. El destino puede recibir el paquete, pero si su router no sabe cómo llegar a la red de origen, la respuesta se descarta. Ruta estática en AMBOS lados (o en todos los que intervienen).
</details>

**9. ¿Cuál es la secuencia mínima de verificación ante un ping que falla?**
<details>
<summary>Ver respuesta</summary>

(1) `show ip interface brief` — ¿interfaces up/up con IPs? (2) ping al gateway — ¿problema local? (3) `show ip route` — ¿existe la ruta (y la de vuelta)? Después, cableado y VLANs.
</details>

**10. ¿Por qué el switch necesita IP y gateway si no enruta?**
<details>
<summary>Ver respuesta</summary>

Para ADMINISTRACIÓN remota (SSH/HTTP de gestión), no para el tráfico de datos. La IP en `interface vlan 1` + `ip default-gateway` te dejan entrar al switch desde otra red; el tráfico de las PCs lo atraviesa sin tocarla.
</details>

---

## 14. Glosario

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

---

## 15. Resumen en 10 puntos

1. **Packet Tracer es el simulador de vuelo** del técnico de redes: mismos comandos que un equipo real, cero riesgo de romper algo.
2. **Los modos son la base:** `>` para mirar, `#` para ver de verdad, `(config)#` para cambiar.
3. **`no shutdown` es el comando olvidado #1** de Cisco: sin él, la interfaz está muerta aunque tenga IP.
4. **Guardá siempre:** `copy running-config startup-config` — la RAM olvida, la NVRAM no.
5. **El estado que buscás es `up/up`** — fijate en `show ip interface brief`.
6. **El gateway es la puerta de salida:** sin él, la PC solo ve su propia red.
7. **El ping que va pero no vuelve = falta ruta de regreso** — verifica `show ip route` en los dos routers.
8. **El switch no enruta:** su IP es de administración; las VLANs necesitan router (ROAS) para comunicarse.
9. **El default route (`0.0.0.0`) es el "y si nada, mandalo al proveedor"** — la estrella de los routers de borde.
10. **El modo Simulación es tu mejor maestro:** cuando veas el paquete cortarse en un router con una X, no lo vas a olvidar más.

---

> **Orden recomendado de práctica:** Router (IPs + rutas) → Switch (VLANs + puertos) → Servidor/DHCP → PCs → Verificar con `ping` e `ipconfig`. Este manual te dio los 7 labs que llevan a ese orden: hacelos, desarmalos, rompelos a propósito y volvelos a armar.

# CISCO PACKET TRACER — Manual de Comandos
**Router · Switch · DHCP · IP Routes · VLANs**

---

## ÍNDICE
1. [Configuración del Router](#1-configuración-del-router)
2. [Configuración del Switch](#2-configuración-del-switch)
3. [DHCP en el Router](#3-dhcp-en-el-router)
4. [IP Routes — Rutas Estáticas](#4-ip-routes--rutas-estáticas)
5. [VLANs](#5-vlans)
6. [Referencia Rápida](#6-referencia-rápida)

---

## 1. Configuración del Router

### 1.1 Acceso y modo privilegiado

```
Router>  enable                     ! Entra a modo EXEC privilegiado
Router#  configure terminal         ! Entra a modo configuración global
Router(config)#                     ! Ya estás en config global
```

### 1.2 Nombre y contraseñas

```
Router(config)#  hostname R1

! Contraseña cifrada para modo privilegiado
R1(config)#  enable secret cisco123

! Consola — acceso físico
R1(config)#  line console 0
R1(config-line)#  password cisco
R1(config-line)#  login
R1(config-line)#  exit

! Telnet / SSH — acceso remoto
R1(config)#  line vty 0 4
R1(config-line)#  password cisco
R1(config-line)#  login
R1(config-line)#  exit

! Cifrar todas las contraseñas en texto plano
R1(config)#  service password-encryption
```

### 1.3 Asignar IP a una interfaz

```
R1(config)#  interface gigabitEthernet 0/0
R1(config-if)#  description LAN - Hacia el Switch
R1(config-if)#  ip address 192.168.1.1 255.255.255.0
R1(config-if)#  no shutdown            ! OBLIGATORIO — activa la interfaz
R1(config-if)#  exit

R1(config)#  interface gigabitEthernet 0/1
R1(config-if)#  description Enlace a otro router
R1(config-if)#  ip address 10.0.0.1 255.255.255.0
R1(config-if)#  no shutdown
R1(config-if)#  exit
```

> **NOTA:** Las interfaces del router arrancan en estado `administratively down`. Sin `no shutdown` no transmiten nada.

### 1.4 Comandos de verificación

```
R1#  show ip interface brief          ! Resumen de todas las interfaces y estado
R1#  show interfaces gigabitEthernet 0/0   ! Detalle de una interfaz
R1#  show running-config              ! Config activa completa (RAM)
R1#  show startup-config              ! Config guardada (NVRAM)
R1#  show version                     ! IOS, uptime, modelo
R1#  show ip route                    ! Tabla de enrutamiento
```

| Comando | Muestra |
|---------|---------|
| `show ip interface brief` | Estado UP/DOWN de todas las interfaces + IPs |
| `show running-config` | Configuración completa activa |
| `show ip route` | Tabla de rutas: C=directa, S=estática, R=RIP |
| `show interfaces Gi0/0` | Errores, velocidad, duplex, tráfico |
| `show version` | Versión IOS, RAM, Flash, tiempo encendido |

### 1.5 Guardar la configuración

```
R1#  copy running-config startup-config
Destination filename [startup-config]?   <- presiona Enter

! Forma rápida
R1#  wr
```

> **TIP:** `running-config` vive en RAM (se pierde al apagar). `startup-config` vive en NVRAM (persiste). Siempre guarda antes de cerrar.

---

## 2. Configuración del Switch

### 2.1 Acceso, nombre y contraseñas

```
Switch>  enable
Switch#  configure terminal
Switch(config)#  hostname S1

S1(config)#  enable secret cisco123

S1(config)#  line console 0
S1(config-line)#  password cisco
S1(config-line)#  login
S1(config-line)#  exit

S1(config)#  line vty 0 15
S1(config-line)#  password cisco
S1(config-line)#  login
S1(config-line)#  exit

S1(config)#  service password-encryption
```

### 2.2 IP de administración (VLAN 1)

El switch solo necesita IP para administración remota, no para enrutar tráfico.

```
S1(config)#  interface vlan 1
S1(config-if)#  ip address 192.168.1.254 255.255.255.0
S1(config-if)#  no shutdown
S1(config-if)#  exit

! Indicar por dónde sale el tráfico fuera de la red
S1(config)#  ip default-gateway 192.168.1.1

S1(config)#  end
S1#  copy running-config startup-config
```

### 2.3 Comandos de verificación

```
S1#  show ip interface brief          ! IP admin y estado
S1#  show mac address-table           ! MACs aprendidas por puerto
S1#  show interfaces status           ! Estado de todos los puertos
S1#  show vlan brief                  ! VLANs y puertos asignados
S1#  show running-config
```

---

## 3. DHCP en el Router

El router asigna IPs automáticamente a las PCs sin necesitar un servidor externo.

### 3.1 Configurar pool DHCP

```
! Excluir IPs fijas del rango asignable (router, switch, servidores)
R1(config)#  ip dhcp excluded-address 192.168.1.1 192.168.1.20

! Crear el pool
R1(config)#  ip dhcp pool LAN1
R1(dhcp-config)#  network 192.168.1.0 255.255.255.0   ! Red completa
R1(dhcp-config)#  default-router 192.168.1.1           ! Gateway para las PCs
R1(dhcp-config)#  dns-server 8.8.8.8                   ! DNS
R1(dhcp-config)#  lease 7                              ! Duración en días
R1(dhcp-config)#  exit
```

> **TIP:** Las PCs recibirán IPs desde la .21 en adelante porque excluimos .1 a .20.

### 3.2 ip helper-address (DHCP en servidor externo)

Cuando el servidor DHCP está en una red diferente a las PCs, el router debe reenviar las peticiones:

```
! En la interfaz LAN donde están las PCs
R1(config)#  interface gigabitEthernet 0/0
R1(config-if)#  ip helper-address 192.168.2.10   ! IP del servidor DHCP
R1(config-if)#  exit
```

> **NOTA:** Sin `ip helper-address`, los broadcasts DHCP de las PCs no cruzan hacia otra red y nunca llegan al servidor.

### 3.3 Verificar DHCP

```
R1#  show ip dhcp pool          ! Pool configurado y estadísticas
R1#  show ip dhcp binding       ! Qué IP se asignó a cada MAC
R1#  show ip dhcp conflict      ! Conflictos detectados
```

| Comando | Muestra |
|---------|---------|
| `show ip dhcp pool` | Nombre del pool, red, IPs disponibles |
| `show ip dhcp binding` | IP asignada, MAC del cliente, vencimiento |
| `show ip dhcp conflict` | IPs que causaron conflicto |

---

## 4. IP Routes — Rutas Estáticas

Las rutas estáticas le dicen al router cómo llegar a redes que no tiene conectadas directamente.

### 4.1 Sintaxis

```
! Formato:
! ip route  [red_destino]  [máscara]  [siguiente_salto]

! Ejemplo: para llegar a 192.168.2.0, el próximo router es 10.0.0.2
R1(config)#  ip route 192.168.2.0 255.255.255.0 10.0.0.2

! Ruta por defecto (cuando no coincide ninguna otra ruta)
R1(config)#  ip route 0.0.0.0 0.0.0.0 10.0.0.2
```

### 4.2 Ejemplo — 2 routers, 2 LANs

```
Topología:
[LAN1 192.168.1.0] -- R1 -- 10.0.0.0 -- R2 -- [LAN2 192.168.2.0]
```

```
! En R1 — necesita saber cómo llegar a LAN2
R1(config)#  ip route 192.168.2.0 255.255.255.0 10.0.0.2

! En R2 — necesita saber cómo llegar a LAN1
R2(config)#  ip route 192.168.1.0 255.255.255.0 10.0.0.1
```

> **NOTA:** Si falta la ruta en uno de los dos routers, el ping va pero no regresa.

### 4.3 Verificar rutas

```
R1#  show ip route

! Salida esperada:
! C   192.168.1.0/24  is directly connected, GigabitEthernet0/0
! C   10.0.0.0/24     is directly connected, GigabitEthernet0/1
! S   192.168.2.0/24  [1/0] via 10.0.0.2
```

Letras en la tabla de rutas:

| Letra | Significado |
|-------|-------------|
| C | Connected — red directamente conectada |
| S | Static — ruta estática configurada manualmente |
| R | RIP |
| O | OSPF |
| D | EIGRP |

### 4.4 Eliminar una ruta

```
R1(config)#  no ip route 192.168.2.0 255.255.255.0 10.0.0.2
```

---

## 5. VLANs

Las VLANs dividen una red física en segmentos lógicos separados. Dispositivos en VLANs distintas no se comunican sin un router.

### 5.1 Crear VLANs en el Switch

```
S1(config)#  vlan 10
S1(config-vlan)#  name VENTAS
S1(config-vlan)#  exit

S1(config)#  vlan 20
S1(config-vlan)#  name RRHH
S1(config-vlan)#  exit

S1(config)#  vlan 30
S1(config-vlan)#  name SERVIDORES
S1(config-vlan)#  exit
```

### 5.2 Puertos Access (un puerto = una VLAN)

Se usa en puertos de PCs, impresoras y servidores.

```
! Puerto único
S1(config)#  interface fastEthernet 0/1
S1(config-if)#  switchport mode access
S1(config-if)#  switchport access vlan 10
S1(config-if)#  exit

! Rango de puertos de una sola vez
S1(config)#  interface range fastEthernet 0/2-5
S1(config-if-range)#  switchport mode access
S1(config-if-range)#  switchport access vlan 20
S1(config-if-range)#  exit
```

### 5.3 Puerto Trunk (Switch → Router o Switch → Switch)

Un puerto Trunk lleva tráfico de múltiples VLANs al mismo tiempo.

```
S1(config)#  interface gigabitEthernet 0/1
S1(config-if)#  switchport mode trunk
S1(config-if)#  switchport trunk allowed vlan 10,20,30
S1(config-if)#  exit
```

### 5.4 Router on a Stick (enrutamiento entre VLANs)

Un solo cable físico entre switch y router, con subinterfaces por cada VLAN.

```
! Primero activar la interfaz física sin IP
R1(config)#  interface gigabitEthernet 0/0
R1(config-if)#  no shutdown
R1(config-if)#  exit

! Subinterfaz VLAN 10
R1(config)#  interface gigabitEthernet 0/0.10
R1(config-subif)#  encapsulation dot1Q 10
R1(config-subif)#  ip address 192.168.10.1 255.255.255.0
R1(config-subif)#  exit

! Subinterfaz VLAN 20
R1(config)#  interface gigabitEthernet 0/0.20
R1(config-subif)#  encapsulation dot1Q 20
R1(config-subif)#  ip address 192.168.20.1 255.255.255.0
R1(config-subif)#  exit

! Subinterfaz VLAN 30
R1(config)#  interface gigabitEthernet 0/0.30
R1(config-subif)#  encapsulation dot1Q 30
R1(config-subif)#  ip address 192.168.30.1 255.255.255.0
R1(config-subif)#  exit
```

> **NOTA:** El puerto del switch hacia el router DEBE estar en modo Trunk. El gateway de cada PC es la IP de su subinterfaz.

### 5.5 Verificar VLANs

```
S1#  show vlan brief                        ! VLANs y puertos asignados
S1#  show interfaces trunk                  ! Puertos trunk activos
S1#  show interfaces Fa0/1 switchport       ! Detalle de un puerto
```

### 5.6 Tabla resumen — configuración típica

| VLAN | Nombre | Red | Gateway | Puertos Switch |
|------|--------|-----|---------|----------------|
| 10 | VENTAS | 192.168.10.0/24 | 192.168.10.1 | Fa0/1 – Fa0/5 |
| 20 | RRHH | 192.168.20.0/24 | 192.168.20.1 | Fa0/6 – Fa0/10 |
| 30 | SERVIDORES | 192.168.30.0/24 | 192.168.30.1 | Fa0/11 – Fa0/15 |
| 1 | Nativa (default) | — | — | Gi0/1 (Trunk) |

---

## 6. Referencia Rápida

### Router — todos los comandos

| Comando | Qué hace |
|---------|----------|
| `enable` | Entra a modo privilegiado |
| `configure terminal` | Abre modo configuración global |
| `hostname NOMBRE` | Cambia el nombre del dispositivo |
| `enable secret PASS` | Contraseña cifrada para modo privilegiado |
| `interface Gi0/0` | Entra a configurar una interfaz |
| `ip address IP MASK` | Asigna IP a la interfaz |
| `no shutdown` | Activa la interfaz |
| `ip route RED MASK NEXTHOP` | Agrega ruta estática |
| `ip dhcp pool NOMBRE` | Crea pool DHCP |
| `ip dhcp excluded-address X Y` | Excluye IPs del rango DHCP |
| `ip helper-address IP` | Reenvía DHCP hacia otro segmento |
| `show ip interface brief` | Resumen de interfaces y estado |
| `show ip route` | Tabla de enrutamiento |
| `show running-config` | Config activa completa |
| `show ip dhcp binding` | IPs asignadas por DHCP |
| `copy running-config startup-config` | Guarda la configuración |

### Switch — todos los comandos

| Comando | Qué hace |
|---------|----------|
| `interface vlan 1` | Configura IP de administración |
| `ip default-gateway IP` | Gateway del switch para admin remoto |
| `vlan ID` | Crea una VLAN |
| `name NOMBRE` | Asigna nombre a la VLAN |
| `switchport mode access` | Puerto para PC/servidor (1 VLAN) |
| `switchport access vlan ID` | Asigna puerto a una VLAN |
| `switchport mode trunk` | Puerto multi-VLAN (hacia router/switch) |
| `switchport trunk allowed vlan X,Y` | VLANs permitidas en el trunk |
| `show vlan brief` | VLANs y puertos asignados |
| `show interfaces trunk` | Puertos trunk activos |
| `show mac address-table` | Tabla de MACs aprendidas |

### Errores comunes y solución

| Problema | Causa | Solución |
|----------|-------|----------|
| Interfaz `down/down` | Falta `no shutdown` | Aplicar `no shutdown` en la interfaz |
| PC no recibe IP | DHCP mal configurado o sin `ip helper` | Verificar pool y/o `ip helper-address` |
| Ping falla entre LANs | Falta ruta estática en algún router | Agregar `ip route` en ambos routers |
| PC no sale de su VLAN | Puerto mal asignado o gateway incorrecto | Verificar `switchport access vlan` y gateway de la PC |
| Trunk no funciona | Puerto en modo access | Cambiar a `switchport mode trunk` |
| Config se pierde al reiniciar | No se guardó | Ejecutar `copy running-config startup-config` |

---

> **Orden recomendado:** Router (IPs + rutas) → Switch (VLANs + puertos) → Servidor/DHCP → PCs → Verificar con `ping` e `ipconfig`

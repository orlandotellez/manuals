# 44. Troubleshooting de Routing

**La metodología que convierte el caos en un diagnóstico — cuando la red no responde, vos sí sabés qué mirar**

---

## Índice

- [El problema: la red "no anda" y nadie sabe por qué](#1-el-problema-la-red-no-anda-y-nadie-sabe-por-qué)
- [La metodología: síntoma → hipótesis → verificación](#2-la-metodología-síntoma--hipótesis--verificación)
- [El árbol de diagnóstico: 7 preguntas en orden](#3-el-árbol-de-diagnóstico-7-preguntas-en-orden)
- [Los comandos show que resuelven TODO](#4-los-comandos-show-que-resuelven-todo)
- [Troubleshooting por protocolo](#5-troubleshooting-por-protocolo)
- [El caso real resuelto: de "no hay internet" a la causa raíz](#6-el-caso-real-resuelto-de-no-hay-internet-a-la-causa-raíz)
- [Los 10 síntomas clásicos y su causa](#7-los-10-síntomas-clásicos-y-su-causa)
- [Herramientas: ping, traceroute y la lectura de sus misterios](#8-herramientas-ping-traceroute-y-la-lectura-de-sus-misterios)
- [Comprobá lo que aprendiste](#9-comprobá-lo-que-aprendiste)
- [Glosario](#10-glosario)
- [Resumen en 10 puntos](#11-resumen-en-10-puntos)

---

## 1. El problema: la red "no anda" y nadie sabe por qué

Llegaste a este manual con toda la teoría de routing encima: estáticas, RIP, OSPF, EIGRP, IS-IS, BGP, redistribución. Ahora llega el día que a todos les toca: **algo no funciona**. El usuario dice "no tengo internet", el jefe dice "la VPN no responde", y vos tenés 20 comandos en la cabeza pero por dónde empezar.

> **El error número uno del troubleshooting** no es técnico, es de método: **tirar comandos al azar** ("a ver si con `show run` aparece algo..."). Eso funciona una de cada diez veces, y pierde horas. El profesional no es el que conoce más comandos: es el que **reduce el espacio de búsqueda con método** hasta que la causa raíz queda expuesta.

**La analogía del médico:** el médico no te receta a ciegas. Te pregunta, te toca, te manda análisis PRIMERO (historia clínica), y recién después hipótesis y tratamiento. El troubleshooting es medicina de redes: anamnesia (¿qué cambió?), signos vitales (ping, show), análisis dirigido (show ip route/protocols), y el diagnóstico con evidencia.

---

## 2. La metodología: síntoma → hipótesis → verificación

El método completo tiene 5 pasos — y son SIEMPRE los mismos, para cualquier falla:

```text
PASO 1 — REPRODUCIR Y ACOTAR
   ¿Qué falla exactamente? ¿Desde cuándo? ¿A quién le afecta (uno o todos)?
   ¿Qué cambió hace poco? (¡la pregunta de oro! 90% de las veces alguien tocó algo)

PASO 2 — DIVIDIR LA RED EN CAPAS
   Aplicación → Transporte → Red (routing) → Enlace → Física
   ¿El problema es de ruteo o estoy buscando en el piso equivocado?
   (Si no hay link, no hay ruteo que valga: primero el enlace.)

PASO 3 — HIPÓTESIS (en orden de probabilidad)
   La más probable primero. NUNCA "todas a la vez".

PASO 4 — VERIFICAR CADA HIPÓTESIS CON EVIDENCIA
   Un comando show, un ping, un traceroute. La hipótesis se confirma o se descarta
   con DATOS, no con intuición.

PASO 5 — ARREGLAR Y VERIFICAR
   Aplicás el fix, comprobás que el síntoma desapareció y que NO rompiste otra cosa.
```

> **HACELO VOS (la regla del diagnóstico profesional):** antes de tocar CUALQUIER configuración, formulá en voz alta la hipótesis y el comando que la confirma. Si no podés decir "si pasa X, `show ip route` me va a mostrar Y", todavía no diagnosticaste: estás adivinando. El diagnóstico termina cuando tenés la **evidencia** que conecta causa y efecto.

---

## 3. El árbol de diagnóstico: 7 preguntas en orden

Cuando algo no rutea, hay exactamente 7 lugares donde puede estar el problema. Recorrelos EN ORDEN, sin saltearte:

```text
PREGUNTA                                COMANDO / PRUEBA
─────────────────────────────────────────────────────────────────────
1. ¿Está la interfaz prendida y con IP?  show ip interface brief
2. ¿Tiene el enlace "up/up" y no errores? show interfaces
3. ¿Tengo la ruta?                       show ip route <destino>
4. ¿La ruta es la CORRECTA?              show ip route (AD/métrica, next-hop)
5. ¿El next-hop es alcanzable?           ping <next-hop> ; show ip arp
6. ¿El vecino/protocolo está sano?       show ip protocols / show ip ospf neighbor
7. ¿Hay filtros/política interviniendo?  show ip access-lists / route-map / PBR
```

Regla de oro del árbol:

> **NUNCA saltees del 1 al 6.** El error más común de todos los tiempos: sospechar del protocolo (¿estará caída la sesión OSPF?) cuando el problema era la interfaz apagada o una IP mal puesta. El enlace y la IP son la base: sin "up/up" y sin dirección, NO HAY protocolo que funcione.

**La pregunta número 0 (la más importante de todas): ¿qué cambió?**
Si alguien tocó una config hace 40 minutos y el problema empezó hace 40 minutos... ahí está. El changelog mental (o el `show run` comparado con el backup) gana más troubleshooting que cualquier comando avanzado.

---

## 4. Los comandos show que resuelven TODO

### 4.1. La tríada base (para cualquier sospecha)

```text
show ip interface brief   ← ¿interfaces activas? ¿IPs? (¿algo está "administratively down"?)
show ip route             ← ¿existe la ruta? ¿por qué protocolo? ¿con qué métrica?
show running-config       ← ¿qué está configurado REALMENTE? (el que "se ve" en memoria)
```

### 4.2. La lectura experta de `show ip route` (la selección de rutas aplicada)

```text
R1# show ip route 10.1.1.0
Routing entry for 10.1.1.0/24
  Known via "ospf 1", distance 110, metric 20   ← AD y métrica: ¿es la ruta que esperabas?
  Last update from 10.0.0.2 on GigabitEthernet0/1
  * 10.0.0.2, from 10.0.0.2, via GigabitEthernet0/1  ← next-hop y salida
```

| Campo | Qué te dice | Si es raro |
|-------|------------|------------|
| `Known via` | Protocolo que la instaló | ¿EIGRP donde esperabas OSPF? Alguien redistribuyó |
| `distance` | AD (selección de rutas) | AD 200 iBGP para una ruta interna = sospechoso |
| `metric` | Costo/camino | ¿Metric 20 fija en vez de la suma? Ruta redistribuida E2 |
| `Last update` | De dónde vino el anuncio | ¿Un vecino que no esperabas? |
| `*` | Ruta activa (usable) | Sin `*` = ruta presente pero NO en uso |

---

## 5. Troubleshooting por protocolo

### 5.1. OSPF (conceptos y avanzado)

```text
show ip ospf neighbor     ← ¿el vecino está FULL/2WAY? (no FULL = problema)
show ip ospf interface    ← ¿área correcta? ¿cost? ¿está en el proceso?
show ip ospf database     ← ¿están llegando los LSA? (LSDB = la salud del área)
```

| Síntoma | Causa clásica | Fix |
|---------|---------------|-----|
| Vecino en EXSTART/EXCHANGE | MTU distinto entre vecinos | Igualar MTU (o eliminar el mismatch) |
| Vecino pegado en estado "DOWN/ATTEMPT" | Hello/Dead timers distintos, o área distinta | Verificar `ip ospf hello-interval` / `area` |
| Vecino que aparece y desaparece (flapping) | Interfaz inestable o red de broadcast con máscaras distintas | Revisar física + wildcard/máscara |
| Ruta con AD 110 pero "no se instala" | AD/métrica peor que la de otro protocolo (selección de rutas) | Verificar TODA la tabla, no solo OSPF |

### 5.2. EIGRP

```text
show ip eigrp neighbors         ← ¿el vecino existe? (tabla de vecinos = tabla de salud)
show ip eigrp topology          ← ¿hay sucesor? ¿feasible successor? ¿rutas en "passive"?
show ip eigrp interfaces        ← ¿qué interfaces están DENTRO del proceso?
```

| Síntoma | Causa clásica | Fix |
|---------|---------------|-----|
| Sin vecinos | K-values distintos, o `passive-interface` mal puesta, o ASN distinto | Comparar `router eigrp N` y K-values en `show ip protocols` |
| Ruta en estado "Active" que no converge | Cambio de topología; DUAL esperando respuestas | Esperar (o revisar vecinos para saber quién no responde) |
| Ruta EIGRP v6 sin instalar | ¡El AF quedó en `shutdown`! (la trampa de EIGRPv6) | `address-family ipv6 → no shutdown` |
| AD 90 cuando esperabas 110 | Redistribución de OSPF a EIGRP (tema de redistribución) | Rastrear el redistribute con `show ip protocols` |

### 5.3. BGP

```text
show ip bgp summary       ← ¿ESTABLISHED? ¿cuántos prefijos recibí? (2 columnas = TODO)
show ip bgp neighbors X   ← ¿timer? ¿últimos errores? ¿capabilities?
show ip bgp <prefijo>     ← ¿los atributos son los esperados? (LocalPref, AS-Path, MED)
```

| Síntoma | Causa clásica | Fix |
|---------|---------------|-----|
| Vecino en "Active" eterno | TCP 179 bloqueado, o ASN mal, o IP de sesión inalcanzable | `show ip bgp neighbors` + ping al peer + revisar ACL/firewall |
| ESTABLISHED con **0 prefijos** | `network ... mask` de un prefijo que NO está en la tabla (la regla de BGP) | Verificar que el prefijo exista en `show ip route` |
| iBGP sin rutas | Falta full mesh o `next-hop-self` (regla de BGP) | Configurar el next-hop-self en los bordes |
| AS-Path raro en rutas recibidas | Redistribución masiva o filtros mal puestos (tema de redistribución) | Revisar route-maps `in`/`out` del vecino |

---

## 6. El caso real resuelto: de "no hay internet" a la causa raíz

### 6.1. El reporte

> "Desde las 10:40, nadie en la oficina puede navegar. La red interna anda: los archivos compartidos abren, el ping al servidor de archivos funciona. Solo falla lo que sale a Internet."

### 6.2. Aplicando la metodología (miralo conmigo paso a paso)

```text
PASO 1 — Acotar: 
   "lo interno anda" → el problema está en la FRONTERA (o en la ruta por defecto, o en BGP).
   ¿Qué cambió a las 10:40? → "Se tocó la config del router de borde esta mañana".

PASO 2 — Capa: los usuarios internos funcionan entre sí → enlace e IP internos OK.
   Subo a la capa de red y a la frontera.

PASO 3 — Hipótesis (en orden):
   H1: Se cayó la ruta por defecto (más probable: tocaron el borde).
   H2: La sesión BGP con el ISP se cayó.
   H3: Algún filtro/ACL nuevo corta la salida.

PASO 4 — Verificación en orden:

R-borde# show ip route 0.0.0.0
% Network not in table                    ← ¡H1 CONFIRMADA! No hay default route.
                  (la hipótesis 2 queda para revisar DESPUÉS: sin default,
                   no importa si BGP está bien)

[investigación de causa raíz — no arreglar el síntoma:]
R-borde# show run | section router bgp
router bgp 65001
 neighbor 198.51.100.2 remote-as 65002
R-borde# show run | include default
                                 ← nada. ¿Dónde está la default route?

[`show run` completo al borde muestra:]
ip route 0.0.0.0 0.0.0.0 198.51.100.1
            └── ¡el next-hop de la estática apunta a una IP que ya no existe!
                El cambio de esta mañana: se reemplazó el router del ISP
                y con él su direccionamiento. La estática quedó apuntando al vacío.

PASO 5 — Fix y verificación:
R-borde(config)# ip route 0.0.0.0 0.0.0.0 203.0.113.1   ← el nuevo peer del ISP
R-borde# show ip route 0.0.0.0
S*   0.0.0.0/0 [1/0] via 203.0.113.1      ← default OK
R-borde# ping 8.8.8.8                     ← y el usuario ya navega.
```

> **Las dos lecciones del caso:** (1) el `show ip route` a la red sospechosa respondió ANTES de tocar nada — la hipótesis más barata primero; (2) el fix NO fue "recrear la estática a ciegas": fue encontrar POR QUÉ quedó apuntando a una IP muerta (el cambio de esta mañana). Si hubieras recreado la estática con la misma IP vieja, el problema volvía a los 5 minutos. **Causa raíz, no parche.**

---

## 7. Los 10 síntomas clásicos y su causa

```text
SÍNTOMA                                      CAUSA MÁS PROBABLE (en orden)
────────────────────────────────────────────────────────────────────────
1.  "No tengo internet"                       Ruta por defecto ausente/rota (caso 6)
2.  "Una sola red no responde"                Falta ruta específica o enlace caído
3.  "Va por caminos raros"                    AD/métrica con ruta rival (selección de rutas)
4.  "La VPN no sube"                          TCP/UDP de la VPN bloqueado (o ruta de retorno)
5.  "OSPF no levanta"                         Timers/área/MTU distinto (sección 5.1)
6.  "EIGRP sin vecinos"                       K-values/passive-interface/ASN (sección 5.2)
7.  "BGP Active eterno"                       TCP 179/ASN/IP de sesión (sección 5.3)
8.  "Rutas que van y vienen"                  Feedback loop de redistribución (tema de redistribución)
9.  "Funciona RARO": lentísimo pero ping ok   Métrica E2 fija, o enlace saturándose (o MTU)
10. "Andaba y se rompió solo"                  Alguien tocó algo — encontrá QUIÉN (pregunta 0)
```

---

## 8. Herramientas: ping, traceroute y la lectura de sus misterios

### 8.1. ping — la lectura fina de las respuestas

```text
Éxito RÁPIDO y estable  → ruta de ida y vuelta OK
Éxito LENTO             → latencia alta: ¿enlace saturado? ¿MQ? ¿recorrido largo? (traceroute)
!!!.!!!.!!!.            → paquetes que se PIERDEN intermitentemente (¿congestión? ¿duplex?)
.UUUUU                  → destino inalcanzable en la RUTA (ruteo de ida o vuelta)
U = destination unreachable — "alguien en el medio sabe que no hay camino"
```


### 8.2. traceroute — la escalera hacia el problema

```text
R1# traceroute 8.8.8.8
 1  10.0.0.2       1 ms    1 ms    1 ms     ← salto 1 OK
 2  203.0.113.1    2 ms    1 ms    2 ms     ← salto 2 OK
 3  * * *                                    ← salto 3: no responde (o lo ICMP-cortan)
 4  8.8.8.8        5 ms    4 ms    5 ms     ← ¡no! siguió viajando OK

▶ "¿Dónde se corta la escalera?": el salto donde * * * se vuelve permanente es
  LA FRONTERA del problema:
   - Si el propio destino sale con * * * pero es alcanzable → filtra ICMP (normal).
   - Si se corta en un salto intermedio y NO hay más saltos → el problema está ahí
     (o en el retorno de ese salto).
   - Si responde con "!H" (host unreachable) en el salto 3 → el ROUTER 3 dice
     "yo no sé llegar": problema de RUTEO en ese router... en el camino de IDA.
```

> **HACELO VOS (la lectura final):** `ping` te dice EL QUÉ (hay/no hay camino). `traceroute` te dice EL DÓNDE (en qué salto se corta). `show ip route` te dice EL POR QUÉ (qué regla manda el tráfico). Los tres juntos, en ese orden, convierten "no anda" en "el router X no tiene ruta de retorno hacia Y" — que ya es una causa, no un misterio.

---

## 9. Comprobá lo que aprendiste

**1. ¿Cuál es el error número uno del troubleshooting?**
<details>
<summary>Ver respuesta</summary>

Tirar comandos al azar sin método. El profesional reduce el espacio de búsqueda: reproduce, acota, formula hipótesis y las verifica con evidencia — nunca toca configuración antes de tener una hipótesis con comando de confirmación.
</details>

**2. ¿Cuál es la pregunta número 0 y por qué gana casi siempre?**
<details>
<summary>Ver respuesta</summary>

"¿Qué cambió?" La mayoría de los incidentes empiezan cuando alguien tocó algo (config, IP, router nuevo). Encontrar el cambio = encontrar el problema; el `show run` comparado con el backup lo expone.
</details>

**3. Ordená los 7 lugares donde puede estar un problema de routing.**
<details>
<summary>Ver respuesta</summary>

1) Interfaz prendida + IP → 2) Enlace up/up sin errores → 3) ¿Tengo la ruta? → 4) ¿Es la ruta correcta (AD/métrica)? → 5) ¿El next-hop es alcanzable? → 6) ¿El protocolo/vecino está sano? → 7) ¿Hay filtros/política? Nunca saltearse los primeros.
</details>

**4. En `show ip route`, ¿qué indica una ruta SIN el asterisco (`*`)?**
<details>
<summary>Ver respuesta</summary>

Que existe en la tabla pero NO está activa/en uso (otra ruta la está ganando por AD o métrica — tema de selección de rutas). Ver la ruta no alcanza: hay que ver cuál gana.
</details>

**5. BGP en "Active" eterno: ¿cuáles son las 3 causas más probables, en orden?**
<details>
<summary>Ver respuesta</summary>

1) TCP 179 bloqueado por ACL/firewall; 2) ASN mal en `remote-as` (no coincide con el del vecino); 3) IP de la sesión inalcanzable. Verificación: `show ip bgp neighbors` + ping al peer + revisar filtros.
</details>

**6. En el caso real del manual, ¿por qué recrear la default route a la IP vieja era el parche equivocado?**
<details>
<summary>Ver respuesta</summary>

Porque la causa raíz era el cambio del router del ISP (direccionamiento nuevo). Recrear la estática a la IP vieja arreglaba el síntoma 5 minutos... hasta darse cuenta de que esa IP ya no existe. Causa raíz, no parche.
</details>

**7. ¿Qué significan en ping `U`, `!` y `*`?**
<details>
<summary>Ver respuesta</summary>

`!` = respuesta (reached/time); `U` = destination unreachable (alguien en la ruta sabe que no hay camino — problema de ruteo en el medio); `*` = timeout (sin respuesta: se perdió o lo cortan). `U` persistente = ruteo; `*` persistente = firewall/filtro o enlace caído.
</details>

**8. ¿Por qué primero `ping` y después `show ip route`?**
<details>
<summary>Ver respuesta</summary>

El `ping` te dice el QUÉ (¿hay camino o no?) en una prueba de caja negra; el `show ip route` te dice el POR QUÉ (qué regla rutea o no rutea al destino). Diagnóstico en capas: primero el hecho, después la causa.
</details>

---

## 10. Glosario

| Término | Qué es |
|---------|--------|
| **Troubleshooting** | Diagnóstico sistemático de fallas: reproducir, hipótesis, verificar con evidencia, arreglar y confirmar |
| **Causa raíz** | El motivo ORIGINAL del fallo (no el síntoma): arreglarla evita que reaparezca |
| **Síntoma** | Lo que el usuario percibe ("no hay internet") — el diagnóstico lo conecta con causa y efecto |
| **Show ip route** | La tabla de rutas: protocolo, AD, métrica, next-hop, activa (`*`) |
| **Show ip protocols** | Qué protocolos corren, con qué proceso, K-values/áreas y qué interfaces |
| **Pregunta 0** | "¿Qué cambió?" — la pregunta que gana la mayoría de los incidentes |
| **`U` / `!` / `*`** | Unreachable (ruteo) / respuesta / timeout (filtro o pérdida) |
| **Traceroute** | La escalera de saltos: localiza la frontera donde el camino se corta |

---

## 11. Resumen en 10 puntos

1. **Método antes que comandos**: reproducir → acotar → capa → hipótesis → evidencia → fix → verificación.
2. **La pregunta 0 manda**: "¿qué cambió?" — 90% de los incidentes tienen dueño humano reciente.
3. **El árbol de 7 preguntas en orden**: interfaz → enlace → ruta existe → ruta correcta → next-hop → protocolo → filtros. Sin saltos.
4. **La tríada base**: `show ip interface brief`, `show ip route`, `show running-config`.
5. **`show ip route` se lee fino**: AD y métrica explican el POR QUÉ; el `*` dice si está en uso.
6. **OSPF**: vecinos FULL, timers/área/MTU, LSDB — la salud está en `show ip ospf neighbor`.
7. **EIGRP**: vecinos, sucesor/FS, K-values, passive-interface — y el AF en shutdown (v6).
8. **BGP**: ESTABLISHED con prefijos; "ESTABLISHED con 0" = `network` del prefijo que no está en la tabla.
9. **Las rutas que van y vienen** = feedback loop de redistribución (tema de redistribución), siempre.
10. **Causa raíz, no parche**: si el fix no explica por qué se rompió, el problema va a volver. El diagnóstico termina con evidencia, no con esperanza.

---

> **Fuente:** Documentación propia basada en CCNA 200-301 Official Cert Guide (W. Odom), Cisco IOS Troubleshooting Guide, RFC 792 (ICMP), RFC 2151 (ping/traceroute utilities) y material educativo de redes.
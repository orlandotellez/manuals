# 45. Laboratorios Integradores y Proyecto Final

**Todo lo que aprendiste, en una red que funciona — el examen final de la serie es PRÁCTICO**

---

## Índice

- [La meta final: integrar toda la serie](#1-la-meta-final-integrar-toda-la-serie)
- [Reglas del laboratorio](#2-reglas-del-laboratorio)
- [Lab 1 — Repaso: estáticas, floating y balanceo](#3-lab-1--repaso-estáticas-floating-y-balanceo)
- [Lab 2 — OSPF multiárea con DR/BDR y sumarización](#4-lab-2--ospf-multiárea-con-drbdr-y-sumarización)
- [Lab 3 — EIGRP con variance y EIGRPv6](#5-lab-3--eigrp-con-variance-y-eigrpv6)
- [Lab 4 — BGP: eBGP + iBGP con next-hop-self](#6-lab-4--bgp-ebgp--ibgp-con-next-hop-self)
- [PROYECTO FINAL — La red integral](#7-proyecto-final--la-red-integral)
- [La matriz de auto-evaluación](#8-la-matriz-de-auto-evaluación)
- [Comprobá lo que aprendiste](#9-comprobá-lo-que-aprendiste)
- [Glosario](#10-glosario)
- [Resumen en 10 puntos](#11-resumen-en-10-puntos)

---

## 1. La meta final: integrar toda la serie

Este es el último manual de "Redes de Datos II" — y el cierre no es un resumen de teoría: es **práctica integradora**. Toda la serie te dio las piezas; acá las armamos TODAS juntas en una red que sirve para algo real.

> **La filosofía de este manual:** NO hay teoría nueva. Miralo como el examen práctico de la serie: cada lab te pide que construyas algo que ya conocés, con la diferencia de que al final todo convive en la misma red. Si podés armar el Proyecto Final completo y defenderlo, te llevás la serie entera adentro.

### Por qué el examen es práctico y no un cuestionario

Un cuestionario te pregunta si sabés que OSPF usa costo. Un laboratorio te obliga a decidir **qué interfaz va en qué área**, a mirar una tabla de rutas y a darte cuenta de que falta un `no shutdown`. Son dos habilidades distintas: la primera se aprueba leyendo, la segunda solo se aprueba equivocándose y arreglando.

Por eso estos cuatro labs van en orden de dificultad y el proyecto final los junta: cada uno te pide lo mismo que ya hiciste en su manual, pero con algo nuevo alrededor. Lab 1 es rutas estáticas con dos salidas; Lab 2 es OSPF con áreas; Lab 3 es EIGRP con balanceo desigual; Lab 4 es BGP con dos vecinos. El proyecto final pone los cuatro protocolos en la misma red y agrega el paso que más rompe en la vida real: la redistribución.

**El mapa mental de la serie (miralo antes de cada lab):**

```text
Rutas estáticas y selección de rutas → AD, ECMP, floating static = la FUNDACIÓN
Enrutamiento dinámico · RIP → el DV que te enseña la métrica = la TRANSICIÓN
OSPF (v2 y v3) → LS, áreas, DR/BDR, LSA, v6 = el INTERIOR serio
EIGRP e IS-IS → los "otros" IGPs = el PANORAMA completo
BGP → eBGP/iBGP, atributos = la FRONTERA
Redistribución → route-maps = el PEGAMENTO
Troubleshooting → el MÉTODO
Este manual → labs + proyecto final = TÚ, armándolo todo
```

### Cómo leer ese mapa

Cada línea es un manual de la serie y, a la derecha, lo que te llevás de él. Empezá por abajo: la primera línea dice que las rutas estáticas son la fundación porque **todo lo demás se apoya en la tabla de rutas**, incluso cuando la llenan los protocolos. La segunda te da el vocabulario (métrica, distancia administrativa, convergencia) que después usás en todas las demás. La tercera y la cuarta son el interior de una red: OSPF y los otros protocolos que hablan entre routers de la misma organización. La quinta es la frontera: lo que se negocia con el proveedor. La sexta es el pegamento entre protocolos distintos, y la séptima es el método para cuando algo no funciona. La última línea sos vos, con todo eso junto.

### La única trampa de este manual

Es la misma de todos los laboratorios: **hacer que el ping responda no es aprobar**. Un lab está terminado cuando podés explicar por qué funciona: por qué esa ruta ganó, por qué ese vecino quedó en FULL, por qué la redistribución no genera bucles. Si el ping responde y no sabés por qué, tenés una red que funciona por casualidad, y la casualidad no sobrevive a un cambio de topología.

### Resumen

- Este manual no introduce teoría: hace practicar todo lo anterior en una sola red.
- El orden de los labs va de lo simple a lo integrado: estáticas → OSPF → EIGRP → BGP → proyecto final.
- El mapa de la serie sirve como índice mental: cada línea es un manual y lo que aporta.
- La meta no es que el ping responda, sino poder explicar por qué la red anda.

---

## 2. Reglas del laboratorio

Antes de tocar un router, estas reglas te ahorran horas (son las del mundo real):

1. **Todo en Packet Tracer** (tenés de referencia el tema de Packet Tracer de la serie de redes) o en tu simulador favorito (GNS3/EVE-NG si tenés imágenes reales).
2. **Nomenclatura estricta**: nombres de host, IPs y descripciones con formato consistente (ej. `Sucursal-A`, descripciones en las interfaces). Un lab sin nombres es un lab imposible de debuggear.
3. **Verificá en cada paso**: después de CADA bloque de configuración, un `show` que confirme lo que acabás de hacer (no al final: al final es tarde).
4. **Redistribución SIEMPRE con filtro** (tema de redistribución): si no hay route-map, no hay redistribución.
5. **Cambiá una cosa a la vez** (tema de troubleshooting): cuando algo no funcione, el culpable es el último cambio.

### Por qué cada regla existe

**La 1 (simulador)**: un simulador te deja romper todo y volver atrás en segundos. Con equipos reales, cada error cuesta un cable, una consola y a veces un viaje. Practicá donde equivocarte sea gratis.

**La 2 (nombres)**: cuando tenés seis routers y veinte interfaces, `GigabitEthernet0/1` no te dice nada pero `hacia ISP` sí. La descripción en la interfaz es la documentación que leés justo cuando estás apurado y algo no funciona.

**La 3 (verificar por paso)**: si configurás veinte líneas y después verificás, y algo falla, tenés veinte sospechosos. Si verificás después de cada bloque, tenés uno. Es la misma idea que el orden de armado del proyecto final: acotar el error.

**La 4 (filtro en la redistribución)**: redistribuir sin filtrar es la receta del bucle de rutas. Un protocolo le cuenta al otro lo que aprendió del otro, y la ruta vuelve con otra distancia administrativa, y vuelve, y vuelve. El route-map es el que dice "esto sí, esto no".

**La 5 (un cambio a la vez)**: es la regla más ignorada y la más útil. Si cambiás dos cosas y funciona, no sabés cuál de las dos lo arregló; si no funciona, no sabés cuál lo rompió. De a una, siempre.

> **HACELO VOS (la regla invisible):** el lab no se entrega cuando "anda": se entrega cuando PODÉS EXPLICAR por qué anda. Si te preguntan "¿por qué esta ruta tiene AD 110?" y no sabés responderlo, el lab está a medias por más que el ping responda.

### Resumen

- Usá un simulador para poder romper sin costo.
- Nombrá hosts e interfaces: es la documentación que leés cuando algo falla.
- Verificá con un `show` después de cada bloque, no al final.
- Redistribuir exige filtro, y cada cambio se hace de a uno.
- El lab se aprueba explicándolo, no solo viendo que el ping responde.

---

## 3. Lab 1 — Repaso: estáticas, floating y balanceo

**Objetivo:** rearmar rutas estáticas y selección de rutas en un escenario de doble salida.

### Qué vas a construir y por qué

Una red con dos salidas hacia "proveedores" distintos. En la vida real eso se hace para tener respaldo: si el enlace principal se cae, el secundario toma. El truco es que el router no elige la ruta "más linda": elige según **distancia administrativa (AD)**, un número que dice cuánto confía en la fuente de esa ruta. Cuanto más chico, más confianza. Y cuando dos rutas tienen la misma AD y la misma métrica, en vez de elegir una, reparte: eso es ECMP (balanceo de costo igual).

En este lab vas a tener las dos cosas al mismo tiempo: una ruta de respaldo que espera dormida (floating static) y un balanceo real entre dos caminos equivalentes.

### 3.1. Topología

```text
                      192.168.10.0/24 (LAN)
                          │
                     ┌────┴────┐
                     │   R1    │
                     └────┬────┘
              (enlace A)  │  (enlace B)
                10.0.0.0/30│  10.0.1.0/30
                     ┌─────┴──┐─────┐
                     │   R2    │   R3    (dos "proveedores")
                     └────────┘   └────┘
```

### Cómo se lee el dibujo

Arriba está la LAN que hay que alcanzar (`192.168.10.0/24`), colgada de R1. Abajo, R1 tiene dos caminos hacia afuera: el enlace A (red `10.0.0.0/30`) que lleva a R2, y el enlace B (red `10.0.1.0/30`) que lleva a R3. R2 y R3 hacen de proveedores: son los que "salen a Internet". Los `/30` son las típicas redes de enlace punto a punto: dos direcciones usables, justo las que necesitan dos routers.

### 3.2. Consignas

1. En R1, ruta por defecto por el enlace A (R2), **administrative distance 5**.
2. La MISMA default por el enlace B (R3) pero con **AD 10** → floating static (tema de rutas estáticas): R3 solo se usa si R2 cae.
3. A la red 192.168.10.0/24, ECMP: **dos estáticas con la misma AD y métrica** (balanceo, tema de selección de rutas).
4. Verificá con `show ip route` que las tres (default + ECMP) coexisten y que `sh ip route 0.0.0.0` muestra la lista de candidatas con `[5/0]` y `[10/0]`.
5. **Prueba de fuego:** apagá la interfaz hacia R2 (`shutdown`) y verificá que la default migra sola a R3 (AD 10) y vuelve cuando R2 reaparece.

### Qué significa cada consigna

La consigna 1 pone una ruta por defecto (destino `0.0.0.0/0`, el "todo lo demás") con AD 5. La 2 pone la misma ruta por el otro enlace con AD 10: como 5 es menor que 10, la primera gana y la segunda **no aparece activa** en la tabla de rutas, pero queda como candidata. Eso es una floating static: una ruta que flota por debajo y sube cuando la de arriba desaparece.

La 3 es lo contrario: dos rutas con **la misma** AD y la misma métrica hacia la misma red. Ahí el router no puede desempatar, así que instala las dos y reparte el tráfico. Ojo con la diferencia: en la 1 y 2 desempatás con AD; en la 3 empatás a propósito para balancear.

La 4 y la 5 son verificación, y son la mitad del lab: primero mirás la tabla, después rompés algo a propósito para ver si la red reacciona como esperabas. Ese `shutdown` es el que convierte la configuración en conocimiento.

**Verificación esperada (R1):**

```text
S*   0.0.0.0/0 [5/0] via 10.0.0.2                    ← la que gana (AD 5)
                 [10/0] via 10.0.1.2                 ← la de respaldo (AD 10)
S    192.168.10.0/24 [1/0] via 10.0.0.2
                     [1/0] via 10.0.1.2              ← ECMP: dos caminos, misma AD
```

### Cómo se lee esta salida

`S` es el código de una ruta estática (static). El `*` marca la ruta que el router está usando de verdad para reenviar: es la "candidate default" que ganó. Los corchetes traen `[distancia administrativa/métrica]`, así que `[5/0]` se lee "confianza 5, costo 0" — las estáticas tienen métrica 0 porque no se calculan, se declaran. El `via 10.0.0.2` es el **next hop**: la IP del vecino al que le paso el paquete.

En la segunda línea de la default, `[10/0] via 10.0.1.2` está sin `*`: el router la conoce y la tiene como respaldo, pero no la usa mientras la de AD 5 esté viva. Y abajo, la red `192.168.10.0/24` aparece con dos `via` y **la misma** `[1/0]`: eso es ECMP, dos caminos equivalentes por los que se reparte el tráfico.

Cuando apagues el enlace hacia R2, en la primera línea el `*` se va a mudar a la ruta `[10/0]`: eso es la conmutación de respaldo funcionando.

### Resumen

- La distancia administrativa decide en quién confiar; menor gana.
- Una floating static es una ruta de respaldo con AD mayor: espera dormida hasta que la principal cae.
- ECMP es lo contrario: rutas con la misma AD y métrica que se instalan todas y balancean.
- `[AD/métrica]` y el `*` de `show ip route` son las dos cosas que hay que saber leer.
- El `shutdown` de la prueba de fuego es la verificación de verdad: romper para ver si reacciona.

---

## 4. Lab 2 — OSPF multiárea con DR/BDR y sumarización

**Objetivo:** rearmar OSPF (single-area y avanzado) con áreas y un toque de diseño.

### Qué vas a construir y por qué

Una red de cinco routers donde el "centro" (área 0) es el backbone y hay una sucursal colgada en el área 1. OSPF no es un protocolo que reparte chismes de distancia: es un protocolo donde **todos los routers del área terminan con el mismo mapa** y cada uno calcula su mejor camino sobre ese mapa. Cuando la red crece, un mapa único para todos se vuelve caro de recalcular, y por eso se parte en **áreas**: adentro de un área todos tienen el mapa completo; entre áreas, los routers de borde (ABR) resumen la información.

Además vas a ver dos mecanismos que solo aparecen en medios compartidos: el **DR/BDR** (un router que habla en nombre de todos los del segmento, para no armar una malla de vecinos) y la **sumarización** (anunciar un bloque en vez de cien redes).

### 4.1. Topología

```text
               ÁREA 0 (backbone)                ÁREA 1
   R1 ─── R2 ─── R3 ─── R4 ─── R5
        (loopbacks: 1.1.1.1, 2.2.2.2, 3.3.3.3, 4.4.4.4, 5.5.5.5)
   R2 y R4 en el backbone; R5 (y su LAN 172.16.0.0/16) en área 1
```

### Cómo se lee el dibujo

La cadena R1–R2–R3–R4–R5 está separada por una raya invisible: a la izquierda, el área 0; a la derecha, el área 1. Los routers que están **en el borde** de esa raya son R2 y R4: uno u otro es el ABR, el que tiene una pata en cada área y traduce entre ellas. Cada router tiene una loopback con su número (1.1.1.1 para R1, y así), que se usa como identificador estable: no se cae aunque se caiga un cable. R5 tiene colgada la LAN grande `172.16.0.0/16`, que es la que después se resume.

### 4.2. Consignas

1. OSPF proceso 1 con `router-id` explícito en CADA router (1.1.1.1 → 5.5.5.5).
2. R2 y R4 son ABR (área 0 + área 1): las reds de área 1 viven detrás de R5.
3. **Sumarización en el ABR** (OSPF avanzado): R4 anuncia a área 0 un resumen `area 1 range 172.16.0.0 255.255.0.0` si R5 tiene la /16 particionada.
4. Verificá **DR/BDR** en el segmento compartido del backbone: `show ip ospf neighbor` debe mostrar `FULL/DR` y `FULL/BDR` (en OSPF, primero arranca el de mayor RID).
5. Confirmá en `show ip ospf database` que los **LSA tipo 3** (sumarios) entran a área 0 y los tipo 1 solo viven en su área.

### Qué significa cada consigna

El `router-id` explícito es la primera buena práctica: si no lo ponés, OSPF elige uno solo (la IP más alta de una loopback o de una interfaz activa) y cuando esa interfaz cambia, el router cambia de identidad y las adyacencias se caen. Ponerlo a mano te da estabilidad y control.

La 2 y la 3 son el diseño: el área 1 tiene redes detrás de R5, y en vez de anunciar cada subred, el ABR anuncia un solo bloque. Sumarizar es un acto de confianza: si el resumen dice `172.16.0.0/16` pero adentro hay redes que no existen, los paquetes hacia esas redes se pierden silenciosamente. Por eso se resume solo cuando el bloque está completo.

La 4 es la trampa clásica del laboratorio: en un segmento compartido, todos los routers no se hacen vecinos entre sí: eligen un **DR** (designated router) y un **BDR** de respaldo, y todos hablan con ellos. La elección no se hace "por votos": gana la prioridad de interfaz más alta y, si empatan, el router-id más alto. Y no es preemptiva: el que ganó sigue siendo DR hasta que se caiga o reinicie.

La 5 es la prueba de que entendiste el modelo: los LSA tipo 1 (router) no salen de su área; los tipo 3 (summary) son los que el ABR fabrica para contar lo de un área dentro de la otra. Si ves un tipo 1 cruzando un área, algo está mal configurado.

**Pregunta de cierre del lab:** si R3 tiene AD 110 y EIGRP le inyecta la misma ruta con AD 90... ¿quién gana y qué dice `show ip route`? (Respuesta: EIGRP, y la ves como `D` — tema de selección de rutas.)

### Por qué la respuesta es EIGRP

Porque cuando dos protocolos distintos te ofrecen la misma red, el router no compara métricas (no se pueden comparar peras con manzanas): compara **distancia administrativa**. OSPF vale 110 y EIGRP 90, así que gana EIGRP. En `show ip route` la vas a ver con el código `D` (de EIGRP) y no con `O` (de OSPF). Si querés que gane OSPF, hay que cambiar la AD a mano — y eso es exactamente lo que se hace cuando se quiere forzar un camino.

### Resumen

- OSPF reparte un mapa dentro de cada área; el ABR es el que traduce entre áreas.
- El `router-id` explícito evita que el router cambie de identidad y se caigan las adyacencias.
- En un segmento compartido manda el DR/BDR: prioridad primero, router-id después, y no hay reelección.
- Los LSA tipo 1 viven en su área; los tipo 3 son los resúmenes que cruzan.
- Entre protocolos distintos gana la menor distancia administrativa, no la mejor métrica.

---

## 5. Lab 3 — EIGRP con variance y EIGRPv6

**Objetivo:** rearmar EIGRP con los dos trucos que diferencian al que sabe: variance y el IPv6.

### Qué vas a construir y por qué

Dos routers unidos por **dos enlaces de distinta velocidad**. EIGRP va a elegir el rápido como camino principal, como corresponde. La gracia del lab es hacer que use **los dos a la vez, en proporción a su velocidad**: eso se llama balanceo desigual y se activa con una sola palabra, `variance`.

Pero hay una condición que casi nadie recuerda y es la que hace que este lab valga la pena: para que EIGRP acepte el camino lento como alternativa, ese camino tiene que ser un **feasible successor**, es decir, tiene que cumplir que su distancia reportada (RD) sea menor que la distancia factible (FD) del camino principal. Si no la cumple, podés subir `variance` todo lo que quieras: no entra. La condición existe para garantizar que el camino alternativo no pase por el propio router, o sea, que sea libre de bucles.

Después viene la parte de IPv6, donde la trampa es otra: el proceso de dirección de familia arranca apagado.

### 5.1. Topología (IPv4)

```text
           10.0.0.0/30 (rápido, 1 Gbps)      ← camino A
     R1 ─────────────────────────── R2
     └─────────────────────────────┘
           10.0.1.0/30 (lento, 100 Mbps)     ← camino B
   (R1 y R2 unidos por DOS enlaces: EIGRP 100)
```

### Cómo se lee el dibujo

Los dos routers están unidos por arriba con un enlace de 1 Gbps (camino A) y por abajo con uno de 100 Mbps (camino B). Son dos redes distintas (`10.0.0.0/30` y `10.0.1.0/30`), así que EIGRP aprende dos rutas hacia el otro router y tiene que decidir. La métrica de EIGRP combina ancho de banda y demora, así que el camino A va a tener una métrica mucho menor: ese va a ser el sucesor.

### 5.2. Consignas

1. EIGRP 100 con las dos interfaces en el proceso (uso **named mode** al configurar, como práctica del tema de EIGRP).
2. **Variance**: con el camino A como sucesor y el B como feasible successor, configurá `variance 4` y verificá que la tabla muestra AMBAS rutas con `*` (balanceo desigual — el truco de EIGRP).
3. Fijate la condición: variance solo funciona si el camino B cumple **RD < FD** del sucesor. Si no lo cumple, no entra (aunque subas variance; ese es el punto).
4. Verificá en `show ip eigrp topology` que el camino B figura como `via ... (` en la columna de las alternativas.

### Qué significa cada consigna

El **named mode** es la forma moderna de configurar EIGRP: en vez de `router eigrp 100` y después meter redes una por una, se define un proceso con nombre y dentro una dirección de familia. Es más verboso pero más claro, y es lo que se usa hoy.

La consigna 2 es el corazón: `variance 4` significa "aceptá como camino alternativo cualquier ruta cuya métrica sea hasta cuatro veces la del sucesor". Si el camino A tiene métrica 30.720 y el B está dentro de ese factor, EIGRP instala las dos. Ese número no se elige al azar: se calcula mirando la relación real entre las métricas de los dos caminos.

La 3 es la condición que se olvida. Aunque la métrica entre en el rango del `variance`, EIGRP primero pregunta "¿este vecino me está contando un camino que pasa por mí?". Eso lo sabe comparando la RD (lo que el vecino dice que le cuesta llegar) contra la FD propia. Si la RD es mayor o igual, el camino puede ser un bucle, y no lo usa.

La 4 es donde se ve la diferencia entre las dos tablas de EIGRP: la de **topología** guarda también los candidatos que no están en uso, y la de **rutas** solo lo que se instala. Si el camino B aparece en topología pero no en rutas, `variance` no lo aceptó.

### 5.3. Consigna de IPv6 (retando a EIGRP)

Configurá EIGRPv6 en un enlace con direcciones `2001:db8::/64` de ida y vuelta, y acordate de la **trampa**: el AF viene en `shutdown` por defecto. Verificá que sin `no shutdown` NO hay vecinos, y que con `no shutdown` aparecen.

### Por qué esa trampa existe

En EIGRPv6, el proceso de dirección de familia nace apagado a propósito: así no empieza a mandar hellos en una red que todavía no está configurada. El resultado práctico es que configurás todo, ves las interfaces bien, y no hay vecinos. La solución es una línea, pero la lección es más grande: cuando algo no levanta, revisá el estado del proceso antes de revisar el direccionamiento.

### Resumen

- EIGRP elige un camino y, si se lo pedís con `variance`, reparte el tráfico entre varios en proporción.
- El camino alternativo tiene que ser feasible successor: su RD debe ser menor que la FD del sucesor.
- La tabla de topología guarda candidatos; la de rutas, solo lo instalado.
- EIGRPv6 arranca en `shutdown`: sin `no shutdown` no hay vecinos, por más que el direccionamiento esté perfecto.

---

## 6. Lab 4 — BGP: eBGP + iBGP con next-hop-self

**Objetivo:** rearmar BGP con la topología clásica de examen.

### Qué vas a construir y por qué

Dos sistemas autónomos (AS) que se hablan: el tuyo, el 65001, y el del proveedor, el 65002. Adentro del tuyo hay dos routers que también tienen que compartir la información que aprendieron de afuera: eso es iBGP. Afuera, la sesión con el ISP es eBGP.

BGP es distinto de todo lo anterior: no elige el camino más rápido, elige el camino que **las políticas** permiten. Y tiene una regla que rompe a todos los principiantes: cuando un router aprende un prefijo por eBGP y se lo pasa a un vecino iBGP, **no le cambia el next-hop**. El vecino recibe la ruta apuntando a una IP que no conoce, y la ruta queda inutilizable aunque la sesión esté establecida. La solución tiene nombre: `next-hop-self`.

### 6.1. Topología

```text
   AS 65001 (tuyo)                         AS 65002 (ISP)
   R1 ─────── R2 ─────────────────────── R3 ─────── R4
   lo0 1.1.1.1  lo0 2.2.2.2  10.0.0.0/30   lo0 3.3.3.3   lo0 4.4.4.4
   ←─ iBGP ─→  (R1↔R2)   ←──── eBGP ────→  (R2↔R3)   (R3↔R4 en el ISP)
```

### Cómo se lee el dibujo

A la izquierda, tu AS 65001 con R1 y R2, unidos por iBGP. En el medio, R2 y R3 se hablan por eBGP sobre la red `10.0.0.0/30`: ese es el enlace entre tu red y la del proveedor. A la derecha, el ISP: R3 y R4 en el AS 65002. Las `lo0` son loopbacks, y acá importan por una razón concreta: las sesiones BGP se levantan **contra loopbacks**, no contra las IPs del enlace, para que no se caigan si el enlace físico se mueve por un camino alternativo.

### 6.2. Consignas

1. En R2: sesión **eBGP** con R3 (`remote-as 65002`) y sesión **iBGP** con R1 (`remote-as 65001`) sobre **loopbacks** con `update-source loopback 0`.
2. **next-hop-self** en R2 hacia R1 (BGP, regla 2): sin esto, R1 hereda el next-hop de R3 y no puede resolverlo.
3. En R1, verificá que recibe el prefijo del ISP y que su next-hop es **2.2.2.2** (R2), no el del ISP: `show ip bgp` debe decir `*>i ... via 2.2.2.2` con `i` (iBGP).
4. Para la parte eBGP de R2→R3: usá `ebgp-multihop 2` si la sesión vive en loopbacks — y fijate qué pasa si NO lo ponés (sesión que nunca levanta: BGP, error #4).
5. **Verificación final:** `show ip bgp summary` en R2 mostrando DOS vecinos ESTABLISHED (uno eBGP `65002` y uno iBGP `65001`).

### Qué significa cada consigna

El `update-source` resuelve un problema silencioso: si le decís a BGP "hablemos con la loopback del otro" pero no le decís "salí por mi loopback", BGP arranca la conexión desde la IP de la interfaz física, y el otro router lo rechaza porque el origen no coincide con lo configurado. La sesión queda en Active o Connect y no levanta nunca.

El `next-hop-self` es la consigna estrella: cuando R2 recibe el prefijo del ISP y se lo pasa a R1 por iBGP, por defecto le deja el next-hop original (una IP del ISP). R1 no tiene ruta hacia esa IP y descarta el prefijo. Con `next-hop-self`, R2 se anuncia a sí mismo como el que sabe llegar: `via 2.2.2.2`, que R1 sí conoce porque es su vecino iBGP.

El `ebgp-multihop` es lo mismo pero al revés: BGP asume que los vecinos eBGP están conectados directamente, y si los hacés hablar entre loopbacks hay routers en el medio. `ebgp-multihop 2` le dice "podés atravesar hasta dos saltos". Sin eso, la sesión queda intentando para siempre.

La verificación final es la foto del éxito: dos vecinos, dos números de AS distintos, ambos en ESTABLISHED, y prefijos aprendidos.

### Resumen

- eBGP une sistemas autónomos; iBGP reparte lo aprendido adentro del mismo AS.
- Las sesiones se levantan contra loopbacks y necesitan `update-source` para salir por ahí.
- Sin `next-hop-self`, el vecino iBGP recibe un next-hop que no puede resolver y descarta la ruta.
- Una sesión eBGP entre loopbacks necesita `ebgp-multihop`.
- `show ip bgp summary` con dos vecinos ESTABLISHED es la prueba de que el lab está completo.

---

## 7. PROYECTO FINAL — La red integral

**Este es el examen:** una sola topología que usa TODA la serie. La red de una empresa ficticia con dos sucursales, un núcleo EIGRP, un área OSPF en cada sucursal, un borde BGP hacia el ISP — y una redistribución que no rompe nada.

### Por qué este proyecto es el examen

Porque ya no hay una respuesta única. En los labs anteriores había un objetivo y un comando; acá tenés que decidir el direccionamiento, qué protocolo va en el núcleo y cuál en cada sucursal, cómo se hablan, y cómo se propaga la salida a Internet sin que ningún protocolo le cuente al otro algo que no debe. Cada decisión se puede defender o se puede lamentar, y eso es exactamente lo que se hace en un trabajo real.

### 7.1. Arquitectura del proyecto

```text
                                     INTERNET
                                        │
                                    [ISP R9]  (AS 65002)
                                        │ eBGP
                        ┌────────────── R6 (BORDER, AS 65001) ──────────────┐
                        │            │                                      │
                    [R5] (núcleo)  [R7] (núcleo)                       [R8] (backup)
                      │  EIGRP 100  │  EIGRP 100                           │ eBGP (respaldo)
                     OSPF area 0   OSPF area 0                             │
                      │                │                                   │
                  [R1]──[R2]        [R3]──[R4]                    (R8→ISP por 2° enlace)
                  Sucursal Norte    Sucursal Sur
                  10.10.0.0/16      10.20.0.0/16
                        (cada sucursal: OSPF el área 0 + sus áreas 1 si querés V2 empezar)
```

### Cómo se lee el dibujo

Arriba de todo está Internet, y el único camino hacia ella es el ISP (R9, AS 65002). Tu red se conecta por R6, el router de borde: ahí vive el eBGP y, hacia adentro, la ruta por defecto que hay que propagar a todos. Debajo de R6 está el núcleo, con R5 y R7 hablando EIGRP: ese es el transporte interno rápido, el que lleva el tráfico entre sucursales. Colgando del núcleo, cada sucursal tiene su propio OSPF: el norte (R1 y R2, con la red `10.10.0.0/16`) y el sur (R3 y R4, con `10.20.0.0/16`). Y a la derecha, R8 es el respaldo del borde: si R6 se cae, R8 tiene su propio enlace al ISP y toma la salida.

Las flechas son las relaciones, no los cables: "OSPF area 0" debajo de R5 y R7 significa que ahí viven las sesiones OSPF de la sucursal norte y sur respectivamente; "EIGRP 100" entre R5 y R7 es el núcleo; y los dos eBGP son las dos puertas a Internet.

### 7.2. Requerimientos (la lista de entrega)

| # | Requerimiento | Temas que evaluás |
|---|---------------|-------------------|
| 1 | **Direccionamiento**: plan VLSM con etiquetas por rol (loopbacks, enlaces, LANs) | Rutas estáticas, redistribución |
| 2 | **IGP interno**: EIGRP 100 en el núcleo (R5-R6-R7), cada sucursal con OSPF (el norte y el sur) | OSPF, EIGRP |
| 3 | **Redistribución**: OSPF ↔ EIGRP en R5 y R7, con route-map filtrando el retorno (¡nada de feedback loop!) | Redistribución |
| 4 | **BGP en el borde**: R6 = eBGP principal con el ISP (default route), R8 = backup | BGP |
| 5 | **Default route propagada** a toda la red: desde R6 hacia el EIGRP (y de ahí al OSPF) | Rutas estáticas, OSPF, EIGRP, redistribución |
| 6 | **Redundancia**: si R6 cae, R8 asume (floating o BGP); si el enlace del norte cae, el sur sigue sirviendo | Rutas estáticas, selección de rutas, BGP |
| 7 | **Verificación documentada** (matriz de la sección 8) | Troubleshooting |

### Cómo se lee la tabla

Cada fila es una cosa que el proyecto tiene que hacer y, a la derecha, qué manuales de la serie estás usando para lograrlo. Si una fila no te sale, la columna derecha te dice qué releer: no hace falta volver a empezar la serie, alcanza con el manual indicado.

La fila 1 es el cimiento: sin direccionamiento no hay nada. La 2 reparte el trabajo entre protocolos: EIGRP en el núcleo porque es rápido y simple de operar, OSPF en las sucursales porque es el que suele estar en los equipos. La 3 es donde vive el riesgo: los dos protocolos tienen que compartir información **sin devolverse lo que se prestaron**. La 4 y la 5 son la salida a Internet y su propagación. La 6 es la prueba de que la red aguanta una caída. La 7 no es un adorno: es la evidencia de que lo anterior funciona, y es lo único que se puede revisar después.

### 7.3. El plan de armado (el orden que te salva)

```text
FASE A — Capa física y direccionamiento: TODAS las IPs y loopbacks PRIMERO
        (sin IPs, nada de lo que sigue existe: es la pregunta 1 del tema de troubleshooting)
FASE B — IGP del núcleo: EIGRP 100 entre R5, R6, R7 (y las interfaces del núcleo)
FASE C — OSPF por sucursal: R1-R2 (norte) y R3-R4 (sur) en sus áreas
FASE D — Redistribución en R5 y R7: dos route-maps, uno por sentido, filtrado el retorno
FASE E — BGP en R6 (+R8 backup) y propagación de la default: EIGRP → OSPF
FASE F — Verificación integral (matriz de la sección 8) y regrabado de configs a .txt
```

> **HACELO VOS (el orden es parte del lab):** por QUÉ en ese orden — porque cada fase se verifica ANTES de construir la siguiente. Si armás BGP y después el IGP, cuando algo no funciona no sabés si es BGP, el IGP o la redistribución. En el orden de arriba, cuando llegás a F ya verificaste E, y cuando llegaste a E verificaste D... **el error queda acotado a la ÚLTIMA fase que tocaste** (troubleshooting en la práctica).

### Por qué este orden y no otro

Cada fase depende de la anterior: la B necesita las IPs de la A; la C necesita que el núcleo ya transporte; la D necesita dos IGPs funcionando para poder pegarlos; la E necesita la redistribución para que la default llegue a todos; la F necesita todo lo anterior. Si invertís el orden, no estás armando una red: estás adivinando cuál de cinco cosas está mal.

El otro motivo es psicológico: cuando algo falla después de un cambio, el culpable es el último cambio (regla 5 de las reglas del laboratorio). Un orden estricto te da un solo sospechoso por vez.

### 7.4. El resumen de config crítica (lo que tu proyecto TIENE que tener bien)

```text
! R6 (border) — el corazón del proyecto
router eigrp 100
 redistribute static metric 10000 100 255 1 1500      ! la default entra al EIGRP
 ! (la static es la default que BGP instaló — o directamente:
 redistribute bgp 65001 metric 10000 100 255 1 1500)  ! BGP ya instaló la default
router bgp 65001
 network 0.0.0.0 mask 0.0.0.0            ! opportunidad: ¡la default se anuncia a veces!
 neighbor 203.0.113.2 remote-as 65002    ! eBGP con el ISP
 neighbor 10.0.0.5 remote-as 65001
 neighbor 10.0.0.5 next-hop-self         ! iBGP a R5 (regla de BGP)

! R5 (redistributor OSPF↔EIGRP, con filtro de retorno — tema de redistribución)
access-list 15 permit 10.0.0.0 0.255.255.255
route-map RETORNO permit 10
 match ip address 15
router ospf 1
 redistribute eigrp 100 subnets route-map RETORNO metric 30
router eigrp 100
 redistribute ospf 1 metric 10000 100 255 1 1500
```

### Cómo se lee la configuración crítica

En R6, `redistribute static` (o `redistribute bgp`) es lo que mete la ruta por defecto que vino de Internet dentro del EIGRP: sin eso, el núcleo sabe llegar a Internet pero no se lo cuenta a nadie. La `metric 10000 100 255 1 1500` es obligatoria porque EIGRP no acepta rutas sin métrica: son los cinco valores por defecto que hay que inventar cuando la ruta viene de otro protocolo.

En BGP, `network 0.0.0.0 mask 0.0.0.0` (la "opportunidad" del comentario original) anuncia la default hacia el ISP solo cuando existe: es una decisión de diseño, no un requisito. Los `neighbor` son los dos vecinos: el del ISP con su `remote-as 65002` y el interno con `remote-as 65001` y `next-hop-self`, que ya sabés por qué está.

En R5 está el pegamento y el filtro. La `access-list 15` define qué se deja volver, y el `route-map RETORNO` lo aplica cuando el OSPF redistribuye hacia EIGRP. El sentido contrario (EIGRP → OSPF) redistribuye todo. Esa asimetría es la que corta el bucle: lo que vuelve está filtrado, así que la ruta no rebota.

### 7.5. La entrega

El proyecto se entrega con:

1. El archivo `.pkt` (o la topología exportada) **funcionando**.
2. Un documento con el plan de direccionamiento completo (tabla: red / VLSM / dispositivo / interfaz / IP).
3. Las **configuraciones guardadas** (una por router, en `.txt`, con nombres de host y descripciones).
4. La **matriz de verificación** (sección 8) con las salidas reales de cada prueba.
5. La **respuesta escrita** a la pregunta de oro: "¿por qué tu redistribución no genera bucles?" (si no la podés responder, el lab tiene un problema, no vos).

### Resumen

- El proyecto final junta los cuatro protocolos en una sola red y agrega la redistribución filtrada.
- El orden de armado es parte del examen: cada fase se verifica antes de empezar la siguiente.
- La config crítica son cuatro cosas: meter la default en el IGP, propagarla, peerear BGP y filtrar el retorno.
- Se entrega con evidencia: topología, plan de direccionamiento, configs y matriz de pruebas.
- La pregunta de oro es por qué no hay bucles; si no la podés responder, el diseño está flojo.

---

## 8. La matriz de auto-evaluación

Corré ESTAS pruebas en tu proyecto final y marcá cada una ✅ (con la salida real pegada):

```text
PRUEBA                                          COMANDO                     ESPERADO
──────────────────────────────────────────────────────────────────────────────────────
1. Todas las interfaces up/up con IP            show ip interface brief      Ninguna "administratively down"
2. El núcleo ve toda la red                     show ip route | include D    rutas D (EIGRP) a TODO
3. El norte rutea al sur                        ping 10.20.0.1 (desde R1)    !!!!! éxito
4. La sucursal sur ve el norte por EIGRP        show ip route                ruta D + O E1 (redistribuída)
5. ESPICA: rutas externas E1 / D / B cohexisten show ip route                tres códigos visibles luego de los IGPs
6. Desde una LAN salís a Internet               ping 8.8.8.8 (desde R1)      !!!!!
7. Redundancia: apagás R6 → internet sigue      shutdown en R6               por R8 (floating/backup) ✔
8. Sin feedback loop: la ruta no late           show ip route <red> 2 veces  IDÉNTICA (sin flapping)
9. BGP: vecinos ESTABLISHED con prefijos        show ip bgp summary          2 vecinos, prefijos > 0
10. El método de troubleshooting documentado    (escrito en la entrega)      cada falla: hipótesis → evidencia
```

### Cómo se lee la matriz

Cada fila tiene tres columnas: qué probás, con qué comando, y qué esperás ver. La cuarta columna es tuya: pegás la salida real. Una prueba sin salida pegada es una prueba que no hiciste.

La 1 es la base: si una interfaz está `administratively down`, nada de lo demás importa. La 2 comprueba que el núcleo tiene todas las rutas. La 3 y la 6 son las dos pruebas que hace cualquier persona antes de creer que la red funciona: norte a sur, y salida a Internet. La 4 y la 5 verifican que la redistribución hizo su trabajo (las rutas redistribuidas se ven con un código distinto y una distancia administrativa concreta). La 7 es la prueba de respaldo: apagás el borde y la red sigue saliendo. La 8 es la estrella. La 9 es BGP. La 10 no es un comando: es la documentación.

> **El criterio de aprobación honesto:** si 9 de 10 pruebas pasan y la #10 está documentada, el proyecto está aprobado. Si la #8 falla (rutas que laten), el proyecto NO está aprobado aunque el ping responda: tenés un feedback loop de redistribución (tema de redistribución) y lo vas a sufrir en producción.

### Por qué la #8 decide

Una ruta que "late" es una ruta que aparece y desaparece de la tabla cada pocos segundos. En el simulador se nota poco; en producción significa que el router recalcula y reescribe la tabla sin parar, que la CPU sube, que algunos paquetes van por un camino y otros por otro, y que los usuarios ven cortes intermitentes. Es el síntoma clásico de haber redistribuido en los dos sentidos sin filtrar: la ruta se presta, vuelve con otra distancia administrativa, se vuelve a prestar, y así.

Se detecta de una forma muy simple: corrés el mismo `show ip route` dos veces con unos segundos de diferencia. Si la ruta cambia, hay bucle.

### Resumen

- La matriz es la lista de pruebas con su comando y su resultado esperado; sin salida pegada no cuenta.
- De la 1 a la 3 se prueba lo básico, de la 4 a la 6 la integración, de la 7 a la 9 la resiliencia y BGP.
- La #8 (rutas que no laten) es la que decide si el proyecto está aprobado.
- La #10 es documentar el método: hipótesis y evidencia para cada falla.

---

## 9. Comprobá lo que aprendiste

**1. ¿Por qué Lab 1 usa AD 5 y AD 10 en lugar de AD 1 en las dos default routes?**

**Ver respuesta:** Para que la default "principal" (AD 5) gane SIEMPRE sobre la de respaldo (AD 10) mientras esté viva (selección de rutas: menor AD gana). Si tuvieran la misma AD, entrarían en ECMP y balancearían hacia un enlace que quizás querés solo de backup. La AD distinta implementa "activo + respaldo" (floating static, tema de rutas estáticas).

**2. En Lab 2, ¿cómo sabés sin mirar cuál router será el DR del segmento?**

**Ver respuesta:** En un segmento multipunto, gana primero el de mayor prioridad de interfaz (default 1) y desempata el mayor **router-id** (OSPF). Con `router-id` explícito, controlás quién es el DR: en el lab, el de RID más alto del segmento.

**3. ¿Qué condición tiene que cumplir el camino B de Lab 3 para que `variance` lo deje balancear?**

**Ver respuesta:** Ser **feasible successor**: su Reported Distance (RD) debe ser MENOR que la Feasible Distance (FD) del sucesor (EIGRP). Si no cumple RD < FD, subir variance no lo mete — EIGRP lo descarta por no cumplir la condición de loop-free.

**4. En Lab 4, ¿qué pasa en R1 si R2 NO tiene `next-hop-self`?**

**Ver respuesta:** R1 hereda el next-hop del eBGP original (el router del ISP, R3) y no puede resolverlo (esa ruta no está en su tabla de rutas internas → BGP, regla 2). La ruta iBGP aparece "instalada" pero no usable; el ping al ISP falla desde R1 aunque la sesión esté ESTABLISHED.

**5. En el Proyecto Final, ¿por qué la redistribución OSPF↔EIGRP se hace con route-map en SOLO UNO de los sentidos?**

**Ver respuesta:** Para evitar el feedback loop (tema de redistribución): la ruta que sale del OSPF al EIGRP, y la que vuelve del EIGRP al OSPF, deben estar filtrando el retorno. El patrón sano: un sentido redistribuye TODO, el otro redistribuye filtrado (solo las rutas PROPIAS del otro lado). Si redistribuís ambos sentidos completos, las rutas vuelven eternamente.

**6. ¿Cuál es la fase del plan que NO se puede saltear y por qué?**

**Ver respuesta:** La Fase A (direccionamiento completo primero). Sin IPs no hay interfaz que verificar, ni IGP que levante, ni BGP que peeree — y el troubleshooting sin línea base es imposible (troubleshooting, pregunta 1 del árbol de diagnóstico).

**7. La prueba #8 de la matriz: ¿por qué es la que define la aprobación?**

**Ver respuesta:** Porque detecta el feedback loop de redistribución: una ruta que "late" (cambia entre protocolos/AD en dos `show ip route` seguidos) es inestabilidad real que en producción significa flapping, CPU al máximo y usuarios que pierden conexión. Un proyecto sin esta prueba puede "andar" en el simulador y romper todo en producción.

### Cómo usar estas preguntas

Leelas después de armar cada lab, no antes: sirven para confirmar que entendiste, y todas se responden con lo que ya configuraste. Si alguna no te sale, volvé al manual que nombra la respuesta entre paréntesis — ahí está la explicación completa.

### Resumen

- Son siete preguntas que se responden con lo que ya hiciste en los labs.
- Las tres primeras son de los labs 1, 2 y 3; la cuarta y la quinta son BGP y redistribución.
- La sexta es sobre el orden de armado y la séptima sobre la prueba que define la aprobación.
- Cada respuesta trae entre paréntesis el manual donde está la explicación larga.

---

## 10. Glosario

| Término | Qué es |
|---------|--------|
| **Floating static** | Estática de respaldo con AD mayor (tema de rutas estáticas): solo actúa si la principal cae |
| **ECMP** | Equal-Cost Multi-Path: varias rutas con misma AD y métrica balancean (selección de rutas) |
| **DR/BDR** | Designated/Backup Designated Router de OSPF en segmentos multipunto (OSPF) |
| **ABR** | Area Border Router: router OSPF en dos áreas (OSPF avanzado) |
| **Variance** | Multiplicador EIGRP que habilita el balanceo desigual (EIGRP) |
| **Named mode** | Forma moderna de configurar EIGRP (modo AF de EIGRP) |
| **Next-hop-self** | Fuerza en iBGP que el next-hop sea el router de borde (BGP) |
| **Feedback loop** | Bucle de redistribución: rutas que van y vuelven entre protocolos (redistribución) |
| **Route-map** | Filtro + modificación de rutas; el control de toda redistribución (redistribución) |
| **Matriz de verificación** | Lista de pruebas con comando y resultado esperado (troubleshooting, aplicado) |

### Cómo leer el glosario

La segunda columna define el término y, entre paréntesis, te dice en qué manual de la serie está explicado en detalle. Ese paréntesis es el índice de la serie: si un término del proyecto final no lo tenés claro, no adivinés, volvé al manual indicado.

Si tuvieras que quedarte con tres, elegí estos: **floating static** (porque enseña que el respaldo se configura con confianza, no con fe), **variance** (porque su condición RD < FD es el ejemplo más claro de por qué los protocolos se protegen de los bucles) y **route-map** (porque es la herramienta con la que se evita el desastre del proyecto final).

### Resumen

- El glosario nombra los diez términos que aparecen en los labs y el proyecto.
- Cada fila apunta al manual donde el término está explicado en detalle.
- Es la lista para consultar mientras armás, no para memorizar.

---

## 11. Resumen en 10 puntos

1. **Este manual es el examen PRÁCTICO de la serie**: Labs 1-4 repasan la teoría; el Proyecto Final la integra.
2. **Lab 1 = rutas estáticas y selección**: floating static (AD 5 vs 10) y ECMP; la prueba de fuego es apagar un enlace.
3. **Lab 2 = OSPF**: OSPF multiárea, DR/BDR controlado por router-id, sumarización en el ABR.
4. **Lab 3 = EIGRP**: variance con la condición RD < FD, y EIGRPv6 con la trampa del `no shutdown`.
5. **Lab 4 = BGP**: eBGP + iBGP, next-hop-self y ebgp-multihop; ESTABLISHED con prefijos.
6. **El Proyecto Final usa TODO**: EIGRP de núcleo, OSPF por sucursal, BGP al ISP, redistribución filtrada.
7. **El orden de armado es parte del lab**: cada fase se verifica antes de la siguiente; el error queda acotado.
8. **La redistribución con filtro es innegociable**: un solo sentido completo y el otro filtrado (o feedback loop).
9. **La matriz de 10 pruebas evalúa el proyecto**: la #8 (sin flapping) define la aprobación.
10. **Entregás evidencia, no promesas**: salidas reales de cada prueba + configs exportadas + la defensa de por qué tu diseño no genera bucles.

### El cierre de la serie

Si llegaste hasta acá y podés armar el Proyecto Final sin mirar los manuales, ya no estás aprendiendo redes: estás operando redes. Lo que sigue es repetirlo con variantes —cambiar un protocolo por otro, romper una fase a propósito y ver si la diagnosticás— porque la diferencia entre saber y saber hacer está en la cantidad de veces que te equivocaste y arreglaste.

Y una última cosa que no está en ningún comando: documentá siempre. La matriz de verificación con salidas reales es lo único que va a quedar cuando vos no estés frente a ese router.

### Resumen

- Los diez puntos son el índice de todo el manual en una pantalla.
- Los labs 1 a 4 entrenan una habilidad cada uno; el proyecto las junta.
- La prueba del flapping y la entrega con evidencia son las dos condiciones de aprobación.
- El cierre real es poder operar y documentar la red, no solo configurarla una vez.

---

> **Fuente:** Documentación propia basada en CCNA 200-301 Official Cert Guide (W. Odom), Cisco Networking Academy (Packet Tracer), RFC 2328 (OSPFv2), RFC 4271 (BGP-4) y material educativo de redes. Proyecto final diseñado como integración pedagógica de toda la serie.

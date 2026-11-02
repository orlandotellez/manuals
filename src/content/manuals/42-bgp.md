# 42. BGP: El Pegamento de Internet

**El protocolo que decide cómo viaja el tráfico entre sistemas autónomos — donde la política vale más que la velocidad**

---

Este manual habla de **BGP**, el protocolo que hace que Internet funcione como si fuera una sola red cuando en realidad son miles de redes distintas. Está escrito para alguien que nunca configuró BGP: no hace falta que sepas nada del tema para empezar. Primero armamos el modelo mental —qué problema resuelve, quién manda en Internet y por qué la política le gana a la velocidad— y recién después bajamos a los comandos y a las pantallas del router.

**BGP** son las siglas de *Border Gateway Protocol*, "protocolo de puerta de enlace de frontera". Traducido a la vida diaria: es el **idioma común que usan las redes grandes para decirse "por acá se llega a tal lugar, y por acá no pasés"**. No decide qué camino es el más rápido. Decide qué camino es el **más conveniente** según los acuerdos, los contratos y las reglas de cada red.

Antes de seguir, cuatro palabras que vas a leer en cada capítulo:

- Una **red** es un conjunto de equipos conectados entre sí que pueden mandarse datos. Tu casa es una red; la red de tu proveedor es otra; la de un banco es otra.
- Un **router** (en español, encaminador) es un equipo con varias patas, cada una conectada a una red distinta. Su trabajo es pasar paquetes de una red a otra. Cada pata es una **interfaz**: el conector por donde entra y sale el cable.
- Un **paquete** es el sobrecito de datos que viaja por la red, con una dirección de origen y una de destino, igual que una carta.
- Una **ruta** es una frase que el router guarda en su memoria: "para llegar a tal red, mandá el paquete por tal interfaz". Al conjunto de esas frases se lo llama **tabla de enrutamiento**, y es lo único que el router consulta para decidir por dónde sale cada paquete.

Si venís de los manuales de enrutamiento dinámico, OSPF, EIGRP o IS-IS, todo esto te va a sonar: esos son protocolos de **red interna**, y los vas a volver a ver acá, pero cumpliendo otro papel. Si no los leíste, no importa: cuando aparezca uno lo presentamos de nuevo en una línea.

**Promesa de este manual:** al final vas a poder explicar por qué Internet no se cae, qué es un sistema autónomo, en qué se diferencian eBGP e iBGP, configurar una sesión BGP entre dos routers, y —lo más importante— leer la pantalla de verificación y decir si un vecino está sano o roto. Eso último es el 80% del trabajo real con BGP.

---

## Índice

- [El protocolo que no vive en tu red](#1-el-protocolo-que-no-vive-en-tu-red)
- [Los sistemas autónomos: el mapa político de Internet](#2-los-sistemas-autónomos-el-mapa-político-de-internet)
- [Path Vector: la familia nueva](#3-path-vector-la-familia-nueva)
- [eBGP e iBGP: las dos caras de BGP](#4-ebgp-e-ibgp-las-dos-caras-de-bgp)
- [Los atributos: la moneda de la política](#5-los-atributos-la-moneda-de-la-política)
- [El algoritmo de selección de camino (en orden)](#6-el-algoritmo-de-selección-de-camino-en-orden)
- [Las 3 reglas de iBGP que rompen cabezas](#7-las-3-reglas-de-ibgp-que-rompen-cabezas)
- [Configuración: eBGP e iBGP en 10 minutos](#8-configuración-ebgp-e-ibgp-en-10-minutos)
- [¿Por qué no usar BGP para todo? El caso de uso honesto](#9-por-qué-no-usar-bgp-para-todo-el-caso-de-uso-honesto)
- [Verificación: cómo leer a BGP](#10-verificación-cómo-leer-a-bgp)
- [Los 5 errores más comunes](#11-los-5-errores-más-comunes)
- [Comprobá lo que aprendiste](#12-comprobá-lo-que-aprendiste)
- [Glosario](#13-glosario)
- [Resumen en 10 puntos](#14-resumen-en-10-puntos)

Cómo usar este índice: cada título es un capítulo y también es la dirección (la URL) con la que se publica la página. Si tenés poco tiempo, el camino corto es el capítulo 1 (el modelo mental: por qué BGP es distinto de todo lo anterior), el 2 (qué es un sistema autónomo), el 4 (eBGP contra iBGP) y el 10 (cómo se lee la pantalla del router). Con esos cuatro ya podés sentarte frente a un router de borde sin miedo. El resto es lo que necesitás para **configurar** y **diagnosticar**: los atributos del 5, el orden de selección del 6, las reglas de iBGP del 7 y los errores del 11.

Una advertencia de método: BGP no se entiende por los comandos. Se entiende por una sola idea, que es la del título del manual: **BGP es el pegamento que une redes que no confían entre sí**. Si te llevás esa frase, los comandos del capítulo 8 se vuelven obvios, porque cada uno hace exactamente una cosa de ese acuerdo entre vecinos.

### Resumen

- BGP es el protocolo que conecta redes independientes: es el pegamento de Internet.
- No elige el camino más rápido: elige el más conveniente según la política de cada red.
- Este manual construye primero el modelo mental y después baja a los comandos.
- El camino corto son los capítulos 1, 2, 4 y 10; el resto es configuración y diagnóstico.

---

## 1. El protocolo que no vive en tu red

Hasta acá, todos los protocolos que estudiaste (OSPF, EIGRP, IS-IS) son de **red interna**: deciden cómo viaja el tráfico DENTRO de una organización. Ahora llega el que vive en la frontera: **BGP** (*Border Gateway Protocol*).

Vale la pena definir esas tres siglas, porque son los vecinos de BGP en este manual y van a aparecer todo el tiempo:

- **OSPF** (*Open Shortest Path First*, "primero el camino más corto, y abierto") es un protocolo de enrutamiento de estado de enlace: los routers arman un mapa compartido y cada uno calcula su mejor camino sobre ese mapa.
- **EIGRP** (*Enhanced Interior Gateway Routing Protocol*) es el protocolo de Cisco que aprende de sus vecinos, guarda un camino alternativo ya calculado y converge rapidísimo.
- **IS-IS** (*Intermediate System to Intermediate System*) es el protocolo de estado de enlace que usan las grandes redes de proveedores. Conceptualmente es un primo de OSPF: mismo estilo de mapa compartido, otra forma de escribirlo.

Los tres son protocolos de **red interna**, también llamados **IGP** (*Interior Gateway Protocol*, "protocolo de puerta de enlace interior"). Interior quiere decir: adentro de una misma organización, bajo una misma administración. En ese mundo, el problema es la **métrica**: qué camino es más corto, más rápido o más barato en términos de ancho de banda. Y se resuelve con matemática.

BGP juega en otra cancha. BGP es un **EGP** (*Exterior Gateway Protocol*, "protocolo de puerta de enlace exterior"): su trabajo es hablar con redes que **no son tuyas** y que **no te deben obediencia**. Ahí la pregunta "¿cuál es el camino más corto?" deja de tener una respuesta única, porque cada red mide distinto y, sobre todo, porque cada red tiene intereses distintos.

> **BGP es el protocolo de routing de Internet.** Cuando tu casa navega, el tráfico atraviesa un puñado de redes de proveedores (ISP) que "hablan" BGP entre sí. BGP no decide "cuál es el camino más rápido": decide **cuál es el camino MÁS APROPIADO según las reglas políticas y comerciales** de cada red. Es dinero, contratos y soberanía técnica convertidos en un protocolo.

Un **ISP** (*Internet Service Provider*) es un proveedor de Internet: la empresa que te vende la conexión. Y "hablan BGP" no es una metáfora: en el borde entre dos proveedores hay routers que se mandan mensajes BGP por una sesión de TCP en el puerto 179, y cada mensaje dice "yo llego a estas redes por acá". De esa conversación sale, sumada, la tabla de rutas que hace que un paquete salga de tu casa y llegue a un servidor del otro lado del planeta.

### 1.1. El problema: Internet no es una red, son miles

Acá está el malentendido que hay que desarmar primero. Cuando decís "me conecto a Internet", parece que te conectás a **una** red grande. No es así.

Internet es un **acuerdo entre redes**. Miles de organizaciones —proveedores, universidades, bancos, gobiernos, empresas de nube— tienen cada una su red, con sus routers, su administración y sus reglas. Nadie es dueño del conjunto. No hay un router central que sepa todos los caminos, ni un administrador único que decida por dónde va tu paquete.

Entonces aparece la pregunta que BGP resuelve:

> **Si nadie manda en Internet, ¿cómo sabe cada red por dónde mandar un paquete que va a un lugar que no conoce?**

La respuesta es un pacto entre pares: cada red le cuenta a sus vecinas qué redes alcanza, y las vecinas repiten el chisme hacia afuera agregando su propio nombre. No hay mapa central: hay una **colección de anuncios** que cada router va juntando. Y como cada red decide qué anuncia y qué no, el resultado no es "el mapa óptimo": es **el mapa que a cada uno le conviene mostrar**.

Eso es BGP: el protocolo con el que las redes se cuentan, de vecino en vecino, qué partes de Internet alcanzan y con qué condiciones.

### 1.2. La analogía: el tráfico internacional de mercadería

Pensá en una empresa que importa mercadería. Adentro de su país, el transporte lo resuelve con un mapa de rutas: la autopista más rápida, el camino más corto, el peaje más barato. Eso es OSPF: un problema de optimización dentro de un territorio donde las reglas son las mismas para todos.

Para cruzar la frontera el problema cambia por completo. Ahora importan otras cosas:

- ¿Con qué país tengo acuerdo comercial?
- ¿A quién le pago el flete, y a quién no quiero pagarle?
- ¿Hay un país por el que no quiero que pase mi mercadería, aunque el camino sea más corto?
- ¿Qué aduana es más confiable?

Ninguna de esas preguntas se contesta con un mapa. Se contestan con **política**. Y la ruta que gana puede ser bastante más larga que la geográficamente directa, porque el criterio no es la distancia: es el acuerdo.

> **Analogía madre de este manual:** OSPF elige la ruta como un GPS (más corta, más rápida). BGP elige la ruta como una **decisión de tráfico internacional**: "¿por qué país hago pasar la mercadería?" — por acuerdos comerciales, por seguridad, a quién le pago y a quién no. La métrica "más rápido" es secundaria: gana "por dónde me conviene".

### 1.3. La definición precisa

Con la analogía en la mano, la definición técnica se lee mucho mejor:

**BGP es el protocolo de enrutamiento que intercambia información de alcanzabilidad entre sistemas autónomos.** Cada router BGP anuncia los prefijos que puede alcanzar (redes, escritas como dirección más máscara) y, con cada anuncio, viaja una lista de atributos que dice por dónde pasó ese anuncio y con qué preferencias. El router junta todos los anuncios que recibe, los compara según un orden de prioridades y elige uno por destino.

Cuatro datos que conviene retener desde ahora:

| Dato | Valor |
|------|-------|
| Nombre completo | **Border Gateway Protocol** (versión actual: BGP-4, RFC 4271) |
| Transporte | **TCP puerto 179** (necesita sesión TCP establecida) |
| Alcance | **Entre sistemas autónomos** (inter-AS) y también dentro de uno (iBGP) |
| Familia | **Path vector** (vector de caminos): guarda la lista de AS del camino |

Esta tabla es la ficha mínima de BGP. Se lee así: la primera columna nombra el dato y la segunda lo responde. **RFC** son las siglas de *Request for Comments*, los documentos donde se publican los estándares de Internet: la RFC 4271 es el documento que define BGP-4, y por eso cualquier fabricante puede implementarlo. **TCP** (*Transmission Control Protocol*) es el protocolo de transporte confiable: entrega los datos en orden y avisa si algo se perdió. BGP lo usa porque necesita que ningún anuncio se pierda ni llegue desordenado: un anuncio perdido es una red que deja de ser alcanzable. Y **puerto 179** es el número que identifica a BGP dentro de esa conversación TCP, igual que el 443 identifica al tráfico web cifrado.

La fila de **path vector** es la que más adelante vas a necesitar; tiene su propio capítulo (el 3). Por ahora alcanza con saber que BGP no guarda "a cuántos saltos está" sino "por qué redes pasó".

### 1.4. Por qué la política le gana a la velocidad

Un principiante pregunta lo obvio: si el camino más corto existe, ¿por qué no usarlo siempre? Hay tres razones, y las tres son reales.

**Primera: las métricas no son comparables.** El costo de un enlace dentro de tu red lo definís vos. El costo dentro de la red del proveedor lo define el proveedor, con otro criterio y otra escala. No hay una unidad común que permita sumar "cuánto cuesta" atravesar diez redes de dueños distintos. Comparar métricas ajenas sería como comparar el precio de un café en cinco países sin convertir la moneda: los números existen, pero no significan lo mismo.

**Segunda: la ruta es un acuerdo comercial.** Cuando dos proveedores se conectan, firman qué se anuncian y qué no. Un proveedor puede anunciar las redes de sus clientes y no anunciar las de su competidor, aunque técnicamente podría llegar. Esa decisión no la toma un algoritmo: la toma un contrato, y BGP es el mecanismo que la hace cumplir.

**Tercera: la estabilidad vale más que la optimalidad.** Internet son cientos de miles de rutas. Si cada router recalculara agresivamente ante el menor parpadeo de un enlace, la red entera viviría temblando. BGP es deliberadamente conservador: prefiere esperar y confirmar antes que cambiar de camino a cada rato. Un camino un poco peor pero estable es mejor negocio que un camino óptimo que cambia cada treinta segundos.

> **La frase que hay que memorizar (y entender):** OSPF/EIGRP/IS-IS eligen por **métrica de red**; BGP elige por **política**. BGP no calcula el camino más corto: ejecuta las reglas del administrador de cada sistema autónomo.

### 1.5. Qué promete este manual

**Promesa concreta:** al terminar vas a poder mirar un router de borde y contestar tres preguntas. ¿La sesión con el proveedor está arriba? ¿Qué redes estoy anunciando y qué redes estoy recibiendo? ¿Por qué eligió este camino y no el otro? Las tres se contestan con los comandos del capítulo 10, y todas dependen de las ideas de los capítulos 2 a 7.

Lo que este manual **no** promete: convertirte en ingeniero de tráfico de un proveedor internacional. Eso es un oficio aparte, con años de práctica. Acá aprendés el modelo mental y la operación básica, que es lo que se pide en un examen, en una entrevista y en el 90% de los trabajos con redes.

### Resumen

- Internet no es una red: son miles de redes independientes que necesitan acordar caminos.
- Los protocolos internos (OSPF, EIGRP, IS-IS) optimizan métricas dentro de una organización; BGP negocia entre organizaciones.
- BGP viaja sobre TCP puerto 179 y guarda la lista de redes que atravesó cada anuncio.
- Elige por política, no por velocidad: acuerdos comerciales, soberanía y estabilidad pesan más que el camino corto.
- Al final del manual vas a poder verificar una sesión y explicar por qué eligió el camino que eligió.

---

## 2. Los sistemas autónomos: el mapa político de Internet

### 2.1. ¿Qué es un AS?

Si Internet es un conjunto de redes que negocian, hace falta una forma de nombrar a cada negociador. Ese nombre es el **AS**.

Un **Sistema Autónomo (AS)** es un conjunto de redes (routers) bajo **una sola administración técnica** — una empresa, un ISP, un organismo — con una **política de routing única** y un **número identificatorio (ASN)**.

Desarmemos la definición en tres partes, porque cada una importa:

- **Una sola administración técnica.** Hay una persona o un equipo que decide las reglas de esa red. No hay dos jefes discutiendo: si hay dos, son dos AS.
- **Una política de routing única.** "Política" quiere decir: qué anuncio, qué no anuncio, por dónde prefiero salir, por dónde acepto entrar. Dentro de un AS esa política es una sola, coherente. Si dos partes de la red tienen políticas contradictorias, en realidad son dos AS mal dibujados.
- **Un número identificatorio.** El **ASN** (*Autonomous System Number*, "número de sistema autónomo") es el documento de identidad de ese AS en el mundo. Es un número, no una dirección IP, y no tiene nada que ver con las IPs de adentro.

> **Analogía:** un AS es un **país**. Adentro hay un solo gobierno que decide las leyes de tránsito (la política de routing). El ASN es el **número de pasaporte** de ese país: con eso lo identifican en la frontera. Y así como un país no puede tener dos gobiernos, una red no puede tener dos políticas: si las tiene, son dos países.

### 2.2. Cómo se ve un AS por dentro y por fuera

El dibujo clásico, que es el que hay que tener en la cabeza todo el manual:

```text
             AS65001 (tu empresa)                 AS65002 (el ISP)
     ┌─────────────────────────┐         ┌─────────────────────────┐
     │   R1 ── R2 ── R3        │         │  R4 ── R5 ── R6         │
     │      (OSPF interno)     │         │     (IS-IS interno)     │
     │         │    │          │         │          │              │
     └─────────┼────┼──────────┘         └──────────┼──────────────┘
               │    │        ◄──BGP──►              │
               └────┴────  (frontera eBGP)  ────────┘
```

Este bloque es el mapa político de Internet en miniatura. Se lee como dos cajas: cada caja es un **AS**, con su número arriba. La caja de la izquierda es la red de una empresa (AS65001) y la de la derecha es la de su proveedor (AS65002).

Los detalles del dibujo:

- **Adentro de cada caja** hay routers unidos por `──`, que son los enlaces internos. Cada AS resuelve su interior con el protocolo que quiera: el de la izquierda usa **OSPF**, el de la derecha usa **IS-IS**. Es decisión de cada dueño, y al vecino no le importa.
- **Las líneas verticales de abajo** (los `│`) son los enlaces que bajan de los routers de borde hacia la frontera.
- **La flecha `◄──BGP──►`** es la única conversación entre las dos cajas. Ese es el punto central: los dos AS **no comparten su mapa interno**. Solo se dicen, por BGP, qué redes alcanzan.
- **"(frontera eBGP)"** aclara que esa conversación entre AS distintos se llama **eBGP** (capítulo 4). Un router que tiene una pata adentro del AS y otra en la frontera se llama **router de borde** (en inglés, *border router* o *edge router*), y es el que hace de puerta.

Fijate en lo que el dibujo **no** muestra: adentro de la caja izquierda no aparece BGP entre R1, R2 y R3. BGP no reemplaza a OSPF: convive con él. OSPF dice cómo llegar de R1 a R3; BGP dice qué redes del mundo se anuncian por la puerta.

### 2.3. Los números: públicos, privados y quién los reparte

Datos fundamentales:

| Dato | Valor |
|------|-------|
| ASN público | 1 - 64511 (registrados, únicos en Internet, por RIR) |
| ASN privado | **64512 - 65535** (para uso interno, como las IPs privadas que ya conocés) |
| Quién asigna | Los RIR (ARIN, RIPE, LACNIC...) |

Esta tabla tiene dos columnas: el **dato** y su **valor**. Tres filas, tres ideas: qué números se usan en Internet, qué números se pueden usar libremente adentro de una casa, y quién reparte los primeros.

Fila por fila:

- **ASN público: 1 - 64511.** Son los números "de verdad", los que se anuncian en Internet. Cada uno es único en el planeta y está registrado a nombre de una organización. Si anunciás un ASN público que no es tuyo, estás haciendo algo entre incorrecto y fraudulento, y el resto de Internet puede enterarse.
- **ASN privado: 64512 - 65535.** Son los números que podés usar sin pedirle permiso a nadie, siempre que **no salgan a Internet**. Es exactamente la misma idea que las **IPs privadas** (las 192.168.x.x, 10.x.x.x y 172.16.x.x que ya conocés): sirven adentro, y en la frontera se traducen o no se anuncian. Si tu empresa tiene dos routers hablando BGP entre sí y no va a anunciar nada al mundo, un ASN privado alcanza y sobra.
- **Quién asigna: los RIR.** **RIR** son las siglas de *Regional Internet Registry*, "registro regional de Internet". Son organizaciones que administran los números de una región del mundo y los asignan a quien los justifique: **ARIN** cubre América del Norte, **RIPE** cubre Europa, Oriente Medio y Asia Central, **LACNIC** cubre América Latina y el Caribe. Son los mismos registros que reparten las direcciones IP.

> **Aviso de corrección (una línea):** el rango privado es 64512 - 65534; el **65535** está reservado y no se usa como ASN. Y desde que se agotaron los números de 16 bits existen también **ASN de 32 bits**, con números mucho más grandes, para los pedidos nuevos.

Dos aclaraciones que evitan errores de examen:

- El **ASN** identifica a la organización; la **IP** identifica a un equipo. Un AS tiene un ASN y miles de IPs. No se parecen ni se confunden.
- El ASN **no** dice nada sobre el tamaño. Un AS puede ser un proveedor con millones de clientes o una empresa con tres routers. Lo que lo define es la administración única, no la cantidad de equipos.

> **La regla de oro (el "interior vs exterior" que ordena todo):** **BGP = entre sistemas autónomos (inter-AS)**. **OSPF/EIGRP/IS-IS = dentro de un sistema autónomo (intra-AS)**. Hasta podés ver un ISP usando IS-IS *adentro* de su AS y BGP *entre* los AS. Son capas distintas, no competidores excluyentes.

### 2.4. Por qué la frontera es un lugar especial

Cuando un router está en la frontera pasa algo que no pasa adentro: **las dos redes no confían entre sí**. Del lado de adentro, el router sabe que los demás routers son de la misma empresa y responden a las mismas reglas. Del lado de afuera, no sabe nada: el vecino puede tener un error de configuración, puede estar saturado, puede cambiar su política mañana.

Por eso BGP es tan cuidadoso en la frontera:

- **Filtra lo que acepta.** No se cree todo lo que el vecino anuncia. Una empresa no debería aceptar rutas de Internet entero si solo necesita una ruta por defecto; y nadie debería aceptar un anuncio absurdo sin revisarlo.
- **Filtra lo que anuncia.** No cuenta los detalles de su red interna, solo los prefijos que quiere hacer públicos.
- **Verifica que el vecino sea el que dice ser.** La sesión TCP y la configuración de números de AS son parte de ese control.

Esa desconfianza estructural es la razón por la cual BGP tiene tantos atributos y tantas reglas: cada uno es una forma de decir "esto lo acepto con condiciones".

### Resumen

- Un AS es un conjunto de redes con una sola administración y una sola política de routing, identificado por un ASN.
- El ASN público se anuncia en Internet; el privado (64512-65534) se usa adentro, como las IPs privadas.
- Los RIR (ARIN, RIPE, LACNIC) reparten los números.
- Dentro del AS manda un protocolo interno (OSPF, EIGRP, IS-IS); entre AS manda BGP. Son capas, no competidores.
- En la frontera nadie confía en nadie: BGP filtra lo que acepta y lo que anuncia.

---

## 3. Path Vector: la familia nueva

En el tema de enrutamiento dinámico viste las dos familias (DV y LS). BGP es la **tercera familia**: **path vector** (vector de caminos).

Repasemos las tres, porque la comparación es la que hace entender BGP:

- **DV** son las siglas de *Distance Vector*, "vector de distancia". El protocolo de esta familia es **RIP** (*Routing Information Protocol*). Cada router le pregunta a sus vecinos "¿vos por dónde llegás y a qué distancia?", y les cree. Nadie tiene un mapa: todos tienen rumores.
- **LS** son las siglas de *Link-State*, "estado de enlace". Los protocolos de esta familia son OSPF e IS-IS. Cada router publica sus enlaces y todos arman **el mismo mapa**; después cada uno calcula su camino sobre el mapa.
- **PV** es *Path Vector*, "vector de caminos". El protocolo es BGP. Guarda, para cada destino, **la lista completa de sistemas autónomos por los que pasa el anuncio**. Ni rumores ni mapa: la lista de actores del viaje.

| Familia | Qué guarda | Ejemplo |
|---------|-----------|---------|
| Distance Vector | destino + distancia (rumor) | RIP |
| Link-State | mapa completo (LSA/LSP + SPF) | OSPF, IS-IS |
| **Path Vector** | **la lista COMPLETA de AS por los que pasa el camino** | **BGP** |

Esta tabla tiene tres columnas: la **familia**, **qué guarda** y un **ejemplo**. Se lee de arriba hacia abajo como una escalera de información: el vector de distancia guarda un número por destino, el estado de enlace guarda el mapa entero, y el vector de caminos guarda la lista de dueños por los que pasa el anuncio.

Fila por fila:

- **Distance Vector → destino + distancia (rumor).** Lo único que sabe un router RIP es "para llegar a tal red, salí por acá y faltan tantos saltos". Nada más. Por eso se dice que aprende por rumor: no puede verificar si el vecino dice la verdad.
- **Link-State → mapa completo (LSA/LSP + SPF).** Un **LSA** (*Link State Advertisement*) es el anuncio con el que cada router cuenta qué tiene conectado; un **LSP** (*Link State PDU*) es lo mismo con el nombre que le da IS-IS. **SPF** (*Shortest Path First*) es el algoritmo de Dijkstra con el que cada router calcula su árbol de caminos sobre el mapa. Más información, más memoria y más CPU.
- **Path Vector → la lista completa de AS.** Acá está la novedad. BGP no guarda un número abstracto: guarda los nombres de los dueños de las redes que el anuncio atravesó. Es información política, no solo métrica.

### 3.1. El AS-PATH: la lista que lo cambia todo

```text
Camino hacia 203.0.113.0/24:
AS-PATH = 65001 65002 65010      ← la "cadena" de AS que atraviesa el anuncio
                                 (es el "vector" de actores del camino)
```

Este bloque muestra el corazón del path vector: la ruta hacia una red concreta (203.0.113.0/24) y, debajo, el **AS-PATH** de esa ruta. El AS-PATH es una lista de números de AS separados por espacios, en el orden en que el anuncio los fue atravesando.

Se lee así: la ruta hacia 203.0.113.0/24 pasó por el AS65001, después por el AS65002 y después por el AS65010. La flecha `←` y el texto entre paréntesis no son parte del dato: son la anotación que explica qué es esa cadena. El primero de la lista es el AS que originó el anuncio (o el más cercano a él) y el último es el AS que lo está anunciando ahora.

Dicho de otro modo: el AS-PATH es la **lista de sellos del pasaporte** del anuncio. Cada frontera que cruza, le agrega un sello con el nombre del país que lo dejó pasar.

### 3.2. La potencia de la lista

**La potencia de la lista:** con el AS-PATH completo, BGP puede:

1. **Detectar bucles al instante**: si un anuncio vuelve conteniendo TU AS, lo descartás (lo anunciaste vos). Sin rumores, sin contar hasta 16: la lista física del viaje.
2. **Aplicar política por actor**: "si el camino pasa por el AS 65010, no lo quiero" — un solo atributo de lista habilita política sin precedentes.
3. **Evaluar "qué tan directo"**: menos AS en la lista suele preferir caminos más directos (regla 4 del path selection).

Cada uno de los tres merece un comentario, porque son las tres razones por las que BGP es como es.

**Detección de bucles.** Los protocolos de vector de distancia clásicos cuentan saltos: RIP declara inalcanzable un destino a los 16 saltos, y mientras tanto un paquete puede quedar rebotando entre dos routers que se creen mutuamente la salida. BGP no necesita contar: si el anuncio que llega contiene **tu propio ASN**, significa que ese camino pasa por vos, o sea que es un círculo. Se descarta y listo, en el momento. Es la diferencia entre deducir un bucle por el síntoma y verlo escrito en la etiqueta.

**Política por actor.** Como la lista trae nombres, podés escribir reglas sobre nombres: "no acepto nada que venga por tal proveedor", "prefiero lo que venga por tal otro". Eso es imposible en un protocolo que solo guarda un número: el número no te dice por quién pasó.

**"Qué tan directo".** Menos AS en la lista no siempre es más rápido en milisegundos, pero es un buen indicador de cuántas redes ajenas estás atravesando, y atravesar menos redes ajenas suele ser más barato y más predecible. Por eso la longitud del AS-PATH es uno de los criterios de desempate del capítulo 6.

> **Analogía:** el AS-PATH es la **etiqueta de origen del viaje**: "Hecho en China; transitó: Argentina, Brasil, París...". Cada actor que toca el producto le suma su nombre. Si la etiqueta vuelve al país de origen, el paquete se descarta (está en bucle). Y el comprador puede decidir por etiqueta: "si pasa por X, no lo quiero".

Un detalle que completa la analogía: la etiqueta se puede **alargar a propósito**. Si un AS quiere que los demás lo prefieran menos para cierto tráfico, repite su propio número varias veces en el AS-PATH y el camino se vuelve "más largo" a los ojos de los demás. Es una técnica real de ingeniería de tráfico y se llama *AS-path prepending*; no la vas a configurar en este manual, pero conviene saber que existe cuando veas un AS-PATH con el mismo número repetido.

### Resumen

- BGP es la tercera familia: path vector, vector de caminos.
- En vez de una distancia o un mapa, guarda la lista completa de AS por los que pasó el anuncio.
- Esa lista detecta bucles al instante: si aparece tu propio ASN, el anuncio se descarta.
- También habilita política por nombre ("no quiero pasar por tal AS") y sirve como medida de cuán directo es un camino.
- El AS-PATH es la etiqueta de origen del viaje, con un sello por cada frontera.

---

## 4. eBGP e iBGP: las dos caras de BGP

BGP tiene dos modalidades según QUIÉN es el peer:

```text
eBGP = BGP entre AS DISTINTOS   (vecino con remote-as ≠ el mío)
iBGP = BGP dentro del MISMO AS  (vecino con remote-as = el mío)
```

Este bloque define las dos únicas formas de hablar BGP. **eBGP** es la "e" de *external* (externo) y **iBGP** es la "i" de *internal* (interno). La diferencia no es de configuración: es de **quién está del otro lado**.

Se lee así: en eBGP, el vecino pertenece a un AS distinto del tuyo; en iBGP, el vecino pertenece a tu mismo AS. El `remote-as` que aparece entre paréntesis es el comando con el que le decís al router a qué AS pertenece el vecino: si ese número es distinto del tuyo, la sesión es eBGP; si es igual, es iBGP. Un solo número decide la modalidad, y con la modalidad cambian todas las reglas.

> **Analogía de los países y las provincias:** **eBGP** es la conversación entre **países vecinos**: dos gobiernos distintos, con reglas distintas, que mandan embajadores y hablan de igual a igual. Hay frontera, hay aduana y hay desconfianza: lo que el otro país dice se escucha, pero se verifica. **iBGP** es la conversación entre **provincias del mismo país**: mismo gobierno, mismas leyes, un solo interés nacional. Ahí el problema no es negociar con un extraño, es **repartir la información** que llegó de la embajada para que todas las provincias se enteren. Y por eso iBGP tiene reglas internas raras: son reglas de reparto, no de diplomacia.

### 4.1. La tabla de diferencias

| Característica | eBGP | iBGP |
|----------------|------|------|
| Vecino (peer) | En otro AS | En mi propio AS |
| Distancia (AD) | **20** | **200** |
| Next-hop | Cambia (el router de borde vecino) | **NO cambia** (se mantiene el next-hop del eBGP: por eso existe `next-hop-self`) |
| Loop prevention | AS-PATH (si tu AS aparece, descartás) | **Split horizon de iBGP** (no se re-anuncia una ruta aprendida por iBGP a OTRO iBGP — de ahí la regla de full mesh) |
| TTL en el salto | 1 por defecto (un solo salto) | 255 (multi-hop típicamente) |

Esta tabla compara las dos modalidades en cinco características. La primera columna dice **qué característica** se compara; las otras dos dan el valor en eBGP y en iBGP. Es la tabla que más se pregunta en los exámenes, así que vale la pena leerla fila por fila.

- **Vecino (peer):** un **peer** es el otro extremo de la sesión BGP, el router con el que estás hablando. En eBGP es de otro AS; en iBGP es de tu mismo AS.
- **Distancia (AD):** **AD** son las siglas de *Administrative Distance*, "distancia administrativa": un número que expresa cuánto confía el router en la **fuente** de una ruta. Menor es más confiable. eBGP tiene 20 y iBGP tiene 200. Si un router aprende la misma red por dos fuentes, gana la de menor AD.
- **Next-hop:** el **next-hop** ("siguiente salto") es la dirección IP del router al que le mando el paquete para que siga viajando. En eBGP se reescribe con la dirección del router de borde del otro AS. En iBGP se conserva el original del eBGP, y eso trae consecuencias (capítulo 7.2).
- **Loop prevention:** acá cada modalidad usa su propio mecanismo. Afuera se usa el AS-PATH; adentro el AS-PATH no sirve (todos los routers tienen el mismo ASN, así que nunca "aparece tu AS"), y se usa una regla de reparto: lo que aprendí por iBGP no se lo cuento a otro iBGP. Es el tema del capítulo 7.
- **TTL en el salto:** **TTL** son las siglas de *Time To Live*, "tiempo de vida": un contador que cada paquete lleva y que baja en uno con cada router que atraviesa; cuando llega a cero, el paquete se descarta. En eBGP clásico el valor inicial es 1, o sea que el vecino tiene que estar a un solo salto. En iBGP no hay ese límite.

> **Los AD que ya conocés de la tabla de selección de rutas:** eBGP 20 e iBGP 200. Ver `[20/0]` en la tabla de rutas = ruta BGP externa. Y nota la asimetría: el propio fabricante de BGP hace que lo externo (20, más confiable que todo lo interno) gane sobre iBGP (200, menos que RIP 120 y que EIGRP externo 170) — porque lo interno ya debería estar resuelto por OSPF/IS-IS adentro.

> **Aviso de corrección (una línea):** la fila del TTL puede confundir. El valor inicial de TTL en los paquetes IP es 255; lo que cambia en eBGP es que el router **fuerza** TTL 1 en los paquetes de la sesión para que no salgan del enlace directo. En iBGP no hay ese forzado: los paquetes viajan varios saltos con el TTL normal de IP, que va bajando por el camino.

### 4.2. Peers y sesiones: qué pasa cuando dos routers se encuentran

Un **peer** (o "vecino", o "par") es el router con el que tenés configurada una sesión BGP. La palabra importa porque en BGP **no hay descubrimiento automático**: no existe un saludo tipo Hello que encuentre vecinos solos. Cada peer se configura a mano, con su dirección IP y su número de AS. Si el otro lado también te configura a vos, la sesión levanta; si no, no levanta nunca.

Esa es la primera gran diferencia con OSPF y EIGRP, y explica por qué BGP es más "trabajoso": en un protocolo interno, enchufás el cable y los routers se conocen; en BGP, cada extremo tiene que declarar al otro.

La sesión en sí es una conexión **TCP al puerto 179**. Una vez establecida, los dos routers intercambian cuatro tipos de mensajes:

- **OPEN:** "hola, soy del AS tal, hablo BGP versión 4, estos son mis parámetros". Es el saludo inicial y sirve para negociar capacidades.
- **KEEPALIVE:** "sigo acá". Se manda cada 60 segundos por defecto, y si el otro no manda nada en 180 segundos (el *hold time*), la sesión se cae. Son los dos cronómetros que hay que recordar.
- **UPDATE:** el mensaje importante: lleva los anuncios de rutas con sus atributos, y también los retiros ("esta red ya no la alcanzo").
- **NOTIFICATION:** "cortamos, y este es el motivo". Es el mensaje de error; cuando lo ves, la sesión se cierra y el motivo suele decir exactamente qué está mal.

> **Analogía:** la sesión BGP es una **línea telefónica dedicada entre dos oficinas**. Para que haya conversación, los dos tienen que haber cargado el número del otro (configuración manual). Una vez que atienden, se saludan (OPEN), se dicen "sigo en línea" cada tanto (KEEPALIVE) y se pasan la información importante (UPDATE). Si uno tiene que cortar, avisa por qué (NOTIFICATION). Y si el teléfono deja de sonar, el otro asume que se cortó la línea.

Los **estados** de esa sesión tienen nombres técnicos y aparecen en la pantalla de verificación: `Idle`, `Connect`, `Active`, `OpenSent`, `OpenConfirm` y `ESTABLISHED`. No hace falta memorizarlos ahora: el capítulo 10 los explica en orden y cuenta cuáles indican problema.

Un último detalle de diseño que conviene entender desde acá: **iBGP se configura sobre direcciones de loopback**, no sobre la IP del cable. Una **loopback** es una interfaz virtual que no se cae cuando se cae un cable, porque no existe físicamente: es una dirección que el router se pone a sí mismo. Si la sesión iBGP vive en la loopback, un enlace roto no la mata, siempre que el protocolo interno (OSPF/IS-IS) encuentre otro camino hacia esa loopback. Por eso el comando `update-source loopback 0` aparece en la configuración del capítulo 8.

### Resumen

- eBGP es la conversación entre países vecinos: AS distintos, desconfianza, AS-PATH como control de bucles, TTL 1.
- iBGP es la conversación entre provincias del mismo país: mismo AS, reglas de reparto interno, next-hop que no cambia.
- Los peers se configuran a mano: BGP no descubre vecinos solo.
- La sesión es TCP 179 y se mantiene con KEEPALIVE cada 60 segundos; sin noticias en 180, se cae.
- La AD marca la confianza: eBGP 20 (más confiable) e iBGP 200 (menos confiable que OSPF o EIGRP).

---

## 5. Los atributos: la moneda de la política

### 5.1. La tabla de los atributos que gobiernan

Cada ruta BGP viaja con sus **atributos**: metadatos que los routers usan para decidir a quién prefieren y qué anuncian. Los cuatro que importan (ordenados por la selección):

```text
WEIGHT (Cisco, solo local)   → "este camino me gusta, más alto mejor"
LOCAL_PREF (dentro del AS)   → "este camino le conviene a MI AS, más alto mejor"
AS_PATH (en todos los anuncios) → "cuánto viajó", MÁS CORTO mejor (y bucle si muestra mi AS)
MED (entra a mi AS)          → "el costo que el vecino sugiere para entrar", MÁS BAJO mejor
```

Este bloque lista los cuatro atributos que gobiernan la elección de camino, en el orden en que se evalúan. Cada línea tiene tres partes: el **nombre** del atributo, entre paréntesis **dónde vale** (solo en este router, en todo el AS, en todos los anuncios, entre vecinos), y después de la flecha `→` una frase en lenguaje llano que resume su efecto.

Lo más importante del bloque es la última palabra de cada frase: **mejor**. Tres de los cuatro atributos mejoran cuando el número **sube**, pero el AS-PATH mejora cuando el número **baja**. Esa mezcla de direcciones es la fuente del 90% de los errores de configuración, así que volvemos sobre eso en el capítulo 6.

Los nombres, uno por uno:

- **WEIGHT** ("peso") es un atributo **local de Cisco**: existe solo en ese router y no se anuncia a nadie. Sirve para decir "en esta máquina, este camino me gusta más". No es estándar: en equipos de otros fabricantes no existe.
- **LOCAL_PREF** es *Local Preference*, "preferencia local". Vale para todo el AS y se anuncia **solo adentro** (entre routers iBGP). Es la forma de decir "a toda la empresa le conviene salir por acá".
- **AS_PATH** ya lo conocés: la lista de AS que atravesó el anuncio. Viaja en todos los anuncios, sin excepción.
- **MED** son las siglas de *Multi-Exit Discriminator*, "discriminador de salidas múltiples". Es una sugerencia que un AS le hace a su vecino: "si vas a entrar a mi red, entrá por esta puerta, que me sale más barata".

### 5.2. La tabla completa

| Atributo | Ámbito | Preferencia | Analogía |
|----------|--------|-------------|----------|
| **Weight** | Solo este router (Cisco) | Mayor = mejor | "A mí me conviene este proveedor, punto" |
| **Local Preference** | Todo mi AS | Mayor = mejor | "A TODA la empresa le conviene salir por acá" |
| **AS-Path** | Global (en cada anuncio) | **Menor = mejor** | "Menos intermediarios = más directo" |
| **MED** | Entre vecinos externos | Menor = mejor | "Entrá por mi puerta A (barata) y no por la B" |
| Next-hop | Global | (se usa para reenviar) | "El siguiente salto físico" |

Esta tabla tiene cuatro columnas: el **atributo**, su **ámbito** (hasta dónde vale), su **preferencia** (si gana el número alto o el bajo) y una **analogía** para fijarlo. Las dos columnas del medio son las que hay que estudiar; la última es la que hace que se queden.

Fila por fila:

- **Weight, solo este router (Cisco), mayor es mejor.** Ámbito mínimo: no sale de la máquina. Es la decisión individual, la preferencia personal del router.
- **Local Preference, todo mi AS, mayor es mejor.** Ámbito máximo adentro: se propaga por iBGP a todos los routers del AS. Es la decisión colectiva de la organización.
- **AS-Path, global, menor es mejor.** Viaja en cada anuncio y lo ve todo el mundo, incluso los AS lejanos. Es el único de los cuatro que es "público".
- **MED, entre vecinos externos, menor es mejor.** No circula por Internet: se manda al vecino directo, y el vecino decide si lo usa. Es una sugerencia, no una orden.
- **Next-hop, global, se usa para reenviar.** No es un criterio de preferencia: es la dirección a la que hay que mandar el paquete si esta ruta gana. Está en la tabla porque aparece en todas las pantallas y hay que saber qué es.

### 5.3. La clave conceptual (lo que nadie entiende al principio)

> **BGP no "mide" rutas: LAS NEGOCIA.** Cada atributo es una "seducción": el atributo dice "preferime". Weight dice "yo (router) prefiero"; Local-Pref dice "nosotros (AS) preferimos"; MED dice "el vecino me seduce con precio barato". El path selection (sección 6) es el orden de precedencia de esas seducciones. Nadie se come el mapa completo: se comen los atributos.

Esta es la idea que cambia la forma de mirar BGP. En OSPF, el router calcula: suma costos y elige el menor. En BGP, el router **negocia consigo mismo** una jerarquía de preferencias: primero mira lo que le dijeron sus propias reglas locales, después lo que decidió su organización, después lo que dice el anuncio, después lo que sugiere el vecino.

> **Analogía:** elegir proveedor de internet en tu casa: Weight = "mi máquina de gaming prefiere esta línea". Local-Pref = "en casa todos prefieren fibra". AS-Path = "fibra directa de Telefónica (1 intermediario) vs fibra con reventa (3 intermediarios)". MED = "el ISP A me ofrece más por menos". BGP pondera en ese orden y elige.

Fijate en el orden implícito de la analogía: primero la preferencia de la máquina, después la de la casa, después cuántos intermediarios hay, y al final el precio que ofrece el proveedor. De más chico a más grande el ámbito, y de más fuerte a más débil la prioridad. Ese es exactamente el orden del capítulo 6.

### Resumen

- Cada ruta BGP lleva atributos: metadatos que dicen cómo preferirla.
- Weight es local del router (Cisco) y gana el mayor; Local Preference vale para todo el AS y gana el mayor.
- El AS-Path es la lista de AS y gana el **más corto**; el MED es una sugerencia del vecino y gana el **más bajo**.
- BGP no mide: negocia. Cada atributo es una forma de decir "preferime".
- Tres atributos mejoran con números altos y dos con números bajos: confundirlos es el error clásico.

---

## 6. El algoritmo de selección de camino (en orden)

Cuando BGP tiene MÚLTIPLES caminos hacia el mismo prefijo, corre esta lista **en orden** — el primer empate desempatado gana, y el que rompe el empate decide:

```text
1.  Mayor WEIGHT (solo Cisco, local)          ← "yo prefiero"
2.  Mayor LOCAL_PREF                          ← "mi AS prefiere"
3.  Rutas ORIGINADAS por el propio router     ← "yo la generé"
4.  AS_PATH más CORTO                        ← "más directo"
5.  Menor ORIGIN (IGP < EGP < incomplete)     ← "de dónde salió"
6.  Menor MED                                ← "me seduce el precio"
7.  eBGP > iBGP                              ← "externa antes que interna"
8.  Menor costo IGP hacia el next-hop         ← "el enlace físico más barato"
9.  ... (desempates finales: RID, etc.)
```

Este bloque es la lista de desempate, en orden estricto de arriba hacia abajo. Se lee como un procedimiento: el router compara los caminos candidatos con el criterio 1; si uno gana, se terminó. Si hay empate, pasa al 2; si sigue el empate, al 3; y así hasta que alguno gane. **Nunca se saltea un paso y nunca se vuelve para atrás.**

Cada línea tiene el criterio, la dirección de la preferencia y, después de la flecha, una frase que lo resume. Línea por línea:

1. **Mayor WEIGHT:** si vos (el router) marcaste un camino con más peso, ese gana. Es la preferencia más local y la más fuerte.
2. **Mayor LOCAL_PREF:** si el AS decidió que una salida es preferida, todos sus routers la prefieren.
3. **Rutas originadas por el propio router:** si el router generó esa ruta él mismo (porque la tiene conectada o la declaró con `network`), le gana a cualquier ruta aprendida de un vecino.
4. **AS_PATH más corto:** menos AS en la lista, mejor. Es el criterio que premia lo "directo" en términos de redes atravesadas.
5. **Menor ORIGIN:** el atributo **ORIGIN** dice cómo nació la ruta. `IGP` (nació adentro de un AS), `EGP` (nació de un protocolo exterior viejo, casi no se usa) e `incomplete` (se perdió la información de origen, típico de rutas redistribuidas). El orden de preferencia es IGP mejor que EGP, y EGP mejor que incomplete.
6. **Menor MED:** si el vecino sugirió que entres por una puerta barata, se le hace caso.
7. **eBGP antes que iBGP:** entre dos caminos iguales, se prefiere el que vino de afuera por eBGP.
8. **Menor costo IGP hacia el next-hop:** el camino cuya puerta de salida está más "cerca" según el protocolo interno (OSPF/IS-IS) es el que gana.
9. **Desempates finales:** si todavía hay empate, se compara el **RID** (*Router ID*, el identificador del router que anunció) y otras cosas menores. Cuando llegás acá, en la práctica los caminos son equivalentes y BGP puede incluso usar varios a la vez.

> **HACELO VOS (la regla mnemotécnica del examen y de la vida):** recordá el **orden de acción**: "Weight y LocalPref primero (míos y de mi AS); después el AS-PATH; después el ORIGEN; después el MED". Y la dirección de la preferencia: **Weight/LocalPref = más alto gana; AS-Path = más corto gana; MED = más bajo gana.** Tres direcciones distintas, el 90% de los errores son confundir una con otra.

Un truco para no olvidar el orden: pensá en **quién manda**. Primero manda el router solo (Weight). Después manda la empresa (Local Preference). Después manda lo que el router mismo generó. Después manda el camino, medido en redes atravesadas. Después manda el origen del dato. Después manda el vecino, que solo sugiere. Y al final mandan los detalles físicos. De lo más político a lo más técnico: esa es la lógica profunda de la lista.

### 6.1. LocalPref vs MED: la confusión más cara de BGP (resuelta)

| Pregunta | Local-Pref | MED |
|----------|------------|-----|
| ¿Quién la usa? | **Mi** AS (para elegir SALIDA) | El **vecino** (para sugerir ENTRADA) |
| Dirección del tráfico | Tráfico que SALE | Tráfico que ENTRA |
| Valor preferido | Mayor mejor | Menor mejor |

Esta tabla contesta tres preguntas que separan a los dos atributos que más se confunden. La primera columna es la **pregunta**, y las otras dos son la respuesta para **Local-Pref** y para **MED**.

Fila por fila:

- **¿Quién la usa?** La Local-Pref la usa tu propio AS, y sirve para elegir por dónde **sale** tu tráfico. El MED lo usa el vecino: vos se lo mandás como sugerencia de por dónde **entrar** a tu red. Es la diferencia entre decidir en casa y pedir un favor afuera.
- **Dirección del tráfico.** Local-Pref gobierna el tráfico que sale de tu red hacia Internet. MED intenta influir en el tráfico que entra desde Internet hacia tu red.
- **Valor preferido.** Local-Pref: más alto es mejor. MED: más bajo es mejor. Otra vez, dos direcciones opuestas.

> **La regla de pulgar:** querés que tu tráfico salga por X → subís LocalPref en X. Querés que los vecinos entren por X (y no por Y) → bajás MED en X (o lo subís en Y). Una controla la salida, la otra persuade la entrada. Nunca mezcles las dos cuando diagnostiques "¿por qué sale/entra por allá?".

Y una advertencia que ahorra discusiones: el MED es **una sugerencia, no una orden**. El vecino puede ignorarlo, y de hecho muchos proveedores lo ignoran por defecto porque no quieren que un cliente les diga cómo enrutar su red. La Local-Pref, en cambio, es una orden adentro de tu AS: se cumple siempre.

### Resumen

- BGP desempata con una lista en orden estricto: se aplica el primer criterio que rompa el empate.
- El orden es Weight, Local Preference, ruta propia, AS-Path, ORIGIN, MED, eBGP sobre iBGP, costo IGP.
- Weight y Local-Pref: gana el número más alto. AS-Path: gana el más corto. MED: gana el más bajo.
- Local-Pref decide por dónde **sale** tu tráfico; MED sugiere por dónde **entra** el del vecino.
- El MED es una sugerencia que el vecino puede ignorar; la Local-Pref es una orden adentro de tu AS.

---

## 7. Las 3 reglas de iBGP que rompen cabezas

Dentro de tu AS, iBGP tiene tres reglas que parecen arbitrarias... hasta que ves el motivo:

### 7.1. Regla 1: Full Mesh obligatorio (o route reflectors)

```text
Regla: lo que aprendo por iBGP NO se lo re-anuncio a otro peer iBGP.
       (splithorizon de iBGP: "el rumor no vuelve a circular dentro del AS")

Consecuencia: para que TODOS tengan todo, cada router iBGP debe ser vecino
de TODOS los demás → FULL MESH (N routers = N×(N-1)/2 sesiones)
```

Este bloque enuncia la regla y su consecuencia, en dos partes separadas por una línea en blanco.

La primera parte es la regla: **lo que un router aprende por iBGP no se lo cuenta a otro vecino iBGP**. Se la llama *split horizon* de iBGP, que en español sería "horizonte partido": la información no vuelve a salir por donde entró. La frase entre paréntesis lo resume: el rumor no vuelve a circular dentro del AS.

La segunda parte es la consecuencia matemática: si nadie re-anuncia, entonces para que todos sepan todo, **cada router tiene que hablar directamente con todos los demás**. Eso es el **full mesh** ("malla completa"), y la fórmula `N×(N-1)/2` cuenta las sesiones necesarias para N routers.

Hacé la cuenta con números chicos y vas a ver el problema:

- 3 routers: 3 sesiones. Manejable.
- 5 routers: 10 sesiones. Todavía está bien.
- 10 routers: 45 sesiones. Empieza a molestar.
- 50 routers: 1.225 sesiones. Cada router mantiene 49 sesiones, y agregar uno obliga a tocar 50 configuraciones.

¿Por qué existe la regla? Para **impedir bucles en un AS**: el AS-PATH no cambia dentro del AS (mismo AS), así que no sirve para detectar bucles internos. El splithorizon de iBGP es la protección: "lo que entró por iBGP no sale por iBGP" → no hay ciclos.

Cuando el full mesh explota (50 routers = 1.225 sesiones), se usan **Route Reflectors** (un RR "refleja" el rumor a sus clientes, centralizando el full mesh). Es un capítulo avanzado — para este manual alcanza con saber que existe la solución al problema del full mesh.

Un **Route Reflector** es un router iBGP con permiso especial: puede re-anunciar lo que aprendió por iBGP a otros routers (sus "clientes"). Con eso, en lugar de una malla completa, alcanza con que cada router hable con uno o dos reflectores. La regla no se rompe: se le da permiso a un router de hacer la excepción de forma controlada.

### 7.2. Regla 2: el next-hop NO cambia (y el `next-hop-self`)

En iBGP el next-hop **sigue siendo el del eBGP original**:

```text
R1 (borde, eBGP con el ISP) aprende 203.0.113.0/24 con next-hop = 198.51.100.2 (el ISP)
R1 se lo anuncia a R2 (iBGP): el next-hop sigue siendo 198.51.100.2 (NO cambia)
R2 necesita RESOLVER 198.51.100.2... fuera de su área/seciencia → por IGP interno
```

Este bloque cuenta una situación en tres pasos. R1 es el router de borde: tiene una sesión eBGP con el proveedor y aprende una red (203.0.113.0/24) con un next-hop que pertenece al ISP (198.51.100.2).

El segundo paso es el hecho que sorprende: cuando R1 le cuenta esa ruta a R2 por iBGP, **no cambia el next-hop**. R2 recibe la ruta diciendo "para llegar a 203.0.113.0/24, mandá el paquete a 198.51.100.2". R2 nunca habló con el ISP: no sabe quién es esa dirección.

El tercer paso es el problema: para poder usar la ruta, R2 tiene que **resolver** ese next-hop, o sea encontrar en su tabla de rutas una entrada que le diga cómo llegar a 198.51.100.2. Y ahí está el detalle: esa dirección está afuera del AS, del otro lado del enlace de R1. La única forma de que R2 la alcance es que el protocolo interno (OSPF/IS-IS) le haya enseñado el camino hasta ahí.

**Resolver un next-hop** significa: buscar en la tabla de rutas la entrada que corresponde a esa dirección IP, para saber por qué interfaz mandar el paquete. Un router no puede usar una ruta BGP si no puede resolver su next-hop: la ruta existe en la tabla BGP pero no se instala en la tabla de rutas. Es una de las causas más comunes de "la sesión está arriba pero no hay rutas".

¿Por qué? Porque iBGP asume que "la ruta interna para llegar al borde la resuelve el IGP" (OSPF/IS-IS). Pero si R1 no redistribuye la red del next-hop... R2 no sabe cómo llegar. **La solución estándar: `neighbor X next-hop-self`** en el router de borde: fuerza a que el next-hop sea él mismo (R1), y R2 resuelve con el IGP.

> **Analogía:** el next-hop es la dirección de la puerta a la que hay que golpear. En eBGP, la puerta es la del país vecino y su dirección es la del funcionario de aduana. Cuando el dato pasa al interior del país, la dirección del funcionario extranjero sigue escrita, pero ningún camión sabe cómo llegar hasta ahí. `next-hop-self` es la orden de "poné mi dirección, que yo te recibo y hago el trámite".

### 7.3. Regla 3: la sincronización (legado — y la trampa de examen)

Históricamente, un router iBGP NO anunciaba a eBGP rutas iBGP-descubiertas si la ruta no estaba también en el IGP (evitaba "huecos negros" en redes viejas). Hoy, con el full mesh moderno y el next-hop-self, la regla de sincronización **está deshabilitada por defecto** y es irrelevante. Pero sigue apareciendo en exámenes viejos: sabé que existe, que se desactiva con `no synchronization`, y que en el 99% de las configs modernas ya está apagada.

Vale la pena entender qué era la **sincronización**, porque el razonamiento es instructivo. La idea era: si un router de borde anuncia a un AS vecino una red que aprendió por iBGP, pero el resto de su propio AS todavía no sabe cómo llegar a esa red, va a llegar tráfico que después se descarta adentro. Eso es un **hueco negro**: el paquete entra y desaparece. Para evitarlo, el router esperaba a que la ruta estuviera también en el IGP antes de anunciarla afuera.

Hoy ese problema no existe porque el IGP siempre conoce las direcciones de los routers del AS y el full mesh reparte todo. Pero el concepto de "hueco negro" sigue siendo útil: cuando diagnostiques un problema de tráfico que entra y no sale, pensá si alguien está anunciando algo que adentro no está resuelto.

### Resumen

- Lo que se aprende por iBGP no se re-anuncia a otro iBGP: es el split horizon del AS.
- Por eso todos los routers iBGP tienen que ser vecinos de todos: full mesh, N×(N-1)/2 sesiones.
- La solución a esa explosión de sesiones son los Route Reflectors.
- En iBGP el next-hop no cambia, y por eso el router de borde necesita `next-hop-self`.
- La regla de sincronización es legado: está apagada por defecto y solo aparece en exámenes viejos.

---

## 8. Configuración: eBGP e iBGP en 10 minutos

### 8.1. La topología

```text
  AS65001 (tuyo)                    AS65002 (ISP)
  R1 ─────────── R2              R3 ─────────── R4
  lo0 1.1.1.1    │               │              lo0 4.4.4.4
     iBGP (R1-R2)│               │
                 └─ eBGP ────────┘
                 10.0.0.0/30     (R2 = 10.0.0.2, R3 = 10.0.0.3)
```

Este bloque es el plano del laboratorio: cuatro routers, dos AS, un enlace entre ambos. Se lee de arriba hacia abajo.

La primera línea nombra las dos cajas: a la izquierda tu AS (65001, con R1 y R2); a la derecha el proveedor (65002, con R3 y R4). La segunda línea dibuja los enlaces horizontales: R1 está conectado con R2 (adentro de tu AS) y R3 con R4 (adentro del ISP).

La tercera línea dice qué hay en las **loopbacks**: `lo0` es la interfaz loopback 0, la dirección virtual que cada router se pone a sí mismo. R1 usa 1.1.1.1 y R4 usa 4.4.4.4. Esas direcciones no dependen de ningún cable: existen mientras el router esté encendido.

La cuarta línea nombra la sesión iBGP entre R1 y R2, y la quinta marca la sesión eBGP: las líneas verticales bajan de R2 y R3 y se unen en el medio. Ahí abajo está el dato de direccionamiento: la red entre R2 y R3 es **10.0.0.0/30**, o sea una red de cuatro direcciones, de las cuales se usan dos: R2 es 10.0.0.2 y R3 es 10.0.0.3. Una **/30** es la máscara tradicional para enlaces punto a punto: deja dos direcciones utilizables (una por router) más la de red y la de broadcast.

### 8.2. La configuración (los 4 pasos de oro)

```cisco
! R2 (el router de frontera de TU AS)
router bgp 65001
 bgp router-id 2.2.2.2
 neighbor 10.0.0.3 remote-as 65002          ! eBGP: el ISP (AS distinto)
 neighbor 1.1.1.1 remote-as 65001           ! iBGP: R1 (tu mismo AS)
 neighbor 1.1.1.1 update-source loopback 0  ! iBGP siempre sobre loopback (estable)
 neighbor 1.1.1.1 next-hop-self             ! Regla 2 resuelta: R1 aprende a llegar a R2 vía IGP
!
! ¿Qué anunciamos? Solo lo que esté en la TABLA DE RUTAS (¡ojo, igual que con OSPF!)
network 10.0.0.0 mask 255.255.255.252       ! la subred entre R2-R3 (sí, "mask" explícito)
network 192.168.1.0 mask 255.255.255.0      ! una red interna que querés anunciar al mundo
```

Este bloque es la configuración completa de R2, el router de borde de tu AS. Las líneas que empiezan con `!` son **comentarios**: el router las ignora, están para que un humano lea qué hace cada parte. La indentación de un espacio no es decorativa: marca que esas líneas están *dentro* del bloque de configuración de BGP.

Línea por línea:

- `router bgp 65001` abre el proceso BGP y declara **tu** ASN. Ojo: es el número de tu AS, no el del vecino.
- `bgp router-id 2.2.2.2` fija el **router ID**, el identificador del router dentro del proceso BGP. Se escribe como una dirección IP, pero no tiene por qué ser una dirección real de una interfaz (aunque se recomienda que lo sea, por claridad). Es el dato que aparece en todas las pantallas de verificación y el que desempata al final del capítulo 6.
- `neighbor 10.0.0.3 remote-as 65002` declara al vecino externo: "la dirección 10.0.0.3 es mi peer y pertenece al AS 65002". Como 65002 es distinto de 65001, esta sesión es **eBGP**.
- `neighbor 1.1.1.1 remote-as 65001` declara al vecino interno: "1.1.1.1 es mi peer y pertenece al AS 65001". Como es el mismo número, la sesión es **iBGP**.
- `neighbor 1.1.1.1 update-source loopback 0` dice que los paquetes de esa sesión salgan con la dirección de la loopback 0. Es lo que hace que la sesión no muera si se cae un cable, porque la loopback sigue existiendo.
- `neighbor 1.1.1.1 next-hop-self` resuelve la Regla 2: fuerza a que R2 anuncie las rutas con su propia dirección como next-hop, para que R1 no tenga que resolver una dirección del ISP.
- `network 10.0.0.0 mask 255.255.255.252` anuncia la subred del enlace entre R2 y R3. La máscara 255.255.255.252 es una **/30**, coherente con el plano de arriba.
- `network 192.168.1.0 mask 255.255.255.0` anuncia una red interna que querés que el mundo vea. La máscara 255.255.255.0 es una **/24**: 256 direcciones, de las cuales 254 se pueden asignar a equipos.

Mirá la simetría: R2 tiene dos vecinos, uno por cada modalidad, y por eso esta configuración enseña las dos caras de BGP en un solo router. Los dos vecinos se declaran con el mismo comando (`neighbor ... remote-as`) y es el **número** el que decide si la sesión es interna o externa.

### 8.3. La sintaxis explicada (los 3 misterios de BGP)

```text
router bgp 65001                ← el ASN PROPIO (≠ el AS de EIGRP de eBGP 65002: apunta al VECINO)
neighbor X remote-as Y          ← "X es mi vecino, y pertenece al AS Y"
neighbor X update-source loopback 0 ← iBGP: la sesión "vive" en la loopback (si una interfaz
                                  cae, la sesión no muere) — con el IGP garantizando el camino
neighbor X next-hop-self        ← Regla 2: R1 (iBGP) aprenderá next-hop = R2 (no el ISP)
network 10.0.0.0 mask ...       ← ¡DIFERENTE A OSPF! En BGP, "network" NO activa interfaces:
                                  ANUNCIA un prefijo que YA está en la tabla de rutas.
                                  Si no está en la tabla → no se anuncia (y no "aparece")
```

Este bloque traduce los cinco comandos a lenguaje llano, uno por línea. La flecha `←` separa el comando de su explicación; en las líneas que ocupan dos renglones, la explicación continúa abajo alineada.

Se lee así:

- `router bgp 65001` entra al proceso BGP con **tu** número de AS. La aclaración entre paréntesis avisa que no se confunda con el número del vecino: el 65002 del ejemplo es de la otra punta del cable.
- `neighbor X remote-as Y` declara un vecino en la dirección X, perteneciente al AS Y. Es el comando que crea la sesión; sin él, el router no sabe que el otro existe.
- `neighbor X update-source loopback 0` hace que la sesión viva en la loopback, para que no se caiga si se cae una interfaz física. La condición es que el IGP garantice el camino hacia esa loopback.
- `neighbor X next-hop-self` fuerza a que el next-hop anunciado sea este router, resolviendo el problema del capítulo 7.2.
- `network 10.0.0.0 mask ...` es el comando más traicionero, y el bloque lo dice con todas las letras: en BGP, `network` **no activa interfaces** como en OSPF; **anuncia un prefijo que ya está en la tabla de rutas**.

> **La trampa clásica de BGP (`network`):** en OSPF, `network` matchea interfaces y las mete al proceso. En BGP, `network` **declara qué prefijos de mi tabla de rutas voy a anunciar**. Si el prefijo no está en la tabla (o no se alcanza exacto), BGP no anuncia NADA — y no da error visible. Diagnóstico: `show ip bgp` sin la ruta, o en "not in table".

Esta es la diferencia que más tiempo hace perder a los principiantes, así que vale la pena decirla de tres formas distintas. En OSPF, `network` significa "esta interfaz participa". En BGP, `network` significa "este prefijo, que ya sé alcanzar, lo publico". Y la tercera: en OSPF, si te equivocás, el vecino no aparece; en BGP, si te equivocás, **el vecino aparece igual de contento** y simplemente no recibe nada. Silencio, no error.

La verificación mental es simple: antes de escribir `network`, preguntate "¿esta red está en mi tabla de rutas, con esta máscara exacta?". Si la respuesta es no, primero hay que hacer que esté (por una ruta estática, por una interfaz conectada o por el IGP) y recién después anunciarla.

### 8.4. eBGP multihop (el caso "vecino no directo")

```text
router bgp 65001
 neighbor 10.0.0.3 remote-as 65002
 neighbor 10.0.0.3 ebgp-multihop 2    ← permite que eBGP salte más de 1 hop (default TTL=1)
 neighbor 10.0.0.3 update-source loopback 0  ← con multihop, la sesión puede vivir en loopbacks
```

Este bloque muestra el caso en el que el vecino externo **no está a un salto**. Es la misma configuración de antes, con una línea nueva: `ebgp-multihop 2`.

Se lee así: se abre el proceso BGP del AS 65001, se declara el vecino 10.0.0.3 del AS 65002, se le permite saltar hasta dos routers (`ebgp-multihop 2`) y se le dice que la sesión salga desde la loopback 0.

Las dos anotaciones del bloque explican el porqué: eBGP por defecto usa TTL 1, así que el paquete muere en el primer router que lo recibe; `ebgp-multihop 2` sube ese límite para que la sesión pueda cruzar routers intermedios. Y `update-source loopback 0` tiene sentido justamente cuando hay multihop: si la sesión vive en loopbacks, el camino entre ellas lo resuelve el IGP.

> **Regla del eBGP default:** el eBGP clásico asume que el vecino está a **un salto** (TTL=1). Si lo definís con `update-source loopback` (para estabilidad), necesitás `ebgp-multihop` con el TTL suficiente. Sin eso, la sesión no sube — "estoy enviando a un vecino a 2 saltos y el vecino no responde".

Un detalle práctico: `ebgp-multihop 2` significa "permití hasta 2 saltos", no "usá TTL 2 exactamente". Si el camino real es más largo, hay que subir el número. Y si ponés un número grande sin necesidad, estás abriendo la puerta a que alguien de más lejos intente hablar BGP con vos, así que se pone el mínimo necesario.

### Resumen

- El laboratorio mínimo tiene dos AS, dos routers por AS y un enlace entre los bordes.
- La configuración de un borde son cuatro cosas: `router bgp`, `neighbor ... remote-as`, `update-source` y `next-hop-self`.
- En BGP, `network` anuncia un prefijo que ya está en la tabla de rutas; no activa interfaces.
- La loopback da estabilidad a la sesión; para iBGP se usa siempre.
- Si el vecino externo no está a un salto, hace falta `ebgp-multihop`.

---

## 9. ¿Por qué no usar BGP para todo? El caso de uso honesto

Pregunta que TODOS se hacen en clase: "¿por qué no reemplazo OSPF por BGP y listo?" Respuesta honesta:

| Criterio | OSPF/IS-IS (IGP) | BGP (EGP) |
|----------|------------------|-----------|
| Objetivo | Convergencia rápida + métrica | Política + estabilidad |
| Convergencia | Segundos | **Minutos** (los timers y la cautela) |
| Auto-descubrimiento | Sí (Hello) | **NO**: cada vecino se configura a mano |
| Métrica | Costo/BW | **No hay "métrica de red"**: solo política |
| Uso típico | Dentro del AS | Entre AS y en el borde |
| "Escala" | Hasta miles de routers | El ENTERO de Internet |

Esta tabla compara los dos mundos por seis criterios. La primera columna nombra el **criterio**; las otras dos dan el valor para un protocolo interno (OSPF/IS-IS) y para BGP.

Fila por fila:

- **Objetivo.** El IGP busca converger rápido y elegir el mejor camino según una métrica. BGP busca hacer cumplir una política y mantenerse estable.
- **Convergencia.** La **convergencia** es el momento en que todos los routers ya coinciden en cómo llegar a cada destino. En el IGP es cuestión de segundos; en BGP es cuestión de minutos, porque los timers son largos y el protocolo es deliberadamente cauto.
- **Auto-descubrimiento.** El IGP descubre vecinos solo, con un saludo periódico (el **Hello**). BGP no: cada vecino se configura a mano en los dos extremos.
- **Métrica.** El IGP mide con costo o ancho de banda (**BW**, *bandwidth*). BGP no tiene una métrica de red comparable: tiene atributos de política.
- **Uso típico.** El IGP vive adentro del AS; BGP vive entre AS y en el borde.
- **Escala.** El IGP escala a miles de routers dentro de una organización. BGP escala a Internet entera, con cientos de miles de rutas.

> **La conclusión profesional (sección 11 del mercado real):** BGP se usa en el **borde**: para conectar tu AS con el ISP (default route o tablas parciales), para multi-homing (dos ISP, redundancia con política: "por acá salen los videos, por allá el resto"), y para peering entre ISP. **Dentro** de tu red, seguís usando OSPF/IS-IS/EIGRP: rápido, auto-descubrible, con métrica real. BGP no reemplaza al IGP: lo acompaña en la frontera.

Dos palabras de esa conclusión que conviene definir, porque son las que aparecen en las ofertas de trabajo:

- **Multi-homing** es tener más de una conexión a Internet (por ejemplo, dos proveedores distintos). BGP es lo que permite usar las dos a la vez y decidir, con política, qué tráfico sale por cuál. Si se cae uno, el otro sigue.
- **Peering** es el acuerdo entre dos redes para intercambiarse tráfico directamente, sin pasar por un tercero que cobre. Es lo que hacen los proveedores entre sí para ahorrar tránsito y mejorar la latencia.

Una **ruta por defecto** es la ruta comodín: "todo lo que no sepa, mandalo por acá". Es lo que suele tener una empresa que se conecta a un solo proveedor: no necesita la tabla completa de Internet, le alcanza con saber que todo sale por el ISP. La alternativa es recibir **tablas parciales** o la tabla completa, que hoy son cientos de miles de rutas y requieren routers con memoria de sobra.

### Resumen

- BGP no reemplaza al IGP: convergen en minutos, no descubren vecinos solos y no tienen métrica de red.
- El IGP es para adentro: rápido, automático, con métrica real.
- BGP es para el borde: conectar con el ISP, multi-homing, peering.
- La ruta por defecto es el atajo para quien tiene un solo proveedor y no necesita la tabla completa.
- Combinar los dos —IGP adentro, BGP en la frontera— es el diseño estándar de una red profesional.

---

## 10. Verificación: cómo leer a BGP

```text
R1# show ip bgp summary
BGP router identifier 2.2.2.2, local AS number 65001
Neighbor    V   AS  MsgRcvd  MsgSent  TblVer  InQ OutQ  Up/Down  State/PfxRcd
10.0.0.3     4 65002     123     121      17    0    0 00:12:34     2  ← eBGP OK, 2 prefijos
1.1.1.1      4 65001      89      90      17    0    0 00:11:02     1  ← iBGP OK
                    │                      │                 │        └─ Estado del vecino
                    └─ Estado que importa:     └─ Tabla estable    ("2" = 2 rutas recibidas)
                       en "State/PfxRcd" los
                       estados son: Idle → Connect → Active…
                       → OpenSent → OpenConfirm → ESTABLISHED
```

Este bloque es la pantalla que más vas a mirar en tu vida con BGP: `show ip bgp summary` ("mostrame el resumen de BGP"). Se lee en tres partes.

**Las dos primeras líneas** identifican al router: su **router identifier** (2.2.2.2) y su **local AS number** (65001). Sirven para confirmar que estás parado en el router correcto y en el proceso correcto.

**La tercera línea** es el encabezado de la tabla, y cada columna tiene un significado:

- `Neighbor`: la dirección IP del vecino. Es lo que configuraste con `neighbor`.
- `V`: la versión de BGP. 4 es la actual (BGP-4).
- `AS`: el ASN del vecino. Comparalo con el tuyo: si es distinto, la sesión es eBGP; si es igual, iBGP.
- `MsgRcvd` y `MsgSent`: cuántos mensajes recibiste y enviaste. Si los dos números crecen con el tiempo, la sesión está viva.
- `TblVer`: la versión de la tabla BGP. Cambia cuando entra o sale una ruta.
- `InQ` y `OutQ`: colas de entrada y salida. En cero es sano; un número que crece indica que el router no da abasto.
- `Up/Down`: cuánto tiempo lleva la sesión en ese estado.
- `State/PfxRcd`: la columna estrella. Si dice **ESTABLISHED**, muestra la cantidad de prefijos recibidos; si dice otra cosa, muestra el estado del problema.

**Las dos filas de datos** son los dos vecinos del ejemplo: el externo (10.0.0.3, AS 65002) con 2 prefijos recibidos, y el interno (1.1.1.1, AS 65001) con 1 prefijo. Las anotaciones con `│`, `└─` y `←` no son parte de la salida del router: son las flechas del manual que señalan qué mirar.

Un **prefijo** es una red escrita como dirección más máscara (por ejemplo, 203.0.113.0/24). Cuando la columna `State/PfxRcd` muestra un número, ese número es la cantidad de prefijos que ese vecino te está anunciando. Cero en esa columna, con la sesión arriba, es la señal de alarma del capítulo 11: la sesión funciona pero no hay nada que anunciar o nada que aceptar.

**La escala de estados (la leés en "State/PfxRcd"):**

```text
Idle → Connect → Active → OpenSent → OpenConfirm → ESTABLISHED
  └─ fases de "levantar la sesión TCP" (BGP usa TCP 179)
  ESTABLISHED con un número = TODO BIEN (las rutas están fluyendo)
  "Active" o "Idle" o "Established sin prefijos" = problema (sección 11)
```

Este bloque es la escalera de estados por la que pasa una sesión BGP desde cero hasta funcionar. Se lee de izquierda a derecha, como una línea de tiempo.

Los estados, uno por uno:

- **Idle** ("inactivo"): el router todavía no intentó nada. Es el punto de partida.
- **Connect** ("conectar"): está intentando abrir la conexión TCP.
- **Active** ("activo"): ojo con el nombre, porque engaña — **no** significa "todo bien". Significa que el intento anterior falló y está reintentando. Es el estado del problema, no de la salud.
- **OpenSent** ("apertura enviada"): mandó el mensaje OPEN y espera la respuesta del vecino.
- **OpenConfirm** ("apertura confirmada"): recibió la respuesta y está terminando de negociar parámetros.
- **ESTABLISHED** ("establecida"): la sesión está arriba y las rutas fluyen. Es el único estado bueno.

Las tres líneas de anotación (la que empieza con `└─` y las dos siguientes) explican que estos estados son las fases de levantar la sesión TCP, que ESTABLISHED con un número es la señal de que todo funciona, y que "Active", "Idle" o "Established sin prefijos" son problema.

```text
R1# show ip bgp
BGP table version is 17...
     Network          Next Hop            Metric LocPrf Weight Path
 *   203.0.113.0/24   10.0.0.3                 0         32768 i      ← eBGP del ISP
 *>i 192.168.1.0/24   1.1.1.1                  0    100      0 i      ← iBGP (LocPrf 100, "*>" = mejor)
```

Este bloque es la tabla BGP propiamente dicha: `show ip bgp` muestra todas las rutas que el router conoce por BGP. La primera línea dice la versión de la tabla; la segunda es el encabezado de columnas.

Las columnas:

- `Network`: el prefijo (la red) de destino.
- `Next Hop`: la dirección a la que hay que mandar el paquete para llegar por ese camino.
- `Metric`: la métrica. En BGP casi siempre aparece en 0, porque BGP no usa una métrica de red como OSPF; el número real de decisión está en los otros atributos.
- `LocPrf`: la Local Preference. En el ejemplo, la ruta iBGP tiene 100 (el valor por defecto) y la eBGP no muestra valor.
- `Weight`: el peso local. La ruta eBGP muestra 32768, que es el valor con el que Cisco marca las rutas que el propio router origina o aprende de un vecino externo.
- `Path`: el AS-PATH. La `i` al final es el atributo ORIGIN: `i` de *IGP* (la ruta nació adentro de un AS), `e` de *EGP* y `?` de *incomplete*. La ruta con `100` en el medio del Path es una ruta que pasó por el AS 100.

Y las tres marcas de la izquierda, que son las que más se ignoran y más importan:

- `*` (asterisco): la ruta es válida, o sea que el next-hop se puede resolver y la ruta se puede usar.
- `>` (mayor): es la **mejor** ruta hacia ese destino, la que el router eligió y va a instalar en la tabla de rutas.
- `i`: en esa posición, indica que la ruta se aprendió por **iBGP**. En la columna Path, la misma letra significa ORIGIN. Misma letra, dos posiciones, dos significados: fijate en qué columna está.

En el ejemplo, la segunda línea dice `*>i`: ruta válida, mejor, aprendida por iBGP. Es la que el router va a usar.

| Comando | Qué te dice |
|---------|-------------|
| `show ip bgp summary` | Estado de cada vecino + cantidad de prefijos recibidos (ESTABLISHED = sano) |
| `show ip bgp` | La tabla BGP completa: rutas, next-hop, LocPrf, Weight, AS-Path |
| `show ip bgp <red>` | Análisis de UNA ruta: atributos y caminos disponibles |
| `show ip bgp neighbors 10.0.0.3` | Detalle de sesión: timers, capabilities, mensajes, estados |

Esta tabla es la lista de comandos de verificación: en la primera columna el **comando**, en la segunda **qué te dice**. Con estos cuatro se diagnostica casi todo.

- `show ip bgp summary` es el primer comando que se corre siempre: da el estado de todos los vecinos de un vistazo y la cantidad de prefijos recibidos por cada uno. Si todos dicen un número, la sesión está sana. Si alguno dice Idle o Active, el problema está en la sesión, no en las rutas.
- `show ip bgp` muestra la tabla completa. Sirve para ver si un prefijo llegó, por qué camino y con qué atributos. Es la pantalla del bloque anterior.
- `show ip bgp <red>` enfoca una sola red: muestra todos los caminos disponibles hacia ella y los atributos de cada uno. Es el comando para contestar "¿por qué eligió este camino y no el otro?".
- `show ip bgp neighbors 10.0.0.3` muestra el detalle de una sesión: los timers, las capacidades negociadas, el conteo de mensajes y el último error. Es el comando al que se va cuando el resumen no alcanza.

Un **timer** es un cronómetro interno del protocolo; en BGP los importantes son el *keepalive* (cada cuánto manda el "sigo acá") y el *hold time* (cuánto espera antes de declarar caído al vecino). Y **capabilities** son las capacidades que los dos routers negocian al abrir la sesión, como la familia de direcciones (IPv4, IPv6) o funcionalidades opcionales.

### Resumen

- `show ip bgp summary` es el primer comando: muestra estado y cantidad de prefijos por vecino.
- ESTABLISHED con un número es la única señal de salud; Active, Idle o cero prefijos son problema.
- Los estados van de Idle a ESTABLISHED pasando por Connect, Active, OpenSent y OpenConfirm.
- `show ip bgp` muestra la tabla con next-hop, LocPrf, Weight y AS-Path; `*` es válida y `>` es la mejor.
- `show ip bgp <red>` y `show ip bgp neighbors` son los comandos de detalle cuando hay que diagnosticar.

---

## 11. Los 5 errores más comunes

| # | Error | Síntoma | Fix |
|---|-------|---------|-----|
| 1 | **ASN mal en `remote-as`** (invertido) | La sesión nunca queda ESTABLISHED (rebota entre Connect/Active) | `neighbor X remote-as <AS DEL VECINO>`, no el tuyo |
| 2 | **`network ... mask` de un prefijo que NO está en la tabla de rutas** | Sesión ESTABLISHED pero 0 prefijos anunciados (¡sin error!) | Verificar que el prefijo exista en `show ip route` (exacto) |
| 3 | **iBGP sin full mesh / sin next-hop-self** | Rutas que faltan en R1: no se re-anuncian (Regla 1) o next-hop irresoluble (Regla 2) | Full mesh o route reflector; `next-hop-self` en los bordes |
| 4 | **eBGP con loopback sin `ebgp-multihop`** | Sesión nunca sube (TTL=1 por defecto) | `ebgp-multihop 2` + `update-source loopback` |
| 5 | **Firewall/ACL bloqueando TCP 179** | Sesión en "Active" eterno (BGP necesita la sesión TCP) | Permitir TCP 179 hacia/desde los peers |

Esta tabla es la lista de los cinco errores que explican casi todas las sesiones BGP que no levantan. Tiene cuatro columnas: el **número**, el **error**, el **síntoma** (lo que ves en pantalla) y el **fix** (cómo se arregla).

Fila por fila:

1. **ASN mal en `remote-as`.** Es el error más común de todos: poner tu propio ASN en el `remote-as` del vecino, o poner el del vecino equivocado. El síntoma es claro: la sesión rebota entre Connect y Active y nunca queda ESTABLISHED. La regla es simple: en `remote-as` va **el AS del vecino**, no el tuyo. Tu ASN va en `router bgp`.
2. **`network` de un prefijo que no está en la tabla.** El síntoma es el más traicionero de la serie: la sesión está ESTABLISHED y no hay ningún error, pero el vecino recibe cero prefijos. BGP no inventa rutas: solo anuncia lo que ya sabe alcanzar. La verificación es mirar `show ip route` y comprobar que el prefijo está, con la máscara exacta.
3. **iBGP sin full mesh o sin next-hop-self.** Las rutas faltan en algunos routers: o no se re-anuncian por el split horizon de iBGP, o llegan pero el next-hop no se puede resolver. El fix es la malla completa (o un Route Reflector) y `next-hop-self` en los bordes.
4. **eBGP con loopback sin `ebgp-multihop`.** Configuraste la sesión sobre loopbacks para tener estabilidad, pero el TTL por defecto de eBGP es 1 y los paquetes mueren en el primer salto. El fix es `ebgp-multihop` con el número de saltos necesario.
5. **Firewall o ACL bloqueando TCP 179.** BGP necesita una sesión TCP, y si un filtro bloquea el puerto 179 en cualquier dirección, la sesión queda en "Active" para siempre. Una **ACL** (*Access Control List*) es una lista de reglas que dice qué tráfico pasa y qué se descarta; el fix es permitir TCP 179 entre los peers, en los dos sentidos.

> **El error #2 es el más traicionero de la serie:** ESTABLISHED con cero prefijos. No hay mensaje de error: BGP simplemente "no tiene qué anunciar". La sesión está viva y tu ruta no se anuncia porque el prefijo no está en la tabla. Verificá SIEMPRE con `show ip bgp` si el prefijo aparece (o figura "not in table") antes de tocar timers o ACLs.

Un método para no perder tiempo, en orden: primero `show ip bgp summary` (¿la sesión está arriba?). Si no está, el problema es de sesión: ASN, direcciones, TTL, firewall. Si está arriba, `show ip bgp` (¿los prefijos están?). Si no están, el problema es de anuncio o de filtro: `network`, tabla de rutas, políticas. Con ese orden se resuelve el 90% de los casos sin adivinar.

### Resumen

- El error más común es poner mal el ASN en `remote-as`: va el del vecino, no el tuyo.
- La trampa clásica es `network` de un prefijo que no está en la tabla: cero anuncios y cero errores.
- iBGP necesita full mesh (o reflectores) y `next-hop-self` en los bordes.
- eBGP sobre loopbacks necesita `ebgp-multihop`, porque el TTL por defecto es 1.
- Si un firewall bloquea TCP 179, la sesión queda en Active para siempre.

---

## 12. Comprobá lo que aprendiste

Ocho preguntas. Tapá la respuesta, contestá en voz alta y recién después compará.

**1. ¿Cuál es la diferencia esencial entre BGP y los protocolos de red interna?**

**Ver respuesta:** Los IGPs (OSPF/EIGRP/IS-IS) eligen por MÉTRICA (más corto/rápido). BGP elige por **POLÍTICA**: los atributos (Weight, LocalPref, AS-Path, MED) son reglas administrativas/comerciales sobre "por dónde conviene". Es dinero y preferencia convertidos en protocolo.

**2. ¿Qué es el AS-PATH y qué resuelve?**

**Ver respuesta:** Es la lista completa de AS por los que pasa el anuncio (el "vector" del path vector). Resuelve: (a) detección de bucles instantánea (si tu AS aparece en el path, descartás el anuncio) y (b) política por actor y evaluación de "directura" (path más corto gana en la regla 4).

**3. ¿Qué es eBGP y qué es iBGP? ¿Y sus AD?**

**Ver respuesta:** eBGP = sesión entre AS distintos (vecino con otro ASN), AD 20, next-hop cambia, TTL=1. iBGP = dentro del mismo AS, AD 200, next-hop NO cambia (por eso next-hop-self), TTL multi-hop (loopbacks), y splithorizon propio (no se reanuncia iBGP a iBGP → full mesh).

**4. Ordená los pasos principales de la selección de camino BGP.**

**Ver respuesta:** 1. Mayor Weight → 2. Mayor Local-Pref → 3. Originadas por el router → 4. AS-Path más corto → 5. Mejor Origin → 6. Menor MED → 7. eBGP antes que iBGP → 8. Menor costo IGP al next-hop. Preferencias: Weight/LocalPref más alto, AS-Path más corto, MED más bajo.

**5. LocalPref vs MED: ¿quién la usa y con qué tráfico?**

**Ver respuesta:** LocalPref la usa MI AS para elegir SALIDA (más alto mejor). MED la usa el VECINO para persuadir la ENTRADA (más bajo mejor). No mezclarlas al diagnosticar: una controla por dónde sale mi tráfico, la otra por dónde entra el del vecino.

**6. ¿Por qué iBGP necesita full mesh?**

**Ver respuesta:** Por el splithorizon de iBGP: lo aprendido por iBGP no se reanuncia a otro iBGP (protección contra bucles dentro del AS, donde el AS-PATH no ayuda). Consecuencia: todos deben ser vecinos de todos (N×N). La escala de eso se resuelve con Route Reflectors.

**7. ¿Qué hace `network ... mask` en BGP (vs OSPF)?**

**Ver respuesta:** En BGP NO activa interfaces: **anuncia un prefijo que ya está en la tabla de rutas** (con esa máscara exacta). Si el prefijo no está en la tabla, no se anuncia y no hay error visible — la trampa clásica.

**8. ¿Por qué no usar BGP en lugar del IGP dentro de mi red?**

**Ver respuesta:** Porque BGP no descubre vecinos (todo manual), no tiene métrica de red (solo política), y converge en MINUTOS (los IGPs en segundos). BGP es para el borde y la interconexión; el IGP sigue siendo el corazón rápido de la red.

Si contestaste bien la 1, la 4 y la 7, ya tenés el manual entero: por qué BGP es distinto, cómo elige y dónde está la trampa de configuración. El resto son variaciones de esas tres ideas.

### Resumen

- Las ocho preguntas cubren el porqué de BGP, el AS-PATH, eBGP/iBGP, la selección de camino y `network`.
- Si contestás bien la 1, la 4 y la 7, tenés lo esencial del manual.
- La respuesta corta de casi todas: BGP elige por política y no descubre nada solo.
- Cuando dudes, volvé al capítulo del tema antes que memorizar la respuesta.

---

## 13. Glosario

| Término | Qué es |
|---------|--------|
| **AS / ASN** | Sistema Autónomo: conjunto de redes bajo una administración/política única, con su número (1-64511 públicos, 64512-65535 privados) |
| **Path Vector** | Familia de BGP: guarda la lista completa de AS del camino (AS-PATH), no solo destino+distancia |
| **eBGP / iBGP** | Sesión entre AS distintos (AD 20) / dentro del mismo AS (AD 200) |
| **AS-PATH** | La cadena de AS que atraviesa el anuncio: loop prevention + preferencia (más corto gana) |
| **WEIGHT** | Preferencia local a un router (Cisco): mayor mejor |
| **LOCAL_PREF** | Preferencia de salida de todo el AS: mayor mejor |
| **MED** | Sugerencia de entrada del vecino: menor mejor |
| **Next-hop-self** | Fuerza que el next-hop de iBGP sea el router de borde (resuelve la Regla 2) |
| **Full mesh / RR** | Obligación de iBGP (todos con todos) y su solución (Route Reflector) |
| **Estados BGP** | Idle→Connect→Active→OpenSent→OpenConfirm→ESTABLISHED |
| **TCP 179** | El transporte de BGP: sesión TCP (por eso los firewalls lo bloquean) |

Esta tabla es el diccionario del manual: dos columnas, el **término** y **qué es**, en una línea. Los primeros cuatro son los que aparecen en cualquier examen; los últimos son los que necesitás cuando estás frente a un router de verdad.

- **AS / ASN** ya lo sabés del capítulo 2: el país y su número de pasaporte.
- **Path Vector** es la familia: la lista de AS en lugar de un mapa.
- **eBGP / iBGP** son las dos caras del capítulo 4, con sus dos AD.
- **AS-PATH** es la etiqueta de origen, que detecta bucles y sirve para preferir.
- **WEIGHT** y **LOCAL_PREF** son las dos preferencias "más alto mejor".
- **MED** es la sugerencia del vecino, "más bajo mejor".
- **Next-hop-self** es el comando que arregla la Regla 2.
- **Full mesh / RR** es el problema de escala de iBGP y su solución.
- **Estados BGP** es la escalera del capítulo 10.
- **TCP 179** es el motivo por el cual un firewall puede romper BGP sin que nadie entienda qué pasó.

> **Nota de una línea sobre la fila de ASN:** el rango privado termina en 65534; el 65535 está reservado. La tabla repite el rango del original, y el detalle fino está en el aviso del capítulo 2.3.

### Resumen

- El glosario es el diccionario del manual: término y definición en una línea.
- Los cuatro primeros términos son los de examen; los últimos, los del router real.
- TCP 179 es la razón por la que un firewall rompe BGP en silencio.
- Si no podés explicar un término con tus palabras, volvé al capítulo donde aparece.

---

## 14. Resumen en 10 puntos

1. **BGP es el protocolo de Internet**: interconecta sistemas autónomos; lo demás (OSPF/EIGRP/IS-IS) vive DENTRO del AS.
2. **Tercera familia**: path vector — la lista completa de AS (AS-PATH) en cada anuncio; bucle = "tu AS aparece".
3. **eBGP (AD 20) entre AS; iBGP (AD 200) dentro del AS** — dos caras, reglas distintas (next-hop, full mesh).
4. **Los atributos son la moneda de la política**: Weight y LocalPref (más alto), AS-Path (más corto), MED (más bajo).
5. **Solamente el path selection en orden decide**: Weight → LocalPref → origen → AS-Path → origin → MED → eBGP → IGP.
6. **LocalPref controla SALIDA; MED persuade ENTRADA** — no se mezclan al diagnosticar.
7. **iBGP: no re-anuncio iBGP a iBGP** → full mesh (o route reflectors); next-hop no cambia (→ `next-hop-self`).
8. **Config**: `router bgp <ASN>` + `neighbor X remote-as Y` + anunciar con `network ... mask` SOLO prefijos que ya están en la tabla.
9. **eBGP default TTL=1**: si usás loopbacks, `ebgp-multihop`; y siempre revisá TCP 179 en los firewalls.
10. **No reemplaza al IGP**: BGP es el borde (multi-homing, peering); el IGP es el corazón. Saber elegir y combinar = nivel senior.

Leé esta lista como el índice al revés: cada punto condensa un capítulo. Si te llevás uno solo, llevate el 1: BGP es el pegamento entre redes que no confían entre sí. Todo lo demás —atributos, reglas, comandos— es cómo se administra esa desconfianza.

La frase que resume el manual en una línea: **el IGP pregunta cuál es el camino más rápido; BGP decide cuál es el camino que le conviene a cada red.** Y cuando las dos preguntas conviven en el mismo router, el orden lo pone la distancia administrativa: el borde manda con BGP, el interior resuelve con el IGP.

### Resumen

- BGP une sistemas autónomos; los IGP resuelven el interior de cada uno.
- Elige por atributos: Weight y LocalPref más alto, AS-Path más corto, MED más bajo.
- eBGP es externo (AD 20) y iBGP interno (AD 200), con reglas de next-hop y full mesh propias.
- La configuración es corta, pero `network` solo anuncia lo que ya está en la tabla de rutas.
- Verificá siempre con `show ip bgp summary`: ESTABLISHED con prefijos es la única señal de salud.

---

> **Fuente:** Documentación propia basada en RFC 4271 (BGP-4), RFC 1997 (BGP communities), CCNA 200-301 Official Cert Guide (W. Odom), Cisco IOS Configuration Guides y material educativo de redes.

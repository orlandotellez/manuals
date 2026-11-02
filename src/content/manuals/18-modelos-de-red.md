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

Ese índice es el mapa del manual. Cada entrada te lleva a un capítulo con su propio título, y los títulos no cambian nunca: son parte de la dirección de la página en internet. Si alguien te pasa un enlace que termina en `#7-la-capa-de-transporte-tcp-y-udp`, cae justo en el capítulo de transporte.

### Resumen

- El manual se lee en orden la primera vez: cada capítulo usa lo que explicó el anterior.
- Los títulos de los capítulos son fijos, así que los enlaces que ya circulan siguen funcionando.
- Si venís con apuro, el capítulo 10 (encapsulación) y el 11 (el viaje del paquete) son el corazón.

---

## 1. El problema que resuelven los modelos

### 1.1. La torre de Babel de las redes

Imaginá el año 1980. Cada fabricante de computadoras tenía su propia forma de conectar sus equipos: sus propios cables, sus propias señales, su propio "idioma". La máquina de la empresa A no podía hablar con la de la empresa B, y si lo hacía, era a los gritos y con acento — cuando no se rompía en el intento.

Antes de seguir, una palabra que vas a ver doscientas veces: **protocolo**. Un protocolo es un conjunto de reglas acordadas sobre cómo se habla. No es un programa ni un cable: es el acuerdo. Define quién habla primero, qué forma tiene el mensaje, qué significa cada campo, qué se responde y qué se hace cuando no hay respuesta. Dos equipos pueden ser de marcas distintas y hasta enemigas, pero si respetan el mismo protocolo se entienden igual que dos personas que hablan castellano.

Conectar computadoras entre sí no es un problema de un solo paso. Es una cadena larguísima de decisiones:

- ¿Cómo se representa un 1 y un 0 en el cable?
- ¿Cómo sé que ese grupo de bits viene de tu máquina y no de otra?
- ¿Cómo hago para que mi mensaje atraviese diez redes distintas y llegue a la máquina correcta?
- ¿Cómo me doy cuenta si un dato se perdió en el camino y lo pido de nuevo?
- ¿Y si quiero que dos programas distintos usen la red a la vez?

Cada una de esas preguntas es, en realidad, un problema separado, con sus propias soluciones y sus propios especialistas. El primero es un problema de electricidad y de física. El segundo es un problema de identidad (¿quién es quién?). El tercero es un problema de mapas y direcciones. El cuarto es un problema de confiabilidad. El quinto es un problema de reparto: varios programas compartiendo una sola conexión sin pisarse.

Si cada fabricante resolvía todo eso a su manera, teníamos la torre de Babel: **nadie se entendía con nadie**.

> **Idea central de este manual:** los modelos de red son el **acuerdo de cómo se habla**. Dividen la comunicación en **capas**, y a cada capa le asignan una responsabilidad clara. Cuando todos respetan el mismo acuerdo, cualquier equipo puede hablar con cualquier otro — aunque lo fabriquen empresas distintas y a miles de kilómetros.

### 1.2. La analogía que ordena todo: mandar una carta

Antes de ver ningún modelo, mirá algo que ya entendés: mandar una carta por correo. No hace falta saber nada de redes para seguir esta historia, y sin embargo adentro tiene todas las piezas.

Vos escribís la carta:

1. **Escribís el texto.** Decidís qué querés decir y en qué idioma. Esto es tuyo, nadie más lo toca.
2. **La ponés en un sobre y escribís la dirección.** Arriba va el destinatario: calle, número, ciudad, país. En el otro extremo va tu dirección, el remitente, para que sepa quién la mandó y para que vuelva si no la pueden entregar.
3. **La llevás a la sucursal.** Ahí una oficina de clasificación la mira, la agrupa con las cartas que van para la misma zona y decide por qué ruta la manda. Si hay tres caminos posibles hacia esa ciudad, elige uno.
4. **Viaja en un camión.** O en un avión, o en una moto. Alguien la transporta físicamente por rutas, peajes y calles.
5. **En la ciudad de destino, un cartero la entrega.** El cartero del barrio conoce cada casa: sabe que el número 445 de esa calle es este edificio y no el de al lado. La deja en la mano correcta.

Ahora fijate en lo más importante de toda esta historia: **nadie hace todo el trabajo, y nadie necesita saber lo que hacen los demás**.

- Vos no sabés, ni te importa, qué camión va a llevar tu carta. Ni siquiera sabés si va en camión.
- El camionero no abre tu carta ni lee lo que escribiste. Maneja.
- El de la oficina de clasificación no entiende el contenido: solo mira la dirección y lo manda para el lado correcto.
- El cartero no necesita hablar tu idioma. Solo necesita encontrar la casa.
- Si la carta se pierde, hay un procedimiento para reclamar que no obliga a todos los demás empleados a cambiar su forma de trabajar.

Cada uno hace **una** cosa, la hace bien, y le pasa el resultado al siguiente. Y si algo sale mal, sabés en qué mano buscar el problema: ¿la dirección estaba bien escrita? ¿El camión llegó? ¿El cartero se equivocó de puerta?

Eso, exactamente eso, es lo que hace un modelo de capas con una red.

### 1.3. De la carta a la red: quién hace cada trabajo

Traducí la historia de la carta a la red y ya tenés el mapa completo de este manual:

- **Lo que querés decir** (el texto de la carta) es el **dato**: el pedido de una página web, un mensaje, una foto.
- **El idioma y el formato** (que la carta esté en un idioma que el otro lea, con letra clara y las hojas en orden) es la capa de **Aplicación**, con ayuda de **Presentación** y **Sesión**.
- **El número de hojas y el acuse de recibo certificado** (para saber si llegó todo y en orden) es la capa de **Transporte**.
- **La dirección del sobre** (calle, número, ciudad, país: la dirección del destinatario final, que no cambia en todo el viaje) es la capa de **Red**, donde vive la dirección **IP**.
- **El cartero del barrio y la etiqueta de cada bolsa** (quién entrega en esta cuadra, y con qué etiqueta viaja la bolsa en este tramo) es la capa de **Enlace**, donde vive la dirección **MAC**.
- **El camión, la ruta y el asfalto** (lo que transporta físicamente) es la capa **Física**.

En los próximos capítulos cada una de esas piezas recibe su nombre técnico. Pero la historia ya la tenés: alguien escribe, alguien pone la dirección, una oficina decide el camino, un camión transporta, un cartero entrega.

### 1.4. La metáfora que vas a usar toda la vida: las muñecas rusas

Guardá esta imagen porque aparece en TODO el manual:

> **Una comunicación de red es como una muñeca rusa (matrioshka): un sobre dentro de otro sobre, dentro de otro sobre. Cada capa envuelve los datos con su propio sobre y le escribe información útil en la tapa. Quien recibe, abre los sobres en orden inverso.**

El dato que querés mandar (un correo, una foto, esta página que estás leyendo) es el contenido de la muñeca más chica. Y alrededor se van armando capas: en cada paso, se envuelve todo lo anterior y se le agregan instrucciones de viaje.

Al final del manual vas a ver el video completo de cómo se arma y se desarma esa muñeca — y por qué ese proceso se llama **encapsulación**.

Ojo: la carta y la muñeca no son dos ideas distintas, son la misma vista desde dos lados. La carta te dice **quién hace cada trabajo**. La muñeca te dice **cómo viaja el dato**: envuelto, capa por capa, sin que nadie toque el contenido. Si te quedás con las dos imágenes, el resto del manual se lee solo.

### 1.5. Qué vas a aprender acá

- Por qué las redes se piensan en capas.
- El modelo **OSI** (7 capas): el que se usa para *entender*.
- El modelo **TCP/IP** (4 capas): el que *realmente funciona* en internet.
- El proceso de **encapsulación**: los sobres dentro de sobres.
- El **viaje completo de un paquete**, capa por capa, desde tu PC hasta un servidor.
- Cómo usar las capas para **encontrar fallas** cuando algo no funciona.

### Resumen

- Conectar dos computadoras obliga a resolver varios problemas distintos a la vez: señales, identidad, rutas, errores y reparto.
- Un **protocolo** es un acuerdo de cómo se habla, no un programa ni un cable.
- Mandar una carta por correo muestra la idea: cada empleado hace un solo trabajo y no necesita entender el de los demás.
- La **carta** explica quién hace qué; la **muñeca rusa** explica cómo viaja el dato envuelto.
- Los modelos de red son ese acuerdo puesto por escrito, para que equipos de cualquier marca se entiendan.

---

## 2. Qué es un modelo de capas

### 2.1. La idea: dividir para gobernar

Ningún problema complejo se resuelve de una sola pieza. Pensá en una carta que viaja por el correo: hay muchísimos pasos — escribirla, ponerle el sobre, pegar la estampilla, llevarla a la sucursal, clasificarla, transportarla, repartirla en el destino. Si lo pensás como "un solo proceso gigante", es imposible de organizar. Si lo dividís en etapas con responsables claros, cualquier empleado nuevo aprende su parte en un día.

Las redes hacen exactamente eso: **dividen la comunicación en capas**. Cada capa:

- Tiene **una sola responsabilidad** (y esas responsabilidades no se mezclan).
- Le presta un servicio a la capa de arriba ("pasame esto ya listo").
- Usa los servicios de la capa de abajo ("esto me lo entrega el transporte").
- Solo se comunica, en el otro extremo, con su **capa gemela** (su *par* o *peer*).

Esa última viñeta es la que más cuesta, así que la repetimos de otra forma. La capa de transporte de tu PC no habla con la capa física del servidor: habla con la capa de transporte del servidor. Son colegas del mismo piso, en edificios distintos. Para eso se comunican, se escriben mensajes que solo ellas entienden, y esos mensajes viajan escondidos dentro de los sobres de las capas de abajo. Es como dos jefes de compras de dos empresas: negocian entre ellos, pero los papeles viajan en el maletín del cadete.

### 2.2. Las reglas del juego

Imaginate cuatro equipos en una empresa: el que recibe pedidos, el que prepara cajas, el que pega etiquetas y el que las lleva al camión.

- El que recibe pedidos **no necesita saber** qué camión va a llevar la caja. Solo entrega el pedido al siguiente equipo.
- El que prepara cajas **no lee** el pedido: solo lo guarda y lo envuelve.
- Si una caja se daña en el viaje, el que la preparó se entera y la rearma — sin molestar a los otros tres equipos.

Eso es un modelo de capas: **cada piso del edificio hace su trabajo y le pasa el resultado al piso de al lado**. Si algo falla, se arregla en el piso donde falló, sin tirar el edificio entero.

Y hay un detalle que hace que todo funcione: **el pedido original nunca se modifica**. El que envuelve agrega una etiqueta por fuera; no reescribe el pedido. Si lo reescribiera, el cliente recibiría otra cosa. En redes pasa lo mismo: cada capa agrega su sobre, ninguna toca el contenido.

### 2.3. Qué ganás con las capas

| Lo que ganás | Qué significa en la práctica |
|---|---|
| **Estandarización** | Todos los fabricantes siguen las mismas reglas; sus equipos no necesitan "conocerse" para entenderse |
| **Interoperabilidad** | Un cable de marca A, un switch de marca B y una PC de marca C funcionan juntos sin drama |
| **Solución de problemas** | Si algo falla, se aísla el piso del edificio donde está el problema en vez de revisar todo |
| **Evolución independiente** | Se puede cambiar el Wi-Fi (capa 1) sin tocar el HTTP (capa de aplicación): cada piso se renueva aparte |
| **Vocabulario común** | "Es un problema de capa 3" se entiende igual en Buenos Aires, Tokio o Berlín |

Cómo leer esta tabla: la primera columna es la ventaja, en una o dos palabras. La segunda es qué te cambia en el laburo concreto. Un **switch** es el aparato que reparte la conexión entre varias máquinas de una misma red (lo vas a ver en el capítulo 9); si la tabla te lo nombra antes de tiempo, quedate con la idea de "aparato de la red local".

La fila que más vas a usar en tu vida es la cuarta. Cambiar el Wi-Fi sin tocar el HTTP significa que tu red puede pasar de cable a inalámbrica, o de una marca de router a otra, y las páginas web siguen abriendo igual: el navegador ni se entera. Cada piso se renueva solo porque el contrato entre pisos no cambió.

### 2.4. Una regla de oro antes de seguir

> **Regla de oro:** cada capa agrega **información de control propia** (el "sobre" con instrucciones de viaje) sin modificar el contenido que le pasaron de arriba. Cuando el dato llega al destino, cada capa lee su propio sobre, lo retira y le pasa el interior a la capa de arriba.

Recordala. Es la base de TODO lo que viene: el dato original viaja intacto, y cada capa sabe exactamente cuál sobre es suyo.

Fijate en el detalle final: cada capa **sabe cuál sobre es suyo**. No hay un cartel que diga "esto es TCP". Cada capa leyó el formato de su propio sobre miles de veces y lo reconoce por su posición y por sus campos. Es como el cartero que reconoce al toque si un sobre es una carta común o un telegrama: el formato se lo dice.

### 2.5. Las capas no son cajas: son acuerdos

Un malentendido habitual de principiante: creer que dentro de la PC hay siete cajitas físicas, una por capa. No. Las capas son **acuerdos escritos**, y se implementan en software, casi siempre dentro del sistema operativo. La capa física sí es un cable de verdad; las demás son reglas y programas que se respetan entre sí.

Lo que sí existe de verdad es la **pila**: el conjunto de programas que implementan esas capas y que se llaman entre ellos. El navegador pide "mandá esto al puerto 443", el sistema operativo arma el segmento, le pone la IP, la placa de red lo convierte en bits y lo saca por el cable. Cada uno hizo su parte sin meterse en la del otro. Por eso el conjunto se llama *pila de protocolos* (en inglés, *protocol stack*).

### Resumen

- Un modelo de capas reparte la comunicación en pisos, cada uno con una única responsabilidad.
- Cada capa le ofrece un servicio a la de arriba y consume el de abajo; con su gemela del otro equipo habla "de colega a colega".
- Las capas se implementan en software dentro del sistema operativo: son acuerdos, no cajitas físicas.
- Cambiar un piso no obliga a cambiar los demás, y una falla se busca en el piso donde ocurrió.
- La regla de oro: cada capa agrega su sobre y nunca modifica el contenido que recibió.

---

## 3. El modelo OSI: las 7 capas

### 3.1. Qué es el modelo OSI

**OSI** significa *Open Systems Interconnection* (interconexión de sistemas abiertos). Fue desarrollado por la **ISO** (Organización Internacional de Normalización, la misma gente que publica normas de todo tipo) y publicado en 1984. Su objetivo era ambicioso: definir el **estándar universal** de la comunicación entre equipos de cualquier fabricante.

En la práctica, el modelo OSI no se implementó tal cual (llegó tarde y "perfecto, pero teórico"), pero se volvió **la herramienta educativa y de diagnóstico más importante de las redes**. Todavía hoy, decir "problema de capa 2" o "capa 7" es la forma universal de ubicar una falla.

Pensalo así: el OSI es el plano de un edificio ideal. Ningún edificio real es idéntico al plano, pero el plano sirve para discutir con el arquitecto, para saber dónde está cada caño y para entender por qué el baño del tercero no tiene agua.

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

Qué estás mirando: es un dibujo de la pila, con la capa 7 arriba (la más cercana a vos, la persona) y la capa 1 abajo (la más cercana al cable). La primera columna trae el número y el nombre de la capa. La segunda, una frase corta que resume su trabajo. La tercera, un ejemplo de qué tecnología vive ahí: el navegador en la 7, las direcciones y rutas en la 3, los voltajes en la 1.

Un principiante suele mirar este dibujo y pensar que son siete pasos que ocurren uno tras otro en el tiempo. No es eso: es un dibujo de **responsabilidades**. El dato baja por los siete pisos, sí, pero cada piso es un trabajo distinto, no una etapa de un cronómetro.

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

Esta es la tabla que vas a consultar mil veces, así que vamos columna por columna.

**Capa**: el número. Se usa en el habla diaria ("es un problema de capa 2") y va del 1 al 7.

**Nombre**: el nombre oficial. Vas a verlo en libros y en cursos.

**Función en cristiano**: qué problema resuelve, sin jerga.

**Qué maneja (PDU)**: el nombre que recibe el paquete de datos en esa capa. **PDU** significa *Protocol Data Unit* (unidad de datos de protocolo): es la "caja" que produce cada capa. Arriba se llama **datos**, después **segmento** (TCP) o **datagrama** (UDP), más abajo **paquete**, después **trama** y al final **bits**. Un **host** es cualquier equipo conectado que tiene direcciones propias y puede mandar y recibir: tu PC, tu celular, el servidor de Google.

**Dónde "vive"**: qué equipo o programa se ocupa de esa capa. Sirve para saber a quién culpar. Si el problema es de capa 1, mirás el cable y la placa; si es de capa 3, mirás el router.

Fijate en la columna "Qué maneja": a cada capa le corresponde una "caja" distinta — **bits → tramas → paquetes → segmentos → datos**.

> **Clave de memoria:** "¿Me pasás el *segmento*?" decime **T**ransporte. "¿El *paquete*?" → **R**ed. "¿La *trama*?" → **E**nlace. Cada piso de la muñeca rusa tiene su propio nombre de caja.

Ojo con una cosa antes de seguir: el nombre de la caja te dice en qué piso estás parado. Si alguien dice "me llegó una trama con la MAC mal", ya sabés que el problema está en el enlace, no en la aplicación. El vocabulario es la mitad del diagnóstico.

### 3.4. Las 7 capas, contadas con la carta

Volvé a la carta del capítulo 1 y ponele nombre a cada paso. Vas a ver que el modelo OSI no inventó nada raro: describió lo que ya hacía el correo.

- **Capa 7 — Aplicación: lo que querés decir.** Es el texto de la carta. En la red es el pedido que hace el programa: "dame la página de inicio", "mandá este correo". Sin capa 7 no hay nada que mandar.
- **Capa 6 — Presentación: el idioma, la letra y el código secreto.** Escribís en un idioma que el otro entiende, con letra legible. Si la carta va cifrada, acá es donde la cifrás; si va comprimida, acá la comprimís; si el destinatario usa otro alfabeto, acá lo traducís.
- **Capa 5 — Sesión: el "hola" y el "chau".** Abrís la conversación ("Estimado señor"), la mantenés y la cerrás ("Atentamente"). Si la carta es parte de un intercambio de varias cartas, la sesión recuerda en qué iban.
- **Capa 4 — Transporte: la numeración de las hojas y el acuse de recibo.** Si tu carta tiene cinco hojas, las numerás "1 de 5, 2 de 5…". Si pagás certificado, te avisan cuando llegó y podés reclamar si falta una hoja. Esto es **TCP**. Si mandás una postal sin acuse y te da igual, es **UDP**.
- **Capa 3 — Red: la dirección del sobre.** Calle, número, ciudad, país. Es la dirección del **destinatario final** y no cambia en todo el viaje, aunque pase por cinco camiones y tres ciudades. En la red, esto es la dirección **IP**.
- **Capa 2 — Enlace: el cartero del barrio y la etiqueta de la bolsa.** El cartero no conoce el país entero: conoce su barrio y sabe qué puerta es la 445. Al mismo tiempo, cada oficina pega en la bolsa una etiqueta nueva que dice "esta bolsa va a la sucursal 12". Esa etiqueta vale solo para ese tramo. En la red, esto es la dirección **MAC**.
- **Capa 1 — Física: el camión y el asfalto.** El vehículo, la ruta, el combustible. No sabe nada de cartas: transporta bolsas. En la red, son los voltajes en el cable, la luz en la fibra o las ondas de radio.

La consecuencia más útil de este mapa: **la dirección del destinatario y la etiqueta de la bolsa son cosas distintas**. La primera no cambia; la segunda cambia en cada tramo. Guardá esa frase, porque en el capítulo 11 vas a ver que confundirlas es el error más común de todo el tema.

### 3.5. Cómo funciona (y el diagrama que casi siempre sale mal)

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

Cómo leerlo: a la izquierda está la máquina que manda (el **emisor**), a la derecha la que recibe (el **receptor**). Cada fila es una capa, y las flechas horizontales van de una capa a su gemela del otro lado, no a la capa de abajo. La única flecha que cruza de verdad el espacio físico es la de abajo de todo: los bits por el cable, la fibra o el aire. Las demás son conversaciones "de colega a colega" que viajan escondidas adentro de esos bits.

Abajo del dibujo están las dos palabras que resumen todo: **encapsulación** es lo que pasa del lado izquierdo (cada capa agrega su sobre al bajar), **desencapsulación** es lo que pasa del lado derecho (cada capa abre el suyo al subir).

Lo importante: cada capa del emisor le habla "directamente" a su gemela en el receptor — aunque en la práctica los datos solo viajen por el cable físico y las capas intermedias simplemente los empujen hacia abajo o arriba.

> **Ojo con un error común:** se suele dibujar el flujo como una fila horizontal (Aplicación → Presentación → Sesión → …) — eso está mal. Las capas se apilan en paralelo: **bajan en el emisor y suben en el receptor**.

¿Por qué está mal el dibujo en fila? Porque sugiere que la aplicación del emisor le manda datos a la presentación del receptor, y que la presentación le manda a la sesión del receptor. Eso nunca pasa. Lo que pasa es que la aplicación del emisor le habla a la aplicación del receptor, y para lograrlo le pide un favor a la presentación de su propia máquina: "envolvé esto y bajalo". La pila es una escalera de favores dentro de cada máquina, no una cadena entre máquinas.

### Resumen

- **OSI** (*Open Systems Interconnection*) es el modelo de 7 capas de la ISO: sirve para entender y diagnosticar, no para implementar.
- Las capas, de arriba hacia abajo, son Aplicación, Presentación, Sesión, Transporte, Red, Enlace y Física.
- Cada capa produce una **PDU** distinta: datos, segmento o datagrama, paquete, trama y bits.
- En la carta: la aplicación es lo que querés decir; la red es la dirección del sobre; el enlace es el cartero del barrio; la física es el camión.
- Los datos bajan envueltos en el emisor y suben desenvueltos en el receptor; las capas hablan con su gemela, en paralelo.

---

## 4. El modelo TCP/IP: las 4 capas

### 4.1. El modelo que sí funciona

El modelo TCP/IP nació por el lado práctico: lo desarrollaron los que construyeron **ARPANET** (la red del Departamento de Defensa de EE.UU. que dio origen a internet) y después lo estandarizó la **IETF** (*Internet Engineering Task Force*, la organización de ingenieros que publica los estándares de internet). Su regla era simple: *primero que funcione, después que sea lindo*. Los protocolos ya existían (TCP, IP); el modelo se escribió después, para explicarlos.

Fijate en el detalle histórico, porque explica casi todas las diferencias del capítulo 5: el OSI fue **primero el plano y después el edificio**; el TCP/IP fue **primero el edificio y después el plano**. Cuando dibujás el plano mirando un edificio que ya funciona, no te queda otra que agrupar pisos donde la vida real los agrupó.

Hoy, **todo internet funciona con TCP/IP**. Cuando decís "la red anda mal", hablando en serio estás hablando de estas 4 capas.

### 4.2. Las 4 capas

| Capa | Nombre | Función | Protocolos típicos |
|------|--------|---------|--------------------|
| **4** | **Aplicación** | Junta las capas 7, 6 y 5 del OSI: los servicios que usan los programas | HTTP, HTTPS, DNS, DHCP, FTP, SSH, SMTP, SNMP |
| **3** | **Transporte** | Igual que la capa 4 del OSI: comunicación extremo a extremo, fiable o rápida | TCP, UDP |
| **2** | **Internet** | Enrutamiento y direccionamiento lógico (equivale a la capa 3 del OSI) | IP, ICMP, ARP |
| **1** | **Acceso a Red** | Junta las capas 2 y 1 del OSI: comunicación con el vecino y el medio físico | Ethernet, Wi-Fi, PPP, Frame Relay |

Cómo leerla: la primera columna numera de 4 a 1, contando desde arriba igual que en el OSI (arriba, lo más cercano a vos; abajo, lo más cercano al cable). La segunda es el nombre de la capa. La tercera dice qué hace. La cuarta lista los protocolos que viven ahí: **HTTP** es el protocolo de las páginas web, **DNS** el que traduce nombres a direcciones, **Ethernet** el de la red cableada, **Wi-Fi** el de la red inalámbrica. En el capítulo 6 vas a ver cada uno con su puerto y su para qué.

¿Por qué 4 capas y no 7? Porque en la práctica, Presentación y Sesión casi siempre se resuelven dentro de la propia aplicación (el navegador cifra, comprime y maneja sus sesiones él mismo), y la frontera entre Enlace y Física es difusa en tecnologías reales como Ethernet.

Traducido a la carta: el modelo TCP/IP dice "no hace falta un empleado dedicado a traducir el idioma y otro dedicado a saludar; el que escribe la carta lo hace y listo". Y "no hace falta separar al cartero del camión: en la práctica el mismo servicio se ocupa de las dos cosas".

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

Qué muestra: a la izquierda las 7 capas del OSI, a la derecha las 4 del TCP/IP, y en el medio unas flechas que dicen "esta o estas capas de acá se corresponden con esta de allá". Las llaves de la izquierda agrupan 7-6-5 y 2-1: esas son las que se juntan. Transporte y Red se corresponden uno a uno, sin agrupar.

Las flechas resumen todo: **las capas 5-6-7 del OSI viven juntas en la capa de Aplicación del TCP/IP, y las capas 1-2 viven juntas en la de Acceso a Red.**

Cuando alguien te diga "esto es capa 7" y otro "esto es capa de aplicación", están hablando de lo mismo con dos alfabetos. Vos podés usar el que te resulte cómodo, pero conviene entender los dos, porque en el trabajo se mezclan todo el tiempo.

### 4.4. Las 4 capas, contadas con la carta

El mapeo con la historia del correo, ahora en versión TCP/IP:

- **Acceso a Red** es el camión, la ruta y el cartero del barrio, todo junto. Es la parte que se ocupa del medio (asfalto, calles) y del vecino inmediato (qué puerta es). Nadie separa "el camión" de "el cartero" en un organigrama, porque es el mismo servicio postal local.
- **Internet** es la dirección del sobre y la oficina de clasificación: la dirección final del destinatario (IP) y la decisión de por qué ruta mandar la carta.
- **Transporte** es la numeración de las hojas y el acuse de recibo: se ocupa de que llegue todo, en orden, o de que viaje rápido si total no importa.
- **Aplicación** es lo que escribís, en qué idioma y con qué saludo: el texto, el formato y la conversación, todo junto en la misma hoja.

### Resumen

- El modelo TCP/IP tiene 4 capas y es el que funciona de verdad en internet.
- Nació al revés que el OSI: primero existieron los protocolos, después el modelo que los explica.
- Sus capas son Aplicación, Transporte, Internet y Acceso a Red.
- Aplicación absorbe las capas 5, 6 y 7 del OSI; Acceso a Red absorbe las capas 1 y 2.
- En la carta: Acceso a Red es el camión y el cartero; Internet es la dirección; Transporte es el acuse; Aplicación es el texto.

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

Cómo leer esta tabla: cada fila compara los dos modelos en un aspecto. Las filas más útiles para un principiante son las tres primeras, porque explican **por qué** son distintos: uno se pensó en un escritorio y el otro se construyó en un laboratorio con máquinas reales.

La fila "Protocolo de red" dice algo que conviene entender bien: el OSI es **genérico**, o sea que describe cómo debería funcionar cualquier red, sin comprometerse con ninguna tecnología. El TCP/IP está **atado a IP**: nació para hacer funcionar internet con el protocolo IP, y si mañana aparece otra cosa, el modelo se ajusta a la realidad y no al revés.

La fila "Evolución" es la que decide la vida práctica: en el OSI, cambiar una capa obliga a renegociar el estándar completo entre comités; en el TCP/IP, una capa puede crecer sola porque nadie firmó un contrato rígido con las otras. Por eso internet pudo pasar de cables de cobre a fibra y de IPv4 a IPv6 sin que se caiga nada.

### 5.2. La verdad de a pie

> **Resumen honesto:** el OSI es para **pensar**; el TCP/IP es para **funcionar**. Cuando un técnico dice "problema de capa 3", está usando la numeración del OSI aunque la red corra con TCP/IP — el OSI es el idioma común, TCP/IP es la calle.

Por eso el resto de este manual usa la **numeración del OSI** (capa 1, capa 2, capa 3…) pero los **nombres y protocolos del TCP/IP** (la realidad).

Es una mezcla a propósito, y no es un capricho: los números del OSI son más finos y sirven para diagnosticar ("capa 2" te ubica en el vecino, "capa 3" en las rutas). Los nombres del TCP/IP son los que usan los programas que vas a configurar. Nadie te va a pedir "configurá la capa de presentación"; te van a pedir "configurá la IP".

### 5.3. El modelo híbrido real

En la práctica, nadie implementa "OSI puro" ni "TCP/IP puro": se usa un **modelo híbrido**. Casi todos los textos modernos y las herramientas de análisis (como **Wireshark**) hablan de las 5 capas que ves acá:

```
 5. Aplicación        HTTP, DNS, SMTP…
 4. Transporte        TCP / UDP
 3. Red               IP, ICMP
 2. Enlace de Datos   Ethernet (tramas, MAC)
 1. Física            cable / ondas
```

Esta lista es el híbrido: cinco renglones, de arriba hacia abajo. A la izquierda el número y el nombre de la capa, a la derecha los protocolos que viven en ella. Es el OSI con los nombres del TCP/IP y una capa menos: la Aplicación absorbe Presentación y Sesión, y Enlace y Física quedan separadas porque en el diagnóstico diario sí conviene distinguir "el cable está desenchufado" de "la trama llegó mal".

No te asustes si ves libros que dibujan 5 capas: es exactamente lo mismo, con los nombres del OSI y la cantidad del TCP/IP.

Y **Wireshark** es el programa que captura el tráfico real de tu placa de red y te lo muestra capa por capa, con los cinco renglones de arriba. Cuando lo abras en el capítulo 13 vas a reconocer cada renglón.

### Resumen

- El OSI sirve para pensar y diagnosticar; el TCP/IP es el que realmente corre en internet.
- El OSI llegó primero como modelo; el TCP/IP llegó primero como protocolos.
- El manual usa la numeración del OSI con los nombres y protocolos del TCP/IP.
- En la práctica se habla de 5 capas: Aplicación, Transporte, Red, Enlace y Física.
- Wireshark y casi todos los textos modernos usan ese modelo híbrido de 5 capas.

---

## 6. La capa de Aplicación

### 6.1. La ventanilla del correo

La capa de Aplicación es la única que ve el usuario. Es la **ventanilla del correo**: el lugar donde entregás tu carta (el programa que usás) y recibís la respuesta.

No es "la aplicación" en sí (Chrome no es una capa): es el **protocolo** que la aplicación usa para hablar por la red. El navegador no habla "red": habla **HTTP**. El correo electrónico habla **SMTP** (para enviar) e **IMAP/POP3** (para recibir). El chat habla HTTPS. Cada servicio tiene su protocolo y su **puerto** (el "número de ventanilla" que identifica al servicio en el servidor).

El puerto merece dos renglones propios, porque es la pieza que más confusiones genera. Una dirección IP identifica **una máquina**; un puerto identifica **un servicio dentro de esa máquina**. El número de puerto son 16 bits, o sea que va de 0 a 65535, y es parte de la dirección completa de un servicio. Es la diferencia entre "la dirección del edificio" y "el número de oficina dentro del edificio": si solo tenés la dirección del edificio, no sabés a qué puerta golpear.

Por eso, cuando tu navegador quiere abrir un sitio, no manda el pedido "a la máquina de Google": lo manda a la máquina de Google, puerto 443. El servidor mira el puerto, y con eso sabe a qué programa interno entregarle el pedido: no es lo mismo el programa que sirve páginas que el que sirve correo, aunque vivan en la misma máquina.

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

Esta tabla es la lista de ventanillas del correo. Tres columnas: el nombre del protocolo, el número de puerto donde atiende y para qué sirve.

**Protocolo**: la sigla que vas a ver en logs, configuraciones y capturas. **Puerto**: el número de ventanilla. Cuando ves "67/68" o "20/21" no son dos puertos al azar: en **DHCP** el servidor escucha en el 67 y el cliente en el 68; en **FTP** el 21 es el canal de control (las órdenes) y el 20 el canal de datos. **Para qué sirve**: la tarea. Fijate que **Telnet** y **FTP** dicen "sin cifrar": son protocolos viejos, y hoy mandar una contraseña por ellos es regalarla a cualquiera que esté mirando el cable.

> **Cómo leer la tabla:** cuando tu PC quiere abrir un sitio web, manda un mensaje "al puerto 443" del servidor. El puerto le dice al servidor *qué servicio* está pidiendo. Es como llamar a una empresa y pedir "pasame con ventanilla 443": sabés que ahí atienden HTTPS.

Un principiante mira esta tabla y a veces se asusta por la cantidad de siglas. No hay que memorizarla entera: alcanza con saber que existen, que cada servicio tiene su ventanilla y que un puerto conocido te dice qué está pasando. Si ves tráfico al puerto 22 en un servidor web, alguien está entrando por SSH, no mirando páginas.

### 6.3. Las siglas, una por una

- **HTTP** (*HyperText Transfer Protocol*): el protocolo de las páginas web. Pide archivos y los recibe; no cifra nada.
- **HTTPS** (*HTTP Secure*): lo mismo, pero viajando cifrado. Es lo que usa cualquier sitio serio hoy.
- **DNS** (*Domain Name System*): la guía de teléfonos de internet. Traduce `google.com` a una dirección IP, porque las máquinas se hablan con números, no con nombres.
- **DHCP** (*Dynamic Host Configuration Protocol*): el que le reparte direcciones IP a los equipos cuando se conectan. Sin él, habría que escribir la dirección a mano en cada máquina.
- **FTP** (*File Transfer Protocol*): transferencia de archivos, sin cifrar. Se reemplazó por SFTP o por la nube.
- **SSH** (*Secure Shell*): abrir una terminal en otra máquina, cifrado.
- **Telnet**: lo mismo que SSH pero sin cifrar. Histórico.
- **SMTP** (*Simple Mail Transfer Protocol*): el que manda el correo. Es el camión que lleva la carta al correo central.
- **POP3** e **IMAP**: los dos que reciben el correo. POP3 descarga y borra del servidor (te lo llevás); IMAP sincroniza (el correo vive en el servidor y lo ves desde cualquier equipo).
- **SNMP** (*Simple Network Management Protocol*): el que se usa para monitorear routers, switches y servidores desde un panel central.

### 6.4. Un ejemplo concreto: abrir una página

Escribís `ejemplo.com` en el navegador y tocás Enter. Lo que pasa, en el idioma de este capítulo:

1. El navegador necesita una dirección IP, así que le pregunta al **DNS** (puerto 53): "¿cuál es la IP de ejemplo.com?".
2. El DNS responde, por ejemplo, `93.184.216.34`.
3. El navegador arma un pedido **HTTP** y lo manda a esa IP, al puerto **443** (o sea, HTTPS).
4. El servidor recibe, mira el puerto 443, y le entrega el pedido al programa que sirve páginas.
5. La respuesta vuelve por el mismo camino y el navegador dibuja la página.

Fijate que en el paso 3 no aparece ni una sola dirección MAC, ni un cable, ni un router. La capa de Aplicación **no sabe** cómo viaja el pedido: solo sabe qué quiere y a qué ventanilla golpear. Todo lo demás es trabajo de las capas de abajo, y eso es exactamente lo que hace que el modelo funcione.

### Resumen

- La capa de Aplicación es el protocolo que usa el programa, no el programa.
- Cada servicio atiende en un **puerto**, que es el número de ventanilla dentro de una máquina.
- HTTP (80), HTTPS (443), DNS (53), DHCP (67/68), SSH (22) y SMTP (25/587) son las siglas que vas a ver siempre.
- Un puerto conocido te dice qué está pasando: puerto 443 es una web, puerto 22 es una sesión remota.
- Abrir una página es: preguntar la IP al DNS, pedir al puerto 443, esperar la respuesta.

---

## 7. La capa de Transporte: TCP y UDP

### 7.1. El problema de la capa 4

La capa de Red ya sabe *cómo llegar* (las rutas). A la capa de Transporte le toca otra pregunta: **¿cómo garantizo que lo que se mandó llegó bien?**

Acá hay dos personalidades opuestas, y ambas son correctas según lo que necesites:

- **TCP**: la carta certificada con acuse de recibo y seguimiento.
- **UDP**: el correo aéreo sin confirmación, rápido, sin vueltas.

Antes de las definiciones, las siglas: **TCP** significa *Transmission Control Protocol* (protocolo de control de transmisión) y **UDP** significa *User Datagram Protocol* (protocolo de datagramas de usuario). Los dos hacen lo mismo —llevar datos de un programa a otro programa— pero con filosofías opuestas sobre las garantías.

Y hay una tercera cosa que hace esta capa, además de garantizar o no: **repartir**. Si tenés el navegador con tres pestañas, una videollamada y un juego abiertos al mismo tiempo, todos usan la misma placa de red. La capa de Transporte los distingue por **puerto**: cada conversación sabe de qué puerto sale y a qué puerto va, así no se mezclan. Es el empleado de la ventanilla que separa las cartas por destinatario antes de mandarlas.

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

Cómo leer este dibujo: a la izquierda el que inicia la conversación (el emisor), a la derecha el que responde (el receptor). Las flechas son mensajes que viajan de verdad. A la derecha de cada flecha está lo que significa el mensaje en castellano.

Las tres siglas: **SYN** viene de *synchronize* (sincronizar) y sirve para abrir; **ACK** viene de *acknowledge* (acuse de recibo) y sirve para confirmar. En el paso 1 el emisor manda SYN. En el paso 2 el receptor contesta SYN + ACK, que quiere decir "yo también quiero abrir, y te confirmo tu pedido". En el paso 3 el emisor manda ACK: "confirmado lo tuyo, arrancamos".

¿Por qué tres pasos y no dos? Porque cada lado tiene que quedar seguro de dos cosas: que el otro existe y que el otro lo escuchó. Con dos mensajes, uno de los dos se queda con la duda. El tercero cierra el círculo. Es la diferencia entre gritar "¿hola?" y esperar que alguien conteste "¡hola!" — con el tercer paso, además, el que contestó sabe que su saludo llegó.

Con la conexión armada, TCP agrega otras dos garantías:

- **Numeración de segmentos**: cada segmento lleva un número; el receptor los rearma **en orden** y detecta si falta alguno.
- **Control de flujo**: si el receptor está saturado, le dice al emisor "bajá un cambio" (la *ventana*). Así nadie ahoga a nadie.
- **Checksum**: cada segmento lleva una "huella" de verificación; si el dato se corrompió en el camino, se detecta y se retransmite.

Un detalle: el texto original decía que eran "otras dos garantías" y después enumeraba tres. Son tres, y las tres importan. La numeración resuelve el **orden**; el control de flujo resuelve la **velocidad**; el **checksum** (suma de verificación, una cuenta matemática sobre los bytes) resuelve la **corrupción**. Perder el orden, ahogar al receptor y recibir basura son tres problemas distintos.

| Característica TCP | Qué significa |
|---|---|
| Conexión | Conectado: arma una sesión antes de transmitir (handshake) |
| Fiabilidad | Garantiza entrega y orden de los segmentos |
| Control de flujo | El receptor puede frenar al emisor si se satura |
| Control de errores | Detecta pérdidas/corrupciones y retransmite |
| Velocidad | Más lento, por todo el control que lleva |
| Se usa en | Web, correo, transferencia de archivos, bases de datos — todo lo que no puede perderse |

Cómo leerla: la columna izquierda nombra la característica y la derecha la explica en una línea. Es una tabla de "qué me da TCP y a qué precio". La primera fila (conexión) es la que explica todas las demás: como hay una sesión armada, se puede numerar, frenar y retransmitir. La última fila (se usa en) es la que te sirve para decidir en el trabajo: si el dato no puede perderse, es TCP.

### 7.3. UDP: el correo sin acuse

> **Analogía:** UDP es tirar la carta al buzón **sin acuse de recibo**: sale rápido, no pesa nada… y si se pierde, te enterás (o no). No hay seguimiento, pero tampoco demoras.

Es literalmente el "protocolo de datagramas de usuario" y hace solo lo mínimo: pone un número de puerto y manda. Sin handshake, sin orden garantizado, sin retransmisión. ¿Por qué existe entonces? Por tres razones de oro:

1. **Velocidad**: sin handshake ni confirmaciones, cada mensaje viaja al ritmo máximo posible.
2. **En vivo**: en una videollamada, un segundo de audio perdido se puede descartar; retransmitirlo sería un desastre (llegaría tarde igual). Mejor **perder un cuadro que frenar toda la llamada**.
3. **Mensajes cortos de una sola vez**: pedir una dirección DNS o el estado de un juego no necesita "sesión".

Hay una cuarta razón que no está en la lista y es igual de importante: **UDP no guarda estado**. El servidor no tiene que recordar nada de cada cliente, así que un mismo servidor puede atender a muchísimos más con el mismo hardware. Por eso los servicios que reciben millones de pedidos chiquitos (como DNS) prefieren UDP: preguntar y responder, sin abrir ni cerrar nada.

El costo de esa liviandad: si el mensaje se pierde, nadie se entera. La aplicación que usa UDP tiene que arreglárselas sola: repetir el pedido si no llega la respuesta, o simplemente seguir adelante.

| Característica UDP | Qué significa |
|---|---|
| Conexión | Sin conexión: manda y listo |
| Fiabilidad | No garantiza entrega ni orden |
| Control de errores | Solo un checksum básico (si falla, descarta) |
| Velocidad | Más rápido, menos overhead |
| Se usa en | Streaming, VoIP, juegos online, DNS, DHCP |

Misma lectura que la tabla anterior, ahora con UDP: lo que gana es velocidad y lo que pierde son garantías. **VoIP** significa *Voice over IP* (voz por internet), o sea una llamada telefónica que viaja como datos. **Streaming** es la transmisión de audio o video en vivo. Y **overhead** es la carga extra: los bytes de los sobres que no son datos útiles.

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

Esta es la tabla para comparar de un vistazo: cada fila es un criterio y las dos columnas siguientes son las respuestas de cada protocolo. La fila del **overhead** es la única con números, y vale la pena entenderla: la cabecera es el sobre, y el sobre de TCP mide 20 bytes mientras el de UDP mide 8. Por eso, para un mensaje de dos bytes, UDP gasta mucho menos.

"Mejor esfuerzo" (*best effort*) quiere decir que el protocolo hace lo que puede y no garantiza nada. No es una falla de diseño: es una decisión, y está escrita en la tabla a propósito.

> **Regla práctica:** ¿El dato se puede repetir? **TCP.** ¿El dato se puede perder un poquito sin drama? **UDP.** Descargás un archivo → TCP (un byte faltante corrompe todo). Mirás una transmisión en vivo → UDP (un cuadro perdido no se nota).

### 7.5. Un ejemplo concreto, lado a lado

Estás en una videollamada y, en otra ventana, bajando un archivo grande. Las dos cosas usan la misma red y las dos pasan por la capa de Transporte, pero con personalidades opuestas.

La videollamada va por **UDP**. Cada 20 o 30 milisegundos sale un paquetito con un pedacito de tu voz. Si uno se pierde, el que escucha nota un microcorte y sigue; si se retransmitiera, llegaría cuando ya se dijo otra cosa, y encima atrasaría todo lo que viene detrás. Perder y seguir es mejor que esperar.

La descarga va por **TCP**. El archivo se parte en segmentos numerados; si uno no llega, el receptor lo pide de nuevo y rearma todo en orden antes de escribir el archivo en disco. Acá esperar es obligatorio: un archivo con un pedazo faltante no sirve para nada.

Y fijate el detalle fino: la videollamada **también usa TCP para lo que no es voz** (el chat de la reunión, el inicio de sesión). Un mismo programa puede usar los dos protocolos según lo que esté mandando. La pregunta no es "¿qué programa sos?", es "¿qué datos estás mandando ahora?".

### Resumen

- La capa de Transporte garantiza (o no) que los datos lleguen completos, en orden y sin errores, y separa las conversaciones por puerto.
- **TCP** arma una conexión con un saludo de tres pasos (SYN, SYN+ACK, ACK) y suma numeración, control de flujo y checksum.
- **UDP** no abre nada, no confirma nada y no retransmite: es más rápido y más liviano (8 bytes de cabecera contra 20 de TCP).
- La regla práctica: si el dato puede perderse sin drama, UDP; si no, TCP.
- Un mismo programa puede usar los dos protocolos según lo que esté mandando.

---

## 8. La capa de Internet

### 8.1. La oficina de clasificación del correo

La capa de Internet (capa 3, Red, en el OSI) es la **oficina de clasificación postal**: recibe tu carta, le escribe la dirección de origen y destino en términos lógicos (las **direcciones IP**) y decide **por qué ruta** la manda. Si hay diez caminos entre tu ciudad y el destino, esta capa elige uno (y si ese camino falla, prueba con otro).

Lo que maneja se llama **paquete**, y dentro va (con su sobre puesto) el segmento de la capa 4.

Acá conviene fijar la diferencia más importante de todo el manual, porque es la que ordena el resto: una **dirección IP** es **lógica**, se configura y se puede cambiar; una **dirección MAC** es **física**, viene grabada en la placa de red y no se toca. La IP es la dirección del sobre ("Av. Siempre Viva 742, Springfield"); la MAC es el número de serie de la casa ("esta puerta, esta chapa"). El correo enruta por la primera y entrega por la segunda.

### 8.2. IP: el protocolo de los paquetes

**IP** (*Internet Protocol*) es el protocolo estrella de esta capa. Existe en dos versiones:

| Característica | IPv4 | IPv6 |
|----------------|------|------|
| Longitud de la dirección | 32 bits | 128 bits |
| Formato | Decimal punteado: `192.168.1.1` | Hexadecimal con dos puntos: `2001:0db8::1` |
| Cantidad de direcciones | ~4.300 millones | Prácticamente ilimitada (3.4 × 10³⁸) |
| Cabecera del paquete | 20 bytes mínimo | 40 bytes fijos |
| Estado hoy | Sigue siendo la norma | En crecimiento, obligatoria en redes nuevas |

Cómo leerla: cada fila compara las dos versiones de IP en un aspecto. **IPv4** e **IPv6** son la cuarta y la sexta versión del protocolo (la quinta existió como experimento y nunca se usó).

La fila de la longitud es la clave de todo: una dirección IPv4 tiene 32 **bits** (un bit es un 1 o un 0), y con 32 bits se pueden escribir unos 4.300 millones de combinaciones. Una IPv6 tiene 128 bits, o sea 3.4 × 10³⁸ combinaciones: tantas que alcanzan para ponerle dirección a cada grano de arena del planeta varias veces.

La fila del formato te muestra cómo se escriben. IPv4 usa cuatro números decimales separados por puntos, cada uno de 0 a 255. IPv6 usa grupos hexadecimales separados por dos puntos, y tiene un atajo: `::` significa "todos los grupos que faltan son cero", por eso `2001:0db8::1` es una dirección completa y corta.

La fila de la cabecera son los bytes del sobre de esta capa: 20 como mínimo en IPv4, 40 fijos en IPv6. El sobre de IPv6 es más grande porque la dirección ocupa cuatro veces más, pero a cambio simplifica otras cosas y por eso tiene tamaño fijo.

> **La razón del IPv6:** en el mundo hay más dispositivos que direcciones IPv4. IPv6 no existe "porque sí": existe porque los 4.300 millones de IPv4 se agotaron. Cada celular, notebook, smart TV y sensor necesita una dirección — y dos IPv6 son más que los granos de arena de todas las playas (exageramos poco).

El paquete IP lleva un dato muy importante en su sobre: el **TTL** (*Time To Live*, tiempo de vida). Es un contador que baja en cada salto y evita que un paquete perdido dé vueltas por internet para siempre. Cuando llega a cero, el router lo descarta y avisa.

Ese aviso tiene nombre: **ICMP** (*Internet Control Message Protocol*), el protocolo de mensajes de control de esta misma capa. El router manda un ICMP de "tiempo excedido" al que mandó el paquete, y así te enterás de que tu paquete dio demasiadas vueltas. Es el mismo protocolo que usa el `ping` del capítulo 13.

Un detalle: cada router que atraviesa el paquete baja el TTL en uno. Si el paquete sale con TTL 64 y llega con TTL 20, atravesó 44 routers. Por eso el TTL sirve, además, para adivinar cuán lejos está un destino.

### 8.3. Los otros protocolos de la capa de Red

| Protocolo | Función |
|-----------|---------|
| **ICMP** | Mensajes de control y diagnóstico: lo usa el `ping` y el `traceroute` |
| **IGMP** | Maneja los grupos *multicast* (enviar a varios destinos a la vez) |
| **IPSec** | Seguridad: cifra y autentica a nivel de paquete (base de las VPN) |
| **ARP** | Traduce direcciones IP a direcciones MAC *dentro de una misma red* (el "agenda del vecindario") |

Dos columnas, cuatro protocolos. La segunda columna dice qué hace cada uno. **IGMP** (*Internet Group Management Protocol*) se ocupa del **multicast**: mandar el mismo contenido a un grupo de interesados a la vez, como un canal de televisión, en vez de copiar el paquete uno por uno. **IPSec** (*Internet Protocol Security*) es el conjunto de reglas que cifra y firma paquetes enteros, y es la base de las **VPN** (*Virtual Private Network*, red privada virtual): un túnel cifrado que atraviesa internet como si fuera un cable directo entre dos sedes.

**ARP** pide una explicación aparte porque es el que más se confunde.

> **Ojo con un error común:** ARP aparece listado en esta capa, pero en la práctica trabaja en el borde entre la capa 2 y la 3: resuelve "¿qué dispositivo físico es este IP de mi red?" — solo alcanza a los vecinos, no cruza routers.

Dicho con la analogía del correo: ARP es la **agenda del barrio**. Vos sabés la dirección ("Av. Siempre Viva 742"), pero para entregar necesitás saber cuál es la puerta exacta. ARP pregunta a los gritos en el barrio "¿quién tiene la IP 192.168.1.1?" y el dueño contesta con su MAC. Solo funciona dentro de tu red: para llegar a otra ciudad no se pregunta a los gritos, se usa el router.

### 8.4. Un ejemplo concreto: el TTL en acción

Estás en tu casa y hacés `ping` a un servidor de Google. El paquete sale de tu PC con TTL 64. En el camino atraviesa tu router, el del proveedor, dos routers más del proveedor y un router de Google. Cuando llega, el TTL dice 59: cinco routers menos (64 − 59 = 5).

Ahora el mismo `ping` a un servidor de otro continente. Sale con TTL 64 y llega con TTL 116. ¿Aumentó? No: el servidor de destino usa otro valor inicial (255, 128 o 64 según el sistema operativo). Lo que importa no es el número absoluto sino **cuánto bajó**: si bajó mucho, el camino es largo.

Y si el TTL llega a cero en el medio, el paquete se descarta y el router te manda un ICMP. Eso es lo que hace posible el `traceroute`: manda paquetes con TTL 1, después TTL 2, después TTL 3, y cada router que se queda sin vida contesta y revela su nombre. En el capítulo 13 vas a ver la salida de ese comando y vas a reconocer el mecanismo.

### Resumen

- La capa de Internet (capa 3) pone direcciones lógicas (IP) y decide por qué ruta va cada paquete.
- La dirección IP es lógica y se configura; la MAC es física y viene en la placa.
- IPv4 usa 32 bits y se agotó; IPv6 usa 128 bits y alcanza para muchísimo más.
- El **TTL** baja en cada salto y evita que un paquete perdido dé vueltas para siempre.
- **ICMP** avisa y diagnostica, **IGMP** reparte multicast, **IPSec** cifra y **ARP** traduce IP a MAC dentro de la red local.

---

## 9. La capa de Acceso a Red

### 9.1. El cartero del barrio

Si la capa de Internet es la oficina de clasificación, la capa de Acceso a Red (capas 1 y 2 del OSI juntas) es **el cartero que conoce cada casa del barrio**: entrega el sobre al vecino exacto, casa por casa, y se asegura de que la trama llegue en buen estado.

Esta capa es la única que **conoce el medio físico** (el cable o las ondas) y trabaja con **direcciones físicas** (MAC), no lógicas. Su unidad de datos se llama **trama** (*frame*).

Hay dos siglas que aparecen todo el tiempo acá. **MAC** significa *Media Access Control* (control de acceso al medio), y la dirección MAC es un número de 48 bits que viene grabado en cada placa de red: los primeros 24 bits identifican al fabricante y los otros 24 son únicos para esa placa. **LAN** significa *Local Area Network* (red de área local): la red de una casa, una oficina o un aula, donde todos los equipos se ven entre sí sin pasar por un router.

Pensá la diferencia con la capa de arriba en términos de alcance. La IP te lleva de una ciudad a otra; la MAC te lleva de la puerta de calle a la puerta del departamento. La IP sirve en todo el mundo; la MAC solo sirve en tu cuadra.

### 9.2. Las funciones del piso de abajo

| Función | Qué es |
|---------|--------|
| **Encuadre (framing)** | Armá la trama: un inicio, el dato, un fin, y delimitadores para saber dónde empieza y termina cada mensaje |
| **Control de acceso al medio** | Decide CUÁNDO un dispositivo puede hablar (para que dos no hablen a la vez y se pisen) |
| **Direccionamiento físico** | Usa las direcciones **MAC** (48 bits) para identificar sin ambigüedad cada placa de red |
| **Detección de errores** | Un **CRC** (huella matemática) al final de cada trama: si la huella no coincide al llegar, se descarta la trama |

La columna de la izquierda nombra la función, la de la derecha explica qué hace. Las cuatro son trabajos distintos y conviene entender por qué están juntos en la misma capa.

**Encuadre**: el cable transporta una corriente continua de bits, sin marcas. El que recibe necesita saber dónde empieza y dónde termina cada mensaje, como necesita el sobre para saber dónde termina una carta y empieza la siguiente. El encuadre pone las marcas.

**Control de acceso al medio**: si diez equipos comparten un cable, dos que hablen a la vez se pisan y no se entiende nada. Esta función reparte el turno de palabra: quién puede hablar ahora y quién espera. En un cable compartido se resuelve escuchando antes de hablar; en Wi-Fi, con turnos coordinados por el punto de acceso.

**Direccionamiento físico**: la MAC identifica la placa, no la persona ni el equipo. Si cambiás la placa de red, cambia la MAC.

**Detección de errores**: el **CRC** (*Cyclic Redundancy Check*, verificación por redundancia cíclica) es una cuenta que se hace sobre todos los bits de la trama y se pega al final. El receptor hace la misma cuenta: si el resultado no coincide, algo se corrompió en el camino y la trama se tira. Ojo: se **detecta** el error, no se corrige. Corregir es trabajo de TCP, que retransmite.

### 9.3. Las tecnologías de esta capa

| Tecnología | Medio físico | Uso típico |
|------------|--------------|------------|
| **Ethernet (IEEE 802.3)** | Cable de par trenzado, fibra óptica | Toda LAN cableada moderna |
| **Wi-Fi (IEEE 802.11)** | Ondas de radio | LAN inalámbrica |
| **PPP** | Línea serial / punto a punto | Dial-up histórico, algunas VPN |
| **Frame Relay** | Redes WAN de operador | Conexiones entre sedes (legado, en extinción) |

Tres columnas: la tecnología, el medio por el que viaja y dónde se usa. **IEEE** (leelo "i-triple-e") es el instituto que publica estos estándares: el 802.3 es Ethernet y el 802.11 es Wi-Fi, por eso a veces ves esos números en las especificaciones de una placa. **WAN** significa *Wide Area Network* (red de área amplia): la red que une ciudades o sedes, típicamente contratada a un operador.

**Ethernet** es la tecnología de red cableada que ganó en todo el mundo, desde un aula hasta un centro de datos. **Wi-Fi** es su equivalente inalámbrico: mismas ideas (tramas, MAC, CRC), distinto medio. **PPP** (*Point-to-Point Protocol*) se usaba en las conexiones telefónicas y hoy sobrevive en algunos túneles. **Frame Relay** fue la tecnología de las redes de operador de los 90; hoy está en extinción y la reemplazaron MPLS y las conexiones por fibra.

Fijate que en esta capa conviven tecnologías muy distintas con las mismas cuatro funciones: eso es exactamente el valor del modelo. Cambiás el cable por ondas y las capas de arriba no se enteran.

### 9.4. Un ejemplo concreto: dos PCs en el mismo switch

Tenés dos PC conectadas al mismo switch y querés mandar un archivo de una a la otra. Las dos tienen IP `192.168.1.10` y `192.168.1.11`, y las dos están en la misma red.

1. La PC A quiere mandar a `192.168.1.11`. Sabe que está en su misma red, así que no hace falta router.
2. Para armar la trama necesita la MAC del destino. La busca en su tabla ARP; si no está, pregunta a los gritos en la red ("¿quién tiene la 192.168.1.11?").
3. La PC B contesta con su MAC. Ya hay con qué armar el sobre.
4. La PC A arma la trama con la MAC de B, calcula el CRC y la pone en el cable.
5. El switch la recibe, mira **solo la MAC de destino** y la manda por el puerto donde está esa placa. No mira la IP.
6. La PC B recibe la trama, verifica el CRC, ve que la MAC es la suya, la acepta y le pasa el paquete IP a la capa de arriba.

En todo el viaje, la IP no cambió ni una vez y la MAC fue la protagonista. Eso es la capa de Acceso a Red trabajando sola, sin router.

> **Clave de memoria:** en esta capa las direcciones son **MAC** (físicas, de la placa de red) y las cajas se llaman **tramas**. En la capa de arriba, las direcciones son **IP** (lógicas) y las cajas se llaman **paquetes**. Son dos "universos" distintos, y confundirlos es el error de principiante más común de las redes.

### Resumen

- La capa de Acceso a Red junta las capas 1 y 2 del OSI: el vecino inmediato y el medio físico.
- Sus cuatro funciones son encuadre, control de acceso al medio, direccionamiento físico y detección de errores.
- La **MAC** es la dirección física de 48 bits de cada placa; la **IP** es lógica y se configura.
- Ethernet y Wi-Fi son las dos tecnologías dominantes; comparten tramas, MAC y CRC.
- Dentro de una LAN, el switch entrega mirando solo la MAC; la IP recién importa cuando hay que cruzar de red.

---

## 10. La encapsulación: las muñecas rusas

### 10.1. El concepto estrella de este manual

Llegó el momento: **la encapsulación**, la muñeca rusa. Es el proceso que arma todo lo que viste, y si te llevás una sola idea de este manual, que sea esta.

Antes de mirar el dibujo, volvé a la carta. Vos escribís una hoja. La ponés en un sobre: el sobre no cambia la hoja, la envuelve. Adentro del sobre va la hoja, y afuera va la dirección. Después, la oficina de correos mete ese sobre en una bolsa con una etiqueta nueva. Después, el camión carga la bolsa. Y cuando llega, el cartero saca el sobre de la bolsa, y el destinatario saca la hoja del sobre.

Fijate el orden: **cada paso envuelve todo lo anterior y agrega su propia etiqueta por fuera**. Nadie reescribe la hoja. En redes, exactamente lo mismo, pero con nombres técnicos y en milisegundos.

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

Leelo de arriba hacia abajo, como si fuera una cebolla que se va envolviendo. Cada recuadro es la misma caja de antes, con un sobre más. El texto `GET /index.html` es lo que el navegador quiere pedir: la página de inicio del sitio.

En el **paso 1** está solo el dato, sin nada. En el **paso 2**, TCP le agrega por delante su sobre con los puertos (de qué programa sale y a qué programa va) y un número de secuencia (para poder rearmar el orden). A esa caja la llamamos **segmento**.

En el **paso 3**, IP agrega otro sobre por delante del de TCP, con la dirección de origen, la de destino y el TTL. Esa caja se llama **paquete**. Fijate que el sobre de TCP quedó adentro, intacto.

En el **paso 4**, Ethernet agrega un tercer sobre con las MAC del tramo y un CRC al final. Eso es la **trama**, y es lo que sale por el cable convertido en bits: voltajes que suben y bajan.

¿Ves el patrón? **Cada capa envuelve TODO lo anterior y le agrega su propio sobre por delante.** El contenido original (el `GET /index.html`) queda intacto en el centro — nadie lo modifica.

Y hay dos detalles que vale la pena mirar dos veces. El primero: los sobres se agregan **por delante**, no por atrás, salvo el CRC de Ethernet que va al final (eso es la "cola" de la trama). El segundo: cada sobre dice cosas que solo le importan a su capa. El de TCP habla de puertos y orden; el de IP, de direcciones y saltos; el de Ethernet, de vecinos y errores. Ninguno repite lo del otro.

Ahora el viaje de vuelta. Así, en el receptor, cada capa lee su sobre (que es el primero que le toca del lado de afuera), lo saca y pasa el resto hacia arriba:

```
 RECEPTOR:
 1º Ethernet abre su sobre   → le quedan [IP][TCP] GET /index.html
 2º IP abre su sobre         → le quedan [TCP] GET /index.html
 3º TCP abre su sobre        → le quedan GET /index.html
 4º La aplicación recibe el dato limpio → el navegador dibuja la página
```

Ese dibujo es el mismo proceso al revés, y se llama **desencapsulación**. La primera línea dice que Ethernet abre su sobre y lo que queda adentro es el paquete IP con el segmento TCP y el dato. La segunda dice que IP abre el suyo y deja el segmento. La tercera, que TCP abre el suyo y deja el dato pelado. La cuarta es el final feliz: la aplicación recibe exactamente lo que la otra aplicación escribió, sin un byte de más ni de menos.

Fijate en el orden: se abre **de afuera hacia adentro**, al revés de como se armó. Es la única forma de que funcione, porque cada capa solo puede abrir su sobre cuando la de abajo ya le entregó el interior limpio.

> **Regla de oro (la repetimos con intención):** cada capa agrega su sobre **sin mirar ni modificar** lo que lleva adentro. Encapsulación al bajar, desencapsulación al subir. El dato original viaja siempre intacto.

Una aclaración honesta sobre el ejemplo: el pedido dice `GET /index.html` sobre el puerto 443, y el 443 es HTTPS. En la realidad, entre TCP y HTTP hay una capa más, **TLS** (*Transport Layer Security*), que es la que cifra: el pedido HTTP viaja cifrado dentro de un sobre TLS, que a su vez va dentro de TCP. El ejemplo lo omite para no sumar una capa al dibujo. No cambia nada del ejercicio, pero conviene saberlo para no sorprenderte cuando veas una captura real con un sobre más.

### 10.2. El costo de los sobres: el overhead

Envolver no es gratis. Cada sobre ocupa bytes. En Ethernet, una trama clásica puede llevar como máximo **1500 bytes de contenido** (el **MTU**): si tu dato mide más, la capa de Red lo **fragmenta** en paquetes más chicos y TCP lo rearma en el destino.

**MTU** significa *Maximum Transmission Unit* (unidad máxima de transmisión): el tamaño máximo de contenido que entra en una trama. Es como el peso máximo que acepta una caja del correo: si tu paquete pesa más, lo partís en dos cajas.

Un cálculo simple para que veas el costo:

- Datos reales de la aplicación: **1460 bytes**
- Sobre TCP (20 bytes) + sobre IP (20 bytes) = **40 bytes extra**
- Total que viaja: **1500 bytes**
- Eficiencia: 1460 / 1500 ≈ **97%** — los sobres cuestan solo el 3%.

Repasemos las cuentas, porque son las cuentas que hace un técnico de verdad. El MTU de Ethernet es 1500 bytes: eso es lo que entra en la trama. De esos 1500, 20 se los lleva la cabecera IP y 20 la cabecera TCP, así que quedan 1460 para datos. Ese número tiene nombre propio: **MSS** (*Maximum Segment Size*), el tamaño máximo de datos que puede llevar un segmento. Por eso ves 1460 en tantos lados.

La eficiencia se calcula dividiendo lo útil por el total: 1460 sobre 1500 da 0,973, o sea 97%. El 3% restante son sobres. Y el 3% suena a nada, pero en un enlace que mueve terabytes por día es un montón de dinero, así que los que diseñan redes miran el *overhead* con lupa.

Y si el dato es chiquito, el overhead se vuelve enorme: mandar un byte con TCP gasta 41 bytes (1 de dato y 40 de sobres), o sea un 97,5% de sobre. Por eso los protocolos que mandan mensajitos optan por UDP, cuyo sobre es de 8 bytes. La cuenta cambia por completo según el tamaño del mensaje.

> **HACELO VOS:** agarrá una hoja, escribí una palabra en el centro. Andá envolviéndola con tres sobres, y en cada uno anotá un dato de viaje: destinatario (IP), ventanilla (puerto), dirección de calle (MAC). Después abrí los sobres de atrás hacia adelante y anotá qué leíste en cada uno — recién ahí "llegó el dato a la aplicación". Eso, exactamente eso, es la encapsulación.

Cuando lo hagas, fijate en una cosa: el papel de adentro no cambió ni una letra. Eso es lo que significa "el dato viaja intacto". Y fijate en otra: cada sobre tiene escrito algo que **solo le sirve a quien lo tiene que abrir**. El de la ventanilla no dice la dirección de la calle; el de la calle no dice qué ventanilla. Cada capa lee lo suyo y nada más.

### Resumen

- **Encapsulación** es envolver el dato, capa por capa, agregando un sobre por delante sin tocar el contenido.
- El orden es dato → segmento (TCP) → paquete (IP) → trama (Ethernet) → bits.
- **Desencapsulación** es el mismo proceso al revés: cada capa abre su sobre y pasa el interior hacia arriba.
- Los sobres cuestan: 40 bytes sobre 1500 dejan una eficiencia del 97%; con mensajes chiquitos el costo relativo sube mucho.
- El **MTU** (1500 bytes en Ethernet) es el límite del contenido; si el dato no entra, se fragmenta.

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

Antes del dibujo, tres siglas de este relato. **ISP** es *Internet Service Provider*: la empresa que te vende la conexión. **NAT** es *Network Address Translation* (traducción de direcciones de red): tu router reemplaza tu IP privada por la IP pública que te dio el ISP, y cuando vuelve la respuesta hace el camino inverso; por eso miles de casas pueden compartir una sola IP pública. Y la **tabla de enrutamiento** es la lista de "para llegar a tal red, salí por tal puerta", que es el mapa de rutas de cada router.

Fijate en algo que suele pasarse por alto: **el switch no abre el paquete IP y el router no abre el segmento TCP**. Cada aparato del camino abre exactamente el sobre que le corresponde y nada más. El switch es capa 2, el router es capa 3. Eso, además de ser elegante, es lo que hace que internet sea rápido: nadie hace trabajo de más.

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

Cómo leerlo: cada columna es un aparato del camino, de izquierda a derecha. Dentro de cada columna están las capas que ese aparato implementa: tu PC tiene las cuatro, el switch solo la de Acceso (por eso las de arriba están vacías), los routers tienen Internet y Acceso, y el servidor tiene las cuatro. Las flechas rotuladas "trama" son lo que viaja de un aparato al siguiente.

Abajo de cada columna está su trabajo en una línea: tu PC **arma** la muñeca rusa; el switch **solo mira la MAC** (capa 2); los dos routers **cambian el sobre Ethernet sin tocar el paquete IP** (capa 3); el servidor **abre todos los sobres**, de la capa 2 hacia la 5.

La imagen mental que deja este dibujo: el paquete IP es el pasajero, la trama es el colectivo. El pasajero sigue siendo el mismo de punta a punta; los colectivos cambian en cada tramo. Y el switch es el que mira el número del colectivo, no la cara del pasajero.

### 11.2. La regla que ordena todo: qué cambia y qué no

| Elemento | ¿Cambia en el camino? | Detalle |
|----------|:---------------------:|---------|
| Direcciones **MAC** | **SÍ, en cada salto** | Cada tramo tiene su propio sobre: la MAC del vecino de HOY, no del destino final |
| Direcciones **IP** | **NO** | La IP de origen y destino es la misma de punta a punta (salvo la traducción NAT del router) |
| El **dato** (HTTP) | **NO** | Viaja intacto, envuelto por capas, hasta el final |
| El **TTL** | SÍ, baja en cada salto | Contador anti-paquetes-perdidos |

Esta tabla es la que hay que llevarse de todo el capítulo. La columna del medio responde sí o no, y la derecha explica por qué. Cuatro elementos, dos que cambian y dos que no, y una excepción anotada (NAT).

Esta es la clave mental que separa a los que entienden redes de los que memorizan:

> **La MAC cambia en cada tramo (barrio por barrio); la IP es fija de punta a punta (de dirección a dirección). El cartero cambia, la carta no.**

Volvé a la analogía del correo y mirá qué bien encaja. La dirección del destinatario está escrita en el sobre y no cambia en todo el viaje: es la IP. Pero en cada sucursal alguien pega una etiqueta nueva en la bolsa que dice "esta bolsa va al camión de la ruta 3": esa etiqueta vale solo para ese tramo y se tira al llegar. Es la MAC. El dato es la hoja, que nadie toca. Y el TTL es la cantidad de oficinas que le quedan antes de que la carta se devuelva.

Si te quedás con esa imagen, ya podés explicar por qué un mismo paquete puede aparecer con MAC distintas en dos capturas de red tomadas en puntos distintos del camino, y por qué la IP es la misma.

### Resumen

- El paquete baja por las capas en tu PC, cruza varios equipos y sube por las capas en el servidor.
- El switch solo mira la MAC; el router abre el sobre Ethernet, cambia la MAC y no toca la IP.
- Cada router resta uno al TTL y, si llega a cero, descarta el paquete.
- **MAC cambia en cada salto; IP no cambia; el dato no cambia; el TTL siempre baja.**
- La respuesta del servidor hace el camino inverso con una muñeca rusa nueva.

---

## 12. Cómo resolver problemas por capas

### 12.1. El método del piso en llamas

Cuando algo falla, lo peor es adivinar. El método profesional es **bajar por la pila desde arriba, o subir desde abajo, comprobando capa por capa** hasta encontrar la primera que falla.

> **Regla de oro del diagnóstico:** el problema está en la **primera capa que falla** — y ninguna capa de arriba puede funcionar si una de abajo no anda. Si el cable está cortado (capa 1), da igual lo que haga el navegador (capa 5): no va a haber página.

Esa regla tiene una consecuencia práctica enorme: **empezá por abajo**. Es tentador abrir el navegador y ponerse a revisar la configuración del proxy, pero si el cable está flojo, todo lo demás es perder el tiempo. Los que saben van de abajo hacia arriba porque cada prueba descarta un bloque entero de causas.

Pensalo como el piso en llamas de un edificio: si el tercer piso se está incendiando, no tiene sentido discutir si el ascensor del séptimo anda. Primero el fuego. En redes, primero la capa 1.

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

Cómo leerla: cada fila es un paso del checklist, en orden de abajo hacia arriba. La segunda columna dice qué capa estás probando; la tercera, qué hacés concretamente (con el comando entre paréntesis cuando hay uno); la cuarta, qué significa que esa prueba falle.

Los comandos que aparecen: `ipconfig` es el de Windows y `ip addr` el de Linux, y los dos te muestran la configuración de red del equipo. `ping 192.168.1.1` es la prueba típica contra el router de tu casa (esa dirección suele ser la del router). `ping 8.8.8.8` es la prueba contra un servidor público de DNS de Google, que responde casi siempre. `ping google.com` es la misma prueba pero con nombre en vez de número.

Lo que un principiante tiene que mirar en pantalla: si el `ping` contesta con tiempos en milisegundos, hay camino. Si dice "Destination Host Unreachable" o "Request timed out" o "tiempo de espera agotado", no hay camino hacia ese destino. Y si el `ping` por IP anda pero el `ping` por nombre falla, ya sabés que el problema es el DNS y no la conexión.

Fijate la lógica: **cada prueba depende de la anterior**. Si `ping 8.8.8.8` funciona (capa 3 OK) pero `ping google.com` no (capa 5 DNS), ya sabés que el problema es el DNS y no el cable.

Hay un detalle que ahorra discusiones: los tres pings son distintos en alcance. El primero cruza solo tu red local; el segundo sale a internet y no depende de ningún nombre; el tercero depende de que alguien traduzca el nombre. Cada uno descarta una capa más que el anterior.

### 12.3. Las preguntas que hace un profesional

Cuando llega un "no anda", las primeras preguntas siempre separan capas:

- ¿**Un solo sitio** anda mal, o todos? → Uno solo: probablemente capa 5 (ese servidor o ese DNS). Todos: probablemente capa 1-3 (tu conexión).
- ¿Anda **por cable** y no por Wi-Fi? → Capa 1 (radio, distancia, interferencia).
- ¿Anda en **otra hora**? → Posiblemente saturación (capa 3/4, congestión).
- ¿Le pasa a **un solo dispositivo**? → La placa, la configuración IP o el cable de ese equipo (capas 1-2).
- ¿Le pasa a **todos**? → El router, el ISP o el servicio (capas 3+).

Cada pregunta es un filtro. Con dos o tres respuestas ya achicaste el problema a una o dos capas, y recién ahí empezás a probar. Eso es diagnosticar: no es adivinar más rápido, es descartar mejor.

> **Ejemplo resuelto:** "No abro un sitio, pero el resto de internet anda." → Capa 1-3 OK (ping a 8.8.8.8 anda). DNS OK (otros sitios abren). El problema es específico de ESE servidor: lo apuntás con una IP directa para confirmar y listo. Ningún técnico adivina: **descarta capas con pruebas**.

Ese último truco merece explicación: si el sitio no abre por nombre pero sí abre poniendo su IP en el navegador, confirmaste que el problema es la traducción del nombre (DNS), no el servidor ni tu conexión. Es una prueba de una sola capa, y la hacés en diez segundos.

### Resumen

- Diagnosticá por capas, empezando por abajo: el problema está en la primera capa que falla.
- El checklist es: medio físico, dirección IP, router, internet, nombres, aplicación.
- Cada prueba depende de la anterior, así que el orden no es capricho.
- Un solo sitio caído apunta a la capa de Aplicación; todos los sitios, a las capas 1 a 3.
- Un técnico no adivina: descarta capas con pruebas concretas.

---

## 13. Herramientas que ven las capas

### 13.1. Ping (ICMP — capa 3)

`ping` manda un mensaje ICMP de ida y vuelta y mide el tiempo. Te dice **si hay camino** hasta el destino:

```
$ ping 8.8.8.8
64 bytes from 8.8.8.8: icmp_seq=1 ttl=116 time=4.32 ms
```

Leé la salida línea por línea. El `$` es el indicador de la terminal: no lo escribís vos, aparece solo. `ping 8.8.8.8` es el comando con su argumento, la dirección del destino. La línea siguiente es la respuesta.

- `64 bytes from 8.8.8.8`: llegó una respuesta de 64 bytes desde esa dirección. Si el destino no contesta, esta línea no aparece.
- `icmp_seq=1`: es el número de intento. Cada vez que mandás un ping manda uno por segundo, y este dice que es el primero.
- `ttl=116`: cuántas vidas le quedaban al paquete al llegar (si es cercano a 255, está cerca; si es bajo, dio muchas vueltas).
- `time=4.32 ms`: latencia de ida y vuelta.

Lo que un principiante tiene que mirar: que aparezcan líneas de respuesta y que `time` esté en milisegundos bajos. Menos de 20 ms en una conexión domiciliaria es normal; 200 ms avisa de un problema o de una distancia grande. Si ves "Request timed out" o "100% packet loss", no hubo respuesta.

- Si no responde: o no hay ruta, o el destino bloquea ICMP (común). Por eso "ping no anda" no siempre significa "red caída".

El `ttl` que ves en la respuesta no es el que mandaste: es el que puso el destino en su propia respuesta. Cada sistema operativo arranca con un valor distinto (Linux y macOS suelen usar 64, Windows 128), así que `ttl=116` sugiere que salió con 128 y atravesó 12 routers.

### 13.2. Traceroute (capa 3 + 2)

`traceroute` (o `tracert` en Windows) le muestra TODOS los saltos entre vos y el destino: el mapa de la ruta. Cada línea es un router intermedio:

```
$ traceroute google.com
 1  router-casa (192.168.1.1)       1.2 ms
 2  isp-01.ar.isp.net (10.5.0.1)    8.1 ms
 3  core-3.ar.isp.net (170.0.2.1)   12.4 ms
 4  google-gw (142.250.70.1)        18.0 ms
```

Cuatro datos en cada línea. El primero es el número de salto: 1 es el primer router, 2 el segundo, y así. Después viene el nombre del router y, entre paréntesis, su dirección IP. Al final, el tiempo de ida y vuelta hasta ese salto, en milisegundos. Fijate cómo el tiempo sube a medida que el salto está más lejos: 1,2 ms para el router de tu casa, 18 ms para la puerta de Google.

El nombre del router suele delatar de quién es: `router-casa` es tu router, `isp-01.ar.isp.net` es el primero de tu proveedor en Argentina, `google-gw` es la puerta de entrada a la red de Google.

Y hay un mecanismo detrás que ya conocés: `traceroute` manda paquetes con TTL 1, después con TTL 2, después con TTL 3, y cada router que se queda sin vida contesta con un ICMP de "tiempo excedido". Por eso puede mostrarte el camino: obliga a cada router a delatarse.

El `* * *` en un salto significa "ese router no contesta ICMP" — no necesariamente que esté caído. La herramienta de diagnóstico definitiva para saber EN QUÉ capa y en QUÉ tramo se corta la ruta.

### 13.3. Wireshark (todas las capas a la vista)

**Wireshark** es el microscopio: captura tramas reales y les muestra la muñeca rusa completa — la trama Ethernet, el paquete IP, el segmento TCP y el dato de aplicación, cada uno en su sección. Cuando leas un capture en Wireshark, vas a ver *exactamente* los sobres que este manual te enseñó a reconocer.

La pantalla tiene tres partes, y conviene saber leerlas. Arriba, una lista de paquetes capturados, uno por línea, con hora, direcciones y protocolo. Al hacer clic en uno, el panel del medio muestra el **árbol de capas**: un renglón por sobre, del más externo (Ethernet) al más interno (HTTP), cada uno con una flechita para desplegar sus campos. Abajo, los bytes crudos en hexadecimal, que es lo que realmente viajó por el cable.

Cuando despliegues el renglón de Ethernet vas a ver las MAC; en el de IP, las direcciones y el TTL; en el de TCP, los puertos y los números de secuencia. Es la encapsulación del capítulo 10 mostrada por una herramienta, en vivo y con tus propios datos.

### 13.4. Comandos de configuración (capas 2 y 3)

| Comando | Qué te muestra | Capas |
|---------|----------------|-------|
| `ipconfig /all` (Windows) / `ip addr` (Linux) | Tu IP, tu máscara, tu gateway, tu DNS | 2-3 |
| `arp -a` | La tabla que traduce IP → MAC de tu red local | 2-3 |
| `netstat` | Las conexiones TCP activas y sus puertos | 4 |
| `route print` / `ip route` | Tu tabla de enrutamiento local | 3 |

Tres columnas: el comando, qué te muestra y en qué capas trabaja. La última columna es la más útil para estudiar: te dice a qué piso del edificio pertenece cada dato.

Los términos de la primera fila: la **máscara** (o máscara de subred) es el número que le dice a tu equipo qué parte de la IP es la red y qué parte es el equipo; el **gateway** (o puerta de enlace) es la IP del router por el que salís a internet. Los dos son datos de capa 3.

`arp -a` te lista la agenda del barrio: qué IP corresponde a qué MAC, tal como la aprendió tu equipo. `netstat` te muestra las conversaciones abiertas y sus puertos, o sea la capa 4 en acción. `route print` (Windows) e `ip route` (Linux) te muestran tu tabla de rutas: para llegar a tal red, salí por tal interfaz.

Lo que un principiante tiene que buscar: en la primera fila, que exista un gateway y que sea una IP de tu misma red; en la segunda, que aparezca la IP de tu router con su MAC; en la tercera, si hay conexiones en estado `ESTABLISHED` (abiertas) o `TIME_WAIT` (cerrándose); en la cuarta, la línea `default` o `0.0.0.0`, que es la ruta por la que sale todo lo que no sabés a dónde va.

> **HACELO VOS:** abrí una terminal y corré `ping 8.8.8.8`, después `traceroute google.com` y mirá con `ipconfig` tu IP y tu gateway. Cada dato que veas corresponde a una capa de este manual — ahora ya sabés leerlos.

Si querés que la práctica sea completa, anotá en un papel tus datos y al lado poné la capa: IP y gateway son capa 3, la MAC de tu router es capa 2, el `time` del ping es una medida de capa 3, los puertos de `netstat` son capa 4. Cuando termines, vas a tener el modelo entero escrito con tus propios números.

### Resumen

- `ping` prueba si hay camino (capa 3) y muestra el TTL y la latencia en milisegundos.
- `traceroute` muestra el camino salto por salto y aprovecha el TTL para hacer hablar a cada router.
- **Wireshark** captura tráfico real y muestra el árbol de sobres de la encapsulación.
- `ipconfig`, `arp -a`, `netstat` y `route print` muestran configuración de capas 2, 3 y 4.
- Cada dato que devuelve una herramienta pertenece a una capa: saber cuál es la mitad del diagnóstico.

---

## 14. Comprobá lo que aprendiste

Respondé antes de mirar las respuestas, después destapá cada una con el detalle. Si alguna te resulta difícil, volvé a esa sección — no sigas de largo.

Tapar la respuesta con la mano y contestar en voz alta funciona mejor de lo que parece: si no podés decirlo con tus palabras, todavía no lo entendiste, y es mejor descubrirlo ahora.

#### 1. ¿Por qué las redes se dividen en capas y no se resuelven de una sola pieza?

Porque la comunicación de extremo a extremo es una cadena de problemas enormes (señales, direcciones, rutas, errores, orden). Dividirla en capas con una responsabilidad cada una permite estandarizar cada pieza por separado, evolucionar una sin romper las otras, y aislar fallas: el problema está donde la primera capa falla.

Y hay una razón práctica que no está en la respuesta corta: si todo fuera una sola pieza, cambiar el Wi-Fi obligaría a reescribir los navegadores. Con capas, el fabricante de la placa cambia su parte y el resto del mundo ni se entera.

#### 2. Numerá las 7 capas del OSI de abajo hacia arriba.

1 Física → 2 Enlace de Datos → 3 Red → 4 Transporte → 5 Sesión → 6 Presentación → 7 Aplicación. (El TCP/IP las agrupa en 4: Acceso a Red = 1+2, Internet = 3, Transporte = 4, Aplicación = 5+6+7.)

Si te acordás de la carta, no hace falta memorizar: la 1 es el camión, la 2 el cartero, la 3 la dirección del sobre, la 4 el acuse de recibo, la 5 el saludo, la 6 el idioma y la 7 lo que querés decir.

#### 3. ¿Qué nombre recibe el dato que maneja cada capa? (PDU)

Física: **bits**. Enlace: **trama**. Red: **paquete**. Transporte: **segmento** (TCP) o **datagrama** (UDP). Aplicación: **datos**. La PDU es la "caja" que cada capa produce.

Truco para no olvidarlo: la caja cambia de nombre cada vez que alguien le pega un sobre nuevo. Mientras nadie la envuelva, es "datos". Después de TCP es "segmento", después de IP es "paquete", después de Ethernet es "trama", y cuando sale por el cable son "bits".

#### 4. ¿Cuándo usarías TCP y cuándo UDP?

TCP cuando el dato no puede perderse ni desordenarse: descargas, correo, páginas web (handshake + retransmisión + orden). UDP cuando la velocidad manda y la pérdida es tolerable o la retransmisión llegaría tarde: videollamadas, streaming en vivo, juegos, DNS.

La pregunta que decide es siempre la misma: **¿si se pierde un pedacito, se puede pedir de nuevo a tiempo?** Si la respuesta es sí, TCP. Si pedirlo de nuevo llegaría tarde o no importa, UDP.

#### 5. ¿Qué es la encapsulación y cuántos sobres tiene una trama Ethernet con HTTP adentro?

Es el proceso de envolver los datos con la información de control de cada capa: cada una agrega su sobre (cabecera) sin tocar el contenido. Una trama que lleva HTTP tiene 3 sobres: **Ethernet** (el más externo), **IP** y **TCP**. El dato HTTP está en el centro, intacto.

Tres sobres, en ese orden de afuera hacia adentro. Y si el sitio es HTTPS, hay un cuarto sobre (TLS) entre TCP y HTTP, que el ejemplo del manual omite para no complicar el dibujo.

#### 6. Las direcciones IP ¿cambian o no en cada salto? ¿Y las MAC?

Las **IP no cambian** de punta a punta (salvo NAT): identifican el destino final. Las **MAC sí cambian en cada tramo**: cada nuevo sobre Ethernet se arma con las MAC del vecino inmediato. "El cartero cambia, la carta no."

La excepción del NAT vale la pena retenerla: tu router reemplaza tu IP privada por la pública al salir, y hace lo contrario al volver. Por eso, si comparás una captura hecha en tu PC con una hecha del otro lado del router, la IP no coincide. Es el único caso normal en que la IP "cambia".

#### 7. A alguien "no le abre un sitio, pero el resto de internet anda". ¿Qué capas descartás con qué pruebas?

Capa 1-3 descartadas si `ping 8.8.8.8` funciona. DNS descartado si otros sitios abren. El problema es específico del servidor o de su resolución puntual (capa 5): probás la IP directa del sitio para confirmar. Adivinar sin pruebas es el error de principiante.

El orden importa: primero la prueba más amplia (¿hay internet?), después la más específica (¿este nombre se resuelve?), y al final la del sitio. Cada prueba que pasa descarta una capa y te deja menos sospechosos.

### Resumen

- Las siete preguntas cubren el modelo, las PDU, TCP y UDP, la encapsulación, MAC contra IP y el diagnóstico.
- Si podés contestarlas con tus palabras, el manual cumplió su objetivo.
- La pregunta que más sirve en el trabajo es la 7: separar capas con pruebas antes de tocar nada.
- Ninguna respuesta se memoriza: todas se deducen de la carta y de la muñeca rusa.

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

Este glosario es de consulta, no de lectura obligatoria: está ordenado casi en el orden en que aparecieron los términos en el manual, así que sirve también como repaso. Cada fila tiene el término en negrita y una definición de una línea. Si una definición te deja con dudas, buscá el capítulo donde se explica con ejemplo: la columna izquierda es la puerta de entrada, no el contenido completo.

Dos términos que suelen confundirse y conviene mirar juntos: **paquete** y **trama**. El paquete es de la capa de Red y habla de direcciones IP; la trama es de la capa de Enlace y habla de direcciones MAC. Un paquete viaja *dentro* de una trama, nunca al revés.

Y otros dos: **MTU** y **MSS**. El MTU es el tamaño máximo de contenido que acepta una trama (1500 bytes en Ethernet clásico); el MSS es lo que queda para datos después de descontar los sobres de IP y TCP. El primero es del correo, el segundo es de la carta.

### Resumen

- El glosario reúne los 24 términos que el manual usa y los define en una línea cada uno.
- Está en el orden en que aparecen en el texto, así que sirve como repaso.
- **Paquete** es de la capa de Red; **trama** es de la capa de Enlace; el paquete va dentro de la trama.
- **MTU** es el límite de la trama; **MSS** es lo que queda para datos.
- Es una tabla de consulta: ante la duda, volvé al capítulo que lo explica con ejemplo.

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

Si tuvieras que explicarle este manual a alguien en dos minutos, usá la carta. Escribís la hoja (aplicación), la ponés en un sobre con la dirección del destinatario (red), la llevás al correo donde la clasifican (router), viaja en un camión (física) y el cartero del barrio la entrega en la puerta exacta (enlace). Cada empleado hace su parte, nadie lee lo que no le toca, y cada oficina le pega una etiqueta nueva a la bolsa sin tocar la hoja.

Y si te preguntan por las siglas: OSI es el plano que sirve para pensar, TCP/IP es la red que funciona, IP es la dirección del sobre, MAC es la puerta de la casa, TCP es el acuse de recibo y UDP es la postal sin acuse.

### Resumen

- Los modelos existen para que equipos distintos se entiendan: son un acuerdo, no un aparato.
- El OSI (7 capas) sirve para entender y diagnosticar; el TCP/IP (4 capas) es el que corre internet.
- Cada capa agrega su sobre sin tocar el dato: encapsulación al bajar, desencapsulación al subir.
- La MAC cambia en cada tramo y la IP no cambia: el cartero cambia, la carta no.
- Diagnosticá siempre por capas, de abajo hacia arriba, y el problema está en la primera que falla.

---

> **Fuente:** Documentación propia basada en estándares ISO, IETF y material educativo de redes.

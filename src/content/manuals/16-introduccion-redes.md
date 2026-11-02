# 16. Introducción a las Redes

Este es el primer manual de la biblioteca de redes y tiene un solo objetivo: que termines con
un mapa mental claro de qué es una red, con qué piezas se arma y para qué sirve cada una. No
hace falta que sepas nada antes de empezar. Si nunca miraste un router de cerca ni sabés qué
significa "IP", estás exactamente en el lugar correcto.

Una advertencia sobre el método. Acá no vas a memorizar siglas. Cada concepto se presenta
siempre en el mismo orden: qué problema resuelve, con qué se parece en la vida diaria, y
recién después la definición precisa. Ese orden importa, porque una definición sin el problema
que resuelve es una frase suelta que se te olvida el lunes.

Y una promesa concreta: al final vas a poder explicar, paso por paso, qué pasa desde que
escribís una dirección en el navegador hasta que la página aparece en pantalla. Ese relato es
el que ordena todo lo demás, y es el que vuelve a aparecer en cada manual de la biblioteca.

---

## Índice

- [Cómo usar este manual](#cómo-usar-este-manual)
- [¿Qué es una red?](#1-qué-es-una-red)
- [Los tres ingredientes de toda red](#2-los-tres-ingredientes-de-toda-red)
- [¿Qué le ofrece una red? Ventajas y costos](#3-qué-le-ofrece-una-red-ventajas-y-costos)
- [Las preguntas clave antes de crear una red](#4-las-preguntas-clave-antes-de-crear-una-red)
- [Administración de red: la red no se cuida sola](#5-administración-de-red-la-red-no-se-cuida-sola)
- [Tipos de redes según su alcance](#6-tipos-de-redes-según-su-alcance)
- [Las VPN: un túnel privado dentro de una red pública](#7-las-vpn-un-túnel-privado-dentro-de-una-red-pública)
- [Modelos de conexión: ¿iguales o jerárquicos?](#8-modelos-de-conexión-iguales-o-jerárquicos)
- [Topologías de red: la forma de la red](#9-topologías-de-red-la-forma-de-la-red)
- [¿Qué topología es mejor?](#10-qué-topología-es-mejor)
- [Mapeo de la topología: dibuja tu red](#11-mapeo-de-la-topología-dibuja-tu-red)
- [Componentes de red en profundidad](#12-componentes-de-red-en-profundidad)
- [¿Qué pasa cuando abro Google? El viaje completo](#13-qué-pasa-cuando-abro-google-el-viaje-completo)
- [Comprobá lo que aprendiste](#14-comprobá-lo-que-aprendiste)
- [Glosario](#15-glosario)
- [Resumen en 10 puntos](#16-resumen-en-10-puntos)
- [Próximo paso](#próximo-paso)

Este índice es también el orden en el que conviene leer el manual. Los primeros tres capítulos
son de ideas generales; del cuarto al sexto, de decisiones y tamaños; del séptimo al noveno, de
formas de conectar; y los últimos bajan al detalle de las piezas y terminan con el viaje
completo de un dato.

### Resumen

- El manual está ordenado en cuatro tramos: **ideas generales**, **decisiones y tamaños**, **formas
  de conectar** y **piezas y viaje completo**.
- Los primeros capítulos no piden nada previo; los últimos se disfrutan mucho más si leíste los
  anteriores.
- Podés usar el índice como lista de control: si un título no te suena, es el que te falta.

---

## Cómo usar este manual

Este manual es el **punto de partida** para entender cómo funcionan las redes. Al terminarlo vas a tener un mapa mental completo de qué es una red, con qué piezas se construye y por qué existen cada una de esas piezas.

**Cómo está pensado:**

- **No necesitás nada previo.** Si nunca tocaste una red, este es tu lugar. Si ya sabés algo, te sirve para ordenar y confirmar conceptos.
- **Cada concepto importante tiene tres partes**: qué es, una **analogía** con la vida cotidiana, y un **ejemplo concreto**. Ese patrón se repite a lo largo de todo el curso.
- **Los términos en negrita** aparecen explicados en el [Glosario](#15-glosario) al final del manual.
- Buscá los recuadros **HACELO VOS**: son actividades prácticas de 5 minutos que te anclan la teoría en la realidad. Se puede aprender sin hacerlas, pero se aprende el doble haciéndolas.
- Al final hay una sección de **preguntas de autoevaluación**, con la respuesta escrita justo debajo de cada pregunta: tapá con la mano y contestá antes de leer.

Una última cosa antes de arrancar: si algún concepto no te queda claro a la primera, **es normal**. Las redes se entienden en capas, igual que se construyen: primero la idea general, después el detalle. Acá vamos a hacer exactamente eso.

### Cómo leer los recuadros y los diagramas

Antes de seguir, tres convenciones que se repiten en todo el manual.

Los **diagramas en bloque** (los que están entre líneas de tres comillas) son dibujos hechos con
caracteres de texto. Se leen de arriba hacia abajo: los corchetes son equipos, las líneas
verticales y horizontales son cables, y las flechas o los paréntesis aclaran qué está pasando.
No son código: son la foto de una instalación.

Los **recuadros con `>`** (los que aparecen con una barra vertical a la izquierda) son
comentarios al margen: analogías, advertencias y datos que conviene tener a mano aunque no sean
parte del hilo principal.

Los **bloques de comandos** son los únicos que se copian y se pegan en una terminal. Después de
cada uno vas a encontrar la explicación de qué hace, qué significa cada parte y qué tenés que
mirar en pantalla para saber si salió bien.

### La regla de las tres preguntas

Cuando te enfrentes a un concepto nuevo —y van a aparecer muchos— hacete siempre estas tres
preguntas, en este orden:

1. **¿Qué problema resuelve?** Sin problema no hay tecnología. Un cable existe porque hay que
   llevar señal de un lado a otro; un router existe porque hay que decidir por dónde sale.
2. **¿A qué se parece en la vida diaria?** La analogía no es decoración: es el gancho donde
   colgás el concepto hasta que lo entendés del todo.
3. **¿Cómo se llama, exactamente?** Recién acá la definición precisa. Si la definición viene
   primero, se aprende de memoria y se olvida.

### Resumen

- El manual está pensado para **quien nunca tocó una red**, y cada concepto viene con analogía y
  ejemplo antes de la definición.
- Los recuadros `>` son comentarios al margen, los diagramas en bloque son dibujos de instalación
  y solo los bloques de comandos se copian en una terminal.
- Ante cualquier concepto nuevo, usá **las tres preguntas**: qué problema resuelve, a qué se parece
  y cómo se llama.
- Si algo no cierra a la primera, seguí: las redes se entienden primero en general y después en
  detalle, que es el orden en el que está escrito todo el manual.

---

## 1. ¿Qué es una red?

### 1.1. La definición simple

Una **red** es un conjunto de **dos o más dispositivos informáticos conectados entre sí** con el objetivo de compartir información y recursos.

Eso es todo. Cuando tu celular le manda una foto a tu notebook por Bluetooth, **es una red**. Cuando el termostato de tu casa habla con la app del celular, **es una red**. Cuando tu computadora abre esta página, está usando la red más grande que existe: **internet**.

Fijate en el detalle más importante de la definición: dice **dos o más**. No dice "muchas". Una
red no necesita ser grande para ser una red. Dos máquinas con un cable entre medio ya son una
red, y todo lo que vas a aprender en este curso —direcciones, paquetes, routers, protocolos—
aplica a ese cable igual que a internet entera. Empezar por el caso de dos máquinas hablando es
la mejor manera de entender el resto: si entendés cómo se hablan dos, entendés cómo se hablan
dos millones, porque el mecanismo es el mismo y solo cambia la cantidad de intermediarios.

Detrás de cada interacción digital hay una red:

| Situación cotidiana | ¿Dónde está la red? |
|---------------------|---------------------|
| Leer este documento | Posiblemente ya estás conectado a una red local o a internet |
| Enviar un mensaje de WhatsApp | Tu celular → la red de tu operador → internet → el celular de la otra persona |
| Imprimir un documento desde el celular | La impresora y el celular están en tu red doméstica |
| Ver una serie en streaming | Tu Smart TV pide datos a un servidor que está a miles de kilómetros |
| Jugar una partida online | Tu consola se conecta con los servidores del juego y con otros jugadores |

**Cómo leer esta tabla.** Tiene dos columnas y conviene leerla de izquierda a derecha, fila por
fila. La columna **"Situación cotidiana"** es lo que vos hacés: nada técnico, cosas que hiciste
esta semana. La columna **"¿Dónde está la red?"** es la respuesta honesta: qué equipos, qué
cables y qué tramos de red se pusieron en marcha para que eso funcionara.

Lo que tenés que mirar, y lo que sorprende a casi todo el mundo la primera vez: **en las cinco
filas hay red**. No hay ninguna situación de la lista que funcione "sin red". Incluso la primera
—leer un documento— supone que el archivo llegó hasta tu pantalla de algún lado, sea de un
servidor en otro país o de una carpeta compartida en tu propia casa.

La segunda cosa para mirar es la **cantidad de saltos**. En la fila de la impresora hay un solo
salto: el celular y la impresora están en la misma red doméstica. En la fila de WhatsApp hay
cuatro tramos: tu celular, la red del operador, internet y el celular del otro. Cuantos más
saltos, más piezas que pueden fallar, y por eso cuando "no anda internet" lo primero que se
prueba es lo más cercano: ¿anda la red de casa?

### 1.2. La analogía del sistema postal

Para entender las redes, la mejor analogía que existe es el **sistema postal mundial**. Pensalo un segundo:

- Vos le escribís una carta a alguien que vive en otra ciudad.
- Ponés la carta en un **sobre** con la **dirección** del destinatario y la tuya (**remitente**).
- El cartero local la lleva a la **sucursal de correo** de tu barrio.
- Esa sucursal la despacha a una **central de distribución** más grande, que la manda a la ciudad del destinatario.
- Allá, otro cartero la deja en la puerta de tu amigo.

Ahora traduzcamos:

| Sistema postal | Red de computadoras |
|----------------|---------------------|
| La carta | Un **paquete de datos** |
| El sobre con direcciones | El **encabezado** del paquete (dice quién lo manda y a quién va dirigido) |
| El cartero de barrio | La **red local** (tu casa, tu oficina) |
| La central de distribución | El **router** de tu casa y los routers de los proveedores |
| Las rutas entre ciudades | La **infraestructura de internet** (cables, fibra óptica, torres) |
| El sistema que decide cómo llega la carta | Los **protocolos de enrutamiento** |

**Cómo leer esta tabla.** Acá las columnas no son "antes y después": son dos mundos en paralelo.
A la izquierda está el mundo físico que ya conocés (la carta, el sobre, el cartero). A la derecha,
su equivalente en una red. Se lee fila por fila, buscando la pareja: cada cosa del correo tiene
un nombre técnico del otro lado.

Fijate en las filas que más van a volver en el resto del curso:

- **La carta equivale al paquete.** El paquete es la unidad de información que viaja. No viaja
  "el archivo entero": viaja partido en paquetes, y alguien los vuelve a armar al final.
- **El sobre equivale al encabezado.** El encabezado es la información pegada al paquete que dice
  de dónde sale y adónde va. Sin encabezado, el paquete es un montón de datos sin destino.
- **La central de distribución equivale al router.** Es el que mira la dirección y decide por qué
  camino seguir. Ningún router conoce el camino completo: cada uno decide el próximo paso.
- **Las rutas equivalen a la infraestructura.** Cables, fibra, torres. Lo que existe físicamente
  y por donde las cosas efectivamente pasan.

La analogía no es perfecta (las cartas no viajan partidas en pedazos, los datos sí), pero captura la idea central: **una red es un sistema para transportar información de un punto a otro, con reglas claras de direccionamiento y entrega.**

Vale la pena decir también en qué se rompe la analogía, porque ayuda a entender: una carta que
se pierde se pierde para siempre, mientras que en una red bien diseñada el paquete perdido se
detecta y se vuelve a pedir. Y una carta tarda días; un paquete tarda milésimas de segundo. La
analogía sirve para el *cómo viaja*, no para la *velocidad*.

### 1.3. ¿Qué se comparte en una red?

El objetivo de una red es compartir **recursos**. Los principales son:

1. **Datos**: archivos, documentos, fotos, bases de datos.
2. **Aplicaciones y programas**: software instalado en un servidor al que acceden muchos usuarios.
3. **Hardware**: impresoras, unidades de almacenamiento, escáneres.
4. **Conexión a internet**: un solo enlace al proveedor, compartido por todos los dispositivos.
5. **Potencia de cálculo**: en redes más avanzadas, el procesamiento se reparte entre varias máquinas.

Este es el punto que más gente pasa por alto: **compartir no es solo compartir archivos**. Una
red sirve para compartir cinco cosas distintas, y cada una tiene su propio conjunto de
problemas. Compartir un archivo es fácil; compartir una impresora exige que todos sepan en qué
dirección está; compartir internet exige que alguien traduzca las direcciones internas hacia
afuera (eso se llama NAT y tiene su propio manual).

Un ejemplo de cada uno, para que quede:

- **Datos**: la carpeta compartida donde el equipo deja los presupuestos del mes.
- **Aplicaciones**: el sistema de facturación que corre en un servidor y todos abren desde su
  navegador, sin instalarlo en cada máquina.
- **Hardware**: la única impresora buena de la oficina, que usan los ocho empleados.
- **Conexión**: el router de tu casa, que reparte una sola conexión contratada entre todos tus
  equipos.
- **Cálculo**: un clúster que divide el trabajo pesado entre varias computadoras, como si fueran
  una sola más grande.

### 1.4. Una red doméstica típica, mirada desde afuera

Este es el ejemplo más común de red que existe: la de una casa. Memoralo, porque lo vamos a usar durante todo el manual.

```
   [Celular]      [Notebook]      [Smart TV]
       |               |               |
       |   (Wi-Fi)     |   (Wi-Fi)     |   (cable Ethernet)
       +---------------+---+-----------+
                           |
                     [Router]  ← el "centro" de la red
                         |
                     [Módem]   ← habla con el proveedor de internet (ISP)
                         |
                   ============= Internet =============
```

**Cómo leer este diagrama.** Se lee de arriba hacia abajo y de afuera hacia adentro, como si
entraras a tu casa. Arriba están los equipos que usás: celular, notebook, Smart TV. Cada uno
baja por una conexión: el celular y la notebook por **Wi-Fi** (ondas de radio, sin cable), la TV
por **cable Ethernet** (el cable de red clásico con conector de plástico transparente). Las tres
conexiones se juntan en un punto, y ese punto baja al **router**. Del router se baja al **módem**,
y del módem se sale a **internet**.

Los símbolos concretos:

- `[ ]` es un equipo. Cada corchete con un nombre adentro es una máquina real.
- `|` y `+` y `---` son cables. Los que forman una llave (`+---+`) indican que varias conexiones
  se unen en un mismo punto.
- `(Wi-Fi)` entre paréntesis aclara el medio: por aire en vez de por cable.
- `←` y el texto entre comillas son anotaciones del dibujo, no parte de la instalación.
- La línea de `=====` representa internet, la red de afuera, dibujada como una "nube".

Lo que tenés que mirar como principiante: **hay un solo camino hacia afuera**. Todos los equipos
de la casa pasan por el router. Eso significa que el router es el punto donde se concentra todo,
y también el punto donde un problema afecta a todos a la vez. Si el router se cuelga, no se cae
"el celular": se cae la casa entera.

Los dispositivos (celular, notebook, TV) se llaman **dispositivos finales** o **hosts**. El **router** es el dispositivo intermedio que los conecta entre sí y con internet. En el punto 12 vamos a estudiar cada pieza en detalle.

> **Dato importante para principiantes:** la red de tu casa y *internet* no son lo mismo. Tu red de casa es la parte que está **dentro** de tus cuatro paredes. Internet es la red gigante que está **afuera**, y tu router es el puente entre ambas.

Esto último confunde mucho al principio, así que vale un ejemplo. Si el router se queda sin
conexión con el proveedor, tu red de casa **sigue funcionando**: la notebook todavía ve la
impresora, el celular todavía ve la TV. Lo que se cortó es el puente hacia afuera. Al revés
también pasa: internet anda perfecto, pero si el cable entre la notebook y el router está
flojo, esa notebook se queda sin nada aunque el resto de la casa navegue sin problemas. Separar
"mi red" de "la red de afuera" es el primer reflejo de diagnóstico que conviene incorporar.

### 1.5. Internet: la red de redes

Cuando hablamos de internet no hablamos de una sola red, sino de **millones de redes interconectadas entre sí** — redes de hogares, empresas, universidades, gobiernos y proveedores — que acordaron hablar el mismo idioma.

Ese "idioma común" son los **protocolos**: reglas escritas que definen cómo se formatean, se envían, se reciben y se confirman los datos. El más famoso es el conjunto **TCP/IP**, que vamos a estudiar a fondo a lo largo de este curso.

> **Idea central de este manual:** una red existe para compartir. Toda la tecnología que vas a ver de acá en adelante (cables, routers, direcciones IP, switches) existe para cumplir ese único propósito de la manera más rápida, confiable y segura posible.

La palabra **TCP/IP** merece una aclaración, porque en realidad son dos protocolos juntos: **IP**
(Internet Protocol) se encarga del direccionamiento, de que cada paquete sepa adónde ir;
**TCP** (Transmission Control Protocol) se encarga de que todo llegue completo y en orden. Uno
pone las direcciones en el sobre; el otro lleva la cuenta de qué llegó y qué falta. En el
manual de modelos de red vas a ver cómo se reparten el trabajo capa por capa.

### 1.6. Las palabras que se repiten todo el tiempo

Como este es el primer manual de la biblioteca, conviene dejar juntas las palabras que vas a
escuchar en todos los demás. No hace falta memorizarlas ahora: están acá para que vuelvas
cuando una te aparezca en el medio de una explicación. Cada una tiene su capítulo donde se
estudia en serio.

| Palabra | Qué es, en una línea | Dónde se estudia |
|---------|----------------------|------------------|
| **Host** | Un dispositivo final: el que origina o recibe los datos (tu PC, tu celular, un servidor) | Capítulo 2 y 12 |
| **Nodo** | Cualquier aparato conectado a la red, sea final o intermedio | Capítulo 2 |
| **Paquete** | El "sobre" pequeño en el que viaja la información, con su dirección | Capítulo 2 |
| **Dirección** | El identificador de un dispositivo: puede ser físico (MAC) o lógico (IP) | Capítulos 2 y 12 |
| **Ancho de banda** | Cuánta información entra por segundo en un enlace | Capítulo 2 |
| **Latencia** | Cuánto tarda un dato en llegar de un punto a otro | Capítulo 2 |
| **LAN** | Red de área local: la de tu casa o tu oficina | Capítulo 6 |
| **WAN** | Red de área extendida: la que une ciudades o países | Capítulo 6 |
| **Protocolo** | El conjunto de reglas que hace que dos equipos se entiendan | Capítulo 2 |
| **Topología** | La forma del dibujo de la red: cómo se conectan los nodos | Capítulo 9 |

**Cómo leer esta tabla.** Es un índice de vocabulario, no una lección: la columna del medio da
la definición mínima para que puedas seguir leyendo, y la de la derecha te dice dónde se explica
de verdad. Si leés esta tabla hoy y no te queda nada, está bien: es un mapa, no el viaje.

Un detalle que vale la pena notar ya: **"dirección" no es una sola cosa**. En redes hay al menos
dos tipos de dirección, y las dos conviven en el mismo cable. La **dirección MAC** es física,
viene grabada de fábrica en cada tarjeta de red y no cambia. La **dirección IP** es lógica, se
configura y puede cambiar si te mudás de red. Es como una persona: el DNI es su MAC, la dirección
de su casa es su IP. Cuando lleguemos al capítulo 12 vas a ver qué equipo usa cada una.

### Resumen

- Una red son **dos o más dispositivos conectados** para compartir datos y recursos; con dos
  máquinas alcanza, no hace falta que sea grande.
- La analogía que ordena todo es el **correo**: la carta es el paquete, el sobre es el
  encabezado, la central de distribución es el router.
- Lo que se comparte son cinco cosas concretas: datos, aplicaciones, hardware, conexión a
  internet y capacidad de cálculo.
- En una red doméstica todo pasa por el router, y **tu red de casa no es internet**: el router es
  el puente entre las dos.
- Internet es una red de redes que se entiende porque todas hablan los mismos protocolos, y
  TCP/IP es el par de protocolos que lo hace posible.

---

## 2. Los tres ingredientes de toda red

Toda red, por más compleja que sea, se puede reducir a **tres ingredientes**:

Pensalo como una receta de cocina con tres cosas que nunca faltan. Podés cambiar las cantidades,
la calidad y la presentación, pero si falta uno de los tres, no hay plato. En redes pasa igual:
si tenés equipos pero no hay medio por donde hablar, no hay red; si tenés medio y equipos pero
no hay reglas comunes, tampoco. Los tres juntos, siempre.

### 2.1. Los nodos (los participantes)

Un **nodo** es cualquier dispositivo capaz de enviar o recibir datos en la red. Hay dos grandes grupos:

- **Dispositivos finales** (también llamados *hosts*): son los que las personas usan. Computadoras, celulares, impresoras, servidores, Smart TVs, tablets.
- **Dispositivos intermedios**: son los que hacen que los datos lleguen de un lado a otro. Routers, switches, puntos de acceso inalámbrico, módems.

> **Analogía:** en el sistema postal, los dispositivos finales son las personas que escriben cartas; los intermedios son las sucursales de correo por donde las cartas pasan.

La diferencia entre los dos grupos es de **intención**, y es la que más cuesta al principio. Un
host **origina o termina** la información: alguien escribió ese mensaje y alguien lo va a leer.
Un dispositivo intermedio **no opina sobre el contenido**: lo recibe y lo pasa, como el empleado
de correo que no abre tu sobre. Si un equipo es el principio o el final del viaje, es un host;
si solo está en el medio empujando cosas, es intermedio.

Ojo con un caso que confunde: **una impresora es un host**, aunque parezca un periférico tonto.
¿Por qué? Porque es el destino final de los datos: la computadora le manda un documento y ella
lo imprime. No reenvía nada hacia otro lado. Lo mismo vale para una cámara IP o un televisor.

### 2.2. Los enlaces (los caminos)

Un **enlace** es el medio físico o inalámbrico por el que viajan los datos. Los más comunes:

| Enlace | ¿Cómo viajan los datos? | Uso típico |
|--------|-------------------------|------------|
| **Cable de par trenzado** (UTP) | Pulsos eléctricos | Redes de oficina y hogar (el cable Ethernet clásico) |
| **Fibra óptica** | Pulsos de luz | Conexiones de alta velocidad y largas distancias (la columna vertebral de internet) |
| **Wi-Fi** | Ondas de radio | Dispositivos móviles en casas y oficinas |
| **Bluetooth** | Ondas de radio de corto alcance | Auriculares, relojes, parlantes, teclados |
| **Red celular (4G/5G)** | Ondas de radio | Celulares y equipos móviles |
| **Coaxial** | Pulsos eléctricos | Cable TV e internet por cable |

**Cómo leer esta tabla.** Tiene tres columnas. La primera es el **nombre del enlace**, tal como
lo vas a ver en una factura, una caja o un manual. La segunda es **de qué está hecha la señal**
que viaja por ahí: electricidad, luz u ondas de radio. La tercera es **para qué se usa en la
práctica**, que es el dato que te sirve para elegir.

El detalle que tenés que llevarte: en la columna del medio solo hay tres cosas. Los cables de
cobre (UTP y coaxial) mueven **electricidad**. La fibra mueve **luz**. Todo lo inalámbrico mueve
**ondas de radio**. No hay más: cualquier enlace que te nombren en tu vida va a ser una de esas
tres familias.

Y una lectura que sirve para decidir: **la fibra es la mejor en todo menos en precio y en
dificultad de instalación**. No le afectan las interferencias eléctricas, llega a kilómetros y
tiene muchísimo más ancho de banda. El cobre es barato y fácil de terminar con un conector; el
Wi-Fi es cómodo pero comparte un medio con los vecinos y con el microondas.

> **Analogía:** si la red es el sistema postal, los enlaces son las rutas que usan los carteros: algunas son calles del barrio (Bluetooth), otras son rutas nacionales (fibra óptica) y otras son autopistas internacionales (la red de fibra submarina que conecta continentes).

### 2.3. Los protocolos (el idioma común)

Un **protocolo** es un conjunto de reglas que define **cómo** se comunican los dispositivos. Sin protocolos, dos dispositivos de distintos fabricantes no podrían entenderse, como dos personas que hablan idiomas distintos.

La palabra viene del mundo de la diplomacia: un protocolo es el acuerdo de cómo se saluda, en
qué orden se habla y cómo se cierra una conversación. En redes es idéntico. El protocolo no
dice *qué* contenido mandás —eso lo decidís vos— sino **cómo** lo mandás: en qué orden, con qué
formato, qué se hace si algo se pierde, quién habla primero y cuándo termina.

Algunos protocolos que ya usás sin saberlo:

| Protocolo | ¿Qué hace? | ¿Cuándo lo usás? |
|-----------|------------|------------------|
| **IP** | Direcciona los paquetes (el "sobre" con direcciones) | Siempre que navegás |
| **TCP** | Garantiza que los datos lleguen completos y en orden | Descargar un archivo, ver una web |
| **UDP** | Envía datos rápido sin garantizar la entrega | Llamadas de voz, video en vivo |
| **HTTP/HTTPS** | Transporta las páginas web | Cuando abrís un sitio |
| **DNS** | Traduce nombres (google.com) a direcciones (142.250.….) | Cada vez que escribís una dirección web |

**Cómo leer esta tabla.** La primera columna es la **sigla** que vas a ver en todos lados. La
segunda dice **qué problema resuelve** ese protocolo en una frase. La tercera dice **cuándo lo
estás usando vos**, aunque no lo sepas, que es lo que hace que la sigla deje de ser abstracta.

Las siglas, una por una, porque en los próximos manuales aparecen sin aviso:

- **IP** — *Internet Protocol*. Es el que pone las direcciones en cada paquete. Sin IP, un paquete
  es un sobre en blanco.
- **TCP** — *Transmission Control Protocol*. Es el que se asegura de que todo llegue y en el orden
  correcto, y pide de nuevo lo que faltó. Es más lento por eso mismo.
- **UDP** — *User Datagram Protocol*. Manda y se olvida: no confirma nada, no reenvía nada. Es
  rapidísimo, y por eso se usa en vivo, donde llegar tarde es peor que no llegar.
- **HTTP/HTTPS** — *HyperText Transfer Protocol* (con S de *Secure*). Es el idioma de la web: el
  pedido y la respuesta de las páginas. La S significa que va cifrado.
- **DNS** — *Domain Name System*. Es el que traduce el nombre lindo (`google.com`) al número que
  las máquinas entienden. Sin DNS tendrías que memorizar números.

No hace falta memorizarlos ahora. Lo importante acá es la idea: **una red es nodos + enlaces + protocolos.**

> **Pregunta para pensar (no hace falta responderla en voz alta):** ¿Qué pasa si dos dispositivos hablan el mismo protocolo pero están conectados con un cable dañado? Exacto: los datos viajan pero no "salen" del cable. Ningún protocolo arregla un enlace roto. Siempre se necesita el trio completo.

### 2.4. El paquete: la unidad con la que viaja todo

Ya apareció tres veces la palabra **paquete**, así que vale la pena definirla en serio, porque es
la pieza más importante de todo el curso.

**El problema que resuelve.** Imaginate que querés mandar un video de 2 GB por un cable. Si lo
mandás entero y algo falla en el minuto cuarenta, perdiste todo y hay que empezar de nuevo. Y
mientras tanto, ese cable queda ocupado: nadie más puede usarlo. Los paquetes resuelven las dos
cosas: el archivo se parte en pedazos chicos que viajan por separado y se vuelven a armar al
final, así un error solo obliga a repetir un pedazo y varios equipos pueden usar el mismo cable
turnándose.

**La analogía.** Es la carta del correo. Vos no mandás la enciclopedia completa en un camión: la
partís en fascículos numerados, cada uno con su sobre y su dirección, y el que los recibe los
ordena por número. Si se pierde el fascículo 7, pedís el 7 y listo.

**La definición precisa.** Un **paquete** es un bloque pequeño de datos con dos partes:

- El **encabezado** (*header*): las direcciones de origen y destino, el número de orden, y datos
  de control. Es el sobre.
- La **carga útil** (*payload*): los datos de verdad, el pedazo de archivo. Es la carta adentro.

Los paquetes de una misma transferencia pueden llegar por caminos distintos y en desorden; quien
los recibe los reordena usando el número de orden del encabezado. Eso, que suena a caos, es una
de las grandes ventajas del diseño: si un camino se satura, cada paquete puede tomar otro.

> **Dato para no confundirse:** según el nivel del que se hable, la unidad de datos cambia de
> nombre. En la jerga de capa 2 (la del switch) se llama **trama**, en capa 3 (la del router) se
> llama **paquete**, y en capa 4 se llama **segmento**. En este manual vamos a decir "paquete"
> casi siempre, salvo cuando el detalle importe.

### 2.5. Ancho de banda y latencia: las dos medidas que importan

Cuando alguien dice "mi red anda lenta", está mezclando dos cosas distintas. Separarlas es la
mitad del diagnóstico.

**Ancho de banda** es **cuánta información entra por segundo** en un enlace. Se mide en bits por
segundo (bps), y en la práctica en Mbps (megabits por segundo) o Gbps (gigabits por segundo).
Pensalo como el ancho de una autopista: cuántos carriles hay. Más carriles, más autos a la vez.

**Latencia** es **cuánto tarda un dato en llegar de un punto a otro**, medida en milisegundos
(ms, la milésima parte de un segundo). Es el tiempo de viaje de un auto, no la cantidad de
autos. Un enlace puede tener muchísimo ancho de banda y aun así tardar en responder.

| Concepto | Qué mide | Unidad | Analogía | Se nota cuando… |
|----------|----------|--------|----------|-----------------|
| **Ancho de banda** | Cuánto entra por segundo | bps, Mbps, Gbps | Cuántos carriles tiene la ruta | Descargás un archivo grande |
| **Latencia** | Cuánto tarda en llegar | ms | Cuánto tarda el viaje | Jugás online o hacés una videollamada |
| **Jitter** | Cuánto varía esa demora | ms | Que el viaje tarde distinto cada día | Se corta el audio en la llamada |
| **Pérdida de paquetes** | Cuántos no llegan | % | Cartas que se pierden | La llamada se entrecorta y hay que repetir |

**Cómo leer esta tabla.** La columna **"Qué mide"** dice cuál es la pregunta que responde cada fila; **"Unidad"** dice con qué se mide, que es lo que vas a ver en las pruebas y en los reportes; **"Analogía"** la traduce a la autopista; y **"Se nota cuando…"** te dice en qué situación de tu vida te choca ese número.

La lectura importante es la primera y la segunda fila: **son dos cosas distintas y no se compensan
una con la otra**. Un camión con veinte carriles y un viaje de seis horas te sirve para mover una
mudanza entera, pero no para una videollamada. Y una conexión de un solo carril que llega en dos
minutos te sirve para jugar, pero va a sufrir para bajar una película.

Un ejemplo para fijarlo. Copiar un archivo de 10 GB de una máquina a otra dentro de la misma
oficina es un problema de **ancho de banda**: querés que entre mucho por segundo. Que la respuesta
del servidor de un juego llegue en pocos milisegundos es un problema de **latencia**. Cuando alguien
te dice "contraté mil megas y el juego sigue andando mal", lo más probable es que el problema no
sea el ancho de banda sino la latencia o el Wi-Fi.

> **Ojo con las unidades, porque acá hay una trampa para principiantes:** el ancho de banda se mide
> en **bits** por segundo, no en bytes. Un byte son 8 bits. Los "300 megas" que te vende un
> proveedor son megabits, así que hay que dividir por 8 para saber cuántos megabytes por segundo
> ves en tu gestor de descargas. En el capítulo 12 volvemos sobre esto con el ejemplo completo.

### Resumen

- Toda red son **tres ingredientes**: nodos (los participantes), enlaces (los caminos) y
  protocolos (el idioma). Si falta uno, no hay red.
- Un **nodo** puede ser final (host: el que origina o recibe) o intermedio (el que solo pasa los
  datos). Una impresora es un host, aunque no lo parezca.
- Los enlaces son solo tres familias: **cobre** (electricidad), **fibra** (luz) y **aire** (ondas
  de radio). Todo lo demás es una variante de esas tres.
- La información viaja en **paquetes**: bloques chicos con encabezado (direcciones) y carga útil
  (los datos), que se rearman al llegar.
- **Ancho de banda y latencia son medidas distintas**: una es cuánto entra por segundo, la otra
  cuánto tarda en llegar. Confundirlas es el error que más diagnósticos arruina.

---

## 3. ¿Qué le ofrece una red? Ventajas y costos

La mayoría de los manuales lista las ventajas de las redes y se queda ahí. Eso está bien, pero incompleto: una red también trae responsabilidades. Mirá las dos caras de la moneda.

Pensalo como tener auto. Te lleva a todos lados, te ahorra tiempo, te da independencia. Y también
pide nafta, seguro, patente, service y un lugar donde estacionar. Nadie diría que un auto es una
mala idea por eso; lo que haría es **contar las dos columnas** antes de comprarlo. Con las redes
pasa exactamente lo mismo, y este capítulo es la tabla de las dos columnas.

### 3.1. Las ventajas

| Ventaja | ¿Qué significa en la práctica? | Ejemplo real |
|---------|--------------------------------|--------------|
| **Acceso compartido a los datos** | Todos los que tienen permiso trabajan con la misma información, actualizada en el momento | Un equipo de 10 personas edita el mismo documento sin mandarse copias por correo |
| **Uso compartido de hardware** | No hace falta comprar una impresora por persona; una sola alcanza para todos | Una impresora de red usada por toda una oficina |
| **Comunicación** | Mensajería, correo, videollamadas entre miembros de la red | Un empleado llama a otro a través de la red de la empresa |
| **Gestión centralizada** | Los programas, los datos y las configuraciones se controlan desde un solo lugar | El administrador actualiza un antivirus una vez y se actualiza en todas las máquinas |
| **Permisos claros** | Cada usuario recibe exactamente los accesos que necesita, ni más ni menos | El área de finanzas no ve los archivos de recursos humanos |
| **Seguridad de datos centralizada** | Los respaldos (backups) y las políticas de protección se aplican de forma uniforme | Todos los archivos importantes se respaldan automáticamente cada noche |
| **Escalabilidad** | Agregar usuarios o dispositivos nuevos es simple y ordenado | Incorporar un empleado nuevo: se conecta y ya está en la red |
| **Acceso a internet compartido** | Un único enlace al proveedor sirve a todos los dispositivos | El router de tu casa comparte la conexión con todos tus equipos |

**Cómo leer esta tabla.** Tres columnas, de lo abstracto a lo concreto: la **ventaja** (el nombre
que le pondría un manual), **qué significa en la práctica** (la traducción a palabras normales) y
el **ejemplo real** (una situación que podés ver hoy mismo). Si leés solo la primera columna, te
quedás con una lista de virtudes; leyendo la tercera, entendés de qué se está hablando.

Fijate en un patrón: casi todas las ventajas son variantes de una sola idea, **dejar de duplicar**.
Sin red, cada persona tiene su copia del archivo, su impresora, su actualización, su backup. Con
red, hay una sola copia y un solo mantenimiento. Todo lo demás —ahorrar plata, evitar versiones
distintas, enterarte antes de un problema— cuelga de esa idea central.

### 3.2. Lo que hay que pagar por ellas (los costos)

Sería una mala enseñanza decir que las redes solo traen beneficios. Una red mal planificada puede generar más problemas de los que resuelve:

| Costo o riesgo | ¿Por qué existe? |
|----------------|------------------|
| **Costo económico** | Cables, switches, routers, licencias, mantenimiento. La red no es gratis. |
| **Seguridad** | Una red conecta dispositivos... y también los expone. Un atacante que entra a la red puede llegar a todo lo que está conectado. |
| **Dependencia** | Si la red se cae, todo lo que depende de ella se detiene (impresión, correo, archivos, internet). |
| **Complejidad** | Más dispositivos = más cosas que configurar, monitorear y actualizar. |
| **Formación** | Alguien tiene que saber administrarla, o hay que pagar a un especialista. |

**Cómo leer esta tabla.** Tiene solo dos columnas, y la segunda es la que importa: **por qué
existe** cada costo. No es una lista de quejas, es una explicación. Cada fila dice "esto te va a
costar, y este es el motivo técnico por el que no se puede evitar".

La fila que más subestima la gente es **Seguridad**, y la razón es contraintuitiva: la misma
conexión que te deja compartir archivos con tu socio es la que le permite a un desconocido
llegar a tu servidor si está mal configurada. La red no elige quién entra; eso lo hace la
configuración. Por eso las ventajas de la sección anterior y estos riesgos son **las dos caras
del mismo cable**.

La fila de **Dependencia** también merece un segundo de atención: cuando centralizás, ganás orden
y perdés autonomía. Si el servidor de archivos se cae, ese día nadie trabaja. Eso no es un defecto
de las redes: es el precio de haber elegido centralizar, y se paga con redundancia (equipos de
repuesto, enlaces alternativos) que también cuesta plata.

> **Conclusión honesta:** una red se justifica cuando los beneficios (compartir, centralizar, comunicar) superan los costos. En una casa con dos personas y un celular, la "red" es casi automática. En una empresa de 50 personas, la red es una decisión seria de planificación — para eso sirven las preguntas del próximo punto.

### 3.3. Cómo hacer la cuenta en un caso chico

Un ejemplo para que la cuenta deje de ser abstracta. Tres personas en una oficina chica: hoy se
pasan los archivos por pendrive y tienen dos impresoras baratas, una en cada escritorio.

- **Lo que ganan con red**: una sola impresora buena en vez de dos malas; los archivos en un solo
  lugar; nadie se manda más pendrives; los backups se hacen solos una vez por noche.
- **Lo que les cuesta**: un switch, el cableado, un router, y alguien que sepa configurar los
  permisos y revisar que el backup haya corrido.
- **La decisión sensata**: con tres personas, sí conviene. Con una sola persona y una impresora,
  probablemente no: el costo de administrar supera lo que ahorrás.

La regla que sale de esto no es "las redes son buenas", sino algo más útil: **una red se justifica
cuando el trabajo compartido es más grande que el trabajo de mantenerla**. Si tenés que administrar
más de lo que compartís, la red se convirtió en un gasto.

### Resumen

- Una red te da ocho ventajas concretas, y casi todas nacen de la misma idea: **dejar de duplicar**
  datos, equipos y mantenimiento.
- Todo eso tiene precio: **costo, exposición, dependencia, complejidad y necesidad de alguien que
  la administre**.
- Ventajas y riesgos son las dos caras del mismo cable: lo que te deja compartir es lo que te
  expone si está mal configurado.
- Centralizar gana orden y pierde autonomía; la redundancia es lo que se paga para recuperar
  parte de esa autonomía.
- La cuenta se hace caso por caso: **la red se justifica cuando lo compartido vale más que el
  trabajo de mantenerla**.

---

## 4. Las preguntas clave antes de crear una red

Antes de comprar un solo cable, conviene responder estas siete preguntas. Cada una tiene un porqué técnico detrás.

Este es el capítulo más "de oficina" del manual, y por eso es el que más plata ahorra. Casi todas
las redes malas que vas a ver en tu vida no fallaron por una tecnología exótica: fallaron porque
nadie se sentó veinte minutos a responder estas preguntas antes de comprar. Comprar primero y
pensar después es la forma más cara de armar una red.

### 4.1. ¿Qué requisitos tengo para la red?

**Qué quiero lograr**: ¿compartir internet nomás? ¿archivos? ¿impresoras? ¿videollamadas? ¿juegos en red? ¿servidores?

- Si solo querés navegar, cualquier red básica alcanza.
- Si vas a mover archivos grandes o hacer videollamadas constantes, necesitás más ancho de banda y mejor equipamiento.
- Si vas a tener servidores, la red necesita más planificación (direccionamiento fijo, seguridad, respaldos).

La trampa clásica de esta pregunta es responder con **tecnología** en vez de con **necesidad**.
"Quiero Wi-Fi 7" no es un requisito: es una solución. El requisito es "que dos personas puedan
hacer videollamada al mismo tiempo sin que se corte". La diferencia importa porque el requisito
se puede verificar y la solución no: podés tener el equipo más caro del mercado y seguir
cortándote si el problema era el ancho de banda contratado.

### 4.2. ¿Lo necesito localmente o con mayor alcance?

Aquí aparece el concepto de **escala** que estudiamos en el punto 6:

- ¿Todo queda en un mismo edificio? → **LAN** (red de área local).
- ¿Hay varios edificios en un mismo campus? → **CAN**.
- ¿Hay sucursales en distintas ciudades? → **WAN**.

> **Regla práctica:** la escala define el equipamiento. Una LAN se arma con switches y un router. Una WAN requiere contratar enlaces a un proveedor (ISP) y enrutamiento entre sedes.

La palabra que ordena esta pregunta es **quién es dueño del cable**. Si el cable es tuyo, estás en
una LAN y lo manejás vos. Si el cable es del proveedor y lo alquilás, estás en una WAN. No es una
cuestión de tamaño del edificio sino de propiedad de la infraestructura, y eso define quién
puede arreglar qué cuando algo se rompe.

### 4.3. ¿A cuántos participantes me dirijo y cuánto tráfico generan?

Esta pregunta define el **tamaño del equipamiento**:

- 5 dispositivos → un router hogareño alcanza.
- 100 dispositivos → necesitás switches de más puertos, posiblemente varios, y un router más robusto.
- 1000 dispositivos → ya hablamos de redes segmentadas, VLANs y planificación profesional.

**Un número clave:** cada dispositivo conectado "compite" por el ancho de banda disponible. No es lo mismo 10 dispositivos mirando texto que 10 dispositivos en streaming de video.

Sobre eso último: **la cantidad de dispositivos no es lo mismo que la cantidad de tráfico**. Diez
celulares leyendo mensajes casi no mueven datos; dos televisores en 4K saturan cualquier conexión
doméstica. Cuando planifiques, preguntá dos cosas separadas: cuántos equipos hay y qué hace cada
uno. La segunda respuesta manda.

### 4.4. ¿La red debe ser privada, pública o ambas?

- La gran mayoría de las redes internas son **privadas**: solo accesibles desde adentro.
- A veces hay partes que deben ser **públicas** (por ejemplo, un servidor web que atiende a clientes externos).
- La solución típica es una red privada + un punto controlado de salida a lo público (el router con su configuración de seguridad).

La idea de fondo es que **lo público no se evita, se controla**. No podés tener un servidor web sin
que alguien de afuera llegue; lo que sí podés es decidir que ese sea el único punto de entrada y
vigilarlo. El resto de la red queda atrás, sin exposición directa.

### 4.5. ¿Qué tan alta debe ser la seguridad?

La respuesta depende de qué hay en la red:

| Qué hay en la red | Nivel de seguridad necesario |
|-------------------|------------------------------|
| Solo equipos personales de una casa | Básico (contraseña de Wi-Fi, firewall del router) |
| Datos de una Pyme | Medio (firewall, permisos por usuario, backups) |
| Datos sensibles o regulados (salud, finanzas, clientes) | Alto (segmentación, cifrado, auditoría, políticas formales) |

**Cómo leer esta tabla.** Dos columnas: a la izquierda, **qué estás protegiendo**; a la derecha, el
**nivel que corresponde**. No es una escala de "mejor a peor" ni una lista de caprichos: cada
nivel de la derecha suma trabajo concreto (contraseñas, permisos, auditoría) y por eso solo se
justifica si lo de la izquierda vale ese trabajo.

Lo que tenés que mirar es la última fila, porque es la única que trae obligaciones legales y no
solo técnicas. Si manejás datos de salud, de menores o de tarjetas, hay normas que te obligan a
cifrar y a auditar. Ahí no estás eligiendo un nivel: estás cumpliendo.

### 4.6. ¿Qué hardware necesito?

La respuesta sale de las preguntas anteriores. En términos generales:

- **Red hogareña**: router + puntos de acceso (o router con Wi-Fi integrado) + módem del proveedor.
- **Oficina chica**: switch + router + access point + cableado.
- **Empresa**: switches, routers, firewalls, cableado estructurado, servidores, y un rack donde ordenarlo todo.

Fijate que la lista crece en orden: primero aparece el **switch** (para conectar muchos equipos
entre sí), después el **access point** (para los que no tienen cable), después el **firewall**
(para controlar qué pasa) y al final el **rack** (para que todo eso no sea un nido de cables).
Ese orden es también el orden en que conviene comprar: no tiene sentido un firewall caro si el
cableado es un desastre.

### 4.7. ¿Puedo configurarla yo mismo o necesito un experto?

Siendo honestos: una red hogareña la configura cualquiera siguiendo un manual (de eso se trata este curso). Una red empresarial — con VLANs, seguridad, redundancia y WAN — requiere formación específica. No es una cuestión de capacidad sino de **profesionalismo**: así como no pedís a un plomero que diseñe un edificio, una red corporativa se diseña con criterio de ingeniería.

Un criterio práctico para decidirlo: **si la red se cae y nadie sabe dónde empezar a mirar, la
red era más grande que quien la administra**. Eso no se mide en cantidad de equipos sino en
documentación: si tenés el mapa y sabés qué probar, podés con bastante más de lo que creés.

### 4.8. Ejemplo resuelto: la red de una familia

Pongamos las preguntas en acción con un caso concreto:

> Una familia de cuatro quiere internet en casa: dos adultos trabajan remoto con videollamadas, dos adolescentes juegan online y ven streaming. Presupuesto acotado.

| Pregunta | Respuesta de la familia | Consecuencia técnica |
|----------|-------------------------|----------------------|
| ¿Requisitos? | Videollamadas, streaming, juegos | Necesitan buen ancho de banda y Wi-Fi estable |
| ¿Alcance? | Un solo departamento | LAN doméstica |
| ¿Cuántos dispositivos? | ~10 (2 notebooks, 2 celulares, 2 consolas, TV, tablet, impresora, smart-home) | Un router hogareño moderno alcanza |
| ¿Privada o pública? | Privada | Router con NAT y firewall |
| ¿Seguridad? | Media | Contraseña Wi-Fi fuerte, actualizar firmware |
| ¿Hardware? | Router + módem del ISP | Módem del proveedor + router propio con Wi-Fi |
| ¿Configuración? | Propia | Seguir el manual del fabricante |

**Cómo leer esta tabla.** Es la misma lista de siete preguntas del capítulo, respondida con un caso
real. Cada fila tiene tres columnas: la **pregunta**, la **respuesta de esta familia en particular**
y la **consecuencia técnica** de esa respuesta, que es la única columna que te llevás para otro
caso.

Leela de arriba hacia abajo pensando en cómo cambia el resultado si cambiás una respuesta. Si en
la fila de alcance dijeras "casa y oficina a 40 cuadras", la fila de hardware ya no sería "un
router del ISP": necesitarías un enlace entre los dos lugares, y eso es una WAN contratada. Ahí
está el valor del método: **cada respuesta arrastra la siguiente**.

Este caso lo vas a poder resolver vos mismo al final del curso.

### Resumen

- Antes de comprar nada, contestá **siete preguntas**: requisitos, alcance, cuántos equipos y
  cuánto tráfico, privacidad, seguridad, hardware y quién la configura.
- Los **requisitos se escriben como necesidades** ("videollamada estable"), no como marcas ni
  tecnologías ("Wi-Fi 7").
- La **escala** decide el equipamiento, y lo que manda es quién es dueño del cable: si el cable es
  tuyo es LAN, si lo alquilás es WAN.
- Cuántos equipos hay y cuánto tráfico mueven son **dos preguntas distintas**; la segunda manda.
- Cada respuesta arrastra la siguiente: si cambiás el alcance, cambia el hardware. Planificar es
  hacer esa cadena completa antes de gastar.

---

## 5. Administración de red: la red no se cuida sola

Una vez que la red está armada, **empieza el trabajo de verdad**: la administración. Es el equivalente a dar mantenimiento al edificio del sistema postal: si nadie lo hace, todo se deteriora.

Este capítulo es corto y es el que más se saltea la gente, lo cual explica por qué la mayoría de
las redes chicas andan mal. Armar la red es una tarde; mantenerla es una rutina. La diferencia
entre una red que funciona cinco años y una que se cae cada dos meses no suele ser el presupuesto:
es la rutina.

### 5.1. Las cuatro tareas básicas

| Tarea | ¿Qué es? | ¿Qué pasa si no se hace? |
|-------|----------|--------------------------|
| **Monitoreo** | Vigilar el estado de la red: qué dispositivos están conectados, cuánto tráfico circula, dónde hay errores | Los problemas se descubren cuando ya tumbaron la red |
| **Actualizaciones** | Aplicar parches de seguridad y mejoras de firmware de routers, switches, impresoras, etc. | Vulnerabilidades conocidas quedan abiertas a ataques |
| **Gestión de usuarios y permisos** | Crear/eliminar cuentas, dar accesos correctos, quitar accesos de quien se fue | Ex empleados con acceso, permisos excesivos |
| **Mantenimiento preventivo** | Revisar cableado, limpiar equipos, verificar respaldos, probar la redundancia | Fallas por desgaste, polvo, conexiones flojas, fuentes viejas |

**Cómo leer esta tabla.** Tres columnas que se leen juntas: la **tarea**, **qué es** en concreto, y
**qué pasa si no se hace**, que es la columna que convence a un jefe de dar presupuesto. Las tres
juntas convierten una idea vaga ("hay que administrar la red") en una lista de cosas para hacer un
martes a la mañana.

Dos palabras de la segunda columna que quizás no conozcas:

- **Firmware**: el programa interno de un equipo, como el del router. No es una aplicación que
  instalás vos; viene con el aparato y se actualiza desde el panel del fabricante.
- **Redundancia**: tener un segundo camino o un segundo equipo listo para cuando falle el primero.
  Probar la redundancia es parte del mantenimiento, porque una copia de respaldo que nunca se
  probó no es una copia de respaldo: es una esperanza.

Y la fila que casi nadie hace: **probar la redundancia**. Se puede tener un enlace alternativo
perfectamente configurado durante años y descubrir, el día que se corta el principal, que el
alternativo nunca funcionó.

> **Dato real:** la mayoría de las caídas de red en PYMES no son por ataques sofisticados, sino por mantenimiento básico descuidado: switches viejos sin actualizar, cables sueltos, routers sobrecalentados, o configuraciones de hace años que nadie revisó.

### 5.2. ¿Quién administra la red?

| Tipo de red | ¿Quién la administra? |
|-------------|------------------------|
| Casa | Vos (con un mínimo de criterio: actualizar el router, cambiar contraseñas) |
| Pyme chica | Un empleado con conocimientos técnicos, o un servicio técnico externo |
| Empresa grande | Un equipo de administradores de red (o un proveedor administrado, "MSP") |
| La red del proveedor | El ISP (vos no administrás la infraestructura de internet) |

**Cómo leer esta tabla.** Dos columnas: **el tamaño de la red** y **quién responde cuando algo
falla**. Lo importante es la última fila, porque ahí está el límite de tu responsabilidad: la
infraestructura del proveedor no la administrás vos, y por eso cuando el problema está de su lado
lo único que te queda es documentar la falla y reclamar.

La sigla de la tercera fila es **MSP** (*Managed Service Provider*, proveedor de servicios
gestionados): una empresa a la que le pagás una cuota mensual para que se ocupe de tu red
completa. Es la opción típica de una empresa mediana que no quiere tener un especialista propio.

### 5.3. Herramientas de administración

Existen herramientas que simplifican todo esto: paneles de monitoreo (que muestran el estado de todos los dispositivos en un tablero), sistemas de gestión de configuración, alertas automáticas cuando un equipo cae. Estas herramientas se practican a fondo en los ejercicios de este curso.

Un consejo de orden, porque las herramientas no reemplazan el criterio: **primero el mapa, después
la herramienta**. Si no sabés qué equipos tenés ni cómo están conectados, un panel de monitoreo
solo te va a mostrar una lista de cosas que no reconocés. El capítulo 11 trata justamente de eso.

### Resumen

- Armar la red es una tarde; **mantenerla es una rutina de cuatro tareas**: monitorear, actualizar,
  gestionar permisos y hacer mantenimiento preventivo.
- Lo que no se monitorea se descubre tarde, cuando ya afectó a todos.
- El **firmware** viejo y el cable flojo causan más caídas que los ataques sofisticados.
- **Probar la redundancia es parte del mantenimiento**: un respaldo sin probar no es un respaldo.
- Cada red tiene un dueño distinto; saber dónde termina tu responsabilidad y empieza la del
  proveedor te ahorra horas de reclamo inútil.

---

## 6. Tipos de redes según su alcance

Las redes se clasifican según **qué tan lejos llegan**. Es una escala continua: desde el Bluetooth de tus auriculares hasta la red mundial que es internet.

El criterio del alcance es el más útil de todos para empezar, porque se ve a ojo: no necesitás
saber nada de configuración para distinguir la red de tus auriculares de la red de una
multinacional. Y una vez que tenés el nombre de la categoría, ya sabés qué equipamiento esperar.

### 6.1. La escala completa

```
  PAN          LAN/WLAN         CAN             MAN               WAN            GAN
  (metros)     (edificio)      (campus)         (ciudad)         (países)       (mundo)
  [vos]        [tu casa/oficina] [universidad]  [Wi-Fi urbano]   [sucursales]   [internet]
   < 10 m       < 300 m         < pocos km       decenas de km    cientos-km     global
```

**Cómo leer este diagrama.** Son seis columnas y hay que leerlas **verticalmente**, de arriba hacia
abajo, porque cada columna repite el mismo dato con distinto nivel de detalle:

- La primera línea es la **sigla** de la categoría (PAN, LAN, WAN…).
- La segunda, entre paréntesis, es **la unidad de medida** que la define.
- La tercera, entre corchetes, es **un ejemplo típico** de esa categoría.
- La cuarta es el **alcance aproximado** en distancia.

Se lee de izquierda a derecha como una escalera: cada columna es más grande que la anterior. Diez
metros, trescientos metros, unos kilómetros, decenas de kilómetros, cientos de kilómetros, el
planeta.

Lo que tenés que mirar es que **las fronteras son difusas**. Donde dice "< 300 m" no hay una pared
mágica a los 301 metros: son órdenes de magnitud para pensar, no límites de la física. Un campus
universitario chico puede ser una LAN grande; una LAN grande puede tocar los límites de una CAN.

### 6.2. PAN — Personal Area Network (red de área personal)

**Alcance:** unos pocos metros (≤ 10 m aproximadamente).

Conecta dispositivos **alrededor de una persona**. Es la red más íntima que existe.

| Ejemplo | ¿Cómo se conecta? |
|---------|-------------------|
| Auriculares inalámbricos al celular | Bluetooth |
| Reloj inteligente y teléfono | Bluetooth |
| Teclado y mouse inalámbricos | Bluetooth o dongle de radiofrecuencia |
| Celular y auto (Android Auto / CarPlay) | Bluetooth + Wi-Fi |

**Cómo leer esta tabla.** Dos columnas: **qué par de aparatos** se hablan y **por qué medio** lo
hacen. La segunda columna casi siempre dice Bluetooth, y eso no es casualidad: Bluetooth está
diseñado justamente para este tamaño de red, con muy poco consumo de batería.

Los términos de la segunda columna:

- **Bluetooth**: un estándar de radio de corto alcance pensado para emparejar dos aparatos
  cercanos. Consume poquísimo y por eso lo llevan los auriculares y los relojes.
- **Dongle de radiofrecuencia**: ese conector USB chiquito que traen algunos teclados y mouse. No
  es Bluetooth: es un receptor propio que se conecta a un canal fijo.
- **Android Auto / CarPlay**: los sistemas que proyectan el celular en la pantalla del auto. Usan
  Bluetooth para emparejar y Wi-Fi para pasar la imagen, porque el video necesita más ancho de
  banda que el audio.

La fila que más sorprende es la última: en el auto hay **dos redes a la vez**, una para el audio y
el emparejamiento (Bluetooth) y otra para la pantalla (Wi-Fi). Es un buen primer ejemplo de que
una misma situación real puede tener varias redes conviviendo.

> **Analogía:** si la red fuera el sistema postal, la PAN es el cartero que le entrega la carta directamente a tu mano, sin pasar por ninguna central.

### 6.3. LAN / WLAN — Local Area Network (red de área local)

**Alcance:** un edificio, una casa, una oficina (hasta unos cientos de metros).

La LAN es **la red por excelencia**: la que tenés en tu casa y en tu trabajo. Conecta computadoras, impresoras, servidores, celulares y más, con alta velocidad y muy baja latencia.

- **LAN cableada**: los dispositivos se conectan con cables Ethernet a un switch. Es la más rápida y estable.
- **WLAN** (Wireless LAN): los dispositivos se conectan por Wi-Fi a un punto de acceso. Más cómoda, algo menos estable que el cable.

```
        LAN DE UNA OFICINA CHICA

   [PC1]─┐
   [PC2]─┼──[Switch]──[Router]── Internet
   [PC3]─┘      │
            [Impresora]
```

**Cómo leer este diagrama.** Es una **estrella**, aunque todavía no le pongamos ese nombre. Tres
computadoras (PC1, PC2, PC3) entran por el lado izquierdo y se juntan en una llave que va al
**switch**, que es el equipo que las conecta entre sí. Del switch sale una línea al **router**, y
del router a **internet**. Abajo del switch cuelga la **impresora**.

El símbolo `─┐`, `─┼`, `─┘` es una forma de dibujar tres cables distintos que terminan en el mismo
punto. La línea vertical que baja al switch es el puerto donde se conectan.

Lo que tenés que mirar: **el switch está en el centro y todo lo demás cuelga de él**. Eso significa
que PC1 y PC2 se hablan sin pasar por el router, gastando nada de internet, y que la impresora
es visible para las tres computadoras. El router solo aparece cuando hay que salir de la oficina.

> **Dato técnico importante:** la velocidad típica de una LAN moderna es de **1 Gbps** (gigabit por segundo) en cable, y de unos cientos de Mbps en Wi-Fi. Si un día escuchás "mis archivos van lento", casi siempre es el Wi-Fi, no el cable.

Vale una precisión honesta sobre ese dato: 1 Gbps es lo más común en equipos hogareños y de
oficina chica, pero hoy conviven con 2,5, 5 y 10 Gbps en cableado profesional. Lo que sigue siendo
cierto es la **relación**: el cable es más rápido y más estable que el Wi-Fi, casi siempre.

### 6.4. CAN — Campus Area Network (red de área de campus)

**Alcance:** varios edificios en un mismo terreno (hasta unos pocos kilómetros).

Conecta las LANs de un **campus** (universidad, parque industrial, hospital) mediante enlaces de alta velocidad. Es como una LAN gigante con edificios en vez de habitaciones.

> **Ejemplo real:** una universidad donde la facultad de ingeniería, la biblioteca y el edificio de administración comparten una misma red interna, con un solo punto de salida a internet.

### 6.5. MAN — Metropolitan Area Network (red de área metropolitana)

**Alcance:** una ciudad (decenas de kilómetros).

Conecta redes dentro de una misma ciudad. Típicamente la arma un **proveedor de servicios** (ISP) o una municipalidad.

| Ejemplo | Descripción |
|---------|-------------|
| Wi-Fi urbano municipal | Red pública de internet en plazas y calles |
| Cámaras de tránsito | La red que conecta las cámaras de una ciudad a la central de monitoreo |
| Red de cable TV | La infraestructura por la que viaja tu cable e internet de una ciudad |

**Cómo leer esta tabla.** Dos columnas: el **servicio** que conocés de la ciudad y **qué hay detrás**
de ese servicio. La idea es que veas tres cosas completamente distintas —Wi-Fi en la plaza,
cámaras de tránsito, cable TV— y reconozcas que las tres son MAN, porque las tres cubren una
ciudad y las tres las arma alguien que no sos vos.

La segunda fila es la más útil para entender el concepto: **las cámaras de tránsito de una ciudad
son una red**. Cada cámara manda video a una central, todo el tiempo, por enlaces que cruzan
barrios. No lo pensás como una red porque no la usás, pero técnicamente es una MAN con un montón
de hosts (las cámaras) y unos cuantos routers en el medio.

### 6.6. WAN — Wide Area Network (red de área extendida)

**Alcance:** países, continentes (cientos o miles de kilómetros).

Conecta redes que están **lejos entre sí**. Es la categoría que usan las empresas con sucursales en distintas ciudades, y la que arman los proveedores de internet.

> **La idea clave de la WAN:** ninguna empresa "cablea" entre ciudades. Nadie entierra cientos de kilómetros de cable propio. Lo que se hace es **contratar** capacidad al proveedor (ISP), que ya tiene esa infraestructura. Así, la sucursal de Buenos Aires y la de Córdoba se conectan a través de la red del ISP, como si fueran una sola.

```
    Sucursal BA ──┐                     ┌── Sucursal Córdoba
                  │     (red del ISP)  │
    Casa central ─┴── [WAN] ───────────┴── Sucursal Rosario
```

**Cómo leer este diagrama.** Tres sedes: Buenos Aires, Córdoba y Rosario, con la casa central en
el medio. Los paréntesis indican que el tramo del medio **no es tuyo**: es la red del ISP, la que
el proveedor te alquila. La palabra `[WAN]` en el centro no es un equipo que vos comprás, es el
nombre de ese servicio contratado.

Lo que tenés que mirar: **el centro del dibujo no está en tus manos**. Si se corta el tramo entre
Córdoba y la central, vas a reclamar al proveedor, no abrir un rack. Esa dependencia es la
diferencia central entre una WAN y una LAN, y explica por qué las WAN se diseñan con más cuidado:
cuando el medio no es tuyo, lo único que podés hacer es tener un camino alternativo contratado.

### 6.7. GAN — Global Area Network (red de área global)

**Alcance:** todo el planeta.

Es la categoría de **internet**: la red que conecta todas las redes del mundo. Cuando navegás, tu red doméstica pasa a ser un pequeño suburbio dentro de esta red global.

> **Dato curioso:** internet no tiene dueño. Ninguna empresa ni gobierno "es" internet. Lo que existe es un conjunto de miles de redes que se interconectan mediante acuerdos, y que comparten el mismo lenguaje (los protocolos TCP/IP).

Ese detalle tiene una consecuencia práctica que conviene entender temprano: **internet no tiene un
soporte al que llamar**. Cuando "no anda internet", el problema está siempre en algún tramo
concreto, y saber de quién es cada tramo es lo que permite resolverlo. Tu router es tuyo hasta el
módem, el módem es del proveedor, y de ahí en adelante hay una cadena de redes de distintos
dueños.

### 6.8. Tabla resumen

| Tipo | Alcance | Ejemplo típico | ¿Quién la arma? |
|------|---------|----------------|-----------------|
| PAN | Metros | Auriculares Bluetooth | El usuario |
| LAN/WLAN | Un edificio | Red de casa u oficina | El usuario / un técnico |
| CAN | Un campus | Universidad | La institución |
| MAN | Una ciudad | Wi-Fi urbano, cable TV | ISP / municipio |
| WAN | Países | Sucursales de una empresa | ISP (se contrata) |
| GAN | Mundo | Internet | Nadie en particular: es la interconexión de todas |

**Cómo leer esta tabla.** Es la síntesis del capítulo en cuatro columnas: **tipo**, **alcance**,
**ejemplo** y —la más importante— **quién la arma**. Esa última columna es la que te dice, en cada
caso, a quién llamás cuando algo no funciona.

Leé la columna de quien la arma de arriba hacia abajo y fijate la progresión: vos, un técnico, una
institución, una empresa de servicios, un proveedor contratado, nadie. Cuanto más grande la red,
menos control tenés. Eso no es un problema, es la realidad de compartir infraestructura: lo que sí
conviene es saber en qué escalón estás parado.

> **Nota importante:** LAN y WAN no están separadas por una línea clara. Hoy las empresas mezclan tecnologías que se usan en ambas, y una red puede empezar como LAN y terminar conectada a una WAN. La clasificación es una herramienta para pensar, no una camisa de fuerza.

### Resumen

- Las redes se nombran por **alcance**: PAN (metros), LAN (un edificio), CAN (un campus), MAN (una
  ciudad), WAN (países) y GAN (el mundo).
- La PAN es la red de lo que llevás encima: auriculares, reloj, teclado. Casi siempre Bluetooth.
- La **LAN** es la red que administrás vos: switch en el centro, router para salir, cable mejor que
  Wi-Fi.
- La **WAN** es la red que **alquilás**: se llama así porque el cable es del proveedor, no tuyo.
- Las fronteras entre categorías son difusas; sirven para decidir el equipamiento, no para
  discutir de qué tipo es una red en particular.

---

## 7. Las VPN: un túnel privado dentro de una red pública

### 7.1. El problema que resuelve

Supongamos que trabajás desde tu casa y necesitás acceder a los archivos de la oficina. Internet es un espacio **público**: todo lo que viaja por ella puede ser interceptado (en el punto 13 vas a ver por qué exactamente). Mandar datos de la empresa por internet "pelado" es como enviar una carta sin sobre: cualquiera que la toque la lee.

Vale aclarar qué significa "puede ser interceptado", porque suena a película. No hace falta ser un
genio: cualquier equipo por el que pasa tu tráfico —el Wi-Fi del bar, el router del hotel, un
proveedor intermedio— puede, en principio, mirar lo que pasa si ese tráfico no está cifrado. No
hace falta que nadie te apunte con un satélite: alcanza con estar en el medio del camino.

### 7.2. La solución: el túnel

Una **VPN** (*Virtual Private Network*, red privada virtual) crea un **túnel cifrado** entre tu dispositivo y la red de la oficina, atravesando internet. Todo lo que viaja por ese túnel va **encriptado**: aunque alguien lo intercepte, no puede leerlo.

```
    Tu casa                           Internet                          Oficina
  [Notebook] ────[Túnel VPN cifrado ────────>]──────────[VPN]──[Servidor de archivos]
                  (nadie puede leer lo que viaja adentro)
```

**Cómo leer este diagrama.** Se lee de izquierda a derecha, como el viaje de un dato. A la izquierda
está tu notebook, en tu casa. A la derecha, el servidor de archivos de la oficina. En el medio está
internet, dibujada como el espacio público que es. Lo que importa es el **corchete grande del
medio**: `[Túnel VPN cifrado ────────>]` indica que todo ese tramo va envuelto y cerrado, y el
paréntesis de abajo lo confirma: nadie puede leer lo que viaja adentro.

El equipo marcado `[VPN]` del lado de la oficina es la puerta de entrada al túnel: el punto donde
el tráfico se descifra y se entrega a la red interna. Esa puerta es, a la vez, el control de
seguridad, porque ahí se decide quién puede entrar y a qué.

> **Analogía:** internet es una autopista llena de gente mirando lo que llevás. Una VPN es un túnel cerrado que va de tu casa a la oficina: entrás con tu auto, nadie ve qué llevás adentro, y salís directo en el estacionamiento de la oficina.

### 7.3. ¿Para qué se usan las VPN?

| Uso | Descripción |
|-----|-------------|
| **Teletrabajo** | El empleado accede a la red de la empresa como si estuviera en la oficina |
| **Privacidad en redes públicas** | Usar el Wi-Fi de un hotel o aeropuerto sin que te espíen |
| **Unir sedes** | Conectar la red de dos sucursales como si fueran una sola (VPN sitio a sitio) |
| **Ocultar ubicación** | La dirección IP visible pasa a ser la del servidor VPN, no la propia |

**Cómo leer esta tabla.** Dos columnas: **el uso** y **qué logra** ese uso en concreto. Los tres
primeros usos son de empresa o de trabajo remoto; el cuarto es el que más se publicita al
consumidor y el que más malentendidos genera.

Un detalle de vocabulario que vas a escuchar: **VPN sitio a sitio**. Es la de la tercera fila, y se
llama así porque une dos **sitios** completos (dos sucursales) en lugar de una persona suelta. En
lugar de que cada empleado abra su túnel, se arma un solo túnel entre los dos routers y todos los
empleados de una sede salen por ahí sin enterarse.

### 7.4. Una aclaración importante (leyendo entre líneas)

Muchos servicios que se venden como "VPN para consumidores" lo que realmente hacen es **enrutar tu tráfico por servidores del proveedor**, además de cifrarlo. Eso sirve para privacidad, pero no convierte a tu conexión en "invisible" ni "impenetrable". La disciplina de seguridad real está en el cifrado, las contraseñas, y las políticas — no en el logo de la app.

Dicho de otro modo: una VPN cambia **quién puede mirar** tu tráfico. Lo que hacía tu tráfico sigue
siendo lo mismo, y el proveedor de la VPN pasa a estar en condiciones de verlo. La privacidad se
muda de lugar; no aparece de la nada.

> **Dato técnico:** la VPN es un **complemento transversal**: se puede aplicar sobre cualquier tipo de red (LAN, WAN, celular). No es "otra categoría de red" que reemplace a las anteriores — es un mecanismo que se suma a ellas.

### Resumen

- Internet es un espacio **público**: lo que viaja sin cifrar puede ser leído en cualquier tramo del
  camino.
- Una **VPN** es un túnel cifrado que cruza esa red pública y entrega el tráfico en la red privada
  de la oficina.
- Sirve para cuatro cosas: teletrabajo, privacidad en redes ajenas, unir sedes y ocultar la
  dirección de origen.
- Una VPN cambia **quién puede mirar**, no hace invisible tu conexión: el proveedor de la VPN pasa
  a poder ver lo que antes veía tu red.
- Es transversal: se aplica **encima** de cualquier tipo de red, no la reemplaza.

---

## 8. Modelos de conexión: ¿iguales o jerárquicos?

Dos computadoras conectadas pueden relacionarse de dos formas filosóficamente distintas: como **iguales** (P2P) o como **jefe-empleado** (cliente-servidor). Ambas siguen existiendo hoy, cada una en su terreno.

La palabra "filosóficamente" no es exagerada. No estás eligiendo un cable ni una velocidad: estás
eligiendo **quién manda** en la red. Todo lo demás —dónde están los archivos, quién da permisos,
qué pasa cuando algo se rompe— sale de esa decisión.

### 8.1. Red Peer-to-Peer (P2P — entre pares)

En una red P2P, todas las computadoras tienen **los mismos derechos**: cada una puede ser a la vez cliente (pedir recursos) y servidor (ofrecer recursos). No hay jerarquía, no hay centro de control.

```
   [PC1] ────── [PC2]         Cada PC comparte archivos con las demás
     │  \      /  │           y pide archivos a las demás
     │   \    /   │           (todos son iguales)
   [PC3] ────── [PC4]
```

**Cómo leer este diagrama.** Cuatro computadoras conectadas entre sí en un cuadrado con diagonales:
cada una tiene línea con las otras tres. No hay ningún equipo en el centro, y eso es todo el punto
del dibujo. Las frases de la derecha no son parte de la red: son la aclaración de que **cada flecha
funciona en los dos sentidos**, porque cualquiera puede pedir y cualquiera puede dar.

Lo que tenés que mirar: **no hay una caja más importante que las otras**. Si se apaga PC2, la red
sigue existiendo entre las tres restantes. Esa es la gran ventaja del P2P y también su gran
problema: nadie lleva el registro de qué hay dónde.

| Característica | Descripción |
|----------------|-------------|
| Cómo funciona | Cada nodo ofrece y consume recursos |
| Ventaja principal | Simple: no hace falta configurar un servidor |
| Ejemplos reales | Compartir archivos en una red doméstica, juegos en red LAN, redes BitTorrent, aplicaciones de mensajería descentralizadas |
| Limitaciones | Escala mal (a más nodos, más difícil controlar), sin gestión central de permisos, seguridad limitada |

**Cómo leer esta tabla.** Cuatro filas que responden cuatro preguntas: **cómo funciona**, cuál es su
**ventaja principal**, **dónde se ve en la vida real** y cuáles son sus **limitaciones**. Es el
mismo esquema que vas a encontrar en el modelo cliente-servidor, y está armado así a propósito:
las dos tablas se leen en paralelo.

BitTorrent, de la tercera fila, es el ejemplo más claro del mundo real: cuando descargás una
distribución de Linux por torrent, no la bajás de un servidor central sino de pedacitos que te dan
otras personas. Cada una de esas personas es a la vez cliente (baja) y servidor (sube).

### 8.2. Red Cliente-Servidor

Acá hay **roles fijos**: uno o más **servidores** (máquinas potentes que ofrecen servicios y almacenan datos) y muchos **clientes** (las computadoras de las personas, que piden servicios).

```
            [SERVIDOR]
           /     |     \
          /      |      \
     [PC1]    [PC2]    [PC3]      ← los clientes piden, el servidor responde
```

**Cómo leer este diagrama.** Arriba, el servidor; abajo, tres computadoras. Las flechas del dibujo
van de los clientes hacia arriba aunque estén dibujadas como líneas simples, y la anotación de la
derecha lo dice explícito: **los clientes piden, el servidor responde**.

Compará mentalmente con el dibujo del P2P: mismas cantidades, distinta forma. Aquí hay un equipo
que está **por encima** de los otros y todos pasan por él. Por eso este modelo se llama
jerárquico, y por eso tiene un punto único de falla tan claro.

| Característica | Descripción |
|----------------|-------------|
| Cómo funciona | El servidor (o varios) centraliza los datos y servicios; los clientes los consumen |
| Ventaja principal | Control central: permisos, respaldos, seguridad y actualizaciones en un solo lugar |
| Ejemplos reales | Navegar una web (tu navegador es cliente del servidor web), el correo, las bases de datos, YouTube, los juegos online con servidores centrales |
| Limitaciones | El servidor es un punto de falla (si cae, todos se quedan sin servicio); requiere administración y presupuesto |

**Cómo leer esta tabla.** Es la gemela de la tabla del P2P: mismas cuatro filas, mismo orden. Eso
permite leerlas enfrentadas y ver que cada ventaja de un modelo es la limitación del otro. Donde el
P2P dice "no hace falta configurar un servidor", el cliente-servidor dice "control central en un
solo lugar"; donde el P2P dice "escala mal", el cliente-servidor ofrece permisos y respaldos
uniformes.

> **Dato curioso:** cuando mirás una serie en Netflix, tu TV es el "cliente" y los servidores de Netflix son el "servidor". Cuando descargás un archivo por BitTorrent, participás de una red P2P. Usás los dos modelos todos los días sin darte cuenta.

### 8.3. Comparación directa

| Criterio | P2P | Cliente-Servidor |
|----------|-----|------------------|
| Quién ofrece los recursos | Todos | Solo los servidores |
| Control central | No existe | El servidor es el centro |
| Escalabilidad | Difícil (crece el caos) | Fácil (se agregan servidores o clientes) |
| Seguridad | Débil por diseño | Fuerte si se configura bien |
| Costo | Bajo (sin servidor) | Mayor (hardware + administración) |
| Punto de falla | Ninguno en particular | El servidor |
| Mejor para | Redes chicas, usos puntuales | Empresas, servicios públicos, casi todo en producción |

**Cómo leer esta tabla.** Tres columnas: **el criterio** con el que comparás, y después **cómo se
comporta cada modelo** en ese criterio. Se lee **por fila, no por columna**: elegís un criterio y
ves qué dice cada lado. La última fila, "mejor para", es la conclusión resumida de todas las
anteriores.

Fijate en un detalle de la fila "Punto de falla": el P2P dice "ninguno en particular", que suena
mejor de lo que es. Significa que no hay un equipo cuya caída corte todo, pero también que **no hay
un lugar donde buscar el problema**. En el cliente-servidor, en cambio, el punto de falla es obvio:
si no anda nada, mirá el servidor primero. A veces saber dónde buscar vale más que no tener el
problema.

**Regla de oro:** si la red va a crecer, si hay datos importantes, o si hay más de ~10 dispositivos, se elige **cliente-servidor**. El P2P queda para redes pequeñas o usos específicos donde la simplicidad vale más que el control.

### Resumen

- Hay dos formas de relacionar equipos: **P2P** (todos iguales) y **cliente-servidor** (roles fijos).
- El **P2P** es simple y barato, pero no tiene control central: escala mal y es difícil de asegurar.
- El **cliente-servidor** centraliza permisos, respaldos y actualizaciones, a cambio de un servidor
  que hay que mantener y que puede caerse.
- El punto de falla del cliente-servidor es una desventaja y también una ventaja: **sabés dónde
  buscar** cuando algo deja de andar.
- Regla práctica: si la red crece o hay datos importantes, **cliente-servidor**; si son pocos
  equipos y nada crítico, P2P alcanza.

---

## 9. Topologías de red: la forma de la red

### 9.1. ¿Qué es una topología?

La **topología** es **cómo están conectados los nodos de una red entre sí**. Es la "forma" de la red. Se puede pensar de dos maneras:

- **Topología física**: cómo están conectados los **cables y dispositivos en la realidad**. Es el mapa de instalación.
- **Topología lógica**: cómo **viajan los datos** entre los nodos, independientemente de los cables. Es el mapa de conversaciones.

> **Analogía:** la topología física es el plano de las rutas de una ciudad (las calles reales). La topología lógica es el recorrido que hace una carta de una casa a otra (puede haber una ruta directa aunque las calles den vueltas). No siempre coinciden.

A continuación, las seis topologías clásicas. Para cada una: qué es, un diagrama, sus fortalezas, sus debilidades, y **cuándo conviene usarla**.

Un aviso sobre cómo leer lo que viene. Las tablas de cada topología tienen siempre dos columnas,
**A favor** y **En contra**, y están alineadas fila por fila a propósito: cada fila pone una ventaja
enfrentada a su precio. No son listas independientes, son la misma decisión mirada desde los dos
lados. Después de cada tabla vas a encontrar la parte que más importa: **por qué y cuándo elegiría
alguien esta forma**.

### 9.2. Topología en estrella

Todos los nodos se conectan a un **dispositivo central**. Todo el tráfico pasa por el centro.

```
              [PC2]
               |
      [PC1]──[CENTRO]──[PC3]
               |
              [PC4]
```

**Cómo leer este diagrama.** Cuatro computadoras y una caja en el medio llamada `CENTRO`. Cada PC
tiene una única línea, y todas las líneas llegan al mismo punto. Eso es toda la topología: **no hay
ningún camino entre dos computadoras que no pase por el centro**.

Los cuatro brazos son iguales a propósito: en una estrella no hay PCs "más importantes". Lo único
distinto es el centro, y por eso todo el análisis de esta topología gira alrededor de una pregunta:
¿qué pasa si el centro falla?

El "CENTRO" históricamente era un **hub** (un repetidor tonto que mandaba todo a todos), y hoy es un **switch** (un equipo inteligente que manda cada dato solo a su destinatario). La estrella es **la topología de facto** de las redes modernas: tu red de casa es una estrella con el router en el centro.

| A favor | En contra |
|---------|-----------|
| Si un nodo falla, **la red sigue funcionando** (solo se cae ese nodo) | Si **falla el centro, se cae todo** (punto único de falla) |
| Agregar o quitar dispositivos no interrumpe la red | El centro requiere una inversión (switch/router) |
| Fácil detectar dónde está el problema: se aísla por nodo | Más cable que en un bus (cada nodo necesita su cable al centro) |
| Rendimiento predecible: el centro gestiona el tráfico | El centro puede ser un cuello de botella si es muy chico para la red |

**Cómo leer esta tabla.** Las dos columnas se leen de a pares: la primera fila dice "se cae un nodo,
no pasa nada" a la izquierda y "se cae el centro, se cae todo" a la derecha. Es el mismo hecho
visto de los dos lados: la estrella **concentra el riesgo en un solo equipo**.

Tres consecuencias prácticas que salen de esa tabla:

- La fila del cable es el costo real de la estrella: cada equipo necesita **su** cable hasta el
  centro. En un edificio son muchos metros, y por eso el cableado estructurado es un rubro aparte.
- La fila del rendimiento explica por qué el centro tiene que estar sobredimensionado: si el switch
  central no se da abasto, todo el tráfico de todos los equipos pasa por un embudo.
- La fila de "fácil detectar dónde está el problema" es la ventaja que más se valora en el día a
  día. Con la estrella, el diagnóstico es rápido: ¿anda el equipo? ¿anda el centro? Listo.

**¿Cuándo usarla?** Casi siempre. Es la elección natural para hogares, oficinas y la mayoría de las LANs. Es flexible, fácil de administrar y de crecer.

En palabras llanas: elegí estrella cuando **querés que la red sea fácil de mantener y de arreglar**, y
cuando podés permitirte que el centro sea un equipo bueno. Es la respuesta por defecto y la que
tenés que saber justificar cuando no la uses. La estrella no falla por ser mala: falla cuando el
centro es barato y se satura, o cuando nadie tiene un repuesto del switch central.

> **Ojo con un error común:** decimos "hub en el centro" y "switch en el centro" como si fueran sinónimos. No lo son. El hub (capa 1) repite todas las señales a todos los puertos; el switch (capa 2) aprende y envía solo al destino. Más adelante vas a ver exactamente cómo piensa un switch. La topología es la misma (estrella); el *cerebro* en el centro es distinto.

### 9.3. Topología en bus

Todos los nodos cuelgan de **un único cable central** (el "bus" o troncal), con un **terminador** en cada extremo.

```
  [PC1]    [PC2]    [PC3]    [PC4]
    │        │        │        │
  ──┴────────┴────────┴────────┴───   ← cable principal
   TERM.                              TERM.
```

**Cómo leer este diagrama.** Una línea horizontal larga es el **cable principal**, y cada computadora
baja a ella con una conexión corta (los símbolos `┴`). En los dos extremos del cable hay un
**terminador**, marcado `TERM.`, que es una resistencia que absorbe la señal para que no rebote.

Lo que tenés que mirar: **hay un solo cable para todos**. No existe un equipo central: PC2 habla con
PC3 por el mismo cable por el que PC1 habla con PC4. Ese cable compartido es la fortaleza (barato)
y la condena (si se corta en cualquier punto, se parte la red en dos pedazos que no se ven).

| A favor | En contra |
|---------|-----------|
| Muy económica: un solo cable para toda la red | **Todo el cable es el punto de falla**: si se corta en cualquier punto, se cae toda la red |
| Instalación simple | Un nodo más = más lentitud para todos (el medio se comparte) |
| Fácil de entender | Solo un equipo puede transmitir a la vez; si dos transmiten a la vez, **colisión** (y hay que retransmitir) |
| | Difícil encontrar la falla sin equipos de medición |

**Cómo leer esta tabla.** Fijate que la columna izquierda tiene solo tres filas y la derecha cuatro.
La celda vacía de la izquierda, en la última fila, no es un error: significa que no hay ninguna
ventaja que oponer a "difícil encontrar la falla". El bus es una tecnología donde las desventajas
son más largas que las ventajas.

La palabra clave de la tercera fila es **colisión**: dos equipos transmiten al mismo tiempo sobre el
mismo cable, las señales se mezclan y las dos se pierden. En una red de bus, las colisiones no son
una falla: son parte del funcionamiento normal, y todos los equipos tienen que esperar y repetir.

**¿Cuándo usarla?** En la práctica, **ya no se usa** para LANs modernas (fue la red de cable coaxial de los años 80-90, 10Base2/10Base5). Pero la idea del bus **sobrevive lógicamente**: el cable de TV por cable (DOCSIS) y las primeras redes Ethernet eran buses. Lo estudiamos porque te explica por qué nacieron los switches: para eliminar las colisiones del bus.

En palabras llanas: **no la elijas hoy**, pero entendela, porque es el origen de todo. La pregunta
"¿por qué hay switches?" tiene una sola respuesta y está en esta sección: porque compartir un cable
entre todos genera colisiones, y una caja central que entrega solo al destinatario las elimina.

> **Analogía:** el bus es una charla de grupo donde todos hablan por el mismo megáfono: si dos hablan a la vez, no se entiende nada y hay que repetir. La estrella con switch es una reunión con un moderador que da la palabra solo a quien corresponde.

### 9.4. Topología en anillo

Los nodos se conectan **formando un círculo**. Los datos viajan de nodo en nodo hasta llegar al destino. Existía en dos sabores: **anillo simple** (el tráfico circula en un solo sentido) y **anillo doble** (dos anillos en sentidos opuestos, para dar redundancia).

```
    [PC1] ─────── [PC2]
      │             │
      │             │
    [PC4] ─────── [PC3]

   Los datos pasan de nodo en nodo (token ring / FDDI)
```

**Cómo leer este diagrama.** Cuatro computadoras en cuadrado, conectadas en ciclo cerrado: PC1 con
PC2, PC2 con PC3, PC3 con PC4 y PC4 con PC1. No hay centro y no hay extremos libres: el dibujo es
un círculo, y la anotación de abajo aclara cómo viajan los datos: **de nodo en nodo**.

Lo que tenés que mirar: **cada computadora es también un repetidor**. Cuando PC1 le manda algo a
PC3, el mensaje pasa por PC2, aunque PC2 no tenga nada que ver. Eso permite cubrir distancias
largas y es, a la vez, el motivo por el que un solo nodo roto corta todo el círculo.

| A favor | En contra |
|---------|-----------|
| Cada nodo actúa como repetidor: las distancias pueden ser largas | **Si un nodo muere, el anillo se rompe** y afecta a toda la red |
| Sin colisiones (el "token" da el turno de hablar) | Agregar o quitar un nodo **detiene la red** para todos |
| Rendimiento predecible en cargas altas | El tráfico "da la vuelta" entera aunque el destino esté al lado |
| | Tecnología históricamente cara (FDDI requería fibra) |

**Cómo leer esta tabla.** Se lee de a pares, igual que la de la estrella, y cada par cuenta una
tensión:

- **Fiabilidad**: la izquierda dice que el anillo aprovecha a cada nodo como repetidor; la derecha
  dice que eso mismo convierte a cualquier nodo en un eslabón indispensable.
- **Conflictos**: sin colisiones porque hay un **token** (un turno simbólico que va pasando: solo
  habla quien tiene el turno). Es ordenado, y también rígido.
- **Recorrido**: el dato puede tener el destino al lado y aun así dar toda la vuelta.
- **Costo**: **FDDI** (*Fiber Distributed Data Interface*) era el estándar de anillo sobre fibra, y la
  fibra de esa época era carísima.

> **Analogía:** el anillo es un tren de juguete que pasa por todas las estaciones: la carga le da toda la vuelta y cada estación mira si es para ella. Si una estación desaparece... el tren descarrila.

**¿Cuándo usarla?** Actualmente **quedó en desuso** en LANs (IBM Token Ring y FDDI fueron sus exponentes). Sigue viva la idea en algunos backbone de fibra (redes de anillo de los ISP para las ciudades) donde el anillo doble da redundancia: si se corta un tramo, el tráfico va por el otro lado.

En palabras llanas: como red de oficina **no la vas a usar**; como idea de redundancia **sí la vas a
ver**. Cuando en un manual de fibra leas "anillo metropolitano", está hablando de esto: dos caminos
opuestos para que un corte no deje a una ciudad sin servicio.

### 9.5. Topología en árbol

Es una **estrella de estrellas**: varios concentradores secundarios se conectan a un concentrador central, con una relación jerárquica "padre-hijo". Como un árbol real: tronco (concentrador central), ramas (concentradores secundarios) y hojas (dispositivos).

```
                [CENTRO PRINCIPAL]
                /        |        \
        [SW A]           |           [SW B]
        /    \           |           /    \
     [PC1]  [PC2]    [SW C]      [PC5]  [PC6]
                     /    \
                  [PC3]  [PC4]
```

**Cómo leer este diagrama.** Empezá por arriba: `CENTRO PRINCIPAL` es el tronco. De ahí bajan tres
ramas: el switch A, una conexión directa y el switch B. Y de cada switch bajan las hojas: PC1 y PC2
cuelgan de A, PC5 y PC6 de B, y PC3 y PC4 del switch C, que a su vez cuelga del centro principal.

Fijate que `SW C` está en un nivel más abajo que `SW A` y `SW B`: hay **tres niveles** (centro,
switches, equipos). Eso es lo que distingue al árbol de la estrella simple. Para ir de PC3 a PC6 hay
que subir a C, subir al centro y bajar por B: el camino es más largo, pero el orden es claro.

| A favor | En contra |
|---------|-----------|
| Muy escalable: se agregan "ramas" a medida que crece la organización | Si falla el **tronco** (centro principal), todo lo que cuelga de él se cae |
| Facilita aislar problemas por rama (se diagnostica cada subred por separado) | Requiere más cableado que una estrella simple |
| Natural para organizaciones por departamentos/funciones | La gestión se vuelve compleja en árboles grandes: hay que documentar bien |

**Cómo leer esta tabla.** La primera fila es la razón por la que el árbol existe: **crecer por ramas**
sin rehacer lo que ya está. Cuando una organización suma un piso o un departamento, agrega un switch
nuevo y lo cuelga del árbol; no toca nada más.

La segunda fila ("se diagnostica cada subred por separado") es la ventaja que más se usa en el día a
día: si en el piso 3 nadie tiene red, mirás el switch del piso 3 y no la red entera. La contra de la
tercera fila es real: en un árbol grande nadie recuerda de memoria qué cuelga de dónde. Sin
documentación, el árbol se vuelve un laberinto.

**¿Cuándo usarla?** En redes de tamaño medio/grande: un edificio de oficinas donde cada piso tiene su switch, y todos los switches suben al switch central. Es la evolución natural de la estrella cuando una sola no alcanza.

En palabras llanas: **cuando la estrella se queda chica, no la reemplazás por otra cosa: la apilás**.
Eso es el árbol. Es la respuesta correcta para cualquier organización que crezca por pisos, sectores
o sucursales dentro de un mismo predio.

> **Dato técnico:** casi todas las LANs empresariales modernas son, en la práctica, un árbol de estrella: switches de acceso por piso → switch de distribución → switch de núcleo (core). Esta jerarquía se llama "diseño jerárquico de red" y es la base de las redes empresariales modernas.

Esos tres nombres son los que vas a leer en cualquier manual serio: **acceso** (donde se conectan los
equipos), **distribución** (donde se juntan los pisos) y **core** o núcleo (donde se une todo y se
sale a internet).

### 9.6. Topología de malla (mesh)

Los nodos están **interconectados entre sí** por múltiples caminos. Dos variantes:

- **Malla completa (full mesh)**: cada nodo está conectado con todos los demás.
- **Malla parcial (partial mesh)**: hay múltiples rutas, pero no todas las conexiones posibles.

```
  FULL MESH                    PARTIAL MESH
   [A]──[B]                     [A]──[B]
   │ \/ │                        │  ╲ │
   │ /\ │                        │   ╲│
   [C]──[D]                     [C]──[D]

   Cada nodo habla con todos     Hay rutas alternativas
   los demás directamente        sin conectar absolutamente todo
```

**Cómo leer este diagrama.** Son **dos dibujos comparados**. A la izquierda, la malla completa: A, B,
C y D están unidos todos con todos, sin excepción. A la derecha, la malla parcial: falta un enlace
(el de A con D), pero sigue habiendo un camino alternativo para llegar.

El símbolo `\/` y `/\` del medio son las diagonales del cuadrado, o sea los enlaces cruzados. Las
frases de abajo resumen cada lado: a la izquierda "cada nodo habla con todos"; a la derecha "hay
rutas alternativas sin conectar absolutamente todo".

| A favor | En contra |
|---------|-----------|
| Altísima fiabilidad: si falla un enlace, **hay rutas alternativas** | Mucho cable y puertos (la malla completa con n nodos necesita n(n−1)/2 enlaces) |
| Sin "cuello de botella" central: el tráfico puede tomar el camino más corto | Instalación costosa y laboriosa |
| Escala bien para redes críticas | La lógica de enrutamiento es compleja (hay que elegir la mejor ruta) |

**Cómo leer esta tabla.** Las tres filas cuentan la misma historia desde tres ángulos: **fiabilidad
máxima** a cambio de **mucho cable**, **instalación cara** y **decisión difícil**. No hay ninguna
fila de la izquierda que sea gratis.

La fórmula `n(n−1)/2` merece que la entiendas, porque es la que decide si la malla es viable. Con 4
nodos son 6 enlaces; con 10 nodos son 45; con 20 nodos son 190. **El costo crece al cuadrado**: por
eso la malla completa solo se usa entre muy pocos equipos (por ejemplo, entre tres routers
principales) y nunca con todas las computadoras de una oficina.

**¿Cuándo usarla?** En sistemas críticos donde la caída no es opción: el núcleo de internet (los grandes proveedores se conectan entre sí en malla parcial), redes militares, y el **Wi-Fi mesh** de hogares modernos (varios puntos de acceso que se cubren entre sí para eliminar zonas sin señal).

En palabras llanas: **cuando el costo de caerse es mayor que el costo del cable**. Ese cálculo es
raro en una casa y normal en un banco. Y hay un caso doméstico donde ya la estás usando sin saberlo:
el Wi-Fi mesh son varios puntos que se hablan entre sí por radio en vez de por cable, logrando la
misma propiedad —si un punto falla, los otros encuentran otro camino— sin enterrar un solo metro de
cobre.

> **Dato real del día a día:** el Wi-Fi mesh de tu casa (esos sistemas con varios aparatos que se llaman igual) es una malla inalámbrica parcial: cada punto se conecta con los otros puntos para extender la cobertura sin cablear.

### 9.7. Topología híbrida

Combina **dos o más topologías** en una misma red. Es, de lejos, la más común en organizaciones grandes: cada departamento puede tener su estrella, los edificios se conectan en árbol, y las sedes lejanas se unen con malla parcial a través de la WAN.

```
   [Edificio 1: árbol]       [Edificio 2: estrella]
          │                         │
          └─────────(WAN)───────────┘
                    (enlace de malla entre sedes)
```

**Cómo leer este diagrama.** Dos edificios con formas internas distintas: el primero, un árbol; el
segundo, una estrella. Los dos bajan hasta una línea horizontal rotulada `(WAN)` que los une: el
enlace contratado entre sedes. El paréntesis vuelve a marcar lo mismo que en el capítulo 6: ese
tramo no es tuyo.

Lo que tenés que mirar: **el dibujo es coherente aunque las formas no coincidan**. Cada edificio usa
la topología que le conviene puertas adentro, y lo que los une es otra cosa. Eso es exactamente lo
que hace una organización real.

| A favor | En contra |
|---------|-----------|
| Máxima flexibilidad: cada zona usa la topología que le conviene | Complejidad: hay que entender y administrar varias topologías a la vez |
| Crece a medida de las necesidades | Diagnosticar problemas es más difícil (¿de qué topología es este problema?) |
| | Cuesta más documentar y capacitar al equipo |

**Cómo leer esta tabla.** Otra vez la celda vacía de la izquierda en la última fila: no hay ventaja
que oponer a "cuesta más documentar". La híbrida es el caso donde **el precio de la flexibilidad es
la documentación**: para que la red sea manejable, tiene que estar dibujada y actualizada.

La fila del diagnóstico es la que más duele en la práctica. Cuando algo se rompe en una red híbrida,
la primera pregunta es **en qué pedazo** de la red se rompió, y sin mapa esa pregunta no tiene
respuesta. Ahí se ve por qué el capítulo siguiente trata de mapear: en una red híbrida, el mapa no es
un lujo, es la herramienta de trabajo.

**¿Cuándo usarla?** Cuando la organización tiene zonas con necesidades distintas (una oficina chica no necesita la redundancia de una sala de servidores). En la práctica: casi toda red empresarial de cierto tamaño es híbrida.

### 9.8. Arquitecturas prácticas vs. topologías puras

Un apunte honesto para principiantes: las topologías "puras" (bus, anillo) son **modelos teóricos e históricos**. Las redes reales de hoy son, en su gran mayoría:

1. **Estrella** en cada piso/hogar (switch o router central).
2. **Árbol** uniendo las estrellas (jerarquía de switches).
3. **Malla parcial** en los enlaces críticos (entre sedes, en el núcleo de los ISP).
4. **Híbrida** combinando lo anterior.

Dominar el modelo de estrella es el 80% de lo que necesitás para entender LANs reales. Las demás son contexto que explica el porqué del diseño.

### Resumen

- La **topología** es la forma de la red, y hay que distinguir la **física** (los cables) de la
  **lógica** (por dónde viajan los datos).
- **Estrella**: todo cuelga de un centro. Fácil de mantener y de diagnosticar, con un único riesgo
  grande: si el centro se cae, se cae todo.
- **Bus y anillo** son historia viva: explican por qué existen los switches (colisiones) y por qué
  existen los anillos de fibra (redundancia).
- **Árbol** es una estrella de estrellas: la forma natural de crecer por pisos y sectores.
- **Malla** compra fiabilidad con cable, y su costo crece al cuadrado; se reserva para lo crítico.
- **Híbrida** es lo que hay en la realidad: cada zona con la forma que le sirve, y todo unido por
  arriba.

---

## 10. ¿Qué topología es mejor?

### 10.1. La respuesta honesta

**No existe la "mejor" topología.** Existe la mejor topología **para cada caso**. La elección depende de cuatro factores que se pesan entre sí:

| Factor | Qué preguntarse | Estrella | Malla |
|--------|-----------------|:--------:|:-----:|
| **Presupuesto** | ¿Cuánto puedo gastar en cables, puertos y equipos? | Barata | Cara (muchos enlaces) |
| **Fiabilidad** | ¿Puedo permitirme que se caiga la red? | Punto único de falla (el centro) | Redundancia natural |
| **Escalabilidad** | ¿Va a crecer la red? | Crece fácil (sumar nodos) | Crece caro (n(n−1)/2 enlaces) |
| **Facilidad de gestión** | ¿Quién la va a administrar? | Simple, problemas aislados | Compleja |

**Cómo leer esta tabla.** Cuatro columnas: **el factor**, **la pregunta que te tenés que hacer**, y
las dos últimas comparan **estrella** contra **malla** en ese factor. Esos dos puntos (`:---:`) en la
fila de separación solo centran el texto: no cambian nada del contenido.

La forma correcta de usarla es **por fila**: leé la pregunta, contestala con tu caso, y después
mirá qué dice cada topología. Si tu red es una casa, contestás "presupuesto bajo", "la caída no
es grave", "no va a crecer mucho" y "la administro yo": las cuatro respuestas apuntan a estrella.
Si tu red es el núcleo de un proveedor, contestás lo contrario en las cuatro y apuntan a malla.

Lo importante: **comparar dos topologías no es comparar productos, es comparar decisiones**. La
tabla no te da un ganador porque no hay uno; te da el vocabulario para justificar lo que elijas.

### 10.2. Guía de decisión rápida

```
¿Cuántos dispositivos aprox.?

    ≤ 20  →  ESTRELLA (un switch/router central alcanza)
   20–200 →  ÁRBOL de estrellas (un switch por zona + switch central)
   > 200  →  ÁRBOL + segmentación (VLANs)
             + MESH parcial en los enlaces críticos
¿Hay caídas inaceptables? →  agregá redundancia (malla parcial, doble enlace)
¿Varias sedes?            →  la WAN entre sedes se diseña con malla parcial
```

**Cómo leer este diagrama.** Es un **árbol de decisión**: preguntas arriba, respuestas abajo, y las
flechas `→` separan la condición de la recomendación. Se lee en dos partes:

- La primera pregunta es **cuántos equipos hay**, y tiene tres respuestas posibles según el rango:
  hasta 20, entre 20 y 200, o más de 200.
- Las dos preguntas siguientes son independientes del número y se aplican siempre: si las caídas son
  inaceptables, agregás redundancia; si hay varias sedes, el enlace entre ellas se diseña con malla.

El término **VLAN** de la tercera respuesta lo vas a ver en todo el curso: una VLAN (*Virtual LAN*)
no es un cable distinto sino una **red separada lógicamente dentro del mismo switch**. Sirve para
que, por ejemplo, administración y depósito compartan los mismos equipos fijos sin verse entre sí.

Lo que tenés que mirar: **las respuestas no se excluyen**. La tercera línea no dice "árbol en lugar
de malla": dice árbol **más** segmentación **más** malla parcial en los enlaces críticos. En redes
grandes, la respuesta casi siempre es una combinación.

> **Regla memorable:** "*Si no sabés qué topología usar, usá estrella.* Es la respuesta correcta en la mayoría de los casos, y el lugar perfecto para empezar. Las excepciones se justifican solas: cuando la fiabilidad manda (malla) o cuando la escala obliga (árbol/híbrida). La elección equivocada no suele ser "estrella cuando debía ser malla", sino **no documentar lo que elegiste**."

### 10.3. Impacto de la topología en la red

La topología no es un capricho de dibujo: condiciona directamente cuatro propiedades de la red:

| Propiedad | Cómo la afecta la topología |
|-----------|-----------------------------|
| **Rendimiento** | En estrella, el centro puede saturarse con mucho tráfico. En malla, los datos eligen la ruta más corta. En bus/anillo, el medio se comparte y todos compiten. |
| **Fiabilidad** | Estrella y bus tienen puntos únicos de falla (centro / cable único). Malla y anillo doble sobreviven a fallas parciales. |
| **Escalabilidad** | Estrella y árbol crecen sumando nodos sin tocar la estructura. Malla crece pero cada nodo nuevo encarece el total. |
| **Costo (TCO)** | El **TCO** (Total Cost of Ownership — costo total de propiedad) suma la inversión inicial + mantenimiento + costo del tiempo de inactividad. Una malla barata no existe: los enlaces redundantes cuestan. Un bus barato termina saliendo caro en horas de diagnóstico. |
| **Seguridad** | Las topologías centralizadas (estrella, árbol) facilitan aplicar políticas: todo pasa por un punto que se puede controlar. Las descentralizadas (malla) tienen diversidad de rutas, lo que puede ser positivo (no hay un solo "embudo" para atacar) o negativo (más difícil vigilar todo). |
| **Gestión** | Estrella: el problema se aísla rápido (es ese nodo o el centro). Anillo: hay que recorrer todo el círculo. Malla: hay que trazarse la ruta de los datos para entender dónde falló. |

**Cómo leer esta tabla.** Dos columnas: **la propiedad** de la red que se ve afectada y **cómo la
afecta** cada topología, mencionadas en la misma celda. Se lee de a una fila, comparando las
topologías que la celda nombra.

La fila que más subestima la gente es **TCO**, porque es la única que suma el costo del **tiempo de
inactividad**: las horas de gente sin trabajar y las horas de alguien buscando la falla. Una red de
bus es la más barata del catálogo el día que la comprás, y puede ser la más cara dos años después.

La fila de **Seguridad** también sorprende: centralizar es bueno para controlar y malo para
sobrevivir a un ataque. En una estrella, el centro es un punto por donde pasa todo, y eso significa
que también es un único lugar donde mirar y donde bloquear. En una malla, controlar es más difícil
precisamente porque hay más caminos.

### Resumen

- **No hay una mejor topología**: hay la mejor para tu caso, y se decide pesando presupuesto,
  fiabilidad, escalabilidad y facilidad de gestión.
- La pregunta más útil es **cuántos equipos tenés**: hasta 20 estrella, hasta 200 árbol, más de 200
  árbol segmentado con malla en lo crítico.
- **VLAN** no es una topología: es separar redes lógicamente dentro del mismo switch.
- La topología condiciona **rendimiento, fiabilidad, escalabilidad, costo total y seguridad**.
- El costo real incluye el **tiempo de inactividad**: la opción más barata hoy puede ser la más cara
  en dos años.

---

## 11. Mapeo de la topología: dibuja tu red

### 11.1. Por qué documentar

Una red **sin mapa** es una red sin diagnóstico. Cuando algo falla (y va a fallar), el primer paso de cualquier profesional es **mirar el mapa** y decir "por acá no puede ser; el problema está en esta rama".

Además, el mapa es la base de la **continuidad del negocio**: si mañana se va el único que conocía la red, el mapa permite que cualquiera entienda qué hay, cómo está conectado y dónde están los puntos críticos.

> **Analogía:** navegar sin mapa es posible... hasta que hay tormenta. La red es el barco, el mapa de topología es la carta náutica. Cuando el barco se hunde, la carta es lo primero que buscás.

### 11.2. Qué debe tener un buen mapa de red

| Elemento | Qué se dibuja |
|----------|---------------|
| **Dispositivos** | Routers, switches, access points, servidores, impresoras, PCs |
| **Enlaces** | Qué conecta a qué, por qué medio (cable/fibra/Wi-Fi) y a qué velocidad |
| **Segmentos** | Si hay VLANs o subredes, dibujarlas aparte |
| **Puntos críticos** | Dónde está el punto único de falla (por ejemplo: "si cae el switch del piso 2, se caen 25 máquinas") |
| **Cuellos de botella** | Enlaces lentos, equipos viejos, zonas de Wi-Fi débil |

**Cómo leer esta tabla.** Dos columnas: **qué elemento** del mapa y **qué se dibuja** exactamente. Se
lee como una lista de control: si tu mapa no tiene alguna de estas cinco cosas, está incompleto.

Fijate que las dos últimas filas no son para dibujar equipos sino **problemas**. Un buen mapa no es
solo el inventario de lo que hay: también marca **dónde duele**. Si sabés que el switch del piso 2
alimenta 25 máquinas y no hay repuesto, eso tiene que estar escrito en el mapa, porque es la
información que necesitás a las tres de la mañana cuando algo se cae.

### 11.3. Herramientas para mapear

| Nivel | Herramienta |
|-------|-------------|
| Manual simple | Dibujo a mano, diagramas en herramientas de diagramación (draw.io, excalidraw) |
| Profesional | Software de monitoreo con **descubrimiento automático** (LLDP/CDP, SNMP, nmap): escanea la red y dibuja la topología de capa 2 y 3 solita |
| Cisco / Packet Tracer | El simulador permite armar y documentar topologías completas |

**Cómo leer esta tabla.** Dos columnas: **el nivel de madurez** (de lo más casero a lo más
profesional) y **la herramienta** que corresponde. La idea es que no hay excusa para no tener mapa:
la primera fila es gratis y ya sirve.

Las siglas de la segunda fila, porque aparecen en cualquier manual de administración:

- **LLDP/CDP**: protocolos con los que los equipos se presentan a sus vecinos por el cable. LLDP es
  el estándar abierto; CDP es el de Cisco. Sirven para que el software sepa qué hay conectado.
- **SNMP**: el protocolo estándar para leer el estado de un equipo de red (cuánto tráfico, qué
  puertos, qué errores). Es el idioma del monitoreo.
- **nmap**: un programa de escaneo que descubre qué equipos y qué servicios hay en una red.
- **Capa 2 y capa 3**: los niveles del modelo OSI donde vive el switch (capa 2, direcciones MAC) y el
  router (capa 3, direcciones IP). El manual de modelos de red lo explica en detalle.

> **Regla de administración:** toda red que supere los ~10 dispositivos merece un mapa actualizado. Actualizarlo cada vez que se hace un cambio es parte del trabajo, no un extra.

### Resumen

- Una red sin mapa es una red **sin diagnóstico**: el mapa es lo primero que se mira cuando algo
  falla.
- Un buen mapa tiene cinco cosas: dispositivos, enlaces, segmentos, **puntos críticos** y **cuellos
  de botella**.
- Las dos últimas importan tanto como las tres primeras: el mapa tiene que decir **dónde duele**.
- Para empezar alcanza con **dibujar a mano**; después vienen el descubrimiento automático y los
  simuladores.
- El mapa se actualiza con cada cambio; si no, en seis meses miente y un mapa que miente es peor que
  no tener mapa.

---

## 12. Componentes de red en profundidad

Llegó el momento de estudiar las piezas. Acá está el detalle técnico que un futuro administrador necesita.

Si los capítulos anteriores fueron el plano del barrio, este es el plano de cada casa. Vamos a ver
los equipos uno por uno, y en cada caso vas a encontrar lo mismo: qué capa es, qué hace, qué **no**
hace, una analogía y su estado actual. Ese esquema se repite porque es el que sirve para no
confundirlos entre sí.

### 12.1. Dispositivos finales (hosts)

Son los que las personas usan: la computadora, el celular, la impresora, el servidor, la Smart TV, la cámara IP. **Un host es el origen o el destino de los datos** — no un mero transportador.

Todos los hosts tienen una **NIC** (Network Interface Card — tarjeta de interfaz de red): el componente que los conecta al enlace. Es el "oído y boca" del dispositivo.

- En una notebook suele estar integrada en la placa madre (y tiene además una antena Wi-Fi).
- Cada NIC tiene una dirección **MAC** única de fábrica: su identificador físico.

La sigla **MAC** significa *Media Access Control*. Es un número de 48 bits grabado en la tarjeta, que
en la práctica se escribe como seis pares hexadecimales: `00:1A:2B:3C:4D:5E`. No se configura: viene
puesto. Sirve para el tramo final del viaje, el que va desde el switch hasta tu máquina.

> **Dato para "hacelo vos":** en Windows, abrí una terminal y escribí `ipconfig /all`; en Linux, `ip a`. Vas a ver la IP de tu equipo, la máscara, el gateway y la MAC física. Eso que aparece en pantalla son exactamente los conceptos de este curso. Tratá de identificar cada campo con lo que ya sabés.

Qué mirar en cada comando, porque la salida impresiona al principio:

- **`ipconfig /all`** (Windows): la barra y la palabra `all` piden que muestre **todo** el detalle de
  cada placa, no el resumen corto. Buscá las líneas que dicen *Dirección física* (esa es la MAC),
  *Dirección IPv4*, *Máscara de subred*, *Puerta de enlace predeterminada* (el router) y *Servidores
  DNS*.
- **`ip a`** (Linux): la `ip` es la herramienta moderna y `a` es la abreviatura de `address`
  (direcciones). Lista cada interfaz con su nombre (`lo` es el loopback, `wlan0` o `wlp2s0` es el
  Wi-Fi, `eth0` o `enp3s0` es el cable) y debajo muestra `link/ether` (la MAC) e `inet` (la IP).

Si encontrás esos datos en tu propia máquina, ya tenés el vocabulario del capítulo aplicado a algo
real. Es el mejor ejercicio de cinco minutos de todo el manual.

### 12.2. Dispositivos intermedios: los "trabajadores" de la red

Estos son los equipos que hacen que los datos **lleguen** adonde tienen que llegar. Diferenciarlos bien es la base de TODO lo que viene.

#### Hub (concentrador)

- **Capa:** 1 (física).
- **Qué hace:** recibe una señal en un puerto y la **repite por TODOS los demás puertos**.
- **Qué NO hace:** no distingue destinatarios, no aprende nada, no filtra nada.
- **Analogía:** un altoparlante en una reunión: lo que decís, lo escuchan todos.
- **Estado actual:** obsoleto para redes reales. Lo vemos por historia y porque explica las colisiones.

```
  [PC1] →  [HUB] → manda la señal a PC2, PC3 y PC4
            aunque el destino sea solo PC2
```

**Cómo leer este diagrama.** Una computadora manda algo, el hub lo recibe y lo reparte a todos los
demás puertos. La frase de abajo es la clave: *aunque el destino sea solo PC2*. El hub no lee
nada; repite la señal eléctrica y listo.

Lo que tenés que mirar: **el desperdicio**. Tres computadoras reciben datos que no les
corresponden. Peor: mientras una habla, las otras no pueden hablar sin generar una colisión. Ese es
el problema que el switch vino a resolver, y por eso el hub hoy es una pieza de museo.

#### Switch (conmutador)

- **Capa:** 2 (enlace de datos).
- **Qué hace:** aprende **quién está en cada puerto** (por la dirección MAC) y envía cada trama **solo al puerto del destinatario**.
- **Qué NO hace:** no maneja direcciones IP ni decide rutas entre redes.
- **Analogía:** una central telefónica que conoce cada oficina y conecta la llamada directamente, sin que todo el edificio escuche.
- **Estado actual:** el corazón de toda LAN moderna.

```
  [PC1] →  [Switch] → envía solo a PC2
            (ya sabe que PC2 está en ese puerto)
```

**Cómo leer este diagrama.** Es el mismo dibujo que el del hub, con una diferencia de una palabra:
*envía solo a PC2*. El paréntesis explica el motivo: el switch **ya sabe** en qué puerto está cada
equipo, porque lo fue aprendiendo.

Cómo aprende, en una frase: cada vez que llega una trama, anota en una tabla interna "esta MAC
llegó por este puerto". Cuando tiene que entregar algo a esa MAC, ya sabe por dónde. Esa tabla se
arma sola y se refresca sola: es lo que se llama **tabla MAC** o tabla de conmutación.

#### Router (enrutador)

- **Capa:** 3 (red).
- **Qué hace:** lee las **direcciones IP**, decide por qué camino enviar los paquetes hacia otras redes, y conecta tu red con el resto del mundo.
- **Qué NO hace:** no "inunda" nada ni se entera de MACs ajenas... bueno, en realidad sí usa MAC para el tramo local (ARP), pero su función central es el enrutamiento.
- **Analogía:** la oficina central de correos que mira el código postal (la IP) y decide por qué ruta despachar el paquete.
- **Estado actual:** el dispositivo que tenés en tu casa (combinado con switch, Wi-Fi y módem en uno solo).

```
  [LAN 192.168.1.0] → [Router] → decide ruta → [otra red / Internet]
```

**Cómo leer este diagrama.** A la izquierda, la red local, escrita como `192.168.1.0` (una red
privada típica de casa). A la derecha, el resto del mundo. En el medio, el router, con la palabra
clave: **decide ruta**.

Lo que tenés que mirar: **la decisión**. El switch no decide nada: sabe dónde está cada equipo y
entrega. El router sí decide, porque conoce varias salidas posibles y elige una. Esa elección, hecha
miles de veces por segundo y en cadena con otros routers, es lo que hace que internet funcione.

La **ARP** que aparece en el punto anterior es el mecanismo que traduce una IP a una MAC dentro de la
red local: para entregar un paquete a una IP de mi misma red, necesito saber qué tarjeta física le
corresponde. Es el puente entre las dos formas de dirección que mencionamos en el capítulo 1.

#### Punto de acceso inalámbrico (AP — Access Point)

- **Qué hace:** conecta dispositivos **Wi-Fi** a la red cableada. Es como un switch pero con ondas de radio.
- **Para qué sirve:** sin AP, los dispositivos inalámbricos no pueden entrar a la LAN.

Un detalle que confunde: el router de tu casa **tiene un AP adentro**. Son dos funciones distintas
en la misma caja. Por eso, cuando el Wi-Fi anda mal pero el cable anda bien, el problema está en la
función AP, no en el router. En redes grandes esas funciones viven en equipos separados, y por eso
los AP se cuelgan del switch como cualquier otro equipo.

#### Módem / ONT

- **Qué hace:** convierte la señal que te entrega el **proveedor** (fibra, cable, DSL, 4G/5G) en una señal que tus dispositivos entienden (Ethernet).
- **Por qué existe:** tu red interna habla "Ethernet"; la red del ISP habla "fibra/coaxial". Alguien tiene que traducir. Ese alguien es el módem.

Las siglas de la primera línea: **ONT** es *Optical Network Terminal*, la caja que termina la fibra
en tu casa; **DSL** es la tecnología de internet por línea telefónica. El nombre "módem" viene de
**modulador-demodulador**, que es exactamente lo que hace: convierte datos en una señal que puede
viajar por el medio del proveedor y la vuelve a convertir al llegar.

#### Firewall

- **Qué hace:** filtra el tráfico según reglas de seguridad: permite lo permitido y bloquea el resto.
- **Analogía:** el guardia de seguridad del edificio del sistema postal: controla qué cartas entran y salen.
- **Dato honesto:** muchos routers hogareños incluyen un firewall básico. Las redes profesionales tienen firewalls dedicados.

### 12.3. Tabla comparativa de los tres grandes

| Criterio | Hub | Switch | Router |
|----------|-----|--------|--------|
| Capa OSI | 1 (física) | 2 (enlace) | 3 (red) |
| Lee qué dato | Nada (solo repite señales) | Dirección MAC | Dirección IP |
| Envía el tráfico | A todos los puertos | Solo al puerto destino | Hacia la red destino |
| ¿Separa dominios de colisión? | No | Sí (por puerto) | Sí |
| ¿Separa dominios de broadcast? | No | No (sin VLANs) | Sí |
| ¿Aprende algo? | No | Sí (tabla MAC) | Sí (tabla de rutas) |
| Uso actual | Obsoleto | Toda LAN | Unión de redes, salida a Internet |

**Cómo leer esta tabla.** Es la tabla más importante del capítulo, y se lee **por fila**: cada fila
es una pregunta y cada columna es la respuesta de un equipo. Recorré las filas de arriba hacia abajo
y vas a ver cómo se complejiza: primero la capa, después qué dato lee, después qué hace con eso,
después qué separa y finalmente qué aprende.

Dos conceptos de las filas del medio, porque son los que más se preguntan en un examen:

- **Dominio de colisión**: el conjunto de equipos que compiten por el mismo medio. En un hub, todos
  están en el mismo: si dos transmiten, chocan. El switch lo parte en uno por puerto, y por eso las
  colisiones desaparecen.
- **Dominio de broadcast**: el conjunto de equipos que reciben un mensaje dirigido "a todos". El
  switch no lo separa; el router sí, y por eso una red con demasiados equipos se segmenta con
  routers o con VLANs.

Y fijate en la última fila: **el switch es el único de los tres que hoy se usa masivamente en su
forma original**. El hub está obsoleto y el router se usa para lo que siempre hizo: unir redes.

> **Regla fácil de recordar:** *el hub replica, el switch entrega, el router decide.* Si lo pensás así, nunca más los vas a confundir.

### 12.4. Switch de capa 3 (multicapa)

Existe un híbrido: el **switch de capa 3**, que combina la velocidad del switch con la capacidad de enrutamiento del router. Por eso cuando veas "capa 3" en un switch, significa que puede enrutar entre VLANs o entre redes sin necesitar un router aparte. Es habitual en redes grandes.

En criollo: es un switch que también sabe decidir. Se usa cuando tenés muchas VLANs y no querés
que todo el tráfico entre ellas suba hasta un router central; el switch hace ese trabajo ahí mismo,
más rápido.

### 12.5. Los medios de transmisión en detalle

#### Par trenzado (UTP)

- Es el cable Ethernet clásico: 8 hilos de cobre trenzados de a pares dentro de una chaqueta, con conector **RJ45**.
- **Alcance práctico:** hasta 100 metros por tramo (después se necesita switch o repetidor).
- **Categorías comunes:** Cat5e (1 Gbps), Cat6 (1-10 Gbps según distancia), Cat6a (10 Gbps).
- **Uso:** la columna vertebral de las LANs cableadas.

Las siglas: **UTP** es *Unshielded Twisted Pair* (par trenzado sin blindaje). Los pares van trenzados
justamente para que las interferencias afecten a los dos hilos por igual y se cancelen; **RJ45** es el
conector de plástico transparente que se enchufa en el switch.

Sobre el límite de 100 metros: no es una recomendación, es una propiedad del cable. Pasado ese
tramo, la señal llega tan débil que los errores se multiplican. Por eso los edificios grandes tienen
un switch por piso en lugar de un cable larguísimo desde el sótano.

#### Fibra óptica

- Los datos viajan como **pulsos de luz** por filamentos de vidrio.
- **Ventajas:** velocidades enormes (10/40/100/400 Gbps), distancias largas (kilómetros), inmune a interferencias eléctricas.
- **Variantes:** monomodo (largas distancias, láser) y multimodo (distancias cortas, LED).
- **Uso:** internet actual — desde los cables submarinos entre continentes hasta la "fibra al hogar" (FTTH) que te instala tu proveedor.

Una precisión sobre las variantes, y también una corrección al dato original: el **monomodo** tiene un núcleo tan fino que la luz viaja en
un solo camino, y por eso llega a decenas de kilómetros; el **multimodo** tiene un núcleo más ancho y la
luz rebota en varias trayectorias, lo que la limita a distancias cortas. Sobre el LED de la línea de
arriba: fue el origen histórico del multimodo, pero hoy lo habitual en esa variante es un láser
pequeño y barato (**VCSEL**), que llega más lejos y más rápido. La idea de fondo sigue siendo la
misma: más ancho de núcleo, menos distancia.

**FTTH** es *Fiber To The Home*, fibra hasta la casa. **Gbps** son gigabits por segundo, la unidad de
ancho de banda que ya viste en el capítulo 2.

#### Coaxial

- Un conductor central rodeado de un blindaje. Fue el cable de las redes Ethernet originales y hoy es el cable de **TV por cable / internet por cable** (estándar DOCSIS).

#### Inalámbrico

| Tipo | Alcance típico | Uso |
|------|----------------|-----|
| Wi-Fi (802.11) | 10-50 m en interiores | LAN inalámbrica |
| Bluetooth | ~10 m | Periféricos y PAN |
| Celular 4G/5G | Kilómetros (cobertura de la antena) | Internet móvil |
| Satelital | Global | Zonas sin otra cobertura |

**Cómo leer esta tabla.** Tres columnas: **el tipo** de enlace inalámbrico, **cuánto alcanza** y
**para qué se usa**. Se lee de arriba hacia abajo y el alcance crece en cada fila: diez metros,
cincuenta metros, kilómetros, el planeta.

El número de la primera fila, **802.11**, es el nombre técnico del estándar Wi-Fi: cuando leés
"Wi-Fi 6" o "Wi-Fi 7" en una caja, detrás hay una versión de 802.11 con otro número. Y el alcance de
10 a 50 metros no es una garantía: depende de las paredes, del microondas y de cuántos vecinos
estén usando el mismo canal.

> **Dato importante sobre velocidades (error típico de principiantes):** cuando un proveedor te vende "300 megas", habla de **megabits por segundo (Mbps)**. Un **megabyte (MB)** son **8 megabits**. O sea: 300 Mbps ≈ 37,5 MB/s reales. La gente confunde las unidades y cree que su conexión "anda mal". Saber esto te va a evitar dolores de cabeza de por vida.

### 12.6. El camino completo de un dato (versión corta)

Ya tenés todas las piezas. Armemos el rompecabezas con lo aprendido:

1. Tu **host** (PC) crea los datos.
2. La **NIC** los convierte en señales que viajan por el **enlace** (cable o Wi-Fi).
3. El **switch** (si hay) los entrega al destino correcto dentro de tu LAN.
4. El **router** los saca de tu red y los envía hacia internet (decidiendo la ruta).
5. En internet, **los routers de los ISP** los van pasando de red en red.
6. En destino, el proceso se invierte: router → switch → enlace → NIC → dispositivo final.

Ese trayecto, todo el tiempo, para todo lo que hacés en la red. Ahora sí: vamos a verlo en detalle con un ejemplo real.

### Resumen

- Los **hosts** son el origen o el destino de los datos, y todos tienen una **NIC** con una
  **dirección MAC** grabada de fábrica.
- **Hub replica** (capa 1), **switch entrega** (capa 2, con tabla MAC) y **router decide** (capa 3,
  con tabla de rutas): esa frase resume el capítulo.
- **AP** lleva el Wi-Fi a la red cableada; **módem u ONT** traducen la señal del proveedor;
  **firewall** filtra según reglas.
- Los medios son **cobre** (UTP hasta 100 m, coaxial), **fibra** (monomodo lejos, multimodo cerca) y
  **aire** (Wi-Fi, Bluetooth, celular, satélite).
- El **Mbps no es MB/s**: hay que dividir por 8. Es el error de unidad más común de todos.

---

## 13. ¿Qué pasa cuando abro Google? El viaje completo

Esta es la sección más importante del manual, porque junta TODO lo anterior en una sola historia. Cuando escribís `google.com` en el navegador y tocás Enter, esto es lo que pasa (en orden, y sin profundizar todavía):

### Paso 1 — Tu navegador prepara el pedido

El navegador genera una **solicitud** de la página (protocolo HTTP/HTTPS). Esa solicitud es un montón de datos que quieren ir a Google.

En criollo: el navegador arma un texto que dice "quiero la página de google.com, y soy un navegador
que acepta imágenes y comprime". Ese texto es el **pedido**, y va a viajar por HTTP/HTTPS, que es el
protocolo de la web que ya viste en el capítulo 2.

### Paso 2 — Traducir el nombre a una dirección

Tu navegador no sabe dónde está "google.com": internet no entiende nombres, entiende **direcciones IP**. Entonces pregunta al **servidor DNS** (el "directorio telefónico" de internet): "¿cuál es la IP de google.com?". El DNS responde, por ejemplo, `142.250.64.14`.

> **Analogía:** el DNS es la guía telefónica de internet. Guardás "Pizzería del Centro" en la agenda, pero el teléfono solo marca números.

### Paso 3 — El viaje de ida

La solicitud se parte en **paquetes** y cada paquete sale de tu host:

1. Atraviesa tu red local (**LAN**) por el switch, si lo hay.
2. Llega al **router de tu casa**, que le pone tu "dirección de origen" y lo despacha a través del **módem** hacia el proveedor (en el camino, el router aplica **NAT**, el mecanismo que permite que miles de redes compartan un mismo rango de IPs).
3. Los **routers de los ISP** lo reenvían de red en red, eligiendo cada vez la mejor ruta, hasta llegar al router de Google.

El **NAT** (*Network Address Translation*, traducción de direcciones de red) merece una línea más,
porque ya apareció varias veces: tu red privada usa direcciones que solo existen puertas adentro
(como `192.168.1.x`), y el router las traduce a la única dirección pública que te dio el proveedor.
Es como un edificio con un solo portero: hacia afuera hay una sola dirección, y el portero sabe a
qué departamento corresponde cada respuesta.

### Paso 4 — El servidor de Google responde

Los servidores de Google procesan la solicitud y devuelven la página. La respuesta viaja por **el mismo tipo de camino pero en sentido inverso**.

### Paso 5 — El viaje de vuelta

Los paquetes vuelven: routers de ISP → tu router → tu LAN → tu host. Tu navegador los **rearma en orden** (gracias a TCP) y **dibuja la página** en pantalla.

Todo esto, en circunstancias normales, tarda **menos de un segundo**.

```
  [Tu PC] ──[tu router/NAT]──[ISP]──[routers de internet]──[servidores de Google]
     ▲                                                           │
     │                     ← respuesta ←                        │
     └───────────────────────────────────────────────────────────┘
     (DNS primero: "¿qué IP tiene google.com?")
```

**Cómo leer este diagrama.** Se lee en dos tiempos. Primero, la línea de arriba: tu PC sale hacia
la derecha pasando por tu router (con NAT), el ISP, los routers de internet y termina en los
servidores de Google. Después, la flecha de abajo, que vuelve de derecha a izquierda: es la
respuesta recorriendo el mismo camino al revés.

La nota del final —*DNS primero*— es la que explica que antes de todo ese viaje hubo una consulta
previa para averiguar la IP. Sin ese paso, tu PC no sabría hacia dónde mandar nada.

Lo que tenés que mirar: **cuatro tramos bien distintos** (tu red, tu router, el ISP, internet). Esa
separación es la herramienta de diagnóstico más útil que te llevás de este manual: cuando algo no
anda, siempre hay que preguntarse en cuál de los cuatro tramos está el problema.

### Los términos técnicos que aparecieron (y qué significan)

| Término | Qué es (en una línea) |
|---------|----------------------|
| Dirección IP | El "código postal" numérico de cada dispositivo |
| DNS | El directorio que traduce nombres a IPs |
| Paquete | Un "sobre" de datos con dirección de origen y destino |
| NAT | El mecanismo del router que traduce direcciones privadas a públicas |
| Enrutamiento | La decisión de qué camino toma cada paquete |
| TCP | El protocolo que garantiza que todo llegue completo y en orden |
| Dirección MAC | El identificador físico de la tarjeta de red de cada dispositivo |
| Switch | El equipo que entrega datos dentro de tu red local |

**Cómo leer esta tabla.** Es un glosario de bolsillo del capítulo: cada fila es una palabra que
apareció en el relato y su definición en una sola línea. Si podés leer el viaje completo y explicar
cada fila sin mirar la tabla, entendiste el manual.

Fijate que las ocho palabras se reparten en dos grupos. Unas son **nombres de cosas** (dirección IP,
dirección MAC, paquete, switch): existen aunque nadie haga nada. Otras son **acciones o reglas** (DNS
resuelve, NAT traduce, el enrutamiento decide, TCP garantiza): son cosas que **hacen** algo. Separar
esos dos grupos es la mitad del vocabulario de redes.

**Recordá este momento.** Cuando domines el vocabulario técnico, vas a poder explicarle a cualquiera — con lujo de detalle — qué pasa entre el Enter y la página en pantalla.

### Resumen

- Abrir una página son **cinco pasos**: preparar el pedido, resolver el nombre con DNS, viajar de
  ida, recibir la respuesta y rearmar todo en orden con TCP.
- **DNS traduce el nombre a una IP**: sin ese paso previo, el navegador no sabe hacia dónde ir.
- El viaje tiene **cuatro tramos** (tu red, tu router, el ISP, internet) y saber cuál falla es el
  corazón del diagnóstico.
- **NAT** es el portero del edificio: muchas direcciones privadas salen al mundo como una sola
  dirección pública.
- Todo el viaje tarda **menos de un segundo**, y en ese segundo hicieron su trabajo todos los
  equipos y protocolos del manual.

---

## 14. Comprobá lo que aprendiste

Intenta responder sin mirar las respuestas. Cuando termines, tapá con la mano y comparí con lo que escribiste.

### Pregunta 1
¿Cuáles son los tres ingredientes básicos de toda red?

**Respuesta:** **Nodos** (los dispositivos), **enlaces** (los caminos: cable, fibra, Wi-Fi) y **protocolos** (el idioma común que les permite entenderse).

### Pregunta 2
Tu oficina tiene 30 computadoras conectadas a un switch central. ¿Qué topología es? ¿Qué pasa si el switch se estropea?

**Respuesta:** Es una topología en **estrella**: todos los nodos cuelgan de un dispositivo central. Si el centro (switch) falla, **toda la red se cae** — es el punto único de falla de la estrella.

### Pregunta 3
¿Cuál es la diferencia entre un hub y un switch?

**Respuesta:** El **hub** repite toda señal por TODOS los puertos (no distingue destinatarios). El **switch** aprende en qué puerto está cada dispositivo y envía los datos **solo al puerto del destinatario**. Regla: *el hub replica, el switch entrega, el router decide*.

### Pregunta 4
¿Qué tipo de red va de una ciudad a otra conectando sucursales de una empresa? ¿Y qué tipo conecta tus auriculares al celular?

**Respuesta:** Sucursales en distintas ciudades → **WAN** (y se contrata al proveedor, no se cablea solo). Auriculares al celular → **PAN** (red de área personal, típicamente Bluetooth).

### Pregunta 5
¿Por qué una red P2P no suele ser la mejor opción para una empresa?

**Respuesta:** Porque no tiene **control central**: escalar es caótico, la seguridad y los permisos son difíciles de gestionar, y no hay un punto donde respaldar y proteger los datos. El modelo **cliente-servidor** centraliza la administración, los permisos y los respaldos, que es justo lo que una empresa necesita.

### Pregunta 6
Estás navegando y la página tarda mucho en cargar. Tu amigo dice "seguro es tu placa de red, la capa 1". ¿Qué podés responderle con criterio?

**Respuesta:** Que la lentitud puede venir de **muchas capas**: el enlace (capa 1), la red doméstica con muchos dispositivos compitiendo, el enrutamiento del ISP, o el propio servidor de la página (capa 7). Con una sola medición no se puede culpar a la placa de red. Un buen diagnóstico separa los síntomas: ¿pasa con un solo sitio o con todos? ¿pasa por cable y por Wi-Fi? ¿pasa a otra hora?

### Pregunta 7
El proveedor te vende "100 megas". ¿Cuántos megabytes por segundo podés esperar como máximo, aproximadamente?

**Respuesta:** Los "megas" del proveedor son **megabits por segundo**. Un byte son 8 bits, así que 100 Mbps ≈ **12,5 MB/s** como máximo teórico (en la práctica, menos). Confundir las unidades es el error de principiante más común del mundo de las redes.

### Resumen

- Las siete preguntas cubren **todo el manual**: ingredientes de una red, topologías, hub contra
  switch, tipos por alcance, P2P contra cliente-servidor, diagnóstico por capas y unidades.
- Si te trabaste en alguna, volvé al capítulo que la explica antes de seguir: estos conceptos se
  usan sin aviso en todos los manuales siguientes.
- El hilo que las une es siempre el mismo: **qué pieza hace qué**, y **en qué tramo del viaje está el
  problema**.

---

## 15. Glosario

| Término | Definición |
|---------|------------|
| **Red** | Conjunto de dos o más dispositivos conectados para compartir datos y recursos |
| **Nodo** | Cualquier dispositivo de la red con capacidad de enviar o recibir datos |
| **Host** | Dispositivo final (PC, celular, impresora, servidor) origen o destino de los datos |
| **Enlace** | Medio físico o inalámbrico por el que viajan los datos (cable, fibra, Wi-Fi) |
| **Protocolo** | Conjunto de reglas que define cómo se comunican los dispositivos |
| **NIC** | Tarjeta de interfaz de red: el componente que conecta un dispositivo al enlace |
| **Dirección MAC** | Identificador físico único de 48 bits grabado en cada tarjeta de red |
| **Dirección IP** | Identificador lógico numérico de un dispositivo dentro de una red |
| **ISP** | Proveedor de servicios de internet: la empresa que te brinda la conexión |
| **PAN** | Red de área personal: metros de alcance (Bluetooth) |
| **LAN / WLAN** | Red de área local (cableada / inalámbrica): un edificio, una casa |
| **CAN** | Red de área de campus: varios edificios de una misma organización |
| **MAN** | Red de área metropolitana: una ciudad |
| **WAN** | Red de área extendida: entre ciudades o países |
| **GAN** | Red de área global: internet |
| **VPN** | Red privada virtual: túnel cifrado dentro de una red pública |
| **P2P** | Red entre pares: todos los nodos son iguales |
| **Cliente-servidor** | Modelo con roles fijos: servidores centrales y clientes que consumen |
| **Topología** | La forma de la red: cómo están conectados los nodos |
| **Hub** | Repetidor de capa 1 que envía toda señal a todos los puertos (obsoleto) |
| **Switch** | Equipo de capa 2 que entrega los datos solo al puerto del destinatario |
| **Router** | Equipo de capa 3 que decide la ruta de los datos entre redes |
| **AP (Access Point)** | Equipo que conecta dispositivos Wi-Fi a la red cableada |
| **Módem / ONT** | Equipo que traduce la señal del proveedor a Ethernet |
| **Firewall** | Equipo o software que filtra el tráfico según reglas de seguridad |
| **TCO** | Costo total de propiedad: inversión inicial + mantenimiento + costos de caídas |
| **DNS** | Sistema que traduce nombres de dominio a direcciones IP |
| **Encaminar / Enrutar** | Decidir por qué camino enviar los paquetes |
| **Ancho de banda** | Cantidad de datos que puede transportar un enlace por unidad de tiempo |
| **Latencia** | Tiempo que tarda un dato en ir de un punto a otro |

**Cómo leer este glosario.** Es una tabla de dos columnas —**término** y **definición**— ordenada
más o menos en el orden en que los conceptos aparecieron en el manual. No está para leérsela de
corrido sino para volver: cuando en el manual de direcciones IP aparezca una palabra que no
teacordás, venís acá.

Las treinta definiciones se agrupan en cuatro familias, y verlo así ayuda a ordenar la cabeza:

- **Qué es la red**: red, nodo, host, enlace, protocolo, topología.
- **Cómo se identifica cada cosa**: NIC, dirección MAC, dirección IP, DNS.
- **Qué tamaño tiene**: PAN, LAN/WLAN, CAN, MAN, WAN, GAN.
- **Con qué se arma y quién la opera**: hub, switch, router, AP, módem/ONT, firewall, ISP, VPN,
  P2P, cliente-servidor, TCO.

Dos pares que conviene no mezclar nunca: **ancho de banda no es latencia** (cuánto entra contra
cuánto tarda) y **dirección MAC no es dirección IP** (física y fija contra lógica y configurable).

### Resumen

- El glosario concentra **treinta términos** en una línea cada uno; es la referencia rápida del manual.
- Se ordena en cuatro familias: qué es la red, cómo se identifica, qué tamaño tiene y con qué se arma.
- Las dos confusiones más caras son **ancho de banda contra latencia** y **MAC contra IP**.

---

## 16. Resumen en 10 puntos

1. Una **red** es un conjunto de dispositivos conectados para compartir datos y recursos.
2. Toda red tiene **tres ingredientes**: nodos, enlaces y protocolos.
3. Las redes traen grandes **ventajas** (compartir, centralizar, comunicar) y también **costos** (seguridad, dependencia, mantenimiento).
4. Antes de crear una red hay que responder **siete preguntas**: requisitos, alcance, participantes, privacidad, seguridad, hardware y soporte.
5. La administración no es opcional: **monitorear, actualizar, gestionar permisos y mantener** son las cuatro tareas básicas.
6. Las redes se clasifican por alcance: **PAN → LAN → CAN → MAN → WAN → GAN**.
7. La **VPN** es un túnel cifrado que atraviesa redes públicas con privacidad.
8. Hay dos modelos de relación: **P2P** (todos iguales) y **cliente-servidor** (jerarquía con centro).
9. Las topologías — **estrella, bus, anillo, árbol, malla e híbrida** — definen la forma, la fiabilidad y el costo de la red. La estrella es la reina de las LANs modernas.
10. **Hub replica, switch entrega, router decide.** Con esa frase y el mapa del viaje de "abrir Google", ya tenés el esqueleto de todo el curso.

Los diez puntos son el índice de lo que ya sabés. Si querés probarte, tapá la lista y contalos de
memoria; los que te falten son los capítulos que conviene releer. Y si te sale todo, ya estás en
condiciones de empezar el manual siguiente, que es donde el mapa se convierte en plano.

### Resumen

- Diez puntos cubren el manual entero: qué es una red, sus ingredientes, sus costos, su
  planificación, su administración, sus tamaños, la VPN, los modelos de conexión y las topologías.
- La frase que hay que llevarse es **hub replica, switch entrega, router decide**.
- Si podés contar estos diez puntos sin mirar, terminaste el manual de verdad.

---

## Próximo paso

Este manual te dio el **mapa general**: qué es una red y con qué piezas se construye.

El siguiente paso profundiza en *cómo piensan* los dispositivos: cómo se apilan los "sobres" de datos (la encapsulación), qué hace cada capa y cómo viaja un paquete de punta a punta con sus protocolos. Es el paso que convierte el mapa en un **plano de ingeniería**.

Cuando lo tengas listo, vas a poder decir: "lo que acá llamé *router decide*, allá se llama *capa 3*", y ahí empieza a aparecer el vocabulario técnico profesional.

### Resumen

- Este manual dejó el **mapa**: qué es una red, qué piezas tiene y cómo se eligen.
- El siguiente deja el **plano**: cómo se apilan las capas y qué hace cada protocolo por dentro.
- El puente entre los dos es el vocabulario: lo que acá se llamó "router decide", allá será "capa 3".

---

> **Fuente:** Documentación propia basada en estándares IEEE 802, material educativo de redes (CCNA, redes de computadoras) y el manual original de este curso.

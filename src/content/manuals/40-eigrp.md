# 40. EIGRP: El Híbrido que Piensa Antes de Caerse

**El protocolo de Cisco que aprende por "rumores"... pero guarda los planos y tiene la salida de emergencia ya calculada**

---

Este manual está escrito para alguien que nunca configuró un protocolo de enrutamiento. No hace falta que sepas nada de EIGRP para empezar: primero armamos el modelo mental (qué problema resuelve y de qué está hecho) y recién después bajamos a los comandos y a las pantallas del router.

**EIGRP** son las siglas de *Enhanced Interior Gateway Routing Protocol*, "protocolo mejorado de enrutamiento entre pasarelas interiores". Traducido a la vida diaria: es un **programa que corre dentro de los routers** y que hace que se descubran los caminos solos, sin que nadie escriba las rutas a mano. Lo inventó Cisco, y esa palabra —Cisco— va a aparecer todo el tiempo, porque es la característica más importante del protocolo y la que decide si lo podés usar o no.

Antes de seguir, cinco palabras que vas a leer en cada capítulo:

- Un **router** (en español, encaminador) es un equipo con varias patas; cada pata está conectada a una red distinta. Su trabajo es pasar paquetes de una red a otra. Cada pata es una **interfaz**: el conector por donde entra y sale el cable.
- Un **paquete** es el sobrecito de datos que viaja por la red, con una dirección de origen y una de destino, igual que una carta.
- Una **ruta** es una frase que el router guarda en su memoria: "para llegar a tal red, mandá el paquete por tal interfaz". Al conjunto de esas frases se lo llama **tabla de enrutamiento**, y es lo único que el router consulta para decidir por dónde sale cada paquete.
- Un **vecino** es el router que está del otro lado del cable, a un enlace de distancia. Con él se habla directamente; con los routers lejanos no se habla, se los conoce por lo que cuenta el vecino.
- La **métrica** es el número con el que el protocolo mide "qué tan bueno es un camino". Cuanto más chica, mejor. Todo protocolo de enrutamiento tiene la suya, y la métrica es lo que más los diferencia entre sí.

Si venís del manual de enrutamiento dinámico y del de OSPF, esto te va a sonar conocido y a la vez raro: EIGRP se parece a los dos y no es ninguno de los dos. Eso es exactamente el tema.

**Promesa de este manual:** al final vas a poder configurar EIGRP en tres routers, leer sin dudar las tres tablas del protocolo, calcular a mano la métrica de un camino y explicar por qué el backup de una ruta está garantizado sin bucles. Y vas a poder decir con argumentos si en tu red conviene EIGRP u OSPF, que es la pregunta que te van a hacer en el trabajo.

---

## Índice

- [El lugar de EIGRP en la familia](#1-el-lugar-de-eigrp-en-la-familia)
- [La ficha técnica: lo que hay que saber de entrada](#2-la-ficha-técnica-lo-que-hay-que-saber-de-entrada)
- [El corazón: el algoritmo DUAL](#3-el-corazón-el-algoritmo-dual)
- [Successor y Feasible Successor: el plan A y el plan B](#4-successor-y-feasible-successor-el-plan-a-y-el-plan-b)
- [La métrica: ya no es un simple contador](#5-la-métrica-ya-no-es-un-simple-contador)
- [Los vecinos: el protocolo de saludo propio](#6-los-vecinos-el-protocolo-de-saludo-propio)
- [La tabla de topología: donde vive la inteligencia](#7-la-tabla-de-topología-donde-vive-la-inteligencia)
- [Configuración: EIGRP en 10 minutos](#8-configuración-eigrp-en-10-minutos)
- [La joya escondida: el balanceo de carga desigual (variance)](#9-la-joya-escondida-el-balanceo-de-carga-desigual-variance)
- [EIGRP para IPv6 y address families](#10-eigrp-para-ipv6-y-address-families)
- [Verificación: las preguntas que le hacés a la red](#11-verificación-las-preguntas-que-le-hacés-a-la-red)
- [EIGRP vs OSPF: la comparación honesta](#12-eigrp-vs-ospf-la-comparación-honesta)
- [Los 5 errores más comunes](#13-los-5-errores-más-comunes)
- [Comprobá lo que aprendiste](#14-comprobá-lo-que-aprendiste)
- [Glosario](#15-glosario)
- [Resumen en 10 puntos](#16-resumen-en-10-puntos)

Cómo usar este índice: cada título es un capítulo y también es la dirección (la URL) con la que se publica la página. Si tenés poco tiempo, el camino corto es el capítulo 1 (qué es un híbrido y por qué se llama así), el 4 (el plan A y el plan B), el 5 (cómo se mide un camino) y el 8 (la configuración mínima). Con esos cuatro ya podés armar un laboratorio de tres routers y hacerlo funcionar. El resto es lo que necesitás para **diagnosticar** cuando algo no levanta: los capítulos 6, 11 y 13.

Una advertencia de método: EIGRP no se entiende por los comandos. Se entiende por una sola idea, que es la del título del manual: **el protocolo calcula la salida de emergencia antes de que haya emergencia**. Si te llevás esa frase, los comandos del capítulo 8 se vuelven obvios, porque cada uno habilita una parte de ese cálculo.

### Resumen

- EIGRP es un protocolo de enrutamiento dinámico: descubre caminos solo, sin rutas escritas a mano.
- Es propietario de Cisco, así que funciona entre routers Cisco y no se lleva bien con otros fabricantes.
- Su idea central es distinta a la de RIP y a la de OSPF: calcula el camino alternativo antes de que haga falta.
- Este manual construye primero el modelo mental y después baja a los comandos y a las pantallas.
- El camino corto son los capítulos 1, 4, 5 y 8; el resto es diagnóstico.

---

## 1. El lugar de EIGRP en la familia

En el tema del enrutamiento dinámico viste la gran bifurcación:

```text
      Vector de Distancia (RIP)          Estado de Enlace (OSPF)
   "aprendo por rumores"              "todos tienen el mapa"
```

Este bloque es el mapa de las dos familias de protocolos, dibujado con dos columnas. A la izquierda está el estilo **vector de distancia**, representado por RIP; a la derecha, el estilo **estado de enlace**, representado por OSPF. Las frases entre comillas de abajo resumen la filosofía de cada uno en una línea.

Dos siglas que conviene definir acá, porque aparecen todo el tiempo:

- **RIP** son las siglas de *Routing Information Protocol*, "protocolo de información de rutas". Es el protocolo dinámico más viejo y el más simple: solo cuenta saltos.
- **OSPF** son las siglas de *Open Shortest Path First*, "primero el camino más corto, y abierto". Es el protocolo de estado de enlace más usado del mundo en redes internas.

Y las dos filosofías, que son las dos columnas del dibujo:

- **"Aprendo por rumores" (vector de distancia).** Cada router le pregunta a sus vecinos "¿vos por dónde llegás a tal red y a qué costo?", y les cree. No ve el mapa: ve lo que le cuentan. Es como preguntar el camino en la calle: si el primero te dice "dos cuadras y a la derecha", vos lo repetís, sin saber si él lo sabe de verdad.
- **"Todos tienen el mapa" (estado de enlace).** Cada router publica su pedacito de red y todos arman la misma maqueta completa; después cada uno calcula su propio camino sobre esa maqueta. Es como tener el plano de la ciudad: no dependés de rumores, pero pagás el costo de guardar el plano entero y de recalcularlo cuando cambia algo.

Y ahí quedó prometido un intruso: **"EIGRP: un híbrido (vector de distancia con inteligencia extra: guarda más estado, calcula rutas backup antes de que fallen)".** Este manual es la promesa cumplida.

**EIGRP** (*Enhanced Interior Gateway Routing Protocol*) es la respuesta de Cisco a los problemas del DV: aprendé por vecinos (como RIP), pero:

- Guardá **más estado** que un DV puro: una tabla de topología con TODOS los caminos conocidos, no solo el mejor.
- **Calculá la ruta de respaldo ANTES de que falle** la principal (¡esa es la magia de DUAL!).
- Propaga solo **cambios** (no tablas enteras cada 30 s) — conducta de link-state, sin el mapa completo.
- Elegí rutas con una **métrica de varios factores** (ancho de banda + delay), no un contador de saltos.

> **Analogía:** RIP es el repartidor que toma la ruta que le dijeron y, si se corta la calle, llama a la central y espera (y mientras, pierde paquetes). OSPF es el repartidor con GPS y mapa de toda la ciudad. EIGRP es el repartidor con GPS QUE YA MARCÓ LA RUTA ALTERNATIVA EN EL MAPA: si se corta la principal, tira del plan B al instante, sin llamar a nadie.

**Regla de oro empresarial:** EIGRP es **propietario de Cisco** — funciona de maravilla en redes 100% Cisco, y NO es interoperable con otros fabricantes. OSPF y IS-IS son abiertos (RFC). En un parque mixto, EIGRP no escala de diseño; en un parque Cisco puro, es veloz y simple.

Las cuatro viñetas de arriba son el programa del manual entero, así que vale la pena leerlas como lo que son: cuatro préstamos. Dos de la familia del vector de distancia y dos de la familia del estado de enlace. Vamos uno por uno, porque acá está la respuesta a la pregunta que más se hace sobre EIGRP.

### 1.1. El problema que EIGRP vino a resolver

Imaginate una red de veinte routers. Un cable se corta a las tres de la mañana. Con RIP, cada router tiene que enterarse, esperar a que el rumor viaje, y mientras tanto puede quedar dando vueltas un paquete en un bucle: el router A cree que la salida es por B, B cree que es por A, y el paquete rebota hasta que se le vence el tiempo de vida. Ese es el problema clásico del vector de distancia: **converge lento y, mientras converge, puede dar vueltas**.

Con OSPF eso no pasa (el mapa completo no permite bucles), pero pagás otro precio: el router guarda el plano entero y, ante cada cambio, recalcula el árbol completo de caminos.

EIGRP intenta quedarse con lo bueno de los dos: la economía de conversación del vector de distancia (hablar solo con los vecinos, sin plano compartido) y la velocidad y la ausencia de bucles del estado de enlace. La forma de lograrlo no es magia: es guardar un poco más de información y hacer una cuenta de más **antes** de que ocurra la falla.

### 1.2. Qué toma del vector de distancia

Tres cosas, y son las que definen la personalidad del protocolo:

1. **Aprende de boca de los vecinos.** El router no arma un mapa: pregunta y le cree al vecino. Igual que RIP.
2. **Habla solo con los que están a un cable.** No hay un router "jefe" ni una inundación de información a toda la red: el intercambio es de vecino a vecino, salto por salto.
3. **Trabaja con distancias, no con topología.** Lo que guarda es "por acá llego en tanto". Nunca guarda "el enlace entre X e Y cuesta tanto". Esa es la diferencia de fondo con OSPF, y es la razón por la que los autores serios discuten el adjetivo "híbrido".

### 1.3. Qué toma del estado de enlace

1. **Propaga solo cambios, no tablas enteras.** RIP manda su tabla completa cada 30 segundos, funcione o no haya novedades. EIGRP manda un mensaje únicamente cuando algo cambió, y ese mensaje se acusa recibo. Menos charla, menos CPU, menos riesgo de que un cambio se pierda.
2. **Guarda caminos alternativos ya evaluados.** Es el préstamo grande: la tabla de topología guarda todos los caminos conocidos hacia cada destino, con su estado, y no solo el ganador. Eso es "más estado", y es lo que le permite tener el plan B listo.

Y el matiz que hay que decir, porque es el que separa al que repite del que entiende: **EIGRP no construye un mapa ni corre el algoritmo de Dijkstra**. Guarda rutas y distancias, no enlaces. Por eso un sector de la bibliografía prefiere llamarlo "vector de distancia con cómputo difuso" antes que "híbrido". El motor que evita bucles no es un mapa: es una condición matemática (capítulo 4).

### 1.4. Por qué se lo llamó "advanced distance vector"

Cuando Cisco publicó EIGRP, a comienzos de los noventa, lo presentó como el sucesor de su protocolo anterior, IGRP (*Interior Gateway Routing Protocol*). Y le puso un nombre de marketing: **advanced distance vector**, "vector de distancia avanzado". La etiqueta tenía sentido comercial: era un vector de distancia, sí, pero con tres agregados que ningún otro vector de distancia tenía —estado de caminos alternativos, actualizaciones incrementales y una métrica compuesta—.

Con los años, "híbrido" se volvió el nombre de manual y de examen, y "advanced distance vector" quedó como el nombre histórico. Los dos apuntan a lo mismo: **un protocolo que se comunica como un vector de distancia y se comporta, en velocidad de convergencia, como un estado de enlace**.

> **Aviso de corrección (una línea):** cuando leas que EIGRP "es un híbrido mitad DV mitad LS", tomalo como una descripción de su comportamiento, no de su arquitectura. No hay mapa compartido ni SPF en EIGRP: hay distancias, vecinos y una condición de factibilidad. El híbrido es de resultados, no de mecanismo.

### 1.5. La consecuencia práctica: es de Cisco

De las cuatro viñetas del principio, la cuarta es la que decide proyectos: **EIGRP es propietario**. Durante veinte años fue cerrado; en 2016 se publicó como información pública en la **RFC 7868** (*Request for Comments* 7868, el documento donde IETF describe el protocolo; **IETF** son las siglas de *Internet Engineering Task Force*, la organización que publica los estándares de Internet). Eso no lo convirtió en un estándar interoperable: en la práctica, los routers de otros fabricantes no lo implementan o lo implementan de forma parcial.

Traducción para tu vida laboral: si la red es 100% Cisco, EIGRP es una opción excelente y barata de operar. Si hay un solo equipo de otro fabricante en el medio, o si el cliente quiere libertad de proveedor, el camino es OSPF. No es una discusión de gustos: es una restricción de diseño.

### Resumen

- EIGRP es un protocolo dinámico de Cisco que aprende de sus vecinos, como RIP, pero guarda más estado.
- Del vector de distancia toma la conversación de vecino a vecino y el trabajo con distancias, no con mapas.
- Del estado de enlace toma las actualizaciones incrementales con acuse de recibo y los caminos alternativos ya evaluados.
- "Advanced distance vector" fue su nombre comercial, y "híbrido" quedó como apodo: describe el resultado, no el mecanismo.
- Es propietario de Cisco: en redes mixtas no es una opción, y eso decide el diseño antes que cualquier detalle técnico.

---

## 2. La ficha técnica: lo que hay que saber de entrada

Antes de tocar un comando, el retrato hablado:

| Característica | Valor |
|----------------|-------|
| Familia | **Híbrido** (DV con características de LS) |
| Algoritmo | **DUAL** (Diffusing Update Algorithm) |
| AD | **90** (interno) / **170** (externo, redistribuido) |
| Métrica | **Ancho de banda + delay** (por defecto) |
| Transporte | **IP protocol 88** (ni TCP ni UDP) |
| Multicast | **224.0.0.10** (vecinos EIGRP) |
| Hello / Hold | **5 s / 15 s** (por defecto; se adapta en WAN lentas) |
| Actualizaciones | **Solo cambios** (incrementales), con acuse (RTP) |
| Escala | Mayor que RIP, menor que OSPF multi-área (límite práctico de saltos alto pero no infinito) |
| Estándar | **Propietario Cisco** (info pública desde RFC 7868, pero no interoperable igual) |

Esta tabla es la ficha del protocolo: once datos que sirven para reconocerlo en un examen o en una mesa de trabajo. La primera columna nombra la **característica** y la segunda da su **valor**. Casi todos estos datos reaparecen más adelante en el manual, así que conviene leerla dos veces.

Fila por fila:

- **Familia: híbrido.** Es la etiqueta del capítulo 1. Comportamiento de estado de enlace, conversación de vector de distancia.
- **Algoritmo: DUAL.** **DUAL** son las siglas de *Diffusing Update Algorithm*, "algoritmo de actualización difusa". Es el motor de decisión de EIGRP: el que elige el mejor camino, el que tiene preparado el alternativo y el que decide cuándo hay que preguntar a los vecinos. Es el capítulo 3.
- **AD: 90 (interno) / 170 (externo).** **AD** es la *Administrative Distance*, "distancia administrativa": un número que expresa cuánto confía el router en la **fuente** de una ruta. Menor es más confiable. EIGRP interno tiene 90, y las rutas que EIGRP aprendió de otro protocolo y redistribuyó tienen 170. OSPF tiene 110 y RIP tiene 120, así que EIGRP les gana a los dos cuando todos conocen la misma red.
- **Métrica: ancho de banda + delay.** El ancho de banda es la capacidad del enlace (cuántos bits por segundo entran); el **delay** es el retardo, el tiempo que el paquete tarda en atravesarlo. Se combinan en una fórmula y no en un contador de saltos. Capítulo 5.
- **Transporte: IP protocol 88.** EIGRP no usa **TCP** (*Transmission Control Protocol*) ni **UDP** (*User Datagram Protocol*), los dos protocolos de transporte que seguramente viste: habla directo sobre **IP** (*Internet Protocol*, el protocolo que mueve los paquetes de una red a otra), y se identifica con el número 88 en el campo de protocolo del paquete. OSPF usa el 89. Ojo con la diferencia: TCP y UDP usan **puertos** (80, 443, 520); el "protocolo IP" es un campo aparte, que dice qué hay adentro del paquete. Esto importa en las listas de control de acceso (ACL), porque para bloquear EIGRP no alcanza con bloquear un puerto.
- **Multicast: 224.0.0.10.** **Multicast** es el envío a un grupo de destinatarios con una sola dirección: un mensaje que llega a todos los anotados en la lista. La 224.0.0.10 es la lista "todos los routers EIGRP de este segmento": ahí van los saludos y las actualizaciones. Comparala con OSPF, que usa la 224.0.0.5.
- **Hello / Hold: 5 s / 15 s.** El **Hello** es el saludo periódico con el que se descubren y se mantienen los vecinos; el **Hold** es el cronómetro que dice "si no me saludás en este tiempo, te declaro muerto". Capítulo 6.
- **Actualizaciones: solo cambios, con acuse.** Cuando algo cambia, EIGRP manda solo la novedad y espera confirmación. No repite la tabla entera cada 30 segundos como RIP.
- **Escala: mayor que RIP, menor que OSPF multi-área.** EIGRP escala mucho mejor que un contador de saltos de 15, pero no tiene el mecanismo de áreas de OSPF para redes gigantes. El límite práctico de saltos es alto (por defecto, 100 saltos) pero no infinito.
- **Estándar: propietario.** Es el dato del capítulo 1.5, y es el que decide si el protocolo entra o no en un proyecto.

Dos datos que definen el diseño:

- **AD 90 < OSPF 110**: si un router aprende la misma ruta por EIGRP y por OSPF, gana EIGRP. Esto importa en redes de transición (tema de redistribución).
- **Protocolo 88 + multicast 224.0.0.10**: EIGRP habla directo por IP (como OSPF usa el 89) y los vecinos se buscan en el grupo 224.0.0.10.

> **El dato que separa a los que entienden:** EIGRP usa **RTP** (*Reliable Transport Protocol*). No es el RTP de video: es "transporte confiable" propio — cada actualización se acusa recibo (ACK). Por eso puede mandar solo cambios: si un cambio se pierde, el vecino lo pide de nuevo. El "rumor" de EIGRP no se pierde en el aire.

Un **ACK** es un acuse de recibo: un mensajito corto que dice "recibí tu mensaje". Es la razón por la cual EIGRP puede permitirse el lujo de no repetir todo cada medio minuto: si el mensaje no se confirma, se reenvía. La confiabilidad no viene de TCP, viene de este mecanismo propio montado sobre IP.

### 2.1. Lo que esta ficha no te dice

La tabla cuenta qué es EIGRP, pero no cuenta lo que más se pregunta en un examen: **cuándo una ruta pasa a estado activo**, **qué es un feasible successor** y **por qué el AD importa cuando conviven dos protocolos**. Esos tres temas son los capítulos 3, 4 y 12. La ficha es la puerta de entrada, no el manual.

Y un detalle de lectura que ahorra confusión: en la ficha conviven tres números que se parecen y no tienen nada que ver entre sí. El **88** es el número de protocolo IP (a qué programa pertenece el paquete). El **90** es la distancia administrativa (cuánto confía el router en la fuente). El **100** de "límite de saltos" es la cantidad máxima de routers que un anuncio puede atravesar. Tres números, tres escalas distintas.

### Resumen

- La ficha resume once datos: familia híbrida, DUAL, AD 90/170, métrica de ancho de banda y delay.
- EIGRP habla por IP protocolo 88, usa el multicast 224.0.0.10 y saluda cada 5 segundos con Hold de 15.
- Usa RTP, un transporte confiable propio que acusa recibo, y por eso puede mandar solo cambios.
- AD 90 le gana a OSPF (110) y a RIP (120) cuando los tres conocen la misma red.
- Es propietario de Cisco: la ficha termina con la misma advertencia con la que empieza el manual.

---

## 3. El corazón: el algoritmo DUAL

### 3.1. La pregunta que resuelve

Todo protocolo de enrutamiento responde: *¿cuál es el mejor camino?* DUAL agrega la pregunta que nadie más se hace antes: **¿y si ese camino se cae, cuál es el plan B?** — y la responde ANTES de que el plan A falle.

> **Analogía:** DUAL es el conductor que, cuando va por la autopista, ya tiene en la cabeza la ruta alternativa por si la autopista se corta. Cuando el cartel dice "desvío", él YA SABE a dónde gira. Los demás protocolos recién empiezan a calcular ahí.

Pensalo así: RIP y OSPF son reactivos. Esperan a que la red cambie para ponerse a trabajar. DUAL es previsor: hace el trabajo cuando la red está tranquila, para tener la respuesta escrita cuando llegue el momento feo. Es la diferencia entre el bombero que corre a buscar el plano cuando ve el humo y el que ya lo tiene pegado en la pared.

Ese cambio de momento (calcular antes, no después) es todo el secreto de la velocidad de convergencia de EIGRP. Y explica por qué EIGRP guarda más estado que RIP: la respuesta escrita ocupa lugar.

### 3.2. Los dos estados (la fase del examen)

Todo camino en la tabla de topología EIGRP está en UNO de estos estados:

| Estado | Qué significa | Cuándo pasa |
|--------|---------------|-------------|
| **Passive** | El camino es estable y está calculado (feliz) | El 99,9% del tiempo |
| **Active** | El camino sufrió un cambio y el router está **buscando** un reemplazo (preguntando a vecinos) | Cuando el plan B tampoco sirve y no hay backup local |

Esta tabla tiene tres columnas: el **estado**, **qué significa** en palabras y **cuándo** se llega a él. Y ojo con la trampa de vocabulario más grande de EIGRP: acá "passive" y "active" no significan lo que significan en la vida diaria ni lo que significan en OSPF.

Fila por fila:

- **Passive: el camino está estable y calculado.** "Pasivo" suena a apagado, a inactivo, a problema. Es exactamente lo contrario: **pasivo es el estado bueno**. Significa que el router ya sabe qué hacer, que el camino está resuelto y que no hay ninguna consulta pendiente. Es el estado en el que una red sana pasa el 99,9% del tiempo.
- **Active: el router está buscando un reemplazo.** "Activo" suena a saludable. Es lo contrario: **activo es el estado de emergencia**. Significa que el camino se cayó, que el plan B no existía o no servía, y que el router salió a preguntarles a los vecinos si alguno sabe otro camino.

> **La frase que examinan: "¿cuándo una ruta pasa a estado ACTIVE?" → cuando pierde el successor (plan A) y **no hay feasible successor** (plan B) local.** Recién ahí EIGRP difunde la consulta a los vecinos. Si un camino queda clavado en "Active" mucho tiempo, es síntoma de red mal diseñada (o de un problema de convergencia).

Traducido a la vida diaria: estar en Passive es tener nafta y mapa. Estar en Active es estar en la banquina llamando a la grúa. Y la noticia buena del protocolo es que, gracias al capítulo 4, **la mayoría de las caídas no llevan a Active**: hay plan B, se cambia de camino y el estado sigue en Passive. La red ni se entera.

Una última precisión: el estado es **por destino**, no por router. Un router puede tener una ruta en Passive (todo bien con esa red) y otra en Active (se le cayó el camino y está preguntando) al mismo tiempo. Por eso se dice "la ruta está en Active", nunca "el router está en Active".

### 3.3. La garantía de DUAL: cero bucles

DUAL aplica la **suficiencia de difusión**: solo difunde la consulta cuando es necesario, y el criterio del Feasible Successor (sección 4) garantiza matemáticamente **caminos sin bucles a nivel de diseño** (a diferencia de los loop-prevention "parches" de RIP: split horizon, poisoning, etc. — que EIGRP supera con el criterio DUAL).

> **La comparación que cierra el punto:** RIP evita bucles con reglas (split horizon, hold-down). OSPF evita bucles con el mapa completo. EIGRP evita bucles con **matemática de DUAL**: el Feasible Successor garantiza que el backup es más corto que el principal, y por lo tanto no puede pasar por el router que lo está anunciando. Es la tercera vía, elegante y barata.

Las tres reglas de RIP que aparecen ahí, en una línea cada una, porque son la referencia de comparación:

- **Split horizon** ("horizonte dividido"): la regla de no anunciarle a un vecino, por la interfaz por la que aprendiste algo, ese mismo algo. Evita el bucle de dos routers que se pasan la pelota.
- **Poisoning** ("envenenamiento de ruta"): anunciar una red con métrica infinita para decir "por acá no vayas", en lugar de simplemente borrarla.
- **Hold-down**: dejar una ruta congelada un tiempo después de que se cae, para no creerle al primer rumor que llegue.

Las tres son parches: funcionan en la mayoría de los casos, pero no son una demostración. La condición de factibilidad de EIGRP sí lo es, y esa es la diferencia de categoría entre un protocolo viejo y uno pensado con paper académico atrás.

> **Aviso de corrección (una línea):** el original llama "suficiencia de difusión" a lo que en la bibliografía se llama **cómputo difuso** (*diffusing computation*): la consulta que se difunde a los vecinos cuando no hay respuesta local. "Suficiencia" es una traducción desafortunada; el concepto es el mismo y es el que hace que EIGRP pregunte solo cuando de verdad hace falta.

### 3.4. Qué significa "cómputo difuso", en criollo

Cuando no hay plan B, el router tiene que preguntar. Pero no pregunta a cualquiera: le pregunta a sus vecinos, y los vecinos que tampoco saben les preguntan a los suyos, y así la consulta se expande como una mancha. Cuando alguna rama de la consulta encuentra un camino, la respuesta vuelve por donde vino y el router elige. A eso se lo llama **cómputo difuso**.

La palabra "difuso" acá no quiere decir "poco claro": quiere decir "que se difunde", que se esparce. Y la gracia del diseño es que la difusión es **la excepción, no la regla**: en una red sana casi nunca ocurre, porque casi siempre hay un feasible successor esperando. Compará con OSPF, donde cada cambio de enlace provoca una inundación de información a toda el área. EIGRP inunda solo cuando el plan B no alcanzó.

### Resumen

- DUAL responde dos preguntas: cuál es el mejor camino y cuál es el reemplazo si el mejor se cae.
- Toda ruta está en Passive (resuelta, es el estado bueno) o en Active (buscando reemplazo, es la emergencia).
- Una ruta pasa a Active solo cuando pierde el successor y no tiene feasible successor local.
- La ausencia de bucles no la garantiza un parche de RIP, la garantiza la condición de factibilidad del capítulo 4.
- "Cómputo difuso" es la consulta que se esparce a los vecinos cuando no hay respuesta local, y es la excepción.

---

## 4. Successor y Feasible Successor: el plan A y el plan B

### 4.1. Los tres números que hay que saber

Para cada destino, EIGRP maneja:

```text
FD  (Feasible Distance) = la métrica TOTAL del MEJOR camino (la que va a la tabla de rutas)
RD  (Reported Distance) = la métrica que el VECINO dice que tiene hacia ese destino
                          (lo que el vecino REPORTÓ, su propio FD)
AD ya usado = Administrative Distance (90/170) — OJO: no confundir AD (tabla de rutas)
             con RD (reportado por el vecino). Iniciales parecidas, conceptos distintos.
```

Este bloque define los tres números con los que trabaja EIGRP, y está escrito en el formato de siempre: la sigla a la izquierda, la definición a la derecha. Es el bloque más importante del manual, porque con estos tres números se decide todo lo demás.

Leyenda por leyenda:

- **FD (Feasible Distance).** La *distancia factible*: la métrica total del mejor camino, contada desde mí hasta el destino, incluyendo el costo del primer enlace. Es el número que va a la tabla de rutas y el que define quién es el **successor** (el plan A).
- **RD (Reported Distance).** La *distancia reportada*: lo que el vecino me dice que le cuesta llegar a ese destino desde su casa. No incluye el enlace entre los dos. Es un dato que yo no puedo verificar: me lo cuenta el vecino, y en eso EIGRP sigue siendo un protocolo de rumor.
- **AD (Administrative Distance).** La *distancia administrativa*: el 90 o el 170 de la ficha, que dice cuánto confía el router en la fuente de la ruta. **No tiene nada que ver con las otras dos.** Es el número que aparece entre corchetes en `show ip route`, y sirve para comparar protocolos distintos, no caminos del mismo protocolo.

> **La trampa de las iniciales:** AD, RD y FD suenan igual y no se parecen en nada. AD compara *protocolos* (EIGRP contra OSPF). FD es *mi* distancia hacia el destino. RD es la distancia *del vecino* hacia el destino. Si en un examen te mezclan los tres en la misma frase, leé despacio: es la pregunta favorita de los que quieren hacerte caer.

Una forma de fijarlo con una imagen: FD es lo que tardás vos en llegar a la oficina. RD es lo que tarda tu compañero de la otra oficina en llegar a la misma dirección. AD es cuánto le creés al que te pasó el dato. Tres números, tres preguntas distintas.

### 4.2. La condición del Feasible Successor (la fórmula estrella)

```text
Un vecino SERÁ Feasible Successor (plan B) si:
        RD del vecino  <  FD propio

Es decir: el camino que el vecino dice tener hacia el destino,
tiene que ser MÁS CORTO que el mejor camino que yo ya tengo.
```

Este bloque es una condición, no una fórmula: se lee como un requisito de admisión. Arriba está la regla en símbolos y abajo la misma regla en castellano. Todo EIGRP gira alrededor de estas dos líneas.

Se lee así: "un vecino será viable como plan B si su distancia reportada es menor que mi distancia factible". Palabra por palabra:

- **"Será Feasible Successor"** quiere decir que queda habilitado como reemplazo.
- **"RD del vecino"** es lo que el vecino dice que le cuesta llegar al destino (sin contar el cable que lo une a mí).
- **"FD propio"** es lo que me cuesta a mí llegar por el mejor camino que tengo.
- **"<"** es la parte no negociable: tiene que ser **estrictamente menor**. Si da igual, el vecino no entra como plan B.

> **Analicemos por qué esta condición es genial (la parte que nadie explica):** si el vecino dice "yo llego a la red X con métrica 10" y mi mejor camino tiene métrica 20, entonces **el camino del vecino NO puede pasar por mí** — porque si pasara por mí, su métrica sería mayor que la mía (20 + algo > 10... imposible). Como su camino no pasa por mí, no hay bucle. **La condición garantiza que el plan B es seguro SIN calcular nada más.** Esa es la matemática que reemplaza al split horizon.

Vale la pena hacer la cuenta completa, porque es la que hace clic. Si el camino del vecino pasara por mí, entonces su distancia al destino sería: mi distancia al destino (20) más el costo del cable entre los dos (que nunca es cero). O sea: 20 + algo. Pero el vecino **declaró** 10. Como 20 + algo nunca va a ser 10, la hipótesis se cae: su camino no pasa por mí. Y si su camino no pasa por mí, aunque yo me caiga, él sigue llegando. No hay forma de que los paquetes empiecen a dar vueltas entre los dos.

Fijate qué elegante es: no hace falta recorrer el camino ni preguntar a nadie. Con un número que el vecino ya me dijo y un número que ya tengo calculado, sé que el reemplazo es seguro. **El bucle se descarta con una comparación de dos números.** Eso es lo que ninguna regla de RIP logra, y es la razón por la que EIGRP converge en milisegundos sin riesgo de bucle.

La otra cara de la moneda: si el vecino declara una distancia **mayor** o igual que la mía, el plan B queda descartado aunque su camino total parezca bueno. No es que EIGRP desconfíe de su amigo: es que no puede probar que su camino no pasa por acá, y sin prueba no hay reemplazo.

### 4.3. El ejemplo completo

Topología (cada enlace con su costo):

```text
        R1 ──── (costo 20) ──── R2
         │                      │
     (costo 40)            (costo 10)
         │                      │
        R3 ──── (costo 10) ──── R4 destina a la red 10.0.0.0/8
```

Este bloque es el dibujo de la red del ejemplo, hecho con caracteres de texto. Se lee como un plano: los nombres (R1, R2, R3, R4) son los routers, las líneas son los enlaces, y cada costo entre paréntesis es lo que cuesta atravesar ese enlace con la métrica de EIGRP.

Detalle por detalle:

- **R1 es el router que aprende.** Todos los números del ejemplo se calculan desde su punto de vista.
- **R1 — R2 cuesta 20** y **R1 — R3 cuesta 40**: R1 tiene dos puertas de salida, y la de R2 es el doble de barata.
- **R2 — R4 cuesta 10** y **R3 — R4 cuesta 10**: los dos caminos terminan en el mismo router, R4.
- **R4 destina a la red 10.0.0.0/8**: R4 es el router que está pegado a la red de destino. La red destino es `10.0.0.0/8`, una red grande (dieciséis millones de direcciones).

El destino de todo el ejercicio es esa red: R1 quiere saber cómo llegar a `10.0.0.0/8` y no está conectado a ella.

R1 aprende la red 10.0.0.0/8:

```text
Via R2: costo total = 20 + 10 = 30  → FD = 30 (el mejor) → SUCCESSOR (R2)
         R2 reportó RD = 10 (su propio costo)   → ¿10 < 30? SÍ → R2 también da Feasible? no: R2 ES el successor

Via R3: costo total = 40 + 10 + 10 = 60  → candidato
         R3 reportó RD = 20 (R3→R4=10 + R4→red=10)
         ¿RD de R3 (20) < FD propio (30)? SÍ → R3 = FEASIBLE SUCCESSOR (plan B, listo)
```

Este bloque hace la cuenta de las dos opciones de R1, una debajo de la otra, y en cada una anota: el costo total, qué papel juega ese vecino (successor o feasible successor) y la comparación que lo decide. Se lee de arriba hacia abajo, como una resolución de ejercicio en el pizarrón.

Línea por línea:

- **`Via R2: costo total = 20 + 10 = 30`**: el camino por R2 cuesta 20 (el enlace R1–R2) más 10 (lo que R2 declara hasta la red). Total 30.
- **`→ FD = 30 (el mejor) → SUCCESSOR (R2)`**: como es el mejor, ese 30 pasa a ser el **FD** de R1 para esa red, y R2 se gana el título de **successor**: es el vecino por el que sale el tráfico.
- **`R2 reportó RD = 10 (su propio costo) → ¿10 < 30? SÍ → R2 también da Feasible? no: R2 ES el successor`**: acá el bloque se hace una pregunta y se la contesta solo, para aclarar una confusión típica. La condición de factibilidad se aplica a los **candidatos a reemplazo**, no al que ya ganó. Preguntarse si el successor es feasible successor no tiene sentido: ya es el camino elegido.
- **`Via R3: costo total = 40 + 10 + 10 = 60 → candidato`**: el camino por R3 cuesta 40 (R1–R3) más 10 (R3–R4) más 10 (R4–red). Total 60. Es peor que el de R2, así que no gana: queda como **candidato**.
- **`R3 reportó RD = 20 (R3→R4=10 + R4→red=10)`**: lo que R3 le cuenta a R1 es su propia distancia al destino: 20. Ese es el número que se va a comparar. Fijate que **no incluye** el enlace R1–R3: eso lo agrega R1 para el total.
- **`¿RD de R3 (20) < FD propio (30)? SÍ → R3 = FEASIBLE SUCCESSOR (plan B, listo)`**: la condición del capítulo 4.2, aplicada. 20 es menor que 30, así que R3 queda habilitado como plan B.

"Vía R4 directo" no existe (no hay enlace R1-R4): el ejemplo queda así. R1 tiene plan A (R2) y plan B (R3) **ya calculados**. Si R2 se cae → **DUAL no difunde nada**: reemplaza el successor por R3 al instante y listo. Convergencia en microsegundos, sin tráfico de consulta.

> **HACELO VOS:** aprendé la condición de memoria, con su lógica: "RD < FD". En el examen, te la preguntan con números: te dan FD=30, y vecinos con RD 10, 25, 35... → los que tienen RD < 30 son Feasible Successors. Los que no, NO (aunque su camino total sea mejor, sin la condición no se puede garantizar ausencia de bucle a costo cero).

### 4.4. La cuenta, hecha despacio y sin trampa

Acá va una advertencia honesta, porque el ejemplo de arriba tiene números que no cierran entre sí y conviene que lo sepas antes de que te confunda en un examen.

El dibujo dice que R2–R4 cuesta 10 y R3–R4 cuesta 10. Para que el total de 60 del bloque cierre, hay que leer que **R4 llega a la red con costo 10**. Con esa lectura, la cuenta correcta es:

| Camino | Cuenta | Total |
|--------|-------|-------|
| R1 → R2 → R4 → red | 20 + 10 + 10 | **40** |
| R1 → R3 → R4 → red | 40 + 10 + 10 | **60** |

Entonces el FD de R1 es **40** (no 30), lo que reporta R2 es **20** (no 10), y lo que reporta R3 sigue siendo **20** (eso sí cierra). La conclusión del ejemplo no cambia ni un poco: 20 < 40, así que R3 es feasible successor y R1 tiene plan B.

> **Aviso de corrección (una línea):** el bloque del capítulo 4.3 escribe `costo total = 20 + 10 = 30` y `R2 reportó RD = 10`; con los costos del dibujo esos dos números deberían ser 40 y 20. El resto del ejemplo —y sobre todo la lógica de la condición— está bien, y el resultado (R2 successor, R3 feasible successor) es el mismo.

Por qué importa el detalle: si en un examen te dan un dibujo y una tabla de números, **siempre recalculá desde el dibujo** y no confíes en los totales que vienen escritos. Los ejercicios de feasible successor se arman justamente para ver si sumás o si copiás.

Y una regla de tres que sirve para todos los ejercicios de este tema:

1. Sumá el costo desde vos hasta el destino **por cada vecino**. El más chico es el FD.
2. Anotá lo que **declara cada vecino** (RD), que es su distancia sin el cable que lo une a vos.
3. Compará: todo vecino con RD < FD queda como feasible successor. Todo vecino con RD ≥ FD queda descartado como plan B, por más lindo que sea su camino total.

### Resumen

- FD es mi distancia al destino por el mejor camino; RD es la distancia que declara el vecino; AD es cuánto confío en el protocolo que me trajo la ruta.
- Un vecino es feasible successor solo si su RD es estrictamente menor que mi FD.
- Esa condición prueba que el camino del vecino no pasa por mí, y por eso el plan B es seguro sin calcular nada más.
- Con plan B disponible, la caída del plan A no genera consultas: se cambia de camino y la red ni se entera.
- Siempre recalculá los totales desde el dibujo del ejercicio, porque los números escritos pueden no cerrar.

---

## 5. La métrica: ya no es un simple contador

### 5.1. La fórmula (la versión "por defecto" que usás siempre)

La fórmula completa de EIGRP tiene 5 componentes (con los pesos K1-K5). Por defecto, solo importan **dos**:

```text
métrica = 256 × (10^7 / ancho de banda mínimo del camino  +  delay total / 10)

Ese "ancho de banda mínimo" = el enlace MÁS LENTO del recorrido (cuello de botella)
Ese "delay total" = suma de los delays de TODOS los enlaces del recorrido
```

Este bloque es la fórmula de la métrica por defecto, y viene con las dos definiciones que hacen falta para usarla. La primera línea es la cuenta; las dos de abajo explican de dónde sale cada término.

Parte por parte:

- **`métrica`**: el número final, el que se compara para decidir qué camino es mejor. Cuanto más chico, mejor.
- **`256 ×`**: un factor de escala. EIGRP multiplica todo por 256 para tener precisión entera y para mantener compatibilidad con su antecesor, IGRP. No cambia las comparaciones: si un camino es mejor antes de multiplicar, lo sigue siendo después.
- **`10^7 / ancho de banda mínimo`**: el término de **ancho de banda**. `10^7` son diez millones; el ancho de banda se mide en kilobits por segundo (kbps). Un enlace de 100 Mbps son 100.000 kbps, y 10.000.000 / 100.000 = 100. Fijate que la cuenta es **inversa**: más ancho de banda da un número más chico, y por lo tanto una métrica mejor.
- **"ancho de banda mínimo del camino"**: el **cuello de botella**. Si el camino tiene un enlace de 10 Gbps y uno de 100 Mbps, manda el de 100 Mbps: el camino entero no puede ir más rápido que su tramo más lento. Los enlaces rápidos no mejoran el término de ancho de banda, aunque sí aportan delay.
- **`delay total / 10`**: el término de **retardo**. El delay se mide en microsegundos (µs) y se **suma** en todos los enlaces del recorrido. Se divide por 10 porque EIGRP cuenta el delay en decenas de microsegundos.
- **`delay total`**: a diferencia del ancho de banda, acá **sí se suman todos los tramos**. Cada salto agrega su retardo, y el camino con más saltos paga más. Por eso el delay es lo que desempata entre dos caminos que tienen el mismo cuello de botella: el más corto gana.

Fijate la inteligencia: **mide lo ancho (BW) y lo lento del recorrido (delay)** — dos factores con significado físico, no un contador. La métrica de EIGRP es más "de verdad" que el hop count de RIP, aunque menos fina que el costo OSPF (que considera solo BW).

Esa última frase merece una aclaración, porque está al revés: **el costo de OSPF mira un solo factor (el ancho de banda invertido) y la métrica de EIGRP mira dos (ancho de banda y delay)**. En cantidad de información, EIGRP es la más rica de las dos. Lo que sí tiene OSPF es una ventaja distinta: el costo se puede tocar a mano por interfaz (`ip ospf cost`) y se recalibra con la referencia de ancho de banda, así que el administrador tiene un control más directo y más fácil de explicar. "Más fina", entonces, quiere decir "más controlable", no "con más factores".

> **Aviso de corrección (una línea):** donde el original dice que la métrica de EIGRP es "menos fina" que el costo OSPF, la versión correcta es que EIGRP combina dos factores y OSPF uno solo; la ventaja de OSPF es el control manual del costo, no la cantidad de información.

### 5.2. Los K-values: la palanca avanzada

```text
metric weights  K1  K2  K3  K4  K5
              (BW)(Load)(Delay)(Reliability)(MTU)

Por defecto: K1=1, K3=1, los demás 0 → solo BW y Delay.

⚠️ REGLA DE ORO: los K-values deben ser IGUALES en TODOS los routers
   del dominio EIGRP. Si R1 tiene K1=1 y R2 tiene K1=0 → no forman vecindad.
   (Como los timers en OSPF: EIGRP no negocia los K.)
```

Este bloque muestra el comando `metric weights` y los cinco pesos que acepta: cada **K** es un número que dice cuánto pesa un factor en la cuenta final. Arriba está el comando con los cinco valores; abajo, la lista de qué factor es cada uno, los valores por defecto y la advertencia que hay que memorizar.

Parte por parte:

- **`metric weights`**: el comando que se escribe dentro del proceso EIGRP para cambiar los pesos de la métrica.
- **`K1` (ancho de banda)**: cuánto pesa el ancho de banda en la cuenta. Por defecto vale 1, o sea que el término del cuello de botella siempre se cuenta.
- **`K2` (carga)**: cuánto pesa la **carga** del enlace, es decir qué tan ocupado está en este momento. Por defecto vale 0: EIGRP **no** mira la carga.
- **`K3` (delay)**: cuánto pesa el retardo. Por defecto vale 1: el delay siempre se cuenta.
- **`K4` (confiabilidad)**: cuánto pesa la confiabilidad del enlace (la tasa de errores). Por defecto 0.
- **`K5` (MTU)**: un peso asociado a la **MTU** (*Maximum Transmission Unit*, el tamaño máximo de paquete que la interfaz puede llevar). Por defecto 0.

O sea que la fórmula del capítulo 5.1 —solo ancho de banda y delay— es la fórmula con K1=1, K3=1 y el resto en cero. Si alguien pone K2=1, la cuenta empieza a mirar la carga; si toca K4 y K5, también la confiabilidad y la MTU.

Ahora la parte importante, la que está en mayúsculas en el bloque: **los K-values no se negocian**. Viajan dentro del saludo de EIGRP (capítulo 6), y si los dos routers no tienen exactamente los mismos, no se reconocen como vecinos. No hay error, no hay mensaje: simplemente nunca aparecen en la lista de vecinos. Es la falla número tres del capítulo 13, y es de las más difíciles de ver, porque la configuración parece perfecta y la red no anda.

> **Analogía:** la métrica de EIGRP es la nota de un viaje: cuenta la velocidad de la autopista más lenta (BW mínimo) y los peajes/tiempo de cada tramo (delay). Los K-values son "cuánto pesa cada factor en la nota" — y solo sirven si TODOS pesan igual en todas las escuelas.

En la práctica de la vida real: **no toques los K-values**. El valor por defecto funciona, y cambiarlos obliga a cambiar todos los routers del dominio a la vez, con el riesgo de dejar la mitad de la red sin vecinos. Están en el manual porque se preguntan en el examen y porque explican de dónde sale la fórmula, no porque sean una buena idea.

### 5.3. La métrica con números reales

Acá está la parte que ningún manual te hace: calcular a mano el número que después ves en `show ip route`. Usemos tres enlaces de un camino y los valores por defecto de IOS para cada tipo de interfaz.

Los datos de partida:

| Enlace | Tipo | Ancho de banda | Delay de la interfaz |
|--------|------|----------------|---------------------|
| R1 — R2 | GigabitEthernet | 1.000.000 kbps (1 Gbps) | 10 µs |
| R2 — R3 | FastEthernet | 100.000 kbps (100 Mbps) | 100 µs |
| R3 — red destino | FastEthernet | 100.000 kbps (100 Mbps) | 100 µs |

Esta tabla es la lista de datos que hay que recolectar antes de hacer la cuenta: por cada enlace del camino, su **tipo**, su **ancho de banda** en kilobits por segundo y el **delay** de la interfaz en microsegundos. Esos dos números son los que el router conoce de fábrica para cada tipo de interfaz.

El cálculo, paso por paso:

1. **Ancho de banda mínimo del camino.** Los tres enlaces son 1 Gbps, 100 Mbps y 100 Mbps. El más lento es 100 Mbps = 100.000 kbps. El término es `10^7 / 100.000 = 100`. La Gigabit no aporta nada al término de ancho de banda: el camino no puede ir más rápido que su tramo más lento.
2. **Delay total.** Se suman los tres delays: 10 + 100 + 100 = 210 µs. El término es `210 / 10 = 21`.
3. **Suma y escala.** `100 + 21 = 121`. Y ahora sí, `256 × 121 = 30.976`.

Ese 30.976 es la métrica que EIGRP va a poner en la tabla de rutas para esa red, contada desde R1. No es un número abstracto: es la nota de ese viaje en particular.

Y acá viene la parte que sorprende a todo el mundo. Suponé que hay otro camino, más largo (cinco saltos) pero **todo Gigabit**:

1. Ancho de banda mínimo: 1.000.000 kbps → `10^7 / 1.000.000 = 10`.
2. Delay total: cinco enlaces de 10 µs → 50 µs → `50 / 10 = 5`.
3. Métrica: `256 × 15 = 3.840`.

Compáralos: **3.840 es mucho menor que 30.976**. EIGRP prefiere el camino de cinco saltos rápidos antes que el de tres saltos con un tramo de 100 Mbps en el medio. RIP, que cuenta saltos, elegiría exactamente al revés. Eso es lo que significa "medir de verdad": el camino físicamente mejor no es el más corto en routers, es el que tiene mejor capacidad y menos retardo acumulado.

Dos comprobaciones rápidas para que puedas verificar tus cuentas en un examen:

- **Un solo salto FastEthernet** da `256 × (100 + 10) = 28.160`. Es un número que conviene tener memorizado: aparece todo el tiempo.
- **Un solo salto Gigabit** da `256 × (10 + 1) = 2.816`. Diez veces menos que el FastEthernet, que es exactamente lo que uno esperaría de un enlace diez veces más rápido.

Y el 30720 que vas a ver en el capítulo 11 no es magia: es `256 × 120`, con `100` del término de ancho de banda de un enlace de 100 Mbps y `20` de 200 µs de delay (dos saltos FastEthernet, 100 µs cada uno). Cuando llegues a esa pantalla, vas a poder desarmar el número en lugar de copiarlo.

### 5.4. Por qué esta métrica es aditiva

Hay un detalle de diseño que hace que todo el esquema funcione: la métrica de EIGRP es **aditiva**, o sea que se puede ir sumando salto por salto sin tener que conocer el camino completo. El delay se suma; el ancho de banda mínimo se propaga como "el mínimo de lo que vi hasta acá".

Eso es lo que le permite a EIGRP ser un protocolo de rumor: cada router hace su cuenta local con lo que le contó el vecino, y el resultado es el mismo que si tuviera el mapa entero. Si la métrica no fuera aditiva, ningún protocolo de vector de distancia podría usarla.

> **Detalle fino:** por eso mismo EIGRP no puede "ver" que un camino es mejor por una cuestión global (por ejemplo, que pasa por un enlace saturado en hora pico). La carga y la confiabilidad existen como factores (K2, K4), pero por defecto están apagados: la métrica es una foto del enlace, no un video del tráfico.

### Resumen

- La métrica por defecto es `256 × (10^7 / ancho de banda mínimo + delay total / 10)`.
- El ancho de banda que cuenta es el del enlace **más lento** del camino, no el promedio ni el del primero.
- El delay, en cambio, se **suma** en todos los tramos del recorrido.
- Con números reales: tres saltos con un tramo de 100 Mbps dan 30.976, y cinco saltos todo Gigabit dan 3.840; gana el segundo.
- Los K-values son los pesos de cada factor, por defecto solo ancho de banda y delay, y tienen que ser iguales en todo el dominio.

---

## 6. Los vecinos: el protocolo de saludo propio

Todo lo anterior —el plan B, la métrica, la tabla de topología— presupone que hay alguien del otro lado del cable con quien hablar. Ese alguien es un **vecino**, y antes de intercambiar rutas hay que descubrirlo y mantenerlo vivo. De eso se encarga el saludo.

Los dos tiempos del saludo son los dos números que vas a mirar mil veces en tu vida profesional:

- El **Hello** es el saludo periódico. Sale cada cierto tiempo, siempre igual, aunque no haya ninguna novedad que contar. Su función no es informar: es decir "sigo acá".
- El **Hold timer** es el cronómetro de paciencia. Arranca cuando llega un Hello y se reinicia con cada uno. Si llega a cero sin que haya llegado otro, el vecino se declara caído.

### 6.1. El Hello de EIGRP

Como OSPF, EIGRP saluda: Hello cada **5 segundos** por defecto (multicast 224.0.0.10). El **Hold timer** (15 s) es el "si te morís": si no llega Hello en 15 s, el vecino se declara caído y se dispara DUAL.

| Parámetro | Default | En WAN lentas |
|-----------|---------|---------------|
| Hello | 5 s | Se sube a 60 s (¡no a 5!) |
| Hold | 15 s | Se ajusta a > 3× el Hello (p.ej. 180 s) |

Esta tabla tiene tres columnas: el **parámetro**, su valor por **defecto** en una LAN normal y el valor que toma **en WAN lentas**. Las dos filas son los dos tiempos del saludo. Se lee como una receta de dos ingredientes que cambian juntos.

Fila por fila:

- **Hello, 5 segundos por defecto.** Cada cinco segundos, cada router manda un saludo a la dirección de multicast 224.0.0.10. En una LAN eso es nada: son paquetes diminutos. Y es la razón por la que un vecino caído se detecta rápido: a los quince segundos ya sabés que no está.
- **Hello, 60 segundos en WAN lentas.** En enlaces viejos y de poco ancho de banda (típicamente enlaces seriales de 1,5 Mbps o conexiones multipunto), mandar un saludo cada cinco segundos por cada vecino era un gasto de ancho de banda real. Por eso EIGRP sube el Hello a 60 segundos ahí. Fijate el detalle del paréntesis: dice "se sube", no "se baja".
- **Hold, 15 segundos por defecto.** Es tres veces el Hello. Con esa relación, un solo saludo perdido no tumba al vecino: hacen falta tres seguidos. Es margen para el ruido, no para una caída real.
- **Hold, más de 3× el Hello en WAN lentas.** Si el Hello pasa a 60, el Hold tiene que subir a 180 (tres veces 60).

> **La trampa de examen que nadie ve venir:** el **Hold NO se auto-regula solo** — si cambiás el Hello a 60 s y dejás el Hold en 15 s, el vecino se cae a los 15 s aunque siga vivo (¡el Hello llega a los 60!). Regla: **Hold ≥ 3 × Hello.** Cuando veas "ip hello-interval eigrp", configurá también "ip hold-time eigrp".

Pensalo con una imagen cotidiana: el Hello es la persona que te manda un mensaje cada cinco minutos para avisarte que está bien; el Hold es cuánto tiempo esperás antes de preocuparte. Si la persona pasa a escribirte cada hora pero vos seguís preocupándote a los quince minutos, vas a llamar a la policía cada hora con la persona sanita. Los dos tiempos tienen que moverse juntos.

Hay un detalle más que conviene saber: el Hello de EIGRP **no se negocia**. Cada router manda el suyo y espera el del otro; si los tiempos no coinciden, no hay acuerdo. Por eso, cuando cambiás el Hello de un lado, tenés que cambiarlo del otro. No hay "negociación automática" como en otros protocolos.

### 6.2. Requisitos de vecindad (la mini-tabla que salva exámenes)

| Requisito | Si no coincide |
|-----------|----------------|
| Mismo **AS** (`router eigrp <AS>`) | No se ven |
| Mismos **K-values** | No forman vecindad |
| **Autenticación** (si está puesta) | No forman vecindad |
| **IPv4/IPv6 correctos** (AF) | No forman vecindad |

Esta tabla es la lista de condiciones que dos routers tienen que cumplir para hacerse vecinos. Tiene dos columnas: el **requisito** a la izquierda y **qué pasa si no coincide** a la derecha. Las cuatro filas terminan en lo mismo: no hay vecindad.

Fila por fila:

- **Mismo AS.** El **AS** (*Autonomous System*, "sistema autónomo") de EIGRP es un número que se escribe en `router eigrp 100`, y tiene que ser idéntico en los dos extremos. Si un extremo dice 100 y el otro 200, no se ven: son dos dominios distintos que se ignoran. Ojo con la confusión clásica: este número **no** es el process-id de OSPF. En OSPF el número es local y puede diferir; en EIGRP es un dominio y tiene que coincidir.
- **Mismos K-values.** Los pesos de la métrica del capítulo 5.2. Si no coinciden, no hay vecindad, y es la falla más silenciosa de las cuatro porque no da ningún error.
- **Autenticación.** Si un extremo tiene contraseña configurada y el otro no, o si las contraseñas difieren, no hay vecindad. La autenticación es opcional; cuando está, es obligatoria para los dos.
- **IPv4/IPv6 correctos (AF).** **AF** son las siglas de *address-family*, "familia de direcciones": la forma moderna de decir "este proceso es para IPv4" o "este proceso es para IPv6". Si un router anuncia IPv4 y el otro espera IPv6, no se encuentran. El capítulo 10 lo trata entero.

> **Dato curioso y determinante:** a diferencia de OSPF, EIGRP **NO exige la misma subred/máscara** entre los vecinos directos para formar vecindad (en modo clásico). Puede haber vecinos en enlaces con máscaras distintas. Eso lo convierte en un "detalle fino" que algunos examinadores usan para diferenciar EIGRP de OSPF.

Ese detalle tiene consecuencias prácticas: es perfectamente posible tener una vecindad EIGRP sana en un enlace donde las dos patas tienen máscaras distintas (por ejemplo, `/30` de un lado y `/24` del otro). La vecindad va a levantar. Lo que va a fallar es el enrutamiento de las redes anunciadas, no la conversación. Y ahí es donde el principiante se vuelve loco: "¡el vecino está arriba!". Sí, está arriba. Lo que está mal es el direccionamiento, no el protocolo.

### 6.3. Qué viaja dentro de un saludo

Un Hello de EIGRP es corto pero lleva la información justa para saber si vale la pena hablar:

- **El número de AS.** Para descartar de entrada a quien pertenece a otro dominio.
- **Los K-values.** Para descartar a quien mide distinto (capítulo 5.2).
- **La autenticación**, si está configurada.
- **El Hold time** que el emisor propone, para que el receptor sepa cuánto esperar.

Si todo coincide, el vecino entra en la tabla de vecinos y empieza el intercambio de rutas. Si algo no coincide, el saludo se descarta en silencio: el router no contesta "no me interesa", simplemente no lo anota. Por eso los problemas de vecindad de EIGRP se diagnostican comparando configuraciones, no leyendo mensajes de error: **no hay mensajes de error**.

### Resumen

- EIGRP descubre y mantiene vecinos con un Hello cada 5 segundos al multicast 224.0.0.10 y un Hold de 15.
- En WAN lentas el Hello sube a 60 y el Hold tiene que subir con él: la regla es Hold ≥ 3 × Hello.
- El Hold no se ajusta solo: si cambiás uno y no el otro, el vecino cae aunque esté vivo.
- Para ser vecinos tienen que coincidir el AS, los K-values, la autenticación y la familia de direcciones.
- EIGRP no exige la misma máscara entre vecinos directos: la vecindad puede levantar y el enrutamiento igual estar mal.

---

## 7. La tabla de topología: donde vive la inteligencia

Un router EIGRP sano tiene tres listas, no una. La primera es la de **vecinos** (quién está del otro lado del cable y cómo está). La segunda es la de **topología** (todos los caminos conocidos, con su evaluación). La tercera es la de **rutas** (los ganadores, los que realmente se usan para mandar paquetes). Entender qué va en cada una es la mitad del diagnóstico.

### 7.1. Las dos tablas de EIGRP (recordá la diferencia)

```text
TABLA DE TOPOLOGÍA (show ip eigrp topology)
   → TODOS los caminos aprendidos (successor + feasible + candidatos)
   → Acá vive DUAL: los FD, RD y el estado Passive/Active

TABLA DE RUTAS (show ip route)
   → SOLO el successor (el mejor camino)
   → Como cualquier otra tabla de rutas (la que realmente enruta paquetes)
```

Este bloque compara las dos tablas que la gente confunde todo el tiempo. Está armado con la misma estructura en los dos lados: primero el nombre de la tabla con el comando que la muestra, después una flecha con lo que contiene y después otra flecha con lo que significa. Se lee comparando: arriba la tabla rica, abajo la tabla práctica.

Parte por parte:

- **`TABLA DE TOPOLOGÍA (show ip eigrp topology)`**: la tabla de la inteligencia. El comando que la muestra es `show ip eigrp topology`.
- **"TODOS los caminos aprendidos"**: acá está la diferencia clave. No solo el ganador: también el plan B y los candidatos que no calificaron. Es el doble de información que en cualquier otro protocolo de vector de distancia.
- **"Acá vive DUAL"**: los tres datos que DUAL necesita para decidir —el **FD** (mi distancia por el mejor camino), el **RD** (lo que declara cada vecino) y el **estado** (Passive o Active)— están todos en esta tabla. Si querés auditar una decisión de EIGRP, se audita acá.
- **`TABLA DE RUTAS (show ip route)`**: la tabla común, la de siempre, la misma que mirás cuando configuraste una ruta estática. No es exclusiva de EIGRP: es la tabla del router.
- **"SOLO el successor"**: de todos los caminos que conoce, EIGRP le entrega a la tabla de rutas únicamente el mejor. (Salvo que uses `variance`, capítulo 9, y ahí le entrega más de uno.)
- **"Como cualquier otra tabla de rutas"**: y eso es importante, porque significa que el router **solo enruta con esta tabla**. La tabla de topología no manda paquetes: es la libreta de apuntes. La que decide es la de rutas.

La consecuencia práctica de esta división: si un destino no aparece en `show ip route`, el problema puede estar en la tabla de topología (el camino no llegó a ser successor) o en la de rutas (perdió contra otro protocolo por la distancia administrativa). Son dos diagnósticos distintos, y por eso hay dos comandos.

### 7.2. Cómo se ve (salida real comentada)

```text
R1# show ip eigrp topology

P 10.0.0.0/8, 1 successors, FD is 25600     ← P = Passive (feliz), FD = métrica del mejor
        via 10.1.1.2 (25600/2560), GigabitEthernet0/0   ← successor: (FD total / RD reportado)
        via 10.1.2.2 (38400/5120), GigabitEthernet0/1   ← feasible successor (plan B)
```

Este bloque es la salida del comando que muestra la tabla de topología, con anotaciones a la derecha para no perder el hilo. La primera línea (`R1# show ip eigrp topology`) es lo que se escribe: `R1#` es el prompt, o sea la invitación del router a escribir un comando. Lo que sigue son los datos.

Línea por línea, sin saltear nada:

- **`P 10.0.0.0/8, 1 successors, FD is 25600`**: la línea de cabecera del destino. La `P` inicial es el **estado**: **P** es *Passive*, o sea que la ruta está resuelta y tranquila (capítulo 3.2). Si vieras una `A`, sería *Active*: el router está preguntando a los vecinos porque perdió el camino y no tenía plan B. `10.0.0.0/8` es la red de destino. `1 successors` dice cuántos caminos se van a instalar en la tabla de rutas: uno. Y `FD is 25600` es la **distancia factible**: la métrica del mejor camino, el número que va a la tabla de rutas.
- **`via 10.1.1.2 (25600/2560), GigabitEthernet0/0 ← successor`**: el primer camino. `10.1.1.2` es la dirección del **vecino** por el que se sale. El paréntesis `(25600/2560)` es la clave de todo: a la izquierda, la métrica total por ese camino (el FD, 25600); a la derecha, lo que ese vecino **reportó** (el RD, 2560). `GigabitEthernet0/0` es la interfaz local por la que sale ese tráfico. Y la anotación confirma que este es el **successor**: el plan A.
- **`via 10.1.2.2 (38400/5120), GigabitEthernet0/1 ← feasible successor`**: el segundo camino. Otro vecino (`10.1.2.2`), otra interfaz local (`GigabitEthernet0/1`), y un paréntesis con dos números distintos: por este camino el total sería 38400, y el vecino reporta 5120.

Y ahora la parte que hace que todo el manual cierre: **la comparación "RD < FD" que estudiaste en el capítulo 4 es exactamente este paréntesis**. Mirá el segundo camino: el vecino reporta 5120 y mi FD es 25600. Como 5120 < 25600, ese camino **califica como feasible successor**; el router lo tiene evaluado y guardado, esperando.

Eso significa que si el vecino `10.1.1.2` desaparece, R1 **no pregunta nada a nadie**: agarra el camino de `10.1.2.2`, lo instala como nuevo successor, y la red sigue funcionando. El estado de la ruta pasa de un Passive a otro Passive sin escalar a Active. La convergencia dura lo que dura copiar un número de un casillero a otro.

> **La teoría no está en un libro: está en pantalla.** Cuando el manual dice "EIGRP guarda más estado", este bloque es ese estado: los caminos alternativos, con su FD, su RD y su estado, ya evaluados. OSPF guarda el mapa; EIGRP guarda las decisiones tomadas y las que podría tomar. Dos estrategias distintas para llegar rápido.

Un comando que vale la pena conocer desde el día uno: `show ip eigrp topology all-links`. La salida normal muestra solo los caminos que califican (successor y feasible successors). Con `all-links` aparecen **todos** los caminos conocidos, incluidos los que no calificaron como plan B. Si en un examen te dicen "hay un tercer camino y no aparece en la tabla de topología", la respuesta suele ser que no es feasible y hay que mirarlo con `all-links`.

### 7.3. La tercera tabla: los vecinos

La tabla de vecinos es la más chica y la más consultada. Su comando es `show ip eigrp neighbors` y su salida se explica entera en el capítulo 11, pero conceptualmente guarda una fila por vecino con tres datos:

- **Quién es**: su dirección IP en el enlace que nos une.
- **Por dónde**: la interfaz local por la que se lo ve.
- **Cómo está**: cuánto le queda del Hold timer antes de declararlo muerto, y hace cuánto que somos vecinos (el **uptime**).

La relación entre las tres tablas es de embudo: los **vecinos** son la entrada de información; la **topología** es donde se evalúa esa información; la **tabla de rutas** es donde se publica la decisión. Si se rompe el embudo en la primera etapa, no tiene sentido mirar las otras dos.

### 7.4. El orden de lectura cuando algo no anda

Cuando una red EIGRP "no anda", el orden de los comandos no es capricho:

1. **`show ip eigrp neighbors`** → ¿está el vecino? Si no está, el problema es de saludo (capítulo 6): AS, K-values, autenticación o familia de direcciones.
2. **`show ip eigrp topology`** → ¿está el destino? ¿En qué estado? Si está en `A`, el router perdió el camino y está preguntando. Si está en `P`, ya hay decisión tomada.
3. **`show ip route eigrp`** → ¿la ruta llegó a la tabla? Si está en topología pero no en rutas, perdió por distancia administrativa contra otro protocolo (capítulo 12).

Tres comandos, tres preguntas, y cada uno descarta una capa distinta. El error del principiante es empezar por el tercero y tocar configuración a ciegas cuando la respuesta estaba en el primero.

### Resumen

- EIGRP usa tres tablas: vecinos (quién está), topología (todos los caminos evaluados) y rutas (los ganadores).
- En la tabla de topología, `P` es Passive (resuelto) y `A` es Active (buscando reemplazo).
- El paréntesis `(FD/RD)` de cada `via` es exactamente la comparación del capítulo 4: RD menor que FD significa feasible successor.
- `show ip eigrp topology all-links` muestra también los caminos que no calificaron como plan B.
- El orden de diagnóstico es vecinos, topología y rutas: cada comando descarta una capa.

---

## 8. Configuración: EIGRP en 10 minutos

Hasta acá, teoría y pantallas. Ahora los comandos, en el orden en que se escriben. La buena noticia es que EIGRP se configura con muy poco: direcciones en las interfaces y un proceso que diga qué redes participan.

### 8.1. La topología (la clásica de 3 routers)

```text
  R1 ──── 10.0.0.0/30 ──── R2 ──── 10.0.1.0/30 ──── R3
  lo0 1.1.1.1           lo0 2.2.2.2             lo0 3.3.3.3
```

Este bloque es el plano del laboratorio, dibujado en dos líneas. La línea de arriba son los routers y los enlaces entre ellos; la de abajo, las direcciones de loopback de cada uno.

Detalle por detalle:

- **Tres routers en serie**: R1 se conecta con R2 y R2 con R3. R1 y R3 no se ven directamente, y eso es a propósito: para que haya algo que aprender, las rutas tienen que venir por el vecino.
- **`10.0.0.0/30` entre R1 y R2** y **`10.0.1.0/30` entre R2 y R3**. Una **/30** es una subred de cuatro direcciones: la de red, dos usables (una para cada punta del cable) y la de broadcast. Es la medida justa para un enlace entre dos routers: no sobra nada.
- **`lo0` es la interfaz loopback 0**, una interfaz que no existe físicamente pero que el router trata como si existiera. Su dirección (1.1.1.1, 2.2.2.2, 3.3.3.3) es la "IP de gestión": sirve para administrar el equipo y, sobre todo, para tener una red estable que anunciar.

La loopback merece una línea más, porque es la que más se usa sin entenderla: como no depende de ningún cable, **nunca se cae**. Si se rompe el enlace entre R2 y R3, la loopback de R3 sigue existiendo; lo que cambia es el camino para llegar. Por eso se elige para gestión y por eso se publica en el protocolo: es la dirección que querés poder hacer ping siempre.

### 8.2. La configuración (modo clásico, el que ves en el CCNA)

La configuración de R1, completa. Los otros dos routers son iguales, cambiando las direcciones.

```cisco
! R1
interface loopback 0
 ip address 1.1.1.1 255.255.255.255
!
interface GigabitEthernet0/0
 ip address 10.0.0.1 255.255.255.252
 no shutdown
!
router eigrp 100
 network 10.0.0.0 0.0.0.3       ! igual que OSPF: wildcard (anti-máscara)
 network 1.1.1.1 0.0.0.0
 no auto-summary
```

Este bloque es la configuración completa de R1 en modo clásico, tal como se escribe en el router. Cada línea es un comando; el signo `!` es un separador de secciones que el router ignora (como un renglón en blanco), y el texto que sigue a otro `!` en algunas líneas es un comentario para el humano.

Línea por línea:

- **`! R1`**: un comentario que dice a qué router pertenece esta configuración. El router lo ignora; sirve para el que lee.
- **`interface loopback 0`**: entra a la interfaz loopback número 0. `lo0` del dibujo es la abreviatura de este mismo nombre.
- **`ip address 1.1.1.1 255.255.255.255`**: le pone la dirección 1.1.1.1 con máscara de 32 bits (toda la dirección es el equipo, sin parte de red). Es la /32 que se anuncia.
- **`interface GigabitEthernet0/0`**: entra a la interfaz física, la pata que va hacia R2.
- **`ip address 10.0.0.1 255.255.255.252`**: la dirección de R1 en ese enlace. La máscara `255.255.255.252` es una **/30** (cuatro direcciones). R1 toma la `.1`; R2 tomará la `.2`.
- **`no shutdown`**: enciende la interfaz. En los routers Cisco las interfaces nacen apagadas administrativamente, y sin este comando no hay enlace. Si te olvidás de esto, no hay EIGRP que valga.
- **`router eigrp 100`**: crea (o entra a) el proceso EIGRP con el número 100. Ese número es el **AS** del capítulo 6.2, y tiene que ser el mismo en R2 y en R3.
- **`network 10.0.0.0 0.0.0.3`**: mete en el proceso todas las interfaces cuya dirección caiga dentro de ese rango. La **wildcard** `0.0.0.3` es la "anti-máscara": deja libres los últimos dos bits, así que abarca cuatro direcciones, o sea exactamente la /30 del enlace.
- **`network 1.1.1.1 0.0.0.0`**: con wildcard `0.0.0.0` no queda ningún bit libre, así que matchea **solo** esa dirección. Es la forma de meter la loopback /32 en el proceso.
- **`no auto-summary`**: desactiva el resumen automático por clase (se explica en el capítulo 8.3, porque es el error número dos del capítulo 13).

Un detalle que confunde a todos la primera vez: el `network` de EIGRP **no dice "anunciá esta red"**, dice "buscá las interfaces que caigan acá y metelas en el proceso". Las redes que se anuncian son las que pertenecen a esas interfaces. Es la misma lógica que en OSPF, y es distinta de la de una ruta estática, donde la red es el destino.

### 8.3. La sintaxis explicada (los detalles que diferencian)

```text
router eigrp 100              ← el "100" es el número de SISTEMA AUTÓNOMO (AS)
                                 ¡NO el process-id de OSPF! Debe MATCHEAR entre vecinos
network 10.0.0.0 0.0.0.3      ← wildcard, como OSPF (¿te acordás? 255.255.255.255 − máscara)
                                 Nota: en modo clásico, EIGRP NO exige la wildcard exacta
                                 de la interfaz: con "network 10.0.0.0 0.0.0.255" ya matchea 10.0.0.0/30
no auto-summary               ← CRÍTICO: sin esto, EIGRP (antiguo) resumía por clases
                                 (10.0.0.0/8) y rompía el enrutamiento con VLSM.
                                 En IOS moderno es default... pero no confíes: ponelo.
```

Este bloque desarma los tres comandos del proceso, uno por línea, con una flecha y comentarios a la derecha. Es el bloque que hay que leer dos veces, porque acá están las tres trampas de configuración que se preguntan siempre.

Parte por parte:

- **`router eigrp 100`**: el `100` es el **número de sistema autónomo**. El bloque lo dice con todas las letras: **no es el process-id de OSPF**. En OSPF, el número del proceso es local y puede diferir entre routers; en EIGRP es el dominio, y si difiere, no hay vecindad. Es la confusión número uno de quien viene de OSPF.
- **`network 10.0.0.0 0.0.0.3`**: la red y su **wildcard**. La wildcard se calcula restando: `255.255.255.255 − 255.255.255.252 = 0.0.0.3`. Es la misma cuenta que aprendiste en OSPF, y sigue siendo el error más común escribir la máscara donde va la wildcard.
- **La nota del medio**: en modo clásico, EIGRP **no exige la wildcard exacta** de la interfaz. El bloque pone el ejemplo: `network 10.0.0.0 0.0.0.255` también matchea la /30 `10.0.0.0/30`, porque el rango es más grande que la interfaz y la incluye. Es una comodidad del modo clásico, no una recomendación: escribir la wildcard exacta sigue siendo la costumbre sana, porque deja clarísimo qué interfaces entran.
- **`no auto-summary`**: la palabra **auto-summary** se refiere al *resumen automático*: la costumbre de los protocolos viejos de resumir las redes en su dirección de clase (una `10.x.x.x` se anunciaba como `10.0.0.0/8`). El bloque avisa por qué es crítico: si EIGRP resume a `/8`, el router de al lado cree que todas las subredes `10.x` están del mismo lado y el tráfico se va por donde no debe. Eso es lo que rompe el enrutamiento con **VLSM** (*Variable Length Subnet Mask*, "máscara de subred de longitud variable": la técnica de usar máscaras distintas según el tamaño de cada red).
- **"En IOS moderno es default... pero no confíes: ponelo"**: en las versiones actuales de IOS el resumen automático viene desactivado, así que el comando es redundante. Se pone igual, por dos razones: porque en un equipo viejo (o en un examen) puede estar activo, y porque deja escrito en la configuración que alguien pensó en el tema.

> **La trampa clásica del AS:** `router eigrp 100` en R1 y `router eigrp 200` en R2 → **no son vecinos** (AS distinto = no se saludan, punto). El AS de EIGRP es un número interno arbitrario (1-65535) pero **debe ser el mismo** en todo el dominio. No es el ASN de BGP: eso es otra cosa.

Vale la pena fijar esa última distinción, porque el vocabulario se repite: el **ASN de BGP** (*BGP Autonomous System Number*) es un número público, asignado por un registro, que identifica a una organización en Internet. El **AS de EIGRP** es un número que elegís vos, adentro de tu red, y que no le importa a nadie de afuera. Se llaman igual y no tienen nada que ver. El de EIGRP es, en la práctica, un nombre de dominio: `router eigrp 100` significa "los routers que digan 100 son de esta familia".

### 8.4. La configuración "named mode" (el modo moderno)

La forma nueva (desde IOS 15) usa "named mode", orientado a address families:

```cisco
router eigrp RED-EMPRESA
 address-family ipv4 unicast autonomous-system 100
  network 10.0.0.0 0.0.0.3
  network 1.1.1.1 0.0.0.0
  exit-address-family
```

Este bloque es la misma configuración del capítulo 8.2, escrita en la sintaxis moderna. Hace exactamente lo mismo, con otro envoltorio: en lugar de un número, el proceso tiene un nombre, y adentro se declara la familia de direcciones.

Línea por línea:

- **`router eigrp RED-EMPRESA`**: entra al proceso EIGRP llamado `RED-EMPRESA`. El nombre es libre y es local: no tiene que coincidir con el de los vecinos (lo que tiene que coincidir es el AS de la línea siguiente).
- **`address-family ipv4 unicast autonomous-system 100`**: abre la familia de direcciones para IPv4 (tráfico *unicast*, el normal, de uno a uno) y le asigna el AS 100. Acá está el número que sí importa: es el equivalente del `router eigrp 100` clásico.
- **`network 10.0.0.0 0.0.0.3`** y **`network 1.1.1.1 0.0.0.0`**: los mismos dos `network` con las mismas wildcards. La lógica no cambió.
- **`exit-address-family`**: cierra la familia y vuelve al nivel del proceso. Es el equivalente de salir de una carpeta.

> **Para tu vida práctica:** el named mode es el futuro (y lo que Cisco recomienda), el clásico es lo que ves en los labs viejos y en los exámenes. Sabé que existen los dos; en el CCNA alcanza con el clásico bien dominado.

La razón por la que Cisco cambió de sintaxis: el modo clásico no puede manejar IPv4 e IPv6 en el mismo proceso. El named mode sí: dentro de `router eigrp RED-EMPRESA` podés tener una `address-family ipv4` y una `address-family ipv6`, cada una con su AS. Eso es lo que hace posible el capítulo 10.

### 8.5. Cómo saber que quedó bien (antes de seguir)

Tres comprobaciones rápidas, en orden, después de configurar los tres routers:

1. **Las interfaces están arriba.** `show ip interface brief` muestra, en una línea por interfaz, si está `up` y con qué IP. Si alguna dice `administratively down`, falta el `no shutdown`.
2. **Los vecinos aparecen.** `show ip eigrp neighbors` tiene que mostrar dos vecinos en R2 (uno por cada lado) y uno en R1 y R3. Si está vacío, el problema es del capítulo 6.
3. **Las rutas lejanas aparecen.** `show ip route eigrp` en R1 tiene que mostrar la `10.0.1.0/30` y la `3.3.3.3/32`, que R1 no tiene conectadas. Si están, el laboratorio funciona.

Si los tres pasos dan bien, ya tenés una red EIGRP funcionando, con plan B incluido. Si alguno falla, el capítulo 13 tiene el catálogo de causas.

### Resumen

- El laboratorio son tres routers en serie, con enlaces /30 y loopbacks /32 para gestión.
- La configuración mínima es: direcciones, `no shutdown`, un proceso EIGRP con su AS y un `network` por cada red que participa.
- El número de `router eigrp` es el AS y tiene que coincidir entre vecinos; no es el process-id de OSPF.
- El `network` usa wildcard (la anti-máscara) y sirve para seleccionar interfaces, no para anunciar destinos.
- `no auto-summary` se escribe siempre, y el named mode es la misma cosa con nombre y familia de direcciones.

---

## 9. La joya escondida: el balanceo de carga desigual (variance)

### 9.1. El problema

OSPF y RIP hacen **ECMP** (balanceo igual: todas las rutas con la misma métrica). Pero ¿y si el plan A va por un enlace de 1 Gbps y el plan B por uno de 100 Mbps? OSPF manda TODO por el de 1 Gbps (métrica más baja) y deja el otro al pedo. EIGRP... puede **partir el tráfico entre ambos, proporcional a la métrica**: eso es el **balanceo de carga desigual** (`variance`).

**ECMP** son las siglas de *Equal-Cost Multi-Path*, "varios caminos de igual costo". La idea es simple: si dos caminos cuestan exactamente lo mismo, ¿por qué mandar todo por uno? Se reparte mitad y mitad. El problema es la palabra "igual": si los caminos no cuestan lo mismo, ECMP no reparte nada.

EIGRP es el único de los tres grandes protocolos internos que rompe esa restricción: puede repartir tráfico entre caminos de **distinta** métrica, en proporción a lo que cada uno puede aportar. La analogía del capítulo 9.3 lo explica mejor que cualquier definición, pero la idea es esta: si tenés un camión grande y uno chico, no los cargás mitad y mitad; cargás más al grande. Los dos hacen falta, y aprovechás los dos.

### 9.2. El comando

```text
router eigrp 100
 variance 2     ← acepta rutas alternativas cuyo FD ≤ 2× el FD del successor
```

Este bloque muestra el comando y su efecto en una línea. Se escribe dentro del proceso EIGRP.

Parte por parte:

- **`router eigrp 100`**: el proceso, el mismo de siempre.
- **`variance 2`**: el multiplicador. El número `2` significa "acepto caminos alternativos cuya métrica total no pase del doble de la del mejor".
- **`FD ≤ 2× el FD del successor`**: la condición exacta. Si el successor tiene métrica 10.000, con `variance 2` entran también los caminos de hasta 20.000.

Con `variance 2`, todas las rutas con métrica hasta el **doble** del successor entran a la tabla de rutas y EIGRP reparte tráfico entre ellas de forma proporcional (el tráfico se distribuye según la métrica — no 50/50).

"Proporcional" quiere decir que el camino más barato se lleva más paquetes. Si el camino A tiene métrica 10.000 y el B tiene 20.000, A se lleva aproximadamente el doble de tráfico que B. No es una división exacta por paquetes: es un reparto estadístico, y en la práctica el resultado es que el enlace rápido trabaja más que el lento, en vez de quedar uno solo trabajando.

### 9.3. Los requisitos (el detalle fino)

```text
variance 2   → condición 1: la ruta alternativa debe ser FEASIBLE SUCCESSOR
               (RD < FD)  ← ¡la condición del manual! variance NO salta esa regla
             → condición 2: FD del backup ≤ variance × FD del successor
```

Este bloque enumera las dos condiciones que un camino alternativo tiene que cumplir para que `variance` lo use. La condición 1 es la del capítulo 4 y la condición 2 es la del comando. Se cumplen las dos o el camino no entra.

Parte por parte:

- **Condición 1, "debe ser FEASIBLE SUCCESSOR (RD < FD)"**: el backup tiene que ser seguro. La nota entre signos de exclamación insiste en lo mismo: `variance` **no salta** la regla de factibilidad. Si un camino no es feasible successor, `variance` no lo va a usar por más que su métrica entre en el multiplicador. Eso es lo que evita que el balanceo de carga introduzca bucles: repartir tráfico entre dos caminos no puede ser más permisivo que elegir el plan B.
- **Condición 2, "FD del backup ≤ variance × FD del successor"**: el backup tiene que ser razonablemente bueno. Con `variance 2`, un camino que cueste el triple no entra, aunque sea feasible successor. Es el freno que evita repartir tráfico por un enlace que va a empeorar todo.

> **Analogía:** varianza es el "transporte multimodal": si el plan A es el camión de 10 toneladas y el plan B es el de 5, la varianza te dice "ufa, el de 5 también puede llevar carga" — y repartís los bultos según capacidad, no mitad y mitad. La condición RD < FD sigue protegiendo que el plan B no haga un bucle.

Dos advertencias prácticas, para que no te sorprenda en un laboratorio:

- **No es un reemplazo del diseño.** Si el plan B es diez veces más lento, repartirle tráfico puede empeorar la experiencia de los usuarios. `variance` sirve cuando los caminos son comparables, no para rescatar enlaces malos.
- **El reparto es por flujo, no por paquete.** EIGRP balancea eligiendo caminos para cada conversación, no partiendo cada paquete al medio. Eso evita que los paquetes lleguen desordenados, que sería peor que la lentitud.

### Resumen

- ECMP reparte solo entre caminos de métrica idéntica; EIGRP puede repartir entre caminos de métrica distinta con `variance`.
- `variance N` acepta caminos alternativos con métrica hasta N veces la del successor.
- La condición de feasible successor (RD < FD) se sigue aplicando: sin ella, el camino no entra.
- El reparto es proporcional a la métrica y se hace por flujo, no mitad y mitad ni paquete por paquete.
- Sirve para aprovechar un segundo enlace razonable, no para rescatar un enlace diez veces más lento.

---

## 10. EIGRP para IPv6 y address families

EIGRP se adaptó a IPv6 con el mismo enfoque de AF:

```text
En el CLÁSICO:   router eigrp 100          → solo IPv4
                 (nada de IPv6 en clásico; para v6 se usa AF)

En NAMED MODE:   router eigrp RED-EMPRESA
                  address-family ipv6 unicast autonomous-system 100
                   network 2001:db8:1:1::/64    ← el "network" es con prefijo v6
```

Este bloque compara cómo se hace lo mismo en las dos sintaxis, con **IPv6**. Arriba el modo clásico, abajo el named mode; las flechas señalan la diferencia clave de cada uno.

Parte por parte:

- **`En el CLÁSICO: router eigrp 100 → solo IPv4`**: el proceso clásico es exclusivamente para IPv4. No hay comando que le agregue IPv6 adentro. Si querés EIGRP para IPv6, el clásico no te sirve.
- **`(nada de IPv6 en clásico; para v6 se usa AF)`**: el paréntesis lo dice sin vueltas: IPv6 se hace con familias de direcciones, o sea con named mode.
- **`En NAMED MODE: router eigrp RED-EMPRESA`**: el mismo proceso con nombre del capítulo 8.4.
- **`address-family ipv6 unicast autonomous-system 100`**: la familia de direcciones para IPv6, con su propio AS. Fijate que el AS puede ser el mismo número que usa IPv4 o distinto, pero lo que importa es que coincida con el de los vecinos de esa familia.
- **`network 2001:db8:1:1::/64 ← el "network" es con prefijo v6`**: la diferencia de forma: en IPv6 no se escribe wildcard, se escribe directamente el **prefijo** con su longitud (`/64`). El bloque lo aclara con la flecha, porque es la parte que se copia mal. Y `2001:db8::` es el rango que se usa en documentación y ejemplos (igual que en IPv4 se usa `192.0.2.0`), así que si lo ves en un manual, es un ejemplo y no una dirección real.

| Detalle | EIGRP IPv4 | EIGRP IPv6 |
|---------|------------|------------|
| Comando del proceso | `router eigrp 100` | `router eigrp RED` + `address-family ipv6` |
| `no shutdown` en la AF | innecesario | **OBLIGATORIO** (las AF v6 nacen apagadas) |
| Verificación | `show ip eigrp neighbors` | `show ipv6 eigrp neighbors` |

Esta tabla compara las dos versiones del protocolo, una al lado de la otra, en tres detalles concretos: cómo se arranca el proceso, si hace falta encender la familia y con qué comando se verifica. Es la tabla que hay que tener a mano cuando el laboratorio de IPv6 "no anda".

Fila por fila:

- **Comando del proceso.** En IPv4 alcanza con `router eigrp 100`. En IPv6 hace falta el named mode, porque el clásico no soporta la familia. No es una preferencia estética: es la única forma.
- **`no shutdown` en la AF: innecesario en IPv4, OBLIGATORIO en IPv6.** Este es el dato que hace perder más horas de laboratorio en todo el tema. En IPv4, cuando creás la familia, ya queda encendida. En IPv6 la familia **nace apagada**, como las interfaces físicas, y hay que encenderla a mano. Si no lo hacés, no hay error, no hay mensaje, no hay nada: simplemente no aparecen vecinos. La palabra OBLIGATORIO en mayúsculas no es un adorno.
- **Verificación.** El comando cambia de nombre: `show ip eigrp neighbors` para IPv4 y `show ipv6 eigrp neighbors` para IPv6. Si buscás vecinos v6 con el comando de v4, la pantalla sale vacía y vas a pensar que el problema es otro. Mismo criterio para `show ipv6 eigrp topology` y `show ipv6 route eigrp`.

> **La trampa que rompe el lab de EIGRPv6:** en IPv6, EIGRP arranca con la AF **apagada**: si no ponés `no shutdown` dentro de la address-family... no hay vecinos, no hay rutas, y el lab "no anda" sin error visible. Es el hermano gemelo de "olvidé `ipv6 unicast-routing` en OSPFv3" (la misma trampa). Mismo síntoma, distinta causa.

A esa trampa hay que sumarle una segunda condición, que es global y no del protocolo: **`ipv6 unicast-routing`** tiene que estar activo en el router. Ese comando es el que habilita el enrutamiento de IPv6 en el equipo; sin él, ningún protocolo de enrutamiento de IPv6 funciona, ni EIGRP ni OSPFv3. Es la primera cosa que hay que revisar cuando un router no enruta IPv6 y todo lo demás parece bien.

### Resumen

- EIGRP clásico es solo IPv4; para IPv6 hay que usar named mode con `address-family ipv6 unicast`.
- En IPv6 la familia nace apagada y hay que encenderla con `no shutdown`: sin eso no hay vecinos ni errores.
- El `network` de IPv6 se escribe con prefijo (`/64`), no con wildcard.
- La verificación cambia de `show ip eigrp` a `show ipv6 eigrp`.
- Además hace falta `ipv6 unicast-routing` a nivel global: sin eso, ningún protocolo v6 enruta.

---

## 11. Verificación: las preguntas que le hacés a la red

Configurar fue la parte fácil. Verificar es lo que te va a pagar el sueldo. Cinco comandos, cinco preguntas:

| Comando | Qué te dice |
|---------|-------------|
| `show ip eigrp neighbors` | Vecinos: dirección, interfaz, **Hold time**, uptime, Q (cola) |
| `show ip route eigrp` | Las rutas `D` (y `D EX` para las redistribuidas) en la tabla |
| `show ip eigrp topology` | Todo el estado DUAL: successors, feasible successors, Passive/Active |
| `show ip eigrp interfaces` | Interfaces activas en el proceso + hello/hold reales |
| `debug eigrp neighbors` | El último recurso (vecindades en vivo) |

Esta tabla es el kit de herramientas de verificación. Tiene dos columnas: el **comando** tal como se escribe y **qué te dice**, en una línea. Se lee como una lista de preguntas: cada comando responde una sola cosa, y entre los cinco cubren todo el protocolo.

Fila por fila:

- **`show ip eigrp neighbors`**: la lista de vecinos. Responde "¿con quién estoy hablando?" y de paso te dice si la conversación está sana, porque muestra el Hold en cuenta regresiva y la cola de mensajes sin confirmar.
- **`show ip route eigrp`**: las rutas de EIGRP dentro de la tabla de rutas. Responde "¿qué estoy usando para enrutar?" y muestra las rutas con código `D`. Las `D EX` son las **externas**: rutas que EIGRP no aprendió de otro router EIGRP sino que fueron **redistribuidas** desde otro protocolo o desde rutas estáticas.
- **`show ip eigrp topology`**: la tabla del capítulo 7. Responde "¿qué sé y qué tengo evaluado?" con los FD, los RD y los estados.
- **`show ip eigrp interfaces`**: las interfaces que están participando del proceso, con los valores reales de hello y hold de cada una. Es el comando que resuelve la duda del capítulo 6.1 sin tocar la configuración.
- **`debug eigrp neighbors`**: el último recurso, porque **debug** muestra los eventos en vivo a medida que ocurren (y en un router de producción puede inundar la pantalla y consumir CPU). Se usa en laboratorio o en una ventana de mantenimiento, nunca "para ver qué pasa" en horario pico.

Salida comentada (la lectura que tenés que saber):

```text
R1# show ip eigrp neighbors
H   Address         Interface       Hold Uptime   SRTT  RTO  Q  Seq
0   10.0.0.2        Gi0/0             13  1w6d      1   200  0  12
    └── el vecino    └── por dónde    └─ Hold countdown   └─ Q=0: sin cola de mensajes pendientes
                                                                 (Q=1+ = problema de RTP)

R1# show ip route eigrp
D    10.0.1.0/30 [90/30720] via 10.0.0.2, 00:20:11, GigabitEthernet0/0
│               └── AD 90 (¡la prueba de que EIGRP gana ante OSPF en transición!)
└─ D = EIGRP    └── métrica compuesta
```

Este bloque tiene dos pantallas seguidas, separadas por una línea en blanco: arriba la tabla de vecinos y abajo las rutas de EIGRP en la tabla de rutas. Las anotaciones con líneas y flechas explican qué señala cada columna. Se lee primero la de arriba (¿hay vecino?) y después la de abajo (¿llegó la ruta?).

Empecemos por la tabla de vecinos, columna por columna, porque son nueve letras que espantan y ninguna es difícil:

- **`H`** es el *handle*: un número de orden interno que el router le asigna al vecino para referenciarlo. No significa nada para vos; cambia si reiniciás el proceso.
- **`Address`**: la dirección IP del vecino en el enlace. En esta salida es `10.0.0.2`, o sea R2. La anotación de abajo lo traduce: "el vecino".
- **`Interface`**: la interfaz local por la que se ve a ese vecino, `Gi0/0` (GigabitEthernet 0/0). La anotación: "por dónde".
- **`Hold`**: el cronómetro del capítulo 6.1 en cuenta regresiva. Acá marca `13`: quedan trece segundos para el próximo Hello (salió a los 5, subió a 15 y viene bajando). La anotación lo llama **Hold countdown**. Si lo mirás dos veces seguidas y baja, está vivo; si se clava en cero y el vecino desaparece, se cayó.
- **`Uptime`**: hace cuánto que son vecinos, en formato compacto. `1w6d` es una semana y seis días. Es el número que delata las vecindades inestables: si ves `00:00:12` en un router que está hace meses, ese vecino se está cayendo y volviendo (el **flap** del capítulo 13).
- **`SRTT`**: *Smooth Round-Trip Time*, "tiempo de ida y vuelta suavizado", en milisegundos. Es cuánto tarda un paquete en ir al vecino y volver con su acuse de recibo. Un valor bajo (1 ms) es un enlace sano y rápido.
- **`RTO`**: *Retransmission Time Out*, el tiempo que el router espera el acuse antes de reenviar, en milisegundos. Acá son 200. Si el SRTT sube, el RTO sube con él.
- **`Q`**: la **cola**: cuántos mensajes están esperando acuse de recibo. La anotación es explícita: `Q=0` es lo normal, sin cola pendiente; `Q=1+` es **problema de RTP**, o sea que algo se está perdiendo o el vecino no está confirmando. Es el primer número que hay que mirar cuando la red "va lenta".
- **`Seq`**: el número de secuencia del último paquete recibido de ese vecino. Sirve para detectar duplicados y desorden; es contabilidad interna.

Ahora la segunda pantalla, la de las rutas:

- **`D`** es el código de EIGRP en la tabla de rutas. La anotación lo dice: *D = EIGRP*, y la letra viene de **DUAL**. Es la forma de distinguir de un vistazo de dónde vino cada ruta: `C` es conectada, `S` es estática, `O` es OSPF, `R` es RIP, `D` es EIGRP, `B` es BGP, `i` es IS-IS. Con ese alfabeto leés cualquier tabla de rutas del mundo.
- **`10.0.1.0/30`** es la red de destino: el enlace entre R2 y R3, que R1 no tiene conectado y aprendió por EIGRP.
- **`[90/30720]`** son dos números entre corchetes: a la izquierda la **distancia administrativa** (90, la de EIGRP interno) y a la derecha la **métrica** del camino. La anotación marca la primera: "AD 90, la prueba de que EIGRP gana ante OSPF en transición". Y la segunda la llama "métrica compuesta", que es la del capítulo 5.
- **`via 10.0.0.2`** es el **próximo salto**: la dirección del vecino al que R1 le entrega el paquete para llegar a esa red.
- **`00:20:11`** es la antigüedad de la ruta: hace veinte minutos y once segundos que está instalada.
- **`GigabitEthernet0/0`** es la interfaz local por la que sale el paquete.

Y ahora el cierre del círculo con el capítulo 5: **ese 30720 no es un número arbitrario**. Es `256 × 120`, donde `100` es el término de ancho de banda de un enlace de 100 Mbps (`10^7 / 100.000`) y `20` es el término de delay de 200 microsegundos (`200 / 10`). O sea: dos saltos de 100 Mbps con 100 µs de delay cada uno. Cuando puedas desarmar el corchete de una ruta, ya no estás leyendo una pantalla: estás leyendo la red.

> **El dato que cierra el círculo de la selección de rutas:** `[90/30720]` es AD 90 + métrica compuesta. Fijate cómo EIGRP "se codea" como una letra `D` en la tabla Cisco — cada protocolo tiene su código: O = OSPF, D = EIGRP (la D viene de "DUAL"), B = BGP, I = IS-IS. Conocé las letras y leés la tabla de un vistazo.

> **El ritual de verificación (aprendételo de memoria):** **1)** `show ip eigrp neighbors` → ¿hay vecinos y con `Q=0`? **2)** `show ip eigrp topology` → ¿el destino está en `P`? **3)** `show ip route eigrp` → ¿aparece la `D`? En ese orden. Cuando un laboratorio "no anda", este ritual de tres pasos te dice exactamente en qué capa se cortó.

### Resumen

- `show ip eigrp neighbors` responde "¿con quién hablo?": mirá el Hold bajando, el Uptime estable y `Q=0`.
- En esa tabla, `H` es un número interno, `SRTT` es el tiempo de ida y vuelta y `RTO` cuánto espera antes de reenviar.
- `show ip route eigrp` responde "¿qué estoy usando?": rutas `D` (y `D EX` para las redistribuidas), con AD y métrica entre corchetes.
- El `[90/30720]` se lee como AD 90 más una métrica que podés recalcular con la fórmula del capítulo 5.
- El ritual de tres comandos (vecino, topología, ruta) te dice en un minuto dónde se cortó.

---

## 12. EIGRP vs OSPF: la comparación honesta

| Criterio | EIGRP | OSPF |
|----------|-------|------|
| Familia | Híbrido (DV con LS) | Estado de enlace puro |
| Algoritmo | DUAL | SPF (Dijkstra) |
| AD | 90/170 | 110 |
| Métrica | BW + delay (K-values) | Costo (BW inverso) |
| Convergencia | Muy rápida (plan B precalculado) | Rápida (flood + SPF) |
| Las rutas alternativas | Feasible successors (tabla de topología) | No las guarda (recalcula con SPF) |
| Balanceo | **Igual Y desigual** (variance) | Solo igual (ECMP) |
| Interoperabilidad | Cisco only | Abierto (multi-fabricante) |
| Tamaño de red | Media (no escala como multi-área) | Alta (áreas) |
| Transmisión | Incremental con ACK (RTP) | LSA + flood |

Esta tabla pone los dos protocolos lado a lado en diez criterios. La primera columna nombra el **criterio**, la segunda dice cómo lo resuelve **EIGRP** y la tercera cómo lo resuelve **OSPF**. Se lee por filas: cada fila es una decisión de diseño en la que los dos eligieron distinto.

Fila por fila:

- **Familia.** EIGRP es híbrido (capítulo 1); OSPF es estado de enlace puro, sin discusión.
- **Algoritmo.** EIGRP usa DUAL (plan B precalculado); OSPF usa **SPF** (*Shortest Path First*, "primero el camino más corto"), el algoritmo de Dijkstra que calcula el árbol de caminos más cortos sobre el mapa completo.
- **AD.** 90/170 contra 110. Cuando los dos conocen la misma red, gana EIGRP. Es un dato que importa en redes donde conviven los dos, típicamente durante una migración.
- **Métrica.** EIGRP suma ancho de banda y delay con pesos configurables; OSPF usa un costo que sale del ancho de banda invertido, con la posibilidad de fijarlo a mano por interfaz.
- **Convergencia.** EIGRP es rapidísimo cuando hay plan B (no hay nada que calcular). OSPF es rápido pero siempre paga el precio de inundar el cambio y recalcular el árbol.
- **Las rutas alternativas.** Acá está la diferencia de fondo: EIGRP las **guarda evaluadas** en la tabla de topología; OSPF **no las guarda**, las recalcula cuando hacen falta. Uno paga memoria por adelantado, el otro paga cálculo en el momento.
- **Balanceo.** EIGRP puede balancear entre caminos iguales (ECMP) y también entre caminos distintos (`variance`); OSPF solo entre iguales.
- **Interoperabilidad.** EIGRP es de Cisco; OSPF es un estándar abierto que corre en cualquier fabricante. Es la fila que decide proyectos.
- **Tamaño de red.** OSPF escala más porque tiene áreas (capítulo 11 del manual de OSPF): cada área tiene su mapa chico. EIGRP no tiene ese mecanismo, así que en redes enormes el dominio entero es un solo bloque.
- **Transmisión.** EIGRP manda solo cambios y los confirma con su RTP; OSPF inunda LSA (*Link State Advertisement*, los anuncios con los que cada router publica su pedazo de mapa).

> **La decisión honesta (la que te va a servir en la vida):** parque **100% Cisco** y querés convergencia instantánea y balanceo desigual → EIGRP. Red **multi-fabricante**, grandes, o con futuro de crecer → **OSPF**. Y el día que tengas que conectar BGP, a los dos los redistribuís por igual (tema de redistribución). No es "cuál es mejor": es "cuál encaja con tu entorno".

Un matiz que vale para la conversación de pasillo: mucha gente defiende EIGRP diciendo que converge más rápido, y es cierto en el caso típico (hay plan B y no hay consulta). Pero en el caso feo —se cae el camino y no hay feasible successor— EIGRP tiene que hacer su cómputo difuso, y ahí la diferencia con OSPF se achica bastante. La ventaja real de EIGRP no es la velocidad en el peor caso: es la **cantidad de casos en los que el peor caso no ocurre**.

### Resumen

- EIGRP y OSPF resuelven lo mismo con filosofías distintas: uno guarda alternativas, el otro recalcula el mapa.
- La diferencia que decide proyectos es la interoperabilidad: EIGRP es de Cisco y OSPF es abierto.
- EIGRP gana en convergencia típica y en balanceo desigual; OSPF gana en escala con áreas y en libertad de fabricante.
- El AD 90 contra 110 hace que EIGRP gane cuando los dos conocen la misma red, y eso importa en migraciones.
- No hay "mejor": hay encaje con el entorno, el presupuesto y el parque de equipos.

---

## 13. Los 5 errores más comunes

| # | Error | Síntoma | Fix |
|---|-------|---------|-----|
| 1 | **AS distinto** en cada extremo | Vecinos no aparecen | Mismo `router eigrp <AS>` en todo el dominio |
| 2 | **Falta `no auto-summary`** (IOS viejo) | Rutas resumidas por clase (10.0.0.0/8) que rompen VLSM | `no auto-summary` (en IOS moderno es default; en lab viejo, ponelo) |
| 3 | **K-values distintos** | Vecinos no forman adyacencia | Mismos `metric weights` en todos |
| 4 | **Hold < 3× Hello** después de tocar el Hello | Vecino cae y vuelve solo (flap) | `hold-time` ≥ 3× hello-interval |
| 5 | **EIGRPv6 sin `no shutdown`** en la AF | Sin vecinos, sin rutas, sin error visible | `no shutdown` dentro de `address-family ipv6` |

Esta tabla es el catálogo de las cinco fallas que vas a encontrar en la mayoría de los casos. Tiene cuatro columnas: el **número**, el **error**, el **síntoma** que ves en pantalla y el **fix**, el arreglo. Se lee de izquierda a derecha: empezás por el síntoma, encontrás la fila y te llevás la causa con su solución.

Fila por fila:

1. **AS distinto en cada extremo.** Un router dice `router eigrp 100` y el otro `router eigrp 200`. No se ven, porque cada uno pertenece a otro dominio. No hay error, no hay log: simplemente la lista de vecinos está vacía. El fix es usar el mismo AS en todo el dominio (capítulo 6.2).
2. **Falta `no auto-summary` (IOS viejo).** El router resume las redes por clase y anuncia `10.0.0.0/8` en lugar de las subredes reales. El síntoma es traicionero: los vecinos están arriba, las rutas existen, y el tráfico se va por el lado equivocado o se pierde. Eso es lo que "rompe VLSM". El fix es el `no auto-summary` del capítulo 8.3.
3. **K-values distintos.** Alguien tocó `metric weights` en un solo router, o cambió los pesos en toda la red menos en uno. No hay adyacencia y no hay mensaje que lo explique. El fix es igualar los `metric weights` en todos, o mejor, no tocarlos nunca.
4. **Hold < 3× Hello después de tocar el Hello.** Es el error del capítulo 6.1: se sube el Hello y se olvida el Hold. El vecino se cae y vuelve solo, una y otra vez. El fix es configurar `hold-time` como mínimo el triple del `hello-interval`.
5. **EIGRPv6 sin `no shutdown` en la AF.** La familia de IPv6 nace apagada (capítulo 10). El síntoma es el peor de todos: nada, en ningún lado. El fix es el `no shutdown` dentro de la `address-family ipv6`.

> **El error #4 es el más "fantasma":** el vecino aparece y desaparece solo (flap). La red "anda a ratos". Causa clásica: se cambió hello-interval y el hold quedó en default. Revisá `show ip eigrp neighbors` (columna Hold en countdown corto) — si el Hold baja de golpe a cero y el vecino se reinicia, es esto.

Un detalle de método que vale más que la tabla: **los cinco errores se diagnostican comparando, no adivinando**. Los errores 1 y 3 se ven comparando dos configuraciones (`show running-config | section eigrp`); el 2 se ve en las rutas anunciadas; el 4 y el 5 se ven en las interfaces y en la familia de direcciones. En ningún caso hace falta "probar cambiando cosas", que es la forma más rápida de romper algo que funcionaba.

Y una regla de oro que cierra el tema: **cuando EIGRP no anda, casi nunca es el protocolo**. Es una configuración que no coincide con la del otro lado, o una interfaz que no está como creés. El protocolo hace exactamente lo que le pediste, incluso cuando le pediste mal.

### Resumen

- Los cinco errores clásicos son: AS distinto, falta de `no auto-summary`, K-values distintos, Hold menor que 3× Hello y EIGRPv6 sin `no shutdown`.
- Tres de los cinco son de vecindad (AS, K-values, autenticación) y no dan ningún mensaje de error.
- El del resumen automático es el más traicionero: la red funciona a medias y el síntoma parece de direccionamiento.
- El del Hold aparece como vecino que sube y baja solo, y se detecta mirando la columna Hold de `show ip eigrp neighbors`.
- Casi ninguna falla es un bug del protocolo: es configuración que no coincide entre los dos extremos.

---

## 14. Comprobá lo que aprendiste

Ocho preguntas. Tapá la respuesta, contestá en voz alta y recién después compará. Las que fallan te mandan al capítulo correspondiente.

**1. ¿Qué hace a EIGRP un "híbrido" entre DV y LS?**

**Ver respuesta:** Aprende de vecinos directos como un DV, por ondas de rumor salto a salto, pero guarda el estado de todos los caminos (tabla de topología, conducta LS), propaga solo cambios con ACK (RTP) y precalcula plan B (feasible successor) — conducta LS, sin el mapa completo.

La parte importante es la última: **sin el mapa completo**. EIGRP toma del estado de enlace el comportamiento (converger rápido sin bucles), no el mecanismo (no hay LSDB ni Dijkstra). Si te preguntan en un examen si EIGRP arma un mapa de la red, la respuesta es no.

**2. ¿Qué es la condición del Feasible Successor?**

**Ver respuesta:** RD del vecino < FD propio. Garantiza que el camino del vecino no pasa por mí (si pasara, su métrica sería mayor a la mía), por lo que es seguro como backup SIN calcular nada. Eso evita bucles a costo cero.

Y el detalle que suma puntos: es una condición **estricta**. Si RD es igual a FD, el vecino no califica. Y si el vecino no califica, EIGRP no lo usa como plan B ni con `variance` (capítulo 9.3).

**3. ¿Qué le pasa a una ruta cuando se cae el successor y NO hay feasible successor?**

**Ver respuesta:** Pasa a estado ACTIVE: DUAL difunde la consulta a los vecinos para encontrar un reemplazo. Si hay feasible successor, DUAL NO consulta nada: cambia de camino al instante (estado Passive sigue).

Recordá que "active" es el estado malo, aunque la palabra suene a lo contrario. Y que el estado es por destino: una red puede estar en Active mientras todas las demás siguen en Passive.

**4. ¿Cómo se calcula la métrica EIGRP por defecto?**

**Ver respuesta:** 256 × (10^7 / BW mínimo del camino + delay total / 10). Por defecto solo pesan BW y Delay (K1 y K3 = 1). El BW mínimo es el cuello de botella del recorrido; el delay se suma en todos los enlaces. Los K-values deben ser iguales en todo el dominio.

Si querés comprobar que la entendiste, hacé la cuenta del capítulo 5.3 con tus propios números: un salto FastEthernet da 28.160 y uno Gigabit da 2.816. Si te salen esos dos, la fórmula está dominada.

**5. ¿Qué es variance y qué requisitos exige?**

**Ver respuesta:** Permite balancear tráfico entre rutas de métrica DISTINTA (hasta N veces la del successor). Requisitos: la ruta debe ser feasible successor (RD < FD) y su FD ≤ variance × FD del successor. EIGRP reparte el tráfico proporcional a la métrica, no 50/50.

Las dos condiciones son acumulativas: cumplir una sola no alcanza. Y el reparto es por conversación (por flujo), no partiendo cada paquete.

**6. ¿Qué peligro hay en `show ip eigrp neighbors` con Q=1+?**

**Ver respuesta:** Q es la cola de mensajes sin ACK. Q=1 o más indica que el vecino no está acusando recibo de las actualizaciones RTP: problema de conectividad, buffer o adyacencia degradada. Idealmente Q=0 siempre.

Traducido: hay mensajes que salieron y no volvieron confirmados. Si la cola crece, el router está acumulando trabajo sin poder entregarlo, y eso termina en pérdida de rutas o en vecindades que se caen. Es el primer número que se mira cuando la red "va lenta".

**7. ¿EIGRP exige la misma máscara entre vecinos como OSPF?**

**Ver respuesta:** NO en modo clásico. EIGRP no exige misma subred/máscara en vecinos directos para formar adyacencia (a diferencia de OSPF). Es un detalle fino de examen que diferencia ambos protocolos.

Y el detalle práctico: la vecindad levanta igual, pero el enrutamiento de las redes anunciadas puede quedar mal. Cuando veas un vecino arriba y rutas que no llegan, revisá el direccionamiento antes de culpar al protocolo.

**8. ¿Por qué AD 90 de EIGRP vs 110 de OSPF? ¿Y en qué orden van las preferencias?**

**Ver respuesta:** AD menor = más preferido (recordá la selección de rutas). EIGRP (90) gana sobre OSPF (110) cuando ambos conocen la misma ruta. Orden clásico que hay que saber: conectada (0) > estática (1) > EIGRP (90) > OSPF (110) > RIP (120) > externa (170+).

Ese orden es la tabla de "a quién le creo más", y es lo que decide cuando dos protocolos conocen el mismo destino. Fijate que las rutas **externas** de EIGRP (las redistribuidas) bajan a 170: el router confía menos en ellas porque no las aprendió de un vecino EIGRP, sino que las importó de otro protocolo.

### Resumen

- Las ocho preguntas cubren el híbrido, la condición de factibilidad, los estados, la métrica, `variance`, la cola Q, la máscara y la distancia administrativa.
- Si contestás bien la 2, la 4 y la 5, tenés el núcleo del protocolo: plan B, métrica y balanceo.
- La respuesta corta de casi todas: RD < FD, 256 × (BW mínimo + delay), y K-values iguales en todos lados.
- Cuando dudes, volvé al capítulo del tema antes que memorizar la respuesta.

---

## 15. Glosario

| Término | Qué es |
|---------|--------|
| **EIGRP** | Protocolo híbrido propietario de Cisco (IP 88, AD 90/170) |
| **DUAL** | Algoritmo de EIGRP: successors + feasible successors, estados Passive/Active |
| **FD** | Feasible Distance: métrica total del mejor camino (la que va a la tabla) |
| **RD** | Reported Distance: la métrica que reporta el vecino candidato |
| **Successor** | El vecino con el mejor camino (plan A) |
| **Feasible Successor** | Vecino con RD < FD (plan B garantizado sin bucles) |
| **RTP** | Reliable Transport Protocol: transporte confiable con ACKs de EIGRP |
| **K-values** | Pesos de la métrica (K1 BW, K3 Delay por defecto); iguales en todo el dominio |
| **Variance** | Balanceo de carga desigual (rutas hasta N× la métrica del successor) |
| **224.0.0.10** | Multicast de vecinos EIGRP |
| **AS de EIGRP** | Número interno (1-65535) que debe coincidir entre vecinos; ≠ ASN de BGP |
| **Named mode / AF** | Modo moderno de config (router eigrp NOMBRE + address-family) |

Esta tabla es el diccionario del manual. Tiene dos columnas: el **término** y **qué es**, en una línea. Los primeros seis son los que aparecen en cualquier examen o entrevista; los últimos son los que ves cuando mirás un router de verdad o abrís una configuración.

Cómo usarla: si en un capítulo te cruzás con una palabra que no recordás, buscala acá antes de volver atrás. Y si un término no lo podés explicar con una frase propia, volvé al capítulo donde se usa: el glosario es un atajo de repaso, no un reemplazo de la explicación.

Una línea sobre las tres filas más densas:

- **FD y RD** son los dos números del paréntesis en `show ip eigrp topology` y de la condición del capítulo 4: el mío y el del vecino.
- **RTP** acá no tiene nada que ver con el RTP de la telefonía o del video: es el transporte confiable propio de EIGRP, el que acusa recibo.
- **Named mode / AF** son la misma cosa dicha de dos formas: el modo moderno de configurar, organizado por familias de direcciones.

### Resumen

- El glosario es el diccionario del manual: término y definición en una línea.
- Los seis primeros términos (EIGRP, DUAL, FD, RD, successor y feasible successor) son los de examen.
- FD es mi distancia, RD es la del vecino, y la condición RD < FD es la regla que garantiza el plan B.
- RTP en EIGRP es transporte confiable propio, no el protocolo de video.
- Si no podés explicar un término con tus palabras, volvé al capítulo donde aparece.

---

## 16. Resumen en 10 puntos

1. **EIGRP es el híbrido**: aprende por vecinos (DV) pero guarda estado y propaga solo cambios con ACK (LS), sin el mapa completo.
2. **DUAL es el corazón**: el plan B (feasible successor) se calcula ANTES de que falle el plan A → convergencia casi instantánea.
3. **La condición del feasible successor (RD < FD)** es la que verdaderamente evita bucles a costo cero — mejor que split horizon.
4. **La métrica mide BW mínimo + delay**, no saltos: 256 × (10^7/BW mín + delay/10), con K-values globales.
5. **AD 90** (interno) / **170** (externo): EIGRP gana ante OSPF (110) cuando ambos conocen la misma ruta.
6. **Hello 5 s / Hold 15 s**, multicast 224.0.0.10, IP protocolo 88, con RTP que acusa recibo.
7. **La tabla de topología** (show ip eigrp topology) es donde vive la inteligencia: successors + feasible successors + estado Passive/Active.
8. **variance** = balanceo de carga DESIGUAL: reparte el tráfico entre rutas de distinta métrica (proporcional), condición RD < FD incluida.
9. **Config clásica**: `router eigrp 100` + `network` con wildcard + `no auto-summary`; los K-values y el AS deben coincidir entre vecinos.
10. **EIGRP es Cisco-only**: en parque mixto o grandes redes, OSPF (abiertos) es la elección; la decisión es de entorno, no de fanatismo.

Leé esta lista como el índice al revés: cada punto condensa un capítulo. Los tres primeros son la identidad del protocolo (qué es, cómo piensa, por qué no hace bucles). Del cuarto al sexto son las piezas que se configuran y se muestran en pantalla. Del séptimo al noveno son las herramientas del día a día. El décimo es la decisión de arquitectura, la que se toma en una reunión y no en un laboratorio.

Si te llevás un solo punto, llevate el 2. Todo lo demás —la tabla de topología, `variance`, la velocidad de convergencia— es una consecuencia de esa idea: **la salida de emergencia se calcula antes de que haya emergencia**.

### Resumen

- El manual entero cabe en diez frases: híbrido, DUAL, condición RD < FD, métrica de BW y delay, y AD 90/170.
- Los tres primeros puntos son la identidad del protocolo; el resto son piezas y herramientas.
- La frase que resume EIGRP es que el plan B se calcula antes de que haga falta.
- Es un protocolo excelente en redes 100% Cisco y una mala idea en redes mixtas.
- Si entendiste por qué RD < FD garantiza que no hay bucle, entendiste EIGRP.

---

> **Fuente:** Documentación propia basada en RFC 7868 (EIGRP, info pública), CCNA 200-301 Official Cert Guide (W. Odom), Cisco IOS Configuration Guides y material educativo de redes.



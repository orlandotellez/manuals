# 38. OSPF Avanzado: DR/BDR, LSA y Multi-Área

**Las piezas que hacen que OSPF escale de 10 a 10.000 routers (y los tipos de LSA que examinan de verdad)**

Este manual continúa exactamente donde terminó el anterior. Si venís de ahí, ya sabés lo esencial: **OSPF** (*Open Shortest Path First*, "primero el camino más corto, y abierto") es un protocolo de **estado de enlace**, cada router publica su pedacito de red en un mensaje llamado **LSA** (*Link-State Advertisement*, anuncio de estado de enlace), todos juntan esos anuncios en una base de datos común llamada **LSDB** (*Link-State Database*, base de datos de estado de enlace) y cada uno calcula su árbol de caminos con el algoritmo **SPF** (*Shortest Path First*, el famoso Dijkstra).

Si no venís de ahí, no pasa nada: acá volvemos a explicar cada pieza cuando aparece. Pero conviene tener a mano estas cinco ideas, porque todo el manual se apoya en ellas:

- Un **router** es el equipo que decide por dónde sale cada paquete. En OSPF, cada router se identifica con un nombre único llamado **Router ID** (RID), que suele ser la dirección IP de una interfaz de loopback.
- Un **vecino** es otro router con el que comparto un cable o un switch y con el que me hablo OSPF. La conversación empieza con un saludo llamado **Hello**.
- Una **adyacencia** es el nivel máximo de esa relación: dos routers que ya se sincronizaron la LSDB completa. En las salidas de comandos aparece con el estado `Full`.
- Una **interfaz** es la pata del router: el conector por donde entra y sale el cable. Cada interfaz tiene una dirección **IP** (*Internet Protocol*) y un **costo**, que es el número con el que OSPF mide qué tan bueno es ese enlace.
- Un **área** es un grupo de routers que comparten la misma LSDB. El **área 0** (o *backbone*, "columna vertebral") es la central.

En el manual anterior configuraste OSPF con **todos los routers en el área 0**. Eso se llama **single-area**: una sola área para todo. Funcionó, los vecinos quedaron en `Full`, aparecieron las rutas marcadas con `O` en la tabla y el ping anduvo. La red era chica, entonces nunca te chocaste con las preguntas incómodas. Y este manual es, literalmente, el manual de las preguntas incómodas:

> - Si meto 50 routers en el mismo segmento Ethernet, ¿cada uno tiene que ser vecino de los otros 49? (49 adyacencias por router y 1.225 pares en total...)
> - ¿Qué contiene EXACTAMENTE la LSDB? ¿Cómo viaja "el pedacito de cada router"?
> - ¿Cómo se conectan dos áreas grandes SIN pasar toda la información de una a otra?
> - ¿Qué pasa cuando quiero traer rutas de OTRO protocolo (EIGRP, BGP, estáticas) a OSPF?

> (El original de este manual decía "45 adyacencias por router": la cuenta correcta con 50 routers es 49 vecinos por router.)

Ese es este manual: **las respuestas a esas cuatro preguntas**. Las cuatro respuestas tienen nombre propio: **DR/BDR** (*Designated Router* y *Backup Designated Router*: los routers que hablan en nombre de un segmento), los **tipos de LSA** (los distintos mensajes que arman el mapa), **multi-área con ABR** (*Area Border Router*: el router de frontera que divide el mapa en provincias) y **redistribución con ASBR** (*Autonomous System Boundary Router*: la puerta por donde entra lo que no es OSPF). Las siglas te las defino a medida que aparecen, no todas de golpe.

Y dos nombres más que aparecen en las preguntas: **EIGRP** (*Enhanced Interior Gateway Routing Protocol*, el protocolo híbrido de Cisco) y **BGP** (*Border Gateway Protocol*, el protocolo que se usa entre organizaciones distintas). Los dos tienen su propio manual más adelante en la serie; acá solo son ejemplos de "otro protocolo" del que pueden venir rutas.

Una aclaración de vocabulario antes de arrancar, porque la vas a ver en todos los capítulos: **escalar** significa que algo sigue funcionando cuando crece. Una red de 10 routers que anda bien no prueba nada; la pregunta es si la misma receta aguanta 1.000. Casi todo lo que viene en este manual existe por una sola razón: hacer que OSPF siga siendo usable cuando la red deja de ser un laboratorio.

> **Analogía:** con OSPF aprendiste a manejar un auto en una ciudad chica. Este es el manual de la RUTA NACIONAL: autopistas con peajes (DR/BDR), los tipos de cartel que existen (LSA), cómo se dividen las provincias (áreas) y cómo se entra a otra red de caminos (ASBR). Mismo auto, reglas más grandes.

Una última cosa sobre el método: este manual no reemplaza al anterior, lo estira. Cada vez que veas una pieza nueva, va a estar conectada con algo que ya viste: el Hello del manual anterior, el costo, el Router ID, la LSDB. Si en algún momento te perdés, volvé al manual 37 y buscá la pieza; acá siempre vas a encontrar cómo encaja.

---

## Índice

- [Lo que viene después del single-area: la escalabilidad](#1-lo-que-viene-después-del-single-area-la-escalabilidad)
- [DR y BDR: el representante del segmento](#2-dr-y-bdr-el-representante-del-segmento)
- [La elección: quién se vuelve DR (la prioridad que todo el mundo calcula mal)](#3-la-elección-quién-se-vuelve-dr-la-prioridad-que-todo-el-mundo-calcula-mal)
- [Los tipos de LSA: los mensajes que arman el mapa](#4-los-tipos-de-lsa-los-mensajes-que-arman-el-mapa)
- [Multi-área: el aplanamiento del mapa](#5-multi-área-el-aplanamiento-del-mapa)
- [ABR y ASBR: los dos roles que hay que saber](#6-abr-y-asbr-los-dos-roles-que-hay-que-saber)
- [Tipos de área especiales: stub, totally stubby y NSSA](#7-tipos-de-área-especiales-stub-totally-stubby-y-nssa)
- [Sumarización: la ruta que condensa miles](#8-sumarización-la-ruta-que-condensa-miles)
- [Configuración de multi-área: la receta completa](#9-configuración-de-multi-área-la-receta-completa)
- [Verificación avanzada: los comandos que revelan todo](#10-verificación-avanzada-los-comandos-que-revelan-todo)
- [Los 5 errores avanzados más comunes](#11-los-5-errores-avanzados-más-comunes)
- [Comprobá lo que aprendiste](#12-comprobá-lo-que-aprendiste)
- [Glosario](#13-glosario)
- [Resumen en 10 puntos](#14-resumen-en-10-puntos)

Cómo usar este índice: cada título es un capítulo y también es la dirección (la URL) con la que se publica la página, así que no cambian nunca. Si tenés poco tiempo, el camino corto es el 2 (por qué existe el DR), el 4 (qué contiene la LSDB), el 5 (cómo se dividen las áreas) y el 10 (cómo se verifica todo). Con esos cuatro entendés la idea general; el resto es la letra chica, que es justamente la que se toma en los exámenes.

Un aviso sobre el orden: los capítulos van de lo más chico a lo más grande. Primero el problema de un solo cable con muchos routers (DR/BDR), después los mensajes que arman el mapa (LSA), después el mapa entero dividido en áreas, y al final la configuración y la verificación de todo junto. No saltees el 4: sin entender qué es un LSA, el 5 y el 8 se vuelven sopa de letras.

### Resumen

- Este manual responde cuatro preguntas que el OSPF de una sola área no responde.
- Las respuestas se llaman DR/BDR, tipos de LSA, multi-área con ABR y redistribución con ASBR.
- Escalar significa seguir funcionando cuando la red crece, no andar bien con diez routers.
- El orden del manual va de lo chico a lo grande: un segmento, el mapa, las áreas, la configuración.

---

## 1. Lo que viene después del single-area: la escalabilidad

### 1.1. Lo que ya sabés, en cinco renglones

Repaso rápido, para que el punto de partida sea el mismo para todos. En el manual anterior viste que OSPF:

- Descubre vecinos mandando **Hellos** cada pocos segundos por cada interfaz. Si un Hello deja de llegar durante el tiempo llamado **Dead timer**, el vecino se declara muerto.
- Identifica cada router con un **Router ID**: un número de 32 bits escrito como dirección IP, único en el dominio OSPF.
- Mide los caminos con un **costo** por interfaz. El costo sale de dividir una **banda de referencia** (por defecto, 100 Mbps) por el ancho de banda del enlace. Menos costo, mejor camino.
- Junta los anuncios de todos en la **LSDB**, que es idéntica en todos los routers del área.
- Calcula con **SPF** el árbol de caminos más cortos desde él mismo hacia todo lo demás, y de ahí salen las rutas marcadas con `O`.

Y todo eso lo hiciste con una sola área: el área 0. Ese diseño se llama **single-area** y es perfectamente válido... mientras la red sea chica. El problema no es el protocolo: es el tamaño del mapa.

### 1.2. Las cuatro preguntas que aparecen cuando la red crece

Cuando la red pasa de 10 routers a 100, y de 100 a 1.000, aparecen cuatro preguntas que en el laboratorio chico no existían:

1. **La pregunta del cable compartido.** En un mismo segmento Ethernet puede haber decenas de routers. ¿Cada uno tiene que mantener una adyacencia `Full` con todos los demás? Si son 50, cada router tendría 49 vecinos sincronizados y cada cambio se anunciaría 49 veces. Eso no escala: se resuelve con **DR/BDR** (capítulo 2).
2. **La pregunta del contenido.** ¿Qué hay exactamente adentro de la LSDB? No es "un mapa" en abstracto: son mensajes concretos, de distintos tipos, cada uno con un generador identificado. Eso son los **tipos de LSA** (capítulo 4).
3. **La pregunta de la frontera.** ¿Cómo conecto dos redes grandes sin que la LSDB de una se mezcle con la de la otra? Se resuelve partiendo el mapa en **áreas** y poniendo un router de frontera, el **ABR** (capítulos 5, 6, 7, 9).
4. **La pregunta de afuera.** ¿Cómo traigo a OSPF rutas que aprendió otro protocolo (EIGRP, BGP) o rutas estáticas? Se resuelve con **redistribución**, y el router que la hace se llama **ASBR** (capítulos 6 y 7; la redistribución en sí tiene su propio manual en la serie).

Fijate el patrón: las cuatro preguntas son la misma pregunta disfrazada. "¿Cómo hago que el mapa no crezca sin control?". El DR reduce la cantidad de conversaciones; el LSA bien tipado permite resumir; el área reduce la cantidad de mapa que cada router guarda; el ASBR marca con una etiqueta clara lo que vino de afuera. Todo apunta a lo mismo: que el costo de mantener el mapa no crezca más rápido que la red.

### 1.3. Qué vas a poder hacer al terminar

- Explicar por qué un segmento con muchos routers elige un **DR** y un **BDR**, y por qué los demás quedan en `2-Way` sin que eso sea un error.
- Leer una salida de `show ip ospf database` y decir de qué tipo es cada línea y quién la generó.
- Diseñar en papel un OSPF de dos áreas con un ABR, configurarlo y verificar que el ABR tiene un pie en cada área.
- Decidir cuándo conviene un área **stub**, una **totally stubby** o una **NSSA**, y saber dónde va cada comando.
- Resumir redes con `area N range` sin crear rutas fantasma.
- Diagnosticar los cinco errores clásicos de los laboratorios multi-área.

> **Analogía:** el single-area es una escuela con una sola aula: todos se conocen, todos escuchan todo. Cuando la escuela crece a 40 aulas, no podés poner a los 1.200 alumnos en una ronda de presentación. Necesitás delegados por aula (DR/BDR), un boletín con el resumen de cada aula (LSA de resumen), una dirección que conecte las aulas (área 0) y una secretaría que reciba documentos de afuera (ASBR). La escuela es la misma; lo que cambia es la organización.

### Resumen

- El OSPF de una sola área funciona, pero el mapa crece con la red y el costo también.
- Cuatro problemas nuevos: demasiadas adyacencias, contenido del mapa, frontera entre zonas y rutas externas.
- Cada problema tiene su pieza: DR/BDR, tipos de LSA, ABR/áreas y ASBR/redistribución.
- Todas las piezas persiguen lo mismo: que el costo de mantener el mapa no explote.
- Al terminar vas a poder diseñar, configurar y diagnosticar un OSPF de varias áreas.

---

## 2. DR y BDR: el representante del segmento

### 2.1. El problema que resuelven

Empecemos por el escenario más común de todos: varios routers conectados al mismo **switch**, es decir, al mismo segmento Ethernet. Un **segmento Ethernet** es un medio compartido: todos los equipos enchufados ahí se escuchan entre sí sin pasar por un router. Es lo que hay en el aula, en la oficina, en el laboratorio de Packet Tracer cuando ponés seis routers a un switch.

OSPF, en un medio así, tiene una tentación peligrosa: que todos hablen con todos. Y "todos con todos" significa una adyacencia `Full` por cada par de routers. La cuenta es la de siempre: con **N** routers, hay **N × (N − 1) / 2** pares. Con 6 routers son 15 pares; con 50 routers son 1.225 pares. Cada par es una conversación completa, con su LSDB sincronizada y su tráfico de mantenimiento.

```text
       sin DR (el infierno de las adyacencias)
       R1─┬─R2─┬─R3
          │    │
       R4─┴─R5─┴─R6
       Cada router = vecino de los otros 5 = 15 adyacencias
       Cada cambio = flood a 5 vecinos = mucho tráfico y CPU
```

Este dibujo muestra el problema en seis routers y vale la pena leerlo despacio, porque es el retrato del desastre. Arriba, el título: "sin DR", o sea, el infierno de las adyacencias. En el medio, el dibujo de la malla: los seis routers conectados al mismo switch, dibujados como si cada uno tuviera un cable a cada otro. Abajo, las dos cuentas que importan: cada router mantiene cinco vecinos (los otros cinco), y el total de pares es quince. Y la última línea es la que duele: **cada cambio se anuncia a cinco vecinos**, y cada vecino lo reenvía a los otros cuatro, y así. Más routers significa más conversaciones, más CPU, más memoria y más ancho de banda del segmento ocupado en algo que no es tráfico de usuarios.

Hacé la cuenta con 50 routers y te dan ganas de llorar: 1.225 adyacencias, cada una con sus Hellos cada 10 segundos y su sincronización de LSDB. El switch, además, tiene que llevar todos esos mensajes a todos los puertos. No es que OSPF esté mal diseñado: es que el diseño "todos con todos" no tiene sentido en un medio donde todos se escuchan de todos modos.

Con **DR** (*Designated Router*, router designado) y **BDR** (*Backup Designated Router*, router designado de respaldo) la cosa cambia:

```text
            DR = R3 (el representante)
         ┌─────────────────────────┐
       R1─┤                        ├─R2
          │  adyacencias FULL solo │
       R4─┤  con DR y BDR          ├─R5
          └─────────────────────────┘
            BDR = R5 (el suplente)
       DROthers (R1,R2,R4,R6) quedan en 2-Way entre sí
       Adyacencias: cada router con DR + con BDR = mucho menos
```

Este segundo dibujo es la solución, y se lee igual que el anterior, línea por línea. Arriba, el DR es R3: el representante elegido. En el medio, el rectángulo dice lo único que hay que entender: las adyacencias `Full` van **solo con el DR y con el BDR**, no entre todos. Abajo, el BDR es R5, el suplente que está al día por si el representante se cae. Después viene la línea clave: los **DROthers** (los routers que no son ni DR ni BDR: acá R1, R2, R4 y R6) quedan en estado `2-Way` entre sí, y eso es correcto, no un error. Y la última línea cierra la cuenta: cada router mantiene adyacencia con el DR y con el BDR, nada más.

Pensemos el resultado en números: con seis routers y DR/BDR, las adyacencias `Full` son las de cada router con R3 y con R5, o sea un puñado, en lugar de quince pares completos. Y cuando algo cambia, el que avisa es el DR, no cada uno de los seis.

> **Analogía:** el DR es el **representante del curso**. En un aula de 40 alumnos, la dirección no quiere 40 informes ni una reunión donde todos hablen con todos: quiere que los alumnos le cuenten al **delegado**, y que el delegado lleve un solo informe a la reunión de delegados. El delegado escucha a todos, arma el resumen, y lo presenta. Si el delegado se enferma, el **subdelegado** (el BDR), que estuvo en todas las reuniones tomando nota, lo reemplaza sin que nadie tenga que volver a contar nada. Y los alumnos no necesitan hablar entre ellos para estar informados: alcanza con hablar con el delegado.

**Las reglas de oro del DR (memorizá estas tres, son las que examinan):**

| Regla | Detalle |
|-------|---------|
| **El DR se sincroniza con TODOS** | Todos forman adyacencia `Full` con el DR (y con el BDR) |
| **Los DROthers no forman Full entre ellos** | Quedan en **2-Way** — y eso es SALUDABLE, no un problema |
| **El DR reemplaza al hub** | En Ethernet, el DR es el "hub": todos hablan con él, y él con todos (multicast 224.0.0.6 solo DR/BDR) |

Esta tabla son las tres reglas que hay que poder recitar sin pensar. Cómo leerla: la columna **Regla** es la frase corta y la columna **Detalle** explica qué significa en la práctica.

- **Primera fila**: el DR (y el BDR) forman adyacencia `Full` con todos los routers del segmento. En la práctica, cuando mirás `show ip ospf neighbor` en un DROther, vas a ver al DR y al BDR en `FULL`, y a los otros DROthers en `2-Way`.
- **Segunda fila**: los DROthers **no** se sincronizan entre ellos. Quedan en `2-Way`, que es un estado en el que se conocen y se saludan pero no intercambian la base de datos completa. Mucha gente ve `2-Way` y sale corriendo a buscar el error. No hay error: en un segmento con DR, `2-Way` entre DROthers es la prueba de que el diseño está funcionando.
- **Tercera fila**: el DR hace de concentrador lógico. El detalle menciona la dirección **multicast** `224.0.0.6`, que es la dirección de grupo **AllDRouters** ("todos los DR"). Un multicast es una dirección de destino que llega a un grupo de equipos, no a uno solo. En OSPF hay dos grupos: `224.0.0.5` (**AllSPFRouters**, todos los routers OSPF) y `224.0.0.6` (solo los DR y BDR). El capítulo 3.3 vuelve sobre esto, porque es donde más se confunde.

Hay un detalle práctico que conviene decir acá: en un enlace punto a punto (un cable entre dos routers, sin switch en el medio), no hay DR ni BDR, porque no hay nada que centralizar. El DR/BDR es un mecanismo para **medios compartidos** donde varios routers se escuchan entre sí. En un cable de a dos, los dos hablan entre ellos y listo.

### 2.2. Qué pasa si el DR se cae

El **BDR** ya estaba en `Full` con todos: tenía la LSDB sincronizada, al día, igual que el DR. Cuando el DR muere (porque se cayó el equipo, porque se cortó el cable o porque venció el **Dead timer**, el contador que mide cuánto tiempo puede pasar sin recibir un Hello antes de declarar muerto al vecino), el BDR **se convierte en DR** sin re-elección de todo el segmento, porque ya estaba al día. Y después se elige un BDR nuevo entre los DROthers. Eso es "convergencia rápida de OSPF hecha diseño": el backup de LSA ya está listo, no hay que re-sincronizar nada.

Fijate lo que eso significa en tiempo: no hay que esperar a que los routers vuelvan a intercambiar bases de datos enteras. El que toma el mando ya tiene la misma información, así que el segmento sigue funcionando con la misma LSDB que tenía un segundo antes. El único trabajo nuevo es elegir un suplente para el nuevo DR.

> **Cuidado (el mito que todos repiten):** "Si el DR se cae, se elige el DROther con mayor prioridad." MAL. El **BDR es quien sube** (siempre tiene la LSDB al día); recién después se elige un BDR nuevo entre los DROthers. El DR no se "reelige": se REEMPLAZA por el BDR que estaba esperando.

Guardá esta corrección con nombre y apellido, porque es la pregunta trampa más común del tema. La intuición equivocada es pensar que el segmento hace una elección nueva y gana el de mayor prioridad; en realidad hay una sucesión ordenada: el BDR asciende (es su trabajo), y el puesto de BDR queda vacante y se elige entre los DROthers.

> **Analogía:** el subdelegado no compite con los alumnos el día que el delegado falta: **asume él**, porque para eso fue elegido y para eso fue a todas las reuniones. Después, el curso elige un subdelegado nuevo. Si el subdelegado también falta, ahí sí hay que elegir a los dos de cero, y ese es el único caso donde la prioridad de todos vuelve a decidir.

### Resumen

- En un segmento compartido, "todos con todos" no escala: con 6 routers son 15 pares y con 50 son 1.225.
- El DR centraliza: todos se sincronizan con el DR y con el BDR; los DROthers quedan en `2-Way` entre sí.
- `2-Way` entre DROthers es sano, no es un error de configuración.
- Si el DR cae, sube el BDR (que ya tiene la LSDB al día) y recién después se elige un BDR nuevo.
- En un enlace punto a punto no hay DR ni BDR: no hay nada que centralizar.

---

## 3. La elección: quién se vuelve DR (la prioridad que todo el mundo calcula mal)

### 3.1. Los criterios, en orden

Cuando un segmento broadcast despierta (los routers empiezan a mandar Hellos y se descubren), los routers eligen al DR y al BDR con un orden de criterios muy preciso. Si te aprendés el orden, no te equivocás nunca:

```text
1. Mayor PRIORIDAD (interface)          → `ip ospf priority X` (0-255, default 1)
2. Si empatan: mayor ROUTER ID          → el RID más alto gana
3. Regla implícita: lo que es DR, sigue siendo DR
   ("el que está, está": no hay re-elección salvo caída)
```

Este bloque son los tres criterios de la elección, en el orden en que se aplican. Leelo como un árbitro que va descartando:

- **Criterio 1, la prioridad**: cada interfaz tiene un valor de prioridad OSPF que se configura con `ip ospf priority X`, va de 0 a 255 y por defecto vale 1. Gana el router con la prioridad más alta **en esa interfaz**. La prioridad es por interfaz, no por router: un mismo equipo puede ser DR en un segmento y DROther en otro.
- **Criterio 2, el desempate**: si dos routers tienen la misma prioridad, gana el que tenga el **Router ID** más alto. El RID es el número de 32 bits que identifica al router en OSPF, y se compara como número, no como texto.
- **Criterio 3, la inercia**: si ya hay un DR funcionando, no se vuelve a elegir. Lo que está, sigue estando. Este criterio no se configura: es una regla del protocolo y es la causa del 90% de los dolores de cabeza del laboratorio (lo vemos en 3.2).

Dos valores de prioridad merecen un comentario aparte, porque son los que se usan a propósito:

- **Priority 0** = "nunca quiero ser DR ni BDR". No es un valor inútil: es una herramienta de diseño. Se usa en routers que no querés que concentren tráfico, por ejemplo un router viejo o uno que solo está de paso. Queda como DROther y participa de todo, pero no toma el mando.
- **Priority 255** = "quiero ser DR, por favor". Es el valor máximo y se usa en el router que sí querés que centralice, típicamente el más potente o el que está en el centro de la topología.

Y hay un dato que sorprende: la prioridad **no** se puede cambiar "un poquito" para ajustar el balanceo. Si dos routers tienen prioridad 10 y 20, el de 20 gana siempre. La prioridad es un desempate binario por posición, no un peso.

### 3.2. El detalle que rompe a todos en los labs

> **La elección OSPF es NO PREEMPTIVA.** Si configurás prioridad 200 en R4 DESPUÉS de que R3 ya ganó como DR... R3 sigue siendo DR. La elección ocurre UNA vez (cuando el segmento forma las primeras adyacencias), y no se repite hasta que el DR se cae o reiniciás el proceso OSPF.

**No preemptiva** quiere decir que el nuevo no desplaza al que ya está. Es lo contrario de lo que la intuición sugiere: uno configura una prioridad más alta y espera que el router "tome el poder". No pasa. La elección ya ocurrió, y solo se repite cuando el DR actual desaparece (o cuando el proceso OSPF se reinicia).

Esto explica el 90% de los dolores de cabeza del laboratorio:

```text
"Configuré ip ospf priority 255 en R4 y sigue siendo DR R3... ¿bug de Packet Tracer?"
→ No es bug: la elección ya pasó. clear ip ospf process (o reiniciar) para re-elegir.
```

Este bloque es una conversación real de laboratorio, con la respuesta incluida. Arriba, la queja típica: configuré prioridad 255 en R4 y el DR sigue siendo R3, ¿es un bug del simulador? Abajo, la respuesta: no es un bug, la elección ya pasó, y para forzar una nueva hay que reiniciar el proceso OSPF con `clear ip ospf process` (o reiniciar el equipo). El comando `clear ip ospf process` borra el proceso y lo vuelve a levantar: las adyacencias se caen y se renegocian, y en esa renegociación sí se aplica la prioridad nueva.

Consecuencia práctica, y esto es importante: ese comando **corta la red un rato**. No lo tires en horario de producción. La forma prolija es configurar la prioridad **antes** de encender OSPF, o hacer el reinicio en una ventana de mantenimiento.

> **HACELO VOS:** para controlar QUIÉN es el DR de un segmento, configurá la prioridad ANTES de encender OSPF (o reiniciá el proceso después de cambiarla: `clear ip ospf process` — reinicia las vecindades, así que hacelo en ventana de mantenimiento).

Un truco de laboratorio que vale la pena: si querés forzar un DR distinto sin tocar prioridades, apagá y prendé OSPF **primero en el router que querés que gane**. Como la elección no es preemptiva, el primero que arranca suele quedarse con el puesto. Es sucio, pero es exactamente lo que pasa en la vida real cuando un equipo se reinicia.

### 3.3. Por qué los DROthers siguen escuchando 224.0.0.5

Acá conviene ordenar el tema de las direcciones multicast, porque es donde más se mezclan las cosas. Los **Hellos** los escucha todo el segmento: van a `224.0.0.5` (**AllSPFRouters**), y por eso cualquier router OSPF del segmento se entera de quién está vivo. Los **anuncios de estado de enlace** (los LSA) tienen un camino distinto: los DROthers le mandan sus novedades al DR por `224.0.0.6` (**AllDRouters**), y el DR las retransmite a todo el segmento por `224.0.0.5`. Así los DROthers escuchan el canal general y están al día de los cambios **sin tener adyacencia `Full` entre sí**. Listo: nadie se pierde nada, pero nadie paga el costo de adyacencia con todos.

> **Aviso sobre el original:** el texto de origen decía que "los LSA que genera el DR van al 224.0.0.6"; es al revés: el DR publica hacia `224.0.0.5` (todos) y los DROthers le envían sus novedades al DR por `224.0.0.6`. La dirección `224.0.0.6` es "solo DR/BDR" porque es el canal para hablar **con** el DR, no el canal por el que el DR habla.

Vale la pena quedarse con la idea de fondo, más allá de la dirección exacta: en un segmento con DR hay **dos canales**. Uno es la conversación general, donde todos escuchan (los Hellos y los anuncios que el DR replica). El otro es el canal de los representantes, donde se habla con el DR y el BDR. El DROther participa del primero como oyente y del segundo como cliente, y con eso le alcanza.

> **Analogía:** es la cartelera del aula y el buzón del delegado. La cartelera (el canal general) la lee todo el mundo, y ahí el delegado cuelga los comunicados que le llegaron. El buzón (el canal de los representantes) es donde cada alumno deja su papelito para el delegado. Nadie necesita juntarse con los otros 39 alumnos para estar informado: alcanza con leer la cartelera y dejar el papelito en el buzón.

### Resumen

- El DR se elige por prioridad de interfaz (0 a 255, por defecto 1) y, si empatan, por Router ID más alto.
- La elección es no preemptiva: el que ya es DR sigue siéndolo hasta que caiga o se reinicie el proceso.
- `clear ip ospf process` fuerza una nueva elección, pero corta las vecindades: es comando de ventana de mantenimiento.
- Prioridad 0 es "nunca DR" y 255 es "quiero ser DR": son decisiones de diseño, no caprichos.
- Los Hellos van a `224.0.0.5`; las novedades hacia el DR van a `224.0.0.6`; el DR replica a todos.

---

## 4. Los tipos de LSA: los mensajes que arman el mapa

### 4.1. La ficha de los que examinan (tipo 1 al 5)

Hasta acá dijimos "cada router publica su pedacito de red". Es hora de abrir el sobre y ver qué hay adentro. Cada **LSA** (*Link-State Advertisement*) es un mensaje con un formato fijo que contiene dos cosas: **quién lo generó** y **qué anuncia**. La **LSDB** es la colección de todos los LSA que ese router recibió, ordenados por tipo, por generador y por número de secuencia.

La clave para no perderse: **no hay un solo tipo de LSA, hay varios, y cada tipo responde a una pregunta distinta**. Un LSA tipo 1 no dice lo mismo que un tipo 3, y confundirlos es la causa de la mitad de los errores de lectura de la base de datos. La siguiente tabla es la ficha completa de los tipos que se examinan:

```text
┌────────┬──────────────────────────┬──────────────────────────────────────┐
│ Tipo   │ Nombre                   │ Qué contiene / quién lo genera        │
├────────┼──────────────────────────┼──────────────────────────────────────┤
│ T1     │ Router LSA               │ "Las interfaces de UN router"         │
│        │                          │ Cada router genera uno por área       │
│ T2     │ Network LSA              │ "Los routers de UN segmento"          │
│        │                          │ Lo genera el DR del segmento          │
│ T3     │ Network Summary          │ "Las redes de la OTRA área"           │
│        │                          │ Lo genera el ABR (resumen de área)    │
│ T4     │ ASBR Summary             │ "Cómo llegar al ASBR"                 │
│        │                          │ Lo genera el ABR                      │
│ T5     │ External (AS-external)   │ "Redes de FUERA de OSPF"              │
│        │                          │ Lo genera el ASBR (redistribución)    │
│ T7     │ NSSA External            │ "Redes externas dentro de NSSA"       │
│        │                          │ (raro pero aparece en exámenes)       │
└────────┴──────────────────────────┴──────────────────────────────────────┘
```

Esta tabla es el corazón del capítulo 4, así que vamos columna por columna y después fila por fila.

Las columnas: **Tipo** es el número con el que OSPF identifica el mensaje (en la LSDB y en los comandos aparece como "T1", "tipo 1" o directamente por nombre). **Nombre** es cómo se llama ese tipo en los libros y en las salidas de comandos. **Qué contiene / quién lo genera** es la parte que hay que entender, no memorizar: quién lo produce y qué información lleva.

Ahora las filas, que son las que hay que poder explicar:

- **T1, Router LSA**: lo genera **cada router**, uno por cada área en la que tiene interfaces. Contiene "las interfaces de UN router": sus enlaces, sus direcciones y el costo de cada uno. Es el ladrillo más básico: si un router no genera su T1, no existe en el mapa.
- **T2, Network LSA**: lo genera **el DR del segmento**. Contiene "los routers de UN segmento": la lista de routers conectados a ese medio compartido. Por eso el DR es importante también en la LSDB: es el que representa al segmento entero con un solo anuncio. Si no hay DR (enlace punto a punto), no hay T2.
- **T3, Network Summary**: lo genera el **ABR** (el router de frontera entre áreas, capítulo 6). Contiene "las redes de la OTRA área": es el resumen que un área le cuenta a las demás. Es el tipo que hace posible la multi-área: adentro del área no viaja el detalle, viaja el resumen.
- **T4, ASBR Summary**: también lo genera el **ABR**. Contiene "cómo llegar al ASBR": la ubicación del router que redistribuye rutas externas, para que los demás sepan por dónde salir hacia él. Es un LSA de "dirección", no de "red".
- **T5, External (AS-external)**: lo genera el **ASBR**. Contiene "redes de FUERA de OSPF": las que entraron por redistribución (una estática, una ruta de EIGRP, una ruta de BGP). Es el tipo que inunda **todo el dominio OSPF**, no solo un área, y por eso las áreas especiales del capítulo 7 existen para bloquearlo.
- **T7, NSSA External**: lo genera el **ASBR que está adentro de una NSSA** (un tipo especial de área que vemos en el capítulo 7). Contiene "redes externas dentro de NSSA", y es raro pero aparece en exámenes. La idea es la misma que el T5, pero encerrada en un área que no acepta T5 y que después traduce el ABR.

Un detalle que ayuda a ordenar la cabeza: fijate que los tipos vienen de a pares. **T1 y T2** describen lo que hay adentro de un área (routers y segmentos). **T3 y T4** describen lo que se cuenta hacia afuera (redes y routers de borde). **T5 y T7** describen lo que viene de otro mundo (rutas externas, una para el dominio entero y otra para un área especial). Si te acordás de los tres pares, no necesitás memorizar seis filas sueltas.

> **Analogía:** pensá en un edificio con varios pisos. El **T1** es el plano de cada oficina: "en este piso hay estas habitaciones". El **T2** es el cartel del pasillo: "en este piso están estas oficinas". El **T3** es el resumen que el encargado de cada piso manda a la recepción: "en el piso 3 hay un aula y una biblioteca", sin el plano de cada mueble. El **T4** es la dirección del encargado del piso, para saber a quién preguntarle. El **T5** es el aviso de lo que llegó de la calle: "entró un paquete de otra empresa". Y el **T7** es ese mismo aviso, pero anotado en un piso que no acepta avisos de la calle y que después se lo pasa a recepción para que lo anote en el libro general.

### 4.2. Cómo leerlos (el truco de la LSDB)

> **El patrón que desbloquea todo:** T1 y T2 son "dentro de tu área" (intra-area). T3 y T4 son "lo que el ABR resume de otras áreas" (inter-area). T5 es "lo que vino de afuera" (externo). Cuando veas un LSA en `show ip ospf database`, hacete la pregunta: ¿quién lo generó y para qué área? Con esa pregunta, la tabla de arriba te da la respuesta sola.

Ese patrón es la herramienta más útil de todo el manual, porque convierte una lista de seis tipos en una decisión de dos pasos: primero mirás **quién lo generó** (¿un router cualquiera? ¿el DR? ¿un ABR? ¿un ASBR?) y después mirás **qué alcance tiene** (¿mi área? ¿las otras áreas? ¿el dominio entero?). Con esas dos respuestas, el tipo sale solo.

Veamos cómo se ve en la práctica. La salida real de la base de datos es así:

```text
R1# show ip ospf database (resumen)

       Link ID         ADV Router      Age  Seq#       Type
10.0.1.0/30            2.2.2.2         123  0x80000006  Network   ← T2 (el DR, segmento)
10.0.2.0/30            3.3.3.3         95   0x80000004  Router    ← T1 (R3, su red)
192.168.1.0/24         5.5.5.5         400  0x80000008  External  ← T5 (ASBR, redistribuye)
```

Este bloque es una salida de `show ip ospf database` recortada a lo esencial, y es el tipo de cosa que hay que saber leer sin pánico. Vamos por partes.

La primera línea es el **prompt** (la invitación del equipo): `R1#` significa que estamos en el router R1, modo privilegiado (el `#`). El comando es `show ip ospf database`, y el `(resumen)` del final es la aclaración de que la salida está recortada: la real tiene más líneas.

Después viene la **fila de títulos**, que es la que hay que mirar primero en cualquier tabla de un router: **Link ID** (el identificador de lo anunciado), **ADV Router** (*advertising router*, el router que generó el LSA), **Age** (la edad del anuncio en segundos), **Seq#** (el número de secuencia) y **Type** (el tipo, que es lo que vimos en la tabla anterior).

Ahora las tres filas de datos, que es donde está la enseñanza:

- `10.0.1.0/30` anunciado por `2.2.2.2`, tipo **Network**: es un **T2**. El Link ID es la dirección de la red del segmento y el ADV Router es el router que lo generó, que en un T2 es siempre el DR. Leelo así: "el router 2.2.2.2, que es DR de ese segmento, dice que en la red 10.0.1.0/30 hay estos routers".
- `10.0.2.0/30` anunciado por `3.3.3.3`, tipo **Router**: es un **T1**. Acá el Link ID es el identificador del propio router que lo genera, no una red: en un T1, el Link ID es el Router ID del que lo emite. Leelo así: "el router 3.3.3.3 publica sus propias interfaces, entre ellas la 10.0.2.0/30".
- `192.168.1.0/24` anunciado por `5.5.5.5`, tipo **External**: es un **T5**. El Link ID es la red externa y el ADV Router es el ASBR que la redistribuyó. Leelo así: "el router 5.5.5.5 tomó la red 192.168.1.0/24 de otro protocolo o de una estática y la está anunciando adentro de OSPF".

Y el comentario de la derecha (la flecha con "T2", "T1", "T5") es la ayuda memoria: dice a qué tipo corresponde cada línea y por qué. Lo que tiene que ver un principiante en pantalla, entonces, es esto: **el campo Type y el campo ADV Router son los dos que hay que leer juntos**. Con esos dos sabés quién habla y de qué está hablando. El `Age` y el `Seq#` son para el diagnóstico fino (capítulo 4.3): si un LSA tiene edad muy alta o secuencia vieja, algo pasó con la inundación.

El T5 del ejemplo, con Link ID `192.168.1.0/24` y ADV Router `5.5.5.5`, te está diciendo: "esa red NO es OSPF nativa, vino de afuera por el router 5.5.5.5". Esa es la lectura que hay que poder hacer en voz alta.

### 4.3. El flood (cómo se propaga un LSA)

Recordá lo que viste en el enrutamiento dinámico: el flooding. **Flooding** (inundación) es el mecanismo por el cual un router le cuenta un cambio a todos los demás, sin tener una lista de destinatarios: le avisa a sus vecinos, y cada vecino lo reenvía a los suyos. En OSPF real, el recorrido de un LSA es este:

```text
1. R4 detecta un cambio → genera un LSA tipo 1
2. Se lo manda a los vecinos en FULL (al DR también)
3. Cad/Todo router que lo recibe: 1) lo copia a su LSDB,
   2) lo reenvía a todos los vecinos menos al que vino
4. Si llega un LSA repetido (mismo Seq#) → se descarta (inundación finita)
5. Cada router corre SPF y actualiza su tabla
```

Este bloque son los cinco pasos de la inundación, y conviene seguirlos en orden porque cada uno tiene una consecuencia.

- **Paso 1**: un router detecta un cambio (se cayó una interfaz, apareció una red, cambió un costo) y genera un **LSA tipo 1** nuevo, con su Router ID y un número de secuencia más alto que el anterior.
- **Paso 2**: se lo manda a sus vecinos que están en `Full`, incluido el DR si está en un segmento con DR. Los vecinos en `2-Way` no reciben la actualización completa: para eso está el DR.
- **Paso 3**: cada router que lo recibe hace dos cosas, en este orden. Primero **lo copia a su LSDB** (si es más nuevo que el que tenía). Después **lo reenvía a todos sus vecinos menos al que se lo mandó**. Ese "menos al que vino" es la regla que evita el rebote inmediato y la que hace que la inundación sea un árbol y no un círculo.
- **Paso 4**: si llega un LSA repetido (mismo número de secuencia), se descarta. La inundación es **finita**: no hay forma de que un LSA dé vueltas para siempre.
- **Paso 5**: con la LSDB actualizada, cada router corre **SPF** y actualiza su tabla de rutas. Todos recalculan, cada uno por su cuenta, sobre la misma información.

Ese último paso es la diferencia de fondo con los protocolos de rumores que viste en el manual 36. Ahí la noticia avanzaba de a un router por ronda de actualización y podía "contar hasta el infinito" porque nadie tenía el mapa. Acá no: el LSA lleva la verdad del router que la vivió (su propia interfaz se cayó), llega a todos en paralelo, y todos recalculan sobre el mismo mapa. No hay rumor que devolver, porque nadie está contando lo que le contaron: cada uno está contando lo que le pasa a él.

El **Seq#** (número de secuencia) es lo que hace al flood FINITO: cada LSA nuevo tiene un numero más alto, y los duplicados se tiran. Sin eso, el LSA daría vueltas para siempre (el fantasma del count to infinity, pero del lado link-state — OSPF lo resuelve de raíz). El número de secuencia es un contador que arranca en un valor inicial y sube de a uno con cada versión del anuncio; cuando llega al máximo, el router tiene que hacer una maniobra especial para reiniciarlo, que es un detalle de implementación que no hace falta para entender el concepto.

> **Dato de examen clásico:** la edad (Age) del LSA sube con el tiempo; si un LSA viejo (Age alto) llega opacado por uno nuevo, se descarta el viejo. La **LSDB siempre gana con el LSA más nuevo**. Esa es la regla de oro del flood.

Cuando dos versiones del mismo LSA compiten, OSPF decide cuál gana con una comparación ordenada: primero el número de secuencia, después el checksum, después la edad. En la práctica, para un principiante, alcanza con la regla simplificada: **el más nuevo gana, el más viejo se descarta**. Y "más nuevo" se mide por la secuencia, no por el reloj del router. Ese es el motivo por el que la edad (Age) existe: además de comparar versiones, sirve para que un LSA que nadie renovó no quede para siempre en la base. Cuando la edad llega al máximo, el LSA se considera viejo y se pide una versión nueva.

> **Analogía:** el flood es el grupo de mensajes de un edificio. Alguien descubre una pérdida de agua en el segundo piso y avisa a sus vecinos de piso. Cada uno lo cuenta al piso de al lado, pero no se lo devuelve al que se lo contó (paso 3). Si alguien recibe el mismo aviso dos veces, no lo vuelve a contar (paso 4). Y todos anotan la novedad en el mismo libro de actas, con número de página (la secuencia): si llega una página vieja, se ignora. Al final todos tienen la misma acta, y cada uno decide por su cuenta cómo salir del edificio (el SPF).

### Resumen

- Un LSA es un mensaje con dos datos: quién lo generó y qué anuncia. La LSDB es la colección de todos.
- T1 y T2 son de adentro del área; T3 y T4 los genera el ABR; T5 y T7 son externos.
- En `show ip ospf database`, los campos que se leen juntos son Type y ADV Router.
- El flood copia, reenvía a todos menos al que vino, descarta duplicados y termina con SPF local.
- El número de secuencia hace la inundación finita: la versión más nueva gana y el viejo se descarta.

---

## 5. Multi-área: el aplanamiento del mapa

### 5.1. Por qué una sola área no escala

Con single-area, TODOS los routers comparten la MISMA LSDB: el mapa completo. Eso suena democrático y es un problema de recursos. Con 500 routers y 2.000 redes, cada router guarda 2.000+ LSA y corre SPF sobre todo eso. Cada cambio en cualquier lado (una interfaz que se cae en el otro extremo del edificio) obliga a **todos** los routers a recalcular el árbol completo.

Pongámoslo en tres monedas, como en el manual 36:

- **Memoria**: cada router guarda la LSDB entera. Más redes, más LSA, más RAM.
- **Procesador**: cada cambio dispara un SPF completo. En una red grande, un enlace inestable puede hacer recalcular a 500 routers varias veces por minuto.
- **Ancho de banda**: cada LSA nuevo se inunda a toda el área. Un cambio en un extremo llega al otro extremo aunque nadie lo necesite.

Y hay un cuarto costo, menos visible pero igual de real: **el riesgo**. Cuanto más grande es la LSDB, más fácil es que una versión distinta de un LSA quede dando vueltas y que dos routers tengan mapas ligeramente diferentes. Todo lo que reduce el tamaño del mapa reduce también ese riesgo.

### 5.2. La solución: dividir el mapa en provincias

La solución es la misma que usaron los países para gobernar territorios grandes: dividir en provincias, con una capital que las conecta. En OSPF, las provincias se llaman **áreas** y la capital es el **área 0**.

```text
                ÁREA 0 (backbone)
        ┌──────────────────────────────┐
        │  R1 ──── R2 ──── ABR1 ──────│──┐
        │  R9 ──── R10 ─── ABR2 ──────│──│──┐
        └──────────────────────────────┘  │  │
               ┌──────────────────┐       │  │
               │  ÁREA 1 (R6,R7)  │◄──────┘  │
               └──────────────────┘          │
                    ┌──────────────────┐     │
                    │ ÁREA 2 (R8,R11)  │◄────┘
                    └──────────────────┘
```

Este dibujo es el mapa de una red multi-área, y hay que leerlo en tres niveles. Arriba, el recuadro grande es el **ÁREA 0 (backbone)**: la columna vertebral. Adentro están R1, R2, R9, R10 y los dos routers de frontera, ABR1 y ABR2. En el medio, a la izquierda, el **ÁREA 1** con R6 y R7, conectada al backbone a través de ABR1. Abajo a la derecha, el **ÁREA 2** con R8 y R11, conectada a través de ABR2.

Lo importante no es la cantidad de routers: son las **dos fronteras**. ABR1 tiene una pata en el área 0 y otra en el área 1; ABR2 tiene una pata en el área 0 y otra en el área 2. Esos dos routers son los únicos que conocen las dos LSDB, y por eso son los únicos que pueden resumir una para la otra. Fijate también que el área 1 y el área 2 **no se tocan**: todo lo que va de una a otra pasa por el área 0. Eso no es un dibujo caprichoso, es una regla del protocolo.

**Las reglas de oro de multi-área (las que rigen TODO el diseño):**

| Regla | Por qué |
|-------|---------|
| **El área 0 es OBLIGATORIA** (backbone) | Todas las áreas se conectan al backbone; sin él no hay diseño válido |
| **Un ABR separa las LSDB** | Los routers de área 1 NO reciben los LSA internos del área 2: reciben un RESUMEN (T3) |
| **El tráfico entre áreas SIEMPRE pasa por el área 0** | Por diseño del protocolo: los T3 viajan por el backbone |
| **Un router en single-area = toda su OSPF en el área 0** | El single-area ya era multi-área en potencia: solo que con un área |

Esta tabla son las cuatro reglas que gobiernan cualquier diseño multi-área. Dos columnas: la **regla** y el **por qué**. Vamos una por una, porque cada una explica una decisión de diseño que después se ve en la configuración.

- **El área 0 es obligatoria.** Todas las áreas se conectan al backbone. Si un área no toca el área 0, el diseño es inválido: los resúmenes viajan por el backbone y sin backbone no hay camino entre provincias. Existe una excepción (los enlaces virtuales) que es material de manual avanzado y que en la práctica se evita.
- **Un ABR separa las LSDB.** Los routers del área 1 **no** reciben los LSA internos del área 2: reciben un resumen, el T3. Esa es la magia y el costo: adentro del área 1, la red del área 2 se ve como "una o dos rutas resumidas", no como la topología completa.
- **El tráfico entre áreas siempre pasa por el área 0.** Es una consecuencia del punto anterior: como el detalle no cruza, el camino entre áreas se arma con los resúmenes que publica cada ABR, y esos resúmenes viven en el backbone. Si armás un atajo entre dos áreas que no pasa por el área 0, OSPF no lo va a usar.
- **Un router en single-area es toda su OSPF en el área 0.** El single-area que configuraste en el manual anterior ya era multi-área en potencia: solo que con una sola provincia. No hay que "migrar" nada raro: se agregan áreas y se mueven interfaces.

> **El beneficio invisible pero gigante:** el SPF se corre **por área** en cada router. Un router del área 1 solo corre SPF sobre SU área + los resúmenes (T3) del resto. La CPU, la memoria y el ancho de banda del flood caen en picada. OSPF multi-área no es "una opción de diseño": es el mecanismo de escalabilidad del protocolo.

Vale la pena ponerle números al beneficio, aunque sean redondos. Si el área 1 tiene 50 routers y el resto de la red tiene 450, un router del área 1 corre SPF sobre 50 nodos y un puñado de resúmenes, en lugar de sobre 500. Y si un enlace del área 2 se cae, el flood no entra al área 1: el ABR del área 2 recalcula y, si el resumen cambia, publica un T3 nuevo. Los routers del área 1 se enteran de que "cambió una ruta de afuera", no de qué cable se cortó.

> **Analogía:** el correo de un país grande no manda a cada oficina el listado de todas las calles del país. Cada provincia tiene su guía de calles (su LSDB), y entre provincias circula un **resumen**: "para llegar a la provincia X, mandá todo a la central de X". Si se cierra una calle adentro de X, solo la guía de X cambia; las otras provincias no se enteran del detalle, y no lo necesitan.

### Resumen

- Una sola área obliga a todos los routers a guardar y recalcular el mapa completo.
- Las áreas dividen el mapa: cada una tiene su LSDB y su propio cálculo de SPF.
- El ABR es el router con un pie en cada área y el único que resume una para la otra.
- El área 0 es obligatoria y todo el tráfico entre áreas pasa por ella.
- El beneficio se paga en diseño: menos memoria, menos CPU y menos flood por router.

---

## 6. ABR y ASBR: los dos roles que hay que saber

### 6.1. Los tipos de router OSPF

En OSPF no todos los routers son iguales. Hay tres roles, y un router puede tener más de uno a la vez. El dibujo clásico los muestra así:

```text
┌────────────────┐   ┌────────────────┐   ┌────────────────┐
│ Internal       │   │ ABR            │   │ ASBR           │
│ (que no es     │   │ (Area Border   │   │ (Autonomous    │
│  ni ABR ni     │   │  Router)       │   │  System        │
│  ASBR)         │   │                │   │  Boundary      │
│                │   │ ≥2 áreas       │   │  Router)       │
│ 100% OSPF      │   │ Entre área y   │   │ Redistribuye   │
│ (T1 y T2)      │   │  área          │   │  de OTRO       │
└────────────────┘   └────────────────┘   │  protocolo     │
Tipos:              Inter-area (T3/T4)    └────────────────┘
  2. ABR            Genera T3/T4          Sombrero:
  3. ASBR                                    Redistribución
                                            (T5) → tema de redistribución
```

Este bloque es un retrato de los tres roles, con el nombre en inglés, la definición entre paréntesis y una línea de qué hace cada uno. Leelo de izquierda a derecha.

- **Internal**: el router común, el que no es ni ABR ni ASBR. Vive en una sola área y su OSPF es 100% de adentro: genera T1 y T2 (o sea, publica sus interfaces y, si es DR, su segmento). Es el rol más frecuente y el más simple.
- **ABR** (*Area Border Router*, router de frontera de área): tiene al menos dos áreas (el dibujo dice "≥2 áreas") y está "entre área y área". Su trabajo es resumir: genera T3 (las redes de un área vistas desde la otra) y T4 (cómo llegar al ASBR). En el recuadro, debajo del nombre, dice "Inter-area (T3/T4)" y "Genera T3/T4".
- **ASBR** (*Autonomous System Boundary Router*, router de frontera de sistema autónomo): redistribuye rutas de **otro** protocolo hacia OSPF. Abajo dice "Sombrero: Redistribución (T5) → tema de redistribución", y el "sombrero" es literal: en los diagramas de los libros el ASBR se dibuja con un sombrero de copa para distinguirlo. Un **sistema autónomo** es una red administrada por una sola organización; el ASBR es la puerta entre esa red y el resto del mundo.

Y abajo a la izquierda, la lista "Tipos: 2. ABR, 3. ASBR" es la numeración clásica de los roles, que se complementa con la tabla que viene ahora.

| Rol | Qué hace | Qué genera |
|-----|----------|------------|
| **Internal** | Vive en una sola área | T1, T2 |
| **ABR (Área Border Router)** | En el borde entre 2+ áreas; resume una área para la otra | **T3** (redes), **T4** (ASBR reachability) |
| **ASBR (Autonomous System Boundary Router)** | Trae redes de OTRO protocolo a OSPF (redistribución) | **T5** (externals) |

Esta tabla es la versión de bolsillo del dibujo anterior, y tiene tres columnas que hay que leer juntas. La columna **Rol** es el nombre. **Qué hace** es la definición en una frase. **Qué genera** es la consecuencia práctica: el tipo de LSA que produce, que es lo que después vas a ver en la LSDB.

- **Internal**: T1 y T2. Publica lo suyo, nada más.
- **ABR**: T3 y T4. El T3 es el resumen de redes ("las redes de mi área, vistas desde afuera"); el T4 es la ubicación del ASBR ("por acá se sale hacia el que redistribuye"). El inglés *ASBR reachability* significa "alcanzabilidad del ASBR": cómo llegar a él.
- **ASBR**: T5. Es el único que puede meter en OSPF una red que OSPF no aprendió por sí mismo.

> **La confusión clásica (resuelta de una vez):** ABR y ASBR NO son excluyentes. Un router puede ser ABR (borde de áreas) Y ASBR (redistribuye) a la vez. Y el ASBR NO necesita estar en el borde de áreas: puede redistribuir dentro de su propia área. Roles, no títulos: cada router puede acumularlos.

Pensalo así: los roles describen **qué hace** el router, no **dónde está**. Un ABR es el que tiene interfaces en dos áreas; un ASBR es el que tiene una fuente de rutas externas. Nada impide que el mismo equipo tenga las dos cosas: de hecho, en las redes de empresa es común que el router de borde con el proveedor sea ABR y ASBR al mismo tiempo. Cuando mires `show ip ospf border-routers` (capítulo 10) vas a ver routers con uno u otro rol, o con los dos.

> **Analogía:** el ABR es la **aduana entre provincias**: no deja pasar el detalle de cada calle, solo "el resumen de la provincia". El ASBR es el **puerto internacional**: por ahí entra mercadería de otro país (EIGRP, BGP, estáticas) al territorio OSPF.

### Resumen

- Hay tres roles: internal (una sola área), ABR (frontera entre áreas) y ASBR (puerta a otros protocolos).
- El ABR genera T3 (redes de otra área) y T4 (cómo llegar al ASBR); el ASBR genera T5.
- Los roles no son excluyentes: un mismo router puede ser ABR y ASBR a la vez.
- El ASBR no necesita estar en el borde de un área: redistribuye desde donde esté.
- Los roles describen qué hace el router, no en qué lugar de la topología está.

---

## 7. Tipos de área especiales: stub, totally stubby y NSSA

### 7.1. El problema que resuelven

Las áreas filtran los LSA internos: eso ya lo viste, el T1 y el T2 quedan adentro. Pero hay un tipo que **no** respeta la frontera: el **T5**. Todas las áreas reciben los T5 que generan los ASBR, porque las rutas externas se inundan por todo el dominio OSPF. Si tenés 10.000 rutas redistribuidas, todas llegan a todas las áreas.

Ahora pensá en un área chica y periférica: una sucursal con cuatro routers que solo necesita salir a la red central. ¿Necesita saber las 10.000 rutas externas? No. Le alcanza con una sola información: "para todo lo que no conozco, salí por el ABR". Esa información es una **ruta por defecto** (la `0.0.0.0/0`, la que el router usa cuando ninguna otra ruta coincide) y ocupa una línea en la tabla.

Para eso existen los tipos especiales de área: son áreas que **bloquean** ciertos LSA y le piden al ABR que les inyecte una ruta por defecto a cambio. Es un intercambio: el área pierde detalle y gana simplicidad.

### 7.2. El menú de áreas (la tabla que tenés que dominar)

```text
┌────────────────┬────────────────┬───────────────────────────┬─────────────┐
│ Tipo de área   │ T3 (summaries) │ T5 (externals)            │ Default     │
├────────────────┼────────────────┼───────────────────────────┼─────────────┤
│ Normal         │ ✔ sí          │ ✔ sí                      │ según LSA   │
│ Stub           │ ✔ sí          │ ✘ NO (las bloquea)        │ genera 1    │
│ Totally Stubby │ ✘ NO (solo    │ ✘ NO                       │ genera 1    │
│                │   la default) │                            │             │
│ NSSA           │ ✔ sí          │ ✘ NO (las bloquea;        │ genera 1    │
│                │               │   pero DEJA pasar T7 si    │             │
│                │               │   hay ASBR propio)         │             │
└────────────────┴────────────────┴───────────────────────────┴─────────────┘
```

Este bloque es el menú de los cuatro tipos de área, y hay que leerlo como una tabla de "qué deja pasar y qué bloquea". Las columnas son: **Tipo de área** (el nombre), **T3 (summaries)** (si acepta los resúmenes de otras áreas), **T5 (externals)** (si acepta las rutas externas) y **Default** (si el ABR le genera una ruta por defecto). Los símbolos de tilde y de cruz (sí y NO) marcan si acepta o bloquea cada tipo.

Fila por fila:

- **Normal**: acepta todo. Recibe T3 (resúmenes) y T5 (externas), y la ruta por defecto depende de lo que haya en la LSDB ("según LSA"): si hay un T5 de default, lo usa; si no, no tiene default.
- **Stub**: acepta T3 pero **bloquea T5**. A cambio, el ABR le genera una ruta por defecto ("genera 1"). Es el área "no tengo ASBR adentro, solo quiero salir".
- **Totally Stubby**: no acepta ni T3 ni T5, solo la ruta por defecto. El "NO (solo la default)" del T3 significa que el único resumen que pasa es la default. Es el área más "tranquila" que existe: la tabla de rutas queda con las redes internas del área más una default.
- **NSSA** (*Not-So-Stubby Area*, área "no tan stub"): acepta T3, bloquea T5, pero **deja pasar T7** si hay un ASBR propio adentro. También recibe una default del ABR.

La columna **Default** es la que más se olvida y la que más se pregunta: las tres áreas especiales (stub, totally stubby y NSSA) reciben una ruta por defecto generada por el ABR. Ese es el "pago" por bloquear: el área no sabe llegar a lo externo, pero sabe que todo lo desconocido sale por el ABR.

Y los comandos, que son tres y se parecen:

| Área | Uso típico | Comando |
|------|-----------|---------|
| **Stub** | "Acá no hay ASBR, solo quiero salir" | `area 1 stub` (en TODOS los routers del área) |
| **Totally stubby** | El área más "tranquila" posible | `area 1 stub no-summary` (solo en el ABR) |
| **NSSA** | Stub con ASBR propio adentro | `area 1 nssa` |

Esta tabla traduce cada tipo de área a su comando y a su caso de uso. Tres columnas: el **área**, el **uso típico** (cuándo elegirla, dicho como lo diría alguien en la oficina) y el **comando** (lo que se escribe en la consola).

- **Stub**: `area 1 stub`, y el paréntesis es la mitad de la respuesta del examen: **en TODOS los routers del área**. Si configurás stub solo en un lado, la vecindad no levanta, porque los dos routers tienen que estar de acuerdo en el tipo de área para sincronizar.
- **Totally stubby**: `area 1 stub no-summary`, y acá el paréntesis dice **solo en el ABR**. Es el mismo comando del stub con el agregado `no-summary`, que significa "no me mandes resúmenes". Va únicamente en el router que tiene el poder de filtrar: el ABR.
- **NSSA**: `area 1 nssa`, en todos los routers del área (igual que stub). Es el tipo de área para cuando adentro hay un ASBR propio.

> **Regla de oro (la corta y filosa):** `stub` y `nssa` se configuran en TODOS los routers del área (todos hacen la misma área). `no-summary` se configura SOLO en el ABR. ¿Por qué? Porque el ABR es quien decide qué resúmenes deja pasar. El resto del área solo "obedece" con su `stub`/`nssa` a juego.

Esa regla explica también el error más común de los laboratorios multitarea: configurar el tipo de área en un solo router y quedarse mirando por qué no levanta la vecindad. El tipo de área es parte del saludo: dos routers que no coinciden en el tipo de área no se aceptan como vecinos, aunque compartan red y Hello. Es un acuerdo de ambos lados, como el idioma en una conversación.

### 7.3. El caso NSSA explicado en una línea

Un área **NSSA** es "un stub que no puede ser tan tonto": tiene un router que redistribuye (ASBR propio). Como stub no acepta T5, el ASBR de la NSSA genera **T7** (NSSA-external), que el ABR traduce a T5 cuando salen al resto de OSPF. El área queda "aislada" de externos ajenos, pero puede meter los suyos propios.

Desarmemos esa frase, porque tiene tres piezas. Primera: el área no quiere T5 de afuera, porque no los necesita y le ensucian la tabla. Segunda: adentro hay un router que sí tiene rutas externas propias (por ejemplo, un enlace con la sucursal de al lado que no corre OSPF). Tercera: para no violar la regla del área, ese router las publica con el tipo **T7**, que es un "externo local", y el ABR las convierte en T5 al salir del área. Así el área sigue siendo cerrada hacia adentro y el resto de la red se entera de esas rutas como si vinieran de un ASBR normal.

> **Regla práctica:** si NO hay ASBR en el área → Stub/Totally Stubby. Si HAY ASBR en el área → NSSA. Sin excepción en la mayoría de los casos de examen.

Y un detalle de diseño que vale la pena: las áreas especiales no se eligen por gusto, se eligen por **topología**. Si el área es una sucursal sin rutas externas propias, stub o totally stubby. Si es una sucursal con un enlace a otra red que no es OSPF, NSSA. Si el área tiene routers que necesitan ver rutas externas con detalle (por ejemplo, porque hacen políticas de tráfico con ellas), no la hagas especial: dejala normal.

> **Analogía:** el área normal es un alumno que recibe todos los apuntes de todas las materias. El stub es el que recibe los resúmenes y una sola instrucción: "para lo que no sepas, preguntale al preceptor". La totally stubby es el que solo recibe esa instrucción, nada de resúmenes. Y la NSSA es el que además tiene sus propios apuntes para aportar, pero los presenta en un formato especial (T7) que el preceptor convierte al formato oficial (T5) antes de pasarlos a la dirección.

### Resumen

- Todas las áreas reciben T5 por defecto; las áreas especiales existen para bloquearlos y simplificar la tabla.
- Stub bloquea T5 y recibe una default; totally stubby bloquea T3 y T5 y deja solo la default.
- NSSA es un stub con ASBR propio: bloquea T5 ajenos y publica los propios como T7.
- `stub` y `nssa` van en todos los routers del área; `no-summary` va solo en el ABR.
- El tipo de área es un acuerdo: si no coincide en los dos lados, la vecindad no levanta.

---

## 8. Sumarización: la ruta que condensa miles

### 8.1. El concepto (la secuencia mágica)

Una sumarización es: **una ruta que representa a muchas**. Ya la conocés del tema de selección de rutas (y del de direcciones IP): `192.168.0.0/22` cubre 4 × /24. La idea es la misma que usa un mapa: en lugar de dibujar cada casa, dibujás la manzana.

Para entender por qué funciona hay que recordar dos cosas del direccionamiento IP. Primero, una red se escribe con una dirección y una máscara: `/24` significa que los primeros 24 bits identifican la red y los últimos 8, los equipos. Segundo, dos redes solo se pueden resumir si comparten los bits de la izquierda: `192.168.0.0/24`, `.1.0/24`, `.2.0/24` y `.3.0/24` comparten los primeros 22 bits, y por eso se pueden juntar en `192.168.0.0/22`.

En OSPF multi-área hay **dos tipos de sumarización** (confundirlos desaprueba):

| Tipo | Dónde se hace | Comando | Qué resume |
|------|---------------|---------|------------|
| **Inter-area** | En el **ABR** | `area 1 range 192.168.0.0 255.255.252.0` | Las redes del área 1 vistas desde afuera (T3) |
| **External** | En el **ASBR** | `summary-address 192.168.0.0 255.255.252.0` | Las rutas redistribuidas (T5) |

Esta tabla separa las dos sumarizaciones que existen, y es la que hay que tener clara para no escribir el comando en el router equivocado. Cuatro columnas: **Tipo** (inter-area o external), **Dónde se hace** (en qué router), **Comando** (la sintaxis exacta) y **Qué resume** (qué información queda condensada).

- **Inter-area**: se hace en el **ABR** y el comando es `area 1 range 192.168.0.0 255.255.252.0`. Resume las redes del área 1 vistas desde afuera, o sea los T3. La lógica es: el ABR conoce el detalle del área 1 y decide publicar un resumen en lugar del detalle.
- **External**: se hace en el **ASBR** y el comando es `summary-address 192.168.0.0 255.255.252.0`. Resume las rutas redistribuidas, o sea los T5. Acá el que condensa es el que trajo las rutas de afuera, porque es el único que las conoce todas.

Fijate que en los dos comandos aparece la misma dupla "dirección + máscara": `192.168.0.0 255.255.252.0`. Es la forma en que IOS (el sistema operativo de los routers y switches Cisco) escribe un prefijo en muchos comandos: la dirección de la red resumida y su máscara. Una máscara `255.255.252.0` equivale a `/22`, o sea 22 bits de red.

### 8.2. El ejemplo que lo aclara todo

Tenés el área 1 con cuatro redes /24 (192.168.0.0, .1.0, .2.0, .3.0). Sin sumarizar, el ABR genera **4 T3** hacia el área 0. Con `area 1 range 192.168.0.0 255.255.252.0`, genera **1 T3**: `192.168.0.0/22`.

```text
ÁREA 1 (4 redes /24)          ABR                  ÁREA 0
192.168.0.0/24   ─┐
192.168.1.0/24   ─┼──►  area 1 range 192.168.0.0 255.255.252.0
192.168.2.0/24   ─┤         │
192.168.3.0/24   ─┘         └───────────────►   UN solo T3: 192.168.0.0/22
```

Este dibujo muestra la transformación, y se lee de izquierda a derecha. A la izquierda, el **ÁREA 1 (4 redes /24)**: las cuatro redes sueltas, cada una con su línea y su guioncito. En el medio, la operación: `area 1 range 192.168.0.0 255.255.252.0`, que es el comando que se configura en el ABR. A la derecha, el **ÁREA 0**, que recibe **un solo T3: 192.168.0.0/22**. Las flechas muestran que cuatro líneas entran y una sola sale.

Lo que tiene que ver un principiante: el "antes" son cuatro anuncios, el "después" es uno, y el "después" cubre exactamente las mismas cuatro redes porque las cuatro son contiguas y del mismo tamaño. Si las cuatro no fueran contiguas, el resumen cubriría también redes que no existen, y eso es el problema del capítulo 8.3.

### 8.3. Los pros y contras (para que no la apliques a ciegas)

| Pro | Contra |
|-----|--------|
| Menos LSA en el backbone (LSDB chica) | Pierde el detalle: si 192.168.1.0 está caída, el T3 /22 sigue anunciándola (rutas "fantasma") |
| Más rápido el SPF de todos | Enrutamiento subóptimo en casos raros (una ruta /22 "de palo" a un destino que tiene camino mejor) |
| Menos memoria en los routers | Requiere que las redes sean **contiguas y consecutivas** (no sirve resumir redes sueltas) |

Esta tabla es la lista de lo que ganás y lo que pagás, en tres filas que se corresponden una a una: cada beneficio tiene su costo del otro lado.

- **Fila 1**: ganás una LSDB chica en el backbone (un T3 en lugar de cuatro), y pagás con **pérdida de detalle**. Si una de las cuatro redes se cae, el resumen sigue anunciando el bloque entero. Los paquetes hacia esa red viajan hasta el ABR y ahí se descartan o se van por la default: son las llamadas **rutas fantasma**, rutas que existen en la tabla pero llevan a un destino que no está.
- **Fila 2**: ganás velocidad de SPF para todos (menos nodos y menos anuncios que procesar), y pagás con posibles **rutas subóptimas**. "Subóptimo" quiere decir que hay un camino mejor que el que se está usando: por ejemplo, el resumen manda el tráfico hacia el ABR cuando había un atajo que el resumen ocultó. Es raro, pero existe.
- **Fila 3**: ganás memoria, y pagás con una **restricción de diseño**: las redes tienen que ser contiguas (que estén una al lado de la otra en el direccionamiento) y consecutivas (que no falte ninguna en el medio). No podés resumir 192.168.0.0/24 con 192.168.5.0/24 sin meter en el medio redes que no existen.

> **La regla de oro de la sumarización:** solo resumí redes que son **contiguas y del mismo tamaño** (o múltiplos). `192.168.0.0/22` requiere 4 redes /24 seguidas de 0 a 3. Si tenés 192.168.0.0/24 y 192.168.5.0/24, NO son resumibles sin colar redes que no existen. Y el "rastro fantasma": el enrutamiento hacia la red caída se va a la default/sumaría hasta que expire — aceptalo o no lo diferencies.

Ese último consejo es el más honesto del capítulo: la sumarización **no es gratis y no es obligatoria**. En una red de dos áreas con veinte redes, sumarizar puede no valer la pena. En una red de veinte áreas con dos mil redes, no sumarizar es un problema de recursos todos los días. La decisión se toma con el mismo criterio que todo lo demás en este manual: cuánto crece la red y cuánto duele el detalle.

### Resumen

- Sumarizar es anunciar una ruta que representa a muchas, igual que un mapa dibuja manzanas en vez de casas.
- Inter-area va en el ABR (`area N range`) y resume los T3; external va en el ASBR (`summary-address`) y resume los T5.
- El beneficio es una LSDB más chica, SPF más rápido y menos memoria.
- El costo es pérdida de detalle (rutas fantasma) y riesgo de camino subóptimo.
- Solo se resumen redes contiguas y consecutivas: si no lo son, el resumen inventa redes.

---

## 9. Configuración de multi-área: la receta completa

### 9.1. La topología (ABR de por medio)

Antes de escribir un solo comando, el dibujo. Este es el laboratorio mínimo de multi-área: dos áreas y un router en el medio que tiene un pie en cada una.

```text
              ÁREA 0                        ÁREA 1
   ┌─────────────────────────┐      ┌──────────────────┐
   │  R1 ── R2 ──── ABR1     │──────│ ABR1 ── R4       │
   │  (10.0.0.0/30)    R3    │ 10.0.1.0/30  R5         │
   │       └─ 10.0.2.0/30 ──  │      │ (10.0.3.0/30)   │
   └─────────────────────────┘      └──────────────────┘
        ABR1 interface:
        G0/0 10.0.1.1/30 → área 0   (sí, el ABR tiene UN pie en cada área)
        G0/1 10.0.0.1/30 → área 1
        loopback 0: 4.4.4.4
```

Este dibujo es la topología del laboratorio y hay que leerlo como un plano antes de tocar nada. Arriba, los dos mundos: a la izquierda el **ÁREA 0**, a la derecha el **ÁREA 1**. En el medio, el router **ABR1**, que aparece en los dos lados porque tiene una interfaz en cada área: es la frontera hecha equipo.

Las etiquetas de abajo son la lista de sus interfaces, y son la parte más importante del dibujo:

- `G0/0 10.0.1.1/30 → área 0`: la interfaz GigabitEthernet0/0 tiene la dirección 10.0.1.1 en una red /30 y pertenece al área 0. Es la pata que da al backbone.
- `G0/1 10.0.0.1/30 → área 1`: la otra interfaz, con la dirección 10.0.0.1 en otra red /30, pertenece al área 1. Es la pata que da al área 1.
- `loopback 0: 4.4.4.4`: la interfaz de loopback, que es una interfaz virtual (no existe físicamente, el router la inventa) y que se usa como Router ID estable. Una **loopback** es una dirección que siempre está arriba, aunque se caiga un cable: por eso es la candidata natural para el RID.

El paréntesis "sí, el ABR tiene UN pie en cada área" es la clave de todo el capítulo: **ABR no es un comando, es una situación**. Un router es ABR porque tiene interfaces en dos áreas, no porque se lo hayas dicho.

Y un detalle de las direcciones: `/30` significa una máscara de 30 bits, que deja 2 direcciones utilizables. Es el tamaño clásico para un enlace punto a punto entre dos routers: una dirección para cada punta y nada más. Por eso las redes entre routers se ven como `10.0.1.0/30` y `10.0.0.0/30`.

### 9.2. La configuración del ABR (solo el ABR es distinto)

Ahora sí, los comandos. Empecemos por el ABR, que es el único que tiene algo distinto:

```cisco
! ABR1
interface loopback 0
 ip address 4.4.4.4 255.255.255.255
!
interface GigabitEthernet0/0      ! hacia el backbone (área 0)
 ip address 10.0.1.1 255.255.255.252
 no shutdown
!
interface GigabitEthernet0/1      ! hacia el área 1
 ip address 10.0.0.1 255.255.255.252
 no shutdown
!
router ospf 1
 router-id 4.4.4.4
 network 10.0.1.0 0.0.0.3 area 0      ! interfaz del backbone → area 0
 network 10.0.0.0 0.0.0.3 area 1      ! interfaz del área 1 → area 1
 network 4.4.4.4 0.0.0.0 area 0       ! la loopback, adonde la pongas
 area 1 range 192.168.0.0 255.255.252.0   ! sumarización inter-area (si las redes del área 1 son esas)
```

Este bloque es la configuración completa del ABR1, y conviene leerlo línea por línea porque cada una hace algo y las que empiezan con `!` no hacen nada (son separadores para que el archivo se lea).

- `! ABR1`: un comentario, el nombre del equipo. En IOS, todo lo que empieza con `!` es un comentario.
- `interface loopback 0` / `ip address 4.4.4.4 255.255.255.255`: crea la interfaz virtual y le asigna la dirección 4.4.4.4 con máscara `/32` (255.255.255.255 significa "esta dirección sola"). Es la dirección que va a usar como Router ID.
- `interface GigabitEthernet0/0` con el comentario `! hacia el backbone (área 0)`: entra a la interfaz física que da al backbone.
- `ip address 10.0.1.1 255.255.255.252`: le pone la dirección y la máscara. `255.255.255.252` es `/30`: dos direcciones usables, justo lo que necesita un enlace de a dos.
- `no shutdown`: enciende la interfaz. En IOS, las interfaces arrancan apagadas (administrativamente cerradas) hasta que las habilitás. Es la causa número uno de "no tengo vecinos" en los laboratorios.
- `interface GigabitEthernet0/1` con `! hacia el área 1`: la otra pata, la del área 1, con `10.0.0.1 255.255.255.252`.
- `router ospf 1`: entra al proceso OSPF número 1. Ese `1` es local del router: no tiene que coincidir con el del vecino.
- `router-id 4.4.4.4`: fija el Router ID. Sin esta línea, OSPF lo elige solo (la IP más alta de las loopbacks o de las interfaces activas), y eso hace que el RID cambie cuando cambia una interfaz: mejor fijarlo.
- `network 10.0.1.0 0.0.0.3 area 0`: le dice a OSPF que la interfaz cuya dirección cae dentro de `10.0.1.0` con **wildcard** `0.0.0.3` pertenece al **área 0**. La máscara se escribe al revés que en otros comandos: `0.0.0.3` es la **wildcard mask**, que es el complemento de la máscara (`255.255.255.252` → `0.0.0.3`). Donde la wildcard tiene 0, el bit tiene que coincidir; donde tiene 1, no importa.
- `network 10.0.0.0 0.0.0.3 area 1`: lo mismo para la otra interfaz, pero en el **área 1**. Esta línea es la que convierte al router en ABR: dos `network` con áreas distintas.
- `network 4.4.4.4 0.0.0.0 area 0`: publica la loopback en el área 0. La wildcard `0.0.0.0` significa "esta dirección exacta". El comentario dice "la loopback, adonde la pongas": hay que elegir el área conscientemente, y la convención es el área 0.
- `area 1 range 192.168.0.0 255.255.252.0` con el comentario de sumarización: pide al ABR que publique las redes del área 1 resumidas en `192.168.0.0/22`, si las redes del área 1 son esas. Si no lo son, esta línea no corresponde y hay que sacarla o adaptarla.

Y ahora el router interno del área 1, para comparar:

```cisco
! R4 (área 1, internal)
interface loopback 0
 ip address 5.5.5.5 255.255.255.255
!
interface GigabitEthernet0/0
 ip address 10.0.0.2 255.255.255.252
 no shutdown
!
router ospf 1
 router-id 5.5.5.5
 network 10.0.0.0 0.0.0.3 area 1
 network 5.5.5.5 0.0.0.0 area 1
```

Este bloque es la configuración de R4, un router **internal** del área 1, y la gracia es ver qué **no** tiene: no tiene `area 1 range`, no tiene dos `network` con áreas distintas, no tiene nada especial. Es la configuración normal que ya sabés del manual anterior.

- `! R4 (área 1, internal)`: el comentario que lo dice todo: es un router interno.
- `interface loopback 0` / `ip address 5.5.5.5 255.255.255.255`: su loopback, que será su RID (5.5.5.5).
- `interface GigabitEthernet0/0` / `ip address 10.0.0.2 255.255.255.252` / `no shutdown`: su interfaz hacia el ABR, con la otra punta de la red /30.
- `router ospf 1` / `router-id 5.5.5.5`: el proceso y el RID fijo.
- `network 10.0.0.0 0.0.0.3 area 1` / `network 5.5.5.5 0.0.0.0 area 1`: publica su interfaz y su loopback, las dos en el **área 1**. Ninguna en el área 0.

La comparación entre los dos bloques es la lección: **el ABR es distinto porque tiene interfaces en dos áreas, y nada más**. No hay una línea mágica que diga "soy ABR". Si mañana le agregás a R4 una interfaz en el área 0 y su `network` correspondiente, R4 se convierte en ABR sin que nadie se lo indique.

> **La sintaxis que desbloquea multi-área:** `network X wildcard area N` — el **mismo proceso OSPF puede tener interfaces en áreas distintas**: es el ABR. La magia no es un comando "soy ABR": es TENER interfaces en 2+ áreas. Reconocelo por eso, no por un check "ABR feature".

El wildcard merece dos renglones más, porque es la parte que más se traba al principio. La wildcard es la máscara dada vuelta: una máscara `/30` (`255.255.255.252`) se escribe `0.0.0.3` como wildcard. El comando `network 10.0.1.0 0.0.0.3 area 0` significa "toda interfaz cuya dirección esté entre 10.0.1.0 y 10.0.1.3 pertenece al área 0". No es la red la que se publica: es la **interfaz** la que se mete en OSPF. Ese cambio de mentalidad (de "anuncio redes" a "habilito interfaces") es la mitad de entender la configuración de OSPF.

### 9.3. La receta paso a paso (multi-área en 5 pasos)

```text
1. Diseñá las áreas en papel (NUNCA configures sin dibujar el mapa)
2. Definí el ABR (el router que tocara 2 áreas) y su RID (loopback)
3. Configurá cada interfaz del ABR con su `network ... area N` correcta
4. Configurá los internals de cada área (todo su OSPF en SU area)
5. Verificá: `show ip ospf neighbor` en el ABR muestra vecinos en 2 áreas
   (ver un vecino en área 0 y otro en área 1 confirma que sos ABR)
```

Este bloque es el procedimiento completo, en cinco pasos, y está en el orden en que conviene hacerlo siempre.

- **Paso 1**: diseñar las áreas en papel, con el dibujo, las redes y los RIDs. El paréntesis insiste: nunca configures sin dibujar el mapa. Un área mal pensada se paga después con una LSDB gigante o con un router que quedó en el área equivocada.
- **Paso 2**: definir el ABR (el router que va a tocar dos áreas) y su RID mediante una loopback. Elegir el RID antes evita que cambie solo.
- **Paso 3**: configurar cada interfaz del ABR con su `network ... area N` correcta. Acá se define qué interfaz pertenece a qué área; un error en esta línea deja al router con las dos interfaces en la misma área y no hay ABR.
- **Paso 4**: configurar los routers internos de cada área, cada uno con todo su OSPF en **su** área. Un router interno no tiene nada en el área 0.
- **Paso 5**: verificar. `show ip ospf neighbor` en el ABR tiene que mostrar vecinos en las dos áreas; ver un vecino en área 0 y otro en área 1 es la confirmación de que el router es ABR.

Fijate que el paso 5 no dice "ver que hay rutas": dice "ver vecinos en dos áreas". Es la verificación correcta, porque el rol de ABR se prueba por las adyacencias, no por la tabla de rutas. Las rutas vienen después, como consecuencia.

### Resumen

- El laboratorio mínimo de multi-área son dos áreas y un router con una interfaz en cada una.
- ABR no es un comando: es un router con interfaces en dos o más áreas.
- `network X wildcard area N` habilita interfaces en un área; la wildcard es la máscara invertida.
- El router interno no tiene nada especial: todo su OSPF va en su propia área.
- La receta es dibujar, definir el ABR y su RID, configurar, y verificar vecinos en dos áreas.

---

## 10. Verificación avanzada: los comandos que revelan todo

### 10.1. Los 4 comandos que definen el nivel

Un laboratorio no se valida mirando si el ping anda. El ping te dice que hay camino; no te dice **por qué** hay camino ni qué rol tiene cada router. Para eso hay cuatro comandos, y con esos cuatro se responde casi cualquier pregunta de examen o de soporte:

| Comando | Qué revela |
|---------|------------|
| `show ip ospf neighbor` | Prioridad, estado (FULL/DR, FULL/BDR, 2-Way/DROther) |
| `show ip ospf database` | Los LSA: quién los generó (ADV Router), de qué tipo (T1-T5) |
| `show ip ospf database router 4.4.4.4` | El detalle de UN LSA tipo 1 (qué redes anunció 4.4.4.4) |
| `show ip ospf border-routers` | Cómo se llega al ABR/ASBR (rutas hacia los roles) |

Esta tabla es la caja de herramientas, y cada fila responde una pregunta distinta. Dos columnas: el **comando** exacto que se escribe y **qué revela** (la información que devuelve).

- **`show ip ospf neighbor`**: la lista de vecinos con su prioridad y su estado. Responde "¿con quién estoy hablando y quién manda en este segmento?".
- **`show ip ospf database`**: la LSDB resumida, con el generador y el tipo de cada anuncio. Responde "¿qué hay en el mapa y quién lo dijo?".
- **`show ip ospf database router 4.4.4.4`**: el detalle de un LSA tipo 1 de un router puntual. Responde "¿qué interfaces y qué redes está anunciando exactamente ese router?". Es el comando que se usa cuando sospechás que un router no está publicando lo que debería.
- **`show ip ospf border-routers`**: la tabla interna de routers de borde, con su rol (ABR o ASBR) y su costo. Responde "¿por dónde salgo hacia otra área o hacia las rutas externas?".

Un consejo de método: usalos en ese orden. Primero vecinos (¿la red está armada?), después base de datos (¿el mapa está completo?), después el detalle de un LSA (¿este router publica lo que corresponde?) y al final los bordes (¿los roles están donde esperaba?). Es el mismo orden en que se arma OSPF: vecindad, mapa, detalle, frontera.

### 10.2. La lectura de un neighbor (modo detective)

Veamos el primero en acción, porque es el que más se usa y el que más se malinterpreta:

```text
R1# show ip ospf neighbor

Neighbor ID     Pri   State           Dead Time   Address         Interface
2.2.2.2           1   FULL/BDR        00:00:39    10.0.0.2        Gi0/0
4.4.4.4           5   FULL/DR         00:00:37    10.0.1.2        Gi0/1
```

Este bloque es una salida real de `show ip ospf neighbor`, y hay que saber leer cada columna. La primera línea es el comando en el prompt de R1. La segunda es la fila de títulos, y las dos siguientes son dos vecinos.

Las columnas: **Neighbor ID** es el Router ID del vecino (no su dirección IP de la interfaz). **Pri** es la prioridad OSPF que ese vecino tiene en esa interfaz. **State** es el estado de la adyacencia, y acá aparece la combinación clave: `FULL/BDR` y `FULL/DR`. **Dead Time** es el tiempo que falta para que venza el Dead timer si no llega un Hello nuevo: si ves un número que baja y se renueva, el vecino está vivo; si baja hasta cero y no se renueva, el vecino se cae. **Address** es la dirección IP del vecino en ese segmento. **Interface** es la interfaz local por la que se lo alcanza.

Ahora la lectura del ejemplo, que es lo que hay que poder hacer en voz alta:

- La primera fila dice que el vecino `2.2.2.2` tiene prioridad 1, está en `FULL/BDR`, se lo alcanza en 10.0.0.2 por la interfaz Gi0/0 y le quedan 39 segundos de Dead Time. Traducción: en el segmento de Gi0/0, el router 2.2.2.2 es el **BDR**.
- La segunda fila dice que el vecino `4.4.4.4` tiene prioridad 5, está en `FULL/DR`, se lo alcanza en 10.0.1.2 por la interfaz Gi0/1 y le quedan 37 segundos. Traducción: en el segmento de Gi0/1, el router 4.4.4.4 es el **DR**, y alguien le configuró prioridad 5 (el valor por defecto es 1, así que ese 5 es una decisión).

Del ejemplo: R2 es BDR de un segmento, el ABR (RID 4.4.4.4) es DR con prioridad 5, y el vecino del Gi0/1 (área 1) está FULL. Tres datos, tres historias: segmento con DR/BDR, prioridad configurada en el ABR, y vecino del área 1 arriba.

Y una lectura que casi nadie hace y que es la más útil de todas: **mirar el estado de cada vecino y agruparlo por interfaz**. Si en una interfaz ves un `FULL/DR`, un `FULL/BDR` y varios `2-Way/DROther`, ese segmento está sano. Si en una interfaz no aparece ningún `FULL/DR`, ese segmento todavía no eligió DR o el DR está caído. Si ves un vecino en `EXSTART` o `EXCHANGE` que no avanza, el problema está en la sincronización, no en el saludo. El estado no es un adorno: es el diagnóstico.

### 10.3. El show que casi nadie hace (y que salva vidas)

```text
R1# show ip ospf border-routers

OSPF Process 1 internal Routing Table
Codes: i - Intra-area route, I - Inter-area route

i 4.4.4.4 [1] via 10.0.1.2, ABR, Area 0, SPF 5
I 5.5.5.5 [2] via 10.0.1.2, ASBR, Area 0, SPF 3
```

Este bloque es la salida de `show ip ospf border-routers`, el comando que muestra la tabla interna de routers de borde. Vamos por partes.

La primera línea es el comando. Después viene el título de la tabla: **OSPF Process 1 internal Routing Table**, o sea la tabla interna del proceso OSPF 1 (no es la tabla de rutas normal del router: es la que OSPF usa para saber cómo llegar a los routers de borde).

La línea de **Codes** es la leyenda: `i - Intra-area route` (ruta dentro del área) y `I - Inter-area route` (ruta entre áreas). Fijate que la `i` minúscula y la `I` mayúscula son códigos distintos: la minúscula es intra-área y la mayúscula es inter-área.

Las dos filas de datos se leen así:

- `i 4.4.4.4 [1] via 10.0.1.2, ABR, Area 0, SPF 5`: el router 4.4.4.4 es un **ABR**, se llega a él por 10.0.1.2, está en el **área 0**, el costo es 1 (el número entre corchetes) y lo calculó el SPF número 5. La `i` dice que la ruta hacia él es intra-área, o sea que está dentro de la misma área desde donde se mira.
- `I 5.5.5.5 [2] via 10.0.1.2, ASBR, Area 0, SPF 3`: el router 5.5.5.5 es un **ASBR**, se llega por el mismo 10.0.1.2, está en el área 0, el costo es 2 y lo calculó el SPF número 3. La `I` mayúscula dice que es una ruta inter-área: para llegar a ese ASBR hay que cruzar una frontera de área.

> Acá ves el mapa de los ROLES: 4.4.4.4 es ABR (intra-area, costo 1), 5.5.5.5 es ASBR (inter-area, costo 2). **¿Pregunta de examen en serio? "¿Qué comando muestra los ABR y ASBR conocidos?" → `show ip ospf border-routers`.** No lo olvides.

Y una advertencia que ahorra tiempo: si este comando devuelve la tabla vacía, no significa que la red esté rota. Significa que **desde este router** no se ve ningún router de borde: o no hay ABR ni ASBR en el dominio, o el router está en un área que no tiene resúmenes hacia ellos. Es una pista, no un veredicto.

### Resumen

- Cuatro comandos cubren la verificación: neighbor, database, database router y border-routers.
- En `neighbor` se leen prioridad y estado juntos: `FULL/DR` y `FULL/BDR` dicen quién manda en el segmento.
- `FULL` con DR/BDR y `2-Way` entre DROthers es el patrón sano de un segmento compartido.
- `database` muestra tipo y generador de cada LSA; `database router` muestra el detalle de un T1.
- `border-routers` es el comando que revela los roles ABR y ASBR, con su costo y su área.

---

## 11. Los 5 errores avanzados más comunes

| # | Error | Síntoma | Fix |
|---|-------|---------|-----|
| 1 | **Configurar `area X stub` solo en un lado** | Vecindad no levanta (los tipos de área no matchean) | `stub` en TODOS los routers del área |
| 2 | **Esperar que el DR cambie al subir prioridad** | R3 sigue siendo DR con R4 ya en 255 | La elección no es preemptiva: `clear ip ospf process` |
| 3 | **Sacar T5 del área con stub sin querer** | Las rutas externas desaparecen del área | Neutral: stub bloquea T5 POR DISEÑO; si necesitás externos → NSSA |
| 4 | **OJO con el ABR + `network` en la loopback** | La loopback queda en un área que no querés | Elegí conscientemente en qué área publicás la loopback (convención: área 0) |
| 5 | **Sumarización mal hecha (redes no contiguas)** | Rutas fantasma o tráfico a ninguna parte | `area N range` exige contigüidad + consecutividad |

Esta tabla es la lista de los cinco errores que más veces se repiten en un laboratorio multi-área. Cuatro columnas: el **número**, el **error** (qué hizo el humano), el **síntoma** (qué se ve en pantalla, que casi nunca dice "esto es lo que pasó") y el **fix** (la corrección concreta).

- **Error 1**: configuraste el tipo de área en un solo router. El síntoma es que la vecindad no levanta y no hay un mensaje claro que diga "falta el stub del otro lado". El fix es en todos los routers del área, porque el tipo de área es parte del acuerdo.
- **Error 2**: cambiás la prioridad y esperás que el DR cambie solo. El síntoma es que el DR sigue siendo el mismo y parece un bug. El fix es reiniciar el proceso (con el costo de cortar vecindades) o haber configurado la prioridad antes.
- **Error 3**: convertís un área en stub y de golpe desaparecen las rutas externas. No es un error de configuración: es el comportamiento del stub, que bloquea T5 a propósito. Si el área necesita externos, el tipo correcto es NSSA.
- **Error 4**: el ABR publica su loopback en el área equivocada. El síntoma es un Router ID que no aparece donde esperabas, o rutas hacia la loopback por un área que no querés. El fix es decidir el área de la loopback a conciencia (la convención es el área 0).
- **Error 5**: resumís redes que no son contiguas. El síntoma son rutas fantasma o tráfico que se va a ningún lado. El fix es respetar la condición del `area N range`: redes contiguas y consecutivas.

> **El error campeón de los labs multitarea:** "configuré stub en R5 (área 1) pero el ABR sigue mandando T3" — porque `stub no-summary` (totally) es el que borra T3, y además va SOLO en el ABR. Stub plano solo borra T5. Tipo de área por tipo de área, no "más o menos filtro": la tabla del 7.2 es tu mapa.

Ese error merece un comentario aparte porque mezcla dos cosas: el tipo de área (stub) con la opción que lo endurece (no-summary). El `stub` solo bloquea T5; si querés bloquear también los T3, necesitás la variante totally stubby, y esa variante se configura únicamente en el ABR, porque es el ABR el que decide qué resúmenes publica. Pedirle a un router interno que "no reciba resúmenes" no tiene sentido: el que los manda es el ABR.

### Resumen

- El error 1 (tipo de área en un solo lado) rompe la vecindad sin mensaje claro.
- El error 2 (esperar que el DR cambie) es no entender que la elección no es preemptiva.
- El error 3 (stub sin externos) es comportamiento del diseño, no una falla.
- El error 4 (loopback en el área equivocada) se evita decidiéndolo antes de configurar.
- El error 5 (resumir redes no contiguas) genera rutas fantasma que no llevan a ningún lado.

---

## 12. Comprobá lo que aprendiste

Ocho preguntas. Tapá la respuesta, contestá en voz alta y recién después compará. Si una no sale, el número del capítulo está en la respuesta: volvé ahí antes de seguir.

**1. ¿Por qué existe el DR en un segmento broadcast?**

**Ver respuesta:** Para evitar el festival de adyacencias: con N routers, sin DR serían N×(N−1)/2 adyacencias Full y floods a todos. Con DR, todos se sincronizan SOLO con el DR (y con el BDR); los DROthers quedan en 2-Way entre sí. Menos CPU, menos tráfico, convergencia más controlada.

**2. ¿Qué pasa cuando se cae el DR? ¿Se "reeelige"?**

**Ver respuesta:** NO se reelige desde cero: el BDR ya tiene la LSDB al día (estaba en Full con todos) y asciende a DR al instante. Después se elige un BDR nuevo entre los DROthers. El BDR es el reemplazo diseñado, no un sorteo.

**3. ¿Cómo se elige al DR en un segmento?**

**Ver respuesta:** Mayor prioridad (`ip ospf priority`, default 1; 0 = nunca), y si empatan, mayor Router ID. La elección es NO preemptiva: lo que es DR sigue siendo DR hasta que caiga o se reinicie el proceso (`clear ip ospf process`). Prioridad 255 = "quiero ganar".

**4. Nombra los tipos de LSA 1-5 y quién genera cada uno.**

**Ver respuesta:** T1 Router LSA (cada router, por área). T2 Network LSA (el DR del segmento). T3 Network Summary (el ABR, resumiendo áreas). T4 ASBR Summary (el ABR, hacia el ASBR). T5 External (el ASBR, redes de fuera de OSPF). Patrón: T1/T2 intra-área, T3/T4 inter-área, T5 externo.

**5. ¿Qué diferencia hay entre ABR y ASBR?**

**Ver respuesta:** ABR: router con interfaces en 2+ áreas; resume áreas entre sí (genera T3/T4). ASBR: router que redistribuye rutas de OTRO protocolo (o estáticas) hacia OSPF (genera T5). Un mismo router puede ser ambos. Se ven con `show ip ospf border-routers`.

**6. ¿Cuál es la diferencia entre stub y totally stubby?**

**Ver respuesta:** Stub bloquea T5 (externas) pero recibe T3 (resúmenes inter-área). Totally stubby (`no-summary`, configurado en el ABR) bloquea también T3 y solo deja la default. NSSA es el "stub con ASBR propio" (usa T7).

**7. ¿Cómo y dónde se suma una ruta en OSPF multi-área?**

**Ver respuesta:** En el ABR con `area N range X wildcard` (resume las redes del área N para el resto). En el ASBR con `summary-address` (resume lo redistribuido, T5). Regla: redes contiguas y consecutivas; el beneficio es LSDB chica, el costo es rutas "fantasma" hacia redes caídas.

**8. ¿Qué comando muestra ABR y ASBR conocidos?**

**Ver respuesta:** `show ip ospf border-routers` — muestra la tabla interna hacia los routers de borde con su tipo (ABR/ASBR) y costo. Pregunta clásica de examen, respuesta clásica.

Dos observaciones sobre este cuestionario, ahora que tenés las respuestas. La primera: casi todas las preguntas se contestan con un **porqué**, no con un dato. Si te sabés "el DR centraliza" pero no podés explicar la cuenta de las adyacencias, la respuesta se te va a olvidar. La segunda: las preguntas 1, 2 y 3 son el mismo tema visto desde tres ángulos (para qué, qué pasa si falla, cómo se elige). Si las podés contestar las tres seguidas sin dudar, el capítulo 2 y el 3 están sólidos.

### Resumen

- Las ocho preguntas cubren DR/BDR, LSA, roles, áreas especiales, sumarización y verificación.
- Las tres primeras son el mismo tema: para qué existe el DR, qué pasa si cae y cómo se elige.
- La 4 y la 5 son la base de la LSDB: tipos de LSA y roles de frontera.
- La 6 y la 7 son el diseño: qué área elegir y dónde resumir.
- La 8 es de memoria corta, pero es la que más se pregunta: `show ip ospf border-routers`.

---

## 13. Glosario

| Término | Qué es |
|---------|--------|
| **DR / BDR** | Designated Router / Backup: concentradores de adyacencia en segmentos broadcast; el BDR reemplaza al DR si cae |
| **DROther** | Router que no es DR ni BDR; se sincroniza solo con ambos, queda en 2-Way con los demás |
| **LSA tipo 1-5** | Router/Network/Summary/ASBR-Summary/External: los "pedacitos de mapa" que arman la LSDB |
| **Seq#, Age** | Número de secuencia y edad del LSA: controlan el flood (duplicados se descartan) |
| **Multi-área** | División de la red en áreas para aislar LSDB; el área 0 (backbone) es obligatoria |
| **ABR** | Router con interfaces en 2+ áreas; resume (T3/T4) entre áreas |
| **ASBR** | Router que redistribuye rutas externas hacia OSPF (T5); la redistribución tiene su propio tema |
| **Stub / Totally Stubby / NSSA** | Áreas que filtran T5 (stub), T3+T5 (totally) o aceptan solo externos propios (NSSA, T7) |
| **Sumarización** | Una ruta que representa a muchas: `area N range` (ABR) o `summary-address` (ASBR) |
| **Flooding** | Propagación de LSA a toda el área; finito gracias a Seq# |

Este glosario es la lista de términos que tienen que quedar claros al terminar, ordenada casi en el mismo orden en que aparecieron. Dos columnas: el **término** y **qué es**, en una línea.

- Los dos primeros (DR/BDR y DROther) son el vocabulario del segmento compartido: quién manda y quién no.
- Los dos siguientes (tipos de LSA y Seq#/Age) son el vocabulario del mapa: qué mensajes hay y cómo se decide cuál vale.
- Los tres del medio (multi-área, ABR, ASBR) son el vocabulario del diseño: cómo se parte el mapa y quién hace de frontera.
- Los dos últimos (áreas especiales y sumarización) son el vocabulario del ajuste fino: cómo se recorta lo que no hace falta.
- **Flooding** cierra la lista porque es el mecanismo que conecta todo: sin inundación no hay LSDB compartida, y sin LSDB compartida no hay mapa.

Si un término de esta lista te suena pero no lo podés explicar en una frase, volvé al capítulo donde se usa: cada uno tiene su analogía y su bloque de comandos.

### Resumen

- DR, BDR y DROther son los tres papeles de un segmento compartido.
- LSA, Seq# y Age son las piezas del mapa y de su control de versiones.
- Multi-área, ABR y ASBR son las piezas del diseño y de las fronteras.
- Stub, totally stubby, NSSA y sumarización son las herramientas de ajuste.
- Flooding es el mecanismo que une todo: publicar, inundar, compartir el mapa.

---

## 14. Resumen en 10 puntos

1. **El DR resuelve el infierno de adyacencias**: en broadcast, todos se sincronizan solo con DR/BDR; los DROthers en 2-Way entre sí es sano.
2. **Elección del DR**: mayor prioridad (default 1, 0 = nunca), empate por RID. Y NO es preemptiva: reiniciá el proceso si cambiás prioridad.
3. **BDR = plan B diseñado**: sube a DR cuando este cae, con la LSDB ya al día — convergencia rápida garantizada por diseño.
4. **Los LSA son el mapa**: T1/T2 intra-área (router/segmento), T3/T4 inter-área (lo que resume el ABR), T5 externo (lo que trae el ASBR).
5. **Multi-área = escalabilidad**: cada área mantiene su LSDB; el SPF corre por área; todo pasa por el área 0.
6. **ABR ≠ ASBR**: ABR cruza áreas (T3/T4); ASBR cruza protocolos (T5); un router puede ser ambos.
7. **Áreas especiales**: stub (no T5), totally stubby (ni T3, solo default), NSSA (stub con ASBR propio vía T7).
8. **Sumarización**: `area N range` en el ABR, `summary-address` en el ASBR; exige redes contiguas; crea rutas fantasma.
9. **`show ip ospf border-routers`** revela ABR/ASBR conocidos; `show ip ospf database` muestra los LSA con su generador (ADV Router).
10. **Diagnóstico avanzado**: tipo de área que no matchea y DR que no se reelige son los dos errores campeones de los labs.

Leé esta lista como el índice al revés: cada punto es un capítulo condensado en una línea. Si alguno no te cierra, el número del punto te dice a qué capítulo volver. Y si tenés que llevarte una sola idea, llevate la 5: **todo lo que viste en este manual existe para que el mapa no crezca más rápido que la red**. El DR reduce conversaciones, los LSA permiten resumir, las áreas reducen el mapa por router, la sumarización condensa lo que queda y las áreas especiales tiran lo que sobra.

Un último consejo de estudio, que vale más que memorizar la lista: cuando te pregunten por una pieza de este manual, contestá siempre en el mismo orden. Primero **qué problema resuelve** (el porqué), después **cómo funciona** (el mecanismo) y al final **cómo se verifica o se configura** (el comando). Si arrancás por el comando, te olvidás del porqué en una semana. Si arrancás por el problema, el comando se deduce.

### Resumen

- Un segmento compartido elige DR y BDR; el BDR es el reemplazo listo, no un sorteo.
- La elección no es preemptiva: la prioridad se configura antes o se reinicia el proceso.
- Los LSA arman el mapa por tipos: intra-área, inter-área y externos.
- Multi-área y sumarización son las dos palancas de la escalabilidad, con su costo en detalle.
- Verificar es preguntar por vecinos, base de datos y routers de borde, en ese orden.

---

> **Fuente:** Documentación propia basada en RFC 2328 (OSPFv2), RFC 3101 (NSSA), CCNA 200-301 Official Cert Guide (W. Odom), Cisco IOS Configuration Guides y material educativo de redes. Un **RFC** (*Request for Comments*) es el documento donde se publica un estándar de internet: si querés el detalle exacto de un protocolo, se lee el RFC.

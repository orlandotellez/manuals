# 16. Introducción a las Redes

---

## Índice

- [Cómo usar este manual](#cómo-usar-este-manual)
- [¿Qué es una red?](#1-qué-es-una-red)
- [Los tres ingredientes de toda red](#2-los-tres-ingredientes-de-toda-red)
- [¿Qué le ofrece una red? Ventajas y costos](#3-qué-le-ofrece-una-red-ventajas-y-costos)
- [Las preguntas clave antes de crear una red](#4-las-preguntas-clave-antes-de-crear-una-red)
- [Administración de red: la red no se cuida sola](#5-administración-de-red-la-red-no-se-cuida-sola)
- [Tipos de redes según su alcance](#6-tipos-de-redes-según-su-aleance)
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

---

## Cómo usar este manual

Este manual es el **punto de partida** para entender cómo funcionan las redes. Al terminarlo vas a tener un mapa mental completo de qué es una red, con qué piezas se construye y por qué existen cada una de esas piezas.

**Cómo está pensado:**

- **No necesitás nada previo.** Si nunca tocaste una red, este es tu lugar. Si ya sabés algo, te sirve para ordenar y confirmar conceptos.
- **Cada concepto importante tiene tres partes**: qué es, una **analogía** con la vida cotidiana, y un **ejemplo concreto**. Ese patrón se repite a lo largo de todo el curso.
- **Los términos en negrita** aparecen explicados en el [Glosario](#15-glosario) al final del manual.
- Buscá los recuadros **HACELO VOS**: son actividades prácticas de 5 minutos que te anclan la teoría en la realidad. Se puede aprender sin hacerlas, pero se aprende el doble haciéndolas.
- Al final hay una sección de **preguntas de autoevaluación** con respuestas ocultas (podés intentar responder antes de mirarlas).

Una última cosa antes de arrancar: si algún concepto no te queda claro a la primera, **es normal**. Las redes se entienden en capas, igual que se construyen: primero la idea general, después el detalle. Acá vamos a hacer exactamente eso.

---

## 1. ¿Qué es una red?

### 1.1. La definición simple

Una **red** es un conjunto de **dos o más dispositivos informáticos conectados entre sí** con el objetivo de compartir información y recursos.

Eso es todo. Cuando tu celular le manda una foto a tu notebook por Bluetooth, **es una red**. Cuando el termostato de tu casa habla con la app del celular, **es una red**. Cuando tu computadora abre esta página, está usando la red más grande que existe: **internet**.

Detrás de cada interacción digital hay una red:

| Situación cotidiana | ¿Dónde está la red? |
|---------------------|---------------------|
| Leer este documento | Posiblemente ya estás conectado a una red local o a internet |
| Enviar un mensaje de WhatsApp | Tu celular → la red de tu operador → internet → el celular de la otra persona |
| Imprimir un documento desde el celular | La impresora y el celular están en tu red doméstica |
| Ver una serie en streaming | Tu Smart TV pide datos a un servidor que está a miles de kilómetros |
| Jugar una partida online | Tu consola se conecta con los servidores del juego y con otros jugadores |

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

La analogía no es perfecta (las cartas no viajan partidas en pedazos, los datos sí), pero captura la idea central: **una red es un sistema para transportar información de un punto a otro, con reglas claras de direccionamiento y entrega.**

### 1.3. ¿Qué se comparte en una red?

El objetivo de una red es compartir **recursos**. Los principales son:

1. **Datos**: archivos, documentos, fotos, bases de datos.
2. **Aplicaciones y programas**: software instalado en un servidor al que acceden muchos usuarios.
3. **Hardware**: impresoras, unidades de almacenamiento, escáneres.
4. **Conexión a internet**: un solo enlace al proveedor, compartido por todos los dispositivos.
5. **Potencia de cálculo**: en redes más avanzadas, el procesamiento se reparte entre varias máquinas.

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

Los dispositivos (celular, notebook, TV) se llaman **dispositivos finales** o **hosts**. El **router** es el dispositivo intermedio que los conecta entre sí y con internet. En el punto 12 vamos a estudiar cada pieza en detalle.

> **Dato importante para principiantes:** la red de tu casa y *internet* no son lo mismo. Tu red de casa es la parte que está **dentro** de tus cuatro paredes. Internet es la red gigante que está **afuera**, y tu router es el puente entre ambas.

### 1.5. Internet: la red de redes

Cuando hablamos de internet no hablamos de una sola red, sino de **millones de redes interconectadas entre sí** — redes de hogares, empresas, universidades, gobiernos y proveedores — que acordaron hablar el mismo idioma.

Ese "idioma común" son los **protocolos**: reglas escritas que definen cómo se formatean, se envían, se reciben y se confirman los datos. El más famoso es el conjunto **TCP/IP**, que vamos a estudiar a fondo a lo largo de este curso.

> **Idea central de este manual:** una red existe para compartir. Toda la tecnología que vas a ver de acá en adelante (cables, routers, direcciones IP, switches) existe para cumplir ese único propósito de la manera más rápida, confiable y segura posible.

---

## 2. Los tres ingredientes de toda red

Toda red, por más compleja que sea, se puede reducir a **tres ingredientes**:

### 2.1. Los nodos (los participantes)

Un **nodo** es cualquier dispositivo capaz de enviar o recibir datos en la red. Hay dos grandes grupos:

- **Dispositivos finales** (también llamados *hosts*): son los que las personas usan. Computadoras, celulares, impresoras, servidores, Smart TVs, tablets.
- **Dispositivos intermedios**: son los que hacen que los datos lleguen de un lado a otro. Routers, switches, puntos de acceso inalámbrico, módems.

> **Analogía:** en el sistema postal, los dispositivos finales son las personas que escriben cartas; los intermedios son las sucursales de correo por donde las cartas pasan.

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

> **Analogía:** si la red es el sistema postal, los enlaces son las rutas que usan los carteros: algunas son calles del barrio (Bluetooth), otras son rutas nacionales (fibra óptica) y otras son autopistas internacionales (la red de fibra submarina que conecta continentes).

### 2.3. Los protocolos (el idioma común)

Un **protocolo** es un conjunto de reglas que define **cómo** se comunican los dispositivos. Sin protocolos, dos dispositivos de distintos fabricantes no podrían entenderse, como dos personas que hablan idiomas distintos.

Algunos protocolos que ya usás sin saberlo:

| Protocolo | ¿Qué hace? | ¿Cuándo lo usás? |
|-----------|------------|------------------|
| **IP** | Direcciona los paquetes (el "sobre" con direcciones) | Siempre que navegás |
| **TCP** | Garantiza que los datos lleguen completos y en orden | Descargar un archivo, ver una web |
| **UDP** | Envía datos rápido sin garantizar la entrega | Llamadas de voz, video en vivo |
| **HTTP/HTTPS** | Transporta las páginas web | Cuando abrís un sitio |
| **DNS** | Traduce nombres (google.com) a direcciones (142.250.….) | Cada vez que escribís una dirección web |

No hace falta memorizarlos ahora. Lo importante acá es la idea: **una red es nodos + enlaces + protocolos.**

> **Pregunta para pensar (no hace falta responderla en voz alta):** ¿Qué pasa si dos dispositivos hablan el mismo protocolo pero están conectados con un cable dañado? Exacto: los datos viajan pero no "salen" del cable. Ningún protocolo arregla un enlace roto. Siempre se necesita el trio completo.

---

## 3. ¿Qué le ofrece una red? Ventajas y costos

La mayoría de los manuales lista las ventajas de las redes y se queda ahí. Eso está bien, pero incompleto: una red también trae responsabilidades. Mirá las dos caras de la moneda.

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

### 3.2. Lo que hay que pagar por ellas (los costos)

Sería una mala enseñanza decir que las redes solo traen beneficios. Una red mal planificada puede generar más problemas de los que resuelve:

| Costo o riesgo | ¿Por qué existe? |
|----------------|------------------|
| **Costo económico** | Cables, switches, routers, licencias, mantenimiento. La red no es gratis. |
| **Seguridad** | Una red conecta dispositivos... y también los expone. Un atacante que entra a la red puede llegar a todo lo que está conectado. |
| **Dependencia** | Si la red se cae, todo lo que depende de ella se detiene (impresión, correo, archivos, internet). |
| **Complejidad** | Más dispositivos = más cosas que configurar, monitorear y actualizar. |
| **Formación** | Alguien tiene que saber administrarla, o hay que pagar a un especialista. |

> **Conclusión honesta:** una red se justifica cuando los beneficios (compartir, centralizar, comunicar) superan los costos. En una casa con dos personas y un celular, la "red" es casi automática. En una empresa de 50 personas, la red es una decisión seria de planificación — para eso sirven las preguntas del próximo punto.

---

## 4. Las preguntas clave antes de crear una red

Antes de comprar un solo cable, conviene responder estas siete preguntas. Cada una tiene un porqué técnico detrás.

### 4.1. ¿Qué requisitos tengo para la red?

**Qué quiero lograr**: ¿compartir internet nomás? ¿archivos? ¿impresoras? ¿videollamadas? ¿juegos en red? ¿servidores?

- Si solo querés navegar, cualquier red básica alcanza.
- Si vas a mover archivos grandes o hacer videollamadas constantes, necesitás más ancho de banda y mejor equipamiento.
- Si vas a tener servidores, la red necesita más planificación (direccionamiento fijo, seguridad, respaldos).

### 4.2. ¿Lo necesito localmente o con mayor alcance?

Aquí aparece el concepto de **escala** que estudiamos en el punto 6:

- ¿Todo queda en un mismo edificio? → **LAN** (red de área local).
- ¿Hay varios edificios en un mismo campus? → **CAN**.
- ¿Hay sucursales en distintas ciudades? → **WAN**.

> **Regla práctica:** la escala define el equipamiento. Una LAN se arma con switches y un router. Una WAN requiere contratar enlaces a un proveedor (ISP) y enrutamiento entre sedes.

### 4.3. ¿A cuántos participantes me dirijo y cuánto tráfico generan?

Esta pregunta define el **tamaño del equipamiento**:

- 5 dispositivos → un router hogareño alcanza.
- 100 dispositivos → necesitás switches de más puertos, posiblemente varios, y un router más robusto.
- 1000 dispositivos → ya hablamos de redes segmentadas, VLANs y planificación profesional.

**Un número clave:** cada dispositivo conectado "compite" por el ancho de banda disponible. No es lo mismo 10 dispositivos mirando texto que 10 dispositivos en streaming de video.

### 4.4. ¿La red debe ser privada, pública o ambas?

- La gran mayoría de las redes internas son **privadas**: solo accesibles desde adentro.
- A veces hay partes que deben ser **públicas** (por ejemplo, un servidor web que atiende a clientes externos).
- La solución típica es una red privada + un punto controlado de salida a lo público (el router con su configuración de seguridad).

### 4.5. ¿Qué tan alta debe ser la seguridad?

La respuesta depende de qué hay en la red:

| Qué hay en la red | Nivel de seguridad necesario |
|-------------------|------------------------------|
| Solo equipos personales de una casa | Básico (contraseña de Wi-Fi, firewall del router) |
| Datos de una Pyme | Medio (firewall, permisos por usuario, backups) |
| Datos sensibles o regulados (salud, finanzas, clientes) | Alto (segmentación, cifrado, auditoría, políticas formales) |

### 4.6. ¿Qué hardware necesito?

La respuesta sale de las preguntas anteriores. En términos generales:

- **Red hogareña**: router + puntos de acceso (o router con Wi-Fi integrado) + módem del proveedor.
- **Oficina chica**: switch + router + access point + cableado.
- **Empresa**: switches, routers, firewalls, cableado estructurado, servidores, y un rack donde ordenarlo todo.

### 4.7. ¿Puedo configurarla yo mismo o necesito un experto?

Siendo honestos: una red hogareña la configura cualquiera siguiendo un manual (de eso se trata este curso). Una red empresarial — con VLANs, seguridad, redundancia y WAN — requiere formación específica. No es una cuestión de capacidad sino de **profesionalismo**: así como no pedís a un plomero que diseñe un edificio, una red corporativa se diseña con criterio de ingeniería.

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

Este caso lo vas a poder resolver vos mismo al final del curso.

---

## 5. Administración de red: la red no se cuida sola

Una vez que la red está armada, **empieza el trabajo de verdad**: la administración. Es el equivalente a dar mantenimiento al edificio del sistema postal: si nadie lo hace, todo se deteriora.

### 5.1. Las cuatro tareas básicas

| Tarea | ¿Qué es? | ¿Qué pasa si no se hace? |
|-------|----------|--------------------------|
| **Monitoreo** | Vigilar el estado de la red: qué dispositivos están conectados, cuánto tráfico circula, dónde hay errores | Los problemas se descubren cuando ya tumbaron la red |
| **Actualizaciones** | Aplicar parches de seguridad y mejoras de firmware de routers, switches, impresoras, etc. | Vulnerabilidades conocidas quedan abiertas a ataques |
| **Gestión de usuarios y permisos** | Crear/eliminar cuentas, dar accesos correctos, quitar accesos de quien se fue | Ex empleados con acceso, permisos excesivos |
| **Mantenimiento preventivo** | Revisar cableado, limpiar equipos, verificar respaldos, probar la redundancia | Fallas por desgaste, polvo, conexiones flojas, fuentes viejas |

> **Dato real:** la mayoría de las caídas de red en PYMES no son por ataques sofisticados, sino por mantenimiento básico descuidado: switches viejos sin actualizar, cables sueltos, routers sobrecalentados, o configuraciones de hace años que nadie revisó.

### 5.2. ¿Quién administra la red?

| Tipo de red | ¿Quién la administra? |
|-------------|------------------------|
| Casa | Vos (con un mínimo de criterio: actualizar el router, cambiar contraseñas) |
| Pyme chica | Un empleado con conocimientos técnicos, o un servicio técnico externo |
| Empresa grande | Un equipo de administradores de red (o un proveedor administrado, "MSP") |
| La red del proveedor | El ISP (vos no administrás la infraestructura de internet) |

### 5.3. Herramientas de administración

Existen herramientas que simplifican todo esto: paneles de monitoreo (que muestran el estado de todos los dispositivos en un tablero), sistemas de gestión de configuración, alertas automáticas cuando un equipo cae. Estas herramientas se practican a fondo en los ejercicios de este curso.

---

## 6. Tipos de redes según su alcance

Las redes se clasifican según **qué tan lejos llegan**. Es una escala continua: desde el Bluetooth de tus auriculares hasta la red mundial que es internet.

### 6.1. La escala completa

```
  PAN          LAN/WLAN         CAN             MAN               WAN            GAN
  (metros)     (edificio)      (campus)         (ciudad)         (países)       (mundo)
  [vos]        [tu casa/oficina] [universidad]  [Wi-Fi urbano]   [sucursales]   [internet]
   < 10 m       < 300 m         < pocos km       decenas de km    cientos-km     global
```

### 6.2. PAN — Personal Area Network (red de área personal)

**Alcance:** unos pocos metros (≤ 10 m aproximadamente).

Conecta dispositivos **alrededor de una persona**. Es la red más íntima que existe.

| Ejemplo | ¿Cómo se conecta? |
|---------|-------------------|
| Auriculares inalámbricos al celular | Bluetooth |
| Reloj inteligente y teléfono | Bluetooth |
| Teclado y mouse inalámbricos | Bluetooth o dongle de radiofrecuencia |
| Celular y auto (Android Auto / CarPlay) | Bluetooth + Wi-Fi |

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

> **Dato técnico importante:** la velocidad típica de una LAN moderna es de **1 Gbps** (gigabit por segundo) en cable, y de unos cientos de Mbps en Wi-Fi. Si un día escuchás "mis archivos van lento", casi siempre es el Wi-Fi, no el cable.

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

### 6.6. WAN — Wide Area Network (red de área extendida)

**Alcance:** países, continentes (cientos o miles de kilómetros).

Conecta redes que están **lejos entre sí**. Es la categoría que usan las empresas con sucursales en distintas ciudades, y la que arman los proveedores de internet.

> **La idea clave de la WAN:** ninguna empresa "cablea" entre ciudades. Nadie entierra cientos de kilómetros de cable propio. Lo que se hace es **contratar** capacidad al proveedor (ISP), que ya tiene esa infraestructura. Así, la sucursal de Buenos Aires y la de Córdoba se conectan a través de la red del ISP, como si fueran una sola.

```
    Sucursal BA ──┐                     ┌── Sucursal Córdoba
                  │     (red del ISP)  │
    Casa central ─┴── [WAN] ───────────┴── Sucursal Rosario
```

### 6.7. GAN — Global Area Network (red de área global)

**Alcance:** todo el planeta.

Es la categoría de **internet**: la red que conecta todas las redes del mundo. Cuando navegás, tu red doméstica pasa a ser un pequeño suburbio dentro de esta red global.

> **Dato curioso:** internet no tiene dueño. Ninguna empresa ni gobierno "es" internet. Lo que existe es un conjunto de miles de redes que se interconectan mediante acuerdos, y que comparten el mismo lenguaje (los protocolos TCP/IP).

### 6.8. Tabla resumen

| Tipo | Alcance | Ejemplo típico | ¿Quién la arma? |
|------|---------|----------------|-----------------|
| PAN | Metros | Auriculares Bluetooth | El usuario |
| LAN/WLAN | Un edificio | Red de casa u oficina | El usuario / un técnico |
| CAN | Un campus | Universidad | La institución |
| MAN | Una ciudad | Wi-Fi urbano, cable TV | ISP / municipio |
| WAN | Países | Sucursales de una empresa | ISP (se contrata) |
| GAN | Mundo | Internet | Nadie en particular: es la interconexión de todas |

> **Nota importante:** LAN y WAN no están separadas por una línea clara. Hoy las empresas mezclan tecnologías que se usan en ambas, y una red puede empezar como LAN y terminar conectada a una WAN. La clasificación es una herramienta para pensar, no una camisa de fuerza.

---

## 7. Las VPN: un túnel privado dentro de una red pública

### 7.1. El problema que resuelve

Supongamos que trabajás desde tu casa y necesitás acceder a los archivos de la oficina. Internet es un espacio **público**: todo lo que viaja por ella puede ser interceptado (en el punto 13 vas a ver por qué exactamente). Mandar datos de la empresa por internet "pelado" es como enviar una carta sin sobre: cualquiera que la toque la lee.

### 7.2. La solución: el túnel

Una **VPN** (*Virtual Private Network*, red privada virtual) crea un **túnel cifrado** entre tu dispositivo y la red de la oficina, atravesando internet. Todo lo que viaja por ese túnel va **encriptado**: aunque alguien lo intercepte, no puede leerlo.

```
    Tu casa                           Internet                          Oficina
  [Notebook] ────[Túnel VPN cifrado ────────>]──────────[VPN]──[Servidor de archivos]
                  (nadie puede leer lo que viaja adentro)
```

> **Analogía:** internet es una autopista llena de gente mirando lo que llevás. Una VPN es un túnel cerrado que va de tu casa a la oficina: entrás con tu auto, nadie ve qué llevás adentro, y salís directo en el estacionamiento de la oficina.

### 7.3. ¿Para qué se usan las VPN?

| Uso | Descripción |
|-----|-------------|
| **Teletrabajo** | El empleado accede a la red de la empresa como si estuviera en la oficina |
| **Privacidad en redes públicas** | Usar el Wi-Fi de un hotel o aeropuerto sin que te espíen |
| **Unir sedes** | Conectar la red de dos sucursales como si fueran una sola (VPN sitio a sitio) |
| **Ocultar ubicación** | La dirección IP visible pasa a ser la del servidor VPN, no la propia |

### 7.4. Una aclaración importante (leyendo entre líneas)

Muchos servicios que se venden como "VPN para consumidores" lo que realmente hacen es **enrutar tu tráfico por servidores del proveedor**, además de cifrarlo. Eso sirve para privacidad, pero no convierte a tu conexión en "invisible" ni "impenetrable". La disciplina de seguridad real está en el cifrado, las contraseñas, y las políticas — no en el logo de la app.

> **Dato técnico:** la VPN es un **complemento transversal**: se puede aplicar sobre cualquier tipo de red (LAN, WAN, celular). No es "otra categoría de red" que reemplace a las anteriores — es un mecanismo que se suma a ellas.

---

## 8. Modelos de conexión: ¿iguales o jerárquicos?

Dos computadoras conectadas pueden relacionarse de dos formas filosóficamente distintas: como **iguales** (P2P) o como **jefe-empleado** (cliente-servidor). Ambas siguen existiendo hoy, cada una en su terreno.

### 8.1. Red Peer-to-Peer (P2P — entre pares)

En una red P2P, todas las computadoras tienen **los mismos derechos**: cada una puede ser a la vez cliente (pedir recursos) y servidor (ofrecer recursos). No hay jerarquía, no hay centro de control.

```
   [PC1] ────── [PC2]         Cada PC comparte archivos con las demás
     │  \      /  │           y pide archivos a las demás
     │   \    /   │           (todos son iguales)
   [PC3] ────── [PC4]
```

| Característica | Descripción |
|----------------|-------------|
| Cómo funciona | Cada nodo ofrece y consume recursos |
| Ventaja principal | Simple: no hace falta configurar un servidor |
| Ejemplos reales | Compartir archivos en una red doméstica, juegos en red LAN, redes BitTorrent, aplicaciones de mensajería descentralizadas |
| Limitaciones | Escala mal (a más nodos, más difícil controlar), sin gestión central de permisos, seguridad limitada |

### 8.2. Red Cliente-Servidor

Acá hay **roles fijos**: uno o más **servidores** (máquinas potentes que ofrecen servicios y almacenan datos) y muchos **clientes** (las computadoras de las personas, que piden servicios).

```
            [SERVIDOR]
           /     |     \
          /      |      \
     [PC1]    [PC2]    [PC3]      ← los clientes piden, el servidor responde
```

| Característica | Descripción |
|----------------|-------------|
| Cómo funciona | El servidor (o varios) centraliza los datos y servicios; los clientes los consumen |
| Ventaja principal | Control central: permisos, respaldos, seguridad y actualizaciones en un solo lugar |
| Ejemplos reales | Navegar una web (tu navegador es cliente del servidor web), el correo, las bases de datos, YouTube, los juegos online con servidores centrales |
| Limitaciones | El servidor es un punto de falla (si cae, todos se quedan sin servicio); requiere administración y presupuesto |

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

**Regla de oro:** si la red va a crecer, si hay datos importantes, o si hay más de ~10 dispositivos, se elige **cliente-servidor**. El P2P queda para redes pequeñas o usos específicos donde la simplicidad vale más que el control.

---

## 9. Topologías de red: la forma de la red

### 9.1. ¿Qué es una topología?

La **topología** es **cómo están conectados los nodos de una red entre sí**. Es la "forma" de la red. Se puede pensar de dos maneras:

- **Topología física**: cómo están conectados los **cables y dispositivos en la realidad**. Es el mapa de instalación.
- **Topología lógica**: cómo **viajan los datos** entre los nodos, independientemente de los cables. Es el mapa de conversaciones.

> **Analogía:** la topología física es el plano de las rutas de una ciudad (las calles reales). La topología lógica es el recorrido que hace una carta de una casa a otra (puede haber una ruta directa aunque las calles den vueltas). No siempre coinciden.

A continuación, las seis topologías clásicas. Para cada una: qué es, un diagrama, sus fortalezas, sus debilidades, y **cuándo conviene usarla**.

### 9.2. Topología en estrella

Todos los nodos se conectan a un **dispositivo central**. Todo el tráfico pasa por el centro.

```
              [PC2]
               |
      [PC1]──[CENTRO]──[PC3]
               |
              [PC4]
```

El "CENTRO" históricamente era un **hub** (un repetidor tonto que mandaba todo a todos), y hoy es un **switch** (un equipo inteligente que manda cada dato solo a su destinatario). La estrella es **la topología de facto** de las redes modernas: tu red de casa es una estrella con el router en el centro.

| A favor | En contra |
|---------|-----------|
| Si un nodo falla, **la red sigue funcionando** (solo se cae ese nodo) | Si **falla el centro, se cae todo** (punto único de falla) |
| Agregar o quitar dispositivos no interrumpe la red | El centro requiere una inversión (switch/router) |
| Fácil detectar dónde está el problema: se aísla por nodo | Más cable que en un bus (cada nodo necesita su cable al centro) |
| Rendimiento predecible: el centro gestiona el tráfico | El centro puede ser un cuello de botella si es muy chico para la red |

**¿Cuándo usarla?** Casi siempre. Es la elección natural para hogares, oficinas y la mayoría de las LANs. Es flexible, fácil de administrar y de crecer.

> **Ojo con un error común:** decimos "hub en el centro" y "switch en el centro" como si fueran sinónimos. No lo son. El hub (capa 1) repite todas las señales a todos los puertos; el switch (capa 2) aprende y envía solo al destino. Más adelante vas a ver exactamente cómo piensa un switch. La topología es la misma (estrella); el *cerebro* en el centro es distinto.

### 9.3. Topología en bus

Todos los nodos cuelgan de **un único cable central** (el "bus" o troncal), con un **terminador** en cada extremo.

```
  [PC1]    [PC2]    [PC3]    [PC4]
    │        │        │        │
  ──┴────────┴────────┴────────┴───   ← cable principal
   TERM.                              TERM.
```

| A favor | En contra |
|---------|-----------|
| Muy económica: un solo cable para toda la red | **Todo el cable es el punto de falla**: si se corta en cualquier punto, se cae toda la red |
| Instalación simple | Un nodo más = más lentitud para todos (el medio se comparte) |
| Fácil de entender | Solo un equipo puede transmitir a la vez; si dos transmiten a la vez, **colisión** (y hay que retransmitir) |
| | Difícil encontrar la falla sin equipos de medición |

**¿Cuándo usarla?** En la práctica, **ya no se usa** para LANs modernas (fue la red de cable coaxial de los años 80-90, 10Base2/10Base5). Pero la idea del bus **sobrevive lógicamente**: el cable de TV por cable (DOCSIS) y las primeras redes Ethernet eran buses. Lo estudiamos porque te explica por qué nacieron los switches: para eliminar las colisiones del bus.

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

| A favor | En contra |
|---------|-----------|
| Cada nodo actúa como repetidor: las distancias pueden ser largas | **Si un nodo muere, el anillo se rompe** y afecta a toda la red |
| Sin colisiones (el "token" da el turno de hablar) | Agregar o quitar un nodo **detiene la red** para todos |
| Rendimiento predecible en cargas altas | El tráfico "da la vuelta" entera aunque el destino esté al lado |
| | Tecnología históricamente cara (FDDI requería fibra) |

**¿Cuándo usarla?** Actualmente **quedó en desuso** en LANs (IBM Token Ring y FDDI fueron sus exponentes). Sigue viva la idea en algunos backbone de fibra (redes de anillo de los ISP para las ciudades) donde el anillo doble da redundancia: si se corta un tramo, el tráfico va por el otro lado.

> **Analogía:** el anillo es un tren de juguete que pasa por todas las estaciones: la carga le da toda la vuelta y cada estación mira si es para ella. Si una estación desaparece... el tren descarrila.

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

| A favor | En contra |
|---------|-----------|
| Muy escalable: se agregan "ramas" a medida que crece la organización | Si falla el **tronco** (centro principal), todo lo que cuelga de él se cae |
| Facilita aislar problemas por rama (se diagnostica cada subred por separado) | Requiere más cableado que una estrella simple |
| Natural para organizaciones por departamentos/funciones | La gestión se vuelve compleja en árboles grandes: hay que documentar bien |

**¿Cuándo usarla?** En redes de tamaño medio/grande: un edificio de oficinas donde cada piso tiene su switch, y todos los switches suben al switch central. Es la evolución natural de la estrella cuando una sola no alcanza.

> **Dato técnico:** casi todas las LANs empresariales modernas son, en la práctica, un árbol de estrella: switches de acceso por piso → switch de distribución → switch de núcleo (core). Esta jerarquía se llama "diseño jerárquico de red" y es la base de las redes empresariales modernas.

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

| A favor | En contra |
|---------|-----------|
| Altísima fiabilidad: si falla un enlace, **hay rutas alternativas** | Mucho cable y puertos (la malla completa con n nodos necesita n(n−1)/2 enlaces) |
| Sin "cuello de botella" central: el tráfico puede tomar el camino más corto | Instalación costosa y laboriosa |
| Escala bien para redes críticas | La lógica de enrutamiento es compleja (hay que elegir la mejor ruta) |

**¿Cuándo usarla?** En sistemas críticos donde la caída no es opción: el núcleo de internet (los grandes proveedores se conectan entre sí en malla parcial), redes militares, y el **Wi-Fi mesh** de hogares modernos (varios puntos de acceso que se cubren entre sí para eliminar zonas sin señal).

> **Dato real del día a día:** el Wi-Fi mesh de tu casa (esos sistemas con varios aparatos que se llaman igual) es una malla inalámbrica parcial: cada punto se conecta con los otros puntos para extender la cobertura sin cablear.

### 9.7. Topología híbrida

Combina **dos o más topologías** en una misma red. Es, de lejos, la más común en organizaciones grandes: cada departamento puede tener su estrella, los edificios se conectan en árbol, y las sedes lejanas se unen con malla parcial a través de la WAN.

```
   [Edificio 1: árbol]       [Edificio 2: estrella]
          │                         │
          └─────────(WAN)───────────┘
                    (enlace de malla entre sedes)
```

| A favor | En contra |
|---------|-----------|
| Máxima flexibilidad: cada zona usa la topología que le conviene | Complejidad: hay que entender y administrar varias topologías a la vez |
| Crece a medida de las necesidades | Diagnosticar problemas es más difícil (¿de qué topología es este problema?) |
| | Cuesta más documentar y capacitar al equipo |

**¿Cuándo usarla?** Cuando la organización tiene zonas con necesidades distintas (una oficina chica no necesita la redundancia de una sala de servidores). En la práctica: casi toda red empresarial de cierto tamaño es híbrida.

### 9.8. Arquitecturas prácticas vs. topologías puras

Un apunte honesto para principiantes: las topologías "puras" (bus, anillo) son **modelos teóricos e históricos**. Las redes reales de hoy son, en su gran mayoría:

1. **Estrella** en cada piso/hogar (switch o router central).
2. **Árbol** uniendo las estrellas (jerarquía de switches).
3. **Malla parcial** en los enlaces críticos (entre sedes, en el núcleo de los ISP).
4. **Híbrida** combinando lo anterior.

Dominar el modelo de estrella es el 80% de lo que necesitás para entender LANs reales. Las demás son contexto que explica el porqué del diseño.

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

### 11.3. Herramientas para mapear

| Nivel | Herramienta |
|-------|-------------|
| Manual simple | Dibujo a mano, diagramas en herramientas de diagramación (draw.io, excalidraw) |
| Profesional | Software de monitoreo con **descubrimiento automático** (LLDP/CDP, SNMP, nmap): escanea la red y dibuja la topología de capa 2 y 3 solita |
| Cisco / Packet Tracer | El simulador permite armar y documentar topologías completas |

> **Regla de administración:** toda red que supere los ~10 dispositivos merece un mapa actualizado. Actualizarlo cada vez que se hace un cambio es parte del trabajo, no un extra.

---

## 12. Componentes de red en profundidad

Llegó el momento de estudiar las piezas. Acá está el detalle técnico que un futuro administrador necesita.

### 12.1. Dispositivos finales (hosts)

Son los que las personas usan: la computadora, el celular, la impresora, el servidor, la Smart TV, la cámara IP. **Un host es el origen o el destino de los datos** — no un mero transportador.

Todos los hosts tienen una **NIC** (Network Interface Card — tarjeta de interfaz de red): el componente que los conecta al enlace. Es el "oído y boca" del dispositivo.

- En una notebook suele estar integrada en la placa madre (y tiene además una antena Wi-Fi).
- Cada NIC tiene una dirección **MAC** única de fábrica: su identificador físico.

> **Dato para "hacelo vos":** en Windows, abrí una terminal y escribí `ipconfig /all`; en Linux, `ip a`. Vas a ver la IP de tu equipo, la máscara, el gateway y la MAC física. Eso que aparece en pantalla son exactamente los conceptos de este curso. Tratá de identificar cada campo con lo que ya sabés.

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

#### Router (enrutador)

- **Capa:** 3 (red).
- **Qué hace:** lee las **direcciones IP**, decide por qué camino enviar los paquetes hacia otras redes, y conecta tu red con el resto del mundo.
- **Qué NO hace:** no "inunda" nada ni se entera de MACs ajenas... bueno, en realidad sí usa MAC para el tramo local (ARP), pero su función central es el enrutamiento.
- **Analogía:** la oficina central de correos que mira el código postal (la IP) y decide por qué ruta despachar el paquete.
- **Estado actual:** el dispositivo que tenés en tu casa (combinado con switch, Wi-Fi y módem en uno solo).

```
  [LAN 192.168.1.0] → [Router] → decide ruta → [otra red / Internet]
```

#### Punto de acceso inalámbrico (AP — Access Point)

- **Qué hace:** conecta dispositivos **Wi-Fi** a la red cableada. Es como un switch pero con ondas de radio.
- **Para qué sirve:** sin AP, los dispositivos inalámbricos no pueden entrar a la LAN.

#### Módem / ONT

- **Qué hace:** convierte la señal que te entrega el **proveedor** (fibra, cable, DSL, 4G/5G) en una señal que tus dispositivos entienden (Ethernet).
- **Por qué existe:** tu red interna habla "Ethernet"; la red del ISP habla "fibra/coaxial". Alguien tiene que traducir. Ese alguien es el módem.

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

> **Regla fácil de recordar:** *el hub replica, el switch entrega, el router decide.* Si lo pensás así, nunca más los vas a confundir.

### 12.4. Switch de capa 3 (multicapa)

Existe un híbrido: el **switch de capa 3**, que combina la velocidad del switch con la capacidad de enrutamiento del router. Por eso cuando veas "capa 3" en un switch, significa que puede enrutar entre VLANs o entre redes sin necesitar un router aparte. Es habitual en redes grandes.

### 12.5. Los medios de transmisión en detalle

#### Par trenzado (UTP)

- Es el cable Ethernet clásico: 8 hilos de cobre trenzados de a pares dentro de una chaqueta, con conector **RJ45**.
- **Alcance práctico:** hasta 100 metros por tramo (después se necesita switch o repetidor).
- **Categorías comunes:** Cat5e (1 Gbps), Cat6 (1-10 Gbps según distancia), Cat6a (10 Gbps).
- **Uso:** la columna vertebral de las LANs cableadas.

#### Fibra óptica

- Los datos viajan como **pulsos de luz** por filamentos de vidrio.
- **Ventajas:** velocidades enormes (10/40/100/400 Gbps), distancias largas (kilómetros), inmune a interferencias eléctricas.
- **Variantes:** monomodo (largas distancias, láser) y multimodo (distancias cortas, LED).
- **Uso:** internet actual — desde los cables submarinos entre continentes hasta la "fibra al hogar" (FTTH) que te instala tu proveedor.

#### Coaxial

- Un conductor central rodeado de un blindaje. Fue el cable de las redes Ethernet originales y hoy es el cable de **TV por cable / internet por cable** (estándar DOCSIS).

#### Inalámbrico

| Tipo | Alcance típico | Uso |
|------|----------------|-----|
| Wi-Fi (802.11) | 10-50 m en interiores | LAN inalámbrica |
| Bluetooth | ~10 m | Periféricos y PAN |
| Celular 4G/5G | Kilómetros (cobertura de la antena) | Internet móvil |
| Satelital | Global | Zonas sin otra cobertura |

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

---

## 13. ¿Qué pasa cuando abro Google? El viaje completo

Esta es la sección más importante del manual, porque junta TODO lo anterior en una sola historia. Cuando escribís `google.com` en el navegador y tocás Enter, esto es lo que pasa (en orden, y sin profundizar todavía):

### Paso 1 — Tu navegador prepara el pedido

El navegador genera una **solicitud** de la página (protocolo HTTP/HTTPS). Esa solicitud es un montón de datos que quieren ir a Google.

### Paso 2 — Traducir el nombre a una dirección

Tu navegador no sabe dónde está "google.com": internet no entiende nombres, entiende **direcciones IP**. Entonces pregunta al **servidor DNS** (el "directorio telefónico" de internet): "¿cuál es la IP de google.com?". El DNS responde, por ejemplo, `142.250.64.14`.

> **Analogía:** el DNS es la guía telefónica de internet. Guardás "Pizzería del Centro" en la agenda, pero el teléfono solo marca números.

### Paso 3 — El viaje de ida

La solicitud se parte en **paquetes** y cada paquete sale de tu host:

1. Atraviesa tu red local (**LAN**) por el switch, si lo hay.
2. Llega al **router de tu casa**, que le pone tu "dirección de origen" y lo despacha a través del **módem** hacia el proveedor (en el camino, el router aplica **NAT**, el mecanismo que permite que miles de redes compartan un mismo rango de IPs).
3. Los **routers de los ISP** lo reenvían de red en red, eligiendo cada vez la mejor ruta, hasta llegar al router de Google.

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

**Recordá este momento.** Cuando domines el vocabulario técnico, vas a poder explicarle a cualquiera — con lujo de detalle — qué pasa entre el Enter y la página en pantalla.

---

## 14. Comprobá lo que aprendiste

Intenta responder sin mirar las respuestas. Cuando termines, desplegá cada una para verificar.

### Pregunta 1
¿Cuáles son los tres ingredientes básicos de toda red?

<details>
<summary>Ver respuesta</summary>

**Nodos** (los dispositivos), **enlaces** (los caminos: cable, fibra, Wi-Fi) y **protocolos** (el idioma común que les permite entenderse).
</details>

### Pregunta 2
Tu oficina tiene 30 computadoras conectadas a un switch central. ¿Qué topología es? ¿Qué pasa si el switch se estropea?

<details>
<summary>Ver respuesta</summary>

Es una topología en **estrella**: todos los nodos cuelgan de un dispositivo central. Si el centro (switch) falla, **toda la red se cae** — es el punto único de falla de la estrella.
</details>

### Pregunta 3
¿Cuál es la diferencia entre un hub y un switch?

<details>
<summary>Ver respuesta</summary>

El **hub** repite toda señal por TODOS los puertos (no distingue destinatarios). El **switch** aprende en qué puerto está cada dispositivo y envía los datos **solo al puerto del destinatario**. Regla: *el hub replica, el switch entrega, el router decide*.
</details>

### Pregunta 4
¿Qué tipo de red va de una ciudad a otra conectando sucursales de una empresa? ¿Y qué tipo conecta tus auriculares al celular?

<details>
<summary>Ver respuesta</summary>

Sucursales en distintas ciudades → **WAN** (y se contrata al proveedor, no se cablea solo). Auriculares al celular → **PAN** (red de área personal, típicamente Bluetooth).
</details>

### Pregunta 5
¿Por qué una red P2P no suele ser la mejor opción para una empresa?

<details>
<summary>Ver respuesta</summary>

Porque no tiene **control central**: escalar es caótico, la seguridad y los permisos son difíciles de gestionar, y no hay un punto donde respaldar y proteger los datos. El modelo **cliente-servidor** centraliza la administración, los permisos y los respaldos, que es justo lo que una empresa necesita.
</details>

### Pregunta 6
Estás navegando y la página tarda mucho en cargar. Tu amigo dice "seguro es tu placa de red, la capa 1". ¿Qué podés responderle con criterio?

<details>
<summary>Ver respuesta</summary>

Que la lentitud puede venir de **muchas capas**: el enlace (capa 1), la red doméstica con muchos dispositivos compitiendo, el enrutamiento del ISP, o el propio servidor de la página (capa 7). Con una sola medición no se puede culpar a la placa de red. Un buen diagnóstico separa los síntomas: ¿pasa con un solo sitio o con todos? ¿pasa por cable y por Wi-Fi? ¿pasa a otra hora?
</details>

### Pregunta 7
El proveedor te vende "100 megas". ¿Cuántos megabytes por segundo podés esperar como máximo, aproximadamente?

<details>
<summary>Ver respuesta</summary>

Los "megas" del proveedor son **megabits por segundo**. Un byte son 8 bits, así que 100 Mbps ≈ **12,5 MB/s** como máximo teórico (en la práctica, menos). Confundir las unidades es el error de principiante más común del mundo de las redes.
</details>

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

---

## Próximo paso

Este manual te dio el **mapa general**: qué es una red y con qué piezas se construye.

El siguiente paso profundiza en *cómo piensan* los dispositivos: cómo se apilan los "sobres" de datos (la encapsulación), qué hace cada capa y cómo viaja un paquete de punta a punta con sus protocolos. Es el paso que convierte el mapa en un **plano de ingeniería**.

Cuando lo tengas listo, vas a poder decir: "lo que acá llamé *router decide*, allá se llama *capa 3*", y ahí empieza a aparecer el vocabulario técnico profesional.

---

> **Fuente:** Documentación propia basada en estándares IEEE 802, material educativo de redes (CCNA, redes de computadoras) y el manual original de este curso.

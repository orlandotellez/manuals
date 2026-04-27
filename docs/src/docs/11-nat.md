## 1. Qué es NAT y cómo actúa en nuestra red

### Introducción

Para acceder a Internet, se necesita una dirección IP pública, aunque también podemos usar una dirección IP privada en nuestra propia red privada. Esto se logra a través la traducción de una dirección IP privada a una dirección IP pública, apoyándonos en un traductor de direcciones de IP o Network Address Translator (NAT).

### Funcionamiento de NAT

Su función es la de permitir que múltiples dispositivos (PC, tablet, laptop, celulares, servidores, etc.) accedan a Internet a través de una misma dirección pública mediante la traducción de un conjunto de direcciones IP, por lo general internas, para que sean comprendidos por otro conjunto de direcciones, por lo general externas (Internet) y viceversa.

Esto ayuda a que una serie de dispositivos conectados a una red local puedan utilizar la misma dirección IP externa para el uso de Internet.

Como habíamos mencionado antes, mediante NAT una o más direcciones IP locales se traducen en una o más direcciones IP globales y viceversa para dar acceso a Internet; pero también se realiza la traducción de los números de puerto. Es decir, se enmascara el número de puerto del host con otro número de puerto en el paquete de datos que se enrutará al destino. Luego realiza las entradas correspondientes de dirección IP y del número de puerto en la tabla NAT, que generalmente opera en un enrutador o firewall.

Para dejarlo más claro, el router de borde está normalmente configurado para NAT, con una interfaz en la red local (interna) y una en la red global (exterior). Cuando un paquete atraviesa fuera de la red local (interna), NAT convierte esa dirección IP local (privada) en una dirección IP global (pública). Cuando un paquete ingresa a la red local, la dirección IP global (pública) se convierte en una dirección IP local (privada).

Una vez entendido esto, hay que hablar del enmascaramiento: supongamos que en una red existen dos hosts (A y B) conectados y ambos solicitan el mismo destino, en el mismo número de puerto (digamos 1000), en el lado del host, al mismo tiempo. Si NAT solo traduce direcciones IP, cuando los paquetes lleguen a NAT, ambas direcciones IP quedarán enmascaradas por la dirección IP pública de la red y se enviarán al destino. El destino enviará respuestas a la dirección IP pública del enrutador. Por lo tanto, al recibir una respuesta, NAT no tendrá claro qué respuesta pertenece a qué host (porque los números de puerto de origen para A y B son los mismos). Por lo tanto, para evitar este problema, NAT también enmascara el número de puerto de origen y realiza una entrada en la tabla NAT.

Con esto, vemos que NAT realiza dos funciones básicas: la asignación de una o múltiples direcciones IP públicas para la red local y la simplificación del direccionamiento mediante el enmascaramiento de direcciones IP privadas.

### Tipos de NAT

Por su configuración, existen tres diferentes tipos de NAT con distintas funciones:

1.  **NAT estática** donde se establece una asociación fija y permanente entre una dirección IP privada en la red local y una dirección IP pública específica. Generalmente se usa para hosting de web, no para organizaciones donde hay múltiples dispositivos porque cada dispositivo demandaría una dirección pública, lo que resultaría muy costoso y difícil de gestionar.

2.  **NAT dinámica** donde se establece un conjunto de direcciones IP públicas disponibles para que un dispositivo de la red local solicite acceso a Internet y esta le asigne temporalmente una dirección IP pública disponible. En caso de que la dirección IP del grupo no esté libre, el paquete se descartará, ya que solo un número fijo de direcciones IP privadas se pueden traducir a direcciones públicas. Entendiendo esto, este tipo de NAT puede ser también muy costoso.

3.  **NAT PAT (Port Address Translation)** donde se establece una asociación entre los dispositivos de red local y una única IP pública, diferenciando en cada dispositivo un puerto que se le asigna para recibir el tráfico de red correspondiente para cada dispositivo. PAT busca conservar el puerto de origen inicial. En caso de que el puerto de origen inicial ya esté en uso, se asigna el siguiente puerto disponible, en un proceso continuo, hasta que no haya más direcciones IP externas o puertos disponibles.

    Este tipo de NAT se utiliza con mayor frecuencia porque es el más rentable, ya que miles de usuarios pueden conectarse a Internet utilizando solo una dirección IP global (pública) real.

### Seguridad NAT

Actualmente, muchos ingenieros de redes recurren al uso de NAT para proteger a sus dispositivos en la red de los ataques cibernéticos, ya que actúa como una capa adicional de seguridad entre los dispositivos de una red privada e Internet. Esto es porque el enrutador NAT o firewall NAT pueden ordenar y verificar los datos a medida que se envían a un dispositivo, ocultando direcciones IP internas, dejándolas inaccesibles desde Internet. Esto puede ayudar a evitar ataques como escaneos de puertos, que permiten identificar vulnerabilidades en los dispositivos de la red.

También NAT permite la integración con firewalls de los routers y de los propios dispositivos de la red, mejorando la implementación de políticas de seguridad.

Otro aspecto importante de la seguridad es que NAT contribuye a prevenir el agotamiento de la IP privada, ya que el uso de una única dirección IP pública para varios dispositivos en una red también ayuda a garantizar que la asignación de IP públicas sea lo más eficiente posible.

Cabe mencionar que las direcciones privadas no pueden garantizar una seguridad total. Sin duda, también deberías utilizar cifrado y otras herramientas de seguridad. También se debe mantener los dispositivos en una dirección IP local como una buena medida de seguridad adicional.

### Ventajas y desventajas de las NAT

**Entre las ventajas de las NAT tenemos lo siguiente:**

- NAT proporciona una capa de seguridad en la red, ya que las redes privadas no anuncian sus direcciones ni su topología interna, de manera que son seguras al tener controlado el acceso externo, aunque no reemplaza a los firewalls.
- Aumenta la flexibilidad de las conexiones a la red pública, además de compatibilidad con Protocolos de Internet Versión 4 (IPv4). Se pueden implementar conjuntos y conjuntos de respaldo/equilibrio de carga para asegurar conexiones de red pública confiables.
- En caso de sobrecarga, los hosts internos pueden compartir una única dirección IPv4 pública para todas las comunicaciones externas. Se requieren muy pocas direcciones externas para admitir varios hosts internos, lo que también implica menos gestión y costos.
- Coherencia con los esquemas de direccionamiento de red interna. Si se quiere cambiar el esquema de direcciones IPv4 públicas en una red sin direcciones IPv4 privadas ni NAT, se deben redireccionar todos los hosts en la red existente. NAT permite conservar las direcciones IPv4 privadas, a la vez que agiliza el cambio a un nuevo esquema de direccionamiento público.

**La otra cara de la moneda, son las desventajas** partiendo de que los hosts en Internet se comunican con el dispositivo con NAT y no con el host real, lo que implica:

- Aumento de retraso o latencia en la comunicación de red, ya que la traducción de cada dirección IPv4 en los encabezados del paquete de datos toma su tiempo.
- Posible deterioro en la funcionalidad de punta a punta. Muchos protocolos y aplicaciones de Internet dependen del direccionamiento, desde el origen hasta el destino. Por ejemplo, algunas aplicaciones de seguridad (firma digital) fallan porque la dirección IPv4 de origen ha cambiado antes de alcanzar su destino.
- Pérdida de trazabilidad IPv4 a la hora de rastrear paquetes en la red. Esto es porque los paquetes pasan por varios cambios de dirección en varios saltos de NAT, dificultando su seguimiento. Esto impacta en la resolución de problemas.
- Mayor complejidad en configuración y mantenimiento, principalmente a la hora de establecer reglas de traducción de direcciones IP y puertos para aplicaciones específicas. Por ejemplo, NAT modifica los valores en los encabezados que interfieren en las verificaciones de integridad realizadas por IPsec y otros protocolos de tunneling.
- Posibles interrupciones en conexiones de Protocolo de Control de Transmisión (Transmission Control Protocol, TCP). Los servicios que requieren una conexión TCP desde una red externa o “protocolos” sin estado pueden interrumpirse. A menos que el router NAT esté configurado para admitir estos protocolos, los paquetes entrantes podrían no llegar a su destino.

### Impacto en el rendimiento

NAT ayuda a reducir la carga en la red cuando permite que varios dispositivos compartan una única dirección IP pública. Esto puede ser útil cuando contamos con pocas o una única IP Pública disponible, aportando también una capa de seguridad al impedir la no identificación y el acceso directo a los dispositivos internos de la red.

Sin embargo, también puede generar limitaciones en el ancho de banda y posibles problemas de conectividad en entornos de red con un gran número de dispositivos y tráfico de red intenso. En entornos con NAT PAT se puede producir una congestión si hay muchas conexiones simultáneas desde múltiples dispositivos, lo que puede añadir una latencia adicional en la comunicación de red afectando negativamente a la experiencia del usuario.

### Carrier Grade NAT (CG-NAT)

Carrier Grade NAT (CG-NAT), también conocido como NAT masivo o a gran escala (Large-Scale NAT o LSN), es una implementación de NAT a gran escala que usan generalmente los proveedores de servicios de Internet (ISP) para gestionar e intentar conservar direcciones IPv4 públicas en sus redes.

Su función principal es proporcionar conectividad a Internet a múltiples clientes utilizando un único rango de dirección IP pública (p.e 100.64.0.0/10) mediante una gestión centralizada, realizando una traducción de direcciones a gran escala. Esto resulta en una solución temporal para mitigar la escasez de direcciones IPv4 públicas hasta que se complete la implementación total de la actualización de IPv4 en IPv6— teniendo en mente que IPv4 posibilita 4 294 967 296 de direcciones de dispositivos diferentes, lo que es un número menor a la población mundial y, por ende, menor al volumen de dispositivos en total.

Dentro de las consideraciones a tomar en cuenta, CG-NAT no resuelve el problema del agotamiento de las direcciones IPv4 cuando se necesita una dirección IP pública, como en el alojamiento web. También puede crear un cuello de botella en el rendimiento que limite su escalabilidad.

### Comprobación de uso de CG-NAT

Para comprobar si se está utilizando CG-NAT en una red es necesario acceder al router proporcionado por el proveedor de servicios de Internet (ISP) y verificar en su configuración si dentro del apartado NAT se encuentran opciones o configuraciones relacionadas con CG-NAT. Esto puede verse en las propias opciones de configuración NAT como en un apartado diferente, referenciado como “Carrier Grade NAT” o “CG-NAT”, donde se podrá verificar su estado y su configuración.

En sistemas operativos Windows, podemos comprobar si pertenecemos a un CG-NAT ejecutando el comando `tracert` y apuntando a nuestra IP pública. Si el resultado es de un solo hop (o salto), significa que no pertenecemos a una CG-NAT, si el resultado es de 2 o más hops entonces sí pertenecemos a una CG-NAT.

En sistemas operativos Linux se puede realizar el mismo procedimiento con el comando `traceroute`.

### Impacto de CG-NAT en usuarios

CG-NAT puede tener diferentes impactos, dependiendo del tipo de usuario que controle la red.

- **En usuarios avanzados**, CG-NAT puede traer complicaciones a la hora de implementar configuraciones de reenvíos de puertos, túneles IPv6, o aplicaciones de acceso remoto complejas.
- **En usuarios estándar**, el problema se puede presentar principalmente en la modalidad de trabajo remoto (o teletrabajo), en que pueden verse afectados a la hora de realizar conexiones VPN hacia la empresa, ciertas aplicaciones de videoconferencia y algunas aplicaciones de acceso remoto que dependen de conexiones entrantes desde Internet.
- **En usuarios recreacionales**, por ejemplo, en un videojuego, se requiere conexiones directas entre los jugadores, o bien dependen del reenvío de puertos para un rendimiento óptimo. CG-NAT puede causar en estos casos también problemas de latencias, con impacto directo en la experiencia del usuario.

### NAT en videojuegos

NAT puede afectar significativamente a la experiencia de juego en línea si el usuario no cuenta con los conocimientos necesarios para configurar correctamente este mecanismo de red. Muchos videojuegos en línea utilizan conexiones peer-to-peer entre jugadores para facilitar la interacción en tiempo real; por lo que si no se configura correctamente NAT, el usuario puede verse afectado, con problemas de conectividad, latencias y una experiencia de juego menos fluida o interrumpida.

Para estos casos, existen diversas soluciones para mejorar la clasificación NAT y optimizar la experiencia de juego. En PC, se debe configurar el reenvío de puertos en el router, lo cual puede ayudar a abrir puertos específicos que sean utilizados por el videojuego. Esto facilita la conexión directa entre los jugadores, reduciendo los problemas de conectividad y mejorando la clasificación NAT.

En consolas, el uso del protocolo UPnP (Universal Plug and Play) puede ayudar a abrir y redirigir automáticamente los puertos necesarios para una mejor conectividad.

En otros casos, actualizar el firmware del router o incluso adquirir un router más moderno y con mayor compatibilidad puede resolver los problemas derivados de NAT y mejorar la experiencia de juego.

### Conclusión

En conclusión, NAT desempeña un papel importante en la conectividad actual de las redes informáticas, especialmente en entornos IPv4, donde las direcciones IP públicas son limitadas. Está claro que los estrategas de seguridad deben también tomar en cuenta sus consideraciones y posibles desventajas en cuanto a latencia y trazabilidad. En ese sentido, se requiere la correcta configuración y mantenimiento de protocolos y puerto para lograr que las IP públicas estén disponibles para su uso y entrega de servicios, al mismo tiempo que se ahorra dinero y se agrega una capa adicional de seguridad, que además refuerza las políticas de seguridad integrando firewalls de routers y dispositivos.

---

## 2. Dirección IP privada frente a dirección IP pública: ¿Cuál es la mejor opción para su red industrial?

En el mundo del IoT industrial, la conectividad lo es todo. Pero a medida que amplías tu solución, llegas a una encrucijada técnica crucial: ¿deben tus dispositivos usar una dirección IP pública o privada?

Si bien su primera reacción podría ser buscar «¿cuál es mi IP pública?» para habilitar el acceso remoto, la respuesta no siempre es sencilla. En redes profesionales, la elección entre direcciones IP privadas y públicas no solo determina sus costos mensuales, sino también su nivel de seguridad y eficiencia operativa.

### Conceptos básicos: Dirección IP privada frente a dirección IP pública

En su forma más simple, una dirección IP pública es un identificador único a nivel mundial, accesible desde cualquier lugar de internet. Funciona como una dirección postal digital. Por el contrario, una dirección IP privada se utiliza dentro de redes locales y permanece oculta para la web abierta.

### Rangos de direcciones IP privadas

La mayoría de las redes internas utilizan direcciones IP privadas según el estándar RFC 1918, como los rangos comunes 192.168.x.x o 10.x.x.x. Sin embargo, los profesionales técnicos también deben conocer el espacio de direcciones compartidas (100.64.0.0/10). Si su IP WAN se encuentra dentro de este rango, está detrás de una NAT de nivel de operador (CGNAT), lo que significa que, en esencia, está detrás de una «doble NAT» administrada por su proveedor de servicios de Internet (ISP).

### IP estática frente a IP dinámica

Tanto las direcciones IP públicas como las privadas pueden ser estáticas (fijas) o dinámicas (cambiantes). Si bien una IP pública estática ofrece acceso directo para el alojamiento, suele ser costosa. La mayoría de las implementaciones de IoT móvil utilizan una IP privada dinámica por su rentabilidad, aunque requiere un intermediario o una VPN para el acceso remoto, ya que la dirección cambia y no es accesible desde internet.

### La ventaja de la seguridad: Reducción de la superficie de ataque

Si bien muchos usuarios buscan una IP pública para simplificar el acceso remoto, a menudo pasan por alto las desventajas. Exponer un dispositivo industrial directamente a internet mediante una IP pública crea una enorme brecha de seguridad que los hackers pueden encontrar fácilmente. Una dirección IP pública es escaneada constantemente por bots y actores maliciosos.

La filosofía de Teltonika, «Seguro desde el diseño», sugiere que, para la mayoría de las aplicaciones industriales, el dispositivo más seguro es aquel que no se puede ver. Al mantener sus dispositivos en una IP privada, utiliza NAT (Traducción de Direcciones de Red) como un cortafuegos natural, ocultando eficazmente su hardware de internet.

Sin embargo, la verdadera seguridad no consiste simplemente en «esconderse» tras la IP privada del operador. La defensa más fiable es un cortafuegos robusto y correctamente configurado, como el integrado en RutOS. Mediante reglas de cortafuegos avanzadas y NAT (Traducción de Direcciones de Red), puede ocultar eficazmente su hardware y controlar estrictamente el tráfico, garantizando que la seguridad la gestione su propio hardware en lugar de dejarla a discreción del proveedor de servicios.

### Resolviendo el dilema del acceso remoto con Teltonika

El reto es claro: ¿cómo mantener el acceso remoto si el dispositivo está oculto en una IP privada? Aquí es donde el ecosistema de Teltonika ofrece una ventaja significativa sobre el hardware de consumo estándar.

### RMS: Acceso sin IP pública

Nuestro Sistema de Gestión Remota (RMS) está diseñado precisamente para superar la brecha de acceso remoto. RMS crea un túnel seguro y cifrado entre su dispositivo y nuestra plataforma en la nube.

- **La ventaja:** Puedes acceder a la interfaz web de tu router e incluso a los dispositivos que hay detrás (PLC, CCTV, etc.) a través de RMS Connect, incluso si tu tarjeta SIM solo proporciona una IP dinámica privada.
- **El valor:** Eliminas la necesidad de costosos contratos de IP estática pública con operadores móviles, lo que le ahorra a tu empresa miles en gastos operativos.

### RutOS: Simplificando las redes complejas

Gestionar rangos de direcciones IP privadas y enrutamiento personalizado puede resultar complicado. RutOS, el sistema operativo basado en OpenWrt que utilizan todos los routers Teltonika, simplifica este proceso mediante una interfaz web intuitiva.

Tanto si necesita configurar el direccionamiento IP privado automático (APIPA) como si necesita establecer una VPN segura (OpenVPN, WireGuard, ZeroTier, entre otras), RutOS ofrece la flexibilidad de un sistema de nivel empresarial con la facilidad de uso necesaria para una implementación rápida.

A medida que el mundo avanza hacia IPv6, la necesidad de NAT disminuye debido a la gran cantidad de direcciones disponibles. RutOS está totalmente preparado para IPv6, lo que garantiza que, incluso cuando cada dispositivo tenga una dirección global única, nuestro firewall siga ofreciendo el mismo alto nivel de protección.

### Fiabilidad industrial con la serie RUT

Los routers de Teltonika están diseñados para gestionar las complejidades de la administración de IP. Con funciones como Auto APN, nuestros routers seleccionan automáticamente la configuración correcta para que te conectes a Internet al instante.

Si su aplicación requiere estrictamente una conexión pública, funciones como IP Passthrough permiten que el enrutador envíe su IP pública móvil directamente a su servidor interno, manteniendo al mismo tiempo un enlace de administración con RMS.

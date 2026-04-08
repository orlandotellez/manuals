
1. ¿QUÉ ES UNA DIRECCIÓN IP? ...........................................................................................3
1.1. El protocolo de internet (IP) ............................................................................................3
1.2. Cómo funciona IP .............................................................................................................3
1.3. Versiones de IP .................................................................................................................4
1.4. Direcciones IPv4 ...............................................................................................................4
1.5. Máscaras de subred ..........................................................................................................5
1.6. Clases de direcciones IP ...................................................................................................5
Clase A ......................................................................................................................................5
Clase B.......................................................................................................................................6
Clase C ......................................................................................................................................6
Clase D ......................................................................................................................................6
Clase E.......................................................................................................................................7
Resumen: clases de direcciones IP y representaciones de bits ..............................................7
1.7. Direcciones privadas ........................................................................................................7
1.8. Direcciones especiales .......................................................................................................8
1.9. Agotamiento de direcciones IPv4 ....................................................................................8
1.10. Direcciones IPv6 ...........................................................................................................8
1.11. Abreviatura de direcciones IPv6 .................................................................................9
1.12. Direcciones IPv6 privadas............................................................................................9
1.13. Resolución de nombres .................................................................................................9
1.14. Tabla de referencia de máscaras de subred ..............................................................10
Rangos de direcciones de clase: .............................................................................................10
Rangos de direcciones reservados para uso privado (no enrutado): ..................................10
Otras direcciones reservadas:................................................................................................10
Notas del gráfico:....................................................................................................................10
Clase A ....................................................................................................................................11
Clase B.....................................................................................................................................11
Clase C ....................................................................................................................................12
Clase D ....................................................................................................................................12
Ver fuentes del artículo ..............................................................................................................12
2. Subredes ¿Qué es una subred? ¿Cómo funciona? ...............................................................13
Proceso para crear subredes ..................................................................................................13
Ing. Vidal José Herrera Gutiérrez
222 de marzo de 2026
Comunicación entre subredes ...................................................................................................15
Subredes IPv6 .............................................................................................................................16
Creación de una subred IPv6 ....................................................................................................16
Redes punto a punto ...................................................................................................................17
Subred punto a punto ................................................................................................................17
Desventajas y limitaciones de las subredes ...............................................................................17
¿Qué significan las diferentes partes de una dirección IP? .....................................................18
Importancia de las subredes ......................................................................................................19
¿Qué es una máscara de subred? ..............................................................................................19
Ejemplo de máscara de subred..............................................................................................19
Conclusión ..................................................................................................................................20
Ing. Vidal José Herrera Gutiérrez
322 de marzo de 2026
1. ¿QUÉ ES UNA DIRECCIÓN IP?
Una dirección IP (protocolo de internet, por sus siglas en inglés) es una representación
numérica que identifica una interfaz concreta de manera única en la red.
Las direcciones IPv4 tienen una longitud de 32 bits, que permite un máximo de 4 294 967
296 (232) direcciones únicas. Las direcciones IPv6 son de 128 bits, lo que permite 3,4 x 1038
(2128) direcciones únicas.
No obstante, el conjunto total de direcciones utilizables en ambas versiones es menor a causa
de una serie de direcciones reservadas y otros aspectos a considerar.
Las direcciones IP son números binarios, pero, generalmente, se expresan en forma decimal
(IPv4) o hexadecimal (IPv6) para facilitar su lectura y uso por parte de los humanos.
1.1. El protocolo de internet (IP)
Como ya hemos dicho, IP significa «protocolo de internet» y describe un conjunto de
estándares y requisitos para crear y transmitir paquetes de datos (o datagramas) entre las
redes. El protocolo de internet (IP) es parte de la capa de internet del conjunto de protocolos
de internet. En el modelo OSI, la IP se consideraría parte de la capa de red. Tradicionalmente,
IP se usa junto con un protocolo de nivel superior, de los cuales el más frecuente es TCP. El
estándar IP está regido por la especificación RFC 791.
1.2. Cómo funciona IP
Se ha diseñado el protocolo IP para funcionar en una red dinámica, lo que significa que IP
debe operar sin un directorio o monitor central y que no puede depender de la existencia de
enlaces o nodos específicos. IP es un protocolo sin conexión orientado a datagramas, por lo
tanto, cada paquete debe contener un encabezado con la dirección IP de origen, la de destino
y otros datos para poder entregarlo con éxito.
Todos estos factores hacen de IP un protocolo no fiable, que consigue entregar los datos con
el mejor esfuerzo. La parte de corrección de errores se realiza en otros protocolos de nivel
superior, como TCP, que es un protocolo orientado a la conexión, y UDP, que es uno sin
conexión.
La mayoría del tráfico de internet es TCP/IP.
Ing. Vidal José Herrera Gutiérrez
422 de marzo de 2026
1.3. Versiones de IP
Actualmente hay dos versiones de IP en uso: IPv4 e IPv6. El protocolo IPv4 original todavía
se usa en internet y en muchas redes corporativas. Sin embargo, el protocolo IPv4 solo
permite 232 direcciones que, aunque puedan parecer muchas, no lo son si tenemos en cuenta
la forma de asignarlas, así como el gran número de solicitudes de las mismas. A causa de
todo ello, podríamos encontrarnos con que no habría suficientes direcciones únicas para todos
los dispositivos conectados a internet.
El Grupo de Trabajo de Ingeniería de Internet (Internet Engineering Task Force o IETF, por
sus siglas en inglés) desarrolló el protocolo IPv6, que se formalizó en 1998. Esta
actualización incrementó sustancialmente el espacio de direcciones disponible y permite
asignar hasta 2128. Además, se incluyeron cambios para mejorar la eficiencia de los
encabezados de paquetes IP, así como mejoras en el enrutamiento y la seguridad.
1.4. Direcciones IPv4
Las direcciones IPv4 son básicamente números binarios de 32 bits que consisten en las dos
subdirecciones (identificadores) mencionadas anteriormente que identifican la red y el host
a la red, respectivamente, con un límite imaginario que los separa. Una dirección IP, como
tal, generalmente se muestra como 4 octetos de números, del 0 al 255, representados en forma
decimal en lugar de binaria.
Por ejemplo, la dirección 168.212.226.204 representa el número binario de 32 bits
10101000.11010100.11100010.11001100.
El número binario es importante, porque es lo que determinará a qué clase de red pertenece
una dirección IP.
Una dirección IPv4 se expresa típicamente en notación decimal con puntos, representando
cada ocho bits (octetos) mediante un número del 1 al 255, separando cada octeto por un
punto. Un ejemplo de dirección IPv4 sería así
192.168.17.43
Las direcciones IPv4 están compuestas de dos partes. Los primeros números de la dirección
indican la red, mientras que los últimos especifican el host concreto. La máscara de subred
es lo que indica qué parte de una dirección es la de la red y qué parte se refiere al host
específico.
Ing. Vidal José Herrera Gutiérrez
522 de marzo de 2026
Un paquete con una dirección de destino que no se encuentre en la misma red que la dirección
de origen se reenviará o enrutará a la red apropiada. Una vez que se encuentre en la red
correcta, la parte del host de la dirección determinará a qué interfaz se entrega el paquete.
1.5. Máscaras de subred
Cada dirección IP identifica una red y una interfaz única en la misma. También se puede
escribir la máscara de subred en notación decimal, con puntos, y determina dónde termina la
parte de la red y dónde comienza la parte del host de la dirección IP.
Cuando se expresa en binario, cualquier bit puesto a uno significa que el correspondiente bit
en la dirección IP es parte de la dirección de red. Los bits puestos a cero indican los bits
correspondientes a parte de la dirección del host en la dirección IP.
Los bits que marcan la máscara de subred deben ser unos consecutivos. La mayoría de las
máscaras de subred comienzan con 255. y continúan hasta que finaliza la máscara de red. Por
ejemplo, una máscara de subred de clase C sería 255.255.255.0.
1.6. Clases de direcciones IP
Antes de que las máscaras de subred de longitud variable permitieran definir redes de
cualquier tamaño, el espacio de direcciones IPv4 se dividía en cinco clases.
Clase Encabezando
bits
Tamaño de red
número campo
de bits
Tamaño
del resto
campo
de bits
Número
de redes
Direcciones
por red
Total de
direcciones
en clase
Dirección
inicial
Dirección final
Clase A 0 8 24 128 (27) 16,777,216
(224)
2,147,483,648
(231)
0.0.0.0 127.255.255.255
Clase B 10 16 16 16,384
(214)
65,536 (216) 1,073,741,824
(230)
128.0.0.0 191.255.255.255
Clase C 110 24 8 2,097,152
(221)
256 (28) 536,870,912
(229)
192.0.0.0 223.255.255.255
Clase D
(multidifusión)
1110 no definido no
definido
no
definido
no definido 268,435,456
(228)
224.0.0.0 239.255.255.255
Clase E
(reservado)
1111 no definido no
definido
no
definido
no definido 268,435,456
(228)
240.0.0.0 255.255.255.255
Clase A
En una red de clase A, los primeros ocho bits de la dirección, o el primer punto decimal, son
la parte de la red, y la parte restante es la del host. Hay 128 redes de clase A posibles.
0.0.0.0 a 127.0.0.0
Ing. Vidal José Herrera Gutiérrez
622 de marzo de 2026
Sin embargo, cualquier dirección que comience con «127.» se denomina dirección de
loopback, es decir, que apunta al propio host.
Ejemplo para una dirección IP de clase A:
2.134.213.2
Clase B
En una red de clase B, los primeros 16 bits de la dirección son la parte de la red. Todas las
redes de clase B tienen el primer bit a 1 y el segundo bit a 0. Si dividimos la dirección en
octetos, nos queda que las direcciones 128.0.0.0 a 191.255.0.0 corresponden a redes de clase
B. Hay 16 384 redes de clase B posibles.
Ejemplo para una dirección IP de clase B:
135.58.24.17
Clase C
En una red de clase C, los dos primeros bits están puestos a 1 y el tercero a 0. Eso hace que
los primeros 24 bits de la dirección sean la parte de la red, y el resto, la del host. Las
direcciones de red de clase C van desde 192.0.0.0 a 223.255.255.0. Hay más de 2 millones
de redes de clase C posibles.
Ejemplo para una dirección IP de clase C:
192.168.178.1
Clase D
Las direcciones de clase D se utilizan para aplicaciones de multidifusión. A diferencia de las
clases anteriores, la Clase D no se utiliza para operaciones de red “comunes”. Las direcciones
de clase D tienen los primeros tres bits a “1” y el cuarto bit establecido a “0”. Las direcciones
de clase D son direcciones de red de 32 bits, lo que significa que todos los valores que
podemos encontrar en el rango 224.0.0.0 - 239.255.255.255 se utilizan para identificar grupos
de multidifusión de forma única. No hay direcciones de host dentro del espacio de direcciones
de clase D, puesto que todos los hosts dentro de un grupo comparten la dirección IP del grupo
a la hora de recibir datagramas.
Ejemplo para una dirección IP de clase D:
227.21.6.173
Ing. Vidal José Herrera Gutiérrez
722 de marzo de 2026
Clase E
Las redes de clase E se definen marcando los primeros cuatro bits de la dirección de red a 1,
lo que genera las direcciones que van desde 240.0.0.0 a 255.255.255.255. A pesar de que esta
clase está reservada, nunca se definió su uso, por lo que la mayoría de las implementaciones
de red descartan estas direcciones como ilegales o indefinidas, a excepción, claro está, de
255.255.255.255, que se utiliza como una dirección de difusión (broadcast).
Ejemplo para una dirección IP de clase E:
243.164.89.28
Resumen: clases de direcciones IP y representaciones de bits
Clase A
0. 0. 0. 0 = 00000000.00000000.00000000.00000000
127.255.255.255 = 01111111.11111111.11111111.11111111
0nnnnnnn.HHHHHHHH.HHHHHHHH.HHHHHHHH
Clase B
128. 0. 0. 0 = 10000000.00000000.00000000.00000000
191.255.255.255 = 10111111.11111111.11111111.11111111
10nnnnnn.nnnnnnnn.HHHHHHHH.HHHHHHHH
Clase C
192. 0. 0. 0 = 11000000.00000000.00000000.00000000
223.255.255.255 = 11011111.11111111.11111111.11111111
110nnnnn.nnnnnnnn.nnnnnnnn.HHHHHHHH
Clase D
224. 0. 0. 0 = 11100000.00000000.00000000.00000000
239.255.255.255 = 11101111.11111111.11111111.11111111
1110XXXX.XXXXXXXX.XXXXXXXX.XXXXXXXX
Clase E
240. 0. 0. 0 = 11110000.00000000.00000000.00000000
255.255.255.255 = 11111111.11111111.11111111.11111111
1111XXXX.XXXXXXXX.XXXXXXXX.XXXXXXXX
1.7. Direcciones privadas
Dentro del espacio de direcciones hay ciertas redes reservadas para redes privadas. Eso
significa que los paquetes de dichas redes no se enrutan a través de la internet pública; de
Ing. Vidal José Herrera Gutiérrez
822 de marzo de 2026
este modo, tenemos una forma perfecta para que las redes privadas usen direcciones IP
internas que no interfieran con otras redes. Las redes privadas son:
10.0.0.1 - 10.255.255.255
172.16.0.0 - 172.31.255.255
192.168.0.0 - 192.168.255.255
1.8. Direcciones especiales
Ciertas direcciones IPv4 se reservan para usos específicos:
127.0.0.0 Dirección de loopback (la propia interfaz del host)
224.0.0.0 IP multicast
255.255.255.255 Difusión (broadcast; se envía a todas las interfaces en la red)
1.9. Agotamiento de direcciones IPv4
Las especificaciones originales de IPv4 se diseñaron para la red DARPA que, finalmente,
acabaría convirtiéndose en lo que hoy es internet. Originalmente se trataba de una red de
pruebas, por lo que nadie contempló cuántas direcciones podrían ser necesarias en el futuro.
En aquel momento, se consideró que un total de 232 direcciones (4300 millones) sería más
que suficiente; no obstante, conforme pasó el tiempo, se hizo evidente que el espacio de
direcciones IPv4, tal y como estaba implementado, no sería lo suficientemente grande para
una internet mundial con numerosos dispositivos conectados por persona. Los últimos
bloques de direcciones de nivel superior se asignaron en 2011.
1.10. Direcciones IPv6
Parece que uno de los males endémicos de la tecnología es el típico problema en que la
limitación de una especificación parece más que suficiente en un momento dado, pero,
posteriormente, se vuelve demasiado pequeña y restrictiva. Pues eso mismo pasó con las
direcciones IPv4, motivo por el cual los diseñadores de IPv6 crearon un enorme espacio de
direcciones para su nueva especificación. El tamaño de la dirección aumentó de 32 bits en
IPv4 a 128 bits en IPv6.
Con IPv6 tenemos un límite teórico de 3,4 x 1038 direcciones, que equivale a más de 340
sextillones, lo que nos permitiría disponer de direcciones suficientes como para asignar una
a cada átomo de la superficie de la Tierra.
Ing. Vidal José Herrera Gutiérrez
922 de marzo de 2026
Las direcciones IPv6 están representadas por ocho conjuntos de cuatro dígitos
hexadecimales, y cada conjunto de números está separado por dos puntos. Un ejemplo de
dirección IPv6 sería así:
2DAB:FFFF:0000:3EAE:01AA:00FF:DD72:2C4A
1.11. Abreviatura de direcciones IPv6
Puesto que las direcciones IPv6 son tan largas, existen algunas convenciones para permitir
su abreviatura. Primero, se pueden eliminar los ceros iniciales de cualquier grupo de
números. Por ejemplo, :0033: se puede escribir como :33:.
Segundo, cualquier sección consecutiva de ceros se puede representar con un par de dos
puntos, aunque esto solo puede hacerse una vez en cada dirección. Sabiendo que la dirección
completa consta de 8 secciones, podemos determinar fácilmente el número de secciones
eliminadas con esta abreviatura. Por ejemplo, 2DAB::DD72:2C4A debería tener cinco
secciones de ceros en el lugar de los dos puntos dobles:
(2DAB:0000:0000:0000:0000:0000:DD72:2C4A)
La dirección de loopback, que es:
0000:0000:0000:0000:0000:0000:0000:0001
se puede abreviar como ::1.
1.12. Direcciones IPv6 privadas
Al igual que en IPv4, ciertos bloques de direcciones están reservados para redes privadas.
Estas direcciones no se enrutan a través de la internet pública. En IPv6, las direcciones
privadas se denominan direcciones locales únicas (ULA). Por defecto, las direcciones que
parten del bloque FC00:: /7 bloque se ignoran y no se enrutan.
1.13. Resolución de nombres
Tanto en IPv4 como en IPv6, recordar la dirección IP de todos los dispositivos es
prácticamente imposible, excepto en las redes más pequeñas. La resolución de nombres
proporciona una forma de buscar una dirección IP a partir de un nombre más fácil de usar.
En internet, la resolución de nombres la gestiona el sistema de nombres de dominio (DNS).
Con DNS, se puede usar un nombre en el formato host.dominio en lugar de la dirección IP

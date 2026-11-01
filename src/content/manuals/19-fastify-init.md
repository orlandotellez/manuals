# Backend Fastify Primeros Pasos

Este manual construye, capítulo por capítulo, un backend completo para un punto de venta:
roles y usuarios, autenticación con tokens, productos, servicios, inventario con
movimientos de stock, pruebas automatizadas y un checklist para verificar que todo
funciona.

Está pensado para alguien que quiere aprender a programar un backend desde cero. No hace
falta haber escrito una API antes: cada concepto —qué es una ruta, un middleware, una
migración, un token, una transacción— se explica antes de usarlo, y después se lee el
código que lo implementa.

**Qué vas a aprender**

- Cómo se arma un servidor HTTP con **Fastify** sobre **Bun**, y qué hace cada plugin.
- Por qué un proyecto se separa en capas y qué va en cada una: rutas, servicios, dominio e
  infraestructura.
- Cómo modelar datos con **Prisma** sobre PostgreSQL, y qué es una migración.
- Validación de entrada con **Zod** y un manejo de errores que devuelve siempre la misma
  forma de respuesta.
- Autenticación real: contraseñas con **bcrypt**, **JWT** de acceso y refresco, cookies
  `httpOnly`, y guardias por rol.
- Un CRUD completo escrito con paciencia, y las diferencias entre un módulo simple, uno con
  unicidad y uno con dinero (`Decimal`) de por medio.
- Inventario con **transacciones** atómicas, para que dos ventas simultáneas no rompan el
  stock.
- Pruebas de servicio con repositorios falsos, archivos `.http` para probar a mano, y un
  checklist final de verificación.

**Qué necesitás**

- Bun instalado (el proyecto lo usa como runtime, gestor de paquetes y runner de tests).
- PostgreSQL corriendo, o Docker para levantarlo.
- Un editor con TypeScript. Para los archivos `.http` alcanza con la extensión REST Client
  de VS Code, o importarlos a Postman.

**Cómo está organizado**

Son dieciséis capítulos pensados para leerse en orden, porque cada uno usa lo que armó el
anterior. Los primeros cuatro preparan el terreno: la arquitectura, las herramientas, la
base de datos y la configuración. Del quinto al séptimo está el esqueleto del servidor y la
autenticación. Del octavo al duodécimo se construye el negocio: roles, usuarios, productos,
servicios e inventario. Los últimos cuatro son la calidad: datos iniciales, pruebas,
peticiones de ejemplo y el checklist de verificación.

**Cómo leerlo**

Tené el proyecto abierto al lado del manual. Cada sección empieza con la ruta del archivo
que vas a leer, después el código y después la explicación: si algo no cierra, volvé a la
frase que explica esa línea. Cuando termines un capítulo, corré lo que propone antes de
seguir; el servidor se reinicia solo en modo desarrollo y cada endpoint que probás te
confirma que entendiste la pieza anterior.


## 01. Visión general y arquitectura

Antes de abrir un solo archivo del proyecto conviene tener claras cuatro palabras que se
repiten todo el tiempo y que, si las confundís, te van a hacer leer el resto del manual a
oscuras: **backend**, **API**, **HTTP** y **JSON**. No son sinónimos y cada una responde una
pregunta distinta.

**Un backend** es un programa que corre en una computadora que no ves —un servidor— y que no
dibuja nada en pantalla. Su trabajo es atender pedidos que llegan por la red, decidir qué
hacer con cada uno, leer o escribir en una base de datos y contestar con una respuesta. La
pantalla que vos usás (el frontend, la app del celular, el navegador) es la que dibuja; el
backend es el que decide y el que recuerda. Cuando en un negocio alguien toca "cobrar", lo
que pasa de verdad es que el frontend manda un pedido y el backend anota la venta.

**Una API** (del inglés *Application Programming Interface*) es el contrato de ese programa:
la lista de operaciones que ofrece a otros programas, con qué datos recibe cada una y qué
devuelve. El backend de este manual es una **API REST**, que es una API pensada para hablar
por HTTP con la forma que casi todo el mundo espera.

**HTTP** es el protocolo: el idioma con el que un cliente le pide algo a un servidor y el
servidor le contesta. Un pedido HTTP tiene cuatro partes que te vas a cruzar todo el tiempo:

- **Método** — el verbo: `GET` para leer, `POST` para crear, `PUT` y `PATCH` para modificar,
  `DELETE` para borrar.
- **Ruta** — la dirección del recurso, como `/products` o `/products/9f3c…`.
- **Headers** — metadatos del pedido: quién sos (`Authorization`), qué formato aceptás
  (`Accept`), qué tipo de contenido mandás (`Content-Type`), qué cookies llevás (`Cookie`).
- **Body** — el contenido propiamente dicho, y solo algunos métodos lo llevan: un `GET` no
  manda body, un `POST` sí (los datos del producto que querés crear).

Y la respuesta tiene las mismas partes, con una diferencia clave: en lugar de método y ruta
trae un **código de estado**, un número de tres cifras que dice qué pasó. Los que vas a ver
en este proyecto son:

| Código | Significado | Cuándo aparece acá |
| --- | --- | --- |
| `200` | OK | una lectura o una modificación salió bien |
| `201` | Created | se creó un recurso (`POST /products`) |
| `204` | No Content | se borró algo y no hay nada que devolver |
| `400` | Bad Request | la entrada no validó (un precio negativo, un UUID mal formado) |
| `401` | Unauthorized | no mandaste token, o el token venció |
| `403` | Forbidden | mandaste token, pero tu rol no alcanza |
| `404` | Not Found | el recurso no existe (o está borrado con soft delete) |
| `409` | Conflict | chocarías con algo único: un email repetido, un barcode repetido |
| `500` | Internal Server Error | un bug del servidor; el cliente no tiene la culpa |

**JSON** (JavaScript Object Notation) es el formato de texto con el que viajan los datos.
Nació del lenguaje JavaScript y hoy lo entiende todo el mundo: objetos entre llaves, listas
entre corchetes, y valores que pueden ser texto, número, booleano, `null`, objeto o lista.
Así se ve un producto en este sistema:

```json
{
  "id": "9f3c1b7a-4d2e-4a3b-9c1d-2f4e6a8b0c11",
  "name": "Coca-Cola 500ml",
  "price": 1500,
  "stock": 24,
  "active": true
}
```

Fijate en un detalle que parece tonto y no lo es: `price` es `1500`, un número, no `"1500"`,
un texto. Cuando un cliente recibe un precio como texto tiene que convertirlo para sumar, y
ahí empiezan los errores de redondeo y los `NaN`. Más adelante vas a ver que la base guarda
el precio como `Decimal` y que el proyecto lo convierte a número justo antes de responder,
para que el cliente nunca reciba texto donde espera un número.

**REST** es la convención que ordena todo lo anterior: en la URL van **sustantivos** (los
recursos: `/products`, `/users`), en el método va el **verbo** (qué querés hacer con ellos), y
cada pedido es **independiente**: el servidor no se acuerda de vos entre un pedido y el
siguiente. Esa última regla es la que explica media arquitectura del proyecto. Si el servidor
no guarda sesión en memoria, entonces cada pedido tiene que traer consigo la prueba de quién
sos: de ahí los tokens que viajan en cada request.

**Un endpoint** es la combinación de un método y una ruta: `GET /products` es un endpoint,
`POST /products` es otro. Son las puertas de la API. Las de este proyecto, agrupadas por
prefijo, son:

- `/auth` — `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`.
- `/roles`, `/users`, `/products`, `/services` — el CRUD de cada recurso.
- `/inventory` — `GET /inventory/movements`, `POST /inventory/movements` y
  `GET /inventory/products/low-stock`.

Este backend es la API de un **POS** (punto de venta): el sistema que está detrás de un
mostrador y que administra roles, usuarios, productos, servicios e inventario. No tiene
pantalla: lo que vas a construir son esas puertas, las reglas que hay detrás de cada una y la
base de datos donde todo queda guardado.

Está construido con **Bun** como runtime y gestor de paquetes, **Fastify 5** como framework
HTTP, **Prisma 6** como ORM sobre **PostgreSQL**, **Zod** para validación, **jsonwebtoken**
para tokens, **bcrypt** para hash de contraseñas y **pino** para logs. Cada una de esas
herramientas tiene su capítulo; acá alcanza con saber que existen y para qué están.

### Las cuatro capas, y por qué existen

Un archivo de dos mil líneas que hace todo —recibir el pedido, validar, consultar la base y
armar la respuesta— funciona. El problema no es que funcione hoy: es que dentro de tres meses
vos no vas a poder cambiarlo sin romper otra cosa, y no vas a poder probarlo sin levantar
PostgreSQL.

La solución que usa el proyecto es separar el código en **capas**: grupos de archivos que
tienen una sola responsabilidad y que solo hablan con la capa de al lado. Cada módulo de
`src/modules/<modulo>/` se divide en cuatro:

- **`domain/`** — los contratos puros de TypeScript: qué es una entidad (un producto, un
  usuario), qué forma tiene la respuesta y qué interfaz debe cumplir un repositorio. No
  importa Fastify, no importa Prisma, no importa PostgreSQL. Es la capa que sobrevive si
  mañana cambiás de framework o de base de datos.
- **`application/`** — los servicios de aplicación, donde viven las reglas de negocio: "no se
  puede crear un producto con barcode repetido", "un movimiento de stock en cero no tiene
  sentido", "para borrar un producto se marca `deleted_at`". Recibe el repositorio por
  **inyección de dependencias** (un patrón de fábrica: el módulo arma el servicio y le pasa el
  repositorio como argumento) y usa **mappers** para convertir entidades en respuestas.
- **`infrastructure/`** — la implementación concreta del repositorio, la que sí conoce Prisma
  y escribe SQL contra PostgreSQL. Es la única capa que sabe que existe una base de datos.
- **`presentation/`** — la puerta de entrada: los **DTO** de validación con Zod, los
  controladores HTTP y la definición de rutas de Fastify. Traduce un pedido HTTP a una llamada
  al servicio, y la respuesta del servicio a un pedido HTTP.

**Una capa** es entonces un nivel de responsabilidad, y la regla que las ordena es siempre la
misma: **las dependencias apuntan hacia adentro**. `presentation` conoce a `application`,
`application` conoce a `domain`, `infrastructure` conoce a `domain`. Nadie de adentro conoce a
nadie de afuera. El dominio, el centro, no sabe que existe HTTP.

Tres conceptos que aparecen en esa lista y conviene definir ya:

- **Repositorio** — una clase (o un objeto) que se encarga de leer y escribir un tipo de dato.
  En el dominio se declara como **interfaz**: "para trabajar con productos necesito
  `findAll`, `findById`, `create`, `update`, `softDelete`". En infraestructura se implementa
  con Prisma. El servicio pide la interfaz; no le importa quién la cumpla.
- **Inyección de dependencias** — en vez de que el servicio haga `new ProductRepository()`
  adentro, se lo recibe desde afuera. Suena a ceremonia y es la razón por la que el proyecto se
  puede probar: en un test le pasás un repositorio falso (un **fake**, un objeto con las mismas
  funciones pero datos en memoria) y verificás solo la regla de negocio, sin base de datos.
- **Mapper** — una función chica que convierte una entidad de la base en la forma de respuesta
  de la API (y a veces al revés). Es el lugar donde el `Decimal` del precio se vuelve `number`
  y donde un campo `deleted_at` no se filtra al cliente.

El beneficio se ve en el día a día, no en un diagrama: un test de servicio se escribe en treinta
líneas y corre en milisegundos porque nunca toca PostgreSQL; los repositorios reales se prueban
aparte, contra una base de verdad, en las pruebas de integración. Y cuando cambia una regla de
negocio, sabés exactamente en qué archivo mirar.

### Un módulo por funcionalidad

La otra decisión de estructura es **modular por dominio**, también llamada *feature-first*:
cada área de negocio vive en su carpeta `src/modules/<modulo>/` y se lleva sus cuatro capas
adentro. La alternativa clásica —una carpeta `controllers/`, otra `services/`, otra
`repositories/`, todas llenas de cosas de todos los módulos— funciona mientras hay tres
módulos y se vuelve un laberinto cuando hay doce.

```text
src/
├── config/                  # env, logger, prisma, graceful shutdown
├── core/                    # errores y utilidades transversales
├── http/                    # registro de routers con prefijo
└── modules/
    ├── auth/
    ├── roles/
    ├── users/
    ├── products/
    ├── services/
    └── inventory/
        ├── domain/
        ├── application/
        ├── infrastructure/
        └── presentation/
```

Con esta regla, las dos preguntas más frecuentes tienen respuesta corta. "¿Dónde va una regla
nueva de productos?" En `src/modules/products/application/`. "¿Dónde va un endpoint nuevo?" En
`src/modules/<modulo>/presentation/`, más una línea en el registro de rutas. Y si mañana el
proyecto se queda sin inventario, borrás `src/modules/inventory/` y no queda nada colgado en
otras carpetas.

### Decisiones de diseño clave

Estas diez decisiones explican casi todo el código que vas a leer en los próximos capítulos.
No son arbitrarias: cada una resuelve un problema concreto, y conviene entender el problema
antes de aceptar la solución.

1. **Roles como tabla**: los roles (`admin`, `staff`, …) viven en la tabla `role` y se
   administran con CRUD completo solo para administradores. El usuario lleva `role_id` (una
   **clave foránea**: una columna que apunta al `id` de otra tabla) y el rol se incluye en el
   JWT para autorizar. La alternativa sería un campo de texto `role: "admin"` en el usuario;
   funciona hasta que querés agregar un rol nuevo o renombrarlo, y ahí tenés que actualizar
   filas a mano. Con tabla, agregar un rol es insertar una fila.
2. **Auth con dos tokens**: un **access token** JWT (15 minutos, con `userId`, `email` y rol) y
   un **refresh token** JWT (7 días, solo `userId`) guardado en la tabla `session` para poder
   invalidarlo en el logout. Un **JWT** (*JSON Web Token*) es un texto firmado que el servidor
   entrega y después verifica: si alguien lo modifica, la firma deja de cerrar y el token se
   rechaza. El access token es corto a propósito: si te lo roban, sirve por quince minutos. El
   refresh token es largo pero se puede revocar, porque su existencia está anotada en la base.
   Ambos viajan en **cookies `httpOnly`** —una cookie que el JavaScript del navegador no puede
   leer, así un ataque de XSS no se lleva el token— con respaldo en `Authorization: Bearer` para
   los clientes que no usan cookies.
3. **Sin librería de sesiones ni Redis**: la sesión de refresco es una fila en PostgreSQL.
   Simple, auditable y suficiente para este alcance. Agregar Redis sería una dependencia más
   para un problema que una tabla ya resuelve: son pocas sesiones y se consultan poco.
4. **Soft delete**: `deleted_at` en `role`, `user`, `product` y `service`. **Soft delete** es
   borrar sin borrar: en vez de `DELETE`, se escribe la fecha en una columna y todas las
   consultas filtran `deleted_at IS NULL`. Nada se borra físicamente del catálogo, así que un
   producto viejo sigue existiendo para los movimientos de inventario que lo mencionan y para
   la auditoría. `inventory_movement` y `session` no tienen borrado: son historial puro.
5. **Errores tipados**: una jerarquía `AppError` con `BadRequestError` (400), `UnauthorizedError`
   (401), `ForbiddenError` (403), `NotFoundError` (404) y `ConflictError` (409); el
   `errorHandler` los convierte en JSON con `code` + `message`. Esto es tratar al error **como
   un valor**: cada fallo tiene un tipo, un código estable y un mensaje, en lugar de un
   `throw new Error("algo salió mal")` que el cliente no puede interpretar. El cliente programa
   contra el `code`, no contra el texto.
6. **Validación en el controlador con Zod**: el DTO se parsea apenas entra la request; un
   `ZodError` se transforma en 400 `BAD_REQUEST` con el detalle del primer `issue`. Validar en
   la puerta significa que el servicio puede confiar en sus tipos: si llegó hasta ahí, el precio
   es un número positivo.
7. **Errores de Prisma mapeados**: los códigos `P2002` (violación de unicidad) y `P2003`
   (violación de clave foránea) se convierten en `ConflictError` en el repositorio, y también en
   el servicio de productos, para doble protección. Sin ese mapeo, un email repetido saldría
   como un 500 con un mensaje de PostgreSQL adentro, que no le sirve a nadie.
8. **Decimal → number**: los campos `price`, `cost`, `base_price` y `unit_cost` son
   `numeric(10,2)` en Postgres; el mapeador los convierte con `Number(...)` para que el cliente
   nunca reciba strings. La base usa `Decimal` porque los números de punto flotante (`float`) no
   representan bien los centavos; la API usa `number` porque es lo que el cliente espera.
9. **Transacciones para inventario**: crear un movimiento y actualizar el stock ocurre en la
   misma **transacción** (`$transaction`): o pasa todo o no pasa nada. Si el servidor se cae
   entre el `INSERT` del movimiento y el `UPDATE` del stock, la base queda consistente igual.
   Sin transacción, un corte de luz te deja stock que no coincide con el historial.
10. **Sin multi-tenant ni tiendas**: el proyecto es de una sola tienda a propósito. Un
    **multi-tenant** es un sistema que atiende varias empresas con la misma instalación,
    separando los datos por una columna `store_id`. Agregarlo es un ejercicio aparte (está en
    los manuales de los sistemas completos) y habría ensuciado todos los ejemplos de este.

### Resumen

- Un backend es un programa sin pantalla que atiende pedidos HTTP, decide, guarda y contesta;
  este es la API REST de un POS y sus puertas son los endpoints (`método` + `ruta`).
- HTTP trae método, ruta, headers y body; la respuesta trae un código de estado, y cada código
  de este proyecto corresponde a un tipo de error concreto (400, 401, 403, 404, 409, 500).
- El código se separa en cuatro capas por módulo —`domain`, `application`, `infrastructure`,
  `presentation`— con las dependencias apuntando hacia adentro, para poder cambiar la base sin
  tocar las reglas y probar las reglas sin base.
- La estructura es modular por funcionalidad: cada módulo se lleva sus capas y se puede borrar
  entero sin dejar cabos sueltos.
- Las diez decisiones de diseño (roles como tabla, dos tokens en cookies `httpOnly`, soft
  delete, errores tipados, `Decimal` para dinero, transacciones) son las que vas a ver
  implementadas línea por línea en el resto del manual.

## 02. Stack tecnológico y setup del proyecto

Ya sabés qué querés construir. Ahora toca las herramientas con las que se construye, y esta
parte del manual se lee con una idea en la cabeza: **cada archivo de configuración es una
decisión que alguien tomó**. No son formularios que hay que llenar para que el proyecto
arranque; son las respuestas a problemas concretos. Si entendés qué resuelve cada uno, cuando
tengas que crear tu propio proyecto vas a saber qué copiar y qué cambiar.

Toda la configuración inicial vive en la raíz de `example-project/`: `package.json` define las
dependencias y los scripts, `tsconfig.json` configura TypeScript estricto con el alias `@/`
apuntando a `src/`, `tsup.config.ts` arma el build de producción, `.env.example` documenta las
variables de entorno y `.gitignore` mantiene fuera del repo lo que no debe versionarse.

**Cómo se creó el proyecto.** No hay magia ni *scaffolding* (esos generadores como
`create-fastify` que te escriben medio proyecto de una vez). Los archivos se escribieron a mano
en una carpeta vacía `example-project/` y después se corrieron los comandos de instalación. El
proyecto es chico, y entender cada archivo de configuración es parte del aprendizaje: un
scaffolding te lo esconde justo cuando más lo necesitás leer.

### Qué es Bun, y por qué reemplaza a tres herramientas

**Un runtime** es el programa que agarra tu código y lo ejecuta: lee el archivo, lo traduce a
instrucciones que la máquina entiende y lo corre. En JavaScript el runtime clásico es Node.js;
Bun es otro, más nuevo, escrito en Zig, y su gracia es que hace tres trabajos a la vez:

- **Runtime** — ejecuta JavaScript y **TypeScript** directamente, sin un paso previo de
  compilación. Escribís `bun src/server.ts` y corre; no hay `tsc` en el medio, no hay archivos
  `.js` generados. Eso te ahorra el clásico "compilé, arranqué, y el error era una coma".
- **Gestor de paquetes** — el equivalente a `npm` o `pnpm`: `bun install` lee las dependencias
  del `package.json`, las baja y las deja en `node_modules/`. Es notablemente más rápido y
  genera `bun.lock` en lugar de `package-lock.json`.
- **Runner de tests** — `bun test` descubre y corre los archivos `*.test.ts` sin instalar
  Vitest ni Jest.

Una aclaración que evita confusiones: el proyecto **también** usa `bunx`, que es el primo de
`npx`. `bunx prisma migrate dev` baja el CLI de Prisma si no está y lo ejecuta, sin instalar
nada de forma global.

### Qué agrega TypeScript sobre JavaScript

JavaScript es un lenguaje de tipado dinámico: una variable puede contener un número hoy y un
texto mañana, y el error recién aparece cuando el programa corre, en producción, con el cliente
mirando. **TypeScript** es JavaScript con **tipos**: anotás qué forma tiene cada dato (`string`,
`number`, un objeto con `id` y `price`) y hay un programa, el compilador (`tsc`), que lee todo
el proyecto y te avisa antes de ejecutar si algo no cierra.

Lo importante es que los tipos **se borran al ejecutar**: no existen en el archivo que corre.
Son una herramienta de desarrollo, no una capa de tiempo de ejecución. Y como se borran, Bun
puede ejecutar TypeScript sin compilar nada. Ganás dos cosas enormes: errores de tipeo y de
forma detectados en el editor (autocompletado incluido) y documentación viva —cuando leés
`ProductResponse`, sabés exactamente qué campos tiene la respuesta sin abrir un endpoint—.

### Por qué módulos ES (ESM)

**Un módulo** es un archivo que declara lo que exporta y pide lo que necesita. Hay dos sabores
en el mundo JavaScript: **CommonJS**, el viejo, con `require()` y `module.exports`, y **ESM**
(*ECMAScript Modules*), el estándar, con `import` y `export`. Este proyecto usa ESM en todos
lados, y ese `"type": "module"` del `package.json` es el que se lo dice a Node y a Bun: "los
`.js` de este paquete son módulos ES".

¿Por qué importa? Porque ESM es estático: los imports se resuelven antes de ejecutar, lo que
permite que el editor te autocomplete, que el bundler elimine lo que no usás y que las
importaciones circulares den un error claro en vez de un `undefined` sorpresivo. Bun, tsup y
el ecosistema moderno de Fastify asumen ESM; pelearse con CommonJS es ir contra la corriente.

### 02.1 `package.json` — scripts, dependencias y tipado

**Archivo:** `example-project/package.json`

```json
{
  "name": "example-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "bun --hot src/server.ts",
    "build": "prisma generate && tsup",
    "start": "bun src/server.ts",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "bunx prisma migrate dev",
    "prisma:studio": "bunx prisma studio",
    "seed": "bun src/scripts/seed.ts",
    "test": "bun test"
  },
  "dependencies": {
    "@fastify/compress": "^8.0.0",
    "@fastify/cookie": "^11.0.0",
    "@fastify/cors": "^10.0.0",
    "@fastify/helmet": "^12.0.0",
    "@fastify/rate-limit": "^10.0.0",
    "@prisma/client": "^6.0.0",
    "bcrypt": "^5.1.0",
    "dotenv": "^16.4.0",
    "fastify": "^5.0.0",
    "jsonwebtoken": "^9.0.0",
    "pino": "^9.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/node": "^22.0.0",
    "bun-types": "^1.4.2",
    "pino-pretty": "^11.0.0",
    "prisma": "^6.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.5.0"
  }
}
```

Empecemos por arriba. `name` es el nombre del paquete y `version` su versión; en una app no
sirven para publicar nada, pero ordenan. `"type": "module"` ya lo explicamos: ESM en todo el
paquete.

**Los scripts.** Un script es un comando con nombre que corrés con `bun run <nombre>` (o
`bun <nombre>` para los más comunes). Son la puerta de entrada a cada tarea:

- **`dev`** — `bun --hot src/server.ts` levanta el servidor y lo recarga cuando editás un
  archivo. `--hot` recarga **en el mismo proceso**, así que no perdés el estado en cada cambio;
  `--watch`, en cambio, reinicia el proceso entero. Para un servidor con conexiones abiertas,
  `--hot` es lo cómodo.
- **`build`** — `prisma generate && tsup`. Los dos comandos, en ese orden y unidos por `&&`
  (que significa "si el primero sale bien, corré el segundo"). Primero se genera el cliente de
  Prisma, porque el código lo importa y todavía no existe; después tsup empaqueta.
- **`start`** — `bun src/server.ts`. Corre el archivo fuente directo: como Bun ejecuta
  TypeScript, no necesita el `dist/` para arrancar. El build queda para cuando querés
  distribuir un único archivo empaquetado.
- **`prisma:generate`** — regenera el cliente tipado de Prisma sin tocar la base. Se corre
  después de cambiar el `schema.prisma`.
- **`prisma:migrate`** — `bunx prisma migrate dev` es el comando de desarrollo que compara tu
  esquema con la base y crea una migración. Lo vas a ver en detalle en el capítulo 03.
- **`prisma:studio`** — abre una interfaz web para mirar y editar las tablas. Es la forma más
  rápida de comprobar que un `POST` guardó lo que creías.
- **`seed`** — `bun src/scripts/seed.ts` carga los datos iniciales: roles, un usuario admin y
  un par de productos. Un **seed** es eso: el script que deja la base usable después de crearla
  vacía.
- **`test`** — `bun test` corre todos los `*.test.ts` del proyecto.

**Las dependencias de runtime** son las que el programa necesita para funcionar en producción,
y las `devDependencies` las que solo hacen falta para desarrollar. La diferencia no es
decorativa: en un despliegue prolijo las dev no se instalan.

- **`fastify`** — el framework HTTP. Un framework es la pieza que recibe el pedido del sistema
  operativo, encuentra qué función lo atiende, la ejecuta y arma la respuesta. Fastify además
  trae validación de esquemas, hooks, serialización rápida y un sistema de plugins que vas a
  usar para helmet, cors, cookies y rate limit.
- **`@fastify/helmet`** — agrega cabeceras de seguridad a cada respuesta
  (`X-Content-Type-Options`, `X-Frame-Options`, política de contenido). Importa desde el día
  uno: son gratis y evitan clases enteras de ataques de navegador.
- **`@fastify/cors`** — **CORS** (*Cross-Origin Resource Sharing*) es el mecanismo por el que
  un navegador deja que una página de `http://localhost:5173` llame a una API en
  `http://localhost:3000`. Sin estas cabeceras el navegador bloquea la respuesta, y el error
  aparece en la consola del frontend, no en el servidor. Importa en cuanto tenés un frontend en
  otro origen; con clientes que no son navegadores (curl, Postman, una app móvil) no aplica.
- **`@fastify/compress`** — comprime las respuestas con gzip o brotli. Importa cuando la
  respuesta es grande (una lista de mil productos) y el cliente está lejos; con payloads de
  cuatro campos no cambia nada, pero es una línea.
- **`@fastify/cookie`** — parsea las cookies que llegan y permite escribir cookies en la
  respuesta, con opciones como `httpOnly`, `secure` y `sameSite`. Es la pieza que hace posible
  la auth por cookies de este proyecto.
- **`@fastify/rate-limit`** — limita cuántos pedidos acepta un cliente por ventana de tiempo
  (acá, 100 por minuto). Importa sobre todo en `/auth/login`: sin límite, alguien puede probar
  contraseñas a mil por segundo.
- **`@prisma/client`** — el **ORM**. Un ORM (*Object-Relational Mapper*) es la capa que traduce
  entre objetos de tu lenguaje y filas de la base: en vez de escribir SQL a mano, escribís
  `prisma.product.findMany()` y el ORM genera la consulta. Prisma además **genera tipos**: la
  función que devuelve productos está tipada con las columnas reales de la tabla.
- **`bcrypt`** — para guardar contraseñas. Un **hash** es el resultado de pasar un texto por una
  función de un solo sentido: de la contraseña se obtiene un hash, pero del hash no se vuelve a
  la contraseña. Un **salt** es un valor aleatorio que se agrega antes de hashear para que dos
  personas con la misma contraseña tengan hashes distintos. `bcrypt` hace las dos cosas y está
  diseñado para ser lento a propósito, que es justo lo que querés: probar un millón de
  contraseñas por segundo deja de ser viable.
- **`jsonwebtoken`** — firma y verifica **JWT**. Firmar es calcular un sello con un secreto; si
  alguien cambia un dato del token, la verificación falla.
- **`zod`** — validación de datos con tipos. Definís un esquema (`z.object({...})`) y Zod
  valida en tiempo de ejecución y deduce el tipo de TypeScript al mismo tiempo. Es la misma
  librería que valida las variables de entorno y los DTO de cada endpoint.
- **`pino`** — el logger: el que escribe las líneas de "pasó esto" con nivel, tiempo y datos
  estructurados. Es el logger nativo de Fastify.
- **`dotenv`** — carga el archivo `.env` en `process.env`, para no hardcodear secretos en el
  código.

**Las dependencias de desarrollo.** `typescript` es el compilador que hace el chequeo de tipos;
`tsup` es el bundler que empaqueta para producción; `pino-pretty` formatea los logs en la consola
para que se lean (en producción no se usa); `prisma` es el CLI de migraciones y generación; y
los `@types/*` son definiciones de tipos para librerías que se escribieron antes de TypeScript
o que no las incluyen —`@types/node` para las APIs de Node, `@types/bcrypt` y
`@types/jsonwebtoken` para sus librerías—. `bun-types` es el equivalente para Bun: trae los
tipos de sus globales y de `bun:test`.

Sobre los `^` de las versiones: `^8.0.0` significa "aceptá 8.x, pero no 9". Permite parches y
mejoras sin salto de versión mayor, que es donde suelen romperse las APIs.

> La instalación se hizo con `bun install`, que genera `bun.lock` en lugar de
> `package-lock.json`. Ese archivo hay que versionarlo: es el que garantiza que todos instalen
> las mismas versiones.

### 02.2 `tsconfig.json` — TypeScript estricto + alias @/

**Archivo:** `example-project/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "types": ["bun-types"],
    "moduleDetection": "force",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts"]
}
```

Es corto, pero cada opción cambia cómo se comporta el proyecto. Vamos una por una:

- **`target: "ES2022"`** — a qué versión de JavaScript se apunta. Define qué sintaxis podés
  usar (por ejemplo, `??=` y clases con campos privados) y qué transformaciones hace falta
  aplicar al compilar. Bun y Node modernos soportan ES2022 sin drama.
- **`module: "ESNext"`** — qué sistema de módulos se emite: ESM, el mismo que declara el
  `"type": "module"`. Si esto dijera `CommonJS`, los `import` se convertirían en `require` y el
  proyecto dejaría de coincidir con lo que Bun espera.
- **`moduleResolution: "bundler"`** — cómo se resuelven las rutas de los imports. `bundler` es
  el modo moderno, pensado para código que pasa por un bundler: permite importar sin extensión
  (`@/config/env` en vez de `@/config/env.js`) y respeta el campo `exports` de los paquetes.
- **`lib: ["ES2022"]`** — qué APIs globales conoce el chequeo de tipos. Es solo ES2022, sin
  `DOM`: en un backend no existen `window` ni `document`, así que si por error los usás, el
  compilador te lo marca en vez de dejarte llegar a un `ReferenceError` en producción.
- **`types: ["bun-types"]`** — trae los tipos globales de Bun (`Bun.serve`, `bun:test`,
  `process`, etc.). Sin esto, el editor marca `bun test` y las APIs de Bun como desconocidas.
- **`moduleDetection: "force"`** — obliga a que **todos** los archivos se traten como módulos,
  aunque no tengan un solo `import`. Así dos archivos nunca comparten el ámbito global por
  accidente, que es una fuente clásica de variables pisadas.
- **`strict: true`** — activa la familia completa de chequeos estrictos. Los dos que más vas a
  sentir: `noImplicitAny` (no podés dejar un parámetro sin tipo, el compilador no adivina) y
  `strictNullChecks` (`string` y `string | null` dejan de ser lo mismo, y te obliga a preguntar
  si un valor existe antes de usarlo). Es exigente a propósito: los errores aparecen mientras
  escribís, no cuando el cliente ya está usando el sistema.
- **`esModuleInterop: true`** — permite `import pino from "pino"` en librerías viejas escritas
  en CommonJS, sin `import * as pino`. Es compatibilidad, no estilo.
- **`skipLibCheck: true`** — no chequea los archivos `.d.ts` de `node_modules`. Ahorra segundos
  en cada chequeo; los tipos de las librerías ya se probaron en su propio repo.
- **`resolveJsonModule: true`** — permite importar `.json` con tipos.
- **`noEmit: true`** — el compilador **solo chequea tipos**, no genera JavaScript. Es la clave
  de la arquitectura: quien ejecuta el código es Bun en desarrollo y tsup en el build. Dos
  herramientas generando archivos sería un lío.
- **`baseUrl: "."`** y **`paths: { "@/*": ["./src/*"] }`** — el alias. `@/` es la raíz de
  `src/`, así que desde cualquier archivo, sin importar cuán profundo esté, escribís
  `import { env } from "@/config/env"` en lugar de `"../../../config/env"`. Ese camino relativo
  es el que se rompe cada vez que movés una carpeta.
- **`include: ["src/**/*.ts"]`** — qué archivos entran al chequeo: todo lo que esté bajo `src/`
  y termine en `.ts`.

> El alias `@/` funciona en tres lugares distintos, y los tres tienen que estar de acuerdo: el
> chequeo de tipos lo lee de este `tsconfig.json`, el build lo lee del `alias` de
> `tsup.config.ts`, y Bun lo lee del `tsconfig.json` automáticamente. Si cambiás el alias en un
> solo lado, el código compila y falla al ejecutar.

### 02.3 `tsup.config.ts` — el bundler de producción

**Archivo:** `example-project/tsup.config.ts`

```typescript
import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  target: "es2022",
  sourcemap: true,
  clean: true,
  alias: {
    "@": "./src",
  },
})
```

Un **bundler** es la herramienta que agarra muchos archivos y los convierte en pocos: sigue los
imports desde un punto de entrada, junta todo lo que se usa y escribe el resultado en `dist/`.
tsup es el bundler de este proyecto y se configura con un objeto.

- **`defineConfig(...)`** — una función que no hace nada en tiempo de ejecución: existe para
  que el editor te autocomplete y te marque los errores de tipeo en las opciones. Es la misma
  idea que el resto del proyecto: el error temprano.
- **`entry: ["src/server.ts"]`** — el punto de arranque. Todo lo que `server.ts` importe (y lo
  que esos imports importen) termina adentro del bundle.
- **`format: ["esm"]`** — el formato de salida. Uno solo, ESM, que es lo que corre Bun.
- **`target: "es2022"`** — el nivel de sintaxis del archivo generado, igual que en el
  `tsconfig`.
- **`sourcemap: true`** — genera un mapa que relaciona el código empaquetado con el original.
  Sin eso, un error en producción te señala `dist/server.js:1:18923` y no tenés idea de qué
  línea escribiste.
- **`clean: true`** — borra `dist/` antes de cada build. Evita quedarte con archivos viejos de
  una versión anterior que ya no se generan.
- **`alias: { "@": "./src" }`** — replica el alias del `tsconfig`, ahora para el bundler. Es el
  segundo de los tres lugares que mencionamos arriba.

> El build solo funciona después de `prisma generate`, porque el `PrismaClient` que el código
> importa no es un paquete cualquiera: se **genera** a partir de tu esquema. De ahí el orden
> `prisma generate && tsup` en el script `build`.

### 02.4 `.env.example` — las variables de entorno, documentadas

Una **variable de entorno** es un valor que el sistema operativo le pasa al proceso cuando
arranca. Sirve para lo que no puede vivir en el código: contraseñas, secretos de firma, la URL
de la base, el puerto. El código es el mismo en tu máquina y en el servidor; lo que cambia es el
entorno.

El proyecto tiene un archivo `.env` de verdad —con los valores reales, que no se versiona— y un
`.env.example` que sí se versiona y sirve de plantilla y de documentación.

**Archivo:** `example-project/.env.example`

```bash
# Entorno
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Base de datos
DATABASE_URL=postgresql://usuario:password@localhost:5432/example_project?schema=public

# Auth JWT
JWT_SECRET=cambiar_por_un_secreto_de_32+_caracteres
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=cambiar_por_otro_secreto_de_32+_caracteres
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=*
```

Los comentarios con `#` son parte del archivo y agrupan por tema. Variable por variable:

- **`NODE_ENV`** — el entorno en el que corre el proceso. Tiene exactamente tres valores
  posibles (`development`, `test`, `production`) y de él dependen el nivel de logs, si los logs
  se ven lindos y qué datos de Prisma se loggean. Por eso el `env.ts` lo valida como `enum`: un
  `NODE_ENV=prod` mal escrito cambiaría el comportamiento de forma silenciosa.
- **`PORT`** — el puerto donde escucha el servidor. Un puerto es la "puerta" numerada de una
  máquina: la IP dice a qué computadora llegar y el puerto dice a qué programa.
- **`HOST`** — la interfaz de red donde se ata el servidor. `0.0.0.0` significa "todas las
  interfaces": acepta conexiones desde otras máquinas, que es lo que necesitás dentro de un
  contenedor o en un servidor. `127.0.0.1` aceptaría solo desde la misma máquina. Es una
  diferencia que hace que "funciona en mi máquina pero no en el contenedor".
- **`DATABASE_URL`** — la cadena de conexión a PostgreSQL, con una forma fija:
  `postgresql://usuario:password@host:puerto/base?schema=public`. Acá la base se llama
  `example_project` y el `?schema=public` indica el esquema de Postgres donde viven las tablas.
- **`JWT_SECRET`** — el secreto con el que se firman los access tokens. Cuanto más largo, más
  difícil de adivinar por fuerza bruta; el `env.ts` exige 32 caracteres como mínimo y el
  proceso no arranca si no los tiene.
- **`JWT_EXPIRES_IN`** — cuánto vive un access token: `15m` (quince minutos). Es la ventana en
  la que un token robado sigue sirviendo.
- **`JWT_REFRESH_SECRET`** — el secreto del refresh token. Tiene que ser **distinto** del
  anterior: si fueran iguales, un access token podría presentarse como refresh token y el
  sistema de dos tokens perdería todo el sentido.
- **`JWT_REFRESH_EXPIRES_IN`** — la vida del refresh token: `7d` (siete días).
- **`CORS_ORIGIN`** — qué origen puede llamar a la API desde un navegador. `*` significa
  "cualquiera", cómodo en desarrollo y peligroso en producción, donde va el origen exacto del
  frontend.

> El `.env` real se arma copiando este archivo y completando los valores, en particular la
> credencial de PostgreSQL. Nunca se sube a git: es el archivo donde viven los secretos, y el
> `.gitignore` de la sección siguiente está para asegurarlo.

### 02.5 `.gitignore` — qué queda fuera del repo

**Archivo:** `example-project/.gitignore`

```bash
node_modules/
dist/
.env
*.log
```

Cuatro líneas y una regla cada una:

- **`node_modules/`** — las dependencias instaladas. No se versionan porque no son tuyas: se
  reconstruyen con `bun install` a partir del `package.json` y del `bun.lock`. Versionarlas
  sería subir cientos de miles de archivos que cambian con cada actualización.
- **`dist/`** — la salida del build. Es un derivado del código fuente; se regenera con
  `bun run build`.
- **`.env`** — los secretos. Esta es la línea más importante del archivo.
- **`*.log`** — los archivos de log que puedan quedar dando vueltas.

Con esto el proyecto ya se puede instalar: `bun install` y listo. El siguiente paso es el modelo
de datos, porque sin saber qué guarda la base no se entiende qué hace cada endpoint.

### Resumen

- Bun es runtime, gestor de paquetes y runner de tests en una sola herramienta; ejecuta
  TypeScript sin compilar y genera `bun.lock`.
- TypeScript agrega tipos que se borran al ejecutar: te avisan en el editor y no cuestan nada en
  producción. El proyecto usa ESM (`import`/`export`) y lo declara con `"type": "module"`.
- `package.json` se lee en tres partes: los scripts (`dev`, `build`, `start`, `prisma:*`,
  `seed`, `test`), las dependencias de runtime (Fastify y sus plugins, Prisma, Zod, JWT,
  bcrypt, pino) y las de desarrollo (TypeScript, tsup, el CLI de Prisma y los tipos).
- `tsconfig.json` apunta a ES2022, activa `strict` completo, no emite archivos y define el
  alias `@/` que también replican tsup y Bun; `.env.example` documenta cada variable y
  `.gitignore` deja afuera dependencias, build, logs y secretos.
- El orden importa en dos lugares: `prisma generate` va antes de `tsup`, y el alias `@/` tiene
  que estar igual en el `tsconfig` y en `tsup.config.ts`.

## 03. Base de datos

Hasta acá tenés una API que sabe recibir pedidos, pero todavía no tiene dónde acordarse de
nada. Eso es la base de datos, y en este proyecto es **PostgreSQL**, una base **relacional**.

**Una base de datos relacional** guarda la información en **tablas**, y una tabla es una grilla:
cada **columna** define un dato con su tipo (un nombre es texto, un precio es un número con
decimales, una fecha es una fecha) y cada **fila** es un registro completo. La palabra
"relacional" viene de que las tablas se relacionan entre sí por valores: un usuario no guarda
adentro el nombre de su rol, guarda el `id` de ese rol. Esa referencia es lo que evita tener el
mismo dato copiado en cien lugares, y lo que hace que renombrar un rol sea una sola escritura.

Seis piezas del vocabulario que vas a necesitar para leer el esquema:

- **Clave primaria** (*primary key*) — la columna que identifica de forma única cada fila. No se
  repite y no puede ser nula. Acá siempre es `id`.
- **Clave foránea** (*foreign key*, FK) — una columna que apunta a la clave primaria de otra
  tabla. `user.role_id` es una FK a `role.id`: dice "este usuario tiene este rol" y la base se
  encarga de que ese rol exista.
- **Restricción de unicidad** (*unique constraint*) — la regla de que un valor no se puede
  repetir en una columna. `user.email` es único: no puede haber dos usuarios con el mismo mail.
  Es la restricción que después produce el error `P2002` y el `409 Conflict` de la API.
- **Índice** — una estructura auxiliar que la base mantiene para encontrar filas rápido sin
  recorrer la tabla entera, como el índice de un libro. Un índice único es un índice que además
  prohíbe repetidos.
- **Migración** — un archivo con los cambios de estructura, versionado junto al código. Es la
  diferencia entre "en mi máquina la tabla tiene una columna nueva" y "en todas las máquinas,
  incluida producción, la tabla tiene esa columna".
- **Soft delete** — ya lo viste: en vez de borrar la fila, se marca con una fecha en
  `deleted_at` y las consultas filtran las marcadas.

**Prisma** es el ORM del proyecto y tiene una particularidad que ordena todo el capítulo: vos
declarás el modelo en un archivo propio, el **Prisma Schema Language** (PSL), y Prisma genera
dos cosas a partir de él: el SQL de la migración y un cliente de TypeScript tipado. Es decir,
el esquema es la **fuente de verdad**; el SQL es un derivado que no se edita a mano.

Las seis tablas de este sistema:

- **`role`** — los roles del sistema (`admin`, `staff`, …). `name` único, descripción
  opcional, soft delete.
- **`user`** — los empleados del POS. `email` único, `password_hash` (nunca la contraseña en
  texto), `role_id` FK a `role`, `is_active` para deshabilitar sin borrar, soft delete.
- **`session`** — las sesiones de refresh token, para poder revocarlas. FK a `user` con
  `ON DELETE CASCADE`: si un usuario se borra físicamente, sus sesiones se van con él.
- **`product`** — productos con código de barras opcional (y único), precio y costo `Decimal`,
  stock actual y umbral de stock bajo.
- **`service`** — servicios (un envío, una instalación) con precio base.
- **`inventory_movement`** — el historial de movimientos de stock (entrada, salida, ajuste) con
  quién lo hizo y una nota opcional. Nunca se borra.

> Práctica de nombres: tablas y columnas en minúscula y `snake_case`, que es lo que PostgreSQL
> devuelve en las consultas y lo que evita tener que citar identificadores. El código TypeScript
> usa `camelCase` donde le conviene; los datos que llegan de Prisma vienen en `snake_case` tal
> cual están en la base, y por eso vas a ver `password_hash` y `deleted_at` en el código.

### 03.1 `prisma/schema.prisma` — el modelo declarativo

**Archivo:** `example-project/prisma/schema.prisma`

```json
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model role {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @unique
  description String?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?
  users       user[]
}

model user {
  id                  String               @id @default(uuid()) @db.Uuid
  name                String
  email               String               @unique
  password_hash       String
  role_id             String               @db.Uuid
  role                role                 @relation(fields: [role_id], references: [id])
  is_active           Boolean              @default(true)
  created_at          DateTime             @default(now())
  updated_at          DateTime             @updatedAt
  deleted_at          DateTime?
  sessions            session[]
  inventory_movements inventory_movement[]
}

model session {
  id            String   @id @default(uuid()) @db.Uuid
  user_id       String   @db.Uuid
  user          user     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  refresh_token String   @unique
  expires_at    DateTime
  created_at    DateTime @default(now())
}

model product {
  id                  String               @id @default(uuid()) @db.Uuid
  barcode             String?              @unique
  name                String
  price               Decimal              @db.Decimal(10, 2)
  cost                Decimal?             @db.Decimal(10, 2)
  stock               Int                  @default(0)
  low_stock_threshold Int                  @default(5)
  active              Boolean              @default(true)
  created_at          DateTime             @default(now())
  updated_at          DateTime             @updatedAt
  deleted_at          DateTime?
  inventory_movements inventory_movement[]
}

model service {
  id          String   @id @default(uuid()) @db.Uuid
  name        String
  description String?
  base_price  Decimal  @db.Decimal(10, 2)
  is_active   Boolean  @default(true)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?
}

model inventory_movement {
  id         String   @id @default(uuid()) @db.Uuid
  product_id String   @db.Uuid
  product    product  @relation(fields: [product_id], references: [id])
  user_id    String   @db.Uuid
  user       user     @relation(fields: [user_id], references: [id])
  type       String
  quantity   Int
  unit_cost  Decimal? @db.Decimal(10, 2)
  note       String?
  created_at DateTime @default(now())
}
```

Las dos primeras secciones no son modelos, son configuración:

- **`generator client`** con `provider = "prisma-client-js"` — le dice a Prisma que genere el
  cliente para JavaScript/TypeScript. Ese cliente es lo que después importás como
  `@prisma/client`, y es el archivo que `prisma generate` escribe en `node_modules/`.
- **`datasource db`** con `provider = "postgresql"` y `url = env("DATABASE_URL")` — la conexión.
  `env("DATABASE_URL")` lee la variable de entorno en vez de hardcodear la credencial: el mismo
  esquema sirve para tu máquina y para el servidor, y el secreto nunca está en el archivo
  versionado.

Ahora los modelos, que es donde está lo interesante. Cada `model` se convierte en una tabla y
cada campo en una columna.

**`role`.** El `id` es `String` con `@id` (clave primaria), `@default(uuid())` (si no se lo das,
Prisma genera uno) y `@db.Uuid` (el tipo nativo de PostgreSQL). Un **UUID** es un identificador
de 128 bits, prácticamente imposible de repetir, que se ve como
`9f3c1b7a-4d2e-4a3b-9c1d-2f4e6a8b0c11`. Se usa en lugar de un autoincremental (1, 2, 3…) por
dos razones: no revela cuántas filas tenés —con IDs 1, 2, 3 un atacante sabe que existe el
usuario 4— y permite generar el ID sin preguntarle a la base, lo que hace posible crear datos en
paralelo o sincronizar con otro sistema más adelante. `name` es `String` con `@unique`: la base
rechaza dos roles con el mismo nombre. `description` es `String?` — el signo de pregunta marca
el campo como **opcional**, o sea que la columna acepta `NULL`. Los tres campos de fecha son
**timestamps**: `created_at` con `@default(now())` (se llena solo al insertar), `updated_at` con
`@updatedAt` (Prisma lo actualiza en cada modificación, no hace falta que lo toques) y
`deleted_at`, que es la marca del soft delete. `users user[]` no es una columna: es el otro lado
de la relación, la lista de usuarios que tienen ese rol.

**`user`.** Acá aparece la relación completa. `role_id String @db.Uuid` es la columna real que
guarda el ID del rol, y `role role @relation(fields: [role_id], references: [id])` es la
declaración de la FK: `fields` es la columna de esta tabla, `references` la de la otra. Gracias
a eso podés escribir `user.role.name` y Prisma arma el `JOIN` por vos. `password_hash` es el
hash de bcrypt, nunca la contraseña: si mañana te roban un backup de la base, no hay contraseñas
ahí adentro. `is_active` es un booleano con `@default(true)` para deshabilitar a alguien sin
borrarlo (y sin perder su historial). Las listas `sessions` e `inventory_movements` —de tipo
`session[]` e `inventory_movement[]`— son las dos relaciones que apuntan a este usuario.

**`session`.** Cada fila es un refresh token vivo. `refresh_token String @unique` guarda el
token (único, para poder buscarlo directo) y `expires_at DateTime` la fecha en la que deja de
servir. `user user @relation(fields: [user_id], references: [id], onDelete: Cascade)` agrega algo
nuevo: `onDelete: Cascade`, o sea que si se borra físicamente el usuario, la base borra también
sus sesiones. Tiene sentido: una sesión de un usuario que ya no existe no es información
valiosa, es basura.

**`product`.** `barcode String? @unique` es opcional pero único cuando existe —en PostgreSQL,
`NULL` no choca con `NULL`, así que podés tener mil productos sin código de barras y ninguno
repetido—. `price Decimal @db.Decimal(10, 2)` y `cost Decimal? @db.Decimal(10, 2)` son dinero:
`Decimal` significa "número exacto con decimales" y en PostgreSQL es `numeric(10,2)`, diez
dígitos en total y dos después de la coma, o sea hasta 99 999 999.99. **Nunca se usa `float`
para dinero**: el punto flotante no puede representar `0.10` exactamente y sumar cien veces
`0.10` te da `9.99999999999998` en lugar de `10`. `stock Int @default(0)` es la cantidad
disponible y `low_stock_threshold Int @default(5)` el umbral a partir del cual el producto se
considera con stock bajo: tenerlo como columna permite que cada producto tenga su propio
criterio en vez de un número fijo en el código.

**`service`.** Primo de `product` para lo que no es inventario:
`base_price Decimal @db.Decimal(10, 2)` y `is_active Boolean @default(true)`. No tiene stock
porque un servicio no se almacena.

**`inventory_movement`.** El historial. `product_id` y `user_id` son FK, con `ON DELETE`
`RESTRICT` (que es el comportamiento por defecto): no se puede borrar un producto del que hay
movimientos. `type String` guarda el tipo de movimiento como texto y `quantity Int` la
cantidad, que puede ser negativa en una salida. `unit_cost Decimal?` es cuánto costó la unidad
en ese movimiento —opcional, porque un ajuste de inventario no siempre tiene costo— y `note`
es la aclaración libre del movimiento, opcional también. Fijate que este modelo **no** tiene
`updated_at` ni `deleted_at`: un movimiento es un hecho que ocurrió, no un registro que se
edita.

Sobre el `type`: existen enums (`enum` es un tipo con un conjunto cerrado de valores válidos:
`entrada`, `salida`, `ajuste`) y Prisma sabe declararlos. Este esquema eligió guardar el tipo
como `String` y llevar el conjunto cerrado del lado de TypeScript: el dominio define el tipo
`MovementType` y el DTO lo valida con `z.enum(["entrada", "salida", "ajuste"])`. La validación
queda en la puerta de entrada y cambiar un valor no requiere una migración.

### 03.2 `prisma/migrations/20260910013256_init/migration.sql` — la migración inicial

**Archivo:** `example-project/prisma/migrations/20260910013256_init/migration.sql`

```sql
-- CreateTable
CREATE TABLE "role" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" UUID NOT NULL,
    "barcode" TEXT,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "cost" DECIMAL(10,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 5,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "base_price" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movement" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_cost" DECIMAL(10,2),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "role_name_key" ON "role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_refresh_token_key" ON "session"("refresh_token");

-- CreateIndex
CREATE UNIQUE INDEX "product_barcode_key" ON "product"("barcode");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

Este SQL lo generó `prisma migrate dev --name init` a partir del esquema, y es la traducción
literal del PSL a instrucciones de PostgreSQL. Se lee de arriba abajo, en tres bloques: crear
tablas, crear índices, agregar claves foráneas.

**Los `CREATE TABLE`.** Cada uno empieza con la tabla y sus columnas, y termina con la clave
primaria:

- **`"id" UUID NOT NULL`** — el `@db.Uuid` del esquema se convirtió en el tipo `UUID`, y el
  `NOT NULL` viene de que el campo es obligatorio. Ojo: el `DEFAULT` del UUID no aparece en el
  SQL porque lo genera Prisma del lado del cliente, no la base.
- **`"description" TEXT`** — sin `NOT NULL`. La ausencia de `NOT NULL` es lo que `String?`
  significa: la columna acepta `NULL`.
- **`"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`** — `TIMESTAMP(3)` es una
  fecha con tres decimales de segundo (milisegundos), y `CURRENT_TIMESTAMP` es la función de
  PostgreSQL que devuelve el momento del `INSERT`. Ese `DEFAULT` es el `@default(now())`.
- **`"updated_at" TIMESTAMP(3) NOT NULL`** — sin `DEFAULT`, porque el valor lo pone Prisma en
  cada escritura (eso es lo que hace `@updatedAt`). Tiene que venir siempre, por eso `NOT NULL`.
- **`"price" DECIMAL(10,2) NOT NULL`** — el `@db.Decimal(10, 2)` textual.
- **`"stock" INTEGER NOT NULL DEFAULT 0`** y **`"low_stock_threshold" INTEGER NOT NULL DEFAULT 5`**
  — los `@default(0)` y `@default(5)`.
- **`CONSTRAINT "role_pkey" PRIMARY KEY ("id")`** — el nombre `role_pkey` lo inventa Prisma con
  la convención `<tabla>_pkey`; es la restricción que declara a `id` como clave primaria. Una
  tabla no puede existir sin clave primaria en este esquema.

Los nombres van entre comillas dobles (`"role"`) porque son identificadores: así PostgreSQL
respeta el nombre tal cual y no lo pasa a minúsculas ni se confunde con palabras reservadas.

**Los `CREATE UNIQUE INDEX`.** Son cuatro, uno por cada `@unique` del esquema:

- **`role_name_key`** sobre `role(name)`.
- **`user_email_key`** sobre `user(email)`.
- **`session_refresh_token_key`** sobre `session(refresh_token)`.
- **`product_barcode_key`** sobre `product(barcode)`.

El sufijo `_key` también es convención de Prisma. Cada uno hace dos trabajos a la vez: garantiza
que no haya repetidos y crea el índice que hace que buscar por esa columna sea instantáneo. Estos
cuatro índices son la fuente de los errores `P2002` que el código convierte en `ConflictError`:
cuando intentás crear un usuario con un email que ya existe, el que rechaza la operación es
`user_email_key`, no una validación de TypeScript.

**Los `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY`.** Cada FK se agrega después de crear
todas las tablas, para no depender del orden de creación:

- **`user_role_id_fkey`**: `user(role_id)` → `role(id)`, `ON DELETE RESTRICT ON UPDATE CASCADE`.
  `RESTRICT` significa "si alguien intenta borrar un rol que tiene usuarios, rechazá la
  operación". `ON UPDATE CASCADE` significa "si cambia el `id` del rol, actualizá la referencia
  en los usuarios". Como los IDs son UUIDs y nunca cambian, ese `CASCADE` casi no se usa, pero
  está.
- **`session_user_id_fkey`**: `session(user_id)` → `user(id)`, `ON DELETE CASCADE`. Acá sí:
  borrar el usuario borra sus sesiones.
- **`inventory_movement_product_id_fkey`** e **`inventory_movement_user_id_fkey`**: ambas con
  `RESTRICT`. Un movimiento es historia, y la historia no se puede dejar apuntando al vacío.

**Qué hace `prisma migrate dev`, en orden.** Primero lee el `schema.prisma`. Después compara ese
esquema con la lista de migraciones ya aplicadas, que Prisma guarda en una tabla interna de la
base (`_prisma_migrations`). Si encuentra diferencias, genera una carpeta nueva con el timestamp
del momento y adentro el `migration.sql`. Aplica ese SQL a la base de desarrollo. Y por último
regenera el cliente tipado, para que `@prisma/client` conozca las columnas nuevas. En producción
el comando es `prisma migrate deploy`, que no genera nada: solo aplica las migraciones pendientes.

> Para regenerar la base desde cero en desarrollo se borra la base y se vuelve a correr
> `prisma migrate dev`, que reaplica todas las migraciones en orden. La carpeta
> `prisma/migrations` es un artefacto que Prisma administra: no se edita a mano, porque incluye
> un snapshot del esquema en cada paso y si lo tocás el próximo `migrate` va a detectar
> diferencias que no existen.

¿Por qué el esquema es la fuente de verdad y no el SQL? Porque hay un solo lugar donde se
declara la intención —el `.prisma`— y dos consumidores que se derivan de él: la base (vía
migraciones) y el código (vía el cliente generado). Si editaras el SQL a mano, el cliente ya no
coincidiría con la base y el compilador te mentiría. Además, `prisma migrate` puede comparar el
esquema con la base real y avisarte si alguien cambió algo por afuera, que es lo que se llama
*drift*.

### Resumen

- Una base relacional guarda filas en tablas con columnas tipadas, y las tablas se relacionan
  por claves: primaria (`id`) y foránea (`role_id`). Un índice acelera búsquedas y un índice
  único además prohíbe repetidos.
- `prisma/schema.prisma` es la fuente de verdad: declara tablas, tipos, defaults, unicidad y
  relaciones, y de ahí se derivan el SQL de la migración y el cliente de TypeScript.
- UUIDs en lugar de autoincrementales (no se enumeran y se pueden generar sin la base),
  `Decimal(10,2)` para dinero (nunca `float`), `created_at`/`updated_at` automáticos y
  `deleted_at` para el soft delete en `role`, `user`, `product` y `service`.
- `ON DELETE CASCADE` solo en `session`; en el resto `RESTRICT`, porque el historial de
  inventario y los roles en uso no se pueden borrar.
- `prisma migrate dev` compara el esquema con las migraciones aplicadas, escribe el
  `migration.sql`, lo ejecuta y regenera el cliente; la carpeta de migraciones no se edita a
  mano.

## 04. Configuración global

En `src/config/` vive todo lo que es transversal a la aplicación: las variables de entorno
validadas, el logger, el cliente de Prisma y el apagado ordenado. Ninguno de estos archivos
conoce el negocio —no saben qué es un producto ni cuánto sale— y eso es a propósito: son
infraestructura pura, la base sobre la que después se apoyan los módulos.

Antes de leerlos hay un detalle de orden que explica varias cosas:

> `env.ts` corre primero, porque carga y valida las variables. Después `logger.ts` y `prisma.ts`
> lo importan para leer `NODE_ENV` y decidir cómo comportarse. Es una cadena: si `env.ts` falla,
> el proceso muere antes de que exista un logger para contarlo, y por eso ese archivo usa
> `console.error` y no `logger.error`.

### 04.1 `src/config/env.ts` — variables de entorno validadas con Zod

**Archivo:** `example-project/src/config/env.ts`

```typescript
import { config } from "dotenv"
import { z } from "zod"

config()

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("*"),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
```

Una variable de entorno llega al programa como texto, o no llega. `process.env.PORT` tiene tipo
`string | undefined`: puede ser `"3000"` (texto, no número) o puede no existir. Si el código usa
`process.env.DATABASE_URL!` en veinte archivos, el día que falte vas a tener errores en el
peor lugar posible: en medio de un pedido, con el servidor ya arrancado y sin pista de qué
variable falta. Validar al arrancar cambia eso por un mensaje claro y un proceso que no levanta.

Vamos línea por línea:

- **`import { config } from "dotenv"`** y **`config()`** — `dotenv` lee el archivo `.env` de la
  raíz y copia cada `CLAVE=valor` a `process.env`. Se llama una sola vez, arriba de todo, antes
  de leer nada. (Bun ya carga el `.env` por su cuenta, pero dejarlo explícito hace que el mismo
  arranque funcione en cualquier runtime y que se lea de un vistazo de dónde salen los valores.)
- **`import { z } from "zod"`** — la misma librería que valida los DTO de los endpoints. Un solo
  vocabulario de validación en todo el proyecto.
- **`const envSchema = z.object({ ... })`** — el contrato de configuración: qué variables exige
  el proyecto, con qué reglas. Solo nombra las que usa; las que estén de más en `process.env`
  (como `PATH` o `HOME`) se ignoran.
- **`NODE_ENV: z.enum([...]).default("development")`** — `z.enum` acepta solo uno de los tres
  valores listados. Si alguien escribe `NODE_ENV=prod`, no es un valor válido y el arranque
  falla, en vez de comportarse como desarrollo sin avisar. El `.default("development")` hace que
  la variable sea opcional.
- **`PORT: z.coerce.number().int().positive().default(3000)`** — `coerce` es la pieza clave: el
  `.env` siempre trae texto, así que `coerce.number()` convierte `"3000"` en `3000` antes de
  validar. `int()` rechaza decimales y `positive()` rechaza cero y negativos. Un puerto inválido
  es un servidor que no escucha, así que mejor saberlo al arrancar.
- **`HOST: z.string().default("0.0.0.0")`** — cualquier texto, con valor por defecto.
- **`DATABASE_URL: z.string().min(1)`** — obligatoria y no vacía. `min(1)` ataja el caso de
  `DATABASE_URL=` (definida pero vacía), que es un error tan común como no definirla.
- **`JWT_SECRET: z.string().min(32)`** — obligatoria, con un mínimo de 32 caracteres. El mínimo
  no es capricho: un secreto corto se puede adivinar por fuerza bruta, y quien adivine el
  secreto puede firmar tokens válidos, o sea entrar como cualquiera. `JWT_REFRESH_SECRET` repite
  la regla.
- **`JWT_EXPIRES_IN`** y **`JWT_REFRESH_EXPIRES_IN`** — ambos se validan con
  `z.string().default(...)`: `"15m"` y `"7d"`. Son textos con formato de duración, porque así
  los interpreta `jsonwebtoken`; por eso se validan como texto y no como número.
- **`CORS_ORIGIN: z.string().default("*")`** — el origen permitido, con `*` por defecto.

Después viene la validación en sí:

- **`const parsed = envSchema.safeParse(process.env)`** — `safeParse` valida **sin lanzar
  excepción**: devuelve un resultado. La alternativa, `parse`, tira un error que habría que
  atrapar con `try/catch`. Acá queremos manejar el caso nosotros, así que usamos `safeParse`.
- **`if (!parsed.success) { ... }`** — el resultado es una unión: si salió bien tiene `data`, si
  salió mal tiene `error`. Preguntar por `success` le permite a TypeScript saber que adentro del
  `if` estamos en el caso de error. Es el mismo mecanismo de "errores como valores" que usás
  todo el tiempo en TypeScript sin darte cuenta.
- **`console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors)`** —
  `flatten()` convierte el error de Zod en un objeto prolijo, y `fieldErrors` agrupa los
  mensajes por nombre de variable. Para `JWT_SECRET` corto, el resultado es un objeto con la
  clave `JWT_SECRET` y el mensaje "String must contain at least 32 character(s)". Se ve
  exactamente qué variable está mal y por qué. Se usa `console.error` y no el logger porque el
  logger todavía no existe.
- **`process.exit(1)`** — termina el proceso con código 1, que significa "salí mal". Un proceso
  de larga vida que arranca con configuración rota es peor que uno que no arranca: falla en cada
  pedido, en vez de fallar una vez, fuerte y temprano. A esto se le llama *fail fast*.
- **`export const env = parsed.data`** — el objeto validado y convertido, exportado con un
  nombre corto. Es el **único** lugar del proyecto que lee `process.env`: en el resto del código
  se usa `env.PORT`, `env.JWT_SECRET`, y todo tiene tipo (`env.PORT` es `number`, no
  `string | undefined`).

> La decisión de validar con Zod, y no con `envalid` o `joi`, es la misma de todo el manual: la
> librería ya está en el proyecto porque valida los DTO, y sumar otra dependencia para la misma
> tarea es deuda innecesaria.

### 04.2 `src/config/logger.ts` — pino + pino-pretty en desarrollo

**Archivo:** `example-project/src/config/logger.ts`

```typescript
import pino from "pino"
import { env } from "./env"

export const loggerOptions = {
  level: env.NODE_ENV === "production" ? "info" : "debug",
  transport: env.NODE_ENV === "production" ? undefined : { target: "pino-pretty", options: { colorize: true } },
}

export const logger = pino(loggerOptions)
```

Un **logger** es la pieza que escribe lo que pasa: cada pedido, cada error, cada decisión
importante, con hora y contexto. No es lo mismo que `console.log`. Un logger tiene **niveles** —
`trace`, `debug`, `info`, `warn`, `error`, `fatal`, de menor a mayor gravedad—, y cuando le
configurás un nivel, escribe ese nivel y todos los más graves: con `info` ves `info`, `warn`,
`error` y `fatal`, y los `debug` se descartan.

**pino** es el logger de Fastify —de hecho Fastify nació junto a pino— y es el más rápido del
ecosistema de Node. Escribe **una línea JSON por evento**, con los campos como claves:

```json
{"level":30,"time":1730000000000,"signal":"SIGTERM","msg":"Shutting down"}
```

Eso no está pensado para que lo leas vos: está pensado para que lo lea una máquina. Con líneas
JSON, el servidor de logs puede filtrar por `level`, contar errores o buscar por `signal` sin
parsing frágil. Un `console.log("chau")` con texto libre es imposible de consultar.

El archivo tiene dos exportaciones y una razón para cada una:

- **`loggerOptions`** — el objeto de configuración. `level` es `debug` en desarrollo y `info` en
  producción: en tu máquina querés el detalle, en producción querés menos ruido y menos costo.
  `transport` es `undefined` en producción y en desarrollo apunta a `pino-pretty` con
  `colorize: true`, que formatea el JSON en una línea legible con colores. Es un transporte
  únicamente para humanos: cuesta CPU y rompe el parsing, así que no va en producción.
- **`logger`** — una instancia armada con esas opciones, para el código que no pasa por Fastify:
  el apagado ordenado, el manejador de errores, los scripts. Podés llamar a `logger.info` desde
  cualquier archivo, pasándole un objeto de contexto y el mensaje.

> Detalle de Fastify v5: la opción `logger` acepta un **objeto de opciones**, no una instancia de
> pino. Si le pasás una instancia, la ignora. Para usar una instancia propia existe
> `loggerInstance`. Por eso `buildApp` arma `Fastify({ logger: loggerOptions })`: Fastify crea su
> propio pino con esas opciones, y así los logs de cada request salen con el mismo formato que
> los nuestros.

### 04.3 `src/config/prisma.ts` — un solo cliente de Prisma

**Archivo:** `example-project/src/config/prisma.ts`

```typescript
import { PrismaClient } from "@prisma/client"
import { env } from "./env"

export const prisma = new PrismaClient({
  log: env.NODE_ENV === "production" ? ["error", "warn"] : ["query", "error", "warn"],
})
```

`new PrismaClient(...)` es el objeto por el que pasa **toda** consulta a la base: `findMany`,
`create`, y también `$transaction`, que es la que vas a usar para el inventario. El archivo lo
crea una vez y lo exporta.

¿Por qué uno solo? Porque cada cliente administra un **pool de conexiones**: varias conexiones
abiertas a PostgreSQL que se reutilizan para no pagar el costo de abrir una por consulta. Si
creás un `new PrismaClient()` por pedido, cada pedido abre conexiones nuevas y en pocos minutos
PostgreSQL responde `too many clients already` (por defecto acepta unas cien). Un módulo que
importa `prisma` desde acá comparte el mismo pool, y las conexiones se reciclan.

La opción `log` es la que decide qué se escribe:

- **`["query", "error", "warn"]` en desarrollo** — `query` muestra el SQL que Prisma genera para
  cada operación. Es la mejor herramienta de aprendizaje que tiene el proyecto: escribís
  `findMany` y ves el `SELECT` con el `WHERE` y el `ORDER BY`, y entendés qué está haciendo
  el ORM de verdad.
- **`["error", "warn"]` en producción** — solo lo importante. Loguear cada consulta en
  producción es carísimo en volumen y no aporta nada.

### 04.4 `src/config/graceful-shutdown.ts` — apagado elegante

**Archivo:** `example-project/src/config/graceful-shutdown.ts`

```typescript
import type { FastifyInstance } from "fastify"
import { logger } from "./logger"
import { prisma } from "./prisma"

export function gracefulShutdown(app: FastifyInstance) {
  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down")
    await app.close()
    await prisma.$disconnect()
    process.exit(0)
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"))
  process.on("SIGINT", () => shutdown("SIGINT"))
}
```

Un **graceful shutdown** (apagado ordenado) es la diferencia entre "el proceso se muere" y "el
proceso termina lo que estaba haciendo y después se va". Se registra una sola vez, al arrancar el
servidor.

Las piezas:

- **`gracefulShutdown(app: FastifyInstance)`** — recibe la instancia de Fastify, porque para
  cerrar el servidor hace falta su referencia. Es el mismo patrón de inyección que ves en los
  módulos: la función no busca el servidor, se lo dan.
- **`const shutdown = async (signal: string) => { ... }`** — la función que hace el trabajo,
  con el nombre de la señal como parámetro para poder loggearlo.
- **`logger.info({ signal }, "Shutting down")`** — deja constancia en los logs de qué señal
  llegó. Cuando algo se reinicia solo en producción, este renglón te dice si fue un `SIGTERM` del
  orquestador o un `SIGINT` de alguien apretando Ctrl+C.
- **`await app.close()`** — cierra el servidor HTTP: deja de aceptar conexiones nuevas y espera
  a que terminen las que están en curso. Es el paso que evita cortar una respuesta a la mitad.
- **`await prisma.$disconnect()`** — cierra el pool de conexiones a PostgreSQL. Sin esto, las
  conexiones quedan colgadas del lado de la base hasta que expiran por timeout, y si el deploy
  reinicia varias veces seguidas te quedás sin conexiones disponibles.
- **`process.exit(0)`** — recién ahora sale, con código 0 (salida exitosa). El `0` importa: un
  orquestador distingue "terminó bien" de "se cayó" por el código de salida.
- **`process.on("SIGTERM", ...)`** y **`process.on("SIGINT", ...)`** — las dos **señales** que
  te importan. Una señal es un aviso que el sistema operativo le manda al proceso. `SIGTERM`
  (terminate) es la que manda un `kill`, un `docker stop` o el orquestador cuando hace un deploy;
  `SIGINT` (interrupt) es la de Ctrl+C en la terminal.

**Por qué importa en un deploy.** Cuando publicás una versión nueva, el proceso viejo tiene que
morir y el nuevo ocupar su lugar. El orquestador no lo mata de una: le manda `SIGTERM` y espera
un tiempo de gracia (en Docker, diez segundos por defecto). Si en ese tiempo el proceso no
terminó, le manda `SIGKILL`, que no se puede ignorar y corta todo donde esté. Sin este archivo,
cada deploy deja un tendal: pedidos que se cortan a mitad de camino, un `INSERT` que llegó y un
`UPDATE` que no, y conexiones a PostgreSQL colgadas. Con este archivo, el proceso aprovecha esos
segundos para terminar bien, y el usuario no nota el despliegue.

> Detalle honesto: `process.on` no espera la promesa que devuelve `shutdown`; el handler la
> dispara y sigue. Como las dos operaciones son rápidas y el proceso termina con
> `process.exit(0)`, en este proyecto alcanza. Si algún día agregás un paso lento al apagado,
> conviene envolver la llamada en un `try/catch` para no terminar con un rechazo sin manejar.

### Resumen

- Las variables de entorno llegan como texto o no llegan; `env.ts` las valida con Zod al
  arrancar, convierte (`z.coerce`), exige mínimos (secretos de 32 caracteres) y muere con
  `process.exit(1)` si algo falta: *fail fast*.
- `env` es el único lugar que lee `process.env`; el resto del proyecto usa `env.PORT`,
  `env.JWT_SECRET`, ya tipados.
- `logger.ts` exporta las opciones y la instancia de pino: JSON en producción, `pino-pretty` en
  desarrollo, `debug` en tu máquina y `info` en el servidor.
- `prisma.ts` crea un solo `PrismaClient` porque cada uno abre su pool de conexiones; con uno
  por pedido, PostgreSQL se queda sin conexiones.
- `graceful-shutdown.ts` escucha `SIGTERM` y `SIGINT`, cierra el servidor, desconecta Prisma y
  sale con código 0, para que un deploy no corte pedidos ni deje conexiones colgadas.


## 05. Manejo de errores

Hasta acá el servidor hacía su trabajo cuando todo salía bien. Este capítulo trata lo
demás, que en un backend real es la mayor parte del trabajo: qué pasa cuando algo falla.
Un servidor sin estrategia de errores devuelve, según el día y el archivo, un texto suelto,
un HTML que generó el framework, un cuerpo vacío o un 500 pelado. El frontend termina
adivinando, y cada adivinanza es un bug nuevo.

La estrategia de este proyecto se dice en una frase: **todo error de negocio es una
instancia de `AppError` (o de una de sus subclases) que lleva `statusCode`, `code` y
`message`, y un único manejador global en Fastify lo convierte a JSON**. Los errores que
nadie previó se registran en el log y salen como `500 INTERNAL_ERROR` sin filtrar nada
interno. Dos caminos, una sola forma de respuesta.

### Qué es un error dentro del ciclo de una petición

Una petición HTTP entra al servidor y recorre una cadena de estaciones. En este proyecto
son estas, siempre en el mismo orden:

1. **Ruteo.** Fastify mira el método (`GET`, `POST`…) y la ruta (`/products/:id`) y decide
   qué handler atiende.
2. **Hooks de entrada.** Funciones que corren antes del handler. El proyecto usa `onRequest`
   indirectamente y, sobre todo, `preHandler`, que es donde viven los guards de auth.
3. **Handler.** La función del controlador: lee el body, valida, llama al service y arma la
   respuesta.
4. **Service.** Las reglas de negocio: ¿existe el producto?, ¿este usuario es admin?,
   ¿alcanza el stock?
5. **Repositorio.** La conversación con la base de datos.
6. **Respuesta.** El `reply.send(...)` que vuelve al cliente con un status y un JSON.

En cualquiera de esos pasos puede fallar algo, y en JavaScript "fallar" significa lanzar una
excepción: `throw new Error("...")`. La excepción sube por la cadena de llamadas hasta que
alguien la atrapa con `try`/`catch`. Si nadie la atrapa, no desaparece: la atrapa el
framework.

Ese es el punto central del capítulo. **Fastify envuelve cada handler y atrapa lo que se
lance adentro**, y después arma la respuesta de error. Por defecto esa respuesta es un JSON
suyo, con sus propios campos (`statusCode`, `error`, `message`). Este proyecto reemplaza ese
comportamiento por defecto con `setErrorHandler(errorHandler)`, para que la forma del error
sea una sola y la decida el equipo, no la librería.

La consecuencia práctica: **el controlador no atrapa errores**. Deja que suban. El único
lugar que decide cómo se ven es el `errorHandler`. Eso es lo que hace que los errores se
vean iguales en `/products`, en `/auth` y en `/inventory`.

### Error operacional y error programático

No todos los errores son la misma clase de cosa, y confundirlos es la fuente de dos bugs
clásicos: devolver 500 cuando el usuario se equivocó, o devolver 400 cuando el que se
equivocó fuiste vos.

Un **error operacional** es un fallo esperado, previsto en el diseño. Sabés que puede
pasar, sabés qué significa y sabés qué contestar: el producto que buscás no existe (404), el
email ya está registrado (409), la contraseña no coincide (401), el body no tiene el campo
`barcode` (400), no te alcanza el stock (409). No es un bug: es el sistema funcionando. El
cliente puede hacer algo con esa información — corregir el formulario, pedir otro producto,
volver a loguearse.

Un **error programático** es un bug. Un `undefined` que no debía serlo, un `typo` en el
nombre de una columna, una división por cero, la base caída, una variable de entorno que
falta. Nadie lo previó, el código no sabe qué responder, y lo único honesto es decir "500
internal server error" y anotar todo en el log con detalle para que vos lo arregles. Lo que
nunca se hace es contarle al cliente qué pasó adentro.

El campo `isOperational` de `AppError` existe justamente para marcar esa diferencia: `true`
(por defecto) significa "esto es un fallo esperado, contestá con su `statusCode`"; `false`
significa "esto lo lancé desde un `AppError` pero por las dudas tratalo como bug". Un
manejador más estricto podría usar ese campo para decidir si loggea o no. En este proyecto
el `errorHandler` no lo usa, pero el dato queda a mano para el día que sí haga falta.

### Qué es un código de estado (y por qué no alcanza)

Un **código de estado** o *status code* es un número de tres cifras que viaja en la primera
línea de toda respuesta HTTP y que resume, en una familia, qué pasó:

- **2xx** — salió bien. `200 OK` es el caso normal.
- **4xx** — el cliente pidió algo que no se puede atender, y la culpa es del pedido. `400`
  pedido mal formado, `401` no sé quién sos, `403` sé quién sos pero no podés, `404` no
  existe, `409` choca con algo que ya existe.
- **5xx** — la culpa es del servidor.

El status es lo que el cliente mira primero, y es lo que hace que un frontend, un proxy o un
monitor de logs entiendan el resultado sin parsear el cuerpo. Lo que el status **no** puede
hacer es ser específico: `404` en `/products/:id` y `404` en `/users/:id` significan que
falta una entidad distinta, y `400` puede ser "el body no tiene la forma" o "el precio es
negativo". Para eso está el `code`.

### Por qué el error lleva `statusCode`, `code` y `details`

Acá está la decisión de diseño del capítulo, y conviene entenderla antes de leer el código.
El error se lanza en la capa que **sabe qué pasó** (el service o el repositorio), pero se
convierte en respuesta en otra capa (el `errorHandler`). Si el error viaja como un string
suelto — `throw new Error("no existe el producto")` —, la capa de arriba recibe un texto y
tiene que adivinar el status mirando palabras. Es frágil y termina en un `if` por mensaje,
que es exactamente el tipo de código que nadie entiende seis meses después.

Así que la clasificación viaja **dentro** del objeto de error:

- **`statusCode`** — el número HTTP. Lo decide el que conoce la regla de negocio, no el que
  arma la respuesta.
- **`code`** — un identificador estable, legible por máquina, en mayúsculas y sin espacios
  (`NOT_FOUND`, `CONFLICT`). El cliente programa contra esto: `if (code === "CONFLICT")`
  muestra "ese código ya existe". El `message` puede cambiar de redacción o traducirse; el
  `code` es un contrato y no cambia.
- **`message`** — la frase para humanos que el frontend puede mostrar tal cual.
- **`details`** — opcional, para datos estructurados extra: qué campo falló, qué id, qué
  valores chocaron. Es el lugar donde poner información útil sin inventar campos nuevos en
  la respuesta.

### La forma de la respuesta de error

Una sola forma en toda la API. Siempre la misma: `code` y `message`, más `details` cuando
hay algo que contar.

```json
{ "code": "CONFLICT", "message": "Barcode already exists" }
```

Si el cliente recibe eso, sabe que el status fue `409`, que el código es `CONFLICT` y qué
texto mostrar. No hay que mirar la URL ni el método para saber cómo interpretarlo: la forma
es idéntica en los dieciséis capítulos del manual.

Los seis códigos posibles, cada uno con su status y su significado:

- **`BAD_REQUEST` (400)** — la forma del pedido no sirve: falta un campo, el email no tiene
  arroba, el precio es negativo. Lo produce el `errorHandler` cuando Zod rechaza el body.
- **`UNAUTHORIZED` (401)** — no sé quién sos: falta el token, venció, la firma no cierra, o
  el email y la contraseña no coinciden.
- **`FORBIDDEN` (403)** — sé quién sos y no tenés permiso: un vendedor queriendo entrar a una
  ruta de admin.
- **`NOT_FOUND` (404)** — el recurso que pediste no existe (o está borrado).
- **`CONFLICT` (409)** — el pedido choca con una regla de unicidad o de estado: barcode
  repetido, stock insuficiente.
- **`INTERNAL_ERROR` (500)** — el error programático. El cuerpo es genérico a propósito.

### 05.1 `src/core/errors/AppError.ts` — jerarquía de errores de negocio

Este archivo es la base de todo lo demás. Define una clase que **extiende `Error`** — es
decir, sigue siendo un error de JavaScript normal, se puede lanzar con `throw`, se puede
atrapar con `catch`, tiene `message` y `stack` — y le agrega la clasificación que necesita
una API HTTP. Después define cinco subclases, una por cada código de la lista de arriba.

Primero las opciones, que son el contrato del constructor:

```typescript
export interface AppErrorOptions {
  message: string
  statusCode: number
  code: string
  details?: unknown
  isOperational?: boolean
  cause?: unknown
}
```

Es una `interface`: un molde que describe la forma de un objeto, sin generar código en
tiempo de ejecución. `message`, `statusCode` y `code` son obligatorios; los otros tres
llevan `?` y son opcionales. `unknown` es el tipo de TypeScript para "no sé qué hay acá,
obligame a chequearlo antes de usarlo": así `details` puede ser un objeto, un array o un
string sin mentirle al compilador.

Ahora la clase:

```typescript
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly details?: unknown
  public readonly isOperational: boolean

  constructor(options: AppErrorOptions) {
    super(options.message)
    this.name = new.target.name
    this.statusCode = options.statusCode
    this.code = options.code
    this.details = options.details
    this.isOperational = options.isOperational ?? true
    if (options.cause !== undefined) {
      this.cause = options.cause
    }
    Error.captureStackTrace?.(this, new.target)
  }
}
```

Línea por línea, porque cada una tiene su razón:

- `export class AppError extends Error` — `extends` hereda. Al heredar de `Error`, `instanceof
  Error` sigue siendo `true`, lo cual importa: librerías, logs y el propio Fastify tratan de
  forma especial los objetos que son errores de verdad. Si en lugar de esto hicieras
  `class AppError { ... }` a secas, `throw` funcionaría, pero `instanceof Error` sería
  `false` y te ibas a pelear con herramientas que asumen lo contrario.
- `public readonly statusCode: number` — declara un campo público (se lee desde afuera) y
  `readonly` (solo se escribe en el constructor). Un error es un hecho consumado: una vez
  creado, su clasificación no se toca. Si fuera mutable, cualquiera podría cambiar el status
  en el camino y el log diría una cosa y el cliente recibiría otra.
- `constructor(options: AppErrorOptions)` — un objeto de opciones en lugar de seis
  parámetros posicionales. Con seis parámetros, `new AppError("msg", 404, "NOT_FOUND", ...)`
  se vuelve ilegible y equivocarse de orden es invisible (pasás el `code` donde va el
  status y el compilador se queja, pero pasás un `number` donde va otro `number` y no).
  Con objeto, cada valor viaja con su nombre.
- `super(options.message)` — llama al constructor de `Error`, que setea `message` y arma el
  `stack`. Tiene que ser la primera instrucción del constructor: no podés tocar `this`
  antes de que la clase padre se haya inicializado.
- `this.name = new.target.name` — `new.target` es una palabra especial de JavaScript que,
  dentro de un constructor, apunta a la clase que se instanció **realmente**. Si hacés
  `new NotFoundError("x")`, el constructor que corre es el de `NotFoundError`, pero hereda
  el de `AppError`; `new.target.name` vale `"NotFoundError"`. Sin esta línea, todos los
  errores se llamarían `"Error"` en el log y en el stack, y perderías el dato más útil.
- `this.statusCode = options.statusCode` / `this.code = ...` / `this.details = ...` —
  copian las opciones a campos de la instancia, para que el `errorHandler` los lea.
- `this.isOperational = options.isOperational ?? true` — `??` es el operador de
  *nullish coalescing*: usa el valor de la derecha solo si el de la izquierda es `null` o
  `undefined`. El default es `true` porque, si estás lanzando un `AppError`, en principio es
  un error previsto; para marcar un bug se pasa `isOperational: false` explícito.
- `if (options.cause !== undefined) { this.cause = options.cause }` — `cause` es un campo
  estándar de los errores modernos: guarda el error original que provocó este. Sirve para
  envolver un error técnico en uno de negocio sin perder el de abajo. Se asigna solo si
  existe, para que el objeto no quede con una propiedad `undefined` que después aparece en
  `JSON.stringify`.
- `Error.captureStackTrace?.(this, new.target)` — `captureStackTrace` es una función
  específica de V8 (el motor de Node y Bun), no del estándar; por eso el `?.` antes del
  paréntesis: si no existe, no explota, simplemente no hace nada. El segundo argumento le
  dice "recortá el stack hasta esta función", así el primer renglón del stack es el lugar
  donde alguien hizo `throw`, y no el constructor de `AppError`. Menos ruido en el log.

Y después las cinco subclases:

```typescript
export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super({ message, statusCode: 400, code: "BAD_REQUEST", details })
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, details?: unknown) {
    super({ message, statusCode: 401, code: "UNAUTHORIZED", details })
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, details?: unknown) {
    super({ message, statusCode: 403, code: "FORBIDDEN", details })
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: unknown) {
    super({ message, statusCode: 404, code: "NOT_FOUND", details })
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super({ message, statusCode: 409, code: "CONFLICT", details })
  }
}
```

Las cinco son idénticas salvo dos valores. Cada una fija su `statusCode` y su `code` en el
`super`, y su constructor solo recibe `message` y, opcionalmente, `details`. La ganancia es
doble. Primero, el código de negocio se vuelve corto y claro: `new NotFoundError("Product
not found")` dice en cuatro palabras qué pasó y qué status va. Segundo, **es imposible
equivocarse**: no hay forma de lanzar un `NotFoundError` que responda 500, porque el 404 ya
está adentro de la clase. La consistencia no depende de que todos se acuerden de pasar el
número correcto.

Por eso en los services y repositorios el patrón es este:

```typescript
throw new NotFoundError("Product not found")
throw new ConflictError("Insufficient stock")
```

Fijate que no aparece ningún número. El 404 y el 409 están escondidos en la clase, y el
mensaje es específico del dominio: "Insufficient stock" dice mucho más que "Conflict". Y si
mañana el equipo decide que "stock insuficiente" debe ser 422 en lugar de 409, se cambia en
un solo lugar.

### 05.2 `src/core/errors/error-messages.ts` — mensajes estándar

Un catálogo chico, con un mensaje por código:

```typescript
export const ErrorMessages = {
  BAD_REQUEST: "Invalid request",
  UNAUTHORIZED: "Authentication required",
  FORBIDDEN: "You do not have permission to perform this action",
  NOT_FOUND: "Resource not found",
  CONFLICT: "Resource already exists",
  INTERNAL_ERROR: "Internal server error",
} as const
```

Es un objeto literal exportado con `as const` al final. Ese sufijo hace dos cosas: convierte
cada propiedad en un valor de tipo literal (`"Invalid request"` y no `string`, así el editor
te sugiere los valores) y vuelve el objeto completo `readonly`, o sea que nadie puede
reasignar `ErrorMessages.NOT_FOUND` desde otro archivo. Es el equivalente en TypeScript a un
`Object.freeze` que además sirve para el tipado.

¿Para qué existe este archivo si el `errorHandler` escribe sus propios textos? Porque sirve
de referencia y de vocabulario. Los mensajes **genéricos** — los que no dependen del dominio
— viven acá, en un solo lugar, para que no aparezcan cinco variantes de "no autorizado" en
cinco módulos. Los mensajes **específicos** de una regla, en cambio, viven en el service o
en el repositorio que los origina, porque son parte de la regla: "Barcode already exists",
"Insufficient stock", "Email already registered". Sacarlos de ahí y centralizarlos obligaría
a que el catálogo conozca todos los módulos, que es justo lo contrario de lo que busca la
arquitectura.

### 05.3 `src/config/error-handler.ts` — el errorHandler de Fastify

Acá se junta todo. Este archivo es el único lugar del proyecto que decide cómo se ve un
error para el cliente.

Antes del código, la pieza nueva que hay que entender: **Fastify permite reemplazar su
manejador de errores global con `setErrorHandler`**. La función que le pasás recibe el error,
la request y la reply, y es la responsable de escribir la respuesta. Si no la llamás nunca
(`reply.send`), la petición queda colgada hasta el timeout. Es, en los hechos, un hook de
error de alcance global: atrapa todo lo que se lance en cualquier handler, en cualquier
hook, de cualquier ruta.

```typescript
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify"
import { ZodError, z } from "zod"
import { AppError } from "@/core/errors/AppError"
import { logger } from "./logger"
```

Los imports, uno por uno. `import type` trae **solo tipos**: esos tres nombres existen
mientras compilás y desaparecen del JavaScript final, así que no hay costo en runtime — es
la forma correcta de importar cosas que solo se usan en anotaciones. `ZodError` es la clase
que lanza Zod cuando la validación falla, y `z` es el espacio de nombres para tipar;
`{ ZodError, z }` importa uno de valor y uno de tipo en la misma línea. `AppError` viene del
archivo anterior, y `logger` es el logger de pino configurado en el capítulo de
configuración: `logger.error(...)` escribe en la salida estándar del proceso, no en la
respuesta HTTP.

Después, un helper para que los errores de Zod se lean:

```typescript
function formatZodIssueMessage(issue: z.ZodIssue): string {
  const path = issue.path.length > 0 ? issue.path.join(".") : "value"
  return `${path}: ${issue.message}`
}
```

Un `ZodIssue` es un objeto que describe **un** problema concreto de validación. Tiene, entre
otras cosas, `path` (el camino hasta el campo que falló, como `["barcode"]` o
`["address", "city"]`) y `message` (el texto del problema). La función arma un string
`campo: mensaje`, que es el formato más útil para un cliente: le dice exactamente qué
campo corregir y por qué. Si el `path` está vacío — pasó cuando el schema valida un valor
suelto, no un objeto —, el campo se llama `value`, porque no hay nombre mejor.

Y ahora el manejador:

```typescript
export function errorHandler(error: FastifyError | AppError, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof ZodError) {
    const firstIssue = error.issues[0]
    const message = firstIssue ? formatZodIssueMessage(firstIssue) : "Invalid request"
    return reply.status(400).send({ code: "BAD_REQUEST", message })
  }

  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      code: error.code,
      message: error.message,
      ...(error.details !== undefined ? { details: error.details } : {}),
    })
  }

  logger.error({ err: error, method: request.method, url: request.url }, "Unhandled error")
  return reply.status(500).send({ code: "INTERNAL_ERROR", message: "Internal server error" })
}
```

La firma declara `error: FastifyError | AppError`: la unión dice "puede venir cualquier
cosa", porque Fastify no puede prometerte que el `throw` de un handler fue de un tipo
conocido. El `|` es la forma de TypeScript de decir "uno u otro".

El cuerpo son **tres chequeos en orden**, y el orden es la mitad del diseño:

1. **`if (error instanceof ZodError)`** — `instanceof` pregunta "¿este objeto fue creado por
   esta clase (o una que hereda de ella)?". Si es un error de Zod, respondemos `400` con
   `code: "BAD_REQUEST"` y el primer issue formateado. `error.issues` es el array completo de
   problemas; tomamos `issues[0]` porque el cliente puede corregir un campo por vez, y
   porque un body con veinte errores produce un mensaje ilegible. El ternario cubre el caso
   raro de un `ZodError` sin issues y cae en un texto genérico.
2. **`if (error instanceof AppError)`** — si es de nuestra jerarquía, respondemos con su
   `statusCode` y armamos el cuerpo con `code` y `message`. Los tres puntos (`...`) delante
   del ternario son *spread*: expanden el objeto `{ details: ... }` adentro del cuerpo, o no
   expanden nada si el ternario devuelve `{}`. Se escribe así en lugar de
   `details: error.details` para que, cuando no hay detalles, la propiedad **no exista** y
   no aparezca como `"details": null` en el JSON.
3. **Cualquier otra cosa** — `logger.error({ err: error, method, url }, "Unhandled error")`
   escribe una línea de log estructurada: el primer argumento es un objeto con datos (pino
   lo serializa como JSON), el segundo es el mensaje humano. Mandamos el error completo —con
   su stack y su `cause`— al log, junto con el método y la URL que lo causaron, porque sin
   eso no hay forma de reproducir el bug. Y al cliente le devolvemos `500 INTERNAL_ERROR`
   con un texto fijo.

¿Por qué Zod se chequea **antes** que `AppError`? Porque `ZodError` **no extiende**
`AppError`: son dos ramas independientes. El orden entre ellas es indiferente, pero el orden
importa respecto del tercer caso: si dejaras el `return` del 500 arriba de todo, ningún
error llegaría nunca a su rama. El `return` en cada `if` es lo que corta la cadena.

**Por qué un cliente nunca ve un stack trace.** El stack es la lista de funciones y archivos
con sus números de línea por donde pasó el error. Es oro para vos y es un mapa del tesoro
para un atacante: revela rutas absolutas del servidor, nombres de archivos, versiones de
librerías, a veces fragmentos de consultas SQL y hasta el nombre de la columna que falló.
Con eso se planifica un ataque mucho mejor. Además, al usuario no le sirve de nada: no puede
hacer nada con un renglón como
`at ProductRepository.findById (/app/src/modules/products/products.prisma.repository.ts:42:11)`.
Por eso el `catch` final loggea todo y responde con una frase fija. Es una regla que no
tiene excepciones: el detalle va al log, el cliente recibe `{ code, message }`.

### Un request que falla con 404

Sigamos un caso completo, con todos los actores. Un cliente hace
`GET /products/9f1c2a3e` con su cookie de sesión.

1. El ruteo matchea `/products/:id` y llama al `preHandler` de la ruta: `authGuard`.
2. `authGuard` verifica el JWT, escribe `request.userId`, `request.userEmail` y
   `request.userRole` y devuelve el control sin responder nada. Si hubiera fallado, habría
   lanzado `UnauthorizedError` y el recorrido terminaría acá con un 401.
3. Corre el handler: el controlador valida el `id` con su DTO y llama a
   `productsService.getById(id)`.
4. El service le pide el producto al repositorio; el repositorio consulta Prisma; la base
   responde que no hay ninguna fila con ese id (o la hay pero tiene `deleted_at`).
5. El service no devuelve `null`: eso obligaría a cada controlador a chequear nulos y a
   decidir qué responder. Lanza `throw new NotFoundError("Product not found")`.
6. El `throw` sube por el service, por el controlador (que **no** lo atrapa) y llega al
   `try`/`catch` interno de Fastify.
7. Fastify llama al `errorHandler` que registramos. No es `ZodError`. Sí es `AppError`, así
   que entra en la segunda rama: `reply.status(404).send({ code: "NOT_FOUND", message:
   "Product not found" })`. `details` es `undefined`, así que el spread no agrega nada.
8. El cliente recibe `404` con exactamente dos campos. El log queda limpio: los errores
   operacionales no se loggean como error, porque no son un problema del servidor.

Si el service hubiera querido dar contexto, podría lanzar
`new NotFoundError("Product not found", { id })`, y el cliente recibiría
`{ "code": "NOT_FOUND", "message": "Product not found", "details": { "id": "9f1c2a3e" } }`.
El status y el código no cambian: `details` es información extra, no una clasificación
distinta.

### Un request que falla con 422 (y por qué acá responde 400)

Ahora el otro camino, el que no pasa por `AppError`. El cliente hace `POST /products` con
este body:

```json
{ "barcode": "", "price": -3 }
```

1. Corre el handler del controlador. Antes de tocar el service, valida:
   `CreateProductDtoSchema.parse(request.body)`.
2. Zod recorre el schema, encuentra que `barcode` no cumple `min(1)` y que `price` no cumple
   la regla de positivos. En lugar de devolver un resultado, `parse` **lanza** un `ZodError`
   con la lista de issues. (Si hubiera usado `safeParse`, devolvería un objeto
   `{ success: false, error }` y no lanzaría nada.)
3. El `throw` sube desde el controlador hasta el `catch` de Fastify. Nadie más lo tocó.
4. El `errorHandler` entra en la primera rama: `error instanceof ZodError` es `true`.
   `error.issues[0]` es el primero de los problemas; supongamos que es el del barcode, con
   `path: ["barcode"]` y `message: "String must contain at least 1 character(s)"`.
5. `formatZodIssueMessage` lo convierte en
   `"barcode: String must contain at least 1 character(s)"`.
6. El cliente recibe `400` con
   `{ "code": "BAD_REQUEST", "message": "barcode: String must contain at least 1 character(s)" }`.
   El segundo problema, el del precio, no se envió: el cliente corrige el barcode, reintenta,
   y ahí se entera del precio. Es el precio de mandar un solo mensaje.

Acá conviene una aclaración honesta sobre el número. El estándar HTTP tiene un código
pensado exactamente para este caso: **`422 Unprocessable Entity`**, que significa "el JSON
está bien formado, lo entendí, pero el contenido no cumple las reglas". Muchas APIs
distinguen `400` (no pude ni leerlo) de `422` (lo leí y no me sirve). Este proyecto eligió
otro camino: **unifica toda la validación en `400` con `code: "BAD_REQUEST"`**, y usa el
`message` para decir qué campo falló. Es una decisión válida y muy común, y tiene una
ventaja: el cliente tiene un solo status para chequear. La desventaja es que pierde el matiz.
Si quisieras pasar a `422`, el cambio es de una línea en este archivo (el `status(400)` de
la primera rama) y el resto no se toca, porque nadie más decide el número.

### Resumen

- Un error es una excepción que atraviesa la cadena handler → service → repositorio; el
  controlador no la atrapa, la atrapa Fastify y la deriva al `errorHandler` global.
- **Operacional** es el fallo esperado (no existe, está repetido, no tenés permiso);
  **programático** es el bug. El primero se contesta con su `statusCode`; el segundo se
  loggea y se responde `500 INTERNAL_ERROR`.
- La clasificación viaja dentro del error: `statusCode` (número HTTP), `code` (contrato
  estable para el cliente), `message` (texto humano) y `details` (datos extra opcionales).
- `AppError` extiende `Error`, fija `name` con `new.target.name` y recorta el stack;
  `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError` y
  `ConflictError` fijan status y código, así el negocio no puede equivocarse de número.
- El `errorHandler` tiene tres ramas en orden (Zod → `AppError` → desconocido), siempre con
  la misma forma `{ code, message }`; el stack nunca sale al cliente, solo al log.

## 06. Punto de entrada: de arranque a rutas

Ya tenés errores y sabés qué pasa cuando algo falla. Ahora toca el viaje anterior: qué
ocurre desde que escribís `bun run dev` hasta que el servidor puede responder la primera
petición. Son tres archivos y treinta líneas, y en esas treinta líneas están las decisiones
que hacen que el proyecto se pueda probar sin abrir un puerto, que el deploy no corte
peticiones a mitad de camino y que el frontend pueda hablar con el backend desde otro
origen.

La separación es esta: `src/server.ts` **arranca** (proceso, puerto, señales),
`src/app.ts` **construye** (plugins globales, manejador de errores) y `src/http/routes.ts`
**monta** los routers. La clave es que construir y arrancar sean cosas distintas: `buildApp()`
devuelve una app sin puerto abierto, así que un test puede usarla con `app.inject()` —que
simula una petición HTTP sin red de por medio— y probar todo el recorrido, incluidos hooks y
errores, sin ocupar un puerto ni depender del entorno.

### Qué es un proceso

Un **proceso** es un programa en ejecución: el sistema operativo le da un espacio de memoria
propio, un identificador (PID) y, si quiere, acceso a la red. Cuando corrés `bun run dev`,
Bun arranca un proceso, carga `src/server.ts` y ejecuta su contenido de arriba a abajo. Ese
proceso no termina cuando termina el archivo: si queda algo escuchando conexiones, se queda
vivo esperando. Un servidor web es, literalmente, un proceso que no se muere.

Cuando ese proceso muere, todo lo que tenía en memoria se pierde. Por eso el estado
importante —usuarios, productos, sesiones— vive en PostgreSQL y no en una variable.

### Qué es un puerto

Un **puerto** es un número entre 1 y 65535 que identifica, dentro de una máquina, a qué
programa hay que entregarle los datos que llegan. La dirección IP dice "esta computadora";
el puerto dice "este programa de esta computadora". El 3000 es el habitual para desarrollo
en Node y Bun; el 80 es HTTP y el 443 es HTTPS. Un puerto puede estar ocupado por un solo
proceso a la vez: si intentás levantar un segundo servidor en el 3000, falla con
`EADDRINUSE` ("address in use").

En desarrollo todo esto pasa en tu máquina (`localhost` o `127.0.0.1`, que apunta a ella
misma). En producción el servidor está en otra máquina y el `HOST` suele ser `0.0.0.0`,
que significa "escuchá en todas mis interfaces de red", no solo en la interna.

### Qué significa escuchar (`listen`)

`listen` es la llamada que le pide al sistema operativo: "quedate con este puerto y avisame
cuando llegue una conexión". A partir de ahí el proceso deja de ser un script y pasa a ser
un servidor: el sistema le entrega cada conexión nueva, y Fastify la convierte en una
petición, la rutea y llama al handler.

`listen` es asíncrono porque hay trabajo real detrás: abrir el socket, verificar permisos,
reservar el puerto, y antes de eso dejar que Fastify termine de cargar todos los plugins
registrados. Hasta que la promesa de `listen` no se resuelve, no podés asumir que el
servidor está escuchando. Por eso en el código de abajo aparece con `await`.

### 06.1 `src/server.ts` — bootstrap del servidor

Este archivo no tiene lógica de negocio: es puro arranque. Construye la app, la pone a
escuchar y deja preparado el apagado ordenado. Nada más.

```typescript
import { buildApp } from "./app"
import { env } from "./config/env"
import { logger } from "./config/logger"
import { gracefulShutdown } from "./config/graceful-shutdown"

const app = buildApp()

try {
  await app.listen({ port: env.PORT, host: env.HOST })
  logger.info(`Server listening on http://${env.HOST}:${env.PORT}`)
} catch (error) {
  logger.error(error, "Failed to start server")
  process.exit(1)
}

gracefulShutdown(app)
```

Bloque por bloque:

- **Los cuatro imports.** `buildApp` es la fábrica del archivo siguiente. `env` es el objeto
  con la configuración ya validada: puerto, host, secretos, orígenes permitidos. `logger` es
  el logger de pino. `gracefulShutdown` es la función que registra los manejadores de
  señales del sistema (vive en `src/config/graceful-shutdown.ts`, y ya la viste en el
  capítulo de configuración).
- **`const app = buildApp()`** — acá se crea la instancia de Fastify con sus plugins y sus
  rutas, pero **todavía no hay ningún puerto abierto**. Nadie puede conectarse. Esta línea es
  la que un test reemplaza por su propia llamada a `buildApp()`, sin tocar nada más.
- **`try` / `await app.listen({ port: env.PORT, host: env.HOST })`** — abre el puerto. El
  objeto que recibe tiene el puerto (de la configuración, no hardcodeado) y el host. Si algo
  sale mal —el puerto está ocupado, no hay permisos, falta una variable— la promesa se
  rechaza y caemos al `catch`.
- **`logger.info(...)`** — se escribe **después** del `await`, porque recién ahí es verdad
  que el servidor está escuchando. Un log de "escuchando" antes del `listen` es una mentira
  que después te hace perder media hora buscando por qué el navegador no conecta.
- **`catch (error)`** — `logger.error(error, "Failed to start server")` deja el motivo en el
  log y `process.exit(1)` termina el proceso con código 1. El **código de salida** es un
  número que el proceso devuelve al sistema al morir: `0` significa "terminé bien", cualquier
  otro significa "fallé". Docker, systemd, un deploy de Kubernetes o un script de CI leen ese
  número para saber si reiniciar, avisar o abortar. Si te tragás el error y el proceso queda
  vivo sin puerto, el orquestador cree que todo está bien y el servicio está caído sin que
  nadie se entere.
- **`gracefulShutdown(app)`** — se llama **al final**, y por una razón: se registran
  handlers de `SIGTERM` (lo que manda `docker stop` o un deploy) y `SIGINT` (Ctrl+C) que
  cierran el servidor HTTP dejando terminar las peticiones en curso, después desconectan
  Prisma y recién entonces salen con código 0. Si los registraras antes del `listen` y el
  arranque fallara, esos handlers intentarían apagar un servidor que nunca existió.

El orden, entonces, es **construir → escuchar → preparar el apagado**, y no es un capricho:
no se puede escuchar antes de construir, y no tiene sentido preparar el apagado de algo que
todavía no está encendido.

Por último, el `await` está en el nivel más alto del módulo, sin ninguna función `async`
envolviéndolo. Eso se llama **top-level await** y funciona porque `server.ts` es un módulo
ESM (`import`/`export`). El módulo termina de evaluarse cuando `listen` se resuelve, y ahí
queda vivo por el servidor, no por el archivo.

### 06.2 `src/app.ts` — fábrica de la aplicación Fastify

`buildApp` es una **fábrica**: una función que devuelve un objeto ya armado. La usan dos
consumidores distintos — `server.ts` para escuchar de verdad y los tests para inyectar
peticiones — y por eso el armado no puede estar mezclado con el arranque.

```typescript
import Fastify from "fastify"
import helmet from "@fastify/helmet"
import cors from "@fastify/cors"
import compress from "@fastify/compress"
import cookie from "@fastify/cookie"
import rateLimit from "@fastify/rate-limit"
import { env } from "./config/env"
import { loggerOptions } from "./config/logger"
import { errorHandler } from "./config/error-handler"
import { registerRoutes } from "./http/routes"

export function buildApp() {
  const app = Fastify({ logger: loggerOptions })

  app.register(helmet)
  app.register(cors, {
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
    credentials: true,
  })
  app.register(compress)
  app.register(cookie)
  app.register(rateLimit, { max: 100, timeWindow: "1 minute" })

  app.setErrorHandler(errorHandler)

  registerRoutes(app)

  return app
}
```

Antes de leerlo línea por línea hay que tener clara la palabra que aparece seis veces:
**plugin**. En Fastify, un plugin es una función con la firma
`(instancia, opciones) => void | Promise<void>`: recibe la instancia del servidor y un objeto
de configuración, y le agrega capacidades —decoradores, hooks, rutas, un cliente de base de
datos, lo que sea—. Los cinco `@fastify/*` de este archivo son plugins oficiales.

**`register` no es lo mismo que llamar a la función.** Si escribieras `helmet(app)` estarías
invocando el plugin en ese mismo instante, sin contexto, sin opciones y sin esperar a que
termine. `app.register(plugin, opciones)` en cambio **encola** el plugin: Fastify lo ejecuta
durante la fase de `ready()` —el momento en que, justo antes de escuchar, resuelve todos los
plugins en orden—, le pasa las opciones, espera su promesa si es asíncrono, y lo hace dentro
de un **contexto encapsulado**: lo que el plugin decora queda visible para las rutas
registradas adentro de él y no se filtra a los hermanos. Esa encapsulación es lo que permite
que dos módulos tengan hooks distintos sin pisarse. Además, `register` es lo que hace que el
orden importe y sea confiable: los plugins se resuelven en el orden en que los registraste.

Ahora el cuerpo, línea por línea:

- **`const app = Fastify({ logger: loggerOptions })`** — crea la instancia. `loggerOptions`
  es la configuración de pino: nivel según entorno, formato legible en desarrollo y JSON en
  producción. Con esto cada petición deja un log con método, URL, status y duración; sin
  esto, Fastify no loggea nada.
- **`app.register(helmet)`** — agrega **headers de seguridad HTTP**. Helmet no filtra nada:
  escribe cabeceras en cada respuesta para que el navegador se comporte de forma más
  defensiva. Las que importan acá: `X-Content-Type-Options: nosniff` evita que el navegador
  "adivine" el tipo de un archivo y ejecute como script algo que se sirvió como texto (un
  vector clásico de XSS); `X-Frame-Options` / `frame-ancestors` impide meter el sitio en un
  `<iframe>` ajeno para hacer *clickjacking*; `Strict-Transport-Security` le dice al
  navegador que siempre use HTTPS con ese dominio, y evita el downgrade a HTTP;
  `Referrer-Policy` limita qué URL se filtra a terceros. En una API JSON muchas de estas
  cabeceras no hacen daño y algunas no aplican, pero cuestan cero y cubren el día que
  agregues una página.
- **`app.register(cors, { ... })`** — CORS (*Cross-Origin Resource Sharing*) es el mecanismo
  que decide si un navegador deja que una página de un origen lea respuestas de otro origen.
  "Origen" es la terna protocolo + dominio + puerto: `http://localhost:5173` y
  `http://localhost:3000` son orígenes **distintos** aunque estén en la misma máquina. Sin
  CORS, un frontend en 5173 que llama a la API en 3000 recibe un error de red en la consola y
  no puede leer el cuerpo, aunque el servidor haya respondido `200`. La opción `origin` dice
  a quién se le permite: si `CORS_ORIGIN` es `"*"` (desarrollo) se pasa `true`, que hace que
  el plugin **refleje** el origen que vino en la petición; si es una lista
  (`"https://pos.midominio.com,https://admin.midominio.com"`), se parte por comas con
  `split(",")` y solo esos orígenes pasan. `credentials: true` habilita el envío de cookies
  entre orígenes, que es imprescindible acá porque los tokens viajan en cookies `httpOnly`
  (capítulo 07). Detalle que explica el ternario: cuando hay credenciales de por medio, la
  especificación **prohíbe** responder literalmente `Access-Control-Allow-Origin: *`; hay que
  devolver el origen concreto, y eso es lo que hace `true`.
- **`app.register(compress)`** — comprime las respuestas con gzip o brotli según lo que el
  cliente diga en `Accept-Encoding`. Cubre un riesgo de costo y de velocidad: un listado de
  inventario con dos mil filas puede pesar cientos de kilobytes en JSON, y esas mismas filas
  comprimidas pesan una fracción. En una red móvil lenta la diferencia se siente; en un
  servidor con miles de peticiones por minuto también, en ancho de banda. El intercambio es
  CPU: comprimir cuesta ciclos, y por eso no se comprime todo por defecto en todos los
  tamaños.
- **`app.register(cookie)`** — parsea la cabecera `Cookie` de cada petición a un objeto
  `request.cookies`, y agrega `reply.setCookie(...)` y `reply.clearCookie(...)`. Sin este
  plugin, `request.cookies` es `undefined` y `reply.setCookie` no existe: el guard de auth
  explotaría con un `TypeError` en la primera petición. Cubre el riesgo de manejar cookies a
  mano, que es parsear strings con `;` y equivocarse en los atributos.
- **`app.register(rateLimit, { max: 100, timeWindow: "1 minute" })`** — limita a **100
  peticiones por minuto por IP**; la 101 recibe `429 Too Many Requests`. Cubre un ataque muy
  concreto: la fuerza bruta contra `POST /auth/login`, que es probar miles de contraseñas
  por minuto hasta acertar. También frena el *credential stuffing* (listas de usuario y
  contraseña robadas de otros sitios) y los scrapers torpes. Ojo con un detalle de
  producción: detrás de un proxy inverso (nginx, un balanceador, Cloudflare), todas las
  peticiones llegan con la IP del proxy, y el límite terminaría siendo global para todos los
  usuarios; en ese escenario hay que configurar `trustProxy` para que Fastify lea la IP real
  de `X-Forwarded-For`.
- **`app.setErrorHandler(errorHandler)`** — instala el manejador del capítulo anterior.
  `setErrorHandler` no es un plugin: es un método de la instancia, por eso va sin `register`.
- **`registerRoutes(app)`** — monta todos los routers (siguiente archivo). Sí se llama
  directo, no con `register`: es una función nuestra que a su vez registra cada router con su
  prefijo.
- **`return app`** — devuelve la instancia armada pero **sin escuchar**. Ese es el contrato
  de la fábrica: quien la llama decide si abre un puerto o inyecta peticiones de prueba.

Si querés sumar un plugin global (por ejemplo `@fastify/swagger` para documentar la API, o
`@fastify/multipart` para subir archivos), este es el lugar, y el orden es una decisión tuya:
va donde su efecto tenga sentido.

### 06.3 `src/http/routes.ts` — registro de routers con prefijo

Queda una sola tarea: pegar los routers de los módulos a la app. Cada módulo expone su
propio plugin de rutas, y acá se lo registra con un **prefijo**: un string que Fastify
antepone a todas las rutas declaradas adentro del plugin.

```typescript
import type { FastifyInstance } from "fastify"
import { authRoutes } from "@/modules/auth/presentation/auth.routes"
import { rolesRoutes } from "@/modules/roles/presentation/roles.routes"
import { usersRoutes } from "@/modules/users/presentation/users.routes"
import { productsRoutes } from "@/modules/products/presentation/products.routes"
import { servicesRoutes } from "@/modules/services/presentation/services.routes"
import { inventoryRoutes } from "@/modules/inventory/presentation/inventory.routes"

export function registerRoutes(app: FastifyInstance) {
  app.register(authRoutes, { prefix: "/auth" })
  app.register(rolesRoutes, { prefix: "/roles" })
  app.register(usersRoutes, { prefix: "/users" })
  app.register(productsRoutes, { prefix: "/products" })
  app.register(servicesRoutes, { prefix: "/services" })
  app.register(inventoryRoutes, { prefix: "/inventory" })
}
```

- **`import type { FastifyInstance }`** — `FastifyInstance` es el tipo de la instancia del
  servidor. Se importa con `import type` porque solo se usa en la firma; en el JavaScript
  compilado no queda rastro.
- **Los seis imports de rutas** — uno por módulo, todos con el alias `@/`, que apunta a
  `src/` (configurado en `tsconfig.json`). Sin el alias, cada import sería una cadena de
  `../../../..` que se rompe al mover un archivo.
- **`export function registerRoutes(app: FastifyInstance)`** — recibe la app y la decora con
  rutas. No devuelve nada: el efecto es sobre la instancia.
- **Cada `app.register(xRoutes, { prefix: "/auth" })`** — registra el plugin del módulo
  dentro de un contexto cuyo prefijo es `/auth`. Adentro de `authRoutes`, la ruta `"/login"`
  se publica como `/auth/login`. El prefijo es lo que evita repetir el nombre del módulo en
  cada ruta y lo que agrupa todo lo de auth bajo una misma URL.

**Por qué cada módulo es un plugin y no una función que se llama.** Por tres razones que se
suman. Primero, el prefijo: solo `register` sabe aplicarlo, porque es quien construye el
contexto. Segundo, la encapsulación: los hooks y decoradores que el módulo declare quedan
adentro de su contexto, así un `preHandler` de auth no se filtra a productos. Tercero, el
arranque ordenado: Fastify resuelve los seis plugins en la fase de `ready`, y si uno declara
dos veces la misma ruta, el error aparece **al arrancar** ("Method 'GET' already declared for
route /products/") y no en producción a las tres de la mañana con un handler tapando al otro.

Una regla de higiene con los prefijos: no llevan barra final. El prefijo es `"/auth"`, no
`"/auth/"`, y adentro del plugin las rutas empiezan con `"/"`. La combinación de ambos
produce `/auth/login`. Por eso una ruta declarada como `fastify.get("/")` dentro del plugin
de roles responde en `/roles` (y no en `/roles/`): la raíz del prefijo es la ruta del módulo.

Agregar un módulo nuevo, entonces, son dos líneas acá: el `import` y el `app.register` con su
prefijo. Nada más cambia en el resto del servidor, y eso es exactamente lo que se busca.

### Resumen

- Un proceso es el programa corriendo; un puerto identifica qué programa recibe los datos en
  una máquina; `listen` es lo que convierte el script en servidor y es asíncrono.
- El orden de `server.ts` es construir → escuchar → registrar apagado: no se escucha sin
  construir, se loggea después del `await` y el apagado se prepara al final. Un fallo de
  arranque sale con `process.exit(1)` para que el sistema se entere.
- `buildApp()` es una fábrica que devuelve la app **sin puerto abierto**; por eso los tests
  pueden usar `app.inject()` sin ocupar la red.
- Un plugin es una función `(instancia, opciones)`; `register` lo encola, lo ejecuta en
  `ready()` y lo encapsula. Helmet, CORS, compress, cookie y rate-limit cubren cabeceras,
  orígenes, tamaño, cookies y fuerza bruta; cada uno con su riesgo concreto.
- Cada módulo es un plugin y se monta con `register(rutas, { prefix })`; el prefijo agrupa
  las URLs y la encapsulación evita que los hooks de un módulo toquen a otro.

## 07. Módulo auth

Este es el capítulo más difícil del manual, y conviene decirlo antes de empezar: no porque
el código sea largo, sino porque hay cinco ideas nuevas que se apoyan una en otra. Si alguna
no cierra, las demás se caen. Así que va despacio, en dos partes. Primero el recorrido
completo, con cada concepto definido antes de usarlo; después los trece archivos, en el orden
en que tiene sentido leerlos.

El objetivo del módulo es simple de enunciar: **que un usuario demuestre quién es una vez, y
que después el servidor lo reconozca en cada petición sin volver a pedirle la contraseña**.
Todo lo demás —tokens, cookies, guardias, sesiones— son los detalles de cómo se hace eso sin
guardar contraseñas y sin que un atacante pueda robar la identidad de nadie.

### Autenticar no es lo mismo que autorizar

Dos palabras que se usan como sinónimos y no lo son:

- **Autenticación** es averiguar **quién sos**. Se hace una vez, con email y contraseña, y el
  resultado es una prueba de identidad (un token).
- **Autorización** es decidir **qué podés hacer**. Se hace en cada petición, y el resultado
  es sí o no: este usuario es `admin`, este es `vendedor`, este puede ver productos pero no
  borrarlos.

El módulo auth hace las dos, pero en momentos distintos: el login autentica, los guards
autorizan. Tenerlas separadas es lo que permite que un usuario siga siendo el mismo aunque
cambie de rol.

### El recorrido completo, de la contraseña a la cookie

Leelo dos veces, porque es la base de todo lo que viene después.

1. El usuario manda `POST /auth/login` con `email` y `password` en el body.
2. El service busca el usuario por email. Si no existe, está desactivado (`is_active` en
   `false`) o está borrado (`deleted_at` con fecha), responde `401` con un mensaje genérico:
   **"Invalid credentials"**, el mismo en los tres casos. Esto es deliberado: si el mensaje
   dijera "ese email no existe", cualquiera podría usar el login como buscador de usuarios
   registrados. Ese ataque se llama *enumeración de usuarios*.
3. Compara la contraseña recibida con el **hash** guardado en la base. Nunca se compara
   texto contra texto, porque en la base no hay texto: hay un hash.
4. Firma dos **tokens**: un **access token** que dura 15 minutos y lleva `userId`, `email` y
   `role`, y un **refresh token** que dura 7 días y lleva solo `userId`.
5. Guarda el refresh token en la tabla `session`, con la fecha en que vence. Ese registro es
   lo que hace que el refresh se pueda **revocar**: un token firmado no se puede "deshacer",
   pero una fila se puede borrar.
6. Devuelve los dos tokens como **cookies `httpOnly`** y, en el cuerpo, solo el perfil del
   usuario (id, nombre, email, rol). Los tokens no van en el JSON.
7. El navegador guarda las cookies solo, sin que el frontend escriba una línea de código. Y
   como son `httpOnly`, el JavaScript de la página **no puede leerlas**: si alguien logra
   inyectar un script (XSS), no se lleva los tokens.
8. En cada petición siguiente el navegador manda las cookies. El `authGuard` lee el access
   token, verifica su firma y deja `request.userId`, `request.userEmail` y `request.userRole`
   listos para el handler. Nada de consultar la base: por eso el rol viaja dentro del token.
9. Cuando el access token vence (a los 15 minutos), el frontend llama a
   `POST /auth/refresh`. El service verifica la firma del refresh token **y** que la sesión
   siga existiendo en la base **y** que no haya vencido **y** que el usuario siga activo.
   Recién ahí firma un access token nuevo, esta vez buscando el usuario en la base, así el
   rol que se firma es el actual y no el de hace siete días.
10. `POST /auth/logout` borra la fila de `session` y limpia las cookies. A partir de ahí el
    refresh token es inútil, aunque alguien lo tenga copiado.

**El intercambio que tenés que conocer.** El access token es un JWT *stateless*: el servidor
no guarda nada sobre él, solo verifica la firma. Eso lo hace rapidísimo, y también significa
que **sigue siendo válido hasta que vence, aunque el usuario haya hecho logout**. El logout
revoca el refresh —que es lo importante a largo plazo, porque es el que permite renovar—, y
el access vive 15 minutos como máximo. Si tu aplicación necesitara revocación inmediata del
access, tendrías que agregar una lista negra de tokens o consultar la sesión en cada
petición; eso cuesta una consulta por request y este proyecto eligió no pagarla. Es una
decisión, no un olvido.

### La contraseña: hash, salt y por qué no se guarda nunca

Un **hash** es una función que convierte un texto en una huella de tamaño fijo, y que no se
puede deshacer: `"123456"` → `$2b$10$N9qo8uLO...`. No existe la operación inversa. Suena
raro hasta que ves la jugada: vos no necesitás recuperar la contraseña, solo necesitás
comprobar que la que te dan produce la misma huella. Si te roban la base, lo que se llevan
son huellas, no contraseñas.

Un **salt** es un valor aleatorio que se le agrega a cada contraseña antes de hashearla. Sin
salt, dos usuarios con la misma contraseña tendrían el mismo hash y un atacante podría
precalcular una tabla gigante de contraseñas comunes (un *rainbow table*). Con salt, cada
hash es distinto aunque la contraseña sea la misma, y esa tabla no sirve.

**bcrypt** es el algoritmo que usa el proyecto, y tiene dos propiedades que lo hacen apto:
incorpora el salt dentro del propio hash (por eso no hay que guardarlo en una columna
aparte) y es **lento a propósito**. Un SHA-256 calcula millones de hashes por segundo, lo
cual es ideal para verificar archivos y desastroso para contraseñas: una GPU prueba miles de
millones de combinaciones por hora. bcrypt está diseñado para tardar decenas de milisegundos,
y ese costo es idéntico para vos y para el atacante. El número de **rondas** (o *cost*) es
cuántas veces se repite el cálculo: 10 rondas es el valor habitual, unos 60 a 100 ms por
hash. Subirlo a 12 hace el ataque cuatro veces más caro y el login cuatro veces más lento.

La regla que no tiene excepciones: **nunca se guarda ni se loggea una contraseña en texto
plano**. Ni en la base, ni en un `console.log`, ni en un mensaje de error.

### Un token es un pasaporte firmado

Un **JWT** (*JSON Web Token*) es un string con tres partes separadas por puntos:
`cabecera.payload.firma`. Las dos primeras son JSON codificado en base64url (una variante de
base64 que va sin `+`, `/` ni `=` para poder viajar en una URL); la tercera es la firma
criptográfica de las dos primeras, calculada con un secreto que solo conoce el servidor.

Tres consecuencias que hay que tener claras:

- **No está encriptado: está firmado.** Cualquiera que tenga el token puede leer el payload
  (con un decodificador de base64, en dos segundos). Por eso el payload lleva identificadores
  y el rol, y no lleva contraseñas ni datos sensibles.
- **No se puede modificar sin que se note.** Si alguien cambia `role: "vendedor"` por
  `role: "admin"`, la firma deja de coincidir y `verify` falla. Esa es toda la seguridad del
  esquema: quien no tiene el secreto no puede fabricar un token válido.
- **El servidor no necesita guardarlo.** Verificar es recalcular la firma y mirar el campo
  `exp` (vencimiento). Cero consultas a la base, cero estado. Eso es lo que significa
  *stateless*.

¿Y por qué **dos** tokens? Porque las dos necesidades son opuestas. El access token tiene que
ser barato de verificar y durar poco: si te lo roban, el daño dura 15 minutos. El refresh
token tiene que durar mucho —nadie quiere escribir la contraseña cada cuarto de hora— y por
eso **no** puede ser intocable: se guarda en la base para poder revocarlo. Uno es rápido y
descartable; el otro es durable y revocable. Y se firman con **secretos distintos**, así que
un access token robado no sirve para fabricar un refresh, ni al revés.

### Por qué una cookie y no `localStorage`

El frontend podría guardar el token en `localStorage` y mandarlo en la cabecera
`Authorization`. Muchos lo hacen. El problema es que `localStorage` es legible por cualquier
JavaScript de la página: un solo XSS —un comentario mal escapado, una librería comprometida—
y el atacante se lleva el token y la sesión completa.

Una cookie **`httpOnly`** es una cookie que el navegador manda sola en cada petición al
mismo dominio, pero que **el JavaScript no puede leer**. El token sigue existiendo, el
navegador lo administra y el atacante con XSS no puede sacarlo. Los otros atributos completan
el cuadro: `secure` hace que la cookie solo viaje por HTTPS, y `sameSite` controla si la
cookie se manda cuando la petición la origina otro sitio, que es la defensa contra **CSRF**
(*Cross-Site Request Forgery*: una página ajena que hace que tu navegador mande una petición
autenticada sin que te enteres).

El costo de elegir cookies es que hay que pensar en CSRF y en CORS con credenciales; el costo
de elegir `localStorage` es que un XSS te cuesta la sesión. El proyecto eligió cookies.

### Y por último: el guard

Un **guard** (guardia) es una función que se ejecuta antes del handler y decide si la
petición sigue. En otros frameworks a esa idea se le dice **middleware**; Fastify la parte en
varios momentos del ciclo de vida y los llama **hooks**, y en concreto el que nos sirve acá es
`preHandler`. Un **hook** es un punto de enganche: Fastify te avisa "estoy por ejecutar el
handler" y vos metés código ahí. Si el guard no hace nada, la petición sigue; si lanza un
error, el handler nunca corre y el `errorHandler` del capítulo 05 arma la respuesta.

Eso es lo que permite proteger una ruta con una línea
(`{ preHandler: [authGuard] }`) en lugar de repetir el chequeo del token en cada controlador.

Con el mapa completo, ahora sí, los archivos.

### 07.1 `src/types/auth.d.ts` — payloads de los JWT

El primer archivo no tiene código ejecutable: define **qué viaja adentro de cada token**. Es
la forma de que TypeScript te ayude a no firmar un token con los campos equivocados y a no
leer un campo que no está.

```typescript
export interface AuthTokenPayload {
  userId: string
  email: string
  role: string
}

export interface RefreshTokenPayload {
  userId: string
}
```

- **`AuthTokenPayload`** es el contenido del **access token**: `userId` (quién es), `email`
  (para mostrarlo o para logs) y `role` (el nombre del rol, como `"admin"` o `"vendedor"`).
  El `role` viaja en el token a propósito: es lo que le permite a `adminGuard` decidir sin
  consultar la base en cada petición. El precio de esa velocidad es que un cambio de rol no
  se refleja hasta que el token vence o se renueva.
- **`RefreshTokenPayload`** es el contenido del **refresh token**: solo `userId`. Un refresh
  no necesita el rol, y no tenerlo es una ventaja: al renovar, el service busca el usuario
  fresco en la base y firma el access nuevo con el rol **actual**. Si al usuario lo
  ascendieron a admin (o lo desactivaron) hace diez minutos, el refresh lo refleja enseguida.

Los dos `export interface` no generan ni una línea de JavaScript: son moldes para el
compilador. El archivo se llama `.d.ts` (de *declaration*) porque solo declara tipos; esa
extensión le dice a TypeScript que ahí no hay runtime que ejecutar.

### 07.2 `src/types/fastify.d.ts` — extensión de `FastifyRequest`

Este archivo resuelve un problema muy concreto de TypeScript, y entenderlo te ahorra horas
de pelea con el compilador. El `authGuard` escribe tres campos nuevos en la request:
`userId`, `userEmail` y `userRole`. TypeScript, que no ejecuta el código, no tiene forma de
saber que eso pasa: para él, `FastifyRequest` tiene método, url, headers y body, y nada más.
Si un controlador escribe `request.userId`, te marca error: "Property 'userId' does not exist
on type 'FastifyRequest'".

La solución se llama **module augmentation** (aumento de módulo): reabrir la declaración de un
módulo ajeno y agregarle miembros.

```typescript
import "fastify"

declare module "fastify" {
  interface FastifyRequest {
    userId: string
    userEmail: string
    userRole: string
  }
}
```

- **`import "fastify"`** — un import sin nombres, que solo sirve para que el archivo sea un
  módulo y para que TypeScript cargue la declaración de `fastify` antes de reabrirla. Sin
  esta línea, `declare module` crearía un módulo nuevo en lugar de aumentar el existente.
- **`declare module "fastify" { ... }`** — abre el módulo `fastify` y le agrega cosas. Lo que
  esté adentro se **fusiona** con lo que ya existía; no lo reemplaza.
- **`interface FastifyRequest { ... }`** — las interfaces de TypeScript se pueden declarar
  varias veces y el compilador las une (eso se llama *declaration merging*). Así que esta
  interface no pisa la original: le suma tres propiedades.
- **Los tres campos** — `userId`, `userEmail`, `userRole`, todos `string` y **no opcionales**.
  Es una promesa fuerte: el compilador va a asumir que siempre están. Eso es cierto en las
  rutas protegidas por `authGuard`, y por eso los controladores que los usan van siempre
  detrás del guard. Si los declararas opcionales (`userId?: string`), cada uso necesitaría un
  chequeo de nulo; si los declaras obligatorios, el compilador confía en vos y la
  responsabilidad de registrarlo en todas las rutas que los leen es tuya.

La regla que hace que esto funcione es de disciplina: **el guard es el único que escribe esos
campos, y los controladores solo los leen**. Si un controlador los modificara, el tipado
seguiría compilando pero la realidad dejaría de coincidir con la declaración.

### 07.3 `src/modules/auth/domain/auth.entities.ts` — entidades del dominio

Una **entidad** es la representación de una fila de la base de datos tal como la necesita
una capa. No es el modelo de Prisma (que se genera solo desde el schema) ni el DTO de
respuesta: es una interface propia, explícita, con exactamente los campos que el módulo usa.
Así, si mañana cambia una columna que auth no usa, este archivo no se toca.

```typescript
export interface IUserWithRole {
  id: string
  name: string
  email: string
  password_hash: string
  role: {
    id: string
    name: string
  }
  is_active: boolean
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}
```

`IUserWithRole` es el usuario tal como lo necesita auth. Los campos que importan para este
capítulo:

- **`password_hash`** — el hash de la contraseña, no la contraseña. Es lo que recibe
  `comparePassword`. Que el campo esté en la interface es una decisión de alcance: este tipo
  se usa solo dentro del módulo auth, nunca se devuelve al cliente.
- **`role: { id, name }`** — el rol **anidado** como objeto, no como `role_id`. Es la forma en
  que Prisma devuelve una relación incluida, y es más cómodo: `user.role.name` da el nombre
  que se firma en el token sin tener que hacer una segunda consulta.
- **`is_active` y `deleted_at`** — las dos formas de "este usuario no debería poder entrar".
  `is_active` es un booleano administrado a mano (desactivar a alguien sin borrarlo);
  `deleted_at` es la marca del *soft delete*: en lugar de borrar la fila, se le pone fecha y
  el registro sigue existiendo para no romper las ventas históricas que lo referencian.
- **`created_at`, `updated_at`** — auditoría básica: cuándo se creó y cuándo se tocó por
  última vez.

La segunda interface es la fila de sesión:

```typescript
export interface ISessionEntity {
  id: string
  user_id: string
  refresh_token: string
  expires_at: Date
  created_at: Date
}
```

`ISessionEntity` es una fila de la tabla `session`, que es la lista de refresh tokens vivos.
Cada login crea una: `user_id` dice de quién es, `refresh_token` guarda el token (la columna
es única, y eso es lo que permite buscarlo en O(1)), `expires_at` dice hasta cuándo vale y
`created_at` cuándo se emitió. Un usuario puede tener varias sesiones a la vez —el celular y
la notebook—, y cada logout borra la suya.

### 07.4 `src/modules/auth/domain/auth.interface.ts` — el contrato del repositorio

Un **repositorio** es la pieza que traduce entre el mundo del negocio ("buscame el usuario
por email") y el mundo del almacenamiento ("SELECT ... WHERE email = ..."). En este proyecto
se declara como una **interface**: primero el contrato, después la implementación.

```typescript
import type { IUserWithRole, ISessionEntity } from "./auth.entities"

export interface IAuthRepository {
  findUserByEmail(email: string): Promise<IUserWithRole | null>
  findUserById(id: string): Promise<IUserWithRole | null>
  createSession(userId: string, refreshToken: string, expiresAt: Date): Promise<ISessionEntity>
  findSessionByToken(refreshToken: string): Promise<ISessionEntity | null>
  deleteSession(refreshToken: string): Promise<void>
}
```

Cinco métodos, que son **exactamente** las cinco operaciones que el service necesita; ni una
más. Leelo como una lista de necesidades del negocio:

- `findUserByEmail` — para el login: dado un email, devolveme el usuario o `null`.
- `findUserById` — para el refresh y el `me`: dado un id, devolveme el usuario o `null`.
- `createSession` — guardar un refresh token con su vencimiento y devolver la fila creada.
- `findSessionByToken` — buscar la sesión de un refresh token, para saber si sigue viva.
- `deleteSession` — borrarla, que es lo que hace el logout.

Los `Promise<...>` dicen que todos son asíncronos (hablan con la base, que tarda). Los
`| null` son parte del contrato: "no encontré nada" es un resultado válido y esperado, no una
excepción. Y eso obliga a quien llama a decidir qué hacer con el `null`, que es justo lo que
hace el service lanzando `UnauthorizedError`.

La razón de existir de este archivo es la **inversión de dependencias**, que suena grande y
es simple: el service depende de esta interface, no de Prisma. Prisma es un detalle de
infraestructura; si mañana lo cambiás por otro ORM, el service no se entera. Y en los tests
pasa lo más útil: se le inyecta un objeto que cumple la interface con datos inventados
—un *fake*— y el service se prueba entero, sin base de datos.

### 07.5 `src/modules/auth/application/common/crypto.utils.ts` — bcrypt: hash y comparación

Dos funciones y una constante. Es el archivo más corto del módulo y uno de los más
importantes: acá se decide cómo se guardan las contraseñas.

```typescript
import bcrypt from "bcrypt"

const SALT_ROUNDS = 10

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

- **`import bcrypt from "bcrypt"`** — la librería de bcrypt, que expone `hash` y `compare`.
  La implementación nativa hace el cálculo en C, más rápido que JavaScript puro.
- **`const SALT_ROUNDS = 10`** — el costo. "10" no son diez salts: son $2^{10} = 1024$
  iteraciones del algoritmo interno, y cada dos rondas que subís **duplicás** el tiempo de
  cálculo. 10 es el valor de compromiso: unos 60 a 100 ms en hardware normal, suficiente para
  que un atacante con la base robada no pueda probar millones de contraseñas por segundo, y
  suficientemente rápido para que un login no se sienta lento. La constante está arriba y
  con nombre para que se cambie en un solo lugar.
- **`hashPassword(password)`** — devuelve una `Promise<string>` porque bcrypt es asíncrono (y
  debería serlo: bloquear el hilo 100 ms por login sería fatal bajo carga). El string que
  devuelve **contiene** el algoritmo, el costo y el salt, todo empaquetado:
  `$2b$10$N9qo8uLOickgx2ZMRZoMye...`. Por eso no hay una columna `salt` en la base: viaja
  adentro del hash.
- **`comparePassword(password, hash)`** — recibe la contraseña en texto plano (la que acaba
  de llegar del formulario, que existe solo en memoria) y el hash guardado, y devuelve
  `true`/`false`. Extrae el salt del hash, recalcula y compara. La comparación es de tiempo
  constante: bcrypt no corta en el primer byte distinto, así que un atacante no puede medir
  cuántos caracteres acertó por el tiempo de respuesta (eso es un *timing attack*).

La regla, otra vez: la contraseña en texto plano nunca se guarda ni se loggea. Solo se usa
como argumento de estas dos funciones y se descarta.

### 07.6 `src/modules/auth/application/common/token.utils.ts` — firma y verificación de JWT

Cuatro funciones, dos para firmar y dos para verificar. La simetría es el punto: cada tipo de
token tiene su par y su secreto.

```typescript
import jwt from "jsonwebtoken"
import { env } from "@/config/env"
import type { AuthTokenPayload, RefreshTokenPayload } from "@/types/auth"
```

Los imports: la librería `jsonwebtoken` (el `jwt` de todo el archivo), el objeto `env` con los
secretos y las duraciones que vienen del `.env`, y los dos tipos de payload del archivo 07.1.
Fijate que `AuthTokenPayload` y `RefreshTokenPayload` se importan con `import type`: son
tipos, no existen en runtime.

```typescript
export function generateAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] })
}

export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"] })
}
```

- **`jwt.sign(payload, secreto, opciones)`** — arma el token: codifica el payload, lo firma
  con el secreto y le agrega el `exp` calculado a partir de `expiresIn`. Devuelve el string de
  tres partes. Es síncrono, porque firmar es rápido (a diferencia de hashear una contraseña).
- **`env.JWT_SECRET`** vs **`env.JWT_REFRESH_SECRET`** — secretos **distintos**. Es la
  decisión que evita el ataque clásico: si ambos usaran el mismo secreto, un refresh token
  podría usarse como access token (tiene la firma correcta) y se saltearía la verificación de
  sesión. Con secretos separados, cada token solo vale para lo suyo.
- **`env.JWT_EXPIRES_IN`** — la duración, como `"15m"` o `"7d"`, leída del entorno. Está
  afuera del código para poder tener 15 minutos en producción y una hora en desarrollo sin
  recompilar nada.
- **`as jwt.SignOptions["expiresIn"]`** — un *cast*: le decís al compilador "confiá en mí,
  este string es válido". La razón es que `jsonwebtoken` tipa `expiresIn` como un conjunto
  cerrado de strings con formato (`"15m"`, `"2h"`, `"7d"`…), y un valor que viene de
  `process.env` es, para TypeScript, un `string` cualquiera. La librería no puede saber en
  tiempo de compilación que tu `.env` dice `"15m"`; el cast es la forma de pasar ese dato con
  la verificación de que existe, hecha por el archivo `env` en el arranque.

```typescript
export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload
}
```

- **`jwt.verify(token, secreto)`** — recalcula la firma con el secreto y la compara con la que
  trae el token; además controla el `exp`. Si algo no cierra, **lanza** una excepción
  (`TokenExpiredError` si venció, `JsonWebTokenError` si la firma es inválida o el token está
  deformado). No devuelve `null`: lanza. Por eso quien llama tiene que envolverlo en
  `try`/`catch`, como hacen el guard y el service.
- **`as AuthTokenPayload`** — `jwt.verify` devuelve `string | JwtPayload`, un tipo amplio
  porque la librería no conoce tus interfaces. El cast afirma "esto tiene la forma que
  declaramos". Es una promesa que hay que sostener del otro lado: el token se firmó con
  `generateAccessToken`, que exige exactamente ese payload.

La regla de oro del par: **el access token se verifica sin base de datos; el refresh token
siempre se verifica contra la base**. La firma prueba que el token lo emitimos nosotros; la
fila en `session` prueba que sigue vigente.

### 07.7 `src/modules/auth/application/common/cookie.utils.ts` — cookies `httpOnly` para los tokens

Este archivo decide **cómo viajan** los tokens hasta el navegador. Son dos helpers y un objeto
de opciones compartido, porque los atributos de una cookie son la parte donde un error se paga
caro y conviene no repetirlos.

```typescript
import type { FastifyReply } from "fastify"
import { env } from "@/config/env"

const isProduction = env.NODE_ENV === "production"
const ACCESS_COOKIE_MAX_AGE = 15 * 60
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60

const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "strict" : "lax",
  path: "/",
} as const
```

- **`const isProduction = env.NODE_ENV === "production"`** — se calcula **una vez**, cuando el
  módulo se carga, y no dentro de las funciones. El entorno no cambia mientras el proceso
  vive, así que calcularlo en cada respuesta sería trabajo repetido.
- **`ACCESS_COOKIE_MAX_AGE = 15 * 60`** y **`REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60`** — las
  duraciones **en segundos**, que es la unidad de `maxAge` en las cookies: 900 segundos (15
  minutos) y 604 800 segundos (7 días). Están escritas como multiplicaciones para que se lea
  la intención: 15 minutos, 7 días.
- **`httpOnly: true`** — la cookie no es accesible desde `document.cookie`. Es la defensa
  contra XSS: aunque inyecten un script, no puede leer el token.
- **`secure: isProduction`** — en producción la cookie **solo** viaja por HTTPS, así que un
  intento de bajarla a HTTP la deja afuera. En desarrollo queda en `false` porque trabajás
  sobre `http://localhost` y el navegador descartaría la cookie.
- **`sameSite: isProduction ? "strict" : "lax"`** — `sameSite` responde a la pregunta "¿mando
  esta cookie cuando la petición la originó otro sitio?". `strict` la manda solo si el sitio
  de origen es el mismo: máxima defensa contra CSRF, y como efecto secundario el usuario que
  llega desde un link externo aparece deslogueado hasta que navega dentro del sitio. `lax` es
  el intermedio: la manda en navegación de nivel superior (hacer clic en un link) pero no en
  peticiones de terceros; es lo que se usa en desarrollo para no pelear con `localhost` y con
  Postman.
- **`path: "/"`** — la cookie vale para todo el sitio, no solo para `/auth`. Si fuera
  `path: "/auth"`, el navegador no la mandaría en `/products` y el guard no tendría token.
- **`as const`** — congela los valores como literales (`true`, no `boolean`) y hace que el
  objeto sea `readonly`, así nadie lo modifica por accidente al pasarlo con spread.

Con la base lista, las dos funciones:

```typescript
export function setAuthCookies(reply: FastifyReply, accessToken: string, refreshToken: string) {
  reply.setCookie("access_token", accessToken, { ...baseCookieOptions, maxAge: ACCESS_COOKIE_MAX_AGE })
  reply.setCookie("refresh_token", refreshToken, { ...baseCookieOptions, maxAge: REFRESH_COOKIE_MAX_AGE })
}

export function clearAuthCookies(reply: FastifyReply) {
  reply.clearCookie("access_token", { ...baseCookieOptions })
  reply.clearCookie("refresh_token", { ...baseCookieOptions })
}
```

- **`setAuthCookies(reply, accessToken, refreshToken)`** — escribe dos cabeceras `Set-Cookie`
  en la respuesta. `reply.setCookie(nombre, valor, opciones)` es lo que aporta el plugin
  `@fastify/cookie` que registramos en `app.ts`: sin él, este método no existiría.
- **`{ ...baseCookieOptions, maxAge: ... }`** — el spread copia los cuatro atributos comunes
  y **agrega** `maxAge`, que es lo único que difiere entre las dos cookies. `maxAge` es la
  vida de la cookie en el navegador; cuando se cumple, el navegador la borra y deja de
  mandarla. Sin `maxAge`, la cookie sería de sesión y moriría al cerrar el navegador, lo cual
  arruinaría la idea de "no vuelvas a escribir la contraseña por siete días".
- **`clearAuthCookies(reply)`** — para el logout: `clearCookie` manda la cookie con valor
  vacío y `maxAge` en cero, y con eso el navegador la elimina. Los atributos tienen que
  coincidir con los del `setCookie` (`httpOnly`, `secure`, `sameSite`, `path`), y por eso se
  pasan los mismos `baseCookieOptions`: una cookie "borrada" con otros atributos puede quedar
  viva, porque para el navegador son cookies distintas. Ese es el bug clásico de logout que
  "no cierra la sesión".

Estos dos helpers los usa **solo** el controlador de auth. Nadie más en el proyecto toca las
cookies de sesión, y eso hace que haya un único lugar donde revisar cómo se emiten.

### 07.8 `src/modules/auth/application/common/auth.guard.ts` — `authGuard` y `adminGuard`

Acá se convierte "tener un token" en "estar autenticado". El archivo tiene tres piezas: un
helper que busca y valida el token, un guard que autentica y un guard que autoriza.

```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { UnauthorizedError, ForbiddenError } from "@/core/errors/AppError"
import { verifyAccessToken } from "./token.utils"

export function getAuthResultFromRequest(request: FastifyRequest) {
  const cookieToken = request.cookies.access_token
  const authHeader = request.headers.authorization
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined
  const token = cookieToken ?? bearerToken
  if (!token) {
    return null
  }
  try {
    return verifyAccessToken(token)
  } catch {
    return null
  }
}
```

- **`getAuthResultFromRequest(request)`** — busca el token en **dos lugares** y devuelve el
  payload verificado, o `null` si no hay token válido.
- **`const cookieToken = request.cookies.access_token`** — primero la cookie, que es el camino
  del navegador. `request.cookies` existe porque el plugin `cookie` está registrado.
- **`const authHeader = request.headers.authorization`** — segundo, la cabecera
  `Authorization`. Es el camino de los clientes que no manejan cookies: `curl`, Postman, los
  archivos `.http` del capítulo 15, o una app móvil.
- **`authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined`** — el esquema
  estándar es `Authorization: Bearer <token>`. El `?.` evita explotar si la cabecera no vino;
  `startsWith("Bearer ")` verifica el prefijo (`"Bearer "` mide 7 caracteres, de ahí el
  `slice(7)` que corta y deja solo el token). Si el prefijo no está, se descarta: no se acepta
  cualquier cosa en esa cabecera.
- **`const token = cookieToken ?? bearerToken`** — la cookie gana; la cabecera es el respaldo.
  La prioridad importa poco en la práctica, pero tenerla definida evita sorpresas cuando un
  cliente manda las dos cosas.
- **`if (!token) return null`** — sin token no hay nada que verificar. `null` significa "no
  autenticado", y es un resultado, no un error: este helper también se usa para *mirar* si hay
  sesión sin romper nada.
- **`try { return verifyAccessToken(token) } catch { return null }`** — `verify` lanza si el
  token venció o la firma no cierra, y acá esas dos situaciones se traducen a lo mismo: no hay
  sesión válida. El `catch` sin parámetro es válido en TypeScript moderno y deja claro que el
  error no se usa. La decisión de devolver `null` (y no lanzar) es lo que permite que este
  helper sirva tanto al guard —que sí lanza un 401— como a código que solo quiere saber si hay
  usuario.

Y los dos guards:

```typescript
export async function authGuard(request: FastifyRequest, _reply: FastifyReply) {
  const payload = getAuthResultFromRequest(request)
  if (!payload) {
    throw new UnauthorizedError("Authentication required")
  }
  request.userId = payload.userId
  request.userEmail = payload.email
  request.userRole = payload.role
}

export async function adminGuard(request: FastifyRequest, _reply: FastifyReply) {
  if (request.userRole !== "admin") {
    throw new ForbiddenError("Admin access required")
  }
}
```

- **La firma `(request, _reply)`** — un `preHandler` de Fastify recibe request, reply y un
  `done` opcional. Como acá no se toca la reply, el parámetro se declara `_reply`: es la
  convención para decir "existe por la firma, no lo uso", y algunos linters no se quejan de los
  parámetros con guion bajo. El `async` hace que Fastify espere la promesa y atrape lo que se
  lance.
- **`authGuard`** — llama al helper. Si no hay payload, lanza `UnauthorizedError`, que el
  `errorHandler` del capítulo 05 convierte en `401 { code: "UNAUTHORIZED", message:
  "Authentication required" }`. Si hay payload, **escribe los tres campos en la request** y
  termina sin responder nada. No devolver nada es la señal de "seguí adelante": el handler se
  ejecuta.
- **`request.userId = ...` y compañía** — es exactamente lo que declara el `fastify.d.ts` del
  archivo 07.2. El guard escribe, los controladores leen.
- **`adminGuard`** — mira `request.userRole`, que ya está puesto por `authGuard`, y lanza
  `ForbiddenError` (`403`) si no es `"admin"`. Fijate la diferencia de códigos y por qué
  importa: `401` es "no sé quién sos" y `403` es "sé quién sos y no podés". Un cliente que
  recibe 401 sabe que tiene que loguearse; uno que recibe 403 sabe que loguearse no lo va a
  ayudar.
- **El orden es obligatorio.** `adminGuard` **depende** de que `authGuard` haya corrido antes,
  porque lee `request.userRole`. Si los pusieras al revés, `userRole` sería `undefined`, la
  comparación con `"admin"` daría `false` y todas las rutas de admin responderían 403 incluso
  para un admin. Los `preHandler` de un mismo array corren en orden, y ese orden es el que
  hace que la cadena funcione.

Por eso en las rutas vas a ver dos formas: `{ preHandler: [authGuard] }` protege (hay que
estar logueado) y `{ preHandler: [authGuard, adminGuard] }` protege y restringe (hay que ser
admin).

### 07.9 `src/modules/auth/application/auth.service.ts` — reglas de negocio de autenticación

El service es donde vive la lógica: qué se chequea, en qué orden, y qué error se lanza. Es el
archivo que hay que entender de verdad, porque es el que define las reglas de la sesión.

Antes del código, las dos palabras nuevas:

- **Factory** (fábrica) es una función que **crea y devuelve** un objeto, en lugar de usar
  `new` sobre una clase. Acá la fábrica es `createAuthService(repository)`, y devuelve un
  objeto con cuatro métodos.
- **Inyección de dependencias** es pasarle a una pieza lo que necesita desde afuera, en lugar
  de que lo construya ella misma. El service **recibe** el repositorio como argumento: no
  hace `import { prisma }` adentro. Esa es toda la idea, y es lo que permite probarlo con un
  repositorio falso.

```typescript
import { UnauthorizedError } from "@/core/errors/AppError"
import type { IAuthRepository } from "../domain/auth.interface"
import { comparePassword } from "./common/crypto.utils"
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "./common/token.utils"

const REFRESH_TOKEN_DURATION_MS = 7 * 24 * 60 * 60 * 1000

export const createAuthService = (repository: IAuthRepository) => ({
  async login(email: string, password: string) {
    const user = await repository.findUserByEmail(email)
    if (!user || user.deleted_at || !user.is_active) {
      throw new UnauthorizedError("Invalid credentials")
    }

    const passwordMatch = await comparePassword(password, user.password_hash)
    if (!passwordMatch) {
      throw new UnauthorizedError("Invalid credentials")
    }

    const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role.name })
    const refreshToken = generateRefreshToken({ userId: user.id })
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DURATION_MS)
    await repository.createSession(user.id, refreshToken, expiresAt)

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
      },
    }
  },
```

- **Los imports** — el error de negocio, el **tipo** del repositorio (con `import type`: solo
  se usa en la firma), las dos funciones de bcrypt y las tres de token. Nada de Prisma, nada
  de Fastify: el service no sabe que existe un servidor HTTP ni una base concreta. Eso es lo
  que lo hace testeable.
- **`REFRESH_TOKEN_DURATION_MS = 7 * 24 * 60 * 60 * 1000`** — siete días **en milisegundos**
  (el `* 1000` del final). Es la duración del refresh token a nivel **base de datos**, la que
  se guarda en `expires_at`. Es un valor distinto del `maxAge` de la cookie (que va en
  segundos) aunque represente lo mismo: uno le dice al navegador cuándo borrar la cookie, el
  otro le dice al servidor hasta cuándo aceptar la sesión.
- **`export const createAuthService = (repository: IAuthRepository) => ({ ... })`** — la
  fábrica: recibe el repositorio (tipado con la interface del archivo 07.4) y devuelve un
  objeto literal con cuatro métodos. Los paréntesis alrededor de `({ ... })` son necesarios:
  sin ellos, las llaves se leerían como el cuerpo de una función y no como un objeto.
- **`async login(email, password)`** — `async` porque adentro hay `await`. Todo lo que
  devuelve una función `async` es una `Promise`, así el controlador tiene que esperarla.

Dentro de `login`, en orden:

1. **`const user = await repository.findUserByEmail(email)`** — una sola consulta, por email.
2. **`if (!user || user.deleted_at || !user.is_active)`** — tres casos en un solo `if`: no
   existe, está borrado (soft delete) o está desactivado. Los tres lanzan el **mismo**
   `UnauthorizedError("Invalid credentials")`. Unificar los mensajes es una decisión de
   seguridad, no de comodidad: mensajes distintos le dicen a un atacante qué emails existen y
   cuáles están activos.
3. **`const passwordMatch = await comparePassword(password, user.password_hash)`** — bcrypt
   contra el hash guardado. El `await` es real: tarda decenas de milisegundos a propósito.
4. **`if (!passwordMatch) throw new UnauthorizedError("Invalid credentials")`** — mismo
   mensaje que el paso 2. Desde afuera, "no existe ese email" y "la contraseña está mal" son
   indistinguibles.
5. **`const accessToken = generateAccessToken({ userId, email, role })`** — firma el access
   token con los tres datos. `user.role.name` es el nombre del rol, no el id: el guard compara
   contra `"admin"`, que es un nombre legible.
6. **`const refreshToken = generateRefreshToken({ userId: user.id })`** — el refresh lleva
   solo el id, como se explicó en 07.1.
7. **`const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DURATION_MS)`** — la fecha de
   vencimiento **calculada en el servidor**. `Date.now()` da milisegundos desde 1970; sumarle
   siete días en milisegundos y envolverlo en `new Date(...)` da el instante exacto.
8. **`await repository.createSession(user.id, refreshToken, expiresAt)`** — persiste la
   sesión. A partir de esta línea el refresh token es revocable: existe una fila que se puede
   borrar.
9. **`return { accessToken, refreshToken, user: { ... } }`** — devuelve los dos tokens (para
   que el controlador los ponga en cookies) y el perfil. Fijate que el perfil **no incluye**
   `password_hash` ni `is_active` ni `deleted_at`: sale de acá ya filtrado, con los cuatro
   campos que el frontend necesita.

Y el resto del service:

```typescript
  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token is required")
    }

    let payload
    try {
      payload = verifyRefreshToken(refreshToken)
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token")
    }

    const session = await repository.findSessionByToken(refreshToken)
    if (!session || session.expires_at < new Date()) {
      throw new UnauthorizedError("Invalid or expired refresh token")
    }

    const user = await repository.findUserById(payload.userId)
    if (!user || user.deleted_at || !user.is_active) {
      throw new UnauthorizedError("User not found")
    }

    const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role.name })
    return { accessToken }
  },
```

`refresh` es el método más defensivo del módulo, y con razón: es la puerta por la que se
renueva una sesión, y si es demasiado permisiva, un token robado se renueva para siempre.
Tiene **cuatro controles** y los cuatro tienen que pasar:

1. **`if (!refreshToken)`** — si no llegó nada, 401 con "Refresh token is required".
2. **`try { payload = verifyRefreshToken(refreshToken) } catch { ... }`** — verifica la firma
   y el vencimiento del JWT. Si el token fue fabricado o ya expiró, `verify` lanza y se
   traduce a 401. Fijate el detalle: `let payload` se declara afuera del `try` y se asigna
   adentro, para poder usarlo después. Si lo declararas con `const` adentro del `try`, no
   existiría afuera.
3. **`const session = await repository.findSessionByToken(refreshToken)` y
   `if (!session || session.expires_at < new Date())`** — el control que la firma **no** puede
   dar. La firma dice "este token lo emitimos nosotros"; esta consulta dice "y todavía no lo
   revocamos". Si el usuario hizo logout, la fila no está y el refresh falla aunque la firma
   sea perfecta. La comparación `session.expires_at < new Date()` es redundante con el `exp`
   del JWT pero barata: cubre el caso de una fecha desincronizada o de una fila que se guardó
   con otro vencimiento.
4. **`const user = await repository.findUserById(payload.userId)` y el `if` de siempre** — el
   usuario tiene que seguir existiendo, activo y no borrado. Es el control que permite
   desactivar a alguien y que su sesión se corte en la próxima renovación.

Recién ahí **`generateAccessToken(...)`** con los datos **frescos** de la base: por eso el rol
que se firma es el actual y no el de hace siete días. Devuelve **solo** el access token: el
refresh no se renueva, sigue el mismo hasta su vencimiento. (Eso se llama refresh *sliding* o
no; acá es fijo, y es más simple de razonar.)

```typescript
  async logout(refreshToken?: string) {
    if (refreshToken) {
      await repository.deleteSession(refreshToken)
    }
  },

  async me(userId: string) {
    const user = await repository.findUserById(userId)
    if (!user || user.deleted_at) {
      throw new UnauthorizedError("User not found")
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
    }
  },
})
```

- **`async logout(refreshToken?: string)`** — el `?` marca el parámetro como opcional: si no
  vino refresh token, el service no hace nada y **no falla**. Eso importa porque el
  controlador limpia las cookies igual, así que un logout sin sesión deja al usuario en el
  mismo estado que uno con sesión: deslogueado. Ojo con la diferencia entre "sin token" y
  "token de una sesión que ya no existe": el segundo caso no lo cubre este `if`, y ahí el
  repositorio sí puede fallar (lo ves en 07.10).
- **`await repository.deleteSession(refreshToken)`** — borra la fila. Con eso el refresh queda
  inutilizable aunque alguien lo tenga guardado. El access token, como ya sabés, sigue vivo
  hasta que vence; eso es el intercambio del que hablamos al principio.
- **`async me(userId: string)`** — devuelve el perfil del usuario autenticado. El `userId`
  **no** viene del body ni de un parámetro de la URL: viene de `request.userId`, que puso el
  guard después de verificar el token. Por eso no se puede pedir el perfil de otro: no hay
  forma de decir otro id.
- **`if (!user || user.deleted_at)`** — acá se chequea que no esté borrado, pero **no** que
  esté activo, a diferencia de `refresh` y `login`. Es una asimetría real del código: un
  usuario desactivado con un access token todavía válido puede leer su propio perfil hasta
  que el token venza. No es grave (solo ve sus datos, y a los 15 minutos el refresh lo deja
  afuera), pero conviene saberlo si alguna vez el requisito cambia.
- **`})`** — cierra el objeto que devuelve la fábrica. Todo lo que está adentro de las llaves
  es el service; lo que está afuera, no.

### 07.10 `src/modules/auth/infrastructure/auth.prisma.repository.ts` — implementación Prisma del contrato

Hasta acá todo era contrato y reglas. Este archivo es el que habla con PostgreSQL. **Prisma**
es el ORM del proyecto: una librería que traduce objetos de JavaScript a SQL, con un cliente
generado a partir de `schema.prisma` que sabe, en tiempo de compilación, qué tablas y columnas
existen. Si escribís `prisma.user.findFirst({ where: { emial: "x" } })`, el error aparece al
compilar y no en producción.

```typescript
import { Prisma } from "@prisma/client"
import { prisma } from "@/config/prisma"
import type { IAuthRepository } from "../domain/auth.interface"

const userSelect = {
  id: true,
  name: true,
  email: true,
  password_hash: true,
  role: { select: { id: true, name: true } },
  is_active: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
} as const
```

- **`import { Prisma } from "@prisma/client"`** — el espacio de nombres generado por Prisma.
  Acá se importa para tener los tipos de error a mano cuando haga falta (los famosos `P2002` y
  `P2003`).
- **`import { prisma } from "@/config/prisma"`** — la **instancia única** del cliente. Vive en
  `src/config/prisma.ts` y es una sola para todo el proceso: abrir una conexión por consulta
  sería carísimo. Que se importe desde la configuración y no se cree acá es lo que permite que
  el proceso la cierre ordenadamente en el apagado.
- **`userSelect`** — la lista de columnas que se piden. En Prisma, `select` es una
  **proyección**: si no la pasás, trae todas las columnas; si la pasás, trae exactamente esas.
  Acá se piden los nueve campos que necesita `IUserWithRole`, y `role: { select: { id, name }
  }` pide la relación anidada con **sus** dos columnas. Traer menos datos es más rápido, mueve
  menos bytes y —lo más importante— hace imposible que se te escape una columna nueva sin
  querer. El `as const` hace que los `true` sean literales y que el tipo inferido sea preciso.
- **`password_hash: true`** — sí, se pide. Es necesario para comparar la contraseña en el
  login. Que esté en el `select` no significa que salga en una respuesta: el service filtra
  antes de devolver.

Y la implementación del contrato:

```typescript
export const AuthRepository: IAuthRepository = {
  async findUserByEmail(email) {
    return prisma.user.findFirst({ where: { email }, select: userSelect })
  },

  async findUserById(id) {
    return prisma.user.findFirst({ where: { id }, select: userSelect })
  },

  async createSession(userId, refreshToken, expiresAt) {
    return prisma.session.create({
      data: { user_id: userId, refresh_token: refreshToken, expires_at: expiresAt },
    })
  },

  async findSessionByToken(refreshToken) {
    return prisma.session.findUnique({ where: { refresh_token: refreshToken } })
  },

  async deleteSession(refreshToken) {
    await prisma.session.delete({ where: { refresh_token: refreshToken } })
  },
}
```

- **`export const AuthRepository: IAuthRepository = { ... }`** — la anotación de tipo es el
  corazón del archivo. Al declarar que este objeto **es** un `IAuthRepository`, TypeScript
  verifica que cumpla los cinco métodos con las firmas exactas. Si te olvidás uno o cambiás un
  parámetro, el error es de compilación. Y fijate que los métodos no repiten los tipos: se
  infieren del contrato.
- **`findUserByEmail` / `findUserById`** — usan `findFirst`, que devuelve la primera fila que
  matchea o `null`. (`findUnique` sería más estricto y solo acepta campos `@unique`; con
  `findFirst` el código queda igual de legible y acepta filtros extra el día que hagan falta.)
  `where` es el filtro y `select` la proyección de arriba.
- **`createSession`** — `create` inserta una fila y devuelve la creada, que es lo que promete
  el contrato (`Promise<ISessionEntity>`). Los nombres del `data` son los de las columnas
  (`user_id`, `refresh_token`, `expires_at`), en `snake_case`, tal como están en el schema.
- **`findSessionByToken`** — acá sí `findUnique`, porque `refresh_token` es único en el
  schema. Buscar por un campo único es la consulta más rápida que hay: el motor la resuelve
  por índice. Si el token no existe, devuelve `null` (no lanza).
- **`deleteSession`** — borra la fila y no devuelve nada (`Promise<void>`). Ojo con un
  detalle: `prisma.session.delete` **lanza `P2025`** ("record to delete does not exist") si la
  fila no está. En el flujo normal no pasa, porque el logout borra una sesión que existe; pero
  si alguien llama a logout dos veces con el mismo token, o el refresh ya venció y la fila se
  limpió, el segundo intento puede terminar en un `500`. `deleteMany` (que devuelve cuántas
  borró y no falla si son cero) sería más tolerante; el código, tal como está, asume una
  sesión viva.

Los dos códigos de error de Prisma que vas a ver en los repositorios de los próximos
capítulos: **`P2002`** es "unique constraint failed" (estás insertando un valor que ya existe
en una columna única, como un barcode repetido) y **`P2003`** es "foreign key constraint
failed" (estás referenciando una fila que no existe, o borrando una que otras filas usan). Se
atrapan y se traducen a `ConflictError`. En auth no hace falta: aquí no hay reglas de unicidad
de negocio, la única columna única es el refresh token, que se genera aleatorio.

### 07.11 `src/modules/auth/presentation/auth.dto.ts` — validación de entrada con Zod

Un **DTO** (*Data Transfer Object*) es el objeto que describe qué datos entran o salen por un
borde del sistema. Acá el borde es HTTP, y el DTO responde una pregunta: ¿este body tiene la
forma que esperamos? **Zod** es la librería que valida eso: escribís un schema en TypeScript,
Zod valida en runtime y de paso **deriva el tipo**.

```typescript
import { z } from "zod"

export const LoginDtoSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
})

export const RefreshTokenDtoSchema = z.object({
  refresh_token: z.string().min(1, "Refresh token is required"),
})

export type LoginDto = z.infer<typeof LoginDtoSchema>
export type RefreshTokenDto = z.infer<typeof RefreshTokenDtoSchema>
```

- **`z.object({ ... })`** — un schema de objeto. Cada clave declara su validación. Por defecto,
  Zod **descarta** las claves que no están declaradas (el modo `strip`) y exige las que sí:
  un body con `{ email, password, isAdmin: true }` entra al service **sin** `isAdmin`, y eso
  evita el clásico *mass assignment*, donde un cliente manda un campo de más y el servidor lo
  usa. Si quisieras que la clave desconocida fuera un error, se agrega `.strict()` al schema.
- **`z.string().email("Invalid email format")`** — primero el tipo (`string`), después la
  regla (`email`), y el argumento es el mensaje que va a salir cuando falle, en lugar del
  mensaje genérico de la librería. Ese texto es el que después `formatZodIssueMessage` prefija
  con el nombre del campo.
- **`z.string().min(1, "Password is required")`** — `min(1)` significa "al menos un carácter":
  rechaza el string vacío y el campo ausente. No se valida longitud mínima de contraseña acá
  porque esta es la ruta de **login**: la contraseña ya existe y la regla se aplicó al
  crearla. Poner un mínimo acá solo lograría que alguien con una contraseña vieja y corta no
  pueda entrar.
- **`RefreshTokenDtoSchema`** — un objeto con un solo campo. Podría parecer de más, pero
  mantiene la simetría: todo body que entra pasa por un schema, y el controller nunca lee
  `request.body.algo` sin validar.
- **`export type LoginDto = z.infer<typeof LoginDtoSchema>`** — la parte más linda de Zod.
  `z.infer` **deriva** el tipo TypeScript del schema: `{ email: string; password: string }`.
  Escribís la validación una vez y el tipo sale de ahí, así que no pueden desincronizarse. Si
  mañana agregás `remember_me: z.boolean().optional()`, el tipo cambia solo.

Dónde se usan: en el controlador, como **primer filtro**, antes de tocar el service. Un body
inválido nunca llega a la lógica de negocio.

### 07.12 `src/modules/auth/presentation/auth.controller.ts` — controlador HTTP

El controlador es la capa más fina del módulo y la que más se repite en el proyecto, siempre
con los mismos tres pasos: **parsear** la entrada, **llamar** al service, **responder**. No
tiene reglas de negocio y no atrapa errores: los deja subir al `errorHandler`.

```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { createAuthService } from "../application/auth.service"
import { AuthRepository } from "../infrastructure/auth.prisma.repository"
import { LoginDtoSchema, RefreshTokenDtoSchema } from "./auth.dto"
import { clearAuthCookies, setAuthCookies } from "../application/common/cookie.utils"

const authService = createAuthService(AuthRepository)
```

- **Los imports** — tipos de Fastify (solo tipos), la fábrica del service, el repositorio
  concreto de Prisma, los schemas de Zod y los dos helpers de cookies. Fijate la dirección de
  las dependencias: el controlador conoce al service **y** al repositorio, porque es el punto
  donde se conectan.
- **`const authService = createAuthService(AuthRepository)`** — acá se hace la **composición**:
  se le inyecta al service la implementación real del repositorio. Y se hace **una sola vez**,
  a nivel de módulo, no dentro de cada handler: el controlador es un objeto que se importa una
  vez y los cuatro métodos comparten la misma instancia. Crear el service en cada petición
  sería trabajo repetido sin ninguna ganancia (no guarda estado por request).

Los cuatro handlers:

```typescript
export const authController = {
  async login(request: FastifyRequest, reply: FastifyReply) {
    const body = LoginDtoSchema.parse(request.body)
    const result = await authService.login(body.email, body.password)
    setAuthCookies(reply, result.accessToken, result.refreshToken)
    return reply.status(200).send({ user: result.user })
  },

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    const body = RefreshTokenDtoSchema.parse(request.body)
    const result = await authService.refresh(body.refresh_token)
    return reply.status(200).send(result)
  },
```

- **`async login(request, reply)`** — un handler de Fastify recibe la request y la reply y
  devuelve la respuesta. `async` porque adentro hay `await`.
- **`LoginDtoSchema.parse(request.body)`** — parsea y valida en un solo paso. Si el body no
  cumple, `parse` lanza `ZodError`, que sube al `errorHandler` y se convierte en el `400
  BAD_REQUEST` del capítulo 05. Si cumple, `body` es un `LoginDto` **tipado**: `body.email` y
  `body.password` existen y son strings.
- **`await authService.login(body.email, body.password)`** — el controlador no decide nada:
  pasa los datos ya validados. Toda la lógica (usuario inexistente, contraseña mal, sesión,
  tokens) está en el service.
- **`setAuthCookies(reply, result.accessToken, result.refreshToken)`** — escribe las dos
  cookies en la respuesta. A partir de acá el navegador las tiene.
- **`return reply.status(200).send({ user: result.user })`** — responde **solo el perfil**. Los
  tokens no van en el cuerpo: ya viajan en cookies, y exponerlos en el JSON anularía la
  ventaja de `httpOnly` (el frontend podría leerlos y guardarlos en cualquier lado). El
  `return` del `send` no es obligatorio, pero devolver la reply hace explícito que la cadena
  terminó ahí.
- **`refresh`** — mismo patrón: parsea el body, llama al service y devuelve `{ accessToken }`.
  Acá hay algo que conviene mirar con atención, porque es una inconsistencia real del código:
  el endpoint espera el refresh token **en el body**, y el refresh token también está en una
  cookie `httpOnly` que el JavaScript **no puede leer**. O sea: funciona perfecto desde
  `curl`, Postman o los archivos `.http` del capítulo 15 (ahí escribís el token a mano),
  pero un cliente que sea solo un navegador no puede armar ese body. La cookie viaja igual,
  sola, en la misma petición; leerla con `request.cookies.refresh_token` sería lo coherente
  con el resto del diseño. Dejo el aviso porque el día que conectes un frontend real te vas a
  chocar con esto, y la solución es una línea en el controller, no en el service.

Y los dos últimos:

```typescript
  async logout(request: FastifyRequest, reply: FastifyReply) {
    const refreshToken = request.cookies.refresh_token
    await authService.logout(refreshToken)
    clearAuthCookies(reply)
    return reply.status(200).send({ message: "Logged out successfully" })
  },

  async me(request: FastifyRequest, reply: FastifyReply) {
    const result = await authService.me(request.userId)
    return reply.status(200).send(result)
  },
}
```

- **`const refreshToken = request.cookies.refresh_token`** — el logout **sí** lee el token de
  la cookie, que es de donde el navegador lo manda solo. Si no hay cookie, es `undefined`, y
  el service lo acepta (el parámetro es opcional).
- **`await authService.logout(refreshToken)`** — borra la fila de `session` (si existe).
- **`clearAuthCookies(reply)`** — manda las dos cookies vacías para que el navegador las
  elimine. Se hace **siempre**, incluso si no había sesión: el objetivo es que el navegador
  quede limpio.
- **`return reply.status(200).send({ message: "Logged out successfully" })`** — un 200 con un
  mensaje. No se devuelve `204 No Content` para que el cliente tenga algo que mostrar y para
  mantener la forma de respuesta del resto de la API.
- **`me(request, reply)`** — `request.userId` lo puso `authGuard`, no el cliente. Por eso este
  handler no parsea ningún body: no hay nada que validar, la identidad ya está probada. Es el
  ejemplo más claro de para qué sirve el guard.
- **`}`** — cierra el objeto `authController`.

### 07.13 `src/modules/auth/presentation/auth.routes.ts` — rutas del módulo

El último archivo del módulo conecta los handlers con URLs y decide cuáles están protegidas.
Es el plugin que `registerRoutes` monta con el prefijo `/auth`.

```typescript
import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { authController } from "./auth.controller"
import { authGuard } from "../application/common/auth.guard"

export const authRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  fastify.post("/login", authController.login)
  fastify.post("/refresh", authController.refresh)
  fastify.post("/logout", authController.logout)
  fastify.get("/me", { preHandler: [authGuard] }, authController.me)
}
```

- **`import type { FastifyInstance, FastifyPluginOptions }`** — los dos tipos de la firma de un
  plugin. `FastifyInstance` es la instancia (acá, la instancia **con el prefijo ya aplicado**).
  `FastifyPluginOptions` es el objeto de opciones que `register` le pasa al plugin; en este
  caso no se usa, pero la firma lo pide.
- **`export const authRoutes = async (fastify, _opts) => { ... }`** — el plugin es una función
  asíncrona que no devuelve nada: su efecto es registrar rutas en la instancia que recibe. El
  `_opts` con guion bajo sigue la misma convención que en los guards: existe por la firma, no
  se usa.
- **`fastify.post("/login", authController.login)`** — el handler se pasa **sin invocarlo**.
  Esto es importante: `authController.login` es una referencia a la función; si escribieras
  `authController.login(request, reply)` la estarías ejecutando en el arranque, con argumentos
  inexistentes. Fastify la guarda y la llama cuando llegue la petición.
- **`fastify.get("/me", { preHandler: [authGuard] }, authController.me)`** — la única ruta con
  opciones: un array de `preHandler`. Antes de `me`, Fastify ejecuta `authGuard`; si el guard
  lanza, `me` no corre. El array permite encadenar guards en orden, que es lo que usan los
  módulos con `adminGuard`.
- **Las cuatro rutas, con el prefijo aplicado**: `POST /auth/login`, `POST /auth/refresh`,
  `POST /auth/logout` y `GET /auth/me`.

Qué devuelve cada una:

- **`POST /auth/login`** — body `{ email, password }`; responde `200` con `{ user }` y setea
  las dos cookies.
- **`POST /auth/refresh`** — body `{ refresh_token }`; responde `200` con `{ accessToken }`.
- **`POST /auth/logout`** — toma la cookie `refresh_token`; responde `200` con `{ message }` y
  limpia las cookies.
- **`GET /auth/me`** — requiere estar autenticado; responde `200` con el perfil.

Dos observaciones sobre el conjunto. La primera: **es el único módulo sin `adminGuard`**, y
tiene sentido. `login`, `refresh` y `logout` son públicos por definición —¿cómo te vas a
autenticar en una ruta que exige estar autenticado?—, y `me` solo pide un token válido de
cualquier rol, porque cada usuario tiene derecho a ver su propio perfil. La segunda: el
controlador de auth **no tiene ni un `try`/`catch`**. Los `UnauthorizedError` y
`ForbiddenError` salen del service y del guard, y el `errorHandler` global los serializa como
cualquier otro error. Nada de manejo ad-hoc: esa es la razón por la que el capítulo 05 fue
primero.

### Resumen

- Autenticar es probar quién sos (login, una vez) y autorizar es decidir qué podés hacer
  (guards, en cada petición). Son momentos y archivos distintos.
- La contraseña nunca se guarda: bcrypt le agrega un salt aleatorio (que viaja dentro del
  hash) y la hashea con 10 rondas, lento a propósito; `comparePassword` la verifica en tiempo
  constante. El login responde siempre "Invalid credentials" para no revelar qué emails
  existen.
- Un JWT está firmado, no encriptado: el access token dura 15 minutos y lleva `userId`,
  `email` y `role` (stateless, sin consultar la base); el refresh dura 7 días, solo lleva
  `userId` y **siempre** se valida contra la fila de `session`, que es lo que lo hace
  revocable. Se firman con secretos distintos.
- Los tokens viajan en cookies `httpOnly` (inmunes a XSS), `secure` en producción y
  `sameSite` como defensa contra CSRF. El frontend nunca los lee ni los manda a mano.
- `authGuard` (401) llena `request.userId/userEmail/userRole`, `adminGuard` (403) exige rol
  admin y siempre va después; el service es una fábrica que recibe el repositorio por
  inyección de dependencias, el controlador solo parsea, llama y responde.


## 08. Módulo roles — el patrón CRUD completo

El capítulo anterior te dejó un servidor que ya sabe quién sos: `authGuard` valida el token, `adminGuard` mira el rol y cada request autenticada llega al handler con `request.userId` cargado. Falta lo que el usuario ve: los datos. Un punto de venta tiene que poder crear roles, dar de alta empleados, cargar productos, consultar precios. Todo eso son las mismas cuatro operaciones repetidas sobre cosas distintas.

El módulo `roles` es el más chico de todos —un rol tiene un nombre y una descripción, nada más— y por eso lo elegimos como plantilla. Los módulos `users`, `products` y `services` se escriben con la misma estructura, los mismos nombres de archivo y el mismo orden de capas. Cuando termines este capítulo no vas a tener que aprender tres módulos más: vas a mirar qué cambia en cada uno y listo.

### Qué es un CRUD y cómo se traduce a HTTP

**CRUD** es la sigla de *Create, Read, Update, Delete*: las cuatro operaciones básicas sobre cualquier cosa que el sistema guarde. En una API esas operaciones no son funciones sueltas: son rutas HTTP. Y a la cosa que el sistema expone —un rol, un usuario, un producto— la llamamos **recurso**. Los recursos se nombran en plural dentro de la URL: `/roles`, `/users`, `/products`.

El mapeo entre CRUD y HTTP es siempre el mismo, y conviene memorizarlo porque lo vas a repetir en cada módulo:

| Operación | Verbo | Ruta | Status de éxito |
| --- | --- | --- | --- |
| Listar | `GET` | `/roles` | `200 OK` |
| Leer uno | `GET` | `/roles/:id` | `200 OK` |
| Crear | `POST` | `/roles` | `201 Created` |
| Actualizar | `PUT` | `/roles/:id` | `200 OK` |
| Borrar | `DELETE` | `/roles/:id` | `200 OK` |

Los verbos dicen la intención y no son intercambiables. `GET` lee y no cambia nada. `POST` crea: por eso la respuesta es `201 Created` y no `200`, porque además de "salió bien" está diciendo "nació algo nuevo". `PUT` reemplaza o actualiza un recurso existente. `PATCH` actualiza una parte (lo vas a ver en el toggle de usuarios, capítulo 09). `DELETE` borra.

Una **ruta** es el par verbo + camino, por ejemplo `POST /roles`. Un **endpoint** es esa ruta ya montada en el servidor y lista para responder. Y el `:id` de `/roles/:id` es un **parámetro de ruta**: un pedazo de la URL que cambia según el recurso. Fastify lo entrega en `request.params`, mientras que lo que viene después del `?` (como `?page=2`) se llama **query string** y llega en `request.query`. Son dos cosas distintas y por eso se validan distinto.

Los **status codes** son la segunda mitad del contrato. El cliente no lee tu código: lee el número. Los que aparecen en este capítulo son estos:

- `200 OK` — salió bien y hay cuerpo en la respuesta.
- `201 Created` — se creó el recurso; se devuelve lo creado.
- `400 Bad Request` — lo que mandaste no sirve (un body inválido, un id faltante).
- `401 Unauthorized` — falta autenticación: no sé quién sos.
- `403 Forbidden` — sé quién sos, pero no tenés permiso.
- `404 Not Found` — busqué ese id y no existe.
- `409 Conflict` — choca con una regla del negocio: el nombre ya existe, el rol está en uso.
- `500 Internal Server Error` — un bug. Nunca debería ser la respuesta de una regla de negocio.

Ahí está la diferencia más importante de todo el capítulo: un nombre de rol repetido **no es un error del servidor**. Es un conflicto entre lo que pediste y el estado del sistema, y el status correcto es `409`. Si tu código deja que eso termine en `500`, el cliente no puede distinguir "elegí otro nombre" de "el servidor se rompió". Todo lo que sigue está construido para que ese `409` salga solo.

### Las cuatro capas y el valor de cada una

Cada módulo del proyecto se parte en cuatro carpetas, y cada una contesta una pregunta distinta:

- **`domain/`** — ¿qué necesito? Las entidades (la forma de los datos), los tipos de respuesta y el contrato del repositorio. No sabe que existe Prisma ni que existe HTTP.
- **`application/`** — ¿cuáles son las reglas? El service decide qué se puede y qué no, y el mapper traduce de entidad a respuesta.
- **`infrastructure/`** — ¿cómo se guarda? La implementación concreta con Prisma y la traducción de sus errores a errores de negocio.
- **`presentation/`** — ¿cómo se habla HTTP? Los DTO de Zod, el controller y las rutas con sus guardias.

La separación no es decorativa. Si mañana cambia el ORM, se toca `infrastructure` y nada más. Si cambia una regla ("un rol no puede llamarse igual que otro"), se toca `application` y se prueba sin levantar el servidor. Si cambia la URL, se toca `presentation`. Cada capa tiene un motivo de cambio y ninguno se mezcla con el otro.

Antes de leer código, el vocabulario que vas a ver en las próximas nueve secciones. Vale la pena leerlo dos veces, porque cada palabra vuelve después:

- **Entidad** — la forma de una fila de la base tal como el dominio la necesita, con sus columnas internas (`created_at`, `deleted_at`). Es lo que sale del repositorio, no lo que ve el cliente.
- **Respuesta** — la forma exacta de lo que viaja al cliente. Es un tipo distinto de la entidad, a propósito.
- **Mapper** — la función que traduce entidad a respuesta. Es el único lugar donde se decide qué se publica.
- **DTO** (*Data Transfer Object*) — la forma de los datos que entran por la puerta HTTP. Se valida con Zod antes de tocar el service.
- **Envelope** — el "sobre" de una lista: en vez de devolver un array pelado, se devuelve `{ roles, total, page, limit }`. El cliente sabe cuántos hay en total sin pedir la lista completa.
- **Paginación** — traer la lista por partes (`page` y `limit`) en vez de todo junto. `skip` y `take` en Prisma son las piezas que la implementan.
- **Búsqueda** — un `search` opcional que filtra por texto. En la base se traduce a `contains` con `mode: "insensitive"` (sin distinguir mayúsculas).
- **Soft delete** — borrar sin borrar: se marca la fila con `deleted_at` y todos los listados la ignoran. El registro sigue en la base para no romper historiales ni referencias.
- **Unique constraint** — una regla que la base misma hace cumplir: "no puede haber dos filas con el mismo valor en esta columna". Es distinta de una validación en tu código: la base la cumple incluso si dos requests entran al mismo tiempo.
- **`P2002`** — el código que Prisma usa cuando se viola un unique constraint.
- **`P2003`** — el código que Prisma usa cuando se viola una clave foránea (apuntás a un id que no existe, o borrás algo que otro está usando).
- **`select`** — la lista explícita de columnas que querés de la base. Menos columnas, menos datos movidos y un tipo más preciso.
- **Inyección de dependencias** — el service no importa Prisma: recibe el repositorio como parámetro. Así en producción le pasás el real y en los tests un fake con la misma forma.
- **Factory** — una función que arma y devuelve un objeto ya conectado (`createRoleService(RoleRepository)`). Es la forma que usa este proyecto en vez de clases con `new`.
- **Guard por rol** — un `preHandler` que corta la request antes del handler. `authGuard` exige estar autenticado; `adminGuard` exige además rol `admin`.

Con eso, el recorrido completo de un `POST /roles` se lee así:

1. Fastify encuentra la ruta y corre `preHandler: [authGuard, adminGuard]`. Sin token → `401`; con token pero sin rol admin → `403`. El cuerpo todavía no se miró.
2. `rolesController.create` valida el body con `CreateRoleDtoSchema`. Si no cumple, Zod lanza y el `errorHandler` global responde `400`.
3. El controller llama a `roleService.create(body)`. El service pregunta al repositorio si ya existe un rol con ese nombre; si existe, lanza `ConflictError` → `409`.
4. El repositorio inserta con Prisma. Si a pesar del chequeo la base rechaza el nombre (dos requests simultáneas), Prisma lanza `P2002` y el repositorio lo traduce al mismo `ConflictError` → `409`.
5. Prisma devuelve la fila; `mapToEntity` la normaliza a `IRoleEntity`.
6. `mapRoleToResponse` la convierte en `IRoleResponse`, sin `deleted_at`.
7. El controller responde `201` con ese objeto.

Ese camino es el mismo en los cinco módulos. Cambia el recurso, cambian las reglas, no cambia el dibujo.

Las reglas del módulo roles, entonces, son tres y se ven en el código de abajo:

- Solo administradores operan: `authGuard` + `adminGuard` en las cinco rutas.
- El nombre es único; un duplicado es `409`, no `500`.
- No se borra de verdad: se marca `deleted_at`. La intención es que un rol asignado a usuarios no se pueda borrar y que el intento devuelva `409`, con la clave foránea como última defensa (`P2003`); en 08.6 vas a ver que, tal como está escrita esta versión, esa defensa todavía no se dispara.

### 08.1 `src/modules/roles/domain/roles.entities.ts` — entidades y datos de entrada

El primer archivo del módulo no tiene código ejecutable: son solo tipos. Una **entidad** es la descripción de una fila de la tabla `role` tal como la necesita el dominio. Fijate que incluye columnas que el cliente nunca va a ver (`deleted_at`), porque el dominio sí las necesita para saber si la fila está viva.

Al lado de la entidad viven dos tipos más, y esa separación es una decisión de diseño, no un capricho: **lo que entra** no es lo mismo que **lo que sale**. `CreateRoleData` y `UpdateRoleData` describen lo que la capa de aplicación acepta escribir; si fueran la misma entidad, alguien podría mandar `created_at` y falsificar la fecha de creación. Al tener tipos distintos, el compilador te lo impide.

```typescript
export interface IRoleEntity {
  id: string
  name: string
  description: string | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export type CreateRoleData = {
  name: string
  description?: string | null
}

export type UpdateRoleData = {
  name?: string
  description?: string | null
}
```

Línea por línea:

`export interface IRoleEntity {` abre un contrato de forma. `interface` describe cómo es un objeto; no genera código en tiempo de ejecución, no valida nada. Su valor es que TypeScript te avise si escribís mal un campo en cualquier parte del proyecto.

`id: string` es el identificador. En el schema es un `uuid` que Prisma genera al insertar (`@default(uuid())`, capítulo 03), y Prisma lo entrega como string.

`name: string` — obligatorio siempre.

`description: string | null` — la barra vertical se lee "o". Acá hay que distinguir dos ausencias que parecen iguales y no lo son: `null` significa "la base dice que no hay valor", y `undefined` significa "este objeto no trae ese campo". La entidad usa `null` porque viene de una columna que admite nulos; los datos de entrada usan `undefined` (el `?`) porque el cliente puede no mandar el campo. Mezclar los dos conceptos es una fuente clásica de bugs.

`created_at: Date` y `updated_at: Date` son `Date` de JavaScript, no strings. Prisma los devuelve así. Recién al serializar la respuesta a JSON se convierten en texto ISO (`2025-01-31T12:00:00.000Z`); eso pasa solo, en el camino de salida.

`deleted_at: Date | null` — si tiene fecha, la fila está borrada lógicamente; si es `null`, está viva. Es la columna que hace posible el soft delete.

`export type CreateRoleData = {` — acá el proyecto usa `type` en vez de `interface`. Los dos sirven para describir formas; `interface` se puede ampliar después con declaration merging, y un `type` no. Para datos de entrada no hace falta esa flexibilidad, así que `type` alcanza.

`name: string` obligatorio, `description?: string | null` opcional y anulable. Tres estados posibles: no viene (el `?`), viene con texto, o viene `null` para decir "sin descripción".

`export type UpdateRoleData` es igual pero con todos los campos opcionales, incluido `name?`. Esa es la firma de una actualización parcial: podés mandar solo lo que querés cambiar.

Lo que **no** está en estos tipos también dice algo. No hay `id`: lo genera Prisma al insertar. No hay `created_at`: lo pone Prisma. No hay `deleted_at`: borrar es una operación, no un campo que el cliente escribe.

### 08.2 `src/modules/roles/domain/roles.types.ts` — tipos de respuesta

Acá está la primera decisión que sorprende a quien viene de otros lenguajes: la respuesta **no es** la entidad. `IRoleEntity` y `IRoleResponse` se parecen mucho, pero no son lo mismo, y esa diferencia es una promesa que le hacés al cliente de la API.

El otro tipo de este archivo es el **envelope** de la lista. Cuando una ruta devuelve una colección paginada, no devuelve solo el array: lo envuelve con `total`, `page` y `limit`. La razón es práctica: si el cliente pide `?page=2&limit=50`, recibir 50 objetos no le dice si hay 3 o 3 000 en total, y sin `total` no puede dibujar "página 2 de 60" ni saber cuándo parar de pedir.

```typescript
export interface IRoleResponse {
  id: string
  name: string
  description: string | null
  created_at: Date
  updated_at: Date
}

export interface IRoleListResponse {
  roles: IRoleResponse[]
  total: number
  page: number
  limit: number
}
```

`IRoleResponse` repite `id`, `name`, `description`, `created_at` y `updated_at`… y **omite `deleted_at`**. No es un olvido: el soft delete es un detalle interno. Si el cliente supiera que existe `deleted_at`, empezaría a mandarlo en los `PATCH`, y el día que cambies la estrategia de borrado vas a tener clientes dependiendo de una columna que no era parte del contrato. Lo que no está en el tipo, no se puede filtrar.

`description: string | null` se mantiene anulable porque el cliente sí necesita distinguir "sin descripción" de "descripción vacía".

`export interface IRoleListResponse {` es el envelope: `roles: IRoleResponse[]` (un array del tipo de arriba), `total: number` (cuántos hay en la base con ese filtro, no cuántos vinieron), `page` y `limit` (los que efectivamente se usaron). Devolver `page` y `limit` parece redundante —el cliente los mandó— pero no lo es: si no los manda, el servidor aplica defaults (`1` y `50`), y el cliente necesita saber cuáles se aplicaron para calcular bien la próxima página.

Fijate también el nombre de la clave: `roles`, no `data` ni `items`. Cada módulo repite el nombre del recurso en plural. Eso hace que la respuesta se lea sola: `GET /roles` devuelve `{ roles: [...], total, page, limit }`, `GET /users` devuelve `{ users: [...], ... }`.

### 08.3 `src/modules/roles/domain/roles.interface.ts` — contrato del repositorio

Este archivo es la pieza que hace testeable todo lo demás, y conviene entender bien por qué existe. El service necesita leer y escribir roles. Podría importar Prisma directamente y escribir `prisma.role.findMany(...)` adentro. Funcionaría, y sería un problema: para probar una regla de negocio ("un nombre repetido da 409") tendrías que levantar una base de datos.

La solución es un **contrato**: una interfaz que dice *qué* operaciones necesita la capa de aplicación, sin decir *cómo* se hacen. El service depende de `IRoleRepository`, no de Prisma. En producción le pasás la implementación real; en los tests le pasás un objeto con los mismos métodos que guarda en memoria. Eso es **inyección de dependencias** en su forma más simple: la dependencia entra por parámetro en vez de estar importada adentro.

```typescript
import type { CreateRoleData, IRoleEntity, UpdateRoleData } from "./roles.entities"

export interface IListRolesParams {
  search?: string
  page?: number
  limit?: number
}

export interface IListRolesResult {
  roles: IRoleEntity[]
  total: number
  page: number
  limit: number
}

export interface IRoleRepository {
  findAll(params?: IListRolesParams): Promise<IListRolesResult>
  findById(id: string): Promise<IRoleEntity | null>
  findByName(name: string): Promise<IRoleEntity | null>
  create(data: CreateRoleData): Promise<IRoleEntity>
  update(id: string, data: UpdateRoleData): Promise<IRoleEntity>
  softDelete(id: string): Promise<void>
}
```

`import type { ... }` — el `type` en el import es importante: trae los tipos pero no genera ninguna importación en tiempo de ejecución, así que este archivo no arrastra código al bundle.

`IListRolesParams` describe la entrada de `findAll`: `search`, `page` y `limit`, todos opcionales. Que sean opcionales es lo que permite llamar `findAll()` sin argumentos y que el repositorio aplique sus defaults.

`IListRolesResult` describe la salida: las entidades **y** los metadatos. Es el mismo envelope de la respuesta pero con `IRoleEntity` adentro. Esta duplicación es deliberada: el dominio no tiene por qué conocer el tipo de respuesta HTTP, y la respuesta no tiene por qué conocer la entidad.

`findAll(params?: IListRolesParams): Promise<IListRolesResult>` — el `?` después del nombre del parámetro dice que se puede llamar sin él. `Promise<...>` dice que la operación es asíncrona y devuelve eso cuando termina; hablar con una base siempre lo es.

`findById(id: string): Promise<IRoleEntity | null>` — y acá hay una convención que se repite en todos los métodos de búsqueda: **si no encuentra, devuelve `null`, no lanza un error**. La decisión de qué significa "no existe" es del service (`404` para un `GET`, `409` para un `POST` con nombre repetido, "seguí de largo" para un chequeo interno). El repositorio no tiene por qué saber de HTTP.

`findByName(name: string)` existe solamente para el chequeo de duplicados del service. Un repositorio no expone "todos los métodos posibles": expone los que la aplicación necesita.

`create(data: CreateRoleData)` recibe el tipo de entrada y devuelve la entidad ya creada (con el `id` y las fechas que puso Prisma al insertar).

`update(id, data)` devuelve la entidad actualizada. `softDelete(id): Promise<void>` no devuelve nada: `Promise<void>` significa "terminó bien, no hay valor que mirar".

La prueba de que este archivo vale la pena la vas a ver en el capítulo 14: los tests del service se escriben con un objeto literal que implementa estos seis métodos, y corren en milisegundos sin base de datos.

### 08.4 `src/modules/roles/application/common/roles.mappers.ts` — mapper entidad → respuesta

Un **mapper** es una función chica cuya única responsabilidad es convertir un tipo en otro. Acá convierte `IRoleEntity` (lo que devuelve la base) en `IRoleResponse` (lo que ve el cliente). Parece trabajo al pedo hasta que pensás qué pasa si no existe: cada controller tendría que acordarse de no mandar `deleted_at`, y el día que alguien agregue una columna nueva a la entidad, esa columna se filtraría sola a la API sin que nadie lo decida.

Con mapper, la regla es explícita y vive en un solo lugar: si un campo no está acá, no sale.

```typescript
import type { IRoleEntity } from "../../domain/roles.entities"
import type { IRoleResponse } from "../../domain/roles.types"

export function mapRoleToResponse(role: IRoleEntity): IRoleResponse {
  return {
    id: role.id,
    name: role.name,
    description: role.description ?? null,
    created_at: role.created_at,
    updated_at: role.updated_at,
  }
}
```

`import type { IRoleEntity } from "../../domain/roles.entities"` — el `../../` sube dos carpetas: de `application/common/` a `domain/`. Los imports relativos muestran la dependencia entre capas: `application` conoce a `domain`, y nunca al revés.

`export function mapRoleToResponse(role: IRoleEntity): IRoleResponse {` — una función pura: entra un objeto, sale otro, no toca la base, no toca la request. Por eso es tan fácil de testear.

`description: role.description ?? null` — el operador `??` se llama *nullish coalescing*: devuelve el valor de la izquierda salvo que sea `null` o `undefined`, en cuyo caso devuelve el de la derecha. Se usa acá porque Prisma puede devolver `undefined` si un `select` no pidió el campo, y la respuesta promete `string | null`, nunca `undefined`. Ojo con la diferencia: `||` también reemplazaría `""` y `0`; `??` solo reemplaza las dos ausencias reales.

`created_at: role.created_at` y `updated_at: role.updated_at` pasan tal cual, porque son `Date` en los dos lados y la serialización a ISO la hace Fastify al responder.

`deleted_at` no aparece en el objeto de retorno. Esa ausencia es la funcionalidad.

Y un detalle que se ve en el service: el mapper se usa con `.map(mapRoleToResponse)`. `mapRoleToResponse` recibe un elemento y devuelve uno nuevo; `Array.prototype.map` aplica eso a cada elemento de la lista y devuelve un array nuevo. Por eso alcanza una línea para convertir una lista entera.

### 08.5 `src/modules/roles/application/roles.service.ts` — reglas de negocio del CRUD

Acá viven las reglas. El service es la única capa que decide "esto se puede" o "esto no se puede", y lo hace lanzando errores de negocio (`NotFoundError`, `ConflictError`) que el `errorHandler` global convierte en `404` y `409`. El service no sabe qué status code es cada cosa: sabe qué está mal. Esa es la división.

El módulo se arma con una **factory**: `createRoleService(RoleRepository)` recibe el repositorio y devuelve el objeto con los cinco métodos, con esa dependencia guardada adentro (un *closure*). La ventaja sobre una clase con `new` es que no hay estado compartido ni `this` dando vueltas: es una función que devuelve funciones.

```typescript
import { ConflictError, NotFoundError } from "@/core/errors/AppError"
import type { CreateRoleData, UpdateRoleData } from "../domain/roles.entities"
import type { IRoleListResponse, IRoleResponse } from "../domain/roles.types"
import type { IRoleRepository } from "../domain/roles.interface"
import { mapRoleToResponse } from "./common/roles.mappers"

export const createRoleService = (repository: IRoleRepository) => ({
  async list(params?: { search?: string; page?: number; limit?: number }): Promise<IRoleListResponse> {
    const result = await repository.findAll(params)
    return {
      roles: result.roles.map(mapRoleToResponse),
      total: result.total,
      page: result.page,
      limit: result.limit,
    }
  },

  async getById(id: string): Promise<IRoleResponse> {
    const role = await repository.findById(id)
    if (!role) {
      throw new NotFoundError("Role not found")
    }
    return mapRoleToResponse(role)
  },

  async create(data: CreateRoleData): Promise<IRoleResponse> {
    const existing = await repository.findByName(data.name)
    if (existing) {
      throw new ConflictError("Role name already exists")
    }
    const role = await repository.create(data)
    return mapRoleToResponse(role)
  },

  async update(id: string, data: UpdateRoleData): Promise<IRoleResponse> {
    const existing = await repository.findById(id)
    if (!existing) {
      throw new NotFoundError("Role not found")
    }
    const role = await repository.update(id, data)
    return mapRoleToResponse(role)
  },

  async delete(id: string): Promise<void> {
    const existing = await repository.findById(id)
    if (!existing) {
      throw new NotFoundError("Role not found")
    }
    await repository.softDelete(id)
  },
})
```

`import { ConflictError, NotFoundError } from "@/core/errors/AppError"` — los errores de negocio del capítulo 05. `@/` es un alias que apunta a `src/`, así que este import funciona igual desde cualquier profundidad.

Los imports de tipos (`CreateRoleData`, `UpdateRoleData`, `IRoleListResponse`, `IRoleResponse`, `IRoleRepository`) y el del mapper completan las dependencias: entrada, salida, contrato y traducción.

`export const createRoleService = (repository: IRoleRepository) => ({` — la factory. El parámetro está tipado con el contrato, no con la implementación. El `({` abre un objeto literal que se devuelve; cada propiedad es un método `async`.

`async list(params?: ...)` — el tipo se repite inline (`{ search?: string; page?: number; limit?: number }`) en vez de importar `IListRolesParams`. Funciona igual porque la forma es la misma, y tiene una ventaja: el service declara explícitamente qué acepta de la capa HTTP.

`const result = await repository.findAll(params)` — delega. Notá que el service no filtra, no ordena, no pagina: eso es trabajo de la base, y el repositorio ya lo hace.

`roles: result.roles.map(mapRoleToResponse)` — convierte cada entidad en respuesta. Fijate que el envelope se vuelve a armar acá (no se devuelve `result` tal cual) porque `result` tiene entidades y la respuesta necesita `IRoleResponse`. Es la traducción de frontera entre el mundo interno y el público.

`async getById(id: string)` — `repository.findById(id)`; si vuelve `null`, `throw new NotFoundError("Role not found")` → `404` con `{ code: "NOT_FOUND", message: "Role not found" }`. Si existe, se mapea.

`async create(data: CreateRoleData)` — primero `repository.findByName(data.name)`; si hay algo, `ConflictError("Role name already exists")`. Si no, `repository.create(data)` y mapeo. El chequeo previo existe para dar un error lindo en el caso normal; **no** es la garantía de unicidad (de eso se encarga la base, lo ves en la sección siguiente).

`async update(id: string, data: UpdateRoleData)` — primero busca por id: si no existe, `404`. Recién después actualiza. Esa es la razón de ser del `findById` acá: si llamaras a `update` con un id inexistente, Prisma lanzaría su propio error (`P2025`) y el cliente recibiría un `500` por algo que es un `404` de manual. El patrón "chequeá existencia antes de escribir" se repite en `delete` y en todos los módulos.

`update` **no** chequea nombre duplicado. Si cambiás un rol a un nombre ya usado, la base lanza `P2002` y el repositorio lo traduce al mismo `ConflictError("Role name already exists")`. Evita una query y el mensaje final es idéntico.

`async delete(id: string)` — busca, si no existe `404`, y llama a `repository.softDelete(id)`. No devuelve nada. El borrado real no ocurre: el repositorio setea `deleted_at`. Y si el rol está en uso por usuarios, el repositorio está preparado para capturar el `P2003` de la clave foránea y convertirlo en `409` con un mensaje que se entiende ("Cannot delete a role assigned to users"); si esa red funciona o no en la práctica es exactamente lo que discute 08.6.

### 08.6 `src/modules/roles/infrastructure/roles.prisma.repository.ts` — implementación Prisma con mapeo de errores

Este es el archivo más interesante del módulo, porque es donde el mundo de la base y el mundo del negocio se tocan. Tres ideas lo atraviesan: **proyección tipada** (traer solo lo necesario, con el tipo derivado de esa elección), **normalización** (convertir lo que Prisma devuelve en la entidad del dominio) y **traducción de errores** (convertir un error de Postgres en un error que el cliente entiende).

Primero la cabecera: los imports, el `select`, el tipo derivado y los dos helpers.

```typescript
import { Prisma } from "@prisma/client"
import { prisma } from "@/config/prisma"
import { ConflictError } from "@/core/errors/AppError"
import type { IRoleRepository } from "../domain/roles.interface"
import type { CreateRoleData, IRoleEntity, UpdateRoleData } from "../domain/roles.entities"

const roleSelect = {
  id: true,
  name: true,
  description: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
} as const

type RoleRecord = Prisma.roleGetPayload<{ select: typeof roleSelect }>

function mapToEntity(role: RoleRecord): IRoleEntity {
  return {
    ...role,
    description: role.description ?? null,
    deleted_at: role.deleted_at ?? null,
  }
}

function isPrismaError(error: unknown, code: string): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
}
```

`import { Prisma } from "@prisma/client"` — no es un tipo: es el espacio de nombres del cliente, y se usa para dos cosas distintas: `Prisma.roleWhereInput` / `Prisma.roleGetPayload` (tipos) y `Prisma.PrismaClientKnownRequestError` (la clase que representa un error conocido de la base, con un `code`).

`import { prisma } from "@/config/prisma"` — la instancia única del cliente (singleton), configurada en el capítulo 04. No se crea un cliente por módulo: cada cliente abre un pool de conexiones y multiplicarlos agota la base.

`const roleSelect = { ... } as const` — la lista explícita de columnas. `as const` congela los valores como literales (`true`, no `boolean`), y eso es lo que permite que el tipo de abajo se derive con precisión.

`type RoleRecord = Prisma.roleGetPayload<{ select: typeof roleSelect }>` — acá está la magia: no escribís a mano la forma de la fila, la derivás del `select`. Si mañana agregás `deleted_at: true`, `RoleRecord` cambia solo. Si te olvidás de pedir `name`, TypeScript te va a marcar que `mapToEntity` no lo puede leer. El tipo y la consulta no se pueden desincronizar.

`function mapToEntity(role: RoleRecord): IRoleEntity` — el mapper de entrada, el que va de fila a entidad. Es el espejo del mapper de respuesta: traduce en la otra dirección y en la otra capa.

`...role` esparce todos los campos del registro. Después, `description: role.description ?? null` y `deleted_at: role.deleted_at ?? null` normalizan las dos columnas anulables. Con el `select` de arriba Prisma ya devuelve `null`, así que el `??` es redundante *hoy*; está para que la entidad cumpla su contrato aunque cambie la forma en que se arma la consulta. Es defensa barata.

`function isPrismaError(error: unknown, code: string): error is Prisma.PrismaClientKnownRequestError` — un **type guard**: una función que no solo devuelve un booleano, sino que le enseña a TypeScript que, si devolvió `true`, ese valor es de ese tipo. La firma se lee "`error` es (a partir de acá) un `PrismaClientKnownRequestError`". Ese `error is ...` del final es el predicado: es lo que le dice al compilador qué tipo tiene `error` cuando la función devuelve `true`.

El cuerpo devuelve `error instanceof Prisma.PrismaClientKnownRequestError && error.code === code`. Dos condiciones: que sea un error conocido de Prisma (no una excepción de red, no un bug) y que el código sea el que buscamos. Nunca un `catch` vacío: si el error no es el esperado, el `throw error` lo deja pasar tal cual.

Ahora la implementación del contrato:

```typescript
export const RoleRepository: IRoleRepository = {
  async findAll(params) {
    const where: Prisma.roleWhereInput = { deleted_at: null }
    if (params?.search) {
      where.name = { contains: params.search, mode: "insensitive" }
    }

    const page = params?.page || 1
    const limit = params?.limit || 50
    const skip = (page - 1) * limit

    const [roles, total] = await Promise.all([
      prisma.role.findMany({ where, select: roleSelect, skip, take: limit, orderBy: { name: "asc" } }),
      prisma.role.count({ where }),
    ])

    return { roles: roles.map(mapToEntity), total, page, limit }
  },

  async findById(id) {
    const role = await prisma.role.findFirst({ where: { id, deleted_at: null }, select: roleSelect })
    return role ? mapToEntity(role) : null
  },

  async findByName(name) {
    const role = await prisma.role.findFirst({ where: { name, deleted_at: null }, select: roleSelect })
    return role ? mapToEntity(role) : null
  },

  async create(data) {
    try {
      const role = await prisma.role.create({ data, select: roleSelect })
      return mapToEntity(role)
    } catch (error) {
      if (isPrismaError(error, "P2002")) {
        throw new ConflictError("Role name already exists")
      }
      throw error
    }
  },

  async update(id, data) {
    try {
      const role = await prisma.role.update({ where: { id }, data, select: roleSelect })
      return mapToEntity(role)
    } catch (error) {
      if (isPrismaError(error, "P2002")) {
        throw new ConflictError("Role name already exists")
      }
      throw error
    }
  },

  async softDelete(id) {
    try {
      await prisma.role.update({ where: { id }, data: { deleted_at: new Date() } })
    } catch (error) {
      if (isPrismaError(error, "P2003")) {
        throw new ConflictError("Cannot delete a role assigned to users")
      }
      throw error
    }
  },
}
```

`export const RoleRepository: IRoleRepository = {` — el objeto se declara con el tipo del contrato. Esto es lo que hace que si mañana agregás un método a `IRoleRepository` y te olvidás de implementarlo, el compilador te frene acá.

`async findAll(params)` — arma el `where` y pagina. Paso por paso:

`const where: Prisma.roleWhereInput = { deleted_at: null }` — el filtro base de todo listado: solo filas vivas. Es la consecuencia visible del soft delete; si te olvidás de este `where` en algún método, empezás a mostrar borrados.

`if (params?.search) { where.name = { contains: params.search, mode: "insensitive" } }` — `?.` significa "si `params` no es `null`/`undefined`, seguí; si es, devolvé `undefined`". `contains` es el `LIKE '%texto%'` de SQL, y `mode: "insensitive"` lo hace ignorar mayúsculas y minúsculas. Sin `mode`, `"Admin"` no encontraría `"admin"`.

`const page = params?.page || 1` y `const limit = params?.limit || 50` — los defaults, por si alguien llama al repositorio sin pasar por el DTO. `skip = (page - 1) * limit` es la cuenta clásica de la paginación: para la página 1 no salteás nada; para la 3 con `limit` 50, salteás 100.

`const [roles, total] = await Promise.all([...])` — dos consultas independientes (la página y el total) lanzadas en paralelo. `Promise.all` espera a las dos y devuelve un array con los dos resultados, que se desestructura en `roles` y `total`. Si las hicieras en serie, el tiempo total sería la suma; en paralelo, el máximo de las dos. Son independientes, así que no hay razón para esperar una antes de largar la otra.

Adentro del `Promise.all`: `findMany` con `where`, `select`, `skip`, `take: limit` y `orderBy: { name: "asc" }`. El `orderBy` no es opcional en la práctica: sin orden explícito, Postgres puede devolver las filas en cualquier orden y dos páginas seguidas podrían repetir o saltear registros.

`return { roles: roles.map(mapToEntity), total, page, limit }` — arma el `IListRolesResult` con entidades adentro y los metadatos afuera.

`async findById(id)` — `findFirst({ where: { id, deleted_at: null }, select: roleSelect })` y `role ? mapToEntity(role) : null`. Se usa `findFirst` y no `findUnique` porque el `where` combina dos condiciones y `findUnique` solo acepta campos únicos. El `: null` final es la convención que el service espera.

`async findByName(name)` — idéntico pero filtrando por `name`.

`async create(data)` — el `try` con `prisma.role.create({ data, select: roleSelect })`. `data` va tal cual: Prisma acepta `CreateRoleData` porque los campos coinciden con las columnas. El `catch` pregunta `isPrismaError(error, "P2002")`; si es, `throw new ConflictError("Role name already exists")`; si no, `throw error`.

**Acá está la respuesta a la pregunta del capítulo: cómo un nombre repetido se vuelve `409` y no `500`.** El unique constraint `role_name_key` de Postgres rechaza el insert; Prisma lo reporta como `PrismaClientKnownRequestError` con `code: "P2002"`. Ese error, si nadie lo toca, es un error desconocido para el `errorHandler`: lo loggea y responde `500`. El repositorio lo reconoce y lo cambia por un `ConflictError`, que tiene `statusCode: 409` y `code: "CONFLICT"`. El handler lo serializa y el cliente recibe `{ "code": "CONFLICT", "message": "Role name already exists" }`. La regla de negocio se expresa como dato, no como string suelto.

`async update(id, data)` — mismo `try/catch` con `P2002`. Si el nombre nuevo choca con otro rol, `409`. Ojo: acá no se chequea `P2025` (id inexistente) porque el service ya verificó con `findById` antes de llamar.

`async softDelete(id)` — `prisma.role.update({ where: { id }, data: { deleted_at: new Date() } })`: no hay `delete()`, hay un `update` que escribe la fecha actual en `deleted_at`. Tres consecuencias que conviene tener claras: la fila sigue existiendo (el historial de quién hizo qué no se rompe), el `id` sigue reservado (nadie lo reutiliza) y **todas** las consultas de lectura tienen que filtrar `deleted_at: null` — cosa que este repositorio hace en `findAll`, `findById` y `findByName`. Acá no se pide `select`, porque no importa lo que vuelva: el método devuelve `void`.

El `catch` de `softDelete` es distinto: pregunta por `P2003`, la violación de clave foránea. Definición que faltaba: una **clave foránea** (FK) es una columna que apunta al `id` de otra tabla, y la base garantiza que ese `id` exista. `user.role_id` es una FK a `role.id`, y la relación está declarada sin `onDelete`, o sea con borrado restringido por defecto: si alguien borrara de verdad un rol que tiene usuarios, Postgres se negaría a dejar huérfano al usuario y Prisma lo reportaría como `P2003`. El repositorio lo traduce a `ConflictError("Cannot delete a role assigned to users")` → `409`, en vez del `500` que vería el cliente si el error saliera crudo.

Y ahora la parte incómoda, que conviene entender antes de copiar este patrón: **`softDelete` no borra nada**. Hace un `UPDATE` de la columna `deleted_at`, y las claves foráneas no se revisan cuando actualizás una columna que no es la clave. Consecuencia concreta en esta versión: marcar como borrado un rol que está asignado a usuarios **funciona**, y este `catch` de `P2003` no se va a disparar nunca por este camino. No es un error de sintaxis: es una defensa escrita para un borrado real (`prisma.role.delete`) que la implementación no hace. Si querés que la regla se cumpla de verdad, tenés dos caminos honestos: contar los usuarios con ese `role_id` antes de marcar y lanzar `ConflictError` si hay alguno, o cambiar el `softDelete` por un `delete` real y dejar que la FK Restrict haga el trabajo.

Ojo, esto no invalida el soft delete como estrategia: sigue siendo la razón por la que el historial no se rompe. Lo que invalida es suponer que la base te va a cubrir una regla que vos no escribiste. Cuando una defensa depende de un borrado que no ocurre, hay que probarla o reemplazarla.

### 08.7 `src/modules/roles/presentation/roles.dto.ts` — DTOs Zod + query de paginación

Llegamos a la puerta de entrada. Un **DTO** es la forma de los datos que entran por HTTP, y su trabajo es doble: **validar** (rechazar lo que no sirve antes de tocar la base) y **transformar** (convertir los tipos que llegan por la red en los tipos que el resto del código espera). Zod hace las dos cosas con un solo objeto: definís el schema, llamás a `parse` y recibís el valor tipado —o una excepción.

Ese detalle importa: los query params **siempre llegan como texto**. `?page=2` no es el número 2, es el string `"2"`. Si no lo convertís, `skip = (page - 1) * limit` produce `"2" - 1`, que en JavaScript da `1` por coerción… y un día te da `NaN`. Zod resuelve eso explícitamente con `z.coerce`.

```typescript
import { z } from "zod"

export const CreateRoleDtoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  description: z.string().max(255).optional(),
})

export const UpdateRoleDtoSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().max(255).nullable().optional(),
})

export const RoleQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
})

export type CreateRoleDto = z.infer<typeof CreateRoleDtoSchema>
export type UpdateRoleDto = z.infer<typeof UpdateRoleDtoSchema>
```

`CreateRoleDtoSchema` valida el `POST`. `name: z.string().min(2, "Name must be at least 2 characters").max(50)` — string, mínimo 2 con mensaje propio, máximo 50. El mensaje del `min` es el que el cliente va a leer; el del `max` queda en el default de Zod ("String must contain at most 50 character(s)"), que no está en español pero es claro. Esto es una decisión de producto: los mensajes de validación son parte de la API.

`description: z.string().max(255).optional()` — opcional: si no viene, el objeto parseado simplemente no tiene la clave. No es `nullable`: en la creación no tiene sentido mandar `null` para decir "sin descripción", alcanza con omitirlo. (El schema de update sí lo permite, y esa asimetría es intencional.)

`UpdateRoleDtoSchema` tiene todo opcional, incluido `name`. `description: z.string().max(255).nullable().optional()` — tres estados: ausente (no lo toco), texto (lo cambio), `null` (lo vacío). Si no aceptara `null`, no habría forma de borrar una descripción existente: mandar `""` guardaría un string vacío, que no es lo mismo que "sin descripción".

`RoleQuerySchema` valida el query string del listado:

`search: z.string().optional()` — el texto a buscar, opcional.

`page: z.coerce.number().int().positive().optional().default(1)` — `coerce.number()` convierte `"3"` en `3`. `.int()` rechaza `2.5`. `.positive()` rechaza `0` y negativos. `.optional().default(1)` significa: si no viene, usá `1`. El orden importa: `default` va último, sobre el resultado ya validado.

`limit: ...max(100)...default(50)` — el `.max(100)` es una defensa concreta: sin él, `?limit=1000000` haría que la base arme una respuesta enorme y el servidor se quede sin memoria. Un endpoint paginado sin tope de `limit` es un endpoint que cualquiera puede tirar abajo.

Los tres `export type ... = z.infer<typeof ...Schema>` derivan el tipo TypeScript del schema. Es la misma idea que `roleGetPayload`: una sola fuente de verdad. Si cambiás el schema, el tipo cambia solo, y no podés tener un DTO que valide una cosa y un tipo que diga otra.

Y algo importante para cuando leas el controller: el DTO **no** se aplica solo. Hay que llamar a `.parse()`. Zod no se engancha a Fastify por arte de magia; el proyecto eligió parsear explícitamente en el controller, que es donde se ve qué se valida y con qué schema.

### 08.8 `src/modules/roles/presentation/roles.controller.ts` — controlador

El **controlador** es la capa que habla HTTP: lee la request, valida, llama al service y elige el status. Tiene que ser **delgado**, y "delgado" acá tiene un significado preciso: no decide reglas de negocio y no habla con la base. Si un día leés un controller con un `if` sobre datos que no son de la request, algo se filtró de capa.

El controller es, además, donde se hace el cableado: el service se crea **una vez**, al cargar el módulo, con el repositorio real.

```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { createRoleService } from "../application/roles.service"
import { RoleRepository } from "../infrastructure/roles.prisma.repository"
import { CreateRoleDtoSchema, RoleQuerySchema, UpdateRoleDtoSchema } from "./roles.dto"

const roleService = createRoleService(RoleRepository)

export const rolesController = {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const query = RoleQuerySchema.parse(request.query)
    const result = await roleService.list(query)
    return reply.status(200).send(result)
  },

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string }
    const result = await roleService.getById(id)
    return reply.status(200).send(result)
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = CreateRoleDtoSchema.parse(request.body)
    const result = await roleService.create(body)
    return reply.status(201).send(result)
  },

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string }
    const body = UpdateRoleDtoSchema.parse(request.body)
    const result = await roleService.update(id, body)
    return reply.status(200).send(result)
  },

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string }
    await roleService.delete(id)
    return reply.status(200).send({ message: "Role deleted successfully" })
  },
}
```

`import type { FastifyReply, FastifyRequest } from "fastify"` — `import type`: los dos tipos existen solo para anotar los parámetros, no se importa código de Fastify.

`const roleService = createRoleService(RoleRepository)` — la línea más importante del archivo. Acá se unen la factory del service con la implementación de Prisma. Se ejecuta una sola vez, cuando el módulo se importa: `roleService` queda armado con su dependencia y todos los handlers lo comparten. Como el service no guarda estado (no hay contadores ni caché adentro), compartirlo es seguro.

Los cinco handlers siguen el mismo esqueleto: parsear, llamar, responder.

`async list(request, reply)` — `const query = RoleQuerySchema.parse(request.query)`: si el query no valida, Zod lanza `ZodError` y el `errorHandler` responde `400` con el primer problema formateado como `campo: mensaje`. Si valida, `query` ya tiene `page` y `limit` como números y los defaults aplicados. `await roleService.list(query)` y `reply.status(200).send(result)`.

`async getById(request, reply)` — `const { id } = request.params as { id: string }`: desestructura el parámetro de ruta. El `as` es un *cast*: Fastify no infiere el tipo de `params` si no le declarás genéricos en la ruta, así que le afirmás que tiene esa forma. Es una promesa que hacés vos —el `:id` de la ruta dice que existe— y el costo es que acá **no** se valida el formato del id: un id malformado viaja hasta la base. Los DTO validan el body, no los parámetros; si quisieras cerrar ese hueco, el lugar sería un schema de params. Después: service y `200`.

`async create(request, reply)` — `CreateRoleDtoSchema.parse(request.body)`, `roleService.create(body)` y `reply.status(201).send(result)`. El `201` no es adorno: el `200` significa "salió bien", y el `201` agrega "y además nació un recurso". Con `201` sabe que hay un recurso nuevo, y el cuerpo trae el `id` que Prisma generó.

`async update(request, reply)` — params + body, service, `200`. Se usa `PUT` en la ruta aunque el DTO permita mandar campos parciales; lo correcto desde el punto de vista REST sería `PATCH`, y el proyecto lo deja en `PUT` por consistencia con los otros módulos. Es una de esas discusiones donde no hay una verdad absoluta: lo que no se negocia es que el cliente y el servidor estén de acuerdo.

`async delete(request, reply)` — params, service, y `reply.status(200).send({ message: "Role deleted successfully" })`. Podría ser `204 No Content` (borrado, sin cuerpo); el proyecto devuelve `200` con un mensaje para que el frontend tenga algo que mostrar al usuario. `204` es más prolijo, `200` con mensaje es más cómodo; cualquiera de los dos es defendible si lo respetás en todos los endpoints.

En los cinco aparece el `return` antes de `reply...send(...)`. No es un capricho de estilo: devolver la respuesta le dice a Fastify que el handler terminó y que ese es el resultado. Si no devolvés y el handler sigue ejecutándose después del `send`, te arriesgás a que se intente responder dos veces.

Fijate lo que **no** hay: ningún `try/catch`. Los errores del service (`NotFoundError`, `ConflictError`) suben solos hasta el `errorHandler`. Eso es lo que permite que el controller sea corto: no traduce errores, no arma respuestas de error, no conoce status codes más que el de éxito.

### 08.9 `src/modules/roles/presentation/roles.routes.ts` — rutas protegidas para admin

Falta la parte que une todo con HTTP: declarar las rutas y decir quién puede entrar. En Fastify, un archivo de rutas es un **plugin**: una función `async (fastify, _opts)` que recibe la instancia y le registra endpoints. El prefijo (`/roles`) no está acá: se aplica al montar el plugin en `src/http/routes.ts` con `app.register(rolesRoutes, { prefix: "/roles" })`. Así el módulo no repite su propio nombre en cada línea.

El **`preHandler`** es un arreglo de funciones que Fastify corre antes del handler. Si alguna lanza, el handler no se ejecuta y el error sigue el camino del `errorHandler`. Es el lugar exacto para autenticación y autorización: se corta antes del handler, así que sin token válido no se ejecuta ni una línea del controller ni del service. (El cuerpo ya se parseó antes del `preHandler`: para limitar su tamaño están los `bodyLimit` de Fastify, no el guardia.)

```typescript
import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { rolesController } from "./roles.controller"
import { adminGuard, authGuard } from "@/modules/auth/application/common/auth.guard"

export const rolesRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  fastify.get("/", { preHandler: [authGuard, adminGuard] }, rolesController.list)
  fastify.get("/:id", { preHandler: [authGuard, adminGuard] }, rolesController.getById)
  fastify.post("/", { preHandler: [authGuard, adminGuard] }, rolesController.create)
  fastify.put("/:id", { preHandler: [authGuard, adminGuard] }, rolesController.update)
  fastify.delete("/:id", { preHandler: [authGuard, adminGuard] }, rolesController.delete)
}
```

`import { adminGuard, authGuard } from "@/modules/auth/application/common/auth.guard"` — los dos guardias del capítulo 07. El orden del import (alfabético) no tiene nada que ver con el orden en que se ejecutan.

`export const rolesRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {` — la firma que Fastify espera. `_opts` lleva guión bajo porque no se usa: es la convención para decir "este parámetro existe por la firma pero lo ignoro".

Las cinco líneas son el CRUD completo, una por operación:

`fastify.get("/", { preHandler: [authGuard, adminGuard] }, rolesController.list)` — `GET /roles`. En Fastify, `"/"` sobre un plugin montado con prefijo `/roles` significa `/roles`, no la raíz del sitio.

`fastify.get("/:id", ...)` — `GET /roles/:id`.

`fastify.post("/", ...)` — `POST /roles`.

`fastify.put("/:id", ...)` — `PUT /roles/:id`.

`fastify.delete("/:id", ...)` — `DELETE /roles/:id`.

En las cinco, el segundo argumento es el objeto de opciones de la ruta y adentro va `preHandler: [authGuard, adminGuard]`. El arreglo se ejecuta **en orden**: primero `authGuard` valida el token e inyecta `request.userId`, `request.userEmail` y `request.userRole`; después `adminGuard` compara `request.userRole !== "admin"` y lanza `ForbiddenError` si no coincide. Si los invertís, `adminGuard` lee un `request.userRole` que todavía no existe y responde `403` a todo el mundo, incluidos los admins. Cuando algo así pasa, el bug no está en el guardia: está en el orden.

Y por qué acá van los dos y en `products` solo uno: un rol es una pieza de permisos. Si cualquier usuario logueado pudiera crear roles, podría crearse un rol `admin` y asignárselo. La autorización de este módulo no es "quién puede ver la lista", es "quién puede definir qué puede hacer el resto". Por eso `admin` y nada más.

### Resumen

- CRUD es crear, leer, actualizar y borrar; en HTTP son `POST`, `GET`, `PUT`/`PATCH` y `DELETE` sobre un recurso en plural, con status `201` al crear, `200` al leer o actualizar, `404` si el id no existe y `409` cuando choca con una regla.
- El módulo se divide en cuatro capas y cada una tiene un motivo de cambio propio: `domain` dice qué hace falta, `application` decide las reglas, `infrastructure` habla con Prisma y `presentation` habla HTTP. El controller delgado es consecuencia de esa división, no una preferencia estética.
- La entidad no es la respuesta y el mapper es la frontera: `deleted_at` existe en la entidad porque el dominio lo necesita, y no existe en `IRoleResponse` porque el cliente no tiene por qué saber cómo se borra.
- Un nombre repetido termina en `409` porque el repositorio reconoce el `P2002` de la base y lo convierte en `ConflictError`; si no lo hiciera, el `errorHandler` lo trataría como un bug y respondería `500`.
- El soft delete cambia `deleted_at` en vez de borrar la fila, y por eso **todos** los métodos de lectura filtran `deleted_at: null`; el `P2003` de una clave foránea está traducido a `409`, aunque con un `UPDATE` de `deleted_at` esa restricción no llega a dispararse (la letra chica de 08.6).

## 09. Módulo users

Con roles ya tenés el molde completo: cuatro carpetas, nueve archivos, el mismo recorrido de una request. `users` es ese mismo CRUD, y por eso este capítulo no repite el molde: se concentra en lo que es nuevo y en por qué está ahí.

Hay cuatro novedades, y las cuatro son problemas reales de un punto de venta:

1. **La contraseña.** Un usuario tiene una contraseña, y una contraseña no se guarda: se guarda su *hash*. El service la convierte antes de escribir y el mapper garantiza que nunca salga.
2. **El rol.** Un usuario pertenece a un rol (`role_id`), y la API muestra el nombre del rol junto al usuario. Eso obliga a un `select` anidado y agrega un error nuevo: apuntar a un rol que no existe.
3. **El estado.** A un empleado que se va lo normal es desactivarlo con `is_active` en vez de borrarlo, y hay un endpoint específico para eso.
4. **La autoprotección.** Un admin no puede borrarse a sí mismo.

Un archivo que no vas a ver en este capítulo es `users.interface.ts`. No falta: es el contrato del repositorio, calcado del de roles, con la misma forma (`findAll`, `findById`, `create`, `update`, `softDelete`) y una diferencia: en lugar de `findByName` tiene `findByEmail`, porque lo que identifica a un usuario es el email. Cuando abras el proyecto, leelo al lado del de roles y vas a ver que la única línea distinta es el nombre del método.

Los conceptos nuevos, antes de usarlos:

- **Hash** — una función de una sola dirección: convierte `"secreto123"` en una cadena tipo `$2b$10$...` y no hay forma práctica de volver atrás. Guardás el hash; cuando alguien hace login, hasheás lo que escribió y comparás. Si te roban la base, no obtienen las contraseñas.
- **Salt** — datos aleatorios que se agregan a la contraseña antes de hashear, para que dos personas con la misma contraseña tengan hashes distintos. `bcrypt` lo genera y lo guarda embebido en el propio hash, por eso no hay una columna `salt`.
- **`bcrypt`** — el algoritmo que usa el proyecto, con 10 rondas (capítulo 07, `hashPassword` y `comparePassword`). Cada hash tarda unas décimas de segundo a propósito: eso encarece los ataques por fuerza bruta.
- **Clave foránea (FK)** — una columna que apunta al `id` de otra tabla. `user.role_id` apunta a `role.id`, y la base se encarga de que ese rol exista.
- **`select` anidado** — pedir, junto con las columnas del usuario, un objeto `role: { id, name }` armado por la relación. Una sola consulta en vez de dos.
- **Desactivar vs borrar** — son dos cosas distintas y el módulo tiene las dos: `is_active: false` deja la fila visible pero impide el login; `deleted_at` la saca de los listados. La primera es una decisión de negocio reversible, la segunda un borrado lógico.

Las reglas del módulo, que se ven en el código:

- CRUD completo solo para `admin` (`authGuard` + `adminGuard` en las seis rutas).
- El email es único: duplicado → `409` con "Email already registered".
- Crear un usuario con un `role_id` inexistente falla por la FK (`P2003`) y el repositorio lo traduce a `409` con "Role does not exist".
- La contraseña en claro entra por el DTO, se hashea en el service y nunca se devuelve.

### 09.1 `src/modules/users/domain/users.entities.ts` — entidades del usuario

La entidad de usuario es más grande que la de rol porque la fila tiene más cosas: el hash, la relación con el rol y el estado. Prestá atención a dos detalles que no son obvios: el rol viene **anidado** (no es solo el `role_id`), y el hash es parte de la entidad aunque nunca sea parte de la respuesta.

```typescript
export interface IUserEntity {
  id: string
  name: string
  email: string
  password_hash: string
  role_id: string
  role: {
    id: string
    name: string
  }
  is_active: boolean
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export type CreateUserData = {
  name: string
  email: string
  password_hash: string
  role_id: string
}

export type UpdateUserData = {
  name?: string
  email?: string
  role_id?: string
  is_active?: boolean
}
```

`password_hash: string` — la entidad guarda el **hash**, no la contraseña. El nombre de la columna lo dice: si en algún lugar del código ves `password` en una entidad, es un bug. Este campo existe en la entidad porque el service de auth lo necesita para comparar en el login; existe en la fila porque es lo único que se guarda.

`role_id: string` — la FK. Es un string porque es un `uuid`, igual que `id`.

`role: { id: string; name: string }` — el objeto anidado que arma el `select` del repositorio. ¿Por qué está acá si `role_id` ya dice a qué rol pertenece? Porque el cliente necesita el **nombre** del rol para mostrarlo (`"Ana Pérez — admin"`), y sin esto habría que hacer una segunda request o un join manual desde el frontend. El repositorio lo trae en la misma consulta y la entidad lo transporta.

`is_active: boolean` — el estado. `true` = puede loguearse.

`created_at`, `updated_at`, `deleted_at` — igual que en roles: `Date`, `Date`, `Date | null`.

`export type CreateUserData` — fijate lo que recibe: `password_hash`, **no** `password`. Ese tipo es lo que el repositorio escribe, y el repositorio no tiene por qué saber hashear. El hasheo ocurre un paso antes, en el service. La firma es la prueba de que la contraseña en claro nunca llega a la capa de persistencia.

`export type UpdateUserData` — `name`, `email`, `role_id` e `is_active`, todos opcionales. Y acá hay una ausencia que vale la pena señalar: **no hay contraseña**. Cambiar la contraseña no es parte del CRUD administrativo; en un sistema real se hace con un flujo aparte (el usuario pide el cambio, se verifica el email, etc.). Si estuviera acá, cualquier admin podría cambiarle la contraseña a cualquiera sin dejar rastro.

`is_active` sí está en `UpdateUserData`, y eso es lo que hace posible el toggle sin un método nuevo en el contrato: el toggle es un `update` que manda un solo campo.

### 09.2 `src/modules/users/domain/users.types.ts` — tipos de respuesta

La respuesta del usuario es la entidad menos el hash (y menos `deleted_at`). No parece gran cosa, pero es la garantía más importante de este módulo: una vez que el tipo de retorno no tiene `password_hash`, no hay forma de filtrarlo por accidente desde el service ni desde el controller.

```typescript
export interface IUserResponse {
  id: string
  name: string
  email: string
  role: {
    id: string
    name: string
  }
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface IUserListResponse {
  users: IUserResponse[]
  total: number
  page: number
  limit: number
}
```

`IUserResponse` tiene `id`, `name`, `email`, `role` (el objeto anidado con `id` y `name`), `is_active` y las dos fechas. Comparala mentalmente con `IUserEntity`: falta `password_hash`, falta `role_id` y falta `deleted_at`.

`role_id` se omite porque es redundante: si la respuesta ya trae `role.id`, repetir el id suelto invita a que el cliente use uno y no el otro. `password_hash` se omite por seguridad. `deleted_at` se omite porque el soft delete es interno, igual que en roles.

`IUserListResponse` es el envelope de siempre: `users`, `total`, `page`, `limit`. La clave repite el plural del recurso.

### 09.3 `src/modules/users/application/common/users.mappers.ts` — mapper que oculta el hash

Este archivo es corto y es, literalmente, la defensa del hash. El mapper arma un objeto nuevo campo por campo, en vez de esparcir la entidad con `...user` y borrar lo que sobra. Esa decisión de estilo es una decisión de seguridad: con lista explícita, un campo nuevo de la entidad **no** aparece en la respuesta hasta que alguien lo agregue a mano.

```typescript
import type { IUserEntity } from "../../domain/users.entities"
import type { IUserResponse } from "../../domain/users.types"

export function mapUserToResponse(user: IUserEntity): IUserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
    updated_at: user.updated_at,
  }
}
```

`export function mapUserToResponse(user: IUserEntity): IUserResponse` — entra la entidad completa (con hash) y sale la respuesta (sin hash). Si intentaras poner `password_hash` en el objeto de retorno, TypeScript te frenaría: el tipo de retorno no lo tiene. La garantía no depende de que te acuerdes; depende del compilador.

`role: user.role` pasa el objeto anidado tal cual. Ya tiene la forma exacta que la respuesta promete, así que no hay nada que traducir. Si un día la entidad trajera `role: { id, name, description }`, este mapper dejaría de compilar y te obligaría a decidir si `description` se publica. Otra vez: la lista explícita obliga a tomar la decisión.

`is_active`, `created_at`, `updated_at` pasan directo. `password_hash`, `role_id` y `deleted_at` no aparecen. Tres ausencias, tres motivos distintos.

Y una nota sobre cómo se usa: `result.users.map(mapUserToResponse)`, igual que en roles. La misma función sirve para un usuario suelto (`getById`, `create`, `update`) y para cada elemento de una lista, porque recibe **uno** y devuelve **uno**.

### 09.4 `src/modules/users/application/users.service.ts` — reglas de negocio

El service de usuarios es el de roles con dos cambios de fondo: el `create` recibe `password` en claro y lo hashea, y el `create` valida por email en vez de por nombre. El resto es el mismo patrón, y notarlo es la mitad del aprendizaje: si tuvieras que escribirlo de cero, ya sabrías por dónde empezar.

```typescript
import { ConflictError, NotFoundError } from "@/core/errors/AppError"
import { hashPassword } from "@/modules/auth/application/common/crypto.utils"
import type { UpdateUserData } from "../domain/users.entities"
import type { IUserListResponse, IUserResponse } from "../domain/users.types"
import type { IUserRepository } from "../domain/users.interface"
import { mapUserToResponse } from "./common/users.mappers"

export const createUserService = (repository: IUserRepository) => ({
  async list(params?: { search?: string; page?: number; limit?: number }): Promise<IUserListResponse> {
    const result = await repository.findAll(params)
    return {
      users: result.users.map(mapUserToResponse),
      total: result.total,
      page: result.page,
      limit: result.limit,
    }
  },

  async getById(id: string): Promise<IUserResponse> {
    const user = await repository.findById(id)
    if (!user) {
      throw new NotFoundError("User not found")
    }
    return mapUserToResponse(user)
  },

  async create(data: { name: string; email: string; password: string; role_id: string }): Promise<IUserResponse> {
    const existing = await repository.findByEmail(data.email)
    if (existing) {
      throw new ConflictError("Email already registered")
    }
    const password_hash = await hashPassword(data.password)
    const user = await repository.create({
      name: data.name,
      email: data.email,
      password_hash,
      role_id: data.role_id,
    })
    return mapUserToResponse(user)
  },

  async update(id: string, data: UpdateUserData): Promise<IUserResponse> {
    const existing = await repository.findById(id)
    if (!existing) {
      throw new NotFoundError("User not found")
    }
    const user = await repository.update(id, data)
    return mapUserToResponse(user)
  },

  async delete(id: string): Promise<void> {
    const existing = await repository.findById(id)
    if (!existing) {
      throw new NotFoundError("User not found")
    }
    await repository.softDelete(id)
  },
})
```

`import { hashPassword } from "@/modules/auth/application/common/crypto.utils"` — el service de usuarios **importa** una utilidad del módulo auth. No es una violación de capas: `crypto.utils` es infraestructura de criptografía reutilizable, y duplicar el hasheo en dos módulos sería peor (dos lugares donde el `SALT_ROUNDS` puede quedar distinto).

`import type { UpdateUserData }` — solo se importa el tipo de update. `CreateUserData` no se usa acá, y eso es intencional: el `create` del service no recibe `CreateUserData` (que ya tiene `password_hash`) sino un objeto con `password` en claro. Son dos tipos distintos para dos momentos distintos del mismo dato.

`import { mapUserToResponse }` — el mapper que oculta el hash. Todos los retornos pasan por acá; no hay un camino alternativo.

`async list(params?)` — igual que en roles: delega en `findAll` y arma el envelope mapeando cada elemento.

`async getById(id)` — `findById`, `null` → `NotFoundError("User not found")` → `404`.

`async create(data: { name: string; email: string; password: string; role_id: string })` — acá está lo nuevo. El parámetro declara `password: string`, en claro. Esto es lo que llega desde el DTO, que también valida `password` (mínimo 8). Orden de las operaciones:

1. `const existing = await repository.findByEmail(data.email)` y si existe, `ConflictError("Email already registered")` → `409`. Es el mismo chequeo previo que en roles: da el error lindo en el caso normal.
2. `const password_hash = await hashPassword(data.password)` — el `await` importa: bcrypt es lento a propósito y devuelve una promesa. Mientras hashea, el event loop sigue atendiendo otras requests, pero este usuario espera. Ese costo es la funcionalidad.
3. `repository.create({ name, email, password_hash, role_id })` — se arma el `CreateUserData` explícitamente, campo por campo. Fijate que `password` no viaja: lo que se escribe es el hash. Este es el único lugar del proyecto donde una contraseña en claro existe después de la validación.

`async update(id, data: UpdateUserData)` — busca, si no existe `404`, actualiza y mapea. `UpdateUserData` no tiene contraseña, así que por este camino no se puede cambiar; tampoco permite mandar `password_hash` desde el cliente (que sería peor: un atacante podría escribir el hash que quisiera).

`async delete(id)` — busca, `404` si no existe, `softDelete`. Igual que roles. La protección contra borrarse a uno mismo **no** está acá, y tiene sentido: el service no sabe quién está haciendo la request. Eso lo ves en el controller (09.7).

Dos cosas que este archivo **no** hace y conviene tener presentes como limitación de esta versión:

- No valida que el `role_id` exista antes de insertar. No hace falta: la FK de la base lo hace cumplir, y el repositorio traduce el error. Validar en el service sería una consulta extra que igual no elimina la carrera (entre el chequeo y el insert alguien puede borrar el rol).
- `update` no re-chequea duplicados de email ni la existencia del rol: delega en la base. Lo que pasa cuando la base rechaza lo ves en la sección siguiente, y es la parte menos prolija del módulo.

### 09.5 `src/modules/users/infrastructure/users.prisma.repository.ts` — implementación Prisma con P2002 y P2003

Misma estructura que el repositorio de roles: `select` tipado, `mapToEntity`, `isPrismaError` y los seis métodos. Lo nuevo está en dos lugares: el `select` anidado del rol y el segundo error mapeado (`P2003`).

```typescript
import { Prisma } from "@prisma/client"
import { prisma } from "@/config/prisma"
import { ConflictError } from "@/core/errors/AppError"
import type { IUserRepository } from "../domain/users.interface"
import type { CreateUserData, IUserEntity, UpdateUserData } from "../domain/users.entities"

const userSelect = {
  id: true,
  name: true,
  email: true,
  password_hash: true,
  role_id: true,
  role: { select: { id: true, name: true } },
  is_active: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
} as const

type UserRecord = Prisma.userGetPayload<{ select: typeof userSelect }>

function mapToEntity(user: UserRecord): IUserEntity {
  return {
    ...user,
    is_active: user.is_active ?? true,
    deleted_at: user.deleted_at ?? null,
  }
}

function isPrismaError(error: unknown, code: string): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
}
```

`userSelect` incluye `password_hash: true` — el repositorio lo trae porque `IUserEntity` lo declara, y `mapToEntity` tiene que cumplir ese contrato. Traerlo no es una fuga: el que decide qué se publica es `mapUserToResponse`, que no lo copia. Si lo sacaras del `select`, el tipo de `mapToEntity` dejaría de cerrar. Esa separación entre "lo que el repositorio trae" y "lo que la API devuelve" es la que permite que el hash exista en memoria sin salir nunca.

`role: { select: { id: true, name: true } }` — el **select anidado**. Prisma entiende la relación declarada en el schema (`user.role`) y arma un objeto con solo esos dos campos, en la misma consulta. No hay un segundo `findMany` sobre roles ni un join escrito a mano: se lo pedís en el `select` y llega adentro de la fila. Pedir `role: true` traería el rol completo (con `description`, `created_at`, `deleted_at`); pedir `role: { select: ... }` trae exactamente lo que la entidad declara.

`type UserRecord = Prisma.userGetPayload<{ select: typeof userSelect }>` — el tipo derivado ahora incluye el objeto anidado, así que `mapToEntity` sabe que `user.role` existe y tiene `id` y `name`.

`function mapToEntity(user: UserRecord): IUserEntity` — `...user` esparce todo (incluido `role`), y después `is_active: user.is_active ?? true` y `deleted_at: user.deleted_at ?? null`. El `is_active ?? true` es una red de seguridad: la columna tiene `@default(true)` en el schema, así que Prisma siempre devuelve un booleano; el `??` cubre el caso de una fila vieja o de un `select` modificado, y elige el default correcto (nunca querés que un usuario quede desactivado por accidente).

`function isPrismaError(error, code)` — idéntico al de roles: `instanceof` + comparación de `code`. Se repite en cada repositorio (en vez de importarse de un helper común) porque cada repositorio mapea códigos distintos a errores distintos; es duplicación chica y local, barata de leer.

Ahora la implementación:

```typescript
export const UserRepository: IUserRepository = {
  async findAll(params) {
    const where: Prisma.userWhereInput = { deleted_at: null }
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
      ]
    }

    const page = params?.page || 1
    const limit = params?.limit || 50
    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, select: userSelect, skip, take: limit, orderBy: { name: "asc" } }),
      prisma.user.count({ where }),
    ])

    return { users: users.map(mapToEntity), total, page, limit }
  },

  async findById(id) {
    const user = await prisma.user.findFirst({ where: { id, deleted_at: null }, select: userSelect })
    return user ? mapToEntity(user) : null
  },

  async findByEmail(email) {
    const user = await prisma.user.findFirst({ where: { email, deleted_at: null }, select: userSelect })
    return user ? mapToEntity(user) : null
  },

  async create(data) {
    try {
      const user = await prisma.user.create({ data, select: userSelect })
      return mapToEntity(user)
    } catch (error) {
      if (isPrismaError(error, "P2002")) {
        throw new ConflictError("Email already registered")
      }
      if (isPrismaError(error, "P2003")) {
        throw new ConflictError("Role does not exist")
      }
      throw error
    }
  },

  async update(id, data) {
    const user = await prisma.user.update({ where: { id }, data, select: userSelect })
    return mapToEntity(user)
  },

  async softDelete(id) {
    await prisma.user.update({ where: { id }, data: { deleted_at: new Date() } })
  },
}
```

`async findAll(params)` — igual que roles, con una diferencia en la búsqueda: `where.OR = [ { name: { contains: ... } }, { email: { contains: ... } } ]`. `OR` es un array de condiciones: la fila entra si cumple **cualquiera**. Se usa para que un solo `?search=ana` encuentre tanto por nombre como por email, sin que el usuario tenga que elegir el campo. Y fijate que el `where` base (`deleted_at: null`) queda **fuera** del `OR`. Si lo metieras adentro, cualquier fila viva cumpliría esa condición sola y la búsqueda dejaría de filtrar: la forma correcta es `{ deleted_at: null, OR: [...] }`, que se lee "vivo **y** (nombre o email)".

`const [users, total] = await Promise.all([...])` — la misma paginación en paralelo: `findMany` con `skip`/`take`/`orderBy` y `count` con el mismo `where`. Si el `where` de una y otra no coincide, `total` miente. Por eso conviene construirlo una vez y pasarlo a las dos.

`async findById` y `async findByEmail` — `findFirst` con `deleted_at: null` y el `: null` final si no encuentran. El `findByEmail` es el que usa el service para el chequeo de duplicados.

`async create(data)` — el `try/catch` con **dos** traducciones:

`if (isPrismaError(error, "P2002")) throw new ConflictError("Email already registered")` — la constraint `user_email_key` rechazó el email repetido. Esto pasa incluso si el service ya chequeó: entre el `findByEmail` y el `insert` hay una ventana en la que otra request puede crear el mismo email. La base es la última palabra, y su error se traduce al mismo mensaje.

`if (isPrismaError(error, "P2003")) throw new ConflictError("Role does not exist")` — acá está lo nuevo. `P2003` es violación de clave foránea: mandaste un `role_id` que no existe en `role`. La base no te deja crear un usuario huérfano. Sin esta traducción, el cliente recibiría un `500` con "Internal server error" y no tendría forma de saber que el problema era el rol. Con la traducción recibe `409` y "Role does not exist", que es accionable: cambiá el `role_id`.

`throw error` al final: si el error no es ninguno de los dos, se relanza. Nunca se traga un error que no se entiende.

`async update(id, data)` — `prisma.user.update({ where: { id }, data, select: userSelect })`, sin `try/catch`. Esto merece un párrafo honesto, porque es una asimetría real del módulo: el `create` está protegido y el `update` no. Consecuencia concreta: si intentás actualizar un usuario poniendo un email que ya existe, o un `role_id` de un rol inexistente, Prisma lanza `P2002`/`P2003`, nadie lo traduce, el `errorHandler` lo trata como error desconocido y el cliente recibe `500`. La regla de negocio existe igual (la base no te deja), pero el status es el equivocado. En el capítulo 10 vas a ver que `products` sí envuelve su `update` en el mismo `try/catch` que el `create`; si querés cerrar este hueco, es copiar esas cuatro líneas. Vale la pena tenerlo claro ahora para no copiar el patrón incompleto en tu propio proyecto.

`async softDelete(id)` — `update` seteando `deleted_at: new Date()`, sin `select` (no importa qué vuelva) y sin `try/catch`. Acá no hay `P2003` que traducir: es un `UPDATE` de una columna que no es clave, y las sesiones y movimientos que apuntan al usuario no se revisan (además, las sesiones ya tienen `onDelete: Cascade` en el schema). Lo que sí queda pendiente es qué pasa con las sesiones abiertas de un usuario borrado; el service de auth las corta en el siguiente `refresh` porque valida `deleted_at` e `is_active` (capítulo 07).

### 09.6 `src/modules/users/presentation/users.dto.ts` — DTOs con uuid y toggle

Los DTO de usuarios agregan tres cosas a los de roles: validación de formato de email, longitud mínima de contraseña y validación de UUID para `role_id`. La idea que hay detrás es siempre la misma: **lo que se puede rechazar sin tocar la base, se rechaza sin tocar la base**. Un `role_id` que no es un UUID no merece una consulta a Postgres.

```typescript
import { z } from "zod"

export const CreateUserDtoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role_id: z.string().uuid("Invalid role id"),
})

export const UpdateUserDtoSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role_id: z.string().uuid().optional(),
})

export const ToggleActiveDtoSchema = z.object({
  is_active: z.boolean(),
})

export const UserQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
})

export type CreateUserDto = z.infer<typeof CreateUserDtoSchema>
export type UpdateUserDto = z.infer<typeof UpdateUserDtoSchema>
```

`name: z.string().min(2, "Name must be at least 2 characters")` — el mismo mínimo que en roles. Un nombre de una letra casi siempre es un error de tipeo.

`email: z.string().email("Invalid email format")` — `.email()` valida forma (algo@algo.algo), no que el correo exista. Que exista no se puede saber sin mandar un mail; eso es otra historia.

`password: z.string().min(8, "Password must be at least 8 characters")` — ocho caracteres como mínimo. La contraseña en claro aparece en dos tipos y en ningún otro lugar: acá y en la firma del `create` del service. **No** se hashea en el DTO: el DTO valida, el service transforma. Si hashearas acá, el schema dejaría de ser una descripción pura de los datos de entrada y no podrías reusarlo (por ejemplo, para testear la validación sola).

`role_id: z.string().uuid("Invalid role id")` — `.uuid()` exige el formato exacto de UUID. Esto filtra el 90% de los errores de tipeo del frontend antes de que lleguen a la base, con un mensaje que dice qué campo está mal.

`UpdateUserDtoSchema` permite cambiar `name`, `email` y `role_id`, todos opcionales. No hay `password` (coherente con `UpdateUserData`) y no hay `is_active`: el estado se cambia por el endpoint de toggle, no por el `PUT`. Esa separación es deliberada: son dos intenciones distintas ("actualizo los datos del empleado" vs "lo doy de baja") y merecen rutas distintas.

`ToggleActiveDtoSchema = z.object({ is_active: z.boolean() })` — un body de un solo campo, booleano obligatorio. No es `optional()` con default: si alguien manda `{}` al toggle, es un error, porque no se sabe qué quiso hacer. `z.boolean()` es estricto: el string `"false"` no pasa; hay que mandar el booleano JSON de verdad.

`UserQuerySchema` — `search`, `page` y `limit` con los mismos defaults y el mismo `.max(100)` que en roles. La paginación se repite en cada módulo porque cada módulo es independiente; si mañana cambia el tope, hay que cambiarlo en los cuatro.

### 09.7 `src/modules/users/presentation/users.controller.ts` — controlador con auto-protección

Los cinco handlers conocidos más uno nuevo: `toggleActive`. Y una regla de negocio que vive acá y no en el service, por una razón que vale la pena discutir.

```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { BadRequestError } from "@/core/errors/AppError"
import { createUserService } from "../application/users.service"
import { UserRepository } from "../infrastructure/users.prisma.repository"
import { CreateUserDtoSchema, ToggleActiveDtoSchema, UpdateUserDtoSchema, UserQuerySchema } from "./users.dto"

const userService = createUserService(UserRepository)

export const usersController = {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const query = UserQuerySchema.parse(request.query)
    const result = await userService.list(query)
    return reply.status(200).send(result)
  },

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string }
    const result = await userService.getById(id)
    return reply.status(200).send(result)
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = CreateUserDtoSchema.parse(request.body)
    const result = await userService.create(body)
    return reply.status(201).send(result)
  },

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string }
    const body = UpdateUserDtoSchema.parse(request.body)
    const result = await userService.update(id, body)
    return reply.status(200).send(result)
  },

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string }
    if (id === request.userId) {
      throw new BadRequestError("You cannot delete your own account")
    }
    await userService.delete(id)
    return reply.status(200).send({ message: "User deleted successfully" })
  },

  async toggleActive(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string }
    const { is_active } = ToggleActiveDtoSchema.parse(request.body)
    const result = await userService.update(id, { is_active })
    return reply.status(200).send(result)
  },
}
```

`import { BadRequestError } from "@/core/errors/AppError"` — el error que faltaba. `BadRequestError` es `400` con `code: "BAD_REQUEST"`, para "la request está mal por una razón que no es el formato".

`const userService = createUserService(UserRepository)` — el mismo cableado de roles: factory + implementación real, una sola vez al cargar el módulo.

`async list` y `async getById` — idénticos a roles: parsear query o params, llamar, `200`.

`async create` — `CreateUserDtoSchema.parse(request.body)` y `201`. El body ya viene con `password` en claro validada; el service se encarga del resto. Notá que el controller **no** toca la contraseña: no la hashea, no la mira. Si algún día ves un `hashPassword` en un controller, eso es una fuga de capa.

`async update` — `UpdateUserDtoSchema.parse(request.body)`: si el body trae `password`, Zod no lo rechaza (por defecto los schemas ignoran las claves que no declaran) y el objeto parseado sale **sin** esa clave. Con lo cual la contraseña se descarta sola en el camino, sin llegar nunca al service. Si quisieras un `400` explícito para un campo que no se puede cambiar, el schema tendría que ser `.strict()`.

`async delete` — acá está la regla:

`if (id === request.userId) { throw new BadRequestError("You cannot delete your own account") }` — compara el id que viene por la ruta con el `userId` que `authGuard` inyectó desde el token. Si son iguales, `400` y la operación no ocurre.

¿Por qué está esta regla? Por dos motivos concretos. Primero, **podés quedarte sin administradores**: si sos el único admin y te borrás, nadie puede volver a crear usuarios ni roles, porque esas rutas requieren `adminGuard`. Recuperar el sistema requeriría entrar a la base a mano. Segundo, **te quedás sin sesión coherente**: tu token sigue diciendo `userId: <tu id>`, pero el usuario ya no existe; el próximo `GET /auth/me` daría `401` y tendrías que volver a loguearte con una cuenta que ya no está.

Y por qué está en el controller y no en el service: necesita saber **quién** hace la request, y esa información (`request.userId`) solo existe en la capa HTTP. El service recibe `id` y no tiene idea de quién lo llama. La alternativa sería pasarle un segundo parámetro (`actorId`) y mover la regla al service; es perfectamente válido y sería más fácil de testear, pero este proyecto eligió el controller porque es el único que ya tiene el dato. Lo que no es negociable es que la regla exista en **un** lugar y no duplicada.

Ojo con el alcance de la regla: bloquea borrarte **a vos mismo**. Otro admin sí puede borrarte, y eso es correcto: la administración de personal es una tarea de administración.

`async toggleActive` — `const { is_active } = ToggleActiveDtoSchema.parse(request.body)` y `userService.update(id, { is_active })`. No hay un método `toggleActive` en el service ni en el contrato del repositorio: el toggle **es** un update de un solo campo. Reusar `update` trae gratis el chequeo de existencia (`404` si el id no existe) y el mapeo de la respuesta.

El efecto de desactivar es inmediato para el login y el refresh: el service de auth rechaza a un usuario con `is_active: false` (capítulo 07). Con un matiz honesto: un access token ya emitido sigue siendo válido hasta que expira (15 minutos), porque es stateless y nadie consulta la base en cada request. Si necesitás corte instantáneo, hay que agregar una verificación por request o una lista de revocados; es el tradeoff que el capítulo 07 ya anticipa.

### 09.8 `src/modules/users/presentation/users.routes.ts` — rutas de administración de usuarios

Seis endpoints, todos de administración, todos con los dos guardias. La única novedad respecto de roles es la ruta `PATCH /:id/active`.

```typescript
import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { usersController } from "./users.controller"
import { adminGuard, authGuard } from "@/modules/auth/application/common/auth.guard"

export const usersRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  fastify.get("/", { preHandler: [authGuard, adminGuard] }, usersController.list)
  fastify.get("/:id", { preHandler: [authGuard, adminGuard] }, usersController.getById)
  fastify.post("/", { preHandler: [authGuard, adminGuard] }, usersController.create)
  fastify.put("/:id", { preHandler: [authGuard, adminGuard] }, usersController.update)
  fastify.patch("/:id/active", { preHandler: [authGuard, adminGuard] }, usersController.toggleActive)
  fastify.delete("/:id", { preHandler: [authGuard, adminGuard] }, usersController.delete)
}
```

`GET /`, `GET /:id`, `POST /`, `PUT /:id`, `PATCH /:id/active`, `DELETE /:id` — las seis con `preHandler: [authGuard, adminGuard]`.

La ruta nueva: `fastify.patch("/:id/active", { preHandler: [authGuard, adminGuard] }, usersController.toggleActive)`. Tres decisiones visibles en una línea:

1. **`PATCH` y no `PUT`.** `PUT` reemplaza el recurso; `PATCH` modifica una parte. Acá cambiás un solo campo de un recurso que tiene siete, así que `PATCH` es el verbo correcto. Es la misma discusión de `roles` al revés: allá se usa `PUT` con body parcial por consistencia, acá se usa `PATCH` porque la ruta declara explícitamente que toca una sola cosa.
2. **`/:id/active` y no `/:id`.** El sub-recurso en la URL dice qué se está modificando. `PATCH /users/123` con `{ is_active: false }` funcionaría, pero no comunica la intención: parece una actualización normalita y en realidad es una baja.
3. **Controller propio (`toggleActive`) y no `update`.** Aunque por dentro llame al mismo `service.update`, el handler tiene su propio DTO (`ToggleActiveDtoSchema`) que exige `is_active` como booleano. Si reusaras el de update, ese body sería válido pero también lo sería `{}`, y un toggle sin valor no significa nada.

Los endpoints para probar a mano, con el `curl` y las cookies del capítulo 07:

- `POST /users` con `name`, `email`, `password` y `role_id` → `201` y el usuario **sin** `password_hash`. Si el rol no existe → `409` "Role does not exist". Si el email ya está → `409` "Email already registered".
- `PATCH /users/:id/active` con `{ "is_active": false }` → `200`; a partir de ahí ese usuario no puede hacer login.
- `DELETE /users/:id` con tu propio id → `400` "You cannot delete your own account".
- `GET /users?search=ana` → busca en nombre **y** email, sin distinguir mayúsculas.
- `GET /users` con un token de un usuario que no es admin → `403`, porque `adminGuard` corta antes del handler.

### Resumen

- El hash se escribe en un solo lugar (el service, con `hashPassword`) y se borra en un solo lugar (el mapper); el repositorio guarda y devuelve `password_hash`, pero la respuesta nunca lo declara, así que TypeScript impide filtrarlo.
- `role_id` es una clave foránea: la base garantiza que el rol exista y `P2003` es el error que avisa cuando no. El repositorio lo traduce a `409` "Role does not exist"; sin traducción, el cliente vería un `500` inútil.
- El `select` anidado `role: { select: { id, name } }` trae el nombre del rol en la misma consulta, y la entidad lo transporta hasta la respuesta sin un segundo viaje a la base.
- Desactivar (`is_active`, con `PATCH /users/:id/active`) y borrar (`deleted_at`) son cosas distintas; el toggle es un `update` de un campo y corta el login en el siguiente intento, aunque un access token ya emitido viva hasta 15 minutos.
- Un admin no puede borrarse a sí mismo: la regla vive en el controller porque necesita `request.userId`, y evita quedarse sin administradores o con una sesión que apunta a un usuario inexistente.

## 10. Módulo products

Hasta acá los datos eran texto, un booleano y una fecha: nada que pudiera salir mal por cómo se representa. `products` cambia eso, porque introduce **dinero**. Un producto tiene precio y costo, y el precio de un producto es un número con dos decimales exactos. Y ahí aparece el primer problema serio de todo el manual que no se arregla escribiendo un `if`.

El problema es este: en JavaScript los números son de coma flotante binaria. Eso significa que no pueden representar `0.1` exactamente, igual que en decimal no podés escribir `1/3` exacto. Sumá dos precios y mirá:

```js
> 0.1 + 0.2
0.30000000000000004
```

En un punto de venta eso es un desastre: sumás tres ítems de `0.10` y el total da `0.30000000000000004`, la caja no cierra, el cliente discute. La solución no es redondear al mostrar (tarde o temprano redondeás mal) sino **guardar el dinero en un tipo decimal exacto y convertirlo a número solo en el borde**.

Por eso el proyecto usa dos representaciones para el mismo dato, y elegir cuál va en cada lugar es la mitad de este capítulo:

- **En la base y en el dominio: `Decimal`.** Postgres tiene `numeric(10, 2)`: hasta 10 dígitos con 2 decimales, exacto, sin coma flotante. Prisma lo mapea a un objeto `Decimal` de la librería `decimal.js`, que guarda el valor como dígitos, no como bits.
- **En el JSON de la respuesta: `number`.** JSON no tiene un tipo decimal: solo tiene números (que en la práctica son flotantes) y strings. No podés mandar un `Decimal` por la red. Y si lo mandaras sin convertirlo, `JSON.stringify` lo convierte en **string** (`"10.5"`), así que el cliente recibiría `typeof price === "string"` y cualquier cuenta del frontend daría `NaN` en silencio. Un bug de dinero que nadie ve hasta que cierra la caja.

La conversión ocurre en **un solo lugar**: el mapper. Y esa es la regla de oro del capítulo, porque significa que hay exactamente un punto donde el dinero cruza la frontera. Si la conversión estuviera en el service y también en el controller, tarde o temprano uno de los dos se olvida de un campo.

Las otras novedades del módulo:

- **`barcode` es único, nullable y opcional.** Un producto puede no tener código de barras (granel, un ítem cargado a mano), y dos productos sin barcode **no** chocan entre sí: en SQL, `NULL` no es igual a `NULL`, así que el unique constraint los deja pasar. Un producto sí choca con otro que tenga el mismo barcode.
- **Doble manejo de `P2002`.** El repositorio y el service traducen el error de unicidad, cada uno con su propio type guard. Suena redundante; el por qué tiene su propia explicación más abajo.
- **Búsqueda en dos columnas con `OR`.** `?search=` busca en el nombre o en el barcode a la vez.
- **`stock` y `low_stock_threshold`.** Son la semilla del módulo de inventario (capítulo 12): acá se crean con un valor inicial, y a partir de ahí los mueve el inventario, no el CRUD.
- **Solo `authGuard`.** Cualquier usuario logueado —admin o staff— puede operar el catálogo. Es el primer módulo de datos del manual que no pide admin.

El contrato del repositorio (`products.interface.ts`) no aparece en este capítulo por la misma razón que el de usuarios: es el de roles con `findByBarcode` en lugar de `findByName` como única diferencia.

### 10.1 `src/modules/products/domain/products.entities.ts` — entidades con Decimal

La entidad de producto es donde el `Decimal` aparece por primera vez, y el import es tan importante como los campos: se trae el **tipo**, no la librería.

```typescript
import type { Decimal } from "@prisma/client/runtime/library"

export interface IProductEntity {
  id: string
  barcode: string | null
  name: string
  price: Decimal
  cost: Decimal | null
  stock: number
  low_stock_threshold: number
  active: boolean
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export type CreateProductData = {
  barcode?: string | null
  name: string
  price: number
  cost?: number | null
  stock?: number
  low_stock_threshold?: number
  active?: boolean
}

export type UpdateProductData = {
  barcode?: string | null
  name?: string
  price?: number
  cost?: number | null
  low_stock_threshold?: number
  active?: boolean
}
```

`import type { Decimal } from "@prisma/client/runtime/library"` — el `type` hace que esta importación desaparezca al compilar. El dominio declara que sus precios son `Decimal`, pero no arrastra `decimal.js` al runtime: el dominio no ejecuta nada, solo describe. La ruta de import (`@prisma/client/runtime/library`) es la que Prisma expone para el tipo del Decimal; no lo importes de `decimal.js` directamente o vas a tener dos versiones del mismo tipo y TypeScript se va a quejar cuando compares uno con otro.

`price: Decimal` — obligatorio. Un producto sin precio no existe en un punto de venta.

`cost: Decimal | null` — el costo es opcional: al cargar un producto puede que todavía no sepas cuánto te salió. Es `null`, no `0`, porque `0` significa "me salió gratis" y `null` significa "no sé". Dos cosas distintas, dos valores distintos.

`stock: number` y `low_stock_threshold: number` — `Int` en la base, `number` en TypeScript. Acá no hay problema de decimales: las unidades son enteras. `low_stock_threshold` es el umbral: cuando `stock` baja de ese número, el producto entra en la lista de "stock bajo" del capítulo 12.

`active: boolean` — un producto discontinuado se marca inactivo en vez de borrarse. Es el mismo patrón que `is_active` en usuarios, con otro nombre.

`export type CreateProductData` — acá está el detalle fino: **`price: number`, no `Decimal`**. El dato llega por HTTP como número (JSON no tiene Decimal), el DTO lo valida como número, y Prisma se encarga de convertirlo al insertar. Si pidieras `Decimal` en la entrada, el controller tendría que construir un `Decimal` a mano y la conversión se te escaparía del mapper en la dirección equivocada.

`stock?: number` y `low_stock_threshold?: number` y `active?: boolean` opcionales, porque los defaults (`0`, `5`, `true`) los pone el schema de Zod y, en última instancia, la base.

`barcode?: string | null` — opcional y anulable: podés crear un producto sin código de barras.

`export type UpdateProductData` — `barcode`, `name`, `price`, `cost`, `low_stock_threshold` y `active`, todos opcionales. Y falta `stock`, a propósito: en este proyecto el stock **no se edita por el CRUD**. Se mueve con movimientos de inventario, que son auditables y atómicos (capítulo 12). Si dejaras `stock` en el update, cualquiera podría poner `stock: 9999` sin dejar rastro de por qué. Que el tipo no lo permita es la primera defensa de esa regla.

### 10.2 `src/modules/products/domain/products.types.ts` — respuesta con número en vez de Decimal

La respuesta es la promesa del contrato hacia el cliente, y en este módulo la promesa es concreta: `price` y `cost` son `number`. Ni `Decimal`, ni string, ni `undefined`.

```typescript
export interface IProductResponse {
  id: string
  barcode: string | null
  name: string
  price: number
  cost: number | null
  stock: number
  low_stock_threshold: number
  active: boolean
  created_at: Date
  updated_at: Date
}

export interface IProductListResponse {
  products: IProductResponse[]
  total: number
  page: number
  limit: number
}
```

`price: number` y `cost: number | null` — la única diferencia de tipos con la entidad, y es toda la razón de ser de este archivo. Del otro lado del cable hay un cliente (un frontend, una app, un script) que va a hacer `producto.price * cantidad`. Si recibiera `"10.5"`, la multiplicación funcionaría por coerción… hasta que no. Y si recibiera el objeto `Decimal` serializado, multiplicaría un objeto por un número y obtendría `NaN`.

Ojo con lo que `number` **no** promete: no promete que el cliente vea dos decimales. Promete que es un número y que vale lo mismo que el `Decimal` guardado, para cualquier valor que entre en `numeric(10, 2)`. Que el frontend muestre `10.50` y no `10.5` es formato de presentación, y se resuelve al dibujar.

`barcode: string | null` — el barcode no cargado se normaliza a `null` en el mapper, así el cliente tiene un solo valor que chequear y no dos (`undefined` y `null`).

`IProductListResponse` — el envelope habitual con `products`, `total`, `page` y `limit`.

Fijate que la respuesta **no** expone `deleted_at` (igual que en roles y users) y **sí** expone `active`, porque `active` es una decisión de negocio que el cliente necesita ver: un producto inactivo no se debería poder vender.

### 10.3 `src/modules/products/application/common/products.mappers.ts` — mapper Decimal → number

Este archivo tiene una sola función y nueve líneas de lógica, y es probablemente el más importante del capítulo. Todo el dinero del sistema pasa por acá, en una sola dirección.

```typescript
import type { IProductEntity } from "../../domain/products.entities"
import type { IProductResponse } from "../../domain/products.types"

export function mapProductToResponse(product: IProductEntity): IProductResponse {
  return {
    id: product.id,
    barcode: product.barcode ?? null,
    name: product.name,
    price: Number(product.price),
    cost: product.cost ? Number(product.cost) : null,
    stock: product.stock,
    low_stock_threshold: product.low_stock_threshold,
    active: product.active,
    created_at: product.created_at,
    updated_at: product.updated_at,
  }
}
```

`price: Number(product.price)` — `Number()` recibe el objeto `Decimal` y lo convierte usando su `valueOf()`, que devuelve la representación decimal del valor. `10.50` se convierte en el número `10.5` (el cero final se pierde: los números de JavaScript no guardan "cuántos decimales querías mostrar"; si el frontend necesita mostrar dos decimales, los formatea él).

`cost: product.cost ? Number(product.cost) : null` — acá hay un detalle que parece menor y no lo es. La condición es sobre `product.cost`, que es un **objeto** `Decimal` o `null`. Un `Decimal` de valor `0` sigue siendo un objeto, y en JavaScript todos los objetos son *truthy*, así que `cost: 0` entra por la rama buena y se convierte en `0`. Si hubieras escrito `Number(product.cost) ? ...`, un costo de `0` se convertiría en `null` y habrías perdido el dato. La diferencia entre chequear el objeto y chequear el número es un bug real esperando en muchísimos mappers.

`barcode: product.barcode ?? null` — normaliza `undefined` a `null`, igual que en roles con `description`.

El resto pasa tal cual: `stock`, `low_stock_threshold`, `active`, fechas. Y `deleted_at` no aparece.

**Por qué la conversión vive acá y en ningún otro lado:** porque este es el único punto por el que pasa cada producto que sale del servidor —el de `getById`, el de `create`, el de `update` y cada elemento de `list`, que usa `.map(mapProductToResponse)`. Un solo lugar que auditar, un solo lugar que testear, un solo lugar donde cambiar el redondeo si algún día hace falta. Y si un campo nuevo de tipo `Decimal` se agrega a la entidad, este archivo deja de compilar hasta que decidas cómo convertirlo.

Sobre el redondeo: `numeric(10, 2)` garantiza que en la base no hay más de dos decimales, así que `Number()` no te va a devolver `10.499999999`. La exactitud la sostiene Postgres; el mapper solo cambia la representación. Si tuvieras que calcular algo con dinero (impuestos, descuentos), el cálculo se hace en `Decimal` y recién el resultado se convierte al final; hacer cuentas en `number` y convertir después es volver al problema del principio.

### 10.4 `src/modules/products/application/products.service.ts` — reglas de negocio con doble P2002

El service de productos repite la forma de roles y users con un cambio de estrategia: **no hay chequeo previo de duplicados**. No hay `findByBarcode` antes del `create`. La base es la única fuente de verdad sobre la unicidad, y el service se limita a traducir el error que la base devuelva.

Primero la cabecera:

```typescript
import { Prisma } from "@prisma/client"
import { ConflictError, NotFoundError } from "@/core/errors/AppError"
import type { CreateProductData, UpdateProductData } from "../domain/products.entities"
import type { IProductListResponse, IProductResponse } from "../domain/products.types"
import type { IProductRepository } from "../domain/products.interface"
import { mapProductToResponse } from "./common/products.mappers"

function isUniqueConstraintError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}
```

`import { Prisma } from "@prisma/client"` — acá se importa **código**, no solo tipos: el type guard necesita `Prisma.PrismaClientKnownRequestError` en tiempo de ejecución para el `instanceof`.

`function isUniqueConstraintError(error: unknown): error is Prisma.PrismaClientKnownRequestError` — un type guard local que ya trae el código fijo (`"P2002"`), a diferencia del de los repositorios, que recibe el código por parámetro. Menos flexible y más seguro: acá no hay forma de preguntar por el código equivocado.

Ahora el service:

```typescript
export const createProductService = (repository: IProductRepository) => ({
  async list(params?: { search?: string; active?: boolean; page?: number; limit?: number }): Promise<IProductListResponse> {
    const result = await repository.findAll(params)
    return {
      products: result.products.map(mapProductToResponse),
      total: result.total,
      page: result.page,
      limit: result.limit,
    }
  },

  async getById(id: string): Promise<IProductResponse> {
    const product = await repository.findById(id)
    if (!product) {
      throw new NotFoundError("Product not found")
    }
    return mapProductToResponse(product)
  },

  async create(data: CreateProductData): Promise<IProductResponse> {
    try {
      const product = await repository.create(data)
      return mapProductToResponse(product)
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError("Barcode already exists")
      }
      throw error
    }
  },

  async update(id: string, data: UpdateProductData): Promise<IProductResponse> {
    const existing = await repository.findById(id)
    if (!existing) {
      throw new NotFoundError("Product not found")
    }
    try {
      const product = await repository.update(id, data)
      return mapProductToResponse(product)
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError("Barcode already exists")
      }
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    const existing = await repository.findById(id)
    if (!existing) {
      throw new NotFoundError("Product not found")
    }
    await repository.softDelete(id)
  },
})
```

`async list(params?: { search?: string; active?: boolean; page?: number; limit?: number })` — igual que siempre, con un parámetro nuevo: `active`, opcional. Cuando viene, filtra por estado; cuando no viene, trae los dos. La distinción entre "no filtrar" y "filtrar por `false`" es la razón por la que el tipo es `boolean | undefined` y no `boolean` con default: `undefined` es "no me importa", `false` es "quiero los inactivos".

`repository.findAll(params)` y el envelope mapeado. Nada nuevo.

`async getById(id)` — `null` → `NotFoundError("Product not found")` → `404`.

`async create(data: CreateProductData)` — el `try` envuelve `repository.create(data)` y el `return mapProductToResponse(product)`. El `catch` pregunta `isUniqueConstraintError(error)`: si es, `ConflictError("Barcode already exists")`; si no, `throw error`.

Y acá está la pregunta que corresponde hacerse: si el repositorio **ya** traduce `P2002` a `ConflictError`, ¿qué hace este `catch`? En la práctica, nada: el error que llega desde el repositorio de Prisma es un `ConflictError`, no un `P2002`, así que `isUniqueConstraintError` devuelve `false` y el `throw error` lo deja pasar con el mensaje del repositorio. El `catch` es una **segunda red**, y su valor es de diseño: el service no depende de que el repositorio haya mapeado nada. Si mañana cambiás el repositorio por otro driver, o si en un test usás un fake que deja pasar el error crudo de Prisma, el service igual responde `409` con el mensaje correcto. La regla de negocio es del service; la traducción específica de Prisma es un detalle de infraestructura. Que las dos existan es barato y hace que el módulo sea más difícil de romper.

¿Y por qué no hay `findByBarcode` previo, como el `findByName` de roles? Por tres razones:

1. **`barcode` es nullable.** Un chequeo previo tendría que decidir qué hacer cuando no viene barcode; con `null` no hay nada que comparar y la consulta sería código muerto para el caso más común en productos cargados a mano.
2. **No elimina la carrera.** Entre el chequeo y el `insert` hay una ventana; dos requests simultáneas pueden pasar las dos por el chequeo y chocar en la base. La constraint es la que realmente garantiza la unicidad, y el chequeo previo solo servía para dar un mensaje más lindo en el caso lento.
3. **Ahorra una query por cada alta.** En un catálogo que se carga de a cientos de productos (importación de proveedor), esa query se nota.

Sobre "barcode vs nombre": en el schema, `barcode` es el único campo con `@unique`; `name` no lo es. Dos productos pueden llamarse igual (por ejemplo, dos presentaciones cargadas con el mismo nombre). Por eso el único `P2002` que la base puede producir en esta tabla es el del barcode, y por eso los dos manejos hablan siempre de `"Barcode already exists"`. Si algún día agregás `@unique` a `name`, este mensaje pasaría a mentir y habría que mirar `error.meta.target` para saber qué constraint falló. Vale la pena saberlo antes de tocar el schema.

`async update(id, data)` — primero `findById` para el `404` de un id inexistente, y después el mismo `try/catch` de unicidad que el `create`. Acá sí cierra el hueco que quedaba abierto en `users`: cambiar el barcode de un producto a uno ya usado devuelve `409`, no `500`.

`async delete(id)` — `404` si no existe y `softDelete`. Igual que los otros módulos.

### 10.5 `src/modules/products/infrastructure/products.prisma.repository.ts` — repo con búsqueda OR

Misma receta que roles y users: `select` tipado, `mapToEntity`, `isPrismaError` y los seis métodos. Lo propio de productos está en el `where`: dos columnas de búsqueda y un filtro booleano opcional.

```typescript
import { Prisma } from "@prisma/client"
import { prisma } from "@/config/prisma"
import { ConflictError } from "@/core/errors/AppError"
import type { IProductRepository } from "../domain/products.interface"
import type { CreateProductData, IProductEntity, UpdateProductData } from "../domain/products.entities"

const productSelect = {
  id: true,
  barcode: true,
  name: true,
  price: true,
  cost: true,
  stock: true,
  low_stock_threshold: true,
  active: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
} as const

type ProductRecord = Prisma.productGetPayload<{ select: typeof productSelect }>

function mapToEntity(product: ProductRecord): IProductEntity {
  return {
    ...product,
    barcode: product.barcode ?? null,
    cost: product.cost ?? null,
    deleted_at: product.deleted_at ?? null,
  }
}

function isPrismaError(error: unknown, code: string): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
}
```

`productSelect` incluye `price: true` y `cost: true`. Con el `select`, Prisma devuelve esos dos como `Decimal`, y el tipo `ProductRecord` lo refleja; por eso `mapToEntity` puede pasarlos tal cual a la entidad (que también los declara `Decimal`) sin conversión. La conversión a `number` es responsabilidad del mapper de respuesta, no de este.

`function mapToEntity(product: ProductRecord): IProductEntity` — `...product` y tres normalizaciones: `barcode`, `cost` y `deleted_at` a `null` si vienen `undefined`. Notá que **no** convierte `price` ni `cost` a número: la entidad los quiere como `Decimal` y así vienen (a `cost` solo lo normaliza a `null` si llegara `undefined`). Si acá convirtieras a `number`, la entidad estaría mintiendo sobre su tipo y el mapper de respuesta no tendría nada que hacer.

`isPrismaError(error, code)` — el mismo helper de roles, con el código por parámetro. Se repite en cada repositorio; es duplicación aceptada porque mantiene cada infraestructura legible de arriba a abajo sin saltar a un archivo común.

Ahora la implementación:

```typescript
export const ProductRepository: IProductRepository = {
  async findAll(params) {
    const where: Prisma.productWhereInput = { deleted_at: null }
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { barcode: { contains: params.search, mode: "insensitive" } },
      ]
    }
    if (params?.active !== undefined) {
      where.active = params.active
    }

    const page = params?.page || 1
    const limit = params?.limit || 50
    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, select: productSelect, skip, take: limit, orderBy: { name: "asc" } }),
      prisma.product.count({ where }),
    ])

    return { products: products.map(mapToEntity), total, page, limit }
  },

  async findById(id) {
    const product = await prisma.product.findFirst({ where: { id, deleted_at: null }, select: productSelect })
    return product ? mapToEntity(product) : null
  },

  async create(data) {
    try {
      const product = await prisma.product.create({ data, select: productSelect })
      return mapToEntity(product)
    } catch (error) {
      if (isPrismaError(error, "P2002")) {
        throw new ConflictError("Barcode already exists")
      }
      throw error
    }
  },

  async update(id, data) {
    try {
      const product = await prisma.product.update({ where: { id }, data, select: productSelect })
      return mapToEntity(product)
    } catch (error) {
      if (isPrismaError(error, "P2002")) {
        throw new ConflictError("Barcode already exists")
      }
      throw error
    }
  },

  async softDelete(id) {
    await prisma.product.update({ where: { id }, data: { deleted_at: new Date() } })
  },
}
```

`async findAll(params)` — arma el `where` en tres pasos:

`const where: Prisma.productWhereInput = { deleted_at: null }` — el filtro de vivos, igual que en todos los módulos.

`if (params?.search) { where.OR = [...] }` — la búsqueda multicampo:

`{ name: { contains: params.search, mode: "insensitive" } }` y `{ barcode: { contains: params.search, mode: "insensitive" } }`. `OR` significa "cualquiera de estas condiciones", así que un solo `?search=779` encuentra los productos cuyo nombre contiene "779" o cuyo barcode contiene "779". Es lo que un vendedor espera: pegar el código de barras y que aparezca, escriba el nombre o escanee.

`mode: "insensitive"` en `barcode` no es obvio —los códigos son dígitos— pero no molesta y hace que un barcode con letras (EAN alfanumérico, códigos internos) también se encuentre sin importar mayúsculas.

`if (params?.active !== undefined) { where.active = params.active }` — la comparación es contra `undefined` y no `if (params?.active)`. Si escribieras `if (params.active)`, un `?active=false` no filtraría nada, porque `false` es *falsy*: el `if` no entraría y te devolvería los productos activos, que es exactamente lo contrario de lo que pidió el cliente. Es un bug clásico de filtros booleanos, y la forma de evitarlo es comparar con `undefined` (o con `!== null`).

`const page = params?.page || 1`, `limit || 50`, `skip = (page - 1) * limit` — la misma paginación de siempre.

`const [products, total] = await Promise.all([...])` — `findMany` con el `where` (que puede tener `OR` y `active`), `select`, `skip`, `take` y `orderBy: { name: "asc" }`; y `count` con **el mismo** `where`. Si el `count` usara un `where` distinto, `total` no coincidiría con lo que el cliente puede recorrer y la paginación se rompería en la última página.

`async findById(id)` — `findFirst` con `deleted_at: null`, `null` si no hay.

`async create(data)` y `async update(id, data)` — `try/catch` con `P2002` → `ConflictError("Barcode already exists")`. Mismo mensaje en los dos: para el cliente, "ese código ya está en uso" es la misma información en un alta o en una edición. `throw error` para todo lo demás.

`async softDelete(id)` — `update` con `deleted_at: new Date()`. Sin `try/catch`: en esta tabla no hay FKs entrantes declaradas con restricción que puedan hacer saltar un `P2003` en el borrado lógico (los movimientos de inventario apuntan al producto, pero no se toca el producto en sí). El producto borrado sigue existiendo y sus movimientos históricos siguen apuntándolo.

### 10.6 `src/modules/products/presentation/products.dto.ts` — validación de producto y query

Los DTO de productos tienen que resolver un problema nuevo: los **defaults**. En roles, si no mandabas `description`, quedaba `null`. En productos, si no mandás `stock`, tiene que ser `0`; si no mandás `low_stock_threshold`, tiene que ser `5`; si no mandás `active`, tiene que ser `true`. Esos valores son reglas del negocio tanto como "el precio debe ser positivo", y por eso viven acá y no repartidos en `if`s por el código.

```typescript
import { z } from "zod"

export const CreateProductDtoSchema = z.object({
  barcode: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  price: z.number().positive("Price must be greater than zero"),
  cost: z.number().nonnegative().optional(),
  stock: z.number().int().nonnegative().optional().default(0),
  low_stock_threshold: z.number().int().nonnegative().optional().default(5),
  active: z.boolean().optional().default(true),
})

export const UpdateProductDtoSchema = z.object({
  barcode: z.string().nullable().optional(),
  name: z.string().min(2).optional(),
  price: z.number().positive().optional(),
  cost: z.number().nonnegative().nullable().optional(),
  low_stock_threshold: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
})

export const ProductQuerySchema = z.object({
  search: z.string().optional(),
  active: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
})

export type CreateProductDto = z.infer<typeof CreateProductDtoSchema>
export type UpdateProductDto = z.infer<typeof UpdateProductDtoSchema>
```

`barcode: z.string().optional()` — opcional, pero **no** `nullable()` en la creación. Para decir "sin barcode" alcanza con no mandarlo; un `null` explícito en un alta no aporta nada. En el update sí se acepta `null` (lo ves abajo) porque ahí significa "borrá el que tenía".

`name: z.string().min(2, "Name must be at least 2 characters")` — sin `max`, a diferencia de roles. Es una inconsistencia menor del proyecto: un nombre de 10 000 caracteres pasaría la validación. Si querés endurecerlo, `.max(150)` y listo.

`price: z.number().positive("Price must be greater than zero")` — `positive()` rechaza `0` y negativos. Un producto a precio `0` es casi siempre un error de carga; si necesitás regalar algo, se hace con un descuento del 100%, no con precio cero. El mensaje es explícito y el cliente lo va a mostrar tal cual.

`cost: z.number().nonnegative().optional()` — `nonnegative()` acepta `0` (un costo cero puede ser real: merchandising que te regalan) pero no negativos. Opcional: no siempre se conoce.

`stock: z.number().int().nonnegative().optional().default(0)` — entero, no negativo, default `0`. `.int()` es importante: `stock: 2.5` no significa nada cuando vendés unidades.

`low_stock_threshold: ...optional().default(5)` — el umbral por defecto es 5. Es una decisión de negocio (¿cuándo avisamos que hay que reponer?), y tenerla como default acá significa que se puede cambiar por producto sin tocar código.

`active: z.boolean().optional().default(true)` — todo producto nuevo nace activo. Si quisieras cargar un producto sin publicarlo, mandás `false`.

`UpdateProductDtoSchema` — todo opcional, y dos campos aceptan `null`: `barcode: z.string().nullable().optional()` y `cost: z.number().nonnegative().nullable().optional()`. El `null` es la forma de **vaciar** un campo que ya tenía valor: sin él no podrías quitarle el código de barras a un producto. `stock` no aparece, coherente con `UpdateProductData`: el stock lo mueve el inventario.

`ProductQuerySchema` — `search`, el filtro `active` y la paginación:

`active: z.enum(["true", "false"]).optional()` — acá hay una decisión que conviene entender, porque la alternativa parece más natural y es una trampa. Zod tiene `z.coerce.boolean()`, que convierte el string del query a booleano. El problema: usa `Boolean(...)`, y `Boolean("false")` es **`true`** (cualquier string no vacío es *truthy*). O sea que `?active=false` te devolvería los activos. La solución es no coercionar: se valida que el texto sea exactamente `"true"` o `"false"` con un `enum`, y la traducción a booleano se hace explícitamente en el controller, donde se ve. Si llega `?active=1`, el `enum` lo rechaza con `400` en vez de adivinar.

`page` y `limit` — iguales a todos los módulos, con `.max(100)`.

### 10.7 `src/modules/products/presentation/products.controller.ts` — controlador

El controller de productos es el de roles con una línea distinta: la traducción de `active` de string a booleano. Esa línea es, literalmente, la frontera entre "lo que viaja por HTTP" y "lo que entiende el negocio".

```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { createProductService } from "../application/products.service"
import { ProductRepository } from "../infrastructure/products.prisma.repository"
import { CreateProductDtoSchema, ProductQuerySchema, UpdateProductDtoSchema } from "./products.dto"

const productService = createProductService(ProductRepository)

export const productsController = {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const query = ProductQuerySchema.parse(request.query)
    const result = await productService.list({
      ...query,
      active: query.active === undefined ? undefined : query.active === "true",
    })
    return reply.status(200).send(result)
  },

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string }
    const result = await productService.getById(id)
    return reply.status(200).send(result)
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = CreateProductDtoSchema.parse(request.body)
    const result = await productService.create(body)
    return reply.status(201).send(result)
  },

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string }
    const body = UpdateProductDtoSchema.parse(request.body)
    const result = await productService.update(id, body)
    return reply.status(200).send(result)
  },

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string }
    await productService.delete(id)
    return reply.status(200).send({ message: "Product deleted successfully" })
  },
}
```

`const productService = createProductService(ProductRepository)` — el cableado de siempre.

`async list(request, reply)` — acá está lo nuevo:

`const query = ProductQuerySchema.parse(request.query)` — valida que `active` sea `"true"` o `"false"` (o no venga), y que `page`/`limit` sean números válidos.

`productService.list({ ...query, active: query.active === undefined ? undefined : query.active === "true" })` — el objeto que se pasa al service tiene `search`, `page` y `limit` igual que `query`, pero `active` se reemplaza por un booleano de verdad. Tres detalles:

- `...query` copia todo primero, y `active:` va después. En un objeto literal, **la última clave gana**: si pusieras `active` antes del spread, el `"true"` string pisaría tu booleano. El orden de las propiedades acá no es estilo, es semántica.
- `query.active === undefined ? undefined : ...` distingue "no me mandaron filtro" de "me mandaron `false`". Si escribieras `query.active === "true"`, cuando no viene `active` obtendrías `false` y filtrarías por inactivos sin que nadie lo haya pedido.
- `query.active === "true"` es la traducción explícita: string `"true"` → `true`; cualquier otra cosa validada (`"false"`) → `false`.

`async getById` — params, service, `200`.

`async create` — `CreateProductDtoSchema.parse(request.body)` y `201`. El body ya trae `price` como número validado; el service lo pasa a `CreateProductData`, Prisma lo convierte a `Decimal` al insertar y el mapper lo devuelve como número. El precio entra y sale como número: el `Decimal` es un asunto interno de la base.

`async update` — params + body, `200`.

`async delete` — params, service, `200` con `{ message: "Product deleted successfully" }`.

Ningún handler toca `price`, `cost` ni `Decimal`: si un controller empieza a hacer cuentas con dinero, la lógica se está escapando de capa.

### 10.8 `src/modules/products/presentation/products.routes.ts` — rutas autenticadas (cualquier rol)

Última pieza del módulo, y la que marca la diferencia de política con los dos anteriores: acá solo va `authGuard`. No hay `adminGuard` en ninguna de las cinco rutas.

```typescript
import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { productsController } from "./products.controller"
import { authGuard } from "@/modules/auth/application/common/auth.guard"

export const productsRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  fastify.get("/", { preHandler: [authGuard] }, productsController.list)
  fastify.get("/:id", { preHandler: [authGuard] }, productsController.getById)
  fastify.post("/", { preHandler: [authGuard] }, productsController.create)
  fastify.put("/:id", { preHandler: [authGuard] }, productsController.update)
  fastify.delete("/:id", { preHandler: [authGuard] }, productsController.delete)
}
```

`import { authGuard } from "@/modules/auth/application/common/auth.guard"` — solo un guardia importado. Si te olvidás de `adminGuard` en roles o users, el agujero es grave; si te olvidás de agregarlo acá, no pasa nada, porque la decisión es no tenerlo.

Las cinco líneas: `GET /products`, `GET /products/:id`, `POST /products`, `PUT /products/:id`, `DELETE /products/:id`, todas con `preHandler: [authGuard]`. Es el CRUD completo, abierto a cualquier usuario autenticado.

La comparación con los otros módulos explica la política entera del sistema:

- **`roles` y `users` piden `[authGuard, adminGuard]`.** Son administración: quién existe y qué permisos tiene. Si un vendedor pudiera crearse un rol `admin` o cambiarle el rol a otro, la autorización no serviría para nada.
- **`products` pide solo `[authGuard]`.** Es operación diaria: quien atiende el mostrador tiene que poder buscar un precio, cargar un producto nuevo que llegó sin código o corregir un nombre mal escrito. Pedirle admin para eso volvería inútil el sistema en hora pico.

Y la consecuencia que hay que mirar de frente: con esta configuración, **cualquier usuario logueado puede borrar un producto**. Es una decisión del proyecto, no un olvido, y se sostiene en dos cosas: el borrado es lógico (nadie pierde el historial, el producto se puede "revivir" limpiando `deleted_at` desde la base) y el catálogo no es información sensible. Si tu negocio necesita otra política, este es exactamente el archivo donde se cambia: agregar `adminGuard` a `POST`, `PUT` y `DELETE` y dejar solo `authGuard` en los `GET` es una línea por ruta. Lo que no se hace es poner la regla en el controller: la autorización se declara en la ruta, donde se lee de un vistazo.

Pruebas a mano que vale la pena correr:

- `GET /products?search=coca` → busca en nombre y barcode.
- `GET /products?active=false` → devuelve los inactivos (y no los activos: es el caso que rompe si alguien usa `z.coerce.boolean`).
- `POST /products` con `{ "name": "Coca 500", "price": 1200.5 }` → `201`, `stock: 0`, `low_stock_threshold: 5`, `active: true`, `barcode: null`.
- `POST /products` repitiendo un barcode existente → `409` "Barcode already exists".
- `POST /products` con `{ "price": 0 }` → `400` "price: Price must be greater than zero".
- `PUT /products/:id` con `{ "barcode": null }` → le quita el código de barras.

### Resumen

- El dinero se guarda como `Decimal` (`numeric(10, 2)` en Postgres) porque los números de JavaScript son flotantes y `0.1 + 0.2` no da `0.3`; viaja al cliente como `number` porque JSON no tiene decimales, y esa conversión ocurre **solo** en `mapProductToResponse`.
- Si el mapper no existiera, `JSON.stringify` de un `Decimal` sale como string (`"10.5"`) y el cliente haría cuentas con texto: un bug de dinero silencioso. En el mapper, la condición `product.cost ? ...` es sobre el objeto `Decimal` y no sobre el número, para no perder un costo de `0`.
- `barcode` es único y nullable: dos productos sin código no chocan, y el único `P2002` posible en la tabla es el del barcode (porque `name` no es único). El repositorio lo traduce a `ConflictError` y el service mantiene su propia red para no depender del repositorio, tanto en `create` como en `update`.
- `where.OR` busca en nombre o barcode a la vez, `params.active !== undefined` distingue "no filtrar" de "filtrar por `false`", y el DTO usa `z.enum(["true","false"])` en lugar de `z.coerce.boolean()` porque `Boolean("false")` es `true`.
- `stock` y `low_stock_threshold` nacen acá con defaults (`0` y `5`) pero el stock no se edita por el CRUD: lo mueve el inventario (capítulo 12). Y las cinco rutas piden solo `authGuard`, porque el catálogo es trabajo de cualquiera que atienda, mientras que roles y usuarios son administración.


## 11. Módulo services

Un punto de venta no vende solo cosas: también vende trabajo. Un corte de cabello, una
reparación, una hora de consultoría. Ese es el catálogo de servicios: nombre, descripción, un
precio base y un estado. Nada más. Y justamente por ser tan simple, es el mejor lugar del
manual para aprender algo que vas a usar toda tu carrera: **cómo se lee un módulo nuevo**.

Porque el atajo es este: un módulo no se lee desde cero, se lee **por sus diferencias** con el
que ya entendiste. Si venís leyendo en orden, ya escribiste roles, usuarios y productos.
Entonces abrís la carpeta `services`, ves la misma estructura de siempre —`domain`,
`application`, `infrastructure`, `presentation`— y lo único que tenés que buscar es qué
cambió. Y lo que cambió está en la base de datos, no en los archivos de TypeScript.

| | productos (capítulo 10) | servicios (capítulo 11) |
|---|---|---|
| columnas únicas | `barcode` es `@unique` | ninguna |
| dinero | `price` (y `cost`, opcional) | `base_price` |
| errores de base que puede lanzar | P2002 (unique violado), P2003 (clave foránea) | ninguno |
| ¿traduce errores de Prisma? | sí | no |

Leé esa tabla de arriba hacia abajo y fijate cómo una sola decisión de esquema arrastra todo
lo demás. En `product`, el `barcode` es único: la base rechaza dos productos con el mismo
código, y ese rechazo llega al servidor como un error P2002 que alguien tiene que traducir a
un 409 "Barcode already exists". En `service` no hay ninguna columna única: dos servicios
pueden llamarse "Corte de cabello" (uno por sucursal, uno para dama y otro para niño, uno
viejo que nadie borró). Entonces la base nunca va a rechazar nada por duplicado, y el
repositorio **no tiene nada que traducir**. Esa es toda la diferencia entre un módulo con
manejo de conflictos y un módulo limpio.

¿Y por qué el precio sigue siendo `Decimal` igual que en productos? Porque el dinero es
dinero en las dos tablas. Lo que cambia es el nombre de la columna (`base_price` en vez de
`price`) y que acá no hay costo. Regla que conviene tatuarse: el dinero se guarda como
decimal exacto; lo demás es negociación del dominio.

A eso el manual lo llama **CRUD limpio**: crear, leer, actualizar y borrar sin reglas de
negocio extra. Y la frase que resume la decisión de diseño es una sola: *si no hay conflictos
que resolver, no inventes validaciones*. Un montón de código defensivo que no protege nada
solo agrega lugares donde puede fallar.

En las próximas secciones vas a leer los siete archivos del módulo en el mismo orden en que
los usa una petición: primero el dominio (qué es un servicio), después la aplicación (qué se
puede hacer con él), después la infraestructura (cómo se guarda) y al final la presentación
(cómo entra y sale por HTTP).

### 11.1 `src/modules/services/domain/services.entities.ts` — entidades

**Archivo:** `example-project/src/modules/services/domain/services.entities.ts`

```typescript
import type { Decimal } from "@prisma/client/runtime/library"

export interface IServiceEntity {
  id: string
  name: string
  description: string | null
  base_price: Decimal
  is_active: boolean
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export type CreateServiceData = {
  name: string
  description?: string | null
  base_price: number
  is_active?: boolean
}

export type UpdateServiceData = {
  name?: string
  description?: string | null
  base_price?: number
  is_active?: boolean
}
```

Empezamos por el dominio, que es la definición más chica y más importante: qué es un
servicio para este sistema. Y acá hay tres tipos, cada uno con un trabajo distinto.

**`IServiceEntity`** es la forma de una **fila** de la tabla `service`. No es "lo que el
usuario manda" ni "lo que la API devuelve": es lo que hay guardado, con sus `created_at`,
`updated_at` y `deleted_at`. El prefijo `I` es convención para interfaces, y `Entity` avisa
que esto representa datos persistidos.

- `base_price: Decimal` — el precio como lo devuelve Prisma. `Decimal` es la clase con la que
  Prisma representa las columnas `numeric(10,2)` de PostgreSQL. No es un `number` y la
  diferencia importa: los números de JavaScript son de coma flotante binaria, y en binario
  0,1 no existe exacto. Si sumás `0.1 + 0.2` te da `0.30000000000000004`. Con plata, ese
  error se acumula hasta que la caja no cierra. `Decimal` guarda los dígitos tal cual, sin
  redondear de más.
- `description: string | null` — en la base la columna es `String?`: puede no tener valor, y
  cuando no lo tiene Prisma te devuelve `null`, no `undefined`. Por eso el tipo lo declara.
- `deleted_at: Date | null` — la marca del borrado lógico. Mientras sea `null`, el servicio
  existe para el sistema.
- `import type { Decimal } ...` — el `type` adelante convierte esto en un **import de tipo**:
  TypeScript lo usa para chequear y lo borra al compilar. No queda ni una línea de JavaScript
  por este import, porque la clase `Decimal` nunca se ejecuta acá: solo aparece en
  anotaciones.

**`CreateServiceData`** y **`UpdateServiceData`** son lo contrario: la forma de la **entrada**,
lo que el service recibe ya validado por el DTO. Ahí `base_price` es `number`, y no es un
descuido: JSON no tiene decimales, solo números. Cuando el cliente manda `15`, viaja como
número; Prisma lo convierte a `Decimal` al escribir, y el mapper lo convierte de vuelta a
número al responder. La traducción vive en un solo lugar y no se repite en cada capa.

Fijate también en lo que **no** hay: ninguna mención a `name` único, ningún tipo de error
esperado, ningún campo para "conflictos". En `users` y `products` el dominio declaraba qué
errores de base podía producir la tabla; acá no hay nada que declarar, porque la tabla no
puede violar ninguna restricción de unicidad. El dominio refleja el esquema, y el esquema no
promete unicidad.

Detalle chico pero importante: `UpdateServiceData` tiene todos los campos opcionales. Un
`PUT` en este proyecto se comporta como actualización parcial: mandás solo `base_price` y el
resto queda como estaba. Es una decisión de API, no de la base.

### 11.2 `src/modules/services/application/common/services.mappers.ts` — mapper

**Archivo:** `example-project/src/modules/services/application/common/services.mappers.ts`

```typescript
import type { IServiceEntity } from "../../domain/services.entities"
import type { IServiceResponse } from "../../domain/services.types"

export function mapServiceToResponse(service: IServiceEntity): IServiceResponse {
  return {
    id: service.id,
    name: service.name,
    description: service.description ?? null,
    base_price: Number(service.base_price),
    is_active: service.is_active,
    created_at: service.created_at,
    updated_at: service.updated_at,
  }
}
```

Un **mapper** es una función que traduce de una forma a otra. Suena a burocracia y es lo
contrario: es el único lugar donde vive la decisión de qué se muestra y qué no. Si mañana
querés cambiar cómo sale un servicio por la API, tocás una función y no veinte
controladores.

`mapServiceToResponse(service)` recibe la entidad (la fila) y devuelve la respuesta (lo que ve
el cliente). Tres cosas pasan en esas ocho líneas:

- `base_price: Number(service.base_price)` — el `Decimal` de la base se convierte a `number`
  para viajar en JSON. ¿No perdemos precisión? En la práctica, un precio de hasta diez
  dígitos con dos decimales entra sin problema en un número de JavaScript; la precisión
  exacta se necesita mientras se calcula, no al imprimir. La regla del proyecto es: `Decimal`
  adentro, `number` en el borde.
- `description: service.description ?? null` — el operador `??` (nullish coalescing) devuelve
  el lado derecho solo si el izquierdo es `null` o `undefined`. Acá normaliza: pase lo que
  pase, la respuesta tiene `description` con un valor (`null` incluido) y el cliente no tiene
  que adivinar si el campo viene o no viene.
- **lo que no está**: `deleted_at` no se copia. La fila lo tiene, la respuesta no. El borrado
  lógico es un detalle interno; para el mundo, un servicio borrado simplemente no existe.
  Y `created_at` y `updated_at` sí se copian, para que el cliente pueda ordenar o auditar.

Compará con el mapper de productos: ahí el trabajo era más pesado porque había dos `Decimal`
(`price` y `cost`), y `cost` podía ser `null`. Acá hay uno solo y no es opcional. Otra vez:
la diferencia se lee de un vistazo.

### 11.3 `src/modules/services/application/services.service.ts` — reglas de negocio

**Archivo:** `example-project/src/modules/services/application/services.service.ts`

```typescript
import { NotFoundError } from "@/core/errors/AppError"
import type { CreateServiceData, UpdateServiceData } from "../domain/services.entities"
import type { IServiceListResponse, IServiceResponse } from "../domain/services.types"
import type { IServiceRepository } from "../domain/services.interface"
import { mapServiceToResponse } from "./common/services.mappers"

export const createServiceService = (repository: IServiceRepository) => ({
  async list(params?: { search?: string; active?: boolean; page?: number; limit?: number }): Promise<IServiceListResponse> {
    const result = await repository.findAll(params)
    return {
      services: result.services.map(mapServiceToResponse),
      total: result.total,
      page: result.page,
      limit: result.limit,
    }
  },

  async getById(id: string): Promise<IServiceResponse> {
    const service = await repository.findById(id)
    if (!service) {
      throw new NotFoundError("Service not found")
    }
    return mapServiceToResponse(service)
  },

  async create(data: CreateServiceData): Promise<IServiceResponse> {
    const service = await repository.create(data)
    return mapServiceToResponse(service)
  },

  async update(id: string, data: UpdateServiceData): Promise<IServiceResponse> {
    const existing = await repository.findById(id)
    if (!existing) {
      throw new NotFoundError("Service not found")
    }
    const service = await repository.update(id, data)
    return mapServiceToResponse(service)
  },

  async delete(id: string): Promise<void> {
    const existing = await repository.findById(id)
    if (!existing) {
      throw new NotFoundError("Service not found")
    }
    await repository.softDelete(id)
  },
})
```

Este archivo es el centro del módulo, y tiene una forma que ya viste en auth y en roles pero
que conviene mirar de frente una vez: **es una función que devuelve un objeto con métodos**.

```typescript
export const createServiceService = (repository: IServiceRepository) => ({ ... })
```

Ese patrón se llama **factory** (fábrica): en vez de exportar un objeto suelto que importe
Prisma por su cuenta, el módulo exporta una función que recibe el repositorio y devuelve el
service armado. Se lo conoce como inyección de dependencias por composición, y el beneficio
no es teórico: como el service **no sabe** de dónde viene `repository`, en el capítulo 14 le
vas a pasar un repositorio de mentira y vas a poder probar todas estas reglas sin base de
datos. El tipo `IServiceRepository` es la interfaz del dominio; el service conoce el contrato,
nunca la implementación de Prisma.

Ahora, método por método:

- **`list`** — le pasa los filtros al repositorio y arma el sobre de respuesta: `services`,
  `total`, `page`, `limit`. Esa forma constante es lo que permite que el frontend pagine
  siempre igual. El `map(mapServiceToResponse)` es la traducción fila → respuesta, hecha en
  lote.
- **`getById`** — pide el registro y, si no vino, lanza `NotFoundError("Service not found")`.
  De ese error se encarga después el `errorHandler` global del capítulo 05: lo convierte en
  un `404` con `{ "code": "NOT_FOUND", "message": "Service not found" }`. El service no sabe
  nada de HTTP y sin embargo define el status de la respuesta. Esa es la gracia de la
  jerarquía de errores.
- **`create`** — una sola línea contra el repositorio. Y sí, es llamativo después de ver
  `roles` (que chequea `findByName`) y `products` (que traduce P2002). Acá no hay nada que
  chequear: no hay unicidad, no hay conflicto posible. Si dos personas crean "Corte de
  cabello" al mismo tiempo, el sistema crea dos servicios y está bien.
- **`update`** — primero busca (`findById`) y tira 404 si no existe; recién después actualiza.
  ¿Por qué buscar si el `update` de Prisma ya falla cuando el id no existe? Por dos razones:
  para devolver un 404 con el mensaje del dominio en vez del error crudo de Prisma, y para
  que el controlador no tenga que distinguir entre "no existe" y "algo se rompió".
- **`delete`** — busca, tira 404 si no está y llama a `softDelete`. Nunca se borra una fila:
  se marca con `deleted_at`. Perdés un poco de espacio y ganás historia: podés saber qué
  existía, y los registros viejos que apuntaban a ese servicio no quedan huérfanos.

La lección del archivo, que después se repite en cada módulo: **el service contiene las
reglas y nada más**. Acá las reglas son mínimas (existe o no existe), así que el archivo es
corto. En `products` eran dos más (unicidad de barcode), y en `inventory` van a ser tres
reglas aritméticas que mueven plata. Misma estructura, distinta cantidad de reglas.

### 11.4 `src/modules/services/infrastructure/services.prisma.repository.ts` — repo sin manejo de errores

**Archivo:** `example-project/src/modules/services/infrastructure/services.prisma.repository.ts`

Este archivo es largo, así que lo vamos a leer en tres partes: primero las herramientas
que comparte todo el repositorio, después la consulta con filtros y paginación, y al final
las cuatro operaciones de escritura.

**Parte 1: el `select` y el mapeo de vuelta a entidad**

```typescript
import { Prisma } from "@prisma/client"
import { prisma } from "@/config/prisma"
import type { IServiceRepository } from "../domain/services.interface"
import type { CreateServiceData, IServiceEntity, UpdateServiceData } from "../domain/services.entities"

const serviceSelect = {
  id: true,
  name: true,
  description: true,
  base_price: true,
  is_active: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
} as const

type ServiceRecord = Prisma.serviceGetPayload<{ select: typeof serviceSelect }>

function mapToEntity(service: ServiceRecord): IServiceEntity {
  return {
    ...service,
    description: service.description ?? null,
    deleted_at: service.deleted_at ?? null,
  }
}
```

Estas líneas son el andamiaje del repositorio y se repiten, casi idénticas, en todos los
módulos. Vale la pena entenderlas una vez.

`serviceSelect` es un objeto que dice **qué columnas traer**. Se usa en cada consulta en vez
de traer la fila completa, por dos motivos: eficiencia (no pedís lo que no usás) y seguridad
(lo que no pedís no se puede filtrar por accidente). Todos los valores son `true` porque en
Prisma un `select` es una lista blanca: si la columna no está, no viene.

El `as const` del final no es decoración. Le dice a TypeScript "estos valores son literales
exactos y no cambian", y eso es lo que permite el paso siguiente: `Prisma.serviceGetPayload<{
select: typeof serviceSelect }>` **deriva el tipo de la fila a partir del select**. O sea,
escribís el select una vez y el tipo `ServiceRecord` se calcula solo. Si mañana agregás
`description` al select, el tipo se actualiza sin que toques nada. Ese es el tipo de magia
que sí conviene: no hay dos fuentes de verdad.

`mapToEntity` hace el viaje de vuelta: el registro de Prisma otra vez a `IServiceEntity`. Acá
el `...service` copia todo y después se corrigen dos cosas puntuales.
`description: service.description ?? null` y `deleted_at: service.deleted_at ?? null` están
porque en el registro esos campos pueden llegar como `undefined` según cómo se armó la
consulta, y la entidad promete `null`. Si el repositorio devolviera `undefined`, el resto del código tendría
que preguntar dos veces (`if (!x && x !== undefined)`), y eso es exactamente el tipo de
ruido que un mapper elimina.

**Parte 2: `findAll` con búsqueda, filtro y paginación**

```typescript
export const ServiceRepository: IServiceRepository = {
  async findAll(params) {
    const where: Prisma.serviceWhereInput = { deleted_at: null }
    if (params?.search) {
      where.name = { contains: params.search, mode: "insensitive" }
    }
    if (params?.active !== undefined) {
      where.is_active = params.active
    }

    const page = params?.page || 1
    const limit = params?.limit || 50
    const skip = (page - 1) * limit

    const [services, total] = await Promise.all([
      prisma.service.findMany({ where, select: serviceSelect, skip, take: limit, orderBy: { name: "asc" } }),
      prisma.service.count({ where }),
    ])

    return { services: services.map(mapToEntity), total, page, limit }
  },
```

Acá está la consulta más "de verdad" del módulo. Se arma en tres pasos.

Primero, el `where` empieza con `{ deleted_at: null }`: **siempre** se filtra por los no
borrados, aunque el cliente no pida nada. Es la primera línea de defensa del borrado lógico,
y por eso vive en el repositorio y no en el service: si dependiera de que cada llamador se
acuerde, alguna vez alguien se olvidaría.

Segundo, los filtros opcionales:

- `if (params?.search)` — el `?.` corta en `undefined` sin explotar, así que `findAll()`
  también funciona. Si hay búsqueda, `{ contains: params.search, mode: "insensitive" }` se
  traduce a un `ILIKE '%texto%'` en SQL: busca en cualquier parte del nombre, sin distinguir
  mayúsculas. `insensitive` es específico de PostgreSQL; con otro motor habría que cambiar
  esta línea.
- `if (params?.active !== undefined)` — ojo con este, que es un clásico donde se rompen
  cosas. Acá **no** dice `if (params.active)`, dice `!== undefined`. La diferencia es que
  `false` es un valor legítimo: "quiero solo los inactivos". Con `if (params.active)`,
  `active: false` sería falsy y el filtro se ignoraría en silencio, devolviendo todo. Cuando
  el valor puede ser `false` o `0`, comparar contra `undefined` no es opcional.

Tercero, la paginación. `page` y `limit` con `||` tienen default (1 y 50) por si el DTO no los
manda. `skip = (page - 1) * limit` es la cuenta de siempre: en la página 1 salteás 0, en la 2
salteás `limit`, en la 3 salteás `2 * limit`.

Y después viene el `Promise.all`.

```typescript
const [services, total] = await Promise.all([
  prisma.service.findMany({ ... }),
  prisma.service.count({ where }),
])
```

Dos consultas que no dependen una de la otra: la página de datos y el total de registros (que
el cliente necesita para dibujar el paginador). Si las hicieras en serie, esperarías dos
viajes a la base; con `Promise.all` salen a la vez y esperás el más lento. El `count` usa el
**mismo `where`**, y eso no es un detalle: si contaras con un filtro distinto, el total no
coincidiría con las filas y el paginador mostraría páginas fantasma.

El `orderBy: { name: "asc" }` ordena alfabéticamente. Sin `orderBy`, PostgreSQL puede
devolver las filas en cualquier orden, y una lista paginada sin orden estable hace que un
mismo registro aparezca dos veces o ninguna.

**Parte 3: las cuatro operaciones**

```typescript
  async findById(id) {
    const service = await prisma.service.findFirst({ where: { id, deleted_at: null }, select: serviceSelect })
    return service ? mapToEntity(service) : null
  },

  async create(data) {
    const service = await prisma.service.create({ data, select: serviceSelect })
    return mapToEntity(service)
  },

  async update(id, data) {
    const service = await prisma.service.update({ where: { id }, data, select: serviceSelect })
    return mapToEntity(service)
  },

  async softDelete(id) {
    await prisma.service.update({ where: { id }, data: { deleted_at: new Date() } })
  },
}
```

- **`findById`** usa `findFirst`, no `findUnique`. La diferencia es concreta: `findUnique` solo
  acepta campos únicos (el `id`, el `barcode`) en su `where`, y acá el `where` tiene dos cosas
  (`id` **y** `deleted_at: null`). Para combinar una clave única con una condición extra se
  usa `findFirst`. El `service ? mapToEntity(service) : null` convierte "no encontrado" en
  `null` explícito, que es lo que el service espera para decidir el 404.
- **`create`** pasa `data` tal cual y el `select` para que la respuesta tenga la forma
  esperada. Prisma valida el objeto contra el esquema: si te falta un campo obligatorio, no
  llega a la base.
- **`update`** hace `update({ where: { id }, data })`. Acá `where` sí puede ser `findUnique`-
  style porque `id` es único. Y fijate que el service ya verificó que existe: el repositorio
  confía en quien lo llama.
- **`softDelete`** no borra: actualiza `deleted_at` con la fecha de ahora. La fila sigue ahí,
  las relaciones con movimientos viejos siguen siendo válidas y el registro se puede
  recuperar con un `update` que ponga `deleted_at` en `null`.

Y ahora lo más importante de la sección: **lo que no está**. En `users` y `products` había un
`isPrismaError` y un `try`/`catch` traduciendo P2002 y P2003 a `ConflictError`. Acá no hay
nada de eso. No es un olvido ni una versión incompleta: es la consecuencia directa de que la
tabla `service` no tenga columnas únicas ni claves foráneas. Si igual pusiéramos el
`try`/`catch`, sería código muerto: una rama que nunca se ejecuta y que alguien va a leer
pensando que protege algo. **Cada repositorio maneja solo los errores que su tabla puede
producir.**

### 11.5 `src/modules/services/presentation/services.dto.ts` — DTOs

**Archivo:** `example-project/src/modules/services/presentation/services.dto.ts`

```typescript
import { z } from "zod"

export const CreateServiceDtoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  base_price: z.number().positive("Base price must be greater than zero"),
  is_active: z.boolean().optional().default(true),
})

export const UpdateServiceDtoSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  base_price: z.number().positive().optional(),
  is_active: z.boolean().optional(),
})

export const ServiceQuerySchema = z.object({
  search: z.string().optional(),
  active: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
})

export type CreateServiceDto = z.infer<typeof CreateServiceDtoSchema>
export type UpdateServiceDto = z.infer<typeof UpdateServiceDtoSchema>
```

Un **DTO** (data transfer object) es la descripción de lo que entra por la puerta. Acá se
escribe con Zod, una librería que valida y, de paso, **infiere el tipo**: escribís el schema
una vez y `z.infer<typeof CreateServiceDtoSchema>` te da el tipo de TypeScript equivalente. No
hay dos verdades que mantener sincronizadas.

Tres schemas, tres puertas distintas:

**`CreateServiceDtoSchema`** valida el body de un POST.

- `z.string().min(2, "Name must be at least 2 characters")` — el segundo argumento es el
  mensaje que va a ver el cliente. El `errorHandler` toma el primer problema de Zod y lo
  formatea como `campo: mensaje`, así que este texto termina siendo
  `name: Name must be at least 2 characters` en un 400.
- `description: z.string().optional()` — puede no venir. Fijate que acá es `optional()` y no
  `nullable()`: en la creación, "sin descripción" se expresa **no mandando el campo**.
- `base_price: z.number().positive("Base price must be greater than zero")` — `.positive()`
  rechaza cero y negativos. Un servicio que sale cero pesos no existe como oferta; si algún
  día hay que regalar algo, se modela con un descuento, no con un precio en cero.
- `is_active: z.boolean().optional().default(true)` — si no lo mandan, nace activo. El
  `.default()` **no es lo mismo** que `optional()`: no solo permite que falte, sino que
  inserta el valor por defecto en el objeto ya parseado. Gracias a eso, el service puede
  confiar en que `is_active` siempre viene definido.

**`UpdateServiceDtoSchema`** valida el body de un PUT, y tiene una diferencia que se explica
sola: `description: z.string().nullable().optional()`. Acá sí hay `nullable()`, porque en una
actualización "quiero borrar la descripción" se expresa mandando `null` explícito. `optional()`
significa "no toques este campo"; `nullable()` significa "dejalo vacío". Son dos intenciones
distintas y por eso son dos métodos distintos. Todos los demás campos son `.optional()`,
porque el PUT es parcial.

**`ServiceQuerySchema`** valida el `?search=...&active=true&page=2` de la URL. Y acá aparece
la particularidad más importante de los query strings: **todo lo que llega por la URL es
texto**. `?page=2` no manda el número 2, manda la cadena `"2"`. Por eso:

- `z.coerce.number()` convierte el string a número antes de validar. Sin `coerce`, Zod
  rechazaría `"2"` porque no es un número.
- `.int().positive()` exige entero positivo: `page=0` y `page=1.5` son un 400.
- `.max(100)` en `limit` evita que alguien pida `?limit=999999` y te tire la base. Es una
  defensa contra el abuso más barata que cualquier otra.
- `active: z.enum(["true", "false"])` es un enum **de strings**, no un booleano, porque por la
  URL no viajan booleanos: viaja el texto `"true"`. El controlador es el que después lo
  convierte a `true`/`false` de verdad. Si en cambio aceptara `z.string()`, cualquier basura
  pasaría la validación.

### 11.6 `src/modules/services/presentation/services.controller.ts` — controlador

**Archivo:** `example-project/src/modules/services/presentation/services.controller.ts`

```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { createServiceService } from "../application/services.service"
import { ServiceRepository } from "../infrastructure/services.prisma.repository"
import { CreateServiceDtoSchema, ServiceQuerySchema, UpdateServiceDtoSchema } from "./services.dto"

const serviceService = createServiceService(ServiceRepository)

export const servicesController = {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const query = ServiceQuerySchema.parse(request.query)
    const result = await serviceService.list({
      ...query,
      active: query.active === undefined ? undefined : query.active === "true",
    })
    return reply.status(200).send(result)
  },

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string }
    const result = await serviceService.getById(id)
    return reply.status(200).send(result)
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = CreateServiceDtoSchema.parse(request.body)
    const result = await serviceService.create(body)
    return reply.status(201).send(result)
  },

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string }
    const body = UpdateServiceDtoSchema.parse(request.body)
    const result = await serviceService.update(id, body)
    return reply.status(200).send(result)
  },

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string }
    await serviceService.delete(id)
    return reply.status(200).send({ message: "Service deleted successfully" })
  },
}
```

El controlador es la capa más fina del proyecto, y esa delgadez es deliberada. Mirá el patrón
que se repite en los cinco handlers: **parsear, llamar, responder**. Nada más.

- `const serviceService = createServiceService(ServiceRepository)` — la composición se hace
  **una sola vez**, cuando se carga el módulo, no en cada request. El service queda armado con
  el repositorio real y se reusa. Si se hiciera dentro de cada handler, crearías un objeto por
  petición sin ninguna ganancia.
- `ServiceQuerySchema.parse(request.query)` — el `parse` de Zod valida y devuelve el objeto
  ya convertido. Si algo no cumple, **lanza** `ZodError`, y el `errorHandler` global lo
  transforma en 400. Por eso acá no ves ni un `if` de validación: el controlador confía en que
  lo que le llegó ya pasó por el schema.
- `active: query.active === undefined ? undefined : query.active === "true"` — la traducción
  de texto a booleano que te adelanté. Está escrita con el ternario completo, y no como
  `query.active === "true"` a secas, por el mismo motivo de antes: si no viene el filtro, el
  resultado tiene que ser `undefined` (sin filtro), no `false` (solo inactivos).
- `reply.status(200).send(result)` — el status explícito. En un `create` es `201`, que en HTTP
  significa "creé algo y acá está". `200` sería aceptable, `201` es correcto, y el cliente que
  sabe leer la diferencia puede actuar distinto.
- `request.params as { id: string }` — el `as` es un casteo: Fastify no puede saber por tipos
  que la ruta `/:id` trae un `id`, así que se lo afirmás vos. Es uno de los pocos lugares
  donde el proyecto usa `as` en producción.
- `delete` responde `200` con `{ message: "Service deleted successfully" }` en vez de un `204`
  sin cuerpo. Es una decisión de consistencia: todas las respuestas del proyecto tienen
  cuerpo, y el cliente puede mostrar ese mensaje tal cual.

### 11.7 `src/modules/services/presentation/services.routes.ts` — rutas autenticadas

**Archivo:** `example-project/src/modules/services/presentation/services.routes.ts`

```typescript
import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { servicesController } from "./services.controller"
import { authGuard } from "@/modules/auth/application/common/auth.guard"

export const servicesRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  fastify.get("/", { preHandler: [authGuard] }, servicesController.list)
  fastify.get("/:id", { preHandler: [authGuard] }, servicesController.getById)
  fastify.post("/", { preHandler: [authGuard] }, servicesController.create)
  fastify.put("/:id", { preHandler: [authGuard] }, servicesController.update)
  fastify.delete("/:id", { preHandler: [authGuard] }, servicesController.delete)
}
```

Cinco líneas de ruta, y cada una dice tres cosas: el método HTTP, la ruta y quién puede
entrar.

`servicesRoutes` es un **plugin de Fastify**: una función `async` que recibe la instancia y un
objeto de opciones (que acá no se usa, por eso el `_` delante del nombre: es la convención
para decir "esto existe porque la firma lo pide, pero no lo uso"). El `routes.ts` de la raíz
lo registra con un prefijo, y así `fastify.get("/")` termina siendo `GET /services`. En el
código del módulo las rutas son relativas; el prefijo vive en un solo lugar.

`{ preHandler: [authGuard] }` es lo que hace que la ruta esté protegida. Un `preHandler` es
una función que Fastify ejecuta **antes** del handler; `authGuard` busca el token en la cookie
o en el header `Authorization: Bearer`, lo verifica y, si está bien, inyecta `request.userId`,
`request.userEmail` y `request.userRole`. Si no, lanza 401 y el handler ni se entera. Es un
middleware, con nombre de Fastify.

Fijate que **no hay `adminGuard`** en ninguna ruta. Es la misma decisión que en `products`: el
catálogo lo mantiene cualquier persona autenticada, sea admin o staff. Los servicios son parte
del día a día del mostrador; los roles y los usuarios, no. Esa frontera —catálogo para todos,
administración solo para admin— es una regla de negocio y se ve en una sola palabra del
archivo de rutas.

Los cinco endpoints quedan así:

| Método y ruta | Qué hace | Respuesta |
|---|---|---|
| `GET /services` | lista con `?search=`, `?active=`, `?page=`, `?limit=` | 200 con `{ services, total, page, limit }` |
| `GET /services/:id` | un servicio | 200, o 404 si no existe |
| `POST /services` | crea | 201 con el servicio |
| `PUT /services/:id` | actualiza parcial | 200 con el servicio, o 404 |
| `DELETE /services/:id` | borra lógicamente | 200 con un mensaje |

### Resumen

- `services` es el CRUD limpio del proyecto: misma estructura de cuatro capas que los demás
  módulos, pero sin ninguna columna única en la tabla, y por lo tanto sin manejo de conflictos
  en el repositorio.
- Se lee por diferencias contra `products`: ahí `barcode` es `@unique` y obliga a traducir
  P2002 a 409; acá no hay nada que traducir y no hay `try`/`catch` porque sería código muerto.
- `base_price` es `Decimal` en la entidad (dinero exacto) y `number` en la entrada y en la
  respuesta; el mapper es el único lugar donde ocurre esa traducción.
- El service es una factory que recibe el repositorio: eso es lo que permite probarlo con un
  repositorio falso en el capítulo 14, sin base de datos.
- El PUT es parcial y `description` es `nullable` además de opcional: `optional()` significa
  "no lo toques", `nullable()` significa "dejalo vacío".

## 12. Módulo inventory

Hasta acá el sistema guarda cosas: roles, usuarios, productos, servicios. Todo eso es
infraestructura alrededor de una pregunta que en un punto de venta se hace cien veces por día:
**¿cuántas unidades hay y por qué?** Este capítulo es la respuesta, y es el corazón del
manual. Si entendés este módulo, entendés el 80% de lo que se hace en un backend de verdad.

Antes del código, tres conceptos. Los vas a necesitar para leer cualquier línea del capítulo,
y son los mismos en cualquier sistema de stock, en cualquier lenguaje.

### El stock es un total, los movimientos son la historia

Un **movimiento de stock** es un hecho registrado: "el 3 de marzo entraron 20 Coca-Cola de
500 ml porque llegó el proveedor", "el 3 de marzo a las 15:42 salieron 2 porque se vendieron".
Un hecho no se edita ni se borra. Si te equivocaste, registrás otro hecho que lo corrige.

Ese conjunto de hechos se llama **libro de movimientos** (en la jerga de depósito, *kardex*),
y es la fuente de verdad. La columna `stock` de la tabla `product` es otra cosa: es **el total
corriente**, un número que se mantiene al día para no tener que sumar mil filas cada vez que
alguien pregunta cuánto queda. Dicho de otro modo: el stock se puede recalcular sumando los
movimientos, pero nadie lo hace en cada consulta porque sería lentísimo.

Esa separación tiene una consecuencia que explica todo el diseño del capítulo: como hay dos
lugares donde vive el mismo dato (la historia y el total), **los dos tienen que cambiar
juntos o no cambiar ninguno**. De eso se encarga la transacción, y es el tema de la sección
siguiente.

¿Por qué no se borran los movimientos? Por tres razones que en un negocio son la misma: para
poder auditar (quién movió qué y cuándo), para poder explicar una diferencia de inventario
("acá dice que salieron 60 y entraron 50, mirá estas filas"), y para que la cuenta cierre. Un
sistema que borra movimientos es un sistema en el que no se puede confiar cuando aparece un
faltante.

### Los tres tipos de movimiento

El sistema registra tres tipos, y la diferencia entre ellos es qué cuenta hace cada uno:

- **`entrada`** — suma: `stock = stock + quantity`. Llega mercadería del proveedor, un cliente
  devuelve algo, alguien encuentra una caja perdida en el depósito.
- **`salida`** — resta: `stock = stock - quantity`, pero **solo si hay suficiente**. Si la
  cantidad pedida supera el stock actual, el servidor responde `409 Conflict` con
  `"Insufficient stock"`. Es la regla que evita vender lo que no tenés.
- **`ajuste`** — no suma ni resta: **fija**. `stock = quantity`. Se usa cuando contás el
  depósito con las manos y el número real no coincide con el del sistema. Si contaste 25,
  mandás `quantity: 25` y el stock pasa a ser 25, sin importar cuánto decía antes.

El ajuste es el que más cuesta aceptar al principio, porque parece "hacer trampa": ¿por qué no
editar el stock directo? Porque editar el stock borra la explicación. Con un ajuste, la
historia queda completa: "había 30 según el sistema, conté 25, la diferencia fueron 5
unidades perdidas". La corrección también es un hecho, y queda firmada por quien la hizo.

### Dos escrituras que tienen que ir juntas

Registrar un movimiento toca dos tablas: se **inserta** una fila en `inventory_movement` y se
**actualiza** `product.stock`. Son dos escrituras separadas, y ahí está el peligro.

Imaginá que se hace la primera y falla la segunda. El historial dice que entraron 20 unidades
y el stock sigue igual: el sistema miente. Imaginá lo contrario: el stock sube 20 y no hay
ninguna fila que explique de dónde salieron. En los dos casos el inventario queda
desincronizado, y desincronizado en silencio, que es lo peor que puede pasar.

Una **transacción** es la herramienta que resuelve esto: un bloque de operaciones que la base
de datos ejecuta como una sola unidad. O se confirman todas (**commit**), o no se confirma
ninguna (**rollback**). Mientras la transacción está abierta, nadie más ve el estado
intermedio.

Prisma ofrece dos formas de escribir una transacción:

- Con un **array** de operaciones: `prisma.$transaction([op1, op2])`. Es la que usa este
  módulo. Las operaciones se ejecutan en orden, en la misma transacción, y te devuelve un
  array con los resultados en el mismo orden. Si una falla, se deshace todo.
- Con un **callback**: `prisma.$transaction(async (tx) => { ... })`, donde adentro podés leer
  y escribir con `tx` y decidir en función de lo que leíste. Es más flexible y es la que vas a
  querer el día que necesites leer dentro de la transacción. Guardá ese dato, porque vuelve en
  la sección de la carrera.

### Qué es una race condition

Una **condición de carrera** (*race condition*) es lo que pasa cuando dos operaciones
simultáneas leen y escriben el mismo dato, y el resultado depende de quién llegó primero. En
un punto de venta no es un caso raro: es un martes. Dos cajeros cobrando al mismo tiempo, o
el mismo cajero con dos pestañas abiertas.

Mirá qué pasa con el stock en 50 y dos salidas de 30 que entran casi juntas:

| momento | pedido A | pedido B | `stock` en la base |
|---|---|---|---|
| 1 | lee `stock = 50` | | 50 |
| 2 | | lee `stock = 50` | 50 |
| 3 | calcula `50 - 30 = 20` | | 50 |
| 4 | | calcula `50 - 30 = 20` | 50 |
| 5 | escribe 20 y su movimiento de -30 | | 20 |
| 6 | | escribe 20 y su movimiento de -30 | 20 |

Los dos pedidos se aceptaron, el historial dice que salieron 60 unidades y el stock quedó en
20. Nunca se pudo vender eso: había 50. A este patrón se lo llama **lost update** (actualización
perdida): la segunda escritura pisa el resultado de la primera porque las dos calcularon sobre
la misma lectura vieja.

Ahora, importante, y es la parte que casi ningún tutorial dice: **qué garantiza la transacción
de este módulo y qué no.**

Lo que sí garantiza:

- Las dos escrituras se confirman o se descartan juntas. Nunca queda un movimiento sin su
  actualización de stock, ni un stock movido sin movimiento que lo explique.
- Si el `update` del stock falla (por ejemplo, el producto se borró en el medio), el
  movimiento no queda registrado: Prisma deshace la transacción entera.
- Nadie ve el estado intermedio: entre el `create` y el `update` no hay un instante en el que
  otra consulta pueda leer un stock a medio camino.

Lo que **no** garantiza, por sí sola:

- Que dos pedidos simultáneos no lean el mismo stock antes de escribir. La lectura del stock
  ocurre en el service, **antes** de abrir la transacción; la transacción protege las
  escrituras, no esa lectura. En el ejemplo de la tabla, la transacción se ejecuta dos veces,
  completa y correctamente, y el resultado igual está mal.

¿Cómo se cierra del todo? Moviendo la cuenta **adentro de la base**, para que la base sea la
que decide sobre el valor actual y no sobre uno leído antes. Hay dos formas, y las dos son
operaciones atómicas sobre el campo:

- `stock: { decrement: quantity }` — en vez de mandar el número final, le pedís a la base que
  reste. PostgreSQL bloquea la fila y aplica la resta sobre el valor que hay en ese momento,
  así que dos salidas seguidas de 30 sobre 50 terminan en -10... salvo que además exijas que
  no baje de cero.
- Un `updateMany` con condición: `where: { id, stock: { gte: quantity } }` y
  `data: { stock: { decrement: quantity } }`. Prisma devuelve `count: 0` cuando la condición no
  se cumple, y ahí el service lanza `ConflictError("Insufficient stock")` y la transacción se
  deshace. La condición y la resta se evalúan en la misma sentencia, sin ventana en el medio.

Este manual no implementa esa variante: deja la cuenta en una función pura y testeable, que es
didácticamente mucho más clara, y la escritura dentro de una transacción, que resuelve el
problema del estado a medias. Es una simplificación consciente y vale la pena que la conozcas
como deuda: en un sistema con varias cajas escribiendo a la vez, la cuenta se mueve a la base.

Con eso en la cabeza, el código del módulo se lee como una consecuencia y no como una receta.

### 12.1 `src/modules/inventory/domain/inventory.entities.ts` — entidades del movimiento

**Archivo:** `example-project/src/modules/inventory/domain/inventory.entities.ts`

```typescript
import type { Decimal } from "@prisma/client/runtime/library"

export type MovementType = "entrada" | "salida" | "ajuste"

export interface IInventoryMovementEntity {
  id: string
  product_id: string
  product: {
    id: string
    name: string
    barcode: string | null
  }
  user_id: string
  user: {
    id: string
    name: string
    email: string
  }
  type: MovementType
  quantity: number
  unit_cost: Decimal | null
  note: string | null
  created_at: Date
}

export interface IProductStockInfo {
  id: string
  stock: number
  active: boolean
  deleted_at: Date | null
}

export type CreateMovementData = {
  product_id: string
  type: MovementType
  quantity: number
  unit_cost?: number
  note?: string
}
```

Cuatro declaraciones, y la primera merece párrafo aparte.

**`export type MovementType = "entrada" | "salida" | "ajuste"`** es un **tipo unión** (o unión
de literales): un tipo que vale exactamente uno de esos tres textos, y nada más. No es un
`string` libre. Si escribís `type: "salidaa"`, TypeScript te marca el error en el editor antes
de que corras nada, y en tiempo de ejecución el DTO de Zod lo rechaza con un 400. Un `enum` de
TypeScript haría algo parecido, pero la unión de literales tiene una ventaja concreta: el
valor **es** el string, sin traducción. Se guarda en la base como `"entrada"`, viaja en el
JSON como `"entrada"` y se compara como `"entrada"`. No hay bordes donde confundirse.

Y ahí está el motivo del casteo que vas a ver más adelante en el repositorio: la columna `type`
de la tabla es `String` (mirá el `schema.prisma`), así que Prisma te devuelve `string`. Como
el sistema garantiza que solo hay tres valores posibles (nadie escribe en esa columna sin
pasar por el DTO), el repositorio afirma `movement.type as MovementType` y sigue. El tipo
unión vive en el domino; la columna no lo puede imponer sola.

**`IInventoryMovementEntity`** es la fila del movimiento, pero con algo más: `product` y
`user` **anidados**, con sus datos mínimos (nombre y código de barras del producto; nombre y
email del usuario). ¿Por qué no solo los ids? Porque cuando mostrás un historial, "entraron 20
unidades del producto `3f2a...` por el usuario `9c1b...`" no le sirve a nadie. Los ids están
igual (son las claves foráneas), y además viene el nombre, resuelto por la consulta. En la
sección del repositorio vas a ver cómo: es un `select` anidado, no un join escrito a mano.

**`IProductStockInfo`** es una lección de diseño que se repite en todo buen backend: pedí solo
lo que necesitás. El service, para decidir un movimiento, necesita exactamente tres cosas del
producto: `stock`, `active` y `deleted_at`. No necesita el precio, ni el nombre, ni el código
de barras, ni la fecha de creación. Al declarar un tipo chico, la consulta que lo produce
también es chica, y queda claro para quien lea el código qué datos entran en la decisión. Si
mañana la regla necesita el precio, agregás el campo y el compilador te obliga a actualizar la
consulta.

**`CreateMovementData`** es la entrada: `product_id`, `type`, `quantity` obligatorios, y
`unit_cost` y `note` opcionales. `unit_cost` es el costo unitario de esa entrada —sirve para
saber a qué precio se compró ese lote— y `note` es texto libre para explicar, por ejemplo,
"conteo físico de fin de mes". Ninguno es `Decimal` acá: entran como `number` y Prisma los
convierte, igual que en los otros módulos.

### 12.2 `src/modules/inventory/domain/inventory.types.ts` — tipos de respuesta

**Archivo:** `example-project/src/modules/inventory/domain/inventory.types.ts`

```typescript
import type { MovementType } from "./inventory.entities"

export interface IInventoryMovementResponse {
  id: string
  product_id: string
  product: {
    id: string
    name: string
    barcode: string | null
  }
  user_id: string
  user: {
    id: string
    name: string
    email: string
  }
  type: MovementType
  quantity: number
  unit_cost: number | null
  note: string | null
  created_at: Date
}

export interface IInventoryMovementListResponse {
  movements: IInventoryMovementResponse[]
  total: number
  page: number
  limit: number
}

export interface ILowStockProduct {
  id: string
  name: string
  stock: number
  low_stock_threshold: number
}
```

Acá está la misma costumbre de siempre: los tipos de respuesta viven separados de los de la
entidad, y esa separación es una promesa. `IInventoryMovementEntity` describe lo que hay
guardado; `IInventoryMovementResponse` describe lo que sale por la API. Casi siempre son
iguales, y está bien que sean dos tipos distintos: el día que difieran, no querés que se
entere el cliente.

`IInventoryMovementResponse` repite la forma de la entidad (incluidos `product` y `user`
anidados) con una diferencia clave: `unit_cost: number | null` en vez de `Decimal | null`. Es
el contrato de "afuera": JSON no tiene decimales exactos, y el cliente del frontend no tiene
la clase `Decimal` de Prisma. El mapper hace la conversión, y esa es toda la historia.

`IInventoryMovementListResponse` es el sobre de la lista: `movements`, `total`, `page`,
`limit`. Idéntico al de servicios y productos, a propósito: un cliente que sabe paginar un
recurso sabe paginar todos.

`ILowStockProduct` es la forma compacta del reporte de stock bajo: `id`, `name`, `stock` y
`low_stock_threshold` (el umbral propio de ese producto). Solo esos cuatro campos, porque el
objetivo del endpoint es mostrarte una lista de "estos productos están por debajo de su
mínimo" y que puedas decidir qué comprar. Cuatro campos alcanzan y no distraen.

### 12.3 `src/modules/inventory/application/common/inventory.mappers.ts` — mapper

**Archivo:** `example-project/src/modules/inventory/application/common/inventory.mappers.ts`

```typescript
import type { IInventoryMovementEntity } from "../../domain/inventory.entities"
import type { IInventoryMovementResponse } from "../../domain/inventory.types"

export function mapMovementToResponse(movement: IInventoryMovementEntity): IInventoryMovementResponse {
  return {
    id: movement.id,
    product_id: movement.product_id,
    product: movement.product,
    user_id: movement.user_id,
    user: movement.user,
    type: movement.type,
    quantity: movement.quantity,
    unit_cost: movement.unit_cost ? Number(movement.unit_cost) : null,
    note: movement.note ?? null,
    created_at: movement.created_at,
  }
}
```

Un mapper chico con una línea interesante:

```typescript
unit_cost: movement.unit_cost ? Number(movement.unit_cost) : null,
```

`Decimal` es un objeto, y un objeto siempre es "verdadero" en JavaScript... salvo `null`, que
es el único caso en que esta expresión devuelve `null`. O sea: si hay costo, se convierte a
número; si no hay, se devuelve `null` explícito. El campo es opcional en la base
(`Decimal?`), así que la respuesta tiene que poder decir "no hay costo", y `null` es esa
palabra. Nunca `undefined`, nunca `0`: cero es un costo posible (algo que te regalaron), y no
es lo mismo que "no registrado".

El resto del mapper es copia directa. `product` y `user` pasan tal cual porque ya vienen
anidados desde el repositorio con la forma exacta que la respuesta necesita: el trabajo de
armarlos se hizo en la consulta, no acá. Y `note: movement.note ?? null` normaliza el opcional
igual que en los otros módulos.

Fijate lo que **no** hace: no toca `quantity`, no recalcula nada, no toca el stock. El mapper
traduce forma, no reglas. Si alguna vez te dan ganas de poner una cuenta adentro de un mapper,
la cuenta va al service.

### 12.4 `src/modules/inventory/application/inventory.service.ts` — reglas de negocio del stock

**Archivo:** `example-project/src/modules/inventory/application/inventory.service.ts`

```typescript
import { ConflictError, NotFoundError } from "@/core/errors/AppError"
import type { CreateMovementData, MovementType } from "../domain/inventory.entities"
import type { IInventoryMovementListResponse, IInventoryMovementResponse, ILowStockProduct } from "../domain/inventory.types"
import type { IInventoryRepository } from "../domain/inventory.interface"
import { mapMovementToResponse } from "./common/inventory.mappers"

function computeNewStock(currentStock: number, type: MovementType, quantity: number): number {
  if (type === "entrada") {
    return currentStock + quantity
  }
  if (type === "salida") {
    if (quantity > currentStock) {
      throw new ConflictError("Insufficient stock")
    }
    return currentStock - quantity
  }
  return quantity
}

export const createInventoryService = (repository: IInventoryRepository) => ({
  async listMovements(params?: { product_id?: string; type?: MovementType; page?: number; limit?: number }): Promise<IInventoryMovementListResponse> {
    const result = await repository.listMovements(params)
    return {
      movements: result.movements.map(mapMovementToResponse),
      total: result.total,
      page: result.page,
      limit: result.limit,
    }
  },

  async createMovement(data: CreateMovementData, userId: string): Promise<IInventoryMovementResponse> {
    const product = await repository.findProductById(data.product_id)
    if (!product || product.deleted_at) {
      throw new NotFoundError("Product not found")
    }

    const newStock = computeNewStock(product.stock, data.type, data.quantity)
    const movement = await repository.createMovement(data, userId, newStock)
    return mapMovementToResponse(movement)
  },

  async lowStock(): Promise<ILowStockProduct[]> {
    return repository.findLowStockProducts()
  },
})
```

Este archivo son las tres reglas del inventario, y están en una función de once líneas. Vamos
por partes, porque cada detalle importa.

**`computeNewStock` es una función pura.** Una función es pura cuando, para las mismas
entradas, devuelve siempre la misma salida y no tiene efectos: no lee la hora, no consulta la
base, no escribe nada, no usa variables de afuera. Acá eso no es un lujo teórico, es lo que te
permite probarla (capítulo 14) sin repositorio, sin base y sin servidor: le pasás `50` y `10`
y te tiene que dar `60`, siempre, en tu máquina y en el servidor de integración.

Leé las tres ramas y su orden:

- `if (type === "entrada")` devuelve `currentStock + quantity`. Suma y listo.
- `if (type === "salida")` primero **chequea** y después resta:
  `if (quantity > currentStock) throw new ConflictError("Insufficient stock")`, y si pasa,
  `currentStock - quantity`. El orden no es casual: validar antes de calcular evita devolver
  un número negativo y dejar que el error aparezca tres capas más arriba.
- El `return quantity` final, sin `if`, es el ajuste. No hace falta preguntar: el tipo unión
  tiene exactamente tres miembros y ya descartamos dos, así que el que queda es `"ajuste"`.
  Esto se llama **agotar la unión**, y es una de las razones por las que conviene el tipo unión
  en vez de un `string`: si mañana agregás `"transferencia"`, TypeScript no te va a avisar
  acá (porque el `return` final la absorbe), y ese es justamente el riesgo de esta forma. La
  versión a prueba de balas sería un `switch` con un chequeo de exhaustividad; el código del
  proyecto elige la versión corta porque el enum está cerrado por el DTO.

El `throw` dentro de la función pura es parte de su contrato, no una violación de la pureza:
lanzar un error de dominio es un resultado determinista. `ConflictError` es una subclase de
`AppError` con `statusCode: 409` y `code: "CONFLICT"`, así que el errorHandler global la
convierte en `409 { "code": "CONFLICT", "message": "Insufficient stock" }` sin que este archivo
sepa que existe HTTP.

**`createMovement`** orquesta las tres cosas en orden: 1) busca el producto con
`repository.findProductById`; si no existe **o está borrado** (`product.deleted_at`), lanza
`NotFoundError("Product not found")` — fijate que el chequeo de borrado está acá y no en el
repositorio, porque la decisión es del negocio, no de la consulta; 2) calcula el stock nuevo
con la función pura; 3) llama a `repository.createMovement(data, userId, newStock)`, que es
quien abre la transacción.

**El `userId` es un parámetro aparte, y eso es una decisión de seguridad.** No viene en
`data`, es decir, no viene del body. Lo inyecta el `authGuard` a partir del token y el
controlador lo pasa. Si el autor del movimiento viajara en el body, cualquiera podría firmar
un movimiento a nombre de otro y el historial dejaría de servir como auditoría. Regla general:
**lo que identifica a quien hace la acción sale del token, nunca del cuerpo de la petición.**

`listMovements` y `lowStock` no tienen reglas: delegan en el repositorio. Está bien que estén
acá igual, porque le dan al controlador una sola puerta de entrada al módulo y mañana, si el
reporte necesita un filtro más, el lugar ya existe.

### 12.5 `src/modules/inventory/infrastructure/inventory.prisma.repository.ts` — repo con transacción y field reference

**Archivo:** `example-project/src/modules/inventory/infrastructure/inventory.prisma.repository.ts`

Tres partes: el andamiaje, las lecturas y la escritura transaccional con el reporte de stock
bajo.

**Parte 1: el `select` con relaciones anidadas**

```typescript
import { Prisma } from "@prisma/client"
import { prisma } from "@/config/prisma"
import type { IInventoryRepository } from "../domain/inventory.interface"
import type { CreateMovementData, IInventoryMovementEntity, MovementType } from "../domain/inventory.entities"

const movementSelect = {
  id: true,
  product_id: true,
  product: { select: { id: true, name: true, barcode: true } },
  user_id: true,
  user: { select: { id: true, name: true, email: true } },
  type: true,
  quantity: true,
  unit_cost: true,
  note: true,
  created_at: true,
} as const

type MovementRecord = Prisma.inventory_movementGetPayload<{ select: typeof movementSelect }>

function mapToEntity(movement: MovementRecord): IInventoryMovementEntity {
  return {
    ...movement,
    type: movement.type as MovementType,
    unit_cost: movement.unit_cost ?? null,
    note: movement.note ?? null,
  }
}
```

`movementSelect` parece el `select` de siempre, pero tiene dos líneas que no habías visto:

```typescript
product: { select: { id: true, name: true, barcode: true } },
user:    { select: { id: true, name: true, email: true } },
```

Esto es Prisma resolviendo una **relación** dentro del mismo `select`. El modelo
`inventory_movement` tiene una clave foránea `product_id` que apunta a `product`, y otra
`user_id` que apunta a `user`. Al pedir `product` con su propio `select`, Prisma hace la
consulta necesaria (un join, o una segunda consulta, según el caso) y te devuelve el objeto
anidado ya armado. Vos escribís una consulta; Prisma se encarga del SQL.

¿Por qué importa? Porque la alternativa sería recibir solo `product_id` y después, en el
service o en el controlador, hacer una consulta por cada movimiento para buscar su producto.
Eso es el famoso problema **N+1**: una consulta para la lista y N para completar los datos.
Acá se resuelve en una sola operación y el `IInventoryMovementEntity` puede prometer `product`
y `user` como objetos.

Y siguen aplicando las reglas de la parte 1 del capítulo anterior: cada `select` anidado es
una lista blanca, así que del usuario se traen `id`, `name` y `email`, pero **no**
`password_hash`. Aunque el movimiento se muestre en un historial público para el staff, el
hash de la contraseña no sale del repositorio. Ese tipo de fuga es más común de lo que parece
y se previene exactamente así: pidiendo campos, nunca `include` de la fila completa.

`mapToEntity` tiene el casteo que anticipamos: `type: movement.type as MovementType`. La
columna es `String`, Prisma la tipa como `string`, y el dominio garantiza que es uno de los
tres literales. El `as` documenta esa garantía en el único lugar donde el dato entra al
sistema tipado. `unit_cost ?? null` y `note ?? null` normalizan los opcionales, igual que en
servicios.

**Parte 2: `findProductById` y `listMovements`**

```typescript
export const InventoryRepository: IInventoryRepository = {
  async findProductById(id) {
    return prisma.product.findFirst({
      where: { id },
      select: { id: true, stock: true, active: true, deleted_at: true },
    })
  },

  async listMovements(params) {
    const where: Prisma.inventory_movementWhereInput = {}
    if (params?.product_id) {
      where.product_id = params.product_id
    }
    if (params?.type) {
      where.type = params.type
    }

    const page = params?.page || 1
    const limit = params?.limit || 50
    const skip = (page - 1) * limit

    const [movements, total] = await Promise.all([
      prisma.inventory_movement.findMany({ where, select: movementSelect, skip, take: limit, orderBy: { created_at: "desc" } }),
      prisma.inventory_movement.count({ where }),
    ])

    return { movements: movements.map(mapToEntity), total, page, limit }
  },
```

`findProductById` es la consulta mínima que te prometí: `id`, `stock`, `active`, `deleted_at`.
Nada más. Es la contraparte exacta de `IProductStockInfo`, y ese paralelismo es intencional:
el tipo dice qué se necesita para decidir y la consulta pide exactamente eso. Notá que usa
`findFirst` y no `findUnique`: el `where` tiene un solo campo único (`id`), así que
`findUnique` también serviría; `findFirst` es la forma que usa todo el proyecto para no tener
que pensar en la diferencia.

`listMovements` arma el `where` de a poco, con un objeto vacío al principio y condiciones que
se agregan si vienen:

- `if (params?.product_id) where.product_id = params.product_id` — filtra el historial de un
  producto.
- `if (params?.type) where.type = params.type` — filtra por tipo de movimiento. Acá el `if`
  con truthiness es seguro porque los tres valores posibles son strings no vacíos; no hay un
  `false` ni un `0` que se pueda perder.
- La paginación es idéntica a la de servicios, con el mismo `Promise.all` para traer la página
  y el total juntos.
- `orderBy: { created_at: "desc" }` — los movimientos más nuevos primero. Es un **historial**,
  y en un historial lo último es lo que más importa. Fijate el contraste con servicios, que
  ordena por nombre: dos listas, dos criterios, y en los dos casos el criterio se eligió
  pensando en quien mira.

**Parte 3: la transacción, y el reporte de stock bajo**

```typescript
  async createMovement(data, userId, newStock) {
    const [movement] = await prisma.$transaction([
      prisma.inventory_movement.create({
        data: {
          product_id: data.product_id,
          user_id: userId,
          type: data.type,
          quantity: data.quantity,
          unit_cost: data.unit_cost ?? null,
          note: data.note ?? null,
        },
        select: movementSelect,
      }),
      prisma.product.update({
        where: { id: data.product_id },
        data: { stock: newStock },
      }),
    ])

    return mapToEntity(movement)
  },

  async findLowStockProducts() {
    return prisma.product.findMany({
      where: {
        deleted_at: null,
        active: true,
        stock: { lte: prisma.product.fields.low_stock_threshold },
      },
      select: { id: true, name: true, stock: true, low_stock_threshold: true },
      orderBy: { stock: "asc" },
    })
  },
}
```

Acá está la joya del capítulo. Leela despacio.

```typescript
const [movement] = await prisma.$transaction([
  prisma.inventory_movement.create({ ... }),
  prisma.product.update({ where: { id: data.product_id }, data: { stock: newStock } }),
])
```

- `prisma.$transaction([...])` recibe un **array de operaciones**. Las ejecuta en orden, dentro
  de una sola transacción, y las confirma todas al final. Si cualquiera falla, PostgreSQL
  deshace las anteriores. El `$` adelante no es un typo: marca las operaciones de nivel
  cliente, las que manejan la conexión y no una tabla.
- El array devuelve un array de resultados, en el mismo orden. De ahí `const [movement]`:
  tomamos el primero (el movimiento creado) y descartamos el segundo. Fijate que el orden del
  array **es** el orden de ejecución: crear primero y actualizar después es lo que hace que el
  `return` tenga algo que devolver.
- El `create` repite los campos a mano en vez de pasar `data` con spread, y la razón es que
  hay dos campos que **no** vienen del cliente: `user_id` (que llega como parámetro desde el
  token) y el `type` que ya validó el DTO. Escribirlos uno por uno deja ver el contrato
  completo del insert.
- `unit_cost: data.unit_cost ?? null` — con Prisma la diferencia entre `undefined` y `null`
  importa: `undefined` significa "no toques este campo / usá el default", `null` significa
  "guardá nulo". Como `unit_cost` es un opcional del DTO, acá se lo convierte a `null`
  explícito para que la columna quede en nulo y no dependa de un default.
- El `update` escribe `stock: newStock`, el número que calculó la función pura. Es una sola
  sentencia, y por eso mismo es atómica **como escritura**: nadie puede ver el campo a medio
  actualizar. Lo que la transacción no resuelve, como vimos al principio del capítulo, es que
  ese `newStock` se calculó con una lectura anterior; por eso existe la variante con
  `decrement` y `updateMany` que dejé anotada como deuda.

**`findLowStockProducts`** es la consulta más elegante del proyecto, y la que más gente lee sin
entender:

```typescript
where: {
  deleted_at: null,
  active: true,
  stock: { lte: prisma.product.fields.low_stock_threshold },
}
```

El objeto está diciendo: productos no borrados, activos, y cuyo `stock` sea menor o igual
(`lte`, *less than or equal*) que... ¿menor o igual que qué? Acá está el concepto nuevo:
**`prisma.product.fields.low_stock_threshold` es una referencia a un campo**, no un valor.

Cuando escribís `stock: { lte: 10 }`, Prisma arma `WHERE stock <= $1` y manda `10` como
parámetro. Cuando escribís `lte: prisma.product.fields.low_stock_threshold`, Prisma arma
`WHERE stock <= "low_stock_threshold"`: compara **la columna stock contra otra columna de la
misma fila**. Eso es lo que necesitás, porque cada producto tiene su propio umbral (la Coca
tiene 10, el chocolate 5). No hay número fijo que sirva para todos.

¿Por qué no hacerlo en JavaScript? Porque tendrías que traer todos los productos y filtrar en
memoria: más datos viajando, más lento, y peor, no se puede combinar con paginación ni con un
`count`. La regla práctica: **si el filtro depende de dos columnas de la misma fila, va en la
consulta; si depende de un valor fijo, también.**

El resto del `where` completa la idea: `deleted_at: null` y `active: true` excluyen lo que no
está a la venta (un producto discontinuado con stock bajo no es un problema de reposición), el
`select` trae solo los cuatro campos de `ILowStockProduct`, y `orderBy: { stock: "asc" }` pone
primero lo más urgente. El reporte te dice, en orden, qué comprar ya.

### 12.6 `src/modules/inventory/presentation/inventory.dto.ts` — DTO del movimiento

**Archivo:** `example-project/src/modules/inventory/presentation/inventory.dto.ts`

```typescript
import { z } from "zod"

export const CreateMovementDtoSchema = z.object({
  product_id: z.string().uuid("Invalid product id"),
  type: z.enum(["entrada", "salida", "ajuste"]),
  quantity: z.number().int().refine((q) => q !== 0, "Quantity must not be zero"),
  unit_cost: z.number().nonnegative().optional(),
  note: z.string().optional(),
})

export const MovementQuerySchema = z.object({
  product_id: z.string().uuid().optional(),
  type: z.enum(["entrada", "salida", "ajuste"]).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
})

export type CreateMovementDto = z.infer<typeof CreateMovementDtoSchema>
```

`CreateMovementDtoSchema` es la puerta del POST, y tiene cuatro decisiones de validación que
vale la pena leer una por una:

- `product_id: z.string().uuid("Invalid product id")` — no alcanza con que sea texto: tiene que
  tener forma de UUID. Si alguien manda `"1"` o `"abc"`, el 400 dice exactamente qué pasó. Es
  una validación de forma, no de existencia: que el producto exista lo decide el service con
  una consulta (y devuelve 404 si no).
- `type: z.enum(["entrada", "salida", "ajuste"])` — el mismo trío del tipo unión, ahora como
  validación de runtime. Este es el punto donde el string libre se convierte en un valor
  confiable: después de este `parse`, el service puede comparar con `"entrada"` sin miedo.
  Cualquier otra cosa (incluido un typo) es 400.
- `quantity: z.number().int().refine((q) => q !== 0, "Quantity must not be zero")` — entero, y
  distinto de cero. `int()` descarta `2.5` (no se mueven medias unidades en este modelo), y el
  `refine` agrega una regla propia. **`refine` es cómo se escribe una validación a medida en
  Zod**: recibe la función que ya validó el tipo y devuelve `true` o `false`; si devuelve
  `false`, el mensaje es el que pasaste. Acá la regla es de sentido común logístico: un
  movimiento de cero unidades no movió nada. Lo que **no** valida es el signo: un -5 se
  acepta a nivel de forma. La dirección la define el `type`, y la regla de que una salida no
  supere el stock vive en el service, porque necesita la base.
- `unit_cost: z.number().nonnegative().optional()` — el costo no puede ser negativo (no existe
  pagar por recibir mercadería) y es opcional porque no siempre se registra.
- `note: z.string().optional()` — texto libre.

`MovementQuerySchema` valida el `GET /inventory/movements?product_id=...&type=...&page=...`, con
los mismos trucos de siempre: `uuid()` en el filtro por producto, `z.enum` para el tipo y
`z.coerce.number()` para la paginación, que llega como texto desde la URL.

Compará con el `CreateProductDtoSchema` del capítulo 10: allá `stock` se podía mandar directo
en el POST del producto, porque crear un producto con stock inicial es razonable. Acá no hay
ningún campo de stock en la entrada, y eso es el corazón del diseño: **el stock no se escribe
nunca de frente, siempre es consecuencia de un movimiento**. Si hubiera un `stock` en este DTO,
tendrías dos formas de cambiarlo y una de ellas no dejaría historia.

### 12.7 `src/modules/inventory/presentation/inventory.controller.ts` — controlador

**Archivo:** `example-project/src/modules/inventory/presentation/inventory.controller.ts`

```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { createInventoryService } from "../application/inventory.service"
import { InventoryRepository } from "../infrastructure/inventory.prisma.repository"
import { CreateMovementDtoSchema, MovementQuerySchema } from "./inventory.dto"

const inventoryService = createInventoryService(InventoryRepository)

export const inventoryController = {
  async listMovements(request: FastifyRequest, reply: FastifyReply) {
    const query = MovementQuerySchema.parse(request.query)
    const result = await inventoryService.listMovements(query)
    return reply.status(200).send(result)
  },

  async createMovement(request: FastifyRequest, reply: FastifyReply) {
    const body = CreateMovementDtoSchema.parse(request.body)
    const result = await inventoryService.createMovement(body, request.userId)
    return reply.status(201).send(result)
  },

  async lowStock(request: FastifyRequest, reply: FastifyReply) {
    const result = await inventoryService.lowStock()
    return reply.status(200).send(result)
  },
}
```

Tres handlers, y ninguno tiene lógica: es el mismo parsear-llamar-responder de servicios.

- **`listMovements`** — parsea la query y delega. El objeto parseado ya tiene `product_id`,
  `type`, `page` y `limit` con los defaults aplicados, así que el service recibe algo
  consistente.
- **`createMovement`** — parsea el body y llama a
  `inventoryService.createMovement(body, request.userId)`. Ese segundo argumento es el que
  vimos en el service: **el autor viene del token**, inyectado por `authGuard` en
  `request.userId`, y no del body. Si el cliente mandara un `user_id`, el DTO ni siquiera lo
  acepta: Zod descarta los campos que no declara. Es una defensa en profundidad barata y
  efectiva. Responde `201`, porque creó un movimiento.
- **`lowStock`** — sin parámetros: llama y responde `200` con el array. Es un reporte, no una
  entidad, así que no hay sobre de paginación.

Fijate que el controlador no decide si hay stock suficiente ni qué tipo de movimiento es: no
sabe nada del negocio. Si mañana la regla cambia (por ejemplo, que una salida pueda dejar el
stock en cero pero no en negativo), este archivo no se toca.

### 12.8 `src/modules/inventory/presentation/inventory.routes.ts` — rutas del inventario

**Archivo:** `example-project/src/modules/inventory/presentation/inventory.routes.ts`

```typescript
import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { inventoryController } from "./inventory.controller"
import { authGuard } from "@/modules/auth/application/common/auth.guard"

export const inventoryRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  fastify.get("/movements", { preHandler: [authGuard] }, inventoryController.listMovements)
  fastify.post("/movements", { preHandler: [authGuard] }, inventoryController.createMovement)
  fastify.get("/products/low-stock", { preHandler: [authGuard] }, inventoryController.lowStock)
}
```

Tres rutas, las tres con `authGuard` y ninguna con `adminGuard`: cualquier persona
autenticada puede consultar el historial y registrar movimientos. Es coherente con la
decisión de `products` y `services` —el mostrador trabaja, el administrador administra— y con
el hecho de que el movimiento queda firmado: si alguien registra algo indebido, se sabe quién
fue.

Los tres endpoints, con un ejemplo de cada uno:

| Método y ruta | Para qué | Ejemplo |
|---|---|---|
| `GET /inventory/movements` | historial, filtrable con `?product_id=` y `?type=` | `GET /inventory/movements?type=salida` |
| `POST /inventory/movements` | registra un movimiento | body con `product_id`, `type`, `quantity`, `unit_cost?`, `note?` → 201 |
| `GET /inventory/products/low-stock` | productos con `stock <= low_stock_threshold` | `GET /inventory/products/low-stock` |

Y qué devuelve un POST, en concreto. Si mandás
`{ "product_id": "<uuid>", "type": "entrada", "quantity": 20, "unit_cost": 1.1 }` sobre un
producto que tenía 50, la respuesta `201` trae el movimiento con `product` y `user` anidados
(el nombre del producto y quién lo registró, resueltos por el `select`), y el producto en la
base queda con `stock: 70`. Si en cambio mandás `"type": "salida"` con `quantity: 100` sobre
ese mismo producto, la respuesta es `409 { "code": "CONFLICT", "message": "Insufficient stock" }`
y **no pasa nada en la base**: ni movimiento, ni cambio de stock. Esa última parte es la que
ganaste con la transacción, y es la que hace que el historial se pueda creer.

### Resumen

- Un movimiento de stock es un hecho que no se edita ni se borra; la columna `stock` es el
  total corriente y se puede recalcular sumando movimientos.
- Hay tres tipos: `entrada` suma, `salida` resta solo si hay suficiente (si no, 409
  `"Insufficient stock"`) y `ajuste` fija el stock en el número contado.
- `computeNewStock` es una función pura: mismas entradas, misma salida, sin base ni reloj, y
  por eso se puede probar sola; el `throw` de `ConflictError` es parte de su contrato.
- La transacción hace que el movimiento y el update del stock se confirmen o se deshagan
  juntos; no serializa la lectura previa, y ese hueco (lost update) se cierra moviendo la
  cuenta a la base con `decrement` o un `updateMany` condicional.
- El reporte de stock bajo usa una referencia a campo (`prisma.product.fields.low_stock_threshold`)
  para comparar dos columnas de la misma fila en SQL, en vez de filtrar en memoria.

## 13. Seed: datos iniciales

Un **seed** (semilla) es un script que carga en la base el conjunto mínimo de datos para que el
sistema pueda usarse. No son datos de producción ni un backup: son los primeros datos, los que
hacen que el sistema deje de estar vacío.

¿Y por qué hace falta? Porque una base recién migrada no sirve para nada. Mirá la cadena: sin
usuarios no podés hacer login; sin login no tenés token; sin token no podés llamar a ninguna
ruta protegida; sin productos no podés probar el inventario; sin roles no podés crear usuarios
(el `role_id` es obligatorio y tiene clave foránea). El sistema está perfectamente diseñado y no
se puede usar ni un minuto. El seed rompe ese círculo.

A esos datos iniciales también se los llama **fixtures**: un conjunto fijo y conocido que sirve
de punto de partida para probar. La gracia es que sean siempre los mismos. Si el admin es
siempre `admin@example.com` con contraseña `admin123`, entonces los archivos `.http` del
capítulo 15 pueden tener el email escrito a mano, el checklist del capítulo 16 puede pedir un
login concreto, y cualquier persona que clone el proyecto sabe con qué entrar sin preguntarle a
nadie.

Este seed carga tres cosas, en este orden: dos roles, dos usuarios y cuatro productos.

### Por qué el orden importa

`role` → `user` → `product`. No es un orden estético:

- Los usuarios necesitan un rol. La tabla `user` tiene `role_id` con clave foránea a `role`, así
  que si intentás crear un usuario antes que su rol, PostgreSQL rechaza el insert con un error
  de clave foránea (P2003). Por eso el script guarda el rol que acaba de crear
  (`const adminRole = await prisma.role.upsert(...)`) y usa `adminRole.id` en el usuario.
- Los productos van al final porque no dependen de nada. Podrían ir primero, pero el orden
  narrativo del seed —primero quién entra, después qué se vende— se lee mejor.

### Idempotencia: el mismo resultado la primera vez y la número mil

Un script es **idempotente** cuando correrlo varias veces deja el sistema en el mismo estado
que correrlo una sola vez. Es la propiedad más importante de un seed, y no es un lujo: lo vas a
correr muchas veces. Después de cada `prisma migrate reset`, después de cada cambio de esquema,
cada vez que alguien del equipo arma el proyecto, cada vez que rompas la base probando algo.

Si el seed no fuera idempotente, la segunda corrida fallaría con "unique constraint violated" en
los roles, o peor, te llenaría la base de productos repetidos sin avisar.

La herramienta para lograrlo es **`upsert`**: una operación que busca por una clave única y, si
encuentra, actualiza; si no encuentra, crea.

```typescript
prisma.role.upsert({
  where: { name: "admin" },   // cómo lo busco: un campo @unique
  update: {},                 // si existe, no cambies nada
  create: { name: "admin", description: "Full access to the system" },
})
```

Tres detalles que se pasan por alto y son la mitad del tema:

- **El `where` tiene que ser un campo único.** `upsert` necesita poder identificar la fila de
  manera inequívoca, así que solo acepta `@id` o columnas `@unique`. Los roles se buscan por
  `name`, los usuarios por `email` y los productos por `barcode`. Si intentás buscar por un
  campo que no es único, Prisma ni siquiera compila la consulta.
- **`update: {}` significa "si ya existe, no toques nada".** Es un objeto vacío a propósito: el
  seed no es un sincronizador. Si vos cambiaste la contraseña del admin mientras probabas,
  volver a correr el seed no te la va a pisar. La contracara: si cambiás la contraseña **en el
  seed**, tenés que borrar el usuario (o cambiarle el `update`) para que el cambio se aplique.
- **`upsert` devuelve la fila.** Ese retorno es lo que permite encadenar: creo el rol y me
  quedo con su `id` para el usuario.

### Las contraseñas del seed van hasheadas

Este es el punto donde más gente se equivoca al escribir su primer seed: guarda
`password: "admin123"` en el campo del hash y después no entiende por qué el login nunca
funciona.

El login compara con bcrypt: agarra la contraseña que escribiste, la hashea con el mismo salt
que está guardado en el registro y compara. Si en la base hay texto plano, la comparación
siempre falla. Por eso el seed usa exactamente la misma función que usa el flujo real de
creación de usuarios:

```typescript
const adminPasswordHash = await bcrypt.hash("admin123", SALT_ROUNDS)
```

`bcrypt.hash` es una función de hashing **con sal**: genera una cadena distinta cada vez, aun
para la misma contraseña, y guarda el salt adentro del resultado. Ese salt es lo que hace que
dos usuarios con la misma contraseña tengan hashes distintos y que una tabla precalculada de
hashes (una *rainbow table*) no sirva de nada. `SALT_ROUNDS = 10` es el costo: cuántas veces se
itera el algoritmo. Más rondas es más lento de romper y también más lento de verificar; 10 es
el valor habitual en desarrollo y el que usa el resto del proyecto.

Moraleja: **el seed tiene que entrar por la misma puerta que el resto del sistema**. Si el
sistema hashea, el seed hashea. Si el sistema borra lógicamente, el seed no borra.

### Los productos, y una excepción honesta

Los cuatro productos están pensados como fixtures que ejercitan casos distintos, no como
relleno:

- **Coca-Cola 500ml** (stock 50, umbral 10) y **Papas Lays 125g** (30, 10): stock sano.
- **Agua mineral 600ml** (stock 8, umbral 10): el único que está **por debajo de su umbral**, y
  es el que hace que `GET /inventory/products/low-stock` devuelva algo. Sin él, el endpoint
  andaría pero no tendrías cómo comprobarlo.
- **Chocolate 70g** (20, 5): el que **no tiene barcode**, para probar que el código de barras es
  opcional.

Y ahora la excepción honesta: el Chocolate rompe la idempotencia. Como no tiene `barcode` y
`barcode` es el único campo único de la tabla, no hay `where` con el que hacer `upsert`, así que
el `else` del bucle lo crea con un `create` común. Cada corrida del seed agrega otro "Chocolate
70g" más. Es el precio de no tener una clave natural, y es exactamente el tipo de detalle que
aparece cuando un sistema real crece: la solución sería buscar por `name` antes de crear (con
el riesgo de nombres repetidos) o darle un `barcode` inventado pero estable. El código del
manual deja el caso visible a propósito, porque enseña más que un seed perfecto.

### Cuándo se corre

- **Después de crear o resetear la base**: `bunx prisma migrate dev` deja el esquema listo y la
  base vacía; el seed la llena.
- **Antes de los archivos `.http` del capítulo 15 y del checklist del 16**: los dos asumen que
  existen `admin@example.com` y los cuatro productos.
- **En un pipeline de integración**, cuando querés un entorno conocido para pruebas de punta a
  punta.
- **Nunca en producción.** En producción los usuarios se crean por la API (`POST /users`, con
  `adminGuard`) y las contraseñas de ejemplo no existen. El propio script asume eso: las
  credenciales están escritas en el archivo, a la vista, porque son de juguete.

### 13.1 `src/scripts/seed.ts` — roles, usuarios y productos de ejemplo

**Archivo:** `example-project/src/scripts/seed.ts`

El archivo son unas setenta líneas. Lo leemos en cuatro partes: preparación y roles, usuarios,
productos y cierre.

**Parte 1: el cliente, el costo del hash y los roles**

```typescript
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

const SALT_ROUNDS = 10

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: { name: "admin", description: "Full access to the system" },
  })

  const staffRole = await prisma.role.upsert({
    where: { name: "staff" },
    update: {},
    create: { name: "staff", description: "Can manage products, services and inventory" },
  })
```

- `import { PrismaClient }`, y después `const prisma = new PrismaClient()` — el script crea **su
  propio** cliente de Prisma. No importa el de `src/config/prisma.ts`, y no es un descuido: el
  seed no corre dentro del servidor, es un proceso aparte que arranca, escribe y termina. Cada
  proceso tiene su pool de conexiones, y mezclarlos sería un problema.
- `const SALT_ROUNDS = 10` — el costo del hash, en una constante con nombre para que no quede un
  `10` suelto en el medio del archivo. Si mañana querés más seguridad, cambiás un solo lugar.
- `async function main()` — todo el trabajo vive adentro de una función, no suelto a nivel de
  módulo. Eso permite que el final del archivo maneje los errores de todo el bloque de una sola
  vez (lo vas a ver en la parte 4) y es el patrón que sugiere Prisma para sus scripts.
- Los dos `upsert` de roles son casi idénticos: buscan por `name`, no actualizan si existe y
  crean con una descripción. Guardan el resultado en `adminRole` y `staffRole` porque más abajo
  necesitan el `id`. Si el rol ya existía, el `upsert` te devuelve la fila existente igual: vos
  siempre tenés el `id`, exista antes o no.
- Las descripciones ("Full access to the system", "Can manage products, services and
  inventory") documentan quién puede qué. No las lee ningún `if` del código: el permiso real lo
  decide el `adminGuard` comparando `role.name`. Son para las personas que abren la tabla.

**Parte 2: los usuarios, con la contraseña hasheada**

```typescript
  const adminPasswordHash = await bcrypt.hash("admin123", SALT_ROUNDS)
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@example.com",
      password_hash: adminPasswordHash,
      role_id: adminRole.id,
    },
  })

  const staffPasswordHash = await bcrypt.hash("staff123", SALT_ROUNDS)
  await prisma.user.upsert({
    where: { email: "staff@example.com" },
    update: {},
    create: {
      name: "Staff",
      email: "staff@example.com",
      password_hash: staffPasswordHash,
      role_id: staffRole.id,
    },
  })
```

Cada usuario son dos pasos, y el orden importa:

1. `const adminPasswordHash = await bcrypt.hash("admin123", SALT_ROUNDS)` — se calcula el hash
   **antes** del `upsert`, no adentro del `create`. Parece un detalle y no lo es: si estuviera
   adentro, cada corrida del seed calcularía un hash nuevo aunque el usuario ya exista (trabajo
   al pedo, porque el `update: {}` lo descarta), y además el hash quedaría calculado dentro de
   un objeto literal que se evalúa cuando Prisma lo necesita. Afuera se lee mejor y se ejecuta
   una sola vez.
2. `prisma.user.upsert({ where: { email }, update: {}, create: { ..., role_id: adminRole.id } })`
   — busca por `email`, que es `@unique`; si no existe, crea el usuario con el hash y el
   `role_id` del rol que creamos en la parte 1.

El `update: {}` tiene una consecuencia práctica que conviene tener presente: **si el usuario ya
existe, la contraseña no se toca**. Si cambiaste `admin123` por otra cosa en el seed y volvés a
correrlo, el login sigue respondiendo con la vieja. Para forzar el cambio, borrás el usuario (o
le ponés `update: { password_hash: adminPasswordHash }`, que es lo que harías en un seed
"sincronizador"). Este seed no sincroniza: planta.

**Parte 3: los productos**

```typescript
  const products = [
    { name: "Coca-Cola 500ml", barcode: "7790000000011", price: 1.5, cost: 1.1, stock: 50, low_stock_threshold: 10 },
    { name: "Papas Lays 125g", barcode: "7790000000028", price: 2.0, cost: 1.4, stock: 30, low_stock_threshold: 10 },
    { name: "Agua mineral 600ml", barcode: "7790000000035", price: 0.8, cost: 0.4, stock: 8, low_stock_threshold: 10 },
    { name: "Chocolate 70g", price: 1.2, cost: 0.9, stock: 20, low_stock_threshold: 5 },
  ]

  for (const product of products) {
    if (product.barcode) {
      await prisma.product.upsert({
        where: { barcode: product.barcode },
        update: {},
        create: product,
      })
    } else {
      await prisma.product.create({ data: product })
    }
  }
```

- El array `products` es **data**, no código: cuatro objetos con la misma forma que espera el
  `create` de Prisma. Tenerlos juntos hace que agregar un producto de prueba sea copiar una
  línea.
- `for (const product of products)` recorre y decide caso por caso.
- `if (product.barcode)` — solo si tiene código de barras se puede hacer `upsert`, porque es el
  único campo único con el que identificar la fila. `where: { barcode: product.barcode }` usa la
  propiedad del objeto actual, no un valor fijo: por eso el `upsert` está dentro del bucle y no
  repetido cuatro veces.
- `create: product` pasa el objeto entero. Prisma ignora las claves que no son columnas y
  escribe las demás. En el tercer producto, `barcode` existe; en el cuarto, directamente no
  está la clave, así que la columna queda en `null` (que es lo que permite el `String?` del
  esquema).
- `else { await prisma.product.create({ data: product }) }` — la rama del Chocolate. Es la
  excepción a la idempotencia que ya comentamos: como no hay clave natural, cada corrida crea
  una fila nueva.

**Parte 4: el cierre, que es el manejo de errores**

```typescript
  console.log("Seed completed: roles, users and products created")
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

- `console.log("Seed completed: roles, users and products created")` es la única salida del
  script. Cuando lo corrés, esa línea es tu confirmación de que llegó al final. Un seed que
  termina sin imprimir nada te deja la duda de si corrió.
- `main().catch((error) => { console.error(error); process.exit(1) })` — si algo falla en
  cualquier punto de `main`, el error se imprime y el proceso sale con código **1**. Ese código
  es lo que mira un script de CI (o tu terminal, con `echo $?`) para saber si salió bien. Sin
  el `process.exit(1)`, un fallo podría quedar como un log perdido entre otras líneas.
- `.finally(async () => { await prisma.$disconnect() })` — el `finally` corre **siempre**, haya
  salido bien o mal, y cierra el pool de conexiones a PostgreSQL. Esto no es opcional: Prisma
  mantiene conexiones abiertas y, mientras estén abiertas, el proceso de Bun no termina. El
  síntoma clásico de olvidarse el `$disconnect` es un script que hace todo bien y se queda
  colgado al final, y vos apretando Ctrl+C sin entender por qué.
- La forma `main().catch(...).finally(...)` es una cadena: `main()` devuelve una promesa, el
  `catch` la atrapa, el `finally` limpia. Es el mismo `try`/`catch`/`finally` de siempre,
  escrito en estilo promesa.

Y con esto la base tiene datos. Lo único que falta para confiar en el sistema es saber que las
reglas funcionan sin tener que probarlas a mano una por una. Eso es el próximo capítulo.

### Resumen

- Un seed es el script que carga los datos mínimos para que el sistema arranque: acá, dos roles,
  dos usuarios (`admin@example.com`/`admin123` y `staff@example.com`/`staff123`) y cuatro
  productos.
- Es idempotente porque usa `upsert` con `update: {}`: busca por un campo único (`name`,
  `email`, `barcode`) y no toca nada si ya existe; el Chocolate, sin barcode, es la excepción
  que cada corrida duplica.
- Las contraseñas se guardan con `bcrypt.hash(..., 10)`, igual que en el flujo real: si el seed
  guardara texto plano, el login nunca funcionaría.
- El orden es roles → usuarios → productos, porque `user.role_id` es una clave foránea que
  exige que el rol exista primero.
- Se corre después de migrar o resetear la base y antes de los `.http`; nunca en producción, y
  siempre cierra con `$disconnect` en el `finally` para que el proceso termine.

## 14. Testing

Un **test** es código que verifica que otro código hace lo que promete. Nada más que eso, y
nada menos: es la diferencia entre "creo que anda" y "sé que anda, y lo puedo volver a
comprobar en dos segundos después de cada cambio".

Hay tres tamaños, y conviene tenerlos claros antes de escribir una línea:

- **Test unitario** — prueba una pieza aislada: una función, una clase, un service. Rápido
  (milisegundos), sin base de datos, sin red. Cuando falla, sabés exactamente dónde mirar.
- **Test de integración** — prueba varias piezas juntas: el service con un repositorio real, la
  API con una base de datos. Más lento y más frágil, pero verifica que las piezas encajen.
- **Test de punta a punta (e2e)** — levanta todo y hace una petición HTTP como la haría un
  cliente. Es el más caro y el que más se parece a la realidad.

Este proyecto elige una estrategia muy concreta y la sostiene en los seis archivos que vas a
leer: **tests unitarios de los services, con repositorios falsos**. Ni base de datos ni red.

### Por qué se prueban los services y no la capa HTTP

Porque las reglas de negocio viven ahí. Pensalo así: si el login rechaza una contraseña
incorrecta, esa decisión está en `auth.service.ts`, no en el controlador (que solo parsea y
delega) ni en la ruta (que solo dice quién pasa). Probar el service es probar la decisión; el
resto es cañería.

Y hay tres ventajas prácticas que se notan desde el primer día:

- **Velocidad.** Los 33 tests del proyecto corren en medio segundo. Podés correrlos cada vez que
  guardás un archivo sin pensarlo dos veces.
- **Determinismo.** No hay red que se caiga, ni base que tenga datos de la corrida anterior, ni
  reloj. Un test que falla, falla por el código.
- **Diagnóstico.** Si el test del login falla, el problema está en el service de auth o en lo
  que ese service espera del repositorio. No hay que investigar si fue PostgreSQL, si fue la
  cookie, si fue el plugin.

Ahora la parte honesta, porque no todo se cubre así: **estos tests no prueban que la ruta
exista, ni que el DTO valide, ni que el SQL sea correcto**. Un repositorio falso acepta
cualquier cosa, así que si el `select` de Prisma está mal escrito o el `$transaction` está
armado al revés, los tests no se enteran. Por eso el manual tiene dos capítulos más: los
archivos `.http` (capítulo 15) para ejercitar la API de verdad, y el checklist con curl
(capítulo 16) para comprobar el sistema completo. Unitario para las reglas, manual y de punta a
punta para el cableado. Las dos cosas, no una.

### Qué es un fake, y en qué se diferencia de un mock

Estas cuatro palabras se usan como sinónimos y no lo son. La diferencia está en **qué hacen
por vos**:

- **Stub** — devuelve algo fijo. "Si te piden el usuario, devolvé este objeto".
- **Fake** — una implementación de verdad, pero simplificada. No tiene base de datos: tiene un
  objeto en memoria, o directamente valores fijos. Cumple el contrato y funciona.
- **Spy** — envuelve algo real (o falso) y **registra** las llamadas: cuántas veces, con qué
  argumentos.
- **Mock** — un objeto con expectativas programadas: "espero que te llamen una vez con estos
  argumentos, y si no, fallá el test".

En este proyecto se usan **fakes**. `makeFakeAuthRepository()` devuelve un objeto que implementa
`IAuthRepository` completo: tiene los cinco métodos, todos con un comportamiento razonable por
defecto (`findUserByEmail` devuelve `null`, `deleteSession` no hace nada). El service lo recibe
y no tiene forma de saber que no es el repositorio de Prisma: para él es un repositorio, punto.
Eso es lo que hace que el test sea un test del service y no del service *y* de Prisma *y* de
PostgreSQL.

¿Y el mock? En los tests vas a ver otra cosa, más simple y muy efectiva: una **bandera**.

```typescript
let sessionCreated = false
createSession: async () => { sessionCreated = true; ... }
...
assert.equal(sessionCreated, true)
```

No hay un objeto mock con expectativas: hay una variable del test que el fake toca cuando lo
llaman, y una aserción sobre esa variable. Logra lo mismo (probar que el service **hizo** algo,
no solo que devolvió algo) con la mitad de ceremonia. Es un spy artesanal, y para un proyecto
así alcanza y sobra.

### `bun:test` y `assert/strict`

Las herramientas son dos, y las dos vienen con Bun: no hay que instalar nada.

- **`bun:test`** es el runner. Se importa `test` y se registra un caso:
  `test("nombre del caso", async () => { ... })`. El runner descubre solo los archivos
  `*.test.ts` del proyecto, los ejecuta y te muestra un resumen. `bun test` corre todo;
  `bun test auth` corre solo los archivos cuyo nombre coincide con ese patrón.
- **`node:assert/strict`** es el módulo de aserciones de Node, y Bun lo implementa. Se importa
  como `assert` y se usa `assert.ok`, `assert.equal`, `assert.rejects`, etc. La variante
  `/strict` hace que `equal` compare con `===` (en la versión no estricta compara con `==`, que
  convierte tipos y te deja pasar `"3"` donde esperabas `3`). Siempre la estricta.

Una **aserción** es la frase que dice "esto tiene que ser verdad". Si es verdad, el test sigue;
si no, el test falla en esa línea, con el valor esperado y el obtenido.

Las tres que se usan en el proyecto:

- `assert.ok(valor)` — falla si el valor es falsy (`null`, `undefined`, `0`, `""`, `false`).
  Sirve para "esto existe": `assert.ok(result.accessToken)`.
- `assert.equal(actual, esperado)` — falla si no son estrictamente iguales. Para comparar
  strings, números y booleanos.
- `assert.rejects(fn, ErrorEsperado)` — para el camino feliz del error. Falla si `fn` **no**
  lanza. Se le pasa una **función que devuelve la promesa**, no la promesa ya creada:

```typescript
await assert.rejects(() => service.getById("missing"), NotFoundError)
```

  ¿Por qué una función y no `service.getById("missing")` directo? Porque así la aserción
  controla el momento en que se dispara la operación: la promesa no existe hasta que
  `assert.rejects` la pide, y todo rechazo queda atrapado por la aserción. Si le pasás la
  promesa ya creada, la operación arrancó antes de la aserción, el error puede aparecer como
  rechazo sin manejar y el test falla con un mensaje confuso en vez de decirte qué error
  esperaba. La regla práctica: **función, no promesa**.

  El segundo argumento, cuando es una clase de error, hace un chequeo de `instanceof`. O sea,
  `assert.rejects(..., NotFoundError)` no dice "falló algo": dice "falló con un error que **es**
  un `NotFoundError`", que es la parte que importa. Si el service tirara un `Error` genérico o
  un 500, el test fallaría igual.

### El patrón: tres piezas en cada archivo

Los seis archivos de tests siguen la misma receta, y cuando la reconozcas vas a poder leer
cualquiera de ellos en diagonal:

1. **Un builder de entidades** — `makeUser`, `makeRole`, `makeProduct`... Una función que
   devuelve una entidad válida completa, con todos los campos, y acepta `overrides` al final:

```typescript
function makeRole(overrides: Partial<IRoleEntity> = {}): IRoleEntity {
  return { id: "r1", name: "admin", ..., ...overrides }
}
```

   El spread va **último**, así lo que pasa el test gana. Y el tipo `Partial<IRoleEntity>` dice
   que podés pasar cualquier subconjunto de campos: lo que no pases queda con el default.

2. **Una factory de repositorio falso** — `makeFakeRoleRepository(overrides)`, con todos los
   métodos del contrato devolviendo algo razonable y un spread de `overrides` al final. El tipo
   del parámetro es `Record<string, unknown>`: a propósito flojo, porque cada test overridea
   métodos distintos y tipar eso con precisión sería más trabajo que beneficio.

3. **Los tests** — arman el repositorio con lo que necesitan, crean el service, ejecutan la
   operación y afirman el resultado o el error.

Ese patrón tiene un nombre en la jerga (object mother + test doubles) y un beneficio concreto:
**el test se lee como una historia**. Todo lo que no es relevante para el caso queda en los
defaults, y lo único que ves en el cuerpo del test es lo que ese caso prueba.

### Errores de Prisma reales como fixtures

Acá hay un detalle que separa un test que prueba algo de un test que prueba nada.

Cuando el repositorio de `products` recibe de PostgreSQL un error de clave única, lo traduce a
`ConflictError`. Para probar esa traducción, el test necesita que el fake lance **un error
parecido al de Prisma**. Y "parecido" tiene que ser exacto, porque el repositorio hace esto:

```typescript
if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") { ... }
```

Si el fake lanzara un objeto común `{ code: "P2002" }`, el `error.code === "P2002"` daría
verdadero, pero el `instanceof` daría falso y la traducción nunca ocurriría. El test pasaría por
el camino equivocado (o fallaría por una razón que no tiene nada que ver con la regla).

Por eso `src/tests/fakes.ts` construye **instancias reales**:

```typescript
new Prisma.PrismaClientKnownRequestError(mensaje, { code: "P2002", clientVersion: "6.0.0" })
```

Es la misma clase que usa Prisma en producción, así que el `instanceof` funciona de verdad. Los
dos códigos que importan:

- **P2002** — violación de restricción única: "ya existe otro registro con ese `barcode` / ese
  `email` / ese `name`".
- **P2003** — violación de clave foránea: estás apuntando a un `role_id` que no existe, o
  borrando algo que otro registro referencia.

Y un detalle de la construcción: después del `new`, el helper hace
`Object.assign(error, { meta: { target } })`. El `meta` es donde Prisma pone los detalles del
error (qué columnas fallaron), y la firma del constructor no lo acepta como opción, así que se
asigna después. `target` es el array de columnas (`["barcode"]`), y el mensaje lo imita con
`target.join("`,`")` para que el texto se parezca al de verdad.

### Cómo se corren

```bash
bun test
```

Eso corre los 33 tests de los seis archivos en aproximadamente medio segundo. La mayor parte de
ese medio segundo no es lógica: son los `bcrypt.hash` reales que algunos tests generan a
propósito (10 rondas de hashing cuestan unos milisegundos cada uno). Es un precio bajo por
probar el login con un hash de verdad.

Para correr un solo archivo, el runner acepta un filtro por nombre:

```bash
bun test auth
```

Y en el capítulo 16 lo vas a ver como paso 5 del checklist, entre el chequeo de tipos y el
arranque del servidor.

### 14.1 `src/tests/fakes.ts` — fábricas de errores Prisma para tests

**Archivo:** `example-project/src/tests/fakes.ts`

```typescript
import { Prisma } from "@prisma/client"

export function makeP2002(target: string[]) {
  const error = new Prisma.PrismaClientKnownRequestError(
    `Unique constraint failed on the fields: (\`${target.join("`,`")}\`)`,
    { code: "P2002", clientVersion: "6.0.0" },
  )
  Object.assign(error, { meta: { target } })
  return error
}

export function makeP2003(target: string) {
  const error = new Prisma.PrismaClientKnownRequestError("Foreign key constraint failed", {
    code: "P2003",
    clientVersion: "6.0.0",
  })
  Object.assign(error, { meta: { field_name: target } })
  return error
}
```

Dos funciones, una por código de error, y las dos tienen la misma forma.

`makeP2002(target: string[])` recibe el array de columnas que violaron la restricción única.
Adentro:

- `const error = new Prisma.PrismaClientKnownRequestError(...)` — instancia real, importada de
  `@prisma/client`. El primer argumento es el mensaje, y está armado con un template string que
  imita el de Prisma: ``Unique constraint failed on the fields: (`barcode`)``. El
  `target.join("`,`")` une las columnas con comas y backticks.
- El segundo argumento es un objeto de opciones con `code: "P2002"` y `clientVersion: "6.0.0"`.
  `clientVersion` es obligatorio para la clase y no afecta la lógica: es metadata de qué versión
  del cliente generó el error.
- `Object.assign(error, { meta: { target } })` — agrega el `meta` después, porque la firma del
  constructor no lo recibe. Lo que el repositorio lee de ahí es `error.meta.target`, la lista de
  columnas; mantener la forma real es lo que hace que el type guard y la lectura funcionen
  iguales que con un error de verdad.
- `return error` — y el test lo lanza desde el fake con `throw`.

`makeP2003(target: string)` hace lo mismo para claves foráneas, con dos diferencias: el mensaje
es `"Foreign key constraint failed"` y el `meta` usa `{ field_name: target }` (singular, y como
string, no como array), que es la forma en que Prisma reporta este error.

¿Por qué el archivo se llama `fakes.ts` y no `errors.ts`? Porque es el lugar donde viven las
**fábricas de objetos falsos** del proyecto; hoy son errores de Prisma, mañana podría sumarse
otra. Lo único importante es que no está en `src/modules/`: es infraestructura de test,
compartida por todos los módulos.

### 14.2 `src/modules/auth/_tests_/application/auth.service.test.ts` — tests del service de auth (la plantilla)

**Archivo:** `example-project/src/modules/auth/_tests_/application/auth.service.test.ts`

Este es el archivo más largo y el más ilustrativo: seis tests que cubren el login, el refresh y
el logout del service de autenticación. Lo leemos en tres partes. (La cuarta operación, `me`,
no tiene test propio: devuelve un perfil y su lógica —buscar y tirar 401 si no existe— es la
misma que ya cubre el refresh.)

**Parte 1: imports, el repositorio falso y el builder de usuario**

```typescript
import { test } from "bun:test"
import assert from "node:assert/strict"
import { UnauthorizedError } from "@/core/errors/AppError"
import { createAuthService } from "../../application/auth.service"
import { hashPassword } from "../../application/common/crypto.utils"
import { generateRefreshToken } from "../../application/common/token.utils"

const makeFakeAuthRepository = (overrides: Record<string, unknown> = {}) => ({
  findUserByEmail: async () => null,
  findUserById: async () => null,
  createSession: async () => ({ id: "s1", user_id: "u1", refresh_token: "refresh-token", expires_at: new Date(), created_at: new Date() }),
  findSessionByToken: async () => null,
  deleteSession: async () => {},
  ...overrides,
})

function makeUser(passwordHash: string) {
  return {
    id: "u1",
    name: "Admin",
    email: "admin@example.com",
    password_hash: passwordHash,
    role: { id: "r1", name: "admin" },
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  }
}
```

- Los dos primeros imports son las herramientas: `test` del runner y `assert` de Node.
- `UnauthorizedError` es el error de dominio que el service lanza; el test lo necesita para
  afirmar qué error se tiró.
- `createAuthService` es lo que se está probando, y viene de `../../application/auth.service`.
  La ruta relativa tiene sentido si mirás dónde vive el archivo:
  `src/modules/auth/_tests_/application/`. Desde ahí, `..` sube a `_tests_`, `../..` sube a
  `auth`, y de ahí entra a `application/` y `domain/`. Los tests se espejan de la estructura del
  módulo, y por eso las rutas suben dos niveles.
- `hashPassword` y `generateRefreshToken` **no** son los objetos bajo prueba: son utilidades
  reales que los tests usan para armar datos que de verdad funcionen con el service. Un hash de
  mentira (`"hashed"`) no serviría para probar un login exitoso, porque `comparePassword`
  fallaría.

`makeFakeAuthRepository(overrides)` es el repositorio falso. Tiene los cinco métodos del
contrato, todos con un default que hace "no encontré nada":

- `findUserByEmail: async () => null` y `findUserById: async () => null` — nadie existe. Así, un
  test que quiere un usuario existente tiene que decirlo explícitamente, y los tests de error no
  necesitan overrides.
- `createSession` devuelve una sesión válida con fechas. No importa que sea distinta en cada
  test: el service solo la espera, no la compara.
- `findSessionByToken: async () => null` — ningún refresh válido por defecto.
- `deleteSession: async () => {}` — no hace nada, pero existe y es `async`.
- `...overrides` al final: lo que el test pase pisa el default. Esa línea es la que convierte
  cinco métodos fijos en infinitas variantes.

`makeUser(passwordHash)` recibe el hash **como parámetro**, y eso es una decisión: es el único
campo que cambia entre tests (uno necesita un hash real de `"password123"`, otro un hash
cualquiera), así que en vez de un `overrides` genérico se pide lo que varía. El resto del
usuario es fijo: `id: "u1"`, email `admin@example.com`, `role: { id: "r1", name: "admin" }`
(anidado, como lo devuelve el repositorio), activo y sin borrar.

**Parte 2: los tres tests del login**

```typescript
test("login returns tokens and user when credentials are valid", async () => {
  const hashed = await hashPassword("password123")
  let sessionCreated = false
  const repository = makeFakeAuthRepository({
    findUserByEmail: async () => makeUser(hashed),
    createSession: async () => {
      sessionCreated = true
      return { id: "s1", user_id: "u1", refresh_token: "refresh-token", expires_at: new Date(), created_at: new Date() }
    },
  })
  const service = createAuthService(repository)

  const result = await service.login("admin@example.com", "password123")

  assert.ok(result.accessToken)
  assert.ok(result.refreshToken)
  assert.equal(result.user.email, "admin@example.com")
  assert.equal(result.user.role, "admin")
  assert.equal(sessionCreated, true)
})

test("login throws UnauthorizedError when password is wrong", async () => {
  const hashed = await hashPassword("password123")
  const repository = makeFakeAuthRepository({
    findUserByEmail: async () => makeUser(hashed),
  })
  const service = createAuthService(repository)

  await assert.rejects(
    () => service.login("admin@example.com", "wrong-password"),
    UnauthorizedError,
  )
})

test("login throws UnauthorizedError when user does not exist", async () => {
  const service = createAuthService(makeFakeAuthRepository())

  await assert.rejects(
    () => service.login("nobody@example.com", "password123"),
    UnauthorizedError,
  )
})
```

**Test 1 — "login returns tokens and user when credentials are valid"**. Es el test completo y
el que más enseña, porque tiene las tres piezas en acción:

- `const hashed = await hashPassword("password123")` — un hash **real** de la contraseña que va a
  usar el test. `hashPassword` es la misma función que usa el service en producción, así que
  `comparePassword` va a poder verificarlo.
- `let sessionCreated = false` — la bandera del spy artesanal.
- El override de `findUserByEmail` devuelve `makeUser(hashed)`: ahora sí existe un usuario con
  esa contraseña.
- El override de `createSession` marca la bandera **y** devuelve una sesión (el service no usa el
  retorno, pero el contrato promete una).
- `const service = createAuthService(repository)` — acá se ve la razón de la factory del
  capítulo 07: el service se arma con el repositorio que le pasás. En producción, el de Prisma;
  acá, el falso. El service no cambia una línea.
- `const result = await service.login("admin@example.com", "password123")` — la operación real.
- `assert.ok(result.accessToken)` y `assert.ok(result.refreshToken)` — los dos tokens existen.
  `ok` alcanza porque no interesa el contenido (firmarlos es responsabilidad de otra utilidad,
  ya probada por el uso), interesa que estén.
- `assert.equal(result.user.email, "admin@example.com")` — el perfil viaja con el login.
- `assert.equal(result.user.role, "admin")` — el service **aplana** el rol: la entidad tiene
  `{ id, name }` y la respuesta tiene el string. El test fija ese contrato.
- `assert.equal(sessionCreated, true)` — y esto es lo que distingue un test completo de uno
  incompleto: no alcanza con que el login devuelva tokens; tiene que haber **creado la sesión**
  en la base. Si alguien borra el `repository.createSession(...)` del service, los tokens
  seguirían saliendo y el test fallaría en esta línea. Esa es la aserción que protege la
  funcionalidad de verdad.

**Test 2 — contraseña incorrecta**. Mismo usuario, misma contraseña hasheada, pero el login se
llama con `"wrong-password"`. `await assert.rejects(() => service.login(...), UnauthorizedError)`
— la assertion es sobre el **tipo** del error, no sobre el mensaje. ¿Por qué? Porque el tipo es
el contrato (401), y el mensaje puede cambiar sin romper nada.

**Test 3 — usuario inexistente**. Sin overrides: el repo devuelve `null` para cualquier email.
Otra vez `UnauthorizedError`. Y acá está la decisión de seguridad que el test fija sin
nombrarla: **el mismo error para "no existe" y para "contraseña incorrecta"**. Si fueran
distintos, un atacante podría averiguar qué emails están registrados probando uno por uno.

**Parte 3: refresh y logout**

```typescript
test("refresh returns a new access token for a valid session", async () => {
  const hashed = await hashPassword("password123")
  const refreshToken = generateRefreshToken({ userId: "u1" })
  const repository = makeFakeAuthRepository({
    findSessionByToken: async () => ({ id: "s1", user_id: "u1", refresh_token: refreshToken, expires_at: new Date(Date.now() + 1000 * 60 * 60), created_at: new Date() }),
    findUserById: async () => makeUser(hashed),
  })
  const service = createAuthService(repository)

  const result = await service.refresh(refreshToken)

  assert.ok(result.accessToken)
})

test("refresh throws UnauthorizedError when the session is expired", async () => {
  const refreshToken = generateRefreshToken({ userId: "u1" })
  const repository = makeFakeAuthRepository({
    findSessionByToken: async () => ({ id: "s1", user_id: "u1", refresh_token: refreshToken, expires_at: new Date(Date.now() - 1000 * 60 * 60), created_at: new Date() }),
    findUserById: async () => null,
  })
  const service = createAuthService(repository)

  await assert.rejects(() => service.refresh(refreshToken), UnauthorizedError)
})

test("logout deletes the session", async () => {
  let deleted = false
  const repository = makeFakeAuthRepository({
    deleteSession: async () => {
      deleted = true
    },
  })
  const service = createAuthService(repository)

  await service.logout("refresh-token")

  assert.equal(deleted, true)
})
```

**Test 4 — refresh con sesión válida**. Acá hay un detalle que hace la diferencia entre un test
que pasa y un test que prueba algo:

- `const refreshToken = generateRefreshToken({ userId: "u1" })` — un token **real**, firmado con
  el mismo secreto y la misma función que usa el sistema. Si usara el string `"refresh-token"`,
  el `verifyRefreshToken` del service fallaría y el test no llegaría nunca a la parte
  interesante.
- `findSessionByToken` devuelve una sesión con `expires_at: new Date(Date.now() + 1000 * 60 * 60)`
  — una hora en el futuro. Ese `+` es todo el test: la sesión no está vencida.
- `findUserById` devuelve el usuario, porque el refresh lo vuelve a buscar para armar un access
  token nuevo con datos frescos (si le cambiaron el rol, el token nuevo lo refleja).
- `assert.ok(result.accessToken)` — devuelve un access token nuevo. Nada más: el refresh no
  emite un refresh nuevo, renueva el corto.

**Test 5 — refresh con sesión vencida**. La única diferencia con el anterior es que
`expires_at` está en el pasado: `new Date(Date.now() - 1000 * 60 * 60)`, una hora atrás. El
service encuentra la sesión, ve que venció y tira `UnauthorizedError`. Fijate que `findUserById`
devuelve `null`: no hace falta que exista, porque el service corta antes. El test es más fuerte
de lo que parece: demuestra que el orden de los chequeos importa y que la expiración se evalúa
**antes** de buscar al usuario.

**Test 6 — logout**. La bandera `deleted` arranca en `false`, el override de `deleteSession` la
pone en `true`, y `assert.equal(deleted, true)` afirma que el service efectivamente borró la
sesión. Es el mismo patrón de spy que en el login, aplicado a un efecto que no devuelve nada: sin
la bandera, un `logout` que no hiciera nada pasaría el test sin que te enteres.

Y una nota sobre el conjunto: los seis tests usan el mismo repositorio falso y el mismo builder,
cambian dos o tres líneas cada uno, y cubren el flujo completo de la autenticación. Eso es lo que
se busca: no tests largos y únicos, sino casos chicos y legibles.

### 14.3 `src/modules/roles/_tests_/application/roles.service.test.ts` — tests del CRUD de roles

**Archivo:** `example-project/src/modules/roles/_tests_/application/roles.service.test.ts`

```typescript
import { test } from "bun:test"
import assert from "node:assert/strict"
import { ConflictError, NotFoundError } from "@/core/errors/AppError"
import { makeP2002 } from "@/tests/fakes"
import { createRoleService } from "../../application/roles.service"
import type { IRoleEntity } from "../../domain/roles.entities"

function makeRole(overrides: Partial<IRoleEntity> = {}): IRoleEntity {
  return {
    id: "r1",
    name: "admin",
    description: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  }
}

const makeFakeRoleRepository = (overrides: Record<string, unknown> = {}) => ({
  findAll: async () => ({ roles: [makeRole()], total: 1, page: 1, limit: 50 }),
  findById: async () => null,
  findByName: async () => null,
  create: async (data: { name: string; description?: string | null }) => makeRole({ name: data.name, description: data.description ?? null }),
  update: async (id: string, data: { name?: string; description?: string | null }) => makeRole({ id, ...data }),
  softDelete: async () => {},
  ...overrides,
})

test("list returns roles mapped to response", async () => {
  const service = createRoleService(makeFakeRoleRepository())
  const result = await service.list()

  assert.equal(result.total, 1)
  assert.equal(result.roles[0]?.name, "admin")
  assert.equal("deleted_at" in result.roles[0]!, false)
})

test("getById throws NotFoundError when role does not exist", async () => {
  const service = createRoleService(makeFakeRoleRepository())
  await assert.rejects(() => service.getById("missing"), NotFoundError)
})

test("create throws ConflictError when the name already exists", async () => {
  const service = createRoleService(
    makeFakeRoleRepository({
      findByName: async () => makeRole({ name: "admin" }),
    }),
  )
  await assert.rejects(() => service.create({ name: "admin" }), ConflictError)
})

test("create maps the created role to response", async () => {
  const repository = makeFakeRoleRepository({
    create: async (data: { name: string; description?: string | null }) => makeRole({ id: "r9", name: data.name, description: data.description ?? null }),
  })
  const service = createRoleService(repository)

  const result = await service.create({ name: "cajero", description: "Cashier" })

  assert.equal(result.id, "r9")
  assert.equal(result.name, "cajero")
  assert.equal(result.description, "Cashier")
})

test("update throws NotFoundError when role does not exist", async () => {
  const service = createRoleService(
    makeFakeRoleRepository({
      update: async () => {
        throw makeP2002(["name"])
      },
    }),
  )
  await assert.rejects(() => service.update("missing", { name: "x" }), NotFoundError)
})

test("delete throws NotFoundError when role does not exist", async () => {
  const service = createRoleService(makeFakeRoleRepository())
  await assert.rejects(() => service.delete("missing"), NotFoundError)
})
```

Seis tests, el CRUD completo. Qué prueba cada uno:

- **"list returns roles mapped to response"** — que la lista venga con el sobre (`total`,
  `roles`) y, sobre todo, con `assert.equal("deleted_at" in result.roles[0]!, false)`. Esa línea
  es más interesante de lo que parece: no compara un valor, verifica que **la clave no exista**.
  Es la forma de probar que el mapper no filtra el borrado lógico al cliente. El `!` al final es
  una aserción de no-nulo para TypeScript (el índice `[0]` podría no existir según el tipo), no
  afecta la ejecución.
- **"getById throws NotFoundError..."** — el default del fake devuelve `null`, así que alcanza
  con llamar y esperar el 404.
- **"create throws ConflictError when the name already exists"** — el override de `findByName`
  devuelve un rol existente. El service chequea duplicados **antes** de crear (a diferencia de
  `products`, que deja que la base falle y traduce el P2002). Dos estrategias para el mismo
  problema, y el test de cada módulo fija la que le corresponde.
- **"create maps the created role to response"** — que el id y los campos vuelvan mapeados. Acá
  el override de `create` devuelve un rol con `id: "r9"` para poder afirmar que el `id` que
  llega a la respuesta es el que devolvió el repositorio, no otro.
- **"update throws NotFoundError..."** — y este merece un párrafo aparte, porque tiene una
  trampa.
- **"delete throws NotFoundError..."** — el de siempre.

Ahora la trampa, porque es una lección buenísima y aparece en código real todo el tiempo. En el
test de `update`, el override es:

```typescript
update: async () => { throw makeP2002(["name"]) },
```

O sea: el repositorio lanza un error de clave única. Y el test espera `NotFoundError`. ¿Cómo
puede pasar? Porque **ese override nunca se ejecuta**. El service hace primero
`repository.findById(id)`, que devuelve `null` con el default, y corta ahí con `NotFoundError`.
La función que lanza P2002 queda escrita, se lee, y no corre jamás.

El test pasa, pero por el motivo correcto y con código de más: si borraras ese override, el test
seguiría pasando igual. Es un falso positivo de cobertura, un override decorativo. Cuando
escribas tests, desconfiá de los overrides que no cambian el resultado: si el test pasa igual
sin ellos, o están de más o te falta la aserción que los justifica.

### 14.4 `src/modules/users/_tests_/application/users.service.test.ts` — tests de users

**Archivo:** `example-project/src/modules/users/_tests_/application/users.service.test.ts`

```typescript
import { test } from "bun:test"
import assert from "node:assert/strict"
import { ConflictError, NotFoundError } from "@/core/errors/AppError"
import { comparePassword } from "@/modules/auth/application/common/crypto.utils"
import { createUserService } from "../../application/users.service"
import type { IUserEntity } from "../../domain/users.entities"

function makeUser(overrides: Partial<IUserEntity> = {}): IUserEntity {
  return {
    id: "u1",
    name: "Admin",
    email: "admin@example.com",
    password_hash: "hashed",
    role_id: "r1",
    role: { id: "r1", name: "admin" },
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  }
}

const makeFakeUserRepository = (overrides: Record<string, unknown> = {}) => ({
  findAll: async () => ({ users: [makeUser()], total: 1, page: 1, limit: 50 }),
  findById: async () => null,
  findByEmail: async () => null,
  create: async (data: { name: string; email: string; password_hash: string; role_id: string }) => makeUser({ ...data, id: "u9" }),
  update: async (id: string, data: Partial<IUserEntity> & { role_id?: string }) => makeUser({ id, ...data }),
  softDelete: async () => {},
  ...overrides,
})

test("list returns users without password_hash", async () => {
  const service = createUserService(makeFakeUserRepository())
  const result = await service.list()

  assert.equal(result.total, 1)
  assert.equal(result.users[0]?.email, "admin@example.com")
  assert.equal("password_hash" in result.users[0]!, false)
})

test("create throws ConflictError when the email already exists", async () => {
  const service = createUserService(
    makeFakeUserRepository({
      findByEmail: async () => makeUser(),
    }),
  )
  await assert.rejects(
    () => service.create({ name: "Other", email: "admin@example.com", password: "password123", role_id: "r2" }),
    ConflictError,
  )
})

test("create hashes the password before storing it", async () => {
  let storedHash = ""
  const repository = makeFakeUserRepository({
    create: async (data: { name: string; email: string; password_hash: string; role_id: string }) => {
      storedHash = data.password_hash
      return makeUser({ ...data, id: "u9" })
    },
  })
  const service = createUserService(repository)

  const result = await service.create({ name: "Cashier", email: "cashier@example.com", password: "password123", role_id: "r2" })

  assert.equal(storedHash !== "password123", true)
  assert.equal(await comparePassword("password123", storedHash), true)
  assert.equal(result.id, "u9")
})

test("getById throws NotFoundError when user does not exist", async () => {
  const service = createUserService(makeFakeUserRepository())
  await assert.rejects(() => service.getById("missing"), NotFoundError)
})

test("delete throws NotFoundError when user does not exist", async () => {
  const service = createUserService(makeFakeUserRepository())
  await assert.rejects(() => service.delete("missing"), NotFoundError)
})
```

Cinco tests, y tres de ellos prueban cosas que en otros módulos no existen.

**El `password_hash` no sale nunca.** Igual que en roles con `deleted_at`, el test de `list`
verifica `assert.equal("password_hash" in result.users[0]!, false)`. Es la prueba de que el
mapper de usuarios filtra el hash. Vale la pena tenerlo como test y no como comentario: es el
tipo de cosa que alguien "optimiza" sacando el mapper y filtrando en el controlador, y entonces
la fuga aparece en otro endpoint.

**Crear un usuario hashea la contraseña.** Este es el test más lindo del archivo. El override de
`create` captura el `password_hash` que recibió en una variable del test (`storedHash`), y
después se afirman dos cosas:

- `assert.equal(storedHash !== "password123", true)` — lo que se guardó no es la contraseña en
  texto plano. Es una aserción negativa, y sola no alcanzaría: `"basura"` también es distinto de
  `"password123"`.
- `assert.equal(await comparePassword("password123", storedHash), true)` — y acá está la prueba
  de verdad: bcrypt **puede verificar** que ese hash corresponde a la contraseña. O sea, no solo
  es distinto: es un hash válido de la contraseña correcta. Entre las dos aserciones, el test
  cubre exactamente el contrato ("guardá la contraseña de forma recuperable pero no legible").

Fijate que el test importa `comparePassword` desde el módulo de auth: los tests pueden cruzar
módulos, porque no son código de producción. Y está bien que lo haga: verificar con la misma
herramienta que usa el login es lo que hace que la prueba sea real.

**Email duplicado → `ConflictError`.** El override de `findByEmail` devuelve un usuario; el
service chequea antes de crear. Igual que en roles, y a diferencia de products (que traduce el
P2002 de la base), acá hay doble defensa: el chequeo del service y la restricción `@unique` del
esquema.

Los otros dos son los 404 de siempre: `getById` y `delete` con un id que no existe.

### 14.5 `src/modules/products/_tests_/application/products.service.test.ts` — tests de products (con P2002)

**Archivo:** `example-project/src/modules/products/_tests_/application/products.service.test.ts`

```typescript
import { test } from "bun:test"
import assert from "node:assert/strict"
import { Prisma } from "@prisma/client"
import { ConflictError, NotFoundError } from "@/core/errors/AppError"
import { makeP2002 } from "@/tests/fakes"
import { createProductService } from "../../application/products.service"
import type { CreateProductData, IProductEntity, UpdateProductData } from "../../domain/products.entities"

function makeProduct(overrides: Partial<IProductEntity> = {}): IProductEntity {
  return {
    id: "p1",
    barcode: "7790000000011",
    name: "Coca-Cola 500ml",
    price: new Prisma.Decimal("1.50"),
    cost: new Prisma.Decimal("1.10"),
    stock: 50,
    low_stock_threshold: 5,
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  }
}

const makeFakeProductRepository = (overrides: Record<string, unknown> = {}) => ({
  findAll: async () => ({ products: [makeProduct()], total: 1, page: 1, limit: 50 }),
  findById: async () => null,
  create: async (data: CreateProductData) => makeProduct({ ...data, id: "p9" } as unknown as IProductEntity),
  update: async (id: string, data: UpdateProductData) => makeProduct({ id, ...data } as unknown as IProductEntity),
  softDelete: async () => {},
  ...overrides,
})

test("list maps Decimal prices to numbers", async () => {
  const service = createProductService(makeFakeProductRepository())
  const result = await service.list()

  assert.equal(result.total, 1)
  assert.equal(result.products[0]?.price, 1.5)
  assert.equal(result.products[0]?.cost, 1.1)
})

test("getById throws NotFoundError when product does not exist", async () => {
  const service = createProductService(makeFakeProductRepository())
  await assert.rejects(() => service.getById("missing"), NotFoundError)
})

test("create maps the created product to response", async () => {
  const service = createProductService(makeFakeProductRepository())
  const result = await service.create({ name: "Agua 600ml", price: 0.8 })

  assert.equal(result.id, "p9")
  assert.equal(result.name, "Agua 600ml")
})

test("create propagates ConflictError when the barcode already exists", async () => {
  const repository = makeFakeProductRepository({
    create: async () => {
      throw makeP2002(["barcode"])
    },
  })
  const service = createProductService(repository)

  await assert.rejects(
    () => service.create({ name: "Duplicated", price: 1 }),
    ConflictError,
  )
})

test("update throws NotFoundError when product does not exist", async () => {
  const service = createProductService(
    makeFakeProductRepository({
      update: async () => makeProduct(),
    }),
  )
  await assert.rejects(() => service.update("missing", { price: 2 }), NotFoundError)
})

test("delete throws NotFoundError when product does not exist", async () => {
  const service = createProductService(makeFakeProductRepository())
  await assert.rejects(() => service.delete("missing"), NotFoundError)
})
```

Seis tests. Dos son nuevos respecto del patrón, y los dos tienen que ver con las cosas que hacen
especial a este módulo.

**Decimal entra, number sale.** `makeProduct` construye la entidad con
`price: new Prisma.Decimal("1.50")` y `cost: new Prisma.Decimal("1.10")` — objetos `Decimal`
reales, como los que devuelve Prisma. Y el test afirma:

```typescript
assert.equal(result.products[0]?.price, 1.5)
assert.equal(result.products[0]?.cost, 1.1)
```

Con `assert.equal` estricto. Si el mapper no convirtiera, el valor sería un objeto `Decimal` y la
comparación fallaría (un objeto no es `1.5`). Es la forma de probar una conversión de tipo: no
alcanza con que el número sea "parecido", tiene que ser un `number` de JavaScript. Fijate el
`?.` después de `[0]`: TypeScript no sabe si el índice existe y el `?.` evita el error de tipo
sin cambiar el comportamiento.

**El P2002 se traduce a `ConflictError`.** Este es el test que justifica todo el archivo
`fakes.ts`. El override de `create` no devuelve un producto: **lanza** `makeP2002(["barcode"])`,
un error de Prisma de verdad. Y el service, adentro del `try`/`catch` de `products.service.ts`,
lo reconoce por `instanceof` y por código, y lo convierte en `ConflictError` — o sea, en un 409
con `"Barcode already exists"`.

```typescript
await assert.rejects(
  () => service.create({ name: "Duplicated", price: 1 }),
  ConflictError,
)
```

Leé lo que prueba: no prueba que el service "falle" (cualquier error haría fallar la promesa),
prueba que falla con **el error de dominio correcto**, el que el errorHandler convierte en 409.
Si mañana alguien cambia el `catch` y deja pasar el error de Prisma crudo, este test falla. Esa
es la "doble capa de defensa" del capítulo 10: el service chequea duplicados cuando puede, y
cuando la base igual falla (por una carrera entre dos POST simultáneos), el repositorio traduce.
El test cubre la segunda capa, que es la que casi nadie prueba.

Los otros cuatro tests son el patrón conocido: `list` (mapeo), `getById` 404, `create` mapeado,
`update` 404 y `delete` 404.

Una nota sobre el tipado de los fakes, porque aparece acá y en servicios:

```typescript
create: async (data) => makeProduct({ ...data, id: "p9" } as unknown as IProductEntity)
```

El cast va por `unknown` porque el objeto que armamos (`{ ...data, id }`) no tiene
`created_at`, `updated_at` ni `deleted_at`: no es un `IProductEntity` completo y TypeScript no
deja convertirlo directo. Es un detalle de tests, no de producción: el fake devuelve un producto
"suficientemente completo" para lo que el service mira. El doble cast es feo, y es preferible a
inventar tres fechas en cada fake.

### 14.6 `src/modules/services/_tests_/application/services.service.test.ts` — tests de services

**Archivo:** `example-project/src/modules/services/_tests_/application/services.service.test.ts`

```typescript
import { test } from "bun:test"
import assert from "node:assert/strict"
import { Prisma } from "@prisma/client"
import { NotFoundError } from "@/core/errors/AppError"
import { createServiceService } from "../../application/services.service"
import type { CreateServiceData, IServiceEntity, UpdateServiceData } from "../../domain/services.entities"

function makeService(overrides: Partial<IServiceEntity> = {}): IServiceEntity {
  return {
    id: "s1",
    name: "Corte de cabello",
    description: null,
    base_price: new Prisma.Decimal("10.00"),
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  }
}

const makeFakeServiceRepository = (overrides: Record<string, unknown> = {}) => ({
  findAll: async () => ({ services: [makeService()], total: 1, page: 1, limit: 50 }),
  findById: async () => null,
  create: async (data: CreateServiceData) => makeService({ ...data, id: "s9" } as unknown as IServiceEntity),
  update: async (id: string, data: UpdateServiceData) => makeService({ id, ...data } as unknown as IServiceEntity),
  softDelete: async () => {},
  ...overrides,
})

test("list maps Decimal base_price to number", async () => {
  const service = createServiceService(makeFakeServiceRepository())
  const result = await service.list()

  assert.equal(result.total, 1)
  assert.equal(result.services[0]?.base_price, 10)
})

test("getById throws NotFoundError when service does not exist", async () => {
  const service = createServiceService(makeFakeServiceRepository())
  await assert.rejects(() => service.getById("missing"), NotFoundError)
})

test("create maps the created service to response", async () => {
  const service = createServiceService(makeFakeServiceRepository())
  const result = await service.create({ name: "Manicura", base_price: 15 })

  assert.equal(result.id, "s9")
  assert.equal(result.name, "Manicura")
})

test("delete throws NotFoundError when service does not exist", async () => {
  const service = createServiceService(makeFakeServiceRepository())
  await assert.rejects(() => service.delete("missing"), NotFoundError)
})
```

Cuatro tests, y la brevedad es el mensaje: **el módulo con menos reglas tiene el archivo de tests
más corto**. Si este archivo tuviera quince casos, sería una señal de que el módulo está haciendo
cosas que no debería.

- **"list maps Decimal base_price to number"** — `assert.equal(result.services[0]?.base_price, 10)`
  con `new Prisma.Decimal("10.00")` en la entidad. El `"10.00"` es importante: demuestra que la
  conversión no deja `"10.00"` ni `10.0` ni un `Decimal`, sino el número `10`. Si el mapper
  estuviera mal, esta línea lo caza.
- **"getById throws NotFoundError..."** — 404 cuando no existe.
- **"create maps the created service to response"** — `id` y `name` mapeados; `base_price` no se
  afirma acá porque ya está cubierto por el test de `list` (el mismo mapper).
- **"delete throws NotFoundError..."** — 404 al borrar algo que no existe.

Y lo que **no** hay, dicho de frente: no hay test de `update`. En `roles` y `products` sí lo hay;
acá no. No es un olvido dramático (la lógica de `update` es la de `delete`: buscar, 404,
delegar), pero es una diferencia real entre archivos, y es honesto verla. Cuando escribas tus
propios tests, la pregunta no es "¿tengo un test por método?" sino "¿qué regla quiero que no se
rompa nunca?". Acá, la regla que importa es la existencia y el mapeo del `Decimal`.

### 14.7 `src/modules/inventory/_tests_/application/inventory.service.test.ts` — tests de inventario (las reglas de stock)

**Archivo:** `example-project/src/modules/inventory/_tests_/application/inventory.service.test.ts`

Seis tests, y son los más importantes del capítulo: acá se prueban las tres reglas del capítulo
12 sin base de datos. Lo leemos en tres partes.

**Parte 1: el builder y el fake**

```typescript
import { test } from "bun:test"
import assert from "node:assert/strict"
import { Prisma } from "@prisma/client"
import { ConflictError, NotFoundError } from "@/core/errors/AppError"
import { createInventoryService } from "../../application/inventory.service"
import type { IInventoryMovementEntity } from "../../domain/inventory.entities"

function makeMovement(overrides: Partial<IInventoryMovementEntity> = {}): IInventoryMovementEntity {
  return {
    id: "m1",
    product_id: "p1",
    product: { id: "p1", name: "Coca-Cola 500ml", barcode: "7790000000011" },
    user_id: "u1",
    user: { id: "u1", name: "Admin", email: "admin@example.com" },
    type: "entrada",
    quantity: 10,
    unit_cost: null,
    note: null,
    created_at: new Date(),
    ...overrides,
  }
}

const makeFakeInventoryRepository = (overrides: Record<string, unknown> = {}) => ({
  findProductById: async () => ({ id: "p1", stock: 50, active: true, deleted_at: null }),
  listMovements: async () => ({ movements: [makeMovement()], total: 1, page: 1, limit: 50 }),
  createMovement: async (_data: unknown, _userId: string, newStock: number) => makeMovement({ id: "m9" }),
  findLowStockProducts: async () => [],
  ...overrides,
})
```

`makeMovement` es el builder de siempre, con una diferencia: `type: "entrada"` como default y
todos los campos del movimiento, incluidos `product` y `user` anidados (porque la entidad los
promete). Los tests que necesitan una salida o un ajuste pasan `{ type: "salida" }` y el spread
lo pisa.

`makeFakeInventoryRepository` tiene cuatro métodos, y el default de `findProductById` es la clave
de todo el archivo:

```typescript
findProductById: async () => ({ id: "p1", stock: 50, active: true, deleted_at: null }),
```

Un producto con **stock 50**. Todos los tests aritméticos parten de ahí: 50 + 10 = 60, 50 - 10 =
40. Tener el punto de partida fijo en el fake hace que los números de las aserciones se puedan
leer de un vistazo, sin ir a buscar el override de cada test.

`createMovement: async (_data, _userId, newStock) => makeMovement({ id: "m9" })` — el fake del
método que abre la transacción. Los parámetros que no usa van con `_` adelante por convención, y
el `newStock` sí lo declara porque algunos tests lo van a capturar. Devuelve un movimiento con
otro id para que se pueda distinguir del default.

**Parte 2: entrada, salida y el caso del stock insuficiente**

```typescript
test("createMovement with entrada adds to the stock", async () => {
  let newStock = -1
  const repository = makeFakeInventoryRepository({
    createMovement: async (_data: unknown, _userId: string, stock: number) => {
      newStock = stock
      return makeMovement()
    },
  })
  const service = createInventoryService(repository)

  const result = await service.createMovement({ product_id: "p1", type: "entrada", quantity: 10 }, "u1")

  assert.equal(newStock, 60)
  assert.equal(result.id, "m1")
})

test("createMovement with salida subtracts from the stock", async () => {
  let newStock = -1
  const repository = makeFakeInventoryRepository({
    createMovement: async (_data: unknown, _userId: string, stock: number) => {
      newStock = stock
      return makeMovement({ type: "salida" })
    },
  })
  const service = createInventoryService(repository)

  await service.createMovement({ product_id: "p1", type: "salida", quantity: 10 }, "u1")

  assert.equal(newStock, 40)
})

test("createMovement with salida throws ConflictError when stock is insufficient", async () => {
  const repository = makeFakeInventoryRepository({
    findProductById: async () => ({ id: "p1", stock: 5, active: true, deleted_at: null }),
  })
  const service = createInventoryService(repository)

  await assert.rejects(
    () => service.createMovement({ product_id: "p1", type: "salida", quantity: 10 }, "u1"),
    ConflictError,
  )
})
```

Acá está el truco que hace testable una regla que vive adentro del service: **capturar el
argumento con una bandera**, igual que en auth pero con un número.

```typescript
let newStock = -1
const repository = makeFakeInventoryRepository({
  createMovement: async (_data, _userId, stock) => {
    newStock = stock
    return makeMovement()
  },
})
...
assert.equal(newStock, 60)
```

- `let newStock = -1` — el valor centinela. Arranca en un número imposible (un stock nunca es
  negativo) para que, si el repositorio no se llamara, la aserción falle con `-1` y se vea al
  instante que el service cortó antes.
- El override de `createMovement` guarda el tercer argumento en esa variable. El service calcula
  el stock nuevo y se lo pasa al repositorio; el test lo intercepta ahí, en el borde, que es
  exactamente donde termina la responsabilidad del service.
- `assert.equal(newStock, 60)` — la regla de la entrada: 50 + 10. No afirma sobre la base (no
  hay base), afirma sobre **el número que el service decidió escribir**. Eso es lo que hace
  `computeNewStock`, y eso es lo que se está probando.

Ese patrón es el que vas a usar cada vez que quieras probar "qué valor decidió el service", y
es mejor que devolver el valor desde el service: no cambia el código de producción para que sea
testeable.

Los tres tests de esta parte:

- **entrada suma** — 50 + 10 = 60, y además `assert.equal(result.id, "m1")`: la respuesta viene
  mapeada desde el movimiento que devolvió el repositorio.
- **salida resta** — 50 - 10 = 40. El override devuelve `makeMovement({ type: "salida" })` para
  que la respuesta sea coherente, aunque lo que se afirma es el `newStock`.
- **salida con stock insuficiente** — el override de `findProductById` devuelve stock 5 y se
  piden 10. `assert.rejects(..., ConflictError)`: el 409. Y acá hay una consecuencia que no está
  escrita pero es la más importante: como el service lanza antes de llamar al repositorio,
  **no se crea ningún movimiento y no se toca ningún stock**. Es la prueba de que un rechazo no
  deja basura, que es la mitad del valor de la regla.

**Parte 3: ajuste, producto inexistente y stock bajo**

```typescript
test("createMovement with ajuste sets the stock to the quantity", async () => {
  let newStock = -1
  const repository = makeFakeInventoryRepository({
    createMovement: async (_data: unknown, _userId: string, stock: number) => {
      newStock = stock
      return makeMovement({ type: "ajuste" })
    },
  })
  const service = createInventoryService(repository)

  await service.createMovement({ product_id: "p1", type: "ajuste", quantity: 7 }, "u1")

  assert.equal(newStock, 7)
})

test("createMovement throws NotFoundError when product does not exist", async () => {
  const repository = makeFakeInventoryRepository({
    findProductById: async () => null,
  })
  const service = createInventoryService(repository)

  await assert.rejects(
    () => service.createMovement({ product_id: "p9", type: "entrada", quantity: 1 }, "u1"),
    NotFoundError,
  )
})

test("lowStock returns the products under their threshold", async () => {
  const lowStockProducts = [
    { id: "p3", name: "Agua 600ml", stock: 3, low_stock_threshold: 5 },
  ]
  const repository = makeFakeInventoryRepository({
    findLowStockProducts: async () => lowStockProducts,
  })
  const service = createInventoryService(repository)

  const result = await service.lowStock()

  assert.equal(result.length, 1)
  assert.equal(result[0]?.stock, 3)
})
```

- **"ajuste sets the stock to the quantity"** — el test más elocuente del archivo. El producto
  tiene 50, el movimiento es `{ type: "ajuste", quantity: 7 }`, y la aserción es
  `assert.equal(newStock, 7)`. No 57: **7**. Si alguien implementara el ajuste como una suma,
  esto daría 57 y el test lo cazaría. Es la prueba de que "fijar" y "sumar" son cosas distintas,
  escrita en una línea.
- **"throws NotFoundError when product does not exist"** — `findProductById` devuelve `null`. Ojo
  con el detalle: el service también chequea `product.deleted_at`, pero este test cubre el caso
  `null`. El caso "existe pero está borrado" no tiene test propio; se cubre con el mismo `if`, y
  es una de esas cosas que estaría bien agregar.
- **"lowStock returns the products under their threshold"** — `findLowStockProducts` devuelve un
  array con un producto, y se afirman `length` y `stock`. Qué prueba exactamente: que el service
  **delega** y devuelve lo que el repositorio le dio, sin filtrar ni transformar. La consulta en
  sí (el `field reference`, el `lte`, el orden) no se prueba acá, porque para eso haría falta una
  base de datos. Es el límite explícito de esta estrategia, y el capítulo 16 lo cubre a mano con
  el endpoint real.

### Qué cubre esta estrategia y qué no

Vale la pena decirlo junto, ahora que leíste los seis archivos:

| Sí cubre | No cubre |
|---|---|
| las reglas de negocio (stock, duplicados, hashing, expiración) | que la ruta exista y tenga el prefijo correcto |
| el mapeo entidad → respuesta (Decimal, campos ocultos) | que el DTO valide lo que dice validar |
| que los errores de dominio sean del tipo correcto | que el SQL sea correcto (el `field reference`, la transacción) |
| que un rechazo no deje efectos | que las cookies se manden y el `authGuard` las lea |

La segunda columna es el trabajo de los capítulos 15 y 16: el archivo `.http` prueba una petición
de verdad, y el checklist con curl prueba el sistema de punta a punta. Las dos estrategias juntas
—rápida y determinista para las reglas, manual y completa para el cableado— es lo que un proyecto
chico puede sostener sin inventar una infraestructura de tests que después nadie mantiene.

### Resumen

- Acá se prueban los **services** con repositorios falsos: sin base ni red, 33 tests en seis
  archivos corridos con `bun test` en medio segundo.
- Un **fake** implementa el contrato con comportamiento simple; un **mock** programa
  expectativas. El proyecto usa fakes y "banderas" (`sessionCreated`, `newStock`) como espías
  artesanales para probar efectos, no solo valores de retorno.
- `assert.equal` compara estricto, `assert.ok` verifica que algo exista y `assert.rejects(fn, Error)`
  recibe una **función** que devuelve la promesa y comprueba el **tipo** del error con
  `instanceof`.
- Los errores de Prisma se construyen como instancias reales de
  `Prisma.PrismaClientKnownRequestError` con su `code` y su `meta`: un objeto trucho pasaría el
  chequeo del código pero fallaría el `instanceof`, y el test no probaría la traducción.
- Cada archivo prueba lo suyo: auth las credenciales y la sesión, roles y users sus conflictos,
  products el P2002 y el `Decimal`, services el mapeo, e inventory las tres reglas de stock —
  incluida la más importante, que un ajuste **fija** el stock en vez de sumarlo.

## 15. Archivos de prueba HTTP

Llegó el momento de tocar la API con la mano. Hasta acá escribiste reglas y las probaste con
tests; ahora necesitás comprobar lo otro: que las rutas existan, que las cookies viajen, que el
DTO rechace lo que tiene que rechazar y que el JSON de respuesta tenga la forma que promete.

La herramienta que usa el proyecto es un **archivo de peticiones HTTP**: un archivo de texto
donde escribís peticiones reales, y que tu editor puede ejecutar con un clic. En el proyecto hay
uno por módulo, dentro de la carpeta `http/`.

### Qué es un archivo `.http`

Un `.http` es texto plano con una sintaxis mínima:

```http
### 1. Login as admin
POST http://localhost:3000/auth/login
Content-Type: application/json

{ "email": "admin@example.com", "password": "admin123" }
```

- `###` separa una petición de la siguiente. Lo que viene después de los tres numerales en la
  misma línea es el **nombre** del bloque, y es solo para vos: no se envía.
- `#` solo (una sola almohadilla) es un comentario.
- La primera línea del bloque es la **línea de petición**: método HTTP, espacio, URL completa.
- Después vienen las **cabeceras**, una por línea, con la forma `Nombre: valor`.
- Una **línea en blanco** separa las cabeceras del cuerpo. Si no hay línea en blanco, el cliente
  no sabe dónde empieza el body.
- El cuerpo es JSON (o el formato que indique el `Content-Type`), y no lleva la indentación
  obligatoria: podés escribir el objeto en una línea o en varias.

¿Quién lo ejecuta? El **cliente HTTP de tu editor**. En VS Code es la extensión REST Client
(*humao.rest-client*): con el archivo abierto, aparece un botón "Send Request" arriba de cada
bloque `###`, y la respuesta se muestra al costado. En los IDE de JetBrains la funcionalidad es
nativa, y los mismos archivos se pueden importar a Postman o a Insomnia. El servidor no sabe que
esto existe: para él es una petición HTTP común y corriente.

¿Por qué archivos de texto y no una colección de Postman? Porque **viven en el repositorio al
lado del código**. Los revisás en un pull request, los ve el que clona el proyecto, se
versionan con git y no dependen de una cuenta en la nube. Un `### 3. Register a salida` que
explica el caso de prueba vale más que veinte líneas de README, y encima se puede ejecutar.

### Anatomía de una petición autorizada

Antes de leer los seis archivos, hay un solo flujo que entender, y el resto se lee solo. Todo el
sistema de autenticación cabe en tres pasos:

**1. El login entrega las credenciales por cookie.** Cuando hacés `POST /auth/login`, el body de
la respuesta trae solo tu perfil (`{ "user": { ... } }`), pero las cabeceras traen dos
`Set-Cookie`: una con `access_token` (vive 15 minutos) y otra con `refresh_token` (vive 7 días).
Las dos son `httpOnly`, o sea que no se pueden leer desde JavaScript del navegador: viajan y se
guardan solas, y el código de la página nunca las toca. Es la defensa contra el robo de tokens
por XSS.

**2. El cliente guarda esas cookies.** Un navegador las guarda en su *cookie jar* y las manda de
vuelta automáticamente en cada petición al mismo dominio. Un archivo `.http` no siempre hace
eso: por eso los archivos de este proyecto son explícitos y tienen una cabecera `Cookie` en cada
petición protegida. El valor lo sacás vos de la respuesta del login (de la cabecera
`Set-Cookie: access_token=...`, o del cookie jar si tu cliente lo mantiene) y lo pegás en el
lugar del placeholder.

**3. La petición protegida manda la cookie, y el `authGuard` la valida.** El guard busca el
token primero en la cookie y, si no está, en la cabecera `Authorization: Bearer <token>`. Con el
token verificado, inyecta `request.userId`, `request.userEmail` y `request.userRole` y deja
pasar. Sin token o con token vencido, responde `401`.

De ahí salen las dos cosas que vas a ver repetidas en todos los archivos: la cabecera
`Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN` en cada petición protegida, y los placeholders
`REPLACE_WITH_*` para los ids.

**Los placeholders son parte del diseño, no un error.** Un archivo no puede saber de antemano el
UUID del rol que vas a crear: eso lo devuelve el servidor. Entonces el flujo es: hacés el
`GET` de la lista, copiás el `id` que te interesa, y lo pegás donde dice
`REPLACE_WITH_ROLE_ID`. Si el editor te lo permite, ese paso se puede automatizar con variables
(el cliente REST de VS Code tiene `@nombre` y `{{variable}}`), pero estos archivos eligen la
forma manual porque se entienden sin saber la sintaxis de ninguna herramienta.

Un detalle que conviene saber para no confundirse: el paso 3 del archivo de auth pide un refresh
token en el body y devuelve un `accessToken` nuevo **en el body**, sin volver a setear la cookie.
Si trabajás con cookies, después de un refresh te conviene volver a loguearte; si preferís el
esquema `Authorization: Bearer`, usá el token que devolvió el refresh. Es una asimetría real del
diseño actual, y vale la pena conocerla antes de que te sorprenda.

Con eso, los seis archivos son fáciles de escanear.

### 15.1 `http/auth.http` — login, refresh, logout y me

**Archivo:** `example-project/http/auth.http`

```http
### 1. Login as admin
# Response sets access_token and refresh_token cookies
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}

### 2. Login as staff
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "staff@example.com",
  "password": "staff123"
}

### 3. Refresh access token
POST http://localhost:3000/auth/refresh
Content-Type: application/json

{
  "refresh_token": "REPLACE_WITH_REFRESH_TOKEN"
}

### 4. Get my profile
GET http://localhost:3000/auth/me
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN

### 5. Logout
POST http://localhost:3000/auth/logout
Cookie: refresh_token=REPLACE_WITH_REFRESH_TOKEN
```

Cinco peticiones que cubren el ciclo de vida de una sesión. Lo que tenés que esperar de cada
una:

1. **Login as admin** — `200` con `{ "user": { "id", "name", "email", "role": "admin" } }` y dos
   cookies en las cabeceras. Si te equivocás de contraseña, `401` con
   `{ "code": "UNAUTHORIZED", "message": "Invalid credentials" }`: el mismo mensaje que si el
   email no existiera, a propósito.
2. **Login as staff** — igual, pero el rol es `staff`. Te sirve para tener un segundo usuario con
   menos permisos y comprobar que `GET /roles` le devuelve `403`.
3. **Refresh** — manda el `refresh_token` en el body (mirá el DTO del capítulo 07: el refresh
   viaja en el body, no en cookie) y recibe un `accessToken` nuevo. Con un refresh revocado o
   vencido, `401 "Invalid or expired refresh token"`.
4. **Get my profile** — `GET /auth/me` con la cookie `access_token`. Devuelve el perfil del dueño
   del token. Sin cookie ni header, `401 "Authentication required"`: es la prueba más rápida de
   que el `authGuard` está enchufado.
5. **Logout** — manda la cookie `refresh_token` y borra la sesión de la base. Devuelve `200` con
   `{ "message": "Logged out successfully" }`. El access token que ya tenías sigue siendo válido
   hasta que venza: eso lo explica el capítulo 16.

Este es el archivo que hay que hacer funcionar primero. Si el login no devuelve cookies, todo lo
demás va a dar 401 y vas a estar adivinando.

### 15.2 `http/roles.http` — CRUD de roles

**Archivo:** `example-project/http/roles.http`

```http
### 1. List roles (admin only)
GET http://localhost:3000/roles
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN

### 2. Get role by id
GET http://localhost:3000/roles/REPLACE_WITH_ROLE_ID
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN

### 3. Create role
POST http://localhost:3000/roles
Content-Type: application/json
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN

{
  "name": "supervisor",
  "description": "Can supervise the cashiers"
}

### 4. Update role
PUT http://localhost:3000/roles/REPLACE_WITH_ROLE_ID
Content-Type: application/json
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN

{
  "description": "Updated description"
}

### 5. Delete role
DELETE http://localhost:3000/roles/REPLACE_WITH_ROLE_ID
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN
```

El CRUD completo de roles, en cinco peticiones y en el orden en que conviene probarlo: listar,
buscar uno, crear, actualizar, borrar.

- **List roles** — `200` con `{ "roles": [...], "total": 2, "page": 1, "limit": 50 }`. Con el
  seed corrido, adentro están `admin` y `staff`. **Esta es la petición que te da el
  `REPLACE_WITH_ROLE_ID`**: copiás el `id` de `staff` y lo pegás en los demás bloques.
- **Get role by id** — `200` con el rol, o `404 "Role not found"` si el id no existe.
- **Create role** — `201` con el rol creado. Si repetís el mismo nombre, `409 "Role name already
  exists"`: es el chequeo de duplicados del service, y es la petición más útil del archivo para
  ver un error de negocio funcionando.
- **Update role** — `200` con el rol actualizado. Mandar solo `description` funciona porque el PUT
  es parcial.
- **Delete role** — `200` con `{ "message": "Role deleted successfully" }`. Es un borrado lógico:
  el rol desaparece de la lista pero la fila sigue en la base con `deleted_at`.

Todas las peticiones llevan `Cookie: access_token=...`, y todas necesitan un usuario **admin**:
con el token del staff, cualquiera de estas devuelve `403 "Admin access required"`.

### 15.3 `http/users.http` — CRUD de usuarios + toggle active

**Archivo:** `example-project/http/users.http`

```http
### 1. List users (admin only)
GET http://localhost:3000/users
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN

### 2. Get user by id
GET http://localhost:3000/users/REPLACE_WITH_USER_ID
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN

### 3. Create user
# Get a valid role_id from the roles list first
POST http://localhost:3000/users
Content-Type: application/json
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN

{
  "name": "Cashier",
  "email": "cashier@example.com",
  "password": "cashier123",
  "role_id": "REPLACE_WITH_ROLE_ID"
}

### 4. Update user
PUT http://localhost:3000/users/REPLACE_WITH_USER_ID
Content-Type: application/json
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN

{
  "name": "Cashier Updated"
}

### 5. Toggle user active status
PATCH http://localhost:3000/users/REPLACE_WITH_USER_ID/active
Content-Type: application/json
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN

{
  "is_active": false
}

### 6. Delete user
DELETE http://localhost:3000/users/REPLACE_WITH_USER_ID
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN
```

Seis peticiones, dos de ellas con algo particular.

- **List users** y **Get user by id** — `200` con el sobre de paginación y el usuario. Fijate lo
  que **no** aparece en ninguna respuesta: `password_hash`. El mapper del capítulo 09 se encarga,
  y esta es la forma de comprobarlo con los ojos.
- **Create user** — `201`. El `role_id` tiene que ser un UUID real: copialo de `roles.http` (ahí
  está el comentario "Get a valid role_id from the roles list first"). Si le mandás un UUID que
  no existe, la clave foránea falla y el repositorio lo traduce: `400` con un mensaje sobre el
  rol inexistente. Si el email ya está registrado, `409 "Email already exists"`.
- **Update user** — `200`. Cambiar el nombre alcanza; el PUT es parcial.
- **Toggle active status** — `PATCH /users/:id/active` con `{ "is_active": false }`. Es el
  endpoint que no es ni un PUT ni un DELETE: activa o desactiva sin borrar. Un usuario inactivo
  no puede loguearse (el login chequea `is_active`), pero sus movimientos de inventario siguen
  ahí, firmados.
- **Delete user** — `200` con un mensaje. Y acá el caso interesante: si el `:id` es el tuyo (el
  del token con el que estás logueado), responde `400 "You cannot delete your own account"`. Esa
  protección vive en el controlador, que compara `request.params.id` con `request.userId`. Para
  probarla, logueate con admin y borrá el id del admin.

### 15.4 `http/products.http` — CRUD de productos

**Archivo:** `example-project/http/products.http`

```http
### 1. List products (any authenticated user)
GET http://localhost:3000/products
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN

### 2. Search products
GET http://localhost:3000/products?search=coca
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN

### 3. Get product by id
GET http://localhost:3000/products/REPLACE_WITH_PRODUCT_ID
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN

### 4. Create product
POST http://localhost:3000/products
Content-Type: application/json
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN

{
  "name": "Sprite 500ml",
  "barcode": "7790000000042",
  "price": 1.5,
  "cost": 1.1,
  "stock": 40,
  "low_stock_threshold": 10
}

### 5. Update product
PUT http://localhost:3000/products/REPLACE_WITH_PRODUCT_ID
Content-Type: application/json
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN

{
  "price": 1.6
}

### 6. Delete product
DELETE http://localhost:3000/products/REPLACE_WITH_PRODUCT_ID
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN
```

Seis peticiones y dos cosas para mirar.

**La búsqueda** (`GET /products?search=coca`) es la query `?search=` del DTO, que el repositorio
convierte en un `ILIKE '%coca%'`. Devolvería la Coca-Cola del seed y cualquier cosa que tenga
"coca" en el nombre. Es la forma más rápida de ver la paginación y el filtro funcionando juntos.

**El barcode repetido** es el caso de prueba del P2002: el `POST` del bloque 4 crea la Sprite con
`7790000000042`; si lo corrés dos veces, la segunda devuelve `409 "Barcode already exists"`. Y si
en vez de eso mandás el `7790000000011` de la Coca-Cola del seed, también. Es el error de negocio
que más se ve en la vida real, y acá lo tenés a un clic.

El resto es el CRUD conocido: listar (cualquier usuario autenticado, admin o staff), buscar uno,
crear (`201`, con `stock` inicial incluido: crear un producto sí acepta stock, porque todavía no
hay historia que lo explique), actualizar (`200`) y borrar lógicamente (`200` con mensaje).

### 15.5 `http/services.http` — CRUD de servicios

**Archivo:** `example-project/http/services.http`

```http
### 1. List services
GET http://localhost:3000/services
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN

### 2. Get service by id
GET http://localhost:3000/services/REPLACE_WITH_SERVICE_ID
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN

### 3. Create service
POST http://localhost:3000/services
Content-Type: application/json
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN

{
  "name": "Corte de cabello",
  "description": "Haircut service",
  "base_price": 15
}

### 4. Update service
PUT http://localhost:3000/services/REPLACE_WITH_SERVICE_ID
Content-Type: application/json
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN

{
  "base_price": 18
}

### 5. Delete service
DELETE http://localhost:3000/services/REPLACE_WITH_SERVICE_ID
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN
```

Cinco peticiones, el módulo del capítulo 11. Es el archivo más aburrido de los seis, y eso es
una buena señal: no hay ningún caso de error interesante que probar.

- **List services** — `200` con `{ "services": [...], "total": 0, ... }`. Con la base recién
  sembrada está vacía: el seed no carga servicios, solo roles, usuarios y productos. Así que el
  primer `POST` de este archivo es también la forma de tener algo en la lista.
- **Get service by id** — `200`, o `404 "Service not found"`.
- **Create service** — `201` con `base_price` como número en la respuesta. Mandá `15` y fijate
  que vuelve `15`, no `"15"` ni un objeto: es el mapper del capítulo 11 haciendo su trabajo.
- **Update service** — `200`. Se puede mandar solo `base_price`.
- **Delete service** — `200` con mensaje, borrado lógico.

Y la prueba de la ausencia de unicidad: **creá el mismo servicio dos veces**. El segundo `201`
llega sin protestar. Comparalo con el barcode repetido de `products.http`: la diferencia entre
los dos archivos es la diferencia entre un módulo con restricciones y uno sin ellas.

### 15.6 `http/inventory.http` — movimientos de stock y low-stock

**Archivo:** `example-project/http/inventory.http`

```http
### 1. List inventory movements
GET http://localhost:3000/inventory/movements
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN

### 2. Filter movements by product and type
GET http://localhost:3000/inventory/movements?product_id=REPLACE_WITH_PRODUCT_ID&type=entrada
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN

### 3. Register an entrada (stock in)
POST http://localhost:3000/inventory/movements
Content-Type: application/json
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN

{
  "product_id": "REPLACE_WITH_PRODUCT_ID",
  "type": "entrada",
  "quantity": 20,
  "unit_cost": 1.1,
  "note": "New supplier delivery"
}

### 4. Register a salida (stock out)
POST http://localhost:3000/inventory/movements
Content-Type: application/json
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN

{
  "product_id": "REPLACE_WITH_PRODUCT_ID",
  "type": "salida",
  "quantity": 5,
  "note": "Sale"
}

### 5. Register an ajuste (stock correction)
POST http://localhost:3000/inventory/movements
Content-Type: application/json
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN

{
  "product_id": "REPLACE_WITH_PRODUCT_ID",
  "type": "ajuste",
  "quantity": 25,
  "note": "Physical count"
}

### 6. List products below their low stock threshold
GET http://localhost:3000/inventory/products/low-stock
Cookie: access_token=REPLACE_WITH_ACCESS_TOKEN
```

Seis peticiones, y es el archivo que más enseña del capítulo: acá se ve el inventario entero
funcionando.

- **List inventory movements** — `200` con `{ "movements": [...], "total": ..., ... }`, ordenado
  por fecha descendente. Cada movimiento trae `product` y `user` anidados: el nombre del producto
  y quién lo registró, sin que tengas que cruzar ids a mano.
- **Filter by product and type** — `?product_id=...&type=entrada`. Los dos filtros se combinan
  con AND: movimientos de ese producto **y** de ese tipo. Probá `type=salida` y `type=ajuste` y
  mirá cómo cambia el resultado.
- **Register an entrada** — `201`. Sobre la Coca-Cola del seed (stock 50), una entrada de 20 la
  deja en 70. El `unit_cost` y la `note` son opcionales; acá van los dos.
- **Register a salida** — `201` con `quantity: 5`: el stock baja a 65. Probá una salida de 100 y
  vas a ver el `409 "Insufficient stock"`, y el stock sin cambiar: la transacción no dejó nada a
  medias.
- **Register an ajuste** — `201` con `quantity: 25`: el stock pasa a **25**, sin importar en
  cuánto estaba. Si estaba en 65, baja a 25; si estaba en 3, sube a 25. Es un conteo físico
  declarado, no una suma.
- **List products below their low stock threshold** — `200` con un array de productos cuyo
  `stock` está por debajo de su `low_stock_threshold`. Con el seed, la Agua mineral (8 contra un
  umbral de 10) es la que aparece. Si después del ajuste dejás la Coca-Cola en 5, también va a
  aparecer.

La secuencia recomendada, si querés ver el sistema completo en cinco minutos: listá los
productos para tener un `product_id`, registrá una entrada, mirá cómo subió el stock en
`products.http`, registrá una salida mayor al stock y celebrá el 409, y terminá con el reporte de
stock bajo.

### Resumen

- Un archivo `.http` es texto plano con peticiones reales, separadas por `###`, que tu editor
  ejecuta con un clic; vive en el repositorio, se versiona con git y sirve de documentación
  ejecutable.
- Cada bloque tiene método y URL, cabeceras, una línea en blanco y, si hace falta, un body JSON.
- El flujo de autenticación es siempre el mismo: el login deja `access_token` y `refresh_token`
  en cookies `httpOnly`, el cliente las manda en la cabecera `Cookie`, y el `authGuard` las
  valida; sin ellas, `401`.
- Los `REPLACE_WITH_*` son placeholders: los ids se copian de una respuesta anterior y el token de
  la cabecera `Set-Cookie` del login.
- Los archivos están pensados para mostrar también los errores: `403` con el token de staff en
  roles, `409` con barcode repetido o stock insuficiente, `400` al borrar tu propia cuenta.

## 16. Checklist de verificación del sistema

Llegaste al final. Tenés dieciséis capítulos de código, seis módulos, tests y archivos de
peticiones. Falta lo más importante y lo que menos se documenta: **la lista de pasos para
comprobar que todo funciona, en orden, desde cero**.

Un **checklist de verificación** es eso: una secuencia de comandos con el resultado que esperás
de cada uno. Sirve para tres cosas distintas. Para vos, cuando clonás el proyecto en otra
máquina y no sabés por qué no arranca. Para tu compañero, que puede seguir los mismos pasos y
llegar al mismo estado. Y para el día que hacés un cambio grande: corrés la lista y en cinco
minutos sabés si rompiste algo.

Al último tramo, el de las peticiones con `curl`, se lo llama **smoke test** (prueba de humo).
La expresión viene del hardware: se enchufaba el aparato y se miraba si salía humo. En software
es lo mismo: una comprobación rápida y superficial de que el sistema está vivo y responde lo
básico. No reemplaza a los tests del capítulo 14 —no prueba reglas— pero cubre lo que ellos no
pueden: que el servidor levante, que la base esté migrada, que las cookies viajen y que las rutas
existan.

### Los seis comandos, en orden

El orden no es negociable: cada paso depende del anterior. La migración necesita las
dependencias; el seed necesita la base; los tests necesitan el código compilable; el servidor
necesita todo lo demás.

```bash
# 1. Instalar dependencias
bun install

# 2. Crear la base y aplicar la migración
bunx prisma migrate dev

# 3. Sembrar datos iniciales
bun run seed

# 4. Chequear tipos
bunx tsc --noEmit

# 5. Correr tests (33 tests, ~500ms)
bun test

# 6. Levantar el servidor (dev con hot-reload)
bun run dev
# (o bun src/server.ts para un arranque simple)
```

Qué tenés que ver después de cada uno:

1. **`bun install`** — descarga las dependencias del `package.json` y crea (o actualiza)
   `node_modules`. Esperás un resumen de paquetes instalados y ningún error. Si falla acá, el
   problema es de red o de versión de Bun, no del proyecto.
2. **`bunx prisma migrate dev`** — crea la base si no existe, aplica las migraciones pendientes y
   regenera el cliente de Prisma. La primera vez te pide un nombre para la migración (si no hay
   cambios de esquema, te va a decir que no hay nada que aplicar). Al final imprime el estado de
   las migraciones y el cliente generado. Si esto falla, revisá `DATABASE_URL` en tu `.env`:
   nueve de cada diez veces es eso.
3. **`bun run seed`** — corre el script del capítulo 13. Esperás exactamente una línea:
   `Seed completed: roles, users and products created`. Si ves un error de clave foránea, es
   porque la base no está migrada; si lo corrés dos veces, no pasa nada (salvo el Chocolate
   repetido, que ya sabés de dónde viene).
4. **`bunx tsc --noEmit`** — chequea los tipos **sin** generar archivos (`--noEmit` es justamente
   eso). El resultado esperado es **silencio**: si no imprime nada, no hay errores de tipos. Es
   el comando más rápido para saber si rompiste una interfaz.
5. **`bun test`** — los 33 tests del capítulo 14, en medio segundo. Esperás `33 pass`, `0 fail`.
   Si alguno falla, ahí tenés el nombre exacto del caso y el archivo: no hace falta adivinar.
6. **`bun run dev`** — arranca el servidor con recarga automática: cada vez que guardás un
   archivo, se reinicia solo. Esperás un log de arranque con el puerto (`3000`) y la lista de
   rutas registradas. Ese proceso queda corriendo en su terminal: no lo cierres, porque el paso
   siguiente lo necesita. La alternativa `bun src/server.ts` hace lo mismo sin el watcher, útil
   cuando querés que un cambio no reinicie nada en el medio de una prueba.

Si los seis pasos salen bien, el sistema está vivo. Falta comprobar que responde lo que debe.

### El smoke test con `curl`, flag por flag

`curl` es un cliente HTTP de línea de comandos: hace exactamente lo mismo que el archivo `.http`,
pero desde la terminal. Sirve para cuando no tenés el editor a mano, para pegarlo en un README y
para un script de CI. Este es el smoke test del proyecto, contra `http://localhost:3000` y en
otra terminal (el servidor del paso 6 tiene que estar corriendo):

```bash
# Login admin → guardá el cookie jar
curl -c /tmp/cookies.txt -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Perfil autenticado
curl -b /tmp/cookies.txt http://localhost:3000/auth/me

# Roles (admin): debería listar admin/staff
curl -b /tmp/cookies.txt http://localhost:3000/roles

# Login inválido → 401 Invalid credentials
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"mal"}'

# Barcode repetido → 409 Barcode already exists
curl -b /tmp/cookies.txt -X POST http://localhost:3000/products \
  -H 'Content-Type: application/json' \
  -d '{"name":"Coca 1L","barcode":"7790000000011","price":2.5}'

# Salida de stock mayor al disponible → 409 Insufficient stock
curl -b /tmp/cookies.txt -X POST http://localhost:3000/inventory/movements \
  -H 'Content-Type: application/json' \
  -d '{"product_id":"<ID_DEL_PRODUCTO>","type":"salida","quantity":100}'
```

Antes de mirar los resultados, las banderas. Son cinco y con estas entendés cualquier comando
`curl` de tu vida:

- **`-X POST`** — el método HTTP. Cuando hay `-d` (datos), `curl` ya asume `POST`, así que acá es
  redundante; se escribe igual porque hace explícito lo que estás haciendo, y porque para `PUT`,
  `PATCH` o `DELETE` sí es obligatorio.
- **`-H 'Content-Type: application/json'`** — agrega una cabecera. `-H` es "header", y se puede
  repetir todas las veces que haga falta (una por cabecera). Sin esta, `curl` manda el body como
  `application/x-www-form-urlencoded`, el servidor no lo parsea como JSON y el DTO falla con un
  400 que no tiene nada que ver con tus datos.
- **`-d '{"email":"..."}'`** — "data": el cuerpo de la petición. Va entre comillas **simples**
  para que el shell no interprete las comillas dobles, las llaves ni los `$` de adentro. Es un
  error clásico: con comillas dobles, el shell se come parte del JSON y el servidor recibe algo
  que no es JSON válido.
- **`-c /tmp/cookies.txt`** — "cookie jar de escritura": guarda las cookies que devuelve el
  servidor en ese archivo. Después del login, ahí quedan `access_token` y `refresh_token`, con su
  dominio y su vencimiento. El archivo es texto plano: podés abrirlo y leer los tokens.
- **`-b /tmp/cookies.txt`** — "cookie jar de lectura": manda las cookies guardadas en ese archivo.
  Es lo que hace que las peticiones siguientes estén autenticadas sin que tengas que copiar el
  token a mano: `-c` guarda, `-b` manda.

Y dos detalles de forma: la barra invertida `\` al final de una línea es continuación de línea
del shell (el comando sigue en la siguiente, para que se lea); y `#` al principio de una línea es
un comentario, que el shell ignora.

Ahora sí, qué esperás de cada petición:

1. **Login admin** — `200` con `{ "user": { "name": "Admin", "role": "admin", ... } }`, y el
   archivo `/tmp/cookies.txt` creado con las dos cookies. Si el body viniera vacío o con error,
   revisá que el seed haya corrido.
2. **Perfil autenticado** — `GET /auth/me` con `-b`: `200` con tu perfil. Es la prueba de que la
   cookie viajó y el `authGuard` la aceptó.
3. **Roles** — `200` con `{ "roles": [{ "name": "admin" }, { "name": "staff" }], "total": 2 }`.
   Como el login fue con admin, pasa el `adminGuard`.
4. **Login inválido** — `401` con `{ "code": "UNAUTHORIZED", "message": "Invalid credentials" }`.
   Esta petición **no** usa `-b` a propósito: es pública y lo que prueba es el rechazo.
5. **Barcode repetido** — `409` con `"Barcode already exists"`. El `7790000000011` es el de la
   Coca-Cola del seed, así que la restricción única de la base se dispara y el repositorio la
   traduce.
6. **Salida mayor al stock** — `409` con `"Insufficient stock"`. Acá tenés que reemplazar
   `<ID_DEL_PRODUCTO>` por un id real: sacalo de `GET /products` con el mismo cookie jar. Es el
   único paso que no es copiar y pegar, y es el que prueba la regla del capítulo 12.

Si querés ver el status sin leer todo el JSON, agregale `-i` a cualquier `curl`: imprime las
cabeceras de la respuesta, con la línea `HTTP/1.1 200 OK` o `HTTP/1.1 409 Conflict` arriba de
todo.

### El chequeo de la revocación del refresh

Falta una cosa, y es la más sutil del sistema: comprobar que el logout **revoca** de verdad. El
guion es login, logout, y reintentar el refresh con el token que ya usaste.

```bash
# Login, guardar el refresh token, logout, y reintentar refresh → 401
curl -c /tmp/t2.txt -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"staff@example.com","password":"staff123"}'
# (copiar refresh_token del jar)
curl -b /tmp/t2.txt -X POST http://localhost:3000/auth/logout
curl -X POST http://localhost:3000/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token":"<EL_REFRESH>"}'
# → {"code":"UNAUTHORIZED","message":"Invalid or expired refresh token"}
```

Paso por paso:

1. **Login de staff** con `-c /tmp/t2.txt` — guarda las cookies en un jar propio, para no pisar el
   del smoke test.
2. **Copiar el refresh token del jar** — el archivo guarda, por cada cookie, una línea con el
   nombre y el valor separados por un tabulador; buscá la que empieza con `refresh_token` y
   copiá lo que sigue. Ese texto es el que va en el body del último paso. El comentario del
   script lo dice: "(copiar refresh_token del jar)".
3. **Logout** con `-b /tmp/t2.txt` — el servidor lee la cookie `refresh_token`, borra la fila de
   la tabla `session` y limpia las cookies. Responde `200` con un mensaje.
4. **Refresh con el token viejo** — `401` con
   `{ "code": "UNAUTHORIZED", "message": "Invalid or expired refresh token" }`.

¿Por qué ese 401 es la prueba que buscábamos? Porque el token sigue siendo **criptográficamente
válido**: la firma está bien, no venció, y `verifyRefreshToken` lo aceptaría. Lo que lo invalida
es que la fila de `session` ya no existe: el logout la borró. O sea, la revocación no se logra
rompiendo el token, se logra exigiendo que además exista en la base. Ese es el mecanismo que
convierte un refresh token en algo revocable, y es la razón por la que el refresh se guarda en
una tabla y el access token no.

### La tabla de comportamientos esperados

Los comandos anteriores cubren el camino principal y unos pocos errores. La tabla siguiente es el
mapa completo de lo que el sistema debería responder en los casos importantes, verificados
durante el desarrollo del manual:

| Escenario | Resultado |
|---|---|
| POST /auth/login con credenciales válidas | 200 + perfil + cookies httpOnly |
| POST /auth/login con password incorrecta | 401 UNAUTHORIZED "Invalid credentials" |
| GET /auth/me sin token | 401 UNAUTHORIZED "Authentication required" |
| GET /roles con usuario staff | 403 FORBIDDEN "Admin access required" |
| POST /roles con nombre repetido | 409 CONFLICT "Role name already exists" |
| POST /products con barcode repetido | 409 CONFLICT "Barcode already exists" |
| POST /inventory/movements con tipo inválido | 400 BAD_REQUEST |
| POST /inventory/movements salida > stock | 409 CONFLICT "Insufficient stock" |
| GET /inventory/products/low-stock | 200 array con productos bajo umbral |
| POST /auth/refresh con sesión revocada | 401 UNAUTHORIZED "Invalid or expired refresh token" |
| DELETE /users/:id con tu propio id | 400 BAD_REQUEST "You cannot delete your own account" |

Leé la tabla en dos direcciones: la columna de escenarios te dice qué probar, y la de
resultados te recuerda qué código de estado corresponde a cada familia de problema:

- **200 / 201** — salió bien. `201` es "creé algo", y por eso lo devuelven los `POST` de roles,
  usuarios, productos, servicios y movimientos.
- **400** — la petición está mal formada: un campo que no valida (Zod), o una regla de forma
  (borrar tu propia cuenta, que el controlador frena antes de llegar al service).
- **401** — no sé quién sos: sin token, token vencido, credenciales incorrectas o refresh
  revocado.
- **403** — sé quién sos, pero no podés: un staff llamando a `/roles`.
- **404** — la ruta existe y el recurso no.
- **409** — la petición es válida y choca con una regla del negocio: nombre de rol repetido,
  barcode repetido, stock insuficiente.

Esa es la parte que hace que un backend se sienta predecible: el cliente no tiene que adivinar,
porque el mismo problema siempre devuelve el mismo código y el mismo `code` en el JSON.

Falta una aclaración sobre el logout, que es la duda que aparece siempre en este punto: **el
access token sigue siendo válido hasta su expiración (15 minutos)** después de un logout, porque
el JWT de acceso es *stateless*: el servidor lo verifica con la firma y no consulta la base. Lo
que el logout revoca **inmediatamente** es el refresh token, que sí tiene una fila en `session`.
Es un tradeoff deliberado de diseño, documentado en la sección de auth: si quisieras revocar el
acceso al instante, tendrías que guardar los access tokens (o una lista negra) y consultarlos en
cada petición, que es exactamente lo que el JWT evita. Con 15 minutos de ventana, el sistema
elige velocidad y simplicidad.

Y con eso terminaste el recorrido. Tenés un backend que autentica, autoriza por rol, guarda un
catálogo, mueve stock con historia y transacciones, y se verifica solo. Lo que sigue ya no es
del manual: es tu proyecto.

### Resumen

- Un checklist de verificación es una secuencia de comandos con su resultado esperado; un **smoke
  test** es la parte rápida que comprueba que el sistema está vivo, no que las reglas funcionen.
- Los seis pasos van en orden: `bun install`, `bunx prisma migrate dev`, `bun run seed`,
  `bunx tsc --noEmit` (silencio = sin errores), `bun test` (33 pass) y `bun run dev`.
- En `curl`, `-c` escribe el cookie jar, `-b` lo lee, `-X` fija el método, `-H` agrega cabeceras y
  `-d` manda el body; las comillas simples y la barra invertida son del shell, no de `curl`.
- La revocación del refresh se prueba con login → logout → refresh con el token viejo: el 401
  aparece porque la fila de `session` ya no existe, aunque la firma del token siga siendo válida.
- La tabla de comportamientos esperados es el mapa de los códigos: 200/201 bien, 400 mal formado,
  401 sin identidad, 403 sin permiso, 404 sin recurso, 409 contra una regla de negocio.



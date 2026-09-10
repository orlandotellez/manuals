# API Backend — Sistema POS de ejemplo

**Manual completo de construcción, arquitectura, base de datos y API**

Este documento describe **todo** el backend de un sistema POS de ejemplo: cómo está construido, por qué está construido así, cómo levantar una copia desde cero, cómo está organizado el código, cómo funciona cada módulo, cómo está modelada la base de datos, y cuáles son todos los endpoints disponibles con sus request/response.

[Repositorio de Github](https://github.com/orlandotellez/example-project)

---

## Tabla de contenidos

01. [Visión general y arquitectura](#01-visión-general-y-arquitectura)
02. [Stack tecnológico y setup del proyecto](#02-stack-tecnológico-y-setup-del-proyecto)
03. [Base de datos](#03-base-de-datos)
04. [Configuración global](#04-configuración-global)
05. [Manejo de errores](#05-manejo-de-errores)
06. [Punto de entrada: de arranque a rutas](#06-punto-de-entrada-de-arranque-a-rutas)
07. [Módulo auth](#07-módulo-auth)
08. [Módulo roles — el patrón CRUD completo](#08-módulo-roles--el-patrón-crud-completo)
09. [Módulo users](#09-módulo-users)
10. [Módulo products](#10-módulo-products)
11. [Módulo services](#11-módulo-services)
12. [Módulo inventory](#12-módulo-inventory)
13. [Seed: datos iniciales](#13-seed-datos-iniciales)
14. [Testing](#14-testing)
15. [Archivos de prueba HTTP](#15-archivos-de-prueba-http)
16. [Checklist de verificación del sistema](#16-checklist-de-verificación-del-sistema)

---

## 01. Visión general y arquitectura

Este proyecto es una **API REST** de un sistema POS (punto de venta) de ejemplo: administra roles, usuarios, productos, servicios e inventario, con autenticación por JWT + cookies httpOnly.

Está construido con **Bun** como runtime y gestor de paquetes, **Fastify 5** como framework HTTP, **Prisma 6** como ORM sobre **PostgreSQL**, **Zod** para validación, **jsonwebtoken** para tokens, **bcrypt** para hash de contraseñas y **pino** para logs.

La arquitectura sigue un patrón **modular por dominio** (o feature-first): cada área de negocio vive en src/modules/<modulo>/ y está separada en tres capas internas:

- **domain/** — contratos puros de TypeScript: entidades, tipos de respuesta e interfaces de repositorio. No depende de nada del framework ni de la base de datos.
- **application/** — servicios de aplicación con las reglas de negocio; reciben el repositorio por inyección (factory pattern) y usan mappers para convertir entidades en respuestas.
- **infrastructure/** — implementaciones concretas de los repositorios con Prisma.
- **presentation/** — DTOs de validación (Zod), controladores HTTP y definición de rutas Fastify.

Esta separación hace que cada módulo sea **testeable de forma aislada**: los tests de servicio inyectan un repositorio falso (fake) y validan únicamente las reglas de negocio; los repositorios reales quedan para integración.

### Decisiones de diseño clave

1. **Roles como tabla**: los roles (admin, staff, ...) viven en la tabla role y se administran con CRUD completo solo para administradores. El usuario lleva role_id (FK) y el rol se incluye en el JWT para autorizar.
2. **Auth con dos tokens**: access token JWT (15 minutos, contiene userId + email + role) y refresh token JWT (7 días, solo userId) guardado en tabla session para poder invalidarlo en logout. Ambos viajan en **cookies httpOnly** (con fallback a Authorization: Bearer para clients que no usan cookies).
3. **Sin librería de sesiones ni Redis**: la sesión de refresco es una fila en PostgreSQL. Simple, auditable y suficiente para este alcance.
4. **Soft delete**: deleted_at en role, user, product y service. Nada se borra físicamente del catálogo. inventory_movement y session no tienen borrado (auditoría).
5. **Errores tipados**: jerarquía AppError con BadRequestError (400), UnauthorizedError (401), ForbiddenError (403), NotFoundError (404) y ConflictError (409); el errorHandler los convierte en JSON con code + message.
6. **Validación en el controlador con Zod**: el DTO se parsea apenas entra la request; un ZodError se transforma en 400 BAD_REQUEST con el detalle del primer issue.
7. **Errores de Prisma mapeados**: los códigos P2002 (unique violation) y P2003 (FK violation) se convierten en ConflictError en el repositorio (y también en el service de productos, para doble protección).
8. **Decimal → number**: los campos price/cost/base_price/unit_cost son numeric(10,2) en Postgres; el mapeador los convierte con Number(...) para que el cliente nunca reciba strings.
9. **Transacciones para inventario**: crear un movimiento y actualizar el stock ocurre en la misma transacción ($transaction) — o pasa todo o no pasa nada.
10. **Sin multi-tenant ni tiendas**: el proyecto es de una sola tienda a propósito (ver manuales de los sistemas completos para ver cómo se agrega store_id).

## 02. Stack tecnológico y setup del proyecto

Toda la configuración inicial vive en la raíz de example-project/: package.json define las dependencias y scripts, tsconfig.json configura TypeScript estricto con el alias @/ apuntando a src/, tsup.config.ts arma el build de producción, .env.example documenta las variables de entorno y .gitignore mantiene fuera del repo lo que no debe versionarse.

> **Cómo crear el proyecto desde cero:** escribí estos archivos a mano en una carpeta vacía example-project/ y luego ejecuté los comandos de instalación. No es necesario usar un scaffolding (create-fastify, etc.): el proyecto es chico y entender cada archivo de configuración es parte del aprendizaje.

### 02.1 `package.json` — scripts, dependencias y tipado

> **package.json — scripts, dependencias y tipado**  
> Ruta: `example-project/package.json`  
> 
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

Puntos a entender:

- **"type": "module"** — el proyecto usa ESModules nativo (import/export), esencial para Bun.
- **scripts de desarrollo**: dev corre con bun --hot (recarga automática al editar), start corre el archivo directo, build = prisma generate + tsup (genera el client de Prisma y empaqueta con tsup), seed ejecuta el script de datos iniciales y test corre bun test (descubre archivos *.test.ts automáticamente).
- **dependencias de runtime**: fastify (framework), sus plugins oficiales (helmet, cors, compress, cookie, rate-limit), @prisma/client (ORM), zod (validación), jsonwebtoken (JWT), bcrypt (hash de contraseñas), pino (logs) y dotenv (variables de entorno).
- **dependencias de desarrollo**: typescript, tsup (bundler), pino-pretty (logs bonitos en consola), prisma (CLI de migraciones) y los tipos (@types/bcrypt, @types/jsonwebtoken, @types/node, bun-types).

> Nota: instalé con bun install, lo que genera bun.lock en lugar de package-lock.json.

### 02.2 `tsconfig.json` — TypeScript estricto + alias @/

> **tsconfig.json — TypeScript estricto + alias @/**  
> Ruta: `example-project/tsconfig.json`  
> 
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

Los flags más importantes:

- **"strict": true** — modo estricto completo; el compilador es exigente y eso evita errores antes de ejecutar.
- **"moduleResolution": "bundler"** con **"module": "ESNext"** — la resolución moderna que espera Bun y tsup.
- **"types": ["bun-types"]** — trae los tipos globales de Bun (bun:test, etc.).
- **"paths"**: { "@/*": ["./src/*"] } — el alias @/importa desde src/ sin importar qué tan profundo esté el archivo (ej: import { env } from "@/config/env").
- **"noEmit": true** — tsc solo chequea tipos; quien genera JS es Bun en dev y tsup en build.

> El alias @/ funciona en tres lugares: TypeScript (tsconfig), el bundler (tsup.config) y Bun (que lee tsconfig. json automáticamente).

### 02.3 `tsup.config.ts` — bundler de producción

> **tsup.config.ts — bundler de producción**  
> Ruta: `example-project/tsup.config.ts`  
> 
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

tsup empaqueta el servidor en un solo archivo ESM (dist/server.js) listo para correr en producción: entry es el punto de entrada, format esm, target es2022, sourcemap para debuggear, clean borra dist/ antes de cada build y alias replica el @/ del tsconfig.

> El script build solo funciona después de prisma generate, porque el PrismaClient necesita el client generado (eso explica el orden prisma generate && tsup en package.json).

### 02.4 `.env.example` — variables de entorno documentadas

> **.env.example — variables de entorno documentadas**  
> Ruta: `example-project/.env.example`  
> 
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

Estas son las variables que el proyecto necesita; el archivo real .env (que NO se versiona) contiene los valores locales reales con la credencial postgres del desarrollador.

- **NODE_ENV / PORT / HOST** — entorno, puerto e interfaz de escucha.
- **DATABASE_URL** — cadena de conexión a PostgreSQL (la base se llama example_project).
- **JWT_SECRET y JWT_REFRESH_SECRET** — secretos de firma de los tokens; deben tener 32+ caracteres y ser distintos (env.ts los valida con zod).
- **JWT_EXPIRES_IN / JWT_REFRESH_EXPIRES_IN** — expiración de los tokens (15m y 7d).
- **CORS_ORIGIN** — origen permitido; * en desarrollo.

> Copiá .env.example a .env y completá los valores reales. Nunca subas .env a git.

### 02.5 `.gitignore` — qué queda fuera del repo

> **.gitignore — qué queda fuera del repo**  
> Ruta: `example-project/.gitignore`  
> 
```bash
node_modules/
dist/
.env
*.log
```

Con esto el proyecto ya puede instalarse: bun install. El siguiente paso es el modelo de datos.

## 03. Base de datos

El modelo de datos está declarado en prisma/schema.prisma. Prisma es el ORM: definís el esquema en Prisma Schema Language, generás una migración SQL con prisma migrate dev y el client tipado de TypeScript refleja cada tabla, campos y relaciones.

Las seis tablas:

- **role** — roles del sistema (admin, staff, ...). name único, descripción opcional, soft delete.
- **user** — empleados del POS. email único, password_hash (nunca la contraseña en texto), role_id FK a role, is_active para deshabilitar, soft delete.
- **session** — sesiones de refresh token para poder revocarlas. FK a user con ON DELETE CASCADE (si un usuario se borra físicamente, sus sesiones también).
- **product** — productos con código de barras opcional (único), precio y costo Decimal, stock actual y umbral de stock bajo.
- **service** — servicios (ej: envío, instalación) con precio base.
- **inventory_movement** — historial de movimientos de stock (entrada/salida/ajuste) con quién lo hizo y nota opcional. Nunca se borra.

> Práctica de naming: nombres en minúscula y snake_case para tablas/columnas (query_result de Postgres), mientras que el código TypeScript usa camelCase o snake_case según la capa (los datos de Prisma llegan en snake_case directamente).

### 03.1 `prisma/schema.prisma` — el modelo declarativo

> **schema.prisma — el modelo declarativo**  
> Ruta: `example-project/prisma/schema.prisma`  
> 
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

Detalles por modelo:

- **@default(uuid()) con @db.Uuid** — los IDs son UUIDs generados por la base (mejor que autoincrement para sincronización futura y seguridad por enumeración).
- **Decimal @db.Decimal(10, 2)** — dinero en Postgres como numeric(10,2) (10 dígitos, 2 decimales). NUNCA se usa float para dinero.
- **role.users user[]** y **user.role role @relation(...)** — las dos caras de la relación uno-a-muchos: un rol tiene muchos usuarios; un user tiene un rol vía role_id.
- **onDelete: Cascade solo en session**: si un user se elimina físicamente, sus sesiones se borran. En inventario y en user.role se usa RESTRICT (no se puede borrar un producto con movimientos ni un rol en uso).
- **deleted_at: DateTime?** — soft delete en role, user, product y service.
- **updated_at DateTime @updatedAt** — Prisma lo actualiza automáticamente en cada update.

### 03.2 `prisma/migrations/20260910013256_init/migration.sql` — la migración inicial generada por Prisma

> **migration.sql — la migración inicial generada por Prisma**  
> Ruta: `example-project/prisma/migrations/20260910013256_init/migration.sql`  
> 
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

Este SQL es generado por prisma migrate dev --name init a partir del schema. Lo importante:

- CREATE TABLE respeta el PSL: columnas, tipos, defaults y constraints.
- Los UNIQUE INDEX (role_name_key, user_email_key, session_refresh_token_key, product_barcode_key) son la fuente de los errores P2002 que el código convierte en ConflictError.
- AddForeignKey: user_role_id_fkey con ON DELETE RESTRICT ON UPDATE CASCADE, session_user_id_fkey con CASCADE, e inventory_movement con RESTRICT.

> Para regenerar la base desde cero en desarrollo: borrar la base y volver a correr prisma migrate dev (que reaplica la migración). El snapshot en prisma/migrations es un artefacto interno de Prisma; no se edita a mano.

## 04. Configuración global

En src/config/ vive todo lo que es transversal a la aplicación: variables de entorno validadas, logger, cliente de Prisma y el graceful shutdown. Ninguno de estos archivos conoce el negocio; son infraestructura pura.

> Orden de inicialización importante: env.ts corre primero (carga y valida las variables), porque logger.ts y prisma.ts lo importan para leer NODE_ENV.

### 04.1 `src/config/env.ts` — variables de entorno validadas con Zod

> **env.ts — variables de entorno validadas con Zod**  
> Ruta: `example-project/src/config/env.ts`  
> 
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

Este es el único lugar del proyecto que lee process.env. El flujo:

1. config() de dotenv carga el archivo .env en process.env.
2. envSchema valida TODO lo que el proyecto necesita: si falta DATABASE_URL, si JWT_SECRET tiene menos de 32 caracteres, etc., el proceso muere con un mensaje claro (nunca arrancamos con configuración rota).
3. z.coerce.number() convierte automáticamente strings a números (el .env siempre trae texto).
4. parsed.data queda exportado como env, tipado y seguro: en el resto del código se usa env.PORT, env.JWT_SECRET, etc. sin volver a tocar process.env.

> Elegí validar con zod (misma librería que los DTOs) para no sumar dependencias (nada de envalid, joi, etc.).

### 04.2 `src/config/logger.ts` — pino + pino-pretty en desarrollo

> **logger.ts — pino + pino-pretty en desarrollo**  
> Ruta: `example-project/src/config/logger.ts`  
> 
```typescript
import pino from "pino"
import { env } from "./env"

export const loggerOptions = {
  level: env.NODE_ENV === "production" ? "info" : "debug",
  transport: env.NODE_ENV === "production" ? undefined : { target: "pino-pretty", options: { colorize: true } },
}

export const logger = pino(loggerOptions)
```

pino es el logger de Fastify (de hecho Fastify nació junto a pino) y es el más rápido de Node. Dos exportaciones:

- **loggerOptions** — la configuración: level debug en desarrollo / info en producción, y transport pino-pretty solo en desarrollo (logs legibles con color).
- **logger** — una instancia pino(locales para procesos que no pasan por Fastify (graceful shutdown, errorHandler).

> Detalle de Fastify v5: el plugin de logger acepta un objeto de opciones, no una instancia de pino (en v5 se usa loggerInstance para eso). Por eso buildApp recibe Fastify({ logger: loggerOptions }) — Fastify crea su propio pino con esas opciones.

### 04.3 `src/config/prisma.ts` — cliente de Prisma compartido

> **prisma.ts — cliente de Prisma compartido**  
> Ruta: `example-project/src/config/prisma.ts`  
> 
```typescript
import { PrismaClient } from "@prisma/client"
import { env } from "./env"

export const prisma = new PrismaClient({
  log: env.NODE_ENV === "production" ? ["error", "warn"] : ["query", "error", "warn"],
})
```

Un único PrismaClient para toda la app (Prisma recomienda un solo client; crear varios satura el pool de conexiones). En desarrollo loggea query para ver el SQL que genera cada operación; en producción solo error y warn.

> El alias @/ aparece acá en su forma real de uso: src/config/prisma.ts importa desde cualquier módulo de la app.

### 04.4 `src/config/graceful-shutdown.ts` — apagado elegante

> **graceful-shutdown.ts — apagado elegante**  
> Ruta: `example-project/src/config/graceful-shutdown.ts`  
> 
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

Cuando el proceso recibe SIGTERM (kill, deploy, docker stop) o SIGINT (Ctrl+C), hace tres cosas en orden: cierra el servidor HTTP (deja terminar requests en curso), desconecta Prisma y recién entonces sale con código 0. Sin esto, una conexión a Postgres queda colgada y el deploy corta requests a mitad de camino.

## 05. Manejo de errores

La estrategia de errores es la columna del proyecto: todo error de negocio es una instancia de AppError (o subclase) con statusCode, code y message; el errorHandler de Fastify los serializa a JSON. Los errores inesperados (bugs) se loggean y devuelven 500 INTERNAL_ERROR sin filtrar detalles internos.

Formato de respuesta de error (consistente en toda la API):

    { "code": "CONFLICT", "message": "Barcode already exists" }

Los códigos: BAD_REQUEST (400), UNAUTHORIZED (401), FORBIDDEN (403), NOT_FOUND (404), CONFLICT (409), INTERNAL_ERROR (500).

### 05.1 `src/core/errors/AppError.ts` — jerarquía de errores de negocio

> **AppError.ts — jerarquía de errores de negocio**  
> Ruta: `example-project/src/core/errors/AppError.ts`  
> 
```typescript
export interface AppErrorOptions {
  message: string
  statusCode: number
  code: string
  details?: unknown
  isOperational?: boolean
  cause?: unknown
}

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

AppError extiende Error y agrega cuatro campos: statusCode, code, details (datos adicionales opcionales) e isOperational (true = error esperado de la app, false = bug). name toma automáticamente el nombre de la subclase (new.target.name). Error.captureStackTrace recorta el stack hasta el constructor para no ensuciar los logs.

Las cinco subclases fijan statusCode y code en el constructor y solo reciben message + details opcionales. En el código de negocio se lanzan así:

    throw new NotFoundError("Product not found")
    throw new ConflictError("Insufficient stock")

### 05.2 `src/core/errors/error-messages.ts` — mensajes estándar

> **error-messages.ts — mensajes estándar**  
> Ruta: `example-project/src/core/errors/error-messages.ts`  
> 
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

Catálogo central de mensajes por código. Se usa como referencia para mantener consistencia; los mensajes específicos de cada regla (ej: "Barcode already exists", "Insufficient stock") viven en el servicio o repositorio que los origina, porque son específicos del dominio.

### 05.3 `src/config/error-handler.ts` — el errorHandler de Fastify

> **error-handler.ts — el errorHandler de Fastify**  
> Ruta: `example-project/src/config/error-handler.ts`  
> 
```typescript
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify"
import { ZodError, z } from "zod"
import { AppError } from "@/core/errors/AppError"
import { logger } from "./logger"

function formatZodIssueMessage(issue: z.ZodIssue): string {
  const path = issue.path.length > 0 ? issue.path.join(".") : "value"
  return `${path}: ${issue.message}`
}

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

Fastify permite reemplazar el manejador de errores global con setErrorHandler. Este archivo hace tres chequeos en orden:

1. **ZodError** → 400 BAD_REQUEST con el primer issue formateado como ruta:mensaje (ej: "product_id: Invalid product id"). Así el cliente sabe exactamente qué campo falló.
2. **AppError** → statusCode + { code, message, details? }.
3. **Cualquier otra cosa** → se loggea con pino (con el error completo y la request que lo causó: método, URL) y se responde 500 INTERNAL_ERROR genérico. Nunca se filtra el stack al cliente.

> El orden importa: ZodError se chequea antes de AppError porque Zod no extiende AppError.

## 06. Punto de entrada: de arranque a rutas

La app arranca en src/server.ts, se construye en src/app.ts (plugins globales + error handler) y monta los routers en src/http/routes.ts. La separación buildApp() / server.ts permite testear la app sin abrir un puerto real (se puede usar app.inject() de Fastify para tests e2e).

### 06.1 `src/server.ts` — bootstrap del servidor

> **server.ts — bootstrap del servidor**  
> Ruta: `example-project/src/server.ts`  
> 
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

1. buildApp() construye la instancia Fastify.
2. app.listen({ port, host }) abre el puerto; si falla, loggea y sale con código 1.
3. gracefulShutdown(app) registra los handlers de señales.

> Top-level await: server.ts es un módulo ESM, así que el await de listen corre directo en el módulo sin wrapper async.

### 06.2 `src/app.ts` — fábrica de la aplicación Fastify

> **app.ts — fábrica de la aplicación Fastify**  
> Ruta: `example-project/src/app.ts`  
> 
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

buildApp() encadena los cinco plugins de Fastify (cada app.register agrega funcionalidad):

- **helmet** — headers de seguridad HTTP (X-Content-Type-Options, etc.).
- **cors** — controla orígenes; con CORS_ORIGIN=* permite todo (development); con una lista de dominios, los separa en comas. credentials: true habilita cookies cross-origin.
- **compress** — compresión gzip/brotli de respuestas.
- **cookie** — parsea request.cookies y agrega reply.setCookie/clearCookie (necesario para los tokens httpOnly).
- **rateLimit** — 100 requests por minuto por IP (protección básica contra fuerza bruta en /auth/login).

Después seteamos el errorHandler global y registramos los routers. Si querés sumar un plugin nuevo (ej: @fastify/swagger), este es el lugar.

### 06.3 `src/http/routes.ts` — registro de routers con prefijo

> **routes.ts — registro de routers con prefijo**  
> Ruta: `example-project/src/http/routes.ts`  
> 
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

Cada módulo exporta su plugin de rutas (authRoutes, rolesRoutes, ...) y acá se monta con su prefijo: /auth, /roles, /users, /products, /services, /inventory. Un módulo nuevo se agrega con una línea: import + app.register.

> Los prefijos no llevan barra final; las rutas internas usan "/" como raíz del prefijo (ej: GET /roles/ → /roles).

## 07. Módulo auth

El módulo auth es el corazón del sistema: registra qué creen los tokens, cómo se generan, cómo se guardan las sesiones y cómo se protegen las rutas.

**Flujo de autenticación completo (léelo dos veces, es la base de todo):**

1. **POST /auth/login** con email + password → el service busca el usuario, verifica bcrypt, genera un access token (15 min, con userId + email + role) y un refresh token (7 días, solo userId), guarda el refresh en la tabla session y devuelve ambos como cookies httpOnly + el perfil del usuario.
2. El cliente (frontend) guarda los tokens automáticamente; las cookies httpOnly NO son legibles por JavaScript, lo que las protege de XSS.
3. Cada request autenticada lleva la cookie access_token (o Authorization: Bearer): authGuard verifica el JWT y deja request.userId, request.userEmail y request.userRole listos para los handlers. adminGuard chequea que request.userRole === "admin".
4. Cuando el access token expira (15 min), el frontend llama **POST /auth/refresh** con el refresh token: el service verifica la firma Y que la sesión siga existiendo y no haya expirado, y entrega un access token nuevo.
5. **POST /auth/logout** borra la sesión de la base y limpia las cookies → el refresh token queda inutilizable aunque alguien lo robe.

**Tradeoff que tenés que conocer**: el access token es un JWT stateless, así que sigue siendo válido hasta que expira aunque el usuario haga logout. El logout revoca el refresh (que es lo importante a largo plazo); el access vive poco (15 minutos). Diseños más estrictos agregan una blacklist o chequeo de sesión por request.

### 07.1 `src/types/auth.d.ts` — payloads de los JWT

> **auth.d.ts — payloads de los JWT**  
> Ruta: `example-project/src/types/auth.d.ts`  
> 
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

Las interfaces que viajan dentro de los tokens:

- **AuthTokenPayload** (access token): userId, email y role. El role va en el token para que adminGuard decida sin consultar la base en cada request.
- **RefreshTokenPayload** (refresh token): solo userId. Un refresh no necesita el rol: al renovar, el service busca el usuario fresco de la base y firma el access nuevo con el rol actual (si el usuario cambió de rol o se desactivó, el refresh lo refleja).

> .d.ts porque solo define tipos (sin runtime).

### 07.2 `src/types/fastify.d.ts` — extension de FastifyRequest

> **fastify.d.ts — extension de FastifyRequest**  
> Ruta: `example-project/src/types/fastify.d.ts`  
> 
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

TypeScript no sabe que authGuard agrega userId/userEmail/userRole a la request: esta declaración de módulo se lo enseña (module augmentation). El resto del código los usa con tipado completo (ej: request.userId en inventory.controller). Sin esto, TS rompería en cada uso.

> El guard es el único que escribe estos campos; los controladores solo los leen.

### 07.3 `src/modules/auth/domain/auth.entities.ts` — entidades del dominio

> **auth.entities.ts — entidades del dominio**  
> Ruta: `example-project/src/modules/auth/domain/auth.entities.ts`  
> 
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

export interface ISessionEntity {
  id: string
  user_id: string
  refresh_token: string
  expires_at: Date
  created_at: Date
}
```

- **IUserWithRole** — el usuario tal como lo necesita auth: password_hash (para verificar bcrypt), el rol anidado { id, name } (para firmar el access token con el nombre del rol) y is_active/deleted_at (para negar login a usuarios desactivados o borrados).
- **ISessionEntity** — la fila de sesión: qué refresh token, de qué usuario (user_id) y hasta cuándo (expires_at).

### 07.4 `src/modules/auth/domain/auth.interface.ts` — contrato del repositorio

> **auth.interface.ts — contrato del repositorio**  
> Ruta: `example-project/src/modules/auth/domain/auth.interface.ts`  
> 
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

IAuthRepository declara exactamente lo que el service necesita de la base: buscar usuario por email (login), por id (refresh/me), crear sesión, buscar sesión por token y borrarla. El service depende de esta interfaz, no de Prisma: por eso el test puede inyectar un fake y el service funciona igual (inversion of dependency en su forma más simple).

### 07.5 `src/modules/auth/application/common/crypto.utils.ts` — bcrypt: hash y comparación

> **crypto.utils.ts — bcrypt: hash y comparación**  
> Ruta: `example-project/src/modules/auth/application/common/crypto.utils.ts`  
> 
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

- **hashPassword** — bcrypt.hash con 10 rondas de salt. El salt queda embebido en el hash resultante (el formato de bcrypt lo incluye), así que no hay que guardarlo aparte.
- **comparePassword** — bcrypt.compare recibe la contraseña en texto y el hash, y devuelve true/false. La comparación es segura contra timing attacks (bcrypt no corta al primer mismatch).

> 10 rondas ≈ 60-100 ms por hash: suficiente para uso normal. NUNCA guardes contraseñas en texto plano ni las loggees.

### 07.6 `src/modules/auth/application/common/token.utils.ts` — firma y verificación de JWT

> **token.utils.ts — firma y verificación de JWT**  
> Ruta: `example-project/src/modules/auth/application/common/token.utils.ts`  
> 
```typescript
import jwt from "jsonwebtoken"
import { env } from "@/config/env"
import type { AuthTokenPayload, RefreshTokenPayload } from "@/types/auth"

export function generateAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] })
}

export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"] })
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload
}
```

Cuatro funciones simétricas:

- generateAccessToken / generateRefreshToken — jwt.sign con el payload, el secreto del entorno y la expiración (15m / 7d). La expiración de jsonwebtoken es un tipo StringValue estricto, por eso el cast as jwt.SignOptions["expiresIn"]: el string del .env no matchea el literal type.
- verifyAccessToken / verifyRefreshToken — jwt.verify; lanza si la firma es inválida o el token expiró. El guard y el service capturan ese throw y lo convierten en UnauthorizedError.

> El access token se firma con JWT_SECRET y el refresh con JWT_REFRESH_SECRET: secretos distintos, así un acceso a uno no compromete al otro.

### 07.7 `src/modules/auth/application/common/cookie.utils.ts` — cookies httpOnly para los tokens

> **cookie.utils.ts — cookies httpOnly para los tokens**  
> Ruta: `example-project/src/modules/auth/application/common/cookie.utils.ts`  
> 
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

export function setAuthCookies(reply: FastifyReply, accessToken: string, refreshToken: string) {
  reply.setCookie("access_token", accessToken, { ...baseCookieOptions, maxAge: ACCESS_COOKIE_MAX_AGE })
  reply.setCookie("refresh_token", refreshToken, { ...baseCookieOptions, maxAge: REFRESH_COOKIE_MAX_AGE })
}

export function clearAuthCookies(reply: FastifyReply) {
  reply.clearCookie("access_token", { ...baseCookieOptions })
  reply.clearCookie("refresh_token", { ...baseCookieOptions })
}
```

setAuthCookies pone access_token (maxAge 15 min) y refresh_token (maxAge 7 días) con la misma base de opciones:

- **httpOnly: true** — el token no es legible por JavaScript del navegador (anti-XSS).
- **secure** solo en producción (HTTPS).
- **sameSite**: strict en producción / lax en desarrollo (lax permite que la cookie viaje en navegación top-level, necesario para tests locales y algunos flows).

clearAuthCookies borra ambas (logout). El controller de auth es el único que usa estos helpers.

### 07.8 `src/modules/auth/application/common/auth.guard.ts` — authGuard y adminGuard

> **auth.guard.ts — authGuard y adminGuard**  
> Ruta: `example-project/src/modules/auth/application/common/auth.guard.ts`  
> 
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

Los preHandler de Fastify que protegen rutas:

- **getAuthResultFromRequest** — busca el token en las cookies (priority) o en Authorization: Bearer (para clients sin cookie jar, ej: Postman/curl). Devuelve el payload validado o null.
- **authGuard** — sin payload válido → UnauthorizedError("Authentication required"); con payload → inyecta userId, userEmail y userRole en la request.
- **adminGuard** — corre DESPUÉS de authGuard (los preHandler corren en orden) y tira ForbiddenError si el role no es "admin".

> Uso en rutas: { preHandler: [authGuard, adminGuard] } protege y restringe; { preHandler: [authGuard] } solo autentica.

### 07.9 `src/modules/auth/application/auth.service.ts` — reglas de negocio de autenticación

> **auth.service.ts — reglas de negocio de autenticación**  
> Ruta: `example-project/src/modules/auth/application/auth.service.ts`  
> 
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

createAuthService es un factory que recibe el repositorio (inyección de dependencias por composición) y devuelve el service con cuatro operaciones:

- **login** — 1) busca por email; 2) si no existe, está borrado o inactivo → UnauthorizedError GENÉRICO ("Invalid credentials", nunca revelar si el email existe); 3) compara la contraseña; 4) genera ambos tokens, crea la sesión y devuelve tokens + perfil. El refresh expira en 7 días también a nivel base (REFRESH_TOKEN_DURATION_MS) para que la fila de session tenga expires_at.
- **refresh** — verifica la firma + que la sesión exista en la base + que no haya expirado + que el usuario siga activo. Devuelve solo accessToken nuevo.
- **logout** — borra la sesión si se pasó el refresh token (el controller lo toma de la cookie).
- **me** — devuelve el perfil del usuario autenticado (usado para saber quién soy sin loguearme de nuevo).

### 07.10 `src/modules/auth/infrastructure/auth.prisma.repository.ts` — implementación Prisma del contrato

> **auth.prisma.repository.ts — implementación Prisma del contrato**  
> Ruta: `example-project/src/modules/auth/infrastructure/auth.prisma.repository.ts`  
> 
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

AuthRepository implementa IAuthRepository con el client importado de src/config/prisma.ts. Detalles:

- **userSelect** — proyección explícita: solo los campos que auth necesita (incluido role: { select: { id, name } }). Menos campos = menos datos movidos y tipado preciso.
- findUserByEmail/findUserById usan findFirst (no findUnique): más flexible y permite agregar filtros.
- createSession guarda el refresh token crudo con su expiración; findSessionByToken lo busca por el campo único; deleteSession lo borra (logout).

> Nota: acá NO se mapean errores de Prisma porque auth no tiene conflictos de negocio; los repositorios de roles/users/productos sí lo hacen (ver secciones siguientes).

### 07.11 `src/modules/auth/presentation/auth.dto.ts` — validación de entrada con Zod

> **auth.dto.ts — validación de entrada con Zod**  
> Ruta: `example-project/src/modules/auth/presentation/auth.dto.ts`  
> 
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

LoginDtoSchema exige email con formato válido y password no vacía; RefreshTokenDtoSchema exige el refresh token. z.infer deriva los tipos TypeScript del schema: si cambiás el schema, cambia el tipo. Los esquemas se parsean en el controller (primer filtro antes de tocar el service).

### 07.12 `src/modules/auth/presentation/auth.controller.ts` — controlador HTTP

> **auth.controller.ts — controlador HTTP**  
> Ruta: `example-project/src/modules/auth/presentation/auth.controller.ts`  
> 
```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { createAuthService } from "../application/auth.service"
import { AuthRepository } from "../infrastructure/auth.prisma.repository"
import { LoginDtoSchema, RefreshTokenDtoSchema } from "./auth.dto"
import { clearAuthCookies, setAuthCookies } from "../application/common/cookie.utils"

const authService = createAuthService(AuthRepository)

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

El controlador une las capas: parsea el body con el schema Zod, llama al service con los datos ya validados, y arma la respuesta. Particularidades:

- buildApp del service se hace UNA vez a nivel módulo: const authService = createAuthService(AuthRepository) (composición en la raíz de presentación).
- login → setAuthCookies(reply, ...) y devuelve solo el perfil (los tokens no se exponen en el body porque ya van en cookies; el client curl puede igualmente leerlos del cookie jar).
- logout → toma el refresh de la cookie, lo borra de la base y limpia las cookies.
- me → usa request.userId inyectado por authGuard.

### 07.13 `src/modules/auth/presentation/auth.routes.ts` — rutas del módulo

> **auth.routes.ts — rutas del módulo**  
> Ruta: `example-project/src/modules/auth/presentation/auth.routes.ts`  
> 
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

Cuatro endpoints. login, refresh y logout son públicos (POST); me está protegido con authGuard (GET /auth/me).

- POST /auth/login — body { email, password } → 200 { user } + cookies.
- POST /auth/refresh — body { refresh_token } → 200 { accessToken }.
- POST /auth/logout — requiere la cookie refresh_token → 200 { message }.
- GET /auth/me — autenticado → 200 perfil.

> Es el único módulo sin adminGuard: login/refresh/logout no requieren estar autenticados (obviamente), y me solo exige un token válido de cualquier rol.

El procesamiento de errores de auth: UnauthorizedError (401) y ForbiddenError (403) salen del service/guard y son serializados por el errorHandler global. Nada de manejo de errores ad-hoc en el controller.

## 08. Módulo roles — el patrón CRUD completo

El módulo roles es la PLANTILLA de todos los CRUD del proyecto. Si entendés este módulo, entendés users, products y services con solo mirar las diferencias. El patrón por capa es idéntico en los cinco módulos:

1. **domain/** — interface del repositorio (qué necesito de la base) + entidades (IRoleEntity para filas de BD, CreateRoleData/UpdateRoleData para datos de entrada) + types de respuesta (IRoleResponse/IRoleListResponse).
2. **application/** — service con las reglas de negocio (¿existe? ¿nombre repetido?) y mapper entidad → respuesta.
3. **infrastructure/** — implementación Prisma de la interfaz, con select tipado y conversión de errores P2002/P2003.
4. **presentation/** — DTOs Zod + controller + rutas Fastify.

Reglas de negocio del módulo:

- Solo administradores pueden operar (authGuard + adminGuard en todas las rutas).
- El nombre del rol es único: si ya existe → ConflictError 409.
- create no valida duplicados solo con findByName: además el repo captura P2002 (la constraint unique de la base es la última palabra).
- Borrar un rol asignado a usuarios falla con 409 (P2003 / FK RESTRICT).
- Soft delete: deleted_at en lugar de DELETE.

### 08.1 `src/modules/roles/domain/roles.entities.ts` — entidades y datos de entrada

> **roles.entities.ts — entidades y datos de entrada**  
> Ruta: `example-project/src/modules/roles/domain/roles.entities.ts`  
> 
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

Tres tipos:

- **IRoleEntity** — la forma de una fila de role como la devuelve el repositorio (incluye created_at, updated_at, deleted_at).
- **CreateRoleData** — lo que entra al create: name obligatorio, description opcional/nullable.
- **UpdateRoleData** — lo que entra al update: todos opcionales (PATCH parcial).

> La entidad del repositorio y los datos de entrada se separan a propósito: la capa de aplicación no debería poder setear created_at, por ejemplo.

### 08.2 `src/modules/roles/domain/roles.types.ts` — tipos de respuesta

> **roles.types.ts — tipos de respuesta**  
> Ruta: `example-project/src/modules/roles/domain/roles.types.ts`  
> 
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

IRoleResponse es lo que llega al cliente: NO incluye deleted_at (el soft delete es interno). IRoleListResponse envuelve el array con total, page y limit — la firma de paginación que usan todos los CRUD.

### 08.3 `src/modules/roles/domain/roles.interface.ts` — contrato del repositorio

> **roles.interface.ts — contrato del repositorio**  
> Ruta: `example-project/src/modules/roles/domain/roles.interface.ts`  
> 
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

IRoleRepository declara: findAll (con filtros de búsqueda/paginación devolviendo lista + total), findById, findByName (para el chequeo de duplicados), create, update y softDelete. El service solo conoce esta interfaz; el test la reemplaza por un fake idéntico en forma.

### 08.4 `src/modules/roles/application/common/roles.mappers.ts` — mapper entidad → respuesta

> **roles.mappers.ts — mapper entidad → respuesta**  
> Ruta: `example-project/src/modules/roles/application/common/roles.mappers.ts`  
> 
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

mapRoleToResponse recibe IRoleEntity y devuelve IRoleResponse: descarta deleted_at y normaliza description (?? null). Los mappers son la ÚNICA capa que traduce entre el mundo de la base y el mundo de la API — así el service no ensucia respuestas ni expone columnas internas.

### 08.5 `src/modules/roles/application/roles.service.ts` — reglas de negocio del CRUD

> **roles.service.ts — reglas de negocio del CRUD**  
> Ruta: `example-project/src/modules/roles/application/roles.service.ts`  
> 
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

createRoleService (factory que recibe el repo) implementa cinco operaciones:

- **list** — delega en findAll y mapea cada entidad; devuelve el envelope paginado.
- **getById** — null → NotFoundError("Role not found").
- **create** — si findByName devuelve algo → ConflictError("Role name already exists"). Doble protección con el repo (que captura P2002).
- **update** — existe? → update → mapper. No valida duplicado de nombre porque el repo captura P2002 igual (el mensaje es el mismo).
- **delete** — existe? → softDelete.

> Notá el patrón getById anteponiendo null-check a update/delete: nunca actualizar ni borrar un registro que no existe.

### 08.6 `src/modules/roles/infrastructure/roles.prisma.repository.ts` — implementación Prisma con mapeo de errores

> **roles.prisma.repository.ts — implementación Prisma con mapeo de errores**  
> Ruta: `example-project/src/modules/roles/infrastructure/roles.prisma.repository.ts`  
> 
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

El archivo más interesante del módulo:

- **roleSelect** + Prisma.roleGetPayload<...> — proyección tipada: el tipo de RoleRecord se deriva del select, así mapToEntity nunca recibe campos inesperados.
- **mapToEntity** — normaliza description y deleted_at (Prisma devuelve null solo si el tipo lo permite; acá el spread ...role con los ?? es la forma segura de construir la entidad).
- **findAll** — where = { deleted_at: null } (soft delete invisible en listados), search con contains + mode: "insensitive" (case insensitive), y paginación con skip/take calculada de page/limit. findMany y count se ejecutan en paralelo con Promise.all porque son independientes.
- **isPrismaError** — type guard: error instanceof Prisma.PrismaClientKnownRequestError && code === "P2002" (unique) / "P2003" (fk). Si matchea, lanza el ConflictError de negocio; si no, relanza el error original (nunca tragarse errores desconocidos).
- **softDelete** — update seteando deleted_at: new Date() en lugar de delete().

### 08.7 `src/modules/roles/presentation/roles.dto.ts` — DTOs Zod + query de paginación

> **roles.dto.ts — DTOs Zod + query de paginación**  
> Ruta: `example-project/src/modules/roles/presentation/roles.dto.ts`  
> 
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

Tres esquemas:

- **CreateRoleDtoSchema** — name entre 2 y 50 chars, description hasta 255 opcional.
- **UpdateRoleDtoSchema** — todos opcionales; description nullable (permite LIMPIAR la descripción mandando null).
- **RoleQuerySchema** — search opcional + page y limit con z.coerce.number() (los query params siempre llegan como strings) .int().positive(), y limit con .max(100) para no dejar traer 10.000 rows.

> Los mensajes en español/inglés de validación quedan explícitos en el schema (ej: "Name must be at least 2 characters").

### 08.8 `src/modules/roles/presentation/roles.controller.ts` — controlador

> **roles.controller.ts — controlador**  
> Ruta: `example-project/src/modules/roles/presentation/roles.controller.ts`  
> 
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

Debe ser DELGADO: parsea, llama al service, responde. Cinco handlers:

- list → parsea el query, service.list, 200.
- getById → request.params as { id: string } (Fastify no tipea params por defecto) → service.getById, 200.
- create → parsea body, service.create, 201 (Created).
- update → params + body, service.update, 200.
- delete → params, service.delete, 200 con { message }.

> El service se instancia UNA vez por módulo con el repo real: const roleService = createRoleService(RoleRepository).

### 08.9 `src/modules/roles/presentation/roles.routes.ts` — rutas protegidas para admin

> **roles.routes.ts — rutas protegidas para admin**  
> Ruta: `example-project/src/modules/roles/presentation/roles.routes.ts`  
> 
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

GET / (listar), GET /:id, POST / (crear), PUT /:id (actualizar), DELETE /:id (borrar). Todas con preHandler: [authGuard, adminGuard] — primero autentica, después verifica que sea admin. Así de simple queda la autorización por rol.

## 09. Módulo users

El módulo users extiende el patrón CRUD con dos particularidades:

1. **La contraseña nunca se guarda en texto**: el service recibe password en el create, la hashea con hashPassword (reutilizada del módulo auth) y recién entonces guarda el registro con password_hash.
2. **Protección sobre sí mismo**: el controller impide borrar la propia cuenta (no podés hacerte un self-delete), y la tabla user tiene is_active para deshabilitar sin borrar (PATCH /users/:id/active).

Reglas:

- CRUD completo solo para admin (authGuard + adminGuard).
- email único: duplicado → ConflictError 409 ("Email already registered").
- Al crear un usuario con un role_id inexistente, la FK de Postgres falla (P2003) y el repo lo convierte en "Role does not exist".
- El listado nunca expone password_hash (mapUserToResponse lo descarta).

### 09.1 `src/modules/users/domain/users.entities.ts` — entidades del usuario

> **users.entities.ts — entidades del usuario**  
> Ruta: `example-project/src/modules/users/domain/users.entities.ts`  
> 
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

IUserEntity refleja la fila: password_hash, role_id y el rol anidado { id, name } (el select del repo lo incluye para tipar la respuesta con el nombre del rol). CreateUserData ya recibe password_hash (creado por el service, nunca por el controller) y UpdateUserData agrega is_active para el toggle.

### 09.2 `src/modules/users/domain/users.types.ts` — tipos de respuesta

> **users.types.ts — tipos de respuesta**  
> Ruta: `example-project/src/modules/users/domain/users.types.ts`  
> 
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

IUserResponse es el usuario tal como lo ve la API: id, name, email, role { id, name }, is_active y fechas. Notá que password_hash NO existe acá — el mapper se encarga de que el hash jamás salga del server.

### 09.3 `src/modules/users/application/common/users.mappers.ts` — mapper que oculta el hash

> **users.mappers.ts — mapper que oculta el hash**  
> Ruta: `example-project/src/modules/users/application/common/users.mappers.ts`  
> 
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

mapUserToResponse copia los campos seguros y deja afuera password_hash por construcción del tipo de retorno: TypeScript directamente no te deja filtrarlo. El rol anidado pasa tal cual.

### 09.4 `src/modules/users/application/users.service.ts` — reglas de negocio

> **users.service.ts — reglas de negocio**  
> Ruta: `example-project/src/modules/users/application/users.service.ts`  
> 
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

Diferencias vs roles:

- **create** tipa el parámetro como { name, email, password, role_id } (el password EN CLARO llega acá desde el DTO), chequea findByEmail (email repetido → ConflictError), hashea y recién llama repository.create con { ..., password_hash }. El service es el ÚNICO lugar que toca el password.
- El repo captura P2002 (email duplicado, carrera entre dos creates simultáneos) y P2003 (role_id inexistente).
- **update** NO permite cambiar la contraseña (UpdateUserData no la tiene; se resetea por otro canal en sistemas reales).
- delete → soft delete. toggleActive es solo un update con { is_active }.

### 09.5 `src/modules/users/infrastructure/users.prisma.repository.ts` — implementación Prisma con P2002 y P2003

> **users.prisma.repository.ts — implementación Prisma con P2002 y P2003**  
> Ruta: `example-project/src/modules/users/infrastructure/users.prisma.repository.ts`  
> 
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

Mismo esqueleto que roles con dos errores mapeados en create:

- P2002 → ConflictError("Email already registered") — la duplicidad real la detecta la constraint user_email_key.
- P2003 → ConflictError("Role does not exist") — el FK user_role_id_fkey rechaza un role_id que no existe. El usuario recibe un mensaje de negocio, no un error crudo de Postgres.

findAll busca en name OR email (case insensitive). El select incluye role para no hacer dos queries.

### 09.6 `src/modules/users/presentation/users.dto.ts` — DTOs con uuid y toggle

> **users.dto.ts — DTOs con uuid y toggle**  
> Ruta: `example-project/src/modules/users/presentation/users.dto.ts`  
> 
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

CreateUserDtoSchema valida: name ≥ 2, email formato, password ≥ 8 chars y role_id con z.string().uuid() (un UUID malformado se rechaza antes de tocar la base). UpdateUserDtoSchema permite cambiar name/email/role_id. ToggleActiveDtoSchema exige is_active: boolean. UserQuerySchema pagina con search.

### 09.7 `src/modules/users/presentation/users.controller.ts` — controlador con auto-protección

> **users.controller.ts — controlador con auto-protección**  
> Ruta: `example-project/src/modules/users/presentation/users.controller.ts`  
> 
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

Los cinco handlers + toggleActive. La novedad: delete compara el id del path con request.userId (inyectado por authGuard) y lanza BadRequestError si son el mismo — no podés borrar tu propia cuenta. ToggleActive parsea { is_active } y llama service.update(id, { is_active }).

### 09.8 `src/modules/users/presentation/users.routes.ts` — rutas de administración de usuarios

> **users.routes.ts — rutas de administración de usuarios**  
> Ruta: `example-project/src/modules/users/presentation/users.routes.ts`  
> 
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

GET /, GET /:id, POST /, PUT /:id, DELETE /:id + PATCH /:id/active para habilitar/deshabilitar. Todas con [authGuard, adminGuard].

> Endpoints clave para probar: POST /users crea un empleado (el password se hashea), DELETE /users/:id con tu propio id devuelve 400, PATCH /users/:id/active con is_active false revoca el login de ese usuario al instante (el service de auth lo chequea en login y refresh).

## 10. Módulo products

El módulo products presenta dos desafíos técnicos nuevos respecto de roles/users:

1. **Dinero como Decimal**: price y cost son numeric(10,2) en Postgres. Prisma los devuelve como objetos Decimal (no como number ni string). La entidad del dominio usa Decimal (lo que sale de la base), la respuesta usa number (lo que ve el cliente), y el mapper hace Number(product.price). Se acabaron los 0.30000000000000004 del float.
2. **Doble capa de defensa contra barcodes duplicados**: el repo captura P2002 y el service TAMBIÉN (con su propio type guard). ¿Por qué? Porque product.barcode es nullable: solo hay conflicto si el barcode repetido no es null, y el error de negocio es claro ("Barcode already exists"). La doble capa protege el caso en que un repo distinto (fake, otro driver) no mapee P2002.

Reglas:

- Cualquier usuario autenticado (no solo admin) puede operar productos: authGuard únicamente.
- Búsqueda por name OR barcode, filtro por active, paginación.
- soft delete con deleted_at.

### 10.1 `src/modules/products/domain/products.entities.ts` — entidades con Decimal

> **products.entities.ts — entidades con Decimal**  
> Ruta: `example-project/src/modules/products/domain/products.entities.ts`  
> 
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

IProductEntity importa Decimal de @prisma/client/runtime/library: price es Decimal (obligatorio), cost es Decimal | null, stock y low_stock_threshold son number (Int en la base). CreateProductData recibe price/cost como number — el DTO los valida como números y Prisma los convierte a Decimal al insertar.

### 10.2 `src/modules/products/domain/products.types.ts` — respuesta con número en vez de Decimal

> **products.types.ts — respuesta con número en vez de Decimal**  
> Ruta: `example-project/src/modules/products/domain/products.types.ts`  
> 
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

IProductResponse usa number para price/cost: es la PROMESA al cliente de que nunca va a recibir un objeto Decimal ni un string. IProductListResponse envuelve con paginación como siempre.

### 10.3 `src/modules/products/application/common/products.mappers.ts` — mapper Decimal → number

> **products.mappers.ts — mapper Decimal → number**  
> Ruta: `example-project/src/modules/products/application/common/products.mappers.ts`  
> 
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

mapProductToResponse es el único lugar donde ocurre la conversión: Number(product.price) y product.cost ? Number(product.cost) : null. Si el número tuviera más de 2 decimales se redondearía acá; con numeric(10,2) de la base, el valor ya viene con 2 decimales exactos.

### 10.4 `src/modules/products/application/products.service.ts` — reglas de negocio con doble P2002

> **products.service.ts — reglas de negocio con doble P2002**  
> Ruta: `example-project/src/modules/products/application/products.service.ts`  
> 
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

- isUniqueConstraintError: type guard local (error Prisma con code P2002).
- **create** envuelve repository.create en try/catch: si el repo lanza P2002 (producto creado por otro proceso justo entre el chequeo y el insert — carrera), lo convierte en ConflictError("Barcode already exists"). El service NO hace findByName previo: la constraint unique es la fuente de verdad y evita la doble query.
- **update** chequea existencia (404) y también captura P2002.
- list busca por nombre O barcode; active llega como boolean opcional (el controller parsea el string "true" del query).

### 10.5 `src/modules/products/infrastructure/products.prisma.repository.ts` — repo con búsqueda OR

> **products.prisma.repository.ts — repo con búsqueda OR**  
> Ruta: `example-project/src/modules/products/infrastructure/products.prisma.repository.ts`  
> 
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

Mismo patrón Prisma: productSelect tipado, mapToEntity normalizando barcode/cost/deleted_at, P2002 → ConflictError, softDelete simple. La novedad es el where.OR: si llega search, busca name contains OR barcode contains, ambos case insensitive — la forma idiomática de Prisma para búsqueda multicampo.

### 10.6 `src/modules/products/presentation/products.dto.ts` — validación de producto y query

> **products.dto.ts — validación de producto y query**  
> Ruta: `example-project/src/modules/products/presentation/products.dto.ts`  
> 
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

CreateProductDtoSchema: barcode opcional, name ≥ 2, price positivo (z.number().positive()), cost no negativo opcional con default, stock int ≥ 0 default 0, low_stock_threshold int ≥ 0 default 5, active default true. Update: todos opcionales, barcode nullable (permite quitar el barcode), cost nullable. ProductQuerySchema: search, active como z.enum(["true","false"]) (los query params son strings) y página/limit coerceados.

### 10.7 `src/modules/products/presentation/products.controller.ts` — controlador

> **products.controller.ts — controlador**  
> Ruta: `example-project/src/modules/products/presentation/products.controller.ts`  
> 
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

Idéntico al de roles con un detalle: en list, convierte query.active (string "true"/"false") a boolean antes de llamar al service: query.active === "true". El DTO valida el formato, el controller traduce.

### 10.8 `src/modules/products/presentation/products.routes.ts` — rutas autenticadas (cualquier rol)

> **products.routes.ts — rutas autenticadas (cualquier rol)**  
> Ruta: `example-project/src/modules/products/presentation/products.routes.ts`  
> 
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

El CRUD completo con preHandler: [authGuard] — cualquier usuario logueado (admin o staff) puede listar, crear, editar y borrar productos. La decisión de quién puede qué se nota acá: inventario/catálogo para staff, roles/usuarios solo admin.

## 11. Módulo services

El módulo services es el CRUD más simple del proyecto: mismas cuatro capas, sin unique constraints (el nombre de un servicio puede repetirse), sin Decimal en la lógica de negocio más allá del mapeo. Fue pensado a propósito sin relación con productos (sin tabla intermedia service_products): en una versión completa, services podría componerse de productos o insumos.

Reglas:

- authGuard únicamente.
- search por nombre, filtro por is_active, paginación.
- base_price numérico con Number() en el mapper.
- soft delete.

### 11.1 `src/modules/services/domain/services.entities.ts` — entidades

> **services.entities.ts — entidades**  
> Ruta: `example-project/src/modules/services/domain/services.entities.ts`  
> 
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

IServiceEntity: name, description nullable, base_price Decimal, is_active. CreateServiceData/UpdateServiceData con base_price como number. Sin errores esperados de unique: el repo no necesita try/catch.

### 11.2 `src/modules/services/application/common/services.mappers.ts` — mapper

> **services.mappers.ts — mapper**  
> Ruta: `example-project/src/modules/services/application/common/services.mappers.ts`  
> 
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

mapServiceToResponse: base_price: Number(service.base_price), descarta deleted_at, normaliza description con ?? null.

### 11.3 `src/modules/services/application/services.service.ts` — reglas de negocio

> **services.service.ts — reglas de negocio**  
> Ruta: `example-project/src/modules/services/application/services.service.ts`  
> 
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

El CRUD limpio: list (envuelve findAll + mapper), getById (404 si no existe), create directo (no hay duplicados que validar), update (404 + update), delete (404 + softDelete). Es la versión MINIMAL del patrón: si no hay conflictos de negocio, no inventes validaciones.

### 11.4 `src/modules/services/infrastructure/services.prisma.repository.ts` — repo sin manejo de errores

> **services.prisma.repository.ts — repo sin manejo de errores**  
> Ruta: `example-project/src/modules/services/infrastructure/services.prisma.repository.ts`  
> 
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

serviceSelect + mapToEntity + findAll con search/filtro actives/paginación (Promise.all entre findMany y count) + create/update/softDelete directos. Notá la ausencia de isPrismaError: la base no puede lanzar P2002/P2003 acá (no hay columnas únicas ni FKs). Cada repo maneja solo los errores que su tabla puede producir.

### 11.5 `src/modules/services/presentation/services.dto.ts` — DTOs

> **services.dto.ts — DTOs**  
> Ruta: `example-project/src/modules/services/presentation/services.dto.ts`  
> 
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

CreateServiceDtoSchema: name ≥ 2, description opcional, base_price positivo, is_active default true. Update nullable para description. ServiceQuerySchema igual que products (active como enum de strings).

### 11.6 `src/modules/services/presentation/services.controller.ts` — controlador

> **services.controller.ts — controlador**  
> Ruta: `example-project/src/modules/services/presentation/services.controller.ts`  
> 
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

Calca exacta del de products: parsea query (convirtiendo active string → boolean), body, llama service, responde 200/201. Sin sorpresas.

### 11.7 `src/modules/services/presentation/services.routes.ts` — rutas autenticadas

> **services.routes.ts — rutas autenticadas**  
> Ruta: `example-project/src/modules/services/presentation/services.routes.ts`  
> 
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

CRUD completo con authGuard. Rutas: GET /, GET /:id, POST /, PUT /:id, DELETE /:id.

## 12. Módulo inventory

El módulo inventory es donde vive la regla de negocio más delicada del sistema: **el stock nunca puede quedar negativo y ningún movimiento se borra**.

Tres tipos de movimiento:

- **entrada** — stock += quantity (recepción de mercadería, devolución de cliente, corrección hacia arriba).
- **salida** — stock -= quantity, pero SOLO si quantity <= stock actual; si no → ConflictError 409 "Insufficient stock".
- **ajuste** — stock = quantity (conteo físico: el stock real pasa a ser exactamente el número indicado, incluso 0).

La atomicidad se garantiza con una transacción: crear el movimiento y actualizar el stock son dos writes que ocurren como uno solo (prisma.$transaction). Si el update del stock fallara, el movimiento no queda registrado — o todo, o nada.

Dos endpoints de lectura adicionales: listar movimientos (filtrables por producto y tipo) y consultar productos con stock bajo.

### 12.1 `src/modules/inventory/domain/inventory.entities.ts` — entidades del movimiento

> **inventory.entities.ts — entidades del movimiento**  
> Ruta: `example-project/src/modules/inventory/domain/inventory.entities.ts`  
> 
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

- **MovementType** = "entrada" | "salida" | "ajuste" — union type; el DTO la valida con z.enum y el repo la castea desde el string de la base.
- **IInventoryMovementEntity** — el movimiento con producto y usuario anidados (select del repo): así la respuesta muestra el nombre del producto y quién hizo el movimiento sin joins manuales.
- **IProductStockInfo** — lo mínimo que el service necesita del producto para decidir: stock actual, active y deleted_at.
- **CreateMovementData** — entrada del POST: product_id, type, quantity, unit_cost y note opcionales.

### 12.2 `src/modules/inventory/domain/inventory.types.ts` — tipos de respuesta

> **inventory.types.ts — tipos de respuesta**  
> Ruta: `example-project/src/modules/inventory/domain/inventory.types.ts`  
> 
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

IInventoryMovementResponse reusa la forma de la entidad (product y user anidados) pero con unit_cost: number | null (Decimal → number) y sin exponer nada interno. ILowStockProduct es la forma compacta del listado de stock bajo: id, name, stock y umbral.

### 12.3 `src/modules/inventory/application/common/inventory.mappers.ts` — mapper

> **inventory.mappers.ts — mapper**  
> Ruta: `example-project/src/modules/inventory/application/common/inventory.mappers.ts`  
> 
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

mapMovementToResponse convierte unit_cost con Number() y normaliza note/unit_cost con ?? null. product y user pasan tal cual están anidados.

### 12.4 `src/modules/inventory/application/inventory.service.ts` — reglas de negocio del stock

> **inventory.service.ts — reglas de negocio del stock**  
> Ruta: `example-project/src/modules/inventory/application/inventory.service.ts`  
> 
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

El corazón es **computeNewStock** (pura, sin IO, testeable en aislamiento):

- entrada → currentStock + quantity.
- salida → si quantity > currentStock tira ConflictError("Insufficient stock"); si no, resta.
- ajuste → devuelve quantity directamente (el stock pasa a ser ese número).

createMovement: 1) busca el producto (si no existe o está borrado → 404); 2) calcula el nuevo stock con las reglas; 3) repository.createMovement(data, userId, newStock) que ejecuta la transacción. El userId sale de la request (authGuard lo inyectó), así el movimiento queda auditado con quién lo hizo.

listMovements y lowStock delegan directo en el repo.

### 12.5 `src/modules/inventory/infrastructure/inventory.prisma.repository.ts` — repo con transacción y field reference

> **inventory.prisma.repository.ts — repo con transacción y field reference**  
> Ruta: `example-project/src/modules/inventory/infrastructure/inventory.prisma.repository.ts`  
> 
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

Tres funciones:

- **findProductById** — solo id, stock, active, deleted_at: el mínimo para decidir (IProductStockInfo).
- **listMovements** — filtros opcionales product_id y type, ordenado por created_at desc (los más nuevos primero — es un historial).
- **createMovement** — la joya: prisma.$transaction([create del movimiento, update del stock]) — array de operaciones que se ejecutan en una misma transacción. unit_cost: data.unit_cost ?? null normaliza el opcional.
- **findLowStockProducts** — usa un **field reference** de Prisma: stock: { lte: prisma.product.fields.low_stock_threshold } compara la columna stock con OTRA columna de la misma fila (low_stock_threshold) — el equivalente SQL a stock <= low_stock_threshold. No se puede hacer con un valor fijo; por eso Prisma expone prisma.product.fields.*. Filtra deleted_at null y active true, ordena por stock asc.

### 12.6 `src/modules/inventory/presentation/inventory.dto.ts` — DTO del movimiento

> **inventory.dto.ts — DTO del movimiento**  
> Ruta: `example-project/src/modules/inventory/presentation/inventory.dto.ts`  
> 
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

CreateMovementDtoSchema: product_id como uuid ("Invalid product id" si no), type z.enum de los tres movimientos, quantity int con refine (q) => q !== 0 — no se acepta un movimiento de cero cantidad (no tiene sentido logístico). unit_cost no negativo opcional, note opcional. MovementQuerySchema filtra por product_id/type y pagina.

> El refine de Zod es la forma de agregar validación custom a un campo: recibís el valor parseado y devolvés true/false con un mensaje propio.

### 12.7 `src/modules/inventory/presentation/inventory.controller.ts` — controlador

> **inventory.controller.ts — controlador**  
> Ruta: `example-project/src/modules/inventory/presentation/inventory.controller.ts`  
> 
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

Solo tres handlers: listMovements (parsea query), createMovement (parsea body y pasa request.userId — el autor viene del token, nunca del body, para que un cliente no pueda falsear quién hizo el movimiento) y lowStock (sin parámetros).

### 12.8 `src/modules/inventory/presentation/inventory.routes.ts` — rutas del inventario

> **inventory.routes.ts — rutas del inventario**  
> Ruta: `example-project/src/modules/inventory/presentation/inventory.routes.ts`  
> 
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

Tres endpoints con authGuard (cualquier rol autenticado):

- GET /inventory/movements — historial, filtrable por ?product_id= y ?type=.
- POST /inventory/movements — body { product_id, type, quantity, unit_cost?, note? } → 201 con el movimiento y el producto/ usuario anidados.
- GET /inventory/products/low-stock — productos con stock <= umbral.

## 13. Seed: datos iniciales

El seed (src/scripts/seed.ts) deja la base lista para probar: dos roles (admin y staff), dos usuarios (admin@example.com/admin123 y staff@example.com/staff123) y cuatro productos de ejemplo (dos con stock bajo para ver low-stock funcionando).

Se ejecuta con bun run seed (script "seed" del package.json).

### 13.1 `src/scripts/seed.ts` — roles, usuarios y productos de ejemplo

> **seed.ts — roles, usuarios y productos de ejemplo**  
> Ruta: `example-project/src/scripts/seed.ts`  
> 
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

Detalles de implementación:

- **upsert** en lugar de create directo: prisma.role.upsert({ where: { name }, update: {}, create: {...} }) — si el rol ya existe no hace nada, si no lo crea. El seed es IDEMPOTENTE: se puede correr mil veces sin duplicar nada (el where usa los campos únicos name/email/barcode).
- Los passwords van con bcrypt.hash("admin123", 10) — idéntico al flujo real de creación de usuarios.
- El cuarto producto (Chocolate 70g) NO tiene barcode, y se crea con prisma.product.create en el else — demuestra que el barcode es opcional.
- main() maneja errores con catch (exit 1) y SIEMPRE cierra el client en finally con prisma.$disconnect().

> Los ids/contraseñas del seed son solo para desarrollo. En producción los usuarios se crean por API (POST /users) y los secretos van en el .env.

## 14. Testing

Los tests del proyecto siguen una regla simple: **testear la capa application (servicios) con repositorios fake, sin base de datos ni red**. De esa forma los tests son rápidos, deterministas y aíslan las reglas de negocio: si el test del login falla, el problema está en el service, no en PostgreSQL.

Herramientas: **bun:test** (runner integrado en Bun, cero configuración: descubre archivos *_tests_/*.service.test.ts) + node:assert/strict (assert.ok / assert.equal / assert.rejects).

El patrón por archivo:

1. Un factory makeFake<Module>Repository(overrides) que devuelve un objeto que implementa la interfaz del repositorio con behaviors por defecto (findUserByEmail → null, etc.).
2. Helpers que construyen entidades base (makeUser, makeProduct, ...).
3. Tests: arman el repo con overrides, crean el service, ejercitan la operación y afirman el resultado o el error lanzado.

Los tests corren con: bun test (33 tests en 6 archivos, ~500 ms).

### 14.1 `src/tests/fakes.ts` — fábricas de errores Prisma para tests

> **fakes.ts — fábricas de errores Prisma para tests**  
> Ruta: `example-project/src/tests/fakes.ts`  
> 
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

makeP2002 y makeP2003 construyen instancias REALES de Prisma.PrismaClientKnownRequestError con el código y meta correctos. ¿Para qué? Para que los tests puedan ejercitar la rama de error de un repositorio... en realidad se usan en los tests de SERVICE cuando el service captura P2002 (products): el fake repo devuelve este error y el test verifica que el service lo convierte en ConflictError.

Prisma acepta el objeto de errores real (new Prisma.PrismaClientKnownRequestError(...)), así el instanceof del type guard funciona de verdad.

### 14.2 `src/modules/auth/_tests_/application/auth.service.test.ts` — tests del service de auth (la plantilla)

> **auth.service.test.ts — tests del service de auth (la plantilla)**  
> Ruta: `example-project/src/modules/auth/_tests_/application/auth.service.test.ts`  
> 
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

El archivo más ilustrativo del proyecto. Puntos clave:

- **makeFakeAuthRepository(overrides)** — objeto que cumple IAuthRepository: por defecto findUserByEmail/findUserById devuelven null y createSession una sesión dummy; cada test overridea lo que necesita. El service no sabe (ni le importa) que es un fake.
- **makeUser(passwordHash)** — entidad completa con el hash recibido, rol admin, activa.
- Primer test (login OK): genera un hash REAL con hashPassword, overridea findUserByEmail y createSession (que setea una flag sessionCreated), y afirma tokens + perfil + que la sesión se creó. Usar la flag en lugar de afirmar sobre el mock evita la afirmación que no prueba nada.
- Tests de error: login con password incorrecta → assert.rejects(..., UnauthorizedError) — la assertión es sobre el TIPO de error.
- refresh: genera un refresh token REAL con generateRefreshToken para que la firma verifique, y una sesión con expires_at futuro (test OK) o pasado (test de expiración).
- logout: overridea deleteSession con una flag deleted y afirma que se llamó.

> Notá la ruta relativa ../../application/... : los tests viven en src/modules/auth/_tests_/application/ y suben dos niveles para llegar a application/ y domain/.

### 14.3 `src/modules/roles/_tests_/application/roles.service.test.ts` — tests del CRUD de roles

> **roles.service.test.ts — tests del CRUD de roles**  
> Ruta: `example-project/src/modules/roles/_tests_/application/roles.service.test.ts`  
> 
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

Cubre las cinco operaciones: list (mapper + envelope), getById con NotFoundError cuando no existe, create con ConflictError por nombre duplicado, update y delete. Usa el mismo patrón makeFakeRoleRepository(overrides) + entidad base makeRole().

### 14.4 `src/modules/users/_tests_/application/users.service.test.ts` — tests de users

> **users.service.test.ts — tests de users**  
> Ruta: `example-project/src/modules/users/_tests_/application/users.service.test.ts`  
> 
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

Los casos clave: create hashea la contraseña ANTES de guardar (se puede afirmar que repository.create recibió un password_hash distinto del password plano o que matchea bcrypt), email duplicado → ConflictError, getById de usuario inexistente → NotFoundError.

### 14.5 `src/modules/products/_tests_/application/products.service.test.ts` — tests de products (con P2002)

> **products.service.test.ts — tests de products (con P2002)**  
> Ruta: `example-project/src/modules/products/_tests_/application/products.service.test.ts`  
> 
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

El test más interesante: el fake repo de create lanza makeP2002(["barcode"]) y el test verifica que el service lo transforma en ConflictError ("Barcode already exists") — la doble capa de defensa viva. También cubre Decimal → number en el mapper: la entidad fake lleva price: new Prisma.Decimal(...) y la respuesta debe llegar como number.

> Ojo con el tipado de los fakes: el spread parcial ({ ...data, id: "p9" }) no matchea IProductEntity completo (faltan created_at/updated_at/deleted_at), así que el cast va por unknown: as unknown as IProductEntity. Es un detalle de tests, no de producción.

### 14.6 `src/modules/services/_tests_/application/services.service.test.ts` — tests de services

> **services.service.test.ts — tests de services**  
> Ruta: `example-project/src/modules/services/_tests_/application/services.service.test.ts`  
> 
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

El CRUD simple: create devuelve el servicio mapeado (base_price como number), getById 404, update 404 si no existe. Mismo patrón makeFakeServiceRepository.

### 14.7 `src/modules/inventory/_tests_/application/inventory.service.test.ts` — tests de inventario (las reglas de stock)

> **inventory.service.test.ts — tests de inventario (las reglas de stock)**  
> Ruta: `example-project/src/modules/inventory/_tests_/application/inventory.service.test.ts`  
> 
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

Acá se prueban las reglas puras de computeNewStock a través del service: entrada suma, salida válida resta, salida mayor al stock → ConflictError "Insufficient stock", ajuste setea el stock al valor indicado, producto inexistente → NotFoundError, y lowStock delega en el repo.

## 15. Archivos de prueba HTTP

En http/ hay un archivo por módulo listo para "REST Client" (la extensión de VS Code) o para importar a Postman. Cada archivo contiene la secuencia de requests reales con headers de autenticación (@authToken) y variables reutilizables para no tener que copiar ids a mano.

> Estos archivos embeben la AUTORIZACIÓN desde el login: la primera request de auth.http loguea al admin y guarda el access_token en una variable global (@name loginAdmin). La sintaxis @name + $response.body.accessToken captura el token de la respuesta y lo reusa en los siguientes archivos con Bearer {{accessToken}}.

### 15.1 `http/auth.http` — login, refresh, logout y me

> **auth.http — login, refresh, logout y me**  
> Ruta: `example-project/http/auth.http`  
> 
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

### 15.2 `http/roles.http` — CRUD de roles

> **roles.http — CRUD de roles**  
> Ruta: `example-project/http/roles.http`  
> 
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

### 15.3 `http/users.http` — CRUD de usuarios + toggle active

> **users.http — CRUD de usuarios + toggle active**  
> Ruta: `example-project/http/users.http`  
> 
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

### 15.4 `http/products.http` — CRUD de productos

> **products.http — CRUD de productos**  
> Ruta: `example-project/http/products.http`  
> 
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

### 15.5 `http/services.http` — CRUD de servicios

> **services.http — CRUD de servicios**  
> Ruta: `example-project/http/services.http`  
> 
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

### 15.6 `http/inventory.http` — movimientos de stock y low-stock

> **inventory.http — movimientos de stock y low-stock**  
> Ruta: `example-project/http/inventory.http`  
> 
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

## 16. Checklist de verificación del sistema

Esta es la secuencia completa para levantar el proyecto y comprobar que todo funciona, de cero:

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

**Smoke test con curl** (en otra terminal, contra http://localhost:3000):

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

**Logout y revocación del refresh**:

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

**Comportamientos esperados (verificados en el desarrollo de este manual):**

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

> Nota sobre el access token tras logout: el JWT de acceso sigue siendo válido hasta su expiración (15 min) porque es stateless; lo que el logout revoca inmediatamente es el refresh token. Es un tradeoff deliberado de diseño, documentado en la sección auth.

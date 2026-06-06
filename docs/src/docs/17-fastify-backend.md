# Manual Completo — Backend Farmacia con Fastify

> **Stack:** Node.js + TypeScript + Fastify + Prisma + PostgreSQL + Redis + JWT  
> **Patrón:** Clean Architecture (Domain-Driven) con módulos  

---

## Índice

1. [Introducción y Arquitectura](#1-introducción-y-arquitectura)
2. [Prerequisitos](#2-prerequisitos)
3. [Estructura del Proyecto](#3-estructura-del-proyecto)
4. [Paso 1 — package.json](#4-paso-1-packagejson)
5. [Paso 2 — tsconfig.json](#5-paso-2-tsconfigjson)
6. [Paso 3 — Variables de Entorno (.env)](#6-paso-3-variables-de-entorno-env)
7. [Paso 4 — Docker Compose](#7-paso-4-docker-composeyml)
8. [Paso 5 — Prisma Schema](#8-paso-5-prisma-schema)
9. [Paso 6 — Migración Inicial](#9-paso-6-migración-inicial)
10. [Paso 7 — Servidor (server.ts)](#10-paso-7-servidor-serverts)
11. [Paso 8 — Aplicación (app.ts)](#11-paso-8-aplicación-appts)
12. [Paso 9 — Configuración (env, prisma, redis)](#12-paso-9-configuración)
13. [Paso 10 — Logger](#13-paso-10-logger)
14. [Paso 11 — Errores Personalizados](#14-paso-11-errores-personalizados)
15. [Paso 12 — Tipos del Sistema](#15-paso-12-tipos-del-sistema)
16. [Paso 13 — Middlewares](#16-paso-13-middlewares)
17. [Paso 14 — Rutas](#17-paso-14-rutas)
18. [Paso 15 — Módulo Auth](#18-paso-15-módulo-auth)
19. [Paso 16 — Módulo Users](#19-paso-16-módulo-users)
20. [Paso 17 — Módulo Medicines](#20-paso-17-módulo-medicines)
21. [Paso 18 — Módulo Sales](#21-paso-18-módulo-sales)
22. [Paso 19 — Módulo Clients](#22-paso-19-módulo-clients)
23. [Paso 20 — Módulo Reports](#23-paso-20-módulo-reports)
24. [Paso 21 — Seed Script](#24-paso-21-seed-script)
25. [Paso 22 — API Reference (api.http)](#25-paso-22-api-reference)
26. [Paso 23 — Scripts del package.json](#26-paso-23-scripts-del-packagejson)
27. [Resumen de Endpoints](#27-resumen-de-endpoints)

---

## 1. Introducción y Arquitectura

Este backend está construido con una **arquitectura limpia (Clean Architecture)** organizada en capas:

```
src/
├── config/              # Configuración: env, prisma, redis
├── core/errors/         # Errores personalizados de la aplicación
├── infrastructure/      # Logger de infraestructura
├── presentation/        # Capa de presentación
│   ├── middlewares/     # Middlewares (auth, error, RBAC)
│   └── routes.ts        # Registro de todas las rutas
├── modules/             # Módulos de negocio (DDD)
│   ├── auth/
│   │   ├── application/ # Lógica de negocio (service)
│   │   └── presentation/ # Controller, DTOs, Routes
│   ├── users/
│   ├── medicines/
│   ├── sales/
│   ├── clients/
│   └── reports/
├── types/               # Tipos compartidos del sistema
├── scripts/             # Scripts utilitarios (seed)
├── server.ts            # Punto de entrada
└── app.ts               # Configuración de Fastify
```

**Tecnologías clave:**
- **Fastify** — Framework HTTP de alto rendimiento
- **Prisma** — ORM para PostgreSQL
- **Redis (ioredis)** — Caché para tokens de refresh
- **JWT** — Autenticación stateless con access/refresh tokens
- **Zod** — Validación de esquemas (DTOs)
- **bcrypt** — Hash de contraseñas
- **Helmet + CORS + Rate Limit** — Seguridad

**Principios aplicados:**
- Separación de concerns (capas)
- Repositorios con interfaces (contratos)
- DTOs con validación en los controladores
- Middleware de autenticación y autorización (RBAC)
- Soft delete en todas las entidades
- Paginación en listados

---

## 2. Prerequisitos

Antes de empezar, necesitás tener instalado:

- **Node.js** v18+ (recomendado 20+)
- **npm**, **yarn** o **pnpm**
- **Docker** y **Docker Compose** (para levantar Postgres y Redis)
- **TypeScript** (se instala como devDependency)

---

## 3. Estructura del Proyecto

Creá el directorio del proyecto:

```bash
mkdir -p farmacy-backend/src/{config,core/errors,infrastructure,presentation/middlewares,modules/{auth,users,medicines,sales,clients,reports}/{application,domain,infrastructure,presentation},types,scripts}
```

---

## 4. Paso 1 — package.json

Creá el archivo `package.json` en la raíz del backend:

```json
{
  "name": "farmacia-backend",
  "version": "1.0.0",
  "description": "Farmacia backend with Fastify, Prisma, and JWT",
  "main": "index.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsup src/server.ts --format cjs --dts",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  },
  "keywords": [
    "farmacia",
    "pharmacy",
    "fastify",
    "prisma"
  ],
  "author": "",
  "license": "ISC",
  "type": "module",
  "dependencies": {
    "@fastify/compress": "^8.3.1",
    "@fastify/cors": "^11.2.0",
    "@fastify/helmet": "^13.0.2",
    "@fastify/jwt": "^10.0.0",
    "@fastify/rate-limit": "^10.3.0",
    "@prisma/client": "^5.22.0",
    "@types/jsonwebtoken": "^9.0.10",
    "bcrypt": "^6.0.0",
    "dotenv": "^17.3.1",
    "fastify": "^5.7.4",
    "ioredis": "^5.10.0",
    "jsonwebtoken": "^9.0.3",
    "pino": "^10.3.1",
    "pino-pretty": "^13.1.3",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@types/bcrypt": "^6.0.0",
    "@types/node": "^25.3.3",
    "prisma": "^5.22.0",
    "tsup": "^8.5.1",
    "tsx": "^4.21.0",
    "typescript": "^5.9.3"
  }
}
```

**¿Qué significa cada cosa?**

- `"type": "module"` habilita ESM (imports/exports con `import`/`export` en vez de `require`).
- **Dependencias de runtime:**
  - `fastify` — Framework HTTP
  - `@fastify/cors` — Habilita CORS
  - `@fastify/helmet` — Headers de seguridad
  - `@fastify/compress` — Compresión gzip
  - `@fastify/jwt` — Plugin JWT para Fastify
  - `@fastify/rate-limit` — Limitación de rate
  - `@prisma/client` — Cliente generado por Prisma (ORM)
  - `bcrypt` — Hashear contraseñas
  - `dotenv` — Cargar variables de `.env`
  - `ioredis` — Cliente Redis
  - `jsonwebtoken` — Para generar/verificar tokens manualmente (refresh)
  - `pino` + `pino-pretty` — Logger
  - `zod` — Validación de esquemas
- **DevDependencies:**
  - `typescript` — El lenguaje
  - `tsx` — Ejecutar TypeScript directamente sin compilar
  - `tsup` — Empaquetador para production build
  - `prisma` — CLI de Prisma
  - `@types/node` / `@types/bcrypt` — Tipos de Node y bcrypt

**Instalá las dependencias:**
```bash
npm install
```

---

## 5. Paso 2 — tsconfig.json

Creá `tsconfig.json` en la raíz:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "baseUrl": "./",
    "paths": {
      "@/*": [
        "src/*"
      ]
    },
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  },
  "include": [
    "src/**/*"
  ]
}
```

**¿Qué hace esto?**
- `"target": "ES2022"` — Compila a ES2022 (compatible con Node 18+)
- `"module": "NodeNext"` — Usa el sistema de módulos nativo de Node.js (ESM)
- `"moduleResolution": "NodeNext"` — Resolución de módulos acorde
- `"baseUrl": "./"` + `"paths": { "@/*": ["src/*"] }` — Alias `@/` apunta a `src/`, así en vez de escribir `../../../config/env` escribís `@/config/env`
- `"outDir": "./dist"` — El output compilado va a `dist/`
- `"rootDir": "./src"` — El código fuente está en `src/`
- `"strict": true` — Máxima estrictitud (strictNullChecks, noImplicitAny, etc.)
- `"skipLibCheck": true` — No chequea los `.d.ts` de node_modules (más rápido)

---

## 6. Paso 3 — Variables de Entorno (.env)

Creá `.env.example`:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://farmacia:farmacia@localhost:5432/farmacy_db?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

Creá `.env` real:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL="postgresql://dev-espada:espadaPOSTGRES@localhost:5432/farmacy_db?schema=public"

JWT_SECRET=super-secret-jwt-key-that-is-at-least-32-chars-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=super-secret-refresh-key-that-is-at-least-32-chars
JWT_REFRESH_EXPIRES_IN=7d

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

**⚠️ IMPORTANTE:** El `.env` NUNCA se commitea al git.

Creá `.gitignore`:

```
.env
node_modules
```

**Cada variable:**
- `NODE_ENV` — `development`, `production` o `test`
- `PORT` — Puerto del servidor (default 3000)
- `DATABASE_URL` — Connection string de PostgreSQL
- `JWT_SECRET` — Clave secreta para firmar el access token (mínimo 32 chars)
- `JWT_EXPIRES_IN` — Tiempo de expiración del access token (15 minutos)
- `JWT_REFRESH_SECRET` — Clave secreta para firmar el refresh token
- `JWT_REFRESH_EXPIRES_IN` — Tiempo del refresh token (7 días)
- `REDIS_HOST` / `REDIS_PORT` — Conexión a Redis

---

## 7. Paso 4 — Docker Compose

Creá `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: farmacia-postgres
    environment:
      POSTGRES_DB: farmacia
      POSTGRES_USER: farmacia
      POSTGRES_PASSWORD: farmacia
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U farmacia"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: farmacia-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

**¿Qué levanta?**
- **PostgreSQL 15 Alpine** — Database: `farmacia`, User: `farmacia`, Password: `farmacia`
- **Redis 7 Alpine** — Cache en memoria

**Para levantar:**
```bash
docker-compose up -d
```

---

## 8. Paso 5 — Prisma Schema

Creá la estructura:
```
prisma/
├── schema.prisma
└── migrations/
    └── 20260502015115_init/
        └── migration.sql
```

**`prisma/schema.prisma`:**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  admin
  staff
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(staff)
  deletedAt DateTime?
  sales     Sale[]

  @@index([email])
  @@index([role])
  @@map("users")
}

model Medicine {
  id            String   @id @default(uuid())
  tradeName     String
  genericName   String
  description   String?
  price         Decimal
  stock         Int      @default(0)
  expiryDate    DateTime?
  laboratoryId  String
  categoryId    String
  laboratory    Lab      @relation(fields: [laboratoryId], references: [id])
  category      Category @relation(fields: [categoryId], references: [id])
  saleItems     SaleItem[]
  deletedAt     DateTime?

  @@index([tradeName])
  @@index([genericName])
  @@index([laboratoryId])
  @@index([categoryId])
  @@map("medicines")
}

model Sale {
  id           String     @id @default(uuid())
  date         DateTime   @default(now())
  total        Decimal
  paymentMethod String
  userId       String
  clientId     String?
  user         User       @relation(fields: [userId], references: [id])
  client       Client?    @relation(fields: [clientId], references: [id])
  items        SaleItem[]

  @@index([date])
  @@index([userId])
  @@index([clientId])
  @@map("sales")
}

model SaleItem {
  id         String   @id @default(uuid())
  saleId     String
  medicineId String
  quantity   Int
  unitPrice  Decimal
  sale       Sale     @relation(fields: [saleId], references: [id])
  medicine   Medicine @relation(fields: [medicineId], references: [id])

  @@index([saleId])
  @@index([medicineId])
  @@map("sale_items")
}

model Client {
  id             String   @id @default(uuid())
  name           String
  documentNumber String   @unique
  email          String?
  phone          String?
  address        String?
  membership     String   @default("bronze")
  deletedAt      DateTime?
  sales          Sale[]

  @@index([documentNumber])
  @@index([email])
  @@map("clients")
}

model Lab {
  id        String     @id @default(uuid())
  name      String
  medicines Medicine[]
  deletedAt DateTime?

  @@map("labs")
}

model Supplier {
  id        String   @id @default(uuid())
  name      String
  contact   String?
  deletedAt DateTime?

  @@map("suppliers")
}

model Category {
  id        String     @id @default(uuid())
  name      String
  medicines Medicine[]

  @@map("categories")
}
```

**¿Qué modelamos?**

| Modelo | Descripción |
|--------|-------------|
| **User** | Usuarios del sistema (admin o staff). Tiene `deletedAt` para soft delete. |
| **Role** | Enum con solo dos valores: `admin` y `staff` |
| **Client** | Clientes de la farmacia. Membresía: bronze/silver/gold. |
| **Lab** | Laboratorio farmacéutico |
| **Category** | Categoría de medicamentos |
| **Medicine** | Medicamento. Tiene relación con Lab y Category. |
| **Sale** | Venta. Tiene relación con User y Client. |
| **SaleItem** | Items de una venta |
| **Supplier** | Proveedor |

**Relaciones clave:**
- User → Sale (1:N)
- Client → Sale (1:N, opcional)
- Medicine → SaleItem (1:N)
- Sale → SaleItem (1:N)
- Lab → Medicine (1:N)
- Category → Medicine (1:N)

**Todas las entidades tienen `deletedAt`** para implementar soft delete.

**Ejecutá la migración:**
```bash
npx prisma migrate dev --name init
```

---

## 9. Paso 6 — Migración SQL

Prisma genera automáticamente el SQL. El archivo `prisma/migrations/20260502015115_init/migration.sql` contiene:

```sql
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'staff');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'staff',
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicines" (
    "id" TEXT NOT NULL,
    "tradeName" TEXT NOT NULL,
    "genericName" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "expiryDate" TIMESTAMP(3),
    "laboratoryId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "medicines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total" DECIMAL(65,30) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT,
    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "membership" TEXT NOT NULL DEFAULT 'bronze',
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "labs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "medicines_tradeName_idx" ON "medicines"("tradeName");
CREATE INDEX "medicines_genericName_idx" ON "medicines"("genericName");
CREATE INDEX "medicines_laboratoryId_idx" ON "medicines"("laboratoryId");
CREATE INDEX "medicines_categoryId_idx" ON "medicines"("categoryId");
CREATE INDEX "sales_date_idx" ON "sales"("date");
CREATE INDEX "sales_userId_idx" ON "sales"("userId");
CREATE INDEX "sales_clientId_idx" ON "sales"("clientId");
CREATE INDEX "sale_items_saleId_idx" ON "sale_items"("saleId");
CREATE INDEX "sale_items_medicineId_idx" ON "sale_items"("medicineId");
CREATE UNIQUE INDEX "clients_documentNumber_key" ON "clients"("documentNumber");
CREATE INDEX "clients_documentNumber_idx" ON "clients"("documentNumber");

-- AddForeignKey
ALTER TABLE "medicines" ADD CONSTRAINT "medicines_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "labs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "medicines" ADD CONSTRAINT "medicines_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "medicines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

---

## 10. Paso 7 — Servidor (server.ts)

Creá `src/server.ts`:

```typescript
import { buildApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './infrastructure/logger.js';
import { prisma } from './config/prisma.js';
import { redis } from './config/redis.js';

const startServer = async () => {
  try {
    const app = await buildApp();

    await app.listen({ port: env.PORT, host: '0.0.0.0' });

    logger.info(`Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);

    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      await app.close();
      await prisma.$disconnect();
      redis.disconnect();
      process.exit(0);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();
```

**¿Qué hace?**
1. Importa `buildApp` (que configura Fastify).
2. Levanta el servidor en el puerto de las variables de entorno.
3. **Graceful shutdown**: al recibir SIGINT (Ctrl+C) o SIGTERM, cierra el servidor, Prisma y Redis antes de salir.
4. Si algo falla, loguea y sale con código 1.

---

## 11. Paso 8 — Aplicación (app.ts)

Creá `src/app.ts`:

```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { errorHandler } from './presentation/middlewares/errorHandler.js';
import { registerAuth } from './presentation/middlewares/auth.js';
import { routes } from './presentation/routes.js';

export const buildApp = async () => {
    const app = Fastify({
        logger: env.NODE_ENV === 'development'
            ? {
                level: 'debug',
                transport: {
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        translateTime: 'SYS:standard',
                        ignore: 'pid,hostname',
                    },
                },
            }
            : {
                level: 'info',
            },
    });

    // Error Handler
    app.setErrorHandler(errorHandler);

    // Security and Utils
    await app.register(helmet);
    await app.register(cors, {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    });
    await app.register(compress);

    // Rate Limiting
    await app.register(rateLimit, {
        max: 100,
        timeWindow: '1 minute',
    });

    // JWT Auth
    await registerAuth(app);

    // Routes
    app.register(routes, { prefix: '/api/v1' });

    // Health check
    app.get('/health', async () => {
        return { status: 'ok', timestamp: new Date().toISOString() };
    });

    return app;
};
```

**¿Qué hace cada parte?**
- `Fastify({ logger: ... })` — Crea la instancia. En desarrollo usa `pino-pretty` con colores; en producción `level: 'info'`.
- `app.setErrorHandler(errorHandler)` — Handler global de errores.
- `app.register(helmet)` — Headers de seguridad (XSS, HSTS, etc.).
- `app.register(cors, ...)` — Habilita CORS desde cualquier origen.
- `app.register(compress)` — Comprime respuestas con gzip.
- `app.register(rateLimit, ...)` — Limita a 100 requests/min por IP.
- `registerAuth(app)` — Configura JWT.
- `app.register(routes, { prefix: '/api/v1' })` — Registra todas las rutas bajo `/api/v1`.
- `app.get('/health', ...)` — Health check para monitoreo.

---

## 12. Paso 9 — Configuración

### 12a. `src/config/env.ts`

```typescript
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().url(),
    REDIS_HOST: z.string().default('127.0.0.1'),
    REDIS_PORT: z.coerce.number().default(6379),
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error('❌ Invalid environment variables', _env.error.format());
    process.exit(1);
}

export const env = _env.data;
```

**¿Qué hace?**
- Carga `.env` con `dotenv.config()`.
- Usa **Zod** para validar todas las variables.
- Si falta alguna o tiene formato inválido, muestra el error y mata el proceso.
- Exporta `env` tipado correctamente por TypeScript.

---

### 12b. `src/config/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

export const prisma = new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasourceUrl: env.DATABASE_URL,
});
```

**¿Qué hace?**
- Crea una instancia singleton de Prisma Client.
- En desarrollo loguea todas las queries SQL.
- En producción solo loggea errores.

---

### 12c. `src/config/redis.ts`

```typescript
import Redis from 'ioredis';
import { env } from './env.js';

const redisConfig = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    retryStrategy: () => null,
    reconnectOnError: () => false,
};

export const redis = new Redis.default(redisConfig);

redis.on('error', (err: Error) => {
    // Silenciar errores - Redis es opcional
});

export const isRedisConnected = () => redis.status === 'ready';
```

**¿Qué hace?**
- Se conecta a Redis con ioredis.
- No reintenta infinitamente si Redis cae.
- Los errores de Redis se silencian porque **Redis es opcional**.
- `isRedisConnected()` verifica si Redis está disponible.

---

## 13. Paso 10 — Logger

Creá `src/infrastructure/logger.ts`:

```typescript
import pino from 'pino';

export const logger = pino({
    transport: process.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
        },
    } : undefined,
});
```

**¿Qué hace?**
- Usa **Pino** como logger de alto rendimiento.
- En desarrollo: `pino-pretty` con colores y timestamps legibles.
- En producción: formato JSON plano (más rápido).

---

## 14. Paso 11 — Errores Personalizados

Creá `src/core/errors/AppError.ts`:

```typescript
export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode = 400, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this);
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403);
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409);
    }
}
```

**¿Por qué?**
- `AppError` es la base con `statusCode` y `isOperational` (distinguir errores esperados de bugs).
- `NotFoundError` → 404
- `UnauthorizedError` → 401
- `ForbiddenError` → 403
- `ConflictError` → 409

---

## 15. Paso 12 — Tipos del Sistema

### 15a. `src/types/index.ts`

```typescript
export * from './user.js';
export * from './auth.js';
export * from './medicine.js';
export * from './client.js';
export * from './sale.js';
export * from './fastify.js';
```

### 15b. `src/types/user.ts`

```typescript
export type Role = 'admin' | 'staff';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  deletedAt?: Date | null;
}

export interface UserWithoutPassword {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
}

export interface UserFilters {
  search?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 15c. `src/types/auth.ts`

```typescript
import { Role } from './user.js';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface RefreshPayload {
  userId: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    createdAt?: Date;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}
```

### 15d. `src/types/client.ts`

```typescript
export type MembershipTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Client {
  id: string;
  name: string;
  documentNumber: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  membership: string;
  deletedAt?: Date | null;
}

export interface CreateClientDto {
  name: string;
  documentNumber: string;
  email?: string;
  phone?: string;
  address?: string;
  membership?: string;
}

export interface UpdateClientDto {
  name?: string;
  documentNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  membership?: string;
}

export interface ClientFilters {
  search?: string;
  membership?: string;
}
```

### 15e. `src/types/medicine.ts`

```typescript
export interface Lab {
  id: string;
  name: string;
  deletedAt?: Date | null;
}

export interface Category {
  id: string;
  name: string;
}

export interface Medicine {
  id: string;
  tradeName: string;
  genericName: string;
  description?: string | null;
  price: number;
  stock: number;
  expiryDate?: Date | null;
  laboratoryId: string;
  categoryId: string;
  laboratory?: Lab;
  category?: Category;
  deletedAt?: Date | null;
}

export interface CreateMedicineDto {
  tradeName: string;
  genericName: string;
  description?: string;
  price: number;
  stock?: number;
  expiryDate?: string;
  laboratoryId: string;
  categoryId: string;
}

export interface UpdateMedicineDto {
  tradeName?: string;
  genericName?: string;
  description?: string;
  price?: number;
  expiryDate?: string;
  laboratoryId?: string;
  categoryId?: string;
}

export interface UpdateStockDto {
  stock?: number;
  increment?: number;
  decrement?: number;
}

export type StockStatus = 'low' | 'out' | 'adequate' | 'well';

export interface MedicineFilters {
  search?: string;
  laboratoryId?: string;
  categoryId?: string;
  stockStatus?: StockStatus;
}
```

### 15f. `src/types/sale.ts`

```typescript
export type PaymentMethod = 'cash' | 'card' | 'transfer';

export interface SaleItem {
  id: string;
  saleId: string;
  medicineId: string;
  quantity: number;
  unitPrice: number;
}

export interface Sale {
  id: string;
  date: Date;
  total: number;
  paymentMethod: string;
  userId: string;
  clientId?: string | null;
  items?: SaleItem[];
}

export interface CreateSaleItemDto {
  medicineId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateSaleDto {
  paymentMethod: PaymentMethod;
  clientId?: string;
  items: CreateSaleItemDto[];
}

export interface SaleFilters {
  startDate?: string;
  endDate?: string;
  userId?: string;
  clientId?: string;
}
```

### 15g. `src/types/fastify.ts`

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from './auth.js';

export interface AuthenticatedRequest extends FastifyRequest {
  user: JwtPayload;
}

export type FastifyRouteHandler = (
  request: FastifyRequest | AuthenticatedRequest,
  reply: FastifyReply
) => Promise<any>;

export interface QueryParams {
  page?: number;
  limit?: number;
  [key: string]: any;
}
```

**¿Por qué necesitamos `AuthenticatedRequest`?**
- Fastify no sabe que `request.user` existe. Este tipo extiende `FastifyRequest` agregando la propiedad `user` con el payload del JWT. Así TypeScript no se queja cuando usamos `request.user.sub` en un handler protegido.

---

## 16. Paso 13 — Middlewares

### 16a. `src/presentation/middlewares/auth.ts`

```typescript
import jwt from '@fastify/jwt';
import { FastifyInstance } from 'fastify';
import { env } from '../../config/env.js';

export async function registerAuth(app: FastifyInstance): Promise<void> {
    // Register JWT plugin
    await app.register(jwt, {
        secret: env.JWT_SECRET,
    });

    // Decorate app with authenticate method
    app.decorate('authenticate', async function(request: any, reply: any) {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.send(err);
        }
    });
}
```

**¿Qué hace?**
1. Registra el plugin `@fastify/jwt` con el secreto del `.env`.
2. Crea un **decorador** `app.authenticate` que puede usarse como `preHandler` en rutas.
3. Cuando `jwtVerify()` falla (token expirado, inválido, etc.), envía el error como respuesta.

**¿Cómo se usa?**
```typescript
fastify.get('/protected', {
    preHandler: [fastify.authenticate],
    handler: (request, reply) => { ... }
});
```

El `preHandler` se ejecuta ANTES del handler. Si `authenticate` falla, el handler nunca se ejecuta.

---

### 16b. `src/presentation/middlewares/errorHandler.ts`

```typescript
import { ZodError } from 'zod';
import { logger } from '../../infrastructure/logger.js';
import { AppError } from '../../core/errors/AppError.js';

const errorHandler = (error: any, request: any, reply: any) => {
    if (error instanceof ZodError) {
        logger.warn({ err: error }, 'Validation error');
        return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Validation failed',
            issues: error.issues,
        });
    }

    if (error instanceof AppError) {
        logger.warn({ err: error }, error.message);
        return reply.status(error.statusCode).send({
            statusCode: error.statusCode,
            error: error.name,
            message: error.message,
        });
    }

    if (error.statusCode) {
        return reply.status(error.statusCode).send({
            statusCode: error.statusCode,
            error: error.name,
            message: error.message,
        });
    }

    logger.error({ err: error }, 'Unhandled Error');
    return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
    });
};

export { errorHandler };
```

**¿Qué hace?**
Centraliza el manejo de TODOS los errores:

1. **ZodError** (status 400) — Validación de DTO fallida.
2. **AppError** — Nuestros errores personalizados.
3. **Error con statusCode** — Otros errores con código de estado.
4. **Error genérico** (status 500) — Para cualquier error inesperado. NUNCA exponemos el stack trace.

---

### 16c. `src/presentation/middlewares/rbac.ts`

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError, ForbiddenError } from '../../core/errors/AppError.js';
import { Role } from '../../types/index.js';

const requireRoles = (roles: Role[]) => {
    return async (_request: FastifyRequest, _reply: FastifyReply) => {
        const request = _request as FastifyRequest & { user?: { role?: Role } };
        const user = request.user;
        if (!user || !user.role) {
            throw new UnauthorizedError('User not authenticated');
        }

        if (!roles.includes(user.role)) {
            throw new ForbiddenError('Insufficient permissions');
        }
    };
};

export { requireRoles };
```

**¿Qué hace?**
Implementa **RBAC (Role-Based Access Control)**:
- Recibe un array de roles permitidos (ej: `['admin']`, `['admin', 'staff']`).
- Verifica que el usuario esté autenticado.
- Verifica que el rol del usuario esté en la lista permitida.
- Si no cumple, lanza `UnauthorizedError` o `ForbiddenError`.

**¿Cómo se usa?**
```typescript
fastify.delete('/:id', {
    preHandler: [fastify.authenticate, requireRoles(['admin'])],
    handler: clientController.delete,
});
```

---

## 17. Paso 14 — Rutas

Creá `src/presentation/routes.ts`:

```typescript
import authRoutes from '../modules/auth/presentation/auth.routes.js';
import userRoutes from '../modules/users/presentation/user.routes.js';
import medicineRoutes from '../modules/medicines/presentation/medicine.routes.js';
import saleRoutes from '../modules/sales/presentation/sale.routes.js';
import clientRoutes from '../modules/clients/presentation/client.routes.js';
import reportRoutes from '../modules/reports/presentation/report.routes.js';

const routes = async (fastify: any, options: any) => {
    fastify.register(authRoutes, { prefix: '/auth' });
    fastify.register(userRoutes, { prefix: '/users' });
    fastify.register(medicineRoutes, { prefix: '/medicines' });
    fastify.register(saleRoutes, { prefix: '/sales' });
    fastify.register(clientRoutes, { prefix: '/clients' });
    fastify.register(reportRoutes, { prefix: '/reports' });
};

export { routes };
```

**¿Qué hace?**
- Registra todos los módulos de rutas como **fastify plugins**.
- Como en `app.ts` se registró con `{ prefix: '/api/v1' }`, las URLs finales quedan:
`/api/v1/auth/register`, `/api/v1/users/`, `/api/v1/medicines/`, etc.

---

## 18. Paso 15 — Módulo Auth

### 18a. `src/modules/auth/presentation/auth.routes.ts`

```typescript
import { register, login, refresh, logout } from './auth.controller.js';

const authRoutes = async (fastify: any, options: any) => {
    fastify.post('/register', register);
    fastify.post('/login', login);
    fastify.post('/refresh', refresh);
    fastify.post('/logout', {
        preHandler: [fastify.authenticate],
        handler: logout,
    });
};

export default authRoutes;
```

**Rutas:**
- `POST /auth/register` — Registro público.
- `POST /auth/login` — Login público.
- `POST /auth/refresh` — Refrescar token público.
- `POST /auth/logout` — Logout protegido.

---

### 18b. `src/modules/auth/presentation/auth.dto.ts`

```typescript
import { z } from 'zod';

export const RegisterDtoSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['admin', 'staff']).optional(),
});

export const LoginDtoSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

export const RefreshTokenDtoSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});
```

---

### 18c. `src/modules/auth/presentation/auth.controller.ts`

```typescript
import { RegisterDtoSchema, LoginDtoSchema, RefreshTokenDtoSchema } from './auth.dto.js';
import * as authService from '../application/auth.service.js';

const register = async (request: any, reply: any) => {
    const data = RegisterDtoSchema.parse(request.body);
    const result = await authService.register(data);
    return reply.status(201).send(result);
};

const login = async (request: any, reply: any) => {
    const data = LoginDtoSchema.parse(request.body);
    const result = await authService.login(data.email, data.password);

    reply.setCookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
    });

    reply.setCookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return reply.send({
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
    });
};

const refresh = async (request: any, reply: any) => {
    const data = RefreshTokenDtoSchema.parse(request.body);
    const result = await authService.refresh(data.refreshToken);

    reply.setCookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
    });

    reply.setCookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return reply.send(result);
};

const logout = async (request: any, reply: any) => {
    await authService.logout(request.user.sub);

    reply.clearCookie('access_token');
    reply.clearCookie('refresh_token');

    return reply.send({ message: 'Logged out successfully' });
};

export { register, login, refresh, logout };
```

---

### 18d. `src/modules/auth/application/auth.service.ts`

```typescript
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../../config/env.js';
import { prisma } from '../../../config/prisma.js';
import { redis, isRedisConnected } from '../../../config/redis.js';
import { UnauthorizedError, ConflictError } from '../../../core/errors/AppError.js';
import { Role, UserWithoutPassword, AuthResponse } from '../../../types/index.js';

const SALT_ROUNDS = 10;

const hashPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, SALT_ROUNDS);
};

const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
};

interface TokenPayload {
    userId: string;
    email: string;
    role: Role;
}

const generateTokens = (userId: string, email: string, role: Role) => {
    const accessTokenOptions: SignOptions = {
        expiresIn: 900
    };
    
    const refreshTokenOptions: SignOptions = {
        expiresIn: 604800
    };

    const accessToken = jwt.sign(
        { userId, email, role } as TokenPayload,
        env.JWT_SECRET,
        accessTokenOptions
    );

    const refreshToken = jwt.sign(
        { userId },
        env.JWT_REFRESH_SECRET,
        refreshTokenOptions
    );

    return { accessToken, refreshToken };
};

interface RegisterData {
    name: string;
    email: string;
    password: string;
    role?: Role;
}

const register = async (data: RegisterData): Promise<AuthResponse> => {
    const { name, email, password, role = 'staff' } = data;

    const existingUser = await prisma.user.findFirst({
        where: { email, deletedAt: null },
    });

    if (existingUser) {
        throw new ConflictError('Email already registered');
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role,
        },
    });

    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role as Role);

    if (isRedisConnected()) {
        await redis.set(
            `refresh_token:${user.id}`,
            refreshToken,
            'EX',
            7 * 24 * 60 * 60
        );
    }

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role as Role,
        },
        accessToken,
        refreshToken,
    };
};

const login = async (email: string, password: string): Promise<AuthResponse> => {
    const user = await prisma.user.findFirst({
        where: { email, deletedAt: null },
    });

    if (!user) {
        throw new UnauthorizedError('Invalid credentials');
    }

    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
        throw new UnauthorizedError('Invalid credentials');
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role as Role);

    if (isRedisConnected()) {
        await redis.set(
            `refresh_token:${user.id}`,
            refreshToken,
            'EX',
            7 * 24 * 60 * 60
        );
    }

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role as Role,
        },
        accessToken,
        refreshToken,
    };
};

interface RefreshResponse {
    accessToken: string;
    refreshToken: string;
}

const refresh = async (refreshToken: string): Promise<RefreshResponse> => {
    if (!isRedisConnected()) {
        throw new UnauthorizedError('Token refresh unavailable');
    }

    try {
        const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string };

        const storedToken = await redis.get(`refresh_token:${payload.userId}`);

        if (storedToken !== refreshToken) {
            throw new UnauthorizedError('Invalid or expired refresh token');
        }

        const user = await prisma.user.findFirst({
            where: { id: payload.userId, deletedAt: null },
        });

        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(
            user.id,
            user.email,
            user.role as Role
        );

        await redis.set(
            `refresh_token:${user.id}`,
            newRefreshToken,
            'EX',
            7 * 24 * 60 * 60
        );

        return {
            accessToken,
            refreshToken: newRefreshToken,
        };
    } catch (error) {
        throw new UnauthorizedError('Invalid or expired refresh token');
    }
};

const logout = async (userId: string): Promise<void> => {
    if (isRedisConnected()) {
        await redis.del(`refresh_token:${userId}`);
    }
};

export { register, login, refresh, logout, generateTokens };
```


**¿Qué hace cada función?**

- **`hashPassword`** — Usa bcrypt con 10 salt rounds para hashear contraseñas.
- **`comparePassword`** — Compara una contraseña en texto plano contra un hash.
- **`generateTokens`** — Genera:
  - **Access Token** (15 min): contiene `userId`, `email`, `role`, firmado con `JWT_SECRET`.
  - **Refresh Token** (7 días): contiene solo `userId`, firmado con `JWT_REFRESH_SECRET` (diferente!).
- **`register`:**
  1. Busca si ya existe un usuario con ese email (solo usuarios no borrados: `deletedAt: null`).
  2. Si existe, lanza `ConflictError`.
  3. Hashea la contraseña.
  4. Crea el usuario en la base de datos.
  5. Genera tokens.
  6. Guarda el refresh token en Redis (`refresh_token:{userId}`) con expiración de 7 días.
  7. Retorna el usuario (sin password) y los tokens.
- **`login`:**
  1. Busca el usuario por email.
  2. Si no existe, lanza `UnauthorizedError`.
  3. Compara la contraseña.
  4. Si no coincide, lanza `UnauthorizedError`.
  5. Genera tokens, guarda refresh token en Redis, retorna.
- **`refresh`:**
  1. Verifica que Redis esté conectado (si no, no se puede refrescar).
  2. Verifica el refresh token con la clave secreta.
  3. Busca en Redis si el refresh token coincide con el almacenado (previene reutilización de tokens robados).
  4. Busca al usuario en la DB.
  5. Genera nuevos tokens (rotación de refresh token).
  6. Guarda el nuevo refresh token en Redis.
- **`logout`:** Borra el refresh token de Redis, invalidándolo.

---

## 19. Paso 16 — Módulo Users

Controla usuarios del sistema (CRUD). Solo admin puede realizar operaciones.

### 19a. `src/modules/users/presentation/user.routes.ts`

```typescript
import { userController } from './user.controller.js';
import { requireRoles } from '../../../presentation/middlewares/rbac.js';

const userRoutes = async (fastify: any, _options: any) => {
    fastify.get('/', {
        preHandler: [fastify.authenticate, requireRoles(['admin'])],
        handler: userController.findAll,
    });

    fastify.get('/:id', {
        preHandler: [fastify.authenticate, requireRoles(['admin'])],
        handler: userController.findById,
    });

    fastify.post('/', {
        preHandler: [fastify.authenticate, requireRoles(['admin'])],
        handler: userController.create,
    });

    fastify.put('/:id', {
        preHandler: [fastify.authenticate, requireRoles(['admin'])],
        handler: userController.update,
    });

    fastify.delete('/:id', {
        preHandler: [fastify.authenticate, requireRoles(['admin'])],
        handler: userController.delete,
    });
};

export default userRoutes;
```

**Todas las rutas requieren autenticación + rol admin.**

- `GET /users` — Lista paginada de usuarios.
- `GET /users/:id` — Un usuario específico.
- `POST /users` — Crear nuevo usuario.
- `PUT /users/:id` — Actualizar usuario.
- `DELETE /users/:id` — Soft delete de usuario.

---

### 19b. `src/modules/users/presentation/user.dto.ts`

```typescript
import { z } from 'zod';

export const CreateUserDtoSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['admin', 'staff']).optional(),
});

export const UpdateUserDtoSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email format').optional(),
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
    role: z.enum(['admin', 'staff']).optional(),
});
```

---

### 19c. `src/modules/users/presentation/user.controller.ts`

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateUserDtoSchema, UpdateUserDtoSchema } from './user.dto.js';
import { userService } from '../application/user.service.js';

export const userController = {
    findAll: async (request: FastifyRequest, reply: FastifyReply) => {
        const query = request.query as { page?: number; limit?: number };
        const { page = 1, limit = 10 } = query;
        const result = await userService.findAll(Number(page), Number(limit));
        return reply.send(result);
    },

    findById: async (request: FastifyRequest, reply: FastifyReply) => {
        const params = request.params as { id: string };
        const { id } = params;
        const user = await userService.findById(id);
        return reply.send(user);
    },

    create: async (request: FastifyRequest, reply: FastifyReply) => {
        const data = CreateUserDtoSchema.parse(request.body);
        const user = await userService.create(data);
        return reply.status(201).send(user);
    },

    update: async (request: FastifyRequest, reply: FastifyReply) => {
        const params = request.params as { id: string };
        const { id } = params;
        const data = UpdateUserDtoSchema.parse(request.body);
        const currentUserId = (request as any).user?.sub;
        const user = await userService.update(id, data, currentUserId);
        return reply.send(user);
    },

    delete: async (request: FastifyRequest, reply: FastifyReply) => {
        const params = request.params as { id: string };
        const { id } = params;
        const currentUserId = (request as any).user?.sub;
        await userService.delete(id, currentUserId);
        return reply.send({ message: 'User deleted successfully' });
    },
};
```

**Cada handler:**
- Obtiene datos del request (query params, params de URL, o body).
- Los valida con Zod (`.parse()`).
- Llama al servicio correspondiente.
- Retorna la respuesta con el status code adecuado.

Nótese que en `update` y `delete` se extrae `currentUserId` del token JWT (`request.user.sub`) para prevenir que un usuario se elimine a sí mismo o cambie su propio rol.

---

### 19d. `src/modules/users/application/user.service.ts`

```typescript
import bcrypt from 'bcrypt';
import { userRepository } from '../infrastructure/user.repository.js';
import { ConflictError, NotFoundError, ForbiddenError } from '../../../core/errors/AppError.js';
import { CreateUserDto, UpdateUserDto, PaginatedResponse, UserWithoutPassword } from '../../../types/index.js';

const SALT_ROUNDS = 10;

export const userService = {
    findAll: async (page = 1, limit = 10): Promise<PaginatedResponse<UserWithoutPassword>> => {
        const skip = (page - 1) * limit;
        const users = await userRepository.findAllActive(skip, limit);
        const total = await userRepository.countActive();
        const totalPages = Math.ceil(total / limit);

        return {
            data: users,
            pagination: {
                page,
                limit,
                total,
                totalPages,
            },
        };
    },

    findById: async (id: string): Promise<UserWithoutPassword | null> => {
        const user = await userRepository.findById(id);
        if (!user) {
            throw new NotFoundError('User not found');
        }
        return user;
    },

    create: async (data: CreateUserDto): Promise<UserWithoutPassword> => {
        const existingUser = await userRepository.findByEmail(data.email);
        if (existingUser) {
            throw new ConflictError('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

        return await userRepository.create({
            name: data.name,
            email: data.email,
            password: hashedPassword,
            role: data.role || 'staff',
        });
    },

    update: async (id: string, data: UpdateUserDto, currentUserId: string): Promise<UserWithoutPassword> => {
        const user = await userRepository.findById(id);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        if (currentUserId === id && data.role) {
            throw new ForbiddenError('Cannot change your own role');
        }

        if (data.email) {
            const existingUser = await userRepository.findByEmail(data.email);
            if (existingUser && existingUser.id !== id) {
                throw new ConflictError('Email already in use');
            }
        }

        const updateData = { ...data };
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, SALT_ROUNDS);
        }

        return await userRepository.update(id, updateData);
    },

    delete: async (id: string, currentUserId: string): Promise<void> => {
        const user = await userRepository.findById(id);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        if (currentUserId === id) {
            throw new ForbiddenError('Cannot delete your own account');
        }

        await userRepository.softDelete(id);
    },
};
```

**Lógica de negocio clave:**
- No se puede cambiar el rol de uno mismo.
- No se puede usar el email de otro usuario.
- No se puede eliminar la propia cuenta.
- Las contraseñas siempre se hashean antes de guardar.
- El `delete` es soft delete (pone `deletedAt` en vez de borrar).

---

### 19e. `src/modules/users/domain/user.repository.interface.ts`

```typescript
import { CreateUserDto, UpdateUserDto, UserWithoutPassword } from '../../../types/index.js';

// IUserRepository interface
// This defines the contract for user data access

export interface IUserRepository {
    findByEmail(email: string): Promise<any | null>;
    findById(id: string): Promise<UserWithoutPassword | null>;
    findAllActive(skip?: number, take?: number): Promise<UserWithoutPassword[]>;
    countActive(): Promise<number>;
    create(data: { name: string; email: string; password: string; role?: string }): Promise<UserWithoutPassword>;
    update(id: string, data: { name?: string; email?: string; password?: string; role?: string }): Promise<UserWithoutPassword>;
    softDelete(id: string): Promise<any>;
}

export const userRepositoryContract: IUserRepository = {
    findByEmail: async (email: string) => { return null; },
    findById: async (id: string) => { return null; },
    findAllActive: async (skip = 0, take = 10) => { return []; },
    countActive: async () => { return 0; },
    create: async (data) => { return {} as UserWithoutPassword; },
    update: async (id: string, data) => { return {} as UserWithoutPassword; },
    softDelete: async (id: string) => {},
};
```

**¿Por qué una interfaz?**
- Define un **contrato**: lo que el servicio espera del repositorio, sin importar la implementación.
- Si mañana cambiás Prisma por Knex o raw queries, el servicio no se toca.
- `userRepositoryContract` es una implementación vacía (mock) útil para tests.

---

### 19f. `src/modules/users/infrastructure/user.repository.ts`

```typescript
import { prisma } from '../../../config/prisma.js';
import { UserWithoutPassword, Role } from '../../../types/index.js';

interface CreateUserData {
    name: string;
    email: string;
    password: string;
    role?: string;
}

interface UpdateUserData {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
}

// Helper to map Prisma user to UserWithoutPassword
const mapToUserWithoutPassword = (user: {
    id: string;
    name: string;
    email: string;
    role: Role;
}): UserWithoutPassword => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
});

export const userRepository = {
    findByEmail: async (email: string) => {
        return await prisma.user.findFirst({
            where: { email, deletedAt: null },
        });
    },

    findById: async (id: string): Promise<UserWithoutPassword | null> => {
        const user = await prisma.user.findFirst({
            where: { id, deletedAt: null },
        });
        if (!user) return null;
        return mapToUserWithoutPassword(user);
    },

    findAllActive: async (skip = 0, take = 10): Promise<UserWithoutPassword[]> => {
        const users = await prisma.user.findMany({
            where: { deletedAt: null },
            skip,
            take,
        });
        return users.map(mapToUserWithoutPassword);
    },

    countActive: async (): Promise<number> => {
        return await prisma.user.count({
            where: { deletedAt: null },
        });
    },

    create: async (data: CreateUserData): Promise<UserWithoutPassword> => {
        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: data.password,
                role: data.role as Role,
            },
        });
        return mapToUserWithoutPassword(user);
    },

    update: async (id: string, data: UpdateUserData): Promise<UserWithoutPassword> => {
        const user = await prisma.user.update({
            where: { id },
            data: {
                name: data.name,
                email: data.email,
                password: data.password,
                role: data.role as Role,
            },
        });
        return mapToUserWithoutPassword(user);
    },

    softDelete: async (id: string): Promise<any> => {
        return await prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    },
};
```

**¿Qué hace?**
- Es la implementación concreta de `IUserRepository` usando Prisma.
- `mapToUserWithoutPassword` — Elimina el campo `password` antes de devolver al servicio (seguridad).
- Todas las queries filtran por `deletedAt: null` (soft delete).
- `findByEmail` se usa para verificar duplicados.
- `create` y `update` reciben los datos ya validados por el servicio.

---

## 20. Paso 17 — Módulo Medicines

### 20a. `src/modules/medicines/presentation/medicine.routes.ts`

```typescript
import { medicineController } from './medicine.controller.js';
import { requireRoles } from '../../../presentation/middlewares/rbac.js';

export default async function medicineRoutes(fastify: any, _options: any) {
    fastify.get('/', {
        preHandler: [fastify.authenticate],
        handler: medicineController.findAll,
    });

    fastify.get('/:id', {
        preHandler: [fastify.authenticate],
        handler: medicineController.findById,
    });

    fastify.post('/', {
        preHandler: [fastify.authenticate, requireRoles(['admin', 'staff'])],
        handler: medicineController.create,
    });

    fastify.put('/:id', {
        preHandler: [fastify.authenticate, requireRoles(['admin', 'staff'])],
        handler: medicineController.update,
    });

    fastify.patch('/:id/stock', {
        preHandler: [fastify.authenticate, requireRoles(['admin', 'staff'])],
        handler: medicineController.updateStock,
    });

    fastify.delete('/:id', {
        preHandler: [fastify.authenticate, requireRoles(['admin'])],
        handler: medicineController.delete,
    });
}
```

**Nota:** La eliminación es solo admin, pero el CRUD básico puede ser admin Y staff.

---

### 20b. `src/modules/medicines/presentation/medicine.dto.ts`

```typescript
import { z } from 'zod';

export const CreateMedicineDtoSchema = z.object({
    tradeName: z.string().min(2, 'Trade name must be at least 2 characters'),
    genericName: z.string().min(2, 'Generic name must be at least 2 characters'),
    description: z.string().optional(),
    price: z.number().positive('Price must be positive'),
    stock: z.number().int().min(0).optional(),
    expiryDate: z.string().datetime().optional(),
    laboratoryId: z.string().min(1, 'Laboratory is required'),
    categoryId: z.string().min(1, 'Category is required'),
});

export const UpdateMedicineDtoSchema = z.object({
    tradeName: z.string().min(2, 'Trade name must be at least 2 characters').optional(),
    genericName: z.string().min(2, 'Generic name must be at least 2 characters').optional(),
    description: z.string().optional(),
    price: z.number().positive('Price must be positive').optional(),
    expiryDate: z.string().datetime().optional(),
    laboratoryId: z.string().min(1, 'Laboratory is required').optional(),
    categoryId: z.string().min(1, 'Category is required').optional(),
});

export const UpdateStockDtoSchema = z.object({
    stock: z.number().int().min(0).optional(),
    increment: z.number().int().positive().optional(),
    decrement: z.number().int().positive().optional(),
}).refine(data => {
    const count = [data.stock, data.increment, data.decrement].filter(v => v !== undefined).length;
    return count === 1;
}, { message: 'Exactly one of stock, increment, or decrement must be provided' });
```

**Particularidad de `UpdateStockDtoSchema`:**
- Usa `.refine()` para asegurar que se envíe EXACTAMENTE una de las tres opciones: `stock` (valor absoluto), `increment` (sumar) o `decrement` (restar).

---

### 20c. `src/modules/medicines/presentation/medicine.controller.ts`

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateMedicineDtoSchema, UpdateMedicineDtoSchema, UpdateStockDtoSchema } from './medicine.dto.js';
import { medicineService } from '../application/medicine.service.js';
import { CreateMedicineDto, UpdateMedicineDto, UpdateStockDto, MedicineFilters } from '../../../types/index.js';

interface Params {
    id: string;
}

interface Query extends MedicineFilters {
    page?: number;
    limit?: number;
}

export const medicineController = {
    findAll: async (request: FastifyRequest<{ Querystring: Query }>, reply: FastifyReply) => {
        const result = await medicineService.findAll(request.query);
        return reply.send(result);
    },

    findById: async (request: FastifyRequest<{ Params: Params }>, reply: FastifyReply) => {
        const { id } = request.params;
        const medicine = await medicineService.findById(id);
        return reply.send(medicine);
    },

    create: async (request: FastifyRequest<{ Body: CreateMedicineDto }>, reply: FastifyReply) => {
        const data = CreateMedicineDtoSchema.parse(request.body);
        const medicine = await medicineService.create(data);
        return reply.status(201).send(medicine);
    },

    update: async (request: FastifyRequest<{ Params: Params; Body: UpdateMedicineDto }>, reply: FastifyReply) => {
        const { id } = request.params;
        const data = UpdateMedicineDtoSchema.parse(request.body);
        const medicine = await medicineService.update(id, data);
        return reply.send(medicine);
    },

    updateStock: async (request: FastifyRequest<{ Params: Params; Body: UpdateStockDto }>, reply: FastifyReply) => {
        const { id } = request.params;
        const data = UpdateStockDtoSchema.parse(request.body);
        const medicine = await medicineService.updateStock(id, data);
        return reply.send(medicine);
    },

    delete: async (request: FastifyRequest<{ Params: Params }>, reply: FastifyReply) => {
        const { id } = request.params;
        await medicineService.delete(id);
        return reply.send({ message: 'Medicine deleted successfully' });
    },
};
```

---

### 20d. `src/modules/medicines/application/medicine.service.ts`

```typescript
import { medicineRepository } from '../infrastructure/medicine.repository.js';
import { NotFoundError, ForbiddenError } from '../../../core/errors/AppError.js';
import { CreateMedicineDto, UpdateMedicineDto, UpdateStockDto, MedicineFilters, PaginatedResponse, Medicine } from '../../../types/index.js';

export const medicineService = {
    findAll: async (queryParams: MedicineFilters & { q?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Medicine>> => {
        const { q, laboratoryId, categoryId, stockStatus, page = 1, limit = 10 } = queryParams;
        const skip = (Number(page) - 1) * Number(limit);

        const filters: MedicineFilters = {};
        if (q) filters.search = q;
        if (laboratoryId) filters.laboratoryId = laboratoryId;
        if (categoryId) filters.categoryId = categoryId;
        if (stockStatus) filters.stockStatus = stockStatus;

        const medicines = await medicineRepository.findAllActive(filters, skip, Number(limit));
        const total = await medicineRepository.countActive(filters);
        const totalPages = Math.ceil(total / Number(limit));

        return {
            data: medicines,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages,
            },
        };
    },

    findById: async (id: string): Promise<Medicine | null> => {
        const medicine = await medicineRepository.findById(id);
        if (!medicine) {
            throw new NotFoundError('Medicine not found');
        }
        return medicine;
    },

    create: async (data: CreateMedicineDto): Promise<Medicine> => {
        return await medicineRepository.create({
            tradeName: data.tradeName,
            genericName: data.genericName,
            description: data.description,
            price: data.price,
            stock: data.stock || 0,
            expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
            laboratoryId: data.laboratoryId,
            categoryId: data.categoryId,
        });
    },

    update: async (id: string, data: UpdateMedicineDto & { stock?: number }): Promise<Medicine> => {
        const medicine = await medicineRepository.findById(id);
        if (!medicine) {
            throw new NotFoundError('Medicine not found');
        }

        if (data.stock !== undefined) {
            throw new ForbiddenError('Use PATCH /medicines/:id/stock to update stock');
        }

        return await medicineRepository.update(id, {
            tradeName: data.tradeName,
            genericName: data.genericName,
            description: data.description,
            price: data.price,
            expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
            laboratoryId: data.laboratoryId,
            categoryId: data.categoryId,
        });
    },

    updateStock: async (id: string, stockData: UpdateStockDto): Promise<Medicine> => {
        const medicine = await medicineRepository.findById(id);
        if (!medicine) {
            throw new NotFoundError('Medicine not found');
        }

        if (stockData.stock !== undefined) {
            if (stockData.stock < 0) {
                throw new ForbiddenError('Stock cannot be negative');
            }
            return await medicineRepository.updateStock(id, stockData.stock);
        }

        if (stockData.increment !== undefined) {
            return await medicineRepository.incrementStock(id, stockData.increment);
        }

        if (stockData.decrement !== undefined) {
            const newStock = medicine.stock - stockData.decrement;
            if (newStock < 0) {
                throw new ForbiddenError('Stock cannot be negative');
            }
            return await medicineRepository.decrementStock(id, stockData.decrement);
        }

        throw new ForbiddenError('No valid stock operation provided');
    },

    delete: async (id: string): Promise<Medicine> => {
        const medicine = await medicineRepository.findById(id);
        if (!medicine) {
            throw new NotFoundError('Medicine not found');
        }

        return await medicineRepository.softDelete(id);
    },
};
```

---

### 20e. `src/modules/medicines/domain/medicine.repository.interface.ts`

```typescript
import { Medicine, CreateMedicineDto, UpdateMedicineDto, UpdateStockDto, MedicineFilters } from '../../../types/index.js';

// IMedicineRepository interface
// This defines the contract for medicine data access

export interface IMedicineRepository {
    findById(id: string): Promise<Medicine | null>;
    findAllActive(filters: MedicineFilters, skip?: number, take?: number): Promise<Medicine[]>;
    countActive(filters: MedicineFilters): Promise<number>;
    create(data: CreateMedicineDto): Promise<Medicine>;
    update(id: string, data: UpdateMedicineDto): Promise<Medicine>;
    updateStock(id: string, stock: number): Promise<Medicine>;
    incrementStock(id: string, amount: number): Promise<Medicine>;
    decrementStock(id: string, amount: number): Promise<Medicine>;
    softDelete(id: string): Promise<Medicine>;
}

export const medicineRepositoryContract: IMedicineRepository = {
    findById: async (id: string) => { return null; },
    findAllActive: async (filters: MedicineFilters, skip = 0, take = 10) => { return []; },
    countActive: async (filters: MedicineFilters) => { return 0; },
    create: async (data: CreateMedicineDto) => { return {} as Medicine; },
    update: async (id: string, data: UpdateMedicineDto) => { return {} as Medicine; },
    updateStock: async (id: string, stock: number) => { return {} as Medicine; },
    incrementStock: async (id: string, amount: number) => { return {} as Medicine; },
    decrementStock: async (id: string, amount: number) => { return {} as Medicine; },
    softDelete: async (id: string) => { return {} as Medicine; },
};
```

---

### 20f. `src/modules/medicines/infrastructure/medicine.repository.ts`

```typescript
import { prisma } from '../../../config/prisma.js';
import { Medicine, MedicineFilters } from '../../../types/index.js';

// Helper to convert Prisma Decimal to number
const toNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value.toNumber === 'function') return value.toNumber();
    return Number(value);
};

interface CreateMedicineData {
    tradeName: string;
    genericName: string;
    description?: string | null;
    price: number;
    stock: number;
    expiryDate?: Date | null;
    laboratoryId: string;
    categoryId: string;
}

interface UpdateMedicineData {
    tradeName?: string;
    genericName?: string;
    description?: string | null;
    price?: number;
    expiryDate?: Date | undefined;
    laboratoryId?: string;
    categoryId?: string;
}

const mapPrismaToMedicine = (data: any): Medicine => ({
    id: data.id,
    tradeName: data.tradeName,
    genericName: data.genericName,
    description: data.description,
    price: toNumber(data.price),
    stock: data.stock,
    expiryDate: data.expiryDate,
    laboratoryId: data.laboratoryId,
    categoryId: data.categoryId,
    laboratory: data.laboratory ? {
        id: data.laboratory.id,
        name: data.laboratory.name,
        deletedAt: data.laboratory.deletedAt,
    } : undefined,
    category: data.category ? {
        id: data.category.id,
        name: data.category.name,
    } : undefined,
    deletedAt: data.deletedAt,
});

export const medicineRepository = {
    findById: async (id: string): Promise<Medicine | null> => {
        const data = await prisma.medicine.findFirst({
            where: { id, deletedAt: null },
            include: {
                laboratory: true,
                category: true,
            },
        });
        return data ? mapPrismaToMedicine(data) : null;
    },

    findAllActive: async (filters: MedicineFilters = {}, skip = 0, take = 10): Promise<Medicine[]> => {
        const where: any = { deletedAt: null };

        if (filters.search) {
            where.OR = [
                { tradeName: { contains: filters.search, mode: 'insensitive' } },
                { genericName: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        if (filters.laboratoryId) {
            where.laboratoryId = filters.laboratoryId;
        }

        if (filters.categoryId) {
            where.categoryId = filters.categoryId;
        }

        if (filters.stockStatus) {
            if (filters.stockStatus === 'low') {
                where.stock = { lt: 10 };
            } else if (filters.stockStatus === 'out') {
                where.stock = 0;
            } else if (filters.stockStatus === 'adequate') {
                where.stock = { gte: 10, lt: 50 };
            } else if (filters.stockStatus === 'well') {
                where.stock = { gte: 50 };
            }
        }

        const results = await prisma.medicine.findMany({
            where,
            skip,
            take,
            include: {
                laboratory: true,
                category: true,
            },
            orderBy: { tradeName: 'asc' },
        });
        return results.map(mapPrismaToMedicine);
    },

    countActive: async (filters: MedicineFilters = {}): Promise<number> => {
        const where: any = { deletedAt: null };

        if (filters.search) {
            where.OR = [
                { tradeName: { contains: filters.search, mode: 'insensitive' } },
                { genericName: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        if (filters.laboratoryId) {
            where.laboratoryId = filters.laboratoryId;
        }

        if (filters.categoryId) {
            where.categoryId = filters.categoryId;
        }

        if (filters.stockStatus) {
            if (filters.stockStatus === 'low') {
                where.stock = { lt: 10 };
            } else if (filters.stockStatus === 'out') {
                where.stock = 0;
            } else if (filters.stockStatus === 'adequate') {
                where.stock = { gte: 10, lt: 50 };
            } else if (filters.stockStatus === 'well') {
                where.stock = { gte: 50 };
            }
        }

        return await prisma.medicine.count({ where });
    },

    create: async (data: CreateMedicineData): Promise<Medicine> => {
        const result = await prisma.medicine.create({
            data: {
                tradeName: data.tradeName,
                genericName: data.genericName,
                description: data.description,
                price: data.price,
                stock: data.stock,
                expiryDate: data.expiryDate,
                laboratoryId: data.laboratoryId,
                categoryId: data.categoryId,
            },
            include: {
                laboratory: true,
                category: true,
            },
        });
        return mapPrismaToMedicine(result);
    },

    update: async (id: string, data: UpdateMedicineData): Promise<Medicine> => {
        const result = await prisma.medicine.update({
            where: { id },
            data: {
                tradeName: data.tradeName,
                genericName: data.genericName,
                description: data.description,
                price: data.price,
                expiryDate: data.expiryDate,
                laboratoryId: data.laboratoryId,
                categoryId: data.categoryId,
            },
            include: {
                laboratory: true,
                category: true,
            },
        });
        return mapPrismaToMedicine(result);
    },

    updateStock: async (id: string, stock: number): Promise<Medicine> => {
        const result = await prisma.medicine.update({
            where: { id },
            data: { stock },
            include: {
                laboratory: true,
                category: true,
            },
        });
        return mapPrismaToMedicine(result);
    },

    incrementStock: async (id: string, amount: number): Promise<Medicine> => {
        const result = await prisma.medicine.update({
            where: { id },
            data: { stock: { increment: amount } },
            include: {
                laboratory: true,
                category: true,
            },
        });
        return mapPrismaToMedicine(result);
    },

    decrementStock: async (id: string, amount: number): Promise<Medicine> => {
        const result = await prisma.medicine.update({
            where: { id },
            data: { stock: { decrement: amount } },
            include: {
                laboratory: true,
                category: true,
            },
        });
        return mapPrismaToMedicine(result);
    },

    softDelete: async (id: string): Promise<Medicine> => {
        const result = await prisma.medicine.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return mapPrismaToMedicine(result);
    },
};
```

**Detalles importantes:**
- `toNumber()` — Prisma devuelve `Decimal` como objeto. Este helper convierte a number nativo.
- `mapPrismaToMedicine()` — Mapea el objeto de Prisma al tipo `Medicine`.
- Las queries siempre filtran por `deletedAt: null` (soft delete).

---

## 21. Paso 18 — Módulo Sales

### 21a. `src/modules/sales/presentation/sale.routes.ts`

```typescript
import { saleController } from './sale.controller.js';
import { requireRoles } from '../../../presentation/middlewares/rbac.js';

const saleRoutes = async (fastify: any, _options: any) => {
    fastify.get('/', {
        preHandler: [fastify.authenticate, requireRoles(['admin', 'staff'])],
        handler: saleController.findAll,
    });

    fastify.get('/:id', {
        preHandler: [fastify.authenticate, requireRoles(['admin', 'staff'])],
        handler: saleController.findById,
    });

    fastify.post('/', {
        preHandler: [fastify.authenticate, requireRoles(['admin', 'staff'])],
        handler: saleController.register,
    });
};
```

---

### 21b. `src/modules/sales/presentation/sale.dto.ts`

```typescript
import { z } from 'zod';

const SaleItemDtoSchema = z.object({
    medicineId: z.string().min(1, 'Medicine ID is required'),
    quantity: z.number().int().positive('Quantity must be positive'),
    unitPrice: z.number().positive('Unit price must be positive'),
});

const CreateSaleDtoSchema = z.object({
    clientId: z.string().optional(),
    items: z.array(SaleItemDtoSchema).min(1, 'At least one item is required'),
    paymentMethod: z.string().min(1, 'Payment method is required'),
    total: z.number().positive('Total must be positive'),
});

export { CreateSaleDtoSchema, SaleItemDtoSchema };
```

---

### 21c. `src/modules/sales/presentation/sale.controller.ts`

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateSaleDtoSchema } from './sale.dto.js';
import { saleService } from '../application/sale.service.js';
import { PaymentMethod } from '../../../types/index.js';

const saleController = {
    findAll: async (request: FastifyRequest, reply: FastifyReply) => {
        const result = await saleService.findAll(request.query as any);
        return reply.send(result);
    },

    findById: async (request: FastifyRequest, reply: FastifyReply) => {
        const params = request.params as { id: string };
        const { id } = params;
        const sale = await saleService.findById(id);
        return reply.send(sale);
    },

    register: async (request: FastifyRequest, reply: FastifyReply) => {
        const data = CreateSaleDtoSchema.parse(request.body);
        const userId = (request as any).user?.sub;
        const sale = await saleService.register({
            ...data,
            paymentMethod: data.paymentMethod as PaymentMethod,
        }, userId);
        return reply.status(201).send(sale);
    },
};

export { saleController };
```

---

### 21d. `src/modules/sales/application/sale.service.ts`

```typescript
import { prisma } from '../../../config/prisma.js';
import { medicineRepository } from '../../medicines/infrastructure/medicine.repository.js';
import { saleRepository } from '../infrastructure/sale.repository.js';
import { NotFoundError, ForbiddenError } from '../../../core/errors/AppError.js';
import { CreateSaleDto, SaleFilters, PaginatedResponse, Sale } from '../../../types/index.js';

export const saleService = {
    register: async (data: CreateSaleDto, userId: string | undefined) => {
        const { clientId, items } = data;

        // Calculate total
        const total = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

        // Verify medicines exist and have sufficient stock
        const medicineIds = items.map(item => item.medicineId);
        const medicines = await prisma.medicine.findMany({
            where: {
                id: { in: medicineIds },
                deletedAt: null,
            },
        });

        if (medicines.length !== medicineIds.length) {
            const foundIds = medicines.map(m => m.id);
            const missingIds = medicineIds.filter(id => !foundIds.includes(id));
            throw new NotFoundError(`Medicine not found: ${missingIds.join(', ')}`);
        }

        // Check stock availability
        for (const item of items) {
            const medicine = medicines.find(m => m.id === item.medicineId);
            if (medicine && medicine.stock < item.quantity) {
                throw new ForbiddenError(
                    `Insufficient stock for medicine: ${medicine.tradeName} (available: ${medicine.stock}, requested: ${item.quantity})`
                );
            }
        }

        // Use transaction for atomicity
        const sale = await prisma.$transaction(async (tx) => {
            // Create sale
            const newSale = await tx.sale.create({
                data: {
                    total,
                    paymentMethod: data.paymentMethod,
                    userId: userId!,
                    clientId,
                    items: {
                        create: items.map(item => ({
                            medicineId: item.medicineId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                        })),
                    },
                },
                include: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                    client: true,
                    items: {
                        include: {
                            medicine: {
                                select: { id: true, tradeName: true, genericName: true },
                            },
                        },
                    },
                },
            });

            // Update medicine stock
            for (const item of items) {
                await tx.medicine.update({
                    where: { id: item.medicineId },
                    data: { stock: { decrement: item.quantity } },
                });
            }

            return newSale;
        });

        return sale;
    },

    findAll: async (queryParams: SaleFilters & { page?: number; limit?: number; paymentMethod?: string }): Promise<PaginatedResponse<Sale>> => {
        const { startDate, endDate, clientId, userId, paymentMethod, page = 1, limit = 10 } = queryParams;
        const skip = (Number(page) - 1) * Number(limit);

        const filters: SaleFilters & { paymentMethod?: string } = {};
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;
        if (clientId) filters.clientId = clientId;
        if (userId) filters.userId = userId;
        if (paymentMethod) filters.paymentMethod = paymentMethod;

        const sales = await saleRepository.findAll(filters, skip, Number(limit));
        const total = await saleRepository.count(filters);
        const totalPages = Math.ceil(total / Number(limit));

        return {
            data: sales,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages,
            },
        };
    },

    findById: async (id: string): Promise<Sale | null> => {
        const sale = await saleRepository.findById(id);
        if (!sale) {
            throw new NotFoundError('Sale not found');
        }
        return sale;
    },
};
```

**Lógica clave de `register`:**
1. Calcula el total sumando `unitPrice * quantity` de cada item.
2. Verifica que TODAS las medicinas existan y no estén borradas.
3. Verifica que haya stock suficiente de cada medicina.
4. Usa **`prisma.$transaction`** para que todo sea atómico.
5. Dentro de la transacción: crea la venta con sus items y actualiza el stock.

---

### 21e. `src/modules/sales/domain/sale.repository.interface.ts`

```typescript
import { Sale, SaleFilters, CreateSaleItemDto } from '../../../types/index.js';

// ISaleRepository interface
// This defines the contract for sale data access

export interface ISaleRepository {
    findById(id: string): Promise<Sale | null>;
    findAll(filters: SaleFilters & { paymentMethod?: string }, skip?: number, take?: number): Promise<Sale[]>;
    count(filters: SaleFilters & { paymentMethod?: string }): Promise<number>;
    create(data: { total: number; paymentMethod: string; userId?: string; clientId?: string }): Promise<Sale>;
    createItems(items: CreateSaleItemDto[]): Promise<any>;
    updateMedicinesStock(updates: Array<{ id: string; decrement: number }>): Promise<any[]>;
}

export const saleRepositoryContract: ISaleRepository = {
    findById: async (id: string) => { return null; },
    findAll: async (filters: SaleFilters & { paymentMethod?: string }, skip = 0, take = 10) => { return []; },
    count: async (filters: SaleFilters & { paymentMethod?: string }) => { return 0; },
    create: async (data) => { return {} as Sale; },
    createItems: async (items: CreateSaleItemDto[]) => { return {}; },
    updateMedicinesStock: async (updates: Array<{ id: string; decrement: number }>) => { return []; },
};
```

---

### 21f. `src/modules/sales/infrastructure/sale.repository.ts`

```typescript
import { prisma } from '../../../config/prisma.js';
import { Sale, SaleFilters, SaleItem } from '../../../types/index.js';

// Helper to convert Prisma Decimal to number
const toNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value.toNumber === 'function') return value.toNumber();
    return Number(value);
};

interface CreateSaleData {
    total: number;
    paymentMethod: string;
    userId: string;
    clientId?: string | null;
    items?: any[];
}

interface StockUpdate {
    id: string;
    decrement: number;
}

const mapPrismaToSale = (data: any): Sale => ({
    id: data.id,
    date: data.date,
    total: toNumber(data.total),
    paymentMethod: data.paymentMethod,
    userId: data.userId,
    clientId: data.clientId,
    items: data.items ? data.items.map((item: any) => ({
        id: item.id,
        saleId: item.saleId,
        medicineId: item.medicineId,
        quantity: item.quantity,
        unitPrice: toNumber(item.unitPrice),
    })) : undefined,
});

export const saleRepository = {
    findById: async (id: string): Promise<Sale | null> => {
        const data = await prisma.sale.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, name: true, email: true, role: true },
                },
                client: true,
                items: {
                    include: {
                        medicine: {
                            select: { id: true, tradeName: true, genericName: true },
                        },
                    },
                },
            },
        });
        return data ? mapPrismaToSale(data) : null;
    },

    findAll: async (filters: SaleFilters & { paymentMethod?: string } = {}, skip = 0, take = 10): Promise<Sale[]> => {
        const where: any = {};

        if (filters.startDate) {
            where.date = { gte: new Date(filters.startDate) };
        }
        if (filters.endDate) {
            where.date = { ...where.date, lte: new Date(filters.endDate) };
        }
        if (filters.clientId) {
            where.clientId = filters.clientId;
        }
        if (filters.paymentMethod) {
            where.paymentMethod = filters.paymentMethod;
        }
        if (filters.userId) {
            where.userId = filters.userId;
        }

        const results = await prisma.sale.findMany({
            where,
            skip,
            take,
            include: {
                user: {
                    select: { id: true, name: true },
                },
                client: {
                    select: { id: true, name: true },
                },
                items: {
                    include: {
                        medicine: {
                            select: { id: true, tradeName: true },
                        },
                    },
                },
            },
            orderBy: { date: 'desc' },
        });
        return results.map(mapPrismaToSale);
    },

    count: async (filters: SaleFilters & { paymentMethod?: string } = {}): Promise<number> => {
        const where: any = {};

        if (filters.startDate) {
            where.date = { gte: new Date(filters.startDate) };
        }
        if (filters.endDate) {
            where.date = { ...where.date, lte: new Date(filters.endDate) };
        }
        if (filters.clientId) {
            where.clientId = filters.clientId;
        }
        if (filters.paymentMethod) {
            where.paymentMethod = filters.paymentMethod;
        }
        if (filters.userId) {
            where.userId = filters.userId;
        }

        return await prisma.sale.count({ where });
    },

    create: async (data: CreateSaleData): Promise<Sale> => {
        const result = await prisma.sale.create({
            data: {
                total: data.total,
                paymentMethod: data.paymentMethod,
                userId: data.userId,
                clientId: data.clientId,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
                client: true,
                items: {
                    include: {
                        medicine: true,
                    },
                },
            },
        });
        return mapPrismaToSale(result);
    },

    createItems: async (items: Array<{ saleId: string; medicineId: string; quantity: number; unitPrice: number }>): Promise<any> => {
        return await prisma.saleItem.createMany({
            data: items,
        });
    },

    updateMedicinesStock: async (updates: StockUpdate[]): Promise<any[]> => {
        const promises = updates.map(({ id, decrement }) =>
            prisma.medicine.update({
                where: { id },
                data: { stock: { decrement } },
            })
        );
        return await Promise.all(promises);
    },
};
```

---

## 22. Paso 19 — Módulo Clients

### 22a. `src/modules/clients/presentation/client.routes.ts`

```typescript
import { clientController } from './client.controller.js';
import { requireRoles } from '../../../presentation/middlewares/rbac.js';

const clientRoutes = async (fastify: any, _options: any) => {
    fastify.get('/', {
        preHandler: [fastify.authenticate],
        handler: clientController.findAll,
    });

    fastify.get('/:id', {
        preHandler: [fastify.authenticate],
        handler: clientController.findById,
    });

    fastify.post('/', {
        preHandler: [fastify.authenticate, requireRoles(['admin', 'staff'])],
        handler: clientController.create,
    });

    fastify.put('/:id', {
        preHandler: [fastify.authenticate, requireRoles(['admin', 'staff'])],
        handler: clientController.update,
    });

    fastify.delete('/:id', {
        preHandler: [fastify.authenticate, requireRoles(['admin'])],
        handler: clientController.delete,
    });
};

export default clientRoutes;
```

**Nota:** El listado y detalle de clientes puede verlo cualquier usuario autenticado. Crear/editar requiere admin o staff. Eliminar solo admin.

---

### 22b. `src/modules/clients/presentation/client.dto.ts`

```typescript
import { z } from 'zod';

export const CreateClientDtoSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    documentNumber: z.string().min(5, 'Document number must be at least 5 characters'),
    email: z.string().email('Invalid email format').optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    membership: z.enum(['bronze', 'silver', 'gold']).optional(),
});

export const UpdateClientDtoSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email format').optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    membership: z.enum(['bronze', 'silver', 'gold']).optional(),
});
```

---

### 22c. `src/modules/clients/presentation/client.controller.ts`

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateClientDtoSchema, UpdateClientDtoSchema } from './client.dto.js';
import { clientService } from '../application/client.service.js';

export const clientController = {
    findAll: async (request: FastifyRequest, reply: FastifyReply) => {
        const result = await clientService.findAll(request.query as any);
        return reply.send(result);
    },

    findById: async (request: FastifyRequest, reply: FastifyReply) => {
        const params = request.params as { id: string };
        const { id } = params;
        const client = await clientService.findById(id);
        return reply.send(client);
    },

    create: async (request: FastifyRequest, reply: FastifyReply) => {
        const data = CreateClientDtoSchema.parse(request.body);
        const client = await clientService.create(data);
        return reply.status(201).send(client);
    },

    update: async (request: FastifyRequest, reply: FastifyReply) => {
        const params = request.params as { id: string };
        const { id } = params;
        const data = UpdateClientDtoSchema.parse(request.body);
        const client = await clientService.update(id, data);
        return reply.send(client);
    },

    delete: async (request: FastifyRequest, reply: FastifyReply) => {
        const params = request.params as { id: string };
        const { id } = params;
        await clientService.delete(id);
        return reply.send({ message: 'Client deleted successfully' });
    },
};
```

---

### 22d. `src/modules/clients/application/client.service.ts`

```typescript
import { clientRepository } from '../infrastructure/client.repository.js';
import { ConflictError, NotFoundError, ForbiddenError } from '../../../core/errors/AppError.js';
import { CreateClientDto, UpdateClientDto, ClientFilters, PaginatedResponse, Client } from '../../../types/index.js';

interface PurchaseHistory {
    totalPurchases: number;
    totalSpent: number;
    lastPurchase: Date | null;
    sales: Array<{
        id: string;
        date: Date;
        total: number;
        itemsCount: number;
    }>;
}

interface ClientWithHistory extends Client {
    totalPurchases: number;
    totalSpent: number;
    lastPurchase: Date | null;
    sales: Array<{
        id: string;
        date: Date;
        total: number;
        itemsCount: number;
    }>;
}

export const clientService = {
    findAll: async (queryParams: ClientFilters & { page?: number; limit?: number; q?: string }): Promise<PaginatedResponse<Client>> => {
        const { q, membership, page = 1, limit = 10 } = queryParams;
        const skip = (Number(page) - 1) * Number(limit);

        const filters: ClientFilters = {};
        if (q) filters.search = q;
        if (membership) filters.membership = membership;

        const clients = await clientRepository.findAllActive(filters, skip, Number(limit));
        const total = await clientRepository.countActive(filters);
        const totalPages = Math.ceil(total / Number(limit));

        return {
            data: clients,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages,
            },
        };
    },

    findById: async (id: string): Promise<ClientWithHistory> => {
        const client = await clientRepository.findById(id);
        if (!client) {
            throw new NotFoundError('Client not found');
        }

        const purchaseHistory = await clientRepository.getPurchaseHistory(id);

        return {
            ...client,
            ...purchaseHistory,
        };
    },

    create: async (data: CreateClientDto): Promise<Client> => {
        const existingClient = await clientRepository.findByDocumentNumber(data.documentNumber);
        if (existingClient && !existingClient.deletedAt) {
            throw new ConflictError('Document number already registered');
        }

        return await clientRepository.create({
            name: data.name,
            documentNumber: data.documentNumber,
            email: data.email,
            phone: data.phone,
            address: data.address,
            membership: data.membership || 'bronze',
        });
    },

    update: async (id: string, data: UpdateClientDto): Promise<Client> => {
        const client = await clientRepository.findById(id);
        if (!client) {
            throw new NotFoundError('Client not found');
        }

        if (data.documentNumber) {
            throw new ForbiddenError('Document number cannot be changed');
        }

        if (data.email) {
            const existingClient = await clientRepository.findByEmail(data.email);
            if (existingClient && existingClient.id !== id) {
                throw new ConflictError('Email already in use');
            }
        }

        return await clientRepository.update(id, {
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            membership: data.membership,
        });
    },

    delete: async (id: string): Promise<void> => {
        const client = await clientRepository.findById(id);
        if (!client) {
            throw new NotFoundError('Client not found');
        }

        await clientRepository.softDelete(id);
    },
};
```

---

### 22e. `src/modules/clients/domain/client.repository.interface.ts`

```typescript
import { Client, CreateClientDto, UpdateClientDto, ClientFilters } from '../../../types/index.js';

// IClientRepository interface
// This defines the contract for client data access

export interface IClientRepository {
    findById(id: string): Promise<Client | null>;
    findByDocumentNumber(documentNumber: string): Promise<Client | null>;
    findByEmail(email: string): Promise<Client | null>;
    findAllActive(filters: ClientFilters, skip?: number, take?: number): Promise<Client[]>;
    countActive(filters: ClientFilters): Promise<number>;
    create(data: CreateClientDto): Promise<Client>;
    update(id: string, data: Partial<UpdateClientDto>): Promise<Client>;
    softDelete(id: string): Promise<Client>;
    getPurchaseHistory(id: string): Promise<{
        totalPurchases: number;
        totalSpent: number;
        lastPurchase: Date | null;
        sales: Array<{ id: string; date: Date; total: number; itemsCount: number }>;
    }>;
}

export const clientRepositoryContract: IClientRepository = {
    findById: async (id: string) => { return null; },
    findByDocumentNumber: async (documentNumber: string) => { return null; },
    findByEmail: async (email: string) => { return null; },
    findAllActive: async (filters: ClientFilters, skip = 0, take = 10) => { return []; },
    countActive: async (filters: ClientFilters) => { return 0; },
    create: async (data: CreateClientDto) => { return {} as Client; },
    update: async (id: string, data: Partial<UpdateClientDto>) => { return {} as Client; },
    softDelete: async (id: string) => { return {} as Client; },
    getPurchaseHistory: async (id: string) => {
        return {
            totalPurchases: 0,
            totalSpent: 0,
            lastPurchase: null,
            sales: [],
        };
    },
};
```

---

### 22f. `src/modules/clients/infrastructure/client.repository.ts`

```typescript
import { prisma } from '../../../config/prisma.js';
import { Client, ClientFilters } from '../../../types/index.js';

interface CreateClientData {
    name: string;
    documentNumber: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    membership?: string;
}

interface UpdateClientData {
    name?: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    membership?: string;
}

interface PurchaseHistory {
    totalPurchases: number;
    totalSpent: number;
    lastPurchase: Date | null;
    sales: Array<{
        id: string;
        date: Date;
        total: number;
        itemsCount: number;
    }>;
}

export const clientRepository = {
    findById: async (id: string): Promise<Client | null> => {
        return await prisma.client.findFirst({
            where: { id, deletedAt: null },
        });
    },

    findByDocumentNumber: async (documentNumber: string): Promise<Client | null> => {
        return await prisma.client.findFirst({
            where: { documentNumber },
        });
    },

    findByEmail: async (email: string): Promise<Client | null> => {
        if (!email) return null;
        return await prisma.client.findFirst({
            where: { email, deletedAt: null },
        });
    },

    findAllActive: async (filters: ClientFilters = {}, skip = 0, take = 10): Promise<Client[]> => {
        const where: any = { deletedAt: null };

        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { documentNumber: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        if (filters.membership) {
            where.membership = filters.membership;
        }

        return await prisma.client.findMany({
            where,
            skip,
            take,
            orderBy: { name: 'asc' },
        });
    },

    countActive: async (filters: ClientFilters = {}): Promise<number> => {
        const where: any = { deletedAt: null };

        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { documentNumber: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        if (filters.membership) {
            where.membership = filters.membership;
        }

        return await prisma.client.count({ where });
    },

    create: async (data: CreateClientData): Promise<Client> => {
        return await prisma.client.create({
            data,
        });
    },

    update: async (id: string, data: UpdateClientData): Promise<Client> => {
        return await prisma.client.update({
            where: { id },
            data,
        });
    },

    softDelete: async (id: string): Promise<Client> => {
        return await prisma.client.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    },

    getPurchaseHistory: async (id: string): Promise<PurchaseHistory> => {
        const sales = await prisma.sale.findMany({
            where: { clientId: id },
            include: {
                items: {
                    include: {
                        medicine: {
                            select: { tradeName: true },
                        },
                    },
                },
            },
            orderBy: { date: 'desc' },
        });

        const totalSpent = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
        const lastPurchase = sales.length > 0 ? sales[0].date : null;

        return {
            totalPurchases: sales.length,
            totalSpent,
            lastPurchase,
            sales: sales.map(sale => ({
                id: sale.id,
                date: sale.date,
                total: Number(sale.total),
                itemsCount: sale.items.length,
            })),
        };
    },
};
```

---

## 23. Paso 20 — Módulo Reports

### 23a. `src/modules/reports/presentation/report.routes.ts`

```typescript
import { reportController } from './report.controller.js';
import { requireRoles } from '../../../presentation/middlewares/rbac.js';

const reportRoutes = async (fastify: any, _options: any) => {
    fastify.get('/sales', {
        preHandler: [fastify.authenticate, requireRoles(['admin', 'staff'])],
        handler: reportController.salesReport,
    });

    fastify.get('/top-medicines', {
        preHandler: [fastify.authenticate, requireRoles(['admin', 'staff'])],
        handler: reportController.topMedicines,
    });

    fastify.get('/dashboard', {
        preHandler: [fastify.authenticate, requireRoles(['admin', 'staff'])],
        handler: reportController.dashboard,
    });

    fastify.get('/stock-status', {
        preHandler: [fastify.authenticate, requireRoles(['admin', 'staff'])],
        handler: reportController.stockStatus,
    });
};

export default reportRoutes;
```

---

### 23b. `src/modules/reports/presentation/report.controller.ts`

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../../config/prisma.js';
import { ForbiddenError } from '../../../core/errors/AppError.js';

const reportController = {
    salesReport: async (request: FastifyRequest, reply: FastifyReply) => {
        const query = request.query as { startDate?: string; endDate?: string };
        const { startDate, endDate } = query;

        if (!startDate || !endDate) {
            throw new ForbiddenError('startDate and endDate are required');
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        if (start > end) {
            throw new ForbiddenError('Invalid date range: end date must be after start date');
        }

        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff > 90) {
            throw new ForbiddenError('Date range cannot exceed 90 days');
        }

        const sales = await prisma.sale.findMany({
            where: {
                date: {
                    gte: start,
                    lte: end,
                },
            },
            include: {
                items: true,
            },
        });

        const totalSales = sales.length;
        const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
        const avgSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

        const byPaymentMethod: Record<string, number> = {};
        sales.forEach(sale => {
            byPaymentMethod[sale.paymentMethod] = (byPaymentMethod[sale.paymentMethod] || 0) + 1;
        });

        const dailyBreakdown: Record<string, { sales: number; revenue: number }> = {};
        sales.forEach(sale => {
            const date = sale.date.toISOString().split('T')[0];
            if (!dailyBreakdown[date]) {
                dailyBreakdown[date] = { sales: 0, revenue: 0 };
            }
            dailyBreakdown[date].sales++;
            dailyBreakdown[date].revenue += Number(sale.total);
        });

        return reply.send({
            totalSales,
            totalRevenue,
            avgSaleValue,
            byPaymentMethod,
            dailyBreakdown: Object.entries(dailyBreakdown).map(([date, data]) => ({
                date,
                ...data,
            })),
        });
    },

    topMedicines: async (request: FastifyRequest, reply: FastifyReply) => {
        const query = request.query as { startDate?: string; endDate?: string; limit?: number };
        const { startDate, endDate, limit = 10 } = query;

        if (!startDate || !endDate) {
            throw new ForbiddenError('startDate and endDate are required');
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const limitNum = Math.min(Number(limit), 50);

        const saleItems = await prisma.saleItem.findMany({
            where: {
                sale: {
                    date: {
                        gte: start,
                        lte: end,
                    },
                },
            },
            include: {
                medicine: {
                    select: { id: true, tradeName: true, genericName: true },
                },
            },
        });

        interface MedicineStat {
            medicine: { id: string; tradeName: string; genericName: string };
            totalSold: number;
            revenue: number;
            transactions: Set<string>;
        }

        const medicineStats: Record<string, MedicineStat> = {};
        saleItems.forEach(item => {
            const medId = item.medicineId;
            if (!medicineStats[medId]) {
                medicineStats[medId] = {
                    medicine: item.medicine,
                    totalSold: 0,
                    revenue: 0,
                    transactions: new Set(),
                };
            }
            medicineStats[medId].totalSold += item.quantity;
            medicineStats[medId].revenue += Number(item.unitPrice) * item.quantity;
            medicineStats[medId].transactions.add(item.saleId);
        });

        const sortedMedicines = Object.values(medicineStats)
            .sort((a, b) => b.totalSold - a.totalSold)
            .slice(0, limitNum)
            .map(stat => ({
                medicine: stat.medicine,
                totalSold: stat.totalSold,
                revenue: stat.revenue,
                transactions: stat.transactions.size,
            }));

        return reply.send(sortedMedicines);
    },

    dashboard: async (_request: FastifyRequest, reply: FastifyReply) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const [
            totalMedicines,
            lowStockCount,
            totalClients,
            salesToday,
            salesThisMonth,
            revenueThisMonth
        ] = await Promise.all([
            prisma.medicine.count({ where: { deletedAt: null } }),
            prisma.medicine.count({ where: { deletedAt: null, stock: { lt: 10 } } }),
            prisma.client.count({ where: { deletedAt: null } }),
            prisma.sale.count({ where: { date: { gte: today } } }),
            prisma.sale.count({ where: { date: { gte: firstDayOfMonth } } }),
            prisma.sale.aggregate({
                where: { date: { gte: firstDayOfMonth } },
                _sum: { total: true },
            }),
        ]);

        return reply.send({
            totalMedicines,
            lowStockCount,
            totalClients,
            salesToday,
            salesThisMonth,
            revenueThisMonth: revenueThisMonth._sum.total || 0,
        });
    },

    stockStatus: async (request: FastifyRequest, reply: FastifyReply) => {
        const query = request.query as { categoryId?: string };
        const { categoryId } = query;

        const where: any = { deletedAt: null };
        if (categoryId) where.categoryId = categoryId;

        const medicines = await prisma.medicine.findMany({
            where,
            select: { id: true, tradeName: true, stock: true, categoryId: true },
        });

        const outOfStock = medicines.filter(m => m.stock === 0);
        const lowStock = medicines.filter(m => m.stock > 0 && m.stock < 10);
        const adequateStock = medicines.filter(m => m.stock >= 10 && m.stock < 50);
        const wellStocked = medicines.filter(m => m.stock >= 50);

        return reply.send({
            outOfStock: { count: outOfStock.length, items: outOfStock },
            lowStock: { count: lowStock.length, items: lowStock },
            adequateStock: { count: adequateStock.length, items: adequateStock },
            wellStocked: { count: wellStocked.length, items: wellStocked },
        });
    },
};

export { reportController };
```

---

## 24. Paso 21 — Seed Script

Creá `src/scripts/seed.ts`:

```typescript
import { prisma } from "@/config/prisma.js";
import bcrypt from "bcrypt"

const SALT_ROUNDS = 10;

const seed = async () => {
  console.log('🌱 Starting seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', SALT_ROUNDS);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@farmacia.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@farmacia.com',
      password: adminPassword,
      role: 'admin',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create staff user
  const staffPassword = await bcrypt.hash('Staff123!', SALT_ROUNDS);
  const staff = await prisma.user.upsert({
    where: { email: 'staff@farmacia.com' },
    update: {},
    create: {
      name: 'Staff User',
      email: 'staff@farmacia.com',
      password: staffPassword,
      role: 'staff',
    },
  });
  console.log('✅ Staff user created:', staff.email);

  // Create sample lab
  const lab = await prisma.lab.upsert({
    where: { id: 'lab-farma' },
    update: {},
    create: {
      id: 'lab-farma',
      name: 'Lab Farma',
    },
  });
  console.log('✅ Lab created:', lab.name);

  // Create sample category
  const category = await prisma.category.upsert({
    where: { id: 'cat-analgesics' },
    update: {},
    create: {
      id: 'cat-analgesics',
      name: 'Analgesics',
    },
  });
  console.log('✅ Category created:', category.name);

  // Create sample medicines
  const medicines = [
    {
      tradeName: 'Ibuprofeno 400mg',
      genericName: 'Ibuprofeno',
      description: 'Anti-inflammatory drug',
      price: 12.50,
      stock: 100,
      laboratoryId: lab.id,
      categoryId: category.id,
    },
    {
      tradeName: 'Paracetamol 500mg',
      genericName: 'Paracetamol',
      description: 'Pain reliever and fever reducer',
      price: 8.00,
      stock: 150,
      laboratoryId: lab.id,
      categoryId: category.id,
    },
  ];

  for (const med of medicines) {
    const medId = med.tradeName.toLowerCase().replace(/\s+/g, '-').replace(/[0-9]+/g, '');
    const medicine = await prisma.medicine.upsert({
      where: { id: medId },
      update: {},
      create: {
        id: medId,
        ...med,
      },
    });
    console.log('✅ Medicine created:', medicine.tradeName);
  }

  // Create sample client
  const client = await prisma.client.upsert({
    where: { documentNumber: '12345678' },
    update: {},
    create: {
      name: 'Juan Pérez',
      documentNumber: '12345678',
      email: 'juan@email.com',
      phone: '555-1234',
      membership: 'silver',
    },
  });
  console.log('✅ Client created:', client.name);

  console.log('🎉 Seed completed!');
};

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**¿Qué hace?**
- Crea un usuario admin con email `admin@farmacia.com` y password `Admin123!`.
- Crea un usuario staff.
- Crea un laboratorio (Lab Farma) y una categoría (Analgesics).
- Crea dos medicamentos de ejemplo.
- Crea un cliente de ejemplo.
- Usa `upsert`, así que si se ejecuta varias veces no duplica datos.

**Para ejecutar:**
```bash
npx tsx src/scripts/seed.ts
```

---

## 25. Paso 22 — API Reference

```
### FARMACIA API ENDPOINTS ###

@baseUrl = http://localhost:3000

### AUTH ENDPOINTS ###

# Registrarse (Solo admin puede crear usuarios)
POST {{baseUrl}}/api/auth/register
Content-Type: application/json

{
    "name": "Admin User",
    "email": "admin@farmacia.com",
    "password": "admin123",
    "role": "admin"
}

###

# Iniciar sesión
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
    "email": "admin@farmacia.com",
    "password": "admin123"
}

###

# Refrescar token
POST {{baseUrl}}/api/auth/refresh
Content-Type: application/json

{
    "refreshToken": "tu-refresh-token-aquí"
}

###

# Cerrar sesión (requiere Auth)
POST {{baseUrl}}/api/auth/logout
Content-Type: application/json
Authorization: Bearer {{accessToken}}

###

### USERS ENDPOINTS (Solo Admin) ###

# Obtener todos los usuarios (paginado)
GET {{baseUrl}}/api/users?page=1&limit=10
Content-Type: application/json
Authorization: Bearer {{accessToken}}

###

# Obtener usuario por ID
GET {{baseUrl}}/api/users/<user-id>
Content-Type: application/json
Authorization: Bearer {{accessToken}}

###

# Crear nuevo usuario
POST {{baseUrl}}/api/users
Content-Type: application/json
Authorization: Bearer {{accessToken}}

{
    "name": "Nuevo Staff",
    "email": "staff2@farmacia.com",
    "password": "staff123",
    "role": "staff"
}

###

# Actualizar usuario
PUT {{baseUrl}}/api/users/<user-id>
Content-Type: application/json
Authorization: Bearer {{accessToken}}

{
    "name": "Staff Actualizado",
    "email": "staff_actualizado@farmacia.com"
}

###

# Eliminar usuario (Soft Delete)
DELETE {{baseUrl}}/api/users/<user-id>
Content-Type: application/json
Authorization: Bearer {{accessToken}}

###

### MEDICINES ENDPOINTS (Admin y Staff) ###

# Obtener todos los medicamentos
GET {{baseUrl}}/api/medicines?search=paracetamol
Content-Type: application/json
Authorization: Bearer {{accessToken}}

###

# Obtener medicamento por ID
GET {{baseUrl}}/api/medicines/<medicine-id>
Content-Type: application/json
Authorization: Bearer {{accessToken}}

###

# Crear medicamento
POST {{baseUrl}}/api/medicines
Content-Type: application/json
Authorization: Bearer {{accessToken}}

{
    "tradeName": "Paracetamol 500mg",
    "genericName": "Acetaminofén",
    "description": "Analgésico y antipirético",
    "price": 5.50,
    "stock": 100,
    "laboratoryId": "<lab-id>",
    "categoryId": "<category-id>"
}

###

# Actualizar medicamento
PUT {{baseUrl}}/api/medicines/<medicine-id>
Content-Type: application/json
Authorization: Bearer {{accessToken}}

{
    "price": 6.00,
    "stock": 150
}

###

# Actualizar stock específico
PATCH {{baseUrl}}/api/medicines/<medicine-id>/stock
Content-Type: application/json
Authorization: Bearer {{accessToken}}

{
    "stock": 50
}

###

# Eliminar medicamento (Soft Delete)
DELETE {{baseUrl}}/api/medicines/<medicine-id>
Content-Type: application/json
Authorization: Bearer {{accessToken}}

###

### SALES ENDPOINTS (Admin y Staff) ###

# Registrar una venta
POST {{baseUrl}}/api/sales
Content-Type: application/json
Authorization: Bearer {{accessToken}}

{
    "clientId": "<client-id>",
    "paymentMethod": "cash",
    "items": [
        {
            "medicineId": "<medicine-id>",
            "quantity": 2,
            "unitPrice": 5.50
        }
    ]
}

###

# Obtener historial de ventas
GET {{baseUrl}}/api/sales?startDate=2026-05-01&endDate=2026-05-31
Content-Type: application/json
Authorization: Bearer {{accessToken}}

###

### CLIENTS ENDPOINTS (Admin y Staff) ###

# Obtener clientes
GET {{baseUrl}}/api/clients
Content-Type: application/json
Authorization: Bearer {{accessToken}}

###

# Crear cliente
POST {{baseUrl}}/api/clients
Content-Type: application/json
Authorization: Bearer {{accessToken}}

{
    "name": "Juan Pérez",
    "documentNumber": "12345678",
    "email": "juan@email.com",
    "phone": "123456789"
}

###

### REPORTS ENDPOINTS (Admin y Staff) ###

# Reporte de ventas por fecha
GET {{baseUrl}}/api/reports/sales?startDate=2026-05-01&endDate=2026-05-31
Content-Type: application/json
Authorization: Bearer {{accessToken}}

###

# Top medicamentos más vendidos
GET {{baseUrl}}/api/reports/top-medicines?startDate=2026-05-01&endDate=2026-05-31&limit=10
Content-Type: application/json
Authorization: Bearer {{accessToken}}

###
```

---

## 26. Paso 23 — Scripts del package.json

```bash
# Desarrollo (auto-reload)
npm run dev

# Compilar para producción
npm run build

# Iniciar servidor compilado
npm start

# Generar cliente de Prisma (después de cambios en schema)
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Abrir Prisma Studio (GUI para la DB)
npm run prisma:studio
```

---

## 27. Resumen de Endpoints

Todos los endpoints están bajo `/api/v1`.

### Auth
| Método | Endpoint | Público | Descripción |
|--------|----------|---------|-------------|
| POST | /auth/register | ✅ | Registra usuario |
| POST | /auth/login | ✅ | Inicia sesión |
| POST | /auth/refresh | ✅ | Refresca token |
| POST | /auth/logout | 🔒 | Cierra sesión |

### Users (solo Admin)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /users | Lista paginada |
| GET | /users/:id | Detalle |
| POST | /users | Crear |
| PUT | /users/:id | Actualizar |
| DELETE | /users/:id | Soft delete |

### Medicines (Admin + Staff)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /medicines | Lista con filtros |
| GET | /medicines/:id | Detalle |
| POST | /medicines | Crear |
| PUT | /medicines/:id | Actualizar |
| PATCH | /medicines/:id/stock | Actualizar stock |
| DELETE | /medicines/:id | Soft delete (solo admin) |

### Sales (Admin + Staff)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /sales | Historial con filtros |
| GET | /sales/:id | Detalle |
| POST | /sales | Registrar venta |

### Clients (Admin + Staff)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /clients | Lista paginada |
| GET | /clients/:id | Detalle + historial |
| POST | /clients | Crear |
| PUT | /clients/:id | Actualizar |
| DELETE | /clients/:id | Soft delete (solo admin) |

### Reports (Admin + Staff)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /reports/sales | Reporte de ventas por fecha |
| GET | /reports/top-medicines | Top medicamentos vendidos |
| GET | /reports/dashboard | Dashboard (stats generales) |
| GET | /reports/stock-status | Estado de stock |

### Health
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /health | Health check |

---

## 28. Cómo arrancar el proyecto (paso a paso)

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar Postgres y Redis con Docker
docker-compose up -d

# 3. Ejecutar migración de Prisma
npx prisma migrate dev --name init

# 4. (Opcional) Populal la base con datos de ejemplo
npx tsx src/scripts/seed.ts

# 5. Iniciar el servidor en desarrollo
npm run dev
```

El servidor estará disponible en `http://localhost:3000/api/v1`.

---

## 29. Patrones y Buenas Prácticas aplicadas

- **Clean Architecture**: Separación clara en capas (domain → application → infrastructure → presentation)
- **DRY (Don't Repeat Yourself)**: Helpers compartidos (`toNumber`, `mapPrismaToMedicine`, etc.)
- **SOLID**: Principio de Responsabilidad Única (cada archivo tiene una función clara)
- **DDD**: Cada módulo es un bounded context con su propio servicio, repositorio y DTOs
- **Type Safety**: Zod para runtime validation, TypeScript para compile-time safety
- **Security**: Soft delete, httpOnly cookies, helmet, rate limiting, bcrypt
- **Observability**: Pino logger con niveles diferenciados por entorno

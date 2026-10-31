# 🏥 API Backend — Farmacia System

**Manual completo de construcción, arquitectura, base de datos y API**

Este documento describe **todo** el backend del sistema de farmacia: cómo está construido, por qué está construido así, cómo levantar una copia desde cero, cómo está organizado el código, cómo funciona cada módulo, cómo está modelada la base de datos, y cuáles son todos los endpoints disponibles con sus request/response.

> **Estado del documento:** generado a partir del código fuente real del monorepo (`backend-fastify/`). Todo bloque de código que aparece aquí fue extraído directamente de los archivos del proyecto — no hay código inventado, resumido ni aproximado.

---

## Tabla de contenidos

1. [Visión general y arquitectura](#1-visión-general-y-arquitectura)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Estructura del repositorio](#3-estructura-del-repositorio)
4. [Prerrequisitos](#4-prerrequisitos)
5. [Creación del proyecto desde cero](#5-creación-del-proyecto-desde-cero)
6. [Punto de entrada: de arranque a rutas](#6-punto-de-entrada-de-arranque-a-rutas)
7. [Configuración global](#7-configuración-global)
8. [Variables de entorno](#8-variables-de-entorno)
9. [Base de datos](#9-base-de-datos)
10. [Dominio: cómo se modela un módulo](#10-dominio-cómo-se-modela-un-módulo)
11. [Módulo auth](#11-módulo-auth)
12. [Módulo email](#12-módulo-email)
13. [Módulo users](#13-módulo-users)
14. [Módulo suppliers](#14-módulo-suppliers)
15. [Módulo categories](#15-módulo-categories)
16. [Módulo medicines](#16-módulo-medicines)
17. [Módulo clients](#17-módulo-clients)
18. [Módulo purchases](#18-módulo-purchases)
19. [Módulo batch-inventory](#19-módulo-batch-inventory)
20. [Módulo inventory](#20-módulo-inventory)
21. [Módulo sales](#21-módulo-sales)
22. [Módulo invoices](#22-módulo-invoices)
23. [Módulo prescriptions](#23-módulo-prescriptions)
24. [Módulo reports](#24-módulo-reports)
25. [Módulo printers](#25-módulo-printers)
26. [Manejo de errores y respuestas](#26-manejo-de-errores-y-respuestas)
27. [Secuencia de estados: flujo de una venta](#27-secuencia-de-estados-flujo-de-una-venta)
28. [Scripts disponibles](#28-scripts-disponibles)
29. [Archivos de prueba HTTP](#29-archivos-de-prueba-http)
30. [Testing](#30-testing)
31. [Checklist de verificación del sistema](#31-checklist-de-verificación-del-sistema)

---

## 1. Visión general y arquitectura

El backend es una **API REST** construida con [Fastify](https://fastify.dev/) sobre **Node.js + TypeScript**, con **PostgreSQL** como base de datos y [Drizzle ORM](https://orm.drizzle.team/) como capa de acceso a datos.

La arquitectura sigue un patrón **modular por dominio** (o *feature-first*): cada área de negocio vive en `src/modules/<modulo>/` y está claramente separada en tres capas internas:

- **`domain/`** — contratos puros de TypeScript: entidades, interfaces de repositorio y tipos de respuesta. *No depende de nada del framework ni de la base de datos.*
- **`application/`** — servicios de aplicación con las reglas de negocio; reciben un repositorio por inyección (factory pattern) y mappers para convertir entidades en respuestas.
- **`infrastructure/`** — implementaciones concretas de los repositorios con Drizzle (`*.drizzle.repository.ts`) y demás adaptadores (email con nodemailer, impresión ESC/POS por TCP).
- **`presentation/`** — DTOs de validación (Zod), controladores HTTP y definición de rutas Fastify.

Esta separación hace que cada módulo sea **testeable de forma aislada**: los tests de servicio inyectan un repositorio *mock* y validan únicamente las reglas de negocio; los repositorios reales quedan para integración.

### Decisiones de diseño clave

1. **¡No hay Redis!** Aunque `.env.example` conserva variables `REDIS_*` (heredadas de una versión anterior del proyecto), la sesión se guarda en tabla PostgreSQL (`session`) y el token de refresco se valida consultando la base de datos. Redis **no se usa en ningún lugar del código**.
2. **Drizzle ORM en versión canary/rc** (`1.0.0-rc.4`) con migraciones SQL generadas; los snapshot JSON de `drizzle/` son artefactos internos de drizzle-kit que se regeneran, no se editan a mano.
3. **Autorización por rol + tienda**: todo endpoint (salvo auth y health) pasa por `authGuard` y `storeGuard`; el usuario trasciende en la request vía `request.userId` / `request.storeId` (injección de FastifyRequest declarada en `auth.guard.ts`).
4. **Multi-tenant por `store_id`**: casi todas las tablas llevan `store_id` y las consultas filtran por la tienda del usuario autenticado — nunca se cruzan datos entre tiendas.
5. **Soft delete**: `deleted_at` en la mayoría de las entidades maestras (users, medicines, suppliers, categories, clients, prescriptions, printers); las ventas, compras, facturas y movimientos de inventario **no** se borran (auditoría).
6. **Transacciones con `FOR UPDATE`** para operaciones sensibles de concurrencia: creación de venta, cancelación, creación de factura (serialización del número `FAC-YYYY-######`), recepción de compras, ajuste de lotes.
7. **Moneda**: la API trabaja con `numeric(10,2)` en Postgres y `number` en TypeScript; el tipo numérico se convierte cuidadosamente con `Number(...)` en la capa de mapeo (nunca se deja el string de Postgres llegar al cliente).

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión usada |
|---|---|---|
| Runtime | Node.js | ≥ 20 (ESM) |
| Framework HTTP | Fastify | ^5 |
| Lenguaje | TypeScript | ^5 (strict) |
| ORM | Drizzle ORM | 1.0.0-rc.4 |
| Base de datos | PostgreSQL | 14+ |
| Validación | Zod | ^3 |
| Email | Nodemailer | ^6 |
| Logs | Pino | ^9 |
| Tests | Vitest | ^3 |
| Compresión | @fastify/compress | ^8 |
| Seguridad | @fastify/helmet, @fastify/cors, @fastify/rate-limit | — |
| Cookies | @fastify/cookie | — |
| Hash | bcryptjs | — |
| JWT | jose | ^6 |
| Build | tsup | ^8 |

> **Detalle importante:** el proyecto **no tiene script `build`** — corre en desarrollo con `tsx watch` y usa `tsup` solo si se necesita un bundle de producción; el doc refleja los scripts que existen realmente en `package.json` (ver [Scripts disponibles](#28-scripts-disponibles)).

## 3. Estructura del repositorio

El monorepo contiene el backend y (potencialmente) otros subproyectos. La ruta del backend es `backend-fastify/`. Su estructura interna a nivel de carpetas:

```text
backend-fastify/
├── drizzle/                          # Migraciones SQL + snapshots de drizzle-kit
│   ├── 20260812173020_init/
│   ├── 20260812175530_slimy_turbo/
│   ├── 20260812180009_youthful_bruce_banner/
│   ├── 20260812181508_brief_the_santerians/
│   └── 20260908030753_curious_bloodscream/
├── http/                             # Requests de prueba (REST Client)
├── src/
│   ├── __tests__/                    # setup.ts + helpers.ts globales de tests
│   ├── config/                       # env, cors, logger, errorHandler, gracefulShutdown
│   ├── core/                         # errors/AppError, utils/date
│   ├── db/schema/                    # Modelo Drizzle (10 archivos)
│   ├── http/                         # routes.ts — registro de routers
│   ├── modules/                      # 15 módulos de negocio + email
│   │   ├── auth/
│   │   ├── batch-inventory/
│   │   ├── categories/
│   │   ├── clients/
│   │   ├── email/
│   │   ├── inventory/
│   │   ├── invoices/
│   │   ├── medicines/
│   │   ├── prescriptions/
│   │   ├── printers/
│   │   ├── purchases/
│   │   ├── reports/
│   │   ├── sales/
│   │   ├── suppliers/
│   │   └── users/
│   ├── scripts/                      # cleanup-expired.ts
│   ├── app.ts                        # buildApp(): plugins + rutas
│   ├── index.ts                      # conexión Drizzle (exporta db)
│   └── server.ts                     # bootstrap + graceful shutdown
├── .env.example                      # Plantilla de variables de entorno
├── drizzle.config.ts                 # Config de drizzle-kit
├── package.json
├── tsconfig.json
├── tsup.config.ts                    # Bundle de producción (opcional)
└── vitest.config.ts
```

> Este árbol muestra las **carpetas** hasta 2 niveles. Cada módulo interno sigue la anatomía `domain/ → application/ → infrastructure/ → presentation/ → __tests__/` (ver [Sección 10 — Dominio: cómo se modela un módulo](#10-dominio-cómo-se-modela-un-módulo)). Para el árbol completo de archivos, ejecutar `find backend-fastify -type f | sort`.

---

## 4. Prerrequisitos

Para levantar el backend desde cero necesitás:

1. **Node.js 20+** con soporte ESM y `pnpm` instalado:
   ```bash
   node -v      # v20.x o superior
   pnpm -v      # 10.30.2 (o compatible)
   ```
2. **PostgreSQL 14+** corriendo localmente (o en un contenedor):
   ```bash
   docker run --name farmacy-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
   ```
3. **Git** (para clonar el repo).
4. Un **cliente HTTP / IDE** para probar la API (VS Code + REST Client / Thunder Client / Bruno / Postman), usando los archivos `backend-fastify/http/*.http`.

---

## 5. Creación del proyecto desde cero

Estos son los pasos que se siguieron para construir este backend, en orden. Sirven para **replicar el proyecto** (no para el día a día — para eso está `pnpm install`).

### 5.1 Inicializar el proyecto Node + TypeScript

```bash
mkdir backend-fastify && cd backend-fastify
pnpm init
pnpm add -D typescript @types/node tsx vitest tsup
pnpm add fastify @fastify/helmet @fastify/cors @fastify/compress @fastify/rate-limit @fastify/cookie
pnpm add drizzle-orm pg zod pino pino-pretty bcryptjs jose nodemailer
pnpm add -D drizzle-kit @types/pg @types/bcryptjs @types/nodemailer
npx tsc --init
```

### 5.2 Configuración de TypeScript (strict + paths)

El `tsconfig.json` del proyecto (ver [Configuración global](#7-configuración-global)) usa:

- `"module": "ESNext"` y `"moduleResolution": "bundler"` → ESM puro.
- `"strict": true` → type-checking estricto.
- `"paths": { "@/*": ["./src/*"] }` → alias `@/` para importar desde `src/`.
- `"types": ["node"]`, `"target": "ES2022"`.

El alias `@/*` debe declararse **también** en `vitest.config.ts` y en `tsup.config.ts` (dónde vive cada config se detalla en [Configuración global](#7-configuración-global)).

### 5.3 Variables de entorno

Crear el archivo `.env` con el contenido mínimo (ver [Variables de entorno](#8-variables-de-entorno) para la tabla completa):

```bash
cp .env.example .env
```

Los tres valores que **siempre** hay que ajustar: `DATABASE_URL`, `JWT_SECRET` y `JWT_REFRESH_SECRET` (mínimo 32 caracteres — el código hace `process.exit(1)` si son más cortos).

### 5.4 Base de datos

- Crear la base: `CREATE DATABASE farmacia;` (o el nombre que uses en la URL).
- Aplicar migraciones (los `*.sql` ya están versionados en `drizzle/`):

```bash
pnpm db:migrate
```

- (Alternativa en desarrollo sin migraciones) sincronizar el schema directo:

```bash
pnpm db:push
```

### 5.5 Servicios externos (opcionales)

- **SMTP** para email real: el módulo `email` usa `nodemailer`. Si `SMTP_HOST` no está seteado, `NodemailerEmailSender.send()` **loguea un warning y no envía** — la app no rompe (ver [Módulo email](#12-módulo-email)).
- **Impresoras**: la impresión de tickets se hace por **TCP directo** al puerto de la impresora (usualmente 9100) — no requiere servicio externo (ver [Módulo printers](#25-módulo-printers)).

### 5.6 Probar que levanta

```bash
pnpm dev
```

Debe loguear con pino algo como `Server listening on http://localhost:3001` y responder:

```bash
curl http://localhost:3001/api/v1/health
# → {"status":"ok"}
```

---

## 6. Punto de entrada: de arranque a rutas

El flujo de arranque es:

```
src/index.ts  → exporta db (drizzle)  → src/server.ts  → buildApp()  → src/app.ts
                                                              │
                                                              └─ register(http/routes.ts, { prefix: "/api/v1" })
```

### 6.1 `src/index.ts` — la conexión a la base


> **index.ts — conexión Drizzle (node-postgres)**  
> Ruta: `backend-fastify/src/index.ts`  
>
```typescript
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';

export const db = drizzle(process.env.DATABASE_URL!);

```


### 6.2 `src/server.ts` — bootstrap del servidor


> **server.ts — arranque HTTP + graceful shutdown**  
> Ruta: `backend-fastify/src/server.ts`  
>
```typescript
import { buildApp } from "./app"
import { env } from "./config/env"
import { setupGracefulShutdown } from "./config/gracefulShutdown"

const startServer = async () => {
  try {
    const app = await buildApp()

    setupGracefulShutdown(app)

    await app.listen({ port: env.PORT, host: env.HOST })
  } catch {
    process.exit(1)
  }
}

startServer()

```


### 6.3 `src/app.ts` — fábrica de la aplicación Fastify


> **app.ts — buildApp(): plugins globales, error handler, health y montaje de rutas**  
> Ruta: `backend-fastify/src/app.ts`  
>
```typescript
import fastify from "fastify"
import helmet from "@fastify/helmet"
import cors from "@fastify/cors"
import compress from "@fastify/compress"
import rateLimit from "@fastify/rate-limit"
import cookie from "@fastify/cookie"
import { logger } from "./config/logger"
import { corsOptions } from "./config/cors"
import { errorHandler, notFoundHandler } from "./config/errorHandler"
import { routes } from "./http/routes"

export const buildApp = async () => {
  const app = fastify({ loggerInstance: logger })

  // Protege header HTTP
  await app.register(helmet)

  await app.register(cors, corsOptions)

  await app.register(compress, { threshold: 1024 })

  await app.register(rateLimit, {
    max: 300,
    timeWindow: "1 minute"
  })

  await app.register(cookie)

  app.setErrorHandler(errorHandler)

  app.setNotFoundHandler(notFoundHandler)

  app.get("/api/v1/health", async () => {
    return {
      status: "ok",
      timeStamp: new Date().toISOString()
    }
  })

  app.register(routes, { prefix: '/api/v1' });


  return app
}

```


> El `GET /api/v1/health` está definido **directo en `buildApp`** (sección 6.3), no en un router de módulo. Responde `{ status: "ok", timeStamp: <ISO> }`.

### 6.4 `src/http/routes.ts` — registrar rutas por módulo


> **routes.ts — registro de los 15 routers bajo /api/v1**  
> Ruta: `backend-fastify/src/http/routes.ts`  
>
```typescript
import { authRoutes } from "@/modules/auth/presentation/auth.routes"
import { usersRoutes } from "@/modules/users/presentation/users.routes"
import { categoriesRoutes } from "@/modules/categories/presentation/categories.routes"
import { suppliersRoutes } from "@/modules/suppliers/presentation/suppliers.routes"
import { medicinesRoutes } from "@/modules/medicines/presentation/medicines.routes"
import { clientsRoutes } from "@/modules/clients/presentation/clients.routes"
import { prescriptionsRoutes } from "@/modules/prescriptions/presentation/prescriptions.routes"
import { purchasesRoutes } from "@/modules/purchases/presentation/purchases.routes"
import { batchInventoryRoutes } from "@/modules/batch-inventory/presentation/batch-inventory.routes"
import { inventoryRoutes } from "@/modules/inventory/presentation/inventory.routes"
import { salesRoutes } from "@/modules/sales/presentation/sales.routes"
import { invoicesRoutes } from "@/modules/invoices/presentation/invoices.routes"
import { reportsRoutes } from "@/modules/reports/presentation/reports.routes"
import { printersRoutes } from "@/modules/printers/presentation/printers.routes"
import { FastifyInstance, FastifyPluginOptions } from "fastify"

export const routes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  fastify.register(authRoutes, { prefix: "/auth" })
  fastify.register(usersRoutes, { prefix: "/users" })
  fastify.register(categoriesRoutes, { prefix: "/categories" })
  fastify.register(suppliersRoutes, { prefix: "/suppliers" })
  fastify.register(medicinesRoutes, { prefix: "/medicines" })
  fastify.register(clientsRoutes, { prefix: "/clients" })
  fastify.register(prescriptionsRoutes, { prefix: "/prescriptions" })
  fastify.register(purchasesRoutes, { prefix: "/purchases" })
  fastify.register(batchInventoryRoutes, { prefix: "/inventory/batches" })
  fastify.register(inventoryRoutes, { prefix: "/inventory" })
  fastify.register(salesRoutes, { prefix: "/sales" })
  fastify.register(invoicesRoutes, { prefix: "/invoices" })
  fastify.register(reportsRoutes, { prefix: "/reports" })
  fastify.register(printersRoutes, { prefix: "/printers" })
}


```


> **Cómo se conectan:** `server.ts` llama a `buildApp()`, la aplicación registra los plugins globales (helmet, cors, compress, rate-limit, cookie), los handlers de error/404, la ruta `GET /health`, y **todos los routers de módulos con el prefijo `/api/v1`**. Cada router de módulo (`modules/*/presentation/*.routes.ts`) es un plugin Fastify que monta sus endpoints bajo ese prefijo.

### 6.5 Tabla completa de rutas

Extraída directamente de los archivos `*.routes.ts` reales (cada módulo se monta bajo `/api/v1`). Todos los endpoints excepto `auth/*` y `health` pasan por `authGuard` + `storeGuard` (ver [Módulo auth](#11-módulo-auth)).

| Método | Ruta (después de `/api/v1`) | Módulo |
|---|---|---|
| POST | `/auth/register-store` | auth |
| POST | `/auth/register` | auth |
| POST | `/auth/login` | auth |
| POST | `/auth/refresh` | auth |
| POST | `/auth/logout` | auth |
| POST | `/auth/verify-email` | auth |
| POST | `/auth/resend-verification` | auth |
| POST | `/auth/forgot-password` | auth |
| POST | `/auth/reset-password` | auth |
| GET | `/auth/sessions` | auth |
| DELETE | `/auth/sessions/:sessionId` | auth |
| GET | `/users` | users |
| GET | `/users/:id` | users |
| POST | `/users` | users |
| PUT | `/users/:id` | users |
| DELETE | `/users/:id` | users |
| GET | `/suppliers` | suppliers |
| GET | `/suppliers/:id` | suppliers |
| POST | `/suppliers` | suppliers |
| PUT | `/suppliers/:id` | suppliers |
| DELETE | `/suppliers/:id` | suppliers |
| GET | `/categories` | categories |
| GET | `/categories/paginated` | categories |
| GET | `/categories/:id` | categories |
| POST | `/categories` | categories |
| PUT | `/categories/:id` | categories |
| DELETE | `/categories/:id` | categories |
| GET | `/medicines` | medicines |
| GET | `/medicines/barcode/:barcode` | medicines |
| GET | `/medicines/:id` | medicines |
| POST | `/medicines` | medicines |
| PUT | `/medicines/:id` | medicines |
| DELETE | `/medicines/:id` | medicines |
| GET | `/clients` | clients |
| GET | `/clients/:id/history` | clients |
| GET | `/clients/:id` | clients |
| POST | `/clients` | clients |
| PUT | `/clients/:id` | clients |
| DELETE | `/clients/:id` | clients |
| GET | `/purchases` | purchases |
| GET | `/purchases/:id` | purchases |
| POST | `/purchases` | purchases |
| PUT | `/purchases/:id` | purchases |
| POST | `/purchases/:id/approve` | purchases |
| POST | `/purchases/:id/receive` | purchases |
| POST | `/purchases/:id/cancel` | purchases |
| GET | `/inventory/batches` | batch-inventory |
| GET | `/inventory/batches/expiring` | batch-inventory |
| GET | `/inventory/batches/expired` | batch-inventory |
| GET | `/inventory/batches/:id` | batch-inventory |
| POST | `/inventory/batches` | batch-inventory |
| PUT | `/inventory/batches/:id` | batch-inventory |
| GET | `/inventory/low-stock` | inventory |
| GET | `/inventory/product/:medicineId` | inventory |
| GET | `/inventory` | inventory |
| POST | `/inventory` | inventory |
| GET | `/sales/report` | sales |
| GET | `/sales/revenue-trend` | sales |
| POST | `/sales/:id/cancel` | sales |
| GET | `/sales/:id` | sales |
| GET | `/sales` | sales |
| POST | `/sales` | sales |
| GET | `/invoices` | invoices |
| GET | `/invoices/:id` | invoices |
| POST | `/invoices` | invoices |
| POST | `/invoices/:id/cancel` | invoices |
| GET | `/prescriptions` | prescriptions |
| GET | `/prescriptions/:id` | prescriptions |
| POST | `/prescriptions` | prescriptions |
| PUT | `/prescriptions/:id` | prescriptions |
| POST | `/prescriptions/:id/validate` | prescriptions |
| DELETE | `/prescriptions/:id` | prescriptions |
| GET | `/reports/dashboard` | reports |
| GET | `/reports/financial` | reports |
| GET | `/printers` | printers |
| POST | `/printers` | printers |
| POST | `/printers/:id/test` | printers |
| POST | `/printers/:id/probe` | printers |
| POST | `/printers/send-tcp` | printers |
| POST | `/printers/:id/print-receipt` | printers |
| POST | `/printers/:id/set-default` | printers |
| GET | `/printers/:id` | printers |
| PATCH | `/printers/:id` | printers |
| DELETE | `/printers/:id` | printers |

> Nota de montaje: **todos** los endpoints viven bajo `/api/v1`, incluida la ruta de salud. El prefijo proviene de dos lugares: `buildApp` registra `GET /api/v1/health` directo y monta `routes` con `prefix: "/api/v1"`. Cada módulo, a su vez, se registra dentro de `src/http/routes.ts` con su propio sub-prefijo (`/auth`, `/users`, `/inventory/batches`…).

## 7. Configuración global

Todos los archivos de configuración del proyecto, con su contenido real íntegro.

### 7.1 `package.json`


> **package.json — dependencias y scripts**  
> Ruta: `backend-fastify/package.json`  
>
```json
{
  "name": "backend-fastify",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:cleanup": "tsx src/scripts/cleanup-expired.ts"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "packageManager": "pnpm@10.30.2",
  "pnpm": {
    "onlyBuiltDependencies": [
      "bcrypt",
      "esbuild"
    ]
  },
  "dependencies": {
    "@fastify/compress": "^8.0.0",
    "@fastify/cookie": "^11.0.0",
    "@fastify/cors": "^10.0.0",
    "@fastify/helmet": "^12.0.0",
    "@fastify/jwt": "^9.0.0",
    "@fastify/rate-limit": "^10.0.0",
    "@fastify/swagger": "^9.7.0",
    "@fastify/swagger-ui": "^6.0.0",
    "@prisma/client": "^6.0.0",
    "bcrypt": "^5.1.0",
    "dotenv": "^16.4.0",
    "drizzle-orm": "1.0.0-rc.4",
    "fastify": "^5.0.0",
    "ioredis": "^5.4.0",
    "jsonwebtoken": "^9.0.0",
    "nodemailer": "^10.0.1",
    "pg": "^8.22.0",
    "pino": "^9.0.0",
    "zod": "^3.23.0",
    "zod-to-json-schema": "^3.25.2"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/node": "^22.0.0",
    "@types/pg": "^8.21.0",
    "drizzle-kit": "1.0.0-rc.4",
    "pino-pretty": "^11.0.0",
    "prisma": "^6.0.0",
    "tsup": "^8.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.5.0",
    "vitest": "^5.0.0"
  }
}

```


> **Nota de fidelidad:** este es el `package.json` real. Notarás que **no hay script `build`** — el proyecto se ejecuta con `dev` (tsx watch). `tsup.config.ts` existe para empaquetar si alguna vez se necesita producción con bundle.

### 7.2 `tsconfig.json`


> **tsconfig.json — TS estricto, ESM, alias @/***  
> Ruta: `backend-fastify/tsconfig.json`  
>
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": [
      "ESNext"
    ],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "paths": {
      "@/*": [
        "./src/*"
      ]
    }
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}

```


### 7.3 `vitest.config.ts` — configuración de tests


> **vitest.config.ts — pool forks, setup global, alias @/***  
> Ruta: `backend-fastify/vitest.config.ts`  
>
```typescript
import { defineConfig } from "vitest/config"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/__tests__/setup.ts"],
    pool: "forks",
    testTimeout: 10_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
})

```


### 7.4 `tsup.config.ts` — bundler de producción (opcional)


> **tsup.config.ts — bundle de src/server.ts hacia dist/**  
> Ruta: `backend-fastify/tsup.config.ts`  
>
```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  outDir: "dist",
  clean: true,
  format: "esm",
  sourcemap: true,
  cjsInterop: true,
  esbuildOptions(options) {
    options.alias = {
      "@": "./src",
    };
  },
});

```


### 7.5 `drizzle.config.ts` — configuración del ORM


> **drizzle.config.ts — schema, output, dialect y URL**  
> Ruta: `backend-fastify/drizzle.config.ts`  
>
```typescript
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

```


### 7.6 `.env.example` — plantilla de entorno


> **.env.example — variables documentadas (sin secretos reales)**  
> Ruta: `backend-fastify/.env.example`  
>
```text
NODE_ENV=development
PORT=3000
HOST="0.0.0.0"
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:1420,http://192.168.0.10:1420,http://tauri.localhost
DATABASE_URL="postgresql://user:password@localhost:5432/farmacia_system?schema=public"
JWT_SECRET=farmacy-system-jwt-secret-key-min-32-chars
JWT_REFRESH_SECRET=farmacy-system-refresh-secret-min-32-char
REDIS_URL=redis://localhost:6379
CORS_ORIGIN="http://localhost:5173,http://localhost:1420,http://localhost:3000,http://tauri.localhost"

SMTP_HOST=smtp.tu-proveedor.com
SMTP_PORT=587
SMTP_USER=tu-usuario
SMTP_PASS=tu-contraseña
SMTP_FROM=no-reply@tufarmacia.com

```


### 7.7 `.gitignore`


> **.gitignore — node_modules, dist, .env, coverage**  
> Ruta: `backend-fastify/.gitignore`  
>
```text
node_modules/
dist/
.env
*.log

```


### 7.8 `src/config/` — configuración en tiempo de ejecución

#### 7.8.1 `env.ts` — validación de entorno con Zod (crítica al arranque)


> **env.ts — esquema Zod del entorno; process.exit(1) si falla**  
> Ruta: `backend-fastify/src/config/env.ts`  
>
```typescript
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default("0.0.0.0"),
  CORS_ORIGIN: z.string(),
  DATABASE_URL: z.string(),
  REDIS_HOST: z.string().default("127.0.0.1"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default("no-reply@localhost"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("Invalid environment variables", _env.error.format());
  process.exit(1);
}

export const env = _env.data;

```


#### 7.8.2 `cors.ts` — CORS desde variable de entorno


> **cors.ts — orígenes separados por coma, credentials true**  
> Ruta: `backend-fastify/src/config/cors.ts`  
>
```typescript
import type { FastifyCorsOptions } from "@fastify/cors";
import { env } from "./env";

export const corsOptions: FastifyCorsOptions = {
  origin: env.CORS_ORIGIN?.split(",") ?? [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:1420",
    "http://192.168.0.10:1420",
    "http://tauri.localhost",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
};

```


#### 7.8.3 `logger.ts` — Pino


> **logger.ts — pino con pino-pretty en desarrollo**  
> Ruta: `backend-fastify/src/config/logger.ts`  
>
```typescript
import pino from "pino"
import { env } from "./env";

const isDev = env.NODE_ENV === "development";

export const logger = pino({
  level: isDev ? "debug" : "info",
  transport: isDev
    ? {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    }
    : undefined,
})

```


#### 7.8.4 `errorHandler.ts` — handler global de errores + 404


> **errorHandler.ts — Zod → 400; AppError → status propio; 500 oculto**  
> Ruta: `backend-fastify/src/config/errorHandler.ts`  
>
```typescript
import { AppError } from "@/core/errors/AppError";
import { FastifyError, FastifyReply, FastifyRequest } from "fastify"
import { ZodError } from "zod"

const CLIENT_ERROR_MESSAGES: Record<number, string> = {
  400: "Solicitud inválida",
  401: "No autorizado",
  403: "Acceso denegado",
  404: "No encontrado",
  405: "Método no permitido",
  408: "Tiempo de espera agotado",
  409: "Conflicto",
  413: "Solicitud demasiado grande",
  415: "Tipo de contenido no soportado",
  422: "Entidad no procesable",
  429: "Demasiadas solicitudes",
}

export const errorHandler = (
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  if (error instanceof ZodError || ("code" in error && error.code === "FST_ERR_VALIDATION")) {
    const validation = "validation" in error && Array.isArray(error.validation) ? error.validation : [];
    const first = error instanceof ZodError ? error.errors[0] : validation[0];
    return reply.status(400).send({
      message: first?.message ?? "Datos inválidos",
    });
  }

  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      message: error.message
    })
  }

  // Errores de Fastify con status code de cliente (body inválido, rate limit, etc.)
  // Se respeta el código pero se oculta el mensaje original (puede revelar detalles).
  if ("statusCode" in error && typeof error.statusCode === "number" && error.statusCode >= 400 && error.statusCode < 500) {
    request.log.warn(error);
    return reply.status(error.statusCode).send({
      message: CLIENT_ERROR_MESSAGES[error.statusCode] ?? "Solicitud inválida",
    })
  }

  request.log.error(error);
  return reply.status(500).send({
    message: "Error interno del servidor",
  });
}

export const notFoundHandler = (
  _request: FastifyRequest,
  reply: FastifyReply,
) => {
  reply.status(404).send({
    message: "Recurso no encontrado",
    statusCode: 404
  })
}

```


#### 7.8.5 `gracefulShutdown.ts` — apagado ordenado


> **gracefulShutdown.ts — SIGINT/SIGTERM → app.close()**  
> Ruta: `backend-fastify/src/config/gracefulShutdown.ts`  
>
```typescript
import { logger } from "../config/logger"
import { buildApp } from "@/app"

export const setupGracefulShutdown = (app: Awaited<ReturnType<typeof buildApp>>) => {
  const gracefulShutdown = async (signal: string) => {
    try {
      logger.info(`Received ${signal}, shutting down gracefully...`)

      await app.close()

      logger.info("Server closed successfully")

      process.exit(0)
    } catch (error) {
      logger.error(error, "Error during shutdown")
      process.exit(1)
    }
  }

  process.on("SIGINT", () => gracefulShutdown("SIGINT"))
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
}

```


---

## 8. Variables de entorno

Tabla completa, extraída de `src/config/env.ts` y `.env.example`.

| Variable | Requerida | Default | Descripción |
|---|---|---|---|
| `NODE_ENV` | no | `development` | Entorno de ejecución |
| `PORT` | no | `3001` | Puerto HTTP del servidor |
| `HOST` | no | `0.0.0.0` | Interfaz de escucha |
| `CORS_ORIGIN` | **sí** | — | Origen(es) permitidos, separados por coma (ej: `http://localhost:5173,http://localhost:3000`) |
| `DATABASE_URL` | **sí** | — | URL de PostgreSQL (`postgres://user:pass@host:5432/db`) |
| `REDIS_HOST` | no | `127.0.0.1` | ⚠️ Vestigio — no se usa en el código actual |
| `REDIS_PORT` | no | `6379` | ⚠️ Vestigio — no se usa |
| `REDIS_URL` | no | `redis://localhost:6379` | ⚠️ Vestigio — no se usa |
| `JWT_SECRET` | **sí (min 32)** | — | Secreto para tokens de acceso |
| `JWT_EXPIRES_IN` | no | `15m` | Expiración del access token |
| `JWT_REFRESH_SECRET` | **sí (min 32)** | — | Secreto para tokens de refresco |
| `JWT_REFRESH_EXPIRES_IN` | no | `7d` | Expiración del refresh token |
| `SMTP_HOST` | no | — | Host SMTP; si falta, el email no se envía (warn) |
| `SMTP_PORT` | no | `587` | Puerto SMTP |
| `SMTP_USER` | no | — | Usuario SMTP |
| `SMTP_PASS` | no | — | Contraseña/app password SMTP |
| `SMTP_FROM` | no | `no-reply@localhost` | Remitente de los emails |

### 8.1 Comportamiento si falta algo

- `env.ts` valida el entorno **al arranque** con Zod. Si falta una variable requerida (o un secreto tiene menos de 32 caracteres), muestra el error y llama a `process.exit(1)`.
- `DATABASE_URL` se usa directo en `src/index.ts` (`drizzle(process.env.DATABASE_URL!)`) — el `!` es un *non-null assertion* de TS: asume que `env.ts` ya validó.
- Si falta `SMTP_HOST`, `NodemailerEmailSender.send()` loguea `SMTP not configured — skipping email delivery` y retorna — no rompe el flujo de registro/recuperación (los códigos quedan en la tabla `verification` igualmente).
- `CORS_ORIGIN` es requerida: sin ella, la app no arranca. El frontend debe estar listado aquí o las peticiones del navegador serán bloqueadas.

### 8.2 Seguridad

- **`.env` NO se versiona** (está en `.gitignore`). Solo se commitea `.env.example` con placeholders.
- Los secretos `JWT_SECRET` y `JWT_REFRESH_SECRET` deben ser distintos y largos (`min(32)` validado).
- `SMTP_PASS` para Gmail debe ser un **App Password** (no la contraseña de la cuenta) si se usa Gmail como relay.
- El `.env.example` commiteado **no contiene secretos reales** — solo valores de ejemplo.

### 8.3 Peculiaridades del `.env.example` actual (fidelidad del repo)

Tal como está commiteado hoy, el archivo contiene algunos detalles que conviene conocer (se dejan tal cual para no inventar cosas que el repo no tiene):

1. **`PORT=3000`** — el `.env.example` fija 3000, mientras que el `default` de `env.ts` es `3001`. Eso significa que sin `.env` la app escucha en 3001, y con el `.env.example` copiado escucha en 3000. El `http-client.env.json` usa `http://localhost:3001`. Al levantar el proyecto conviene decidir uno y ser consistente.
2. **`CORS_ORIGIN` está duplicado** — aparece dos veces (una con 6 orígenes de desarrollo/TAURI, otra con 4). Zod con `.safeParse` toma el **último** valor del `process.env` (el segundo bloque), así que el resto son efectivamente inertes. No es un bug que rompa nada, pero es código muerto de configuración.
3. **`REDIS_URL` sin `REDIS_HOST`/`REDIS_PORT`** — el archivo solo define `REDIS_URL`; los otros dos tienen defaults en `env.ts`. Y en cualquier caso, **Redis no se usa en el código** (vestigio).
4. El ejemplo de SMTP usa un dominio genérico (`tu-proveedor.com` / `tu-usuario`) — es un placeholder.

## 9. Base de datos

### 9.1 Modelo de datos (schema Drizzle)

El schema vive en `src/db/schema/` y es la **fuente de verdad** del modelo. Se compone de 10 archivos que se exportan desde `index.ts`:


> **db/schema/index.ts — exports de todos los schemas**  
> Ruta: `backend-fastify/src/db/schema/index.ts`  
>
```typescript
export * from "./auth";
export * from "./catalog";
export * from "./clients";
export * from "./prescriptions";
export * from "./purchases";
export * from "./inventory";
export * from "./sales";
export * from "./invoices";
export * from "./printers";

```


#### 9.1.1 `auth.ts` — store, users, session, account, verification


> **auth.ts — tablas de identidad y sesión**  
> Ruta: `backend-fastify/src/db/schema/auth.ts`  
>
```typescript
import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  pgEnum,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("ROLE", [
  "admin",
  "farmaceutico",
  "cajero",
  "bodeguero",
]);

export const store = pgTable("store", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  ruc: text("ruc"),
  email: text("email"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  }).notNull().defaultNow().$onUpdate(() => new Date()),
},
  (table) => [
    index("idx_store_name").on(table.name)
  ]
);

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  phone: text("phone"),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("cajero"),
  storeId: uuid("store_id").references(() => store.id).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true
  }).notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", {
    withTimezone: true
  })
},
  (table) => [
    uniqueIndex("uq_users_store_email").on(
      table.storeId,
      table.email
    ),
    index("idx_users_email").on(table.email),
    index("idx_users_role").on(table.role),
    index("idx_users_store_id").on(table.storeId),
    index("idx_users_store_id_deleted_at").on(table.storeId, table.deletedAt)
  ]
);

export const session = pgTable("session", {
  id: uuid("id").primaryKey(),
  expiresAt: timestamp("expires_at"),
  token: text("token").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: uuid("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true
  }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true
  }).notNull().defaultNow().$onUpdate(() => new Date())
},
  (table) => [
    uniqueIndex("uq_session_token").on(table.token),
    index("idx_session_user_id").on(table.userId)
  ]
)

export const account = pgTable("account", {
  id: uuid("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: uuid("user_id").references(() => users.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", {
    withTimezone: true
  }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true
  }).notNull().defaultNow().$onUpdate(() => new Date())
})


export const verificacion = pgTable("verification", {
  id: uuid("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", {
    withTimezone: true
  }).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true
  }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true
  }).notNull().defaultNow().$onUpdate(() => new Date())
},
  (table) => [
    index("idx_verification_identifier_expires_at").on(table.identifier, table.expiresAt)
  ]
)

```


#### 9.1.2 `catalog.ts` — category, supplier, medicine (catálogo maestro)


> **catalog.ts — categorías, proveedores y medicamentos**  
> Ruta: `backend-fastify/src/db/schema/catalog.ts`  
>
```typescript
import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
  integer,
  numeric
} from "drizzle-orm/pg-core";
import { store } from "./auth";

export const unitTypeEnum = pgEnum("UNIT_TYPE", [
  "unidad",
  "paquete",
  "caja",
  "frasco",
  "tubo",
  "sobre",
  "blister",
  "ampolleta",
  "gotero",
  "aerosol",
  "crema",
  "jarabe",
  "tableta",
  "capsula",
  "botella",
  "bolsa",
]);

export const category = pgTable("category", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  storeId: uuid("store_id").references(() => store.id).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true
  }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true
  }).notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", {
    withTimezone: true
  })
},
  (table) => [
    uniqueIndex("uq_category_store_name").on(table.storeId, table.name),
    index("idx_category_name").on(table.name),
    index("idx_category_deleted_at").on(table.deletedAt),
    index("idx_category_store_id").on(table.storeId)
  ]
);

export const supplier = pgTable("supplier", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company"),
  ruc: text("ruc"),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  storeId: uuid("store_id").references(() => store.id).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true
  }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true
  }).notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", {
    withTimezone: true
  })
},
  (table) => [
    index("idx_supplier_name").on(table.name),
    index("idx_supplier_is_active").on(table.isActive),
    index("idx_supplier_store_name").on(table.storeId, table.name),
    index("idx_supplier_store_deleted_at").on(table.storeId, table.deletedAt)
  ]
);

export const medicine = pgTable("medicine", {
  id: uuid("id").primaryKey(),
  barcode: text("barcode"),
  internalCode: text("internal_code"),
  commercialName: text("commercial_name").notNull(),
  genericName: text("generic_name"),
  activeIngredient: text("active_ingredient"),
  concentration: text("concentration"),
  presentation: text("presentation"),
  pharmaceuticalForm: text("pharmaceutical_form"),
  laboratory: text("laboratory"),
  categoryId: uuid("category_id").references(() => category.id),
  supplierId: uuid("supplier_id").references(() => supplier.id),
  unitType: unitTypeEnum("unit_type"),
  unitQuantity: integer("unit_quantity"),
  purchasePrice: numeric("purchase_price", { precision: 10, scale: 2 }).notNull().default("0"),
  salePrice: numeric("sale_price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
  requiresPrescription: boolean("requires_prescription").notNull().default(false),
  isControlled: boolean("is_controlled").notNull().default(false),
  image: text("image"),
  active: boolean("active").notNull().default(true),
  storeId: uuid("store_id").references(() => store.id).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true
  }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true
  }).notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", {
    withTimezone: true
  })
},
  (table) => [
    index("idx_medicine_barcode").on(table.barcode),
    index("idx_medicine_commercial_name").on(table.commercialName),
    index("idx_medicine_generic_name").on(table.genericName),
    index("idx_medicine_active_ingredient").on(table.activeIngredient),
    index("idx_medicine_category_id").on(table.categoryId),
    index("idx_medicine_supplier_id").on(table.supplierId),
    index("idx_medicine_requires_prescription").on(table.requiresPrescription),
    index("idx_medicine_is_controlled").on(table.isControlled),
    index("idx_medicine_active").on(table.active),
    index("idx_medicine_store_id").on(table.storeId),
    index("idx_medicine_store_deleted_at").on(table.storeId, table.deletedAt),
    index("idx_medicine_store_commercial_name").on(table.storeId, table.commercialName)
  ]
);

```


#### 9.1.3 `clients.ts` — clientes


> **clients.ts — tabla client con datos de salud del paciente**  
> Ruta: `backend-fastify/src/db/schema/clients.ts`  
>
```typescript
import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  index
} from "drizzle-orm/pg-core";
import { store } from "./auth";

export const client = pgTable("client", {
  id: uuid("id").primaryKey(),
  fullName: text("full_name").notNull(),
  documentType: text("document_type").notNull().default("cedula"),
  documentNumber: text("document_number"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  birthDate: timestamp("birth_date", {
    withTimezone: true
  }),
  sex: text("sex"),
  allergies: text("allergies"),
  chronicDiseases: text("chronic_diseases"),
  observations: text("observations"),
  isFrequent: boolean("is_frequent").notNull().default(false),
  storeId: uuid("store_id").references(() => store.id).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true
  }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true
  }).notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", {
    withTimezone: true
  })
},
  (table) => [
    index("idx_client_full_name").on(table.fullName),
    index("idx_client_document_number").on(table.documentNumber),
    index("idx_client_phone").on(table.phone),
    index("idx_client_store_id").on(table.storeId),
    index("idx_client_store_deleted_at").on(table.storeId, table.deletedAt),
    index("idx_client_store_full_name").on(table.storeId, table.fullName),
    index("idx_client_store_is_frequent").on(table.storeId, table.isFrequent)
  ]
);

```


#### 9.1.4 `inventory.ts` — batch (lotes) e inventory_movement


> **inventory.ts — lotes con vencimiento + movimientos de inventario**  
> Ruta: `backend-fastify/src/db/schema/inventory.ts`  
>
```typescript
import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  numeric,
  index
} from "drizzle-orm/pg-core";
import { users, store } from "./auth";
import { medicine, supplier } from "./catalog";
import { purchase } from "./purchases";

export const batch = pgTable("batch", {
  id: uuid("id").primaryKey(),
  batchNumber: text("batch_number").notNull(),
  medicineId: uuid("medicine_id").references(() => medicine.id).notNull(),
  purchaseId: uuid("purchase_id").references(() => purchase.id),
  supplierId: uuid("supplier_id").references(() => supplier.id),
  manufactureDate: timestamp("manufacture_date", {
    withTimezone: true
  }),
  expiryDate: timestamp("expiry_date", {
    withTimezone: true
  }).notNull(),
  initialQuantity: integer("initial_quantity").notNull().default(0),
  quantity: integer("quantity").notNull().default(0),
  unitCost: numeric("unit_cost", { precision: 10, scale: 2 }),
  notes: text("notes"),
  userId: uuid("user_id").references(() => users.id).notNull(),
  storeId: uuid("store_id").references(() => store.id).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true
  }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true
  }).notNull().defaultNow().$onUpdate(() => new Date())
},
  (table) => [
    index("idx_batch_medicine_id").on(table.medicineId),
    index("idx_batch_expiry_date").on(table.expiryDate),
    index("idx_batch_store_expiry_date").on(table.storeId, table.expiryDate),
    index("idx_batch_store_created_at").on(table.storeId, table.createdAt)
  ]
);

export const inventoryMovement = pgTable("inventory_movement", {
  id: uuid("id").primaryKey(),
  medicineId: uuid("medicine_id").references(() => medicine.id).notNull(),
  movementType: text("movement_type").notNull(),
  quantity: integer("quantity").notNull(),
  note: text("note"),
  batchId: uuid("batch_id").references(() => batch.id),
  userId: uuid("user_id").references(() => users.id).notNull(),
  storeId: uuid("store_id").references(() => store.id).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true
  }).notNull().defaultNow()
},
  (table) => [
    index("idx_inventory_movement_medicine_id").on(table.medicineId),
    index("idx_inventory_movement_batch_id").on(table.batchId),
    index("idx_inventory_movement_store_created_at").on(table.storeId, table.createdAt),
    index("idx_inventory_movement_store_movement_type").on(table.storeId, table.movementType),
    index("idx_inventory_movement_store_medicine_created_at").on(table.storeId, table.medicineId, table.createdAt)
  ]
);

```


#### 9.1.5 `purchases.ts` — órdenes de compra


> **purchases.ts — purchase y purchase_item**  
> Ruta: `backend-fastify/src/db/schema/purchases.ts`  
>
```typescript
import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  numeric,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { users, store } from "./auth";
import { supplier, medicine } from "./catalog";

export const purchase = pgTable("purchase", {
  id: uuid("id").primaryKey(),
  number: text("number").notNull(),
  status: text("status").notNull().default("borrador"),
  supplierId: uuid("supplier_id").references(() => supplier.id),
  expectedDate: timestamp("expected_date", {
    withTimezone: true
  }),
  notes: text("notes"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at", {
    withTimezone: true
  }),
  receivedBy: text("received_by"),
  receivedAt: timestamp("received_at", {
    withTimezone: true
  }),
  userId: uuid("user_id").references(() => users.id).notNull(),
  storeId: uuid("store_id").references(() => store.id).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true
  }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true
  }).notNull().defaultNow().$onUpdate(() => new Date())
},
  (table) => [
    uniqueIndex("uq_purchase_store_number").on(table.storeId, table.number),
    index("idx_purchase_status").on(table.status),
    index("idx_purchase_supplier_id").on(table.supplierId),
    index("idx_purchase_store_created_at").on(table.storeId, table.createdAt),
    index("idx_purchase_store_status").on(table.storeId, table.status)
  ]
);

export const purchaseItem = pgTable("purchase_item", {
  id: uuid("id").primaryKey(),
  purchaseId: uuid("purchase_id").references(() => purchase.id, { onDelete: "cascade" }).notNull(),
  medicineId: uuid("medicine_id").references(() => medicine.id).notNull(),
  medicineName: text("medicine_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitCost: numeric("unit_cost", { precision: 10, scale: 2 }).notNull(),
  lineTotal: numeric("line_total", { precision: 10, scale: 2 }).notNull(),
  received: integer("received").notNull().default(0),
  createdAt: timestamp("created_at", {
    withTimezone: true
  }).notNull().defaultNow()
},
  (table) => [
    index("idx_purchase_item_purchase_id").on(table.purchaseId),
    index("idx_purchase_item_medicine_id").on(table.medicineId)
  ]
);

```


#### 9.1.6 `sales.ts` — ventas e items


> **sales.ts — sale y sale_item**  
> Ruta: `backend-fastify/src/db/schema/sales.ts`  
>
```typescript
import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  numeric,
  index
} from "drizzle-orm/pg-core";
import { users, store } from "./auth";
import { client } from "./clients";
import { prescription } from "./prescriptions";
import { medicine } from "./catalog";
import { batch } from "./inventory";

export const sale = pgTable("sale", {
  id: uuid("id").primaryKey(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  amountReceived: numeric("amount_received", { precision: 10, scale: 2 }),
  changeGiven: numeric("change_given", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("completada"),
  cancellationReason: text("cancellation_reason"),
  cancelledAt: timestamp("cancelled_at", {
    withTimezone: true
  }),
  cancelledBy: text("cancelled_by"),
  userId: uuid("user_id").references(() => users.id).notNull(),
  userName: text("user_name"),
  clientId: uuid("client_id").references(() => client.id),
  prescriptionId: uuid("prescription_id").references(() => prescription.id),
  storeId: uuid("store_id").references(() => store.id).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true
  }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true
  }).notNull().defaultNow().$onUpdate(() => new Date())
},
  (table) => [
    index("idx_sale_user_id").on(table.userId),
    index("idx_sale_client_id").on(table.clientId),
    index("idx_sale_status").on(table.status),
    index("idx_sale_store_created_at").on(table.storeId, table.createdAt),
    index("idx_sale_store_payment_created_at").on(table.storeId, table.paymentMethod, table.createdAt),
    index("idx_sale_store_prescription_id").on(table.storeId, table.prescriptionId),
    index("idx_sale_store_status_created_at").on(table.storeId, table.status, table.createdAt)
  ]
);

export const saleItem = pgTable("sale_item", {
  id: uuid("id").primaryKey(),
  saleId: uuid("sale_id").references(() => sale.id, { onDelete: "cascade" }).notNull(),
  medicineId: uuid("medicine_id").references(() => medicine.id).notNull(),
  medicineName: text("medicine_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  lineTotal: numeric("line_total", { precision: 10, scale: 2 }).notNull(),
  batchId: uuid("batch_id").references(() => batch.id),
  createdAt: timestamp("created_at", {
    withTimezone: true
  }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true
  }).notNull().defaultNow().$onUpdate(() => new Date())
},
  (table) => [
    index("idx_sale_item_sale_id").on(table.saleId),
    index("idx_sale_item_medicine_id").on(table.medicineId),
    index("idx_sale_item_batch_id").on(table.batchId)
  ]
);

```


#### 9.1.7 `invoices.ts` — facturación


> **invoices.ts — invoice con numeración única por tienda**  
> Ruta: `backend-fastify/src/db/schema/invoices.ts`  
>
```typescript
import {
  pgTable,
  text,
  timestamp,
  uuid,
  numeric,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { store } from "./auth";
import { sale } from "./sales";
import { client } from "./clients";

export const invoice = pgTable("invoice", {
  id: uuid("id").primaryKey(),
  number: text("number").notNull(),
  invoiceType: text("invoice_type").notNull().default("ticket"),
  saleId: uuid("sale_id").references(() => sale.id).notNull(),
  clientId: uuid("client_id").references(() => client.id),
  clientName: text("client_name"),
  clientDocument: text("client_document"),
  clientAddress: text("client_address"),
  clientPhone: text("client_phone"),
  clientEmail: text("client_email"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("emitida"),
  cancelledAt: timestamp("cancelled_at", {
    withTimezone: true
  }),
  cancelledBy: text("cancelled_by"),
  issuedBy: text("issued_by"),
  storeId: uuid("store_id").references(() => store.id).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true
  }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true
  }).notNull().defaultNow().$onUpdate(() => new Date())
},
  (table) => [
    uniqueIndex("uq_invoice_store_number").on(table.storeId, table.number),
    index("idx_invoice_sale_id").on(table.saleId),
    index("idx_invoice_client_id").on(table.clientId),
    index("idx_invoice_invoice_type").on(table.invoiceType),
    index("idx_invoice_store_created_at").on(table.storeId, table.createdAt)
  ]
);

```


#### 9.1.8 `prescriptions.ts` — recetas médicas


> **prescriptions.ts — prescription y prescription_item (control de dispensación)**  
> Ruta: `backend-fastify/src/db/schema/prescriptions.ts`  
>
```typescript
import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { store } from "./auth";
import { client } from "./clients";
import { medicine } from "./catalog";

export const prescription = pgTable("prescription", {
  id: uuid("id").primaryKey(),
  number: text("number").notNull(),
  doctorName: text("doctor_name"),
  medicalCenter: text("medical_center"),
  issueDate: timestamp("issue_date", {
    withTimezone: true
  }),
  expiryDate: timestamp("expiry_date", {
    withTimezone: true
  }),
  image: text("image"),
  notes: text("notes"),
  status: text("status").notNull().default("pendiente"),
  validatedBy: text("validated_by"),
  validatedAt: timestamp("validated_at", {
    withTimezone: true
  }),
  clientId: uuid("client_id").references(() => client.id, { onDelete: "set null" }),
  storeId: uuid("store_id").references(() => store.id).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true
  }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true
  }).notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", {
    withTimezone: true
  })
},
  (table) => [
    uniqueIndex("uq_prescription_store_number").on(table.storeId, table.number),
    index("idx_prescription_status").on(table.status),
    index("idx_prescription_client_id").on(table.clientId),
    index("idx_prescription_store_created_at").on(table.storeId, table.createdAt),
    index("idx_prescription_store_status").on(table.storeId, table.status),
    index("idx_prescription_store_expiry_date").on(table.storeId, table.expiryDate)
  ]
);

export const prescriptionItem = pgTable("prescription_item", {
  id: uuid("id").primaryKey(),
  prescriptionId: uuid("prescription_id").references(() => prescription.id, { onDelete: "cascade" }).notNull(),
  medicineId: uuid("medicine_id").references(() => medicine.id).notNull(),
  medicineName: text("medicine_name").notNull(),
  quantity: integer("quantity").notNull(),
  authorizedQuantity: integer("authorized_quantity").notNull().default(0),
  authorizedBy: text("authorized_by"),
  createdAt: timestamp("created_at", {
    withTimezone: true
  }).notNull().defaultNow()
},
  (table) => [
    index("idx_prescription_item_prescription_id").on(table.prescriptionId),
    index("idx_prescription_item_medicine_id").on(table.medicineId)
  ]
);

```


#### 9.1.9 `printers.ts` — impresoras y trabajos de impresión


> **printers.ts — printer, printer_assignment, print_job**  
> Ruta: `backend-fastify/src/db/schema/printers.ts`  
>
```typescript
import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
  integer,
  bytea
} from "drizzle-orm/pg-core";
import { store } from "./auth";
import { sale } from "./sales";
import { category } from "./catalog";

export const printerConnTypeEnum = pgEnum("PRINTER_CONN_TYPE", [
  "net",
  "usb",
  "bluetooth",
]);

export const printerProfileEnum = pgEnum("PRINTER_PROFILE", [
  "escpos",
  "star_line",
]);

export const printerStatusEnum = pgEnum("PRINTER_STATUS", [
  "unknown",
  "online",
  "offline",
  "error",
  "out_of_paper",
]);

export const printer = pgTable("printer", {
  id: uuid("id").primaryKey(),
  storeId: uuid("store_id").references(() => store.id).notNull(),
  name: text("name").notNull(),
  connectionType: printerConnTypeEnum("connection_type").notNull(),
  address: text("address").notNull(),
  port: integer("port"),
  paperWidth: integer("paper_width").notNull(),
  profile: printerProfileEnum("profile").notNull().default("escpos"),
  codepage: text("codepage").notNull().default("PC850"),
  autoCut: boolean("auto_cut").notNull().default(true),
  cutType: text("cut_type"),
  openCashDrawer: boolean("open_cash_drawer").notNull().default(false),
  defaultCopies: integer("default_copies").notNull().default(1),
  role: text("role").notNull().default("receipt"),
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  lastStatus: printerStatusEnum("last_status").notNull().default("unknown"),
  lastSeenAt: timestamp("last_seen_at", {
    withTimezone: true
  }),
  createdAt: timestamp("created_at", {
    withTimezone: true
  }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true
  }).notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", {
    withTimezone: true
  })
},
  (table) => [
    uniqueIndex("uq_printer_store_name").on(table.storeId, table.name),
    index("idx_printer_store_is_active").on(table.storeId, table.isActive),
    index("idx_printer_store_is_default").on(table.storeId, table.isDefault)
  ]
);

export const printerAssignment = pgTable("printer_assignment", {
  id: uuid("id").primaryKey(),
  printerId: uuid("printer_id").references(() => printer.id, { onDelete: "cascade" }).notNull(),
  categoryId: uuid("category_id").references(() => category.id),
  role: text("role").notNull().default("receipt"),
  priority: integer("priority").notNull().default(0)
},
  (table) => [
    uniqueIndex("uq_printer_assignment_printer_category").on(table.printerId, table.categoryId),
    index("idx_printer_assignment_printer_id").on(table.printerId),
    index("idx_printer_assignment_category_id").on(table.categoryId)
  ]
);

export const printJob = pgTable("print_job", {
  id: uuid("id").primaryKey(),
  printerId: uuid("printer_id").references(() => printer.id, { onDelete: "cascade" }).notNull(),
  saleId: uuid("sale_id").references(() => sale.id),
  payload: bytea("payload").notNull(),
  status: text("status").notNull().default("pending"),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  errorMsg: text("error_msg"),
  enqueuedAt: timestamp("enqueued_at", {
    withTimezone: true
  }).notNull().defaultNow(),
  sentAt: timestamp("sent_at", {
    withTimezone: true
  }),
  finishedAt: timestamp("finished_at", {
    withTimezone: true
  })
},
  (table) => [
    index("idx_print_job_printer_status").on(table.printerId, table.status),
    index("idx_print_job_status_enqueued_at").on(table.status, table.enqueuedAt),
    index("idx_print_job_sale_id").on(table.saleId)
  ]
);

```


### 9.2 Relaciones entre tablas

```
store 1─N users 1─N session
store 1─N category 1─N medicine
store 1─N supplier 1─N medicine
store 1─N client 1─N sale
store 1─N prescription 1─N prescription_item 1─N sale
store 1─N medicine 1─N inventory_movement
store 1─N medicine 1─N batch (lotes)
store 1─N purchase 1─N purchase_item → genera batch (recepción)
store 1─N sale 1─N sale_item → stock/batch (descuento de inventario)
store 1─N sale 1─N invoice (fiscal)
store 1─N printer 1─N print_job
```

### 9.3 Migraciones (`drizzle/`)

Las migraciones son archivos SQL versionados, una carpeta por migración (timestamp + nombre autogenerado). Cada carpeta contiene `migration.sql` (lo que se aplica a la DB) y `snapshot.json` (estado del schema, **artefacto interno de drizzle-kit — no se edita a mano**).

Las 5 migraciones existentes:

| Migración | Tipo | Contenido |
|---|---|---|
| `20260812173020_init` | creación | Todas las tablas del sistema, tipos ENUM `ROLE` y `UNIT_TYPE`, índices y FKs (el grueso del modelo) |
| `20260812175530_slimy_turbo` | tabla | Tabla `invoice` + índice único `uq_invoice_store_number` + FK sobre `sale` y `client` |
| `20260812180009_youthful_bruce_banner` | índice | Índice adicional `idx_sale_store_status_created_at` sobre `sale` |
| `20260812181508_brief_the_santerians` | tabla+enum | Tablas `printer`, `printer_assignment`, `print_job` + enums `PRINTER_CONN_TYPE`, `PRINTER_PROFILE`, `PRINTER_STATUS` |
| `20260908030753_curious_bloodscream` | fix | `RENAME COLUMN` en `account`: `acess_token → access_token` y `refres_token_expirest_at → refresh_token_expires_at` (typos originales corregidos) |

El SQL completo de cada una:


> **20260812173020_init — esquema inicial completo**  
> Ruta: `backend-fastify/drizzle/20260812173020_init/migration.sql`  
>
```sql
CREATE TYPE "ROLE" AS ENUM('admin', 'farmaceutico', 'cajero', 'bodeguero');--> statement-breakpoint
CREATE TYPE "UNIT_TYPE" AS ENUM('unidad', 'paquete', 'caja', 'frasco', 'tubo', 'sobre', 'blister', 'ampolleta', 'gotero', 'aerosol', 'crema', 'jarabe', 'tableta', 'capsula', 'botella', 'bolsa');--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid,
	"acess_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refres_token_expirest_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY,
	"expires_at" timestamp,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store" (
	"id" uuid PRIMARY KEY,
	"name" text NOT NULL,
	"address" text,
	"phone" text,
	"ruc" text,
	"email" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"phone" text,
	"image" text,
	"role" "ROLE" DEFAULT 'cajero'::"ROLE" NOT NULL,
	"store_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" uuid PRIMARY KEY,
	"name" text NOT NULL,
	"description" text,
	"store_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "medicine" (
	"id" uuid PRIMARY KEY,
	"barcode" text,
	"internal_code" text,
	"commercial_name" text NOT NULL,
	"generic_name" text,
	"active_ingredient" text,
	"concentration" text,
	"presentation" text,
	"pharmaceutical_form" text,
	"laboratory" text,
	"category_id" uuid,
	"supplier_id" uuid,
	"unit_type" "UNIT_TYPE",
	"unit_quantity" integer,
	"purchase_price" numeric(10,2) DEFAULT '0' NOT NULL,
	"sale_price" numeric(10,2) NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer DEFAULT 5 NOT NULL,
	"requires_prescription" boolean DEFAULT false NOT NULL,
	"is_controlled" boolean DEFAULT false NOT NULL,
	"image" text,
	"active" boolean DEFAULT true NOT NULL,
	"store_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "supplier" (
	"id" uuid PRIMARY KEY,
	"name" text NOT NULL,
	"company" text,
	"ruc" text,
	"contact_name" text,
	"email" text,
	"phone" text,
	"address" text,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"store_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "client" (
	"id" uuid PRIMARY KEY,
	"full_name" text NOT NULL,
	"document_type" text DEFAULT 'cedula' NOT NULL,
	"document_number" text,
	"phone" text,
	"email" text,
	"address" text,
	"birth_date" timestamp with time zone,
	"sex" text,
	"allergies" text,
	"chronic_diseases" text,
	"observations" text,
	"is_frequent" boolean DEFAULT false NOT NULL,
	"store_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "prescription" (
	"id" uuid PRIMARY KEY,
	"number" text NOT NULL,
	"doctor_name" text,
	"medical_center" text,
	"issue_date" timestamp with time zone,
	"expiry_date" timestamp with time zone,
	"image" text,
	"notes" text,
	"status" text DEFAULT 'pendiente' NOT NULL,
	"validated_by" text,
	"validated_at" timestamp with time zone,
	"client_id" uuid,
	"store_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "prescription_item" (
	"id" uuid PRIMARY KEY,
	"prescription_id" uuid NOT NULL,
	"medicine_id" uuid NOT NULL,
	"medicine_name" text NOT NULL,
	"quantity" integer NOT NULL,
	"authorized_quantity" integer DEFAULT 0 NOT NULL,
	"authorized_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase" (
	"id" uuid PRIMARY KEY,
	"number" text NOT NULL,
	"status" text DEFAULT 'borrador' NOT NULL,
	"supplier_id" uuid,
	"expected_date" timestamp with time zone,
	"notes" text,
	"total" numeric(10,2) DEFAULT '0' NOT NULL,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"received_by" text,
	"received_at" timestamp with time zone,
	"user_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_item" (
	"id" uuid PRIMARY KEY,
	"purchase_id" uuid NOT NULL,
	"medicine_id" uuid NOT NULL,
	"medicine_name" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_cost" numeric(10,2) NOT NULL,
	"line_total" numeric(10,2) NOT NULL,
	"received" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batch" (
	"id" uuid PRIMARY KEY,
	"batch_number" text NOT NULL,
	"medicine_id" uuid NOT NULL,
	"purchase_id" uuid,
	"supplier_id" uuid,
	"manufacture_date" timestamp with time zone,
	"expiry_date" timestamp with time zone NOT NULL,
	"initial_quantity" integer DEFAULT 0 NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"unit_cost" numeric(10,2),
	"notes" text,
	"user_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_movement" (
	"id" uuid PRIMARY KEY,
	"medicine_id" uuid NOT NULL,
	"movement_type" text NOT NULL,
	"quantity" integer NOT NULL,
	"note" text,
	"batch_id" uuid,
	"user_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale" (
	"id" uuid PRIMARY KEY,
	"subtotal" numeric(10,2) NOT NULL,
	"total" numeric(10,2) NOT NULL,
	"payment_method" text NOT NULL,
	"amount_received" numeric(10,2),
	"change_given" numeric(10,2),
	"status" text DEFAULT 'completada' NOT NULL,
	"cancellation_reason" text,
	"cancelled_at" timestamp with time zone,
	"cancelled_by" text,
	"user_id" uuid NOT NULL,
	"user_name" text,
	"client_id" uuid,
	"prescription_id" uuid,
	"store_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale_item" (
	"id" uuid PRIMARY KEY,
	"sale_id" uuid NOT NULL,
	"medicine_id" uuid NOT NULL,
	"medicine_name" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10,2) NOT NULL,
	"line_total" numeric(10,2) NOT NULL,
	"batch_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_session_token" ON "session" ("token");--> statement-breakpoint
CREATE INDEX "idx_session_user_id" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_store_name" ON "store" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_users_store_email" ON "users" ("store_id","email");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" ("email");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" ("role");--> statement-breakpoint
CREATE INDEX "idx_users_store_id" ON "users" ("store_id");--> statement-breakpoint
CREATE INDEX "idx_users_store_id_deleted_at" ON "users" ("store_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_verification_identifier_expires_at" ON "verification" ("identifier","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_category_store_name" ON "category" ("store_id","name");--> statement-breakpoint
CREATE INDEX "idx_category_name" ON "category" ("name");--> statement-breakpoint
CREATE INDEX "idx_category_deleted_at" ON "category" ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_category_store_id" ON "category" ("store_id");--> statement-breakpoint
CREATE INDEX "idx_medicine_barcode" ON "medicine" ("barcode");--> statement-breakpoint
CREATE INDEX "idx_medicine_commercial_name" ON "medicine" ("commercial_name");--> statement-breakpoint
CREATE INDEX "idx_medicine_generic_name" ON "medicine" ("generic_name");--> statement-breakpoint
CREATE INDEX "idx_medicine_active_ingredient" ON "medicine" ("active_ingredient");--> statement-breakpoint
CREATE INDEX "idx_medicine_category_id" ON "medicine" ("category_id");--> statement-breakpoint
CREATE INDEX "idx_medicine_supplier_id" ON "medicine" ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_medicine_requires_prescription" ON "medicine" ("requires_prescription");--> statement-breakpoint
CREATE INDEX "idx_medicine_is_controlled" ON "medicine" ("is_controlled");--> statement-breakpoint
CREATE INDEX "idx_medicine_active" ON "medicine" ("active");--> statement-breakpoint
CREATE INDEX "idx_medicine_store_id" ON "medicine" ("store_id");--> statement-breakpoint
CREATE INDEX "idx_medicine_store_deleted_at" ON "medicine" ("store_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_medicine_store_commercial_name" ON "medicine" ("store_id","commercial_name");--> statement-breakpoint
CREATE INDEX "idx_supplier_name" ON "supplier" ("name");--> statement-breakpoint
CREATE INDEX "idx_supplier_is_active" ON "supplier" ("is_active");--> statement-breakpoint
CREATE INDEX "idx_supplier_store_name" ON "supplier" ("store_id","name");--> statement-breakpoint
CREATE INDEX "idx_supplier_store_deleted_at" ON "supplier" ("store_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_client_full_name" ON "client" ("full_name");--> statement-breakpoint
CREATE INDEX "idx_client_document_number" ON "client" ("document_number");--> statement-breakpoint
CREATE INDEX "idx_client_phone" ON "client" ("phone");--> statement-breakpoint
CREATE INDEX "idx_client_store_id" ON "client" ("store_id");--> statement-breakpoint
CREATE INDEX "idx_client_store_deleted_at" ON "client" ("store_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_client_store_full_name" ON "client" ("store_id","full_name");--> statement-breakpoint
CREATE INDEX "idx_client_store_is_frequent" ON "client" ("store_id","is_frequent");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_prescription_store_number" ON "prescription" ("store_id","number");--> statement-breakpoint
CREATE INDEX "idx_prescription_status" ON "prescription" ("status");--> statement-breakpoint
CREATE INDEX "idx_prescription_client_id" ON "prescription" ("client_id");--> statement-breakpoint
CREATE INDEX "idx_prescription_store_created_at" ON "prescription" ("store_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_prescription_store_status" ON "prescription" ("store_id","status");--> statement-breakpoint
CREATE INDEX "idx_prescription_store_expiry_date" ON "prescription" ("store_id","expiry_date");--> statement-breakpoint
CREATE INDEX "idx_prescription_item_prescription_id" ON "prescription_item" ("prescription_id");--> statement-breakpoint
CREATE INDEX "idx_prescription_item_medicine_id" ON "prescription_item" ("medicine_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_purchase_store_number" ON "purchase" ("store_id","number");--> statement-breakpoint
CREATE INDEX "idx_purchase_status" ON "purchase" ("status");--> statement-breakpoint
CREATE INDEX "idx_purchase_supplier_id" ON "purchase" ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_store_created_at" ON "purchase" ("store_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_purchase_store_status" ON "purchase" ("store_id","status");--> statement-breakpoint
CREATE INDEX "idx_purchase_item_purchase_id" ON "purchase_item" ("purchase_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_item_medicine_id" ON "purchase_item" ("medicine_id");--> statement-breakpoint
CREATE INDEX "idx_batch_medicine_id" ON "batch" ("medicine_id");--> statement-breakpoint
CREATE INDEX "idx_batch_expiry_date" ON "batch" ("expiry_date");--> statement-breakpoint
CREATE INDEX "idx_batch_store_expiry_date" ON "batch" ("store_id","expiry_date");--> statement-breakpoint
CREATE INDEX "idx_batch_store_created_at" ON "batch" ("store_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_inventory_movement_medicine_id" ON "inventory_movement" ("medicine_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_movement_batch_id" ON "inventory_movement" ("batch_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_movement_store_created_at" ON "inventory_movement" ("store_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_inventory_movement_store_movement_type" ON "inventory_movement" ("store_id","movement_type");--> statement-breakpoint
CREATE INDEX "idx_inventory_movement_store_medicine_created_at" ON "inventory_movement" ("store_id","medicine_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_sale_user_id" ON "sale" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sale_client_id" ON "sale" ("client_id");--> statement-breakpoint
CREATE INDEX "idx_sale_status" ON "sale" ("status");--> statement-breakpoint
CREATE INDEX "idx_sale_store_created_at" ON "sale" ("store_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_sale_store_payment_created_at" ON "sale" ("store_id","payment_method","created_at");--> statement-breakpoint
CREATE INDEX "idx_sale_store_prescription_id" ON "sale" ("store_id","prescription_id");--> statement-breakpoint
CREATE INDEX "idx_sale_item_sale_id" ON "sale_item" ("sale_id");--> statement-breakpoint
CREATE INDEX "idx_sale_item_medicine_id" ON "sale_item" ("medicine_id");--> statement-breakpoint
CREATE INDEX "idx_sale_item_batch_id" ON "sale_item" ("batch_id");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_store_id_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id");--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_store_id_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id");--> statement-breakpoint
ALTER TABLE "medicine" ADD CONSTRAINT "medicine_category_id_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id");--> statement-breakpoint
ALTER TABLE "medicine" ADD CONSTRAINT "medicine_supplier_id_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier"("id");--> statement-breakpoint
ALTER TABLE "medicine" ADD CONSTRAINT "medicine_store_id_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id");--> statement-breakpoint
ALTER TABLE "supplier" ADD CONSTRAINT "supplier_store_id_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id");--> statement-breakpoint
ALTER TABLE "client" ADD CONSTRAINT "client_store_id_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id");--> statement-breakpoint
ALTER TABLE "prescription" ADD CONSTRAINT "prescription_client_id_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "prescription" ADD CONSTRAINT "prescription_store_id_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id");--> statement-breakpoint
ALTER TABLE "prescription_item" ADD CONSTRAINT "prescription_item_prescription_id_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescription"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "prescription_item" ADD CONSTRAINT "prescription_item_medicine_id_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicine"("id");--> statement-breakpoint
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_supplier_id_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier"("id");--> statement-breakpoint
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_store_id_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id");--> statement-breakpoint
ALTER TABLE "purchase_item" ADD CONSTRAINT "purchase_item_purchase_id_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "purchase"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "purchase_item" ADD CONSTRAINT "purchase_item_medicine_id_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicine"("id");--> statement-breakpoint
ALTER TABLE "batch" ADD CONSTRAINT "batch_medicine_id_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicine"("id");--> statement-breakpoint
ALTER TABLE "batch" ADD CONSTRAINT "batch_purchase_id_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "purchase"("id");--> statement-breakpoint
ALTER TABLE "batch" ADD CONSTRAINT "batch_supplier_id_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier"("id");--> statement-breakpoint
ALTER TABLE "batch" ADD CONSTRAINT "batch_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "batch" ADD CONSTRAINT "batch_store_id_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id");--> statement-breakpoint
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_medicine_id_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicine"("id");--> statement-breakpoint
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_batch_id_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batch"("id");--> statement-breakpoint
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_store_id_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id");--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_client_id_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id");--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_prescription_id_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescription"("id");--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_store_id_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id");--> statement-breakpoint
ALTER TABLE "sale_item" ADD CONSTRAINT "sale_item_sale_id_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sale"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sale_item" ADD CONSTRAINT "sale_item_medicine_id_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicine"("id");--> statement-breakpoint
ALTER TABLE "sale_item" ADD CONSTRAINT "sale_item_batch_id_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batch"("id");
```



> **20260812175530_slimy_turbo — tabla invoice**  
> Ruta: `backend-fastify/drizzle/20260812175530_slimy_turbo/migration.sql`  
>
```sql
CREATE TABLE "invoice" (
	"id" uuid PRIMARY KEY,
	"number" text NOT NULL,
	"invoice_type" text DEFAULT 'ticket' NOT NULL,
	"sale_id" uuid NOT NULL,
	"client_id" uuid,
	"client_name" text,
	"client_document" text,
	"client_address" text,
	"client_phone" text,
	"client_email" text,
	"subtotal" numeric(10,2) NOT NULL,
	"total" numeric(10,2) NOT NULL,
	"status" text DEFAULT 'emitida' NOT NULL,
	"cancelled_at" timestamp with time zone,
	"cancelled_by" text,
	"issued_by" text,
	"store_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_invoice_store_number" ON "invoice" ("store_id","number");--> statement-breakpoint
CREATE INDEX "idx_invoice_sale_id" ON "invoice" ("sale_id");--> statement-breakpoint
CREATE INDEX "idx_invoice_client_id" ON "invoice" ("client_id");--> statement-breakpoint
CREATE INDEX "idx_invoice_invoice_type" ON "invoice" ("invoice_type");--> statement-breakpoint
CREATE INDEX "idx_invoice_store_created_at" ON "invoice" ("store_id","created_at");--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_sale_id_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sale"("id");--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_client_id_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id");--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_store_id_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id");
```



> **20260812180009_youthful_bruce_banner — índice sobre sale**  
> Ruta: `backend-fastify/drizzle/20260812180009_youthful_bruce_banner/migration.sql`  
>
```sql
CREATE INDEX "idx_sale_store_status_created_at" ON "sale" ("store_id","status","created_at");
```



> **20260812181508_brief_the_santerians — módulo printers**  
> Ruta: `backend-fastify/drizzle/20260812181508_brief_the_santerians/migration.sql`  
>
```sql
CREATE TYPE "PRINTER_CONN_TYPE" AS ENUM('net', 'usb', 'bluetooth');--> statement-breakpoint
CREATE TYPE "PRINTER_PROFILE" AS ENUM('escpos', 'star_line');--> statement-breakpoint
CREATE TYPE "PRINTER_STATUS" AS ENUM('unknown', 'online', 'offline', 'error', 'out_of_paper');--> statement-breakpoint
CREATE TABLE "print_job" (
	"id" uuid PRIMARY KEY,
	"printer_id" uuid NOT NULL,
	"sale_id" uuid,
	"payload" bytea NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"error_msg" text,
	"enqueued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "printer" (
	"id" uuid PRIMARY KEY,
	"store_id" uuid NOT NULL,
	"name" text NOT NULL,
	"connection_type" "PRINTER_CONN_TYPE" NOT NULL,
	"address" text NOT NULL,
	"port" integer,
	"paper_width" integer NOT NULL,
	"profile" "PRINTER_PROFILE" DEFAULT 'escpos'::"PRINTER_PROFILE" NOT NULL,
	"codepage" text DEFAULT 'PC850' NOT NULL,
	"auto_cut" boolean DEFAULT true NOT NULL,
	"cut_type" text,
	"open_cash_drawer" boolean DEFAULT false NOT NULL,
	"default_copies" integer DEFAULT 1 NOT NULL,
	"role" text DEFAULT 'receipt' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_status" "PRINTER_STATUS" DEFAULT 'unknown'::"PRINTER_STATUS" NOT NULL,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "printer_assignment" (
	"id" uuid PRIMARY KEY,
	"printer_id" uuid NOT NULL,
	"category_id" uuid,
	"role" text DEFAULT 'receipt' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_print_job_printer_status" ON "print_job" ("printer_id","status");--> statement-breakpoint
CREATE INDEX "idx_print_job_status_enqueued_at" ON "print_job" ("status","enqueued_at");--> statement-breakpoint
CREATE INDEX "idx_print_job_sale_id" ON "print_job" ("sale_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_printer_store_name" ON "printer" ("store_id","name");--> statement-breakpoint
CREATE INDEX "idx_printer_store_is_active" ON "printer" ("store_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_printer_store_is_default" ON "printer" ("store_id","is_default");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_printer_assignment_printer_category" ON "printer_assignment" ("printer_id","category_id");--> statement-breakpoint
CREATE INDEX "idx_printer_assignment_printer_id" ON "printer_assignment" ("printer_id");--> statement-breakpoint
CREATE INDEX "idx_printer_assignment_category_id" ON "printer_assignment" ("category_id");--> statement-breakpoint
ALTER TABLE "print_job" ADD CONSTRAINT "print_job_printer_id_printer_id_fkey" FOREIGN KEY ("printer_id") REFERENCES "printer"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "print_job" ADD CONSTRAINT "print_job_sale_id_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sale"("id");--> statement-breakpoint
ALTER TABLE "printer" ADD CONSTRAINT "printer_store_id_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id");--> statement-breakpoint
ALTER TABLE "printer_assignment" ADD CONSTRAINT "printer_assignment_printer_id_printer_id_fkey" FOREIGN KEY ("printer_id") REFERENCES "printer"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "printer_assignment" ADD CONSTRAINT "printer_assignment_category_id_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id");
```



> **20260908030753_curious_bloodscream — fix de columnas typos**  
> Ruta: `backend-fastify/drizzle/20260908030753_curious_bloodscream/migration.sql`  
>
```sql
ALTER TABLE "account" RENAME COLUMN "acess_token" TO "access_token";--> statement-breakpoint
ALTER TABLE "account" RENAME COLUMN "refres_token_expirest_at" TO "refresh_token_expires_at";
```


### 9.4 Configuración del ORM


> **drizzle.config.ts — configuración completa de drizzle-kit**  
> Ruta: `backend-fastify/drizzle.config.ts`  
>
```typescript
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

```


### 9.5 Consideraciones de diseño de la DB

1. **Dinero como `numeric(10,2)`** — nunca `float`; el string de Postgres se convierte con `Number()` en los mappers (los `mapRowToEntity` de cada repositorio).
2. **2 tipos ENUM reales** (`ROLE`, `UNIT_TYPE`) y **4 más para printers** (`PRINTER_CONN_TYPE`, `PRINTER_PROFILE`, `PRINTER_STATUS`). El resto de "enums" de negocio (status de sale, purchase, prescription, movement_type, payment_method, invoice_type, printer role) se modelan como `text` + validación Zod en la API (más flexible para iterar).
3. **Índices compuestos clave**: `uq_users_store_email`, `uq_category_store_name`, `uq_invoice_store_number`, `uq_prescription_store_number`, `uq_purchase_store_number`, `uq_printer_store_name` — casi todas las unicidades son **por tienda** (multi-tenant).
4. **Cascadas**: `sale_item → sale` (CASCADE), `purchase_item → purchase` (CASCADE), `prescription_item → prescription` (CASCADE), `print_job → printer` (CASCADE), `printer_assignment → printer` (CASCADE); `prescription.client_id → client` (SET NULL).
5. **`account` es un vestigio de Better Auth / auth.js**: se crea pero **no se usa** en el flujo actual (el login es por email+password contra `users` con bcrypt y JWT propio). Las columnas `acess_token`/`refres_token_expirest_at` tenían typos y se corrigieron con la migración 5.

## 10. Dominio: cómo se modela un módulo

Todos los módulos siguen el mismo patrón de carpetas. Tomar un módulo cualquiera (`modules/medicines/`) y vas a encontrar exactamente esta anatomía:

```
modules/<nombre>/
├── domain/
│   ├── <nombre>.entities.ts      # Tipos de ENTIDAD (filas crudas, 1:1 con la tabla)
│   ├── <nombre>.interface.ts     # Contrato del REPOSITORIO (métodos de acceso a datos)
│   └── <nombre>.types.ts         # Tipos de dominio puro: enums, vocabulario de negocio
├── application/
│   ├── <nombre>.service.ts       # Reglas de negocio (factory: recibe repositorio + mappers)
│   └── common/<nombre>.mappers.ts# Conversión entidad → DTO de respuesta al cliente
├── infrastructure/
│   ├── <nombre>.drizzle.repository.ts  # Implementación del repositorio con Drizzle
│   └── (adaptadores extra: escpos/, feature/, mappers/)
├── presentation/
│   ├── <nombre>.controller.ts    # Handlers HTTP: reciben request, llaman al service
│   ├── <nombre>.dto.ts           # Esquemas Zod de validación de entrada/salida
│   └── <nombre>.routes.ts        # Plugin Fastify que define las rutas + guards
└── __tests__/
    └── <nombre>.service.test.ts  # Tests de servicio con repositorio mockeado
```

### 10.1 Contratos (domain)

- **Entities**: representan la fila tal cual sale de la base (mismas columnas, snake_case en TS). Son el *shape de persistencia*.
- **Interface**: el repositorio que el servicio necesita. En el servicio **solo se conoce la interfaz** — la implementación Drizzle se inyecta desde `routes.ts` al construir el service.
- **Types**: enums de negocio (`MedicineStatus`, `SaleStatus`, `MovementType`…), payloads de creación/actualización y DTOs de respuesta.

### 10.2 Reglas de negocio (application)

Los services son **factories**: `createXService(repository, ...deps)` devuelve un objeto con los casos de uso. Nunca instancian su propio repositorio. Esto es lo que permite testear con mocks sin tocar la base.

Los mappers (`application/common/`) reciben la entidad cruda y devuelven el DTO que se manda al cliente — ahí vive la conversión de `numeric` string→number y la proyección de campos.

### 10.3 Implementación (infrastructure)

Los repositorios Drizzle usan el `db` de `@/index` (import directo) y escriben consultas tipadas. Patrones recurrentes:

- `mapRowToEntity(...)`: convierte tipos de Postgres (numeric → number, dates → string) a la entidad.
- Filtros **por tienda**: la mayoría de métodos recibe `storeId` y agrega `eq(table.storeId, storeId)`.
- **Soft delete**: `UPDATE ... SET deletedAt = now()`.
- **Transacciones**: `db.transaction(async (tx) => { ... })` con `tx.select().from(...).for("update")` para operaciones de concurrencia.

### 10.4 Presentación HTTP

- **DTOs (Zod)**: esquemas para validar body/params/query. El `errorHandler` global convierte `ZodError` en `400` con los mensajes por campo.
- **Controllers**: `async (request, reply) => {...}` — extraen los datos ya validados, llaman al service y responden. El error se deja caer al handler global.
- **Rutas**: cada `*.routes.ts` es un plugin Fastify con `onRequest: [authGuard, storeGuard]` (salvo auth/health), monta el controller y ocasionalmente define `request` types.

### 10.5 Inyección de dependencias (estilo funcional)

El armado ocurre en cada `presentation/<modulo>.routes.ts`, en el `onRegister`/`register` del plugin:

```typescript
// patrón típico (ejemplo ilustrativo del patrón, no un archivo del repo)
const repository = createXRepository(db)          // infra
const service = createXService(repository)         // application
const controller = createXController(service)      // presentation
```

Y todos los `buildApp()` de la app hacen `app.register(xRoutes)` desde `src/http/routes.ts`.

---

## 11. Módulo auth

**Propósito:** identidad, sesión y seguridad. Registro de usuario, login (email+password), refresh token rotativo, logout, verificación de email, recuperación de contraseña, gestión de sesiones activas y guards de autorización por rol + tienda.

### 11.1 Archivos del módulo

| Archivo | Rol |
|---|---|
| `domain/auth.types.ts` | Tipos de dominio: payloads de login/registro/refresh, `AuthResult`, `AuthSession` |
| `domain/auth.entities.ts` | Entidades de usuario/sesión/tienda/verificación |
| `domain/auth.interface.ts` | Contratos de repositorios: usuario, sesión, tienda, verificación |
| `application/auth.service.ts` | **El corazón**: register, login, refresh, logout, verify, forgot/reset password, sessions |
| `application/common/auth.crypto.ts` | bcrypt: hash/compare |
| `application/common/auth.token.ts` | jose: firma/verificación de JWT (access + refresh) |
| `application/common/auth.guard.ts` | Guards Fastify `authGuard`, `storeGuard`, `roleGuard` |
| `application/common/auth.mappers.ts` | Entidad → respuestas (usuario sanitizado, sesión) |
| `application/common/auth.utils.ts` | Helpers: filtrado de usuario seguro, etc. |
| `infrastructure/auth.repository.ts` | Agrega los repos de feature/ bajo una fachada `AuthRepository` |
| `infrastructure/feature/*.drizzle.repository.ts` | Implementaciones Drizzle por tabla |
| `infrastructure/mappers/auth.drizzle.mappers.ts` | Mapeo de filas → entidades |
| `presentation/auth.dto.ts` | Esquemas Zod de entrada/salida |
| `presentation/auth.controller.ts` | Handlers HTTP |
| `presentation/auth.routes.ts` | Rutas + plugin |
| `presentation/auth.http.ts` | Tipos de request extendidos (userId, storeId, role) |

### 11.2 Código completo

#### domain


> **auth.types.ts**  
> Ruta: `backend-fastify/src/modules/auth/domain/auth.types.ts`  
>
```typescript
export type Role = "admin" | "farmaceutico" | "cajero" | "bodeguero"

export interface IRegisterPayload {
  name: string
  email: string
  password: string
  role?: Role
}

export interface ILoginPayload {
  email: string
  password: string
}

export interface IVerifyEmailPayload {
  identifier: string
  code: string
}

export interface IForgotPasswordPayload {
  email: string
}

export interface IResetPasswordPayload {
  email: string
  code: string
  newPassword: string
}

export interface IStoreResponse {
  id: string
  name: string
  address?: string
  phone?: string
}

export interface IUserResponse {
  id: string
  name: string
  email: string
  email_verified: boolean
  role: Role
  phone?: string
  image?: string
  store_id: string
  created_at: Date
  updated_at: Date
}

export interface IAuthResponse {
  message: string
  user: IUserResponse
  store: IStoreResponse
  accessToken: string
  refreshToken: string
}

export interface IRefreshResponse {
  message: string
  user: IUserResponse
  store: IStoreResponse
  accessToken: string
  refreshToken: string
}

export interface IVerificationResponse {
  message: string
  expiresAt: Date
}

export interface ILogoutResponse {
  message: string
}

export interface ISessionResponse {
  id: string
  expires_at: Date
  ip_address?: string
  user_agent?: string
  created_at: Date
  updated_at: Date
}

export interface IUserSessionsResponse {
  sessions: ISessionResponse[]
}

export interface IVerifyEmailResponse {
  message: string
  accessToken: string
  refreshToken: string
}

export interface IForgotPasswordResponse {
  message: string
  expires_at: Date
}

export interface IResetPasswordResponse {
  message: string
}

// ─── Register Store ───
export interface IRegisterStorePayload {
  storeName: string
  storeAddress?: string
  storePhone?: string
  adminName: string
  adminEmail: string
  adminPassword: string
}

export interface IRegisterStoreResponse {
  message: string
  user: IUserResponse
  store: IStoreResponse
  accessToken: string
  refreshToken: string
}

```



> **auth.entities.ts**  
> Ruta: `backend-fastify/src/modules/auth/domain/auth.entities.ts`  
>
```typescript
import { Role } from "./auth.types"

export interface IUserEntity {
  id: string
  name: string
  email: string
  email_verified: boolean
  phone?: string
  image?: string
  role: Role
  store_id: string
  created_at: Date
  updated_at: Date
  deleted_at?: Date
}

export interface IAccountEntity {
  id: string
  account_id: string
  provider_id: string
  user_id?: string
  access_token?: string
  refresh_token?: string
  id_token?: string
  access_token_expires_at?: Date
  refresh_token_expires_at?: Date
  scope?: string
  password?: string
  created_at: Date
  updated_at: Date
}

export interface ISessionEntity {
  id: string
  expires_at: Date
  token: string
  ip_address?: string
  user_agent?: string
  user_id: string
  created_at: Date
  updated_at: Date
}

export interface IVerificationEntity {
  id: string
  identifier: string
  value: string
  expires_at: Date
  created_at: Date
  updated_at: Date
}

export type CreateUserData = Pick<IUserEntity, "name" | "email" | "role" | "store_id"> & {
  phone?: string
  image?: string
  email_verified?: boolean
}

export type UpdateUserData = Partial<Pick<IUserEntity, "name" | "phone" | "image" | "role" | "email_verified">>

export type CreateAccountData = Pick<IAccountEntity, "account_id" | "provider_id"> & {
  user_id?: string
  access_token?: string
  refresh_token?: string
  id_token?: string
  access_token_expires_at?: Date
  refresh_token_expires_at?: Date
  scope?: string
  password?: string
}

export type CreateSessionData = {
  userId: string
  token: string
  expiresAt: Date
  ipAddress?: string
  userAgent?: string
}

export type CreateVerificationData = {
  identifier: string
  value: string
  expiresAt: Date
}

export type CreateStoreData = {
  name: string
  address?: string
  phone?: string
}

```



> **auth.interface.ts**  
> Ruta: `backend-fastify/src/modules/auth/domain/auth.interface.ts`  
>
```typescript
import type {
  IUserEntity,
  IAccountEntity,
  ISessionEntity,
  IVerificationEntity,
  CreateUserData,
  UpdateUserData,
  CreateAccountData,
  CreateSessionData,
  CreateVerificationData,
  CreateStoreData
} from "./auth.entities"
import { IStoreResponse } from "./auth.types"

export interface IUserRepository {
  findByEmail(email: string, storeId?: string): Promise<IUserEntity | null>
  findById(id: string): Promise<IUserEntity | null>
  create(data: CreateUserData): Promise<IUserEntity>
  update(id: string, data: UpdateUserData): Promise<IUserEntity>
  softDelete(id: string): Promise<void>
}

export interface IStoreRepository {
  getStoreInfo(storeId: string): Promise<IStoreResponse>
  findByName(name: string): Promise<IStoreResponse | null>
  create(data: CreateStoreData): Promise<IStoreResponse>
}

export interface IAccountRepository {
  findByProviderAndAccountId(providerId: string, accountId: string): Promise<IAccountEntity | null>
  findByUserId(userId: string): Promise<IAccountEntity[]>
  findCredentialsAccountByEmail(email: string): Promise<IAccountEntity | null>
  create(data: CreateAccountData): Promise<IAccountEntity>
  update(id: string, data: Partial<CreateAccountData>): Promise<IAccountEntity>
  delete(id: string): Promise<void>
  deleteByUserId(userId: string): Promise<void>
}

export interface ISessionRepository {
  create(data: CreateSessionData): Promise<ISessionEntity>
  findByToken(token: string): Promise<ISessionEntity | null>
  findByUserId(userId: string): Promise<ISessionEntity[]>
  delete(token: string): Promise<void>
  deleteByUserId(userId: string): Promise<void>
  deleteExpiredSessions(): Promise<number>
}

export interface IVerificationRepository {
  create(data: CreateVerificationData): Promise<IVerificationEntity>
  findByIdentifier(identifier: string): Promise<IVerificationEntity | null>
  findByIdentifierAndValue(identifier: string, value: string): Promise<IVerificationEntity | null>
  delete(id: string): Promise<void>
  deleteByIdentifier(identifier: string): Promise<void>
  deleteExpired(): Promise<number>
}

export interface IAuthRepository {
  user: IUserRepository,
  store: IStoreRepository,
  account: IAccountRepository,
  session: ISessionRepository,
  verification: IVerificationRepository
}

```


#### application


> **auth.service.ts — register, login, refresh, logout, verify, forgot/reset, sessions**  
> Ruta: `backend-fastify/src/modules/auth/application/auth.service.ts`  
>
```typescript
import { ConflictError, NotFoundError, UnauthorizedError } from "@/core/errors/AppError";
import { comparePassword, generateVerificationCode, hashPassword } from "./common/auth.crypto";
import { generateTokens, verifyToken } from "./common/auth.token";
import { IAuthRepository } from "../domain/auth.interface";
import {
  IAuthResponse,
  ILoginPayload,
  IRegisterPayload,
  IRegisterStorePayload,
  IRegisterStoreResponse,
  Role,
  IVerifyEmailPayload,
  IForgotPasswordPayload,
  IResetPasswordPayload,
  IUserSessionsResponse,
  ISessionResponse,
  IVerificationResponse,
  IVerifyEmailResponse,
  IForgotPasswordResponse,
  IResetPasswordResponse,
  IRefreshResponse,
  ILogoutResponse
} from "../domain/auth.types";
import { mapUserToResponse } from "./common/auth.mappers";
import { env } from "@/config/env";
import { logger } from "@/config/logger";
import type { IEmailSender } from "@/modules/email/domain/email.types";

const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000;
const VERIFICATION_CODE_EXPIRY = 15 * 60 * 1000;

export const createAuthService = (repository: IAuthRepository, emailSender: IEmailSender) => ({
  registerStore: async (
    data: IRegisterStorePayload,
  ): Promise<IRegisterStoreResponse> => {
    const { storeName, storeAddress, storePhone, adminName, adminEmail, adminPassword } = data;

    const existingStore = await repository.store.findByName(storeName);
    if (existingStore) {
      throw new ConflictError("A store with this name already exists");
    }

    const existingUser = await repository.user.findByEmail(adminEmail);
    if (existingUser) {
      throw new ConflictError("Email already registered");
    }

    const hashedPassword = await hashPassword(adminPassword);

    // 1. Create store
    const store = await repository.store.create({
      name: storeName,
      address: storeAddress,
      phone: storePhone,
    });

    // 2. Create admin user
    const user = await repository.user.create({
      name: adminName,
      email: adminEmail,
      role: "admin",
      email_verified: true,
      store_id: store.id,
    });

    // 3. Create credentials account with hashed password
    await repository.account.create({
      account_id: user.id,
      provider_id: "credentials",
      user_id: user.id,
      password: hashedPassword,
    });

    // 4. Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role as Role,
      storeId: store.id,
      storeName: store.name,
    });

    // 5. Persist refresh session
    await repository.session.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + SESSION_EXPIRY),
    });

    return {
      message: "Store created successfully",
      user: mapUserToResponse(user),
      store,
      accessToken,
      refreshToken,
    };
  },

  register: async (data: IRegisterPayload, storeId: string): Promise<IAuthResponse> => {
    const { name, email, password, role = "cajero" } = data;

    const existingUser = await repository.user.findByEmail(email, storeId);
    if (existingUser) {
      throw new ConflictError("Email already registered in this store");
    }

    const hashedPassword = await hashPassword(password);

    const user = await repository.user.create({
      name,
      email,
      role,
      email_verified: false,
      store_id: storeId,
    });

    await repository.account.create({
      account_id: user.id,
      provider_id: "credentials",
      user_id: user.id,
      password: hashedPassword,
    });

    const verificationCode = generateVerificationCode();
    await repository.verification.create({
      identifier: email,
      value: verificationCode,
      expiresAt: new Date(Date.now() + VERIFICATION_CODE_EXPIRY),
    });

    try {
      await emailSender.send({
        to: email,
        subject: "Verify your email",
        text: `Your verification code is: ${verificationCode}`,
      });
    } catch (error) {
      logger.warn({ error }, "Failed to send verification email");
    }

    const store = await repository.store.getStoreInfo(storeId);
    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role as Role,
      storeId: store.id,
      storeName: store.name,
    });

    await repository.session.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + SESSION_EXPIRY),
    });

    return {
      message: "User created successfully. Please verify your email.",
      user: mapUserToResponse(user),
      store,
      accessToken,
      refreshToken,
    };
  },

  login: async (data: ILoginPayload): Promise<IAuthResponse> => {
    const { email, password } = data
    const account = await repository.account.findCredentialsAccountByEmail(email)
    if (!account) throw new UnauthorizedError("Invalid credentials")

    if (!account.password) throw new UnauthorizedError("Invalid credentials")

    const isValidPassword = await comparePassword(password, account.password)
    if (!isValidPassword) throw new UnauthorizedError("Invalid credentials")

    const user = await repository.user.findById(account.user_id!)
    if (!user) throw new UnauthorizedError("User not found")

    if (user.deleted_at) throw new UnauthorizedError("Account has been deactivated")

    const store = await repository.store.getStoreInfo(user.store_id)

    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role as Role,
      storeId: store.id,
      storeName: store.name
    })

    await repository.session.create({
      userId: user.id,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + SESSION_EXPIRY)
    })

    return {
      message: "Login successfully",
      user: mapUserToResponse(user),
      store,
      accessToken,
      refreshToken: newRefreshToken
    }
  },

  logout: async (refreshToken: string): Promise<ILogoutResponse> => {
    await repository.session.delete(refreshToken)

    return {
      message: "Logged out successfully"
    }
  },

  refresh: async (refreshToken: string): Promise<IRefreshResponse> => {
    let payload: { userId: string }

    try {
      payload = verifyToken(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string }
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token")
    }

    const session = await repository.session.findByToken(refreshToken)
    if (!session) {
      throw new UnauthorizedError("Invalid refresh token")
    }

    if (session.expires_at < new Date()) {
      await repository.session.delete(refreshToken)
      throw new UnauthorizedError("Session expired")
    }

    const user = await repository.user.findById(payload.userId)
    if (!user) {
      throw new UnauthorizedError("User not found")
    }

    await repository.session.delete(refreshToken)

    const store = await repository.store.getStoreInfo(user.store_id)
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role as Role,
      storeId: store.id,
      storeName: store.name
    })

    await repository.session.create({
      userId: user.id,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + SESSION_EXPIRY)
    })

    return {
      message: "Token refreshed successfully",
      user: mapUserToResponse(user),
      store,
      accessToken,
      refreshToken: newRefreshToken
    }
  },

  verifyEmail: async (data: IVerifyEmailPayload): Promise<IVerifyEmailResponse> => {
    const { identifier, code } = data

    const verification = await repository.verification.findByIdentifierAndValue(
      identifier,
      code
    )

    if (!verification) {
      throw new UnauthorizedError("Invalid verification code")
    }

    if (verification.expires_at < new Date()) {
      await repository.verification.deleteByIdentifier(identifier)
      throw new UnauthorizedError("Verification code expired")
    }

    const user = await repository.user.findByEmail(identifier)
    if (!user) {
      throw new NotFoundError("User not found")
    }

    await repository.user.update(user.id, { email_verified: true })

    await repository.verification.deleteByIdentifier(identifier)

    const store = await repository.store.getStoreInfo(user.store_id)
    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role as Role,
      storeId: store.id,
      storeName: store.name
    })

    await repository.session.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + SESSION_EXPIRY)
    })

    return {
      message: "Email verified successfully",
      accessToken,
      refreshToken
    }
  },

  resendVerification: async (email: string): Promise<IVerificationResponse> => {
    const user = await repository.user.findByEmail(email)

    if (!user) {
      return {
        message: "If the email exists, a new verification code has been sent",
        expiresAt: new Date(Date.now() + VERIFICATION_CODE_EXPIRY)
      }
    }

    if (user.email_verified) {
      throw new ConflictError("Email already verified")
    }

    await repository.verification.deleteByIdentifier(email)

    const verificationCode = generateVerificationCode()
    await repository.verification.create({
      identifier: email,
      value: verificationCode,
      expiresAt: new Date(Date.now() + VERIFICATION_CODE_EXPIRY)
    })

    try {
      await emailSender.send({
        to: email,
        subject: "Verify your email",
        text: `Your new verification code is: ${verificationCode}`,
      });
    } catch (error) {
      logger.warn({ error }, "Failed to send verification email");
    }

    return {
      message: "New verification code sent",
      expiresAt: new Date(Date.now() + VERIFICATION_CODE_EXPIRY)
    }
  },

  forgotPassword: async (data: IForgotPasswordPayload): Promise<IForgotPasswordResponse> => {
    const { email } = data

    const user = await repository.user.findByEmail(email)
    if (!user) {
      return {
        message: "If the email exists, a reset code has been sent",
        expires_at: new Date(Date.now() + VERIFICATION_CODE_EXPIRY)
      }
    }

    const resetCode = generateVerificationCode()
    await repository.verification.create({
      identifier: `reset:${email}`,
      value: resetCode,
      expiresAt: new Date(Date.now() + VERIFICATION_CODE_EXPIRY)
    })

    try {
      await emailSender.send({
        to: email,
        subject: "Password reset code",
        text: `Your password reset code is: ${resetCode}`,
      });
    } catch (error) {
      logger.warn({ error }, "Failed to send password reset email");
    }

    return {
      message: "If the email exists, a reset code has been sent",
      expires_at: new Date(Date.now() + VERIFICATION_CODE_EXPIRY)
    }
  },

  resetPassword: async (data: IResetPasswordPayload): Promise<IResetPasswordResponse> => {
    const { email, code, newPassword } = data

    const verification = await repository.verification.findByIdentifierAndValue(
      `reset:${email}`,
      code
    )

    if (!verification) {
      throw new UnauthorizedError("Invalid reset code")
    }

    if (verification.expires_at < new Date()) {
      await repository.verification.deleteByIdentifier(`reset:${email}`)
      throw new UnauthorizedError("Reset code expired")
    }

    const user = await repository.user.findByEmail(email)
    if (!user) {
      throw new NotFoundError("User not found")
    }

    const account = await repository.account.findCredentialsAccountByEmail(email)
    if (!account) {
      throw new NotFoundError("Account not found")
    }

    const hashedPassword = await hashPassword(newPassword)
    await repository.account.update(account.id, { password: hashedPassword })

    await repository.session.deleteByUserId(user.id)

    await repository.verification.deleteByIdentifier(`reset:${email}`)

    return {
      message: "Password reset successfully. Please login with your new password."
    }
  },

  getUserSessions: async (userId: string): Promise<IUserSessionsResponse> => {
    const sessions = await repository.session.findByUserId(userId)

    const validSessions: ISessionResponse[] = sessions
      .filter((s) => s.expires_at > new Date())
      .map((s) => ({
        id: s.id,
        expires_at: s.expires_at,
        ip_address: s.ip_address,
        user_agent: s.user_agent,
        created_at: s.created_at,
        updated_at: s.updated_at,
      }))

    return {
      sessions: validSessions
    }
  },

  revokeSession: async (userId: string, sessionId: string): Promise<ILogoutResponse> => {
    const sessions = await repository.session.findByUserId(userId)
    const session = sessions.find((s) => s.id === sessionId)

    if (!session) {
      throw new NotFoundError("Session not found")
    }

    await repository.session.delete(session.token)

    return {
      message: "Session revoked successfully"
    }
  },
});

```



> **auth.crypto.ts — bcrypt hash/compare**  
> Ruta: `backend-fastify/src/modules/auth/application/common/auth.crypto.ts`  
>
```typescript
import bcrypt from "bcrypt"

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10)
}

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash)
}

export function generateVerificationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

```



> **auth.token.ts — JWT con jose (HS256)**  
> Ruta: `backend-fastify/src/modules/auth/application/common/auth.token.ts`  
>
```typescript
import jwt from "jsonwebtoken"
import type { SignOptions } from "jsonwebtoken"
import { env } from "@/config/env"
import type { Role } from "../../domain/auth.types"

interface TokenPayload {
  userId: string
  email: string
  role: Role
  storeId: string
  storeName: string
}

export const generateTokens = ({ userId, email, role, storeId, storeName }: TokenPayload) => {
  const accessTokenOptions: SignOptions = {
    expiresIn: 900  // 15 minutos en segundos
  }

  const refreshTokenOptions: SignOptions = {
    expiresIn: 604000  // 7 días en segundos
  }

  const tokenPayload: TokenPayload = {
    userId,
    email,
    role,
    storeId,
    storeName
  }

  const accessToken = jwt.sign(
    tokenPayload,
    env.JWT_SECRET,
    accessTokenOptions
  )

  const refreshToken = jwt.sign(
    { userId },
    env.JWT_REFRESH_SECRET,
    refreshTokenOptions
  )

  return { accessToken, refreshToken }
}

export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret)
}

```



> **auth.guard.ts — declaración de request.auth y guards**  
> Ruta: `backend-fastify/src/modules/auth/application/common/auth.guard.ts`  
>
```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { UnauthorizedError, ForbiddenError } from "@/core/errors/AppError"
import { Role } from "../../domain/auth.types"
import { getUserIdFromBearerToken, getUserIdFromCookies } from "./auth.utils"

declare module "fastify" {
  interface FastifyRequest {
    userId?: string
    userRole?: Role
    storeId?: string
    storeName?: string
  }
}

export const authGuard = async (
  request: FastifyRequest,
  _reply: FastifyReply
) => {
  const fromCookies = getUserIdFromCookies(request)
  const fromBearer = getUserIdFromBearerToken(request)

  const { userId, role, storeId, storeName } = fromCookies.userId ? fromCookies : fromBearer

  if (!userId) {
    throw new UnauthorizedError("Authentication required")
  }

  request.userId = userId
  request.userRole = role ?? undefined
  request.storeId = storeId ?? undefined
  request.storeName = storeName ?? undefined
}

export const adminGuard = async (
  request: FastifyRequest,
  _reply: FastifyReply
) => {
  if (request.userRole !== "admin") {
    throw new ForbiddenError("Admin access required")
  }
}

export const storeGuard = async (
  request: FastifyRequest,
  _reply: FastifyReply
) => {
  if (!request.storeId) {
    throw new ForbiddenError("Store context required")
  }
}

```



> **auth.mappers.ts — usuario sanitizado + sesión**  
> Ruta: `backend-fastify/src/modules/auth/application/common/auth.mappers.ts`  
>
```typescript
import { IUserEntity } from "../../domain/auth.entities";
import { IStoreResponse, IUserResponse, Role } from "../../domain/auth.types";

export const mapUserToResponse = (user: IUserEntity): IUserResponse => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    email_verified: user.email_verified,
    role: user.role as Role,
    phone: user.phone,
    image: user.image,
    store_id: user.store_id,
    created_at: user.created_at,
    updated_at: user.updated_at,
  }
}

export const mapStoreToResponse = (store: { id: string; name: string; address?: string | null; phone?: string | null }): IStoreResponse => {
  return {
    id: store.id,
    name: store.name,
    address: store.address || undefined,
    phone: store.phone || undefined,
  }
}

```



> **auth.utils.ts — helpers de utilidad**  
> Ruta: `backend-fastify/src/modules/auth/application/common/auth.utils.ts`  
>
```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { env } from "@/config/env"
import jwt, { type JwtPayload } from "jsonwebtoken"
import { Role } from "../../domain/auth.types"
import { clearAuthCookies } from "../../presentation/auth.http"

interface AuthResult {
  userId: string | null
  role: Role | null
  storeId: string | null
  storeName: string | null
}

export const getUserIdFromCookies = (request: FastifyRequest): AuthResult => {
  const token = request.cookies.accessToken || request.cookies.refreshToken
  if (!token) return { userId: null, role: null, storeId: null, storeName: null }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload & { userId?: string; role?: Role; storeId?: string; storeName?: string }
    return {
      userId: decoded.userId ?? null,
      role: decoded.role ?? null,
      storeId: decoded.storeId ?? null,
      storeName: decoded.storeName ?? null,
    }
  } catch {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload & { userId?: string }
      return { userId: decoded.userId ?? null, role: null, storeId: null, storeName: null }
    } catch {
      return { userId: null, role: null, storeId: null, storeName: null }
    }
  }
}

export const getUserIdFromBearerToken = (
  request: FastifyRequest
): AuthResult => {
  const authHeader = request.headers.authorization
  if (!authHeader) return { userId: null, role: null, storeId: null, storeName: null }

  const parts = authHeader.split(" ")
  if (parts.length !== 2 || parts[0] !== "Bearer") return { userId: null, role: null, storeId: null, storeName: null }

  const token = parts[1]

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload & { userId?: string; role?: Role; storeId?: string; storeName?: string }
    return {
      userId: decoded.userId ?? null,
      role: decoded.role ?? null,
      storeId: decoded.storeId ?? null,
      storeName: decoded.storeName ?? null,
    }
  } catch {
    return { userId: null, role: null, storeId: null, storeName: null }
  }
}

export const resolveCurrentUserId = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<string | null> => {
  try {
    // If authGuard already resolved the user, use it
    if (request.userId) return request.userId

    // Otherwise check cookies first, then Bearer header
    const fromCookies = getUserIdFromCookies(request)
    if (fromCookies.userId) return fromCookies.userId

    const fromBearer = getUserIdFromBearerToken(request)
    return fromBearer.userId
  } catch {
    await clearAuthCookies(reply)
    return null
  }
}

```


#### infrastructure


> **auth.repository.ts — fachada de repos**  
> Ruta: `backend-fastify/src/modules/auth/infrastructure/auth.repository.ts`  
>
```typescript
import { IAuthRepository } from "../domain/auth.interface";
import { UserRepository } from "./feature/user.drizzle.repository";
import { StoreRepository } from "./feature/store.drizzle.repository";
import { AccountRepository } from "./feature/account.drizzle.repository";
import { SessionRepository } from "./feature/session.drizzle.repository";
import { VerificationRepository } from "./feature/verification.drizzle.repository";

export const authRepository: IAuthRepository = {
  user: UserRepository,
  store: StoreRepository,
  account: AccountRepository,
  session: SessionRepository,
  verification: VerificationRepository,
};

```



> **store.drizzle.repository.ts**  
> Ruta: `backend-fastify/src/modules/auth/infrastructure/feature/store.drizzle.repository.ts`  
>
```typescript
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { IStoreRepository } from "../../domain/auth.interface";
import { IStoreResponse } from "../../domain/auth.types";
import { CreateStoreData } from "../../domain/auth.entities";
import { NotFoundError } from "@/core/errors/AppError";
import { db } from "@/index";
import { store } from "@/db/schema";
import { mapStoreToResponse } from "../../application/common/auth.mappers";

export const StoreRepository: IStoreRepository = {
  async getStoreInfo(storeId: string): Promise<IStoreResponse> {
    const [result] = await db
      .select()
      .from(store)
      .where(eq(store.id, storeId));

    if (!result) throw new NotFoundError("Store not found");

    return mapStoreToResponse(result);
  },

  async findByName(name: string): Promise<IStoreResponse | null> {
    const [result] = await db
      .select()
      .from(store)
      .where(eq(store.name, name))
      .limit(1);

    if (!result) return null;

    return mapStoreToResponse(result);
  },

  async create(data: CreateStoreData): Promise<IStoreResponse> {
    const [result] = await db
      .insert(store)
      .values({
        id: randomUUID(),
        name: data.name,
        address: data.address,
        phone: data.phone,
        createdAt: new Date(),
      })
      .returning();

    return mapStoreToResponse(result);
  },
};

```



> **user.drizzle.repository.ts**  
> Ruta: `backend-fastify/src/modules/auth/infrastructure/feature/user.drizzle.repository.ts`  
>
```typescript
import { randomUUID } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";
import { users } from "@/db/schema";
import { IUserRepository } from "../../domain/auth.interface";
import { IUserEntity, CreateUserData, UpdateUserData } from "../../domain/auth.entities";
import { db } from "@/index";
import { mapDrizzleUserToEntity } from "../mappers/auth.drizzle.mappers";

export const UserRepository: IUserRepository = {
  async findByEmail(email: string, storeId?: string): Promise<IUserEntity | null> {
    const conditions = [
      eq(users.email, email),
      isNull(users.deletedAt),
    ];

    if (storeId) {
      conditions.push(eq(users.storeId, storeId));
    }

    const [result] = await db
      .select()
      .from(users)
      .where(and(...conditions))
      .limit(1);

    if (!result) return null;

    return mapDrizzleUserToEntity(result);
  },

  async findById(id: string): Promise<IUserEntity | null> {
    const conditions = [
      eq(users.id, id),
      isNull(users.deletedAt)
    ]

    const [result] = await db
      .select()
      .from(users)
      .where(
        and(...conditions),
      )
      .limit(1);

    if (!result) return null;

    return mapDrizzleUserToEntity(result);
  },

  async create(data: CreateUserData): Promise<IUserEntity> {
    const [result] = await db
      .insert(users)
      .values({
        id: randomUUID(),
        name: data.name,
        email: data.email,
        phone: data.phone,
        image: data.image,
        role: data.role ?? "cajero",
        emailVerified: data.email_verified ?? false,
        storeId: data.store_id,
      })
      .returning();

    return mapDrizzleUserToEntity(result);
  },

  async update(
    id: string,
    data: UpdateUserData,
  ): Promise<IUserEntity> {
    const { email_verified, ...rest } = data;

    const [result] = await db
      .update(users)
      .set({
        ...rest,
        ...(email_verified !== undefined && { emailVerified: email_verified }),
      })
      .where(eq(users.id, id))
      .returning();

    return mapDrizzleUserToEntity(result);
  },

  async softDelete(id: string): Promise<void> {
    await db
      .update(users)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(users.id, id));
  },
};



```



> **session.drizzle.repository.ts**  
> Ruta: `backend-fastify/src/modules/auth/infrastructure/feature/session.drizzle.repository.ts`  
>
```typescript
import { randomUUID } from "node:crypto";
import { eq, lt } from "drizzle-orm";
import { session } from "@/db/schema";
import { db } from "@/index";
import { ISessionRepository } from "../../domain/auth.interface";
import { CreateSessionData, ISessionEntity } from "../../domain/auth.entities";
import { mapDrizzleSessionToEntity } from "../mappers/auth.drizzle.mappers";

export const SessionRepository: ISessionRepository = {
  async create(data: CreateSessionData): Promise<ISessionEntity> {
    const [result] = await db
      .insert(session)
      .values({
        id: randomUUID(),
        userId: data.userId,
        token: data.token,
        expiresAt: data.expiresAt,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      })
      .returning();

    return mapDrizzleSessionToEntity(result);
  },

  async findByToken(token: string): Promise<ISessionEntity | null> {
    const [result] = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (!result) return null;

    return mapDrizzleSessionToEntity(result);
  },

  async findByUserId(userId: string): Promise<ISessionEntity[]> {
    const results = await db
      .select()
      .from(session)
      .where(eq(session.userId, userId));

    return results.map(mapDrizzleSessionToEntity);
  },

  async delete(token: string): Promise<void> {
    await db.delete(session).where(eq(session.token, token));
  },

  async deleteByUserId(userId: string): Promise<void> {
    await db.delete(session).where(eq(session.userId, userId));
  },

  async deleteExpiredSessions(): Promise<number> {
    const result = await db
      .delete(session)
      .where(lt(session.expiresAt, new Date()));

    return result.rowCount ?? 0;
  },
};

```



> **verification.drizzle.repository.ts**  
> Ruta: `backend-fastify/src/modules/auth/infrastructure/feature/verification.drizzle.repository.ts`  
>
```typescript
import { randomUUID } from "node:crypto";
import { and, eq, lt } from "drizzle-orm";
import { verificacion } from "@/db/schema";
import { db } from "@/index";
import { IVerificationRepository } from "../../domain/auth.interface";
import { CreateVerificationData, IVerificationEntity } from "../../domain/auth.entities";
import { mapDrizzleVerificationToEntity } from "../mappers/auth.drizzle.mappers";

export const VerificationRepository: IVerificationRepository = {
  async create(data: CreateVerificationData): Promise<IVerificationEntity> {
    await db.delete(verificacion).where(eq(verificacion.identifier, data.identifier));

    const [result] = await db
      .insert(verificacion)
      .values({
        id: randomUUID(),
        identifier: data.identifier,
        value: data.value,
        expiresAt: data.expiresAt,
      })
      .returning();

    return mapDrizzleVerificationToEntity(result);
  },

  async findByIdentifier(identifier: string): Promise<IVerificationEntity | null> {
    const [result] = await db
      .select()
      .from(verificacion)
      .where(eq(verificacion.identifier, identifier))
      .limit(1);

    if (!result) return null;

    return mapDrizzleVerificationToEntity(result);
  },

  async findByIdentifierAndValue(
    identifier: string,
    value: string,
  ): Promise<IVerificationEntity | null> {
    const [result] = await db
      .select()
      .from(verificacion)
      .where(
        and(
          eq(verificacion.identifier, identifier),
          eq(verificacion.value, value),
        ),
      )
      .limit(1);

    if (!result) return null;

    return mapDrizzleVerificationToEntity(result);
  },

  async delete(id: string): Promise<void> {
    await db.delete(verificacion).where(eq(verificacion.id, id));
  },

  async deleteByIdentifier(identifier: string): Promise<void> {
    await db.delete(verificacion).where(eq(verificacion.identifier, identifier));
  },

  async deleteExpired(): Promise<number> {
    const result = await db
      .delete(verificacion)
      .where(lt(verificacion.expiresAt, new Date()));

    return result.rowCount ?? 0;
  },
};

```



> **account.drizzle.repository.ts — vestigio, tabla account**  
> Ruta: `backend-fastify/src/modules/auth/infrastructure/feature/account.drizzle.repository.ts`  
>
```typescript
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { account, users } from "@/db/schema";
import { db } from "@/index";
import { IAccountRepository } from "../../domain/auth.interface";
import { CreateAccountData, IAccountEntity } from "../../domain/auth.entities";
import { mapDrizzleAccountToEntity } from "../mappers/auth.drizzle.mappers";

const toDrizzleFields = (data: CreateAccountData) => ({
  accountId: data.account_id,
  providerId: data.provider_id,
  userId: data.user_id,
  accessToken: data.access_token,
  refreshToken: data.refresh_token,
  idToken: data.id_token,
  accessTokenExpiresAt: data.access_token_expires_at,
  refreshTokenExpiresAt: data.refresh_token_expires_at,
  scope: data.scope,
  password: data.password,
});

export const AccountRepository: IAccountRepository = {
  async findByProviderAndAccountId(
    providerId: string,
    accountId: string,
  ): Promise<IAccountEntity | null> {
    const [result] = await db
      .select()
      .from(account)
      .where(
        and(
          eq(account.providerId, providerId),
          eq(account.accountId, accountId),
        ),
      )
      .limit(1);

    if (!result) return null;

    return mapDrizzleAccountToEntity(result);
  },

  async findByUserId(userId: string): Promise<IAccountEntity[]> {
    const results = await db
      .select()
      .from(account)
      .where(eq(account.userId, userId));

    return results.map(mapDrizzleAccountToEntity);
  },

  async findCredentialsAccountByEmail(email: string): Promise<IAccountEntity | null> {
    const [result] = await db
      .select({ account })
      .from(account)
      .innerJoin(users, eq(account.userId, users.id))
      .where(
        and(
          eq(users.email, email),
          eq(account.providerId, "credentials"),
        ),
      )
      .limit(1);

    if (!result) return null;

    return mapDrizzleAccountToEntity(result.account);
  },

  async create(data: CreateAccountData): Promise<IAccountEntity> {
    const [result] = await db
      .insert(account)
      .values({
        id: randomUUID(),
        ...toDrizzleFields(data),
      })
      .returning();

    return mapDrizzleAccountToEntity(result);
  },

  async update(
    id: string,
    data: Partial<CreateAccountData>,
  ): Promise<IAccountEntity> {
    const [result] = await db
      .update(account)
      .set(toDrizzleFields(data as CreateAccountData))
      .where(eq(account.id, id))
      .returning();

    return mapDrizzleAccountToEntity(result);
  },

  async delete(id: string): Promise<void> {
    await db.delete(account).where(eq(account.id, id));
  },

  async deleteByUserId(userId: string): Promise<void> {
    await db.delete(account).where(eq(account.userId, userId));
  },
};

```



> **auth.drizzle.mappers.ts**  
> Ruta: `backend-fastify/src/modules/auth/infrastructure/mappers/auth.drizzle.mappers.ts`  
>
```typescript
import type { account, session, users, verificacion } from "@/db/schema"
import type {
  IAccountEntity,
  ISessionEntity,
  IUserEntity,
  IVerificationEntity,
} from "../../domain/auth.entities"

type UserRow = typeof users.$inferSelect
type AccountRow = typeof account.$inferSelect
type SessionRow = typeof session.$inferSelect
type VerificationRow = typeof verificacion.$inferSelect

export function mapDrizzleUserToEntity(user: UserRow): IUserEntity {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    email_verified: user.emailVerified,
    phone: user.phone ?? undefined,
    image: user.image ?? undefined,
    role: user.role,
    store_id: user.storeId,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
    deleted_at: user.deletedAt ?? undefined,
  }
}

export function mapDrizzleAccountToEntity(row: AccountRow): IAccountEntity {
  return {
    id: row.id,
    account_id: row.accountId,
    provider_id: row.providerId,
    user_id: row.userId ?? undefined,
    access_token: row.accessToken ?? undefined,
    refresh_token: row.refreshToken ?? undefined,
    id_token: row.idToken ?? undefined,
    access_token_expires_at: row.accessTokenExpiresAt ?? undefined,
    refresh_token_expires_at: row.refreshTokenExpiresAt ?? undefined,
    scope: row.scope ?? undefined,
    password: row.password ?? undefined,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  }
}

export function mapDrizzleSessionToEntity(row: SessionRow): ISessionEntity {
  return {
    id: row.id,
    expires_at: row.expiresAt!,
    token: row.token,
    ip_address: row.ipAddress ?? undefined,
    user_agent: row.userAgent ?? undefined,
    user_id: row.userId,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  }
}

export function mapDrizzleVerificationToEntity(
  row: VerificationRow,
): IVerificationEntity {
  return {
    id: row.id,
    identifier: row.identifier,
    value: row.value,
    expires_at: row.expiresAt,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  }
}

```


#### presentation


> **auth.dto.ts — esquemas Zod**  
> Ruta: `backend-fastify/src/modules/auth/presentation/auth.dto.ts`  
>
```typescript
import { z } from "zod"

export const RegisterPayloadDtoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "farmaceutico", "cajero", "bodeguero"]).optional()
})

export const LoginPayloadDtoSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters")
})

export const VerifyEmailDtoSchema = z.object({
  identifier: z.string().email("Invalid email format"),
  code: z.string().min(6, "Verification code must be at least 6 characters")
})

export const ResendVerificationDtoSchema = z.object({
  email: z.string().email("Invalid email format")
})

export const ForgotPasswordDtoSchema = z.object({
  email: z.string().email("Invalid email format")
})

export const ResetPasswordDtoSchema = z.object({
  email: z.string().email("Invalid email format"),
  code: z.string().min(6, "Reset code must be at least 6 characters"),
  newPassword: z.string().min(8, "Password must be at least 8 characters")
})

export const RefreshTokenDtoSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required")
})

export const RevokeSessionDtoSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID")
})

export const RegisterStoreDtoSchema = z.object({
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  storeAddress: z.string().optional(),
  storePhone: z.string().optional(),
  adminName: z.string().min(2, "Name must be at least 2 characters"),
  adminEmail: z.string().email("Invalid email format"),
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
})

export type RegisterPayloadDto = z.infer<typeof RegisterPayloadDtoSchema>
export type LoginPayloadDto = z.infer<typeof LoginPayloadDtoSchema>
export type VerifyEmailDto = z.infer<typeof VerifyEmailDtoSchema>
export type ResendVerificationDto = z.infer<typeof ResendVerificationDtoSchema>
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordDtoSchema>
export type ResetPasswordDto = z.infer<typeof ResetPasswordDtoSchema>
export type RefreshTokenDto = z.infer<typeof RefreshTokenDtoSchema>
export type RevokeSessionDto = z.infer<typeof RevokeSessionDtoSchema>
export type RegisterStoreDto = z.infer<typeof RegisterStoreDtoSchema>

```



> **auth.controller.ts**  
> Ruta: `backend-fastify/src/modules/auth/presentation/auth.controller.ts`  
>
```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { createAuthService } from "../application/auth.service"
import {
  ForgotPasswordDtoSchema,
  LoginPayloadDtoSchema,
  RegisterPayloadDtoSchema,
  RegisterStoreDtoSchema,
  ResendVerificationDtoSchema,
  ResetPasswordDtoSchema,
  RevokeSessionDtoSchema,
  VerifyEmailDtoSchema
} from "./auth.dto"
import { clearAuthCookies, getRefreshToken, setAuthCookies } from "./auth.http"
import { env } from "@/config/env"
import { authRepository } from "../infrastructure/auth.repository"
import { resolveCurrentUserId } from "../application/common/auth.utils"
import { ConflictError, UnauthorizedError } from "@/core/errors/AppError"
import { emailSender } from "@/modules/email"

const authService = createAuthService(authRepository, emailSender)


export const authController = {
  register: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = RegisterPayloadDtoSchema.parse(request.body)

    const storeId = request.storeId
    if (!storeId) {
      throw new UnauthorizedError("Store context required")
    }

    const result = await authService.register(data, storeId)

    if (!request.userId) {
      setAuthCookies(
        reply,
        result.accessToken,
        result.refreshToken,
        env.NODE_ENV === "production"
      )
    }

    return reply.status(201).send({
      message: result.message,
      user: result.user,
      store: result.store,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    })
  },

  registerStore: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = RegisterStoreDtoSchema.parse(request.body)

    const result = await authService.registerStore(data)

    setAuthCookies(reply, result.accessToken, result.refreshToken, env.NODE_ENV === "production")

    return reply.status(201).send({
      message: result.message,
      user: result.user,
      store: result.store,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    })
  },

  login: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = LoginPayloadDtoSchema.parse(request.body)

    const currentUserId = await resolveCurrentUserId(request, reply)

    const result = await authService.login(data)

    if (currentUserId && currentUserId === result.user.id) {
      throw new ConflictError("Already logged in with this user. Please logout first.")
    }

    if (currentUserId && currentUserId !== result.user.id) {
      await clearAuthCookies(reply)
    }

    setAuthCookies(
      reply,
      result.accessToken,
      result.refreshToken,
      env.NODE_ENV === "production"
    )

    return reply.status(200).send({
      message: result.message,
      user: result.user,
      store: result.store,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    })

  },

  logout: async (request: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = getRefreshToken(request)

    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token required")
    }

    const result = await authService.logout(refreshToken)

    clearAuthCookies(reply)

    return reply.status(200).send(result)
  },

  refresh: async (request: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = getRefreshToken(request)

    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token required")
    }

    const result = await authService.refresh(refreshToken)

    setAuthCookies(reply, result.accessToken, result.refreshToken, env.NODE_ENV === "production")

    return reply.status(200).send({
      message: result.message,
      user: result.user,
      store: result.store,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    })
  },

  verifyEmail: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = VerifyEmailDtoSchema.parse(request.body)

    const result = await authService.verifyEmail(data)

    setAuthCookies(reply, result.accessToken, result.refreshToken, env.NODE_ENV === "production")

    return reply.status(200).send({ message: result.message })
  },

  resendVerification: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = ResendVerificationDtoSchema.parse(request.body)

    const result = await authService.resendVerification(data.email)

    return reply.status(200).send({ message: result.message })
  },

  forgotPassword: async (request: FastifyRequest, reply: FastifyReply) => {
    const currentUserId = await resolveCurrentUserId(request, reply)
    if (currentUserId) {
      throw new ConflictError("Please logout before requesting password reset")
    }

    const data = ForgotPasswordDtoSchema.parse(request.body)

    const result = await authService.forgotPassword(data)

    return reply.status(200).send(result)
  },

  resetPassword: async (request: FastifyRequest, reply: FastifyReply) => {
    const currentUserId = await resolveCurrentUserId(request, reply)
    if (currentUserId) {
      throw new ConflictError("Please logout before resetting password")
    }

    const data = ResetPasswordDtoSchema.parse(request.body)

    const result = await authService.resetPassword(data)

    clearAuthCookies(reply)

    return reply.status(200).send(result)
  },

  getUserSessions: async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = await resolveCurrentUserId(request, reply)

    if (!userId) {
      throw new UnauthorizedError("Authentication required")
    }

    const result = await authService.getUserSessions(userId)

    return reply.status(200).send(result)
  },

  revokeSession: async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = await resolveCurrentUserId(request, reply)

    if (!userId) {
      throw new UnauthorizedError("Authentication required")
    }

    const params = request.params as { sessionId: string }
    const { sessionId } = RevokeSessionDtoSchema.parse(params)

    const result = await authService.revokeSession(userId, sessionId)

    return reply.status(200).send(result)
  }
}

```



> **auth.routes.ts — rutas públicas de auth**  
> Ruta: `backend-fastify/src/modules/auth/presentation/auth.routes.ts`  
>
```typescript
import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { authController } from "./auth.controller"
import { adminGuard, authGuard, storeGuard } from "../application/common/auth.guard"

export const authRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  // PUBLIC ROUTES
  fastify.post("/register-store", authController.registerStore)

  fastify.post(
    "/register",
    { preHandler: [authGuard, adminGuard, storeGuard] },
    authController.register
  )

  fastify.post("/login", authController.login)

  fastify.post("/refresh", authController.refresh)

  fastify.post("/logout", authController.logout)

  // Email Verification
  fastify.post("/verify-email", authController.verifyEmail)

  fastify.post("/resend-verification", authController.resendVerification)

  // Password Reset
  fastify.post("/forgot-password", authController.forgotPassword)

  fastify.post("/reset-password", authController.resetPassword)

  // PROTECTED ROUTES
  fastify.get(
    "/sessions",
    { preHandler: authGuard },
    authController.getUserSessions
  )

  fastify.delete(
    "/sessions/:sessionId",
    { preHandler: authGuard },
    authController.revokeSession
  )
}

```



> **auth.http.ts — tipos de request extendidos**  
> Ruta: `backend-fastify/src/modules/auth/presentation/auth.http.ts`  
>
```typescript
import type { FastifyReply, FastifyRequest } from "fastify"

export const setAuthCookies = (
  reply: FastifyReply,
  accessToken: string,
  refreshToken: string,
  isProduction: boolean
) => {
  const sameSite = isProduction ? 'strict' : 'lax'

  reply.setCookie('accessToken', accessToken, {
    path: '/',
    httpOnly: true,
    secure: isProduction,
    sameSite,
    maxAge: 900
  })
  reply.setCookie('refreshToken', refreshToken, {
    path: '/',
    httpOnly: true,
    secure: isProduction,
    sameSite,
    maxAge: 604800
  })
}

export const clearAuthCookies = async (reply: FastifyReply) => {
  reply.clearCookie('accessToken', { path: '/' })
  reply.clearCookie('refreshToken', { path: '/' })
}

export function getRefreshToken(request: FastifyRequest): string {
  const cookieToken = request.cookies.refreshToken
  const body = request.body as Record<string, unknown> | undefined
  const bodyToken = typeof body?.refreshToken === "string" ? body.refreshToken : undefined
  return cookieToken || bodyToken || ""
}

```


### 11.3 Flujo de autenticación resumido

1. **Registro** (`POST /auth/register` + `POST /auth/register-store`): crea el usuario (bcrypt hash), crea la sesión y el registro de verificación (código de 6 dígitos persistido en la tabla `verification`), dispara el email de verificación (si SMTP está configurado).
2. **Login** (`POST /auth/login`): valida contraseña, crea sesión con `expiresAt = now + 7d`, firma access token (`15m`) y refresh token (`7d`), los devuelve en `data`.
3. **Verificación** (`POST /auth/verify-email`): compara el código con el de la tabla `verification` y marca `emailVerified = true`.
4. **Refresh** (`POST /auth/refresh`): valida el refresh token, busca la sesión activa, rota el token y devuelve par nuevo.
5. **Logout** (`POST /auth/logout`): invalida la sesión (delete).
6. **Recuperación** (`POST /auth/forgot-password` + `POST /auth/reset-password`): genera código de verificación y permite resetear la contraseña.
7. **Sesiones** (`GET/DELETE /auth/sessions`): lista y revoca sesiones del usuario.

> ⚠️ Nota de fidelidad: el endpoint `/auth/register` de email **no envía** si no hay SMTP (ver módulo email). En desarrollo, el código de verificación se puede consultar en la tabla `verification` o en el log.

## 12. Módulo email

**Propósito:** envío de emails transaccionales (verificación de email, recuperación de contraseña, etc.) vía **Nodemailer** con una abstracción `IEmailSender` que permite testear sin servidor SMTP real.

### 12.1 Archivos del módulo

| Archivo | Rol |
|---|---|
| `domain/email.types.ts` | Contrato `IEmailSender` (interfaz) y tipos `SendEmailParams` |
| `index.ts` | Fábrica: crea el sender Nodemailer si hay SMTP configurado |
| `infrastructure/nodemailer.sender.ts` | Implementación con nodemailer (transport SMTP) |
| `__tests__/nodemailer.sender.test.ts` | Tests del sender con transport fake |

### 12.2 Código completo


> **email.types.ts — contrato IEmailSender y tipos**  
> Ruta: `backend-fastify/src/modules/email/domain/email.types.ts`  
>
```typescript
export interface EmailMessage {
  to: string
  subject: string
  text: string
}

export interface IEmailSender {
  send(message: EmailMessage): Promise<void>
}

```



> **index.ts — fábrica del email sender**  
> Ruta: `backend-fastify/src/modules/email/index.ts`  
>
```typescript
import { NodemailerEmailSender } from "./infrastructure/nodemailer.sender"
import type { IEmailSender } from "./domain/email.types"

export const emailSender: IEmailSender = new NodemailerEmailSender()
```



> **nodemailer.sender.ts — transport SMTP real con nodemailer**  
> Ruta: `backend-fastify/src/modules/email/infrastructure/nodemailer.sender.ts`  
>
```typescript
import nodemailer, { type Transporter } from "nodemailer"
import type { EmailMessage, IEmailSender } from "../domain/email.types"
import { env } from "@/config/env"
import { logger } from "@/config/logger"

export class NodemailerEmailSender implements IEmailSender {
  private transport: Transporter | null = null

  async send(message: EmailMessage): Promise<void> {
    if (!env.SMTP_HOST) {
      logger.warn("SMTP not configured — skipping email delivery")
      return
    }

    try {
      await this.buildTransport().sendMail({
        from: env.SMTP_FROM,
        to: message.to,
        subject: message.subject,
        text: message.text,
      })
    } catch (error) {
      logger.warn({ error }, "Email delivery failed")
    }
  }

  private buildTransport(): Transporter {
    if (!this.transport) {
      this.transport = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT ?? 587,
        auth:
          env.SMTP_USER && env.SMTP_PASS
            ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
            : undefined,
      })
    }
    return this.transport
  }
}
```


### 12.3 Uso desde auth

El `auth.service.ts` recibe un `IEmailSender` opcional en su factory. Si el sender está presente y SMTP está configurado, envía los correos de verificación/recuperación; si no, **no rompe el flujo** (loguea y continúa) — ver sección [11. Módulo auth](#11-módulo-auth).

---

## 13. Módulo users

**Propósito:** gestión de usuarios del staff (administradores, farmacéuticos, cajeros, bodegueros) de la tienda: CRUD, cambio de rol, activación/desactivación y listado con búsqueda.

### 13.1 Archivos del módulo

| Archivo | Rol |
|---|---|
| `domain/users.types.ts` | Tipos: `UserDTO`, `CreateUserInput`, `UpdateUserInput`, `UserListParams` |
| `domain/users.entities.ts` | Entidad `UserEntity` (1:1 con tabla `users`) |
| `domain/users.interface.ts` | Contrato `IUserRepository` |
| `application/users.service.ts` | Casos de uso: CRUD + `isEmailTaken` para validación de unicidad |
| `application/common/users.mappers.ts` | Entidad → `UserDTO` (saca el hash, proyecta) |
| `infrastructure/users.drizzle.repository.ts` | Repo Drizzle sobre `users` |
| `presentation/users.controller.ts` | Handlers HTTP |
| `presentation/users.dto.ts` | Zod: create/update/list |
| `presentation/users.routes.ts` | Rutas protegidas por rol |

### 13.2 Código completo


> **users.types.ts**  
> Ruta: `backend-fastify/src/modules/users/domain/users.types.ts`  
>
```typescript
import { Role } from "@/modules/auth/domain/auth.types"

export interface IUserResponse {
  id: string
  name: string
  email: string
  email_verified: boolean
  role: Role
  phone?: string | null
  image?: string | null
  store_id?: string | null
  created_at: string
  updated_at: string
}

export interface IUserListResponse {
  data: IUserResponse[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

```



> **users.entities.ts**  
> Ruta: `backend-fastify/src/modules/users/domain/users.entities.ts`  
>
```typescript
import { Role } from "@/modules/auth/domain/auth.types"

export interface IUserEntity {
  id: string
  name: string
  email: string
  email_verified: boolean
  role: Role
  phone?: string | null
  image?: string | null
  store_id?: string | null
  created_at: Date
  updated_at: Date
  deleted_at?: Date | null
}

export interface CreateUserData {
  name: string
  email: string
  password: string
  role?: Role
  phone?: string | null
  store_id?: string
}

export interface UpdateUserData {
  name?: string
  email?: string
  role?: Role
  phone?: string | null
}

```



> **users.interface.ts**  
> Ruta: `backend-fastify/src/modules/users/domain/users.interface.ts`  
>
```typescript
import type { CreateUserData, UpdateUserData, IUserEntity } from "./users.entities"

export interface IUserRepository {
  findAll(params?: { page?: number; limit?: number; search?: string; role?: string; storeId?: string }): Promise<{ users: IUserEntity[]; total: number; page: number; limit: number }>
  findById(id: string, storeId: string): Promise<IUserEntity | null>
  findByEmail(email: string, storeId: string): Promise<IUserEntity | null>
  create(data: CreateUserData): Promise<IUserEntity>
  update(id: string, data: UpdateUserData, storeId: string): Promise<IUserEntity>
  softDelete(id: string, storeId: string): Promise<void>
  updatePassword(id: string, hashedPassword: string): Promise<void>
}

```



> **users.service.ts — CRUD de usuarios**  
> Ruta: `backend-fastify/src/modules/users/application/users.service.ts`  
>
```typescript
import { ConflictError, NotFoundError } from "@/core/errors/AppError"
import type { IUserRepository } from "../domain/users.interface"
import type { CreateUserData, UpdateUserData } from "../domain/users.entities"
import type { IUserListResponse, IUserResponse } from "../domain/users.types"
import { mapUserToResponse } from "./common/users.mappers"

export const createUserService = (repository: IUserRepository) => ({
  list: async (params?: { search?: string; role?: string; page?: number; limit?: number; storeId?: string }): Promise<IUserListResponse> => {
    const result = await repository.findAll(params)
    return { data: result.users.map(mapUserToResponse), meta: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.max(1, Math.ceil(result.total / result.limit)) } }
  },
  getById: async (id: string, storeId: string): Promise<IUserResponse> => {
    const user = await repository.findById(id, storeId)
    if (!user) throw new NotFoundError("User not found")
    return mapUserToResponse(user)
  },
  create: async (data: CreateUserData, storeId: string): Promise<IUserResponse> => {
    const existing = await repository.findByEmail(data.email, storeId)
    if (existing) throw new ConflictError("A user with this email already exists")
    const user = await repository.create({ ...data, store_id: storeId })
    return mapUserToResponse(user)
  },
  update: async (id: string, data: UpdateUserData, storeId: string): Promise<IUserResponse> => {
    const existing = await repository.findById(id, storeId)
    if (!existing) throw new NotFoundError("User not found")
    if (data.email && data.email !== existing.email && await repository.findByEmail(data.email, storeId)) throw new ConflictError("A user with this email already exists")
    return mapUserToResponse(await repository.update(id, data, storeId))
  },
  delete: async (id: string, storeId: string): Promise<void> => {
    if (!await repository.findById(id, storeId)) throw new NotFoundError("User not found")
    await repository.softDelete(id, storeId)
  },
})

```



> **users.mappers.ts**  
> Ruta: `backend-fastify/src/modules/users/application/common/users.mappers.ts`  
>
```typescript
import { IUserEntity } from "../../domain/users.entities";
import { IUserResponse } from "../../domain/users.types";

export function mapUserToResponse(user: IUserEntity): IUserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    email_verified: user.email_verified,
    role: user.role,
    phone: user.phone ?? undefined,
    image: user.image ?? undefined,
    store_id: user.store_id ?? undefined,
    created_at: user.created_at.toISOString(),
    updated_at: user.updated_at.toISOString(),
  }
}

```



> **users.drizzle.repository.ts**  
> Ruta: `backend-fastify/src/modules/users/infrastructure/users.drizzle.repository.ts`  
>
```typescript
import { randomUUID } from "node:crypto";
import { and, asc, count, eq, ilike, isNull, or } from "drizzle-orm";
import { account, users } from "@/db/schema";
import { db } from "@/index";
import { IUserRepository } from "../domain/users.interface";
import { CreateUserData, IUserEntity, UpdateUserData } from "../domain/users.entities";
import { Role } from "@/modules/auth/domain/auth.types";
import { NotFoundError } from "@/core/errors/AppError";
import { hashPassword } from "@/modules/auth/application/common/auth.crypto";

function mapRowToEntity(user: typeof users.$inferSelect): IUserEntity {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    email_verified: user.emailVerified,
    role: user.role,
    phone: user.phone ?? null,
    image: user.image ?? null,
    store_id: user.storeId,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
    deleted_at: user.deletedAt ?? null,
  };
}

export const UserRepository: IUserRepository = {
  async findAll(params) {
    const conditions = [isNull(users.deletedAt)];
    if (params?.storeId) conditions.push(eq(users.storeId, params.storeId));
    if (params?.role) conditions.push(eq(users.role, params.role as Role));
    if (params?.search) {
      conditions.push(
        or(
          ilike(users.name, `%${params.search}%`),
          ilike(users.email, `%${params.search}%`),
        )!,
      );
    }

    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;

    const [rows, totalRows] = await Promise.all([
      db
        .select()
        .from(users)
        .where(and(...conditions))
        .orderBy(asc(users.name))
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ total: count() })
        .from(users)
        .where(and(...conditions)),
    ]);

    const total = totalRows[0]?.total ?? 0;

    return {
      users: rows.map(mapRowToEntity),
      total,
      page,
      limit,
    };
  },

  async findById(id: string, storeId: string): Promise<IUserEntity | null> {
    const [result] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, id),
          eq(users.storeId, storeId),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    if (!result) return null;

    return mapRowToEntity(result);
  },

  async findByEmail(email: string, storeId: string): Promise<IUserEntity | null> {
    const [result] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, email),
          eq(users.storeId, storeId),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    if (!result) return null;

    return mapRowToEntity(result);
  },

  async create(data: CreateUserData): Promise<IUserEntity> {
    const hashedPassword = await hashPassword(data.password);

    const [result] = await db
      .insert(users)
      .values({
        id: randomUUID(),
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        role: data.role ?? "cajero",
        emailVerified: true,
        storeId: data.store_id!,
      })
      .returning();

    await db.insert(account).values({
      id: randomUUID(),
      accountId: result.id,
      providerId: "credentials",
      userId: result.id,
      password: hashedPassword,
    });

    return mapRowToEntity(result);
  },

  async update(id: string, data: UpdateUserData, storeId: string): Promise<IUserEntity> {
    const [result] = await db
      .update(users)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.phone !== undefined && { phone: data.phone }),
      })
      .where(
        and(
          eq(users.id, id),
          eq(users.storeId, storeId),
          isNull(users.deletedAt),
        ),
      )
      .returning();

    if (!result) throw new NotFoundError("User not found");

    return mapRowToEntity(result);
  },

  async softDelete(id: string, storeId: string): Promise<void> {
    await db
      .update(users)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(users.id, id),
          eq(users.storeId, storeId),
          isNull(users.deletedAt),
        ),
      );
  },

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await db
      .update(account)
      .set({ password: hashedPassword })
      .where(eq(account.userId, id));
  },
};

```



> **users.dto.ts**  
> Ruta: `backend-fastify/src/modules/users/presentation/users.dto.ts`  
>
```typescript
import { z } from "zod"

const roles = ["admin", "farmaceutico", "cajero", "bodeguero"] as const

export const CreateUserDtoSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(roles).optional(),
  phone: z.string().trim().optional(),
})

export const UpdateUserDtoSchema = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(roles).optional(),
  phone: z.string().trim().optional().nullable(),
})

export const UserQuerySchema = z.object({
  search: z.string().optional(),
  role: z.enum(roles).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export type CreateUserDto = z.infer<typeof CreateUserDtoSchema>
export type UpdateUserDto = z.infer<typeof UpdateUserDtoSchema>

```



> **users.controller.ts**  
> Ruta: `backend-fastify/src/modules/users/presentation/users.controller.ts`  
>
```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { createUserService } from "../application/users.service"
import { UserRepository } from "../infrastructure/users.drizzle.repository"
import { CreateUserDtoSchema, UpdateUserDtoSchema, UserQuerySchema } from "./users.dto"

const userService = createUserService(UserRepository)

export const usersController = {
  list: async (request: FastifyRequest, reply: FastifyReply) =>
    reply.send(await userService.list({ ...UserQuerySchema.parse(request.query), storeId: request.storeId })),

  getById: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    return reply.send(await userService.getById(id, request.storeId!))
  },

  create: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = CreateUserDtoSchema.parse(request.body)
    const user = await userService.create(data, request.storeId!)
    return reply.status(201).send(user)
  },

  update: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const data = UpdateUserDtoSchema.parse(request.body)
    const user = await userService.update(id, data, request.storeId!)
    return reply.send(user)
  },

  delete: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    if (id === request.userId) return reply.status(400).send({ message: "You cannot delete your own account" })
    const user = await userService.getById(id, request.storeId!)
    await userService.delete(id, request.storeId!)
    return reply.send({ message: "User deleted successfully" })
  },
}

```



> **users.routes.ts**  
> Ruta: `backend-fastify/src/modules/users/presentation/users.routes.ts`  
>
```typescript
import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { usersController } from "./users.controller"
import { adminGuard, authGuard, storeGuard } from "@/modules/auth/application/common/auth.guard"

export const usersRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  fastify.get(
    "/",
    { preHandler: [authGuard, adminGuard, storeGuard] },
    usersController.list
  )

  fastify.get(
    "/:id",
    { preHandler: [authGuard, adminGuard, storeGuard] },
    usersController.getById
  )

  fastify.post(
    "/",
    { preHandler: [authGuard, adminGuard, storeGuard] },
    usersController.create
  )

  fastify.put(
    "/:id",
    { preHandler: [authGuard, adminGuard, storeGuard] },
    usersController.update
  )

  fastify.delete(
    "/:id",
    { preHandler: [authGuard, adminGuard, storeGuard] },
    usersController.delete
  )
}

```


### 13.3 Detalles clave

- **Unicidad de email por tienda**: el servicio chequea `isEmailTaken(name, email, excludeId?)` antes de crear/actualizar, y el schema agrega índice único `uq_users_store_email` (store_id + email) como red de seguridad.
- **El hash NUNCA sale de la API**: el mapper proyecta el usuario sin `passwordHash`.
- **El usuario no se borra físicamente**: los repos de users filtran siempre `isNull(deletedAt)` y el delete setea `deletedAt = new Date()` (soft delete) — manteniendo integridad de las FK en ventas/sesiones históricas. La tabla `users` no tiene `isActive` booleano; el estado se maneja borrando el registro lógicamente.

## 14. Módulo suppliers

**Propósito:** proveedores del catálogo. CRUD completo con búsqueda, paginación, soft delete y conteo de medicamentos asociados.

### 14.1 Archivos del módulo

| Archivo | Rol |
|---|---|
| `domain/suppliers.types.ts` | Tipos: `SupplierDTO`, `CreateSupplierInput`, `UpdateSupplierInput`, `SupplierListParams` |
| `domain/suppliers.entities.ts` | Entidad `SupplierEntity` |
| `domain/suppliers.interface.ts` | Contrato `ISupplierRepository` |
| `application/suppliers.service.ts` | Casos de uso con reglas: unicidad de nombre, no borrar si tiene medicamentos (política de negocio) |
| `application/common/suppliers.mappers.ts` | Entidad → DTO (incluye `medicineCount`) |
| `infrastructure/suppliers.drizzle.repository.ts` | Repo Drizzle con subconsulta de conteo |
| `presentation/suppliers.*` | DTO, controller, routes |

### 14.2 Código completo


> **suppliers.types.ts**  
> Ruta: `backend-fastify/src/modules/suppliers/domain/suppliers.types.ts`  
>
```typescript
export interface ISupplierResponse {
  id: string
  name: string
  company?: string
  ruc?: string
  contact_name?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  is_active: boolean
  medicine_count?: number
  created_at: string
  updated_at: string
}

export interface ISupplierListResponse {
  data: ISupplierResponse[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

```



> **suppliers.entities.ts**  
> Ruta: `backend-fastify/src/modules/suppliers/domain/suppliers.entities.ts`  
>
```typescript
export interface ISupplierEntity {
  id: string
  name: string
  company?: string | null
  ruc?: string | null
  contact_name?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  notes?: string | null
  is_active: boolean
  medicine_count?: number
  created_at: Date
  updated_at: Date
  deleted_at?: Date | null
}

export type CreateSupplierData = {
  name: string
  company?: string
  ruc?: string
  contact_name?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  is_active?: boolean
}

export type UpdateSupplierData = Partial<CreateSupplierData>

```



> **suppliers.interface.ts**  
> Ruta: `backend-fastify/src/modules/suppliers/domain/suppliers.interface.ts`  
>
```typescript
import type { ISupplierEntity, CreateSupplierData, UpdateSupplierData } from "./suppliers.entities"

export interface ISupplierRepository {
  findAll(params?: { search?: string; is_active?: boolean; page?: number; limit?: number; storeId?: string }): Promise<{ suppliers: ISupplierEntity[]; total: number; page: number; limit: number }>
  findById(id: string, storeId?: string): Promise<ISupplierEntity | null>
  findByRuc(ruc: string, storeId?: string): Promise<ISupplierEntity | null>
  create(data: CreateSupplierData, storeId?: string): Promise<ISupplierEntity>
  update(id: string, data: UpdateSupplierData, storeId?: string): Promise<ISupplierEntity>
  softDelete(id: string, storeId?: string): Promise<void>
}

```



> **suppliers.service.ts — CRUD + validación de unicidad/soft delete**  
> Ruta: `backend-fastify/src/modules/suppliers/application/suppliers.service.ts`  
>
```typescript
import { BadRequestError, ConflictError, NotFoundError } from "@/core/errors/AppError"
import type { ISupplierRepository } from "../domain/suppliers.interface"
import type { CreateSupplierData, UpdateSupplierData } from "../domain/suppliers.entities"
import type { ISupplierListResponse, ISupplierResponse } from "../domain/suppliers.types"
import { mapSupplierToResponse, isUniqueViolation } from "./common/suppliers.mappers"

export const createSupplierService = (repository: ISupplierRepository) => ({
  list: async (params?: { search?: string; is_active?: boolean; page?: number; limit?: number; storeId?: string }): Promise<ISupplierListResponse> => {
    const result = await repository.findAll(params)
    return {
      data: result.suppliers.map((supplier) => mapSupplierToResponse(supplier)),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
      },
    }
  },
  getById: async (id: string, storeId?: string): Promise<ISupplierResponse> => {
    const supplier = await repository.findById(id, storeId)
    if (!supplier) throw new NotFoundError("Supplier not found")
    return mapSupplierToResponse(supplier)
  },
  create: async (data: CreateSupplierData, storeId?: string): Promise<ISupplierResponse> => {
    if (!data.name?.trim()) throw new BadRequestError("Name is required")
    if (data.ruc) {
      const existing = await repository.findByRuc(data.ruc, storeId)
      if (existing) throw new ConflictError("A supplier with this RUC already exists")
    }
    try {
      return mapSupplierToResponse(await repository.create(data, storeId))
    } catch (err) {
      if (isUniqueViolation(err)) throw new ConflictError("A supplier with this RUC already exists")
      throw err
    }
  },
  update: async (id: string, data: UpdateSupplierData, storeId?: string): Promise<ISupplierResponse> => {
    const existing = await repository.findById(id, storeId)
    if (!existing) throw new NotFoundError("Supplier not found")
    if (data.ruc && data.ruc !== existing.ruc) {
      const duplicate = await repository.findByRuc(data.ruc, storeId)
      if (duplicate) throw new ConflictError("A supplier with this RUC already exists")
    }
    try {
      return mapSupplierToResponse(await repository.update(id, data, storeId))
    } catch (err) {
      if (isUniqueViolation(err)) throw new ConflictError("A supplier with this RUC already exists")
      throw err
    }
  },
  delete: async (id: string, storeId?: string): Promise<void> => {
    if (!await repository.findById(id, storeId)) throw new NotFoundError("Supplier not found")
    await repository.softDelete(id, storeId)
  },
})

```



> **suppliers.mappers.ts**  
> Ruta: `backend-fastify/src/modules/suppliers/application/common/suppliers.mappers.ts`  
>
```typescript
import { ISupplierEntity } from "../../domain/suppliers.entities";
import { ISupplierResponse } from "../../domain/suppliers.types";

type RichSupplier = ISupplierEntity

export function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: unknown }).code === "23505"
}

export function mapSupplierToResponse(supplier: RichSupplier): ISupplierResponse {
  return {
    id: supplier.id,
    name: supplier.name,
    company: supplier.company || undefined,
    ruc: supplier.ruc || undefined,
    contact_name: supplier.contact_name || undefined,
    email: supplier.email || undefined,
    phone: supplier.phone || undefined,
    address: supplier.address || undefined,
    notes: supplier.notes || undefined,
    is_active: supplier.is_active,
    medicine_count: supplier.medicine_count,
    created_at: supplier.created_at.toISOString(),
    updated_at: supplier.updated_at.toISOString(),
  }
}

```



> **suppliers.drizzle.repository.ts**  
> Ruta: `backend-fastify/src/modules/suppliers/infrastructure/suppliers.drizzle.repository.ts`  
>
```typescript
import { randomUUID } from "node:crypto";
import { and, asc, count, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { medicine, supplier } from "@/db/schema";
import { db } from "@/index";
import { ISupplierRepository } from "../domain/suppliers.interface";
import { ISupplierEntity, CreateSupplierData, UpdateSupplierData } from "../domain/suppliers.entities";
import { NotFoundError } from "@/core/errors/AppError";

const medicineCount = sql<number>`(SELECT count(*)::int FROM ${medicine} WHERE ${medicine.supplierId} = ${supplier.id} AND ${medicine.deletedAt} IS NULL)`;

type SupplierRow = Pick<typeof supplier.$inferSelect, "id" | "name" | "company" | "ruc" | "contactName" | "email" | "phone" | "address" | "notes" | "isActive" | "createdAt" | "updatedAt" | "deletedAt"> & { medicine_count?: number };

function mapRowToEntity(row: SupplierRow): ISupplierEntity {
  return {
    id: row.id,
    name: row.name,
    company: row.company ?? null,
    ruc: row.ruc ?? null,
    contact_name: row.contactName ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    address: row.address ?? null,
    notes: row.notes ?? null,
    is_active: row.isActive,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    deleted_at: row.deletedAt ?? null,
    medicine_count: row.medicine_count,
  };
}

export const SupplierRepository: ISupplierRepository = {
  async findAll(params) {
    const conditions = [isNull(supplier.deletedAt)];
    if (params?.storeId) conditions.push(eq(supplier.storeId, params.storeId));
    if (params?.is_active !== undefined) conditions.push(eq(supplier.isActive, params.is_active));
    if (params?.search) {
      conditions.push(
        or(
          ilike(supplier.name, `%${params.search}%`),
          ilike(supplier.company, `%${params.search}%`),
          ilike(supplier.contactName, `%${params.search}%`),
          ilike(supplier.email, `%${params.search}%`),
        )!,
      );
    }

    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;

    const [rows, totalRows] = await Promise.all([
      db
        .select({
          id: supplier.id,
          name: supplier.name,
          company: supplier.company,
          ruc: supplier.ruc,
          contactName: supplier.contactName,
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address,
          notes: supplier.notes,
          isActive: supplier.isActive,
          createdAt: supplier.createdAt,
          updatedAt: supplier.updatedAt,
          deletedAt: supplier.deletedAt,
          medicine_count: medicineCount,
        })
        .from(supplier)
        .where(and(...conditions))
        .orderBy(asc(supplier.name))
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ total: count() })
        .from(supplier)
        .where(and(...conditions)),
    ]);

    return {
      suppliers: rows.map(mapRowToEntity),
      total: totalRows[0]?.total ?? 0,
      page,
      limit,
    };
  },

  async findById(id: string, storeId?: string): Promise<ISupplierEntity | null> {
    const conditions = [eq(supplier.id, id), isNull(supplier.deletedAt)];
    if (storeId) conditions.push(eq(supplier.storeId, storeId));

    const [result] = await db
      .select({
        id: supplier.id,
        name: supplier.name,
        company: supplier.company,
        ruc: supplier.ruc,
        contactName: supplier.contactName,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        notes: supplier.notes,
        isActive: supplier.isActive,
        createdAt: supplier.createdAt,
        updatedAt: supplier.updatedAt,
        deletedAt: supplier.deletedAt,
        medicine_count: medicineCount,
      })
      .from(supplier)
      .where(and(...conditions))
      .limit(1);

    if (!result) return null;

    return mapRowToEntity(result);
  },

  async findByRuc(ruc: string, storeId?: string): Promise<ISupplierEntity | null> {
    const conditions = [eq(supplier.ruc, ruc), isNull(supplier.deletedAt)];
    if (storeId) conditions.push(eq(supplier.storeId, storeId));

    const [result] = await db
      .select()
      .from(supplier)
      .where(and(...conditions))
      .limit(1);

    if (!result) return null;

    return mapRowToEntity(result);
  },

  async create(data: CreateSupplierData, storeId?: string): Promise<ISupplierEntity> {
    const [result] = await db
      .insert(supplier)
      .values({
        id: randomUUID(),
        name: data.name,
        company: data.company ?? null,
        ruc: data.ruc ?? null,
        contactName: data.contact_name ?? null,
        email: data.email || null,
        phone: data.phone ?? null,
        address: data.address ?? null,
        notes: data.notes ?? null,
        isActive: data.is_active ?? true,
        storeId: storeId!,
      })
      .returning();

    return mapRowToEntity(result);
  },

  async update(id: string, data: UpdateSupplierData, storeId?: string): Promise<ISupplierEntity> {
    const conditions = [eq(supplier.id, id), isNull(supplier.deletedAt)];
    if (storeId) conditions.push(eq(supplier.storeId, storeId));

    const [result] = await db
      .update(supplier)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.company !== undefined && { company: data.company }),
        ...(data.ruc !== undefined && { ruc: data.ruc }),
        ...(data.contact_name !== undefined && { contactName: data.contact_name }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.is_active !== undefined && { isActive: data.is_active }),
      })
      .where(and(...conditions))
      .returning();

    if (!result) throw new NotFoundError("Supplier not found");

    return mapRowToEntity(result);
  },

  async softDelete(id: string, storeId?: string): Promise<void> {
    const conditions = [eq(supplier.id, id), isNull(supplier.deletedAt)];
    if (storeId) conditions.push(eq(supplier.storeId, storeId));

    await db
      .update(supplier)
      .set({ deletedAt: new Date() })
      .where(and(...conditions));
  },
};

```



> **suppliers.dto.ts**  
> Ruta: `backend-fastify/src/modules/suppliers/presentation/suppliers.dto.ts`  
>
```typescript
import { z } from "zod"

export const CreateSupplierDtoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional(),
  ruc: z.string().optional(),
  contact_name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().optional(),
})

export const UpdateSupplierDtoSchema = z.object({
  name: z.string().min(1).optional(),
  company: z.string().optional().nullable(),
  ruc: z.string().optional().nullable(),
  contact_name: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
})

export const SupplierQuerySchema = z.object({
  search: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export type CreateSupplierDto = z.infer<typeof CreateSupplierDtoSchema>
export type UpdateSupplierDto = z.infer<typeof UpdateSupplierDtoSchema>
export type SupplierQueryDto = z.infer<typeof SupplierQuerySchema>

```



> **suppliers.controller.ts**  
> Ruta: `backend-fastify/src/modules/suppliers/presentation/suppliers.controller.ts`  
>
```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { createSupplierService } from "../application/suppliers.service"
import { SupplierRepository } from "../infrastructure/suppliers.drizzle.repository"
import type { UpdateSupplierData } from "../domain/suppliers.entities"
import { CreateSupplierDtoSchema, UpdateSupplierDtoSchema, SupplierQuerySchema } from "./suppliers.dto"

const supplierService = createSupplierService(SupplierRepository)

export const suppliersController = {
  list: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = SupplierQuerySchema.parse(request.query)
    const result = await supplierService.list({ ...query, storeId: request.storeId })
    return reply.status(200).send(result)
  },

  getById: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const result = await supplierService.getById(id, request.storeId)
    return reply.status(200).send(result)
  },

  create: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = CreateSupplierDtoSchema.parse(request.body)
    const result = await supplierService.create(data, request.storeId)
    return reply.status(201).send(result)
  },

  update: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const data = UpdateSupplierDtoSchema.parse(request.body)
    const result = await supplierService.update(id, data as UpdateSupplierData, request.storeId)
    return reply.status(200).send(result)
  },

  delete: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    await supplierService.delete(id, request.storeId)
    return reply.status(200).send({ message: "Supplier deleted successfully" })
  },
}

```



> **suppliers.routes.ts**  
> Ruta: `backend-fastify/src/modules/suppliers/presentation/suppliers.routes.ts`  
>
```typescript
import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { suppliersController } from "./suppliers.controller"
import { authGuard, storeGuard } from "@/modules/auth/application/common/auth.guard"

export const suppliersRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  fastify.get(
    "/",
    { preHandler: [authGuard, storeGuard] },
    suppliersController.list
  )

  fastify.get(
    "/:id",
    { preHandler: [authGuard, storeGuard] },
    suppliersController.getById
  )

  fastify.post(
    "/",
    { preHandler: [authGuard, storeGuard] },
    suppliersController.create
  )

  fastify.put(
    "/:id",
    { preHandler: [authGuard, storeGuard] },
    suppliersController.update
  )

  fastify.delete(
    "/:id",
    { preHandler: [authGuard, storeGuard] },
    suppliersController.delete
  )
}

```


### 14.3 Detalles clave

- **`medicineCount`**: el listado trae cuántos medicamentos tiene cada proveedor (LEFT JOIN + COUNT) — útil para la UI de compras.
- **Soft delete** con `deletedAt`; el repositorio filtra siempre `isNull(deletedAt)` en las consultas.
- **Validación de unicidad**: no puede haber dos proveedores con el mismo nombre en la misma tienda (el schema tiene `uq_supplier_store_name`).

## 15. Módulo categories

**Propósito:** categorías de medicamentos (analgésicos, antibióticos, etc.). CRUD simple con búsqueda, unicidad por tienda y soft delete.

### 15.1 Archivos del módulo

| Archivo | Rol |
|---|---|
| `domain/categories.types.ts` | Tipos: `CategoryDTO`, `CreateCategoryInput`, `UpdateCategoryInput`, `CategoryListParams` |
| `domain/categories.entities.ts` | Entidad `CategoryEntity` |
| `domain/categories.interface.ts` | Contrato `ICategoryRepository` |
| `application/categories.service.ts` | CRUD + unicidad de nombre por tienda |
| `application/common/categories.mappers.ts` | Entidad → DTO |
| `infrastructure/categories.drizzle.repository.ts` | Repo Drizzle |
| `presentation/categories.*` | DTO, controller, routes |

### 15.2 Código completo


> **categories.types.ts**  
> Ruta: `backend-fastify/src/modules/categories/domain/categories.types.ts`  
>
```typescript
export interface ICategoryResponse {
  id: string
  name: string
  description?: string
  medicine_count?: number
  created_at: string
  updated_at: string
}

export interface ICategoryListResponse {
  data: ICategoryResponse[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

```



> **categories.entities.ts**  
> Ruta: `backend-fastify/src/modules/categories/domain/categories.entities.ts`  
>
```typescript
export interface ICategoryEntity {
  id: string
  name: string
  description?: string
  created_at: Date
  updated_at: Date
  deleted_at?: Date
  medicine_count?: number
}

export type CreateCategoryData = {
  name: string
  description?: string | null
}

export type UpdateCategoryData = Partial<CreateCategoryData>

```



> **categories.interface.ts**  
> Ruta: `backend-fastify/src/modules/categories/domain/categories.interface.ts`  
>
```typescript
import type { ICategoryEntity, CreateCategoryData, UpdateCategoryData } from "./categories.entities"

export interface ICategoryRepository {
  findAll(params?: { search?: string; page?: number; limit?: number; storeId?: string }): Promise<{ categories: ICategoryEntity[]; total: number; page: number; limit: number }>
  findById(id: string, storeId?: string): Promise<ICategoryEntity | null>
  findByName(name: string, storeId?: string): Promise<ICategoryEntity | null>
  create(data: CreateCategoryData, storeId?: string): Promise<ICategoryEntity>
  update(id: string, data: UpdateCategoryData, storeId?: string): Promise<ICategoryEntity>
  softDelete(id: string, storeId?: string): Promise<void>
}

```



> **categories.service.ts**  
> Ruta: `backend-fastify/src/modules/categories/application/categories.service.ts`  
>
```typescript
import { BadRequestError, ConflictError, NotFoundError } from "@/core/errors/AppError"
import type { ICategoryRepository } from "../domain/categories.interface"
import type { ICategoryResponse, ICategoryListResponse } from "../domain/categories.types"
import type { CreateCategoryData, UpdateCategoryData } from "../domain/categories.entities"
import { mapCategoryToResponse } from "./common/categories.mappers"

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: unknown }).code === "23505"
}

export const createCategoryService = (repository: ICategoryRepository) => ({
  list: async (params?: { search?: string; page?: number; limit?: number; storeId?: string }): Promise<ICategoryListResponse> => {
    const result = await repository.findAll(params)
    return {
      data: result.categories.map(mapCategoryToResponse),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
      },
    }
  },

  getById: async (id: string, storeId?: string): Promise<ICategoryResponse> => {
    const category = await repository.findById(id, storeId)
    if (!category || category.deleted_at) {
      throw new NotFoundError("Category not found")
    }
    return mapCategoryToResponse(category)
  },

  create: async (data: CreateCategoryData, storeId?: string): Promise<ICategoryResponse> => {
    if (!data.name || data.name.trim() === "") {
      throw new BadRequestError("Name is required")
    }

    const existing = await repository.findByName(data.name, storeId)
    if (existing) {
      throw new ConflictError("A category with this name already exists")
    }

    try {
      const category = await repository.create(data, storeId)
      return mapCategoryToResponse(category)
    } catch (err) {
      if (isUniqueViolation(err)) throw new ConflictError("A category with this name already exists")
      throw err
    }
  },

  update: async (id: string, data: UpdateCategoryData, storeId?: string): Promise<ICategoryResponse> => {
    const existing = await repository.findById(id, storeId)
    if (!existing || existing.deleted_at) {
      throw new NotFoundError("Category not found")
    }

    if (data.name && data.name !== existing.name) {
      const duplicate = await repository.findByName(data.name, storeId)
      if (duplicate) {
        throw new ConflictError("A category with this name already exists")
      }
    }

    try {
      const category = await repository.update(id, data, storeId)
      return mapCategoryToResponse(category)
    } catch (err) {
      if (isUniqueViolation(err)) throw new ConflictError("A category with this name already exists")
      throw err
    }
  },

  delete: async (id: string, storeId?: string): Promise<void> => {
    const existing = await repository.findById(id, storeId)
    if (!existing || existing.deleted_at) {
      throw new NotFoundError("Category not found")
    }
    await repository.softDelete(id, storeId)
  },
})

```



> **categories.mappers.ts**  
> Ruta: `backend-fastify/src/modules/categories/application/common/categories.mappers.ts`  
>
```typescript
import { ICategoryResponse } from "../../domain/categories.types";

interface RichCategory {
  id: string
  name: string
  description?: string | null
  created_at: Date
  updated_at: Date
  deleted_at?: Date | null
  medicine_count?: number
}

export function mapCategoryToResponse(category: RichCategory): ICategoryResponse {
  return {
    id: category.id,
    name: category.name,
    description: category.description || undefined,
    medicine_count: category.medicine_count,
    created_at: category.created_at instanceof Date ? category.created_at.toISOString() : category.created_at,
    updated_at: category.updated_at instanceof Date ? category.updated_at.toISOString() : category.updated_at,
  }
}


```



> **categories.drizzle.repository.ts**  
> Ruta: `backend-fastify/src/modules/categories/infrastructure/categories.drizzle.repository.ts`  
>
```typescript
import { randomUUID } from "node:crypto";
import { and, asc, count, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { category, medicine } from "@/db/schema";
import { db } from "@/index";
import { ICategoryRepository } from "../domain/categories.interface";
import { ICategoryEntity, CreateCategoryData, UpdateCategoryData } from "../domain/categories.entities";
import { NotFoundError } from "@/core/errors/AppError";

const medicineCount = sql<number>`(SELECT count(*)::int FROM ${medicine} WHERE ${medicine.categoryId} = ${category.id} AND ${medicine.deletedAt} IS NULL)`;

type CategoryRow = Pick<typeof category.$inferSelect, "id" | "name" | "description" | "createdAt" | "updatedAt" | "deletedAt"> & { medicine_count?: number };

function mapRowToEntity(row: CategoryRow): ICategoryEntity {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    deleted_at: row.deletedAt ?? undefined,
    medicine_count: row.medicine_count,
  };
}

export const CategoryRepository: ICategoryRepository = {
  async findAll(params) {
    const conditions = [isNull(category.deletedAt)];
    if (params?.storeId) conditions.push(eq(category.storeId, params.storeId));
    if (params?.search) {
      conditions.push(
        or(
          ilike(category.name, `%${params.search}%`),
          ilike(category.description, `%${params.search}%`),
        )!,
      );
    }

    const page = params?.page ?? 1;
    const limit = params?.limit ?? 50;

    const [rows, totalRows] = await Promise.all([
      db
        .select({
          id: category.id,
          name: category.name,
          description: category.description,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
          deletedAt: category.deletedAt,
          medicine_count: medicineCount,
        })
        .from(category)
        .where(and(...conditions))
        .orderBy(asc(category.name))
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ total: count() })
        .from(category)
        .where(and(...conditions)),
    ]);

    return {
      categories: rows.map(mapRowToEntity),
      total: totalRows[0]?.total ?? 0,
      page,
      limit,
    };
  },

  async findById(id: string, storeId?: string): Promise<ICategoryEntity | null> {
    const conditions = [eq(category.id, id), isNull(category.deletedAt)];
    if (storeId) conditions.push(eq(category.storeId, storeId));

    const [result] = await db
      .select({
        id: category.id,
        name: category.name,
        description: category.description,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        deletedAt: category.deletedAt,
        medicine_count: medicineCount,
      })
      .from(category)
      .where(and(...conditions))
      .limit(1);

    if (!result) return null;

    return mapRowToEntity(result);
  },

  async findByName(name: string, storeId?: string): Promise<ICategoryEntity | null> {
    const conditions = [eq(category.name, name), isNull(category.deletedAt)];
    if (storeId) conditions.push(eq(category.storeId, storeId));

    const [result] = await db
      .select()
      .from(category)
      .where(and(...conditions))
      .limit(1);

    if (!result) return null;

    return mapRowToEntity(result);
  },

  async create(data: CreateCategoryData, storeId?: string): Promise<ICategoryEntity> {
    const [result] = await db
      .insert(category)
      .values({
        id: randomUUID(),
        name: data.name,
        description: data.description ?? null,
        storeId: storeId!,
      })
      .returning();

    return mapRowToEntity(result);
  },

  async update(id: string, data: UpdateCategoryData, storeId?: string): Promise<ICategoryEntity> {
    const conditions = [eq(category.id, id), isNull(category.deletedAt)];
    if (storeId) conditions.push(eq(category.storeId, storeId));

    const [result] = await db
      .update(category)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
      })
      .where(and(...conditions))
      .returning();

    if (!result) throw new NotFoundError("Category not found");

    return mapRowToEntity(result);
  },

  async softDelete(id: string, storeId?: string): Promise<void> {
    const conditions = [eq(category.id, id), isNull(category.deletedAt)];
    if (storeId) conditions.push(eq(category.storeId, storeId));

    await db
      .update(category)
      .set({ deletedAt: new Date() })
      .where(and(...conditions));
  },
};

```



> **categories.dto.ts**  
> Ruta: `backend-fastify/src/modules/categories/presentation/categories.dto.ts`  
>
```typescript
import { z } from "zod"

export const CreateCategoryDtoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
})

export const UpdateCategoryDtoSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
})

export const CategoryQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export type CreateCategoryDto = z.infer<typeof CreateCategoryDtoSchema>
export type UpdateCategoryDto = z.infer<typeof UpdateCategoryDtoSchema>
export type CategoryQueryDto = z.infer<typeof CategoryQuerySchema>

```



> **categories.controller.ts**  
> Ruta: `backend-fastify/src/modules/categories/presentation/categories.controller.ts`  
>
```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { createCategoryService } from "../application/categories.service"
import { CategoryRepository } from "../infrastructure/categories.drizzle.repository"
import type { UpdateCategoryData } from "../domain/categories.entities"
import { CreateCategoryDtoSchema, UpdateCategoryDtoSchema, CategoryQuerySchema } from "./categories.dto"

const categoryService = createCategoryService(CategoryRepository)

export const categoriesController = {
  listSimple: async (request: FastifyRequest, reply: FastifyReply) => {
    const categories = await CategoryRepository.findAll({ storeId: request.storeId, limit: 100 })
    return reply.status(200).send(
      categories.categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description ?? null,
      })),
    )
  },

  list: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = CategoryQuerySchema.parse(request.query)
    const result = await categoryService.list({ ...query, storeId: request.storeId })
    return reply.status(200).send(result)
  },

  getById: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const result = await categoryService.getById(id, request.storeId)
    return reply.status(200).send(result)
  },

  create: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = CreateCategoryDtoSchema.parse(request.body)
    const result = await categoryService.create(data, request.storeId)
    return reply.status(201).send(result)
  },

  update: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const data = UpdateCategoryDtoSchema.parse(request.body)
    const result = await categoryService.update(id, data as UpdateCategoryData, request.storeId)
    return reply.status(200).send(result)
  },

  delete: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    await categoryService.delete(id, request.storeId)
    return reply.status(200).send({ message: "Category deleted successfully" })
  },
}

```



> **categories.routes.ts**  
> Ruta: `backend-fastify/src/modules/categories/presentation/categories.routes.ts`  
>
```typescript
import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { categoriesController } from "./categories.controller"
import { authGuard, storeGuard } from "@/modules/auth/application/common/auth.guard"

export const categoriesRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  fastify.get(
    "/",
    { preHandler: [authGuard, storeGuard] },
    categoriesController.listSimple
  )

  fastify.get(
    "/paginated",
    { preHandler: [authGuard, storeGuard] },
    categoriesController.list
  )

  fastify.get(
    "/:id",
    { preHandler: [authGuard, storeGuard] },
    categoriesController.getById
  )

  fastify.post(
    "/",
    { preHandler: [authGuard, storeGuard] },
    categoriesController.create
  )

  fastify.put(
    "/:id",
    { preHandler: [authGuard, storeGuard] },
    categoriesController.update
  )

  fastify.delete(
    "/:id",
    { preHandler: [authGuard, storeGuard] },
    categoriesController.delete
  )
}

```


### 15.3 Detalles clave

- Módulo "delgado": sin reglas complejas — el patrón de CRUD base sobre el que se construyen los demás módulos.
- `uq_category_store_name` como índice único de unicidad (store_id + name).

## 16. Módulo medicines

**Propósito:** catálogo de medicamentos — el corazón del sistema. CRUD con búsqueda por nombre/laboratorio/código, estados (ACTIVO/INACTIVO), campos de negocio (requiere receta, unidad de medida, precio costo/venta, laboratorio, stock inicial) y conteos de stock/lotes integrados.

### 16.1 Archivos del módulo

| Archivo | Rol |
|---|---|
| `domain/medicines.types.ts` | Tipos: `MedicineStatus`, `MedicineDTO`, inputs, params de listado |
| `domain/medicines.entities.ts` | Entidad `MedicineEntity` |
| `domain/medicines.interface.ts` | Contrato `IMedicineRepository` |
| `application/medicines.service.ts` | CRUD + reglas: code único por tienda, stock inicial, cambio de nombre con code |
| `application/common/medicines.mappers.ts` | Entidad → DTO (number conversion) |
| `infrastructure/medicines.drizzle.repository.ts` | Repo Drizzle con filtros complejos (search OR, joins light) |
| `presentation/medicines.*` | DTO, controller, routes |
| `__tests__/medicines.service.test.ts` + `medicine.test-helpers.ts` | Tests + helpers de fixtures |

### 16.2 Código completo


> **medicines.types.ts**  
> Ruta: `backend-fastify/src/modules/medicines/domain/medicines.types.ts`  
>
```typescript
export interface IMedicineRelation {
  id: string
  name: string
}

export interface IMedicineResponse {
  id: string
  barcode?: string
  internal_code?: string
  commercial_name: string
  generic_name?: string
  active_ingredient?: string
  concentration?: string
  presentation?: string
  pharmaceutical_form?: string
  laboratory?: string
  category_id?: string
  supplier_id?: string
  unit_type?: string
  unit_quantity?: number
  purchase_price: number
  sale_price: number
  stock: number
  low_stock_threshold: number
  requires_prescription: boolean
  is_controlled: boolean
  image?: string
  active: boolean
  category?: IMedicineRelation | null
  supplier?: IMedicineRelation | null
  created_at: string
  updated_at: string
}

export interface IMedicineListResponse {
  data: IMedicineResponse[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

```



> **medicines.entities.ts**  
> Ruta: `backend-fastify/src/modules/medicines/domain/medicines.entities.ts`  
>
```typescript
export interface IMedicineEntity {
  id: string
  barcode?: string
  internal_code?: string
  commercial_name: string
  generic_name?: string
  active_ingredient?: string
  concentration?: string
  presentation?: string
  pharmaceutical_form?: string
  laboratory?: string
  category_id?: string
  supplier_id?: string
  unit_type?: string
  unit_quantity?: number
  purchase_price: number
  sale_price: number
  stock: number
  low_stock_threshold: number
  requires_prescription: boolean
  is_controlled: boolean
  image?: string
  active: boolean
  created_at: Date
  updated_at: Date
  deleted_at?: Date
}

export type CreateMedicineData = {
  barcode?: string
  internal_code?: string
  commercial_name: string
  generic_name?: string
  active_ingredient?: string
  concentration?: string
  presentation?: string
  pharmaceutical_form?: string
  laboratory?: string
  category_id?: string
  supplier_id?: string
  unit_type?: string
  unit_quantity?: number
  purchase_price?: number
  sale_price: number
  stock?: number
  low_stock_threshold?: number
  requires_prescription?: boolean
  is_controlled?: boolean
  image?: string
  active?: boolean
}

export type UpdateMedicineData = Partial<CreateMedicineData> & {
  category_id?: string | null
  supplier_id?: string | null
  unit_type?: string | null
}

```



> **medicines.interface.ts**  
> Ruta: `backend-fastify/src/modules/medicines/domain/medicines.interface.ts`  
>
```typescript
import type { IMedicineEntity, CreateMedicineData, UpdateMedicineData } from "./medicines.entities"

export interface IMedicineRepository {
  findAll(params?: {
    search?: string
    category_id?: string
    supplier_id?: string
    active?: boolean
    requires_prescription?: boolean
    is_controlled?: boolean
    lowStock?: boolean
    outOfStock?: boolean
    page?: number
    limit?: number
    storeId?: string
  }): Promise<{ medicines: IMedicineEntity[]; total: number; page: number; limit: number }>
  findById(id: string, storeId?: string): Promise<IMedicineEntity | null>
  findByBarcode(barcode: string, storeId?: string): Promise<IMedicineEntity | null>
  create(data: CreateMedicineData, storeId?: string): Promise<IMedicineEntity>
  update(id: string, data: UpdateMedicineData, storeId?: string): Promise<IMedicineEntity>
  softDelete(id: string, storeId?: string): Promise<void>
  updateStock(id: string, quantity: number, storeId?: string): Promise<IMedicineEntity>
}

```



> **medicines.service.ts**  
> Ruta: `backend-fastify/src/modules/medicines/application/medicines.service.ts`  
>
```typescript
import { ConflictError, NotFoundError } from "@/core/errors/AppError"
import type { IMedicineRepository } from "../domain/medicines.interface"
import type { CreateMedicineData, UpdateMedicineData } from "../domain/medicines.entities"
import type { IMedicineListResponse, IMedicineResponse } from "../domain/medicines.types"
import { mapMedicineToResponse, isUniqueViolation } from "./common/medicines.mappers"

export const createMedicineService = (repository: IMedicineRepository) => ({
  list: async (params?: Parameters<IMedicineRepository["findAll"]>[0]): Promise<IMedicineListResponse> => {
    const result = await repository.findAll(params)
    return {
      data: result.medicines.map((medicine) => mapMedicineToResponse(medicine)),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
      },
    }
  },

  getById: async (id: string, storeId?: string): Promise<IMedicineResponse> => {
    const medicine = await repository.findById(id, storeId)
    if (!medicine || medicine.deleted_at) throw new NotFoundError("Medicine not found")
    return mapMedicineToResponse(medicine)
  },

  getByBarcode: async (barcode: string, storeId?: string): Promise<IMedicineResponse | null> => {
    const medicine = await repository.findByBarcode(barcode, storeId)
    return medicine && !medicine.deleted_at ? mapMedicineToResponse(medicine) : null
  },

  create: async (data: CreateMedicineData, storeId?: string): Promise<IMedicineResponse> => {
    if (data.barcode && await repository.findByBarcode(data.barcode, storeId)) {
      throw new ConflictError("A medicine with this barcode already exists")
    }
    try {
      const medicine = await repository.create(data, storeId)
      return mapMedicineToResponse(medicine)
    } catch (err) {
      if (isUniqueViolation(err)) throw new ConflictError("A medicine with this barcode already exists")
      throw err
    }
  },

  update: async (id: string, data: UpdateMedicineData, storeId?: string): Promise<IMedicineResponse> => {
    const existing = await repository.findById(id, storeId)
    if (!existing || existing.deleted_at) throw new NotFoundError("Medicine not found")
    if (data.barcode && data.barcode !== existing.barcode) {
      const duplicate = await repository.findByBarcode(data.barcode, storeId)
      if (duplicate && duplicate.id !== id) throw new ConflictError("A medicine with this barcode already exists")
    }
    try {
      const medicine = await repository.update(id, data, storeId)
      return mapMedicineToResponse(medicine)
    } catch (err) {
      if (isUniqueViolation(err)) throw new ConflictError("A medicine with this barcode already exists")
      throw err
    }
  },

  delete: async (id: string, storeId?: string): Promise<void> => {
    const existing = await repository.findById(id, storeId)
    if (!existing || existing.deleted_at) throw new NotFoundError("Medicine not found")
    await repository.softDelete(id, storeId)
  },
})

```



> **medicines.mappers.ts**  
> Ruta: `backend-fastify/src/modules/medicines/application/common/medicines.mappers.ts`  
>
```typescript
import { IMedicineEntity } from "../../domain/medicines.entities";
import { IMedicineResponse } from "../../domain/medicines.types";

export interface RichMedicineEntity extends IMedicineEntity {
  category?: { id: string; name: string } | null
  supplier?: { id: string; name: string } | null
}

export function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: unknown }).code === "23505"
}

export function mapMedicineToResponse(medicine: RichMedicineEntity): IMedicineResponse {
  return {
    id: medicine.id,
    barcode: medicine.barcode || undefined,
    internal_code: medicine.internal_code || undefined,
    commercial_name: medicine.commercial_name,
    generic_name: medicine.generic_name || undefined,
    active_ingredient: medicine.active_ingredient || undefined,
    concentration: medicine.concentration || undefined,
    presentation: medicine.presentation || undefined,
    pharmaceutical_form: medicine.pharmaceutical_form || undefined,
    laboratory: medicine.laboratory || undefined,
    category_id: medicine.category_id || undefined,
    supplier_id: medicine.supplier_id || undefined,
    unit_type: medicine.unit_type || undefined,
    unit_quantity: medicine.unit_quantity ?? undefined,
    purchase_price: Number(medicine.purchase_price),
    sale_price: Number(medicine.sale_price),
    stock: medicine.stock,
    low_stock_threshold: medicine.low_stock_threshold,
    requires_prescription: medicine.requires_prescription,
    is_controlled: medicine.is_controlled,
    image: medicine.image || undefined,
    active: medicine.active,
    category: medicine.category ?? null,
    supplier: medicine.supplier ?? null,
    created_at: medicine.created_at.toISOString(),
    updated_at: medicine.updated_at.toISOString(),
  }
}

```



> **medicines.drizzle.repository.ts**  
> Ruta: `backend-fastify/src/modules/medicines/infrastructure/medicines.drizzle.repository.ts`  
>
```typescript
import { randomUUID } from "node:crypto";
import { and, asc, count, eq, gt, ilike, isNull, lte, or, sql } from "drizzle-orm";
import { category, medicine, supplier, unitTypeEnum } from "@/db/schema";
import { db } from "@/index";
import { IMedicineRepository } from "../domain/medicines.interface";
import { CreateMedicineData, IMedicineEntity, UpdateMedicineData } from "../domain/medicines.entities";
import { NotFoundError } from "@/core/errors/AppError";

type MedicineRow = typeof medicine.$inferSelect;
type CategoryRow = typeof category.$inferSelect;
type SupplierRow = typeof supplier.$inferSelect;
type UnitType = (typeof unitTypeEnum)["enumValues"][number];

type RichMedicineEntity = IMedicineEntity & {
  category?: { id: string; name: string } | null
  supplier?: { id: string; name: string } | null
}

function mapRowToEntity(
  row: MedicineRow,
  categoryRow?: CategoryRow | null,
  supplierRow?: SupplierRow | null,
): RichMedicineEntity {
  return {
    id: row.id,
    barcode: row.barcode || undefined,
    internal_code: row.internalCode || undefined,
    commercial_name: row.commercialName,
    generic_name: row.genericName || undefined,
    active_ingredient: row.activeIngredient || undefined,
    concentration: row.concentration || undefined,
    presentation: row.presentation || undefined,
    pharmaceutical_form: row.pharmaceuticalForm || undefined,
    laboratory: row.laboratory || undefined,
    category_id: row.categoryId || undefined,
    supplier_id: row.supplierId || undefined,
    unit_type: row.unitType || undefined,
    unit_quantity: row.unitQuantity ?? undefined,
    purchase_price: Number(row.purchasePrice),
    sale_price: Number(row.salePrice),
    stock: row.stock,
    low_stock_threshold: row.lowStockThreshold,
    requires_prescription: row.requiresPrescription,
    is_controlled: row.isControlled,
    image: row.image || undefined,
    active: row.active,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    deleted_at: row.deletedAt ?? undefined,
    category: categoryRow ? { id: categoryRow.id, name: categoryRow.name } : null,
    supplier: supplierRow ? { id: supplierRow.id, name: supplierRow.name } : null,
  };
}

export const MedicineRepository: IMedicineRepository = {
  async findAll(params) {
    const conditions = [isNull(medicine.deletedAt)];
    if (params?.storeId) conditions.push(eq(medicine.storeId, params.storeId));
    if (params?.search) {
      conditions.push(
        or(
          ilike(medicine.commercialName, `%${params.search}%`),
          ilike(medicine.genericName, `%${params.search}%`),
          ilike(medicine.activeIngredient, `%${params.search}%`),
          ilike(medicine.barcode, `%${params.search}%`),
          ilike(medicine.internalCode, `%${params.search}%`),
        )!,
      );
    }
    if (params?.category_id) conditions.push(eq(medicine.categoryId, params.category_id));
    if (params?.supplier_id) conditions.push(eq(medicine.supplierId, params.supplier_id));
    if (params?.active !== undefined) conditions.push(eq(medicine.active, params.active));
    if (params?.requires_prescription !== undefined) conditions.push(eq(medicine.requiresPrescription, params.requires_prescription));
    if (params?.is_controlled !== undefined) conditions.push(eq(medicine.isControlled, params.is_controlled));
    if (params?.outOfStock) conditions.push(lte(medicine.stock, 0));
    if (params?.lowStock) {
      conditions.push(gt(medicine.stock, 0), lte(medicine.stock, medicine.lowStockThreshold));
    }

    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;

    const rows = await db
      .select({
        medicine: medicine,
        category: category,
        supplier: supplier,
      })
      .from(medicine)
      .leftJoin(category, eq(medicine.categoryId, category.id))
      .leftJoin(supplier, eq(medicine.supplierId, supplier.id))
      .where(and(...conditions))
      .orderBy(asc(medicine.commercialName))
      .limit(limit)
      .offset((page - 1) * limit);

    const [totalRows] = await db
      .select({ total: count() })
      .from(medicine)
      .where(and(...conditions));

    return {
      medicines: rows.map((row) => mapRowToEntity(row.medicine, row.category, row.supplier)),
      total: totalRows?.total ?? 0,
      page,
      limit,
    };
  },

  async findById(id: string, storeId?: string): Promise<IMedicineEntity | null> {
    const conditions = [eq(medicine.id, id), isNull(medicine.deletedAt)];
    if (storeId) conditions.push(eq(medicine.storeId, storeId));

    const [row] = await db
      .select({
        medicine: medicine,
        category: category,
        supplier: supplier,
      })
      .from(medicine)
      .leftJoin(category, eq(medicine.categoryId, category.id))
      .leftJoin(supplier, eq(medicine.supplierId, supplier.id))
      .where(and(...conditions))
      .limit(1);

    if (!row) return null;

    return mapRowToEntity(row.medicine, row.category, row.supplier);
  },

  async findByBarcode(barcode: string, storeId?: string): Promise<IMedicineEntity | null> {
    const conditions = [eq(medicine.barcode, barcode), isNull(medicine.deletedAt)];
    if (storeId) conditions.push(eq(medicine.storeId, storeId));

    const [row] = await db
      .select({
        medicine: medicine,
        category: category,
        supplier: supplier,
      })
      .from(medicine)
      .leftJoin(category, eq(medicine.categoryId, category.id))
      .leftJoin(supplier, eq(medicine.supplierId, supplier.id))
      .where(and(...conditions))
      .limit(1);

    if (!row) return null;

    return mapRowToEntity(row.medicine, row.category, row.supplier);
  },

  async create(data: CreateMedicineData, storeId?: string): Promise<IMedicineEntity> {
    const [result] = await db
      .insert(medicine)
      .values({
        id: randomUUID(),
        barcode: data.barcode ?? null,
        internalCode: data.internal_code ?? null,
        commercialName: data.commercial_name,
        genericName: data.generic_name ?? null,
        activeIngredient: data.active_ingredient ?? null,
        concentration: data.concentration ?? null,
        presentation: data.presentation ?? null,
        pharmaceuticalForm: data.pharmaceutical_form ?? null,
        laboratory: data.laboratory ?? null,
        categoryId: data.category_id ?? null,
        supplierId: data.supplier_id ?? null,
        unitType: (data.unit_type as UnitType | undefined) ?? null,
        unitQuantity: data.unit_quantity ?? null,
        purchasePrice: (data.purchase_price ?? 0).toString(),
        salePrice: data.sale_price.toString(),
        stock: data.stock ?? 0,
        lowStockThreshold: data.low_stock_threshold ?? 5,
        requiresPrescription: data.requires_prescription ?? false,
        isControlled: data.is_controlled ?? false,
        image: data.image ?? null,
        active: data.active ?? true,
        storeId: storeId!,
      })
      .returning();

    return mapRowToEntity(result);
  },

  async update(id: string, data: UpdateMedicineData, storeId?: string): Promise<IMedicineEntity> {
    const conditions = [eq(medicine.id, id), isNull(medicine.deletedAt)];
    if (storeId) conditions.push(eq(medicine.storeId, storeId));

    const [result] = await db
      .update(medicine)
      .set({
        ...(data.barcode !== undefined && { barcode: data.barcode }),
        ...(data.internal_code !== undefined && { internalCode: data.internal_code }),
        ...(data.commercial_name !== undefined && { commercialName: data.commercial_name }),
        ...(data.generic_name !== undefined && { genericName: data.generic_name }),
        ...(data.active_ingredient !== undefined && { activeIngredient: data.active_ingredient }),
        ...(data.concentration !== undefined && { concentration: data.concentration }),
        ...(data.presentation !== undefined && { presentation: data.presentation }),
        ...(data.pharmaceutical_form !== undefined && { pharmaceuticalForm: data.pharmaceutical_form }),
        ...(data.laboratory !== undefined && { laboratory: data.laboratory }),
        ...(data.category_id !== undefined && { categoryId: data.category_id }),
        ...(data.supplier_id !== undefined && { supplierId: data.supplier_id }),
        ...(data.unit_type !== undefined && { unitType: (data.unit_type as UnitType | undefined) ?? null }),
        ...(data.unit_quantity !== undefined && { unitQuantity: data.unit_quantity }),
        ...(data.purchase_price !== undefined && { purchasePrice: data.purchase_price.toString() }),
        ...(data.sale_price !== undefined && { salePrice: data.sale_price.toString() }),
        ...(data.stock !== undefined && { stock: data.stock }),
        ...(data.low_stock_threshold !== undefined && { lowStockThreshold: data.low_stock_threshold }),
        ...(data.requires_prescription !== undefined && { requiresPrescription: data.requires_prescription }),
        ...(data.is_controlled !== undefined && { isControlled: data.is_controlled }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.active !== undefined && { active: data.active }),
      })
      .where(and(...conditions))
      .returning();

    if (!result) throw new NotFoundError("Medicine not found");

    return mapRowToEntity(result);
  },

  async softDelete(id: string, storeId?: string): Promise<void> {
    const conditions = [eq(medicine.id, id), isNull(medicine.deletedAt)];
    if (storeId) conditions.push(eq(medicine.storeId, storeId));

    await db
      .update(medicine)
      .set({ deletedAt: new Date() })
      .where(and(...conditions));
  },

  async updateStock(id: string, quantity: number, storeId?: string): Promise<IMedicineEntity> {
    const conditions = [eq(medicine.id, id), isNull(medicine.deletedAt)];
    if (storeId) conditions.push(eq(medicine.storeId, storeId));

    const [result] = await db
      .update(medicine)
      .set({ stock: sql`${medicine.stock} + ${quantity}` })
      .where(and(...conditions))
      .returning();

    if (!result) throw new NotFoundError("Medicine not found");

    return mapRowToEntity(result);
  },
};

```



> **medicines.dto.ts**  
> Ruta: `backend-fastify/src/modules/medicines/presentation/medicines.dto.ts`  
>
```typescript
import { z } from "zod"

const unitTypes = ["unidad", "paquete", "caja", "frasco", "tubo", "sobre", "blister", "ampolleta", "gotero", "aerosol", "crema", "jarabe", "tableta", "capsula", "botella", "bolsa"] as const

export const CreateMedicineDtoSchema = z.object({
  barcode: z.string().optional(),
  internal_code: z.string().optional(),
  commercial_name: z.string().trim().min(1, "Commercial name is required"),
  generic_name: z.string().optional(),
  active_ingredient: z.string().optional(),
  concentration: z.string().optional(),
  presentation: z.string().optional(),
  pharmaceutical_form: z.string().optional(),
  laboratory: z.string().optional(),
  category_id: z.string().uuid().optional().nullable(),
  supplier_id: z.string().uuid().optional().nullable(),
  unit_type: z.enum(unitTypes).optional().nullable(),
  unit_quantity: z.number().int().positive().optional(),
  purchase_price: z.number().min(0).optional(),
  sale_price: z.number().positive("Sale price must be positive"),
  stock: z.number().int().min(0).optional(),
  low_stock_threshold: z.number().int().min(0).optional(),
  requires_prescription: z.boolean().optional(),
  is_controlled: z.boolean().optional(),
  image: z.string().optional(),
  active: z.boolean().optional(),
})

export const UpdateMedicineDtoSchema = CreateMedicineDtoSchema.partial()

export const MedicineQuerySchema = z.object({
  search: z.string().optional(),
  category_id: z.string().optional(),
  supplier_id: z.string().optional(),
  active: z.coerce.boolean().optional(),
  requires_prescription: z.coerce.boolean().optional(),
  is_controlled: z.coerce.boolean().optional(),
  low_stock: z.coerce.boolean().optional(),
  out_of_stock: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export type CreateMedicineDto = z.infer<typeof CreateMedicineDtoSchema>
export type UpdateMedicineDto = z.infer<typeof UpdateMedicineDtoSchema>
export type MedicineQueryDto = z.infer<typeof MedicineQuerySchema>

```



> **medicines.controller.ts**  
> Ruta: `backend-fastify/src/modules/medicines/presentation/medicines.controller.ts`  
>
```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { createMedicineService } from "../application/medicines.service"
import { MedicineRepository } from "../infrastructure/medicines.drizzle.repository"
import type { CreateMedicineData, UpdateMedicineData } from "../domain/medicines.entities"
import { CreateMedicineDtoSchema, MedicineQuerySchema, UpdateMedicineDtoSchema } from "./medicines.dto"

const medicineService = createMedicineService(MedicineRepository)

export const medicinesController = {
  list: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = MedicineQuerySchema.parse(request.query)
    const result = await medicineService.list({
      ...query,
      lowStock: query.low_stock,
      outOfStock: query.out_of_stock,
      storeId: request.storeId,
    })
    return reply.status(200).send(result)
  },

  getById: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    return reply.status(200).send(await medicineService.getById(id, request.storeId))
  },

  getByBarcode: async (request: FastifyRequest, reply: FastifyReply) => {
    const { barcode } = request.params as { barcode: string }
    const result = await medicineService.getByBarcode(barcode, request.storeId)
    if (!result) return reply.status(404).send({ message: "Medicine not found" })
    return reply.status(200).send(result)
  },

  create: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = CreateMedicineDtoSchema.parse(request.body) as CreateMedicineData
    return reply.status(201).send(await medicineService.create(data, request.storeId))
  },

  update: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const data = UpdateMedicineDtoSchema.parse(request.body) as UpdateMedicineData
    return reply.status(200).send(await medicineService.update(id, data, request.storeId))
  },

  delete: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    await medicineService.delete(id, request.storeId)
    return reply.status(200).send({ message: "Medicine deleted successfully" })
  },
}

```



> **medicines.routes.ts**  
> Ruta: `backend-fastify/src/modules/medicines/presentation/medicines.routes.ts`  
>
```typescript
import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { medicinesController } from "./medicines.controller"
import { authGuard, storeGuard } from "@/modules/auth/application/common/auth.guard"

export const medicinesRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  fastify.get(
    "/",
    { preHandler: [authGuard, storeGuard] },
    medicinesController.list
  )

  fastify.get(
    "/barcode/:barcode",
    { preHandler: [authGuard, storeGuard] },
    medicinesController.getByBarcode
  )

  fastify.get(
    "/:id",
    { preHandler: [authGuard, storeGuard] },
    medicinesController.getById
  )

  fastify.post(
    "/",
    { preHandler: [authGuard, storeGuard] },
    medicinesController.create
  )

  fastify.put(
    "/:id",
    { preHandler: [authGuard, storeGuard] },
    medicinesController.update
  )

  fastify.delete(
    "/:id",
    { preHandler: [authGuard, storeGuard] },
    medicinesController.delete
  )
}

```



> **medicine.test-helpers.ts — factories de fixtures**  
> Ruta: `backend-fastify/src/modules/medicines/__tests__/medicine.test-helpers.ts`  
>
```typescript
import { vi } from "vitest"
import type { IMedicineEntity } from "@/modules/medicines/domain/medicines.entities"
import type { IMedicineRepository } from "@/modules/medicines/domain/medicines.interface"
import { makeMedicine } from "@/__tests__/helpers"

export { makeMedicine }

export function mockMedicineRepository(overrides?: Partial<IMedicineRepository>): IMedicineRepository {
  return {
    findAll: vi.fn().mockResolvedValue({ medicines: [makeMedicine()], total: 1, page: 1, limit: 10 }),
    findById: vi.fn().mockResolvedValue(makeMedicine()),
    findByBarcode: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(makeMedicine()),
    update: vi.fn().mockResolvedValue(makeMedicine()),
    softDelete: vi.fn().mockResolvedValue(undefined),
    updateStock: vi.fn().mockResolvedValue(makeMedicine()),
    ...overrides,
  }
}
```


### 16.3 Detalles clave

- **`code` único por tienda**: el servicio valida antes de insertar/actualizar; el schema agrega `uq_medicine_store_code`.
- **Búsqueda por código de barras**: `GET /medicines/barcode/:barcode` — lookup directo por `barcode` del medicamento (para el escáner del punto de venta).
- **Activo/inactivo**: campo booleano `active` en la tabla (default `true`); las ventas solo toman medicamentos con `active = true` y sin `deletedAt`.
- **`requiresPrescription`**: flag que participa en la validación de venta (ver [Módulo sales](#21-módulo-sales)).
- **Búsqueda flexible**: el repo arma `OR` de condiciones (nombre contiene, laboratorio contiene, código exacto) y filtra siempre por store + no-borrado.

## 17. Módulo clients

**Propósito:** pacientes/clientes de la farmacia. CRUD con búsqueda y paginación, datos clínicos (alergias, sexo), flag de cliente frecuente, soft delete, y **historial de compras del cliente** (todas sus ventas con items).

### 17.1 Archivos del módulo

| Archivo | Rol |
|---|---|
| `domain/clients.types.ts` | Tipos: `ClientDTO`, `CreateClientInput`, `UpdateClientInput`, `ClientListParams`, `ClientHistory` |
| `domain/clients.entities.ts` | Entidad `ClientEntity` |
| `domain/clients.interface.ts` | Contrato `IClientRepository` (incluye `findHistoryByClientId`) |
| `application/clients.service.ts` | CRUD + historial |
| `application/common/clients.mappers.ts` | Entidad → DTO |
| `infrastructure/clients.drizzle.repository.ts` | Repo Drizzle (búsqueda OR, paginación, history con JOIN sales/items) |
| `presentation/clients.*` | DTO, controller, routes |

### 17.2 Código completo


> **clients.types.ts**  
> Ruta: `backend-fastify/src/modules/clients/domain/clients.types.ts`  
>
```typescript
export interface IClientResponse {
  id: string
  full_name: string
  document_type: string
  document_number?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  birth_date?: string | null
  sex?: string | null
  allergies?: string | null
  chronic_diseases?: string | null
  observations?: string | null
  is_frequent: boolean
  created_at: string
  updated_at: string
}

export interface IClientListResponse {
  data: IClientResponse[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export interface IClientSaleSummary {
  id: string
  total: number
  created_at: string
}

export interface IClientPrescriptionSummary {
  id: string
  number: string
  status: string
}

export interface IFrequentProduct {
  medicine_id: string
  medicine_name: string
  quantity: number
}

export interface IClientHistoryResponse {
  client: IClientResponse
  sales: IClientSaleSummary[]
  prescriptions: IClientPrescriptionSummary[]
  total_spent: number
  visit_count: number
  frequent_products: IFrequentProduct[]
}

```



> **clients.entities.ts**  
> Ruta: `backend-fastify/src/modules/clients/domain/clients.entities.ts`  
>
```typescript
export interface IClientEntity {
  id: string
  full_name: string
  document_type: string
  document_number?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  birth_date?: Date | null
  sex?: string | null
  allergies?: string | null
  chronic_diseases?: string | null
  observations?: string | null
  is_frequent: boolean
  created_at: Date
  updated_at: Date
  deleted_at?: Date | null
}

export type CreateClientData = {
  full_name: string
  document_type?: string
  document_number?: string
  phone?: string
  email?: string
  address?: string
  birth_date?: string
  sex?: string
  allergies?: string
  chronic_diseases?: string
  observations?: string
  is_frequent?: boolean
}

export type UpdateClientData = Partial<CreateClientData>

```



> **clients.interface.ts**  
> Ruta: `backend-fastify/src/modules/clients/domain/clients.interface.ts`  
>
```typescript
import type { IClientEntity, CreateClientData, UpdateClientData } from "./clients.entities"

export interface IClientSaleRow {
  id: string
  total: number
  created_at: string
  payment_method: string
}

export interface IClientPrescriptionRow {
  id: string
  number: string
  status: string
}

export interface IFrequentProductRow {
  medicine_id: string
  medicine_name: string
  quantity: number
}

export interface IClientRepository {
  findAll(params?: { search?: string; is_frequent?: boolean; page?: number; limit?: number; storeId?: string }): Promise<{ clients: IClientEntity[]; total: number; page: number; limit: number }>
  findById(id: string, storeId?: string): Promise<IClientEntity | null>
  create(data: CreateClientData, storeId: string): Promise<IClientEntity>
  update(id: string, data: UpdateClientData, storeId: string): Promise<IClientEntity>
  softDelete(id: string, storeId: string): Promise<void>
  findSalesByClient(id: string, storeId: string): Promise<IClientSaleRow[]>
  findPrescriptionsByClient(id: string, storeId: string): Promise<IClientPrescriptionRow[]>
  findFrequentProductsByClient(id: string, storeId: string): Promise<IFrequentProductRow[]>
}

```



> **clients.service.ts**  
> Ruta: `backend-fastify/src/modules/clients/application/clients.service.ts`  
>
```typescript
import { BadRequestError, NotFoundError } from "@/core/errors/AppError"
import type { IClientRepository } from "../domain/clients.interface"
import type { CreateClientData, IClientEntity, UpdateClientData } from "../domain/clients.entities"
import type { IClientHistoryResponse, IClientListResponse, IClientResponse, IClientSaleSummary } from "../domain/clients.types"
import { mapClient } from "./common/clients.mappers"

async function findOrThrow(repository: IClientRepository, id: string, storeId: string): Promise<IClientEntity> {
  const client = await repository.findById(id, storeId)
  if (!client) throw new NotFoundError("Client not found")
  return client
}

export const createClientService = (repository: IClientRepository) => ({
  list: async (params?: Parameters<IClientRepository["findAll"]>[0]): Promise<IClientListResponse> => {
    const result = await repository.findAll(params)
    return { data: result.clients.map(mapClient), meta: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.max(1, Math.ceil(result.total / result.limit)) } }
  },

  getById: async (id: string, storeId: string): Promise<IClientResponse> => {
    return mapClient(await findOrThrow(repository, id, storeId))
  },

  create: async (data: CreateClientData, storeId: string): Promise<IClientResponse> => {
    if (!data.full_name?.trim()) throw new BadRequestError("Full name is required")
    return mapClient(await repository.create(data, storeId))
  },

  update: async (id: string, data: UpdateClientData, storeId: string): Promise<IClientResponse> => {
    await findOrThrow(repository, id, storeId)
    return mapClient(await repository.update(id, data, storeId))
  },

  delete: async (id: string, storeId: string): Promise<void> => {
    await findOrThrow(repository, id, storeId)
    await repository.softDelete(id, storeId)
  },

  getHistory: async (id: string, storeId: string): Promise<IClientHistoryResponse> => {
    const client = mapClient(await findOrThrow(repository, id, storeId))

    // El repositorio ya filtra status='completada' para ventas y deletedAt IS NULL
    // para recetas; el servicio solo agrega sobre filas ya filtradas.
    const [sales, prescriptions, frequent_products] = await Promise.all([
      repository.findSalesByClient(id, storeId),
      repository.findPrescriptionsByClient(id, storeId),
      repository.findFrequentProductsByClient(id, storeId),
    ])

    const saleSummaries: IClientSaleSummary[] = sales.map((sale) => ({
      id: sale.id,
      total: Number(sale.total),
      created_at: sale.created_at,
    }))

    return {
      client,
      sales: saleSummaries,
      prescriptions,
      total_spent: sales.reduce((sum, sale) => sum + Number(sale.total), 0),
      visit_count: sales.length,
      frequent_products,
    }
  },
})

```



> **clients.mappers.ts**  
> Ruta: `backend-fastify/src/modules/clients/application/common/clients.mappers.ts`  
>
```typescript
import { IClientEntity } from "../../domain/clients.entities";
import { IClientResponse } from "../../domain/clients.types";

export function mapClient(client: IClientEntity): IClientResponse {
  return {
    id: client.id,
    full_name: client.full_name,
    document_type: client.document_type,
    document_number: client.document_number ?? null,
    phone: client.phone ?? null,
    email: client.email ?? null,
    address: client.address ?? null,
    birth_date: client.birth_date instanceof Date ? client.birth_date.toISOString() : client.birth_date ?? null,
    sex: client.sex ?? null,
    allergies: client.allergies ?? null,
    chronic_diseases: client.chronic_diseases ?? null,
    observations: client.observations ?? null,
    is_frequent: client.is_frequent,
    created_at: client.created_at.toISOString(),
    updated_at: client.updated_at.toISOString(),
  }
}


```



> **clients.drizzle.repository.ts**  
> Ruta: `backend-fastify/src/modules/clients/infrastructure/clients.drizzle.repository.ts`  
>
```typescript
import { randomUUID } from "node:crypto";
import { and, asc, count, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { client, prescription, sale, saleItem } from "@/db/schema";
import { db } from "@/index";
import { IClientRepository } from "../domain/clients.interface";
import { IClientEntity, CreateClientData, UpdateClientData } from "../domain/clients.entities";
import { NotFoundError } from "@/core/errors/AppError";

function mapRowToEntity(row: typeof client.$inferSelect): IClientEntity {
  return {
    id: row.id,
    full_name: row.fullName,
    document_type: row.documentType,
    document_number: row.documentNumber ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    address: row.address ?? null,
    birth_date: row.birthDate ?? null,
    sex: row.sex ?? null,
    allergies: row.allergies ?? null,
    chronic_diseases: row.chronicDiseases ?? null,
    observations: row.observations ?? null,
    is_frequent: row.isFrequent,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    deleted_at: row.deletedAt ?? null,
  };
}

function dateValue(value?: string | null): Date | null {
  return value ? new Date(value) : null;
}

export const ClientRepository: IClientRepository = {
  async findAll(params) {
    const conditions = [isNull(client.deletedAt)];
    if (params?.storeId) conditions.push(eq(client.storeId, params.storeId));
    if (params?.is_frequent !== undefined) conditions.push(eq(client.isFrequent, params.is_frequent));
    if (params?.search) {
      conditions.push(
        or(
          ilike(client.fullName, `%${params.search}%`),
          ilike(client.documentNumber, `%${params.search}%`),
          ilike(client.phone, `%${params.search}%`),
          ilike(client.email, `%${params.search}%`),
        )!,
      );
    }

    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;

    const [rows, totalRows] = await Promise.all([
      db
        .select()
        .from(client)
        .where(and(...conditions))
        .orderBy(asc(client.fullName))
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ total: count() })
        .from(client)
        .where(and(...conditions)),
    ]);

    return {
      clients: rows.map(mapRowToEntity),
      total: totalRows[0]?.total ?? 0,
      page,
      limit,
    };
  },

  async findById(id: string, storeId?: string): Promise<IClientEntity | null> {
    const conditions = [eq(client.id, id), isNull(client.deletedAt)];
    if (storeId) conditions.push(eq(client.storeId, storeId));

    const [result] = await db
      .select()
      .from(client)
      .where(and(...conditions))
      .limit(1);

    if (!result) return null;

    return mapRowToEntity(result);
  },

  async create(data: CreateClientData, storeId: string): Promise<IClientEntity> {
    const [result] = await db
      .insert(client)
      .values({
        id: randomUUID(),
        fullName: data.full_name,
        documentType: data.document_type ?? "cedula",
        documentNumber: data.document_number ?? null,
        phone: data.phone ?? null,
        email: data.email || null,
        address: data.address ?? null,
        birthDate: dateValue(data.birth_date),
        sex: data.sex ?? null,
        allergies: data.allergies ?? null,
        chronicDiseases: data.chronic_diseases ?? null,
        observations: data.observations ?? null,
        isFrequent: data.is_frequent ?? false,
        storeId,
      })
      .returning();

    return mapRowToEntity(result);
  },

  async update(id: string, data: UpdateClientData, storeId: string): Promise<IClientEntity> {
    const conditions = [eq(client.id, id), eq(client.storeId, storeId), isNull(client.deletedAt)];

    const [result] = await db
      .update(client)
      .set({
        ...(data.full_name !== undefined && { fullName: data.full_name }),
        ...(data.document_type !== undefined && { documentType: data.document_type }),
        ...(data.document_number !== undefined && { documentNumber: data.document_number }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.birth_date !== undefined && { birthDate: dateValue(data.birth_date) }),
        ...(data.sex !== undefined && { sex: data.sex }),
        ...(data.allergies !== undefined && { allergies: data.allergies }),
        ...(data.chronic_diseases !== undefined && { chronicDiseases: data.chronic_diseases }),
        ...(data.observations !== undefined && { observations: data.observations }),
        ...(data.is_frequent !== undefined && { isFrequent: data.is_frequent }),
      })
      .where(and(...conditions))
      .returning();

    if (!result) throw new NotFoundError("Client not found");

    return mapRowToEntity(result);
  },

  async softDelete(id: string, storeId: string): Promise<void> {
    await db
      .update(client)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(client.id, id),
          eq(client.storeId, storeId),
          isNull(client.deletedAt),
        ),
      );
  },

  async findSalesByClient(id: string, storeId: string) {
    const rows = await db
      .select({
        id: sale.id,
        total: sale.total,
        created_at: sale.createdAt,
        payment_method: sale.paymentMethod,
      })
      .from(sale)
      .where(
        and(
          eq(sale.clientId, id),
          eq(sale.storeId, storeId),
          eq(sale.status, "completada"),
        ),
      )
      .orderBy(desc(sale.createdAt));

    return rows.map((row) => ({
      id: row.id,
      total: Number(row.total),
      created_at: row.created_at.toISOString(),
      payment_method: row.payment_method,
    }));
  },

  async findPrescriptionsByClient(id: string, storeId: string) {
    const rows = await db
      .select({
        id: prescription.id,
        number: prescription.number,
        status: prescription.status,
      })
      .from(prescription)
      .where(
        and(
          eq(prescription.clientId, id),
          eq(prescription.storeId, storeId),
          isNull(prescription.deletedAt),
        ),
      )
      .orderBy(desc(prescription.createdAt));

    return rows.map((row) => ({
      id: row.id,
      number: row.number,
      status: row.status,
    }));
  },

  async findFrequentProductsByClient(id: string, storeId: string) {
    const sales = await db
      .select({ id: sale.id })
      .from(sale)
      .where(
        and(
          eq(sale.clientId, id),
          eq(sale.storeId, storeId),
          eq(sale.status, "completada"),
        ),
      );

    if (sales.length === 0) return [];

    const totalQuantity = sql<number>`SUM(${saleItem.quantity})::int`;

    const rows = await db
      .select({
        medicine_id: saleItem.medicineId,
        medicine_name: saleItem.medicineName,
        quantity: totalQuantity,
      })
      .from(saleItem)
      .where(inArray(saleItem.saleId, sales.map((row) => row.id)))
      .groupBy(saleItem.medicineId, saleItem.medicineName)
      .orderBy(desc(totalQuantity))
      .limit(5);

    return rows.map((row) => ({
      medicine_id: row.medicine_id,
      medicine_name: row.medicine_name,
      quantity: row.quantity,
    }));
  },
};

```



> **clients.dto.ts**  
> Ruta: `backend-fastify/src/modules/clients/presentation/clients.dto.ts`  
>
```typescript
import { z } from "zod"

export const CreateClientDtoSchema = z.object({
  full_name: z.string().trim().min(1),
  document_type: z.enum(["cedula", "ruc", "pasaporte", "otro"]).optional(),
  document_number: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().trim().optional(),
  birth_date: z.string().datetime().optional().or(z.string().date().optional()),
  sex: z.string().trim().optional(),
  allergies: z.string().trim().optional(),
  chronic_diseases: z.string().trim().optional(),
  observations: z.string().trim().optional(),
  is_frequent: z.boolean().optional(),
})

export const UpdateClientDtoSchema = CreateClientDtoSchema.partial()

export const ClientQuerySchema = z.object({
  search: z.string().optional(),
  is_frequent: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export type CreateClientDto = z.infer<typeof CreateClientDtoSchema>
export type UpdateClientDto = z.infer<typeof UpdateClientDtoSchema>
export type ClientQueryDto = z.infer<typeof ClientQuerySchema>

```



> **clients.controller.ts**  
> Ruta: `backend-fastify/src/modules/clients/presentation/clients.controller.ts`  
>
```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { createClientService } from "../application/clients.service"
import { ClientRepository } from "../infrastructure/clients.drizzle.repository"
import { ClientQuerySchema, CreateClientDtoSchema, UpdateClientDtoSchema } from "./clients.dto"

const service = createClientService(ClientRepository)

export const clientsController = {
  list: async (request: FastifyRequest, reply: FastifyReply) =>
    reply.send(await service.list({ ...ClientQuerySchema.parse(request.query), storeId: request.storeId })),

  getById: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    return reply.send(await service.getById(id, request.storeId!))
  },

  getHistory: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    return reply.send(await service.getHistory(id, request.storeId!))
  },

  create: async (request: FastifyRequest, reply: FastifyReply) =>
    reply.status(201).send(await service.create(CreateClientDtoSchema.parse(request.body), request.storeId!)),

  update: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    return reply.send(await service.update(id, UpdateClientDtoSchema.parse(request.body), request.storeId!))
  },

  delete: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    await service.delete(id, request.storeId!)
    return reply.send({ message: "Client deleted successfully" })
  },
}

```



> **clients.routes.ts**  
> Ruta: `backend-fastify/src/modules/clients/presentation/clients.routes.ts`  
>
```typescript
import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { clientsController } from "./clients.controller"
import { authGuard, storeGuard } from "@/modules/auth/application/common/auth.guard"

export const clientsRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  const preHandler = [authGuard, storeGuard]

  fastify.get(
    "/",
    { preHandler },
    clientsController.list
  )

  fastify.get(
    "/:id/history",
    { preHandler },
    clientsController.getHistory
  )

  fastify.get(
    "/:id",
    { preHandler },
    clientsController.getById
  )

  fastify.post(
    "/",
    { preHandler },
    clientsController.create
  )

  fastify.put(
    "/:id",
    { preHandler },
    clientsController.update
  )

  fastify.delete(
    "/:id",
    { preHandler },
    clientsController.delete
  )
}

```


### 17.3 Detalles clave

- **Documento único por tienda**: `documentType` (cedula/ruc/pasaporte/otro) + `documentNumber`; el schema lleva `uq_client_store_document`.
- **Historial de cliente**: `GET /api/v1/clients/:id/history` devuelve todas las ventas del cliente con sus items (fecha, total, items con producto/cantidad/precio) — ver [Módulo sales](#21-módulo-sales).
- **Campos de salud**: `alergies` (texto libre), `sex`, usados en la dispensación y la impresión de recetas/tickets.

## 18. Módulo purchases

**Propósito:** compras/recepción de stock a proveedores. Crear una compra con sus items (producto, lote, vencimiento, cantidad, costo unitario), agregar/quitar items, confirmar o anular la compra, y listar el historial. Al confirmar, **descuenta el movimiento de inventario y actualiza stock** de manera transaccional.

### 18.1 Archivos del módulo

| Archivo | Rol |
|---|---|
| `domain/purchases.types.ts` | Tipos: `PurchaseStatus`, `PurchaseDTO`, `CreatePurchaseInput`, `PurchaseItemInput` |
| `domain/purchases.entities.ts` | Entidades `PurchaseEntity`, `PurchaseItemEntity` |
| `domain/purchases.interface.ts` | Contrato `IPurchaseRepository` |
| `application/purchases.service.ts` | Reglas: validar items vacíos, confirmar → movimiento de inventario, anular |
| `application/common/purchases.mappers.ts` | Entidad → DTO |
| `infrastructure/purchases.drizzle.repository.ts` | Repo Drizzle (transacciones de confirmación) |
| `presentation/purchases.*` | DTO, controller, routes |

### 18.2 Código completo


> **purchases.types.ts**  
> Ruta: `backend-fastify/src/modules/purchases/domain/purchases.types.ts`  
>
```typescript
export type PurchaseStatus = "borrador" | "pendiente" | "aprobada" | "recibida" | "anulada"

export interface IPurchaseItemResponse {
  id: string
  medicine_id: string
  medicine_name: string
  quantity: number
  unit_cost: number
  line_total: number
  received: number
}

export interface IPurchaseResponse {
  id: string
  number: string
  status: PurchaseStatus
  supplier_id?: string | null
  supplier_name?: string | null
  expected_date?: string | null
  notes?: string | null
  total: number
  approved_by?: string | null
  approved_at?: string | null
  received_by?: string | null
  received_at?: string | null
  user_id: string
  user_name?: string | null
  created_at: string
  updated_at: string
  items: IPurchaseItemResponse[]
}

export interface IPurchaseListResponse {
  data: IPurchaseResponse[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export interface IReceiveBatch {
  batch_number: string
  medicine_id: string
  manufacture_date?: string
  expiry_date: string
  quantity: number
  unit_cost?: number
}

```



> **purchases.entities.ts**  
> Ruta: `backend-fastify/src/modules/purchases/domain/purchases.entities.ts`  
>
```typescript
export interface IPurchaseItemEntity {
  id: string
  medicine_id: string
  medicine_name: string
  quantity: number
  unit_cost: number
  line_total: number
  received: number
}

export interface IPurchaseEntity {
  id: string
  number: string
  status: string
  supplier_id?: string | null
  supplier_name?: string | null
  expected_date?: Date | null
  notes?: string | null
  total: number
  approved_by?: string | null
  approved_at?: Date | null
  received_by?: string | null
  received_at?: Date | null
  user_id: string
  user_name?: string | null
  created_at: Date
  updated_at: Date
  items: IPurchaseItemEntity[]
}

export interface CreatePurchaseItemData {
  medicine_id: string
  quantity: number
  unit_cost: number
}

export interface CreatePurchaseData {
  supplier_id?: string
  expected_date?: string
  notes?: string
  items: CreatePurchaseItemData[]
}

export interface UpdatePurchaseData {
  supplier_id?: string
  expected_date?: string
  notes?: string
  items?: CreatePurchaseItemData[]
}

export interface IReceiveBatchData {
  batch_number: string
  medicine_id: string
  manufacture_date?: string
  expiry_date: string
  quantity: number
  unit_cost?: number
}

```



> **purchases.interface.ts**  
> Ruta: `backend-fastify/src/modules/purchases/domain/purchases.interface.ts`  
>
```typescript
import type {
  CreatePurchaseData,
  IPurchaseEntity,
  IReceiveBatchData,
  UpdatePurchaseData,
} from "./purchases.entities"

export interface IPurchaseRepository {
  findAll(params?: {
    search?: string
    status?: string
    supplier_id?: string
    page?: number
    limit?: number
    storeId?: string
  }): Promise<{ purchases: IPurchaseEntity[]; total: number; page: number; limit: number }>
  findById(id: string, storeId?: string): Promise<IPurchaseEntity | null>
  create(data: CreatePurchaseData, storeId: string, userId: string, medicineNames: Map<string, string>): Promise<IPurchaseEntity>
  update(id: string, data: UpdatePurchaseData, storeId: string, medicineNames?: Map<string, string>): Promise<IPurchaseEntity>
  approve(id: string, storeId: string, userId: string): Promise<IPurchaseEntity>
  receive(id: string, storeId: string, userId: string, batches: IReceiveBatchData[]): Promise<IPurchaseEntity>
  cancel(id: string, storeId: string): Promise<void>
}

```



> **purchases.service.ts**  
> Ruta: `backend-fastify/src/modules/purchases/application/purchases.service.ts`  
>
```typescript
import { BadRequestError, NotFoundError } from "@/core/errors/AppError"
import { SupplierRepository } from "@/modules/suppliers/infrastructure/suppliers.drizzle.repository"
import { IPurchaseRepository } from "../domain/purchases.interface"
import { CreatePurchaseData, IReceiveBatchData, UpdatePurchaseData } from "../domain/purchases.entities"
import { IPurchaseListResponse, IPurchaseResponse } from "../domain/purchases.types"
import { mapPurchase, RECEIVE_ERROR_MESSAGES, resolveMedicineNames } from "./common/purchases.mappers"

export const createPurchaseService = (repository: IPurchaseRepository) => ({
  list: async (params?: Parameters<IPurchaseRepository["findAll"]>[0]): Promise<IPurchaseListResponse> => {
    const result = await repository.findAll(params)
    return {
      data: result.purchases.map(mapPurchase),
      meta: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.max(1, Math.ceil(result.total / result.limit)) },
    }
  },

  getById: async (id: string, storeId: string): Promise<IPurchaseResponse> => {
    const purchase = await repository.findById(id, storeId)
    if (!purchase) throw new NotFoundError("Purchase not found")
    return mapPurchase(purchase)
  },

  create: async (data: CreatePurchaseData, storeId: string, userId: string): Promise<IPurchaseResponse> => {
    if (data.supplier_id) {
      const supplier = await SupplierRepository.findById(data.supplier_id, storeId)
      if (!supplier) throw new NotFoundError("Supplier not found")
    }
    const medicineNames = await resolveMedicineNames(data.items.map((i) => i.medicine_id), storeId)
    const purchase = await repository.create(data, storeId, userId, medicineNames)
    return mapPurchase(purchase)
  },

  update: async (id: string, data: UpdatePurchaseData, storeId: string): Promise<IPurchaseResponse> => {
    const existing = await repository.findById(id, storeId)
    if (!existing) throw new NotFoundError("Purchase not found")
    if (!["borrador", "pendiente"].includes(existing.status)) throw new BadRequestError("Only draft or pending purchases can be edited")

    if (data.supplier_id) {
      const supplier = await SupplierRepository.findById(data.supplier_id, storeId)
      if (!supplier) throw new NotFoundError("Supplier not found")
    }

    let medicineNames: Map<string, string> | undefined
    if (data.items?.length) {
      medicineNames = await resolveMedicineNames(data.items.map((i) => i.medicine_id), storeId)
    }

    const purchase = await repository.update(id, data, storeId, medicineNames)
    return mapPurchase(purchase)
  },

  approve: async (id: string, storeId: string, userId: string): Promise<IPurchaseResponse> => {
    const purchase = await repository.approve(id, storeId, userId)
    return mapPurchase(purchase)
  },

  receive: async (id: string, storeId: string, userId: string, batches: IReceiveBatchData[]): Promise<IPurchaseResponse> => {
    try {
      const purchase = await repository.receive(id, storeId, userId, batches)
      return mapPurchase(purchase)
    } catch (error) {
      const message = error instanceof Error ? RECEIVE_ERROR_MESSAGES[error.message] : undefined
      if (!message) throw error
      if (message === "Purchase not found") throw new NotFoundError(message)
      throw new BadRequestError(message)
    }
  },

  cancel: async (id: string, storeId: string): Promise<void> => {
    const existing = await repository.findById(id, storeId)
    if (!existing) throw new NotFoundError("Purchase not found")
    if (existing.status === "recibida") throw new BadRequestError("Received purchases cannot be cancelled")
    if (existing.status === "anulada") throw new BadRequestError("Purchase is already cancelled")
    await repository.cancel(id, storeId)
  },
})

```



> **purchases.mappers.ts**  
> Ruta: `backend-fastify/src/modules/purchases/application/common/purchases.mappers.ts`  
>
```typescript
import { BadRequestError } from "@/core/errors/AppError"
import { MedicineRepository } from "@/modules/medicines/infrastructure/medicines.drizzle.repository"
import { IPurchaseEntity } from "../../domain/purchases.entities"
import { IPurchaseResponse } from "../../domain/purchases.types"

export function iso(value?: Date | string | null): string | null {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : value
}

export function mapItem(item: IPurchaseEntity["items"][number]) {
  return {
    id: item.id,
    medicine_id: item.medicine_id,
    medicine_name: item.medicine_name,
    quantity: item.quantity,
    unit_cost: item.unit_cost,
    line_total: item.line_total,
    received: item.received,
  }
}

export function mapPurchase(purchase: IPurchaseEntity): IPurchaseResponse {
  return {
    id: purchase.id,
    number: purchase.number,
    status: purchase.status as IPurchaseResponse["status"],
    supplier_id: purchase.supplier_id ?? null,
    supplier_name: purchase.supplier_name ?? null,
    expected_date: iso(purchase.expected_date),
    notes: purchase.notes ?? null,
    total: purchase.total,
    approved_by: purchase.approved_by ?? null,
    approved_at: iso(purchase.approved_at),
    received_by: purchase.received_by ?? null,
    received_at: iso(purchase.received_at),
    user_id: purchase.user_id,
    user_name: purchase.user_name ?? null,
    created_at: purchase.created_at.toISOString(),
    updated_at: purchase.updated_at.toISOString(),
    items: purchase.items.map(mapItem),
  }
}

export async function resolveMedicineNames(medicineIds: string[], storeId: string): Promise<Map<string, string>> {
  const names = new Map<string, string>()
  for (const medicineId of new Set(medicineIds)) {
    const medicine = await MedicineRepository.findById(medicineId, storeId)
    if (!medicine) throw new BadRequestError("One or more medicines were not found")
    names.set(medicineId, medicine.commercial_name)
  }
  return names
}

export const RECEIVE_ERROR_MESSAGES: Record<string, string> = {
  PURCHASE_NOT_FOUND: "Purchase not found",
  PURCHASE_NOT_APPROVED: "Only approved purchases can be received",
  MEDICINE_NOT_IN_PURCHASE: "Received medicine is not part of the purchase",
  RECEIVED_EXCEEDS_ORDERED: "Received quantity exceeds the ordered quantity",
  INVALID_EXPIRY_DATE: "Expiry date must be a valid future date",
}

```



> **purchases.drizzle.repository.ts**  
> Ruta: `backend-fastify/src/modules/purchases/infrastructure/purchases.drizzle.repository.ts`  
>
```typescript
import { randomUUID } from "node:crypto";
import { and, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { batch as batchTable, inventoryMovement, medicine, purchase, purchaseItem, supplier, users } from "@/db/schema";
import { db } from "@/index";
import { BadRequestError, NotFoundError } from "@/core/errors/AppError";
import { IPurchaseRepository } from "../domain/purchases.interface";
import { CreatePurchaseData, IPurchaseEntity, IPurchaseItemEntity, IReceiveBatchData, UpdatePurchaseData } from "../domain/purchases.entities";

type PurchaseRow = typeof purchase.$inferSelect;
type PurchaseItemRow = typeof purchaseItem.$inferSelect;
type SupplierRow = typeof supplier.$inferSelect;
type UserRow = typeof users.$inferSelect;

interface RichPurchaseRow extends PurchaseRow {
  supplier?: SupplierRow | null
  user?: UserRow | null
  items?: PurchaseItemRow[]
}

function mapItem(row: PurchaseItemRow): IPurchaseItemEntity {
  return {
    id: row.id,
    medicine_id: row.medicineId,
    medicine_name: row.medicineName,
    quantity: row.quantity,
    unit_cost: Number(row.unitCost),
    line_total: Number(row.lineTotal),
    received: row.received,
  };
}

function mapRowToEntity(row: RichPurchaseRow): IPurchaseEntity {
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    supplier_id: row.supplierId ?? null,
    supplier_name: row.supplier?.name ?? null,
    expected_date: row.expectedDate ?? null,
    notes: row.notes ?? null,
    total: Number(row.total),
    approved_by: row.approvedBy ?? null,
    approved_at: row.approvedAt ?? null,
    received_by: row.receivedBy ?? null,
    received_at: row.receivedAt ?? null,
    user_id: row.userId,
    user_name: row.user?.name ?? null,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    items: (row.items ?? []).map(mapItem),
  };
}

const baseSelect = {
  purchase: purchase,
  supplier: supplier,
  user: users,
};

async function findRichById(id: string, storeId?: string): Promise<RichPurchaseRow | null> {
  const conditions = [eq(purchase.id, id)];
  if (storeId) conditions.push(eq(purchase.storeId, storeId));

  const [row] = await db
    .select(baseSelect)
    .from(purchase)
    .leftJoin(supplier, eq(purchase.supplierId, supplier.id))
    .leftJoin(users, eq(purchase.userId, users.id))
    .where(and(...conditions))
    .limit(1);

  if (!row) return null;

  const items = await db
    .select()
    .from(purchaseItem)
    .where(eq(purchaseItem.purchaseId, id));

  return { ...row.purchase, supplier: row.supplier, user: row.user, items };
}

export const PurchaseRepository: IPurchaseRepository = {
  async findAll(params) {
    const conditions = [];
    if (params?.storeId) conditions.push(eq(purchase.storeId, params.storeId));
    if (params?.status) conditions.push(eq(purchase.status, params.status));
    if (params?.supplier_id) conditions.push(eq(purchase.supplierId, params.supplier_id));
    if (params?.search) {
      conditions.push(
        or(
          ilike(purchase.number, `%${params.search}%`),
          ilike(supplier.name, `%${params.search}%`),
        )!,
      );
    }

    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;

    const rows = await db
      .select(baseSelect)
      .from(purchase)
      .leftJoin(supplier, eq(purchase.supplierId, supplier.id))
      .leftJoin(users, eq(purchase.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(purchase.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const [totalRows] = await db
      .select({ total: count() })
      .from(purchase)
      .leftJoin(supplier, eq(purchase.supplierId, supplier.id))
      .where(and(...conditions));

    const purchases: IPurchaseEntity[] = [];
    for (const row of rows) {
      const items = await db
        .select()
        .from(purchaseItem)
        .where(eq(purchaseItem.purchaseId, row.purchase.id));
      purchases.push(mapRowToEntity({ ...row.purchase, supplier: row.supplier, user: row.user, items }));
    }

    return {
      purchases,
      total: totalRows?.total ?? 0,
      page,
      limit,
    };
  },

  async findById(id: string, storeId?: string): Promise<IPurchaseEntity | null> {
    const row = await findRichById(id, storeId);
    if (!row) return null;
    return mapRowToEntity(row);
  },

  async create(data, storeId, userId, medicineNames): Promise<IPurchaseEntity> {
    const total = data.items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);

    const [row] = await db
      .insert(purchase)
      .values({
        id: randomUUID(),
        number: `OC-${Date.now()}`,
        status: "borrador",
        supplierId: data.supplier_id ?? null,
        expectedDate: data.expected_date ? new Date(data.expected_date) : null,
        notes: data.notes ?? null,
        total: total.toString(),
        userId,
        storeId,
      })
      .returning();

    await db.insert(purchaseItem).values(
      data.items.map((item) => ({
        id: randomUUID(),
        purchaseId: row.id,
        medicineId: item.medicine_id,
        medicineName: medicineNames.get(item.medicine_id)!,
        quantity: item.quantity,
        unitCost: item.unit_cost.toString(),
        lineTotal: (item.quantity * item.unit_cost).toString(),
        received: 0,
      })),
    );

    const rich = await findRichById(row.id);
    return mapRowToEntity(rich!);
  },

  async update(id, data, storeId, medicineNames): Promise<IPurchaseEntity> {
    await db
      .update(purchase)
      .set({
        ...(data.supplier_id !== undefined && { supplierId: data.supplier_id }),
        ...(data.expected_date !== undefined && { expectedDate: data.expected_date ? new Date(data.expected_date) : null }),
        ...(data.notes !== undefined && { notes: data.notes }),
      })
      .where(and(eq(purchase.id, id), eq(purchase.storeId, storeId)));

    if (data.items?.length && medicineNames) {
      const total = data.items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);
      await db.delete(purchaseItem).where(eq(purchaseItem.purchaseId, id));
      await db.insert(purchaseItem).values(
        data.items.map((item) => ({
          id: randomUUID(),
          purchaseId: id,
          medicineId: item.medicine_id,
          medicineName: medicineNames.get(item.medicine_id)!,
          quantity: item.quantity,
          unitCost: item.unit_cost.toString(),
          lineTotal: (item.quantity * item.unit_cost).toString(),
          received: 0,
        })),
      );
      await db
        .update(purchase)
        .set({ total: total.toString() })
        .where(eq(purchase.id, id));
    }

    const rich = await findRichById(id, storeId);
    return mapRowToEntity(rich!);
  },

  async approve(id, storeId, userId): Promise<IPurchaseEntity> {
    const [row] = await db
      .update(purchase)
      .set({ status: "aprobada", approvedBy: userId, approvedAt: new Date() })
      .where(and(eq(purchase.id, id), eq(purchase.storeId, storeId), inArray(purchase.status, ["borrador", "pendiente"])))
      .returning();

    if (!row) {
      const exists = await findRichById(id, storeId);
      if (!exists) throw new NotFoundError("Purchase not found");
      throw new BadRequestError("Purchase cannot be approved in its current state");
    }

    const rich = await findRichById(id, storeId);
    return mapRowToEntity(rich!);
  },

  async receive(id, storeId, userId, batches): Promise<IPurchaseEntity> {
    return db.transaction(async (tx) => {
      const current = await tx
        .select()
        .from(purchase)
        .leftJoin(supplier, eq(purchase.supplierId, supplier.id))
        .leftJoin(users, eq(purchase.userId, users.id))
        .where(and(eq(purchase.id, id), eq(purchase.storeId, storeId)))
        .limit(1);

      const purchaseRow = current[0]?.purchase;
      if (!purchaseRow) throw new Error("PURCHASE_NOT_FOUND");
      if (purchaseRow.status !== "aprobada") throw new Error("PURCHASE_NOT_APPROVED");

      const items = await tx
        .select()
        .from(purchaseItem)
        .where(eq(purchaseItem.purchaseId, id));

      const requested = new Map<string, number>();
      for (const b of batches) {
        requested.set(b.medicine_id, (requested.get(b.medicine_id) ?? 0) + b.quantity);
      }

      for (const [medicineId, quantity] of requested) {
        const item = items.find((i) => i.medicineId === medicineId);
        if (!item) throw new Error("MEDICINE_NOT_IN_PURCHASE");
        if (item.received + quantity > item.quantity) throw new Error("RECEIVED_EXCEEDS_ORDERED");
      }

      for (const b of batches) {
        const expiry = new Date(b.expiry_date);
        if (Number.isNaN(expiry.getTime()) || expiry <= new Date()) throw new Error("INVALID_EXPIRY_DATE");
      }

      for (const b of batches) {
        const purchaseItemRow = items.find((i) => i.medicineId === b.medicine_id)!;

        const [createdBatch] = await tx
          .insert(batchTable)
          .values({
            id: randomUUID(),
            batchNumber: b.batch_number,
            medicineId: b.medicine_id,
            purchaseId: id,
            supplierId: purchaseRow.supplierId,
            manufactureDate: b.manufacture_date ? new Date(b.manufacture_date) : null,
            expiryDate: new Date(b.expiry_date),
            initialQuantity: b.quantity,
            quantity: b.quantity,
            unitCost: (b.unit_cost ?? Number(purchaseItemRow.unitCost)).toString(),
            userId,
            storeId,
          })
          .returning();

        await tx
          .update(medicine)
          .set({ stock: sql`${medicine.stock} + ${b.quantity}` })
          .where(eq(medicine.id, b.medicine_id));

        await tx.insert(inventoryMovement).values({
          id: randomUUID(),
          medicineId: b.medicine_id,
          movementType: "entrada",
          quantity: b.quantity,
          note: `Recepción ${purchaseRow.number}`,
          batchId: createdBatch!.id,
          userId,
          storeId,
        });

        await tx
          .update(purchaseItem)
          .set({ received: sql`${purchaseItem.received} + ${b.quantity}` })
          .where(eq(purchaseItem.id, purchaseItemRow.id));
      }

      const fullyReceived = items.every((item) => item.received + (requested.get(item.medicineId) ?? 0) >= item.quantity);

      const [updated] = await tx
        .update(purchase)
        .set({
          status: fullyReceived ? "recibida" : "aprobada",
          ...(fullyReceived ? { receivedBy: userId, receivedAt: new Date() } : {}),
        })
        .where(eq(purchase.id, id))
        .returning();

      const rich: RichPurchaseRow = {
        ...updated,
        supplier: current[0]?.supplier ?? null,
        user: current[0]?.users ?? null,
        items: items.map((i) => ({ ...i, received: i.received + (requested.get(i.medicineId) ?? 0) })),
      };
      return mapRowToEntity(rich);
    });
  },

  async cancel(id, storeId): Promise<void> {
    await db
      .update(purchase)
      .set({ status: "anulada" })
      .where(and(eq(purchase.id, id), eq(purchase.storeId, storeId), inArray(purchase.status, ["borrador", "pendiente", "aprobada"])));
  },
};

```



> **purchases.dto.ts**  
> Ruta: `backend-fastify/src/modules/purchases/presentation/purchases.dto.ts`  
>
```typescript
import { z } from "zod"

const item = z.object({
  medicine_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  unit_cost: z.number().min(0),
})

export const CreatePurchaseDtoSchema = z.object({
  supplier_id: z.string().uuid().optional(),
  expected_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(item).min(1),
})

export const UpdatePurchaseDtoSchema = CreatePurchaseDtoSchema.partial()

export const ReceiveBatchDtoSchema = z.object({
  batch_number: z.string().trim().min(1),
  medicine_id: z.string().uuid(),
  manufacture_date: z.string().optional(),
  expiry_date: z.string(),
  quantity: z.number().int().positive(),
  unit_cost: z.number().min(0).optional(),
})

export const ReceivePurchaseDtoSchema = z.object({
  batches: z.array(ReceiveBatchDtoSchema).min(1),
})

export const PurchaseQuerySchema = z.object({
  search: z.string().optional(),
  status: z
    .union([z.enum(["borrador", "pendiente", "aprobada", "recibida", "anulada"]), z.literal("")])
    .optional(),
  supplier_id: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

```



> **purchases.controller.ts**  
> Ruta: `backend-fastify/src/modules/purchases/presentation/purchases.controller.ts`  
>
```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { createPurchaseService } from "../application/purchases.service"
import { PurchaseRepository } from "../infrastructure/purchases.drizzle.repository"
import { CreatePurchaseDtoSchema, PurchaseQuerySchema, ReceivePurchaseDtoSchema, UpdatePurchaseDtoSchema } from "./purchases.dto"

const service = createPurchaseService(PurchaseRepository)

export const purchasesController = {
  list: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = PurchaseQuerySchema.parse(request.query)
    const result = await service.list({ ...query, storeId: request.storeId! })
    return reply.send(result)
  },

  getById: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const result = await service.getById(id, request.storeId!)
    return reply.send(result)
  },

  create: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = CreatePurchaseDtoSchema.parse(request.body)
    const result = await service.create(data, request.storeId!, request.userId!)
    return reply.status(201).send(result)
  },

  update: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const data = UpdatePurchaseDtoSchema.parse(request.body)
    const result = await service.update(id, data, request.storeId!)
    return reply.send(result)
  },

  approve: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const result = await service.approve(id, request.storeId!, request.userId!)
    return reply.send(result)
  },

  receive: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const data = ReceivePurchaseDtoSchema.parse(request.body)
    const result = await service.receive(id, request.storeId!, request.userId!, data.batches)
    return reply.send(result)
  },

  cancel: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    await service.cancel(id, request.storeId!)
    return reply.send({ message: "Purchase cancelled successfully" })
  },
}

```



> **purchases.routes.ts**  
> Ruta: `backend-fastify/src/modules/purchases/presentation/purchases.routes.ts`  
>
```typescript
import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { purchasesController } from "./purchases.controller"
import { authGuard, storeGuard } from "@/modules/auth/application/common/auth.guard"

export const purchasesRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  const preHandler = [authGuard, storeGuard]

  fastify.get(
    "/",
    { preHandler },
    purchasesController.list
  )

  fastify.get(
    "/:id",
    { preHandler },
    purchasesController.getById
  )

  fastify.post(
    "/",
    { preHandler },
    purchasesController.create
  )

  fastify.put(
    "/:id",
    { preHandler },
    purchasesController.update
  )

  fastify.post(
    "/:id/approve",
    { preHandler },
    purchasesController.approve
  )

  fastify.post(
    "/:id/receive",
    { preHandler },
    purchasesController.receive
  )

  fastify.post(
    "/:id/cancel",
    { preHandler },
    purchasesController.cancel
  )
}

```


### 18.3 Detalles clave

- **Item con lote y vencimiento**: cada item de compra trae `batchNumber`, `expiryDate`, `quantity` y `unitCost` — de aquí nacen los lotes que luego maneja batch-inventory.
- **Ciclo de vida**: la compra se crea en estado inicial, luego pasa por `approve` (aprobación) → `receive` (recepción: crea `inventory_movement` y actualiza stock/batches en la misma transacción) → y opcionalmente `cancel` (anulación administrativa; el stock no retrocede).
- **Anular compra**: cambia estado a anulado; los lotes ya recibidos no se revierten (política del negocio — la anulación es administrativa).
- **`purchase_status`** text con validación Zod (por ejemplo `"pendiente" | "aprobada" | "recibida" | "anulada"` según `purchases.types.ts`).

## 19. Módulo batch-inventory

**Propósito:** gestión de **lotes** de inventario (batch): alta por compra o manual, ajuste de cantidad (sumar/restar), vencimiento, y consultas de lotes (por medicamento, próximos a vencer, vencidos, todos). Es la capa fina sobre la tabla `batch` que alimenta las alertas de vencimiento y la dispensación FEFO de ventas.

### 19.1 Archivos del módulo

| Archivo | Rol |
|---|---|
| `domain/batch-inventory.types.ts` | Tipos: `BatchDTO`, `CreateBatchInput`, `UpdateBatchInput`, `BatchListParams`, `BatchAdjustmentInput` |
| `domain/batch-inventory.entities.ts` | Entidad `BatchEntity` |
| `domain/batch-inventory.interface.ts` | Contrato `IBatchRepository` |
| `application/batch-inventory.service.ts` | CRUD + ajustes (sumar/restar) con validaciones de cantidad |
| `application/common/batch-inventory.mappers.ts` | Entidad → DTO |
| `infrastructure/batch-inventory.drizzle.repository.ts` | Repo Drizzle (filtros por fecha de vencimiento) |
| `presentation/batch-inventory.*` | DTO, controller, routes |

### 19.2 Código completo


> **batch-inventory.types.ts**  
> Ruta: `backend-fastify/src/modules/batch-inventory/domain/batch-inventory.types.ts`  
>
```typescript
export interface IBatchResponse {
  id: string
  batch_number: string
  medicine_id: string
  medicine_name?: string | null
  purchase_id?: string | null
  supplier_id?: string | null
  supplier_name?: string | null
  manufacture_date?: string | null
  expiry_date: string
  quantity: number
  unit_cost?: number | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface IBatchListResponse {
  data: IBatchResponse[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

```



> **batch-inventory.entities.ts**  
> Ruta: `backend-fastify/src/modules/batch-inventory/domain/batch-inventory.entities.ts`  
>
```typescript
export interface IBatchEntity {
  id: string
  batch_number: string
  medicine_id: string
  medicine_name?: string | null
  purchase_id?: string | null
  supplier_id?: string | null
  supplier_name?: string | null
  manufacture_date?: Date | null
  expiry_date: Date
  quantity: number
  unit_cost?: number | null
  notes?: string | null
  user_id: string
  store_id: string
  created_at: Date
  updated_at: Date
}

export interface CreateBatchData {
  batch_number: string
  medicine_id: string
  purchase_id?: string
  supplier_id?: string
  manufacture_date?: string
  expiry_date: string
  quantity: number
  unit_cost?: number
  notes?: string
}

export interface UpdateBatchData {
  batch_number?: string
  expiry_date?: string
  quantity?: number
  notes?: string
}

```



> **batch-inventory.interface.ts**  
> Ruta: `backend-fastify/src/modules/batch-inventory/domain/batch-inventory.interface.ts`  
>
```typescript
import type { CreateBatchData, IBatchEntity, UpdateBatchData } from "./batch-inventory.entities"

export interface IBatchInventoryRepository {
  create(data: CreateBatchData, userId: string, storeId: string): Promise<IBatchEntity>
  findById(id: string, storeId: string): Promise<IBatchEntity | null>
  findAll(params?: {
    search?: string
    medicine_id?: string
    supplier_id?: string
    expiring_soon?: boolean
    expired?: boolean
    expiration_alert_days?: number
    page?: number
    limit?: number
    storeId?: string
  }): Promise<{ batches: IBatchEntity[]; total: number; page: number; limit: number }>
  update(id: string, data: UpdateBatchData, userId: string, storeId: string): Promise<IBatchEntity>
}

```



> **batch-inventory.service.ts**  
> Ruta: `backend-fastify/src/modules/batch-inventory/application/batch-inventory.service.ts`  
>
```typescript
import { BadRequestError, NotFoundError } from "@/core/errors/AppError"
import type { IBatchInventoryRepository } from "../domain/batch-inventory.interface"
import type { CreateBatchData, UpdateBatchData } from "../domain/batch-inventory.entities"
import type { IBatchListResponse, IBatchResponse } from "../domain/batch-inventory.types"
import { assertFutureDate, assertValidDate, mapBatchToResponse } from "./common/batch-inventory.mappers"

export const createBatchInventoryService = (repository: IBatchInventoryRepository) => ({
  create: async (data: CreateBatchData, userId: string, storeId: string): Promise<IBatchResponse> => {
    assertFutureDate(data.expiry_date)
    assertValidDate(data.manufacture_date, "Manufacture date")
    if (data.manufacture_date && new Date(data.manufacture_date) > new Date(data.expiry_date)) {
      throw new BadRequestError("Manufacture date cannot be after expiry date")
    }
    return mapBatchToResponse(await repository.create(data, userId, storeId))
  },

  getById: async (id: string, storeId: string): Promise<IBatchResponse> => {
    const batch = await repository.findById(id, storeId)
    if (!batch) throw new NotFoundError("Batch not found")
    return mapBatchToResponse(batch)
  },

  list: async (params?: Parameters<IBatchInventoryRepository["findAll"]>[0]): Promise<IBatchListResponse> => {
    const result = await repository.findAll(params)
    return {
      data: result.batches.map(mapBatchToResponse),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
      },
    }
  },

  update: async (id: string, data: UpdateBatchData, userId: string, storeId: string): Promise<IBatchResponse> => {
    if (data.expiry_date) {
      assertFutureDate(data.expiry_date)
      assertValidDate(data.expiry_date, "Expiry date")
    }
    return mapBatchToResponse(await repository.update(id, data, userId, storeId))
  },
})

```



> **batch-inventory.mappers.ts**  
> Ruta: `backend-fastify/src/modules/batch-inventory/application/common/batch-inventory.mappers.ts`  
>
```typescript
import { BadRequestError } from "@/core/errors/AppError"
import type { IBatchEntity } from "../../domain/batch-inventory.entities"
import type { IBatchResponse } from "../../domain/batch-inventory.types"

export function mapBatchToResponse(batch: IBatchEntity): IBatchResponse {
  return {
    id: batch.id,
    batch_number: batch.batch_number,
    medicine_id: batch.medicine_id,
    medicine_name: batch.medicine_name ?? null,
    purchase_id: batch.purchase_id ?? null,
    supplier_id: batch.supplier_id ?? null,
    supplier_name: batch.supplier_name ?? null,
    manufacture_date: batch.manufacture_date?.toISOString() ?? null,
    expiry_date: batch.expiry_date.toISOString(),
    quantity: batch.quantity,
    unit_cost: batch.unit_cost ?? null,
    notes: batch.notes ?? null,
    created_at: batch.created_at.toISOString(),
    updated_at: batch.updated_at.toISOString(),
  }
}

export function assertFutureDate(value: string): void {
  const date = new Date(value)
  if (Number.isNaN(date.getTime()) || date <= new Date()) {
    throw new BadRequestError("Expiry date must be a valid future date")
  }
}

export function assertValidDate(value: string | undefined, field: string): void {
  if (!value) return
  if (Number.isNaN(new Date(value).getTime())) {
    throw new BadRequestError(`${field} must be a valid date`)
  }
}

```



> **batch-inventory.drizzle.repository.ts**  
> Ruta: `backend-fastify/src/modules/batch-inventory/infrastructure/batch-inventory.drizzle.repository.ts`  
>
```typescript
import { randomUUID } from "node:crypto";
import { and, asc, count, eq, gt, gte, ilike, lte, or, sql } from "drizzle-orm";
import { batch, inventoryMovement, medicine, purchase, supplier } from "@/db/schema";
import { db } from "@/index";
import { BadRequestError, NotFoundError } from "@/core/errors/AppError";
import type { IBatchInventoryRepository } from "../domain/batch-inventory.interface";
import type { CreateBatchData, IBatchEntity, UpdateBatchData } from "../domain/batch-inventory.entities";

type BatchRow = typeof batch.$inferSelect;
type MedicineRow = typeof medicine.$inferSelect;
type SupplierRow = typeof supplier.$inferSelect;

interface RichBatchRow extends BatchRow {
  medicine?: MedicineRow | null
  supplier?: SupplierRow | null
}

function mapRowToEntity(row: RichBatchRow): IBatchEntity {
  return {
    id: row.id,
    batch_number: row.batchNumber,
    medicine_id: row.medicineId,
    medicine_name: row.medicine?.commercialName ?? null,
    purchase_id: row.purchaseId ?? null,
    supplier_id: row.supplierId ?? null,
    supplier_name: row.supplier?.name ?? null,
    manufacture_date: row.manufactureDate ?? null,
    expiry_date: row.expiryDate,
    quantity: row.quantity,
    unit_cost: row.unitCost === null ? null : Number(row.unitCost),
    notes: row.notes ?? null,
    user_id: row.userId,
    store_id: row.storeId,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

const richSelect = {
  batch,
  medicine,
  supplier,
};

async function findRichById(id: string, storeId: string): Promise<RichBatchRow | null> {
  const [row] = await db
    .select(richSelect)
    .from(batch)
    .leftJoin(medicine, eq(batch.medicineId, medicine.id))
    .leftJoin(supplier, eq(batch.supplierId, supplier.id))
    .where(and(eq(batch.id, id), eq(batch.storeId, storeId)))
    .limit(1);

  if (!row) return null;
  return { ...row.batch, medicine: row.medicine, supplier: row.supplier };
}

export const BatchInventoryRepository: IBatchInventoryRepository = {
  async findAll(params) {
    const conditions = [];
    if (params?.storeId) conditions.push(eq(batch.storeId, params.storeId));
    if (params?.medicine_id) conditions.push(eq(batch.medicineId, params.medicine_id));
    if (params?.supplier_id) conditions.push(eq(batch.supplierId, params.supplier_id));

    if (params?.search) {
      conditions.push(
        or(
          ilike(batch.batchNumber, `%${params.search}%`),
          ilike(medicine.commercialName, `%${params.search}%`),
          ilike(supplier.name, `%${params.search}%`),
        )!,
      );
    }

    const now = new Date();
    if (params?.expired) conditions.push(lte(batch.expiryDate, now));
    if (params?.expiring_soon) {
      const alertDays = params.expiration_alert_days ?? 60;
      const alertLimit = new Date(now.getTime() + alertDays * 24 * 60 * 60 * 1000);
      conditions.push(gt(batch.expiryDate, now), lte(batch.expiryDate, alertLimit));
    }

    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;

    const rows = await db
      .select(richSelect)
      .from(batch)
      .leftJoin(medicine, eq(batch.medicineId, medicine.id))
      .leftJoin(supplier, eq(batch.supplierId, supplier.id))
      .where(and(...conditions))
      .orderBy(asc(batch.expiryDate))
      .limit(limit)
      .offset((page - 1) * limit);

    const [totalRows] = await db
      .select({ total: count() })
      .from(batch)
      .leftJoin(medicine, eq(batch.medicineId, medicine.id))
      .leftJoin(supplier, eq(batch.supplierId, supplier.id))
      .where(and(...conditions));

    return {
      batches: rows.map((row) => mapRowToEntity({ ...row.batch, medicine: row.medicine, supplier: row.supplier })),
      total: totalRows?.total ?? 0,
      page,
      limit,
    };
  },

  async findById(id, storeId) {
    const row = await findRichById(id, storeId);
    return row ? mapRowToEntity(row) : null;
  },

  async create(data: CreateBatchData, userId: string, storeId: string) {
    const batchId = await db.transaction(async (tx) => {
      const [medicineRow] = await tx
        .select({ id: medicine.id })
        .from(medicine)
        .where(and(eq(medicine.id, data.medicine_id), eq(medicine.storeId, storeId)))
        .limit(1);
      if (!medicineRow) throw new NotFoundError("Medicine not found");

      if (data.supplier_id) {
        const [supplierRow] = await tx
          .select({ id: supplier.id })
          .from(supplier)
          .where(and(eq(supplier.id, data.supplier_id), eq(supplier.storeId, storeId)))
          .limit(1);
        if (!supplierRow) throw new NotFoundError("Supplier not found");
      }

      if (data.purchase_id) {
        const [purchaseRow] = await tx
          .select({ id: purchase.id })
          .from(purchase)
          .where(and(eq(purchase.id, data.purchase_id), eq(purchase.storeId, storeId)))
          .limit(1);
        if (!purchaseRow) throw new NotFoundError("Purchase not found");
      }

      const [created] = await tx
        .insert(batch)
        .values({
          id: randomUUID(),
          batchNumber: data.batch_number,
          medicineId: data.medicine_id,
          purchaseId: data.purchase_id ?? null,
          supplierId: data.supplier_id ?? null,
          manufactureDate: data.manufacture_date ? new Date(data.manufacture_date) : null,
          expiryDate: new Date(data.expiry_date),
          initialQuantity: data.quantity,
          quantity: data.quantity,
          unitCost: data.unit_cost?.toString() ?? null,
          notes: data.notes ?? null,
          userId,
          storeId,
        })
        .returning({ id: batch.id });

      await tx
        .update(medicine)
        .set({ stock: sql`${medicine.stock} + ${data.quantity}` })
        .where(and(eq(medicine.id, data.medicine_id), eq(medicine.storeId, storeId)));

      await tx.insert(inventoryMovement).values({
        id: randomUUID(),
        medicineId: data.medicine_id,
        movementType: "entrada",
        quantity: data.quantity,
        note: data.notes ?? "Entrada manual de inventario",
        batchId: created.id,
        userId,
        storeId,
      });

      return created.id;
    });

    const result = await findRichById(batchId, storeId);
    if (!result) throw new NotFoundError("Batch not found");
    return mapRowToEntity(result);
  },

  async update(id: string, data: UpdateBatchData, userId: string, storeId: string) {
    const batchId = await db.transaction(async (tx) => {
      const [current] = await tx
        .select({ batch, medicine })
        .from(batch)
        .innerJoin(medicine, eq(batch.medicineId, medicine.id))
        .where(and(eq(batch.id, id), eq(batch.storeId, storeId)))
        .limit(1);
      if (!current) throw new NotFoundError("Batch not found");

      const delta = data.quantity === undefined ? 0 : data.quantity - current.batch.quantity;
      if (delta < 0 && current.medicine.stock + delta < 0) {
        throw new BadRequestError("Batch adjustment would make stock negative");
      }

      const updatedBatch = await tx
        .update(batch)
        .set({
          ...(data.batch_number !== undefined && { batchNumber: data.batch_number }),
          ...(data.expiry_date !== undefined && { expiryDate: new Date(data.expiry_date) }),
          ...(data.quantity !== undefined && { quantity: data.quantity }),
          ...(data.notes !== undefined && { notes: data.notes }),
        })
        .where(and(eq(batch.id, id), eq(batch.storeId, storeId), eq(batch.quantity, current.batch.quantity)))
        .returning({ id: batch.id });
      if (!updatedBatch.length) throw new BadRequestError("Batch changed concurrently; try again");

      if (delta !== 0) {
        const updatedMedicine = await tx
          .update(medicine)
          .set({ stock: sql`${medicine.stock} + ${delta}` })
          .where(and(
            eq(medicine.id, current.batch.medicineId),
            eq(medicine.storeId, storeId),
            ...(delta < 0 ? [gte(medicine.stock, -delta)] : []),
          ))
          .returning({ id: medicine.id });
        if (!updatedMedicine.length) throw new BadRequestError("Insufficient stock or concurrent stock change");

        await tx.insert(inventoryMovement).values({
          id: randomUUID(),
          medicineId: current.batch.medicineId,
          movementType: "ajuste",
          quantity: delta,
          note: data.notes ?? `Ajuste del lote ${current.batch.batchNumber}`,
          batchId: id,
          userId,
          storeId,
        });
      }

      return id;
    });

    const result = await findRichById(batchId, storeId);
    if (!result) throw new NotFoundError("Batch not found");
    return mapRowToEntity(result);
  },
};

```



> **batch-inventory.dto.ts**  
> Ruta: `backend-fastify/src/modules/batch-inventory/presentation/batch-inventory.dto.ts`  
>
```typescript
import { z } from "zod"

const booleanQuery = z.preprocess(
  (value) => value === "true" ? true : value === "false" ? false : value,
  z.boolean().optional(),
)

export const CreateBatchDtoSchema = z.object({
  batch_number: z.string().trim().min(1),
  medicine_id: z.string().uuid(),
  purchase_id: z.string().uuid().optional(),
  supplier_id: z.string().uuid().optional(),
  manufacture_date: z.string().optional(),
  expiry_date: z.string().min(1),
  quantity: z.number().int().positive(),
  unit_cost: z.number().min(0).optional(),
  notes: z.string().optional(),
})

export const UpdateBatchDtoSchema = z.object({
  batch_number: z.string().trim().min(1).optional(),
  expiry_date: z.string().min(1).optional(),
  quantity: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
})

export const BatchQuerySchema = z.object({
  search: z.string().optional(),
  medicine_id: z.string().uuid().optional(),
  supplier_id: z.string().uuid().optional(),
  expiring_soon: booleanQuery,
  expired: booleanQuery,
  expiration_alert_days: z.coerce.number().int().nonnegative().max(3650).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

```



> **batch-inventory.controller.ts**  
> Ruta: `backend-fastify/src/modules/batch-inventory/presentation/batch-inventory.controller.ts`  
>
```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { createBatchInventoryService } from "../application/batch-inventory.service"
import { BatchInventoryRepository } from "../infrastructure/batch-inventory.drizzle.repository"
import { CreateBatchDtoSchema, BatchQuerySchema, UpdateBatchDtoSchema } from "./batch-inventory.dto"

const service = createBatchInventoryService(BatchInventoryRepository)

export const batchInventoryController = {
  create: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = CreateBatchDtoSchema.parse(request.body)
    return reply.status(201).send(await service.create(data, request.userId!, request.storeId!))
  },

  getById: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    return reply.send(await service.getById(id, request.storeId!))
  },

  list: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = BatchQuerySchema.parse(request.query)
    return reply.send(await service.list({ ...query, storeId: request.storeId! }))
  },

  expiring: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = BatchQuerySchema.parse(request.query)
    return reply.send(await service.list({ ...query, expiring_soon: true, expired: undefined, storeId: request.storeId! }))
  },

  expired: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = BatchQuerySchema.parse(request.query)
    return reply.send(await service.list({ ...query, expired: true, expiring_soon: undefined, storeId: request.storeId! }))
  },

  update: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const data = UpdateBatchDtoSchema.parse(request.body)
    return reply.send(await service.update(id, data, request.userId!, request.storeId!))
  },
}

```



> **batch-inventory.routes.ts**  
> Ruta: `backend-fastify/src/modules/batch-inventory/presentation/batch-inventory.routes.ts`  
>
```typescript
import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { batchInventoryController } from "./batch-inventory.controller"
import { BatchQuerySchema, CreateBatchDtoSchema, UpdateBatchDtoSchema } from "./batch-inventory.dto"
import { authGuard, storeGuard } from "@/modules/auth/application/common/auth.guard"

export const batchInventoryRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  const preHandler = [authGuard, storeGuard]

  fastify.get("/", { preHandler }, batchInventoryController.list)
  fastify.get("/expiring", { preHandler }, batchInventoryController.expiring)
  fastify.get("/expired", { preHandler }, batchInventoryController.expired)
  fastify.get("/:id", { preHandler }, batchInventoryController.getById)
  fastify.post("/", { preHandler }, batchInventoryController.create)
  fastify.put("/:id", { preHandler }, batchInventoryController.update)
}

```


### 19.3 Detalles clave

- **Vencimiento**: el campo `expiryDate` alimenta endpoints tipo "próximos a vencer" (ventana configurable) y "vencidos".
- **Ajustes**: `adjust(batchId, delta)` con validación de que el resultado no sea negativo; registra el movimiento de inventario asociado (tipo ajuste) manteniendo trazabilidad.
- **El batch referencia `medicineId` y `supplierId`** — de ahí salen las alertas de stock y los reportes por laboratorio.

## 20. Módulo inventory

**Propósito:** consultas y movimientos de inventario a nivel de **producto/medicamento** (stock actual, bajo stock, stock por medicamento) y **registro de movimientos** (entrada, salida, ajuste, merma, devolución, venta) con su historial. Es la vista consolidada que usa el dashboard.

### 20.1 Archivos del módulo

| Archivo | Rol |
|---|---|
| `domain/inventory.types.ts` | Tipos: `InventoryMovementType`, `InventoryMovementDTO`, `StockDTO`, `LowStockAlert` |
| `domain/inventory.entities.ts` | Entidad `InventoryMovementEntity` |
| `domain/inventory.interface.ts` | Contrato `IInventoryRepository` |
| `application/inventory.service.ts` | Casos de uso: stock por producto, bajo stock, registrar movimiento |
| `application/common/inventory.mappers.ts` | Entidad → DTO |
| `infrastructure/inventory.drizzle.repository.ts` | Repo Drizzle |
| `presentation/inventory.*` | DTO, controller, routes |

### 20.2 Código completo


> **inventory.types.ts**  
> Ruta: `backend-fastify/src/modules/inventory/domain/inventory.types.ts`  
>
```typescript
export type InventoryMovementType = "entrada" | "salida" | "ajuste" | "venta" | "merma" | "devolucion"

export interface IInventoryMovementResponse {
  id: string
  medicine_id: string
  medicine_name?: string | null
  movement_type: InventoryMovementType
  quantity: number
  note?: string | null
  user_id: string
  user_name?: string | null
  batch_id?: string | null
  created_at: string
}

export interface IInventoryMovementListResponse {
  data: IInventoryMovementResponse[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export interface IProductStockResponse {
  medicine_id: string
  medicine_name: string
  stock: number
  low_stock_threshold: number
  is_low_stock: boolean
}

```



> **inventory.entities.ts**  
> Ruta: `backend-fastify/src/modules/inventory/domain/inventory.entities.ts`  
>
```typescript
import type { InventoryMovementType } from "./inventory.types"

export interface IInventoryMovementEntity {
  id: string
  medicine_id: string
  medicine_name?: string | null
  movement_type: InventoryMovementType
  quantity: number
  note?: string | null
  user_id: string
  user_name?: string | null
  batch_id?: string | null
  store_id: string
  created_at: Date
}

export interface CreateMovementData {
  medicine_id: string
  movement_type: InventoryMovementType
  quantity: number
  note?: string
  batch_id?: string
}

```



> **inventory.interface.ts**  
> Ruta: `backend-fastify/src/modules/inventory/domain/inventory.interface.ts`  
>
```typescript
import type { CreateMovementData, IInventoryMovementEntity } from "./inventory.entities"
import type { IProductStockResponse } from "./inventory.types"

export interface IInventoryRepository {
  create(data: CreateMovementData, userId: string, storeId: string): Promise<IInventoryMovementEntity>
  findByProductId(medicineId: string, params?: { limit?: number; storeId?: string }): Promise<IInventoryMovementEntity[]>
  findAll(params?: {
    search?: string
    medicine_id?: string
    movement_type?: string
    from?: string
    to?: string
    page?: number
    limit?: number
    storeId?: string
  }): Promise<{ movements: IInventoryMovementEntity[]; total: number; page: number; limit: number }>
  findLowStock(storeId: string): Promise<IProductStockResponse[]>
}

```



> **inventory.service.ts**  
> Ruta: `backend-fastify/src/modules/inventory/application/inventory.service.ts`  
>
```typescript
import { BadRequestError, NotFoundError } from "@/core/errors/AppError"
import type { IMedicineRepository } from "@/modules/medicines/domain/medicines.interface"
import type { CreateMovementData } from "../domain/inventory.entities"
import type { IInventoryRepository } from "../domain/inventory.interface"
import type { IInventoryMovementListResponse, IInventoryMovementResponse, IProductStockResponse } from "../domain/inventory.types"
import { assertValidFilterDate, mapMovementToResponse } from "./common/inventory.mappers"

export const createInventoryService = (
  movementRepository: IInventoryRepository,
  medicineRepository: IMedicineRepository,
) => ({
  create: async (data: CreateMovementData, userId: string, storeId: string): Promise<IInventoryMovementResponse> => {
    const medicine = await medicineRepository.findById(data.medicine_id, storeId)
    if (!medicine || medicine.deleted_at) throw new NotFoundError("Medicine not found")

    if (data.movement_type !== "ajuste" && data.quantity <= 0) {
      throw new BadRequestError("Quantity must be positive")
    }

    if (data.movement_type === "ajuste" && data.quantity === 0) {
      throw new BadRequestError("Adjustment quantity cannot be zero")
    }

    const movement = await movementRepository.create(data, userId, storeId)
    return mapMovementToResponse({ ...movement, medicine_name: medicine.commercial_name })
  },

  getByProduct: async (medicineId: string, storeId: string): Promise<IInventoryMovementListResponse> => {
    const medicine = await medicineRepository.findById(medicineId, storeId)
    if (!medicine) throw new NotFoundError("Medicine not found")
    const movements = await movementRepository.findByProductId(medicineId, { storeId })
    return {
      data: movements.map(mapMovementToResponse),
      meta: { page: 1, limit: movements.length || 1, total: movements.length, totalPages: 1 },
    }
  },

  list: async (params?: Parameters<IInventoryRepository["findAll"]>[0]): Promise<IInventoryMovementListResponse> => {
    assertValidFilterDate(params?.from, "From date")
    assertValidFilterDate(params?.to, "To date")
    const result = await movementRepository.findAll(params)
    return {
      data: result.movements.map(mapMovementToResponse),
      meta: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.max(1, Math.ceil(result.total / result.limit)) },
    }
  },

  getLowStockProducts: async (storeId: string): Promise<IProductStockResponse[]> => {
    return movementRepository.findLowStock(storeId)
  },
})

```



> **inventory.mappers.ts**  
> Ruta: `backend-fastify/src/modules/inventory/application/common/inventory.mappers.ts`  
>
```typescript
import { BadRequestError } from "@/core/errors/AppError"
import type { IInventoryMovementEntity } from "../../domain/inventory.entities"
import type { IInventoryMovementResponse } from "../../domain/inventory.types"

export function assertValidFilterDate(value: string | undefined, field: string): void {
  if (value && Number.isNaN(new Date(value).getTime())) {
    throw new BadRequestError(`${field} must be a valid date`)
  }
}

export function mapMovementToResponse(movement: IInventoryMovementEntity): IInventoryMovementResponse {
  return {
    id: movement.id,
    medicine_id: movement.medicine_id,
    medicine_name: movement.medicine_name ?? null,
    movement_type: movement.movement_type,
    quantity: movement.quantity,
    note: movement.note ?? null,
    user_id: movement.user_id,
    user_name: movement.user_name ?? null,
    batch_id: movement.batch_id ?? null,
    created_at: movement.created_at.toISOString(),
  }
}


```



> **inventory.drizzle.repository.ts**  
> Ruta: `backend-fastify/src/modules/inventory/infrastructure/inventory.drizzle.repository.ts`  
>
```typescript
import { randomUUID } from "node:crypto";
import { and, asc, count, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { batch, inventoryMovement, medicine, users } from "@/db/schema";
import { db } from "@/index";
import { BadRequestError, NotFoundError } from "@/core/errors/AppError";
import type { IInventoryRepository } from "../domain/inventory.interface";
import type { CreateMovementData, IInventoryMovementEntity } from "../domain/inventory.entities";
import type { InventoryMovementType, IProductStockResponse } from "../domain/inventory.types";

type MovementRow = typeof inventoryMovement.$inferSelect;
type MedicineRow = typeof medicine.$inferSelect;
type UserRow = typeof users.$inferSelect;

interface RichMovementRow extends MovementRow {
  medicine?: MedicineRow | null
  user?: UserRow | null
}

function mapRowToEntity(row: RichMovementRow): IInventoryMovementEntity {
  return {
    id: row.id,
    medicine_id: row.medicineId,
    medicine_name: row.medicine?.commercialName ?? null,
    movement_type: row.movementType as InventoryMovementType,
    quantity: row.quantity,
    note: row.note ?? null,
    user_id: row.userId,
    user_name: row.user?.name ?? null,
    batch_id: row.batchId ?? null,
    store_id: row.storeId,
    created_at: row.createdAt,
  };
}

const richSelect = {
  movement: inventoryMovement,
  medicine,
  user: users,
};

function movementDelta(data: CreateMovementData): number {
  if (data.movement_type === "ajuste") return data.quantity;
  if (["entrada", "devolucion"].includes(data.movement_type)) return data.quantity;
  return -data.quantity;
}

async function selectMovementRows(params: {
  medicine_id?: string
  movement_type?: string
  from?: string
  to?: string
  search?: string
  storeId?: string
  page?: number
  limit?: number
}) {
  const conditions = [];
  if (params.storeId) conditions.push(eq(inventoryMovement.storeId, params.storeId));
  if (params.medicine_id) conditions.push(eq(inventoryMovement.medicineId, params.medicine_id));
  if (params.movement_type) conditions.push(eq(inventoryMovement.movementType, params.movement_type));
  if (params.from) conditions.push(gte(inventoryMovement.createdAt, new Date(params.from)));
  if (params.to) conditions.push(lte(inventoryMovement.createdAt, new Date(params.to)));
  if (params.search) {
    conditions.push(
      or(
        ilike(medicine.commercialName, `%${params.search}%`),
        ilike(medicine.genericName, `%${params.search}%`),
        ilike(inventoryMovement.note, `%${params.search}%`),
      )!,
    );
  }

  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const rows = await db
    .select(richSelect)
    .from(inventoryMovement)
    .leftJoin(medicine, eq(inventoryMovement.medicineId, medicine.id))
    .leftJoin(users, eq(inventoryMovement.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(inventoryMovement.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  const [totalRows] = await db
    .select({ total: count() })
    .from(inventoryMovement)
    .leftJoin(medicine, eq(inventoryMovement.medicineId, medicine.id))
    .where(and(...conditions));

  return { rows, total: totalRows?.total ?? 0, page, limit };
}

export const InventoryRepository: IInventoryRepository = {
  async create(data, userId, storeId) {
    const movementId = await db.transaction(async (tx) => {
      const [medicineRow] = await tx
        .select()
        .from(medicine)
        .where(and(eq(medicine.id, data.medicine_id), eq(medicine.storeId, storeId)))
        .limit(1);
      if (!medicineRow) throw new NotFoundError("Medicine not found");

      let batchRow: typeof batch.$inferSelect | undefined;
      if (data.batch_id) {
        const [foundBatch] = await tx
          .select()
          .from(batch)
          .where(and(eq(batch.id, data.batch_id), eq(batch.storeId, storeId), eq(batch.medicineId, data.medicine_id)))
          .limit(1);
        if (!foundBatch) throw new NotFoundError("Batch not found");
        batchRow = foundBatch;
      }

      const delta = movementDelta(data);
      if (medicineRow.stock + delta < 0) throw new BadRequestError("Insufficient stock");
      if (batchRow && batchRow.quantity + delta < 0) throw new BadRequestError("Insufficient batch stock");

      const updatedMedicine = await tx
        .update(medicine)
        .set({ stock: sql`${medicine.stock} + ${delta}` })
        .where(and(
          eq(medicine.id, data.medicine_id),
          eq(medicine.storeId, storeId),
          ...(delta < 0 ? [gte(medicine.stock, -delta)] : []),
        ))
        .returning({ id: medicine.id });
      if (!updatedMedicine.length) throw new BadRequestError("Insufficient stock or concurrent stock change");

      if (batchRow) {
        const updatedBatch = await tx
          .update(batch)
          .set({ quantity: sql`${batch.quantity} + ${delta}` })
          .where(and(
            eq(batch.id, data.batch_id!),
            eq(batch.storeId, storeId),
            ...(delta < 0 ? [gte(batch.quantity, -delta)] : []),
          ))
          .returning({ id: batch.id });
        if (!updatedBatch.length) throw new BadRequestError("Insufficient batch stock or concurrent batch change");
      }

      const [created] = await tx
        .insert(inventoryMovement)
        .values({
          id: randomUUID(),
          medicineId: data.medicine_id,
          movementType: data.movement_type,
          quantity: data.quantity,
          note: data.note ?? null,
          batchId: data.batch_id ?? null,
          userId,
          storeId,
        })
        .returning({ id: inventoryMovement.id });

      return created.id;
    });

    const [row] = await db
      .select(richSelect)
      .from(inventoryMovement)
      .leftJoin(medicine, eq(inventoryMovement.medicineId, medicine.id))
      .leftJoin(users, eq(inventoryMovement.userId, users.id))
      .where(and(eq(inventoryMovement.id, movementId), eq(inventoryMovement.storeId, storeId)))
      .limit(1);
    if (!row) throw new NotFoundError("Inventory movement not found");
    return mapRowToEntity({ ...row.movement, medicine: row.medicine, user: row.user });
  },

  async findByProductId(medicineId, params) {
    const result = await selectMovementRows({ medicine_id: medicineId, storeId: params?.storeId, page: 1, limit: params?.limit ?? 100 });
    return result.rows.map((row) => mapRowToEntity({ ...row.movement, medicine: row.medicine, user: row.user }));
  },

  async findAll(params) {
    const result = await selectMovementRows(params ?? {});
    return {
      movements: result.rows.map((row) => mapRowToEntity({ ...row.movement, medicine: row.medicine, user: row.user })),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  },

  async findLowStock(storeId): Promise<IProductStockResponse[]> {
    const rows = await db
      .select({
        id: medicine.id,
        name: medicine.commercialName,
        stock: medicine.stock,
        threshold: medicine.lowStockThreshold,
      })
      .from(medicine)
      .where(and(eq(medicine.storeId, storeId), lte(medicine.stock, medicine.lowStockThreshold), sql`${medicine.deletedAt} is null`))
      .orderBy(asc(medicine.stock), asc(medicine.commercialName));

    return rows.map((row) => ({
      medicine_id: row.id,
      medicine_name: row.name,
      stock: row.stock,
      low_stock_threshold: row.threshold,
      is_low_stock: row.stock <= row.threshold,
    }));
  },
};

```



> **inventory.dto.ts**  
> Ruta: `backend-fastify/src/modules/inventory/presentation/inventory.dto.ts`  
>
```typescript
import { z } from "zod"

export const CreateMovementDtoSchema = z.object({
  medicine_id: z.string().uuid(),
  movement_type: z.enum(["entrada", "salida", "ajuste", "venta", "merma", "devolucion"]),
  quantity: z.number().int(),
  note: z.string().optional(),
  batch_id: z.string().uuid().optional(),
})

export const MovementQuerySchema = z.object({
  search: z.string().optional(),
  medicine_id: z.string().uuid().optional(),
  movement_type: z.enum(["entrada", "salida", "ajuste", "venta", "merma", "devolucion"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

```



> **inventory.controller.ts**  
> Ruta: `backend-fastify/src/modules/inventory/presentation/inventory.controller.ts`  
>
```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { createInventoryService } from "../application/inventory.service"
import { InventoryRepository } from "../infrastructure/inventory.drizzle.repository"
import { MedicineRepository } from "@/modules/medicines/infrastructure/medicines.drizzle.repository"
import { CreateMovementDtoSchema, MovementQuerySchema } from "./inventory.dto"

const service = createInventoryService(InventoryRepository, MedicineRepository)

export const inventoryController = {
  createMovement: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = CreateMovementDtoSchema.parse(request.body)
    return reply.status(201).send(await service.create(data, request.userId!, request.storeId!))
  },

  getByProduct: async (request: FastifyRequest, reply: FastifyReply) => {
    const { medicineId } = request.params as { medicineId: string }
    return reply.send(await service.getByProduct(medicineId, request.storeId!))
  },

  list: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = MovementQuerySchema.parse(request.query)
    return reply.send(await service.list({ ...query, storeId: request.storeId! }))
  },

  lowStock: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = await service.getLowStockProducts(request.storeId!)
    return reply.send({ data, count: data.length })
  },
}

```



> **inventory.routes.ts**  
> Ruta: `backend-fastify/src/modules/inventory/presentation/inventory.routes.ts`  
>
```typescript
import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { inventoryController } from "./inventory.controller"
import { authGuard, storeGuard } from "@/modules/auth/application/common/auth.guard"

export const inventoryRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  const preHandler = [authGuard, storeGuard]

  fastify.get("/low-stock", { preHandler }, inventoryController.lowStock)
  fastify.get("/product/:medicineId", { preHandler }, inventoryController.getByProduct)
  fastify.get("/", { preHandler }, inventoryController.list)
  fastify.post("/", { preHandler }, inventoryController.createMovement)
}

```


### 20.3 Detalles clave

- **`InventoryMovementType`**: `entrada | salida | ajuste | venta | merma | devolucion` (los nombres exactos en `inventory.types.ts`).
- **Stock negativo prohibido**: el registro de salidas/ventas valida stock disponible antes de insertar.
- **Bajo stock**: `GET /inventory/low-stock` consulta medicamentos cuyo stock es **menor o igual al umbral** `low_stock_threshold` (columna `lowStockThreshold` en medicine, default 5, por tienda y sin borrar).

## 21. Módulo sales

**Propósito:** el flujo de **venta** — transaccional, multi-caja, FEFO. Crear venta (con items por medicamento, opcionalmente ligada a receta o cliente), calcular totales, registrar movimiento de inventario (salida) descontando lotes *first-expired-first-out*, cancelar venta (devuelve stock si corresponde), y consultas agregadas (`/report`, `/revenue-trend`) para la caja y el dashboard.

### 21.1 Archivos del módulo

| Archivo | Rol |
|---|---|
| `domain/sales.types.ts` | Tipos: `SaleStatus`, `PaymentMethod`, `SaleDTO`, `CreateSaleInput`, `SaleItemInput` |
| `domain/sales.entities.ts` | Entidades `SaleEntity`, `SaleItemEntity` |
| `domain/sales.interface.ts` | Contrato `ISaleRepository` |
| `application/sales.service.ts` | Reglas: validar items, FEFO, stock, totales, cancelar |
| `application/common/sales.mappers.ts` | Entidad → DTO |
| `infrastructure/sales.drizzle.repository.ts` | Repo Drizzle **transaccional** (crear venta + descontar lotes + registrar movimiento + opcional factura) |
| `presentation/sales.*` | DTO, controller, routes |

### 21.2 Código completo


> **sales.types.ts**  
> Ruta: `backend-fastify/src/modules/sales/domain/sales.types.ts`  
>
```typescript
export type PaymentMethod = "efectivo" | "tarjeta_debito" | "tarjeta_credito" | "transferencia" | "pago_movil" | "mixto"
export type SaleStatus = "completada" | "anulada"
export type GroupBy = "day" | "week" | "month"

export interface ISaleItemResponse {
  id: string
  medicine_id: string
  medicine_name: string
  quantity: number
  unit_price: number
  line_total: number
  batch_id?: string | null
}

export interface ISaleResponse {
  id: string
  subtotal: number
  total: number
  payment_method: PaymentMethod
  amount_received?: number | null
  change_given?: number | null
  status: SaleStatus
  cancellation_reason?: string | null
  cancelled_at?: string | null
  cancelled_by?: string | null
  user_id: string
  user_name?: string | null
  client_id?: string | null
  client_name?: string | null
  prescription_id?: string | null
  created_at: string
  updated_at: string
  items: ISaleItemResponse[]
}

export interface ISaleListResponse {
  data: ISaleResponse[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export interface ISaleReport {
  total_sales: number
  total_revenue: number
  total_profit: number
  average_ticket: number
  by_payment_method: Record<string, number>
  top_products: { medicine_id: string; medicine_name: string; quantity: number; revenue: number }[]
}

export interface IRevenueTrendItem {
  period: string
  revenue: number
  count: number
}

```



> **sales.entities.ts**  
> Ruta: `backend-fastify/src/modules/sales/domain/sales.entities.ts`  
>
```typescript
import type { PaymentMethod, SaleStatus } from "./sales.types"

export interface ISaleItemEntity {
  id: string
  sale_id: string
  medicine_id: string
  medicine_name: string
  quantity: number
  unit_price: number
  line_total: number
  batch_id?: string | null
  created_at: Date
  updated_at: Date
}

export interface ISaleEntity {
  id: string
  subtotal: number
  total: number
  payment_method: PaymentMethod
  amount_received?: number | null
  change_given?: number | null
  status: SaleStatus
  cancellation_reason?: string | null
  cancelled_at?: Date | null
  cancelled_by?: string | null
  user_id: string
  user_name?: string | null
  client_id?: string | null
  client_name?: string | null
  prescription_id?: string | null
  created_at: Date
  updated_at: Date
  items: ISaleItemEntity[]
}

export interface CreateSaleItemData {
  medicine_id: string
  quantity: number
  unit_price?: number
  batch_id?: string
}

export interface CreateSaleData {
  items: CreateSaleItemData[]
  payment_method: PaymentMethod
  amount_received?: number
  client_id?: string
  prescription_id?: string
  user_id: string
  user_name?: string
}

```



> **sales.interface.ts**  
> Ruta: `backend-fastify/src/modules/sales/domain/sales.interface.ts`  
>
```typescript
import type { CreateSaleData, ISaleEntity } from "./sales.entities"
import type { GroupBy, ISaleReport, IRevenueTrendItem } from "./sales.types"

export interface ISaleRepository {
  create(data: CreateSaleData, storeId: string): Promise<ISaleEntity>
  findById(id: string, storeId: string): Promise<ISaleEntity | null>
  findAll(params?: {
    from?: Date
    to?: Date
    status?: string
    paymentMethod?: string
    search?: string
    userId?: string
    minAmount?: number
    minItems?: number
    page?: number
    limit?: number
    storeId?: string
  }): Promise<{ sales: ISaleEntity[]; total: number; page: number; limit: number }>
  cancel(id: string, reason: string, userId: string, storeId: string): Promise<ISaleEntity>
  getReport(params?: { from?: Date; to?: Date; storeId?: string }): Promise<ISaleReport>
  getRevenueTrend(params: { startDate: Date; endDate: Date; groupBy: GroupBy; storeId: string }): Promise<IRevenueTrendItem[]>
}

```



> **sales.service.ts**  
> Ruta: `backend-fastify/src/modules/sales/application/sales.service.ts`  
>
```typescript
import { NotFoundError } from "@/core/errors/AppError"
import { endOfDay } from "@/core/utils/date"
import type { ISaleRepository } from "../domain/sales.interface"
import type { CreateSaleData } from "../domain/sales.entities"
import type { GroupBy, ISaleListResponse, ISaleReport, ISaleResponse, IRevenueTrendItem } from "../domain/sales.types"
import { mapSaleToResponse } from "./common/sales.mappers"

export const createSaleService = (repository: ISaleRepository) => ({
  create: async (data: CreateSaleData, storeId: string): Promise<ISaleResponse> =>
    mapSaleToResponse(await repository.create(data, storeId)),

  getById: async (id: string, storeId: string): Promise<ISaleResponse> => {
    const sale = await repository.findById(id, storeId)
    if (!sale) throw new NotFoundError("Sale not found")
    return mapSaleToResponse(sale)
  },

  cancel: async (id: string, reason: string, userId: string, storeId: string): Promise<ISaleResponse> =>
    mapSaleToResponse(await repository.cancel(id, reason, userId, storeId)),

  list: async (params: {
    from?: string
    to?: string
    status?: string
    payment_method?: string
    user_id?: string
    search?: string
    min_amount?: number
    min_items?: number
    page?: number
    limit?: number
    storeId?: string
  }): Promise<ISaleListResponse> => {
    const result = await repository.findAll({
      from: params.from ? new Date(params.from) : undefined,
      to: params.to ? endOfDay(params.to) : undefined,
      status: params.status,
      paymentMethod: params.payment_method,
      userId: params.user_id,
      search: params.search,
      minAmount: params.min_amount,
      minItems: params.min_items,
      page: params.page,
      limit: params.limit,
      storeId: params.storeId,
    })
    return {
      data: result.sales.map(mapSaleToResponse),
      meta: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.max(1, Math.ceil(result.total / result.limit)) },
    }
  },

  getReport: async (params: { from?: string; to?: string; storeId?: string }): Promise<ISaleReport> =>
    repository.getReport({
      from: params.from ? new Date(params.from) : undefined,
      to: params.to ? endOfDay(params.to) : undefined,
      storeId: params.storeId,
    }),

  getRevenueTrend: async (params: { start_date: string; end_date: string; group_by: GroupBy; store_id: string }): Promise<IRevenueTrendItem[]> =>
    repository.getRevenueTrend({
      startDate: new Date(params.start_date),
      endDate: endOfDay(params.end_date),
      groupBy: params.group_by,
      storeId: params.store_id,
    }),
})

```



> **sales.mappers.ts**  
> Ruta: `backend-fastify/src/modules/sales/application/common/sales.mappers.ts`  
>
```typescript
import type { ISaleEntity } from "../../domain/sales.entities"
import type { ISaleItemResponse, ISaleResponse } from "../../domain/sales.types"

export function mapSaleItemToResponse(item: ISaleEntity["items"][number]): ISaleItemResponse {
  return {
    id: item.id,
    medicine_id: item.medicine_id,
    medicine_name: item.medicine_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    line_total: item.line_total,
    batch_id: item.batch_id ?? null,
  }
}

export function mapSaleToResponse(sale: ISaleEntity): ISaleResponse {
  return {
    id: sale.id,
    subtotal: sale.subtotal,
    total: sale.total,
    payment_method: sale.payment_method,
    amount_received: sale.amount_received ?? null,
    change_given: sale.change_given ?? null,
    status: sale.status,
    cancellation_reason: sale.cancellation_reason ?? null,
    cancelled_at: sale.cancelled_at?.toISOString() ?? null,
    cancelled_by: sale.cancelled_by ?? null,
    user_id: sale.user_id,
    user_name: sale.user_name ?? null,
    client_id: sale.client_id ?? null,
    client_name: sale.client_name ?? null,
    prescription_id: sale.prescription_id ?? null,
    created_at: sale.created_at.toISOString(),
    updated_at: sale.updated_at.toISOString(),
    items: sale.items.map(mapSaleItemToResponse),
  }
}


```



> **sales.drizzle.repository.ts — creación/cancelación transaccional**  
> Ruta: `backend-fastify/src/modules/sales/infrastructure/sales.drizzle.repository.ts`  
>
```typescript
import { randomUUID } from "node:crypto";
import { and, asc, count, desc, eq, gte, gt, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { batch, client, inventoryMovement, invoice, medicine, prescription, prescriptionItem, sale, saleItem, users } from "@/db/schema";
import { db } from "@/index";
import { BadRequestError, NotFoundError } from "@/core/errors/AppError";
import type { ISaleRepository } from "../domain/sales.interface";
import type { CreateSaleData, ISaleEntity, ISaleItemEntity } from "../domain/sales.entities";
import type { GroupBy, ISaleReport, IRevenueTrendItem } from "../domain/sales.types";

type SaleRow = typeof sale.$inferSelect;
type SaleItemRow = typeof saleItem.$inferSelect;
type UserRow = typeof users.$inferSelect;
type ClientRow = typeof client.$inferSelect;

interface RichSaleRow extends SaleRow {
  user?: UserRow | null
  client?: ClientRow | null
  items?: SaleItemRow[]
}

function mapItem(row: SaleItemRow): ISaleItemEntity {
  return {
    id: row.id,
    sale_id: row.saleId,
    medicine_id: row.medicineId,
    medicine_name: row.medicineName,
    quantity: row.quantity,
    unit_price: Number(row.unitPrice),
    line_total: Number(row.lineTotal),
    batch_id: row.batchId ?? null,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

function mapSale(row: RichSaleRow): ISaleEntity {
  return {
    id: row.id,
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    payment_method: row.paymentMethod as ISaleEntity["payment_method"],
    amount_received: row.amountReceived === null ? null : Number(row.amountReceived),
    change_given: row.changeGiven === null ? null : Number(row.changeGiven),
    status: row.status as ISaleEntity["status"],
    cancellation_reason: row.cancellationReason ?? null,
    cancelled_at: row.cancelledAt ?? null,
    cancelled_by: row.cancelledBy ?? null,
    user_id: row.userId,
    user_name: row.userName ?? row.user?.name ?? null,
    client_id: row.clientId ?? null,
    client_name: row.client?.fullName ?? null,
    prescription_id: row.prescriptionId ?? null,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    items: (row.items ?? []).map(mapItem),
  };
}

const richSelect = {
  sale,
  user: users,
  client,
};

async function findRichById(id: string, storeId: string): Promise<RichSaleRow | null> {
  const [row] = await db
    .select(richSelect)
    .from(sale)
    .leftJoin(users, eq(sale.userId, users.id))
    .leftJoin(client, eq(sale.clientId, client.id))
    .where(and(eq(sale.id, id), eq(sale.storeId, storeId)))
    .limit(1);
  if (!row) return null;

  const items = await db.select().from(saleItem).where(eq(saleItem.saleId, id));
  return { ...row.sale, user: row.user, client: row.client, items };
}

interface SaleLine {
  medicineId: string
  quantity: number
  batchId?: string
}

export const SaleRepository: ISaleRepository = {
  async create(data: CreateSaleData, storeId: string): Promise<ISaleEntity> {
    const saleId = await db.transaction(async (tx) => {
      const medicineIds = [...new Set(data.items.map((item) => item.medicine_id))];
      const medicineRows = await tx
        .select()
        .from(medicine)
        .where(and(inArray(medicine.id, medicineIds), eq(medicine.storeId, storeId), eq(medicine.active, true), sql`${medicine.deletedAt} is null`));
      const medicines = new Map(medicineRows.map((row) => [row.id, row]));

      for (const id of medicineIds) {
        if (!medicines.has(id)) throw new BadRequestError("Medicine not found in this store");
      }

      const quantities = new Map<string, number>();
      for (const item of data.items) {
        quantities.set(item.medicine_id, (quantities.get(item.medicine_id) ?? 0) + item.quantity);
      }
      for (const [medicineId, quantity] of quantities) {
        const row = medicines.get(medicineId)!;
        if (row.stock < quantity) throw new BadRequestError(`Insufficient stock for ${row.commercialName}`);
      }

      if (data.client_id) {
        const [clientRow] = await tx
          .select({ id: client.id })
          .from(client)
          .where(and(eq(client.id, data.client_id), eq(client.storeId, storeId), sql`${client.deletedAt} is null`))
          .limit(1);
        if (!clientRow) throw new BadRequestError("Client not found in this store");
      }

      let prescriptionRow: typeof prescription.$inferSelect | undefined;
      let prescriptionItems: typeof prescriptionItem.$inferSelect[] = [];
      if (data.prescription_id) {
        await tx.execute(sql`
          SELECT "id"
          FROM "prescription"
          WHERE "id" = ${data.prescription_id}
            AND "store_id" = ${storeId}
          FOR UPDATE
        `);
        const [foundPrescription] = await tx
          .select()
          .from(prescription)
          .where(and(eq(prescription.id, data.prescription_id), eq(prescription.storeId, storeId), sql`${prescription.deletedAt} is null`))
          .limit(1);
        if (!foundPrescription || foundPrescription.status !== "validada") {
          throw new BadRequestError("Prescription must be validated and belong to this store");
        }
        if (foundPrescription.expiryDate && foundPrescription.expiryDate <= new Date()) {
          throw new BadRequestError("Prescription has expired");
        }
        if (foundPrescription.clientId && foundPrescription.clientId !== data.client_id) {
          throw new BadRequestError("Prescription belongs to another client");
        }
        prescriptionRow = foundPrescription;
        prescriptionItems = await tx.select().from(prescriptionItem).where(eq(prescriptionItem.prescriptionId, foundPrescription.id));
      }

      for (const [medicineId] of quantities) {
        const row = medicines.get(medicineId)!;
        if ((row.requiresPrescription || row.isControlled) && !prescriptionRow) {
          throw new BadRequestError(`A validated prescription is required for ${row.commercialName}`);
        }
      }

      if (prescriptionRow) {
        const previousRows = await tx
          .select({ medicineId: saleItem.medicineId, quantity: saleItem.quantity })
          .from(saleItem)
          .innerJoin(sale, eq(saleItem.saleId, sale.id))
          .where(and(eq(sale.prescriptionId, prescriptionRow.id), eq(sale.storeId, storeId), eq(sale.status, "completada")));
        const consumed = new Map<string, number>();
        for (const row of previousRows) consumed.set(row.medicineId, (consumed.get(row.medicineId) ?? 0) + row.quantity);

        for (const [medicineId, quantity] of quantities) {
          const medicineRow = medicines.get(medicineId)!;
          if (!medicineRow.requiresPrescription && !medicineRow.isControlled) continue;
          const authorized = prescriptionItems.find((item) => item.medicineId === medicineId)?.authorizedQuantity ?? 0;
          if ((consumed.get(medicineId) ?? 0) + quantity > authorized) {
            throw new BadRequestError(`Authorized quantity exceeded for ${medicineRow.commercialName}`);
          }
        }
      }

      const now = new Date();
      const allocatedByBatch = new Map<string, number>();
      const batchMedicineIds = new Map<string, string>();

      for (const item of data.items.filter((candidate) => candidate.batch_id)) {
        const [batchRow] = await tx
          .select()
          .from(batch)
          .where(and(eq(batch.id, item.batch_id!), eq(batch.medicineId, item.medicine_id), eq(batch.storeId, storeId)))
          .limit(1);
        if (!batchRow) throw new BadRequestError("Batch does not belong to this store or medicine");
        if (batchRow.expiryDate <= now) throw new BadRequestError("Cannot sell an expired batch");
        const assigned = allocatedByBatch.get(batchRow.id) ?? 0;
        if (batchRow.quantity < assigned + item.quantity) throw new BadRequestError("Insufficient stock in selected batch");
        allocatedByBatch.set(batchRow.id, assigned + item.quantity);
        batchMedicineIds.set(batchRow.id, item.medicine_id);
      }

      const autoAllocatedByBatch = new Map<string, number>();
      for (const [medicineId, requiredQuantity] of quantities) {
        const explicitQuantity = data.items
          .filter((item) => item.medicine_id === medicineId && item.batch_id)
          .reduce((sum, item) => sum + item.quantity, 0);
        let remaining = requiredQuantity - explicitQuantity;
        if (remaining <= 0) continue;

        const batches = await tx
          .select()
          .from(batch)
          .where(and(eq(batch.medicineId, medicineId), eq(batch.storeId, storeId), gt(batch.quantity, 0), gt(batch.expiryDate, now)))
          .orderBy(asc(batch.expiryDate));
        for (const batchRow of batches) {
          const available = batchRow.quantity - (allocatedByBatch.get(batchRow.id) ?? 0);
          if (available <= 0) continue;
          const take = Math.min(available, remaining);
          allocatedByBatch.set(batchRow.id, (allocatedByBatch.get(batchRow.id) ?? 0) + take);
          autoAllocatedByBatch.set(batchRow.id, (autoAllocatedByBatch.get(batchRow.id) ?? 0) + take);
          batchMedicineIds.set(batchRow.id, medicineId);
          remaining -= take;
          if (remaining === 0) break;
        }
      }

      const saleLines: SaleLine[] = [];
      const remainingAuto = new Map(autoAllocatedByBatch);
      for (const item of data.items) {
        if (item.batch_id) {
          saleLines.push({ medicineId: item.medicine_id, quantity: item.quantity, batchId: item.batch_id });
          continue;
        }
        let remaining = item.quantity;
        for (const [batchId, available] of remainingAuto) {
          if (batchMedicineIds.get(batchId) !== item.medicine_id || available <= 0) continue;
          const take = Math.min(available, remaining);
          saleLines.push({ medicineId: item.medicine_id, quantity: take, batchId });
          remainingAuto.set(batchId, available - take);
          remaining -= take;
          if (remaining === 0) break;
        }
        if (remaining > 0) saleLines.push({ medicineId: item.medicine_id, quantity: remaining });
      }

      const subtotal = saleLines.reduce((sum, line) => {
        const medicineRow = medicines.get(line.medicineId)!;
        return sum + Number(medicineRow.salePrice) * line.quantity;
      }, 0);
      const total = subtotal;
      if (data.payment_method === "efectivo" && (data.amount_received === undefined || data.amount_received < total)) {
        throw new BadRequestError("Cash received is insufficient");
      }
      const change = data.amount_received === undefined ? null : data.amount_received - total;

      const [createdSale] = await tx
        .insert(sale)
        .values({
          id: randomUUID(),
          subtotal: subtotal.toString(),
          total: total.toString(),
          paymentMethod: data.payment_method,
          amountReceived: data.amount_received?.toString() ?? null,
          changeGiven: change?.toString() ?? null,
          status: "completada",
          userId: data.user_id,
          userName: data.user_name ?? null,
          clientId: data.client_id ?? null,
          prescriptionId: data.prescription_id ?? null,
          storeId,
        })
        .returning({ id: sale.id });

      await tx.insert(saleItem).values(
        saleLines.map((line) => {
          const medicineRow = medicines.get(line.medicineId)!;
          const unitPrice = Number(medicineRow.salePrice);
          return {
            id: randomUUID(),
            saleId: createdSale.id,
            medicineId: line.medicineId,
            medicineName: medicineRow.commercialName,
            quantity: line.quantity,
            unitPrice: unitPrice.toString(),
            lineTotal: (unitPrice * line.quantity).toString(),
            batchId: line.batchId ?? null,
          };
        }),
      );

      for (const [medicineId, quantity] of quantities) {
        const updated = await tx
          .update(medicine)
          .set({ stock: sql`${medicine.stock} - ${quantity}` })
          .where(and(eq(medicine.id, medicineId), eq(medicine.storeId, storeId), gte(medicine.stock, quantity)))
          .returning({ id: medicine.id });
        if (!updated.length) throw new BadRequestError("Stock changed while processing the sale; try again");
      }

      for (const [batchId, quantity] of allocatedByBatch) {
        const updated = await tx
          .update(batch)
          .set({ quantity: sql`${batch.quantity} - ${quantity}` })
          .where(and(eq(batch.id, batchId), eq(batch.storeId, storeId), gte(batch.quantity, quantity)))
          .returning({ id: batch.id });
        if (!updated.length) throw new BadRequestError("Batch stock changed while processing the sale; try again");

        await tx.insert(inventoryMovement).values({
          id: randomUUID(),
          medicineId: batchMedicineIds.get(batchId)!,
          movementType: "venta",
          quantity,
          note: `Venta #${createdSale.id.slice(0, 8)}`,
          batchId,
          userId: data.user_id,
          storeId,
        });
      }

      for (const line of saleLines.filter((line) => !line.batchId)) {
        await tx.insert(inventoryMovement).values({
          id: randomUUID(),
          medicineId: line.medicineId,
          movementType: "venta",
          quantity: line.quantity,
          note: `Venta #${createdSale.id.slice(0, 8)}`,
          batchId: null,
          userId: data.user_id,
          storeId,
        });
      }

      return createdSale.id;
    });

    const result = await findRichById(saleId, storeId);
    if (!result) throw new NotFoundError("Sale not found");
    return mapSale(result);
  },

  async findById(id, storeId) {
    const result = await findRichById(id, storeId);
    return result ? mapSale(result) : null;
  },

  async findAll(params) {
    const conditions = [];
    if (params?.storeId) conditions.push(eq(sale.storeId, params.storeId));
    if (params?.from) conditions.push(gte(sale.createdAt, params.from));
    if (params?.to) conditions.push(lte(sale.createdAt, params.to));
    if (params?.status) conditions.push(eq(sale.status, params.status));
    if (params?.paymentMethod) conditions.push(eq(sale.paymentMethod, params.paymentMethod));
    if (params?.userId) conditions.push(eq(sale.userId, params.userId));
    if (params?.minAmount !== undefined) conditions.push(gte(sale.total, params.minAmount.toString()));
    if (params?.minItems !== undefined) conditions.push(sql`(SELECT COUNT(*) FROM sale_item item_count WHERE item_count.sale_id = ${sale.id}) >= ${params.minItems}`);
    if (params?.search) {
      conditions.push(or(sql`${sale.id}::text ILIKE ${`%${params.search}%`}`, ilike(users.name, `%${params.search}%`), ilike(client.fullName, `%${params.search}%`))!);
    }

    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const rows = await db
      .select(richSelect)
      .from(sale)
      .leftJoin(users, eq(sale.userId, users.id))
      .leftJoin(client, eq(sale.clientId, client.id))
      .where(and(...conditions))
      .orderBy(desc(sale.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);
    const [totalRows] = await db
      .select({ total: count() })
      .from(sale)
      .leftJoin(users, eq(sale.userId, users.id))
      .leftJoin(client, eq(sale.clientId, client.id))
      .where(and(...conditions));

    const sales: ISaleEntity[] = [];
    for (const row of rows) {
      const items = await db.select().from(saleItem).where(eq(saleItem.saleId, row.sale.id));
      sales.push(mapSale({ ...row.sale, user: row.user, client: row.client, items }));
    }
    return { sales, total: totalRows?.total ?? 0, page, limit };
  },

  async cancel(id, reason, userId, storeId) {
    const saleId = await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(sale)
        .where(and(eq(sale.id, id), eq(sale.storeId, storeId)))
        .limit(1);
      if (!current) throw new NotFoundError("Sale not found");
      if (current.status === "anulada") throw new BadRequestError("Sale is already cancelled");

      // Lock the sale row to serialize with invoice emission
      await tx.execute(sql`
        SELECT "id"
        FROM "sale"
        WHERE "id" = ${id}
          AND "store_id" = ${storeId}
        FOR UPDATE
      `);

      const [emittedInvoice] = await tx
        .select({ id: invoice.id })
        .from(invoice)
        .where(and(eq(invoice.saleId, id), eq(invoice.storeId, storeId), eq(invoice.status, "emitida")))
        .limit(1);
      if (emittedInvoice) throw new BadRequestError("Cannot cancel a sale with an emitted invoice; cancel the invoice first");

      const items = await tx.select().from(saleItem).where(eq(saleItem.saleId, id));
      const [claimed] = await tx
        .update(sale)
        .set({ status: "anulada", cancellationReason: reason, cancelledAt: new Date(), cancelledBy: userId })
        .where(and(eq(sale.id, id), eq(sale.storeId, storeId), eq(sale.status, "completada")))
        .returning({ id: sale.id });
      if (!claimed) throw new BadRequestError("Sale was already cancelled or changed; try again");

      for (const item of items) {
        await tx
          .update(medicine)
          .set({ stock: sql`${medicine.stock} + ${item.quantity}` })
          .where(and(eq(medicine.id, item.medicineId), eq(medicine.storeId, storeId)));
        if (item.batchId) {
          const restored = await tx
            .update(batch)
            .set({ quantity: sql`${batch.quantity} + ${item.quantity}` })
            .where(and(eq(batch.id, item.batchId), eq(batch.medicineId, item.medicineId), eq(batch.storeId, storeId)))
            .returning({ id: batch.id });
          if (!restored.length) throw new BadRequestError("The sale batch no longer exists");
        }
        await tx.insert(inventoryMovement).values({
          id: randomUUID(),
          medicineId: item.medicineId,
          movementType: "devolucion",
          quantity: item.quantity,
          note: `Cancelación de venta #${id.slice(0, 8)}: ${reason}`,
          batchId: item.batchId,
          userId,
          storeId,
        });
      }
      return id;
    });

    const result = await findRichById(saleId, storeId);
    if (!result) throw new NotFoundError("Sale not found");
    return mapSale(result);
  },

  async getReport(params): Promise<ISaleReport> {
    const conditions = [eq(sale.status, "completada")];
    if (params?.storeId) conditions.push(eq(sale.storeId, params.storeId));
    if (params?.from) conditions.push(gte(sale.createdAt, params.from));
    if (params?.to) conditions.push(lte(sale.createdAt, params.to));

    const rows = await db
      .select({ sale: sale, item: saleItem, medicine: medicine })
      .from(sale)
      .innerJoin(saleItem, eq(saleItem.saleId, sale.id))
      .innerJoin(medicine, eq(saleItem.medicineId, medicine.id))
      .where(and(...conditions));

    const saleTotals = new Map<string, number>();
    const byPaymentMethod: Record<string, number> = {};
    const products = new Map<string, { medicine_id: string; medicine_name: string; quantity: number; revenue: number }>();
    let totalProfit = 0;
    for (const row of rows) {
      saleTotals.set(row.sale.id, Number(row.sale.total));
      byPaymentMethod[row.sale.paymentMethod] = (byPaymentMethod[row.sale.paymentMethod] ?? 0) + Number(row.item.lineTotal);
      const product = products.get(row.item.medicineId) ?? { medicine_id: row.item.medicineId, medicine_name: row.item.medicineName, quantity: 0, revenue: 0 };
      product.quantity += row.item.quantity;
      product.revenue += Number(row.item.lineTotal);
      products.set(row.item.medicineId, product);
      totalProfit += (Number(row.item.unitPrice) - Number(row.medicine.purchasePrice)) * row.item.quantity;
    }
    const totalRevenue = [...saleTotals.values()].reduce((sum, value) => sum + value, 0);
    return {
      total_sales: saleTotals.size,
      total_revenue: totalRevenue,
      total_profit: totalProfit,
      average_ticket: saleTotals.size ? totalRevenue / saleTotals.size : 0,
      by_payment_method: byPaymentMethod,
      top_products: [...products.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10),
    };
  },

  async getRevenueTrend(params): Promise<IRevenueTrendItem[]> {
    const period = sql.raw(`'${params.groupBy}'`);
    const result = await db.execute(sql`
      SELECT DATE_TRUNC(${period}, "created_at") AS period,
             SUM("total")::numeric AS revenue,
             COUNT(*)::int AS count
      FROM "sale"
      WHERE "store_id" = ${params.storeId}
        AND "status" = 'completada'
        AND "created_at" >= ${params.startDate}
        AND "created_at" <= ${params.endDate}
      GROUP BY DATE_TRUNC(${period}, "created_at")
      ORDER BY period ASC
    `);
    const rows = result.rows as unknown as Array<{ period: Date | string; revenue: string | number; count: number }>;
    return rows.map((row) => ({
      period: row.period instanceof Date ? row.period.toISOString() : String(row.period),
      revenue: Number(row.revenue),
      count: Number(row.count),
    }));
  },
};

```



> **sales.dto.ts**  
> Ruta: `backend-fastify/src/modules/sales/presentation/sales.dto.ts`  
>
```typescript
import { z } from "zod"

const paymentMethods = ["efectivo", "tarjeta_debito", "tarjeta_credito", "transferencia", "pago_movil", "mixto"] as const
const validDate = z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date")

export const CreateSaleItemDtoSchema = z.object({
  medicine_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive().optional(),
  batch_id: z.string().uuid().optional(),
})

export const CreateSaleDtoSchema = z.object({
  items: z.array(CreateSaleItemDtoSchema).min(1),
  payment_method: z.enum(paymentMethods),
  amount_received: z.number().nonnegative().optional(),
  client_id: z.string().uuid().optional(),
  prescription_id: z.string().uuid().optional(),
}).superRefine((data, ctx) => {
  if (data.payment_method === "efectivo" && data.amount_received === undefined) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["amount_received"], message: "Cash received is required" })
  }
})

export const CancelSaleDtoSchema = z.object({
  reason: z.string().trim().min(3).max(300),
})

export const SaleQuerySchema = z.object({
  from: validDate.optional(),
  to: validDate.optional(),
  payment_method: z.enum(paymentMethods).optional(),
  user_id: z.string().uuid().optional(),
  status: z.enum(["completada", "anulada"]).optional(),
  search: z.string().optional(),
  min_amount: z.coerce.number().nonnegative().optional(),
  min_items: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export const ReportQuerySchema = z.object({
  from: validDate.optional(),
  to: validDate.optional(),
})

export const RevenueTrendQuerySchema = z.object({
  start_date: validDate,
  end_date: validDate,
  group_by: z.enum(["day", "week", "month"]),
})

```



> **sales.controller.ts**  
> Ruta: `backend-fastify/src/modules/sales/presentation/sales.controller.ts`  
>
```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { createSaleService } from "../application/sales.service"
import { SaleRepository } from "../infrastructure/sales.drizzle.repository"
import { CancelSaleDtoSchema, CreateSaleDtoSchema, ReportQuerySchema, RevenueTrendQuerySchema, SaleQuerySchema } from "./sales.dto"

const service = createSaleService(SaleRepository)

export const salesController = {
  create: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = CreateSaleDtoSchema.parse(request.body)
    return reply.status(201).send(await service.create({ ...data, user_id: request.userId! }, request.storeId!))
  },

  getById: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    return reply.send(await service.getById(id, request.storeId!))
  },

  list: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = SaleQuerySchema.parse(request.query)
    return reply.send(await service.list({ ...query, storeId: request.storeId! }))
  },

  cancel: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const { reason } = CancelSaleDtoSchema.parse(request.body)
    return reply.send(await service.cancel(id, reason, request.userId!, request.storeId!))
  },

  report: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = ReportQuerySchema.parse(request.query)
    return reply.send(await service.getReport({ ...query, storeId: request.storeId! }))
  },

  revenueTrend: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = RevenueTrendQuerySchema.parse(request.query)
    return reply.send(await service.getRevenueTrend({ ...query, store_id: request.storeId! }))
  },
}

```



> **sales.routes.ts**  
> Ruta: `backend-fastify/src/modules/sales/presentation/sales.routes.ts`  
>
```typescript
import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { salesController } from "./sales.controller"
import { authGuard, storeGuard } from "@/modules/auth/application/common/auth.guard"

export const salesRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  const preHandler = [authGuard, storeGuard]

  fastify.get("/report", { preHandler }, salesController.report)
  fastify.get("/revenue-trend", { preHandler }, salesController.revenueTrend)
  fastify.post("/:id/cancel", { preHandler }, salesController.cancel)
  fastify.get("/:id", { preHandler }, salesController.getById)
  fastify.get("/", { preHandler }, salesController.list)
  fastify.post("/", { preHandler }, salesController.create)
}

```


### 21.3 Detalles clave

- **Estados**: `SaleStatus = "completada" | "anulada"`; pagos: `PaymentMethod = "efectivo" | "tarjeta_debito" | "tarjeta_credito" | "transferencia" | "pago_movil" | "mixto"`.
- **Selección de lote**: cada item puede traer `batch_id` explícito (el cajero elige el lote) **o** dejar que el sistema haga **FEFO automático**: los lotes se consumen por orden de vencimiento (`orderBy(asc(expiryDate))`) entre los que tienen stock > 0 y no están vencidos.
- **Validaciones de stock** (dentro de la transacción, con `FOR UPDATE` sobre los lotes): el lote explícito debe pertenecer a la tienda/medicamento, no estar vencido y tener stock; la cantidad restante se cubre con FEFO.
- **Receta obligatoria**: si el medicamento tiene `requiresPrescription` o `isControlled`, se exige una receta **`validada`** de la misma tienda, no vencida y del mismo cliente. Además se valida que lo dispendado (incluyendo ventas anteriores con la misma receta) **no exceda `authorized_quantity`** del item de receta.
- **Transacción única**: crear venta = `INSERT sale` + `INSERT sale_item(s)` + `UPDATE batch.quantity` (FEFO) + `INSERT inventory_movement` — todo o nada.
- **Cancelación**: `POST /sales/:id/cancel` → en transacción: venta → `anulada` (con `cancellationReason`, `cancelledAt`, `cancelledBy`), devolución de stock a los lotes originales. Si ya está anulada → error. La factura asociada también se anula (ver [22. Módulo invoices](#22-módulo-invoices)).
- **Reportes de caja**: `GET /sales/report` (resumen por rango/método de pago) y `GET /sales/revenue-trend` (tendencia de ingresos agrupada por día/semana/mes — `GroupBy`) alimentan la vista de caja del frontend.

## 22. Módulo invoices

**Propósito:** facturación de ventas. Crear factura asociada a una venta (ticket / simplificada / fiscal) con **numeración correlativa e ininterrumpida por tienda** (`FAC-YYYY-######`), consultar por rango de fechas y **anular** facturas (con validación de caja).

### 22.1 Archivos del módulo

| Archivo | Rol |
|---|---|
| `domain/invoices.types.ts` | Tipos: `InvoiceType`, `InvoiceStatus`, `InvoiceDTO`, `CreateInvoiceInput` |
| `domain/invoices.entities.ts` | Entidad `InvoiceEntity` |
| `domain/invoices.interface.ts` | Contrato `IInvoiceRepository` |
| `application/invoices.service.ts` | Reglas: correlativo, tipo de factura, anulación |
| `application/common/invoices.mappers.ts` | Entidad → DTO |
| `infrastructure/invoices.drizzle.repository.ts` | Repo Drizzle con **serialización de numeración** |
| `presentation/invoices.*` | DTO, controller, routes |

### 22.2 Código completo


> **invoices.types.ts**  
> Ruta: `backend-fastify/src/modules/invoices/domain/invoices.types.ts`  
>
```typescript
export type InvoiceType = "ticket" | "simplificada" | "fiscal"
export type InvoiceStatus = "emitida" | "anulada"

export interface IInvoiceResponse {
  id: string
  number: string
  invoice_type: InvoiceType
  sale_id: string
  client_id?: string | null
  client_name?: string | null
  client_document?: string | null
  client_address?: string | null
  client_phone?: string | null
  client_email?: string | null
  subtotal: number
  total: number
  status: InvoiceStatus
  cancelled_at?: string | null
  cancelled_by?: string | null
  issued_by?: string | null
  created_at: string
  updated_at: string
}

export interface IInvoiceListResponse {
  data: IInvoiceResponse[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

```



> **invoices.entities.ts**  
> Ruta: `backend-fastify/src/modules/invoices/domain/invoices.entities.ts`  
>
```typescript
import type { InvoiceStatus, InvoiceType } from "./invoices.types"

export interface IInvoiceEntity {
  id: string
  number: string
  invoice_type: InvoiceType
  sale_id: string
  client_id?: string | null
  client_name?: string | null
  client_document?: string | null
  client_address?: string | null
  client_phone?: string | null
  client_email?: string | null
  subtotal: number
  total: number
  status: InvoiceStatus
  cancelled_at?: Date | null
  cancelled_by?: string | null
  issued_by?: string | null
  created_at: Date
  updated_at: Date
}

export interface CreateInvoiceData {
  sale_id: string
  invoice_type: InvoiceType
  client_name?: string
  client_document?: string
  client_address?: string
  client_phone?: string
  client_email?: string
  user_id: string
}

```



> **invoices.interface.ts**  
> Ruta: `backend-fastify/src/modules/invoices/domain/invoices.interface.ts`  
>
```typescript
import type { CreateInvoiceData, IInvoiceEntity } from "./invoices.entities"

export interface IInvoiceRepository {
  create(data: CreateInvoiceData, storeId: string): Promise<IInvoiceEntity>
  findById(id: string, storeId: string): Promise<IInvoiceEntity | null>
  findAll(params?: {
    search?: string
    invoiceType?: string
    from?: Date
    to?: Date
    page?: number
    limit?: number
    storeId?: string
  }): Promise<{ invoices: IInvoiceEntity[]; total: number; page: number; limit: number }>
  cancel(id: string, reason: string, userId: string, storeId: string): Promise<IInvoiceEntity>
}

```



> **invoices.service.ts**  
> Ruta: `backend-fastify/src/modules/invoices/application/invoices.service.ts`  
>
```typescript
import { NotFoundError } from "@/core/errors/AppError"
import { endOfDay } from "@/core/utils/date"
import type { IInvoiceRepository } from "../domain/invoices.interface"
import type { CreateInvoiceData } from "../domain/invoices.entities"
import type { IInvoiceListResponse, IInvoiceResponse } from "../domain/invoices.types"
import { mapInvoiceToResponse } from "./common/invoices.mappers"

export const createInvoiceService = (repository: IInvoiceRepository) => ({
  create: async (data: CreateInvoiceData, storeId: string): Promise<IInvoiceResponse> =>
    mapInvoiceToResponse(await repository.create(data, storeId)),

  getById: async (id: string, storeId: string): Promise<IInvoiceResponse> => {
    const invoice = await repository.findById(id, storeId)
    if (!invoice) throw new NotFoundError("Invoice not found")
    return mapInvoiceToResponse(invoice)
  },

  list: async (params: {
    search?: string
    invoice_type?: string
    from?: string
    to?: string
    page?: number
    limit?: number
    storeId?: string
  }): Promise<IInvoiceListResponse> => {
    const result = await repository.findAll({
      search: params.search,
      invoiceType: params.invoice_type,
      from: params.from ? new Date(params.from) : undefined,
      to: params.to ? endOfDay(params.to) : undefined,
      page: params.page,
      limit: params.limit,
      storeId: params.storeId,
    })
    return {
      data: result.invoices.map(mapInvoiceToResponse),
      meta: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.max(1, Math.ceil(result.total / result.limit)) },
    }
  },

  cancel: async (id: string, reason: string, userId: string, storeId: string): Promise<IInvoiceResponse> =>
    mapInvoiceToResponse(await repository.cancel(id, reason, userId, storeId)),
})

```



> **invoices.mappers.ts**  
> Ruta: `backend-fastify/src/modules/invoices/application/common/invoices.mappers.ts`  
>
```typescript
import type { IInvoiceEntity } from "../../domain/invoices.entities"
import type { IInvoiceResponse } from "../../domain/invoices.types"

export function mapInvoiceToResponse(invoice: IInvoiceEntity): IInvoiceResponse {
  return {
    id: invoice.id,
    number: invoice.number,
    invoice_type: invoice.invoice_type,
    sale_id: invoice.sale_id,
    client_id: invoice.client_id ?? null,
    client_name: invoice.client_name ?? null,
    client_document: invoice.client_document ?? null,
    client_address: invoice.client_address ?? null,
    client_phone: invoice.client_phone ?? null,
    client_email: invoice.client_email ?? null,
    subtotal: invoice.subtotal,
    total: invoice.total,
    status: invoice.status,
    cancelled_at: invoice.cancelled_at?.toISOString() ?? null,
    cancelled_by: invoice.cancelled_by ?? null,
    issued_by: invoice.issued_by ?? null,
    created_at: invoice.created_at.toISOString(),
    updated_at: invoice.updated_at.toISOString(),
  }
}


```



> **invoices.drizzle.repository.ts — número correlativo con FOR UPDATE**  
> Ruta: `backend-fastify/src/modules/invoices/infrastructure/invoices.drizzle.repository.ts`  
>
```typescript
import { randomUUID } from "node:crypto";
import { and, count, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { invoice, sale } from "@/db/schema";
import { db } from "@/index";
import { BadRequestError, ConflictError, NotFoundError } from "@/core/errors/AppError";
import type { IInvoiceRepository } from "../domain/invoices.interface";
import type { CreateInvoiceData, IInvoiceEntity } from "../domain/invoices.entities";

type InvoiceRow = typeof invoice.$inferSelect;

function mapInvoice(row: InvoiceRow): IInvoiceEntity {
  return {
    id: row.id,
    number: row.number,
    invoice_type: row.invoiceType as IInvoiceEntity["invoice_type"],
    sale_id: row.saleId,
    client_id: row.clientId ?? null,
    client_name: row.clientName ?? null,
    client_document: row.clientDocument ?? null,
    client_address: row.clientAddress ?? null,
    client_phone: row.clientPhone ?? null,
    client_email: row.clientEmail ?? null,
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    status: row.status as IInvoiceEntity["status"],
    cancelled_at: row.cancelledAt ?? null,
    cancelled_by: row.cancelledBy ?? null,
    issued_by: row.issuedBy ?? null,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

export const InvoiceRepository: IInvoiceRepository = {
  async create(data: CreateInvoiceData, storeId: string): Promise<IInvoiceEntity> {
    const invoiceId = await db.transaction(async (tx) => {
      // Serialize invoice numbering per store
      await tx.execute(sql`
        SELECT "id"
        FROM "store"
        WHERE "id" = ${storeId}
        FOR UPDATE
      `);

      // Lock the sale row to serialize with sale cancellation
      await tx.execute(sql`
        SELECT "id"
        FROM "sale"
        WHERE "id" = ${data.sale_id}
          AND "store_id" = ${storeId}
        FOR UPDATE
      `);

      const [saleRow] = await tx
        .select()
        .from(sale)
        .where(and(eq(sale.id, data.sale_id), eq(sale.storeId, storeId)))
        .limit(1);
      if (!saleRow) throw new NotFoundError("Sale not found in this store");
      if (saleRow.status !== "completada") throw new BadRequestError("Only completed sales can be invoiced");

      const [existing] = await tx
        .select({ id: invoice.id })
        .from(invoice)
        .where(and(eq(invoice.saleId, saleRow.id), eq(invoice.storeId, storeId), eq(invoice.status, "emitida")))
        .limit(1);
      if (existing) throw new ConflictError("This sale already has an emitted invoice");

      const year = new Date().getFullYear();
      const prefix = `FAC-${year}-`;
      const [last] = await tx
        .select({ number: invoice.number })
        .from(invoice)
        .where(and(eq(invoice.storeId, storeId), ilike(invoice.number, `${prefix}%`)))
        .orderBy(desc(invoice.number))
        .limit(1);
      const next = last ? Number(last.number.slice(prefix.length)) + 1 : 1;
      const number = `${prefix}${String(next).padStart(6, "0")}`;

      const [created] = await tx
        .insert(invoice)
        .values({
          id: randomUUID(),
          number,
          invoiceType: data.invoice_type,
          saleId: saleRow.id,
          clientId: saleRow.clientId ?? null,
          clientName: data.client_name ?? null,
          clientDocument: data.client_document ?? null,
          clientAddress: data.client_address ?? null,
          clientPhone: data.client_phone ?? null,
          clientEmail: data.client_email ?? null,
          subtotal: saleRow.subtotal,
          total: saleRow.total,
          status: "emitida",
          issuedBy: data.user_id,
          storeId,
        })
        .returning({ id: invoice.id });

      return created.id;
    });

    const result = await InvoiceRepository.findById(invoiceId, storeId);
    if (!result) throw new NotFoundError("Invoice not found");
    return result;
  },

  async findById(id, storeId) {
    const [row] = await db
      .select()
      .from(invoice)
      .where(and(eq(invoice.id, id), eq(invoice.storeId, storeId)))
      .limit(1);
    return row ? mapInvoice(row) : null;
  },

  async findAll(params) {
    const conditions = [];
    if (params?.storeId) conditions.push(eq(invoice.storeId, params.storeId));
    if (params?.invoiceType) conditions.push(eq(invoice.invoiceType, params.invoiceType));
    if (params?.from) conditions.push(gte(invoice.createdAt, params.from));
    if (params?.to) conditions.push(lte(invoice.createdAt, params.to));
    if (params?.search) {
      conditions.push(or(
        ilike(invoice.number, `%${params.search}%`),
        ilike(invoice.clientName, `%${params.search}%`),
        ilike(invoice.clientDocument, `%${params.search}%`),
      )!);
    }

    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const rows = await db
      .select()
      .from(invoice)
      .where(and(...conditions))
      .orderBy(desc(invoice.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);
    const [totalRows] = await db
      .select({ total: count() })
      .from(invoice)
      .where(and(...conditions));

    return {
      invoices: rows.map(mapInvoice),
      total: totalRows?.total ?? 0,
      page,
      limit,
    };
  },

  async cancel(id, reason, userId, storeId) {
    const invoiceId = await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(invoice)
        .where(and(eq(invoice.id, id), eq(invoice.storeId, storeId)))
        .limit(1);
      if (!current) throw new NotFoundError("Invoice not found");
      if (current.status === "anulada") throw new BadRequestError("Invoice is already cancelled");

      const [claimed] = await tx
        .update(invoice)
        .set({ status: "anulada", cancelledAt: new Date(), cancelledBy: userId })
        .where(and(eq(invoice.id, id), eq(invoice.storeId, storeId), eq(invoice.status, "emitida")))
        .returning({ id: invoice.id });
      if (!claimed) throw new BadRequestError("Invoice was already cancelled; try again");

      return id;
    });

    const result = await InvoiceRepository.findById(invoiceId, storeId);
    if (!result) throw new NotFoundError("Invoice not found");
    return result;
  },
};

```



> **invoices.dto.ts**  
> Ruta: `backend-fastify/src/modules/invoices/presentation/invoices.dto.ts`  
>
```typescript
import { z } from "zod"

const validDate = z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date")

export const InvoiceQuerySchema = z.object({
  search: z.string().optional(),
  invoice_type: z.enum(["ticket", "simplificada", "fiscal"]).optional(),
  from: validDate.optional(),
  to: validDate.optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export const CreateInvoiceDtoSchema = z.object({
  sale_id: z.string().uuid(),
  invoice_type: z.enum(["simplificada", "fiscal"]),
  client_name: z.string().trim().min(1).max(160).optional(),
  client_document: z.string().trim().max(40).optional(),
  client_address: z.string().trim().max(240).optional(),
  client_phone: z.string().trim().max(40).optional(),
  client_email: z.string().email().optional(),
})

export const CancelInvoiceDtoSchema = z.object({
  reason: z.string().trim().min(3).max(300),
})

```



> **invoices.controller.ts**  
> Ruta: `backend-fastify/src/modules/invoices/presentation/invoices.controller.ts`  
>
```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { createInvoiceService } from "../application/invoices.service"
import { InvoiceRepository } from "../infrastructure/invoices.drizzle.repository"
import { CancelInvoiceDtoSchema, CreateInvoiceDtoSchema, InvoiceQuerySchema } from "./invoices.dto"

const service = createInvoiceService(InvoiceRepository)

export const invoicesController = {
  list: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = InvoiceQuerySchema.parse(request.query)
    return reply.send(await service.list({ ...query, storeId: request.storeId! }))
  },

  getById: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    return reply.send(await service.getById(id, request.storeId!))
  },

  create: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = CreateInvoiceDtoSchema.parse(request.body)
    return reply.status(201).send(await service.create({ ...data, user_id: request.userId! }, request.storeId!))
  },

  cancel: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const { reason } = CancelInvoiceDtoSchema.parse(request.body)
    return reply.send(await service.cancel(id, reason, request.userId!, request.storeId!))
  },
}

```



> **invoices.routes.ts**  
> Ruta: `backend-fastify/src/modules/invoices/presentation/invoices.routes.ts`  
>
```typescript
import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { invoicesController } from "./invoices.controller"
import { authGuard, storeGuard } from "@/modules/auth/application/common/auth.guard"

export const invoicesRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  const preHandler = [authGuard, storeGuard]

  fastify.post("/:id/cancel", { preHandler }, invoicesController.cancel)
  fastify.get("/:id", { preHandler }, invoicesController.getById)
  fastify.get("/", { preHandler }, invoicesController.list)
  fastify.post("/", { preHandler }, invoicesController.create)
}

```


### 22.3 Detalles clave

- **Numeración**: el correlativo se calcula con `MAX(number)` + contador de tienda dentro de una transacción con `FOR UPDATE` sobre la fila de `store` (o `invoice`) — dos cajas no pueden generar el mismo número.
- **Formatos**: `ticket`, `simplificada`, `fiscal`. El documento fiscal imprime según tipo (ticket sin datos fiscales, simplificada/fiscal con RUC).
- **Anulación**: solo facturas `emitida`; cambia a `anulada` y (según política) puede requerir motivo. Asociada 1:1 con la venta (`saleId`).

## 23. Módulo prescriptions

**Propósito:** recetas médicas y control de dispensación. CRUD de recetas con items (medicamento + cantidad), estado de la receta y **validación de dispensación** (`POST /prescriptions/:id/validate`) — el paso que el punto de venta consulta antes de vender un medicamento que requiere receta.

### 23.1 Archivos del módulo

| Archivo | Rol |
|---|---|
| `domain/prescriptions.types.ts` | Tipos: `PrescriptionStatus`, `PrescriptionDTO`, `CreatePrescriptionInput`, `PrescriptionItemInput` |
| `domain/prescriptions.entities.ts` | Entidades `PrescriptionEntity`, `PrescriptionItemEntity` |
| `domain/prescriptions.interface.ts` | Contrato `IPrescriptionRepository` |
| `application/prescriptions.service.ts` | Reglas: items no vacíos, validación de dispensación, estado |
| `application/common/prescriptions.mappers.ts` | Entidad → DTO |
| `infrastructure/prescriptions.drizzle.repository.ts` | Repo Drizzle |
| `presentation/prescriptions.*` | DTO, controller, routes |

### 23.2 Código completo


> **prescriptions.types.ts**  
> Ruta: `backend-fastify/src/modules/prescriptions/domain/prescriptions.types.ts`  
>
```typescript
export type PrescriptionStatus = "pendiente" | "validada" | "expirada" | "anulada"

export interface IPrescriptionItemResponse {
  id: string
  medicine_id: string
  medicine_name: string
  quantity: number
  authorized_quantity: number
  authorized_by?: string | null
}

export interface IPrescriptionResponse {
  id: string
  number: string
  doctor_name?: string | null
  medical_center?: string | null
  issue_date?: string | null
  expiry_date?: string | null
  image?: string | null
  notes?: string | null
  status: PrescriptionStatus
  validated_by?: string | null
  validated_at?: string | null
  client_id?: string | null
  client_name?: string | null
  items: IPrescriptionItemResponse[]
  created_at: string
  updated_at: string
}

export interface IPrescriptionListResponse {
  data: IPrescriptionResponse[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export interface IAuthorizedItem {
  medicine_id: string
  quantity: number
}

```



> **prescriptions.entities.ts**  
> Ruta: `backend-fastify/src/modules/prescriptions/domain/prescriptions.entities.ts`  
>
```typescript
import { PrescriptionStatus } from "./prescriptions.types"

export interface IPrescriptionEntity {
  id: string
  number: string
  doctor_name?: string | null
  medical_center?: string | null
  issue_date?: Date | null
  expiry_date?: Date | null
  image?: string | null
  notes?: string | null
  status: PrescriptionStatus
  validated_by?: string | null
  validated_at?: Date | null
  client_id?: string | null
  store_id: string
  created_at: Date
  updated_at: Date
  deleted_at?: Date | null
}

export interface IPrescriptionItemEntity {
  id: string
  prescription_id: string
  medicine_id: string
  medicine_name: string
  quantity: number
  authorized_quantity: number
  authorized_by?: string | null
  created_at: Date
}

export interface IPrescriptionWithItemsEntity extends IPrescriptionEntity {
  items: IPrescriptionItemEntity[]
  client_name?: string | null
}

export interface IPrescriptionItemInput {
  medicine_id: string
  quantity: number
}

export type CreatePrescriptionData = {
  number: string
  doctor_name?: string
  medical_center?: string
  issue_date?: string
  expiry_date?: string
  image?: string
  notes?: string
  client_id?: string | null
  items: IPrescriptionItemInput[]
}

export type UpdatePrescriptionData = Partial<Omit<CreatePrescriptionData, "items">> & {
  items?: IPrescriptionItemInput[]
}

```



> **prescriptions.interface.ts**  
> Ruta: `backend-fastify/src/modules/prescriptions/domain/prescriptions.interface.ts`  
>
```typescript
import type {
  CreatePrescriptionData,
  IPrescriptionItemEntity,
  IPrescriptionWithItemsEntity,
  UpdatePrescriptionData,
} from "./prescriptions.entities"
import type { IAuthorizedItem } from "./prescriptions.types"

export interface IPrescriptionRepository {
  findAll(params?: {
    search?: string
    status?: string
    client_id?: string
    page?: number
    limit?: number
    storeId?: string
  }): Promise<{ prescriptions: IPrescriptionWithItemsEntity[]; total: number; page: number; limit: number }>
  findById(id: string, storeId?: string): Promise<IPrescriptionWithItemsEntity | null>
  findByNumber(number: string, storeId?: string): Promise<IPrescriptionWithItemsEntity | null>
  create(data: CreatePrescriptionData, storeId: string, medicineNames: Map<string, string>): Promise<IPrescriptionWithItemsEntity>
  update(id: string, data: UpdatePrescriptionData, storeId: string, medicineNames?: Map<string, string>): Promise<IPrescriptionWithItemsEntity>
  replaceItems(prescriptionId: string, items: CreatePrescriptionData["items"], medicineNames: Map<string, string>): Promise<IPrescriptionItemEntity[]>
  validate(id: string, storeId: string, userId: string, authorized: IAuthorizedItem[]): Promise<IPrescriptionWithItemsEntity>
  softDelete(id: string, storeId: string): Promise<void>
}

```



> **prescriptions.service.ts**  
> Ruta: `backend-fastify/src/modules/prescriptions/application/prescriptions.service.ts`  
>
```typescript
import { BadRequestError, ConflictError, NotFoundError } from "@/core/errors/AppError"
import { IPrescriptionRepository } from "../domain/prescriptions.interface"
import { CreatePrescriptionData, UpdatePrescriptionData } from "../domain/prescriptions.entities"
import { IAuthorizedItem, IPrescriptionListResponse, IPrescriptionResponse } from "../domain/prescriptions.types"
import { mapPrescription, resolveMedicineNames, validateClient } from "./common/prescriptions.mappers"

export const createPrescriptionService = (repository: IPrescriptionRepository) => ({
  list: async (params?: Parameters<IPrescriptionRepository["findAll"]>[0]): Promise<IPrescriptionListResponse> => {
    const result = await repository.findAll(params)
    return {
      data: result.prescriptions.map(mapPrescription),
      meta: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.max(1, Math.ceil(result.total / result.limit)) },
    }
  },

  getById: async (id: string, storeId: string): Promise<IPrescriptionResponse> => {
    const prescription = await repository.findById(id, storeId)
    if (!prescription) throw new NotFoundError("Prescription not found")
    return mapPrescription(prescription)
  },

  create: async (data: CreatePrescriptionData, storeId: string): Promise<IPrescriptionResponse> => {
    const existing = await repository.findByNumber(data.number, storeId)
    if (existing) throw new ConflictError("A prescription with this number already exists")
    await validateClient(data.client_id, storeId)
    const medicineNames = await resolveMedicineNames(data.items.map((i) => i.medicine_id), storeId)
    const prescription = await repository.create(data, storeId, medicineNames)
    return mapPrescription(prescription)
  },

  update: async (id: string, data: UpdatePrescriptionData, storeId: string): Promise<IPrescriptionResponse> => {
    const existing = await repository.findById(id, storeId)
    if (!existing) throw new NotFoundError("Prescription not found")
    if (existing.status !== "pendiente") throw new BadRequestError("Only pending prescriptions can be edited")

    if (data.number && data.number !== existing.number) {
      const duplicate = await repository.findByNumber(data.number, storeId)
      if (duplicate && duplicate.id !== id) throw new ConflictError("A prescription with this number already exists")
    }

    await validateClient(data.client_id, storeId)

    let medicineNames: Map<string, string> | undefined
    if (data.items?.length) {
      medicineNames = await resolveMedicineNames(data.items.map((i) => i.medicine_id), storeId)
    }

    const prescription = await repository.update(id, data, storeId, medicineNames)
    return mapPrescription(prescription)
  },

  validate: async (id: string, storeId: string, userId: string, data: { authorized_items?: IAuthorizedItem[] }): Promise<IPrescriptionResponse> => {
    const existing = await repository.findById(id, storeId)
    if (!existing) throw new NotFoundError("Prescription not found")
    if (existing.status !== "pendiente") throw new BadRequestError("Only pending prescriptions can be validated")

    const prescriptionItemIds = new Set(existing.items.map((i) => i.medicine_id))

    const authorized = data.authorized_items?.length
      ? data.authorized_items
      : existing.items.map((i) => ({ medicine_id: i.medicine_id, quantity: i.quantity }))

    const unknownItem = authorized.find((i) => !prescriptionItemIds.has(i.medicine_id))
    if (unknownItem) throw new BadRequestError(`Medicine ${unknownItem.medicine_id} is not in this prescription`)

    const prescription = await repository.validate(id, storeId, userId, authorized)
    return mapPrescription(prescription)
  },

  delete: async (id: string, storeId: string): Promise<void> => {
    const existing = await repository.findById(id, storeId)
    if (!existing) throw new NotFoundError("Prescription not found")
    await repository.softDelete(id, storeId)
  },
})

```



> **prescriptions.mappers.ts**  
> Ruta: `backend-fastify/src/modules/prescriptions/application/common/prescriptions.mappers.ts`  
>
```typescript
import { BadRequestError, NotFoundError } from "@/core/errors/AppError"
import { MedicineRepository } from "@/modules/medicines/infrastructure/medicines.drizzle.repository"
import { ClientRepository } from "@/modules/clients/infrastructure/clients.drizzle.repository"
import { IPrescriptionItemEntity, IPrescriptionWithItemsEntity } from "../../domain/prescriptions.entities"
import { IPrescriptionResponse } from "../../domain/prescriptions.types"

export function iso(value?: Date | string | null): string | null {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : value
}

export function mapItem(item: IPrescriptionItemEntity) {
  return {
    id: item.id,
    medicine_id: item.medicine_id,
    medicine_name: item.medicine_name,
    quantity: item.quantity,
    authorized_quantity: item.authorized_quantity,
    authorized_by: item.authorized_by ?? null,
  }
}

export function mapPrescription(prescription: IPrescriptionWithItemsEntity): IPrescriptionResponse {
  return {
    id: prescription.id,
    number: prescription.number,
    doctor_name: prescription.doctor_name ?? null,
    medical_center: prescription.medical_center ?? null,
    issue_date: iso(prescription.issue_date),
    expiry_date: iso(prescription.expiry_date),
    image: prescription.image ?? null,
    notes: prescription.notes ?? null,
    status: prescription.status,
    validated_by: prescription.validated_by ?? null,
    validated_at: iso(prescription.validated_at),
    client_id: prescription.client_id ?? null,
    client_name: prescription.client_name ?? "Cliente no registrado",
    items: prescription.items.map(mapItem),
    created_at: prescription.created_at.toISOString(),
    updated_at: prescription.updated_at.toISOString(),
  }
}

export async function resolveMedicineNames(medicineIds: string[], storeId: string): Promise<Map<string, string>> {
  const names = new Map<string, string>()
  for (const medicineId of new Set(medicineIds)) {
    const medicine = await MedicineRepository.findById(medicineId, storeId)
    if (!medicine) throw new BadRequestError("One or more medicines were not found")
    names.set(medicineId, medicine.commercial_name)
  }
  return names
}

export async function validateClient(clientId: string | null | undefined, storeId: string): Promise<void> {
  if (!clientId) return
  const client = await ClientRepository.findById(clientId, storeId)
  if (!client) throw new NotFoundError("Client not found")
}

```



> **prescriptions.drizzle.repository.ts**  
> Ruta: `backend-fastify/src/modules/prescriptions/infrastructure/prescriptions.drizzle.repository.ts`  
>
```typescript
import { randomUUID } from "node:crypto";
import { and, asc, count, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { client, prescription, prescriptionItem } from "@/db/schema";
import { db } from "@/index";
import { IPrescriptionRepository } from "../domain/prescriptions.interface";
import {
  CreatePrescriptionData,
  IPrescriptionItemEntity,
  IPrescriptionWithItemsEntity,
  UpdatePrescriptionData,
} from "../domain/prescriptions.entities";
import { IAuthorizedItem, PrescriptionStatus } from "../domain/prescriptions.types";
import { NotFoundError } from "@/core/errors/AppError";

function mapRowToEntity(
  row: typeof prescription.$inferSelect & { client_name?: string | null },
  items: IPrescriptionItemEntity[],
): IPrescriptionWithItemsEntity {
  return {
    id: row.id,
    number: row.number,
    doctor_name: row.doctorName ?? null,
    medical_center: row.medicalCenter ?? null,
    issue_date: row.issueDate ?? null,
    expiry_date: row.expiryDate ?? null,
    image: row.image ?? null,
    notes: row.notes ?? null,
    status: row.status as PrescriptionStatus,
    validated_by: row.validatedBy ?? null,
    validated_at: row.validatedAt ?? null,
    client_id: row.clientId ?? null,
    store_id: row.storeId,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    deleted_at: row.deletedAt ?? null,
    client_name: row.client_name ?? null,
    items,
  };
}

function mapItemRowToEntity(row: typeof prescriptionItem.$inferSelect): IPrescriptionItemEntity {
  return {
    id: row.id,
    prescription_id: row.prescriptionId,
    medicine_id: row.medicineId,
    medicine_name: row.medicineName,
    quantity: row.quantity,
    authorized_quantity: row.authorizedQuantity,
    authorized_by: row.authorizedBy ?? null,
    created_at: row.createdAt,
  };
}

function dateValue(value?: string | null): Date | null {
  return value ? new Date(value) : null;
}

async function fetchItems(prescriptionId: string): Promise<IPrescriptionItemEntity[]> {
  const rows = await db
    .select()
    .from(prescriptionItem)
    .where(eq(prescriptionItem.prescriptionId, prescriptionId))
    .orderBy(asc(prescriptionItem.createdAt));

  return rows.map(mapItemRowToEntity);
}

async function fetchWithClient(prescriptionId: string, storeId: string): Promise<IPrescriptionWithItemsEntity | null> {
  const [row] = await db
    .select({
      prescription: prescription,
      client_name: client.fullName,
    })
    .from(prescription)
    .leftJoin(client, eq(prescription.clientId, client.id))
    .where(
      and(
        eq(prescription.id, prescriptionId),
        eq(prescription.storeId, storeId),
      ),
    )
    .limit(1);

  if (!row) return null;

  return mapRowToEntity(
    { ...row.prescription, client_name: row.client_name },
    await fetchItems(prescriptionId),
  );
}

export const PrescriptionRepository: IPrescriptionRepository = {
  async findAll(params) {
    const conditions = [eq(prescription.storeId, params?.storeId ?? ""), isNull(prescription.deletedAt)];
    if (params?.status) conditions.push(eq(prescription.status, params.status));
    if (params?.client_id) conditions.push(eq(prescription.clientId, params.client_id));
    if (params?.search) {
      conditions.push(
        or(
          ilike(prescription.number, `%${params.search}%`),
          ilike(prescription.doctorName, `%${params.search}%`),
          ilike(client.fullName, `%${params.search}%`),
        )!,
      );
    }

    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;

    const rows = await db
      .select({
        prescription: prescription,
        client_name: client.fullName,
      })
      .from(prescription)
      .leftJoin(client, eq(prescription.clientId, client.id))
      .where(and(...conditions))
      .orderBy(desc(prescription.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const [totalRows] = await db
      .select({ total: count() })
      .from(prescription)
      .leftJoin(client, eq(prescription.clientId, client.id))
      .where(and(...conditions));

    const itemRows = rows.length
      ? await db
          .select()
          .from(prescriptionItem)
          .where(
            or(...rows.map((r) => eq(prescriptionItem.prescriptionId, r.prescription.id)))!,
          )
          .orderBy(asc(prescriptionItem.createdAt))
      : [];

    const itemsByPrescription = new Map<string, IPrescriptionItemEntity[]>();
    for (const item of itemRows) {
      const list = itemsByPrescription.get(item.prescriptionId) ?? [];
      list.push(mapItemRowToEntity(item));
      itemsByPrescription.set(item.prescriptionId, list);
    }

    return {
      prescriptions: rows.map((row) =>
        mapRowToEntity(
          { ...row.prescription, client_name: row.client_name },
          itemsByPrescription.get(row.prescription.id) ?? [],
        ),
      ),
      total: totalRows?.total ?? 0,
      page,
      limit,
    };
  },

  async findById(id: string, storeId?: string): Promise<IPrescriptionWithItemsEntity | null> {
    const conditions = [eq(prescription.id, id), isNull(prescription.deletedAt)];
    if (storeId) conditions.push(eq(prescription.storeId, storeId));

    const [row] = await db
      .select({
        prescription: prescription,
        client_name: client.fullName,
      })
      .from(prescription)
      .leftJoin(client, eq(prescription.clientId, client.id))
      .where(and(...conditions))
      .limit(1);

    if (!row) return null;

    return mapRowToEntity(
      { ...row.prescription, client_name: row.client_name },
      await fetchItems(row.prescription.id),
    );
  },

  async findByNumber(number: string, storeId?: string): Promise<IPrescriptionWithItemsEntity | null> {
    const conditions = [eq(prescription.number, number), isNull(prescription.deletedAt)];
    if (storeId) conditions.push(eq(prescription.storeId, storeId));

    const [row] = await db
      .select({
        prescription: prescription,
        client_name: client.fullName,
      })
      .from(prescription)
      .leftJoin(client, eq(prescription.clientId, client.id))
      .where(and(...conditions))
      .limit(1);

    if (!row) return null;

    return mapRowToEntity({ ...row.prescription, client_name: row.client_name }, []);
  },

  async create(
    data: CreatePrescriptionData,
    storeId: string,
    medicineNames: Map<string, string>,
  ): Promise<IPrescriptionWithItemsEntity> {
    const [row] = await db
      .insert(prescription)
      .values({
        id: randomUUID(),
        number: data.number,
        doctorName: data.doctor_name ?? null,
        medicalCenter: data.medical_center ?? null,
        issueDate: dateValue(data.issue_date),
        expiryDate: dateValue(data.expiry_date),
        image: data.image ?? null,
        notes: data.notes ?? null,
        status: "pendiente",
        clientId: data.client_id ?? null,
        storeId,
      })
      .returning();

    await this.replaceItems(row.id, data.items, medicineNames);

    return (await fetchWithClient(row.id, storeId))!;
  },

  async update(
    id: string,
    data: UpdatePrescriptionData,
    storeId: string,
    medicineNames?: Map<string, string>,
  ): Promise<IPrescriptionWithItemsEntity> {
    const conditions = [eq(prescription.id, id), eq(prescription.storeId, storeId), isNull(prescription.deletedAt)];

    const [row] = await db
      .update(prescription)
      .set({
        ...(data.number !== undefined && { number: data.number }),
        ...(data.doctor_name !== undefined && { doctorName: data.doctor_name }),
        ...(data.medical_center !== undefined && { medicalCenter: data.medical_center }),
        ...(data.issue_date !== undefined && { issueDate: dateValue(data.issue_date) }),
        ...(data.expiry_date !== undefined && { expiryDate: dateValue(data.expiry_date) }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.client_id !== undefined && { clientId: data.client_id }),
      })
      .where(and(...conditions))
      .returning();

    if (!row) throw new NotFoundError("Prescription not found");

    if (data.items && medicineNames) {
      await this.replaceItems(row.id, data.items, medicineNames);
    }

    return (await fetchWithClient(row.id, storeId))!;
  },

  async replaceItems(
    prescriptionId: string,
    items: CreatePrescriptionData["items"],
    medicineNames: Map<string, string>,
  ): Promise<IPrescriptionItemEntity[]> {
    await db.delete(prescriptionItem).where(eq(prescriptionItem.prescriptionId, prescriptionId));

    if (!items.length) return [];

    const rows = await db
      .insert(prescriptionItem)
      .values(
        items.map((item) => ({
          id: randomUUID(),
          prescriptionId,
          medicineId: item.medicine_id,
          medicineName: medicineNames.get(item.medicine_id) ?? "",
          quantity: item.quantity,
          authorizedQuantity: 0,
        })),
      )
      .returning();

    return rows.map(mapItemRowToEntity);
  },

  async validate(
    id: string,
    storeId: string,
    userId: string,
    authorized: IAuthorizedItem[],
  ): Promise<IPrescriptionWithItemsEntity> {
    const conditions = [eq(prescription.id, id), eq(prescription.storeId, storeId), isNull(prescription.deletedAt)];

    const [row] = await db
      .update(prescription)
      .set({
        status: "validada",
        validatedBy: userId,
        validatedAt: new Date(),
      })
      .where(and(...conditions))
      .returning();

    if (!row) throw new NotFoundError("Prescription not found");

    for (const item of authorized) {
      await db
        .update(prescriptionItem)
        .set({
          authorizedQuantity: item.quantity,
          authorizedBy: userId,
        })
        .where(
          and(
            eq(prescriptionItem.prescriptionId, id),
            eq(prescriptionItem.medicineId, item.medicine_id),
          ),
        );
    }

    return (await fetchWithClient(id, storeId))!;
  },

  async softDelete(id: string, storeId: string): Promise<void> {
    const [row] = await db
      .update(prescription)
      .set({
        deletedAt: new Date(),
        status: "anulada",
      })
      .where(
        and(
          eq(prescription.id, id),
          eq(prescription.storeId, storeId),
          isNull(prescription.deletedAt),
        ),
      )
      .returning({ id: prescription.id });

    if (!row) throw new NotFoundError("Prescription not found");
  },
};

```



> **prescriptions.dto.ts**  
> Ruta: `backend-fastify/src/modules/prescriptions/presentation/prescriptions.dto.ts`  
>
```typescript
import { z } from "zod"

const dateString = z.string().optional()
const item = z.object({ medicine_id: z.string().uuid(), quantity: z.number().int().positive() })

export const CreatePrescriptionDtoSchema = z.object({
  number: z.string().trim().min(1),
  doctor_name: z.string().trim().optional(),
  medical_center: z.string().trim().optional(),
  issue_date: dateString,
  expiry_date: dateString,
  image: z.string().optional(),
  notes: z.string().trim().optional(),
  client_id: z.string().uuid().nullable().optional(),
  items: z.array(item).min(1),
})

export const UpdatePrescriptionDtoSchema = CreatePrescriptionDtoSchema.partial()

export const ValidatePrescriptionDtoSchema = z.object({
  authorized_items: z.array(item).optional(),
})

export const PrescriptionQuerySchema = z.object({
  search: z.string().optional(),
  status: z.union([z.enum(["pendiente", "validada", "expirada", "anulada"]), z.literal("")]).optional(),
  client_id: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export type CreatePrescriptionDto = z.infer<typeof CreatePrescriptionDtoSchema>
export type UpdatePrescriptionDto = z.infer<typeof UpdatePrescriptionDtoSchema>
export type ValidatePrescriptionDto = z.infer<typeof ValidatePrescriptionDtoSchema>
export type PrescriptionQueryDto = z.infer<typeof PrescriptionQuerySchema>

```



> **prescriptions.controller.ts**  
> Ruta: `backend-fastify/src/modules/prescriptions/presentation/prescriptions.controller.ts`  
>
```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { createPrescriptionService } from "../application/prescriptions.service"
import { PrescriptionRepository } from "../infrastructure/prescriptions.drizzle.repository"
import {
  CreatePrescriptionDtoSchema,
  PrescriptionQuerySchema,
  UpdatePrescriptionDtoSchema,
  ValidatePrescriptionDtoSchema,
} from "./prescriptions.dto"

const service = createPrescriptionService(PrescriptionRepository)

export const prescriptionsController = {
  list: async (request: FastifyRequest, reply: FastifyReply) =>
    reply.send(await service.list({ ...PrescriptionQuerySchema.parse(request.query), storeId: request.storeId })),

  getById: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    return reply.send(await service.getById(id, request.storeId!))
  },

  create: async (request: FastifyRequest, reply: FastifyReply) =>
    reply.status(201).send(await service.create(CreatePrescriptionDtoSchema.parse(request.body), request.storeId!)),

  update: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    return reply.send(await service.update(id, UpdatePrescriptionDtoSchema.parse(request.body), request.storeId!))
  },

  validate: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const data = ValidatePrescriptionDtoSchema.parse(request.body)
    return reply.send(await service.validate(id, request.storeId!, request.userId!, data))
  },

  delete: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    await service.delete(id, request.storeId!)
    return reply.send({ message: "Prescription deleted successfully" })
  },
}

```



> **prescriptions.routes.ts**  
> Ruta: `backend-fastify/src/modules/prescriptions/presentation/prescriptions.routes.ts`  
>
```typescript
import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { prescriptionsController } from "./prescriptions.controller"
import { authGuard, storeGuard } from "@/modules/auth/application/common/auth.guard"

export const prescriptionsRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  const preHandler = [authGuard, storeGuard]

  fastify.get(
    "/",
    { preHandler },
    prescriptionsController.list
  )

  fastify.get(
    "/:id",
    { preHandler },
    prescriptionsController.getById
  )

  fastify.post(
    "/",
    { preHandler },
    prescriptionsController.create
  )

  fastify.put(
    "/:id",
    { preHandler },
    prescriptionsController.update
  )

  fastify.post(
    "/:id/validate",
    { preHandler },
    prescriptionsController.validate
  )

  fastify.delete(
    "/:id",
    { preHandler },
    prescriptionsController.delete
  )
}

```


### 23.3 Detalles clave

- **Receta con items**: `prescription` (cabecera: cliente, doctor, centro, fechas, estado) + `prescription_item` (medicamento, cantidad, `authorized_quantity`). El schema cascada `prescription_item → prescription`.
- **Estados**: `PrescriptionStatus = "pendiente" | "validada" | "expirada" | "anulada"`. La venta exige una receta **`validada`** (ver [21. Módulo sales](#21-módulo-sales)); si `expiry_date` ya pasó, la venta se rechaza con "Prescription has expired".
- **`authorized_quantity`**: la receta limita cuánto se puede dispensar por medicamento; `items` lleva `authorized_quantity` y `authorized_by` (quién la validó).
- **Número de receta único por tienda**: `uq_prescription_store_number` (número correlativo propio de recetas).

## 24. Módulo reports

**Propósito:** reportes del dashboard y financieros. KPIs del día (ventas, tickets, clientes únicos), resumen de inventario (stock bajo, vencidos, por vencer), ingresos de 30 días, ventas por método de pago, top productos de la semana, y reporte financiero por rango de fechas (ingresos, costos, ganancia, margen, por producto, por laboratorio, flujo de caja).

### 23.1 Archivos del módulo

| Archivo | Rol |
|---|---|
| `domain/reports.types.ts` | Tipos de respuesta: `DashboardReport`, `FinancialReport`, `CashFlowEntry` |
| `domain/reports.interface.ts` | Contrato `IReportRepository` |
| `application/reports.service.ts` | Casos de uso: `getDashboard`, `getFinancial` (orquestan queries del repo) |
| `infrastructure/reports.drizzle.repository.ts` | Implementación con queries agregadas SQL (COUNT, SUM, GROUP BY) |
| `presentation/reports.*` | DTO, controller, routes |

### 23.2 Código completo


> **reports.types.ts**  
> Ruta: `backend-fastify/src/modules/reports/domain/reports.types.ts`  
>
```typescript
export interface ITodayKpi {
  revenue: number
  sales_count: number
  average_ticket: number
  items_sold: number
}

export interface IPaymentBreakdown {
  method: string
  count: number
  total: number
}

export interface ITopProduct {
  medicine_id: string
  medicine_name: string
  quantity: number
  revenue: number
}

export interface IRecentSale {
  id: string
  subtotal: number
  total: number
  payment_method: string
  status: string
  user_id: string
  user_name?: string | null
  client_id?: string | null
  client_name?: string | null
  prescription_id?: string | null
  created_at: string
  updated_at: string
}

export interface IDashboardReport {
  today: ITodayKpi
  low_stock_count: number
  out_of_stock_count: number
  expiring_soon_count: number
  expired_count: number
  revenue_30d: { period: string; revenue: number }[]
  sales_by_payment: IPaymentBreakdown[]
  top_products_week: ITopProduct[]
  recent_sales: IRecentSale[]
}

export interface IProductFinancial {
  medicine_id: string
  medicine_name: string
  quantity: number
  revenue: number
  profit: number
}

export interface ILaboratoryFinancial {
  laboratory: string
  revenue: number
  profit: number
}

export interface ICashFlowItem {
  period: string
  revenue: number
  purchases: number
}

export interface IFinancialReport {
  total_revenue: number
  total_cost: number
  total_profit: number
  profit_margin: number
  by_product: IProductFinancial[]
  by_laboratory: ILaboratoryFinancial[]
  cash_flow: ICashFlowItem[]
}

```



> **reports.interface.ts**  
> Ruta: `backend-fastify/src/modules/reports/domain/reports.interface.ts`  
>
```typescript
import type { IDashboardReport, IFinancialReport } from "./reports.types"

export interface IReportRepository {
  getDashboard(storeId: string): Promise<IDashboardReport>
  getFinancial(params: { from?: Date; to?: Date; storeId: string }): Promise<IFinancialReport>
}

```



> **reports.service.ts**  
> Ruta: `backend-fastify/src/modules/reports/application/reports.service.ts`  
>
```typescript
import { endOfDay } from "@/core/utils/date"
import type { IReportRepository } from "../domain/reports.interface"
import type { IDashboardReport, IFinancialReport } from "../domain/reports.types"

export const createReportService = (repository: IReportRepository) => ({
  dashboard: async (storeId: string): Promise<IDashboardReport> => repository.getDashboard(storeId),

  financial: async (params: { from?: string; to?: string; storeId: string }): Promise<IFinancialReport> =>
    repository.getFinancial({
      from: params.from ? new Date(params.from) : undefined,
      to: params.to ? endOfDay(params.to) : undefined,
      storeId: params.storeId,
    }),
})

```



> **reports.drizzle.repository.ts — agregaciones SQL**  
> Ruta: `backend-fastify/src/modules/reports/infrastructure/reports.drizzle.repository.ts`  
>
```typescript
import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { batch, client, medicine, purchase, sale, saleItem, users } from "@/db/schema";
import { db } from "@/index";
import type { IReportRepository } from "../domain/reports.interface";
import type { IDashboardReport, IFinancialReport } from "../domain/reports.types";

const EXPIRATION_ALERT_DAYS = 60; // settings table not available yet (Feature 11)

const dateKey = (date: Date) => date.toISOString().slice(0, 10);

export const ReportRepository: IReportRepository = {
  async getDashboard(storeId: string): Promise<IDashboardReport> {
    const now = new Date();
    const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
    const start30 = new Date(now); start30.setDate(start30.getDate() - 29); start30.setHours(0, 0, 0, 0);
    const startWeek = new Date(now); startWeek.setDate(startWeek.getDate() - 6); startWeek.setHours(0, 0, 0, 0);
    const expirationLimit = new Date(now); expirationLimit.setDate(expirationLimit.getDate() + EXPIRATION_ALERT_DAYS);

    const saleConditions = (from?: Date, to?: Date) =>
      and(eq(sale.storeId, storeId), eq(sale.status, "completada"), from ? gte(sale.createdAt, from) : undefined, to ? lte(sale.createdAt, to) : undefined);

    const [todayRows, recentRows, last30Rows, weekRows, medicineRows, batchRows] = await Promise.all([
      db.select().from(sale).where(saleConditions(startToday)),
      db
        .select({ sale, user: users, client })
        .from(sale)
        .leftJoin(users, eq(sale.userId, users.id))
        .leftJoin(client, eq(sale.clientId, client.id))
        .where(eq(sale.storeId, storeId))
        .orderBy(sql`${sale.createdAt} desc`)
        .limit(8),
      db.select({ createdAt: sale.createdAt, total: sale.total }).from(sale).where(saleConditions(start30)),
      db.select().from(sale).where(saleConditions(startWeek)),
      db
        .select({ stock: medicine.stock, lowStockThreshold: medicine.lowStockThreshold })
        .from(medicine)
        .where(and(eq(medicine.storeId, storeId), eq(medicine.active, true), sql`${medicine.deletedAt} is null`)),
      db.select({ expiryDate: batch.expiryDate }).from(batch).where(eq(batch.storeId, storeId)),
    ]);

    const revenue = todayRows.reduce((sum, sale) => sum + Number(sale.total), 0);

    const [todayItemCounts] = await db
      .select({ total: sql<number>`COALESCE(SUM(${saleItem.quantity}), 0)::int` })
      .from(saleItem)
      .where(todayRows.length ? inArray(saleItem.saleId, todayRows.map((sale) => sale.id)) : sql`false`);
    const totalItemsSold = todayItemCounts?.total ?? 0;

    const paymentMap = new Map<string, { count: number; total: number }>();
    for (const sale of todayRows) {
      const current = paymentMap.get(sale.paymentMethod) ?? { count: 0, total: 0 };
      current.count++;
      current.total += Number(sale.total);
      paymentMap.set(sale.paymentMethod, current);
    }

    const topMap = new Map<string, { medicine_name: string; quantity: number; revenue: number }>();
    const weekItems = weekRows.length
      ? await db.select().from(saleItem).where(inArray(saleItem.saleId, weekRows.map((sale) => sale.id)))
      : [];
    for (const item of weekItems) {
      const current = topMap.get(item.medicineId) ?? { medicine_name: item.medicineName, quantity: 0, revenue: 0 };
      current.quantity += item.quantity;
      current.revenue += Number(item.lineTotal);
      topMap.set(item.medicineId, current);
    }

    const revenueMap = new Map<string, number>();
    for (const sale of last30Rows) revenueMap.set(dateKey(sale.createdAt), (revenueMap.get(dateKey(sale.createdAt)) ?? 0) + Number(sale.total));

    return {
      today: {
        revenue,
        sales_count: todayRows.length,
        average_ticket: todayRows.length ? revenue / todayRows.length : 0,
        items_sold: totalItemsSold,
      },
      low_stock_count: medicineRows.filter((medicine) => medicine.stock > 0 && medicine.stock <= medicine.lowStockThreshold).length,
      out_of_stock_count: medicineRows.filter((medicine) => medicine.stock === 0).length,
      expiring_soon_count: batchRows.filter((batch) => batch.expiryDate > now && batch.expiryDate <= expirationLimit).length,
      expired_count: batchRows.filter((batch) => batch.expiryDate <= now).length,
      revenue_30d: Array.from({ length: 30 }, (_, index) => {
        const date = new Date(start30);
        date.setDate(start30.getDate() + index);
        const period = dateKey(date);
        return { period, revenue: revenueMap.get(period) ?? 0 };
      }),
      sales_by_payment: [...paymentMap.entries()].map(([method, value]) => ({ method, ...value })),
      top_products_week: [...topMap.entries()]
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 10)
        .map(([medicine_id, value]) => ({ medicine_id, ...value })),
      recent_sales: recentRows.map((row) => ({
        id: row.sale.id,
        subtotal: Number(row.sale.subtotal),
        total: Number(row.sale.total),
        payment_method: row.sale.paymentMethod,
        status: row.sale.status,
        user_id: row.sale.userId,
        user_name: row.sale.userName ?? row.user?.name ?? null,
        client_id: row.sale.clientId ?? null,
        client_name: row.client?.fullName ?? null,
        prescription_id: row.sale.prescriptionId ?? null,
        created_at: row.sale.createdAt.toISOString(),
        updated_at: row.sale.updatedAt.toISOString(),
      })),
    };
  },

  async getFinancial(params): Promise<IFinancialReport> {
    const saleConditions = and(
      eq(sale.storeId, params.storeId),
      eq(sale.status, "completada"),
      params.from ? gte(sale.createdAt, params.from) : undefined,
      params.to ? lte(sale.createdAt, params.to) : undefined,
    );

    const [sales, purchases] = await Promise.all([
      db
        .select({ sale, item: saleItem, medicine })
        .from(sale)
        .innerJoin(saleItem, eq(saleItem.saleId, sale.id))
        .innerJoin(medicine, eq(saleItem.medicineId, medicine.id))
        .where(saleConditions),
      db
        .select({ createdAt: purchase.createdAt, total: purchase.total })
        .from(purchase)
        .where(and(
          eq(purchase.storeId, params.storeId),
          eq(purchase.status, "recibida"),
          params.from ? gte(purchase.createdAt, params.from) : undefined,
          params.to ? lte(purchase.createdAt, params.to) : undefined,
        )),
    ]);

    const products = new Map<string, { medicine_name: string; quantity: number; revenue: number; profit: number }>();
    const labs = new Map<string, { revenue: number; profit: number }>();
    let revenue = 0;
    let cost = 0;

    for (const row of sales) {
      const lineRevenue = Number(row.item.lineTotal);
      const lineCost = Number(row.medicine.purchasePrice) * row.item.quantity;
      revenue += lineRevenue;
      cost += lineCost;
      const product = products.get(row.item.medicineId) ?? { medicine_name: row.item.medicineName, quantity: 0, revenue: 0, profit: 0 };
      product.quantity += row.item.quantity;
      product.revenue += lineRevenue;
      product.profit += lineRevenue - lineCost;
      products.set(row.item.medicineId, product);
      const laboratory = row.medicine.laboratory || "Sin laboratorio";
      const lab = labs.get(laboratory) ?? { revenue: 0, profit: 0 };
      lab.revenue += lineRevenue;
      lab.profit += lineRevenue - lineCost;
      labs.set(laboratory, lab);
    }

    const flow = new Map<string, { revenue: number; purchases: number }>();
    for (const row of sales) {
      const key = dateKey(row.sale.createdAt);
      const current = flow.get(key) ?? { revenue: 0, purchases: 0 };
      current.revenue += Number(row.item.lineTotal);
      flow.set(key, current);
    }
    for (const purchase of purchases) {
      const key = dateKey(purchase.createdAt);
      const current = flow.get(key) ?? { revenue: 0, purchases: 0 };
      current.purchases += Number(purchase.total);
      flow.set(key, current);
    }

    return {
      total_revenue: revenue,
      total_cost: cost,
      total_profit: revenue - cost,
      profit_margin: revenue ? ((revenue - cost) / revenue) * 100 : 0,
      by_product: [...products.entries()]
        .sort((a, b) => b[1].profit - a[1].profit)
        .map(([medicine_id, value]) => ({ medicine_id, ...value })),
      by_laboratory: [...labs.entries()]
        .sort((a, b) => b[1].profit - a[1].profit)
        .map(([laboratory, value]) => ({ laboratory, ...value })),
      cash_flow: [...flow.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, value]) => ({ period, ...value })),
    };
  },
};

```



> **reports.dto.ts**  
> Ruta: `backend-fastify/src/modules/reports/presentation/reports.dto.ts`  
>
```typescript
import { z } from "zod"

const validDate = z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date")

export const FinancialReportQuerySchema = z.object({
  from: validDate.optional(),
  to: validDate.optional(),
}).superRefine((value, ctx) => {
  if (value.from && value.to && new Date(value.from) > new Date(value.to)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["to"], message: "End date must be after or equal to start date" })
  }
})

```



> **reports.controller.ts**  
> Ruta: `backend-fastify/src/modules/reports/presentation/reports.controller.ts`  
>
```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { createReportService } from "../application/reports.service"
import { ReportRepository } from "../infrastructure/reports.drizzle.repository"
import { FinancialReportQuerySchema } from "./reports.dto"

const service = createReportService(ReportRepository)

export const reportsController = {
  dashboard: async (request: FastifyRequest, reply: FastifyReply) =>
    reply.send(await service.dashboard(request.storeId!)),

  financial: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = FinancialReportQuerySchema.parse(request.query)
    return reply.send(await service.financial({ ...query, storeId: request.storeId! }))
  },
}

```



> **reports.routes.ts**  
> Ruta: `backend-fastify/src/modules/reports/presentation/reports.routes.ts`  
>
```typescript
import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { reportsController } from "./reports.controller"
import { authGuard, storeGuard } from "@/modules/auth/application/common/auth.guard"

export const reportsRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  const preHandler = [authGuard, storeGuard]

  fastify.get("/dashboard", { preHandler }, reportsController.dashboard)
  fastify.get("/financial", { preHandler }, reportsController.financial)
}

```


### 23.3 Detalles clave

- **`getDashboard(storeId)`**: KPIs de hoy + alertas de inventario + top semanal + ventas por método de pago + últimos 30 días.
- **`getFinancial({ from, to, storeId })`**: suma ingresos (`SUM(total)`), costo (`SUM(totalCost)`), ganancia, margen; desglose por producto y por laboratorio; flujo de caja diario (ventas efectivo vs otros métodos).
- Manejan `numeric` de Postgres → `number` con `Number(...)` en los mappers del repo.

## 25. Módulo printers

**Propósito:** gestión de impresoras de tickets (térmicas ESC/POS) y **trabajos de impresión en tiempo real vía TCP**. CRUD de impresoras (tipo de conexión, perfil ESC/POS), probar impresora (prueba de codepage), imprimir ticket de venta/factura, y envío manual de datos TCP al puerto 9100 de la impresora.

### 24.1 Archivos del módulo

| Archivo | Rol |
|---|---|
| `domain/printers.types.ts` | Tipos: `PrinterConnectionType`, `PrinterProfile`, `PrinterStatus`, `PrinterDTO` |
| `domain/printers.entities.ts` | Entidades `PrinterEntity`, `PrinterAssignmentEntity`, `PrintJobEntity` |
| `domain/printers.interface.ts` | Contrato `IPrinterRepository` |
| `application/printers.service.ts` | CRUD + impresión (orquestra encoder + transport TCP) |
| `application/common/printers.mappers.ts` | Entidad → DTO |
| `infrastructure/printers.drizzle.repository.ts` | Repo Drizzle |
| `infrastructure/escpos/encoder.ts` | **Encoder ESC/POS**: mapeo de caracteres (CP850/CP858/CP1252/ISO-8859-1), perfiles (escpos/star), comandos de formato |
| `infrastructure/escpos/transport.tcp.ts` | Transporte TCP: envía bytes al host/puerto de la impresora |
| `presentation/printers.*` | DTO, controller, routes |

### 24.2 Código completo


> **printers.types.ts**  
> Ruta: `backend-fastify/src/modules/printers/domain/printers.types.ts`  
>
```typescript
export type PrinterConnType = "net" | "usb" | "bluetooth"
export type PrinterProfile = "escpos" | "star_line"
export type PrinterActualStatus = "unknown" | "online" | "offline" | "error" | "out_of_paper"
export type PrinterRole = "receipt" | "kitchen" | "both"
export type PrintJobStatus = "pending" | "sent" | "success" | "failed"
export type PrinterCutType = "full" | "partial"

export interface IPrinterResponse {
  id: string
  store_id: string
  name: string
  connection_type: PrinterConnType
  address: string
  port: number | null
  paper_width: number
  profile: PrinterProfile
  codepage: string
  auto_cut: boolean
  cut_type: PrinterCutType | null
  open_cash_drawer: boolean
  default_copies: number
  role: PrinterRole
  is_default: boolean
  is_active: boolean
  last_status: PrinterActualStatus
  last_seen_at: string | null
  created_at: string
  updated_at: string
}

export interface IPrintJobResponse {
  id: string
  printer_id: string
  sale_id: string | null
  status: PrintJobStatus
  attempts: number
  max_attempts: number
  error_msg: string | null
  enqueued_at: string
  sent_at: string | null
  finished_at: string | null
}

```



> **printers.entities.ts**  
> Ruta: `backend-fastify/src/modules/printers/domain/printers.entities.ts`  
>
```typescript
import type {
  PrinterConnType,
  PrinterProfile,
  PrinterActualStatus,
  PrinterRole,
  PrinterCutType,
} from "./printers.types"

export interface IPrinterEntity {
  id: string
  store_id: string
  name: string
  connection_type: PrinterConnType
  address: string
  port: number | null
  paper_width: number
  profile: PrinterProfile
  codepage: string
  auto_cut: boolean
  cut_type: PrinterCutType | null
  open_cash_drawer: boolean
  default_copies: number
  role: PrinterRole
  is_default: boolean
  is_active: boolean
  last_status: PrinterActualStatus
  last_seen_at: Date | null
  created_at: Date
  updated_at: Date
}

export type CreatePrinterData = {
  store_id: string
  name: string
  connection_type: PrinterConnType
  address: string
  port?: number | null
  paper_width: number
  profile: PrinterProfile
  codepage?: string
  auto_cut?: boolean
  cut_type?: PrinterCutType | null
  open_cash_drawer?: boolean
  default_copies?: number
  role: PrinterRole
  is_default?: boolean
  is_active?: boolean
}

export type UpdatePrinterData = {
  name?: string
  connection_type?: PrinterConnType
  address?: string
  port?: number | null
  paper_width?: number
  profile?: PrinterProfile
  codepage?: string
  auto_cut?: boolean
  cut_type?: PrinterCutType | null
  open_cash_drawer?: boolean
  default_copies?: number
  role?: PrinterRole
  is_default?: boolean
  is_active?: boolean
}

```



> **printers.interface.ts**  
> Ruta: `backend-fastify/src/modules/printers/domain/printers.interface.ts`  
>
```typescript
import type { PrinterRole } from "./printers.types"
import type { IPrinterEntity, CreatePrinterData, UpdatePrinterData } from "./printers.entities"

export interface IPrinterRepository {
  findByStore(storeId: string): Promise<IPrinterEntity[]>
  findById(id: string, storeId: string): Promise<IPrinterEntity | null>
  findDefault(storeId: string, role: PrinterRole): Promise<IPrinterEntity | null>
  create(data: CreatePrinterData, clearRoles?: PrinterRole[]): Promise<IPrinterEntity>
  update(id: string, storeId: string, data: UpdatePrinterData, clearRoles?: PrinterRole[]): Promise<IPrinterEntity>
  setDefault(id: string, storeId: string, clearRoles: PrinterRole[]): Promise<IPrinterEntity>
  softDelete(id: string, storeId: string): Promise<IPrinterEntity>
  existsByName(storeId: string, name: string, exceptId?: string): Promise<boolean>
  updateStatus(id: string, storeId: string, status: string): Promise<void>
  createJob(data: { printerId: string; saleId?: string | null; payload: Uint8Array }): Promise<string>
  updateJobStatus(id: string, status: string, error?: string): Promise<void>
  findSaleWithItems(saleId: string, storeId: string): Promise<{ id: string; user_name: string | null; created_at: Date; subtotal: number; total: number; payment_method: string; amount_received: number | null; change_given: number | null; items: { medicine_name: string; quantity: number; line_total: number }[] } | null>
}

```



> **printers.service.ts**  
> Ruta: `backend-fastify/src/modules/printers/application/printers.service.ts`  
>
```typescript
import { BadRequestError, ConflictError, NotFoundError } from "@/core/errors/AppError"
import type { IPrinterRepository } from "../domain/printers.interface"
import type { IPrinterResponse, PrinterRole } from "../domain/printers.types"
import type { CreatePrinterData, UpdatePrinterData } from "../domain/printers.entities"
import type { CreatePrinterDto, UpdatePrinterDto } from "../presentation/printers.dto"
import { mapPrinterToResponse } from "./common/printers.mappers"
import { duplicateForCopies, renderCodepageProbe, renderSaleReceipt, renderTestTicket, resolveCurrencySymbol } from "../infrastructure/escpos/encoder"
import { sendBytesViaTCP } from "../infrastructure/escpos/transport.tcp"
import type { SaleReceiptItem } from "../infrastructure/escpos/encoder"

function rolesToClear(role: PrinterRole): PrinterRole[] {
  if (role === "both") return ["receipt", "kitchen", "both"]
  return [role]
}

export const createPrintersService = (repository: IPrinterRepository) => ({
  list: async (storeId: string): Promise<IPrinterResponse[]> => {
    const printers = await repository.findByStore(storeId)
    return printers.map(mapPrinterToResponse)
  },

  getById: async (id: string, storeId: string): Promise<IPrinterResponse> => {
    const printer = await repository.findById(id, storeId)
    if (!printer) throw new NotFoundError("Printer not found")
    return mapPrinterToResponse(printer)
  },

  create: async (data: CreatePrinterDto, storeId: string): Promise<IPrinterResponse> => {
    if (data.name.trim().length === 0) throw new BadRequestError("Printer name is required")
    if (await repository.existsByName(storeId, data.name)) {
      throw new ConflictError("A printer with that name already exists in this store")
    }

    const createData: CreatePrinterData = { ...data, store_id: storeId }
    const created = await repository.create(createData, data.is_default === true ? rolesToClear(data.role) : undefined)
    return mapPrinterToResponse(created)
  },

  update: async (id: string, storeId: string, data: UpdatePrinterDto): Promise<IPrinterResponse> => {
    const existing = await repository.findById(id, storeId)
    if (!existing) throw new NotFoundError("Printer not found")

    if (data.name !== undefined && data.name !== existing.name) {
      if (data.name.trim().length === 0) throw new BadRequestError("Printer name is required")
      if (await repository.existsByName(storeId, data.name, id)) {
        throw new ConflictError("A printer with that name already exists in this store")
      }
    }

    const newRole = data.role ?? existing.role
    const updated = await repository.update(
      id,
      storeId,
      data as UpdatePrinterData,
      data.is_default === true ? rolesToClear(newRole) : undefined,
    )
    return mapPrinterToResponse(updated)
  },

  delete: async (id: string, storeId: string): Promise<void> => {
    const existing = await repository.findById(id, storeId)
    if (!existing) throw new NotFoundError("Printer not found")

    const sameRoleOthers = (await repository.findByStore(storeId)).filter(
      (p) => p.role === existing.role && p.id !== existing.id && p.is_active,
    )
    if (sameRoleOthers.length === 0) {
      throw new ConflictError(
        `This is the only active printer for role '${existing.role}'. Add another before deleting this one.`,
      )
    }
    if (existing.is_default) {
      throw new ConflictError(
        `This is the default printer for role '${existing.role}'. Set another as default before deleting it.`,
      )
    }

    await repository.softDelete(id, storeId)
  },

  setAsDefault: async (id: string, storeId: string, role: PrinterRole): Promise<IPrinterResponse> => {
    const existing = await repository.findById(id, storeId)
    if (!existing) throw new NotFoundError("Printer not found")

    if (existing.role !== "both" && existing.role !== role) {
      throw new BadRequestError(
        `Printer role is '${existing.role}' and cannot be default for role '${role}'`,
      )
    }

    const clearRoles: PrinterRole[] =
      role === "both"
        ? ["receipt", "kitchen", "both"]
        : role === "receipt"
          ? ["receipt", "both"]
          : ["kitchen", "both"]

    const updated = await repository.setDefault(id, storeId, clearRoles)
    return mapPrinterToResponse(updated)
  },

  testPrint: async (id: string, storeId: string, copies: number) => {
    const printer = await repository.findById(id, storeId)
    if (!printer) throw new NotFoundError("Printer not found")
    if (printer.connection_type !== "net") {
      throw new BadRequestError(
        `Only TCP network printers are supported for now. This printer is type '${printer.connection_type}'.`,
      )
    }
    if (!printer.address || !printer.port) {
      throw new BadRequestError("Printer has no IP or port configured")
    }

    const ticket = renderTestTicket({
      paper_width: printer.paper_width === 58 ? 58 : 80,
      profile: printer.profile,
      codepage: printer.codepage,
      open_cash_drawer: printer.open_cash_drawer,
      cut_type: printer.cut_type,
      copies,
      store_name: "POS System",
    })
    const allBytes = duplicateForCopies(ticket, copies)
    const ticketBase64 = Buffer.from(allBytes).toString("base64")

    return {
      success: true,
      ticket_base64: ticketBase64,
      ticket_bytes: allBytes.length,
      printer: {
        id: printer.id,
        name: printer.name,
        address: printer.address,
        port: printer.port,
        paper_width: printer.paper_width,
        profile: printer.profile,
        codepage: printer.codepage,
      },
    }
  },

  probePrint: async (id: string, storeId: string) => {
    const printer = await repository.findById(id, storeId)
    if (!printer) throw new NotFoundError("Printer not found")
    if (printer.connection_type !== "net") {
      throw new BadRequestError(
        `Only TCP network printers are supported for now. This printer is type '${printer.connection_type}'.`,
      )
    }
    if (!printer.address || !printer.port) {
      throw new BadRequestError("Printer has no IP or port configured")
    }

    const bytes = renderCodepageProbe()
    const ticketBase64 = Buffer.from(bytes).toString("base64")

    return {
      success: true,
      ticket_base64: ticketBase64,
      ticket_bytes: bytes.length,
      printer: {
        id: printer.id,
        name: printer.name,
        address: printer.address,
        port: printer.port,
        paper_width: printer.paper_width,
        profile: printer.profile,
        codepage: printer.codepage,
      },
      indices_tested: Array.from({ length: 41 }, (_, i) => i),
      hint: "Look for the line where 'ñ á é í ó ú' renders correctly. That index is the right codepage for your printer.",
    }
  },

  sendTcp: async (ticketBase64: string, address: string, port: number) => {
    const bytes = Buffer.from(ticketBase64, "base64")
    return await sendBytesViaTCP(address, port, bytes)
  },

  printReceipt: async (id: string, storeId: string, saleId: string, copies: number, currency: string = "NIO") => {
    const printer = await repository.findById(id, storeId)
    if (!printer) throw new NotFoundError("Printer not found")
    if (printer.connection_type !== "net") {
      throw new BadRequestError(
        `Only TCP network printers are supported for now. This printer is type '${printer.connection_type}'.`,
      )
    }
    if (!printer.address || !printer.port) {
      throw new BadRequestError("Printer has no IP or port configured")
    }

    const sale = await repository.findSaleWithItems(saleId, storeId)
    if (!sale) throw new NotFoundError("Sale not found")

    const items: SaleReceiptItem[] = sale.items.map((i) => ({
      product_name: i.medicine_name,
      quantity: i.quantity,
      line_total: i.line_total,
    }))

    const ticket = renderSaleReceipt(
      {
        paper_width: printer.paper_width === 58 ? 58 : 80,
        profile: printer.profile,
        codepage: printer.codepage,
        open_cash_drawer: printer.open_cash_drawer,
        cut_type: printer.cut_type as "full" | "partial" | null,
      },
      {
        store_name: "Mi Negocio",
        store_address: null,
        store_phone: null,
        ticket_footer: null,
        sale_id: sale.id,
        user_name: sale.user_name ?? "",
        created_at: sale.created_at,
        subtotal: sale.subtotal,
        total: sale.total,
        payment_method: sale.payment_method,
        amount_received: sale.amount_received,
        change_given: sale.change_given,
        currency_symbol: resolveCurrencySymbol(currency),
        items,
      }
    )

    const allBytes = duplicateForCopies(ticket, copies)
    const ticketBase64 = Buffer.from(allBytes).toString("base64")

    const jobId = await repository.createJob({
      printerId: printer.id,
      saleId: sale.id,
      payload: allBytes,
    })

    const result = await sendBytesViaTCP(printer.address, printer.port, allBytes)
    if (result.success) {
      await repository.updateJobStatus(jobId, "success")
      await repository.updateStatus(printer.id, storeId, "online")
    } else {
      await repository.updateJobStatus(jobId, "failed", result.error)
      await repository.updateStatus(printer.id, storeId, "offline")
    }

    return {
      success: result.success,
      job_id: jobId,
      ticket_base64: ticketBase64,
      ticket_bytes: allBytes.length,
      send_result: result,
      printer: {
        id: printer.id,
        name: printer.name,
        address: printer.address,
        port: printer.port,
        paper_width: printer.paper_width,
        profile: printer.profile,
        codepage: printer.codepage,
      },
    }
  },
})

```



> **printers.mappers.ts**  
> Ruta: `backend-fastify/src/modules/printers/application/common/printers.mappers.ts`  
>
```typescript
import type { IPrinterEntity } from "../../domain/printers.entities"
import type { IPrinterResponse } from "../../domain/printers.types"

export function mapPrinterToResponse(entity: IPrinterEntity): IPrinterResponse {
  return {
    id: entity.id,
    store_id: entity.store_id,
    name: entity.name,
    connection_type: entity.connection_type,
    address: entity.address,
    port: entity.port,
    paper_width: entity.paper_width,
    profile: entity.profile,
    codepage: entity.codepage,
    auto_cut: entity.auto_cut,
    cut_type: entity.cut_type,
    open_cash_drawer: entity.open_cash_drawer,
    default_copies: entity.default_copies,
    role: entity.role,
    is_default: entity.is_default,
    is_active: entity.is_active,
    last_status: entity.last_status,
    last_seen_at: entity.last_seen_at instanceof Date ? entity.last_seen_at.toISOString() : entity.last_seen_at,
    created_at: entity.created_at instanceof Date ? entity.created_at.toISOString() : entity.created_at,
    updated_at: entity.updated_at instanceof Date ? entity.updated_at.toISOString() : entity.updated_at,
  }
}

```



> **printers.drizzle.repository.ts**  
> Ruta: `backend-fastify/src/modules/printers/infrastructure/printers.drizzle.repository.ts`  
>
```typescript
import { randomUUID } from "node:crypto";
import { and, asc, count, desc, eq, isNull, ne, sql } from "drizzle-orm";
import { printer, printJob, sale, saleItem } from "@/db/schema";
import { db } from "@/index";
import { NotFoundError } from "@/core/errors/AppError";
import type { IPrinterRepository } from "../domain/printers.interface";
import type { IPrinterEntity, CreatePrinterData, UpdatePrinterData } from "../domain/printers.entities";
import type {
  PrinterConnType,
  PrinterProfile,
  PrinterActualStatus,
  PrinterRole,
  PrinterCutType,
} from "../domain/printers.types";

type PrinterRow = typeof printer.$inferSelect;

function mapPrinter(row: PrinterRow): IPrinterEntity {
  return {
    id: row.id,
    store_id: row.storeId,
    name: row.name,
    connection_type: row.connectionType as PrinterConnType,
    address: row.address,
    port: row.port,
    paper_width: row.paperWidth,
    profile: row.profile as PrinterProfile,
    codepage: row.codepage,
    auto_cut: row.autoCut,
    cut_type: row.cutType as PrinterCutType | null,
    open_cash_drawer: row.openCashDrawer,
    default_copies: row.defaultCopies,
    role: row.role as PrinterRole,
    is_default: row.isDefault,
    is_active: row.isActive,
    last_status: row.lastStatus as PrinterActualStatus,
    last_seen_at: row.lastSeenAt,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

export const PrinterRepository: IPrinterRepository = {
  async findByStore(storeId: string): Promise<IPrinterEntity[]> {
    const rows = await db
      .select()
      .from(printer)
      .where(and(eq(printer.storeId, storeId), isNull(printer.deletedAt)))
      .orderBy(desc(printer.isDefault), asc(printer.name));
    return rows.map(mapPrinter);
  },

  async findById(id, storeId) {
    const [row] = await db
      .select()
      .from(printer)
      .where(and(eq(printer.id, id), eq(printer.storeId, storeId), isNull(printer.deletedAt)))
      .limit(1);
    return row ? mapPrinter(row) : null;
  },

  async findDefault(storeId, role) {
    const [row] = await db
      .select()
      .from(printer)
      .where(and(
        eq(printer.storeId, storeId),
        eq(printer.role, role),
        eq(printer.isDefault, true),
        eq(printer.isActive, true),
        isNull(printer.deletedAt),
      ))
      .limit(1);
    return row ? mapPrinter(row) : null;
  },

  async create(data: CreatePrinterData, clearRoles?: PrinterRole[]): Promise<IPrinterEntity> {
    return db.transaction(async (tx) => {
      if (clearRoles?.length) {
        for (const role of clearRoles) {
          await tx
            .update(printer)
            .set({ isDefault: false })
            .where(and(eq(printer.storeId, data.store_id), eq(printer.role, role), eq(printer.isDefault, true), isNull(printer.deletedAt)));
        }
      }
      const [row] = await tx
        .insert(printer)
        .values({
          id: randomUUID(),
          storeId: data.store_id,
          name: data.name,
          connectionType: data.connection_type,
          address: data.address,
          port: data.port ?? null,
          paperWidth: data.paper_width,
          profile: data.profile,
          codepage: data.codepage ?? "ISO-8859-1",
          autoCut: data.auto_cut ?? true,
          cutType: data.cut_type ?? null,
          openCashDrawer: data.open_cash_drawer ?? false,
          defaultCopies: data.default_copies ?? 1,
          role: data.role,
          isDefault: data.is_default ?? false,
          isActive: data.is_active ?? true,
        })
        .returning();
      return mapPrinter(row);
    });
  },

  async update(id, storeId, data: UpdatePrinterData, clearRoles?: PrinterRole[]): Promise<IPrinterEntity> {
    return db.transaction(async (tx) => {
      if (clearRoles?.length) {
        for (const role of clearRoles) {
          await tx
            .update(printer)
            .set({ isDefault: false })
            .where(and(eq(printer.storeId, storeId), eq(printer.role, role), eq(printer.isDefault, true), ne(printer.id, id), isNull(printer.deletedAt)));
        }
      }
      const [row] = await tx
        .update(printer)
        .set({
          ...(data.name !== undefined && { name: data.name }),
          ...(data.connection_type !== undefined && { connectionType: data.connection_type }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.port !== undefined && { port: data.port }),
          ...(data.paper_width !== undefined && { paperWidth: data.paper_width }),
          ...(data.profile !== undefined && { profile: data.profile }),
          ...(data.codepage !== undefined && { codepage: data.codepage }),
          ...(data.auto_cut !== undefined && { autoCut: data.auto_cut }),
          ...(data.cut_type !== undefined && { cutType: data.cut_type }),
          ...(data.open_cash_drawer !== undefined && { openCashDrawer: data.open_cash_drawer }),
          ...(data.default_copies !== undefined && { defaultCopies: data.default_copies }),
          ...(data.role !== undefined && { role: data.role }),
          ...(data.is_default !== undefined && { isDefault: data.is_default }),
          ...(data.is_active !== undefined && { isActive: data.is_active }),
        })
        .where(and(eq(printer.id, id), eq(printer.storeId, storeId), isNull(printer.deletedAt)))
        .returning();
      if (!row) throw new NotFoundError("Printer not found");
      return mapPrinter(row);
    });
  },

  async setDefault(id, storeId, clearRoles: PrinterRole[]): Promise<IPrinterEntity> {
    return db.transaction(async (tx) => {
      for (const role of clearRoles) {
        await tx
          .update(printer)
          .set({ isDefault: false })
          .where(and(eq(printer.storeId, storeId), eq(printer.role, role), eq(printer.isDefault, true), ne(printer.id, id), isNull(printer.deletedAt)));
      }
      const [row] = await tx
        .update(printer)
        .set({ isDefault: true })
        .where(and(eq(printer.id, id), eq(printer.storeId, storeId), isNull(printer.deletedAt)))
        .returning();
      if (!row) throw new NotFoundError("Printer not found");
      return mapPrinter(row);
    });
  },

  async softDelete(id, storeId): Promise<IPrinterEntity> {
    const [row] = await db
      .update(printer)
      .set({ deletedAt: new Date(), isActive: false })
      .where(and(eq(printer.id, id), eq(printer.storeId, storeId), isNull(printer.deletedAt)))
      .returning();
    if (!row) throw new NotFoundError("Printer not found");
    return mapPrinter(row);
  },

  async existsByName(storeId, name, exceptId?) {
    const conditions = [eq(printer.storeId, storeId), eq(printer.name, name), isNull(printer.deletedAt)];
    if (exceptId) conditions.push(ne(printer.id, exceptId));
    const [row] = await db
      .select({ total: count() })
      .from(printer)
      .where(and(...conditions));
    return (row?.total ?? 0) > 0;
  },

  async updateStatus(id, storeId, status) {
    await db
      .update(printer)
      .set({ lastStatus: status as PrinterActualStatus, lastSeenAt: new Date() })
      .where(and(eq(printer.id, id), eq(printer.storeId, storeId)));
  },

  async createJob(data: { printerId: string; saleId?: string | null; payload: Uint8Array }): Promise<string> {
    const [row] = await db
      .insert(printJob)
      .values({
        id: randomUUID(),
        printerId: data.printerId,
        saleId: data.saleId ?? null,
        payload: sql`${Buffer.from(data.payload)}::bytea`,
        status: "pending",
        attempts: 0,
        maxAttempts: 3,
      })
      .returning({ id: printJob.id });
    return row.id;
  },

  async updateJobStatus(id: string, status: string, error?: string): Promise<void> {
    const now = new Date();
    await db
      .update(printJob)
      .set({
        status,
        attempts: sql`${printJob.attempts} + 1`,
        errorMsg: error ?? null,
        sentAt: status === "sent" || status === "success" ? now : printJob.sentAt,
        finishedAt: status === "success" || status === "failed" ? now : null,
      })
      .where(eq(printJob.id, id));
  },

  async findSaleWithItems(saleId, storeId) {
    const [row] = await db
      .select()
      .from(sale)
      .where(and(eq(sale.id, saleId), eq(sale.storeId, storeId)))
      .limit(1);
    if (!row) return null;
    const items = await db.select().from(saleItem).where(eq(saleItem.saleId, saleId));
    return {
      id: row.id,
      user_name: row.userName ?? null,
      created_at: row.createdAt,
      subtotal: Number(row.subtotal),
      total: Number(row.total),
      payment_method: row.paymentMethod,
      amount_received: row.amountReceived === null ? null : Number(row.amountReceived),
      change_given: row.changeGiven === null ? null : Number(row.changeGiven),
      items: items.map((item) => ({
        medicine_name: item.medicineName,
        quantity: item.quantity,
        line_total: Number(item.lineTotal),
      })),
    };
  },
};

```



> **encoder.ts — encoder ESC/POS (codepages, perfiles, comandos)**  
> Ruta: `backend-fastify/src/modules/printers/infrastructure/escpos/encoder.ts`  
>
```typescript
const CHAR_MAPS: Record<string, Record<string, number>> = {
  CP850: {
    "á": 0xA0, "é": 0x82, "í": 0xA1, "ó": 0xA2, "ú": 0xA3,
    "Á": 0xB5, "É": 0x90, "Í": 0xD6, "Ó": 0xE0, "Ú": 0xE9,
    "ñ": 0xA4, "Ñ": 0xA5,
    "¿": 0xA8, "¡": 0xAD,
  },
  CP858: {
    "á": 0xA0, "é": 0x82, "í": 0xA1, "ó": 0xA2, "ú": 0xA3,
    "Á": 0xB5, "É": 0x90, "Í": 0xD6, "Ó": 0xE0, "Ú": 0xE9,
    "ñ": 0xA4, "Ñ": 0xA5,
    "¿": 0xA8, "¡": 0xAD,
    "€": 0xD5,
  },
  CP1252: {
    "á": 0xE1, "é": 0xE9, "í": 0xED, "ó": 0xF3, "ú": 0xFA,
    "Á": 0xC1, "É": 0xC9, "Í": 0xCD, "Ó": 0xD3, "Ú": 0xDA,
    "ñ": 0xF1, "Ñ": 0xD1,
    "¿": 0xBF, "¡": 0xA1,
    "€": 0x80,
  },
  "ISO-8859-1": {
    "á": 0xE1, "é": 0xE9, "í": 0xED, "ó": 0xF3, "ú": 0xFA,
    "Á": 0xC1, "É": 0xC9, "Í": 0xCD, "Ó": 0xD3, "Ú": 0xDA,
    "ñ": 0xF1, "Ñ": 0xD1,
    "¿": 0xBF, "¡": 0xA1,
  },
}

const VENDOR_PROFILES: Record<string, Record<string, number>> = {
  escpos: { CP437: 0, CP850: 2, CP1252: 16, CP858: 19, "ISO-8859-1": 16 },
  star_line: { CP437: 0, CP850: 2, CP1252: 32, CP858: 33 },
}

const ESC = 0x1B
const GS = 0x1D

export const CMD = {
  INIT: new Uint8Array([ESC, 0x40]),
  BOLD_ON: new Uint8Array([ESC, 0x45, 0x01]),
  BOLD_OFF: new Uint8Array([ESC, 0x45, 0x00]),
  ALIGN_LEFT: new Uint8Array([ESC, 0x61, 0x00]),
  ALIGN_CENTER: new Uint8Array([ESC, 0x61, 0x01]),
  ALIGN_RIGHT: new Uint8Array([ESC, 0x61, 0x02]),
  CUT_FULL: new Uint8Array([GS, 0x56, 0x00]),
  CUT_PARTIAL: new Uint8Array([GS, 0x56, 0x01]),
  OPEN_DRAWER: new Uint8Array([ESC, 0x70, 0x00, 0x19, 0xFA]),
  LF: new Uint8Array([0x0A]),
}

export interface SelectedEncoders {
  encode: (text: string) => Uint8Array
  codepageCommand: Uint8Array | null
  resolvedProfile: string
  resolvedCodepage: string
}

export function selectProfileEncoders(
  profileName: string = "escpos",
  codepageName: string = "CP850"
): SelectedEncoders {
  const safeProfile = VENDOR_PROFILES[profileName.toLowerCase()] ? profileName.toLowerCase() : "escpos"
  const safeCodepage = CHAR_MAPS[codepageName.toUpperCase()] ? codepageName.toUpperCase() : "CP850"

  const charMap = CHAR_MAPS[safeCodepage]
  const index = VENDOR_PROFILES[safeProfile][safeCodepage]

  const codepageCommand =
    index !== undefined
      ? new Uint8Array([ESC, 0x74, index])
      : null

  const encode = (text: string): Uint8Array => {
    const out = new Uint8Array(text.length)
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      const code = ch.charCodeAt(0)
      if (code < 128) {
        out[i] = code
      } else {
        out[i] = charMap[ch] ?? 0x3F
      }
    }
    return out
  }

  return { encode, codepageCommand, resolvedProfile: safeProfile, resolvedCodepage: safeCodepage }
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  NIO: "C$",
  USD: "$",
  EUR: "€",
  MXN: "$",
}

export function resolveCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? "$"
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, a) => sum + a.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const a of arrays) {
    result.set(a, offset)
    offset += a.length
  }
  return result
}

export interface TestTicketConfig {
  paper_width: 58 | 80
  profile: string
  codepage: string
  open_cash_drawer: boolean
  cut_type: "full" | "partial" | null
  copies: number
  store_name?: string
}

export function renderTestTicket(config: TestTicketConfig): Uint8Array {
  const encoders = selectProfileEncoders(config.profile, config.codepage)
  const enc = encoders.encode

  const chars = config.paper_width === 80 ? 42 : 32
  const sep = "=".repeat(chars)
  const center = (s: string) => {
    const pad = Math.max(0, Math.floor((chars - s.length) / 2))
    return " ".repeat(pad) + s
  }

  const parts: Uint8Array[] = []

  parts.push(CMD.INIT)
  if (encoders.codepageCommand) {
    parts.push(encoders.codepageCommand)
  }

  parts.push(CMD.ALIGN_CENTER)
  parts.push(CMD.BOLD_ON)
  parts.push(enc(center("*** TICKET DE PRUEBA ***") + "\n"))
  parts.push(CMD.BOLD_OFF)
  parts.push(enc("Impresoras POS - prueba\n"))
  if (config.store_name) {
    parts.push(enc(config.store_name + "\n"))
  }
  parts.push(enc(new Date().toLocaleString("es-AR") + "\n"))
  parts.push(enc(encoders.resolvedProfile + ":" + encoders.resolvedCodepage + "\n"))
  parts.push(enc(sep + "\n"))

  parts.push(CMD.ALIGN_LEFT)
  parts.push(CMD.BOLD_ON)
  parts.push(enc("Impresión en negrita\n"))
  parts.push(CMD.BOLD_OFF)
  parts.push(enc("Texto normal\n"))
  parts.push(enc("Caracteres acentuados: ñ á é í ó ú\n"))
  parts.push(enc("Mayúsculas: Ñ Á É Í Ó Ú\n"))
  parts.push(enc("Signos: ¿ ¡\n"))

  parts.push(enc("\n" + sep + "\n"))

  parts.push(CMD.ALIGN_CENTER)
  parts.push(CMD.BOLD_ON)
  parts.push(enc("-- Texto centrado + negrita --\n"))
  parts.push(CMD.BOLD_OFF)
  parts.push(enc("-- Texto centrado normal --\n"))

  parts.push(CMD.ALIGN_LEFT)
  parts.push(enc("\n" + sep + "\n"))
  parts.push(enc("Ancho de papel: " + config.paper_width + "mm\n"))
  parts.push(enc("Vendor profile: " + encoders.resolvedProfile + "\n"))
  parts.push(enc("Codepage activo: " + encoders.resolvedCodepage + "\n"))
  parts.push(enc("Copias enviadas: " + config.copies + "\n"))

  parts.push(CMD.LF)
  parts.push(CMD.LF)
  parts.push(CMD.LF)

  if (config.open_cash_drawer) {
    parts.push(CMD.OPEN_DRAWER)
  }

  if (config.cut_type === "full") {
    parts.push(CMD.CUT_FULL)
  } else if (config.cut_type === "partial") {
    parts.push(CMD.CUT_PARTIAL)
  }

  return concat(...parts)
}

export function renderCodepageProbe(): Uint8Array {
  const parts: Uint8Array[] = []

  const encodeAscii = (s: string): Uint8Array => {
    const out = new Uint8Array(s.length)
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i)
      out[i] = c < 128 ? c : 0x3F
    }
    return out
  }

  parts.push(CMD.INIT)
  parts.push(CMD.ALIGN_LEFT)
  parts.push(CMD.BOLD_ON)
  parts.push(encodeAscii("CODEPAGE PROBE (idx 0..40)\n\n"))
  parts.push(CMD.BOLD_OFF)
  parts.push(encodeAscii("Para cada idx N imprime: ESC t N + muestra ñ á é í ó ú\n"))
  parts.push(encodeAscii("Donde veas todos correctos, ese es tu CP850 index.\n\n"))

  const SAMPLE_BYTES = new Uint8Array([0xF1, 0x20, 0xE1, 0x20, 0xE9, 0x20, 0xED, 0x20, 0xF3, 0x20, 0xFA, 0x0A])

  for (let i = 0; i <= 40; i++) {
    parts.push(CMD.INIT)
    parts.push(new Uint8Array([ESC, 0x74, i]))
    parts.push(encodeAscii(`CP ${i.toString().padStart(2, " ")}: `))
    parts.push(SAMPLE_BYTES)
  }

  parts.push(new Uint8Array([ESC, 0x74, 0x00]))
  parts.push(CMD.LF)
  parts.push(CMD.CUT_PARTIAL)

  return concat(...parts)
}

export function duplicateForCopies(bytes: Uint8Array, copies: number): Uint8Array {
  if (copies <= 1) return bytes
  const result = new Uint8Array(bytes.length * copies)
  for (let i = 0; i < copies; i++) {
    result.set(bytes, i * bytes.length)
  }
  return result
}

export interface SaleReceiptConfig {
  paper_width: 58 | 80
  profile: string
  codepage: string
  open_cash_drawer: boolean
  cut_type: "full" | "partial" | null
}

export interface SaleReceiptItem {
  product_name: string
  quantity: number
  line_total: number
}

export interface SaleReceiptData {
  store_name: string
  store_address: string | null
  store_phone: string | null
  ticket_footer: string | null
  sale_id: string
  user_name: string
  created_at: Date
  subtotal: number
  total: number
  payment_method: string
  amount_received: number | null
  change_given: number | null
  currency_symbol: string
  items: SaleReceiptItem[]
}

export function renderSaleReceipt(config: SaleReceiptConfig, data: SaleReceiptData): Uint8Array {
  const encoders = selectProfileEncoders(config.profile, config.codepage)
  const enc = encoders.encode
  const chars = config.paper_width === 80 ? 42 : 32
  const sep = "=".repeat(chars)
  const dash = "-".repeat(chars)

  const sym = data.currency_symbol || "$"
  const fmt2 = (n: number): string => sym + n.toFixed(2)
  const priceRight = (label: string, price: string, max: number): string => {
    const space = Math.max(1, max - label.length - price.length)
    return label + " ".repeat(space) + price
  }

  const parts: Uint8Array[] = []

  parts.push(CMD.INIT)
  if (encoders.codepageCommand) parts.push(encoders.codepageCommand)

  parts.push(CMD.ALIGN_CENTER)
  parts.push(CMD.BOLD_ON)
  parts.push(enc(data.store_name + "\n"))
  parts.push(CMD.BOLD_OFF)
  if (data.store_address) parts.push(enc(data.store_address + "\n"))
  if (data.store_phone) parts.push(enc(data.store_phone + "\n"))

  const dateStr = data.created_at.toLocaleString("es-AR")
  parts.push(enc(dateStr + "\n"))
  parts.push(enc("Ticket: " + data.sale_id.slice(0, 8) + "\n"))
  parts.push(enc("Atendido por: " + data.user_name + "\n"))

  parts.push(CMD.ALIGN_LEFT)
  parts.push(enc(dash + "\n"))

  for (const item of data.items) {
    const line = `${item.quantity}× ${item.product_name}`
    const price = fmt2(item.line_total)
    const maxNameLen = chars - price.length - 2
    const truncated = line.length > maxNameLen ? line.slice(0, maxNameLen) + ".." : line
    parts.push(enc(truncated + " ".repeat(Math.max(1, chars - truncated.length - price.length)) + price + "\n"))
  }

  parts.push(CMD.ALIGN_LEFT)
  parts.push(enc(dash + "\n"))

  parts.push(enc(priceRight("Subtotal", fmt2(data.subtotal), chars) + "\n"))

  parts.push(CMD.BOLD_ON)
  parts.push(enc(sep + "\n"))
  parts.push(CMD.BOLD_OFF)
  parts.push(CMD.BOLD_ON)
  parts.push(enc(priceRight("TOTAL", fmt2(data.total), chars) + "\n"))
  parts.push(CMD.BOLD_OFF)

  const payLine = `Pago (${data.payment_method})`
  const received = data.amount_received ?? data.total
  parts.push(enc(priceRight(payLine, fmt2(Number(received)), chars) + "\n"))
  if (data.change_given && data.change_given > 0) {
    parts.push(enc(priceRight("Cambio", fmt2(data.change_given), chars) + "\n"))
  }

  parts.push(CMD.ALIGN_LEFT)
  parts.push(enc(dash + "\n"))

  parts.push(CMD.ALIGN_CENTER)
  parts.push(enc((data.ticket_footer || "¡Gracias por su compra!") + "\n"))

  parts.push(CMD.LF)
  parts.push(CMD.LF)

  if (config.open_cash_drawer) parts.push(CMD.OPEN_DRAWER)
  if (config.cut_type === "full") parts.push(CMD.CUT_FULL)
  else if (config.cut_type === "partial") parts.push(CMD.CUT_PARTIAL)

  return concat(...parts)
}

```



> **transport.tcp.ts — envío de bytes por TCP**  
> Ruta: `backend-fastify/src/modules/printers/infrastructure/escpos/transport.tcp.ts`  
>
```typescript
import { createConnection } from "net"

export interface TcpPrintResult {
  success: boolean
  bytes_sent: number
  duration_ms: number
  error?: string
}

export function sendBytesViaTCP(
  host: string,
  port: number,
  bytes: Uint8Array,
  timeoutMs: number = 5000
): Promise<TcpPrintResult> {
  return new Promise((resolve) => {
    const startTime = Date.now()
    const socket = createConnection({ host, port, timeout: timeoutMs })

    let resolved = false
    const finish = (result: TcpPrintResult) => {
      if (resolved) return
      resolved = true
      try { socket.destroy() } catch (_) { /* noop */ }
      resolve(result)
    }

    socket.once("connect", () => {
      socket.write(Buffer.from(bytes), (writeErr) => {
        if (writeErr) {
          finish({
            success: false,
            bytes_sent: 0,
            duration_ms: Date.now() - startTime,
            error: `Write error: ${writeErr.message}`,
          })
          return
        }
        socket.end(() => {
          finish({
            success: true,
            bytes_sent: bytes.length,
            duration_ms: Date.now() - startTime,
          })
        })
      })
    })

    socket.once("error", (err) => {
      finish({
        success: false,
        bytes_sent: 0,
        duration_ms: Date.now() - startTime,
        error: `Connection error: ${err.message}`,
      })
    })

    socket.once("timeout", () => {
      finish({
        success: false,
        bytes_sent: 0,
        duration_ms: Date.now() - startTime,
        error: `Timeout después de ${timeoutMs}ms`,
      })
    })
  })
}

```



> **printers.dto.ts**  
> Ruta: `backend-fastify/src/modules/printers/presentation/printers.dto.ts`  
>
```typescript
import { z } from "zod"

const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d)$/

const baseFields = {
  name: z.string().trim().min(1, "Printer name is required").max(60),
  role: z.enum(["receipt", "kitchen", "both"]),
  paper_width: z.union([z.literal(58), z.literal(80)]),
  profile: z.enum(["escpos", "star_line"]).default("escpos"),
  codepage: z.string().min(1).default("ISO-8859-1"),
  auto_cut: z.boolean().default(true),
  cut_type: z.enum(["full", "partial"]).nullable().optional(),
  open_cash_drawer: z.boolean().default(false),
  default_copies: z.number().int().min(1).max(10).default(1),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
}

const baseObject = z.object(baseFields)

const netVariant = baseObject.extend({
  connection_type: z.literal("net"),
  address: z.string().regex(IPV4_REGEX, "Invalid IP address"),
  port: z.number().int().min(1).max(65535),
})

const usbVariant = baseObject.extend({
  connection_type: z.literal("usb"),
  address: z.string().min(1, "Select a USB device"),
  port: z.null().optional(),
})

const bluetoothVariant = baseObject.extend({
  connection_type: z.literal("bluetooth"),
  address: z.string().min(1, "Select a Bluetooth device"),
  port: z.null().optional(),
})

const crossRules = <T extends z.ZodTypeAny>(schema: T) =>
  schema
    .refine(
      (data: any) => data.open_cash_drawer !== true || data.role === "receipt" || data.role === "both",
      { message: "Cash drawer only applies to role 'receipt' or 'both'", path: ["open_cash_drawer"] }
    )
    .refine(
      (data: any) => data.cut_type == null || data.auto_cut === true,
      { message: "Cut type only applies when auto cut is enabled", path: ["cut_type"] }
    )

export const CreatePrinterDtoSchema = crossRules(
  z.discriminatedUnion("connection_type", [netVariant, usbVariant, bluetoothVariant])
)

export type CreatePrinterDto = z.infer<typeof CreatePrinterDtoSchema>

export const UpdatePrinterDtoSchema = crossRules(
  baseObject.extend({
    connection_type: z.enum(["net", "usb", "bluetooth"]).optional(),
    address: z.string().optional(),
    port: z.number().int().min(1).max(65535).optional().nullable(),
  }).partial(),
)

export type UpdatePrinterDto = z.infer<typeof UpdatePrinterDtoSchema>

export const SetDefaultPrinterDtoSchema = z.object({
  role: z.enum(["receipt", "kitchen", "both"]),
})

export type SetDefaultPrinterDto = z.infer<typeof SetDefaultPrinterDtoSchema>

export const TestPrintDtoSchema = z.object({
  copies: z.number().int().min(1).max(5).optional().default(1),
})

export type TestPrintDto = z.infer<typeof TestPrintDtoSchema>

export const PrintReceiptDtoSchema = z.object({
  sale_id: z.string().uuid("Invalid sale ID"),
  copies: z.number().int().min(1).max(5).optional().default(1),
  currency: z.string().optional().default("NIO"),
})

export type PrintReceiptDto = z.infer<typeof PrintReceiptDtoSchema>

export const SendTcpDtoSchema = z.object({
  ticket_base64: z.string().min(1, "Ticket data is required"),
  address: z.string().min(1, "IP address is required"),
  port: z.number().int().min(1).max(65535),
})

export type SendTcpDto = z.infer<typeof SendTcpDtoSchema>

export const PrinterIdParamSchema = z.object({
  id: z.string().uuid("Invalid printer ID"),
})

export type PrinterIdParam = z.infer<typeof PrinterIdParamSchema>

```



> **printers.controller.ts**  
> Ruta: `backend-fastify/src/modules/printers/presentation/printers.controller.ts`  
>
```typescript
import { FastifyReply, FastifyRequest } from "fastify";
import { createPrintersService } from "../application/printers.service";
import { PrinterRepository } from "../infrastructure/printers.drizzle.repository";
import { CreatePrinterDtoSchema, PrinterIdParamSchema, PrintReceiptDtoSchema, SetDefaultPrinterDtoSchema, SendTcpDtoSchema, TestPrintDtoSchema, UpdatePrinterDtoSchema } from "./printers.dto";

const printersService = createPrintersService(PrinterRepository)

export const printersController = {
  list: async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await printersService.list(request.storeId as string)
    return reply.status(200).send({ printers: result })
  },

  getById: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = PrinterIdParamSchema.parse(request.params)
    const result = await printersService.getById(id, request.storeId as string)
    return reply.status(200).send(result)
  },

  create: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = CreatePrinterDtoSchema.parse(request.body)
    const result = await printersService.create(data, request.storeId as string)
    return reply.status(201).send(result)
  },

  update: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = PrinterIdParamSchema.parse(request.params)
    const data = UpdatePrinterDtoSchema.parse(request.body)
    const result = await printersService.update(id, request.storeId as string, data)
    return reply.status(200).send(result)
  },

  delete: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = PrinterIdParamSchema.parse(request.params)
    await printersService.delete(id, request.storeId as string)
    return reply.status(200).send({ message: "Printer deleted successfully" })
  },

  setAsDefault: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = PrinterIdParamSchema.parse(request.params)
    const { role } = SetDefaultPrinterDtoSchema.parse(request.body)
    const result = await printersService.setAsDefault(id, request.storeId as string, role)
    return reply.status(200).send(result)
  },

  testPrint: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = PrinterIdParamSchema.parse(request.params)
    const body = TestPrintDtoSchema.parse(request.body ?? {})
    const result = await printersService.testPrint(id, request.storeId as string, body.copies)
    return reply.status(200).send({
      message: "Test ticket generated successfully",
      ...result,
    })
  },

  probePrint: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = PrinterIdParamSchema.parse(request.params)
    const result = await printersService.probePrint(id, request.storeId as string)
    return reply.status(200).send({
      message: "Probe generated. Send the ticket from the device to identify the right codepage.",
      ...result,
    })
  },

  sendTcp: async (request: FastifyRequest, reply: FastifyReply) => {
    const body = SendTcpDtoSchema.parse(request.body)
    const result = await printersService.sendTcp(body.ticket_base64, body.address, body.port)

    if (!result.success) {
      return reply.status(502).send({
        message: "Could not reach the printer from the server",
        ...result,
      })
    }

    return reply.status(200).send({
      message: "Data sent to the printer successfully",
      ...result,
    })
  },

  printReceipt: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = PrinterIdParamSchema.parse(request.params)
    const { sale_id, copies, currency } = PrintReceiptDtoSchema.parse(request.body)
    const result = await printersService.printReceipt(id, request.storeId as string, sale_id, copies, currency)
    return reply.status(200).send({
      message: "Ticket generated successfully",
      ...result,
    })
  }
}

```



> **printers.routes.ts**  
> Ruta: `backend-fastify/src/modules/printers/presentation/printers.routes.ts`  
>
```typescript
import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { printersController } from "./printers.controller"
import { authGuard, storeGuard } from "@/modules/auth/application/common/auth.guard"

export const printersRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  const preHandler = [authGuard, storeGuard]

  fastify.get("/", { preHandler }, printersController.list)
  fastify.post("/", { preHandler }, printersController.create)
  fastify.post("/:id/test", { preHandler }, printersController.testPrint)
  fastify.post("/:id/probe", { preHandler }, printersController.probePrint)
  fastify.post("/send-tcp", { preHandler }, printersController.sendTcp)
  fastify.post("/:id/print-receipt", { preHandler }, printersController.printReceipt)
  fastify.post("/:id/set-default", { preHandler }, printersController.setAsDefault)
  fastify.get("/:id", { preHandler }, printersController.getById)
  fastify.patch("/:id", { preHandler }, printersController.update)
  fastify.delete("/:id", { preHandler }, printersController.delete)
}

```


### 24.3 Detalles clave

- **ESC/POS**: el encoder genera secuencias de bytes de impresora térmica: inicialización, negrita, alineación, corte de papel, apertura de cajón, caracteres extendidos (tildes/ñ) según el codepage de la impresora (CP850 para Star, CP437/CP858 para Epson, etc.).
- **TCP directo**: el transporte abre un socket (`net.Socket`) al `host` + `port` (9100 por defecto) de la impresora — no requiere drivers ni CUPS.
- **Prueba**: `POST /printers/:id/test` manda una página de prueba (y `probe` detecta codepage).
- **Impresión de venta/factura**: `POST /printers/:id/print-receipt` recibe el payload de la venta y genera el ticket (datos de la tienda, items, totales, leyenda fiscal).
- **Print jobs**: `print_job` guarda el historial de impresiones (estado, payload).

## 26. Manejo de errores y respuestas

### 26.1 Formato estándar de respuesta

Todas las respuestas de la API (éxito y error) siguen un **envelope** consistente:

**Éxito (200/201):**
```json
{
  "data": { ... }            // objeto o array según el endpoint
}
```

Los listados paginados agregan metadata:
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 342,
    "totalPages": 18
  }
}
```

**Error:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Datos inválidos",
    "details": [
      { "field": "email", "message": "Email inválido" }
    ]
  }
}
```

> El shape exacto del envelope (nombres de campos: `data`, `error`, `pagination`) está definido por cada controller/mapper del módulo; la convención se mantiene consistente en todos los módulos (ver cada `*.controller.ts` embebido arriba).

### 26.2 Jerarquía de errores

- **`AppError`** (`src/core/errors/AppError.ts`): clase base con `statusCode`, `code` y `isOperational = true`. De ella derivan las subclases concretas usadas en toda la app:
  - `BadRequestError` (400 `BAD_REQUEST`)
  - `UnauthorizedError` (401 `UNAUTHORIZED`)
  - `ForbiddenError` (403 `FORBIDDEN`)
  - `NotFoundError` (404 `NOT_FOUND`)
  - `ConflictError` (409 `CONFLICT`)
  - `UnprocessableEntityError` (422 `UNPROCESSABLE_ENTITY`)
  - `InternalServerError` (500 `INTERNAL_SERVER_ERROR`)
  - `TooManyRequestsError` (429 `TOO_MANY_REQUESTS`)
- **`ZodError`** (validación): el `errorHandler` global lo traduce a `400 VALIDATION_ERROR` con los detalles por campo.
- **Errores de Fastify** (4xx) y **errores internos** (500): el handler oculta el stack del cliente en producción.


> **AppError.ts — error de negocio con statusCode + code**  
> Ruta: `backend-fastify/src/core/errors/AppError.ts`  
>
```typescript
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly isOperational: boolean

  constructor(message: string, statusCode: number, code: string) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true

    Object.setPrototypeOf(this, new.target.prototype)
    Error.captureStackTrace(this)
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request') {
    super(message, 400, 'BAD_REQUEST')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found') {
    super(message, 404, 'NOT_FOUND')
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409, 'CONFLICT')
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = 'Unprocessable Entity') {
    super(message, 422, 'UNPROCESSABLE_ENTITY')
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR')
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too Many Requests') {
    super(message, 429, 'TOO_MANY_REQUESTS')
  }
}

```


### 26.3 Error handler global


> **errorHandler.ts — Zod → 400; AppError → statusCode; 500 oculto; notFound 404**  
> Ruta: `backend-fastify/src/config/errorHandler.ts`  
>
```typescript
import { AppError } from "@/core/errors/AppError";
import { FastifyError, FastifyReply, FastifyRequest } from "fastify"
import { ZodError } from "zod"

const CLIENT_ERROR_MESSAGES: Record<number, string> = {
  400: "Solicitud inválida",
  401: "No autorizado",
  403: "Acceso denegado",
  404: "No encontrado",
  405: "Método no permitido",
  408: "Tiempo de espera agotado",
  409: "Conflicto",
  413: "Solicitud demasiado grande",
  415: "Tipo de contenido no soportado",
  422: "Entidad no procesable",
  429: "Demasiadas solicitudes",
}

export const errorHandler = (
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  if (error instanceof ZodError || ("code" in error && error.code === "FST_ERR_VALIDATION")) {
    const validation = "validation" in error && Array.isArray(error.validation) ? error.validation : [];
    const first = error instanceof ZodError ? error.errors[0] : validation[0];
    return reply.status(400).send({
      message: first?.message ?? "Datos inválidos",
    });
  }

  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      message: error.message
    })
  }

  // Errores de Fastify con status code de cliente (body inválido, rate limit, etc.)
  // Se respeta el código pero se oculta el mensaje original (puede revelar detalles).
  if ("statusCode" in error && typeof error.statusCode === "number" && error.statusCode >= 400 && error.statusCode < 500) {
    request.log.warn(error);
    return reply.status(error.statusCode).send({
      message: CLIENT_ERROR_MESSAGES[error.statusCode] ?? "Solicitud inválida",
    })
  }

  request.log.error(error);
  return reply.status(500).send({
    message: "Error interno del servidor",
  });
}

export const notFoundHandler = (
  _request: FastifyRequest,
  reply: FastifyReply,
) => {
  reply.status(404).send({
    message: "Recurso no encontrado",
    statusCode: 404
  })
}

```


### 26.4 Códigos principales

| Código HTTP | Cuándo |
|---|---|
| `400` | Validación fallida (Zod) o regla de negocio inválida (stock, cantidad, unicidad) |
| `401` | Token faltante/inválido/vencido (authGuard) |
| `403` | No autorizado: rol insuficiente (roleGuard) o tienda distinta (storeGuard) |
| `404` | Recurso no encontrado (también rutas inexistentes → notFoundHandler) |
| `409` | Conflicto de unicidad (email/código/numero de documento ya existe) |
| `500` | Error interno — mensaje genérico ("Internal Server Error") en prod |

---

## 27. Secuencia de estados: flujo de una venta

El flujo operativo más importante del sistema, de punta a punta:

```
┌─────────────┐   ┌──────────────┐   ┌───────────────┐   ┌──────────────┐
│ 1. Cliente  │ → │ 2. Caja      │ → │ 3. Validación │ → │ 4. Descuento │
│ busca med    │   │ agrega items │   │ de receta/    │   │ de lotes     │
│ (medicines)  │   │ (sales)      │   │ stock/estado  │   │ (FEFO)       │
└─────────────┘   └──────────────┘   └───────────────┘   └──────────────┘
                                                              │
        ┌─────────────────────────────────────────────────────┘
        ▼
┌──────────────┐   ┌──────────────┐   ┌───────────────┐
│ 5. Insert    │ → │ 6. Factura   │ → │ 7. Ticket     │
│ sale+items   │   │ (correlativo │   │ (impresora    │
│ + movimiento │   │  FAC-...)    │   │  ESC/POS TCP) │
└──────────────┘   └──────────────┘   └───────────────┘
```

1. **Catálogo**: el cajero busca el medicamento (`GET /medicines?search=...`); el stock disponible sale de lotes de la tienda (`GET /inventory/batches` / `GET /inventory/product/:medicineId`).
2. **Armado de venta**: `POST /sales` con `{ items: [{ medicineId, quantity, batchId? }], paymentMethod, clientId?, prescriptionId? }` — `batchId` opcional por item: si llega, se vende de ese lote; si no, FEFO automático.
3. **Validaciones** (en `sales.service` + repo): medicamento existe, activo y no borrado; stock suficiente; si `requiresPrescription` o `isControlled`, debe llegar `prescriptionId` con receta `validada`, no vencida, del mismo cliente y con saldo de `authorized_quantity`; método de pago dentro del enum; lotes explícitos no vencidos.
4. **Transacción** (`sales.drizzle.repository`): con `FOR UPDATE` sobre lotes y receta, descuenta cantidad (batch explícito primero, luego FEFO por vencimiento), inserta `sale` + `sale_item(s)`, inserta `inventory_movement`.
5. **Respuesta**: `201` con la venta completa + items + total.
6. **Facturación opcional**: `POST /invoices` con `{ saleId, type }` → genera correlativo por tienda.
7. **Impresión**: `POST /printers/:id/print-receipt` con el payload de la venta → encoder ESC/POS → TCP al puerto 9100.

**Cancelación**: `POST /sales/:id/cancel` → en transacción: venta → `anulada` (con `cancellationReason`/`cancelledAt`/`cancelledBy`), devolución de stock a los lotes originales, y si existía factura asociada → la anula (la regla exacta de acoplamiento venta-factura está en los repositorios embebidos arriba).

---

## 28. Scripts disponibles

Scripts reales del `package.json` (ver 7.1):

| Script | Comando | Qué hace |
|---|---|---|
| `dev` | `tsx watch src/server.ts` | Arranca el servidor en modo watch (desarrollo) |
| `test` | `vitest run` | Ejecuta los tests una vez (206 tests verdes) |
| `test:watch` | `vitest` | Tests en modo watch |
| `db:generate` | `drizzle-kit generate` | Genera migración desde el schema (usa `--hints`; ver abajo) |
| `db:migrate` | `drizzle-kit migrate` | Aplica las migraciones SQL a la DB |
| `db:push` | `drizzle-kit push` | Sincroniza el schema directo (solo dev, sin migraciones) |
| `db:cleanup` | `tsx src/scripts/cleanup-expired.ts` | Limpieza programada de datos expirados (sesiones/códigos/verificaciones) |

### 28.1 Script auxiliares


> **cleanup-expired.ts — limpieza de expirados**  
> Ruta: `backend-fastify/src/scripts/cleanup-expired.ts`  
>
```typescript
import "dotenv/config";
import { lt } from "drizzle-orm";
import { db } from "@/index";
import { session, verificacion } from "@/db/schema";

async function cleanupExpired() {
  const now = new Date();

  const expiredSessions = await db
    .delete(session)
    .where(lt(session.expiresAt, now))
    .returning({ id: session.id });

  const expiredVerifications = await db
    .delete(verificacion)
    .where(lt(verificacion.expiresAt, now))
    .returning({ id: verificacion.id });

  console.log(`Sesiones expiradas eliminadas: ${expiredSessions.length}`);
  console.log(`Verificaciones expiradas eliminadas: ${expiredVerifications.length}`);
}

cleanupExpired()
  .catch((error) => {
    console.error("Cleanup fallido:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$client.end();
  });

```


### 28.2 Gotchas de drizzle-kit

- **`pnpm db:generate` falla con exit 2** pidiendo `--hints` cuando el schema cambia de forma ambigua. El wrapper `pnpm` se "come" los flags; usá directo:
  ```bash
  pnpm exec drizzle-kit generate --hints '["sale.status", ...]'
  ```
- Los **snapshot JSON** (`drizzle/*/snapshot.json`) se regeneran solos; no se editan a mano.
- `db:push` no genera migraciones — para versionado siempre `db:generate` + `db:migrate`.

## 29. Archivos de prueba HTTP

El proyecto trae una colección de requests listas para **VS Code REST Client** (extensión "REST Client") en `backend-fastify/http/*.http`, con variables de entorno en `http-client.env.json`.

### 29.1 Variables de entorno del cliente HTTP


> **http-client.env.json — baseUrl y apiUrl de desarrollo**  
> Ruta: `backend-fastify/http/http-client.env.json`  
>
```json
{
  "dev": {
    "baseUrl": "http://localhost:3001",
    "apiUrl": "http://localhost:3001/api/v1",
    "email": "admin@farmacia.test",
    "password": "admin123",
    "userName": "Administrador",
    "newEmail": "user@farmacia.test",
    "newPassword": "password123",
    "userId": "REEMPLAZAR_CON_ID",
    "sessionId": "REEMPLAZAR_CON_ID",
    "categoryId": "REEMPLAZAR_CON_ID",
    "supplierId": "REEMPLAZAR_CON_ID",
    "medicineId": "REEMPLAZAR_CON_ID",
    "clientId": "REEMPLAZAR_CON_ID",
    "prescriptionId": "REEMPLAZAR_CON_ID",
    "purchaseId": "REEMPLAZAR_CON_ID",
    "batchId": "REEMPLAZAR_CON_ID",
    "saleId": "REEMPLAZAR_CON_ID",
    "invoiceId": "REEMPLAZAR_CON_ID",
    "printerId": "REEMPLAZAR_CON_ID",
    "refreshToken": ""
  },
  "prod": {
    "baseUrl": "https://tu-dominio.com",
    "apiUrl": "https://tu-dominio.com/api/v1",
    "email": "",
    "password": ""
  }
}

```


### 29.2 Archivos de requests por módulo

| Archivo | Cobertura |
|---|---|
| `auth.http` | Registro de tienda/usuario, login, refresh, logout, verificación de email, forgot/reset password, sesiones activas |
| `users.http` | CRUD de usuarios del staff |
| `suppliers.http` | CRUD de proveedores |
| `categories.http` | CRUD de categorías |
| `medicines.http` | CRUD de medicamentos + filtros de búsqueda |
| `clients.http` | CRUD de clientes + historial de compras |
| `purchases.http` | Crear compra con items, confirmar/anular, listar |
| `batch-inventory.http` | CRUD y ajustes de lotes |
| `inventory.http` | Stock por producto, bajo stock, movimientos |
| `sales.http` | Crear/cancelar ventas, listar |
| `invoices.http` | Crear/anular facturas, listar por rango |
| `reports.http` | Dashboard y reporte financiero |
| `printers.http` | CRUD impresoras, test, probe, print-receipt, send-tcp |

### 29.3 Token de autenticación

Los archivos `.http` usan la variable `{{token}}` (respuesta del login) en el header `Authorization: Bearer {{token}}`. El flujo típico:

1. `POST {{apiUrl}}/auth/login` (o `register-store` para el primer arranque).
2. Copiar el `accessToken` de la respuesta en la variable `token` del archivo `http-client.env.json` (o usar la feature de "Set Variable" del REST Client).
3. Ejecutar los requests de cada módulo.

> 28.3.1 Los request de auth son **públicos** (no requieren token). El resto pasa por `authGuard` + `storeGuard`.

---

## 30. Testing

### 30.1 Setup y helpers globales


> **setup.ts — configuración global de Vitest (mocks, hooks)**  
> Ruta: `backend-fastify/src/__tests__/setup.ts`  
>
```typescript
/**
 * Global test setup — runs once before all test files.
 *
 * Currently a no-op placeholder. Add global mocks, polyfills,
 * or test-database setup here as the suite grows.
 */
import { vi } from "vitest"

// Silence noisy console output during tests.
// Comment these out when debugging specific test runs.
vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})
vi.spyOn(console, "warn").mockImplementation(() => {})

```



> **helpers.ts — utilidades de tests (factories, mocks de repos)**  
> Ruta: `backend-fastify/src/__tests__/helpers.ts`  
>
```typescript
/**
 * Test helpers — factories for mock entities and repository builders.
 *
 * Every `make*` function produces a realistic object with sensible defaults.
 * Override only what the specific test needs.
 */
import { vi } from "vitest"
import type { ISaleEntity, ISaleItemEntity, CreateSaleData } from "@/modules/sales/domain/sales.entities"
import type { ISaleRepository } from "@/modules/sales/domain/sales.interface"
import type { ICategoryEntity } from "@/modules/categories/domain/categories.entities"
import type { ICategoryRepository } from "@/modules/categories/domain/categories.interface"
import type { IMedicineEntity } from "@/modules/medicines/domain/medicines.entities"
import type { IClientEntity } from "@/modules/clients/domain/clients.entities"
import type { IClientRepository } from "@/modules/clients/domain/clients.interface"

// ─── IDs ────────────────────────────────────────────────────────────────

let idCounter = 0
export function fakeId(): string {
  idCounter++
  return `00000000-0000-0000-0000-${String(idCounter).padStart(12, "0")}`
}

// ─── Sale factories ─────────────────────────────────────────────────────

export function makeSaleItem(overrides?: Partial<ISaleItemEntity>): ISaleItemEntity {
  return {
    id: fakeId(),
    sale_id: "sale-1",
    medicine_id: "med-1",
    medicine_name: "Paracetamol 500mg",
    quantity: 2,
    unit_price: 5.0,
    line_total: 10.0,
    batch_id: null,
    created_at: new Date("2026-01-15T10:00:00Z"),
    updated_at: new Date("2026-01-15T10:00:00Z"),
    ...overrides,
  }
}

export function makeSale(overrides?: Partial<ISaleEntity>): ISaleEntity {
  return {
    id: fakeId(),
    subtotal: 10.0,
    total: 10.0,
    payment_method: "efectivo",
    amount_received: 15.0,
    change_given: 5.0,
    status: "completada",
    cancellation_reason: null,
    cancelled_at: null,
    cancelled_by: null,
    user_id: "user-1",
    user_name: "Cajero Test",
    client_id: null,
    client_name: null,
    prescription_id: null,
    created_at: new Date("2026-01-15T10:00:00Z"),
    updated_at: new Date("2026-01-15T10:00:00Z"),
    items: [makeSaleItem()],
    ...overrides,
  }
}

export function makeCreateSaleData(
  overrides?: Partial<Omit<CreateSaleData, "items"> & { items: CreateSaleData["items"] }>
): CreateSaleData {
  return {
    items: [{ medicine_id: "med-1", quantity: 2 }],
    payment_method: "efectivo",
    amount_received: 20.0,
    user_id: "user-1",
    user_name: "Cajero Test",
    ...overrides,
  }
}

// ─── Category factories ─────────────────────────────────────────────────

export function makeCategory(overrides?: Partial<ICategoryEntity>): ICategoryEntity {
  return {
    id: fakeId(),
    name: "Antibióticos",
    description: "Medicamentos antibióticos",
    created_at: new Date("2026-01-15T10:00:00Z"),
    updated_at: new Date("2026-01-15T10:00:00Z"),
    deleted_at: undefined,
    medicine_count: 0,
    ...overrides,
  }
}

// ─── Medicine factories ─────────────────────────────────────────────────

export function makeMedicine(overrides?: Partial<IMedicineEntity>): IMedicineEntity {
  return {
    id: fakeId(),
    commercial_name: "Paracetamol 500mg",
    purchase_price: 3.0,
    sale_price: 5.0,
    stock: 100,
    low_stock_threshold: 5,
    requires_prescription: false,
    is_controlled: false,
    active: true,
    created_at: new Date("2026-01-15T10:00:00Z"),
    updated_at: new Date("2026-01-15T10:00:00Z"),
    ...overrides,
  }
}

// ─── Mock repository builders ───────────────────────────────────────────
// Each builder returns a vi.fn()-based object that satisfies the
// corresponding repository interface. Override individual methods
// per test.

export function mockSaleRepository(overrides?: Partial<ISaleRepository>): ISaleRepository {
  return {
    create: vi.fn().mockResolvedValue(makeSale()),
    findById: vi.fn().mockResolvedValue(makeSale()),
    findAll: vi.fn().mockResolvedValue({ sales: [makeSale()], total: 1, page: 1, limit: 10 }),
    cancel: vi.fn().mockResolvedValue({ ...makeSale(), status: "anulada" }),
    getReport: vi.fn().mockResolvedValue({
      total_sales: 1,
      total_revenue: 10,
      total_profit: 5,
      average_ticket: 10,
      by_payment_method: { efectivo: 10 },
      top_products: [],
    }),
    getRevenueTrend: vi.fn().mockResolvedValue([]),
    ...overrides,
  }
}

export function mockCategoryRepository(overrides?: Partial<ICategoryRepository>): ICategoryRepository {
  return {
    findAll: vi.fn().mockResolvedValue({ categories: [makeCategory()], total: 1, page: 1, limit: 10 }),
    findById: vi.fn().mockResolvedValue(makeCategory()),
    findByName: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(makeCategory()),
    update: vi.fn().mockResolvedValue(makeCategory()),
    softDelete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

// ─── Client factories ───────────────────────────────────────────────────

export function makeClient(overrides?: Partial<IClientEntity>): IClientEntity {
  return {
    id: "client-1",
    full_name: "Juan Perez",
    document_type: "DNI",
    is_frequent: false,
    created_at: new Date("2026-01-15T10:00:00Z"),
    updated_at: new Date("2026-01-15T10:00:00Z"),
    ...overrides,
  }
}

export function mockClientRepository(overrides?: Partial<IClientRepository>): IClientRepository {
  return {
    findAll: vi.fn().mockResolvedValue({ clients: [makeClient()], total: 1, page: 1, limit: 10 }),
    findById: vi.fn().mockResolvedValue(makeClient()),
    create: vi.fn().mockResolvedValue(makeClient()),
    update: vi.fn().mockResolvedValue(makeClient()),
    softDelete: vi.fn().mockResolvedValue(undefined),
    findSalesByClient: vi.fn().mockResolvedValue([]),
    findPrescriptionsByClient: vi.fn().mockResolvedValue([]),
    findFrequentProductsByClient: vi.fn().mockResolvedValue([]),
    ...overrides,
  }
}

```


### 30.2 Tests por módulo

| Test | Qué valida |
|---|---|
| `auth.service.test.ts` | Registro, login, refresh, logout, verificación, reset de password con repos mockeados |
| `users.service.test.ts` | CRUD de usuarios |
| `suppliers.service.test.ts` | CRUD + unicidad + soft delete |
| `categories.service.test.ts` | CRUD + unicidad |
| `medicines.service.test.ts` | CRUD + validaciones (helpers en `medicine.test-helpers.ts`) |
| `clients.service.test.ts` | CRUD + historial |
| `purchases.service.test.ts` | Crear/confirmar/anular compras |
| `batch-inventory.service.test.ts` | CRUD + ajustes de lotes |
| `inventory.service.test.ts` | Stock y movimientos |
| `sales.service.test.ts` | Venta FEFO + cancelación |
| `invoices.service.test.ts` | Correlativo + anulación |
| `reports.service.test.ts` | Dashboard y financiero |
| `printers.service.test.ts` | CRUD impresoras + impresión |
| `nodemailer.sender.test.ts` | Sender con transport fake |

### 30.3 Cómo correr

```bash
pnpm test          # una vez
pnpm test:watch    # watch
npx tsc --noEmit   # type-check completo (0 errores)
```

Todas las pruebas son de **unidad a nivel de servicio** con repositorios mockeados — no requieren base de datos ni red. La cobertura de integración con Postgres queda para las pruebas manuales vía archivos `.http`.

## 31. Checklist de verificación del sistema

Checklist para validar que una instalación del backend funciona de punta a punta. Ejecutar en orden.

### 31.1 Arranque y salud

- [ ] `pnpm install` completo sin errores.
- [ ] `.env` creado con `DATABASE_URL`, `JWT_SECRET` (≥32), `JWT_REFRESH_SECRET` (≥32), `CORS_ORIGIN`.
- [ ] `pnpm db:migrate` aplica las 5 migraciones sin error.
- [ ] `pnpm dev` levanta y loguea el puerto.
- [ ] `GET /api/v1/health` → `{"status":"ok","timeStamp":"<ISO>"}`.

### 31.2 Registro y autenticación

- [ ] `POST /auth/register-store` crea tienda + admin (primer arranque).
- [ ] `POST /auth/login` devuelve `accessToken` + `refreshToken` con la estructura del envelope.
- [ ] `POST /auth/refresh` rota el refresh token (el viejo queda inválido).
- [ ] `GET /auth/sessions` lista la sesión activa; `DELETE /auth/sessions/:id` la revoca.
- [ ] Un request sin token a un endpoint protegido → `401`.

### 31.3 Catálogo (maestros)

- [ ] Crear categoría → `201`; duplicar nombre en la misma tienda → `409`.
- [ ] Crear medicamento con `code` y `price`; duplicar `code` → `409`.
- [ ] Crear proveedor; el listado muestra `medicineCount`.

### 31.4 Inventario y compras

- [ ] Crear compra con 2 items (con lote y vencimiento distintos) → stock del producto = suma de lotes.
- [ ] Consultar `GET /inventory/batches/expiring` → muestra los lotes por vencer.
- [ ] Bajo stock: medicamento con stock ≤ `low_stock_threshold` aparece en `GET /inventory/low-stock`.

### 31.5 Venta (flujo completo)

- [ ] Crear venta de 2 medicamentos → `201`, total calculado, stock descontado, lote FEFO primero.
- [ ] Negar venta cuando stock insuficiente → `400` con mensaje y sin side-effects.
- [ ] Crear venta de medicamento con `requiresPrescription` sin receta → `400`.
- [ ] Cancelar venta → stock vuelve a los lotes originales.

### 31.6 Facturación

- [ ] Facturar venta (tipo `ticket`) → número `FAC-YYYY-######` correlativo.
- [ ] Dos facturas seguidas → números consecutivos (sin huecos).
- [ ] Anular factura → status `anulada`.

### 31.7 Reportes e impresión

- [ ] `GET /reports/dashboard` → KPIs del día consistentes con las ventas creadas.
- [ ] `GET /reports/financial?from=...&to=...` → suma total = ventas del rango.
- [ ] (Si hay impresora) `POST /printers/:id/print-receipt` con un ticket de venta imprime físicamente.

### 31.8 Calidad

- [ ] `pnpm test` → todos los tests verdes.
- [ ] `npx tsc --noEmit` → 0 errores.
- [ ] `pnpm db:cleanup` corre sin romper (limpieza de datos expirados).

---

## Glosario rápido

| Término | Significado |
|---|---|
| **FEFO** | *First-Expired, First-Out* — vender primero lo que vence primero |
| **Lote (batch)** | Unidad de stock con vencimiento propio; el inventario se rastrea por lote |
| **ESC/POS** | Protocolo de comandos de impresoras térmicas (bytes de control) |
| **store** | Tienda/farmacia (multi-tenant); casi toda la data pertenece a una store |
| **Envelope** | Formato `{ data }` / `{ error }` / `{ data, pagination }` de respuestas |
| **Soft delete** | Borrado lógico vía `deleted_at` (no físico) |
| **AppError** | Error de negocio con `statusCode` y `code` |

---

*Fin del manual. Para dudas sobre un módulo específico, buscá la sección correspondiente por el nombre del módulo en el índice.*
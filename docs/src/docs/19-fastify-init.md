# Fastify Init - Manual Técnico Completo

Este manual documenta todo el código del proyecto, explicando cada función, configuración e implementación.

---

## Índice

1. [Estructura del Proyecto](#estructura-del-proyecto)
2. [Configuración Principal](#configuración-principal)
3. [Utils y Helpers](#utils-y-helpers)
4. [Errores](#errores)
5. [Módulo Auth](#módulo-auth)
6. [Presentation Layer](#presentation-layer)
7. [Prisma Schema](#prisma-schema)

---

## 1. Estructura del Proyecto

```
src/
├── app.ts                    # Configuración de Fastify (plugins)
├── server.ts                 # Punto de entrada, levanta el servidor
├── config/                   # Configuraciones externas
│   ├── env.ts               # Variables de entorno (validación Zod)
│   ├── prisma.ts           # Cliente Prisma
│   └── redis.ts            # Cliente Redis (caché)
├── core/
│   ├── errors/             # Errores personalizados
│   │   └── AppError.ts
│   └── utils/              # Utilities genéricas
│       ├── crypto.utils.ts  # Hash de passwords
│       └── token.utils.ts  # Generación de JWTs
├── types/                   # Tipos globales
│   └── user.ts
├── infrastructure/          # Configuraciones de infraestructura
│   └── logger.ts
└── modules/                 # Módulos de la aplicación
    └── auth/
        ├── domain/         # Contratos, tipos y entidades
        │   ├── auth.interface.ts  # Interfaces del repository
        │   ├── auth.types.ts      # Tipos (payload, response)
        │   └── auth.entities.ts   # Entidades del dominio
        ├── application/   # Lógica de negocio (services)
        │   └── auth.service.ts
        ├── infrastructure # Implementaciones (repositories)
        │   └── auth.prisma.repository.ts
        └── presentation   # Controladores, rutas, DTOs
            ├── auth.controller.ts
            ├── auth.routes.ts
            └── auth.dto.ts
```

---

## 2. Configuración Principal

### 2.1 `package.json` - Dependencias del Proyecto

```json
{
  "name": "01",
  "module": "index.ts",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsup src/server.ts --format cjs --dts",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  },
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
    "@types/bun": "latest",
    "@types/bcrypt": "^6.0.0",
    "@types/node": "^25.3.3",
    "prisma": "^5.22.0",
    "tsup": "^8.5.1",
    "tsx": "^4.21.0",
    "typescript": "^5.9.3"
  },
  "peerDependencies": {
    "typescript": "^5"
  }
}

```

**Scripts disponibles:**

| Script | Descripción |
|--------|-------------|
| `bun dev` | Inicia el servidor en modo desarrollo con watch |
| `bun build` | Compila a JavaScript con tsup |
| `bun start` | Inicia el servidor desde el build |
| `bun prisma:generate` | Genera el cliente Prisma |
| `bun prisma:migrate` | Ejecuta migraciones de BD |
| `bun prisma:studio` | Abre Prisma Studio (UI de BD) |

**Dependencias principales:**

| Paquete | Función |
|---------|---------|
| `fastify` | Framework web (reemplaza Express) |
| `@fastify/jwt` | Autenticación JWT |
| `@fastify/rate-limit` | Limitación de requests |
| `@fastify/helmet` | Headers de seguridad |
| `@fastify/cors` | CORS |
| `@fastify/compress` | Compresión gzip |
| `@prisma/client` | ORM de base de datos (PostgreSQL) |
| `ioredis` | Cliente Redis |
| `bcrypt` | Hash de passwords |
| `zod` | Validación de esquemas |
| `pino` | Logger de alto rendimiento |
| `jsonwebtoken` | Manejo de JWTs |

---

### 2.2 `.env` - Variables de Entorno

```env
NODE_ENV=development
PORT=3000
HOST="0.0.0.0"
DATABASE_URL="postgresql://..."
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
REDIS_URL=redis://localhost:6379
```

---

### 2.3 `src/config/env.ts` - Validación de Entorno

```typescript
import { z } from "zod";
import dotenv from "dotenv";
import { logger } from "@/infrastructure/logger";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  HOST: z.string(),
  DATABASE_URL: z.string(),
  REDIS_HOST: z.string().default("127.0.0.1"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  logger.error("Invalid environment variables");
  process.exit(1);
}

export const env = _env.data;
```

**¿Qué hace este archivo?**

1. **`dotenv.config()`** - Carga las variables del archivo `.env` en `process.env`
2. **Define un schema Zod** (`envSchema`) que valida:
   - `NODE_ENV` - Entorno de ejecución (development/production/test)
   - `PORT` - Puerto del servidor (default 3000)
   - `HOST` - Host donde escucha el servidor
   - `DATABASE_URL` - URL de PostgreSQL
   - `REDIS_*` - Configuración de Redis (caché)
   - `JWT_SECRET` - Clave para firmar access tokens (min 32 chars)
   - `JWT_REFRESH_SECRET` - Clave para firmar refresh tokens
3. **Valida con `safeParse()`** - Si falla, muestra error y sale del proceso
4. **Exporta el objeto validado** (`env`) con tipos seguros

**¿Por qué Zod?** Permite validar y tipar las variables de entorno en tiempo de ejecución, evitando errores por config faltante.

---

### 2.4 `src/config/prisma.ts` - Cliente de Base de Datos

```typescript
import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasourceUrl: env.DATABASE_URL,
});
```

**¿Qué hace este archivo?**

1. **Crea una instancia de PrismaClient** - El cliente oficial de Prisma para conectar a PostgreSQL
2. **Configura logging**:
   - Development: muestra queries, errores y warnings
   - Production: solo errores
3. **Usa `datasourceUrl`** - La URL de la base de datos del `.env`

**¿Por qué es singleton?** Prisma mantiene un pool de conexiones. Crear múltiples instancias puede causar problemas de memoria. Se importa como `prisma` en todo el proyecto.

---

### 2.5 `src/config/redis.ts` - Cliente de Caché Redis

```typescript
import Redis from "ioredis"
import { env } from "./env"
import { logger } from "@/infrastructure/logger"

let redisClient: Redis | null = null

export const getRedisClient = () => {
  if (redisClient) return redisClient

  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectionName: "farmacy",
      retryStrategy: (times) => {
        if (times > 5) {
          logger.error("Redis max retries reached")
          return null
        }
        return Math.min(times * 200, 2000)
      },
    })

    // Connect and log status
    redisClient.connect().then(() => {
      logger.info("Redis connected successfully")
    }).catch((error) => {
      logger.error({ error: error }, "Redis connection failed")
    })

    let hasLoggedRedisError = false

    redisClient.on("ready", () => {
      hasLoggedRedisError = false
      logger.info("Redis ready")
    })

    redisClient.on("error", (error) => {
      if (!hasLoggedRedisError) {
        logger.error({ error }, "Redis connection error")
        hasLoggedRedisError = true
      }
    })

    redisClient.on("reconnecting", () => {
      logger.warn("Redis reconnecting...")
    })

    redisClient.on("close", () => {
      logger.warn("Redis connection closed")
    })

    return redisClient
  } catch (error) {
    logger.error("Redis unavailable, continuing without cache")
    return null
  }
}

export const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit()
    logger.info("Redis disconnected")
  }
}

export const redis = getRedisClient()
```

**¿Qué hace este archivo?**

1. **Singleton pattern** - Si ya existe el cliente, lo reutiliza
2. **Configuración de conexión**:
   - `maxRetriesPerRequest: 3` - Reintentos por request
   - `lazyConnect: true` - Conectar solo cuando se necesita
   - `connectionName: "farmacy"` - Identificador de la conexión
3. **Retry strategy** - Exponential backoff:
   - Máximo 5 reintentos
   - Delay: `min(times * 200, 2000)` ms
4. **Event handlers** - Escucha eventos de Redis para logging:
   - `ready` - Conexión establecida
   - `error` - Error de conexión
   - `reconnecting` - Intentando reconectar
   - `close` - Conexión cerrada
5. **Graceful shutdown** - `closeRedis()` para cerrar correctamente
6. **Fallback** - Si Redis falla, la app sigue funcionando (continúa sin cache)

**¿Por qué usar Redis?** Para caching de respuestas, sesiones, rate limiting, y cualquier dato que requiera acceso rápido.

---

### 2.6 `src/infrastructure/logger.ts` - Logger

```typescript
import pino from "pino";

export const logger = pino({
  transport: process.env.NODE_ENV === "development" ? {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  } : undefined,
});
```

**¿Qué hace este archivo?**

1. **Usa pino** - Logger de alto rendimiento para Node.js
2. **Configuración development**:
   - `pino-pretty` - Formatea los logs en consola con colores
   - `translateTime: "SYS:standard"` - Timestamps legibles
   - `ignore: "pid,hostname"` - Oculta info irrelevante
3. **Production** - Logs JSON estructurados (para parseo automático)

**¿Por qué pino?** Es 10x más rápido que otros loggers, soportado por Fastify natively, y produce logs JSON estructurados (ideal para log aggregation como Datadog, ELK, etc.).

---

### 2.7 `src/server.ts` - Punto de Entrada

```typescript
import { buildApp } from "./app"
import { env } from "./config/env"
import { closeRedis } from "./config/redis"
import { prisma } from "./config/prisma"
import { logger } from "./infrastructure/logger"

const startServer = async () => {
  try {
    const app = await buildApp()

    await app.listen({ port: env.PORT, host: env.HOST })

    logger.info(`Server listening on http://${env.HOST}:${env.PORT}`)

    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`)
      await app.close()
      await prisma.$disconnect()
      await closeRedis()
      process.exit(0)
    }

    process.on("SIGINT", () => gracefulShutdown("SIGINT"))
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
  } catch (error) {
    logger.error({ err: error }, "Failed to start server")
    process.exit(1)
  }
}

startServer()
```

**¿Qué hace este archivo?**

1. **`buildApp()`** - Llama a app.ts para configurar Fastify
2. **`app.listen({ port, host })`** - Inicia el servidor HTTP
3. **Graceful shutdown** - Manejo de señales del sistema:
   - `SIGINT` - Ctrl+C
   - `SIGTERM` - kill command
   - Cierra: Fastify app → Prisma → Redis → Exit(0)
4. **Manejo de errores** - Si falla el inicio, loguea error y sale con código 1

---

### 2.8 `src/app.ts` - Configuración de Fastify

```typescript
import Fastify from "fastify"
import helmet from "@fastify/helmet"
import cors from "@fastify/cors"
import compress from "@fastify/compress"
import rateLimit from "@fastify/rate-limit"
import { env } from "./config/env"
import { getRedisClient } from "./config/redis"
import { routes } from "./presentation/routes"

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
  })

  getRedisClient()

  // Headers de seguridad (XSS, HSTS, etc.).
  await app.register(helmet)

  await app.register(cors, {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
  })

  // Comprime respuestas con gzip.
  await app.register(compress)

  // Limita a 100 requests/min por IP.
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute"
  })

  app.register(routes, { prefix: '/api/v1' });

  app.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() }
  })

  return app
}
```

**¿Qué hace este archivo?**

1. **Logger de Fastify** - Configura logging interno:
   - Development: level 'debug' con formato pretty
   - Production: level 'info' (más silencioso)
2. **Inicializa Redis** - `getRedisClient()` para tener listo el cache
3. **Registra plugins de Fastify**:

| Plugin | Función |
|--------|---------|
| `@fastify/helmet` | Headers de seguridad (X-Content-Type-Options, HSTS, X-Frame-Options, etc.) |
| `@fastify/cors` | Cross-Origin Resource Sharing - permite request desde otros dominios |
| `@fastify/compress` | Compresión gzip de respuestas |
| `@fastify/rate-limit` | Limita requests por IP (100/min en este caso) |

4. **Routes** - Registra las rutas con prefijo `/api/v1`
5. **Health check** - Endpoint `/health` que retorna `{ status: "ok", timestamp }`

---

## 3. Utils y Helpers

### 3.1 `src/core/utils/crypto.utils.ts` - Funciones de Password

```typescript
import bcrypt from "bcrypt"

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10)
}

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};
```

**¿Qué hace este archivo?**

1. **`hashPassword(password)`** - Hashea un password usando bcrypt:
   - Algoritmo: bcrypt
   - Salt rounds: 10 (256 iteraciones)
   - Retorna: string hasheado
2. **`comparePassword(password, hash)`** - Compara un password plano con su hash:
   - Retorna: `true` si coincide, `false` si no

**¿Por qué bcrypt?** Es un algoritmo de hashing diseñado para passwords:
- Resistente a rainbow tables (usa salt)
- Configurable work factor (cost factor)
- Incorpora verificación de hash

---

### 3.2 `src/core/utils/token.utils.ts` - Generación de JWTs

```typescript
import { env } from "@/config/env"
import type { Role } from "@/types/user"
import type { SignOptions } from "jsonwebtoken"
import jwt from "jsonwebtoken"

interface TokenPayload {
  userId: string
  email: string
  role: Role
}

export const generateTokens = (userId: string, email: string, role: Role) => {
  const accessTokenOptions: SignOptions = {
    expiresIn: 900  // 15 minutos en segundos
  }

  const refreshTokenOptions: SignOptions = {
    expiresIn: 604000  // 7 días en segundos
  }

  const accessToken = jwt.sign(
    { userId, email, role } as TokenPayload,
    env.JWT_SECRET,
    accessTokenOptions
  )

  const refreshToken = jwt.sign(
    { userId },  // Solo userId, más liviano
    env.JWT_REFRESH_SECRET,
    refreshTokenOptions
  )

  return { accessToken, refreshToken }
}
```

**¿Qué hace este archivo?**

1. **`generateTokens(userId, email, role)`** - Genera dos tokens:
   
   **Access Token** (para autenticar requests):
   - Payload: `{ userId, email, role }`
   - Expira: 900 segundos (15 minutos)
   - Firmado con: `JWT_SECRET`
   
   **Refresh Token** (para obtener nuevo access token):
   - Payload: `{ userId }` (solo ID, más liviano)
   - Expira: 604000 segundos (7 días)
   - Firmado con: `JWT_REFRESH_SECRET`

2. **Retorna objeto** con ambos tokens

**¿Por qué dos tokens?**
- Access token: corto (15 min) → si alguien lo roba, máximo 15 min de acceso
- Refresh token: largo (7 días) → el usuario no tiene que loguearse seguido
- Si el refresh es compromiseado, se puede revokear sin afectar el access

---

### 3.3 `src/types/user.ts` - Tipos de Usuario

```typescript
export type Role = "admin" | "staff"

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  deletedAt?: Date | null;
}
```

**¿Qué hace este archivo?**

1. **Define `Role`** - Union type con los roles posibles del sistema
2. **Define `User` interface** - Tipo del objeto usuario:
   - `id` - UUID único
   - `email` - Email único
   - `name` - Nombre completo
   - `role` - Rol del usuario (admin/staff)
   - `deletedAt` - Soft delete timestamp (opcional)

---

## 4. Errores

### 4.1 `src/core/errors/AppError.ts` - Errores Personalizados

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

**¿Qué hace este archivo?**

1. **Clase base `AppError`**:
   - Extiende `Error` nativo de JavaScript
   - Agrega: `statusCode` (HTTP status), `code` (error code interno), `isOperational` (si es error esperado o no)
   - `Object.setPrototypeOf` - Corrección para mantener herencia correcta en ES5
   - `Error.captureStackTrace` - Captura el stack trace completo

2. **Errores específicos** - Cada uno con su status code y code:

| Error | Status | Code | Uso |
|-------|--------|------|-----|
| `BadRequestError` | 400 | BAD_REQUEST | Datos inválidos |
| `UnauthorizedError` | 401 | UNAUTHORIZED | No autenticado |
| `ForbiddenError` | 403 | FORBIDDEN | No autorizado |
| `NotFoundError` | 404 | NOT_FOUND | Recurso no existe |
| `ConflictError` | 409 | CONFLICT | Conflicto (ej: email duplicado) |
| `UnprocessableEntityError` | 422 | UNPROCESSABLE_ENTITY | Validación fallida |
| `InternalServerError` | 500 | INTERNAL_SERVER_ERROR | Error inesperado |
| `TooManyRequestsError` | 429 | TOO_MANY_REQUESTS | Rate limit excedido |

**¿Por qué crear errores personalizados?**
- Estandariza los errores en toda la app
- Agrega códigos internos para debugging
- Permite distinguir errores operacionales (del usuario) de bugs (del sistema)

---

## 5. Módulo Auth

El módulo de autenticación sigue una arquitectura limpia (Clean Architecture) con separación en capas:

```
src/modules/auth/
├── domain/           # Contratos e interfaces
├── application/      # Lógica de negocio
├── infrastructure/   # Implementaciones (Prisma)
└── presentation/     # Controladores, rutas, DTOs
```

### 5.1 Domain Layer - Capa de Dominio

La capa de dominio contiene los contratos y tipos puros, sin dependencias de frameworks.

#### `src/modules/auth/domain/auth.entities.ts` - Entidades

```typescript
import type { Role } from "@/types/user"

export interface IUserEntity {
  id: string
  name: string
  email: string
  password: string
  role: Role
  createdAt?: Date
  updatedAt?: Date
}
```

**¿Qué hace este archivo?**

- Define la interfaz `IUserEntity` - Representa el usuario persistido en la base de datos
- Contiene todos los campos incluyendo `password` (hasheada)
- Incluye timestamps opcionales (`createdAt`, `updatedAt`)

---

#### `src/modules/auth/domain/auth.types.ts` - Tipos de Payload y Response

```typescript
import type { Role } from "@/types/user"

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

export interface IAuthResponse {
  message: string
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
```

**¿Qué hace este archivo?**

1. **`IRegisterPayload`** - Tipo para el payload de registro:
   - `name`, `email`, `password` - Campos requeridos
   - `role` - Opcional (default: staff)

2. **`ILoginPayload`** - Tipo para el payload de login:
   - `email` y `password` para autenticar

3. **`IAuthResponse`** - Tipo para la respuesta de auth:
   - `message` - Mensaje de éxito
   - `user` - Datos del usuario (sin password)
   - `accessToken` y `refreshToken` - Tokens JWT

---

#### `src/modules/auth/domain/auth.interface.ts` - Interfaces del Repository

```typescript
import type { IUserEntity } from "./auth.entities"
import type { IRegisterPayload } from "./auth.types"

export interface IAuthRepository {
  findByEmail(email: string): Promise<IUserEntity | null>
  create(data: IRegisterPayload): Promise<IUserEntity>
}
```

**¿Qué hace este archivo?**

- Define `IAuthRepository` - Contrato del repository que debe implementar la infraestructura
- **`findByEmail(email)`** - Busca usuario por email
- **`create(data)`** - Crea un nuevo usuario

**¿Por qué interfaces?**
- Define el contrato sin importar la implementación
- Permite cambiar de Prisma a otro ORM sin tocar el service
- Facilita testing (mock del repository)

---

### 5.2 Application Layer - Capa de Aplicación

#### `src/modules/auth/application/auth.service.ts` - Lógica de Negocio

```typescript
import { ConflictError, UnauthorizedError } from "@/core/errors/AppError"
import { comparePassword, hashPassword } from "@/core/utils/crypto.utils"
import { generateTokens } from "@/core/utils/token.utils"
import type { IAuthRepository } from "../domain/auth.interface"
import type { IAuthResponse, ILoginPayload, IRegisterPayload } from "../domain/auth.types"
import type { Role } from "@/types/user"

export const createAuthService = (repository: IAuthRepository) => ({
  register: async (data: IRegisterPayload): Promise<IAuthResponse> => {
    const { name, email, password, role = "staff" } = data

    const existingUser = await repository.findByEmail(email)

    if (existingUser) {
      throw new ConflictError("Email already registered")
    }

    const hashedPassword = await hashPassword(password)

    const newUser = { name, email, password: hashedPassword, role }

    const user = await repository.create(newUser)

    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role)

    const response: IAuthResponse = {
      message: "User create successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    }

    return response
  },

  login: async (data: ILoginPayload): Promise<IAuthResponse> => {
    const { email, password } = data

    const user = await repository.findByEmail(email)

    if (!user) {
      throw new UnauthorizedError("Invalid credentials")
    }

    const isValidPassword = await comparePassword(password, user.password)

    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid credentials")
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role as Role)

    const response: IAuthResponse = {
      message: "Login successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    }

    return response
  }
})
```

**¿Qué hace este archivo?**

1. **`createAuthService(repository)`** - Factory function que recibe el repository como parámetro (inyección de dependencias)

2. **`register(data)`** - Lógica de registro:
   - Recibe `data` con name, email, password, role
   - **Step 1**: Busca si el email ya existe en la BD → si existe, lanza `ConflictError`
   - **Step 2**: Hashea el password con bcrypt (10 rounds)
   - **Step 3**: Crea el usuario en la BD usando el repository
   - **Step 4**: Genera access + refresh tokens
   - **Step 5**: Retorna la respuesta con mensaje, usuario y tokens

3. **`login(data)`** - Lógica de login:
   - Recibe `data` con email y password
   - **Step 1**: Busca el usuario por email → si no existe, lanza `UnauthorizedError`
   - **Step 2**: Compara el password con el hash guardado → si no coincide, lanza `UnauthorizedError`
   - **Step 3**: Genera access + refresh tokens
   - **Step 4**: Retorna la respuesta con mensaje, usuario y tokens

**Patrón usado: Dependency Inversion**
- El service depende de la abstracción (`IAuthRepository`), no de la implementación
- El controller inyecta la implementación concreta (`AuthRepository` de Prisma)

---

### 5.3 Infrastructure Layer - Capa de Infraestructura

#### `src/modules/auth/infrastructure/auth.prisma.repository.ts` - Implementación Prisma

```typescript
import { prisma } from "@/config/prisma";
import type { IAuthRepository } from "../domain/auth.interface";
import type { IRegisterPayload } from "../domain/auth.types";

export const AuthRepository: IAuthRepository = {
  async findByEmail(email: string) {
    return await prisma.user.findFirst({
      where: { email, deletedAt: null }
    })
  },

  async create(data: IRegisterPayload) {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role
      }
    })
  }
}
```

**¿Qué hace este archivo?**

1. **Implementa `IAuthRepository`** - Satisface el contrato definido en el domain

2. **`findByEmail(email)`** - Busca usuario por email:
   - Usa `prisma.user.findFirst()`
   - Filtra por `email` Y `deletedAt: null` (soft delete)
   - Retorna `null` si no existe

3. **`create(data)`** - Crea un nuevo usuario:
   - Usa `prisma.user.create()`
   - Recibe: name, email, password (ya hasheado), role

**¿Por qué separado?**
- Si mañana usás MongoDB en vez de PostgreSQL, solo cambiás este archivo
- El service sigue funcionando igual porque usa la interfaz

---

### 5.4 Presentation Layer - Capa de Presentación

#### `src/modules/auth/presentation/auth.dto.ts` - Validación de Input (Zod)

```typescript
import { z } from "zod"

export const RegisterPayloadDtoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "staff"]).optional()
})

export const LoginPayloadDtoSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})
```

**¿Qué hace este archivo?**

1. **`RegisterPayloadDtoSchema`** - Schema de validación para registro:
   - `name`: string, mínimo 2 caracteres
   - `email`: formato válido de email
   - `password`: mínimo 8 caracteres
   - `role`: opcional, solo "admin" o "staff"

2. **`LoginPayloadDtoSchema`** - Schema de validación para login:
   - `email`: formato válido de email
   - `password`: mínimo 8 caracteres

---

#### `src/modules/auth/presentation/auth.controller.ts` - Controlador

```typescript
import type { FastifyReply, FastifyRequest } from "fastify";
import { createAuthService } from "../application/auth.service";
import { AuthRepository } from "../infrastructure/auth.prisma.repository";
import { LoginPayloadDtoSchema, RegisterPayloadDtoSchema } from "./auth.dto";

// Inyección de dependencias: el controller decide qué implementación usar
const authService = createAuthService(AuthRepository)

export const authController = {
  register: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = RegisterPayloadDtoSchema.parse(request.body)
    const result = await authService.register(data)
    return reply.status(201).send(result)
  },

  login: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = LoginPayloadDtoSchema.parse(request.body)
    const result = await authService.login(data)
    return reply.status(200).send(result)
  }
}
```

**¿Qué hace este archivo?**

1. **Inicializa el service** con la implementación del repository:
   - `createAuthService(AuthRepository)` → inyecta la implementación de Prisma
   - Esto permite cambiar la implementación sin tocar el controller

2. **`register(request, reply)`** - Handler del endpoint POST /register:
   - **Step 1**: Valida el body con Zod schema → si falla, lanza error
   - **Step 2**: Llama al service con los datos validados
   - **Step 3**: Retorna 201 Created con el resultado

3. **`login(request, reply)`** - Handler del endpoint POST /login:
   - **Step 1**: Valida el body con Zod schema
   - **Step 2**: Llama al service con los datos validados
   - **Step 3**: Retorna 200 OK con el resultado

**Flujo:**
```
HTTP Request → Controller (valida) → Service (lógica) → Repository (BD) → Response
```

---

#### `src/modules/auth/presentation/auth.routes.ts` - Definición de Rutas

```typescript
import type { FastifyInstance } from "fastify";
import { authController } from "./auth.controller";

export const authRoutes = async (fastify: FastifyInstance, _options: any) => {
  fastify.post("/register", authController.register)
  fastify.post("/login", authController.login)
}
```

**¿Qué hace este archivo?**

1. **Registra rutas de auth** en Fastify:
   - `POST /register` → `authController.register`
   - `POST /login` → `authController.login`

2. **Exporta función asíncrona** que recibe la instancia de Fastify

---

## 6. Presentation Layer Global

### `src/presentation/routes.ts` - Router Principal

```typescript
import { authRoutes } from "@/modules/auth/presentation/auth.routes";
import { type FastifyInstance } from "fastify";

export const routes = async (fastify: FastifyInstance, _option: any) => {
  fastify.register(authRoutes, { prefix: "/auth" })
}
```

**¿Qué hace este archivo?**

1. **Registra las rutas del módulo auth** con prefijo `/auth`
2. **Resultado final**: las rutas quedan en `/api/v1/auth/register` y `/api/v1/auth/login`

**Estructura de prefijos:**
- `app.ts` registra `routes` con prefijo `/api/v1`
- `routes.ts` registra `authRoutes` con prefijo `/auth`
- Total: `/api/v1/auth/register` y `/api/v1/auth/login`

---

## 7. Prisma Schema

### `prisma/schema.prisma` - Modelo de Datos

```prisma
generator client {
    provider = "prisma-client-js"
}

datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
}

enum ROLE {
  admin
  staff
}

model user {
  id String @id @default(uuid())
  email String @unique
  password String
  name String 
  role ROLE @default(staff)
  deletedAt DateTime?
  sales sale[]

  @@index([email])
  @@index([role])
  @@map("users")
}

model medicine {
  id            String   @id @default(uuid())
  trade_name     String
  generic_name   String
  description   String?
  price         Decimal
  stock         Int      @default(0)
  expiry_date    DateTime?
  laboratory_id  String
  category_id    String
  laboratory    lab      @relation(fields: [laboratory_id], references: [id])
  category      category @relation(fields: [category_id], references: [id])
  sale_items     sale_item[]
  deleted_at     DateTime?

  @@index([trade_name])
  @@index([generic_name])
  @@index([laboratory_id])
  @@index([category_id])
  @@map("medicines")
}

model sale {
  id           String     @id @default(uuid())
  date         DateTime   @default(now())
  total        Decimal
  payment_method String
  user_id       String
  client_id     String?
  user         user       @relation(fields: [user_id], references: [id])
  client       client?    @relation(fields: [client_id], references: [id])
  items        sale_item[]

  @@index([date])
  @@index([user_id])
  @@index([client_id])
  @@map("sales")
}

model sale_item {
  id         String   @id @default(uuid())
  sale_id     String
  medicine_id String
  quantity   Int
  unit_price  Decimal
  sale       sale     @relation(fields: [sale_id], references: [id])
  medicine   medicine @relation(fields: [medicine_id], references: [id])

  @@index([sale_id])
  @@index([medicine_id])
  @@map("sale_items")
}

model client {
  id             String   @id @default(uuid())
  name           String
  document_number String   @unique
  email          String?
  phone          String?
  address        String?
  membership     String   @default("bronze")
  deleted_at      DateTime?
  sales          sale[]

  @@index([document_number])
  @@index([email])
  @@map("clients")
}

model lab {
  id        String     @id @default(uuid())
  name      String
  medicines medicine[]
  deleted_at DateTime?

  @@map("labs")
}

model supplier {
  id        String   @id @default(uuid())
  name      String
  contact   String?
  deleted_at DateTime?

  @@map("suppliers")
}

model category {
  id        String     @id @default(uuid())
  name      String
  medicines medicine[]

  @@map("categories")
}
```

**Explicación de las tablas:**

| Modelo | Descripción |
|--------|-------------|
| `user` | Usuarios del sistema (admin/staff). Relación 1:N con sales. Soft delete con `deletedAt`. |
| `medicine` | Medicamentos. Relación N:1 con lab y category. Stock, precio, fecha de vencimiento. |
| `sale` | Ventas realizadas. Relación N:1 con user (vendedor) y client (cliente). |
| `sale_item` | Items de una venta. Relación N:1 con sale y medicine. |
| `client` | Clientes de la farmacia. Membership (bronze/silver/gold). Soft delete. |
| `lab` | Laboratorios farmacéuticos. Soft delete. |
| `supplier` | Proveedores. Soft delete. |
| `category` | Categorías de medicamentos. |

**Características del schema:**

- **UUIDs** - Todos los IDs usan `uuid()` como default
- **Soft deletes** - `deletedAt` o `deleted_at` para no borrar datos
- **Índices** - En campos frecuentemente buscados (email, foreign keys)
- **Enums** - `ROLE` con admin/staff
- **Relaciones** - Claramente definidas con `@relation`
- **Map** - Nombres de tabla personalizados (`@@map`)

---

## 8. Flujo Completo de una Request

### Ejemplo: POST /api/v1/auth/register

```
1. HTTP Request
     ↓
2. server.ts → buildApp() (app.ts)
     ↓
3. Fastify registra plugins (helmet, cors, compress, rate-limit)
     ↓
4. Routing: /api/v1/auth/register
   → routes.ts (/api/v1 prefix)
   → authRoutes.ts (/auth prefix)
   → POST /register → authController.register
     ↓
5. Controller:
   - Valida request.body con RegisterPayloadDtoSchema (Zod)
   - Llama a authService.register(data)
     ↓
6. Service (createAuthService):
   - repository.findByEmail(email) → Busca si existe
   - Si existe → throw ConflictError
   - hashPassword(password) → Hashea el password
   - repository.create(newUser) → Crea en BD
   - generateTokens(user.id, ...) → Genera JWTs
   - Retorna IAuthResponse
     ↓
7. Repository (Prisma):
   - prisma.user.findFirst({ where: {...} })
   - prisma.user.create({ data: {...} })
     ↓
8. Response:
   - HTTP 201 Created
   - { message, user, accessToken, refreshToken }
```

### Ejemplo: POST /api/v1/auth/login

```
1. HTTP Request con { email, password }
     ↓
2. Controller:
   - Valida con LoginPayloadDtoSchema
   - Llama authService.login(data)
     ↓
3. Service:
   - repository.findByEmail(email)
   - Si no existe → throw UnauthorizedError
   - comparePassword(password, user.password)
   - Si no coincide → throw UnauthorizedError
   - generateTokens(user.id, ...) → Genera JWTs
   - Retorna IAuthResponse
     ↓
4. Response:
   - HTTP 200 OK
   - { message, user, accessToken, refreshToken }
```

---

## 9. Commands Útiles

```bash
# Desarrollo (watch mode con tsx)
bun dev

# Generar cliente Prisma
bun prisma:generate

# Hacer migrate de BD
bun prisma:migrate

# Abrir Prisma Studio (UI)
bun prisma:studio

# Build para producción
bun build

# Iniciar producción
bun start
```

---

## 10. Resumen de Patrones Usados

| Patrón | Aplicación |
|--------|------------|
| **Clean Architecture** | Separación en domain/application/infrastructure/presentation |
| **Dependency Inversion** | Service depende de IAuthRepository, no de implementación concreta |
| **Factory Pattern** | `createAuthService(repository)` crea el service con dependencias |
| **Singleton** | `prisma`, `redisClient`, `logger` - una sola instancia global |
| **Error Handling** | Errores custom con statusCode y código interno |
| **Soft Delete** | Campos `deletedAt` en vez de borrar registros |
| **Value Objects** | Zod schemas para validar DTOs en la capa de presentación |


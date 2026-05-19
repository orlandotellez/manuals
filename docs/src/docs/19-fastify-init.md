# Fastify Init - Manual Técnico Completo

Este manual documenta todo el código del proyecto, explicando cada función, configuración e implementación.

---

## Índice

1. [Estructura del Proyecto](#estructura-del-proyecto)
2. [Configuración Principal](#configuración-principal)
3. [Utils y Helpers](#utils-y-helpers)
4. [Errores](#errores)
5. [Módulo Auth](#módulo-auth)
6. [Mappers](#mappers)
7. [Guardia de Autenticación](#guardia-de-autenticación)
8. [Presentation Layer](#presentation-layer)
9. [Cookies y Autenticación](#cookies-y-autenticación)
10. [Prisma Schema](#prisma-schema)
11. [Endpoints](#endpoints)

---

## 1. Estructura del Proyecto

```
src/
├── app.ts                    # Configuración de Fastify (plugins)
├── server.ts                 # Punto de entrada, levanta el servidor
├── config/                   # Configuraciones externas
│   ├── env.ts               # Variables de entorno (validación Zod)
│   ├── prisma.ts            # Cliente Prisma
│   └── redis.ts             # Cliente Redis (caché)
├── core/
│   ├── errors/              # Errores personalizados
│   │   └── AppError.ts
│   ├── guard/               # Guardias de autenticación
│   │   └── auth.guard.ts
│   ├── mappers/             # Mappers transversales
│   │   └── response.mapper.ts
│   └── utils/               # Utilities genéricas
│       ├── crypto.utils.ts  # Hash de passwords, generación de códigos
│       ├── token.utils.ts   # Generación y verificación de JWTs
│       ├── cookie.utils.ts  # Manejo de cookies de auth
│       └── auth.utils.ts    # Utilidades de autenticación
├── types/                    # Tipos globales
│   └── auth.d.ts            # Tipos de autenticación (Role, User, Account, Session, Verification)
├── infrastructure/           # Configuraciones de infraestructura
│   └── logger.ts
└── modules/                  # Módulos de la aplicación
    └── auth/
        ├── domain/          # Contratos, tipos y entidades
        │   ├── auth.interface.ts   # Interfaces del repository (IUserRepository, IAccountRepository, etc.)
        │   ├── auth.types.ts       # Tipos (payload, response)
        │   └── auth.entities.ts    # Entidades del dominio (IUserEntity, IAccountEntity, etc.)
        ├── application/    # Lógica de negocio (services)
        │   └── auth.service.ts
        ├── infrastructure  # Implementaciones (repositories, mappers)
        │   ├── auth.prisma.repository.ts
        │   └── mappers/
        │       └── auth.prisma.mappers.ts
        └── presentation    # Controladores, rutas, DTOs
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
  "type": "module"
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
4. **Event handlers** - Escucha eventos de Redis para logging
5. **Graceful shutdown** - `closeRedis()` para cerrar correctamente
6. **Fallback** - Si Redis falla, la app sigue funcionando

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

**¿Por qué pino?** Es 10x más rápido que otros loggers, soportado por Fastify natively, y produce logs JSON estructurados.

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
import cookie from "@fastify/cookie"
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

  // Cookies - permite usar request.cookies y reply.setCookie()
  await app.register(cookie)

  app.register(routes, { prefix: '/api/v1' });

  app.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() }
  })

  return app
}
```

**¿Qué hace este archivo?**

1. **Logger de Fastify** - Configura logging interno
2. **Inicializa Redis** - `getRedisClient()` para tener listo el cache
3. **Registra plugins de Fastify**:

| Plugin | Función |
|--------|---------|
| `@fastify/helmet` | Headers de seguridad |
| `@fastify/cors` | Cross-Origin Resource Sharing |
| `@fastify/compress` | Compresión gzip de respuestas |
| `@fastify/rate-limit` | Limita requests por IP (100/min) |
| `@fastify/cookie` | Permite leer y escribir cookies |

4. **Routes** - Registra las rutas con prefijo `/api/v1`
5. **Health check** - Endpoint `/health` que retorna `{ status: "ok", timestamp }`

---

## 3. Utils y Helpers

### 3.1 `src/core/utils/crypto.utils.ts` - Funciones de Password y Códigos

```typescript
import bcrypt from "bcrypt"

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10)
}

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export function generateVerificationCode(): string {
  // Generate a 6-character alphanumeric code
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
```

**¿Qué hace este archivo?**

1. **`hashPassword(password)`** - Hashea un password usando bcrypt:
   - Algoritmo: bcrypt
   - Salt rounds: 10
   - Retorna: string hasheado

2. **`comparePassword(password, hash)`** - Compara un password plano con su hash:
   - Retorna: `true` si coincide, `false` si no

3. **`generateVerificationCode()`** - Genera un código alfanumérico de 6 caracteres:
   - Útil para verificación de email, reset de password, 2FA
   - Caracteres: A-Z, 0-9

---

### 3.2 `src/core/utils/token.utils.ts` - Generación de JWTs

```typescript
import { env } from "@/config/env"
import type { Role } from "@/types/auth"
import type { FastifyRequest } from "fastify"
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
    { userId },
    env.JWT_REFRESH_SECRET,
    refreshTokenOptions
  )

  return { accessToken, refreshToken }
}

export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret)
}

export function getRefreshToken(request: FastifyRequest): string {
  const cookieToken = request.cookies.refreshToken
  const body = request.body as Record<string, unknown> | undefined
  const bodyToken = typeof body?.refreshToken === "string" ? body.refreshToken : undefined
  return cookieToken || bodyToken || ""
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

2. **`verifyToken(token, secret)`** - Verifica un token JWT

3. **`getRefreshToken(request)`** - Extrae el refresh token del cookie o del body

**¿Por qué dos tokens?**
- Access token: corto (15 min) → si alguien lo roba, máximo 15 min de acceso
- Refresh token: largo (7 días) → el usuario no tiene que loguearse seguido

---

### 3.3 `src/core/utils/cookie.utils.ts` - Manejo de Cookies de Auth

```typescript
import type { FastifyReply } from "fastify"

export const setAuthCookies = (
  reply: FastifyReply,
  accessToken: string,
  refreshToken: string,
  isProduction: boolean
) => {
  reply.setCookie('accessToken', accessToken, {
    path: '/',
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 900  // 15 minutos
  })
  reply.setCookie('refreshToken', refreshToken, {
    path: '/',
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 604800  // 7 días
  })
}

export const clearAuthCookies = async (reply: FastifyReply) => {
  reply.clearCookie('accessToken', { path: '/' })
  reply.clearCookie('refreshToken', { path: '/' })
}
```

**¿Qué hace este archivo?**

1. **`setAuthCookies(reply, accessToken, refreshToken, isProduction)`** - Setea las cookies de autenticación:
   - `accessToken` - Cookie con el token de acceso (15 min de vida)
   - `refreshToken` - Cookie con el token de refresh (7 días de vida)
   - **Opciones de seguridad**:
     - `httpOnly: true` - JavaScript no puede acceder a la cookie (previene XSS)
     - `secure: true` - Solo se envía por HTTPS (en producción)
     - `sameSite: 'strict'` - Previene CSRF

2. **`clearAuthCookies(reply)`** - Limpia las cookies de autenticación

---

### 3.4 `src/core/utils/auth.utils.ts` - Utilidades de Autenticación

```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { clearAuthCookies } from "./cookie.utils"
import { env } from "@/config/env"
import jwt, { type JwtPayload } from "jsonwebtoken"

export const getUserIdFromCookies = (request: FastifyRequest): string | null => {
  const token = request.cookies.accessToken || request.cookies.refreshToken
  if (!token) return null

  try {
    // Intentar con JWT_SECRET primero (accessToken)
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    return decoded.userId
  } catch {
    // Si falla, intentar con JWT_REFRESH_SECRET (refreshToken)
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload
      return decoded.userId
    } catch {
      return null
    }
  }
}

export const resolveCurrentUserId = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<string | null> => {
  try {
    return getUserIdFromCookies(request)
  } catch {
    await clearAuthCookies(reply)
    return null
  }
}
```

**¿Qué hace este archivo?**

1. **`getUserIdFromCookies(request)`** - Extrae el userId de las cookies:
   - Obtiene el token de `request.cookies.accessToken` o `request.cookies.refreshToken`
   - Intenta verificar con `JWT_SECRET` (para accessToken)
   - Si falla, intenta con `JWT_REFRESH_SECRET` (para refreshToken)
   - Retorna el `userId` del payload o `null` si no es válido

2. **`resolveCurrentUserId(request, reply)`** - Resuelve el usuario actual de forma segura

**¿Para qué sirve?**
- Validar si un usuario ya tiene sesión activa antes de login/register
- Proteger el endpoint de logout (solo usuarios autenticados)
- Detectar si el usuario que hace login es el mismo que ya tiene sesión

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
   - Agrega: `statusCode` (HTTP status), `code` (error code interno), `isOperational`

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

---

## 5. Tipos de Auth

### 5.1 `src/types/auth.d.ts` - Tipos Globales de Autenticación

```typescript
import type { account, session, user, verification } from "@prisma/client"

export type Role = "admin" | "staff"

export interface User extends user {
  id: string
  name: string
  email: string
  email_verified: boolean
  phone?: string
  image?: string
  role: Role
  created_at: Date
  updated_at: Date
  deleted_at?: Date
}

export interface Account extends account {
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

export interface Session extends session {
  id: string
  expires_at: Date
  token: string
  ip_address?: string
  user_agent?: string
  user_id: string
  created_at: Date
  updated_at: Date
}

export interface Verification extends verification {
  id: string
  identifier: string
  value: string
  expires_at: Date
  created_at: Date
  updated_at: Date
}
```

**¿Qué hace este archivo?**

- Define `Role` - Union type con los roles posibles del sistema (admin/staff)
- Extiende los tipos de Prisma con campos adicionales
- Proporciona tipos limpios para usar en toda la aplicación

---

## 6. Guardia de Autenticación

### 6.1 `src/core/guard/auth.guard.ts` - Guardia para Rutas Protegidas

```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { UnauthorizedError } from "@/core/errors/AppError"
import { getUserIdFromCookies } from "../utils/auth.utils"

declare module "fastify" {
  interface FastifyRequest {
    userId?: string
  }
}

export const authGuard = async (
  request: FastifyRequest,
  _reply: FastifyReply
) => {
  const userId = getUserIdFromCookies(request)

  if (!userId) {
    throw new UnauthorizedError("Authentication required")
  }

  request.userId = userId
}
```

**¿Qué hace este archivo?**

1. **Declara `userId` en FastifyRequest** - Agrega propiedad personalizada al request
2. **`authGuard(request, reply)`** - Middleware de autenticación:
   - Extrae el userId de las cookies
   - Si no existe, lanza `UnauthorizedError`
   - Si existe, lo agrega al request como `request.userId`

**¿Para qué sirve?**
- Proteger rutas que requieren autenticación
- Agregar el userId al request para usarlo en los handlers

---

## 7. Mappers

### 7.1 `src/modules/auth/infrastructure/mappers/auth.prisma.mappers.ts` - Mappers de Prisma

```typescript
import type { Role } from "@/types/auth"
import type { IAccountEntity, ISessionEntity, IUserEntity, IVerificationEntity } from "../../domain/auth.entities"
import type { account, session, user, verification } from "@prisma/client"

export function mapPrismaUserToEntity(user: user): IUserEntity {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    email_verified: user.email_verified,
    phone: user.phone || undefined,
    image: user.image || undefined,
    role: user.role as Role,
    created_at: user.created_at,
    updated_at: user.updated_at,
    deleted_at: user.deleted_at || undefined
  }
}

export function mapPrismaAccountToEntity(account: account): IAccountEntity {
  return {
    id: account.id,
    account_id: account.account_id,
    provider_id: account.provider_id,
    user_id: account.user_id || undefined,
    access_token: account.access_token || undefined,
    refresh_token: account.refresh_token || undefined,
    id_token: account.id_token || undefined,
    access_token_expires_at: account.access_token_expires_at || undefined,
    refresh_token_expires_at: account.refresh_token_expires_at || undefined,
    scope: account.scope || undefined,
    password: account.password || undefined,
    created_at: account.created_at,
    updated_at: account.updated_at
  }
}

export function mapPrismaSessionToEntity(session: session): ISessionEntity {
  return {
    id: session.id,
    expires_at: session.expires_at,
    token: session.token,
    ip_address: session.ip_address || undefined,
    user_agent: session.user_agent || undefined,
    user_id: session.user_id,
    created_at: session.created_at,
    updated_at: session.updated_at
  }
}

export function mapPrismaVerificationToEntity(verification: verification): IVerificationEntity {
  return {
    id: verification.id,
    identifier: verification.identifier,
    value: verification.value,
    expires_at: verification.expires_at,
    created_at: verification.created_at,
    updated_at: verification.updated_at
  }
}
```

**¿Qué hacen estos mappers?**

1. **Convierten tipos de Prisma a entidades del dominio**
2. **Normalizan `null` a `undefined`** - Prisma devuelve `null`, el dominio usa `undefined` para campos opcionales
3. **Se usan en el repository** para transformar los datos de la BD antes de retornarlos al service

---

### 7.2 `src/core/mappers/response.mapper.ts` - Mapper de Respuesta

```typescript
import type { Role, User } from "@/types/auth";

export function mapUserToResponse(user: User): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    email_verified: user.email_verified,
    role: user.role as Role,
    phone: user.phone || undefined,
    image: user.image || undefined,
    created_at: user.created_at,
    updated_at: user.updated_at,
    deleted_at: user.deleted_at || undefined
  }
}
```

**¿Qué hace este archivo?**

- Transforma la entidad de usuario para la respuesta de la API
- Normaliza `null` a `undefined`
- Se usa en los controllers para formatear la respuesta

---

## 8. Módulo Auth

El módulo de autenticación sigue una arquitectura limpia (Clean Architecture) con separación en capas:

```
src/modules/auth/
├── domain/           # Contratos e interfaces
├── application/      # Lógica de negocio
├── infrastructure/   # Implementaciones (Prisma)
└── presentation/     # Controladores, rutas, DTOs
```

### 8.1 Domain Layer - Capa de Dominio

La capa de dominio contiene los contratos y tipos puros, sin dependencias de frameworks.

#### `src/modules/auth/domain/auth.entities.ts` - Entidades

```typescript
import type { Role } from "@/types/user"

export interface IUserEntity {
  id: string
  name: string
  email: string
  email_verified: boolean
  phone?: string
  image?: string
  role: Role
  created_at: Date
  updated_at: Date
  deleted_at?: Date
}

export interface IAccountEntity {
  id: string
  account_id: string
  provider_id: string  // "credentials", "google", "github", etc.
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
  identifier: string  // email o "reset:email"
  value: string       // código de verificación
  expires_at: Date
  created_at: Date
  updated_at: Date
}

// Tipos para crear/actualizar
export type CreateUserData = Pick<IUserEntity, "name" | "email" | "role"> & {
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
```

**¿Qué hace este archivo?**

- Define las interfaces de las entidades del dominio
- Cada entidad representa una tabla en la BD
- Define tipos para crear y actualizar datos

---

#### `src/modules/auth/domain/auth.types.ts` - Tipos de Payload y Response

```typescript
import type { Role } from "@/types/user"

// ==================
// USER TYPES
// ==================

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
  identifier: string // email
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

// ==================
// RESPONSE TYPES
// ==================

export interface IUserResponse {
  id: string
  name: string
  email: string
  email_verified: boolean
  role: Role
  phone?: string
  image?: string
  created_at: Date
  updated_at: Date
}

export interface IAuthResponse {
  message: string
  user: IUserResponse
  accessToken: string
  refreshToken: string
}

export interface IRefreshResponse {
  message: string
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

// ==================
// SESSION TYPES
// ==================

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
```

**¿Qué hace este archivo?**

- Define los tipos de payloads (datos de entrada)
- Define los tipos de responses (datos de salida)
- Todos los tipos son independientes de la implementación

---

#### `src/modules/auth/domain/auth.interface.ts` - Interfaces del Repository

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
  CreateVerificationData
} from "./auth.entities"

// ==================
// USER REPOSITORY
// ==================

export interface IUserRepository {
  findByEmail(email: string): Promise<IUserEntity | null>
  findById(id: string): Promise<IUserEntity | null>
  create(data: CreateUserData): Promise<IUserEntity>
  update(id: string, data: UpdateUserData): Promise<IUserEntity>
  softDelete(id: string): Promise<void>
}

// ==================
// ACCOUNT REPOSITORY
// ==================

export interface IAccountRepository {
  findByProviderAndAccountId(providerId: string, accountId: string): Promise<IAccountEntity | null>
  findByUserId(userId: string): Promise<IAccountEntity[]>
  findCredentialsAccountByEmail(email: string): Promise<IAccountEntity | null>
  create(data: CreateAccountData): Promise<IAccountEntity>
  update(id: string, data: Partial<CreateAccountData>): Promise<IAccountEntity>
  delete(id: string): Promise<void>
  deleteByUserId(userId: string): Promise<void>
}

// ==================
// SESSION REPOSITORY
// ==================

export interface ISessionRepository {
  create(data: CreateSessionData): Promise<ISessionEntity>
  findByToken(token: string): Promise<ISessionEntity | null>
  findByUserId(userId: string): Promise<ISessionEntity[]>
  delete(token: string): Promise<void>
  deleteByUserId(userId: string): Promise<void>
  deleteExpiredSessions(): Promise<number>
}

// ==================
// VERIFICATION REPOSITORY
// ==================

export interface IVerificationRepository {
  create(data: CreateVerificationData): Promise<IVerificationEntity>
  findByIdentifier(identifier: string): Promise<IVerificationEntity | null>
  findByIdentifierAndValue(identifier: string, value: string): Promise<IVerificationEntity | null>
  delete(id: string): Promise<void>
  deleteByIdentifier(identifier: string): Promise<void>
  deleteExpired(): Promise<number>
}

// ==================
// COMBINED AUTH REPOSITORY (convenience)
// ==================

export interface IAuthRepository {
  // User
  user: IUserRepository
  // Account
  account: IAccountRepository
  // Session
  session: ISessionRepository
  // Verification
  verification: IVerificationRepository
}
```

**¿Qué hace este archivo?**

- Define las interfaces del repository para cada entidad
- **`IUserRepository`** - Métodos para usuarios
- **`IAccountRepository`** - Métodos para cuentas (OAuth, credentials)
- **`ISessionRepository`** - Métodos para sesiones
- **`IVerificationRepository`** - Métodos para verificaciones (email, password)
- **`IAuthRepository`** - Combinación de todos los repositorios

**¿Por qué interfaces?**
- Define el contrato sin importar la implementación
- Permite cambiar de Prisma a otro ORM sin tocar el service
- Facilita testing (mock del repository)

---

### 8.2 Application Layer - Capa de Aplicación

#### `src/modules/auth/application/auth.service.ts` - Lógica de Negocio

```typescript
import { ConflictError, NotFoundError, UnauthorizedError } from "@/core/errors/AppError"
import { comparePassword, hashPassword } from "@/core/utils/crypto.utils"
import { generateTokens, verifyToken } from "@/core/utils/token.utils"
import type { IAuthRepository } from "../domain/auth.interface"
import type {
  IAuthResponse,
  IRefreshResponse,
  IVerificationResponse,
  ILogoutResponse,
  IUserResponse,
  IUserSessionsResponse,
  ISessionResponse,
  IVerifyEmailResponse,
  IForgotPasswordResponse,
  IResetPasswordResponse
} from "../domain/auth.types"
import type { Role } from "@/types/user"
import { env } from "@/config/env"

// HELPER FUNCTIONS

function generateVerificationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Token expiration times
const ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000 // 15 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 days
const VERIFICATION_CODE_EXPIRY = 15 * 60 * 1000 // 15 minutes
const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 days

export const createAuthService = (repository: IAuthRepository) => ({
  // ==================
  // REGISTER
  // ==================
  register: async (data: RegisterPayloadDto): Promise<IAuthResponse> => {
    const { name, email, password, role = "staff" } = data

    // Check if user already exists
    const existingUser = await repository.user.findByEmail(email)
    if (existingUser) {
      throw new ConflictError("Email already registered")
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user (not verified yet)
    const user = await repository.user.create({
      name,
      email,
      role,
      email_verified: false
    })

    // Create credentials account with password
    await repository.account.create({
      account_id: user.id,
      provider_id: "credentials",
      user_id: user.id,
      password: hashedPassword
    })

    // Generate verification code
    const verificationCode = generateVerificationCode()
    await repository.verification.create({
      identifier: email,
      value: verificationCode,
      expiresAt: new Date(Date.now() + VERIFICATION_CODE_EXPIRY)
    })

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role as Role)

    // Create session in DB
    await repository.session.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + SESSION_EXPIRY)
    })

    const response: IAuthResponse = {
      message: "User created successfully. Please verify your email.",
      user: mapUserToResponse(user),
      accessToken,
      refreshToken
    }

    return response
  },

  // ==================
  // LOGIN
  // ==================
  login: async (data: ILoginPayload): Promise<IAuthResponse> => {
    const { email, password } = data

    // Find the credentials account for this email
    const account = await repository.account.findCredentialsAccountByEmail(email)
    if (!account) {
      throw new UnauthorizedError("Invalid credentials")
    }

    // Verify password
    if (!account.password) {
      throw new UnauthorizedError("Invalid credentials")
    }
    const isValidPassword = await comparePassword(password, account.password)
    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid credentials")
    }

    // Get the user
    const user = await repository.user.findById(account.user_id!)
    if (!user) {
      throw new UnauthorizedError("User not found")
    }

    // If user is soft deleted, reject
    if (user.deleted_at) {
      throw new UnauthorizedError("Account has been deactivated")
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role as Role)

    // Create session in DB
    await repository.session.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + SESSION_EXPIRY)
    })

    const response: IAuthResponse = {
      message: "Login successfully",
      user: mapUserToResponse(user),
      accessToken,
      refreshToken
    }

    return response
  },

  // ==================
  // LOGOUT
  // ==================
  logout: async (refreshToken: string): Promise<ILogoutResponse> => {
    // Delete the session from DB
    await repository.session.delete(refreshToken)

    return {
      message: "Logged out successfully"
    }
  },

  // ==================
  // REFRESH
  // ==================
  refresh: async (refreshToken: string): Promise<IRefreshResponse> => {
    let payload: { userId: string }

    try {
      payload = verifyToken(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string }
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token")
    }

    // Find session in DB
    const session = await repository.session.findByToken(refreshToken)
    if (!session) {
      throw new UnauthorizedError("Invalid refresh token")
    }

    // Check if session is expired
    if (session.expires_at < new Date()) {
      await repository.session.delete(refreshToken)
      throw new UnauthorizedError("Session expired")
    }

    // Get user
    const user = await repository.user.findById(payload.userId)
    if (!user) {
      throw new UnauthorizedError("User not found")
    }

    // Delete old session
    await repository.session.delete(refreshToken)

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user.id,
      user.email,
      user.role as Role
    )

    // Create new session in DB
    await repository.session.create({
      userId: user.id,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + SESSION_EXPIRY)
    })

    return {
      message: "Token refreshed successfully",
      accessToken,
      refreshToken: newRefreshToken
    }
  },

  // ==================
  // VERIFY EMAIL
  // ==================
  verifyEmail: async (data: IVerifyEmailPayload): Promise<IVerifyEmailResponse> => {
    const { identifier, code } = data

    // Find verification code
    const verification = await repository.verification.findByIdentifierAndValue(
      identifier,
      code
    )

    if (!verification) {
      throw new UnauthorizedError("Invalid verification code")
    }

    // Check if expired
    if (verification.expires_at < new Date()) {
      await repository.verification.deleteByIdentifier(identifier)
      throw new UnauthorizedError("Verification code expired")
    }

    // Find and update user
    const user = await repository.user.findByEmail(identifier)
    if (!user) {
      throw new NotFoundError("User not found")
    }

    // Mark email as verified
    await repository.user.update(user.id, { email_verified: true })

    // Delete verification code
    await repository.verification.deleteByIdentifier(identifier)

    // Generate new tokens (user is now verified)
    const { accessToken, refreshToken } = generateTokens(
      user.id,
      user.email,
      user.role as Role
    )

    // Create new session
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

  // ==================
  // FORGOT PASSWORD
  // ==================
  forgotPassword: async (data: IForgotPasswordPayload): Promise<IForgotPasswordResponse> => {
    const { email } = data

    // Check if user exists
    const user = await repository.user.findByEmail(email)
    if (!user) {
      // Don't reveal if user exists or not
      return {
        message: "If the email exists, a reset code has been sent",
        expires_at: new Date(Date.now() + VERIFICATION_CODE_EXPIRY)
      }
    }

    // Generate reset code
    const resetCode = generateVerificationCode()
    await repository.verification.create({
      identifier: `reset:${email}`,
      value: resetCode,
      expiresAt: new Date(Date.now() + VERIFICATION_CODE_EXPIRY)
    })

    // TODO: Send email with reset code
    console.log(`Password reset code for ${email}: ${resetCode}`)

    return {
      message: "If the email exists, a reset code has been sent",
      expires_at: new Date(Date.now() + VERIFICATION_CODE_EXPIRY)
    }
  },

  // ==================
  // RESET PASSWORD
  // ==================
  resetPassword: async (data: IResetPasswordPayload): Promise<IResetPasswordResponse> => {
    const { email, code, newPassword } = data

    // Find verification
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

    // Find user and account
    const user = await repository.user.findByEmail(email)
    if (!user) {
      throw new NotFoundError("User not found")
    }

    // Find credentials account
    const account = await repository.account.findCredentialsAccountByEmail(email)
    if (!account) {
      throw new NotFoundError("Account not found")
    }

    // Hash new password and update
    const hashedPassword = await hashPassword(newPassword)
    await repository.account.update(account.id, { password: hashedPassword })

    // Delete all user sessions (force logout all devices)
    await repository.session.deleteByUserId(user.id)

    // Delete verification code
    await repository.verification.deleteByIdentifier(`reset:${email}`)

    return {
      message: "Password reset successfully. Please login with your new password."
    }
  },

  // ==================
  // GET USER SESSIONS
  // ==================
  getUserSessions: async (userId: string): Promise<IUserSessionsResponse> => {
    const sessions = await repository.session.findByUserId(userId)

    // Filter out expired sessions
    const validSessions: ISessionResponse[] = sessions
      .filter(s => s.expires_at > new Date())
      .map(s => ({
        id: s.id,
        expires_at: s.expires_at,
        ip_address: s.ip_address,
        user_agent: s.user_agent,
        created_at: s.created_at,
        updated_at: s.updated_at
      }))

    return {
      sessions: validSessions
    }
  },

  // ==================
  // REVOKE SESSION
  // ==================
  revokeSession: async (userId: string, sessionId: string): Promise<ILogoutResponse> => {
    const sessions = await repository.session.findByUserId(userId)
    const session = sessions.find(s => s.id === sessionId)

    if (!session) {
      throw new NotFoundError("Session not found")
    }

    await repository.session.delete(session.token)

    return {
      message: "Session revoked successfully"
    }
  },

  // ==================
  // RESEND VERIFICATION EMAIL
  // ==================
  resendVerification: async (email: string): Promise<IVerificationResponse> => {
    const user = await repository.user.findByEmail(email)

    if (!user) {
      // Don't reveal if user exists
      return {
        message: "If the email exists, a new verification code has been sent",
        expiresAt: new Date(Date.now() + VERIFICATION_CODE_EXPIRY)
      }
    }

    if (user.email_verified) {
      throw new ConflictError("Email already verified")
    }

    // Delete old verification if exists
    await repository.verification.deleteByIdentifier(email)

    // Generate new code
    const verificationCode = generateVerificationCode()
    await repository.verification.create({
      identifier: email,
      value: verificationCode,
      expiresAt: new Date(Date.now() + VERIFICATION_CODE_EXPIRY)
    })

    // TODO: Send email
    console.log(`Verification code for ${email}: ${verificationCode}`)

    return {
      message: "New verification code sent",
      expiresAt: new Date(Date.now() + VERIFICATION_CODE_EXPIRY)
    }
  }
})

// HELPER FUNCTIONS
function mapUserToResponse(user: any): IUserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    email_verified: user.email_verified,
    role: user.role as Role,
    phone: user.phone,
    image: user.image,
    created_at: user.createdAt,
    updated_at: user.updatedAt
  }
}
```

**¿Qué hace este archivo?**

El service contiene toda la lógica de negocio de autenticación:

1. **`register(data)`** - Registro de usuario:
   - Verifica si el email ya existe
   - Crea usuario con `email_verified: false`
   - Crea cuenta con provider "credentials" y password hasheado
   - Genera código de verificación
   - Crea sesión en la BD

2. **`login(data)`** - Login con credentials:
   - Busca la cuenta por email
   - Verifica el password
   - Valida que el usuario no esté soft-deleted
   - Crea sesión en la BD

3. **`logout(refreshToken)`** - Logout:
   - Elimina la sesión de la BD

4. **`refresh(refreshToken)`** - Refresh de tokens:
   - Verifica el token
   - Valida la sesión en la BD
   - Genera nuevos tokens
   - Recrea la sesión

5. **`verifyEmail(data)`** - Verificación de email:
   - Valida el código de verificación
   - Marca `email_verified: true`
   - Genera nuevos tokens

6. **`forgotPassword(email)`** - Olvidé mi password:
   - Genera código de verificación para reset

7. **`resetPassword(data)`** - Reset de password:
   - Valida el código
   - Actualiza el password
   - Elimina todas las sesiones (logout de todos los dispositivos)

8. **`getUserSessions(userId)`** - Ver sesiones activas:
   - Lista todas las sesiones del usuario

9. **`revokeSession(userId, sessionId)`** - Revocar sesión:
   - Elimina una sesión específica

10. **`resendVerification(email)`** - Reenviar código de verificación

---

### 8.3 Infrastructure Layer - Capa de Infraestructura

#### `src/modules/auth/infrastructure/auth.prisma.repository.ts` - Implementación Prisma

```typescript
import { prisma } from "@/config/prisma"
import type { Role } from "@/types/user"
import type {
  IAuthRepository,
  IUserRepository,
  IAccountRepository,
  ISessionRepository,
  IVerificationRepository
} from "../domain/auth.interface"
import type {
  IUserEntity,
  IAccountEntity,
  ISessionEntity,
  IVerificationEntity,
  CreateUserData,
  UpdateUserData,
  CreateAccountData,
  CreateSessionData,
  CreateVerificationData
} from "../domain/auth.entities"
import {
  mapPrismaUserToEntity,
  mapPrismaAccountToEntity,
  mapPrismaSessionToEntity,
  mapPrismaVerificationToEntity
} from "./mappers/auth.prisma.mappers"

// ==================
// USER REPOSITORY
// ==================

const UserRepository: IUserRepository = {
  async findByEmail(email: string): Promise<IUserEntity | null> {
    const user = await prisma.user.findFirst({
      where: { email, deleted_at: null }
    })
    if (!user) return null
    return mapPrismaUserToEntity(user)
  },

  async findById(id: string): Promise<IUserEntity | null> {
    const user = await prisma.user.findFirst({
      where: { id, deleted_at: null }
    })
    if (!user) return null
    return mapPrismaUserToEntity(user)
  },

  async create(data: CreateUserData): Promise<IUserEntity> {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        image: data.image,
        role: data.role || "staff",
        email_verified: data.email_verified || false
      }
    })
    return mapPrismaUserToEntity(user)
  },

  async update(id: string, data: UpdateUserData): Promise<IUserEntity> {
    const user = await prisma.user.update({
      where: { id },
      data: data
    })
    return mapPrismaUserToEntity(user)
  },

  async softDelete(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { deleted_at: new Date() }
    })
  }
}

// ==================
// ACCOUNT REPOSITORY
// ==================

const AccountRepository: IAccountRepository = {
  async findByProviderAndAccountId(
    providerId: string,
    accountId: string
  ): Promise<IAccountEntity | null> {
    const account = await prisma.account.findFirst({
      where: { provider_id: providerId, account_id: accountId }
    })
    if (!account) return null
    return mapPrismaAccountToEntity(account)
  },

  async findByUserId(userId: string): Promise<IAccountEntity[]> {
    const accounts = await prisma.account.findMany({
      where: { user_id: userId }
    })
    return accounts.map(mapPrismaAccountToEntity)
  },

  async findCredentialsAccountByEmail(email: string): Promise<IAccountEntity | null> {
    // First find the user by email
    const user = await prisma.user.findFirst({
      where: { email, deleted_at: null }
    })
    if (!user) return null

    // Then find the credentials account for that user
    const account = await prisma.account.findFirst({
      where: {
        user_id: user.id,
        provider_id: "credentials"
      }
    })
    if (!account) return null
    return mapPrismaAccountToEntity(account)
  },

  async create(data: CreateAccountData): Promise<IAccountEntity> {
    const account = await prisma.account.create({
      data: {
        account_id: data.account_id,
        provider_id: data.provider_id,
        user_id: data.user_id,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        id_token: data.id_token,
        access_token_expires_at: data.access_token_expires_at,
        refresh_token_expires_at: data.refresh_token_expires_at,
        scope: data.scope,
        password: data.password
      }
    })
    return mapPrismaAccountToEntity(account)
  },

  async update(
    id: string,
    data: Partial<CreateAccountData>
  ): Promise<IAccountEntity> {
    const account = await prisma.account.update({
      where: { id },
      data: data
    })
    return mapPrismaAccountToEntity(account)
  },

  async delete(id: string): Promise<void> {
    await prisma.account.delete({ where: { id } })
  },

  async deleteByUserId(userId: string): Promise<void> {
    await prisma.account.deleteMany({ where: { user_id: userId } })
  }
}

// ==================
// SESSION REPOSITORY
// ==================

const SessionRepository: ISessionRepository = {
  async create(data: CreateSessionData): Promise<ISessionEntity> {
    const session = await prisma.session.create({
      data: {
        user_id: data.userId,
        token: data.token,
        expires_at: data.expiresAt,
        ip_address: data.ipAddress,
        user_agent: data.userAgent
      }
    })
    return mapPrismaSessionToEntity(session)
  },

  async findByToken(token: string): Promise<ISessionEntity | null> {
    const session = await prisma.session.findFirst({
      where: { token }
    })
    if (!session) return null
    return mapPrismaSessionToEntity(session)
  },

  async findByUserId(userId: string): Promise<ISessionEntity[]> {
    const sessions = await prisma.session.findMany({
      where: { user_id: userId }
    })
    return sessions.map(mapPrismaSessionToEntity)
  },

  async delete(token: string): Promise<void> {
    await prisma.session.deleteMany({ where: { token } })
  },

  async deleteByUserId(userId: string): Promise<void> {
    await prisma.session.deleteMany({ where: { user_id: userId } })
  },

  async deleteExpiredSessions(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: { expires_at: { lt: new Date() } }
    })
    return result.count
  }
}

// ==================
// VERIFICATION REPOSITORY
// ==================

const VerificationRepository: IVerificationRepository = {
  async create(data: CreateVerificationData): Promise<IVerificationEntity> {
    // Delete any existing verification for this identifier first
    await prisma.verification.deleteMany({
      where: { identifier: data.identifier }
    })

    const verification = await prisma.verification.create({
      data: {
        identifier: data.identifier,
        value: data.value,
        expires_at: data.expiresAt
      }
    })
    return mapPrismaVerificationToEntity(verification)
  },

  async findByIdentifier(identifier: string): Promise<IVerificationEntity | null> {
    const verification = await prisma.verification.findFirst({
      where: { identifier }
    })
    if (!verification) return null
    return mapPrismaVerificationToEntity(verification)
  },

  async findByIdentifierAndValue(
    identifier: string,
    value: string
  ): Promise<IVerificationEntity | null> {
    const verification = await prisma.verification.findFirst({
      where: { identifier, value }
    })
    if (!verification) return null
    return mapPrismaVerificationToEntity(verification)
  },

  async delete(id: string): Promise<void> {
    await prisma.verification.delete({ where: { id } })
  },

  async deleteByIdentifier(identifier: string): Promise<void> {
    await prisma.verification.deleteMany({ where: { identifier } })
  },

  async deleteExpired(): Promise<number> {
    const result = await prisma.verification.deleteMany({
      where: { expires_at: { lt: new Date() } }
    })
    return result.count
  }
}

// ==================
// COMBINED REPOSITORY
// ==================

export const AuthRepository: IAuthRepository = {
  user: UserRepository,
  account: AccountRepository,
  session: SessionRepository,
  verification: VerificationRepository
}
```

**¿Qué hace este archivo?**

- Implementa las 4 interfaces del repository
- Usa Prisma para interacturar con la BD
- Usa los mappers para transformar datos de Prisma a entidades del dominio
- Maneja las 4 tablas: `user`, `account`, `session`, `verification`

---

### 8.4 Presentation Layer - Capa de Presentación

#### `src/modules/auth/presentation/auth.dto.ts` - Validación de Input (Zod)

```typescript
import { z } from "zod"

// ==================
// AUTH DTOs
// ==================

export const RegisterPayloadDtoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "staff"]).optional()
})

export const LoginPayloadDtoSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters")
})

// ==================
// VERIFICATION DTOs
// ==================

export const VerifyEmailDtoSchema = z.object({
  identifier: z.string().email("Invalid email format"),
  code: z.string().min(6, "Verification code must be at least 6 characters")
})

export const ResendVerificationDtoSchema = z.object({
  email: z.string().email("Invalid email format")
})

// ==================
// PASSWORD RESET DTOs
// ==================

export const ForgotPasswordDtoSchema = z.object({
  email: z.string().email("Invalid email format")
})

export const ResetPasswordDtoSchema = z.object({
  email: z.string().email("Invalid email format"),
  code: z.string().min(6, "Reset code must be at least 6 characters"),
  newPassword: z.string().min(8, "Password must be at least 8 characters")
})

// ==================
// SESSION DTOs
// ==================

export const RefreshTokenDtoSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required")
})

export const RevokeSessionDtoSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID")
})

// ==================
// TYPE EXPORTS
// ==================

export type RegisterPayloadDto = z.infer<typeof RegisterPayloadDtoSchema>
export type LoginPayloadDto = z.infer<typeof LoginPayloadDtoSchema>
export type VerifyEmailDto = z.infer<typeof VerifyEmailDtoSchema>
export type ResendVerificationDto = z.infer<typeof ResendVerificationDtoSchema>
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordDtoSchema>
export type ResetPasswordDto = z.infer<typeof ResetPasswordDtoSchema>
export type RefreshTokenDto = z.infer<typeof RefreshTokenDtoSchema>
export type RevokeSessionDto = z.infer<typeof RevokeSessionDtoSchema>
```

**¿Qué hace este archivo?**

- Define schemas de validación Zod para cada endpoint
- Exporta los tipos inferidos de los schemas

---

#### `src/modules/auth/presentation/auth.controller.ts` - Controlador

```typescript
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { createAuthService } from "../application/auth.service"
import { AuthRepository } from "../infrastructure/auth.prisma.repository"
import {
  LoginPayloadDtoSchema,
  RegisterPayloadDtoSchema,
  VerifyEmailDtoSchema,
  ForgotPasswordDtoSchema,
  ResetPasswordDtoSchema,
  ResendVerificationDtoSchema,
  RefreshTokenDtoSchema,
  RevokeSessionDtoSchema
} from "./auth.dto"
import { env } from "@/config/env"
import { clearAuthCookies, setAuthCookies } from "@/core/utils/cookie.utils"
import { ConflictError, UnauthorizedError, BadRequestError } from "@/core/errors/AppError"
import { resolveCurrentUserId, getUserIdFromCookies } from "@/core/utils/auth.utils"

// Inyección de dependencias: el controller decide qué implementación usar
const authService = createAuthService(AuthRepository)

// Helper para obtener refresh token del cookie o body
function getRefreshToken(request: FastifyRequest): string {
  const cookieToken = request.cookies.refreshToken
  const body = request.body as Record<string, unknown> | undefined
  const bodyToken = typeof body?.refreshToken === "string" ? body.refreshToken : undefined
  return cookieToken || bodyToken || ""
}

export const authController = {
  // ==================
  // REGISTER
  // ==================
  register: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = RegisterPayloadDtoSchema.parse(request.body)

    const currentUserId = await resolveCurrentUserId(request, reply)

    if (currentUserId) {
      throw new ConflictError(
        "Already logged in. Please logout before creating a new account."
      )
    }

    const result = await authService.register(data)

    setAuthCookies(
      reply,
      result.accessToken,
      result.refreshToken,
      env.NODE_ENV === "production"
    )

    const response = {
      message: result.message,
      user: result.user
    }

    return reply.status(201).send(response)
  },

  // ==================
  // LOGIN
  // ==================
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

    setAuthCookies(reply, result.accessToken, result.refreshToken, env.NODE_ENV === "production")

    const response = {
      message: result.message,
      user: result.user
    }

    return reply.status(200).send(response)
  },

  // ==================
  // LOGOUT
  // ==================
  logout: async (request: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = getRefreshToken(request)

    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token required")
    }

    const result = await authService.logout(refreshToken)

    clearAuthCookies(reply)

    return reply.status(200).send(result)
  },

  // ==================
  // REFRESH
  // ==================
  refresh: async (request: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = getRefreshToken(request)

    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token required")
    }

    const result = await authService.refresh(refreshToken)

    setAuthCookies(reply, result.accessToken, result.refreshToken, env.NODE_ENV === "production")

    const response = {
      message: result.message
    }

    return reply.status(200).send(response)
  },

  // ==================
  // VERIFY EMAIL
  // ==================
  verifyEmail: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = VerifyEmailDtoSchema.parse(request.body)

    const result = await authService.verifyEmail(data)

    setAuthCookies(reply, result.accessToken, result.refreshToken, env.NODE_ENV === "production")

    const response = {
      message: result.message
    }

    return reply.status(200).send(response)
  },

  // ==================
  // RESEND VERIFICATION
  // ==================
  resendVerification: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = ResendVerificationDtoSchema.parse(request.body)

    const result = await authService.resendVerification(data.email)

    const response = {
      message: result.message
    }

    return reply.status(200).send(response)
  },

  // ==================
  // FORGOT PASSWORD
  // ==================
  forgotPassword: async (request: FastifyRequest, reply: FastifyReply) => {
    // Check if user is already logged in
    const currentUserId = await resolveCurrentUserId(request, reply)
    if (currentUserId) {
      throw new ConflictError("Please logout before requesting password reset")
    }

    const data = ForgotPasswordDtoSchema.parse(request.body)

    const result = await authService.forgotPassword(data)

    return reply.status(200).send(result)
  },

  // ==================
  // RESET PASSWORD
  // ==================
  resetPassword: async (request: FastifyRequest, reply: FastifyReply) => {
    // Check if user is already logged in
    const currentUserId = await resolveCurrentUserId(request, reply)
    if (currentUserId) {
      throw new ConflictError("Please logout before resetting password")
    }

    const data = ResetPasswordDtoSchema.parse(request.body)

    const result = await authService.resetPassword(data)

    clearAuthCookies(reply)

    return reply.status(200).send(result)
  },

  // ==================
  // GET USER SESSIONS (Protected)
  // ==================
  getUserSessions: async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = await resolveCurrentUserId(request, reply)

    if (!userId) {
      throw new UnauthorizedError("Authentication required")
    }

    const result = await authService.getUserSessions(userId)

    return reply.status(200).send(result)
  },

  // ==================
  // REVOKE SESSION (Protected)
  // ==================
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

**¿Qué hace este archivo?**

- Maneja todos los endpoints de autenticación
- Valida los datos de entrada con Zod
- Gestiona las cookies de autenticación
- Delega la lógica al service

---

#### `src/modules/auth/presentation/auth.routes.ts` - Definición de Rutas

```typescript
import type { FastifyInstance } from "fastify"
import { authController } from "./auth.controller"
import { authGuard } from "@/core/guard/auth.guard"

export const authRoutes = async (fastify: FastifyInstance, _options: any) => {
  // PUBLIC ROUTES
  // Auth
  fastify.post("/register", authController.register)
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
  // Session Management
  fastify.get(
    "/sessions",
    {
      preHandler: authGuard
    },
    authController.getUserSessions
  )

  fastify.delete(
    "/sessions/:sessionId",
    {
      preHandler: authGuard
    },
    authController.revokeSession
  )
}
```

---

## 9. Presentation Layer Global

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
2. **Resultado final**: las rutas quedan en `/api/v1/auth/*`

---

## 10. Cookies y Autenticación

El sistema de autenticación usa cookies httpOnly en lugar de devolver los tokens en el JSON response.

### Flujo de Autenticación con Cookies

```
1. Usuario envía POST /api/v1/auth/login con { email, password }
       ↓
2. Controller valida el body con Zod schema
       ↓
3. Controller verifica si ya hay sesión activa (resolveCurrentUserId)
       ↓
4. Service ejecuta login: busca usuario, compara password, genera tokens
       ↓
5. Controller setea las cookies con setAuthCookies()
       ↓
6. Response: { message, user } (SIN los tokens en el JSON)
       ↓
7. El navegador guarda automáticamente las cookies (httpOnly)
```

---

## 11. Prisma Schema

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
  id             String    @id @default(uuid())
  name           String
  email          String    @unique
  email_verified Boolean   @default(false)
  phone          String?
  image          String?
  role           ROLE      @default(staff)

  created_at     DateTime  @default(now()) @db.Timestamptz
  updated_at     DateTime  @updatedAt @db.Timestamptz
  deleted_at     DateTime? @db.Timestamptz

  sessions       session[]
  accounts       account[]
  sales          sale[]

  @@index([email])
  @@index([role])
  @@map("users")
}

model session {
  id          String   @id @default(uuid())
  expires_at  DateTime @db.Timestamptz
  token       String
  ip_address  String?
  user_agent  String?
  user_id     String

  created_at  DateTime @default(now()) @db.Timestamptz
  updated_at  DateTime @updatedAt @db.Timestamptz

  user        user @relation(fields: [user_id], references: [id])

  @@index([user_id])
  @@map("session")
}

model account {
  id                        String    @id @default(uuid())
  account_id                String
  provider_id               String
  user_id                   String?

  access_token              String?
  refresh_token             String?
  id_token                  String?

  access_token_expires_at   DateTime? @db.Timestamptz
  refresh_token_expires_at  DateTime? @db.Timestamptz

  scope                     String?
  password                  String?

  created_at                DateTime  @default(now()) @db.Timestamptz
  updated_at                DateTime  @updatedAt @db.Timestamptz

  user                      user? @relation(fields: [user_id], references: [id])

  @@index([user_id])
  @@map("account")
}

model verification {
  id          String   @id @default(uuid())
  identifier  String
  value       String
  expires_at  DateTime @db.Timestamptz

  created_at  DateTime @default(now()) @db.Timestamptz
  updated_at  DateTime @updatedAt @db.Timestamptz

  @@map("verification")
}

model medicine {
  id             String    @id @default(uuid())
  trade_name     String
  generic_name   String
  description    String?
  price          Decimal
  stock          Int       @default(0)
  expiry_date    DateTime? @db.Timestamptz

  laboratory_id  String
  category_id    String

  created_at     DateTime  @default(now()) @db.Timestamptz
  updated_at     DateTime  @updatedAt @db.Timestamptz
  deleted_at     DateTime? @db.Timestamptz

  laboratory     lab       @relation(fields: [laboratory_id], references: [id])
  category       category  @relation(fields: [category_id], references: [id])
  sale_items     sale_item[]

  @@index([trade_name])
  @@index([generic_name])
  @@index([laboratory_id])
  @@index([category_id])
  @@map("medicines")
}

model sale {
  id              String    @id @default(uuid())
  date            DateTime  @default(now()) @db.Timestamptz
  total           Decimal
  payment_method  String

  user_id         String
  client_id       String?

  created_at      DateTime  @default(now()) @db.Timestamptz
  updated_at      DateTime  @updatedAt @db.Timestamptz

  user            user      @relation(fields: [user_id], references: [id])
  client          client?   @relation(fields: [client_id], references: [id])
  items           sale_item[]

  @@index([date])
  @@index([user_id])
  @@index([client_id])
  @@map("sales")
}

model sale_item {
  id           String   @id @default(uuid())
  sale_id      String
  medicine_id  String
  quantity     Int
  unit_price   Decimal

  created_at   DateTime @default(now()) @db.Timestamptz
  updated_at   DateTime @updatedAt @db.Timestamptz

  sale         sale     @relation(fields: [sale_id], references: [id])
  medicine     medicine @relation(fields: [medicine_id], references: [id])

  @@index([sale_id])
  @@index([medicine_id])
  @@map("sale_items")
}

model client {
  id               String    @id @default(uuid())
  name             String
  document_number  String    @unique
  email            String?
  phone            String?
  address          String?
  membership       String    @default("bronze")

  created_at       DateTime  @default(now()) @db.Timestamptz
  updated_at       DateTime  @updatedAt @db.Timestamptz
  deleted_at       DateTime? @db.Timestamptz

  sales            sale[]

  @@index([document_number])
  @@index([email])
  @@map("clients")
}

model lab {
  id          String    @id @default(uuid())
  name        String

  created_at  DateTime  @default(now()) @db.Timestamptz
  updated_at  DateTime  @updatedAt @db.Timestamptz
  deleted_at  DateTime? @db.Timestamptz

  medicines   medicine[]

  @@map("labs")
}

model supplier {
  id          String    @id @default(uuid())
  name        String
  contact     String?

  created_at  DateTime  @default(now()) @db.Timestamptz
  updated_at  DateTime  @updatedAt @db.Timestamptz
  deleted_at  DateTime? @db.Timestamptz

  @@map("suppliers")
}

model category {
  id          String    @id @default(uuid())
  name        String

  created_at  DateTime  @default(now()) @db.Timestamptz
  updated_at  DateTime  @updatedAt @db.Timestamptz
  deleted_at  DateTime? @db.Timestamptz

  medicines   medicine[]

  @@map("categories")
}
```

**Explicación de las tablas:**

| Modelo | Descripción |
|--------|-------------|
| `user` | Usuarios del sistema (admin/staff). Relación 1:N con sales, sessions, accounts. Soft delete con `deleted_at`. |
| `session` | Sesiones activas de usuarios. Cada login crea una sesión. |
| `account` | Cuentas de autenticación (OAuth, credentials). Permite múltiples providers por usuario. |
| `verification` | Códigos de verificación (email, password reset). |
| `medicine` | Medicamentos. Relación N:1 con lab y category. |
| `sale` | Ventas realizadas. Relación N:1 con user (vendedor) y client. |
| `sale_item` | Items de una venta. |
| `client` | Clientes de la farmacia. Membership (bronze/silver/gold). |
| `lab` | Laboratorios farmacéuticos. |
| `supplier` | Proveedores. |
| `category` | Categorías de medicamentos. |

---

## 12. Endpoints

### Endpoints de Auth

| Endpoint | Método | Descripción | Requiere Auth |
|----------|--------|-------------|---------------|
| `/api/v1/auth/register` | POST | Crear usuario nuevo | No |
| `/api/v1/auth/login` | POST | Iniciar sesión | No |
| `/api/v1/auth/logout` | POST | Cerrar sesión | No |
| `/api/v1/auth/refresh` | POST | Refrescar tokens | No |
| `/api/v1/auth/verify-email` | POST | Verificar email con código | No |
| `/api/v1/auth/resend-verification` | POST | Reenviar código de verificación | No |
| `/api/v1/auth/forgot-password` | POST | Solicitar reset de password | No |
| `/api/v1/auth/reset-password` | POST | Resetear password con código | No |
| `/api/v1/auth/sessions` | GET | Listar sesiones activas | Sí |
| `/api/v1/auth/sessions/:sessionId` | DELETE | Revocar sesión específica | Sí |

### Ejemplos de Request

**POST /api/v1/auth/register**
```json
{
  "email": "testuser@agenciapro.com",
  "name": "Test User",
  "password": "password123",
  "role": "staff"
}
```

**POST /api/v1/auth/login**
```json
{
  "email": "testuser@agenciapro.com",
  "password": "password123"
}
```

**POST /api/v1/auth/verify-email**
```json
{
  "identifier": "testuser@agenciapro.com",
  "code": "XXXXXX"
}
```

**POST /api/v1/auth/forgot-password**
```json
{
  "email": "testuser@agenciapro.com"
}
```

**POST /api/v1/auth/reset-password**
```json
{
  "email": "testuser@agenciapro.com",
  "code": "XXXXXX",
  "newPassword": "newpassword123"
}
```

---

## 13. Commands Útiles

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

## 14. Resumen de Patrones Usados

| Patrón | Aplicación |
|--------|------------|
| **Clean Architecture** | Separación en domain/application/infrastructure/presentation |
| **Dependency Inversion** | Service depende de IAuthRepository, no de implementación concreta |
| **Factory Pattern** | `createAuthService(repository)` crea el service con dependencias |
| **Singleton** | `prisma`, `redisClient`, `logger` - una sola instancia global |
| **Error Handling** | Errores custom con statusCode y código interno |
| **Soft Delete** | Campos `deleted_at` en vez de borrar registros |
| **Value Objects** | Zod schemas para validar DTOs en la capa de presentación |
| **Mappers** | Transformación de tipos Prisma a entidades del dominio |
| **Session in DB** | Las sesiones se almacenan en la base de datos |
| **Credentials Provider** | Sistema de login con email/password usando tabla "account" |


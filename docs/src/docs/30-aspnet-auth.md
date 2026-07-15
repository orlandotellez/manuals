# ASPNET AUTH 

Manual para realizar el modulo de autenticación con ASPNET
---

## Índice

1. [Arquitectura General](#1-arquitectura-general)
2. [Prerrequisitos](#2-prerrequisitos)
3. [Estructura del Proyecto](#3-estructura-del-proyecto)
4. [Luna.Domain — Capa de Dominio](#4-lunadomain--capa-de-dominio)
5. [Luna.Application — Capa de Aplicación](#5-lunaapplication--capa-de-aplicación)
6. [Luna.Infrastructure — Capa de Infraestructura](#6-lunainfrastructure--capa-de-infraestructura)
7. [Luna.Api — Capa de Presentación (API)](#7-lunaapi--capa-de-presentación-api)
8. [Flujo Completo: Register](#8-flujo-completo-register)
9. [Flujo Completo: Login](#9-flujo-completo-login)
10. [Flujo Completo: Refresh](#10-flujo-completo-refresh)
11. [Flujo Completo: Logout](#11-flujo-completo-logout)
12. [Comandos para Replicar](#12-comandos-para-replicar)

---

## 1. Arquitectura General

### 1.1. Principios

El proyecto sigue **Clean Architecture** con 4 capas:

```
┌─────────────────────────────────────────────┐
│           Luna.Api (Presentación)            │
│   Controllers, Middleware, Helpers, Config   │
├─────────────────────────────────────────────┤
│       Luna.Application (Casos de Uso)        │
│   Interfaces, Servicios de Aplicación, DTOs  │
├─────────────────────────────────────────────┤
│     Luna.Infrastructure (Infraestructura)    │
│   EF Core, Repositorios, JWT, BCrypt, Migs   │
├─────────────────────────────────────────────┤
│         Luna.Domain (Dominio/Núcleo)         │
│   Entidades, Enums, Excepciones de Negocio   │
└─────────────────────────────────────────────┘
```

### 1.2. Reglas de Dependencia

- **Domain** → No depende de nadie
- **Application** → Depende de Domain
- **Infrastructure** → Depende de Application
- **Api** → Depende de Infrastructure y Application

Las dependencias **siempre apuntan hacia adentro**. Domain nunca sabe de Application, Application nunca sabe de Infrastructure.

### 1.3. Relación entre capas

| Capa | Responsabilidad | Tecnología |
|------|----------------|------------|
| **Domain** | Entidades, reglas de negocio, enums, excepciones | C# puro |
| **Application** | Casos de uso, contratos (interfaces), DTOs, mapeo | C# puro |
| **Infrastructure** | Implementación de contratos, persistencia, JWT | EF Core, BCrypt, Npgsql |
| **Api** | HTTP endpoints, middleware, DI, configuración | ASP.NET Core |

### 1.4. Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| .NET | 10.0 | Runtime |
| ASP.NET Core | 10.0 | API web |
| Entity Framework Core | 10.0 | ORM |
| Npgsql (PostgreSQL) | 10.0 | Driver BD |
| BCrypt.Net-Next | 4.2.0 | Hash de contraseñas |
| System.IdentityModel.Tokens.Jwt | 8.19.1 | JWT |
| FluentValidation | 11.3.1 | Validación de requests |

---

## 2. Prerrequisitos

```bash
# SDK .NET 10.0
dotnet --version  # debe mostrar 10.0.x

# PostgreSQL 16+
psql --version    # debe mostrar 16.x

# EF Core CLI
dotnet tool install --global dotnet-ef
```

---

## 3. Estructura del Proyecto

```
backend/
├── src/
│   ├── Luna.Api/
│   │   ├── Controllers/
│   │   │   └── AuthController.cs
│   │   ├── Extensions/
│   │   │   ├── CorsExtensions.cs
│   │   │   ├── DatabaseExtensions.cs
│   │   │   ├── DependencyInjectionExtensions.cs
│   │   │   ├── MiddlewareExtensions.cs
│   │   │   └── RateLimitExtensions.cs
│   │   ├── Helpers/
│   │   │   ├── AuthHelper.cs
│   │   │   └── CookieHelper.cs
│   │   ├── Middleware/
│   │   │   └── ErrorHandlingMiddleware.cs
│   │   ├── Properties/
│   │   │   └── launchSettings.json
│   │   ├── appsettings.json
│   │   ├── appsettings.Development.json
│   │   ├── Luna.Api.csproj
│   │   ├── Luna.Api.http
│   │   └── Program.cs
│   ├── Luna.Application/
│   │   ├── Common/
│   │   │   ├── Interfaces/
│   │   │   │   ├── IAccountRepository.cs
│   │   │   │   ├── IAuthService.cs
│   │   │   │   ├── IPasswordService.cs
│   │   │   │   ├── ISessionRepository.cs
│   │   │   │   ├── ITokenService.cs
│   │   │   │   ├── IUserRepository.cs
│   │   │   │   └── IVerificationRepository.cs
│   │   │   ├── Mapping/
│   │   │   │   └── MappingUser.cs
│   │   │   └── Models/
│   │   │       ├── AuthRequest.cs
│   │   │       ├── AuthResult.cs
│   │   │       ├── UserDto.cs
│   │   │       └── UserRequest.cs
│   │   ├── Features/
│   │   │   └── Auth/
│   │   │       └── AuthService.cs
│   │   └── Luna.Application.csproj
│   ├── Luna.Domain/
│   │   ├── Entities/
│   │   │   ├── Account.cs
│   │   │   ├── Session.cs
│   │   │   ├── User.cs
│   │   │   └── Verification.cs
│   │   ├── Enums/
│   │   │   └── UserRole.cs
│   │   ├── Exceptions/
│   │   │   └── AppException.cs
│   │   └── Luna.Domain.csproj
│   └── Luna.Infrastructure/
│       ├── Migrations/
│       │   ├── 20260715031852_init.cs
│       │   ├── 20260715031852_init.Designer.cs
│       │   └── ApplicationDbContextModelSnapshot.cs
│       ├── Persistence/
│       │   ├── Configurations/
│       │   │   ├── AccountConfiguration.cs
│       │   │   ├── SessionConfiguration.cs
│       │   │   ├── UserConfiguration.cs
│       │   │   └── VerificationConfiguration.cs
│       │   ├── Repositories/
│       │   │   ├── AccountRepository.cs
│       │   │   ├── SessionRepository.cs
│       │   │   ├── UserRepository.cs
│       │   │   └── VerificationRepository.cs
│       │   └── ApplicationDbContext.cs
│       └── Services/
│           ├── PasswordService.cs
│           └── TokenService.cs
│       └── Luna.Infrastructure.csproj
```

---

## 4. Luna.Domain — Capa de Dominio

### 4.1. `Luna.Domain.csproj`

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <RootNamespace>Luna.Domain</RootNamespace>
  </PropertyGroup>

</Project>
```

**Explicación línea por línea:**

| Línea | Explicación |
|-------|-------------|
| `<Project Sdk="Microsoft.NET.Sdk">` | Proyecto .NET estándar (no es web). SDK básico para librerías de clases. |
| `<TargetFramework>net10.0</TargetFramework>` | Apunta a .NET 10.0 |
| `<ImplicitUsings>enable</ImplicitUsings>` | Incluye automáticamente `using System`, `System.Collections.Generic`, `System.Linq`, `System.Threading.Tasks`, etc. |
| `<Nullable>enable</Nullable>` | Habilita tipos nullable (`string?`, `Guid?`). Obliga a declarar explícitamente cuando un valor puede ser null. |
| `<RootNamespace>Luna.Domain</RootNamespace>` | Namespace raíz. Todas las clases en este proyecto usan `Luna.Domain.*` |

---

### 4.2. `Entities/User.cs`

```csharp
using Luna.Domain.Enums;

namespace Luna.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool EmailVerified { get; set; }
    public string? Phone { get; set; }
    public string? Image { get; set; }
    public UserRole Role { get; set; }
    public string? UserName { get; set; }
    public string? Bio { get; set; }
    public bool IsActive { get; set; }
    public DateTime? LastSeenAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }       // Soft Delete
    public Guid? DeletedByUserId { get; set; }     // Quién eliminó
    public string? DeletedByName { get; set; }     // Nombre de quien eliminó
    public int FailedLoginAttempts { get; set; }   // Intentos fallidos
    public DateTime? LockoutEnd { get; set; }      // Fin del bloqueo
}
```

**Explicación:**

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `Id` | `Guid` | Identificador único. Se genera con `gen_random_uuid()` en PostgreSQL. |
| `Name` | `string` | Nombre completo del usuario. `= string.Empty` evita null. |
| `Email` | `string` | Email único. Se crea índice único en DB. |
| `EmailVerified` | `bool` | Si el email fue verificado. Default `false`. |
| `Phone` | `string?` | Teléfono (opcional). `?` significa nullable. |
| `Image` | `string?` | URL de la imagen de perfil (opcional). |
| `Role` | `UserRole` | Enum: `User`, `Familiar`, `Professional`, `Admin`. |
| `UserName` | `string?` | Nombre de usuario único (opcional). Tiene índice único. |
| `Bio` | `string?` | Biografía (opcional). |
| `IsActive` | `bool` | Si la cuenta está activa. Default `true`. |
| `LastSeenAt` | `DateTime?` | Última vez que se conectó. |
| `CreatedAt` | `DateTime` | Fecha de creación. Se auto-asigna en DB. |
| `UpdatedAt` | `DateTime` | Fecha de última actualización. |
| `DeletedAt` | `DateTime?` | Soft delete: si tiene fecha, el usuario está "borrado" lógicamente. |
| `DeletedByUserId` | `Guid?` | ID del usuario que realizó el soft delete. |
| `DeletedByName` | `string?` | Nombre de quien eliminó (para auditoría). |
| `FailedLoginAttempts` | `int` | Contador de intentos fallidos de login. Para lockout. |
| `LockoutEnd` | `DateTime?` | Fecha hasta la cual la cuenta está bloqueada. |

---

### 4.3. `Entities/Account.cs`

```csharp
namespace Luna.Domain.Entities;

public class Account
{
    public Guid Id { get; set; }
    public string AccountId { get; set; } = null!;          // ID del proveedor
    public string ProviderId { get; set; } = null!;         // Proveedor: "credentials", "google", "github"
    public Guid UserId { get; set; }                        // FK a User
    public User User { get; set; } = null!;                 // Navigation property
    public string? AccessToken { get; set; }                 // OAuth access token
    public string? RefreshToken { get; set; }                // OAuth refresh token
    public string? IdToken { get; set; }                     // OAuth ID token
    public DateTime? AccessTokenExpiresAt { get; set; }
    public DateTime? RefreshTokenExpiresAt { get; set; }
    public string? Scope { get; set; }
    public string? Password { get; set; }                    // Password hasheado (credentials)
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

**Explicación:**

| Propiedad | Descripción |
|-----------|-------------|
| `AccountId` | ID único del usuario EN EL PROVEEDOR. Para "credentials" es el `Id` del User. Para Google es el sub de Google. |
| `ProviderId` | Identifica el proveedor de autenticación: `"credentials"` (email+password), `"google"`, `"github"`. |
| `UserId` | FK hacia `User`. Relación N:1 (un usuario puede tener muchas cuentas: credentials + Google + GitHub). |
| `User` | Navigation property para EF Core. `= null!` porque no se asigna hasta que EF la carga. |
| `Password` | Solo para `ProviderId = "credentials"`. Guarda el hash de BCrypt, nunca texto plano. |
| `AccessToken/RefreshToken/IdToken` | Tokens de OAuth para proveedores externos. |
| `Scope` | Permisos solicitados en OAuth. |

**Patrón importante:** Account usa el patrón de **proveedor de autenticación**. Un usuario puede tener múltiples formas de autenticarse (email+password + Google + GitHub) y cada una es un Account distinto. Todas apuntan al mismo User.

---

### 4.4. `Entities/Session.cs`

```csharp
namespace Luna.Domain.Entities;

public class Session
{
    public Guid Id { get; set; }
    public DateTime ExpiresAt { get; set; }
    public string Token { get; set; } = string.Empty;      // Refresh token
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public Guid UserId { get; set; }                       // FK a User
    public User User { get; set; } = null!;
}
```

**Explicación:**

| Propiedad | Descripción |
|-----------|-------------|
| `Id` | Identificador único. |
| `ExpiresAt` | Fecha de expiración de la sesión. Default: 7 días desde creación. |
| `Token` | El refresh token JWT. Se guarda para poder invalidarlo (logout, refresh rotation). |
| `IpAddress` | Dirección IP desde donde se inició sesión (opcional, para auditoría). |
| `UserAgent` | User-Agent del navegador/cliente (opcional, para auditoría). |
| `UserId` | FK hacia User. |

**Decisión arquitectónica:** La sesión se identifica por el refresh token. No es una sesión tradicional de servidor con ID — es una sesión basada en token que se almacena en DB para poder revocarla. Esto permite:
- Invalidar todas las sesiones de un usuario (cambio de password, admin force logout)
- Rotación de refresh tokens (cada refresh invalida el anterior)
- Saber cuántas sesiones activas tiene un usuario

---

### 4.5. `Entities/Verification.cs`

```csharp
namespace Luna.Domain.Entities;

public class Verification
{
    public Guid Id { get; set; }
    public string Identifier { get; set; } = null!;        // Email o teléfono
    public string Value { get; set; } = null!;             // Código/token
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

**Explicación:**

| Propiedad | Descripción |
|-----------|-------------|
| `Identifier` | Identificador del usuario: puede ser un email o un número de teléfono. |
| `Value` | El código/token de verificación (ej: "123456" para código de 6 dígitos). |
| `ExpiresAt` | Fecha de expiración del código. Los códigos vencidos se limpian con `DeleteExpiredAsync()`. |

**Propósito:** Sirve para verificación de email, reseteo de password, verificación en dos pasos, etc. Actualmente las acciones en `IAuthService` están comentadas (no implementadas), pero la entidad ya está lista.

---

### 4.6. `Enums/UserRole.cs`

```csharp
namespace Luna.Domain.Enums;

public enum UserRole
{
    User,           // 0 — Usuario regular
    Familiar,       // 1 — Familiar
    Professional,   // 2 — Profesional
    Admin           // 3 — Administrador
}
```

**Explicación:**

| Valor | Nombre | Uso |
|-------|--------|-----|
| 0 | `User` | Usuario normal del sistema |
| 1 | `Familiar` | Rol de familiar (contexto de cuidado) |
| 2 | `Professional` | Rol de profesional (doctor, terapeuta, etc.) |
| 3 | `Admin` | Administrador con permisos totales |

El valor por defecto en DB es `0` (`User`). Los valores enteros permiten comparaciones de jerarquía (Admin > Professional > Familiar > User).

---

### 4.7. `Exceptions/AppException.cs`

```csharp
namespace Luna.Domain.Exceptions;

// Excepción base de la aplicación con soporte para códigos HTTP
public class AppException : Exception
{
    public int StatusCode { get; }        // Código HTTP (400, 401, 403, 404, 409, 422, 429, 500)
    public string Code { get; }           // Código interno (BAD_REQUEST, UNAUTHORIZED, etc.)
    public bool IsOperational { get; }    // Distingue errores operativos de bugs

    public AppException(string message, int statusCode, string code) : base(message)
    {
        StatusCode = statusCode;
        Code = code;
        IsOperational = true;
    }
}

// Factory estática para crear errores comunes sin repetir código
public static class AppExceptions
{
    public static AppException BadRequest(string message = "Bad Request")
        => new(message, 400, "BAD_REQUEST");

    public static AppException Unauthorized(string message = "Unauthorized")
        => new(message, 401, "UNAUTHORIZED");

    public static AppException Forbidden(string message = "Forbidden")
        => new(message, 403, "FORBIDDEN");

    public static AppException NotFound(string message = "Not Found")
        => new(message, 404, "NOT_FOUND");

    public static AppException Conflict(string message = "Conflict")
        => new(message, 409, "CONFLICT");

    public static AppException UnprocessableEntity(string message = "Unprocessable Entity")
        => new(message, 422, "UNPROCESSABLE_ENTITY");

    public static AppException TooManyRequests(string message = "Too Many Requests")
        => new(message, 429, "TOO_MANY_REQUESTS");

    public static AppException InternalError(string message = "Internal Server Error")
        => new(message, 500, "INTERNAL_SERVER_ERROR");
}
```

**Explicación detallada:**

**`AppException`** es una excepción personalizada que lleva:
- `StatusCode`: El código HTTP que se devolverá en la respuesta (400, 401, 404, etc.)
- `Code`: Un código interno legible como `"UNAUTHORIZED"`, `"CONFLICT"`, etc. Útil para que el frontend pueda distinguir tipos de error sin parsear mensajes.
- `IsOperational`: Distingue errores **operativos** (esperados, como "contraseña incorrecta") de errores de **programación** (bugs). Los operativos son seguros de mostrar al usuario. Los de programación no.

**`AppExceptions`** es una **clase factory** estática. Cada método estático crea una `AppException` con los valores correctos:

```csharp
// En lugar de:
throw new AppException("Email already registered", 409, "CONFLICT");

// Usás:
throw AppExceptions.Conflict("Email already registered");
```

Esto evita errores de tipeo en los códigos y hace el código más legible.

**Uso en el Middleware:** Cuando el `ErrorHandlingMiddleware` captura una excepción:
- Si es `AppException` → devuelve `StatusCode` y `Code` específicos
- Si es cualquier otra → devuelve 500 Internal Server Error (nunca expone detalles internos)

---

## 5. Luna.Application — Capa de Aplicación

### 5.1. `Luna.Application.csproj`

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <ItemGroup>
    <ProjectReference Include="..\Luna.Domain\Luna.Domain.csproj" />
  </ItemGroup>

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <RootNamespace>Luna.Application</RootNamespace>
  </PropertyGroup>

</Project>
```

**Explicación:** Depende solo de `Luna.Domain`. No tiene referencia a Infrastructure ni a Api. Esto es **la regla de oro de Clean Architecture**: la capa de aplicación NO sabe nada de infraestructura. Solo define **contratos** (interfaces) que Infrastructure implementa.

---

### 5.2. `Common/Interfaces/` — Contratos

Todos los contratos (interfaces) viven acá. Son abstracciones que define la aplicación y que la infraestructura implementa. La aplicación los usa sin saber cómo están implementados.

---

#### `IUserRepository.cs`

```csharp
using Luna.Application.Common.Models;
using Luna.Domain.Entities;

namespace Luna.Application.Common.Interfaces;

public interface IUserRepository
{
    Task<List<User>> GetAllAsync(UserFilter filter);
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(Guid id);
    Task<User> CreateAsync(User user);
    Task<User> UpdateAsync(User user);
    Task SoftDeleteAsync(Guid id, Guid deletedByUserId, string deletedByName);
    Task RestoreAsync(Guid id);
}
```

**Cada método explica:**

| Método | Qué hace |
|--------|----------|
| `GetAllAsync(UserFilter)` | Lista usuarios con filtros: búsqueda, rol, activos, eliminados |
| `GetByEmailAsync(string)` | Busca usuario por email (excluye soft-deleted por defecto) |
| `GetByIdAsync(Guid)` | Busca usuario por ID (excluye soft-deleted) |
| `CreateAsync(User)` | Crea nuevo usuario en DB |
| `UpdateAsync(User)` | Actualiza usuario existente |
| `SoftDeleteAsync(Guid, Guid, string)` | Marca como eliminado (no borra físicamente) |
| `RestoreAsync(Guid)` | Restaura un usuario soft-deleted |

---

#### `IAccountRepository.cs`

```csharp
using Luna.Domain.Entities;

namespace Luna.Application.Common.Interfaces;

public interface IAccountRepository
{
    Task<Account?> GetByProviderAndAccountIdAsync(string providerId, string accountId);
    Task<List<Account>> GetByUserIdAsync(Guid userId);
    Task<Account?> GetCredentialsByEmailAsync(string email);
    Task<Account?> GetCredentialsByUserIdAsync(Guid userId);
    Task<Account> CreateAsync(Account account);
    Task<Account> UpdateAsync(Account account);
    Task DeleteAsync(Guid id);
    Task DeleteByUserIdAsync(Guid userId);
}
```

**Método clave: `GetCredentialsByEmailAsync`**
```csharp
Task<Account?> GetCredentialsByEmailAsync(string email);
```
Busca la cuenta de tipo "credentials" (email+password) asociada a un email. Hace un `Include(a => a.User)` porque necesita acceder al User para verificar si está activo, si tiene soft-delete, etc.

---

#### `ISessionRepository.cs`

```csharp
using Luna.Domain.Entities;

namespace Luna.Application.Common.Interfaces;

public interface ISessionRepository
{
    Task<Session> CreateAsync(Session session);
    Task<Session?> GetByTokenAsync(string token);
    Task<List<Session>> GetByUserIdAsync(Guid userId);
    Task DeleteAsync(string token);
    Task DeleteByUserIdAsync(Guid userId);
    Task<int> DeleteExpiredAsync();
}
```

**Métodos importantes:**

| Método | Descripción |
|--------|-------------|
| `GetByTokenAsync(string)` | Busca sesión por el refresh token. Fundamental para `RefreshAsync()` y `LogoutAsync()`. |
| `DeleteAsync(string)` | Elimina por token (no por ID). Se usa en logout y refresh rotation. |
| `DeleteByUserIdAsync(Guid)` | Elimina TODAS las sesiones de un usuario. Sirve para "cerrar sesión en todos lados". |
| `DeleteExpiredAsync()` | Limpia sesiones vencidas (tarea de mantenimiento). |

---

#### `IVerificationRepository.cs`

```csharp
using Luna.Domain.Entities;

namespace Luna.Application.Common.Interfaces;

public interface IVerificationRepository
{
    Task<Verification> CreateAsync(Verification verification);
    Task<Verification?> GetByIdentifierAsync(string identifier);
    Task<Verification?> GetByIdentifierAndValueAsync(string identifier, string value);
    Task DeleteAsync(Guid id);
    Task DeleteByIdentifierAsync(string identifier);
    Task<int> DeleteExpiredAsync();
}
```

**Detalle de los métodos de búsqueda:**

- `GetByIdentifierAsync("user@email.com")` → Busca el código de verificación **válido** (no expirado) más reciente para ese email. Útil para reenviar códigos.
- `GetByIdentifierAndValueAsync("user@email.com", "123456")` → Busca un código específico para un identificador. Se usa para **verificar** que el código ingresado por el usuario sea correcto y no haya expirado.

---

#### `ITokenService.cs`

```csharp
using System.Security.Claims;
using Luna.Domain.Enums;

namespace Luna.Application.Common.Interfaces;

public interface ITokenService
{
    (string accessToken, string refreshToken) GenerateTokens(Guid userId, string email, UserRole role);
    ClaimsPrincipal? ValidateAccessToken(string token);
    ClaimsPrincipal? ValidateRefreshToken(string token);
}
```

| Método | Descripción |
|--------|-------------|
| `GenerateTokens(userId, email, role)` | Genera un par de tokens: access + refresh. Devuelve tupla. |
| `ValidateAccessToken(token)` | Valida un access token usando `_secret`. Devuelve los claims si es válido, `null` si no. |
| `ValidateRefreshToken(token)` | Valida un refresh token usando `_refreshSecret`. Devuelve los claims si es válido, `null` si no. |

**Decisión:** Access y refresh tokens se firman con **distintas claves secretas** (`_secret` y `_refreshSecret`). Esto es seguridad en capas — si comprometés una clave, la otra sigue siendo segura. Además el refresh token se guarda en DB (en Sessions) para poder revocarlo.

---

#### `IPasswordService.cs`

```csharp
namespace Luna.Application.Common.Interfaces;

public interface IPasswordService
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string hash);
}
```

Contrato mínimo: hashear y verificar. La implementación usa BCrypt.

---

#### `IAuthService.cs`

```csharp
using Luna.Application.Common.Models;

namespace Luna.Application.Common.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<RefreshResponse> RefreshAsync(string refreshToken);
    Task LogoutAsync(string refreshToken);
    // Métodos comentados (para implementación futura):
    //Task<AuthResponse> VerifyEmailAsync(string identifier, string code);
    //Task ResendVerificationAsync(string email);
    //Task<ForgotPasswordResponse> ForgotPasswordAsync(string email);
    //Task<ResetPasswordResponse> ResetPasswordAsync(string email, string code, string newPassword);
    //Task<UserDto> UpdateMyProfileAsync(Guid userId, UpdateMyProfileRequest request);
    //Task<UserDto> ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
}
```

**Métodos implementados vs comentados:**

| Método | Estado | Descripción |
|--------|--------|-------------|
| `RegisterAsync` | ✅ Implementado | Registro con email+password |
| `LoginAsync` | ✅ Implementado | Login con email+password |
| `RefreshAsync` | ✅ Implementado | Rotación de tokens |
| `LogoutAsync` | ✅ Implementado | Cierre de sesión |
| `VerifyEmailAsync` | ❌ Pendiente | Verificar email con código |
| `ResendVerificationAsync` | ❌ Pendiente | Reenviar código |
| `ForgotPasswordAsync` | ❌ Pendiente | Olvidé mi contraseña |
| `ResetPasswordAsync` | ❌ Pendiente | Resetear contraseña |
| `UpdateMyProfileAsync` | ❌ Pendiente | Actualizar perfil |
| `ChangePasswordAsync` | ❌ Pendiente | Cambiar contraseña |

---

### 5.3. `Common/Interfaces/IRepository.cs` (no existe)

Si el proyecto creciera, se podría crear un `IRepository<T>` genérico para no repetir `CreateAsync`, `UpdateAsync`, `DeleteAsync` en cada repositorio. Por ahora cada repositorio tiene su propia interfaz porque las consultas son muy específicas.

---

### 5.4. `Common/Models/` — DTOs (Data Transfer Objects)

#### `AuthRequest.cs`

```csharp
namespace Luna.Application.Common.Models;

public record LoginRequest(string Email, string Password);
public record RegisterRequest(string Name, string Email, string Password);
public record RefreshRequest(string RefreshToken);
public record VerifyEmailRequest(string Identifier, string Code);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Email, string Code, string NewPassword);
public record ResendVerificactionRequest(string Email);
public record UpdateMyProfileRequest(string? Name, string? Bio, string? Phone, string? Username, string? Image);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
```

**Explicación:**

Usamos **`record`** en vez de `class` porque:
1. **Inmutabilidad**: los records son inmutables por defecto. Una vez creados, no se modifican.
2. **Sintaxis concisa**: `record RegisterRequest(string Name, string Email, string Password)` — una línea declara el tipo, el constructor, y las propiedades.
3. **Value equality**: dos records son iguales si tienen los mismos valores, no la misma referencia.
4. **Deconstruction**: podés desarmarlos fácilmente: `var (name, email, password) = request;`

Cada record representa el body de un request HTTP. Los campos nullables (`string?`) indican que el campo es opcional en el request.

---

#### `AuthResult.cs`

```csharp
namespace Luna.Application.Common.Models;

public record AuthResponse
{
    public string Message { get; init; } = string.Empty;
    public UserDto? User { get; init; }
    public string AccessToken { get; init; } = string.Empty;
    public string RefreshToken { get; init; } = string.Empty;
}

public record RefreshResponse
{
    public string Message { get; init; } = string.Empty;
    public string AccessToken { get; init; } = string.Empty;
    public string RefreshToken { get; init; } = string.Empty;
}

public record ForgotPasswordResponse
{
    public string Message { get; init; } = string.Empty;
    public DateTime ExpiresAt { get; init; }
}

public record ResetPasswordResponse
{
    public string Message { get; init; } = string.Empty;
}
```

**Explicación:**

Usamos `{ get; init; }` en vez de `{ get; set; }`. La diferencia:
- `init` permite asignar SOLO en la inicialización (constructor o object initializer). Después es inmutable.
- Es una práctica de seguridad: una vez que la respuesta se construye, no debería modificarse.

```csharp
// Así se usan:
var response = new AuthResponse
{
    Message = "Login successful",
    User = userDto,
    AccessToken = accessToken,
    RefreshToken = refreshToken
};
// response.Message = "otra cosa"; // ❌ Error de compilación
```

---

#### `UserDto.cs`

```csharp
using Luna.Domain.Enums;

namespace Luna.Application.Common.Models;

public record UserDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool EmailVerified { get; set; }
    public string? Phone { get; set; }
    public string? Image { get; set; }
    public UserRole Role { get; set; }
    public string? UserName { get; set; }
    public string? Bio { get; set; }
    public bool IsActive { get; set; }
    public DateTime? LastSeenAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedByUserId { get; set; }
    public string? DeletedByName { get; set; }
}
```

**¿Por qué un DTO separado si es casi igual a la entidad User?**

1. **Seguridad**: Nunca expongas la entidad directamente. El DTO controla qué campos se devuelven. Por ejemplo, si `User` tuviera `PasswordHash`, no lo incluirías en el DTO.
2. **Evolución separada**: La entidad puede cambiar (ej: agregar `LastLoginIp`) sin cambiar la API. O la API puede devolver datos calculados (ej: `FullName = $"{FirstName} {LastName}"`) que no existen en la entidad.
3. **Serialización**: Los DTOs pueden tener anotaciones `[JsonPropertyName]` o `[Ignore]` sin contaminar la entidad.

---

#### `UserRequest.cs`

```csharp
using Luna.Domain.Enums;

namespace Luna.Application.Common.Models;

public record CreateUserRequest(
    string Name,
    string Email,
    string Password,
    UserRole Role,
    string? Phone = null
);

public record UpdateUserRequest(
    string? Name,
    string? Email,
    UserRole? Role,
    string? Phone,
    string? Bio,
    string? UserName,
    bool? IsActive
);

public record UserFilter(
    string? Search,
    UserRole? Role,
    bool? IsActive,
    bool? IncludeDeleted
);
```

**UserFilter** es interesante: usa el **patrón Query Object** (o Specification). En vez de pasar 4 parámetros separados a `GetAllAsync`, pasás un objeto que encapsula todos los filtros. Ventajas:
- Si agregás un filtro, no cambiás la firma del método
- Podés pasar `null` para omitir un filtro
- Es fácil de serializar/deserializar desde query strings

---

### 5.5. `Common/Mapping/MappingUser.cs`

```csharp
using Luna.Application.Common.Models;
using Luna.Domain.Entities;
using Luna.Domain.Exceptions;

namespace Luna.Application.Common.Mapping;

public static class MappingUser
{
    public static UserDto MapUserToDto(this User user)
    {
        if (user == null)
            throw AppExceptions.UnprocessableEntity(nameof(user));

        return new UserDto
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            EmailVerified = user.EmailVerified,
            Phone = user.Phone,
            Image = user.Image,
            Role = user.Role,
            UserName = user.UserName,
            Bio = user.Bio,
            IsActive = user.IsActive,
            LastSeenAt = user.LastSeenAt,
            CreatedAt = user.CreatedAt,
            DeletedAt = user.DeletedAt,
            DeletedByUserId = user.DeletedByUserId,
            DeletedByName = user.DeletedByName,
        };
    }
}
```

**Explicación:**

Es un **extension method** (`this User user`). Esto permite escribir:

```csharp
var userDto = user.MapUserToDto();
```

en vez de:

```csharp
var userDto = MappingUser.MapUserToDto(user);
```

El `if (user == null)` es una **guard clause** — lanza una excepción temprano si alguien pasa null. Es mejor que dejar que se produzca un `NullReferenceException` en algún lugar oscuro.

Notá que **no se mapean campos sensibles**. Si `User` tuviera `PasswordHash` o `FailedLoginAttempts`, no se incluirían en el DTO. Esto es control de acceso a nivel de código.

---

### 5.6. `Features/Auth/AuthService.cs` — El Corazón de la Autenticación

```csharp
using System.Security.Claims;
using Luna.Application.Common.Interfaces;
using Luna.Application.Common.Models;
using Luna.Application.Common.Mapping;
using Luna.Domain.Exceptions;
using Luna.Domain.Entities;
using Luna.Domain.Enums;

namespace Luna.Application.Features.Auth;

public class AuthService : IAuthService
{
    // Dependencias inyectadas vía constructor
    private readonly IUserRepository _userRepository;
    private readonly IAccountRepository _accountRepository;
    private readonly ISessionRepository _sessionRepository;
    private readonly IPasswordService _passwordService;
    private readonly ITokenService _tokenService;

    public AuthService(
        IUserRepository userRepository,
        IAccountRepository accountRepository,
        ISessionRepository sessionRepository,
        IPasswordService passwordService,
        ITokenService tokenService)
    {
        _userRepository = userRepository;
        _accountRepository = accountRepository;
        _sessionRepository = sessionRepository;
        _passwordService = passwordService;
        _tokenService = tokenService;
    }
```

**Inyección de dependencias:** `AuthService` recibe **5 dependencias**, todas por interfaz. No sabe si `IPasswordService` usa BCrypt o Argon2. No sabe si `ITokenService` genera JWT o tokens opacos. Solo sabe que cumplen con el contrato.

---

#### `RegisterAsync` — Registro de Usuario

```csharp
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        // 1. Verificar que el email no esté registrado
        var existingUser = await _userRepository.GetByEmailAsync(request.Email);
        if (existingUser != null)
            throw AppExceptions.Conflict("Email already registered");

        // 2. Hashear la contraseña
        var hashedPassword = _passwordService.HashPassword(request.Password);

        // 3. Crear entidad User
        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Email = request.Email,
            Role = UserRole.User,
            IsActive = true,
            EmailVerified = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _userRepository.CreateAsync(user);

        // 4. Crear Account de tipo "credentials"
        var account = new Account
        {
            Id = Guid.NewGuid(),
            AccountId = user.Id.ToString(),
            ProviderId = "credentials",
            UserId = user.Id,
            Password = hashedPassword,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _accountRepository.CreateAsync(account);

        // 5. Generar tokens JWT
        var (accessToken, refreshToken) = _tokenService.GenerateTokens(
            user.Id, user.Email, user.Role);

        // 6. Crear sesión con el refresh token
        var session = new Session
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _sessionRepository.CreateAsync(session);

        // 7. Armar respuesta
        var response = new AuthResponse
        {
            Message = "User created sucessfully. Please veriry your email",
            User = user.MapUserToDto(),
            AccessToken = accessToken,
            RefreshToken = refreshToken
        };

        return response;
    }
```

**Flujo paso a paso:**

| Paso | Acción | Por qué |
|------|--------|---------|
| 1 | Verificar email duplicado | No permitir dos usuarios con el mismo email |
| 2 | Hashear password | NUNCA guardar contraseñas en texto plano |
| 3 | Crear User | La entidad principal del usuario |
| 4 | Crear Account | Asocia el método de auth "credentials" al User |
| 5 | Generar tokens | El access token dura 15 min, el refresh 7 días |
| 6 | Crear Session | Guarda el refresh token para revocación futura |
| 7 | Devolver respuesta | Incluye tokens para que el frontend los guarde |

**Decisión:** El registro **ya devuelve tokens** y crea una sesión. El usuario no necesita loguearse después de registrarse. Es una decisión de UX.

---

#### `LoginAsync` — Inicio de Sesión

```csharp
    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        // 1. Buscar cuenta por email
        var account = await _accountRepository.GetCredentialsByEmailAsync(request.Email);
        if (account == null)
            throw AppExceptions.Unauthorized("Invalid credentials");

        // 2. Verificar contraseña
        if (account.Password == null ||
            !_passwordService.VerifyPassword(request.Password, account.Password))
            throw AppExceptions.Unauthorized("Invalid credentials");

        // 3. Obtener usuario asociado a la cuenta
        var user = await _userRepository.GetByIdAsync(account.UserId);
        if (user == null)
            throw AppExceptions.Unauthorized("User not found");

        // 4. Verificar que no esté soft-deleted
        if (user.DeletedAt != null)
            throw AppExceptions.Unauthorized("Account has been deactivated");

        // 5. Generar nuevos tokens
        var (accessToken, refreshToken) = _tokenService.GenerateTokens(
            user.Id, user.Email, user.Role);

        // 6. Crear nueva sesión
        var session = new Session { ... };
        await _sessionRepository.CreateAsync(session);

        // 7. Responder
        return new AuthResponse { ... };
    }
```

**Flujo paso a paso:**

| Paso | Acción |
|------|--------|
| 1 | Busca Account con `ProviderId == "credentials"` por email. Usa `Include(a => a.User)` porque la query joinnea User. |
| 2 | Verifica el hash de la contraseña usando BCrypt. Mensaje genérico "Invalid credentials" (no revela si el email existe o no). |
| 3 | Obtiene el User por ID (el Include de Account podría no traer User si no se configuró eager loading). |
| 4 | Verifica soft delete. Usuario eliminado lógicamente no puede loguearse. |

**Seguridad:** El mensaje de error es genérico (`"Invalid credentials"`) para no dar pistas sobre qué dato es incorrecto (email o password). Esto previene ataques de enumeración de usuarios.

---

#### `RefreshAsync` — Rotación de Tokens

```csharp
    public async Task<RefreshResponse> RefreshAsync(string refreshToken)
    {
        // 1. Validar el refresh token JWT (firma, expiración)
        var principal = _tokenService.ValidateRefreshToken(refreshToken);
        if (principal == null)
            throw AppExceptions.Unauthorized("Invalid or expired refresh token");

        // 2. Extraer userId del token
        var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            throw AppExceptions.Unauthorized("Invalid refresh token");

        // 3. Buscar la sesión activa en DB por ese token
        var existingSession = await _sessionRepository.GetByTokenAsync(refreshToken);
        if (existingSession == null)
            throw AppExceptions.Unauthorized("Session not found");

        // 4. Verificar expiración de la sesión
        if (existingSession.ExpiresAt < DateTime.UtcNow)
            throw AppExceptions.Unauthorized("Session expired");

        // 5. Verificar que el usuario existe y está activo
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null || user.DeletedAt != null)
            throw AppExceptions.Unauthorized("User not found or deactivated");

        // 6. Generar NUEVOS tokens (rotación)
        var (newAccessToken, newRefreshToken) = _tokenService.GenerateTokens(
            user.Id, user.Email, user.Role);

        // 7. ELIMINAR la sesión anterior (invalida el refresh token viejo)
        await _sessionRepository.DeleteAsync(refreshToken);

        // 8. CREAR nueva sesión con el nuevo refresh token
        var newSession = new Session { ... };
        await _sessionRepository.CreateAsync(newSession);

        return new RefreshResponse { ... };
    }
```

**¿Por qué 4 verificaciones para el refresh token?**

| Nivel | Verificación | Qué previene |
|-------|-------------|--------------|
| 1 | JWT validation (firma + exp) | Token falsificado o expirado |
| 2 | Extraer userId | Token mal formado |
| 3 | Sesión existe en DB | Token revocado o ya usado (por rotación anterior) |
| 4 | Sesión no expirada | Token válido pero sesión expirada |
| 5 | Usuario activo | Usuario eliminado no puede refrescar |

**Rotación de refresh tokens** (pasos 7 y 8): Cada vez que se refresca, el token anterior se invalida y se crea uno nuevo. Esto significa que si alguien roba un refresh token y lo usa, el siguiente refresh del usuario legítimo fallará (porque el token ya fue usado/invalidado). El usuario legítimo tiene que volver a loguearse.

Esto se conoce como **refresh token rotation** y es una práctica de seguridad recomendada por OAuth 2.0.

---

#### `LogoutAsync`

```csharp
    public async Task LogoutAsync(string refreshToken)
    {
        await _sessionRepository.DeleteAsync(refreshToken);
    }
```

Simplemente elimina la sesión de la DB. Así el refresh token queda invalidado. Si alguien intenta usar ese token después, en el paso 3 de `RefreshAsync` no encontrará la sesión y fallará con "Session not found".

---

## 6. Luna.Infrastructure — Capa de Infraestructura

### 6.1. `Luna.Infrastructure.csproj`

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <ItemGroup>
    <ProjectReference Include="..\Luna.Application\Luna.Application.csproj" />
  </ItemGroup>

  <ItemGroup>
    <PackageReference Include="BCrypt.Net-Next" Version="4.2.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="10.0.0" />
    <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="10.0.0" />
    <PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="8.19.1" />
  </ItemGroup>

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <RootNamespace>Luna.Infrastructure</RootNamespace>
  </PropertyGroup>

</Project>
```

**Paquetes:**

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `BCrypt.Net-Next` | 4.2.0 | Hash de contraseñas con algoritmo BCrypt |
| `Microsoft.EntityFrameworkCore` | 10.0.0 | ORM para acceso a datos |
| `Npgsql.EntityFrameworkCore.PostgreSQL` | 10.0.0 | Driver de PostgreSQL para EF Core |
| `System.IdentityModel.Tokens.Jwt` | 8.19.1 | Generación y validación de JWT |

---

### 6.2. `Persistence/ApplicationDbContext.cs`

```csharp
using Luna.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Luna.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<Verification> Verifications => Set<Verification>();

    // Configuración adicional se carga desde Configurations/
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(ApplicationDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
```

**Explicación:**

- `Users => Set<User>()` — Es una propiedad `DbSet<T>` que usa **expression-bodied member** con `=>`. Es equivalente a:
  ```csharp
  public DbSet<User> Users { get { return Set<User>(); } }
  ```
  `Set<User>()` es un método de `DbContext` que devuelve el `DbSet` para la entidad.

- `ApplyConfigurationsFromAssembly(...)` — Busca automáticamente todas las clases que implementan `IEntityTypeConfiguration<T>` en el assembly de `ApplicationDbContext` y las aplica. Esto permite tener configuraciones separadas por entidad en lugar de un `OnModelCreating` gigante.

---

### 6.3. `Persistence/Configurations/` — Mapeo de Entidades a Tablas

#### `UserConfiguration.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Luna.Domain.Entities;
using Luna.Domain.Enums;

namespace Luna.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(u => u.Name).IsRequired().HasColumnName("name").HasMaxLength(255);
        builder.Property(u => u.Email).IsRequired().HasColumnName("email").HasMaxLength(255);
        builder.HasIndex(u => u.Email).IsUnique();

        builder.Property(u => u.EmailVerified).HasColumnName("email_verified")
            .IsRequired().HasDefaultValue(false);

        builder.Property(u => u.Phone).HasColumnName("phone");
        builder.Property(u => u.Image).HasColumnName("image");

        builder.Property(u => u.Role).HasColumnName("role")
            .IsRequired().HasDefaultValue(UserRole.User);

        builder.Property(u => u.UserName).HasColumnName("username").HasMaxLength(50);
        builder.HasIndex(u => u.UserName).IsUnique();

        builder.Property(u => u.Bio).HasColumnName("bio");

        builder.Property(u => u.IsActive).HasColumnName("is_active")
            .IsRequired().HasDefaultValue(true);

        builder.Property(u => u.LastSeenAt).HasColumnName("last_seen_at");

        builder.HasIndex(u => u.Role);
        builder.HasIndex(u => u.CreatedAt).HasDatabaseName("idx_users_created_at");

        builder.Property(u => u.CreatedAt).IsRequired().HasColumnName("created_at")
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
        builder.Property(u => u.UpdatedAt).IsRequired().HasColumnName("updated_at")
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
        builder.Property(u => u.DeletedAt).HasColumnName("deleted_at");
        builder.Property(u => u.DeletedByUserId).HasColumnName("deleted_by_user_id");
        builder.Property(u => u.DeletedByName).HasColumnName("deleted_by_name").HasMaxLength(255);
    }
}
```

**Decisiones de diseño en UserConfiguration:**

| Configuración | Explicación |
|---------------|-------------|
| `ToTable("Users")` | La tabla se llama "Users" en PostgreSQL (plural, PascalCase). |
| `HasDefaultValueSql("gen_random_uuid()")` | PostgreSQL genera el UUID automáticamente con su función nativa. Más rápido que generar Guid en C#. |
| `HasColumnName("name")` | Las columnas se mapean a snake_case en DB. `Name` en C# → `name` en PostgreSQL. |
| `HasMaxLength(255)` | Define tamaño máximo de columna. Es buena práctica para índices. |
| `HasDefaultValue(UserRole.User)` | El valor por defecto del enum en DB es 0 (User). |
| `HasDefaultValueSql("CURRENT_TIMESTAMP")` | PostgreSQL asigna la fecha automáticamente. Usa la hora del servidor de BD. |
| `HasIndex(u => u.Email).IsUnique()` | Índice único en email. Garantiza unicidad a nivel DB. |

#### `AccountConfiguration.cs`

```csharp
public class AccountConfiguration : IEntityTypeConfiguration<Account>
{
    public void Configure(EntityTypeBuilder<Account> builder)
    {
        builder.ToTable("Account");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(a => a.AccountId).IsRequired().HasColumnName("account_id");
        builder.HasIndex(a => a.AccountId);

        builder.Property(a => a.ProviderId).IsRequired().HasColumnName("provider_id");
        builder.HasIndex(a => a.ProviderId);

        // Índice compuesto único: un provider no puede tener dos veces el mismo accountId
        builder.HasIndex(a => new { a.ProviderId, a.AccountId }).IsUnique();

        builder.Property(a => a.UserId).IsRequired().HasColumnName("user_id");
        builder.HasIndex(a => a.UserId);

        // Relación N:1 con User
        builder.HasOne(a => a.User)
            .WithMany()                            // User no tiene una colección de Accounts (por ahora)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);     // Si se borra el User, se borran sus Accounts

        builder.Property(a => a.Password).HasColumnName("password");

        builder.Property(a => a.CreatedAt).IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP").HasColumnName("created_at");
        builder.Property(a => a.UpdatedAt).IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP").HasColumnName("updated_at");
    }
}
```

**Clave:** `HasIndex(a => new { a.ProviderId, a.AccountId }).IsUnique()` crea un **índice compuesto único**. Esto garantiza que no puedas tener dos cuentas de Google con el mismo AccountId. La combinación (ProviderId + AccountId) es única.

#### `SessionConfiguration.cs`

```csharp
public class SessionConfiguration : IEntityTypeConfiguration<Session>
{
    public void Configure(EntityTypeBuilder<Session> builder)
    {
        builder.ToTable("Sessions");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(s => s.ExpiresAt).IsRequired().HasColumnName("expires_at");

        builder.Property(s => s.Token).IsRequired().HasColumnName("token");
        builder.HasIndex(s => s.Token).IsUnique();  // El refresh token debe ser único

        builder.Property(s => s.CreatedAt).IsRequired().HasColumnName("created_at")
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
        builder.Property(s => s.UpdatedAt).IsRequired().HasColumnName("updated_at")
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.Property(s => s.IpAddress).HasColumnName("ip_address");
        builder.Property(s => s.UserAgent).HasColumnName("user_agent");

        builder.Property(s => s.UserId).IsRequired().HasColumnName("user_id");
        builder.HasIndex(s => s.UserId);
        builder.HasIndex(s => s.ExpiresAt);  // Índice para limpiar sesiones vencidas

        builder.HasOne(s => s.User)
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
```

**Índices importantes:**
1. `HasIndex(s => s.Token).IsUnique()` — El refresh token es único. Se busca por token en `GetByTokenAsync()` y `DeleteAsync()`.
2. `HasIndex(s => s.ExpiresAt)` — Permite buscar eficientemente sesiones vencidas para `DeleteExpiredAsync()`.

#### `VerificationConfiguration.cs`

```csharp
public class VerificationConfiguration : IEntityTypeConfiguration<Verification>
{
    public void Configure(EntityTypeBuilder<Verification> builder)
    {
        builder.ToTable("Verification");

        builder.HasKey(v => v.Id);
        builder.Property(v => v.Id).HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(v => v.Identifier).IsRequired().HasColumnName("identifier");
        builder.HasIndex(v => v.Identifier);

        builder.Property(v => v.Value).IsRequired().HasColumnName("value");
        builder.HasIndex(v => v.Value);

        builder.Property(v => v.ExpiresAt).IsRequired().HasColumnName("expires_at");
        builder.HasIndex(v => v.ExpiresAt);

        builder.Property(v => v.CreatedAt).IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP").HasColumnName("created_at");
        builder.Property(v => v.UpdatedAt).IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP").HasColumnName("updated_at");
    }
}
```

---

### 6.4. `Persistence/Repositories/` — Implementación de Acceso a Datos

#### `UserRepository.cs`

```csharp
using Luna.Application.Common.Interfaces;
using Luna.Application.Common.Models;
using Luna.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Luna.Infrastructure.Persistence.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }
```

**`GetAllAsync` con filtros dinámicos:**

```csharp
    public async Task<List<User>> GetAllAsync(UserFilter filter)
    {
        IQueryable<User> query = _context.Users.AsQueryable();

        // Filtro: excluir soft-deleted por defecto
        if (filter.IncludeDeleted != true)
            query = query.Where(u => u.DeletedAt == null);

        // Filtro: búsqueda por nombre o email (case-insensitive)
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search;
            query = query.Where(u =>
                EF.Functions.ILike(u.Name, $"%{search}%") ||
                EF.Functions.ILike(u.Email, $"%{search}%"));
        }

        // Filtro: por rol
        if (filter.Role.HasValue)
            query = query.Where(u => u.Role == filter.Role.Value);

        // Filtro: por estado activo
        if (filter.IsActive.HasValue)
            query = query.Where(u => u.IsActive == filter.IsActive.Value);

        return await query.OrderByDescending(u => u.CreatedAt).ToListAsync();
    }
```

**Cómo funciona el filtro dinámico:**

1. `_context.Users.AsQueryable()` — Obtiene un `IQueryable<User>`, que es una consulta que NO se ha ejecutado todavía.
2. Cada `query = query.Where(...)` agrega condiciones a la consulta SQL. Si el filtro no se especifica, no se agrega.
3. Al final, `ToListAsync()` ejecuta la consulta en DB.

**Ejemplo:** Si llamás `GetAllAsync(new UserFilter { Search = "orlando", Role = UserRole.User })`, el SQL generado será:

```sql
SELECT * FROM "Users" AS u
WHERE u."DeletedAt" IS NULL
  AND (u."Name" ILIKE '%orlando%' OR u."Email" ILIKE '%orlando%')
  AND u."Role" = 0
ORDER BY u."CreatedAt" DESC
```

Si llamás `GetAllAsync(new UserFilter { IncludeDeleted = true })`, el SQL será simplemente:

```sql
SELECT * FROM "Users" AS u
ORDER BY u."CreatedAt" DESC
```

**`EF.Functions.ILike`** es una función de EF Core PostgreSQL que genera `ILIKE` en SQL. `ILIKE` es LIKE pero **case-insensitive**. Así "Orlando", "ORLANDO", "orlando" todas matchean.

**`GetByIdAsync` y `GetByEmailAsync`:**

```csharp
    public async Task<User?> GetByIdAsync(Guid id)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.DeletedAt == null);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email && u.DeletedAt == null);
    }
```

Ambos excluyen usuarios soft-deleted. Si querés incluir eliminados, usás `RestoreAsync` que usa `IgnoreQueryFilters()`.

**`SoftDeleteAsync`:**

```csharp
    public async Task SoftDeleteAsync(Guid id, Guid deletedByUserId, string deletedByName)
    {
        var user = await _context.Users.FindAsync(id);
        if (user != null)
        {
            user.DeletedAt = DateTime.UtcNow;
            user.DeletedByUserId = deletedByUserId;
            user.DeletedByName = deletedByName;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }
    }
```

No borra el registro. Le setea `DeletedAt`, `DeletedByUserId` y `DeletedByName`. El `GetByIdAsync` y `GetByEmailAsync` lo excluyen automáticamente.

**`RestoreAsync`:**

```csharp
    public async Task RestoreAsync(Guid id)
    {
        var user = await _context.Users
            .IgnoreQueryFilters()             // Incluye soft-deleted
            .FirstOrDefaultAsync(u => u.Id == id);
        if (user != null)
        {
            user.DeletedAt = null;
            user.DeletedByUserId = null;
            user.DeletedByName = null;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }
    }
```

`IgnoreQueryFilters()` es necesario porque EF Core no tiene un query filter global en este proyecto. Pero si lo agregaran (ej: `builder.HasQueryFilter(u => u.DeletedAt == null)`), `RestoreAsync` lo necesitaría para encontrar usuarios eliminados.

---

#### `AccountRepository.cs`

```csharp
    public async Task<Account?> GetCredentialsByEmailAsync(string email)
    {
        return await _context.Accounts
            .Include(a => a.User)
            .FirstOrDefaultAsync(a =>
                a.ProviderId == "credentials" && a.User.Email == email);
    }
```

**¿Por qué `Include(a => a.User)`?** Porque necesitamos acceder a `User.Email` en el filtro. Sin el Include, EF Core haría lazy loading (otra consulta) o fallaría si está deshabilitado. Además, el `AuthService.LoginAsync()` usa `account.User.Email` después, así que lo necesitamos cargado.

**Nota:** Filtra por `ProviderId == "credentials"`. Esto es clave porque:
- Un usuario puede tener una cuenta de Google (`ProviderId = "google"`)
- Y otra de credentials (`ProviderId = "credentials"`)
- El login con email+password SOLO debe buscar en accounts de tipo "credentials"

---

#### `SessionRepository.cs`

```csharp
    public async Task DeleteAsync(string token)
    {
        var session = await _context.Sessions
            .FirstOrDefaultAsync(s => s.Token == token);
        if (session != null)
        {
            _context.Sessions.Remove(session);
            await _context.SaveChangesAsync();
        }
    }
```

Elimina por **token** (no por ID). Esto permite logout con solo el refresh token, sin necesidad de saber el ID de la sesión.

```csharp
    public async Task<int> DeleteExpiredAsync()
    {
        var expiredSessions = await _context.Sessions
            .Where(s => s.ExpiresAt < DateTime.UtcNow)
            .ToListAsync();
        int count = expiredSessions.Count;
        _context.Sessions.RemoveRange(expiredSessions);
        await _context.SaveChangesAsync();
        return count;
    }
```

Limpia sesiones expiradas. Devuelve cuántas eliminó. Útil para tareas programadas (ej: cada hora).

---

#### `VerificationRepository.cs`

```csharp
    public async Task<Verification?> GetByIdentifierAsync(string identifier)
    {
        return await _context.Verifications
            .Where(v => v.Identifier == identifier && v.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(v => v.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<Verification?> GetByIdentifierAndValueAsync(
        string identifier, string value)
    {
        return await _context.Verifications
            .Where(v => v.Identifier == identifier
                     && v.Value == value
                     && v.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(v => v.CreatedAt)
            .FirstOrDefaultAsync();
    }
```

Ambos métodos:
1. Filtran por identificador (email/teléfono)
2. Solo devuelven códigos **no expirados** (`ExpiresAt > DateTime.UtcNow`)
3. Ordenan por fecha de creación descendente (el más reciente primero)
4. Devuelven solo el primero (el más reciente)

---

### 6.5. `Services/` — Implementación de Servicios de Infraestructura

#### `PasswordService.cs`

```csharp
using Luna.Application.Common.Interfaces;

namespace Luna.Infrastructure.Services;

public class PasswordService : IPasswordService
{
    public string HashPassword(string password)
        => BCrypt.Net.BCrypt.HashPassword(password);

    public bool VerifyPassword(string password, string hash)
        => BCrypt.Net.BCrypt.Verify(password, hash);
}
```

**BCrypt:**
- `HashPassword(password)` → genera un hash de 60 caracteres que incluye el salt automáticamente.
- `VerifyPassword(password, hash)` → extrae el salt del hash, lo aplica a la password, y compara.
- Es **deliberadamente lento** (~100ms). Esto hace que ataques de fuerza bruta sean imprácticos.
- No necesitamos almacenar el salt por separado — BCrypt lo incluye en el hash mismo.

---

#### `TokenService.cs`

```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Luna.Application.Common.Interfaces;
using Luna.Domain.Enums;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;

namespace Luna.Infrastructure.Services;

public class TokenService : ITokenService
{
    private readonly string _secret;
    private readonly string _refreshSecret;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly TimeSpan _accessTokenExpiry;
    private readonly TimeSpan _refreshTokenExpiry;

    public TokenService(IConfiguration configuration)
    {
        // Lee todas las configuraciones JWT del appsettings.json
        _secret = configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("JWT Secret is not configured");
        _refreshSecret = configuration["Jwt:RefreshSecret"]
            ?? throw new InvalidOperationException("JWT RefreshSecret is not configured");
        _issuer = configuration["Jwt:Issuer"] ?? "cursinet-api";
        _audience = configuration["Jwt:Audience"] ?? "cursinet-app";
        _accessTokenExpiry = TimeSpan.Parse(
            configuration["Jwt:AccessTokenExpiry"] ?? "00:15:00");
        _refreshTokenExpiry = TimeSpan.Parse(
            configuration["Jwt:RefreshTokenExpiry"] ?? "7.00:00:00");
    }
```

**Constructor:** Recibe `IConfiguration` (no strings sueltos). Esto es mejor porque:
1. Todas las configuraciones vienen del mismo lugar
2. El DI resuelve `IConfiguration` automáticamente
3. No necesitamos registros complejos en DI

El operador `??` ataja `null` pero **no** strings vacíos. Si `Jwt:Secret` es `""`, pasa y después explota. Esto es un bug conocido que dejamos así para discutirlo.

**`GenerateTokens`:**

```csharp
    public (string accessToken, string refreshToken) GenerateTokens(
        Guid userId, string email, UserRole role)
    {
        var accessToken = GenerateAccessToken(userId, email, role);
        var refreshToken = GenerateRefreshToken(userId);
        return (accessToken, refreshToken);
    }
```

Usa **tuplas** (`(string, string)`) en vez de un objeto. Es más liviano para métodos que devuelven exactamente 2 valores.

**`GenerateAccessToken`:**

```csharp
    private string GenerateAccessToken(Guid userId, string email, UserRole role)
    {
        // 1. Crear clave simétrica a partir del secret
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));

        // 2. Crear credencial de firma con algoritmo HMAC-SHA256
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // 3. Definir claims (información del usuario dentro del token)
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(JwtRegisteredClaimNames.Email, email),
            new(ClaimTypes.Role, role.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        // 4. Crear el token JWT
        var token = new JwtSecurityToken(
            issuer: _issuer,           // Quién emitió el token
            audience: _audience,       // Para quién es el token
            claims: claims,            // Datos del usuario
            expires: DateTime.UtcNow.Add(_accessTokenExpiry),  // Expiración
            signingCredentials: credentials  // Firma
        );

        // 5. Serializar a string
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
```

**Las partes de un JWT:**

```
Header:    { "alg": "HS256", "typ": "JWT" }
Payload:   {
             "nameidentifier": "c46f17a7-...",  ← ClaimTypes.NameIdentifier
             "email": "user@email.com",           ← JwtRegisteredClaimNames.Email
             "role": "User",                      ← ClaimTypes.Role
             "jti": "a1b2c3d4-...",               ← JwtRegisteredClaimNames.Jti (ID único)
             "exp": 1700000000,                   ← Expiración
             "iss": "cursinet-api",               ← Issuer
             "aud": "cursinet-app"                ← Audience
           }
Signature: HMACSHA256(base64urlEncode(header) + "." + base64urlEncode(payload), secret)
```

**`GenerateRefreshToken`:**

```csharp
    private string GenerateRefreshToken(Guid userId)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_refreshSecret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: DateTime.UtcNow.Add(_refreshTokenExpiry),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
```

**Diferencia con access token:** el refresh token NO incluye `email` ni `role` en los claims. Solo lleva `NameIdentifier` (userId) y `Jti` (ID único del token). Menos datos = menos exposición si se filtra.

**`ValidateToken`:**

```csharp
    private ClaimsPrincipal? ValidateToken(string token, string secret)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var tokenHandler = new JwtSecurityTokenHandler();

        try
        {
            var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,   // Verifica la firma
                IssuerSigningKey = key,            // Clave para verificar la firma
                ValidIssuer = _issuer,             // Issuer esperado
                ValidAudience = _audience,         // Audience esperado
                ValidateIssuer = true,             // Verifica el issuer
                ValidateAudience = true,           // Verifica el audience
                ValidateLifetime = true,           // Verifica expiración
                ClockSkew = TimeSpan.Zero,         // Sin tolerancia de tiempo
            }, out _);

            return principal;  // Si llega acá, el token es válido
        }
        catch
        {
            return null;  // Token inválido o expirado
        }
    }
```

**`ClockSkew = TimeSpan.Zero`** — Por defecto, .NET da 5 minutos de tolerancia para diferencias de reloj entre servidores. Como tenemos un solo servidor, seteamos a cero para máxima seguridad.

**`catch` sin especificar tipo** — Atrapa cualquier excepción (token expirado, firma inválida, formato incorrecto) y devuelve `null`. El llamador (AuthService) sabe que `null` significa "token inválido".

---

### 6.6. `Migrations/` — Migraciones de Base de Datos

#### `20260715031852_init.cs`

```csharp
using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Luna.Infrastructure.Migrations
{
    public partial class init : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Crea tabla Users
            migrationBuilder.CreateTable(name: "Users", columns: ...);

            // Crea tabla Verifications
            migrationBuilder.CreateTable(name: "Verifications", columns: ...);

            // Crea tabla Accounts (con FK a Users)
            migrationBuilder.CreateTable(name: "Accounts", columns: ...);

            // Crea tabla Sessions (con FK a Users)
            migrationBuilder.CreateTable(name: "Sessions", columns: ...);

            // Crea índices
            migrationBuilder.CreateIndex(name: "IX_Accounts_UserId", ...);
            migrationBuilder.CreateIndex(name: "IX_Sessions_UserId", ...);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Rollback: elimina en orden inverso (primero hijos, luego padres)
            migrationBuilder.DropTable(name: "Accounts");
            migrationBuilder.DropTable(name: "Sessions");
            migrationBuilder.DropTable(name: "Verifications");
            migrationBuilder.DropTable(name: "Users");
        }
    }
}
```

**¿Por qué no se ven todos los índices de las configuraciones aquí?** Porque la migración se generó con EF Core. Las configuraciones de las entidades (`UserConfiguration`, etc.) definen índices únicos y compuestos que EF Core incluye automáticamente en la migración. Sin embargo, por temas de la versión de EF Core 10.0.9, algunos índices de las configuraciones más finas (como `HasIndex(u => u.Role)`) pueden no haberse generado porque el snapshot de la migración es anterior a agregar esas configuraciones.

**Para regenerar migraciones desde cero:**

```bash
dotnet ef migrations remove -s src/Luna.Api/Luna.Api.csproj -p src/Luna.Infrastructure/Luna.Infrastructure.csproj
dotnet ef migrations add init -s src/Luna.Api/Luna.Api.csproj -p src/Luna.Infrastructure/Luna.Infrastructure.csproj
```

---

## 7. Luna.Api — Capa de Presentación

### 7.1. `Luna.Api.csproj`

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <RootNamespace>Luna.Api</RootNamespace>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="FluentValidation.AspNetCore" Version="11.3.1" />
    <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="10.0.0" />
    <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="10.0.8" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.0.9">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\Luna.Infrastructure\Luna.Infrastructure.csproj" />
    <ProjectReference Include="..\Luna.Application\Luna.Application.csproj" />
  </ItemGroup>

</Project>
```

**Paquetes adicionales (no están en Infrastructure):**

| Paquete | Propósito |
|---------|-----------|
| `FluentValidation.AspNetCore` | Validación automática de requests usando FluentValidation |
| `Microsoft.AspNetCore.Authentication.JwtBearer` | Middleware de autenticación JWT para ASP.NET Core |
| `Microsoft.AspNetCore.OpenApi` | Generación de OpenAPI/Swagger |
| `Microsoft.EntityFrameworkCore.Design` | Necesario para comandos `dotnet ef` desde el startup project |

**`Microsoft.EntityFrameworkCore.Design`** tiene `PrivateAssets=all` porque solo es necesaria en tiempo de diseño (para generar migraciones), no en runtime.

---

### 7.2. `Program.cs`

```csharp
using System.Text.Json.Serialization;
using Luna.Api.Extensions;
using FluentValidation;

var builder = WebApplication.CreateBuilder(args);

// 1. Configurar JSON serialización
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Convierte enums a strings en vez de números
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// 2. OpenAPI / Swagger
builder.Services.AddOpenApi();

// 3. HttpContextAccessor (para helpers que necesitan HttpContext)
builder.Services.AddHttpContextAccessor();

// 4. FluentValidation (busca validadores en este assembly)
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// 5. Extensiones configurables
builder.Services.AddRateLimiterConfiguration();      // Rate limiting
builder.Services.AddCorsConfiguration(builder.Configuration); // CORS
builder.Services.AddDatabaseConfiguration(builder.Configuration); // EF Core
builder.Services.AddApplicationServices(builder.Configuration);  // DI

var app = builder.Build();

// 6. Configurar middleware pipeline
await app.ConfigureMiddlewareAsync();

app.Run();
```

**Orden de los `Add*` en services:** No importa el orden. Pero el orden de los `Use*` (middleware) sí importa — es el orden en que se ejecutan en cada request.

**`JsonStringEnumConverter`:** Hace que los enums se serialicen como strings:

```json
// Sin converter: "role": 0
// Con converter:  "role": "User"
```

Esto es mucho más legible para APIs públicas.

---

### 7.3. `Extensions/` — Métodos de Extensión para Configuración

#### `DatabaseExtensions.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Luna.Infrastructure.Persistence;

namespace Luna.Api.Extensions;

public static class DatabaseExtensions
{
    public static IServiceCollection AddDatabaseConfiguration(
        this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "DefaultConnection string is not configured.");

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(connectionString,
                b => b.MigrationsAssembly("Luna.Infrastructure")));

        return services;
    }
}
```

**`MigrationsAssembly("Luna.Infrastructure")`** — Esto le dice a EF Core que las migraciones se encuentran en el assembly `Luna.Infrastructure`. Es necesario porque el startup project es `Luna.Api`, pero las migraciones están en `Luna.Infrastructure`. Sin esto, EF Core buscaría las migraciones en `Luna.Api` y no las encontraría.

---

#### `DependencyInjectionExtensions.cs`

```csharp
using Luna.Api.Helpers;
using Luna.Application.Features.Auth;
using Luna.Application.Common.Interfaces;
using Luna.Infrastructure.Persistence.Repositories;
using Luna.Infrastructure.Services;

namespace Luna.Api.Extensions;

public static class DependencyInjectionExtensions
{
    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services, IConfiguration configuration)
    {
        // Helpers (HTTP-specific)
        services.AddScoped<CookieHelper>();

        // Services — Application Layer
        services.AddScoped<IAuthService, AuthService>();

        // Services — Infrastructure Layer
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IPasswordService, PasswordService>();

        // Repositories
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IAccountRepository, AccountRepository>();
        services.AddScoped<ISessionRepository, SessionRepository>();

        return services;
    }
}
```

**Registro de DI:**

| Interfaz | Implementación | Lifetime | Razón |
|----------|---------------|----------|-------|
| `IAuthService` | `AuthService` | Scoped | Tiene estado (DbContext) |
| `ITokenService` | `TokenService` | Scoped | Podría ser Singleton, pero ok |
| `IPasswordService` | `PasswordService` | Scoped | Podría ser Singleton, no tiene estado |
| `IUserRepository` | `UserRepository` | Scoped | Depende de DbContext (Scoped) |
| `IAccountRepository` | `AccountRepository` | Scoped | Idem |
| `ISessionRepository` | `SessionRepository` | Scoped | Idem |
| `CookieHelper` | `CookieHelper` | Scoped | Depende de IHttpContextAccessor |

**Obsesión con Scoped:** Todos los servicios son Scoped porque `ApplicationDbContext` es Scoped (por defecto en `AddDbContext`). Un servicio que depende de DbContext debe tener el mismo o menor lifetime que DbContext. Singleton+Scoped = error.

---

#### `CorsExtensions.cs`

```csharp
namespace Luna.Api.Extensions;

public static class CorsExtesions   // Nota: typo en el nombre de la clase
{
    public static IServiceCollection AddCorsConfiguration(
        this IServiceCollection services, IConfiguration configuration)
    {
        var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins")
            .Get<string[]>()
            ?? ["http://localhost:3000"];       // Default para desarrollo

        services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                policy.WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();    // Necesario para cookies
            });
        });

        return services;
    }
}
```

**`AllowCredentials()`** es FUNDAMENTAL. Si no lo ponés, el browser no va a enviar las cookies de autenticación (accessToken, refreshToken) en los requests. Pero ojo: `AllowCredentials()` es incompatible con `AllowAnyOrigin()`. Por eso usamos `WithOrigins(allowedOrigins)` con orígenes específicos.

**Default:** `["http://localhost:3000"]` para desarrollo con frontend en React/Vite.

---

#### `RateLimitExtensions.cs`

```csharp
using Microsoft.AspNetCore.RateLimiting;

namespace Luna.Api.Extensions;

public static class RateLimitExtensions
{
    public static IServiceCollection AddRateLimiterConfiguration(
        this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            // Política "Auth": 10 requests por minuto
            options.AddFixedWindowLimiter("Auth", opt =>
            {
                opt.PermitLimit = 10;
                opt.Window = TimeSpan.FromMinutes(1);
                opt.QueueProcessingOrder =
                    System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst;
                opt.QueueLimit = 0;  // Sin cola, rechaza inmediatamente
            });
        });

        return services;
    }
}
```

**Fixed Window Limiter:** Una ventana fija de 1 minuto. Si en un minuto se superan 10 requests, el resto son rechazados hasta que empiece el próximo minuto.

**Uso:** Para aplicar a un endpoint, se usa `[EnableRateLimiting("Auth")]` en el controller o action. Si no se aplica a ningún endpoint, el rate limiter está configurado pero no activo.

---

#### `MiddlewareExtensions.cs`

```csharp
using Luna.Api.Middleware;
using Luna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Luna.Api.Extensions;

public static class MiddlewareExtensions
{
    public static async Task<WebApplication> ConfigureMiddlewareAsync(
        this WebApplication app)
    {
        // Ejecutar migraciones pendientes automáticamente al iniciar
        using (var scope = app.Services.CreateScope())
        {
            var context = scope.ServiceProvider
                .GetRequiredService<ApplicationDbContext>();
            await context.Database.MigrateAsync();
        }

        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
        }

        app.UseHttpsRedirection();
        app.UseCors();

        app.UseResponseCaching();

        app.UseMiddleware<ErrorHandlingMiddleware>();

        app.UseAuthentication();
        app.UseAuthorization();

        app.MapControllers();

        // Health check endpoint
        app.MapGet("/health", () => "ok");

        return app;
    }
}
```

**Orden del middleware pipeline (importante):**

```
Request →
  1. HttpsRedirection
  2. CORS
  3. ResponseCaching
  4. ErrorHandlingMiddleware  ← Atrapa errores de todo lo que sigue
  5. Authentication           ← Valida JWT
  6. Authorization            ← Verifica roles
  7. MapControllers           ← Ejecuta el controller
Response ←
```

**`ErrorHandlingMiddleware` va ANTES de Authentication/Authorization.** Esto es clave porque si el middleware de autenticación falla, el error se propaga hacia arriba y el ErrorHandlingMiddleware lo captura y devuelve un JSON bonito en vez de un HTML feo.

**`context.Database.MigrateAsync()`:** Aplica migraciones automáticamente al iniciar la app. Esto es práctico para desarrollo pero peligroso en producción — en producción se usan migraciones controladas (CI/CD).

---

### 7.4. `Middleware/ErrorHandlingMiddleware.cs`

```csharp
using System.Net;
using System.Text.Json;
using Luna.Domain.Exceptions;

namespace Luna.Api.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next,
        ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);  // Ejecuta el resto del pipeline
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Ocurrió un error no controlado en la ruta {Path}",
                context.Request.Path);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(
        HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        // Asigna código HTTP según el tipo de excepción
        context.Response.StatusCode = exception switch
        {
            AppException appEx => appEx.StatusCode,
            _ => (int)HttpStatusCode.InternalServerError
        };

        if (exception is AppException appException)
        {
            var response = new
            {
                type = "https://tools.ietf.org/html/rfc7807",  // RFC 7807 Problem Details
                title = appException.StatusCode switch
                {
                    400 => "Bad Request",
                    401 => "Unauthorized",
                    403 => "Forbidden",
                    404 => "Not Found",
                    409 => "Conflict",
                    422 => "Unprocessable Entity",
                    _ => "Error"
                },
                status = appException.StatusCode,
                detail = appException.Message,
                code = appException.Code
            };
            return context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
        else
        {
            // Errores inesperados: no exponer detalles internos
            var response = new
            {
                type = "https://tools.ietf.org/html/rfc7807",
                title = "Internal Server Error",
                status = 500,
                detail = "An unexpected error occurred. Please try again later.",
                code = "internal.error"
            };
            return context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
    }
}
```

**Ejemplo de respuesta de error:**

```json
{
    "type": "https://tools.ietf.org/html/rfc7807",
    "title": "Conflict",
    "status": 409,
    "detail": "Email already registered",
    "code": "CONFLICT"
}
```

**Seguridad:** Errores no operativos (bugs) nunca exponen detalles internos. Siempre devuelven:

```json
{
    "type": "https://tools.ietf.org/html/rfc7807",
    "title": "Internal Server Error",
    "status": 500,
    "detail": "An unexpected error occurred. Please try again later.",
    "code": "internal.error"
}
```

Nada de stack traces, nada de "NullReferenceException en línea 42". Solo un mensaje genérico.

---

### 7.5. `Helpers/` — Clases de Ayuda HTTP

#### `AuthHelper.cs`

```csharp
using System.Security.Claims;
using Luna.Domain.Enums;
using Luna.Domain.Exceptions;

namespace Luna.Api.Helpers;

public static class AuthHelper
{
    // Obtiene el userId del token JWT actual
    public static Guid? GetCurrentUserId(this HttpContext httpContext)
    {
        var userIdClaim = httpContext.User
            .FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return userIdClaim != null && Guid.TryParse(userIdClaim, out var userId)
            ? userId
            : null;
    }

    // Obtiene el rol del usuario actual (lanza excepción si no está autenticado)
    public static UserRole GetCurrentUserRole(this HttpContext httpContext)
    {
        var roleClaim = httpContext.User
            .FindFirst(ClaimTypes.Role)?.Value
            ?? throw AppExceptions.Unauthorized("User role claim is missing");

        if (!Enum.TryParse<UserRole>(roleClaim, out var role))
            throw AppExceptions.Unauthorized($"Invalid user role: {roleClaim}");

        return role;
    }

    // Obtiene el rol del usuario actual (devuelve null si no está autenticado)
    public static UserRole? GetCurrentUserRoleOrDefault(this HttpContext httpContext)
    {
        var roleClaim = httpContext.User
            .FindFirst(ClaimTypes.Role)?.Value;
        if (roleClaim == null) return null;

        if (!Enum.TryParse<UserRole>(roleClaim, out var role))
            throw AppExceptions.Unauthorized($"Invalid user role: {roleClaim}");

        return role;
    }
}
```

**¿Por qué son extension methods de `HttpContext`?**

Porque así se usan naturalmente:

```csharp
// En un controller:
var userId = HttpContext.GetCurrentUserId();
```

Sin tener que inyectar ni crear instancias. Son funciones estáticas que operan sobre el HttpContext.

**`GetCurrentUserId` devuelve `Guid?` (nullable):** Si el usuario no está autenticado, devuelve `null` en vez de lanzar excepción. Esto permite:

```csharp
var currentUserId = HttpContext.GetCurrentUserId();
if (currentUserId.HasValue)
{
    // Usuario autenticado — comportamiento especial
}
// Si no, sigue normalmente
```

---

#### `CookieHelper.cs`

```csharp
namespace Luna.Api.Helpers;

public class CookieHelper
{
    private readonly IWebHostEnvironment _environment;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CookieHelper(
        IWebHostEnvironment environment,
        IHttpContextAccessor httpContextAccessor)
    {
        _environment = environment;
        _httpContextAccessor = httpContextAccessor;
    }

    public void SetAuthCookies(string accessToken, string refreshToken)
    {
        var response = _httpContextAccessor.HttpContext?.Response;
        if (response == null) return;

        bool isProduction = _environment.IsProduction();

        var accessTokenOptions = new CookieOptions
        {
            Path = "/",
            HttpOnly = true,             // No accesible desde JavaScript
            Secure = isProduction,       // Solo HTTPS en producción
            SameSite = SameSiteMode.Strict,  // No enviar en requests cross-site
            Expires = DateTimeOffset.UtcNow.AddMinutes(15)
        };

        var refreshTokenOptions = new CookieOptions
        {
            Path = "/",
            HttpOnly = true,
            Secure = isProduction,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        };

        response.Cookies.Append("accessToken", accessToken, accessTokenOptions);
        response.Cookies.Append("refreshToken", refreshToken, refreshTokenOptions);
    }

    public void ClearAuthCookies()
    {
        var response = _httpContextAccessor.HttpContext?.Response;
        if (response == null) return;

        var cookieOptions = new CookieOptions { Path = "/" };
        response.Cookies.Delete("accessToken", cookieOptions);
        response.Cookies.Delete("refreshToken", cookieOptions);
    }
}
```

**Cookie options explicados:**

| Opción | Valor | Por qué |
|--------|-------|---------|
| `HttpOnly = true` | No accesible desde JS | Previene XSS: un script injected no puede leer los tokens |
| `Secure = isProduction` | Solo HTTPS en prod | En desarrollo HTTP está bien, en producción obligatorio HTTPS |
| `SameSite = Strict` | No se envía cross-site | Previene CSRF: si visitás un sitio malicioso, no envía las cookies |
| `Expires` | 15 min / 7 días | Coincide con la expiración de los tokens JWT |

---

### 7.6. `Controllers/AuthController.cs`

```csharp
using Luna.Application.Common.Interfaces;
using Luna.Application.Common.Models;
using Luna.Api.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace Luna.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly CookieHelper _cookieHelper;

    public AuthController(
        IAuthService authService,
        CookieHelper cookieHelper)
    {
        _authService = authService;
        _cookieHelper = cookieHelper;
    }
```

**`[ApiController]`** y **`[Route("api/v1/auth")]`**:
- `[ApiController]` habilita comportamientos automáticos: validación de modelos, inferencia de bindings, etc.
- La ruta base es `/api/v1/auth`. Versionado explícito en la URL (v1).

---

#### `POST /api/v1/auth/register`

```csharp
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(
        [FromBody] RegisterRequest request)
    {
        // Si el usuario ya está autenticado, no puede registrarse
        var currentUserId = HttpContext.GetCurrentUserId();
        if (currentUserId.HasValue)
            return Conflict("Already logged in. Please logout before creating a new account.");

        var result = await _authService.RegisterAsync(request);

        // Setear cookies con los tokens
        _cookieHelper.SetAuthCookies(result.AccessToken, result.RefreshToken);

        // 201 Created
        return CreatedAtAction(null, new
        {
            message = result.Message,
            user = result.User
        });
    }
```

**¿Por qué 201 Created y no 200 OK?**
- `POST /register` crea un recurso (usuario) → 201 Created es más preciso
- `POST /login` no crea nada, solo autentica → 200 OK

**¿Por qué setear cookies si también devolvemos tokens en el body?**
Las cookies permiten autenticación automática en requests subsecuentes (el browser las envía solas). Los tokens en el body son para el frontend que quiera usarlos explícitamente (ej: almacenarlos en memoria). Es tener ambas opciones.

---

#### `POST /api/v1/auth/login`

```csharp
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(
        [FromBody] LoginRequest request)
    {
        var currentUserId = HttpContext.GetCurrentUserId();

        var result = await _authService.LoginAsync(request);

        // Si había una sesión previa (otro usuario logueado), limpiar cookies
        if (currentUserId.HasValue && currentUserId != result.User?.Id)
            _cookieHelper.ClearAuthCookies();

        _cookieHelper.SetAuthCookies(result.AccessToken, result.RefreshToken);

        return Ok(new
        {
            message = result.Message,
            user = result.User
        });
    }
```

**Caso borde:** Si el usuario A está logueado (tiene cookies) y alguien hace login con usuario B, se limpian las cookies viejas y se setean las nuevas. Esto previene que queden cookies huérfanas.

---

#### `POST /api/v1/auth/refresh`

```csharp
    [HttpPost("refresh")]
    public async Task<ActionResult<RefreshResponse>> Refresh(
        [FromBody] RefreshRequest? request = null)
    {
        // Obtener refresh token de la cookie
        var refreshToken = Request.Cookies["refreshToken"] ?? string.Empty;
        if (string.IsNullOrEmpty(refreshToken))
            return BadRequest(new { error = "Refresh token is required" });

        var result = await _authService.RefreshAsync(refreshToken);

        // Setear nuevas cookies (rotación)
        _cookieHelper.SetAuthCookies(result.AccessToken, result.RefreshToken);

        return Ok(result);
    }
```

**¿Por qué leer de cookie y no del body?**
- El refresh token está en cookie HttpOnly → más seguro
- El body `RefreshRequest` existe como fallback (parámetro nullable)
- La cookie es la fuente primaria

---

#### `POST /api/v1/auth/logout`

```csharp
    [HttpPost("logout")]
    public async Task<ActionResult> Logout()
    {
        var refreshToken = Request.Cookies["refreshToken"] ?? string.Empty;
        if (!string.IsNullOrEmpty(refreshToken))
            await _authService.LogoutAsync(refreshToken);

        _cookieHelper.ClearAuthCookies();
        return Ok(new { message = "Logged out successfully" });
    }
```

**Importante:** Siempre limpia las cookies, incluso si el token no existe o la eliminación falla. El usuario debe poder "salir" aunque haya problemas de DB.

---

### 7.7. `appsettings.json` y `appsettings.Development.json`

#### `appsettings.json` (base)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=luna_db;Username=user;Password=password"
  },
  "Jwt": {
    "Secret": "dsasdfasdfasfd",
    "RefreshSecret": "asdfasdfdasfadsf",
    "AccessTokenExpiry": "00:15:00",
    "RefreshTokenExpiry": "7.00:00:00",
    "Issuer": "cursinet-api",
    "Audience": "cursinet-app"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

#### `appsettings.Development.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=luna_db;Username=user;Password=password"
  },
  "Jwt": {
    "Secret": "asjdfañlsjfas",
    "RefreshSecret": "slkjdfñlasjfalñs",
    "AccessTokenExpiry": "00:15:00",
    "RefreshTokenExpiry": "7.00:00:00",
    "Issuer": "luna-api",
    "Audience": "luna-app"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

**⚠️ Problema conocido:** `appsettings.Development.json` tiene `"Secret": ""` y `"RefreshSecret": ""`. Esto pisa los valores de `appsettings.json` y causa el error `IDX10703: key length is zero`. Solución: poner secrets reales en Development.json o eliminar las claves vacías.

**Orden de sobreescritura de configuraciones:**
1. `appsettings.json` (base, valores por defecto)
2. `appsettings.{Environment}.json` (pisa los anteriores según el entorno)
3. Variables de entorno (pisan todo)
4. Command-line arguments (pisan todo)

---

### 7.8. `Properties/launchSettings.json`

```json
{
  "$schema": "https://json.schemastore.org/launchsettings.json",
  "profiles": {
    "http": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": false,
      "applicationUrl": "http://localhost:5274",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    },
    "https": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": false,
      "applicationUrl": "https://localhost:7175;http://localhost:5274",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
```

**Puertos:**
- HTTP: `5274`
- HTTPS: `7175`

---

## 8. Flujo Completo: Register

```
Cliente                          API Server                      PostgreSQL
  │                                │                                │
  │  POST /api/v1/auth/register    │                                │
  │  {name, email, password}       │                                │
  │───────────────────────────────>│                                │
  │                                │                                │
  │                                │ 1. Verificar email duplicado   │
  │                                │──────────────────────────────>│
  │                                │<──────────────────────────────│
  │                                │                                │
  │                                │ 2. Hashear password (BCrypt)   │
  │                                │                                │
  │                                │ 3. INSERT User                 │
  │                                │──────────────────────────────>│
  │                                │<──────────────────────────────│
  │                                │                                │
  │                                │ 4. INSERT Account (credentials)│
  │                                │──────────────────────────────>│
  │                                │<──────────────────────────────│
  │                                │                                │
  │                                │ 5. Generar JWT tokens          │
  │                                │    (access + refresh)          │
  │                                │                                │
  │                                │ 6. INSERT Session              │
  │                                │    (guarda refresh token)      │
  │                                │──────────────────────────────>│
  │                                │<──────────────────────────────│
  │                                │                                │
  │  Set-Cookie: accessToken       │                                │
  │  Set-Cookie: refreshToken      │                                │
  │  201 {user, message}           │                                │
  │<───────────────────────────────│                                │
```

**Archivos involucrados:**
1. `AuthController.cs` — Recibe request, llama a AuthService
2. `AuthService.cs` — Orquesta la lógica
3. `UserRepository.cs` — Verifica email, crea User
4. `AccountRepository.cs` — Crea Account
5. `PasswordService.cs` — Hashea password
6. `TokenService.cs` — Genera JWT
7. `SessionRepository.cs` — Crea sesión
8. `CookieHelper.cs` — Setea cookies
9. `MappingUser.cs` — Mapea User → UserDto

---

## 9. Flujo Completo: Login

```
Cliente                          API Server                      PostgreSQL
  │                                │                                │
  │  POST /api/v1/auth/login       │                                │
  │  {email, password}             │                                │
  │───────────────────────────────>│                                │
  │                                │                                │
  │                                │ 1. Buscar Account por email    │
  │                                │    (solo "credentials")        │
  │                                │──────────────────────────────>│
  │                                │<────────── Account + User ────│
  │                                │                                │
  │                                │ 2. Verificar password (BCrypt) │
  │                                │                                │
  │                                │ 3. Verificar User activo       │
  │                                │    (no soft-deleted)           │
  │                                │                                │
  │                                │ 4. Generar nuevos tokens       │
  │                                │                                │
  │                                │ 5. INSERT nueva Session        │
  │                                │──────────────────────────────>│
  │                                │<──────────────────────────────│
  │                                │                                │
  │  Set-Cookie (nuevos tokens)    │                                │
  │  200 {user, message}           │                                │
  │<───────────────────────────────│                                │
```

---

## 10. Flujo Completo: Refresh

```
Cliente                          API Server                      PostgreSQL
  │                                │                                │
  │  POST /api/v1/auth/refresh     │                                │
  │  Cookie: refreshToken=xxx      │                                │
  │───────────────────────────────>│                                │
  │                                │                                │
  │                                │ 1. Validar JWT refresh token   │
  │                                │    (firma HMAC, expiración)    │
  │                                │                                │
  │                                │ 2. Extraer userId del token    │
  │                                │                                │
  │                                │ 3. Buscar Session por token    │
  │                                │──────────────────────────────>│
  │                                │<──────────────────────────────│
  │                                │                                │
  │                                │ 4. Verificar sesión no expirada│
  │                                │                                │
  │                                │ 5. Verificar usuario activo    │
  │                                │                                │
  │                                │ 6. Generar NUEVOS tokens       │
  │                                │                                │
  │                                │ 7. DELETE sesión vieja         │
  │                                │──────────────────────────────>│
  │                                │                                │
  │                                │ 8. INSERT nueva sesión         │
  │                                │──────────────────────────────>│
  │                                │<──────────────────────────────│
  │                                │                                │
  │  Set-Cookie (nuevos tokens)    │                                │
  │  200 {new tokens, message}     │                                │
  │<───────────────────────────────│                                │
```

**Rotación de tokens:** El refresh token anterior queda invalidado después de usarlo. Si alguien lo robó y lo usó, el usuario legítimo tendrá que hacer login otra vez.

---

## 11. Flujo Completo: Logout

```
Cliente                          API Server                      PostgreSQL
  │                                │                                │
  │  POST /api/v1/auth/logout      │                                │
  │  Cookie: refreshToken=xxx      │                                │
  │───────────────────────────────>│                                │
  │                                │                                │
  │                                │ 1. Leer refreshToken de cookie │
  │                                │                                │
  │                                │ 2. DELETE Session por token    │
  │                                │──────────────────────────────>│
  │                                │<──────────────────────────────│
  │                                │                                │
  │  Clear-Cookie (ambos tokens)   │                                │
  │  200 {message}                 │                                │
  │<───────────────────────────────│                                │
```

---

## 12. Comandos para Replicar

### 12.1. Crear el proyecto desde cero

```bash
# Crear solución (opcional)
mkdir backend && cd backend

# Crear proyectos
dotnet new classlib -n Luna.Domain -o src/Luna.Domain
dotnet new classlib -n Luna.Application -o src/Luna.Application
dotnet new classlib -n Luna.Infrastructure -o src/Luna.Infrastructure
dotnet new webapi -n Luna.Api -o src/Luna.Api --no-openapi

# Agregar referencias entre proyectos
dotnet add src/Luna.Application/Luna.Application.csproj reference src/Luna.Domain/Luna.Domain.csproj
dotnet add src/Luna.Infrastructure/Luna.Infrastructure.csproj reference src/Luna.Application/Luna.Application.csproj
dotnet add src/Luna.Api/Luna.Api.csproj reference src/Luna.Application/Luna.Application.csproj
dotnet add src/Luna.Api/Luna.Api.csproj reference src/Luna.Infrastructure/Luna.Infrastructure.csproj
```

### 12.2. Agregar paquetes NuGet

```bash
# Infrastructure
dotnet add src/Luna.Infrastructure/Luna.Infrastructure.csproj package BCrypt.Net-Next --version 4.2.0
dotnet add src/Luna.Infrastructure/Luna.Infrastructure.csproj package Microsoft.EntityFrameworkCore --version 10.0.0
dotnet add src/Luna.Infrastructure/Luna.Infrastructure.csproj package Npgsql.EntityFrameworkCore.PostgreSQL --version 10.0.0
dotnet add src/Luna.Infrastructure/Luna.Infrastructure.csproj package System.IdentityModel.Tokens.Jwt --version 8.19.1

# Api
dotnet add src/Luna.Api/Luna.Api.csproj package FluentValidation.AspNetCore --version 11.3.1
dotnet add src/Luna.Api/Luna.Api.csproj package Microsoft.AspNetCore.Authentication.JwtBearer --version 10.0.0
dotnet add src/Luna.Api/Luna.Api.csproj package Microsoft.AspNetCore.OpenApi --version 10.0.8
dotnet add src/Luna.Api/Luna.Api.csproj package Microsoft.EntityFrameworkCore.Design --version 10.0.9
```

### 12.3. Crear migraciones

```bash
# Asegurarse de tener EF CLI
dotnet tool install --global dotnet-ef

# Crear migración inicial
dotnet ef migrations add init \
  -s src/Luna.Api/Luna.Api.csproj \
  -p src/Luna.Infrastructure/Luna.Infrastructure.csproj

# Aplicar migraciones a la DB
dotnet ef database update \
  -s src/Luna.Api/Luna.Api.csproj \
  -p src/Luna.Infrastructure/Luna.Infrastructure.csproj
```

### 12.4. Crear la base de datos en PostgreSQL

```sql
-- Opción 1: Desde psql
CREATE DATABASE luna_db;

-- Opción 2: Usando dotnet (crea automáticamente al migrar si no existe)
-- Configurar connection string en appsettings.json
```

### 12.5. Ejecutar el proyecto

```bash
# Desde la carpeta backend/
dotnet run --project src/Luna.Api/Luna.Api.csproj

# O desde src/Luna.Api/
dotnet run

# La API arranca en:
# http://localhost:5274
# https://localhost:7175 (si usás HTTPS)
```

### 12.6. Probar endpoints

```bash
# Health check
curl http://localhost:5274/health

# Registrar usuario
curl -X POST http://localhost:5274/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Orlando", "email": "orlando@email.com", "password": "MiPassword123!"}'

# Login
curl -X POST http://localhost:5274/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "orlando@email.com", "password": "MiPassword123!"}'

# Logout
curl -X POST http://localhost:5274/api/v1/auth/logout \
  -H "Cookie: refreshToken=TOKEN_OBTENIDO_EN_LOGIN"
```

---


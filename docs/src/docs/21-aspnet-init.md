# ASP.NET Core Init - Manual Técnico Completo

Manual completo para instalar y desarrollar con **.NET 10** en **Debian 13 (Trixie)**, incluyendo instalación, creación de API con Clean Architecture, Entity Framework Core, autenticación JWT, y comandos de administración.

---

## Índice

1. [Instalación de .NET 10 en Debian 13](#1-instalación-de-net-10-en-debian-13)
2. [Verificar Instalación](#2-verificar-instalación)
3. [Desinstalar .NET](#3-desinstalar-net)
4. [Estructura del Proyecto](#4-estructura-del-proyecto)
5. [Configuración Principal](#5-configuración-principal)
6. [Capa de Dominio](#6-capa-de-dominio)
7. [Capa de Aplicación](#7-capa-de-aplicación)
8. [Capa de Infraestructura](#8-capa-de-infraestructura)
9. [Capa de Presentación](#9-capa-de-presentación)
10. [Entity Framework Core - ORM](#10-entity-framework-core---orm)
11. [Migraciones](#11-migraciones)
12. [Endpoints](#12-endpoints)
13. [Comandos Útiles](#13-comandos-útiles)
14. [Resumen de Patrones](#14-resumen-de-patrones)

---

## 1. Instalación de .NET 10 en Debian 13

### 1.1 Requisitos del Sistema

- **Debian 13 (Trixie)** - amd64 o arm64
- 2 GB RAM (mínimo), 4 GB recomendado
- 5 GB de espacio libre en disco
- Conexión a Internet

### 1.2 Instalación por APT (recomendada)

```bash
# 1. Registrar el repositorio de Microsoft
wget https://packages.microsoft.com/config/debian/13/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
rm packages-microsoft-prod.deb

# 2. Actualizar índices de paquetes
sudo apt update

# 3. Instalar .NET SDK 10 (incluye runtime y ASP.NET Core)
sudo apt install -y dotnet-sdk-10.0
```

**¿Qué instala esto?**

| Componente | Descripción |
|------------|-------------|
| `dotnet-sdk-10.0` | SDK completo: compilador C#, runtime, herramientas CLI |
| `aspnetcore-runtime-10.0` | Runtime de ASP.NET Core (incluido en el SDK) |
| `dotnet-runtime-10.0` | Runtime base de .NET (incluido en el SDK) |

### 1.3 Instalación Solo Runtime (para producción)

Si solo necesitas **ejecutar** aplicaciones (no desarrollarlas):

```bash
sudo apt install -y aspnetcore-runtime-10.0
```

### 1.4 Instalación por Script (alternativa)

```bash
# Descargar e instalar con script oficial
wget https://dot.net/v1/dotnet-install.sh
chmod +x dotnet-install.sh
./dotnet-install.sh --channel 10.0

# Agregar al PATH (bash)
echo 'export DOTNET_ROOT=$HOME/.dotnet' >> ~/.bashrc
echo 'export PATH=$PATH:$DOTNET_ROOT:$DOTNET_ROOT/tools' >> ~/.bashrc
source ~/.bashrc
```

### 1.5 Instalación de Dependencias Adicionales

```bash
# PostgreSQL (para producción)
sudo apt install -y postgresql postgresql-contrib

# Redis (para caché/sesiones)
sudo apt install -y redis-server

# Herramientas de desarrollo
sudo apt install -y git curl build-essential
```

---

## 2. Verificar Instalación

```bash
# Versión del SDK instalado
dotnet --version
# Output esperado: 10.0.xxx

# Listar todos los SDKs instalados
dotnet --list-sdks
# Output esperado: 10.0.xxx [/usr/share/dotnet/sdk]

# Listar todos los runtimes instalados
dotnet --list-runtimes
# Output esperado:
# Microsoft.AspNetCore.App 10.0.xxx [/usr/share/dotnet/shared/Microsoft.AspNetCore.App]
# Microsoft.NETCore.App 10.0.xxx [/usr/share/dotnet/shared/Microsoft.NETCore.App]

# Info completa
dotnet --info

# Verificar que funciona
dotnet new console -n hola-mundo
cd hola-mundo
dotnet run
```

---

## 3. Desinstalar .NET

### 3.1 Desinstalar por APT (instalación por paquetes)

```bash
# Desinstalar SDK
sudo apt remove -y dotnet-sdk-10.0

# Desinstalar runtimes
sudo apt remove -y aspnetcore-runtime-10.0
sudo apt remove -y dotnet-runtime-10.0

# Opcional: eliminar paquetes no usados
sudo apt autoremove -y

# Opcional: eliminar el repositorio de Microsoft
sudo dpkg -r packages-microsoft-prod

# Eliminar el archivo de lista del repositorio
sudo rm -f /etc/apt/sources.list.d/microsoft-prod.list
sudo apt update
```

### 3.2 Desinstalar Instalación por Script

```bash
# Eliminar directorio de instalación
rm -rf $HOME/.dotnet

# Limpiar del PATH (editar ~/.bashrc o ~/.zshrc)
# Eliminar o comentar las líneas:
# export DOTNET_ROOT=$HOME/.dotnet
# export PATH=$PATH:$DOTNET_ROOT:$DOTNET_ROOT/tools
```

### 3.3 Desinstalar Versiones Específicas

```bash
# Listar SDKs instalados
dotnet --list-sdks

# Eliminar manualmente versiones específicas
sudo rm -rf /usr/share/dotnet/sdk/<version>
sudo rm -rf /usr/share/dotnet/shared/Microsoft.AspNetCore.App/<version>
sudo rm -rf /usr/share/dotnet/shared/Microsoft.NETCore.App/<version>

# Ejemplo: eliminar .NET 8.0
sudo rm -rf /usr/share/dotnet/sdk/8.0.*
sudo rm -rf /usr/share/dotnet/shared/Microsoft.AspNetCore.App/8.0.*
sudo rm -rf /usr/share/dotnet/shared/Microsoft.NETCore.App/8.0.*
```

### 3.4 Desinstalar TODO .NET (limpieza completa)

```bash
# Eliminar todos los SDKs y runtimes
sudo rm -rf /usr/share/dotnet

# Eliminar repositorio Microsoft
sudo rm -f /etc/apt/sources.list.d/microsoft-prod.list
sudo apt update

# Limpiar paquetes huérfanos
sudo apt autoremove --purge -y

# Verificar que no queda nada
dotnet --version  # Debería dar: command not found
```

---

## 4. Estructura del Proyecto

```
src/
├── Domain/                               # Capa de dominio (entidades puras)
│   ├── Entities/
│   │   ├── User.cs
│   │   ├── Account.cs
│   │   ├── Session.cs
│   │   └── Verification.cs
│   ├── Enums/
│   │   └── Role.cs
│   ├── ValueObjects/                     # Objetos de valor
│   └── Exceptions/
│       └── AppException.cs              # Errores personalizados
│
├── Application/                          # Capa de aplicación (casos de uso)
│   ├── Common/
│   │   ├── Interfaces/
│   │   │   ├── IUserRepository.cs
│   │   │   ├── IAccountRepository.cs
│   │   │   ├── ISessionRepository.cs
│   │   │   ├── IVerificationRepository.cs
│   │   │   ├── ITokenService.cs
│   │   │   └── IPasswordService.cs
│   │   └── Mapping/
│   │       └── MappingProfile.cs
│   └── Features/
│       └── Auth/
│           ├── Commands/                 # Comandos CQRS
│           │   ├── RegisterCommand.cs
│           │   ├── LoginCommand.cs
│           │   ├── RefreshTokenCommand.cs
│           │   ├── VerifyEmailCommand.cs
│           │   ├── ForgotPasswordCommand.cs
│           │   └── ResetPasswordCommand.cs
│           ├── Queries/                  # Queries CQRS
│           │   ├── GetUserSessionsQuery.cs
│           │   └── RevokeSessionQuery.cs
│           └── AuthService.cs           # Servicio de autenticación
│
├── Infrastructure/                       # Capa de infraestructura
│   ├── Persistence/
│   │   ├── ApplicationDbContext.cs       # Contexto de EF Core
│   │   ├── Configurations/              # Configuración de entidades EF
│   │   │   ├── UserConfiguration.cs
│   │   │   ├── AccountConfiguration.cs
│   │   │   └── SessionConfiguration.cs
│   │   └── Repositories/                # Implementaciones de repositorios
│   │       ├── UserRepository.cs
│   │       ├── AccountRepository.cs
│   │       ├── SessionRepository.cs
│   │       └── VerificationRepository.cs
│   └── Services/
│       ├── TokenService.cs              # JWT tokens
│       └── PasswordService.cs           # BCrypt hashing
│
└── Api/                                  # Capa de presentación (API)
    ├── Controllers/
    │   └── AuthController.cs
    ├── DTOs/
    │   ├── RegisterRequest.cs
    │   ├── LoginRequest.cs
    │   └── AuthResponse.cs
    ├── Middleware/
    │   └── ErrorHandlingMiddleware.cs
    ├── Filters/
    │   └── AuthGuardAttribute.cs
    └── Program.cs                       # Punto de entrada
```

### Correspondencia Fastify → ASP.NET Core

| Fastify | ASP.NET Core |
|---------|--------------|
| Fastify framework | ASP.NET Core Minimal/Controller APIs |
| Prisma ORM | Entity Framework Core 10 |
| pino logger | Serilog |
| Zod validation | FluentValidation |
| bcrypt | BCrypt.Net-Next |
| jsonwebtoken | System.IdentityModel.Tokens.Jwt |
| ioredis | StackExchange.Redis |
| Decorators/Plugins | Middleware |
| Routes | Controllers / Minimal APIs |
| DTOs | Record classes |

---

## 5. Configuración Principal

### 5.1 Crear el Proyecto

```bash
# Crear solución
dotnet new sln -n Cursinet

# Crear proyectos para cada capa
dotnet new classlib -n Cursinet.Domain
dotnet new classlib -n Cursinet.Application
dotnet new classlib -n Cursinet.Infrastructure
dotnet new webapi -n Cursinet.Api

# Agregar proyectos a la solución
dotnet sln add Cursinet.Domain/Cursinet.Domain.csproj
dotnet sln add Cursinet.Application/Cursinet.Application.csproj
dotnet sln add Cursinet.Infrastructure/Cursinet.Infrastructure.csproj
dotnet sln add Cursinet.Api/Cursinet.Api.csproj

# Agregar referencias entre capas
dotnet add Cursinet.Application/Cursinet.Application.csproj reference Cursinet.Domain/Cursinet.Domain.csproj
dotnet add Cursinet.Infrastructure/Cursinet.Infrastructure.csproj reference Cursinet.Application/Cursinet.Application.csproj
dotnet add Cursinet.Api/Cursinet.Api.csproj reference Cursinet.Infrastructure/Cursinet.Infrastructure.csproj
dotnet add Cursinet.Api/Cursinet.Api.csproj reference Cursinet.Application/Cursinet.Application.csproj


--- opcion alternativa más rapida
dotnet new sln -n MiProyecto

mkdir src

dotnet new classlib -o src/Domain
dotnet new classlib -o src/Application
dotnet new classlib -o src/Infrastructure
dotnet new webapi -o src/Api

dotnet sln add src/Domain
dotnet sln add src/Application
dotnet sln add src/Infrastructure
dotnet sln add src/Api
```

### 5.2 Dependencies - Cursinet.Api.csproj

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Serilog.AspNetCore" Version="9.0.*" />
    <PackageReference Include="FluentValidation.AspNetCore" Version="11.4.*" />
  </ItemGroup>

</Project>
```

### 5.3 Dependencies - Cursinet.Infrastructure.csproj

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="10.0.*" />
    <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="10.0.*" />
    <PackageReference Include="BCrypt.Net-Next" Version="4.0.*" />
    <PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="8.*" />
    <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="10.0.*" />
  </ItemGroup>

</Project>
```

### 5.4 appsettings.json - Variables de Entorno

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=cursinet;Username=postgres;Password=postgres"
  },
  "Redis": {
    "Connection": "localhost:6379"
  },
  "Jwt": {
    "Secret": "your-super-secret-jwt-key-min-32-chars-long",
    "RefreshSecret": "your-super-secret-refresh-key-min-32-chars",
    "AccessTokenExpiry": "00:15:00",
    "RefreshTokenExpiry": "7.00:00:00"
  },
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft": "Warning",
        "Microsoft.EntityFrameworkCore": "Information"
      }
    },
    "WriteTo": [
      { "Name": "Console" }
    ]
  }
}
```

**¿Qué hace cada sección?**

| Sección | Descripción |
|---------|-------------|
| `ConnectionStrings.DefaultConnection` | Cadena de conexión a PostgreSQL |
| `Redis.Connection` | URL de conexión a Redis (caché opcional) |
| `Jwt.Secret` | Clave secreta para firmar access tokens |
| `Jwt.RefreshSecret` | Clave secreta para firmar refresh tokens |
| `Jwt.AccessTokenExpiry` | Tiempo de vida del access token |
| `Jwt.RefreshTokenExpiry` | Tiempo de vida del refresh token |
| `Serilog` | Configuración del logger |

### 5.5 appsettings.Development.json

```json
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Debug",
      "Override": {
        "Microsoft": "Information",
        "Microsoft.EntityFrameworkCore.Database.Command": "Information"
      }
    }
  }
}
```

### 5.6 Program.cs - Punto de Entrada

```csharp
using Serilog;
using Microsoft.EntityFrameworkCore;
using Cursinet.Infrastructure.Persistence;
using Cursinet.Infrastructure.Services;
using Cursinet.Application.Common.Interfaces;
using Cursinet.Api.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // Logger
    builder.Host.UseSerilog();

    // Database - PostgreSQL con EF Core 10
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

    // Services - DI
    builder.Services.AddScoped<IPasswordService, PasswordService>();
    builder.Services.AddScoped<ITokenService, TokenService>();
    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<IUserRepository, UserRepository>();
    builder.Services.AddScoped<IAccountRepository, AccountRepository>();
    builder.Services.AddScoped<ISessionRepository, SessionRepository>();
    builder.Services.AddScoped<IVerificationRepository, VerificationRepository>();

    // JWT Authentication
    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!))
            };
        });

    builder.Services.AddAuthorization();

    // Controllers + Validación
    builder.Services.AddControllers();

    // OpenAPI / Swagger
    builder.Services.AddOpenApi();

    var app = builder.Build();

    // Middleware pipeline
    app.UseSerilogRequestLogging();
    app.UseMiddleware<ErrorHandlingMiddleware>();

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
    }

    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();

    // Health check
    app.MapGet("/health", () => Results.Ok(new
    {
        status = "ok",
        timestamp = DateTime.UtcNow
    }));

    Log.Information("Server starting on http://localhost:5000");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
```

**¿Qué hace este archivo?**

1. **Configura Serilog** - Logger estructurado para toda la app
2. **Registra DbContext** - EF Core 10 con PostgreSQL
3. **Registra servicios en DI** - PasswordService, TokenService, AuthService, repositorios
4. **Configura JWT** - Autenticación con tokens JWT Bearer
5. **Agrega controllers** - APIs con atributos `[ApiController]`
6. **Pipeline de middleware** - Logging → Error Handling → Auth → Authorization → Controllers
7. **Health check** - Endpoint `/health` para monitoreo
8. **Graceful shutdown** - Serilog cierra correctamente

**¿Por qué usar Serilog?** Logger estructurado de alto rendimiento, soporta múltiples destinos (archivos, consola, Elasticsearch, etc.) y se integra nativamente con ASP.NET Core.

### 5.7 launchSettings.json

```json
{
  "profiles": {
    "http": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": false,
      "applicationUrl": "http://localhost:5000",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
```

---

## 6. Capa de Dominio

La capa de dominio contiene las entidades puras, sin dependencias de frameworks externos.

### 6.1 Enums/Role.cs

```csharp
namespace Cursinet.Domain.Enums;

public enum Role
{
    Staff,
    Admin
}
```

Equivalente a TypeScript: `type Role = "admin" | "staff"`

### 6.2 Entities/User.cs

```csharp
using Cursinet.Domain.Enums;

namespace Cursinet.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool EmailVerified { get; set; }
    public string? Phone { get; set; }
    public string? Image { get; set; }
    public Role Role { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }

    // Navigation properties (para EF Core)
    public ICollection<Account> Accounts { get; set; } = new List<Account>();
    public ICollection<Session> Sessions { get; set; } = new List<Session>();
}
```

### 6.3 Entities/Account.cs

```csharp
namespace Cursinet.Domain.Entities;

public class Account
{
    public Guid Id { get; set; }
    public string AccountId { get; set; } = string.Empty;
    public string ProviderId { get; set; } = string.Empty;  // "credentials", "google", etc.
    public Guid? UserId { get; set; }
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public string? IdToken { get; set; }
    public DateTime? AccessTokenExpiresAt { get; set; }
    public DateTime? RefreshTokenExpiresAt { get; set; }
    public string? Scope { get; set; }
    public string? Password { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public User? User { get; set; }
}
```

### 6.4 Entities/Session.cs

```csharp
namespace Cursinet.Domain.Entities;

public class Session
{
    public Guid Id { get; set; }
    public DateTime ExpiresAt { get; set; }
    public string Token { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public Guid UserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public User? User { get; set; }
}
```

### 6.5 Entities/Verification.cs

```csharp
namespace Cursinet.Domain.Entities;

public class Verification
{
    public Guid Id { get; set; }
    public string Identifier { get; set; } = string.Empty;   // email o "reset:email"
    public string Value { get; set; } = string.Empty;         // código de verificación
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

### 6.6 Exceptions/AppException.cs

```csharp
namespace Cursinet.Domain.Exceptions;

public class AppException : Exception
{
    public int StatusCode { get; }
    public string Code { get; }
    public bool IsOperational { get; }

    public AppException(string message, int statusCode, string code)
        : base(message)
    {
        StatusCode = statusCode;
        Code = code;
        IsOperational = true;
    }
}

// Helper methods para crear excepciones rápidamente
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

**¿Qué hace este archivo?**

- **`AppException`** - Clase base para errores operacionales con `StatusCode` y `Code`
- **`AppExceptions`** - Helper estático para crear excepciones rápidamente

| Error | Status | Code | Uso |
|-------|--------|------|-----|
| BadRequest | 400 | BAD_REQUEST | Datos inválidos |
| Unauthorized | 401 | UNAUTHORIZED | No autenticado |
| Forbidden | 403 | FORBIDDEN | Sin permisos |
| NotFound | 404 | NOT_FOUND | Recurso no existe |
| Conflict | 409 | CONFLICT | Email duplicado |
| UnprocessableEntity | 422 | UNPROCESSABLE_ENTITY | Validación fallida |
| TooManyRequests | 429 | TOO_MANY_REQUESTS | Rate limit |
| InternalError | 500 | INTERNAL_SERVER_ERROR | Error inesperado |

---

## 7. Capa de Aplicación

La capa de aplicación define los **contratos** (interfaces) y la **lógica de negocio**, sin dependencias de frameworks externos.

### 7.1 Interfaces de Repositorios

#### IUserRepository.cs

```csharp
using Cursinet.Domain.Entities;

namespace Cursinet.Application.Common.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(Guid id);
    Task<User> CreateAsync(User user);
    Task<User> UpdateAsync(User user);
    Task SoftDeleteAsync(Guid id);
}
```

#### IAccountRepository.cs

```csharp
using Cursinet.Domain.Entities;

namespace Cursinet.Application.Common.Interfaces;

public interface IAccountRepository
{
    Task<Account?> GetByProviderAndAccountIdAsync(string providerId, string accountId);
    Task<List<Account>> GetByUserIdAsync(Guid userId);
    Task<Account?> GetCredentialsByEmailAsync(string email);
    Task<Account> CreateAsync(Account account);
    Task<Account> UpdateAsync(Account account);
    Task DeleteAsync(Guid id);
    Task DeleteByUserIdAsync(Guid userId);
}
```

#### ISessionRepository.cs

```csharp
using Cursinet.Domain.Entities;

namespace Cursinet.Application.Common.Interfaces;

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

#### IVerificationRepository.cs

```csharp
using Cursinet.Domain.Entities;

namespace Cursinet.Application.Common.Interfaces;

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

### 7.2 Interfaces de Servicios

#### IPasswordService.cs

```csharp
namespace Cursinet.Application.Common.Interfaces;

public interface IPasswordService
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string hash);
}
```

#### ITokenService.cs

```csharp
using System.Security.Claims;
using Cursinet.Domain.Enums;

namespace Cursinet.Application.Common.Interfaces;

public interface ITokenService
{
    (string accessToken, string refreshToken) GenerateTokens(Guid userId, string email, Role role);
    ClaimsPrincipal? ValidateAccessToken(string token);
    ClaimsPrincipal? ValidateRefreshToken(string token);
}
```

### 7.3 AuthService.cs - Lógica de Negocio

```csharp
using Cursinet.Application.Common.Interfaces;
using Cursinet.Domain.Entities;
using Cursinet.Domain.Enums;
using static Cursinet.Domain.Exceptions.AppExceptions;
using Cursinet.Api.DTOs;

namespace Cursinet.Application.Features.Auth;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<RefreshResponse> RefreshAsync(string refreshToken);
    Task LogoutAsync(string refreshToken);
    Task<AuthResponse> VerifyEmailAsync(string identifier, string code);
    Task<ForgotPasswordResponse> ForgotPasswordAsync(string email);
    Task<ResetPasswordResponse> ResetPasswordAsync(string email, string code, string newPassword);
    Task<List<SessionResponse>> GetUserSessionsAsync(Guid userId);
    Task RevokeSessionAsync(Guid userId, Guid sessionId);
    Task ResendVerificationAsync(string email);
}

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IAccountRepository _accountRepository;
    private readonly ISessionRepository _sessionRepository;
    private readonly IVerificationRepository _verificationRepository;
    private readonly IPasswordService _passwordService;
    private readonly ITokenService _tokenService;

    private static readonly TimeSpan AccessTokenExpiry = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan RefreshTokenExpiry = TimeSpan.FromDays(7);
    private static readonly TimeSpan VerificationCodeExpiry = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan SessionExpiry = TimeSpan.FromDays(7);

    public AuthService(
        IUserRepository userRepository,
        IAccountRepository accountRepository,
        ISessionRepository sessionRepository,
        IVerificationRepository verificationRepository,
        IPasswordService passwordService,
        ITokenService tokenService)
    {
        _userRepository = userRepository;
        _accountRepository = accountRepository;
        _sessionRepository = sessionRepository;
        _verificationRepository = verificationRepository;
        _passwordService = passwordService;
        _tokenService = tokenService;
    }

    // ==================
    // REGISTER
    // ==================

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        // Verificar si el email ya existe
        var existingUser = await _userRepository.GetByEmailAsync(request.Email);
        if (existingUser != null)
            throw Conflict("Email already registered");

        // Hashear password
        var hashedPassword = _passwordService.HashPassword(request.Password);

        // Crear usuario
        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Email = request.Email,
            Role = request.Role ?? Role.Staff,
            EmailVerified = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        user = await _userRepository.CreateAsync(user);

        // Crear cuenta credentials
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

        // Generar código de verificación
        var verificationCode = GenerateVerificationCode();
        var verification = new Verification
        {
            Id = Guid.NewGuid(),
            Identifier = user.Email,
            Value = verificationCode,
            ExpiresAt = DateTime.UtcNow.Add(VerificationCodeExpiry),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _verificationRepository.CreateAsync(verification);

        // Generar tokens
        var (accessToken, refreshToken) = _tokenService.GenerateTokens(user.Id, user.Email, user.Role);

        // Crear sesión
        var session = new Session
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.Add(SessionExpiry),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _sessionRepository.CreateAsync(session);

        // TODO: Enviar email con código de verificación
        Console.WriteLine($"Verification code for {user.Email}: {verificationCode}");

        return new AuthResponse
        {
            Message = "User created successfully. Please verify your email.",
            User = MapUserToDto(user),
            AccessToken = accessToken,
            RefreshToken = refreshToken
        };
    }

    // ==================
    // LOGIN
    // ==================

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        // Buscar cuenta credentials por email
        var account = await _accountRepository.GetCredentialsByEmailAsync(request.Email);
        if (account == null)
            throw Unauthorized("Invalid credentials");

        // Verificar password
        if (account.Password == null || !_passwordService.VerifyPassword(request.Password, account.Password))
            throw Unauthorized("Invalid credentials");

        // Obtener usuario
        if (account.UserId == null)
            throw Unauthorized("Invalid credentials");

        var user = await _userRepository.GetByIdAsync(account.UserId.Value);
        if (user == null)
            throw Unauthorized("User not found");

        // Verificar soft delete
        if (user.DeletedAt != null)
            throw Unauthorized("Account has been deactivated");

        // Generar tokens
        var (accessToken, refreshToken) = _tokenService.GenerateTokens(user.Id, user.Email, user.Role);

        // Crear sesión
        var session = new Session
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.Add(SessionExpiry),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _sessionRepository.CreateAsync(session);

        return new AuthResponse
        {
            Message = "Login successful",
            User = MapUserToDto(user),
            AccessToken = accessToken,
            RefreshToken = refreshToken
        };
    }

    // ==================
    // LOGOUT
    // ==================

    public async Task LogoutAsync(string refreshToken)
    {
        await _sessionRepository.DeleteAsync(refreshToken);
    }

    // ==================
    // REFRESH
    // ==================

    public async Task<RefreshResponse> RefreshAsync(string refreshToken)
    {
        // Validar token
        var principal = _tokenService.ValidateRefreshToken(refreshToken);
        if (principal == null)
            throw Unauthorized("Invalid or expired refresh token");

        var userIdClaim = principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            throw Unauthorized("Invalid refresh token");

        // Buscar sesión
        var session = await _sessionRepository.GetByTokenAsync(refreshToken);
        if (session == null)
            throw Unauthorized("Invalid refresh token");

        // Verificar expiración
        if (session.ExpiresAt < DateTime.UtcNow)
        {
            await _sessionRepository.DeleteAsync(refreshToken);
            throw Unauthorized("Session expired");
        }

        // Obtener usuario
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            throw Unauthorized("User not found");

        // Eliminar sesión vieja
        await _sessionRepository.DeleteAsync(refreshToken);

        // Generar nuevos tokens
        var (accessToken, newRefreshToken) = _tokenService.GenerateTokens(user.Id, user.Email, user.Role);

        // Crear nueva sesión
        var newSession = new Session
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.Add(SessionExpiry),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _sessionRepository.CreateAsync(newSession);

        return new RefreshResponse
        {
            Message = "Token refreshed successfully",
            AccessToken = accessToken,
            RefreshToken = newRefreshToken
        };
    }

    // ==================
    // VERIFY EMAIL
    // ==================

    public async Task<AuthResponse> VerifyEmailAsync(string identifier, string code)
    {
        // Buscar código de verificación
        var verification = await _verificationRepository.GetByIdentifierAndValueAsync(identifier, code);
        if (verification == null)
            throw Unauthorized("Invalid verification code");

        // Verificar expiración
        if (verification.ExpiresAt < DateTime.UtcNow)
        {
            await _verificationRepository.DeleteByIdentifierAsync(identifier);
            throw Unauthorized("Verification code expired");
        }

        // Buscar y actualizar usuario
        var user = await _userRepository.GetByEmailAsync(identifier);
        if (user == null)
            throw NotFound("User not found");

        user.EmailVerified = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _userRepository.UpdateAsync(user);

        // Eliminar código de verificación
        await _verificationRepository.DeleteByIdentifierAsync(identifier);

        // Generar nuevos tokens
        var (accessToken, refreshToken) = _tokenService.GenerateTokens(user.Id, user.Email, user.Role);

        // Crear sesión
        var session = new Session
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.Add(SessionExpiry),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _sessionRepository.CreateAsync(session);

        return new AuthResponse
        {
            Message = "Email verified successfully",
            User = MapUserToDto(user),
            AccessToken = accessToken,
            RefreshToken = refreshToken
        };
    }

    // ==================
    // FORGOT PASSWORD
    // ==================

    public async Task<ForgotPasswordResponse> ForgotPasswordAsync(string email)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        if (user == null)
        {
            // No revelar si el usuario existe o no
            return new ForgotPasswordResponse
            {
                Message = "If the email exists, a reset code has been sent",
                ExpiresAt = DateTime.UtcNow.Add(VerificationCodeExpiry)
            };
        }

        // Generar código de reset
        var resetCode = GenerateVerificationCode();
        var verification = new Verification
        {
            Id = Guid.NewGuid(),
            Identifier = $"reset:{email}",
            Value = resetCode,
            ExpiresAt = DateTime.UtcNow.Add(VerificationCodeExpiry),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _verificationRepository.CreateAsync(verification);

        // TODO: Enviar email con código de reset
        Console.WriteLine($"Password reset code for {email}: {resetCode}");

        return new ForgotPasswordResponse
        {
            Message = "If the email exists, a reset code has been sent",
            ExpiresAt = DateTime.UtcNow.Add(VerificationCodeExpiry)
        };
    }

    // ==================
    // RESET PASSWORD
    // ==================

    public async Task<ResetPasswordResponse> ResetPasswordAsync(string email, string code, string newPassword)
    {
        // Buscar verificación
        var verification = await _verificationRepository.GetByIdentifierAndValueAsync($"reset:{email}", code);
        if (verification == null)
            throw Unauthorized("Invalid reset code");

        if (verification.ExpiresAt < DateTime.UtcNow)
        {
            await _verificationRepository.DeleteByIdentifierAsync($"reset:{email}");
            throw Unauthorized("Reset code expired");
        }

        // Buscar usuario
        var user = await _userRepository.GetByEmailAsync(email);
        if (user == null)
            throw NotFound("User not found");

        // Buscar cuenta credentials
        var account = await _accountRepository.GetCredentialsByEmailAsync(email);
        if (account == null)
            throw NotFound("Account not found");

        // Hashear nuevo password y actualizar
        var hashedPassword = _passwordService.HashPassword(newPassword);
        account.Password = hashedPassword;
        account.UpdatedAt = DateTime.UtcNow;
        await _accountRepository.UpdateAsync(account);

        // Eliminar todas las sesiones del usuario (logout forzado)
        await _sessionRepository.DeleteByUserIdAsync(user.Id);

        // Eliminar código de verificación
        await _verificationRepository.DeleteByIdentifierAsync($"reset:{email}");

        return new ResetPasswordResponse
        {
            Message = "Password reset successfully. Please login with your new password."
        };
    }

    // ==================
    // GET USER SESSIONS
    // ==================

    public async Task<List<SessionResponse>> GetUserSessionsAsync(Guid userId)
    {
        var sessions = await _sessionRepository.GetByUserIdAsync(userId);

        return sessions
            .Where(s => s.ExpiresAt > DateTime.UtcNow)
            .Select(s => new SessionResponse
            {
                Id = s.Id,
                ExpiresAt = s.ExpiresAt,
                IpAddress = s.IpAddress,
                UserAgent = s.UserAgent,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt
            })
            .ToList();
    }

    // ==================
    // REVOKE SESSION
    // ==================

    public async Task RevokeSessionAsync(Guid userId, Guid sessionId)
    {
        var sessions = await _sessionRepository.GetByUserIdAsync(userId);
        var session = sessions.FirstOrDefault(s => s.Id == sessionId);

        if (session == null)
            throw NotFound("Session not found");

        await _sessionRepository.DeleteAsync(session.Token);
    }

    // ==================
    // RESEND VERIFICATION
    // ==================

    public async Task ResendVerificationAsync(string email)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        if (user == null) return; // No revelar si existe

        if (user.EmailVerified)
            throw Conflict("Email already verified");

        // Eliminar código anterior
        await _verificationRepository.DeleteByIdentifierAsync(email);

        // Generar nuevo código
        var verificationCode = GenerateVerificationCode();
        var verification = new Verification
        {
            Id = Guid.NewGuid(),
            Identifier = email,
            Value = verificationCode,
            ExpiresAt = DateTime.UtcNow.Add(VerificationCodeExpiry),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _verificationRepository.CreateAsync(verification);

        // TODO: Enviar email
        Console.WriteLine($"New verification code for {email}: {verificationCode}");
    }

    // ==================
    // HELPERS
    // ==================

    private static string GenerateVerificationCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = Random.Shared;
        var code = new char[6];
        for (int i = 0; i < 6; i++)
            code[i] = chars[random.Next(chars.Length)];
        return new string(code);
    }

    private static UserDto MapUserToDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            EmailVerified = user.EmailVerified,
            Role = user.Role.ToString().ToLower(),
            Phone = user.Phone,
            Image = user.Image,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
    }
}
```

**¿Qué hace este archivo?**

El service contiene toda la lógica de negocio de autenticación:

| Método | Descripción |
|--------|-------------|
| `RegisterAsync` | Registro: verifica email único, hashea password, crea usuario + cuenta + código + sesión |
| `LoginAsync` | Login: busca cuenta, verifica password, genera tokens, crea sesión |
| `LogoutAsync` | Logout: elimina la sesión de la BD |
| `RefreshAsync` | Refresh: valida token, elimina sesión vieja, genera nuevos tokens |
| `VerifyEmailAsync` | Verifica email con código, marca `EmailVerified`, genera nuevos tokens |
| `ForgotPasswordAsync` | Genera código de reset, no revela si el email existe |
| `ResetPasswordAsync` | Valida código, actualiza password, elimina TODAS las sesiones |
| `GetUserSessionsAsync` | Lista sesiones activas del usuario |
| `RevokeSessionAsync` | Revoca una sesión específica |
| `ResendVerificationAsync` | Reenvía código de verificación |

---

## 8. Capa de Infraestructura

### 8.1 ApplicationDbContext.cs - Contexto de EF Core 10

```csharp
using Microsoft.EntityFrameworkCore;
using Cursinet.Domain.Entities;

namespace Cursinet.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<Verification> Verifications => Set<Verification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Aplica todas las configuraciones del ensamblado
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
```

**¿Qué hace DbContext en EF Core 10?**

- **DbSet** - Representa una tabla en la BD. Cada propiedad `DbSet<T>` es una tabla.
- **`OnModelCreating`** - Configura el esquema de la BD (fluent API).
- **`ApplyConfigurationsFromAssembly`** - Escanea y aplica todas las configuraciones en el ensamblado.

### 8.2 Configuraciones de Entidades (Fluent API)

#### UserConfiguration.cs

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cursinet.Domain.Entities;

namespace Cursinet.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(u => u.Name)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(255);

        builder.HasIndex(u => u.Email)
            .IsUnique();

        builder.Property(u => u.Role)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(u => u.CreatedAt)
            .HasDefaultValueSql("NOW()");

        builder.Property(u => u.UpdatedAt)
            .HasDefaultValueSql("NOW()");

        builder.Property(u => u.DeletedAt)
            .IsRequired(false);

        // Soft delete filter
        builder.HasQueryFilter(u => u.DeletedAt == null);

        // Relationships
        builder.HasMany(u => u.Accounts)
            .WithOne(a => a.User)
            .HasForeignKey(a => a.UserId);

        builder.HasMany(u => u.Sessions)
            .WithOne(s => s.User)
            .HasForeignKey(s => s.UserId);
    }
}
```

#### AccountConfiguration.cs

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cursinet.Domain.Entities;

namespace Cursinet.Infrastructure.Persistence.Configurations;

public class AccountConfiguration : IEntityTypeConfiguration<Account>
{
    public void Configure(EntityTypeBuilder<Account> builder)
    {
        builder.ToTable("accounts");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(a => a.ProviderId)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(a => a.CreatedAt)
            .HasDefaultValueSql("NOW()");

        builder.Property(a => a.UpdatedAt)
            .HasDefaultValueSql("NOW()");

        builder.HasIndex(a => new { a.ProviderId, a.AccountId });
    }
}
```

#### SessionConfiguration.cs

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cursinet.Domain.Entities;

namespace Cursinet.Infrastructure.Persistence.Configurations;

public class SessionConfiguration : IEntityTypeConfiguration<Session>
{
    public void Configure(EntityTypeBuilder<Session> builder)
    {
        builder.ToTable("sessions");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(s => s.Token)
            .IsRequired();

        builder.HasIndex(s => s.Token)
            .IsUnique();

        builder.HasIndex(s => s.UserId);

        builder.Property(s => s.CreatedAt)
            .HasDefaultValueSql("NOW()");

        builder.Property(s => s.UpdatedAt)
            .HasDefaultValueSql("NOW()");
    }
}
```

### 8.3 Repositorios

#### UserRepository.cs

```csharp
using Microsoft.EntityFrameworkCore;
using Cursinet.Application.Common.Interfaces;
using Cursinet.Domain.Entities;
using Cursinet.Infrastructure.Persistence;

namespace Cursinet.Infrastructure.Persistence.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<User?> GetByIdAsync(Guid id)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<User> CreateAsync(User user)
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<User> UpdateAsync(User user)
    {
        user.UpdatedAt = DateTime.UtcNow;
        _context.Users.Update(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task SoftDeleteAsync(Guid id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user != null)
        {
            user.DeletedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }
}
```

#### AccountRepository.cs

```csharp
using Microsoft.EntityFrameworkCore;
using Cursinet.Application.Common.Interfaces;
using Cursinet.Domain.Entities;
using Cursinet.Infrastructure.Persistence;

namespace Cursinet.Infrastructure.Persistence.Repositories;

public class AccountRepository : IAccountRepository
{
    private readonly ApplicationDbContext _context;

    public AccountRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Account?> GetByProviderAndAccountIdAsync(string providerId, string accountId)
    {
        return await _context.Accounts
            .FirstOrDefaultAsync(a => a.ProviderId == providerId && a.AccountId == accountId);
    }

    public async Task<List<Account>> GetByUserIdAsync(Guid userId)
    {
        return await _context.Accounts
            .Where(a => a.UserId == userId)
            .ToListAsync();
    }

    public async Task<Account?> GetCredentialsByEmailAsync(string email)
    {
        // Buscar usuario por email primero
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email && u.DeletedAt == null);

        if (user == null) return null;

        // Buscar cuenta credentials
        return await _context.Accounts
            .FirstOrDefaultAsync(a => a.UserId == user.Id && a.ProviderId == "credentials");
    }

    public async Task<Account> CreateAsync(Account account)
    {
        _context.Accounts.Add(account);
        await _context.SaveChangesAsync();
        return account;
    }

    public async Task<Account> UpdateAsync(Account account)
    {
        account.UpdatedAt = DateTime.UtcNow;
        _context.Accounts.Update(account);
        await _context.SaveChangesAsync();
        return account;
    }

    public async Task DeleteAsync(Guid id)
    {
        var account = await _context.Accounts.FindAsync(id);
        if (account != null)
        {
            _context.Accounts.Remove(account);
            await _context.SaveChangesAsync();
        }
    }

    public async Task DeleteByUserIdAsync(Guid userId)
    {
        var accounts = await _context.Accounts
            .Where(a => a.UserId == userId)
            .ToListAsync();

        _context.Accounts.RemoveRange(accounts);
        await _context.SaveChangesAsync();
    }
}
```

#### SessionRepository.cs

```csharp
using Microsoft.EntityFrameworkCore;
using Cursinet.Application.Common.Interfaces;
using Cursinet.Domain.Entities;
using Cursinet.Infrastructure.Persistence;

namespace Cursinet.Infrastructure.Persistence.Repositories;

public class SessionRepository : ISessionRepository
{
    private readonly ApplicationDbContext _context;

    public SessionRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Session> CreateAsync(Session session)
    {
        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();
        return session;
    }

    public async Task<Session?> GetByTokenAsync(string token)
    {
        return await _context.Sessions
            .FirstOrDefaultAsync(s => s.Token == token);
    }

    public async Task<List<Session>> GetByUserIdAsync(Guid userId)
    {
        return await _context.Sessions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
    }

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

    public async Task DeleteByUserIdAsync(Guid userId)
    {
        var sessions = await _context.Sessions
            .Where(s => s.UserId == userId)
            .ToListAsync();

        _context.Sessions.RemoveRange(sessions);
        await _context.SaveChangesAsync();
    }

    public async Task<int> DeleteExpiredAsync()
    {
        var expired = await _context.Sessions
            .Where(s => s.ExpiresAt < DateTime.UtcNow)
            .ExecuteDeleteAsync();  // EF Core 10 bulk delete

        return expired;
    }
}
```

#### VerificationRepository.cs

```csharp
using Microsoft.EntityFrameworkCore;
using Cursinet.Application.Common.Interfaces;
using Cursinet.Domain.Entities;
using Cursinet.Infrastructure.Persistence;

namespace Cursinet.Infrastructure.Persistence.Repositories;

public class VerificationRepository : IVerificationRepository
{
    private readonly ApplicationDbContext _context;

    public VerificationRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Verification> CreateAsync(Verification verification)
    {
        // Eliminar cualquier verificación previa para este identifier
        var existing = await _context.Verifications
            .Where(v => v.Identifier == verification.Identifier)
            .ExecuteDeleteAsync();  // EF Core 10 bulk delete

        _context.Verifications.Add(verification);
        await _context.SaveChangesAsync();
        return verification;
    }

    public async Task<Verification?> GetByIdentifierAsync(string identifier)
    {
        return await _context.Verifications
            .FirstOrDefaultAsync(v => v.Identifier == identifier);
    }

    public async Task<Verification?> GetByIdentifierAndValueAsync(string identifier, string value)
    {
        return await _context.Verifications
            .FirstOrDefaultAsync(v => v.Identifier == identifier && v.Value == value);
    }

    public async Task DeleteAsync(Guid id)
    {
        var verification = await _context.Verifications.FindAsync(id);
        if (verification != null)
        {
            _context.Verifications.Remove(verification);
            await _context.SaveChangesAsync();
        }
    }

    public async Task DeleteByIdentifierAsync(string identifier)
    {
        await _context.Verifications
            .Where(v => v.Identifier == identifier)
            .ExecuteDeleteAsync();  // EF Core 10 bulk delete
    }

    public async Task<int> DeleteExpiredAsync()
    {
        return await _context.Verifications
            .Where(v => v.ExpiresAt < DateTime.UtcNow)
            .ExecuteDeleteAsync();  // EF Core 10 bulk delete
    }
}
```

### 8.4 Servicios

#### PasswordService.cs

```csharp
using Cursinet.Application.Common.Interfaces;

namespace Cursinet.Infrastructure.Services;

public class PasswordService : IPasswordService
{
    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, workFactor: 10);
    }

    public bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }
}
```

**¿Qué hace PasswordService?**

Equivalente a `crypto.utils.ts` en Fastify:
- `HashPassword` → `hashPassword()`
- `VerifyPassword` → `comparePassword()`

#### TokenService.cs

```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Cursinet.Application.Common.Interfaces;
using Cursinet.Domain.Enums;

namespace Cursinet.Infrastructure.Services;

public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public (string accessToken, string refreshToken) GenerateTokens(Guid userId, string email, Role role)
    {
        var accessToken = GenerateJwtToken(userId, email, role, isRefresh: false);
        var refreshToken = GenerateJwtToken(userId, email, role, isRefresh: true);

        return (accessToken, refreshToken);
    }

    private string GenerateJwtToken(Guid userId, string email, Role role, bool isRefresh)
    {
        var secret = isRefresh
            ? _configuration["Jwt:RefreshSecret"]!
            : _configuration["Jwt:Secret"]!;

        var expiry = isRefresh
            ? TimeSpan.Parse(_configuration["Jwt:RefreshTokenExpiry"]!)
            : TimeSpan.Parse(_configuration["Jwt:AccessTokenExpiry"]!);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.Role, role.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: "Cursinet",
            audience: "Cursinet",
            claims: claims,
            expires: DateTime.UtcNow.Add(expiry),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public ClaimsPrincipal? ValidateAccessToken(string token)
    {
        return ValidateToken(token, _configuration["Jwt:Secret"]!);
    }

    public ClaimsPrincipal? ValidateRefreshToken(string token)
    {
        return ValidateToken(token, _configuration["Jwt:RefreshSecret"]!);
    }

    private static ClaimsPrincipal? ValidateToken(string token, string secret)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(secret);

        try
        {
            var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = false,
                ValidateAudience = false,
                ClockSkew = TimeSpan.Zero
            }, out _);

            return principal;
        }
        catch
        {
            return null;
        }
    }
}
```

**¿Qué hace TokenService?**

Equivalente a `token.utils.ts` en Fastify:

- **GenerateTokens** → `generateTokens()`: genera access y refresh tokens
- **ValidateAccessToken** → `verifyToken(secret)`: valida el access token
- **ValidateRefreshToken** → `verifyToken(refreshSecret)`: valida el refresh token

**¿Por qué dos tokens?**

| Token | Duración | Propósito |
|-------|----------|-----------|
| Access Token | 15 minutos | Autenticar requests. Si lo roban, máximo 15 min de acceso |
| Refresh Token | 7 días | Obtener nuevos access tokens sin re-autenticar |

---

## 9. Capa de Presentación

### 9.1 DTOs - Data Transfer Objects

```csharp
// AuthDTOs.cs
namespace Cursinet.Api.DTOs;

// ==================
// REQUEST DTOs
// ==================

public record RegisterRequest(
    string Name,
    string Email,
    string Password,
    string? Role = null
);

public record LoginRequest(
    string Email,
    string Password
);

public record RefreshRequest(
    string RefreshToken
);

public record VerifyEmailRequest(
    string Identifier,
    string Code
);

public record ForgotPasswordRequest(
    string Email
);

public record ResetPasswordRequest(
    string Email,
    string Code,
    string NewPassword
);

public record ResendVerificationRequest(
    string Email
);

// ==================
// RESPONSE DTOs
// ==================

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

public record SessionResponse
{
    public Guid Id { get; init; }
    public DateTime ExpiresAt { get; init; }
    public string? IpAddress { get; init; }
    public string? UserAgent { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record UserDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public bool EmailVerified { get; init; }
    public string? Phone { get; init; }
    public string? Image { get; init; }
    public string Role { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}
```

**¿Qué son los records en C#?**
- Inmutables por defecto (`init` setters)
- Comparación por valor (equality)
- Ideales para DTOs, similar a las interfaces de TypeScript

### 9.2 AuthController.cs

```csharp
using Microsoft.AspNetCore.Mvc;
using Cursinet.Api.DTOs;
using Cursinet.Application.Features.Auth;
using Cursinet.Domain.Exceptions;
using static Cursinet.Domain.Exceptions.AppExceptions;

namespace Cursinet.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IConfiguration _configuration;

    public AuthController(IAuthService authService, IConfiguration configuration)
    {
        _authService = authService;
        _configuration = configuration;
    }

    /// <summary>
    /// Registrar un nuevo usuario
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        var currentUserId = await ResolveCurrentUserId();
        if (currentUserId.HasValue)
            throw Conflict("Already logged in. Please logout before creating a new account.");

        var result = await _authService.RegisterAsync(request);

        SetAuthCookies(result.AccessToken, result.RefreshToken);

        return CreatedAtAction(null, new
        {
            message = result.Message,
            user = result.User
        });
    }

    /// <summary>
    /// Iniciar sesión
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var currentUserId = await ResolveCurrentUserId();

        var result = await _authService.LoginAsync(request);

        if (currentUserId.HasValue && currentUserId != result.User?.Id)
        {
            ClearAuthCookies();
        }

        SetAuthCookies(result.AccessToken, result.RefreshToken);

        return Ok(new
        {
            message = result.Message,
            user = result.User
        });
    }

    /// <summary>
    /// Refrescar tokens de acceso
    /// </summary>
    [HttpPost("refresh")]
    public async Task<ActionResult<RefreshResponse>> Refresh()
    {
        var refreshToken = GetRefreshToken();
        if (string.IsNullOrEmpty(refreshToken))
            throw Unauthorized("Refresh token required");

        var result = await _authService.RefreshAsync(refreshToken);

        SetAuthCookies(result.AccessToken, result.RefreshToken);

        return Ok(new { message = result.Message });
    }

    /// <summary>
    /// Cerrar sesión
    /// </summary>
    [HttpPost("logout")]
    public async Task<ActionResult> Logout()
    {
        var refreshToken = GetRefreshToken();
        if (!string.IsNullOrEmpty(refreshToken))
        {
            await _authService.LogoutAsync(refreshToken);
        }

        ClearAuthCookies();

        return Ok(new { message = "Logged out successfully" });
    }

    /// <summary>
    /// Verificar email con código
    /// </summary>
    [HttpPost("verify-email")]
    public async Task<ActionResult<AuthResponse>> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        var result = await _authService.VerifyEmailAsync(request.Identifier, request.Code);

        SetAuthCookies(result.AccessToken, result.RefreshToken);

        return Ok(new { message = result.Message });
    }

    /// <summary>
    /// Reenviar código de verificación
    /// </summary>
    [HttpPost("resend-verification")]
    public async Task<ActionResult> ResendVerification([FromBody] ResendVerificationRequest request)
    {
        await _authService.ResendVerificationAsync(request.Email);
        return Ok(new { message = "If the email exists, a new verification code has been sent" });
    }

    /// <summary>
    /// Solicitar reset de password
    /// </summary>
    [HttpPost("forgot-password")]
    public async Task<ActionResult<ForgotPasswordResponse>> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var currentUserId = await ResolveCurrentUserId();
        if (currentUserId.HasValue)
            throw Conflict("Please logout before requesting password reset");

        var result = await _authService.ForgotPasswordAsync(request.Email);
        return Ok(result);
    }

    /// <summary>
    /// Resetear password con código
    /// </summary>
    [HttpPost("reset-password")]
    public async Task<ActionResult<ResetPasswordResponse>> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var currentUserId = await ResolveCurrentUserId();
        if (currentUserId.HasValue)
            throw Conflict("Please logout before resetting password");

        var result = await _authService.ResetPasswordAsync(request.Email, request.Code, request.NewPassword);
        ClearAuthCookies();
        return Ok(result);
    }

    /// <summary>
    /// Obtener sesiones activas (requiere auth)
    /// </summary>
    [HttpGet("sessions")]
    [AuthGuard]
    public async Task<ActionResult<List<SessionResponse>>> GetSessions()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
            throw Unauthorized("Authentication required");

        var sessions = await _authService.GetUserSessionsAsync(userId.Value);
        return Ok(sessions);
    }

    /// <summary>
    /// Revocar sesión específica (requiere auth)
    /// </summary>
    [HttpDelete("sessions/{sessionId:guid}")]
    [AuthGuard]
    public async Task<ActionResult> RevokeSession(Guid sessionId)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
            throw Unauthorized("Authentication required");

        await _authService.RevokeSessionAsync(userId.Value, sessionId);
        return Ok(new { message = "Session revoked successfully" });
    }

    // ==================
    // COOKIE HELPERS
    // ==================

    private string? GetRefreshToken()
    {
        var cookieToken = Request.Cookies["refreshToken"];
        return cookieToken;
    }

    private void SetAuthCookies(string accessToken, string refreshToken)
    {
        var isProduction = !_configuration.GetValue<bool>("IsDevelopment");

        Response.Cookies.Append("accessToken", accessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = isProduction,
            SameSite = SameSiteMode.Strict,
            Path = "/",
            MaxAge = TimeSpan.FromMinutes(15)
        });

        Response.Cookies.Append("refreshToken", refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = isProduction,
            SameSite = SameSiteMode.Strict,
            Path = "/",
            MaxAge = TimeSpan.FromDays(7)
        });
    }

    private void ClearAuthCookies()
    {
        Response.Cookies.Delete("accessToken", new CookieOptions { Path = "/" });
        Response.Cookies.Delete("refreshToken", new CookieOptions { Path = "/" });
    }

    private async Task<Guid?> ResolveCurrentUserId()
    {
        try
        {
            return GetCurrentUserId();
        }
        catch
        {
            ClearAuthCookies();
            return null;
        }
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim)) return null;
        if (Guid.TryParse(userIdClaim, out var userId)) return userId;
        return null;
    }
}
```

### 9.3 AuthGuardAttribute.cs - Filtro de Autenticación

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace Cursinet.Api.Filters;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class AuthGuardAttribute : Attribute, IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var userId = context.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            context.Result = new UnauthorizedObjectResult(new
            {
                message = "Authentication required",
                code = "UNAUTHORIZED"
            });
        }
    }
}
```

**¿Cómo usarlo?**

```csharp
[HttpPost("sessions")]
[AuthGuard]
public async Task<ActionResult> GetSessions() { ... }
```

Equivalente a: `auth.guard.ts` + `preHandler` de Fastify

### 9.4 ErrorHandlingMiddleware.cs

```csharp
using System.Net;
using System.Text.Json;
using Cursinet.Domain.Exceptions;

namespace Cursinet.Api.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (AppException ex)
        {
            _logger.LogWarning("Operational error: {Code} - {Message}", ex.Code, ex.Message);

            context.Response.StatusCode = ex.StatusCode;
            context.Response.ContentType = "application/json";

            var response = new
            {
                message = ex.Message,
                code = ex.Code,
                statusCode = ex.StatusCode
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
        catch (FluentValidation.ValidationException ex)
        {
            context.Response.StatusCode = 422;
            context.Response.ContentType = "application/json";

            var response = new
            {
                message = "Validation failed",
                code = "VALIDATION_ERROR",
                statusCode = 422,
                errors = ex.Errors.Select(e => new
                {
                    field = e.PropertyName,
                    message = e.ErrorMessage
                })
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");

            context.Response.StatusCode = 500;
            context.Response.ContentType = "application/json";

            var response = new
            {
                message = "Internal Server Error",
                code = "INTERNAL_SERVER_ERROR",
                statusCode = 500
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
    }
}
```

**¿Qué hace este middleware?**

1. **Atrapa `AppException`** - Errores operacionales controlados (400, 401, 404, etc.)
2. **Atrapa `ValidationException`** - Errores de validación de FluentValidation (422)
3. **Atrapa `Exception` genérica** - Errores no esperados (500)
4. **Siempre retorna JSON** - Formato consistente en todas las respuestas de error

Equivalente a: error handler de Fastify + `AppError.ts`

---

## 10. Entity Framework Core - ORM

### 10.1 ¿Qué es EF Core?

Entity Framework Core 10 es el ORM (Object-Relational Mapper) oficial de .NET. Permite trabajar con bases de datos usando objetos C# sin escribir SQL manualmente.

**Equivalencia con Prisma (Fastify):**

| Concepto Prisma | EF Core 10 |
|-----------------|------------|
| `prisma/schema.prisma` | Clases C# + Configuraciones Fluent API |
| `prisma.client` | `ApplicationDbContext` |
| `prisma.user.findFirst()` | `_context.Users.FirstOrDefaultAsync()` |
| `prisma.user.create()` | `_context.Users.Add()` + `SaveChangesAsync()` |
| Migraciones CLI | `dotnet ef migrations` |
| Prisma Studio | `dotnet ef database` o herramientas visuales |

### 10.2 Características de EF Core 10 (nuevo en .NET 10)

EF Core 10 trae mejoras importantes:

| Feature | Descripción |
|---------|-------------|
| **Bulk operations** | `ExecuteDeleteAsync()` y `ExecuteUpdateAsync()` con delegates |
| **JSON columns** | Soporte nativo para columnas JSON en SQL Server 2025+ |
| **Vector Search** | `SqlVector<float>` para búsquedas semánticas (RAG) |
| **LeftJoin/RightJoin** | Joins directos en LINQ |
| **Named Query Filters** | Filtros reutilizables con nombre |
| **Complex properties** | Mapeo de objetos complejos a JSON |

### 10.3 Flujo de Trabajo con EF Core

```
1. Definir entidades (clases C#)
        ↓
2. Configurar entidades (Fluent API o Data Annotations)
        ↓
3. Crear DbContext
        ↓
4. Crear migración → dotnet ef migrations add InitialCreate
        ↓
5. Aplicar migración → dotnet ef database update
        ↓
6. Usar DbContext en repositorios
```

### 10.4 Comandos de EF Core CLI

```bash
# Instalar herramienta EF Core (si no está instalada)
dotnet tool install --global dotnet-ef

# Crear migración inicial
dotnet ef migrations add InitialCreate

# Crear migración con nombre
dotnet ef migrations add AddUserSoftDelete

# Aplicar migraciones a la BD
dotnet ef database update

# Revertir migración
dotnet ef database update PreviousMigrationName

# Eliminar última migración (no aplicada)
dotnet ef migrations remove

# Listar migraciones
dotnet ef migrations list

# Generar script SQL de migraciones
dotnet ef migrations script -o migracion.sql

# Aplicar migraciones desde código (en Program.cs)
# await using var context = new ApplicationDbContext(options);
# await context.Database.MigrateAsync();
```

### 10.5 Migraciones - Explicación

```bash
# 1. Crear la migración (genera archivos C# en Migrations/)
dotnet ef migrations add InitialCreate

# Esto crea:
# Migrations/
# ├── 20260521000000_InitialCreate.cs    # Up() y Down()
# └── ApplicationDbContextModelSnapshot.cs  # Snapshot del modelo

# 2. Aplicar a la BD
dotnet ef database update

# 3. Para desarrollo: aplicar automáticamente al iniciar
# Agregar en Program.cs:
# using (var scope = app.Services.CreateScope())
# {
#     var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
#     await db.Database.MigrateAsync();
# }
```

### 10.6 Soft Delete con EF Core 10

```csharp
// En UserConfiguration.cs ya configuramos:
builder.HasQueryFilter(u => u.DeletedAt == null);

// Esto significa que TODAS las consultas a Users
// automáticamente excluyen usuarios borrados
// _context.Users.ToListAsync()  →  SELECT * FROM users WHERE deleted_at IS NULL
```

### 10.7 Bulk Operations en EF Core 10

```csharp
// Antes (EF Core 8/9):
var expired = await _context.Sessions
    .Where(s => s.ExpiresAt < DateTime.UtcNow)
    .ToListAsync();
_context.Sessions.RemoveRange(expired);
await _context.SaveChangesAsync();
// → Generaba N+1 DELETE statements

// Ahora (EF Core 10):
var deleted = await _context.Sessions
    .Where(s => s.ExpiresAt < DateTime.UtcNow)
    .ExecuteDeleteAsync();
// → Genera: DELETE FROM sessions WHERE expires_at < NOW()
// → Una sola query, muchísimo más rápido
```

---

## 11. Base de Datos

### 11.1 Configurar PostgreSQL

```bash
# Iniciar PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Crear base de datos
sudo -u postgres psql -c "CREATE DATABASE cursinet;"
sudo -u postgres psql -c "CREATE USER cursinet WITH PASSWORD 'cursinet123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE cursinet TO cursinet;"
```

### 11.2 Configurar Redis (opcional)

```bash
# Iniciar Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verificar que funciona
redis-cli ping
# Output: PONG
```

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
| `/api/v1/auth/sessions/{sessionId}` | DELETE | Revocar sesión específica | Sí |
| `/health` | GET | Health check | No |

### Ejemplos de Request

**POST /api/v1/auth/register**
```json
{
  "email": "testuser@example.com",
  "name": "Test User",
  "password": "password123",
  "role": "staff"
}
```

**POST /api/v1/auth/login**
```json
{
  "email": "testuser@example.com",
  "password": "password123"
}
```

**POST /api/v1/auth/verify-email**
```json
{
  "identifier": "testuser@example.com",
  "code": "XXXXXX"
}
```

**POST /api/v1/auth/forgot-password**
```json
{
  "email": "testuser@example.com"
}
```

**POST /api/v1/auth/reset-password**
```json
{
  "email": "testuser@example.com",
  "code": "XXXXXX",
  "newPassword": "newpassword123"
}
```

---

## 13. Comandos Útiles

### Desarrollo

```bash
# Iniciar en modo desarrollo (hot reload)
dotnet watch run --project src/Api/Cursinet.Api/

# Build del proyecto
dotnet build

# Publicar para producción
dotnet publish -c Release -o ./publish

# Ejecutar en producción
dotnet ./publish/Cursinet.Api.dll

# Limpiar build
dotnet clean
```

### Entity Framework

```bash
# Listar herramientas instaladas
dotnet tool list --global

# Instalar/actualizar EF tool
dotnet tool install --global dotnet-ef
dotnet tool update --global dotnet-ef

# Migraciones
dotnet ef migrations add NombreMigracion
dotnet ef database update
dotnet ef migrations list
dotnet ef migrations remove
dotnet ef migrations script -o script.sql

# Ver SQL que genera EF Core (development)
# En appsettings.Development.json, agregar:
# "Microsoft.EntityFrameworkCore.Database.Command": "Information"
```

### .NET SDK

```bash
# Listar SDKs instalados
dotnet --list-sdks

# Listar runtimes instalados
dotnet --list-runtimes

# Info completa del SDK
dotnet --info

# Ver templates disponibles
dotnet new list

# Ver ayuda de un comando
dotnet help

# Crear nuevo proyecto
dotnet new webapi -n MiApi
dotnet new sln -n MiSolucion
dotnet new classlib -n MiLib
```

### Herramientas de Desarrollo

```bash
# Ver procesos en puerto 5000
sudo lsof -i :5000

# Logs de PostgreSQL
sudo journalctl -u postgresql -f

# Logs de Redis
sudo journalctl -u redis-server -f

# Monitorear PostgreSQL en tiempo real
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

### Script Completo de Instalación desde Cero

```bash
#!/bin/bash
# install-dotnet10-debian13.sh

set -e

echo "=== Instalando .NET SDK 10 en Debian 13 ==="

# 1. Registrar repositorio Microsoft
wget https://packages.microsoft.com/config/debian/13/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
rm packages-microsoft-prod.deb

# 2. Actualizar e instalar
sudo apt update
sudo apt install -y dotnet-sdk-10.0

# 3. PostgreSQL (opcional)
sudo apt install -y postgresql postgresql-contrib

# 4. Redis (opcional)
sudo apt install -y redis-server

# 5. Herramientas EF
dotnet tool install --global dotnet-ef

# 6. Verificar
echo ""
echo "=== Verificación ==="
dotnet --version
dotnet --list-sdks

echo ""
echo "=== Instalación completa ==="
echo "SDK: $(dotnet --version)"
echo ""
echo "Para empezar:"
echo "  dotnet new webapi -n MiApi"
echo "  cd MiApi"
echo "  dotnet run"
```

---

## 14. Resumen de Patrones

### Mapa de Correspondencia Fastify → ASP.NET Core

| Concepto Fastify | ASP.NET Core |
|------------------|--------------|
| `hashPassword()` | `PasswordService.HashPassword()` |
| `comparePassword()` | `PasswordService.VerifyPassword()` |
| `generateTokens()` | `TokenService.GenerateTokens()` |
| `verifyToken()` | `TokenService.ValidateAccessToken()` |
| `setAuthCookies()` | `Response.Cookies.Append()` |
| `authGuard` | `AuthGuardAttribute` filter |
| `AppError` | `AppException` |
| Prisma + mappers | EF Core + Configurations |
| Routes + controller | Controller + Actions |
| pino | Serilog |
| Zod | FluentValidation |
| `findByEmail()` | `_userRepository.GetByEmailAsync()` |
| `create(data)` | `_context.Users.Add()` + `SaveChangesAsync()` |

### Clean Architecture - Flujo de una Request

```
HTTP Request
    ↓
[Controller] → Valida input (FluentValidation/DataAnnotations)
    ↓
[AuthService] → Lógica de negocio
    ↓
[Repository]   → Acceso a datos (EF Core)
    ↓
[Database]     → PostgreSQL
    ↓
[Repository]   → Mapea resultados
    ↓
[AuthService]  → Procesa respuesta + Genera tokens
    ↓
[Controller]   → Setea cookies + Retorna respuesta JSON
```

### Patrones Implementados

| Patrón | Aplicación |
|--------|------------|
| **Clean Architecture** | Separación en Domain/Application/Infrastructure/Api |
| **Dependency Inversion** | Service depende de interfaces, no de implementaciones concretas |
| **Repository Pattern** | Abstracción de acceso a datos con interfaces |
| **DI (Dependency Injection)** | Inyección de dependencias nativa de ASP.NET Core |
| **Fluent API** | Configuración de EF Core con `IEntityTypeConfiguration<T>` |
| **Soft Delete** | Filtro global `HasQueryFilter(u => u.DeletedAt == null)` |
| **JWT Authentication** | Access + Refresh tokens con cookies httpOnly |
| **Error Handling** | Middleware centralizado con errores tipados |
| **Bulk Operations** | `ExecuteDeleteAsync()` / `ExecuteUpdateAsync()` de EF Core 10 |
| **Record Classes** | DTOs inmutables con `record` de C# |

---

> **Nota final:** Este manual cubre .NET 10 (LTS) sobre Debian 13 (Trixie).  
> Los comandos de instalación pueden variar si usas otra versión de .NET o Debian.  
> Para versiones futuras, consulta: https://learn.microsoft.com/en-us/dotnet/core/install/linux-debian

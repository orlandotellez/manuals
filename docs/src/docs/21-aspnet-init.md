# ASP.NET Core desde cero - Manual paso a paso

Una guía completa, paso a paso, para crear una **API REST** con **.NET 10** sobre **Debian 13 (Trixie)** aplicando **Clean Architecture**. La vamos a construir como una **tienda online** sencilla: registro y autenticación de **usuarios** (clientes y administradores) y un **CRUD de productos** (crear, leer, actualizar y eliminar).

No necesita que sepas nada de ASP.NET. Arrancamos desde instalar el SDK hasta tener una API funcionando con base de datos, autenticación JWT, validación, manejo de errores y control de permisos por rol.

> **Naming**: en todos los ejemplos usamos el nombre de proyecto **Example** (`Example.Api`, `Example.Domain`, `Example.Infrastructure`, `Example.Application`). Vos podés reemplazarlo por el nombre de tu propia tienda o proyecto.

---

## Índice

1. [¿Qué vamos a construir?](#1-qué-vamos-a-construir)
2. [Conceptos claves antes de empezar](#2-conceptos-claves-antes-de-empezar)
3. [Instalación de .NET 10 en Debian 13](#3-instalación-de-net-10-en-debian-13)
4. [Estructura del proyecto (Clean Architecture)](#4-estructura-del-proyecto-clean-architecture)
5. [Crear la solución y los proyectos](#5-crear-la-solución-y-los-proyectos)
6. [Capa de Dominio - entidades puras](#6-capa-de-dominio---entidades-puras)
7. [Capa de Aplicación - contratos y lógica de negocio](#7-capa-de-aplicación---contratos-y-lógica-de-negocio)
8. [Capa de Infraestructura - acceso a datos y servicios externos](#8-capa-de-infraestructura---acceso-a-datos-y-servicios-externos)
9. [Capa de Presentación - la API](#9-capa-de-presentación---la-api)
10. [Entity Framework Core y migraciones](#10-entity-framework-core-y-migraciones)
11. [Autenticación y autorización](#11-autenticación-y-autorización)
12. [Validación de datos](#12-validación-de-datos)
13. [Manejo centralizado de errores](#13-manejo-centralizado-de-errores)
14. [Endpoints de la tienda](#14-endpoints-de-la-tienda)
15. [Comandos útiles y flujo de trabajo](#15-comandos-útiles-y-flujo-de-trabajo)
16. [Resumen de patrones](#16-resumen-de-patrones)

---

## 1. ¿Qué vamos a construir?

Una API REST de una tienda con estas funcionalidades:

| Módulo | Endpoints |
|--------|-----------|
| **Autenticación** | Registro, login, logout, refresh de token |
| **Usuarios** | Ver perfil, actualizar perfil |
| **Productos** | CRUD completo: crear, listar, ver uno, actualizar, eliminar |

Con estas características técnicas:

- **Clean Architecture** separada en 4 capas (Domain, Application, Infrastructure, Api)
- **PostgreSQL** como base de datos (ORM: Entity Framework Core)
- **Autenticación JWT** con access token + refresh token en cookies httpOnly
- **Roles y permisos**: `Admin` puedo administrar productos, `User` solo leer
- **Validación** con FluentValidation
- **Manejo centralizado de errores** con respuestas JSON consistentes
- **Rate limiting** en los endpoints de autenticación

### Mapa mental de lo que vas a aprender

```
Cliente (App / Postman)
    │
    ▼  HTTP Request (POST /api/v1/auth/login)
┌─────────────────────────────────────────────┐
│  CAPA DE PRESENTACIÓN (Example.Api)         │
│  Controller → valida el request (FluentValidation) │
│  → leer usuario del token (AuthHelper)      │
└───────────────┬─────────────────────────────┘
                ▼
┌─────────────────────────────────────────────┐
│  CAPA DE APLICACIÓN (Example.Application)   │
│  Uses Cases → reglas de negocio             │
│  habla con interfaces (IUserRepository)     │
└───────────────┬─────────────────────────────┘
                ▼
┌─────────────────────────────────────────────┐
│  CAPA DE INFRAESTRUCTURA (Example.Infrastructure) │
│  Repositories → EF Core → PostgreSQL        │
│  Services → JWT, BCrypt, almacenamiento     │
└─────────────────────────────────────────────┘
```

La flecha siempre apunta **hacia adentro**: cada capa solo conoce a la que tiene más adentro, nunca hacia afuera. Eso es la esencia de Clean Architecture y lo vamos a ver en detalle.

---

## 2. Conceptos claves antes de empezar

Antes de escribir código, necesitás entender 4 ideas. Si las dominás, el resto es "solo" escribir archivos.

### 2.1 Clean Architecture - la regla de dependencia

Clean Architecture organiza el código en **capas concéntricas**. La regla de oro es:

> **La dependencia siempre apunta hacia adentro.** Las capas internas NO conocen a las externas.

En nuestra tienda:

```
Example.Api            (más externa: habla con el mundo HTTP)
    │ conoce a
    ▼
Example.Application    (casos de uso / lógica de negocio)
    │ conoce a
    ▼
Example.Domain         (más interna: pura, sin dependencias)
```

- **Domain** (adentro): entidades (`User`, `Product`). No sabe nada de cómo se guardan ni cómo se muestran.
- **Application** (medio): la lógica de la tienda. Define *contratos* (interfaces) que le dicen "yo necesito guardar un producto, pero NO me importa cómo lo hagas".
- **Infrastructure** (afuera): implementa esos contratos con herramientas reales (EF Core, JWT, BCrypt).
- **Api** (la puerta): recibe HTTP, llama a la aplicación, devuelve JSON.

**La clave**: `Application` depende de `Domain`. `Infrastructure` y `Api` dependen de `Application`. Pero `Application` **no** depende de `Infrastructure`. ¿Cómo es posible que la lógica guarde datos sin conocer la base de datos? Con **interfaces** (lo vemos en la siguiente sección).

### 2.2 Inyección de Dependencias (DI) e interfaces

Imaginate que la lógica de la tienda dice: "cuando creo un producto, necesito guardarlo". No le importa si el guardado es en PostgreSQL, en un archivo, o en una lista en memoria. Para eso define una **interfaz**:

```csharp
// En Application/Common/Interfaces/Repositories/Products/IProductRepository.cs
public interface IProductRepository
{
    Task<Product> CreateAsync(Product product);
    Task<Product?> GetByIdAsync(Guid id);
    Task<List<Product>> GetAllAsync();
    Task<Product> UpdateAsync(Product product);
    Task DeleteAsync(Guid id);
}
```

Luego, en **Infrastructure**, implementás esa interfaz con EF Core real:

```csharp
public class ProductRepository : IProductRepository
{
    private readonly ApplicationDbContext _context;
    // ... implementaciones con EF Core
}
```

Finalmente, en el punto de entrada de la app le decís al contenedor de DI: **"cuando alguien pida `IProductRepository`, dale un `ProductRepository`"**:

```csharp
services.AddScoped<IProductRepository, ProductRepository>();
```

Así la lógica de negocio usa `IProductRepository` sin conocer `ProductRepository`. Si mañana cambiás de base de datos, solo cambia un archivo (la implementación), sin tocar la lógica.

### 2.3 El flujo de una request (pedido HTTP)

Cada vez que el cliente llama a un endpoint, pasa por este flujo:

```
1. [Middleware]      Se ejecutan cosas antes de llegar al controller
                     (logging, manejo de errores, rate limiting)
2. [Controller]      Recibe el request, extrae los datos
3. [Validación]      FluentValidation revisa que los datos sean válidos
                     (email bien formado, campos requeridos, etc.)
4. [Service]         Aplica las reglas de negocio (caso de uso)
5. [Repository]      Interactúa con la base de datos
6. [Database]        PostgreSQL ejecuta el SQL
7. ... de vuelta ... Devuelve el resultado mapeado a DTO y como JSON
```

### 2.4 DTOs (Data Transfer Objects)

Un **DTO** es un objeto que solo sirve para *transportar datos* entre capas, sin lógica. En C# moderno se hacen con **records** (veremos más adelante). Se usan para:

1. **Recibir** lo que llega del cliente (request DTO)
2. **Devolver** lo que el cliente ve (response DTO), sin exponer datos internos como el hash de la contraseña

---

## 3. Instalación de .NET 10 en Debian 13

### 3.1 Requisitos

- Debian 13 (Trixie) - amd64 o arm64
- 2 GB RAM mínimos (4 GB recomendado)
- 5 GB de espacio libre
- Conexión a internet

### 3.2 Instalación por APT (recomendada)

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
| `aspnetcore-runtime-10.0` | Runtime de ASP.NET Core (viene dentro del SDK) |
| `dotnet-runtime-10.0` | Runtime base de .NET (viene dentro del SDK) |

### 3.3 Instalación solo runtime (para producción)

Si solo necesitás **ejecutar** la app (no desarrollarla):

```bash
sudo apt install -y aspnetcore-runtime-10.0
```

### 3.4 Instalación por script (alternativa)

```bash
wget https://dot.net/v1/dotnet-install.sh
chmod +x dotnet-install.sh
./dotnet-install.sh --channel 10.0

# Agregar al PATH (bash)
echo 'export DOTNET_ROOT=$HOME/.dotnet' >> ~/.bashrc
echo 'export PATH=$PATH:$DOTNET_ROOT:$DOTNET_ROOT/tools' >> ~/.bashrc
source ~/.bashrc
```

### 3.5 Dependencias adicionales

Para esta tienda vamos a necesitar PostgreSQL (y opcionalmente Redis para caché):

```bash
# PostgreSQL (lo usamos para la tienda)
sudo apt install -y postgresql postgresql-contrib

# Herramientas de desarrollo
sudo apt install -y git curl build-essential

# Herramienta EF Core (la instalamos en el paso 10, pero adelantamos)
dotnet tool install --global dotnet-ef
```

### 3.6 Verificar instalación

```bash
dotnet --version
# Output esperado: 10.0.xxx

dotnet --list-sdks
# Output esperado: 10.0.xxx [/usr/share/dotnet/sdk]

dotnet --info

# Prueba rápida
dotnet new console -n hola-mundo
cd hola-mundo
dotnet run
```

---

## 4. Estructura del proyecto (Clean Architecture)

Esta es la estructura de carpetas que vamos a crear, aplicada a la tienda. Fijate cómo cada capa guarda lo que le corresponde.

```
Example.slnx                      # Solución (agrupa los proyectos)
src/
├── Example.Domain/               # CAPA DOMINIO - entidades puras
│   ├── Entities/
│   │   ├── Auth/                 # Entidades de autenticación
│   │   │   ├── Account.cs
│   │   │   ├── Session.cs
│   │   │   └── Verification.cs
│   │   └── Products/             # Entidades de la tienda
│   │       └── Product.cs
│   ├── Enums/
│   │   └── UserRole.cs           # roles: User, Admin
│   └── Exceptions/
│       └── AppException.cs       # errores de negocio tipados
│
├── Example.Application/          # CAPA APLICACIÓN - contratos + lógica
│   ├── Common/
│   │   ├── Authorization/
│   │   │   └── RolePermissions.cs    # mapa de rol → permisos
│   │   ├── Interfaces/
│   │   │   ├── Repositories/
│   │   │   │   ├── Auth/ (IAccountRepository, ISessionRepository, IVerificationRepository)
│   │   │   │   └── Products/ (IProductRepository)
│   │   │   └── Services/
│   │   │       ├── IAuthService.cs
│   │   │       ├── IProductService.cs
│   │   │       ├── IPasswordService.cs
│   │   │       └── ITokenService.cs
│   │   ├── Mapping/                  # extensión: entidad → DTO
│   │   │   └── MappingProduct.cs
│   │   └── Models/                   # DTOs
│   │       ├── Auth/
│   │       │   ├── AuthRequest.cs
│   │       │   └── AuthResult.cs
│   │       └── Products/
│   │           ├── ProductRequest.cs
│   │           └── ProductResult.cs
│   └── Features/
│       ├── Auth/
│       │   └── AuthService.cs        # lógica de auth
│       └── Products/
│           └── ProductService.cs     # lógica de productos
│
├── Example.Infrastructure/       # CAPA INFRAESTRUCTURA - implementaciones
│   ├── Adapters/
│   │   └── Cloud/
│   │       └── R2StorageService.cs   # almacenamiento de imágenes (opcional)
│   ├── Persistence/
│   │   ├── ApplicationDbContext.cs   # contexto EF Core
│   │   ├── Configurations/
│   │   │   ├── Auth/
│   │   │   │   ├── AccountConfiguration.cs
│   │   │   │   ├── SessionConfiguration.cs
│   │   │   │   └── VerificationConfiguration.cs
│   │   │   └── Products/
│   │   │       └── ProductConfiguration.cs
│   │   └── Repositories/
│   │       ├── Auth/
│   │       │   ├── AccountRepository.cs
│   │       │   ├── SessionRepository.cs
│   │       │   └── VerificationRepository.cs
│   │       └── Products/
│   │           └── ProductRepository.cs
│   ├── Services/
│   │   ├── PasswordService.cs        # BCrypt
│   │   └── TokenService.cs           # JWT
│   └── Migrations/                   # generadas por EF Core
│
└── Example.Api/                  # CAPA PRESENTACIÓN - la API
    ├── Authorization/
    │   └── RequirePermissionAttribute.cs
    ├── Controllers/
    │   ├── AuthController.cs
    │   ├── ProductController.cs
    │   └── UserController.cs
    ├── Extensions/               # registro de servicios (DI)
    │   ├── AuthenticationExtensions.cs
    │   ├── CorsExtensions.cs
    │   ├── DatabaseExtensions.cs
    │   ├── DependencyInjectionExtensions.cs
    │   ├── MiddlewareExtensions.cs
    │   └── RateLimitExtensions.cs
    ├── Helpers/
    │   ├── AuthHelper.cs
    │   ├── CookieHelper.cs
    │   └── ErrorResponse.cs
    ├── Middleware/
    │   └── ErrorHandlingMiddleware.cs
    ├── Program.cs               # punto de entrada
    ├── appsettings.json
    └── appsettings.Development.json
```

**Reglas de referencia entre capas** (qué proyecto conoce a qué):

| Proyecto | Referencia a |
|----------|--------------|
| `Example.Domain` | *(ninguno)* - capa más interna |
| `Example.Application` | `Example.Domain` |
| `Example.Infrastructure` | `Example.Application` (e indirectamente `Domain`) |
| `Example.Api` | `Example.Infrastructure` + `Example.Application` |

> **Nunca al revés.** Es decir: `Domain` jamás referencia a `Application`, `Application` jamás referencia a `Infrastructure`, etc. Eso mantiene la regla de dependencia hacia adentro.

---

## 5. Crear la solución y los proyectos

### 5.1 La solución (Solution)

Una **solución** agrupa todos los proyectos de la tienda en un solo lugar. Es como la "carpeta contenedora" que une `Example.Api`, `Example.Domain`, etc.

```bash
mkdir example-tienda
cd example-tienda

# Crear la solución
dotnet new sln -n Example
```

Como .NET 10 usa el formato `.slnx`, se crea un archivo `Example.slnx`.

### 5.2 Crear los proyectos de cada capa

Cada capa es un **proyecto** `.csproj`:

- `classlib` → biblioteca de clases (para Domain, Application, Infrastructure) → **no es una API**, es lógica.
- `webapi` → proyecto web (para Api) → es el que expone los endpoints HTTP.

```bash
# Crear la carpeta src y los proyectos dentro
mkdir src

dotnet new classlib -o src/Example.Domain
dotnet new classlib -o src/Example.Application
dotnet new classlib -o src/Example.Infrastructure
dotnet new webapi -o src/Example.Api
```

> **¿Por qué Domain/Application/Infrastructure son `classlib`?** Porque no tienen servidor HTTP. Son bibliotecas que la API usa. La API (`webapi`) es la única que "corre" y escucha peticiones.

### 5.3 Agregar proyectos a la solución

```bash
dotnet sln add src/Example.Domain
dotnet sln add src/Example.Application
dotnet sln add src/Example.Infrastructure
dotnet sln add src/Example.Api
```

### 5.4 Agregar referencias entre capas

Acá aplicamos las reglas de dependencia de Clean Architecture:

```bash
# Application conoce a Domain
dotnet add src/Example.Application reference src/Example.Domain

# Infrastructure conoce a Application (e indirectamente a Domain)
dotnet add src/Example.Infrastructure reference src/Example.Application

# Api conoce a Infrastructure y a Application
dotnet add src/Example.Api reference src/Example.Infrastructure
dotnet add src/Example.Api reference src/Example.Application
```

### 5.5 Verificar la estructura

```bash
dotnet sln list
# Debería listar los 4 proyectos

dotnet build
# Debería compilar sin errores
```

### 5.6 El archivo Example.slnx resultante

```xml
<Solution>
  <Folder Name="/src/">
    <Project Path="src/Example.Domain/Example.Domain.csproj" />
    <Project Path="src/Example.Application/Example.Application.csproj" />
    <Project Path="src/Example.Infrastructure/Example.Infrastructure.csproj" />
    <Project Path="src/Example.Api/Example.Api.csproj" />
  </Folder>
</Solution>
```

### 5.7 Ejemplo de un .csproj (Example.Api.csproj)

Cada proyecto tiene un archivo `.csproj` (XML) con su configuración. Ejemplo del de la API:

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <!-- Paquetes NuGet de la API -->
    <PackageReference Include="FluentValidation.AspNetCore" Version="11.4.*" />
    <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="10.0.*" />
    <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="10.0.*" />
  </ItemGroup>

  <ItemGroup>
    <!-- Referencias a las otras capas -->
    <ProjectReference Include="..\Example.Infrastructure\Example.Infrastructure.csproj" />
    <ProjectReference Include="..\Example.Application\Example.Application.csproj" />
  </ItemGroup>

</Project>
```

**Qué significan las propiedades:**

| Propiedad | Significado |
|-----------|-------------|
| `TargetFramework` | `net10.0` = .NET 10 |
| `Nullable enable` | Activa el sistema de tipos nullable de C# (`string?` = puede ser null) |
| `ImplicitUsings enable` | `using` implícitos de los namespaces más comunes (no hace falta escribirlos) |
| `PackageReference` | Un paquete NuGet que el proyecto usa |
| `ProjectReference` | Un proyecto de la solución del que depende |

> **NuGet** es el administrador de paquetes de .NET (como `npm` para Node o `pip` para Python). Cada librería externa se instala como paquete.

---

## 6. Capa de Dominio - entidades puras

La **capa de dominio** es el corazón del sistema. Contiene las **entidades** (los "sustantivos" de la tienda: `User`, `Product`, `Account`, `Session`) y los **enums**. No tiene ninguna dependencia externa: ni base de datos, ni framework, ni paquetes NuGet. Es código C# puro.

> **Regla**: en `Example.Domain` NO hay `using Microsoft.EntityFrameworkCore`, NO hay `using Microsoft.AspNetCore...`. Es solo C#. Así el dominio queda aislado y fácil de entender y testear.

### 6.1 Enums/UserRole.cs - los roles de la tienda

Un **enum** es un conjunto de valores fijos. Para nuestra tienda tenemos dos roles:

```csharp
namespace Example.Domain.Enums;

public enum UserRole
{
    User,       // cliente de la tienda
    Admin       // administrador
}
```

En TypeScript sería: `type UserRole = "User" | "Admin"`. Guardamos el valor como string en la base de datos (lo configuramos después en la capa de infraestructura).

### 6.2 Entities/Products/Product.cs - el producto de la tienda

El producto es la entidad central del CRUD. Una clase sin lógica, solo propiedades:

```csharp
namespace Example.Domain.Entities.Products;

public class Product
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public string? Image { get; set; }          // URL de la imagen (opcional)
    public bool IsActive { get; set; } = true;  // soft delete / activo
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }    // soft delete
    public Guid? DeletedByUserId { get; set; }  // quién lo eliminó
    public string? DeletedByName { get; set; }  // nombre de quién lo eliminó
}
```

**Análisis línea por línea:**

- `Guid Id` → identificador único universal. Lo usamos como clave primaria (no números autoincrementales). Es imposible que se repita, y no revela cuántos registros hay.
- `string? Image` → el `?` significa que puede ser `null` (no hay imagen). Gracias a `Nullable enable`.
- `decimal Price` → precios usan `decimal`, NUNCA `double` ni `float` (estos últimos tienen errores de redondeo, inaceptables con dinero).
- `IsActive` → si el producto está a la venta o desactivado.
- `DeletedAt`, `DeletedByUserId`, `DeletedByName` → **soft delete**: en vez de borrar el registro de la base, lo "marcamos" como borrado. Así siempre se puede auditar quién y cuándo lo hizo.

### 6.3 Entities/Auth/Account.cs - cuenta de acceso

Una cuenta asocia un usuario con un método de acceso. En una tienda puede ser `credentials` (email+password), `google`, `github`, etc.

```csharp
namespace Example.Domain.Entities.Auth;

public class Account
{
    public Guid Id { get; set; }
    public string AccountId { get; set; } = null!;   // ID del proveedor
    public string ProviderId { get; set; } = null!;  // "credentials", "google", "github"
    public string? Password { get; set; }            // hash de la password (solo credentials)
    public string? AccessToken { get; set; }         // tokens OAuth (si hay)
    public string? RefreshToken { get; set; }
    public string? IdToken { get; set; }
    public DateTime? AccessTokenExpiresAt { get; set; }
    public DateTime? RefreshTokenExpiresAt { get; set; }
    public string? Scope { get; set; }
    public Guid UserId { get; set; }                 // FK a User
    public User User { get; set; } = null!;          // navigation property
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

> **Nunca guardamos la password en texto plano.** Guardamos un **hash** (resultado de BCrypt), que no se puede invertir. Lo vemos en la capa de infraestructura.

### 6.4 Entities/Auth/Session.cs - sesión del usuario

Una sesión representa que un usuario "está logueado". Guardamos el refresh token y sus tiempos.

```csharp
namespace Example.Domain.Entities.Auth;

public class Session
{
    public Guid Id { get; set; }
    public DateTime ExpiresAt { get; set; }
    public string Token { get; set; } = string.Empty;  // refresh token
    public string? IpAddress { get; set; }             // desde dónde se conectó
    public string? UserAgent { get; set; }             // navegador/dispositivo
    public Guid UserId { get; set; }                   // a qué usuario pertenece
    public User User { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

### 6.5 Entities/Auth/Verification.cs - códigos de verificación

Se usa para verificar el email o resetear la password (códigos de 6 caracteres con expiración):

```csharp
namespace Example.Domain.Entities.Auth;

public class Verification
{
    public Guid Id { get; set; }
    public string Identifier { get; set; } = null!;  // email o "reset:email"
    public string Value { get; set; } = null!;       // el código
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

### 6.6 Entities/Users/User.cs - el usuario de la tienda

```csharp
using Example.Domain.Enums;

namespace Example.Domain.Entities.Users;

public class User
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool EmailVerified { get; set; }
    public string? Phone { get; set; }
    public string? Image { get; set; }
    public UserRole Role { get; set; }          // User o Admin
    public bool IsActive { get; set; } = true;
    public DateTime? LastSeenAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }    // soft delete
    public Guid? DeletedByUserId { get; set; }  // quién lo eliminó
    public string? DeletedByName { get; set; }
    public int FailedLoginAttempts { get; set; }    // intentos fallidos (bloqueo)
    public DateTime? LockoutEnd { get; set; }       // fin del bloqueo por intentos fallidos
}
```

### 6.7 Exceptions/AppException.cs - errores de negocio

Los errores de la tienda no son "explosiones" genéricas: son objetos con **código HTTP** y **código de negocio**. Para eso definimos `AppException` y un helper estático.

```csharp
namespace Example.Domain.Exceptions;

public class AppException : Exception
{
    public int StatusCode { get; }
    public string Code { get; }
    public bool IsOperational { get; }

    public AppException(string message, int statusCode, string code) : base(message)
    {
        StatusCode = statusCode;
        Code = code;
        IsOperational = true;
    }
}

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
}
```

**¿Por qué es tan útil?**

Imaginate en el `ProductService`:

```csharp
// Si el producto no existe, lanzamos un error de negocio con código 404
throw AppExceptions.NotFound("Product not found");

// Si el email ya está registrado
throw AppExceptions.Conflict("Email already registered");
```

Después, un único **middleware** (capa de presentación) atrapa cualquier `AppException` y arma la respuesta JSON coherente. No repetimos la lógica de errores en cada método.

**Mapa de errores:**

| Helper | Status | Code | Uso en la tienda |
|--------|--------|------|------------------|
| `BadRequest` | 400 | BAD_REQUEST | Datos inválidos |
| `Unauthorized` | 401 | UNAUTHORIZED | No autenticado / credenciales mal |
| `Forbidden` | 403 | FORBIDDEN | Sin permisos para la acción |
| `NotFound` | 404 | NOT_FOUND | Producto/usuario no existe |
| `Conflict` | 409 | CONFLICT | Email duplicado, producto repetido |
| `UnprocessableEntity` | 422 | UNPROCESSABLE_ENTITY | Validación fallida |
| `TooManyRequests` | 429 | TOO_MANY_REQUESTS | Demasiados intentos (rate limit) |

### 6.8 Resumen de la capa de dominio

La capa de dominio ya está lista y NO depende de nada externo. Antes de seguir, ejecutá:

```bash
dotnet build
```

Si no hay errores, pasamos a la capa de aplicación.

---

## 7. Capa de Aplicación - contratos y lógica de negocio

La **capa de aplicación** tiene dos responsabilidades:

1. **Definir los contratos** (interfaces) que la tienda necesita: "para guardar productos necesito un repositorio". OJO: acá solo se *declara*, no se implementa.
2. **Orquestar la lógica de negocio** en los **services** (casos de uso): "cuando creo un producto, valido que no exista otro con el mismo nombre, después lo guardo".

Esta capa conoce a `Domain` (usa las entidades). NO conoce a `Infrastructure` ni a `Api`.

### 7.1 DTOs - los "envelopes" de datos

Los DTOs viven en `Application/Common/Models/{Feature}`. Se usan para **separar** lo que entra y sale de la lógica, sin exponer las entidades internas.

#### Products/ProductRequest.cs (lo que el cliente envía)

```csharp
namespace Example.Application.Common.Models.Products;

// Registrar/Crear un producto
public record CreateProductRequest(
    string Name,
    string Description,
    decimal Price,
    int Stock
);

// Actualizar un producto (parcial, todos opcionales)
public record UpdateProductRequest(
    string? Name,
    string? Description,
    decimal? Price,
    int? Stock
);
```

#### Products/ProductResult.cs (lo que el cliente recibe)

```csharp
namespace Example.Application.Common.Models.Products;

public record ProductDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public decimal Price { get; init; }
    public int Stock { get; init; }
    public bool IsActive { get; init; }
    public string? Image { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}
```

> **¿Qué son los `record` de C#?** Son un tipo de dato inmutable, ideal para DTOs:
> - `record CreateProductRequest(...)` → record *posicional*: los parámetros del constructor definen las propiedades (como una tupla con nombre).
> - `record ProductDto { ... }` → record *con cuerpo*: setter `init` (solo se asigna al construir, después es inmutable).
> - Comparación por valor (dos records con los mismos datos son iguales), algo que una `class` normal no hace.

#### Auth/AuthRequest.cs

```csharp
namespace Example.Application.Common.Models.Auth;

public record LoginRequest(
    string Email,
    string Password
);

public record RegisterRequest(
    string Name,
    string Email,
    string Password
);

public record RefreshRequest(
    string RefreshToken
);
```

#### Auth/AuthResult.cs

```csharp
namespace Example.Application.Common.Models.Auth;

public record AuthResponse
{
    public string Message { get; init; } = string.Empty;
    public string AccessToken { get; init; } = string.Empty;
    public string RefreshToken { get; init; } = string.Empty;
    // Podrías incluir datos del usuario autenticado
}

public record RefreshResponse
{
    public string Message { get; init; } = string.Empty;
    public string AccessToken { get; init; } = string.Empty;
    public string RefreshToken { get; init; } = string.Empty;
}
```

### 7.2 Interfaces de repositorios - los contratos de datos

Estas interfaces dicen **qué** necesita la lógica, no **cómo** se hace.

#### Repositories/Products/IProductRepository.cs

```csharp
using Example.Domain.Entities.Products;

namespace Example.Application.Common.Interfaces.Repositories.Products;

public interface IProductRepository
{
    Task<List<Product>> GetAllAsync();
    Task<Product?> GetByIdAsync(Guid id);
    Task<Product> CreateAsync(Product product);
    Task<Product> UpdateAsync(Product product);
    Task SoftDeleteAsync(Guid id, Guid deletedByUserId, string deletedByName);
}
```

#### Repositories/Auth/IAccountRepository.cs

```csharp
using Example.Domain.Entities.Auth;

namespace Example.Application.Common.Interfaces.Repositories.Auth;

public interface IAccountRepository
{
    Task<Account?> GetCredentialsByEmailAsync(string email);
    Task<Account> CreateAsync(Account account);
    Task<Account> UpdateAsync(Account account);
    Task DeleteAsync(Guid id);
}
```

#### Repositories/Auth/ISessionRepository.cs

```csharp
using Example.Domain.Entities.Auth;

namespace Example.Application.Common.Interfaces.Repositories.Auth;

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

### 7.3 Interfaces de servicios - los contratos de capacidades

Además de guardar datos, la tienda necesita capacidades como "hashear password" o "crear tokens JWT". También son interfaces.

#### Services/IPasswordService.cs

```csharp
namespace Example.Application.Common.Interfaces.Services;

public interface IPasswordService
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string hash);
}
```

#### Services/ITokenService.cs

```csharp
using System.Security.Claims;
using Example.Domain.Enums;

namespace Example.Application.Common.Interfaces.Services;

public interface ITokenService
{
    (string accessToken, string refreshToken) GenerateTokens(Guid userId, string email, UserRole role);
    ClaimsPrincipal? ValidateAccessToken(string token);
    ClaimsPrincipal? ValidateRefreshToken(string token);
}
```

#### Services/IProductService.cs

```csharp
using Example.Application.Common.Models.Products;

namespace Example.Application.Common.Interfaces.Services;

public interface IProductService
{
    Task<List<ProductDto>> GetAllAsync();
    Task<ProductDto?> GetByIdAsync(Guid id);
    Task<ProductDto> CreateAsync(Guid currentUserId, CreateProductRequest request);
    Task<ProductDto> UpdateAsync(Guid currentUserId, Guid productId, UpdateProductRequest request);
    Task DeleteAsync(Guid currentUserId, Guid productId);
}
```

### 7.4 Services/IProductService.cs → ProductService.cs (caso de uso)

Ahora la parte interesante: **implementamos la lógica de negocio** usando solo las interfaces. El service **no sabe** que existe PostgreSQL; solo usa `IProductRepository`.

```csharp
using Example.Application.Common.Interfaces.Services;
using Example.Application.Common.Interfaces.Repositories.Products;
using Example.Application.Common.Models.Products;
using Example.Application.Common.Mapping;
using Example.Domain.Entities.Products;
using Example.Domain.Exceptions;

namespace Example.Application.Features.Products;

public class ProductService : IProductService
{
    private readonly IProductRepository _productRepository;

    // Inyección por constructor: el contenedor DI le pasa la implementación real
    public ProductService(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<ProductDto> CreateAsync(Guid currentUserId, CreateProductRequest request)
    {
        // Regla de negocio: no pueden existir dos productos con el mismo nombre
        // (lo validamos en el repo o con un índice único en la BD — ver infraestructura)

        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            Stock = request.Stock,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _productRepository.CreateAsync(product);

        return created.MapProductToDto();
    }

    public async Task<List<ProductDto>> GetAllAsync()
    {
        var products = await _productRepository.GetAllAsync();
        return products.Select(p => p.MapProductToDto()).ToList();
    }

    public async Task<ProductDto?> GetByIdAsync(Guid id)
    {
        var product = await _productRepository.GetByIdAsync(id);
        return product?.MapProductToDto();
    }

    public async Task<ProductDto> UpdateAsync(Guid currentUserId, Guid productId, UpdateProductRequest request)
    {
        var product = await _productRepository.GetByIdAsync(productId);
        if (product is null) throw AppExceptions.NotFound("Product not found");

        // Solo actualizamos los campos que vienen con valor
        if (request.Name is not null) product.Name = request.Name;
        if (request.Description is not null) product.Description = request.Description;
        if (request.Price.HasValue) product.Price = request.Price.Value;
        if (request.Stock.HasValue) product.Stock = request.Stock.Value;

        product.UpdatedAt = DateTime.UtcNow;

        var updated = await _productRepository.UpdateAsync(product);
        return updated.MapProductToDto();
    }

    public async Task DeleteAsync(Guid currentUserId, Guid productId)
    {
        var product = await _productRepository.GetByIdAsync(productId);
        if (product is null) throw AppExceptions.NotFound("Product not found");

        // Soft delete: marcamos pero no borramos físicamente
        await _productRepository.SoftDeleteAsync(productId, currentUserId, "current user name");
    }
}
```

**Puntos clave del service:**

1. **No conoce infraestructura.** Usa `IProductRepository`, que es una interfaz.
2. **Es la regla de negocio.** "Si no existe, tiro 404" es lógica que pertenece acá.
3. **Usa UTC.** `DateTime.UtcNow` → nunca guardes hora local, porque cada cliente tiene la suya. Guardás UTC y convertís al mostrar.
4. **Mapea a DTO.** Nunca devolvemos la entidad cruda (que podría exponer campos internos). Usamos `MapProductToDto()` (lo definimos en infraestructura).

### 7.5 AuthService.cs - lógica de autenticación

El service de auth combina varios repositorios y servicios. Veamos el registro y el login:

```csharp
using System.Security.Claims;
using Example.Application.Common.Interfaces.Services;
using Example.Application.Common.Interfaces.Repositories.Auth;
using Example.Application.Common.Interfaces.Repositories.Users;
using Example.Application.Common.Models.Auth;
using Example.Domain.Entities.Users;
using Example.Domain.Entities.Auth;
using Example.Domain.Enums;
using Example.Domain.Exceptions;

namespace Example.Application.Features.Auth;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<RefreshResponse> RefreshAsync(string refreshToken);
    Task LogoutAsync(string refreshToken);
}

public class AuthService : IAuthService
{
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

    // ====================
    // REGISTRO
    // ====================
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        // 1. Verificar que el email no exista
        var existing = await _userRepository.GetByEmailAsync(request.Email);
        if (existing is not null)
            throw AppExceptions.Conflict("Email already registered");

        // 2. Guardamos el hash de la password, NUNCA la password
        var hashedPassword = _passwordService.HashPassword(request.Password);

        // 3. Crear el usuario (rol por defecto: User)
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

        // 4. Crear la cuenta de acceso "credentials"
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
        var (accessToken, refreshToken) = _tokenService.GenerateTokens(user.Id, user.Email, user.Role);

        // 6. Crear una sesión con el refresh token
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

        return new AuthResponse
        {
            Message = "User created successfully",
            AccessToken = accessToken,
            RefreshToken = refreshToken
        };
    }

    // ====================
    // LOGIN
    // ====================
    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        // 1. Buscar la cuenta credentials por email
        var account = await _accountRepository.GetCredentialsByEmailAsync(request.Email);
        if (account is null)
            throw AppExceptions.Unauthorized("Invalid credentials");

        // 2. Verificar la password contra el hash guardado
        if (account.Password is null || !_passwordService.VerifyPassword(request.Password, account.Password))
            throw AppExceptions.Unauthorized("Invalid credentials");

        // 3. Buscar el usuario
        var user = await _userRepository.GetByIdAsync(account.UserId);
        if (user is null)
            throw AppExceptions.Unauthorized("User not found");

        // 4. Chequear soft delete
        if (user.DeletedAt is not null)
            throw AppExceptions.Unauthorized("Account has been deactivated");

        // 5. Generar tokens y crear sesión
        var (accessToken, refreshToken) = _tokenService.GenerateTokens(user.Id, user.Email, user.Role);

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

        return new AuthResponse
        {
            Message = "Login successful",
            AccessToken = accessToken,
            RefreshToken = refreshToken
        };
    }

    // ====================
    // REFRESH (rotación de tokens)
    // ====================
    public async Task<RefreshResponse> RefreshAsync(string refreshToken)
    {
        // 1. Validar el refresh token (firma y expiración)
        var principal = _tokenService.ValidateRefreshToken(refreshToken);
        if (principal is null)
            throw AppExceptions.Unauthorized("Invalid or expired refresh token");

        // 2. Extraer el UserId del token
        var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            throw AppExceptions.Unauthorized("Invalid refresh token");

        // 3. Buscar la sesión activa con ese refresh token
        var existingSession = await _sessionRepository.GetByTokenAsync(refreshToken);
        if (existingSession is null)
            throw AppExceptions.Unauthorized("Session not found");

        if (existingSession.ExpiresAt < DateTime.UtcNow)
            throw AppExceptions.Unauthorized("Session expired");

        // 4. Buscar usuario
        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null || user.DeletedAt is not null)
            throw AppExceptions.Unauthorized("User not found or deactivated");

        // 5. Rotación: generamos tokens NUEVOS y eliminamos la sesión vieja
        var (newAccessToken, newRefreshToken) = _tokenService.GenerateTokens(user.Id, user.Email, user.Role);

        await _sessionRepository.DeleteAsync(refreshToken);

        var newSession = new Session
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _sessionRepository.CreateAsync(newSession);

        return new RefreshResponse
        {
            Message = "Tokens refreshed successfully",
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken
        };
    }

    // ====================
    // LOGOUT
    // ====================
    public async Task LogoutAsync(string refreshToken)
    {
        await _sessionRepository.DeleteAsync(refreshToken);
    }
}
```

### 7.6 Interfaces de repositorios de usuarios

Necesitamos la interfaz del usuario para el auth service:

```csharp
// Repositories/Users/IUserRepository.cs
using Example.Domain.Entities.Users;

namespace Example.Application.Common.Interfaces.Repositories.Users;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(Guid id);
    Task<User> CreateAsync(User user);
    Task<User> UpdateAsync(User user);
}
```

### 7.7 Authorization/RolePermissions.cs - mapa de permisos por rol

Este archivo define **qué puede hacer cada rol** de la tienda. Un permiso es un string tipo `"products.create"`, `"products.read"`, etc. Separar roles de permisos permite mucha flexibilidad.

```csharp
using Example.Domain.Enums;

namespace Example.Application.Common.Authorization;

public static class RolePermissions
{
    // Cada rol tiene un conjunto de permisos
    private static readonly Dictionary<UserRole, HashSet<string>> RolePermissionsMap = new()
    {
        [UserRole.Admin] = new HashSet<string>
        {
            // Productos
            "products.read",
            "products.create",
            "products.update",
            "products.delete",

            // Usuarios
            "users.read",
            "users.update",
            "users.deactivate",
        },

        [UserRole.User] = new HashSet<string>
        {
            // Un cliente solo lee productos y administra su perfil
            "products.read",
            "profile.read",
            "profile.update",
        },
    };

    /// <summary>Verifica si un rol tiene un permiso específico.</summary>
    public static bool HasPermission(UserRole role, string permission)
    {
        if (!RolePermissionsMap.TryGetValue(role, out var permissions))
            return false;
        return permissions.Contains(permission);
    }

    /// <summary>Verifica si el usuario tiene alguno de los permisos indicados.</summary>
    public static bool HasAnyPermission(UserRole role, params string[] permissions)
        => permissions.Any(p => HasPermission(role, p));

    /// <summary>Verifica si el usuario tiene todos los permisos indicados.</summary>
    public static bool HasAllPermissions(UserRole role, params string[] permissions)
        => permissions.All(p => HasPermission(role, p));
}
```

Este mapa lo usamos después en el atributo `[RequirePermission("products.delete")]` en los controllers.

### 7.8 Resumen de la capa de aplicación

La capa de aplicación está lista y solo conoce a `Domain`. Ejecutá:

```bash
dotnet build
```

---

## 8. Capa de Infraestructura - acceso a datos y servicios externos

La **capa de infraestructura** implementa todos los contratos que definimos en la aplicación. Acá sí se habla con el mundo real: PostgreSQL (EF Core), JWT, BCrypt, almacenamiento en la nube.

Esta capa conoce a `Application` (usa sus interfaces) e indirectamente a `Domain` (usa las entidades).

### 8.1 Paquetes NuGet de Infrastructure

Primero instalamos las dependencias en `src/Example.Infrastructure/Example.Infrastructure.csproj`:

```bash
dotnet add src/Example.Infrastructure package Microsoft.EntityFrameworkCore --version 10.0.*
dotnet add src/Example.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL --version 10.0.*
dotnet add src/Example.Infrastructure package BCrypt.Net-Next --version 4.0.*
dotnet add src/Example.Infrastructure package System.IdentityModel.Tokens.Jwt --version 8.*
```

`Example.Infrastructure.csproj` queda así:

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <ProjectReference Include="..\Example.Application\Example.Application.csproj" />
  </ItemGroup>

  <ItemGroup>
    <PackageReference Include="BCrypt.Net-Next" Version="4.0.*" />
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="10.0.*" />
    <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="10.0.*" />
    <PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="8.*" />
  </ItemGroup>

</Project>
```

### 8.2 ApplicationDbContext.cs - el puente con la base de datos

`DbContext` es la clase de EF Core que representa la base de datos. Cada `DbSet<T>` es como una "tabla" que la tienda consulta.

```csharp
using Example.Domain.Entities.Auth;
using Example.Domain.Entities.Users;
using Example.Domain.Entities.Products;
using Example.Infrastructure.Persistence.Configurations.Products;
using Microsoft.EntityFrameworkCore;

namespace Example.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    // Cada DbSet = una tabla
    public DbSet<User> Users => Set<User>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<Verification> Verifications => Set<Verification>();
    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Aplicar las configuraciones de mapeo (Fluent API)
        modelBuilder.ApplyConfiguration(new ProductConfiguration());
    }
}
```

> `OnModelCreating` es donde EF Core arma el "mapa" entre tus clases C# y las tablas de la BD. En vez de escribir TODO acá, separamos la configuración de cada entidad en archivos `*Configuration.cs` (el patrón de la tienda real) y los aplicamos con `ApplyConfiguration`.

### 8.3 Configuración de entidades (Fluent API)

#### Configurations/Products/ProductConfiguration.cs

Acá definimos a qué **tabla**, **columna**, **índices** y **tipos** mapea cada propiedad de `Product`.

```csharp
using Example.Domain.Entities.Products;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Example.Infrastructure.Persistence.Configurations.Products;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");
        builder.HasKey(p => p.Id);

        // El Id se genera en PostgreSQL con gen_random_uuid() para UUID v4
        builder.Property(p => p.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(p => p.Name)
            .IsRequired()
            .HasColumnName("name")
            .HasMaxLength(255);

        // Índice único en nombre: no pueden existir dos productos con el mismo nombre
        builder.HasIndex(p => p.Name).IsUnique();

        builder.Property(p => p.Description)
            .HasColumnName("description")
            .HasMaxLength(2000);

        builder.Property(p => p.Price)
            .HasColumnType("decimal(18,2)")   // precisión para dinero
            .HasColumnName("price");

        builder.Property(p => p.Stock)
            .HasColumnName("stock")
            .HasDefaultValue(0);

        builder.Property(p => p.Image).HasColumnName("image");

        builder.Property(p => p.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);

        builder.HasIndex(p => p.Price);
        builder.HasIndex(p => p.CreatedAt).HasDatabaseName("idx_products_created_at");

        builder.Property(p => p.CreatedAt)
            .IsRequired()
            .HasColumnName("created_at")
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.Property(p => p.UpdatedAt)
            .IsRequired()
            .HasColumnName("updated_at")
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.Property(p => p.DeletedAt).HasColumnName("deleted_at");
        builder.Property(p => p.DeletedByUserId).HasColumnName("deleted_by_user_id");
        builder.Property(p => p.DeletedByName).HasColumnName("deleted_by_name").HasMaxLength(255);
    }
}
```

**Conceptos importantes de Fluent API:**

| Método | Qué hace |
|--------|----------|
| `ToTable("Products")` | El nombre de la tabla en la BD |
| `HasKey(p => p.Id)` | Define la clave primaria |
| `HasColumnName("name")` | El nombre de la columna en la BD (snake_case) |
| `HasDefaultValueSql("gen_random_uuid()")` | Genera el UUID automáticamente al insertar |
| `HasIndex(p => p.Name).IsUnique()` | Crea un índice único (no permite duplicados) |
| `HasColumnType("decimal(18,2)")` | Tipo exacto para dinero |
| `HasMaxLength(255)` | Límite de caracteres |
| `HasColumnName("created_at")` | Convención de nombres de columnas |

### 8.4 Repositorios - implementaciones con EF Core

Los repositorios implementan las interfaces de la aplicación usando `ApplicationDbContext`.

#### Repositories/Products/ProductRepository.cs

```csharp
using Example.Application.Common.Interfaces.Repositories.Products;
using Example.Domain.Entities.Products;
using Microsoft.EntityFrameworkCore;

namespace Example.Infrastructure.Persistence.Repositories.Products;

public class ProductRepository : IProductRepository
{
    private readonly ApplicationDbContext _context;

    public ProductRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Product>> GetAllAsync()
    {
        return await _context.Products
            .Where(p => p.DeletedAt == null)   // excluye soft-deleted
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<Product?> GetByIdAsync(Guid id)
    {
        return await _context.Products
            .FirstOrDefaultAsync(p => p.Id == id && p.DeletedAt == null);
    }

    public async Task<Product> CreateAsync(Product product)
    {
        await _context.Products.AddAsync(product);
        await _context.SaveChangesAsync();
        return product;
    }

    public async Task<Product> UpdateAsync(Product product)
    {
        _context.Products.Update(product);
        await _context.SaveChangesAsync();
        return product;
    }

    public async Task SoftDeleteAsync(Guid id, Guid deletedByUserId, string deletedByName)
    {
        var product = await _context.Products.FindAsync(id);
        if (product is not null)
        {
            product.DeletedAt = DateTime.UtcNow;
            product.DeletedByUserId = deletedByUserId;
            product.DeletedByName = deletedByName;
            _context.Products.Update(product);
            await _context.SaveChangesAsync();
        }
    }
}
```

**Puntos clave:**

- `_context` se inyecta por constructor (DI).
- `SaveChangesAsync()` ejecuta las operaciones pendientes contra la BD. Sin esto, nada se guarda.
- Agregamos siempre el filtro `p.DeletedAt == null` para no devolver soft-deleted. (Alternativa más robusta: un `HasQueryFilter` global en la configuración, que aplica el filtro a TODAS las queries automáticamente. Lo mostramos en el UserRepository.)

#### Repositories/Users/UserRepository.cs (con soft delete global)

```csharp
using Example.Application.Common.Interfaces.Repositories.Users;
using Example.Domain.Entities.Users;
using Microsoft.EntityFrameworkCore;

namespace Example.Infrastructure.Persistence.Repositories.Users;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdAsync(Guid id)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Id == id && u.DeletedAt == null);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Email == email && u.DeletedAt == null);
    }

    public async Task<User> CreateAsync(User user)
    {
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<User> UpdateAsync(User user)
    {
        _context.Users.Update(user);
        await _context.SaveChangesAsync();
        return user;
    }

    // Restaurar un usuario soft-deleted: IgnoreQueryFilters() salta los filtros globales
    public async Task<User?> RestoreAsync(Guid id)
    {
        var user = await _context.Users.IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == id);
        if (user is not null)
        {
            user.DeletedAt = null;
            user.DeletedByUserId = null;
            user.DeletedByName = null;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }
        return user;
    }
}
```

### 8.5 Services - PasswordService y TokenService

#### Services/PasswordService.cs (BCrypt)

```csharp
using Example.Application.Common.Interfaces.Services;

namespace Example.Infrastructure.Services;

public class PasswordService : IPasswordService
{
    public string HashPassword(string password)
        => BCrypt.Net.BCrypt.HashPassword(password);

    public bool VerifyPassword(string password, string hash)
        => BCrypt.Net.BCrypt.Verify(password, hash);
}
```

> **BCrypt** genera un hash con *salt* automático, lento a propósito (cuesta recursos calcularlo), lo que dificulta ataques de fuerza bruta. Nunca inventes tu propio hashing: usa una librería probada.

#### Services/TokenService.cs (JWT)

Este service genera y valida los tokens JWT. La configuración (secretos, expiración, issuer, audience) viene del `appsettings.json`.

```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Example.Application.Common.Interfaces.Services;
using Example.Domain.Enums;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;

namespace Example.Infrastructure.Services;

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
        _secret = configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("JWT Secret is not configured");
        _refreshSecret = configuration["Jwt:RefreshSecret"]
            ?? throw new InvalidOperationException("JWT RefreshSecret is not configured");
        _issuer = configuration["Jwt:Issuer"] ?? "example-api";
        _audience = configuration["Jwt:Audience"] ?? "example-app";
        _accessTokenExpiry = TimeSpan.Parse(configuration["Jwt:AccessTokenExpiry"] ?? "00:15:00");
        _refreshTokenExpiry = TimeSpan.Parse(configuration["Jwt:RefreshTokenExpiry"] ?? "7.00:00:00");
    }

    public (string accessToken, string refreshToken) GenerateTokens(Guid userId, string email, UserRole role)
    {
        var accessToken = GenerateAccessToken(userId, email, role);
        var refreshToken = GenerateRefreshToken(userId);
        return (accessToken, refreshToken);
    }

    public ClaimsPrincipal? ValidateAccessToken(string token)
        => ValidateToken(token, _secret);

    public ClaimsPrincipal? ValidateRefreshToken(string token)
        => ValidateToken(token, _refreshSecret);

    private string GenerateAccessToken(Guid userId, string email, UserRole role)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(JwtRegisteredClaimNames.Email, email),
            new(ClaimTypes.Role, role.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: DateTime.UtcNow.Add(_accessTokenExpiry),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

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
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private ClaimsPrincipal? ValidateToken(string token, string secret)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var tokenHandler = new JwtSecurityTokenHandler();

        try
        {
            var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidIssuer = _issuer,
                ValidAudience = _audience,
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero,
            }, out _);

            return principal;
        }
        catch
        {
            return null;   // token inválido o expirado → null
        }
    }
}
```

**¿Por qué dos tokens (access + refresh)?**

| Token | Duración | Propósito |
|-------|----------|-----------|
| **Access token** | 15 minutos | Autentica cada request. Si lo roban, el daño es limitado (corta duración) |
| **Refresh token** | 7 días | Obtener nuevos access tokens sin re-autenticar. Guardado como sesión en la BD |

**¿Por qué rotamos el refresh token?** Cada vez que refrescamos, generamos un token nuevo y eliminamos el viejo de la BD. Así, si un token es robado y reutilizado, se detecta al validar y se pueden invalidar todas las sesiones.

### 8.6 Adapters - almacenamiento en la nube (opcional)

A veces la tienda necesita guardar imágenes de productos. Para eso definimos una interfaz en `Application`:

```csharp
// Application/Common/Interfaces/Services/IFileStorageService.cs
namespace Example.Application.Common.Interfaces.Services;

public interface IFileStorageService
{
    Task<string> UploadImageAsync(Stream fileStream, string fileName, CancellationToken ct = default);
}
```

Y la implementamos en `Infrastructure/Adapters/Cloud` usando un bucket S3 compatible (por ejemplo Cloudflare R2), con el patrón de **Options** para la configuración:

```csharp
// Infrastructure/Adapters/Cloud/R2StorageService.cs
using Example.Application.Common.Interfaces.Services;
using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;

namespace Example.Infrastructure.Adapters.Cloud;

public class R2StorageService : IFileStorageService
{
    private readonly IMinioClient _minioClient;
    private readonly R2Options _options;

    public R2StorageService(IOptions<R2Options> options)
    {
        _options = options.Value;

        var endpoint = _options.Endpoint;
        if (Uri.TryCreate(endpoint, UriKind.Absolute, out var uri))
            endpoint = uri.Host;

        _minioClient = new MinioClient()
            .WithEndpoint(endpoint)
            .WithCredentials(_options.AccessKeyId, _options.SecretAccessKey)
            .WithRegion("auto")
            .WithSSL()
            .Build();
    }

    public async Task<string> UploadImageAsync(Stream fileStream, string fileName, CancellationToken ct = default)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        var contentType = GetContentType(ext);
        var key = $"products/{Guid.NewGuid():N}{ext}";

        var putArgs = new PutObjectArgs()
            .WithBucket(_options.BucketName)
            .WithObject(key)
            .WithStreamData(fileStream)
            .WithObjectSize(fileStream.Length)
            .WithContentType(contentType);

        await _minioClient.PutObjectAsync(putArgs, ct);

        return $"{_options.PublicUrl.TrimEnd('/')}/{key}";
    }

    private static string GetContentType(string extension) => extension switch
    {
        ".jpg" or ".jpeg" => "image/jpeg",
        ".png" => "image/png",
        ".gif" => "image/gif",
        ".webp" => "image/webp",
        _ => "application/octet-stream",
    };
}

// Clase de configuración (Options pattern) → se vincula a la sección "R2" del appsettings
public class R2Options
{
    public const string SectionName = "R2";
    public string Endpoint { get; set; } = string.Empty;
    public string AccessKeyId { get; set; } = string.Empty;
    public string SecretAccessKey { get; set; } = string.Empty;
    public string BucketName { get; set; } = string.Empty;
    public string PublicUrl { get; set; } = string.Empty;
}
```

**Patrón de Options**: definís una clase plana (`R2Options`), la registrás en DI con `.Configure<R2Options>(config.GetSection("R2"))`, y EF/la clase la recibe via `IOptions<R2Options>`. Es la forma tipada y testeable de leer configuración.

### 8.7 Resumen de la capa de infraestructura

La capa de infraestructura tiene todo implementado. Ejecutá:

```bash
dotnet build
```

---

## 9. Capa de Presentación - la API

Esta es la capa que **habla con el exterior** (clientes web, apps móviles, Postman). Recibe requests HTTP, llama a la capa de aplicación y devuelve JSON.

Acá aplicamos el patrón de **extension methods**: en vez de llenar `Program.cs` con 200 líneas de registro de servicios, lo dividimos en `Extensions/*.cs`. Eso mantiene el punto de entrada limpio y cada pieza de configuración en su lugar.

### 9.1 Paquetes NuGet de la API

```bash
dotnet add src/Example.Api package FluentValidation.AspNetCore --version 11.4.*
dotnet add src/Example.Api package Microsoft.AspNetCore.Authentication.JwtBearer --version 10.0.*
dotnet add src/Example.Api package Microsoft.AspNetCore.OpenApi --version 10.0.*
dotnet add src/Example.Api package Microsoft.EntityFrameworkCore.Design --version 10.0.*
```

> `Microsoft.EntityFrameworkCore.Design` es necesario para poder ejecutar comandos de migración de EF Core desde esta capa.

### 9.2 Program.cs - el punto de entrada minimalista

```csharp
using System.Text.Json.Serialization;
using Example.Api.Extensions;
using Example.Api.Helpers;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers(options =>
    {
        // Configuración global de controllers (podés agregar filtros acá)
    })
    .AddJsonOptions(options =>
    {
        // Los enums se serializan como string ("User", "Admin"), no como número
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    })
    .ConfigureApiBehaviorOptions(options =>
    {
        // Cuando el modelo del request es inválido, devolver nuestro formato de error
        options.InvalidModelStateResponseFactory = context =>
            new ObjectResult(ErrorResponse.Build(StatusCodes.Status400BadRequest, "VALIDATION_ERROR"))
            {
                StatusCode = StatusCodes.Status400BadRequest
            };
    });

builder.Services.AddOpenApi();
builder.Services.AddHttpContextAccessor();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// Registro de servicios organizado en extensiones
builder.Services.AddRateLimiterConfiguration();
builder.Services.AddCorsConfiguration(builder.Configuration);
builder.Services.AddDatabaseConfiguration(builder.Configuration);
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddAuthenticationConfiguration(builder.Configuration);

var app = builder.Build();

await app.ConfigureMiddlewareAsync();

app.Run();
```

**¿Qué hace cada parte?**

1. `var builder = WebApplication.CreateBuilder(args);` → crea el host con la configuración.
2. `builder.Services.AddControllers()` → registra los controllers.
3. `AddJsonOptions` → configura cómo se serializa el JSON (los enums como string).
4. `ConfigureApiBehaviorOptions` → define qué pasa cuando el request no valida el modelo.
5. `AddHttpContextAccessor()` → permite acceder al contexto HTTP desde helpers (como `CookieHelper`).
6. `AddValidatorsFromAssemblyContaining<Program>()` → registra automáticamente todos los validadores de FluentValidation de este ensamblado.
7. Las extensiones (`AddRateLimiterConfiguration`, etc.) → registran los servicios de forma modular.

> `Program.cs` queda **corto**. Toda la configuración vive en archivos de extensión. Si querés saber cómo se configura la base de datos, abrís `DatabaseExtensions.cs`. Cada cosa en su lugar.

### 9.3 Extensions/DatabaseExtensions.cs - configurar la BD

```csharp
using Example.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Example.Api.Extensions;

public static class DatabaseExtensions
{
    public static IServiceCollection AddDatabaseConfiguration(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DefaultConnection is not configured");

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(connectionString, b => b.MigrationsAssembly("Example.Infrastructure")));

        return services;
    }
}
```

> `MigrationsAssembly("Example.Infrastructure")` → las migraciones se guardan en el proyecto de Infrastructure (no en la API). Así la infraestructura queda autocontenida.

### 9.4 Extensions/AuthenticationExtensions.cs - configurar JWT

```csharp
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace Example.Api.Extensions;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddAuthenticationConfiguration(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtSecret = configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("JWT Secret is not configured");
        var jwtIssuer = configuration["Jwt:Issuer"] ?? "example-api";
        var jwtAudience = configuration["Jwt:Audience"] ?? "example-app";

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                    ValidIssuer = jwtIssuer,
                    ValidAudience = jwtAudience,
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromSeconds(30),
                };

                options.Events = new JwtBearerEvents
                {
                    // Si no viene token en el header Authorization,
                    // buscarlo en la cookie httpOnly "accessToken"
                    OnMessageReceived = context =>
                    {
                        if (string.IsNullOrEmpty(context.Request.Headers.Authorization))
                        {
                            var accessToken = context.Request.Cookies["accessToken"];
                            if (!string.IsNullOrEmpty(accessToken))
                                context.Token = accessToken;
                        }
                        return Task.CompletedTask;
                    }
                };
            });

        return services;
    }
}
```

**¿Por qué validar el token en cookies Y en header?** El header `Authorization: Bearer <token>` es lo común para APIs/móviles. Pero las cookies `httpOnly` protegen a las apps web del robo de tokens por JavaScript (XSS). Al configurar `OnMessageReceived`, aceptamos ambos.

### 9.5 Extensions/CorsExtensions.cs - permitir orígenes

CORS controla qué dominios pueden llamar a tu API desde el navegador.

```csharp
namespace Example.Api.Extensions;

public static class CorsExtensions
{
    public static IServiceCollection AddCorsConfiguration(this IServiceCollection services, IConfiguration configuration)
    {
        var allowedOrigins = configuration.GetSection("Cors:allowedOrigins")
            .Get<string[]>()
            ?? ["http://localhost:3000", "http://localhost:5173"];

        services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                policy.SetIsOriginAllowed(origin =>
                {
                    // Solo orígenes explícitamente permitidos
                    if (allowedOrigins.Contains(origin)) return true;

                    // En desarrollo, permitir loopback y redes locales
                    if (Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                    {
                        return uri.IsLoopback
                            || uri.Host.StartsWith("192.168.")
                            || uri.Host.StartsWith("10.")
                            || uri.Host.StartsWith("172.");
                    }

                    return false;
                })
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();   // necesaria para cookies httpOnly
            });
        });

        return services;
    }
}
```

### 9.6 Extensions/RateLimitExtensions.cs - limitar intentos

Protegemos los endpoints de login/register contra fuerza bruta (muchos intentos seguidos).

```csharp
using Microsoft.AspNetCore.RateLimiting;

namespace Example.Api.Extensions;

public static class RateLimitExtensions
{
    public static IServiceCollection AddRateLimiterConfiguration(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            // Límite para rutas de auth: 10 requests por minuto
            options.AddFixedWindowLimiter("Auth", opt =>
            {
                opt.PermitLimit = 10;
                opt.Window = TimeSpan.FromMinutes(1);
                opt.QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst;
                opt.QueueLimit = 0;
            });
        });

        return services;
    }
}
```

Luego, en el controller, marcamos las rutas sensibles con `[EnableRateLimiting("Auth")]`.

### 9.7 Extensions/DependencyInjectionExtensions.cs - registrar servicios

Este es el archivo central de DI: conecta las **interfaces** con sus **implementaciones**. Si acá no registrás algo, la app se rompe al pedirlo.

```csharp
using Example.Api.Helpers;
using Example.Application.Common.Interfaces.Services;
using Example.Application.Common.Interfaces.Repositories.Products;
using Example.Application.Common.Interfaces.Repositories.Auth;
using Example.Application.Common.Interfaces.Repositories.Users;
using Example.Application.Features.Auth;
using Example.Application.Features.Products;
using Example.Infrastructure.Services;
using Example.Infrastructure.Persistence.Repositories.Products;
using Example.Infrastructure.Persistence.Repositories.Auth;
using Example.Infrastructure.Persistence.Repositories.Users;

namespace Example.Api.Extensions;

public static class DependencyInjectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Helpers
        services.AddScoped<CookieHelper>();

        // Services de aplicación (lógica de negocio)
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IProductService, ProductService>();

        // Services de infraestructura
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IPasswordService, PasswordService>();

        // Repositorios (implementaciones de los contratos de datos)
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IAccountRepository, AccountRepository>();
        services.AddScoped<ISessionRepository, SessionRepository>();

        return services;
    }
}
```

**Lifetimes (ciclo de vida) de los servicios:**

| Lifetime | Para qué | Ejemplo |
|----------|----------|---------|
| `AddScoped` | Una instancia por request HTTP | Repositorios, services (usa el DbContext) |
| `AddSingleton` | Una sola instancia para toda la app | Config, cache |
| `AddTransient` | Una instancia nueva cada vez que se pide | Helpers sin estado |

> Los repositorios y services usan `AddScoped` porque `ApplicationDbContext` es scoped: comparten la misma instancia del contexto durante un request, lo que permite que SaveChanges aplique varias operaciones en una transacción.

### 9.8 Extensions/MiddlewareExtensions.cs - armar el pipeline

Este método construye el **pipeline de HTTP**: el orden en que se ejecuta cada middleware.

```csharp
using System.Text.Json;
using Example.Api.Helpers;
using Example.Api.Middleware;
using Example.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Example.Api.Extensions;

public static class MiddlewareExtensions
{
    public static async Task<WebApplication> ConfigureMiddlewareAsync(this WebApplication app)
    {
        // Aplica migraciones pendientes automáticamente al iniciar (desarrollo)
        using (var scope = app.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await context.Database.MigrateAsync();
        }

        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
        }

        app.UseHttpsRedirection();
        app.UseCors();
        app.UseResponseCaching();

        // Respuestas JSON para códigos de estado sin body (404, etc.)
        app.UseStatusCodePages(async statusCodeContext =>
        {
            var response = statusCodeContext.HttpContext.Response;
            response.ContentType = "application/json";
            var responseObj = ErrorResponse.Build(response.StatusCode);
            await response.WriteAsync(JsonSerializer.Serialize(responseObj, JsonSerializerOptions.Web));
        });

        app.UseMiddleware<ErrorHandlingMiddleware>();

        app.UseAuthentication();
        app.UseAuthorization();

        app.MapControllers();

        app.MapGet("/health", () => "ok");

        return app;
    }
}
```

**El orden del pipeline importa.** `UseAuthentication` debe ir ANTES de `UseAuthorization`, y ambos antes de `MapControllers`. El `ErrorHandlingMiddleware` va temprano para atrapar errores de todo lo que viene después.

### 9.9 Helpers - utilidades reutilizables

#### Helpers/AuthHelper.cs - leer el usuario del token

Extrae el `UserId` y el `Role` del usuario autenticado (que viene en los claims del JWT).

```csharp
using System.Security.Claims;
using Example.Domain.Enums;
using Example.Domain.Exceptions;

namespace Example.Api.Helpers;

public static class AuthHelper
{
    public static Guid? GetCurrentUserId(this HttpContext httpContext)
    {
        var userIdClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return userIdClaim != null && Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    public static UserRole GetCurrentUserRole(this HttpContext httpContext)
    {
        var roleClaim = httpContext.User.FindFirst(ClaimTypes.Role)?.Value
            ?? throw AppExceptions.Unauthorized("User role claim is missing");

        if (!Enum.TryParse<UserRole>(roleClaim, out var role))
            throw AppExceptions.Unauthorized($"Invalid user role: {roleClaim}");

        return role;
    }
}
```

> Es un método de **extensión** (`this HttpContext`): permite llamarlo como `HttpContext.GetCurrentUserId()` en cualquier controller, sin repetir el código de lectura de claims. Elegante, ¿no?

#### Helpers/CookieHelper.cs - manejar cookies

Centraliza la creación/borrado de las cookies httpOnly de autenticación.

```csharp
namespace Example.Api.Helpers;

public class CookieHelper
{
    private readonly IWebHostEnvironment _environment;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CookieHelper(IWebHostEnvironment environment, IHttpContextAccessor httpContextAccessor)
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
            HttpOnly = true,        // JS no puede leerla → protege contra XSS
            Secure = isProduction,  // solo HTTPS en producción
            SameSite = SameSiteMode.Strict,
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

#### Helpers/ErrorResponse.cs - formato de error consistente

```csharp
namespace Example.Api.Helpers;

public static class ErrorResponse
{
    public static object Build(int statusCode, string? code = null) => new
    {
        message = GetMessage(statusCode),
        statusCode,
        code = code ?? GetCode(statusCode)
    };

    private static string GetMessage(int statusCode) => statusCode switch
    {
        400 => "Bad Request",
        401 => "Unauthorized",
        403 => "Forbidden",
        404 => "Not Found",
        409 => "Conflict",
        422 => "Unprocessable Entity",
        429 => "Too Many Requests",
        _ => "Error"
    };

    private static string GetCode(int statusCode) => statusCode switch
    {
        400 => "BAD_REQUEST",
        401 => "UNAUTHORIZED",
        403 => "FORBIDDEN",
        404 => "NOT_FOUND",
        409 => "CONFLICT",
        422 => "UNPROCESSABLE_ENTITY",
        429 => "TOO_MANY_REQUESTS",
        500 => "INTERNAL_SERVER_ERROR",
        _ => "ERROR"
    };
}
```

**Resultado**: TODOS los errores de la API tienen la misma forma:

```json
{
  "message": "Email already registered",
  "statusCode": 409,
  "code": "CONFLICT"
}
```

### 9.10 Middleware/ErrorHandlingMiddleware.cs - manejo central de errores

Este middleware atrapa cualquier excepción que ocurra en la app y la convierte en una respuesta JSON con el código HTTP correcto.

```csharp
using System.Net;
using System.Text.Json;
using Example.Domain.Exceptions;
using Example.Api.Helpers;

namespace Example.Api.Middleware;

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
        catch (Exception ex)
        {
            // El detalle completo (mensaje, stack trace) solo queda en los logs del servidor
            _logger.LogError(ex, "Unhandled exception on {Path}", context.Request.Path);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var statusCode = exception switch
        {
            AppException appEx => appEx.StatusCode,
            _ => (int)HttpStatusCode.InternalServerError
        };

        context.Response.StatusCode = statusCode;

        var responseObj = exception is AppException appException
            ? ErrorResponse.Build(statusCode, appException.Code)
            : ErrorResponse.Build(statusCode);

        return context.Response.WriteAsync(JsonSerializer.Serialize(responseObj, JsonSerializerOptions.Web));
    }
}
```

**Puntos clave:**

- Si la excepción es `AppException` → usa su `StatusCode` y `Code` (errores "controlados" de la tienda).
- Si es cualquier otra excepción → devuelve 500 genérico, y el detalle real (stack trace) queda SOLO en los logs del servidor. Nunca expongas detalles internos al cliente.
- Un solo lugar maneja todos los errores → no repetís try/catch en cada método.

### 9.11 Authorization/RequirePermissionAttribute.cs - control de permisos

Este **atributo** protege endpoints según los permisos definidos en `RolePermissions`.

```csharp
using Example.Application.Common.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Example.Api.Authorization;

/// <summary>
/// Controla acceso a endpoints basado en permisos.
/// Uso: [RequirePermission("products.create")] o [RequirePermission("products.create", "products.update")]
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false)]
public class RequirePermissionAttribute : Attribute, IAuthorizationFilter
{
    private readonly string[] _permissions;

    public RequirePermissionAttribute(params string[] permissions)
    {
        _permissions = permissions;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;

        // Si no está autenticado, que el mecanismo base de autorización lo maneje
        if (!user.Identity?.IsAuthenticated ?? true)
            return;

        var roleClaim = user.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        if (string.IsNullOrEmpty(roleClaim))
        {
            context.Result = new ForbidResult();
            return;
        }

        if (!Enum.TryParse<Example.Domain.Enums.UserRole>(roleClaim, out var role))
        {
            context.Result = new ForbidResult();
            return;
        }

        // Tiene ALGUNO de los permisos pedidos?
        var hasPermission = _permissions.Any(p =>
            RolePermissions.HasPermission(role, p));

        if (!hasPermission)
            context.Result = new ForbidResult();
    }
}
```

**¿Cómo se usa?** En cualquier acción de un controller:

```csharp
[HttpGet]
[RequirePermission("products.read")]    // Cualquier usuario autenticado
public async Task<ActionResult> GetProducts() { ... }

[HttpPost]
[RequirePermission("products.create")]  // Solo Admin
public async Task<ActionResult> CreateProduct([FromBody] CreateProductRequest request) { ... }
```

La combinación de `[Authorize]` (en el controller) + `[RequirePermission(...)]` (por acción) te da un control fino: primero hay que estar autenticado, y después tener el permiso específico.

### 9.12 Controllers

#### Controllers/AuthController.cs

```csharp
using Example.Application.Common.Interfaces.Services;
using Example.Application.Common.Models.Auth;
using Example.Api.Helpers;
using Example.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Example.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly CookieHelper _cookieHelper;

    public AuthController(IAuthService authService, CookieHelper cookieHelper)
    {
        _authService = authService;
        _cookieHelper = cookieHelper;
    }

    [HttpPost("register")]
    [EnableRateLimiting("Auth")]   // protege contra spam de registros
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        var currentUserId = HttpContext.GetCurrentUserId();
        if (currentUserId.HasValue)
            throw new AppException(
                "Already logged in. Please logout before creating a new account.",
                409,
                "ALREADY_LOGGED_IN");

        var result = await _authService.RegisterAsync(request);

        _cookieHelper.SetAuthCookies(result.AccessToken, result.RefreshToken);

        return CreatedAtAction(null, new
        {
            message = result.Message,
            accessToken = result.AccessToken,
            refreshToken = result.RefreshToken
        });
    }

    [HttpPost("login")]
    [EnableRateLimiting("Auth")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var currentUserId = HttpContext.GetCurrentUserId();
        var result = await _authService.LoginAsync(request);

        if (currentUserId.HasValue)
            _cookieHelper.ClearAuthCookies();

        _cookieHelper.SetAuthCookies(result.AccessToken, result.RefreshToken);

        return Ok(new
        {
            message = result.Message,
            accessToken = result.AccessToken,
            refreshToken = result.RefreshToken
        });
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<RefreshResponse>> Refresh([FromBody] RefreshRequest? request = null)
    {
        // Cookie primero (apps web); body permite el flujo donde SameSite bloquea la cookie
        var refreshToken = Request.Cookies["refreshToken"] ?? request?.RefreshToken ?? string.Empty;
        if (string.IsNullOrEmpty(refreshToken))
            throw AppExceptions.BadRequest();

        var result = await _authService.RefreshAsync(refreshToken);
        _cookieHelper.SetAuthCookies(result.AccessToken, result.RefreshToken);

        return Ok(result);
    }

    [HttpPost("logout")]
    public async Task<ActionResult> Logout()
    {
        var refreshToken = Request.Cookies["refreshToken"] ?? string.Empty;
        if (!string.IsNullOrEmpty(refreshToken))
            await _authService.LogoutAsync(refreshToken);

        _cookieHelper.ClearAuthCookies();
        return Ok(new { message = "Logged out successfully" });
    }
}
```

#### Controllers/ProductController.cs (el CRUD)

```csharp
using Example.Api.Authorization;
using Example.Api.Helpers;
using Example.Application.Common.Interfaces.Services;
using Example.Application.Common.Models.Products;
using Example.Domain.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Example.Api.Controllers;

[ApiController]
[Route("api/v1/products")]
[Authorize]   // todos los endpoints de productos requieren autenticación
public class ProductController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductController(IProductService productService)
    {
        _productService = productService;
    }

    // GET /api/v1/products - cualquier usuario autenticado
    [HttpGet]
    [RequirePermission("products.read")]
    public async Task<ActionResult<List<ProductDto>>> GetAll()
    {
        var products = await _productService.GetAllAsync();
        return Ok(products);
    }

    // GET /api/v1/products/{id}
    [HttpGet("{id:guid}")]
    [RequirePermission("products.read")]
    public async Task<ActionResult<ProductDto>> GetById(Guid id)
    {
        var product = await _productService.GetByIdAsync(id);
        if (product is null)
            throw AppExceptions.NotFound("Product not found");

        return Ok(product);
    }

    // POST /api/v1/products - solo Admin
    [HttpPost]
    [RequirePermission("products.create")]
    public async Task<ActionResult<ProductDto>> Create([FromBody] CreateProductRequest request)
    {
        var userId = HttpContext.GetCurrentUserId();
        if (userId is null)
            throw AppExceptions.Unauthorized();

        var result = await _productService.CreateAsync(userId.Value, request);
        return Created($"/api/v1/products/{result.Id}", result);
    }

    // PUT /api/v1/products/{id} - solo Admin
    [HttpPut("{id:guid}")]
    [RequirePermission("products.update")]
    public async Task<ActionResult<ProductDto>> Update(Guid id, [FromBody] UpdateProductRequest request)
    {
        var userId = HttpContext.GetCurrentUserId();
        if (userId is null)
            throw AppExceptions.Unauthorized();

        var result = await _productService.UpdateAsync(userId.Value, id, request);
        return Ok(result);
    }

    // DELETE /api/v1/products/{id} - solo Admin
    [HttpDelete("{id:guid}")]
    [RequirePermission("products.delete")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var userId = HttpContext.GetCurrentUserId();
        if (userId is null)
            throw AppExceptions.Unauthorized();

        await _productService.DeleteAsync(userId.Value, id);
        return Ok(new { message = "Product deleted successfully" });
    }
}
```

**Análisis del controller:**

- `[ApiController]` → habilita el comportamiento automático: binding de parámetros, validación de modelo, etc.
- `[Route("api/v1/products")]` → prefijo de ruta para todas las acciones.
- `[Authorize]` en el controller → TODOS los endpoints requieren estar logueado.
- `[RequirePermission("products.create")]` por acción → solo usuarios con ese permiso (Admin).
- `HttpContext.GetCurrentUserId()` → extrae el usuario del token (gracias al helper de extensión).
- `Guid id` en la ruta + `{id:guid}` → le dice al binder que es un GUID; si no es válido, devuelve 400.

### 9.13 appsettings.json - configuración

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=example_db;Username=postgres;Password=postgres"
  },
  "Jwt": {
    "Secret": "your-super-secret-jwt-key-min-32-chars-long",
    "RefreshSecret": "another-super-secret-refresh-key-min-32-chars",
    "AccessTokenExpiry": "00:15:00",
    "RefreshTokenExpiry": "7.00:00:00",
    "Issuer": "example-api",
    "Audience": "example-app"
  },
  "Cors": {
    "allowedOrigins": [
      "http://localhost:3000",
      "http://localhost:5173"
    ]
  },
  "R2": {
    "Endpoint": "https://...",
    "AccessKeyId": "...",
    "SecretAccessKey": "...",
    "BucketName": "example-bucket",
    "PublicUrl": "https://..."
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

> **Seguridad importante**: el archivo `appsettings.json` con secretos reales NO debe estar en Git. Usá variables de entorno o un archivo `.env` para producción, y dejá valores de ejemplo en el repo. El sistema de configuración de .NET lee las variables de entorno automáticamente (por ejemplo `Jwt__Secret`).

### 9.14 Resumen de la capa de presentación

Con esto la API ya está completa. Ejecutá para verificar que todo compile:

```bash
dotnet build
```

---

## 10. Entity Framework Core y migraciones

### 10.1 ¿Qué es EF Core?

**Entity Framework Core** es el ORM (Object-Relational Mapper) oficial de .NET. Te permite trabajar con la base de datos **usando objetos C#** en vez de escribir SQL a mano. EF Core traduce tus LINQ queries a SQL.

**Analogía con otras herramientas:** si venís de Node, EF Core es como **Prisma** con un repositorio por entidad. Es el puente entre tus clases (`Product`) y las tablas de la BD (`Products`).

### 10.2 Flujo de trabajo

```
1. Definir entidades (clases C# en Domain)
        ↓
2. Configurar el mapeo (Fluent API en Infrastructure)
        ↓
3. Crear el DbContext (ApplicationDbContext)
        ↓
4. Crear una migración → dotnet ef migrations add Nombre
        ↓
5. Aplicar la migración → dotnet ef database update
        ↓
6. Usar el DbContext en los repositorios
```

### 10.3 Instalar y verificar la herramienta EF

```bash
# Instalar globalmente
dotnet tool install --global dotnet-ef

# Verificar
dotnet ef --version

# Debe poder resolver la herramienta. Si no, agregá al PATH:
export PATH="$PATH:$HOME/.dotnet/tools"
```

### 10.4 Crear la primera migración

Ejecutamos el comando desde el proyecto de la **API** (que tiene la referencia al paquete Design), indicando el proyecto de **Infrastructure** como destino de las migraciones:

```bash
dotnet ef migrations add InitialCreate \
  --project src/Example.Infrastructure \
  --startup-project src/Example.Api
```

- `--project` → dónde se guardan las migraciones (Infrastructure).
- `--startup-project` → proyecto que arranca la app (Api), que tiene la configuración de la BD.

**¿Qué genera?**

```
src/Example.Infrastructure/Migrations/
├── 20260907000000_InitialCreate.cs       # El código Up() y Down()
├── 20260907000000_InitialCreate.Designer.cs
└── ApplicationDbContextModelSnapshot.cs  # "foto" del estado actual del modelo
```

El archivo `20260907000000_InitialCreate.cs` contiene dos métodos:
- `Up()` → qué aplicar a la BD (crear tablas).
- `Down()` → cómo deshacerlo (dropear tablas).

Un extracto de lo que genera para la tabla `Products`:

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.CreateTable(
        name: "Products",
        columns: table => new
        {
            id = table.Column<Guid>(type: "uuid", nullable: false),
            name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
            price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
            stock = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
            created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
            // ... etc
        },
        constraints: table =>
        {
            table.PrimaryKey("PK_Products", x => x.id);
        });
}
```

> **NO edites las migraciones a mano.** Son el historial de cambios de la BD. Si necesitás cambiar el modelo, editás las entidades/configuraciones y creás una migración NUEVA.

### 10.5 Aplicar la migración a la base de datos

```bash
dotnet ef database update \
  --project src/Example.Infrastructure \
  --startup-project src/Example.Api
```

Esto crea las tablas en PostgreSQL. En nuestro `MiddlewareExtensions` también aplicamos `MigrateAsync()` al iniciar, así que en desarrollo las tablas se crean solas al correr la app.

### 10.6 Comandos de EF Core (referencia)

```bash
# Crear una migración
dotnet ef migrations add AddStockToProduct --project src/Example.Infrastructure --startup-project src/Example.Api

# Aplicar todas las migraciones pendientes
dotnet ef database update --project src/Example.Infrastructure --startup-project src/Example.Api

# Aplicar hasta una migración específica
dotnet ef database update NombreMigracion --project src/Example.Infrastructure --startup-project src/Example.Api

# Revertir la última migración (no aplicada)
dotnet ef migrations remove --project src/Example.Infrastructure --startup-project src/Example.Api

# Listar migraciones
dotnet ef migrations list --project src/Example.Infrastructure --startup-project src/Example.Api

# Generar script SQL
dotnet ef migrations script -o migracion.sql --project src/Example.Infrastructure --startup-project src/Example.Api
```

### 10.7 Soft delete con EF Core

Nuestra tienda usa **soft delete**: en vez de `DELETE`, se marca con `DeletedAt`. Así:

1. Nunca perdés datos (se puede auditar y restaurar).
2. El usuario "deleted" sigue en la BD pero se oculta.

Para productos lo hicimos filtrando manualmente en el repositorio:

```csharp
return await _context.Products
    .Where(p => p.DeletedAt == null)   // filtra lo borrado
    .ToListAsync();
```

Una alternativa más robusta es usar un **query filter global** en la configuración de la entidad, que aplica el filtro a TODAS las queries sin tener que escribirlo en cada repositorio:

```csharp
// En ProductConfiguration.cs
builder.HasQueryFilter(p => p.DeletedAt == null);
```

Y si alguna vez necesitás traer también lo borrado (por ejemplo en el panel de admin para restaurar), usás `IgnoreQueryFilters()`:

```csharp
var all = await _context.Products.IgnoreQueryFilters().ToListAsync();
```

### 10.8 Crear la base de datos PostgreSQL

```bash
# Iniciar PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Crear la base de datos y el usuario
sudo -u postgres psql -c "CREATE DATABASE example_db;"
sudo -u postgres psql -c "CREATE USER example_user WITH PASSWORD 'example123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE example_db TO example_user;"
```

Y en `appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Database=example_db;Username=example_user;Password=example123"
}
```

---

## 11. Autenticación y autorización

Ya la implementamos en el código. Acá un resumen conceptual de cómo se conectan las piezas.

### 11.1 Los dos pasos: autenticación y autorización

- **Autenticación** = ¿quién sos? (verificamos el token JWT). `UseAuthentication()`.
- **Autorización** = ¿qué podés hacer? (chequeamos roles/permisos). `UseAuthorization()` + `[RequirePermission]`.

### 11.2 El ciclo completo

```
1) POST /login con credenciales
        ↓
2) AuthService verifica password (BCrypt)
        ↓
3) TokenService genera accessToken (15 min) + refreshToken (7 días)
        ↓
4) Se guarda una Session (refreshToken) en la BD
        ↓
5) Se setean cookies httpOnly (accessToken + refreshToken)
        ↓
6) El cliente llama a /api/v1/products con Authorization: Bearer <accessToken>
        ↓
7) AuthenticationExtensions valida el token (firma, expiración, issuer, audience)
        ↓
8) RequirePermission("products.read") chequea que el rol tenga el permiso
        ↓
9) ProductService hace el caso de uso → repositorio → BD
```

### 11.3 Claims: qué trae el token

Cada JWT que generamos contiene **claims** (datos del usuario):

```csharp
new Claim(ClaimTypes.NameIdentifier, userId.ToString())  // el Id del usuario
new Claim(JwtRegisteredClaimNames.Email, email)          // el email
new Claim(ClaimTypes.Role, role.ToString())              // User o Admin
new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())  // id único del token
```

En el controller, los leemos con `HttpContext.GetCurrentUserId()` (que internamente usa `ClaimTypes.NameIdentifier`).

### 11.4 Por qué separar roles de permisos

En vez de preguntar "¿es Admin?", el código pregunta "¿tiene permiso `products.create`?". Esto permite:

- Dar a un rol varios permisos sin reescribir código.
- Si mañana aparece un rol `Manager` que puede crear pero no borrar productos, solo sumás su entrada en `RolePermissions` y reutilizás `"products.create"`.
- Los permisos son legibles y descriptivos (`users.deactivate`, `products.delete`).

---

## 12. Validación de datos

Además de las validaciones automáticas de `[ApiController]` (campos requeridos, tipos), usamos **FluentValidation** para validaciones más ricas de negocio.

### 12.1 Crear un validador

Un validador es una clase que extiende `AbstractValidator<T>` y define las reglas para un DTO:

```csharp
using FluentValidation;
using Example.Application.Common.Models.Products;

namespace Example.Api.Validators;

public class CreateProductRequestValidator : AbstractValidator<CreateProductRequest>
{
    public CreateProductRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(255).WithMessage("Name cannot exceed 255 characters");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Price must be greater than 0");

        RuleFor(x => x.Stock)
            .GreaterThanOrEqualTo(0).WithMessage("Stock cannot be negative");
    }
}
```

### 12.2 Cómo se registra y usa

En `Program.cs` registramos TODOS los validadores del ensamblado de una sola vez:

```csharp
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
```

Con `[ApiController]`, FluentValidation se integra automáticamente: cuando el request llega al controller, se valida y, si falla, se devuelve un 400/422 con el formato de error definido en `Program.cs` (`InvalidModelStateResponseFactory`).

**Beneficio clave**: las validaciones de *forma* (¿viene vacío? ¿es muy largo?) viven en validadores separados, mientras que las validaciones de *negocio* (¿ya existe? ¿tiene stock?) viven en los services. Cada una en su lugar.

---

## 13. Manejo centralizado de errores

Ya lo vimos implementado. Resumen de la estrategia:

1. La **capa de aplicación** lanza `AppException` (con statusCode y code) cuando hay un error de negocio.
2. El **ErrorHandlingMiddleware** atrapa cualquiera de esas excepciones y arma una respuesta JSON única.
3. `ErrorResponse.Build()` garantiza el mismo formato para todos los errores.

**Ejemplos de errores de la tienda y sus respuestas:**

**404 - Producto no existe** (lanzado en `ProductService`):
```json
{ "message": "Product not found", "statusCode": 404, "code": "NOT_FOUND" }
```

**409 - Email ya registrado**:
```json
{ "message": "Email already registered", "statusCode": 409, "code": "CONFLICT" }
```

**401 - Credenciales inválidas**:
```json
{ "message": "Invalid credentials", "statusCode": 401, "code": "UNAUTHORIZED" }
```

**403 - Sin permiso** (comúnmente devuelto por `RequirePermission`):
```json
{ "message": "Forbidden", "statusCode": 403, "code": "FORBIDDEN" }
```

---

## 14. Endpoints de la tienda

### 14.1 Autenticación

| Endpoint | Método | Descripción | Auth |
|----------|--------|-------------|------|
| `/api/v1/auth/register` | POST | Crear usuario (cliente) | No |
| `/api/v1/auth/login` | POST | Iniciar sesión | No |
| `/api/v1/auth/logout` | POST | Cerrar sesión | No |
| `/api/v1/auth/refresh` | POST | Renovar tokens | No (usa refresh token) |

### 14.2 Productos (CRUD)

| Endpoint | Método | Descripción | Permiso |
|----------|--------|-------------|---------|
| `/api/v1/products` | GET | Listar productos | `products.read` |
| `/api/v1/products/{id}` | GET | Ver un producto | `products.read` |
| `/api/v1/products` | POST | Crear producto | `products.create` (Admin) |
| `/api/v1/products/{id}` | PUT | Actualizar producto | `products.update` (Admin) |
| `/api/v1/products/{id}` | DELETE | Eliminar producto (soft) | `products.delete` (Admin) |

### 14.3 Ejemplos de request/response

**Registro de usuario**
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "Ana Pérez",
  "email": "ana@example.com",
  "password": "superSecret123"
}
```

```json
{
  "message": "User created successfully",
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi..."
}
```

**Login**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "ana@example.com",
  "password": "superSecret123"
}
```

**Crear producto (Admin)**
```http
POST /api/v1/products
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "Notebook Gamer X",
  "description": "Procesador Intel i7, 16GB RAM, GPU RTX",
  "price": 1299.99,
  "stock": 10
}
```

**Listar productos**
```http
GET /api/v1/products
Authorization: Bearer <accessToken>
```

**Respuesta del CRUD:**
```json
[
  {
    "id": "3f2e6b8a-...",
    "name": "Notebook Gamer X",
    "description": "Procesador Intel i7, 16GB RAM, GPU RTX",
    "price": 1299.99,
    "stock": 10,
    "isActive": true,
    "image": null,
    "createdAt": "2026-09-07T10:00:00Z",
    "updatedAt": "2026-09-07T10:00:00Z"
  }
]
```

---

## 15. Comandos útiles y flujo de trabajo

### 15.1 Correr la API en desarrollo

```bash
# Desde la raíz, apuntando al proyecto Api
dotnet watch run --project src/Example.Api
```

`dotnet watch run` recompila y reinicia automáticamente ante cambios (hot reload).

### 15.2 Build y publicación

```bash
# Compilar sin ejecutar
dotnet build

# Publicar para producción
dotnet publish -c Release -o ./publish

# Ejecutar la app publicada
dotnet ./publish/Example.Api.dll
```

### 15.3 Flujo de trabajo diario (resumen)

```bash
# 1. Modificás el código (una capa a la vez)
# 2. Verificás que compila
dotnet build

# 3. Si cambiaste el modelo de datos, creás y aplicás migración
dotnet ef migrations add NombreMigration --project src/Example.Infrastructure --startup-project src/Example.Api
dotnet ef database update --project src/Example.Infrastructure --startup-project src/Example.Api

# 4. Corrés la app
dotnet watch run --project src/Example.Api
```

### 15.4 Herramientas de diagnóstico

```bash
# Ver procesos en un puerto
sudo lsof -i :5000

# Logs de PostgreSQL
sudo journalctl -u postgresql -f

# Consultar la BD
sudo -u postgres psql -c "SELECT * FROM \"Products\";" example_db

# Listar SDKs y runtimes instalados
dotnet --list-sdks
dotnet --list-runtimes
dotnet --info

# Ver templates disponibles
dotnet new list
```

---

## 16. Resumen de patrones

### 16.1 Patrones implementados en la tienda

| Patrón | Dónde está en el código |
|--------|-------------------------|
| **Clean Architecture** | Separación en Domain / Application / Infrastructure / Api con dependencia hacia adentro |
| **Dependency Inversion** | Los services dependen de interfaces (`IProductRepository`), no de implementaciones |
| **Repository Pattern** | Abstracción del acceso a datos con interfaces en Application e implementaciones en Infrastructure |
| **Dependency Injection** | Registro en `DependencyInjectionExtensions` (AddScoped/AddSingleton) |
| **Fluent API** | Configuración de EF Core con `IEntityTypeConfiguration<T>` |
| **Soft Delete** | `DeletedAt` + filtros; datos nunca se borran físicamente |
| **JWT Authentication** | Access + refresh tokens, cookies httpOnly |
| **Token Rotation** | Cada refresh genera tokens nuevos y elimina la sesión vieja |
| **RBAC (Role-Based Access Control)** | `RolePermissions` + `[RequirePermission]` |
| **Error Handling centralizado** | `AppException` + `ErrorHandlingMiddleware` + `ErrorResponse` |
| **DTO + mapping** | `record` DTOs en Application + extensiones de mapping |
| **Extension methods de DI** | `Extensions/*.cs` para tener `Program.cs` limpio |
| **Options pattern** | Clase plana para config tipada (`R2Options`) |

### 16.2 El flujo completo de una request, resumido

```
HTTP Request (POST /api/v1/products)
        ↓
[ErrorHandlingMiddleware]       ← si algo falla acá lo transforma en JSON
        ↓
[RateLimiter]                   ← "Auth" si es login/register
        ↓
[Authentication]                ← valida el JWT (cookies o header)
        ↓
[Authorization / RequirePermission]  ← chequea que el rol tenga products.create
        ↓
[ProductController.Create]      ← lee userId, valida el modelo, llama al service
        ↓
[ProductService.CreateAsync]    ← reglas de negocio (caso de uso)
        ↓
[IProductRepository.ProductRepository]  ← habla con EF Core
        ↓
[PostgreSQL]                    ← ejecuta el INSERT
        ↓
[vuelta]  → mapea Product a DTO → responde JSON 201
```

### 16.3 Mapa de correspondencia Fastify → ASP.NET Core (si venís de Node)

| Fastify / Node | ASP.NET Core (este manual) |
|----------------|----------------------------|
| Fastify framework | ASP.NET Core Controllers |
| Prisma ORM | Entity Framework Core |
| bcrypt | BCrypt.Net-Next (`PasswordService`) |
| jsonwebtoken | System.IdentityModel.Tokens.Jwt (`TokenService`) |
| Zod | FluentValidation |
| pino | ILogger (built-in) |
| `authGuard` / preHandler | `[Authorize]` + `[RequirePermission]` |
| `AppError` | `AppException` + middleware |
| Routes + controllers | Controllers con atributos |
| DTOs | `record` classes |
| `findByEmail()` | `_userRepository.GetByEmailAsync()` |
| Prisma schema | Fluent API configurations |
| S3 / Cloudflare R2 | `IFileStorageService` + `R2StorageService` |

---

> **Siguientes pasos sugeridos** para profundizar:
> 1. Agregar **verificación de email** (código en `Verification` + servicio de email).
> 2. Agregar **bloqueo por intentos fallidos** (ya tenés `FailedLoginAttempts` y `LockoutEnd` en `User`).
> 3. Agregar **imágenes de productos** con `IFileStorageService`.
> 4. Escribir **tests unitarios** para `ProductService` (mockeando `IProductRepository`) y tests de integración para los controllers.
> 5. Agregar **rate limiting** también a otras rutas sensibles.
>
> Este manual cubre .NET 10 (LTS) sobre Debian 13 (Trixie). Pará instalación de otras versiones: https://learn.microsoft.com/en-us/dotnet/core/install/linux-debian

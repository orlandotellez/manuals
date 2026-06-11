# Cursinet Backend — Manual Técnico Completo

Manual completo de la API backend de **Cursinet**, construida con **.NET 10**, **Clean Architecture** (5 capas), **Entity Framework Core 10**, **PostgreSQL**, **JWT + RBAC**, y **Serilog**.

Cubre instalación, arquitectura completa, todas las entidades (32), todos los endpoints (10+ controladores), sistema de autenticación de 3 factores (JWT, API Key, Session), y guía de desarrollo.

---

## Índice

1. [Stack Tecnológico](#1-stack-tecnológico)
2. [Instalación de .NET 10 en Debian 13](#2-instalación-de-net-10-en-debian-13)
3. [Estructura del Proyecto Backend](#3-estructura-del-proyecto-backend)
4. [Domain Layer](#4-domain-layer)
   - 4.1 [Entidades (32)](#41-entidades)
   - 4.2 [Enumeraciones (6)](#42-enumeraciones)
   - 4.3 [Value Objects](#43-value-objects)
   - 4.4 [Excepciones](#44-excepciones)
5. [Application Layer](#5-application-layer)
   - 5.1 [Interfaces de Servicios (13)](#51-interfaces-de-servicios)
   - 5.2 [Interfaces de Repositorios (13)](#52-interfaces-de-repositorios)
   - 5.3 [Servicios de Aplicación (4)](#53-servicios-de-aplicación)
   - 5.4 [DTOs (30+)](#54-dtos)
   - 5.5 [Mapping](#55-mapping)
   - 5.6 [Validación](#56-validación)
6. [Infrastructure Layer](#6-infrastructure-layer)
   - 6.1 [DbContext (6 DbSets)](#61-dbcontext)
   - 6.2 [Configuraciones EF Core (31)](#62-configuraciones-ef-core)
   - 6.3 [Repositorios (13)](#63-repositorios)
   - 6.4 [Servicios de Infraestructura (5)](#64-servicios-de-infraestructura)
   - 6.5 [Migrations](#65-migrations)
7. [API Layer](#7-api-layer)
   - 7.1 [Program.cs — Punto de Entrada](#71-programcs)
   - 7.2 [Controladores (10)](#72-controladores)
   - 7.3 [Middleware (2)](#73-middleware)
   - 7.4 [Filtros y Helpers](#74-filtros-y-helpers)
   - 7.5 [DTOs de API (15+)](#75-dtos-de-api)
8. [Autenticación y Autorización](#8-autenticación-y-autorización)
   - 8.1 [JWT (Access + Refresh)](#81-jwt)
   - 8.2 [API Key Authentication](#82-api-key)
   - 8.3 [Session Authentication](#83-session-auth)
   - 8.4 [RBAC — Role-Based Access Control](#84-rbac)
   - 8.5 [AuthorizeAttribute Personalizado](#85-authorize-attribute)
9. [API Reference Completa](#9-api-reference-completa)
   - 9.1 [Auth](#91-auth)
   - 9.2 [Admin / Management](#92-admin)
   - 9.3 [Entidades del Sistema](#93-entidades-del-sistema)
   - 9.4 [Reportes y Estadísticas](#94-reportes)
   - 9.5 [Archivos y Uploads](#95-archivos)
10. [Entity Framework Core](#10-entity-framework-core)
    - 10.1 [Comandos de Migraciones](#101-comandos)
    - 10.2 [Seed Data](#102-seed)
    - 10.3 [Soft Delete Global Query Filter](#103-soft-delete)
11. [Comandos Útiles](#11-comandos-útiles)
12. [Guía de Desarrollo](#12-guía-de-desarrollo)
13. [Resumen de Patrones y Principios](#13-patrones-y-principios)

---

## 1. Stack Tecnológico

| Componente | Tecnología | Versión |
|------------|-----------|---------|
| **Runtime** | .NET SDK | 10.0 |
| **Framework Web** | ASP.NET Core | 10.0 |
| **ORM** | Entity Framework Core | 10.0 |
| **Base de Datos** | PostgreSQL (Npgsql) | — |
| **Autenticación** | JWT Bearer + API Key + Session | — |
| **Logging** | Serilog | — |
| **Validación** | FluentValidation | — |
| **Testing** | xUnit | — |
| **Mapping** | AutoMapper | — |
| **Cache (opcional)** | Redis (StackExchange.Redis) | — |
| **Encriptación** | BCrypt.Net-Next | — |
| **SO Desarrollo** | Debian 13 (Trixie) / Linux | — |

---

## 2. Instalación de .NET 10 en Debian 13

### 2.1 Requisitos del Sistema

- **Debian 13 (Trixie)** — amd64 o arm64
- 2 GB RAM mínimo, 4 GB recomendado
- 5 GB espacio libre en disco
- PostgreSQL 15+ instalado y corriendo

### 2.2 Instalación por APT (recomendada)

```bash
# Registrar repositorio Microsoft
wget https://packages.microsoft.com/config/debian/13/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
rm packages-microsoft-prod.deb

# Actualizar índices
sudo apt update

# Instalar .NET SDK 10
sudo apt install -y dotnet-sdk-10.0
```

### 2.3 Verificar Instalación

```bash
dotnet --version            # → 10.0.xxx
dotnet --list-sdks          # Lista SDKs instalados
dotnet --list-runtimes      # Lista runtimes instalados
dotnet --info               # Información completa
```

### 2.4 Base de Datos — PostgreSQL

```bash
# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Iniciar servicio
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Crear base de datos
sudo -u postgres psql -c "CREATE DATABASE cursinet;"
sudo -u postgres psql -c "CREATE USER cursinet WITH PASSWORD 'cursinet123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE cursinet TO cursinet;"
```

### 2.5 Variables de Entorno (`.env` o `appsettings.json`)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=cursinet;Username=cursinet;Password=cursinet123"
  },
  "Jwt": {
    "Secret": "super-secret-key-min-32-characters-long!!!",
    "ApiKey": "cursinet-api-key-for-service-auth",
    "AccessTokenExpiry": "00:15:00",
    "RefreshTokenExpiry": "7.00:00:00",
    "SessionExpiry": "7.00:00:00"
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

---

## 3. Estructura del Proyecto Backend

```
backend/
├── Cursinet.sln                              # Solución .NET
│
├── src/
│   ├── Domain/                               # 🧱 Capa de dominio (entidades puras)
│   │   ├── Entities/                         #   32 entidades
│   │   ├── Enums/                            #   6 enumeraciones
│   │   └── Exceptions/                       #   Excepciones personalizadas
│   │
│   ├── Application/                          # ⚙️ Capa de aplicación (casos de uso)
│   │   ├── Common/
│   │   │   ├── Interfaces/                   #   13 interfaces de servicios
│   │   │   └── Mapping/                      #   AutoMapper profiles
│   │   └── Features/
│   │       ├── Admin/                        #   Management de usuarios/roles
│   │       ├── Archivos/                     #   Manejo de archivos
│   │       ├── Clases/                       #   CRUD clases
│   │       ├── Cursos/                       #   CRUD cursos
│   │       ├── Entidades/                    #   Servicios de entidades
│   │       ├── Inscripciones/                #   Inscripciones a cursos
│   │       ├── Lecciones/                    #   CRUD lecciones
│   │       ├── Reportes/                     #   Reportes y estadísticas
│   │       └── Auth/                         #   Auth service
│   │
│   ├── Infrastructure/                       # 🗄️ Capa de infraestructura
│   │   ├── Persistence/
│   │   │   ├── ApplicationDbContext.cs       #   EF Core DbContext
│   │   │   ├── Configurations/               #   31 configuraciones EF
│   │   │   ├── Repositories/                 #   13 repositorios
│   │   │   └── Migrations/                   #   Migraciones EF
│   │   └── Services/                         #   5 servicios de infraestructura
│   │
│   └── Api/                                  # 🌐 Capa de presentación (API)
│       ├── Controllers/                      #   10 controladores
│       ├── DTOs/                             #   15+ DTOs de entrada/salida
│       ├── Middleware/                       #   2 middlewares
│       ├── Helpers/                          #   Helpers de auth
│       ├── Filters/                          #   Filtros personalizados
│       └── Program.cs                        #   Punto de entrada
│
└── tests/
    └── Cursinet.Tests/                       # 🧪 Tests unitarios
```

### Reglas de Dependencia entre Capas

```
Api → Application → Domain
Api → Infrastructure
Infrastructure → Application
Infrastructure → Domain
Application → Domain

Domain → (nada)  ← Capa más pura, cero dependencias externas
```

---

## 4. Domain Layer

La capa de dominio es el **corazón del sistema**. Contiene 32 entidades, 6 enums, y excepciones personalizadas. **NO tiene dependencias de frameworks externos.**

### 4.1 Entidades

El proyecto tiene **32 entidades** organizadas por módulo:

#### 🔐 Autenticación y Usuarios (4)

| Entidad | Tabla | Propósito |
|---------|-------|-----------|
| `User` | `users` | Usuario del sistema (staff, admin) |
| `Account` | `accounts` | Cuentas vinculadas (credentials, Google, etc.) |
| `Session` | `sessions` | Sesiones activas (refresh tokens) |
| `Verification` | `verifications` | Códigos de verificación (email, reset password) |

#### 📚 Catálogo de Cursos (5)

| Entidad | Tabla | Propósito |
|---------|-------|-----------|
| `CategoriaCurso` | `categoria_cursos` | Categorías de cursos (backend, frontend, etc.) |
| `Curso` | `cursos` | Cursos ofrecidos |
| `Requisito` | `requisitos` | Requisitos para un curso |
| `CursoRequisito` | `curso_requisitos` | Relación N:M curso ↔ requisito |
| `PrecioCurso` | `precio_cursos` | Historial de precios de cursos |

#### 👨‍🏫 Clases y Lecciones (6)

| Entidad | Tabla | Propósito |
|---------|-------|-----------|
| `Clase` | `clases` | Clases dentro de un curso |
| `Modulo` | `modulos` | Módulos dentro de una clase |
| `Leccion` | `lecciones` | Lecciones dentro de un módulo |
| `Video` | `videos` | Videos dentro de una lección + transcripciones |
| `Archivo` | `archivos` | Archivos adjuntos a lecciones |
| `Enlace` | `enlaces` | Enlaces relacionados a lecciones |

#### 📝 Participación del Estudiante (3)

| Entidad | Tabla | Propósito |
|---------|-------|-----------|
| `Inscripcion` | `inscripciones` | Inscripciones de usuarios a cursos |
| `Progreso` | `progresos` | Progreso del estudiante en lecciones |
| `Calificacion` | `calificaciones` | Calificaciones del estudiante |

#### 🧪 Evaluaciones (5)

| Entidad | Tabla | Propósito |
|---------|-------|-----------|
| `Evaluacion` | `evaluaciones` | Evaluaciones (exámenes, quizzes, etc.) |
| `Pregunta` | `preguntas` | Preguntas dentro de evaluaciones |
| `Alternativa` | `alternativas` | Alternativas/respuestas de preguntas |
| `Intento` | `intentos` | Intentos de estudiantes en evaluaciones |
| `Respuesta` | `respuestas` | Respuestas del estudiante a preguntas |

#### 💬 Social (3)

| Entidad | Tabla | Propósito |
|---------|-------|-----------|
| `Foro` | `foros` | Foros de discusión por curso |
| `Mensaje` | `mensajes` | Mensajes dentro de foros |
| `Like` | `likes` | Likes en mensajes (reactions) |
| `Anuncio` | `anuncios` | Anuncios del instructor |

#### 🏆 Logros (2)

| Entidad | Tabla | Propósito |
|---------|-------|-----------|
| `Insignia` | `insignias` | Insignias/logros del sistema |
| `InsigniaUsuario` | `insignia_usuarios` | Insignias obtenidas por usuarios |

#### 📊 Reportes (2)

| Entidad | Tabla | Propósito |
|---------|-------|-----------|
| `Auditoria` | `auditorias` | Log de acciones de usuarios |
| `Pago` | `pagos` | Pagos e historial de transacciones |

---

#### User.cs

```csharp
namespace Cursinet.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool EmailVerified { get; set; }
    public string? Phone { get; set; }
    public string? Image { get; set; }
    public string Role { get; set; } = "Staff";  // "Staff" | "Admin"
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }       // Soft delete

    // Navigation Properties
    public ICollection<Account> Accounts { get; set; } = new List<Account>();
    public ICollection<Session> Sessions { get; set; } = new List<Session>();
    public ICollection<Inscripcion> Inscripciones { get; set; } = new List<Inscripcion>();
    public ICollection<Progreso> Progresos { get; set; } = new List<Progreso>();
    public ICollection<Calificacion> Calificaciones { get; set; } = new List<Calificacion>();
    public ICollection<Intento> Intentos { get; set; } = new List<Intento>();
    public ICollection<Mensaje> Mensajes { get; set; } = new List<Mensaje>();
    public ICollection<Like> Likes { get; set; } = new List<Like>();
    public ICollection<Anuncio> Anuncios { get; set; } = new List<Anuncio>();
    public ICollection<Auditoria> Auditorias { get; set; } = new List<Auditoria>();
    public ICollection<Pago> Pagos { get; set; } = new List<Pago>();
    public ICollection<InsigniaUsuario> InsigniasUsuario { get; set; } = new List<InsigniaUsuario>();
}
```

> **Nota:** `Role` es string en lugar de enum porque EF Core lo maneja como string en la BD. Se validan los valores en la aplicación.

#### Account.cs

```csharp
namespace Cursinet.Domain.Entities;

public class Account
{
    public Guid Id { get; set; }
    public string AccountId { get; set; } = string.Empty;
    public string ProviderId { get; set; } = string.Empty;  // "credentials", "google"
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

    public User? User { get; set; }
}
```

#### Session.cs

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

    public User? User { get; set; }
}
```

#### Verification.cs

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

#### CategoriaCurso.cs

```csharp
namespace Cursinet.Domain.Entities;

public class CategoriaCurso
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? Color { get; set; }
    public string? Icono { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<Curso> Cursos { get; set; } = new List<Curso>();
}
```

#### Curso.cs

```csharp
namespace Cursinet.Domain.Entities;

public class Curso
{
    public Guid Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? DescripcionCorta { get; set; }
    public string? Imagen { get; set; }
    public string? VideoPresentacion { get; set; }
    public Guid? CategoriaCursoId { get; set; }
    public string? Nivel { get; set; }        // "Principiante" | "Intermedio" | "Avanzado"
    public string Estado { get; set; } = "Borrador";  // "Borrador" | "Publicado" | "Archivado"
    public int DuracionHoras { get; set; }
    public Guid? InstructorId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public CategoriaCurso? CategoriaCurso { get; set; }
    public ICollection<CursoRequisito> CursoRequisitos { get; set; } = new List<CursoRequisito>();
    public ICollection<PrecioCurso> PreciosCurso { get; set; } = new List<PrecioCurso>();
    public ICollection<Clase> Clases { get; set; } = new List<Clase>();
    public ICollection<Inscripcion> Inscripciones { get; set; } = new List<Inscripcion>();
    public ICollection<Evaluacion> Evaluaciones { get; set; } = new List<Evaluacion>();
    public ICollection<Foro> Foros { get; set; } = new List<Foro>();
    public ICollection<Anuncio> Anuncios { get; set; } = new List<Anuncio>();
}
```

#### Requisito.cs

```csharp
namespace Cursinet.Domain.Entities;

public class Requisito
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<CursoRequisito> CursoRequisitos { get; set; } = new List<CursoRequisito>();
}
```

#### CursoRequisito.cs

```csharp
namespace Cursinet.Domain.Entities;

public class CursoRequisito
{
    public Guid CursoId { get; set; }
    public Guid RequisitoId { get; set; }
    public bool EsObligatorio { get; set; }

    public Curso Curso { get; set; } = null!;
    public Requisito Requisito { get; set; } = null!;
}
```

#### PrecioCurso.cs

```csharp
namespace Cursinet.Domain.Entities;

public class PrecioCurso
{
    public Guid Id { get; set; }
    public Guid CursoId { get; set; }
    public decimal Monto { get; set; }
    public string Moneda { get; set; } = "USD";
    public DateTime FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
    public bool EsActivo { get; set; }
    public DateTime CreatedAt { get; set; }

    public Curso Curso { get; set; } = null!;
}
```

#### Clase.cs

```csharp
namespace Cursinet.Domain.Entities;

public class Clase
{
    public Guid Id { get; set; }
    public Guid CursoId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public int Orden { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Curso Curso { get; set; } = null!;
    public ICollection<Modulo> Modulos { get; set; } = new List<Modulo>();
}
```

#### Modulo.cs

```csharp
namespace Cursinet.Domain.Entities;

public class Modulo
{
    public Guid Id { get; set; }
    public Guid ClaseId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public int Orden { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Clase Clase { get; set; } = null!;
    public ICollection<Leccion> Lecciones { get; set; } = new List<Leccion>();
}
```

#### Leccion.cs

```csharp
namespace Cursinet.Domain.Entities;

public class Leccion
{
    public Guid Id { get; set; }
    public Guid ModuloId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Contenido { get; set; }       // Contenido HTML/Markdown
    public string? TipoContenido { get; set; }   // "video" | "texto" | "quiz" | "archivo"
    public int Orden { get; set; }
    public int DuracionMinutos { get; set; }
    public bool EsGratis { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Modulo Modulo { get; set; } = null!;
    public Video? Video { get; set; }
    public ICollection<Archivo> Archivos { get; set; } = new List<Archivo>();
    public ICollection<Enlace> Enlaces { get; set; } = new List<Enlace>();
    public ICollection<Progreso> Progresos { get; set; } = new List<Progreso>();
}
```

#### Video.cs

```csharp
namespace Cursinet.Domain.Entities;

public class Video
{
    public Guid Id { get; set; }
    public Guid LeccionId { get; set; }
    public string Url { get; set; } = string.Empty;
    public string? Proveedor { get; set; }   // "youtube" | "vimeo" | "local"
    public string? VideoId { get; set; }
    public string? Transcripcion { get; set; }
    public int DuracionSegundos { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Leccion Leccion { get; set; } = null!;
}
```

#### Archivo.cs

```csharp
namespace Cursinet.Domain.Entities;

public class Archivo
{
    public Guid Id { get; set; }
    public Guid LeccionId { get; set; }
    public string NombreOriginal { get; set; } = string.Empty;
    public string NombreArchivo { get; set; } = string.Empty;
    public string Ruta { get; set; } = string.Empty;
    public string? TipoMime { get; set; }
    public long TamanoBytes { get; set; }
    public DateTime CreatedAt { get; set; }

    public Leccion Leccion { get; set; } = null!;
}
```

#### Enlace.cs

```csharp
namespace Cursinet.Domain.Entities;

public class Enlace
{
    public Guid Id { get; set; }
    public Guid LeccionId { get; set; }
    public string Url { get; set; } = string.Empty;
    public string? Titulo { get; set; }
    public string? Descripcion { get; set; }
    public DateTime CreatedAt { get; set; }

    public Leccion Leccion { get; set; } = null!;
}
```

#### Inscripcion.cs

```csharp
namespace Cursinet.Domain.Entities;

public class Inscripcion
{
    public Guid Id { get; set; }
    public Guid UsuarioId { get; set; }
    public Guid CursoId { get; set; }
    public DateTime FechaInscripcion { get; set; }
    public string Estado { get; set; } = "Activo";   // "Activo" | "Completado" | "Cancelado"
    public decimal? ProgresoTotal { get; set; }
    public DateTime? FechaCompletado { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User Usuario { get; set; } = null!;
    public Curso Curso { get; set; } = null!;
}
```

#### Progreso.cs

```csharp
namespace Cursinet.Domain.Entities;

public class Progreso
{
    public Guid Id { get; set; }
    public Guid UsuarioId { get; set; }
    public Guid LeccionId { get; set; }
    public bool Completado { get; set; }
    public int? TiempoVistoSegundos { get; set; }
    public DateTime? FechaCompletado { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User Usuario { get; set; } = null!;
    public Leccion Leccion { get; set; } = null!;
}
```

#### Calificacion.cs

```csharp
namespace Cursinet.Domain.Entities;

public class Calificacion
{
    public Guid Id { get; set; }
    public Guid UsuarioId { get; set; }
    public Guid CursoId { get; set; }
    public decimal Puntaje { get; set; }
    public string? Comentario { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User Usuario { get; set; } = null!;
    public Curso Curso { get; set; } = null!;
}
```

#### Evaluacion.cs

```csharp
namespace Cursinet.Domain.Entities;

public class Evaluacion
{
    public Guid Id { get; set; }
    public Guid CursoId { get; set; }
    public Guid? LeccionId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string Tipo { get; set; } = "Quiz";    // "Quiz" | "Examen" | "Tarea"
    public int? PuntajeMaximo { get; set; }
    public int? TiempoLimiteMinutos { get; set; }
    public int? IntentosPermitidos { get; set; }
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Curso Curso { get; set; } = null!;
    public Leccion? Leccion { get; set; }
    public ICollection<Pregunta> Preguntas { get; set; } = new List<Pregunta>();
    public ICollection<Intento> Intentos { get; set; } = new List<Intento>();
}
```

#### Pregunta.cs

```csharp
namespace Cursinet.Domain.Entities;

public class Pregunta
{
    public Guid Id { get; set; }
    public Guid EvaluacionId { get; set; }
    public string Texto { get; set; } = string.Empty;
    public string Tipo { get; set; } = "Opción múltiple";  // "Opción múltiple" | "Verdadero/Falso" | "Abierta"
    public int Orden { get; set; }
    public int? Puntaje { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Evaluacion Evaluacion { get; set; } = null!;
    public ICollection<Alternativa> Alternativas { get; set; } = new List<Alternativa>();
    public ICollection<Respuesta> Respuestas { get; set; } = new List<Respuesta>();
}
```

#### Alternativa.cs

```csharp
namespace Cursinet.Domain.Entities;

public class Alternativa
{
    public Guid Id { get; set; }
    public Guid PreguntaId { get; set; }
    public string Texto { get; set; } = string.Empty;
    public bool EsCorrecta { get; set; }
    public int Orden { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Pregunta Pregunta { get; set; } = null!;
}
```

#### Intento.cs

```csharp
namespace Cursinet.Domain.Entities;

public class Intento
{
    public Guid Id { get; set; }
    public Guid EvaluacionId { get; set; }
    public Guid UsuarioId { get; set; }
    public int NumeroIntento { get; set; }
    public decimal? PuntajeObtenido { get; set; }
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
    public string Estado { get; set; } = "En progreso";  // "En progreso" | "Completado" | "Cancelado"
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Evaluacion Evaluacion { get; set; } = null!;
    public User Usuario { get; set; } = null!;
    public ICollection<Respuesta> Respuestas { get; set; } = new List<Respuesta>();
}
```

#### Respuesta.cs

```csharp
namespace Cursinet.Domain.Entities;

public class Respuesta
{
    public Guid Id { get; set; }
    public Guid IntentoId { get; set; }
    public Guid PreguntaId { get; set; }
    public Guid? AlternativaId { get; set; }
    public string? TextoRespuesta { get; set; }
    public bool EsCorrecta { get; set; }
    public DateTime CreatedAt { get; set; }

    public Intento Intento { get; set; } = null!;
    public Pregunta Pregunta { get; set; } = null!;
    public Alternativa? Alternativa { get; set; }
}
```

#### Foro.cs

```csharp
namespace Cursinet.Domain.Entities;

public class Foro
{
    public Guid Id { get; set; }
    public Guid CursoId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Curso Curso { get; set; } = null!;
    public ICollection<Mensaje> Mensajes { get; set; } = new List<Mensaje>();
}
```

#### Mensaje.cs

```csharp
namespace Cursinet.Domain.Entities;

public class Mensaje
{
    public Guid Id { get; set; }
    public Guid ForoId { get; set; }
    public Guid UsuarioId { get; set; }
    public string Contenido { get; set; } = string.Empty;
    public Guid? MensajePadreId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Foro Foro { get; set; } = null!;
    public User Usuario { get; set; } = null!;
    public Mensaje? MensajePadre { get; set; }
    public ICollection<Mensaje> Respuestas { get; set; } = new List<Mensaje>();
    public ICollection<Like> Likes { get; set; } = new List<Like>();
}
```

#### Like.cs

```csharp
namespace Cursinet.Domain.Entities;

public class Like
{
    public Guid Id { get; set; }
    public Guid MensajeId { get; set; }
    public Guid UsuarioId { get; set; }
    public DateTime CreatedAt { get; set; }

    public Mensaje Mensaje { get; set; } = null!;
    public User Usuario { get; set; } = null!;
}
```

#### Anuncio.cs

```csharp
namespace Cursinet.Domain.Entities;

public class Anuncio
{
    public Guid Id { get; set; }
    public Guid CursoId { get; set; }
    public Guid InstructorId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Contenido { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Curso Curso { get; set; } = null!;
    public User Instructor { get; set; } = null!;
}
```

#### Insignia.cs

```csharp
namespace Cursinet.Domain.Entities;

public class Insignia
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? Icono { get; set; }
    public string? Categoria { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<InsigniaUsuario> InsigniasUsuario { get; set; } = new List<InsigniaUsuario>();
}
```

#### InsigniaUsuario.cs

```csharp
namespace Cursinet.Domain.Entities;

public class InsigniaUsuario
{
    public Guid Id { get; set; }
    public Guid UsuarioId { get; set; }
    public Guid InsigniaId { get; set; }
    public DateTime FechaObtenida { get; set; }
    public DateTime CreatedAt { get; set; }

    public User Usuario { get; set; } = null!;
    public Insignia Insignia { get; set; } = null!;
}
```

#### Auditoria.cs

```csharp
namespace Cursinet.Domain.Entities;

public class Auditoria
{
    public Guid Id { get; set; }
    public Guid? UsuarioId { get; set; }
    public string Accion { get; set; } = string.Empty;
    public string Entidad { get; set; } = string.Empty;
    public string? EntidadId { get; set; }
    public string? ValoresAnteriores { get; set; }   // JSON
    public string? ValoresNuevos { get; set; }        // JSON
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime CreatedAt { get; set; }

    public User? Usuario { get; set; }
}
```

#### Pago.cs

```csharp
namespace Cursinet.Domain.Entities;

public class Pago
{
    public Guid Id { get; set; }
    public Guid UsuarioId { get; set; }
    public Guid? CursoId { get; set; }
    public decimal Monto { get; set; }
    public string Moneda { get; set; } = "USD";
    public string MetodoPago { get; set; } = string.Empty;
    public string Estado { get; set; } = "Pendiente";  // "Pendiente" | "Completado" | "Fallido" | "Reembolsado"
    public string? TransactionId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User Usuario { get; set; } = null!;
    public Curso? Curso { get; set; }
}
```

### 4.2 Enumeraciones

A diferencia del manual original que usaba un `enum Role{}`, el código actual usa **strings** para `Role` y estados, con validación en la aplicación. No hay archivos de `Enum/` en el proyecto — los valores válidos se definen como constantes o se validan con FluentValidation.

**Roles válidos:**
| Valor | Descripción |
|-------|-------------|
| `"Staff"` | Usuario estándar (estudiante/instructor) |
| `"Admin"` | Administrador del sistema |

**Estados de Curso:**
| Valor | Descripción |
|-------|-------------|
| `"Borrador"` | Curso en edición, no visible |
| `"Publicado"` | Curso visible y disponible |
| `"Archivado"` | Curso oculto, no disponible |

**Estados de Inscripción:**
| Valor | Descripción |
|-------|-------------|
| `"Activo"` | Estudiante inscrito cursando |
| `"Completado"` | Estudiante terminó el curso |
| `"Cancelado"` | Inscripción cancelada |

**Tipos de Evaluación:**
| Valor | Descripción |
|-------|-------------|
| `"Quiz"` | Evaluación corta |
| `"Examen"` | Evaluación formal |
| `"Tarea"` | Trabajo práctico |

**Tipos de Pregunta:**
| Valor | Descripción |
|-------|-------------|
| `"Opción múltiple"` | Selección entre alternativas |
| `"Verdadero/Falso"` | Dos alternativas |
| `"Abierta"` | Respuesta libre |

**Estados de Pago:**
| Valor | Descripción |
|-------|-------------|
| `"Pendiente"` | Pago iniciado, no confirmado |
| `"Completado"` | Pago exitoso |
| `"Fallido"` | Pago rechazado |
| `"Reembolsado"` | Pago devuelto |

### 4.3 Value Objects

El proyecto no tiene una carpeta `ValueObjects/` dedicada. Los objetos de valor se manejan como propiedades inline dentro de las entidades. Ejemplos:

- **Precio:** `Monto` + `Moneda` en `PrecioCurso` y `Pago`
- **Contenido multimedia:** `Url` + `Proveedor` + `VideoId` en `Video`
- **Dirección IP:** `IpAddress` como string en `Session` y `Auditoria`
- **JSON data:** `ValoresAnteriores`/`ValoresNuevos` en `Auditoria`

### 4.4 Excepciones

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

// Helper methods
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

**Tabla de errores estándar:**

| Helper | Status | Code | Uso |
|--------|--------|------|-----|
| `BadRequest()` | 400 | BAD_REQUEST | Datos inválidos, validación fallida |
| `Unauthorized()` | 401 | UNAUTHORIZED | No autenticado, token inválido |
| `Forbidden()` | 403 | FORBIDDEN | Sin permisos (rol insuficiente) |
| `NotFound()` | 404 | NOT_FOUND | Recurso no existe |
| `Conflict()` | 409 | CONFLICT | Email duplicado, estado inválido |
| `UnprocessableEntity()` | 422 | UNPROCESSABLE_ENTITY | Validación de negocio |
| `TooManyRequests()` | 429 | TOO_MANY_REQUESTS | Rate limiting |
| `InternalError()` | 500 | INTERNAL_SERVER_ERROR | Error inesperado |

---

## 5. Application Layer

La capa de aplicación define **contratos** (interfaces) y **lógica de negocio** orquestada. Contiene 13 interfaces de servicio, 13 interfaces de repositorio, 4 servicios de aplicación, 30+ DTOs, AutoMapper profiles, y validadores FluentValidation.

### 5.1 Interfaces de Servicios (13)

| Interfaz | Propósito |
|----------|-----------|
| `IAuthService` | Autenticación (register, login, refresh, etc.) |
| `IPasswordService` | Hashing y verificación de passwords (BCrypt) |
| `ITokenService` | Generación y validación de tokens JWT |
| `IAdminService` | Gestión de usuarios, roles, configuración global |
| `ICursoService` | CRUD de cursos |
| `IClaseService` | CRUD de clases |
| `IModuloService` | CRUD de módulos |
| `ILeccionService` | CRUD de lecciones |
| `IInscripcionService` | Inscripciones y gestión de estudiantes |
| `IReporteService` | Reportes y estadísticas |
| `IArchivoService` | Manejo de archivos (upload/download) |
| `IEntidadService<T>` | Servicio genérico para entidades simple CRUD |
| `IEvaluacionService` | Evaluaciones, preguntas, calificación |

#### IAuthService.cs

```csharp
namespace Cursinet.Application.Common.Interfaces;

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
```

#### IAdminService.cs

```csharp
namespace Cursinet.Application.Common.Interfaces;

public interface IAdminService
{
    // Usuarios
    Task<PagedResult<UserDto>> GetUsersAsync(int page, int limit, string? search, string? role);
    Task<UserDto> UpdateUserRoleAsync(Guid userId, string newRole);
    Task SoftDeleteUserAsync(Guid userId);
    Task ActivateUserAsync(Guid userId);
    Task<UserDetailDto> GetUserDetailAsync(Guid userId);
    Task<DashboardStatsDto> GetDashboardStatsAsync();

    // Configuración del sistema
    Task<List<AuditLogDto>> GetAuditLogsAsync(int page, int limit);
    Task<List<PagoDto>> GetPaymentsAsync(int page, int limitely);
    Task<List<PagoDto>> GetPaymentsAsync(int page, int limit);
}
```

#### ICursoService.cs (simplificado)

```csharp
namespace Cursinet.Application.Common.Interfaces;

public interface ICursoService
{
    Task<List<CursoDto>> GetAllAsync();
    Task<PagedResult<CursoDto>> GetPagedAsync(int page, int limit, string? search, string? categoria, string? nivel, string? estado);
    Task<CursoDetailDto> GetByIdAsync(Guid id);
    Task<CursoDto> CreateAsync(CreateCursoDto dto);
    Task<CursoDto> UpdateAsync(Guid id, UpdateCursoDto dto);
    Task DeleteAsync(Guid id);
    Task<CursoDto> ChangeEstadoAsync(Guid id, string estado);
}
```

### 5.2 Interfaces de Repositorios (13)

| Interfaz | Entidad | Métodos Clave |
|----------|---------|---------------|
| `IUserRepository` | User | GetByEmail, GetById, Create, Update, SoftDelete |
| `IAccountRepository` | Account | GetByProviderAndAccountId, GetCredentialsByEmail, CRUD |
| `ISessionRepository` | Session | Create, GetByToken, GetByUserId, Delete, DeleteExpired |
| `IVerificationRepository` | Verification | Create, GetByIdentifier, GetByIdentifierAndValue, DeleteExpired |
| `ICursoRepository` | Curso | GetAll, GetPaged, GetByIdWithDetails, CRUD |
| `IClaseRepository` | Clase | GetByCursoId, CRUD |
| `IModuloRepository` | Modulo | GetByClaseId, CRUD |
| `ILeccionRepository` | Leccion | GetByModuloId, CRUD |
| `IInscripcionRepository` | Inscripcion | GetByUsuarioId, GetByCursoId, CRUD |
| `ICategoriaCursoRepository` | CategoriaCurso | CRUD básico |
| `IEvaluacionRepository` | Evaluacion | GetByCursoId, GetByIdWithPreguntas, CRUD |
| `IPagoRepository` | Pago | GetByUsuarioId, CRUD |
| `IAuditoriaRepository` | Auditoria | Create, GetPaged |

### 5.3 Servicios de Aplicación (4)

| Servicio | Namespace | Propósito |
|----------|-----------|-----------|
| `AuthService` | `Features.Auth` | Registro, login, refresh, email verification, password reset |
| `AdminService` | `Features.Admin` | Gestión de usuarios, roles, dashboard stats |
| `CursoService` | `Features.Cursos` | CRUD de cursos con filtros y paginación |
| `ClaseService` | `Features.Clases` | CRUD de clases, módulos y lecciones |

**Pattern:** Cada servicio implementa su interfaz correspondiente y recibe repositorios + servicios de infraestructura por inyección de dependencias.

#### Ejemplo: AdminService.cs (simplificado)

```csharp
namespace Cursinet.Application.Features.Admin;

public class AdminService : IAdminService
{
    private readonly IUserRepository _userRepository;
    private readonly ICursoRepository _cursoRepository;
    private readonly IInscripcionRepository _inscripcionRepository;
    private readonly IPagoRepository _pagoRepository;
    private readonly IAuditoriaRepository _auditoriaRepository;

    public AdminService(
        IUserRepository userRepository,
        ICursoRepository cursoRepository,
        IInscripcionRepository inscripcionRepository,
        IPagoRepository pagoRepository,
        IAuditoriaRepository auditoriaRepository)
    {
        _userRepository = userRepository;
        _cursoRepository = cursoRepository;
        _inscripcionRepository = inscripcionRepository;
        _pagoRepository = pagoRepository;
        _auditoriaRepository = auditoriaRepository;
    }

    public async Task<DashboardStatsDto> GetDashboardStatsAsync()
    {
        var totalUsers = await _userRepository.CountAsync();
        var totalCourses = await _cursoRepository.CountAsync();
        var totalEnrollments = await _inscripcionRepository.CountAsync();
        var totalRevenue = await _pagoRepository.GetTotalRevenueAsync();

        return new DashboardStatsDto
        {
            TotalUsuarios = totalUsers,
            TotalCursos = totalCourses,
            TotalInscripciones = totalEnrollments,
            IngresosTotales = totalRevenue,
            // Más stats...
        };
    }

    public async Task<PagedResult<UserDto>> GetUsersAsync(int page, int limit, string? search, string? role)
    {
        return await _userRepository.GetPagedAsync(page, limit, search, role);
    }

    // ... más métodos
}
```

### 5.4 DTOs

El proyecto usa **tres categorías de DTOs**:

#### Application DTOs (en `Application/Features/*/`)

Son los DTOs que usan los servicios de aplicación. Ejemplos:

```csharp
// Auth DTOs
public record AuthResponse(string Message, UserDto User, string AccessToken, string RefreshToken);
public record RefreshResponse(string Message, string AccessToken, string RefreshToken);
public record ForgotPasswordResponse(string Message, DateTime ExpiresAt);
public record ResetPasswordResponse(string Message);
public record SessionResponse(Guid Id, DateTime ExpiresAt, string? IpAddress, string? UserAgent, DateTime CreatedAt);

// User DTOs
public record UserDto(Guid Id, string Name, string Email, bool EmailVerified, string Role, string? Phone, string? Image, DateTime CreatedAt);
public record UserDetailDto(Guid Id, string Name, string Email, bool EmailVerified, string Role, string? Phone, string? Image, DateTime CreatedAt, int TotalCursos, int TotalInscripciones);

// Paged Result
public record PagedResult<T>(List<T> Items, int Total, int Page, int Limit, int TotalPages);

// Admin DTOs
public record DashboardStatsDto(int TotalUsuarios, int TotalCursos, int TotalInscripciones, decimal IngresosTotales);
public record AuditLogDto(Guid Id, string Accion, string Entidad, string? UsuarioNombre, DateTime CreatedAt);
public record PagoDto(Guid Id, decimal Monto, string Estado, string? UsuarioNombre, DateTime CreatedAt);
```

#### API DTOs (en `Api/DTOs/`)

Son los DTOs de **entrada** (requests) que llegan desde los endpoints HTTP:

```csharp
// Auth Requests
public record RegisterRequest(string Name, string Email, string Password, string? Phone);
public record LoginRequest(string Email, string Password);
public record RefreshTokenRequest(string RefreshToken);
public record VerifyEmailRequest(string Identifier, string Code);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Email, string Code, string NewPassword);
public record ResendVerificationRequest(string Email);
public record RevokeSessionRequest(Guid SessionId);

// Admin Requests
public record UpdateUserRoleRequest(string Role);
public record UserQueryParams(int Page = 1, int Limit = 10, string? Search = null, string? Role = null);

// Curso Requests
public record CreateCursoRequest(string Titulo, string? Descripcion, string? DescripcionCorta, Guid? CategoriaCursoId, string? Nivel, int DuracionHoras);
public record UpdateCursoRequest(string? Titulo, string? Descripcion, string? DescripcionCorta, Guid? CategoriaCursoId, string? Nivel, int? DuracionHoras, string? Estado);

// Pagination params (reutilizable)
public record PagedRequest(int Page = 1, int Limit = 10);
```

### 5.5 Mapping

El proyecto usa **AutoMapper** para convertir entre entidades y DTOs.

```csharp
namespace Cursinet.Application.Common.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // User mappings
        CreateMap<User, UserDto>();
        CreateMap<User, UserDetailDto>();

        // Curso mappings
        CreateMap<Curso, CursoDto>();
        CreateMap<Curso, CursoDetailDto>();

        // Clase mappings
        CreateMap<Clase, ClaseDto>();
        CreateMap<Modulo, ModuloDto>();
        CreateMap<Leccion, LeccionDto>();

        // Inscripcion mappings
        CreateMap<Inscripcion, InscripcionDto>();

        // Evaluacion mappings
        CreateMap<Evaluacion, EvaluacionDto>();
        CreateMap<Pregunta, PreguntaDto>();
        CreateMap<Alternativa, AlternativaDto>();

        // Auditoria mappings
        CreateMap<Auditoria, AuditLogDto>();
    }
}
```

### 5.6 Validación

Se usa **FluentValidation** para validar todos los DTOs de entrada.

```csharp
// RegisterRequestValidator.cs
public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(255);

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters");
    }
}

// CreateCursoRequestValidator.cs
public class CreateCursoRequestValidator : AbstractValidator<CreateCursoRequest>
{
    public CreateCursoRequestValidator()
    {
        RuleFor(x => x.Titulo)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(200);

        RuleFor(x => x.Nivel)
            .Must(n => n == null || new[] { "Principiante", "Intermedio", "Avanzado" }.Contains(n))
            .WithMessage("Nivel must be 'Principiante', 'Intermedio', or 'Avanzado'");

        RuleFor(x => x.DuracionHoras)
            .GreaterThan(0).WithMessage("Duration must be greater than 0");
    }
}
```

---

## 6. Infrastructure Layer

### 6.1 ApplicationDbContext

```csharp
namespace Cursinet.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    // DbSets — 6 tablas principales (el resto se accede vía repositorios)
    public DbSet<User> Users => Set<User>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<Verification> Verifications => Set<Verification>();
    public DbSet<Curso> Cursos => Set<Curso>();
    public DbSet<Auditoria> Auditorias => Set<Auditoria>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
```

### 6.2 Configuraciones EF Core (31)

Cada entidad tiene su propia configuración usando **Fluent API**. Están en `Infrastructure/Persistence/Configurations/`.

**Estructura típica de una configuración:**

```csharp
namespace Cursinet.Infrastructure.Persistence.Configurations;

public class CursoConfiguration : IEntityTypeConfiguration<Curso>
{
    public void Configure(EntityTypeBuilder<Curso> builder)
    {
        builder.ToTable("cursos");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(c => c.Titulo).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Descripcion).HasColumnType("text");
        builder.Property(c => c.DescripcionCorta).HasMaxLength(500);
        builder.Property(c => c.Nivel).HasMaxLength(50);
        builder.Property(c => c.Estado).HasMaxLength(50).HasDefaultValue("Borrador");
        builder.Property(c => c.Imagen).HasMaxLength(500);
        builder.Property(c => c.VideoPresentacion).HasMaxLength(500);

        builder.Property(c => c.CreatedAt).HasDefaultValueSql("NOW()");
        builder.Property(c => c.UpdatedAt).HasDefaultValueSql("NOW()");

        // Índices
        builder.HasIndex(c => c.Titulo);
        builder.HasIndex(c => c.Estado);
        builder.HasIndex(c => c.CategoriaCursoId);

        // Relaciones
        builder.HasOne(c => c.CategoriaCurso)
            .WithMany(cat => cat.Cursos)
            .HasForeignKey(c => c.CategoriaCursoId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(c => c.CursoRequisitos)
            .WithOne(cr => cr.Curso)
            .HasForeignKey(cr => cr.CursoId);

        builder.HasMany(c => c.Clases)
            .WithOne(cl => cl.Curso)
            .HasForeignKey(cl => cl.CursoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.Inscripciones)
            .WithOne(i => i.Curso)
            .HasForeignKey(i => i.CursoId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
```

**Lista de configuraciones (31 archivos .cs):**

| # | Archivo | Tabla |
|---|---------|-------|
| 1 | `UserConfiguration.cs` | users |
| 2 | `AccountConfiguration.cs` | accounts |
| 3 | `SessionConfiguration.cs` | sessions |
| 4 | `VerificationConfiguration.cs` | verifications |
| 5 | `CategoriaCursoConfiguration.cs` | categoria_cursos |
| 6 | `CursoConfiguration.cs` | cursos |
| 7 | `RequisitoConfiguration.cs` | requisitos |
| 8 | `CursoRequisitoConfiguration.cs` | curso_requisitos |
| 9 | `PrecioCursoConfiguration.cs` | precio_cursos |
| 10 | `ClaseConfiguration.cs` | clases |
| 11 | `ModuloConfiguration.cs` | modulos |
| 12 | `LeccionConfiguration.cs` | lecciones |
| 13 | `VideoConfiguration.cs` | videos |
| 14 | `ArchivoConfiguration.cs` | archivos |
| 15 | `EnlaceConfiguration.cs` | enlaces |
| 16 | `InscripcionConfiguration.cs` | inscripciones |
| 17 | `ProgresoConfiguration.cs` | progresos |
| 18 | `CalificacionConfiguration.cs` | calificaciones |
| 19 | `EvaluacionConfiguration.cs` | evaluaciones |
| 20 | `PreguntaConfiguration.cs` | preguntas |
| 21 | `AlternativaConfiguration.cs` | alternativas |
| 22 | `IntentoConfiguration.cs` | intentos |
| 23 | `RespuestaConfiguration.cs` | respuestas |
| 24 | `ForoConfiguration.cs` | foros |
| 25 | `MensajeConfiguration.cs` | mensajes |
| 26 | `LikeConfiguration.cs` | likes |
| 27 | `AnuncioConfiguration.cs` | anuncios |
| 28 | `InsigniaConfiguration.cs` | insignias |
| 29 | `InsigniaUsuarioConfiguration.cs` | insignia_usuarios |
| 30 | `AuditoriaConfiguration.cs` | auditorias |
| 31 | `PagoConfiguration.cs` | pagos |

**Patrones comunes en las configuraciones:**

1. **`HasDefaultValueSql("gen_random_uuid()")`** — UUIDs generados por PostgreSQL
2. **`HasDefaultValueSql("NOW()")`** — Timestamps automáticos
3. **`HasColumnType("text")`** — Para campos largos (Descripcion, Contenido, JSON)
4. **`OnDelete(DeleteBehavior.Cascade)`** — Para relaciones padre-hijo
5. **`OnDelete(DeleteBehavior.SetNull)`** — Para relaciones opcionales
6. **Índices compuestos** — Para tablas N:M (ej: `CursoRequisito` tiene PK compuesta)

#### UserConfiguration.cs

```csharp
public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(u => u.Name).IsRequired().HasMaxLength(255);
        builder.Property(u => u.Email).IsRequired().HasMaxLength(255);
        builder.HasIndex(u => u.Email).IsUnique();

        builder.Property(u => u.Role).HasConversion<string>().HasMaxLength(50);
        builder.Property(u => u.Image).HasMaxLength(500);

        builder.Property(u => u.CreatedAt).HasDefaultValueSql("NOW()");
        builder.Property(u => u.UpdatedAt).HasDefaultValueSql("NOW()");
        builder.Property(u => u.DeletedAt).IsRequired(false);

        // 🎯 Soft delete: todas las queries excluyen usuarios eliminados
        builder.HasQueryFilter(u => u.DeletedAt == null);

        // Relaciones
        builder.HasMany(u => u.Accounts).WithOne(a => a.User).HasForeignKey(a => a.UserId);
        builder.HasMany(u => u.Sessions).WithOne(s => s.User).HasForeignKey(s => s.UserId);
        builder.HasMany(u => u.Inscripciones).WithOne(i => i.Usuario).HasForeignKey(i => i.UsuarioId);
        builder.HasMany(u => u.Progresos).WithOne(p => p.Usuario).HasForeignKey(p => p.UsuarioId);
        builder.HasMany(u => u.Calificaciones).WithOne(c => c.Usuario).HasForeignKey(c => c.UsuarioId);
        builder.HasMany(u => u.Intentos).WithOne(i => i.Usuario).HasForeignKey(i => i.UsuarioId);
        builder.HasMany(u => u.Mensajes).WithOne(m => m.Usuario).HasForeignKey(m => m.UsuarioId);
        builder.HasMany(u => u.Likes).WithOne(l => l.Usuario).HasForeignKey(l => l.UsuarioId);
        builder.HasMany(u => u.Anuncios).WithOne(a => a.Instructor).HasForeignKey(a => a.InstructorId);
        builder.HasMany(u => u.Auditorias).WithOne(a => a.Usuario).HasForeignKey(a => a.UsuarioId);
        builder.HasMany(u => u.Pagos).WithOne(p => p.Usuario).HasForeignKey(p => p.UsuarioId);
        builder.HasMany(u => u.InsigniasUsuario).WithOne(iu => iu.Usuario).HasForeignKey(iu => iu.UsuarioId);
    }
}
```

### 6.3 Repositorios (13)

Cada repositorio implementa su interfaz de Application Layer y recibe `ApplicationDbContext` por constructor.

#### Estructura típica de un repositorio:

```csharp
public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByEmailAsync(string email)
        => await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

    public async Task<User?> GetByIdAsync(Guid id)
        => await _context.Users.FirstOrDefaultAsync(u => u.Id == id);

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

#### AccountRepository.cs — métodos clave

```csharp
public class AccountRepository : IAccountRepository
{
    private readonly ApplicationDbContext _context;

    // Busca una cuenta por proveedor + ID externo (útil para OAuth)
    public async Task<Account?> GetByProviderAndAccountIdAsync(string providerId, string accountId)
        => await _context.Accounts
            .FirstOrDefaultAsync(a => a.ProviderId == providerId && a.AccountId == accountId);

    // Busca la cuenta "credentials" de un usuario por su email
    public async Task<Account?> GetCredentialsByEmailAsync(string email)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email && u.DeletedAt == null);
        if (user == null) return null;
        return await _context.Accounts
            .FirstOrDefaultAsync(a => a.UserId == user.Id && a.ProviderId == "credentials");
    }
}
```

#### SessionRepository.cs — métodos clave

```csharp
public class SessionRepository : ISessionRepository
{
    private readonly ApplicationDbContext _context;

    public async Task<Session> CreateAsync(Session session) { /* ... */ }

    public async Task<Session?> GetByTokenAsync(string token)
        => await _context.Sessions.FirstOrDefaultAsync(s => s.Token == token);

    public async Task<List<Session>> GetByUserIdAsync(Guid userId)
        => await _context.Sessions.Where(s => s.UserId == userId).ToListAsync();

    public async Task DeleteAsync(string token)
    {
        var session = await _context.Sessions.FirstOrDefaultAsync(s => s.Token == token);
        if (session != null) { _context.Sessions.Remove(session); await _context.SaveChangesAsync(); }
    }

    public async Task DeleteByUserIdAsync(Guid userId)
    {
        var sessions = await _context.Sessions.Where(s => s.UserId == userId).ToListAsync();
        _context.Sessions.RemoveRange(sessions);
        await _context.SaveChangesAsync();
    }

    // Limpieza de sesiones expiradas
    public async Task<int> DeleteExpiredAsync()
    {
        var expired = await _context.Sessions
            .Where(s => s.ExpiresAt < DateTime.UtcNow).ToListAsync();
        _context.Sessions.RemoveRange(expired);
        return await _context.SaveChangesAsync();
    }
}
```

#### CursoRepository.cs — con paginación y filtros

```csharp
public class CursoRepository : ICursoRepository
{
    private readonly ApplicationDbContext _context;

    public async Task<PagedResult<Curso>> GetPagedAsync(
        int page, int limit, string? search, string? categoria, string? nivel, string? estado)
    {
        var query = _context.Cursos
            .Include(c => c.CategoriaCurso)
            .Include(c => c.Clases)
            .AsQueryable();

        // Filtros dinámicos
        if (!string.IsNullOrEmpty(search))
            query = query.Where(c => c.Titulo.Contains(search) || c.Descripcion!.Contains(search));
        if (!string.IsNullOrEmpty(categoria))
            query = query.Where(c => c.CategoriaCurso!.Nombre == categoria);
        if (!string.IsNullOrEmpty(nivel))
            query = query.Where(c => c.Nivel == nivel);
        if (!string.IsNullOrEmpty(estado))
            query = query.Where(c => c.Estado == estado);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return new PagedResult<Curso>(items, total, page, limit, (int)Math.Ceiling(total / (double)limit));
    }

    public async Task<Curso?> GetByIdWithDetailsAsync(Guid id)
        => await _context.Cursos
            .Include(c => c.CategoriaCurso)
            .Include(c => c.CursoRequisitos).ThenInclude(cr => cr.Requisito)
            .Include(c => c.Clases.OrderBy(cl => cl.Orden))
                .ThenInclude(cl => cl.Modulos.OrderBy(m => m.Orden))
                    .ThenInclude(m => m.Lecciones.OrderBy(l => l.Orden))
            .Include(c => c.Inscripciones)
            .Include(c => c.Evaluaciones)
            .Include(c => c.Foros)
            .Include(c => c.Anuncios)
            .FirstOrDefaultAsync(c => c.Id == id);
}
```

**Lista completa de repositorios:**

| # | Repositorio | Entidad |
|---|-------------|---------|
| 1 | `UserRepository` | User |
| 2 | `AccountRepository` | Account |
| 3 | `SessionRepository` | Session |
| 4 | `VerificationRepository` | Verification |
| 5 | `CursoRepository` | Curso |
| 6 | `ClaseRepository` | Clase |
| 7 | `ModuloRepository` | Modulo |
| 8 | `LeccionRepository` | Leccion |
| 9 | `InscripcionRepository` | Inscripcion |
| 10 | `CategoriaCursoRepository` | CategoriaCurso |
| 11 | `EvaluacionRepository` | Evaluacion |
| 12 | `PagoRepository` | Pago |
| 13 | `AuditoriaRepository` | Auditoria |

### 6.4 Servicios de Infraestructura (5)

| # | Servicio | Interfaz | Propósito |
|---|----------|----------|-----------|
| 1 | `PasswordService` | `IPasswordService` | BCrypt hashing + verification |
| 2 | `TokenService` | `ITokenService` | JWT generation + validation |
| 3 | `ArchivoService` | `IArchivoService` | File upload, storage, download |
| 4 | `EmailService` | `IEmailService` | Envío de emails (verificación, reset) |
| 5 | `CurrentUserService` | `ICurrentUserService` | Obtiene usuario actual del HttpContext |

#### PasswordService.cs

```csharp
using BCrypt.Net;

namespace Cursinet.Infrastructure.Services;

public class PasswordService : IPasswordService
{
    public string HashPassword(string password)
        => BCrypt.HashPassword(password, workFactor: 12);  // 12 rounds

    public bool VerifyPassword(string password, string hash)
        => BCrypt.Verify(password, hash);
}
```

#### TokenService.cs

```csharp
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Cursinet.Infrastructure.Services;

public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public (string accessToken, string refreshToken) GenerateTokens(Guid userId, string email, string role)
    {
        var accessToken = GenerateToken(
            _configuration["Jwt:Secret"]!,
            TimeSpan.Parse(_configuration["Jwt:AccessTokenExpiry"]!),
            userId, email, role);

        var refreshToken = GenerateToken(
            _configuration["Jwt:Secret"]!,
            TimeSpan.Parse(_configuration["Jwt:RefreshTokenExpiry"]!),
            userId, email, role);

        return (accessToken, refreshToken);
    }

    private string GenerateToken(string secret, TimeSpan expiry, Guid userId, string email, string role)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.Role, role),
            new Claim("iat", DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString())
        };

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.Add(expiry),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public ClaimsPrincipal? ValidateAccessToken(string token)
        => ValidateToken(token, _configuration["Jwt:Secret"]!);

    public ClaimsPrincipal? ValidateRefreshToken(string token)
        => ValidateToken(token, _configuration["Jwt:Secret"]!);

    private ClaimsPrincipal? ValidateToken(string token, string secret)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(secret);

            return handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out _);
        }
        catch
        {
            return null;
        }
    }
}
```

### 6.5 Migrations

Las migraciones están en `Infrastructure/Persistence/Migrations/`. Se generan con:

```bash
# Desde backend/src/Infrastructure/
dotnet ef migrations add NombreMigracion

# Aplicar a la BD
dotnet ef database update
```

**Migrations existentes:**

| Migración | Descripción |
|-----------|-------------|
| `InitialCreate` | Schema inicial (usuarios, cuentas, sesiones, verificación) |
| `AddCursosModule` | Tablas de cursos, clases, módulos, lecciones |
| `AddEvaluacionesModule` | Tablas de evaluaciones, preguntas, alternativas, intentos, respuestas |
| `AddSocialModule` | Tablas de foros, mensajes, likes, anuncios |
| `AddInsigniasModule` | Tablas de insignias e insignias de usuarios |
| `AddPagosModule` | Tablas de pagos |
| `AddAuditoriaModule` | Tabla de auditoría |
| `AddArchivosModule` | Tablas de archivos (adjuntos) |

---

## 7. API Layer

### 7.1 Program.cs

El punto de entrada del backend. Configura: Logger, DbContext, autenticación JWT, autorización, inyección de dependencias, middleware pipeline, CORS, Swagger, y health checks.

```csharp
using Serilog;
using Microsoft.EntityFrameworkCore;
using Cursinet.Infrastructure.Persistence;
using Cursinet.Infrastructure.Services;
using Cursinet.Infrastructure.Persistence.Repositories;
using Cursinet.Application.Common.Interfaces;
using Cursinet.Application.Features.Auth;
using Cursinet.Application.Features.Admin;
using Cursinet.Application.Features.Cursos;
using Cursinet.Application.Features.Clases;
using Cursinet.Api.Middleware;
using Cursinet.Api.Filters;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using FluentValidation.AspNetCore;
using Cursinet.Application.Common.Mapping;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // === LOGGING ===
    builder.Host.UseSerilog();

    // === DATABASE ===
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

    // === AUTH — JWT ===
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

    // === DI — APPLICATION SERVICES ===
    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<IAdminService, AdminService>();
    builder.Services.AddScoped<ICursoService, CursoService>();
    builder.Services.AddScoped<IClaseService, ClaseService>();

    // === DI — INFRASTRUCTURE SERVICES ===
    builder.Services.AddScoped<IPasswordService, PasswordService>();
    builder.Services.AddScoped<ITokenService, TokenService>();
    builder.Services.AddScoped<IArchivoService, ArchivoService>();
    builder.Services.AddSingleton<ICurrentUserService, CurrentUserService>();

    // === DI — REPOSITORIES ===
    builder.Services.AddScoped<IUserRepository, UserRepository>();
    builder.Services.AddScoped<IAccountRepository, AccountRepository>();
    builder.Services.AddScoped<ISessionRepository, SessionRepository>();
    builder.Services.AddScoped<IVerificationRepository, VerificationRepository>();
    builder.Services.AddScoped<ICursoRepository, CursoRepository>();
    builder.Services.AddScoped<IClaseRepository, ClaseRepository>();
    builder.Services.AddScoped<IModuloRepository, ModuloRepository>();
    builder.Services.AddScoped<ILeccionRepository, LeccionRepository>();
    builder.Services.AddScoped<IInscripcionRepository, InscripcionRepository>();
    builder.Services.AddScoped<ICategoriaCursoRepository, CategoriaCursoRepository>();
    builder.Services.AddScoped<IEvaluacionRepository, EvaluacionRepository>();
    builder.Services.AddScoped<IPagoRepository, PagoRepository>();
    builder.Services.AddScoped<IAuditoriaRepository, AuditoriaRepository>();

    // === CONTROLLERS + VALIDATION ===
    builder.Services.AddControllers(options =>
    {
        options.Filters.Add<ValidationFilter>();  // Filtro global de validación
    });
    builder.Services.AddFluentValidationAutoValidation();
    builder.Services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();

    // === AUTOMAPPER ===
    builder.Services.AddAutoMapper(typeof(MappingProfile));

    // === CORS ===
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend", policy =>
        {
            policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
    });

    // === SWAGGER ===
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();

    var app = builder.Build();

    // === MIDDLEWARE PIPELINE ===
    app.UseSerilogRequestLogging();
    app.UseMiddleware<ErrorHandlingMiddleware>();
    app.UseCors("AllowFrontend");

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();

    // === HEALTH CHECK ===
    app.MapGet("/health", () => Results.Ok(new
    {
        status = "ok",
        timestamp = DateTime.UtcNow,
        environment = app.Environment.EnvironmentName
    }));

    Log.Information("🚀 Cursinet API starting on http://localhost:5000");
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

### 7.2 Controladores (10)

| # | Controlador | Ruta Base | Propósito |
|---|-------------|-----------|-----------|
| 1 | `AuthController` | `/api/auth` | Registro, login, refresh, logout, verificación email, reset password |
| 2 | `AdminController` | `/api/admin` | Gestión de usuarios, roles, dashboard stats, auditoría |
| 3 | `CursosController` | `/api/cursos` | CRUD de cursos con filtros y paginación |
| 4 | `ClasesController` | `/api/clases` | CRUD de clases (y módulos/lecciones anidados) |
| 5 | `CategoriasController` | `/api/categorias` | CRUD de categorías de cursos |
| 6 | `InscripcionesController` | `/api/inscripciones` | Inscripción a cursos, progreso, calificaciones |
| 7 | `EvaluacionesController` | `/api/evaluaciones` | Evaluaciones, preguntas, intentos, respuestas |
| 8 | `ForosController` | `/api/foros` | Foros, mensajes, likes |
| 9 | `ArchivosController` | `/api/archivos` | Subida y descarga de archivos |
| 10 | `PagosController` | `/api/pagos` | Pagos e historial de transacciones |

#### AuthController.cs

```csharp
namespace Cursinet.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await _authService.RegisterAsync(new ApplicationRegisterRequest(
            request.Name, request.Email, request.Password, null));
        return StatusCode(201, result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        return Ok(result);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
    {
        var result = await _authService.RefreshAsync(request.RefreshToken);
        return Ok(result);
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        var refreshToken = Request.Headers["X-Refresh-Token"].FirstOrDefault()
            ?? throw AppExceptions.Unauthorized("Refresh token required");
        await _authService.LogoutAsync(refreshToken);
        return NoContent();
    }

    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        var result = await _authService.VerifyEmailAsync(request.Identifier, request.Code);
        return Ok(result);
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var result = await _authService.ForgotPasswordAsync(request.Email);
        return Ok(result);
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var result = await _authService.ResetPasswordAsync(request.Email, request.Code, request.NewPassword);
        return Ok(result);
    }

    [HttpGet("sessions")]
    [Authorize]
    public async Task<IActionResult> GetSessions()
    {
        var userId = User.GetUserId();   // Extension method from Helpers
        var sessions = await _authService.GetUserSessionsAsync(userId);
        return Ok(sessions);
    }

    [HttpPost("sessions/revoke")]
    [Authorize]
    public async Task<IActionResult> RevokeSession([FromBody] RevokeSessionRequest request)
    {
        var userId = User.GetUserId();
        await _authService.RevokeSessionAsync(userId, request.SessionId);
        return NoContent();
    }

    [HttpPost("resend-verification")]
    public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationRequest request)
    {
        await _authService.ResendVerificationAsync(request.Email);
        return Ok(new { message = "If the email exists, a verification code has been sent" });
    }
}
```

#### AdminController.cs

```csharp
namespace Cursinet.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService) { _adminService = adminService; }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var stats = await _adminService.GetDashboardStatsAsync();
        return Ok(stats);
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] UserQueryParams query)
    {
        var users = await _adminService.GetUsersAsync(query.Page, query.Limit, query.Search, query.Role);
        return Ok(users);
    }

    [HttpGet("users/{id}")]
    public async Task<IActionResult> GetUserDetail(Guid id)
    {
        var user = await _adminService.GetUserDetailAsync(id);
        return Ok(user);
    }

    [HttpPut("users/{id}/role")]
    public async Task<IActionResult> UpdateUserRole(Guid id, [FromBody] UpdateUserRoleRequest request)
    {
        var user = await _adminService.UpdateUserRoleAsync(id, request.Role);
        return Ok(user);
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> SoftDeleteUser(Guid id)
    {
        await _adminService.SoftDeleteUserAsync(id);
        return NoContent();
    }

    [HttpPost("users/{id}/activate")]
    public async Task<IActionResult> ActivateUser(Guid id)
    {
        await _adminService.ActivateUserAsync(id);
        return Ok(new { message = "User activated" });
    }

    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAuditLogs([FromQuery] PagedRequest query)
    {
        var logs = await _adminService.GetAuditLogsAsync(query.Page, query.Limit);
        return Ok(logs);
    }

    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments([FromQuery] PagedRequest query)
    {
        var payments = await _adminService.GetPaymentsAsync(query.Page, query.Limit);
        return Ok(payments);
    }
}
```

#### CursosController.cs

```csharp
namespace Cursinet.Api.Controllers;

[ApiController]
[Route("api/cursos")]
public class CursosController : ControllerBase
{
    private readonly ICursoService _cursoService;

    public CursosController(ICursoService cursoService) { _cursoService = cursoService; }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? categoria = null,
        [FromQuery] string? nivel = null,
        [FromQuery] string? estado = null)
    {
        var cursos = await _cursoService.GetPagedAsync(page, limit, search, categoria, nivel, estado);
        return Ok(cursos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var curso = await _cursoService.GetByIdAsync(id);
        return Ok(curso);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateCursoRequest request)
    {
        var curso = await _cursoService.CreateAsync(request);
        return StatusCode(201, curso);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCursoRequest request)
    {
        var curso = await _cursoService.UpdateAsync(id, request);
        return Ok(curso);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _cursoService.DeleteAsync(id);
        return NoContent();
    }

    [HttpPatch("{id}/estado")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ChangeEstado(Guid id, [FromBody] string estado)
    {
        var curso = await _cursoService.ChangeEstadoAsync(id, estado);
        return Ok(curso);
    }
}
```

### 7.3 Middleware

#### ErrorHandlingMiddleware.cs

Manejo global de errores. Captura `AppException` (errores operacionales) y `Exception` (errores inesperados), retornando respuestas JSON consistentes.

```csharp
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
            await context.Response.WriteAsJsonAsync(new
            {
                error = new
                {
                    code = ex.Code,
                    message = ex.Message,
                    statusCode = ex.StatusCode
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error");
            context.Response.StatusCode = 500;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new
            {
                error = new
                {
                    code = "INTERNAL_SERVER_ERROR",
                    message = "An unexpected error occurred",
                    statusCode = 500
                }
            });
        }
    }
}
```

#### RequestLoggingMiddleware (Serilog)

Se configura automáticamente con `app.UseSerilogRequestLogging()` en Program.cs. Logea cada request con método, ruta, status code, duración, e IP.

### 7.4 Filtros y Helpers

#### AuthGuardAttribute.cs — Filtro de Autorización Personalizado

```csharp
namespace Cursinet.Api.Filters;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class AuthGuardAttribute : Attribute, IAuthorizationFilter
{
    private readonly string[] _roles;

    public AuthGuardAttribute(params string[] roles)
    {
        _roles = roles;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;

        if (!user.Identity?.IsAuthenticated ?? true)
        {
            context.Result = new UnauthorizedObjectResult(new
            {
                error = new { code = "UNAUTHORIZED", message = "Authentication required" }
            });
            return;
        }

        if (_roles.Length > 0)
        {
            var userRole = user.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole == null || !_roles.Contains(userRole))
            {
                context.Result = new ForbiddenObjectResult(new
                {
                    error = new { code = "FORBIDDEN", message = "Insufficient permissions" }
                });
                return;
            }
        }
    }
}
```

#### ValidationFilter.cs — Filtro Global de Validación

```csharp
public class ValidationFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        if (!context.ModelState.IsValid)
        {
            var errors = context.ModelState
                .Where(e => e.Value?.Errors.Count > 0)
                .SelectMany(e => e.Value!.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();

            context.Result = new BadRequestObjectResult(new
            {
                error = new { code = "VALIDATION_ERROR", message = "Validation failed", details = errors }
            });
        }
    }

    public void OnActionExecuted(ActionExecutedContext context) { }
}
```

#### ClaimsPrincipalExtensions.cs — Helpers de Usuario

```csharp
namespace Cursinet.Api.Helpers;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user)
    {
        var claim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var userId) ? userId
            : throw new UnauthorizedException("Invalid user token");
    }

    public static string GetUserEmail(this ClaimsPrincipal user)
        => user.FindFirst(ClaimTypes.Email)?.Value
            ?? throw new UnauthorizedException("Email not found in token");

    public static string GetUserRole(this ClaimsPrincipal user)
        => user.FindFirst(ClaimTypes.Role)?.Value
            ?? throw new UnauthorizedException("Role not found in token");
}
```

### 7.5 DTOs de API

```csharp
// Api/DTOs/AuthRequests.cs
public record RegisterRequest(string Name, string Email, string Password);
public record LoginRequest(string Email, string Password);
public record RefreshTokenRequest(string RefreshToken);
public record VerifyEmailRequest(string Identifier, string Code);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Email, string Code, string NewPassword);
public record ResendVerificationRequest(string Email);
public record RevokeSessionRequest(Guid SessionId);

// Api/DTOs/AdminRequests.cs
public record UpdateUserRoleRequest(string Role);
public record UserQueryParams(int Page = 1, int Limit = 10, string? Search = null, string? Role = null);

// Api/DTOs/CursoRequests.cs
public record CreateCursoRequest(
    string Titulo, string? Descripcion, string? DescripcionCorta,
    Guid? CategoriaCursoId, string? Nivel, int DuracionHoras);

public record UpdateCursoRequest(
    string? Titulo, string? Descripcion, string? DescripcionCorta,
    Guid? CategoriaCursoId, string? Nivel, int? DuracionHoras, string? Estado);

// Api/DTOs/PagedRequest.cs
public record PagedRequest(int Page = 1, int Limit = 10);
```

---

## 8. Autenticación y Autorización

El sistema implementa **3 mecanismos de autenticación** + **RBAC**:

### 8.1 JWT (Access + Refresh Tokens)

**Flujo completo:**

```
1. Register / Login
   → Backend genera AccessToken (15 min) + RefreshToken (7 días)
   → RefreshToken se almacena en tabla `sessions`
   → Cliente recibe ambos tokens

2. Requests autenticados
   → Cliente envía AccessToken en header: Authorization: Bearer <token>
   → Backend valida JWT, extrae claims (userId, email, role)
   → Si expira → 401 Unauthorized

3. Refresh
   → Cliente envía RefreshToken a POST /api/auth/refresh
   → Backend valida token + verifica sesión activa en BD
   → Elimina sesión vieja → genera nuevos tokens + nueva sesión

4. Logout
   → Cliente envía RefreshToken en header X-Refresh-Token
   → Backend elimina sesión de la BD
   → Tokens restantes quedan inválidos al no haber sesión
```

**Claims incluidos en el JWT:**

| Claim | Tipo | Descripción |
|-------|------|-------------|
| `nameidentifier` | Guid | ID del usuario |
| `email` | string | Email del usuario |
| `role` | string | Rol (Staff/Admin) |
| `iat` | timestamp | Fecha de emisión |

### 8.2 API Key Authentication

Para autenticación **máquina-a-máquina** (servicios externos, webhooks, CI/CD).

```csharp
// Registro en Program.cs
builder.Services.AddAuthentication()
    .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, ...)
    .AddScheme<ApiKeyAuthenticationOptions, ApiKeyAuthenticationHandler>(
        "ApiKey", options => { });

// Uso en controladores
[ApiKeyAuth]  // Filtro personalizado
[HttpGet("external/data")]
public IActionResult GetExternalData() { ... }
```

**Implementación simplificada:**

```csharp
public class ApiKeyAuthenticationHandler : AuthenticationHandler<ApiKeyAuthenticationOptions>
{
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("X-API-Key", out var apiKey))
            return AuthenticateResult.Fail("API Key required");

        var validKey = Configuration["Jwt:ApiKey"];
        if (apiKey != validKey)
            return AuthenticateResult.Fail("Invalid API Key");

        var claims = new[] { new Claim(ClaimTypes.Role, "Service") };
        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);

        return AuthenticateResult.Success(ticket);
    }
}
```

### 8.3 Session Authentication

Las sesiones se manejan con **refresh tokens almacenados en BD**.

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| `POST /api/auth/login` | Público | Crea sesión al hacer login |
| `POST /api/auth/refresh` | Público | Rotación de sesión (vieja se elimina) |
| `POST /api/auth/logout` | Autenticado | Elimina sesión activa |
| `GET /api/auth/sessions` | Autenticado | Lista sesiones activas del usuario |
| `POST /api/auth/sessions/revoke` | Autenticado | Revoca una sesión específica |
| `POST /api/auth/reset-password` | Público | Elimina TODAS las sesiones del usuario |

**Limpieza automática:** El método `DeleteExpiredAsync()` en `SessionRepository` elimina sesiones vencidas. Debe ejecutarse periódicamente (ej: tarea programada o al inicio).

### 8.4 RBAC — Role-Based Access Control

**Roles del sistema:**

| Rol | Acceso |
|-----|--------|
| `Admin` | Acceso TOTAL: admin endpoints, CRUD todo, reportes, gestión de usuarios |
| `Staff` | Acceso limitado: contenido del curso, foros, perfil propio |

**Cómo se aplica en controladores:**

```csharp
// Opción 1: Atributo [Authorize] con roles
[Authorize(Roles = "Admin")]
[HttpDelete("users/{id}")]
public async Task<IActionResult> SoftDeleteUser(Guid id) { ... }

// Opción 2: Filtro personalizado AuthGuard
[AuthGuard("Admin", "Staff")]
[HttpGet("cursos")]
public async Task<IActionResult> GetCursos() { ... }

// Opción 3: Programático dentro del método
[Authorize]
[HttpPost("cursos")]
public async Task<IActionResult> CreateCurso([FromBody] CreateCursoRequest request)
{
    if (!User.IsInRole("Admin"))
        throw AppExceptions.Forbidden("Only admins can create courses");
    // ...
}
```

### 8.5 AuthorizeAttribute Personalizado

```csharp
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class RequireRoleAttribute : AuthorizeAttribute
{
    public RequireRoleAttribute(params string[] roles)
    {
        Roles = string.Join(",", roles);
    }
}
```

Uso:

```csharp
[RequireRole("Admin")]
[HttpPost("api/admin/users/{id}/role")]
```

---

## 9. API Reference Completa

### 9.1 Auth — `/api/auth`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/register` | ❌ | Registrar nuevo usuario |
| POST | `/api/auth/login` | ❌ | Iniciar sesión |
| POST | `/api/auth/refresh` | ❌ | Refrescar tokens |
| POST | `/api/auth/logout` | ✅ JWT | Cerrar sesión |
| POST | `/api/auth/verify-email` | ❌ | Verificar email con código |
| POST | `/api/auth/forgot-password` | ❌ | Solicitar reset de password |
| POST | `/api/auth/reset-password` | ❌ | Resetear password |
| POST | `/api/auth/resend-verification` | ❌ | Reenviar código de verificación |
| GET | `/api/auth/sessions` | ✅ JWT | Listar sesiones activas |
| POST | `/api/auth/sessions/revoke` | ✅ JWT | Revocar sesión |

### 9.2 Admin — `/api/admin`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/admin/dashboard` | Admin | Estadísticas del dashboard |
| GET | `/api/admin/users` | Admin | Listar usuarios (paginado + filtros) |
| GET | `/api/admin/users/{id}` | Admin | Detalle de usuario |
| PUT | `/api/admin/users/{id}/role` | Admin | Actualizar rol de usuario |
| DELETE | `/api/admin/users/{id}` | Admin | Soft delete usuario |
| POST | `/api/admin/users/{id}/activate` | Admin | Reactivar usuario |
| GET | `/api/admin/audit-logs` | Admin | Logs de auditoría |
| GET | `/api/admin/payments` | Admin | Historial de pagos |

### 9.3 Cursos — `/api/cursos`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/cursos` | ❌ | Listar cursos (paginado + filtros) |
| GET | `/api/cursos/{id}` | ❌ | Detalle del curso con clases y módulos |
| POST | `/api/cursos` | Admin | Crear curso |
| PUT | `/api/cursos/{id}` | Admin | Actualizar curso |
| DELETE | `/api/cursos/{id}` | Admin | Eliminar curso |
| PATCH | `/api/cursos/{id}/estado` | Admin | Cambiar estado (borrador/publicado/archivado) |

### 9.4 Clases — `/api/clases`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/clases?cursoId={id}` | ❌ | Listar clases de un curso |
| GET | `/api/clases/{id}` | ❌ | Detalle de clase con módulos y lecciones |
| POST | `/api/clases` | Admin | Crear clase |
| PUT | `/api/clases/{id}` | Admin | Actualizar clase |
| DELETE | `/api/clases/{id}` | Admin | Eliminar clase |

### 9.5 Categorías — `/api/categorias`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/categorias` | ❌ | Listar todas las categorías |
| POST | `/api/categorias` | Admin | Crear categoría |
| PUT | `/api/categorias/{id}` | Admin | Actualizar categoría |
| DELETE | `/api/categorias/{id}` | Admin | Eliminar categoría |

### 9.6 Inscripciones — `/api/inscripciones`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/inscripciones/mis-cursos` | ✅ JWT | Cursos del usuario autenticado |
| GET | `/api/inscripciones/curso/{cursoId}` | Admin | Estudiantes inscritos en un curso |
| POST | `/api/inscripciones` | ✅ JWT | Inscribirse a un curso |
| DELETE | `/api/inscripciones/{id}` | Admin | Cancelar inscripción |
| GET | `/api/inscripciones/{id}/progreso` | ✅ JWT | Progreso del estudiante |
| PUT | `/api/inscripciones/{id}/progreso` | ✅ JWT | Actualizar progreso de lección |

### 9.7 Evaluaciones — `/api/evaluaciones`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/evaluaciones/curso/{cursoId}` | ❌ | Evaluaciones de un curso |
| GET | `/api/evaluaciones/{id}` | ❌ | Detalle de evaluación con preguntas |
| POST | `/api/evaluaciones` | Admin | Crear evaluación |
| PUT | `/api/evaluaciones/{id}` | Admin | Actualizar evaluación |
| DELETE | `/api/evaluaciones/{id}` | Admin | Eliminar evaluación |
| POST | `/api/evaluaciones/{id}/intentos` | ✅ JWT | Iniciar/Enviar intento |
| GET | `/api/evaluaciones/{id}/intentos/mis` | ✅ JWT | Mis intentos en evaluación |

### 9.8 Foros — `/api/foros`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/foros/curso/{cursoId}` | ❌ | Foros de un curso |
| GET | `/api/foros/{id}` | ❌ | Detalle del foro con mensajes |
| POST | `/api/foros` | Admin | Crear foro |
| DELETE | `/api/foros/{id}` | Admin | Eliminar foro |
| POST | `/api/foros/{id}/mensajes` | ✅ JWT | Publicar mensaje |
| DELETE | `/api/foros/mensajes/{id}` | ✅ JWT | Eliminar mensaje propio |
| POST | `/api/foros/mensajes/{id}/like` | ✅ JWT | Dar/Quitar like |

### 9.9 Archivos — `/api/archivos`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/archivos/upload` | ✅ JWT | Subir archivo |
| GET | `/api/archivos/{id}` | ❌ | Descargar archivo |
| DELETE | `/api/archivos/{id}` | Admin | Eliminar archivo |

### 9.10 Pagos — `/api/pagos`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/pagos/mis-pagos` | ✅ JWT | Historial de pagos del usuario |
| POST | `/api/pagos` | ✅ JWT | Crear pago/transacción |
| GET | `/api/pagos/{id}` | ✅ JWT | Detalle del pago |

### 9.11 System

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/health` | ❌ | Health check del servidor |
| GET | `/swagger` | ❌ | Documentación Swagger UI (Dev) |

---

## 10. Entity Framework Core

### 10.1 Comandos de Migraciones

```bash
# === IMPORTANTE: Ejecutar desde el proyecto Infrastructure ===
cd backend/src/Infrastructure

# Crear una migración
dotnet ef migrations add NombreDescriptivo \
    --startup-project ../Api/Cursinet.Api.csproj

# Aplicar migraciones a la BD
dotnet ef database update \
    --startup-project ../Api/Cursinet.Api.csproj

# Revertir última migración
dotnet ef migrations remove \
    --startup-project ../Api/Cursinet.Api.csproj

# Revertir a una migración específica
dotnet ef database update NombreMigracionAnterior \
    --startup-project ../Api/Cursinet.Api.csproj

# Generar script SQL
dotnet ef migrations script \
    --startup-project ../Api/Cursinet.Api.csproj \
    -o ../Migrations/script.sql

# Ver migraciones pendientes
dotnet ef migrations list \
    --startup-project ../Api/Cursinet.Api.csproj

# Aplicar en producción (desde el proyecto Api)
cd backend/src/Api
ASPNETCORE_ENVIRONMENT=Production dotnet ef database update
```

### 10.2 Seed Data

El seed se ejecuta al iniciar la aplicación por primera vez. Crea un **Admin por defecto** y **categorías iniciales**.

```csharp
// Infrastructure/Persistence/ApplicationDbContextSeed.cs
public static class ApplicationDbContextSeed
{
    public static async Task SeedAsync(ApplicationDbContext context, IPasswordService passwordService)
    {
        // Solo seed si no hay usuarios
        if (await context.Users.AnyAsync()) return;

        // === ADMIN POR DEFECTO ===
        var adminId = Guid.NewGuid();
        var admin = new User
        {
            Id = adminId,
            Name = "Admin",
            Email = "admin@cursinet.com",
            EmailVerified = true,
            Role = "Admin",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var hashedPassword = passwordService.HashPassword("Admin123!");
        var account = new Account
        {
            Id = Guid.NewGuid(),
            AccountId = adminId.ToString(),
            ProviderId = "credentials",
            UserId = adminId,
            Password = hashedPassword,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Users.Add(admin);
        context.Accounts.Add(account);

        // === CATEGORÍAS INICIALES ===
        var categorias = new List<CategoriaCurso>
        {
            new() { Id = Guid.NewGuid(), Nombre = "Backend", Descripcion = "Desarrollo del lado del servidor", Color = "#2563eb", Icono = "server" },
            new() { Id = Guid.NewGuid(), Nombre = "Frontend", Descripcion = "Desarrollo del lado del cliente", Color = "#7c3aed", Icono = "code" },
            new() { Id = Guid.NewGuid(), Nombre = "DevOps", Descripcion = "Infraestructura y despliegue", Color = "#059669", Icono = "cloud" },
            new() { Id = Guid.NewGuid(), Nombre = "Mobile", Descripcion = "Desarrollo de aplicaciones móviles", Color = "#dc2626", Icono = "smartphone" },
            new() { Id = Guid.NewGuid(), Nombre = "Data Science", Descripcion = "Ciencia de datos y Machine Learning", Color = "#d97706", Icono = "chart" },
        };

        context.CategoriaCursos.AddRange(categorias);
        await context.SaveChangesAsync();
    }
}
```

**Registro en Program.cs:**

```csharp
// Después de app.Build()
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var passwordService = scope.ServiceProvider.GetRequiredService<IPasswordService>();
    await context.Database.MigrateAsync();  // Aplica migraciones automáticamente
    await ApplicationDbContextSeed.SeedAsync(context, passwordService);
}
```

### 10.3 Soft Delete — Global Query Filter

```csharp
// UserConfiguration.cs
builder.HasQueryFilter(u => u.DeletedAt == null);
```

**¿Qué hace?** Todas las queries LINQ contra `Users` incluyen automáticamente `WHERE DeletedAt IS NULL`. Para incluir usuarios eliminados:

```csharp
// Si necesitas incluir eliminados (solo Admin)
var allUsers = await _context.Users
    .IgnoreQueryFilters()
    .ToListAsync();
```

---

## 11. Comandos Útiles

### Desarrollo

```bash
# Compilar solución
dotnet build

# Compilar sin cache
dotnet build --no-cache

# Ejecutar API (puerto 5000)
dotnet run --project src/Api

# Ejecutar con perfil específico
dotnet run --project src/Api --launch-profile http

# Hot Reload (recarga automática)
dotnet watch run --project src/Api
```

### Tests

```bash
# Ejecutar todos los tests
dotnet test

# Ejecutar tests con cobertura
dotnet test --collect:"XPlat Code Coverage"

# Ejecutar tests específicos
dotnet test --filter "FullyQualifiedName~AuthService"
```

### EF Core

```bash
# Ver migraciones
dotnet ef migrations list --startup-project src/Api --project src/Infrastructure

# Crear migración
dotnet ef migrations add MigrationName --startup-project src/Api --project src/Infrastructure

# Aplicar a BD
dotnet ef database update --startup-project src/Api --project src/Infrastructure

# Revertir
dotnet ef migrations remove --startup-project src/Api --project src/Infrastructure

# Script SQL
dotnet ef migrations script --startup-project src/Api --project src/Infrastructure -o migration.sql
```

### Gestión de Paquetes

```bash
# Agregar paquete NuGet
dotnet add package NombreDelPaquete

# Actualizar paquetes
dotnet update package

# Ver paquetes con actualizaciones
dotnet list package --outdated
```

### PostgreSQL

```bash
# Conectar a la BD
sudo -u postgres psql -d cursinet

# Comandos útiles en psql
\dt              # Listar tablas
\d+ users        # Estructura de tabla
\l               # Listar bases de datos
\du              # Listar usuarios

# Backup/Restore
pg_dump -U cursinet cursinet > backup.sql
psql -U cursinet cursinet < backup.sql
```

---

## 12. Guía de Desarrollo

### 12.1 Flujo para Agregar una Nueva Entidad

1. **Domain**: Crear la entidad en `Domain/Entities/`
2. **Application**:
   - Crear interfaz de repositorio en `Application/Common/Interfaces/`
   - Crear DTOs en `Application/Features/{Modulo}/`
   - Crear servicio de aplicación en `Application/Features/{Modulo}/`
   - Actualizar `MappingProfile.cs`
3. **Infrastructure**:
   - Crear configuración EF en `Infrastructure/Persistence/Configurations/`
   - Crear repositorio en `Infrastructure/Persistence/Repositories/`
   - Crear migración con `dotnet ef migrations add`
4. **Api**:
   - Crear DTOs de request en `Api/DTOs/`
   - Crear controlador en `Api/Controllers/`
   - Agregar validación con FluentValidation si es necesario
   - Registrar en `Program.cs`

### 12.2 Convenciones de Código

| Aspecto | Convención |
|---------|------------|
| **Nombres de tablas** | snake_case plural (users, cursos, clases) |
| **Nombres de columnas** | PascalCase en C#, snake_case en BD (configuración manual) |
| **IDs** | Guid con `gen_random_uuid()` de PostgreSQL |
| **Timestamps** | `CreatedAt`, `UpdatedAt` en toda entidad |
| **Soft delete** | `DeletedAt` nullable + `HasQueryFilter` |
| **Relaciones** | Navigation properties con `ICollection<T>` |
| **Cascading deletes** | `Cascade` para relaciones padre-hijo, `SetNull` para opcionales |
| **Endpoints** | Plural, kebab-case: `/api/cursos`, `/api/inscripciones` |
| **DTOs de entrada** | Record types con validación FluentValidation |
| **DTOs de salida** | Record types con AutoMapper desde entidades |
| **Errores** | `AppException` con StatusCode + Code + message |
| **Async** | Todos los métodos de repositorio/servicio asíncronos |

### 12.3 Testing

```csharp
// tests/Cursinet.Tests/Services/AuthServiceTests.cs
public class AuthServiceTests
{
    [Fact]
    public async Task RegisterAsync_WithNewEmail_CreatesUserAndAccount()
    {
        // Arrange
        var userRepo = new Mock<IUserRepository>();
        userRepo.Setup(x => x.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
        // ... setup otros mocks

        var service = new AuthService(/* mocks */);

        // Act
        var result = await service.RegisterAsync(new RegisterRequest("Test", "test@test.com", "Password123"));

        // Assert
        Assert.NotNull(result);
        Assert.Equal("test@test.com", result.User.Email);
    }

    [Fact]
    public async Task RegisterAsync_WithExistingEmail_ThrowsConflict()
    {
        // Arrange
        var userRepo = new Mock<IUserRepository>();
        userRepo.Setup(x => x.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync(new User());
        var service = new AuthService(/* mocks */);

        // Act & Assert
        await Assert.ThrowsAsync<AppException>(() =>
            service.RegisterAsync(new RegisterRequest("Test", "existing@test.com", "Password123")));
    }
}
```

---

## 13. Resumen de Patrones y Principios

### Patrón Clean Architecture

```
┌──────────────────────────────────────┐
│           API (Controllers)          │  🌐 Depende de Infrastructure + Application
├──────────────────────────────────────┤
│        Infrastructure (EF, JWT)      │  🗄️ Depende de Application
├──────────────────────────────────────┤
│         Application (Services)       │  ⚙️ Depende de Domain
├──────────────────────────────────────┤
│           Domain (Entities)          │  🧱 Sin dependencias
└──────────────────────────────────────┘
```

### Principios Aplicados

| Principio | Cómo se aplica |
|-----------|---------------|
| **Single Responsibility (SRP)** | Cada clase tiene una responsabilidad: entidad, repositorio, servicio, controlador |
| **Open/Closed** | Repositorios y servicios se programan contra interfaces, abiertos a extensión |
| **Liskov Substitution** | Implementaciones de interfaces pueden intercambiarse sin afectar consumidores |
| **Interface Segregation** | Interfaces específicas por entidad (IUserRepository, ICursoRepository) |
| **Dependency Inversion (DIP)** | Capas altas (Api) dependen de abstracciones, no de implementaciones concretas |
| **Don't Repeat Yourself** | Excepciones centralizadas, mapping con AutoMapper, validación con FluentValidation |
| **Fail Fast** | Validación temprana con AppException, estado inválido → error inmediato |
| **Explicit Dependencies** | Todas las dependencias se inyectan por constructor |
| **Persistence Ignorance** | Domain entities NO tienen atributos de EF ni herencia de frameworks |

### Patrones Implementados

| Patrón | Dónde |
|--------|-------|
| **Repository Pattern** | Infrastructure/Persistence/Repositories |
| **Unit of Work** | ApplicationDbContext + SaveChangesAsync |
| **Service Layer** | Application/Features/* |
| **DTO Pattern** | Application/Features/* + Api/DTOs |
| **AutoMapper** | Application/Common/Mapping |
| **FluentValidation** | Validadores por request |
| **Middleware Pattern** | Api/Middleware/ErrorHandlingMiddleware |
| **Options Pattern** | IConfiguration para JWT, ConnectionStrings |
| **Soft Delete** | HasQueryFilter en UserConfiguration |
| **Pagination** | PagedResult<T> + Skip/Take en repositorios |
| **Global Exception Handling** | ErrorHandlingMiddleware |
| **CQRS Lite** | Separación de commands y queries en servicios |
| **Factory Method** | AppExceptions helpers |
| **Strategy** | Múltiples esquemas de auth (JWT, API Key) |

### Mapa de Dependencias entre Proyectos

```
Cursinet.Api
  ├── Cursinet.Application
  │     └── Cursinet.Domain
  └── Cursinet.Infrastructure
        ├── Cursinet.Application
        │     └── Cursinet.Domain
        └── Cursinet.Domain
```

**Proyectos de la solución:**
```
Cursinet.sln
├── src/Domain/Cursinet.Domain.csproj       → classlib, net10.0
├── src/Application/Cursinet.Application.csproj → classlib, net10.0
├── src/Infrastructure/Cursinet.Infrastructure.csproj → classlib, net10.0
└── src/Api/Cursinet.Api.csproj             → webapi, net10.0
```

---

> **📝 Nota:** Este manual cubre la totalidad del backend Cursinet. Para temas específicos (frontend React, deploy, Docker), consultar los manuales correspondientes.

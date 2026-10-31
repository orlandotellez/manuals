# Guía completa de Entity Framework Core

## Índice

- [¿Qué es EF Core?](#qué-es-ef-core)
- [Arquitectura del proyecto (Cursinet)](#arquitectura-del-proyecto-cursinet)
- [Instalación inicial (desde 0)](#instalación-inicial-desde-0)
- [Dependencias entre proyectos](#dependencias-entre-proyectos)
- [El DbContext](#el-dbcontext)
- [Configuración de entidades (Fluent API)](#configuración-de-entidades-fluent-api)
- [Migraciones](#migraciones)
- [PostgreSQL: funciones UUID](#postgresql-funciones-uuid)
- [CRUD básico con EF Core](#crud-básico-con-ef-core)
- [Relaciones entre entidades](#relaciones-entre-entidades)
- [Consultas con LINQ](#consultas-con-linq)
- [Resolución de problemas comunes](#resolución-de-problemas-comunes)
- [Inyección de dependencias](#inyección-de-dependencias)
- [Buenas prácticas](#buenas-prácticas)
- [Resumen del flujo de desarrollo](#resumen-del-flujo-de-desarrollo)
- [Referencia rápida de comandos](#referencia-rápida-de-comandos)

---

## ¿Qué es EF Core?

Entity Framework Core (EF Core) es un ORM (Object-Relational Mapper) que te permite trabajar con bases de datos relacionales usando objetos de C#. En lugar de escribir SQL puro, trabajas con `DbSet<T>`, LINQ, y tus entidades de dominio.

---

## Arquitectura del proyecto (Cursinet)

```
backend/
├── src/
│   ├── Domain/                   ← Entidades (POCOs, sin EF)
│   │   └── Entities/
│   │       ├── User.cs
│   │       ├── Account.cs
│   │       ├── Session.cs
│   │       └── Verification.cs
│   │
│   ├── Infrastructure/           ← EF Core, DbContext, migraciones
│   │   └── Persistence/
│   │       ├── ApplicationDbContext.cs
│   │       ├── Configurations/   ← Fluent API (IEntityTypeConfiguration)
│   │       │   ├── UserConfiguration.cs
│   │       │   ├── AccountConfiguration.cs
│   │       │   ├── SessionConfiguration.cs
│   │       │   └── VerificationConfiguration.cs
│   │       ├── Repositories/     ← Repositorios que usan DbContext
│   │       └── Migrations/       ← Archivos de migración generados
│   │
│   ├── Api/                      ← Startup, DI, Program.cs
│   └── Application/              ← Servicios, interfaces
│
├── ef.md                         ← Esta guía
```

**Regla de oro:** Domain NO conoce EF. Infrastructure implementa los repositorios y tiene el DbContext. Api registra todo en DI.

---

## Instalación inicial (desde 0)

### 1. Instalar los paquetes NuGet

En el proyecto de **Infrastructure** (donde va el DbContext):

```bash
dotnet add src/Infrastructure/Infrastructure.csproj package Microsoft.EntityFrameworkCore
dotnet add src/Infrastructure/Infrastructure.csproj package Npgsql.EntityFrameworkCore.PostgreSQL
```

En el proyecto de **Api** (startup, para herramientas de diseño):

```bash
dotnet add src/Api/Api.csproj package Microsoft.EntityFrameworkCore.Design
```

> **⚠️ Importante:** `Microsoft.EntityFrameworkCore.Design` solo va en el startup project (Api), con `PrivateAssets=all` para que no se propague como dependencia.

### 2. Configurar la connection string

`src/Api/appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=cursinet_db;Username=dev-espada;Password=espadaPOSTGRES"
  }
}
```

Formato de connection string para PostgreSQL:
```
Host=localhost;Database=nombre_bd;Username=tu_usuario;Password=tu_password
```

### 3. Registrar DbContext en DI

`src/Api/Program.cs`:
```csharp
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Database=cursinet_db;Username=dev-espada;Password=espadaPOSTGRES";

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString, b => b.MigrationsAssembly("Infrastructure")));
```

> **⚠️ El parámetro `MigrationsAssembly`** debe ser el **nombre del assembly** (nombre del `.csproj`), NO el namespace. Si tu proyecto se llama `Infrastructure.csproj`, el assembly es `"Infrastructure"`, aunque el `RootNamespace` sea `Cursinet.Infrastructure`.

---

## Dependencias entre proyectos

Para que las migraciones funcionen, los proyectos tienen que referenciarse así:

```
Api ───→ Infrastructure ───→ Application ───→ Domain
  │                            │
  └──→ Application ────────────┘
```

- **Infrastructure** necesita referencia a Application (para las interfaces de repositorios) y Domain (para las entidades)
- **Api** necesita referencia a Infrastructure (para el DbContext) y Application (para los servicios)
- **Application** solo referencia a Domain

---

## El DbContext

`src/Infrastructure/Persistence/ApplicationDbContext.cs`:
```csharp
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    // DbSet por cada entidad → una tabla
    public DbSet<User> Users => Set<User>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<Verification> Verifications => Set<Verification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Escanea el assembly y aplica TODAS las IEntityTypeConfiguration
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
```

> `ApplyConfigurationsFromAssembly` busca todas las clases que implementan `IEntityTypeConfiguration<T>` en ese assembly y las aplica automáticamente. No hace falta registrarlas una por una.

---

## Configuración de entidades (Fluent API)

En lugar de usar Data Annotations (`[Required]`, `[MaxLength]`) en las entidades de Domain, separamos la configuración en archivos dedicados. Esto mantiene Domain limpio de dependencias de infraestructura.

### Estructura de una configuración

`UserConfiguration.cs`:
```csharp
public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        // 1. Nombre de la tabla
        builder.ToTable("Users");

        // 2. Llave primaria
        builder.HasKey(u => u.Id);

        // 3. Propiedades
        builder.Property(u => u.Id).HasDefaultValueSql("uuid_generate_v4()");
        builder.Property(u => u.Name).IsRequired().HasColumnName("name").HasMaxLength(255);
        builder.Property(u => u.Email).IsRequired().HasColumnName("email").HasMaxLength(255);
        builder.Property(u => u.Role).HasColumnName("role").HasConversion<int>().HasDefaultValue(UserRole.Student);

        // 4. Índices
        builder.HasIndex(u => u.Email).IsUnique();
        builder.HasIndex(u => u.Role);
        builder.HasIndex(u => u.CreatedAt).HasDatabaseName("idx_users_created_at");

        // 5. Default values
        builder.Property(u => u.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        builder.Property(u => u.IsActive).HasDefaultValue(true);
        builder.Property(u => u.EmailVerified).HasDefaultValue(false);
    }
}
```

### Guía rápida de métodos de configuración

| Método | Para qué sirve |
|--------|----------------|
| `.ToTable("nombre")` | Define el nombre de la tabla en la DB |
| `.HasKey(x => x.Id)` | Define la llave primaria |
| `.Property(x => x.Nombre)` | Configura una columna |
| `.IsRequired()` | NOT NULL |
| `.HasColumnName("name")` | Nombre de la columna en la DB (snake_case) |
| `.HasMaxLength(255)` | VARCHAR(255) |
| `.HasDefaultValue(true)` | DEFAULT con valor fijo |
| `.HasDefaultValueSql("CURRENT_TIMESTAMP")` | DEFAULT con expresión SQL |
| `.HasConversion<int>()` | Guarda un enum como int |
| `.ValueGeneratedOnAdd()` | Valor generado al insertar |
| `.HasIndex(x => x.Email)` | Crea un índice |
| `.IsUnique()` | Índice único (se aplica al HasIndex) |
| `.HasDatabaseName("idx_nombre")` | Nombre personalizado para el índice |

### Convención de nombres en la DB

En C# usamos **PascalCase** (`CreatedAt`), pero en PostgreSQL usamos **snake_case** (`created_at`). Mapeamos con `.HasColumnName()`:

```csharp
builder.Property(u => u.CreatedAt).HasColumnName("created_at");
builder.Property(u => u.StripeCustomerId).HasColumnName("stripe_customer_id");
```

---

## Migraciones

### Flujo de trabajo

```
1. Modificás entidades en Domain
2. Creás/configurás Configurations en Infrastructure
3. Ejecutás migrations add
4. Revisás el archivo generado
5. Ejecutás database update
```

### Comandos esenciales

```bash
# Todos los comandos se ejecutan desde backend/
# -s : startup project (donde está Program.cs)
# -p : target project (donde está el DbContext)
```

| Comando | Para qué sirve |
|---------|----------------|
| `dotnet ef migrations add Nombre -s src/Api/Api.csproj -p src/Infrastructure/Infrastructure.csproj` | Crea archivos de migración (NO toca la DB) |
| `dotnet ef database update -s src/Api/Api.csproj -p src/Infrastructure/Infrastructure.csproj` | Aplica las migraciones pendientes a la DB |
| `dotnet ef migrations remove -s src/Api/Api.csproj -p src/Infrastructure/Infrastructure.csproj` | Borra la última migración (si no se aplicó) |
| `dotnet ef migrations list -s src/Api/Api.csproj -p src/Infrastructure/Infrastructure.csproj` | Lista las migraciones y su estado |
| `dotnet ef database drop -s src/Api/Api.csproj -p src/Infrastructure/Infrastructure.csproj` | ELIMINA la base de datos (cuidado) |
| `dotnet ef migrations script -s src/Api/Api.csproj -p src/Infrastructure/Infrastructure.csproj` | Genera el script SQL de las migraciones |

### ¿Qué pasa con cada comando?

**`migrations add InitialCreate`**:
- Escanea las entidades y configuraciones
- Compara con el snapshot (modelo previo)
- Genera:
  - `Migrations/20260527053502_InitialCreate.cs` ← código C# con Up() y Down()
  - `Migrations/20260527053502_InitialCreate.Designer.cs` ← metadatos
  - `Migrations/ApplicationDbContextModelSnapshot.cs` ← snapshot del modelo actual
- NO toca la base de datos

**`database update`**:
- Conecta a PostgreSQL
- Revisa `__EFMigrationsHistory` para ver qué migraciones ya se aplicaron
- Ejecuta las pendientes en orden
- Crea la base de datos si no existe

### ¿Qué es `__EFMigrationsHistory`?

Es una tabla que EF Core crea automáticamente en la DB para llevar el control de qué migraciones se aplicaron:

```sql
TABLE "__EFMigrationsHistory" (
    "MigrationId"    VARCHAR(150) PRIMARY KEY,
    "ProductVersion" VARCHAR(32)
);
```

### Error común: "The model has pending changes"

```
The model for context 'ApplicationDbContext' has pending changes.
Add a new migration before updating the database.
```

**Por qué pasa:** El snapshot del modelo no coincide con el estado actual de las entidades/configuraciones. Esto puede pasar cuando:
- Modificaste entidades pero no creaste una migración
- Removiste migraciones manualmente
- Editaste archivos de migración a mano

**Solución:**
```bash
# Crear una nueva migración que capture los cambios
dotnet ef migrations add SyncModel -s src/Api/Api.csproj -p src/Infrastructure/Infrastructure.csproj
dotnet ef database update -s src/Api/Api.csproj -p src/Infrastructure/Infrastructure.csproj
```

---

## PostgreSQL: funciones UUID

En PostgreSQL hay **dos formas** de generar UUIDs automáticos:

| Función | Requisito | Disponible desde |
|---------|-----------|------------------|
| `uuid_generate_v4()` | Extensión `uuid-ossp` | PG 8.2+ |
| `gen_random_uuid()` | **Nativo** (sin extensiones) | PG 13+ |

### Para usar `gen_random_uuid()` (recomendado en PG 13+)

Cambiá en los archivos de configuración:
```csharp
builder.Property(u => u.Id).HasDefaultValueSql("gen_random_uuid()");
```

### Para usar `uuid_generate_v4()`

Habilitá la extensión en PostgreSQL:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

> **⚠️ Importante:** Si cambiás el `HasDefaultValueSql` en las configuraciones, tenés que crear una NUEVA migración (`migrations add`) para que se refleje el cambio. Editar la migración a mano funciona pero es mala práctica.

---

## CRUD básico con EF Core

Los repositorios reciben `ApplicationDbContext` por inyección de dependencias.

### Create (INSERT)

```csharp
public async Task<User> CreateAsync(User user)
{
    await _context.Users.AddAsync(user);
    await _context.SaveChangesAsync();
    return user;
}
```

### Read (SELECT)

```csharp
// Obtener todos
var users = await _context.Users.ToListAsync();

// Obtener uno por ID
var user = await _context.Users.FindAsync(id);

// Obtener uno con filtro (FirstOrDefault)
var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

// Filtrar con Where
var activeUsers = await _context.Users.Where(u => u.DeletedAt == null).ToListAsync();

// Proyección (SELECT específico)
var emails = await _context.Users
    .Where(u => u.IsActive)
    .Select(u => u.Email)
    .ToListAsync();
```

### Update (UPDATE)

```csharp
// Opción 1: Marcar como modificado
var user = await _context.Users.FindAsync(id);
user.Name = "Nuevo nombre";
await _context.SaveChangesAsync();

// Opción 2: Update explícito
_context.Users.Update(user);
await _context.SaveChangesAsync();
```

### Delete (DELETE)

```csharp
// Físico (borra de verdad)
_context.Users.Remove(user);
await _context.SaveChangesAsync();

// Soft-delete (marca como borrado)
user.DeletedAt = DateTime.UtcNow;
_context.Users.Update(user);
await _context.SaveChangesAsync();
```

### AsNoTracking (solo lectura)

Cuando solo necesitás leer datos sin trackear cambios (más rápido):
```csharp
var users = await _context.Users
    .AsNoTracking()
    .Where(u => u.IsActive)
    .ToListAsync();
```

---

## Relaciones entre entidades

### Uno a muchos (User → Session, User → Account)

En `Session.cs` (entidad hija):
```csharp
public Guid UserId { get; set; }
public User User { get; set; } = null!;
```

En `SessionConfiguration.cs`:
```csharp
builder.HasOne(s => s.User)        // Session tiene un User
    .WithMany()                    // User tiene muchas Sessions
    .HasForeignKey(s => s.UserId)  // FK: Session.UserId → User.Id
    .OnDelete(DeleteBehavior.Cascade);
```

### ¿`WithMany()` o `WithMany(u => u.Sessions)`?

- **`WithMany()`** sin parámetro: la entidad padre NO tiene una colección de navegación (User no tiene `List<Session>`)
- **`WithMany(u => u.Sessions)`**: la entidad padre tiene una colección de navegación

### DeleteBehavior

| Comportamiento | Efecto |
|----------------|--------|
| `Cascade` | Borra usuario → borra sus sessions |
| `Restrict` | No deja borrar usuario si tiene sessions |
| `SetNull` | Borra usuario → pone UserId = NULL |
| `NoAction` | No hace nada (puede dar error de FK) |

---

## Consultas con LINQ

### Operadores básicos

```csharp
// WHERE
_context.Users.Where(u => u.Role == UserRole.Admin)

// ORDER BY
_context.Users.OrderBy(u => u.CreatedAt)
_context.Users.OrderByDescending(u => u.LastSeenAt)

// SKIP / TAKE (paginación)
_context.Users.Skip(10).Take(20)

// COUNT
await _context.Users.CountAsync()
await _context.Users.CountAsync(u => u.IsActive)

// ANY / ALL
await _context.Users.AnyAsync(u => u.Email == email)
await _context.Users.AllAsync(u => u.EmailVerified)

// SELECT específico
_context.Users.Select(u => new { u.Id, u.Email })
```

### Filtros comunes

```csharp
// Contains (LIKE '%texto%')
_context.Users.Where(u => u.Name.Contains("García"))

// StartsWith / EndsWith
_context.Users.Where(u => u.Name.StartsWith("Mar"))
_context.Users.Where(u => u.Email.EndsWith("@gmail.com"))

// Comparación de fechas
_context.Users.Where(u => u.CreatedAt >= DateTime.UtcNow.AddDays(-7))

// Múltiples condiciones
_context.Users.Where(u => u.IsActive && u.DeletedAt == null && u.Role == UserRole.Student)
```

---

## Resolución de problemas comunes

### "Could not load file or assembly 'Cursinet.Infrastructure'"

```
Could not load file or assembly 'Cursinet.Infrastructure'
```

**Causa:** El `MigrationsAssembly` apunta a un nombre de assembly incorrecto.

**Solución:** En `Program.cs`:
```csharp
// ❌ MAL - RootNamespace no es el assembly name
options.UseNpgsql(cs, b => b.MigrationsAssembly("Cursinet.Infrastructure"));

// ✅ BIEN - Nombre del archivo .csproj (sin extensión)
options.UseNpgsql(cs, b => b.MigrationsAssembly("Infrastructure"));
```

### "uuid_generate_v4() does not exist"

```
42883: no existe la función uuid_generate_v4()
```

**Causa:** La extensión `uuid-ossp` no está instalada en PostgreSQL.

**Solución 1 — Instalar la extensión (recomendado si ya tenés migraciones con `uuid_generate_v4()`):**
```sql
psql -U tu_usuario -d tu_base -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

**Solución 2 — Usar `gen_random_uuid()` (NGATIVO en PG 13+, sin extensiones):**
En cada configuración:
```csharp
builder.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
```
Y crear una nueva migración.

### "Some services are not able to be constructed"

```
Some services are not able to be constructed
(Error while validating the service descriptor 'ServiceType: IAuthService...'
 Unable to resolve service for type 'IPasswordService'...)
```

**Causa:** Un servicio registrado en DI tiene dependencias que NO están registradas.

**Solución:** Registrar la dependencia faltante:
```csharp
builder.Services.AddScoped<IPasswordService, PasswordService>();
```
O un mock temporal mientras desarrollás:
```csharp
builder.Services.AddScoped<IPasswordService, TemporaryPasswordMock>();
```

### "Cannot be resolved... DbContextOptions"

```
Unable to resolve service for type 'DbContextOptions<ApplicationDbContext>'
while attempting to activate 'ApplicationDbContext'
```

**Causa CASI SIEMPRE es cascada de otro error.** El DI container no pudo construirse por otro problema (servicio faltante), y EF Core no puede resolver el DbContext.

**Solución:** Fijate en el error de arriba — hay un error previo de "Some services are not able to be constructed". Arreglá ESE y este se resuelve solo.

### Error al remover migración

Cuando corrés `migrations remove` y falla porque la migración ya se aplicó a la DB:

```bash
# Forzar remover (solo borra los archivos, no toca la DB)
dotnet ef migrations remove --force -s src/Api/Api.csproj -p src/Infrastructure/Infrastructure.csproj
```

Después, si querés revertir la DB:
```bash
# Volver a la migración anterior
dotnet ef database update NombreMigracionAnterior -s src/Api/Api.csproj -p src/Infrastructure/Infrastructure.csproj
```

### Resetear todas las migraciones (desarrollo)

⚠️ **Esto borra TODOS los datos de la base de datos.**

```bash
# 1. Dropear la base de datos
dotnet ef database drop --force -s src/Api/Api.csproj -p src/Infrastructure/Infrastructure.csproj

# 2. Borrar carpeta de migraciones
rm -rf src/Infrastructure/Migrations

# 3. Crear migración desde cero
dotnet ef migrations add InitialCreate -s src/Api/Api.csproj -p src/Infrastructure/Infrastructure.csproj

# 4. Aplicar
dotnet ef database update -s src/Api/Api.csproj -p src/Infrastructure/Infrastructure.csproj
```

---

## Inyección de dependencias

El DbContext se inyecta automáticamente gracias al `AddDbContext` en Program.cs.

### En repositorios

```csharp
public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }
}
```

### En servicios de aplicación

```csharp
public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordService _passwordService;

    public AuthService(
        IUserRepository userRepository,
        IPasswordService passwordService)
    {
        _userRepository = userRepository;
        _passwordService = passwordService;
    }
}
```

### Registro en Program.cs

```csharp
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
```

Todos los servicios que se inyectan deben estar registrados, directa o indirectamente.

---

## Buenas prácticas

1. **Las entidades en Domain NO deben tener decoraciones de EF** (ni `[Key]`, `[Required]`, etc.). Usá Fluent API en configuraciones separadas.

2. **Usá `SaveChangesAsync()`** siempre, no la versión sync. EF Core soporta batch saves, pero solo con la versión async.

3. **`AsNoTracking()` para consultas de solo lectura**. Mejora performance porque EF no trackea los objetos.

4. **No edites migraciones a mano**. Si necesitás cambiar algo, creá una nueva migración o modificá la configuración de la entidad y creá una migración nueva.

5. **Snake_case en la DB, PascalCase en C#**. Usá `.HasColumnName("snake_case")` consistentemente.

6. **`FindAsync(id)` > `FirstOrDefaultAsync(x => x.Id == id)`**. `FindAsync` primero revisa el cache del contexto, es más rápido.

7. **Nombrá las migraciones descriptivamente**: `AddUserProfileFields`, `AddCourseTable`, `FixSessionIndex`. No uses `InitialCreate` dos veces.

8. **`Add-Migration` en inglés, consistente**. Todas las migraciones con nombres en inglés.

9. **Siempre revisá la migración generada** antes de hacer `database update`. Revisá que `Up()` cree/altere lo que esperás.

10. **DbContext es scoped** (una instancia por request). No lo guardes en variables estáticas ni singleton.

---

## Resumen del flujo de desarrollo

```
1. Creás/modificás una entidad en Domain/Entities/
2. Creás/modificás su Configuration en Infrastructure/Persistence/Configurations/
3. Agregás el DbSet en ApplicationDbContext si es nueva
4. Ejecutás:
     dotnet ef migrations add NombreDescriptivo -s src/Api/Api.csproj -p src/Infrastructure/Infrastructure.csproj
5. Revisás el archivo generado en Migrations/
6. Ejecutás:
     dotnet ef database update -s src/Api/Api.csproj -p src/Infrastructure/Infrastructure.csproj
7. Usás el repositorio en tu servicio
```

---

## Referencia rápida de comandos

```bash
# Crear migración
dotnet ef migrations add Nombre -s src/Api/Api.csproj -p src/Infrastructure/Infrastructure.csproj

# Aplicar migraciones
dotnet ef database update -s src/Api/Api.csproj -p src/Infrastructure/Infrastructure.csproj

# Remover última migración (no aplicada)
dotnet ef migrations remove -s src/Api/Api.csproj -p src/Infrastructure/Infrastructure.csproj

# Remover migración forzada (ya aplicada)
dotnet ef migrations remove --force -s src/Api/Api.csproj -p src/Infrastructure/Infrastructure.csproj

# Listar migraciones
dotnet ef migrations list -s src/Api/Api.csproj -p src/Infrastructure/Infrastructure.csproj

# Generar script SQL
dotnet ef migrations script -s src/Api/Api.csproj -p src/Infrastructure/Infrastructure.csproj

# Dropear base de datos
dotnet ef database drop --force -s src/Api/Api.csproj -p src/Infrastructure/Infrastructure.csproj
```

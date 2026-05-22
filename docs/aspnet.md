# Arquitectura ASP.NET Core - Cursinet API

Este documento adapta la arquitectura Fastify a ASP.NET Core manteniendo los mismos patrones de Clean Architecture y funcionalidad.

## Estructura del Proyecto

```
Api/
├── src/
│   ├── Domain/
│   │   ├── Entities/
│   │   │   ├── User.cs
│   │   │   ├── Account.cs
│   │   │   ├── Session.cs
│   │   │   └── Verification.cs
│   │   ├── Enums/
│   │   │   └── Role.cs
│   │   ├── ValueObjects/
│   │   └── Exceptions/
│   │       └── AppException.cs
│   │
│   ├── Application/
│   │   ├── Common/
│   │   │   ├── Interfaces/
│   │   │   │   ├── IUserRepository.cs
│   │   │   │   ├── IAccountRepository.cs
│   │   │   │   ├── ISessionRepository.cs
│   │   │   │   ├── IVerificationRepository.cs
│   │   │   │   ├── ITokenService.cs
│   │   │   └── Mapping/
│   │   │       └── MappingProfile.cs
│   │   └── Features/
│   │       └── Auth/
│   │           ├── Commands/
│   │           │   ├── RegisterCommand.cs
│   │           │   ├── LoginCommand.cs
│   │           │   ├── RefreshTokenCommand.cs
│   │           │   ├── VerifyEmailCommand.cs
│   │           │   ├── ForgotPasswordCommand.cs
│   │           │   └── ResetPasswordCommand.cs
│   │           └── Queries/
│   │               ├── GetUserSessionsQuery.cs
│   │               └── RevokeSessionQuery.cs
│   │
│   ├── Infrastructure/
│   │   ├── Persistence/
│   │   │   ├── ApplicationDbContext.cs
│   │   │   ├── Configurations/
│   │   │   │   ├── UserConfiguration.cs
│   │   │   │   ├── AccountConfiguration.cs
│   │   │   │   └── SessionConfiguration.cs
│   │   │   └── Repositories/
│   │   │       ├── UserRepository.cs
│   │   │       ├── AccountRepository.cs
│   │   │       ├── SessionRepository.cs
│   │   │       └── VerificationRepository.cs
│   │   └── Services/
│   │       ├── TokenService.cs
│   │       └── PasswordService.cs
│   │
│   └── Api/
│       ├── Controllers/
│       │   └── AuthController.cs
│       ├── DTOs/
│       │   ├── RegisterRequest.cs
│       │   ├── LoginRequest.cs
│       │   └── AuthResponse.cs
│       ├── Middleware/
│       │   └── ErrorHandlingMiddleware.cs
│       └── Program.cs
```

## Correspondencia Fastify → ASP.NET

| Fastify | ASP.NET |
|---------|---------|
| Prisma | Entity Framework Core |
| pino | Serilog |
| Zod | FluentValidation |
| bcrypt | BCrypt.Net-Next |
| jsonwebtoken | System.IdentityModel.Tokens.Jwt |
| ioredis | StackExchange.Redis |
| Decorators/Plugins | Middleware |
| Routes | Controllers |
| DTOs | Record classes |

## 2. Configuración Principal

### 2.1 Dependencies - dotnet.csproj

```xml
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.0.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.0" />
<PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="8.0.0" />
<PackageReference Include="BCrypt.Net-Next" Version="4.0.3" />
<PackageReference Include="FluentValidation.AspNetCore" Version="11.3.0" />
<PackageReference Include="Serilog.AspNetCore" Version="8.0.0" />
<PackageReference Include="StackExchange.Redis" Version="2.7.10" />
```

### 2.2 appsettings.json - Variables de Entorno

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=cursinet;Username=postgres;Password=..."
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
    "MinimumLevel": "Debug",
    "WriteTo": ["Console"]
  }
}
```

### 2.3 src/Domain/Enums/Role.cs

```csharp
namespace Cursinet.Domain.Enums;

public enum Role
{
    Staff,
    Admin
}
```

equivalent to Fastify's: `type Role = "admin" | "staff"`

### 2.4 src/Domain/Entities/User.cs

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

    // Navigation properties
    public ICollection<Account> Accounts { get; set; } = new List<Account>();
    public ICollection<Session> Sessions { get; set; } = new List<Session>();
}
```

equivalent to: `IUserEntity` + Prisma generated types

### 2.5 src/Application/Common/Interfaces/IUserRepository.cs

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

equivalent to: `IUserRepository` in auth.interface.ts

## 3. Servicios de Autenticación

### 3.1 src/Infrastructure/Services/PasswordService.cs

```csharp
using BCrypt.Net;

namespace Cursinet.Infrastructure.Services;

public interface IPasswordService
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string hash);
}

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

equivalent to: `crypto.utils.ts` (hashPassword, comparePassword)

### 3.2 src/Infrastructure/Services/TokenService.cs

```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Cursinet.Domain.Enums;

namespace Cursinet.Infrastructure.Services;

public interface ITokenService
{
    (string accessToken, string refreshToken) GenerateTokens(Guid userId, string email, Role role);
    ClaimsPrincipal? ValidateAccessToken(string token);
    ClaimsPrincipal? ValidateRefreshToken(string token);
}

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

    private ClaimsPrincipal? ValidateToken(string token, string secret)
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

equivalent to: `token.utils.ts` (generateTokens, verifyToken, getRefreshToken)

### 3.3 Cookie Service

En ASP.NET, los cookies se manejan con `Response.Cookies` en el controller:

```csharp
// Set cookies
Response.Cookies.Append("accessToken", accessToken, new CookieOptions
{
    HttpOnly = true,
    Secure = !IsDevelopment,
    SameSite = SameSiteMode.Strict,
    Expires = DateTimeOffset.UtcNow.AddMinutes(15)
});

Response.Cookies.Append("refreshToken", refreshToken, new CookieOptions
{
    HttpOnly = true,
    Secure = !IsDevelopment,
    SameSite = SameSiteMode.Strict,
    Expires = DateTimeOffset.UtcNow.AddDays(7)
});

// Clear cookies
Response.Cookies.Delete("accessToken");
Response.Cookies.Delete("refreshToken");
```

equivalent to: `cookie.utils.ts` (setAuthCookies, clearAuthCookies)

## 4. Errores Personalizados

### 4.1 src/Domain/Exceptions/AppException.cs

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

public class BadRequestException : AppException
    => new("Bad Request", 400, "BAD_REQUEST");

public class UnauthorizedException : AppException
    => new("Unauthorized", 401, "UNAUTHORIZED");

public class ForbiddenException : AppException
    => new("Forbidden", 403, "FORBIDDEN");

public class NotFoundException : AppException
    => new("Not Found", 404, "NOT_FOUND");

public class ConflictException : AppException
    => new("Conflict", 409, "CONFLICT");
```

equivalent to: `AppError.ts` + errores específicos

## 5. Auth Guard / Authorization

### 5.1 Authorization Filter

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace Cursinet.Api.Filters;

public class AuthGuardAttribute : ActionFilterAttribute
{
    public override void OnActionExecuting(ActionExecutingContext context)
    {
        var userId = context.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            context.Result = new UnauthorizedObjectResult(new
            {
                message = "Authentication required"
            });
            return;
        }

        context.HttpContext.Items["UserId"] = Guid.Parse(userId);
    }
}
```

Usage:
```csharp
[HttpPost("logout")]
[AuthGuard]
public async Task<IActionResult> Logout()
```

equivalent to: `auth.guard.ts`

## 6. Repository Pattern

### 6.1 src/Infrastructure/Persistence/ApplicationDbContext.cs

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

        // Apply configurations
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
```

### 6.2 Entity Configurations

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cursinet.Domain.Entities;

namespace Cursinet.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Email).IsRequired().HasMaxLength(255);
        builder.HasIndex(u => u.Email).IsUnique();
        builder.Property(u => u.DeletedAt).HasDefaultValue(null);
    }
}
```

equivalent to: Prisma schema + mappers

## 7. Presentation Layer - Controllers

### 7.1 src/Api/Controllers/AuthController.cs

```csharp
using Microsoft.AspNetCore.Mvc;
using Cursinet.Api.DTOs;
using Cursinet.Application.Features.Auth.Commands;
using Cursinet.Application.Common.Interfaces;

namespace Cursinet.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        var result = await _authService.RegisterAsync(request);
        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        return Ok(result);
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<RefreshResponse>> Refresh([FromBody] RefreshRequest request)
    {
        var result = await _authService.RefreshAsync(request.RefreshToken);
        return Ok(result);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var refreshToken = Request.Cookies["refreshToken"] ?? Request.Body.RefreshToken;
        await _authService.LogoutAsync(refreshToken);
        
        Response.Cookies.Delete("accessToken");
        Response.Cookies.Delete("refreshToken");
        
        return Ok(new { message = "Logged out successfully" });
    }

    [HttpPost("verify-email")]
    public async Task<ActionResult<AuthResponse>> VerifyEmail([FromBody] VerifyEmailRequest request)
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
}
```

### 7.2 DTOs

```csharp
namespace Cursinet.Api.DTOs;

public record RegisterRequest(string Name, string Email, string Password, string? Role = null);
public record LoginRequest(string Email, string Password);
public record RefreshRequest(string RefreshToken);
public record VerifyEmailRequest(string Identifier, string Code);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Email, string Code, string NewPassword);

public record AuthResponse(string Message, UserDto User, string AccessToken, string RefreshToken);
public record RefreshResponse(string Message, string AccessToken, string RefreshToken);
public record UserDto(Guid Id, string Name, string Email, bool EmailVerified, string Role);
```

equivalent a: `auth.dto.ts` + `auth.types.ts`

## 8. Configuración Global (Program.cs)

```csharp
using Serilog;
using Microsoft.EntityFrameworkCore;
using Cursinet.Application.Common.Interfaces;
using Cursinet.Infrastructure.Persistence;
using Cursinet.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Logger
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateLogger();
builder.Host.UseSerilog();

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Services
builder.Services.AddScoped<IPasswordService, PasswordService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// JWT Authentication
builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
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
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

// Middleware
app.UseSerilogRequestLogging();
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Health check
app.MapGet("/health", () => Results.Ok(new { status = "ok", timestamp = DateTime.UtcNow }));

app.Run();
```

equivalent a: `app.ts` + `server.ts` combinados

## 9. Resumen de Adaptaciones

| Concepto Fastify | ASP.NET Core |
|------------------|--------------|
| `hashPassword()` | `PasswordService.HashPassword()` |
| `comparePassword()` | `PasswordService.VerifyPassword()` |
| `generateTokens()` | `TokenService.GenerateTokens()` |
| `verifyToken()` | `TokenService.ValidateAccessToken()` |
| `setAuthCookies()` | `Response.Cookies.Append()` |
| `authGuard` | `AuthGuardAttribute` filter |
| `AppError` | `AppException` |
| Prisma + mappers | EF Core + configurations |
| Routes + controller | Controller + Actions |
| pino | Serilog |
| Zod | FluentValidation |

## 10. Servicios del Auth (Application Layer)

El servicio de autenticación equivalente a `auth.service.ts`:

```csharp
// src/Application/Features/Auth/AuthService.cs

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<RefreshResponse> RefreshAsync(string refreshToken);
    Task LogoutAsync(string refreshToken);
    Task<AuthResponse> VerifyEmailAsync(string identifier, string code);
    Task<ForgotPasswordResponse> ForgotPasswordAsync(string email);
    Task<ResetPasswordResponse> ResetPasswordAsync(string email, string code, string newPassword);
}

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IAccountRepository _accountRepository;
    private readonly ISessionRepository _sessionRepository;
    private readonly IVerificationRepository _verificationRepository;
    private readonly IPasswordService _passwordService;
    private readonly ITokenService _tokenService;

    // ... implement all methods from auth.service.ts
}
```

La lógica de negocio se移植 directamente manteniendo:
- Registro con verificación de email
- Login con bcrypt
- Refresh tokens con rotación
- Verificación de email con códigos
- Forgot/Reset password
- Gestión de sesiones

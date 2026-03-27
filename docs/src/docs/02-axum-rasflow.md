# MANUAL COMPLETO: Backend RASFLOW - Rust + Axum

Este es el manual definitivo para entender, mantener y extender este backend. Está escrito para que puedas replicar cualquier cosa que necesites hacer en este proyecto. Vas a encontrar desde la estructura general hasta cómo agregar un nuevo endpoint completo con modelos, handlers, servicios, rutas, cache y base de datos.

---

## TABLA DE CONTENIDOS

1. [Arquitectura General del Proyecto](#1-arquitectura-general-del-proyecto)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estructura de Archivos](#3-estructura-de-archivos)
4. [Cómo Ejecutar el Proyecto](#4-cómo-ejecutar-el-proyecto)
5. [Entendiendo el Flujo de una Solicitud](#5-entendiendo-el-flujo-de-una-solicitud)
6. [Modelos (Models)](#6-modelos-models)
7. [Manejo de Errores](#7-manejo-de-errores)
8. [Servicios (Services)](#8-servicios-services)
9. [Handlers](#9-handlers)
10. [Rutas (Routes)](#10-rutas-routes)
11. [Middleware de Autenticación](#11-middleware-de-autenticación)
12. [Estado de la Aplicación (AppState)](#12-estado-de-la-aplicación-appstate)
13. [Base de Datos con SQLx](#13-base-de-datos-con-sqlx)
14. [Redis Cache](#14-redis-cache)
15. [JWT y Autenticación](#15-jwt-y-autenticación)
16. [Cómo Agregar un Nuevo Endpoint Completo](#16-cómo-agregar-un-nuevo-endpoint-completo)
17. [Migraciones de Base de Datos](#17-migraciones-de-base-de-datos)
18. [Configuración con Variables de Entorno](#18-configuración-con-variables-de-entorno)
19. [Buenas Prácticas y Patrones](#19-buenas-prácticas-y-patrones)

---

## 1. ARQUITECTURA GENERAL DEL PROYECTO

Este backend sigue una arquitectura hexagonalmoderna con separación clara de responsabilidades. El flujo típico de una solicitud HTTP es el siguiente:

1. **Router** (en `routes/`) recibe la solicitud y la dirige al handler adecuado
2. **Handler** (en `handlers/`) procesa la solicitud HTTP, extrae datos del request, valida entrada
3. **Service** (en `services/`) contiene la lógica de negocio, interactúa con base de datos y cache
4. **Model** (en `models/`) define las estructuras de datos, tanto para requests como responses
5. **Middleware** (en `middlewares/`) puede interponerse antes del handler para validar autenticación

La aplicación usa **Axum** como framework web, **SQLx** para base de datos PostgreSQL, **Redis** para caché, y **JWT** para autenticación.

### Conexiones Externas

El estado de la aplicación (`AppState`) contiene dos conexiones principales:

- **db**: Pool de conexiones a PostgreSQL (tipo `PgPool`)
- **redis**: Conexión multiplexada a Redis

Estas conexiones se inicializan en `main.rs` y se injectan en todas las rutas a través del estado de Axum.

---

## 2. STACK TECNOLÓGICO

El proyecto está construído con las siguientes tecnologías:

| Categoría | Tecnología | Versión | Propósito |
|-----------|------------|---------|-----------|
| Framework Web | Axum | 0.8.8 | Servidor HTTP y routing |
| Base de Datos | PostgreSQL | - | Almacenamiento persistente |
| ORM/Query Builder | SQLx | 0.8.6 | Consultas type-safe a PostgreSQL |
| Cache | Redis | - | Almacenamiento en caché |
| Cliente Redis | redis | 0.27 | Conexión a Redis |
| Serialización | serde + serde_json | 1.0 | JSON y serialización |
| JWT | jsonwebtoken | 10 | Autenticación con tokens |
| Hashing | bcrypt | 0.15 | Hashing de contraseñas |
| Validación | validator | 0.19 | Validación de datos |
| UUID | uuid | 1 | Generación de IDs únicos |
| Fechas | chrono | 0.4 | Manejo de fechas y tiempos |
| Logging | tracing | 0.1 | Logging estructurado |
| Async Runtime | tokio | 1 | Runtime asíncrono |

Todos estos están definidos en `Cargo.toml`. La edición de Rust usada es **2024**.

---

## 3. ESTRUCTURA DE ARCHIVOS

El código fuente está en `src/`. Aquí está el mapa completo:

```
backend/
├── Cargo.toml                 # Dependencias del proyecto
├── .env.example               # Ejemplo de variables de entorno
├── .env                       # Variables de entorno reales
├── migrations/                # Migraciones de base de datos SQL
│   ├── 20260202001839_create_users.sql
│   ├── 20260202001849_create_projects.sql
│   └── 20260202001900_crate_tasks.sql
└── src/
    ├── main.rs                # Punto de entrada, inicialización del servidor
    ├── mod.rs                 # Declara todos los módulos
    ├── models/                # Estructuras de datos (DTOs y entidades)
    │   ├── mod.rs
    │   ├── api_model.rs       # Modelos genéricos (ApiResponse, Pagination)
    │   ├── auth_model.rs      # Modelos de autenticación (Claim, payloads)
    │   ├── user_model.rs      # Modelo de usuario
    │   ├── project_model.rs   # Modelo de proyecto
    │   └── task_model.rs      # Modelo de tarea
    ├── handlers/              # Controladores (reciben requests, devuelven responses)
    │   ├── mod.rs
    │   ├── auth_handler.rs
    │   ├── project_handler.rs
    │   └── task_handler.rs
    ├── services/             # Lógica de negocio (interactúan con DB y cache)
    │   ├── mod.rs
    │   ├── auth_service.rs
    │   ├── project_service.rs
    │   └── task_service.rs
    ├── routes/               # Definición de rutas HTTP
    │   ├── mod.rs
    │   └── v1/
    │       ├── mod.rs
    │       ├── auth_routes.rs
    │       ├── project_routes.rs
    │       └── task_routes.rs
    ├── middlewares/          # Middlewares (ej: autenticación)
    │   ├── mod.rs
    │   └── auth_middleware.rs
    ├── helpers/              # Utilidades y funciones auxiliares
    │   ├── mod.rs
    │   ├── errors.rs         # Definición de errores AppError
    │   ├── jwt.rs            # Funciones para codificar/decodificar JWT
    │   └── password.rs       # Funciones para hashear y verificar contraseñas
    ├── db/                   # Conexión a base de datos
    │   ├── mod.rs
    │   └── pool.rs           # Función para crear el pool de PostgreSQL
    ├── cache/                # Funciones para Redis
    │   ├── mod.rs
    │   └── redis.rs         # get_cache, set_cache, invalidate_cache
    ├── config/               # Configuración global
    │   ├── mod.rs
    │   └── constants.rs     # Constantes leídas de variables de entorno
    └── states/              # Estado de la aplicación
        └── mod.rs           # AppState (db + redis)
```

Cada carpeta tiene un `mod.rs` que declara los submódulos. Esta es la convención estándar de módulos en Rust.

---

## 4. CÓMO EJECUTAR EL PROYECTO

### Prerrequisitos

Necesitas tener instalados:

- **Rust** (última versión stable)
- **PostgreSQL** corriendo y accesible
- **Redis** corriendo y accesible

### Pasos para ejecutar

1. **Copia el archivo de configuración:**

   ```bash
   cp .env.example .env
   ```

2. **Edita el archivo `.env`** con tus credenciales:

   ```
   JWT_SECRET="tu_secreto_muy_seguro_aqui_usa_al_menos_32_caracteres"
   FRONTEND_URL=http://localhost:5173
   DATABASE_URL=postgres://tu_usuario:tu_password@localhost:5432/tu_base_de_datos
   REDIS_URL=redis://localhost:6379
   ```

3. **Crea la base de datos** en PostgreSQL:

   ```bash
   createdb tu_base_de_datos
   ```

4. **Ejecuta las migraciones** (esto crea las tablas):

   ```bash
   cargo run --release
   ```

   En realidad, para migraciones, puedes usar sqlx-cli:

   ```bash
   cargo install sqlx-cli
   sqlx migrate run
   ```

   O si prefieres ejecutarlas manualmente, los archivos SQL están en `migrations/`.

5. **Inicia el servidor:**

   ```bash
   cargo run
   ```

   El servidor arrancará en `http://0.0.0.0:3000`.

### Comandos útiles de desarrollo

```bash
# Compilar en modo debug (más rápido para desarrollo)
cargo build

# Compilar en modo release (optimizado)
cargo build --release

# Ejecutar tests
cargo test

# Ver formato del código
cargo fmt

# Ver warnings de lints
cargo clippy

# Recargar automáticamente cuando hay cambios (con cargo-watch)
cargo install cargo-watch
cargo watch -x run
```

---

## 5. ENTENDIENDO EL FLUJO DE UNA SOLICITUD

Vamos a跟踪 una solicitud completa. Cuando un usuario hace `POST /api/v1/projects` para crear un proyecto, esto es lo que sucede:

### Paso 1: main.rs - Inicialización

En `main.rs` (líneas 25-73), se configura todo:

```rust
#[tokio::main]
async fn main() {
    dotenv().ok();  // Carga variables de entorno

    // Configuración CORS
    let cors = CorsLayer::new()
        .allow_origin(FRONTEND_URL.parse::<http::HeaderValue>().unwrap())
        .allow_methods([...])
        .allow_headers([...])
        .allow_credentials(true);

    // Inicializar logging
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env()...)
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Crear pool de PostgreSQL
    let db = db::pool::create_pool()
        .await
        .expect("error connect database");

    // Crear conexión a Redis
    let redis_client = redis::Client::open(REDIS_URL.as_str())...
    let redis_conn = redis_client
        .get_multiplexed_async_connection()
        .await
        .expect("Error connecting to Redis");

    // Crear estado de la aplicación
    let app_state = AppState::new(db, redis_conn);

    // Crear router y agregar estado
    let router = routes::create_routes()
        .with_state(app_state)
        .layer(cors);

    // Iniciar servidor
    let addr = format!("{}:{}", HOST, PORT);
    let listener = TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, router).await.unwrap()
}
```

### Paso 2: Routes - Definición de rutas

En `routes/mod.rs` se crea el router principal:

```rust
pub fn create_routes() -> Router<AppState> {
    Router::new()
        .nest("/api/v1", v1_routes())
}
```

En `routes/v1/mod.rs` se definen las rutas de la versión 1:

```rust
pub fn v1_routes() -> Router<AppState> {
    Router::new()
        .route("/", get(|| async { "Server running" }))
        .merge(auth_routes::routes())      // Rutas de auth
        .merge(project_routes::routes())    // Rutas de proyectos
        .merge(task_routes::routes())       // Rutas de tareas
}
```

### Paso 3: Project Routes - Definición específica

En `routes/v1/project_routes.rs` se definen las rutas de proyectos:

```rust
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/projects", post(project_handler::create_project))       // Crear
        .route("/projects", get(project_handler::get_projects))           // Listar
        .route("/projects/{id}", get(project_handler::get_project))       // Ver uno
        .route("/projects/{id}", put(project_handler::update_project))    // Actualizar
        .route("/projects/{id}", delete(project_handler::delete_project)) // Eliminar
        .layer(axum::middleware::from_fn(auth_middleware::auth_middleware)) // Middleware auth
}
```

**Punto clave**: El middleware `auth_middleware` se aplica a todas las rutas de proyectos. Esto significa que antes de llegar al handler, se ejecuta el middleware que valida el JWT.

### Paso 4: Middleware - Validación de JWT

En `middlewares/auth_middleware.rs`:

```rust
pub async fn auth_middleware(
    mut request: Request<Body>,
    next: Next,
) -> Result<Response, StatusCode> {
    // Extraer header de Authorization
    let auth_header = request
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok());

    match auth_header {
        Some(header) if header.starts_with("Bearer ") => {
            let token = header.trim_start_matches("Bearer ");
            
            match decode_jwt(token) {
                Ok(_) => {
                    // Token válido, continuar
                    let response = next.run(request).await;
                    Ok(response)
                }
                Err(_) => Err(StatusCode::UNAUTHORIZED),
            }
        }
        _ => Err(StatusCode::UNAUTHORIZED),
    }
}
```

Si el token es válido, la solicitud pasa al handler.

### Paso 5: Handler - Procesar solicitud

En `handlers/project_handler.rs`, el handler `create_project`:

```rust
pub async fn create_project(
    State(db): State<AppState>,
    TypedHeader(Authorization(bearer)): TypedHeader<Authorization<Bearer>>,
    Json(payload): Json<CreateProjectPayload>,
) -> Result<Json<ApiResponse<Project>>, AppError> {
    // 1. Obtener el user_id del token JWT
    let user_id = AuthService::get_user_id_from_token(&db, bearer.token()).await?;

    // 2. Llamar al servicio para crear el proyecto
    let project = ProjectService::create_project(&db, user_id, payload).await?;

    // 3. Crear respuesta exitosa
    let response = ApiResponse::success(project, "Project created successfully");
    Ok(Json(response))
}
```

El handler hace tres cosas principales: extrae datos del request, llama al servicio apropiado, y devuelve una respuesta formateada.

### Paso 6: Service - Lógica de negocio

En `services/project_service.rs`:

```rust
pub async fn create_project(
    db: &AppState,
    user_id: uuid::Uuid,
    payload: CreateProjectPayload,
) -> Result<Project, AppError> {
    // Ejecutar query SQL para insertar
    let project = sqlx::query_as!(
        Project,
        r#"
            INSERT INTO projects (name, owner_id)
            VALUES ($1, $2)
            RETURNING id, name, owner_id as "owner_id!", created_at as "created_at!"
        "#,
        payload.name,
        user_id
    )
    .fetch_one(&db.db)
    .await?;

    // Invalidar caché de proyectos del usuario
    let _ = invalidate_cache(db.redis.clone(), &format!("projects:user:{}:*", user_id)).await;

    Ok(project)
}
```

El servicio hace la query real a la base de datos, usa el query builder type-safe de SQLx, y también invalida el caché de Redis.

### Paso 7: Response - Devolver al cliente

El handler devuelve un `Json<ApiResponse<Project>>`. El modelo `ApiResponse` está en `models/api_model.rs`:

```rust
#[derive(Serialize, Debug, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub message: String,
    pub data: T,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T, message: &str) -> Self {
        Self {
            success: true,
            message: message.to_string(),
            data,
        }
    }
}
```

Axum automáticamente serializa esto a JSON y lo devuelve con el código de estado 200 (o el error apropiado si algo falló).

---

## 6. MODELOS (MODELS)

Los modelos viven en `src/models/`. Hay dos tipos de modelos:

1. **Modelos de dominio**: representan entidades de la base de datos (User, Project, Task)
2. **Modelos de API**: payloads de request/response (RegisterPayload, LoginPayload, ApiResponse)

### 6.1 Modelo de Entidad (Ejemplo: User)

En `models/user_model.rs`:

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    #[serde(skip_serializing)]  // No incluir en JSON responses
    pub password_hash: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub created_at: DateTime<Utc>,
}

impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        UserResponse {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
        }
    }
}
```

**Puntos clave:**

- `#[derive(Debug, Serialize, Deserialize)]`: derive macros de serde para serialización JSON
- `#[derive(FromRow)]`: derive de sqlx para convertir filas de la DB en structs
- `#[serde(skip_serializing)]`: no incluir este campo cuando se serializa a JSON (importante para password_hash)
- `impl From<User> for UserResponse`: conversión de entidad a DTO de response

### 6.2 Modelo de Payload de Request

En `models/auth_model.rs`:

```rust
#[derive(Deserialize, Clone, Debug)]
pub struct RegisterPayload {
    pub email: String,
    pub username: String,
    pub password: String,
}

#[derive(Deserialize, Clone, Debug)]
pub struct LoginPayload {
    pub email: String,
    pub password: String,
}
```

**Puntos clave:**

- `#[derive(Deserialize)]`: necesario para que Axum pueda extraer el JSON del body
- `Clone`: útil para pasar datos entre funciones
- `Debug`: para logging y debugging

### 6.3 Modelos de Enum

En `models/task_model.rs`:

```rust
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    Todo,
    InProgress,
    Done,
}

impl Display for TaskStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TaskStatus::Todo => write!(f, "todo"),
            TaskStatus::InProgress => write!(f, "in_progress"),
            TaskStatus::Done => write!(f, "done"),
        }
    }
}

impl FromStr for TaskStatus {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "todo" => Ok(TaskStatus::Todo),
            "in_progress" => Ok(TaskStatus::InProgress),
            "done" => Ok(TaskStatus::Done),
            _ => Err(format!("'{}' is not a valid status", s)),
        }
    }
}
```

Los enums se usan para valores limitados (como status de tarea). Se implementantraits como `Display`, `FromStr` para convertir de/a string.

### 6.4 Modelos de Paginación

En `models/api_model.rs`:

```rust
#[derive(Serialize, Debug, Deserialize)]
pub struct PaginationMeta {
    pub page: i64,
    pub limit: i64,
    pub total: i64,
    pub total_page: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub meta: PaginationMeta,
}

impl PaginationMeta {
    pub fn new(page: i64, limit: i64, total: i64) -> Self {
        let total_page = (total as f64 / limit as f64).ceil() as i64;
        Self { page, limit, total, total_page }
    }
}
```

La paginación es estándar:devuelves un array de datos más metadatos (page, limit, total, total_pages).

---

## 7. MANEJO DE ERRORES

El manejo de errores está centralizado en `helpers/errors.rs`. Se usa un enum `AppError` con variantes para cada tipo de error.

### 7.1 Definición de AppError

```rust
#[derive(Debug)]
#[allow(dead_code)]
pub enum AppError {
    NotFound(String),           // 404 - Recurso no encontrado
    BadRequest(String),         // 400 - Solicitud inválida
    InternalServerError(String),// 500 - Error interno
    Unauthorized(String),      // 401 - No autenticado
    Forbidden(String),          // 403 - No autorizado
    ValidationError(ValidationErrors), // 400 - Errores de validación
}
```

### 7.2 Implementación de IntoResponse

Axum puede convertir `AppError` automáticamente en una respuesta HTTP:

```rust
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message_error) = match self {
            AppError::NotFound(message) => (
                StatusCode::NOT_FOUND,
                json!({"error": "not_found", "message": message}),
            ),
            AppError::Unauthorized(message) => (
                StatusCode::UNAUTHORIZED,
                json!({"error": "unauthorized", "message": message}),
            ),
            AppError::BadRequest(message) => (
                StatusCode::BAD_REQUEST,
                json!({"error": "bad_request", "message": message}),
            ),
            AppError::InternalServerError(message) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                json!({"error": "internal_server_error", "message": message}),
            ),
            AppError::Forbidden(message) => (
                StatusCode::FORBIDDEN,
                json!({"error": "forbidden", "message": message}),
            ),
            AppError::ValidationError(err) => {
                let errors = err.field_errors().into_iter()
                    .map(|(field, errors)| {
                        let messages: Vec<String> = errors.iter()
                            .filter_map(|e| e.message.clone())
                            .map(|m| m.to_string())
                            .collect();
                        json!({ "field": field, "errors": messages })
                    })
                    .collect::<Vec<_>>();
                (StatusCode::BAD_REQUEST, json!({"error": "validation_error", "message": "Error de validación", "errors": errors}))
            }
        };
        (status, Json(message_error)).into_response()
    }
}
```

Esto significa que en cualquier lugar del código puedes retornar `Result<T, AppError>` y Axum automáticamente convierte el error en una respuesta JSON con el código HTTP apropiado.

### 7.3 Conversión automática de errores de base de datos

También se implementa `From<sqlx::Error>`:

```rust
impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        match err {
            sqlx::Error::RowNotFound => AppError::NotFound("Recurso no encontrado".to_string()),
            sqlx::Error::Database(db_err) => {
                let error_code = db_err.code();
                if let Some(code) = error_code {
                    if code == "23505" { // PostgreSQL unique_violation
                        let message = db_err.message();
                        if message.contains("email") {
                            return AppError::BadRequest("El email ya está registrado".to_string());
                        } else if message.contains("username") {
                            return AppError::BadRequest("El username ya está en uso".to_string());
                        }
                        return AppError::BadRequest("El email o username ya existe".to_string());
                    }
                }
                AppError::InternalServerError(db_err.to_string())
            }
            _ => AppError::InternalServerError(err.to_string()),
        }
    }
}
```

Esto maneja automáticamente errores comunes de PostgreSQL, como violación de unicidad.

### 7.4 Cómo usar AppError en el código

En servicios y handlers, simplemente retornas `Result<T, AppError>`:

```rust
// En un servicio
pub async fn get_user(db: &AppState, email: &str) -> Result<User, AppError> {
    let user = sqlx::query_as!(User, "SELECT ... WHERE email = $1", email)
        .fetch_optional(&db.db)
        .await?
        .ok_or(AppError::NotFound("Usuario no encontrado".to_string()))?;

    Ok(user)
}

// En un handler
pub async fn get_user_handler(
    State(db): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> Result<Json<ApiResponse<User>>, AppError> {
    let user = user_service::get_user(&db, user_id).await?;
    Ok(Json(ApiResponse::success(user, "User found")))
}
```

---

## 8. SERVICIOS (SERVICES)

Los servicios contienen la lógica de negocio y son los únicos que interactúan directamente con la base de datos y el caché.

### 8.1 Estructura de un Servicio

Un servicio típico tiene esta estructura:

```rust
use crate::{
    cache::redis::{get_cache, set_cache, invalidate_cache},
    helpers::errors::AppError,
    models::{...},
    states::AppState,
};

pub struct NombreDelServicio;

impl NombreDelServicio {
    // Métodos del servicio
}
```

### 8.2 Ejemplo: ProjectService

```rust
pub struct ProjectService;

impl ProjectService {
    /// Crear un nuevo proyecto
    pub async fn create_project(
        db: &AppState,
        user_id: uuid::Uuid,
        payload: CreateProjectPayload,
    ) -> Result<Project, AppError> {
        // Query SQL con SQLx
        let project = sqlx::query_as!(
            Project,
            r#"
                INSERT INTO projects (name, owner_id)
                VALUES ($1, $2)
                RETURNING id, name, owner_id as "owner_id!", created_at as "created_at!"
            "#,
            payload.name,
            user_id
        )
        .fetch_one(&db.db)
        .await?;

        // Invalidar caché relacionado
        let _ = invalidate_cache(
            db.redis.clone(),
            &format!("projects:user:{}:*", user_id)
        ).await;

        Ok(project)
    }

    /// Obtener todos los proyectos con paginación y caché
    pub async fn get_all(
        db: &AppState,
        user_id: uuid::Uuid,
        page: i64,
        limit: i64,
    ) -> Result<PaginatedResponse<Project>, AppError> {
        let offset = (page - 1) * limit;

        // 1. Intentar obtener del caché primero
        let cache_key = format!(
            "projects:user:{}:page:{}:limit:{}",
            user_id, page, limit
        );

        if let Some(cached) = get_cache::<PaginatedResponse<Project>>(
            db.redis.clone(),
            &cache_key
        ).await? {
            tracing::info!("Cache hit for projects");
            return Ok(cached);
        }

        // 2. Si no está en caché, consultar DB
        let total: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM projects WHERE owner_id = $1"
        )
        .bind(user_id)
        .fetch_one(&db.db)
        .await?;

        let projects: Vec<Project> = sqlx::query_as!(
            Project,
            r#"
                SELECT id, name, owner_id as "owner_id!", created_at as "created_at!"
                FROM projects
                WHERE owner_id = $1
                ORDER BY created_at DESC
                LIMIT $2 OFFSET $3
            "#,
            user_id, limit, offset
        )
        .fetch_all(&db.db)
        .await?;

        let meta = PaginationMeta::new(page, limit, total.0);
        let response = PaginatedResponse { data: projects, meta };

        // 3. Guardar en caché por 60 segundos
        let _ = set_cache(db.redis.clone(), &cache_key, &response, 60).await;

        Ok(response)
    }

    /// Obtener un proyecto por ID
    pub async fn get_by_id(
        db: &AppState,
        user_id: uuid::Uuid,
        project_id: uuid::Uuid,
    ) -> Result<Project, AppError> {
        let project = sqlx::query_as!(
            Project,
            r#"
                SELECT id, name, owner_id as "owner_id!", created_at as "created_at!"
                FROM projects
                WHERE id = $1 AND owner_id = $2
            "#,
            project_id, user_id
        )
        .fetch_optional(&db.db)
        .await?
        .ok_or(AppError::NotFound("Project not found".to_string()))?;

        Ok(project)
    }

    /// Actualizar un proyecto
    pub async fn update(
        db: &AppState,
        user_id: uuid::Uuid,
        project_id: uuid::Uuid,
        payload: UpdateProjectPayload,
    ) -> Result<Project, AppError> {
        let project = sqlx::query_as!(
            Project,
            r#"
                UPDATE projects
                SET name = $1
                WHERE id = $2 AND owner_id = $3
                RETURNING id, name, owner_id as "owner_id!", created_at as "created_at!"
            "#,
            payload.name,
            project_id,
            user_id
        )
        .fetch_optional(&db.db)
        .await?
        .ok_or(AppError::NotFound("Project not found".to_string()))?;

        // Invalidar caché
        let _ = invalidate_cache(
            db.redis.clone(),
            &format!("projects:user:{}:*", user_id)
        ).await;

        Ok(project)
    }

    /// Eliminar un proyecto
    pub async fn delete(
        db: &AppState,
        user_id: uuid::Uuid,
        project_id: uuid::Uuid,
    ) -> Result<(), AppError> {
        let result = sqlx::query!(
            "DELETE FROM projects WHERE id = $1 AND owner_id = $2",
            project_id,
            user_id
        )
        .execute(&db.db)
        .await?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound("Project not found".to_string()));
        }

        // Invalidar caché
        let _ = invalidate_cache(
            db.redis.clone(),
            &format!("projects:user:{}:*", user_id)
        ).await;

        Ok(())
    }
}
```

### 8.3 Patrón de Diseño

Los servicios siguen estos principios:

1. **Un método por operación de negocio**: create, get_all, get_by_id, update, delete
2. **Reciben AppState como parámetro**: así pueden acceder a db y redis
3. **Retornan Result<T, AppError>**: errores se manejan uniformemente
4. **Invalidan caché cuando hay modificaciones**: siempre que se crea, actualiza o elimina algo
5. **Verifican ownership**: siempre se verifica que el usuario tenga acceso al recurso

---

## 9. HANDLERS

Los handlers son la capa que recibe las solicitudes HTTP, extrae los datos, llama a los servicios, y formatea la respuesta.

### 9.1 Estructura de un Handler

```rust
use axum::{
    Json,
    extract::{Path, Query, State},
};
use axum_extra::{
    TypedHeader,
    headers::{Authorization, authorization::Bearer},
};

use crate::{
    helpers::errors::AppError,
    models::{
        api_model::{ApiResponse, PaginatedResponse, PaginationParams},
        project_model::{CreateProjectPayload, Project, UpdateProjectPayload},
    },
    services::{auth_service::AuthService, project_service::ProjectService},
    states::AppState,
};
```

### 9.2 Ejemplo: Handlers de Proyectos

```rust
/// Crear un nuevo proyecto
pub async fn create_project(
    State(db): State<AppState>,
    TypedHeader(Authorization(bearer)): TypedHeader<Authorization<Bearer>>,
    Json(payload): Json<CreateProjectPayload>,
) -> Result<Json<ApiResponse<Project>>, AppError> {
    // 1. Extraer user_id del token
    let user_id = AuthService::get_user_id_from_token(&db, bearer.token()).await?;

    // 2. Llamar al servicio
    let project = ProjectService::create_project(&db, user_id, payload).await?;

    // 3. Crear y devolver respuesta
    let response = ApiResponse::success(project, "Project created successfully");
    Ok(Json(response))
}

/// Obtener todos los proyectos del usuario con paginación
pub async fn get_projects(
    State(db): State<AppState>,
    TypedHeader(Authorization(bearer)): TypedHeader<Authorization<Bearer>>,
    Query(params): Query<PaginationParams>,
) -> Result<Json<ApiResponse<PaginatedResponse<Project>>>, AppError> {
    let user_id = AuthService::get_user_id_from_token(&db, bearer.token()).await?;

    let page = params.page.unwrap_or(1);
    let limit = params.limit.unwrap_or(10);

    let projects = ProjectService::get_all(&db, user_id, page, limit).await?;

    let response = ApiResponse::success(projects, "Projects retrieved successfully");
    Ok(Json(response))
}

/// Obtener un proyecto por ID
pub async fn get_project(
    State(db): State<AppState>,
    TypedHeader(Authorization(bearer)): TypedHeader<Authorization<Bearer>>,
    Path(project_id): Path<uuid::Uuid>,
) -> Result<Json<ApiResponse<Project>>, AppError> {
    let user_id = AuthService::get_user_id_from_token(&db, bearer.token()).await?;

    let project = ProjectService::get_by_id(&db, user_id, project_id).await?;

    let response = ApiResponse::success(project, "Project retrieved successfully");
    Ok(Json(response))
}

/// Actualizar un proyecto
pub async fn update_project(
    State(db): State<AppState>,
    TypedHeader(Authorization(bearer)): TypedHeader<Authorization<Bearer>>,
    Path(project_id): Path<uuid::Uuid>,
    Json(payload): Json<UpdateProjectPayload>,
) -> Result<Json<ApiResponse<Project>>, AppError> {
    let user_id = AuthService::get_user_id_from_token(&db, bearer.token()).await?;

    let project = ProjectService::update(&db, user_id, project_id, payload).await?;

    let response = ApiResponse::success(project, "Project updated successfully");
    Ok(Json(response))
}

/// Eliminar un proyecto
pub async fn delete_project(
    State(db): State<AppState>,
    TypedHeader(Authorization(bearer)): TypedHeader<Authorization<Bearer>>,
    Path(project_id): Path<uuid::Uuid>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    let user_id = AuthService::get_user_id_from_token(&db, bearer.token()).await?;

    ProjectService::delete(&db, user_id, project_id).await?;

    let response = ApiResponse::success((), "Project deleted successfully");
    Ok(Json(response))
}
```

### 9.3 Extractores de Axum

Axum usa "extractores" para obtener datos del request. Los más comunes:

| Extractor | Uso | Ejemplo |
|-----------|-----|---------|
| `State<AppState>` | Acceder al estado de la app | `State(db): State<AppState>` |
| `Json<T>` | Extraer body JSON | `Json(payload): Json<CreatePayload>` |
| `Path<T>` | Extraer path parameter | `Path(id): Path<Uuid>` |
| `Query<T>` | Extraer query parameters | `Query(params): Query<PaginationParams>` |
| `TypedHeader` | Extraer headers específicos | `TypedHeader(Authorization(bearer)): ...` |

### 9.4 Tipos de返回值

Los handlers siempre retornan:

```rust
Result<Json<ApiResponse<T>>, AppError>
```

donde `T` es el tipo de dato que se devuelve en `data`.

---

## 10. RUTAS (ROUTES)

Las rutas definen qué URLs existen y qué handlers las atienden.

### 10.1 Estructura de Rutas

En `routes/v1/project_routes.rs`:

```rust
use axum::{
    Router,
    routing::{delete, get, post, put},
};

use crate::{handlers::project_handler, middlewares::auth_middleware, states::AppState};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/projects", post(project_handler::create_project))
        .route("/projects", get(project_handler::get_projects))
        .route("/projects/{id}", get(project_handler::get_project))
        .route("/projects/{id}", put(project_handler::update_project))
        .route("/projects/{id}", delete(project_handler::delete_project))
        .layer(axum::middleware::from_fn(auth_middleware::auth_middleware))
}
```

**Puntos clave:**

- `Router::new()` crea un nuevo router
- `.route(path, method)` registra una ruta
- `.layer()` agrega un middleware a todas las rutas
- `axum::middleware::from_fn()` convierte una función async en middleware

### 10.2 Rutas con Path Parameters

Los path parameters se definen con `{nombre}`:

```rust
.route("/projects/{id}", get(project_handler::get_project))
.route("/projects/{project_id}/tasks", get(task_handler::get_tasks))
.route("/tasks/{id}", get(task_handler::get_task))
```

### 10.3 Rutas con Niveles (Nesting)

Para rutas que comparten un prefijo, se puede usar `nest()`:

```rust
// En routes/mod.rs
pub fn create_routes() -> Router<AppState> {
    Router::new()
        .nest("/api/v1", v1_routes())
}

// En v1/mod.rs
pub fn v1_routes() -> Router<AppState> {
    Router::new()
        .merge(auth_routes::routes())  // /auth/...
        .merge(project_routes::routes()) // /projects/...
        .merge(task_routes::routes())    // /projects/{id}/tasks, /tasks/...
}
```

### 10.4 Métodos HTTP

| Método | Uso | Equivalente CRUD |
|--------|-----|------------------|
| `get` | Obtener recursos | READ |
| `post` | Crear recursos | CREATE |
| `put` | Reemplazar completamente | UPDATE (full) |
| `patch` | Actualizar parcialmente | UPDATE (partial) |
| `delete` | Eliminar recursos | DELETE |

---

## 11. MIDDLEWARE DE AUTENTICACIÓN

El middleware verifica que el token JWT sea válido antes de dejar pasar la solicitud.

### 11.1 Implementación del Middleware

En `middlewares/auth_middleware.rs`:

```rust
use crate::helpers::jwt::decode_jwt;
use axum::{body::Body, extract::Request, http::StatusCode, middleware::Next, response::Response};

pub async fn auth_middleware(
    mut request: Request<Body>,
    next: Next,
) -> Result<Response, StatusCode> {
    // 1. Extraer header de Authorization
    let auth_header = request
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok());

    // 2. Verificar que existe y tiene formato Bearer
    match auth_header {
        Some(header) if header.starts_with("Bearer ") => {
            let token = header.trim_start_matches("Bearer ");

            // 3. Decodificar y validar el JWT
            match decode_jwt(token) {
                Ok(_) => {
                    // Token válido, continuar con la solicitud
                    let response = next.run(request).await;
                    Ok(response)
                }
                Err(_) => Err(StatusCode::UNAUTHORIZED),
            }
        }
        _ => Err(StatusCode::UNAUTHORIZED),
    }
}
```

### 11.2 Cómo aplicar el Middleware

Se aplica a nivel de grupo de rutas:

```rust
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/projects", post(project_handler::create_project))
        .route("/projects", get(project_handler::get_projects))
        // ... más rutas
        .layer(axum::middleware::from_fn(auth_middleware::auth_middleware))
}
```

Esto hace que TODAS las rutas de proyectos requieran autenticación.

### 11.3 Middleware vs Handler

- **Middleware**: se ejecuta ANTES del handler, es transverse (comparteacross todas las rutas donde se aplica)
- **Handler**: procesa la solicitud y devuelve la respuesta

---

## 12. ESTADO DE LA APLICACIÓN (APPSTATE)

El `AppState` contiene las conexiones compartidas que se injectan en todas las rutas.

### 12.1 Definición

En `states/mod.rs`:

```rust
use redis::aio::MultiplexedConnection;
use sqlx::PgPool;

pub type DbState = PgPool;

#[derive(Clone)]
pub struct AppState {
    pub db: DbState,           // Pool de conexiones PostgreSQL
    pub redis: MultiplexedConnection, // Conexión a Redis
}

impl AppState {
    pub fn new(db: DbState, redis: MultiplexedConnection) -> Self {
        Self { db, redis }
    }
}
```

### 12.2 Inicialización en main.rs

```rust
// Crear pool de PostgreSQL
let db = db::pool::create_pool()
    .await
    .expect("error connect database");

// Crear conexión a Redis
let redis_client = redis::Client::open(REDIS_URL.as_str()).expect("Invalid Redis URL");
let redis_conn = redis_client
    .get_multiplexed_async_connection()
    .await
    .expect("Error connecting to Redis");

// Crear estado
let app_state = AppState::new(db, redis_conn);

// Agregar al router
let router = routes::create_routes()
    .with_state(app_state)
    .layer(cors);
```

### 12.3 Uso en Handlers y Servicios

```rust
// En handler
pub async fn my_handler(
    State(db): State<AppState>,  // Extraer estado
    // ...
) -> Result<...> {
    // Pasar db a servicios
    let result = MyService::do_something(&db, ...).await;
}

// En servicio
pub async fn do_something(db: &AppState, ...) -> Result<...> {
    // Usar db.db para PostgreSQL
    let users = sqlx::query_as!(...)...
    
    // Usar db.redis para Redis
    let cached = get_cache(...)
}
```

---

## 13. BASE DE DATOS CON SQLX

SQLx es un query builder que permite escribir SQL type-safe en tiempo de compilación.

### 13.1 Query con macro sqlx::query_as!

El macro `query_as!` permite escribir queries SQL y mapear resultados directamente a structs:

```rust
// Insertar y retornar
let user = sqlx::query_as!(
    User,
    r#"
        INSERT INTO users (email, username, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, email, username, password_hash, created_at as "created_at!"
    "#,
    payload.email,
    payload.username,
    hashed_password
)
.fetch_one(&db.db)
.await?;

// Seleccionar
let users = sqlx::query_as!(
    User,
    r#"
        SELECT id, email, username, password_hash, created_at as "created_at!"
        FROM users
        WHERE email = $1
    "#,
    email
)
.fetch_all(&db.db)
.await?;
```

**Importante:** En las columnas del RETURNING, los aliases con `as "nombre!"` son necesarios para que SQLx pueda mapear correctamente. El `!` indica que el campo no es opcional.

### 13.2 Query con sqlx::query (sin macro)

Para casos más complejos o con tipos que el macro no puede inferir:

```rust
let row = sqlx::query(
    r#"
        SELECT id, title, description, status, project_id, assigned_to, created_at 
        FROM tasks WHERE id = $1
    "#,
)
.bind(task_id)
.fetch_one(&db.db)
.await?;

let task = Task {
    id: row.get("id"),
    title: row.get("title"),
    description: row.get("description"),
    status: row.get("status"),
    project_id: row.get("project_id"),
    assigned_to: row.get("assigned_to"),
    created_at: row.get("created_at"),
};
```

### 13.3 fetch_optional vs fetch_one vs fetch_all

| Método | Uso | Cuándo no encuentra |
|--------|-----|---------------------|
| `fetch_one()` | Esperas exactamente 1 fila | Devuelve error |
| `fetch_optional()` | Puede ser 0 o 1 fila | Devuelve `Option::None` |
| `fetch_all()` | Múltiples filas | Devuelve vector vacío |

```rust
// fetch_one: espera 1 fila, error si no hay o hay más de 1
let user = sqlx::query_as!(...)...fetch_one(&db).await?;

// fetch_optional: puede ser 0 o 1
let user = sqlx::query_as!(...)...fetch_optional(&db).await?
    .ok_or(AppError::NotFound("User not found".to_string()))?;

// fetch_all: múltiples filas
let tasks = sqlx::query_as!(...)...fetch_all(&db).await?;
```

### 13.4 Query con parámetros opcionales

Para queries condicionales:

```rust
let tasks: Vec<Task> = if let Some(ref status) = status_filter {
    // Con filtro de status
    let rows = sqlx::query(
        "SELECT ... WHERE project_id = $1 AND status = $2 ..."
    )
    .bind(project_id)
    .bind(status)
    .bind(limit)
    .bind(offset)
    .fetch_all(&db.db)
    .await?;

    rows.into_iter()
        .map(|row| Task { ... })
        .collect()
} else {
    // Sin filtro
    let rows = sqlx::query(
        "SELECT ... WHERE project_id = $1 ..."
    )
    .bind(project_id)
    .bind(limit)
    .bind(offset)
    .fetch_all(&db.db)
    .await?;

    rows.into_iter()
        .map(|row| Task { ... })
        .collect()
};
```

### 13.5 Contar registros

```rust
let total: (i64,) = sqlx::query_as(
    "SELECT COUNT(*) FROM projects WHERE owner_id = $1"
)
.bind(user_id)
.fetch_one(&db.db)
.await?;

let count = total.0;
```

### 13.6 INSERT, UPDATE, DELETE sin retorno

```rust
let result = sqlx::query!(
    "DELETE FROM tasks WHERE id = $1",
    task_id
)
.execute(&db.db)
.await?;

if result.rows_affected() == 0 {
    return Err(AppError::NotFound("Task not found".to_string()));
}
```

---

## 14. REDIS CACHE

El caché está implementado en `cache/redis.rs` con tres funciones principales.

### 14.1 get_cache - Obtener del caché

```rust
pub async fn get_cache<T: DeserializeOwned>(
    mut conn: MultiplexedConnection,
    key: &str,
) -> Result<Option<T>, AppError> {
    let value: Option<String> = conn
        .get(key)
        .await
        .map_err(|e| AppError::InternalServerError(format!("Redis GET error: {}", e)))?;

    match value {
        Some(v) => {
            let data = serde_json::from_str(&v)?;
            Ok(Some(data))
        }
        None => Ok(None),
    }
}
```

### 14.2 set_cache - Guardar en caché

```rust
pub async fn set_cache<T: Serialize>(
    mut conn: MultiplexedConnection,
    key: &str,
    value: &T,
    ttl_seconds: u64,  // Time to live en segundos
) -> Result<(), AppError> {
    let serialized = serde_json::to_string(value)?;

    let _: () = conn
        .set_ex(key, serialized, ttl_seconds)
        .await?;

    Ok(())
}
```

### 14.3 invalidate_cache - Invalidar caché

```rust
pub async fn invalidate_cache(
    mut conn: MultiplexedConnection,
    pattern: &str,  // Patrón como "projects:user:123:*"
) -> Result<(), AppError> {
    // Buscar todas las llaves que coinciden con el patrón
    let keys: Vec<String> = conn.keys(pattern).await?;

    if !keys.is_empty() {
        let _: () = conn.del(keys).await?;
    }

    Ok(())
}
```

### 14.4 Patrones de claves de caché

El proyecto usa convenciones de nomenclatura consistentes:

```
projects:user:{user_id}:page:{page}:limit:{limit}
tasks:project:{project_id}:page:{page}:limit:{limit}:status:{status}
```

### 14.5 Cuándo invalidar el caché

**SIEMPRE** que se modifica la base de datos:

- Después de INSERT (crear)
- Después de UPDATE (actualizar)
- Después de DELETE (eliminar)

**Ejemplo en ProjectService:**

```rust
pub async fn create_project(...) -> Result<Project, AppError> {
    // ... crear en DB ...
    
    // Invalidar TODOS los caché de proyectos del usuario
    let _ = invalidate_cache(
        db.redis.clone(),
        &format!("projects:user:{}:*", user_id)
    ).await;

    Ok(project)
}
```

### 14.6 Estrategia de caché

El proyecto usa una estrategia de **cache-aside**:

1. **Leer**: primero intentar leer del caché; si no está, leer de la DB y guardar en caché
2. **Escribir**: al modificar, invalidar el caché paraforzar la próxima lectura desde DB

TTL típico: 60 segundos.

---

## 15. JWT Y AUTENTICACIÓN

JWT se usa para autenticar usuarios sin estado (stateless).

### 15.1 Generar JWT (en helpers/jwt.rs)

```rust
pub fn encode_jwt(email: String) -> Result<String, AppError> {
    // Expiración: 24 horas desde ahora
    let expiration = Utc::now()
        .checked_add_signed(Duration::hours(24))
        .expect("Timestamp válido")
        .timestamp();

    let claims = Claim {
        sub: email,  // Subject: el email del usuario
        exp: expiration as usize,
        iat: Utc::now().timestamp() as usize,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(JWT_SECRET.as_bytes()),
    )
    .map_err(|_| AppError::InternalServerError("Error codificando JWT".to_string()))
}
```

### 15.2 Decodificar JWT

```rust
pub fn decode_jwt(token: &str) -> Result<Claim, AppError> {
    let validation = Validation::default();

    let token_data: TokenData<Claim> = decode::<Claim>(
        token,
        &DecodingKey::from_secret(JWT_SECRET.as_bytes()),
        &validation,
    )
    .map_err(|_| AppError::Unauthorized("Token inválido o expirado".to_string()))?;

    Ok(token_data.claims)
}
```

### 15.3 Claim model

En `models/auth_model.rs`:

```rust
#[derive(Serialize, Deserialize, Clone)]
pub struct Claim {
    pub sub: String,   // Subject: email del usuario
    pub exp: usize,    // Expiration time
    pub iat: usize,    // Issued at
}
```

### 15.4 Cómo usar en AuthService

**Registro:**

```rust
pub async fn register_user(db: &AppState, payload: RegisterPayload) -> Result<User, AppError> {
    // 1. Hashear contraseña
    let hashed_password = hash_password(&payload.password)?;

    // 2. Insertar en DB
    let user = sqlx::query_as!(...)...fetch_one(&db.db).await?;

    Ok(user)
}
```

**Login:**

```rust
pub async fn login_user(db: &AppState, payload: LoginPayload) -> Result<String, AppError> {
    // 1. Buscar usuario por email
    let user = sqlx::query_as!(...)...fetch_optional(&db.db).await?
        .ok_or(AppError::NotFound("Invalid Credentials".to_string()))?;

    // 2. Verificar contraseña
    let valid_password = verify_password(&payload.password, &user.password_hash)?;
    if !valid_password {
        return Err(AppError::NotFound("Invalid Credentials".to_string()));
    }

    // 3. Generar token JWT
    let token = encode_jwt(user.email)?;
    Ok(token)
}
```

**Obtener user_id desde token:**

```rust
pub async fn get_user_id_from_token(
    db: &AppState,
    token: &str,
) -> Result<uuid::Uuid, AppError> {
    // 1. Decodificar token
    let claims = decode_jwt(token)?;

    // 2. Buscar usuario en DB por email (del subject)
    let user = sqlx::query_as!(...)
        .fetch_optional(&db.db).await?
        .ok_or(AppError::NotFound("User not found".to_string()))?;

    Ok(user.id)
}
```

### 15.5如何使用 en Handlers

```rust
pub async fn create_project(
    State(db): State<AppState>,
    TypedHeader(Authorization(bearer)): TypedHeader<Authorization<Bearer>>,
    Json(payload): Json<CreateProjectPayload>,
) -> Result<Json<ApiResponse<Project>>, AppError> {
    // Extraer user_id del token JWT
    let user_id = AuthService::get_user_id_from_token(&db, bearer.token()).await?;

    // Continuar con el handler...
}
```

---

## 16. CÓMO AGREGAR UN NUEVO ENDPOINT COMPLETO

Ahora que entiendes todo el flujo, te explico cómo agregar un nuevo endpoint completo. Vamos a假设 quieres agregar un endpoint para gestionar "comentarios" en las tareas.

### Paso 1: Crear la migración

En `migrations/`, crear `20260202002000_create_comments.sql`:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_task_id ON comments(task_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
```

### Paso 2: Agregar el modelo

Crear `src/models/comment_model.rs`:

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Comment {
    pub id: Uuid,
    pub content: String,
    pub task_id: Uuid,
    pub user_id: Uuid,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct CreateCommentPayload {
    pub content: String,
    pub task_id: Uuid,
}

#[derive(Debug, Deserialize, Clone)]
pub struct UpdateCommentPayload {
    pub content: Option<String>,
}
```

Agregar al `models/mod.rs`:

```rust
pub mod comment_model;
```

### Paso 3: Crear el servicio

Crear `src/services/comment_service.rs`:

```rust
use crate::{
    cache::redis::invalidate_cache,
    helpers::errors::AppError,
    models::{
        comment_model::{CreateCommentPayload, UpdateCommentPayload, Comment},
        api_model::PaginatedResponse,
    },
    states::AppState,
};

pub struct CommentService;

impl CommentService {
    /// Crear un nuevo comentario
    pub async fn create(
        db: &AppState,
        user_id: uuid::Uuid,
        payload: CreateCommentPayload,
    ) -> Result<Comment, AppError> {
        // Verificar que la tarea existe y pertenece a un proyecto del usuario
        let _task = sqlx::query!(
            "SELECT id FROM tasks t INNER JOIN projects p ON t.project_id = p.id WHERE t.id = $1 AND p.owner_id = $2",
            payload.task_id,
            user_id
        )
        .fetch_optional(&db.db)
        .await?
        .ok_or(AppError::NotFound("Task not found".to_string()))?;

        // Insertar comentario
        let comment = sqlx::query_as!(
            Comment,
            r#"
                INSERT INTO comments (content, task_id, user_id)
                VALUES ($1, $2, $3)
                RETURNING id, content, task_id, user_id, created_at as "created_at!"
            "#,
            payload.content,
            payload.task_id,
            user_id
        )
        .fetch_one(&db.db)
        .await?;

        // Invalidar caché de comentarios de la tarea
        let _ = invalidate_cache(
            db.redis.clone(),
            &format!("comments:task:{}:*", payload.task_id)
        ).await;

        Ok(comment)
    }

    /// Obtener comentarios de una tarea con paginación
    pub async fn get_by_task(
        db: &AppState,
        user_id: uuid::Uuid,
        task_id: uuid::Uuid,
        page: i64,
        limit: i64,
    ) -> Result<PaginatedResponse<Comment>, AppError> {
        // Verificar que la tarea existe y es del usuario
        let _task = sqlx::query!(
            "SELECT id FROM tasks t INNER JOIN projects p ON t.project_id = p.id WHERE t.id = $1 AND p.owner_id = $2",
            task_id,
            user_id
        )
        .fetch_optional(&db.db)
        .await?
        .ok_or(AppError::NotFound("Task not found".to_string()))?;

        // Intentar obtener del cache
        let cache_key = format!("comments:task:{}:page:{}:limit:{}", task_id, page, limit);

        if let Some(cached) = 
            get_cache::<PaginatedResponse<Comment>>(db.redis.clone(), &cache_key).await? 
        {
            tracing::info!("Cache hit for comments");
            return Ok(cached);
        }

        let offset = (page - 1) * limit;

        // Obtener total
        let total: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM comments WHERE task_id = $1"
        )
        .bind(task_id)
        .fetch_one(&db.db)
        .await?;

        // Obtener comentarios
        let comments = sqlx::query_as!(
            Comment,
            r#"
                SELECT id, content, task_id, user_id, created_at as "created_at!"
                FROM comments
                WHERE task_id = $1
                ORDER BY created_at DESC
                LIMIT $2 OFFSET $3
            "#,
            task_id,
            limit,
            offset
        )
        .fetch_all(&db.db)
        .await?;

        let meta = PaginationMeta::new(page, limit, total.0);
        let response = PaginatedResponse { data: comments, meta };

        // Guardar en cache
        let _ = set_cache(db.redis.clone(), &cache_key, &response, 60).await;

        Ok(response)
    }

    /// Eliminar un comentario
    pub async fn delete(
        db: &AppState,
        user_id: uuid::Uuid,
        comment_id: uuid::Uuid,
    ) -> Result<(), AppError> {
        // Verificar que el comentario existe y pertenece al usuario
        let task_id: Option<uuid::Uuid> = sqlx::query_scalar(
            "SELECT task_id FROM comments WHERE id = $1 AND user_id = $2"
        )
        .bind(comment_id)
        .bind(user_id)
        .fetch_optional(&db.db)
        .await?;

        let task_id = task_id.ok_or(AppError::NotFound("Comment not found".to_string()))?;

        // Eliminar
        let result = sqlx::query!("DELETE FROM comments WHERE id = $1", comment_id)
            .execute(&db.db)
            .await?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound("Comment not found".to_string()));
        }

        // Invalidar cache
        let _ = invalidate_cache(
            db.redis.clone(),
            &format!("comments:task:{}:*", task_id)
        ).await;

        Ok(())
    }
}
```

Agregar al `services/mod.rs`:

```rust
pub mod comment_service;
```

### Paso 4: Crear el handler

Crear `src/handlers/comment_handler.rs`:

```rust
use axum::{
    Json,
    extract::{Path, Query, State},
};
use axum_extra::{
    TypedHeader,
    headers::{Authorization, authorization::Bearer},
};

use crate::{
    helpers::errors::AppError,
    models::{
        api_model::{ApiResponse, PaginatedResponse, PaginationParams},
        comment_model::{CreateCommentPayload, Comment},
    },
    services::{auth_service::AuthService, comment_service::CommentService},
    states::AppState,
};

pub async fn create_comment(
    State(db): State<AppState>,
    TypedHeader(Authorization(bearer)): TypedHeader<Authorization<Bearer>>,
    Json(payload): Json<CreateCommentPayload>,
) -> Result<Json<ApiResponse<Comment>>, AppError> {
    let user_id = AuthService::get_user_id_from_token(&db, bearer.token()).await?;

    let comment = CommentService::create(&db, user_id, payload).await?;

    let response = ApiResponse::success(comment, "Comment created successfully");
    Ok(Json(response))
}

pub async fn get_comments(
    State(db): State<AppState>,
    TypedHeader(Authorization(bearer)): TypedHeader<Authorization<Bearer>>,
    Path(task_id): Path<uuid::Uuid>,
    Query(params): Query<PaginationParams>,
) -> Result<Json<ApiResponse<PaginatedResponse<Comment>>>, AppError> {
    let user_id = AuthService::get_user_id_from_token(&db, bearer.token()).await?;

    let page = params.page.unwrap_or(1);
    let limit = params.limit.unwrap_or(10);

    let comments = CommentService::get_by_task(&db, user_id, task_id, page, limit).await?;

    let response = ApiResponse::success(comments, "Comments retrieved successfully");
    Ok(Json(response))
}

pub async fn delete_comment(
    State(db): State<AppState>,
    TypedHeader(Authorization(bearer)): TypedHeader<Authorization<Bearer>>,
    Path(comment_id): Path<uuid::Uuid>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    let user_id = AuthService::get_user_id_from_token(&db, bearer.token()).await?;

    CommentService::delete(&db, user_id, comment_id).await?;

    let response = ApiResponse::success((), "Comment deleted successfully");
    Ok(Json(response))
}
```

Agregar al `handlers/mod.rs`:

```rust
pub mod comment_handler;
```

### Paso 5: Crear las rutas

Crear `src/routes/v1/comment_routes.rs`:

```rust
use axum::{
    Router,
    routing::{delete, get, post},
};

use crate::{handlers::comment_handler, middlewares::auth_middleware, states::AppState};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/tasks/{task_id}/comments", post(comment_handler::create_comment))
        .route("/tasks/{task_id}/comments", get(comment_handler::get_comments))
        .route("/comments/{id}", delete(comment_handler::delete_comment))
        .layer(axum::middleware::from_fn(auth_middleware::auth_middleware))
}
```

Agregar al `routes/v1/mod.rs`:

```rust
pub mod comment_routes;
```

Y modificar `routes/v1/mod.rs` para incluir las rutas:

```rust
pub fn v1_routes() -> Router<AppState> {
    Router::new()
        .route("/", get(|| async { "Server running" }))
        .merge(auth_routes::routes())
        .merge(project_routes::routes())
        .merge(task_routes::routes())
        .merge(comment_routes::routes())  // AGREGAR ESTA LÍNEA
}
```

### Resumen de archivos modificados/creados

| Acción | Archivo |
|--------|---------|
| CREAR | `migrations/20260202002000_create_comments.sql` |
| CREAR | `src/models/comment_model.rs` |
| MODIFICAR | `src/models/mod.rs` |
| CREAR | `src/services/comment_service.rs` |
| MODIFICAR | `src/services/mod.rs` |
| CREAR | `src/handlers/comment_handler.rs` |
| MODIFICAR | `src/handlers/mod.rs` |
| CREAR | `src/routes/v1/comment_routes.rs` |
| MODIFICAR | `src/routes/v1/mod.rs` |

---

## 17. MIGRACIONES DE BASE DE DATOS

Las migraciones son scripts SQL que modifican el esquema de la base de datos.

### 17.1 Estructura de una migración

```sql
-- Nombre descriptivo: YYYYMMDDHHMMSS_descripcion.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- Si necesitas UUIDs

CREATE TABLE nombre_tabla (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    columna1 TEXT NOT NULL,
    columna2 INTEGER,
    columna3 UUID REFERENCES otra_tabla(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_tabla_columna ON tabla(columna);
```

### 17.2 Migraciones existentes del proyecto

**users (20260202001839_create_users.sql):**

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

**projects (20260202001849_create_projects.sql):**

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_owner_id ON projects(owner_id);
```

**tasks (20260202001900_crate_tasks.sql):**

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'done')),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 17.3 Tipos de datos comunes

| Tipo SQL | Descripción | Ejemplo |
|----------|-------------|---------|
| UUID | Identificador único | `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()` |
| TEXT | Texto largo | `name TEXT NOT NULL` |
| INTEGER | Número entero | `age INTEGER` |
| BOOLEAN | Booleano | `active BOOLEAN DEFAULT true` |
| TIMESTAMPTZ | Fecha con timezone | `created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP` |
| CHECK | Restricción | `status TEXT CHECK (status IN ('a', 'b'))` |

### 17.4 Foreign Keys y Cascadas

```sql
-- ON DELETE CASCADE: al borrar el padre, se borran los hijos
project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE

-- ON DELETE SET NULL: al borrar el padre, se pone NULL
assigned_to UUID REFERENCES users(id) ON DELETE SET NULL

-- ON DELETE SET DEFAULT: al borrar el padre, se pone valor por defecto
-- ON DELETE RESTRICT: no permite borrar si hay hijos
```

### 17.5 Cómo ejecutar migraciones

```bash
# Instalar sqlx-cli
cargo install sqlx-cli

# Ejecutar todas las migraciones pendientes
sqlx migrate run

# Crear una nueva migración
sqlx migrate add create_comments

# Revertir la última migración
sqlx migrate revert
```

O ejecuta los archivos SQL manualmente:

```bash
psql $DATABASE_URL -f migrations/20260202001839_create_users.sql
psql $DATABASE_URL -f migrations/20260202001849_create_projects.sql
psql $DATABASE_URL -f migrations/20260202001900_crate_tasks.sql
```

---

## 18. CONFIGURACIÓN CON VARIABLES DE ENTORNO

La configuración se maneja con variables de entorno, cargadas con `dotenvy`.

### 18.1 Archivo .env.example

```env
JWT_SECRET="tu_secreto_super_seguro_aqui"
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgres://user:password@localhost:5432/taskflow_db
REDIS_URL=redis://localhost:6379
```

### 18.2 Cómo se leen las variables

En `config/constants.rs`:

```rust
use std::env;
use once_cell::sync::Lazy;

pub static DATABASE_URL: Lazy<String> =
    Lazy::new(|| env::var("DATABASE_URL").expect("DATABASE_URL not be defined"));

pub static REDIS_URL: Lazy<String> =
    Lazy::new(|| env::var("REDIS_URL").expect("REDIS_URL not be defined"));

pub static JWT_SECRET: Lazy<String> =
    Lazy::new(|| env::var("JWT_SECRET").expect("JWT_SECRET not be defined"));

pub static FRONTEND_URL: Lazy<String> =
    Lazy::new(|| env::var("FRONTEND_URL").expect("FRONTEND_URL not be defined"));
```

- `once_cell::sync::Lazy`: inicialización lazy (solo se calcula cuando se usa)
- `env::var()`: lee variable de entorno
- `.expect()`: si no existe, panic con mensaje

### 18.3 Cargar .env en main.rs

```rust
use dotenvy::dotenv;

#[tokio::main]
async fn main() {
    dotenv().ok();  // Carga .env si existe (no falla si no existe)
    // ... resto del código
}
```

---

## 19. BUENAS PRÁCTICAS Y PATRONES

Aquí están las convenciones y patrones que este proyecto sigue:

### 19.1 Nombres de archivos

- Módulos en snake_case: `auth_handler.rs`, `project_service.rs`
- Módulos en plural para colecciones: `tasks`, `projects`, `comments`

### 19.2 Estructura de módulos

```rust
// mod.rs - declarar submódulos
pub mod handler1;
pub mod handler2;

// handler.rs - imports y código
use crate::module::Something;
// ...
```

### 19.3 Imports organizados

El orden recomendado de imports:

```rust
// 1. Imports de Rust std
use std::...;

// 2. Imports de crates externos
use axum::{...};
use serde::{...};

// 3. Imports del propio proyecto
use crate::{
    helpers::...,
    models::...,
    services::...,
    states::...,
};
```

### 19.4 Nombres de funciones

- Funciones de servicio: `create_project`, `get_by_id`, `update`, `delete`
- Funciones de handler: `create_project`, `get_projects`, `get_project`
- Verbos para operaciones: `create`, `get`, `update`, `delete`
- Nombres descriptivos para helpers: `hash_password`, `verify_password`, `encode_jwt`

### 19.5 Errores

- Siempre usar `AppError` para errores de la aplicación
- Devolver `Result<T, AppError>` en servicios y handlers
- Usar el tipo de error apropiado:
  - `NotFound`: recurso no encontrado
  - `BadRequest`: datos inválidos del cliente
  - `Unauthorized`: no autenticado
  - `Forbidden`: autenticado pero no autorizado
  - `InternalServerError`: errores inesperados

### 19.6 Nombres de rutas

- Plural para colecciones: `/projects`, `/tasks`, `/users`
- Nested para relaciones: `/projects/{id}/tasks`
- Verbos HTTP indican la operación: GET para leer, POST para crear, etc.

### 19.7 Caché

- Siempre invalidar después de CREATE, UPDATE, DELETE
- Usar patrones de nombres consistentes
- TTL corto (60 segundos es un buen default)
- No cachear datos sensibles

### 19.8 Seguridad

- Nunca guardar passwords en texto plano (usar bcrypt)
- Nunca devolver password_hash en responses (usar `#[serde(skip_serializing)]`)
- Siempre verificar ownership antes de permitir operaciones
- Validar inputs del usuario
- Usar tokens JWT con expiración

### 19.9 Paginación

- Siempre paginar endpoints que devuelven listas
- Parámetros: `page` y `limit` (con defaults: page=1, limit=10)
- Devolver metadatos: page, limit, total, total_page

### 19.10 Logging

- Usar `tracing` para logging estructurado
- Loguear cache hits para debug
- Loguear operaciones importantes

---

## RESUMEN RÁPIDO

| Qué necesitas | Dónde buscar |
|---------------|--------------|
| Crear modelo | `src/models/nombre_model.rs` |
| Crear servicio | `src/services/nombre_service.rs` |
| Crear handler | `src/handlers/nombre_handler.rs` |
| Crear ruta | `src/routes/v1/nombre_routes.rs` |
| Error personalizado | `src/helpers/errors.rs` |
| Config | `src/config/constants.rs` |
| Cache | `src/cache/redis.rs` |
| JWT | `src/helpers/jwt.rs` |
| Estado app | `src/states/mod.rs` |
| Main | `src/main.rs` |


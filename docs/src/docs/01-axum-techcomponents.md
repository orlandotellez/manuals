# Manual de Usuario: Backend Rust con Axum

Este manual proporciona una guía completa para configurar, comprender y ejecutar el proyecto de backend desarrollado en Rust utilizando el framework Axum. El proyecto implementa un sistema de autenticación robusto con PostgreSQL como base de datos principal, incluyendo gestión de sesiones, tokens JWT y manejo de cuentas de usuario.

## 1. Requisitos Previos

Antes de comenzar con la configuración del proyecto, es necesario contar con las herramientas fundamentales que permiten compilar y ejecutar aplicaciones Rust junto con la base de datos PostgreSQL. A continuación se detallan los pasos para la instalación de cada componente necesario en el sistema.

### 1.1 Instalación de Rust

Rust se instala mediante rustup, una herramienta que gestiona las versiones del compilador y las herramientas asociadas. El proceso de instalación es straightforward y funciona en los principales sistemas operativos. Para instalar Rust en el sistema, se debe ejecutar el siguiente comando en la terminal:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Este comando descarga el script de instalación y lo ejecuta de manera interactiva. Durante el proceso de instalación, se preguntará si desea usar la configuración por defecto o personalizar las opciones. Para la mayoría de los usuarios, la opción por defecto es suficiente. Una vez completada la instalación, es necesario reiniciar la terminal o ejecutar el siguiente comando para cargar las variables de entorno:

```bash
source $HOME/.cargo/env
```

Para verificar que la instalación fue exitosa, puede ejecutar el comando `rustc --version` que debería mostrar la versión del compilador instalada. Adicionalmente, se recomienda verificar que cargo esté disponible ejecutando `cargo --version`. El ecosistema Rust incluye cargo como su gestor de paquetes y herramientas de compilación.

Si ya tiene Rust instalado pero necesita actualizarlo a la versión más reciente, puede ejecutar el comando `rustup update`. Es importante destacar que este proyecto utiliza la edición 2024 de Rust, por lo que se requiere una versión reciente del compilador que soporte esta edición.

### 1.2 Instalación de PostgreSQL

PostgreSQL es un sistema de gestión de bases de datos relacional robusto y ampliamente utilizado. La instalación varía según el sistema operativo que esté utilizando. En sistemas basados en Debian o Ubuntu, puede instalar PostgreSQL mediante apt:

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

En sistemas macOS, la forma más sencilla de instalar PostgreSQL es mediante Homebrew:

```bash
brew install postgresql
brew services start postgresql
```

En Windows, puede descargar el instalador oficial desde el sitio web de PostgreSQL o utilizar herramientas como Chocolatey. Una vez instalado, el servicio de PostgreSQL debe estar en ejecución. Puede verificar el estado del servicio en sistemas Linux ejecutando:

```bash
sudo systemctl status postgresql
```

O en caso de usar macOS con Homebrew:

```bash
brew services list
```

### 1.3 Crear la Base de Datos

Una vez que PostgreSQL está instalado y en ejecución, es necesario crear la base de datos que utilizará la aplicación. El proyecto está configurado para utilizar una base de datos llamada `techcomponents_db`. Para crear esta base de datos, primero acceda al shell de PostgreSQL ejecutando:

```bash
sudo -u postgres psql
```

Dentro del shell de PostgreSQL, puede crear la base de datos ejecutando el siguiente comando SQL:

```sql
CREATE DATABASE techcomponents_db;
```

También debe crear un usuario con los permisos necesarios para acceder a esta base de datos. Ejecute los siguientes comandos en el shell de PostgreSQL:

```sql
CREATE USER new_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE techcomponents_db TO new_user;
```

Es importante asegurarse de que las credenciales coincidan con las especificadas en el archivo `.env` del proyecto. El usuario `new_user` debe tener privilegios suficientes para crear tablas y realizar operaciones en la base de datos `techcomponents_db`.

## 2. Estructura de Directorios

El proyecto sigue una organización modular que separa las responsabilidades en diferentes capas. Esta estructura facilita el mantenimiento del código y la escalabilidad de la aplicación. A continuación se presenta el árbol completo de directorios y archivos del proyecto:

```
backend/
├── .env                          # Variables de entorno
├── Cargo.toml                    # Dependencias del proyecto
├── Cargo.lock                    # Lock file de dependencias
├── src/
│   ├── main.rs                   # Punto de entrada de la aplicación
│   ├── database/
│   │   ├── mod.rs                # Módulo de base de datos
│   │   ├── connection.rs         # Configuración del pool de conexiones
│   │   └── migrations/
│   │       └── 20260326191559_init.sql  # Migración inicial de la base de datos
│   ├── routes/
│   │   └── mod.rs                # Configuración de rutas principales
│   ├── features/
│   │   └── mod.rs                # Módulo de características
│   │   └── auth/
│   │       ├── mod.rs            # Módulo de autenticación
│   │       ├── routes.rs         # Rutas de autenticación
│   │       ├── login/
│   │       │   ├── mod.rs
│   │       │   ├── handler.rs    # Manejador de login
│   │       │   ├── service.rs    # Lógica de negocio de login
│   │       │   ├── request.rs   # Estructura de solicitud
│   │       │   └── response.rs  # Estructura de respuesta
│   │       ├── register/
│   │       │   ├── mod.rs
│   │       │   ├── handler.rs    # Manejador de registro
│   │       │   ├── service.rs    # Lógica de negocio de registro
│   │       │   ├── request.rs    # Estructura de solicitud
│   │       │   └── response.rs   # Estructura de respuesta
│   │       └── refresh/
│   │           ├── mod.rs
│   │           ├── handler.rs    # Manejador de refresh
│   │           ├── service.rs    # Lógica de negocio de refresh
│   │           └── response.rs   # Estructura de respuesta
│   └── shared/
│       ├── mod.rs                # Módulo compartido
│       ├── config/
│       │   ├── mod.rs
│       │   └── constants.rs      # Constantes de configuración
│       ├── errors/
│       │   └── mod.rs            # Manejo de errores personalizados
│       ├── helpers/
│       │   ├── mod.rs
│       │   ├── jwt.rs            # Funciones JWT
│       │   ├── password.rs       # Funciones de contraseña
│       │   └── cookies.rs        # Funciones de cookies
│       ├── models/
│       │   ├── mod.rs
│       │   ├── user_model.rs     # Modelo de usuario
│       │   ├── account_model.rs  # Modelo de cuenta
│       │   ├── session_model.rs  # Modelo de sesión
│       │   └── verification_model.rs  # Modelo de verificación
│       └── state/
│           └── mod.rs            # Estado de la base de datos
└── target/                       # Directorio de compilación (generado automáticamente)
```

Esta estructura sigue el patrón de arquitectura limpia, donde cada módulo tiene una responsabilidad específica. El directorio `features` contiene las funcionalidades de negocio, mientras que `shared` contiene utilidades y configuraciones que se reutilizan en toda la aplicación.

## 3. Cargo.toml

El archivo `Cargo.toml` define todas las dependencias necesarias para el proyecto. Estas dependencias incluyen el framework web, herramientas de base de datos, bibliotecas de autenticación y utilidades varias. A continuación se presenta el contenido completo del archivo con todas las dependencias actuales:

```toml
[package]
name = "backend"
version = "0.1.0"
edition = "2024"

[dependencies]
home = "=0.5.11"

# Framework Web
axum = { version = "0.8.8", features = ["macros"] }
axum-extra = { version = "0.10", features = ["typed-header", "cookie"] }
tower-http = { version = "0.6.6", features = ["cors"] }
tokio = { version = "1", features = ["full"] }

# Base de datos
sqlx = { version = "0.8.6", features = [
    "runtime-tokio-rustls",
    "postgres",
    "chrono",
    "uuid",
    "migrate",
    "macros"
] }

# Cache Redis
redis = { version = "0.27", features = ["aio", "tokio-comp", "json"] }

# Serialización
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Autenticación
jsonwebtoken = { version = "10", default-features = false, features = ["rust_crypto"] }
bcrypt = "0.15"
time = "0.3"

# Utilidades
uuid = { version = "1", features = ["v4", "v5", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
once_cell = "1.19"
dotenvy = "0.15"

# Validación
validator = { version = "0.19", features = ["derive"] }

# Logging
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
```

Cada dependencia cumple un propósito específico en la aplicación. El framework Axum proporciona las capacidades de servidor web, mientras que sqlx ofrece acceso a la base de datos PostgreSQL. Las bibliotecas jsonwebtoken y bcrypt se utilizan para la autenticación mediante tokens JWT y el hash de contraseñas respectivamente. El paquete dotenvy permite cargar variables de entorno desde el archivo `.env`.

## 4. Variables de Entorno

El proyecto utiliza un archivo `.env` para configurar las variables de entorno necesarias para su funcionamiento. Estas variables incluyen la cadena de conexión a la base de datos y la clave secreta para la generación de tokens JWT. El archivo `.env` debe estar ubicado en la raíz del proyecto y contener las siguientes variables:

```
DATABASE_URL=postgres://new_user:password@localhost:5432/techcomponents_db
JWT_SECRET=super_secret_JWT
```

La variable `DATABASE_URL` contiene la cadena de conexión a PostgreSQL en el formato estándar de URI. Esta cadena incluye el protocolo `postgres://`, el nombre de usuario `dev-espada`, la contraseña `espadaPOSTGRES`, la dirección del servidor `localhost`, el puerto `5432` y el nombre de la base de datos `techcomponents_db`. Es importante ajustar estas credenciales según la configuración de su instalación de PostgreSQL.

La variable `JWT_SECRET` es la clave secreta utilizada para firmar los tokens JWT. En un entorno de producción, esta clave debe ser una cadena larga y compleja que nunca se comparta públicamente. Nunca compromita esta clave en un repositorio público. El proyecto utiliza la biblioteca `dotenvy` para cargar estas variables de entorno automáticamente al iniciar la aplicación.

## 5. Migración de Base de Datos

El archivo de migración contiene la definición completa de todas las tablas necesarias para el funcionamiento de la aplicación. Esta migración crea las tablas de usuarios, sesiones, cuentas, verificaciones, categorías y productos. El archivo SQL se encuentra en `src/database/migrations/20260326191559_init.sql` y su contenido completo es el siguiente:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
  name TEXT NOT NULL, 
  email TEXT NOT NULL UNIQUE, 
  email_verified BOOLEAN NOT NULL, 
  image TEXT, 
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL, 
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- session
CREATE TABLE session (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
  expires_at TIMESTAMPTZ NOT NULL, 
  token TEXT NOT NULL UNIQUE, 
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL, 
  updated_at TIMESTAMPTZ NOT NULL, 
  ip_address TEXT,
  user_agent TEXT, 
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- account
CREATE TABLE account (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
  account_id TEXT NOT NULL, 
  provider_id TEXT NOT NULL, 
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
  access_token TEXT, 
  refresh_token TEXT, 
  id_token TEXT, 
  access_token_expires_at TIMESTAMPTZ, 
  refresh_token_expires_at TIMESTAMPTZ, 
  scope TEXT, 
  password TEXT, 
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL, 
  updated_at TIMESTAMPTZ NOT NULL
);

-- verification
CREATE TABLE verification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
  identifier TEXT NOT NULL, 
  value TEXT NOT NULL, 
  expires_at TIMESTAMPTZ NOT NULL, 
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL, 
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- category
CREATE TABLE category (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT
);

-- product
CREATE TABLE product (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
  category_id UUID NOT NULL REFERENCES category(id) ON DELETE CASCADE, 
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  active TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL, 
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

Cada tabla cumple un propósito específico en el sistema. La tabla `users` almacena la información principal de los usuarios, incluyendo su nombre, correo electrónico y estado de verificación. La tabla `session` gestiona las sesiones activas de los usuarios, almacenando el token de sesión, la información de expiración y los metadatos como la dirección IP y el user agent. La tabla `account` permite almacenar múltiples cuentas de autenticación por usuario, soportando diferentes proveedores como OAuth o autenticación por contraseña.

La tabla `verification` se utiliza para almacenar códigos de verificación de correo electrónico durante el proceso de registro. Las tablas `category` y `product` proporcionan la estructura básica para un catálogo de productos, con relaciones de clave foránea que permiten categorizar los productos.

Para ejecutar esta migración manualmente, puede utilizar la herramienta `sqlx` o ejecutar directamente el archivo SQL mediante psql. Asegúrese de que la base de datos exista antes de ejecutar la migración.

## 6. Módulos Core

Los módulos core constituyen la base de la aplicación y proporcionan la estructura fundamental sobre la cual se construyen las características. Estos módulos incluyen el punto de entrada, la conexión a la base de datos y el sistema de enrutamiento.

### 6.1 main.rs

El archivo `main.rs` es el punto de entrada de la aplicación. Configura el servidor, inicializa la conexión a la base de datos y arranca el servidor web en el puerto especificado. El contenido del archivo es el siguiente:

```rust
mod database;
mod features;
mod routes;
mod shared;

use axum::Router;
use dotenvy::dotenv;
use tokio::net::TcpListener;

use crate::database::connection::create_pool;

const PORT: i32 = 3000;
const HOST: &str = "0.0.0.0";

#[tokio::main]
async fn main() {
    dotenv().ok();

    let db = create_pool().await.expect("Error connect database");

    let router: Router = routes::create_routes().with_state(db);

    let addr: String = format!("{}:{}", HOST, PORT);

    let listener: TcpListener = TcpListener::bind(&addr).await.unwrap();

    println!("servidor iniciado en http://{}", &addr);

    axum::serve(listener, router).await.unwrap()
}
```

La función principal carga las variables de entorno mediante `dotenv`, crea un pool de conexiones a la base de datos, configura las rutas con el estado de la base de datos y comienza a escuchar en el puerto 3000. El servidor está configurado para aceptar conexiones desde cualquier dirección IP mediante el uso de `0.0.0.0` como host.

### 6.2 database/mod.rs y connection.rs

El módulo de base de datos proporciona la funcionalidad para conectar con PostgreSQL. El archivo `mod.rs` simplemente reexporta el módulo de conexión:

```rust
pub mod connection;
```

El archivo `connection.rs` contiene la función que crea el pool de conexiones a la base de datos:

```rust
use sqlx::{PgPool, postgres::PgPoolOptions};

use crate::shared::config::constants::DATABASE_URL;

pub async fn create_pool() -> Result<PgPool, sqlx::Error> {
    tracing::info!("database url {}", &DATABASE_URL.to_string());

    PgPoolOptions::new()
        .max_connections(5)
        .connect(&DATABASE_URL)
        .await
}
```

El pool de conexiones permite manejar múltiples conexiones simultáneas a la base de datos de manera eficiente. La configuración actual establece un máximo de 5 conexiones simultáneas, lo cual es adecuado para desarrollo y pruebas. En producción, este valor puede ajustarse según las necesidades del sistema.

### 6.3 routes/mod.rs

El módulo de rutas configura todas las rutas disponibles en la aplicación:

```rust
use axum::Router;

use crate::{features, shared::state::DbState};

pub fn create_routes() -> Router<DbState> {
    Router::new().nest("/api/v1/auth", features::auth::routes::routes())
}
```

Las rutas están organizadas bajo el prefijo `/api/v1/auth` y todas las funcionalidades de autenticación se encuentran anidadas bajo este prefijo. El estado de la base de datos se pasa a todas las rutas mediante el método `with_state`.

## 7. Shared Module

El módulo shared contiene funcionalidades compartidas que se utilizan en toda la aplicación. Estos componentes proporcionan utilities para el manejo del estado, configuración, errores, helpers y modelos de datos.

### 7.1 State (DbState)

El estado de la base de datos se define como un tipo simple que representa el pool de conexiones:

```rust
use sqlx::PgPool;

pub type DbState = PgPool;
```

Este tipo se utiliza en todas partes de la aplicación para tipar el estado que se pasa a los handlers de Axum. Al definirlo como un type alias, se facilita el cambio de la implementación subyacente en el futuro si es necesario.

### 7.2 Config (Constants)

Las constantes de configuración se cargan desde las variables de entorno utilizando una estructura lazy para garantizar que estén disponibles cuando se necesiten:

```rust
use std::env;

use once_cell::sync::Lazy;

pub static DATABASE_URL: Lazy<String> =
    Lazy::new(|| env::var("DATABASE_URL").expect("DATABASE_URL not be defined"));

pub static JWT_SECRET: Lazy<String> =
    Lazy::new(|| env::var("JWT_SECRET").expect("JWT_SECRET not be defined"));
```

El uso de `once_cell::sync::Lazy` garantiza que las variables se carguen una sola vez y de manera thread-safe. Si alguna de estas variables no está definida, la aplicación paneará al iniciar, lo cual es el comportamiento deseado para errores de configuración críticos.

### 7.3 Errors (AppError)

El manejo de errores está implementado mediante un enum personalizado que cubre todos los tipos de errores posibles en la aplicación:

```rust
use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde_json::json;

#[derive(Debug)]
#[allow(dead_code)]
pub enum AppError {
    NotFound(String),
    BadRequest(String),
    InternalServerError(String),
    Unauthorized(String),
    Forbidden(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message_error) = match self {
            AppError::NotFound(message) => (
                StatusCode::NOT_FOUND,
                json!({"error": "not_found", "message": message}),
            ),
            AppError::InternalServerError(message) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                json!({"error": "internal_server_error", "message": message}),
            ),
            AppError::Unauthorized(message) => (
                StatusCode::UNAUTHORIZED,
                json!({"error": "unauthorized", "message": message}),
            ),
            AppError::Forbidden(message) => (
                StatusCode::FORBIDDEN,
                json!({"error": "forbidden", "message": message}),
            ),
            AppError::BadRequest(message) => (
                StatusCode::BAD_REQUEST,
                json!({"error": "bad_request", "message": message}),
            ),
        };
        (status, Json(message_error)).into_response()
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        match err {
            sqlx::Error::RowNotFound => AppError::NotFound("Recurso no encontrado".to_string()),
            sqlx::Error::Database(db_err) => {
                let error_code = db_err.code();
                if let Some(code) = error_code {
                    if code == "23505" {
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

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::InternalServerError(format!("JSON error: {}", err))
    }
}
```

La implementación de `IntoResponse` permite que cualquier error se convierta automáticamente en una respuesta HTTP con el código de estado apropiado y un cuerpo JSON con el mensaje de error. Además, se proporcionan implementaciones de `From` para convertir errores de sqlx y serde_json en errores de la aplicación.

### 7.4 Helpers

Los helpers proporcionan funciones utilities para tareas comunes como la manipulación de JWT, contraseñas y cookies.

#### 7.4.1 JWT Helper

El helper de JWT proporciona funciones para codificar y decodificar tokens:

```rust
use chrono::{Duration, Utc};
use jsonwebtoken::{DecodingKey, EncodingKey, Header, TokenData, Validation, decode, encode};
use uuid::Uuid;

use crate::{
    features::auth::login::service::Claim,
    shared::{config::constants::JWT_SECRET, errors::AppError},
};

pub fn encode_jwt(id: Uuid) -> Result<String, AppError> {
    let expiration: i64 = Utc::now()
        .checked_add_signed(Duration::hours(24))
        .expect("Timestamp válido")
        .timestamp();

    let claims: Claim = Claim {
        sub: id,
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

pub fn decode_jwt(token: &str) -> Result<Claim, AppError> {
    let validation: Validation = Validation::default();

    let token_data: TokenData<Claim> = decode::<Claim>(
        token,
        &DecodingKey::from_secret(JWT_SECRET.as_bytes()),
        &validation,
    )
    .map_err(|_| AppError::Unauthorized("Token inválido o expirado".to_string()))?;

    Ok(token_data.claims)
}
```

Los tokens JWT tienen una validez de 24 horas desde su creación. La estructura del claim incluye el subject (el ID del usuario), el tiempo de expiración y el tiempo de emisión.

#### 7.4.2 Password Helper

El helper de contraseña proporciona funciones para hashear y verificar contraseñas:

```rust
use bcrypt::{DEFAULT_COST, hash, verify};

use crate::shared::errors::AppError;

pub fn hash_password(password: &str) -> Result<String, AppError> {
    hash(password, DEFAULT_COST)
        .map_err(|e| AppError::InternalServerError(format!("Error hasheando password: {}", e)))
}

pub fn verify_password(password: &str, hash: &str) -> Result<bool, AppError> {
    verify(password, hash)
        .map_err(|e| AppError::InternalServerError(format!("Error verificando password: {}", e)))
}
```

El algoritmo bcrypt con el costo por defecto proporciona un buen balance entre seguridad y rendimiento. El hash generado incluye el salt automáticamente, por lo que no es necesario almacenarlo por separado.

### 7.5 Models

Los modelos representan las estructuras de datos que se utilizan para interactuar con la base de datos. Cada modelo implementa las traits de Serde para serialización y deserialización, y sqlx::FromRow para mapear resultados de consultas SQL.

#### 7.5.1 User Model

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub email_verified: bool,
    pub image: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
```

#### 7.5.2 Account Model

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Account {
    pub id: Uuid,
    pub account_id: String,
    pub provider_id: String,
    pub user_id: String,
    pub access_token: Option<String>,
    pub refresh_token: Option<String>,
    pub id_token: Option<String>,
    pub access_token_expires_at: Option<DateTime<Utc>>,
    pub refresh_token_expires_at: Option<DateTime<Utc>>,
    pub scope: Option<String>,
    pub password: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
```

#### 7.5.3 Session Model

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Session {
    pub id: Uuid,
    pub expires_at: DateTime<Utc>,
    pub token: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub user_id: String,
}
```

#### 7.5.4 Verification Model

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Verification {
    pub id: Uuid,
    pub identifier: String,
    pub value: String,
    pub expires_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
```

## 8. Feature Auth Completa

El módulo de autenticación proporciona todas las funcionalidades necesarias para el registro, inicio de sesión y renovación de tokens de los usuarios. Este módulo está organizado en subdirectorios que separan cada funcionalidad.

### 8.1 Login

El proceso de login permite a los usuarios existentes autenticarse en el sistema.

#### 8.1.1 Login Request

La estructura de solicitud para login define los campos necesarios:

```rust
use serde::{Deserialize};
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct LoginRequest {
    #[validate(email(message = "Email inválido"))]
    pub email: String,
    #[validate(length(min = 6, message = "La contraseña debe tener al menos 6 caracteres"))]
    pub password: String,
}
```

#### 8.1.2 Login Response

La estructura de respuesta para login incluye el token y la información del usuario:

```rust
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user: UserResponse,
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub name: String,
    pub email: String,
}
```

#### 8.1.3 Login Service

El servicio de login contiene la lógica de negocio:

```rust
use chrono::{Duration, Utc};
use serde::{Deserialize};
use uuid::Uuid;

use crate::shared::{
    config::constants::JWT_SECRET,
    errors::AppError,
    helpers::{jwt::encode_jwt, password::verify_password},
    models::{account_model::Account, user_model::User},
};

#[derive(Debug, Deserialize)]
pub struct Claim {
    pub sub: Uuid,
    pub exp: usize,
    pub iat: usize,
}

pub async fn login(db: &sqlx::PgPool, email: &str, password: &str) -> Result<(String, User), AppError> {
    let user: User = sqlx::query_as::<_, User>(
        "SELECT id, name, email, email_verified, image, created_at, updated_at FROM users WHERE email = $1"
    )
    .bind(email)
    .fetch_one(db)
    .await?;

    let account: Account = sqlx::query_as::<_, Account>(
        "SELECT id, account_id, provider_id, user_id, access_token, refresh_token, id_token, access_token_expires_at, refresh_token_expires_at, scope, password, created_at, updated_at FROM account WHERE user_id = $1"
    )
    .bind(user.id.to_string())
    .fetch_one(db)
    .await?;

    let password_valid = verify_password(password, &account.password.unwrap_or_default())?;
    if !password_valid {
        return Err(AppError::Unauthorized("Credenciales inválidas".to_string()));
    }

    let token = encode_jwt(user.id)?;

    Ok((token, user))
}
```

#### 8.1.4 Login Handler

El handler de login procesa las solicitudes HTTP:

```rust
use axum::{extract::State, Json};
use crate::shared::{errors::AppError, state::DbState};

use super::{login::{request::LoginRequest, response::LoginResponse, service::login}, routes::auth_response};

pub async fn handler(
    State(db): State<DbState>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, AppError> {
    let (token, user) = login(&db, &req.email, &req.password).await?;

    let response = LoginResponse {
        token,
        user: LoginResponse {
            user: super::login::response::UserResponse {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        },
    };

    Ok(Json(auth_response(response)))
}
```

### 8.2 Register

El proceso de register permite a nuevos usuarios crear una cuenta en el sistema.

#### 8.2.1 Register Request

```rust
use serde::Deserialize;
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct RegisterRequest {
    #[validate(length(min = 3, message = "El nombre debe tener al menos 3 caracteres"))]
    pub name: String,
    #[validate(email(message = "Email inválido"))]
    pub email: String,
    #[validate(length(min = 6, message = "La contraseña debe tener al menos 6 caracteres"))]
    pub password: String,
}
```

#### 8.2.2 Register Response

```rust
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct RegisterResponse {
    pub id: Uuid,
    pub name: String,
    pub email: String,
}
```

#### 8.2.3 Register Service

```rust
use crate::shared::{
    errors::AppError,
    helpers::{jwt::encode_jwt, password::hash_password},
    models::{account_model::Account, user_model::User},
};

pub async fn register(
    db: &sqlx::PgPool,
    name: &str,
    email: &str,
    password: &str,
) -> Result<(String, User), AppError> {
    let hashed_password = hash_password(password)?;

    let user: User = sqlx::query_as::<_, User>(
        "INSERT INTO users (name, email, email_verified) VALUES ($1, $2, $3) RETURNING id, name, email, email_verified, image, created_at, updated_at"
    )
    .bind(name)
    .bind(email)
    .bind(false)
    .fetch_one(db)
    .await?;

    let account: Account = sqlx::query_as::<_, Account>(
        "INSERT INTO account (account_id, provider_id, user_id, password) VALUES ($1, $2, $3, $4) RETURNING id, account_id, provider_id, user_id, access_token, refresh_token, id_token, access_token_expires_at, refresh_token_expires_at, scope, password, created_at, updated_at"
    )
    .bind(user.id.to_string())
    .bind("credential")
    .bind(user.id.to_string())
    .bind(hashed_password)
    .fetch_one(db)
    .await?;

    let token = encode_jwt(user.id)?;

    Ok((token, user))
}
```

#### 8.2.4 Register Handler

```rust
use axum::{extract::State, Json};
use crate::shared::{errors::AppError, state::DbState};

use super::{register::{request::RegisterRequest, response::RegisterResponse, service::register}, routes::auth_response};

pub async fn handler(
    State(db): State<DbState>,
    Json(req): Json<RegisterRequest>,
) -> Result<Json<RegisterResponse>, AppError> {
    let (token, user) = register(&db, &req.name, &req.email, &req.password).await?;

    let response = RegisterResponse {
        id: user.id,
        name: user.name,
        email: user.email,
    };

    Ok(Json(auth_response(response)))
}
```

### 8.3 Refresh

El proceso de refresh permite a los usuarios renovar su token de autenticación sin necesidad de volver a iniciar sesión.

#### 8.3.1 Refresh Response

```rust
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct RefreshResponse {
    pub token: String,
}
```

#### 8.3.2 Refresh Service

```rust
use crate::shared::{
    errors::AppError,
    helpers::jwt::encode_jwt,
};

pub async fn refresh(db: &sqlx::PgPool, user_id: uuid::Uuid) -> Result<String, AppError> {
    let token = encode_jwt(user_id)?;
    Ok(token)
}
```

#### 8.3.3 Refresh Handler

```rust
use axum::{extract::State, Json};
use crate::shared::{errors::AppError, state::DbState};

use super::{refresh::{response::RefreshResponse, service::refresh}, routes::auth_response};

pub async fn handler(
    State(db): State<DbState>,
    user_id: uuid::Uuid,
) -> Result<Json<RefreshResponse>, AppError> {
    let token = refresh(&db, user_id).await?;

    let response = RefreshResponse { token };

    Ok(Json(auth_response(response)))
}
```

### 8.4 Routes

Las rutas de autenticación se definen en el archivo routes.rs dentro del módulo auth:

```rust
use axum::{
    routing::{get, post},
    Router,
};

use super::{login::handler::handler as login_handler, register::handler::handler as register_handler, refresh::handler::handler as refresh_handler};

pub fn routes() -> Router<crate::shared::state::DbState> {
    Router::new()
        .route("/login", post(login_handler))
        .route("/register", post(register_handler))
        .route("/refresh", get(refresh_handler))
}
```

## 9. Cómo Ejecutar

Esta sección proporciona las instrucciones necesarias para compilar y ejecutar el proyecto, junto con ejemplos de cómo usar los endpoints disponibles.

### 9.1 Compilación y Ejecución

Una vez que tiene todas las dependencias instaladas y la base de datos configurada, puede compilar el proyecto ejecutando:

```bash
cargo build
```

Este comando descarga y compila todas las dependencias, lo cual puede tomar varios minutos la primera vez que se ejecuta. Una vez completado, puede iniciar el servidor con:

```bash
cargo run
```

Alternativamente, si ya ha construido el proyecto previamente, puede ejecutar directamente el binario compilado:

```bash
cargo run --release
```

El flag `--release` optimiza el código para producción, resultando en un binario más rápido pero con tiempos de compilación más largos.

El servidor se iniciarán en `http://localhost:3000` y verá un mensaje en la consola indicando que el servidor está en ejecución.

### 9.2 Endpoints Disponibles

La API proporciona los siguientes endpoints para la autenticación de usuarios. Todos los endpoints están bajo el prefijo `/api/v1/auth`:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Iniciar sesión con email y contraseña |
| POST | `/api/v1/auth/register` | Registrar un nuevo usuario |
| GET | `/api/v1/auth/refresh` | Renovar el token JWT |

### 9.3 Ejemplos con curl

A continuación se presentan ejemplos de cómo utilizar cada endpoint mediante curl.

#### 9.3.1 Registrar un Usuario

Para registrar un nuevo usuario, envoye una solicitud POST con los datos del usuario:

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Juan Pérez", "email": "juan@example.com", "password": "password123"}'
```

La respuesta exitosa incluirá el ID del usuario, su nombre, correo electrónico y un token de autenticación:

```json
{
  "data": {
    "id": "uuid-del-usuario",
    "name": "Juan Pérez",
    "email": "juan@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 9.3.2 Iniciar Sesión

Para iniciar sesión, envoye una solicitud POST con el email y la contraseña:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "juan@example.com", "password": "password123"}'
```

La respuesta incluirá el token de autenticación y los datos del usuario:

```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-del-usuario",
      "name": "Juan Pérez",
      "email": "juan@example.com"
    }
  }
}
```

#### 9.3.3 Renovar Token

Para renovar el token de autenticación, envoye una solicitud GET al endpoint de refresh:

```bash
curl -X GET http://localhost:3000/api/v1/auth/refresh \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

La respuesta incluirá un nuevo token de autenticación:

```json
{
  "data": {
    "token": "nuevo-token-jwt..."
  }
}
```

### 9.4 Notas Adicionales

El proyecto está configurado para funcionar correctamente en un entorno de desarrollo local. Para un entorno de producción, considere los siguientes ajustes: cambie la variable `JWT_SECRET` por una clave más segura y compleja, ajuste el número de conexiones en el pool de base de datos según la carga esperada, configure HTTPS mediante un proxy inverso como Nginx o Traefik, e implemente rate limiting para prevenir ataques de fuerza bruta.

El sistema de logging utiliza la biblioteca `tracing`, por lo que puede configurar el nivel de detalle de los logs mediante la variable de entorno `RUST_LOG`. Por ejemplo, para ver todos los mensajes de debug, puede ejecutar la aplicación con `RUST_LOG=debug cargo run`.

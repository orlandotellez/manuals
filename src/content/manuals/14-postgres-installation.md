# Manual de PostgreSQL en Debian — Instalación y Configuración Completa

PostgreSQL es un sistema de gestión de bases de datos relacional de código abierto, conocido por su robustez, extensibilidad y cumplimiento estricto del estándar SQL. Este manual cubre la instalación completa usando el repositorio oficial de PostgreSQL, la configuración del usuario `dev-espada` y la forma de acceder directamente con `psql` sin parámetros adicionales.

---

## Índice

1. [Requisitos Previos](#1-requisitos-previos)
2. [Desinstalación Completa](#2-desinstalación-completa-hacer-primero-si-ya-tienes-postgres)
3. [Instalación desde el Repositorio Oficial](#3-instalación-desde-el-repositorio-oficial)
4. [Verificar la Instalación](#4-verificar-la-instalación)
5. [Configuración del Usuario dev-espada](#5-configuración-del-usuario-dev-espada)
6. [Acceso directo con psql](#6-acceso-directo-con-psql)
7. [Configuración Post-Instalación](#7-configuración-post-instalación)
8. [Comandos Básicos de psql](#8-comandos-básicos-de-psql)
9. [Solución de Problemas](#9-solución-de-problemas)

---

## 1. Requisitos Previos

- Debian Bullseye (11), Bookworm (12) o superior
- Acceso a `sudo` o root
- Arquitectura `amd64`, `arm64` o `armhf`

Verificar versión y arquitectura:

```bash
cat /etc/debian_version
dpkg --print-architecture
```

---

## 2. Desinstalación Completa (hacer primero si ya tienes Postgres)

> Ejecuta esta sección completa si quieres partir de cero o tienes una instalación rota.

### Paso 1 — Detener el servicio

```bash
sudo systemctl stop postgresql
sudo systemctl disable postgresql
```

### Paso 2 — Eliminar todos los paquetes

```bash
sudo apt purge -y \
  postgresql \
  postgresql-* \
  libpq-dev \
  libpq5

sudo apt autoremove -y
sudo apt autoclean
```

### Paso 3 — Eliminar todos los datos y configuración

> ⚠️ **Advertencia:** Esto borra permanentemente todas las bases de datos. Haz un backup antes si los datos importan.

```bash
# Datos de las bases de datos
sudo rm -rf /var/lib/postgresql

# Configuración
sudo rm -rf /etc/postgresql
sudo rm -rf /etc/postgresql-common

# Logs
sudo rm -rf /var/log/postgresql
```

### Paso 4 — Eliminar el repositorio y la clave GPG

```bash
sudo rm -f /etc/apt/sources.list.d/pgdg.list
sudo rm -f /usr/share/keyrings/postgresql.gpg
sudo rm -f /etc/apt/keyrings/postgresql.gpg
sudo apt update
```

### Paso 5 — Eliminar el usuario del sistema postgres

```bash
sudo userdel -r postgres 2>/dev/null || true
sudo groupdel postgres 2>/dev/null || true
```

### Paso 6 — Verificar que fue eliminado

```bash
psql --version 2>/dev/null && echo "⚠️  PostgreSQL todavía está instalado" || echo "✅ PostgreSQL eliminado correctamente"
systemctl list-units --type=service | grep postgres
```

---

## 3. Instalación desde el Repositorio Oficial

El repositorio de Debian incluye PostgreSQL pero generalmente una versión desactualizada. El repositorio oficial de PostgreSQL (PGDG) siempre tiene la versión más reciente con todos los parches de seguridad.

### Paso 1 — Instalar dependencias

```bash
sudo apt update
sudo apt install -y curl ca-certificates gnupg lsb-release
```

### Paso 2 — Agregar la clave GPG oficial

```bash
sudo install -m 0755 -d /etc/apt/keyrings

curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | \
  sudo gpg --dearmor -o /etc/apt/keyrings/postgresql.gpg

sudo chmod a+r /etc/apt/keyrings/postgresql.gpg
```

### Paso 3 — Agregar el repositorio PGDG

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/postgresql.gpg] \
  https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | \
  sudo tee /etc/apt/sources.list.d/pgdg.list > /dev/null

sudo apt update
```

### Paso 4 — Instalar PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
```

`postgresql-contrib` incluye extensiones adicionales útiles como `pg_stat_statements`, `uuid-ossp` y otras herramientas de administración.

### Paso 5 — Iniciar y habilitar el servicio

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

## 4. Verificar la Instalación

```bash
# Estado del servicio
sudo systemctl status postgresql

# Versión instalada
psql --version

# Verificar que el proceso está corriendo
pg_lsclusters
```

`pg_lsclusters` muestra todos los clusters de PostgreSQL instalados, su versión, puerto y estado.

---

## 5. Configuración del Usuario dev-espada

PostgreSQL usa autenticación basada en roles. Para acceder con `psql` directamente sin especificar usuario ni base de datos, el sistema operativo y PostgreSQL deben estar sincronizados: el nombre del usuario de Linux debe coincidir con un rol de PostgreSQL del mismo nombre, y debe existir una base de datos con ese mismo nombre.

### Paso 1 — Verificar que el usuario del sistema existe

Antes de crear el rol en PostgreSQL, confirma que tu usuario de sistema operativo es `dev-espada`:

```bash
whoami
```

Si el resultado es `dev-espada`, perfecto. Si es otro usuario y quieres que `dev-espada` sea un usuario separado del sistema, créalo primero:

```bash
sudo adduser dev-espada
```

### Paso 2 — Crear el rol en PostgreSQL

Acceder a PostgreSQL como el superusuario `postgres`:

```bash
sudo -u postgres psql
```

Dentro del prompt de psql, crear el rol `dev-espada` con permisos para crear bases de datos:

```sql
CREATE ROLE "dev-espada" WITH LOGIN CREATEDB;
```

Si además quieres que pueda crear otros roles (útil en desarrollo):

```sql
ALTER ROLE "dev-espada" CREATEROLE;
```

Verificar que el rol fue creado:

```sql
\du
```

Salir de psql:

```sql
\q
```

### Paso 3 — Crear la base de datos con el mismo nombre que el usuario

PostgreSQL, cuando ejecutas `psql` sin argumentos, intenta conectarse a una base de datos con el mismo nombre que el usuario actual. Por eso es necesario crear una base de datos llamada `dev-espada`:

```bash
sudo -u postgres createdb "dev-espada" --owner="dev-espada"
```

O desde dentro de psql como postgres:

```sql
CREATE DATABASE "dev-espada" OWNER "dev-espada";
```

---

## 6. Acceso directo con psql

Este es el objetivo central: ejecutar `psql` desde tu sesión como `dev-espada` y entrar directamente a tu base de datos, sin contraseña ni parámetros.

### Cómo funciona el acceso automático

PostgreSQL tiene un mecanismo de autenticación llamado **peer authentication**: cuando te conectas localmente a través del socket Unix, PostgreSQL confía en la identidad del usuario del sistema operativo. Si el usuario del SO se llama `dev-espada` y existe un rol de PostgreSQL con el mismo nombre, la conexión se acepta sin contraseña.

Adicionalmente, cuando no especificas una base de datos en `psql`, PostgreSQL intenta conectarse a una base de datos con el mismo nombre que el usuario. Con la base de datos `dev-espada` creada, todo encaja.

### Verificar la configuración de autenticación

El archivo `pg_hba.conf` controla cómo se autentica cada tipo de conexión. Verificar que las conexiones locales por socket usan `peer`:

```bash
# Encontrar la ruta del archivo (varía según la versión)
sudo find /etc/postgresql -name pg_hba.conf

# Ver las líneas relevantes (ignorar comentarios)
sudo grep -v "^#" /etc/postgresql/*/main/pg_hba.conf | grep -v "^$"
```

La línea clave debe verse así:

```
local   all   all   peer
```

Si el método es `md5` o `scram-sha-256` en lugar de `peer` para conexiones locales, cambiar a `peer`:

```bash
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

Busca la línea:

```
local   all             all                                     md5
```

Y cámbiala a:

```
local   all             all                                     peer
```

Recargar la configuración para aplicar cambios:

```bash
sudo systemctl reload postgresql
```

### Probar el acceso directo

Asegúrate de estar logueado como `dev-espada` (o usar `su - dev-espada`) y ejecuta simplemente:

```bash
psql
```

Deberías ver el prompt:

```
psql (16.x)
Type "help" for help.

dev-espada=#
```

El símbolo `#` indica que el rol tiene privilegios de superusuario en esa base de datos. El símbolo `>` indicaría un rol normal.

### Alias recomendado (opcional)

Si por cualquier motivo necesitas pasar argumentos frecuentemente, puedes agregar un alias en `~/.bashrc` o `~/.bash_profile`:

```bash
echo 'alias psql="psql -U dev-espada -d dev-espada"' >> ~/.bashrc
source ~/.bashrc
```

Aunque con la configuración `peer` correcta, el `psql` simple sin alias ya es suficiente.

---

## 7. Configuración Post-Instalación

### Ajustar parámetros básicos de rendimiento

El archivo principal de configuración de PostgreSQL es `postgresql.conf`:

```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```

Parámetros recomendados para un entorno de desarrollo:

```ini
# Memoria compartida (ajustar al 25% de la RAM disponible)
shared_buffers = 256MB

# Memoria para operaciones de ordenamiento
work_mem = 16MB

# Memoria para mantenimiento (VACUUM, CREATE INDEX)
maintenance_work_mem = 128MB

# Número máximo de conexiones
max_connections = 100

# Logging básico para desarrollo
log_statement = 'all'
log_duration = on
```

Reiniciar para aplicar los cambios:

```bash
sudo systemctl restart postgresql
```

### Ver el log en tiempo real

```bash
sudo tail -f /var/log/postgresql/postgresql-*.log
```

---

## 8. Comandos Básicos de psql

Una vez dentro de `psql`, los comandos internos empiezan con `\`:

```sql
\l              -- Listar todas las bases de datos
\c nombre_db    -- Conectarse a otra base de datos
\dt             -- Listar tablas del esquema actual
\d nombre_tabla -- Describir estructura de una tabla
\du             -- Listar roles y usuarios
\dn             -- Listar esquemas
\df             -- Listar funciones
\timing         -- Activar/desactivar tiempo de ejecución
\e              -- Abrir el editor de texto para escribir queries
\i archivo.sql  -- Ejecutar un archivo SQL
\o archivo.txt  -- Redirigir output a un archivo
\q              -- Salir de psql
```

### Operaciones SQL frecuentes

```sql
-- Crear una base de datos
CREATE DATABASE mi_proyecto OWNER "dev-espada";

-- Crear una tabla
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Insertar datos
INSERT INTO usuarios (nombre, email) VALUES ('Juan', 'juan@ejemplo.com');

-- Consultar
SELECT * FROM usuarios;

-- Ver tamaño de las bases de datos
SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname))
FROM pg_database
ORDER BY pg_database_size(pg_database.datname) DESC;
```

---

## 9. Solución de Problemas

### psql: error: FATAL: role "dev-espada" does not exist

El rol no fue creado en PostgreSQL. Crearlo:

```bash
sudo -u postgres psql -c 'CREATE ROLE "dev-espada" WITH LOGIN CREATEDB;'
```

### psql: error: FATAL: database "dev-espada" does not exist

La base de datos con el nombre del usuario no existe. Crearla:

```bash
sudo -u postgres createdb "dev-espada" --owner="dev-espada"
```

### psql: error: FATAL: Peer authentication failed for user "dev-espada"

El usuario del sistema operativo con el que ejecutas `psql` no coincide con el rol de PostgreSQL, o el método de autenticación no es `peer`. Verificar:

```bash
# ¿Con qué usuario del sistema estás?
whoami

# ¿Qué método de autenticación está configurado?
sudo grep -v "^#" /etc/postgresql/*/main/pg_hba.conf | grep local
```

Asegúrate de que la línea `local` tiene el método `peer` y de que el usuario del sistema coincide con el rol de PostgreSQL.

### psql: error: could not connect to server: No such file or directory

El servicio de PostgreSQL no está corriendo:

```bash
sudo systemctl start postgresql
sudo systemctl status postgresql

# Ver logs si no arranca
sudo journalctl -u postgresql --no-pager -n 50
```

### Instalación rota o corrupta

Seguir la **Sección 2** (Desinstalación Completa) y luego la **Sección 3** (Instalación). Este proceso resuelve la mayoría de los conflictos de paquetes y configuraciones corruptas.

---

*Para temas avanzados como replicación, particionado de tablas, extensiones o ajuste de rendimiento en producción, consultar la [documentación oficial de PostgreSQL](https://www.postgresql.org/docs/).*

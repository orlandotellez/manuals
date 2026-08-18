# Manual de Backups y Migración de bases de datos PostgreSQL

## Índice
1. [¿Qué es pg_dump / pg_restore?](#qué-es-pg_dump--pg_restore)
2. [Instalación de las herramientas cliente](#instalación-de-las-herramientas-cliente)
3. [Verificar versión instalada](#verificar-versión-instalada)
4. [Si la versión no coincide con el servidor](#si-la-versión-no-coincide-con-el-servidor)
5. [Variables de entorno / cadena de conexión](#variables-de-entorno--cadena-de-conexión)
6. [Backup completo en formato SQL plano](#backup-completo-en-formato-sql-plano)
7. [Backup completo en formato custom (recomendado)](#backup-completo-en-formato-custom-recomendado)
8. [Restaurar un backup](#restaurar-un-backup)
9. [Migrar de una base a otra directamente (dump → restore)](#migrar-de-una-base-a-otra-directamente-dump--restore)
10. [Opciones útiles de pg_dump](#opciones-útiles-de-pg_dump)
11. [Backup usando Docker (sin instalar nada localmente)](#backup-usando-docker-sin-instalar-nada-localmente)
12. [Verificar que el backup/restore fue exitoso](#verificar-que-el-backuprestore-fue-exitoso)
13. [Automatizar backups con un script](#automatizar-backups-con-un-script)
14. [Errores comunes](#errores-comunes)
15. [Buenas prácticas](#buenas-prácticas)

---

# 1. ¿Qué es pg_dump / pg_restore?

`pg_dump` es la herramienta oficial de PostgreSQL para exportar (hacer backup de) una base de datos completa: esquema (tablas, índices, constraints, secuencias) y datos.

`pg_restore` es su contraparte para importar un backup generado en formato "custom" o "directory".

`psql` también puede usarse para restaurar backups en formato SQL plano.

Herramientas que vienen incluidas en el paquete `postgresql-client`:

* `pg_dump` → exportar una base de datos
* `pg_dumpall` → exportar TODAS las bases de datos de un servidor + roles/usuarios
* `pg_restore` → importar un backup en formato custom/directory
* `psql` → cliente de línea de comandos, también sirve para importar backups `.sql`

---

# 2. Instalación de las herramientas cliente

## Debian / Ubuntu

```bash
sudo apt update
sudo apt install -y postgresql-client
```

## Instalar una versión específica (ej. 18) desde el repositorio oficial PGDG

A veces el repositorio por defecto de tu distro trae una versión antigua. Para instalar la versión exacta que necesitas:

```bash
sudo apt install -y postgresql-common
sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh
sudo apt update
sudo apt install -y postgresql-client-18
```

Esto deja el binario disponible en:

```
/usr/lib/postgresql/18/bin/pg_dump
/usr/lib/postgresql/18/bin/pg_restore
```

## macOS (Homebrew)

```bash
brew install postgresql@18
```

## Windows

Descarga el instalador desde [postgresql.org/download](https://www.postgresql.org/download/) y selecciona solo "Command Line Tools" durante la instalación.

---

# 3. Verificar versión instalada

```bash
pg_dump --version
psql --version
```

Ejemplo de salida:

```
pg_dump (PostgreSQL) 18.4
```

---

# 4. Si la versión no coincide con el servidor

PostgreSQL exige que la versión de `pg_dump` sea **igual o más nueva** que la del servidor de origen. Si ves un error como:

```
pg_dump: error: abortando debido a que no coincide la versión del servidor
pg_dump: detalle: versión del servidor: 18.4 ...; versión de pg_dump: 17.10 ...
```

Soluciones:

**Opción A — Usar el binario versionado directamente:**

```bash
/usr/lib/postgresql/18/bin/pg_dump "postgresql://usuario:password@localhost:5432/mi_base" -f backup.sql
```

**Opción B — Actualizar el cliente por defecto** (ver sección 2, instalación desde PGDG).

**Opción C — Usar Docker** (ver sección 11).

---

# 5. Variables de entorno / cadena de conexión

Todos los comandos de este manual usan una **cadena de conexión (connection string)** con este formato:

```
postgresql://usuario:password@host:puerto/nombre_base
```

Ejemplo para un Postgres local:

```
postgresql://postgres:postgres@localhost:5432/mi_base
```

También puedes exportarla como variable de entorno para no repetirla en cada comando:

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mi_base"
pg_dump "$DATABASE_URL" -f backup.sql
```

---

# 6. Backup completo en formato SQL plano

Genera un archivo `.sql` legible, con sentencias `CREATE TABLE` e `INSERT`.

```bash
pg_dump "postgresql://postgres:postgres@localhost:5432/mi_base" -f backup.sql
```

Ventajas: legible, fácil de inspeccionar o editar a mano.
Desventajas: más lento y pesado en bases grandes; no permite restaurar tablas individuales fácilmente.

---

# 7. Backup completo en formato custom (recomendado)

Formato binario comprimido, más rápido y flexible.

```bash
pg_dump -Fc "postgresql://postgres:postgres@localhost:5432/mi_base" -f backup.dump
```

Ventajas:

* Comprimido automáticamente
* Permite restaurar solo ciertas tablas
* Permite restaurar en paralelo (`-j`) para mayor velocidad

---

# 8. Restaurar un backup

## Si el backup es `.sql` (plano)

```bash
psql "postgresql://postgres:postgres@localhost:5432/base_destino" -f backup.sql
```

## Si el backup es `.dump` (formato custom)

```bash
pg_restore -d "postgresql://postgres:postgres@localhost:5432/base_destino" backup.dump
```

## Restaurar en paralelo (más rápido, solo formato custom)

```bash
pg_restore -d "postgresql://postgres:postgres@localhost:5432/base_destino" -j 4 backup.dump
```

`-j 4` usa 4 procesos en paralelo. Ajusta el número según los núcleos de tu CPU.

⚠️ La base de datos destino debe existir previamente (puedes crearla con `createdb nombre_base` o desde `psql` con `CREATE DATABASE nombre_base;`).

---

# 9. Migrar de una base a otra directamente (dump → restore)

Si tienes acceso simultáneo a ambas bases (origen y destino), puedes hacer todo en un solo paso usando una tubería (`pipe`), sin generar un archivo intermedio:

```bash
pg_dump "postgresql://postgres:postgres@localhost:5432/base_origen" \
  | psql "postgresql://postgres:postgres@localhost:5433/base_destino"
```

Esto sirve, por ejemplo, para clonar una base local a otra base local (en otro puerto, otro contenedor, u otro servidor).

---

# 10. Opciones útiles de pg_dump

| Opción | Qué hace |
|---|---|
| `-Fc` | Formato custom comprimido |
| `-Fd` | Formato directory (permite paralelismo en el dump) |
| `--clean --if-exists` | Antes de crear cada objeto, lo elimina si ya existe en el destino |
| `--no-owner` | No incluye comandos para cambiar el dueño de las tablas |
| `--no-privileges` | No incluye permisos (`GRANT`/`REVOKE`) |
| `--schema-only` | Exporta solo la estructura, sin datos |
| `--data-only` | Exporta solo los datos, sin estructura |
| `-t nombre_tabla` | Exporta solo una tabla específica |
| `-n nombre_esquema` | Exporta solo un esquema específico |
| `-j N` | Número de procesos en paralelo (solo con `-Fd` o en `pg_restore`) |

Ejemplo combinando varias opciones (útil cuando el destino ya tiene datos y el usuario es distinto al de origen):

```bash
pg_dump --clean --if-exists --no-owner --no-privileges \
  "postgresql://postgres:postgres@localhost:5432/base_origen" \
  | psql "postgresql://postgres:postgres@localhost:5433/base_destino"
```

---

# 11. Backup usando Docker (sin instalar nada localmente)

Si no quieres instalar el cliente de PostgreSQL en tu máquina, puedes usar la imagen oficial:

```bash
docker run --rm postgres:18 pg_dump \
  "postgresql://postgres:postgres@host.docker.internal:5432/mi_base" \
  -f /tmp/backup.sql
```

Para hacer dump y restore en un solo paso entre dos bases locales:

```bash
docker run --rm postgres:18 sh -c \
  'pg_dump "postgresql://postgres:postgres@host.docker.internal:5432/base_origen" \
   | psql "postgresql://postgres:postgres@host.docker.internal:5433/base_destino"'
```

Notas:

* `host.docker.internal` permite que el contenedor acceda a servicios corriendo en tu máquina anfitriona (funciona en Docker Desktop / macOS / Windows).
* En Linux puedes necesitar `--network host` en vez de `host.docker.internal`:

```bash
docker run --rm --network host postgres:18 pg_dump \
  "postgresql://postgres:postgres@localhost:5432/mi_base" -f /tmp/backup.sql
```

---

# 12. Verificar que el backup/restore fue exitoso

## Listar tablas de la base destino

```bash
psql "postgresql://postgres:postgres@localhost:5432/base_destino" -c "\dt"
```

## Comparar cantidad de filas por tabla (origen vs destino)

```bash
psql "postgresql://postgres:postgres@localhost:5432/base_origen" -c "
SELECT schemaname, relname, n_live_tup
FROM pg_stat_user_tables
ORDER BY relname;
"
```

Corre la misma consulta contra la base destino y compara los valores de `n_live_tup` (filas vivas aproximadas por tabla).

## Ver el tamaño de la base de datos

```bash
psql "postgresql://postgres:postgres@localhost:5432/mi_base" -c "
SELECT pg_size_pretty(pg_database_size('mi_base'));
"
```

---

# 13. Automatizar backups con un script

Ejemplo de script `backup.sh` con fecha en el nombre del archivo:

```bash
#!/bin/bash
set -e

DB_URL="postgresql://postgres:postgres@localhost:5432/mi_base"
FECHA=$(date +%Y-%m-%d_%H-%M-%S)
ARCHIVO="backup_${FECHA}.dump"

echo "Generando backup: $ARCHIVO"
pg_dump -Fc "$DB_URL" -f "$ARCHIVO"

echo "Backup completado: $ARCHIVO"
```

Darle permisos de ejecución y correrlo:

```bash
chmod +x backup.sh
./backup.sh
```

Para automatizarlo diariamente, agrégalo a `cron`:

```bash
crontab -e
```

Y agrega una línea como esta (corre todos los días a las 2:00 AM):

```
0 2 * * * /ruta/completa/backup.sh >> /ruta/completa/backup.log 2>&1
```

---

# 14. Errores comunes

**Error: versión de pg_dump no coincide con el servidor**
→ Instala/usa la versión de `pg_dump` igual o mayor a la del servidor (sección 4).

**Error: relation already exists**
→ La base destino ya tenía tablas creadas. Usa `--clean --if-exists` o vacía la base destino antes de restaurar.

**Error: permission denied for schema / must be owner of...**
→ El usuario de destino no tiene los mismos permisos que el de origen. Usa `--no-owner --no-privileges`.

**Error: could not connect to server**
→ Revisa host, puerto, credenciales, y que el servidor de destino/origen esté activo y aceptando conexiones (revisa también reglas de firewall si es remoto).

**El backup tarda mucho / archivo muy pesado**
→ Usa formato custom (`-Fc`) o directory (`-Fd`) en vez de SQL plano, y considera `-j` para paralelizar.

---

# 15. Buenas prácticas

✔ Usa siempre formato custom (`-Fc`) para backups de producción — es más rápido y flexible.
✔ Verifica la versión de `pg_dump` antes de cada backup importante.
✔ Nunca dejes contraseñas de bases de datos escritas en scripts que subas a repositorios públicos — usa variables de entorno o un archivo `.env` ignorado por git.
✔ Prueba siempre el backup restaurándolo en una base de prueba antes de confiar en él.
✔ Automatiza backups periódicos (cron, GitHub Actions, o el sistema de backups del proveedor donde alojes la base).
✔ Guarda backups en al menos dos ubicaciones distintas (local + nube).
✔ Rota las contraseñas de las bases de datos si alguna vez se compartieron por chat, correo o en texto plano.
✔ Al migrar entre bases, compara siempre el número de filas por tabla (sección 12) para confirmar integridad de datos.

# Manual profesional de Backups, Restauración y Migración de PostgreSQL

**Base de datos:** `pos_system_db`
**Entorno:** Desarrollo y Producción
**Motor:** PostgreSQL
**Producción:** Railway

---

# Índice

1. [Objetivo del manual](#1-objetivo-del-manual)
2. [¿Qué son pg_dump, pg_restore, psql y pg_dumpall?](#2-qué-son-pg_dump-pg_restore-psql-y-pg_dumpall)
3. [Conceptos básicos de backups](#3-conceptos-básicos-de-backups)
4. [Regla 3-2-1](#4-regla-3-2-1)
5. [Tipos de backups](#5-tipos-de-backups)
6. [Instalación de las herramientas cliente](#6-instalación-de-las-herramientas-cliente)
7. [Verificar las versiones instaladas](#7-verificar-las-versiones-instaladas)
8. [Si la versión no coincide con el servidor](#8-si-la-versión-no-coincide-con-el-servidor)
9. [Variables de entorno y cadenas de conexión](#9-variables-de-entorno-y-cadenas-de-conexión)
10. [Backup completo en formato SQL plano](#10-backup-completo-en-formato-sql-plano)
11. [Backup completo en formato Custom](#11-backup-completo-en-formato-custom)
12. [Backup de desarrollo](#12-backup-de-desarrollo)
13. [Backup de producción en Railway](#13-backup-de-producción-en-railway)
14. [Backup antes de migraciones y deploys](#14-backup-antes-de-migraciones-y-deploys)
15. [Opciones útiles de pg_dump](#15-opciones-útiles-de-pg_dump)
16. [Restaurar un backup](#16-restaurar-un-backup)
17. [Migrar directamente de una base a otra](#17-migrar-directamente-de-una-base-a-otra)
18. [Backup usando Docker](#18-backup-usando-docker)
19. [Verificar que un backup es válido](#19-verificar-que-un-backup-es-válido)
20. [Prueba real de restauración](#20-prueba-real-de-restauración)
21. [Automatización de backups](#21-automatización-de-backups)
22. [Rotación y retención](#22-rotación-y-retención)
23. [Estructura profesional de almacenamiento](#23-estructura-profesional-de-almacenamiento)
24. [Backups remotos](#24-backups-remotos)
25. [Seguridad de los backups](#25-seguridad-de-los-backups)
26. [RPO — Recovery Point Objective](#26-rpo--recovery-point-objective)
27. [RTO — Recovery Time Objective](#27-rto--recovery-time-objective)
28. [WAL y Point-in-Time Recovery](#28-wal-y-point-in-time-recovery)
29. [Estrategia recomendada para CajoraPOS](#29-estrategia-recomendada-para-cajorapos)
30. [Plan de implementación por etapas](#30-plan-de-implementación-por-etapas)
31. [Errores comunes](#31-errores-comunes)
32. [Checklist de producción](#32-checklist-de-producción)
33. [Regla final](#33-regla-final)

---

# 1. Objetivo del manual

Este manual explica cómo realizar, verificar, almacenar, restaurar y automatizar backups de PostgreSQL.

También explica cómo migrar una base de datos entre servidores y cómo establecer una estrategia profesional de backups para producción.

El objetivo no es solamente crear un archivo `.dump`.

Un sistema de backups profesional debe permitir:

* Recuperar información eliminada accidentalmente.
* Recuperarse de errores durante un deploy.
* Recuperarse de migraciones fallidas.
* Recuperarse de corrupción de datos.
* Recuperarse de la pérdida de un servidor.
* Minimizar la cantidad de información perdida.
* Recuperar el sistema en un tiempo razonable.
* Mantener diferentes generaciones de backups.
* Tener copias fuera del servidor principal.
* Verificar periódicamente que los backups realmente pueden restaurarse.

---

# 2. ¿Qué son pg_dump, pg_restore, psql y pg_dumpall?

Estas herramientas forman parte de las herramientas cliente de PostgreSQL.

## `pg_dump`

Realiza un backup lógico de una base de datos.

```text
PostgreSQL
    │
    ▼
 pg_dump
    │
    ▼
 backup.dump
```

Puede exportar:

* Tablas.
* Datos.
* Índices.
* Constraints.
* Secuencias.
* Funciones.
* Triggers.
* Schemas.

---

## `pg_restore`

Restaura backups creados en formatos como:

```text
Custom
Directory
Tar
```

Por ejemplo:

```bash
pg_restore -d mi_base backup.dump
```

---

## `psql`

Es el cliente de PostgreSQL.

También permite restaurar backups en formato SQL plano:

```bash
psql -d mi_base -f backup.sql
```

---

## `pg_dumpall`

Permite realizar un dump a nivel de servidor.

Puede incluir:

* Varias bases de datos.
* Roles.
* Usuarios.
* Permisos globales.

Ejemplo:

```bash
pg_dumpall > server_backup.sql
```

Para un backup normal de `pos_system_db`, utilizaremos principalmente:

```text
pg_dump
+
pg_restore
```

---

# 3. Conceptos básicos de backups

Imaginemos que nuestra base de datos es una caja donde se encuentra toda la información del POS:

```text
                 POS SYSTEM
                     │
                     ▼
             ┌───────────────┐
             │  PostgreSQL   │
             │ pos_system_db │
             └───────────────┘
                     │
                   BACKUP
                     │
                     ▼
             ┌───────────────┐
             │ backup.dump   │
             └───────────────┘
```

Si la base de datos desaparece, podemos utilizar el backup para reconstruirla.

Pero tener únicamente:

```text
Base de datos
+
1 backup
```

no es suficiente.

Si ambos están almacenados en el mismo lugar y ese lugar falla, podríamos perder ambos.

Por eso debemos pensar en:

```text
Base de datos
      │
      ├── Backup local
      │
      └── Backup remoto
```

Y además mantener diferentes generaciones:

```text
Backup de hoy
Backup de ayer
Backup de hace 2 días
Backup semanal
Backup mensual
```

---

# 4. Regla 3-2-1

Una estrategia profesional puede utilizar la regla:

## 3-2-1

### 3 copias

Por ejemplo:

```text
1. Base de datos de producción
2. Backup local
3. Backup remoto
```

### 2 ubicaciones o medios

Por ejemplo:

```text
Servidor
+
Cloud Storage
```

### 1 copia fuera del servidor principal

Esta última copia protege contra problemas como:

* Fallo del servidor.
* Pérdida del disco.
* Robo.
* Corrupción.
* Eliminación accidental.
* Desastre físico.

---

# 5. Tipos de backups

Existen diferentes tipos de estrategias.

---

## 5.1 Backup lógico completo

Se realiza principalmente mediante:

```bash
pg_dump
```

Es el método que utilizaremos normalmente para CajoraPOS.

Ejemplo:

```bash
pg_dump -Fc ...
```

---

## 5.2 Backup físico

Utiliza herramientas como:

```bash
pg_basebackup
```

Copia físicamente los archivos necesarios del cluster PostgreSQL.

Es más apropiado para estrategias avanzadas de recuperación y alta disponibilidad.

---

## 5.3 Backup incremental

Guarda los cambios realizados desde un backup anterior.

Conceptualmente:

```text
FULL
████████████████████

INCREMENTAL
        ██

INCREMENTAL
          ███

INCREMENTAL
             ██
```

PostgreSQL no proporciona un:

```bash
pg_dump --incremental
```

Los incrementales requieren mecanismos de backup físico, WAL o herramientas especializadas.

---

## 5.4 Backup diferencial

Guarda los cambios realizados desde el último backup completo.

Ejemplo:

```text
FULL
████████████████████

DIFFERENTIAL
        ██

DIFFERENTIAL
        █████

DIFFERENTIAL
        ███████
```

Normalmente se necesita:

```text
FULL
+
último diferencial
```

para recuperar.

---

## 5.5 Backup mediante WAL

PostgreSQL registra cambios mediante:

```text
WAL
```

o:

```text
Write-Ahead Log
```

El WAL permite construir estrategias de recuperación mucho más avanzadas.

---

## 5.6 Point-in-Time Recovery — PITR

Permite recuperar la base de datos hasta un momento determinado.

Por ejemplo:

```text
10:00 ─────────────
11:00 ─────────────
12:00 ─────────────
13:00 ───── ERROR ─
14:00
```

Si ocurrió un error a las:

```text
13:15:32
```

una estrategia PITR puede permitir recuperar la base hasta aproximadamente:

```text
13:15:31
```

dependiendo de la configuración y de los WAL disponibles.

---

# 6. Instalación de las herramientas cliente

## Debian / Ubuntu

```bash
sudo apt update
sudo apt install -y postgresql-client
```

---

## Instalar una versión específica

Si necesitamos PostgreSQL 18:

```bash
sudo apt install -y postgresql-common
sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh
sudo apt update
sudo apt install -y postgresql-client-18
```

Los binarios pueden encontrarse en:

```text
/usr/lib/postgresql/18/bin/pg_dump
/usr/lib/postgresql/18/bin/pg_restore
```

---

## macOS

Con Homebrew:

```bash
brew install postgresql@18
```

---

## Windows

Instalar PostgreSQL desde:

```text
https://www.postgresql.org/download/
```

y seleccionar las herramientas de línea de comandos.

---

# 7. Verificar las versiones instaladas

Ejecutar:

```bash
pg_dump --version
pg_restore --version
psql --version
```

Ejemplo:

```text
pg_dump (PostgreSQL) 18.4
pg_restore (PostgreSQL) 18.4
psql (PostgreSQL) 18.4
```

---

# 8. Si la versión no coincide con el servidor

La versión de `pg_dump` no debe ser anterior a la versión mayor del servidor que estamos intentando respaldar.

Por ejemplo:

```text
Servidor: PostgreSQL 18
Cliente:  PostgreSQL 17
```

Puede producir:

```text
aborting because of server version mismatch
```

Una solución es utilizar el cliente correcto:

```bash
/usr/lib/postgresql/18/bin/pg_dump ...
```

También podemos instalar la versión correspondiente o utilizar Docker.

### Regla práctica

Para hacer un dump:

```text
pg_dump >= versión mayor del servidor
```

Para evitar problemas de compatibilidad, es recomendable utilizar una versión igual a la del servidor cuando sea posible.

---

# 9. Variables de entorno y cadenas de conexión

Una cadena de conexión PostgreSQL tiene normalmente esta estructura:

```text
postgresql://usuario:password@host:puerto/base
```

Ejemplo:

```text
postgresql://postgres:postgres@localhost:5432/mi_base
```

Podemos utilizar una variable:

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mi_base"
```

Y después:

```bash
pg_dump "$DATABASE_URL" -Fc -f backup.dump
```

---

## Usar `PGPASSWORD`

También podemos separar el password:

```bash
export PGPASSWORD="TU_PASSWORD"
```

Y utilizar:

```bash
pg_dump \
  -h localhost \
  -p 5432 \
  -U dev-espada \
  -d pos_system_db \
  -Fc \
  -f backup.dump
```

Para automatizaciones, también puede utilizarse:

```text
~/.pgpass
```

con permisos:

```bash
chmod 600 ~/.pgpass
```

Nunca debemos subir credenciales al repositorio.

---

# 10. Backup completo en formato SQL plano

El formato SQL genera un archivo legible.

```bash
pg_dump \
  "postgresql://postgres:postgres@localhost:5432/mi_base" \
  -Fp \
  -f backup.sql
```

Genera:

```text
backup.sql
```

Puede contener instrucciones como:

```sql
CREATE TABLE ...
INSERT INTO ...
ALTER TABLE ...
```

### Ventajas

* Legible.
* Fácil de inspeccionar.
* Fácil de editar.
* Compatible con `psql`.

### Desventajas

* Puede ocupar más espacio.
* Puede ser más lento.
* Tiene menos flexibilidad para restauraciones selectivas.

---

# 11. Backup completo en formato Custom

Para backups operativos recomendamos:

```bash
-Fc
```

Ejemplo:

```bash
pg_dump \
  "postgresql://postgres:postgres@localhost:5432/mi_base" \
  -Fc \
  -f backup.dump
```

Genera:

```text
backup.dump
```

### Ventajas

* Comprimido.
* Flexible.
* Permite restauraciones selectivas.
* Se utiliza con `pg_restore`.
* Permite restauraciones paralelas.

Para producción, este será nuestro formato principal.

---

# 12. Backup de desarrollo

Crear la carpeta:

```bash
mkdir -p ~/db-backups
```

Configurar el password:

```bash
export PGPASSWORD="TU_PASSWORD_DE_DEV"
```

Crear el backup:

```bash
pg_dump \
  -h localhost \
  -p 5432 \
  -U dev-espada \
  -d pos_system_db \
  -Fc \
  --file="$HOME/db-backups/pos_system_db_$(date +%Y%m%d_%H%M%S).dump"
```

Comprobar:

```bash
ls -lh ~/db-backups/
```

Resultado:

```text
pos_system_db_20260907_191605.dump
```

El timestamp permite identificar exactamente cuándo se creó el backup.

---

# 13. Backup de producción en Railway

La base de producción se encuentra en Railway.

Podemos realizar el dump utilizando la cadena de conexión proporcionada por Railway:

```bash
mkdir -p ~/db-backups
```

Después:

```bash
pg_dump \
  "postgresql://postgres:PASSWORD@HOST:PORT/railway?sslmode=require" \
  -Fc \
  --file="$HOME/db-backups/railway_$(date +%Y%m%d_%H%M%S).dump"
```

La conexión debe utilizar SSL cuando Railway lo requiera:

```text
sslmode=require
```

### Recomendación

No dejar permanentemente la contraseña escrita en el comando ni en scripts versionados.

Utilizar:

```text
PGPASSWORD
```

o:

```text
~/.pgpass
```

---

# 14. Backup antes de migraciones y deploys

Antes de una operación potencialmente peligrosa debemos crear un backup.

Especialmente antes de:

* Migraciones Prisma.
* Cambios importantes de schema.
* Migraciones destructivas.
* Eliminaciones masivas.
* Cambios de tipos de columnas.
* Actualizaciones importantes de PostgreSQL.
* Deploys que cambien la estructura de la base.

Ejemplo:

```bash
pg_dump \
  ... \
  -Fc \
  --file="$HOME/db-backups/pre_migration_$(date +%Y%m%d_%H%M%S).dump"
```

La secuencia recomendada:

```text
BACKUP
   │
   ▼
MIGRATION
   │
   ▼
TEST
   │
   ▼
DEPLOY
```

No:

```text
MIGRATION
   │
   ▼
"Espero que funcione"
```

---

# 15. Opciones útiles de pg_dump

| Opción            | Función                                                |
| ----------------- | ------------------------------------------------------ |
| `-Fc`             | Formato Custom                                         |
| `-Fp`             | Formato SQL plano                                      |
| `-Fd`             | Formato Directory                                      |
| `--schema-only`   | Solo estructura                                        |
| `--data-only`     | Solo datos                                             |
| `-t tabla`        | Solo una tabla                                         |
| `-n esquema`      | Solo un esquema                                        |
| `--no-owner`      | No restaura propietarios                               |
| `--no-privileges` | No restaura GRANT/REVOKE                               |
| `--clean`         | Incluye instrucciones para eliminar objetos existentes |
| `--if-exists`     | Evita errores si el objeto no existe                   |

### Solo estructura

```bash
pg_dump ... -Fc --schema-only -f schema.dump
```

### Solo datos

```bash
pg_dump ... -Fc --data-only -f data.dump
```

### Una tabla

```bash
pg_dump ... -Fc -t public.users -f users.dump
```

---

# 16. Restaurar un backup

## 16.1 Restaurar SQL plano

```bash
psql \
  "postgresql://postgres:postgres@localhost:5432/base_destino" \
  -f backup.sql
```

---

## 16.2 Restaurar Custom

```bash
pg_restore \
  -d "postgresql://postgres:postgres@localhost:5432/base_destino" \
  backup.dump
```

La base de datos destino normalmente debe existir previamente.

---

## 16.3 Crear la base de datos

```bash
createdb \
  -h localhost \
  -U dev-espada \
  base_destino
```

Después:

```bash
pg_restore \
  -h localhost \
  -U dev-espada \
  -d base_destino \
  backup.dump
```

---

## 16.4 Restauración reemplazando objetos existentes

```bash
pg_restore \
  -h localhost \
  -U dev-espada \
  -d base_destino \
  --clean \
  --if-exists \
  backup.dump
```

### Importante

`--clean` elimina objetos existentes antes de recrearlos.

No utilizarlo sobre una base de producción sin entender exactamente las consecuencias.

---

## 16.5 Restauración en paralelo

Con un backup Custom:

```bash
pg_restore \
  -h localhost \
  -U dev-espada \
  -d base_destino \
  -j 4 \
  backup.dump
```

`-j 4` utiliza cuatro procesos.

---

# 17. Migrar directamente de una base a otra

Si queremos copiar una base directamente:

```text
BASE ORIGEN
     │
  pg_dump
     │
     ▼
   PIPE
     │
     ▼
   psql
     │
     ▼
BASE DESTINO
```

Ejemplo:

```bash
pg_dump \
  "postgresql://postgres:postgres@localhost:5432/base_origen" \
  | psql \
  "postgresql://postgres:postgres@localhost:5433/base_destino"
```

Esto evita crear un archivo intermedio.

### ¿Cuándo utilizarlo?

Es útil para:

* Clonar bases.
* Migraciones.
* Copiar desarrollo → staging.
* Copiar staging → producción, cuando corresponda.

Para backups históricos es mejor generar un archivo y conservarlo.

---

# 18. Backup usando Docker

Si no queremos instalar PostgreSQL localmente, podemos utilizar Docker.

Ejemplo:

```bash
docker run --rm postgres:18 pg_dump \
  "postgresql://postgres:postgres@host.docker.internal:5432/mi_base" \
  -f /tmp/backup.sql
```

En Linux podemos utilizar:

```bash
docker run --rm --network host postgres:18 pg_dump \
  "postgresql://postgres:postgres@localhost:5432/mi_base" \
  -f /tmp/backup.sql
```

Docker permite utilizar una versión específica de las herramientas PostgreSQL sin modificar la instalación del sistema.

---

# 19. Verificar que un backup es válido

Crear el archivo no es suficiente.

Primero podemos inspeccionarlo:

```bash
pg_restore \
  --list \
  ~/db-backups/pos_system_db_20260907_191605.dump
```

Podremos encontrar objetos como:

```text
TABLE
TABLE DATA
INDEX
SEQUENCE
CONSTRAINT
```

También podemos comprobar que el archivo no esté vacío:

```bash
ls -lh backup.dump
```

---

# 20. Prueba real de restauración

La prueba más importante es restaurar el backup.

Crear una base temporal:

```bash
createdb \
  -h localhost \
  -U dev-espada \
  test_restore
```

Restaurar:

```bash
pg_restore \
  -h localhost \
  -U dev-espada \
  -d test_restore \
  backup.dump
```

Listar tablas:

```bash
psql \
  -h localhost \
  -U dev-espada \
  -d test_restore \
  -c "\dt"
```

Comprobar datos:

```bash
psql \
  -h localhost \
  -U dev-espada \
  -d test_restore \
  -c "SELECT count(*) FROM users;"
```

Finalmente:

```bash
dropdb \
  -h localhost \
  -U dev-espada \
  test_restore
```

### Regla

> Un backup que nunca fue restaurado es un backup no probado.

Se recomienda realizar pruebas de restauración periódicas.

---

# 21. Automatización de backups

Podemos utilizar `cron`.

Editar:

```bash
crontab -e
```

Ejemplo:

```text
0 3 * * * /ruta/completa/backup.sh >> /ruta/completa/backup.log 2>&1
```

Esto ejecutará el script diariamente a las:

```text
03:00
```

---

## Script básico

Crear:

```text
backup.sh
```

Contenido:

```bash
#!/bin/bash

set -e

BACKUP_DIR="$HOME/db-backups/daily"
FECHA=$(date +%Y%m%d_%H%M%S)
ARCHIVO="$BACKUP_DIR/railway_$FECHA.dump"

mkdir -p "$BACKUP_DIR"

echo "Iniciando backup..."

pg_dump \
  "postgresql://postgres:PASSWORD@HOST:PORT/railway?sslmode=require" \
  -Fc \
  -f "$ARCHIVO"

echo "Backup completado:"
echo "$ARCHIVO"
```

Dar permisos:

```bash
chmod +x backup.sh
```

Ejecutar:

```bash
./backup.sh
```

---

# 22. Rotación y retención

No debemos almacenar backups indefinidamente sin una política.

Una política inicial puede ser:

```text
Diarios:
14 días

Semanales:
8 semanas

Mensuales:
12 meses
```

Por ejemplo:

```text
daily/
weekly/
monthly/
```

Para eliminar backups diarios antiguos:

```bash
find ~/db-backups/daily \
  -name 'railway_*.dump' \
  -mtime +14 \
  -delete
```

La rotación debe diseñarse con cuidado para no eliminar accidentalmente todas las generaciones disponibles.

---

# 23. Estructura profesional de almacenamiento

Una estructura sencilla:

```text
~/db-backups/
│
├── daily/
│   ├── railway_20260907.dump
│   ├── railway_20260906.dump
│   └── railway_20260905.dump
│
├── weekly/
│   ├── railway_20260906.dump
│   └── railway_20260830.dump
│
└── monthly/
    ├── railway_20260901.dump
    └── railway_20260801.dump
```

También podemos separar los backups de desarrollo:

```text
~/db-backups/
├── development/
└── production/
```

---

# 24. Backups remotos

Guardar todos los backups solamente en:

```text
~/db-backups/
```

no es suficiente para producción.

Si el equipo se pierde, podemos perder:

```text
Base
+
Backups
```

Por eso necesitamos una copia remota.

Conceptualmente:

```text
                 PRODUCCIÓN
                     │
                     ▼
                pg_dump
                     │
              ┌──────┴──────┐
              ▼             ▼
           LOCAL          REMOTO
              │             │
              ▼             ▼
          14 días        30+ días
```

Podemos utilizar almacenamiento como:

* S3.
* Backblaze B2.
* Google Cloud Storage.
* Otro proveedor de almacenamiento.
* Otro servidor.

El almacenamiento remoto debe tener acceso restringido y, cuando sea apropiado, cifrado.

---

# 25. Seguridad de los backups

Los backups pueden contener información sensible:

```text
Usuarios
Clientes
Emails
Ventas
Productos
Inventario
Información comercial
Configuración
```

Por lo tanto:

### Nunca

Guardar backups en:

```text
GitHub público
Repositorios públicos
Discord
Telegram
Chats
```

### `.gitignore`

Como mínimo:

```gitignore
*.dump
*.backup
```

Si utilizamos dumps SQL con datos reales:

```gitignore
*.sql
```

siempre que el proyecto no necesite archivos SQL legítimos versionados.

### Credenciales

Nunca escribir passwords directamente en:

```text
scripts públicos
repositorios
Dockerfiles
código fuente
```

Utilizar:

```text
variables de entorno
~/.pgpass
secret managers
```

según el entorno.

---

# 26. RPO — Recovery Point Objective

RPO responde:

> ¿Cuánta información estamos dispuestos a perder?

Ejemplo:

```text
Backup cada 24 horas
```

Si ocurre un desastre justo antes del siguiente backup:

```text
Pérdida potencial ≈ 24 horas
```

Por lo tanto:

```text
RPO ≈ 24 horas
```

Con backups cada hora:

```text
RPO ≈ 1 hora
```

Con una estrategia WAL/PITR:

```text
RPO potencialmente mucho menor
```

---

# 27. RTO — Recovery Time Objective

RTO responde:

> ¿Cuánto tiempo podemos tardar en recuperar el sistema?

Ejemplo:

```text
Base perdida
     ↓
Crear nueva base
     ↓
Restaurar backup
     ↓
Configurar aplicación
     ↓
Verificar
     ↓
Sistema funcionando
```

Si tardamos 45 minutos:

```text
RTO ≈ 45 minutos
```

Un sistema profesional debe conocer aproximadamente:

```text
RPO → cuánto podemos perder
RTO → cuánto podemos tardar en recuperar
```

---

# 28. WAL y Point-in-Time Recovery

Para sistemas pequeños, los backups diarios pueden ser suficientes.

Pero cuando los datos se vuelven críticos, podemos utilizar una estrategia más avanzada.

```text
             BACKUP BASE
                  │
                  +
                 WAL
                  │
                  ▼
                 PITR
```

Esto permite recuperar la base de datos hasta un momento específico.

Por ejemplo:

```text
12:00 ───────────────
13:00 ───────────────
14:00 ─── ERROR ─────
15:00 ───────────────
```

Si el error ocurrió a las 14:32:

```text
PITR
 ↓
14:31:59
```

podría permitir recuperar el estado inmediatamente anterior al incidente.

### Importante

PITR no reemplaza los backups base.

Normalmente necesitamos:

```text
Backup base
+
WAL archivado
```

---

# 29. Estrategia recomendada para CajoraPOS

Para CajoraPOS podemos implementar la estrategia progresivamente.

## Nivel 1 — Actualmente

```text
PostgreSQL
    │
    ▼
pg_dump -Fc
    │
    ▼
Backup diario
```

Además:

```text
Backup manual
antes de migraciones
```

---

## Nivel 2 — Producción profesional

```text
PostgreSQL
     │
     ▼
Backup diario
     │
 ┌───┴────┐
 ▼        ▼
Local   Remoto
 │        │
14 días 30+ días
```

Además:

```text
Semanal → 8 semanas
Mensual → 12 meses
```

Y pruebas periódicas de restauración.

---

## Nivel 3 — Producción avanzada

Cuando la pérdida de horas de información sea demasiado costosa:

```text
Backup base
     +
WAL
     +
Archivado WAL
     +
PITR
     +
Backup remoto
     +
Monitorización
     +
Alertas
```

---

# 30. Plan de implementación por etapas

No es necesario implementar todo inmediatamente.

## Etapa 1

Implementar:

```text
pg_dump -Fc
+
backup diario
+
backup antes de migraciones
```

---

## Etapa 2

Agregar:

```text
Rotación
+
backups semanales
+
backups mensuales
+
almacenamiento remoto
+
pruebas de restauración
```

---

## Etapa 3

Cuando el sistema crezca:

```text
WAL
+
PITR
+
monitorización
+
alertas
+
automatización completa
```

---

# 31. Errores comunes

## Error de versión

```text
server version: 18
pg_dump version: 17
```

Solución:

Utilizar un `pg_dump` compatible con la versión del servidor.

---

## `could not connect to server`

Comprobar:

```text
Host
Puerto
Usuario
Password
Servidor activo
Firewall
SSL
```

---

## `relation already exists`

La base destino ya tiene objetos.

Podemos utilizar:

```bash
--clean --if-exists
```

cuando sea apropiado.

---

## Problemas de propietarios

Utilizar:

```bash
--no-owner
```

si estamos migrando entre usuarios diferentes.

También puede ser necesario:

```bash
--no-privileges
```

---

## Backup aparentemente correcto pero restauración fallida

No asumir que el archivo es válido solamente porque existe.

Ejecutar:

```bash
pg_restore --list backup.dump
```

y realizar una restauración de prueba.

---

## Backup creado en la ruta equivocada

Utilizar rutas explícitas:

```bash
"$HOME/db-backups/backup.dump"
```

en lugar de depender de expansiones ambiguas dentro de argumentos.

---

# 32. Checklist de producción

## Backups

* [ ] Backup diario configurado.
* [ ] Backup antes de migraciones.
* [ ] Backup antes de operaciones destructivas.
* [ ] Retención configurada.
* [ ] Backups semanales.
* [ ] Backups mensuales.
* [ ] Copia remota.

## Seguridad

* [ ] Backups fuera del repositorio.
* [ ] `.dump` incluido en `.gitignore`.
* [ ] Passwords fuera del código.
* [ ] Acceso restringido.
* [ ] Almacenamiento remoto protegido.
* [ ] Cifrado cuando corresponda.

## Verificación

* [ ] `pg_restore --list` funciona.
* [ ] Se realizó una restauración de prueba.
* [ ] Se verificaron las tablas.
* [ ] Se verificaron datos importantes.
* [ ] Se conoce el procedimiento de recuperación.

## Recuperación

* [ ] RPO definido.
* [ ] RTO definido.
* [ ] Procedimiento documentado.
* [ ] Backup remoto disponible.
* [ ] Se sabe dónde están las credenciales necesarias.
* [ ] Se ha probado una recuperación real.

## Producción avanzada

* [ ] WAL configurado.
* [ ] Archivado WAL.
* [ ] PITR.
* [ ] Monitorización.
* [ ] Alertas de fallos.
* [ ] Pruebas periódicas de recuperación.

---

# 33. Regla final

Un backup no consiste simplemente en ejecutar:

```bash
pg_dump
```

Un sistema profesional es:

```text
                 BASE DE DATOS
                       │
                       ▼
                  BACKUP
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
       LOCAL                      REMOTO
          │                         │
          └────────────┬────────────┘
                       ▼
                   RETENCIÓN
                       │
                       ▼
                 VERIFICACIÓN
                       │
                       ▼
              RESTAURACIÓN DE PRUEBA
                       │
                       ▼
                  RECUPERACIÓN
```

La pregunta no es:

> **"¿Tengo un backup?"**

La pregunta correcta es:

> **"Si mi base de datos desaparece ahora mismo, ¿puedo recuperarla, cuánto tiempo tardaría y cuánta información perdería?"**

Un sistema de backups profesional debe ser capaz de responder esas tres preguntas.

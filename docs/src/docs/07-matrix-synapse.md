# Guía Completa: Instalación y Configuración de Matrix Synapse con Docker

## 1. Requisitos previos

* Sistema basado en Linux (Ubuntu recomendado)
* Acceso con privilegios `sudo`
* Conexión a internet
* Un dominio o IP pública/local (ej: `example.com` o `192.168.0.9`)

---

## 2. Instalación de Docker y Docker Compose

Actualizar el sistema e instalar Docker:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose -y
sudo systemctl enable docker --now
```

Verificar instalación:

```bash
docker --version
docker compose version
```

---

## 3. Crear el proyecto

```bash
mkdir -p ~/matrix-synapse
cd ~/matrix-synapse
```

---

## 4. Generar configuración inicial de Synapse

Crear la configuración base en la carpeta `data`:

```bash
sudo docker run -it --rm \
  -v $(pwd)/data:/data \
  -e SYNAPSE_SERVER_NAME=example.com \
  -e SYNAPSE_REPORT_STATS=no \
  matrixdotorg/synapse:latest generate
```

 Notas importantes:

* `SYNAPSE_SERVER_NAME` debe ser tu dominio o IP (ej: `192.168.0.9`).
* Este valor será el identificador del servidor Matrix.
* Todos los usuarios tendrán formato: `@usuario:dominio`.

---

## 5. Configurar Docker Compose

Crear archivo `docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:15
    container_name: synapse_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: synapse
      POSTGRES_PASSWORD: synapse
      POSTGRES_DB: synapse
      POSTGRES_INITDB_ARGS: "--locale=C --encoding=UTF8"
    volumes:
      - ./postgres:/var/lib/postgresql/data

  synapse:
    image: matrixdotorg/synapse:latest
    container_name: synapse
    restart: unless-stopped
    depends_on:
      - db
    ports:
      - "8008:8008"
    volumes:
      - ./data:/data
    environment:
      SYNAPSE_SERVER_NAME: example.com
      SYNAPSE_REPORT_STATS: "no"
```

---

## 6. Levantar los servicios

```bash
docker compose up -d
```

Ver logs en caso de errores:

```bash
sudo docker logs synapse
```

---

## 7. Permisos de archivos

Si el servidor no inicia correctamente:

```bash
sudo chown -R 991:991 ./data
```

Para edición manual (uso no recomendado en producción):

```bash
sudo chmod -R 777 ./data
```

### Explicación:

* `chown`: cambia propietario
* `-R`: recursivo
* `991:991`: UID/GID usado por Synapse

---

## 8. Gestión de usuarios

### Crear usuario administrador

```bash
sudo docker exec -it synapse register_new_matrix_user http://example.com:8008 \
  -c /data/homeserver.yaml \
  --user admin \
  --password admin1234 \
  --admin
```

### Crear usuario normal

```bash
docker exec -it synapse register_new_matrix_user http://example.com:8008 \
  -c /data/homeserver.yaml
```

---

## 9. API de Matrix

### Registro de usuario

Endpoint:

```
POST /_matrix/client/r0/register
```

Ejemplo:

```json
{
  "username": "user",
  "password": "MiContraseñaSegura123",
  "auth": {
    "type": "m.login.dummy"
  }
}
```

Respuesta:

```json
{
  "user_id": "@user:example.com",
  "home_server": "example.com",
  "access_token": "TOKEN",
  "device_id": "DEVICE_ID"
}
```

---

### Buscar usuarios

```bash
curl -X POST \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"search_term": "user"}' \
  http://example.com:8008/_matrix/client/v3/user_directory/search
```

---

### Login

```bash
curl -XPOST -d '{
  "type":"m.login.password",
  "user":"@user:example.com",
  "password":"MiContraseñaSegura123"
}' "http://example.com:8008/_matrix/client/v3/login"
```

---

## 10. Media (archivos)

Matrix utiliza el esquema **MXC**:

```
mxc://<servidor>/<media_id>
```

Ejemplo:

```
mxc://10.0.29.5/sVHEUTqLjstMoeAtAVAYqpSV
```

---

### Subida de archivos

```bash
curl -XPOST "http://example.com:8008/_matrix/media/v3/upload?filename=prueba.jpg" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: image/jpeg" \
  --data-binary "@prueba.jpg"
```

---

### Descarga de archivos

Se usa el endpoint v1:

```bash
curl -H "Authorization: Bearer <ACCESS_TOKEN>" \
"http://example.com:8008/_matrix/client/v1/media/download/example.com/jKcbjjsJIJWclQOzNrPq" \
-o file.jpg
```

El `media_id` corresponde al identificador almacenado en disco en:

```
data/media_store/local_content/
```

---

## 11. Estructura de almacenamiento

Ejemplo:

```
data/
 ┣ media_store/
 ┃ ┗ local_content/
 ┃   ┣ ER/
 ┃   ┃ ┗ iF/
 ┃   ┃   ┗ archivo_id
 ┃   ┗ Wz/
 ┃     ┗ vO/
 ┃       ┗ otro_archivo_id
 ┣ homeserver.yaml
 ┣ signing.key
 ┗ logs
```

---

## 12. Relación entre base de datos y archivos

* La base de datos almacena **metadatos**
* El disco almacena los **archivos reales**
* El campo `media_id` conecta ambos

Consultar media:

```bash
sudo docker exec -it synapse_db psql -U synapse -d synapse -c "SELECT * FROM local_media_repository;"
```

---

### Ejemplo de consulta de usuarios

```bash
sudo docker exec -it synapse_db psql -U synapse -d synapse -c "SELECT name, admin FROM users;"
```

---

### Fecha de creación de usuarios

```bash
sudo docker exec -it synapse_db psql -U synapse -d synapse -c "
SELECT
  name,
  to_timestamp(creation_ts) AT TIME ZONE 'America/Managua' AS creation_date
FROM users;"
```

---

## 13. Reconfigurar base de datos

Eliminar y recrear:

```sql
DROP DATABASE IF EXISTS synapse;

CREATE DATABASE synapse
WITH OWNER = synapse
ENCODING = 'UTF8'
LC_COLLATE = 'C'
LC_CTYPE = 'C'
TEMPLATE = template0;
```

Reiniciar servicios:

```bash
docker compose down
docker compose up -d
```

---

## 14. Problemas comunes

### Error de permisos en media

Solución:

```bash
sudo docker exec -it synapse_db psql -U synapse -d synapse -c "
UPDATE local_media_repository
SET safe_from_quarantine = true;"
```

---

## 15. Generar access token

```bash
curl -XPOST "http://example.com:8008/_matrix/client/v3/login" \
-H "Content-Type: application/json" \
-d '{
  "type": "m.login.password",
  "user": "user",
  "password": "MiContraseñaSegura123"
}'
```

Uso en requests:

```
Authorization: Bearer <ACCESS_TOKEN>
```

---

## 16. Consultar información de usuario (admin)

```bash
curl -H "Authorization: Bearer <ACCESS_TOKEN>" \
http://example.com:8008/_synapse/admin/v1/whois/@user:example.com
```

---

## 17. Listar archivos en una room

```bash
curl -X GET "http://example.com:8008/_synapse/admin/v1/room/!ROOM_ID:example.com/media?access_token=<ACCESS_TOKEN>"
```

---

# Notas finales

* Usa siempre el mismo `SYNAPSE_SERVER_NAME` en toda la configuración.
* Ese valor define:

  * Identidad del servidor
  * Dominio Matrix
  * Namespace de usuarios
* El almacenamiento de media depende directamente de ese nombre.
* La base de datos solo referencia los archivos, no los contiene.


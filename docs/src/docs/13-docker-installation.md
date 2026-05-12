# Manual de Docker en Debian — Instalación, Desinstalación y Reinstalación Completa

Docker es una plataforma de contenedores que permite empaquetar, distribuir y ejecutar aplicaciones en entornos aislados. Este manual cubre la instalación completa usando el repositorio oficial, la desinstalación limpia sin residuos, y el procedimiento de reinstalación desde cero.

---

## Índice

1. [Requisitos Previos](#1-requisitos-previos)
2. [Desinstalación Completa](#2-desinstalación-completa-hacer-primero-si-ya-tienes-docker)
3. [Instalación desde el Repositorio Oficial](#3-instalación-desde-el-repositorio-oficial)
4. [Verificar la Instalación](#4-verificar-la-instalación)
5. [Configuración Post-Instalación](#5-configuración-post-instalación)
6. [Comandos Básicos](#6-comandos-básicos)
7. [Docker Compose](#7-docker-compose)
8. [Solución de Problemas](#8-solución-de-problemas)

---

## 1. Requisitos Previos

### Sistema operativo soportado

- Debian Bullseye (11), Bookworm (12) o superior
- Arquitecturas: `amd64`, `armhf`, `arm64`, `s390x`
- Al menos 2 GB de RAM (4 GB recomendado)
- Kernel Linux 3.10 o superior
- Acceso a `sudo` o root

Verificar la versión de Debian y la arquitectura:

```bash
cat /etc/debian_version
dpkg --print-architecture
```

---

## 2. Desinstalación Completa (hacer primero si ya tienes Docker)

> **Esta sección es el punto de partida si quieres hacer una instalación limpia, corregir una instalación rota, o simplemente eliminar Docker del sistema por completo.** Ejecuta todos los pasos en orden.

### Paso 1 — Detener todos los contenedores y el servicio

```bash
# Detener todos los contenedores en ejecución
docker stop $(docker ps -aq) 2>/dev/null || true

# Detener el servicio de Docker
sudo systemctl stop docker
sudo systemctl stop docker.socket
sudo systemctl stop containerd
```

### Paso 2 — Eliminar los paquetes de Docker

```bash
sudo apt purge -y \
  docker-ce \
  docker-ce-cli \
  containerd.io \
  docker-buildx-plugin \
  docker-compose-plugin \
  docker-ce-rootless-extras
```

También eliminar paquetes legados si existieran de instalaciones anteriores:

```bash
sudo apt remove -y \
  docker \
  docker-engine \
  docker.io \
  containerd \
  runc \
  2>/dev/null || true
```

Limpiar dependencias huérfanas:

```bash
sudo apt autoremove -y
sudo apt autoclean
```

### Paso 3 — Eliminar todos los datos de Docker

> ⚠️ **Advertencia:** Estos comandos eliminan permanentemente todas las imágenes, contenedores, volúmenes y redes de Docker. No hay recuperación posible. Si necesitas conservar algo, haz un backup primero con `docker export` o `docker save`.

```bash
# Eliminar directorios de datos principales
sudo rm -rf /var/lib/docker
sudo rm -rf /var/lib/containerd

# Eliminar configuración del demonio
sudo rm -rf /etc/docker

# Eliminar archivos de socket residuales
sudo rm -f /var/run/docker.sock
sudo rm -f /var/run/docker.pid
sudo rm -f /var/run/containerd/containerd.sock
```

### Paso 4 — Eliminar el repositorio y la clave GPG

```bash
# Eliminar la entrada del repositorio de Docker
sudo rm -f /etc/apt/sources.list.d/docker.list

# Eliminar la clave GPG
sudo rm -f /etc/apt/keyrings/docker.gpg
sudo rm -f /usr/share/keyrings/docker-archive-keyring.gpg  # ubicación alternativa antigua

# Actualizar el índice de paquetes
sudo apt update
```

### Paso 5 — Eliminar el grupo docker y los binarios residuales

```bash
# Eliminar el grupo docker
sudo groupdel docker 2>/dev/null || true

# Eliminar binarios residuales si existieran
sudo rm -f /usr/local/bin/docker
sudo rm -f /usr/local/bin/docker-compose
```

### Paso 6 — Deshabilitar y eliminar los servicios systemd

```bash
sudo systemctl disable docker 2>/dev/null || true
sudo systemctl disable containerd 2>/dev/null || true

# Recargar systemd para eliminar referencias a los servicios eliminados
sudo systemctl daemon-reload
sudo systemctl reset-failed
```

### Paso 7 — Verificar que Docker fue eliminado completamente

```bash
# Estos comandos deben devolver "command not found" o error
docker --version 2>/dev/null && echo "⚠️  Docker todavía está instalado" || echo "✅ Docker eliminado correctamente"
which docker 2>/dev/null && echo "⚠️  Binario docker todavía existe" || echo "✅ Binario eliminado"

# Verificar que no quedan servicios activos
systemctl list-units --type=service | grep docker
systemctl list-units --type=service | grep containerd
```

Si todos los checks muestran que Docker fue eliminado, el sistema está limpio y listo para una instalación fresca.

---

## 3. Instalación desde el Repositorio Oficial

### Paso 1 — Actualizar el índice de paquetes e instalar dependencias

```bash
sudo apt update

sudo apt install -y \
  ca-certificates \
  curl \
  gnupg \
  lsb-release
```

### Paso 2 — Agregar la clave GPG oficial de Docker

```bash
# Crear el directorio para claves si no existe
sudo install -m 0755 -d /etc/apt/keyrings

# Descargar y guardar la clave GPG
curl -fsSL https://download.docker.com/linux/debian/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Establecer permisos de lectura
sudo chmod a+r /etc/apt/keyrings/docker.gpg
```

### Paso 3 — Agregar el repositorio de Docker

Para **Debian Bookworm (12)**:

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/debian bookworm stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

Para **Debian Bullseye (11)**, reemplaza `bookworm` por `bullseye`:

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/debian bullseye stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### Paso 4 — Instalar Docker Engine

```bash
sudo apt update

sudo apt install -y \
  docker-ce \
  docker-ce-cli \
  containerd.io \
  docker-buildx-plugin \
  docker-compose-plugin
```

Los componentes instalados:

- `docker-ce` — motor principal de Docker
- `docker-ce-cli` — cliente de línea de comandos
- `containerd.io` — gestor de contenedores de bajo nivel (cumple la especificación OCI)
- `docker-buildx-plugin` — construcción avanzada de imágenes
- `docker-compose-plugin` — soporte para aplicaciones multi-contenedor

---

## 4. Verificar la Instalación

### Verificar el servicio

```bash
sudo systemctl status docker
```

Si el servicio no está activo, iniciarlo y habilitarlo:

```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### Ejecutar el contenedor de prueba

```bash
sudo docker run hello-world
```

La salida debe incluir:

```
Hello from Docker!
This message shows that your installation appears to be working correctly.
```

### Verificar versiones instaladas

```bash
docker --version
docker version
docker compose version
```

---

## 5. Configuración Post-Instalación

### Ejecutar Docker sin sudo

Por defecto, el comando `docker` requiere `sudo`. Para evitarlo, agregar el usuario al grupo `docker`:

```bash
sudo usermod -aG docker $USER
```

Aplicar el cambio sin cerrar sesión:

```bash
newgrp docker
```

Verificar que el grupo está asignado:

```bash
groups
```

> **Nota de seguridad:** Los usuarios del grupo `docker` tienen privilegios equivalentes a root. No agregar usuarios no administradores a este grupo.

### Configurar el demonio de Docker

Crear o editar el archivo de configuración del demonio:

```bash
sudo nano /etc/docker/daemon.json
```

Configuración recomendada con rotación de logs y storage driver óptimo:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
```

Aplicar los cambios:

```bash
sudo systemctl restart docker
```

### Política de reinicio para contenedores

Para que un contenedor se inicie automáticamente con Docker:

```bash
docker run -d --restart=unless-stopped nombre_imagen
```

Opciones disponibles:

| Política | Comportamiento |
|---|---|
| `no` | No reiniciar (por defecto) |
| `always` | Siempre reiniciar |
| `on-failure` | Solo si el contenedor falla |
| `unless-stopped` | Siempre, excepto si fue detenido manualmente |

---

## 6. Comandos Básicos

### Contenedores

```bash
docker ps                          # Contenedores en ejecución
docker ps -a                       # Todos los contenedores
docker stop ID_CONTENEDOR          # Detener un contenedor
docker start ID_CONTENEDOR         # Iniciar un contenedor detenido
docker rm ID_CONTENEDOR            # Eliminar un contenedor detenido
docker logs ID_CONTENEDOR          # Ver logs
docker exec -it ID_CONTENEDOR bash # Shell interactiva (usar sh en Alpine)
```

### Imágenes

```bash
docker images                      # Listar imágenes locales
docker pull nombre_imagen          # Descargar imagen
docker pull ubuntu:latest          # Ejemplo con tag
docker rmi nombre_imagen           # Eliminar imagen
docker build -t nombre:tag .       # Construir desde Dockerfile
```

### Redes y volúmenes

```bash
docker network ls                  # Listar redes
docker volume create nombre        # Crear volumen
docker volume ls                   # Listar volúmenes
docker volume inspect nombre       # Inspeccionar volumen
```

### Limpieza del sistema

```bash
docker container prune             # Eliminar contenedores detenidos
docker image prune                 # Eliminar imágenes sin usar
docker volume prune                # Eliminar volúmenes huérfanos
docker network prune               # Eliminar redes sin usar
docker system prune -a             # Limpieza agresiva de todo lo no utilizado
```

---

## 7. Docker Compose

### Archivo docker-compose.yml básico

```yaml
version: '3.8'

services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
    volumes:
      - ./html:/usr/share/nginx/html

  redis:
    image: redis:alpine
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

### Comandos de Compose

```bash
docker compose up -d               # Iniciar servicios en segundo plano
docker compose down                # Detener y eliminar contenedores
docker compose ps                  # Estado de los servicios
docker compose logs                # Ver logs de todos los servicios
docker compose logs -f nombre      # Seguir logs de un servicio específico
docker compose up -d --force-recreate  # Recrear contenedores
```

---

## 8. Solución de Problemas

### Permiso denegado al acceder al socket

**Error:** `permission denied while trying to connect to the Docker daemon socket`

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Docker no inicia después de un reinicio

Verificar el estado e inspeccionar los logs:

```bash
sudo systemctl status docker
sudo journalctl -u docker --no-pager -n 50
```

Causa común: configuración inválida en `/etc/docker/daemon.json`. Verificar la sintaxis JSON antes de reiniciar.

### Los contenedores no tienen acceso a internet

Verificar las redes y reglas de firewall:

```bash
docker network ls
docker network inspect bridge
sudo iptables -L -n
```

Los firewalls como `ufw` o `firewalld` pueden interferir con las redes de Docker. Revisar las excepciones correspondientes.

### Espacio en disco agotado

```bash
# Ver uso de disco de Docker
docker system df

# Limpieza selectiva
docker container prune
docker image prune
docker volume prune

# Limpieza completa (elimina todo lo no utilizado)
docker system prune -a --volumes
```

### Instalación rota o corrupta

Si Docker no funciona correctamente y los errores no tienen solución directa, la opción más fiable es hacer una desinstalación completa (ver **Sección 2**) y reinstalar desde cero (ver **Sección 3**). Este procedimiento resuelve la mayoría de los problemas causados por actualizaciones fallidas, conflictos de paquetes o configuraciones corruptas.

---

*Para profundizar en temas avanzados como Docker Swarm, seguridad en contenedores o desarrollo multi-etapa, consultar la [documentación oficial de Docker](https://docs.docker.com).*

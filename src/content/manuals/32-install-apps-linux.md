# Manual practico: Instalar aplicaciones `.AppImage`, `.tar.*` y `.deb` en Linux

Este manual funciona en la mayoria de distribuciones basadas en Debian (Ubuntu, Linux Mint, Pop!_OS, KDE Neon, etc.).

---

## Indice

1. [Tipos de paquetes](#1-tipos-de-paquetes)
2. [Instalar paquetes .deb](#2-instalar-paquetes-deb)
3. [Instalar AppImage](#3-instalar-appimage)
4. [Crear un acceso al menu](#4-crear-un-acceso-al-menu)
5. [Instalar programas desde archivos TAR](#5-instalar-programas-desde-archivos-tar)
6. [Si el TAR trae un instalador](#6-si-el-tar-trae-un-instalador)
7. [Si el TAR no trae instalador](#7-si-el-tar-no-trae-instalador)
8. [Donde guardar aplicaciones portables](#8-donde-guardar-aplicaciones-portables)
9. [Donde guardar iconos](#9-donde-guardar-iconos)
10. [Crear un acceso directo completo](#10-crear-un-acceso-directo-completo)
11. [Actualizar el menu](#11-actualizar-el-menu)
12. [Buscar aplicaciones instaladas](#12-buscar-aplicaciones-instaladas)
13. [Desinstalar](#13-desinstalar)
14. [Script para instalar automaticamente AppImage](#14-script-para-instalar-automaticamente-appimage)
15. [Herramienta recomendada: Gear Lever](#15-herramienta-recomendada-gear-lever)
16. [Resumen rapido](#16-resumen-rapido)

---

## 1. Tipos de paquetes

| Tipo                  | Se instala?       | Necesita apt? | Aparece en el menu automaticamente? |
| --------------------- | ----------------- | ------------- | ----------------------------------- |
| `.deb`                | Si                | Si            | Si                                  |
| `.AppImage`           | No (es portable)  | No            | No                                  |
| `.tar.gz` / `.tar.xz` | Depende           | No            | No                                  |

**Explicacion:**

- Los `.deb` son paquetes nativos de Debian/Ubuntu. El sistema los reconoce e integra completamente: crean accesos directos, iconos y se gestionan con `apt`.
- Los `.AppImage` son ejecutables portables. No modifiquen el sistema, pero tampoco se integran automaticamente con el menu.
- Los `.tar.*` son archivos comprimidos que pueden contener cualquier cosa. La integracion depende de lo que traigan dentro.

---

## 2. Instalar paquetes .deb

Es el metodo mas sencillo. El sistema se encarga de todo.

```bash
sudo apt install ./archivo.deb
```

Ejemplo:

```bash
sudo apt install ./discord-0.0.93.deb
```

Si falta alguna dependencia:

```bash
sudo apt --fix-broken install
```

Tambien pueden usar el metodo clasico con `dpkg`:

```bash
sudo dpkg -i archivo.deb
sudo apt -f install
```

**Explicacion:**

- `apt install ./archivo.deb` resuelve dependencias automaticamente.
- `dpkg -i` instala el paquete pero NO resuelve dependencias. Por eso se ejecuta `apt -f install` despues: eso instala las dependencias faltantes.
- `apt --fix-broken install` hace lo mismo: repara instalaciones incompletas.

Los paquetes `.deb` normalmente crean automaticamente:

- Acceso en el menu de aplicaciones
- Acceso en Rofi
- Iconos
- Desinstalacion mediante apt

---

## 3. Instalar AppImage

Los AppImage **no se instalan**. Simplemente son ejecutables portables que corren sin modificar el sistema.

### Paso 1: Crear una carpeta para aplicaciones

```bash
mkdir -p ~/Applications
```

### Paso 2: Mover el archivo

```bash
mv ~/Descargas/MiPrograma.AppImage ~/Applications/
```

### Paso 3: Dar permisos de ejecucion

```bash
chmod +x ~/Applications/MiPrograma.AppImage
```

### Paso 4: Probar que funciona

```bash
~/Applications/MiPrograma.AppImage
```

**Explicacion:**

- `chmod +x` agrega el permiso de ejecucion. Sin esto, el sistema no puede correr el archivo.
- `~/Applications` es la convencion mas comun para guardanr aplicaciones portables en el home del usuario.
- No hay paso de instalacion. El AppImage es un disco montado virtualmente que contiene todo lo que necesita para funcionar.

---

## 4. Crear un acceso al menu

Esta es la parte importante para que aparezca en Rofi y en el menu de aplicaciones.

Primero, crear la carpeta si no existe:

```bash
mkdir -p ~/.local/share/applications
```

Despues crear un archivo `.desktop`:

```bash
nano ~/.local/share/applications/miprograma.desktop
```

Contenido del archivo:

```ini
[Desktop Entry]
Version=1.0
Type=Application
Name=DBX
Exec=/home/TU_USUARIO/Applications/DBX_0.5.65_amd64.AppImage
Icon=/home/TU_USUARIO/.local/share/icons/dbx.png
Terminal=false
Categories=Development;
```

Cambiar **TU_USUARIO** por el nombre de usuario real. Guardar el archivo.

Luego, dar permisos y actualizar la base de datos:

```bash
chmod +x ~/.local/share/applications/miprograma.desktop
update-desktop-database ~/.local/share/applications
```

**Explicacion:**

- Los archivos `.desktop` siguen el estandar [freedesktop.org](https://specifications.freedesktop.org/desktop-entry-spec/latest/). Son la forma en que los entornos de escritorio descubren aplicaciones.
- `Name` es lo que aparece en el menu y en la busqueda de Rofi.
- `Exec` es la ruta absoluta al ejecutable. Debe ser exacta, incluyendo `~/` o `/home/usuario/`.
- `Icon` es la ruta al icono. Puede ser `.png` o `.svg`.
- `Categories` define en que seccion aparece el menu (Development, Utility, Graphics, etc.).
- `Terminal=false` evita que se abra una terminal al ejecutar. Cambiar a `true` si la aplicacion necesita terminal.
- `update-desktop-database` fuerza al sistema a re-leer los archivos `.desktop` sin necesidad de cerrar sesion.

Ahora la aplicacion aparecera en:

- Rofi (`rofi -show drun`)
- Menu de aplicaciones del escritorio
- KDE Launcher
- GNOME
- XFCE
- Cinnamon

---

## 5. Instalar programas desde archivos TAR

Hay varios tipos de compresion.

### TAR.GZ

```bash
tar -xzf programa.tar.gz
```

### TAR.XZ

```bash
tar -xf programa.tar.xz
```

Entrar a la carpeta extraida:

```bash
cd programa
```

Normalmente encontraran alguno de estos archivos:

```
programa
run.sh
start.sh
AppRun
install.sh
```

Dar permisos de ejecucion a todos los archivos:

```bash
chmod +x *
```

Ejecutar con cualquiera de estas opciones:

```bash
./programa
```

o

```bash
./AppRun
```

o

```bash
./start.sh
```

**Explicacion:**

- `tar -xzf` extrae archivos `.tar.gz`. La `z` indica que esta comprimido con gzip.
- `tar -xf` extrae archivos `.tar.xz`. El formato xz se detecta automaticamente.
- `chmod +x *` es necesario porque los archivos extraidos no vienen con permisos de ejecucion por defecto.
- No todos los TAR traen los mismos archivos de inicio. Prueben cual funciona.

---

## 6. Si el TAR trae un instalador

Algunos TAR incluyen un script de instalacion:

```
install.sh
```

Ejecutar:

```bash
chmod +x install.sh
./install.sh
```

o, si necesita permisos de administrador:

```bash
sudo ./install.sh
```

**Explicacion:**

- Los instaladores shell pueden hacer cosas distintas: copiar archivos a `/usr/local/bin`, crear accesos directos, resolver dependencias.
- Si el instalador pide `sudo`, es porque va a escribir en carpetas del sistema (como `/opt` o `/usr`).
- Siempre revisen el contenido del `install.sh` antes de ejecutarlo con `cat install.sh` o abriendolo en un editor.

---

## 7. Si el TAR no trae instalador

Lo recomendable es mover la carpeta completa a una ubicacion fija.

Ejemplo:

```bash
mv programa ~/Applications/
```

Y luego crear un archivo `.desktop` igual que con AppImage (ver seccion 4).

**Explicacion:**

- La ventaja de mover la carpeta a `~/Applications` es que queda centralizada y organizada.
- El `.desktop` debe apuntar al ejecutable real dentro de la carpeta, por ejemplo: `/home/usuario/Applications/programa/bin/programa`.

---

## 8. Donde guardar aplicaciones portables

Las ubicaciones recomendadas son:

- `~/Applications` para aplicaciones del usuario actual
- `/opt` para aplicaciones del sistema (requiere sudo)

Ejemplo de estructura:

```
~/Applications
|
+-- DBX.AppImage
+-- Rider
+-- AndroidStudio
+-- Godot
+-- Blender
```

**Explicacion:**

- `~/Applications` es seguro porque no requiere permisos de administrador y queda en el home del usuario.
- `/opt` es la ubicacion estandar del sistema para software de terceros. Funciona bien si varias personas usan la misma maquina.
- Mantener las aplicaciones en una sola carpeta facilita el backup, la limpieza y el control de espacio en disco.

---

## 9. Donde guardar iconos

La ubicacion recomendada es:

```
~/.local/share/icons
```

Ejemplo:

```
~/.local/share/icons/dbx.png
```

**Explicacion:**

- `~/.local/share/icons` es el estandar XDG para iconos de usuario.
- Los iconos aqui estan disponibles para todos los archivos `.desktop` del usuario.
- Pueden usar `.png` o `.svg`. Los `.svg` escalan mejor en diferentes resoluciones.

---

## 10. Crear un acceso directo completo

Ejemplo de un `.desktop` con todos los campos utiles:

```ini
[Desktop Entry]
Version=1.0
Type=Application
Name=JetBrains Rider
Comment=IDE para .NET
Exec=/home/dev-espada/Applications/Rider/bin/rider.sh
Icon=/home/dev-espada/.local/share/icons/rider.svg
Terminal=false
Categories=Development;IDE;
StartupNotify=true
```

**Explicacion:**

- `Comment` es una descripcion breve que aparece como tooltip o informacion adicional.
- `StartupNotify=true` muestra un indicador de carga mientras la aplicacion arranca. Util para pesadas como IDEs.
- `Categories` puede tener multiples valores separados por punto y coma. Consulten la lista completa en la especificacion freedesktop.

---

## 11. Actualizar el menu

Despues de crear o modificar un archivo `.desktop`:

```bash
update-desktop-database ~/.local/share/applications
```

Reiniciar Rofi:

```bash
rofi -show drun
```

La aplicacion deberia aparecer en la busqueda.

**Explicacion:**

- `update-desktop-database` genera un cache de los archivos `.desktop`. Sin esto, el sistema no detecta los cambios hasta reiniciar la sesion.
- Si Rofi no muestra la aplicacion, tambien pueden cerrar y volver a abrir Rofi, o ejecutar el comando de actualizacion de cache de su escritorio.

---

## 12. Buscar aplicaciones instaladas

Para ver que `.desktop` existen:

```bash
ls ~/.local/share/applications
```

Para ver las del sistema:

```bash
ls /usr/share/applications
```

**Explicacion:**

- `~/.local/share/applications` contiene los accesos directos del usuario actual.
- `/usr/share/applications` contiene los accesos directos del sistema (instalados con apt, snap, flatpak, etc.).
- Si una aplicacion instalada no aparece en el menu, revisen que el archivo `.desktop` exista en alguna de estas carpetas y que tenga el formato correcto.

---

## 13. Desinstalar

### Paquetes .deb

```bash
sudo apt remove nombre_paquete
```

Para eliminar tambien la configuracion:

```bash
sudo apt purge nombre_paquete
```

### AppImage

Eliminar el ejecutable y el acceso directo:

```bash
rm ~/Applications/Programa.AppImage
rm ~/.local/share/applications/programa.desktop
```

### TAR

Eliminar la carpeta y el acceso directo:

```bash
rm -r ~/Applications/programa
rm ~/.local/share/applications/programa.desktop
```

**Explicacion:**

- `apt remove` elimina el paquete pero conserva la configuracion.
- `apt purge` elimina tanto el paquete como la configuracion.
- Para AppImage y TAR, la desinstalacion es manual porque no estan integrados con el gestor de paquetes.
- Siempre eliminen tanto el ejecutable como el archivo `.desktop` correspondiente.

---

## 14. Script para instalar automaticamente AppImage

Guarda este script como `install-appimage.sh`:

```bash
#!/bin/bash

APP="$1"

mkdir -p ~/Applications
mkdir -p ~/.local/share/applications

cp "$APP" ~/Applications/
chmod +x ~/Applications/$(basename "$APP")

echo "Instalado en:"
echo "~/Applications/$(basename "$APP")"

echo
echo "Ahora solo debes crear el archivo .desktop."
```

Uso:

```bash
chmod +x install-appimage.sh
./install-appimage.sh MiPrograma.AppImage
```

**Explicacion:**

- El script copia la AppImage a `~/Applications` y le da permisos de ejecucion.
- `$1` es el primer argumento que se pasa al script (la ruta al AppImage).
- `$(basename "$APP")` extrae solo el nombre del archivo sin la ruta.
- El script NO crea el archivo `.desktop` automaticamente. Eso se debe hacer manualmente (ver seccion 4) o usar Gear Lever (ver seccion 15).

---

## 15. Herramienta recomendada: Gear Lever

Si prefieren evitar crear manualmente archivos `.desktop`, **Gear Lever** automatiza la integracion de AppImage con el sistema. Puede mover la AppImage a una ubicacion adecuada, crear el acceso directo, asociar el icono y facilitar actualizaciones.

En sistemas Debian/Ubuntu suele instalarse desde Flathub:

```bash
flatpak install flathub it.mijorus.gearlever
```

Una vez abierto, solo arrastran la AppImage a la ventana y el programa se encargara del resto.

**Explicacion:**

- Gear Lever es una herramienta grafica que simplifica todo el proceso de integracion de AppImages.
- Maneja automaticamente la creacion del `.desktop`, la copia del archivo, los permisos y los iconos.
- Es ideal para usuarios que prefieren no trabajar con la terminal para esta tarea.
- Requiere Flatpak instalado. Si no lo tienen, pueden instalarlo con `sudo apt install flatpak`.

---

## 16. Resumen rapido

| Tipo                  | Instalar                               | Menu | Rofi |
| --------------------- | -------------------------------------- | ---- | ---- |
| `.deb`                | `sudo apt install ./archivo.deb`       | Si   | Si   |
| `.AppImage`           | `chmod +x` + ejecutar + `.desktop`     | Si   | Si   |
| `.tar.gz` / `.tar.xz` | Extraer + ejecutar + `.desktop`        | Si   | Si   |

Con este flujo tendran todas sus aplicaciones accesibles desde el menu de aplicaciones y desde `rofi -show drun`.

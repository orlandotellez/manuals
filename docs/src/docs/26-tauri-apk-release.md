# Manual: Tauri Android — Dev, Debug APK y Release APK

## Índice

1. [Requisitos previos](#1-requisitos-previos)
2. [Configuración inicial del proyecto](#2-configuración-inicial-del-proyecto)
   - 2.1 [Inicializar el proyecto Android](#21-inicializar-el-proyecto-android)
   - 2.2 [Configurar vite.config.ts](#22-configurar-viteconfigts)
   - 2.3 [Variables de entorno](#23-variables-de-entorno)
3. [Agregar build-tools al PATH](#3-agregar-build-tools-al-path)
4. [Modo desarrollo (tauri android dev)](#4-modo-desarrollo-tauri-android-dev)
   - 4.1 [Conectar el teléfono por USB](#41-conectar-el-teléfono-por-usb)
   - 4.2 [Configurar ADB Reverse](#42-configurar-adb-reverse-importante)
   - 4.3 [Problema con Cloudflare WARP u otras VPNs](#43-problema-con-cloudflare-warp-u-otras-vpns)
   - 4.4 [Correr el dev server](#44-correr-el-dev-server)
5. [APK de Debug](#5-apk-de-debug-para-pruebas-rápidas)
6. [APK de Release](#6-apk-de-release-para-compartir-por-internet)
   - 6.1 [Crear el Keystore](#61-crear-el-keystore-solo-una-vez)
   - 6.2 [Configurar .env.production](#62-configurar-envproduction)
   - 6.3 [Compilar el APK de release](#63-compilar-el-apk-de-release)
   - 6.4 [Firmar el APK manualmente](#64-firmar-el-apk-manualmente)
7. [Instalar el APK en Android](#7-instalar-el-apk-en-android)
8. [Resumen rápido de comandos](#8-resumen-rápido-de-comandos)
9. [Solución de problemas comunes](#9-solución-de-problemas-comunes)

---

## Requisitos previos

- Android SDK instalado (`~/Android/Sdk`)
- NDK instalado (Tauri lo detecta automáticamente)
- ADB disponible en el PATH
- Java JDK instalado
- Rust con target Android: `rustup target add aarch64-linux-android`

---

## 2. Configuración inicial del proyecto

### 2.1 Inicializar el proyecto Android

```bash
pnpm tauri android init
```

### 2.2 Configurar `vite.config.ts`

El host debe escuchar en `0.0.0.0` para que el teléfono pueda conectarse:

```ts
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  server: {
    port: 1420,
    strictPort: true,
    host: host || "0.0.0.0", // importante: no dejar false
    hmr: host
      ? { protocol: "ws", host, port: 1421 }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});
```

### 2.3 Variables de entorno

Crear `.env`:

```env
VITE_API_URL="http://192.168.0.9:3000/api/v1"
```

> ⚠️ No uses `localhost` en la IP del backend para el APK de release — usa la IP real de tu PC o un servidor público.

---

## 3. Agregar build-tools al PATH

Necesario para `zipalign` y `apksigner`:

```bash
# Ver versiones instaladas
ls ~/Android/Sdk/build-tools/

# Exportar la versión (cambia 35.0.0 por la tuya)
export PATH="$PATH:$HOME/Android/Sdk/build-tools/35.0.0"

# Para que sea permanente
echo 'export PATH="$PATH:$HOME/Android/Sdk/build-tools/35.0.0"' >> ~/.bashrc
source ~/.bashrc
```

---

## 4. Modo desarrollo (`tauri android dev`)

### 4.1 Conectar el teléfono por USB

Habilitar **Depuración USB** en el teléfono:
- Configuración → Acerca del teléfono → toca "Número de compilación" 7 veces
- Configuración → Opciones de desarrollador → Depuración USB ✓

Verificar que el teléfono es detectado:

```bash
adb devices
# Debe mostrar: XXXXXXX    device
```

Si dice `unauthorized`, desbloquea el teléfono y acepta el popup.

### 4.2 Configurar ADB Reverse (importante)

Esto permite que el teléfono acceda al dev server y backend de tu PC por USB sin depender del WiFi:

```bash
adb reverse tcp:1420 tcp:1420   # Vite dev server
adb reverse tcp:1421 tcp:1421   # Vite HMR (hot reload)
adb reverse tcp:3000 tcp:3000   # Tu backend API
```

> Repite estos comandos cada vez que desconectes y reconectes el teléfono.

### 4.3 Problema con Cloudflare WARP u otras VPNs

Si tienes una VPN activa (WARP, Mullvad, etc.), Tauri puede detectar la IP de la VPN en vez de tu IP local, y el teléfono no podrá conectarse.

Solución:

```bash
# Opción A: desconecta la VPN antes de correr dev
warp-cli disconnect

# Opción B: fuerza la IP local manualmente
TAURI_DEV_HOST=192.168.0.9 pnpm tauri android dev
```

### 4.4 Correr el dev server

```bash
pnpm tauri android dev
```

Tauri compilará, instalará la app en el teléfono y abrirá el WebView apuntando al dev server.

---

## 5. APK de Debug (para pruebas rápidas)

No requiere firma. Útil para probar en tu propio dispositivo.

```bash
pnpm tauri android build --debug
```

El APK queda en:

```
src-tauri/gen/android/app/build/outputs/apk/debug/app-debug.apk
```

Instalar directo por USB:

```bash
adb install src-tauri/gen/android/app/build/outputs/apk/debug/app-debug.apk
```

> ⚠️ El APK debug **no se puede subir a Play Store** y puede ser más lento, pero funciona para compartir con testers.

---

## 6. APK de Release (para compartir por internet)

### 6.1 Crear el Keystore (solo una vez)

El keystore es tu firma digital. **Guárdalo en un lugar seguro — si lo pierdes no podrás actualizar la app.**

```bash
keytool -genkey -v \
  -keystore mi-app.keystore \
  -alias mi-app \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Te pedirá:
- Contraseña del keystore
- Nombre, apellido, organización, ciudad, país (puedes dejar en blanco con Enter)
- Confirmar contraseña

Verificar los alias del keystore:

```bash
keytool -list -keystore mi-app.keystore
```

### 6.2 Configurar `.env.production`

```env
VITE_API_URL="https://tu-servidor-publico.com/api/v1"
```

> Si el APK es solo para tu red local (mismo WiFi), puedes usar tu IP local: `http://192.168.0.9:3000/api/v1`

### 6.3 Compilar el APK de release

```bash
pnpm tauri android build
```

Genera un APK **sin firmar** en:

```
src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk
```

### 6.4 Firmar el APK manualmente

**Paso 1 — Alinear el APK:**

```bash
zipalign -v 4 \
  src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk \
  app-aligned.apk
```

**Paso 2 — Firmar:**

```bash
apksigner sign \
  --ks mi-app.keystore \
  --ks-key-alias mi-app \
  --ks-pass pass:tu-contraseña \
  --key-pass pass:tu-contraseña \
  --out app-release.apk \
  app-aligned.apk
```

**Paso 3 — Verificar la firma:**

```bash
apksigner verify app-release.apk
# Debe decir: Verified using v1 scheme, v2 scheme...
```

**Limpiar archivos temporales:**

```bash
rm app-aligned.apk
```

El APK listo para compartir es `app-release.apk`.

---

## 7. Instalar el APK en Android

### Desde PC por USB:

```bash
adb install app-release.apk
```

### Desde el teléfono (descarga directa):

El usuario debe activar la instalación de fuentes desconocidas:

- **Android 8+:** Configuración → Apps → (navegador o gestor de archivos) → Instalar apps desconocidas → Permitir
- **Android 7 o menos:** Configuración → Seguridad → Fuentes desconocidas ✓

Luego abrir el `.apk` desde el gestor de archivos y presionar **Instalar**.

---

## 8. Resumen rápido de comandos

| Acción | Comando |
|---|---|
| Inicializar Android | `pnpm tauri android init` |
| Dev con hot reload | `pnpm tauri android dev` |
| ADB reverse (puertos) | `adb reverse tcp:1420 tcp:1420` |
| Build debug | `pnpm tauri android build --debug` |
| Build release (sin firma) | `pnpm tauri android build` |
| Crear keystore | `keytool -genkey -v -keystore mi-app.keystore -alias mi-app -keyalg RSA -keysize 2048 -validity 10000` |
| Alinear APK | `zipalign -v 4 unsigned.apk aligned.apk` |
| Firmar APK | `apksigner sign --ks mi-app.keystore ...` |
| Verificar firma | `apksigner verify app-release.apk` |
| Instalar por USB | `adb install app-release.apk` |

---

## 9. Solución de problemas comunes

### `net::ERR_CONNECTION_REFUSED` en el WebView

- Verifica que Vite escucha en `0.0.0.0` (no en `false`)
- Corre `adb reverse` para todos los puertos necesarios
- Desconecta VPNs antes de correr `tauri android dev`

### `Failed to load signer: entry does not contain a key`

El alias del keystore no coincide. Verifica con:
```bash
keytool -list -keystore mi-app.keystore
```

### `Output file already exists` en zipalign

Borra el archivo anterior:
```bash
rm -f app-aligned.apk app-release.apk
```

### `zipalign: orden no encontrada`

Agrega el build-tools al PATH:
```bash
export PATH="$PATH:$HOME/Android/Sdk/build-tools/35.0.0"
```

### La app instala pero no carga datos (failed to fetch)

- En debug/dev: corre `adb reverse tcp:3000 tcp:3000`
- En release: el `VITE_API_URL` debe apuntar a un servidor público o IP local accesible

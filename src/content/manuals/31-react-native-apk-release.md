# Manual: Expo React Native — Dev, APK Debug y APK Release

## Indice

1. [Requisitos previos](#1-requisitos-previos)
2. [Estructura del proyecto](#2-estructura-del-proyecto)
3. [Modo desarrollo (expo start)](#3-modo-desarrollo-expo-start)
4. [Build de APK (Development Build)](#4-build-de-apk-development-build)
   - 4.4 [Ejecutar en modo Debug y Release con expo run:android](#44-ejecutar-en-modo-debug-y-release-con-expo-runandroid)
5. [APK de Debug](#5-apk-de-debug)
6. [APK de Release](#6-apk-de-release)
   - 6.1 [Crear el Keystore](#61-crear-el-keystore)
   - 6.2 [Configurar app.config.ts](#62-configurar-appconfigts)
   - 6.3 [Compilar AAB/APK de release con EAS](#63-compilar-aabapk-de-release-con-eas)
   - 6.4 [Build local (sin EAS)](#64-build-local-sin-eas)
   - 6.5 [APK universal desde AAB con bundletool](#65-apk-universal-desde-aab-con-bundletool)
7. [Instalar el APK en Android](#7-instalar-el-apk-en-android)
8. [Resumen rapido de comandos](#8-resumen-rapido-de-comandos)
9. [Solucion de problemas comunes](#9-solucion-de-problemas-comunes)

---

## 1. Requisitos previos

| Herramienta | Como verificar | Donde obtenerla |
|-------------|----------------|-----------------|
| Node.js 18+ | `node -v` | [nodejs.org](https://nodejs.org) |
| npm / pnpm | `pnpm -v` | `npm i -g pnpm` |
| Expo CLI | `npx expo --version` | Viene con el proyecto |
| Android SDK | `echo $ANDROID_HOME` | [Android Studio](https://developer.android.com/studio) |
| Java JDK 17+ | `java -version` | OpenJDK o bundle de Android Studio |
| ADB | `adb --version` | Android SDK platform-tools |
| Dispositivo Android | — | Fisico o emulador |

### Configurar Android SDK

Agrega esto a tu `~/.bashrc` o `~/.zshrc`:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/build-tools/35.0.0
```

```bash
source ~/.bashrc
```

### Verificar que ADB detecta el telefono

```bash
adb devices
# List of devices attached
# XXXXXXX    device
```

Si dice `unauthorized`, desbloquea el telefono y acepta el permiso de depuracion USB.

---

## 2. Estructura del proyecto

```
definitive-app/
├── app/                    # Expo Router (screens)
├── src/                    # Logica de negocio
├── assets/                 # Imagenes, fuentes
├── android/                # Proyecto nativo (generado con prebuild)
├── app.json                # Configuracion de Expo
├── app.config.ts           # Config dinamica
├── tsconfig.json
└── package.json
```

Para build nativo (APK), Expo necesita primero generar la carpeta `android/`:

```bash
npx expo prebuild
```

Esto genera el proyecto Android nativo usando versiones compatibles con tu SDK de Expo.

---

## 3. Modo desarrollo (`expo start`)

### 3.1 Limpiar cache y arrancar

```bash
pnpm expo start -c
```

El flag `-c` limpia el cache de Metro. **Usalo siempre que cambies imports, rutas o configuracion.**

### 3.2 Conectar el telefono

**Opcion A — Expo Go (recomendado para desarrollo rapido):**

1. Instala **Expo Go** desde Google Play en tu telefono.
2. Escanea el QR que aparece en la terminal o en http://localhost:8081.
3. La app se recarga automaticamente al guardar cambios.

**Opcion B — Development Build:**

Si necesitas modulos nativos que Expo Go no soporta, necesitas un [Development Build](https://docs.expo.dev/development/create-development-builds/):

```bash
npx expo run:android
```

Para este proyecto **Expo Go es suficiente** porque solo usamos modulos compatibles.

### 3.3 ADB Reverse (si usas WiFi o backend local)

Si la app necesita conectar a un backend en tu PC:

```bash
adb reverse tcp:8081 tcp:8081   # Metro bundler
adb reverse tcp:3000 tcp:3000   # Tu backend (si aplica)
```

---

## 4. Build de APK (Development Build)

Un Development Build es una version de tu app que se instala en el telefono y **reemplaza a Expo Go**. Te permite usar modulos nativos no soportados en Expo Go y recibir actualizaciones OTA.

### 4.1 Prebuild del proyecto nativo

```bash
npx expo prebuild --clean
```

Esto genera la carpeta `android/`. Si ya existe, `--clean` la regenera desde cero.

### 4.2 Development Build con EAS

**Requerido:** Necesitas una cuenta en [expo.dev](https://expo.dev) (gratis).

```bash
npx eas build --profile development --platform android
```

Esto compila en la nube de Expo y te da un link para descargar el APK.

### 4.3 Development Build local

Sin EAS, podes compilar localmente:

```bash
npx expo run:android
```

Compila directo en tu maquina y **lo instala automaticamente** en el telefono conectado por USB.

### 4.4 Ejecutar en modo Debug y Release con `expo run:android`

#### Ejecutar en modo Debug (el mas comun)

```bash
pnpm expo run:android
```

o explicitamente:

```bash
pnpm expo run:android --variant debug
```

Compila la app y la instala automaticamente en el telefono conectado por USB.

#### Ejecutar en modo Release

```bash
pnpm expo run:android --variant release
```

o en algunas versiones:

```bash
pnpm expo run:android --configuration Release
```

Compila la version Release, la instala directamente en el telefono y ya podes compartir el APK que se genera.

#### Limpiar antes de compilar

```bash
pnpm expo run:android --variant release --clear
```

o

```bash
pnpm expo prebuild --clean
pnpm expo run:android --variant release
```

#### Instalar un APK ya compilado

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

#### Ubicacion del APK

Despues de compilar:

| Modo | Ruta |
|------|------|
| Debug | `android/app/build/outputs/apk/debug/app-debug.apk` |
| Release | `android/app/build/outputs/apk/release/app-release.apk` |

#### Si queres que automaticamente aparezca en tu telefono

Con el telefono conectado por USB y la depuracion USB activada:

```bash
pnpm expo run:android --variant release
```

Ese comando:

1. Compila el APK de Release.
2. Lo instala automaticamente en el telefono.
3. Ademas deja el archivo APK en:
   `android/app/build/outputs/apk/release/app-release.apk`
   que es el que podes enviar por WhatsApp, Telegram o subir a Drive.

#### Otros flags utiles

```bash
pnpm expo run:android --device
```

Permite elegir un dispositivo si tenes varios conectados.

```bash
pnpm expo run:android --no-build-cache
```

Fuerza una compilacion sin usar la cache de Gradle.

```bash
pnpm expo run:android --port 8082
```

Usa un puerto diferente para Metro.

---

## 5. APK de Debug

Para compartir con testers o probar en otros dispositivos sin Expo Go.

### 5.1 Con EAS Build

```bash
npx eas build --profile preview --platform android
```

En `eas.json` necesitas tener el perfil:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### 5.2 Build local desde Android Studio

```bash
cd android
./gradlew assembleDebug
```

El APK queda en:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 6. APK de Release

Para distribuir la app (terceros, Play Store, etc.).

### 6.1 Crear el Keystore (solo una vez)

El keystore es **tu firma digital**. Si lo perdes, no podes actualizar la app en Play Store.

```bash
keytool -genkey -v \
  -keystore definitive-app.keystore \
  -alias definitive-app \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Te va a pedir:
- Contrasena del keystore (guardala)
- Nombre, organizacion, ciudad, pais (podes poner lo que quieras)
- Confirmar contrasena

**Verificar el keystore:**

```bash
keytool -list -keystore definitive-app.keystore
```

**Guardalo en un lugar seguro.** Recomendacion: `~/keystores/definitive-app.keystore`

```bash
mkdir -p ~/keystores
mv definitive-app.keystore ~/keystores/
```

### 6.2 Configurar app.config.ts

En `app.config.ts` agrega la configuracion de Android:

```ts
import type { ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext) => {
  return {
    ...config,
    name: 'definitive-app',
    slug: 'definitive-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      backgroundColor: '#fff5f5',
    },
    android: {
      package: 'com.tunombre.definitiveapp', // unico por app
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#fff5f5',
      },
    },
    web: {
      bundler: 'metro',
      favicon: './assets/favicon.png',
    },
  };
};
```

### 6.3 Compilar AAB/APK de release con EAS

```bash
npx eas build --profile production --platform android
```

En `eas.json`:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

EAS te va a pedir subir el keystore la primera vez. Expo lo guarda seguro.

### 6.4 Build local (sin EAS)

```bash
cd android
./gradlew bundleRelease   # Genera AAB (Play Store)
./gradlew assembleRelease # Genera APK
```

**Para firmar el APK manualmente:**

Paso 1 — Alinear:

```bash
zipalign -v 4 \
  android/app/build/outputs/apk/release/app-release-unsigned.apk \
  app-aligned.apk
```

Paso 2 — Firmar:

```bash
apksigner sign \
  --ks ~/keystores/definitive-app.keystore \
  --ks-key-alias definitive-app \
  --ks-pass pass:TU_CONTRASENA \
  --key-pass pass:TU_CONTRASENA \
  --out definitive-app-release.apk \
  app-aligned.apk
```

Paso 3 — Verificar:

```bash
apksigner verify definitive-app-release.apk
# Debe decir: Verified using v1 scheme, v2 scheme...
```

Paso 4 — Limpiar:

```bash
rm app-aligned.apk
```

### 6.5 APK universal desde AAB con bundletool

Si generaste AAB (Play Store) pero queres un APK para instalar directo:

```bash
# Descargar bundletool si no lo tenes
# https://github.com/google/bundletool/releases

java -jar bundletool-all-1.17.0.jar build-apks \
  --bundle=android/app/build/outputs/bundle/release/app-release.aab \
  --output=definitive-app.apks \
  --mode=universal

# Extraer el APK del .apks (que es un zip)
unzip definitive-app.apks -d app-apk
```

El APK universal esta en `app-apk/universal.apk`.

---

## 7. Instalar el APK en Android

### Desde PC por USB

```bash
adb install definitive-app-release.apk
```

Si ya esta instalada una version anterior:

```bash
adb install -r definitive-app-release.apk   # -r = reemplazar
```

### Desde el telefono (descarga directa)

1. Pasa el APK al telefono (Google Drive, WhatsApp, cable USB).
2. Abri el archivo `.apk` desde el gestor de archivos.
3. Si te pide permisos de "Instalar apps desconocidas":
   - Android 8+: Configuracion → Apps → (tu gestor de archivos) → Instalar apps desconocidas → Permitir
   - Android 7 o menos: Configuracion → Seguridad → Fuentes desconocidas ✓
4. Presiona **Instalar**.

---

## 8. Resumen rapido de comandos

| Accion | Comando |
|--------|---------|
| Dev server (limpiando cache) | `pnpm expo start -c` |
| Dev server (sin limpiar) | `pnpm expo start` |
| Abrir en Android | Escanear QR con Expo Go |
| Prebuild proyecto nativo | `npx expo prebuild --clean` |
| Development Build local | `npx expo run:android` |
| Build debug local | `cd android && ./gradlew assembleDebug` |
| Build release local (APK) | `cd android && ./gradlew assembleRelease` |
| Build release local (AAB) | `cd android && ./gradlew bundleRelease` |
| Build con EAS (development) | `npx eas build --profile development --platform android` |
| Build con EAS (preview) | `npx eas build --profile preview --platform android` |
| Build con EAS (production) | `npx eas build --profile production --platform android` |
| Crear keystore | `keytool -genkey -v -keystore app.keystore -alias app -keyalg RSA -keysize 2048 -validity 10000` |
| Alinear APK | `zipalign -v 4 unsigned.apk aligned.apk` |
| Firmar APK | `apksigner sign --ks app.keystore ...` |
| Verificar firma | `apksigner verify app-release.apk` |
| Instalar APK por USB | `adb install app-release.apk` |
| AAB a APK universal | `java -jar bundletool.jar build-apks --bundle=app.aab --output=app.apks --mode=universal` |

---

## 9. Solucion de problemas comunes

### `net::ERR_CONNECTION_REFUSED` en el telefono

- Asegurate de estar en la **misma red WiFi**.
- Si usas VPN (WARP, Mullvad), desconectala.
- Proba con el tunel de Expo: en vez de LAN, Expo te da opcion de **Tunnel** (mas lento pero funciona con VPN).

### `expo start -c` abre la app pero esta en blanco

- Revisa si hay errores en la terminal de Metro.
- Proba limpiar node_modules y reinstalar:
  ```bash
  rm -rf node_modules && npm install
  pnpm expo start -c
  ```

### `npx expo run:android` falla con error de SDK

- Verifica que `$ANDROID_HOME` apunte a la ruta correcta.
- Abri Android Studio → SDK Manager → instala Android SDK 35 (la que usa Expo 54).

### `adb: command not found`

- Agrega Android SDK al PATH:
  ```bash
  export PATH=$PATH:$HOME/Android/Sdk/platform-tools
  ```

### El APK no se instala en el telefono ("App no instalada")

- Ya existe una version firmada con otro keystore. Desinstalala primero.
- Si es debug, asegurate que la version previa tambien era debug (firmada con el debug keystore de Android SDK).
- Proba con: `adb uninstall com.tunombre.definitiveapp`

### `process: didUpdateNodeModules` se repite infinito

- Expo Router a veces se enloquece con los `node_modules`. Mata el proceso y corre `pnpm expo start -c` de nuevo.

### La app se ve mal despues de `npx expo prebuild`

- Proba limpiar todo:
  ```bash
  npx expo prebuild --clean
  ```

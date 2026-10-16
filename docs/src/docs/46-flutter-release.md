# Flutter + Neovim: instalación y primera app

Asumo Linux (o macOS/WSL). Si usás otro sistema, avisame.

## Índice

- [Paso 1: Dependencias previas (Linux)](#paso-1-dependencias-previas-linux)
- [Paso 2: Instalar Flutter](#paso-2-instalar-flutter)
- [Paso 3: Android SDK y emulador](#paso-3-android-sdk-y-emulador)
- [Paso 4: Verificar](#paso-4-verificar)
- [Paso 5: Crear la app mínima](#paso-5-crear-la-app-mínima)
- [Paso 6: Ejecutar](#paso-6-ejecutar)
- [Paso 7: Configurar Neovim](#paso-7-configurar-neovim)
- [Paso 8: Compilar la app para release](#paso-8-compilar-la-app-para-release)
  - [Camino A: APK para probar en tu celular](#camino-a-apk-para-probar-en-tu-celular)
  - [Camino B: APK y AAB para la Play Store (firma release)](#camino-b-apk-y-aab-para-la-play-store-firma-release)
- [Flujo de trabajo diario](#flujo-de-trabajo-diario)
- [Notas](#notas)

---

## Paso 1: Dependencias previas (Linux)

```bash
# Debian/Ubuntu
sudo apt install curl git unzip xz-utils zip libglu1-mesa clang cmake ninja-build pkg-config libgtk-3-dev
```

También necesitás el **JDK 17 o 21**. Si ya instalaste SDKMAN antes, ya lo tenés.

## Paso 2: Instalar Flutter

```bash
git clone https://github.com/flutter/flutter.git -b stable ~/development/flutter
```

Agregalo al PATH (en `~/.bashrc` o `~/.zshrc`):

```bash
export PATH="$HOME/development/flutter/bin:$PATH"
```

```bash
source ~/.bashrc
flutter --version
```

El SDK de Flutter ya incluye **Dart** y su **LSP**, así que no instalás nada extra para el lenguaje.

## Paso 3: Android SDK y emulador

Flutter necesita el Android SDK para compilar a Android. La forma más fácil es instalar **Android Studio**, pero solo para que descargue el SDK y el emulador. Después editás todo en Neovim.

1.  Instalá Android Studio (developer.android.com/studio) y abrilo una vez.
2.  En el asistente, dejá que instale el **Android SDK**, las **command-line tools** y el **emulador**.
3.  En **Device Manager** creá un dispositivo virtual (por ejemplo un Pixel con una imagen reciente).

Luego aceptá las licencias:

```bash
flutter doctor --android-licenses
```

**Alternativa sin emulador:** conectá tu celular por USB con **depuración USB** activada (Ajustes → Opciones de desarrollador). Suele ser más rápido que el emulador.

## Paso 4: Verificar

```bash
flutter doctor
```

Te muestra una checklist. Lo que necesitás en verde: **Flutter**, **Android toolchain** y un dispositivo conectado. Los avisos de Chrome, Linux desktop o Xcode podés ignorarlos si no los vas a usar. Si algo falla, el mismo comando te dice cómo arreglarlo.

## Paso 5: Crear la app mínima

```bash
flutter create mi_app
cd mi_app
```

Estructura que genera:

```
mi_app/
├── lib/
│   └── main.dart        ← tu código va acá
├── android/
├── ios/
├── test/
└── pubspec.yaml         ← dependencias (como package.json)
```

Para una plantilla más limpia que el contador de ejemplo, reemplazá `lib/main.dart` con esto:

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MiApp());

class MiApp extends StatelessWidget {
  const MiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Delivery',
      theme: ThemeData(colorSchemeSeed: Colors.red, useMaterial3: true),
      home: const Inicio(),
    );
  }
}

class Inicio extends StatelessWidget {
  const Inicio({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Restaurantes')),
      body: ListView.builder(
        itemCount: 20,
        itemBuilder: (context, i) => ListTile(
          leading: const Icon(Icons.restaurant),
          title: Text('Restaurante ${i + 1}'),
          subtitle: const Text('25-35 min'),
        ),
      ),
    );
  }
}
```

## Paso 6: Ejecutar

Con el emulador abierto o el celular conectado:

```bash
flutter devices     # lista los dispositivos disponibles
flutter run
```

Para abrir el emulador desde terminal:

```bash
flutter emulators
flutter emulators --launch <id_del_emulador>
```

Con `flutter run` corriendo, en esa misma terminal:

| Tecla | Acción |
|-------|--------|
| `r` | **Hot reload** (aplica cambios al instante) |
| `R` | Hot restart (reinicia el estado) |
| `q` | Salir |

Editás en Neovim, guardás, apretás `r` y ves el cambio al instante.

## Paso 7: Configurar Neovim

Usá el plugin **flutter-tools.nvim**, que integra el LSP de Dart, hot reload, selector de dispositivos y logs dentro de Neovim. Con **lazy.nvim**:

```lua
{
  'nvim-flutter/flutter-tools.nvim',
  lazy = false,
  dependencies = {
    'nvim-lua/plenary.nvim',
    'stevearc/dressing.nvim', -- opcional, mejora los selectores
  },
  config = function()
    require('flutter-tools').setup({
      widget_guides = { enabled = true },
      lsp = {
        color = { enabled = true },
        settings = {
          showTodos = true,
          completeFunctionCalls = true,
        },
      },
    })
  end,
}
```

Además:

```vim
:TSInstall dart
```

Comandos útiles dentro de Neovim:

| Comando | Qué hace |
|---------|----------|
| `:FlutterRun` | Ejecuta la app |
| `:FlutterDevices` | Elige el dispositivo |
| `:FlutterEmulators` | Lanza un emulador |
| `:FlutterReload` | Hot reload |
| `:FlutterRestart` | Hot restart |
| `:FlutterQuit` | Cierra la app |
| `:FlutterLogToggle` | Muestra/oculta los logs |
| `:FlutterOutlineToggle` | Árbol de widgets del archivo |

Opcional: mapeá `:FlutterRun` y `:FlutterReload` a atajos que te resulten cómodos. No hace falta configurar el LSP aparte, el plugin lo inicia solo.

## Paso 8: Compilar la app para release

Cuando la app ya funciona, toca generar el build para instalarla en un celular real o publicarla. Hay dos caminos, y el que te conviene depende de para qué vayas a usar el artefacto:

| Querés… | Usá |
|---------|-----|
| Probar la app en tu celular (o pasársela a alguien a mano) | **Camino A**: APK de release, sin configuración extra |
| Publicar en la Play Store | **Camino B**: AAB firmado con tu propio keystore |

### Camino A: APK para probar en tu celular

No requiere ninguna configuración extra. Compilás desde la raíz del proyecto (en este caso el proyecto Flutter vive en `frontend/`; ajustá la ruta si el tuyo está en otro lado):

```bash
cd frontend
flutter build apk --release --split-per-abi
```

El APK queda en:

```
frontend/build/app/outputs/flutter-apk/app-arm64-v8a-release.apk
```

**Por qué `--split-per-abi`:** sin esa bandera, Flutter empaqueta todas las arquitecturas juntas en un solo APK y el archivo queda mucho más grande de lo necesario — más del doble. Con `--split-per-abi` generás un APK por arquitectura: `arm64-v8a` es la que usan casi todos los celulares actuales, así que ese es el que vas a repartir.

### Camino B: APK y AAB para la Play Store (firma release)

Acá sí hay que hacer los deberes: la Play Store **no acepta builds firmados con la clave de debug**. Son tres pasos, y el primero se hace una sola vez.

#### B.1: Generar el keystore (una sola vez)

El keystore es tu firma digital. **Guardalo como oro:** si lo perdés, no vas a poder publicar actualizaciones de la app.

```bash
keytool -genkey -v -keystore ~/viviapp-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 -alias viviapp
```

`keytool` te va a pedir la contraseña del keystore y algunos datos de contacto (nombre, organización, ciudad, país — podés poner lo que quieras). Anotá la contraseña y el alias (`viviapp`): los necesitás en el paso siguiente.

#### B.2: Crear `android/key.properties`

Creá el archivo `android/key.properties` (dentro de la carpeta `android/`, no en la raíz) con este contenido:

```properties
storePassword=TU_PASSWORD
keyPassword=TU_PASSWORD
keyAlias=viviapp
storeFile=/home/tu-usuario/viviapp-release.jks
```

Reemplazá `TU_PASSWORD` por la contraseña que elegiste en el paso anterior, y `tu-usuario` por tu usuario real.

> **No subas este archivo al repositorio.** Junto con el `.jks`, es la llave de tu app: agregalos al `.gitignore`.

#### B.3: Conectar el keystore en `build.gradle.kts`

Acá está el detalle: este proyecto usa **Kotlin DSL** (`.kts`), no el `build.gradle` viejo que muestran la mayoría de los tutoriales, así que el código de carga del keystore es distinto.

En `android/app/build.gradle.kts`, primero cargá el archivo de propiedades. Este bloque va **fuera** de `android { }`, arriba de todo:

```kotlin
import java.util.Properties

val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(java.io.FileInputStream(keystorePropertiesFile))
}
```

`rootProject` es la carpeta `android/`, por eso `key.properties` se resuelve solo aunque el archivo esté ahí y no en la raíz del proyecto.

Dentro de `android { }`, declará el signing config y usalo en `buildTypes`:

```kotlin
android {
    // ...
    signingConfigs {
        create("release") {
            keyAlias = keystoreProperties["keyAlias"] as String
            keyPassword = keystoreProperties["keyPassword"] as String
            storeFile = file(keystoreProperties["storeFile"] as String)
            storePassword = keystoreProperties["storePassword"] as String
        }
    }

    buildTypes {
        release {
            // Reemplazá la línea que viene por defecto en la plantilla:
            //   signingConfig = signingConfigs.debug
            signingConfig = signingConfigs.getByName("release")
        }
    }
}
```

Si la plantilla no trae el bloque `signingConfigs`, agregalo tal cual. Si trae `signingConfig = signingConfigs.debug` en `release`, reemplazá esa línea por la de arriba.

#### Compilar el AAB para la Play Store

Un detalle no menor: **la Play Store, desde 2021, exige AAB y no APK**. Con la firma ya conectada, compilás:

```bash
flutter build appbundle --release
```

El AAB queda en:

```
frontend/build/app/outputs/bundle/release/app-release.aab
```

Ese es el archivo que subís a la consola de Play Console.

## Flujo de trabajo diario

1.  Abrís el emulador (o conectás el celular).
2.  En Neovim, dentro de `mi_app`: `:FlutterRun`.
3.  Editás `lib/main.dart`, guardás, y hot reload se aplica solo o con `:FlutterReload`.
4.  Los errores aparecen como diagnósticos del LSP, y los logs en `:FlutterLogToggle`.

## Notas

-   **iOS:** necesitás una Mac con Xcode. En Linux solo vas a poder probar Android, y está bien para empezar.
-   **Versiones:** Flutter se actualiza seguido. Si algo de esta guía no coincide, mirá docs.flutter.dev/get-started/install, y para mantenerlo al día usá `flutter upgrade`.
-   **Gestión de versiones:** cuando trabajes en equipo, considerá **FVM** para fijar la misma versión de Flutter por proyecto.

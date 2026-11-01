# Flutter desde cero con example_app

Este manual enseña Flutter leyendo un proyecto real. No es una lista de widgets ni una
traducción de la documentación oficial: es el recorrido completo por **example_app**, una
app de Flutter escrita con las prácticas que se usan en un proyecto serio, explicada
archivo por archivo y línea por línea.

La idea es simple: si entendés por qué cada línea está donde está, podés escribir tu
propia app sin copiar y pegar a ciegas.

**Para quién es**

Para alguien que nunca tocó Flutter. No hace falta saber Dart, ni programación reactiva, ni
arquitectura: cada concepto se presenta antes de usarlo y se explica con el código que lo
usa. Si ya programaste en otro lenguaje, mejor, pero no es requisito.

**Qué vas a aprender**

- Qué es Flutter, cómo se ejecuta una app y qué papel juega Dart.
- Cómo está organizado un proyecto que va a crecer: `core`, `app` y `features`.
- Widgets, composición y el árbol de widgets, que es todo lo que Flutter tiene.
- Estado con Riverpod: quién guarda los datos y quién los dibuja.
- Navegación con `go_router` y una barra de navegación que se mantiene.
- Un sistema de diseño con modo claro y oscuro, y cómo se recuerda la elección.
- Red con `dio`, errores con tipo (`Failure` y `Result`) y la separación entre datos,
  dominio y presentación.
- Formularios, autenticación y almacenamiento seguro.
- Textos en dos idiomas con ARB y `context.l10n`.
- Pruebas: unitarias, de controladores y de widgets.

**Qué es example_app**

Es el proyecto que vas a leer durante todo el manual, en la carpeta `example_app/`. En
pocas palabras:

- Una app de Flutter con **Clean Architecture** por feature: cada funcionalidad tiene su
  `presentation`, su `domain` y su `data`.
- **Riverpod** para el estado, **go_router** para las rutas y **dio** para la red.
- **freezed** y **json_serializable** para modelos inmutables y su mapeo desde JSON.
- Un **sistema de diseño** propio (colores, tipografía, espaciado y widgets base) con tema
  claro y oscuro, y la elección guardada en el dispositivo.
- **Localización** en español e inglés.
- Pruebas con `flutter_test` y `mocktail`.

**Qué necesitás**

- Flutter instalado (el proyecto pide Dart 3.11 o superior) y un editor con Dart.
- Un emulador o un teléfono para ver la app corriendo; sirve también el navegador.
- Ganas de escribir código: el manual se lee con el proyecto abierto al lado.

**Cómo está organizado**

Son veinte capítulos, pensados para leerse en orden. Los primeros cuatro son el terreno:
qué es Flutter, cómo correr el proyecto, cómo está armado y cómo arranca. Después el
manual va desde `main` hacia adentro: el arranque, la app y las rutas, los primeros
widgets, el estado, el diseño, la red, los datos, la autenticación, los textos y las
pruebas.

Cada capítulo arranca con el archivo que vas a leer, muestra el código tal cual está en el
proyecto y después lo explica. Al final de cada uno hay un resumen corto con lo que
importa.

**Cómo leerlo**

Abrí el proyecto en el editor y seguí los archivos en el mismo orden en que aparecen acá.
Cuando un bloque de código no te cierre, volvé a la explicación de la línea: está pensada
para eso. Y cada vez que puedas, cambiá algo y volvé a correr la app: Flutter recarga en
caliente, así que probar cuesta segundos.


## Qué es Flutter y qué es Dart

Antes de abrir un solo archivo del proyecto conviene tener dos palabras claras, porque se
confunden todo el tiempo y no significan lo mismo: Flutter y Dart.

**Flutter** es un conjunto de herramientas para construir aplicaciones con un solo código
fuente: lo escribís una vez y corre en Android, iOS, web, Windows, macOS y Linux. Lo
mantiene Google y es de código abierto. **Dart** es el lenguaje en el que se escribe ese
código. Dicho rápido: en Dart escribís, y Flutter te presta los widgets, el motor de
dibujo y las herramientas para convertir tu código en una app que se abre en un teléfono.

Todo el manual gira alrededor de una sola idea: si entendés por qué cada línea de
example_app está donde está, podés escribir tu propia app sin copiar a ciegas.

### Flutter dibuja su propia interfaz

Acá está la decisión de diseño que explica casi todo lo demás. Flutter **no usa los
controles nativos** del sistema operativo. No le pide a Android un botón ni a iOS una
barra superior: trae su propio motor de renderizado y dibuja cada píxel de la pantalla él
mismo, sobre un lienzo vacío.

Las consecuencias se sienten enseguida:

- **Se ve igual en todos lados.** Un botón definido en el proyecto mide lo mismo en un
  Pixel que en un iPhone, porque el que lo dibuja es tu app y no el sistema. No hay dos
  versiones de la misma pantalla que mantener en paralelo.
- **Tenés control total del detalle.** Animaciones, tipografías, bordes de un píxel y
  colores exactos dependen de vos. Esa libertad es la que permite que example_app tenga un
  sistema de diseño propio, con paletas claro/oscuro elegidas a mano y duraciones de
  animación fijas.
- **La app pesa más.** El motor viaja adentro del binario, así que una app Flutter ocupa
  más que una app nativa equivalente. Es un intercambio consciente, no un accidente.

Ese lienzo propio es también la razón de que exista el concepto más importante de todo
Flutter: el widget.

### Todo es un widget

Un **widget** es la descripción de una parte de la interfaz: qué hay que dibujar, con qué
tamaño, con qué color, qué otros widgets lleva adentro y cómo reacciona a un toque. No es
el objeto que ves en pantalla; es la receta. Flutter toma la receta, la compara con la
receta anterior y actualiza solo lo que cambió.

La interfaz completa es un **árbol de widgets**: uno arriba de todo (la app), y debajo
suyo otros que contienen a otros, hasta llegar a las hojas, que son cosas como un texto o
un ícono.

Un widget no se estiliza "desde afuera" ni hereda de otro widget: se **compone**. Si
querés un texto con margen y centrado, no buscás una propiedad de margen en el texto;
envolvés el texto con un widget de relleno y a ese relleno lo envolvés con uno de
centrado. Suena verboso y es, en realidad, la mejor noticia para un principiante: cada
pieza hace una sola cosa y se puede leer por separado.

Y "todo" es literal. Es un widget el texto, el relleno, el centrado, el espacio entre dos
tarjetas, una línea de un píxel, el gesto de toque, el botón, la pantalla entera y también
la aplicación. En example_app vas a encontrar widgets para cosas que en otras tecnologías
son configuración: hay un widget para el espaciado, otro para una línea fina, otro para
mostrar un estado de error. Cuando llegues al capítulo de los primeros widgets vas a ver
ese árbol con nombre y apellido.

Como los widgets son objetos livianos que se crean y se descartan todo el tiempo, la
práctica es hacerlos chicos: un widget chico se lee, se reusa y se prueba mejor que una
pantalla de trescientas líneas.

### Dart, el idioma

Dart es el lenguaje. Tiene tipos: escribís `int`, `String`, `List<Post>` y el compilador te
avisa de un error antes de ejecutar la app, no después. Tiene **null safety**, que quiere
decir que el compilador te obliga a declarar cuándo un valor puede faltar (`String?`) y
cuándo no (`String`), y te frena si usás un valor que podría ser nulo sin preguntar antes.

También tiene `async` y `await` para el trabajo que tarda: pedir datos por red, leer del
disco, esperar. En lugar de bloquear la app, esas operaciones devuelven un `Future`, que es
la promesa de un valor que va a llegar más adelante. Vas a ver `Future` en casi todos los
archivos de datos del proyecto.

Dart corre sobre un hilo de ejecución con un bucle de eventos: hace una cosa a la vez, pero
no se queda esperando. Para trabajo realmente pesado existen los **isolates**, que son
hilos separados con su propia memoria; el proyecto no los usa, así que no te preocupes por
ellos todavía.

Un detalle práctico: **no instalás Dart por separado**. Flutter trae su propio Dart
adentro. Cuando el proyecto pide Dart 3.11 o superior, te está pidiendo una versión de
Flutter lo bastante nueva como para incluir ese Dart.

### pubspec.yaml: la cédula del proyecto

En la raíz de cualquier proyecto Dart o Flutter hay un archivo llamado `pubspec.yaml`. Es
un archivo de texto en formato YAML (sangría, `clave: valor`, listas con guiones) y cumple
el papel de cédula: dice cómo se llama el paquete, qué versión es, qué versiones del
lenguaje acepta, de qué paquetes externos depende y qué recursos trae (imágenes, fuentes,
traducciones).

Las dependencias de un proyecto Flutter se llaman **paquetes** y se publican en un
repositorio público llamado pub.dev. Cuando agregás uno, lo nombrás en `pubspec.yaml` y
Flutter lo descarga.

**Archivo:** `pubspec.yaml`

```yaml
environment:
  sdk: ^3.11.0

dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter

  cupertino_icons: ^1.0.8
  flutter_riverpod: ^3.3.2
  go_router: ^17.3.0
  dio: ^5.11.0
  freezed_annotation: ^3.1.0
  json_annotation: ^4.12.0
  shared_preferences: ^2.5.5
  flutter_secure_storage: ^10.3.1
  logger: ^2.7.0
  intl: ^0.20.2
```

Léelo por partes:

- `environment: sdk: ^3.11.0` — la versión mínima de Dart que acepta el proyecto. El
  `^` significa "desde esta versión y hasta la próxima mayor": `^3.11.0` equivale a
  "3.11.0 o superior, pero menor que 4.0.0". Si tu Dart es más viejo, el proyecto no
  compila.
- `flutter:` con `sdk: flutter` — el framework en sí. No viene de pub.dev: viene del SDK
  que instalaste, por eso la entrada no tiene número de versión.
- `flutter_localizations:` con `sdk: flutter` — las traducciones de los textos que pone el
  propio framework (los botones de un diálogo, por ejemplo) y la infraestructura que
  después usa el generador de traducciones del proyecto.
- `cupertino_icons` — la fuente de íconos con estilo de iOS.
- `flutter_riverpod` — el gestor de estado y de inyección de dependencias. Riverpod
  responde una pregunta: "¿quién guarda este dato y quién lo lee?".
- `go_router` — la navegación. Responde: "¿qué pantalla se muestra en esta URL y quién
  puede entrar?".
- `dio` — el cliente HTTP. Responde: "¿cómo pido datos a un servidor?".
- `freezed_annotation` — las anotaciones (`@freezed`) que marcan las clases inmutables. El
  código que las hace funcionar lo genera otra herramienta, no se escribe a mano.
- `json_annotation` — lo mismo pero para JSON: marca las clases de las que se genera el
  `fromJson` que convierte un mapa de JSON en un objeto Dart.
- `shared_preferences` — almacenamiento simple de clave/valor en el dispositivo, para
  cosas chicas y no sensibles, como el tema elegido.
- `flutter_secure_storage` — almacenamiento cifrado, para lo que sí es sensible: tokens,
  contraseñas.
- `logger` — un registro de mensajes ordenado por nivel (depuración, aviso, error).
- `intl` — utilidades de internacionalización: formatos de fecha, número y moneda.

El mismo archivo tiene otra sección, `dev_dependencies`, con paquetes que se usan solo
mientras desarrollás: `flutter_lints` (las reglas de estilo), `build_runner`, `freezed` y
`json_serializable` (las herramientas que generan código) y `mocktail` (para las pruebas).
No viajan dentro de la app que publicás.

### El mapa de las herramientas

Estas son las cinco piezas que vas a aprender a usar en este manual, cada una con la
pregunta que responde:

- **Riverpod** guarda el estado de la app y lo reparte: los datos viven en objetos
  llamados *providers* y los widgets los leen; cuando el dato cambia, el widget se
  redibuja solo.
- **go_router** decide qué pantalla se ve para cada ruta y aplica reglas de entrada, como
  mandar a la pantalla de login si no hay sesión.
- **dio** hace los pedidos HTTP y permite engancharle interceptores, que son funciones que
  miran cada pedido y cada respuesta (por ejemplo, para registrar cuánto tardó).
- **freezed** genera clases inmutables con comparación e igualdad automáticas, así un
  modelo no se modifica por accidente en cualquier lugar del código.
- **l10n** (de *localization*) es la traducción: los textos viven en archivos aparte, uno
  por idioma, y el código los pide por nombre en lugar de escribirlos en pantalla.

A medida que avance el manual vas a ir conociendo cada una en el archivo donde aparece por
primera vez. El capítulo sobre el estado y el capítulo sobre la red son los que más las
usan.

### Resumen

- Flutter no usa controles nativos: dibuja la interfaz con su propio motor, y por eso la
  app se ve igual en todas las plataformas y pesa más.
- En Dart escribís el código; Flutter te da los widgets, el motor y las herramientas. Dart
  viene incluido con Flutter, no se instala aparte.
- Un widget es la descripción inmutable de un pedazo de interfaz; la pantalla es un árbol
  de widgets que se componen unos dentro de otros.
- `pubspec.yaml` es la cédula del proyecto: versión del lenguaje, dependencias y recursos.
  example_app pide Dart 3.11 o superior.
- Riverpod, go_router, dio, freezed y l10n son las cinco herramientas que vas a aprender;
  cada una responde una pregunta distinta de una app real.

## Preparar el entorno y correr example_app

Esta parte es puro trabajo de manos: instalar las herramientas, bajar las dependencias,
generar el código que no se escribe a mano y abrir la app. Después de este capítulo vas a
tener example_app corriendo en tu máquina y vas a poder tocarlo mientras leés el resto del
manual, que es como se aprende de verdad.

### Instalar Flutter y comprobar que quedó bien

Flutter se descarga como un paquete comprimido desde su sitio oficial. Se descomprime en
una carpeta cualquiera (no hace falta un instalador) y se agrega la subcarpeta `bin` al
`PATH` de tu sistema, para que la terminal encuentre el comando `flutter`. En Windows hay
un instalador que hace ese paso solo.

Con eso ya tenés Flutter **y** Dart: el comando `dart` viene en la misma carpeta `bin` y se
usa para las herramientas que no son de interfaz, como el generador de código.

El primer comando después de instalar es siempre el mismo:

```bash
flutter doctor
```

`flutter doctor` es un chequeo de salud. Revisa que la instalación de Flutter esté bien,
que exista un SDK de Android, que haya un navegador para probar en web, que el editor
tenga el complemento de Dart, y te dice con un símbolo qué está bien y qué falta, además de
la receta para arreglarlo (`flutter doctor --android-licenses`, por ejemplo, para aceptar
las licencias de Android). No necesitás tener todo en verde para este manual; alcanza con
Flutter, un editor y alguna plataforma donde correr la app.

El proyecto, además, tiene un requisito de versión:

> **Requirements:** Flutter `>=3.41` / Dart `>=3.11`

Eso está en el `README.md` y coincide con el `environment:` que leíste en el capítulo
anterior. Si `flutter --version` te muestra algo más viejo, actualizá el SDK antes de
seguir.

### Qué es un dispositivo y qué es un emulador

Cuando corrés una app Flutter, la app tiene que ejecutarse **en algún lado**. Ese "algún
lado" es un *dispositivo*:

- Un **teléfono real** conectado por cable, con la depuración por USB habilitada.
- Un **emulador de Android** o un **simulador de iOS**: un programa que imita un teléfono
  en una ventana de tu computadora. Se crea desde Android Studio o con
  `flutter emulators` y no necesita hardware físico.
- **Chrome** para la versión web, y la propia computadora para Windows, macOS o Linux. El
  proyecto trae las carpetas `android/`, `ios/`, `web/`, `linux/`, `macos/` y `windows/`,
  que son los proyectos nativos que Flutter usa para compilar en cada plataforma.

`flutter devices` lista lo que hay disponible en ese momento, y `flutter emulators` lista los
emuladores configurados (se arrancan con `flutter emulators --launch <id>`). Los emuladores
son más cómodos para empezar porque no dependen de un cable; un teléfono real es más fiel y
más rápido, y conviene tenerlo antes de publicar.

### Los comandos del proyecto: el Makefile

example_app trae un archivo llamado `Makefile` en la raíz. Un **Makefile** es una lista de
tareas con nombre para no tener que recordar comandos largos: escribís `make test` y el
sistema ejecuta lo que dice esa tarea. Las tareas se llaman **targets** y cada una tiene un
comentario con `##` que sirve para armar la ayuda.

**Archivo:** `Makefile`

```makefile
.DEFAULT_GOAL := help
.PHONY: help setup get gen watch l10n format format-check analyze test coverage verify run run-staging run-prod clean upgrade

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'
```

- `.DEFAULT_GOAL := help` — si escribís `make` sin decir qué tarea, ejecuta `help`.
- `.PHONY:` — le avisa a `make` que esos nombres son tareas y no archivos, así no se
  confunde si alguna vez existe un archivo con el mismo nombre.
- `help` — filtra el propio Makefile con `grep` buscando los comentarios `##` y los imprime
  como una lista de comandos disponibles. Por eso todas las tareas llevan ese comentario.

Ahora sí, las tareas que vas a usar:

**Archivo:** `Makefile`

```makefile
setup: get gen l10n ## First-time setup: deps + codegen + localizations

get: ## Install dependencies
	flutter pub get

gen: ## Run build_runner once (freezed / json_serializable)
	dart run build_runner build

watch: ## Run build_runner in watch mode
	dart run build_runner watch

l10n: ## Generate localization classes from ARB files
	flutter gen-l10n
```

- `setup: get gen l10n` — una tarea puede depender de otras: al pedirla, `make` ejecuta
  `get`, después `gen` y después `l10n`, en ese orden. Es la preparación de primera vez.
- `flutter pub get` — lee `pubspec.yaml`, resuelve las versiones de todos los paquetes,
  descarga lo que falte y escribe un archivo `pubspec.lock` con las versiones exactas que
  quedaron. Se corre cada vez que alguien agrega o cambia una dependencia.
- `dart run build_runner build` — corre el generador de código. Los archivos con
  `part 'post.freezed.dart';` y los `@freezed` / `@JsonSerializable` del proyecto son
  anotaciones: la clase de verdad, con su constructor, su `copyWith` y su `fromJson`, la
  escribe `build_runner` y queda en un archivo hermano con esos sufijos. Los archivos ya
  generados vienen en el repo; pero si tocás una anotación, regenerá o el editor te va a
  marcar errores hasta que lo hagas.
- `dart run build_runner watch` — lo mismo pero se queda escuchando: cada vez que guardás
  un archivo con anotaciones, regenera. Es el modo cómodo mientras trabajás. Algunos equipos
  le agregan el flag `--delete-conflicting-outputs`, que borra los archivos generados que ya
  no corresponden; este Makefile no lo usa.
- `flutter gen-l10n` — lee `l10n.yaml` y los archivos de traducción de `lib/l10n/arb/` y
  escribe las clases tipadas en `lib/l10n/gen/`. Sin ese paso no existe
  `context.l10n.appTitle`, el acceso a los textos traducidos.

Las tareas de calidad y de ejecución:

**Archivo:** `Makefile`

```makefile
verify: format-check analyze test ## Format check + analyze + test (CI gate)

run: ## Run the app with the dev flavor config
	flutter run --dart-define-from-file=config/dev.json

run-staging: ## Run the app with the staging flavor config
	flutter run --dart-define-from-file=config/staging.json
```

- `verify` — encadena `format-check` (verifica que el código esté formateado, sin
  modificarlo), `analyze` (el analizador estático, que marca errores y malas prácticas) y
  `test` (la batería de pruebas). Es el mismo control que corre la integración continua.
- `flutter run` — compila la app y la instala en el dispositivo que elijas, y deja un
  proceso vivo con recarga en caliente: apretás `r` y ves los cambios sin recompilar, `R`
  reinicia desde cero, `q` sale.
- `--dart-define-from-file=config/dev.json` — inyecta valores de configuración al compilar
  desde un archivo JSON. El proyecto tiene tres: `config/dev.json`, `config/staging.json` y
  `config/prod.json`, que no se versionan; los que sí están en el repo son las plantillas
  `.example.json`. Los valores se leen después en `lib/core/config/app_config.dart`.

Por eso el primer arranque del README pide copiar la plantilla:

**Archivo:** `README.md`

```bash
# 2. Create your local config from the template
cp config/dev.example.json config/dev.json

# 3. One-time setup: deps + codegen + localizations
make setup      # == flutter pub get && dart run build_runner build && flutter gen-l10n

# 4. Run it
make run        # == flutter run --dart-define-from-file=config/dev.json
```

Ese es el camino completo, de cero: copiar la config, `make setup`, `make run`. La primera
compilación tarda varios minutos porque hay que preparar el proyecto nativo; las
siguientes son mucho más rápidas.

### Las reglas de estilo: analysis_options.yaml

Dart tiene un **linter**: un programa que revisa tu código mientras lo escribís y te marca
cosas que compilan pero están mal, como una variable que nunca usás o una llamada a una
función asíncrona que te olvidaste de esperar. Las reglas se configuran en un archivo
llamado `analysis_options.yaml`, en la raíz.

**Archivo:** `analysis_options.yaml`

```yaml
include: package:flutter_lints/flutter.yaml

analyzer:
  language:
    strict-casts: true
    strict-inference: true
    strict-raw-types: true
  errors:
    # Treat missing awaits as an error — they are almost always bugs.
    unawaited_futures: error
    invalid_annotation_target: ignore
  exclude:
    - "**/*.g.dart"
    - "**/*.freezed.dart"
    - "lib/l10n/gen/**"
    - "build/**"
```

- `include:` — arranca con el conjunto recomendado por el paquete `flutter_lints`, que ya
  trae decenas de reglas sensatas, y desde ahí el proyecto agrega las suyas. No hay que
  escribirlas de cero.
- `strict-casts`, `strict-inference`, `strict-raw-types` — los tres modos estrictos del
  analizador: no permite conversiones de tipo implícitas ni dejar tipos sin decir. Te
  obliga a ser explícito, que en un proyecto que va a crecer es una bendición.
- `unawaited_futures: error` — si llamás a algo que devuelve `Future` y no lo esperás con
  `await`, es un error y no un aviso. Casi siempre es un bug real.
- `exclude:` — el analizador no revisa los archivos generados (`*.g.dart`,
  `*.freezed.dart`, `lib/l10n/gen/`) ni los proyectos nativos. Nadie edita esos archivos a
  mano, así que no tiene sentido quejarse de su estilo.

Y después vienen las reglas propias del proyecto, agrupadas por tema:

**Archivo:** `analysis_options.yaml`

```yaml
linter:
  rules:
    # Correctness
    - always_declare_return_types
    - avoid_dynamic_calls
    - cancel_subscriptions
    - close_sinks

    # Style & readability
    - always_use_package_imports
    - directives_ordering
    - prefer_const_constructors
    - prefer_final_locals
    - prefer_single_quotes
    - require_trailing_commas
```

El primer grupo cuida la corrección: declarar siempre el tipo de retorno de una función,
no llamar métodos sobre `dynamic` (donde el compilador deja de ayudar), cancelar las
suscripciones y cerrar los *streams* que abrís. El segundo cuida la lectura: importar con
`package:`, ordenar los `import`, preferir `const` y `final`, usar comillas simples y
terminar las listas de argumentos con coma, que es lo que hace que el formateador ponga un
argumento por línea.

La consecuencia práctica para vos: si `make analyze` se queja, no es el analizador siendo
mala onda, es el proyecto enseñándote la convención. Y `make format` arregla el formato
solo.

### Resumen

- Flutter se instala descomprimiendo el SDK y sumando su `bin` al `PATH`; Dart viene
  incluido. `flutter doctor` te dice qué falta y cómo arreglarlo.
- La app corre en un dispositivo: un teléfono real, un emulador o simulador, el navegador o
  tu propia computadora.
- `make setup` es la preparación de primera vez: `flutter pub get` (dependencias),
  `dart run build_runner build` (código generado) y `flutter gen-l10n` (traducciones).
- `make run` levanta la app con la configuración de desarrollo; necesita que exista
  `config/dev.json`, copiado de `config/dev.example.json`.
- `analysis_options.yaml` define las reglas del linter: parte de `flutter_lints` y suma
  modos estrictos, `unawaited_futures` como error y un conjunto de reglas de estilo.

## El mapa del proyecto: core, app y features

Ya sabés qué es Flutter y cómo se corre la app. Ahora toca lo que más va a determinar tu
comodidad en los próximos meses: dónde vive cada cosa. Un proyecto Flutter chico puede
tener todo en un archivo; uno que va a crecer necesita una estructura, y example_app
implementa una con nombre y apellido.

La regla se dice en una línea: **feature-first con un core compartido**. Primero se agrupa
por funcionalidad (cada feature se lleva todo lo suyo), y lo que no pertenece a ninguna
funcionalidad vive en un núcleo común.

### El árbol real de lib/

Todo el código Dart de la app está en la carpeta `lib/`. El `README.md` del proyecto lo
resume así:

**Archivo:** `README.md`

```text
lib/
├── main.dart                 # entry point → bootstrap(App.new)
├── bootstrap.dart            # zone guard, global error handling, DI overrides
├── app/                      # app shell: root widget + routing
├── core/                     # cross-cutting building blocks
│   ├── config/  error/  network/  providers/
│   ├── storage/ theme/   utils/
│   └── widgets/              # shared widget kit (barrel: widgets.dart)
├── features/
│   ├── auth/                 # login screen + AuthController (no real backend)
│   ├── shell/                # bottom-tab scaffold (ScaffoldWithNavBar)
│   ├── home/                 # Home tab: dashboard
│   ├── profile/              # Profile tab: account + logout
│   ├── counter/              # example: simple synchronous state
│   ├── showcase/             # live gallery of the widget kit
│   └── posts/                # example: full network → domain → UI (list + detail)
│       ├── data/             #   datasources, models (DTOs), repository impl
│       ├── domain/           #   entities, repository interface, use cases
│       └── presentation/     #   providers, pages (list + detail), widgets
└── l10n/                     # arb/ (source), gen/ (generated), l10n.dart
```

Unos sesenta archivos, y ninguno de ellos está en `lib/` "porque sí". Cada carpeta contesta
una pregunta distinta:

- **`main.dart` y `bootstrap.dart`** — el arranque. `main.dart` es el punto de entrada y
  `bootstrap.dart` prepara todo lo que la app necesita antes del primer cuadro (capturar
  errores, abrir el almacenamiento, inyectar dependencias). Los leés en el próximo capítulo
  y en el que sigue.
- **`app/`** — el armazón de la app, sin lógica de negocio. Adentro hay dos cosas: `app.dart`,
  el widget raíz que decide tema, idioma y ruteo, y `router/`, con `app_router.dart` (la
  tabla de rutas y la regla que manda a login) y `app_routes.dart` (los nombres de las rutas
  como `enum`).
- **`core/`** — todo lo transversal, lo que usan varias features: `config/` (la
  configuración inyectada al compilar), `error/` (las excepciones y los `Failure`), `network/`
  (el cliente HTTP y su interceptor), `providers/` (los providers de infraestructura),
  `storage/` (almacenamiento simple y cifrado), `theme/` (el sistema de diseño: colores,
  tipografía, espaciado, movimiento y el controlador de tema), `utils/` (el logger y el tipo
  `Result`) y `widgets/` (el kit de componentes reutilizables).
- **`features/<nombre>/`** — cada funcionalidad, con sus propias capas adentro.
- **`l10n/`** — las traducciones: `arb/` con los textos fuente en inglés y español, `gen/` con
  las clases generadas, y `l10n.dart` con la extensión `context.l10n`.

`core/widgets/` merece una lista propia, porque es la carpeta que más vas a mirar cuando
escribas tus pantallas. Ahí viven, entre otros, `app_button.dart`, `app_text_field.dart`,
`app_card.dart`, `app_avatar.dart`, `app_icon_box.dart`, `hairline.dart`, `gap.dart`,
`section_header.dart`, `empty_view.dart`, `error_view.dart`, `async_value_view.dart`,
`loading_overlay.dart`, `confirm_dialog.dart`, `app_snack_bar.dart` y `reveal.dart`. Todos se
exportan por un solo archivo, `widgets.dart`, que es lo que se llama un *barrel*: en lugar de
importar cada archivo por separado, importás el barrel y tenés todo el kit disponible.

### Por qué te conviene esta regla

La alternativa clásica es agrupar por tipo: una carpeta `pages/`, otra `widgets/`, otra
`models/`, otra `services/`. Funciona mientras el proyecto es chico, y se vuelve un
laberinto cuando tenés veinte pantallas: para tocar una funcionalidad saltás entre cuatro
carpetas que además contienen cosas de todas las demás.

Con **feature-first** pasa lo contrario: todo lo de una funcionalidad está junto. Si mañana
borrás `posts`, borrás una carpeta y no queda nada colgado. Si alguien nuevo entra al
proyecto, abre `lib/features/posts/` y ve el feature completo, de la pantalla al pedido de
red.

Las dos preguntas que más se hace un principiante tienen respuesta corta acá:

- **"¿Dónde pongo una pantalla nueva?"** En `lib/features/<nombre>/presentation/pages/`. Si
  es una pantalla de una funcionalidad nueva, creás la carpeta del feature completa, con
  sus tres capas si las necesita. El `README.md` lo dice explícito: creá
  `lib/features/<name>/{data,domain,presentation}`, seguí el ejemplo de `posts`, conectá los
  providers, agregá la ruta, agregá los textos y escribí las pruebas.
- **"¿Dónde pongo un widget nuevo?"** Depende de quién lo usa. Si lo va a usar una sola
  pantalla o un solo feature, va en `lib/features/<nombre>/presentation/widgets/`, como
  `post_tile.dart`. Si lo van a usar varias features, va en `lib/core/widgets/` **y** se
  agrega al barrel `widgets.dart` (y, por convención del proyecto, a la galería de
  componentes). La regla del `README.md` es tajante: reusá el kit antes de escribir UI a
  mano.

Fijate que `features/` no es solo para features grandes. `counter/` es el ejemplo más chico
posible: un contador con estado síncrono. `showcase/` es una galería donde se ven todos los
widgets del kit funcionando. Están ahí para que puedas comparar el caso mínimo con el caso
completo.

### Clean Architecture en palabras simples

Dentro de `features/posts` el proyecto aplica **Clean Architecture**, que suena a ponencia y
en realidad es una sola idea: separar el código en capas y hacer que las dependencias
apunten siempre hacia adentro, hacia el centro donde vive la lógica. Tres capas, de adentro
hacia afuera:

- **domain** — el negocio puro: qué es un post, qué se puede hacer con posts. Dart puro, sin
  Flutter, sin red, sin JSON. Es la capa que sobrevive a cualquier cambio de tecnología.
- **data** — cómo se consiguen los datos de verdad: pedidos HTTP, JSON, almacenamiento. Sabe
  de dio, de la URL de la API y de cómo viene cada campo. Implementa lo que el dominio pide.
- **presentation** — lo que se ve y lo que reacciona: pantallas, widgets y los objetos que
  guardan el estado de la pantalla. Habla con el dominio, nunca con dio.

Empecemos por el centro. Un post, para este proyecto, es esto:

**Archivo:** `lib/features/posts/domain/entities/post.dart`

```dart
@freezed
abstract class Post with _$Post {
  const factory Post({
    required int id,
    required int userId,
    required String title,
    required String body,
  }) = _Post;
}
```

Eso es una **entidad**: un tipo inmutable con cuatro campos, donde `required` obliga a
pasarlos todos. No tiene `fromJson`, no tiene `toJson`, no sabe que existe internet. La
anotación `@freezed` hace que `build_runner` genere el archivo hermano `post.freezed.dart` con
el constructor real, la igualdad por valor y un `copyWith` para crear copias cambiando un
campo. Por eso arriba del archivo está `part 'post.freezed.dart';`.

El dominio también define **qué** hay que poder hacer, sin decir cómo:

**Archivo:** `lib/features/posts/domain/repositories/post_repository.dart`

```dart
abstract interface class PostRepository {
  /// Fetches the list of posts.
  Future<Result<List<Post>>> getPosts();

  /// Fetches a single post by [id].
  Future<Result<Post>> getPost(int id);
}
```

`abstract interface class` es un contrato: dice qué métodos existen y qué devuelven, y no
tiene cuerpo. `Future<Result<List<Post>>>` se lee de adentro hacia afuera: "un `Future` que
va a entregar un `Result` que contiene o una lista de `Post` o un error". `Result` es un tipo
del propio proyecto: en vez de lanzar excepciones que nadie ve, el error viaja como un valor
que el compilador te obliga a mirar.

Encima del repositorio hay un **caso de uso**, que es una operación del negocio:

**Archivo:** `lib/features/posts/domain/usecases/get_posts.dart`

```dart
class GetPosts {
  const GetPosts(this._repository);

  final PostRepository _repository;

  Future<Result<List<Post>>> call() async {
    final result = await _repository.getPosts();
    // Example of a business rule living in the domain layer: newest first.
    return result.map(
      (posts) => [...posts]..sort((a, b) => b.id.compareTo(a.id)),
    );
  }
}
```

`GetPosts` recibe el repositorio por constructor (el `_` del nombre indica que es privado) y
tiene un método `call`, que en Dart permite usar el objeto como si fuera una función:
`getPosts()`. Adentro pide los datos y aplica una regla del negocio: ordenar de más nuevo a
más viejo. Esa regla vive acá y no en la pantalla, así que se puede probar sola.

La capa de datos implementa el contrato. El repositorio concreto traduce excepciones a
`Failure` y modelos de red a entidades:

**Archivo:** `lib/features/posts/data/repositories/post_repository_impl.dart`

```dart
  @override
  Future<Result<List<Post>>> getPosts() {
    return _run(() async {
      final dtos = await _remote.fetchPosts();
      return dtos.map((dto) => dto.toEntity()).toList();
    });
  }
```

`_run` envuelve la llamada en un `try/catch` y devuelve `Result.ok(...)` o `Result.err(...)`
según lo que pase. Los `dto` que llegan son **DTO** (*data transfer object*): clases que
copian exactamente la forma del JSON de la API, con su `fromJson` generado. `toEntity()` los
convierte al `Post` del dominio. Hay dos tipos para lo mismo a propósito: si la API cambia un
nombre de campo, tocás el DTO y su mapeo, y el resto de la app ni se entera.

Del otro lado, el data source es el único que conoce dio y las rutas de la API:

**Archivo:** `lib/features/posts/data/datasources/post_remote_data_source.dart`

```dart
  @override
  Future<List<PostDto>> fetchPosts() async {
    final response = await _guard(() => _dio.get<List<dynamic>>('/posts'));
    try {
      return (response.data ?? [])
          .cast<Map<String, dynamic>>()
          .map(PostDto.fromJson)
          .toList();
    } catch (e, s) {
      throw ParsingException('Failed to parse posts', (e, s));
    }
  }
```

Un **data source** es la pieza que habla con el mundo exterior. Acá hace `GET /posts`, toma
la lista que vino, convierte cada mapa de JSON en un `PostDto` y, si el JSON no tiene la
forma esperada, lanza una `ParsingException` propia del proyecto en lugar de dejar escapar
un error críptico.

Falta el puente con la pantalla. En `presentation` los providers arman el cableado:

**Archivo:** `lib/features/posts/presentation/providers/posts_providers.dart`

```dart
final postRemoteDataSourceProvider = Provider<PostRemoteDataSource>((ref) {
  return PostRemoteDataSourceImpl(ref.watch(dioProvider));
});

final postRepositoryProvider = Provider<PostRepository>((ref) {
  return PostRepositoryImpl(ref.watch(postRemoteDataSourceProvider));
});

final getPostsProvider = Provider<GetPosts>((ref) {
  return GetPosts(ref.watch(postRepositoryProvider));
});
```

Se lee de arriba hacia abajo: el data source se construye con el cliente dio compartido, el
repositorio se construye con ese data source, y el caso de uso con ese repositorio. Cada
`ref.watch` es "dame la instancia de este otro provider". Nada se instancia con `new` en el
medio de una pantalla: todo se arma acá. El beneficio aparece en las pruebas, donde se
reemplaza cualquier eslabón por un doble sin tocar el resto.

Y arriba de todo, la pantalla solo pide el dato y dibuja:

**Archivo:** `lib/features/posts/presentation/pages/posts_page.dart`

```dart
      body: AsyncValueView(
        value: ref.watch(postsControllerProvider),
        onRetry: () => ref.read(postsControllerProvider.notifier).refresh(),
```

`ref.watch` es "leé este provider y redibujá cuando cambie". `AsyncValueView` es un widget
del kit que muestra un spinner mientras carga, un mensaje de error si falló y los datos si
llegaron. La pantalla no sabe que existe dio, ni JSON, ni excepciones: pide un estado y lo
dibuja. Esa es toda la ganancia de las capas.

### Resumen

- La estructura es feature-first con un `core` compartido: cada funcionalidad se lleva sus
  capas, y lo transversal vive en `core/`.
- `main.dart` y `bootstrap.dart` arrancan la app; `app/` es el armazón (widget raíz y
  router); `features/<nombre>/` es cada funcionalidad; `l10n/` son las traducciones.
- Una pantalla nueva va en `features/<nombre>/presentation/pages/`; un widget de un solo
  feature va en su `presentation/widgets/`, y uno compartido en `core/widgets/` más el
  barrel `widgets.dart`.
- Clean Architecture son tres capas con dependencias hacia adentro: `domain` (negocio puro),
  `data` (red y JSON) y `presentation` (pantallas y estado).
- `features/posts` es el ejemplo completo del recorrido: data source → repositorio → caso de
  uso → provider → pantalla, con `Result` y `Failure` en lugar de excepciones sueltas.

## main.dart: las ocho líneas que arrancan todo

Llegó el momento de leer el archivo más corto y más importante del proyecto. Ocho líneas,
de las cuales una sola hace algo. Y entender esas ocho líneas es entender cómo cualquier
app Flutter empieza a existir.

### El archivo completo

**Archivo:** `lib/main.dart`

```dart
import 'package:example_app/app/app.dart';
import 'package:example_app/bootstrap.dart';

/// Default entry point.
///
/// Flavor-specific entry points (e.g. `main_dev.dart`, `main_prod.dart`) can
/// call [bootstrap] with different configuration while reusing [App].
void main() => bootstrap(App.new);
```

Eso es todo. No hay `runApp`, no hay `MaterialApp`, no hay configuración. A propósito.

### Línea 1 y 2: los imports

Las dos primeras líneas traen al archivo lo que necesita de otros archivos:

- `import 'package:example_app/app/app.dart';` — trae el widget `App`, que es la raíz de la
  interfaz. El prefijo `package:example_app/` es la forma de importar dentro de un paquete
  propio: `example_app` es el `name:` que declara `pubspec.yaml`, y lo que sigue es la ruta
  desde `lib/`. Por eso `lib/app/app.dart` se importa como
  `package:example_app/app/app.dart`. El linter del proyecto tiene activada la regla
  `always_use_package_imports`, que obliga a usar siempre esta forma y no rutas relativas
  como `'app/app.dart'`.
- `import 'package:example_app/bootstrap.dart';` — trae la función `bootstrap`, que hace
  todo el trabajo de arranque. La vas a leer entera en el próximo capítulo.

Dos imports y nada más: el archivo depende de dos piezas y no conoce nada del resto del
proyecto. Eso es intencional y enseguida vas a ver por qué.

### El comentario: los flavors

Entre los imports y el código hay un comentario que empieza con `///`. En Dart, tres barras
seguidas no son un comentario común: son un **comentario de documentación**. El editor lo
muestra al pasar el mouse sobre lo que documenta, y el texto entre corchetes crea un
enlace: `[bootstrap]` y `[App]` llevan a esas declaraciones. Documentar así es la forma de
dejar una explicación donde alguien la va a buscar, sin escribir un manual aparte.

El comentario dice tres cosas. Primero, que este es el punto de entrada por defecto.
Segundo, que puede haber otros puntos de entrada específicos por **flavor**. Tercero, que
esos otros puntos de entrada pueden llamar a `bootstrap` con otra configuración sin dejar de
reusar `App`.

Un **flavor** es una variante del mismo producto: desarrollo, pruebas, producción. No son
tres apps distintas, es la misma app con otra configuración (otra URL de API, otro nivel de
logs, otro nombre visible). En example_app eso se resuelve con `--dart-define-from-file` y
los archivos de `config/`, como viste en el capítulo del entorno, y con el enum `Flavor` de
`lib/core/config/app_config.dart`.

Ojo con un detalle honesto: los archivos `main_dev.dart` y `main_prod.dart` que menciona el
comentario **no existen** en el proyecto. El comentario documenta el patrón que el proyecto
deja preparado —la puerta abierta—, no algo que ya esté hecho. Si algún día necesitás un
punto de entrada distinto, lo creás y llamás a `bootstrap` con otra configuración.

### La línea que hace algo

```dart
void main() => bootstrap(App.new);
```

Una sola línea, y hay cuatro cosas adentro. Vamos por partes.

`void main()` — `main` es el nombre que el lenguaje reconoce como punto de entrada. Es la
primera función que corre cuando la app se lanza; el `void` dice que no devuelve nada. Tiene
que ser una función de nivel superior, fuera de cualquier clase: por eso vive en un archivo
propio y no dentro de un widget.

`=>` — la flecha es azúcar para un cuerpo de una sola expresión. `void main() => algo;` es
exactamente lo mismo que `void main() { algo; }`. Se usa cuando la función hace una sola cosa.

`bootstrap(...)` — la llamada. `bootstrap` es la función de `lib/bootstrap.dart` y su firma
es:

**Archivo:** `lib/bootstrap.dart`

```dart
Future<void> bootstrap(Widget Function() builder) async {
```

Leé el tipo del parámetro: `Widget Function()`. Se lee "una función que no recibe argumentos
y devuelve un `Widget`". `bootstrap` no recibe un widget armado, recibe **la manera de
armarlo**.

`App.new` — y acá está la pieza que suele desconcertar a todo el mundo. `App` es la clase
del widget raíz, y `App.new` es una **referencia al constructor**: no crea ningún objeto,
solo nombra al constructor como si fuera una función. Como el constructor de `App` no recibe
parámetros obligatorios y devuelve un `App`, que es un `Widget`, `App.new` encaja
perfectamente en un parámetro de tipo `Widget Function()`. Es equivalente a escribir
`() => App()`, pero sin envolver la llamada en otra función. A esa forma de pasar un
constructor como valor se la llama *constructor tear-off*.

Este es el motivo por el que esta línea no dice `runApp(App())`: `bootstrap` necesita poder
crear el widget **en el momento justo**, cuando ya capturó los errores, ya abrió el
almacenamiento y ya armó el `ProviderScope`. Si `main` creara `App` antes, el widget ya
estaría construido cuando esas cosas todavía no pasaron.

### Las tres preguntas

Con la línea explicada, quedan las tres preguntas que todo principiante hace en voz alta en
este punto.

**¿Quién llama a `main`?** Nadie de tu código. Cuando compilás, Flutter genera los proyectos
nativos de cada plataforma (las carpetas `android/`, `ios/`, `web/`, `linux/`, `macos/`,
`windows/`) y arma un binario que incluye el motor de Flutter más tu Dart compilado. Al abrir
la app, el lanzador nativo (la `MainActivity` en Android, el `AppDelegate` en iOS) levanta el
motor, y el motor busca la función de nivel superior `main` en el punto de entrada que se
compiló — por defecto `lib/main.dart`. Desde ahí, todo lo que corre es Dart. Si alguna vez
querés otro punto de entrada, se lo indicás al compilar con `flutter run -t`.
`main` no es un botón que alguien aprieta: es la puerta que el motor abre.

**¿En qué orden pasan las cosas?** En este orden, y esta es la parte que conviene tener
clara: se llama a `main`, que llama a `bootstrap` y le pasa el constructor de `App`.
`bootstrap` es asíncrono (devuelve `Future<void>`), y dentro suyo envuelve todo en una zona
con manejo global de errores, inicializa el binding de Flutter, engancha los manejadores de
errores del framework y de la plataforma, espera a que el almacenamiento esté listo y recién
ahí llama a `runApp`, que es la función que le dice a Flutter "acá está tu widget raíz, dibujá
la primera pantalla". La cadena completa es: `main` → `bootstrap` → preparación asíncrona →
`runApp` → primer cuadro. Todo el detalle de ese recorrido está en el próximo capítulo, el de
`bootstrap.dart`.

**¿Dónde se crea el widget de la app?** No en `main.dart`. `main.dart` solo entrega la
receta (`App.new`) y se retira. El widget raíz se crea dentro de `bootstrap`, cuando arma el
`ProviderScope` y le pasa `builder()` como hijo. `ProviderScope` es el contenedor de Riverpod
que hace que todos los providers de la app existan y compartan estado; el widget que
devuelve `builder()` queda adentro de él. Después, ya en el capítulo dedicado a `App`, vas a
ver que ese widget devuelve un `MaterialApp.router`, que es el que finalmente conecta tema,
idioma y rutas.

### Por qué el punto de entrada es tan flaco

Podrías escribir una app Flutter entera dentro de `main`. El proyecto elige lo contrario, y
la razón es la misma que hace que `main.dart` tenga dos imports: lo que se puede probar y
reusar no se mezcla con lo que se ejecuta una sola vez.

- **Se puede probar.** Una función `bootstrap` que recibe el widget raíz se puede llamar
  desde una prueba con un widget de mentira. Si `main` tuviera veinte líneas de
  inicialización adentro, probarlas sería imposible sin levantar la app entera.
- **Se puede reusar.** Los flavors del comentario son exactamente eso: distintos `main` que
  llaman al mismo `bootstrap` con otra configuración y el mismo `App`.
- **Se puede leer.** Cuando algo falla al arrancar, hay un solo archivo que mirar. No hay
  que buscar entre doscientas líneas de inicialización.

La regla que resume: `main` compone, no implementa. Toma dos piezas que ya existen y las
conecta en una línea.

### Resumen

- `lib/main.dart` tiene ocho líneas: dos imports, cinco de comentario de documentación y
  `void main() => bootstrap(App.new);`.
- Los imports usan `package:example_app/...` porque el `name:` de `pubspec.yaml` define el
  prefijo; el comentario `///` es documentación que el editor muestra, y `[bootstrap]` y
  `[App]` son enlaces.
- `App.new` es una referencia al constructor (*constructor tear-off*): una función sin
  argumentos que devuelve un `Widget`, que es justo lo que `bootstrap` espera recibir.
- `main` lo llama el motor de Flutter, no tu código; el orden es `main` → `bootstrap` →
  preparación asíncrona → `runApp` → primer cuadro.
- El widget raíz no se crea en `main.dart` sino dentro de `bootstrap`, cuando se lo pasa a
  `ProviderScope`; el punto de entrada se mantiene flaco para poder probarlo, reusarlo por
  flavor y leerlo de un vistazo.


## bootstrap.dart: errores globales y dependencias antes del primer frame

En el capítulo donde leímos `main.dart` viste que el punto de entrada de la app es una sola
línea. Esa línea no arranca Flutter: delega en `bootstrap`. Acá vas a entender por qué la
delegación existe y qué pasa en los milisegundos previos a que aparezca el primer pixel en
pantalla.

### La puerta de entrada delega

**Archivo:** `lib/main.dart`

```dart
import 'package:example_app/app/app.dart';
import 'package:example_app/bootstrap.dart';

/// Default entry point.
///
/// Flavor-specific entry points (e.g. `main_dev.dart`, `main_prod.dart`) can
/// call [bootstrap] with different configuration while reusing [App].
void main() => bootstrap(App.new);
```

`main` es la función que Dart ejecuta cuando arranca el programa. Acá no hace nada más que
llamar a `bootstrap` y pasarle `App.new`: la referencia al constructor de la clase `App`,
que es el widget raíz, o sea el primer widget del árbol. `App.new` es una función que, cada
vez que la llamás, crea un `App`. Fijate que `bootstrap` recibe *cómo construir el widget
raíz* en lugar del widget ya construido: eso le permite decidir el momento exacto en que lo
crea, después de preparar todo lo demás.

`main` devuelve `void` pero `bootstrap` devuelve `Future<void>`: la flecha descarta ese
futuro a propósito. Cuando el futuro termine, la app ya está corriendo sola.

### Qué es una zona y qué es un error no capturado

Antes de leer el cuerpo de `bootstrap` necesitás dos definiciones.

Una **zona** (zone) es un contexto de ejecución de Dart: una burbuja donde corren las
funciones asíncronas y donde se puede interceptar qué pasa con los errores que nadie atrapa.
`runZonedGuarded` ejecuta una función dentro de una zona nueva y le asocia un manejador de
errores.

Un **error no capturado** (uncaught error) es un error que ningún `try`/`catch` atrapó. En
código asíncrono es lo más común del mundo: una llamada de red que falla, un callback que
explota, un `Future` que se completa con error y nadie escucha. Si eso no se atiende en algún
lado, la app no te muestra nada útil: el error se pierde o aparece en la consola del sistema.

Por eso un proyecto serio arma *un solo lugar* donde todos esos errores se registran. Con
una zona guardada, cualquier error suelto de la app cae en el mismo manejador, con la misma
etiqueta y el mismo logger. Como principiante te importa porque cuando algo falla en el
teléfono de otra persona, o en un build de release, ese registro es lo único que vas a tener
para saber qué pasó.

**Archivo:** `lib/bootstrap.dart`

```dart
import 'dart:async';

import 'package:example_app/core/providers/core_providers.dart';
import 'package:example_app/core/storage/key_value_store.dart';
import 'package:example_app/core/theme/theme_controller.dart';
import 'package:example_app/core/utils/app_logger.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Boots the app inside a guarded zone with global error handling and the
/// async dependencies (storage) resolved and injected as provider overrides.
///
/// [builder] returns the root widget (kept as a parameter so tests and
/// different entry points/flavors can reuse this bootstrap).
Future<void> bootstrap(Widget Function() builder) async {
```

`dart:async` trae `runZonedGuarded` y `Future`. Los `package:example_app/...` son archivos
del propio proyecto: el almacenamiento clave-valor, el controlador del tema y el logger. Los
`package:flutter/...` son del framework: `foundation` aporta `kDebugMode` y `kReleaseMode`,
`widgets` aporta el binding y la clase base de todo widget. `flutter_riverpod` aporta
`ProviderScope`.

La firma dice: `bootstrap` es asíncrono (`async`, devuelve un `Future`), recibe una función
`Widget Function()` —una función sin parámetros que devuelve un `Widget`— y no devuelve
valor. `Widget` es la pieza básica de Flutter: una descripción inmutable de un trozo de
interfaz.

### El binding y los errores del framework

**Archivo:** `lib/bootstrap.dart`

```dart
  await runZonedGuarded(
    () async {
      WidgetsFlutterBinding.ensureInitialized();

      // Route framework errors through our logger.
      FlutterError.onError = (details) {
        AppLogger.instance.e(
          'FlutterError',
          error: details.exception,
          stackTrace: details.stack,
        );
        FlutterError.presentError(details);
      };
```

`await` delante de `runZonedGuarded` significa: esperá a que la zona termine su trabajo
antes de seguir. La función que le pasamos es `async` porque adentro hay `await`.

`WidgetsFlutterBinding.ensureInitialized()` inicializa el **binding**: la capa que conecta el
framework de Flutter con el motor nativo (el que dibuja y habla con el sistema operativo).
Normalmente `runApp` lo inicializa por vos, pero acá lo necesitamos antes, porque vamos a usar
un plugin (`SharedPreferences`) *antes* de `runApp`. Sin esta línea, ese uso temprano falla.

`FlutterError.onError` es el gancho que el framework llama cuando algo se rompe dentro de un
widget: un `build` que lanza, un layout imposible, un paint que falla. Le asignamos una
función que recibe `details`, un objeto con la excepción y su stack trace (la lista de
llamadas que llevaron al error). `AppLogger.instance.e(...)` lo registra como error con una
etiqueta fija, `'FlutterError'`. Después llamamos a `FlutterError.presentError(details)`, que
es el comportamiento original: en debug, la pantalla roja con el error. O sea, registramos
sin apagar el aviso visual.

### Los errores del lado de la plataforma

**Archivo:** `lib/bootstrap.dart`

```dart
      // Catch errors from the platform side (engine).
      PlatformDispatcher.instance.onError = (error, stack) {
        AppLogger.instance.e(
          'PlatformDispatcher',
          error: error,
          stackTrace: stack,
        );
        return true;
      };

      // Resolve async dependencies before the first frame.
      final keyValueStore = await SharedPreferencesStore.create();
      final storedThemeMode = await keyValueStore.getString(
        ThemeModeController.storageKey,
      );
```

`PlatformDispatcher` es la puerta hacia el sistema operativo: eventos de la ventana, del
teclado, del ciclo de vida. Su `onError` recibe los errores que vienen del motor y no del
framework. Devolver `true` significa "ya lo manejé": el motor no lo vuelve a reportar como
error fatal.

Las dos líneas siguientes son el corazón del capítulo. `SharedPreferencesStore.create()` es
una fábrica asíncrona: crea el objeto y espera a que el plugin esté listo. Guardamos el
resultado en `keyValueStore`, una abstracción de almacenamiento clave-valor en el
dispositivo (pensada para datos no sensibles). Después leemos el string guardado bajo
`ThemeModeController.storageKey`, que es una constante del controlador del tema.

### Las dependencias antes del primer frame

¿Por qué leer el tema acá y no dentro de la app? Porque `runApp` dibuja inmediatamente. Si la
app arrancara con el tema por defecto y recién después leyera el disco, verías un parpadeo:
un instante en claro y de golpe oscuro. Ese parpadeo se llama *flash* y es un detalle de
calidad que se nota. Leyendo antes de `runApp`, la app ya sabe con qué brillo nacer.

**Archivo:** `lib/core/theme/theme_controller.dart`

```dart
/// Persisted theme mode resolved before the first frame.
///
/// `bootstrap` overrides it with the stored value, so the app never flashes the
/// wrong brightness while storage resolves. It defaults to [ThemeMode.system],
/// which keeps widget tests free of extra provider overrides.
final initialThemeModeProvider = Provider<ThemeMode>((ref) => ThemeMode.system);
```

Este provider es un `Provider` de Riverpod: una fuente de valor que el resto de la app puede
leer. Por defecto devuelve `ThemeMode.system`, o sea "seguí el modo del sistema operativo".
Ese valor por defecto es lo que usan los tests de widgets, que no tienen disco ni
preferencias guardadas. En la app real, `bootstrap` lo pisa con el valor del disco.

### runApp y ProviderScope

**Archivo:** `lib/bootstrap.dart`

```dart
      runApp(
        ProviderScope(
          overrides: [
            keyValueStoreProvider.overrideWithValue(keyValueStore),
            // Restored before the first frame, so the app never flashes the
            // wrong brightness while storage resolves.
            initialThemeModeProvider.overrideWithValue(
              ThemeModeController.resolve(storedThemeMode),
            ),
          ],
          observers: [if (kDebugMode) _LoggingProviderObserver()],
          child: builder(),
        ),
      );
```

`runApp(widget)` le dice a Flutter: "este es el widget raíz, dibujá desde acá y no vuelvas".

`ProviderScope` es el contenedor de estado de Riverpod: todo widget que lea providers tiene
que estar *debajo* de un `ProviderScope`. `overrides` reemplaza la implementación de un
provider por un valor ya resuelto. Acá se reemplazan dos: `keyValueStoreProvider` (el
almacenamiento, que ya creamos y esperamos) e `initialThemeModeProvider` (el tema, ya
decodificado por `ThemeModeController.resolve`, que traduce el texto guardado a un
`ThemeMode` y cae en `system` ante cualquier valor raro o `null`).

El override del almacenamiento no es un lujo: mirá cómo está declarado el provider en
`lib/core/providers/core_providers.dart`.

```dart
/// Non-sensitive key/value storage.
///
/// Overridden in [main] with a resolved async instance so the rest of the
/// app can depend on it synchronously.
final keyValueStoreProvider = Provider<KeyValueStore>((ref) {
  throw UnimplementedError(
    'keyValueStoreProvider must be overridden in main() with '
    'SharedPreferencesStore.create().',
  );
});
```

Por defecto lanza `UnimplementedError`. Es una decisión de diseño: el resto de la app puede
leer el almacenamiento de forma *síncrona*, como si siempre estuviera listo, porque la parte
asíncrona se resolvió una sola vez acá arriba. Si alguien se olvida del override, el error
aparece al instante y con un mensaje que dice qué hacer.

`observers: [if (kDebugMode) _LoggingProviderObserver()]` usa una *collection if*: si
`kDebugMode` es verdadero (estás en debug), la lista tiene un observer; si no, queda vacía y
el observer ni se instancia. `kDebugMode` es una constante que el compilador conoce, así que
en release ese código se elimina.

Por último, `child: builder()` construye el widget raíz llamando a la función que recibimos.
En `main` eso es `App.new`, o sea un `App` recién creado.

### El manejador de la zona

**Archivo:** `lib/bootstrap.dart`

```dart
    },
    (error, stack) {
      AppLogger.instance.e(
        'Uncaught zone error',
        error: error,
        stackTrace: stack,
      );
    },
  );
}
```

Este es el segundo argumento de `runZonedGuarded`: el manejador de la zona. Si un `Future`
se completa con error y nadie lo escucha, si un callback asíncrono lanza, cae acá. La etiqueta
`'Uncaught zone error'` te dice de inmediato que el error no venía de un `build` ni del motor,
sino de la zona. Nada se relanza: lo registramos y la app sigue viva.

### El observer de debug

**Archivo:** `lib/bootstrap.dart`

```dart
/// Logs provider lifecycle events in debug builds — handy while developing.
final class _LoggingProviderObserver extends ProviderObserver {
  @override
  void providerDidFail(
    ProviderObserverContext context,
    Object error,
    StackTrace stackTrace,
  ) {
    AppLogger.instance.w(
      'Provider ${context.provider.name ?? context.provider.runtimeType} failed: $error',
    );
  }
}
```

`ProviderObserver` es un espía de Riverpod: recibe avisos cuando un provider se crea, cambia
o falla. Acá solo se implementa `providerDidFail`, que se dispara cuando un provider lanza una
excepción. El nombre `_LoggingProviderObserver` empieza con guion bajo, o sea que es privado
del archivo: nadie de afuera lo usa. `final class` significa que no se puede heredar de él.

El mensaje usa interpolación de strings: `$error` inserta el error adentro del texto.
`context.provider.name ?? context.provider.runtimeType` muestra el nombre del provider si lo
tiene, y si no, el tipo. `AppLogger.instance.w` registra como *warning*, no como error: un
provider que falla puede ser parte del flujo normal (por ejemplo, una carga que se reintenta).

### AppLogger, el registrador de la app

**Archivo:** `lib/core/utils/app_logger.dart`

```dart
abstract final class AppLogger {
  static final Logger instance = Logger(
    filter: _AppLogFilter(),
    printer: PrettyPrinter(methodCount: 0, lineLength: 100),
  );
}

/// Only logs in debug/profile builds. Release builds stay silent.
class _AppLogFilter extends LogFilter {
  @override
  bool shouldLog(LogEvent event) => !kReleaseMode;
}
```

`AppLogger` es una clase abstracta y final: no se instancia ni se hereda, solo agrupa cosas
estáticas. `instance` es la única instancia del `Logger` del paquete `logger`, creada una vez
y compartida por toda la app. `filter` decide qué se loguea: `_AppLogFilter` devuelve
verdadero solo si *no* estás en release, así que en producción no se imprime nada.
`PrettyPrinter` es el formateador de la salida: sin conteo de métodos y con líneas de cien
caracteres, para que la consola se lea.

La forma de usarlo ya la viste: `AppLogger.instance.e('mensaje', error: e, stackTrace: s)`
para errores, `.w` para advertencias, `.i` para información. Una sola puerta para todos los
logs significa que cambiar el formato o apagar la salida se hace en un archivo, no en cien.

### Resumen

- `main` solo llama a `bootstrap(App.new)`: el arranque real vive en un archivo aparte,
  reutilizable por tests y por distintos puntos de entrada.
- `runZonedGuarded` envuelve toda la app para que ningún error asíncrono quede sin registrar.
- `WidgetsFlutterBinding.ensureInitialized()` va primero porque hay plugins usándose antes de
  `runApp`.
- `FlutterError.onError` y `PlatformDispatcher.instance.onError` centralizan los errores del
  framework y del motor en `AppLogger`.
- El tema y el almacenamiento se resuelven antes de `runApp` y se inyectan como `overrides`
  de `ProviderScope`, así la app arranca con el brillo correcto y con las dependencias
  listas.

## App: MaterialApp.router, tema y localización

`App` es el widget raíz: el primero del árbol y el que decide qué se dibuja en toda la
pantalla. Es corto a propósito. Todo lo que podrías estar tentado de meter acá (estado,
red, navegación) vive en otro lado; este archivo solo conecta tres cosas: las rutas, el tema
y los textos.

### Un widget que lee estado

**Archivo:** `lib/app/app.dart`

```dart
import 'package:example_app/app/router/app_router.dart';
import 'package:example_app/core/config/app_config.dart';
import 'package:example_app/core/theme/app_theme.dart';
import 'package:example_app/core/theme/theme_controller.dart';
import 'package:example_app/l10n/l10n.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// The root application widget.
///
/// Wires up routing, theming and localization. Kept deliberately thin — all
/// real work lives in features and providers.
class App extends ConsumerWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeModeProvider);
```

Un **widget** en Flutter es una clase con un método `build` que devuelve otros widgets. Los
widgets se componen: uno contiene a otros, y así se arma el árbol. No hay plantillas ni HTML;
la interfaz *es* ese árbol de objetos.

`App` hereda de `ConsumerWidget`. Un `StatelessWidget` común tiene `build(BuildContext
context)`: recibe el contexto y devuelve la interfaz. `ConsumerWidget` viene de
`flutter_riverpod` y agrega un segundo parámetro, `WidgetRef ref`, que es el permiso para
leer providers. `const App({super.key})` es el constructor: `key` es un identificador opcional
que Flutter usa para reconocer widgets entre reconstrucciones, y `super.key` lo pasa a la
clase base.

`ref.watch(routerProvider)` se **suscribe** al provider: cada vez que el router cambie, este
widget se reconstruye solo. `ref.watch(themeModeProvider)` hace lo mismo con el modo de tema.
La diferencia con `ref.read`, que vas a ver en el capítulo del contador, es que `read` mira
una vez y no se entera de los cambios. Para pintar, siempre `watch`.

### MaterialApp.router

**Archivo:** `lib/app/app.dart`

```dart
    return MaterialApp.router(
      // Localized title (shown in the OS task switcher). Falls back to the
      // flavor name before the first frame resolves localizations.
      onGenerateTitle: (context) => context.l10n.appTitle,
      debugShowCheckedModeBanner: !AppConfig.isProd,
```

`MaterialApp` es el widget que instala el lenguaje visual de Material (tipografías, botones,
transiciones, el `Navigator`) y un montón de servicios globales. Tiene dos sabores. El clásico
es `MaterialApp(home: MiPantalla)`: crea un navegador con una sola pantalla inicial y listo.
El otro es `MaterialApp.router(...)`, que recibe `routerConfig` y delega la navegación en un
router externo.

Este proyecto usa `.router` porque no tiene una pantalla de arranque fija sino un conjunto de
rutas con URLs, una barra de pestañas que conserva estado y un redirect por autenticación.
Con `home:` no podrías tener `/posts/3` como dirección ni volver atrás de forma declarativa.

`onGenerateTitle` es una función que Flutter llama para obtener el nombre de la app (el que
se ve en el conmutador de tareas del sistema). Se llama *on generate* y no se pasa un string
directo porque el título depende de los textos localizados, y esos textos todavía no existen
cuando se construye este widget: la función se evalúa más tarde, cuando ya hay contexto.
Ojo al detalle: el `context` de esa flecha **no** es el de `build`, es el que Flutter pasa
como argumento, y ese sí está debajo de la localización.

`debugShowCheckedModeBanner: !AppConfig.isProd` esconde la cinta roja de "DEBUG" en los
builds de producción. La lógica sale de la configuración de compilación.

**Archivo:** `lib/core/config/app_config.dart`

```dart
  /// Human-readable app name shown in the UI.
  static String get appName => switch (flavor) {
    Flavor.prod => 'example_app',
    Flavor.staging => 'example_app (Staging)',
    Flavor.dev => 'example_app (Dev)',
  };

  static bool get isProd => flavor == Flavor.prod;
```

`isProd` es un *getter* estático que compara el flavor actual contra `Flavor.prod`. Los
flavors (dev, staging, prod) se eligen al compilar, no en runtime: `AppConfig.flavor` sale de
`String.fromEnvironment('FLAVOR', defaultValue: 'dev')`, que lee un valor inyectado con
`--dart-define`. En dev y staging el getter da `false` y ves la cinta; en prod da `true` y la
cinta desaparece. Nada de esto se decide con un `if` en runtime que puedas olvidarte de
cambiar.

### Tema, brillo y modo

**Archivo:** `lib/app/app.dart`

```dart
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      // The user picks system/light/dark in the profile screen; the choice is
      // restored from storage before the first frame.
      themeMode: themeMode,
      routerConfig: router,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
    );
```

`theme` y `darkTheme` son dos `ThemeData`: el paquete completo de colores, tipografías y
estilos para brillo claro y para brillo oscuro. `AppTheme.light()` y `AppTheme.dark()` los
construyen; los detalles están en el capítulo del sistema de diseño. `themeMode` decide cuál
de los dos se usa: `ThemeMode.light`, `ThemeMode.dark` o `ThemeMode.system` (seguir al
sistema operativo). Acá viene de `themeModeProvider`, que arranca con el valor restaurado
antes del primer frame y cambia cuando el usuario elige en la pantalla de perfil.

`routerConfig: router` entrega el `GoRouter` que vimos construir en `bootstrap` a través del
provider. Es el punto donde la navegación se enchufa al `MaterialApp`.

`localizationsDelegates` son los *delegados* de traducción: objetos que saben responder "qué
texto va acá en este idioma". `AppLocalizations` es la clase generada por Flutter a partir de
los archivos ARB del proyecto, y sus delegados cubren tanto los textos propios de la app como
los textos internos de Material (por ejemplo, el "atrás" del sistema).
`supportedLocales` es la lista de idiomas soportados: español e inglés.

### Cómo se accede a los textos

**Archivo:** `lib/l10n/l10n.dart`

```dart
/// Convenience accessor for localized strings.
///
/// Instead of `AppLocalizations.of(context)!.postsTitle`, write
/// `context.l10n.postsTitle`.
extension AppLocalizationsX on BuildContext {
  AppLocalizations get l10n => AppLocalizations.of(this);
}
```

Una **extensión** agrega miembros a una clase que no es tuya. Acá le agrega `l10n` a
`BuildContext`, así que en cualquier widget escribís `context.l10n.counterTitle` y obtenés el
texto traducido. Sin la extensión sería `AppLocalizations.of(context)!.postsTitle`: más
largo, con un `!` que afirma que nunca es nulo y que, si te equivocás, rompe en runtime.

### Qué es BuildContext

`BuildContext` es la posición de un widget dentro del árbol. No es una clase de utilidades ni
un objeto global: cada widget recibe *su* contexto, y a través de él se mira hacia arriba
para encontrar cosas que instalaron los ancestros.

Mirá el `build` de `App`. Recibe un `context`… y no lo usa directamente. ¿Por qué? Porque
`App` está por *encima* del `MaterialApp` que él mismo construye. Todo lo que un contexto te
da —`Theme.of`, `context.palette`, `context.l10n`— se busca en los ancestros, y los ancestros
de `App` no tienen ni tema ni localización: los tiene lo que `App` está a punto de crear. Por
eso `onGenerateTitle` recibe otro `context`, uno que sí está adentro. Y por eso los widgets
de las páginas, que viven debajo del `MaterialApp`, pueden usar `context.l10n` sin problema.

Regla práctica: si un `context` no encuentra lo que buscás, probablemente lo estás usando
desde arriba del widget que provee esa cosa.

### Resumen

- `App` es un `ConsumerWidget`: usa `WidgetRef ref` para leer providers y se reconstruye
  cuando `ref.watch` detecta cambios.
- `MaterialApp.router` se usa en vez de `MaterialApp(home:)` porque la navegación la maneja
  `go_router` con rutas, URLs y redirects.
- `onGenerateTitle` resuelve el nombre de la app después, cuando la localización ya está
  disponible.
- `debugShowCheckedModeBanner` se apaga en producción usando `AppConfig.isProd`, que se
  decide en tiempo de compilación.
- `theme`, `darkTheme` y `themeMode` separan "cómo se ve cada brillo" de "cuál está activo", y
  `BuildContext` es siempre la posición del widget en el árbol: de ahí se leen tema y textos.

## Rutas con go_router: app_routes y app_router

Una **ruta** es un destino de la app identificado por una dirección, como `/home` o
`/posts/3`. `go_router` toma una tabla de rutas, escucha la dirección actual y construye el
widget que corresponde. La navegación deja de ser "apilar pantallas" y pasa a ser "cambiar la
dirección": el mismo mecanismo sirve para un tap, para el botón atrás y para un link externo.

El proyecto separa la tabla en dos archivos: los nombres y las direcciones en `app_routes`, y
el router completo en `app_router`.

### Los nombres de las rutas

**Archivo:** `lib/app/router/app_routes.dart`

```dart
/// Type-safe route definitions.
///
/// Using an enum for route names avoids stringly-typed navigation bugs.
/// Reference routes as `AppRoute.posts.name` / `AppRoute.posts.path`.
enum AppRoute {
  login('/login'),
  home('/home'),
  counter('/home/counter'),
  components('/home/components'),
  posts('/posts'),
  postDetail('/posts/:id'),
  profile('/profile');

  const AppRoute(this.path);

  /// The URL path for this route.
  final String path;
}
```

Un **enum** es un tipo con un conjunto cerrado de valores. Acá cada valor es una ruta y cada
uno lleva asociada una dirección: `login('/login')` llama al constructor `const
AppRoute(this.path)`, que guarda `'/login'` en el campo `path`. `const` significa que ese
valor se arma al compilar, no en runtime.

La ventaja es que `AppRoute.counter` es un valor del tipo `AppRoute`: si escribís mal el
nombre, el editor te lo marca antes de ejecutar. Además, `.name` (una propiedad que todo enum
tiene) devuelve `'counter'`, y `.path` devuelve `'/home/counter'`. Las dos formas se usan: el
nombre como identificador del router y el path como dirección real.

Fijate en `counter('/home/counter')` y `components('/home/components')`: la dirección incluye
`/home` porque en la app viven debajo de la pantalla de inicio. En el router vas a ver que la
ruta anidada usa `'counter'` a secas. El enum guarda la dirección *completa* para que puedas
referenciarla desde cualquier lado; el router usa la parte *relativa* porque ya sabe que está
debajo de `/home`.

### El provider del router

**Archivo:** `lib/app/router/app_router.dart`

```dart
/// The app's [GoRouter], exposed as a provider so routing can depend on the
/// auth state (for redirects/guards) and be overridden in tests.
final routerProvider = Provider<GoRouter>((ref) {
  // Rebuild the redirect logic whenever auth state changes.
  final refresh = _AuthRefreshNotifier(ref);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: AppRoute.home.path,
    debugLogDiagnostics: kDebugMode,
    refreshListenable: refresh,
```

`routerProvider` es un `Provider<GoRouter>`: la primera vez que alguien lo lee crea el router,
y desde ahí devuelve el mismo objeto. Eso es clave, porque un router nuevo en cada rebuild
perdería el historial de navegación.

`_AuthRefreshNotifier` es un objeto que avisa cuando el estado de autenticación cambia.
`ref.onDispose(refresh.dispose)` lo libera cuando el provider muere, para no dejar listeners
colgados.

`GoRouter` recibe la configuración. `initialLocation` es la dirección con la que arranca la
app: `/home`. `debugLogDiagnostics` imprime cada navegación en la consola cuando estás en
debug. `refreshListenable` le dice a go_router a quién escuchar: cuando ese objeto notifica,
el router vuelve a evaluar el redirect. Sin eso, loguearte no te sacaría de la pantalla de
login hasta que navegues a mano.

### El redirect como guardia

**Archivo:** `lib/app/router/app_router.dart`

```dart
    redirect: (context, state) {
      final loggedIn = ref.read(authControllerProvider);
      final onLoginPage = state.matchedLocation == AppRoute.login.path;

      if (!loggedIn) return onLoginPage ? null : AppRoute.login.path;
      if (onLoginPage) return AppRoute.home.path;
      return null;
    },
```

`redirect` es una función que go_router llama en cada intento de navegación. Recibe el
contexto y el `state` de la navegación, y devuelve una dirección o `null`. Devolver una
dirección redirige; devolver `null` deja pasar.

`ref.read(authControllerProvider)` lee el estado de sesión una sola vez, sin suscribirse: no
queremos que el router se reconstruya por cada cambio, para eso está el notifier.
`state.matchedLocation` es la dirección efectivamente emparejada con alguna ruta.
`AppRoute.login.path` es `'/login'`.

Las tres líneas se leen así: si no hay sesión y no estás en login, mandá a login; si no hay
sesión y ya estás en login, dejá pasar; si hay sesión y estás en login, mandá a home; en
cualquier otro caso, dejá pasar. Es un guardia: la app no puede mostrar contenido privado sin
sesión, sin importar por qué dirección entraste.

Este proyecto no tiene autenticación real —`AuthController.build()` devuelve `false` y
`login()` solo pone `true`—, pero el mecanismo es el mismo que usarías con un backend de
verdad. Eso se cuenta en el capítulo de autenticación.

### La tabla de rutas y el shell

**Archivo:** `lib/app/router/app_router.dart`

```dart
    routes: [
      GoRoute(
        path: AppRoute.login.path,
        name: AppRoute.login.name,
        builder: (context, state) => const LoginPage(),
      ),
      // The tabbed app shell. Each branch keeps its own navigation stack.
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            ScaffoldWithNavBar(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoute.home.path,
                name: AppRoute.home.name,
                builder: (context, state) => const HomePage(),
```

`routes` es la tabla. Cada `GoRoute` tiene `path` (la dirección), `name` (el identificador
para navegar por nombre) y `builder`, una función que devuelve el widget de esa pantalla.
`builder` recibe `context` y `state` (la información de la navegación) y devuelve el widget.
Login está fuera del shell: no tiene barra de navegación, porque no tiene sentido moverse
entre pestañas antes de entrar.

Después viene el **shell**. Un shell es una ruta que envuelve a otras: su `builder` devuelve
un widget que contiene a las rutas hijas, y ese widget se mantiene montado mientras te movés
entre ellas. Acá se usa `StatefulShellRoute.indexedStack`, la variante de go_router pensada
para pestañas: cada `StatefulShellBranch` es una pestaña con su propio historial, y el shell
las muestra con un `IndexedStack`, que mantiene vivos todos los branches y solo cambia cuál
se ve. Resultado: si estás en `/posts` y te vas a Perfil, `/posts` no se destruye y volvés
donde estabas.

`ScaffoldWithNavBar(navigationShell: navigationShell)` es el widget que dibuja la barra
inferior; lo vas a leer entero en el capítulo siguiente. El shell no reemplaza a las páginas:
las *contiene*.

Las dos rutas hijas de home se declaran con `path: 'counter'` y `'components'`, sin barra
inicial, porque son relativas a `/home`. Su dirección final es `/home/counter`, la misma que
dice el enum.

### El parámetro de ruta

**Archivo:** `lib/app/router/app_router.dart`

```dart
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoute.posts.path,
                name: AppRoute.posts.name,
                builder: (context, state) => const PostsPage(),
                routes: [
                  GoRoute(
                    path: ':id',
                    name: AppRoute.postDetail.name,
                    builder: (context, state) {
                      final id = int.parse(state.pathParameters['id']!);
                      return PostDetailPage(postId: id);
                    },
                  ),
                ],
              ),
            ],
          ),
```

Un **parámetro de ruta** es un segmento de la dirección que captura un valor. El enum declara
`postDetail('/posts/:id')`; en el router la ruta hija usa `':id'`, porque su padre ya aporta
`/posts`. Cuando alguien navega a `/posts/7`, el router empareja y guarda `{'id': '7'}` en
`state.pathParameters`.

`state.pathParameters['id']!` saca el valor. Ojo: un path parameter siempre llega como string,
aunque en la dirección se vea un número. Por eso `int.parse` lo convierte. El `!` afirma que
la clave existe: si la ruta emparejó, existe. Con ese `int` se construye
`PostDetailPage(postId: id)`, y la página usa ese valor para pedir los datos de un post
concreto.

El último branch es el de perfil, una sola `GoRoute` con `ProfilePage`. Tres branches, tres
pestañas: Inicio, Posts y Perfil.

### Navegar desde un widget

**Archivo:** `lib/features/home/presentation/home_page.dart`

```dart
                _NavRow(
                  icon: Icons.add_circle_outline,
                  title: l10n.counterTitle,
                  subtitle: l10n.homeCounterSubtitle,
                  onTap: () => context.pushNamed(AppRoute.counter.name),
                ),
```

`context.pushNamed` es una extensión de go_router sobre `BuildContext`. Recibe el **nombre**
de la ruta —`AppRoute.counter.name`, o sea `'counter'`— y apila esa pantalla encima de la
actual. Como el nombre existe en la tabla, no hay strings sueltos que se puedan tipear mal: si
renombrás la ruta, el enum cambia y este código lo sigue.

`push` agrega una página nueva al historial, así que el botón atrás vuelve a la anterior.
Cuando querés *reemplazar* la dirección actual en vez de apilar, go_router tiene `go`; este
proyecto navega siempre con `pushNamed` desde las pantallas, y deja `goBranch` para el shell y
los redirects para el router.

**Archivo:** `lib/features/posts/presentation/pages/posts_page.dart`

```dart
                return PostTile(
                  post: post,
                  onTap: () => context.pushNamed(
                    AppRoute.postDetail.name,
                    pathParameters: {'id': '${post.id}'},
                  ),
                );
```

Cuando la ruta tiene parámetros, se pasan en `pathParameters` como un mapa. `'${post.id}'`
interpola el número del post y lo convierte en string, que es lo que la dirección necesita: no
estás pasando el objeto `Post`, estás pasando el identificador para que la ruta se pueda
escribir como `/posts/7`. La página de detalle después lo lee de `state.pathParameters` y
vuelve a convertirlo a `int`, como viste arriba. `context.push(...)` existe en go_router y
recibe una dirección armada a mano, pero este proyecto prefiere los nombres justamente para no
armar strings.

### El refresh y la página de error

**Archivo:** `lib/app/router/app_router.dart`

```dart
/// Bridges the Riverpod auth state to a [Listenable] that go_router can watch,
/// so navigation redirects re-run when the user logs in or out.
class _AuthRefreshNotifier extends ChangeNotifier {
  _AuthRefreshNotifier(Ref ref) {
    ref.listen(authControllerProvider, (_, _) => notifyListeners());
  }
}
```

`ChangeNotifier` es un objeto de Flutter que mantiene una lista de interesados y les avisa
cuando cambia. Es un `Listenable`, y por eso go_router lo acepta como `refreshListenable`.
`ref.listen(authControllerProvider, ...)` se suscribe al estado de sesión: cada vez que
cambia, el callback llama a `notifyListeners()`, go_router reevalúa el redirect y la
navegación se ajusta sola. Los dos guiones bajos son parámetros que no usamos: el valor
anterior y el nuevo.

Si la dirección no existe, el router usa `errorBuilder`, que arma una pantalla con un ícono y
el texto `context.l10n.routeNotFound(state.uri.toString())`: te muestra la dirección que
falló. Es la red de seguridad para links viejos o mal escritos.

### Resumen

- Un enum centraliza los nombres y las direcciones de las rutas, así la navegación no depende
  de strings sueltos.
- El `GoRouter` vive en un provider para que exista una sola instancia, se pueda testear y
  pueda depender del estado de sesión.
- `redirect` es el guardia: decide, en cada navegación, si pasás o si te manda a otra
  dirección.
- `StatefulShellRoute.indexedStack` mantiene la barra inferior y conserva el historial de
  cada pestaña.
- Los parámetros de ruta (`:id`) viajan como string en `pathParameters` y la página los
  convierte; se navega con `context.pushNamed` y `pathParameters`.

## Tu primer widget propio: counter_page

Hasta acá leíste archivos que arman el esqueleto. Ahora sí: una pantalla completa, escrita a
mano, con estado. `CounterPage` es el ejemplo más chico posible de un widget propio y tiene
todo lo que vas a repetir mil veces: una clase, un `build`, un `Scaffold`, una barra de
título, un layout y un par de botones.

### La clase del widget

**Archivo:** `lib/features/counter/presentation/counter_page.dart`

```dart
import 'package:example_app/core/theme/app_colors.dart';
import 'package:example_app/core/theme/app_spacing.dart';
import 'package:example_app/core/widgets/gap.dart';
import 'package:example_app/features/counter/presentation/counter_controller.dart';
import 'package:example_app/l10n/l10n.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Example screen driven by a synchronous [CounterController].
///
/// The number is set in display type and takes the accent — the one place on
/// this screen where colour is allowed, because it is the content.
class CounterPage extends ConsumerWidget {
  const CounterPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final palette = context.palette;
    final theme = Theme.of(context);
    final count = ref.watch(counterProvider);
    final controller = ref.read(counterProvider.notifier);
```

`app_colors.dart` aporta la extensión `context.palette`, el objeto con los colores del tema
activo. `app_spacing.dart` aporta las constantes de espaciado. `gap.dart` aporta el widget
`Gap`. El import del `counter_controller` trae el provider con el estado. `l10n.dart` trae
`context.l10n`. Y `flutter/material.dart` trae `Scaffold`, `AppBar`, `Text`, `IconButton` y
todo el resto de Material.

`CounterPage` es un `ConsumerWidget` por la misma razón que `App`: necesita leer un provider.
El constructor es `const` y recibe `super.key`.

Dentro de `build` hay cinco líneas de preparación. Las tres primeras sacan cosas del contexto
una sola vez: `context.l10n` (los textos traducidos), `context.palette` (los colores) y
`Theme.of(context)` (el `ThemeData` completo, con su escala tipográfica). Leerlos una vez y
guardarlos en locales es más prolijo y más barato que escribirlos en cada widget hijo.

`ref.watch(counterProvider)` devuelve el número actual y **suscribe** la pantalla: cuando el
número cambia, `build` se ejecuta de nuevo y la pantalla se redibuja. `ref.read(
counterProvider.notifier)` devuelve el controlador, el objeto con los métodos. `watch` para
leer el valor, `read` para obtener el objeto que ejecuta acciones: esa es la dupla que vas a
usar siempre.

### Scaffold, AppBar y el layout

**Archivo:** `lib/features/counter/presentation/counter_page.dart`

```dart
    return Scaffold(
      appBar: AppBar(title: Text(l10n.counterTitle)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                '$count',
                style: theme.textTheme.displayLarge?.copyWith(
                  color: palette.accent,
                ),
              ),
              const Gap(AppSpacing.sm),
              Text(
                l10n.counterValue(count),
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: palette.textMuted,
                ),
              ),
              const Gap(AppSpacing.xl),
```

`Scaffold` es el esqueleto de una pantalla Material: tiene lugares con nombre para la barra
superior, el cuerpo, la barra inferior, los botones flotantes. Acá se usan dos: `appBar` y
`body`.

`AppBar(title: Text(l10n.counterTitle))` es la barra de arriba, con el título "Contador"
(`counterTitle` viene del archivo de traducciones) envuelto en un `Text`. Todo texto visible
es un widget `Text`.

El `body` es una cadena de widgets que se envuelven unos a otros. `Center` centra a su hijo en
el espacio disponible. `Padding` le agrega margen: `EdgeInsets.all(AppSpacing.lg)` dice "todos
los lados, tamaño grande", y `AppSpacing.lg` es una constante del sistema de espaciado, no un
número mágico. `Column` apila a sus hijos en vertical, y `mainAxisAlignment:
MainAxisAlignment.center` los centra en el eje principal.

`Text('$count', ...)` es el número en grande. `'$count'` interpola el entero dentro de un
string, porque `Text` recibe texto. `style: theme.textTheme.displayLarge?.copyWith(color:
palette.accent)` toma el estilo tipográfico más grande de la escala y le cambia solo el color
al acento de la marca; el `?.` es porque `displayLarge` podría no estar definido en el tema.

Después viene un `Text` más chico con `l10n.counterValue(count)`, que arma la frase con el
número adentro, y `Gap`, que es un widget del propio proyecto para separar verticalmente
(`Gap` con un número) u horizontalmente (`Gap.h`). Un `Gap` es más legible que un `SizedBox`
suelto: dice explícitamente "esto es aire".

### Los botones

**Archivo:** `lib/features/counter/presentation/counter_page.dart`

```dart
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton.outlined(
                    onPressed: controller.decrement,
                    tooltip: l10n.counterDecrement,
                    icon: const Icon(Icons.remove),
                  ),
                  const Gap.h(AppSpacing.md),
                  IconButton.outlined(
                    onPressed: controller.reset,
                    tooltip: l10n.counterReset,
                    icon: const Icon(Icons.refresh),
                  ),
                  const Gap.h(AppSpacing.md),
                  IconButton.filled(
                    onPressed: controller.increment,
                    tooltip: l10n.counterIncrement,
                    icon: const Icon(Icons.add),
                  ),
                ],
              ),
```

`Row` es el equivalente horizontal de `Column`: pone a sus hijos uno al lado del otro,
centrados. Los separadores son `Gap.h`, o sea `Gap` horizontal.

`IconButton.outlined` es un botón redondo con borde y un ícono adentro; `IconButton.filled` es
el mismo botón pero relleno con el color principal, y por eso es el único "lleno": sumar es la
acción principal de la pantalla. `Icons.remove`, `Icons.refresh` e `Icons.add` son íconos que
vienen con Material.

`onPressed` es la función que se ejecuta cuando el usuario toca. Acá no escribimos
`() => controller.increment()` sino `controller.increment`: es un *method tear-off*, la
referencia al método tal cual. Da lo mismo en resultado y deja más claro que el botón no hace
nada más que llamar al método. Y `tooltip` es el texto que aparece al mantener presionado:
sirve como descripción para lectores de pantalla, así que también es localizado.

### De dónde sale el estado

`count` no vive en la página. Vive en un controller, y la página solo lo dibuja. Mirá el
archivo que lo define.

**Archivo:** `lib/features/counter/presentation/counter_controller.dart`

```dart
class CounterController extends Notifier<int> {
  @override
  int build() => 0;

  void increment() => state++;
  void decrement() => state = state > 0 ? state - 1 : 0;
  void reset() => state = 0;
}

final counterProvider = NotifierProvider<CounterController, int>(
  CounterController.new,
);
```

`CounterController` es un `Notifier<int>`: un objeto que guarda un valor de tipo `int` y avisa
cuando cambia. `build()` devuelve el valor inicial, `0`. `state` es el valor actual: leerlo da
el número, asignarlo lo cambia y notifica a quien esté mirando. `decrement` nunca baja de
cero, por eso el `state > 0 ? ... : 0`.

`counterProvider` es el `NotifierProvider` que conecta el controller con el árbol de widgets.
Una página `watch`ea el provider y recibe el `int`; para llamar métodos pide `.notifier`. Por
eso la misma página hace las dos lecturas que viste. Los detalles de Riverpod están en el
capítulo de estado; acá alcanza con entender el reparto: la página describe la interfaz, el
controller decide los números.

### La barra que envuelve todas las pestañas

`CounterPage` tiene su propio `Scaffold` con su `AppBar`, pero no dibuja la barra inferior.
Esa barra es del shell y se mantiene mientras navegás entre pestañas.

**Archivo:** `lib/features/shell/presentation/scaffold_with_nav_bar.dart`

```dart
class ScaffoldWithNavBar extends StatelessWidget {
  const ScaffoldWithNavBar({required this.navigationShell, super.key});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: context.palette.bgElevated,
          border: Border(top: BorderSide(color: context.palette.border)),
        ),
        child: NavigationBar(
          selectedIndex: navigationShell.currentIndex,
          onDestinationSelected: _onDestinationSelected,
```

Este widget es un `StatelessWidget` (no necesita providers, solo lee tema y textos del
contexto) y recibe un `StatefulNavigationShell`, que es el objeto que go_router le pasa al
shell: sabe cuál es el branch actual y cómo cambiar de branch.

Su `Scaffold` tiene un solo trabajo. `body: navigationShell` dibuja el contenido del branch
activo; `bottomNavigationBar` dibuja la barra inferior. El `Container` con `BoxDecoration` le
pone fondo elevado y una línea de un píxel arriba, la *hairline* del sistema de diseño, en
lugar de una sombra.

`NavigationBar` es la barra de Material 3. `selectedIndex` marca qué pestaña está activa
(`navigationShell.currentIndex` la conoce) y `onDestinationSelected` recibe el índice que el
usuario tocó. `destinations` es la lista de botones: cada `NavigationDestination` tiene un
`icon` para el estado normal, un `selectedIcon` para el activo y un `label` traducido.

**Archivo:** `lib/features/shell/presentation/scaffold_with_nav_bar.dart`

```dart
  void _onDestinationSelected(int index) {
    // `initialLocation: true` re-selecting the current tab pops it to its root.
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }
```

`goBranch` cambia de branch. El truco está en el segundo argumento: si tocás la pestaña en la
que ya estás, `index == currentIndex` da `true` y `initialLocation: true` te devuelve al
principio de esa pestaña (el gesto que todo el mundo espera); si tocás otra pestaña, da
`false` y te lleva al lugar donde la habías dejado.

### Cómo se llega al contador

El contador no está en la barra inferior. Se entra desde Inicio, con una fila de navegación.

**Archivo:** `lib/features/home/presentation/home_page.dart`

```dart
          AppCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                _NavRow(
                  icon: Icons.add_circle_outline,
                  title: l10n.counterTitle,
                  subtitle: l10n.homeCounterSubtitle,
                  onTap: () => context.pushNamed(AppRoute.counter.name),
                ),
                const Hairline(indent: AppSpacing.md, endIndent: AppSpacing.md),
                _NavRow(
                  icon: Icons.widgets_outlined,
                  title: l10n.componentsTitle,
                  subtitle: l10n.homeComponentsSubtitle,
                  onTap: () => context.pushNamed(AppRoute.components.name),
                ),
```

`AppCard` es una tarjeta del sistema de diseño; `padding: EdgeInsets.zero` la deja sin margen
interno para que las filas lleguen al borde. `Column` apila dos `_NavRow` con una `Hairline`
en el medio, que es la línea divisoria.

`_NavRow` empieza con guion bajo: es una clase privada del archivo, definida más abajo en el
mismo `home_page.dart`. No es un widget de la librería ni algo reutilizable: es la fila de
esta pantalla y de ninguna otra. El `onTap` usa `context.pushNamed` con el nombre del enum, y
el nombre está registrado en el router, así que la fila no sabe qué pantalla abre, solo a
dónde va.

**Archivo:** `lib/features/home/presentation/home_page.dart`

```dart
    return InkWell(
      onTap: onTap,
      overlayColor: WidgetStatePropertyAll<Color?>(palette.accentSoft),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Row(
          children: [
            AppIconBox(icon: icon),
            const Gap.h(AppSpacing.md),
            Expanded(
              child: Column(
```

`InkWell` es la zona táctil: detecta el tap y avisa con `onTap`. `overlayColor` define el
color que aparece al presionar. Adentro un `Padding`, después un `Row`, después un
`AppIconBox` con el ícono, un espacio y un `Expanded`. `Expanded` es importante: le dice al
`Column` de texto "ocupá todo el ancho que sobre", así el chevron de la derecha queda pegado
al borde y los títulos largos no desbordan.

Cuando tocás esa fila, el router apila `/home/counter`. Como esa ruta está dentro del branch
de Inicio, la barra inferior sigue visible y el botón atrás vuelve a Inicio. Por eso la
pantalla puede tener su propio `AppBar` "Contador" y la barra de pestañas no desaparece: son
dos `Scaffold` anidados, uno del shell y uno de la página.

### Resumen

- Un widget propio es una clase con `build` que devuelve otros widgets; `ConsumerWidget`
  agrega `WidgetRef ref` para leer providers.
- En una página Riverpod se escribe `ref.watch` para el valor y `ref.read(...notifier)` para
  el objeto con los métodos.
- `Scaffold` ordena la pantalla, `AppBar` es la barra de título y `Center`, `Padding`,
  `Column` y `Row` arman el layout.
- Los textos y colores se leen del contexto (`context.l10n`, `context.palette`, `Theme.of`) y
  el espaciado sale de constantes, no de números sueltos.
- `ScaffoldWithNavBar` es el shell con la barra inferior; las páginas viven dentro y navegan
  con `context.pushNamed`, por eso volver atrás las deja donde estaban.


## Estado con Riverpod: counter_controller y el Notifier

Un widget, en Flutter, es una descripción: dice cómo se ve un pedazo de pantalla en un
momento dado. Flutter toma esa descripción, la convierte en píxeles y la vuelve a ejecutar
cuando algo cambia. Pero un widget no puede cambiar sus propios datos, porque es inmutable:
una vez creado, no se lo modifica. Entonces aparece la pregunta de este capítulo: si el
widget no puede guardar el número del contador, ¿dónde vive ese número?

La respuesta corta es "en el estado". La respuesta útil es entender quién lo guarda, quién
lo puede cambiar y quién se entera del cambio. En example_app eso lo resuelve Riverpod, un
paquete de Dart (una librería externa, que se declara en `pubspec.yaml`) que administra el
estado de la app. No es parte de Flutter: es una pieza que el proyecto eligió sumar.

### Qué es el estado

Estado es todo dato que cambia con el tiempo y que la pantalla tiene que mostrar. En el
contador es un número entero. En la pantalla de login es "hay sesión o no". En la lista de
posts es la lista, el indicador de carga y el mensaje de error. Si un dato puede cambiar y
eso afecta lo que ves, es estado. Si es fijo —el texto de un título, un ícono— no lo es.

La clave es que el estado no es la pantalla: es la información que la pantalla representa.
Esa distinción parece filosofía hasta que la app crece, y ahí se vuelve la diferencia entre
un proyecto mantenible y uno donde nadie sabe de dónde salió un número.

### Por qué no alcanza con que el widget se redibuje solo

Flutter tiene una herramienta básica para esto: un widget con estado propio. Se llama
`StatefulWidget` y su método `setState` avisa "cambiaron mis datos, volvé a dibujarme". Con
eso alcanza para cosas chiquitas y locales: si el mouse está encima de una tarjeta, si un
campo de texto está mostrando la contraseña. Lo vas a ver en acción en "Widgets
reutilizables: componer en vez de repetir", donde `AppCard` usa `setState` para el hover.

El contador es otro caso. La regla "nunca baja de cero" no es una regla de dibujo: es una
regla del dato. Si vive dentro del botón o de la página, queda mezclada con la UI y no hay
forma de probarla sin construir la pantalla entera. Además, el estado de un `StatefulWidget`
vive y muere con ese widget: si el widget se destruye y se vuelve a crear, el número se
pierde.

Riverpod propone lo contrario: el dato vive afuera, en un objeto con nombre, y las pantallas
lo miran. Quien lo cambia es el dueño del dato, no el botón. Así la regla se puede probar
sola —de hecho el propio archivo del contador dice que es "trivial de testear"— y la
pantalla queda reducida a dibujar y avisar.

### El vocabulario de Riverpod

Antes de leer código, cinco palabras que vas a ver todo el tiempo:

- **Provider**: un objeto que sabe cómo producir un valor y lo guarda en memoria. Es la
  fuente de verdad de algo. Cuando alguien lo pide, lo crea (o devuelve el que ya tenía).
- **Notifier**: una clase que contiene el estado y expone métodos con nombres claros para
  cambiarlo (`increment`, `reset`). Es el "dueño" del dato.
- **NotifierProvider**: la pieza que une las dos anteriores. Sabe qué `Notifier` crear y de
  qué tipo es el estado que ese notifier publica.
- **`ref.watch`**: "me suscribo". Devuelve el valor actual y, cuando cambia, el widget se
  vuelve a construir. Se usa para leer lo que se dibuja.
- **`ref.read`**: "leé esto una vez y no me avises de nada". Se usa dentro de una acción
  —un `onPressed`— para pedir el notifier y llamarle un método.
- **`state`**: dentro del `Notifier`, el valor actual. Asignarle algo nuevo es lo que
  dispara el aviso a todos los que están mirando.

### El controlador del contador

**Archivo:** `lib/features/counter/presentation/counter_controller.dart`

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// A minimal synchronous state controller.
///
/// Demonstrates the simplest Riverpod pattern — a [Notifier] holding a value
/// with intention-revealing methods. Because it has no dependencies, it is
/// trivial to unit test (see `test/features/counter/`).
class CounterController extends Notifier<int> {
  @override
  int build() => 0;

  void increment() => state++;
  void decrement() => state = state > 0 ? state - 1 : 0;
  void reset() => state = 0;
}

final counterProvider = NotifierProvider<CounterController, int>(
  CounterController.new,
);
```

Es el archivo más corto de la app y, aun así, tiene todo el patrón. Vamos línea por línea.

`import 'package:flutter_riverpod/flutter_riverpod.dart';` trae las clases de Riverpod.
`Notifier`, `NotifierProvider` y `ref` vienen de ahí, no de Flutter.

El bloque que empieza con `///` es documentación: en Dart, tres barras seguidas generan
documentación del elemento que viene abajo (el editor la muestra al pasar el mouse). Sirve
para explicar la intención, y acá la intención es buena: "un controlador sincrónico mínimo",
"métodos que revelan la intención", "sin dependencias, por eso es trivial de testear".

`class CounterController extends Notifier<int>` define una clase que hereda de
`Notifier<int>`. `extends` significa "hereda de": `CounterController` es un `Notifier`
especializado. El `<int>` es un parámetro de tipo: dice que el estado que este notifier
publica es un `int` (un número entero). Si fuera un texto, sería `Notifier<String>`.

`@override` marca que el método que sigue reemplaza a uno que ya existe en la clase padre.
No es decoración: si te equivocás en el nombre o en la firma, el compilador te avisa.

`int build() => 0;` es el método que Riverpod llama la primera vez que alguien pide el
provider. Devuelve el estado inicial, `0`. La flecha `=>` es azúcar para "devuelve esto":
equivale a `{ return 0; }`. El `build` corre una sola vez por instancia; después el valor
vive en `state`.

`void increment() => state++;` es el método que el usuario dispara al tocar el botón más.
`state++` lee el número actual, le suma uno y lo vuelve a asignar. Esa asignación es lo que
avisa a todo el mundo que algo cambió. `void` significa que no devuelve nada.

`void decrement() => state = state > 0 ? state - 1 : 0;` tiene la regla de negocio del
contador: resta uno solo si el valor es mayor que cero; si ya está en cero, lo deja en cero.
`condición ? a : b` es el operador ternario: si la condición se cumple, devuelve `a`; si no,
`b`. Podrías haber escrito `state--` y aceptar negativos, pero el proyecto decidió que el
contador no baja de cero. Esa decisión está en un solo lugar y es fácil de probar.

`void reset() => state = 0;` vuelve al inicio. Tres métodos, tres acciones, y ni una línea de
diseño: este archivo no sabe que existe una pantalla.

Al final, `final counterProvider = NotifierProvider<CounterController, int>(` y
`CounterController.new, );` —una sola declaración partida en dos líneas— crean el provider.
`final` significa que la variable se asigna una sola vez. `NotifierProvider<CounterController, int>`
tiene dos tipos: quién administra (el notifier) y qué estado publica (`int`). El argumento
`CounterController.new` es una referencia al constructor: no lo llama, le pasa la receta para que
Riverpod lo construya cuando haga falta.

### El provider de infraestructura

Los providers no son solo para contadores. En el mismo proyecto, `core_providers.dart`
declara los objetos que atraviesan toda la app: el cliente HTTP, el almacenamiento.

**Archivo:** `lib/core/providers/core_providers.dart`

```dart
/// The shared [Dio] HTTP client.
final dioProvider = Provider<Dio>((ref) {
  final dio = DioClient.create();
  ref.onDispose(dio.close);
  return dio;
});

/// Non-sensitive key/value storage.
///
/// Overridden in [main] with a resolved async instance so the rest of the
/// app can depend on it synchronously.
final keyValueStoreProvider = Provider<KeyValueStore>((ref) {
  throw UnimplementedError(
    'keyValueStoreProvider must be overridden in main() with '
    'SharedPreferencesStore.create().',
  );
});
```

Acá aparece `Provider`, el primo simple de `NotifierProvider`: un provider que produce un
valor y no tiene métodos para cambiarlo. `Provider<Dio>((ref) { ... })` recibe una función
que recibe `ref` (la misma herramienta de antes, acá del lado del provider) y devuelve el
valor. `ref.onDispose(dio.close)` registra una limpieza: cuando el provider se destruye, se
cierra el cliente HTTP. Nadie tiene que acordarse de cerrarlo a mano.

El segundo provider es un truco muy útil: declara el tipo y, si nadie lo reemplaza, falla a
propósito con un mensaje que dice exactamente qué hacer. `UnimplementedError` es una
excepción de Dart. Un provider así se llama "requiere override": se declara para que todos
puedan depender de él, y se completa desde afuera. Vas a ver ese reemplazo en "Tema claro y
oscuro, y cómo se recuerda", cuando `bootstrap.dart` inyecte el almacenamiento real.

### La página que lo consume

Ahora sí, la pantalla. Fijate cómo se lee: primero pide los datos, después los dibuja.

**Archivo:** `lib/features/counter/presentation/counter_page.dart`

```dart
class CounterPage extends ConsumerWidget {
  const CounterPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final palette = context.palette;
    final theme = Theme.of(context);
    final count = ref.watch(counterProvider);
    final controller = ref.read(counterProvider.notifier);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.counterTitle)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                '$count',
                style: theme.textTheme.displayLarge?.copyWith(
                  color: palette.accent,
                ),
              ),
```

`class CounterPage extends ConsumerWidget` es la versión Riverpod de un widget sin estado:
`ConsumerWidget` es un `StatelessWidget` que además sabe leer providers. Por eso su `build`
tiene dos parámetros: `BuildContext context` (la ubicación del widget en el árbol, con acceso
al tema y a la localización) y `WidgetRef ref` (el acceso a los providers).

`const CounterPage({super.key});` es el constructor. `const` permite que el widget se cree
una sola vez en tiempo de compilación; `{super.key}` pasa la `key` al padre. Las `key` y los
constructores se explican en detalle en "Widgets reutilizables: componer en vez de repetir".

Las tres primeras líneas del cuerpo son lecturas de contexto: `context.l10n` trae los textos
traducidos, `context.palette` trae los colores del sistema de diseño y `Theme.of(context)`
trae el tema completo, del que después sale la tipografía.

Después vienen las dos líneas importantes:

`final count = ref.watch(counterProvider);` se suscribe al provider y recibe el `int` actual.
Cuando el notifier cambie el número, esta página se vuelve a construir sola y `count` llega
con el valor nuevo. No hay `setState`: nadie avisa a mano.

`final controller = ref.read(counterProvider.notifier);` pide el notifier en vez del valor.
`.notifier` es un acceso extra que expone el objeto `CounterController`. Se usa `read` y no
`watch` porque acá no nos interesa reconstruir la página cuando el notifier cambia: solo
queremos sus métodos para los botones.

El resto es composición de widgets: `Scaffold` es el esqueleto de una pantalla (barra
superior, cuerpo), `AppBar` es la barra, `Center` centra a su hijo, `Padding` agrega aire
alrededor y `Column` apila hijos en vertical. El `Text` grande muestra `'$count'` —las
comillas simples con `$` interpolan el valor dentro del texto— y le aplica el estilo
`displayLarge` del tema, cambiándole solo el color por el acento de la paleta.

Y los botones:

**Archivo:** `lib/features/counter/presentation/counter_page.dart`

```dart
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton.outlined(
                    onPressed: controller.decrement,
                    tooltip: l10n.counterDecrement,
                    icon: const Icon(Icons.remove),
                  ),
                  const Gap.h(AppSpacing.md),
                  IconButton.outlined(
                    onPressed: controller.reset,
                    tooltip: l10n.counterReset,
                    icon: const Icon(Icons.refresh),
                  ),
                  const Gap.h(AppSpacing.md),
                  IconButton.filled(
                    onPressed: controller.increment,
                    tooltip: l10n.counterIncrement,
                    icon: const Icon(Icons.add),
                  ),
                ],
              ),
```

`Row` es el equivalente horizontal de `Column`. `mainAxisAlignment: MainAxisAlignment.center`
centra el grupo de botones en el ancho disponible. Los `Gap.h(AppSpacing.md)` son separadores
horizontales del sistema de diseño; los vas a conocer en "El sistema de diseño: colores,
tipografía y espaciado".

Cada botón es un `IconButton` de Material con una variante (`outlined`, `filled`) y tres
datos: qué hacer (`onPressed`), qué dice el tooltip (el texto que aparece al mantener
apretado, y que también leen los lectores de pantalla) y qué ícono mostrar. Los textos salen
de `l10n`, nunca están escritos a mano.

Fijate en un detalle que confunde al principio: `onPressed: controller.increment` pasa la
función, no el resultado. Si escribieras `controller.increment()`, la llamarías en el momento
de dibujar, una vez por reconstrucción, y el botón quedaría sin acción. Pasar el nombre sin
paréntesis es pasar "qué hacer cuando me toquen".

### La diferencia con setState, en palabras simples

Con `setState` el widget dice: "yo guardo el dato, y cuando lo cambio me aviso a mí mismo y a
mis hijos". Funciona, es simple y es la herramienta correcta para estado que solo le importa
a ese widget y que puede desaparecer: si el mouse está encima, si el panel está abierto.

Con Riverpod el dato dice: "yo vivo acá afuera, tengo nombre, y cualquiera que me mire se
entera de mis cambios". Sirve cuando el dato importa más allá de un widget, cuando tiene
reglas que querés probar sin pantalla, o cuando querés reemplazarlo en un test por uno falso.

En example_app conviven los dos, y esa convivencia es la señal de que el criterio está bien
aplicado: `CounterPage` no tiene estado propio, y `AppCard` sí, porque el hover es un detalle
visual que a nadie más le importa.

### Resumen

- El estado es el dato que cambia y que la pantalla muestra; los widgets son descripciones
  inmutables y no pueden guardarlo ellos mismos.
- `Notifier` contiene el estado y expone métodos con nombres claros; `NotifierProvider` une
  el notifier con el tipo de estado que publica.
- `ref.watch` se suscribe y reconstruye el widget cuando el valor cambia; `ref.read` lee una
  vez y se usa para llamar métodos, no para dibujar.
- Dentro del notifier, `state` es el valor actual y asignarle algo es lo que notifica a todos
  los que están mirando.
- `setState` es para estado local y efímero; un provider es para el dato que tiene reglas
  propias y que conviene poder probar sin construir la pantalla.

## El sistema de diseño: colores, tipografía y espaciado

Un sistema de diseño es un conjunto de decisiones tomadas una vez y usadas en todos lados:
qué colores existen, qué tamaños de texto hay, cuánto aire va entre las cosas. En código, esas
decisiones se guardan en **tokens**: valores con nombre, en un solo archivo, que el resto del
proyecto usa en vez de escribir el número o el color a mano.

Este capítulo lee los tres archivos de tokens de example_app. No hacen falta conocimientos
previos de diseño: alcanza con entender por qué repetir `Color(0xFF4C5FD5)` cuarenta veces es
un problema.

### Por qué no hardcodear colores ni `SizedBox(height: 12)`

Escribir un valor literal en el lugar donde se usa se llama **hardcodear** —del inglés
*hardcode*, "clavado en el código"—. Es lo más rápido la primera vez y lo más caro después.
Estos son los motivos concretos, con ejemplos de este proyecto:

- **Cambiar una decisión se vuelve una búsqueda.** Si el acento de la marca cambia, querés
  tocar un archivo, no cuarenta. Y si te olvidás uno, la app queda con dos azules distintos.
- **No hay modo oscuro posible.** Un color fijo no sabe que existe un tema claro y uno
  oscuro. Este proyecto tiene los dos, así que cada color necesita dos versiones con nombre.
- **La accesibilidad se pierde.** Que un texto se lea sobre su fondo (contraste suficiente)
  es una propiedad del par "color de texto + color de fondo", no de un color suelto. Tener la
  paleta junta permite verificarla; tenerla desperdigada, no.
- **Los números mágicos no significan nada.** `SizedBox(height: 12)` no dice si es un
  espaciado chico, mediano o un error. `Gap(AppSpacing.md)` sí.
- **No se puede rediseñar en serio.** Un sistema visual vive de la repetición consistente: la
  misma escala, los mismos radios, el mismo aire. La consistencia no se logra a mano.

### La paleta: colores con nombre semántico

**Archivo:** `lib/core/theme/app_colors.dart`

```dart
/// The semantic colour tokens of the example_app design language.
///
/// "Minimal editorial dual": near-neutral surfaces, hairline borders instead of
/// shadows, and a single accent used surgically. The palette is hand-picked and
/// deliberately **not** derived from a seed colour, so both brightnesses stay
/// exactly on brand.
///
/// Every foreground/background pair in [light] and [dark] passes WCAG AA
/// (>= 4.5:1) against its own surface.
@immutable
class AppPalette extends ThemeExtension<AppPalette> {
```

`semantic colour tokens` quiere decir "colores con nombre que describen un rol, no una
apariencia": `bgElevated` (superficie elevada), `textMuted` (texto secundario), `danger`
(error). Si mañana el violeta pasa a verde, el nombre sigue sirviendo.

`@immutable` es una anotación: le dice a las herramientas que las instancias de esta clase no
cambian después de crearse. Todos sus campos son `final`, así que el compilador lo puede
verificar.

`extends ThemeExtension<AppPalette>` es la parte interesante. `ThemeExtension` es el
mecanismo de Flutter para agregar tus propios datos al tema: el tema de Material ya trae
colores, tipografía y formas, y esto permite sumarle una paleta propia sin pelear con la
existente. Por eso después se puede pedir `context.palette` desde cualquier widget.

La documentación también dice dos cosas que conviene retener: los pares texto/fondo pasan
**WCAG AA** (una norma de accesibilidad que pide contraste mínimo de 4.5:1) y la paleta **no**
se deriva de un color semilla, se eligió a mano. Es una decisión de diseño explícita.

Los campos son todos del mismo tipo:

**Archivo:** `lib/core/theme/app_colors.dart`

```dart
  /// Screen background.
  final Color bgBase;

  /// Cards and elevated surfaces.
  final Color bgElevated;

  /// Inputs and recessed rails.
  final Color bgInset;

  /// Chips, icon boxes and inactive tracks.
  final Color bgMuted;
```

Cada `final Color` es un campo que no se puede reasignar. `Color` es el tipo de Flutter para
un color. Y fijate que el comentario no dice "gris clarito": dice para qué se usa. Eso es lo
que convierte una lista de colores en un sistema.

Después vienen las dos instancias reales, una por brillo:

**Archivo:** `lib/core/theme/app_colors.dart`

```dart
  /// Light palette.
  static const AppPalette light = AppPalette(
    bgBase: Color(0xFFFAFAF8),
    bgElevated: Color(0xFFFFFFFF),
    bgInset: Color(0xFFF2F2F0),
    bgMuted: Color(0xFFECECE9),
    border: Color(0x1416161A),
    borderStrong: Color(0x2916161A),
    accent: Color(0xFF4C5FD5),
    accentStrong: Color(0xFF3B4CC0),
    accentSoft: Color(0x144C5FD5),
    onAccent: Color(0xFFFFFFFF),
    textPrimary: Color(0xFF16161A),
    textMuted: Color(0xFF555555),
    textFaint: Color(0xFF6B6B6B),
    success: Color(0xFF1A7F4E),
    danger: Color(0xFFB42318),
    warning: Color(0xFFB45309),
    info: Color(0xFF1D4ED8),
    overlayShadow: Color(0x14000000),
  );
```

`static const` significa que la instancia pertenece a la clase (no a un objeto) y que se crea
en tiempo de compilación. Hay una sola paleta clara en toda la app.

`Color(0xFFFAFAF8)` se escribe en hexadecimal con ocho dígitos: los dos primeros son la
opacidad (alfa) y los seis siguientes el color, en formato rojo-verde-azul. `0xFF` es opaco
total. Por eso `border: Color(0x1416161A)` es un gris casi negro con muy poca opacidad
(`0x14` es 20 de 255): un borde finito, no una línea dura.

`accentSoft: Color(0x144C5FD5)` es el mismo acento con alfa bajo: sirve para fondos de
selección y para el overlay que reemplaza al efecto de onda de Material.

La paleta oscura no es la clara invertida:

**Archivo:** `lib/core/theme/app_colors.dart`

```dart
  /// Dark palette. The accent flips to a light indigo, so text on top of it
  /// must be near-black instead of white.
  static const AppPalette dark = AppPalette(
    bgBase: Color(0xFF121316),
    bgElevated: Color(0xFF17181C),
    bgInset: Color(0xFF0D0E11),
    bgMuted: Color(0xFF1E2025),
    border: Color(0x1FE9E9EC),
    borderStrong: Color(0x3DE9E9EC),
    accent: Color(0xFF8E9BFF),
    accentStrong: Color(0xFFA9B3FF),
    accentSoft: Color(0x248E9BFF),
    onAccent: Color(0xFF12131A),
    textPrimary: Color(0xFFE9E9EC),
    textMuted: Color(0xFFA8AAB3),
    textFaint: Color(0xFF8A8C96),
    success: Color(0xFF4ADE80),
    danger: Color(0xFFFF8A80),
    warning: Color(0xFFFBBF24),
    info: Color(0xFF93C5FD),
    overlayShadow: Color(0x80000000),
  );
```

Los fondos pasan a casi negro, los textos a gris claro, y el acento cambia a un índigo claro
para que se vea sobre fondo oscuro. Consecuencia que el comentario señala: como el acento
ahora es claro, el texto que va encima (`onAccent`) tiene que ser casi negro, no blanco. Ese
tipo de detalle es exactamente lo que se pierde cuando cada pantalla elige sus colores, y es lo
que resuelve el mecanismo de Tema claro y oscuro, y cómo se recuerda.

Y así se lee la paleta desde un widget:

**Archivo:** `lib/core/theme/app_colors.dart`

```dart
extension AppPaletteX on BuildContext {
  /// The semantic tokens for the current brightness.
  AppPalette get palette {
    final palette = Theme.of(this).extension<AppPalette>();
    assert(
      palette != null,
      'AppPalette is missing from the ambient ThemeData. Build this widget '
      'under AppTheme.light() or AppTheme.dark() (see lib/app/app.dart).',
    );
    return palette ??
        (Theme.of(this).brightness == Brightness.dark
            ? AppPalette.dark
            : AppPalette.light);
  }
}
```

Una `extension` es una funcionalidad de Dart que agrega miembros a un tipo que ya existe, sin
modificarlo. Acá le agrega la propiedad `palette` a `BuildContext`, así que en cualquier
widget se escribe `context.palette` y listo.

`Theme.of(this).extension<AppPalette>()` busca la paleta dentro del tema actual. `assert`
verifica en modo debug: si falta, te tira un mensaje que dice qué hacer. En release no
crashea: cae en `AppPalette.light` o `AppPalette.dark` según el brillo. Es una decisión de
robustez, no de prolijidad.

### La escala tipográfica

**Archivo:** `lib/core/theme/app_typography.dart`

```dart
/// The explicit type scale of the example_app design language.
///
/// The platform system font is used on purpose: no font assets, no
/// `google_fonts`, no network fetch at runtime. Hierarchy comes from size,
/// weight and tracking, never from a second family or from gradient fills.
///
/// Flutter's `letterSpacing` is an absolute logical-pixel value, so the design
/// tokens are expressed as `em x fontSize`.
abstract final class AppTypography {
  /// Builds the complete [TextTheme] for [scheme].
  static TextTheme textTheme(ColorScheme scheme) => TextTheme(
    displayLarge: TextStyle(
      fontSize: 44,
      fontWeight: FontWeight.w700,
      letterSpacing: -1.32,
      height: 1.15,
      color: scheme.onSurface,
    ),
```

Una **escala tipográfica** es la lista cerrada de tamaños de texto que la app puede usar. Acá
hay quince estilos, agrupados como Material los nombra: `display` (los números enormes),
`headline` (títulos de pantalla), `title` (títulos de sección), `body` (texto corriente),
`label` (botones y etiquetas).

`abstract final class` es una clase que no se puede instanciar ni heredar: existe solo para
agrupar funciones y constantes. Es una forma de decir "esto es un espacio de nombres".

`static TextTheme textTheme(ColorScheme scheme)` es una función que recibe un `ColorScheme`
(la parte del tema de Material que define los colores por rol) y devuelve un `TextTheme`, que
es el conjunto de estilos de texto que Flutter usa por defecto. Como recibe el esquema, la
tipografía se genera con el color correcto para el tema activo.

Cada `TextStyle` tiene cuatro datos: `fontSize` en píxeles lógicos, `fontWeight` (grosor, de
`w100` a `w900`), `letterSpacing` (espacio entre letras, negativo en títulos grandes para que
se vean compactos) y `height` (alto de línea como múltiplo del tamaño de fuente: `1.15` es
apretado, `1.60` es cómodo para leer).

Los textos de lectura tienen otra respiración:

**Archivo:** `lib/core/theme/app_typography.dart`

```dart
    bodyLarge: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w400,
      letterSpacing: 0,
      height: 1.60,
      color: scheme.onSurface,
    ),
    bodyMedium: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w400,
      letterSpacing: 0,
      height: 1.60,
      color: scheme.onSurface,
    ),
    bodySmall: TextStyle(
      fontSize: 13,
      fontWeight: FontWeight.w400,
      letterSpacing: 0,
      height: 1.50,
      color: scheme.onSurfaceVariant,
    ),
```

`bodyLarge` es el texto de lectura principal: 16, grosor normal, interlineado 1.60.
`bodyMedium` baja a 14 para secundarios. `bodySmall` usa 13 y, atención,
`scheme.onSurfaceVariant`: un color pensado para texto de apoyo. El color viene del esquema,
no de la paleta, y eso es intencional: la paleta es para lo que la app agrega, el esquema para
lo que Material ya sabe pintar.

Hay además un estilo suelto, que no es parte de la escala estándar:

**Archivo:** `lib/core/theme/app_typography.dart`

```dart
  /// The quiet uppercase section label: 12sp, w600, 0.12em tracking.
  ///
  /// Decorative metadata only. By design it is never used for body copy, for
  /// input values, or for anything the user must read to act.
  static TextStyle sectionLabel(Color color) => TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w600,
    letterSpacing: 1.44,
    height: 1.40,
    color: color,
  );
```

`sectionLabel` es la etiqueta chica en mayúsculas que separa secciones. Recibe el color por
parámetro (por eso no está atada a un tema) y usa un `letterSpacing` grande, `1.44`, que es
`0.12em` de 12: mucho aire entre letras, típico de las etiquetas. El comentario dice algo
importante: es decorativa y nunca se usa para texto que el usuario tenga que leer para actuar.
Un manual de diseño que aclara eso vale más que uno que solo lista números.

### La escala de espaciado

**Archivo:** `lib/core/theme/app_spacing.dart`

```dart
/// Design tokens for spacing. Use these instead of magic numbers so padding
/// and gaps stay consistent across the app.
///
/// The scale is the design system's rhythm: 4 · 8 · 16 · 24 · 32 · 48.
abstract final class AppSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;

  /// Common page padding.
  static const EdgeInsets page = EdgeInsets.all(md);
}
```

Seis valores, y nada más: 4, 8, 16, 24, 32 y 48 píxeles lógicos. `double` es el tipo de
número con decimales que Flutter usa para medidas. Cada constante tiene un nombre de tamaño
(`xs` a `xxl`), no de uso, excepto la última línea.

`AppSpacing.page` es un `EdgeInsets` —el tipo que representa los márgenes internos de una
caja— con el mismo valor en los cuatro lados. Se usa como padding por defecto de página y
como padding por defecto de `AppCard`.

El motivo de que la escala sea corta es que una escala corta obliga a elegir. Si tenés 4, 8,
16, 24, 32 y 48, no existe la tentación de usar 13 o 27: esos números no están y no se
inventan. Es la misma idea que la escala tipográfica: un menú cerrado de opciones.

El mismo archivo define otras dos escalas, los radios de las esquinas y los trazos:

**Archivo:** `lib/core/theme/app_spacing.dart`

```dart
/// Design tokens for corner radii.
///
/// Small chips use [sm], the default surface radius (buttons, inputs, cards) is
/// [md], and overlays such as dialogs and sheets use [lg].
abstract final class AppRadius {
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double pill = 999;

  static const BorderRadius smAll = BorderRadius.all(Radius.circular(sm));
  static const BorderRadius mdAll = BorderRadius.all(Radius.circular(md));
  static const BorderRadius lgAll = BorderRadius.all(Radius.circular(lg));
  static const BorderRadius pillAll = BorderRadius.all(Radius.circular(pill));
}
```

`sm`, `md` y `lg` son los radios en píxeles; `pill` es un valor enorme (999) que en la
práctica redondea hasta convertir la caja en una píldora. Los `BorderRadius` prearmados
(`smAll`, `mdAll`, …) existen para no escribir `BorderRadius.all(Radius.circular(12))` cada
vez. Un `BorderRadius` es lo que se pasa a un `BoxDecoration` o a un botón para redondear las
esquinas.

### Cómo se usan los tokens en un widget

Acá se cierra el círculo: la pantalla del contador no tiene ni un color ni un tamaño escrito a
mano.

**Archivo:** `lib/features/counter/presentation/counter_page.dart`

```dart
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                '$count',
                style: theme.textTheme.displayLarge?.copyWith(
                  color: palette.accent,
                ),
              ),
              const Gap(AppSpacing.sm),
```

`EdgeInsets.all(AppSpacing.lg)` es el aire alrededor de todo: 24. El número usa el estilo
`displayLarge` de la escala y le cambia solo el color por el acento de la paleta:
`copyWith` crea una copia del estilo con ese campo modificado. El `Gap(AppSpacing.sm)` son 8
píxeles de separación. Nada de `12`, nada de `Color(0xFF...)`.

El mismo patrón en el perfil, con tipografía y color secundario:

**Archivo:** `lib/features/profile/presentation/profile_page.dart`

```dart
                      Text(l10n.guestName, style: theme.textTheme.titleMedium),
                      Text(
                        l10n.guestEmail,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: palette.textMuted,
                        ),
                      ),
```

Título en `titleMedium`, correo en `bodySmall` con `textMuted`. Los dos estilos existen en la
escala, y el color secundario tiene nombre propio. Cuando quieras cambiar cómo se ven los
correos en toda la app, cambiás `textMuted` y listo.

Si ves un valor suelto —un `SizedBox(height: 13)`, un `Color(0xFF333333)`—, tratalo como un
error de tipeo del sistema: o falta el token, o alguien no lo encontró. Los widgets del kit que
vas a ver en Widgets reutilizables: componer en vez de repetir están hechos de estos tokens.

### Resumen

- Un token es una decisión de diseño con nombre y en un solo lugar; hardcodear es escribir el
  valor donde se usa y pagar la inconsistencia después.
- `AppPalette` es un `ThemeExtension` con colores semánticos y dos instancias, `light` y
  `dark`; se lee con `context.palette` gracias a una `extension` sobre `BuildContext`.
- Los colores se escriben `0xAARRGGBB`: dos dígitos de opacidad y seis de color.
- La tipografía es una escala cerrada de quince estilos generada a partir del `ColorScheme`,
  más `sectionLabel` para las etiquetas decorativas.
- El espaciado es una escala corta —4, 8, 16, 24, 32, 48— que obliga a elegir entre opciones
  conocidas en vez de inventar números.

## Tema claro y oscuro, y cómo se recuerda

El capítulo anterior —El sistema de diseño: colores, tipografía y espaciado— mostró los tokens:
dos paletas, una escala de texto, una de espaciado. Ahora hay que responder tres preguntas de
ingeniería: ¿cómo se arma un tema completo con esos tokens?, ¿cómo elige el usuario entre claro,
oscuro o "lo que diga el sistema"?, y ¿cómo se acuerda la app de esa elección cuando la cerrás y
la volvés a abrir? Las respuestas están en `app_theme.dart`, `theme_controller.dart`,
`key_value_store.dart` y `bootstrap.dart`.

### ThemeMode, ThemeData y ColorScheme

Tres nombres que conviene separar antes de leer código:

- **`ThemeData`** es el tema completo: colores, textos, formas, estilos de botones, de
  diálogos, de tarjetas. Es el objeto que Flutter consulta para pintar cualquier widget de
  Material.
- **`ColorScheme`** es la parte del tema que define colores por rol (`primary`, `error`,
  `surface`, `onSurface`). Es lo que permite que un botón sepa qué color usar sin que se lo
  digas.
- **`ThemeMode`** es una enumeración de tres valores: `ThemeMode.system` (seguí lo que diga el
  sistema operativo), `ThemeMode.light` y `ThemeMode.dark`. No es un tema: es una elección.

`MaterialApp` recibe `theme` (el tema claro), `darkTheme` (el oscuro) y `themeMode` (cuál de
los dos usar). Si el modo es `system`, Flutter mira el ajuste del teléfono y elige solo.

### Los dos temas y cómo se arman

**Archivo:** `lib/core/theme/app_theme.dart`

```dart
abstract final class AppTheme {
  /// Width of the accent focus ring.
  static const double _focusWidth = 2;

  /// The light theme.
  static ThemeData light() => _build(Brightness.light, AppPalette.light);

  /// The dark theme.
  static ThemeData dark() => _build(Brightness.dark, AppPalette.dark);

  static ThemeData _build(Brightness brightness, AppPalette palette) {
    final scheme = brightness == Brightness.light ? _lightScheme : _darkScheme;
    final textTheme = AppTypography.textTheme(scheme);
    final hairline = BorderSide(color: palette.border);

    return ThemeData(
      brightness: brightness,
      colorScheme: scheme,
      extensions: [palette],
      scaffoldBackgroundColor: palette.bgBase,
      canvasColor: palette.bgBase,
      dividerColor: palette.border,
      textTheme: textTheme,
```

`light()` y `dark()` son públicas y cortísimas: delegan en `_build`, que es privada (el guion
bajo inicial la marca como privada del archivo), y cada una pasa su brillo y su paleta.

`_build` recibe `Brightness` —la enumeración `light`/`dark` de Flutter— y una `AppPalette`.
Elige el `ColorScheme` con un ternario, arma la tipografía a partir de ese esquema y prepara un
`BorderSide` reutilizable llamado `hairline`. Esa variable es la firma visual del proyecto: un
borde de un píxel con el color `border` de la paleta, usado en todos lados en vez de sombras.

Y después construye el `ThemeData`. `brightness` le dice a Flutter si el tema es claro u
oscuro. `colorScheme` entrega los colores por rol. `extensions: [palette]` es la línea que hace
posible `context.palette`: mete la paleta propia dentro del tema. `scaffoldBackgroundColor`,
`canvasColor` y `dividerColor` son atajos para pantallas, lienzos y divisores, y `textTheme` es
la escala del capítulo anterior.

Un widget concreto, configurado una sola vez para toda la app:

**Archivo:** `lib/core/theme/app_theme.dart`

```dart
      appBarTheme: AppBarTheme(
        backgroundColor: palette.bgBase,
        foregroundColor: palette.textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: textTheme.titleLarge,
        shape: Border(bottom: hairline),
      ),
```

La barra superior usa el fondo base, texto primario, sin elevación ni sombra al scrollear,
título a la izquierda y una línea de un píxel abajo. Todas las `AppBar` de la app quedan
iguales, en los dos temas.

El `ColorScheme` claro es explícito, rol por rol:

**Archivo:** `lib/core/theme/app_theme.dart`

```dart
  static const ColorScheme _lightScheme = ColorScheme.light(
    primary: Color(0xFF4C5FD5),
    primaryContainer: Color(0xFFE9ECFF),
    onPrimaryContainer: Color(0xFF131A4D),
    secondary: Color(0xFF55555A),
    onSecondary: Color(0xFFFFFFFF),
    secondaryContainer: Color(0xFFECECE9),
    onSecondaryContainer: Color(0xFF16161A),
```

`ColorScheme.light(...)` arma un esquema claro con valores por defecto razonables, y acá se le
pasan los propios. `primary` es el acento; los `on...` dicen "qué color va encima"
(`onSecondary` es el texto sobre `secondary`) y los `...Container` son fondos de menor énfasis.
El esquema oscuro sigue la misma estructura con los valores de la paleta oscura.

La división vale repetirla: los colores de Material van al `ColorScheme`, los de la marca a
`AppPalette`. No se mezclan.

### El controlador del tema

**Archivo:** `lib/core/theme/theme_controller.dart`

```dart
/// Persisted theme mode resolved before the first frame.
///
/// `bootstrap` overrides it with the stored value, so the app never flashes the
/// wrong brightness while storage resolves. It defaults to [ThemeMode.system],
/// which keeps widget tests free of extra provider overrides.
final initialThemeModeProvider = Provider<ThemeMode>((ref) => ThemeMode.system);

/// Holds the user's theme choice and persists it.
///
/// The mode is applied to the UI immediately and written to the key/value
/// store afterwards; a storage failure is logged and never surfaced
/// as an exception, because the in-memory choice is already in effect.
class ThemeModeController extends Notifier<ThemeMode> {
  /// Storage key holding `'system'`, `'light'` or `'dark'`.
  static const String storageKey = 'example_app.theme_mode';

  @override
  ThemeMode build() => ref.watch(initialThemeModeProvider);
```

`initialThemeModeProvider` devuelve `ThemeMode.system` por defecto. Parece inútil y no lo es:
es un punto de inyección. `bootstrap.dart` lo va a reemplazar con el valor guardado, y mientras
tanto los tests de widgets se olvidan del tema.

`ThemeModeController extends Notifier<ThemeMode>` es el mismo patrón del contador, con otro tipo
de estado: ahora el estado es un `ThemeMode`, no un `int`.

`storageKey` es el nombre del casillero donde se guarda la elección:
`'example_app.theme_mode'`. El prefijo con el nombre de la app evita choques con otras claves. El
valor guardado va a ser `mode.name`, o sea `'light'`, `'dark'` o `'system'`.

`build()` devuelve `ref.watch(initialThemeModeProvider)`: al crearse, el notifier arranca con lo
que diga ese provider, que `bootstrap` ya reemplazó por la elección del usuario.

Falta la parte de escribir:

**Archivo:** `lib/core/theme/theme_controller.dart`

```dart
  /// Decodes a persisted [storageKey] value.
  ///
  /// Anything that is not one of the three known names (including `null` and
  /// corrupt input) falls back to [ThemeMode.system].
  static ThemeMode resolve(String? raw) => switch (raw) {
    'light' => ThemeMode.light,
    'dark' => ThemeMode.dark,
    _ => ThemeMode.system,
  };

  /// Applies [mode] and persists it.
  Future<void> set(ThemeMode mode) async {
    if (state == mode) return;
    state = mode;
    try {
      await ref.read(keyValueStoreProvider).setString(storageKey, mode.name);
    } on Object catch (error, stackTrace) {
      AppLogger.instance.e(
        'ThemeModeController: could not persist ${mode.name}',
        error: error,
        stackTrace: stackTrace,
      );
    }
  }
```

`resolve` es una función pura: recibe un texto y devuelve un `ThemeMode`. Usa un `switch` como
expresión (devuelve un valor) con tres casos: `'light'`, `'dark'` y `_`, el comodín. Todo lo que
no sea exactamente esos dos textos —incluido `null`, o sea "no había nada guardado"— cae en
`ThemeMode.system`. Es defensivo a propósito: el almacenamiento puede traer basura y la app no se
puede romper por eso.

`set` es el método que llama la pantalla. `Future<void>` indica que es asíncrono (devuelve algo
que se completa después); `async` permite usar `await` adentro.

`if (state == mode) return;` evita trabajo al pedo: si ya está en ese modo, no reescribe nada.

`state = mode;` aplica el cambio ya mismo. Ese es el orden importante: primero la UI, después el
disco. La pantalla se repinta en el acto y el guardado ocurre detrás.

`await ref.read(keyValueStoreProvider).setString(storageKey, mode.name);` pide el almacenamiento
y escribe el nombre del modo. `await` espera a que termine; mientras tanto, Flutter sigue
funcionando.

`try` / `on Object catch` envuelve la escritura: si falla (disco lleno, permiso denegado), el
error se registra con `AppLogger` y no se propaga. La elección ya está aplicada en memoria, así
que fallar al persistir no es motivo para romperle la pantalla al usuario.

Y el provider que consume la app:

**Archivo:** `lib/core/theme/theme_controller.dart`

```dart
/// The active [ThemeMode]. Watched by the root [MaterialApp].
final themeModeProvider = NotifierProvider<ThemeModeController, ThemeMode>(
  ThemeModeController.new,
);
```

`NotifierProvider<ThemeModeController, ThemeMode>`: el notifier y el tipo de estado. Nadie crea
un `ThemeModeController` a mano: Riverpod lo hace cuando alguien mira el provider, y a partir de
ahí hay una sola instancia para toda la app.

### Qué es SharedPreferences

`SharedPreferences` es un paquete de Flutter que guarda pares clave-valor en el dispositivo.
"Clave-valor" quiere decir un diccionario simple: un nombre (`'example_app.theme_mode'`) y un
valor (un texto, un booleano, un número). No es una base de datos: no tiene consultas ni
relaciones. Es exactamente lo que hace falta para "acordate de que elegí oscuro".

Tiene dos limitaciones que importan acá: obtener la instancia es **asíncrono** (hay que
esperar), y no está pensado para datos sensibles. Para eso el proyecto tiene otro
almacenamiento, `SecureStore`, que aparece en el capítulo de autenticación.

Como es asíncrono y el resto de la app quiere depender de él sincrónicamente, el proyecto le
pone una capa fina arriba:

**Archivo:** `lib/core/storage/key_value_store.dart`

```dart
/// A thin, testable abstraction over non-sensitive local key/value storage.
///
/// The interface lets you swap the backing implementation (or mock it in
/// tests) without touching callers. The default implementation is backed by
/// `shared_preferences`.
abstract interface class KeyValueStore {
  Future<String?> getString(String key);
  Future<bool> setString(String key, String value);
  Future<bool?> getBool(String key);
  Future<bool> setBool(String key, {required bool value});
  Future<bool> remove(String key);
  Future<bool> clear();
}

class SharedPreferencesStore implements KeyValueStore {
  SharedPreferencesStore(this._prefs);

  final SharedPreferences _prefs;

  /// Convenience factory that resolves the [SharedPreferences] instance.
  static Future<SharedPreferencesStore> create() async {
    final prefs = await SharedPreferences.getInstance();
    return SharedPreferencesStore(prefs);
  }
```

`abstract interface class` declara un contrato: una lista de métodos que cualquier
implementación tiene que ofrecer, sin decir cómo y sin poder heredar de ella.

`Future<String?>` es el tipo de un valor que va a estar disponible después. El `?` significa
que puede ser nulo: `getString` devuelve texto o nada, porque la clave puede no existir.
`Future<bool?>` en `getBool`: booleano o nada.

`class SharedPreferencesStore implements KeyValueStore` es la implementación real. `implements`
significa "cumple este contrato": el compilador exige que estén todos los métodos.
`SharedPreferencesStore(this._prefs)` recibe las preferencias y las guarda en el campo privado
`_prefs`.

`static Future<SharedPreferencesStore> create() async` es una **factory**: una función que
construye el objeto y que puede ser asíncrona. Adentro, `await SharedPreferences.getInstance()`
obtiene la instancia del sistema —el único momento en que hay que esperar— y devuelve el objeto
ya listo.

Después, cada método delega en `_prefs`:

**Archivo:** `lib/core/storage/key_value_store.dart`

```dart
  @override
  Future<String?> getString(String key) async => _prefs.getString(key);

  @override
  Future<bool> setString(String key, String value) =>
      _prefs.setString(key, value);
```

`@override` confirma que el método viene del contrato. `getString` es `async` porque la interfaz
promete un `Future`, y `setString` devuelve el `Future<bool>` de `SharedPreferences`.

¿Y para qué la capa extra, si es una línea por método? Por dos motivos. Uno: los tests pueden
crear un `KeyValueStore` falso en memoria sin tocar el disco. Dos: si querés cambiar de
implementación —otro paquete, un archivo de texto— cambiás una clase y nadie más se entera.

### Restaurar el tema antes del primer frame

Un **frame** es una imagen que Flutter dibuja en pantalla. Si la app arranca en claro y después
de leer el disco salta a oscuro, ves un flash blanco: eso es arrancar con el frame equivocado.
La solución del proyecto es leer el disco *antes* de dibujar el primero.

**Archivo:** `lib/bootstrap.dart`

```dart
      // Resolve async dependencies before the first frame.
      final keyValueStore = await SharedPreferencesStore.create();
      final storedThemeMode = await keyValueStore.getString(
        ThemeModeController.storageKey,
      );

      runApp(
        ProviderScope(
          overrides: [
            keyValueStoreProvider.overrideWithValue(keyValueStore),
            // Restored before the first frame, so the app never flashes the
            // wrong brightness while storage resolves.
            initialThemeModeProvider.overrideWithValue(
              ThemeModeController.resolve(storedThemeMode),
            ),
          ],
```

`SharedPreferencesStore.create()` resuelve el almacenamiento; `getString` con la clave del
controlador trae el texto guardado (o `null` si es la primera vez que abre la app).

`runApp` es la orden de arrancar la interfaz: recién acá se dibuja algo. `ProviderScope` es el
contenedor donde viven todos los providers; sin él, Riverpod no puede crear nada.

`overrides` es la lista de reemplazos para este arranque. `keyValueStoreProvider` —el provider
que fallaba a propósito si nadie lo completaba— se reemplaza con la instancia real mediante
`overrideWithValue`. `initialThemeModeProvider` se reemplaza con
`ThemeModeController.resolve(storedThemeMode)`, que traduce ese texto a un `ThemeMode`.

El efecto: cuando `MaterialApp` construye el primer frame, el controlador ya sabe si va claro u
oscuro. No hay flash, y no hay espera visible para el usuario.

### Cómo lo cambia la pantalla

En el perfil hay un selector de tres opciones. Es la interfaz del `ThemeMode`:

**Archivo:** `lib/features/profile/presentation/profile_page.dart`

```dart
                SizedBox(
                  width: double.infinity,
                  child: SegmentedButton<ThemeMode>(
                    showSelectedIcon: false,
                    segments: [
                      ButtonSegment<ThemeMode>(
                        value: ThemeMode.system,
                        label: Text(l10n.themeSystem),
                      ),
                      ButtonSegment<ThemeMode>(
                        value: ThemeMode.light,
                        label: Text(l10n.themeLight),
                      ),
                      ButtonSegment<ThemeMode>(
                        value: ThemeMode.dark,
                        label: Text(l10n.themeDark),
                      ),
                    ],
                    selected: {themeMode},
                    onSelectionChanged: (selection) => ref
                        .read(themeModeProvider.notifier)
                        .set(selection.first),
                  ),
                ),
```

`SizedBox(width: double.infinity, ...)` fuerza un ancho infinito, que en la práctica quiere decir
"ocupá todo el ancho disponible". `SegmentedButton<ThemeMode>` es un botón segmentado —varias
opciones en una fila, una sola seleccionada— y el `<ThemeMode>` dice que cada segmento lleva un
valor de ese tipo.

`showSelectedIcon: false` apaga el tilde que Material agrega por defecto. `segments` es la lista
de opciones: cada `ButtonSegment<ThemeMode>` combina un `value` (el dato) con un `label` (lo que
se ve), y los textos vienen de `l10n`.

`selected: {themeMode}` recibe un conjunto (`Set`, por eso las llaves) con los valores elegidos.
De dónde sale `themeMode`: arriba en el `build` de la página está
`final themeMode = ref.watch(themeModeProvider);`, así que el selector se redibuja solo cuando el
modo cambia.

`onSelectionChanged` se ejecuta cuando el usuario toca otra opción; `selection` es el conjunto
nuevo y `selection.first` toma su único elemento. `ref.read(themeModeProvider.notifier)` pide el
controlador (no el valor) y le llama `.set(...)`, que aplica el modo y lo persiste.

El último eslabón: el widget raíz mira el provider y se lo pasa a `MaterialApp`.

**Archivo:** `lib/app/app.dart`

```dart
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeModeProvider);

    return MaterialApp.router(
      // Localized title (shown in the OS task switcher). Falls back to the
      // flavor name before the first frame resolves localizations.
      onGenerateTitle: (context) => context.l10n.appTitle,
      debugShowCheckedModeBanner: !AppConfig.isProd,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      // The user picks system/light/dark in the profile screen; the choice is
      // restored from storage before the first frame.
      themeMode: themeMode,
```

`ref.watch(themeModeProvider)` suscribe la app entera al modo. `theme` y `darkTheme` reciben los
dos `ThemeData` que arma `AppTheme`, y `themeMode: themeMode` decide cuál se usa. Cambiás el
segmento en el perfil, el provider avisa, `App` se reconstruye con el modo nuevo y toda la
pantalla se repinta. Tres pasos y ningún `setState`.

### Resumen

- `ThemeMode` es la elección (`system`, `light`, `dark`); `ThemeData` es el tema armado y
  `ColorScheme` su parte de colores por rol.
- `AppTheme.light()` y `AppTheme.dark()` construyen los dos `ThemeData` con la misma receta:
  esquema, tipografía, paleta como extensión y estilos por widget.
- `ThemeModeController` es un `Notifier<ThemeMode>`: aplica el cambio en memoria y después lo
  escribe en el almacenamiento, y si la escritura falla la registra sin romper nada.
- `SharedPreferences` guarda pares clave-valor en el dispositivo; `KeyValueStore` lo envuelve
  en un contrato para poder reemplazarlo y testearlo.
- `bootstrap.dart` lee la elección guardada antes del primer frame y la inyecta con
  `overrideWithValue`, así la app no parpadea con el brillo equivocado.

## Widgets reutilizables: componer en vez de repetir

En Flutter todo es un widget: una pantalla, un texto, un espacio, un botón. La forma de
construir una app no es heredar de una clase enorme, sino **componer**: armar cosas grandes
juntando cosas chicas, cada una con una responsabilidad. Este capítulo lee el kit de widgets
propios de example_app, aplicado a que todos los botones, tarjetas y campos se vean igual.

### Un widget es una función de sus props

La idea más útil para arrancar: un widget se parece a una función. Recibe datos (sus
propiedades, o *props*) y devuelve una descripción de pantalla (su método `build`). Si le das los
mismos datos, describe lo mismo, y no guarda nada entre llamadas: por eso los widgets son
**inmutables**.

De ahí salen tres reglas que se repiten en todo el kit:

- **Los campos son `final`.** Si el widget no puede cambiar sus datos, sus campos tampoco: para
  cambiarlos se crea un widget nuevo con otros valores.
- **Los parámetros son `required` u opcionales con valor por defecto.** `required` obliga a
  pasar el dato; lo demás tiene un valor razonable y no se toca.
- **`super.key` va en el constructor.** Una `key` es el identificador con el que Flutter
  reconoce un widget entre reconstrucciones; pasarla al padre le permite sobrevivir en listas.

`build` no dibuja: devuelve la descripción de qué dibujar, y Flutter se encarga del resto. Y una
distinción que ya viste: `StatelessWidget` no tiene estado propio; `StatefulWidget` sí, y lo
maneja con `setState`.

### Gap: el widget más chico posible

**Archivo:** `lib/core/widgets/gap.dart`

```dart
class Gap extends StatelessWidget {
  /// Vertical space of [size] logical pixels.
  const Gap(this.size, {super.key}) : _horizontal = false;

  /// Horizontal space of [size] logical pixels.
  const Gap.h(this.size, {super.key}) : _horizontal = true;

  final double size;
  final bool _horizontal;

  @override
  Widget build(BuildContext context) => SizedBox(
    width: _horizontal ? size : null,
    height: _horizontal ? null : size,
  );
}
```

`Gap` ocupa espacio y no dibuja nada. Existe porque `SizedBox(height: 12)` no comunica intención
y `Gap(AppSpacing.md)` sí, con la escala que arma El sistema de diseño: colores, tipografía y
espaciado.

`const Gap(this.size, {super.key}) : _horizontal = false;` tiene dos particularidades. La
primera: `this.size` es un parámetro posicional que se asigna directo al campo, así que se usa
`Gap(AppSpacing.md)` sin nombre. La segunda: los dos puntos abren una lista de inicializadores
que fija `_horizontal = false`; como el campo es `final`, solo se puede asignar ahí.

`const Gap.h(this.size, {super.key}) : _horizontal = true;` es un **constructor con nombre**: la
parte `.h` lo distingue del anterior. Es la versión horizontal, para usar dentro de un `Row`.

`build` devuelve un `SizedBox` —una caja de tamaño fijo— y decide qué dimensión fijar: si es
horizontal fija `width: size` y deja `height` en `null`, y si es vertical, al revés.

### AppButton: una API para toda la familia de botones

Material tiene varias clases de botón (`FilledButton`, `OutlinedButton`, `TextButton`), cada una
con su estilo. Si cada pantalla elige, la app termina con botones que no combinan. La solución es
envolverlos en uno solo, con un `enum` de variantes (`primary`, `secondary`, `outline`, `text`)
que cierra la lista: no se puede inventar una quinta sin tocar el enum.

**Archivo:** `lib/core/widgets/app_button.dart`

```dart
class AppButton extends StatelessWidget {
  const AppButton({
    required this.label,
    required this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.icon,
    this.isLoading = false,
    this.expanded = false,
    super.key,
  });

  final String label;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final IconData? icon;
  final bool isLoading;

  /// When true, the button stretches to the full available width.
  final bool expanded;
```

El constructor resume las decisiones de diseño. `required this.label` y
`required this.onPressed`: no hay botón sin texto ni sin acción.
`this.variant = AppButtonVariant.primary` es opcional con valor por defecto, y el default es la
variante principal.

`final VoidCallback? onPressed;` merece atención: `VoidCallback` es el tipo de "una función sin
parámetros que no devuelve nada", o sea el manejador del toque. El `?` significa que puede ser
nulo, y un botón con `onPressed: null` queda **deshabilitado**: el nulo es la bandera.

`final IconData? icon;` es opcional y nulo por defecto (`IconData` describe un ícono de
Material). `isLoading` y `expanded` son booleanos en `false`: no muestran spinner y no se estiran.

El `build` elige la clase de Material según la variante:

**Archivo:** `lib/core/widgets/app_button.dart`

```dart
  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final effectiveOnPressed = isLoading ? null : onPressed;
    final child = _buildChild(context);

    final button = switch (variant) {
      AppButtonVariant.primary => FilledButton(
        onPressed: effectiveOnPressed,
        child: child,
      ),
      AppButtonVariant.secondary => OutlinedButton(
        onPressed: effectiveOnPressed,
        child: child,
      ),
```

`final effectiveOnPressed = isLoading ? null : onPressed;` resuelve el estado de carga: si está
cargando, el `onPressed` efectivo es `null` y el botón queda deshabilitado sin que nadie tenga
que acordarse de pasar `null`.

`final child = _buildChild(context);` calcula el contenido una vez y lo reutiliza en las cuatro
ramas. `switch (variant)` como expresión devuelve el botón armado, con una clase de Material
distinta por variante y el mismo `child`; quien usa `AppButton` no necesita saber cuál es cuál.

El contenido lo decide `_buildChild`:

**Archivo:** `lib/core/widgets/app_button.dart`

```dart
  Widget _buildChild(BuildContext context) {
    if (isLoading) {
      // A loading button is disabled, so its surface is bgMuted: the spinner
      // must be the accent, not the on-accent foreground.
      return SizedBox(
        height: 20,
        width: 20,
        child: CircularProgressIndicator(
          strokeWidth: 2,
          color: context.palette.accent,
        ),
      );
    }
    if (icon == null) return Text(label);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [Icon(icon, size: 20), const Gap.h(AppSpacing.sm), Text(label)],
    );
  }
```

Tres casos, en orden. Si está cargando, un `CircularProgressIndicator` de 20×20 con trazo fino;
el comentario explica por qué va en acento: el fondo del botón deshabilitado es `bgMuted`, así
que un spinner "sobre el acento" se perdería. Si no hay ícono, un `Text(label)`. Si hay ícono, un
`Row` con ícono, `Gap.h(AppSpacing.sm)` y texto, con `mainAxisSize: MainAxisSize.min` para que
ocupe solo lo necesario. Y el `Gap` es del propio kit: se componen entre ellos.

### AppCard: una superficie que reacciona

**Archivo:** `lib/core/widgets/app_card.dart`

```dart
class AppCard extends StatefulWidget {
  const AppCard({
    required this.child,
    this.onTap,
    this.padding = AppSpacing.page,
    super.key,
  });

  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry padding;

  @override
  State<AppCard> createState() => _AppCardState();
}

class _AppCardState extends State<AppCard> {
  bool _hovered = false;
  bool _pressed = false;

  bool get _interactive => widget.onTap != null;

  bool get _emphasised => _interactive && (_hovered || _pressed);
```

`AppCard` es `StatefulWidget` porque tiene algo que recordar entre dibujos: si el mouse está
encima y si está apretada. Eso es estado local y efímero, el caso donde `setState` es la
herramienta correcta.

`required this.child`: una tarjeta sin contenido no existe. `this.onTap` es opcional: sin acción,
la tarjeta es solo una superficie. `padding = AppSpacing.page` es el aire por defecto.

`createState()` devuelve el objeto de estado, `_AppCardState`, donde viven los campos mutables.
Esa separación —widget inmutable, estado mutable— permite que algo cambie sin violar la
inmutabilidad: el widget se reconstruye, el estado sobrevive.

Dentro del estado, los dos `bool` guardan hover y presión, y los `get` son propiedades calculadas:
`_interactive` dice si hay acción y `_emphasised` si hay que resaltar el borde.

El `build`:

**Archivo:** `lib/core/widgets/app_card.dart`

```dart
  @override
  Widget build(BuildContext context) {
    final palette = context.palette;

    return MouseRegion(
      onEnter: (_) => _setHovered(true),
      onExit: (_) => _setHovered(false),
      child: AnimatedContainer(
        duration: AppMotion.duration(context, AppMotion.base),
        curve: AppMotion.curve,
        decoration: BoxDecoration(
          color: palette.bgElevated,
          borderRadius: AppRadius.mdAll,
          border: Border.all(
            color: _emphasised ? palette.borderStrong : palette.border,
          ),
        ),
```

`MouseRegion` detecta la entrada y la salida del puntero: `onEnter` y `onExit` llaman a
`_setHovered`, que hace `setState`. Los `(_)` son parámetros que no se usan.

`AnimatedContainer` es un contenedor que anima sus cambios: cuando la decoración cambia,
interpola en vez de saltar. `duration: AppMotion.duration(context, AppMotion.base)` pide la
duración estándar, y esa función devuelve cero si el sistema pidió "reducir movimiento": la
accesibilidad está resuelta en un solo lugar. `curve` es la curva de la animación.

`BoxDecoration` describe el fondo: color `bgElevated`, esquinas de radio `md` y un borde de un
píxel que cambia de `border` a `borderStrong` cuando la tarjeta está enfatizada. Elevación sin
sombra: la jerarquía se expresa con contraste de superficie y el borde.

Y adentro, la interacción:

**Archivo:** `lib/core/widgets/app_card.dart`

```dart
        child: Material(
          type: MaterialType.transparency,
          borderRadius: AppRadius.mdAll,
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: widget.onTap,
            onTapDown: (_) => _setPressed(true),
            onTapUp: (_) => _setPressed(false),
            onTapCancel: () => _setPressed(false),
            overlayColor: WidgetStatePropertyAll<Color?>(palette.accentSoft),
            child: Padding(padding: widget.padding, child: widget.child),
          ),
        ),
```

`Material` aporta el "material" de Material Design: es lo que permite que `InkWell` reaccione al
toque. `type: MaterialType.transparency` lo hace transparente para no tapar el fondo que ya puso
el `AnimatedContainer`, y `clipBehavior: Clip.antiAlias` recorta a las esquinas redondeadas.

`InkWell` es el detector de toques: `onTap` ejecuta la acción (`widget.onTap`, que puede ser nulo)
y `onTapDown`, `onTapUp` y `onTapCancel` mantienen el estado de presión; el `onTapCancel` está
porque, si el dedo se va antes de soltar, la tarjeta tiene que volver a la normalidad.

`overlayColor: WidgetStatePropertyAll<Color?>(palette.accentSoft)` reemplaza el efecto de onda por
un velo de acento suave. Y los `setState` del final tienen una guarda: si la tarjeta no es
interactiva o el valor no cambió, no reconstruyen nada.

### AppTextField: un campo de texto con la marca de la casa

**Archivo:** `lib/core/widgets/app_text_field.dart`

```dart
class AppTextField extends StatefulWidget {
  const AppTextField({
    required this.label,
    this.controller,
    this.hint,
    this.prefixIcon,
    this.obscurable = false,
    this.keyboardType,
    this.textInputAction,
    this.validator,
    this.onChanged,
    this.onSubmitted,
    this.enabled = true,
    super.key,
  });
```

Acá se ve la diferencia entre obligatorio y opcional en la práctica: solo `label` es `required`.
Todo lo demás tiene un comportamiento razonable sin configurar: sin `controller` el campo maneja
su propio texto, sin `hint` no muestra ayuda y sin `validator` no valida.

Los tipos también enseñan: `TextEditingController?` guarda y controla el texto y se pasa cuando
la pantalla necesita leerlo o precargarlo. `TextInputType?` es el tipo de teclado.
`String? Function(String?)?` —el tipo de `validator`— se lee de adentro hacia afuera: una función
que recibe un texto que puede ser nulo y devuelve el mensaje de error o nada.
`ValueChanged<String>?` recibe el texto nuevo y no devuelve nada.

`obscurable` viene apagado y, cuando se prende, el campo se comporta como contraseña. `enabled`
viene encendido.

Todo el widget se construye sobre `TextFormField`:

**Archivo:** `lib/core/widgets/app_text_field.dart`

```dart
class _AppTextFieldState extends State<AppTextField> {
  late bool _obscured = widget.obscurable;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final palette = context.palette;

    return TextFormField(
      controller: widget.controller,
      obscureText: _obscured,
      keyboardType: widget.keyboardType,
      textInputAction: widget.textInputAction,
      validator: widget.validator,
      onChanged: widget.onChanged,
      onFieldSubmitted: widget.onSubmitted,
      enabled: widget.enabled,
```

Es `StatefulWidget` por un solo motivo: recordar si el texto está oculto o visible, y eso lo
resuelve `late bool _obscured = widget.obscurable;`, inicializado con la propiedad del widget.

Dentro del estado, cada propiedad del widget se lee con `widget.` adelante: el estado no es el
widget, lo envuelve. Después, cada propiedad del `TextFormField` recibe la equivalente del
`AppTextField`. La excepción es `obscureText: _obscured`, que viene del estado local: es lo que
el toggle cambia.

La decoración es donde aparece la marca:

**Archivo:** `lib/core/widgets/app_text_field.dart`

```dart
      style: TextStyle(fontSize: 16, color: palette.textPrimary),
      decoration: InputDecoration(
        labelText: widget.label.toUpperCase(),
        floatingLabelBehavior: FloatingLabelBehavior.always,
        labelStyle: AppTypography.sectionLabel(palette.textFaint),
        hintText: widget.hint,
        prefixIcon: widget.prefixIcon == null ? null : Icon(widget.prefixIcon),
        suffixIcon: widget.obscurable
            ? IconButton(
                onPressed: () => setState(() => _obscured = !_obscured),
                icon: Icon(
                  _obscured
                      ? Icons.visibility_off_outlined
                      : Icons.visibility_outlined,
                ),
                tooltip: _obscured ? l10n.showPassword : l10n.hidePassword,
              )
            : null,
      ),
```

`InputDecoration` describe el marco de un campo: etiqueta, ayuda, íconos, colores de borde.

`labelText: widget.label.toUpperCase()` pasa la etiqueta a mayúsculas, y
`labelStyle: AppTypography.sectionLabel(palette.textFaint)` le aplica el estilo de etiqueta de
sección: mayúsculas chicas y aire entre letras, igual que en todos los campos de la app.

`floatingLabelBehavior: FloatingLabelBehavior.always` deja la etiqueta siempre arriba, en el
borde, en vez de hacerla desaparecer cuando escribís. El comentario de la clase aclara que la
etiqueta sigue existiendo para los lectores de pantalla: no es solo estética.

`prefixIcon: widget.prefixIcon == null ? null : Icon(widget.prefixIcon)` es un ternario que evita
crear un `Icon` con `null` adentro. `suffixIcon` hace lo mismo con un `IconButton` que alterna
entre ojo tachado y ojo abierto y cambia el tooltip según el estado. El
`setState(() => _obscured = !_obscured)` es el único estado propio del widget, y está donde debe
estar.

### El barrel: un import para todo el kit

**Archivo:** `lib/core/widgets/widgets.dart`

```dart
/// Barrel file for the shared widget kit.
///
/// Import everything with a single line:
/// ```dart
/// import 'package:example_app/core/widgets/widgets.dart';
/// ```
library;

export 'app_avatar.dart';
export 'app_button.dart';
export 'app_card.dart';
export 'app_icon_box.dart';
export 'app_snack_bar.dart';
export 'app_text_field.dart';
export 'async_value_view.dart';
export 'confirm_dialog.dart';
export 'empty_view.dart';
export 'error_view.dart';
export 'gap.dart';
export 'hairline.dart';
export 'loading_overlay.dart';
export 'reveal.dart';
export 'section_header.dart';
```

Un **barrel** es un archivo que no define nada: solo reexporta. `export` hace pública la
declaración de otro archivo a través de este, y `library;` lo marca como biblioteca sin nombre.

El beneficio es concreto: cualquier pantalla escribe una línea
(`import 'package:example_app/core/widgets/widgets.dart';`) y tiene `AppButton`, `AppCard`,
`Gap`, `AppTextField` y el resto. Y cuando se agrega un widget al kit, se agrega una línea acá y
no hay que tocar todos los imports del proyecto.

### Dónde se ven todos juntos

Los widgets del kit no viven solo en las pantallas: hay un lugar donde están todos, con sus
estados, para mirarlos de un vistazo:
`lib/features/showcase/presentation/components_gallery_page.dart`. Se llama "galería" y es
documentación ejecutable: arriba muestra los tokens —colores, radios, escalas de texto y de
espacio— y después lista cada widget.

Si querés ver `AppButton` en sus cuatro variantes, con ícono, cargando y deshabilitado, esa página
es el lugar. Y cuando agregues un widget propio, el comentario del archivo dice qué hacer: sumalo
a la galería. Es el contrato que mantiene el sistema de diseño honesto, porque una captura se
desactualiza y una galería que no compila no existe.

### Resumen

- Componer es armar cosas grandes con cosas chicas: un widget recibe props por constructor y
  devuelve una descripción de pantalla desde `build`.
- Los campos van en `final`, los obligatorios con `required`, los demás con valor por defecto, y
  `super.key` se pasa siempre al padre.
- `Gap` es el widget mínimo: una caja que ocupa espacio y no dibuja, para no escribir medidas a
  mano.
- `AppButton` envuelve la familia de botones de Material detrás de un `enum` de variantes;
  `AppCard` y `AppTextField` son `StatefulWidget` porque recuerdan hover y visibilidad.
- El barrel `widgets.dart` reexporta el kit entero, y la galería de componentes es el lugar donde
  se revisa todo junto.


## La capa de red con dio

Una app como example_app no trae los posts adentro: los pide a un servidor. Para eso tiene que hablar HTTP, el protocolo con el que un cliente pide (`GET /posts`) y un servidor contesta (`200 OK` y un cuerpo con los datos). El que arma esos pedidos y lee esas respuestas es el **cliente HTTP**. En este proyecto ese cliente es un paquete llamado `dio`, y el archivo que lo configura es el primero que vas a leer.

Antes de arrancar, tres palabras que vas a ver todo el tiempo:

- **JSON**: un formato de texto para datos, con llaves y listas. Por ejemplo `{"id": 1, "title": "hola"}`.
- **Request** (pedido): lo que la app manda. Tiene un método (`GET` para leer, `POST` para crear), una URL y, a veces, cabeceras y cuerpo.
- **Response** (respuesta): lo que vuelve. Tiene un código de estado (`200` salió bien, `404` no existe, `500` se rompió el servidor) y un cuerpo.

`dio` es una clase de Dart, no un widget: no dibuja nada. Su trabajo es mandar el pedido, esperar, y devolverte la respuesta (o un error). Todo lo demás —quién muestra la lista, quién guarda los datos— viene después.

### Un solo lugar para armar el cliente

Si cada pantalla creara su propio cliente HTTP, cada una tendría sus propios timeouts y sus propias cabeceras, y arreglar un problema de red sería buscar en veinte archivos. Por eso el proyecto tiene un único constructor:

**Archivo:** `lib/core/network/dio_client.dart`

```dart
/// Builds a configured [Dio] instance for the app.
///
/// Centralizing Dio construction keeps timeouts, base URL, headers and
/// interceptors consistent, and makes the client trivial to override in
/// tests (see `test/` for examples that inject a mock adapter).
abstract final class DioClient {
  static Dio create({List<Interceptor>? interceptors}) {
    final dio = Dio(
```

Léelo con calma, que tiene bastante información:

- El comentario de arriba (`///`) es documentación: el editor te la muestra cuando pasás el mouse. Dice exactamente el motivo que te contaba: centralizar deja los timeouts, la URL base, las cabeceras y los interceptores consistentes, y hace que en las pruebas sea trivial reemplazar el cliente.
- `abstract final class` son dos modificadores de Dart 3. `abstract` significa "no se puede crear un objeto de esta clase"; `final`, que nadie puede heredar de ella. O sea: `DioClient` no es algo que se instancie, es una caja con una función adentro.
- `static Dio create(...)` es un método **estático**: se llama sobre la clase, no sobre un objeto (`DioClient.create()`), y devuelve un `Dio`.
- `{List<Interceptor>? interceptors}` es un parámetro **opcional con nombre**: quien llama puede pasar `interceptors:` o no pasar nada. El `?` dice que puede venir vacío; `List<Interceptor>` es una lista de interceptores, que ahora mismo no conocés pero ya vamos a ver.
- `final dio = Dio(` empieza a construir el objeto. Todo lo que sigue son los argumentos del constructor.

### BaseOptions: dirección, cabeceras y tiempos

`BaseOptions` es el objeto donde `dio` guarda lo que vale para *todas* las requests: a qué servidor ir, cuánto esperar y qué cabeceras mandar.

**Archivo:** `lib/core/network/dio_client.dart`

```dart
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(milliseconds: AppConfig.apiTimeoutMs),
        receiveTimeout: const Duration(milliseconds: AppConfig.apiTimeoutMs),
        sendTimeout: const Duration(milliseconds: AppConfig.apiTimeoutMs),
        headers: const {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        // Let us handle non-2xx responses ourselves instead of throwing
        // opaque DioExceptions for every status code.
        validateStatus: (status) => status != null && status < 500,
      ),
```

- `baseUrl` es la parte de la URL que se repite. Cuando más adelante el data source pida `'/posts'`, dio le pega adelante esta base y arma `https://jsonplaceholder.typicode.com/posts`. Escribir la URL entera una sola vez evita errores de tipeo repartidos por el código.
- `connectTimeout`, `receiveTimeout` y `sendTimeout` son los tres momentos en que una request puede colgarse: conectar con el servidor, esperar la respuesta, y mandar el cuerpo. Los tres usan el mismo valor, `const Duration(milliseconds: AppConfig.apiTimeoutMs)`, porque para esta app alcanza con un número. `Duration` es el tipo de Dart para "un rato"; acá son milisegundos.
- `headers` son las cabeceras: metadatos que van con cada pedido. `Content-Type: application/json` avisa "lo que mando está en JSON" y `Accept: application/json` pide "contestame en JSON". El `const` dice que ese mapa es fijo y no cambia en toda la vida de la app.
- `validateStatus` es una función que dio llama con cada código de estado y que devuelve si esa respuesta cuenta como buena. Acá devuelve `true` para todo lo que sea menor a `500`: entonces un `404` **no** lanza excepción, llega como respuesta normal y el código de más arriba decide qué hacer. El comentario del proyecto lo dice con todas las letras: mejor manejar los `non-2xx` nosotros que recibir `DioException` opacas por cada código.

### De dónde salen esos valores

Ninguno de esos números está escrito en el archivo: vienen de `AppConfig`, que los lee en tiempo de compilación.

**Archivo:** `lib/core/config/app_config.dart`

```dart
  /// Base URL for the REST API.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://jsonplaceholder.typicode.com',
  );

  /// Network timeout in milliseconds.
  static const int apiTimeoutMs = int.fromEnvironment(
    'API_TIMEOUT_MS',
    defaultValue: 15000,
  );

  /// Whether verbose network/logging is enabled.
  static const bool enableLogging = bool.fromEnvironment(
    'ENABLE_LOGGING',
    defaultValue: true,
  );
```

`String.fromEnvironment('API_BASE_URL', defaultValue: ...)` significa: "buscá un valor llamado `API_BASE_URL` que se haya inyectado al compilar (con `--dart-define-from-file=config/dev.json`) y, si no hay, usá este default". Es la forma de tener una URL de desarrollo, una de staging y una de producción sin tocar el código ni hardcodear secretos. Lo mismo con el timeout (15 segundos si nadie dice otra cosa) y con `enableLogging`, que arranca en `true`.

### Interceptores: código que ve todas las requests

Un **interceptor** es un objeto que se mete en el camino de cada request y cada response. Sirve para cosas transversales: agregar un token, reintentar, medir tiempos, loguear. Es el mismo concepto que un middleware si venís del mundo web.

**Archivo:** `lib/core/network/dio_client.dart`

```dart
    dio.interceptors.addAll([
      ...?interceptors,
      if (AppConfig.enableLogging) LoggingInterceptor(),
    ]);

    return dio;
  }
}
```

- `dio.interceptors` es la lista de interceptores del cliente. `addAll` agrega varios de una vez.
- `...?interceptors` es un **spread con null-check**: si quien llamó pasó una lista, mete sus elementos acá; si no pasó nada, no mete ninguno y no rompe. Gracias a eso los tests pueden enchufar su propio interceptor.
- `if (AppConfig.enableLogging) LoggingInterceptor()` es una **colección con `if`**: el interceptor de logs solo entra en la lista cuando el logging está prendido. En producción, apagás una variable y el código deja de existir ahí.
- `return dio;` devuelve el cliente ya armado.

Fijate el orden: primero los interceptores que te pasaron, después el de logs. El orden importa porque los interceptores se ejecutan en cadena, uno detrás del otro.

### El interceptor de logs, sin filtrar nada sensible

**Archivo:** `lib/core/network/logging_interceptor.dart`

```dart
class LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    AppLogger.instance.d('→ ${options.method} ${options.uri}');
    handler.next(options);
  }
```

`extends Interceptor` hereda la clase base de dio y `@override` reemplaza un método que la clase base ya define. Este método, `onRequest`, corre *antes* de que el pedido salga:

- `options.method` es `GET` o `POST`; `options.uri` es la URL completa ya armada con la base. La flecha `→` marca "sale".
- `AppLogger.instance.d(...)` escribe en el logger de la app con nivel *debug*. La interpolación `${...}` mete valores dentro del texto.
- `handler.next(options)` es obligatorio: le pasa la request al siguiente eslabón de la cadena. Si no lo llamás, la request se queda ahí y nunca sale.

Ahora el otro extremo, cuando algo falla:

**Archivo:** `lib/core/network/logging_interceptor.dart`

```dart
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    AppLogger.instance.w(
      '✗ ${err.requestOptions.method} ${err.requestOptions.uri} '
      '(${err.type.name})',
    );
    handler.next(err);
  }
}
```

- `onError` recibe un `DioException`, el error propio de dio, y un handler.
- `err.requestOptions` son las opciones de la request que falló: de ahí saca el método y la URL. `err.type.name` es el nombre del tipo de error (`connectionTimeout`, `badResponse`, etc.), que es lo que te dice *qué* salió mal.
- El nivel es `.w` (warning) y no `.e`, porque un error de red esperable no es una catástrofe.
- `handler.next(err)` deja pasar el error al que sigue.

Ahora, lo importante: **qué no** loguea. No imprime cabeceras ni cuerpo, solo método, URL y tipo de error. Eso es a propósito: las cabeceras llevan tokens de autenticación y el cuerpo puede llevar contraseñas, así que nunca van a un log. Y hay una segunda red de seguridad:

**Archivo:** `lib/core/utils/app_logger.dart`

```dart
/// Only logs in debug/profile builds. Release builds stay silent.
class _AppLogFilter extends LogFilter {
  @override
  bool shouldLog(LogEvent event) => !kReleaseMode;
}
```

`kReleaseMode` es una constante de Flutter que vale `true` cuando la app se compiló para publicar. Con `!kReleaseMode`, en una build de release no se imprime nada, aunque `enableLogging` esté prendido. Dos capas: el interceptor elige qué contar y el logger decide si contar algo.

### El proveedor que comparte el cliente

Crear el `Dio` en un solo lugar no alcanza si cada capa lo vuelve a crear. Para eso está el proveedor:

**Archivo:** `lib/core/providers/core_providers.dart`

```dart
/// The shared [Dio] HTTP client.
final dioProvider = Provider<Dio>((ref) {
  final dio = DioClient.create();
  ref.onDispose(dio.close);
  return dio;
});
```

- `final dioProvider = ...` es una variable global de solo lectura que guarda un **provider**: un objeto de Riverpod que sabe fabricar un valor y repartirlo. El capítulo sobre el estado con Riverpod lo explica entero; por ahora pensalo como "la receta del cliente HTTP".
- `Provider<Dio>((ref) { ... })` dice: "este provider produce un `Dio`", y la función recibe `ref`, la referencia que te deja leer otros providers y registrar limpieza.
- `final dio = DioClient.create();` arma el cliente con todo lo que leíste recién. Nadie más llama a `DioClient.create()`.
- `ref.onDispose(dio.close)` registra una limpieza: cuando el provider se destruye, se llama a `dio.close` y se cierran las conexiones abiertas. Sin eso, el cliente queda con sockets colgando.
- `return dio;` entrega el cliente.

Todo lo que necesite red pide `dioProvider` en vez de construir su propio `Dio`. Y en los tests se reemplaza ese provider por uno con un adaptador falso, sin tocar una línea del resto de la app.

### Resumen

- `dio` es el cliente HTTP del proyecto: arma pedidos, espera respuestas y las entrega como objetos Dart.
- `DioClient.create()` es el único lugar donde se configuran URL base, timeouts, cabeceras y `validateStatus`, y todo sale de `AppConfig` vía `--dart-define`.
- Los interceptores son código que pasa por todas las requests; el de logs imprime solo método, URL y tipo de error, nunca cabeceras ni cuerpo.
- `AppLogger` no imprime nada en release: la seguridad de los logs tiene dos capas.
- `dioProvider` comparte un único cliente y lo cierra cuando ya no se usa.

## Errores con tipo: exceptions, failure y Result

En la mayoría de los proyectos los errores son lo último que se piensa: un `try/catch` acá, un `print` allá, y cuando algo falla en producción nadie sabe qué pasó. example_app hace lo contrario: los errores son tipos, están declarados en archivos propios y el compilador te obliga a considerarlos. Este capítulo es el que te enseña ese mecanismo, y es el que hace que el resto del código se lea tranquilo.

La herramienta central es una sola palabra de Dart 3: `sealed`. Un **`sealed class`** es una clase de la que solo se puede heredar dentro del mismo archivo. Suena restrictivo y lo es, a propósito: si el compilador sabe que esas son *todas* las variantes que existen, cuando escribís un `switch` sobre ella puede verificar que hayas cubierto cada caso. Si mañana alguien agrega una variante nueva, tu `switch` deja de compilar y te avisa. Eso es un error en tiempo de compilación en lugar de un bug en producción.

### Exceptions: los errores de abajo

Empecemos por el nivel más bajo. Una **exception** es la forma clásica de Dart de decir "esto falló": se lanza con `throw` y viaja hacia arriba hasta que alguien la atrapa con `try/catch`. El proyecto declara las suyas en un archivo:

**Archivo:** `lib/core/error/exceptions.dart`

```dart
/// Low-level exceptions thrown inside the data layer.
///
/// These are implementation details and must never leak into the
/// presentation layer. Repositories catch them and map them to
/// [Failure]s (see `failure.dart`).
library;

/// Thrown when a network request cannot reach the server.
class NetworkException implements Exception {
  const NetworkException([this.message = 'Network error', this.cause]);

  final String message;
  final Object? cause;
```

- `library;` es una directiva suelta que permite colgar el comentario de documentación de arriba de todo el archivo, no de un elemento en particular. El comentario ya te adelanta la regla de oro: estas excepciones son un detalle interno y **nunca** deben llegar a la capa de presentación.
- `class NetworkException implements Exception` declara una clase que cumple el contrato `Exception` de Dart. `implements` (en vez de `extends`) dice "cumplo la interfaz", sin heredar implementación.
- `const NetworkException([this.message = 'Network error', this.cause]);` es el constructor. Los corchetes `[...]` son parámetros **posicionales opcionales**, y `this.message = ...` es azúcar de Dart: asigna el parámetro al campo del mismo nombre y le pone un valor por defecto. Se puede escribir `NetworkException()` o `NetworkException('sin red')`.
- `final String message` y `final Object? cause` son los dos datos del error: un texto y la causa original. `Object?` es "cualquier objeto o nada": así podés guardar el error de dio tal cual, sin perderlo, para el log.

Al lado hay una prima que agrega el código de estado:

**Archivo:** `lib/core/error/exceptions.dart`

```dart
/// Thrown when the server responds with a non-2xx status code.
class ServerException implements Exception {
  const ServerException({
    this.statusCode,
    this.message = 'Server error',
    this.cause,
  });

  final int? statusCode;
  final String message;
  final Object? cause;
```

Acá los parámetros son con nombre (`{...}`) porque son tres y conviene leerlos en la llamada: `ServerException(statusCode: 500, cause: e)`. `int? statusCode` es un entero que puede faltar, porque no todo error del servidor trae código. También existen `ParsingException` (el JSON no tenía la forma esperada) y `CacheException` (falló el almacenamiento local), con la misma idea.

### Failures: los errores de arriba

Las excepciones son cómodas pero tienen un problema: cualquiera que llame a una función puede olvidarse de atraparlas, y nada en la firma te avisa que esa función puede explotar. Por eso, en el borde entre datos y dominio, el proyecto las convierte en **failures**: valores que se devuelven, no se lanzan.

**Archivo:** `lib/core/error/failure.dart`

```dart
sealed class Failure {
  const Failure({required this.message, this.cause});

  /// A human-readable, user-safe message.
  final String message;

  /// The original error, kept for logging (never shown to users).
  final Object? cause;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Failure &&
          other.runtimeType == runtimeType &&
          other.message == message);

  @override
  int get hashCode => Object.hash(runtimeType, message);
```

- `sealed class Failure` es la base de la familia. `sealed` implica que no se puede heredar desde otro archivo: todas las variantes están a la vista, en este mismo archivo.
- `const Failure({required this.message, this.cause})` es el constructor protegido de la base. `required` quiere decir que `message` es obligatorio; `cause` es opcional.
- `message` es el texto pensado para el usuario y `cause` guarda el error original solo para el log. El comentario es explícito: la causa nunca se le muestra a nadie. Un mensaje como `SocketException: Connection refused` no le dice nada a una persona.
- `operator ==` redefine la comparación de igualdad: dos `Failure` son iguales si son del mismo tipo (`runtimeType`) y tienen el mismo `message`. `identical(this, other)` es el atajo para "es el mismo objeto en memoria". `hashCode` acompaña: si dos objetos son iguales, tienen que tener el mismo hash. Esto hace que en un test puedas escribir `expect(result, Err(NetworkFailure()))` y que pase.

Debajo vienen las variantes, cada una con su mensaje por defecto:

**Archivo:** `lib/core/error/failure.dart`

```dart
/// A failure caused by connectivity issues (timeouts, no internet).
final class NetworkFailure extends Failure {
  const NetworkFailure({
    super.message = 'No internet connection. Please try again.',
    super.cause,
  });
}

/// A failure returned by the server (non-2xx responses).
final class ServerFailure extends Failure {
  const ServerFailure({
    super.message = 'Something went wrong on our end.',
    this.statusCode,
    super.cause,
  });

  /// The HTTP status code, when available.
  final int? statusCode;
}
```

- `final class` en cada hija significa "esta clase no se puede extender más". La jerarquía queda cerrada en dos niveles y el compilador la conoce completa.
- `super.message = '...'` es la sintaxis de Dart para reenviar un parámetro al constructor del padre con otro valor por defecto. El usuario final no ve el `message` de la base sino este texto amable.
- `ServerFailure` suma `statusCode`, el código HTTP, para que quien quiera pueda distinguir un `500` de un `401` sin parsear strings.
- También están `DataFailure` (datos raros), `CacheFailure` (falló el almacenamiento) y `UnknownFailure` (lo que no encaja en ninguna). Cinco variantes, ni una más.

### Result: el sobre que lleva el valor o el error

Ya tenemos el error como tipo. Falta el transporte: una función que puede fallar, ¿qué devuelve? Un `Result<T>`.

**Archivo:** `lib/core/utils/result.dart`

```dart
sealed class Result<T> {
  const Result();

  /// Creates a successful result holding [value].
  const factory Result.ok(T value) = Ok<T>;

  /// Creates a failed result holding [failure].
  const factory Result.err(Failure failure) = Err<T>;

  /// Whether this result represents success.
  bool get isOk => this is Ok<T>;

  /// Whether this result represents failure.
  bool get isErr => this is Err<T>;
```

- `sealed class Result<T>`: la `T` entre ángulos es un **genérico**, un hueco que se llena al usarlo. `Result<List<Post>>` es un result que, si sale bien, lleva una lista de posts; `Result<Post>` lleva un post. Es el mismo mecanismo de `List<String>`, aplicado a tu propio tipo.
- `const factory Result.ok(T value) = Ok<T>;` es un **constructor factory de redirección**: no construye un `Result`, construye un `Ok<T>`. O sea, escribís `Result.ok(posts)` y obtenés un `Ok` con los posts adentro. `Result.err(failure)` hace lo mismo hacia `Err<T>`.
- `bool get isOk => this is Ok<T>;` es un *getter*: una propiedad calculada. `this is Ok<T>` pregunta por el tipo en tiempo de ejecución. Con eso la pantalla puede preguntar `result.isOk` sin hacer `switch`.
- `isErr` es lo mismo al revés. Ojo: es `Err<T>`, el nombre real, con dos erres y sin `or`.

Y el método que hace que todo esto sea cómodo de usar:

**Archivo:** `lib/core/utils/result.dart`

```dart
  R when<R>({
    required R Function(T value) ok,
    required R Function(Failure failure) err,
  }) {
    return switch (this) {
      Ok<T>(:final value) => ok(value),
      Err<T>(:final failure) => err(failure),
    };
  }
```

- `R when<R>({...})` es genérico en `R`, el tipo que devuelve. Si las dos ramas devuelven un `Widget`, `R` es `Widget`; si devuelven un `String`, es `String`.
- `required R Function(T value) ok` es un parámetro que es **una función**: le pasás un callback que recibe el valor y devuelve `R`. Lo mismo con `err`, que recibe un `Failure`.
- `switch (this) { ... }` es un **switch como expresión**: devuelve un valor, no hace falta `return` en cada rama.
- `Ok<T>(:final value) => ok(value)` es un patrón con **destructuring**. Se lee: "si esto es un `Ok<T>`, tomá su campo `value`, guardalo en una variable local `value` y devolvé `ok(value)`". Los dos puntos delante de `final` son la forma corta de decir "este campo del objeto, con este nombre".
- Como `Result` es `sealed`, el switch no necesita `default`: el compilador sabe que `Ok` y `Err` son los únicos casos. Si agregás un tercero, esto deja de compilar.

Las dos ramas son clases de verdad, con igualdad incluida:

**Archivo:** `lib/core/utils/result.dart`

```dart
final class Ok<T> extends Result<T> {
  const Ok(this.value);

  final T value;
```

**Archivo:** `lib/core/utils/result.dart`

```dart
final class Err<T> extends Result<T> {
  const Err(this.failure);

  final Failure failure;
```

`Ok<T>` guarda un `T` (el valor bueno) y `Err<T>` guarda un `Failure` (nunca una excepción: un failure). Las dos son `final class`, no se extienden, y las dos definen `==` y `hashCode` para que comparar en tests sea directo. En el medio de la clase hay además `valueOrNull`, `failureOrNull` y `map`, que siguen la misma idea: extraer o transformar sin `try/catch`.

### Cómo se usa esto sin try/catch en todos lados

La regla del proyecto, escrita en el comentario de `Result`, es preferir devolver un `Result` antes que lanzar excepciones cuando cruzás una frontera arquitectónica (repositorios, casos de uso). El resultado es que la persona que llama nunca escribe `try/catch`: mira el `Result`.

Un ejemplo real, la traducción de un failure a texto para el usuario:

**Archivo:** `lib/l10n/failure_l10n.dart`

```dart
extension FailureL10n on Failure {
  String localizedMessage(BuildContext context) {
    final l10n = context.l10n;
    return switch (this) {
      NetworkFailure() => l10n.errorNetwork,
      ServerFailure() => l10n.errorServer,
      DataFailure() => l10n.errorData,
      CacheFailure() => l10n.errorCache,
      UnknownFailure() => l10n.errorUnknown,
    };
  }
}
```

- `extension FailureL10n on Failure` agrega un método a un tipo que ya existe, sin tocarlo. Después de esto, cualquier `Failure` tiene `.localizedMessage(context)`.
- El `switch` cubre las cinco variantes y no tiene `default`. El comentario del archivo lo dice mejor que yo: el switch es exhaustivo porque `Failure` es `sealed`; agregás un failure nuevo y el compilador te obliga a traducirlo acá.
- `l10n` es el objeto de textos traducidos (lo ves en el capítulo de los textos en dos idiomas). Así el dominio no sabe de Flutter y la presentación decide las palabras.

En el capítulo de la pantalla de posts vas a ver la otra mitad: el controlador recibe un `Result`, y cuando es `Err` lanza el `Failure` para que el `AsyncValue` de Riverpod lo convierta en un estado de error que la vista dibuja. Vos no escribís un solo `try/catch` en la UI: escribís un `switch` que el compilador revisa.

### Resumen

- Una exception (`NetworkException`, `ServerException`, `ParsingException`, `CacheException`) se lanza y se atrapa; vive solo en la capa de datos y nunca se muestra.
- Un `Failure` es un valor, no un throw: cinco variantes `sealed` con `message` para el usuario y `cause` para el log.
- `Result<T>` envuelve el éxito (`Ok<T>`) o el fallo (`Err<T>`), y `when` te obliga a tratar los dos casos.
- `sealed` es lo que hace que todos los `switch` sean exhaustivos: agregar una variante rompe la compilación hasta que la manejes.
- El resultado es que la presentación no usa `try/catch`: usa `switch` y patrones.

## De la API al dominio: entidad, DTO y repositorio

Hasta acá tenés un cliente HTTP configurado y una forma de representar errores. Falta lo más importante: cómo los datos que llegan como texto JSON se convierten en objetos que el resto de la app entiende, y quién se hace cargo de ese viaje. En example_app ese viaje tiene tres estaciones y una regla: cada una hace una sola cosa.

Te lo cuento como un dibujo en palabras, de afuera hacia adentro del código:

1. **La API** devuelve JSON: una lista de mapas con `id`, `userId`, `title` y `body`.
2. **El data source** hace la request con dio y convierte cada mapa en un **DTO** (Data Transfer Object): un objeto que copia exactamente la forma del JSON, sin opiniones.
3. **El repositorio** convierte cada DTO en una **entidad** de dominio (`Post`), atrapa las excepciones y las transforma en `Result`.
4. **El dominio y la pantalla** solo ven entidades `Post`. Nunca un `Map`, nunca un `int statusCode`, nunca un JSON.

Esa separación es lo que hace que un cambio en la API duela en un solo lugar.

### La entidad: el post tal como lo entiende la app

**Archivo:** `lib/features/posts/domain/entities/post.dart`

```dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'post.freezed.dart';

/// A domain entity representing a post.
///
/// Entities are pure: they live in the domain layer, know nothing about JSON
/// or the network, and are immutable. Data-layer DTOs map *into* this type.
@freezed
abstract class Post with _$Post {
  const factory Post({
    required int id,
    required int userId,
    required String title,
    required String body,
  }) = _Post;
}
```

- `import 'package:freezed_annotation/freezed_annotation.dart';` trae el paquete `freezed`, que aporta la anotación `@freezed`.
- `part 'post.freezed.dart';` declara que este archivo tiene una **parte** generada. Las partes son pedazos del mismo archivo que viven en otro lado: acá, en el archivo que escribe la herramienta, no vos.
- `@freezed` es la anotación que le dice al generador "armame esta clase". Fijate que parece una anotación mágica pero es solo una marca: el trabajo lo hace el código generado.
- `abstract class Post with _$Post` mezcla el mixin `_$Post` (el guion bajo lo marca privado) que el generador crea en la parte. Ese mixin aporta `copyWith`, `==`, `hashCode` y `toString`.
- `const factory Post({...})` declara el constructor del objeto, con los cuatro campos. `required` quiere decir que ninguno es opcional: un `Post` sin `title` no existe.
- `= _Post;` le dice al generador que la implementación concreta se llama `_Post`. Vos usás `Post(...)` y por debajo se crea un `_Post` que cumple todo.
- El comentario lo resume: la entidad es pura, no sabe de JSON ni de red, y es **inmutable** (no se puede modificar después de creada; para "cambiarla" se usa `copyWith`, que devuelve una nueva).

### El DTO: la forma exacta del JSON

Un **DTO** es un objeto tonto que copia el formato del servidor. No tiene lógica de negocio; su único trabajo es leer el JSON sin romperse y ofrecer una conversión a la entidad.

**Archivo:** `lib/features/posts/data/models/post_dto.dart`

```dart
@freezed
abstract class PostDto with _$PostDto {
  const PostDto._();

  const factory PostDto({
    required int id,
    required int userId,
    required String title,
    required String body,
  }) = _PostDto;

  factory PostDto.fromJson(Map<String, dynamic> json) =>
      _$PostDtoFromJson(json);

  /// Maps this DTO to its domain [Post] entity.
  Post toEntity() => Post(id: id, userId: userId, title: title, body: body);
}
```

- Arriba están los dos `part`: `post_dto.freezed.dart` y `post_dto.g.dart`. Uno lo genera freezed, el otro `json_serializable`.
- `const PostDto._();` es un constructor privado vacío. Sirve para que freezed pueda agregar métodos propios a la clase; sin él, el generador se queja.
- `factory PostDto.fromJson(Map<String, dynamic> json)` es un constructor que recibe el mapa ya decodificado. `Map<String, dynamic>` significa "claves de texto, valores de cualquier tipo": exactamente lo que devuelve un JSON parseado.
- `=> _$PostDtoFromJson(json)` redirige al generador: la lógica de leer cada campo la escribe la herramienta, no vos. La flecha `=>` es un cuerpo de una sola expresión.
- `toEntity()` es la frontera: un método chiquito que devuelve un `Post` copiando los cuatro campos. Toda la traducción entre mundos pasa por acá. Si la API cambiara el nombre de un campo, tocás el DTO y este método, y nada más.

### Lo que genera build_runner

`post_dto.freezed.dart` y `post_dto.g.dart` son archivos reales en el repo, y los dos empiezan igual: `// GENERATED CODE - DO NOT MODIFY BY HAND`. No se editan a mano, se regeneran. Esto es lo que escribió `json_serializable`:

**Archivo:** `lib/features/posts/data/models/post_dto.g.dart`

```dart
_PostDto _$PostDtoFromJson(Map<String, dynamic> json) => _PostDto(
  id: (json['id'] as num).toInt(),
  userId: (json['userId'] as num).toInt(),
  title: json['title'] as String,
  body: json['body'] as String,
);
```

- `json['id']` busca la clave `id` en el mapa. `as num` es un **cast**: afirma "esto es un número". Después `.toInt()` lo vuelve `int`, porque un JSON puede traer `1` o `1.0` y dio/`json_decode` no distingue.
- `json['title'] as String` castea directo a texto. Si el servidor mandara `null` o un número en `title`, el cast explota con un `TypeError`.
- Cada campo se lee de una, sin validaciones amables. Eso está bien: la validación no es trabajo del DTO, y el que llama ya envuelve todo en un `try` para convertirlo en `ParsingException` (lo ves en un rato).

Como esos archivos son generados, el proyecto no los escribe a mano: los produce `build_runner`, la herramienta de Dart que corre los generadores de código. El `Makefile` tiene el comando:

**Archivo:** `Makefile`

```make
gen: ## Run build_runner once (freezed / json_serializable)
	dart run build_runner build
```

`make gen` ejecuta `dart run build_runner build`, que recorre el proyecto, encuentra los `@freezed` y los `fromJson`, y escribe los `.freezed.dart` y `.g.dart` que falten. Si estás editando modelos, `make watch` corre lo mismo en modo vigilancia y regenera al guardar. Cuando clonás el proyecto, `make setup` corre `get`, `gen` y `l10n` juntos.

### El data source: el único que conoce dio y los endpoints

**Archivo:** `lib/features/posts/data/datasources/post_remote_data_source.dart`

```dart
abstract interface class PostRemoteDataSource {
  Future<List<PostDto>> fetchPosts();
  Future<PostDto> fetchPost(int id);
}
```

- `abstract interface class` es la forma de Dart 3 de decir "esto es solo un contrato, sin implementación". El dominio y las pruebas dependen de este contrato, no de la clase concreta.
- `Future<List<PostDto>>` es una promesa de una lista de DTOs *en el futuro*. `Future` es el tipo de Dart para algo asincrónico: todavía no lo tenés, lo vas a tener. Por eso cada llamada se espera con `await`.
- `fetchPost(int id)` devuelve un solo DTO y recibe el id.

La implementación es donde aparecen dio y las URLs:

**Archivo:** `lib/features/posts/data/datasources/post_remote_data_source.dart`

```dart
  @override
  Future<List<PostDto>> fetchPosts() async {
    final response = await _guard(() => _dio.get<List<dynamic>>('/posts'));
    try {
      return (response.data ?? [])
          .cast<Map<String, dynamic>>()
          .map(PostDto.fromJson)
          .toList();
    } catch (e, s) {
      throw ParsingException('Failed to parse posts', (e, s));
    }
  }
```

- `async` marca la función como asincrónica: adentro podés usar `await`.
- `await _guard(() => _dio.get<List<dynamic>>('/posts'))` le pasa a `_guard` una función que hace el GET. La ruta es relativa porque la base ya está en `BaseOptions`. `List<dynamic>` le dice a dio que espere una lista de cualquier cosa: todavía es JSON crudo.
- `response.data ?? []` toma el cuerpo y, si viniera `null`, usa una lista vacía en su lugar (`??` es "si es null, esto otro").
- `.cast<Map<String, dynamic>>()` afirma que cada elemento de esa lista es un mapa. `.map(PostDto.fromJson)` pasa cada mapa por el constructor de arriba, y `.toList()` arma la lista final. En tres líneas: JSON a DTOs.
- `catch (e, s)` atrapa el error y su **stack trace** (`s`, la lista de llamadas que llevaron al error, oro puro para debuggear), y lanza `ParsingException` con los dos guardados adentro. `throw` corta la función.

Y `_guard`, que traduce los problemas de dio a excepciones del proyecto:

**Archivo:** `lib/features/posts/data/datasources/post_remote_data_source.dart`

```dart
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.connectionError) {
        throw NetworkException(e.message ?? 'Network error', e);
      }
      throw ServerException(
        statusCode: e.response?.statusCode,
        message: e.message ?? 'Server error',
        cause: e,
      );
    }
```

- `on DioException catch (e)` atrapa solo el error de dio; cualquier otra cosa sigue subiendo.
- El `if` separa los cuatro tipos que significan "no llegué al servidor" (los tres timeouts y el error de conexión) y los convierte en `NetworkException`.
- Todo lo demás se convierte en `ServerException`, con el código de estado si lo hay (`e.response?.statusCode`: el `?.` corta si `response` es null).
- `e` se pasa como `cause` en los dos casos: el error original queda guardado para el log.

Falta el pedazo que ya viste en el capítulo de `dio`: como `validateStatus` deja pasar los `4xx`, hay que revisar el código a mano.

**Archivo:** `lib/features/posts/data/datasources/post_remote_data_source.dart`

```dart
    final status = response.statusCode ?? 0;
    if (status < 200 || status >= 300) {
      throw ServerException(
        statusCode: status,
        message: 'Request failed with status $status',
      );
    }
    return response;
```

Si el código no está entre `200` y `299`, lanza `ServerException`. Si está, devuelve la respuesta y sigue el camino feliz. Esa es toda la política de errores de red del proyecto, escrita en un solo lugar.

### El repositorio: contrato en el dominio, implementación en datos

**Archivo:** `lib/features/posts/domain/repositories/post_repository.dart`

```dart
abstract interface class PostRepository {
  /// Fetches the list of posts.
  Future<Result<List<Post>>> getPosts();

  /// Fetches a single post by [id].
  Future<Result<Post>> getPost(int id);
}
```

Este archivo vive en `domain/` y no importa dio, ni JSON, ni nada de infraestructura: solo `Result` y `Post`. Fijate lo que devuelve: `Future<Result<List<Post>>>`, o sea "en el futuro, un result que contiene una lista de entidades". Ni excepciones ni DTOs en la firma. Esa es la **inversión de dependencias**: el dominio define el contrato y la capa de datos se adapta a él, no al revés. Por eso el dominio se puede probar sin red.

La implementación está en `data/` y es la que hace el trabajo sucio:

**Archivo:** `lib/features/posts/data/repositories/post_repository_impl.dart`

```dart
  @override
  Future<Result<List<Post>>> getPosts() {
    return _run(() async {
      final dtos = await _remote.fetchPosts();
      return dtos.map((dto) => dto.toEntity()).toList();
    });
  }
```

- `return _run(...)` delega todo al ayudante `_run`, que veremos abajo.
- Adentro del closure: pide los DTOs al data source, y mapea cada DTO a su entidad con `toEntity()`. El tipo que devuelve es `List<Post>`, no `List<PostDto>`.
- Ojo con la diferencia: acá no hay `try`. El repositorio no decide qué hacer con el error, solo lo envuelve.

**Archivo:** `lib/features/posts/data/repositories/post_repository_impl.dart`

```dart
  /// Executes [action], mapping known exceptions to [Failure]s.
  Future<Result<T>> _run<T>(Future<T> Function() action) async {
    try {
      return Result.ok(await action());
    } on NetworkException catch (e) {
      return Result.err(NetworkFailure(cause: e.cause));
    } on ServerException catch (e) {
      return Result.err(
        ServerFailure(statusCode: e.statusCode, cause: e.cause),
      );
    } on ParsingException catch (e) {
      return Result.err(DataFailure(cause: e.cause));
    } catch (e, s) {
```

- `_run<T>(Future<T> Function() action)` es genérico: sirve para una lista de posts o para un post solo. Recibe **una función** que devuelve un `Future<T>` y no recibe argumentos.
- `try { return Result.ok(await action()); }` es el camino feliz: ejecuta la acción y envuelve el valor en `Ok`.
- Cada `on ... catch` traduce una excepción a su failure. `NetworkException` se vuelve `NetworkFailure`, `ServerException` se vuelve `ServerFailure` conservando `statusCode`, `ParsingException` se vuelve `DataFailure`. El `cause` viaja para el log.
- El `catch (e, s)` final atrapa lo imprevisto, lo loguea con stack trace y devuelve `UnknownFailure`. El `result` de ese bloque es lo que cierra el método.

Resultado: de este archivo para arriba nadie sabe que existió dio, ni un `404`, ni un `TypeError` al parsear. Lo único que viaja es un `Result` con entidades o un `Failure` tipado. Si mañana la API cambia `userId` por `author_id`, tocás el DTO, `toEntity` y listo: la pantalla ni se entera.

### Resumen

- La API habla JSON; el DTO lo copia campo por campo con `fromJson`; la entidad `Post` es lo que circula por el resto de la app.
- `@freezed` genera `copyWith`, `==`, `hashCode` y `toString`; `json_serializable` genera el `fromJson`. Los dos escriben en `post_dto.freezed.dart` y `post_dto.g.dart`, que se regeneran con `make gen` (`dart run build_runner build`).
- El data source es el único que conoce dio y los endpoints, y traduce los errores de transporte a `NetworkException`, `ServerException` o `ParsingException`.
- El repositorio tiene el contrato en `domain/` y la implementación en `data/`; `_run` convierte excepciones en `Failure`s dentro de un `Result`.
- Cambiar la forma de la API toca solo el DTO y su mapeo, no las pantallas.

## Casos de uso y providers: la pantalla de posts

Ya tenés el camino completo hasta el dominio. Falta la última parte: quién pide los datos, quién los guarda mientras la pantalla vive, y cómo se dibuja una lista que puede estar cargando, fallar o traer datos. Ese es el trabajo de los casos de uso, los providers de Riverpod y una pantalla que no tiene un solo `if` de estado.

### Qué agrega un caso de uso

Un **caso de uso** es una clase que representa una acción del negocio: "traer los posts", "traer un post". Suena a una capa de más, y en este proyecto es finita a propósito.

**Archivo:** `lib/features/posts/domain/usecases/get_posts.dart`

```dart
class GetPosts {
  const GetPosts(this._repository);

  final PostRepository _repository;

  Future<Result<List<Post>>> call() async {
    final result = await _repository.getPosts();
    // Example of a business rule living in the domain layer: newest first.
    return result.map(
      (posts) => [...posts]..sort((a, b) => b.id.compareTo(a.id)),
    );
  }
}
```

- `const GetPosts(this._repository);` recibe el repositorio por constructor y lo guarda en `_repository`. El guion bajo es la convención de Dart para "privado de esta biblioteca": nadie de afuera lo toca.
- `Future<Result<List<Post>>> call() async` define el método `call`. Ese nombre es especial en Dart: permite usar el objeto como si fuera una función, o sea `getPosts()` en vez de `getPosts.execute()`. Por eso más adelante ves `await getPosts();` sin más.
- `await _repository.getPosts()` pide los datos. Fijate que el tipo ya es `Result<List<Post>>`.
- Y acá está el motivo de existir del caso de uso: `result.map((posts) => ...)`. `map` transforma el valor si es `Ok` y deja pasar el `Failure` intacto. La transformación es una regla de negocio: `[...posts]` copia la lista (no querés ordenar la original) y `..sort(...)` la ordena con una comparación por `id` descendente. Posts nuevos primero, decidido en el dominio, no en la pantalla.
- En una app chica esto alcanzaría para llamar al repositorio directo. Pero cuando la regla crece (combinar dos repositorios, filtrar por usuario, cachear), ya tenés dónde ponerla sin engordar la pantalla ni el repositorio.

El otro caso de uso es de una línea, y está bien que lo sea:

**Archivo:** `lib/features/posts/domain/usecases/get_post.dart`

```dart
class GetPost {
  const GetPost(this._repository);

  final PostRepository _repository;

  Future<Result<Post>> call(int id) => _repository.getPost(id);
}
```

No hay regla que aplicar, así que delega. Igual existe, porque la pantalla merece hablar siempre con la misma capa: hoy es un pasamanos, mañana puede guardar en caché o marcar el post como leído, y el cambio no toca la UI. `call(int id)` recibe el id y devuelve el mismo `Future<Result<Post>>` del repositorio.

### El cableado: providers uno arriba del otro

Acá es donde las capas se conectan. El archivo es el **composition root** de la feature: el único lugar que sabe qué implementación concreta usa cada contrato.

**Archivo:** `lib/features/posts/presentation/providers/posts_providers.dart`

```dart
final postRemoteDataSourceProvider = Provider<PostRemoteDataSource>((ref) {
  return PostRemoteDataSourceImpl(ref.watch(dioProvider));
});

final postRepositoryProvider = Provider<PostRepository>((ref) {
  return PostRepositoryImpl(ref.watch(postRemoteDataSourceProvider));
});

final getPostsProvider = Provider<GetPosts>((ref) {
  return GetPosts(ref.watch(postRepositoryProvider));
});

final getPostProvider = Provider<GetPost>((ref) {
  return GetPost(ref.watch(postRepositoryProvider));
});
```

- `Provider<PostRemoteDataSource>` declara que este provider produce *el contrato*, no la clase concreta. Quien lo lea no sabe (ni le importa) que atrás hay `PostRemoteDataSourceImpl`.
- `ref.watch(dioProvider)` pide el cliente compartido del capítulo anterior. `watch` significa "dame el valor y, si cambia, avisame": si alguien reemplaza el `Dio`, este provider se rehace.
- `PostRemoteDataSourceImpl(...)` es la clase que implementa el contrato, con dio adentro.
- `PostRepositoryImpl(ref.watch(postRemoteDataSourceProvider))` arma el repositorio con ese data source. `GetPosts` y `GetPost` se arman con el repositorio.
- La cadena de lecturas es la cadena de dependencias: `dio → data source → repository → use case`. Cada eslabón se puede reemplazar en un test sin tocar los demás, que es exactamente lo que dice el comentario del archivo.

### El controlador: el que guarda el estado de la lista

Un caso de uso devuelve un `Future<Result<...>>` una sola vez. La pantalla, en cambio, necesita un estado que persista: "está cargando", "falló", "acá están los posts". Eso es un **notifier** de Riverpod.

**Archivo:** `lib/features/posts/presentation/providers/posts_providers.dart`

```dart
class PostsController extends AsyncNotifier<List<Post>> {
  @override
  Future<List<Post>> build() => _load();

  Future<List<Post>> _load() async {
    final getPosts = ref.read(getPostsProvider);
    final result = await getPosts();
    return switch (result) {
      Ok<List<Post>>(:final value) => value,
      Err<List<Post>>(:final failure) => throw failure,
    };
  }
```

- `extends AsyncNotifier<List<Post>>` hereda un notifier cuyo estado es asincrónico y contiene una lista de posts. Por debajo, Riverpod guarda un `AsyncValue<List<Post>>`: un tipo que sabe si está cargando, si tiene datos o si falló.
- `Future<List<Post>> build()` es el método que Riverpod llama la primera vez que alguien mira el estado (y cada vez que una dependencia cambia). Devolver un `Future` es lo que hace que el estado arranque en "cargando".
- `ref.read(getPostsProvider)` pide el caso de uso **una vez**, sin suscribirse a cambios. `read` es para acciones puntuales; `watch` es para dependencias de las que querés rebuild.
- `await getPosts()` lo llama. Acá se ve lo del `call`: el objeto se usa como función.
- El `switch` es la frontera entre dominio y presentación: si el `Result` es `Ok`, devuelve el valor y el estado pasa a "datos"; si es `Err`, **lanza el `Failure`**. No es un retroceso: Riverpod atrapa esa excepción y la guarda como estado de error, que es lo que la vista va a mostrar. El resultado neto es que la UI no escribe `try/catch`.

Y la acción de recargar:

**Archivo:** `lib/features/posts/presentation/providers/posts_providers.dart`

```dart
  Future<void> refresh() async {
    state = await AsyncValue.guard(_load);
  }
}

final postsControllerProvider =
    AsyncNotifierProvider<PostsController, List<Post>>(PostsController.new);
```

- `refresh()` no devuelve datos: dispara una recarga y actualiza el estado.
- `AsyncValue.guard(_load)` es un ayudante de Riverpod: corre `_load`, captura cualquier error y te devuelve un `AsyncValue` que refleja el resultado. En una línea: "probá esto y guardá lo que salga, bueno o malo".
- `AsyncNotifierProvider<PostsController, List<Post>>(PostsController.new)` publica el controlador para que la pantalla lo lea. `PostsController.new` es la referencia al constructor, la forma de pasar "cómo se crea" sin crear nada todavía.

El último provider es el de la pantalla de detalle:

**Archivo:** `lib/features/posts/presentation/providers/posts_providers.dart`

```dart
final postDetailProvider = FutureProvider.autoDispose.family<Post, int>((
  ref,
  id,
) async {
  final result = await ref.watch(getPostProvider)(id);
  return switch (result) {
    Ok<Post>(:final value) => value,
    Err<Post>(:final failure) => throw failure,
  };
});
```

- `FutureProvider` es el provider más simple para algo asincrónico: no tiene métodos, solo produce un `Future`.
- `.autoDispose` dice "cuando nadie lo esté mirando, olvidate del estado". Al cerrar la pantalla de detalle, el post se libera.
- `.family<Post, int>` lo parametriza: hay un provider distinto por cada `id`. Ese `id` es el segundo parámetro de la función.
- `ref.watch(getPostProvider)(id)` pide el caso de uso y lo llama con el id, todo en una expresión. El `switch` vuelve a hacer la traducción `Result` → valor o throw.

### La pantalla: tres estados sin un solo `if` de estado

Flutter dibuja con **widgets**: objetos que describen un pedazo de pantalla. Una pantalla que muestra datos asincrónicos tiene que cubrir tres casos —cargando, error, datos— y ahí es donde la mayoría de los proyectos se llena de `if` anidados.

example_app lo resuelve con un widget compartido que todo el proyecto reusa:

**Archivo:** `lib/core/widgets/async_value_view.dart`

```dart
  @override
  Widget build(BuildContext context) {
    return value.when(
      // Keep showing the previous data while a refresh is in flight, so the
      // screen doesn't flash a full-screen spinner over existing content.
      skipLoadingOnRefresh: true,
      data: data,
      loading: () => Center(
        child: CircularProgressIndicator(
          strokeWidth: 2,
          color: context.palette.accent,
        ),
      ),
      error: (error, _) => ErrorView(
        message: error is Failure
            ? error.localizedMessage(context)
            : error.toString(),
        onRetry: onRetry,
      ),
    );
  }
```

- `AsyncValueView<T> extends StatelessWidget` es un widget genérico: `T` es el tipo del dato que va a mostrar. `StatelessWidget` es un widget sin estado propio; se redibuja cuando cambian sus campos.
- Sus tres campos son `value` (el `AsyncValue`), `data` (una función que recibe el dato y devuelve un widget) y `onRetry` (un callback opcional).
- `value.when(...)` es el método de `AsyncValue` que obliga a dar las tres ramas. No hay forma de olvidarse de una.
- `skipLoadingOnRefresh: true` es el detalle fino: mientras se recarga, seguí mostrando los datos viejos en vez de tapar todo con un spinner.
- `data: data` pasa el callback tal cual: cuando hay datos, se ejecuta la función que le pasó la pantalla.
- `loading:` devuelve un `CircularProgressIndicator` centrado, con el color de acento del sistema de diseño. Es el spinner, en un solo lugar para toda la app.
- `error:` recibe el error y el stack trace (el `_` ignora el segundo). Si el error es un `Failure`, usa el mensaje traducido con `localizedMessage`; si no, cae a `toString()`. Después lo muestra con `ErrorView`, que trae el ícono y el botón de reintentar.
- `context.palette` es un atajo del sistema de diseño para los colores del tema; viene en el capítulo del diseño.

Ahora sí, la pantalla completa:

**Archivo:** `lib/features/posts/presentation/pages/posts_page.dart`

```dart
      body: AsyncValueView(
        value: ref.watch(postsControllerProvider),
        onRetry: () => ref.read(postsControllerProvider.notifier).refresh(),
        data: (posts) {
          if (posts.isEmpty) {
            return EmptyView(
              message: l10n.emptyPosts,
              icon: Icons.article_outlined,
            );
          }
```

- `PostsPage extends ConsumerWidget` (lo ves un poco más arriba en el archivo) es un widget que puede leer providers: por eso su `build` recibe `context` y `ref`.
- `ref.watch(postsControllerProvider)` devuelve el `AsyncValue<List<Post>>` actual. Cada vez que cambia, la pantalla se redibuja. Esa es toda la reactividad: no hay `setState`, no hay listeners a mano.
- `onRetry` usa `ref.read(...notifier)` para obtener el controlador y llamar a `refresh()`. `notifier` es el objeto `PostsController` que está detrás del provider.
- `data: (posts) {` recibe la lista **ya desenvuelta**: cuando esta función corre, los datos existen. Por eso el único `if` que queda es de negocio (`posts.isEmpty`), no de estado. Eso es lo que evita el spaghetti.
- `EmptyView` es el widget compartido para "no hay nada", con ícono y mensaje traducido.

**Archivo:** `lib/features/posts/presentation/pages/posts_page.dart`

```dart
          return RefreshIndicator(
            color: palette.accent,
            backgroundColor: palette.bgElevated,
            onRefresh: () =>
                ref.read(postsControllerProvider.notifier).refresh(),
            child: ListView.separated(
              padding: const EdgeInsets.all(AppSpacing.md),
              itemCount: posts.length,
              separatorBuilder: (context, index) => const Gap(AppSpacing.sm),
              itemBuilder: (context, index) {
                final post = posts[index];
                return PostTile(
                  post: post,
                  onTap: () => context.pushNamed(
                    AppRoute.postDetail.name,
                    pathParameters: {'id': '${post.id}'},
                  ),
                );
              },
            ),
          );
```

- `RefreshIndicator` es el gesto de "tirá para abajo para recargar". Su `onRefresh` devuelve un `Future`, así que el spinner del gesto dura hasta que la recarga termina.
- `ListView.separated` es una lista eficiente: solo construye los ítems que se ven. `itemCount` le dice cuántos hay.
- `separatorBuilder` es la función que dibuja lo que va entre un ítem y el siguiente; acá un `Gap`, que es un espacio del sistema de diseño.
- `itemBuilder` recibe la posición y devuelve el widget de ese ítem. Dentro: toma el post y arma un `PostTile`.
- `context.pushNamed(AppRoute.postDetail.name, pathParameters: {'id': '${post.id}'})` navega a la pantalla de detalle llevando el id en la ruta. `'${post.id}'` convierte el número a texto porque los parámetros de ruta son strings. `push` apila la pantalla nueva, así que el botón de volver te trae de vuelta.

Y el ítem, que es un widget tonto sin estado:

**Archivo:** `lib/features/posts/presentation/widgets/post_tile.dart`

```dart
    return AppCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.l10n.postAuthor(post.userId).toUpperCase(),
            style: AppTypography.sectionLabel(palette.textFaint),
          ),
          const Gap(AppSpacing.xs),
          Text(
            post.title,
            style: theme.textTheme.titleMedium,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
```

- `PostTile extends StatelessWidget` recibe `post` y `onTap`. No consulta providers ni sabe de red: recibe una entidad y la dibuja. Eso lo hace reutilizable y trivial de probar.
- `AppCard` es la tarjeta del sistema de diseño, y `onTap` la vuelve clickeable.
- `Column` apila los hijos de arriba hacia abajo; `crossAxisAlignment: CrossAxisAlignment.start` los alinea a la izquierda.
- `context.l10n.postAuthor(post.userId).toUpperCase()` arma la línea de autor con un texto traducido que recibe el id, y lo pasa a mayúsculas. `AppTypography.sectionLabel` es el estilo de etiqueta chiquita del diseño.
- `maxLines: 2` y `overflow: TextOverflow.ellipsis` cortan el título a dos líneas con puntos suspensivos. El cuerpo hace lo mismo con tres líneas.

### La pantalla de detalle, en dos palabras

El detalle es la contracara del listado: en vez de un controlador, un `FutureProvider.family` que recibe el id; en vez de una lista, una columna con autor, título, una línea y cuerpo.

**Archivo:** `lib/features/posts/presentation/pages/post_detail_page.dart`

```dart
      body: AsyncValueView(
        value: ref.watch(postDetailProvider(postId)),
        onRetry: () => ref.invalidate(postDetailProvider(postId)),
        data: (post) => SingleChildScrollView(
```

Mismo widget de estados, mismo `onRetry`. La diferencia es `ref.watch(postDetailProvider(postId))`: como el provider es `family`, se le pasa el id y cada post tiene su propio estado. Para reintentar no hay método que llamar: `ref.invalidate(postDetailProvider(postId))` tira el estado guardado y obliga a recargar. `SingleChildScrollView` permite que el contenido scrollee si no entra en la pantalla.

### Resumen

- Un caso de uso es una clase con `call()`: ahí viven las reglas de negocio (como ordenar los posts) y la pantalla habla solo con esa capa.
- Los providers se encadenan con `ref.watch`: `dio → data source → repository → use case`, y cada eslabón se puede reemplazar en un test.
- `PostsController extends AsyncNotifier<List<Post>>` guarda el `AsyncValue`; `_load` convierte `Ok` en datos y `Err` en un error lanzado, que Riverpod captura.
- `AsyncValueView` centraliza cargando, error y datos con `value.when`, así la pantalla solo escribe el caso "hay datos".
- `ref.watch` redibuja cuando cambia el estado; `ref.read` es para disparar acciones como `refresh()` o `invalidate`.


## Autenticación: auth_controller y login_page

Ya recorriste widgets, estado, diseño y red. Este capítulo junta todo eso en la pantalla que toda app tiene: la de inicio de sesión. Vas a leer dos archivos de `lib/features/auth/` y uno de `lib/core/storage/`, y vas a ver cómo un formulario, un booleano y un almacenamiento cifrado terminan siendo un flujo de login completo.

Autenticación, en criollo, es responder una sola pregunta: ¿quién sos? Y para responderla hacen falta dos cosas distintas. Una es la *credencial* —usuario y contraseña, o un token que el servidor te dio antes—. La otra es el *estado*: una vez que la app sabe quién sos, tiene que acordarse mientras navegás de una pantalla a otra. Este capítulo trata de las dos, y el proyecto las separa con una claridad que vale la pena imitar.

Antes de entrar en el código, una aclaración que el propio proyecto hace en voz alta: **example_app no tiene backend**. No hay servidor, no hay token real, no hay usuario. `AuthController` guarda un solo booleano —¿hay alguien adentro o no?— y el router de go_router lo mira para decidir a dónde mandarte. Eso no es una trampa: es la parte difícil resuelta, con lo que depende de tu servidor aislado en un método que después vas a reemplazar.

### El estado de sesión: un booleano con nombre

**Archivo:** `lib/features/auth/presentation/auth_controller.dart`

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Holds the (very simplified) authentication state: whether a user is signed
/// in. The router watches this to guard routes and redirect.
///
/// This template ships **no real authentication** — [login] just flips the
/// flag so you can see the navigation flow. Replace the body with real calls
/// (and persist a token via `SecureStore`) when you wire up a backend.
class AuthController extends Notifier<bool> {
  @override
  bool build() => false;

  /// Marks the user as signed in.
  void login() => state = true;

  /// Signs the user out.
  void logout() => state = false;
}

/// `true` when a user is signed in.
final authControllerProvider = NotifierProvider<AuthController, bool>(
  AuthController.new,
);
```

Leelo de arriba hacia abajo. `Notifier<bool>` es una clase de Riverpod que envuelve un valor de tipo `bool` y se encarga de avisar a la interfaz cuando ese valor cambia. `build()` es el método que Riverpod llama una sola vez para saber con qué valor se arranca; acá devuelve `false`, o sea, nadie está logueado cuando abrís la app.

`state` es la variable mágica que heredás de `Notifier`: escribirle un valor nuevo dentro de `login()` o `logout()` es lo que dispara el redibujado de todo lo que esté mirando el provider. No hay `setState`, no hay listeners manuales: `state = true` y listo.

El comentario de la clase dice algo importante y conviene subrayarlo: "Replace the body with real calls". Los cuerpos de `login()` y `logout()` son de una línea porque todavía no hay nada que hacer. Cuando conectes un servidor, `login()` va a ser una función `async` que hace un POST, guarda el token y recién ahí pone el estado en `true`. La interfaz no se entera de nada: sigue leyendo un booleano.

`authControllerProvider` es el nombre con el que el resto de la app se refiere a este estado. `NotifierProvider<AuthController, bool>` dice dos cosas: quién fabrica el notifier (`AuthController.new`, una referencia al constructor) y qué tipo expone (`bool`). Si venís del capítulo del estado con Riverpod, esto te va a resultar familiar: es el mismo patrón que el contador, con tres métodos en lugar de cuatro.

Lo importante para este capítulo: el booleano no es el login. Es la *conclusión* del login. La sesión, el token, la expiración y el refresco son detalles que viven del otro lado de `login()`, y el proyecto los deja explícitamente como tarea tuya.

Una consecuencia práctica de ese diseño: `AuthController` no sabe nada de pantallas. Lo puede leer el router, lo puede leer un test con `ProviderContainer` y lo lee la pestaña de perfil, que es donde el proyecto llama a `logout()`. Nada de eso arrastra un widget. Y el día que conectes tu backend, el estado va a seguir significando lo mismo: hay sesión o no hay sesión.

### El formulario: Form, GlobalKey y TextEditingController

**Archivo:** `lib/features/auth/presentation/login_page.dart`

```dart
class _LoginPageState extends ConsumerState<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController(text: 'demo@example.com');
  final _passwordController = TextEditingController(text: 'password');
  bool _submitting = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
```

`ConsumerStatefulWidget` (arriba de este bloque) es la versión con estado de un widget que además puede leer providers; `_LoginPageState` es la clase companion donde vive ese estado. Lo de "stateful" significa que este widget guarda cosas que cambian mientras la pantalla está viva.

`GlobalKey<FormState>` es una llave que te permite, desde código, llegar hasta un widget `Form` concreto y pedirle cosas: en este caso, `validate()`. Sin la llave no tendrías cómo hablarle al formulario desde `_submit`. Es un identificador único para un widget dentro de un árbol que puede tener miles.

`TextEditingController` es el objeto que guarda el texto de un campo y te deja leerlo o escribirle. Acá se crean dos, con valores iniciales de demo (`demo@example.com` y `password`) para que puedas tocar el botón sin tipear nada. Un `Form` es el widget contenedor: agrupa varios campos y, cuando le pedís validar, recorre los `validator` de todos sus hijos de una sola vez.

`bool _submitting = false` no viene de Flutter: es una variable tuya que va a controlar el estado de carga. Y `dispose()` es el método que Flutter llama cuando el widget se va de la pantalla. Los controladores son recursos que hay que liberar; si no los liberás, quedan colgados en memoria. La regla es simple: todo lo que creás como `TextEditingController` se destruye en `dispose()`, antes del `super.dispose()`.

### La pantalla: un formulario centrado

Antes de los campos, mirá cómo está armada la estructura que los contiene. Casi todo el diseño de una pantalla en Flutter es esta clase de anidamiento:

**Archivo:** `lib/features/auth/presentation/login_page.dart`

```dart
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: AppReveal(
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
```

`Scaffold` es el esqueleto de una pantalla: aporta el fondo, la barra superior si la hay, y el espacio donde va el contenido. `SafeArea` corre el contenido lejos del notch y de la barra de gestos, esos recortes físicos del teléfono. `Center` centra a su hijo.

`SingleChildScrollView` permite scrollear cuando el contenido no entra, que es lo que pasa en un teclado abierto en pantallas chicas. `ConstrainedBox` con `maxWidth: 420` es un detalle de diseño editorial: en una tablet o en el navegador, el formulario no se estira hasta el infinito, se queda en un ancho cómodo de leer.

`AppReveal` es un widget del kit que hace una entrada suave de 12 píxeles, el movimiento de la casa. Y ahí adentro, por fin, `Form` con `key: _formKey` —la llave de arriba— y un `Column` con `crossAxisAlignment: CrossAxisAlignment.stretch`, que estira todos los hijos al ancho del formulario. No hay nada exótico: es una caja dentro de otra caja, once veces.

Un detalle de vocabulario que conviene fijar ahora: en Flutter no hay "pantallas" ni "vistas" en el sentido de otros frameworks. Todo es un widget, y lo que llamamos pantalla es simplemente la raíz de un árbol de widgets. `Scaffold` no es la pantalla: es el andamiaje que la pantalla usa. Por eso `LoginPage` es un widget que devuelve un `Scaffold` que devuelve un `SafeArea` que devuelve un `Center`... y así hasta el último `Text`.

El espaciado también viene del sistema de diseño, nunca de un número suelto:

**Archivo:** `lib/features/auth/presentation/login_page.dart`

```dart
                      const Gap(AppSpacing.xl),
                      Text(
                        l10n.loginTitle,
                        style: theme.textTheme.displaySmall,
                      ),
```

`Gap` es un widget del kit que inserta aire entre dos cosas, y `AppSpacing.xl` es el token que define cuánto. En lugar de escribir `SizedBox(height: 32)` en cada lugar, el proyecto nombra las distancias una sola vez, como viste en el capítulo del sistema de diseño. El `Text` de al lado usa `theme.textTheme.displaySmall`, otro token, este de tipografía: el título se ve grande porque el sistema de diseño dijo que los títulos son grandes.

### Los validadores y la contraseña oculta

**Archivo:** `lib/features/auth/presentation/login_page.dart`

```dart
                      AppTextField(
                        label: l10n.emailLabel,
                        controller: _emailController,
                        prefixIcon: Icons.email_outlined,
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        validator: (value) =>
                            (value == null || !value.contains('@'))
                            ? l10n.emailInvalid
                            : null,
                      ),
```

`AppTextField` es un widget del kit compartido que envuelve un `TextFormField` de Material con la estética de la casa. `controller` conecta el campo con el controlador que creaste arriba; `prefixIcon` es el ícono de la izquierda.

`keyboardType: TextInputType.emailAddress` le pide al sistema operativo el teclado con arroba y dominio. `textInputAction: TextInputAction.next` cambia la tecla Enter del teclado por una flecha que salta al campo siguiente: detalles chicos que hacen que el formulario se sienta nativo.

El `validator` es una función que recibe el texto (o `null` si el campo está vacío) y devuelve un mensaje de error o `null` si está todo bien. Acá la regla es floja a propósito: si no tiene arroba, `l10n.emailInvalid`. Ojo con el detalle: el texto del error no está escrito en el archivo, viene de la localización. De eso se ocupa el capítulo de textos en dos idiomas.

Cuando devolvés un mensaje, Flutter lo dibuja debajo del campo y el `Form` queda marcado como inválido. No tenés que mostrar ni esconder nada a mano: el mensaje es el valor de retorno.

Un `validator` es una función pura: recibe un texto y devuelve un mensaje o `null`. No toca la red, no toca el estado, no sabe de qué formulario es. Esa pureza es lo que la hace fácil de probar: un test unitario puede llamarla directamente, sin montar ninguna pantalla, como propone el capítulo de pruebas.

Y una costumbre que vale la pena copiar: los dos controladores arrancan con valores de demo para que el flujo se pueda ver sin tipear. En una app real esos `text:` desaparecen y los campos empiezan vacíos.

**Archivo:** `lib/features/auth/presentation/login_page.dart`

```dart
                      AppTextField(
                        label: l10n.passwordLabel,
                        controller: _passwordController,
                        prefixIcon: Icons.lock_outline,
                        obscurable: true,
                        textInputAction: TextInputAction.done,
                        onSubmitted: (_) => _submit(),
                        validator: (value) =>
                            (value == null || value.length < 4)
                            ? l10n.passwordTooShort
                            : null,
                      ),
```

El campo de contraseña agrega dos cosas. `obscurable: true` activa el comportamiento de contraseña: el texto se ve como puntos y aparece un ícono de ojo para mostrarlo. Y `onSubmitted` cierra el teclado y llama a `_submit()`, o sea, el Enter del teclado también inicia sesión. El validador exige al menos cuatro caracteres.

¿De dónde sale ese `obscurable`? De `AppTextField`, que lo resuelve con un `State` propio:

**Archivo:** `lib/core/widgets/app_text_field.dart`

```dart
class _AppTextFieldState extends State<AppTextField> {
  late bool _obscured = widget.obscurable;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final palette = context.palette;

    return TextFormField(
      controller: widget.controller,
      obscureText: _obscured,
```

`_obscured` arranca con el valor que le pasó quien usó el widget (`late` significa que se inicializa una sola vez, en el primer uso) y se pasa al `TextFormField` como `obscureText`. Cuando tocás el ojo, ese booleano se invierte y el campo se vuelve a dibujar: mostrar u ocultar la contraseña es, literalmente, un booleano que cambia.

```dart
        suffixIcon: widget.obscurable
            ? IconButton(
                onPressed: () => setState(() => _obscured = !_obscured),
                icon: Icon(
                  _obscured
                      ? Icons.visibility_off_outlined
                      : Icons.visibility_outlined,
                ),
                tooltip: _obscured ? l10n.showPassword : l10n.hidePassword,
              )
            : null,
```

`suffixIcon` es lo que va a la derecha del campo, y solo existe si el campo es obscurable. `setState` es la forma de decirle a un widget con estado "cambió algo, redibujate". Fijate que el ícono y el tooltip también dependen del estado: cuando está oculto, el ojo tachado y el texto "Mostrar contraseña"; cuando está visible, al revés. Todos esos textos vienen de `l10n`.

Que el widget sea `StatefulWidget` y no un `StatelessWidget` es justamente por este booleano: si no guardara el estado, cada dibujado volvería a ocultar la contraseña mientras el usuario la está leyendo.

### El estado de carga mientras se firma

**Archivo:** `lib/features/auth/presentation/login_page.dart`

```dart
  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);

    // Simulate a network round-trip so the loading state is visible.
    await Future<void>.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;

    // No real auth: just mark the session as signed in. The router redirect
    // takes it from here.
    ref.read(authControllerProvider.notifier).login();
  }
```

`_submit` es una función `async`, o sea, que puede esperar. La primera línea es la más importante de todas: `_formKey.currentState!.validate()` recorre todos los `validator` del `Form` y devuelve `false` si alguno falló. El `!` afirma que el estado existe; el `return` temprano significa que, si hay un error de validación, la función termina ahí y nunca se llama al login.

Después viene el patrón de carga en tres pasos. Primero `setState(() => _submitting = true)` marca que estamos trabajando. Segundo, el `await` con el `delayed` de 600 milisegundos, que simula el viaje a un servidor y hace visible el spinner. Tercero, `if (!mounted) return;`: si mientras esperabas el usuario cerró la pantalla, el widget ya no existe y tocar su estado explotaría. Chequear `mounted` después de cada `await` es la costumbre que evita ese crash.

El último renglón es el que conecta el formulario con el estado: `ref.read(authControllerProvider.notifier)` te da el `AuthController`, y `.login()` pone el booleano en `true`. A partir de ahí la pantalla no hace nada más — el router está mirando ese provider y te redirige. Es la misma idea que en el resto de la app: la pantalla no navega, la pantalla cambia estado y la navegación reacciona.

¿Y por qué `ref.read` y no `ref.watch`? Porque esto es un callback, no un `build`. `watch` se usa cuando querés que el widget se redibuje cada vez que el valor cambia; `read` se usa cuando querés el valor o el notifier en este instante preciso, sin suscribirte. Si acá usaras `watch`, la pantalla se reconstruiría al loguearse, justo cuando ya no importa.

Ese "no navega" no es un detalle de estilo. Si la pantalla llamara a `context.go('/home')` por su cuenta, cualquier otra cosa que quiera entrar a la app tendría que repetir la lógica. Al dejar la decisión en el router, hay un solo lugar que decide quién puede ver qué, y es el mismo lugar que usa el guardia de rutas.

El `_submitting` del `setState` llega al botón así:

**Archivo:** `lib/features/auth/presentation/login_page.dart`

```dart
                      AppButton(
                        label: l10n.loginButton,
                        onPressed: _submit,
                        isLoading: _submitting,
                        expanded: true,
                      ),
```

`AppButton` es el botón del kit. `isLoading: _submitting` hace dos cosas a la vez: desactiva el botón y reemplaza el texto por un spinner. `expanded: true` lo estira a todo el ancho disponible. Con eso, el usuario ve que algo está pasando y, sobre todo, no puede tocar "Iniciar sesión" dos veces.

Hay una decisión que parece un olvido y no lo es: `_submitting` nunca vuelve a `false` cuando el login sale bien. No hace falta, porque el router te cambia de pantalla y esta se destruye junto con su estado. Pero cuando conectes un backend real el login *sí* puede fallar, y ahí vas a necesitar un `catch` que vuelva a poner `_submitting` en `false` para que el botón se reactive y el usuario pueda reintentar. Ese es el primer cambio concreto que te va a pedir tu API.

### Tokens y flutter_secure_storage

Ahora la parte que el template deja preparada pero no usa: guardar el token. En una app real, después de un login exitoso el servidor te devuelve un token y vos lo guardás para no pedir la contraseña de nuevo. `example_app` trae el lugar exacto donde va.

**Archivo:** `lib/core/storage/secure_store.dart`

```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// A testable abstraction over encrypted, sensitive local storage
/// (tokens, credentials). Backed by the platform keychain/keystore via
/// `flutter_secure_storage`.
abstract interface class SecureStore {
  Future<String?> read(String key);
  Future<void> write(String key, String value);
  Future<void> delete(String key);
  Future<void> deleteAll();
}

class FlutterSecureStore implements SecureStore {
  FlutterSecureStore([FlutterSecureStorage? storage])
    : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  @override
  Future<String?> read(String key) => _storage.read(key: key);
```

`abstract interface class` es la forma moderna de Dart de declarar un contrato: una lista de métodos sin cuerpo, que alguien tiene que cumplir. Acá el contrato es mínimo: leer, escribir, borrar una clave y borrar todo. Nada más. Esa interfaz es lo que el resto de la app va a usar, y es lo que en los tests se reemplaza por un doble.

`FlutterSecureStore` es la implementación real. El constructor acepta opcionalmente un `FlutterSecureStorage`; si no se lo pasás, crea uno por defecto. Ese detalle de diseño —poder inyectar la dependencia— es lo que hace que el archivo sea testeable sin tocar el llavero de un dispositivo.

Los cuatro métodos son `Future`, porque el almacenamiento del sistema operativo es asíncrono: pedirle algo al Keystore lleva tiempo. `read` devuelve `String?` —con signo de pregunta— porque la clave puede no existir, y ese `null` es información, no un error.

```dart
  @override
  Future<void> write(String key, String value) =>
      _storage.write(key: key, value: value);

  @override
  Future<void> delete(String key) => _storage.delete(key: key);

  @override
  Future<void> deleteAll() => _storage.deleteAll();
}
```

Cada método delega en `flutter_secure_storage` sin agregar lógica: es una capa fina a propósito. `flutter_secure_storage` es el paquete de la comunidad que habla con el almacenamiento cifrado del sistema operativo —Keychain en iOS y macOS, Keystore en Android—, de modo que el token queda cifrado por el sistema, no por tu código.

¿Y por qué no `SharedPreferences`? Porque `SharedPreferences` guarda texto plano. En este proyecto existe también, en `lib/core/storage/key_value_store.dart`, y su propio comentario lo dice: "Non-sensitive key/value storage". Es el lugar correcto para el modo de tema claro/oscuro, que no le importa a nadie si se filtra. Un token es una credencial: quien lo lea puede hacerse pasar por el usuario. Por eso el proyecto separa dos almacenamientos con dos providers distintos:

**Archivo:** `lib/core/providers/core_providers.dart`

```dart
/// Encrypted storage for sensitive values (tokens, secrets).
final secureStoreProvider = Provider<SecureStore>(
  (ref) => FlutterSecureStore(),
);
```

Ese `Provider<SecureStore>` devuelve la interfaz, no la clase concreta. Si mañana querés otra implementación —por ejemplo una que además cifre en escritorio— la cambiás acá, en un renglón, y nada más se entera. Y en un test, pasás un `SecureStore` falso y listo.

Hay una regla de seguridad que atraviesa todo el proyecto y que acá se ve completa. El token no debe aparecer nunca en un mensaje de error ni en un log improvisado: por eso `Failure.message` es un texto genérico y el `cause` original está documentado como "kept for logging (never shown to users)". Si tu backend devuelve un error que incluye la credencial, ese texto no se muestra: se registra y se traduce a uno de los mensajes seguros del capítulo siguiente.

Cerrando el círculo: cuando conectes tu backend, el trabajo es cambiar el cuerpo de `login()` en `AuthController` para que llame a tu API y escriba el token con `ref.read(secureStoreProvider).write(...)`. La pantalla de login, los validadores, el spinner y la redirección del router no cambian ni una línea. Eso es lo que comprás cuando separás el estado de la infraestructura.

### Resumen

- `AuthController` es un `Notifier<bool>`: el estado de sesión es un booleano y el router lo observa para redirigir.
- El formulario usa `Form` + `GlobalKey<FormState>` para validar todo junto, y un `TextEditingController` por campo que hay que liberar en `dispose()`.
- Los `validator` devuelven un mensaje de error o `null`, y los textos salen de `l10n`, nunca hardcodeados.
- `_submit` valida, marca `_submitting`, espera, chequea `mounted` y llama a `login()`; el spinner del botón sale de ese booleano.
- Los tokens van a `SecureStore` (`flutter_secure_storage`, cifrado por el sistema), jamás a `SharedPreferences`, que guarda texto plano.

## Textos en dos idiomas: ARB, l10n y context.l10n

Una app que solo habla un idioma es una app que pierde usuarios. Flutter trae una solución oficial para esto y `example_app` la usa tal cual, sin paquetes de terceros: archivos ARB, el generador `flutter gen-l10n` y una extensión de `BuildContext` para escribir `context.l10n.postsTitle` en lugar de una llamada larga.

Los términos, antes de empezar. *Localización* —o *l10n*, porque entre la `l` y la `n` hay diez letras— es adaptar la app a un idioma y una región. Un *locale* es el identificador de esa combinación: `en` para inglés, `es` para español. *Internacionalización* —*i18n*— es preparar el código para que agregar un locale nuevo no duela. Y un *ARB* es el archivo de texto donde viven las traducciones.

La idea general: vos escribís los textos en archivos de datos, uno por idioma, un generador lee esos archivos y produce clases de Dart con un getter por cada texto, y la interfaz pide esos getters a través del contexto. Nunca escribís un string visible en un widget. Si mañana sumás portugués, agregás un archivo y no tocás ninguna pantalla.

### l10n.yaml: la receta del generador

**Archivo:** `l10n.yaml`

```yaml
arb-dir: lib/l10n/arb
template-arb-file: app_en.arb
output-localization-file: app_localizations.dart
output-class: AppLocalizations
output-dir: lib/l10n/gen
nullable-getter: false
```

Este archivo es la configuración que lee `flutter gen-l10n`. `arb-dir` dice dónde están los textos; `template-arb-file` marca cuál es el archivo de referencia —el inglés, acá—, que es el único donde se declaran los metadatos de cada clave. `output-class` es el nombre de la clase que vas a usar (`AppLocalizations`) y `output-dir` es la carpeta donde aparece el código generado.

`nullable-getter: false` es el detalle que hace que la vida sea fácil: sin eso, `AppLocalizations.of(context)` devuelve un valor que puede ser `null` y tendrías que escribir `!` en todos lados. Con `false`, el getter es no-nulo y se puede usar directo.

El otro interruptor está en `pubspec.yaml`:

**Archivo:** `pubspec.yaml`

```yaml
flutter:

  # Generate localization classes from the ARB files in lib/l10n/arb.
  generate: true
```

Ese `generate: true` le dice a Flutter que este proyecto tiene localizaciones y que hay que generarlas. Corrés `flutter gen-l10n` —o `make l10n`, que es lo mismo— y aparecen tres archivos nuevos en `lib/l10n/gen/`: `app_localizations.dart` con la clase base, y `app_localizations_en.dart` y `app_localizations_es.dart` con una implementación por idioma. Esos archivos no se editan a mano nunca: son salida de una herramienta.

El flujo completo, entonces, tiene cuatro pasos. Editás el ARB. Corrés el generador. Usás la clave nueva con `context.l10n`. Corrés la app. Si te salteás el segundo paso, la clave no existe y el proyecto no compila: es el error más común y el más fácil de arreglar.

¿Por qué generar clases en lugar de leer el JSON en tiempo de ejecución? Por dos motivos. Primero, porque un getter tipado (`l10n.postsTitle`) lo ve el analizador: si escribís mal una clave, te enterás antes de compilar, no cuando el usuario abre la pantalla. Segundo, porque los plurales y los formatos de número y fecha los resuelve `intl`, que conoce las reglas de cada idioma. Vos escribís `{count, plural, ...}` una vez y no te peleás con "1 veces".

Los nombres de las claves también dicen algo: están prefijadas por pantalla o por tema (`homeTitle`, `postsTitle`, `loginTitle`, `errorNetwork`). Cuando el archivo crezca, ese prefijo es el que te deja encontrar lo que buscás sin recorrer todo. Y no son traducciones literales sino claves de *intención*: si mañana cambiás el título de la pantalla de inicio, cambiás el valor de `homeTitle` en los dos ARB y no tocás ni un widget.

### Qué es un ARB

Un ARB es un archivo JSON con un formato acordado. Tiene las claves que vas a usar, cada una con su texto, y empieza con `@@locale` para decir a qué idioma corresponde.

**Archivo:** `lib/l10n/arb/app_es.arb`

```json
{
  "@@locale": "es",
  "appTitle": "example_app",
  "appTagline": "Clean Architecture, Riverpod y un sistema de diseño para claro y oscuro.",
```

`"@@locale": "es"` marca el archivo como español. Las claves son identificadores en camelCase (`appTitle`, `appTagline`) y el valor es el texto tal cual se muestra. Fijate que las claves son las mismas en los dos archivos: eso es lo que permite que el generador sepa que `appTitle` existe en ambos idiomas.

**Archivo:** `lib/l10n/arb/app_en.arb`

```json
{
  "@@locale": "en",
  "appTitle": "example_app",
  "@appTitle": {
    "description": "The application title"
  },
  "appTagline": "Clean Architecture, Riverpod and one design system for light and dark.",
```

En el archivo de plantilla aparece algo más: una entrada que empieza con `@`. Esas son metadatos, no textos. `@appTitle` describe la clave y, cuando hay parámetros, declara sus tipos. Esa información va en un solo archivo —el de plantilla— para no repetirla en cada idioma.

La `description` no se muestra nunca en la app: es documentación para quien traduce o para vos dentro de seis meses. Vale la pena escribirla.

### Parámetros y plurales

Los textos no siempre son fijos. El contador, por ejemplo, muestra cuántas veces presionaste el botón, y en español eso cambia según el número.

**Archivo:** `lib/l10n/arb/app_en.arb`

```json
  "counterValue": "You have pushed the button {count, plural, =0{no times} =1{once} other{{count} times}}",
  "@counterValue": {
    "description": "Counter value with pluralization",
    "placeholders": {
      "count": {
        "type": "int"
      }
    }
  },
```

`{count, plural, ...}` es la sintaxis de plurales de ICU, el estándar que usa `intl` (el paquete de internacionalización de Dart que Flutter ya trae). Tiene casos exactos (`=0`, `=1`) y un caso `other` que cubre el resto. Los metadatos de `@counterValue` declaran el placeholder `count` como `int`, y eso es lo que hace que el método generado acepte un entero y no cualquier cosa.

**Archivo:** `lib/l10n/arb/app_es.arb`

```json
  "counterValue": "Has presionado el botón {count, plural, =0{ninguna vez} =1{una vez} other{{count} veces}}",
```

El español usa la misma estructura con sus propios textos. Y acá está la gracia: el mismo caso `other` sirve para "2 veces" y "25 veces", porque la regla gramatical del idioma la resuelve `intl`. Cuando el texto es simple y solo tiene un hueco, alcanza con llaves:

**Archivo:** `lib/l10n/arb/app_en.arb`

```json
  "routeNotFound": "Page not found: {location}",
  "@routeNotFound": {
    "description": "Shown when a route cannot be resolved",
    "placeholders": {
      "location": {
        "type": "String"
      }
    }
  },
```

**Archivo:** `lib/l10n/arb/app_es.arb`

```json
  "routeNotFound": "Página no encontrada: {location}",
```

Misma clave, misma forma, otro idioma. Los textos de error de red siguen el mismo camino: en `app_es.arb` están `errorNetwork`, `errorServer`, `errorData`, `errorCache` y `errorUnknown`, cada uno con su versión en inglés en el otro archivo.

Sumar un tercer idioma es, en la práctica, copiar `app_es.arb` a `app_pt.arb`, cambiar `@@locale` y traducir los valores. Volvés a correr el generador y aparecen `app_localizations_pt.dart` y una entrada nueva en `supportedLocales`. Ninguna pantalla se toca, porque ninguna pantalla conoce el idioma: todas piden `context.l10n`. Ese es el pago por haber mantenido los textos fuera del código desde el principio.

### Lo que el generador escribe por vos

La clase base que produce `gen-l10n` es la que hace de puente entre el árbol de widgets y los textos:

**Archivo:** `lib/l10n/gen/app_localizations.dart`

```dart
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }
```

`abstract class` porque hay una subclase por idioma y esta base solo declara. `localeName` guarda el idioma activo normalizado. Y el método `of` es el que busca en el árbol: `Localizations.of<AppLocalizations>(context, AppLocalizations)` pregunta "¿hay un `AppLocalizations` en el camino hacia arriba?". El `!` está dentro del generador, no en tu código, y por eso después podés escribir `context.l10n` sin signos raros.

Las claves con parámetros aparecen como métodos; las que no tienen, como getters:

**Archivo:** `lib/l10n/gen/app_localizations.dart`

```dart
  String routeNotFound(String location);
```

Y la implementación de cada idioma pone el texto:

**Archivo:** `lib/l10n/gen/app_localizations_es.dart`

```dart
  @override
  String routeNotFound(String location) {
    return 'Página no encontrada: $location';
  }
```

Ahí ves la traducción literal: el generador convirtió `{location}` en una interpolación `$location`. Esto es lo que nunca editás a mano: si querés cambiar el texto, cambiás el ARB y volvés a generar.

El generador también escribe las dos listas que necesita `MaterialApp`:

**Archivo:** `lib/l10n/gen/app_localizations.dart`

```dart
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('es'),
  ];
```

`supportedLocales` son los idiomas que la app entiende. `localizationsDelegates` —unos renglones más arriba en el mismo archivo— son los objetos que saben traducir; ahí van el de la app y tres de Flutter que traducen las cosas internas de Material. Si alguna vez ves una app donde los botones propios están en español pero el "Cancel" de un diálogo del sistema sigue en inglés, es porque falta uno de esos tres delegates.

### context.l10n: la puerta de entrada

**Archivo:** `lib/l10n/l10n.dart`

```dart
/// Convenience accessor for localized strings.
///
/// Instead of `AppLocalizations.of(context)!.postsTitle`, write
/// `context.l10n.postsTitle`.
extension AppLocalizationsX on BuildContext {
  AppLocalizations get l10n => AppLocalizations.of(this);
}
```

Una `extension` en Dart agrega métodos y getters a un tipo que ya existe, sin heredarlo. Acá se le agrega `l10n` a `BuildContext`, que es el objeto que todo widget recibe y que representa su posición en el árbol de widgets. Gracias a eso, cualquier widget escribe `context.l10n` y obtiene el objeto de traducciones del idioma activo, sin importar la clase ni el archivo.

El `AppLocalizations.of(this)` de adentro busca en el árbol el `Localizations` que instaló `MaterialApp` y devuelve la implementación correcta. Cuando el idioma del sistema cambia, Flutter reconstruye ese `Localizations` y todos los `context.l10n` empiezan a devolver otro idioma. Vos no hacés nada.

Esa mecánica tiene una consecuencia que conviene grabarse: `BuildContext` es efímero. Vale dentro de `build`, y solo ahí. Si guardás un `context` en un campo para usarlo más tarde, cuando lo uses puede apuntar a un widget que ya no existe. Por eso el proyecto lo pide como parámetro en `localizedMessage(context)` en lugar de guardarlo dentro del `Failure`.

El archivo además exporta el generado (`export 'package:example_app/l10n/gen/app_localizations.dart';`), así que un solo `import 'package:example_app/l10n/l10n.dart';` te alcanza para tener la extensión y las clases.

Así se usa en una página real. Primero se toma una vez y se guarda en una variable local:

**Archivo:** `lib/features/posts/presentation/pages/posts_page.dart`

```dart
    final l10n = context.l10n;
    final palette = context.palette;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.postsTitle)),
```

`postsTitle` es una clave del ARB: "Publicaciones" en español, "Posts" en inglés. El título de la barra superior cambia solo cuando el idioma cambia. Y como `l10n` quedó en una variable, el resto del método no repite `context.l10n` en cada línea.

Fijate que la misma primera línea toma también `palette` del contexto. Son dos extensiones distintas sobre el mismo objeto: una trae textos, la otra trae colores. Y `AppBar` es la barra de arriba de la pantalla, esa franja donde va el título y, si querés, las acciones.

Y así en una página con parámetro:

**Archivo:** `lib/features/counter/presentation/counter_page.dart`

```dart
              Text(
                l10n.counterValue(count),
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: palette.textMuted,
                ),
              ),
```

Acá se llama `counterValue(count)` pasándole el número. Si `count` vale 0, se lee "ninguna vez"; si vale 1, "una vez"; si vale 7, "7 veces". El widget no sabe nada de plurales: solo pasa el número.

Y así en una ruta que no existe:

**Archivo:** `lib/app/router/app_router.dart`

```dart
              Text(
                context.l10n.routeNotFound(state.uri.toString()),
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
```

`state.uri.toString()` es la dirección que el usuario intentó abrir; el texto la inserta. Es el mismo patrón: texto en el ARB, valor por parámetro, nada escrito a mano en el widget.

### De un Failure a un mensaje legible

Hay un caso especial: los errores. En el capítulo de red viste que el dominio devuelve `Failure` y que su `message` es solo para logs. La traducción al idioma del usuario vive en la capa de presentación, en un archivo propio.

**Archivo:** `lib/l10n/failure_l10n.dart`

```dart
extension FailureL10n on Failure {
  String localizedMessage(BuildContext context) {
    final l10n = context.l10n;
    return switch (this) {
      NetworkFailure() => l10n.errorNetwork,
      ServerFailure() => l10n.errorServer,
      DataFailure() => l10n.errorData,
      CacheFailure() => l10n.errorCache,
      UnknownFailure() => l10n.errorUnknown,
    };
  }
}
```

Una extensión sobre `Failure` que agrega un método: dame un `BuildContext` y te devuelvo el texto traducido. El `switch` sobre `this` es un switch de patrones: cada rama dice "si soy un `NetworkFailure`, devolvé `errorNetwork`". Como `Failure` es `sealed` (sellada), el compilador conoce todos sus subtipos y te obliga a cubrirlos: si mañana alguien agrega `TimeoutFailure`, este archivo deja de compilar hasta que lo traduzcas. Es un recordatorio hecho compilador.

Fijate que la extensión *no* es sobre `BuildContext` sino sobre `Failure`: se lee como `failure.localizedMessage(context)`, es decir, la acción pertenece al error y el contexto es un parámetro. Es una decisión de diseño chica con consecuencias: el método se puede llamar desde cualquier widget sin importar de qué clase sea.

¿Quién lo llama? El widget que muestra errores:

**Archivo:** `lib/core/widgets/async_value_view.dart`

```dart
      error: (error, _) => ErrorView(
        message: error is Failure
            ? error.localizedMessage(context)
            : error.toString(),
        onRetry: onRetry,
      ),
```

`AsyncValueView` recibe un `AsyncValue` de Riverpod y decide qué dibujar. En la rama de error pregunta si lo que llegó es un `Failure`: si lo es, lo traduce; si no, muestra `toString()` como último recurso. Ahí se cierra el círculo completo: excepción en la capa de datos, `Failure` en el dominio, mensaje traducido en la pantalla.

### Resumen

- Los textos viven en archivos ARB (`lib/l10n/arb/`), uno por idioma, con las mismas claves y `@@locale` al principio.
- `l10n.yaml` configura `flutter gen-l10n`, que genera `lib/l10n/gen/`; esos archivos no se editan a mano.
- Los metadatos `@clave` del archivo de plantilla declaran descripciones y tipos de placeholders, incluidos los plurales ICU.
- `context.l10n` es una extensión sobre `BuildContext` que devuelve `AppLocalizations`; se usa como `l10n.postsTitle` o `l10n.counterValue(count)`.
- `Failure.localizedMessage(context)` convierte un error tipado en un mensaje traducido, y el `switch` exhaustivo obliga a cubrir cada tipo nuevo.

## Pruebas: widgets, controladores y mocks

Escribir tests no es un trámite: es la forma de cambiar código sin miedo. `example_app` viene con una batería de tests que refleja la estructura de `lib/` —cada archivo de `test/` tiene su carpeta espejo en `lib/`— y la idea de este capítulo es que entiendas los tres niveles que usa y que puedas escribir el primero tuyo hoy mismo.

Antes de los archivos, dos definiciones. `flutter_test` es el paquete oficial de testing; trae `test`, `group`, `expect` y `testWidgets`, y corre con `flutter test`. `mocktail` es el paquete que fabrica dobles de prueba: objetos que se hacen pasar por una clase real y a los que les podés programar respuestas.

Y una idea que ordena todo lo demás: cada nivel prueba lo que el nivel de arriba no puede ver. Un test unitario prueba una función. Un test de controlador prueba que el estado cambie como corresponde. Un test de widget prueba que la pantalla reaccione a ese estado. Si escribís los tres niveles para lo mismo, estás pagando tres veces por la misma información.

Todos esos niveles corren con el mismo comando, `flutter test`, o con `make test`, que es lo mismo. `make coverage` corre lo mismo pero midiendo qué líneas se ejecutaron. No hay que levantar un emulador ni esperar compilaciones: por eso los tests son algo que podés correr cada dos minutos mientras trabajás.

Un test de widget, eso sí, tiene límites: no hay dispositivo, no hay red, no hay archivos. Todo lo que la pantalla toca tiene que estar simulado con `overrides` o con mocks. Cuando necesitás probar algo que atraviesa esa frontera —el arranque real, los permisos, el almacenamiento del teléfono— estás en el terreno del testing de integración, del que hablamos en el capítulo siguiente.

### Nivel uno: unitario puro

**Archivo:** `test/core/utils/result_test.dart`

```dart
void main() {
  group('Result', () {
    test('Ok exposes its value and reports isOk', () {
      const result = Result<int>.ok(42);

      expect(result.isOk, isTrue);
      expect(result.isErr, isFalse);
      expect(result.valueOrNull, 42);
      expect(result.failureOrNull, isNull);
    });
```

Este es el nivel más simple: Dart puro, sin Flutter, sin widgets, sin nada que dibujar. `main()` es el punto de entrada del archivo de tests; `group('Result', ...)` agrupa tests relacionados y sirve para que la salida se lea ordenada.

`test('descripción', () { ... })` define un caso. La descripción es una frase que se lee cuando algo falla, así que conviene que diga qué se espera, no qué hace el código. `expect(valorReal, valorEsperado)` es la aserción: si no coincide, el test falla y te muestra ambos.

Fijate cómo están escritas: `expect(result.isOk, isTrue)` y `expect(result.valueOrNull, 42)`. Se prueba el comportamiento público del `Result` —que exponga el valor, que reporte el estado— y no cómo lo guarda adentro. Esa es la regla de oro: si refactorizás `Result` sin cambiar su contrato, estos tests tienen que seguir pasando.

El matcher no siempre es un valor literal. En el mismo archivo hay otros que expresan una condición:

**Archivo:** `test/core/utils/result_test.dart`

```dart
    test('map() transforms Ok and preserves Err', () {
      const ok = Result<int>.ok(2);
      const err = Result<int>.err(CacheFailure());

      expect(ok.map((v) => v * 10).valueOrNull, 20);
      expect(err.map((v) => v * 10).failureOrNull, isA<CacheFailure>());
    });
```

`isA<CacheFailure>()` no compara con un objeto: pregunta si el valor es de ese tipo. Es lo que usás cuando el objeto tiene campos que no te importan en ese test. Y el nombre del test dice las dos mitades de lo que verifica: `map` transforma el caso feliz *y* deja intacto el error.

**Archivo:** `test/core/utils/result_test.dart`

```dart
    test('equality is value-based', () {
      expect(const Result<int>.ok(1), const Result<int>.ok(1));
      expect(const Result<int>.ok(1), isNot(const Result<int>.ok(2)));
    });
```

Ese test parece trivial y es de los más valiosos: como `Result` compara por valor, dos resultados con el mismo contenido son iguales. Sin eso, comparar estados en Riverpod —que usa igualdad para decidir si redibujar— daría resultados raros.

### Nivel dos: controladores

**Archivo:** `test/features/counter/counter_controller_test.dart`

```dart
void main() {
  late ProviderContainer container;

  setUp(() {
    container = ProviderContainer();
    addTearDown(container.dispose);
  });

  CounterController controller() => container.read(counterProvider.notifier);
  int value() => container.read(counterProvider);
```

Acá aparece Riverpod sin Flutter. `ProviderContainer` es el contenedor de providers en versión pura: sirve para leer estado y llamar métodos sin montar una app. `late` significa que la variable se asigna antes de usarse, aunque no en la declaración.

`setUp` es el bloque que corre antes de cada `test` del archivo. Crea un contenedor nuevo, así cada test arranca limpio y no arrastra estado del anterior. `addTearDown(container.dispose)` registra la limpieza: cuando el test termina, el contenedor se destruye. Ese par setUp/tearDown es el patrón que vas a repetir en todos los tests de controladores.

Las dos funciones cortas de abajo son atajos de lectura: `controller()` te da el notifier para llamar métodos y `value()` te da el valor actual del estado. Sin ellas, cada test estaría lleno de `container.read(...)` y el ruido taparía lo que importa.

**Archivo:** `test/features/counter/counter_controller_test.dart`

```dart
    test('decrement never goes below zero', () {
      controller().decrement();
      expect(value(), 0);

      controller().increment();
      controller().decrement();
      controller().decrement();
      expect(value(), 0);
    });
```

Ese test cuenta una historia en cuatro pasos: decrementar desde cero no rompe nada, incrementar sube a uno, decrementar vuelve a cero, decrementar otra vez se queda en cero. Es el borde del comportamiento, y es exactamente lo que un test tiene que cubrir: no el caso feliz solamente, también el límite.

Los otros tres tests del archivo son igual de cortos: arranca en cero, incrementar sube, reset vuelve a cero. Ninguno mira widgets ni pide un emulador. Corren en milisegundos, y por eso son los primeros que deberías escribir.

### Nivel tres: widgets

Un test de widget monta la interfaz de verdad —en memoria, sin emulador— y la maneja como lo haría una persona: toca, escribe, espera. Para eso hace falta armar el entorno mínimo de la app, y el proyecto tiene un helper para eso.

**Archivo:** `test/support/pump_app.dart`

```dart
extension PumpApp on WidgetTester {
  Future<void> pumpApp(Widget widget, {List<Override> overrides = const []}) {
    return pumpWidget(
      ProviderScope(
        overrides: overrides,
        child: MaterialApp(
          theme: AppTheme.light(),
          darkTheme: AppTheme.dark(),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: widget,
        ),
      ),
    );
  }
}
```

`PumpApp` es una extensión sobre `WidgetTester`, el objeto que en un test representa "las manos del usuario". Con eso, cualquier test escribe `tester.pumpApp(MiPagina())` y ya tiene la app armada. `pumpWidget` es la función de `flutter_test` que monta un widget en un árbol vacío; el helper la envuelve con lo que la app necesita.

Adentro hay tres piezas. `ProviderScope` es el widget que hace que los providers existan en el árbol; `overrides` es la lista de reemplazos, el mecanismo por el cual un test dice "en vez de este repository, usá este doble". `MaterialApp` es el esqueleto de la app: sin él no hay tema, ni direccionalidad, ni localizaciones. Y `home: widget` pone tu widget como pantalla inicial.

El `Override` de la firma viene de un import particular, `package:flutter_riverpod/misc.dart`; en Riverpod 3 ese tipo vive ahí. Es el único detalle de plumbing del helper, y por eso está concentrado en un archivo en lugar de repetirse en cada test.

Fijate que el helper monta el tema real (`AppTheme.light()` y `AppTheme.dark()`) y las localizaciones reales. No es capricho: si un widget lee `context.palette` o `l10n.retry` y el tema o las traducciones no están, el test falla por motivos que no tienen nada que ver con lo que querías probar.

Con el entorno listo, mirá un test real. Primero el doble:

**Archivo:** `test/features/posts/presentation/posts_page_test.dart`

```dart
class _FakeRepo implements PostRepository {
  _FakeRepo(this._result);
  final Result<List<Post>> _result;

  @override
  Future<Result<List<Post>>> getPosts() async => _result;

  @override
  Future<Result<Post>> getPost(int id) async =>
      const Result.err(UnknownFailure());
}
```

`_FakeRepo` es un doble escrito a mano: cumple el contrato de `PostRepository` y devuelve lo que le pasás en el constructor. El guión bajo del nombre es la convención de Dart para "esto es privado de este archivo". No usa `mocktail` porque no lo necesita: es un objeto de tres líneas que devuelve un resultado fijo.

Y después el test:

```dart
    testWidgets('renders posts on success', (tester) async {
      final repo = _FakeRepo(
        const Result.ok([
          Post(id: 1, userId: 1, title: 'First post', body: 'Body one'),
          Post(id: 2, userId: 1, title: 'Second post', body: 'Body two'),
        ]),
      );

      await tester.pumpApp(
        const PostsPage(),
        overrides: [postRepositoryProvider.overrideWithValue(repo)],
      );
      await tester.pumpAndSettle();

      // Sorted newest-first by the GetPosts use case.
      expect(find.text('Second post'), findsOneWidget);
      expect(find.text('First post'), findsOneWidget);
    });
```

`testWidgets` es como `test`, pero el callback recibe un `tester` y además corre en un entorno donde Flutter puede construir widgets. `pumpApp` monta la página y `overrideWithValue` reemplaza el repository real por el falso: la pantalla cree que está hablando con la red, y en realidad está hablando con tu objeto de prueba.

`pumpAndSettle()` avanza el tiempo hasta que no queda ninguna animación ni trabajo pendiente. Es lo que usás cuando la pantalla tiene que terminar de cargar. `find.text('Second post')` busca en el árbol un widget de texto con ese contenido exacto, y `findsOneWidget` afirma que hay exactamente uno. Si hubiera dos, el test falla igual: `findsOneWidget` es más estricto que "al menos uno".

El segundo test del archivo hace lo mismo con un error: le pasa `Result.err(NetworkFailure())` y espera encontrar el botón "Retry". Ahí se ve la cadena completa de los capítulos anteriores funcionando de punta a punta: `Failure` en el dominio, `localizedMessage` en la presentación, `ErrorView` dibujando.

### find, pump y el caso raro del spinner

`find` tiene varias formas. `find.text` busca por texto visible; `find.byIcon` busca por ícono, como en el test del error que busca `Icons.error_outline`; `find.byType` busca por tipo de widget, como en el test de humo del proyecto:

**Archivo:** `test/widget_test.dart`

```dart
    await tester.pumpWidget(const ProviderScope(child: App()));
    await tester.pumpAndSettle();

    // Unauthenticated → login screen.
    expect(find.text('Sign in'), findsOneWidget);

    await tester.tap(find.text('Sign in'));
    await tester.pumpAndSettle();

    // Authenticated → tabbed shell with the home dashboard.
    expect(find.byType(NavigationBar), findsOneWidget);
```

Este es un *smoke test*: no prueba una regla, prueba que la app entera arranca y llega a algún lado. Monta `App` completa, verifica que aparece el login, toca el botón y verifica que aparece la barra de navegación. Si alguien rompe el router o el arranque, este test se cae primero.

`tester.tap` hace el toque en la posición del widget encontrado. Es literalmente un dedo en la pantalla.

Sobre `pump`, hay dos versiones y la diferencia importa. `pump()` dibuja un cuadro y avanza un poquito el tiempo; `pumpAndSettle()` repite hasta que todo se queda quieto. En el test de login el proyecto usa la primera, a propósito:

**Archivo:** `test/features/auth/login_page_test.dart`

```dart
    await tester.tap(find.text('Sign in'));
    await tester.pump(); // enter the loading state
    // Advance past the simulated 600ms round-trip. We can't pumpAndSettle here
    // because, in isolation, the loading spinner animates forever (in the real
    // app the router redirect disposes this page on success).
    await tester.pump(const Duration(milliseconds: 700));

    expect(container.read(authControllerProvider), isTrue);
```

Ahí está el comentario explicándolo mejor de lo que yo podría: el spinner gira para siempre, así que `pumpAndSettle` nunca terminaría. Por eso se avanza el tiempo a mano con `pump(const Duration(milliseconds: 700))`, que es más que los 600 del `delayed`. Y fijate el `expect` final: no se mira la pantalla, se mira el estado. Cuando lo importante es el efecto en el estado, no hace falta buscar widgets.

Este test también muestra otra forma de armar el entorno: en vez de `pumpApp`, usa `UncontrolledProviderScope` con un `ProviderContainer` propio. Así el test puede leer `authControllerProvider` directamente, que es justo lo que quiere verificar.

### Qué es un mock y cuándo usarlo

**Archivo:** `test/features/posts/data/post_repository_impl_test.dart`

```dart
class _MockRemote extends Mock implements PostRemoteDataSource {}
```

Ese renglón es todo `mocktail`: una clase que hereda de `Mock` e implementa la interfaz que querés simular. No escribís métodos; `mocktail` los genera en tiempo de ejecución y vos les programás la respuesta.

**Archivo:** `test/features/posts/data/post_repository_impl_test.dart`

```dart
    test('maps DTOs to entities on success', () async {
      when(() => remote.fetchPosts()).thenAnswer((_) async => [dto]);

      final result = await repository.getPosts();

      expect(result.isOk, isTrue);
      final posts = result.valueOrNull!;
      expect(posts, hasLength(1));
      expect(posts.first.title, 'Hello');
      verify(() => remote.fetchPosts()).called(1);
    });
```

`when(() => ...)` significa "cuando alguien llame a esto"; `.thenAnswer((_) async => ...)` es la respuesta programada. `verify(() => ...).called(1)` es la otra mitad del mock: además de dar respuestas, comprueba *cuántas veces* se llamó al método. Eso es lo que un fake a mano no te da gratis, y por eso el proyecto usa `mocktail` en la capa de datos y fakes simples en la presentación.

`hasLength(1)` es otro matcher: no le importa qué contiene la lista, solo que tenga un elemento. Cada matcher expresa una intención distinta, y conviene elegir el que dice lo que querés decir, porque el mensaje de error que vas a leer cuando falle va a hablar en esos términos.

¿Cuándo un fake escrito a mano y cuándo un mock? La regla que usa el proyecto es simple: si el doble tiene que *devolver* datos, un fake de tres líneas alcanza y se lee mejor. Si el doble tiene que *registrar* cuántas veces lo llamaron o con qué argumentos, ahí `mocktail` gana, porque `verify` ya está resuelto y no tenés que llevar la cuenta a mano.

El otro test de mock del proyecto es `test/core/storage/secure_store_test.dart`, con `class _MockSecureStorage extends Mock implements FlutterSecureStorage {}`. La misma idea: no se toca el llavero del dispositivo, se verifica que `FlutterSecureStore` delegue bien. Ahí está el valor real de la interfaz `SecureStore` del capítulo anterior: en un test, el almacenamiento cifrado se reemplaza por un mock y el test corre en cualquier máquina.

### Por dónde empezar

Si es tu primer test, el orden que usa este proyecto es el correcto. Primero unitarios puros de la lógica que puedas aislar: un `Result`, un cálculo, una validación. No necesitan nada y te enseñan el ritmo de `expect`. Segundo, controladores con `ProviderContainer`: probás las reglas de tu estado sin dibujar nada. Tercero, widgets, y solo los caminos que importan: se ve bien cuando hay datos, se ve razonable cuando hay error.

Lo que no conviene es empezar por un test de widget de la pantalla entera con red real. Eso es lento, frágil y te va a frustrar antes de que le tomes el gusto.

Y cuando un test falla, leelo antes de tocar nada. La mitad de las veces el test tiene razón y el bug está en tu código; la otra mitad, el test está mal escrito y te está pidiendo que aclares qué querías. Las dos situaciones son información útil.

Lo que no hace falta testear es lo obvio. Que `Text` dibuje un texto, que un `Column` apile hijos: eso ya lo prueba Flutter. Lo que sí vale es lo tuyo: la regla de negocio, el borde, el error, la traducción de un estado a una pantalla. Un buen test se lee como una frase sobre el comportamiento de *tu* app.

### Resumen

- Tres niveles: unitario puro (`result_test.dart`), controlador con `ProviderContainer` (`counter_controller_test.dart`) y widget con `testWidgets` (`posts_page_test.dart`).
- `pump_app.dart` monta `ProviderScope` + `MaterialApp` con tema y localizaciones reales, y acepta `overrides` para inyectar dobles.
- `mocktail` genera dobles de interfaces (`Mock` + `implements`) y permite programar respuestas con `when(...).thenAnswer(...)` y verificar llamadas con `verify(...).called(1)`.
- `find.text` busca por contenido, `find.byType` por tipo de widget, y `findsOneWidget` exige exactamente uno.
- Usá `pumpAndSettle` cuando la pantalla se estabiliza, y `pump(Duration)` cuando algo anima para siempre, como el spinner de carga.

## Cómo seguir: lint, build y próximos pasos

Llegaste al final del recorrido. Ya leíste el arranque, las rutas, los widgets, el estado, el diseño, la red, los datos, la autenticación, los textos y las pruebas. Este último capítulo es el más corto y el más práctico: cómo mantener todo eso sano mientras vos seguís escribiendo código.

La herramienta central es el análisis estático: un programa que lee tu código sin ejecutarlo y te avisa de errores y de malas prácticas. Flutter lo trae, pero por defecto es tibio. `example_app` lo configura para que sea exigente, y ese archivo es el primero que conviene entender.

### analysis_options.yaml: las reglas que el proyecto eligió

**Archivo:** `analysis_options.yaml`

```yaml
include: package:flutter_lints/flutter.yaml

analyzer:
  language:
    strict-casts: true
    strict-inference: true
    strict-raw-types: true
  errors:
    # Treat missing awaits as an error — they are almost always bugs.
    unawaited_futures: error
    invalid_annotation_target: ignore
```

`include` hereda el conjunto recomendado `flutter_lints`, así no hay que listar cien reglas. Encima de eso, el proyecto endurece el analizador: `strict-casts`, `strict-inference` y `strict-raw-types` hacen que Dart no adivine tipos por vos y te obligue a ser explícito. Es más ruidoso al principio y muchísimo más claro después.

La sección `errors` sube la severidad de `unawaited_futures` a error: si llamás a una función `async` y te olvidás el `await`, no compila. Ese olvido es la causa de una familia entera de bugs silenciosos, y acá es imposible. `invalid_annotation_target: ignore` es la excepción: `freezed` usa anotaciones en lugares donde el analizador se queja de más, así que se silencia esa regla puntual.

Después vienen las reglas del linter, agrupadas por intención:

**Archivo:** `analysis_options.yaml`

```yaml
linter:
  rules:
    # Correctness
    - always_declare_return_types
    - avoid_dynamic_calls
    - avoid_slow_async_io
    - cancel_subscriptions
    - close_sinks
    - no_adjacent_strings_in_list
    - test_types_in_equals
    - throw_in_finally
    - unnecessary_statements
```

Las de "Correctness" atajan errores reales. `close_sinks` y `cancel_subscriptions` te obligan a cerrar streams y suscripciones, que es la fuente clásica de memoria que crece sin control. `avoid_dynamic_calls` impide que llames métodos sobre `dynamic`, donde el compilador no puede ayudarte. `throw_in_finally` evita que un `throw` dentro de un `finally` se trague la excepción original. `always_declare_return_types` hace que cada función diga qué devuelve, aunque sea `void`.

**Archivo:** `analysis_options.yaml`

```yaml
    # Style & readability
    - always_use_package_imports
    - avoid_redundant_argument_values
    - directives_ordering
    - prefer_const_constructors
    - prefer_const_constructors_in_immutables
    - prefer_const_declarations
    - prefer_final_locals
    - prefer_single_quotes
    - require_trailing_commas
    - sort_child_properties_last
    - use_super_parameters
```

Las de "Style" no cambian el comportamiento, cambian cómo se lee el código. `always_use_package_imports` obliga a importar con `package:example_app/...` en lugar de rutas relativas; `require_trailing_commas` mantiene el formato estable cuando agregás un parámetro; `sort_child_properties_last` deja el `child` al final, que es donde el ojo lo busca. `prefer_final_locals` evita variables que no cambian de valor pero podrían hacerlo. Son chicas, y juntas son la diferencia entre un archivo ajeno y uno propio.

Hay además una lista de exclusiones que explica por qué el analizador no se queja del código generado:

**Archivo:** `analysis_options.yaml`

```yaml
  exclude:
    - "**/*.g.dart"
    - "**/*.freezed.dart"
    - "lib/l10n/gen/**"
    - "build/**"
```

Ese bloque dice: no analices los archivos que escribió `freezed`, ni los de `build_runner`, ni los de `gen-l10n`, ni lo que hay en `build/`. No es hacer la vista gorda: es reconocer que ese código no lo mantenés vos, y que si el generador produce algo que al analizador no le gusta, el arreglo va en el molde, no en el archivo generado.

¿Por qué importa todo esto? Porque el lint es gratis y el code review no. Si la máquina se ocupa del estilo, la revisión humana se puede ocupar de lo que la máquina no ve: si la lógica está bien, si el nombre dice la verdad, si el test prueba lo que dice probar.

### El Makefile: los comandos reales

**Archivo:** `Makefile`

```make
format: ## Format all Dart code
	dart format .

format-check: ## Verify formatting without writing changes
	dart format --output=none --set-exit-if-changed .

analyze: ## Run the static analyzer
	flutter analyze

test: ## Run the test suite
	flutter test

coverage: ## Run tests with coverage → coverage/lcov.info
	flutter test --coverage

verify: format-check analyze test ## Format check + analyze + test (CI gate)
```

Cada target es un comando con nombre. `make format` corre `dart format .`, que reescribe todos los archivos `.dart` del proyecto con el formato canónico de Dart. No discutas con el formato: dejalo pasar y seguí. `make format-check` hace lo mismo pero sin escribir, y falla si algo está desformado —eso es lo que corre en verificación, no en tu máquina mientras trabajás.

`make analyze` corre el analizador con tus reglas. `make test` corre la suite. `make coverage` corre los tests midiendo qué líneas se ejecutaron y deja el resultado en `coverage/lcov.info`.

`make verify` es la joya: encadena `format-check`, `analyze` y `test`. Si los tres pasan, tu cambio está sano según el proyecto. `CONTRIBUTING.md` lo pide antes de cada PR, y las reglas de abajo son las que hacen que ese gate tenga sentido:

**Archivo:** `CONTRIBUTING.md`

```markdown
- **Regenerate code** after touching `@freezed`/JSON models (`make gen`) or ARB
  files (`make l10n`). Never hand-edit generated files.
- **Formatting is enforced.** Run `make format` before committing.
```

Dos reglas de oro que valen para siempre: los archivos generados no se editan, se regeneran; y el formato se corre antes de commitear.

Como `make verify` es una cadena de tres comandos, cuando falla conviene bajar un escalón y correr las partes por separado: primero `make format` (que arregla solo), después `make analyze` (que te dice archivo y línea), después `make test`. Si el que falla es `format-check`, la solución es correr `format` y volver a intentar. Ese ida y vuelta es normal y no significa que hayas roto nada.

Si no te acordás de un comando, el Makefile se explica solo: cada target tiene su descripción después de `##`, y `make help` las lista todas. Es un buen primer comando en cualquier proyecto, y en este te va a mostrar la lista completa sin que tengas que abrir el archivo.

El Makefile también tiene los comandos de dependencias y de generación, que usás mucho menos pero conviene conocer:

**Archivo:** `Makefile`

```make
get: ## Install dependencies
	flutter pub get

gen: ## Run build_runner once (freezed / json_serializable)
	dart run build_runner build

watch: ## Run build_runner in watch mode
	dart run build_runner watch
```

`flutter pub get` descarga las dependencias declaradas en `pubspec.yaml`; es lo primero que corre cualquiera que clone el proyecto. `gen` es el generador de modelos, del que hablamos en el apartado siguiente. Y `watch` es la versión cómoda de ese generador: queda corriendo y regenera solo cada vez que guardás un archivo. Si estás tocando modelos durante una hora, ahorra muchos comandos.

### Los generadores: build_runner y gen-l10n

Hay dos familias de código generado en el proyecto, y cada una tiene su comando.

La primera son los modelos inmutables. `freezed` y `json_serializable` escriben los archivos `.freezed.dart` y `.g.dart` a partir de tus clases. Cuando cambiás un modelo —agregás un campo, cambiás un tipo— esos archivos quedan viejos y el proyecto no compila. El target `gen` que viste recién corre `dart run build_runner build`, y con eso se regeneran. Si alguna vez te avisa que hay archivos en conflicto porque no puede decidir qué sobrescribir, la variante que resuelve el problema es `dart run build_runner build --delete-conflicting-outputs`: es el mismo generador con permiso para borrar la salida previa antes de escribir.

La segunda familia son las localizaciones, del capítulo anterior:

**Archivo:** `Makefile`

```make
l10n: ## Generate localization classes from ARB files
	flutter gen-l10n
```

Y para no acordarte de nada de eso la primera vez:

**Archivo:** `Makefile`

```make
setup: get gen l10n ## First-time setup: deps + codegen + localizations
```

`make setup` encadena tres targets: `flutter pub get` (dependencias), `build_runner` (modelos) y `gen-l10n` (textos). El README lo repite en su propia versión:

**Archivo:** `README.md`

```markdown
# 3. One-time setup: deps + codegen + localizations
make setup      # == flutter pub get && dart run build_runner build && flutter gen-l10n
```

Cuando veas un error de compilación raro que menciona `part of` o un getter que "no existe", la primera sospecha es siempre la misma: te falta regenerar. Es el error más común del principiante con codegen, y la solución es un comando.

### Compilar para publicar

Durante el desarrollo corrés la app con `make run`, que en este proyecto pasa la configuración de desarrollo:

**Archivo:** `Makefile`

```make
run: ## Run the app with the dev flavor config
	flutter run --dart-define-from-file=config/dev.json
```

`--dart-define-from-file=config/dev.json` inyecta configuración al compilar: URLs de API, flags, lo que sea que no quieras escribir en el código. Hay un archivo por ambiente (`dev`, `staging`, `prod`) en `config/`, y los reales están fuera del repositorio; en el repo solo viven las plantillas. Por eso el README arranca con `cp config/dev.example.json config/dev.json`: sin ese archivo, `make run` no tiene qué leer.

Para generar un instalable de Android, el comando general de Flutter es `flutter build apk --release`. En este proyecto el README lo usa con la configuración de producción, para que el binario salga apuntando al servidor que corresponde:

**Archivo:** `README.md`

```markdown
flutter build apk --dart-define-from-file=config/prod.json
```

`build apk` empaqueta la app en un archivo `.apk` que podés instalar en un teléfono. En modo release, Flutter compila de verdad en lugar de preparar la recarga en caliente, y eso tiene dos consecuencias: tarda bastante más y la app corre mucho más rápido.

Cuando algo se rompe de una manera que no entendés, el Makefile también tiene los comandos de limpieza:

**Archivo:** `Makefile`

```make
clean: ## Remove build artifacts and re-fetch deps
	flutter clean && flutter pub get

upgrade: ## Upgrade dependencies to latest allowed versions
	flutter pub upgrade
```

`flutter clean` borra los artefactos de compilación y `flutter pub get` vuelve a bajar las dependencias: es el "apagá y prendé" de Flutter, y resuelve una cantidad sorprendente de errores raros después de cambiar de rama. `flutter pub upgrade` sube las dependencias a la última versión que permita tu `pubspec.yaml`; hacelo en una rama aparte y corré `make verify` después, porque las actualizaciones traen sorpresas.

Una aclaración honesta: un APK que de verdad puedas publicar necesita además tu firma de Android configurada. Eso no lo hace el proyecto por vos ni lo cubre este manual; es un trámite con la tienda y con tus claves.

Y el repositorio tiene, además de README y CONTRIBUTING, un documento pensado para que un agente de IA trabaje sin romper nada. Su resumen inicial sirve como lista de control para cualquiera:

**Archivo:** `AGENTS.md`

```markdown
> **TL;DR** — Respect the layered architecture, keep the dependency rule
> (dependencies point inward), never let infrastructure leak into the domain,
> and run `make verify` before you consider a change done.
```

Tres reglas y un comando. Si te quedás con una sola idea de todo el manual, que sea esa: las dependencias apuntan hacia adentro, la infraestructura no entra al dominio, y un cambio está terminado cuando `make verify` pasa.

### Qué aprender después

Terminaste el recorrido por el código, y ahora viene la parte que ningún manual puede hacer por vos: escribir tu propia app. Algunas cosas que vale la pena aprender a continuación, en el orden en que las vas a necesitar.

Widgets avanzados: lo que viste es el vocabulario básico. Después vienen `CustomScrollView` y `SliverList` para listas mezcladas, `LayoutBuilder` para layouts que dependen del espacio disponible, y `Hero` para transiciones entre pantallas. Todo sigue siendo composición: no hay magia nueva, solo cajas dentro de cajas con más experiencia.

Animaciones: el proyecto ya usa `AppMotion` con duraciones y una curva; entender `AnimationController`, `Tween` y `AnimatedBuilder` te va a permitir construir lo que ese sistema de diseño mueve. Empezá por lo implícito —`AnimatedContainer`, `AnimatedOpacity`— y seguí con lo explícito.

Testing de integración: los tests de este manual cubren unidades y widgets aislados. El siguiente nivel es `integration_test`, que maneja la app completa en un dispositivo o emulador, de verdad. Ahí probás lo que ningún test de widget puede: el arranque real, los permisos, la navegación de punta a punta.

Y algo que no es una tecnología pero es lo que más te va a servir: leer código que no escribiste. `example_app` es un buen lugar para practicar, porque tiene comentarios que explican decisiones. Elegí una carpeta, abrila y tratá de predecir qué hace cada archivo antes de leerlo.

Para cerrar, un recordatorio simple: este manual no es de una sola lectura. Cada capítulo está pensado para leerse con el proyecto abierto al lado, y cuando vuelvas a un archivo dentro de un mes, el capítulo va a decir otra cosa. Volvé al de autenticación cuando conectes tu primer backend, al de textos cuando agregues un idioma, al de pruebas cuando algo se rompa. El código real está ahí, y ahora sabés leerlo.

### Resumen

- `analysis_options.yaml` hereda `flutter_lints` y lo endurece con `strict-casts`, `strict-inference`, `strict-raw-types` y reglas de corrección como `close_sinks` o `unawaited_futures: error`.
- Los comandos del día a día son `dart format .`, `flutter analyze` y `flutter test`; `make verify` corre los tres en modo verificación.
- Después de tocar modelos freezed o JSON hay que regenerar con `dart run build_runner build` (más `--delete-conflicting-outputs` si hay conflictos), y después de tocar ARB, con `flutter gen-l10n`.
- `flutter build apk --release` es la forma general de compilar para Android; este repo lo corre con `--dart-define-from-file=config/prod.json`.
- Lo que viene: widgets avanzados, animaciones, testing de integración y, sobre todo, seguir leyendo código ajeno con el proyecto abierto.



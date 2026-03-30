# Manuals

Colección de manuales técnicos sobre desarrollo backend con Rust, bases de datos, desarrollo web, desarrollo móvil con React Native.

## Contenidos

- **Rust / Axum**: Tutorials para crear APIs REST con el framework Axum
- **SQLx**: Guía para trabajar con bases de datos PostgreSQL usando el crate SQLx
- **Redis**: Configuración y uso de Redis en aplicaciones Rust
- **React Native**: Primeros pasos para desarrollo móvil multiplataforma

## Requisitos Previos

- [Rust](https://www.rust-lang.org/tools/install) (última versión estable)
- [mdBook](https://rust-lang.github.io/mdBook/guide/installation.html)

## Instalación

### 1. Instalar Rust

Si no tienes Rust instalado, ejecuta:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Luego reinicia tu terminal o ejecuta:

```bash
source $HOME/.cargo/env
```

### 2. Instalar mdBook

Puedes instalar mdBook usando cargo:

```bash
cargo install mdbook
```

O usando las herramientas de Rust:

```bash
rustup component add mdbook
```

### 3. Clonar el Proyecto

```bash
git clone https://github.com/orlandotellez/manuals.git
cd manuals
```

## Desarrollo Local

### Ver la Documentación

Para iniciar un servidor local con live-reload:

```bash
mdbook serve docs
```

Esto abrirá la documentación en `http://localhost:3000`. Cualquier cambio en los archivos `.md` se recargará automáticamente.

### Generar HTML Estático

Para generar los archivos HTML sin servidor:

```bash
mdbook build docs
```

Los archivos generados estarán en `docs/book/`.

## Estructura del Proyecto

```
manuals/
├── Cargo.toml           # Configuración del proyecto Rust
├── docs/
│   ├── book.toml        # Configuración de mdBook
│   ├── book/            # HTML generado (no modificar)
│   └── src/
│       ├── SUMMARY.md   # Índice de contenidos
│       ├── index.md     # Página principal
│       └── docs/        # Capítulos de la documentación
│           ├── 01-axum-techcomponents.md
│           ├── 02-axum-rasflow.md
│           ├── 03-sqlx.md
│           ├── 04-redis.md
│           └── 05-react-native-primeros-pasos.md
└── README.md
```

## Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `mdbook serve docs` | Iniciar servidor local con live-reload |
| `mdbook build docs` | Generar HTML estático |
| `mdbook test docs` | Ejecutar tests de código en los ejemplos |
| `mdbook clean docs` | Limpiar archivos generados |

## Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-seccion`)
3. Commit tus cambios (`git commit -am 'Agrega nueva sección'`)
4. Push a la rama (`git push origin feature/nueva-seccion`)
5. Crea un Pull Request

---

Desarrollado con ❤️ usando [mdBook](https://github.com/rust-lang/mdBook)

# Manuals

Colección de manuales técnicos de desarrollo: backend con Rust, bases de datos, APIs en
C# y Node, aplicaciones móviles y redes. El sitio que los sirve está hecho con
[Astro](https://astro.build/).

## Contenidos

46 manuales en 15 secciones. El índice completo está en `src/lib/library.mjs`, que es la
única fuente de verdad de la estructura:

| Sección | Manuales |
| --- | --- |
| Rust | Axum (primeros pasos, techcomponents, rasflow), Restix |
| Tauri | Crear APK con Tauri |
| Fastify | Primeros pasos, CajoraPOS, Farmacia |
| Express | Primeros pasos |
| NextJs | NextJs |
| Base de datos | Postgres, SQLx, Redis, Prisma, EF Core, Backups |
| ASPNET CORE (C#) | Primeros pasos, autenticación, Cursinet |
| React Native | Primeros pasos, generar APK |
| Flutter | Flutter + Neovim |
| Matrix Synapse | Synapse, implementación en TypeScript |
| Redes | Direcciones IP, modelos de red, NAT, MAC, Packet Tracer |
| Redes de Datos II | Enrutamiento, OSPF, OSPFv3, EIGRP, IS-IS, BGP, troubleshooting |
| Docker | Instalación |
| Git y Github | Convención de commits |
| Linux | Instalar aplicaciones |

## Requisitos

- [Node.js](https://nodejs.org/) 22.22.2 o superior
- [pnpm](https://pnpm.io/) 10

## Desarrollo

```bash
pnpm install
pnpm dev          # http://localhost:4321
```

`pnpm dev` sirve el sitio con recarga en caliente. La búsqueda necesita el índice de
Pagefind, que se genera al compilar: en desarrollo el buscador avisa que todavía no hay
índice en lugar de devolver resultados vacíos.

## Compilar y verificar

```bash
pnpm build        # astro build + índice de Pagefind + auditoría de enlaces internos
pnpm preview      # sirve dist/ con el índice de búsqueda
```

`pnpm build` falla si queda un enlace interno roto, si un ancla de un manual no existe o
si un archivo de `src/content/manuals/` no está registrado.

## Estructura

```
manuals/
├── src/
│   ├── components/          Encabezado, buscador, tema, árbol lateral, índice del capítulo
│   ├── content/manuals/     46 manuales en Markdown, sin frontmatter
│   ├── layouts/             BaseLayout (chrome del sitio) y DocsLayout (las tres columnas)
│   ├── lib/
│   │   ├── library.mjs      Registro: secciones, manuales y orden de lectura
│   │   ├── manuals.ts       Une el registro con el contenido y valida que coincidan
│   │   └── remark-*.ts      Reescritura de enlaces y del título inicial
│   ├── pages/               /, /docs/, /docs/<manual>/, 404
│   └── styles/              tokens, base, layout, docs, landing, search
├── public/                  Fuentes, favicon e imágenes de los manuales
├── scripts/check-links.mjs  Auditoría de enlaces y anclas sobre dist/
└── docs/book/               Salida del sitio anterior en mdBook (histórico, sin uso)
```

## Agregar un manual

1. Crea el archivo en `src/content/manuals/<slug>.md`. El primer `#` del documento es
   opcional: el título visible sale del registro, no del archivo.
2. Agrega una línea a `chapters` en `src/lib/library.mjs` con su `id`, `title` y
   `section`.
3. Ejecuta `pnpm build`. Si el archivo y el registro no coinciden, el build falla y el
   mensaje dice exactamente qué falta.

Los enlaces entre manuales se escriben como en mdBook
(`[otro manual](./36-enrutamiento-dinamico.md)`) y el build los convierte a la ruta real.

## Interfaz

- Tres columnas en pantallas anchas: árbol de manuales a la izquierda, documento en el
  medio, secciones del capítulo a la derecha. En pantallas angostas el árbol se pliega en
  un desplegable arriba del capítulo.
- Tema claro y oscuro. Se resuelve antes del primer pintado y respeta la preferencia del
  sistema hasta que elijas uno.
- Búsqueda sobre el sitio compilado (Pagefind), con `Ctrl`/`Cmd` + `K` para abrirla.
- Bloque de código con idioma y botón de copiar; tablas anchas con scroll propio.

## Publicación

Todavía no hay publicación configurada: el sitio se compila y se sirve en local. El
`site` de `astro.config.mjs` toma `MANUALS_SITE_URL` del entorno cuando exista, para que
las URL canónicas apunten al destino real el día que se despliegue.

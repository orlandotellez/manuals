# Manuals

Colección de manuales técnicos de desarrollo: backend con Rust, bases de datos, APIs en
C# y Node, aplicaciones móviles y redes. El sitio que los sirve está hecho con
[Astro](https://astro.build/).

## Contenidos

46 manuales y 729 capítulos en 15 secciones. Cada manual se sirve partido en una página
por capítulo. El índice de manuales está en `src/lib/library.mjs`, que es la única fuente
de verdad de la estructura; los capítulos salen del propio Markdown de cada manual:

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

`pnpm dev` sirve el sitio con recarga en caliente; editar un manual vuelve a cortarlo en
capítulos sin reiniciar. La búsqueda necesita el índice de Pagefind, que se genera al
compilar: en desarrollo el buscador avisa que todavía no hay índice en lugar de devolver
resultados vacíos.

## Compilar y verificar

```bash
pnpm build        # astro build + índice de Pagefind + auditoría de enlaces internos
pnpm preview      # sirve dist/ con el índice de búsqueda
```

`pnpm build` falla si queda un enlace interno roto (hoy son más de 45.000), si un ancla de
un manual no existe, si un archivo de `src/content/manuals/` no está registrado o si
alguno de los tests de interfaz no pasa.

## Estructura

```
manuals/
├── src/
│   ├── components/          Encabezado, buscador, tema, capítulos del manual, índice de página
│   ├── content/manuals/     46 manuales en Markdown, sin frontmatter
│   ├── layouts/             BaseLayout (chrome del sitio) y DocsLayout (las tres columnas)
│   ├── lib/
│   │   ├── library.mjs      Registro: secciones, manuales y orden de lectura
│   │   ├── chapter-split.mjs  Corta cada manual en capítulos y reescribe sus enlaces
│   │   ├── manuals-loader.mjs  Loader de contenido: un manual, N páginas
│   │   └── manuals.ts       Une el registro con las páginas y valida que coincidan
│   ├── pages/               /, /docs/, /docs/<manual>/, /docs/<manual>/<capítulo>/, 404
│   └── styles/              tokens, base, layout, docs, landing, search
├── public/                  Fuentes, favicon e imágenes de los manuales
├── scripts/check-links.mjs  Auditoría de enlaces y anclas sobre dist/
├── tests/docs-ui.test.mjs   Tests de interfaz sobre el sitio compilado
└── docs/book/               Salida del sitio anterior en mdBook (histórico, sin uso)
```

## Agregar un manual

1. Crea el archivo en `src/content/manuals/<slug>.md` con su `# Título` y sus secciones
   como `## Título del capítulo` (o `#`, si el manual usa ese nivel para las secciones:
   el nivel que se repite es el que manda).
2. Agrega una línea a `chapters` en `src/lib/library.mjs` con su `id`, `title` y
   `section`.
3. Ejecuta `pnpm build`. Cada `## ` se publica como
   `/docs/<slug>/<capítulo>/`, y el build falla si el archivo y el registro no coinciden.

Los enlaces internos se escriben en Markdown, como en mdBook: `[otro
capítulo](#5-las-clases-de-legado)` o `[otro manual](./36-enrutamiento-dinamico.md)`. El
build los traduce a la página que ahora contiene ese destino; si el destino no existe, la
auditoría de enlaces lo reporta. La sección "Índice" de cada manual no se publica: la
columna de la izquierda es ese índice.

## Interfaz

- Cada manual es una página por capítulo. Dentro de un manual, la izquierda lista solo sus
  capítulos (con el actual marcado), el medio es el capítulo y la derecha los títulos de
  esa página; al final, anterior y siguiente.
- Tres columnas desde 1280 px. En pantallas angostas las dos columnas se pliegan en
  desplegables arriba del capítulo.
- Tema claro y oscuro. Se resuelve antes del primer pintado y respeta la preferencia del
  sistema hasta que elijas uno.
- Búsqueda sobre el sitio compilado (Pagefind), con `Ctrl`/`Cmd` + `K` para abrirla.
- Bloque de código con idioma y botón de copiar; tablas anchas con scroll propio.
- Esquinas rectas en toda la interfaz: es una decisión, no un descuido.
- La home lista las 15 tecnologías con su logo; los manuales viven en `/docs/`, y cada
  manual del índice lleva el logo de su tecnología. Los logos están en `public/logos`
  (Simple Icons, CC0) y se pintan con `currentColor` mediante una máscara CSS, así que
  sirven igual en claro y oscuro.

## Publicación

Todavía no hay publicación configurada: el sitio se compila y se sirve en local. El
`site` de `astro.config.mjs` toma `MANUALS_SITE_URL` del entorno cuando exista, para que
las URL canónicas apunten al destino real el día que se despliegue.

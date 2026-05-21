# Frontend Architecture — Manual de Estructura y Convenciones

> Este documento centraliza la lógica, estructura, patrones y herramientas que uso en todos mis proyectos frontend.
> Sirve como **manual de referencia** y **base para nuevos proyectos**.

---

## Stack Principal

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | 16+ | Framework fullstack React (App Router) |
| React | 19+ | UI Library |
| TypeScript | 5+ | Tipado estático |
| Tailwind CSS | 4+ | Utility-first CSS (PostCSS) |
| Zustand | 5+ | Estado global liviano |
| pnpm | latest | Package manager (workspace-ready) |

---

## Filosofía de Trabajo

### 1. **Feature-First Architecture**
Las features son el centro del proyecto. Cada feature es autocontenida: tiene sus componentes, su lógica, sus estilos. Nada de carpetas horizontales gigantes de components/hooks/utils sin contexto.

```
src/
  features/     → Cada feature vive en su propia carpeta
  shared/       → Solo lo que es transversal y realmente compartido
```

### 2. **Separación por Responsabilidades**
Cada archivo tiene UN solo propósito:
- `api/` → solo llamadas HTTP
- `hooks/` → solo lógica de estado + efectos
- `components/` → solo UI (presentacional)
- `types/` → solo interfaces y tipos
- `utils/` → solo funciones puras helper
- `lib/` → configuración, constantes, mappers

### 3. **Container-Presentational Pattern**
Los hooks actúan como **containers** (lógica + estado), los componentes son **presentacionales** (solo reciben props y renderizan).

### 4. **CSS Modules > Tailwind Utility Classes**
Para componentes complejos se usa CSS Modules. Tailwind se usa para layouts y spacing rápido. CSS Modules van lado a lado con el componente:
```
Componente.tsx
Componente.module.css
```

### 5. **Co-location**
Los estilos, tests (cuando existen) y los archivos de una feature viven JUNTO al componente que los usa. Nada de carpetas separadas de styles.

### 6. **Columna Vertebral (Backbone)**
El `src/shared/` es la columna vertebral del proyecto. Acá vive:
- Tipos compartidos
- Hooks transversales
- Utilidades puras
- Configuración de API
- Store global (Zustand)
- Componentes realmente compartidos (Navbar, Footer, ErrorState, LoadingState)

---

## Mapa de Navegación Rápida

| Archivo | Qué contiene |
|---------|-------------|
| [01-ESTRUCTURA-DE-CARPETAS.md](./01-ESTRUCTURA-DE-CARPETAS.md) | Árbol completo de carpetas con descripción |
| [02-ARQUITECTURA-Y-PATRONES.md](./02-ARQUITECTURA-Y-PATRONES.md) | Patrones de diseño, layout groups, flujo de datos |
| [03-ESTADO-Y-DATOS.md](./03-ESTADO-Y-DATOS.md) | Zustand, Context, hooks, data fetching |
| [04-COMPONENTES-Y-UI.md](./04-COMPONENTES-Y-UI.md) | Sistema de componentes, CSS Modules, estados UI |
| [05-API-Y-SERVICIOS.md](./05-API-Y-SERVICIOS.md) | Capa de API, fetch, headers, errores |
| [06-DEPENDENCIAS-Y-HERRAMIENTAS.md](./06-DEPENDENCIAS-Y-HERRAMIENTAS.md) | Dependencias clave, por qué y alternativas |
| [07-SNIPPETS-Y-EJEMPLOS.md](./07-SNIPPETS-Y-EJEMPLOS.md) | Snippets de código reutilizables |
| [08-CONFIGURACIONES.md](./08-CONFIGURACIONES.md) | Configs de Next, TS, Tailwind, ESLint |

---

## Estructura de Alto Nivel

```
frontend/
├── app/                  → Next.js App Router (rutas y layouts)
├── src/                  → Código fuente de la aplicación
│   ├── features/         → Features de negocio
│   └── shared/           → Código compartido (columna vertebral)
├── public/               → Assets estáticos
├── package.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── pnpm-workspace.yaml
└── .env.example
```

---

> **Nota:** Este manual se actualiza con cada proyecto. No es una verdad absoluta, es una base desde la cual iterar.

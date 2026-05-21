# 06 — Dependencias y Herramientas

> Stack completo, por qué usamos cada cosa y alternativas.

---

## Dependencias de Producción

| Paquete | Versión | Propósito | Alternativas |
|---------|---------|-----------|-------------|
| **next** | ^16.2.0 | Framework fullstack (App Router) | Remix, Astro, Vite+SPA |
| **react** | ^19.2.3 | UI Library | — |
| **react-dom** | ^19.2.3 | Renderizado DOM | — |
| **zustand** | ^5.0.12 | Estado global liviano | Redux, Jotai, Valtio |
| **lucide-react** | ^0.577.0 | Iconos SVG | Heroicons, Phosphor |
| **recharts** | ^3.8.1 | Gráficos y charts | Chart.js, Nivo, D3 |
| **jspdf** | ^4.2.1 | Generación de PDFs | pdfmake, react-pdf |
| **jspdf-autotable** | ^5.0.7 | Tablas en PDF | — |
| **xlsx** | ^0.18.5 | Exportar a Excel | exceljs, sheetjs |
| **stripe** | ^20.4.1 | Stripe server-side | — |
| **@stripe/stripe-js** | ^8.11.0 | Stripe client-side | — |

### Por qué Zustand y no Redux

| Aspecto | Zustand | Redux Toolkit |
|---------|---------|---------------|
| Bundle | ~1KB | ~12KB |
| Boilerplate | Cero | Medio (slices, actions) |
| Provider | No necesita | Necesita `<Provider>` |
| Persistencia | Built-in (`persist`) | Necesita `redux-persist` |
| TypeScript | Natural | Funciona pero más verbose |
| Curva | Plana | Media |

**Conclusión:** Para proyectos medianos, Zustand es más que suficiente. Redux solo si el estado es realmente complejo (múltiples fuentes, middlewares, etc.).

### Por qué fetch nativo y no axios

| Aspecto | fetch | axios |
|---------|-------|-------|
| Bundle | 0KB | ~14KB |
| Tree-shakeable | ✅ | ❌ |
| Interceptors | Manual | Built-in |
| Request cancellation | `AbortController` | `CancelToken` |
| Progress events | ❌ (no nativo) | ✅ |

**Conclusión:** fetch es suficiente para el 95% de los casos. Solo agregar axios si necesitamos upload progress o interceptors complejos.

### Por qué Recharts y no Chart.js

- **Recharts:** API declarativa basada en React, fácil de integrar
- **Chart.js:** Necesita wrapper (react-chartjs-2), más config
- Para dashboards simples, Recharts es más directo

---

## Dependencias de Desarrollo

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| **typescript** | ^5 | Tipado estático |
| **tailwindcss** | ^4 | Utility-first CSS |
| **@tailwindcss/postcss** | ^4 | Plugin PostCSS para Tailwind |
| **eslint** | ^9 | Linting |
| **eslint-config-next** | ^16.1.7 | Config ESLint para Next.js |
| **@types/node** | ^20 | Tipos Node.js |
| **@types/react** | ^19 | Tipos React |
| **@types/react-dom** | ^19 | Tipos React DOM |

---

## Herramientas de Sistema

| Herramienta | Propósito | Instalación |
|------------|-----------|-------------|
| **pnpm** | Package manager | `npm i -g pnpm` |
| **Turbopack** | Bundler de Next.js (built-in) | Viene con Next.js 16 |

### pnpm vs npm/yarn

```
pnpm:  ✅ Rápido, eficiente, workspace-ready
npm:   ❌ Lento, node_modules pesados
yarn:  ❌ Classic deprecated, Berry complejo
```

**Workspace config:**
```yaml
# pnpm-workspace.yaml
ignoredBuiltDependencies:
  - sharp
  - unrs-resolver
```

---

## Scripts de package.json

```json
{
  "scripts": {
    "dev": "next dev",       // Desarrollo (Turbopack)
    "build": "next build",   // Build producción
    "start": "next start",   // Servir producción
    "lint": "eslint"         // Linting
  }
}
```

---

## Resumen de Decisiones Técnicas

| Decisión | Elegido | Por qué |
|----------|---------|---------|
| Framework | Next.js | SSR, SEO, App Router, ecosistema |
| Routing | App Router | Server Components, layouts anidados |
| Estado global | Zustand | Liviano, sin boilerplate, persist |
| Estado feature | Context + useReducer | Scope limitado, sin dependencias extra |
| Estado local | useState | Simple, directo |
| CSS | Tailwind + CSS Modules | Flexibilidad + scoped styles |
| Iconos | lucide-react | Árbol de iconos, tree-shakeable |
| API calls | fetch nativo | Sin dependencias extra |
| Charts | Recharts | Declarativo, React-friendly |
| PDF | jsPDF + autotable | Maduro, flexible |
| Package manager | pnpm | Rápido, eficiente |
| Bundler | Turbopack | Built-in, rápido (Next.js 16) |
| Type safety | TypeScript | No negociable |

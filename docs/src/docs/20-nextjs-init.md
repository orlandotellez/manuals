# Next.js Init — Manual Técnico Completo

> **Stack:** Next.js 16+ · React 19+ · TypeScript 5+ · Tailwind CSS 4+ · Zustand 5+ · pnpm  
> **Patrón:** Feature-First Architecture · Container-Presentational · CSS Modules + Tailwind

Manual de referencia para iniciar proyectos frontend con Next.js, basado en la arquitectura y convenciones establecidas en el proyecto.

---

## Índice

1. [Stack Principal](#1-stack-principal)
2. [Creación del Proyecto](#2-creación-del-proyecto)
3. [Estructura de Carpetas](#3-estructura-de-carpetas)
4. [Arquitectura y Patrones](#4-arquitectura-y-patrones)
5. [Configuraciones](#5-configuraciones)
6. [App Router — Route Groups y Layouts](#6-app-router--route-groups-y-layouts)
7. [Server vs Client Components](#7-server-vs-client-components)
8. [Sistema de Estado](#8-sistema-de-estado)
9. [Componentes y UI](#9-componentes-y-ui)
10. [API y Servicios](#10-api-y-servicios)
11. [Dependencias](#11-dependencias)
12. [Snippets Clave](#12-snippets-clave)
13. [Convenciones de Nomenclatura](#13-convenciones-de-nomenclatura)
14. [Resumen de Patrones](#14-resumen-de-patrones)

---

## 1. Stack Principal

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | 16+ | Framework fullstack React (App Router) |
| React | 19+ | UI Library |
| TypeScript | 5+ | Tipado estático |
| Tailwind CSS | 4+ | Utility-first CSS (PostCSS) |
| Zustand | 5+ | Estado global liviano |
| pnpm | latest | Package manager (workspace-ready) |
| Turbopack | built-in | Bundler de desarrollo |

### Decisiones Técnicas Clave

| Decisión | Elegido | Por qué |
|----------|---------|---------|
| Framework | Next.js | SSR, SEO, App Router, ecosistema |
| Routing | App Router | Server Components, layouts anidados |
| Estado global | Zustand | ~1KB, sin Provider, persist built-in |
| Estado feature | Context + useReducer | Scope limitado, sin dependencias extra |
| Estado local | useState | Simple, directo |
| CSS | Tailwind + CSS Modules | Flexibilidad + scoped styles |
| Iconos | lucide-react | Árbol de iconos, tree-shakeable |
| API calls | fetch nativo | 0KB, tree-shakeable, suficiente |
| Charts | Recharts | Declarativo, React-friendly |
| Package manager | pnpm | Rápido, eficiente, workspace-ready |
| Bundler | Turbopack | Built-in con Next.js 16 |

---

## 2. Creación del Proyecto

### 2.1 Inicializar con create-next-app

```bash
pnpm create next-app@latest mi-proyecto --typescript --app --src-dir --turbo
cd mi-proyecto
```

Flags:
- `--typescript` — TypeScript configurado out of the box
- `--app` — App Router (no Pages Router)
- `--src-dir` — Código fuente en `src/`
- `--turbo` — Turbopack como bundler de desarrollo

### 2.2 Dependencias Base

```bash
# Producción
pnpm add zustand lucide-react recharts

# Desarrollo
pnpm add -D tailwindcss @tailwindcss/postcss
```

**Dependencias opcionales (agregar según necesidad):**

```bash
# Stripe (pagos)
pnpm add stripe @stripe/stripe-js

# PDF
pnpm add jspdf jspdf-autotable

# Excel
pnpm add xlsx
```

### 2.3 Estructura Inicial de Carpetas

```bash
mkdir -p src/{features,shared/{api,components,hooks,lib,store,types,utils}}
mkdir -p src/features/{admin,cart,product,shop}
```

### 2.4 Tailwind CSS v4

```bash
# postcss.config.mjs ya se crea con create-next-app
# Solo hay que asegurarse de que use @tailwindcss/postcss
```

```javascript
// postcss.config.mjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

```css
/* src/app/globals.css */
@import "tailwindcss";

:root {
  --primary-color: #f8fafc;
  --secondary-color: #fff;
  --card-color: #fff;
  --font-color-title: #000;
  --font-color-text: #000;
  --border-color: #e5e7eb;
}

* {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-geist-sans);
  background: #f8fafc;
}
```

> **Nota sobre Tailwind v4:** Cambió respecto a v3. Ahora se configura con `@tailwindcss/postcss` en lugar de `tailwindcss` + `autoprefixer`. Y la configuración va en CSS (no en `tailwind.config.js`). Se usa `@import "tailwindcss"` en globals.css.

### 2.5 Variables de Entorno

```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1" > .env.local
```

```bash
# .env.example
# API
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Stripe (opcional)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

**Regla:** Variables con prefijo `NEXT_PUBLIC_` se exponen al cliente (JavaScript). Las que no tienen prefijo son solo servidor.

---

## 3. Estructura de Carpetas

### 3.1 Árbol Completo de Alto Nivel

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

### 3.2 Estructura Detallada de `app/` (App Router)

```
app/
├── globals.css                       # Estilos globales, variables CSS, reset
├── layout.tsx                        # Root Layout (wrap providers globales)
│
├── (shop)/                           # Route Group — Tienda pública
│   ├── layout.tsx                    # Layout con Navbar + Footer
│   ├── layout.module.css
│   ├── page.tsx                      # Home page (hero, categorías, destacados)
│   ├── page.module.css
│   ├── cart/
│   │   ├── page.tsx
│   │   └── page.module.css
│   ├── checkout/
│   │   ├── page.tsx
│   │   └── page.module.css
│   ├── product/
│   │   └── [slug]/
│   │       ├── page.tsx
│   │       └── page.module.css
│   ├── profile/
│   │   ├── page.tsx
│   │   └── page.module.css
│   └── shop/
│       ├── page.tsx
│       ├── page.module.css
│       ├── ShopClient.tsx
│       └── ShopClient.module.css
│
├── (auth)/                           # Route Group — Autenticación
│   ├── layout.tsx
│   ├── layout.module.css
│   ├── login/
│   │   ├── page.tsx
│   │   └── page.module.css
│   └── register/
│       ├── page.tsx
│       └── page.module.css
│
└── (admin)/                          # Route Group — Panel Admin
    ├── layout.tsx                    # Layout con Sidebar + auth check
    ├── layout.module.css
    └── admin/
        ├── page.tsx                  # Dashboard principal
        ├── page.module.css
        ├── orders/                   # Gestión de pedidos
        │   ├── page.tsx
        │   └── page.module.css
        ├── products/                 # Gestión de productos
        │   ├── page.tsx
        │   └── page.module.css
        ├── sales/                    # Reportes de ventas
        │   └── page.tsx
        ├── users/                    # Gestión de usuarios
        │   ├── page.tsx
        │   └── page.module.css
        └── settings/                 # Configuración
            ├── page.tsx
            └── page.module.css
```

### 3.3 Estructura Detallada de `src/features/`

Cada feature es **autocontenida**: componentes, lógica, estilos y datos mock.

```
src/features/
├── admin/                        # Feature: Admin Panel
│   ├── Sidebar.tsx
│   ├── Sidebar.module.css
│   ├── orders/                   # Sub-feature
│   │   ├── Filters.tsx
│   │   ├── Filters.module.css
│   │   ├── Header.tsx
│   │   ├── Header.module.css
│   │   ├── OrdersTable.tsx
│   │   ├── OrdersTable.module.css
│   │   ├── Pagination.tsx
│   │   ├── Pagination.module.css
│   │   ├── ResultsInfo.tsx
│   │   ├── ResultsInfo.module.css
│   │   └── modals/
│   │       ├── ViewOrderModal.tsx
│   │       └── ViewOrderModal.module.css
│   ├── products/
│   │   └── ... (misma estructura que orders)
│   ├── sales/
│   │   ├── Header.tsx
│   │   ├── Header.module.css
│   │   ├── KPIsection.tsx
│   │   ├── KPIsection.module.css
│   │   ├── SalesChart.tsx
│   │   └── SalesChart.module.css
│   └── users/
│       └── ... (misma estructura que orders)
│
├── cart/                         # Feature: Carrito
│   ├── components/
│   │   ├── EmptyCart.tsx
│   │   ├── EmptyCart.module.css
│   │   ├── ItemsCart.tsx
│   │   ├── ItemsCart.module.css
│   │   ├── Summary.tsx
│   │   └── Summary.module.css
│   └── context/
│       └── CartContext.tsx
│
├── product/                      # Feature: Producto
│   ├── components/
│   │   ├── BreadCrumb.tsx
│   │   ├── BreadCrumb.module.css
│   │   ├── ProductCard.tsx
│   │   ├── ProductCard.module.css
│   │   ├── ProductDetail.tsx
│   │   ├── ProductDetail.module.css
│   │   ├── ProductNotFound.tsx
│   │   ├── ProductNotFound.module.css
│   │   ├── ProductRelated.tsx
│   │   └── ProductRelated.module.css
│   └── data/
│       ├── categories.ts
│       └── products.ts
│
└── shop/                         # Feature: Tienda/Catálogo
    └── components/
        ├── BreadCrumb.tsx
        ├── BreadCrumb.module.css
        ├── Sidebar.tsx
        ├── Sidebar.module.css
        ├── TopBar.tsx
        └── TopBar.module.css
```

### 3.4 Estructura Detallada de `src/shared/` (Columna Vertebral)

```
src/shared/
├── api/                          # Capa HTTP
│   ├── categories.ts
│   ├── dashboard.ts
│   ├── orders.ts
│   ├── products.ts
│   ├── profile.ts
│   └── users.ts
│
├── components/                   # Componentes compartidos
│   ├── ErrorState.tsx
│   ├── ErrorState.module.css
│   ├── Footer.tsx
│   ├── Footer.module.css
│   ├── LoadingState.tsx
│   ├── LoadingState.module.css
│   ├── StoreNavbar.tsx
│   └── StoreNavbar.module.css
│
├── hooks/                        # Hooks compartidos
│   ├── useAuth.ts
│   ├── useCategories.ts
│   ├── useOrders.ts
│   ├── useProducts.ts
│   ├── useSales.ts
│   └── useUsers.ts
│
├── lib/                          # Configuración y constantes
│   ├── constants.ts
│   ├── data.ts
│   └── mappers.ts
│
├── store/                        # Estado global (Zustand)
│   └── useSidebarStore.ts
│
├── types/                        # Tipos compartidos
│   └── index.ts
│
└── utils/                        # Funciones puras helper
    ├── auth.ts
    ├── format.ts
    └── invoice.ts
```

### 3.5 Responsabilidad de Cada Subcarpeta en `shared/`

| Subcarpeta | Propósito | Regla |
|------------|-----------|-------|
| `api/` | Llamadas HTTP | Solo fetch, sin JSX, sin hooks |
| `components/` | UI components reutilizables | Sin lógica de negocio |
| `hooks/` | Hooks compartidos | Lógica + estado reutilizable |
| `lib/` | Config, constantes, mappers | Sin side effects |
| `store/` | Estado global (Zustand) | Solo un store por archivo |
| `types/` | Interfaces compartidas | Solo tipos, sin código runtime |
| `utils/` | Funciones puras | Sin dependencias, sin side effects |

---

## 4. Arquitectura y Patrones

### 4.1 Feature-First + Capas

```
┌─────────────────────────────────────────────┐
│                  app/                        │
│  Next.js App Router (rutas + layouts)        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  (shop)  │  │  (auth)  │  │ (admin)  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
└───────┼──────────────┼──────────────┼────────┘
        │              │              │
┌───────┴──────────────┴──────────────┴────────┐
│              src/features/                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ product  │ │  cart   │ │    admin     │  │
│  │ components│ │components│ │  components  │  │
│  │ data/    │ │ context │ │  modals/     │  │
│  └──────────┘ └──────────┘ └──────────────┘  │
└──────────────────────┬────────────────────────┘
                       │
┌──────────────────────┴────────────────────────┐
│              src/shared/                       │
│  ┌──────┐ ┌──────┐ ┌────┐ ┌────┐ ┌───────┐   │
│  │ api  │ │hooks │ │lib │ │store│ │types  │   │
│  └──────┘ └──────┘ └────┘ └────┘ └───────┘   │
└────────────────────────────────────────────────┘
```

**Flujo de datos:**

```
pages/app → hooks (lógica) → api (HTTP) → Backend
         ↘ components (UI) ↗
```

### 4.2 Patrón Container-Presentational

Los **hooks** son los containers (tienen la lógica, el estado, las funciones).
Los **componentes** son presentacionales (reciben props, renderizan UI).

```
┌──────────────────┐      props       ┌──────────────────┐
│   Hook (Container) │ ──────────────> │ Component (View) │
│   - useState       │                 │   - Renderiza    │
│   - useEffect      │  callbacks      │   - Estilos      │
│   - fetch          │ <────────────── │   - Eventos      │
│   - handlers       │                 │                  │
└──────────────────┘                   └──────────────────┘
```

**EJEMPLO:**

```typescript
// ✗ MAL: Lógica dentro del componente
export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders().then(data => { ... });
  }, []);

  return <div>{orders.map(...)}</div>;
}

// ✓ BIEN: Hook container + Componente presentacional

// Hook: shared/hooks/useOrders.ts
export function useOrders() {
  const [orders, setOrders] = useState([]);
  // ... toda la lógica acá
  return { orders, loading, error, ... };
}

// Page: app/(admin)/admin/orders/page.tsx
export default function OrdersPage() {
  const { orders, loading } = useOrders();
  return <OrdersTable orders={orders} loading={loading} />;
}
```

### 4.3 Co-location de CSS Modules

Cada componente tiene su archivo `.module.css` al lado:

```
OrdersTable.tsx          ← Componente
OrdersTable.module.css   ← Estilos exclusivos del componente
```

**Ventajas:**
- Scoped styles (no hay colisiones de clases)
- Sin runtime (se compilan a clases únicas)
- Co-location: todo lo que necesita el componente está cerca

### 4.4 Estados de UI (Loading, Empty, Error, Success)

Todo componente que carga datos debe manejar estos 4 estados:

```typescript
function OrdersList() {
  const { orders, loading, error, fetchOrders } = useOrders();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} fetch={fetchOrders} />;
  if (orders.length === 0) return <p>No hay pedidos</p>;

  return <OrdersTable orders={orders} />;
}
```

| Estado | Componente | Acción |
|--------|-----------|--------|
| Loading | `LoadingState` (spinner) | - |
| Error | `ErrorState` (mensaje + botón reintentar) | `fetch()` |
| Empty | Mensaje contextual | CTA para crear/agregar |
| Success | Datos renderizados | - |

### 4.5 Data Flow Unidireccional

```
User Action
    │
    ▼
Component (onClick, onChange, etc.)
    │
    ▼
Hook Handler (handleCreate, handleDelete, etc.)
    │
    ├── API call (shared/api/xxx.ts)
    │       │
    │       ▼
    │   Response → error?
    │       │         │
    │      sí        no
    │       │         │
    │       ▼         ▼
    │   setError   setData (actualizar estado)
    │
    └── refetch (opcional)
```

**NUNCA:**
- Llamar a `fetch()` directamente en el componente
- Poner lógica de negocio en el JSX
- Mutar el estado directamente

### 4.6 Modales por Feature

Los modales viven DENTRO de la feature a la que pertenecen:

```
src/features/admin/orders/modals/
├── ViewOrderModal.tsx
└── ViewOrderModal.module.css

src/features/admin/products/modals/
├── CreateProductModal.tsx
├── EditProductModal.tsx
├── ViewProductModal.tsx
└── Modal.module.css
```

**Regla:** Si un modal solo se usa en una feature, vive EN ESA FEATURE. Si un modal se usa en múltiples features, va a `shared/components/`.

### 4.7 Protección de Rutas (Admin)

El layout admin verifica autenticación y rol:

```typescript
// app/(admin)/layout.tsx
'use client';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userStr);
    if (user.role === 'customer') {
      router.push('/');
      return;
    }

    setIsLoading(false);
  }, [router]);

  if (isLoading) return <Loader2 />;

  return (
    <div className={styles.container}>
      <SideBar />
      <main>{children}</main>
    </div>
  );
}
```

---

## 5. Configuraciones

### 5.1 `package.json`

```json
{
  "name": "mi-proyecto",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "next": "^16.2.0",
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "zustand": "^5.0.12",
    "lucide-react": "^0.577.0",
    "recharts": "^3.8.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "^16.1.7",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

**Dependencias opcionales:**

```json
"dependencies": {
  "@stripe/stripe-js": "^8.11.0",
  "stripe": "^20.4.1",
  "jspdf": "^4.2.1",
  "jspdf-autotable": "^5.0.7",
  "xlsx": "^0.18.5"
}
```

### 5.2 `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}
```

**Puntos clave:**
- `"strict": true` — No negociable
- `"paths": { "@/*": ["./src/*"] }` — Alias `@/` apunta a `src/`
- `"moduleResolution": "bundler"` — Requerido por Next.js
- `"plugins": [{ "name": "next" }]` — Plugin de TypeScript para Next.js

### 5.3 `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
};

export default nextConfig;
```

**Configuraciones adicionales comunes:**

```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};
```

### 5.4 `postcss.config.mjs` (Tailwind CSS v4)

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

### 5.5 `pnpm-workspace.yaml`

```yaml
ignoredBuiltDependencies:
  - sharp
  - unrs-resolver
```

### 5.6 `eslint.config.mjs`

```javascript
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
];

export default eslintConfig;
```

Esta es la configuración flat (nuevo formato ESLint v9). Next.js 16 usa este formato por defecto.

### 5.7 `.gitignore`

```
# dependencies
/node_modules

# next.js
/.next/
/out/

# production
/build

# env
.env.local

# misc
.DS_Store
*.pem

# debug
*.log

# typescript
*.tsbuildinfo
next-env.d.ts

# vercel
.vercel
```

---

## 6. App Router — Route Groups y Layouts

### 6.1 ¿Qué son los Route Groups?

Next.js App Router permite agrupar rutas **sin afectar la URL** usando paréntesis `()`. Esto permite tener layouts diferentes para distintos grupos de rutas.

```
app/
├── layout.tsx          ← Root: CartProvider, fonts, metadata
├── (shop)/
│   ├── layout.tsx      ← Shop: Navbar + Footer
│   ├── page.tsx        ← Home: /
│   ├── cart/page.tsx   ← /cart
│   └── ...
├── (auth)/
│   ├── layout.tsx      ← Auth: fondo limpio
│   ├── login/page.tsx  ← /login
│   └── register/page.tsx ← /register
└── (admin)/
    ├── layout.tsx      ← Admin: Sidebar + auth check
    └── admin/
        ├── page.tsx    ← /admin (dashboard)
        └── orders/page.tsx ← /admin/orders
```

**¿Por qué Route Groups?**
- Cada grupo tiene su propio layout sin anidar URLs
- El layout admin puede verificar auth sin afectar otras rutas
- El layout shop puede tener Navbar sin que el admin lo herede

### 6.2 Root Layout

```typescript
// app/layout.tsx
import { CartProvider } from "@/features/cart/context/CartContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${fonts} antialiased`}>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
```

### 6.3 Shop Layout

```typescript
// app/(shop)/layout.tsx
export default function ShopLayout({ children }) {
  return (
    <div className={styles.container}>
      <StoreNavbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
```

### 6.4 Admin Layout (con auth check)

```typescript
// app/(admin)/layout.tsx
'use client';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { collapsed } = useSideBarStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar auth + role admin
  }, []);

  if (isLoading) return <Loader2 />;

  return (
    <div className={`${styles.container} ${collapsed ? styles.collapsed : styles.expanded}`}>
      <SideBar />
      <main className={styles.content}>{children}</main>
    </div>
  );
}
```

### 6.5 Convenciones de Next.js App Router

| Archivo | Propósito |
|---------|-----------|
| `page.tsx` | Contenido de la ruta |
| `layout.tsx` | Layout compartido entre rutas hijas |
| `loading.tsx` | UI de carga |
| `error.tsx` | UI de error |
| `not-found.tsx` | Página 404 |
| `[slug]/` | Ruta dinámica |

---

## 7. Server vs Client Components

### 7.1 Regla Práctica

Si el componente necesita `useState`, `useEffect`, `onClick`, `localStorage`, o cualquier interacción del usuario → `'use client'`. Caso contrario, dejarlo como Server Component.

### 7.2 Tabla de Referencia

| Tipo | `'use client'`? | Cuándo usarlo |
|------|----------------|---------------|
| Layout root | ❌ No | Metadata, providers globales |
| Layout shop | ❌ No | Solo HTML estático |
| Layout auth | ❌ No | Solo HTML estático |
| Layout admin | ✅ Sí | Auth check, hooks, localStorage |
| Página home | ✅ Sí | Estado, efectos, interacciones |
| Página catálogo | ✅ Sí | Filtros, búsqueda |
| Componente UI | ✅ Sí | useState, onClick, etc. |
| API functions | N/A | Funciones puras, sin JSX |

---

## 8. Sistema de Estado

### 8.1 Estrategia General — Tres Capas de Estado

| Capa | Herramienta | Para qué |
|------|------------|----------|
| **Estado local** | `useState` / `useReducer` | Estado de un componente específico |
| **Estado de feature** | `Context` + `useReducer` | Estado compartido dentro de una feature |
| **Estado global** | **Zustand** | Estado compartido entre features |

### 8.2 Estado Local (useState)

Para estado que solo afecta a UN componente:

```typescript
const [searchTerm, setSearchTerm] = useState("");
const [showFilters, setShowFilters] = useState(false);
const [mounted, setMounted] = useState(false);
```

**Regla:** Si solo un componente y sus hijos directos usan este estado → `useState`.

### 8.3 Estado de Feature (Context + useReducer)

Para estado que necesita ser compartido DENTRO de una feature:

```typescript
// features/cart/context/CartContext.tsx
'use client';

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; product: Product; quantity?: number }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; items: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(
        item => item.product.id === action.product.id
      );
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.product.id === action.product.id
              ? { ...item, quantity: item.quantity + (action.quantity || 1) }
              : item
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { product: action.product, quantity: action.quantity || 1 }],
      };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.product.id !== action.productId),
      };
    case 'UPDATE_QUANTITY':
      if (action.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.product.id !== action.productId),
        };
      }
      return {
        ...state,
        items: state.items.map(item =>
          item.product.id === action.productId
            ? { ...item, quantity: action.quantity }
            : item
        ),
      };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'LOAD_CART':
      return { ...state, items: action.items };
    default:
      return state;
  }
}
```

**Provider global (desde root layout):**

```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
```

**Uso desde cualquier componente:**

```typescript
import { useCart } from '@/features/cart/context/CartContext';

function CartSummary() {
  const { items, subtotal, tax, total, itemCount } = useCart();
  return <div>Total: ${total}</div>;
}
```

### 8.4 Estado Global (Zustand)

Para estado que necesita ser compartido ENTRE features. Usamos **Zustand** porque:
- Sin boilerplate (no Provider, no reducer, no actions)
- Persistencia built-in (localStorage, sessionStorage)
- TypeScript first
- Bundle pequeño (~1KB)
- Funciona fuera de React (ideal para services/utils)

```typescript
// shared/store/useSidebarStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarStore {
  collapsed: boolean;
  setCollapsed: () => void;
}

export const useSideBarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      collapsed: false,
      setCollapsed: () => {
        set((state) => ({ collapsed: !state.collapsed }));
      },
    }),
    {
      name: "sidebar-storage", // key en localStorage
    }
  )
);
```

**Uso:**

```typescript
import { useSideBarStore } from "@/shared/store/useSidebarStore";

function Sidebar() {
  const { collapsed, setCollapsed } = useSideBarStore();

  return (
    <aside className={collapsed ? styles.collapsed : styles.expanded}>
      <button onClick={setCollapsed}>
        {collapsed ? <ChevronRight /> : <ChevronLeft />}
      </button>
    </aside>
  );
}
```

**Patrón Zustand:**
- 1 store = 1 archivo
- Store en `shared/store/`
- Nombre: `useNombreStore.ts`
- Usar `persist` middleware para persistencia automática

### 8.5 Data Fetching con Hooks (Patrón CRUD Completo)

Cada entidad tiene un hook que encapsula:
- Estado (`data`, `loading`, `error`)
- Fetch automático (useEffect)
- Handlers (CRUD)
- Debounce para búsqueda
- Paginación

```typescript
// shared/hooks/useProducts.ts
export function useProducts() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // 1. Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 2. Fetch
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listProducts({ search: debouncedSearch });
      setProducts(data.map(mapToAdminProduct));
    } catch {
      setError("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  // 3. Auto-fetch en mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // 4. Handlers CRUD
  const handleCreate = async (payload: CreateProductPayload) => {
    await createProduct(payload);
    await fetchProducts(); // refetch
  };

  const handleUpdate = async (id: string, payload: Partial<CreateProductPayload>) => {
    await updateProduct(id, payload);
    await fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;
    await deleteProduct(id);
    await fetchProducts();
  };

  // 5. Return
  return {
    products, loading, error,
    searchTerm, setSearchTerm,
    fetchProducts,
    handleCreate, handleUpdate, handleDelete,
  };
}
```

### 8.6 Debounce Pattern

Siempre que hay búsqueda en texto, aplicamos debounce de 300ms:

```typescript
// Opción 1: En el hook (estado separado)
const [searchTerm, setSearchTerm] = useState("");
const [debouncedSearch, setDebouncedSearch] = useState("");

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchTerm);
  }, 300);
  return () => clearTimeout(timer);
}, [searchTerm]);

// Opción 2: En el fetch (cuando hay múltiples filtros)
useEffect(() => {
  const id = setTimeout(() => {
    fetchOrders({ search: searchTerm, ... });
  }, searchTerm ? 300 : 0); // Solo debounce cuando hay texto

  return () => clearTimeout(id);
}, [searchTerm, ...otrosFiltros]);
```

### 8.7 Pagination Pattern

```typescript
const ITEMS_PER_PAGE = 10;

// En el hook
const [currentPage, setCurrentPage] = useState(1);
const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

// En el componente
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
/>
```

### 8.8 Reseteo de Estados en Filtros

Cuando cambian filtros, la página debe resetearse a 1:

```typescript
// ✓ BIEN
<input onChange={(e) => {
  setSearchTerm(e.target.value);
  setCurrentPage(1); // ← SIEMPRE resetear página
}} />
```

Este patrón se repite en TODOS los inputs de filtros.

### 8.9 Persistencia de Estado

**Carrito (localStorage manual):**

```typescript
// Load on mount
useEffect(() => {
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    dispatch({ type: 'LOAD_CART', items: JSON.parse(savedCart) });
  }
}, []);

// Save on change
useEffect(() => {
  localStorage.setItem('cart', JSON.stringify(state.items));
}, [state.items]);
```

**Sidebar (Zustand persist):** El middleware `persist` de Zustand escribe automáticamente a localStorage.

**Auth (localStorage manual):**

```typescript
localStorage.setItem('access_token', data.access_token);
localStorage.setItem('user', JSON.stringify(data.user));
localStorage.setItem('user_id', data.user.id);
```

---

## 9. Componentes y UI

### 9.1 Sistema de CSS: Tailwind + CSS Modules

| Situación | Usar |
|-----------|------|
| Layouts, spacing, flex/grid | Tailwind utility classes |
| Componentes complejos con estilo único | CSS Modules |
| Variables globales (colores, fuentes) | `globals.css` con custom properties |
| Animaciones | CSS Modules |
| Responsive | Tailwind (`sm:`, `md:`, `lg:`) |

### 9.2 CSS Modules — Patrón

```css
/* OrdersTable.module.css */
.table {
  width: 100%;
  border-collapse: collapse;
}

.header {
  background: #f9fafb;
  font-weight: 600;
}

.row {
  border-bottom: 1px solid #e5e7eb;
  transition: background 0.2s;
}

.row:hover {
  background: #f9fafb;
}

.cell {
  padding: 12px 16px;
  font-size: 14px;
}
```

```typescript
// OrdersTable.tsx
import styles from './OrdersTable.module.css';

export function OrdersTable({ orders }: Props) {
  return (
    <table className={styles.table}>
      <thead>
        <tr className={styles.header}>
          <th className={styles.cell}>ID</th>
          <th className={styles.cell}>Cliente</th>
        </tr>
      </thead>
      <tbody>
        {orders.map(order => (
          <tr key={order.id} className={styles.row}>
            <td className={styles.cell}>{order.id}</td>
            <td className={styles.cell}>{order.customer}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 9.3 Responsive Design

```css
/* StoreNavbar.module.css */
.searchDesktop {
  display: block;
}

.searchMobile {
  display: none;
}

@media (max-width: 768px) {
  .searchDesktop {
    display: none;
  }
  .searchMobile {
    display: block;
  }
}
```

O Tailwind para cosas más rápidas:

```html
<div className="hidden md:block">Desktop only</div>
<div className="block md:hidden">Mobile only</div>
```

### 9.4 Iconos (Lucide React)

Usamos **lucide-react** para todos los iconos.

```typescript
import { ShoppingCart, Search, Menu, X, User, AlertCircle, Loader2 } from 'lucide-react';

// Uso típico
<button className={styles.iconBtn}>
  <Search size={20} />
</button>
```

**Iconos comunes:**

| Icono | Uso |
|-------|-----|
| `ShoppingCart` | Carrito |
| `Search` | Búsqueda |
| `Menu` / `X` | Menú mobile |
| `User` | Perfil |
| `AlertCircle` | Error |
| `Loader2` | Loading spinner |
| `ChevronLeft` / `ChevronRight` | Sidebar collapse |
| `LayoutDashboard` | Dashboard |
| `Package` | Productos |
| `TrendingUp` | Ventas |
| `Users` | Usuarios |
| `Settings` | Configuración |
| `LogOut` | Cerrar sesión |
| `ArrowRight` | Links "Ver más" |
| `Filter` | Filtros |

### 9.5 Componentes Compartidos (shared/components/)

**ErrorState:**

```typescript
interface ErrorStateProps {
  error: string;
  fetch: () => void;  // callback para reintentar
}

export const ErrorState = ({ error, fetch }: ErrorStateProps) => {
  return (
    <div className={styles.errorState}>
      <AlertCircle className={styles.errorIcon} />
      <span>{error}</span>
      <button onClick={fetch} className={styles.retryButton}>
        Reintentar
      </button>
    </div>
  );
};
```

**LoadingState:** Spinner de carga (normalmente usando `Loader2` de lucide-react).

### 9.6 Admin CRUD Pattern

Cada entidad admin (orders, products, users) sigue el mismo patrón:

```
feature/
├── Header.tsx           → Título + botón de acción
├── Filters.tsx          → Búsqueda + filtros avanzados
├── ResultsInfo.tsx      → "Mostrando X de Y resultados"
├── Table.tsx            → Tabla de datos
├── Pagination.tsx       → Paginación
└── modals/
    ├── ViewModal.tsx    → Ver detalle
    ├── CreateModal.tsx  → Crear (si aplica)
    └── EditModal.tsx    → Editar (si aplica)
```

---

## 10. API y Servicios

### 10.1 Filosofía

- **Sin axios:** fetch nativo es suficiente + tree-shakeable
- **Sin React Query:** los hooks manejan el estado de fetching manualmente (más control, menos magic)
- **Sin capa de servicios OOP:** funciones independientes, no instancias de clases
- **Cada archivo = un recurso**

### 10.2 Estructura

```
src/shared/api/
├── categories.ts     → CRUD categorías
├── dashboard.ts      → Dashboard KPIs + charts
├── orders.ts         → CRUD pedidos
├── products.ts       → CRUD productos
├── profile.ts        → Perfil de usuario
└── users.ts          → Usuarios
```

**Regla:** 1 archivo por recurso. Si el proyecto crece, se agrupan por dominio.

### 10.3 Patrón de API Calls

```typescript
// shared/api/products.ts
import { API_URL } from "../lib/constants";
import { CreateProductPayload, ListProductsParams, ProductResponse } from "../types";
import { getAuthHeaders } from "../utils/auth";

// GET con query params
export async function listProducts(params: ListProductsParams = {}): Promise<ProductResponse[]> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set('search', params.search);
  if (params.category_id) searchParams.set('category_id', params.category_id);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const query = searchParams.toString();
  const url = `${API_URL}/products${query ? `?${query}` : ''}`;

  const res = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch products');
  }

  return res.json();
}

// POST (create)
export async function createProduct(payload: CreateProductPayload): Promise<ProductResponse> {
  const res = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to create product' }));
    throw new Error(error.message || 'Failed to create product');
  }

  return res.json();
}

// PUT (update)
export async function updateProduct(id: string, payload: Partial<CreateProductPayload>): Promise<ProductResponse> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('Failed to update product');
  return res.json();
}

// DELETE
export async function deleteProduct(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!res.ok) throw new Error('Failed to delete product');
  return res.json();
}
```

### 10.4 Manejo de Errores

Siempre lanzar errores con mensajes claros:

```typescript
// ✗ MAL
if (!res.ok) throw new Error('Error');

// ✓ BIEN: mensaje genérico
if (!res.ok) throw new Error('Failed to fetch orders');

// ✓ MEJOR: intentar obtener mensaje del backend
if (!res.ok) {
  const error = await res.json().catch(() => ({ message: 'Failed to update order' }));
  throw new Error(error.message || 'Failed to update order');
}
```

Los errores se capturan en los hooks:

```typescript
try {
  const data = await listProducts();
  setProducts(data);
} catch (err) {
  setError(err instanceof Error ? err.message : "Error desconocido");
}
```

### 10.5 Headers de Autenticación

Helper centralizado en `shared/utils/auth.ts`:

```typescript
// shared/utils/auth.ts
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}
```

**Uso:**

```typescript
import { getAuthHeaders } from "../utils/auth";

const res = await fetch(url, {
  method: 'POST',
  headers: getAuthHeaders(),
  body: JSON.stringify(payload),
});
```

### 10.6 URL Base

```typescript
// shared/lib/constants.ts
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
```

### 10.7 Convenciones de Nombres de Funciones

| Método | Propósito | Códigos esperados | Función |
|--------|-----------|-------------------|---------|
| GET | Obtener datos | 200 OK | `listXxx(params)` |
| GET | Obtener uno | 200 OK | `getXxx(id)` |
| POST | Crear recurso | 201 Created | `createXxx(payload)` |
| PUT | Actualizar recurso | 200 OK | `updateXxx(id, payload)` |
| DELETE | Eliminar recurso | 200 OK / 204 | `deleteXxx(id)` |

Siempre incluir `credentials: 'include'` para cookies de sesión.

### 10.8 Mappers: API → UI

Cuando el backend devuelve snake_case y el frontend usa camelCase:

```typescript
// shared/lib/mappers.ts

// API Response → Frontend type
export function mapToAdminProduct(p: any): AdminProduct {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category_name || p.category_id || "sin-categoria",
    categoryName: p.category_name,
    categoryId: p.category_id,
    stock: p.stock,
    price: p.price,
    originalPrice: p.original_price,   // snake_case → camelCase
    status: p.active ? "active" : "inactive",
    image: p.image,
    brand: p.brand,
    description: p.description,
    featured: p.featured,
  };
}

// OrderResponse → Order
export function mapApiOrderToUi(apiOrder: OrderResponse): Order {
  return {
    id: apiOrder.id,
    customer: apiOrder.customer_name || "Guest",
    email: apiOrder.customer_email || "",
    total: apiOrder.total,
    status: apiOrder.status as OrderStatus,
    date: apiOrder.created_at?.split("T")[0] || "",
    items: apiOrder.items?.length || 0,
  };
}
```

**¿Por qué mappers y no transformar en el hook?**
- Separación de responsabilidades
- Reutilizable (varios hooks pueden usar el mismo mapper)
- Testeable
- El hook se queda con lógica de estado, no de transformación

---

## 11. Dependencias

### 11.1 Dependencias de Producción

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

### 11.2 Dependencias de Desarrollo

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

### 11.3 Herramientas de Sistema

| Herramienta | Propósito | Instalación |
|------------|-----------|-------------|
| **pnpm** | Package manager | `npm i -g pnpm` |
| **Turbopack** | Bundler de Next.js (built-in) | Viene con Next.js 16 |

### 11.4 Scripts de package.json

| Script | Comando | Descripción |
|--------|---------|-------------|
| dev | `next dev` | Desarrollo con Turbopack |
| build | `next build` | Build producción |
| start | `next start` | Servir producción |
| lint | `eslint` | Linting |

---

## 12. Snippets Clave

### 12.1 Template de Hook CRUD Completo

```typescript
// shared/hooks/use[Recurso].ts
'use client';

import { useCallback, useEffect, useState } from "react";
import { list[Recurso], create[Recurso], update[Recurso], delete[Recurso] } from "../api/[recurso]";

const ITEMS_PER_PAGE = 10;

export function use[Recurso]() {
  // --- Estado ---
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filtros ---
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // --- Debounce ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- Fetch ---
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await list[Recurso]({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch || undefined,
        ...(statusFilter !== "all" && { status: statusFilter }),
      });
      setItems(data.items || data);
      setTotal(data.total ?? data.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Reset page cuando cambian filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  // --- Handlers CRUD ---
  const handleCreate = async (payload: any) => {
    await create[Recurso](payload);
    await fetchItems();
  };

  const handleUpdate = async (id: string, payload: any) => {
    await update[Recurso](id, payload);
    await fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar?")) return;
    await delete[Recurso](id);
    await fetchItems();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  // --- Computed ---
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const activeFiltersCount = [statusFilter !== "all"].filter(Boolean).length;

  return {
    items, loading, error, total, totalPages,
    currentPage, setCurrentPage,
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    activeFiltersCount, clearFilters,
    fetchItems, handleCreate, handleUpdate, handleDelete,
  };
}
```

### 12.2 Template de API Layer

```typescript
// shared/api/[recurso].ts
import { API_URL } from "../lib/constants";
import { getAuthHeaders } from "../utils/auth";

export interface List[Recurso]Params {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function list[Recurso](params: List[Recurso]Params = {}): Promise<any[]> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set('search', params.search);
  if (params.status) searchParams.set('status', params.status);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const query = searchParams.toString();
  const url = `${API_URL}/[recurso]${query ? `?${query}` : ''}`;

  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: `Failed to fetch [recurso]` }));
    throw new Error(error.message || `Failed to fetch [recurso]`);
  }
  return res.json();
}

export async function get[Recurso](id: string): Promise<any> {
  const res = await fetch(`${API_URL}/[recurso]/${id}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch [recurso]`);
  return res.json();
}

export async function create[Recurso](payload: any): Promise<any> {
  const res = await fetch(`${API_URL}/[recurso]`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create [recurso]`);
  return res.json();
}

export async function update[Recurso](id: string, payload: any): Promise<any> {
  const res = await fetch(`${API_URL}/[recurso]/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to update [recurso]`);
  return res.json();
}

export async function delete[Recurso](id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_URL}/[recurso]/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Failed to delete [recurso]`);
  return res.json();
}
```

### 12.3 Template de Zustand Store

```typescript
// shared/store/use[Nombre]Store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface [Nombre]Store {
  someValue: boolean;
  toggleValue: () => void;
  setValue: (value: boolean) => void;
}

export const use[Nombre]Store = create<[Nombre]Store>()(
  persist(
    (set) => ({
      someValue: false,
      toggleValue: () => {
        set((state) => ({ someValue: !state.someValue }));
      },
      setValue: (value: boolean) => {
        set({ someValue: value });
      },
    }),
    {
      name: "[nombre]-storage",
    }
  )
);
```

### 12.4 Template de Filtros con Búsqueda

```typescript
export function Filters({
  searchTerm, setSearchTerm, setCurrentPage,
  showFilters, setShowFilters,
  activeFiltersCount, statusFilter, setStatusFilter, clearFilters,
}: FiltersProps) {
  return (
    <>
      <div className={styles.filtersSection}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // ← SIEMPRE resetear página
            }}
          />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}>
          <Filter /> Filtros
          {activeFiltersCount > 0 && (
            <span className={styles.badge}>{activeFiltersCount}</span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className={styles.advancedFilters}>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">Todos</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
          <button onClick={clearFilters}>Limpiar filtros</button>
        </div>
      )}
    </>
  );
}
```

### 12.5 Template de Modal

```typescript
// features/[feature]/modals/Create[Entity]Modal.tsx
'use client';

export function Create[Entity]Modal({ isOpen, onClose, onSubmit }: Props) {
  const [formData, setFormData] = useState(defaultValues);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Crear [Entidad]</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          {/* Campos del formulario */}
          <div className={styles.actions}>
            <button type="button" onClick={onClose}>Cancelar</button>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 12.6 Template de Estados UI

```typescript
function [Recurso]List() {
  const { items, loading, error, fetchItems } = use[Recurso]();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} fetch={fetchItems} />;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No hay [recursos] disponibles</p>
      </div>
    );
  }

  return (
    <div>
      <ResultsInfo total={total} current={items.length} />
      <Table data={items} />
      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
```

### 12.7 Auth Helpers

```typescript
// shared/utils/auth.ts
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}
```

```typescript
// shared/hooks/useAuth.ts
export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Error al iniciar sesión');
    }

    const data = await res.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('user_id', data.user.id);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_id');
    setUser(null);
    router.push('/login');
  }, [router]);

  return { user, isAuthenticated: !!user, isLoading, login, logout };
}
```

### 12.8 Generación de Slug

```typescript
// shared/utils/format.ts
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // quitar acentos
    .replace(/[^a-z0-9\s-]/g, '')     // quitar caracteres especiales
    .replace(/\s+/g, '-')             // espacios → guiones
    .replace(/-+/g, '-')              // guiones múltiples → uno solo
    .trim();
}

export const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};
```

---

## 13. Convenciones de Nomenclatura

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Carpetas de features | `kebab-case` | `admin/`, `product/`, `shop/` |
| Carpetas de sub-features | `kebab-case` | `orders/`, `products/`, `sales/` |
| Componentes | `PascalCase` | `ProductCard.tsx`, `StoreNavbar.tsx` |
| Hooks | `usePascalCase` | `useProducts.ts`, `useAuth.ts` |
| APIs | `kebab-case` | `products.ts`, `categories.ts` |
| Tipos | `PascalCase` | `Product`, `OrderStatus` |
| Constantes | `UPPER_SNAKE_CASE` | `API_URL`, `ITEMS_PER_PAGE` |
| Funciones helper | `camelCase` | `getInitials()`, `generateSlug()` |
| CSS Modules | `Nombre.module.css` | `ProductCard.module.css` |
| Stores | `useNombreStore` | `useSidebarStore` |
| Context | `NombreContext` | `CartContext` |
| Modales | `VerboNombreModal` | `CreateProductModal` |

---

## 14. Resumen de Patrones

| Patrón | Aplicación |
|--------|------------|
| **Feature-First Architecture** | Cada feature autocontenida en `src/features/` |
| **Container-Presentational** | Hooks como containers, componentes como vistas |
| **Route Groups** | Layouts diferentes para auth/shop/admin sin anidar URLs |
| **Co-location** | CSS Modules, tests y datos viven junto al componente |
| **Estados de UI** | Loading / Empty / Error / Success en toda la app |
| **Data Flow Unidireccional** | Component → Hook → API → Estado → Re-render |
| **Modales por Feature** | Modales dentro de la feature que los usa |
| **Debounce Pattern** | 300ms de debounce en búsquedas |
| **Reset de Paginación** | Reset a página 1 al cambiar filtros |
| **Fetch nativo** | Sin axios, sin React Query, fetch directamente |
| **Mappers API → UI** | Transformación de datos entre backend y frontend |
| **Zustand + persist** | Estado global con persistencia automática |
| **Context + useReducer** | Estado compartido dentro de una feature |
| **CSS Modules + Tailwind** | Scoped styles para componentes, utility para layouts |
| **Protección de Rutas** | Auth check en layout admin con redirect |
| **Credential Cookies** | `credentials: 'include'` en todos los fetch |
| **Co-location de Estilos** | `.module.css` junto al componente |
| **Single Responsibility** | Cada archivo tiene UN solo propósito |

---

> **Nota:** Este manual se actualiza con cada proyecto. No es una verdad absoluta, es una base desde la cual iterar. 

# 01 — Estructura de Carpetas

> Árbol completo con descripción de cada carpeta y archivo.
> Usar como referencia para nuevos proyectos.

---

## Árbol Completo

```
frontend/
├── app/                                  # Next.js App Router
│   ├── globals.css                       # Estilos globales, variables CSS, reset
│   ├── layout.tsx                        # Root Layout (wrap providers globales)
│   │
│   ├── (shop)/                           # Route Group — Tienda pública
│   │   ├── layout.tsx                    # Layout con Navbar + Footer
│   │   ├── layout.module.css
│   │   ├── page.tsx                      # Home page (hero, categorías, destacados)
│   │   ├── page.module.css
│   │   ├── cart/                         # /cart
│   │   │   ├── page.tsx
│   │   │   └── page.module.css
│   │   ├── checkout/                     # /checkout
│   │   │   ├── page.tsx
│   │   │   └── page.module.css
│   │   ├── product/
│   │   │   └── [slug]/                   # /product/[slug] — Detalle de producto
│   │   │       ├── page.tsx
│   │   │       └── page.module.css
│   │   ├── profile/                      # /profile — Perfil de usuario
│   │   │   ├── page.tsx
│   │   │   └── page.module.css
│   │   └── shop/                         # /shop — Catálogo con filtros
│   │       ├── page.tsx                  # Server component wrapper
│   │       ├── page.module.css
│   │       ├── ShopClient.tsx            # Client component con lógica
│   │       └── ShopClient.module.css
│   │
│   ├── (auth)/                           # Route Group — Autenticación
│   │   ├── layout.tsx                    # Layout simple y limpio
│   │   ├── layout.module.css
│   │   ├── login/                        # /login
│   │   │   ├── page.tsx
│   │   │   └── page.module.css
│   │   └── register/                     # /register
│   │       ├── page.tsx
│   │       └── page.module.css
│   │
│   └── (admin)/                          # Route Group — Panel Admin
│       ├── layout.tsx                    # Layout con Sidebar + auth check
│       ├── layout.module.css
│       └── admin/
│           ├── page.tsx                  # Dashboard principal
│           ├── page.module.css
│           ├── orders/                   # Gestión de pedidos
│           │   ├── page.tsx
│           │   └── page.module.css
│           ├── products/                 # Gestión de productos
│           │   ├── page.tsx
│           │   └── page.module.css
│           ├── sales/                    # Reportes de ventas
│           │   └── page.tsx
│           ├── users/                    # Gestión de usuarios
│           │   ├── page.tsx
│           │   └── page.module.css
│           └── settings/                 # Configuración
│               ├── page.tsx
│               └── page.module.css
│
├── src/
│   ├── features/                         # Features de negocio
│   │   ├── admin/                        # Feature: Admin Panel
│   │   │   ├── Sidebar.tsx              # Sidebar de navegación admin
│   │   │   ├── Sidebar.module.css
│   │   │   ├── orders/                   # Sub-feature: Gestión de pedidos
│   │   │   │   ├── Filters.tsx          # Filtros de búsqueda + avanzados
│   │   │   │   ├── Filters.module.css
│   │   │   │   ├── Header.tsx           # Cabecera con acciones
│   │   │   │   ├── Header.module.css
│   │   │   │   ├── OrdersTable.tsx      # Tabla de pedidos
│   │   │   │   ├── OrdersTable.module.css
│   │   │   │   ├── Pagination.tsx       # Paginación
│   │   │   │   ├── Pagination.module.css
│   │   │   │   ├── ResultsInfo.tsx      # Contador de resultados
│   │   │   │   ├── ResultsInfo.module.css
│   │   │   │   └── modals/              # Modales de la feature
│   │   │   │       ├── ViewOrderModal.tsx
│   │   │   │       └── ViewOrderModal.module.css
│   │   │   ├── products/                 # Sub-feature: Gestión de productos
│   │   │   │   ├── Filters.tsx
│   │   │   │   ├── Filters.module.css
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Header.module.css
│   │   │   │   ├── ProductsTable.tsx
│   │   │   │   ├── ProductsTable.module.css
│   │   │   │   ├── Pagination.tsx
│   │   │   │   ├── Pagination.module.css
│   │   │   │   ├── ResultsInfo.tsx
│   │   │   │   ├── ResultsInfo.module.css
│   │   │   │   └── modals/
│   │   │   │       ├── CreateProductModal.tsx
│   │   │   │       ├── EditProductModal.tsx
│   │   │   │       ├── ViewProductModal.tsx
│   │   │   │       └── Modal.module.css
│   │   │   ├── sales/                    # Sub-feature: Ventas y reportes
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Header.module.css
│   │   │   │   ├── KPIsection.tsx       # Tarjetas de KPIs
│   │   │   │   ├── KPIsection.module.css
│   │   │   │   ├── SalesChart.tsx       # Gráfico de ventas
│   │   │   │   └── SalesChart.module.css
│   │   │   └── users/                    # Sub-feature: Gestión de usuarios
│   │   │       ├── Filters.tsx
│   │   │       ├── Filters.module.css
│   │   │       ├── Header.tsx
│   │   │       ├── Header.module.css
│   │   │       ├── Pagination.tsx
│   │   │       ├── Pagination.module.css
│   │   │       ├── ResultsInfo.tsx
│   │   │       ├── ResultsInfo.module.css
│   │   │       ├── UsersTable.tsx
│   │   │       ├── UsersTable.module.css
│   │   │       └── modals/
│   │   │           ├── CreateUserModal.tsx
│   │   │           ├── CreateUserModal.module.css
│   │   │           ├── EditUserModal.tsx
│   │   │           ├── EditUserModal.module.css
│   │   │           ├── ViewUserModal.tsx
│   │   │           └── ViewUserModal.module.css
│   │   │
│   │   ├── cart/                         # Feature: Carrito de compras
│   │   │   ├── components/              # UI del carrito
│   │   │   │   ├── EmptyCart.tsx        # Estado vacío
│   │   │   │   ├── EmptyCart.module.css
│   │   │   │   ├── ItemsCart.tsx        # Lista de items
│   │   │   │   ├── ItemsCart.module.css
│   │   │   │   ├── Summary.tsx          # Resumen + totales
│   │   │   │   └── Summary.module.css
│   │   │   └── context/                 # Estado del carrito (useReducer)
│   │   │       └── CartContext.tsx
│   │   │
│   │   ├── product/                      # Feature: Producto
│   │   │   ├── components/              # UI de producto
│   │   │   │   ├── BreadCrumb.tsx
│   │   │   │   ├── BreadCrumb.module.css
│   │   │   │   ├── ProductCard.tsx      # Card de producto (reutilizable)
│   │   │   │   ├── ProductCard.module.css
│   │   │   │   ├── ProductDetail.tsx    # Detalle completo
│   │   │   │   ├── ProductDetail.module.css
│   │   │   │   ├── ProductNotFound.tsx  # Estado 404 producto
│   │   │   │   ├── ProductNotFound.module.css
│   │   │   │   ├── ProductRelated.tsx   # Productos relacionados
│   │   │   │   └── ProductRelated.module.css
│   │   │   └── data/                    # Datos mock/seed
│   │   │       ├── categories.ts
│   │   │       └── products.ts
│   │   │
│   │   └── shop/                         # Feature: Tienda/Catálogo
│   │       ├── components/
│   │       │   ├── BreadCrumb.tsx
│   │       │   ├── BreadCrumb.module.css
│   │       │   ├── Sidebar.tsx          # Sidebar de filtros
│   │       │   ├── Sidebar.module.css
│   │       │   ├── TopBar.tsx           # Barra superior con filtros
│   │       │   └── TopBar.module.css
│   │
│   └── shared/                           # Código compartido (columna vertebral)
│       ├── api/                          # Capa HTTP
│       │   ├── categories.ts            # CRUD categorías
│       │   ├── dashboard.ts             # Dashboard + KPIs + chart
│       │   ├── orders.ts                # CRUD pedidos
│       │   ├── products.ts              # CRUD productos
│       │   ├── profile.ts               # Perfil de usuario
│       │   └── users.ts                 # Usuarios
│       │
│       ├── components/                   # Componentes compartidos
│       │   ├── ErrorState.tsx           # Estado de error con retry
│       │   ├── ErrorState.module.css
│       │   ├── Footer.tsx               # Footer del sitio
│       │   ├── Footer.module.css
│       │   ├── LoadingState.tsx         # Estado de carga
│       │   ├── LoadingState.module.css
│       │   ├── StoreNavbar.tsx          # Navbar principal
│       │   └── StoreNavbar.module.css
│       │
│       ├── hooks/                        # Hooks compartidos
│       │   ├── useAuth.ts               # Auth (login, logout, sesión)
│       │   ├── useCategories.ts         # Categorías + seed
│       │   ├── useOrders.ts             # Pedidos con filtros
│       │   ├── useProducts.ts           # Productos CRUD
│       │   ├── useSales.ts              # Dashboard de ventas
│       │   └── useUsers.ts              # Usuarios CRUD con filtros
│       │
│       ├── lib/                          # Configuración y utilidades
│       │   ├── constants.ts             # Constantes globales (API_URL)
│       │   ├── data.ts                  # Seed data
│       │   └── mappers.ts              # Mappers API → UI
│       │
│       ├── store/                        # Estado global (Zustand)
│       │   └── useSidebarStore.ts       # Sidebar collapsed state
│       │
│       ├── types/                        # Tipos compartidos
│       │   └── index.ts                 # Interfaces globales
│       │
│       └── utils/                        # Funciones puras helper
│           ├── auth.ts                  # Helpers de auth (getAuthHeaders)
│           ├── format.ts                # Formateo (initials, slugs)
│           └── invoice.ts              # Generación de PDF facturas
│
├── public/                               # Assets estáticos
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── .env.example                          # Variables de entorno necesarias
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── postcss.config.mjs
├── tsconfig.json
└── README.md
```

---

## Responsabilidad de Cada Carpeta

### `app/` — Enrutamiento (Next.js App Router)

Carpeta que define TODAS las rutas de la aplicación. Next.js 16 usa App Router con carpetas anidadas.

**Route Groups** (carpetas entre paréntesis):
- `(shop)/` → Agrupa rutas públicas de la tienda. Comparten layout con Navbar + Footer.
- `(auth)/` → Agrupa rutas de autenticación. Layout minimalista.
- `(admin)/` → Agrupa rutas del panel admin. Layout con Sidebar + protección de ruta.

**Convenciones de Next.js App Router:**
| Archivo | Propósito |
|---------|-----------|
| `page.tsx` | Contenido de la ruta |
| `layout.tsx` | Layout compartido entre rutas hijas |
| `loading.tsx` | UI de carga |
| `error.tsx` | UI de error |
| `not-found.tsx` | Página 404 |
| `[slug]/` | Ruta dinámica |

### `src/features/` — Módulos de Negocio

Cada carpeta representa una feature o dominio de negocio. Es **autocontenida**:
- Sus componentes
- Su lógica de estado (context/hooks locales)
- Sus datos mock
- Sus estilos

**Estructura interna típica de una feature:**
```
feature/
├── components/      → UI components de la feature
├── context/         → Context/state local de la feature
├── data/           → Datos mock/seed (si aplica)
├── hooks/          → Hooks específicos de la feature
└── modals/         → Modales de la feature
```

### `src/shared/` — Columna Vertebral

Código que NO pertenece a ninguna feature en particular pero es usado por varias.

| Subcarpeta | Propósito | Regla |
|------------|-----------|-------|
| `api/` | Llamadas HTTP | Solo fetch, sin JSX, sin hooks |
| `components/` | UI components reutilizables | Sin lógica de negocio |
| `hooks/` | Hooks compartidos | Lógica + estado reutilizable |
| `lib/` | Config, constantes, mappers | Sin side effects |
| `store/` | Estado global (Zustand) | Solo un store por archivo |
| `types/` | Interfaces compartidas | Solo tipos, sin código runtime |
| `utils/` | Funciones puras | Sin dependencias, sin side effects |

### `public/` — Assets Estáticos

Solo archivos estáticos (SVG, imágenes, favicon). Se sirven desde `/`.

---

## Convenciones de Nomenclatura

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

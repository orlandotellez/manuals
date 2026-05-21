# 04 — Componentes y UI

> Sistema de componentes, estilos y manejo de UI.

---

## 1. Sistema de CSS

Usamos **Tailwind CSS v4** + **CSS Modules**.

### ¿Cuándo usar cada uno?

| Situación | Usar |
|-----------|------|
| Layouts, spacing, flex/grid | Tailwind utility classes |
| Componentes complejos con estilo único | CSS Modules |
| Variables globales (colores, fuentes) | `globals.css` con custom properties |
| Animaciones | CSS Modules |
| Responsive | Tailwind (`sm:`, `md:`, `lg:`) |

### CSS Modules — Patrón

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

### Variables Globales (globals.css)

```css
:root {
  --primary-color: #f8fafc;
  --secondary-color: #fff;
  --card-color: #fff;
  --window-color: #ffffff;
  --preview-color: #f8fafc;
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

---

## 2. Componentes Compartidos (shared/components/)

### StoreNavbar
Navbar principal del sitio con:
- Logo
- Búsqueda (desktop + mobile)
- Carrito con badge
- Menú de categorías
- Menú mobile responsive
- Link a perfil/login

```typescript
// StoreNavbar.tsx
'use client';

export const StoreNavbar = () => {
  const { itemCount } = useCart();
  const { isAuthenticated } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      {/* Logo */}
      {/* Search */}
      {/* Cart with badge */}
      {/* Categories nav */}
      {/* Mobile menu */}
    </header>
  );
};
```

### Footer
Footer simple con información de la empresa.

### ErrorState
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

### LoadingState
Spinner de carga (normalmente usando `Loader2` de lucide-react).

---

## 3. Componentes de Feature (features/*/components/)

Cada feature tiene sus propios componentes organizados por funcionalidad.

### Admin CRUD Pattern

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

### Cart Components

```
features/cart/components/
├── EmptyCart.tsx    → "Tu carrito está vacío" + CTA
├── ItemsCart.tsx    → Lista de productos en carrito
└── Summary.tsx      → Subtotal, IVA, total + checkout
```

### Product Components

```
features/product/components/
├── BreadCrumb.tsx       → Navegación: Inicio > Categoría > Producto
├── ProductCard.tsx      → Card reutilizable (home, shop, relacionados)
├── ProductDetail.tsx    → Detalle completo del producto
├── ProductNotFound.tsx  → 404 de producto
└── ProductRelated.tsx   → Productos relacionados
```

---

## 4. Iconos (Lucide React)

Usamos **lucide-react** para todos los iconos.

```typescript
import { ShoppingCart, Search, Menu, X, User, AlertCircle, Loader2 } from 'lucide-react';

// Uso típico
<button className={styles.iconBtn}>
  <Search size={20} />
</button>
```

**Iconos comunes en el proyecto:**

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
| `ShoppingCart` | Pedidos |
| `TrendingUp` | Ventas |
| `Users` | Usuarios |
| `Settings` | Configuración |
| `LogOut` | Cerrar sesión |
| `ArrowRight` | Links "Ver más" |
| `Filter` | Filtros |
| `Calendar` | Fecha |
| `Truck`, `Shield`, `Headphones` | Features hero |

---

## 5. Layouts

### Root Layout (app/layout.tsx)
```typescript
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

### Shop Layout (app/(shop)/layout.tsx)
```typescript
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

### Admin Layout (app/(admin)/layout.tsx)
```typescript
'use client';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { collapsed } = useSideBarStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar auth + role
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

---

## 6. Responsive Design

Usamos media queries en CSS Modules:

```css
/* StoreNavbar.module.css */
.searchDesktop {
  display: block;
}

.searchMobile {
  display: none;
}

.mobileMenu {
  display: none;
}

@media (max-width: 768px) {
  .searchDesktop {
    display: none;
  }

  .searchMobile {
    display: block;
  }

  .mobileMenu {
    display: block;
  }
}
```

O Tailwind para cosas más rápidas:
```html
<div className="hidden md:block">Desktop only</div>
<div className="block md:hidden">Mobile only</div>
```

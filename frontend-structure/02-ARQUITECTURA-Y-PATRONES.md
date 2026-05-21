# 02 — Arquitectura y Patrones

> Cómo se estructura la aplicación, cómo fluyen los datos y qué patrones usamos.

---

## Arquitectura General: Feature-First + Capas

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

---

## Patrón: Container-Presentational

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
// Hook: useOrders.ts
export function useOrders() {
  const [orders, setOrders] = useState([]);
  // ... toda la lógica acá
  return { orders, loading, error, ... };
}

// Page: page.tsx
export default function OrdersPage() {
  const { orders, loading } = useOrders();
  return <OrdersTable orders={orders} loading={loading} />;
}
```

---

## Patrón: Route Groups (Layouts Anidados)

Next.js App Router permite agrupar rutas sin afectar la URL.

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

---

## Patrón: Co-location de CSS Modules

Cada componente tiene su archivo `.module.css` al lado:

```
OrdersTable.tsx          ← Componente
OrdersTable.module.css   ← Estilos exclusivos del componente
```

**Ventajas:**
- Scoped styles (no hay colisiones de clases)
- Sin runtime (se compilan a clases únicas)
- Co-location: todo lo que necesita el componente está cerca

**Uso:**
```typescript
import styles from './OrdersTable.module.css';

export function OrdersTable({ orders }: Props) {
  return (
    <table className={styles.table}>
      {orders.map(order => (
        <tr key={order.id} className={styles.row}>
          <td className={styles.cell}>{order.id}</td>
        </tr>
      ))}
    </table>
  );
}
```

---

## Patrón: Estados de UI (Loading, Empty, Error, Success)

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

---

## Patrón: Data Flow Unidireccional

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

---

## Patrón: Modales por Feature

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

**Regla:** Si un modal solo se usa en una feature, vive EN ESA FEATURE.
Si un modal se usa en múltiples features, va a `shared/components/`.

---

## Patrón: Protección de Rutas (Admin)

El layout admin verifica autenticación y rol:

```typescript
// (admin)/layout.tsx
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

## Cuándo Usar Server vs Client Components

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

**Regla práctica:** Si el componente necesita `useState`, `useEffect`, `onClick`, `localStorage`, o cualquier interacción del usuario → `'use client'`. Caso contrario, dejarlo como Server Component.

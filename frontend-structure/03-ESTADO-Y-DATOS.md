# 03 — Estado y Datos

> Cómo manejamos el estado, el fetching de datos y el flujo de información.

---

## Estrategia General

Usamos **tres capas de estado**:

| Capa | Herramienta | Para qué |
|------|------------|----------|
| **Estado local** | `useState` / `useReducer` | Estado de un componente específico |
| **Estado de feature** | `Context` + `useReducer` | Estado compartido dentro de una feature |
| **Estado global** | **Zustand** | Estado compartido entre features |

---

## 1. Estado Local (useState)

Para estado que solo afecta a UN componente:

```typescript
const [searchTerm, setSearchTerm] = useState("");
const [showFilters, setShowFilters] = useState(false);
const [mounted, setMounted] = useState(false);
```

**Regla:** Si solo un componente y sus hijos directos usan este estado → `useState`.

---

## 2. Estado de Feature (Context + useReducer)

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

---

## 3. Estado Global (Zustand)

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

---

## 4. Data Fetching con Hooks

Cada entidad tiene un hook que encapsula:
- Estado (`data`, `loading`, `error`)
- Fetch automático (useEffect)
- Handlers (CRUD)
- Debounce para búsqueda
- Paginación

**Patrón de Hook:**

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

---

## 5. Debounce Pattern

Siempre que hay búsqueda en texto, aplicamos debounce de 300ms:

```typescript
// Opción 1: En el hook
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

---

## 6. Pagination Pattern

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

---

## 7. Reseteo de Estados

Cuando cambian filtros, la página debe resetearse a 1:

```typescript
// ✗ MAL
<input onChange={(e) => setSearchTerm(e.target.value)} />

// ✓ BIEN
<input onChange={(e) => {
  setSearchTerm(e.target.value);
  setCurrentPage(1); // ← importante
}} />
```

Este patrón se repite en TODOS los inputs de filtros.

---

## 8. Estados de Carga y Persistencia

**Carrito (localStorage):**
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

**Sidebar (Zustand persist):**
El middleware `persist` de Zustand escribe automáticamente a localStorage.

**Auth (localStorage manual):**
```typescript
localStorage.setItem('access_token', data.access_token);
localStorage.setItem('user', JSON.stringify(data.user));
localStorage.setItem('user_id', data.user.id);
```

# 07 — Snippets y Ejemplos

> Fragmentos de código reutilizables para copiar/pegar en nuevos proyectos.

---

## 1. Nuevo Hook CRUD Completo

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
    // Datos
    items, loading, error, total, totalPages,
    // Paginación
    currentPage, setCurrentPage,
    // Búsqueda
    searchTerm, setSearchTerm,
    // Filtros
    statusFilter, setStatusFilter,
    activeFiltersCount, clearFilters,
    // Acciones
    fetchItems, handleCreate, handleUpdate, handleDelete,
  };
}
```

---

## 2. API Layer Snippet

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

export interface [Recurso]Response {
  id: string;
  // ... campos
}

export async function list[Recurso](params: List[Recurso]Params = {}): Promise<[Recurso]Response[]> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set('search', params.search);
  if (params.status) searchParams.set('status', params.status);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const query = searchParams.toString();
  const url = `${API_URL}/[recurso]${query ? `?${query}` : ''}`;

  const res = await fetch(url, { credentials: 'include' });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: `Failed to fetch ${[recurso]}` }));
    throw new Error(error.message || `Failed to fetch ${[recurso]}`);
  }

  return res.json();
}

export async function get[Recurso](id: string): Promise<[Recurso]Response> {
  const res = await fetch(`${API_URL}/[recurso]/${id}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch ${[recurso]}`);
  return res.json();
}

export async function create[Recurso](payload: any): Promise<[Recurso]Response> {
  const res = await fetch(`${API_URL}/[recurso]`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: `Failed to create ${[recurso]}` }));
    throw new Error(error.message || `Failed to create ${[recurso]}`);
  }
  return res.json();
}

export async function update[Recurso](id: string, payload: any): Promise<[Recurso]Response> {
  const res = await fetch(`${API_URL}/[recurso]/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to update ${[recurso]}`);
  return res.json();
}

export async function delete[Recurso](id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_URL}/[recurso]/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Failed to delete ${[recurso]}`);
  return res.json();
}
```

---

## 3. Zustand Store Snippet

```typescript
// shared/store/use[Nombre]Store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface [Nombre]Store {
  // Estado
  someValue: boolean;
  // Acciones
  toggleValue: () => void;
  setValue: (value: boolean) => void;
}

export const use[Nombre]Store = create<[Nombre]Store>()(
  persist(
    (set) => ({
      // Estado inicial
      someValue: false,

      // Acciones
      toggleValue: () => {
        set((state) => ({ someValue: !state.someValue }));
      },
      setValue: (value: boolean) => {
        set({ someValue: value });
      },
    }),
    {
      name: "[nombre]-storage", // key en localStorage
    }
  )
);
```

---

## 4. Estados UI (Loading + Empty + Error + Success)

```typescript
// Componente con manejo de estados
function [Recurso]List() {
  const { items, loading, error, fetchItems } = use[Recurso]();

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  // Error
  if (error) {
    return <ErrorState error={error} fetch={fetchItems} />;
  }

  // Empty
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No hay [recursos] disponibles</p>
      </div>
    );
  }

  // Success
  return (
    <div>
      <ResultsInfo total={total} current={items.length} />
      <Table data={items} />
      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
```

---

## 5. Filtros con Búsqueda + Filtros Avanzados

```typescript
// Componente de filtros reutilizable
export function Filters({
  searchTerm,
  setSearchTerm,
  setCurrentPage,
  showFilters,
  setShowFilters,
  activeFiltersCount,
  statusFilter,
  setStatusFilter,
  clearFilters,
}: FiltersProps) {
  return (
    <>
      {/* Search + Filter Toggle */}
      <div className={styles.filtersSection}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // ← SIEMPRE resetear página
            }}
          />
        </div>

        <button
          className={`${styles.filterToggle} ${showFilters ? styles.active : ""}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter />
          Filtros
          {activeFiltersCount > 0 && (
            <span className={styles.badge}>{activeFiltersCount}</span>
          )}
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className={styles.advancedFilters}>
          <div className={styles.filterGroup}>
            <label>Estado</label>
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
          </div>

          <button onClick={clearFilters}>Limpiar filtros</button>
        </div>
      )}
    </>
  );
}
```

---

## 6. Modal Pattern

```typescript
// features/[feature]/modals/Create[Entity]Modal.tsx
'use client';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreatePayload) => Promise<void>;
}

export function Create[Entity]Modal({ isOpen, onClose, onSubmit }: CreateModalProps) {
  const [formData, setFormData] = useState<CreatePayload>(defaultValues);
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

---

## 7. Layout con Route Group

```typescript
// app/(admin)/layout.tsx
'use client';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <SideBar />
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}

// app/(admin)/admin/products/page.tsx
export default function AdminProductsPage() {
  const { products, loading, error, fetchProducts, ... } = useProducts();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} fetch={fetchProducts} />;

  return (
    <div>
      <Header title="Productos" onCreate={() => setModalOpen(true)} />
      <Filters ... />
      <ResultsInfo ... />
      <ProductsTable ... />
      <Pagination ... />
    </div>
  );
}
```

---

## 8. CSS Module con Variables Globales

```css
/* Component.module.css */
@value --border-color, --font-color-text from '../../app/globals.css';

.container {
  border: 1px solid var(--border-color);
  color: var(--font-color-text);
}

@media (max-width: 768px) {
  .container {
    padding: 8px;
  }
}
```

---

## 9. Generación de Slug

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

## 10. Auth Helpers

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
// shared/hooks/useAuth.ts — login y logout
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

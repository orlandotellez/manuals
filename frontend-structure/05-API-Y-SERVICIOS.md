# 05 — API y Servicios

> Capa de comunicación con el backend. Fetch nativo, sin axios, sin React Query.

---

## Filosofía

- **Sin axios:** fetch nativo es suficiente + tree-shakeable
- **Sin React Query:** los hooks manejan el estado de fetching manualmente (más control, menos magic)
- **Sin capa de servicios OOP:** funciones independientes, no instancias de clases
- **Cada archivo = un recurso**

---

## Estructura

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

---

## Patrón de API Calls

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

---

## Manejo de Errores

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
// En el hook
try {
  const data = await listProducts();
  setProducts(data);
} catch (err) {
  setError(err instanceof Error ? err.message : "Error desconocido");
}
```

---

## Headers de Autenticación

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

---

## URL Base

```typescript
// shared/lib/constants.ts
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
```

La URL viene de `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

Las variables con prefijo `NEXT_PUBLIC_` se exponen al cliente.

---

## Convenciones

| Método | Propósito | Códigos esperados |
|--------|-----------|-------------------|
| GET | Obtener datos | 200 OK |
| POST | Crear recurso | 201 Created |
| PUT | Actualizar recurso | 200 OK |
| DELETE | Eliminar recurso | 200 OK / 204 No Content |

**Estructura de nombres de funciones:**
- `listXxx(params)` → GET list
- `getXxx(id)` → GET single
- `createXxx(payload)` → POST
- `updateXxx(id, payload)` → PUT
- `deleteXxx(id)` → DELETE

**Credentials:**
Siempre incluir `credentials: 'include'` para cookies de sesión.

---

## Mappers: API → UI

Cuando el backend devuelve snake_case y el frontend usa camelCase (o viceversa):

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
    // ... mapear todos los campos
  };
}
```

**¿Por qué mappers y no transformar en el hook?**
- Separación de responsabilidades
- Reutilizable (varios hooks pueden usar el mismo mapper)
- Testeable
- El hook se queda con lógica de estado, no de transformación

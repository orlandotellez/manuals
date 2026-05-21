# 08 — Configuraciones

> Archivos de configuración del proyecto. Referencia rápida para nuevos proyectos.

---

## package.json

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

**Dependencias opcionales (agregar según necesidad):**
```json
"dependencies": {
  "@stripe/stripe-js": "^8.11.0",   // Stripe client
  "stripe": "^20.4.1",               // Stripe server
  "jspdf": "^4.2.1",                 // PDF generation
  "jspdf-autotable": "^5.0.7",       // PDF tables
  "xlsx": "^0.18.5"                  // Excel export
}
```

---

## tsconfig.json

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
    "plugins": [
      {
        "name": "next"
      }
    ],
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

---

## next.config.ts

```typescript
import type { NextConfig from "next";

const nextConfig: NextConfig = {
  // Turbopack (default en Next.js 16)
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

---

## postcss.config.mjs (Tailwind CSS v4)

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

**Importante:** Tailwind v4 cambió respecto a v3. Ahora se configura con `@tailwindcss/postcss` en lugar de `tailwindcss` + `autoprefixer`. Y la configuración va en CSS (no en `tailwind.config.js`):

```css
/* globals.css */
@import "tailwindcss";
```

---

## pnpm-workspace.yaml

```yaml
ignoredBuiltDependencies:
  - sharp
```

Este archivo es necesario si usas `sharp` (optimización de imágenes en Next.js) u otros paquetes con dependencias nativas.

---

## .env.example

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Stripe (opcional)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

**.gitignore debe ignorar `.env.local`:**
```
.env.local
```

---

## eslint.config.mjs

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

---

## .gitignore

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

## Variables de Entorno Usadas

| Variable | Dónde se usa | Propósito |
|----------|-------------|-----------|
| `NEXT_PUBLIC_API_URL` | `shared/lib/constants.ts` | URL base de la API |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client | Key pública de Stripe |
| `STRIPE_SECRET_KEY` | Stripe server | Key secreta de Stripe |

**Regla:** Variables con prefijo `NEXT_PUBLIC_` se exponen al cliente (JavaScript). Las que no tienen prefijo son solo servidor.

---

## Resumen de Setup Inicial

```bash
# 1. Crear proyecto
pnpm create next-app@latest mi-proyecto --typescript --app --src-dir --turbo
cd mi-proyecto

# 2. Dependencias base
pnpm add zustand lucide-react recharts
pnpm add -D tailwindcss @tailwindcss/postcss

# 3. Estructura de carpetas
mkdir -p src/{features,shared/{api,components,hooks,lib,store,types,utils}}
mkdir -p src/features/{admin,cart,product,shop}

# 4. Configurar alias @/ (ya viene con Next.js)
# tsconfig.json ya tiene: "paths": { "@/*": ["./src/*"] }

# 5. Tailwind v4
# postcss.config.mjs: plugins: { "@tailwindcss/postcss": {} }
# globals.css: @import "tailwindcss";

# 6. .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1" > .env.local

# 7. Tipos base
# shared/types/index.ts

# 8. Constantes
# shared/lib/constants.ts → API_URL

# 9. ¡A codear!
```

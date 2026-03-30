# Primeros pasos - React Native 

Este manual te guiará paso a paso para entender y desarrollar una aplicación de React Native desde 0. Usamos **Expo** con **expo-router**, que es la forma más moderna y recomendada de crear apps con React Native.

---

## 1. Requisitos Previos

Antes de comenzar, necesitas tener instalado en tu computadora:

### 1.1 Node.js (versión 18 o superior)

```bash
# Verificar si tienes Node instalado
node --version

# Si no lo tienes, instálalo desde https://nodejs.org
# O usa nvm (recomendado)
nvm install 20
nvm use 20
```

---

## 2. Instalación del Proyecto

### 2.1 Instalar react native

Con esto lo creamos desde 0 sin ninguna plantilla inicial

```bash
pnpx create-expo-app@latest nombre_proyecto --template blank
cd nombre_proyect0
```

Con esto instalamos ya con una estructura predefinica y con typescript 

```bash
pnpx create-expo-app@latest
```

### 2.2 Instalar dependencias

```bash
# Usando pnpm (importante: no uses npm install)
pnpm add @expo/metro-runtime@~6.1.2 expo@~54.0.33 expo-constants@~18.0.13 expo-linking@~8.0.11 expo-router@~6.0.23 expo-status-bar@~3.0.9 lucide-react-native@^1.7.0 react@19.1.0 react-dom@19.1.0 react-native@0.81.5 react-native-safe-area-context@~5.6.2 react-native-screens@~4.16.0 react-native-web@^0.21.2 && pnpm add -D @types/react@~19.1.17 typescript@~5.9.3
```

Esto leerá el archivo `package.json` e instalará todas las dependencias listadas:

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| expo | ~54.0.33 | Framework principal |
| expo-router | ~6.0.23 | Sistema de navegación basado en archivos |
| react-native | 0.81.5 | Núcleo de React Native |
| react | 19.1.0 | Biblioteca de UI |
| lucide-react-native | ^1.7.0 | Iconos |
| react-native-safe-area-context | ~5.6.2 | Manejo de áreas seguras (notch, etc.) |
| react-native-screens | ~4.16.0 | Optimización de navegación |

### 2.3 Configurar variables de entorno (si es necesario)

Crea un archivo `.env` en la raíz del proyecto:

```bash
# Ejemplo de variables
API_URL=http://localhost:3000
```

---

## 3. Ejecutar la Aplicación

### 3.1 Modo desarrollo con Expo

```bash
# Iniciar el servidor de desarrollo
pnpm start

# O simplemente
pnpm start --clear
```

Esto abrirá una interfaz en tu terminal con un código QR.

# Resetear cache

```bash
pnpm expo start -c
```

### 3.2 Ejecutar en un dispositivo físico

1. Instala **Expo Go** en tu teléfono (disponible en App Store y Play Store)
2. Escanea el código QR que aparece en la terminal
3. La app se cargará automáticamente

### 3.3 Ejecutar en Android

```bash
pnpm android
```

Esto abrirá el emulador de Android (si está configurado) o te dará instrucciones.

### 3.4 Ejecutar en iOS (solo macOS)

```bash
pnpm ios
```

Requiere tener Xcode instalado y configurado.

### 3.5 Ejecutar en Web

```bash
pnpm web
```

La app se abrirá en tu navegador (funcionalidad limitada, no todas las APIs nativas funcionan).

---

## 4. Estructura del Proyecto

Este proyecto sigue la **File-based Routing** (enrutamiento basado en archivos) de expo-router. La estructura es fundamental entenderla:

```
mobile-app/
├── app/                      # Directorio de rutas (expo-router)
│   ├── _layout.tsx           # Layout raíz (Stack Navigator)
│   └── (tabs)/               # Grupo de pestañas
│       ├── _layout.tsx       # Layout de pestañas (Tab Navigator)
│       ├── index.tsx         # Pantalla "Librería"
│       └── profile.tsx       # Pantalla "Perfil"
├── assets/                   # Imágenes, fuentes, iconos
│   ├── icon.png
│   ├── splash-icon.png
│   └── adaptive-icon.png
├── app.json                  # Configuración de Expo
├── package.json              # Dependencias y scripts
├── tsconfig.json             # Configuración de TypeScript
└── pnpm-lock.yaml            # Lockfile de dependencias
```

### 4.1 Anatomía de una ruta

Cada archivo `.tsx` en la carpeta `app/` representa una ruta:

| Archivo | Ruta | Descripción |
|---------|------|-------------|
| `app/_layout.tsx` | `/` | Layout raíz,envuelve toda la app |
| `app/(tabs)/_layout.tsx` | `/` | Layout de pestañas |
| `app/(tabs)/index.tsx` | `/` | Pantalla principal (Librería) |
| `app/(tabs)/profile.tsx` | `/profile` | Pantalla de perfil |

**Nota**: Los paréntesis en `(tabs)` son solo para agrupar lógicamente, no afectan la URL.

---

## 5. Explicación de los Archivos Clave

### 5.1 app.json

Este archivo configura la aplicación Expo:

```json
{
  "expo": {
    "name": "mobile-app",
    "slug": "mobile-app",
    "version": "1.0.0",
    "orientation": "portrait",      // Solo vertical
    "icon": "./assets/icon.png",    // Icono de la app
    "scheme": "bookteka-app",       // URL scheme para deep links
    "userInterfaceStyle": "light",  // Tema claro
    "newArchEnabled": true,         // Nueva arquitectura de React Native
    "splash": { ... },              // Pantalla de carga
    "ios": { ... },                 // Configuración iOS
    "android": { ... },             // Configuración Android
    "plugins": ["expo-router"]      // Plugin de navegación
  }
}
```

### 5.2 app/_layout.tsx (Layout Raíz)

```tsx
import { Stack } from 'expo-router';

type RootRoutes = "(tabs)";

interface StackConfig {
  name: RootRoutes;
  headerShown: boolean;
  title?: string;
  presentation?: 'modal' | 'card' | 'fullScreenModal';
}

const ROOT_STACK: StackConfig[] = [
  {
    name: "(tabs)",
    headerShown: false
  },
];

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#fff',
        contentStyle: { backgroundColor: '#000' },
      }}
    >
      {ROOT_STACK.map((route) => (
        <Stack.Screen
          key={route.name}
          name={route.name}
          options={{
            headerShown: route.headerShown,
            title: route.title,
            presentation: route.presentation,
          }}
        />
      ))}
    </Stack>
  );
}

```

**Concepto clave**: Un `Stack` es como una pila de tarjetas. Cuando navegas a una nueva pantalla, se apila encima. Cuando presionas "atrás", se remove.

### 5.3 app/(tabs)/_layout.tsx (Layout de Pestañas)

```tsx
import { Tabs } from "expo-router";
import { Book, User } from "lucide-react-native";

type TabRoutes = "index" | "profile";

interface TabConfig {
  name: TabRoutes;
  title: string;
  icon: typeof Book;
}

const TABS: TabConfig[] = [
  { name: "index", title: "Librería", icon: Book },
  { name: "profile", title: "Perfil", icon: User },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarStyle: { backgroundColor: '#000' },
        tabBarActiveTintColor: '#fff',
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => (
              <tab.icon color={color} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}


```

**Concepto clave**: Un `Tabs` Navigator muestra una barra inferior con iconos. Cada ícono representa una pantalla diferente.

### 5.4 package.json - Scripts disponibles

```json
{
  "scripts": {
    "start": "expo start",          // Iniciar servidor dev
    "android": "expo start --Android", // Ejecutar en Android
    "ios": "expo start --ios",      // Ejecutar en iOS
    "web": "expo start --web"       // Ejecutar en web
  }
}
```

---

## 6. Cómo Agregar Nuevas Funcionalidades

### 6.1 Agregar una nueva pestaña

1. Crea un nuevo archivo en `app/(tabs)/`, por ejemplo `settings.tsx`:

```tsx
import { View, Text } from "react-native";

export default function SettingsScreen() {
  return (
    <View>
      <Text>Configuración</Text>
    </View>
  );
}
```

2. Actualiza `app/(tabs)/_layout.tsx` para incluir la nueva pestaña:

```tsx
import { Settings } from "lucide-react-native"; // Importa el icono

const TABS = [
  { name: "index", title: "Librería", icon: Book },
  { name: "profile", title: "Perfil", icon: User },
  { name: "settings", title: "Ajustes", icon: Settings }, // Nueva pestaña
];
```

### 6.2 Agregar una nueva pantalla (no tabs)

1. Crea `app/nueva-pantalla.tsx`:

```tsx
import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";

export default function NuevaPantalla() {
  const router = useRouter();

  return (
    <View>
      <Text>¡Hola desde una nueva pantalla!</Text>
      <Button title="Volver" onPress={() => router.back()} />
    </View>
  );
}
```

2. Navega desde cualquier lugar:

```tsx
import { Button } from "react-native";
import { useRouter } from "expo-router";

export default function MiComponente() {
  const router = useRouter();

  return (
    <Button 
      title="Ir a nueva pantalla" 
      onPress={() => router.push("/nueva-pantalla")} 
    />
  );
}
```

### 6.3 Instalar nuevas dependencias

```bash
# Instalar un paquete compatible con Expo
pnpm expo install nombre-del-paquete

# Por ejemplo, para agregar animations
pnpm expo install react-native-reanimated
```

**Importante**: Siempre usa `pnpm expo install` en lugar de `pnpm install` directamente. Esto asegura que la versión sea compatible con tu SDK de Expo.

---

## 7. Conceptos Fundamentales que Debes Dominar

### 7.1 Componentes de React Native

A diferencia de React para web (donde usas `<div>`, `<span>`, etc.), en React Native usas componentes específicos:

| React Web | React Native | Uso |
|-----------|--------------|-----|
| `<div>` | `<View>` | Contenedor |
| `<span>` / `<p>` | `<Text>` | Texto |
| `<button>` | `<Button>` | Botón básico |
| `<img>` | `<Image>` | Imágenes |
| `<input>` | `<TextInput>` | Campos de texto |
| `<a>` | `<Link>` (de expo-router) | Enlaces |

### 7.2 Estilos en React Native

No se usa CSS. En su lugar, usas un objeto de estilo similar a CSS-in-JS:

```tsx
import { StyleSheet, View, Text } from "react-native";

export default function MiComponente() {
  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Hola</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
});
```

### 7.3 Navegación con expo-router

expo-router maneja la navegación automáticamente basándose en la estructura de archivos. Usa el hook `useRouter` para programar navegaciones:

```tsx
import { useRouter } from "expo-router";

export default function Componente() {
  const router = useRouter();

  // Navegar a una ruta
  router.push("/ruta");
  
  // Navegar con parámetros
  router.push("/libro/123");
  
  // Volver atrás
  router.back();
}
```

### 7.4 Props y Estado

Al igual que en React, los componentes pueden recibir props y tener estado:

```tsx
import { useState } from "react";
import { View, Text, Button } from "react-native";

interface Props {
  nombre: string;
}

export default function Contador({ nombre }: Props) {
  const [contador, setContador] = useState(0);

  return (
    <View>
      <Text>{nombre}: {contador}</Text>
      <Button title="Incrementar" onPress={() => setContador(c => c + 1)} />
    </View>
  );
}
```

---

## 8. Buenas Prácticas

### 8.1 Estructura recomendada para una app más grande

A medida que el proyecto crece, organiza tu código así:

```
app/
├── (tabs)/              # Rutas de pestañas
│   ├── _layout.tsx
│   ├── index.tsx
│   └── profile.tsx
├── (stack)/             # Rutas apiladas (modal, etc.)
│   ├── _layout.tsx
│   ├── detalle-libro.tsx
│   └── editar-perfil.tsx
├── _layout.tsx          # Layout raíz
└── +not-found.tsx      # Pantalla 404
```

### 8.2 Componentes reutilizables

Crea una carpeta `components/` fuera de `app/`:

```
mobile-app/
├── app/
├── components/
│   ├── Button.tsx
│   ├── Card.tsx
│   └── Input.tsx
└── ...
```

### 8.3 Tipado con TypeScript

Siempre tipa tus componentes y funciones:

```tsx
// ✅ Bien
interface BookCardProps {
  title: string;
  author: string;
  coverUrl?: string;
}

export function BookCard({ title, author, coverUrl }: BookCardProps) {
  // ...
}

// ❌ Evitar
export function BookCard(props) {
  // ...
}
```

### 8.4 No modifiques node_modules

Nunca edites archivos dentro de `node_modules`. Si necesitas personalizar algo, haz un componente propio o ejectua el proyecto.

---

## 9. Comandos Útiles

```bash
# Limpiar cache y reinstallar
pnpm start --clear

pnpm expo start -c

# Ver información del proyecto Expo
npx expo info

# Actualizar Expo a la última versión
pnpm expo upgrade

# Generar build de producción (Android)
npx expo build:android

# Generar build de producción (iOS)
npx expo build:ios
```

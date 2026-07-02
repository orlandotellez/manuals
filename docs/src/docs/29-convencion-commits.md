# Convención de Commits
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

Para mantener un historial de cambios claro, legible y consistente, todos los commits deben seguir este formato.

## Indice

- [Formato](#formato)
- [Tipos de Commit](#tipos-de-commit)
- [Alcance (scope)](#alcance-scope)
- [Ejemplos de Commits](#ejemplos-de-commits)
- [Reglas](#reglas)
- [Cuerpo del Commit](#cuerpo-del-commit-opcional)
- [Footer](#footer-opcional)
- [Configuracion recomendada](#configuracion-recomendada)
- [Buenas practicas](#buenas-practicas)
- [Ejemplo completo](#ejemplo-completo)

## Formato

    <tipo>(<alcance>): <descripción breve>
    <tipo>(<alcance>)!: <descripción breve>   (breaking change)

El alcance es opcional. Si el cambio afecta a varias areas del sistema, puede omitirse.
Para cambios que rompen compatibilidad hacia atras, agrega `!` antes de los dos puntos.

**Ejemplos:**

    feat(misiones): agregar nueva misión de reconocimiento
    feat(api)!: cambiar esquema de respuesta a JSON


## Tipos de Commit

| Tipo       | Descripción |
|-------------|-------------|
| **feat**     | Nueva funcionalidad o característica |
| **fix**      | Corrección de errores |
| **refactor** | Refactorización sin cambiar la lógica |
| **docs**     | Cambios en documentación |
| **style**    | Cambios de formato o estilo (sin afectar la lógica) |
| **perf**     | Mejoras de rendimiento |
| **test**     | Agregar o actualizar tests |
| **chore**    | Tareas de mantenimiento (deps, tooling, build, etc.) |
| **ci**       | Cambios en CI/CD o automatización |
| **core**     | Cambios en funcionalidad central o infraestructura |


## Alcance (scope)

El alcance indica qué parte del sistema se ve afectada.

Ejemplos comunes:

| Alcance     | Descripción |
|--------------|-------------|
| **ui**        | Componentes de interfaz de usuario |
| **auth**      | Sistema de autenticación |
| **api**       | Endpoints o lógica backend |
| **db**        | Modelos o consultas de base de datos |
| **config**    | Configuración del proyecto |
| **archivos**  | Subida/descarga o manejo de archivos |
| **routes**    | Sistema de rutas o navegación |
| **security**  | Cambios de seguridad o validaciones |
| **performance** | Optimizaciones de rendimiento |

> Puedes definir otros alcances según tu proyecto (por ejemplo `routes(admin)` o `service/chat`).


## Ejemplos de Commits
-  `feat(ui): agregar componente SelectMulti con opción "Ninguno"` 
-   `fix(api): corregir error al formatear fechas en response` 
-  `refactor(hooks): simplificar lógica de sincronización con backend` 
-  `docs(readme): actualizar pasos de instalación` 
-  `style(button): ajustar padding y tipografía` 
-  `core(auth): mover validación de token al middleware` 
-  `perf(db): optimizar consulta de usuarios activos` 
-   `chore(deps): actualizar react a v18` 
-  `ci(github): agregar flujo de tests en pull requests`
-  `feat(api)!: migrar a autenticacion por tokens (breaking change)`


## Reglas

- **Máximo 50 caracteres** en la primera línea  
- Usa **modo imperativo** (“agregar”, no “agregado” o “agrega”)  
- **No pongas punto final** en la descripción  
- Deja **una línea en blanco** antes del cuerpo  
- En el cuerpo explica el **qué** y el **por qué**, no el cómo  
- En el cuerpo, máximo **72 caracteres por línea**

---

## Cuerpo del Commit (opcional)

Se usa para dar más contexto cuando el cambio no es trivial.

**Ejemplo:**

    Se agrega validación para evitar duplicados en la tabla de equipos.
    Esto evita errores al sincronizar datos con el backend.

---

## Footer (opcional)

Se usa para asociar issues, referenciar tickets o indicar cambios mayores.
Tambien puedes usar `!` despues del tipo/alcance como atajo para indicar un breaking change (ver [Formato](#formato)).

    Fixes #123

    Closes #456

    BREAKING CHANGE: ahora se requiere token de autenticación


---

## Configuración recomendada

#### 1. Plantilla local de commit

Guarda el contenido en un archivo llamado `.gitmessage` y ejecuta:

    git config --local commit.template .gitmessage

#### 2. Configuración en VS Code
Agrega esto en tu archivo settings.json:


    {
      "git.useEditorAsCommitInput": true,
      "git.verboseCommit": true,
      "git.enableSmartCommit": true,
      "git.suggestSmartCommit": true,
      "git.allowForcePush": false,
      "conventionalCommits.showEditor": true,
      "conventionalCommits.promptBody": true,
      "conventionalCommits.promptFooter": true
    }
#### 3. GitHub Copilot (commit instructions) 
Instrucciones para generar mensajes coherentes: 

    → Usa formato: <tipo>(<alcance>): <descripción> 
    → Ej: feat(auth): implementar login con OAuth 
    → Primera línea ≤50 chars, sin punto final 
    → Cuerpo: qué + por qué, ≤72 chars/línea

### Buenas prácticas
- Usa un tipo y alcance que realmente describan el cambio
- Sé específico y conciso
- Si el cambio es grande, explica el contexto en el cuerpo
- Evita commits genéricos como "update" o "fix bug"
- Prioriza la claridad sobre la cantidad de palabras

### Ejemplo completo



    feat(api): agregar endpoint para obtener movimientos recientes
    
    Se agrega un nuevo endpoint GET /movimientos/recentes para
    recuperar los últimos movimientos de la base de datos, filtrados
    por usuario y rango de fechas.
    
    Closes #45

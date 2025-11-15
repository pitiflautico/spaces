# 🛠️ GUÍA DE DESARROLLO — Marketing Spaces

> **OBJETIVO**: Garantizar desarrollo coherente, sin duplicación de código, siguiendo los patrones establecidos.

---

## 🎯 METODOLOGÍA: BUSCAR → REUTILIZAR → EXTENDER → CREAR

### Flujo de Decisión

```
┌─────────────────────────────────┐
│ ¿Necesito implementar X?        │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 1. BUSCAR: ¿Ya existe?          │
│    - Grep en componentes        │
│    - Revisar types/index.ts     │
│    - Revisar lib/store.ts       │
└────────────┬────────────────────┘
             │
             ▼
         ┌───┴───┐
         │¿Existe?│
         └───┬───┘
             │
      ┌──────┴──────┐
      │             │
    SÍ│             │NO
      │             │
      ▼             ▼
┌─────────┐   ┌─────────────┐
│2. REUT. │   │3. EXTENDER? │
│o EXTEND │   │¿Algo similar?│
└─────────┘   └──────┬──────┘
                     │
              ┌──────┴──────┐
              │             │
            SÍ│             │NO
              │             │
              ▼             ▼
        ┌─────────┐   ┌─────────┐
        │EXTENDER │   │4. CREAR │
        │ EXIST.  │   │  NUEVO  │
        └─────────┘   └─────────┘
```

---

## 📍 PASO 1: BUSCAR (Siempre primero)

### Comandos de Búsqueda Rápida

```bash
# ¿Existe componente similar?
grep -r "export function.*Block" components/
grep -r "export const.*Module" components/

# ¿Existe tipo similar?
cat types/index.ts | grep "interface\|type"

# ¿Existe action similar en store?
cat lib/store.ts | grep -A 3 ":\s*("

# ¿Existe hook custom?
find . -name "use*.ts*"

# ¿Existe utilidad similar?
ls lib/

# Buscar por palabra clave
grep -r "connection" --include="*.ts*" .
```

### Checklist de Búsqueda

Antes de crear cualquier cosa, verificar:

- [ ] ¿Existe componente con funcionalidad similar?
- [ ] ¿Existe tipo/interface que pueda extender?
- [ ] ¿Existe action en store que haga algo parecido?
- [ ] ¿Existe utilidad que pueda reutilizar?
- [ ] ¿He revisado PROJECT_STATUS.md?

---

## 🔄 PASO 2: REUTILIZAR

### Componentes Reutilizables

| Componente | Ubicación | Cuándo usar |
|------------|-----------|-------------|
| `ModuleBlock` | `/components/canvas/ModuleBlock.tsx` | Base para cualquier módulo |
| `ConnectionLines` | `/components/canvas/ConnectionLines.tsx` | Renderizar conexiones SVG |
| `Canvas` | `/components/canvas/Canvas.tsx` | Container principal con zoom/pan |
| `DotGrid` | `/components/canvas/DotGrid.tsx` | Fondo con grid |
| `CanvasControls` | `/components/canvas/CanvasControls.tsx` | Controles de zoom |
| `Sidebar` | `/components/sidebar/Sidebar.tsx` | Panel lateral |

### Tipos Reutilizables

```typescript
// types/index.ts - Usar estos tipos siempre

// Básicos
Position { x: number, y: number }
Size { width: number, height: number }

// Módulos
ModuleStatus = 'idle' | 'running' | 'done' | 'error'
ModuleType = 'local-project-analysis' | ...
Module { id, type, name, position, size, status, ports, data }

// Conexiones
ModulePort { id, type, label, connected }
ModuleConnection { id, sourceModuleId, sourcePortId, targetModuleId, targetPortId }

// Espacios
Space { id, name, modules, connections, createdAt, updatedAt }

// Canvas
CanvasState { zoom, pan }
```

### Actions Reutilizables

```typescript
// lib/store.ts - Usar estas actions siempre

// CRUD Módulos
const { addModule, updateModule, deleteModule } = useSpaceStore()

// Ejemplo de uso
updateModule(moduleId, { status: 'running' })
updateModule(moduleId, { data: { outputs: result } })

// CRUD Conexiones
const { addConnection, deleteConnection } = useSpaceStore()

// Canvas
const { setZoom, setPan, resetCanvas } = useSpaceStore()

// Helper
const currentSpace = useSpaceStore(state => state.getCurrentSpace())
```

---

## 🧩 PASO 3: EXTENDER

### Extender Tipos Existentes

❌ **MAL** (duplicar):
```typescript
// types/my-types.ts - NO CREAR ARCHIVO NUEVO
interface MyModule {
  id: string
  type: string
  name: string
  // ...
}
```

✅ **BIEN** (extender):
```typescript
// types/index.ts - EXTENDER TIPO EXISTENTE
import { Module } from '@/types'

// Añadir nuevo campo a Module existente
interface Module {
  id: string
  type: ModuleType
  name: string
  position: Position
  size: Size
  status: ModuleStatus
  ports: { input: ModulePort[], output: ModulePort[] }
  data: ModuleData
  metadata?: ModuleMetadata  // ← NUEVO CAMPO OPCIONAL
}

// O crear tipo específico extendiendo
interface AIEngineModule extends Module {
  type: 'ai-engine'
  data: AIEngineData
}
```

### Extender Componentes con Props

❌ **MAL** (copiar componente):
```typescript
// MyModuleBlock.tsx - NO COPIAR ModuleBlock
export function MyModuleBlock() {
  // Copia todo el código de ModuleBlock...
}
```

✅ **BIEN** (añadir props opcionales):
```typescript
// ModuleBlock.tsx - EXTENDER CON PROPS
interface ModuleBlockProps {
  module: Module
  showAdvancedControls?: boolean  // ← NUEVA PROP OPCIONAL
  onCustomAction?: () => void      // ← NUEVA PROP OPCIONAL
}

export function ModuleBlock({
  module,
  showAdvancedControls = false,
  onCustomAction
}: ModuleBlockProps) {
  // Usar props opcionales
  {showAdvancedControls && (
    <button onClick={onCustomAction}>Advanced</button>
  )}
}
```

### Extender Store con Nuevas Actions

```typescript
// lib/store.ts - AÑADIR al final de la interfaz

interface SpaceStore {
  // ... actions existentes ...

  // ← NUEVAS ACTIONS
  executeModuleChain: (startModuleId: string) => Promise<void>
  validateConnection: (conn: ModuleConnection) => ValidationResult
  resetModuleCascade: (moduleId: string) => void
}

// Implementación
export const useSpaceStore = create<SpaceStore>((set, get) => ({
  // ... implementaciones existentes ...

  // ← NUEVAS IMPLEMENTACIONES
  executeModuleChain: async (startModuleId: string) => {
    const space = get().getCurrentSpace()
    // ...lógica...
  },

  validateConnection: (conn: ModuleConnection) => {
    // ...lógica...
  },

  resetModuleCascade: (moduleId: string) => {
    // ...lógica...
  },
}))
```

---

## ✨ PASO 4: CREAR (Solo si es necesario)

### Cuándo Crear un Nuevo Componente

Crear nuevo componente **SOLO SI**:

1. ✅ No existe nada similar (verificado con grep)
2. ✅ No se puede extender uno existente con props
3. ✅ Tiene responsabilidad única y clara
4. ✅ Es reutilizable en múltiples lugares
5. ✅ Mejora la organización del código

### Plantilla de Nuevo Componente

```tsx
'use client'

// 1. IMPORTS: Primero externos, luego internos
import { useState, useCallback } from 'react'
import { useSpaceStore } from '@/lib/store'
import { Module, ModuleType } from '@/types'

// 2. TIPOS: Props del componente
interface NombreComponenteProps {
  required: string
  optional?: number
}

// 3. COMPONENTE: Export nombrado
export function NombreComponente({ required, optional = 0 }: NombreComponenteProps) {
  // 4. HOOKS DE STORE (primero)
  const { modules, updateModule } = useSpaceStore()

  // 5. STATE LOCAL (después)
  const [localState, setLocalState] = useState<string>('')

  // 6. HANDLERS (con useCallback si es necesario)
  const handleAction = useCallback(() => {
    // Lógica
  }, [/* deps */])

  // 7. EFFECTS (si hay)
  // useEffect(...)

  // 8. EARLY RETURNS (si hay condiciones)
  if (!modules.length) return null

  // 9. RENDER
  return (
    <div className="...">
      {/* JSX limpio y legible */}
    </div>
  )
}
```

### Naming Conventions

```typescript
// Archivos y carpetas
components/canvas/ModuleBlock.tsx        // PascalCase para componentes
lib/module-helpers.ts                    // kebab-case para utils
types/index.ts                           // lowercase para tipos

// Dentro del código
const DEFAULT_ZOOM = 1                   // UPPER_SNAKE_CASE para constantes
function calculatePosition() {}          // camelCase para funciones
type ModuleStatus = 'idle' | ...        // PascalCase para tipos
interface ModuleData {}                  // PascalCase para interfaces
```

### Estructura de Carpetas

```
components/
├── canvas/          # Todo relacionado con el canvas
│   ├── Canvas.tsx
│   ├── ModuleBlock.tsx
│   └── ...
├── modules/         # Módulos específicos (LocalProjectAnalysis, AIEngine, etc.)
├── sidebar/         # Componentes del sidebar
└── ui/              # Componentes UI reutilizables (botones, inputs, etc.)

lib/
├── store.ts         # Zustand store
├── hooks/           # Custom hooks
├── utils/           # Utilidades generales
└── api/             # Helpers de API

types/
└── index.ts         # Todas las definiciones de tipos
```

---

## 🔍 PATRONES ESPECÍFICOS DEL PROYECTO

### Patrón: Crear Nuevo Módulo

**Referencia**: `LocalProjectAnalysisModule.tsx`

```tsx
'use client'

import { useState } from 'react'
import { useSpaceStore } from '@/lib/store'
import { Module } from '@/types'

// 1. Definir tipos de inputs (en types/index.ts)
interface MiModuloInputs {
  input1: string
  input2: boolean
}

// 2. Definir tipos de outputs (en types/index.ts)
interface MiModuloOutputs {
  output1: any
  output2: any
}

// 3. Props del componente
interface MiModuloProps {
  module: Module
}

// 4. Componente
export function MiModulo({ module }: MiModuloProps) {
  const { updateModule } = useSpaceStore()

  // State local para inputs
  const [inputs, setInputs] = useState<MiModuloInputs>({
    input1: '',
    input2: false,
  })

  // Handler de ejecución
  const handleRun = async () => {
    try {
      // 1. Cambiar estado a running
      updateModule(module.id, { status: 'running' })

      // 2. Llamar a API
      const response = await fetch('/api/mi-modulo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs),
      })

      const result = await response.json()

      // 3. Actualizar con resultados
      updateModule(module.id, {
        status: 'done',
        data: { outputs: result },
      })
    } catch (error) {
      // 4. Manejar error
      updateModule(module.id, { status: 'error' })
      alert(`Error: ${error.message}`)
    }
  }

  // 5. Renderizar inputs y outputs
  return (
    <div className="p-4">
      {/* Inputs */}
      <div className="space-y-3">
        <input
          value={inputs.input1}
          onChange={(e) => setInputs({ ...inputs, input1: e.target.value })}
          className="w-full bg-dark-card border border-dark-border rounded px-3 py-2"
        />
      </div>

      {/* Botón Run */}
      <button
        onClick={handleRun}
        disabled={module.status === 'running'}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
      >
        {module.status === 'running' ? 'Running...' : 'Run'}
      </button>

      {/* Outputs */}
      {module.status === 'done' && module.data?.outputs && (
        <div className="mt-4">
          {/* Mostrar outputs */}
        </div>
      )}
    </div>
  )
}
```

**Checklist para nuevo módulo**:
- [ ] Crear tipos en `types/index.ts`
- [ ] Crear componente en `components/modules/`
- [ ] Añadir tipo a `ModuleType` enum
- [ ] Añadir defaults a `moduleDefaults` en store
- [ ] Añadir renderizado en `ModuleBlock.tsx`
- [ ] Crear API endpoint en `app/api/`
- [ ] Añadir a `AddModulePanel.tsx`

---

### Patrón: Actualizar Estado de Módulo

```typescript
// SIEMPRE usar updateModule del store
const { updateModule } = useSpaceStore()

// Actualizar un solo campo
updateModule(moduleId, { status: 'running' })

// Actualizar múltiples campos
updateModule(moduleId, {
  status: 'done',
  data: { outputs: result }
})

// NO hacer esto (state local):
const [module, setModule] = useState()  // ❌ MAL
```

---

### Patrón: Trabajar con Conexiones

```typescript
// Obtener conexiones de un módulo
const { connections } = useSpaceStore()

// Conexiones de salida
const outputConnections = connections.filter(
  conn => conn.sourceModuleId === moduleId
)

// Conexiones de entrada
const inputConnections = connections.filter(
  conn => conn.targetModuleId === moduleId
)

// Módulos conectados
const connectedModules = outputConnections.map(conn => {
  return modules.find(m => m.id === conn.targetModuleId)
})
```

---

### Patrón: Validación de Inputs

```typescript
// En el handler de run
const handleRun = async () => {
  // 1. Validar inputs primero
  if (!inputs.projectPath) {
    alert('Por favor ingresa la ruta del proyecto')
    return
  }

  // 2. Validar formato si es necesario
  if (!isValidPath(inputs.projectPath)) {
    alert('Ruta inválida')
    return
  }

  // 3. Continuar con ejecución
  try {
    updateModule(module.id, { status: 'running' })
    // ...
  } catch (error) {
    // ...
  }
}
```

---

## 🚫 ANTI-PATRONES (NO HACER)

### ❌ Duplicar Componentes

```tsx
// NO COPIAR ModuleBlock
export function MySpecialModuleBlock() {
  // Copia de todo ModuleBlock...
}

// SÍ EXTENDER ModuleBlock
<ModuleBlock
  module={module}
  showExtraControls={true}
/>
```

---

### ❌ Crear State Paralelo

```tsx
// NO crear state local para datos globales
const [modules, setModules] = useState([])  // ❌
const [connections, setConnections] = useState([])  // ❌

// SÍ usar el store
const { modules, connections } = useSpaceStore()  // ✅
```

---

### ❌ Hardcodear Valores

```tsx
// NO hardcodear
<div style={{ backgroundColor: '#1A1A1A' }}>  // ❌
const BLUE = '#3b82f6'  // ❌

// SÍ usar Tailwind
<div className="bg-dark-sidebar">  // ✅
className="bg-blue-500"  // ✅
```

---

### ❌ Crear Tipos en Múltiples Archivos

```tsx
// NO crear types/my-types.ts
// NO crear types/module-types.ts

// SÍ añadir todo a types/index.ts
```

---

### ❌ Importar Relativo Profundo

```tsx
// NO hacer
import { Module } from '../../../types'  // ❌

// SÍ usar alias
import { Module } from '@/types'  // ✅
```

---

## ✅ CHECKLIST PRE-COMMIT

Antes de hacer commit, verificar:

- [ ] No he duplicado código existente
- [ ] He reutilizado componentes/tipos/utils del proyecto
- [ ] He seguido los naming conventions
- [ ] He actualizado types/index.ts si añadí tipos
- [ ] He actualizado PROJECT_STATUS.md si completé una tarea
- [ ] Los imports usan alias (@/types, @/lib, @/components)
- [ ] He usado Tailwind classes en lugar de CSS inline
- [ ] He usado useSpaceStore() en lugar de state local para datos globales
- [ ] El código sigue el patrón de los componentes existentes
- [ ] He probado que funciona correctamente

---

## 🎓 REFERENCIAS DE CÓDIGO

### Ejemplo Completo: LocalProjectAnalysisModule

Ver: `/components/modules/LocalProjectAnalysisModule.tsx`

Este módulo es la **referencia principal** para:
- Estructura de componente de módulo
- Manejo de inputs y outputs
- Integración con API
- Estados de ejecución
- UI de resultados

### Ejemplo Completo: ModuleBlock

Ver: `/components/canvas/ModuleBlock.tsx`

Este componente es la **base visual** para:
- Dragging de módulos
- Renderizado de estados
- Puertos de conexión
- Botones de control
- Selección

### Ejemplo Completo: Store

Ver: `/lib/store.ts`

Este archivo muestra:
- Estructura de Zustand store
- Patrón de actions
- Actualización inmutable de estado
- Helper getCurrentSpace()
- Defaults de módulos

---

## 📚 RECURSOS ADICIONALES

### Documentación del Proyecto
- `PROJECT_STATUS.md` - Estado actual completo
- Especificación v1.1 - Documento de requisitos
- `/design_interface/` - Referencias visuales

### Documentación Externa
- [Next.js 16 Docs](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev)
- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

## 🆘 CUANDO TENGAS DUDAS

1. **¿Cómo implementar X?**
   → Buscar en PROJECT_STATUS.md si ya existe

2. **¿Dónde poner este código?**
   → Ver estructura de carpetas en este documento

3. **¿Qué patrón seguir?**
   → Ver sección "Patrones Específicos"

4. **¿Puedo crear un archivo nuevo?**
   → Solo si pasas el checklist de PASO 4

5. **¿Cómo evitar duplicar?**
   → Seguir flujo BUSCAR → REUTILIZAR → EXTENDER → CREAR

---

**REGLA DE ORO**: Cuando tengas duda, busca primero. El 90% del tiempo ya existe algo que puedes reutilizar.

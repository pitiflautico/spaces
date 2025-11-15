# 📋 PROJECT STATUS — MARKETING SPACES v1.1
**Documento de Estado del Proyecto para Continuidad de Desarrollo con IA**

> **PROPÓSITO**: Este documento es la fuente de verdad para cualquier IA que trabaje en este proyecto.
> Contiene TODO lo necesario para entender el estado actual, evitar duplicación de código y continuar el desarrollo de forma coherente.

**Última actualización**: 2025-11-15 (Toolbar + ModuleWrapper + Duplicate)
**Versión del sistema**: v1.1 (en desarrollo)
**Fase actual**: ✅ Toolbar flotante (UI) + Sistema modular base | Próximo: Play/Restart Flow

---

## 🆕 ÚLTIMOS CAMBIOS (2025-11-15)

### ✅ SESIÓN 2: Toolbar Flotante + Sistema Modular Base

**Archivos NUEVOS**:
- ✅ `/components/canvas/FloatingToolbar.tsx` - Toolbar vertical lateral con 8 botones
- ✅ `/components/canvas/ModuleWrapper.tsx` - Componente base reutilizable para módulos

**Archivos MODIFICADOS**:
- ✅ `/components/canvas/ModuleBlock.tsx` - Refactorizado completamente (ahora usa ModuleWrapper)
- ✅ `/components/canvas/Canvas.tsx` - Añadido FloatingToolbar
- ✅ `/components/canvas/AddModuleButton.tsx` - Añadido data-attribute para toolbar
- ✅ `/lib/store.ts` - Añadido duplicateModule()

**Funcionalidad implementada**:
1. ✅ **FloatingToolbar**: Barra vertical izquierda con 8 botones (Play, Restart, Undo, Redo, etc.)
2. ✅ **ModuleWrapper**: Sistema base para TODOS los módulos (elimina duplicación de código)
3. ✅ **Duplicate Module**: Funcionalidad completa para duplicar módulos
4. ✅ **Nuevo diseño de módulos**: Título simple + icono + duplicate button + play esquina
5. ✅ **Puertos mejorados**: Outputs a la derecha, inputs a la izquierda, iconos visuales

**Patrón de reutilización**:
```tsx
// Antes: 300+ líneas por módulo (duplicación)
// Ahora: ModuleWrapper (reutilizable) + contenido específico

<ModuleWrapper module={module} onRun={handleRun} icon={<Icon />}>
  {contenido específico del módulo}
</ModuleWrapper>
```

---

### ✅ SESIÓN 1: Tarea A - Conectores Tipados (18/18 tareas - 100% COMPLETO)

**Archivos modificados**:
- ✅ `/types/index.ts` - Añadidos DataType enum, ConnectionError, ValidationResult
- ✅ `/lib/store.ts` - Añadido validateConnection, drag state, gestión dinámica
- ✅ `/lib/data-type-icons.tsx` - NUEVO archivo con iconos y colores por tipo
- ✅ `/components/canvas/ModuleBlock.tsx` - Drag & drop de puertos, iconos de tipo
- ✅ `/components/canvas/ConnectionLines.tsx` - Conexión provisional, colores por tipo
- ✅ `/components/canvas/Canvas.tsx` - Handlers de mousemove para drag

**Funcionalidad implementada**:
1. ✅ **Tipos de datos**: 6 tipos (image, text, json, audio, video, mixed)
2. ✅ **Iconos y colores**: Cada tipo tiene icono y color único
3. ✅ **Drag & drop**: Arrastrar desde puerto OUTPUT → soltar en INPUT
4. ✅ **Validación completa**: 5 validaciones (estado done, output existe, tipo compatible, no ciclos, no running)
5. ✅ **Conexión provisional**: Cable visual durante el drag
6. ✅ **Resaltar compatibles**: INPUT compatible se resalta en verde
7. ✅ **Gestión dinámica**: Reset/error propagan estado `invalid` a dependientes

**Estados nuevos agregados**: warning, fatal_error, invalid

---

## 📊 RESUMEN EJECUTIVO

### Estado General
- ✅ **Infraestructura base**: Canvas, módulos, conexiones visuales, sidebar
- ✅ **Primer módulo funcional**: Local Project Analysis Agent (100% operativo)
- ✅ **Conectores tipados**: COMPLETO (drag/drop + validación + gestión dinámica)
- ✅ **Estados extendidos**: 7 estados (idle, running, done, error, warning, fatal_error, invalid)
- ✅ **Toolbar flotante**: UI COMPLETA (falta lógica de ejecución topológica)
- ✅ **Sistema modular base**: ModuleWrapper implementado (evita duplicación)
- ✅ **Duplicate module**: Funcionalidad completa
- ❌ **Sistema de guardado**: Solo en memoria (falta persistencia)
- ❌ **Sistema de ejecución en cadena**: No implementado (próxima tarea)

### Métricas del Proyecto
- **Total de archivos TS**: 17 archivos (+2 nuevos: FloatingToolbar, ModuleWrapper)
- **Líneas de código**: ~3,200 líneas TypeScript (+600)
- **Componentes React**: 13 componentes
- **Helpers**: 1 (`data-type-icons.tsx`)
- **APIs Backend**: 1 endpoint (`/api/local-analysis`)
- **Módulos disponibles**: 5 (solo 1 funcional)
- **Estado management**: Zustand (en memoria)

---

## 🗺️ MAPA DE ARQUITECTURA

### Estructura de Carpetas
```
/home/user/spaces/
│
├── app/                                    # Next.js App Router
│   ├── api/
│   │   └── local-analysis/
│   │       └── route.ts                    # [397L] API análisis de proyectos locales
│   ├── layout.tsx                          # [19L] Root layout
│   ├── page.tsx                            # [36L] Página principal
│   └── globals.css                         # Estilos globales Tailwind
│
├── components/
│   ├── canvas/                             # Sistema de canvas principal
│   │   ├── Canvas.tsx                      # [180L] ⭐ Container principal (zoom/pan/keyboard)
│   │   ├── ModuleBlock.tsx                 # [229L] ⭐ Bloque de módulo draggable
│   │   ├── ConnectionLines.tsx             # [86L] Renderizado de conexiones SVG
│   │   ├── CanvasControls.tsx              # [62L] Controles de zoom
│   │   ├── AddModuleButton.tsx             # [25L] Botón flotante para añadir
│   │   ├── AddModulePanel.tsx              # [190L] Panel selector de módulos
│   │   └── DotGrid.tsx                     # [54L] Grid de fondo
│   │
│   ├── modules/                            # Módulos específicos
│   │   └── LocalProjectAnalysisModule.tsx  # [219L] ✅ Módulo funcional
│   │
│   └── sidebar/
│       └── Sidebar.tsx                     # [178L] Panel lateral (spaces)
│
├── lib/
│   └── store.ts                            # [266L] ⭐ Zustand store (estado global)
│
├── types/
│   └── index.ts                            # [79L] ⭐ Definiciones TypeScript
│
├── design_interface/                       # Imágenes de referencia UI
├── tailwind.config.js                      # Configuración Tailwind
├── tsconfig.json                           # Configuración TypeScript
├── next.config.js                          # Configuración Next.js
└── package.json                            # Dependencias
```

### Archivos Críticos (⭐ LEER SIEMPRE ANTES DE MODIFICAR)

| Archivo | Líneas | Responsabilidad | Cuándo modificar |
|---------|--------|-----------------|------------------|
| `/types/index.ts` | 79 | **Tipos globales** | Al añadir nuevos tipos, interfaces, enums |
| `/lib/store.ts` | 266 | **Estado global Zustand** | Al añadir actions, estados, o modificar espacios |
| `/components/canvas/Canvas.tsx` | 180 | **Sistema de canvas** | Al cambiar zoom, pan, teclado, rendering |
| `/components/canvas/ModuleBlock.tsx` | 229 | **UI de módulos** | Al cambiar apariencia, dragging, estados |
| `/components/canvas/ConnectionLines.tsx` | 86 | **Renderizado de conexiones** | Al cambiar estilo de cables o animaciones |
| `/components/modules/LocalProjectAnalysisModule.tsx` | 219 | **Módulo de referencia** | Como plantilla para nuevos módulos |

---

## ✅ FEATURES IMPLEMENTADAS (Lo que YA existe)

### 1. Sistema de Canvas
**Ubicación**: `/components/canvas/Canvas.tsx`

**Implementado**:
- ✅ Zoom (rueda del ratón, 20%-300%)
- ✅ Pan (spacebar + drag, middle mouse)
- ✅ Keyboard navigation (arrows, +/-, 0 para reset)
- ✅ Grid de fondo con dots
- ✅ Transform matrix (translate + scale)
- ✅ Controles de zoom en UI (botones +/-, reset)

**Cómo funciona**:
```typescript
// Canvas usa transform CSS
<div style={{
  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
  transformOrigin: '0 0'
}}>
```

**Estado en store**:
```typescript
canvasState: {
  zoom: number,      // 0.2 - 3.0
  pan: { x, y }      // pixels
}
```

---

### 2. Sistema de Módulos
**Ubicación**: `/components/canvas/ModuleBlock.tsx`

**Implementado**:
- ✅ Bloques draggables (posición x,y almacenada)
- ✅ Tamaño configurable (width, height)
- ✅ Estados visuales (idle, running, done, error)
- ✅ Puertos de entrada (azul) y salida (púrpura)
- ✅ Header con nombre, icono, estado
- ✅ Footer con botón Run y Delete
- ✅ Renderizado condicional según tipo de módulo
- ✅ Selección (borde azul al hacer click)

**Estados soportados** (en `/types/index.ts`):
```typescript
type ModuleStatus = 'idle' | 'running' | 'done' | 'error'
```

**Colores de estado** (ModuleBlock.tsx líneas 123-134):
```typescript
idle    → text-gray-500 bg-gray-500/10
running → text-blue-500 bg-blue-500/10
done    → text-green-500 bg-green-500/10
error   → text-red-500 bg-red-500/10
```

**Tipos de módulos disponibles**:
```typescript
type ModuleType =
  | 'local-project-analysis'    // ✅ Implementado
  | 'reader-engine'              // ❌ Placeholder
  | 'naming-engine'              // ❌ Placeholder
  | 'icon-generator'             // ❌ Placeholder
  | 'marketing-pack'             // ❌ Placeholder
```

**Patrón de creación** (en store.ts líneas 71-143):
```typescript
// 1. Define defaults por tipo en moduleDefaults
const moduleDefaults: Record<ModuleType, Partial<Module>> = {
  'local-project-analysis': {
    name: 'Local Project Analysis Agent',
    size: { width: 450, height: 520 },
    ports: {
      input: [],
      output: [
        { id: 'out-1', type: 'output', label: 'Repository Metadata', connected: false },
        { id: 'out-2', type: 'output', label: 'File Contents', connected: false },
        { id: 'out-3', type: 'output', label: 'Repository Structure', connected: false },
        { id: 'out-4', type: 'output', label: 'Analysis Log', connected: false },
      ],
    },
  },
  // ...
}

// 2. addModule() usa estos defaults
addModule: (type: ModuleType, position: Position) => {
  const newModule: Module = {
    id: `module-${Date.now()}`,
    type,
    position,
    ...moduleDefaults[type],
    status: 'idle',
    data: {},
  }
  // ...
}
```

---

### 3. Módulo Funcional: Local Project Analysis
**Ubicación**: `/components/modules/LocalProjectAnalysisModule.tsx`

**Implementado**:
- ✅ Input: Ruta de proyecto local (text input)
- ✅ Input: Incluir archivos ocultos (checkbox)
- ✅ Input: Incluir node_modules (checkbox)
- ✅ Botón "Run Analysis"
- ✅ Outputs descargables:
  - `repository_metadata.json`
  - `file_contents.json`
  - `repository_structure.json`
  - `analysis_log.txt`
- ✅ Estados visuales (idle → running → done/error)
- ✅ Mensajes de error con alert

**API Backend**: `/app/api/local-analysis/route.ts`

**Funcionalidad**:
1. Valida path de proyecto
2. Lee estructura de archivos (recursivo)
3. Detecta framework (React, Next.js, Vue, etc.)
4. Lee archivos principales (package.json, README, etc.)
5. Genera metadata completo
6. Retorna JSON + log con timestamps

**Patrón de ejecución**:
```typescript
// En LocalProjectAnalysisModule.tsx líneas 70-115
const handleRun = async () => {
  try {
    updateModule(module.id, { status: 'running' })

    const response = await fetch('/api/local-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inputs),
    })

    const result = await response.json()

    updateModule(module.id, {
      status: 'done',
      data: { outputs: result }
    })
  } catch (error) {
    updateModule(module.id, { status: 'error' })
    alert('Error: ' + error.message)
  }
}
```

**⚠️ IMPORTANTE**: Este módulo es la **plantilla de referencia** para crear nuevos módulos.

---

### 4. Sistema de Conexiones (Visual)
**Ubicación**: `/components/canvas/ConnectionLines.tsx`

**Implementado**:
- ✅ Renderizado SVG con Bezier curves
- ✅ Animación de dashes (movimiento)
- ✅ Efecto glow (blur)
- ✅ Cálculo automático de puntos según posición de módulos
- ✅ Ajuste según zoom del canvas
- ✅ Almacenamiento en store

**Estructura de conexión** (en `/types/index.ts`):
```typescript
interface ModuleConnection {
  id: string
  sourceModuleId: string
  sourcePortId: string
  targetModuleId: string
  targetPortId: string
}
```

**Renderizado**:
```typescript
// Bezier curve path
const curvature = Math.min(Math.abs(endX - startX) / 2, 100)
const path = `M ${startX},${startY} C ${startX + curvature},${startY} ${endX - curvature},${endY} ${endX},${endY}`
```

**❌ NO IMPLEMENTADO**:
- Drag & drop para crear conexiones
- Validación de tipos de datos
- Iconos de tipo en cables
- Errores visuales de conexión

---

### 5. Gestión de Spaces
**Ubicación**: `/components/sidebar/Sidebar.tsx` + `/lib/store.ts`

**Implementado**:
- ✅ Crear nuevo space
- ✅ Cambiar entre spaces
- ✅ Eliminar space (con confirmación)
- ✅ Mostrar fecha de creación
- ✅ Pin spaces (favoritos)
- ✅ Cada space contiene módulos + conexiones independientes

**Estructura** (en `/types/index.ts`):
```typescript
interface Space {
  id: string
  name: string
  modules: Module[]
  connections: ModuleConnection[]
  createdAt: Date
  updatedAt: Date
}
```

**⚠️ LIMITACIÓN**: Todo en memoria (se pierde al recargar página).

---

### 6. Sistema de Estado Global (Zustand)
**Ubicación**: `/lib/store.ts`

**Implementado**:
- ✅ Múltiples spaces
- ✅ CRUD de módulos
- ✅ CRUD de conexiones
- ✅ Estado de canvas (zoom, pan)
- ✅ Selección de módulo
- ✅ Helper `getCurrentSpace()`

**Actions disponibles**:
```typescript
// Spaces
createSpace(name: string): void
deleteSpace(id: string): void
setCurrentSpace(id: string): void

// Modules
addModule(type: ModuleType, position: Position): void
updateModule(id: string, updates: Partial<Module>): void
deleteModule(id: string): void
setSelectedModule(id: string | null): void

// Connections
addConnection(connection: Omit<ModuleConnection, 'id'>): void
deleteConnection(id: string): void

// Canvas
setZoom(zoom: number): void
setPan(pan: Position): void
resetCanvas(): void

// Helper
getCurrentSpace(): Space | undefined
```

**Patrón de actualización inmutable**:
```typescript
updateModule: (id: string, updates: Partial<Module>) => {
  set((state) => {
    const currentSpace = state.spaces.find(s => s.id === state.currentSpaceId)
    if (!currentSpace) return state

    return {
      spaces: state.spaces.map(space =>
        space.id === state.currentSpaceId
          ? {
              ...space,
              modules: space.modules.map(m =>
                m.id === id ? { ...m, ...updates } : m
              ),
              updatedAt: new Date(),
            }
          : space
      ),
    }
  })
}
```

---

### 7. UI Components
**Ubicación**: Varios en `/components/`

**Implementado**:
- ✅ **DotGrid** (fondo con puntos): `/components/canvas/DotGrid.tsx`
- ✅ **CanvasControls** (zoom buttons): `/components/canvas/CanvasControls.tsx`
- ✅ **AddModuleButton** (botón flotante +): `/components/canvas/AddModuleButton.tsx`
- ✅ **AddModulePanel** (selector de módulos): `/components/canvas/AddModulePanel.tsx`
  - Búsqueda por nombre
  - Filtrado por categoría
  - 3 categorías: Project Initialization, Branding, Marketing

---

## ❌ FEATURES PENDIENTES (Lo que FALTA según v1.1)

### PRIORIDAD ALTA (Requeridas para v1.1)

#### A. Conectores Tipados
**Estado**: 0% implementado

**Tareas pendientes**:
- [ ] **A1.1**: Definir enum de tipos (image, text, json, audio, video, mixed)
- [ ] **A1.2**: Asignar tipo a cada OUTPUT de cada módulo
- [ ] **A1.3**: Definir expected_types por INPUT de módulo
- [ ] **A2.1-A2.5**: Interacción drag & drop desde puerto OUTPUT
- [ ] **A3.1-A3.7**: Sistema de validación de conexión
- [ ] **A4.1-A4.3**: Gestión dinámica (reset/error/delete cascade)

**Archivos a modificar**:
- `/types/index.ts` → Añadir tipos de datos
- `/components/canvas/ModuleBlock.tsx` → Drag & drop de puertos
- `/components/canvas/ConnectionLines.tsx` → Iconos de tipo
- `/lib/store.ts` → Validación en addConnection

**Ejemplo esperado**:
```typescript
// types/index.ts
enum DataType {
  IMAGE = 'image',
  TEXT = 'text',
  JSON = 'json',
  AUDIO = 'audio',
  VIDEO = 'video',
  MIXED = 'mixed'
}

interface ModulePort {
  id: string
  type: 'input' | 'output'
  label: string
  dataType: DataType        // ← NUEVO
  connected: boolean
}

interface ModuleConnection {
  id: string
  sourceModuleId: string
  sourcePortId: string
  targetModuleId: string
  targetPortId: string
  dataType: DataType        // ← NUEVO
}
```

---

#### B. Estados Extendidos
**Estado**: 40% implementado (solo 4 de 7 estados)

**Estados faltantes**:
- [ ] `warning` → Borde amarillo
- [ ] `fatal_error` → Relleno rojizo + casi deshabilitado
- [ ] `invalid` → Borde gris punteado + icono ⚠️

**Tareas pendientes**:
- [ ] **B1.1**: Añadir estados a tipo `ModuleStatus`
- [ ] **B1.2**: Mapear colores en ModuleBlock.tsx
- [ ] **B2.5**: Desactivar botones cuando está running
- [ ] **B3.4**: Actualizar outputs y logs tras ejecución

**Archivos a modificar**:
- `/types/index.ts` → Ampliar tipo ModuleStatus
- `/components/canvas/ModuleBlock.tsx` → Añadir colores y lógica

---

#### C. Toolbar Flotante
**Estado**: 0% implementado

**Funcionalidad requerida**:
- [ ] **C1.1-C1.2**: Renderizar toolbar flotante con iconos ▶, ⟲, ⏸
- [ ] **C2.1-C2.5**: Play Flow (ejecución en cadena topológica)
- [ ] **C3.1-C3.4**: Restart Flow (reset all con confirmación)
- [ ] **C4.1-C4.3**: Pause Flow (opcional)

**Componente a crear**:
- `/components/canvas/FloatingToolbar.tsx` (nuevo archivo)

**Ejemplo esperado**:
```tsx
// FloatingToolbar.tsx
export function FloatingToolbar() {
  const { modules, connections } = useSpaceStore()

  const handlePlayFlow = () => {
    // Topological sort de módulos
    const executionOrder = calculateExecutionOrder(modules, connections)

    // Ejecutar en secuencia
    for (const moduleId of executionOrder) {
      await executeModule(moduleId)
    }
  }

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-dark-sidebar rounded-lg p-2">
      <button onClick={handlePlayFlow}>▶ Play</button>
      <button onClick={handleRestartFlow}>⟲ Restart</button>
    </div>
  )
}
```

**Algoritmo de ejecución topológica**:
```typescript
function calculateExecutionOrder(modules, connections) {
  // 1. Construir grafo de dependencias
  // 2. Topological sort (DFS)
  // 3. Retornar array ordenado de module IDs
}
```

---

#### D. Sistema de Guardado
**Estado**: 0% implementado (solo memoria)

**Tareas pendientes**:
- [ ] **D1.1-D1.3**: Autosave (detectar cambios, guardar snapshot)
- [ ] **D2.1-D2.3**: Load Space (reconstruir desde snapshot)
- [ ] **D3.1-D3.3**: Validación tras carga

**Opciones de implementación**:
1. **localStorage** (simple, límite 5MB)
2. **IndexedDB** (complejo, sin límite)
3. **API + Database** (PostgreSQL/MongoDB)

**Archivos a crear/modificar**:
- `/lib/persistence.ts` (nuevo) → Funciones save/load
- `/lib/store.ts` → Llamar a save en cada acción

**Ejemplo con localStorage**:
```typescript
// lib/persistence.ts
export function saveSpace(space: Space) {
  const snapshot = {
    version: '1.1',
    timestamp: new Date().toISOString(),
    space: {
      ...space,
      modules: space.modules.map(m => ({
        ...m,
        // Solo guardar referencias a outputs grandes
        data: compressData(m.data)
      }))
    }
  }

  localStorage.setItem(`space-${space.id}`, JSON.stringify(snapshot))
}

export function loadSpace(id: string): Space | null {
  const data = localStorage.getItem(`space-${id}`)
  if (!data) return null

  const snapshot = JSON.parse(data)
  return snapshot.space
}
```

---

#### E. Sistema de Reinicio
**Estado**: 0% implementado

**Tareas pendientes**:
- [ ] **E1.1-E1.4**: Reset All (limpiar todos los módulos)
- [ ] **E2.1-E2.4**: Reset Module (solo uno + marcar dependientes invalid)
- [ ] **E3.1-E3.2**: Reset From This (cascada hacia adelante)
- [ ] **E4.1-E4.2**: Re-evaluación de needs_re_run

**Archivos a modificar**:
- `/lib/store.ts` → Añadir actions resetAll, resetModule, resetFromThis
- `/components/canvas/ModuleBlock.tsx` → Botón de reset en menú

**Ejemplo**:
```typescript
// En store.ts
resetModule: (id: string) => {
  set((state) => {
    const currentSpace = getCurrentSpace()
    if (!currentSpace) return state

    // 1. Resetear módulo
    const updatedModules = currentSpace.modules.map(m =>
      m.id === id
        ? { ...m, status: 'idle', data: {} }
        : m
    )

    // 2. Marcar dependientes como invalid
    const dependentIds = findDependentModules(id, currentSpace.connections)
    const finalModules = updatedModules.map(m =>
      dependentIds.includes(m.id)
        ? { ...m, status: 'invalid' }
        : m
    )

    return {
      spaces: state.spaces.map(s =>
        s.id === state.currentSpaceId
          ? { ...s, modules: finalModules, updatedAt: new Date() }
          : s
      )
    }
  })
}
```

---

#### F. Panel INFO de Módulo
**Estado**: 0% implementado

**Tareas pendientes**:
- [ ] Crear componente `ModuleInfoPanel.tsx`
- [ ] Diseñar plantilla de info por módulo
- [ ] Añadir botón ℹ en header de ModuleBlock
- [ ] Modal o panel lateral con información

**Contenido del panel**:
1. Nombre del módulo
2. Descripción corta
3. Descripción extendida
4. ¿Cuándo usarlo?
5. Inputs que acepta (tipo + descripción)
6. Outputs que genera (tipo + icono)
7. Conectores compatibles
8. Dependencias de otros módulos
9. Errores más comunes
10. Consejos de uso
11. Ejemplo de flujo

**Archivo a crear**:
- `/components/canvas/ModuleInfoPanel.tsx`

---

### PRIORIDAD MEDIA (Mejoras de UX)

#### G. Logs Mejorados
**Estado**: 30% implementado (solo texto básico)

**Pendiente**:
- [ ] **F3.1**: Escribir logs en archivos separados
- [ ] **F3.2**: Panel de logs dentro del bloque (colapsable)
- [ ] **F3.3**: Descarga de logs
- [ ] Syntax highlighting para logs
- [ ] Filtrado por nivel (info, warning, error)

---

#### H. Otros Módulos
**Estado**: 0% implementado (solo LocalProjectAnalysis)

**Módulos pendientes**:
- [ ] Reader Engine
- [ ] Naming Engine
- [ ] Icon Generator
- [ ] Marketing Pack

**Patrón a seguir**: Copiar estructura de `LocalProjectAnalysisModule.tsx`

---

### PRIORIDAD BAJA (Futuras mejoras)

- [ ] Undo/Redo
- [ ] Duplicar módulos
- [ ] Grupos de módulos
- [ ] Comentarios en canvas
- [ ] Export/Import de flujos
- [ ] Templates de flujos

---

## 🔧 METODOLOGÍA DE DESARROLLO

### ⚠️ REGLA DE ORO: NUNCA DUPLICAR CÓDIGO

Antes de crear cualquier componente, función o sistema:

#### 1. BUSCAR PRIMERO
```bash
# Buscar componentes similares
grep -r "export function" components/
grep -r "export const" components/

# Buscar tipos existentes
cat types/index.ts

# Buscar en store
cat lib/store.ts | grep -A 5 "function\|const"
```

#### 2. REUTILIZAR O EXTENDER
Si existe algo similar:
- ✅ **Reutilizar**: Usar el componente/función existente
- ✅ **Extender**: Añadir props opcionales
- ✅ **Refactorizar**: Extraer lógica común a un helper
- ❌ **NO crear duplicado**: Nunca copiar-pegar código similar

#### 3. PATRÓN DE CREACIÓN
Solo crear nuevo archivo si:
- No existe nada similar en el proyecto
- La funcionalidad es completamente nueva
- Sigue el patrón de naming del proyecto

### Patrón de Naming
```
Componentes:   PascalCase.tsx        → Canvas.tsx, ModuleBlock.tsx
Tipos:         PascalCase            → Module, Space, ModuleConnection
Functions:     camelCase             → addModule, updateModule
Constants:     UPPER_SNAKE_CASE      → DEFAULT_ZOOM, MAX_ZOOM
Archivos util: kebab-case.ts         → module-helpers.ts
```

### Estructura de Componente
```tsx
'use client'

import { useState } from 'react'
import { useSpaceStore } from '@/lib/store'
import { Module } from '@/types'

interface Props {
  // Props aquí
}

export function ComponentName({ prop1, prop2 }: Props) {
  // 1. Hooks de store
  const { modules, updateModule } = useSpaceStore()

  // 2. State local
  const [localState, setLocalState] = useState()

  // 3. Handlers
  const handleAction = () => {
    // Lógica
  }

  // 4. Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

---

## 📋 CHECKLIST COMPLETO v1.1

### A. CONECTORES TIPADOS (18/18 tareas) ✅

#### A1. Implementar tipos de datos (3/3) ✅
- [x] A1.1 Definir enum de tipos (image, text, json, audio, video, mixed)
- [x] A1.2 Asignar tipo a cada OUTPUT de cada módulo
- [x] A1.3 Definir expected_types por INPUT de módulo

#### A2. Interacción de conexión (5/5) ✅
- [x] A2.1 Detectar drag desde puerto OUTPUT
- [x] A2.2 Dibujar cable provisional
- [x] A2.3 Detectar hover sobre INPUT compatible
- [x] A2.4 Resaltar INPUT compatible
- [x] A2.5 Finalizar conexión al soltar

#### A3. Validación de conexión (7/7) ✅
- [x] A3.1 Comprobar estado DONE del módulo A
- [x] A3.2 Comprobar presencia de output
- [x] A3.3 Comprobar compatibilidad de tipo
- [x] A3.4 Comprobar que B no está running
- [x] A3.5 Comprobar que no hay ciclo
- [x] A3.6 Mostrar error visual si falla
- [x] A3.7 Guardar la conexión si es válida

#### A4. Gestión dinámica (3/3) ✅
- [x] A4.1 Si módulo A se resetea → marcar B como invalid
- [x] A4.2 Si módulo A entra en error → marcar B como invalid
- [x] A4.3 Si módulo A se elimina → eliminar conexiones

---

### B. ESTADOS DE BLOQUE (5/11 tareas)

#### B1. Estados visuales (4/4) ✅
- [x] B1.1 Mapear estados a colores de borde/fondo (7 estados: idle, running, done, error, warning, fatal_error, invalid)
- [x] B1.2 Mostrar estado textual en header

#### B2. Botones del bloque (2/5)
- [x] B2.1 Implementar ▶ local (run solo este módulo)
- [x] B2.2 Implementar 🗑 eliminar módulo
- [ ] B2.3 Implementar ℹ info del módulo
- [ ] B2.4 Implementar "Logs" y "Settings" en footer
- [ ] B2.5 Desactivar botones cuando está running

#### B3. Ejecución local (2/4)
- [x] B3.1 Ejecutar módulo con sus inputs
- [x] B3.2 Cambiar estado → running
- [ ] B3.3 Al terminar: done o error (mejorar)
- [ ] B3.4 Actualizar outputs y logs

---

### C. TOOLBAR FLOTANTE (0/13 tareas)

#### C1. Renderizar toolbar (0/2)
- [ ] C1.1 Posicionar toolbar sobre selección/centro
- [ ] C1.2 Mostrar iconos ▶, ⟲, ⏸

#### C2. Play Flow (0/5)
- [ ] C2.1 Calcular orden de ejecución (topological sort)
- [ ] C2.2 Ejecutar módulos sin dependencias primero
- [ ] C2.3 Ejecutar el resto en orden
- [ ] C2.4 Saltar módulos ya done sin cambios
- [ ] C2.5 Actualizar estados y autosave

#### C3. Restart Flow (0/4)
- [ ] C3.1 Mostrar confirmación
- [ ] C3.2 Llamar a Reset All
- [ ] C3.3 Mantener inputs manuales
- [ ] C3.4 Dejar todos en idle

#### C4. Pause (0/3) - OPCIONAL
- [ ] C4.1 Establecer flag global "paused"
- [ ] C4.2 No disparar nuevos módulos
- [ ] C4.3 Permitir terminar los running

---

### D. GUARDADO / HISTORIAL (0/9 tareas)

#### D1. Autosave (0/3)
- [ ] D1.1 Detectar cambios (módulos, conexiones, estados)
- [ ] D1.2 Guardar snapshot en disco/BD
- [ ] D1.3 Añadir timestamp

#### D2. Load Space (0/3)
- [ ] D2.1 Leer snapshot
- [ ] D2.2 Reconstruir módulos y posiciones
- [ ] D2.3 Reconstruir conexiones

#### D3. Validación tras carga (0/3)
- [ ] D3.1 Recalcular dependencias
- [ ] D3.2 Marcar módulos con inputs rotos como invalid
- [ ] D3.3 Marcar módulos listos como done

---

### E. REINICIO DEL FLUJO (0/12 tareas)

#### E1. Reset All (0/4)
- [ ] E1.1 Limpiar estados de todos los módulos
- [ ] E1.2 Borrar outputs y logs
- [ ] E1.3 Mantener conexiones
- [ ] E1.4 Guardar nuevo snapshot

#### E2. Reset Module (0/4)
- [ ] E2.1 Borrar outputs del módulo
- [ ] E2.2 Borrar logs del módulo
- [ ] E2.3 Estado → idle
- [ ] E2.4 Marcar dependientes como invalid

#### E3. Reset From This (0/2)
- [ ] E3.1 Identificar módulos posteriores
- [ ] E3.2 Ejecutar Reset Module en cadena

#### E4. Re-evaluar (0/2)
- [ ] E4.1 Marcar módulos que necesitan re-run
- [ ] E4.2 Mostrar indicador visual "Needs re-run"

---

### F. ERRORES Y LOGS (1/9 tareas)

#### F1. Captura de errores (1/3)
- [x] F1.1 Capturar exceptions durante run
- [ ] F1.2 Asignar categoría (input/system/processing/connection/fatal)
- [ ] F1.3 Mostrar mensaje corto en el bloque

#### F2. Acciones de recuperación (0/3)
- [ ] F2.1 Implementar TRY AGAIN
- [ ] F2.2 Implementar RESET
- [ ] F2.3 Implementar VIEW LOGS

#### F3. Logs (0/3)
- [ ] F3.1 Escribir analysis_log.txt por módulo
- [ ] F3.2 Mostrar panel de logs dentro del bloque
- [ ] F3.3 Permitir descarga de logs

---

## 🎯 GUÍA PARA CONTINUAR EL DESARROLLO

### Para una IA que continúe este proyecto:

#### 1. ANTES DE EMPEZAR CUALQUIER TAREA

```
1. Leer este documento completo (PROJECT_STATUS.md)
2. Identificar la tarea en el checklist v1.1
3. Verificar archivos relacionados:
   - ¿Ya existe algo similar?
   - ¿Qué componentes puedo reutilizar?
4. Planificar sin duplicar código
```

#### 2. PATRÓN DE TRABAJO

```
PASO 1: Analizar
  → Leer archivos clave (types/index.ts, lib/store.ts)
  → Entender qué existe actualmente

PASO 2: Diseñar
  → Definir qué necesito crear/modificar
  → Identificar reutilizables

PASO 3: Implementar
  → Modificar archivos existentes primero
  → Crear nuevos solo si es necesario

PASO 4: Actualizar documentación
  → Marcar tarea como completada en checklist
  → Actualizar sección "FEATURES IMPLEMENTADAS"
  → Añadir referencias de archivos
```

#### 3. CUANDO CREAR UN NUEVO COMPONENTE

Solo si cumple **TODOS** estos criterios:
- ✅ No existe componente similar
- ✅ No se puede extender uno existente
- ✅ Tiene responsabilidad única y clara
- ✅ Sigue el patrón de naming
- ✅ Se puede probar de forma aislada

#### 4. CUANDO MODIFICAR ARCHIVOS CLAVE

**types/index.ts**:
- Añadir nuevos tipos/interfaces
- Extender tipos existentes (NUNCA reemplazar)

**lib/store.ts**:
- Añadir nuevas actions
- Extender estado (NUNCA eliminar campos)

**ModuleBlock.tsx**:
- Cambios visuales generales de módulos
- Lógica común a todos los módulos

**Canvas.tsx**:
- Cambios en zoom/pan/keyboard
- Renderizado del canvas

#### 5. ERRORES COMUNES A EVITAR

❌ **NO hacer**:
```tsx
// Crear nuevo componente cuando ya existe similar
export function MyModuleBlock() { ... }  // Ya existe ModuleBlock.tsx

// Duplicar tipos
interface MyModule { ... }  // Ya existe Module en types/index.ts

// Hardcodear valores
const BLUE = '#3b82f6'  // Usar Tailwind classes

// Crear store paralelo
const [modules, setModules] = useState()  // Usar useSpaceStore()
```

✅ **SÍ hacer**:
```tsx
// Reutilizar componente existente
import { ModuleBlock } from './ModuleBlock'

// Extender tipo existente
import { Module } from '@/types'

// Usar Tailwind
className="bg-blue-500"

// Usar store global
const { modules, updateModule } = useSpaceStore()
```

---

## 📖 REFERENCIAS RÁPIDAS

### Tipos Importantes
```typescript
// types/index.ts

type ModuleStatus = 'idle' | 'running' | 'done' | 'error'

type ModuleType =
  | 'local-project-analysis'
  | 'reader-engine'
  | 'naming-engine'
  | 'icon-generator'
  | 'marketing-pack'

interface Module {
  id: string
  type: ModuleType
  name: string
  position: Position
  size: Size
  status: ModuleStatus
  ports: {
    input: ModulePort[]
    output: ModulePort[]
  }
  data: ModuleData
}

interface Space {
  id: string
  name: string
  modules: Module[]
  connections: ModuleConnection[]
  createdAt: Date
  updatedAt: Date
}
```

### Store Actions
```typescript
// lib/store.ts

// Spaces
createSpace(name: string)
deleteSpace(id: string)
setCurrentSpace(id: string)

// Modules
addModule(type: ModuleType, position: Position)
updateModule(id: string, updates: Partial<Module>)
deleteModule(id: string)

// Connections
addConnection(connection: Omit<ModuleConnection, 'id'>)
deleteConnection(id: string)

// Canvas
setZoom(zoom: number)
setPan(pan: Position)
resetCanvas()

// Helper
getCurrentSpace(): Space | undefined
```

### Colores del Tema
```javascript
// tailwind.config.js

colors: {
  dark: {
    bg: '#0A0A0A',
    sidebar: '#1A1A1A',
    card: '#2A2A2A',
    border: '#3A3A3A',
    hover: '#2F2F2F',
  },
  grid: {
    dot: '#3E3E3E',
  }
}
```

---

## 🔄 PROCESO DE ACTUALIZACIÓN DE ESTE DOCUMENTO

Cada vez que se complete una tarea:

1. **Actualizar checklist**: Marcar tarea como [x]
2. **Actualizar "FEATURES IMPLEMENTADAS"**: Añadir sección si es nueva
3. **Actualizar "FEATURES PENDIENTES"**: Mover a implementadas
4. **Añadir referencias**: Archivos modificados/creados
5. **Actualizar métricas**: Líneas de código, archivos
6. **Commit**: `git commit -m "docs: update PROJECT_STATUS after [task]"`

---

## 📞 CONTACTO Y DOCUMENTACIÓN EXTERNA

- **Especificación completa**: Ver documento "APP MARKETING SPACES - SISTEMA GLOBAL V1.1"
- **Diseño de referencia**: `/design_interface/` (capturas de Freepik Spaces)
- **Tech stack**:
  - Next.js 16: https://nextjs.org/docs
  - React 19: https://react.dev
  - Zustand: https://docs.pmnd.rs/zustand
  - Tailwind CSS: https://tailwindcss.com/docs

---

**ÚLTIMA ACTUALIZACIÓN**: 2025-11-15
**VERSIÓN**: v1.1-alpha
**PROGRESO GLOBAL**: ~20% del sistema v1.1 completado
**PRÓXIMA TAREA PRIORITARIA**: Implementar conectores tipados (Tarea A)

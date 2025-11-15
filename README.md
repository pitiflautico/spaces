# 🚀 Marketing Spaces

**Sistema modular visual para automatización de procesos de marketing basado en IA**

Un canvas interactivo donde puedes conectar módulos de procesamiento para analizar proyectos, generar nombres, crear iconos y producir packs de marketing completos.

---

## 📊 Estado del Proyecto

**Versión actual**: v1.1 (en desarrollo)
**Progreso global**: ~45% completado
**Última actualización**: 2025-11-15 ✅ Toolbar + ModuleWrapper

### 🎯 Progreso por Área

```
Infraestructura Base        ████████████████████ 100%
Módulo Local Analysis       ████████████████████ 100%
Conectores Visuales         ████████████████████ 100%
Conectores Tipados          ████████████████████ 100%  ✅
Estados Extendidos          ███████░░░░░░░░░░░░░  45%  ✅
Toolbar Flotante (UI)       ████████████████░░░░  80%  ✅ NUEVO
Sistema Modular Base        ████████████████████ 100%  ✅ NUEVO
Duplicate Module            ████████████████████ 100%  ✅ NUEVO
Sistema de Guardado         ░░░░░░░░░░░░░░░░░░░░   0%
Ejecución en Cadena         ░░░░░░░░░░░░░░░░░░░░   0%
Panel INFO de Módulos       ░░░░░░░░░░░░░░░░░░░░   0%
```

### ✅ Funcionalidades Implementadas

**Base (ya existente)**:
- ✅ Canvas interactivo con zoom (20%-300%) y pan
- ✅ Sistema de módulos draggables
- ✅ Conexiones visuales con Bezier curves animadas
- ✅ Gestión de espacios (spaces) independientes
- ✅ Módulo funcional: Local Project Analysis
- ✅ API backend para análisis de filesystem
- ✅ UI dark theme moderna

**Nuevas (Sesión 1 - Tarea A)**:
- ✅ **Conectores tipados**: 6 tipos de datos (image, text, json, audio, video, mixed)
- ✅ **Drag & drop de puertos**: Arrastrar desde OUTPUT, soltar en INPUT
- ✅ **Validación de conexiones**: 5 validaciones automáticas
- ✅ **Iconos por tipo**: Cada tipo de dato tiene icono y color único
- ✅ **Conexión provisional**: Cable visual durante el drag
- ✅ **Resaltar compatibles**: INPUT compatible brilla en verde
- ✅ **Gestión dinámica**: Reset/error propagan estado `invalid`
- ✅ **7 estados visuales**: idle, running, done, error, warning, fatal_error, invalid

**Nuevas (Sesión 2 - Toolbar + Sistema Modular)**:
- ✅ **FloatingToolbar**: Barra vertical lateral con 8 botones (Play, Restart, Undo, Redo, History, Settings, Templates)
- ✅ **ModuleWrapper**: Componente base reutilizable para TODOS los módulos (evita duplicación de código)
- ✅ **Duplicate Module**: Funcionalidad completa para duplicar módulos con offset
- ✅ **Nuevo diseño de módulos**: Basado en diseño de referencia (título simple, icono, duplicate button)
- ✅ **Play button mejorado**: Grande en esquina inferior derecha
- ✅ **Settings button**: En esquina inferior izquierda
- ✅ **Puertos visuales mejorados**: Iconos más grandes, mejor posicionamiento

### 🚧 En Desarrollo

- 🚧 Toolbar flotante (Play, Pause, Restart)
- 🚧 Sistema de guardado persistente
- 🚧 Ejecución en cadena topológica
- 🚧 Más módulos (AIE Engine, Naming, Icons, Marketing Pack)

---

## 📚 Documentación

### Para Desarrolladores

- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Estado completo del proyecto, arquitectura, features implementadas y pendientes
- **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** - Guía metodológica para desarrollo sin duplicación de código
- **Especificación v1.1** - Documento de requisitos completo (ver commit messages)

### Navegación Rápida

| Necesito... | Ir a... |
|-------------|---------|
| Entender el estado actual | [PROJECT_STATUS.md](./PROJECT_STATUS.md) |
| Saber cómo implementar sin duplicar | [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) |
| Ver qué archivos modificar | PROJECT_STATUS.md > "Archivos Críticos" |
| Conocer los patrones del proyecto | DEVELOPMENT_GUIDE.md > "Patrones Específicos" |
| Ver el checklist de tareas v1.1 | PROJECT_STATUS.md > "Checklist Completo" |

---

## 🚀 Quick Start

### Prerrequisitos

- Node.js 18+
- npm o yarn

### Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd spaces

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Abrir en navegador
# http://localhost:3000
```

### Uso Básico

1. **Crear un Space**: Click en "New Space" en el sidebar
2. **Añadir módulo**: Click en el botón + flotante
3. **Configurar módulo**: Ingresar inputs requeridos
4. **Ejecutar**: Click en "Run" en el módulo
5. **Ver resultados**: Los outputs aparecen al completar

---

## 🛠️ Tech Stack

### Core
- **React 19.2** - Framework UI
- **Next.js 16.0** - Meta-framework (App Router)
- **TypeScript 5.9** - Lenguaje tipado

### Estado & Datos
- **Zustand 5.0** - State management
- **En memoria** - Persistencia actual (localStorage/DB pendiente)

### Estilos
- **Tailwind CSS 3.4** - Utilidad CSS
- **SVG** - Renderizado de conexiones
- **Custom Canvas** - Sistema de zoom/pan (no React Flow)

### Backend
- **Next.js API Routes** - Endpoints
- **Node.js fs** - Operaciones de filesystem

---

## 📁 Estructura del Proyecto

```
spaces/
├── app/                          # Next.js App Router
│   ├── api/local-analysis/      # API análisis de proyectos
│   ├── page.tsx                 # Página principal
│   └── layout.tsx               # Layout raíz
│
├── components/
│   ├── canvas/                  # Sistema de canvas
│   │   ├── Canvas.tsx           # ⭐ Container principal
│   │   ├── ModuleBlock.tsx      # ⭐ Bloque de módulo
│   │   ├── ConnectionLines.tsx  # Conexiones SVG
│   │   └── ...
│   ├── modules/                 # Módulos específicos
│   │   └── LocalProjectAnalysisModule.tsx
│   └── sidebar/
│       └── Sidebar.tsx          # Panel lateral
│
├── lib/
│   └── store.ts                 # ⭐ Zustand store
│
├── types/
│   └── index.ts                 # ⭐ Tipos globales
│
├── PROJECT_STATUS.md            # 📖 Estado del proyecto
├── DEVELOPMENT_GUIDE.md         # 📖 Guía de desarrollo
└── README.md                    # Este archivo
```

**Archivos críticos** (⭐ leer antes de modificar):
- `/types/index.ts` - Definiciones de tipos
- `/lib/store.ts` - Estado global
- `/components/canvas/Canvas.tsx` - Sistema de canvas
- `/components/canvas/ModuleBlock.tsx` - UI de módulos

---

## 🎯 Próximos Pasos

### Prioridad ALTA

1. **Conectores Tipados** (Tarea A)
   - Definir tipos de datos (image, text, json, etc.)
   - Implementar drag & drop de puertos
   - Validación de conexiones

2. **Toolbar Flotante** (Tarea C)
   - Play Flow (ejecución en cadena)
   - Restart Flow
   - Pause (opcional)

3. **Sistema de Guardado** (Tarea D)
   - Autosave
   - localStorage o DB
   - Load/restore spaces

### Prioridad MEDIA

4. **Estados Extendidos** (Tarea B)
   - warning, fatal_error, invalid

5. **Sistema de Reinicio** (Tarea E)
   - Reset All, Reset Module, Reset From This

6. **Panel INFO** (Tarea F)
   - Información detallada de cada módulo

### Prioridad BAJA

7. **Otros Módulos**
   - AIE Engine, Naming Engine, Icon Generator, Marketing Pack

8. **Mejoras de UX**
   - Logs mejorados, Undo/Redo, Templates

---

## 🤝 Para Desarrolladores (IA o Humanos)

### Antes de Empezar

1. ✅ Leer [PROJECT_STATUS.md](./PROJECT_STATUS.md)
2. ✅ Leer [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
3. ✅ Buscar código existente antes de crear nuevo
4. ✅ Seguir los patrones establecidos

### Regla de Oro

**BUSCAR → REUTILIZAR → EXTENDER → CREAR**

Nunca duplicar código. Siempre buscar primero si existe algo similar que se pueda reutilizar o extender.

### Comandos Útiles

```bash
# Buscar componentes
grep -r "export function" components/

# Buscar tipos
cat types/index.ts

# Buscar en store
cat lib/store.ts | grep -A 3 ":\s*("

# Ver estructura
tree -L 3 -I 'node_modules|.next'
```

---

## 📝 Convenciones

### Naming
- **Componentes**: PascalCase (`ModuleBlock.tsx`)
- **Tipos**: PascalCase (`Module`, `Space`)
- **Funciones**: camelCase (`addModule`)
- **Constantes**: UPPER_SNAKE_CASE (`DEFAULT_ZOOM`)
- **Archivos utils**: kebab-case (`module-helpers.ts`)

### Imports
```typescript
// Usar alias
import { Module } from '@/types'          // ✅
import { useSpaceStore } from '@/lib/store' // ✅

// NO usar rutas relativas profundas
import { Module } from '../../../types'   // ❌
```

---

## 📊 Métricas del Código

- **Archivos TypeScript**: 14
- **Líneas de código**: ~2,020
- **Componentes React**: 11
- **API Endpoints**: 1
- **Módulos disponibles**: 5 (1 funcional)

---

## 🔗 Enlaces

- **Diseño de referencia**: `/design_interface/` (capturas de Freepik Spaces)
- **Next.js Docs**: https://nextjs.org/docs
- **Zustand Docs**: https://docs.pmnd.rs/zustand
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## 📄 Licencia

[Definir licencia]

---

## 👥 Contribuir

Ver [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) para guías de desarrollo.

**Flujo de trabajo**:
1. Leer documentación
2. Buscar código existente
3. Implementar siguiendo patrones
4. Actualizar PROJECT_STATUS.md
5. Commit y push

---

**Estado**: 🚧 En desarrollo activo
**Versión**: v1.1-alpha
**Última actualización**: 2025-11-15

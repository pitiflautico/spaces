# 🚀 Marketing Spaces

**Sistema modular visual para automatización de procesos de marketing basado en IA**

Un canvas interactivo donde puedes conectar módulos de procesamiento para analizar proyectos, generar nombres, crear iconos y producir packs de marketing completos.

---

## 📊 Estado del Proyecto

**Versión actual**: v3.0 (en desarrollo activo)
**Progreso global**: ~75% completado
**Última actualización**: 2025-11-15 ✅ Session 5: Module 5 + Local Automation Daemon

### 🎯 Progreso por Área

```
Infraestructura Base        ████████████████████ 100%  ✅
Conectores Visuales         ████████████████████ 100%  ✅
Conectores Tipados          ████████████████████ 100%  ✅
Estados Extendidos          ████████████████████ 100%  ✅
Toolbar Flotante            ████████████████████ 100%  ✅
Sistema Modular Base        ████████████████████ 100%  ✅
Configuration Panel         ████████████████████ 100%  ✅
Módulo 1 (Local Analysis)   ████████████████████ 100%  ✅
Módulo 2 (AIE Engine)       ████████████████████ 100%  ✅
Módulo 3 (Naming Engine)    ████████████████████ 100%  ✅
Módulo 4A (Logo Generator)  ████████████████████ 100%  ✅
Módulo 4B (App Icon)        ████████████████████ 100%  ✅
Módulo 5 (Metadata Gen)     ████████████████████ 100%  ✅ NUEVO
Local Automation Daemon     ████████████████████ 100%  ✅ NUEVO
Sistema de Guardado         ████░░░░░░░░░░░░░░░░  20%
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
- ✅ **FloatingToolbar**: Barra vertical lateral con botones de acción global
- ✅ **ModuleWrapper**: Componente base reutilizable para TODOS los módulos (evita duplicación de código)
- ✅ **Duplicate Module**: Funcionalidad completa para duplicar módulos con offset
- ✅ **Nuevo diseño de módulos**: Basado en diseño de referencia (título simple, icono, duplicate button)
- ✅ **Play button mejorado**: Grande en esquina inferior derecha
- ✅ **Settings button**: En esquina inferior izquierda
- ✅ **Puertos visuales mejorados**: Iconos más grandes, mejor posicionamiento

**Nuevas (Sesión 3 - UX Improvements + Configuration)**:
- ✅ **Toolbar reposicionado**: Ahora a la derecha del sidebar (left: 272px)
- ✅ **Toolbar compacto**: Botones reducidos de 48px a 36px
- ✅ **Toolbar simplificado**: 6 botones esenciales (Add, Play, Restart, Undo, Redo, Settings)
- ✅ **LocalProjectAnalysis UX mejorada**:
  - Detección automática de path al seleccionar carpeta
  - Generación automática de outputs mock
  - Outputs formateados (no botones de descarga)
  - Estado automático a "done" con metadata
- ✅ **Sidebar limpio**: Removidas secciones no usadas (80% más compacto)
- ✅ **Configuration Panel**: Sistema completo de configuración
  - API Keys (OpenAI, Anthropic, Stability AI)
  - Project Path por space
  - Preferences (Auto Save, etc.)
  - Modal elegante con validación
- ✅ **SpaceConfiguration**: Configuración persistente por space

**Nuevas (Sesión 5 - Module 5 + Automation Daemon)**:
- ✅ **Módulo 5: Metadata Generator**:
  - Generación AI de metadata para App Store y Google Play
  - 1-5 variantes con diferentes estilos y enfoques
  - Validación automática de límites de caracteres
  - UI interactiva para selección de variantes
  - Integración con Módulos 2, 3, y 4B
  - Soporte para múltiples idiomas
  - Indicadores de caracteres con código de colores
- ✅ **Local Automation Daemon**:
  - Servidor REST local (localhost:5050)
  - 13 endpoints para automatización iOS
  - Control completo del iOS Simulator
  - Captura automática de screenshots
  - Navegación programada con JSON
  - Redimensionamiento de imágenes
  - Sistema de logging con Winston
  - Seguridad (CORS, validación de paths)
- ✅ **Tipos TypeScript extendidos**: 7 nuevas interfaces para metadata
- ✅ **Documentación completa**: 2,142 líneas de especificaciones técnicas

### 🚧 En Desarrollo

- 🚧 Sistema de guardado persistente (localStorage/DB)
- 🚧 Ejecución en cadena topológica automática
- 🚧 Panel INFO de módulos
- 🚧 Más módulos de marketing (Email Templates, Social Media Posts)

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
- macOS (para Local Automation Daemon)

### Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd spaces

# Instalar dependencias del proyecto principal
npm install

# Ejecutar en desarrollo
npm run dev

# Abrir en navegador
# http://localhost:3000
```

### Instalación del Local Automation Daemon (Opcional)

```bash
# Ir al directorio del daemon
cd local-automation-daemon

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar daemon
npm start

# El daemon estará disponible en http://localhost:5050
```

### Uso Básico

1. **Crear un Space**: Click en "New Space" en el sidebar
2. **Configurar API Keys**: Click en Settings para añadir tus API keys
3. **Añadir módulo**: Click en el botón + flotante
4. **Conectar módulos**: Arrastrar desde puerto OUTPUT al INPUT correspondiente
5. **Ejecutar**: Click en "Play" en el módulo
6. **Ver resultados**: Los outputs aparecen al completar

### Flujo de Trabajo Típico

1. **Módulo 1**: Analizar proyecto local → genera Project Data
2. **Módulo 2**: AIE Engine → genera App Intelligence + Flow Context
3. **Módulo 3**: Naming Engine → genera nombres + seleccionar favorito
4. **Módulo 4A**: Logo Generator → genera logos con variantes
5. **Módulo 4B**: App Icon Generator → genera iconos para app stores
6. **Módulo 5**: Metadata Generator → genera descripciones para stores

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
│   ├── modules/                 # Módulos específicos (6 módulos)
│   │   ├── LocalProjectAnalysisModule.tsx   # Módulo 1
│   │   ├── AIEEngineModule.tsx              # Módulo 2
│   │   ├── NamingEngineModule.tsx           # Módulo 3
│   │   ├── LogoGeneratorModule.tsx          # Módulo 4A
│   │   ├── AppIconGeneratorModule.tsx       # Módulo 4B
│   │   ├── MetadataGeneratorModule.tsx      # Módulo 5 ⭐ NUEVO
│   │   └── MetadataVariantsPanel.tsx        # Panel de variantes
│   └── sidebar/
│       └── Sidebar.tsx          # Panel lateral
│
├── lib/
│   ├── store.ts                 # ⭐ Zustand store
│   └── ai-provider.ts           # Abstracción de proveedores AI
│
├── types/
│   └── index.ts                 # ⭐ Tipos globales (40+ interfaces)
│
├── local-automation-daemon/     # ⭐ NUEVO - Daemon de automatización
│   ├── bin/daemon.js            # Servidor Express (13 endpoints)
│   ├── config/                  # Configuraciones
│   ├── scripts/navigation/      # Scripts de navegación iOS
│   ├── test/                    # Suite de pruebas
│   └── package.json
│
├── docs/                        # Documentación técnica
│   ├── MODULE_5_METADATA_GENERATOR.md   # Especificación Módulo 5
│   └── LOCAL_AUTOMATION_DAEMON.md       # Especificación Daemon
│
├── PROJECT_STATUS.md            # 📖 Estado completo del proyecto
├── DEVELOPMENT_GUIDE.md         # 📖 Guía de desarrollo
└── README.md                    # Este archivo
```

**Archivos críticos** (⭐ leer antes de modificar):
- `/types/index.ts` - 40+ definiciones de tipos TypeScript
- `/lib/store.ts` - Estado global con Zustand
- `/components/canvas/Canvas.tsx` - Sistema de canvas
- `/components/canvas/ModuleBlock.tsx` - UI de módulos
- `/components/modules/MetadataGeneratorModule.tsx` - Generador de metadata
- `/local-automation-daemon/bin/daemon.js` - Servidor de automatización

---

## 🎯 Próximos Pasos

### Prioridad ALTA

1. **Sistema de Guardado Persistente**
   - Guardar espacios en localStorage/IndexedDB
   - Auto-save cada X segundos
   - Restore spaces al recargar
   - Export/Import de espacios

2. **Ejecución en Cadena Topológica**
   - Play Flow completo (ejecutar todos los módulos conectados)
   - Detección automática de dependencias
   - Ejecución paralela cuando sea posible
   - Manejo de errores en cadena

3. **Panel INFO de Módulos**
   - Información detallada por módulo
   - Historial de ejecuciones
   - Estadísticas de uso
   - Logs estructurados

### Prioridad MEDIA

4. **Optimizaciones de Performance**
   - Lazy loading de módulos
   - Optimización de renders
   - Debouncing de conexiones
   - Canvas virtual scrolling

5. **Testing Automatizado**
   - Unit tests con Jest
   - Integration tests
   - E2E tests con Playwright
   - CI/CD pipeline

### Prioridad BAJA

6. **Módulos Adicionales de Marketing**
   - Email Templates Generator
   - Social Media Posts Generator
   - Press Release Generator
   - Marketing Copy Variants

7. **Mejoras de UX**
   - Templates predefinidos
   - Atajos de teclado
   - Tutorial interactivo
   - Temas personalizables

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

**Frontend (Next.js + React)**:
- **Archivos TypeScript**: 25+
- **Líneas de código**: ~8,500+
- **Componentes React**: 20+
- **Interfaces TypeScript**: 40+
- **Módulos funcionales**: 6 (100% operativos)

**Backend (Local Daemon)**:
- **Archivos JavaScript**: 8
- **Líneas de código**: ~1,200
- **API Endpoints REST**: 13
- **Test scripts**: 3

**Documentación**:
- **Archivos de docs**: 5
- **Líneas de documentación**: ~4,500+
- **Ejemplos de código**: 50+

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

**Estado**: 🚀 En desarrollo activo
**Versión**: v3.0-beta
**Última actualización**: 2025-11-15 (Session 5: Module 5 + Automation Daemon)
**Progreso**: 75% completado

---

## 📝 Changelog

### v3.0 (Session 5) - 2025-11-15
- ✅ Implementado Módulo 5: Metadata Generator
- ✅ Implementado Local Automation Daemon con 13 endpoints REST
- ✅ 7 nuevas interfaces TypeScript para metadata
- ✅ 2,142 líneas de documentación técnica
- ✅ Validación mejorada de conexiones entre módulos
- ✅ Debugging comprehensivo para troubleshooting

### v2.1 (Session 4) - 2025-11-14
- ✅ Implementado Módulo 4B: App Icon Generator
- ✅ Implementado Módulo 4A: Logo Generator
- ✅ Sistema de variantes para logos e iconos
- ✅ Integración con Recraft V3 API

### v2.0 (Session 3) - 2025-11-13
- ✅ Configuration Panel con API Keys
- ✅ UX improvements en todos los módulos
- ✅ Toolbar refinado y reposicionado

### v1.1 (Session 2) - 2025-11-12
- ✅ Implementado Módulo 3: Naming Engine
- ✅ Implementado Módulo 2: AIE Engine
- ✅ Sistema modular base con ModuleWrapper

### v1.0 (Session 1) - 2025-11-11
- ✅ Infraestructura base del proyecto
- ✅ Sistema de canvas con zoom y pan
- ✅ Conectores tipados y validación
- ✅ Módulo 1: Local Project Analysis

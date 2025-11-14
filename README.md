# App Marketing Spaces — Protocolo Global + Info de Módulos

Sistema de bloques modulares para generación de contenido de marketing con protocolo global de errores y sistema de información de módulos.

## Características Principales

✅ **Protocolo Global de Errores** con 5 tipos (INPUT, SYSTEM, PROCESSING, CONNECTION, FATAL)
✅ **6 Estados Visuales** de bloques (idle, running, warning, error, fatal_error, done)
✅ **Sistema de Logs** con exportación a archivos .txt
✅ **Plantilla Universal de Info** con 11 apartados (A-K) para cada módulo
✅ **Dark Theme** inspirado en Freepik Spaces
✅ **Módulo 1 Implementado**: Local Project Analysis Agent

## Instalación

```bash
# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev
```

## Protocolo de Errores

### Tipos de Errores
- **INPUT_ERROR**: Errores de entrada del usuario
- **SYSTEM_ERROR**: Errores del sistema/infraestructura
- **PROCESSING_ERROR**: Errores durante el procesamiento
- **CONNECTION_ERROR**: Errores de conexión entre módulos
- **FATAL_ERROR**: Errores críticos que detienen el sistema

### Acciones Disponibles
- TRY AGAIN / RESET INPUTS / VIEW LOGS / MORE INFO / JUMP TO INPUT / IGNORE WARNING

## Estados de Módulos

| Estado | Color | Icono | Descripción |
|--------|-------|-------|-------------|
| idle | Gris | ○ | Inactivo, esperando inputs |
| running | Azul | ⟳ | Ejecutándose |
| warning | Naranja | ⚠ | Completado con advertencias |
| error | Rojo | ✕ | Error recuperable |
| fatal_error | Rojo oscuro | ⊗ | Error fatal |
| done | Verde | ✓ | Completado exitosamente |

## Módulo 1: Local Project Analysis Agent

Analiza un proyecto local y genera dataset técnico.

**Inputs:**
- `projectPath` (requerido): Ruta absoluta al proyecto
- `includeHidden`: Incluir archivos ocultos
- `includeNodeModules`: Incluir node_modules

**Outputs:**
- `repository_metadata.json`
- `file_contents.json`
- `repo_structure.json`
- `analysis_log.txt`

**Tiempo estimado:** 0.1-0.5 segundos

## Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── ModuleBlock.tsx  # Bloque visual del módulo
│   ├── ModuleInfo.tsx   # Panel info universal (A-K)
│   ├── ErrorDisplay.tsx # Visualización de errores
│   └── LogsPanel.tsx    # Panel de logs
├── modules/             # Definiciones de módulos
│   ├── module1-config.ts   # Configuración Módulo 1
│   └── module1-executor.ts # Lógica Módulo 1
├── types/               # Tipos TypeScript
│   ├── errors.ts        # Tipos de errores
│   ├── module.ts        # Tipos de módulos
│   └── logs.ts          # Tipos de logs
├── utils/               # Utilidades
│   ├── errorHandler.ts  # Manejo de errores
│   └── logger.ts        # Sistema de logging
├── constants/           # Constantes
│   └── states.ts        # Config de estados
├── App.tsx              # Componente principal
├── App.css              # Estilos
└── main.tsx             # Entry point
```

## Scripts

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run preview      # Preview build
npm run type-check   # Type checking
npm run lint         # Linting
```

## Roadmap

- [ ] Módulo 2: AIE
- [ ] Módulo 3: Branding
- [ ] Módulo 4: Marketing Pack
- [ ] Módulo 5: Patch Engine
- [ ] Drag & drop de módulos
- [ ] Conexiones visuales entre módulos

---

**Stack**: React + TypeScript + Vite

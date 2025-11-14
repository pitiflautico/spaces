# Marketing Spaces

Una plataforma completa de marketing para aplicaciones con interfaz estilo Freepik Spaces.

## Características

### Interfaz Principal

- **Sidebar Fijo**: Navegación lateral con gestión de espacios, herramientas y perfil
- **Canvas Infinito**: Lienzo ilimitado con grid de puntos para organizar módulos
- **Zoom y Pan**: Controles de zoom (0.2x - 3x) y desplazamiento fluido
- **Sistema de Bloques**: Módulos arrastrables y conectables

### Módulos Disponibles

#### 1. Local Project Analysis Agent (Implementado)
Primer módulo del sistema que permite:
- Analizar proyectos locales existentes
- Leer estructura de carpetas y archivos
- Detectar tipo de proyecto y framework
- Extraer contenidos de archivos clave (package.json, README, configs)
- Generar metadata detallada y logs

**Inputs:**
- Local Project Path (ruta absoluta requerida)
- Include Hidden Files (yes/no, default: no)
- Include Node Modules (yes/no, default: no)

**Outputs:**
- repository_metadata.json (metadata del proyecto)
- file_contents.json (contenidos de archivos importantes)
- repo_structure.json (estructura de carpetas)
- analysis_log.txt (log del proceso)

#### 2. Reader Engine (Próximamente)
Análisis profundo del código del proyecto

#### 3. Naming Engine (Próximamente)
Generación de nombres creativos para apps

#### 4. Icon Generator (Próximamente)
Creación de iconos con IA

#### 5. Marketing Pack (Próximamente)
Materiales de marketing completos

## Tecnologías

- **Frontend**: Next.js 16, React 19, TypeScript
- **Estilos**: Tailwind CSS 4
- **Estado**: Zustand
- **Iconos**: Heroicons
- **Backend**: Next.js API Routes
- **File System**: Node.js fs/promises

## Instalación

```bash
cd marketing-spaces
npm install
```

## Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## Estructura del Proyecto

```
marketing-spaces/
├── app/
│   ├── api/
│   │   └── local-analysis/     # API para Local Project Analysis Agent
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── sidebar/
│   │   └── Sidebar.tsx         # Barra lateral de navegación
│   ├── canvas/
│   │   ├── Canvas.tsx          # Lienzo principal
│   │   ├── DotGrid.tsx         # Grid de puntos
│   │   ├── CanvasControls.tsx  # Controles de zoom
│   │   ├── ModuleBlock.tsx     # Bloque de módulo
│   │   ├── ConnectionLines.tsx # Líneas de conexión
│   │   ├── AddModuleButton.tsx # Botón para añadir módulos
│   │   └── AddModulePanel.tsx  # Panel de selección de módulos
│   └── modules/
│       └── LocalProjectAnalysisModule.tsx  # UI del módulo Local Project Analysis
├── lib/
│   └── store.ts                # Estado global con Zustand
├── types/
│   └── index.ts                # Tipos TypeScript
└── public/

```

## Uso

### Crear un Espacio

1. Click en el sidebar en "Spaces"
2. Click en "Create Space"
3. Ingresa el nombre del espacio

### Añadir Módulos

1. Click en el botón "+" flotante
2. Selecciona el módulo deseado
3. El módulo aparecerá en el canvas

### Usar Local Project Analysis Agent

1. Añadir módulo "Local Project Analysis Agent"
2. Completar inputs:
   - Local Project Path: ruta absoluta al proyecto local (ej: /Users/dani/Projects/myapp)
   - Include hidden files: Yes/No (default: No)
   - Include node_modules: Yes/No (default: No)
3. Click en "Run"
4. Esperar a que se complete el análisis
5. Descargar los outputs generados (JSON files y log)

### Navegación en el Canvas

- **Pan**: Arrastrar con el mouse o Spacebar + arrastrar
- **Zoom**: Rueda del ratón o botones +/- en la esquina
- **Mover módulos**: Arrastrar desde el header del bloque
- **Reset**: Click en el icono de reset en los controles

## API Endpoints

### POST /api/local-analysis

Ejecuta el análisis de un proyecto local.

**Request:**
```json
{
  "localProjectPath": "/Users/dani/Projects/my-app",
  "includeHiddenFiles": false,
  "includeNodeModules": false
}
```

**Response:**
```json
{
  "success": true,
  "repositoryMetadata": {
    "projectName": "my-app",
    "projectType": "web",
    "framework": "Next.js",
    "dependencies": {...},
    "detectedFiles": ["package.json", "README.md", ...],
    "directories": {...}
  },
  "fileContents": {
    "packageJson": {...},
    "readme": "...",
    "srcFiles": [...]
  },
  "repoStructure": {
    "root": "my-app",
    "items": [...]
  },
  "analysisLog": "..."
}
```

## Próximas Características

- [ ] Sistema de conexiones entre módulos funcional
- [ ] Implementación de Reader Engine
- [ ] Implementación de Naming Engine
- [ ] Implementación de Icon Generator
- [ ] Implementación de Marketing Pack
- [ ] Guardar y cargar espacios
- [ ] Exportar workflow completo
- [ ] Colaboración en tiempo real
- [ ] Templates de workflows

## Contribuir

Este proyecto está en desarrollo activo. Las contribuciones son bienvenidas.

## Licencia

ISC

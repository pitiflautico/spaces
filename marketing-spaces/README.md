# Marketing Spaces

Una plataforma completa de marketing para aplicaciones con interfaz estilo Freepik Spaces.

## Características

### Interfaz Principal

- **Sidebar Fijo**: Navegación lateral con gestión de espacios, herramientas y perfil
- **Canvas Infinito**: Lienzo ilimitado con grid de puntos para organizar módulos
- **Zoom y Pan**: Controles de zoom (0.2x - 3x) y desplazamiento fluido
- **Sistema de Bloques**: Módulos arrastrables y conectables

### Módulos Disponibles

#### 1. Ingestion Agent (Implementado)
Primer módulo del sistema que permite:
- Descargar repositorios de GitHub
- Subir archivos ZIP
- Analizar estructura de carpetas
- Detectar tipo de proyecto y framework
- Generar metadata y logs

**Inputs:**
- Project Name (requerido)
- Repository URL o ZIP file
- Branch (default: main)
- Mode: copy | readonly

**Outputs:**
- Project Path
- Folder Structure JSON
- Project Metadata JSON
- Ingestion Log

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
- **Estilos**: Tailwind CSS
- **Estado**: Zustand
- **Iconos**: Heroicons
- **Backend**: Next.js API Routes
- **Git Operations**: simple-git

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
│   │   └── ingestion/          # API para Ingestion Agent
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
│       └── IngestionAgentModule.tsx  # UI del módulo Ingestion Agent
├── lib/
│   └── store.ts                # Estado global con Zustand
├── types/
│   └── index.ts                # Tipos TypeScript
├── storage/
│   └── projects/               # Proyectos descargados
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

### Usar Ingestion Agent

1. Añadir módulo "Ingestion Agent"
2. Completar inputs:
   - Project Name: nombre del proyecto
   - Repository URL: URL de GitHub
   - Branch: rama a clonar (default: main)
3. Click en "Run"
4. Esperar a que se complete la ingesta
5. Ver los outputs generados

### Navegación en el Canvas

- **Pan**: Arrastrar con el mouse o Spacebar + arrastrar
- **Zoom**: Rueda del ratón o botones +/- en la esquina
- **Mover módulos**: Arrastrar desde el header del bloque
- **Reset**: Click en el icono de reset en los controles

## API Endpoints

### POST /api/ingestion

Ejecuta el proceso de ingesta de un proyecto.

**Request:**
```json
{
  "projectName": "my-app",
  "repoUrl": "https://github.com/user/repo.git",
  "branch": "main",
  "mode": "copy"
}
```

**Response:**
```json
{
  "success": true,
  "projectPath": "/path/to/project",
  "folderStructure": [...],
  "metadata": {...},
  "log": "..."
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

/**
 * MÓDULO 1: Local Project Analysis Agent
 * Configuración e información según plantilla universal
 */

import { ModuleConfig } from '@/types/module'

export const module1Config: ModuleConfig = {
  id: 'module-1-local-project-analysis',
  icon: '📁',
  color: '#3B82F6',
  info: {
    // APARTADO A - Nombre del módulo
    name: 'Local Project Analysis Agent',

    // APARTADO B - Descripción corta
    shortDescription: 'Analiza un proyecto local y genera un dataset técnico para el sistema.',

    // APARTADO C - Descripción extendida
    extendedDescription:
      'Lee la estructura del proyecto desde una ruta local, analiza sus archivos principales, extrae configuración, detecta frameworks y genera información que alimenta al resto de módulos.',

    // APARTADO D - ¿Cuándo usar este módulo?
    whenToUse: [
      'Es el PRIMER módulo del sistema',
      'Siempre debe ejecutarse antes que AIE, Branding, etc.',
      'Cuando necesitas generar un dataset completo de tu proyecto',
      'Para detectar automáticamente frameworks y configuraciones'
    ],

    // APARTADO E - Inputs necesarios
    inputs: [
      {
        id: 'projectPath',
        label: 'Ruta del Proyecto',
        type: 'text',
        required: true,
        placeholder: '/Users/dani/Projects/metronome/',
        description: 'Ruta absoluta a la carpeta raíz del proyecto'
      },
      {
        id: 'includeHidden',
        label: 'Incluir archivos ocultos',
        type: 'boolean',
        required: false,
        description: 'Incluir archivos que comienzan con punto (.)'
      },
      {
        id: 'includeNodeModules',
        label: 'Incluir node_modules',
        type: 'boolean',
        required: false,
        description: 'Incluir carpeta node_modules (normalmente no recomendado)'
      }
    ],

    // APARTADO F - Outputs generados
    outputs: [
      {
        id: 'repositoryMetadata',
        label: 'repository_metadata.json',
        type: 'json',
        description: 'Metadatos del repositorio: nombre, frameworks detectados, dependencias principales'
      },
      {
        id: 'fileContents',
        label: 'file_contents.json',
        type: 'json',
        description: 'Contenido de archivos clave (README, package.json, etc.)'
      },
      {
        id: 'repoStructure',
        label: 'repo_structure.json',
        type: 'json',
        description: 'Estructura de carpetas y archivos del proyecto'
      },
      {
        id: 'analysisLog',
        label: 'analysis_log.txt',
        type: 'text',
        description: 'Log del proceso de análisis'
      }
    ],

    // APARTADO G - Tiempo estimado
    estimatedTime: '0.1 a 0.5 segundos',

    // APARTADO H - Dependencias
    dependencies: [],

    // APARTADO I - Errores típicos
    commonErrors: [
      {
        error: 'Ruta no encontrada',
        solution: 'Revisar que la ruta sea absoluta y exista en el sistema'
      },
      {
        error: 'No se encontró README.md',
        solution: 'Advertencia normal - el módulo continuará sin este archivo'
      },
      {
        error: 'No se pudo parsear package.json',
        solution: 'Verificar que el archivo package.json sea válido JSON'
      },
      {
        error: 'Faltan archivos clave',
        solution: 'Asegurarse de que la ruta apunta a la raíz del proyecto'
      }
    ],

    // APARTADO J - Consejos de uso
    tips: [
      'Seleccionar siempre la carpeta raíz del proyecto',
      'Evitar incluir "node_modules" para análisis más rápidos',
      'Asegurarse de que los archivos están accesibles',
      'El módulo detecta automáticamente frameworks comunes (React, Vue, Angular, etc.)'
    ],

    // APARTADO K - Ejemplo visual
    example: {
      input: {
        projectPath: '/Users/dani/Projects/metronome/',
        includeHidden: false,
        includeNodeModules: false
      },
      output: {
        repositoryMetadata: {
          name: 'metronome',
          frameworks: ['Expo', 'React Native'],
          styling: ['Tailwind CSS'],
          dependencies: {
            react: '^18.2.0',
            'react-native': '^0.74.0',
            expo: '^51.0.0'
          }
        }
      }
    }
  }
}

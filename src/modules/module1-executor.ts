/**
 * MÓDULO 1: Local Project Analysis Agent
 * Lógica de ejecución (simulada para demo)
 */

import { ModuleExecutionState, ModuleState } from '@/types/module'
import { ErrorType, ErrorSeverity } from '@/types/errors'
import { createError } from '@/utils/errorHandler'
import { logInfo, logWarning, logError } from '@/utils/logger'

/**
 * Simula el análisis de un proyecto local
 * En una implementación real, esto haría análisis real de archivos
 */
export async function executeModule1(
  executionState: ModuleExecutionState,
  onStateUpdate: (state: Partial<ModuleExecutionState>) => void
): Promise<void> {
  const moduleId = executionState.moduleId
  const moduleName = 'Local Project Analysis Agent'

  try {
    // Validar inputs
    const projectPath = executionState.inputs.projectPath as string

    if (!projectPath || projectPath.trim() === '') {
      const error = createError(
        ErrorType.INPUT_ERROR,
        'La ruta del proyecto es obligatoria',
        moduleId,
        {
          severity: ErrorSeverity.ERROR,
          code: 'INPUT_001',
          metadata: { inputId: 'projectPath' }
        }
      )

      logError(moduleId, moduleName, 'Ruta del proyecto no proporcionada')

      onStateUpdate({
        state: ModuleState.ERROR,
        errors: [error]
      })
      return
    }

    logInfo(moduleId, moduleName, `Iniciando análisis del proyecto en: ${projectPath}`)

    // Iniciar ejecución
    onStateUpdate({
      state: ModuleState.RUNNING,
      progress: 0,
      errors: [],
      startTime: new Date()
    })

    // Simular análisis de estructura
    await delay(200)
    logInfo(moduleId, moduleName, 'Escaneando estructura de carpetas...')
    onStateUpdate({ progress: 25 })

    // Simular lectura de archivos
    await delay(200)
    logInfo(moduleId, moduleName, 'Leyendo archivos clave (package.json, README.md)...')
    onStateUpdate({ progress: 50 })

    // Advertencia si no se encuentra README (opcional)
    const hasReadme = Math.random() > 0.3 // 70% chance de tener README
    if (!hasReadme) {
      const warning = createError(
        ErrorType.SYSTEM_ERROR,
        'No se encontró README.md en el proyecto',
        moduleId,
        {
          severity: ErrorSeverity.WARNING,
          code: 'WARN_001'
        }
      )

      logWarning(moduleId, moduleName, 'README.md no encontrado')

      onStateUpdate({
        state: ModuleState.WARNING,
        errors: [warning]
      })
    }

    // Simular detección de frameworks
    await delay(200)
    logInfo(moduleId, moduleName, 'Detectando frameworks y dependencias...')
    onStateUpdate({ progress: 75 })

    // Simular generación de outputs
    await delay(200)
    logInfo(moduleId, moduleName, 'Generando outputs...')
    onStateUpdate({ progress: 90 })

    // Generar outputs simulados
    const repositoryMetadata = {
      name: projectPath.split('/').filter(Boolean).pop() || 'unknown',
      frameworks: detectFrameworks(projectPath),
      styling: detectStyling(projectPath),
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0'
      },
      analyzedAt: new Date().toISOString()
    }

    const repoStructure = {
      root: projectPath,
      folders: ['src', 'public', 'components', 'utils'],
      files: ['package.json', 'README.md', 'tsconfig.json'],
      totalFiles: 42,
      totalFolders: 8
    }

    const fileContents = {
      'package.json': '{"name": "example", "version": "1.0.0"}',
      'README.md': '# Example Project\n\nThis is an example.'
    }

    logInfo(moduleId, moduleName, 'Análisis completado exitosamente')

    // Completar con éxito
    onStateUpdate({
      state: hasReadme ? ModuleState.DONE : ModuleState.WARNING,
      progress: 100,
      outputs: {
        repositoryMetadata,
        fileContents,
        repoStructure,
        analysisLog: 'analysis_log.txt'
      },
      endTime: new Date()
    })
  } catch (error) {
    const systemError = createError(
      ErrorType.FATAL_ERROR,
      'Error crítico durante el análisis del proyecto',
      moduleId,
      {
        severity: ErrorSeverity.FATAL,
        code: 'FATAL_001',
        technicalMessage: error instanceof Error ? error.message : String(error)
      }
    )

    logError(moduleId, moduleName, 'Error fatal durante la ejecución', {
      error: error instanceof Error ? error.message : String(error)
    })

    onStateUpdate({
      state: ModuleState.FATAL_ERROR,
      errors: [systemError],
      endTime: new Date()
    })
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function detectFrameworks(path: string): string[] {
  // Simulación simple basada en el path
  const frameworks = []

  if (path.toLowerCase().includes('react')) frameworks.push('React')
  if (path.toLowerCase().includes('vue')) frameworks.push('Vue')
  if (path.toLowerCase().includes('angular')) frameworks.push('Angular')
  if (path.toLowerCase().includes('expo')) frameworks.push('Expo')
  if (path.toLowerCase().includes('next')) frameworks.push('Next.js')

  return frameworks.length > 0 ? frameworks : ['React']
}

function detectStyling(path: string): string[] {
  const styling = []

  if (path.toLowerCase().includes('tailwind')) styling.push('Tailwind CSS')
  if (path.toLowerCase().includes('sass')) styling.push('SASS')
  if (path.toLowerCase().includes('styled')) styling.push('Styled Components')

  return styling.length > 0 ? styling : ['CSS']
}

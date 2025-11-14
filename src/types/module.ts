/**
 * TIPOS DE MÓDULOS Y ESTADOS
 * Define estados, información y estructura de módulos
 */

import { SystemError } from './errors'

/**
 * Estados posibles de un bloque/módulo
 */
export enum ModuleState {
  /** Inactivo - esperando inputs */
  IDLE = 'idle',

  /** Ejecutándose */
  RUNNING = 'running',

  /** Advertencia - funcionando pero con avisos */
  WARNING = 'warning',

  /** Error - falló pero recuperable */
  ERROR = 'error',

  /** Error fatal - no recuperable */
  FATAL_ERROR = 'fatal_error',

  /** Completado exitosamente */
  DONE = 'done'
}

/**
 * Input de un módulo
 */
export interface ModuleInput {
  id: string
  label: string
  type: 'text' | 'number' | 'file' | 'boolean' | 'select'
  required: boolean
  placeholder?: string
  description?: string
  options?: string[]
  value?: unknown
}

/**
 * Output de un módulo
 */
export interface ModuleOutput {
  id: string
  label: string
  type: string
  description?: string
  value?: unknown
}

/**
 * Sección de la plantilla universal de INFO
 */
export interface ModuleInfo {
  /** A - Nombre del módulo */
  name: string

  /** B - Descripción corta (1 frase) */
  shortDescription: string

  /** C - Descripción extendida (máx 3 líneas) */
  extendedDescription: string

  /** D - ¿Cuándo usar este módulo? */
  whenToUse: string[]

  /** E - Inputs necesarios */
  inputs: ModuleInput[]

  /** F - Outputs generados */
  outputs: ModuleOutput[]

  /** G - Tiempo estimado de ejecución */
  estimatedTime: string

  /** H - Dependencias (si necesita otro módulo previo) */
  dependencies: string[]

  /** I - Errores típicos y cómo resolverlos */
  commonErrors: Array<{
    error: string
    solution: string
  }>

  /** J - Consejos de uso */
  tips: string[]

  /** K - Ejemplo visual de input/output */
  example?: {
    input: Record<string, unknown>
    output: Record<string, unknown>
  }
}

/**
 * Configuración de un módulo
 */
export interface ModuleConfig {
  id: string
  info: ModuleInfo
  icon?: string
  color?: string
}

/**
 * Estado de ejecución de un módulo
 */
export interface ModuleExecutionState {
  moduleId: string
  state: ModuleState
  inputs: Record<string, unknown>
  outputs: Record<string, unknown>
  errors: SystemError[]
  logs: string[]
  startTime?: Date
  endTime?: Date
  progress?: number
}

/**
 * Conexión entre módulos
 */
export interface ModuleConnection {
  id: string
  sourceModuleId: string
  targetModuleId: string
  sourceOutputId: string
  targetInputId: string
  isValid: boolean
  validationError?: string
}

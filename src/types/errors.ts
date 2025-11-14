/**
 * PROTOCOLO GLOBAL DE ERRORES
 * Define los tipos de errores del sistema según especificación
 */

/**
 * Tipos de errores del sistema
 */
export enum ErrorType {
  /** INPUT ERRORS - Errores de entrada del usuario */
  INPUT_ERROR = 'INPUT_ERROR',

  /** SYSTEM ERRORS - Errores del sistema/infraestructura */
  SYSTEM_ERROR = 'SYSTEM_ERROR',

  /** PROCESSING ERRORS - Errores durante el procesamiento */
  PROCESSING_ERROR = 'PROCESSING_ERROR',

  /** CONNECTION ERRORS - Errores de conexión entre módulos */
  CONNECTION_ERROR = 'CONNECTION_ERROR',

  /** FATAL ERRORS - Errores críticos que detienen el sistema */
  FATAL_ERROR = 'FATAL_ERROR'
}

/**
 * Severidad del error
 */
export enum ErrorSeverity {
  WARNING = 'warning',
  ERROR = 'error',
  FATAL = 'fatal'
}

/**
 * Estructura de un error del sistema
 */
export interface SystemError {
  /** Tipo de error */
  type: ErrorType

  /** Severidad */
  severity: ErrorSeverity

  /** Mensaje para el usuario */
  message: string

  /** Mensaje técnico (opcional) */
  technicalMessage?: string

  /** Código de error */
  code?: string

  /** Timestamp del error */
  timestamp: Date

  /** ID del módulo donde ocurrió */
  moduleId: string

  /** Datos adicionales */
  metadata?: Record<string, unknown>
}

/**
 * Acciones disponibles ante errores
 */
export enum ErrorAction {
  TRY_AGAIN = 'TRY_AGAIN',
  RESET_INPUTS = 'RESET_INPUTS',
  VIEW_LOGS = 'VIEW_LOGS',
  MORE_INFO = 'MORE_INFO',
  JUMP_TO_INPUT = 'JUMP_TO_INPUT',
  IGNORE_WARNING = 'IGNORE_WARNING'
}

/**
 * Handler de acción de error
 */
export interface ErrorActionHandler {
  action: ErrorAction
  label: string
  handler: () => void
}

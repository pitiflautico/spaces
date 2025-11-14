/**
 * UTILIDADES DE MANEJO DE ERRORES
 */

import { SystemError, ErrorType, ErrorSeverity } from '@/types/errors'

/**
 * Crea un error del sistema
 */
export function createError(
  type: ErrorType,
  message: string,
  moduleId: string,
  options?: {
    severity?: ErrorSeverity
    code?: string
    technicalMessage?: string
    metadata?: Record<string, unknown>
  }
): SystemError {
  return {
    type,
    severity: options?.severity || ErrorSeverity.ERROR,
    message,
    technicalMessage: options?.technicalMessage,
    code: options?.code,
    timestamp: new Date(),
    moduleId,
    metadata: options?.metadata
  }
}

/**
 * Mensajes de error estándar para errores de conexión
 */
export const CONNECTION_ERROR_MESSAGES = {
  TYPE_MISMATCH: 'El tipo de output del módulo anterior no coincide con el input esperado',
  MISSING_OUTPUT: 'El módulo anterior no ha generado el output requerido',
  INVALID_DATA: 'Los datos recibidos no son válidos para este módulo',
  NOT_CONNECTED: 'Este módulo requiere estar conectado a un módulo anterior'
}

/**
 * Valida que un output sea compatible con un input
 */
export function validateConnection(
  outputType: string,
  inputType: string,
  outputValue: unknown
): { isValid: boolean; error?: string } {
  if (!outputValue) {
    return {
      isValid: false,
      error: CONNECTION_ERROR_MESSAGES.MISSING_OUTPUT
    }
  }

  if (outputType !== inputType) {
    return {
      isValid: false,
      error: CONNECTION_ERROR_MESSAGES.TYPE_MISMATCH
    }
  }

  return { isValid: true }
}

/**
 * Formatea un error para mostrar al usuario
 */
export function formatErrorMessage(error: SystemError): string {
  let message = error.message

  if (error.code) {
    message = `[${error.code}] ${message}`
  }

  if (error.severity === ErrorSeverity.FATAL) {
    message = `🔴 FATAL: ${message}`
  } else if (error.severity === ErrorSeverity.WARNING) {
    message = `⚠️ ${message}`
  } else {
    message = `❌ ${message}`
  }

  return message
}

/**
 * Obtiene el color del error según su severidad
 */
export function getErrorColor(severity: ErrorSeverity): string {
  switch (severity) {
    case ErrorSeverity.WARNING:
      return '#FFA500'
    case ErrorSeverity.ERROR:
      return '#FF4444'
    case ErrorSeverity.FATAL:
      return '#CC0000'
    default:
      return '#FF4444'
  }
}

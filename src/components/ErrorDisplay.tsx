/**
 * COMPONENTE ERROR DISPLAY
 * Muestra errores del módulo con acciones disponibles
 */

import React from 'react'
import { SystemError, ErrorAction } from '@/types/errors'
import { formatErrorMessage, getErrorColor } from '@/utils/errorHandler'
import { AlertCircle, RotateCw, Trash2, FileText, Info, ArrowRight, XCircle } from 'lucide-react'

interface ErrorDisplayProps {
  errors: SystemError[]
  onTryAgain?: () => void
  onResetInputs?: () => void
  onViewLogs?: () => void
  moduleId: string
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  errors,
  onTryAgain,
  onResetInputs,
  onViewLogs,
}) => {
  const [ignoredWarnings, setIgnoredWarnings] = React.useState<Set<number>>(new Set())

  const handleIgnoreWarning = (index: number) => {
    setIgnoredWarnings((prev) => new Set(prev).add(index))
  }

  const visibleErrors = errors.filter((_, index) => !ignoredWarnings.has(index))

  if (visibleErrors.length === 0) return null

  return (
    <div className="error-display">
      {visibleErrors.map((error, index) => (
        <div
          key={index}
          className="error-item"
          style={{ borderLeftColor: getErrorColor(error.severity) }}
        >
          <div className="error-header">
            <AlertCircle
              size={20}
              style={{ color: getErrorColor(error.severity) }}
            />
            <div className="error-message">{formatErrorMessage(error)}</div>
          </div>

          {error.technicalMessage && (
            <div className="error-technical">
              <strong>Detalles técnicos:</strong> {error.technicalMessage}
            </div>
          )}

          <div className="error-actions">
            {/* TRY AGAIN */}
            {onTryAgain && (
              <button
                className="error-action-button"
                onClick={onTryAgain}
                title="Intentar de nuevo"
              >
                <RotateCw size={14} />
                Try Again
              </button>
            )}

            {/* RESET INPUTS */}
            {onResetInputs && (
              <button
                className="error-action-button"
                onClick={onResetInputs}
                title="Resetear inputs"
              >
                <Trash2 size={14} />
                Reset Inputs
              </button>
            )}

            {/* VIEW LOGS */}
            {onViewLogs && (
              <button
                className="error-action-button"
                onClick={onViewLogs}
                title="Ver logs"
              >
                <FileText size={14} />
                View Logs
              </button>
            )}

            {/* MORE INFO */}
            {error.metadata && (
              <button
                className="error-action-button"
                onClick={() => console.log('Error metadata:', error.metadata)}
                title="Más información"
              >
                <Info size={14} />
                More Info
              </button>
            )}

            {/* JUMP TO INPUT */}
            {error.metadata?.inputId && (
              <button
                className="error-action-button"
                onClick={() => {
                  const element = document.getElementById(`input-${error.metadata?.inputId}`)
                  element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }}
                title="Ir al input"
              >
                <ArrowRight size={14} />
                Jump to Input
              </button>
            )}

            {/* IGNORE WARNING */}
            {error.severity === 'warning' && (
              <button
                className="error-action-button error-action-button-ignore"
                onClick={() => handleIgnoreWarning(index)}
                title="Ignorar advertencia"
              >
                <XCircle size={14} />
                Ignore Warning
              </button>
            )}
          </div>

          {error.code && (
            <div className="error-code">Código: {error.code}</div>
          )}
        </div>
      ))}
    </div>
  )
}

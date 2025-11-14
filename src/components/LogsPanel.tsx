/**
 * COMPONENTE LOGS PANEL
 * Panel de logs del módulo con exportación a .txt
 */

import React from 'react'
import { logger } from '@/utils/logger'
import { LogLevel } from '@/types/logs'
import { X, Download, Trash2 } from 'lucide-react'

interface LogsPanelProps {
  moduleId: string
  moduleName: string
  isOpen: boolean
  onClose: () => void
}

export const LogsPanel: React.FC<LogsPanelProps> = ({
  moduleId,
  moduleName,
  isOpen,
  onClose
}) => {
  const [logs, setLogs] = React.useState(logger.getModuleLogs(moduleId))

  React.useEffect(() => {
    if (isOpen) {
      // Actualizar logs cada segundo mientras el panel está abierto
      const interval = setInterval(() => {
        setLogs(logger.getModuleLogs(moduleId))
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isOpen, moduleId])

  if (!isOpen) return null

  const handleDownload = () => {
    logger.downloadLogs(moduleId, moduleName)
  }

  const handleClear = () => {
    if (confirm('¿Seguro que quieres limpiar los logs?')) {
      logger.clearModuleLogs(moduleId)
      setLogs([])
    }
  }

  const getLogLevelColor = (level: LogLevel): string => {
    switch (level) {
      case LogLevel.DEBUG:
        return '#6B7280'
      case LogLevel.INFO:
        return '#3B82F6'
      case LogLevel.WARNING:
        return '#FFA500'
      case LogLevel.ERROR:
        return '#FF4444'
      case LogLevel.FATAL:
        return '#CC0000'
      default:
        return '#6B7280'
    }
  }

  return (
    <div className="logs-panel-overlay">
      <div className="logs-panel">
        {/* Header */}
        <div className="logs-panel-header">
          <div className="logs-panel-header-title">
            <h3>Logs: {moduleName}</h3>
          </div>
          <div className="logs-panel-header-actions">
            <button
              className="logs-panel-button"
              onClick={handleDownload}
              title="Descargar logs como .txt"
            >
              <Download size={18} />
              Descargar
            </button>
            <button
              className="logs-panel-button"
              onClick={handleClear}
              title="Limpiar logs"
            >
              <Trash2 size={18} />
              Limpiar
            </button>
            <button
              className="logs-panel-close"
              onClick={onClose}
              title="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Logs content */}
        <div className="logs-panel-content">
          {logs.length === 0 ? (
            <div className="logs-panel-empty">No hay logs para este módulo</div>
          ) : (
            <div className="logs-panel-entries">
              {logs.map((entry, index) => (
                <div key={index} className="logs-panel-entry">
                  <div className="logs-panel-entry-header">
                    <span
                      className="logs-panel-entry-level"
                      style={{ color: getLogLevelColor(entry.level) }}
                    >
                      [{entry.level}]
                    </span>
                    <span className="logs-panel-entry-time">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="logs-panel-entry-message">{entry.message}</div>
                  {entry.metadata && (
                    <details className="logs-panel-entry-metadata">
                      <summary>Metadata</summary>
                      <pre>{JSON.stringify(entry.metadata, null, 2)}</pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

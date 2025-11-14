/**
 * COMPONENTE MODULEBLOCK
 * Bloque visual del módulo con estados, inputs, outputs y errores
 */

import React, { useState } from 'react'
import { ModuleConfig, ModuleExecutionState, ModuleState } from '@/types/module'
import { getStateConfig } from '@/constants/states'
import { ModuleInfo } from './ModuleInfo'
import { ErrorDisplay } from './ErrorDisplay'
import { LogsPanel } from './LogsPanel'
import { Info, Settings, FileText, Play, MoreVertical } from 'lucide-react'

interface ModuleBlockProps {
  config: ModuleConfig
  executionState: ModuleExecutionState
  onRun?: () => void
  onInputChange?: (inputId: string, value: unknown) => void
  onResetInputs?: () => void
}

export const ModuleBlock: React.FC<ModuleBlockProps> = ({
  config,
  executionState,
  onRun,
  onInputChange,
  onResetInputs
}) => {
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [isLogsOpen, setIsLogsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const stateConfig = getStateConfig(executionState.state)

  const handleInputChange = (inputId: string, value: unknown) => {
    if (onInputChange) {
      onInputChange(inputId, value)
    }
  }

  const canRun =
    executionState.state === ModuleState.IDLE ||
    executionState.state === ModuleState.ERROR ||
    executionState.state === ModuleState.DONE

  return (
    <>
      <div className="module-block" data-state={executionState.state}>
        {/* Header */}
        <div
          className="module-block-header"
          style={{ borderLeftColor: stateConfig.color }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="module-block-header-left">
            {config.icon && <span className="module-block-icon">{config.icon}</span>}
            <h3 className="module-block-title">{config.info.name}</h3>
            <span className="module-block-state-badge" style={{ backgroundColor: stateConfig.bgColor, color: stateConfig.color }}>
              {stateConfig.icon} {stateConfig.label}
            </span>
          </div>

          <div className="module-block-header-right">
            <button
              className="module-block-icon-button"
              onClick={(e) => {
                e.stopPropagation()
                setIsInfoOpen(true)
              }}
              title="Información del módulo"
            >
              <Info size={18} />
            </button>

            <button
              className="module-block-icon-button"
              onClick={(e) => {
                e.stopPropagation()
                setIsLogsOpen(true)
              }}
              title="Ver logs"
            >
              <FileText size={18} />
            </button>

            <button className="module-block-icon-button" title="Configuración">
              <Settings size={18} />
            </button>

            <button className="module-block-icon-button" title="Más opciones">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="module-block-content">
            {/* Error Display */}
            {executionState.errors.length > 0 && (
              <ErrorDisplay
                errors={executionState.errors}
                onTryAgain={onRun}
                onResetInputs={onResetInputs}
                onViewLogs={() => setIsLogsOpen(true)}
                moduleId={executionState.moduleId}
              />
            )}

            {/* Inputs */}
            <div className="module-block-section">
              <h4 className="module-block-section-title">Inputs</h4>
              <div className="module-block-inputs">
                {config.info.inputs.map((input) => (
                  <div key={input.id} className="module-block-input">
                    <label className="module-block-input-label">
                      {input.label}
                      {input.required && <span className="module-block-required">*</span>}
                    </label>
                    {input.type === 'text' && (
                      <input
                        type="text"
                        className="module-block-input-field"
                        placeholder={input.placeholder}
                        value={(executionState.inputs[input.id] as string) || ''}
                        onChange={(e) => handleInputChange(input.id, e.target.value)}
                        disabled={executionState.state === ModuleState.RUNNING}
                      />
                    )}
                    {input.type === 'number' && (
                      <input
                        type="number"
                        className="module-block-input-field"
                        placeholder={input.placeholder}
                        value={(executionState.inputs[input.id] as number) || ''}
                        onChange={(e) => handleInputChange(input.id, parseFloat(e.target.value))}
                        disabled={executionState.state === ModuleState.RUNNING}
                      />
                    )}
                    {input.type === 'boolean' && (
                      <label className="module-block-input-checkbox">
                        <input
                          type="checkbox"
                          checked={(executionState.inputs[input.id] as boolean) || false}
                          onChange={(e) => handleInputChange(input.id, e.target.checked)}
                          disabled={executionState.state === ModuleState.RUNNING}
                        />
                        <span>{input.description}</span>
                      </label>
                    )}
                    {input.type === 'select' && input.options && (
                      <select
                        className="module-block-input-field"
                        value={(executionState.inputs[input.id] as string) || ''}
                        onChange={(e) => handleInputChange(input.id, e.target.value)}
                        disabled={executionState.state === ModuleState.RUNNING}
                      >
                        <option value="">Seleccionar...</option>
                        {input.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                    {input.description && (
                      <div className="module-block-input-description">{input.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Outputs */}
            {Object.keys(executionState.outputs).length > 0 && (
              <div className="module-block-section">
                <h4 className="module-block-section-title">Outputs</h4>
                <div className="module-block-outputs">
                  {config.info.outputs.map((output) => (
                    <div key={output.id} className="module-block-output">
                      <div className="module-block-output-label">{output.label}</div>
                      <div className="module-block-output-value">
                        {executionState.outputs[output.id] !== undefined ? (
                          <pre>{JSON.stringify(executionState.outputs[output.id], null, 2)}</pre>
                        ) : (
                          <span className="module-block-output-empty">Sin datos</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="module-block-actions">
              <button
                className="module-block-button module-block-button-primary"
                onClick={onRun}
                disabled={!canRun}
              >
                <Play size={16} />
                {executionState.state === ModuleState.RUNNING ? 'Ejecutando...' : 'Ejecutar'}
              </button>

              {executionState.state === ModuleState.ERROR && onResetInputs && (
                <button
                  className="module-block-button module-block-button-secondary"
                  onClick={onResetInputs}
                >
                  Resetear Inputs
                </button>
              )}
            </div>

            {/* Progress */}
            {executionState.state === ModuleState.RUNNING && executionState.progress !== undefined && (
              <div className="module-block-progress">
                <div className="module-block-progress-bar">
                  <div
                    className="module-block-progress-fill"
                    style={{ width: `${executionState.progress}%` }}
                  />
                </div>
                <div className="module-block-progress-text">{executionState.progress}%</div>
              </div>
            )}
          </div>
        )}

        {/* Connectors */}
        <div className="module-block-connector module-block-connector-input" title="Input" />
        <div className="module-block-connector module-block-connector-output" title="Output" />
      </div>

      {/* Modals */}
      <ModuleInfo
        info={config.info}
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />

      <LogsPanel
        moduleId={executionState.moduleId}
        moduleName={config.info.name}
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
      />
    </>
  )
}

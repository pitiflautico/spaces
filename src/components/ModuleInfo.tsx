/**
 * COMPONENTE MODULEINFO
 * Panel de información del módulo con plantilla universal (A-K)
 */

import React from 'react'
import { ModuleInfo as ModuleInfoType } from '@/types/module'
import { X, Info, Clock, AlertCircle, Lightbulb, Link2 } from 'lucide-react'

interface ModuleInfoProps {
  info: ModuleInfoType
  isOpen: boolean
  onClose: () => void
}

export const ModuleInfo: React.FC<ModuleInfoProps> = ({ info, isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="module-info-overlay">
      <div className="module-info-panel">
        {/* Header */}
        <div className="module-info-header">
          <div className="module-info-header-title">
            <Info size={24} />
            <h2>Información del Módulo</h2>
          </div>
          <button onClick={onClose} className="module-info-close">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="module-info-content">
          {/* APARTADO A - Nombre del módulo */}
          <section className="module-info-section">
            <h1 className="module-name">{info.name}</h1>
          </section>

          {/* APARTADO B - Descripción corta */}
          <section className="module-info-section">
            <p className="module-short-desc">{info.shortDescription}</p>
          </section>

          {/* APARTADO C - Descripción extendida */}
          <section className="module-info-section">
            <h3>Descripción</h3>
            <p className="module-extended-desc">{info.extendedDescription}</p>
          </section>

          {/* APARTADO D - ¿Cuándo usar este módulo? */}
          <section className="module-info-section">
            <h3>
              <AlertCircle size={18} />
              ¿Cuándo usar este módulo?
            </h3>
            <ul className="module-list">
              {info.whenToUse.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* APARTADO E - Inputs necesarios */}
          <section className="module-info-section">
            <h3>Inputs Necesarios</h3>
            <div className="module-inputs-list">
              {info.inputs.map((input) => (
                <div key={input.id} className="module-io-item">
                  <div className="module-io-header">
                    <span className="module-io-label">{input.label}</span>
                    {input.required && <span className="module-io-required">Requerido</span>}
                  </div>
                  <div className="module-io-type">Tipo: {input.type}</div>
                  {input.description && (
                    <div className="module-io-description">{input.description}</div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* APARTADO F - Outputs generados */}
          <section className="module-info-section">
            <h3>Outputs Generados</h3>
            <div className="module-outputs-list">
              {info.outputs.map((output) => (
                <div key={output.id} className="module-io-item">
                  <div className="module-io-header">
                    <span className="module-io-label">{output.label}</span>
                  </div>
                  <div className="module-io-type">Tipo: {output.type}</div>
                  {output.description && (
                    <div className="module-io-description">{output.description}</div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* APARTADO G - Tiempo estimado */}
          <section className="module-info-section">
            <h3>
              <Clock size={18} />
              Tiempo Estimado de Ejecución
            </h3>
            <p className="module-time">{info.estimatedTime}</p>
          </section>

          {/* APARTADO H - Dependencias */}
          <section className="module-info-section">
            <h3>
              <Link2 size={18} />
              Dependencias
            </h3>
            {info.dependencies.length === 0 ? (
              <p className="module-no-dependencies">
                Ninguna - Este módulo puede ejecutarse de forma independiente
              </p>
            ) : (
              <ul className="module-list">
                {info.dependencies.map((dep, index) => (
                  <li key={index}>{dep}</li>
                ))}
              </ul>
            )}
          </section>

          {/* APARTADO I - Errores típicos */}
          <section className="module-info-section">
            <h3>Errores Típicos y Soluciones</h3>
            <div className="module-errors-list">
              {info.commonErrors.map((item, index) => (
                <div key={index} className="module-error-item">
                  <div className="module-error-name">
                    <AlertCircle size={16} />
                    {item.error}
                  </div>
                  <div className="module-error-solution">→ {item.solution}</div>
                </div>
              ))}
            </div>
          </section>

          {/* APARTADO J - Consejos de uso */}
          <section className="module-info-section">
            <h3>
              <Lightbulb size={18} />
              Consejos de Uso
            </h3>
            <ul className="module-list module-tips-list">
              {info.tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </section>

          {/* APARTADO K - Ejemplo visual */}
          {info.example && (
            <section className="module-info-section">
              <h3>Ejemplo Visual</h3>
              <div className="module-example">
                <div className="module-example-block">
                  <div className="module-example-label">Input:</div>
                  <pre className="module-example-code">
                    {JSON.stringify(info.example.input, null, 2)}
                  </pre>
                </div>
                <div className="module-example-arrow">→</div>
                <div className="module-example-block">
                  <div className="module-example-label">Output:</div>
                  <pre className="module-example-code">
                    {JSON.stringify(info.example.output, null, 2)}
                  </pre>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * COMPONENTE PRINCIPAL DE LA APLICACIÓN
 * Canvas con módulos según especificación
 */

import React, { useState } from 'react'
import { ModuleBlock } from './components/ModuleBlock'
import { ModuleExecutionState, ModuleState } from './types/module'
import { module1Config } from './modules/module1-config'
import { executeModule1 } from './modules/module1-executor'
import './App.css'

function App() {
  const [module1State, setModule1State] = useState<ModuleExecutionState>({
    moduleId: module1Config.id,
    state: ModuleState.IDLE,
    inputs: {},
    outputs: {},
    errors: [],
    logs: []
  })

  const handleInputChange = (inputId: string, value: unknown) => {
    setModule1State((prev) => ({
      ...prev,
      inputs: {
        ...prev.inputs,
        [inputId]: value
      }
    }))
  }

  const handleRun = async () => {
    await executeModule1(module1State, (updates) => {
      setModule1State((prev) => ({
        ...prev,
        ...updates
      }))
    })
  }

  const handleResetInputs = () => {
    setModule1State((prev) => ({
      ...prev,
      inputs: {},
      errors: [],
      state: ModuleState.IDLE
    }))
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-header-left">
          <h1 className="app-title">App Marketing Spaces</h1>
          <span className="app-subtitle">Protocolo Global de Errores + Info de Módulos</span>
        </div>
        <div className="app-header-right">
          <div className="app-version">v1.0.0</div>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="app-canvas">
        <div className="app-canvas-grid">
          {/* Módulo 1 */}
          <div className="app-canvas-item">
            <ModuleBlock
              config={module1Config}
              executionState={module1State}
              onRun={handleRun}
              onInputChange={handleInputChange}
              onResetInputs={handleResetInputs}
            />
          </div>

          {/* Placeholder para futuros módulos */}
          <div className="app-canvas-placeholder">
            <div className="app-canvas-placeholder-content">
              <div className="app-canvas-placeholder-icon">+</div>
              <div className="app-canvas-placeholder-text">Módulo 2</div>
              <div className="app-canvas-placeholder-desc">AIE Module</div>
            </div>
          </div>

          <div className="app-canvas-placeholder">
            <div className="app-canvas-placeholder-content">
              <div className="app-canvas-placeholder-icon">+</div>
              <div className="app-canvas-placeholder-text">Módulo 3</div>
              <div className="app-canvas-placeholder-desc">Branding Module</div>
            </div>
          </div>

          <div className="app-canvas-placeholder">
            <div className="app-canvas-placeholder-content">
              <div className="app-canvas-placeholder-icon">+</div>
              <div className="app-canvas-placeholder-text">Módulo 4</div>
              <div className="app-canvas-placeholder-desc">Marketing Pack</div>
            </div>
          </div>

          <div className="app-canvas-placeholder">
            <div className="app-canvas-placeholder-content">
              <div className="app-canvas-placeholder-icon">+</div>
              <div className="app-canvas-placeholder-text">Módulo 5</div>
              <div className="app-canvas-placeholder-desc">Patch Engine</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="app-footer-content">
          <div className="app-footer-section">
            <strong>Estados:</strong>
            <span className="app-footer-badge" style={{ backgroundColor: '#374151' }}>○ Idle</span>
            <span className="app-footer-badge" style={{ backgroundColor: '#1E3A8A' }}>⟳ Running</span>
            <span className="app-footer-badge" style={{ backgroundColor: '#92400E' }}>⚠ Warning</span>
            <span className="app-footer-badge" style={{ backgroundColor: '#7F1D1D' }}>✕ Error</span>
            <span className="app-footer-badge" style={{ backgroundColor: '#450A0A' }}>⊗ Fatal</span>
            <span className="app-footer-badge" style={{ backgroundColor: '#065F46' }}>✓ Done</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

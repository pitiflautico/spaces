'use client';

import React, { useState, useRef, ReactNode } from 'react';
import { useSpaceStore } from '@/lib/store';
import type { Module, Position, ModulePort } from '@/types';
import {
  PlayIcon,
  Cog6ToothIcon,
  Square2StackIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { getDataTypeIcon, getDataTypeColor } from '@/lib/data-type-icons';

interface ModuleWrapperProps {
  module: Module;
  children: ReactNode;
  onRun?: () => void;
  icon?: ReactNode;
  hasSettings?: boolean; // Solo mostrar settings si el módulo necesita configuración
}

/**
 * ModuleWrapper - Componente base para todos los módulos
 *
 * Proporciona:
 * - Header con título y botón de duplicar
 * - Puertos de entrada (izquierda) y salida (derecha) con drag & drop
 * - Botón Play en esquina inferior derecha
 * - Botón Settings en esquina inferior izquierda
 * - Estados visuales (idle, running, done, error, etc.)
 * - Sistema de dragging
 *
 * Uso:
 * <ModuleWrapper module={module} onRun={handleRun}>
 *   <div>Contenido específico del módulo</div>
 * </ModuleWrapper>
 */
export default function ModuleWrapper({ module, children, onRun, icon, hasSettings = false }: ModuleWrapperProps) {
  const {
    updateModule,
    deleteModule,
    duplicateModule,
    setSelectedModule,
    selectedModuleId,
    startConnectionDrag,
    endConnectionDrag,
    connectionDragState,
    validateConnection,
    addConnection,
  } = useSpaceStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [hoveredPort, setHoveredPort] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const moduleContentRef = useRef<HTMLDivElement>(null);

  const isSelected = selectedModuleId === module.id;

  // Track actual DOM height and update store when it changes
  React.useEffect(() => {
    if (!moduleContentRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newHeight = entry.contentRect.height;
        // Only update if height changed significantly (avoid infinite loops)
        if (Math.abs(newHeight - module.size.height) > 2) {
          updateModule(module.id, {
            size: { ...module.size, height: newHeight }
          });
        }
      }
    });

    resizeObserver.observe(moduleContentRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [module.id, module.size, updateModule]);

  // Auto-reset stuck modules (after 5 minutes)
  React.useEffect(() => {
    if (module.status === 'running') {
      const timeout = setTimeout(() => {
        console.warn(`Module ${module.id} stuck in running state for 5 minutes, auto-resetting`);
        updateModule(module.id, {
          status: 'error',
          errorMessage: 'Module timeout - execution took too long. Please try again.'
        });
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearTimeout(timeout);
    }
  }, [module.status, module.id, updateModule]);

  // Update module height when content changes (for accurate port positioning)
  React.useEffect(() => {
    if (!wrapperRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newHeight = entry.contentRect.height;
        // Only update if height changed significantly (more than 10px)
        if (Math.abs(newHeight - module.size.height) > 10) {
          updateModule(module.id, {
            size: { ...module.size, height: newHeight }
          });
        }
      }
    });

    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [module.id, module.size, updateModule]);

  // Dragging del módulo completo
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.module-content')) {
      return; // No drag si click en contenido
    }
    if ((e.target as HTMLElement).closest('.port')) {
      return; // No drag si click en puerto
    }
    if ((e.target as HTMLElement).closest('button')) {
      return; // No drag si click en botón
    }

    e.stopPropagation();
    setSelectedModule(module.id);
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - module.position.x,
      y: e.clientY - module.position.y,
    });
  };

  React.useEffect(() => {
    if (!isDragging) return;

    let rafId: number;
    let lastX = module.position.x;
    let lastY = module.position.y;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Only update if position changed significantly (throttle)
      if (Math.abs(newX - lastX) > 1 || Math.abs(newY - lastY) > 1) {
        if (rafId) cancelAnimationFrame(rafId);

        rafId = requestAnimationFrame(() => {
          updateModule(module.id, {
            position: { x: newX, y: newY },
          });
          lastX = newX;
          lastY = newY;
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (rafId) cancelAnimationFrame(rafId);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isDragging, dragOffset, module.id, updateModule, module.position.x, module.position.y]);

  // Port handlers
  const handleOutputPortMouseDown = (e: React.MouseEvent, port: ModulePort) => {
    e.stopPropagation();
    if (!port.dataType) return;

    startConnectionDrag(module.id, port.id, port.dataType, { x: e.clientX, y: e.clientY });
  };

  const handleInputPortMouseUp = (e: React.MouseEvent, port: ModulePort) => {
    e.stopPropagation();
    if (!connectionDragState.isDragging) return;

    const validation = validateConnection(
      connectionDragState.sourceModuleId!,
      connectionDragState.sourcePortId!,
      module.id,
      port.id
    );

    if (validation.valid) {
      addConnection({
        sourceModuleId: connectionDragState.sourceModuleId!,
        sourcePortId: connectionDragState.sourcePortId!,
        targetModuleId: module.id,
        targetPortId: port.id,
        dataType: connectionDragState.sourceDataType!,
      });
    } else {
      if (validation.error) {
        alert(validation.error.message);
      }
    }

    endConnectionDrag();
  };

  const handleInputPortMouseEnter = (port: ModulePort) => {
    if (!connectionDragState.isDragging) return;
    const sourceDataType = connectionDragState.sourceDataType;
    if (sourceDataType && port.acceptedTypes?.includes(sourceDataType)) {
      setHoveredPort(port.id);
    }
  };

  const handleInputPortMouseLeave = () => {
    setHoveredPort(null);
  };

  // Duplicate handler
  const handleDuplicate = () => {
    duplicateModule(module.id);
  };

  // Estados visuales
  const getBorderColor = () => {
    switch (module.status) {
      case 'running':
        return 'border-blue-500';
      case 'done':
        return 'border-green-500';
      case 'error':
        return 'border-red-500';
      case 'warning':
        return 'border-yellow-500';
      case 'fatal_error':
        return 'border-red-700';
      case 'invalid':
        return 'border-gray-400 border-dashed';
      default:
        return isSelected ? 'border-blue-500' : 'border-dark-border';
    }
  };

  return (
    <div
      ref={wrapperRef}
      className="absolute"
      style={{
        left: module.position.x,
        top: module.position.y,
        width: module.size.width,
        minHeight: module.size.height,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Wrapper con posición relativa para los puertos */}
      <div className="relative w-full h-full" data-module-id={module.id}>
        {/* Módulo interior */}
        <div
          ref={moduleContentRef}
          className={`w-full h-full bg-dark-sidebar rounded-2xl shadow-2xl transition-all ${getBorderColor()} ${
            isDragging ? 'cursor-grabbing shadow-blue-500/20' : 'cursor-grab'
          }`}
          style={{
            border: isSelected ? '2px solid #3B82F6' : '2px solid #3A3A3A',
            minHeight: module.size.height,
          }}
        >
          {/* Header con título e iconos de inputs aceptados */}
          <div className="relative px-5 py-3 flex items-center gap-3">
            {/* Icon del módulo */}
            {icon && <div className="flex-shrink-0">{icon}</div>}

            {/* Título */}
            <h3 className="text-white font-medium text-sm flex-1">{module.name}</h3>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              {/* Duplicate button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDuplicate();
                }}
                className="p-1.5 hover:bg-dark-card rounded-lg transition-colors group"
                title="Duplicate module"
              >
                <Square2StackIcon className="w-4 h-4 text-gray-500 group-hover:text-blue-400" />
              </button>

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`¿Eliminar "${module.name}"?`)) {
                    deleteModule(module.id);
                  }
                }}
                className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors group"
                title="Delete module"
              >
                <TrashIcon className="w-4 h-4 text-gray-500 group-hover:text-red-400" />
              </button>
            </div>

            {/* Status Badge */}
            {module.status === 'done' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 border border-green-500/40 rounded-full">
                <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs font-semibold text-green-400">Done</span>
              </div>
            )}
            {module.status === 'running' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 border border-blue-500/40 rounded-full">
                <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold text-blue-400">Running</span>
              </div>
            )}
            {module.status === 'error' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 border border-red-500/40 rounded-full">
                <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-semibold text-red-400">Error</span>
              </div>
            )}

            {/* Input types badges (si tiene inputs) */}
            {module.ports.input.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-dark-card/50 rounded-full border border-dark-border">
                {module.ports.input.map((port, index) => {
                  const Icon = getDataTypeIcon(port.acceptedTypes?.[0]);
                  return (
                    <div key={port.id} className="flex items-center" title={`Accepts: ${port.label}`}>
                      <Icon className="w-3.5 h-3.5 text-gray-400" />
                      {index < module.ports.input.length - 1 && (
                        <span className="mx-0.5 text-gray-600">·</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Contenido del módulo */}
          <div className="module-content px-5 pb-16">
            {children}

            {/* Error message display */}
            {module.status === 'error' && module.errorMessage && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-red-400 mb-1">Error</h4>
                    <p className="text-xs text-red-300 whitespace-pre-wrap">{module.errorMessage}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer con botones Play y Settings (condicionales) */}
          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-none">
            {/* Left side buttons */}
            <div className="flex gap-2">
              {/* Settings button - solo si el módulo tiene configuración */}
              {hasSettings && (
                <button
                  className="pointer-events-auto w-10 h-10 flex items-center justify-center rounded-full bg-dark-card/80 hover:bg-dark-card text-gray-400 hover:text-white transition-all"
                  title="Module settings"
                >
                  <Cog6ToothIcon className="w-5 h-5" />
                </button>
              )}

              {/* Force Reset button - solo si está bloqueado en running */}
              {module.status === 'running' && (
                <button
                  onClick={() => {
                    if (confirm('Reset this module? This will stop any running process.')) {
                      updateModule(module.id, { status: 'idle' });
                    }
                  }}
                  className="pointer-events-auto w-10 h-10 flex items-center justify-center rounded-full bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-400 hover:text-yellow-300 transition-all"
                  title="Force reset - Module stuck in running state"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Play button - SIEMPRE visible para poder re-ejecutar */}
            {onRun && (
              <button
                onClick={onRun}
                disabled={module.status === 'running'}
                className={`pointer-events-auto w-12 h-12 flex items-center justify-center rounded-full transition-all shadow-lg hover:shadow-xl ${
                  module.status === 'done'
                    ? 'bg-green-500 hover:bg-green-600 text-white ring-2 ring-green-400/50'
                    : module.status === 'error'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50`}
                title={
                  module.status === 'done'
                    ? '✓ Completed - Click to re-run'
                    : module.status === 'error'
                    ? '✗ Error - Click to retry'
                    : module.status === 'running'
                    ? 'Running...'
                    : 'Run module'
                }
              >
                {module.status === 'done' ? (
                  // Checkmark icon
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : module.status === 'error' ? (
                  // Retry/refresh icon
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : module.status === 'running' ? (
                  // Spinning loader
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  // Play icon
                  <PlayIcon className="w-6 h-6" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Puertos de ENTRADA (Izquierda) - FUERA del módulo interior */}
        {module.ports.input.map((port, index) => {
          const Icon = getDataTypeIcon(port.acceptedTypes?.[0]);
          const colorClass = getDataTypeColor(port.acceptedTypes?.[0]);
          const portTop =
            module.ports.input.length === 1
              ? '50%'
              : `${((index + 1) / (module.ports.input.length + 1)) * 100}%`;

          const isCompatible = connectionDragState.isDragging &&
                             port.acceptedTypes?.includes(connectionDragState.sourceDataType!);
          const isIncompatible = connectionDragState.isDragging && !isCompatible;
          const isHovered = hoveredPort === port.id;

          return (
            <div
              key={port.id}
              className="port absolute z-50 pointer-events-auto"
              data-port-id={port.id}
              style={{
                top: portTop,
                left: '-40px', // 40px FUERA del borde izquierdo
                transform: 'translateY(-50%)'
              }}
              onMouseUp={(e) => handleInputPortMouseUp(e, port)}
              onMouseEnter={() => handleInputPortMouseEnter(port)}
              onMouseLeave={handleInputPortMouseLeave}
              title={`Input: ${port.label}\nAccepts: ${port.acceptedTypes?.join(', ') || 'unknown'}`}
            >
              <div
                className={`w-14 h-14 ${colorClass} rounded-full border-3 transition-all flex items-center justify-center shadow-2xl ${
                  isCompatible
                    ? 'ring-4 ring-green-400 scale-125 border-green-400 animate-pulse cursor-pointer'
                    : isIncompatible
                    ? 'opacity-30 grayscale cursor-not-allowed'
                    : 'border-dark-bg cursor-pointer hover:scale-110'
                } ${isHovered && isCompatible ? 'scale-150' : ''}`}
                style={{ borderWidth: '3px' }}
              >
                <Icon className="w-7 h-7 text-white" />
              </div>
            </div>
          );
        })}

        {/* Puertos de SALIDA (Derecha) - FUERA del módulo interior */}
        {module.ports.output.map((port, index) => {
          const Icon = getDataTypeIcon(port.dataType);
          const colorClass = getDataTypeColor(port.dataType);
          const portTop =
            module.ports.output.length === 1
              ? '50%'
              : `${((index + 1) / (module.ports.output.length + 1)) * 100}%`;

          return (
            <div
              key={port.id}
              className="port absolute z-50 pointer-events-auto"
              data-port-id={port.id}
              style={{
                top: portTop,
                right: '-40px', // 40px FUERA del borde derecho
                transform: 'translateY(-50%)'
              }}
              onMouseDown={(e) => handleOutputPortMouseDown(e, port)}
              title={`Output: ${port.label}\nType: ${port.dataType || 'unknown'}`}
            >
              <div
                className={`w-14 h-14 ${colorClass} rounded-full border-dark-bg hover:scale-125 active:scale-110 transition-all cursor-grab flex items-center justify-center shadow-2xl hover:shadow-2xl`}
                style={{ borderWidth: '3px' }}
              >
                <Icon className="w-7 h-7 text-white" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

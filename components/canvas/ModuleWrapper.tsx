'use client';

import React, { useState, useRef, ReactNode } from 'react';
import { useSpaceStore } from '@/lib/store';
import type { Module, Position, ModulePort } from '@/types';
import {
  PlayIcon,
  Cog6ToothIcon,
  Square2StackIcon,
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

  const isSelected = selectedModuleId === module.id;

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

    const handleMouseMove = (e: MouseEvent) => {
      updateModule(module.id, {
        position: {
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        },
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, module.id, updateModule]);

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
      className={`absolute bg-dark-sidebar rounded-2xl shadow-2xl transition-all ${getBorderColor()} ${
        isDragging ? 'cursor-grabbing shadow-blue-500/20' : 'cursor-grab'
      }`}
      style={{
        left: module.position.x,
        top: module.position.y,
        width: module.size.width,
        minHeight: module.size.height,
        border: isSelected ? '2px solid #3B82F6' : '2px solid #3A3A3A',
        overflow: 'visible',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header con título e iconos de inputs aceptados */}
      <div className="relative px-5 py-3 flex items-center gap-3">
        {/* Icon del módulo */}
        {icon && <div className="flex-shrink-0">{icon}</div>}

        {/* Título */}
        <h3 className="text-white font-medium text-sm flex-1">{module.name}</h3>

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

      {/* Puertos de ENTRADA (Izquierda) */}
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
            className="port absolute -left-4 z-50"
            style={{ top: portTop, transform: 'translateY(-50%)' }}
            onMouseUp={(e) => handleInputPortMouseUp(e, port)}
            onMouseEnter={() => handleInputPortMouseEnter(port)}
            onMouseLeave={handleInputPortMouseLeave}
            title={`Input: ${port.label}\nAccepts: ${port.acceptedTypes?.join(', ') || 'unknown'}`}
          >
            <div
              className={`w-10 h-10 ${colorClass} rounded-full border-2 transition-all flex items-center justify-center shadow-xl ${
                isCompatible
                  ? 'ring-4 ring-green-400 scale-125 border-green-400 animate-pulse cursor-pointer'
                  : isIncompatible
                  ? 'opacity-30 grayscale cursor-not-allowed'
                  : 'border-dark-bg cursor-pointer hover:scale-110'
              } ${isHovered && isCompatible ? 'scale-150' : ''}`}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>
          </div>
        );
      })}

      {/* Puertos de SALIDA (Derecha) */}
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
            className="port absolute -right-4 z-50"
            style={{ top: portTop, transform: 'translateY(-50%)' }}
            onMouseDown={(e) => handleOutputPortMouseDown(e, port)}
            title={`Output: ${port.label}\nType: ${port.dataType || 'unknown'}`}
          >
            <div
              className={`w-10 h-10 ${colorClass} rounded-full border-2 border-dark-bg hover:scale-125 active:scale-110 transition-all cursor-grab flex items-center justify-center shadow-xl hover:shadow-2xl`}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>
          </div>
        );
      })}

      {/* Contenido del módulo */}
      <div className="module-content px-5 pb-16">{children}</div>

      {/* Footer con botones Play y Settings (condicionales) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-none">
        {/* Settings button - solo si el módulo tiene configuración */}
        {hasSettings ? (
          <button
            className="pointer-events-auto w-10 h-10 flex items-center justify-center rounded-full bg-dark-card/80 hover:bg-dark-card text-gray-400 hover:text-white transition-all"
            title="Module settings"
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </button>
        ) : (
          <div /> /* Spacer para mantener el play button a la derecha */
        )}

        {/* Play button - ocultar cuando ya está done */}
        {onRun && module.status !== 'done' && (
          <button
            onClick={onRun}
            disabled={module.status === 'running'}
            className="pointer-events-auto w-12 h-12 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
            title="Run module"
          >
            <PlayIcon className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}

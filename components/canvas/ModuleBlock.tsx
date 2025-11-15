'use client';

import React, { useState, useRef } from 'react';
import { useSpaceStore } from '@/lib/store';
import type { Module, Position, ModulePort } from '@/types';
import { DataType } from '@/types';
import {
  PlayIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import LocalProjectAnalysisModule from '@/components/modules/LocalProjectAnalysisModule';
import { getDataTypeIcon, getDataTypeColor } from '@/lib/data-type-icons';

interface ModuleBlockProps {
  module: Module;
}

export default function ModuleBlock({ module }: ModuleBlockProps) {
  const {
    updateModule,
    deleteModule,
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
  const blockRef = useRef<HTMLDivElement>(null);

  const isSelected = selectedModuleId === module.id;

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.module-content')) {
      return; // Don't start dragging if clicking inside module content
    }

    e.stopPropagation();
    setIsDragging(true);
    setSelectedModule(module.id);

    const rect = blockRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newPosition: Position = {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    };

    updateModule(module.id, { position: newPosition });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const handleRun = async () => {
    updateModule(module.id, { status: 'running' });

    try {
      if (module.type === 'local-project-analysis') {
        // Call the local analysis API
        const response = await fetch('/api/local-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            localProjectPath: module.inputs.localProjectPath,
            includeHiddenFiles: module.inputs.includeHiddenFiles || false,
            includeNodeModules: module.inputs.includeNodeModules || false,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Analysis failed');
        }

        // Update module with outputs
        updateModule(module.id, {
          status: 'done',
          outputs: {
            repositoryMetadata: data.repositoryMetadata,
            fileContents: data.fileContents,
            repoStructure: data.repoStructure,
            analysisLog: data.analysisLog,
          },
        });
      } else {
        // Simulate processing for other modules
        setTimeout(() => {
          updateModule(module.id, { status: 'done' });
        }, 2000);
      }
    } catch (error: any) {
      console.error('Module execution error:', error);
      updateModule(module.id, { status: 'error' });
      alert(`Error: ${error.message}`);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this module?')) {
      deleteModule(module.id);
    }
  };

  const getStatusColor = () => {
    switch (module.status) {
      case 'running':
        return 'text-blue-500 bg-blue-500/10';
      case 'done':
        return 'text-green-500 bg-green-500/10';
      case 'error':
        return 'text-red-500 bg-red-500/10';
      case 'warning':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'fatal_error':
        return 'text-red-700 bg-red-700/20';
      case 'invalid':
        return 'text-gray-400 bg-gray-400/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getStatusText = () => {
    switch (module.status) {
      case 'running':
        return 'Running...';
      case 'done':
        return 'Completed';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'fatal_error':
        return 'Fatal Error';
      case 'invalid':
        return 'Invalid';
      default:
        return 'Idle';
    }
  };

  // Port drag handlers (A2)
  const handleOutputPortMouseDown = (e: React.MouseEvent, port: ModulePort) => {
    e.stopPropagation();
    if (!port.dataType) return;

    const rect = blockRef.current?.getBoundingClientRect();
    if (!rect) return;

    startConnectionDrag(
      module.id,
      port.id,
      port.dataType,
      { x: e.clientX, y: e.clientY }
    );
  };

  const handleInputPortMouseUp = (e: React.MouseEvent, port: ModulePort) => {
    e.stopPropagation();

    if (!connectionDragState.isDragging) return;

    // Validate connection
    const validation = validateConnection(
      connectionDragState.sourceModuleId!,
      connectionDragState.sourcePortId!,
      module.id,
      port.id
    );

    if (validation.valid) {
      // Create connection
      addConnection({
        sourceModuleId: connectionDragState.sourceModuleId!,
        sourcePortId: connectionDragState.sourcePortId!,
        targetModuleId: module.id,
        targetPortId: port.id,
        dataType: connectionDragState.sourceDataType!,
      });
    } else {
      // Show error
      if (validation.error) {
        alert(validation.error.message);
      }
    }

    endConnectionDrag();
  };

  const handleInputPortMouseEnter = (port: ModulePort) => {
    if (!connectionDragState.isDragging) return;

    // Check if this port is compatible
    const sourceDataType = connectionDragState.sourceDataType;
    if (sourceDataType && port.acceptedTypes?.includes(sourceDataType)) {
      setHoveredPort(port.id);
    }
  };

  const handleInputPortMouseLeave = () => {
    setHoveredPort(null);
  };

  return (
    <div
      ref={blockRef}
      className={`absolute bg-[#1A1A1A] border-2 rounded-xl shadow-2xl overflow-hidden transition-all pointer-events-auto ${
        isSelected ? 'border-blue-500 shadow-blue-500/20' : 'border-[#2A2A2A]'
      } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: module.position.x,
        top: module.position.y,
        width: module.size.width,
        minHeight: module.size.height,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Connection Ports - Input (Left) */}
      {module.ports.input.map((port, index) => {
        const Icon = getDataTypeIcon(port.acceptedTypes?.[0]);
        const isCompatible = hoveredPort === port.id;
        const portTop = module.ports.input.length === 1
          ? '50%'
          : `${((index + 1) / (module.ports.input.length + 1)) * 100}%`;

        return (
          <div
            key={port.id}
            className="absolute left-0 -translate-x-1/2 group"
            style={{ top: portTop, transform: 'translate(-50%, -50%)' }}
            onMouseUp={(e) => handleInputPortMouseUp(e, port)}
            onMouseEnter={() => handleInputPortMouseEnter(port)}
            onMouseLeave={handleInputPortMouseLeave}
            title={`Acepta: ${port.acceptedTypes?.join(', ') || 'any'}`}
          >
            <div
              className={`w-5 h-5 bg-blue-500 rounded-full border-2 border-[#1A1A1A] hover:scale-125 transition-all cursor-pointer flex items-center justify-center ${
                isCompatible ? 'scale-125 ring-2 ring-green-400' : ''
              }`}
            >
              <Icon className="w-3 h-3 text-white" />
            </div>
          </div>
        );
      })}

      {/* Connection Ports - Output (Right) */}
      {module.ports.output.map((port, index) => {
        const Icon = getDataTypeIcon(port.dataType);
        const colorClass = getDataTypeColor(port.dataType);
        const portTop = module.ports.output.length === 1
          ? '50%'
          : `${((index + 1) / (module.ports.output.length + 1)) * 100}%`;

        return (
          <div
            key={port.id}
            className="absolute right-0 translate-x-1/2 group"
            style={{ top: portTop, transform: 'translate(50%, -50%)' }}
            onMouseDown={(e) => handleOutputPortMouseDown(e, port)}
            title={`Tipo: ${port.dataType || 'unknown'}`}
          >
            <div
              className={`w-5 h-5 ${colorClass} rounded-full border-2 border-[#1A1A1A] hover:scale-125 transition-transform cursor-pointer flex items-center justify-center`}
            >
              <Icon className="w-3 h-3 text-white" />
            </div>
          </div>
        );
      })}

      {/* Header */}
      <div className="px-5 py-4 border-b border-[#2A2A2A] bg-gradient-to-r from-[#1A1A1A] to-[#222222]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">📥</span>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">{module.name}</h3>
              <div className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${getStatusColor()}`}>
                {getStatusText()}
              </div>
            </div>
          </div>
          <button
            onClick={handleDelete}
            className="text-gray-500 hover:text-red-500 transition-colors p-1"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Module Content */}
      <div className="module-content p-5">
        {module.type === 'local-project-analysis' && (
          <LocalProjectAnalysisModule module={module} />
        )}
        {module.type !== 'local-project-analysis' && (
          <div className="text-gray-400 text-sm">
            Module type: {module.type}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[#2A2A2A] bg-[#1A1A1A] flex gap-2">
        <button
          onClick={handleRun}
          disabled={module.status === 'running'}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
        >
          <PlayIcon className="w-4 h-4" />
          Run
        </button>
        <button className="px-3 py-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-gray-400 rounded-lg transition-colors">
          <DocumentTextIcon className="w-4 h-4" />
        </button>
        <button className="px-3 py-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-gray-400 rounded-lg transition-colors">
          <Cog6ToothIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useRef } from 'react';
import { useSpaceStore } from '@/lib/store';
import type { Module, Position } from '@/types';
import {
  PlayIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  TrashIcon,
  InformationCircleIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import LocalProjectAnalysisModule from '@/components/modules/LocalProjectAnalysisModule';
import ModuleInfoPanel from './ModuleInfoPanel';
import ModuleLogsPanel from './ModuleLogsPanel';
import type { DataType } from '@/types';

interface ModuleBlockProps {
  module: Module;
}

const getDataTypeIcon = (type: DataType): string => {
  switch (type) {
    case 'image':
      return '🖼️';
    case 'text':
      return '📄';
    case 'json':
      return '{ }';
    case 'audio':
      return '🔊';
    case 'video':
      return '🎬';
    case 'mixed':
      return '🔗';
    default:
      return '📦';
  }
};

const getDataTypeColor = (type: DataType): string => {
  switch (type) {
    case 'image':
      return 'bg-purple-500';
    case 'text':
      return 'bg-blue-500';
    case 'json':
      return 'bg-green-500';
    case 'audio':
      return 'bg-yellow-500';
    case 'video':
      return 'bg-red-500';
    case 'mixed':
      return 'bg-gradient-to-r from-purple-500 to-blue-500';
    default:
      return 'bg-gray-500';
  }
};

export default function ModuleBlock({ module }: ModuleBlockProps) {
  const { updateModule, deleteModule, setSelectedModule, selectedModuleId, resetModule, resetFromModule } = useSpaceStore();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [showInfo, setShowInfo] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
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

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Resetear este módulo? Esto borrará sus outputs y logs.')) {
      resetModule(module.id);
    }
  };

  const handleResetFrom = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Resetear desde este módulo? Esto reseteará este módulo y todos los que dependen de él.')) {
      resetFromModule(module.id);
    }
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement duplicate functionality
    alert('Duplicate functionality coming soon!');
  };

  const handleInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInfo(!showInfo);
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
        return 'text-orange-500 bg-orange-500/10';
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
        return 'border-dashed border-gray-500';
      default:
        return 'border-[#2A2A2A]';
    }
  };

  return (
    <div
      ref={blockRef}
      className={`absolute bg-[#1A1A1A] border-2 rounded-xl shadow-2xl overflow-hidden transition-all pointer-events-auto ${
        isSelected ? 'border-blue-500 shadow-blue-500/20' : getBorderColor()
      } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${
        module.status === 'running' ? 'animate-pulse' : ''
      }`}
      style={{
        left: module.position.x,
        top: module.position.y,
        width: module.size.width,
        minHeight: module.size.height,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Connection Ports - Input */}
      {module.ports.input.length > 0 && (
        <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-2">
          {module.ports.input.map((port) => (
            <div key={port.id} className="group relative">
              <div
                className={`w-5 h-5 ${getDataTypeColor(port.dataType)} rounded-full border-2 border-[#1A1A1A] hover:scale-125 transition-transform cursor-pointer flex items-center justify-center text-[8px]`}
                title={`${port.label} (${port.dataType})`}
              >
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                  {getDataTypeIcon(port.dataType)}
                </span>
              </div>
              {/* Tooltip */}
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {port.label}
                <div className="text-gray-400">{port.dataType}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connection Ports - Output */}
      {module.ports.output.length > 0 && (
        <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 flex flex-col gap-2">
          {module.ports.output.map((port) => (
            <div key={port.id} className="group relative">
              <div
                className={`w-5 h-5 ${getDataTypeColor(port.dataType)} rounded-full border-2 border-[#1A1A1A] hover:scale-125 transition-transform cursor-pointer flex items-center justify-center text-[8px]`}
                title={`${port.label} (${port.dataType})`}
              >
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                  {getDataTypeIcon(port.dataType)}
                </span>
              </div>
              {/* Tooltip */}
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {port.label}
                <div className="text-gray-400">{port.dataType}</div>
              </div>
            </div>
          ))}
        </div>
      )}

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
          <div className="flex items-center gap-1">
            <button
              onClick={handleInfo}
              className="text-gray-500 hover:text-blue-400 transition-colors p-1"
              title="Ver información del módulo"
            >
              <InformationCircleIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="text-gray-500 hover:text-yellow-400 transition-colors p-1"
              title="Resetear módulo"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="text-gray-500 hover:text-white transition-colors p-1"
                title="Más opciones"
              >
                <EllipsisVerticalIcon className="w-4 h-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg shadow-xl z-50 min-w-[180px]">
                  <button
                    onClick={handleDuplicate}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#3A3A3A] text-gray-300 hover:text-white text-sm transition-colors"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                    Duplicar módulo
                  </button>
                  <button
                    onClick={handleResetFrom}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#3A3A3A] text-gray-300 hover:text-yellow-400 text-sm transition-colors"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    Reset desde aquí
                  </button>
                  <div className="border-t border-[#3A3A3A]" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#3A3A3A] text-gray-300 hover:text-red-500 text-sm transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Eliminar módulo
                  </button>
                </div>
              )}
            </div>
          </div>
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
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowLogs(!showLogs);
          }}
          className={`px-3 py-2 rounded-lg transition-colors relative ${
            showLogs
              ? 'bg-blue-600 text-white'
              : 'bg-[#2A2A2A] hover:bg-[#3A3A3A] text-gray-400'
          }`}
          title="Ver logs"
        >
          <DocumentTextIcon className="w-4 h-4" />
          {module.logs.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
              {module.logs.length}
            </span>
          )}
        </button>
        <button className="px-3 py-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-gray-400 rounded-lg transition-colors">
          <Cog6ToothIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <ModuleInfoPanel moduleType={module.type} onClose={() => setShowInfo(false)} />
      )}

      {/* Logs Panel */}
      {showLogs && <ModuleLogsPanel module={module} onClose={() => setShowLogs(false)} />}
    </div>
  );
}

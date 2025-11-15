'use client';

import React from 'react';
import { useSpaceStore } from '@/lib/store';
import {
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export default function FloatingToolbar() {
  const { executeFlow, pauseFlow, resetFlow, getCurrentSpace } = useSpaceStore();
  const currentSpace = getCurrentSpace();

  if (!currentSpace || currentSpace.modules.length === 0) {
    return null;
  }

  const handlePlayFlow = async () => {
    await executeFlow();
  };

  const handleResetFlow = () => {
    if (confirm('¿Estás seguro de que quieres reiniciar todo el flujo? Esto borrará todos los outputs y logs.')) {
      resetFlow();
    }
  };

  const isFlowRunning = currentSpace.modules.some((m) => m.status === 'running');

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
      <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] rounded-xl shadow-2xl p-2 flex items-center gap-2">
        {/* Play Flow Button */}
        <button
          onClick={handlePlayFlow}
          disabled={isFlowRunning}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-lg hover:shadow-blue-500/50"
          title="Ejecutar flujo completo"
        >
          <PlayIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Play Flow</span>
        </button>

        {/* Separator */}
        <div className="w-px h-6 bg-[#2A2A2A]" />

        {/* Pause Flow Button (Optional) */}
        <button
          onClick={pauseFlow}
          disabled={!isFlowRunning}
          className="p-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] disabled:bg-[#1A1A1A] disabled:cursor-not-allowed text-gray-400 hover:text-white disabled:text-gray-600 rounded-lg transition-colors"
          title="Pausar ejecución"
        >
          <PauseIcon className="w-5 h-5" />
        </button>

        {/* Restart Flow Button */}
        <button
          onClick={handleResetFlow}
          className="p-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-gray-400 hover:text-yellow-500 rounded-lg transition-colors"
          title="Reiniciar flujo completo"
        >
          <ArrowPathIcon className="w-5 h-5" />
        </button>

        {/* Separator */}
        <div className="w-px h-6 bg-[#2A2A2A]" />

        {/* Duplicate (Optional) */}
        <button
          className="p-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-gray-400 hover:text-white rounded-lg transition-colors"
          title="Duplicar selección"
        >
          <DocumentDuplicateIcon className="w-5 h-5" />
        </button>

        {/* Delete (Optional) */}
        <button
          className="p-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-gray-400 hover:text-red-500 rounded-lg transition-colors"
          title="Eliminar selección"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Execution Status */}
      {isFlowRunning && (
        <div className="mt-2 bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-blue-400 text-sm font-medium">Ejecutando flujo...</span>
          </div>
        </div>
      )}
    </div>
  );
}

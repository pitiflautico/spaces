'use client';

import React from 'react';
import { useSpaceStore } from '@/lib/store';
import {
  PlusIcon,
  PlayIcon,
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

export default function FloatingToolbar() {
  const { getCurrentSpace } = useSpaceStore();
  const currentSpace = getCurrentSpace();

  const handlePlayFlow = () => {
    // TODO: Implement topological execution (Task C2)
    console.log('Play Flow - Execute all modules in order');
    alert('Play Flow: Esta funcionalidad ejecutará todos los módulos en orden topológico (Tarea C pendiente)');
  };

  const handleRestartFlow = () => {
    // TODO: Implement reset all (Task C3)
    if (confirm('¿Resetear todos los módulos? Esto borrará todos los outputs y estados.')) {
      console.log('Restart Flow - Reset all modules');
      alert('Restart Flow: Esta funcionalidad reseteará todos los módulos (Tarea E pendiente)');
    }
  };

  const handleUndo = () => {
    console.log('Undo - Previous state');
    alert('Undo: Funcionalidad de historial pendiente');
  };

  const handleRedo = () => {
    console.log('Redo - Next state');
    alert('Redo: Funcionalidad de historial pendiente');
  };

  const handleSettings = () => {
    console.log('Settings - Global settings');
    alert('Settings: Configuración global pendiente');
  };

  return (
    <div className="fixed left-[272px] top-1/2 -translate-y-1/2 z-40 flex flex-col gap-1 bg-[#1A1A1A]/95 backdrop-blur-sm rounded-xl p-1.5 shadow-2xl border border-[#2A2A2A]">
      {/* Add Module */}
      <button
        onClick={() => {
          // This is handled by AddModuleButton component
          const addBtn = document.querySelector('[data-add-module-btn]') as HTMLButtonElement;
          addBtn?.click();
        }}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all hover:scale-105"
        title="Add Module"
      >
        <PlusIcon className="w-5 h-5" />
      </button>

      {/* Separator */}
      <div className="h-px bg-[#2A2A2A] my-0.5" />

      {/* Play Flow */}
      <button
        onClick={handlePlayFlow}
        disabled={!currentSpace || currentSpace.modules.length === 0}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Play Flow (Execute all modules)"
      >
        <PlayIcon className="w-5 h-5" />
      </button>

      {/* Restart Flow */}
      <button
        onClick={handleRestartFlow}
        disabled={!currentSpace || currentSpace.modules.length === 0}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Restart Flow (Reset all)"
      >
        <ArrowPathIcon className="w-5 h-5" />
      </button>

      {/* Separator */}
      <div className="h-px bg-[#2A2A2A] my-0.5" />

      {/* Undo */}
      <button
        onClick={handleUndo}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#0A0A0A] hover:bg-[#2A2A2A] text-gray-400 transition-all hover:scale-105"
        title="Undo"
      >
        <ArrowUturnLeftIcon className="w-5 h-5" />
      </button>

      {/* Redo */}
      <button
        onClick={handleRedo}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#0A0A0A] hover:bg-[#2A2A2A] text-gray-400 transition-all hover:scale-105"
        title="Redo"
      >
        <ArrowUturnRightIcon className="w-5 h-5" />
      </button>

      {/* Separator */}
      <div className="h-px bg-[#2A2A2A] my-0.5" />

      {/* Settings */}
      <button
        onClick={handleSettings}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#0A0A0A] hover:bg-[#2A2A2A] text-gray-400 transition-all hover:scale-105"
        title="Settings"
      >
        <Cog6ToothIcon className="w-5 h-5" />
      </button>
    </div>
  );
}

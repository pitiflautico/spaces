'use client';

import React from 'react';
import { useSpaceStore } from '@/lib/store';
import {
  PlusIcon,
  PlayIcon,
  ArrowPathIcon,
  ClockIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  Cog6ToothIcon,
  PhotoIcon,
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

  const handleHistory = () => {
    console.log('History - Show timeline');
    alert('History: Mostrar timeline de cambios pendiente');
  };

  const handleSettings = () => {
    console.log('Settings - Global settings');
    alert('Settings: Configuración global pendiente');
  };

  const handleTemplates = () => {
    console.log('Templates - Load template');
    alert('Templates: Cargar plantillas pendiente');
  };

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2 bg-dark-sidebar/95 backdrop-blur-sm rounded-2xl p-2 shadow-2xl border border-dark-border">
      {/* Add Module */}
      <button
        onClick={() => {
          // This is handled by AddModuleButton component
          const addBtn = document.querySelector('[data-add-module-btn]') as HTMLButtonElement;
          addBtn?.click();
        }}
        className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all hover:scale-105"
        title="Add Module"
      >
        <PlusIcon className="w-6 h-6" />
      </button>

      {/* Separator */}
      <div className="h-px bg-dark-border my-1" />

      {/* Play Flow */}
      <button
        onClick={handlePlayFlow}
        disabled={!currentSpace || currentSpace.modules.length === 0}
        className="w-12 h-12 flex items-center justify-center rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Play Flow (Execute all modules)"
      >
        <PlayIcon className="w-6 h-6" />
      </button>

      {/* Restart Flow */}
      <button
        onClick={handleRestartFlow}
        disabled={!currentSpace || currentSpace.modules.length === 0}
        className="w-12 h-12 flex items-center justify-center rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Restart Flow (Reset all)"
      >
        <ArrowPathIcon className="w-6 h-6" />
      </button>

      {/* Separator */}
      <div className="h-px bg-dark-border my-1" />

      {/* History/Timeline */}
      <button
        onClick={handleHistory}
        className="w-12 h-12 flex items-center justify-center rounded-xl bg-dark-card hover:bg-dark-hover text-gray-400 transition-all hover:scale-105"
        title="History/Timeline"
      >
        <ClockIcon className="w-6 h-6" />
      </button>

      {/* Undo */}
      <button
        onClick={handleUndo}
        className="w-12 h-12 flex items-center justify-center rounded-xl bg-dark-card hover:bg-dark-hover text-gray-400 transition-all hover:scale-105"
        title="Undo"
      >
        <ArrowUturnLeftIcon className="w-6 h-6" />
      </button>

      {/* Redo */}
      <button
        onClick={handleRedo}
        className="w-12 h-12 flex items-center justify-center rounded-xl bg-dark-card hover:bg-dark-hover text-gray-400 transition-all hover:scale-105"
        title="Redo"
      >
        <ArrowUturnRightIcon className="w-6 h-6" />
      </button>

      {/* Separator */}
      <div className="h-px bg-dark-border my-1" />

      {/* Settings */}
      <button
        onClick={handleSettings}
        className="w-12 h-12 flex items-center justify-center rounded-xl bg-dark-card hover:bg-dark-hover text-gray-400 transition-all hover:scale-105"
        title="Settings"
      >
        <Cog6ToothIcon className="w-6 h-6" />
      </button>

      {/* Templates */}
      <button
        onClick={handleTemplates}
        className="w-12 h-12 flex items-center justify-center rounded-xl bg-dark-card hover:bg-dark-hover text-gray-400 transition-all hover:scale-105"
        title="Templates"
      >
        <PhotoIcon className="w-6 h-6" />
      </button>
    </div>
  );
}

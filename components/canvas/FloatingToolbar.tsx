'use client';

import React, { useState } from 'react';
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
  const { getCurrentSpace, executeFlow, resetAll } = useSpaceStore();
  const currentSpace = getCurrentSpace();

  const handlePlayFlow = async () => {
    // V2.0: Execute modules in topological order
    console.log('Play Flow - Execute all modules in order');
    try {
      await executeFlow();
      console.log('✓ Play Flow execution completed');
    } catch (error: any) {
      console.error('Play Flow error:', error);
      alert(`Play Flow error: ${error.message}`);
    }
  };

  const handleRestartFlow = () => {
    // V2.0: Reset all modules to idle state
    if (confirm('¿Resetear todos los módulos? Esto borrará todos los outputs y estados.')) {
      resetAll();
      console.log('✓ Restart Flow - All modules reset to idle');
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

  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const handleSettings = () => {
    setShowSettingsMenu(!showSettingsMenu);
  };

  const handleDeleteSpace = () => {
    if (!currentSpace) return;

    if (confirm(`¿Seguro que quieres borrar el space "${currentSpace.name}"? Esta acción no se puede deshacer.`)) {
      const { deleteSpace } = useSpaceStore.getState();
      deleteSpace(currentSpace.id);
      setShowSettingsMenu(false);
      console.log(`✓ Space "${currentSpace.name}" deleted`);
    }
  };


  const handleChangePath = () => {
    // This opens the configuration panel to change project path
    const settingsBtn = document.querySelector('[data-open-config]') as HTMLButtonElement;
    settingsBtn?.click();
    setShowSettingsMenu(false);
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
      <div className="relative">
        <button
          onClick={handleSettings}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all hover:scale-105 ${
            showSettingsMenu ? 'bg-[#2A2A2A] text-white' : 'bg-[#0A0A0A] hover:bg-[#2A2A2A] text-gray-400'
          }`}
          title="Settings"
        >
          <Cog6ToothIcon className="w-5 h-5" />
        </button>

        {/* Settings Menu Dropdown */}
        {showSettingsMenu && (
          <div className="absolute left-12 bottom-0 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg shadow-2xl py-1 min-w-[200px] z-50">
            <button
              onClick={handleChangePath}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#2A2A2A] hover:text-white transition-colors"
            >
              Change Save Path
            </button>
            <div className="h-px bg-[#2A2A2A] my-1" />
            <button
              onClick={handleDeleteSpace}
              disabled={!currentSpace}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-[#2A2A2A] hover:text-red-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Delete Space
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

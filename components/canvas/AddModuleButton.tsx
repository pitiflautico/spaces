'use client';

import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import AddModulePanel from './AddModulePanel';

export default function AddModuleButton() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <>
      {/* Floating Add Button */}
      <button
        data-add-module-btn
        onClick={() => setIsPanelOpen(true)}
        className="fixed left-[280px] top-6 z-30 w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
        title="Add module"
      >
        <PlusIcon className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
      </button>

      {/* Add Module Panel */}
      <AddModulePanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </>
  );
}

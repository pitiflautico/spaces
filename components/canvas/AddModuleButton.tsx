'use client';

import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import AddOrFlowPanel from './AddOrFlowPanel';

export default function AddModuleButton() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <>
      {/* Floating Add Button */}
      <button
        data-add-module-btn
        onClick={() => setIsPanelOpen(true)}
        className="fixed left-[280px] top-6 z-30 w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
        title="Add module or start flow"
      >
        <PlusIcon className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
      </button>

      {/* Add or Flow Panel */}
      <AddOrFlowPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </>
  );
}

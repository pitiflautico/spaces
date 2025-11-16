'use client';

import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import FlowWizardPanel from './FlowWizardPanel';

export default function AddModuleButton() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <>
      {/* Floating Add Button - Opens Flow Wizard */}
      <button
        data-add-module-btn
        onClick={() => setIsPanelOpen(true)}
        className="fixed left-[280px] top-6 z-30 w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
        title="Start Guided Flow"
      >
        <PlusIcon className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
      </button>

      {/* Flow Wizard Panel */}
      <FlowWizardPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </>
  );
}

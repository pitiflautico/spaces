'use client';

import React, { useState } from 'react';
import { XMarkIcon, PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';
import AddModulePanel from './AddModulePanel';
import FlowWizardPanel from './FlowWizardPanel';

interface AddOrFlowPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddOrFlowPanel({ isOpen, onClose }: AddOrFlowPanelProps) {
  const [selectedOption, setSelectedOption] = useState<'choice' | 'module' | 'flow'>('choice');

  const handleClose = () => {
    setSelectedOption('choice');
    onClose();
  };

  const handleSelectModule = () => {
    setSelectedOption('module');
  };

  const handleSelectFlow = () => {
    setSelectedOption('flow');
  };

  const handleBack = () => {
    setSelectedOption('choice');
  };

  if (!isOpen) return null;

  // Show specific panels when option is selected
  if (selectedOption === 'module') {
    return <AddModulePanel isOpen={true} onClose={handleClose} />;
  }

  if (selectedOption === 'flow') {
    return <FlowWizardPanel isOpen={true} onClose={handleClose} />;
  }

  // Show choice panel
  return (
    <div className="relative">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-screen w-[450px] bg-[#1A1A1A] border-l border-[#2A2A2A] z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#2A2A2A] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Choose Action</h2>
            <p className="text-xs text-gray-400 mt-1">Add modules or start a guided flow</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="space-y-4">
            {/* Add Individual Module Option */}
            <button
              onClick={handleSelectModule}
              className="w-full p-6 bg-[#0A0A0A] border-2 border-[#2A2A2A] hover:border-blue-500 rounded-xl transition-all group text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <PlusIcon className="w-7 h-7 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    Add Individual Module
                  </h3>
                  <p className="text-sm text-gray-400">
                    Add specific modules one at a time. Customize your workflow by choosing exactly which modules you need and connecting them manually.
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <span>•</span>
                    <span>Full control over module selection</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>•</span>
                    <span>Manual connection setup</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>•</span>
                    <span>Best for custom workflows</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Start Guided Flow Option */}
            <button
              onClick={handleSelectFlow}
              className="w-full p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30 hover:border-blue-500 rounded-xl transition-all group text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                  <SparklesIcon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                      Start Guided Flow
                    </h3>
                    <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-300 font-semibold">
                      RECOMMENDED
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">
                    Step-by-step wizard that guides you through the complete app marketing workflow, from project analysis to App Store upload.
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-blue-300">
                    <span>•</span>
                    <span>Automated module creation & connection</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-300">
                    <span>•</span>
                    <span>Smart flow progression</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-300">
                    <span>•</span>
                    <span>Perfect for complete workflows (7 steps)</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Quick Info */}
            <div className="mt-8 p-4 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg">
              <p className="text-xs text-gray-500 leading-relaxed">
                <span className="font-semibold text-gray-400">Tip:</span> If you're building the complete app marketing flow (from project analysis to App Store), use the <span className="text-blue-400 font-medium">Guided Flow</span>. For specific tasks or custom setups, choose <span className="text-blue-400 font-medium">Individual Modules</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

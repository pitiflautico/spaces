'use client';

import React, { useState } from 'react';
import { useSpaceStore } from '@/lib/store';
import type { ModuleType } from '@/types';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

interface ModuleCategory {
  name: string;
  modules: {
    type: ModuleType;
    name: string;
    description: string;
    icon: string;
  }[];
}

const moduleCategories: ModuleCategory[] = [
  {
    name: 'Project Initialization',
    modules: [
      {
        type: 'local-project-analysis',
        name: 'Local Project Analysis Agent',
        description: 'Analyze local project structure, files, and metadata',
        icon: '🔍',
      },
      {
        type: 'reader-engine',
        name: 'Reader Engine',
        description: 'Deep analysis of project structure and code',
        icon: '📖',
      },
    ],
  },
  {
    name: 'Branding',
    modules: [
      {
        type: 'naming-engine',
        name: 'Naming Engine',
        description: 'Generate creative names for your app',
        icon: '💡',
      },
      {
        type: 'icon-generator',
        name: 'Logo Generator',
        description: 'Generate professional logos with AI',
        icon: '🎨',
      },
    ],
  },
  {
    name: 'Marketing',
    modules: [
      {
        type: 'marketing-pack',
        name: 'Marketing Pack',
        description: 'Complete marketing materials for your app',
        icon: '📱',
      },
    ],
  },
];

interface AddModulePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddModulePanel({ isOpen, onClose }: AddModulePanelProps) {
  const { addModule, getCurrentSpace, canvasState } = useSpaceStore();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const currentSpace = getCurrentSpace();
  if (!currentSpace) {
    return null;
  }

  const handleAddModule = (type: ModuleType) => {
    // Calculate center position in viewport
    const centerX = (window.innerWidth - 260 - 450) / 2; // Subtract sidebar width and module width
    const centerY = (window.innerHeight - 500) / 2; // Subtract module height

    // Adjust for canvas pan and zoom
    const position = {
      x: (centerX - canvasState.pan.x) / canvasState.zoom,
      y: (centerY - canvasState.pan.y) / canvasState.zoom,
    };

    addModule(type, position);
    onClose();
  };

  const filteredCategories = moduleCategories
    .map((category) => ({
      ...category,
      modules: category.modules.filter(
        (module) =>
          module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          module.description.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.modules.length > 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-screen w-[400px] bg-[#1A1A1A] border-l border-[#2A2A2A] z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#2A2A2A] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Add Module</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-[#2A2A2A]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search modules..."
            className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Categories and Modules */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {filteredCategories.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">
                  {category.name}
                </h3>
                <div className="space-y-2">
                  {category.modules.map((module, moduleIndex) => (
                    <button
                      key={moduleIndex}
                      onClick={() => handleAddModule(module.type)}
                      className="w-full p-4 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg hover:border-blue-500 hover:bg-[#1A1A1A] transition-all group text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                          {module.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="text-sm font-medium text-white">
                              {module.name}
                            </h4>
                            <PlusIcon className="w-4 h-4 text-gray-500 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                          </div>
                          <p className="text-xs text-gray-400 line-clamp-2">
                            {module.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {filteredCategories.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm">No modules found</p>
                <p className="text-gray-600 text-xs mt-1">
                  Try adjusting your search query
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

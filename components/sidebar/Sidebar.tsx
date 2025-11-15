'use client';

import React, { useState } from 'react';
import { useSpaceStore } from '@/lib/store';
import ConfigurationPanel from '@/components/configuration/ConfigurationPanel';
import LogPanel from './LogPanel';
import {
  SquaresPlusIcon,
  Cog6ToothIcon,
  PlusIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

export default function Sidebar() {
  const { spaces, currentSpaceId, createSpace, setCurrentSpace, getCurrentSpace } = useSpaceStore();
  const [isSpacesOpen, setIsSpacesOpen] = useState(true);
  const [showCreateSpace, setShowCreateSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [showConfiguration, setShowConfiguration] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const currentSpace = getCurrentSpace();
  const logCount = currentSpace?.logs?.length || 0;
  const hasErrors = currentSpace?.logs?.some(log => log.type === 'error') || false;

  const handleCreateSpace = () => {
    if (newSpaceName.trim()) {
      createSpace(newSpaceName.trim());
      setNewSpaceName('');
      setShowCreateSpace(false);
    }
  };

  return (
    <div className="w-[260px] h-screen bg-[#1A1A1A] text-white flex flex-col fixed left-0 top-0 z-50 border-r border-[#2A2A2A]">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-sm">
            MS
          </div>
          <span className="text-lg font-semibold">Marketing Spaces</span>
        </div>
      </div>

      {/* Spaces Selector */}
      <div className="px-3 py-3 border-b border-[#2A2A2A]">
        <button
          onClick={() => setIsSpacesOpen(!isSpacesOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#2A2A2A] transition-colors"
        >
          <div className="flex items-center gap-2">
            <SquaresPlusIcon className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium">Spaces</span>
          </div>
          <ChevronDownIcon
            className={`w-4 h-4 transition-transform ${isSpacesOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isSpacesOpen && (
          <div className="mt-2 space-y-1">
            {spaces.map((space) => (
              <button
                key={space.id}
                onClick={() => setCurrentSpace(space.id)}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  currentSpaceId === space.id
                    ? 'bg-[#2A2A2A] text-white'
                    : 'text-gray-400 hover:bg-[#232323] hover:text-white'
                }`}
              >
                {space.name}
              </button>
            ))}

            {showCreateSpace ? (
              <div className="px-3 py-2">
                <input
                  type="text"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateSpace()}
                  onBlur={handleCreateSpace}
                  placeholder="Space name..."
                  className="w-full bg-[#2A2A2A] border border-[#3A3A3A] rounded px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
            ) : (
              <button
                onClick={() => setShowCreateSpace(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#232323] rounded-lg transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Create Space</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Bottom Section */}
      <div className="px-3 py-4 border-t border-[#2A2A2A] space-y-1">
        {/* Logs Button */}
        <button
          onClick={() => setShowLogs(true)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            hasErrors
              ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
              : 'text-gray-400 hover:bg-[#2A2A2A] hover:text-white'
          }`}
        >
          <ExclamationCircleIcon className="w-5 h-5" />
          <span className="text-sm">Logs</span>
          {logCount > 0 && (
            <span className={`ml-auto px-2 py-0.5 text-xs font-medium rounded-full ${
              hasErrors ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'
            }`}>
              {logCount}
            </span>
          )}
        </button>

        {/* Configuration Button */}
        <button
          onClick={() => setShowConfiguration(true)}
          data-open-config
          className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-[#2A2A2A] hover:text-white rounded-lg transition-colors"
        >
          <Cog6ToothIcon className="w-5 h-5" />
          <span className="text-sm">Configuration</span>
        </button>
      </div>

      {/* Log Panel */}
      <LogPanel
        isOpen={showLogs}
        onClose={() => setShowLogs(false)}
      />

      {/* Configuration Panel */}
      <ConfigurationPanel
        isOpen={showConfiguration}
        onClose={() => setShowConfiguration(false)}
      />
    </div>
  );
}

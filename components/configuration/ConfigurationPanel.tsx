'use client';

import React, { useState } from 'react';
import { useSpaceStore } from '@/lib/store';
import { XMarkIcon, KeyIcon, FolderIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import type { SpaceConfiguration } from '@/types';

interface ConfigurationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConfigurationPanel({ isOpen, onClose }: ConfigurationPanelProps) {
  const { getCurrentSpace, updateSpaceConfiguration } = useSpaceStore();
  const currentSpace = getCurrentSpace();

  const [config, setConfig] = useState<SpaceConfiguration>(
    currentSpace?.configuration || {
      projectPath: '',
      apiKeys: {},
      preferences: {
        autoSave: true,
        darkMode: true,
      },
    }
  );

  const handleSave = () => {
    if (currentSpace) {
      updateSpaceConfiguration(currentSpace.id, config);
      onClose();
    }
  };

  const handleApiKeyChange = (provider: string, value: string) => {
    setConfig({
      ...config,
      apiKeys: {
        ...config.apiKeys,
        [provider]: value,
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <Cog6ToothIcon className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Project Path */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FolderIcon className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Project Path
              </h3>
            </div>
            <input
              type="text"
              value={config.projectPath || ''}
              onChange={(e) => setConfig({ ...config, projectPath: e.target.value })}
              placeholder="/Users/dani/Projects/myapp"
              className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-2">
              Default path for this space's project files
            </p>
          </div>

          {/* API Keys */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <KeyIcon className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                API Keys
              </h3>
            </div>
            <div className="space-y-3">
              {/* OpenAI */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">OpenAI API Key</label>
                <input
                  type="password"
                  value={config.apiKeys?.openai || ''}
                  onChange={(e) => handleApiKeyChange('openai', e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Anthropic */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Anthropic API Key</label>
                <input
                  type="password"
                  value={config.apiKeys?.anthropic || ''}
                  onChange={(e) => handleApiKeyChange('anthropic', e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Stability AI */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Stability AI API Key</label>
                <input
                  type="password"
                  value={config.apiKeys?.stability || ''}
                  onChange={(e) => handleApiKeyChange('stability', e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Your API keys are stored locally and never shared
            </p>
          </div>

          {/* Preferences */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Cog6ToothIcon className="w-5 h-5 text-green-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Preferences
              </h3>
            </div>
            <div className="space-y-3">
              {/* Auto Save */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg">
                <div>
                  <label className="text-sm text-gray-300 font-medium">Auto Save</label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Automatically save changes as you work
                  </p>
                </div>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="autoSave"
                      checked={config.preferences?.autoSave === true}
                      onChange={() =>
                        setConfig({
                          ...config,
                          preferences: { ...config.preferences, autoSave: true },
                        })
                      }
                      className="text-green-500"
                    />
                    <span className="text-sm text-gray-400">On</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="autoSave"
                      checked={config.preferences?.autoSave === false}
                      onChange={() =>
                        setConfig({
                          ...config,
                          preferences: { ...config.preferences, autoSave: false },
                        })
                      }
                      className="text-green-500"
                    />
                    <span className="text-sm text-gray-400">Off</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2A2A2A]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#2A2A2A] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useSpaceStore } from '@/lib/store';
import { XMarkIcon, KeyIcon, FolderIcon, Cog6ToothIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import type { SpaceConfiguration } from '@/types';
import { AIProvider } from '@/types';

interface ConfigurationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'general' | 'ai' | 'apikeys';

export default function ConfigurationPanel({ isOpen, onClose }: ConfigurationPanelProps) {
  const { getCurrentSpace, updateSpaceConfiguration } = useSpaceStore();
  const currentSpace = getCurrentSpace();

  const [activeTab, setActiveTab] = useState<Tab>('general');
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
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
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

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-[#2A2A2A]">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'general'
                ? 'bg-[#2A2A2A] text-white'
                : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
            }`}
          >
            <div className="flex items-center gap-2">
              <FolderIcon className="w-4 h-4" />
              General
            </div>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'ai'
                ? 'bg-[#2A2A2A] text-white'
                : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
            }`}
          >
            <div className="flex items-center gap-2">
              <CpuChipIcon className="w-4 h-4" />
              AI Provider
            </div>
          </button>
          <button
            onClick={() => setActiveTab('apikeys')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'apikeys'
                ? 'bg-[#2A2A2A] text-white'
                : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
            }`}
          >
            <div className="flex items-center gap-2">
              <KeyIcon className="w-4 h-4" />
              API Keys
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Project Path */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Project Path</h3>
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

              {/* Preferences */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Preferences</h3>
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
          )}

          {/* AI PROVIDER TAB */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-300">
                  Configure which AI provider will be used for AI-powered modules (AIE Engine, etc.)
                </p>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Select AI Provider
                </label>
                <select
                  value={config.aiConfig?.provider || AIProvider.LOCAL}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      aiConfig: {
                        ...config.aiConfig,
                        provider: e.target.value as AIProvider,
                        model: config.aiConfig?.model || '',
                      },
                    })
                  }
                  className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                >
                  <option value={AIProvider.LOCAL}>Mock / Local (for testing)</option>
                  <option value={AIProvider.TOGETHER}>Together AI</option>
                  <option value={AIProvider.REPLICATE}>Replicate</option>
                  <option value={AIProvider.OPENAI}>OpenAI</option>
                  <option value={AIProvider.ANTHROPIC}>Anthropic</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Choose your preferred AI provider for text generation and analysis
                </p>
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Model</label>
                <input
                  type="text"
                  value={config.aiConfig?.model || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      aiConfig: {
                        ...config.aiConfig,
                        provider: config.aiConfig?.provider || AIProvider.LOCAL,
                        model: e.target.value,
                      },
                    })
                  }
                  placeholder={
                    config.aiConfig?.provider === AIProvider.OPENAI
                      ? 'gpt-4'
                      : config.aiConfig?.provider === AIProvider.ANTHROPIC
                      ? 'claude-3-opus-20240229'
                      : config.aiConfig?.provider === AIProvider.TOGETHER
                      ? 'together_ai/llama-3-70b'
                      : config.aiConfig?.provider === AIProvider.REPLICATE
                      ? 'meta/llama-2-70b-chat'
                      : 'mock-gpt-4'
                  }
                  className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Specific model to use (leave empty for default)
                </p>
              </div>

              {/* Temperature */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Temperature: <span className="text-orange-400">{config.aiConfig?.temperature || 0.7}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.aiConfig?.temperature || 0.7}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      aiConfig: {
                        ...config.aiConfig,
                        provider: config.aiConfig?.provider || AIProvider.LOCAL,
                        model: config.aiConfig?.model || '',
                        temperature: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full h-2 bg-[#0A0A0A] rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Controls randomness: 0 = focused, 2 = creative
                </p>
              </div>

              {/* Max Tokens */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Max Tokens</label>
                <input
                  type="number"
                  value={config.aiConfig?.maxTokens || 4096}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      aiConfig: {
                        ...config.aiConfig,
                        provider: config.aiConfig?.provider || AIProvider.LOCAL,
                        model: config.aiConfig?.model || '',
                        maxTokens: parseInt(e.target.value) || 4096,
                      },
                    })
                  }
                  placeholder="4096"
                  className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Maximum length of AI responses
                </p>
              </div>

              {/* API Key - Shown dynamically based on selected provider */}
              {config.aiConfig?.provider && config.aiConfig.provider !== AIProvider.LOCAL && (
                <div className="space-y-3">
                  <div className="px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-sm text-yellow-300 font-medium">
                      🔑 API Key Required for {' '}
                      {config.aiConfig.provider === AIProvider.OPENAI && 'OpenAI'}
                      {config.aiConfig.provider === AIProvider.ANTHROPIC && 'Anthropic'}
                      {config.aiConfig.provider === AIProvider.REPLICATE && 'Replicate'}
                      {config.aiConfig.provider === AIProvider.TOGETHER && 'Together AI'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      {config.aiConfig.provider === AIProvider.OPENAI && 'OpenAI API Key'}
                      {config.aiConfig.provider === AIProvider.ANTHROPIC && 'Anthropic API Key'}
                      {config.aiConfig.provider === AIProvider.REPLICATE && 'Replicate API Key'}
                      {config.aiConfig.provider === AIProvider.TOGETHER && 'Together AI API Key'}
                    </label>
                    <input
                      type="password"
                      value={
                        config.aiConfig.provider === AIProvider.OPENAI ? (config.apiKeys?.openai || '') :
                        config.aiConfig.provider === AIProvider.ANTHROPIC ? (config.apiKeys?.anthropic || '') :
                        config.aiConfig.provider === AIProvider.REPLICATE ? (config.apiKeys?.replicate || '') :
                        config.aiConfig.provider === AIProvider.TOGETHER ? (config.apiKeys?.together || '') :
                        ''
                      }
                      onChange={(e) => {
                        const provider = config.aiConfig?.provider;
                        if (provider === AIProvider.OPENAI) handleApiKeyChange('openai', e.target.value);
                        else if (provider === AIProvider.ANTHROPIC) handleApiKeyChange('anthropic', e.target.value);
                        else if (provider === AIProvider.REPLICATE) handleApiKeyChange('replicate', e.target.value);
                        else if (provider === AIProvider.TOGETHER) handleApiKeyChange('together', e.target.value);
                      }}
                      placeholder={
                        config.aiConfig.provider === AIProvider.OPENAI ? 'sk-...' :
                        config.aiConfig.provider === AIProvider.ANTHROPIC ? 'sk-ant-...' :
                        config.aiConfig.provider === AIProvider.REPLICATE ? 'r8_...' :
                        config.aiConfig.provider === AIProvider.TOGETHER ? 'Enter your Together AI key...' :
                        ''
                      }
                      className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors font-mono"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Your API key is stored locally in your browser and never shared
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* API KEYS TAB */}
          {activeTab === 'apikeys' && (
            <div className="space-y-6">
              <div className="px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <p className="text-sm text-purple-300">
                  Your API keys are stored locally in your browser and never shared with anyone
                </p>
              </div>

              {/* Show all API key inputs */}
              <div className="space-y-4">
                {/* OpenAI */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    OpenAI API Key
                    {config.aiConfig?.provider === AIProvider.OPENAI && (
                      <span className="ml-2 text-xs text-green-400">(Currently selected)</span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={config.apiKeys?.openai || ''}
                    onChange={(e) => handleApiKeyChange('openai', e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                {/* Anthropic */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Anthropic API Key
                    {config.aiConfig?.provider === AIProvider.ANTHROPIC && (
                      <span className="ml-2 text-xs text-green-400">(Currently selected)</span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={config.apiKeys?.anthropic || ''}
                    onChange={(e) => handleApiKeyChange('anthropic', e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                {/* Replicate */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Replicate API Key
                    {config.aiConfig?.provider === AIProvider.REPLICATE && (
                      <span className="ml-2 text-xs text-green-400">(Currently selected)</span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={config.apiKeys?.replicate || ''}
                    onChange={(e) => handleApiKeyChange('replicate', e.target.value)}
                    placeholder="r8_..."
                    className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                {/* Together */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Together AI API Key
                    {config.aiConfig?.provider === AIProvider.TOGETHER && (
                      <span className="ml-2 text-xs text-green-400">(Currently selected)</span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={config.apiKeys?.together || ''}
                    onChange={(e) => handleApiKeyChange('together', e.target.value)}
                    placeholder="..."
                    className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                {/* Stability AI */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Stability AI API Key
                  </label>
                  <input
                    type="password"
                    value={config.apiKeys?.stability || ''}
                    onChange={(e) => handleApiKeyChange('stability', e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    For image generation modules
                  </p>
                </div>
              </div>
            </div>
          )}
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

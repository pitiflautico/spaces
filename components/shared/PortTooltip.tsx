/**
 * Port Tooltip Component
 * Shows helpful information about what each port expects/provides
 */

import React, { useState } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface PortTooltipProps {
  portId: string;
  label: string;
  type: 'input' | 'output';
  description: string;
  required?: boolean;
  expectedData?: string;
  exampleSource?: string;
}

export function PortTooltip({
  portId,
  label,
  type,
  description,
  required = false,
  expectedData,
  exampleSource,
}: PortTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      {/* Info Icon */}
      <button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
      >
        <InformationCircleIcon className="w-3 h-3 text-gray-400" />
      </button>

      {/* Tooltip */}
      {isVisible && (
        <div className="absolute z-50 w-64 p-3 bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg shadow-xl"
             style={{
               [type === 'input' ? 'right' : 'left']: '100%',
               top: '50%',
               transform: 'translateY(-50%)',
               marginLeft: type === 'output' ? '8px' : '0',
               marginRight: type === 'input' ? '8px' : '0',
             }}>
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-semibold ${required ? 'text-red-400' : 'text-blue-400'}`}>
              {type === 'input' ? '← INPUT' : 'OUTPUT →'}
            </span>
            {required && (
              <span className="px-1.5 py-0.5 text-[10px] bg-red-500/20 text-red-300 rounded">
                REQUIRED
              </span>
            )}
          </div>

          {/* Label */}
          <div className="text-sm font-semibold text-white mb-1">
            {label}
          </div>

          {/* Description */}
          <div className="text-xs text-gray-400 mb-2">
            {description}
          </div>

          {/* Expected Data */}
          {expectedData && (
            <div className="text-xs text-gray-500 mb-1">
              <span className="text-gray-600">Expects:</span> {expectedData}
            </div>
          )}

          {/* Example Source */}
          {exampleSource && (
            <div className="text-xs text-blue-400">
              <span className="text-gray-600">From:</span> {exampleSource}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Module Info Panel
 * Comprehensive help panel for modules with multiple ports
 */

interface ModuleInfoPanelProps {
  moduleName: string;
  moduleDescription: string;
  inputs: Array<{
    id: string;
    label: string;
    description: string;
    required: boolean;
    source: string;
    dataType: string;
  }>;
  outputs: Array<{
    id: string;
    label: string;
    description: string;
    dataType: string;
  }>;
  onClose: () => void;
}

export function ModuleInfoPanel({
  moduleName,
  moduleDescription,
  inputs,
  outputs,
  onClose,
}: ModuleInfoPanelProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1A1A1A] rounded-2xl w-[90vw] max-w-3xl max-h-[85vh] overflow-hidden border border-[#3A3A3A] shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2A2A2A] bg-gradient-to-r from-blue-600/10 to-purple-600/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{moduleName}</h2>
              <p className="text-sm text-gray-400 mt-1">{moduleDescription}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors"
            >
              <span className="text-gray-400 text-xl">×</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-100px)]">
          {/* Inputs Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-blue-400">←</span> Input Ports
            </h3>
            <div className="space-y-3">
              {inputs.map((input) => (
                <div
                  key={input.id}
                  className={`p-4 rounded-lg border ${
                    input.required
                      ? 'bg-red-500/5 border-red-500/30'
                      : 'bg-blue-500/5 border-blue-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-white">{input.label}</span>
                    {input.required && (
                      <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-300 rounded">
                        REQUIRED
                      </span>
                    )}
                    <span className="px-2 py-0.5 text-xs bg-gray-500/20 text-gray-400 rounded">
                      {input.dataType}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{input.description}</p>
                  <div className="text-xs text-blue-400">
                    <span className="text-gray-500">Connect from:</span> {input.source}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Outputs Section */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              Output Ports <span className="text-green-400">→</span>
            </h3>
            <div className="space-y-3">
              {outputs.map((output) => (
                <div
                  key={output.id}
                  className="p-4 rounded-lg border bg-green-500/5 border-green-500/30"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-white">{output.label}</span>
                    <span className="px-2 py-0.5 text-xs bg-gray-500/20 text-gray-400 rounded">
                      {output.dataType}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{output.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2A2A2A] bg-[#0A0A0A]/50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

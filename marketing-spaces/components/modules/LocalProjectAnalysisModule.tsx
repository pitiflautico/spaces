'use client';

import React, { useState } from 'react';
import { useSpaceStore } from '@/lib/store';
import type { Module, LocalProjectAnalysisInputs, LocalProjectAnalysisOutputs } from '@/types';
import { ArrowDownTrayIcon, FolderIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface LocalProjectAnalysisModuleProps {
  module: Module;
}

export default function LocalProjectAnalysisModule({ module }: LocalProjectAnalysisModuleProps) {
  const { updateModule } = useSpaceStore();

  const [inputs, setInputs] = useState<LocalProjectAnalysisInputs>({
    localProjectPath: module.inputs.localProjectPath || '',
    includeHiddenFiles: module.inputs.includeHiddenFiles || false,
    includeNodeModules: module.inputs.includeNodeModules || false,
  });

  const handleInputChange = (field: keyof LocalProjectAnalysisInputs, value: any) => {
    const newInputs = { ...inputs, [field]: value };
    setInputs(newInputs);
    updateModule(module.id, { inputs: newInputs });
  };

  const outputs = module.outputs as LocalProjectAnalysisOutputs;

  return (
    <div className="space-y-4">
      {/* Inputs Section */}
      <div className="space-y-3">
        <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
          Inputs
        </div>

        {/* Local Project Path */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">
            Local Project Path <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={inputs.localProjectPath}
              onChange={(e) => handleInputChange('localProjectPath', e.target.value)}
              placeholder="/Users/dani/Projects/myapp"
              className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg px-3 py-2 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <FolderIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter the absolute path to your local project
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3">
          {/* Include Hidden Files */}
          <div className="flex items-center justify-between px-3 py-2.5 bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg">
            <label className="text-sm text-gray-300">Include hidden files</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="includeHiddenFiles"
                  checked={inputs.includeHiddenFiles === true}
                  onChange={() => handleInputChange('includeHiddenFiles', true)}
                  className="text-blue-500"
                />
                <span className="text-sm text-gray-400">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="includeHiddenFiles"
                  checked={inputs.includeHiddenFiles === false}
                  onChange={() => handleInputChange('includeHiddenFiles', false)}
                  className="text-blue-500"
                />
                <span className="text-sm text-gray-400">No</span>
              </label>
            </div>
          </div>

          {/* Include Node Modules */}
          <div className="flex items-center justify-between px-3 py-2.5 bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg">
            <label className="text-sm text-gray-300">Include node_modules</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="includeNodeModules"
                  checked={inputs.includeNodeModules === true}
                  onChange={() => handleInputChange('includeNodeModules', true)}
                  className="text-blue-500"
                />
                <span className="text-sm text-gray-400">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="includeNodeModules"
                  checked={inputs.includeNodeModules === false}
                  onChange={() => handleInputChange('includeNodeModules', false)}
                  className="text-blue-500"
                />
                <span className="text-sm text-gray-400">No</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Outputs Section */}
      {module.status === 'done' && outputs && (
        <div className="space-y-3 pt-3 border-t border-[#2A2A2A]">
          <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
            Outputs
          </div>

          {outputs.repositoryMetadata && (
            <button className="w-full flex items-center justify-between px-3 py-2 bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg hover:border-blue-500 transition-colors text-left">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-300">repository_metadata.json</span>
              </div>
              <ArrowDownTrayIcon className="w-4 h-4 text-gray-400" />
            </button>
          )}

          {outputs.fileContents && (
            <button className="w-full flex items-center justify-between px-3 py-2 bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg hover:border-blue-500 transition-colors text-left">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-gray-300">file_contents.json</span>
              </div>
              <ArrowDownTrayIcon className="w-4 h-4 text-gray-400" />
            </button>
          )}

          {outputs.repoStructure && (
            <button className="w-full flex items-center justify-between px-3 py-2 bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg hover:border-blue-500 transition-colors text-left">
              <div className="flex items-center gap-2">
                <FolderIcon className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-300">repo_structure.json</span>
              </div>
              <ArrowDownTrayIcon className="w-4 h-4 text-gray-400" />
            </button>
          )}

          {outputs.analysisLog && (
            <button className="w-full flex items-center justify-between px-3 py-2 bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg hover:border-blue-500 transition-colors text-left">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-gray-300">analysis_log.txt</span>
              </div>
              <ArrowDownTrayIcon className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

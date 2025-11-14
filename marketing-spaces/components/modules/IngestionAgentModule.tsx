'use client';

import React, { useState } from 'react';
import { useSpaceStore } from '@/lib/store';
import type { Module, IngestionAgentInputs, IngestionAgentOutputs } from '@/types';
import { ArrowDownTrayIcon, FolderIcon } from '@heroicons/react/24/outline';

interface IngestionAgentModuleProps {
  module: Module;
}

export default function IngestionAgentModule({ module }: IngestionAgentModuleProps) {
  const { updateModule } = useSpaceStore();

  const [inputs, setInputs] = useState<IngestionAgentInputs>({
    projectName: module.inputs.projectName || '',
    repoUrl: module.inputs.repoUrl || '',
    branch: module.inputs.branch || 'main',
    mode: module.inputs.mode || 'copy',
  });

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleInputChange = (field: keyof IngestionAgentInputs, value: any) => {
    const newInputs = { ...inputs, [field]: value };
    setInputs(newInputs);
    updateModule(module.id, { inputs: newInputs });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      handleInputChange('zipFile', file);
    }
  };

  const outputs = module.outputs as IngestionAgentOutputs;

  return (
    <div className="space-y-4">
      {/* Inputs Section */}
      <div className="space-y-3">
        <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
          Inputs
        </div>

        {/* Project Name */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={inputs.projectName}
            onChange={(e) => handleInputChange('projectName', e.target.value)}
            placeholder="my-awesome-app"
            className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Repository URL */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">
            Repository URL
          </label>
          <input
            type="text"
            value={inputs.repoUrl}
            onChange={(e) => handleInputChange('repoUrl', e.target.value)}
            placeholder="https://github.com/user/repo.git"
            disabled={!!uploadedFile}
            className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* OR Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#3A3A3A]" />
          <span className="text-xs text-gray-600 font-medium">OR</span>
          <div className="flex-1 h-px bg-[#3A3A3A]" />
        </div>

        {/* Upload ZIP */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">
            Upload ZIP File
          </label>
          <label
            className={`flex items-center justify-center gap-2 w-full bg-[#0A0A0A] border border-dashed border-[#3A3A3A] rounded-lg px-3 py-6 text-sm text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors cursor-pointer ${
              inputs.repoUrl ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            {uploadedFile ? (
              <span className="text-white">{uploadedFile.name}</span>
            ) : (
              <span>Choose file or drag here</span>
            )}
            <input
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              disabled={!!inputs.repoUrl}
              className="hidden"
            />
          </label>
        </div>

        {/* Branch */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">
              Branch
            </label>
            <input
              type="text"
              value={inputs.branch}
              onChange={(e) => handleInputChange('branch', e.target.value)}
              placeholder="main"
              className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Mode */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">
              Mode
            </label>
            <div className="flex gap-2">
              <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg cursor-pointer text-sm transition-all hover:border-blue-500">
                <input
                  type="radio"
                  name="mode"
                  value="copy"
                  checked={inputs.mode === 'copy'}
                  onChange={(e) => handleInputChange('mode', e.target.value)}
                  className="text-blue-500"
                />
                <span className="text-gray-300">Copy</span>
              </label>
              <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg cursor-pointer text-sm transition-all hover:border-blue-500">
                <input
                  type="radio"
                  name="mode"
                  value="readonly"
                  checked={inputs.mode === 'readonly'}
                  onChange={(e) => handleInputChange('mode', e.target.value)}
                  className="text-blue-500"
                />
                <span className="text-gray-300">Read-only</span>
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

          {outputs.projectPath && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
              <FolderIcon className="w-4 h-4 text-green-500" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-green-400 mb-0.5">Project Path</div>
                <div className="text-xs text-gray-400 truncate">{outputs.projectPath}</div>
              </div>
            </div>
          )}

          {outputs.folderStructure && (
            <button className="w-full flex items-center justify-between px-3 py-2 bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg hover:border-blue-500 transition-colors text-left">
              <span className="text-xs text-gray-300">folder_structure.json</span>
              <ArrowDownTrayIcon className="w-4 h-4 text-gray-400" />
            </button>
          )}

          {outputs.projectMetadata && (
            <button className="w-full flex items-center justify-between px-3 py-2 bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg hover:border-blue-500 transition-colors text-left">
              <span className="text-xs text-gray-300">project_metadata.json</span>
              <ArrowDownTrayIcon className="w-4 h-4 text-gray-400" />
            </button>
          )}

          {outputs.ingestionLog && (
            <button className="w-full flex items-center justify-between px-3 py-2 bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg hover:border-blue-500 transition-colors text-left">
              <span className="text-xs text-gray-300">ingestion_log.txt</span>
              <ArrowDownTrayIcon className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

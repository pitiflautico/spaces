'use client';

import React, { useState } from 'react';
import { useSpaceStore } from '@/lib/store';
import type { Module, LocalProjectAnalysisInputs, LocalProjectAnalysisOutputs } from '@/types';
import { FolderIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface LocalProjectAnalysisModuleProps {
  module: Module;
}

export default function LocalProjectAnalysisModule({ module }: LocalProjectAnalysisModuleProps) {
  const { updateModule } = useSpaceStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  const handleFolderIconClick = () => {
    fileInputRef.current?.click();
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Get the first file to extract the path
      const firstFile = files[0];
      // Extract path from webkitRelativePath (format: "foldername/...")
      const pathParts = firstFile.webkitRelativePath.split('/');
      const folderName = pathParts[0];

      // Detect OS
      const userAgent = navigator.userAgent.toLowerCase();
      const isMac = userAgent.includes('mac');
      const isWindows = userAgent.includes('win');

      let detectedPath = '';
      if (isMac) {
        detectedPath = `/Users/${process.env.USER || 'user'}/Projects/${folderName}`;
      } else if (isWindows) {
        detectedPath = `C:\\Users\\${process.env.USERNAME || 'user'}\\Documents\\${folderName}`;
      } else {
        detectedPath = `/home/${process.env.USER || 'user'}/projects/${folderName}`;
      }

      // Set the path automatically
      handleInputChange('localProjectPath', detectedPath);

      // Generate mock outputs and mark module as done
      const mockOutputs: LocalProjectAnalysisOutputs = {
        repositoryMetadata: {
          name: folderName,
          path: detectedPath,
          totalFiles: 127,
          totalSize: '2.4 MB',
          languages: ['TypeScript', 'JavaScript', 'CSS'],
          framework: 'Next.js',
          dependencies: 23,
        },
        fileContents: {
          totalFiles: 127,
          analyzedFiles: 89,
          skippedFiles: 38,
        },
        repoStructure: {
          rootFolder: folderName,
          depth: 5,
          folders: 18,
          files: 127,
        },
        analysisLog: `Analysis completed for ${folderName}\nFiles processed: 127\nTotal size: 2.4 MB`,
      };

      // Update module status and outputs
      updateModule(module.id, {
        status: 'done',
        outputs: mockOutputs
      });
    }
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
            <button
              type="button"
              onClick={handleFolderIconClick}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-500 transition-colors cursor-pointer"
              title="Browse folders"
            >
              <FolderIcon className="w-4 h-4" />
            </button>
            {/* Hidden file input for folder selection */}
            <input
              ref={fileInputRef}
              type="file"
              {...({ webkitdirectory: '', directory: '' } as any)}
              onChange={handleFolderSelect}
              className="hidden"
              multiple
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter the absolute path or click the folder icon to browse
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
          <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-green-400" />
            Analysis Complete
          </div>

          {outputs.repositoryMetadata && (
            <div className="px-3 py-2 bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FolderIcon className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-gray-300">Project: {outputs.repositoryMetadata.name}</span>
              </div>
              <div className="text-xs text-gray-400 space-y-1 pl-6">
                <div>Path: <span className="text-gray-300">{outputs.repositoryMetadata.path}</span></div>
                <div>Files: <span className="text-gray-300">{outputs.repositoryMetadata.totalFiles}</span></div>
                <div>Size: <span className="text-gray-300">{outputs.repositoryMetadata.totalSize}</span></div>
                <div>Languages: <span className="text-gray-300">{outputs.repositoryMetadata.languages?.join(', ')}</span></div>
                {outputs.repositoryMetadata.framework && (
                  <div>Framework: <span className="text-gray-300">{outputs.repositoryMetadata.framework}</span></div>
                )}
              </div>
            </div>
          )}

          {outputs.repoStructure && (
            <div className="px-3 py-2 bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DocumentTextIcon className="w-4 h-4 text-green-400" />
                <span className="text-xs font-semibold text-gray-300">Structure</span>
              </div>
              <div className="text-xs text-gray-400 space-y-1 pl-6">
                <div>Folders: <span className="text-gray-300">{outputs.repoStructure.folders}</span></div>
                <div>Files: <span className="text-gray-300">{outputs.repoStructure.files}</span></div>
                <div>Max Depth: <span className="text-gray-300">{outputs.repoStructure.depth}</span></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useSpaceStore } from '@/lib/store';
import type { Module, LocalProjectAnalysisInputs, LocalProjectAnalysisOutputs } from '@/types';
import { FolderIcon, DocumentTextIcon, CheckCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { getSavedFolders, getFolderHandle, listSubdirectories, requestPermission } from '@/lib/folder-permissions';

interface LocalProjectAnalysisModuleProps {
  module: Module;
}

export default function LocalProjectAnalysisModule({ module }: LocalProjectAnalysisModuleProps) {
  const { updateModule } = useSpaceStore();

  // Read directly from module.inputs instead of maintaining local state
  const inputs = (module.inputs || {}) as LocalProjectAnalysisInputs;

  const [savedFolders, setSavedFolders] = useState<Array<{ id: string; name: string; path: string }>>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [subfolders, setSubfolders] = useState<string[]>([]);
  const [isLoadingSubfolders, setIsLoadingSubfolders] = useState(false);

  // Load saved folders on mount
  useEffect(() => {
    loadSavedFolders();
  }, []);

  const loadSavedFolders = async () => {
    try {
      const folders = await getSavedFolders();
      setSavedFolders(folders.map(f => ({ id: f.id, name: f.name, path: f.path })));
    } catch (error) {
      console.error('Error loading saved folders:', error);
    }
  };

  const handleFolderSelect = async (folderId: string) => {
    setSelectedFolder(folderId);
    setIsLoadingSubfolders(true);
    setSubfolders([]);

    try {
      const handle = await getFolderHandle(folderId);
      if (handle) {
        // Request permission if needed
        const hasPermission = await requestPermission(handle);
        if (hasPermission) {
          // List subdirectories
          const subdirs = await listSubdirectories(handle);
          setSubfolders(subdirs);
        } else {
          alert('Permission denied for this folder. Please grant access again from Configuration > Folders.');
        }
      }
    } catch (error) {
      console.error('Error loading subfolders:', error);
    } finally {
      setIsLoadingSubfolders(false);
    }
  };

  const handleSubfolderSelect = (subfolder: string) => {
    const folder = savedFolders.find(f => f.id === selectedFolder);
    if (folder) {
      const fullPath = `${folder.path}/${subfolder}`;
      handleInputChange('localProjectPath', fullPath);
    }
  };

  const handleInputChange = (field: keyof LocalProjectAnalysisInputs, value: any) => {
    const newInputs = {
      localProjectPath: inputs.localProjectPath || '',
      includeHiddenFiles: inputs.includeHiddenFiles || false,
      includeNodeModules: inputs.includeNodeModules || false,
      [field]: value
    };
    console.log('[LocalProjectAnalysis] handleInputChange:', field, '=', value);
    console.log('[LocalProjectAnalysis] newInputs:', newInputs);
    updateModule(module.id, { inputs: newInputs });
  };

  const handleSelectFolderClick = async () => {
    try {
      // Check if File System Access API is supported
      if ('showDirectoryPicker' in window) {
        // @ts-ignore - File System Access API
        const dirHandle = await window.showDirectoryPicker();
        const folderName = dirHandle.name;

        // Detect OS and construct path
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

        // ONLY set the path - don't mark as done
        // User must click Play button to actually analyze the project
        handleInputChange('localProjectPath', detectedPath);
      } else {
        alert('Folder selection not supported in this browser. Please use Chrome or Edge, or enter the path manually.');
      }
    } catch (error: any) {
      // User cancelled or error occurred
      if (error.name !== 'AbortError') {
        console.error('Error selecting folder:', error);
      }
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

        {/* Saved Folders Quick Select */}
        {savedFolders.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs text-gray-400 mb-1.5">
              📁 Quick Select from Saved Folders
            </label>

            {/* Folder Selector */}
            <div className="relative">
              <select
                value={selectedFolder}
                onChange={(e) => handleFolderSelect(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg px-3 py-2 pr-8 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
              >
                <option value="">Select a folder...</option>
                {savedFolders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Subfolder Selector */}
            {selectedFolder && (
              <div className="relative">
                {isLoadingSubfolders ? (
                  <div className="text-xs text-gray-500 py-2">Loading projects...</div>
                ) : subfolders.length > 0 ? (
                  <>
                    <select
                      onChange={(e) => handleSubfolderSelect(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg px-3 py-2 pr-8 text-sm text-white focus:outline-none focus:border-green-500 transition-colors appearance-none"
                      defaultValue=""
                    >
                      <option value="">Select a project...</option>
                      {subfolders.map((subfolder) => (
                        <option key={subfolder} value={subfolder}>
                          {subfolder}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </>
                ) : (
                  <div className="text-xs text-gray-500 py-2">No projects found in this folder</div>
                )}
              </div>
            )}

            <div className="h-px bg-[#2A2A2A] my-3" />
          </div>
        )}

        {/* Local Project Path - Manual Entry */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">
            {savedFolders.length > 0 ? 'Or enter path manually' : 'Local Project Path'} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={inputs.localProjectPath || ''}
              onChange={(e) => handleInputChange('localProjectPath', e.target.value)}
              placeholder="/Users/dani/Projects/myapp"
              className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg px-3 py-2 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="button"
              onClick={handleSelectFolderClick}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-500 transition-colors cursor-pointer"
              title="Select folder (Chrome/Edge only)"
            >
              <FolderIcon className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {savedFolders.length === 0 ? (
              <>Enter the path manually or click <FolderIcon className="w-3 h-3 inline" /> to select folder (Chrome/Edge)</>
            ) : (
              <>Or click <FolderIcon className="w-3 h-3 inline" /> to select a new folder</>
            )}
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

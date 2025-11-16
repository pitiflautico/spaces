'use client';

import React, { useState } from 'react';
import { useSpaceStore } from '@/lib/store';
import type {
  Module,
  AppStoreConnectInputs,
  AppStoreConnectOutputs,
  BuildConfig,
  AppStoreConnectResult,
  ValidationResult,
  ChosenMetadata,
  ScreenshotSet,
} from '@/types';
import {
  CheckCircleIcon,
  RocketLaunchIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  PhotoIcon,
  CubeIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

interface AppStoreConnectModuleProps {
  module: Module;
}

export default function AppStoreConnectModule({ module }: AppStoreConnectModuleProps) {
  const { updateModule, getCurrentSpace, addLog } = useSpaceStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const outputs = module.outputs as AppStoreConnectOutputs;
  const inputs = (module.inputs || {}) as AppStoreConnectInputs;
  const space = getCurrentSpace();

  // Check connected inputs
  const connections = space?.connections || [];
  const hasMetadataInput = connections.some(c => c.targetModuleId === module.id && c.targetPortId === 'in-1');
  const hasIconInput = connections.some(c => c.targetModuleId === module.id && c.targetPortId === 'in-2');
  const hasScreenshotsInput = connections.some(c => c.targetModuleId === module.id && c.targetPortId === 'in-3');

  const handleConfigChange = (field: keyof BuildConfig, value: any) => {
    updateModule(module.id, {
      inputs: {
        ...inputs,
        buildConfig: {
          ...(inputs.buildConfig || {} as BuildConfig),
          [field]: value,
        },
      },
    });
  };

  const handleRun = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      updateModule(module.id, { status: 'running' });

      // Validate build config
      if (!inputs.buildConfig) {
        throw new Error('Build configuration is required. Please configure the module first.');
      }

      const { bundle_id, version, build_number, team_id } = inputs.buildConfig;

      if (!bundle_id || !version || !build_number || !team_id) {
        throw new Error('Bundle ID, Version, Build Number, and Team ID are required.');
      }

      // Get connected data
      const metadataConn = connections.find(c => c.targetModuleId === module.id && c.targetPortId === 'in-1');
      const iconConn = connections.find(c => c.targetModuleId === module.id && c.targetPortId === 'in-2');
      const screenshotsConn = connections.find(c => c.targetModuleId === module.id && c.targetPortId === 'in-3');

      const metadataModule = metadataConn ? space?.modules.find(m => m.id === metadataConn.sourceModuleId) : null;
      const iconModule = iconConn ? space?.modules.find(m => m.id === iconConn.sourceModuleId) : null;
      const screenshotsModule = screenshotsConn ? space?.modules.find(m => m.id === screenshotsConn.sourceModuleId) : null;

      const chosenMetadata: ChosenMetadata | undefined = metadataModule?.outputs?.chosenMetadata;
      const iconPath: string | undefined = iconModule?.outputs?.iconPath;
      const screenshots: ScreenshotSet | undefined = screenshotsModule?.outputs?.screenshots;

      if (!chosenMetadata) {
        throw new Error('No metadata connected. Please connect Module 5 (Metadata Generator) output to input port 1.');
      }

      addLog('info', `Starting App Store Connect automation for ${bundle_id}...`, module.id);

      // Call daemon endpoint
      const response = await fetch('http://localhost:5050/run-appstore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: chosenMetadata.app_store,
          icon_path: iconPath,
          screenshots: screenshots,
          build_config: inputs.buildConfig,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Automation failed');
      }

      const result = await response.json();

      const automationResult: AppStoreConnectResult = result.result;
      const connectLog: string = result.log || 'No log available';
      const validationReport: ValidationResult = result.validation;

      // Build App Store Connect URL
      const appStoreUrl = `https://appstoreconnect.apple.com/apps/${bundle_id}`;

      const newOutputs: AppStoreConnectOutputs = {
        automationResult,
        connectLog,
        validationReport,
        appStoreUrl,
      };

      updateModule(module.id, {
        status: automationResult.validation_passed ? 'done' : 'warning',
        outputs: newOutputs,
      });

      if (automationResult.status === 'success') {
        addLog('success', `✓ App Store Connect automation completed successfully!`, module.id);
      } else if (automationResult.status === 'partial') {
        addLog('warning', `⚠ Automation completed with warnings`, module.id);
      } else {
        addLog('error', `✗ Automation failed`, module.id);
      }

    } catch (error: any) {
      console.error('App Store Connect automation error:', error);
      setError(error.message);
      updateModule(module.id, {
        status: 'error',
        errorMessage: error.message,
      });
      addLog('error', `App Store Connect automation failed: ${error.message}`, module.id);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-2">
          <RocketLaunchIcon className="w-5 h-5 text-purple-400" />
          <span className="text-sm font-semibold text-white">App Store Connect</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 py-3 overflow-y-auto">
        {/* Build Configuration */}
        <div className="mb-4">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-full flex items-center justify-between px-3 py-2 bg-[#1A1A1A] hover:bg-[#222] border border-[#3A3A3A] rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <CubeIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">Build Configuration</span>
            </div>
            <span className="text-xs text-gray-500">
              {inputs.buildConfig ? '✓ Configured' : '⚠ Required'}
            </span>
          </button>

          {showConfig && (
            <div className="mt-2 p-3 bg-[#0A0A0A]/80 border border-[#3A3A3A] rounded-lg space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Bundle ID *</label>
                <input
                  type="text"
                  placeholder="com.company.myapp"
                  value={inputs.buildConfig?.bundle_id || ''}
                  onChange={(e) => handleConfigChange('bundle_id', e.target.value)}
                  className="w-full px-2 py-1 text-sm bg-[#1A1A1A] border border-[#3A3A3A] rounded text-white placeholder-gray-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Version *</label>
                  <input
                    type="text"
                    placeholder="1.0.0"
                    value={inputs.buildConfig?.version || ''}
                    onChange={(e) => handleConfigChange('version', e.target.value)}
                    className="w-full px-2 py-1 text-sm bg-[#1A1A1A] border border-[#3A3A3A] rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Build *</label>
                  <input
                    type="text"
                    placeholder="1"
                    value={inputs.buildConfig?.build_number || ''}
                    onChange={(e) => handleConfigChange('build_number', e.target.value)}
                    className="w-full px-2 py-1 text-sm bg-[#1A1A1A] border border-[#3A3A3A] rounded text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Team ID *</label>
                <input
                  type="text"
                  placeholder="ABC123XYZ"
                  value={inputs.buildConfig?.team_id || ''}
                  onChange={(e) => handleConfigChange('team_id', e.target.value)}
                  className="w-full px-2 py-1 text-sm bg-[#1A1A1A] border border-[#3A3A3A] rounded text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Privacy Policy URL</label>
                <input
                  type="url"
                  placeholder="https://myapp.com/privacy"
                  value={inputs.buildConfig?.privacy_policy_url || ''}
                  onChange={(e) => handleConfigChange('privacy_policy_url', e.target.value)}
                  className="w-full px-2 py-1 text-sm bg-[#1A1A1A] border border-[#3A3A3A] rounded text-white placeholder-gray-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Inputs Status */}
        <div className="space-y-2 mb-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Connected Inputs</div>

          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${hasMetadataInput ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-500/10 border-gray-500/30'}`}>
            <DocumentTextIcon className={`w-4 h-4 ${hasMetadataInput ? 'text-green-400' : 'text-gray-500'}`} />
            <span className={`text-sm ${hasMetadataInput ? 'text-green-300' : 'text-gray-400'}`}>
              {hasMetadataInput ? '✓ Metadata' : '⚠ Metadata (required)'}
            </span>
          </div>

          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${hasIconInput ? 'bg-blue-500/10 border-blue-500/30' : 'bg-gray-500/10 border-gray-500/30'}`}>
            <PhotoIcon className={`w-4 h-4 ${hasIconInput ? 'text-blue-400' : 'text-gray-500'}`} />
            <span className={`text-sm ${hasIconInput ? 'text-blue-300' : 'text-gray-400'}`}>
              {hasIconInput ? '✓ Icon' : '○ Icon (optional)'}
            </span>
          </div>

          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${hasScreenshotsInput ? 'bg-purple-500/10 border-purple-500/30' : 'bg-gray-500/10 border-gray-500/30'}`}>
            <GlobeAltIcon className={`w-4 h-4 ${hasScreenshotsInput ? 'text-purple-400' : 'text-gray-500'}`} />
            <span className={`text-sm ${hasScreenshotsInput ? 'text-purple-300' : 'text-gray-400'}`}>
              {hasScreenshotsInput ? '✓ Screenshots' : '○ Screenshots (optional)'}
            </span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />
              <span className="text-xs text-red-300 font-medium">Error</span>
            </div>
            <p className="text-xs text-red-200 mt-1">{error}</p>
          </div>
        )}

        {/* Results Display */}
        {module.status === 'done' || module.status === 'warning' ? (
          <div className="space-y-3">
            <div className="text-sm text-green-400 uppercase tracking-wider font-bold flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 animate-pulse" />
              Automation Completed
            </div>

            {outputs.automationResult && (
              <div className="space-y-2">
                <div className={`px-3 py-2 rounded-lg border ${outputs.automationResult.validation_passed ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                  <div className="text-xs text-gray-400">Status</div>
                  <div className={`text-sm font-semibold ${outputs.automationResult.validation_passed ? 'text-green-300' : 'text-yellow-300'}`}>
                    {outputs.automationResult.status.toUpperCase()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`px-2 py-1 rounded ${outputs.automationResult.metadata_uploaded ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                    {outputs.automationResult.metadata_uploaded ? '✓' : '✗'} Metadata
                  </div>
                  <div className={`px-2 py-1 rounded ${outputs.automationResult.icon_uploaded ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                    {outputs.automationResult.icon_uploaded ? '✓' : '✗'} Icon
                  </div>
                  <div className={`px-2 py-1 rounded ${outputs.automationResult.screenshots_uploaded ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                    {outputs.automationResult.screenshots_uploaded ? '✓' : '✗'} Screenshots
                  </div>
                  <div className={`px-2 py-1 rounded ${outputs.automationResult.build_selected ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                    {outputs.automationResult.build_selected ? '✓' : '✗'} Build
                  </div>
                </div>

                {outputs.automationResult.errors.length > 0 && (
                  <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="text-xs text-red-400 font-semibold mb-1">Errors</div>
                    {outputs.automationResult.errors.map((err, i) => (
                      <div key={i} className="text-xs text-red-300">• {err}</div>
                    ))}
                  </div>
                )}

                {outputs.appStoreUrl && (
                  <a
                    href={outputs.appStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center text-sm text-blue-300 hover:bg-blue-500/20 transition-colors"
                  >
                    🌐 Open in App Store Connect
                  </a>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#2A2A2A]">
        <button
          onClick={handleRun}
          disabled={isProcessing || !inputs.buildConfig || !hasMetadataInput}
          className={`w-full px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            isProcessing
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : !inputs.buildConfig || !hasMetadataInput
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 shadow-lg'
          }`}
        >
          {isProcessing ? '⏳ Running Automation...' : '🚀 Run App Store Connect'}
        </button>
      </div>
    </div>
  );
}

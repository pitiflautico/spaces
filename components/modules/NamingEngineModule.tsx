'use client';

import React, { useState } from 'react';
import { useSpaceStore } from '@/lib/store';
import type { Module, NamingEngineOutputs, NamingPackage, ChosenName, AIConfiguration } from '@/types';
import { AIProvider } from '@/types';
import { CheckCircleIcon, SparklesIcon, ExclamationTriangleIcon, LightBulbIcon, LanguageIcon } from '@heroicons/react/24/outline';
import aiProvider from '@/lib/ai-provider';
import '@/lib/adapters'; // Initialize adapters
import NamingPanel from './NamingPanel';

interface NamingEngineModuleProps {
  module: Module;
}

// Predefined AI models per provider
const AI_MODELS = {
  [AIProvider.REPLICATE]: [
    { id: 'meta/meta-llama-3-70b-instruct', name: 'Meta Llama 3 70B', description: 'Fast and powerful' },
    { id: 'meta/meta-llama-3.1-405b-instruct', name: 'Meta Llama 3.1 405B', description: 'Most powerful' },
  ],
  [AIProvider.TOGETHER]: [
    { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B Turbo', description: 'Recommended' },
    { id: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', name: 'Llama 3.1 405B Turbo', description: 'Most powerful' },
    { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B', description: 'Fast and efficient' },
  ],
  [AIProvider.OPENAI]: [
    { id: 'gpt-4', name: 'GPT-4', description: 'Most capable' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Faster GPT-4' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and affordable' },
  ],
  [AIProvider.ANTHROPIC]: [
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Most powerful' },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Balanced' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fastest' },
  ],
  [AIProvider.LOCAL]: [
    { id: 'mock-gpt-4', name: 'Mock GPT-4', description: 'Local testing' },
  ],
};

export default function NamingEngineModule({ module }: NamingEngineModuleProps) {
  const { updateModule, getCurrentSpace, addLog } = useSpaceStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const outputs = module.outputs as NamingEngineOutputs;
  const space = getCurrentSpace();

  // Initialize selectedNameForUI with current chosen name (if exists)
  const [selectedNameForUI, setSelectedNameForUI] = useState<string | null>(
    outputs?.chosenName?.final_name || null
  );

  // Get detected language from flowContext
  const detectedLanguage = outputs?.flowContext?.language || null;

  // Update selectedNameForUI when outputs change
  React.useEffect(() => {
    if (outputs?.chosenName?.final_name && !selectedNameForUI) {
      setSelectedNameForUI(outputs.chosenName.final_name);
    }
  }, [outputs?.chosenName?.final_name, selectedNameForUI]);

  // Get module inputs (will store AI config here)
  const inputs = (module.inputs || {}) as any;
  const selectedProvider: AIProvider = inputs.aiProvider || space?.configuration?.aiConfig?.provider || AIProvider.TOGETHER;
  const selectedModel = inputs.aiModel || AI_MODELS[selectedProvider as keyof typeof AI_MODELS]?.[0]?.id;

  const handleProviderChange = (provider: AIProvider) => {
    const defaultModel = AI_MODELS[provider]?.[0]?.id;
    updateModule(module.id, {
      inputs: {
        ...inputs,
        aiProvider: provider,
        aiModel: defaultModel,
      },
    });
  };

  const handleModelChange = (modelId: string) => {
    updateModule(module.id, {
      inputs: {
        ...inputs,
        aiModel: modelId,
      },
    });
  };

  const handleRun = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      updateModule(module.id, { status: 'running' });

      // Use module's own AI configuration
      if (!selectedProvider || !selectedModel) {
        throw new Error('Please select an AI provider and model.');
      }

      // Get input from connected module (Module 2 - AIE Engine)
      const connections = space?.connections || [];
      const incomingConnection = connections.find(
        (conn) => conn.targetModuleId === module.id && conn.targetPortId === 'in-1'
      );

      if (!incomingConnection) {
        throw new Error('No input connected. Connect output from AIE Engine module.');
      }

      // Get the source module
      const sourceModule = space?.modules.find((m) => m.id === incomingConnection.sourceModuleId);
      if (!sourceModule) {
        throw new Error('Source module not found. Please check the connection.');
      }

      if (!sourceModule.outputs.appIntelligence) {
        throw new Error(
          `El módulo "${sourceModule.name}" no tiene datos de salida.\n\n` +
          `Por favor, ejecuta primero el módulo AIE Engine:\n` +
          `1. Haz clic en el botón Play ▶ del módulo "${sourceModule.name}"\n` +
          `2. Espera a que termine (se pondrá verde)\n` +
          `3. Luego ejecuta este módulo Naming Engine`
        );
      }

      // Get the app intelligence data and flow context
      const appIntelligence = sourceModule.outputs.appIntelligence;
      const flowContext = sourceModule.outputs.flowContext || { language: 'en' }; // Default to English

      // Debug: Log language detection
      console.log('=== NAMING ENGINE - Language Detection ===');
      console.log('Source Module outputs.flowContext:', sourceModule.outputs.flowContext);
      console.log('Detected language:', flowContext.language);
      console.log('==========================================');

      // Build prompt for AI (with language from flow context)
      const prompt = buildNamingPrompt(appIntelligence, flowContext.language || 'en');

      // Debug: Log prompt excerpt
      console.log('=== NAMING ENGINE - Prompt Preview ===');
      console.log(prompt.substring(0, 500));
      console.log('======================================');

      // Get API key from space configuration
      const apiKey = getAPIKeyForProvider(selectedProvider, space?.configuration?.apiKeys || {});

      if (!apiKey && selectedProvider !== AIProvider.LOCAL) {
        throw new Error(`API key for ${selectedProvider} not configured. Please add it in Settings > API Keys.`);
      }

      const config: AIConfiguration = {
        provider: selectedProvider,
        model: selectedModel,
        temperature: 0.8, // Higher temperature for creativity
        maxTokens: 2048,
        apiKey
      };

      // Call AI provider
      addLog('info', `Generando nombres con ${config.provider} (${config.model || 'default'})...`, module.id);
      const response = await aiProvider.run(prompt, config);

      // Parse response
      let namingPackage: NamingPackage;
      try {
        namingPackage = JSON.parse(response.outputText);
      } catch (e) {
        // If JSON parsing fails, try to extract JSON from text
        const jsonMatch = response.outputText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          namingPackage = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('AI response is not valid JSON');
        }
      }

      // Auto-select recommended name as default chosen name
      const defaultChosenName: ChosenName = {
        final_name: namingPackage.recommended_name,
        chosen_at: new Date().toISOString(),
        source_module: 'NamingEngine',
        engine_version: '2.0.0'
      };

      // Enrich flow context with naming data
      const enrichedFlowContext: FlowContext = {
        ...flowContext, // Keep all data from Module 2
        appName: defaultChosenName.final_name, // Add final app name
        slogan: namingPackage.slogan, // Add slogan
      };

      // Debug: Log flow context enrichment
      console.log('=== NAMING ENGINE - Flow Context Enriched ===');
      console.log('App Name added:', enrichedFlowContext.appName);
      console.log('Slogan added:', enrichedFlowContext.slogan);
      console.log('Brand Colors (from M2):', enrichedFlowContext.brandColors);
      console.log('Full enriched FlowContext:', enrichedFlowContext);
      console.log('=============================================');

      // Create outputs with auto-selected recommended name + enriched flow context
      const newOutputs: NamingEngineOutputs = {
        namingPackage,
        chosenName: defaultChosenName, // Auto-select recommended name
        namingLog: `Naming package generated using ${response.providerUsed} (${response.model})\n` +
                   `Tokens used: ${response.tokensUsed || 'N/A'}\n` +
                   `Language: ${flowContext.language}\n` +
                   `Default name selected: ${defaultChosenName.final_name}\n` +
                   `Timestamp: ${new Date().toISOString()}`,
        flowContext: enrichedFlowContext, // Propagate enriched context to downstream modules
      };

      // Update module - status is 'done' (with auto-selected recommended name)
      updateModule(module.id, {
        status: 'done', // Done with auto-selected recommended name
        outputs: newOutputs
      });

      // Auto-select recommended name in UI
      setSelectedNameForUI(namingPackage.recommended_name);

      addLog('success', `Naming package generated. Recommended name: "${namingPackage.recommended_name}"`, module.id);

    } catch (err: any) {
      const errorMsg = err.message || 'Unknown error occurred';
      setError(errorMsg);
      updateModule(module.id, { status: 'error', errorMessage: errorMsg });
      addLog('error', errorMsg, module.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNameSelection = (selectedName: string) => {
    setSelectedNameForUI(selectedName);
  };

  const handleSetFinalName = () => {
    if (!selectedNameForUI || !outputs?.namingPackage) return;

    // Update chosen name object
    const chosenName: ChosenName = {
      final_name: selectedNameForUI,
      chosen_at: new Date().toISOString(),
      source_module: 'NamingEngine',
      engine_version: '2.0.0'
    };

    // Update flow context with new app name
    const updatedFlowContext: FlowContext = {
      ...outputs.flowContext,
      appName: selectedNameForUI, // Update app name
    };

    // Update outputs with new chosen name and updated flow context
    const updatedOutputs: NamingEngineOutputs = {
      ...outputs,
      chosenName,
      flowContext: updatedFlowContext, // Update flow context with new name
      namingLog: outputs.namingLog?.replace(/Default name selected:.*\n/, `Final name updated: ${selectedNameForUI}\n`) || ''
    };

    // Update module (stays in 'done' state)
    updateModule(module.id, {
      status: 'done',
      outputs: updatedOutputs
    });

    addLog('success', `Final name updated to: "${selectedNameForUI}"`, module.id);
  };

  // Listen for external run trigger from ModuleBlock Play button
  React.useEffect(() => {
    const handleExternalRun = (event: any) => {
      if (event.detail?.moduleId === module.id) {
        handleRun();
      }
    };

    window.addEventListener('naming-engine-run', handleExternalRun as EventListener);
    return () => window.removeEventListener('naming-engine-run', handleExternalRun as EventListener);
  }, [module.id, handleRun]);

  // Determine status light color
  const getStatusLight = () => {
    if (module.status === 'done' && outputs?.chosenName) {
      return '🟢'; // Green - final name selected
    } else if (module.status === 'warning' && outputs?.namingPackage) {
      return '🟡'; // Yellow - pending selection
    } else if (module.status === 'error') {
      return '🔴'; // Red - error
    } else if (module.status === 'invalid') {
      return '🟠'; // Orange - outdated
    } else {
      return '⚪'; // Gray - idle
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Light */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0A0A0A]/50 border border-[#3A3A3A]/50 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getStatusLight()}</span>
          <span className="text-xs text-gray-400">
            {module.status === 'warning' && outputs?.namingPackage ? 'Pending Name Selection' :
             module.status === 'done' && outputs?.chosenName ? `Selected: ${outputs.chosenName.final_name}` :
             module.status === 'invalid' ? 'Outdated - Re-run Required' :
             'Ready to Generate Names'}
          </span>
        </div>
        <LightBulbIcon className="w-5 h-5 text-orange-400" />
      </div>

      {/* Info */}
      <div className="px-3 py-2 bg-[#0A0A0A]/50 border border-[#3A3A3A]/50 rounded-lg">
        <p className="text-xs text-gray-400">
          Generate creative names for your app using AI. Connect from AIE Engine to get started.
        </p>
      </div>

      {/* Language Indicator - Show detected language from upstream */}
      {detectedLanguage ? (
        <div className={`px-3 py-2 ${detectedLanguage === 'en' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-blue-500/10 border-blue-500/30'} border rounded-lg`}>
          <div className="flex items-center gap-2">
            <LanguageIcon className={`w-4 h-4 ${detectedLanguage === 'en' ? 'text-yellow-400' : 'text-blue-400'}`} />
            <span className={`text-xs ${detectedLanguage === 'en' ? 'text-yellow-300' : 'text-blue-300'} font-medium`}>Target Language:</span>
            <span className="text-lg">{getLanguageFlag(detectedLanguage)}</span>
            <span className={`text-xs ${detectedLanguage === 'en' ? 'text-yellow-200' : 'text-blue-200'} font-semibold`}>{getLanguageName(detectedLanguage)}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Names and descriptions will be generated in this language
          </p>
          {detectedLanguage === 'en' && (
            <div className="mt-2 px-2 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded text-xs text-yellow-200">
              ⚠️ If you changed the language in Module 2, you need to <strong>re-run Module 2</strong> first!
            </div>
          )}
        </div>
      ) : (
        <div className="px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-yellow-300 font-medium">No language detected</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Please run AIE Engine (Module 2) first to set the language
          </p>
        </div>
      )}

      {/* AI Model Selector */}
      <div className="space-y-3">
        <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-2">
          <SparklesIcon className="w-4 h-4 text-orange-400" />
          AI Model
        </div>

        {/* Model Selector */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">
            Select Model ({selectedProvider})
          </label>
          <select
            value={selectedModel}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
          >
            {AI_MODELS[selectedProvider as keyof typeof AI_MODELS]?.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} - {model.description}
              </option>
            ))}
          </select>
        </div>

        {/* API Key Status - Only show if missing */}
        {selectedProvider !== AIProvider.LOCAL && !space?.configuration?.apiKeys?.[selectedProvider.toLowerCase()] && (
          <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-red-400">⚠️ API Key Missing</span>
              <span className="text-gray-400">Add {selectedProvider} key in Settings</span>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />
            <span className="text-xs text-red-300 font-medium">Error</span>
          </div>
          <p className="text-xs text-red-200 mt-1">{error}</p>
        </div>
      )}

      {/* Info: Recommended name auto-selected */}
      {module.status === 'done' && outputs?.chosenName && outputs?.namingPackage && (
        <div className="px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-blue-300 font-medium">Current name: <strong>{outputs.chosenName.final_name}</strong> - You can change it below.</span>
          </div>
        </div>
      )}

      {/* Outputs Section - Name Selection */}
      {outputs?.namingPackage && (
        <div className="space-y-4 pt-4 border-t-2 border-orange-500/30 bg-orange-500/5 -mx-3 px-3 py-4 rounded-b-xl">
          {/* Header */}
          <div className="text-sm text-orange-400 uppercase tracking-wider font-bold flex items-center gap-2">
            <LightBulbIcon className="w-5 h-5 text-orange-400" />
            {outputs.chosenName ? '✓ Name Selected' : '📝 Name Suggestions'}
          </div>

          {/* Recommended Name */}
          <div className="px-4 py-3 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/30 rounded-lg">
            <span className="text-sm text-orange-400 font-semibold">⭐ Recommended</span>
            <p className="text-lg text-white font-bold mt-2">{outputs.namingPackage.recommended_name}</p>
            <p className="text-sm text-gray-300 mt-1 italic">"{outputs.namingPackage.slogan}"</p>
          </div>

          {/* Name Selection UI - Always visible, allows changing selection */}
          <div className="px-4 py-3 bg-[#0A0A0A]/80 border border-[#3A3A3A] rounded-lg">
            <span className="text-sm text-gray-400 font-semibold mb-3 block">
              {outputs.chosenName ? 'CHANGE NAME (Optional)' : 'SELECT NAME'}
            </span>

            <div className="space-y-2">
              {/* Recommended */}
              <label className="flex items-center gap-3 p-2 bg-[#1A1A1A] border border-[#3A3A3A] rounded cursor-pointer hover:border-orange-500/50 transition-colors">
                <input
                  type="radio"
                  name="finalName"
                  value={outputs.namingPackage.recommended_name}
                  checked={selectedNameForUI === outputs.namingPackage.recommended_name}
                  onChange={(e) => handleNameSelection(e.target.value)}
                  className="w-4 h-4 text-orange-500"
                />
                <span className="text-sm text-white font-medium">{outputs.namingPackage.recommended_name}</span>
                <span className="text-xs text-orange-400 ml-auto">★ Recommended</span>
              </label>

              {/* Alternatives */}
              {outputs.namingPackage.alternatives.map((alt, i) => (
                <label key={i} className="flex items-center gap-3 p-2 bg-[#1A1A1A] border border-[#3A3A3A] rounded cursor-pointer hover:border-orange-500/50 transition-colors">
                  <input
                    type="radio"
                    name="finalName"
                    value={alt}
                    checked={selectedNameForUI === alt}
                    onChange={(e) => handleNameSelection(e.target.value)}
                    className="w-4 h-4 text-orange-500"
                  />
                  <span className="text-sm text-white">{alt}</span>
                </label>
              ))}
            </div>

            {/* Update Name Button - only show if selection is different from current */}
            {selectedNameForUI && selectedNameForUI !== outputs.chosenName?.final_name && (
              <button
                onClick={handleSetFinalName}
                className="w-full mt-4 px-4 py-2 rounded-lg font-medium text-sm bg-orange-500 hover:bg-orange-600 text-white transition-colors"
              >
                ✓ Update to "{selectedNameForUI}"
              </button>
            )}

            {selectedNameForUI === outputs.chosenName?.final_name && (
              <div className="mt-4 px-4 py-2 text-center text-xs text-green-400">
                ✓ This is your current selection
              </div>
            )}
          </div>

          {/* Final Name Display (when chosen) */}
          {outputs.chosenName && (
            <div className="px-4 py-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                <span className="text-sm text-green-400 font-semibold">Final Name</span>
              </div>
              <p className="text-2xl text-white font-bold mt-2">{outputs.chosenName.final_name} ✔</p>
              <p className="text-xs text-gray-400 mt-1">Selected at: {new Date(outputs.chosenName.chosen_at).toLocaleString()}</p>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="px-3 py-2 bg-[#0A0A0A]/80 border border-[#3A3A3A] rounded">
              <span className="text-xs text-gray-400">Style</span>
              <p className="text-sm text-white mt-1">{outputs.namingPackage.style}</p>
            </div>
            <div className="px-3 py-2 bg-[#0A0A0A]/80 border border-[#3A3A3A] rounded">
              <span className="text-xs text-gray-400">Tone</span>
              <p className="text-sm text-white mt-1">{outputs.namingPackage.tone}</p>
            </div>
          </div>

          {/* Flow Context Preview - Data ready for Module 4+ */}
          {outputs.flowContext && (
            <div className="px-4 py-3 bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-green-400 font-semibold">Data Ready for Next Modules</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {outputs.flowContext.appName && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">App:</span>
                    <span className="text-white font-medium">{outputs.flowContext.appName}</span>
                  </div>
                )}
                {outputs.flowContext.brandColors && outputs.flowContext.brandColors.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Colors:</span>
                    <div className="flex gap-1">
                      {outputs.flowContext.brandColors.slice(0, 3).map((color, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded border border-white/20"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {outputs.flowContext.category && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Category:</span>
                    <span className="text-white">{outputs.flowContext.category}</span>
                  </div>
                )}
                {outputs.flowContext.designStyle && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Style:</span>
                    <span className="text-white truncate" title={outputs.flowContext.designStyle}>
                      {outputs.flowContext.designStyle.substring(0, 20)}...
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2 italic">
                ℹ️ This data will be available to Icon Generator and future modules
              </p>
            </div>
          )}

          {/* Open Naming Panel Button */}
          <button
            onClick={() => setIsPanelOpen(true)}
            className="w-full px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-sm text-blue-400 transition-colors"
          >
            📋 Open Naming Panel (Full Details)
          </button>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-blue-300">Generating names with AI...</span>
          </div>
        </div>
      )}

      {/* Naming Panel */}
      {isPanelOpen && outputs?.namingPackage && (
        <NamingPanel
          isOpen={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
          namingPackage={outputs.namingPackage}
          chosenName={outputs.chosenName}
          namingLog={outputs.namingLog}
        />
      )}
    </div>
  );
}

/**
 * Build optimized prompt for naming generation
 */
function buildNamingPrompt(appIntelligence: any, language: string = 'en'): string {
  // Get market and cultural context based on language
  const marketContext = getMarketContext(language);

  // Language-specific instructions - EXTREMELY ENFORCED
  const languageInstructions = language === 'en'
    ? ''
    : `

═══════════════════════════════════════════════════════════
🚨 CRITICAL LANGUAGE REQUIREMENT - READ CAREFULLY 🚨
═══════════════════════════════════════════════════════════

YOU MUST RESPOND ENTIRELY IN ${getLanguageName(language).toUpperCase()}.

This is NOT optional. This is MANDATORY.

Required language for ALL text fields: ${getLanguageName(language).toUpperCase()}

Specifically, these fields MUST be in ${getLanguageName(language)}:
✓ slogan - MUST be in ${getLanguageName(language)}
✓ creative_rationale - MUST be in ${getLanguageName(language)}
✓ style - MUST be in ${getLanguageName(language)}
✓ tone - MUST be in ${getLanguageName(language)}
✓ short_descriptions - MUST be in ${getLanguageName(language)}
✓ naming_keywords - MUST be in ${getLanguageName(language)}
✓ branding.branding_concept - MUST be in ${getLanguageName(language)}
✓ branding.visual_direction - MUST be in ${getLanguageName(language)}
✓ branding.color_meanings - MUST be in ${getLanguageName(language)}
✓ branding.brand_values - MUST be in ${getLanguageName(language)}

The brand name itself (recommended_name, alternatives) can be in English
if it's a brandable English word, BUT all descriptions, rationale,
and explanatory text MUST be in ${getLanguageName(language)}.

If you respond in English when ${getLanguageName(language)} is required,
the output will be REJECTED.

═══════════════════════════════════════════════════════════
`;

  const languageHeader = `LANGUAGE: ${getLanguageName(language).toUpperCase()}
TARGET MARKET: ${marketContext.market}
CULTURAL CONTEXT: ${marketContext.culture}${languageInstructions}`;

  return `${languageHeader}

You are an expert brand naming specialist for the ${marketContext.market} market. Generate creative, memorable names for an app based on this intelligence:

APP SUMMARY:
${appIntelligence.summary}

CATEGORY: ${appIntelligence.category}
TARGET AUDIENCE: ${appIntelligence.targetAudience}
TONE: ${appIntelligence.tone}
DESIGN STYLE: ${appIntelligence.designStyle}

KEY FEATURES:
${appIntelligence.features.slice(0, 5).map((f: string) => `- ${f}`).join('\n')}

KEYWORDS: ${appIntelligence.keywords.slice(0, 10).join(', ')}

COMPETITIVE ANGLE: ${appIntelligence.competitiveAngle}

Generate a COMPLETE BRANDING PACKAGE with naming AND visual identity:

{
  "recommended_name": "Best name suggestion (short, memorable, brandable)",
  "alternatives": ["Alternative 1", "Alternative 2", "Alternative 3"],
  "slogan": "A catchy slogan or tagline",
  "creative_rationale": "Explanation of why the recommended name works",
  "naming_keywords": ["keyword1", "keyword2", "keyword3"],
  "short_descriptions": [
    "Short description option 1",
    "Short description option 2"
  ],
  "domain_suggestions": [
    "domain1.com",
    "domain2.app",
    "domain3.io"
  ],
  "style": "Overall design style",
  "tone": "Brand tone",

  "branding": {
    "design_style": "Complete style description (e.g., modern minimalist, vintage elegant, bold futuristic)",
    "color_palette": ["#HEX1", "#HEX2", "#HEX3", "#HEX4"],
    "color_meanings": ["What color 1 represents", "What color 2 represents", "..."],

    "primary_font_family": "Main font recommendation (e.g., Inter, Roboto, Playfair Display)",
    "secondary_font_family": "Complementary font (e.g., Open Sans, Montserrat)",
    "font_style": "Typography style description (e.g., sans-serif modern, serif classic)",

    "brand_tone": "Overall personality (e.g., professional, playful, elegant, bold)",
    "brand_values": ["Core value 1", "Core value 2", "Core value 3"],
    "target_emotion": "Main emotion to evoke (e.g., trust, excitement, calm)",

    "shape_style": "Geometric style (e.g., rounded soft, sharp angular, geometric)",
    "icon_style": "Icon approach (e.g., minimalist line, detailed illustration, abstract)",

    "branding_concept": "Overall concept explanation - what this brand represents visually",
    "visual_direction": "How the brand should look and feel - concrete visual guidance"
  }
}

Important guidelines:

NAMING:
- Names should be 1-2 words, easy to pronounce and remember in ${marketContext.market}
- Consider domain availability (.com, .app, .io) and ${marketContext.domainPreference}
- Match the tone and style of the app for ${marketContext.market} audiences
- ${marketContext.namingGuidelines}
- Avoid cultural sensitivities or problematic meanings in ${marketContext.culture}

BRANDING - CRITICAL FOR LOGO GENERATION:
- color_palette: Select 3-4 HEX colors that work harmoniously and match the app's purpose
- design_style: Be specific (e.g., "modern minimalist with rounded edges" not just "modern")
- primary_font_family: Choose real font names that exist (Inter, Roboto, Playfair, Montserrat, etc.)
- shape_style: Guide the geometric style of logos/icons (rounded, sharp, geometric, organic)
- icon_style: Describe the visual style clearly for logo generation
- branding_concept: Explain the WHY behind the visual choices
- visual_direction: Give concrete guidance on how logos/icons should look

The branding information will be used by AI to generate logos, so be SPECIFIC and DETAILED.

${language !== 'en' ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 FINAL REMINDER: OUTPUT LANGUAGE = ${getLanguageName(language).toUpperCase()} 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write ALL text fields in ${getLanguageName(language)}:
- slogan → in ${getLanguageName(language)}
- creative_rationale → in ${getLanguageName(language)}
- style → in ${getLanguageName(language)}
- tone → in ${getLanguageName(language)}
- short_descriptions → in ${getLanguageName(language)}
- naming_keywords → in ${getLanguageName(language)}
- branding.branding_concept → in ${getLanguageName(language)}
- branding.visual_direction → in ${getLanguageName(language)}
- branding.color_meanings → in ${getLanguageName(language)}
- branding.brand_values → in ${getLanguageName(language)}

Font names and technical terms (like "Inter", "Roboto", color hex codes) stay in English.

DO NOT write these in English. Use ${getLanguageName(language)}.
` : ''}

Respond ONLY with the JSON object, no additional text.`;
}

/**
 * Get language name from language code
 */
function getLanguageName(code: string): string {
  const languageMap: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    pt: 'Portuguese',
    it: 'Italian',
    ja: 'Japanese',
    zh: 'Chinese',
  };
  return languageMap[code] || 'English';
}

/**
 * Get language flag emoji from language code
 */
function getLanguageFlag(code: string): string {
  const flagMap: Record<string, string> = {
    en: '🇺🇸',
    es: '🇪🇸',
    fr: '🇫🇷',
    de: '🇩🇪',
    pt: '🇵🇹',
    it: '🇮🇹',
    ja: '🇯🇵',
    zh: '🇨🇳',
  };
  return flagMap[code] || '🌐';
}

/**
 * Get market context based on language code
 */
function getMarketContext(code: string): {
  market: string;
  culture: string;
  domainPreference: string;
  namingGuidelines: string;
} {
  const marketMap: Record<string, {
    market: string;
    culture: string;
    domainPreference: string;
    namingGuidelines: string;
  }> = {
    en: {
      market: 'United States / English-speaking countries',
      culture: 'American/Anglo-Saxon culture - values innovation, simplicity, and tech-forward branding',
      domainPreference: 'prefer .com, .io, or .app extensions',
      namingGuidelines: 'Be creative and modern - tech startups often use invented words, portmanteaus, or shortened names (e.g., Stripe, Figma, Notion)',
    },
    es: {
      market: 'Spain / Spanish-speaking countries (LATAM)',
      culture: 'Spanish/Latin American culture - values warmth, personal connection, and clear communication',
      domainPreference: 'prefer .com or .es extensions',
      namingGuidelines: 'Names should be pronounceable in Spanish and avoid anglicisms that sound awkward - consider using Spanish words or international terms that work well in Spanish',
    },
    fr: {
      market: 'France / French-speaking countries',
      culture: 'French culture - values elegance, sophistication, and linguistic purity',
      domainPreference: 'prefer .com or .fr extensions',
      namingGuidelines: 'French audiences appreciate names that respect the language - avoid anglicisms unless they are widely adopted tech terms',
    },
    de: {
      market: 'Germany / German-speaking countries',
      culture: 'German culture - values precision, efficiency, and quality',
      domainPreference: 'prefer .com or .de extensions',
      namingGuidelines: 'German names often favor compound words or descriptive names - clarity and functionality are key',
    },
    pt: {
      market: 'Brazil / Portuguese-speaking countries',
      culture: 'Brazilian/Portuguese culture - values creativity, energy, and accessibility',
      domainPreference: 'prefer .com or .com.br extensions',
      namingGuidelines: 'Names should be easy to pronounce in Portuguese and feel approachable - avoid complex English terms',
    },
    it: {
      market: 'Italy / Italian-speaking regions',
      culture: 'Italian culture - values style, creativity, and craftsmanship',
      domainPreference: 'prefer .com or .it extensions',
      namingGuidelines: 'Italian audiences appreciate melodic, aesthetically pleasing names - consider Italian words or international terms that sound good in Italian',
    },
    ja: {
      market: 'Japan / Japanese-speaking regions',
      culture: 'Japanese culture - values harmony, precision, and attention to detail',
      domainPreference: 'prefer .com or .jp extensions',
      namingGuidelines: 'Names should be easy to write in katakana if using foreign words, or use simple kanji/hiragana combinations - avoid complex foreign pronunciations',
    },
    zh: {
      market: 'China / Chinese-speaking regions',
      culture: 'Chinese culture - values auspiciousness, harmony, and modernity',
      domainPreference: 'prefer .com or .cn extensions',
      namingGuidelines: 'Consider Chinese phonetics and meanings - foreign brand names often need Chinese adaptations that sound similar and have positive meanings',
    },
  };

  return marketMap[code] || marketMap['en'];
}

/**
 * Get API key for the selected provider
 */
function getAPIKeyForProvider(provider: AIProvider, apiKeys: Record<string, string | undefined>): string | undefined {
  switch (provider) {
    case AIProvider.OPENAI:
      return apiKeys.openai;
    case AIProvider.ANTHROPIC:
      return apiKeys.anthropic;
    case AIProvider.REPLICATE:
      return apiKeys.replicate;
    case AIProvider.TOGETHER:
      return apiKeys.together;
    case AIProvider.LOCAL:
      return undefined; // Mock doesn't need API key
    default:
      return undefined;
  }
}

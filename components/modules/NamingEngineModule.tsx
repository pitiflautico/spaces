'use client';

import React, { useState } from 'react';
import { useSpaceStore } from '@/lib/store';
import type { Module, NamingEngineOutputs, NamingPackage, ChosenName, AIConfiguration } from '@/types';
import { AIProvider } from '@/types';
import { CheckCircleIcon, SparklesIcon, ExclamationTriangleIcon, LightBulbIcon } from '@heroicons/react/24/outline';
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
  const [selectedNameForUI, setSelectedNameForUI] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const outputs = module.outputs as NamingEngineOutputs;
  const space = getCurrentSpace();

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

      // Build prompt for AI (with language from flow context)
      const prompt = buildNamingPrompt(appIntelligence, flowContext.language || 'en');

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

      // Create outputs (without chosen name yet) + propagate flow context
      const newOutputs: NamingEngineOutputs = {
        namingPackage,
        namingLog: `Naming package generated using ${response.providerUsed} (${response.model})\n` +
                   `Tokens used: ${response.tokensUsed || 'N/A'}\n` +
                   `Language: ${flowContext.language}\n` +
                   `Timestamp: ${new Date().toISOString()}`,
        flowContext, // Propagate to downstream modules
      };

      // Update module - status is 'warning' to indicate pending selection
      updateModule(module.id, {
        status: 'warning', // Yellow state = pending selection
        outputs: newOutputs
      });

      addLog('success', `Naming package generated. Please select a final name.`, module.id);

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

    // Create chosen name object
    const chosenName: ChosenName = {
      final_name: selectedNameForUI,
      chosen_at: new Date().toISOString(),
      source_module: 'NamingEngine',
      engine_version: '2.0.0'
    };

    // Update outputs with chosen name
    const updatedOutputs: NamingEngineOutputs = {
      ...outputs,
      chosenName
    };

    // Update module to 'done' state
    updateModule(module.id, {
      status: 'done',
      outputs: updatedOutputs
    });

    addLog('success', `Final name selected: "${selectedNameForUI}"`, module.id);
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

      {/* Pending Selection Warning */}
      {module.status === 'warning' && outputs?.namingPackage && !outputs?.chosenName && (
        <div className="px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-yellow-300 font-medium">⚠ Please choose a final name to continue.</span>
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

          {/* Final Name Selection UI - Only show if no name chosen yet */}
          {!outputs.chosenName && (
            <div className="px-4 py-3 bg-[#0A0A0A]/80 border border-[#3A3A3A] rounded-lg">
              <span className="text-sm text-gray-400 font-semibold mb-3 block">FINAL NAME SELECTION</span>

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

              {/* Set Final Name Button */}
              <button
                onClick={handleSetFinalName}
                disabled={!selectedNameForUI}
                className={`w-full mt-4 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  selectedNameForUI
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                🔵 Set as Final Name
              </button>
            </div>
          )}

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
  // Language-specific instructions
  const languageInstructions = language === 'en'
    ? ''
    : `\n\nIMPORTANT: Generate ALL text outputs (names, slogans, descriptions, rationale) in ${getLanguageName(language)}. The JSON structure remains the same, but all string values must be in ${getLanguageName(language)}.`;

  return `You are an expert brand naming specialist. Generate creative, memorable names for an app based on this intelligence:

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

Generate a naming package with the following structure:

{
  "recommended_name": "Best name suggestion (short, memorable, brandable)",
  "alternatives": ["Alternative 1", "Alternative 2", "Alternative 3"],
  "style": "Description of naming style (e.g., Modern / Short / Tech-friendly)",
  "slogan": "A catchy slogan or tagline",
  "creative_rationale": "Explanation of why the recommended name works",
  "naming_keywords": ["keyword1", "keyword2", "keyword3"],
  "tone": "Tone of the names (e.g., friendly / energetic / professional)",
  "short_descriptions": [
    "Short description option 1",
    "Short description option 2"
  ],
  "domain_suggestions": [
    "domain1.com",
    "domain2.app",
    "domain3.io"
  ]
}

Important guidelines:
- Names should be 1-2 words, easy to pronounce and remember
- Consider domain availability (.com, .app, .io)
- Match the tone and style of the app
- Be creative but professional
- Consider international audiences (avoid problematic meanings)${languageInstructions}

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

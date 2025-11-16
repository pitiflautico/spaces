'use client';

import React, { useState } from 'react';
import { useSpaceStore } from '@/lib/store';
import type { Module, NamingEngineOutputs, NamingPackage, ChosenName, AIConfiguration, FlowContext } from '@/types';
import { AIProvider } from '@/types';
import { CheckCircleIcon, SparklesIcon, ExclamationTriangleIcon, LightBulbIcon, LanguageIcon } from '@heroicons/react/24/outline';
import aiProvider from '@/lib/ai-provider';
import { AI_MODELS, getDefaultModelForProvider } from '@/lib/ai-models';
import '@/lib/adapters'; // Initialize adapters
import NamingPanel from './NamingPanel';

interface NamingEngineModuleProps {
  module: Module;
}

export default function NamingEngineModule({ module }: NamingEngineModuleProps) {
  const { updateModule, addLog } = useSpaceStore();
  // Use reactive selector to always get fresh space data (including API keys)
  const space = useSpaceStore(state => state.spaces.find(s => s.id === state.currentSpaceId));
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const outputs = module.outputs as NamingEngineOutputs;

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

      // Get API key from space configuration (aiConfig stores key for selected provider)
      const apiKey = space?.configuration?.aiConfig?.provider === selectedProvider
        ? space?.configuration?.aiConfig?.apiKey
        : undefined;

      if (!apiKey && selectedProvider !== AIProvider.LOCAL) {
        throw new Error(`API key for ${selectedProvider} not configured. Please add it in Settings > AI Provider.`);
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

      // Debug: Log what we received
      console.log('=== NAMING ENGINE - Parsed Response ===');
      console.log('Has branding field:', !!namingPackage.branding);
      if (namingPackage.branding) {
        console.log('Branding keys:', Object.keys(namingPackage.branding));
      }
      console.log('Full naming package:', JSON.stringify(namingPackage, null, 2));
      console.log('========================================');

      // VALIDATION: Ensure branding exists - create fallback if missing
      if (!namingPackage.branding) {
        console.warn('⚠️ AI did not return branding field. Creating fallback branding...');

        // Extract app context for detailed visual direction
        const appCategory = appIntelligence?.category || 'application';
        const appSummary = appIntelligence?.summary || 'the application';
        const targetAudience = appIntelligence?.targetAudience || 'general users';
        const keyFeatures = appIntelligence?.features?.slice(0, 3).join(', ') || 'core features';
        const competitiveAngle = appIntelligence?.competitiveAngle || 'quality and usability';

        // Create intelligent fallback branding with MODERN typography and style
        // Use one of the 8 predefined styles
        namingPackage.branding = {
          design_style: 'Tech & Modern with bold typography and sharp geometric forms',
          color_palette: appIntelligence?.brandColorsSuggested || ['#1A1A1A', '#FF6B6B', '#4A9EFF', '#F5F5F5'],
          color_meanings: [
            'Deep neutral - represents sophistication and modernity',
            'Vibrant accent - creates energy and focal points',
            'Tech blue - signals digital innovation',
            'Clean background - ensures clarity and breathing room'
          ],
          primary_font_family: 'Space Grotesk',
          secondary_font_family: 'Inter',
          font_style: 'Bold geometric sans-serif with tight letter-spacing for impact',
          brand_tone: namingPackage.tone || 'confident and contemporary',
          brand_values: namingPackage.naming_keywords?.slice(0, 3) || ['Innovation', 'Precision', 'Simplicity'],
          target_emotion: 'trust and forward-thinking confidence',
          shape_style: 'Sharp geometric with subtle rounded corners (4-8px radius)',
          icon_style: 'Minimalist line icons with 2px stroke weight and geometric precision',
          branding_concept: `${namingPackage.recommended_name} is a ${appCategory} app designed for ${targetAudience}. The visual identity uses typography as the hero element, combining ${namingPackage.style || 'modern minimalist'} aesthetics with bold, confident type treatment. The brand differentiates through ${competitiveAngle} while maintaining a ${namingPackage.tone || 'contemporary'} personality that feels both professional and approachable.`,
          visual_direction: `This is ${appSummary}. Target users: ${targetAudience} who appreciate modern, design-forward digital products. Key features to represent: ${keyFeatures}.

Brand personality: Bold, technical, accessible, forward-thinking.

Visual approach: Strong typographic focus with Space Grotesk as the hero typeface. The logo should be typography-driven, possibly a distinctive wordmark or logotype with custom letter modifications. If using a symbol, keep it minimal and geometric - think Linear's minimalism meets Stripe's sophistication.

Mood: ${namingPackage.tone || 'Confident and contemporary'} - should feel premium and intentional without being pretentious. Clean and purposeful rather than decorative.

Include: Sharp geometric shapes, negative space usage, strong contrast, subtle gradients only if they enhance rather than decorate.

Avoid: Generic rounded bubbles, overly complex illustrations, corporate blue clichés, outdated web 2.0 glossy effects. Keep it scalable and clear from 16px to large format.

Logo treatment: Strongly prefer a sophisticated wordmark/logotype with distinctive typography over generic icon+text combinations.`
        };

        addLog('warning', 'Branding data was generated as fallback. For best results, re-run with updated AI model.', module.id);
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
        {selectedProvider !== AIProvider.LOCAL &&
          !(space?.configuration?.aiConfig?.provider === selectedProvider &&
            space?.configuration?.aiConfig?.apiKey) && (
          <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-red-400">⚠️ API Key Missing</span>
              <span className="text-gray-400">Add {selectedProvider} key in Settings > AI Provider</span>
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

          {/* Branding Preview - Collapsible */}
          {outputs.namingPackage.branding && (
            <div className="bg-gradient-to-br from-pink-500/5 to-purple-500/5 border border-pink-500/20 rounded-lg overflow-hidden">
              <details className="group/branding">
                <summary className="px-4 py-3 cursor-pointer hover:bg-pink-500/10 transition-colors list-none">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-pink-400 font-semibold">🎨 Branding Preview</span>
                      <span className="text-xs text-gray-500">(click to expand/collapse)</span>
                    </div>
                    <svg className="w-4 h-4 text-pink-400 transition-transform group-open/branding:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </summary>

                <div className="px-4 pb-3 space-y-3 border-t border-pink-500/20">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="px-3 py-2 bg-[#0A0A0A]/80 border border-pink-500/30 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Design Style</p>
                    <p className="text-xs text-white font-medium">{outputs.namingPackage.branding.design_style}</p>
                  </div>
                  <div className="px-3 py-2 bg-[#0A0A0A]/80 border border-pink-500/30 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Brand Tone</p>
                    <p className="text-xs text-white font-medium">{outputs.namingPackage.branding.brand_tone}</p>
                  </div>
                </div>

                {/* Color Palette Preview */}
                <div className="px-3 py-2 bg-[#0A0A0A]/80 border border-pink-500/30 rounded-lg">
                  <p className="text-xs text-gray-400 mb-2">Color Palette</p>
                  <div className="flex gap-2">
                    {outputs.namingPackage.branding.color_palette.map((color, i) => (
                      <div key={i} className="flex-1">
                        <div
                          className="w-full h-10 rounded border border-white/20"
                          style={{ backgroundColor: color }}
                          title={`${color}${outputs.namingPackage.branding.color_meanings?.[i] ? ` - ${outputs.namingPackage.branding.color_meanings[i]}` : ''}`}
                        />
                        <p className="text-xs text-gray-400 mt-1 text-center font-mono">{color}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Typography */}
                <div className="px-3 py-2 bg-[#0A0A0A]/80 border border-pink-500/30 rounded-lg">
                  <p className="text-xs text-gray-400 mb-2">Typography</p>
                  <div className="space-y-1">
                    <p className="text-xs text-white"><span className="text-gray-500">Primary:</span> {outputs.namingPackage.branding.primary_font_family}</p>
                    <p className="text-xs text-white"><span className="text-gray-500">Secondary:</span> {outputs.namingPackage.branding.secondary_font_family}</p>
                  </div>
                </div>

                {/* Visual Style */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="px-3 py-2 bg-[#0A0A0A]/80 border border-pink-500/30 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Shape Style</p>
                    <p className="text-xs text-white">{outputs.namingPackage.branding.shape_style}</p>
                  </div>
                  <div className="px-3 py-2 bg-[#0A0A0A]/80 border border-pink-500/30 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Icon Style</p>
                    <p className="text-xs text-white">{outputs.namingPackage.branding.icon_style}</p>
                  </div>
                </div>

                {/* Brand Values */}
                <div className="px-3 py-2 bg-[#0A0A0A]/80 border border-pink-500/30 rounded-lg">
                  <p className="text-xs text-gray-400 mb-2">Brand Values</p>
                  <div className="flex flex-wrap gap-1.5">
                    {outputs.namingPackage.branding.brand_values.map((value, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-pink-500/20 text-pink-300 text-xs rounded-full border border-pink-500/30"
                      >
                        {value}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Visual Direction */}
                <div className="px-3 py-2 bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/30 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Visual Direction</p>
                  <p className="text-xs text-gray-200 leading-relaxed">{outputs.namingPackage.branding.visual_direction}</p>
                </div>

                  {/* View Full Details Button */}
                  <button
                    onClick={() => setIsPanelOpen(true)}
                    className="w-full px-3 py-2 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 rounded-lg text-xs text-pink-400 font-medium transition-colors"
                  >
                    📋 View Complete Branding Details
                  </button>
                </div>
              </details>
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

    "branding_concept": "Overall concept explanation - what this brand represents visually and WHY (explain the app's purpose and how visuals reflect it)",
    "visual_direction": "DETAILED visual guidance for logo/icon generation - MUST include: what the app does, target users, key features to represent, mood/atmosphere, specific visual elements to include/avoid"
  }
}

Important guidelines:

NAMING:
- Names should be 1-2 words, easy to pronounce and remember in ${marketContext.market}
- Consider domain availability (.com, .app, .io) and ${marketContext.domainPreference}
- Match the tone and style of the app for ${marketContext.market} audiences
- ${marketContext.namingGuidelines}
- Avoid cultural sensitivities or problematic meanings in ${marketContext.culture}

BRANDING - CRITICAL FOR MODERN LOGO GENERATION:

🎨 COLOR PALETTE (3-4 colors):
- Choose contemporary, sophisticated color combinations
- Use trending palettes (e.g., Neo-mint + Coral, Deep Purple + Electric Blue, Sage + Terracotta)
- Consider gradients, duotones, or monochromatic schemes for modern appeal
- Colors must be HEX codes (e.g., #1A1A1A, #FF6B6B)

✍️ TYPOGRAPHY (CRITICAL - This is key for modern branding):
- primary_font_family: Select MODERN, DISTINCTIVE typefaces with character:
  * Geometric sans: Space Grotesk, Syne, Hanken Grotesk, Satoshi, Cabinet Grotesk
  * Neo-grotesque: Inter Display, Archivo, General Sans, Switzer
  * Display/Accent: Clash Display, Bespoke Sans, Supreme, Zodiak
  * Variable fonts with expressive weights
- secondary_font_family: Complementary font for hierarchy
  * If primary is geometric → use humanist (e.g., Work Sans, DM Sans)
  * If primary is display → use neutral (e.g., Inter, Geist)
- font_style: Describe the typographic approach (e.g., "Bold geometric with tight spacing", "Light display with generous leading", "Mixed weights for dynamic contrast")

🎭 DESIGN STYLE (Choose from these 8 predefined styles):

You MUST select ONE of these styles that best fits the project:

1. **Minimalist**: Simple, clean, geometric basics, smooth lines, neutral colors - modern and professional
2. **Bold & Loud**: High visual impact, thick shapes, strong contrasts, vibrant colors - energetic and modern
3. **Elegant**: Refined with elegant typography (serif/semi-serif), organic icons, soft tones - premium and sophisticated
4. **Playful**: Fun and friendly, rounded typography, cheerful icons, bright colors - youthful and approachable
5. **Tech & Modern**: Futuristic, gradients, modern sans-serif, abstract digital icons - contemporary tech style
6. **Classic**: Traditional serif, symmetric icon, sober colors (black/gold) - institutional and timeless
7. **Hand-Drawn**: Hand-illustrated, irregular lines, sketch typography, warm colors - artisanal and natural
8. **Abstract**: Fluid shapes, modern gradients, clean typography - dynamic and sophisticated

CRITICAL: Your design_style field MUST start with one of these EXACT style names: "Minimalist", "Bold & Loud", "Elegant", "Playful", "Tech & Modern", "Classic", "Hand-Drawn", or "Abstract"

Example: "Minimalist with sharp geometric forms and subtle gradients" ✓
Example: "Modern minimalist design" ✗ (doesn't start with exact style name)

You can add specific characteristics after the style name (rounded vs sharp, gradients vs flat, texture vs clean).

📐 SHAPE & ICON STYLE:
- shape_style: Geometric language (e.g., "Sharp 90° angles with thin strokes", "Rounded 12px radius with soft shadows", "Asymmetric organic forms")
- icon_style: Visual treatment for icons/symbols:
  * "Minimalist line icons (1-2px stroke)" (Feather, Lucide style)
  * "Filled geometric shapes with negative space" (Material, Phosphor style)
  * "Isometric 3D simplified forms" (Notion style)
  * "Abstract letterforms with typographic focus" (Wordmark style)
  * "Duotone illustrations with flat perspective" (Dropbox style)

💡 BRANDING CONCEPT & VISUAL DIRECTION:
- branding_concept: Explain the WHY - How does the visual identity reflect what the app DOES and its VALUES?
  * Connect visual choices to functionality (e.g., "Clean lines represent data clarity")
  * Explain the emotional goal (e.g., "Gradients evoke growth and progress")

- visual_direction: THIS IS CRITICAL - Detailed creative brief for AI:
  ✓ App purpose: "This is a [category] app for [target users] that [main benefit]"
  ✓ Target audience: Demographics, psychographics, design sophistication
  ✓ Key features to visualize: Top 3 features that should inspire visual elements
  ✓ Brand personality: 3-5 adjectives (e.g., "Bold, technical, accessible, forward-thinking")
  ✓ Mood/atmosphere: Emotional tone (e.g., "Confident and empowering, not intimidating")
  ✓ Visual references: Current brands with similar vibe (e.g., "Think Linear's minimalism meets Stripe's sophistication")
  ✓ Specific elements TO INCLUDE: Shapes, symbols, patterns that make sense
  ✓ Specific elements TO AVOID: What doesn't fit the brand
  ✓ Logo treatment preference: Wordmark vs symbol vs combination mark

🎯 MODERN BRANDING PRIORITIES:
1. TYPOGRAPHY IS HERO: The font choice and text treatment should be the primary brand element
2. SCALABLE SIMPLICITY: Must work from 16px favicon to billboard
3. SYSTEM THINKING: Consider how the brand works across UI, marketing, social
4. CONTEMPORARY RELEVANCE: Use 2024-2025 design trends, not 2020 styles
5. DISTINCTIVE NOT DERIVATIVE: Avoid generic tech startup aesthetics

The AI will use this to generate logos - be EXTREMELY SPECIFIC about typography, style, and visual direction.

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


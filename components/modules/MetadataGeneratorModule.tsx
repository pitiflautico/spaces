'use client';

import React, { useState } from 'react';
import { useSpaceStore } from '@/lib/store';
import type {
  Module,
  MetadataGeneratorInputs,
  MetadataGeneratorOutputs,
  MetadataPackage,
  MetadataVariant,
  ChosenMetadata,
  AIConfiguration,
  FlowContext,
  AppIntelligence,
  NamingPackage,
  ChosenName,
} from '@/types';
import { AIProvider } from '@/types';
import {
  CheckCircleIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  CubeIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import aiProvider from '@/lib/ai-provider';
import { AI_MODELS, getDefaultModelForProvider } from '@/lib/ai-models';
import '@/lib/adapters'; // Initialize adapters
import MetadataVariantsPanel from './MetadataVariantsPanel';
import { ModuleInfoPanel } from '@/components/shared/PortTooltip';

interface MetadataGeneratorModuleProps {
  module: Module;
}

// Target markets options
const TARGET_MARKETS = [
  { value: 'Global', label: 'Global (all markets)' },
  { value: 'US', label: 'United States' },
  { value: 'EU', label: 'European Union' },
  { value: 'LATAM', label: 'Latin America' },
  { value: 'ASIA', label: 'Asia Pacific' },
];

// Metadata styles
const METADATA_STYLES = [
  { value: 'balanced', label: 'Balanced (recommended)' },
  { value: 'creative', label: 'Creative & Bold' },
  { value: 'conservative', label: 'Conservative & Professional' },
];

export default function MetadataGeneratorModule({ module }: MetadataGeneratorModuleProps) {
  const { updateModule, getCurrentSpace, addLog } = useSpaceStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  const outputs = module.outputs as MetadataGeneratorOutputs;
  const space = getCurrentSpace();

  // Get module inputs (will store AI config and settings here)
  const inputs = (module.inputs || {}) as MetadataGeneratorInputs;
  const selectedProvider: AIProvider = inputs.aiProvider || space?.configuration?.aiConfig?.provider || AIProvider.TOGETHER;
  const selectedModel = inputs.aiModel || AI_MODELS[selectedProvider as keyof typeof AI_MODELS]?.[0]?.id;
  const numVariants = inputs.numVariants || 3;
  const targetMarket = inputs.targetMarket || 'Global';
  const metadataStyle = inputs.style || 'balanced';

  // Get detected language from flowContext
  const detectedLanguage = outputs?.flowContext?.language || null;

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

  const handleNumVariantsChange = (num: number) => {
    updateModule(module.id, {
      inputs: {
        ...inputs,
        numVariants: num,
      },
    });
  };

  const handleTargetMarketChange = (market: string) => {
    updateModule(module.id, {
      inputs: {
        ...inputs,
        targetMarket: market,
      },
    });
  };

  const handleStyleChange = (style: string) => {
    updateModule(module.id, {
      inputs: {
        ...inputs,
        style: style as 'conservative' | 'creative' | 'balanced',
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

      // Get inputs from connected modules
      const connections = space?.connections || [];

      // Debug: Log all connections to this module
      console.log('=== METADATA GENERATOR - Connection Debug ===');
      console.log('Module ID:', module.id);
      console.log('All connections:', connections);
      console.log('Connections to this module:', connections.filter(c => c.targetModuleId === module.id));
      console.log('===========================================');

      // Input 1: App Intelligence (from Module 2 - AIE Engine)
      const conn1 = connections.find((conn) => conn.targetModuleId === module.id && conn.targetPortId === 'in-1');
      const sourceModule1 = conn1 ? space?.modules.find((m) => m.id === conn1.sourceModuleId) : null;

      console.log('=== Input 1 (App Intelligence) ===');
      console.log('Connection found:', conn1);
      console.log('Source module:', sourceModule1 ? sourceModule1.name : 'NOT FOUND');
      console.log('Source module outputs:', sourceModule1?.outputs);
      console.log('App Intelligence data:', sourceModule1?.outputs?.appIntelligence);
      console.log('===================================');

      const appIntelligence: AppIntelligence | undefined = sourceModule1?.outputs?.appIntelligence;

      // Input 2: Naming Package (from Module 3 - Naming Engine)
      const conn2 = connections.find((conn) => conn.targetModuleId === module.id && conn.targetPortId === 'in-2');
      const sourceModule2 = conn2 ? space?.modules.find((m) => m.id === conn2.sourceModuleId) : null;

      console.log('=== Input 2 (Naming Package) ===');
      console.log('Connection found:', conn2);
      console.log('Source module:', sourceModule2 ? sourceModule2.name : 'NOT FOUND');
      console.log('Naming Package data:', sourceModule2?.outputs?.namingPackage);
      console.log('===================================');

      const namingPackage: NamingPackage | undefined = sourceModule2?.outputs?.namingPackage;

      // Input 3: Chosen Name (from Module 3 - Naming Engine)
      const conn3 = connections.find((conn) => conn.targetModuleId === module.id && conn.targetPortId === 'in-3');
      const sourceModule3 = conn3 ? space?.modules.find((m) => m.id === conn3.sourceModuleId) : null;

      console.log('=== Input 3 (Chosen Name) ===');
      console.log('Connection found:', conn3);
      console.log('Source module:', sourceModule3 ? sourceModule3.name : 'NOT FOUND');
      console.log('Chosen Name data:', sourceModule3?.outputs?.chosenName);
      console.log('===================================');

      const chosenName: ChosenName | undefined = sourceModule3?.outputs?.chosenName;

      // Input 4: Icon Options (from Module 4B - App Icon Generator) - OPTIONAL
      const conn4 = connections.find((conn) => conn.targetModuleId === module.id && conn.targetPortId === 'in-4');
      const sourceModule4 = conn4 ? space?.modules.find((m) => m.id === conn4.sourceModuleId) : null;
      const iconOptions = sourceModule4?.outputs?.iconOptions;

      // Validate required inputs with better error messages
      if (!conn1) {
        throw new Error(
          'No connection to input port 1.\n\n' +
          'Please connect the "App Intelligence" output from Module 2 (AIE Engine) to input port 1 of this module.'
        );
      }

      if (!sourceModule1) {
        throw new Error(
          'Source module not found for input port 1.\n\n' +
          'The connection exists but the source module was not found. Try reconnecting.'
        );
      }

      if (!sourceModule1.outputs || !sourceModule1.outputs.appIntelligence) {
        throw new Error(
          `Module "${sourceModule1.name}" has not been executed yet.\n\n` +
          'Please run Module 2 (AIE Engine) first before generating metadata.'
        );
      }

      if (!appIntelligence) {
        throw new Error(
          'No App Intelligence data available.\n\n' +
          'Please run Module 2 (AIE Engine) first to generate App Intelligence data.'
        );
      }

      // Validate naming package
      if (!conn2) {
        throw new Error(
          'No connection to input port 2.\n\n' +
          'Please connect the "Naming Package" output from Module 3 (Naming Engine) to input port 2 of this module.'
        );
      }

      if (!sourceModule2) {
        throw new Error(
          'Source module not found for input port 2.\n\n' +
          'The connection exists but the source module was not found. Try reconnecting.'
        );
      }

      if (!sourceModule2.outputs || !sourceModule2.outputs.namingPackage) {
        throw new Error(
          `Module "${sourceModule2.name}" has not been executed yet or has no Naming Package output.\n\n` +
          'Please run Module 3 (Naming Engine) first before generating metadata.'
        );
      }

      if (!namingPackage) {
        throw new Error(
          'No Naming Package data available.\n\n' +
          'Please run Module 3 (Naming Engine) first to generate naming data.'
        );
      }

      // Validate chosen name
      if (!conn3) {
        throw new Error(
          'No connection to input port 3.\n\n' +
          'Please connect the "Chosen Name" output from Module 3 (Naming Engine) to input port 3 of this module.'
        );
      }

      if (!sourceModule3) {
        throw new Error(
          'Source module not found for input port 3.\n\n' +
          'The connection exists but the source module was not found. Try reconnecting.'
        );
      }

      if (!sourceModule3.outputs || !sourceModule3.outputs.chosenName) {
        throw new Error(
          `Module "${sourceModule3.name}" has no Chosen Name output.\n\n` +
          'Please select a name variant in Module 3 (Naming Engine) before generating metadata.'
        );
      }

      if (!chosenName) {
        throw new Error(
          'No Chosen Name data available.\n\n' +
          'Please select a name in Module 3 (Naming Engine) before generating metadata.'
        );
      }

      // Get flow context (language, branding, etc.)
      const flowContext: FlowContext = sourceModule1?.outputs.flowContext || { language: 'en' };
      const language = flowContext.language || 'en';

      // Debug log
      console.log('=== METADATA GENERATOR - Inputs ===');
      console.log('App Intelligence:', appIntelligence);
      console.log('Naming Package:', namingPackage);
      console.log('Chosen Name:', chosenName);
      console.log('Icon Options:', iconOptions ? 'Present' : 'Not provided');
      console.log('Language:', language);
      console.log('Target Market:', targetMarket);
      console.log('Num Variants:', numVariants);
      console.log('===================================');

      // Build prompt for AI
      const prompt = buildMetadataPrompt(
        appIntelligence,
        namingPackage,
        chosenName,
        language,
        numVariants,
        targetMarket,
        metadataStyle,
        iconOptions
      );

      // Debug: Log prompt excerpt
      console.log('=== METADATA GENERATOR - Prompt Preview ===');
      console.log(prompt.substring(0, 500));
      console.log('===========================================');

      // Get API key from space configuration
      const apiKey = getAPIKeyForProvider(selectedProvider, space?.configuration?.apiKeys || {});

      if (!apiKey && selectedProvider !== AIProvider.LOCAL) {
        throw new Error(`API key for ${selectedProvider} not configured. Please add it in Settings > API Keys.`);
      }

      // Call AI provider
      const aiConfig: AIConfiguration = {
        provider: selectedProvider,
        apiKey: apiKey || '',
        model: selectedModel,
        temperature: inputs.temperature || 0.7,
        maxTokens: 4000,
      };

      addLog('info', `Generating ${numVariants} metadata variants using ${selectedProvider}...`, module.id);

      const response = await aiProvider.run(prompt, aiConfig);

      console.log('=== AI Response ===');
      console.log(response.outputText.substring(0, 500));
      console.log('===================');

      // Parse AI response
      const metadataPackage = parseMetadataResponse(
        response.outputText,
        chosenName.final_name,
        appIntelligence.category,
        language
      );

      // Validate all variants
      const validationResults = metadataPackage.variants.map(validateMetadataVariant);
      const hasErrors = validationResults.some(r => !r.valid);

      if (hasErrors) {
        console.warn('Some variants have validation errors:', validationResults);
        addLog('warning', 'Some metadata variants have validation warnings. Check logs for details.', module.id);
      }

      // Collect all warnings
      const allWarnings: string[] = [];
      validationResults.forEach((result, idx) => {
        if (result.warnings && result.warnings.length > 0) {
          allWarnings.push(`Variant ${idx + 1}: ${result.warnings.join(', ')}`);
        }
      });

      metadataPackage.validation_passed = !hasErrors;
      metadataPackage.validation_warnings = allWarnings.length > 0 ? allWarnings : undefined;

      // Build log
      const metadataLog = buildMetadataLog(
        chosenName.final_name,
        language,
        numVariants,
        targetMarket,
        selectedProvider,
        selectedModel,
        prompt,
        metadataPackage,
        validationResults
      );

      // Prepare outputs
      const newOutputs: MetadataGeneratorOutputs = {
        metadataPackage,
        metadataLog,
        flowContext: {
          ...flowContext,
          // Metadata generator doesn't add new context, just propagates
        },
      };

      // Update module
      updateModule(module.id, {
        status: hasErrors ? 'warning' : 'done',
        outputs: newOutputs,
      });

      addLog('success', `✓ Generated ${numVariants} metadata variants successfully!`, module.id);

    } catch (error: any) {
      console.error('Metadata generation error:', error);
      setError(error.message);
      updateModule(module.id, {
        status: 'error',
        errorMessage: error.message,
      });
      addLog('error', `Metadata generation failed: ${error.message}`, module.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectVariant = (variantId: number) => {
    if (!outputs?.metadataPackage) return;

    const selectedVariant = outputs.metadataPackage.variants.find(v => v.id === variantId);
    if (!selectedVariant) return;

    const chosenMetadata: ChosenMetadata = {
      variant_id: variantId,
      app_store: selectedVariant.app_store,
      google_play: selectedVariant.google_play,
      chosen_at: new Date().toISOString(),
      source_module: 'MetadataGenerator5',
      engine_version: '3.0',
    };

    updateModule(module.id, {
      outputs: {
        ...outputs,
        chosenMetadata,
      },
    });

    addLog('info', `Selected metadata variant #${variantId}: "${selectedVariant.variant_name}"`, module.id);
    setIsPanelOpen(false);
  };

  return (
    <div>
      <div className="p-4">
        {/* Help Button */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {module.ports?.input?.length || 0} inputs • {module.ports?.output?.length || 0} outputs
          </div>
          <button
            onClick={() => setShowInfoPanel(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
          >
            <InformationCircleIcon className="w-4 h-4" />
            Help
          </button>
        </div>

        {/* Configuration Section */}
        <div className="space-y-4">
          {/* Brand Info (Read-only from inputs) */}
          <div className="bg-dark-card rounded-lg p-3 border border-dark-border">
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <CubeIcon className="w-4 h-4" />
              Configuration
            </h4>

          {outputs?.metadataPackage && (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Brand:</span>
                <span className="text-white">{outputs.metadataPackage.brand_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Category:</span>
                <span className="text-white">{outputs.metadataPackage.category}</span>
              </div>
              {detectedLanguage && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Language:</span>
                  <span className="text-white flex items-center gap-1">
                    <GlobeAltIcon className="w-3 h-3" />
                    {detectedLanguage.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Number of Variants */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Number of Variants
          </label>
          <select
            value={numVariants}
            onChange={(e) => handleNumVariantsChange(Number(e.target.value))}
            disabled={module.status === 'running'}
            className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>1 variant</option>
            <option value={3}>3 variants (recommended)</option>
            <option value={5}>5 variants</option>
          </select>
        </div>

        {/* Target Market */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Target Market
          </label>
          <select
            value={targetMarket}
            onChange={(e) => handleTargetMarketChange(e.target.value)}
            disabled={module.status === 'running'}
            className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TARGET_MARKETS.map(market => (
              <option key={market.value} value={market.value}>{market.label}</option>
            ))}
          </select>
        </div>

        {/* Metadata Style */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Writing Style
          </label>
          <select
            value={metadataStyle}
            onChange={(e) => handleStyleChange(e.target.value)}
            disabled={module.status === 'running'}
            className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {METADATA_STYLES.map(style => (
              <option key={style.value} value={style.value}>{style.label}</option>
            ))}
          </select>
        </div>

        {/* AI Provider Selection */}
        <div className="bg-dark-card rounded-lg p-3 border border-dark-border">
          <h4 className="text-xs font-semibold text-white mb-2 flex items-center gap-1">
            <SparklesIcon className="w-4 h-4" />
            AI Model
          </h4>

          <div className="space-y-2">
            <select
              value={selectedProvider}
              onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
              disabled={module.status === 'running'}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={AIProvider.TOGETHER}>Together AI (Recommended)</option>
              <option value={AIProvider.REPLICATE}>Replicate</option>
              <option value={AIProvider.OPENAI}>OpenAI</option>
              <option value={AIProvider.ANTHROPIC}>Anthropic</option>
              <option value={AIProvider.LOCAL}>Local (Mock)</option>
            </select>

            <select
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              disabled={module.status === 'running'}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {AI_MODELS[selectedProvider as keyof typeof AI_MODELS]?.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} - {model.description}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleRun}
          disabled={module.status === 'running'}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          {module.status === 'running' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Generating Metadata...
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5" />
              Generate Metadata
            </>
          )}
        </button>

        {/* Status Display */}
        {module.status === 'done' && outputs?.metadataPackage && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-green-400">
                  ✓ {outputs.metadataPackage.num_variants} variants generated
                </h4>
                <p className="text-xs text-green-300 mt-1">
                  {outputs.chosenMetadata
                    ? `Selected: Variant #${outputs.chosenMetadata.variant_id}`
                    : 'Click below to review and select a variant'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Warning Display */}
        {module.status === 'warning' && outputs?.metadataPackage?.validation_warnings && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-yellow-400">Validation Warnings</h4>
                <ul className="text-xs text-yellow-300 mt-1 space-y-1">
                  {outputs.metadataPackage.validation_warnings.slice(0, 3).map((warning, idx) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Open Panel Button */}
        {outputs?.metadataPackage && (
          <button
            onClick={() => setIsPanelOpen(true)}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            <DocumentTextIcon className="w-5 h-5" />
            📋 Open Variants Panel
          </button>
        )}

        {/* Logs Button */}
        {outputs?.metadataLog && (
          <button
            onClick={() => {
              console.log('=== METADATA GENERATION LOG ===');
              console.log(outputs.metadataLog);
              console.log('================================');
              alert('Log printed to console (F12)');
            }}
            className="w-full py-2 bg-dark-card hover:bg-dark-hover text-gray-300 rounded-lg text-xs transition-colors"
          >
            📊 View Log
          </button>
        )}
      </div>

      {/* Metadata Variants Panel */}
      {isPanelOpen && outputs?.metadataPackage && (
        <MetadataVariantsPanel
          metadataPackage={outputs.metadataPackage}
          selectedVariantId={outputs.chosenMetadata?.variant_id}
          onSelectVariant={handleSelectVariant}
          onClose={() => setIsPanelOpen(false)}
        />
      )}
    </div>
  );
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getAPIKeyForProvider(provider: AIProvider, apiKeys: Record<string, string | undefined>): string | undefined {
  const keyMap: Record<AIProvider, string> = {
    [AIProvider.REPLICATE]: 'replicate',
    [AIProvider.TOGETHER]: 'together',
    [AIProvider.OPENAI]: 'openai',
    [AIProvider.ANTHROPIC]: 'anthropic',
    [AIProvider.LOCAL]: 'local',
  };

  return apiKeys[keyMap[provider]];
}

function buildMetadataPrompt(
  appIntelligence: AppIntelligence,
  namingPackage: NamingPackage,
  chosenName: ChosenName,
  language: string,
  numVariants: number,
  targetMarket: string,
  style: string,
  iconOptions?: any
): string {
  const brandName = chosenName.final_name;
  const slogan = namingPackage.slogan || '';
  const category = appIntelligence.category;
  const features = appIntelligence.features.join('\n  - ');
  const targetAudience = appIntelligence.targetAudience;
  const brandTone = namingPackage.branding?.brand_tone || appIntelligence.tone;
  const keywords = appIntelligence.keywords.join(', ');
  const designStyle = namingPackage.branding?.design_style || appIntelligence.designStyle;

  const languageNames: Record<string, string> = {
    'en': 'English',
    'es': 'Spanish (Español)',
    'fr': 'French (Français)',
    'de': 'German (Deutsch)',
    'pt': 'Portuguese (Português)',
    'it': 'Italian (Italiano)',
    'ja': 'Japanese (日本語)',
    'zh': 'Chinese (中文)',
  };

  return `You are a professional app marketing copywriter specializing in App Store and Google Play Store metadata that drives downloads and conversions.

# TASK
Generate ${numVariants} complete metadata variants for the following app:

# APP INFORMATION
- Brand Name: ${brandName}
${slogan ? `- Slogan: ${slogan}` : ''}
- Category: ${category}
- Target Audience: ${targetAudience}
- Key Features:
  - ${features}
- Tone: ${brandTone}
- Keywords: ${keywords}
- Design Style: ${designStyle}
- Target Market: ${targetMarket}

# LANGUAGE
ALL metadata must be in: **${languageNames[language] || language}**

# OFFICIAL REQUIREMENTS

## App Store (iOS)
- App Name: MAX 30 characters (STRICT) - Must include brand name
- Subtitle: MAX 30 characters (STRICT) - Summarize functionality, don't repeat title
- Promotional Text: MAX 170 characters - Can be updated without new version
- Description: No strict limit but keep concise and benefit-focused
- Keywords: MAX 100 characters, comma-separated
  * DO NOT repeat words from App Name or Subtitle
  * NO spaces after commas
  * Focus on discovery keywords

## Google Play (Android)
- Title: MAX 30 characters (STRICT)
- Short Description: MAX 80 characters (STRICT) - Benefit-oriented
- Full Description: MAX 4,000 characters
  * Avoid excessive symbols or ALL CAPS
  * NO claims like "#1", "best app", "download now", "free forever"
  * Focus on benefits, not just features
  * Use clear paragraphs and formatting

# FORBIDDEN WORDS/PHRASES
DO NOT use: "#1", "Best", "Top", "Download now", "Free forever", "#1 app", "most popular"

# STYLE GUIDANCE
Writing Style: ${style}
- conservative: Professional, factual, benefit-driven
- creative: Bold, engaging, emotional
- balanced: Mix of professional and creative

# OUTPUT FORMAT
Return ONLY a valid JSON object with this structure:

{
  "variants": [
    {
      "id": 1,
      "variant_name": "Professional Focus",
      "target_persona": "Professionals seeking productivity",
      "tone": "Professional, benefit-driven",
      "emphasis": "Time management and analytics",
      "app_store": {
        "title": "FoxTimer: Master Focus",
        "subtitle": "Track goals every day",
        "promotional_text": "Stay focused and achieve more with intelligent time tracking.",
        "description": "FoxTimer is the smart, elegant timer built for people who value their time.\\n\\nBOOST PRODUCTIVITY\\n• Focus sessions with intelligent breaks\\n• Daily goal tracking with progress insights\\n• Analytics to understand your work patterns\\n\\nSTAY ON TRACK\\n• Scheduled focus sessions\\n• Customizable timer intervals\\n• Notifications that respect your flow\\n\\nYOUR TIME, OPTIMIZED\\nJoin thousands of professionals who've transformed their productivity with FoxTimer.\\n\\nDownload now and start achieving more.",
        "keywords": "focus,timer,productivity,time,management,goals,tracking,work,professional,pomodoro"
      },
      "google_play": {
        "title": "FoxTimer",
        "short_description": "Stay focused. Achieve more. Track your time with purpose.",
        "full_description": "FoxTimer helps professionals, students, and creators maximize their productivity through intelligent time tracking.\\n\\nKEY FEATURES:\\n\\n⏱️ FOCUS SESSIONS\\nSet custom focus intervals with smart break reminders. Our intelligent timer adapts to your work rhythm.\\n\\n📊 GOAL TRACKING\\nSet daily productivity goals and track your progress. See exactly how you spend your time.\\n\\n📈 INSIGHTS & ANALYTICS\\nUnderstand your productivity patterns with detailed analytics. Identify your peak focus hours.\\n\\n⚡ SIMPLE & ELEGANT\\nClean interface that gets out of your way. Focus on your work, not the app.\\n\\nPERFECT FOR:\\n• Professionals managing multiple projects\\n• Students preparing for exams\\n• Freelancers tracking billable hours\\n• Anyone seeking better time management\\n\\nWHY FOXTIMER?\\nUnlike other timer apps, FoxTimer combines simplicity with powerful insights. Track your time, understand your patterns, and achieve your goals.\\n\\nStart your productivity journey today.",
        "tags": ["productivity", "time-management", "focus", "timer", "goals"]
      },
      "ai_prompt_used": "",
      "generated_at": ""
    }
  ]
}

# VARIANT DIVERSITY
Each variant should target a different persona or use case:
- Variant 1: ${targetMarket === 'US' ? 'Professional/Business focus' : targetMarket === 'ASIA' ? 'Efficiency/Innovation focus' : 'General audience'}
- Variant 2: ${numVariants >= 2 ? 'Student/Academic focus' : ''}
- Variant 3: ${numVariants >= 3 ? 'Creative/Personal focus' : ''}
${numVariants > 3 ? '- Additional variants: Different angles on core benefits' : ''}

IMPORTANT:
- Respect ALL character limits STRICTLY
- Use the specified language for ALL text
- Make each variant meaningfully different
- Return ONLY the JSON, no additional text

Generate the metadata now.`;
}

function parseMetadataResponse(
  responseText: string,
  brandName: string,
  category: string,
  language: string
): MetadataPackage {
  try {
    // Try to extract JSON from response
    let jsonText = responseText.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    // Parse JSON
    const parsed = JSON.parse(jsonText);

    const variants: MetadataVariant[] = parsed.variants.map((v: any, idx: number) => ({
      id: idx + 1,
      app_store: v.app_store,
      google_play: v.google_play,
      variant_name: v.variant_name || `Variant ${idx + 1}`,
      target_persona: v.target_persona || '',
      tone: v.tone || '',
      emphasis: v.emphasis || '',
      ai_prompt_used: '',
      generated_at: new Date().toISOString(),
    }));

    return {
      brand_name: brandName,
      num_variants: variants.length,
      variants,
      category,
      language,
      generated_at: new Date().toISOString(),
      validation_passed: true,
    };
  } catch (error) {
    console.error('Failed to parse metadata response:', error);
    throw new Error('Failed to parse AI response. Please try again.');
  }
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateMetadataVariant(variant: MetadataVariant): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // App Store validation
  if (variant.app_store.title.length > 30) {
    errors.push(`App Store title exceeds 30 chars: ${variant.app_store.title.length}`);
  }
  if (variant.app_store.subtitle.length > 30) {
    errors.push(`App Store subtitle exceeds 30 chars: ${variant.app_store.subtitle.length}`);
  }
  if (variant.app_store.keywords.length > 100) {
    errors.push(`App Store keywords exceed 100 chars: ${variant.app_store.keywords.length}`);
  }
  if (variant.app_store.promotional_text.length > 170) {
    errors.push(`Promotional text exceeds 170 chars: ${variant.app_store.promotional_text.length}`);
  }

  // Check for forbidden words in App Store
  const forbiddenWords = ['#1', 'best app', 'download now', 'free forever', 'top app'];
  const appStoreText = `${variant.app_store.title} ${variant.app_store.subtitle} ${variant.app_store.description}`.toLowerCase();

  forbiddenWords.forEach(word => {
    if (appStoreText.includes(word.toLowerCase())) {
      warnings.push(`Contains forbidden phrase: "${word}"`);
    }
  });

  // Google Play validation
  if (variant.google_play.title.length > 30) {
    errors.push(`Google Play title exceeds 30 chars: ${variant.google_play.title.length}`);
  }
  if (variant.google_play.short_description.length > 80) {
    errors.push(`Google Play short desc exceeds 80 chars: ${variant.google_play.short_description.length}`);
  }
  if (variant.google_play.full_description.length > 4000) {
    errors.push(`Google Play full desc exceeds 4000 chars: ${variant.google_play.full_description.length}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function buildMetadataLog(
  brandName: string,
  language: string,
  numVariants: number,
  targetMarket: string,
  provider: string,
  model: string,
  prompt: string,
  metadataPackage: MetadataPackage,
  validationResults: ValidationResult[]
): string {
  const timestamp = new Date().toISOString();

  let log = `=== METADATA GENERATOR LOG ===\n`;
  log += `Date: ${timestamp}\n`;
  log += `Provider: ${provider}\n`;
  log += `Model: ${model}\n\n`;

  log += `INPUTS RECEIVED:\n`;
  log += `- Brand Name: ${brandName}\n`;
  log += `- Category: ${metadataPackage.category}\n`;
  log += `- Language: ${language}\n`;
  log += `- Target Market: ${targetMarket}\n`;
  log += `- Num Variants Requested: ${numVariants}\n\n`;

  log += `AI PROMPT (excerpt):\n`;
  log += prompt.substring(0, 500) + '...\n\n';

  log += `VALIDATION RESULTS:\n`;
  validationResults.forEach((result, idx) => {
    const variant = metadataPackage.variants[idx];
    if (result.valid) {
      log += `✓ Variant ${idx + 1} (${variant.variant_name}): PASS (all limits OK)\n`;
    } else {
      log += `✗ Variant ${idx + 1} (${variant.variant_name}): FAIL\n`;
      result.errors.forEach(err => log += `  - ${err}\n`);
    }
    if (result.warnings.length > 0) {
      log += `  Warnings:\n`;
      result.warnings.forEach(warn => log += `  - ${warn}\n`);
    }
  });

  log += `\nFINAL STATUS: ${metadataPackage.validation_passed ? 'SUCCESS' : 'VALIDATION ERRORS'}\n`;
  log += `Generated ${metadataPackage.num_variants} variants\n`;
  log += `================================\n`;

  return log;
}
      </div>

      {/* Info Panel */}
      {showInfoPanel && (
        <ModuleInfoPanel
          moduleName="Metadata Generator (Module 5)"
          moduleDescription="Generate professional App Store and Google Play metadata using AI. Creates multiple variants with different tones and target personas."
          inputs={[
            {
              id: 'in-1',
              label: 'App Intelligence',
              description: 'Project analysis with category, features, keywords, and competitive angle. Used to create contextually relevant metadata.',
              required: true,
              source: 'Module 2 (AIE Engine) → Output Port 1',
              dataType: 'JSON',
            },
            {
              id: 'in-2',
              label: 'Naming Package',
              description: 'All naming suggestions including slogan and rationale. Provides additional branding context for metadata generation.',
              required: true,
              source: 'Module 3 (Naming Engine) → Output Port 1',
              dataType: 'JSON',
            },
            {
              id: 'in-3',
              label: 'Chosen Name',
              description: 'The final selected app name. This is the main name that will appear in the metadata title fields.',
              required: true,
              source: 'Module 3 (Naming Engine) → Output Port 2',
              dataType: 'JSON',
            },
            {
              id: 'in-4',
              label: 'Icon Options',
              description: 'Generated app icon information (optional). Can provide visual context for metadata tone, though not strictly required.',
              required: false,
              source: 'Module 4B (App Icon Generator) → Output Port 1',
              dataType: 'JSON',
            },
          ]}
          outputs={[
            {
              id: 'out-1',
              label: 'Metadata Package',
              description: 'ALL generated variants (1-5 versions) with different tones, target personas, and emphasis. Use this to compare options or export all variations.',
              dataType: 'JSON',
            },
            {
              id: 'out-2',
              label: 'Chosen Metadata',
              description: 'The FINAL selected metadata variant. Ready to use in App Store Connect and Google Play Console. Connect this to Module 7.',
              dataType: 'JSON',
            },
            {
              id: 'out-3',
              label: 'Metadata Log',
              description: 'Detailed log of the generation process including AI prompt, validation results, and character counts. Useful for debugging.',
              dataType: 'TEXT',
            },
            {
              id: 'out-4',
              label: 'Flow Context',
              description: 'Propagates branding context (language, colors, design style) to downstream modules like Module 7 (App Store Connect).',
              dataType: 'JSON',
            },
          ]}
          onClose={() => setShowInfoPanel(false)}
        />
      )}
    </div>
  );
}

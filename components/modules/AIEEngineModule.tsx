'use client';

import React, { useState } from 'react';
import { useSpaceStore } from '@/lib/store';
import type { Module, AIEEngineOutputs, AppIntelligence, AIConfiguration, FlowContext } from '@/types';
import { AIProvider } from '@/types';
import { CheckCircleIcon, SparklesIcon, ExclamationTriangleIcon, LanguageIcon } from '@heroicons/react/24/outline';
import aiProvider from '@/lib/ai-provider';
import { AI_MODELS, getDefaultModelForProvider } from '@/lib/ai-models';
import '@/lib/adapters'; // Initialize adapters

interface AIEEngineModuleProps {
  module: Module;
}

// Supported languages for the pipeline
const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

export default function AIEEngineModule({ module }: AIEEngineModuleProps) {
  const { updateModule, addLog } = useSpaceStore();
  // Use reactive selector to always get fresh space data (including API keys)
  const space = useSpaceStore(state => state.spaces.find(s => s.id === state.currentSpaceId));
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const outputs = module.outputs as AIEEngineOutputs;

  // Helper to check if API key exists for a provider
  const hasApiKey = (provider: AIProvider): boolean => {
    const keys = space?.configuration?.apiKeys;
    if (!keys) return false;
    switch (provider) {
      case AIProvider.OPENAI: return !!keys.openai;
      case AIProvider.ANTHROPIC: return !!keys.anthropic;
      case AIProvider.REPLICATE: return !!keys.replicate;
      case AIProvider.TOGETHER: return !!keys.together;
      case AIProvider.LOCAL: return true;
      default: return false;
    }
  };

  // Get module inputs (will store AI config and language here)
  const inputs = (module.inputs || {}) as any;
  const selectedProvider: AIProvider = inputs.aiProvider || space?.configuration?.aiConfig?.provider || AIProvider.TOGETHER;
  const selectedModel = inputs.aiModel || AI_MODELS[selectedProvider as keyof typeof AI_MODELS]?.[0]?.id;
  const selectedLanguage = inputs.language || 'en'; // Default to English

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

  const handleLanguageChange = (languageCode: string) => {
    updateModule(module.id, {
      inputs: {
        ...inputs,
        language: languageCode,
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

      // Get input from connected module
      // First, find the connection to this module
      const connections = space?.connections || [];
      const incomingConnection = connections.find(
        (conn) => conn.targetModuleId === module.id && conn.targetPortId === 'in-1'
      );

      if (!incomingConnection) {
        throw new Error('No input connected. Connect output from Local Project Analysis module.');
      }

      // Get the source module
      const sourceModule = space?.modules.find((m) => m.id === incomingConnection.sourceModuleId);
      if (!sourceModule) {
        throw new Error('Source module not found. Please check the connection.');
      }

      if (!sourceModule.outputs.projectAnalysis) {
        throw new Error(
          `El módulo "${sourceModule.name}" no tiene datos de salida.\n\n` +
          `Por favor, ejecuta primero el módulo de análisis:\n` +
          `1. Haz clic en el botón Play ▶ del módulo "${sourceModule.name}"\n` +
          `2. Espera a que termine (se pondrá verde)\n` +
          `3. Luego ejecuta este módulo AIE Engine`
        );
      }

      // Get the data from source module output
      const projectData = sourceModule.outputs.projectAnalysis;

      // Extract data from combined input
      const { repositoryMetadata, fileContents, repoStructure } = projectData;

      // Build prompt for AI
      const prompt = buildPrompt(repositoryMetadata, fileContents, repoStructure, selectedLanguage);

      // Get API key from space configuration
      // API keys are stored per provider in apiKeys object
      const getApiKey = (provider: AIProvider): string | undefined => {
        const keys = space?.configuration?.apiKeys || {};
        switch (provider) {
          case AIProvider.OPENAI: return keys.openai;
          case AIProvider.ANTHROPIC: return keys.anthropic;
          case AIProvider.REPLICATE: return keys.replicate;
          case AIProvider.TOGETHER: return keys.together;
          default: return undefined;
        }
      };

      const apiKey = getApiKey(selectedProvider);

      if (!apiKey && selectedProvider !== AIProvider.LOCAL) {
        throw new Error(`API key for ${selectedProvider} not configured. Please add it in Settings (AI Provider tab).`);
      }

      const config: AIConfiguration = {
        provider: selectedProvider,
        model: selectedModel,
        temperature: 0.7,
        maxTokens: 4096,
        apiKey
      };

      // Call AI provider
      addLog('info', `Llamando a ${config.provider} (${config.model || 'default'})...`, module.id);
      const response = await aiProvider.run(prompt, config);

      // Parse response
      let appIntelligence: AppIntelligence;
      try {
        appIntelligence = JSON.parse(response.outputText);
      } catch (e) {
        // If JSON parsing fails, try to extract JSON from text
        const jsonMatch = response.outputText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          appIntelligence = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('AI response is not valid JSON');
        }
      }

      // Create flow context to propagate to downstream modules
      // This includes all the data that future modules will need
      const flowContext: FlowContext = {
        // Language & Market
        language: selectedLanguage,
        targetMarket: appIntelligence.targetAudience,

        // Brand & Design
        brandTone: appIntelligence.tone,
        brandColors: appIntelligence.brandColorsSuggested,
        designStyle: appIntelligence.designStyle,
        iconStyle: appIntelligence.iconStyleRecommendation,

        // App Info
        category: appIntelligence.category,
        keywords: appIntelligence.keywords.slice(0, 10), // Top 10 keywords

        // Note: appName and slogan will be added by Module 3 (Naming Engine)
      };

      // Debug: Log language propagation
      console.log('=== AIE ENGINE - Flow Context Created ===');
      console.log('Selected Language:', selectedLanguage);
      console.log('Brand Colors:', flowContext.brandColors);
      console.log('Design Style:', flowContext.designStyle);
      console.log('Icon Style:', flowContext.iconStyle);
      console.log('Category:', flowContext.category);
      console.log('Full FlowContext:', flowContext);
      console.log('=========================================');

      // Create outputs
      const newOutputs: AIEEngineOutputs = {
        appIntelligence,
        aieLog: `Analysis completed using ${response.providerUsed} (${response.model})\n` +
                `Tokens used: ${response.tokensUsed || 'N/A'}\n` +
                `Language: ${selectedLanguage}\n` +
                `Timestamp: ${new Date().toISOString()}`,
        flowContext, // Propagate to downstream modules
      };

      // Debug: Log final outputs
      console.log('=== AIE ENGINE - Final Outputs ===');
      console.log('outputs.flowContext:', newOutputs.flowContext);
      console.log('==================================');

      // Update module
      updateModule(module.id, {
        status: 'done',
        outputs: newOutputs
      });

      addLog('success', `AIE Engine completado usando ${response.providerUsed}`, module.id);

    } catch (err: any) {
      const errorMsg = err.message || 'Unknown error occurred';
      setError(errorMsg);
      updateModule(module.id, { status: 'error', errorMessage: errorMsg });
      addLog('error', errorMsg, module.id);
    } finally {
      setIsProcessing(false);
    }
  };

  // Listen for external run trigger from ModuleBlock Play button
  React.useEffect(() => {
    const handleExternalRun = (event: any) => {
      if (event.detail?.moduleId === module.id) {
        handleRun();
      }
    };

    window.addEventListener('aie-engine-run', handleExternalRun as EventListener);
    return () => window.removeEventListener('aie-engine-run', handleExternalRun as EventListener);
  }, [module.id, handleRun]);

  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="px-3 py-2 bg-[#0A0A0A]/50 border border-[#3A3A3A]/50 rounded-lg">
        <p className="text-xs text-gray-400">
          This module uses AI to analyze your project and extract app intelligence.
          Connect outputs from Local Project Analysis to get started.
        </p>
      </div>

      {/* AI Configuration */}
      <div className="space-y-3">
        <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-2">
          <SparklesIcon className="w-4 h-4 text-orange-400" />
          AI Configuration
        </div>

        {/* Language Selector */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">
            Output Language
          </label>
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
          >
            <option value="en">🇬🇧 English</option>
            <option value="es">🇪🇸 Español</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            AI will respond in {selectedLanguage === 'es' ? 'Spanish' : 'English'}
          </p>
        </div>

        {/* Model Selector */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">
            AI Model ({selectedProvider})
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

        {/* Language Selector */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5 flex items-center gap-2">
            <LanguageIcon className="w-4 h-4" />
            Output Language
          </label>
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
          <div className="mt-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-300 font-medium">Selected:</span>
              <span className="text-lg">{LANGUAGES.find(l => l.code === selectedLanguage)?.flag || '🌐'}</span>
              <span className="text-xs text-blue-200 font-semibold">
                {LANGUAGES.find(l => l.code === selectedLanguage)?.name || 'English'}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1.5">
            This language will be used for all outputs in the pipeline
          </p>
        </div>

        {/* API Key Status - Only show if missing or error */}
        {selectedProvider !== AIProvider.LOCAL && !hasApiKey(selectedProvider) && (
          <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-red-400">⚠️ API Key Missing</span>
              <span className="text-gray-400">Add {selectedProvider} key in Settings &gt; AI Provider tab</span>
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

      {/* Outputs Section - ENHANCED VISIBILITY */}
      {module.status === 'done' && outputs?.appIntelligence && (
        <div className="space-y-4 pt-4 border-t-2 border-green-500/30 bg-green-500/5 -mx-3 px-3 py-4 rounded-b-xl">
          <div className="text-sm text-green-400 uppercase tracking-wider font-bold flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-400 animate-pulse" />
            ✓ App Intelligence Extracted
          </div>

          <div className="space-y-3">
            {/* Summary - Most prominent */}
            <div className="px-4 py-3 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg">
              <span className="text-sm text-blue-400 font-semibold">📝 Summary</span>
              <p className="text-sm text-white mt-2 leading-relaxed">{outputs.appIntelligence.summary}</p>
            </div>

            {/* Category */}
            <div className="px-4 py-3 bg-[#0A0A0A]/80 border border-[#3A3A3A] rounded-lg">
              <span className="text-sm text-gray-400 font-semibold">🏷️ Category</span>
              <p className="text-sm text-white font-bold mt-1">{outputs.appIntelligence.category}</p>
            </div>

            {/* Target Audience */}
            <div className="px-4 py-3 bg-[#0A0A0A]/80 border border-[#3A3A3A] rounded-lg">
              <span className="text-sm text-gray-400 font-semibold">👥 Target Audience</span>
              <p className="text-sm text-gray-200 mt-1">{outputs.appIntelligence.targetAudience}</p>
            </div>

            {/* Keywords */}
            <div className="px-4 py-3 bg-[#0A0A0A]/80 border border-[#3A3A3A] rounded-lg">
              <span className="text-sm text-gray-400 font-semibold">🔑 Keywords</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {outputs.appIntelligence.keywords.slice(0, 8).map((keyword, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full border border-blue-500/30 font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Brand Colors */}
            <div className="px-4 py-3 bg-[#0A0A0A]/80 border border-[#3A3A3A] rounded-lg">
              <span className="text-sm text-gray-400 font-semibold">🎨 Brand Colors</span>
              <div className="flex gap-3 mt-2">
                {outputs.appIntelligence.brandColorsSuggested.map((color, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-white/20 shadow-lg"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                    <span className="text-xs text-gray-400 font-mono">{color}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Features Preview */}
            {outputs.appIntelligence.features && outputs.appIntelligence.features.length > 0 && (
              <div className="px-4 py-3 bg-[#0A0A0A]/80 border border-[#3A3A3A] rounded-lg">
                <span className="text-sm text-gray-400 font-semibold">✨ Key Features</span>
                <ul className="mt-2 space-y-1">
                  {outputs.appIntelligence.features.slice(0, 4).map((feature, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Competitive Angle */}
            {outputs.appIntelligence.competitiveAngle && (
              <div className="px-4 py-3 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg">
                <span className="text-sm text-purple-400 font-semibold">🎯 Competitive Angle</span>
                <p className="text-sm text-gray-200 mt-2 leading-relaxed">{outputs.appIntelligence.competitiveAngle}</p>
              </div>
            )}
          </div>

          {/* Log Info */}
          {outputs.aieLog && (
            <div className="px-3 py-2 bg-[#0A0A0A]/50 border border-[#2A2A2A] rounded text-xs text-gray-500 font-mono whitespace-pre-wrap">
              {outputs.aieLog}
            </div>
          )}

          {/* View Full JSON Button */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                console.log('=== AIE Engine Full Results ===');
                console.log(JSON.stringify(outputs.appIntelligence, null, 2));
                alert('Check browser console (F12 → Console) for full JSON output');
              }}
              className="flex-1 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-xs text-blue-400 transition-colors"
            >
              📋 View Full JSON (Console)
            </button>
            <button
              onClick={() => {
                const dataStr = JSON.stringify(outputs.appIntelligence, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `app-intelligence-${Date.now()}.json`;
                link.click();
                URL.revokeObjectURL(url);
              }}
              className="flex-1 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-xs text-green-400 transition-colors"
            >
              💾 Download JSON
            </button>
          </div>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-blue-300">Processing with AI...</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Summarize file structure (only names and paths, not full content)
 */
function summarizeFileStructure(structure: any, maxDepth = 3, currentDepth = 0): any {
  if (!structure || currentDepth >= maxDepth) return null;

  if (Array.isArray(structure)) {
    return structure.map(item => ({
      name: item.name,
      type: item.type,
      path: item.path,
      children: item.children ? summarizeFileStructure(item.children, maxDepth, currentDepth + 1) : undefined
    }));
  }

  return structure;
}

/**
 * Build optimized prompt for AI (reduced size)
 */
function buildPrompt(repositoryMetadata: any, fileContents: any, repoStructure: any, language: string): string {
  // Extract only essential file info (no full content)
  const essentialFileInfo = {
    packageJson: fileContents.packageJson ? {
      name: fileContents.packageJson.name,
      description: fileContents.packageJson.description,
      dependencies: Object.keys(fileContents.packageJson.dependencies || {}),
      devDependencies: Object.keys(fileContents.packageJson.devDependencies || {})
    } : null,
    readme: fileContents.readme || null, // Full README - includes AI_BRANDING_HINT and other metadata
    hasTypeScript: !!fileContents.tsconfig,
    hasTailwind: !!fileContents.tailwindConfig,
    hasAppJson: !!fileContents.appJson,
    appJsonName: fileContents.appJson?.name,
    appJsonSlug: fileContents.appJson?.slug
  };

  // Summarize structure (only paths, not content)
  const structureSummary = {
    root: repoStructure.root,
    topLevelDirs: repoStructure.items?.filter((i: any) => i.type === 'directory').map((d: any) => d.name) || [],
    totalFiles: countFiles(repoStructure.items || []),
    hasComponents: repoStructure.items?.some((i: any) => i.name === 'components') || false,
    hasPages: repoStructure.items?.some((i: any) => i.name === 'pages' || i.name === 'app') || false,
  };

  // Language instruction
  const languageInstruction = language === 'es'
    ? '\n\n⚠️ IMPORTANT: Respond in SPANISH. All text fields (summary, features, keywords, descriptions, etc.) MUST be in Spanish.'
    : '\n\n⚠️ IMPORTANT: Respond in ENGLISH. All text fields must be in English.';

  return `You are an expert app intelligence analyzer. Analyze this project and extract app intelligence.
${languageInstruction}

PROJECT INFO:
- Name: ${repositoryMetadata.projectName}
- Type: ${repositoryMetadata.projectType}
- Framework: ${repositoryMetadata.framework || 'Unknown'}
- Has TypeScript: ${repositoryMetadata.hasTypeScript ? 'Yes' : 'No'}
- Has Tailwind: ${repositoryMetadata.hasTailwindConfig ? 'Yes' : 'No'}

DEPENDENCIES (${essentialFileInfo.packageJson?.dependencies?.length || 0}):
${essentialFileInfo.packageJson?.dependencies?.slice(0, 15).join(', ') || 'None'}

README CONTENT (FULL):
${essentialFileInfo.readme || 'No README found'}

PROJECT STRUCTURE:
- Root: ${structureSummary.root}
- Main folders: ${structureSummary.topLevelDirs.join(', ')}
- Total files: ~${structureSummary.totalFiles}
- Has components: ${structureSummary.hasComponents ? 'Yes' : 'No'}
- Has pages/routes: ${structureSummary.hasPages ? 'Yes' : 'No'}

IMPORTANT - README METADATA HINTS:
If the README contains HTML comments with branding hints (e.g., <!-- AI_BRANDING_HINT: ... -->), use them to guide your suggestions:
- AI_BRANDING_HINT: Use specified colors for brandColorsSuggested
- AI_TONE: Use specified tone
- AI_STYLE: Use specified design style
- AI_TARGET_AUDIENCE: Use specified target audience

Based on this information, provide a comprehensive app intelligence analysis in JSON format:

{
  "summary": "A concise 1-2 sentence summary of the app",
  "category": "Main category (e.g., Developer Tools, E-commerce, Social Media, Games)",
  "subcategories": ["Array of subcategories"],
  "features": ["Array of key features based on dependencies and structure"],
  "targetAudience": "Description of target audience",
  "tone": "Description of tone and voice",
  "designStyle": "Description of design style",
  "keywords": ["Array of relevant keywords"],
  "problemsSolved": ["Array of problems this app solves"],
  "competitiveAngle": "What makes this app unique",
  "brandColorsSuggested": ["Array of 3-5 hex colors like #3B82F6"],
  "iconStyleRecommendation": "Recommendation for icon style"
}

Respond ONLY with the JSON object, no additional text.`;
}

/**
 * Count total files in structure
 */
function countFiles(items: any[]): number {
  if (!items) return 0;
  return items.reduce((count, item) => {
    if (item.type === 'file') return count + 1;
    if (item.type === 'directory' && item.children) {
      return count + countFiles(item.children);
    }
    return count;
  }, 0);
}


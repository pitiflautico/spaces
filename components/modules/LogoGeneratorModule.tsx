'use client';

import React, { useState } from 'react';
import { useSpaceStore } from '@/lib/store';
import type { Module, LogoGeneratorOutputs, LogoBrief, LogoOption, LogoOptionsPackage, ChosenLogo, FlowContext, LogoVariantOutputs } from '@/types';
import { AIProvider } from '@/types';
import { CheckCircleIcon, PhotoIcon, ExclamationTriangleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import imageProvider from '@/lib/image-provider';
import '@/lib/image-adapters'; // Initialize image adapters

interface LogoGeneratorModuleProps {
  module: Module;
}

// Logo Style Presets - Guide AI generation with specific aesthetics
const LOGO_STYLES = {
  minimalist: {
    name: 'Minimalist',
    description: 'Simple, clean, geometric basics, smooth lines, neutral colors',
    prompt: 'minimalist logo with simple geometric shapes, clean lines, neutral colors, modern and professional style, negative space usage',
  },
  bold: {
    name: 'Bold & Loud',
    description: 'High visual impact, thick shapes, strong contrasts, vibrant colors',
    prompt: 'bold and impactful logo with thick shapes, strong geometric forms, vibrant contrasting colors, high energy, modern and eye-catching',
  },
  elegant: {
    name: 'Elegant',
    description: 'Refined with elegant typography, organic icons, soft tones, premium',
    prompt: 'elegant and refined logo with sophisticated serif or semi-serif typography, natural organic icons, soft muted tones, premium luxurious style',
  },
  playful: {
    name: 'Playful',
    description: 'Fun and friendly, rounded typography, cheerful icons, bright colors',
    prompt: 'playful and friendly logo with rounded typography, cute approachable icons, bright cheerful colors, youthful and welcoming style',
  },
  tech: {
    name: 'Tech & Modern',
    description: 'Futuristic, gradients, modern sans-serif, abstract digital icons',
    prompt: 'tech-forward modern logo with sleek gradients, futuristic sans-serif typography, abstract digital icons, contemporary technological style',
  },
  classic: {
    name: 'Classic',
    description: 'Traditional serif, symmetric icon, sober colors, institutional',
    prompt: 'classic traditional logo with balanced serif typography, symmetric icon, sober elegant colors like black or gold, timeless institutional style',
  },
  handdrawn: {
    name: 'Hand-Drawn',
    description: 'Hand-illustrated, irregular lines, sketch typography, warm colors',
    prompt: 'hand-drawn artisanal logo with irregular sketch lines, vintage hand-lettered typography, warm organic colors, natural crafted style',
  },
  abstract: {
    name: 'Abstract',
    description: 'Fluid shapes, modern gradients, clean typography, dynamic',
    prompt: 'abstract modern logo with fluid dynamic shapes, contemporary gradients, clean minimalist typography, sophisticated and innovative style',
  },
} as const;

type LogoStyleKey = keyof typeof LOGO_STYLES;

/**
 * Detect logo style from branding design_style string
 * Maps AI-generated design_style to one of our 8 predefined styles
 */
function detectStyleFromBranding(designStyle?: string): LogoStyleKey | null {
  if (!designStyle) return null;

  const styleLower = designStyle.toLowerCase();

  // Map design style to predefined styles
  if (styleLower.includes('minimalist') || styleLower.includes('minimal')) return 'minimalist';
  if (styleLower.includes('bold') || styleLower.includes('loud') || styleLower.includes('impact')) return 'bold';
  if (styleLower.includes('elegant') || styleLower.includes('refined') || styleLower.includes('sophisticated')) return 'elegant';
  if (styleLower.includes('playful') || styleLower.includes('fun') || styleLower.includes('friendly')) return 'playful';
  if (styleLower.includes('tech') || styleLower.includes('modern') || styleLower.includes('futuristic')) return 'tech';
  if (styleLower.includes('classic') || styleLower.includes('traditional') || styleLower.includes('timeless')) return 'classic';
  if (styleLower.includes('hand') || styleLower.includes('drawn') || styleLower.includes('artisan') || styleLower.includes('craft')) return 'handdrawn';
  if (styleLower.includes('abstract') || styleLower.includes('fluid') || styleLower.includes('dynamic')) return 'abstract';

  // Default to minimalist if can't detect
  return 'minimalist';
}

// Image generation models - Flux Pro works best for logos
const IMAGE_AI_MODELS = {
  [AIProvider.TOGETHER]: [
    { id: 'black-forest-labs/FLUX.1-pro', name: 'Flux Pro', description: '⭐ BEST - Premium quality for logos' },
    { id: 'black-forest-labs/FLUX.1-schnell-Free', name: 'Flux Schnell (Free)', description: 'Fast & Free' },
    { id: 'black-forest-labs/FLUX.1-Kontext-dev', name: 'Flux Kontext Dev', description: 'Good for typography' },
  ],
  [AIProvider.REPLICATE]: [
    { id: 'black-forest-labs/flux-1.1-pro', name: 'Flux 1.1 Pro', description: '⭐ BEST - High quality' },
    { id: 'black-forest-labs/flux-kontext-pro', name: 'Flux Kontext Pro', description: 'Perfect for logo typography' },
    { id: 'recraft-ai/recraft-v3-svg', name: 'Recraft V3 SVG', description: 'Generates SVG logos' },
  ],
  [AIProvider.LOCAL]: [
    { id: 'mock-flux', name: 'Mock Flux', description: 'Testing (placeholders)' },
  ],
};

export default function LogoGeneratorModule({ module }: LogoGeneratorModuleProps) {
  const { updateModule, addLog, addModule, addConnection } = useSpaceStore();
  // Use reactive selector to always get fresh space data (including API keys)
  const space = useSpaceStore(state => state.spaces.find(s => s.id === state.currentSpaceId));
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numVariants, setNumVariants] = useState<number>(3);

  const outputs = module.outputs as LogoGeneratorOutputs;

  // Detect style from branding if available
  const connections = space?.connections || [];
  const incomingConnection = connections.find(
    (conn) => conn.targetModuleId === module.id && conn.targetPortId === 'in-1'
  );
  const sourceModule = space?.modules.find((m) => m.id === incomingConnection?.sourceModuleId);
  const branding = sourceModule?.outputs.namingPackage?.branding;
  const detectedStyle = detectStyleFromBranding(branding?.design_style);

  const [selectedStyle, setSelectedStyle] = useState<LogoStyleKey>(detectedStyle || 'minimalist');

  // Get module inputs for AI config
  const inputs = (module.inputs || {}) as any;
  // Use provider from space configuration (Settings: AI Provider) - Default to TOGETHER for Flux Pro
  const selectedProvider: AIProvider = space?.configuration?.aiConfig?.provider || AIProvider.TOGETHER;
  const selectedModel = inputs.aiModel || IMAGE_AI_MODELS[selectedProvider]?.[0]?.id;

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

      // Get input from connected module (Module 3 - Naming Engine)
      const connections = space?.connections || [];
      const incomingConnection = connections.find(
        (conn) => conn.targetModuleId === module.id && conn.targetPortId === 'in-1'
      );

      if (!incomingConnection) {
        throw new Error('No input connected. Connect output from Naming Engine module.');
      }

      // Get the source module
      const sourceModule = space?.modules.find((m) => m.id === incomingConnection.sourceModuleId);
      if (!sourceModule) {
        throw new Error('Source module not found. Please check the connection.');
      }

      // Build logo brief from naming engine outputs
      const chosenName = sourceModule.outputs.chosenName;
      const namingPackage = sourceModule.outputs.namingPackage;
      const flowContext = sourceModule.outputs.flowContext || { language: 'en' };

      if (!chosenName) {
        throw new Error(
          `No final name selected in Naming Engine.\n\n` +
          `Please:\n` +
          `1. Run Naming Engine module\n` +
          `2. Select a final name\n` +
          `3. Then run Logo Generator`
        );
      }

      // Get app intelligence from previous modules for context
      const aieEngineModule = space?.modules.find(m => m.type === 'reader-engine');
      const appIntelligence = aieEngineModule?.outputs.appIntelligence;

      // Build logo brief from branding identity (V3.0 - Complete Branding)
      const branding = namingPackage?.branding;

      const logoBrief: LogoBrief = {
        brand_name: chosenName.final_name,
        final_name: chosenName.final_name,
        tagline: namingPackage?.slogan,
        category: appIntelligence?.category || 'General',

        // Use branding colors if available, fallback to AIE suggestions
        color_palette: branding?.color_palette || appIntelligence?.brandColorsSuggested || ['#1A3B5D', '#FFC700'],

        // Use complete branding style
        style: branding?.design_style || namingPackage?.style || appIntelligence?.designStyle || 'modern minimalistic',

        brand_keywords: namingPackage?.naming_keywords || appIntelligence?.keywords || [],

        // Add shape preferences from branding
        shape_preferences: branding?.shape_style,

        num_variants: numVariants,

        // Complete Branding Information (V3.0) - CRITICAL for context-rich logo generation
        visual_direction: branding?.visual_direction, // What the app does, users, features, mood, visual elements
        branding_concept: branding?.branding_concept, // WHY behind the visual choices
        icon_style: branding?.icon_style, // Icon approach (minimalist, detailed, abstract)
        brand_tone: branding?.brand_tone, // Overall personality
        target_emotion: branding?.target_emotion, // Main emotion to evoke
        color_meanings: branding?.color_meanings, // What each color represents
        primary_font_family: branding?.primary_font_family, // Main font
        secondary_font_family: branding?.secondary_font_family, // Complementary font
      };

      // Generate logos using AI image provider
      addLog('info', `Generating ${logoBrief.num_variants} logo variants for "${logoBrief.brand_name}" with ${selectedProvider}...`, module.id);

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
        throw new Error(`API key for ${selectedProvider} not configured. Please add it in Settings (API Keys tab).`);
      }

      // Build prompt using the complete branding information and selected style
      const logoPrompt = buildLogoPrompt(logoBrief, 1, selectedStyle, branding);

      // Call image generation API with num_outputs parameter
      const imageResult = await imageProvider.generate({
        provider: selectedProvider,
        model: selectedModel,
        apiKey,
        prompt: logoPrompt,
        num_outputs: logoBrief.num_variants, // Generate all variants in ONE call
        aspect_ratio: '1:1',
        width: 1024,
        height: 1024,
      });

      addLog('success', `Generated ${imageResult.count} logo variants using ${imageResult.providerUsed}`, module.id);

      // Create LogoOption objects from generated images
      const mockLogos: LogoOption[] = imageResult.images.map((imageUrl, i) => ({
        id: i + 1,
        image_url: imageUrl,
        style_summary: `${LOGO_STYLES[selectedStyle].name} - ${logoBrief.style} logo variant ${i + 1}`,
        colors_used: logoBrief.color_palette,
        strengths: `AI-generated using ${imageResult.model} with ${LOGO_STYLES[selectedStyle].name} style`,
        weaknesses: i === 0 ? 'Primary variant' : `Alternative ${i}`,
        ai_prompt_used: buildLogoPrompt(logoBrief, i + 1, selectedStyle, branding),
      }));

      // Delete any existing variant nodes from previous runs
      const existingVariants = space?.modules.filter(
        m => m.type === 'logo-variant' && m.inputs.generatorModuleId === module.id
      ) || [];

      for (const variant of existingVariants) {
        // Delete connections to variant
        const variantConnections = space?.connections.filter(
          conn => conn.sourceModuleId === variant.id || conn.targetModuleId === variant.id
        ) || [];
        for (const conn of variantConnections) {
          useSpaceStore.getState().deleteConnection(conn.id);
        }
        // Delete variant module
        useSpaceStore.getState().deleteModule(variant.id);
      }

      // Create variant nodes on the canvas
      const VARIANT_SPACING_Y = 480; // Vertical spacing between variants
      const VARIANT_OFFSET_X = 500; // Horizontal distance from generator

      for (let i = 0; i < mockLogos.length; i++) {
        const logo = mockLogos[i];

        // Calculate position to the right of the generator
        const variantPosition = {
          x: module.position.x + VARIANT_OFFSET_X,
          y: module.position.y + (i * VARIANT_SPACING_Y)
        };

        // Create variant module node
        addModule('logo-variant', variantPosition);

        // Get the newly created module (it's the last one)
        const updatedSpace = useSpaceStore.getState().getCurrentSpace();
        const newVariantModule = updatedSpace?.modules[updatedSpace.modules.length - 1];

        if (newVariantModule) {
          // Update variant module with logo data
          const variantOutputs: LogoVariantOutputs = {
            logoData: {
              image_url: logo.image_url,
              brand_name: logoBrief.brand_name,
              style_summary: logo.style_summary,
              colors_used: logo.colors_used,
              ai_prompt_used: logo.ai_prompt_used,
            },
            flowContext: {
              ...flowContext,
              // Add logo-specific context
            },
          };

          updateModule(newVariantModule.id, {
            name: `Logo Variant #${logo.id} (Generated)`,
            status: 'done',
            inputs: {
              variantId: logo.id,
              generatorModuleId: module.id,
            },
            outputs: variantOutputs,
          });

          // Create connection from generator to variant
          addConnection({
            sourceModuleId: module.id,
            sourcePortId: 'out-1',
            targetModuleId: newVariantModule.id,
            targetPortId: 'in-1',
            dataType: 'json' as any,
          });
        }
      }

      // Update generator module status
      const logoOptions: LogoOptionsPackage = {
        brand_name: logoBrief.brand_name,
        num_variants: mockLogos.length,
        options: mockLogos,
      };

      const newOutputs: LogoGeneratorOutputs = {
        logoOptions,
        logoLog: `Logo generation completed\n` +
                 `Brand: ${logoBrief.brand_name}\n` +
                 `Variants: ${mockLogos.length}\n` +
                 `Language: ${flowContext.language}\n` +
                 `Timestamp: ${new Date().toISOString()}`,
        flowContext,
      };

      updateModule(module.id, {
        status: 'done',
        outputs: newOutputs
      });

      addLog('success', `${mockLogos.length} logo variants generated as separate nodes.`, module.id);

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

    window.addEventListener('logo-generator-run', handleExternalRun as EventListener);
    return () => window.removeEventListener('logo-generator-run', handleExternalRun as EventListener);
  }, [module.id, handleRun]);

  // Determine status light color
  const getStatusLight = () => {
    if (module.status === 'done' && outputs?.logoOptions) {
      return '🟢'; // Green - variants generated
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
            {module.status === 'done' && outputs?.logoOptions ? `Generated ${outputs.logoOptions.num_variants} logo variants` :
             module.status === 'invalid' ? 'Outdated - Re-run Required' :
             'Ready to Generate Logos'}
          </span>
        </div>
        <PhotoIcon className="w-5 h-5 text-pink-400" />
      </div>

      {/* Info */}
      <div className="px-3 py-2 bg-[#0A0A0A]/50 border border-[#3A3A3A]/50 rounded-lg">
        <p className="text-xs text-gray-400 mb-3">
          Generate logo variants using AI. Each variant will appear as a separate node on the canvas. Connect from Naming Engine to get started.
        </p>

        {/* AI Model Selector */}
        <div className="space-y-3 mb-3 pb-3 border-b border-[#3A3A3A]/50">
          <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-pink-400" />
            AI Image Generator
          </div>

          {/* Current Provider Info */}
          <div className="px-3 py-2 bg-[#0A0A0A]/80 border border-[#3A3A3A] rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Service Provider:</span>
              <span className="text-xs text-white font-medium">{selectedProvider}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Configure in Settings → AI Provider</p>
          </div>

          {/* Recommended Model */}
          <div className="px-3 py-2.5 bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/30 rounded-lg">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-pink-400 font-semibold">⭐ Recommended Model</span>
              <span className="text-xs text-gray-500">({selectedProvider})</span>
            </div>
            <p className="text-sm text-white font-medium">
              {IMAGE_AI_MODELS[selectedProvider as keyof typeof IMAGE_AI_MODELS]?.[0]?.name}
            </p>
            <p className="text-xs text-gray-300 mt-0.5">
              {IMAGE_AI_MODELS[selectedProvider as keyof typeof IMAGE_AI_MODELS]?.[0]?.description}
            </p>
          </div>

          {/* Model Selector */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">
              Choose AI Model (3 options)
            </label>
            <select
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500 transition-colors"
            >
              {IMAGE_AI_MODELS[selectedProvider as keyof typeof IMAGE_AI_MODELS]?.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} - {model.description}
                </option>
              ))}
            </select>
          </div>

          {/* API Key Status */}
          {selectedProvider !== AIProvider.LOCAL &&
            !space?.configuration?.apiKeys?.[selectedProvider.toLowerCase() as keyof typeof space.configuration.apiKeys] && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-red-400">⚠️ API Key Missing</span>
                <span className="text-gray-400">Add {selectedProvider} key in Settings &gt; API Keys tab</span>
              </div>
            </div>
          )}
        </div>

        {/* Logo Style Selector */}
        <div className="mt-3 pt-3 border-t border-[#3A3A3A]/50">
          <label className="block mb-2">
            <span className="text-xs text-gray-300 font-medium">Logo Style:</span>
            {detectedStyle && (
              <span className="ml-2 text-xs text-green-400">✓ Auto-detected from branding</span>
            )}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(LOGO_STYLES) as LogoStyleKey[]).map((styleKey) => (
              <button
                key={styleKey}
                onClick={() => setSelectedStyle(styleKey)}
                disabled={isProcessing}
                className={`px-3 py-2 rounded-lg text-left transition-all ${
                  selectedStyle === styleKey
                    ? 'bg-pink-500/20 border-2 border-pink-500 text-white'
                    : 'bg-[#1A1A1A] border border-[#3A3A3A] text-gray-300 hover:border-pink-500/50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="text-xs font-semibold mb-0.5">{LOGO_STYLES[styleKey].name}</div>
                <div className="text-xs text-gray-400 leading-tight">{LOGO_STYLES[styleKey].description}</div>
              </button>
            ))}
          </div>
          {module.status === 'done' && outputs?.logoOptions && (
            <p className="text-xs text-gray-500 mt-2">
              Last style used: <span className="text-pink-400">{LOGO_STYLES[selectedStyle].name}</span>
            </p>
          )}
        </div>

        {/* Variants selector - always visible */}
        <div className="mt-3 pt-3 border-t border-[#3A3A3A]/50">
          <label className="flex items-center justify-between">
            <span className="text-xs text-gray-300 font-medium">Number of variants:</span>
            <select
              value={numVariants}
              onChange={(e) => setNumVariants(Number(e.target.value))}
              disabled={isProcessing}
              className="ml-3 px-3 py-1.5 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg text-xs text-white focus:outline-none focus:border-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value={1}>1 variant</option>
              <option value={2}>2 variants</option>
              <option value={3}>3 variants</option>
              <option value={4}>4 variants</option>
              <option value={5}>5 variants</option>
            </select>
          </label>
          {module.status === 'done' && outputs?.logoOptions && (
            <p className="text-xs text-gray-500 mt-1.5">
              Last run: {outputs.logoOptions.num_variants} variant{outputs.logoOptions.num_variants > 1 ? 's' : ''}
            </p>
          )}
        </div>
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

      {/* Success Display */}
      {module.status === 'done' && outputs?.logoOptions && (
        <div className="px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-400" />
            <span className="text-xs text-green-300 font-medium">Generated Successfully</span>
          </div>
          <p className="text-xs text-green-200 mt-1">
            {outputs.logoOptions.num_variants} logo variant{outputs.logoOptions.num_variants > 1 ? 's' : ''} created as separate nodes.
            Look to the right to see them →
          </p>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-blue-300">Generating logos with AI...</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Build logo generation prompt with complete branding context (V4.0)
 * ALWAYS generates prompts in ENGLISH for better AI results
 */
function buildLogoPrompt(brief: LogoBrief, variantNumber: number, selectedStyle: LogoStyleKey, branding?: any): string {
  const colors = brief.color_palette.join(', ');
  const keywords = brief.brand_keywords.join(', ');
  const stylePreset = LOGO_STYLES[selectedStyle];

  // Build comprehensive branding section if available
  let brandingSection = '';
  if (branding) {
    brandingSection = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPLETE BRANDING IDENTITY:

Visual Style:
- Design Style: ${branding.design_style}
- Shape Style: ${branding.shape_style}
- Icon Style: ${branding.icon_style}

Typography Context:
- Primary Font: ${branding.primary_font_family}
- Secondary Font: ${branding.secondary_font_family}
- Font Style: ${branding.font_style}

Brand Personality:
- Brand Tone: ${branding.brand_tone}
- Target Emotion: ${branding.target_emotion}
- Brand Values: ${branding.brand_values.join(', ')}

Color Palette with Meanings:
${branding.color_palette.map((color: string, i: number) =>
  `- ${color}: ${branding.color_meanings?.[i] || 'Primary brand color'}`
).join('\n')}

Branding Concept:
${branding.branding_concept}

Visual Direction:
${branding.visual_direction}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }

  return `Create a professional, AI-generated logo for the brand "${brief.brand_name}".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 SELECTED LOGO STYLE: ${stylePreset.name.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${stylePreset.prompt}

CRITICAL: This is a ${stylePreset.name} style logo. Follow these aesthetic guidelines STRICTLY:

BRAND NAME: ${brief.brand_name}
${brief.tagline ? `TAGLINE: "${brief.tagline}"` : ''}

BASIC INFO:
- Style: ${brief.style}
- Category: ${brief.category}
- Colors: ${colors}
- Keywords: ${keywords}
${brief.shape_preferences ? `- Shape preferences: ${brief.shape_preferences}` : ''}
${brief.avoid_elements ? `- Avoid: ${brief.avoid_elements.join(', ')}` : ''}
${brandingSection}

VARIANT NUMBER: #${variantNumber}
This is variant #${variantNumber}. Create a UNIQUE interpretation while maintaining brand consistency.
${variantNumber === 1 ? 'Focus on a bold, primary interpretation.' : ''}
${variantNumber === 2 ? 'Explore a more abstract or conceptual approach.' : ''}
${variantNumber === 3 ? 'Try a minimalist or simplified version.' : ''}
${variantNumber >= 4 ? 'Experiment with alternative compositions or styles.' : ''}

TECHNICAL REQUIREMENTS:
- Clean, vector-style design
- High contrast and legibility
- Works in both color and monochrome
- Scalable from 16px to 1024px
- Professional quality
- No text in the logo (brand name is separate)
- Simple enough to be memorable
- Unique enough to stand out

${branding ? `STYLE GUIDANCE:
Follow the ${branding.design_style} aesthetic with ${branding.shape_style} geometric forms.
Icon should be ${branding.icon_style}.
Overall feel should evoke ${branding.target_emotion} and communicate ${branding.brand_values[0]}.` : ''}`;
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

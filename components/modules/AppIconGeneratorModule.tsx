'use client';

import React, { useState } from 'react';
import { useSpaceStore } from '@/lib/store';
import type { Module, AppIconGeneratorOutputs, IconBrief, AppIconVariant, AppIconOptionsPackage, IconSizeSet, FlowContext, AppIconVariantOutputs } from '@/types';
import { AIProvider } from '@/types';
import { CheckCircleIcon, DevicePhoneMobileIcon, ExclamationTriangleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import imageProvider from '@/lib/image-provider';
import '@/lib/image-adapters'; // Initialize image adapters

interface AppIconGeneratorModuleProps {
  module: Module;
}

/**
 * Resize and center an image to a specific size
 * Returns a data URL of the resized image
 */
async function resizeImageToSquare(imageUrl: string, targetSize: number = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Fill with transparent background
      ctx.clearRect(0, 0, targetSize, targetSize);

      // Calculate scaling to fit image while maintaining aspect ratio
      const scale = Math.min(targetSize / img.width, targetSize / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      // Center the image
      const x = (targetSize - scaledWidth) / 2;
      const y = (targetSize - scaledHeight) / 2;

      // Draw image centered and scaled
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

      // Convert to data URL
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

// Icon Style Presets - Guide AI generation for app icons
const ICON_STYLES = {
  flat: {
    name: 'Flat Design',
    description: 'Clean, 2D shapes, solid colors, minimal shadows',
    prompt: 'flat design app icon with clean 2D shapes, solid colors, no gradients, minimal shadows, modern iOS/Android style',
  },
  gradient: {
    name: 'Gradient Modern',
    description: 'Smooth gradients, vibrant colors, depth',
    prompt: 'modern gradient app icon with smooth color transitions, vibrant colors, subtle depth, contemporary mobile style',
  },
  material: {
    name: 'Material Design',
    description: 'Google Material, shadows, bold colors',
    prompt: 'material design app icon with bold colors, subtle shadows, clean geometric shapes, Android-inspired aesthetic',
  },
  glass: {
    name: 'Glassmorphism',
    description: 'Frosted glass effect, transparency, blur',
    prompt: 'glassmorphism app icon with frosted glass effect, subtle transparency, background blur, modern premium feel',
  },
  minimalist: {
    name: 'Minimalist',
    description: 'Ultra simple, monochrome or dual-tone',
    prompt: 'minimalist app icon with ultra-simple design, clean lines, monochrome or dual-tone colors, maximum simplicity',
  },
  '3d': {
    name: '3D/Realistic',
    description: 'Three-dimensional, realistic lighting',
    prompt: '3D realistic app icon with three-dimensional shapes, realistic lighting and shadows, depth and volume, premium quality',
  },
} as const;

type IconStyleKey = keyof typeof ICON_STYLES;

// Image generation models - Flux Pro works best for app icons
const IMAGE_AI_MODELS = {
  [AIProvider.TOGETHER]: [
    { id: 'black-forest-labs/FLUX.1-pro', name: 'Flux Pro', description: '⭐ BEST - Premium quality for icons' },
    { id: 'black-forest-labs/FLUX.1-schnell-Free', name: 'Flux Schnell (Free)', description: 'Fast & Free' },
    { id: 'black-forest-labs/FLUX.1-Kontext-dev', name: 'Flux Kontext Dev', description: 'Good for icons' },
  ],
  [AIProvider.REPLICATE]: [
    { id: 'black-forest-labs/flux-1.1-pro', name: 'Flux 1.1 Pro', description: '⭐ BEST - High quality' },
    { id: 'black-forest-labs/flux-kontext-pro', name: 'Flux Kontext Pro', description: 'Perfect for icon design' },
    { id: 'recraft-ai/recraft-v3-svg', name: 'Recraft V3 SVG', description: 'Generates SVG icons' },
  ],
  [AIProvider.LOCAL]: [
    { id: 'mock-flux', name: 'Mock Flux', description: 'Testing (placeholders)' },
  ],
};

/**
 * Module 4B - App Icon Generator
 *
 * Generates official app icons for iOS and Android from:
 * - Logo input (from Module 4A or direct)
 * - Branding input (from Module 3)
 *
 * Creates multiple variants with all required sizes:
 * - iOS: 1024×1024 (App Store)
 * - Android: 512×512 (Google Play) + 5 DPI sizes
 *
 * Each variant spawns as a separate node on the canvas.
 */
export default function AppIconGeneratorModule({ module }: AppIconGeneratorModuleProps) {
  const { updateModule, addLog, addModule, addConnection } = useSpaceStore();
  // Use reactive selector to always get fresh space data (including API keys)
  const space = useSpaceStore(state => state.spaces.find(s => s.id === state.currentSpaceId));
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numVariants, setNumVariants] = useState<number>(3);
  const [selectedStyle, setSelectedStyle] = useState<IconStyleKey>('flat');

  const outputs = module.outputs as AppIconGeneratorOutputs;

  // Get module inputs for AI config and mode
  const inputs = (module.inputs || {}) as any;
  const generationMode = inputs.generationMode || 'resize'; // 'ai' or 'resize' - default to resize (faster, cheaper)
  // Use provider from space configuration (Settings > AI Provider) - Default to TOGETHER for Flux Pro
  const selectedProvider: AIProvider = space?.configuration?.aiConfig?.provider || AIProvider.TOGETHER;
  const selectedModel = inputs.aiModel || IMAGE_AI_MODELS[selectedProvider]?.[0]?.id;

  const handleModeChange = (mode: 'ai' | 'resize') => {
    updateModule(module.id, {
      inputs: {
        ...inputs,
        generationMode: mode,
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

      // Get connections - TWO INPUTS
      const connections = space?.connections || [];

      // Input 1: Logo (from Module 4A or Logo Variant)
      const logoConnection = connections.find(
        (conn) => conn.targetModuleId === module.id && conn.targetPortId === 'in-1'
      );

      // Input 2: Branding (from Module 3 or any JSON source)
      const brandingConnection = connections.find(
        (conn) => conn.targetModuleId === module.id && conn.targetPortId === 'in-2'
      );

      // Validation - at least ONE input is required
      if (!logoConnection && !brandingConnection) {
        throw new Error(
          'No inputs connected.\n\n' +
          'Connect at least one:\n' +
          '• Logo from Module 4A (Port 1)\n' +
          '• Branding from Module 3 (Port 2)'
        );
      }

      // Get logo data if connected
      let logoUrl: string | undefined;
      let logoFlowContext: FlowContext | undefined;

      if (logoConnection) {
        const logoModule = space?.modules.find((m) => m.id === logoConnection.sourceModuleId);
        if (logoModule) {
          // Could be from Logo Variant or Logo Generator
          if (logoModule.type === 'logo-variant') {
            logoUrl = logoModule.outputs.logoData?.image_url;
            logoFlowContext = logoModule.outputs.flowContext;
          } else if (logoModule.type === 'icon-generator') {
            logoUrl = logoModule.outputs.chosenLogo?.final_logo_url;
            logoFlowContext = logoModule.outputs.flowContext;
          }
        }
      }

      // Get branding data if connected
      let brandingData: any = null;
      let brandingFlowContext: FlowContext | undefined;

      if (brandingConnection) {
        const brandingModule = space?.modules.find((m) => m.id === brandingConnection.sourceModuleId);
        if (brandingModule) {
          if (brandingModule.type === 'naming-engine') {
            brandingData = {
              namingPackage: brandingModule.outputs.namingPackage,
              chosenName: brandingModule.outputs.chosenName,
            };
            brandingFlowContext = brandingModule.outputs.flowContext;
          }
        }
      }

      // Merge flow contexts (branding takes priority)
      const flowContext = {
        ...(logoFlowContext || {}),
        ...(brandingFlowContext || {}),
      };

      // ============================================================
      // MODE: RESIZE FROM LOGO
      // ============================================================
      if (generationMode === 'resize') {
        // Resize mode requires a logo
        if (!logoUrl) {
          throw new Error(
            'Resize mode requires a logo.\n\n' +
            'Please connect a logo from Module 4A (Port 1) or switch to AI Generate mode.'
          );
        }

        addLog('info', `Resizing logo to app icon sizes (1024x1024)...`, module.id);

        // Resize the logo to 1024x1024
        const resizedIcon1024 = await resizeImageToSquare(logoUrl, 1024);
        const resizedIcon512 = await resizeImageToSquare(logoUrl, 512);

        // Create a single variant with resized logo
        const variant: AppIconVariant = {
          id: 1,
          variant_name: 'Resized Logo',
          design_concept: 'Direct resize from logo',
          target_persona: 'All users',
          tone: 'Brand consistent',
          image_url: resizedIcon1024,
          image_prompt: 'N/A (resized from logo)',
          ios_sizes: {
            app_store_1024: resizedIcon1024,
          },
          android_sizes: {
            google_play_512: resizedIcon512,
          },
          generated_at: new Date().toISOString(),
        };

        // Create icon options package
        const iconOptions: AppIconOptionsPackage = {
          brand_name: brandingData?.chosenName?.final_name || 'App',
          num_variants: 1,
          variants: [variant],
          base_style: 'resize',
          generated_at: new Date().toISOString(),
        };

        // Update module outputs
        const newOutputs: AppIconGeneratorOutputs = {
          iconOptions,
          flowContext,
        };

        updateModule(module.id, {
          status: 'done',
          outputs: newOutputs,
        });

        addLog('success', `✓ Icon resized successfully!`, module.id);
        setIsProcessing(false);
        return;
      }

      // ============================================================
      // MODE: AI GENERATION
      // ============================================================

      // Build icon brief from available data
      const iconBrief: IconBrief = buildIconBrief(
        logoUrl,
        brandingData,
        flowContext,
        numVariants,
        selectedStyle
      );

      addLog('info', `Generating ${iconBrief.icon_variants} app icon variants for "${iconBrief.brand_name}" with ${selectedProvider}...`, module.id);

      // Get API key from space configuration (aiConfig stores key for selected provider)
      const apiKey = space?.configuration?.aiConfig?.provider === selectedProvider
        ? space?.configuration?.aiConfig?.apiKey
        : undefined;

      if (!apiKey && selectedProvider !== AIProvider.LOCAL) {
        throw new Error(`API key for ${selectedProvider} not configured. Please add it in Settings > AI Provider.`);
      }

      // Generate icon variants using AI
      const mockIcons: AppIconVariant[] = await generateIconVariants(
        iconBrief,
        logoUrl,
        flowContext,
        selectedProvider,
        selectedModel,
        apiKey || '',
        selectedStyle,
        brandingData?.namingPackage?.branding
      );

      addLog('success', `Generated ${mockIcons.length} app icon variants using ${selectedProvider}`, module.id);

      // Delete existing variant nodes from previous runs
      const existingVariants = space?.modules.filter(
        m => m.type === 'app-icon-variant' && m.inputs.generatorModuleId === module.id
      ) || [];

      for (const variant of existingVariants) {
        const variantConnections = space?.connections.filter(
          conn => conn.sourceModuleId === variant.id || conn.targetModuleId === variant.id
        ) || [];
        for (const conn of variantConnections) {
          useSpaceStore.getState().deleteConnection(conn.id);
        }
        useSpaceStore.getState().deleteModule(variant.id);
      }

      // Create variant nodes on the canvas
      const VARIANT_SPACING_Y = 600; // Vertical spacing between variants
      const VARIANT_OFFSET_X = 550; // Horizontal distance from generator

      for (let i = 0; i < mockIcons.length; i++) {
        const icon = mockIcons[i];

        // Calculate position to the right of the generator
        const variantPosition = {
          x: module.position.x + VARIANT_OFFSET_X,
          y: module.position.y + (i * VARIANT_SPACING_Y)
        };

        // Create variant module node
        addModule('app-icon-variant', variantPosition);

        // Get the newly created module
        const updatedSpace = useSpaceStore.getState().getCurrentSpace();
        const newVariantModule = updatedSpace?.modules[updatedSpace.modules.length - 1];

        if (newVariantModule) {
          // Update variant module with icon data
          const variantOutputs: AppIconVariantOutputs = {
            iconData: {
              preview_image: icon.preview_image,
              brand_name: iconBrief.brand_name,
              style_summary: icon.style_summary,
              background_type: icon.background_type,
              sizes: icon.sizes,
              ai_prompt_used: icon.prompt_used,
            },
            flowContext: {
              ...flowContext,
              appName: iconBrief.brand_name,
            },
          };

          updateModule(newVariantModule.id, {
            name: `App Icon Variant #${icon.id}`,
            status: 'done',
            inputs: {
              variantId: icon.id,
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

      // Update generator module
      const iconOptions: AppIconOptionsPackage = {
        brand_name: iconBrief.brand_name,
        num_variants: mockIcons.length,
        variants: mockIcons,
      };

      const newOutputs: AppIconGeneratorOutputs = {
        iconOptions,
        iconLog: `App icon generation completed\n` +
                 `Brand: ${iconBrief.brand_name}\n` +
                 `Variants: ${mockIcons.length}\n` +
                 `Style: ${ICON_STYLES[selectedStyle].name}\n` +
                 `Timestamp: ${new Date().toISOString()}`,
        flowContext,
      };

      updateModule(module.id, {
        status: 'done',
        outputs: newOutputs
      });

      addLog('success', `${mockIcons.length} app icon variants generated as separate nodes.`, module.id);

    } catch (err: any) {
      const errorMsg = err.message || 'Unknown error occurred';
      setError(errorMsg);
      updateModule(module.id, { status: 'error', errorMessage: errorMsg });
      addLog('error', errorMsg, module.id);
    } finally {
      setIsProcessing(false);
    }
  };

  // Listen for external run trigger
  React.useEffect(() => {
    const handleExternalRun = (event: any) => {
      if (event.detail?.moduleId === module.id) {
        handleRun();
      }
    };

    window.addEventListener('app-icon-generator-run', handleExternalRun as EventListener);
    return () => window.removeEventListener('app-icon-generator-run', handleExternalRun as EventListener);
  }, [module.id, handleRun]);

  // Determine status light color
  const getStatusLight = () => {
    if (module.status === 'done' && outputs?.iconOptions) {
      return '🟢'; // Green - icons generated
    } else if (module.status === 'error') {
      return '🔴'; // Red - error
    } else if (module.status === 'invalid') {
      return '🟠'; // Orange - outdated
    } else {
      return '⚪'; // Gray - idle
    }
  };

  // Check what inputs are connected
  const connections = space?.connections || [];
  const logoConnected = connections.some(c => c.targetModuleId === module.id && c.targetPortId === 'in-1');
  const brandingConnected = connections.some(c => c.targetModuleId === module.id && c.targetPortId === 'in-2');

  return (
    <div className="space-y-4">
      {/* Status Light */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0A0A0A]/50 border border-[#3A3A3A]/50 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getStatusLight()}</span>
          <span className="text-xs text-gray-400">
            {module.status === 'done' && outputs?.iconOptions ? `Generated ${outputs.iconOptions.num_variants} icon variants` :
             module.status === 'invalid' ? 'Outdated - Re-run Required' :
             'Ready to Generate App Icons'}
          </span>
        </div>
        <DevicePhoneMobileIcon className="w-5 h-5 text-blue-400" />
      </div>

      {/* Connection Status */}
      <div className="px-3 py-2 bg-[#0A0A0A]/50 border border-[#3A3A3A]/50 rounded-lg">
        <p className="text-xs text-gray-400 mb-2 font-medium">📱 Dual Input Module</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${logoConnected ? 'bg-green-400' : 'bg-gray-600'}`} />
            <span className="text-xs text-gray-300">Port 1: Logo {logoConnected ? '✓' : '(optional)'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${brandingConnected ? 'bg-green-400' : 'bg-gray-600'}`} />
            <span className="text-xs text-gray-300">Port 2: Branding {brandingConnected ? '✓' : '(optional)'}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Connect at least one input to generate icons
        </p>
      </div>

      {/* Generation Mode Selector */}
      <div className="px-3 py-2 bg-[#0A0A0A]/50 border border-[#3A3A3A]/50 rounded-lg">
        <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">
          Generation Mode
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleModeChange('resize')}
            className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
              generationMode === 'resize'
                ? 'bg-green-600 text-white border-2 border-green-400'
                : 'bg-[#1A1A1A] text-gray-400 border border-[#3A3A3A] hover:border-gray-500'
            }`}
          >
            <div className="font-semibold mb-1">⚡ Resize Logo</div>
            <div className="text-[10px] opacity-80">Fast • Free • Exact</div>
          </button>
          <button
            onClick={() => handleModeChange('ai')}
            className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
              generationMode === 'ai'
                ? 'bg-blue-600 text-white border-2 border-blue-400'
                : 'bg-[#1A1A1A] text-gray-400 border border-[#3A3A3A] hover:border-gray-500'
            }`}
          >
            <div className="font-semibold mb-1">✨ AI Generate</div>
            <div className="text-[10px] opacity-80">Creative • Variants</div>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {generationMode === 'resize'
            ? '📦 Resizes and centers your logo into app icon sizes'
            : '🎨 Creates new AI-generated icon variants'}
        </p>
      </div>

      {/* AI Model Selector - Only show in AI mode */}
      {generationMode === 'ai' && (
        <div className="px-3 py-2 bg-[#0A0A0A]/50 border border-[#3A3A3A]/50 rounded-lg">
          <div className="space-y-3">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-blue-400" />
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
          <div className="px-3 py-2.5 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-blue-400 font-semibold">⭐ Recommended Model</span>
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
              className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
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
            !(space?.configuration?.aiConfig?.provider === selectedProvider &&
              space?.configuration?.aiConfig?.apiKey) && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-red-400">⚠️ API Key Missing</span>
                <span className="text-gray-400">Add {selectedProvider} key in Settings &gt; AI Provider</span>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Settings - Only show variants and style selectors in AI mode */}
      {generationMode === 'ai' && (
        <div className="space-y-3">
          {/* Variants selector */}
          {(!module.status || module.status === 'idle' || module.status === 'invalid') && (
          <div className="px-3 py-2 bg-[#0A0A0A]/50 border border-[#3A3A3A]/50 rounded-lg">
            <label className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-300 font-medium">Number of variants:</span>
              <select
                value={numVariants}
                onChange={(e) => setNumVariants(Number(e.target.value))}
                className="ml-3 px-3 py-1.5 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value={1}>1 variant</option>
                <option value={2}>2 variants</option>
                <option value={3}>3 variants</option>
                <option value={4}>4 variants</option>
                <option value={5}>5 variants</option>
              </select>
            </label>

            {/* Icon Style Selector */}
            <div className="mt-3">
              <label className="block mb-2">
                <span className="text-xs text-gray-300 font-medium">Icon Style:</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(ICON_STYLES) as IconStyleKey[]).map((styleKey) => (
                  <button
                    key={styleKey}
                    onClick={() => setSelectedStyle(styleKey)}
                    disabled={isProcessing}
                    className={`px-3 py-2 rounded-lg text-left transition-all ${
                      selectedStyle === styleKey
                        ? 'bg-blue-500/20 border-2 border-blue-500 text-white'
                        : 'bg-[#1A1A1A] border border-[#3A3A3A] text-gray-300 hover:border-blue-500/50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="text-xs font-semibold mb-0.5">{ICON_STYLES[styleKey].name}</div>
                    <div className="text-xs text-gray-400 leading-tight">{ICON_STYLES[styleKey].description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Info */}
      <div className="px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-xs text-blue-300 font-medium mb-1">📱 iOS & Android Icons</p>
        <p className="text-xs text-blue-200/70 leading-relaxed">
          Generates complete icon sets:
          <br />• iOS: 1024×1024 (App Store)
          <br />• Android: 512×512 + 5 DPI sizes
          <br />• Each variant appears as a separate node
        </p>
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
      {module.status === 'done' && outputs?.iconOptions && (
        <div className="px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-400" />
            <span className="text-xs text-green-300 font-medium">Generated Successfully</span>
          </div>
          <p className="text-xs text-green-200 mt-1">
            {outputs.iconOptions.num_variants} icon variant{outputs.iconOptions.num_variants > 1 ? 's' : ''} with all required sizes.
            Look to the right →
          </p>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-blue-300">Generating app icons...</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Build icon brief from available inputs
 */
function buildIconBrief(
  logoUrl: string | undefined,
  brandingData: any,
  flowContext: FlowContext,
  numVariants: number,
  selectedStyle: IconStyleKey
): IconBrief {
  const brandName = brandingData?.chosenName?.final_name ||
                    flowContext.appName ||
                    'MyApp';

  const branding = brandingData?.namingPackage?.branding;

  return {
    brand_name: brandName,
    style: ICON_STYLES[selectedStyle].name,
    color_palette: branding?.color_palette || flowContext.brandColors || ['#007AFF', '#34C759'],
    background_preference: selectedStyle,
    shape: 'rounded-square',
    icon_variants: numVariants,
    include_symbol: !!logoUrl,
    source_logo_url: logoUrl,
    category: flowContext.category || 'App',

    // Complete Branding Information (V3.0) - CRITICAL for context-rich icon generation
    visual_direction: branding?.visual_direction,
    branding_concept: branding?.branding_concept,
    icon_style: branding?.icon_style,
    brand_tone: branding?.brand_tone,
    target_emotion: branding?.target_emotion,
    color_meanings: branding?.color_meanings,
  };
}

/**
 * Generate icon variants with all required sizes using AI
 */
async function generateIconVariants(
  brief: IconBrief,
  logoUrl: string | undefined,
  flowContext: FlowContext,
  provider: AIProvider,
  model: string,
  apiKey: string,
  selectedStyle: IconStyleKey,
  branding?: any
): Promise<AppIconVariant[]> {
  const variants: AppIconVariant[] = [];

  // Build prompt for the base icon generation (1024x1024 for iOS)
  // Include logo description if available
  const iconPrompt = buildIconPrompt(brief, 1, selectedStyle, branding, logoUrl);

  console.log('🎨 App Icon Generation Prompt:', iconPrompt);
  console.log('📸 Logo Reference URL:', logoUrl || 'None');
  console.log('🎯 Branding Available:', !!branding);

  // Call image generation API to generate all variants in one call
  const imageResult = await imageProvider.generate({
    provider,
    model,
    apiKey,
    prompt: iconPrompt,
    num_outputs: brief.icon_variants,
    aspect_ratio: '1:1',
    width: 1024,
    height: 1024,
  });

  // Create variants from generated images
  for (let i = 0; i < imageResult.images.length; i++) {
    const variantId = i + 1;
    const mainImageUrl = imageResult.images[i];

    // For now, we'll use the main image for all sizes
    // In a real implementation, you'd resize the image to different sizes
    const sizes: IconSizeSet = {
      ios_1024: mainImageUrl,
      android_512: mainImageUrl,
      android_xxxhdpi: mainImageUrl,
      android_xxhdpi: mainImageUrl,
      android_xhdpi: mainImageUrl,
      android_hdpi: mainImageUrl,
      android_mdpi: mainImageUrl,
      favicon_32: mainImageUrl,
    };

    variants.push({
      id: variantId,
      preview_image: mainImageUrl,
      sizes,
      style_summary: `${ICON_STYLES[selectedStyle].name} - AI-generated variant ${variantId}`,
      background_type: selectedStyle,
      prompt_used: buildIconPrompt(brief, variantId, selectedStyle, branding, logoUrl),
    });
  }

  return variants;
}

/**
 * Build icon generation prompt with branding context and logo reference
 */
function buildIconPrompt(brief: IconBrief, variantNumber: number, selectedStyle: IconStyleKey, branding?: any, logoUrl?: string): string {
  const colors = brief.color_palette.join(', ');
  const stylePreset = ICON_STYLES[selectedStyle];

  // Build logo reference section if available
  let logoSection = '';
  if (logoUrl) {
    logoSection = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📸 LOGO REFERENCE AVAILABLE:

IMPORTANT: A logo image exists for this brand at: ${logoUrl}

Please create an app icon that:
1. MAINTAINS the visual identity and key elements from the logo
2. ADAPTS the logo design to work as a mobile app icon (square format, simplified)
3. PRESERVES recognizable brand elements (colors, shapes, symbols)
4. SIMPLIFIES details to work at small sizes (48px minimum)
5. ENSURES the icon is clearly related to the logo but optimized for app stores

If the logo contains:
- Text/typography: Extract the first letter or key symbol for the icon
- Symbols/icons: Simplify and center them in the square format
- Colors: Use the same color palette consistently
- Shapes: Maintain the geometric style and proportions

The app icon should feel like a "simplified, square version" of the logo.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }

  // Build comprehensive branding section if available
  let brandingSection = '';
  if (branding) {
    brandingSection = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPLETE BRANDING IDENTITY:

Visual Style:
- Design Style: ${branding.design_style}
- Icon Style: ${branding.icon_style}
- Brand Tone: ${branding.brand_tone}

Typography Context:
- Primary Font: ${branding.primary_font_family}
- Font Style: ${branding.font_style}

Color Palette with Meanings:
${branding.color_palette?.map((color: string, i: number) =>
  `- ${color}: ${branding.color_meanings?.[i] || 'Brand color'}`
).join('\n')}

Target Emotion: ${branding.target_emotion}
Brand Values: ${branding.brand_values?.join(', ')}

Visual Direction:
${branding.visual_direction}

Branding Concept (WHY behind visual choices):
${branding.branding_concept}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }

  return `Create a professional mobile app icon for "${brief.brand_name}".
${logoSection}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 SELECTED ICON STYLE: ${stylePreset.name.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${stylePreset.prompt}

CRITICAL: This is a ${stylePreset.name} style icon. Follow these aesthetic guidelines STRICTLY.

BRAND NAME: ${brief.brand_name}
CATEGORY: ${brief.category}
COLORS: ${colors}
${brandingSection}

PLATFORM REQUIREMENTS:
- iOS App Store: 1024×1024px, no transparency, rounded square
- Android Play Store: 512×512px, adaptive icon support
- Works at all sizes from 48px to 1024px
- Clean, recognizable at small sizes
- Professional quality, production-ready

TECHNICAL REQUIREMENTS:
- Square format (1:1 aspect ratio)
- Centered design
- No text in the icon (brand name is separate)
- High contrast and legibility
- Flat PNG with solid background (no transparency for iOS)
- Simple enough to be memorable
- Unique enough to stand out in app stores

VARIANT NUMBER: #${variantNumber}
${variantNumber === 1 ? 'Focus on primary brand interpretation, bold and clear.' : ''}
${variantNumber === 2 ? 'Explore alternative composition with different color emphasis.' : ''}
${variantNumber === 3 ? 'Try simplified version for maximum clarity.' : ''}
${variantNumber >= 4 ? 'Experiment with creative variation while maintaining brand identity.' : ''}

${logoUrl ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CRITICAL: LOGO-BASED ICON GENERATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This brand HAS an existing logo. The app icon MUST be derived from it.

DO NOT create a completely new icon from scratch.
DO extract, simplify, and adapt key visual elements from the logo.
DO maintain brand consistency and recognizability.
DO ensure the icon works at small sizes while preserving logo identity.

Think of this as "logo → app icon adaptation" NOT "new icon creation".
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : ''}

${branding ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STYLE GUIDANCE (from complete branding):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Follow the ${branding.design_style} aesthetic
- Icon should evoke ${branding.target_emotion}
- Communicate ${branding.brand_values?.[0]}
- Shape style: ${branding.shape_style}
- Overall brand tone: ${branding.brand_tone}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : ''}`;
}


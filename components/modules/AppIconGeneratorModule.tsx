'use client';

import React, { useState } from 'react';
import { useSpaceStore } from '@/lib/store';
import type { Module, AppIconGeneratorOutputs, IconBrief, AppIconVariant, AppIconOptionsPackage, IconSizeSet, FlowContext, AppIconVariantOutputs } from '@/types';
import { CheckCircleIcon, DevicePhoneMobileIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface AppIconGeneratorModuleProps {
  module: Module;
}

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
  const { updateModule, getCurrentSpace, addLog, addModule, addConnection } = useSpaceStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numVariants, setNumVariants] = useState<number>(3);
  const [backgroundType, setBackgroundType] = useState<string>('solid');

  const outputs = module.outputs as AppIconGeneratorOutputs;
  const space = getCurrentSpace();

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

      // Build icon brief from available data
      const iconBrief: IconBrief = buildIconBrief(
        logoUrl,
        brandingData,
        flowContext,
        numVariants,
        backgroundType
      );

      addLog('info', `Generating ${iconBrief.icon_variants} app icon variants for "${iconBrief.brand_name}"...`, module.id);

      // Simulate icon generation (replace with actual AI call)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock icons with all required sizes
      const mockIcons: AppIconVariant[] = await generateIconVariants(
        iconBrief,
        logoUrl,
        flowContext
      );

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
                 `Background: ${backgroundType}\n` +
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

      {/* Settings */}
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

            <label className="flex items-center justify-between">
              <span className="text-xs text-gray-300 font-medium">Background type:</span>
              <select
                value={backgroundType}
                onChange={(e) => setBackgroundType(e.target.value)}
                className="ml-3 px-3 py-1.5 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="solid">Solid color</option>
                <option value="gradient">Gradient</option>
                <option value="flat">Flat (iOS style)</option>
              </select>
            </label>
          </div>
        )}
      </div>

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
  backgroundType: string
): IconBrief {
  const brandName = brandingData?.chosenName?.final_name ||
                    flowContext.appName ||
                    'MyApp';

  const branding = brandingData?.namingPackage?.branding;

  return {
    brand_name: brandName,
    style: branding?.design_style || flowContext.designStyle || 'modern flat',
    color_palette: branding?.color_palette || flowContext.brandColors || ['#007AFF', '#34C759'],
    background_preference: backgroundType,
    shape: 'rounded-square',
    icon_variants: numVariants,
    include_symbol: !!logoUrl,
    source_logo_url: logoUrl,
    category: flowContext.category || 'App',
  };
}

/**
 * Generate icon variants with all required sizes
 */
async function generateIconVariants(
  brief: IconBrief,
  logoUrl: string | undefined,
  flowContext: FlowContext
): Promise<AppIconVariant[]> {
  const variants: AppIconVariant[] = [];

  for (let i = 0; i < brief.icon_variants; i++) {
    const variantId = i + 1;

    // Generate colors for this variant
    const primaryColor = brief.color_palette[i % brief.color_palette.length] || '#007AFF';
    const bgColor = primaryColor.replace('#', '');

    // Create all required sizes
    const sizes: IconSizeSet = {
      ios_1024: `https://placehold.co/1024x1024/${bgColor}/FFFFFF/png?text=${encodeURIComponent(brief.brand_name)}`,
      android_512: `https://placehold.co/512x512/${bgColor}/FFFFFF/png?text=${encodeURIComponent(brief.brand_name)}`,
      android_xxxhdpi: `https://placehold.co/192x192/${bgColor}/FFFFFF/png?text=${brief.brand_name[0]}`,
      android_xxhdpi: `https://placehold.co/144x144/${bgColor}/FFFFFF/png?text=${brief.brand_name[0]}`,
      android_xhdpi: `https://placehold.co/96x96/${bgColor}/FFFFFF/png?text=${brief.brand_name[0]}`,
      android_hdpi: `https://placehold.co/72x72/${bgColor}/FFFFFF/png?text=${brief.brand_name[0]}`,
      android_mdpi: `https://placehold.co/48x48/${bgColor}/FFFFFF/png?text=${brief.brand_name[0]}`,
      favicon_32: `https://placehold.co/32x32/${bgColor}/FFFFFF/png?text=${brief.brand_name[0]}`,
    };

    variants.push({
      id: variantId,
      preview_image: sizes.android_512,
      sizes,
      style_summary: `${brief.style} - ${brief.background_preference} background - variant ${variantId}`,
      background_type: brief.background_preference || 'solid',
      prompt_used: buildIconPrompt(brief, variantId, flowContext),
    });
  }

  return variants;
}

/**
 * Build icon generation prompt
 */
function buildIconPrompt(brief: IconBrief, variantNumber: number, flowContext: FlowContext): string {
  return `Create an official app icon for "${brief.brand_name}".

REQUIREMENTS:
- Style: ${brief.style}
- Background: ${brief.background_preference}
- Colors: ${brief.color_palette.join(', ')}
- Platform: iOS & Android compatible
- Shape: Rounded square (iOS) / Adaptive (Android)

SPECIFICATIONS:
- iOS App Store: 1024×1024px, no transparency, flat PNG
- Android Play Store: 512×512px
- Clean, recognizable design
- Works at small sizes (48px+)
- Professional quality

VARIANT #${variantNumber}:
${variantNumber === 1 ? 'Primary brand interpretation, bold and clear' : ''}
${variantNumber === 2 ? 'Alternative composition, different color emphasis' : ''}
${variantNumber === 3 ? 'Simplified version, maximum clarity' : ''}
${variantNumber >= 4 ? 'Creative variation while maintaining brand identity' : ''}

${brief.source_logo_url ? `Base logo available: ${brief.source_logo_url}` : 'Create icon from brand name and style'}`;
}

'use client';

import React, { useState } from 'react';
import { useSpaceStore } from '@/lib/store';
import type { Module, LogoGeneratorOutputs, LogoBrief, LogoOption, LogoOptionsPackage, ChosenLogo, FlowContext, LogoVariantOutputs } from '@/types';
import { CheckCircleIcon, PhotoIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface LogoGeneratorModuleProps {
  module: Module;
}

export default function LogoGeneratorModule({ module }: LogoGeneratorModuleProps) {
  const { updateModule, getCurrentSpace, addLog, addModule, addConnection } = useSpaceStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numVariants, setNumVariants] = useState<number>(3);

  const outputs = module.outputs as LogoGeneratorOutputs;
  const space = getCurrentSpace();

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

      // Build logo brief
      const logoBrief: LogoBrief = {
        brand_name: chosenName.final_name,
        final_name: chosenName.final_name,
        tagline: namingPackage?.slogan,
        category: appIntelligence?.category || 'General',
        color_palette: appIntelligence?.brandColorsSuggested || ['#1A3B5D', '#FFC700'],
        style: namingPackage?.style || appIntelligence?.designStyle || 'modern minimalistic',
        brand_keywords: namingPackage?.naming_keywords || appIntelligence?.keywords || [],
        num_variants: numVariants, // Use selected number of variants
      };

      // TODO: Call AI provider for logo generation
      // For now, create mock logos
      addLog('info', `Generating ${logoBrief.num_variants} logo variants for "${logoBrief.brand_name}"...`, module.id);

      // Simulate AI generation (replace with actual AI call)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate logo color from brand palette
      const primaryColor = logoBrief.color_palette[0]?.replace('#', '') || '3B82F6';
      const secondaryColor = logoBrief.color_palette[1]?.replace('#', '') || '10B981';

      const mockLogos: LogoOption[] = Array.from({ length: logoBrief.num_variants || 3 }, (_, i) => {
        // Alternate colors for variety
        const bgColor = i % 2 === 0 ? primaryColor : secondaryColor;
        const textColor = i % 2 === 0 ? secondaryColor : primaryColor;

        return {
          id: i + 1,
          image_url: `https://placehold.co/512x512/${bgColor}/${textColor}/png?text=${encodeURIComponent(logoBrief.brand_name)}`,
          style_summary: `${logoBrief.style} logo variant ${i + 1}`,
          colors_used: logoBrief.color_palette,
          strengths: `Creative interpretation of ${logoBrief.brand_name}`,
          weaknesses: 'Placeholder image - needs AI generation',
          ai_prompt_used: buildLogoPrompt(logoBrief, i + 1, flowContext.language || 'en'),
        };
      });

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

        {/* Variants selector - only show when module is idle/ready */}
        {(!module.status || module.status === 'idle' || module.status === 'invalid') && (
          <div className="mt-3 pt-3 border-t border-[#3A3A3A]/50">
            <label className="flex items-center justify-between">
              <span className="text-xs text-gray-300 font-medium">Number of variants:</span>
              <select
                value={numVariants}
                onChange={(e) => setNumVariants(Number(e.target.value))}
                className="ml-3 px-3 py-1.5 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg text-xs text-white focus:outline-none focus:border-pink-500 transition-colors"
              >
                <option value={1}>1 variant</option>
                <option value={2}>2 variants</option>
                <option value={3}>3 variants</option>
                <option value={4}>4 variants</option>
                <option value={5}>5 variants</option>
              </select>
            </label>
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
 * Build logo generation prompt
 */
function buildLogoPrompt(brief: LogoBrief, variantNumber: number, language: string = 'en'): string {
  const colors = brief.color_palette.join(', ');
  const keywords = brief.brand_keywords.join(', ');

  return `Create a professional logo for the brand "${brief.brand_name}".

Style: ${brief.style}
Category: ${brief.category}
Colors: ${colors}
Keywords: ${keywords}
${brief.tagline ? `Tagline: "${brief.tagline}"` : ''}
${brief.shape_preferences ? `Shape preferences: ${brief.shape_preferences}` : ''}
${brief.avoid_elements ? `Avoid: ${brief.avoid_elements.join(', ')}` : ''}

This is variant #${variantNumber}. Make it unique while maintaining brand consistency.

Requirements:
- Clean, vector-style design
- High contrast and legibility
- Works in both color and monochrome
- Scalable to different sizes
- Modern and professional`;
}

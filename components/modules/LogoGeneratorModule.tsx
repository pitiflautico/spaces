'use client';

import React, { useState } from 'react';
import { useSpaceStore } from '@/lib/store';
import type { Module, LogoGeneratorOutputs, LogoBrief, LogoOption, LogoOptionsPackage, ChosenLogo, FlowContext } from '@/types';
import { CheckCircleIcon, PhotoIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface LogoGeneratorModuleProps {
  module: Module;
}

export default function LogoGeneratorModule({ module }: LogoGeneratorModuleProps) {
  const { updateModule, getCurrentSpace, addLog } = useSpaceStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLogoId, setSelectedLogoId] = useState<number | null>(null);
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

      const logoOptions: LogoOptionsPackage = {
        brand_name: logoBrief.brand_name,
        num_variants: mockLogos.length,
        options: mockLogos,
      };

      // Create outputs (without chosen logo yet)
      const newOutputs: LogoGeneratorOutputs = {
        logoOptions,
        logoLog: `Logo generation completed\n` +
                 `Brand: ${logoBrief.brand_name}\n` +
                 `Variants: ${mockLogos.length}\n` +
                 `Language: ${flowContext.language}\n` +
                 `Timestamp: ${new Date().toISOString()}`,
        flowContext, // Propagate to downstream modules
      };

      // Update module - status is 'warning' to indicate pending selection
      updateModule(module.id, {
        status: 'warning', // Yellow state = pending selection
        outputs: newOutputs
      });

      addLog('success', `Logo variants generated. Please select a final logo.`, module.id);

    } catch (err: any) {
      const errorMsg = err.message || 'Unknown error occurred';
      setError(errorMsg);
      updateModule(module.id, { status: 'error', errorMessage: errorMsg });
      addLog('error', errorMsg, module.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogoSelection = (logoId: number) => {
    setSelectedLogoId(logoId);
  };

  const handleSetFinalLogo = () => {
    if (!selectedLogoId || !outputs?.logoOptions) return;

    const selectedOption = outputs.logoOptions.options.find(opt => opt.id === selectedLogoId);
    if (!selectedOption) return;

    // Create chosen logo object
    const chosenLogo: ChosenLogo = {
      brand_name: outputs.logoOptions.brand_name,
      final_logo_option_id: selectedLogoId,
      final_logo_url: selectedOption.image_url,
      chosen_at: new Date().toISOString(),
      source_module: 'LogoGenerator4A',
    };

    // Update outputs with chosen logo
    const updatedOutputs: LogoGeneratorOutputs = {
      ...outputs,
      chosenLogo,
    };

    // Update module to 'done' state
    updateModule(module.id, {
      status: 'done',
      outputs: updatedOutputs
    });

    addLog('success', `Final logo selected: Option #${selectedLogoId}`, module.id);
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
    if (module.status === 'done' && outputs?.chosenLogo) {
      return '🟢'; // Green - final logo selected
    } else if (module.status === 'warning' && outputs?.logoOptions) {
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
            {module.status === 'warning' && outputs?.logoOptions ? `Pending Logo Selection (${outputs.logoOptions.num_variants} options)` :
             module.status === 'done' && outputs?.chosenLogo ? `Selected: Option #${outputs.chosenLogo.final_logo_option_id}` :
             module.status === 'invalid' ? 'Outdated - Re-run Required' :
             'Ready to Generate Logos'}
          </span>
        </div>
        <PhotoIcon className="w-5 h-5 text-pink-400" />
      </div>

      {/* Info */}
      <div className="px-3 py-2 bg-[#0A0A0A]/50 border border-[#3A3A3A]/50 rounded-lg">
        <p className="text-xs text-gray-400 mb-3">
          Generate logo variants using AI. Connect from Naming Engine to get started.
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

      {/* Pending Selection Warning */}
      {module.status === 'warning' && outputs?.logoOptions && !outputs?.chosenLogo && (
        <div className="px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-yellow-300 font-medium">⚠ Please choose a final logo to continue.</span>
          </div>
        </div>
      )}

      {/* Logo Options Display */}
      {outputs?.logoOptions && (
        <div className="space-y-4 pt-4 border-t-2 border-pink-500/30 bg-pink-500/5 -mx-3 px-3 py-4 rounded-b-xl">
          {/* Header */}
          <div className="text-sm text-pink-400 uppercase tracking-wider font-bold flex items-center gap-2">
            <PhotoIcon className="w-5 h-5 text-pink-400" />
            {outputs.chosenLogo ? '✓ Logo Selected' : `📝 ${outputs.logoOptions.num_variants} Logo Options`}
          </div>

          {/* Final Logo Display (when chosen) */}
          {outputs.chosenLogo && (
            <div className="px-4 py-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                <span className="text-sm text-green-400 font-semibold">Final Logo Selected</span>
              </div>
              <div className="flex gap-4">
                <img
                  src={outputs.chosenLogo.final_logo_url}
                  alt={`Logo ${outputs.chosenLogo.final_logo_option_id}`}
                  className="w-32 h-32 rounded-lg border-2 border-green-500/50"
                />
                <div className="flex-1">
                  <p className="text-lg text-white font-bold">Option #{outputs.chosenLogo.final_logo_option_id}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Selected: {new Date(outputs.chosenLogo.chosen_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Logo Selection UI - Only show if no logo chosen yet */}
          {!outputs.chosenLogo && (
            <div className="space-y-3">
              {outputs.logoOptions.options.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-center gap-3 p-3 bg-[#1A1A1A] border rounded-lg cursor-pointer hover:border-pink-500/50 transition-colors ${
                    selectedLogoId === option.id ? 'border-pink-500 bg-pink-500/10' : 'border-[#3A3A3A]'
                  }`}
                >
                  <input
                    type="radio"
                    name="finalLogo"
                    value={option.id}
                    checked={selectedLogoId === option.id}
                    onChange={() => handleLogoSelection(option.id)}
                    className="w-4 h-4 text-pink-500"
                  />
                  <img
                    src={option.image_url}
                    alt={`Logo option ${option.id}`}
                    className="w-16 h-16 rounded border border-[#3A3A3A]"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">Option #{option.id}</p>
                    <p className="text-xs text-gray-400">{option.style_summary}</p>
                  </div>
                </label>
              ))}

              {/* Set Final Logo Button */}
              <button
                onClick={handleSetFinalLogo}
                disabled={!selectedLogoId}
                className={`w-full mt-4 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  selectedLogoId
                    ? 'bg-pink-500 hover:bg-pink-600 text-white'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                🔵 Set as Final Logo
              </button>
            </div>
          )}
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

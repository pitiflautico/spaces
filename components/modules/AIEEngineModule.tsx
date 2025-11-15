'use client';

import React, { useState } from 'react';
import { useSpaceStore } from '@/lib/store';
import type { Module, AIEEngineOutputs, AppIntelligence, AIConfiguration } from '@/types';
import { AIProvider } from '@/types';
import { CheckCircleIcon, SparklesIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import aiProvider from '@/lib/ai-provider';
import '@/lib/adapters'; // Initialize adapters

interface AIEEngineModuleProps {
  module: Module;
}

export default function AIEEngineModule({ module }: AIEEngineModuleProps) {
  const { updateModule, getCurrentSpace } = useSpaceStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const outputs = module.outputs as AIEEngineOutputs;
  const space = getCurrentSpace();

  const handleRun = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      updateModule(module.id, { status: 'running' });

      // Get AI configuration
      const aiConfig = space?.configuration?.aiConfig;
      if (!aiConfig || !aiConfig.provider) {
        throw new Error('AI Provider not configured. Please configure in Settings.');
      }

      // Get inputs from connected modules
      const repositoryMetadata = module.inputs.repositoryMetadata;
      const fileContents = module.inputs.fileContents;
      const repoStructure = module.inputs.repoStructure;

      if (!repositoryMetadata || !fileContents || !repoStructure) {
        throw new Error('Missing required inputs. Connect outputs from Local Project Analysis module.');
      }

      // Build prompt for AI
      const prompt = buildPrompt(repositoryMetadata, fileContents, repoStructure);

      // Get API key from space configuration
      const apiKey = getAPIKeyForProvider(aiConfig.provider, space.configuration?.apiKeys || {});

      const config: AIConfiguration = {
        ...aiConfig,
        apiKey
      };

      // Call AI provider
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

      // Create outputs
      const newOutputs: AIEEngineOutputs = {
        appIntelligence,
        aieLog: `Analysis completed using ${response.providerUsed} (${response.model})\n` +
                `Tokens used: ${response.tokensUsed || 'N/A'}\n` +
                `Timestamp: ${new Date().toISOString()}`
      };

      // Update module
      updateModule(module.id, {
        status: 'done',
        outputs: newOutputs
      });

    } catch (err: any) {
      setError(err.message || 'Unknown error occurred');
      updateModule(module.id, { status: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="px-3 py-2 bg-[#0A0A0A]/50 border border-[#3A3A3A]/50 rounded-lg">
        <p className="text-xs text-gray-400">
          This module uses AI to analyze your project and extract app intelligence.
          Connect outputs from Local Project Analysis to get started.
        </p>
      </div>

      {/* AI Provider Status */}
      <div className="px-3 py-2 bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg">
        <div className="flex items-center gap-2 text-xs">
          <SparklesIcon className="w-4 h-4 text-orange-400" />
          <span className="text-gray-400">AI Provider:</span>
          <span className="text-white font-medium">
            {space?.configuration?.aiConfig?.provider || 'Not configured'}
          </span>
        </div>
        {space?.configuration?.aiConfig?.model && (
          <div className="text-xs text-gray-500 mt-1 ml-6">
            Model: {space.configuration.aiConfig.model}
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

      {/* Outputs Section */}
      {module.status === 'done' && outputs?.appIntelligence && (
        <div className="space-y-3 pt-3 border-t border-[#2A2A2A]">
          <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-green-400" />
            App Intelligence Extracted
          </div>

          <div className="px-3 py-2 bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg space-y-2">
            <div>
              <span className="text-xs text-gray-500">Summary:</span>
              <p className="text-xs text-gray-300 mt-1">{outputs.appIntelligence.summary}</p>
            </div>

            <div>
              <span className="text-xs text-gray-500">Category:</span>
              <p className="text-xs text-white font-medium">{outputs.appIntelligence.category}</p>
            </div>

            <div>
              <span className="text-xs text-gray-500">Target Audience:</span>
              <p className="text-xs text-gray-300">{outputs.appIntelligence.targetAudience}</p>
            </div>

            <div>
              <span className="text-xs text-gray-500">Keywords:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {outputs.appIntelligence.keywords.slice(0, 6).map((keyword, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs text-gray-500">Brand Colors:</span>
              <div className="flex gap-2 mt-1">
                {outputs.appIntelligence.brandColorsSuggested.map((color, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded border border-[#3A3A3A]"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
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
 * Build prompt for AI from project data
 */
function buildPrompt(repositoryMetadata: any, fileContents: any, repoStructure: any): string {
  return `You are an expert app intelligence analyzer. Analyze the following project information and extract comprehensive app intelligence.

PROJECT METADATA:
${JSON.stringify(repositoryMetadata, null, 2)}

FILE CONTENTS:
${JSON.stringify(fileContents, null, 2)}

REPOSITORY STRUCTURE:
${JSON.stringify(repoStructure, null, 2)}

Based on this information, provide a comprehensive app intelligence analysis in the following JSON format:

{
  "summary": "A concise 1-2 sentence summary of the app",
  "category": "Main category (e.g., Developer Tools, E-commerce, Social Media)",
  "subcategories": ["Array of subcategories"],
  "features": ["Array of key features"],
  "targetAudience": "Description of target audience",
  "tone": "Description of tone and voice",
  "designStyle": "Description of design style",
  "keywords": ["Array of relevant keywords"],
  "problemsSolved": ["Array of problems this app solves"],
  "competitiveAngle": "What makes this app unique",
  "brandColorsSuggested": ["Array of hex colors like #3B82F6"],
  "iconStyleRecommendation": "Recommendation for icon style"
}

Respond ONLY with the JSON object, no additional text.`;
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

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
      if (!sourceModule || !sourceModule.outputs.projectAnalysis) {
        throw new Error('Source module has no output data. Run Local Project Analysis first.');
      }

      // Get the data from source module output
      const projectData = sourceModule.outputs.projectAnalysis;

      // Extract data from combined input
      const { repositoryMetadata, fileContents, repoStructure } = projectData;

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

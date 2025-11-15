/**
 * AI Models Configuration
 * Shared constants for AI provider models used across modules
 */

import { AIProvider } from '@/types';

export interface AIModelConfig {
  id: string;
  name: string;
  description: string;
}

export const AI_MODELS: Record<AIProvider, AIModelConfig[]> = {
  [AIProvider.REPLICATE]: [
    { id: 'meta/meta-llama-3-70b-instruct', name: 'Meta Llama 3 70B', description: 'Fast and powerful' },
    { id: 'meta/meta-llama-3.1-405b-instruct', name: 'Meta Llama 3.1 405B', description: 'Most powerful' },
  ],
  [AIProvider.TOGETHER]: [
    { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B Turbo', description: 'Recommended' },
    { id: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', name: 'Llama 3.1 405B Turbo', description: 'Most powerful' },
    { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B', description: 'Fast and efficient' },
  ],
  [AIProvider.OPENAI]: [
    { id: 'gpt-4', name: 'GPT-4', description: 'Most capable' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Faster GPT-4' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and affordable' },
  ],
  [AIProvider.ANTHROPIC]: [
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Most powerful' },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Balanced' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fastest' },
  ],
  [AIProvider.LOCAL]: [
    { id: 'mock-gpt-4', name: 'Mock GPT-4', description: 'Local testing' },
  ],
};

/**
 * Get the default model for a given AI provider
 */
export function getDefaultModelForProvider(provider: AIProvider): string {
  const models = AI_MODELS[provider];
  return models && models.length > 0 ? models[0].id : '';
}

/**
 * Get model configuration by ID
 */
export function getModelConfig(provider: AIProvider, modelId: string): AIModelConfig | undefined {
  return AI_MODELS[provider]?.find(m => m.id === modelId);
}

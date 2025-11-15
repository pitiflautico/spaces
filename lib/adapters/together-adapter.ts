/**
 * Together AI Adapter (V2.0)
 * https://together.ai/
 */

import type { AIAdapter } from '../ai-provider';
import type { AIConfiguration, AIProviderResponse } from '@/types';
import { AIProvider } from '@/types';

export class TogetherAdapter implements AIAdapter {
  async run(prompt: string, config: AIConfiguration): Promise<AIProviderResponse> {
    const response = await fetch('https://api.together.xyz/v1/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'together_ai/llama-3-70b',
        prompt: prompt,
        max_tokens: config.maxTokens || 4096,
        temperature: config.temperature || 0.7,
        stream: config.mode === 'streaming'
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();

    return {
      outputText: data.choices?.[0]?.text || data.output || '',
      rawResponse: data,
      tokensUsed: data.usage?.total_tokens,
      providerUsed: AIProvider.TOGETHER,
      model: config.model
    };
  }

  async testConnection(config: AIConfiguration): Promise<boolean> {
    try {
      const response = await fetch('https://api.together.xyz/v1/models', {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

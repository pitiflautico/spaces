/**
 * Replicate Adapter (V2.0)
 * https://replicate.com/
 */

import type { AIAdapter } from '../ai-provider';
import type { AIConfiguration, AIProviderResponse } from '@/types';
import { AIProvider } from '@/types';

export class ReplicateAdapter implements AIAdapter {
  async run(prompt: string, config: AIConfiguration): Promise<AIProviderResponse> {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${config.apiKey}`
      },
      body: JSON.stringify({
        version: config.model,
        input: {
          prompt: prompt,
          max_tokens: config.maxTokens || 4096,
          temperature: config.temperature || 0.7
        }
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    const prediction = await response.json();

    // Poll for completion (Replicate is async)
    let result = prediction;
    while (result.status === 'starting' || result.status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const checkResponse = await fetch(result.urls.get, {
        headers: {
          'Authorization': `Token ${config.apiKey}`
        }
      });
      result = await checkResponse.json();
    }

    if (result.status === 'failed') {
      throw new Error(result.error || 'Prediction failed');
    }

    return {
      outputText: Array.isArray(result.output) ? result.output.join('') : result.output,
      rawResponse: result,
      tokensUsed: undefined,
      providerUsed: AIProvider.REPLICATE,
      model: config.model
    };
  }

  async testConnection(config: AIConfiguration): Promise<boolean> {
    try {
      const response = await fetch('https://api.replicate.com/v1/models', {
        headers: {
          'Authorization': `Token ${config.apiKey}`
        }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

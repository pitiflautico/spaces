/**
 * OpenAI Adapter (V2.0)
 * https://platform.openai.com/
 *
 * Uses Next.js API route as proxy to avoid CORS issues
 */

import type { AIAdapter } from '../ai-provider';
import type { AIConfiguration, AIProviderResponse } from '@/types';
import { AIProvider } from '@/types';

export class OpenAIAdapter implements AIAdapter {
  async run(prompt: string, config: AIConfiguration): Promise<AIProviderResponse> {
    // Call Next.js API route instead of calling OpenAI directly
    const response = await fetch('/api/ai-inference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'openai',
        model: config.model,
        prompt: prompt,
        apiKey: config.apiKey,
        temperature: config.temperature || 0.7,
        maxTokens: config.maxTokens || 4096
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();

    return {
      outputText: data.outputText,
      rawResponse: data.rawResponse,
      tokensUsed: data.tokensUsed,
      providerUsed: AIProvider.OPENAI,
      model: config.model
    };
  }

  async testConnection(config: AIConfiguration): Promise<boolean> {
    try {
      // Simple test - try to call with a minimal prompt
      const response = await fetch('/api/ai-inference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: 'openai',
          model: config.model,
          prompt: 'Test',
          apiKey: config.apiKey,
          temperature: 0.7,
          maxTokens: 10
        })
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

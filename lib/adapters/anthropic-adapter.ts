/**
 * Anthropic Adapter (V2.0)
 * https://www.anthropic.com/
 */

import type { AIAdapter } from '../ai-provider';
import type { AIConfiguration, AIProviderResponse } from '@/types';
import { AIProvider } from '@/types';

export class AnthropicAdapter implements AIAdapter {
  async run(prompt: string, config: AIConfiguration): Promise<AIProviderResponse> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.model || 'claude-3-opus-20240229',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: config.maxTokens || 4096,
        temperature: config.temperature || 0.7,
        stream: config.mode === 'streaming'
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();

    return {
      outputText: data.content?.[0]?.text || '',
      rawResponse: data,
      tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens,
      providerUsed: AIProvider.ANTHROPIC,
      model: config.model
    };
  }

  async testConnection(config: AIConfiguration): Promise<boolean> {
    try {
      // Anthropic doesn't have a simple /models endpoint, so we make a minimal request
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey || '',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10
        })
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

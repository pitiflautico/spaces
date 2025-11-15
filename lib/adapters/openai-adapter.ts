/**
 * OpenAI Adapter (V2.0)
 * https://platform.openai.com/
 */

import type { AIAdapter } from '../ai-provider';
import type { AIConfiguration, AIProviderResponse } from '@/types';
import { AIProvider } from '@/types';

export class OpenAIAdapter implements AIAdapter {
  async run(prompt: string, config: AIConfiguration): Promise<AIProviderResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4',
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
      outputText: data.choices?.[0]?.message?.content || '',
      rawResponse: data,
      tokensUsed: data.usage?.total_tokens,
      providerUsed: AIProvider.OPENAI,
      model: config.model
    };
  }

  async testConnection(config: AIConfiguration): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
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

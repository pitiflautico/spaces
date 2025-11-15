/**
 * AI Provider Layer (V2.0)
 *
 * Unified interface for all AI providers (Replicate, Together, OpenAI, Anthropic, Local)
 * All modules call aiProvider.run() which handles provider selection and response normalization
 */

import type { AIConfiguration, AIProviderResponse } from '@/types';
import { AIProvider } from '@/types';

// Adapter interfaces
export interface AIAdapter {
  run(prompt: string, config: AIConfiguration): Promise<AIProviderResponse>;
  testConnection(config: AIConfiguration): Promise<boolean>;
}

// AI Error codes
export enum AIErrorCode {
  PROVIDER_NOT_CONFIGURED = 'IA_ERROR_01',
  INVALID_API_KEY = 'IA_ERROR_02',
  UNREACHABLE_PROVIDER = 'IA_ERROR_03',
  MODEL_NOT_AVAILABLE = 'IA_ERROR_04',
  INVALID_RESPONSE = 'IA_ERROR_05',
  TIMEOUT = 'IA_ERROR_06',
  TOKEN_OVERFLOW = 'IA_ERROR_07'
}

export class AIProviderError extends Error {
  code: AIErrorCode;

  constructor(code: AIErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'AIProviderError';
  }
}

/**
 * Main AI Provider class
 */
class AIProviderManager {
  private adapters: Map<AIProvider, AIAdapter> = new Map();

  /**
   * Register an adapter for a specific provider
   */
  registerAdapter(provider: AIProvider, adapter: AIAdapter) {
    this.adapters.set(provider, adapter);
  }

  /**
   * Run AI inference with the configured provider
   */
  async run(prompt: string, config: AIConfiguration): Promise<AIProviderResponse> {
    // Validate configuration
    if (!config || !config.provider) {
      throw new AIProviderError(
        AIErrorCode.PROVIDER_NOT_CONFIGURED,
        'AI Provider not configured. Please configure in Settings > AI Provider.'
      );
    }

    // Get adapter
    const adapter = this.adapters.get(config.provider);
    if (!adapter) {
      throw new AIProviderError(
        AIErrorCode.PROVIDER_NOT_CONFIGURED,
        `No adapter found for provider: ${config.provider}`
      );
    }

    // Validate API key (except for local)
    if (config.provider !== AIProvider.LOCAL && !config.apiKey) {
      throw new AIProviderError(
        AIErrorCode.INVALID_API_KEY,
        'API Key is required for this provider.'
      );
    }

    try {
      // Call adapter
      const response = await adapter.run(prompt, config);

      // Validate response
      if (!response.outputText) {
        throw new AIProviderError(
          AIErrorCode.INVALID_RESPONSE,
          'Provider returned empty response.'
        );
      }

      return response;
    } catch (error: any) {
      if (error instanceof AIProviderError) {
        throw error;
      }

      // Handle network/timeout errors
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        throw new AIProviderError(
          AIErrorCode.TIMEOUT,
          'Request timeout. Please try again.'
        );
      }

      // Handle API errors
      if (error.status === 401 || error.status === 403) {
        throw new AIProviderError(
          AIErrorCode.INVALID_API_KEY,
          'Invalid API Key. Please check your configuration.'
        );
      }

      if (error.status === 404) {
        throw new AIProviderError(
          AIErrorCode.MODEL_NOT_AVAILABLE,
          `Model "${config.model}" not available.`
        );
      }

      // Generic unreachable error
      throw new AIProviderError(
        AIErrorCode.UNREACHABLE_PROVIDER,
        `Failed to connect to ${config.provider}: ${error.message}`
      );
    }
  }

  /**
   * Test connection to a provider
   */
  async testConnection(config: AIConfiguration): Promise<boolean> {
    const adapter = this.adapters.get(config.provider);
    if (!adapter) {
      return false;
    }

    try {
      return await adapter.testConnection(config);
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
export const aiProvider = new AIProviderManager();

// Export for module usage
export default aiProvider;

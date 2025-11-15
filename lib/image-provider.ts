/**
 * Image Provider Layer
 *
 * Unified interface for AI image generation (Replicate, Together AI, etc.)
 */

import type { AIProvider } from '@/types';

export interface ImageGenerationConfig {
  provider: AIProvider;
  model: string;
  apiKey?: string;
  prompt: string;
  num_outputs?: number; // Number of images to generate
  width?: number;
  height?: number;
  aspect_ratio?: string; // e.g., "1:1", "16:9"
  seed?: number;
}

export interface ImageGenerationResponse {
  images: string[]; // Array of image URLs or base64
  providerUsed: string;
  model: string;
  count: number;
}

// Adapter interfaces
export interface ImageAdapter {
  generate(config: ImageGenerationConfig): Promise<ImageGenerationResponse>;
}

// AI Error codes
export enum ImageErrorCode {
  PROVIDER_NOT_CONFIGURED = 'IMG_ERROR_01',
  INVALID_API_KEY = 'IMG_ERROR_02',
  UNREACHABLE_PROVIDER = 'IMG_ERROR_03',
  MODEL_NOT_AVAILABLE = 'IMG_ERROR_04',
  GENERATION_FAILED = 'IMG_ERROR_05',
}

export class ImageProviderError extends Error {
  code: ImageErrorCode;

  constructor(code: ImageErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'ImageProviderError';
  }
}

/**
 * Main Image Provider class
 */
class ImageProviderManager {
  private adapters: Map<AIProvider, ImageAdapter> = new Map();

  /**
   * Register an adapter for a specific provider
   */
  registerAdapter(provider: AIProvider, adapter: ImageAdapter) {
    this.adapters.set(provider, adapter);
  }

  /**
   * Generate images with the configured provider
   */
  async generate(config: ImageGenerationConfig): Promise<ImageGenerationResponse> {
    // Validate configuration
    if (!config || !config.provider) {
      throw new ImageProviderError(
        ImageErrorCode.PROVIDER_NOT_CONFIGURED,
        'Image Provider not configured.'
      );
    }

    // Get adapter
    const adapter = this.adapters.get(config.provider);
    if (!adapter) {
      throw new ImageProviderError(
        ImageErrorCode.PROVIDER_NOT_CONFIGURED,
        `No adapter registered for provider: ${config.provider}`
      );
    }

    // Validate API key (except for LOCAL)
    if (config.provider !== AIProvider.LOCAL && !config.apiKey) {
      throw new ImageProviderError(
        ImageErrorCode.INVALID_API_KEY,
        `API key required for ${config.provider}`
      );
    }

    try {
      return await adapter.generate(config);
    } catch (error: any) {
      if (error instanceof ImageProviderError) {
        throw error;
      }
      throw new ImageProviderError(
        ImageErrorCode.GENERATION_FAILED,
        `Image generation failed: ${error.message}`
      );
    }
  }
}

// Export singleton instance
const imageProvider = new ImageProviderManager();
export default imageProvider;

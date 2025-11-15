/**
 * Together AI Image Adapter
 *
 * Calls our Next.js API route which proxies to Together AI API
 * (avoids CORS issues)
 */

import type { ImageAdapter, ImageGenerationConfig, ImageGenerationResponse } from '../image-provider';
import { ImageProviderError, ImageErrorCode } from '../image-provider';

export class TogetherImageAdapter implements ImageAdapter {
  async generate(config: ImageGenerationConfig): Promise<ImageGenerationResponse> {
    const { model, apiKey, prompt, num_outputs = 1, width = 1024, height = 1024 } = config;

    if (!apiKey) {
      throw new ImageProviderError(ImageErrorCode.INVALID_API_KEY, 'Together AI API key is required');
    }

    try {
      console.log(`🔄 Calling Together AI via API route for model: ${model}`);

      // Call our Next.js API route (avoids CORS)
      const response = await fetch('/api/image-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'together',
          model,
          prompt,
          apiKey,
          num_outputs,
          width,
          height,
        }),
      });

      if (!response.ok) {
        let errorDetail = response.statusText;
        try {
          const error = await response.json();
          errorDetail = error.error || JSON.stringify(error);
        } catch (e) {
          // Could not parse error as JSON
        }
        throw new Error(`API error (${response.status}): ${errorDetail}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Image generation failed');
      }

      return {
        images: result.images,
        providerUsed: result.providerUsed,
        model: result.model,
        count: result.count,
      };
    } catch (error: any) {
      if (error instanceof ImageProviderError) {
        throw error;
      }

      // Check if it's a network error
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new ImageProviderError(
          ImageErrorCode.UNREACHABLE_PROVIDER,
          `Cannot reach image generation API. Check your internet connection. Error: ${error.message}`
        );
      }

      throw new ImageProviderError(
        ImageErrorCode.GENERATION_FAILED,
        `Together AI generation failed: ${error.message}`
      );
    }
  }
}

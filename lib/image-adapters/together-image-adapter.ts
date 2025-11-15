/**
 * Together AI Image Adapter
 *
 * Handles image generation via Together AI API
 */

import type { ImageAdapter, ImageGenerationConfig, ImageGenerationResponse } from '../image-provider';
import { ImageProviderError, ImageErrorCode } from '../image-provider';

export class TogetherImageAdapter implements ImageAdapter {
  async generate(config: ImageGenerationConfig): Promise<ImageGenerationResponse> {
    const { model, apiKey, prompt, num_outputs = 1, width = 1024, height = 1024, seed } = config;

    if (!apiKey) {
      throw new ImageProviderError(ImageErrorCode.INVALID_API_KEY, 'Together AI API key is required');
    }

    try {
      // Together AI uses their image generation endpoint
      const response = await fetch('https://api.together.xyz/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt,
          n: num_outputs, // Together AI uses 'n' for number of images
          width,
          height,
          ...(seed && { seed }),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Together AI error: ${error.error?.message || response.statusText}`);
      }

      const result = await response.json();

      // Extract image URLs from response
      const images: string[] = result.data?.map((item: any) => item.url || item.b64_json) || [];

      return {
        images,
        providerUsed: 'Together AI',
        model,
        count: images.length,
      };
    } catch (error: any) {
      if (error instanceof ImageProviderError) {
        throw error;
      }
      throw new ImageProviderError(
        ImageErrorCode.GENERATION_FAILED,
        `Together AI generation failed: ${error.message}`
      );
    }
  }
}

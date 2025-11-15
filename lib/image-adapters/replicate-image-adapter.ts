/**
 * Replicate Image Adapter
 *
 * Handles image generation via Replicate API
 */

import type { ImageAdapter, ImageGenerationConfig, ImageGenerationResponse } from '../image-provider';
import { ImageProviderError, ImageErrorCode } from '../image-provider';

export class ReplicateImageAdapter implements ImageAdapter {
  async generate(config: ImageGenerationConfig): Promise<ImageGenerationResponse> {
    const { model, apiKey, prompt, num_outputs = 1, width = 1024, height = 1024, aspect_ratio, seed } = config;

    if (!apiKey) {
      throw new ImageProviderError(ImageErrorCode.INVALID_API_KEY, 'Replicate API key is required');
    }

    try {
      // Build input based on model
      const input: Record<string, any> = {
        prompt,
      };

      // Model-specific parameters
      if (model.includes('recraft-ai/recraft-v3')) {
        // Recraft V3 SVG specific parameters
        input.num_images = num_outputs;
        input.size = '1024';
        if (aspect_ratio) {
          input.aspect_ratio = aspect_ratio;
        }
      } else if (model.includes('flux')) {
        // Flux models
        input.num_outputs = num_outputs;
        input.aspect_ratio = aspect_ratio || '1:1';
        if (seed) {
          input.seed = seed;
        }
      } else {
        // Generic parameters
        input.num_outputs = num_outputs;
        input.width = width;
        input.height = height;
      }

      // Call Replicate API
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: model.includes(':') ? model.split(':')[1] : undefined,
          input,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Replicate API error: ${error.detail || response.statusText}`);
      }

      const prediction = await response.json();

      // Poll for completion
      const result = await this.pollPrediction(prediction.id, apiKey);

      // Extract image URLs
      let images: string[] = [];
      if (Array.isArray(result.output)) {
        images = result.output;
      } else if (typeof result.output === 'string') {
        images = [result.output];
      } else if (result.output?.images) {
        images = result.output.images;
      }

      return {
        images,
        providerUsed: 'Replicate',
        model,
        count: images.length,
      };
    } catch (error: any) {
      if (error instanceof ImageProviderError) {
        throw error;
      }
      throw new ImageProviderError(
        ImageErrorCode.GENERATION_FAILED,
        `Replicate generation failed: ${error.message}`
      );
    }
  }

  /**
   * Poll Replicate prediction until completion
   */
  private async pollPrediction(id: string, apiKey: string, maxAttempts = 60): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
        headers: {
          'Authorization': `Token ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to poll prediction: ${response.statusText}`);
      }

      const prediction = await response.json();

      if (prediction.status === 'succeeded') {
        return prediction;
      }

      if (prediction.status === 'failed') {
        throw new Error(`Prediction failed: ${prediction.error}`);
      }

      // Wait 2 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Prediction timed out after 2 minutes');
  }
}

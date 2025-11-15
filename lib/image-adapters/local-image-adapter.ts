/**
 * Local Mock Image Adapter
 *
 * Returns placeholder images for testing without API calls
 */

import type { ImageAdapter, ImageGenerationConfig, ImageGenerationResponse } from '../image-provider';

export class LocalImageAdapter implements ImageAdapter {
  async generate(config: ImageGenerationConfig): Promise<ImageGenerationResponse> {
    const { prompt, num_outputs = 1 } = config;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Extract brand name from prompt for placeholder
    const brandMatch = prompt.match(/logo for (?:the brand )?"([^"]+)"/i);
    const brandName = brandMatch ? brandMatch[1] : 'Brand';

    // Generate mock images using placehold.co with different colors
    const colors = [
      { bg: '3B82F6', text: '1E40AF' }, // Blue
      { bg: '10B981', text: '065F46' }, // Green
      { bg: 'F59E0B', text: '92400E' }, // Amber
      { bg: 'EF4444', text: '991B1B' }, // Red
      { bg: '8B5CF6', text: '5B21B6' }, // Purple
    ];

    const images: string[] = [];
    for (let i = 0; i < num_outputs; i++) {
      const color = colors[i % colors.length];
      const imageUrl = `https://placehold.co/1024x1024/${color.bg}/${color.text}/png?text=${encodeURIComponent(brandName + ' ' + (i + 1))}`;
      images.push(imageUrl);
    }

    return {
      images,
      providerUsed: 'Local Mock',
      model: config.model,
      count: images.length,
    };
  }
}

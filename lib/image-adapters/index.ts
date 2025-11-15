/**
 * Image Adapters - Registration
 *
 * Registers all image generation adapters with the imageProvider
 */

import imageProvider from '../image-provider';
import { AIProvider } from '@/types';
import { ReplicateImageAdapter } from './replicate-image-adapter';
import { TogetherImageAdapter } from './together-image-adapter';
import { LocalImageAdapter } from './local-image-adapter';

// Register adapters
imageProvider.registerAdapter(AIProvider.REPLICATE, new ReplicateImageAdapter());
imageProvider.registerAdapter(AIProvider.TOGETHER, new TogetherImageAdapter());
imageProvider.registerAdapter(AIProvider.LOCAL, new LocalImageAdapter());

// Log initialization
console.log('✅ Image generation adapters initialized: Replicate, Together AI, Local');

export default imageProvider;

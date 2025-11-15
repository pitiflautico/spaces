/**
 * AI Adapters Index (V2.0)
 * Registers all available AI provider adapters
 */

import { aiProvider } from '../ai-provider';
import { AIProvider } from '@/types';
import { TogetherAdapter } from './together-adapter';
import { ReplicateAdapter } from './replicate-adapter';
import { OpenAIAdapter } from './openai-adapter';
import { AnthropicAdapter } from './anthropic-adapter';
import { MockAdapter } from './mock-adapter';

// Register all adapters
export function initializeAdapters() {
  aiProvider.registerAdapter(AIProvider.TOGETHER, new TogetherAdapter());
  aiProvider.registerAdapter(AIProvider.REPLICATE, new ReplicateAdapter());
  aiProvider.registerAdapter(AIProvider.OPENAI, new OpenAIAdapter());
  aiProvider.registerAdapter(AIProvider.ANTHROPIC, new AnthropicAdapter());
  aiProvider.registerAdapter(AIProvider.LOCAL, new MockAdapter()); // Using mock for LOCAL for now
}

// Auto-initialize on import
initializeAdapters();

// Export adapters for potential direct use
export {
  TogetherAdapter,
  ReplicateAdapter,
  OpenAIAdapter,
  AnthropicAdapter,
  MockAdapter
};

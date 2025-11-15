/**
 * Mock AI Adapter (V2.0)
 * For development and testing without real API calls
 */

import type { AIAdapter } from '../ai-provider';
import type { AIConfiguration, AIProviderResponse, AppIntelligence } from '@/types';
import { AIProvider } from '@/types';

export class MockAdapter implements AIAdapter {
  async run(prompt: string, config: AIConfiguration): Promise<AIProviderResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate mock response based on prompt type
    let mockResponse = '';

    // Detect if this is an AIE Engine request (contains repository info)
    if (prompt.includes('repository') || prompt.includes('project') || prompt.includes('analyze')) {
      mockResponse = this.generateMockAppIntelligence();
    } else {
      mockResponse = 'This is a mock AI response for testing purposes. Configure a real AI provider in Settings to get actual AI-powered insights.';
    }

    return {
      outputText: mockResponse,
      rawResponse: {
        mock: true,
        prompt_length: prompt.length,
        timestamp: new Date().toISOString()
      },
      tokensUsed: Math.floor(prompt.length / 4) + Math.floor(mockResponse.length / 4),
      providerUsed: 'mock' as AIProvider,
      model: config.model || 'mock-gpt-4'
    };
  }

  async testConnection(config: AIConfiguration): Promise<boolean> {
    // Mock always succeeds
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  }

  /**
   * Generate mock app intelligence for AIE Engine
   */
  private generateMockAppIntelligence(): string {
    const mockIntelligence: AppIntelligence = {
      summary: "A modern web application built with Next.js and TypeScript, featuring a clean dark-themed interface and modular architecture designed for scalability.",
      category: "Developer Tools",
      subcategories: ["Code Analysis", "Project Management", "Automation"],
      features: [
        "Visual module-based workflow",
        "Drag-and-drop interface",
        "Real-time collaboration",
        "Automated code analysis",
        "Project scaffolding"
      ],
      targetAudience: "Software developers, technical teams, and startups looking to streamline their development workflow",
      tone: "Professional and technical, with a focus on efficiency and modern development practices",
      designStyle: "Dark mode UI with glassmorphism effects, rounded corners, and subtle animations. Uses a minimal color palette with blue and purple accents.",
      keywords: [
        "developer tools",
        "workflow automation",
        "code analysis",
        "project management",
        "modern UI",
        "TypeScript",
        "Next.js"
      ],
      problemsSolved: [
        "Streamlines complex multi-step development workflows",
        "Reduces manual repetitive tasks in project setup",
        "Provides visual representation of project structure",
        "Automates code analysis and documentation generation"
      ],
      competitiveAngle: "Combines visual workflow management with AI-powered insights, making complex development tasks accessible through an intuitive interface",
      brandColorsSuggested: [
        "#3B82F6",  // Blue
        "#8B5CF6",  // Purple
        "#10B981",  // Green
        "#F59E0B"   // Amber
      ],
      iconStyleRecommendation: "Modern, minimal icons with rounded edges. Use outlined style for better scalability. Consider using geometric shapes that represent connectivity and flow."
    };

    return JSON.stringify(mockIntelligence, null, 2);
  }
}

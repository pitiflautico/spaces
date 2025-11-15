import { NextRequest, NextResponse } from 'next/server';

interface ImageGenerationRequest {
  provider: 'replicate' | 'together' | 'local';
  model: string;
  prompt: string;
  apiKey?: string;
  num_outputs?: number;
  width?: number;
  height?: number;
  aspect_ratio?: string;
  seed?: number;
}

/**
 * Image Generation API Route
 *
 * Acts as a proxy to avoid CORS issues when calling image generation APIs
 * from the browser. Forwards requests to Replicate, Together AI, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const body: ImageGenerationRequest = await request.json();
    const {
      provider,
      model,
      prompt,
      apiKey,
      num_outputs = 1,
      width = 1024,
      height = 1024,
      aspect_ratio,
      seed
    } = body;

    console.log(`🎨 Image generation request: ${provider} - ${model}`);

    // Validate inputs
    if (!provider || !model || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, model, prompt' },
        { status: 400 }
      );
    }

    // Route to appropriate provider
    switch (provider) {
      case 'replicate':
        if (!apiKey) {
          return NextResponse.json({ error: 'API key required for Replicate' }, { status: 400 });
        }
        return await handleReplicate({ model, prompt, apiKey, num_outputs, width, height, aspect_ratio, seed });

      case 'together':
        if (!apiKey) {
          return NextResponse.json({ error: 'API key required for Together AI' }, { status: 400 });
        }
        return await handleTogether({ model, prompt, apiKey, num_outputs, width, height });

      case 'local':
        return handleLocal({ model, prompt, num_outputs });

      default:
        return NextResponse.json(
          { error: `Unsupported provider: ${provider}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('❌ Image generation error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * Handle Replicate image generation
 */
async function handleReplicate(params: {
  model: string;
  prompt: string;
  apiKey: string;
  num_outputs: number;
  width: number;
  height: number;
  aspect_ratio?: string;
  seed?: number;
}) {
  const { model, prompt, apiKey, num_outputs, width, height, aspect_ratio, seed } = params;

  try {
    // Build input based on model
    const input: Record<string, any> = { prompt };

    // Model-specific parameters
    if (model.includes('recraft-ai/recraft-v3')) {
      input.num_images = num_outputs;
      input.size = '1024';
      if (aspect_ratio) {
        input.aspect_ratio = aspect_ratio;
      }
    } else if (model.includes('flux')) {
      input.num_outputs = num_outputs;
      input.aspect_ratio = aspect_ratio || '1:1';
      if (seed) {
        input.seed = seed;
      }
    } else {
      input.num_outputs = num_outputs;
      input.width = width;
      input.height = height;
    }

    console.log(`🔄 Calling Replicate API: ${model}`);
    console.log(`📝 Input:`, JSON.stringify(input, null, 2));

    // Create prediction using model endpoint
    const apiUrl = `https://api.replicate.com/v1/models/${model}/predictions`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${apiKey}`
      },
      body: JSON.stringify({ input })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ Replicate API error (${response.status}):`, errorData);
      return NextResponse.json(
        { error: errorData.detail || `Replicate API error: HTTP ${response.status}` },
        { status: response.status }
      );
    }

    const prediction = await response.json();
    console.log(`✅ Prediction created: ${prediction.id}`);

    // Poll for completion
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes timeout

    while ((result.status === 'starting' || result.status === 'processing') && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2 seconds

      const checkResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Token ${apiKey}`
        }
      });

      if (!checkResponse.ok) {
        return NextResponse.json(
          { error: `Failed to check prediction status: HTTP ${checkResponse.status}` },
          { status: checkResponse.status }
        );
      }

      result = await checkResponse.json();
      attempts++;
      console.log(`🔄 Polling attempt ${attempts}: ${result.status}`);
    }

    if (result.status === 'failed') {
      console.error(`❌ Prediction failed:`, result.error);
      return NextResponse.json(
        { error: result.error || 'Prediction failed' },
        { status: 500 }
      );
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Prediction timeout after 2 minutes' },
        { status: 408 }
      );
    }

    // Extract image URLs
    let images: string[] = [];
    if (Array.isArray(result.output)) {
      images = result.output;
    } else if (typeof result.output === 'string') {
      images = [result.output];
    } else if (result.output?.images) {
      images = result.output.images;
    }

    console.log(`✅ Generated ${images.length} images`);

    return NextResponse.json({
      success: true,
      images,
      providerUsed: 'Replicate',
      model,
      count: images.length
    });

  } catch (error: any) {
    console.error('❌ Replicate error:', error);
    return NextResponse.json(
      { error: `Failed to connect to Replicate: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Handle Together AI image generation
 */
async function handleTogether(params: {
  model: string;
  prompt: string;
  apiKey: string;
  num_outputs: number;
  width: number;
  height: number;
}) {
  const { model, prompt, apiKey, num_outputs, width, height } = params;

  try {
    console.log(`🔄 Calling Together AI: ${model}`);

    const response = await fetch('https://api.together.xyz/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        prompt,
        n: num_outputs,
        width,
        height
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ Together AI error (${response.status}):`, errorData);
      return NextResponse.json(
        { error: errorData.error?.message || `Together AI error: HTTP ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    const images: string[] = result.data?.map((item: any) => item.url || item.b64_json) || [];

    console.log(`✅ Generated ${images.length} images`);

    return NextResponse.json({
      success: true,
      images,
      providerUsed: 'Together AI',
      model,
      count: images.length
    });

  } catch (error: any) {
    console.error('❌ Together AI error:', error);
    return NextResponse.json(
      { error: `Failed to connect to Together AI: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Handle local mock generation
 */
function handleLocal(params: {
  model: string;
  prompt: string;
  num_outputs: number;
}) {
  const { prompt, num_outputs } = params;

  // Extract brand name from prompt
  const brandMatch = prompt.match(/logo for (?:the brand )?"([^"]+)"/i);
  const brandName = brandMatch ? brandMatch[1] : 'Brand';

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

  return NextResponse.json({
    success: true,
    images,
    providerUsed: 'Local Mock',
    model: 'mock-flux',
    count: images.length
  });
}

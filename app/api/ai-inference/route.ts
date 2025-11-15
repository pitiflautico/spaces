import { NextRequest, NextResponse } from 'next/server';

interface AIInferenceRequest {
  provider: 'replicate' | 'together' | 'openai' | 'anthropic';
  model: string;
  prompt: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * AI Inference API Route
 *
 * This route acts as a proxy to avoid CORS issues when calling AI providers
 * from the browser. It forwards requests to the appropriate AI provider API.
 */
export async function POST(request: NextRequest) {
  try {
    const body: AIInferenceRequest = await request.json();
    const { provider, model, prompt, apiKey, temperature = 0.7, maxTokens = 4096 } = body;

    // Validate inputs
    if (!provider || !model || !prompt || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, model, prompt, apiKey' },
        { status: 400 }
      );
    }

    // Route to appropriate provider
    switch (provider) {
      case 'replicate':
        return await handleReplicate({ model, prompt, apiKey, temperature, maxTokens });

      case 'together':
        return await handleTogether({ model, prompt, apiKey, temperature, maxTokens });

      case 'openai':
        return await handleOpenAI({ model, prompt, apiKey, temperature, maxTokens });

      case 'anthropic':
        return await handleAnthropic({ model, prompt, apiKey, temperature, maxTokens });

      default:
        return NextResponse.json(
          { error: `Unsupported provider: ${provider}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('AI Inference error:', error);
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
 * Handle Replicate API
 */
async function handleReplicate(params: {
  model: string;
  prompt: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
}) {
  const { model, prompt, apiKey, temperature, maxTokens } = params;

  try {
    // Create prediction
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${apiKey}`
      },
      body: JSON.stringify({
        version: model,
        input: {
          prompt: prompt,
          max_tokens: maxTokens,
          temperature: temperature
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || `Replicate API error: HTTP ${response.status}` },
        { status: response.status }
      );
    }

    const prediction = await response.json();

    // Poll for completion (Replicate is async)
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds timeout

    while ((result.status === 'starting' || result.status === 'processing') && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const checkResponse = await fetch(result.urls.get, {
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
    }

    if (result.status === 'failed') {
      return NextResponse.json(
        { error: result.error || 'Prediction failed' },
        { status: 500 }
      );
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Prediction timeout after 60 seconds' },
        { status: 408 }
      );
    }

    const outputText = Array.isArray(result.output) ? result.output.join('') : result.output;

    return NextResponse.json({
      success: true,
      outputText,
      provider: 'replicate',
      model,
      rawResponse: result
    });
  } catch (error: any) {
    console.error('Replicate error:', error);
    return NextResponse.json(
      { error: `Failed to connect to Replicate: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Handle Together API
 */
async function handleTogether(params: {
  model: string;
  prompt: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
}) {
  const { model, prompt, apiKey, temperature, maxTokens } = params;

  try {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: temperature,
        max_tokens: maxTokens
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error?.message || `Together API error: HTTP ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const outputText = data.choices?.[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens;

    return NextResponse.json({
      success: true,
      outputText,
      provider: 'together',
      model,
      tokensUsed,
      rawResponse: data
    });
  } catch (error: any) {
    console.error('Together error:', error);
    return NextResponse.json(
      { error: `Failed to connect to Together: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Handle OpenAI API
 */
async function handleOpenAI(params: {
  model: string;
  prompt: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
}) {
  const { model, prompt, apiKey, temperature, maxTokens } = params;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: temperature,
        max_tokens: maxTokens
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error?.message || `OpenAI API error: HTTP ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const outputText = data.choices?.[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens;

    return NextResponse.json({
      success: true,
      outputText,
      provider: 'openai',
      model,
      tokensUsed,
      rawResponse: data
    });
  } catch (error: any) {
    console.error('OpenAI error:', error);
    return NextResponse.json(
      { error: `Failed to connect to OpenAI: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Handle Anthropic API
 */
async function handleAnthropic(params: {
  model: string;
  prompt: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
}) {
  const { model, prompt, apiKey, temperature, maxTokens } = params;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: temperature,
        max_tokens: maxTokens
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error?.message || `Anthropic API error: HTTP ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const outputText = data.content?.[0]?.text || '';
    const tokensUsed = data.usage?.input_tokens + data.usage?.output_tokens;

    return NextResponse.json({
      success: true,
      outputText,
      provider: 'anthropic',
      model,
      tokensUsed,
      rawResponse: data
    });
  } catch (error: any) {
    console.error('Anthropic error:', error);
    return NextResponse.json(
      { error: `Failed to connect to Anthropic: ${error.message}` },
      { status: 500 }
    );
  }
}

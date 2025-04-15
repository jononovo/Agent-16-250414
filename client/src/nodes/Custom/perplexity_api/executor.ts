/**
 * Perplexity API Node Executor
 * 
 * Handles the execution logic for the Perplexity API node.
 */

import { createNodeOutput, createErrorOutput } from '@/lib/nodeOutputUtils';

// Define configuration data interface for this node
export interface PerplexityApiNodeData {
  model: string;
  temperature: number;
  maxTokens: number;
  apiKey: string;
  useSystemPrompt: boolean;
  systemPrompt: string;
}

// Default configuration for the node
export const defaultData: PerplexityApiNodeData = {
  model: 'pplx-7b-online',
  temperature: 0.7,
  maxTokens: 1000,
  apiKey: '',
  useSystemPrompt: false,
  systemPrompt: 'You are a helpful AI assistant.'
};

/**
 * Execute the Perplexity API node
 */
export const execute = async (
  data: PerplexityApiNodeData, 
  inputs: Record<string, any>
) => {
  try {
    // Extract inputs
    const prompt = inputs.prompt;
    const systemPrompt = inputs.system || data.systemPrompt;
    
    // Validate inputs
    if (!prompt) {
      return createErrorOutput('Prompt is required');
    }

    if (!data.apiKey) {
      return createErrorOutput('Perplexity API key is required. Please configure it in the node settings.');
    }

    // Prepare API request
    const apiUrl = 'https://api.perplexity.ai/chat/completions';
    const requestBody = {
      model: data.model,
      messages: [
        ...(data.useSystemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      temperature: data.temperature,
      max_tokens: data.maxTokens
    };

    // Make API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    // Handle response
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.error?.message || `API error: ${response.status} ${response.statusText}`;
      return createErrorOutput(errorMessage);
    }

    // Parse successful response
    const responseData = await response.json();
    
    // Extract text from response
    const responseText = responseData.choices?.[0]?.message?.content || '';
    
    // Return output with response text and metadata
    return createNodeOutput({
      response: responseText,
      metadata: {
        model: data.model,
        tokenUsage: responseData.usage || {},
        finishReason: responseData.choices?.[0]?.finish_reason
      }
    });
  } catch (error: unknown) {
    console.error('Perplexity API error:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error processing Perplexity API request';
    return createErrorOutput(`Error processing Perplexity API request: ${errorMessage}`);
  }
};
/**
 * Perplexity API Node Executor
 * 
 * This module implements the runtime logic for the Perplexity API node,
 * handling API calls to Perplexity for search and answer generation.
 */

import { NodeExecutionData } from '@/nodes/types';

interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface PerplexityRequestBody {
  model: string;
  messages: PerplexityMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  search_domain_filter?: string[];
  return_images?: boolean;
  return_related_questions?: boolean;
  search_recency_filter?: string;
  top_k?: number;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
}

/**
 * Makes a request to the Perplexity API
 * 
 * @param apiKey - The Perplexity API key
 * @param requestBody - The full request body configuration
 * @returns Response from the Perplexity API
 */
async function callPerplexityAPI(apiKey: string, requestBody: PerplexityRequestBody) {
  try {
    // Only for testing: if no API key and environment is development, return sample data
    if (!apiKey && import.meta.env.DEV) {
      console.warn('Using sample Perplexity response because no API key was provided');
      return {
        id: "sample-response-id",
        model: requestBody.model || "llama-3.1-sonar-small-128k-online",
        object: "chat.completion",
        created: Date.now(),
        citations: [
          "https://example.com/sample-citation-1",
          "https://example.com/sample-citation-2"
        ],
        choices: [
          {
            index: 0,
            finish_reason: "stop",
            message: {
              role: "assistant",
              content: `This is a sample response for the query: "${requestBody.messages.find(m => m.role === 'user')?.content}"`
            }
          }
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        }
      };
    }

    if (!apiKey) {
      throw new Error('Perplexity API key is required but not provided');
    }
    
    const url = 'https://api.perplexity.ai/chat/completions';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Perplexity API request failed: ${response.status} ${response.statusText} - ${errorData}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error calling Perplexity API:', error);
    throw error;
  }
}

/**
 * Main executor function for the Perplexity API node
 * 
 * @param nodeData - The node's configuration data
 * @param inputs - The inputs received from connected nodes
 * @returns Execution results with the Perplexity response data
 */
export default async function execute(nodeData: Record<string, any>, inputs: Record<string, NodeExecutionData>): Promise<NodeExecutionData> {
  // Mark execution start time
  const startTime = new Date();
  
  try {
    // Get input query from connected node (or use default if testing)
    const items = inputs.input?.items || [];
    const inputItem = items[0]?.json || {};
    
    // Set up configuration with node settings and input overrides
    const apiKey = nodeData.settings?.apiKey || process.env.PERPLEXITY_API_KEY;
    const model = inputItem.model || nodeData.settings?.model || 'llama-3.1-sonar-small-128k-online';
    const query = inputItem.query || '';
    const systemPrompt = inputItem.system_prompt || nodeData.settings?.systemPrompt || 'Be precise and concise.';
    const temperature = parseFloat(inputItem.temperature || nodeData.settings?.temperature || '0.2');
    const maxTokens = parseInt(inputItem.max_tokens || nodeData.settings?.maxTokens || '1024', 10);
    const searchDomainFilter = inputItem.search_domain_filter || [];
    const searchRecencyFilter = inputItem.search_recency_filter || nodeData.settings?.searchRecencyFilter || 'month';
    
    // Validate inputs
    if (!query) {
      throw new Error('No query provided to Perplexity API node');
    }
    
    // Prepare messages array
    const messages: PerplexityMessage[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: query
      }
    ];
    
    // Create request body for Perplexity API
    const requestBody: PerplexityRequestBody = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      search_domain_filter: searchDomainFilter,
      search_recency_filter: searchRecencyFilter,
      stream: false,
      return_images: false,
      return_related_questions: false,
      top_p: 0.9,
      frequency_penalty: 1,
      presence_penalty: 0
    };
    
    // Call the Perplexity API
    const response = await callPerplexityAPI(apiKey, requestBody);
    
    // Extract the answer from the response
    const answer = response.choices[0]?.message?.content || '';
    const citations = response.citations || [];
    
    // Format the results
    const result = {
      answer,
      citations,
      completion: response
    };
    
    // Return the execution data
    return {
      items: [{ json: result }],
      meta: {
        startTime,
        endTime: new Date(),
        status: 'success'
      }
    };
  } catch (error) {
    console.error('Perplexity API Node Error:', error);
    
    // Return error information
    return {
      items: [],
      meta: {
        startTime,
        endTime: new Date(),
        status: 'error',
        errorMessage: error instanceof Error ? error.message : String(error)
      }
    };
  }
}
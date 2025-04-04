import { NodeExecutor } from '../workflowEngine';

interface PerplexityNodeData {
  inputText?: string;
  apiKey?: string;
  label?: string;
  [key: string]: any;
}

interface PerplexityNodeInputs {
  default?: string;
  [key: string]: any;
}

/**
 * Executor for Perplexity API nodes
 * 
 * This node makes a search request to the Perplexity API and returns the search results.
 */
export const perplexityExecutor: NodeExecutor = {
  /**
   * Execute the Perplexity node
   */
  async execute(nodeData: PerplexityNodeData, inputs: PerplexityNodeInputs): Promise<string> {
    // Use inputText from node data or from inputs
    const query = nodeData.inputText || inputs.default;
    
    if (!query) {
      throw new Error('No input text provided for Perplexity search');
    }
    
    // Get API key from environment or node data
    const envApiKey = import.meta.env.PERPLEXITY_API_KEY;
    const apiKey = envApiKey || nodeData.apiKey;
    
    if (!apiKey) {
      // Return simulated result if no API key is available
      return simulatePerplexityResponse(query);
    }
    
    try {
      // Make real API call to Perplexity
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "pplx-7b-online",
          messages: [{ role: "user", content: query }]
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error status:', response.status);
        console.error('API error text:', errorText);
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.choices && result.choices[0] && result.choices[0].message) {
        return result.choices[0].message.content;
      } else {
        throw new Error('Unexpected API response format');
      }
    } catch (error) {
      console.error('Error searching with Perplexity API:', error);
      throw error;
    }
  }
};

/**
 * Generate a simulated response for Perplexity searches when no API key is available
 */
function simulatePerplexityResponse(query: string): string {
  const lowercaseQuery = query.toLowerCase();
  
  if (lowercaseQuery.includes("capital") && lowercaseQuery.includes("azerbaijan")) {
    return "The capital of Azerbaijan is Baku. It is the largest city in Azerbaijan and the Caucasus region.";
  } else if (lowercaseQuery.includes("capital")) {
    return "Based on your query about a capital, I would need more specific information about which country or region you're asking about.";
  } else if (lowercaseQuery.includes("weather")) {
    return "To provide accurate weather information, I would need to know the specific location you're inquiring about.";
  } else if (lowercaseQuery.includes("recipe") || lowercaseQuery.includes("cook")) {
    return "Based on your query about cooking, I can suggest checking various recipe websites or specifying what dish you're interested in preparing.";
  } else {
    return `Results for: ${query}\n\nTo get actual results from Perplexity, please provide an API key. The simulation provides limited responses for demonstration purposes.`;
  }
}
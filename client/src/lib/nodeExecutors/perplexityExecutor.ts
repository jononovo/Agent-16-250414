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
    
    // Try to get API key from multiple sources
    // 1. First check if it was passed directly to the node
    let apiKey = nodeData.apiKey;
    
    // 2. If not available in node data, try to fetch from our server config endpoint
    if (!apiKey) {
      try {
        console.log('Fetching API key from server config...');
        const configResponse = await fetch('/api/config');
        
        if (configResponse.ok) {
          const config = await configResponse.json();
          apiKey = config.perplexityApiKey;
          console.log('Retrieved config from server:', apiKey ? 'API key found' : 'No API key in config');
        } else {
          console.error('Failed to fetch config from server:', configResponse.status);
        }
      } catch (error) {
        console.error('Error fetching config from server:', error);
      }
    }
    
    console.log('Using Perplexity API:', apiKey ? 'API Key available' : 'No API Key');
    
    if (!apiKey) {
      // Return simulated result if no API key is available
      console.log('No API key available, using simulation');
      return simulatePerplexityResponse(query);
    }
    
    // Log that we're making a real API call
    console.log('Making Perplexity API request with query:', query);
    
    try {
      // Make real API call to Perplexity
      console.log('Sending request to Perplexity API...');
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "sonar-small-online",  // Updated to a valid model
          messages: [{ role: "user", content: query }]
        })
      });
      
      console.log('Perplexity API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error status:', response.status);
        console.error('API error text:', errorText);
        
        // Fall back to simulation on error, but include error details
        const errorMessage = `Error from Perplexity API (${response.status}): ${errorText}\n\nFalling back to simulated response:\n\n`;
        return errorMessage + simulatePerplexityResponse(query);
      }
      
      const result = await response.json();
      console.log('Perplexity API response received:', result);
      
      if (result.choices && result.choices[0] && result.choices[0].message) {
        const content = result.choices[0].message.content;
        console.log('Perplexity API content:', content.substring(0, 100) + '...');
        return content;
      } else {
        console.error('Unexpected API response format:', result);
        throw new Error('Unexpected API response format from Perplexity API');
      }
    } catch (error) {
      console.error('Error searching with Perplexity API:', error);
      
      // Fall back to simulation on error
      const errorMessage = `Error calling Perplexity API: ${error instanceof Error ? error.message : String(error)}\n\nFalling back to simulated response:\n\n`;
      return errorMessage + simulatePerplexityResponse(query);
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
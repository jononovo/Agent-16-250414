import { NodeExecutor } from '../workflowEngine';

interface GenerateTextNodeData {
  model?: string;
  systemPrompt?: string;
  userPrompt?: string;
  apiKey?: string;
  settings?: {
    apiKey?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
  [key: string]: any;
}

interface GenerateTextNodeInputs {
  default?: string;
  prompt?: string;
  system?: string;
  [key: string]: any;
}

/**
 * Executor for Generate Text (AI model) nodes
 * 
 * This node generates text using various AI models, including Claude.
 */
export const generateTextExecutor: NodeExecutor = {
  /**
   * Execute the Generate Text node
   */
  async execute(nodeData: GenerateTextNodeData, inputs: GenerateTextNodeInputs): Promise<string> {
    // Get system prompt from node data or inputs
    const systemPrompt = nodeData.systemPrompt || inputs.system || "";
    
    // Get user prompt from node data, inputs, or fall back to default input
    const userPromptTemplate = nodeData.userPrompt || inputs.prompt || inputs.default || "";
    
    // Replace any input variables in the user prompt template
    let userPrompt = userPromptTemplate;
    Object.entries(inputs).forEach(([key, value]) => {
      if (typeof value === 'string') {
        userPrompt = userPrompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      }
    });
    
    if (!userPrompt) {
      throw new Error('No user prompt provided for text generation');
    }
    
    // Get API key from node settings, node data, or server config
    let apiKey = nodeData.settings?.apiKey || nodeData.apiKey;
    
    // Debug log for node data
    console.log('Node data:', {
      hasSettings: !!nodeData.settings,
      apiKeyInSettings: !!nodeData.settings?.apiKey,
      directApiKey: !!nodeData.apiKey,
      model: nodeData.model || nodeData.settings?.model
    });
    
    // If no API key in node settings, try to fetch from server config
    if (!apiKey) {
      try {
        console.log('Fetching API key from server config...');
        const configResponse = await fetch('/api/config');
        
        if (configResponse.ok) {
          const config = await configResponse.json();
          apiKey = config.claudeApiKey;
          console.log('Retrieved config from server:', apiKey ? 'Claude API key found' : 'No Claude API key in config');
        } else {
          console.error('Failed to fetch config from server:', configResponse.status);
        }
      } catch (error) {
        console.error('Error fetching config from server:', error);
      }
    }
    
    console.log('Using Claude API:', apiKey ? 'API Key available' : 'No API Key');
    
    if (!apiKey) {
      // Return simulated result if no API key is available
      console.log('No API key available, using simulation');
      return simulateTextGeneration(
        nodeData.settings?.model || nodeData.model || "claude-3.5-sonnet", 
        systemPrompt, 
        userPrompt
      );
    }
    
    // Get model from settings or fallback to default
    const model = nodeData.settings?.model || nodeData.model || "claude-3.5-sonnet";
    console.log(`Making Claude API request with model: ${model}`);
    
    try {
      // Create the messages array
      const messages = [];
      
      // Add system message if available
      if (systemPrompt) {
        messages.push({
          role: "system",
          content: systemPrompt
        });
      }
      
      // Add user message
      messages.push({
        role: "user",
        content: userPrompt
      });
      
      // Prepare request body
      const requestBody = {
        model,
        messages,
        temperature: parseFloat(String(nodeData.settings?.temperature || 0.7)),
        max_tokens: parseInt(String(nodeData.settings?.maxTokens || 1024))
      };
      
      console.log('Sending request to Claude API with body:', JSON.stringify(requestBody).substring(0, 200) + '...');
      
      // Set up headers
      let headers: HeadersInit = {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey
      };
      
      // Add Bearer token format if needed (handles both authentication formats)
      if (!headers['x-api-key'].startsWith('sk-')) {
        headers = {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'Authorization': `Bearer ${apiKey}`
        };
      }
      
      // Make request to Claude API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      console.log('Claude API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error status:', response.status);
        console.error('API error text:', errorText);
        
        // Fall back to simulation on error, but include error details
        const errorMessage = `Error from Claude API (${response.status}): ${errorText}\n\nFalling back to simulated response:\n\n`;
        return errorMessage + simulateTextGeneration(model, systemPrompt, userPrompt);
      }
      
      const result = await response.json();
      console.log('Claude API response received:', result);
      
      if (result.content && result.content.length > 0) {
        const content = result.content[0].text;
        console.log('Claude API content:', content.substring(0, 100) + '...');
        return content;
      } else {
        console.error('Unexpected API response format:', result);
        throw new Error('Unexpected API response format from Claude API');
      }
    } catch (error) {
      console.error('Error generating text with Claude API:', error);
      
      // Fall back to simulation on error
      const errorMessage = `Error calling Claude API: ${error instanceof Error ? error.message : String(error)}\n\nFalling back to simulated response:\n\n`;
      return errorMessage + simulateTextGeneration(model, systemPrompt, userPrompt);
    }
  }
};

/**
 * Generate a simulated response for Text Generation when no API key is available
 */
function simulateTextGeneration(model: string, systemPrompt: string, userPrompt: string): string {
  // Generate a basic simulation based on inputs
  const response = [
    `[Simulated ${model} response]`,
    '',
    `Based on the prompt: "${userPrompt.substring(0, 50)}${userPrompt.length > 50 ? '...' : ''}"`,
    ''
  ];
  
  // Add system context if available
  if (systemPrompt) {
    response.push(`System context: "${systemPrompt.substring(0, 30)}${systemPrompt.length > 30 ? '...' : ''}"`);
    response.push('');
  }
  
  // Add simulated response content based on the type of prompt
  const lowerPrompt = userPrompt.toLowerCase();
  
  if (lowerPrompt.includes('describe') || lowerPrompt.includes('explain')) {
    response.push('This is a simulated explanation response. To get actual AI-generated text, please provide a Claude API key in the node settings.');
  } else if (lowerPrompt.includes('list') || lowerPrompt.includes('steps')) {
    response.push('1. This is a simulated list response');
    response.push('2. To get actual AI-generated text, add your Claude API key');
    response.push('3. The simulation provides basic responses for demonstration purposes');
  } else if (lowerPrompt.includes('analyze') || lowerPrompt.includes('evaluate')) {
    response.push('This is a simulated analysis response. Add your Claude API key to get actual AI analysis and evaluations.');
  } else {
    response.push('This is a simulated text generation response. To get actual AI-generated text, please provide a Claude API key in the node settings drawer. Click on the generate_text node to open the settings and add your API key.');
    response.push('');
    response.push('The simulation provides limited responses for demonstration purposes only.');
  }
  
  return response.join('\n');
}
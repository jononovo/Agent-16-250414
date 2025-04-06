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
    
    // Support for direct object input passed from workflow engine
    if (nodeData.inputText) {
      console.log('Using input text from nodeData:', typeof nodeData.inputText);
      if (typeof nodeData.inputText === 'object') {
        // If it's an object with prompt or text field, use that
        if (nodeData.inputText.prompt) {
          userPrompt = nodeData.inputText.prompt;
        } else if (nodeData.inputText.text) {
          userPrompt = nodeData.inputText.text;
        } else {
          // Otherwise stringify the object
          userPrompt = JSON.stringify(nodeData.inputText);
        }
      } else if (typeof nodeData.inputText === 'string') {
        userPrompt = nodeData.inputText;
      }
    }
    
    if (!userPrompt) {
      throw new Error('No user prompt provided for text generation');
    }
    
    // Get API key from node settings, node data, or server config
    let apiKey = nodeData.settings?.apiKey || nodeData.apiKey;
    
    // Handle special "__ENV_CLAUDE_API_KEY__" placeholder
    if (apiKey === "__ENV_CLAUDE_API_KEY__") {
      console.log("Using environment variable for Claude API key");
      apiKey = process.env.CLAUDE_API_KEY || '';
    }
    
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
        // Use absolute URL for server-side execution
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';
        const configResponse = await fetch(`${baseUrl}/api/config`);
        
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
        nodeData.settings?.model || nodeData.model || "claude-3-7-sonnet-20250219", 
        systemPrompt, 
        userPrompt
      );
    }
    
    // Get model from settings or fallback to default
    const model = nodeData.settings?.model || nodeData.model || "claude-3-7-sonnet-20250219";
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
      
      // Set up headers - Use newer Anthropic API version for Claude 3.7
      let headers: HeadersInit = {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01', // This is the API version Anthropic recommends
        'x-api-key': apiKey // Always use x-api-key for Claude API keys
      };
      
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
        
        // Format a user-friendly error message
        let errorExplanation = "";
        
        if (response.status === 401) {
          errorExplanation = `Authentication error (401): The Claude API key appears to be invalid or expired. 
Please check that the CLAUDE_API_KEY environment variable contains a valid API key.

This workflow is configured to use model: "${model}" which requires a valid Claude API key.
If you just added the key, you may need to restart the server for it to take effect.`;
        } else if (response.status === 400) {
          errorExplanation = `Bad request error (400): The request to Claude API was malformed. 
This could be due to an invalid model name (currently using "${model}"), incompatible parameters, or exceeded context length. 
Claude 3.7 models should use names like "claude-3-7-sonnet-20250219".`;
        } else if (response.status === 429) {
          errorExplanation = `Rate limit exceeded (429): You've hit the Claude API rate limit. 
Please wait a moment before trying again.`;
        } else if (response.status >= 500) {
          errorExplanation = `Claude API server error (${response.status}): There's an issue with the Claude API service. 
This is not a problem with your implementation but with the API provider.`;
        } else {
          errorExplanation = `Error from Claude API (${response.status}): ${errorText}`;
        }
        
        // Fall back to simulation on error, but include error details
        const errorMessage = `${errorExplanation}\n\nFalling back to simulated response:\n\n`;
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
function simulateTextGeneration(model: string, systemPrompt: string, userPrompt: any): string {
  // Make sure we have a string for userPrompt
  const promptString = typeof userPrompt === 'string' 
    ? userPrompt 
    : (userPrompt?.text || userPrompt?.prompt || JSON.stringify(userPrompt));
  
  // Generate a basic simulation based on inputs
  const response = [
    `[Simulated ${model} response]`,
    '',
    `Based on the prompt: "${promptString.substring(0, 50)}${promptString.length > 50 ? '...' : ''}"`,
    ''
  ];
  
  // Add system context if available
  if (systemPrompt) {
    response.push(`System role: "${systemPrompt.substring(0, 100)}${systemPrompt.length > 100 ? '...' : ''}"`);
    response.push('');
  }
  
  // Determine if it's a coordinator or generator agent based on the system prompt
  const isCoordinator = systemPrompt.toLowerCase().includes('coordinator agent');
  const isGenerator = systemPrompt.toLowerCase().includes('generator agent');
  
  if (isCoordinator) {
    response.push("Hello! I'm the Coordinator Agent. I'm here to help gather your requirements and determine how I can assist you. Could you please tell me more about what you're looking to accomplish? Some helpful details would include:");
    response.push("");
    response.push("1. What task or problem are you trying to solve?");
    response.push("2. Are there any specific tools or APIs you'd like to integrate?");
    response.push("3. What format would you like the output in?");
    response.push("");
    response.push("(Note: This is a simulated response. For actual Claude-powered responses, the system needs to be configured with a valid Claude API key.)");
  } else if (isGenerator) {
    response.push("Based on the specifications provided, I'll create an agent to address your needs. Here's what I'm thinking:");
    response.push("");
    response.push("**Agent Name:** Task-Specific Assistant");
    response.push("**Description:** An agent designed to help with your specific task requirements");
    response.push("**Recommended Workflow:**");
    response.push("1. Input processing node to handle user queries");
    response.push("2. Analysis node to determine intent and requirements");
    response.push("3. Action node to perform the requested operation");
    response.push("4. Response formatting node to deliver results in the preferred format");
    response.push("");
    response.push("(Note: This is a simulated response. For actual Claude-powered agent generation, the system needs to be configured with a valid Claude API key.)");
  } else {
    // Generic simulation response for other types of agents
    response.push("This is a simulated AI response. To get actual AI-generated text, please ensure:");
    response.push("");
    response.push("1. A valid Claude API key is provided in the environment");
    response.push("2. The generateText node is properly configured with the correct model");
    response.push("3. The system has proper network access to reach the Claude API");
    response.push("");
    response.push("The simulation is providing this placeholder response for testing and development purposes only.");
  }
  
  return response.join('\n');
}
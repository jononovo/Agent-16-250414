/**
 * Claude Node Executor
 * 
 * This file contains the logic for executing the Claude AI node.
 * It sends a prompt to the Claude API and returns the response.
 */

export const execute = async (nodeData: any, inputs?: any): Promise<any> => {
  try {
    const startTime = new Date();
    
    // Get inputs and parameters
    // Enhanced input handling to support various formats
    let promptInput = '';
    
    if (inputs?.prompt) {
      // Handle various possible input formats - simplified approach for reliability
      console.log('Raw prompt input:', typeof inputs.prompt, inputs.prompt);
      
      // Deep search function to extract text from nested structures
      function extractTextFromData(data: any): string | null {
        // Direct case - string
        if (typeof data === 'string') {
          return data;
        }
        
        // If it's an object, search through common patterns
        if (data && typeof data === 'object') {
          // Common patterns
          if (data.text) return data.text;
          if (data.content) return data.content;
          if (data.inputText) return data.inputText;
          
          // Check for items array
          if (data.items && Array.isArray(data.items) && data.items.length > 0) {
            // Try to extract from each item
            for (const item of data.items) {
              const extracted = extractTextFromData(item);
              if (extracted) return extracted;
            }
          }
          
          // Check for json property
          if (data.json) {
            const extracted = extractTextFromData(data.json);
            if (extracted) return extracted;
          }
          
          // Try all properties recursively
          for (const key in data) {
            if (typeof data[key] === 'object' && data[key] !== null) {
              const extracted = extractTextFromData(data[key]);
              if (extracted) return extracted;
            }
          }
        }
        
        // If nothing works, return null
        return null;
      }
      
      // Try to extract text from the input
      const extractedText = extractTextFromData(inputs.prompt);
      if (extractedText) {
        promptInput = extractedText;
      }
      
      // As a last resort, try JSON parsing if it looks like a JSON string
      if (!promptInput && typeof inputs.prompt === 'string' && 
          (inputs.prompt.startsWith('{') || inputs.prompt.startsWith('['))) {
        try {
          const parsed = JSON.parse(inputs.prompt);
          const extractedFromJson = extractTextFromData(parsed);
          if (extractedFromJson) {
            promptInput = extractedFromJson;
          }
        } catch (e) {
          // Couldn't parse JSON, that's fine
        }
      }
    }
    
    // Log what we received to help with debugging
    console.log('Claude inputs received:', {
      rawInput: inputs?.prompt,
      extractedPrompt: promptInput
    });
    
    const prompt = nodeData.prompt || promptInput || '';
    const model = nodeData.model || 'claude-3-haiku-20240307';
    const temperature = nodeData.temperature !== undefined ? nodeData.temperature : 0.7;
    const maxTokens = nodeData.maxTokens || 1000;
    const systemPrompt = nodeData.systemPrompt || '';
    
    // Check if we have a prompt
    if (!prompt) {
      return {
        meta: {
          status: 'error',
          message: 'No prompt provided to Claude',
          startTime: startTime.toISOString(),
          endTime: new Date().toISOString()
        },
        items: []
      };
    }
    
    // Look for API key in this order:
    // 1. Node data (user entered in UI)
    // 2. Server environment (via API config endpoint)
    let claudeApiKey = nodeData.apiKey || '';
    let useServerProxy = false;
    
    // If no API key in node data, try to get from server config
    if (!claudeApiKey) {
      try {
        // Fetch the API key from server config
        const configResponse = await fetch('/api/config');
        if (configResponse.ok) {
          const config = await configResponse.json();
          console.log('Retrieved API config, claudeApiKey exists:', !!config.claudeApiKey);
          
          // If config.claudeApiKey exists, we'll use the server proxy endpoint
          if (config.claudeApiKey) {
            useServerProxy = true;
            claudeApiKey = 'use-server-proxy';  // Marker to indicate we'll use server proxy
          }
        } else {
          console.error('Failed to fetch API config:', configResponse.status);
        }
      } catch (error) {
        console.error('Error fetching API config:', error);
      }
    }
    
    // Check if we have an API key (either direct or via server)
    if (!claudeApiKey) {
      console.warn('No Claude API key available. Using mock response. Please configure the API key in the node settings or server environment.');
      
      // Return a mock response for development
      const mockResponse = {
        text: `This is a mock response from Claude because no API key was provided. Your prompt was: "${prompt}"`,
        model,
        usage: {
          input_tokens: prompt.length / 4,
          output_tokens: 20,
          total_tokens: prompt.length / 4 + 20
        }
      };
      
      return {
        meta: {
          status: 'success',
          message: 'Generated mock Claude response (no API key)',
          startTime: startTime.toISOString(),
          endTime: new Date().toISOString()
        },
        items: [
          {
            json: {
              response: mockResponse.text,
              fullResponse: mockResponse
            },
            binary: null
          }
        ]
      };
    }
    
    // Prepare request to Claude API
    const requestBody = {
      model,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      max_tokens: maxTokens,
      temperature
    };
    
    console.log('Sending request to Claude API:', { model, temperature, maxTokens });
    
    try {
      let response;
      
      if (useServerProxy) {
        // Use server proxy when the API key comes from server environment
        console.log('Using server proxy for Claude API call');
        response = await fetch('/api/proxy/claude', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
      } else {
        // Direct API call when user provided an API key in the node
        console.log('Using direct Claude API call with provided key');
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': claudeApiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(requestBody)
        });
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API error (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      
      return {
        meta: {
          status: 'success',
          message: 'Successfully generated text with Claude',
          startTime: startTime.toISOString(),
          endTime: new Date().toISOString()
        },
        items: [
          {
            json: {
              response: data.content && data.content[0]?.text || '',
              fullResponse: data
            },
            binary: null
          }
        ]
      };
    } catch (apiError: any) {
      console.error('Claude API error:', apiError);
      
      return {
        meta: {
          status: 'error',
          message: `Claude API error: ${apiError.message || 'Unknown error'}`,
          startTime: startTime.toISOString(),
          endTime: new Date().toISOString()
        },
        items: []
      };
    }
  } catch (error: any) {
    // Handle general errors
    return {
      meta: {
        status: 'error',
        message: error.message || 'Error executing Claude node',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString()
      },
      items: []
    };
  }
};
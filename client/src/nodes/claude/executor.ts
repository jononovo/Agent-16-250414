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
    const promptInput = inputs?.prompt?.text || '';
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
    
    // Attempt to get Claude API key from environment
    const claudeApiKey = (window as any).CLAUDE_API_KEY || '';
    
    // Check if we have an API key
    if (!claudeApiKey) {
      console.warn('No Claude API key available. Using mock response.');
      
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
      // Send request to Claude API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      });
      
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
/**
 * Claude API Node Executor
 * 
 * Handles the execution of Claude API nodes, which generate text using Claude AI models.
 */

import { EnhancedNodeExecutor, NodeExecutionData, createExecutionDataFromValue } from '../types/workflow';

// Enhanced Claude API call function with full configuration options
async function callClaudeAPI(
  prompt: string, 
  apiKey: string, 
  model: string = 'claude-3-sonnet-20240229',
  systemPrompt?: string,
  temperature: number = 0.7,
  maxTokens: number = 2000
) {
  try {
    console.log(`Calling Claude API with model: ${model}, temp: ${temperature}, max tokens: ${maxTokens}`);
    
    // Prepare messages array
    const messages = [];
    
    // Add system prompt if provided
    if (systemPrompt) {
      console.log(`Using system prompt: ${systemPrompt.substring(0, 30)}...`);
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    // Add user message
    messages.push({ role: 'user', content: prompt });
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error response:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Claude API response received successfully');
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.error('Unexpected Claude API response format:', data);
      throw new Error('Unexpected API response format');
    }
    
    return data.content[0].text;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw error;
  }
}

export const claudeExecutor: EnhancedNodeExecutor = {
  nodeType: 'claude',
  
  execute: async (nodeData, inputs) => {
    try {
      console.log('Executing Claude node with data:', nodeData.label || 'Unnamed Claude Node');
      
      // Get the input from the connected node
      const inputKeys = Object.keys(inputs);
      let prompt = '';
      
      if (inputKeys.length > 0) {
        const firstInputKey = inputKeys[0];
        const firstInput = inputs[firstInputKey];
        
        // Extract text from the first item of the input
        if (firstInput.items && firstInput.items.length > 0) {
          const firstItem = firstInput.items[0];
          if (typeof firstItem.json === 'string') {
            prompt = firstItem.json;
          } else if (typeof firstItem.json === 'object') {
            // Try to find text in the JSON object
            if (firstItem.json.text) {
              prompt = firstItem.json.text;
            } else if (firstItem.json.content) {
              prompt = firstItem.json.content;
            } else if (firstItem.json.message) {
              prompt = firstItem.json.message;
            } else {
              // Convert the entire object to a string
              prompt = JSON.stringify(firstItem.json);
            }
          }
        }
      } else if (nodeData.inputText) {
        // If no connected input, use the node's own inputText if available
        prompt = nodeData.inputText;
      }
      
      if (!prompt) {
        console.warn('No input text provided for Claude node');
        
        // Create error execution data
        const errorData: NodeExecutionData = {
          items: [{
            json: {
              error: 'No input text provided',
              _hasError: true,
              _errorMessage: 'No input text provided'
            },
            meta: {
              source: 'claude',
              timestamp: new Date()
            }
          }],
          meta: {
            startTime: new Date(),
            endTime: new Date(),
            error: 'No input text provided',
            status: 'error'
          }
        };
        
        return errorData;
      }
      
      // Extract settings from nodeData
      const settings = nodeData.settings || {};
      const config = nodeData.configuration || {};
      
      // Get Claude API key from various possible sources
      const apiKey = 
        settings.apiKey || 
        config.apiKey || 
        nodeData.apiKey || 
        import.meta.env.CLAUDE_API_KEY || 
        '';
      
      if (!apiKey) {
        console.error('Claude API key not found');
        
        // Create error execution data
        const errorData: NodeExecutionData = {
          items: [{
            json: {
              error: 'Claude API key is not configured',
              _hasError: true,
              _errorMessage: 'Claude API key is not configured'
            },
            meta: {
              source: 'claude',
              timestamp: new Date()
            }
          }],
          meta: {
            startTime: new Date(),
            endTime: new Date(),
            error: 'Claude API key is not configured',
            status: 'error'
          }
        };
        
        return errorData;
      }
      
      // Extract other settings with defaults
      const model = settings.model || config.model || 'claude-3-sonnet-20240229';
      const systemPrompt = settings.systemPrompt || config.systemPrompt;
      const temperature = Number(settings.temperature || config.temperature || 0.7);
      const maxTokens = Number(settings.maxTokens || config.maxTokens || 2000);
      
      console.log(`Using Claude model: ${model}`);
      
      // Record start time
      const startTime = new Date();
      
      // Call Claude API with full configuration
      const generatedText = await callClaudeAPI(
        prompt, 
        apiKey, 
        model,
        systemPrompt,
        temperature,
        maxTokens
      );
      
      console.log('Claude generation successful, length:', generatedText.length);
      
      // Create successful execution data
      const responseData: NodeExecutionData = {
        items: [{
          json: {
            text: generatedText,
            output: generatedText,
            generated: generatedText,
            _generatedText: generatedText,
            model: model
          },
          meta: {
            source: 'claude',
            timestamp: new Date(),
            model: model
          }
        }],
        meta: {
          startTime: startTime,
          endTime: new Date(),
          sourceOperation: 'claude-api',
          itemsProcessed: 1,
          model: model
        }
      };
      
      return responseData;
      
    } catch (error: any) {
      console.error(`Error executing Claude API node:`, error);
      
      // Create error execution data
      const errorData: NodeExecutionData = {
        items: [{
          json: {
            error: error.message || 'Error processing Claude API request',
            _hasError: true,
            _errorMessage: error.message || 'Error processing Claude API request'
          },
          meta: {
            source: 'claude',
            timestamp: new Date()
          }
        }],
        meta: {
          startTime: new Date(),
          endTime: new Date(),
          error: error.message || 'Error processing Claude API request',
          status: 'error'
        }
      };
      
      return errorData;
    }
  }
};
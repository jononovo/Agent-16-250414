/**
 * Claude API Node Executor
 * 
 * Handles the execution of Claude API nodes, which generate text using Claude AI models.
 */

import { EnhancedNodeExecutor } from '../types/workflow';

// Generic AI API call function
async function callAIAPI(prompt: string, apiKey: string) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Error calling AI API:', error);
    throw error;
  }
}

export const claudeExecutor: EnhancedNodeExecutor = {
  nodeType: 'claude',
  
  execute: async (nodeData, inputs) => {
    try {
      // Get the input from the connected node
      const inputKeys = Object.keys(inputs);
      let prompt = '';
      
      if (inputKeys.length > 0) {
        const firstInputKey = inputKeys[0];
        const firstInput = inputs[firstInputKey];
        
        // Try to extract text from the input
        if (typeof firstInput.text === 'string') {
          prompt = firstInput.text;
        } else if (typeof firstInput.output === 'string') {
          prompt = firstInput.output;
        } else if (typeof firstInput === 'string') {
          prompt = firstInput;
        } else if (firstInput && typeof firstInput === 'object') {
          prompt = JSON.stringify(firstInput);
        }
      }
      
      // Get Claude API key from config
      const apiKey = nodeData.configuration?.apiKey || process.env.CLAUDE_API_KEY || '';
      
      if (!apiKey) {
        throw new Error('Claude API key is not configured');
      }
      
      // Call Claude API
      const generatedText = await callAIAPI(prompt, apiKey);
      
      // Return the generated text
      return {
        success: true,
        outputs: {
          text: generatedText,
          output: generatedText,
          generated: generatedText
        }
      };
    } catch (error: any) {
      console.error(`Error executing Claude API node:`, error);
      return {
        success: false,
        error: error.message || 'Error processing Claude API request',
        outputs: {}
      };
    }
  }
};
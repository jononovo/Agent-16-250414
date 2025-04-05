/**
 * Generate Text Node Executor (Vercel AI SDK)
 * 
 * Handles the execution of Generate Text nodes, which use various AI models
 * to generate text based on prompts and system instructions.
 */

import { EnhancedNodeExecutor, createExecutionDataFromValue, NodeDefinition } from '../types/workflow';
import { apiRequest } from '../../lib/apiClient';

// Define the Tool interface
interface Tool {
  id: string;
  name: string;
  description?: string;
}

// Node definition
const definition: NodeDefinition = {
  type: 'generate_text',
  displayName: 'Generate Text',
  description: 'Generate text using various AI models with system instructions and prompts',
  icon: 'sparkles',
  category: 'ai',
  version: '1.0',
  inputs: {
    input: {
      type: 'string',
      displayName: 'Input',
      description: 'The text input to use in the prompt template',
      required: false,
    },
    tools: {
      type: 'object',
      displayName: 'Tools',
      description: 'Tool outputs that can be used by the model',
      required: false,
    },
    system: {
      type: 'string',
      displayName: 'System Instructions',
      description: 'Override the system instructions',
      required: false,
    }
  },
  outputs: {
    text: {
      type: 'string',
      displayName: 'Generated Text',
      description: 'The text generated by the model',
    },
    output: {
      type: 'string',
      displayName: 'Output',
      description: 'Alias for the generated text (for backward compatibility)',
    },
    fullResponse: {
      type: 'object',
      displayName: 'Full Response',
      description: 'The complete response from the AI model',
    }
  }
};

// Helper function to get the appropriate API endpoint based on the model
const getApiEndpoint = (model: string): string => {
  if (model.startsWith('claude')) {
    return '/api/claude'; 
  } else if (model.startsWith('gpt')) {
    return '/api/openai';
  } else if (model === 'deepseek-chat') {
    return '/api/deepseek';
  } else {
    // Default to Claude if unknown
    return '/api/claude';
  }
};

// Generate Text Node Executor
export const generateTextExecutor: EnhancedNodeExecutor = {
  // Provide the node definition
  definition,
  
  // Execute function
  execute: async (nodeData, inputs) => {
    const startTime = new Date();
    
    try {
      // Get configuration from the node data
      const systemInstruction = nodeData.systemInstruction || nodeData.configuration?.systemInstruction || '';
      const promptTemplate = nodeData.promptTemplate || nodeData.configuration?.promptTemplate || '';
      const model = nodeData.config?.model || nodeData.configuration?.model || 'claude-3-opus-20240229';
      const temperature = nodeData.config?.temperature || nodeData.configuration?.temperature || 0.7;
      const maxTokens = nodeData.config?.maxTokens || nodeData.configuration?.maxTokens || 1024;
      
      // Get tool inputs if provided
      const toolInputs: Record<string, any> = {};
      const dynamicHandles = nodeData.dynamicHandles || { tools: [] };
      
      // Process each tool if it has input data
      dynamicHandles.tools.forEach((tool: Tool) => {
        const toolInputKey = `tool-${tool.id}`;
        if (inputs[toolInputKey]) {
          // Extract data from the tool input
          const firstItem = inputs[toolInputKey].items[0];
          if (firstItem) {
            toolInputs[tool.name] = firstItem.json;
          }
        }
      });
      
      // Get the input text from connected nodes
      let inputText = '';
      if (inputs.input && inputs.input.items && inputs.input.items.length > 0) {
        const firstItem = inputs.input.items[0];
        if (typeof firstItem.json === 'string') {
          inputText = firstItem.json;
        } else if (typeof firstItem.json.text === 'string') {
          inputText = firstItem.json.text;
        } else if (typeof firstItem.json.output === 'string') {
          inputText = firstItem.json.output;
        } else if (firstItem.json && typeof firstItem.json === 'object') {
          // Try to stringify the object
          try {
            inputText = JSON.stringify(firstItem.json);
          } catch (e) {
            console.warn('Could not stringify input object');
          }
        }
      }
      
      // Process the prompt template with input variables
      let finalPrompt = promptTemplate;
      if (promptTemplate.includes('{{input}}') && inputText) {
        finalPrompt = promptTemplate.replace(/{{input}}/g, inputText);
      } else if (!promptTemplate && inputText) {
        // If no template but we have input, use the input directly
        finalPrompt = inputText;
      }
      
      // Add tool data to the prompt if not directly handled by the model
      if (Object.keys(toolInputs).length > 0) {
        // Only inject tools into the prompt if the model doesn't natively support function calling
        if (!model.startsWith('gpt-4') && !model.startsWith('claude-3')) {
          const toolsData = Object.entries(toolInputs)
            .map(([name, data]) => `Tool "${name}": ${JSON.stringify(data)}`)
            .join("\n\n");
          
          finalPrompt = `${finalPrompt}\n\nThe following tools have provided data:\n${toolsData}`;
        }
      }
      
      // If we still don't have a prompt, use a fallback
      if (!finalPrompt) {
        finalPrompt = 'Please generate a response.';
      }
      
      // Set the node to processing state (if in a UI context)
      if (typeof nodeData.setNodeState === 'function') {
        nodeData.setNodeState({ status: 'processing' });
      }
      
      // Prepare the request to the appropriate API endpoint
      const endpoint = getApiEndpoint(model);
      
      const requestBody = {
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: finalPrompt }
        ],
        model: model,
        temperature: temperature,
        max_tokens: maxTokens,
        tools: dynamicHandles.tools.length > 0 ? dynamicHandles.tools.map((tool: Tool) => ({
          name: tool.name,
          description: tool.description || `The ${tool.name} tool`
        })) : undefined,
        tool_outputs: Object.keys(toolInputs).length > 0 ? toolInputs : undefined
      };
      
      // Make the API request
      const response = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${errorText}`);
      }
      
      const result = await response.json();
      
      // Extract the generated text from the response
      let generatedText = '';
      if (result.content) {
        generatedText = result.content;
      } else if (result.choices && result.choices.length > 0) {
        generatedText = result.choices[0].message.content;
      } else if (result.completion) {
        generatedText = result.completion;
      } else if (result.text) {
        generatedText = result.text;
      } else if (typeof result === 'string') {
        generatedText = result;
      }
      
      // Set the node to completed state (if in a UI context)
      if (typeof nodeData.setNodeState === 'function') {
        nodeData.setNodeState({ status: 'complete' });
      }
      
      // Return the result using the standard format
      return createExecutionDataFromValue({
        text: generatedText,
        output: generatedText,
        fullResponse: result
      }, 'generate_text');
      
    } catch (error: any) {
      console.error(`Error executing generate text node:`, error);
      
      // Set the node to error state (if in a UI context)
      if (typeof nodeData.setNodeState === 'function') {
        nodeData.setNodeState({ 
          status: 'error', 
          errorMessage: error.message || 'Error generating text' 
        });
      }
      
      // Create error execution data
      return {
        items: [],
        meta: {
          startTime,
          endTime: new Date(),
          error: error.message || 'Error generating text',
          sourceOperation: 'generate_text'
        }
      };
    }
  }
};
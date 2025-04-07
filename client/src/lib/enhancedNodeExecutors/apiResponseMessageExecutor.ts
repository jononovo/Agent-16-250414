/**
 * API Response Message Executor
 * 
 * This node allows sending direct messages back to the chat UI from any point in a workflow.
 * Unlike the standard response message node, this one directly calls the chat API
 * to ensure the formatted message reaches the user's UI.
 */
import { apiClient } from '../apiClient';
import { EnhancedNodeExecutor, NodeExecutionData } from '../types/workflow';

export interface ApiResponseMessageSettings {
  successMessage?: string;
  errorMessage?: string;
  conditionField?: string;
  successValue?: string;
  targetEndpoint?: string; // The endpoint to send the message to
  formatOutput?: boolean; // Whether to format the output for the chat UI
  additionalData?: Record<string, any>; // Additional data to include in the response
}

/**
 * Gets a deeply nested value from an object using a dot-notation path
 */
function getValueByPath(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  
  // Handle direct property access first for performance
  if (obj[path] !== undefined) return obj[path];
  
  // Split the path by dots and traverse the object
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  
  // Special case: check for agent ID in various locations
  if (path === 'agent.id') {
    // Look in standard locations
    if (obj.agent && obj.agent.id) return obj.agent.id;
    if (obj.data && obj.data.id) return obj.data.id;
    if (obj.result && obj.result.agent && obj.result.agent.id) return obj.result.agent.id;
    if (obj.output && obj.output.agent && obj.output.agent.id) return obj.output.agent.id;
    if (obj.id) return obj.id;
    
    // Look in the fullResponse if it exists
    if (obj.fullResponse) {
      if (obj.fullResponse.agent && obj.fullResponse.agent.id) return obj.fullResponse.agent.id;
      if (obj.fullResponse.data && obj.fullResponse.data.id) return obj.fullResponse.data.id;
    }
    
    // Log for debugging
    console.log('API Response Message - Agent ID not found in:', JSON.stringify(obj));
  }
  
  return current;
}

/**
 * Replaces template variables in a string with values from an object
 */
function replaceTemplateVariables(template: string, data: any): string {
  if (!template || !template.includes('{{')) return template;
  
  // Find all template variables in format {{variableName}}
  const templateVars = template.match(/\{\{([^}]+)\}\}/g) || [];
  let result = template;
  
  for (const varTemplate of templateVars) {
    const varName = varTemplate.slice(2, -2).trim(); // Remove {{ and }}
    let replacement = '';
    
    // Try to find the value using our helper function
    const value = getValueByPath(data, varName);
    
    // Convert the value to a string if it exists
    if (value !== undefined && value !== null) {
      replacement = typeof value === 'object' 
        ? JSON.stringify(value) 
        : String(value);
    }
    
    // Replace the template variable with its value
    result = result.replace(varTemplate, replacement);
  }
  
  return result;
}

/**
 * Creates the format expected by the chat UI
 */
function formatForChatUI(message: string, isSuccess: boolean): any {
  return {
    message,
    type: isSuccess ? 'success' : 'error',
    origin: 'workflow'
  };
}

/**
 * Executor for the ApiResponseMessage node, which sends messages directly
 * to the chat UI or any specified API endpoint.
 */
export const apiResponseMessageExecutor: EnhancedNodeExecutor = {
  definition: {
    type: 'api_response_message',
    displayName: 'API Response Message',
    description: 'Sends a formatted response message directly to the chat UI or API endpoint',
    icon: 'MessageCircle',
    category: 'actions',
    version: '1.0',
    inputs: {
      default: {
        type: 'object',
        displayName: 'Input',
        description: 'The input data to check the condition against',
        required: true
      }
    },
    outputs: {
      success: {
        type: 'object',
        displayName: 'Success',
        description: 'Output when message is sent successfully'
      },
      error: {
        type: 'object',
        displayName: 'Error',
        description: 'Output when message sending fails'
      }
    }
  },
  
  async execute(
    nodeData: Record<string, any>,
    inputs: Record<string, NodeExecutionData>
  ) {
    try {
      console.log('API Response Message Node - Starting execution with inputs:', 
        JSON.stringify(inputs?.default?.items?.[0]?.json || {}, null, 2));
      
      // Get input data (use the first item if there are multiple)
      const input = inputs?.default?.items?.[0]?.json || {};
      
      // Get settings with defaults
      const settings: ApiResponseMessageSettings = nodeData?.data?.settings || {};
      const conditionField = settings.conditionField || 'result';
      const successValue = settings.successValue || 'success';
      const successMessage = settings.successMessage || 'Operation completed successfully!';
      const errorMessage = settings.errorMessage || 'Operation failed. Please try again.';
      const targetEndpoint = settings.targetEndpoint || '/api/chat';
      const formatOutput = settings.formatOutput !== false; // Default to true
      
      // Get the condition value using our helper function
      const fieldValue = getValueByPath(input, conditionField);
      
      console.log('API Response Message Node - Checking condition:', {
        conditionField,
        fieldValue,
        successValue,
        inputSnapshot: input
      });
      
      // Special case for boolean conditions - handle "true"/"false" string values
      let isSuccess = false;
      if (successValue === 'true' && (fieldValue === true || fieldValue === 'true')) {
        isSuccess = true;
      } else if (successValue === 'false' && (fieldValue === false || fieldValue === 'false')) {
        isSuccess = false;
      } else {
        // Standard comparison
        isSuccess = fieldValue !== undefined && fieldValue !== null && 
          String(fieldValue) === String(successValue);
      }
      
      // If the condition field or success value is 'true', and we don't find the field,
      // assume success (this is a common pattern in our workflows)
      if (conditionField === 'true' && successValue === 'true') {
        isSuccess = true;
      }
      
      // Select the appropriate message template
      const messageTemplate = isSuccess ? successMessage : errorMessage;
      
      // Replace all template variables with values from the input
      const message = replaceTemplateVariables(messageTemplate, input);
      
      console.log('API Response Message Node - Result:', {
        isSuccess,
        message,
        originalTemplate: messageTemplate
      });
      
      // Format the output for the chat UI if needed
      const payload = formatOutput 
        ? formatForChatUI(message, isSuccess)
        : { message, status: isSuccess ? 'success' : 'error' };
      
      // Add any additional data if specified
      if (settings.additionalData) {
        Object.assign(payload, settings.additionalData);
      }
      
      // Send the message to the target endpoint
      const response = await apiClient.post(targetEndpoint, payload);
      
      console.log('API Response Message Node - API response:', response);
      
      const result = {
        isSuccess,
        message,
        status: isSuccess ? 'success' : 'error',
        apiResponse: response,
        originalInput: input,
        conditionField,
        fieldValue,
        expectedValue: successValue
      };
      
      // Return result
      const now = new Date();
      return {
        items: [{
          json: result
        }],
        meta: {
          startTime: now,
          endTime: now,
          itemsProcessed: 1,
          sourceOperation: 'api_response_message',
          outputPath: isSuccess ? 'success' : 'error'
        }
      };
    } catch (error) {
      console.error('Error in api_response_message node execution:', error);
      
      const now = new Date();
      
      // Return error data
      return {
        items: [
          {
            json: {
              message: error instanceof Error ? error.message : String(error),
              status: 'error'
            }
          }
        ],
        meta: {
          startTime: now,
          endTime: now,
          itemsProcessed: 1,
          sourceOperation: 'api_response_message_error',
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
};

export default apiResponseMessageExecutor;
import { NodeExecutionData, createWorkflowItem } from '../types/workflow';
import type { EnhancedNodeExecutor } from '../types/workflow';

export interface ResponseMessageSettings {
  successMessage?: string;
  errorMessage?: string;
  conditionField?: string;
  successValue?: string;
}

/**
 * Searches for a value within an object with support for nested paths
 * 
 * @param obj The object to search within
 * @param path The path to the value (can be dot-separated for nested properties)
 * @returns The found value or undefined if not found
 */
function getValueByPath(obj: any, path: string): any {
  if (!obj || typeof obj !== 'object') return undefined;
  
  // Direct property lookup first
  if (obj[path] !== undefined) return obj[path];
  
  // Try nested path
  if (path.includes('.')) {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    
    return current;
  }
  
  // For flattened object structures, try to find a key that ends with the path
  // This is useful for workflow outputs where the data may be flattened
  for (const key in obj) {
    if (key.endsWith(`.${path}`) || key === path) {
      return obj[key];
    }
    
    // Look recursively in nested objects
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const result = getValueByPath(obj[key], path);
      if (result !== undefined) return result;
    }
  }
  
  // Workflow-specific: look in output field, which is commonly used for results
  if (obj.output && typeof obj.output === 'object') {
    return getValueByPath(obj.output, path);
  }
  
  // Workflow-specific: look in originalInput field for data that might have been passed in
  if (obj.originalInput && typeof obj.originalInput === 'object') {
    return getValueByPath(obj.originalInput, path);
  }
  
  // Workflow-specific: look in result field, which is commonly used for results
  if (obj.result && typeof obj.result === 'object') {
    return getValueByPath(obj.result, path);
  }
  
  // Special case: check for agent ID in workflow or API responses
  if (path === 'agent.id') {
    // Look for agent information in various locations
    if (obj.agent && obj.agent.id) {
      return obj.agent.id;
    }
    
    if (obj.data && obj.data.id) {
      return obj.data.id;
    }
    
    // Look in result.agent
    if (obj.result && obj.result.agent && obj.result.agent.id) {
      return obj.result.agent.id;
    }
    
    // Look in output.agent
    if (obj.output && obj.output.agent && obj.output.agent.id) {
      return obj.output.agent.id;
    }
    
    // Check in fullResponse if it exists
    if (obj.fullResponse) {
      if (obj.fullResponse.agent && obj.fullResponse.agent.id) {
        return obj.fullResponse.agent.id;
      }
      if (obj.fullResponse.data && obj.fullResponse.data.id) {
        return obj.fullResponse.data.id;
      }
    }
    
    // Try to find the 'id' field directly
    if (obj.id) {
      return obj.id;
    }
    
    // Log the issue for debugging
    console.log('Agent ID not found in:', JSON.stringify(obj));
  }
  
  return undefined;
}

/**
 * Replaces template variables in a string with values from an object
 * 
 * @param template The string containing template variables like {{varName}}
 * @param data The data object to extract values from
 * @returns The string with template variables replaced
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
 * Executor for the ResponseMessage node, which displays conditional success/error messages
 * based on the result of a workflow execution.
 */
export const responseMessageExecutor: EnhancedNodeExecutor = {
  definition: {
    type: 'response_message',
    displayName: 'Response Message',
    description: 'Displays conditional success/error messages based on a condition',
    icon: 'AlertCircle',
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
        description: 'Output when condition is met'
      },
      error: {
        type: 'object',
        displayName: 'Error',
        description: 'Output when condition is not met'
      }
    }
  },
  
  async execute(
    nodeData: Record<string, any>,
    inputs: Record<string, NodeExecutionData>
  ) {
    try {
      console.log('Response Message Node - Starting execution with inputs:', 
        JSON.stringify(inputs?.default?.items?.[0]?.json || {}, null, 2));
      
      // Get input data (use the first item if there are multiple)
      const input = inputs?.default?.items?.[0]?.json || {};
      
      // Get settings with defaults
      const settings: ResponseMessageSettings = nodeData?.data?.settings || {};
      const conditionField = settings.conditionField || 'result';
      const successValue = settings.successValue || 'success';
      const successMessage = settings.successMessage || 'Operation completed successfully!';
      const errorMessage = settings.errorMessage || 'Operation failed. Please try again.';
      
      // Get the condition value using our helper function
      const fieldValue = getValueByPath(input, conditionField);
      
      console.log('Response Message Node - Checking condition:', {
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
      
      // For workflow trigger nodes, we often want to default to success
      if (input.workflowId && !fieldValue && conditionField === 'result') {
        console.log('Response Message Node - Workflow trigger detected, defaulting to success');
        isSuccess = true;
      }
      
      // Select the appropriate message template
      const messageTemplate = isSuccess ? successMessage : errorMessage;
      
      // Replace all template variables with values from the input
      const message = replaceTemplateVariables(messageTemplate, input);
      
      console.log('Response Message Node - Result:', {
        isSuccess,
        message,
        originalTemplate: messageTemplate
      });
      
      const result = {
        isSuccess,
        message,
        status: isSuccess ? 'success' : 'error',
        originalInput: input,
        conditionField,
        fieldValue,
        expectedValue: successValue
      };
      
      // Return result
      const now = new Date();
      return {
        items: [createWorkflowItem(result, 'response_message')],
        meta: {
          startTime: now,
          endTime: now,
          itemsProcessed: 1,
          sourceOperation: 'response_message',
          outputPath: isSuccess ? 'success' : 'error'
        }
      };
    } catch (error) {
      console.error('Error in response_message node execution:', error);
      
      const now = new Date();
      
      // Return error data
      return {
        items: [
          createWorkflowItem({
            message: error instanceof Error ? error.message : String(error),
            status: 'error'
          }, 'response_message_error')
        ],
        meta: {
          startTime: now,
          endTime: now,
          itemsProcessed: 1,
          sourceOperation: 'response_message_error',
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
};
import { NodeExecutionData, createWorkflowItem } from '../types/workflow';
import type { EnhancedNodeExecutor } from '../types/workflow';

export interface ResponseMessageSettings {
  successMessage?: string;
  errorMessage?: string;
  conditionField?: string;
  successValue?: string;
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
      // Get input data (use the first item if there are multiple)
      const input = inputs?.default?.items?.[0]?.json || {};
      
      // Get settings with defaults
      const settings: ResponseMessageSettings = nodeData?.data?.settings || {};
      const conditionField = settings.conditionField || 'result';
      const successValue = settings.successValue || 'success';
      const successMessage = settings.successMessage || 'Operation completed successfully!';
      const errorMessage = settings.errorMessage || 'Operation failed. Please try again.';
      
      // Access nested properties using dot notation if needed
      let fieldValue;
      if (conditionField.includes('.')) {
        const parts = conditionField.split('.');
        let current = input;
        for (const part of parts) {
          if (current === null || current === undefined) break;
          current = current[part];
        }
        fieldValue = current;
      } else {
        fieldValue = input[conditionField];
      }
      
      // Determine if condition is met
      const isSuccess = fieldValue !== undefined && fieldValue !== null && 
        fieldValue.toString() === successValue.toString();
      
      // Replace template variables in message
      let message = isSuccess ? successMessage : errorMessage;
      
      // Replace template variables with values from input
      if (message && message.includes('{{')) {
        // Find all template variables in format {{variableName}}
        const templateVars = message.match(/\{\{([^}]+)\}\}/g) || [];
        
        for (const template of templateVars) {
          const varName = template.slice(2, -2).trim(); // Remove {{ and }}
          let replacement = '';
          
          // Try to find the value in input
          if (input[varName] !== undefined) {
            replacement = input[varName];
          } else if (varName.includes('.')) {
            // Handle nested properties
            const parts = varName.split('.');
            let current = input;
            for (const part of parts) {
              if (current === null || current === undefined) break;
              current = current[part];
            }
            replacement = current !== undefined ? current : '';
          }
          
          // Replace the template with the value
          message = message.replace(template, replacement);
        }
      }
      
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
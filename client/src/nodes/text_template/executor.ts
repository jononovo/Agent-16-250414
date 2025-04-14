/**
 * Text Template Node Executor
 * 
 * This file contains the execution logic for the text template node,
 * which processes templates with variable interpolation.
 */

export interface TextTemplateNodeData {
  template: string;
  escapeHTML?: boolean;
  fallbackValue?: string;
}

/**
 * Escape HTML special characters
 */
function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Replace template variables with values from the data object
 */
function replaceTemplateVariables(template: string, data: any, escapeHtml = false, fallbackValue = ''): string {
  if (!template) return '';
  if (!data) return template;
  
  // Replace {{variable}} with the value from data
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    // Trim any whitespace from the key
    const trimmedKey = key.trim();
    
    // Get the value from the data object
    const value = data[trimmedKey];
    
    // If value is undefined, return the fallback value
    if (value === undefined) return fallbackValue;
    
    // Convert to string and escape HTML if needed
    const stringValue = String(value);
    return escapeHtml ? escapeHTML(stringValue) : stringValue;
  });
}

/**
 * Execute the text template node
 * 
 * @param nodeData The node configuration data
 * @param inputs Optional inputs from connected nodes
 * @returns The execution result
 */
export const execute = async (nodeData: TextTemplateNodeData, inputs?: any): Promise<any> => {
  try {
    const startTime = new Date().toISOString();
    
    // Get the template
    const template = nodeData.template || '';
    
    // Process the template with variables
    const processedText = replaceTemplateVariables(
      template,
      inputs?.variables || {},
      nodeData.escapeHTML,
      nodeData.fallbackValue
    );
    
    const endTime = new Date().toISOString();
    return {
      meta: {
        status: 'success',
        message: 'Template processed successfully',
        startTime,
        endTime
      },
      items: [
        {
          json: {
            text: processedText
          },
          binary: null
        }
      ]
    };
  } catch (error: any) {
    return {
      meta: {
        status: 'error',
        message: error.message || 'Error processing template',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack
        }
      },
      items: [
        {
          json: {
            error: error.message
          },
          binary: null
        }
      ]
    };
  }
};
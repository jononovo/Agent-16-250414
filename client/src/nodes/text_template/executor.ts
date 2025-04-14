/**
 * Text Template Node Executor
 * 
 * This executor processes text templates with variable substitution.
 */

// Define the shape of the node's data
export interface TextTemplateNodeData {
  template: string;
}

/**
 * Replace template variables with actual values
 * Handles mustache-style {{variable}} syntax
 */
function replaceTemplateVariables(template: string, variables: Record<string, any>): string {
  if (!template) return '';
  if (!variables) return template;
  
  // Replace all {{variable}} with their values
  return template.replace(/{{([^{}]+)}}/g, (match, variableName) => {
    const trimmedName = variableName.trim();
    
    // Check if the variable exists in our variables object
    if (trimmedName in variables) {
      const value = variables[trimmedName];
      // Convert value to string if it's an object or array
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
    }
    
    // If variable doesn't exist, leave the placeholder unchanged
    return match;
  });
}

/**
 * Execute the text template node with the provided data and inputs
 */
export async function execute(nodeData: TextTemplateNodeData, inputs: Record<string, any> = {}) {
  const { template } = nodeData;
  const variables = inputs.variables || {};
  
  try {
    if (!template) {
      return {
        error: 'No template provided'
      };
    }
    
    // Process template with variable substitution
    const processedText = replaceTemplateVariables(template, variables);
    
    return {
      text: processedText
    };
  } catch (error) {
    console.error('Error executing text template:', error);
    return {
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export const defaultData: TextTemplateNodeData = {
  template: 'Hello, {{name}}!'
};
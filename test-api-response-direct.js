/**
 * Direct test for the API Response Message node
 * 
 * This script tests the API Response Message node functionality by
 * directly simulating its execution with proper inputs.
 */

// Helper functions - copied from apiResponseMessageExecutor.ts
function getValueByPath(obj, path) {
  if (!obj || !path) return undefined;
  
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  
  return current;
}

function replaceTemplateVariables(template, data) {
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

function formatForChatUI(message, isSuccess) {
  return {
    message,
    type: isSuccess ? 'success' : 'error',
    origin: 'workflow'
  };
}

async function executeApiResponseMessage(nodeData, inputs) {
  try {
    console.log('Starting API response message test...');
    
    // Log input data
    console.log('Input data:', JSON.stringify(inputs, null, 2));
    
    // Extract settings
    const settings = nodeData?.data?.settings || {};
    const conditionField = settings.conditionField || 'result';
    const successValue = settings.successValue || 'success';
    const successMessage = settings.successMessage || 'Operation completed successfully!';
    const errorMessage = settings.errorMessage || 'Operation failed. Please try again.';
    const formatOutput = settings.formatOutput !== false; // Default to true
    
    console.log('Settings:', {
      conditionField,
      successValue,
      successMessage,
      errorMessage,
      formatOutput
    });
    
    // Get the input data from the first item
    const input = inputs?.default?.items?.[0]?.json || {};
    console.log('Processed input:', JSON.stringify(input, null, 2));
    
    // Get the condition value
    const fieldValue = getValueByPath(input, conditionField);
    console.log('Field value:', fieldValue);
    
    // Determine success or error
    let isSuccess = false;
    if (successValue === 'true' && (fieldValue === true || fieldValue === 'true')) {
      isSuccess = true;
    } else if (successValue === 'false' && (fieldValue === false || fieldValue === 'false')) {
      isSuccess = false;
    } else {
      isSuccess = fieldValue !== undefined && fieldValue !== null && 
        String(fieldValue) === String(successValue);
    }
    
    if (conditionField === 'true' && successValue === 'true') {
      isSuccess = true;
    }
    
    console.log('Is success?', isSuccess);
    
    // Select the message template
    const messageTemplate = isSuccess ? successMessage : errorMessage;
    console.log('Message template:', messageTemplate);
    
    // Replace template variables
    const message = replaceTemplateVariables(messageTemplate, input);
    console.log('Final message:', message);
    
    // Format for chat UI if needed
    const payload = formatOutput 
      ? formatForChatUI(message, isSuccess)
      : { message, status: isSuccess ? 'success' : 'error' };
    
    console.log('Final payload:', JSON.stringify(payload, null, 2));
    
    return payload;
  } catch (error) {
    console.error('Error in API response message test:', error);
    throw error;
  }
}

async function testApiResponseMessageDirect() {
  // Create test node data
  const nodeData = {
    data: {
      settings: {
        errorMessage: "There was an error creating your agent.",
        formatOutput: true,
        successValue: "true",
        conditionField: "true",
        successMessage: "Your agent has been created successfully with ID: {{agent.id}}!",
        targetEndpoint: "/api/chat"
      }
    }
  };
  
  // Create test inputs with agent data
  const inputs = {
    default: {
      items: [
        {
          json: {
            agent: {
              id: 123,
              name: "Test Agent"
            }
          }
        }
      ]
    }
  };
  
  // Execute the test
  const result = await executeApiResponseMessage(nodeData, inputs);
  console.log('\nTest result:', JSON.stringify(result, null, 2));
}

// Run the test
testApiResponseMessageDirect()
  .then(() => console.log('Test completed successfully'))
  .catch(error => console.error('Test failed:', error));
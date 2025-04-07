/**
 * Test Api Response Message Node Directly
 * 
 * This script tests the API Response Message node functionality directly,
 * specifically focusing on template variable replacement.
 */

function getValueByPath(obj, path) {
  if (!path) return obj;
  
  const parts = path.split('.');
  let value = obj;
  
  for (const part of parts) {
    if (value === null || value === undefined) return undefined;
    value = value[part];
  }
  
  return value;
}

function replaceTemplateVariables(template, data) {
  if (!template) return '';
  
  // Match {{variable.path}} pattern
  const regex = /\{\{([^}]+)\}\}/g;
  
  return template.replace(regex, (match, path) => {
    const value = getValueByPath(data, path);
    return value !== undefined ? value : match;
  });
}

function formatForChatUI(message, isSuccess) {
  return {
    message,
    type: isSuccess ? 'success' : 'error'
  };
}

async function executeApiResponseMessage(nodeData, inputs) {
  console.log('Executing API Response Message with inputs:', JSON.stringify(inputs, null, 2));
  
  const settings = nodeData.settings || {};
  const conditionField = settings.conditionField || 'success';
  const successValue = settings.successValue || 'true';
  const successMessage = settings.successMessage || 'Operation completed successfully';
  const errorMessage = settings.errorMessage || 'Operation failed';
  const formatOutput = settings.formatOutput || false;
  
  // Extract condition value
  const conditionValue = getValueByPath(inputs, conditionField);
  
  // Check condition
  const isSuccess = String(conditionValue) === String(successValue);
  console.log(`Condition check: ${conditionField}=${conditionValue}, successValue=${successValue}, isSuccess=${isSuccess}`);
  
  // Select appropriate message
  const templateMessage = isSuccess ? successMessage : errorMessage;
  
  let outputMessage;
  if (formatOutput) {
    // Replace template variables
    console.log('Replacing template variables in:', templateMessage);
    console.log('With data:', JSON.stringify(inputs, null, 2));
    outputMessage = replaceTemplateVariables(templateMessage, inputs);
    console.log('After replacement:', outputMessage);
  } else {
    outputMessage = templateMessage;
    console.log('Format output disabled, using raw template:', outputMessage);
  }
  
  // Format for chat UI
  const formattedOutput = formatForChatUI(outputMessage, isSuccess);
  console.log('Final formatted output:', JSON.stringify(formattedOutput, null, 2));
  
  return formattedOutput;
}

async function testApiResponseMessageDirect() {
  console.log('=== Testing API Response Message Node Directly ===');
  
  // Mock node data similar to the one in workflow 18
  const nodeData = {
    type: 'api_response_message',
    settings: {
      errorMessage: 'There was an error creating your agent. Please check the logs and try again.',
      successValue: 'true',
      conditionField: 'success',
      successMessage: 'Your agent has been created successfully with ID: {{data.agent.id}}! You can now use it for your tasks.',
      formatOutput: true
    }
  };
  
  // Test case 1: Successful agent creation with ID
  const testInput1 = {
    success: true,
    agent: {
      id: 42,
      name: 'Test Agent',
      type: 'ai_assistant'
    }
  };
  
  // Test case 2: Input with nested data (similar to workflow execution result)
  const testInput2 = {
    success: true,
    data: {
      agent: {
        id: 43,
        name: 'Nested Test Agent',
        type: 'ai_assistant'
      }
    }
  };
  
  console.log('\n--- Test Case 1: Direct agent object ---');
  const result1 = await executeApiResponseMessage(nodeData, testInput1);
  
  console.log('\n--- Test Case 2: Nested agent object ---');
  const result2 = await executeApiResponseMessage(nodeData, testInput2);
  
  console.log('\n=== API Response Message Test Results ===');
  console.log('Test Case 1 result:', JSON.stringify(result1, null, 2));
  console.log('Test Case 2 result:', JSON.stringify(result2, null, 2));
}

testApiResponseMessageDirect();
/**
 * Test script for api_response_message node execution
 * 
 * This script demonstrates how to directly test the API Response Message node
 * by providing test input and checking its behavior.
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

async function testApiResponseMessageNode() {
  console.log('Testing API Response Message Node');
  
  // Test case 1: Workflow 18 node configuration (standard case)
  const nodeConfig1 = {
    type: 'api_response_message',
    settings: {
      errorMessage: 'There was an error creating your agent. Please check the logs and try again.',
      formatOutput: true,
      successValue: 'true',
      conditionField: 'success',
      successMessage: 'Your agent has been created successfully with ID: {{data.agent.id}}! You can now use it for your tasks.',
      targetEndpoint: '/api/chat'
    }
  };
  
  // Test case 2: Different structure (no data nesting)
  const nodeConfig2 = {
    type: 'api_response_message',
    settings: {
      errorMessage: 'Error creating agent',
      formatOutput: true,
      successValue: 'true',
      conditionField: 'success',
      successMessage: 'Agent created with ID: {{agent.id}}',
      targetEndpoint: '/api/chat'
    }
  };
  
  // Test input 1: Nested data structure (from workflow 15)
  const testInput1 = {
    success: true,
    data: {
      agent: {
        id: 1001,
        name: 'Test Agent',
        description: 'Test agent for API response message'
      }
    }
  };
  
  // Test input 2: Non-nested structure
  const testInput2 = {
    success: true,
    agent: {
      id: 1002,
      name: 'Direct Agent',
      description: 'Test agent without nesting'
    }
  };
  
  // Test input 3: Failed operation
  const testInput3 = {
    success: false,
    error: 'Database connection failed'
  };
  
  // ----- Run test case 1 with input 1 (Should work) -----
  console.log('\nTest Case 1: Nested data with nested template');
  const settings1 = nodeConfig1.settings;
  
  // Extract condition value
  const conditionField1 = settings1.conditionField || 'success';
  const successValue1 = settings1.successValue || 'true';
  const conditionValue1 = getValueByPath(testInput1, conditionField1);
  
  // Check condition
  const isSuccess1 = String(conditionValue1) === String(successValue1);
  console.log(`Condition check: ${conditionField1}=${conditionValue1}, successValue=${successValue1}, isSuccess=${isSuccess1}`);
  
  // Get message template
  const messageTemplate1 = isSuccess1 ? settings1.successMessage : settings1.errorMessage;
  console.log(`Selected template: ${messageTemplate1}`);
  
  // Apply template
  const result1 = replaceTemplateVariables(messageTemplate1, testInput1);
  console.log(`Final message: ${result1}`);
  
  // ----- Run test case 2 with input 2 (Should work) -----
  console.log('\nTest Case 2: Direct data with direct template');
  const settings2 = nodeConfig2.settings;
  
  // Extract condition value
  const conditionField2 = settings2.conditionField || 'success';
  const successValue2 = settings2.successValue || 'true';
  const conditionValue2 = getValueByPath(testInput2, conditionField2);
  
  // Check condition
  const isSuccess2 = String(conditionValue2) === String(successValue2);
  console.log(`Condition check: ${conditionField2}=${conditionValue2}, successValue=${successValue2}, isSuccess=${isSuccess2}`);
  
  // Get message template
  const messageTemplate2 = isSuccess2 ? settings2.successMessage : settings2.errorMessage;
  console.log(`Selected template: ${messageTemplate2}`);
  
  // Apply template
  const result2 = replaceTemplateVariables(messageTemplate2, testInput2);
  console.log(`Final message: ${result2}`);
  
  // ----- Run test case 3: Error case -----
  console.log('\nTest Case 3: Error condition');
  const settings3 = nodeConfig1.settings;
  
  // Extract condition value
  const conditionField3 = settings3.conditionField || 'success';
  const successValue3 = settings3.successValue || 'true';
  const conditionValue3 = getValueByPath(testInput3, conditionField3);
  
  // Check condition
  const isSuccess3 = String(conditionValue3) === String(successValue3);
  console.log(`Condition check: ${conditionField3}=${conditionValue3}, successValue=${successValue3}, isSuccess=${isSuccess3}`);
  
  // Get message template
  const messageTemplate3 = isSuccess3 ? settings3.successMessage : settings3.errorMessage;
  console.log(`Selected template: ${messageTemplate3}`);
  
  // Apply template
  const result3 = replaceTemplateVariables(messageTemplate3, testInput3);
  console.log(`Final message: ${result3}`);
  
  // ----- Run test case 4: Mismatch paths (Should show raw template) -----
  console.log('\nTest Case 4: Template path mismatch');
  
  // Input with no nested data but template expects nesting
  const testInput4 = { 
    success: true,
    agent: { id: 1004 }
  };
  
  // Apply template that expects nested structure
  const result4 = replaceTemplateVariables(settings1.successMessage, testInput4);
  console.log(`Input:`, JSON.stringify(testInput4));
  console.log(`Template: ${settings1.successMessage}`);
  console.log(`Final message: ${result4}`);
  
  // ----- Run test case 5: Use wrong variable -----
  console.log('\nTest Case 5: Wrong template variable');
  
  // Apply template with a wrong variable reference
  const wrongTemplate = 'Agent created with ID: {{wrong.path.id}}';
  const result5 = replaceTemplateVariables(wrongTemplate, testInput1);
  console.log(`Input:`, JSON.stringify(testInput1));
  console.log(`Template: ${wrongTemplate}`);
  console.log(`Final message: ${result5}`);
  
  return {
    case1: { isSuccess: isSuccess1, originalTemplate: messageTemplate1, result: result1 },
    case2: { isSuccess: isSuccess2, originalTemplate: messageTemplate2, result: result2 },
    case3: { isSuccess: isSuccess3, originalTemplate: messageTemplate3, result: result3 },
    case4: { originalTemplate: settings1.successMessage, result: result4 },
    case5: { originalTemplate: wrongTemplate, result: result5 }
  };
}

// Run the test
testApiResponseMessageNode()
  .then(results => {
    console.log('\nAll tests completed!');
    console.log('Summary:');
    console.log('- Case 1 (Nested data + nested template): ' + 
      (results.case1.result.includes('1001') ? '✅ SUCCESS' : '❌ FAILED'));
    console.log('- Case 2 (Direct data + direct template): ' + 
      (results.case2.result.includes('1002') ? '✅ SUCCESS' : '❌ FAILED'));
    console.log('- Case 3 (Error condition): ' + 
      (results.case3.result === results.case3.originalTemplate ? '✅ SUCCESS' : '❌ FAILED'));
    console.log('- Case 4 (Template mismatch): ' + 
      (results.case4.result.includes('{{data.agent.id}}') ? '✅ SUCCESS' : '❌ FAILED'));
    console.log('- Case 5 (Wrong variable): ' + 
      (results.case5.result.includes('{{wrong.path.id}}') ? '✅ SUCCESS' : '❌ FAILED'));
  })
  .catch(error => {
    console.error('Test error:', error);
  });
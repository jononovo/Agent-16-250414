/**
 * Test executing the API Response Message node via the API
 * This tests the node execution through the appropriate endpoint
 */

import fetch from 'node-fetch';

async function testApiResponseMessage() {
  try {
    console.log('Testing API Response Message node execution...');
    
    // Create test agent data
    const agentData = {
      id: 9999,
      name: "API Test Agent",
      description: "Test agent for API response message",
      type: "ai_assistant"
    };
    
    // Create input data for the node
    const nodeInput = {
      success: true,
      data: {
        agent: agentData
      }
    };
    
    // Node configuration
    const nodeConfig = {
      type: "api_response_message",
      label: "Test API Response",
      settings: {
        errorMessage: "Error: Could not process agent data",
        formatOutput: true,
        successValue: "true",
        conditionField: "success",
        successMessage: "Agent created with ID: {{data.agent.id}} and name: {{data.agent.name}}",
        targetEndpoint: "/api/chat"
      }
    };
    
    console.log('Sending request to execute-node endpoint...');
    console.log('Node input:', JSON.stringify(nodeInput, null, 2));
    console.log('Node config:', JSON.stringify(nodeConfig, null, 2));
    
    // Execute the node via the API
    const response = await fetch('http://localhost:5000/api/execute-node', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nodeType: 'api_response_message',
        nodeData: nodeConfig,
        input: nodeInput,
        metadata: {
          debug: true,
          testMode: true
        }
      })
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API returned status ${response.status}: ${text}`);
    }
    
    const result = await response.json();
    
    console.log('\n===== API RESPONSE MESSAGE EXECUTION RESULT =====');
    console.log(JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('Error testing API Response Message:', error);
    return { error: error.message };
  }
}

// Run the test
testApiResponseMessage()
  .then(result => {
    console.log('\nTest completed successfully.');
  })
  .catch(error => {
    console.error('Test failed:', error);
  });
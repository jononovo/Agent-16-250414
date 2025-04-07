/**
 * Test script for workflow 15 execution using the client-centric approach
 * This demonstrates how to use the workflowClient directly instead of making API calls
 */

import fetch from 'node-fetch';

// Simple API client for testing
const apiClient = {
  async get(url) {
    const response = await fetch(`http://localhost:5000${url}`);
    return response.json();
  },
  async post(url, data) {
    const response = await fetch(`http://localhost:5000${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};

async function testWorkflow15() {
  try {
    console.log('Starting workflow 15 test...');
    
    // Test data for agent creation
    const testAgentData = {
      name: "Test Agent " + new Date().toISOString().slice(0, 19).replace('T', ' '),
      description: "Test agent created for debugging template variables",
      type: "ai_assistant",
      status: "active",
      metadata: { debug: true }
    };
    
    // Step 1: Direct execution of workflow 15 (Build New Agent)
    console.log('Executing workflow 15 directly with test data...');
    const result15 = await apiClient.post('/api/execute-workflow/15', {
      input: testAgentData
    });
    
    console.log('\n===== WORKFLOW 15 RESULT =====');
    console.log(JSON.stringify(result15, null, 2));
    
    if (result15.output && result15.output.agent) {
      // Step 2: Manually build the input for workflow 18 (Agent Orchestrator)
      console.log('\nPreparing input for workflow 18...');
      
      const workflow18Input = {
        success: true,
        data: {
          agent: result15.output.agent
        }
      };
      
      console.log('Workflow 18 would receive:', JSON.stringify(workflow18Input, null, 2));
      
      // Step 3: Execute workflow 18 with the data from workflow 15
      console.log('\nExecuting workflow 18 with data from workflow 15...');
      const result18 = await apiClient.post('/api/execute-workflow/18', {
        input: workflow18Input
      });
      
      console.log('\n===== WORKFLOW 18 RESULT =====');
      console.log(JSON.stringify(result18, null, 2));
    } else {
      console.log('No agent data found in workflow 15 result. This is the issue!');
    }
    
    return { workflow15Result: result15 };
  } catch (error) {
    console.error('Error testing workflow:', error);
    return { error: error.message };
  }
}

// Run the test
testWorkflow15()
  .then(result => {
    console.log('\nTest completed. Final result:');
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('Test error:', error);
  });
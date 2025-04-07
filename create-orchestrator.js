/**
 * Create Orchestrator
 * 
 * This script demonstrates how to use the new client-centric workflow architecture
 * to create an agent and link a workflow to it.
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

async function createAgentWithWorkflow() {
  try {
    console.log('Starting agent creation with orchestrator workflow...');
    
    // Step 1: Prepare test data for agent creation
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const testAgentData = {
      name: `Debug Agent ${timestamp}`,
      description: "Test agent created from orchestrator script",
      type: "ai_assistant",
      icon: "brain",
      status: "active"
    };
    
    // Step 2: Execute the workflow 15 directly (Build New Agent Structure)
    console.log('\nExecuting workflow 15 (Build New Agent) with test data...');
    const result15 = await apiClient.post('/api/execute-workflow/15', {
      input: testAgentData
    });
    
    console.log('\n===== WORKFLOW 15 RESULT =====');
    console.log(JSON.stringify(result15, null, 2));
    
    if (result15.output && result15.output.agent) {
      // Step 3: Use the output from workflow 15 as input for workflow 18
      console.log('\nPreparing input for workflow 18 (Agent Orchestrator)...');
      
      const workflow18Input = {
        success: true,
        data: {
          agent: result15.output.agent
        }
      };
      
      console.log('Input for workflow 18:', JSON.stringify(workflow18Input, null, 2));
      
      // Step 4: Execute workflow 18 with the data from workflow 15
      console.log('\nExecuting workflow 18 with agent data...');
      const result18 = await apiClient.post('/api/execute-workflow/18', {
        input: workflow18Input
      });
      
      console.log('\n===== WORKFLOW 18 RESULT =====');
      console.log(JSON.stringify(result18, null, 2));
      
      // Step 5: Get logs for the execution
      if (result18.logId) {
        const log18 = await apiClient.get(`/api/logs/${result18.logId}`);
        console.log('\n===== WORKFLOW 18 LOG =====');
        console.log(JSON.stringify(log18, null, 2));
      }
      
      // Step 6: Verify the agent was created
      const agent = await apiClient.get(`/api/agents/${result15.output.agent.id}`);
      console.log('\n===== CREATED AGENT =====');
      console.log(JSON.stringify(agent, null, 2));
      
      return {
        success: true,
        agent: agent,
        workflow15Result: result15,
        workflow18Result: result18
      };
    } else {
      throw new Error('Workflow 15 did not return an agent in its output!');
    }
  } catch (error) {
    console.error('Error creating agent with orchestrator:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
createAgentWithWorkflow()
  .then(result => {
    console.log('\nWorkflow orchestration test completed.');
    console.log(`Success: ${result.success}`);
    if (result.agent) {
      console.log(`Agent ID: ${result.agent.id}`);
      console.log(`Agent Name: ${result.agent.name}`);
    }
  })
  .catch(error => {
    console.error('Workflow orchestration test failed:', error);
  });
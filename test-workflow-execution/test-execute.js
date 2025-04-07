/**
 * This script tests workflow #15 execution and API action verification
 * It runs the workflow and checks if it actually created an agent
 */

// Import axios for making HTTP requests
import axios from 'axios';
import fs from 'fs';

// Load workflow 15 data
const workflowData = JSON.parse(
  fs.readFileSync('./improved-workflow-15.json', 'utf8')
);

// Sample agent data for testing
const testAgentData = {
  name: 'Test Agent API Verification ' + new Date().toISOString(),
  description: 'Agent created for testing API verification',
  type: 'test',
  icon: 'beaker'
};

// Function to simulate workflow execution with a focus on the API node
async function testApiNodeExecution() {
  console.log('=== Testing workflow 15 execution with API verification ===');
  console.log('Test agent data:', testAgentData);
  
  try {
    // First, get the current list of agents to compare later
    console.log('Fetching initial agent list...');
    const initialAgentsResponse = await axios.get('http://localhost:5000/api/agents');
    const initialAgents = initialAgentsResponse.data;
    console.log(`Initially found ${initialAgents.length} agents`);
    
    // Step 1: Manually run the input processor node (the workflow's first transformation)
    console.log('\nStep 1: Processing input data...');
    const inputProcessor = workflowData.nodes.find(
      node => node.id === 'input_processor'
    );
    
    if (!inputProcessor || !inputProcessor.data || !inputProcessor.data.settings || !inputProcessor.data.settings.transform) {
      throw new Error('Input processor node not found or invalid');
    }
    
    // Extract and execute the transform function
    const transformFunctionBody = inputProcessor.data.settings.transform;
    const transformFn = new Function('input', transformFunctionBody);
    
    const processedInput = transformFn(testAgentData);
    console.log('Processed input:', processedInput);
    
    // Step 2: Execute the API node
    console.log('\nStep 2: Executing API call to create agent...');
    const apiNode = workflowData.nodes.find(
      node => node.id === 'api_call'
    );
    
    if (!apiNode || !apiNode.data || !apiNode.data.settings) {
      throw new Error('API node not found or invalid');
    }
    
    const apiSettings = apiNode.data.settings;
    const url = apiSettings.url;
    const method = apiSettings.method;
    
    // Execute the body script if available
    let body = processedInput;
    if (apiSettings.body) {
      const bodyFn = new Function('input', apiSettings.body);
      body = bodyFn(processedInput);
    }
    
    console.log(`Executing ${method} request to ${url}`);
    let apiResponse;
    
    // INTRODUCE A SIMULATION OF A FAILED API CALL FOR TESTING
    // Simulate a case where API reports success but doesn't actually create an agent
    const simulateFailure = true; // Set to true to test failure scenario
    
    if (simulateFailure) {
      console.log('🔶 SIMULATING API FAILURE SCENARIO (for testing)');
      // Create a fake successful API response
      apiResponse = {
        data: {
          id: 999,
          name: processedInput.name,
          description: processedInput.description,
          type: processedInput.type,
          icon: processedInput.icon,
          status: processedInput.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
    } else {
      // Execute the normal API call
      if (method === 'POST') {
        apiResponse = await axios.post('http://localhost:5000' + url, JSON.parse(body), {
          headers: apiSettings.headers || { 'Content-Type': 'application/json' }
        });
      } else {
        throw new Error(`Unsupported method ${method}`);
      }
    }
    
    // Step 3: Format the response as the workflow would
    console.log('\nStep 3: Processing API response...');
    const responseFormatter = workflowData.nodes.find(
      node => node.id === 'response_formatter'
    );
    
    if (!responseFormatter || !responseFormatter.data || !responseFormatter.data.settings || !responseFormatter.data.settings.transform) {
      throw new Error('Response formatter node not found or invalid');
    }
    
    // Extract and execute the transform function
    const responseFnBody = responseFormatter.data.settings.transform;
    const responseFn = new Function('input', responseFnBody);
    
    const formattedResponse = responseFn(apiResponse.data);
    console.log('Formatted response:', formattedResponse);
    
    // Step 4: API Verification - check if agent was actually created
    console.log('\nStep 4: Verifying if agent was actually created...');
    const verificationResponse = await axios.get('http://localhost:5000/api/agents');
    const currentAgents = verificationResponse.data;
    
    console.log(`Now found ${currentAgents.length} agents (was ${initialAgents.length})`);
    
    // Check if the number of agents increased
    const agentCreated = currentAgents.length > initialAgents.length;
    
    // Find our specific agent by name
    const createdAgent = currentAgents.find(agent => agent.name === testAgentData.name);
    
    if (createdAgent) {
      console.log('✅ VERIFICATION PASSED: Agent was successfully created!');
      console.log('Created agent:', createdAgent);
    } else {
      console.log('❌ VERIFICATION FAILED: Agent was NOT created!');
      console.log('API reported success but no agent was found');
    }
    
    // Step 5: Compare API success indication with verification results
    console.log('\nStep 5: Comparing API response success with verification results...');
    
    if (formattedResponse.success && !createdAgent) {
      console.log('⚠️ API VERIFICATION MISMATCH:');
      console.log('- API response indicated success');
      console.log('- But agent was not actually created');
      console.log('This demonstrates the need for API action verification!');
    } else if (formattedResponse.success && createdAgent) {
      console.log('✅ API VERIFICATION MATCH:');
      console.log('- API response indicated success');
      console.log('- And agent was actually created');
      console.log('The system is working correctly for this case.');
    } else if (!formattedResponse.success && !createdAgent) {
      console.log('✅ API VERIFICATION MATCH:');
      console.log('- API response indicated failure');
      console.log('- And agent was not created');
      console.log('The system correctly reported the error.');
    } else {
      console.log('⚠️ UNEXPECTED STATE:');
      console.log('- API response indicated failure');
      console.log('- But agent was actually created');
      console.log('This is an unusual edge case.');
    }
  } catch (error) {
    console.error('Error executing workflow test:', error);
    if (error.response) {
      console.error('Response error data:', error.response.data);
    }
  }
}

// Run the test
testApiNodeExecution();
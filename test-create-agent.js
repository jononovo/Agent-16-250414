/**
 * Test script to create an agent directly using workflowClient
 */
import { apiClient } from './client/src/lib/apiClient.js';

async function testCreateAgent() {
  try {
    console.log('Starting test - creating agent');
    
    // Use the API client directly to trigger the agent creation
    const result = await apiClient.post('/api/agents/12/execute', {
      prompt: 'create an agent named DirectAPIAgent',
      metadata: {
        action: 'create_agent',
        prompt: 'create an agent',
        source: 'ai_chat',
        agentType: 'ai_assistant'
      }
    });
    
    console.log('API response:', result);
    console.log('Test completed successfully');
    return result;
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Execute the test
testCreateAgent()
  .then(result => console.log('Result:', result))
  .catch(error => console.error('Error:', error));
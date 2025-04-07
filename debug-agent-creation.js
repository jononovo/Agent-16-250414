/**
 * Debug Agent Creation Script
 * 
 * This script helps debug the agent creation process by triggering
 * the workflow and adding additional logging.
 */
import { apiClient } from './client/src/lib/apiClient.js';

async function debugAgentCreation() {
  try {
    console.log('Starting agent creation debug test...');
    
    // Create a timestamp for this test
    const timestamp = new Date().toISOString();
    
    // Use the API client to trigger agent creation with the coordinator workflow
    const result = await apiClient.post('/api/user-chat-ui-main', {
      prompt: 'create a test agent for debugging',
      metadata: {
        action: 'create_agent',
        source: 'debug_script',
        agentType: 'ai_assistant',
        debug: true,
        timestamp
      }
    });
    
    console.log('\n=========== API RESPONSE ===========');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.coordinatorResult) {
      console.log('\n=========== COORDINATOR RESULT ===========');
      console.log(JSON.stringify(result.coordinatorResult, null, 2));
      
      // Check for workflow details
      if (result.coordinatorResult.output) {
        console.log('\n=========== WORKFLOW OUTPUT ===========');
        console.log(JSON.stringify(result.coordinatorResult.output, null, 2));
      }
    }
    
    // If there's a log ID, fetch the complete log for inspection
    if (result.coordinatorResult?.logId) {
      console.log(`\n=========== FETCHING LOG ${result.coordinatorResult.logId} ===========`);
      const logData = await apiClient.get(`/api/logs/${result.coordinatorResult.logId}`);
      console.log(JSON.stringify(logData, null, 2));
    }
    
    console.log('\nDebug test completed');
    return result;
  } catch (error) {
    console.error('Debug test failed:', error);
    throw error;
  }
}

// Run the debug test
debugAgentCreation()
  .then(result => console.log('Debug completed successfully'))
  .catch(error => console.error('Debug error:', error));
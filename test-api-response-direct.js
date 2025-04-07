/**
 * Direct test for API Response Message Node
 * 
 * This script tests the API Response Message node directly without mocking,
 * to demonstrate its template variable resolution and condition checking.
 */

// Import the executor
import { apiResponseMessageExecutor } from './client/src/lib/enhancedNodeExecutors/apiResponseMessageExecutor.js';

async function testApiResponseMessageDirect() {
  console.log('Direct Testing of API Response Message Node...');
  
  // Sample node configuration
  const nodeData = {
    data: {
      settings: {
        successMessage: 'Agent {{agent.id}} created successfully with {{data.workflow.id}}!',
        errorMessage: 'Failed to create agent {{agent.id}}.',
        conditionField: 'status',
        successValue: 'success',
        // Override the target endpoint to avoid actual API calls
        targetEndpoint: '/dev/null',
        formatOutput: true
      }
    }
  };
  
  // Success case input
  const successInput = {
    default: {
      items: [
        {
          json: {
            status: 'success',
            agent: {
              id: 123,
              name: 'Test Agent'
            },
            data: {
              workflow: {
                id: 456
              }
            }
          }
        }
      ]
    }
  };
  
  // Error case input
  const errorInput = {
    default: {
      items: [
        {
          json: {
            status: 'error',
            message: 'Something went wrong',
            agent: {
              id: 789
            }
          }
        }
      ]
    }
  };
  
  try {
    // Test success case
    console.log('Testing SUCCESS case with input:', JSON.stringify(successInput.default.items[0].json));
    const successResult = await apiResponseMessageExecutor.execute(nodeData, successInput);
    
    console.log('\nSUCCESS CASE RESULT:');
    console.log(JSON.stringify(successResult, null, 2));
    console.log('\nTemplate variables resolved?', 
      !successResult.items[0].json.message.includes('{{') &&
      successResult.items[0].json.message.includes('123') &&
      successResult.items[0].json.message.includes('456')
    );
    
    // Test error case
    console.log('\n\nTesting ERROR case with input:', JSON.stringify(errorInput.default.items[0].json));
    const errorResult = await apiResponseMessageExecutor.execute(nodeData, errorInput);
    
    console.log('\nERROR CASE RESULT:');
    console.log(JSON.stringify(errorResult, null, 2));
    console.log('\nTemplate variables resolved?', 
      !errorResult.items[0].json.message.includes('{{') &&
      errorResult.items[0].json.message.includes('789')
    );
    
    return 'API Response Message Node direct test completed successfully';
  } catch (error) {
    console.error('Error in direct test:', error);
    throw error;
  }
}

// Run the test
testApiResponseMessageDirect()
  .then(message => {
    console.log('\nTEST SUMMARY:', message);
  })
  .catch(error => {
    console.error('\nTEST FAILED:', error);
    process.exit(1);
  });
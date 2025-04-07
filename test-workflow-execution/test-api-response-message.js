/**
 * Test script for api_response_message node execution
 * 
 * This script demonstrates how to directly test the API Response Message node
 * by providing test input and checking its behavior.
 */

const { apiResponseMessageExecutor } = require('../client/src/lib/enhancedNodeExecutors/apiResponseMessageExecutor');

// Mock the API client to avoid actual API calls during testing
jest.mock('../client/src/lib/apiClient', () => ({
  apiClient: {
    post: jest.fn().mockResolvedValue({ status: 200, data: { success: true } })
  }
}));

async function testApiResponseMessageNode() {
  console.log('Testing API Response Message Node...');
  
  // Test case 1: Success message with template variables
  const nodeData = {
    data: {
      settings: {
        successMessage: 'Agent {{agent.id}} created successfully!',
        errorMessage: 'Failed to create agent.',
        conditionField: 'status',
        successValue: 'success',
        targetEndpoint: '/api/chat',
        formatOutput: true
      }
    }
  };
  
  // Input data with agent information
  const inputs = {
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
  
  try {
    // Execute the node
    const result = await apiResponseMessageExecutor.execute(nodeData, inputs);
    
    console.log('API Response Message Test Result:');
    console.log(JSON.stringify(result, null, 2));
    
    // Test case 2: Error message when condition is not met
    const errorInputs = {
      default: {
        items: [
          {
            json: {
              status: 'error',
              message: 'Something went wrong',
              agent: {
                id: 123
              }
            }
          }
        ]
      }
    };
    
    const errorResult = await apiResponseMessageExecutor.execute(nodeData, errorInputs);
    console.log('API Response Message Error Test Result:');
    console.log(JSON.stringify(errorResult, null, 2));
    
    return {
      success: true,
      message: 'API Response Message Node test completed successfully'
    };
  } catch (error) {
    console.error('Error testing API Response Message node:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testApiResponseMessageNode()
    .then(result => {
      console.log('Test completed:', result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testApiResponseMessageNode };
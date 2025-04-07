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
    
    // Step 1: Prepare data for product data agent creation
    const productAgentData = {
      name: "Product Data Agent",
      description: "Manages product information and inventory for an online store",
      type: "custom",
      icon: "shopping-bag",
      status: "active",
      configuration: {
        capabilities: [
          "Product information retrieval",
          "Inventory management",
          "Product recommendations",
          "Data analysis"
        ],
        integrations: ["Ecommerce platforms", "Inventory systems"]
      }
    };
    
    // Step 2: Execute the workflow 15 directly (Build New Agent Structure)
    console.log('\nExecuting workflow 15 (Build New Agent) with product agent data...');
    const result15 = await apiClient.post('/api/execute-workflow/15', {
      input: productAgentData
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

// Create a workflow for the product data agent
async function createProductDataWorkflow(agentId) {
  try {
    console.log(`\nCreating workflow for Product Data Agent (ID: ${agentId})...`);
    
    // Create a new workflow
    const workflow = await apiClient.post('/api/workflows', {
      name: "Product Data Management Workflow",
      description: "Handles product information, inventory, and recommendations",
      type: "custom",
      icon: "database",
      status: "active",
      agentId: agentId,
      flowData: {
        nodes: [
          {
            id: "1",
            type: "trigger",
            position: { x: 100, y: 200 },
            data: {
              type: "trigger",
              label: "Product Query Trigger",
              inputText: ""
            }
          },
          {
            id: "2",
            type: "data_transform",
            position: { x: 300, y: 200 },
            data: {
              type: "data_transform",
              label: "Extract Product Query",
              transformFunction: `
                function transform(input) {
                  // Extract the product query from the input
                  const query = input.message || '';
                  const productId = query.match(/product(?:\\s+)?id[:\\s]*(\\d+)/i);
                  
                  return {
                    success: true,
                    productQuery: query,
                    productId: productId ? productId[1] : null,
                    requestType: query.toLowerCase().includes('inventory') ? 'inventory' : 
                                 query.toLowerCase().includes('recommend') ? 'recommendations' : 'info'
                  };
                }
              `
            }
          },
          {
            id: "3",
            type: "api_request",
            position: { x: 550, y: 200 },
            data: {
              type: "api_request",
              label: "Fetch Product Data",
              icon: "Database",
              settings: {
                endpoint: "/api/products",
                method: "GET",
                headers: {},
                queryParams: {
                  id: "{{productId}}",
                  type: "{{requestType}}"
                },
                requestBody: {}
              }
            }
          },
          {
            id: "4",
            type: "data_transform",
            position: { x: 800, y: 200 },
            data: {
              type: "data_transform",
              label: "Format Product Data",
              transformFunction: `
                function transform(input) {
                  // If API error occurred
                  if (!input.success || !input.data) {
                    return {
                      success: false,
                      error: input.error || 'Failed to retrieve product data'
                    };
                  }
                  
                  // Format the data based on request type
                  const productData = input.data;
                  let formattedResponse = "";
                  
                  if (input.requestType === 'inventory') {
                    formattedResponse = \`
                      Product: \${productData.name}
                      Current Stock: \${productData.stock || 'Unknown'}
                      Status: \${productData.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      Last Updated: \${productData.updatedAt || 'Unknown'}
                    \`;
                  } else if (input.requestType === 'recommendations') {
                    const recommendations = productData.recommendations || [];
                    formattedResponse = \`
                      Based on \${productData.name}, we recommend:
                      \${recommendations.map(rec => \`- \${rec.name}: \${rec.description}\`).join('\\n')}
                    \`;
                  } else {
                    // Default info response
                    formattedResponse = \`
                      Product: \${productData.name}
                      Price: \${productData.price || 'Unknown'}
                      Category: \${productData.category || 'Uncategorized'}
                      Description: \${productData.description || 'No description available'}
                    \`;
                  }
                  
                  return {
                    success: true,
                    formattedData: formattedResponse,
                    productData: productData,
                    requestType: input.requestType
                  };
                }
              `
            }
          },
          {
            id: "5",
            type: "api_response_message",
            position: { x: 1050, y: 200 },
            data: {
              type: "api_response_message",
              label: "Product Data Response",
              icon: "Package",
              settings: {
                successMessage: "{{formattedData}}",
                errorMessage: "Sorry, I couldn't find that product information. Error: {{error}}",
                formatOutput: true,
                conditionField: "success",
                successValue: "true",
                targetEndpoint: "/api/chat"
              }
            }
          }
        ],
        edges: [
          {
            id: "e1-2",
            source: "1",
            target: "2"
          },
          {
            id: "e2-3",
            source: "2",
            target: "3"
          },
          {
            id: "e3-4",
            source: "3",
            target: "4"
          },
          {
            id: "e4-5",
            source: "4",
            target: "5"
          }
        ]
      }
    });
    
    console.log("\n===== CREATED WORKFLOW =====");
    console.log(JSON.stringify(workflow, null, 2));
    
    return workflow;
  } catch (error) {
    console.error('Error creating product data workflow:', error);
    return null;
  }
}

// Run the agent creation and then create a workflow
createAgentWithWorkflow()
  .then(async (result) => {
    console.log('\nWorkflow orchestration test completed.');
    console.log(`Success: ${result.success}`);
    if (result.agent) {
      console.log(`Agent ID: ${result.agent.id}`);
      console.log(`Agent Name: ${result.agent.name}`);
      
      // Create a workflow for the new agent
      const workflowResult = await createProductDataWorkflow(result.agent.id);
      
      if (workflowResult) {
        console.log(`\nCreated workflow: ${workflowResult.name} (ID: ${workflowResult.id})`);
        console.log(`Linked to agent: ${result.agent.name} (ID: ${result.agent.id})`);
      }
    }
  })
  .catch(error => {
    console.error('Workflow orchestration test failed:', error);
  });
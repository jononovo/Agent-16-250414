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

async function createCoordinatorAgent() {
  try {
    console.log('Creating new Coordinator Agent...');
    
    // Step 1: Prepare data for coordinator agent creation
    const coordinatorAgentData = {
      name: "Tool Orchestrator Agent",
      description: "Analyzes user intent and routes requests to appropriate specialized tools",
      type: "orchestrator",
      icon: "git-branch",
      status: "active",
      configuration: {
        capabilities: [
          "Intent detection",
          "Request routing",
          "Tool management",
          "Response formatting"
        ],
        tools: [
          {
            id: "product_data",
            name: "Product Data Tool",
            description: "Retrieves and manages product information",
            workflowId: null  // Will be populated after workflow creation
          },
          {
            id: "inventory_check",
            name: "Inventory Tool",
            description: "Checks stock levels and inventory status",
            workflowId: null  // Will be populated after workflow creation
          }
        ]
      }
    };
    
    // Step 2: Create the coordinator agent
    console.log('\nCreating Coordinator Agent...');
    const coordinatorAgent = await apiClient.post('/api/agents', coordinatorAgentData);
    
    console.log('\n===== CREATED COORDINATOR AGENT =====');
    console.log(JSON.stringify(coordinatorAgent, null, 2));
    
    return coordinatorAgent;
  } catch (error) {
    console.error('Error creating coordinator agent:', error);
    throw error;
  }
}

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

// Create a workflow for the coordinator agent with tool-based orchestration
async function createCoordinatorWorkflow(agentId, linkedAgentId, linkedWorkflowId) {
  try {
    console.log(`\nCreating workflow for Tool Orchestrator Agent (ID: ${agentId})...`);
    
    // Create a new workflow with Generate Text Node structure
    const workflow = await apiClient.post('/api/workflows', {
      name: "Tool Orchestration Workflow",
      description: "Analyzes user intent and routes to appropriate specialized tools",
      type: "orchestrator",
      icon: "git-branch",
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
              label: "User Request Trigger",
              inputText: ""
            }
          },
          {
            id: "2",
            type: "data_transform",
            position: { x: 350, y: 200 },
            data: {
              type: "data_transform",
              label: "Extract User Intent",
              transformFunction: `
                function transform(input) {
                  // Get user message
                  const message = input.message || '';
                  
                  // Determine intent based on keywords
                  let intent = 'unknown';
                  let confidence = 0.5;
                  
                  // Product data intent detection
                  if (message.toLowerCase().includes('product') || 
                      message.toLowerCase().includes('item') ||
                      message.toLowerCase().includes('price') ||
                      message.toLowerCase().includes('information')) {
                    intent = 'product_data';
                    confidence = 0.8;
                  }
                  
                  // Inventory intent detection
                  if (message.toLowerCase().includes('inventory') || 
                      message.toLowerCase().includes('stock') ||
                      message.toLowerCase().includes('available')) {
                    intent = 'inventory_check';
                    confidence = 0.9;
                  }
                  
                  return {
                    success: true,
                    message: message,
                    intent: intent,
                    confidence: confidence,
                    originalInput: input
                  };
                }
              `
            }
          },
          {
            id: "3",
            type: "conditional",
            position: { x: 600, y: 200 },
            data: {
              type: "conditional",
              label: "Route by Intent",
              settings: {
                condition: "{{intent}}",
                cases: [
                  { value: "product_data", label: "Product Data" },
                  { value: "inventory_check", label: "Inventory Check" },
                  { value: "unknown", label: "Unknown Intent" }
                ]
              }
            }
          },
          {
            id: "4",
            type: "workflow_trigger",
            position: { x: 850, y: 100 },
            data: {
              type: "workflow_trigger",
              label: "Product Data Workflow",
              workflowId: linkedWorkflowId,
              executeMode: "parallel",
              triggerType: "workflow"
            }
          },
          {
            id: "5",
            type: "workflow_trigger",
            position: { x: 850, y: 200 },
            data: {
              type: "workflow_trigger",
              label: "Inventory Check Workflow",
              workflowId: linkedWorkflowId,  // Using same workflow for demo
              executeMode: "parallel",
              triggerType: "workflow"
            }
          },
          {
            id: "6",
            type: "api_response_message",
            position: { x: 850, y: 300 },
            data: {
              type: "api_response_message",
              label: "Unknown Intent Response",
              icon: "HelpCircle",
              settings: {
                successMessage: "I'm not sure how to help with that request. Could you try asking about products or inventory?",
                errorMessage: "I'm having trouble understanding your request. Please try again.",
                formatOutput: true,
                conditionField: "success",
                successValue: "true",
                targetEndpoint: "/api/chat"
              }
            }
          },
          {
            id: "7",
            type: "api_response_message",
            position: { x: 1100, y: 200 },
            data: {
              type: "api_response_message",
              label: "Final Response",
              icon: "MessageCircle",
              settings: {
                successMessage: "{{formattedData}}",
                errorMessage: "I encountered an issue processing your request. Please try again.",
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
            target: "4",
            data: {
              label: "product_data"
            }
          },
          {
            id: "e3-5",
            source: "3",
            target: "5",
            data: {
              label: "inventory_check"
            }
          },
          {
            id: "e3-6",
            source: "3",
            target: "6",
            data: {
              label: "unknown"
            }
          },
          {
            id: "e4-7",
            source: "4",
            target: "7"
          },
          {
            id: "e5-7",
            source: "5",
            target: "7"
          }
        ]
      }
    });
    
    console.log("\n===== CREATED COORDINATOR WORKFLOW =====");
    console.log(JSON.stringify(workflow, null, 2));
    
    return workflow;
  } catch (error) {
    console.error('Error creating coordinator workflow:', error);
    return null;
  }
}

// Create a complete orchestration system with coordinator and specialized agents
async function createOrchestrationSystem() {
  try {
    // Step 1: Create the Product Data Agent first
    const productResult = await createAgentWithWorkflow();
    
    if (!productResult.success || !productResult.agent) {
      throw new Error('Failed to create Product Data Agent');
    }
    
    const productAgent = productResult.agent;
    console.log(`\nCreated Product Data Agent: ${productAgent.name} (ID: ${productAgent.id})`);
    
    // Step 2: Create a workflow for Product Data Agent
    const productWorkflow = await createProductDataWorkflow(productAgent.id);
    
    if (!productWorkflow) {
      throw new Error('Failed to create Product Data Workflow');
    }
    
    console.log(`\nCreated Product Data Workflow: ${productWorkflow.name} (ID: ${productWorkflow.id})`);
    
    // Step 3: Create the Tool Orchestrator Agent
    const coordinatorAgent = await createCoordinatorAgent();
    
    if (!coordinatorAgent) {
      throw new Error('Failed to create Tool Orchestrator Agent');
    }
    
    console.log(`\nCreated Tool Orchestrator Agent: ${coordinatorAgent.name} (ID: ${coordinatorAgent.id})`);
    
    // Step 4: Create a workflow for the Tool Orchestrator Agent
    const coordinatorWorkflow = await createCoordinatorWorkflow(
      coordinatorAgent.id, 
      productAgent.id,
      productWorkflow.id
    );
    
    if (!coordinatorWorkflow) {
      throw new Error('Failed to create Tool Orchestration Workflow');
    }
    
    console.log(`\nCreated Tool Orchestration Workflow: ${coordinatorWorkflow.name} (ID: ${coordinatorWorkflow.id})`);
    
    // Step 5: Update the coordinator agent configuration to link to product agent's workflow
    const updatedCoordinatorAgent = await apiClient.post(`/api/agents/${coordinatorAgent.id}`, {
      configuration: {
        capabilities: [
          "Intent detection",
          "Request routing",
          "Tool management",
          "Response formatting"
        ],
        tools: [
          {
            id: "product_data",
            name: "Product Data Tool",
            description: "Retrieves and manages product information",
            workflowId: productWorkflow.id
          },
          {
            id: "inventory_check",
            name: "Inventory Tool",
            description: "Checks stock levels and inventory status",
            workflowId: productWorkflow.id  // Using same workflow for now
          }
        ]
      }
    });
    
    // Also update the coordinator workflow to properly link to the product workflow
    await apiClient.post(`/api/workflows/${coordinatorWorkflow.id}`, {
      flowData: {
        ...coordinatorWorkflow.flowData,
        nodes: coordinatorWorkflow.flowData.nodes.map(node => {
          if (node.id === "4" || node.id === "5") {
            return {
              ...node,
              data: {
                ...node.data,
                workflowId: productWorkflow.id
              }
            };
          }
          return node;
        })
      }
    });
    
    console.log("\n===== ORCHESTRATION SYSTEM CREATED =====");
    console.log(`Orchestrator Agent: ${coordinatorAgent.name} (ID: ${coordinatorAgent.id})`);
    console.log(`Orchestrator Workflow: ${coordinatorWorkflow.name} (ID: ${coordinatorWorkflow.id})`);
    console.log(`Product Data Agent: ${productAgent.name} (ID: ${productAgent.id})`);
    console.log(`Product Data Workflow: ${productWorkflow.name} (ID: ${productWorkflow.id})`);
    
    return {
      success: true,
      coordinatorAgent,
      coordinatorWorkflow,
      productAgent,
      productWorkflow
    };
  } catch (error) {
    console.error('Error creating orchestration system:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the orchestration system creation
createOrchestrationSystem()
  .then(result => {
    console.log('\nOrchestration system creation completed!');
    console.log(`Success: ${result.success}`);
    if (!result.success) {
      console.error(`Error: ${result.error}`);
    }
  })
  .catch(error => {
    console.error('Orchestration system creation failed:', error);
  });
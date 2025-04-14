/**
 * Test Node System
 * 
 * This file demonstrates how to use the new node system architecture.
 * It shows how to access node information and execute nodes.
 */
import { getAllNodes, createNodeInstance } from './lib/nodeRegistry';
import { executeSimpleWorkflow } from './lib/nodeExecution';

/**
 * This function demonstrates the usage of the node registry system
 */
export async function testNodeSystem() {
  console.log('Testing Node System...');
  
  // Get all registered nodes
  const nodes = getAllNodes();
  console.log(`Found ${nodes.length} registered nodes:`);
  
  // Display information about each node
  nodes.forEach(node => {
    console.log(`- ${node.type}: ${node.metadata.name} (${node.metadata.category})`);
    console.log(`  Description: ${node.metadata.description}`);
    console.log('  Inputs:', Object.keys(node.schema.inputs));
    console.log('  Outputs:', Object.keys(node.schema.outputs));
    console.log('');
  });
  
  // Create instances of our nodes for a test workflow
  const textInputData = createNodeInstance('text_input');
  textInputData.inputText = "Hello, Claude! How are you today?";
  
  const claudeData = createNodeInstance('claude');
  claudeData.model = "claude-3-sonnet-20240229";
  claudeData.temperature = 0.7;
  claudeData.maxTokens = 500;
  claudeData.systemPrompt = "You are a helpful assistant. Keep responses brief and to the point.";
  
  // Define a simple workflow with these nodes
  const workflow = {
    nodes: [
      { id: 'node1', type: 'text_input', data: textInputData },
      { id: 'node2', type: 'claude', data: claudeData }
    ],
    edges: [
      { id: 'edge1', source: 'node1', sourceHandle: 'text', target: 'node2', targetHandle: 'prompt' }
    ]
  };
  
  console.log('Executing test workflow...');
  
  try {
    // Execute the workflow
    const results = await executeSimpleWorkflow(workflow.nodes, workflow.edges);
    
    // Display the results
    console.log('Workflow execution completed!');
    Object.entries(results).forEach(([nodeId, result]) => {
      console.log(`\nNode ${nodeId} (${workflow.nodes.find(n => n.id === nodeId)?.type}):`);
      console.log('Status:', result.meta.status);
      
      if (result.meta.status === 'error') {
        console.log('Error:', result.meta.message);
      } else if (result.items.length > 0) {
        console.log('Output:', JSON.stringify(result.items[0].json, null, 2));
      } else {
        console.log('No output items');
      }
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
  }
}

// Uncomment to run the test
// testNodeSystem();

export default { testNodeSystem };
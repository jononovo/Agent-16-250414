/**
 * Test Node System
 * 
 * This file demonstrates how to use the new node system architecture.
 * It shows how to access node information and execute nodes.
 */

import { 
  getAllNodes, 
  getAllCategories, 
  getNodesInCategory, 
  getNodeByType 
} from './nodes/registry';
import { executeNode } from './lib/nodeExecution';

/**
 * This function demonstrates the usage of the node registry system
 */
export async function testNodeSystem() {
  console.log('🔍 Testing Node System...');
  
  // Get all registered nodes
  const allNodes = getAllNodes();
  console.log(`Found ${allNodes.length} registered nodes:`);
  allNodes.forEach(node => {
    console.log(`- ${node.type}: ${node.metadata.name} (${node.metadata.category})`);
  });
  
  // Get all categories
  const categories = getAllCategories();
  console.log(`\nNode categories: ${categories.join(', ')}`);
  
  // Get nodes by category
  for (const category of categories) {
    const nodesInCategory = getNodesInCategory(category);
    console.log(`\nNodes in category '${category}':`);
    nodesInCategory.forEach(node => {
      console.log(`- ${node.metadata.name} (${node.type})`);
    });
  }
  
  // Get specific node details
  const textInputNode = getNodeByType('text_input');
  if (textInputNode) {
    console.log('\nText Input Node Details:');
    console.log('- Name:', textInputNode.metadata.name);
    console.log('- Description:', textInputNode.metadata.description);
    console.log('- Inputs:', Object.keys(textInputNode.schema.inputs));
    console.log('- Outputs:', Object.keys(textInputNode.schema.outputs));
    console.log('- Parameters:', Object.keys(textInputNode.schema.parameters));
  }
  
  // Execute a text input node
  console.log('\n🚀 Executing Text Input Node...');
  try {
    const result = await executeNode('text_input', { inputText: 'Hello, World!' });
    console.log('Execution Result:', result);
  } catch (err: any) {
    console.error('Execution Error:', err.message);
  }
  
  // Execute a Claude node with mock response
  console.log('\n🚀 Executing Claude Node...');
  try {
    const claudeResult = await executeNode('claude', { 
      prompt: 'Tell me a short joke',
      model: 'claude-3-haiku-20240307',
      temperature: 0.7,
      maxTokens: 250
    });
    console.log('Claude Execution Result:', claudeResult.meta);
    if (claudeResult.items.length > 0) {
      console.log('Claude Response:', claudeResult.items[0].json.response);
    }
  } catch (err: any) {
    console.error('Claude Execution Error:', err.message);
  }
  
  console.log('\n✅ Node System Test Complete');
}
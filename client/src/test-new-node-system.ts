/**
 * Test New Node System
 * 
 * This file tests the new folder-based node architecture.
 */

import registry, { 
  getAllNodes, 
  getNode, 
  getNodesByCategory, 
  getNodeCategories 
} from './nodes/registry';

/**
 * Test the new node registry and structure
 */
export async function testNewNodeSystem() {
  console.log('--- Testing New Node System ---');
  
  // Test 1: Verify all nodes are properly registered
  console.log('\n1. Registered Nodes:');
  const allNodes = getAllNodes();
  console.log(`Found ${allNodes.length} registered nodes`);
  
  allNodes.forEach(node => {
    console.log(`- ${node.metadata.name} (${node.type}): ${node.metadata.description}`);
  });
  
  // Test 2: Check node categories
  console.log('\n2. Node Categories:');
  const categories = getNodeCategories();
  console.log(`Found ${categories.length} categories: ${categories.join(', ')}`);
  
  // Test 3: Group nodes by category
  console.log('\n3. Nodes by Category:');
  const nodesByCategory = getNodesByCategory();
  
  for (const category in nodesByCategory) {
    const nodesInCategory = nodesByCategory[category];
    console.log(`\nCategory: ${category} (${nodesInCategory.length} nodes)`);
    
    nodesInCategory.forEach(node => {
      console.log(`  - ${node.metadata.name}`);
    });
  }
  
  // Test 4: Test node execution
  console.log('\n4. Node Execution Test:');
  
  // Test TextInputNode
  const textInputNode = getNode('text_input');
  if (textInputNode) {
    console.log('Testing Text Input Node:');
    const textInputResult = await textInputNode.executor.execute({ text: 'Hello, World!' });
    console.log(' - Result:', textInputResult);
  }
  
  // Test TextTemplateNode
  const textTemplateNode = getNode('text_template');
  if (textTemplateNode) {
    console.log('\nTesting Text Template Node:');
    const templateResult = await textTemplateNode.executor.execute(
      { template: 'Hello, {{name}}!' },
      { variables: { name: 'New Node System' } }
    );
    console.log(' - Result:', templateResult);
  }
  
  // Test DecisionNode
  const decisionNode = getNode('decision');
  if (decisionNode) {
    console.log('\nTesting Decision Node:');
    const trueResult = await decisionNode.executor.execute(
      { condition: 'value > 5' },
      { value: 10 }
    );
    console.log(' - True condition result:', trueResult);
    
    const falseResult = await decisionNode.executor.execute(
      { condition: 'value > 5' },
      { value: 3 }
    );
    console.log(' - False condition result:', falseResult);
  }
  
  // Test JSONPathNode
  const jsonPathNode = getNode('json_path');
  if (jsonPathNode) {
    console.log('\nTesting JSONPath Node:');
    const jsonPathResult = await jsonPathNode.executor.execute(
      { path: '$.user.name' },
      { data: { user: { name: 'John', age: 30 }, role: 'admin' } }
    );
    console.log(' - Result:', jsonPathResult);
  }
  
  console.log('\n--- Node System Test Complete ---');
}
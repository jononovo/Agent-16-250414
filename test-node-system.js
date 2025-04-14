/**
 * Test Node System Demo
 * 
 * This script serves as an entry point to test the new node system implementation.
 * It provides a CLI interface to verify that the node registry and execution works.
 */

// Use ES modules syntax instead of CommonJS
import { nodeRegistry } from './client/src/nodes/registry.js';
import textInputNode from './client/src/nodes/text_input/index.js';
import claudeNode from './client/src/nodes/claude/index.js';

async function testNewNodeSystem() {
  console.log('=== Testing New Node System ===\n');
  
  // Register our nodes
  console.log('Registered Nodes:');
  
  // Display text_input node info
  console.log(`\n1. ${textInputNode.type} - ${textInputNode.metadata.name}`);
  console.log(`   Category: ${textInputNode.metadata.category}`);
  console.log(`   Description: ${textInputNode.metadata.description}`);
  console.log(`   Inputs: ${Object.keys(textInputNode.schema.inputs).join(', ') || 'None'}`);
  console.log(`   Outputs: ${Object.keys(textInputNode.schema.outputs).join(', ')}`);
  
  // Display claude node info
  console.log(`\n2. ${claudeNode.type} - ${claudeNode.metadata.name}`);
  console.log(`   Category: ${claudeNode.metadata.category}`);
  console.log(`   Description: ${claudeNode.metadata.description}`);
  console.log(`   Inputs: ${Object.keys(claudeNode.schema.inputs).join(', ')}`);
  console.log(`   Outputs: ${Object.keys(claudeNode.schema.outputs).join(', ')}`);
  
  // Execute the text_input node
  console.log('\n=== Executing Nodes ===');
  
  console.log('\nExecuting text_input node:');
  const textInputData = {
    inputText: "Hello, world!"
  };
  try {
    const textInputResult = await textInputNode.executor.execute(textInputData);
    console.log('Result:', JSON.stringify(textInputResult.items[0].json, null, 2));
  } catch (error) {
    console.error('Error executing text_input node:', error);
  }
  
  console.log('\nExecuting claude node:');
  const claudeData = {
    prompt: "What's the capital of France?",
    model: "claude-3-haiku-20240307",
    temperature: 0.7
  };
  try {
    const claudeResult = await claudeNode.executor.execute(claudeData);
    console.log('Result:', JSON.stringify(claudeResult.items[0].json, null, 2));
  } catch (error) {
    console.error('Error executing claude node:', error);
  }
  
  console.log('\n=== Test Complete ===');
}

// Run the test
testNewNodeSystem().catch(console.error);
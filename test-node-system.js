/**
 * Test Node System Demo
 * 
 * This script serves as an entry point to test the new node system implementation.
 * It provides a CLI interface to verify that the node registry and execution works.
 */

// Import our nodes for testing
import textInputNode from './client/src/nodes/text_input/index.js';
import claudeNode from './client/src/nodes/claude/index.js';
import textTemplateNode from './client/src/nodes/text_template/index.js';
import decisionNode from './client/src/nodes/decision/index.js';
import dataTransformNode from './client/src/nodes/data_transform/index.js';

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
  
  // Display text_template node info
  console.log(`\n3. ${textTemplateNode.type} - ${textTemplateNode.metadata.name}`);
  console.log(`   Category: ${textTemplateNode.metadata.category}`);
  console.log(`   Description: ${textTemplateNode.metadata.description}`);
  console.log(`   Inputs: ${Object.keys(textTemplateNode.schema.inputs).join(', ')}`);
  console.log(`   Outputs: ${Object.keys(textTemplateNode.schema.outputs).join(', ')}`);
  
  // Display decision node info
  console.log(`\n4. ${decisionNode.type} - ${decisionNode.metadata.name}`);
  console.log(`   Category: ${decisionNode.metadata.category}`);
  console.log(`   Description: ${decisionNode.metadata.description}`);
  console.log(`   Inputs: ${Object.keys(decisionNode.schema.inputs).join(', ')}`);
  console.log(`   Outputs: ${Object.keys(decisionNode.schema.outputs).join(', ')}`);
  
  // Execute nodes
  console.log('\n=== Executing Nodes ===');
  
  // Test Text Template Node
  console.log('\nExecuting text_template node:');
  const templateData = { 
    template: 'Hello, {{name}}! Welcome to our {{service}}.' 
  };
  const templateInputs = { 
    variables: { 
      name: 'User', 
      service: 'AI workflow system' 
    } 
  };
  
  console.log('Input data:', JSON.stringify(templateData));
  console.log('Input variables:', JSON.stringify(templateInputs));
  
  try {
    const templateResult = await textTemplateNode.executor.execute(templateData, templateInputs);
    console.log('Result:', JSON.stringify(templateResult, null, 2));
    
    // Store result for next node
    const generatedText = templateResult.text;
    
    // Test Decision Node with the template result
    console.log('\nExecuting decision node:');
    const decisionData = {
      conditions: [
        {
          field: 'text',
          operator: 'contains',
          value: 'workflow',
          outputPath: 'workflow_path'
        },
        {
          field: 'text',
          operator: 'contains', 
          value: 'system',
          outputPath: 'system_path'
        }
      ],
      defaultPath: 'default_path'
    };
    
    const decisionInputs = { text: generatedText };
    console.log('Input data:', JSON.stringify(decisionData));
    console.log('Input text:', JSON.stringify(decisionInputs));
    
    try {
      const decisionResult = await decisionNode.executor.execute(decisionData, decisionInputs);
      console.log('Result:', JSON.stringify(decisionResult, null, 2));
      
      // Test Data Transform Node
      console.log('\nExecuting data_transform node:');
      const transformData = {
        mode: 'custom',
        transformation: `
          return {
            original: data.text,
            words: data.text.split(' '),
            wordCount: data.text.split(' ').length,
            characters: data.text.length
          };
        `
      };
      
      const transformInputs = { data: { text: generatedText } };
      console.log('Input data:', JSON.stringify(transformData));
      console.log('Input variables:', JSON.stringify(transformInputs));
      
      try {
        const transformResult = await dataTransformNode.executor.execute(transformData, transformInputs);
        console.log('Result:', JSON.stringify(transformResult, null, 2));
      } catch (error) {
        console.error('Error executing data_transform node:', error);
      }
      
    } catch (error) {
      console.error('Error executing decision node:', error);
    }
    
  } catch (error) {
    console.error('Error executing text_template node:', error);
  }
  
  console.log('\n=== Test Complete ===');
}

// Run the test
testNewNodeSystem().catch(console.error);
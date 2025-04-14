/**
 * Test Workflow Node Execution
 * 
 * This script tests a simple workflow with several connected nodes
 * to verify that our node system is functioning correctly.
 */

const { executeNode } = require('./client/src/lib/nodeExecution');

async function testWorkflowExecution() {
  console.log('Starting workflow execution test...');
  
  try {
    // Step 1: Create input text using Text Template node
    console.log('\n--- Step 1: Text Template Node ---');
    const textTemplateResult = await executeNode('text_template', {
      template: 'Hello, {{name}}! Welcome to our {{service}} service.'
    }, {
      variables: {
        name: 'User',
        service: 'workflow'
      }
    });
    
    console.log('Text Template Output:', textTemplateResult);
    
    if (!textTemplateResult.text) {
      throw new Error('Text template failed to generate output');
    }
    
    // Step 2: Make a decision based on the text
    console.log('\n--- Step 2: Decision Node ---');
    const decisionResult = await executeNode('decision', {
      conditions: [
        {
          field: 'text',
          operator: 'contains',
          value: 'workflow',
          outputPath: 'workflow'
        },
        {
          field: 'text',
          operator: 'contains',
          value: 'product',
          outputPath: 'product'
        }
      ],
      defaultPath: 'default'
    }, {
      text: textTemplateResult.text
    });
    
    console.log('Decision Output:', decisionResult);
    
    // Step 3: Transform the data
    console.log('\n--- Step 3: Data Transform Node ---');
    const transformResult = await executeNode('data_transform', {
      mode: 'custom',
      transformation: 'return { message: data.text, length: data.text.length, tokens: data.text.split(" ") };'
    }, {
      data: { text: textTemplateResult.text }
    });
    
    console.log('Transform Output:', transformResult);
    
    // Workflow completed successfully
    console.log('\n✅ Workflow execution completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Workflow execution failed:', error);
  }
}

// Run the test
testWorkflowExecution();
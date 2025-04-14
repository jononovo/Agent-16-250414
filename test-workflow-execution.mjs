/**
 * Test Workflow Node Execution
 * 
 * This script creates and runs a simple test workflow to verify
 * that our node system is functioning correctly.
 */

// Using dynamic imports to load our node modules
async function runWorkflow() {
  console.log('Starting workflow execution test...');
  
  try {
    console.log('Loading node modules...');
    // Dynamically import node modules
    const textTemplateModule = await import('./client/src/nodes/text_template/index.ts');
    const decisionModule = await import('./client/src/nodes/decision/index.ts');
    const dataTransformModule = await import('./client/src/nodes/data_transform/index.ts');
    
    // Extract the node definitions
    const textTemplateNode = textTemplateModule.default;
    const decisionNode = decisionModule.default;
    const dataTransformNode = dataTransformModule.default;
    
    console.log('Loaded nodes:', {
      textTemplate: !!textTemplateNode,
      decision: !!decisionNode,
      dataTransform: !!dataTransformNode
    });
    
    // Step 1: Use text template node to generate a greeting
    console.log('\n--- Step 1: Text Template Node ---');
    const templateData = { template: 'Hello, {{name}}! Welcome to our {{service}}.' };
    const templateInputs = { variables: { name: 'User', service: 'AI workflow system' } };
    
    console.log('Template data:', templateData);
    console.log('Template inputs:', templateInputs);
    
    const templateResult = await textTemplateNode.executor.execute(templateData, templateInputs);
    console.log('Template result:', templateResult);
    
    if (!templateResult.text) {
      throw new Error('Text template node failed to produce text output');
    }
    
    // Step 2: Use decision node to route based on content
    console.log('\n--- Step 2: Decision Node ---');
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
    
    const decisionInputs = { text: templateResult.text };
    console.log('Decision data:', decisionData);
    console.log('Decision inputs:', decisionInputs);
    
    const decisionResult = await decisionNode.executor.execute(decisionData, decisionInputs);
    console.log('Decision result:', decisionResult);
    
    // Step 3: Transform the resulting text
    console.log('\n--- Step 3: Data Transform Node ---');
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
    
    const transformInputs = { data: { text: templateResult.text } };
    console.log('Transform data:', transformData);
    console.log('Transform inputs:', transformInputs);
    
    const transformResult = await dataTransformNode.executor.execute(transformData, transformInputs);
    console.log('Transform result:', transformResult);
    
    console.log('\n✅ Workflow test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Workflow test failed:', error);
    console.error(error.stack);
  }
}

// Run the test
runWorkflow();
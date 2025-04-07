/**
 * Test script for workflow 15 execution using the client-centric approach
 * This demonstrates how to use the workflowClient directly instead of making API calls
 */

import { createAgent } from './client/src/lib/workflowClient.js';

async function testWorkflow15() {
  try {
    console.log('Testing workflow 15 execution with UI Button source...');
    
    // Test with UI Button Source using client-side workflow execution
    const uiButtonResult = await createAgent({
      name: 'Test Agent from UI Button',
      description: 'Agent created from UI button test',
      type: 'test',
      icon: 'beaker'
    }, {
      source: 'ui_form',
      onNodeStateChange: (nodeId, state) => {
        console.log(`Node ${nodeId} state: ${state.status}`);
      },
      onWorkflowComplete: (state) => {
        console.log(`Workflow completed with status: ${state.status}`);
      }
    });
    
    console.log('UI Button Execution Result:', JSON.stringify(uiButtonResult, null, 2));
    console.log();
    
    console.log('Testing workflow 15 execution with AI Chat source...');
    
    // Test with AI Chat Source using client-side workflow execution
    const aiChatResult = await createAgent({
      name: 'Test Agent from AI Chat',
      description: 'Agent created from AI chat test',
      type: 'test',
      icon: 'message-circle'
    }, {
      source: 'ai_chat',
      onNodeStateChange: (nodeId, state) => {
        console.log(`Node ${nodeId} state: ${state.status}`);
      },
      onWorkflowComplete: (state) => {
        console.log(`Workflow completed with status: ${state.status}`);
      }
    });
    
    console.log('AI Chat Execution Result:', JSON.stringify(aiChatResult, null, 2));
    console.log();
    
    console.log('Tests completed!');
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testWorkflow15();
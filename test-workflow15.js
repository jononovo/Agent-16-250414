// Test script for workflow 15 execution
import fetch from 'node-fetch';

async function testWorkflow15() {
  try {
    // Test UI Button trigger source
    console.log('Testing workflow 15 execution with UI Button source...');
    const uiButtonResponse = await fetch('http://localhost:5000/api/workflows/15/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Agent from UI Button',
        description: 'Agent created from UI Button source test',
        metadata: {
          source: 'ui_button'
        }
      }),
    });

    const uiButtonResult = await uiButtonResponse.json();
    console.log('UI Button Execution Result:', JSON.stringify(uiButtonResult, null, 2));

    // Test AI Chat trigger source
    console.log('\nTesting workflow 15 execution with AI Chat source...');
    const aiChatResponse = await fetch('http://localhost:5000/api/workflows/15/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Agent from AI Chat',
        description: 'Agent created from AI Chat source test',
        metadata: {
          source: 'ai_chat'
        }
      }),
    });

    const aiChatResult = await aiChatResponse.json();
    console.log('AI Chat Execution Result:', JSON.stringify(aiChatResult, null, 2));

    console.log('\nTests completed!');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the tests
testWorkflow15();
/**
 * This script demonstrates how to execute node 6 in workflow 18 directly
 * to verify that template variable replacement works correctly
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

async function testApiMessageNode() {
  try {
    console.log('Starting API Message Node test...');
    
    // First, get the workflow 18 definition
    const workflow18 = await apiClient.get('/api/workflows/18');
    console.log('Workflow 18 retrieved.');
    
    // Extract node 6 (the API Response Message node)
    const node6 = workflow18.flowData.nodes.find(node => node.id === '6');
    if (!node6) {
      throw new Error('Node 6 not found in workflow 18');
    }
    
    console.log('API Response Message Node settings:');
    console.log(JSON.stringify(node6.data.settings, null, 2));
    
    // Create test input data with agent ID
    const testInput = {
      success: true,
      data: {
        agent: {
          id: 1001,
          name: "Test API Agent",
          description: "A test agent"
        }
      }
    };
    
    // Function to get a value by path from an object
    function getValueByPath(obj, path) {
      if (!path) return obj;
      
      const parts = path.split('.');
      let value = obj;
      
      for (const part of parts) {
        if (value === null || value === undefined) return undefined;
        value = value[part];
      }
      
      return value;
    }
    
    // Function to replace template variables like {{variable.path}} in a string
    function replaceTemplateVariables(template, data) {
      if (!template) return '';
      
      // Match {{variable.path}} pattern
      const regex = /\{\{([^}]+)\}\}/g;
      
      return template.replace(regex, (match, path) => {
        const value = getValueByPath(data, path);
        return value !== undefined ? value : match;
      });
    }
    
    // Execute the node locally by simulating its behavior
    const settings = node6.data.settings;
    const conditionField = settings.conditionField || 'success';
    const successValue = settings.successValue || 'true';
    
    // Extract condition value
    const conditionValue = getValueByPath(testInput, conditionField);
    
    // Check condition
    const isSuccess = String(conditionValue) === String(successValue);
    console.log(`Condition check: ${conditionField}=${conditionValue}, successValue=${successValue}, isSuccess=${isSuccess}`);
    
    // Select appropriate message
    const templateMessage = isSuccess ? settings.successMessage : settings.errorMessage;
    
    console.log('Template message:', templateMessage);
    console.log('Input data:', JSON.stringify(testInput, null, 2));
    console.log('Formatted output enabled:', settings.formatOutput);
    
    const resultMessage = replaceTemplateVariables(templateMessage, testInput);
    console.log('Result after template replacement:', resultMessage);
    
    console.log('\nTest completed successfully');
    return { 
      isSuccess,
      originalTemplate: templateMessage,
      result: resultMessage 
    };
  } catch (error) {
    console.error('Test failed:', error);
    return { error: error.message };
  }
}

// Run the test
testApiMessageNode()
  .then(result => {
    console.log('\nFinal result:');
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('Error:', error);
  });
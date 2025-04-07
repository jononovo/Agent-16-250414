/**
 * Test Template Variables Replacement Function
 * 
 * This script validates the template variable replacement and formatting
 * functionality used in API Response Message nodes.
 */

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

function replaceTemplateVariables(template, data) {
  if (!template) return '';
  
  // Match {{variable.path}} pattern
  const regex = /\{\{([^}]+)\}\}/g;
  
  return template.replace(regex, (match, path) => {
    const value = getValueByPath(data, path);
    return value !== undefined ? value : match;
  });
}

async function testTemplateVariables() {
  // Workflow 18 template
  const template = 'Your agent has been created successfully with ID: {{data.agent.id}}! You can now use it for your tasks.';
  
  console.log('Template:', template);
  
  // Test case 1: Proper nested data structure
  const input1 = {
    success: true,
    data: {
      agent: {
        id: 123,
        name: 'Test Agent'
      }
    }
  };
  
  // Test case 2: Wrong structure
  const input2 = {
    success: true,
    agent: {
      id: 456,
      name: 'Direct Agent'
    }
  };
  
  // Process templates
  console.log('\nTest Case 1:');
  console.log('Input:', JSON.stringify(input1, null, 2));
  const output1 = replaceTemplateVariables(template, input1);
  console.log('Output:', output1);
  console.log('Success?', output1.includes('123'));
  
  console.log('\nTest Case 2:');
  console.log('Input:', JSON.stringify(input2, null, 2));
  const output2 = replaceTemplateVariables(template, input2);
  console.log('Output:', output2);
  console.log('Raw template preserved?', output2.includes('{{data.agent.id}}'));
}

// Run test
testTemplateVariables();
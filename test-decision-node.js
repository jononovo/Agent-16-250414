/**
 * Test script for the decision node
 */

// Import decision node components
import { execute, defaultData } from './client/src/nodes/decision/executor.js';

async function testDecisionNode() {
  console.log('=== Testing Decision Node ===');
  
  // Test case 1: True condition
  console.log('\nTest 1: True condition (value > 5, input = 10)');
  const trueResult = await execute(
    { condition: 'value > 5' },
    { value: 10 }
  );
  console.log('Result:', trueResult);
  
  // Test case 2: False condition
  console.log('\nTest 2: False condition (value > 5, input = 3)');
  const falseResult = await execute(
    { condition: 'value > 5' },
    { value: 3 }
  );
  console.log('Result:', falseResult);
  
  // Test case 3: String comparison
  console.log('\nTest 3: String comparison (value === "hello", input = "hello")');
  const stringResult = await execute(
    { condition: 'value === "hello"' },
    { value: 'hello' }
  );
  console.log('Result:', stringResult);
  
  // Test case 4: Object property access
  console.log('\nTest 4: Object property access (value.count > 3, input = {count: 5})');
  const objectResult = await execute(
    { condition: 'value.count > 3' },
    { value: { count: 5 } }
  );
  console.log('Result:', objectResult);
  
  // Test case 5: Error - no input
  console.log('\nTest 5: Error - no input provided');
  const errorResult1 = await execute(
    { condition: 'value > 5' },
    {}
  );
  console.log('Result:', errorResult1);
  
  // Test case 6: Error - invalid condition syntax
  console.log('\nTest 6: Error - invalid condition syntax');
  const errorResult2 = await execute(
    { condition: 'value >< 5' },
    { value: 10 }
  );
  console.log('Result:', errorResult2);
  
  console.log('\n=== Decision Node Test Complete ===');
}

testDecisionNode();
/**
 * Test script for running the node system test
 * 
 * This script imports and runs the node system test function.
 */

import { testNodeSystem } from './client/src/test-node-system.js';

async function runTest() {
  console.log('Starting node system test...');
  
  try {
    await testNodeSystem();
    console.log('Node system test completed successfully');
  } catch (error) {
    console.error('Node system test failed:', error);
  }
}

runTest();
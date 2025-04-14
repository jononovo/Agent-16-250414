/**
 * Test script for running the new node system test
 * 
 * This script imports and runs the new node system test function.
 */

import { testNewNodeSystem } from './client/src/test-new-node-system.js';

async function runTest() {
  try {
    console.log('Starting test of new node system...');
    await testNewNodeSystem();
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

runTest();
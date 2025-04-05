/**
 * Enhanced Node Executors Index
 * 
 * This file exports all enhanced node executors to be registered with the workflow engine.
 */

// Import all node executors
import { textInputExecutor } from './textInputExecutor';
import { outputExecutor } from './outputExecutor';
import { visualizeTextExecutor } from './visualizeTextExecutor';
import { transformExecutor } from './transformExecutor';
import { chatInterfaceExecutor } from './chatInterfaceExecutor';
import { claudeExecutor } from './claudeExecutor';

// Export all node executors as a collection
export const enhancedNodeExecutors = {
  textInputExecutor,
  outputExecutor,
  visualizeTextExecutor,
  transformExecutor,
  chatInterfaceExecutor,
  claudeExecutor
};

// Export individual node executors
export {
  textInputExecutor,
  outputExecutor,
  visualizeTextExecutor,
  transformExecutor,
  chatInterfaceExecutor,
  claudeExecutor
};
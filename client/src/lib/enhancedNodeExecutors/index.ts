/**
 * Enhanced Node Executors Index
 * 
 * This file exports all enhanced node executors to be registered with the workflow engine.
 * Using dynamic imports to avoid circular dependencies.
 */

// Import types only
import { EnhancedNodeExecutor } from '../types/workflow';

// Export collection getter method (async)
export async function getAllEnhancedNodeExecutors(): Promise<Record<string, EnhancedNodeExecutor>> {
  const textInputModule = await import('./textInputExecutor');
  const outputModule = await import('./outputExecutor');
  const visualizeTextModule = await import('./visualizeTextExecutor');
  const transformModule = await import('./transformExecutor');
  const chatInterfaceModule = await import('./chatInterfaceExecutor');
  const claudeModule = await import('./claudeExecutor');
  const textPromptModule = await import('./textPromptExecutor');
  
  return {
    textInputExecutor: textInputModule.textInputExecutor,
    outputExecutor: outputModule.outputExecutor,
    visualizeTextExecutor: visualizeTextModule.visualizeTextExecutor,
    transformExecutor: transformModule.transformExecutor,
    chatInterfaceExecutor: chatInterfaceModule.chatInterfaceExecutor,
    claudeExecutor: claudeModule.claudeExecutor,
    textPromptExecutor: textPromptModule.textPromptExecutor
  };
}

// Export registration method
export async function registerAllEnhancedExecutors(): Promise<void> {
  // Import the registration function
  const { registerEnhancedNodeExecutor } = await import('../enhancedWorkflowEngine');
  
  // Get all executors
  const executors = await getAllEnhancedNodeExecutors();
  
  // Register each executor with its type
  registerEnhancedNodeExecutor('text_input', executors.textInputExecutor);
  registerEnhancedNodeExecutor('text_prompt', executors.textPromptExecutor);
  registerEnhancedNodeExecutor('output', executors.outputExecutor);
  registerEnhancedNodeExecutor('visualize_text', executors.visualizeTextExecutor);
  registerEnhancedNodeExecutor('transform', executors.transformExecutor);
  registerEnhancedNodeExecutor('chat_interface', executors.chatInterfaceExecutor);
  registerEnhancedNodeExecutor('claude', executors.claudeExecutor);
  
  // Register aliases for backward compatibility
  registerEnhancedNodeExecutor('generate_text', executors.claudeExecutor);
  registerEnhancedNodeExecutor('perplexity', executors.claudeExecutor);
  
  console.log('All enhanced node executors registered');
}
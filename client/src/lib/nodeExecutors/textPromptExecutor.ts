import { NodeExecutor, createSimpleNodeExecutor } from '../workflowEngine';

interface TextPromptData {
  prompt?: string;
  text?: string;
  label?: string;
  [key: string]: any;
}

/**
 * Executor for text prompt nodes
 * 
 * This node passes along the prompt or text as output.
 */
export const textPromptExecutor: NodeExecutor = createSimpleNodeExecutor(
  async (nodeData: TextPromptData) => {
    // Get the prompt from the node data
    const promptText = nodeData.prompt || nodeData.text || nodeData.input;
    
    if (!promptText) {
      throw new Error('No prompt text provided');
    }
    
    // Return the prompt text as output
    return promptText;
  }
);
import { NodeExecutor, createSimpleNodeExecutor } from '../workflowEngine';

interface TextInputData {
  inputText: string;
  label?: string;
  [key: string]: any;
}

/**
 * Executor for text input nodes
 * 
 * This node simply passes along its input text as output.
 */
export const textInputExecutor: NodeExecutor = createSimpleNodeExecutor(
  async (nodeData: TextInputData) => {
    // Validate input
    if (!nodeData.inputText) {
      throw new Error('No input text provided');
    }
    
    // Return the input text as output
    return nodeData.inputText;
  }
);
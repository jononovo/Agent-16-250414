import { 
  EnhancedNodeExecutor, 
  NodeExecutionData, 
  createExecutionDataFromValue 
} from '../types/workflow';
import { createEnhancedNodeExecutor } from '../enhancedWorkflowEngine';

interface TextPromptData {
  prompt?: string;
  text?: string;
  label?: string;
  [key: string]: any;
}

/**
 * Text Prompt Node Definition
 */
const textPromptDefinition = {
  type: 'text_prompt',
  displayName: 'Text Prompt',
  description: 'Provides text input to the workflow',
  icon: 'MessageSquare',
  category: 'input',
  version: '1.0',
  
  // Define the input parameters
  inputs: {
    prompt: {
      type: 'string' as const,
      displayName: 'Prompt Text',
      description: 'The text prompt to provide to the workflow',
      required: true
    }
  },
  
  // Define the outputs
  outputs: {
    default: {
      type: 'string' as const,
      displayName: 'Prompt Text',
      description: 'The provided prompt text'
    }
  }
};

/**
 * Executor for text prompt nodes
 * 
 * This node passes along the prompt or text as output.
 */
export const textPromptExecutor: EnhancedNodeExecutor = createEnhancedNodeExecutor(
  textPromptDefinition,
  async (nodeData: TextPromptData): Promise<NodeExecutionData> => {
    // Get the prompt from the node data
    const promptText = nodeData.prompt || nodeData.text || nodeData.input;
    
    if (!promptText) {
      throw new Error('No prompt text provided');
    }
    
    // Return the prompt text as output
    return createExecutionDataFromValue(promptText, 'text_prompt');
  }
);
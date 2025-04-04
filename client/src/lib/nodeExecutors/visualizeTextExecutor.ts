import { NodeExecutor } from '../workflowEngine';

interface VisualizeTextData {
  textContent?: string;
  label?: string;
  [key: string]: any;
}

interface VisualizeTextInputs {
  default?: string;
  [key: string]: any;
}

/**
 * Executor for Visualize Text nodes
 * 
 * This node displays text content. It doesn't transform the input,
 * but simply passes it through after displaying it.
 */
export const visualizeTextExecutor: NodeExecutor = {
  /**
   * Execute the Visualize Text node
   */
  async execute(nodeData: VisualizeTextData, inputs: VisualizeTextInputs): Promise<string> {
    // Use text from node data or from inputs
    const textContent = inputs.default || nodeData.textContent || '';
    
    // In a real visualizer, we might render to an image or format the text,
    // but for now we just pass the text through
    
    // Return the text content as the output (for piping to next nodes)
    return textContent;
  }
};
import { 
  EnhancedNodeExecutor, 
  NodeExecutionData
} from '../types/workflow';
import { createEnhancedNodeExecutor } from '../enhancedWorkflowEngine';

interface VisualizeTextNodeData {
  [key: string]: any;
}

/**
 * Extract text from input data
 */
function extractTextFromInput(input: NodeExecutionData): string {
  if (!input.items || input.items.length === 0) {
    return '';
  }
  
  const item = input.items[0];
  
  // Handle different data formats
  if (typeof item.json === 'string') {
    return item.json;
  }
  
  if (typeof item.json.data === 'string') {
    return item.json.data;
  }
  
  if (typeof item.json.text === 'string') {
    return item.json.text;
  }
  
  if (typeof item.json.content === 'string') {
    return item.json.content;
  }
  
  // Convert to string if it's an object
  if (typeof item.json === 'object' && item.json !== null) {
    try {
      return JSON.stringify(item.json, null, 2);
    } catch (e) {
      return '';
    }
  }
  
  return '';
}

/**
 * Visualize Text Node Definition
 */
const visualizeTextDefinition = {
  type: 'visualize_text',
  displayName: 'Visualize Text',
  description: 'Displays text output in the workflow',
  icon: 'FileText',
  category: 'output',
  version: '1.0',
  
  // Define the input parameters
  inputs: {
    default: {
      type: 'string' as const,
      displayName: 'Text Input',
      description: 'Text to visualize',
      required: true
    }
  },
  
  // Define the outputs
  outputs: {
    default: {
      type: 'string' as const,
      displayName: 'Text Output',
      description: 'The visualized text (same as input)'
    }
  }
};

/**
 * Executor for visualize text nodes
 * 
 * This node displays text content and passes it through.
 */
export const visualizeTextExecutor: EnhancedNodeExecutor = createEnhancedNodeExecutor(
  visualizeTextDefinition,
  async (nodeData: VisualizeTextNodeData, inputs: Record<string, NodeExecutionData>): Promise<NodeExecutionData> => {
    // Get the text from the inputs
    const text = extractTextFromInput(inputs.default);
    
    if (!text) {
      throw new Error('No text provided to visualize');
    }
    
    // Store the text in the node data for display in the UI
    nodeData.textContent = text;
    
    // Pass through the input, adding visualization metadata
    const result = { ...inputs.default };
    result.meta = {
      ...result.meta,
      visualized: true,
      visualizationType: 'text'
    };
    
    return result;
  }
);
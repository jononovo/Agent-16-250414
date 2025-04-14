/**
 * Text Prompt Node Definition
 * 
 * This file contains the definition of the Text Prompt node, including:
 * - Node metadata (name, description, category)
 * - Input and output port definitions
 * - Default settings
 */

import { MessageSquare } from 'lucide-react';
import { NodeDefinition } from '../types';

// Text Prompt Node Data interface
export interface TextPromptNodeData {
  label?: string;
  prompt?: string;
  description?: string;
  isProcessing?: boolean;
  isComplete?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  onSettingsClick?: () => void;
  settings?: {
    prompt?: string;
  };
  dynamicHandles?: {
    inputs: {
      id: string;
      name: string;
      description?: string;
    }[];
  };
  onAddInput?: (input: { id: string; name: string; description?: string }) => void;
  onUpdateInput?: (id: string, name: string, description?: string) => void;
  onRemoveInput?: (id: string) => void;
}

// Node definition object
export const nodeDefinition: NodeDefinition = {
  type: 'text_prompt',
  name: 'Text Prompt',
  description: 'A node for creating and managing text prompts',
  category: 'Input',  // Category for grouping in the node panel
  icon: MessageSquare,  // Lucide icon to display
  
  defaultData: {
    label: 'Text Prompt',
    prompt: '',
    description: 'Enter your prompt text here',
    settings: {
      prompt: ''
    }
  },
  
  // Input/Output definitions
  inputs: {},  // Will use dynamic inputs
  outputs: {
    output: {
      type: 'string',
      description: 'The prompt text as output'
    }
  }
};

export default nodeDefinition;
import {
  EnhancedNodeExecutor,
  NodeExecutionData,
  createExecutionDataFromValue,
  createWorkflowItem
} from '../types/workflow';
import { createEnhancedNodeExecutor } from '../enhancedWorkflowEngine';

interface ChatInterfaceNodeData {
  agentName?: string;
  messageHistory?: Array<{
    role: 'user' | 'agent' | 'system';
    content: string;
    timestamp: Date;
  }>;
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
 * Chat Interface Node Definition
 */
const chatInterfaceDefinition = {
  type: 'chat_interface',
  displayName: 'Chat Interface',
  description: 'Connect to the application chat interface',
  icon: 'MessageCircle',
  category: 'integration',
  version: '1.0',
  
  // Define the input parameters
  inputs: {
    input: {
      type: 'string' as const,
      displayName: 'Input Text',
      description: 'Text to send to the chat interface',
      required: true
    },
    agentName: {
      type: 'string' as const,
      displayName: 'Agent Name',
      description: 'Name of the agent in the chat',
      default: 'Coordinator Agent'
    }
  },
  
  // Define the outputs
  outputs: {
    output: {
      type: 'string' as const,
      displayName: 'Output Text',
      description: 'Response from the chat interface'
    },
    history: {
      type: 'array' as const,
      displayName: 'Message History',
      description: 'Complete message history'
    }
  }
};

/**
 * Executor for chat interface nodes
 * 
 * This node connects to the application chat interface, allowing agents to
 * send and receive messages through the UI chat component.
 */
export const chatInterfaceExecutor: EnhancedNodeExecutor = createEnhancedNodeExecutor(
  chatInterfaceDefinition,
  async (nodeData: ChatInterfaceNodeData, inputs: Record<string, NodeExecutionData>): Promise<NodeExecutionData> => {
    // Get the input message text
    const inputText = extractTextFromInput(inputs.input || inputs.default);
    
    if (!inputText) {
      throw new Error('No input text provided for chat interface');
    }
    
    const agentName = nodeData.agentName || 'Coordinator Agent';
    
    // Initialize message history if it doesn't exist
    if (!nodeData.messageHistory) {
      nodeData.messageHistory = [];
    }
    
    // Add the new message to history
    nodeData.messageHistory.push({
      role: 'agent',
      content: inputText,
      timestamp: new Date()
    });
    
    // In a real implementation, this would interact with the chat UI
    // For now, we'll simulate the interaction
    console.log(`[${agentName}] ${inputText}`);
    
    try {
      // For browser environment, try to access the chat UI
      if (typeof window !== 'undefined') {
        // Check if the chat context exists
        if (window.chatContext) {
          // Add message to the chat
          window.chatContext.addMessage(inputText, 'agent');
        } else {
          console.log('Chat context not found in window, message would be displayed if available');
        }
      } else {
        // Server-side execution, we'd handle this differently
        console.log('Server-side execution, chat UI interaction simulated');
      }
    } catch (error) {
      console.log('Error interacting with chat UI:', error);
    }
    
    // Create output items with response text and history
    const textItem = createWorkflowItem(
      inputText,
      'chat_interface'
    );
    
    const historyItem = createWorkflowItem(
      nodeData.messageHistory,
      'chat_interface'
    );
    
    // Add metadata for different output handles
    if (!textItem.meta) textItem.meta = {};
    if (!historyItem.meta) historyItem.meta = {};
    
    textItem.meta.outputType = 'output';
    historyItem.meta.outputType = 'history';
    
    return {
      items: [textItem, historyItem],
      meta: {
        startTime: new Date(),
        endTime: new Date(),
        itemsProcessed: 2,
        agentName
      }
    };
  }
);

// Declare window.chatContext for TypeScript
declare global {
  interface Window {
    chatContext?: {
      addMessage: (content: string, role: 'user' | 'system' | 'agent') => void;
      resetChat: () => void;
      messages: any[];
      isChatOpen: boolean;
      toggleChat: () => void;
    };
  }
}
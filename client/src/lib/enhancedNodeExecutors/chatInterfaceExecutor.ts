/**
 * Chat Interface Node Executor
 * 
 * Handles the execution of chat interface nodes, which provide conversational interactions.
 */

import { EnhancedNodeExecutor } from '../types/workflow';

export interface ChatMessage {
  id: string;
  role: 'user' | 'system' | 'agent';
  content: string;
  timestamp: Date;
}

export const chatInterfaceExecutor: EnhancedNodeExecutor = {
  nodeType: 'chat_interface',
  
  execute: async (nodeData, inputs) => {
    try {
      // Get chat messages from node data or initialize if not present
      let messages: ChatMessage[] = nodeData.messages || [];
      
      // Get user input from node data
      const userInput = nodeData.inputValue || '';
      
      // Get the input from connected nodes (responses from AI, etc.)
      const inputKeys = Object.keys(inputs);
      let aiResponse = '';
      
      if (inputKeys.length > 0) {
        const firstInputKey = inputKeys[0];
        const firstInput = inputs[firstInputKey];
        
        // Try to extract text from the input
        if (typeof firstInput.text === 'string') {
          aiResponse = firstInput.text;
        } else if (typeof firstInput.output === 'string') {
          aiResponse = firstInput.output;
        } else if (typeof firstInput === 'string') {
          aiResponse = firstInput;
        } else if (firstInput && typeof firstInput === 'object') {
          aiResponse = JSON.stringify(firstInput);
        }
      }
      
      // Add user message if there's user input
      if (userInput) {
        messages.push({
          id: Date.now().toString(),
          role: 'user',
          content: userInput,
          timestamp: new Date()
        });
      }
      
      // Add AI response if there's a response
      if (aiResponse) {
        messages.push({
          id: (Date.now() + 1).toString(),
          role: 'agent',
          content: aiResponse,
          timestamp: new Date()
        });
      }
      
      // Update the messages in node data
      nodeData.messages = messages;
      
      // Return the chat state
      return {
        success: true,
        outputs: {
          text: userInput,
          output: userInput,
          messages: messages,
          latestMessage: messages[messages.length - 1]?.content || ''
        }
      };
    } catch (error: any) {
      console.error(`Error executing chat interface node:`, error);
      return {
        success: false,
        error: error.message || 'Error processing chat interface',
        outputs: {}
      };
    }
  }
};
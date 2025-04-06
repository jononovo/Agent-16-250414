/**
 * Chat Interface Node Executor
 * 
 * Handles the execution of chat interface nodes, which provide conversational interactions.
 */

import { EnhancedNodeExecutor, NodeExecutionData, createExecutionDataFromValue } from '../types/workflow';

export interface ChatMessage {
  id: string;
  role: 'user' | 'system' | 'agent';
  content: string;
  timestamp: Date;
}

export const chatInterfaceExecutor: EnhancedNodeExecutor = {
  nodeType: 'chat_interface',
  
  execute: async (nodeData, inputs): Promise<NodeExecutionData> => {
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
        
        // Check for internal_action with formatted message
        if (firstInput?.items?.[0]?.json?.action === 'create_agent' && 
            firstInput?.items?.[0]?.json?.formatted === true && 
            firstInput?.items?.[0]?.json?.message) {
          // Use the already formatted message
          aiResponse = firstInput.items[0].json.message;
        }
        // Check for notification message from API
        else if (firstInput?.items?.[0]?.json?.notification?.message) {
          aiResponse = firstInput.items[0].json.notification.message;
        }
        // Try to extract text from the input using various possible formats
        else if (firstInput?.items?.[0]?.json?.text) {
          aiResponse = firstInput.items[0].json.text;
        } else if (firstInput?.items?.[0]?.json?.message) {
          aiResponse = firstInput.items[0].json.message;
        } else if (firstInput?.items?.[0]?.json?.content) {
          aiResponse = firstInput.items[0].json.content;
        } else {
          // Try more complex processing for nested structures
          try {
            const flattenedInput = JSON.stringify(firstInput);
            const parsedInput = JSON.parse(flattenedInput);
            
            if (parsedInput.items?.[0]?.json?.message) {
              aiResponse = parsedInput.items[0].json.message;
            } else if (parsedInput.message) {
              aiResponse = parsedInput.message;
            } else if (parsedInput.content) {
              aiResponse = parsedInput.content;
            } else {
              // Fallback to stringify but make it pretty
              aiResponse = JSON.stringify(firstInput, null, 2);
            }
          } catch (e) {
            // If JSON parsing fails, just stringify
            aiResponse = JSON.stringify(firstInput);
          }
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
      
      // Return the chat state in proper NodeExecutionData format
      return createExecutionDataFromValue({
        userInput,
        messages,
        latestMessage: messages[messages.length - 1]?.content || ''
      }, 'chat_interface');
    } catch (error: any) {
      console.error(`Error executing chat interface node:`, error);
      return createExecutionDataFromValue({
        error: error.message || 'Error processing chat interface'
      }, 'error');
    }
  }
};
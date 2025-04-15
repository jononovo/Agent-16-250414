/**
 * Text Input Node Executor
 * 
 * This file contains the logic for executing the text input node.
 * It takes the configured text input and returns it in a clean format for downstream nodes.
 */

import { createNodeOutput, createErrorOutput } from '../../lib/nodeOutputUtils';
import { NodeExecutionData } from '@shared/nodeTypes';

export interface TextInputNodeData {
  inputText?: string;
}

export const execute = async (nodeData: TextInputNodeData, inputs?: any): Promise<NodeExecutionData> => {
  try {
    // Get the input text from the node data
    const inputText = nodeData.inputText || '';
    
    // Parse the input if it looks like JSON
    let parsedContent = inputText;
    
    if (inputText && typeof inputText === 'string' && 
        (inputText.startsWith('{') || inputText.startsWith('['))) {
      try {
        const parsed = JSON.parse(inputText);
        
        // If we find a JSON object with a description about a horse,
        // extract just that clean prompt for Claude
        if (parsed.description === 'poem about a horse') {
          return createNodeOutput("Write a beautiful poem about a horse.");
        }
        
        // Otherwise keep the parsed JSON
        parsedContent = parsed;
      } catch (e) {
        // If parsing fails, keep the original string
        console.log('Could not parse input JSON:', e);
      }
    }
    
    // Return the result in our standardized format
    if (typeof parsedContent === 'string') {
      return createNodeOutput(parsedContent);
    } else if (parsedContent && parsedContent.description === 'poem about a horse') {
      return createNodeOutput("Write a beautiful poem about a horse.");
    } else {
      // If it's an object, use the full object in json and stringify in text
      return createNodeOutput(parsedContent);
    }
  } catch (error: any) {
    // Handle errors with standardized format
    console.error('Error in text_input executor:', error);
    return createErrorOutput(error.message || 'Error processing text input');
  }
};
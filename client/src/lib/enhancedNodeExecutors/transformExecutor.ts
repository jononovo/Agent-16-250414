/**
 * Transform Node Executor
 * 
 * Handles the execution of transform nodes, which modify data between nodes.
 */

import { EnhancedNodeExecutor } from '../types/workflow';

export const transformExecutor: EnhancedNodeExecutor = {
  nodeType: 'transform',
  
  execute: async (nodeData, inputs) => {
    try {
      // Get the input from the connected node
      const inputKeys = Object.keys(inputs);
      let inputData = {};
      
      if (inputKeys.length > 0) {
        const firstInputKey = inputKeys[0];
        const firstInput = inputs[firstInputKey];
        
        // Set the input data based on what's available
        if (firstInput && typeof firstInput === 'object') {
          inputData = firstInput;
        } else if (typeof firstInput === 'string') {
          inputData = { text: firstInput };
        }
      }
      
      // Get transform type and script from node configuration
      const transformType = nodeData.configuration?.transformType || 'text';
      const transformScript = nodeData.configuration?.script || '';
      
      let outputData = {};
      
      // Execute the transformation based on type
      switch (transformType) {
        case 'json':
          try {
            // Safe evaluation of JSON transform
            const transformFunction = new Function('data', `
              try {
                ${transformScript}
                return data;
              } catch (e) {
                console.error('Transform script error:', e);
                return { error: e.message };
              }
            `);
            
            outputData = transformFunction(JSON.parse(JSON.stringify(inputData)));
          } catch (e) {
            throw new Error(`JSON transform error: ${e.message}`);
          }
          break;
          
        case 'text':
          try {
            // Extract text from input
            const inputText = typeof inputData.text === 'string' 
              ? inputData.text 
              : typeof inputData.output === 'string'
                ? inputData.output
                : JSON.stringify(inputData);
            
            // Safe evaluation of text transform
            const transformFunction = new Function('text', `
              try {
                ${transformScript}
                return text;
              } catch (e) {
                console.error('Transform script error:', e);
                return 'Error: ' + e.message;
              }
            `);
            
            const transformedText = transformFunction(inputText);
            outputData = { 
              text: transformedText,
              output: transformedText
            };
          } catch (e) {
            throw new Error(`Text transform error: ${e.message}`);
          }
          break;
          
        case 'filter':
          try {
            // Extract array to filter from input
            const dataToFilter = Array.isArray(inputData) 
              ? inputData 
              : Array.isArray(inputData.items) 
                ? inputData.items 
                : [];
            
            // Safe evaluation of filter transform
            const filterFunction = new Function('items', `
              try {
                return items.filter(item => {
                  ${transformScript}
                });
              } catch (e) {
                console.error('Filter script error:', e);
                return [];
              }
            `);
            
            const filteredItems = filterFunction(dataToFilter);
            outputData = { 
              items: filteredItems,
              filtered: filteredItems,
              count: filteredItems.length
            };
          } catch (e) {
            throw new Error(`Filter transform error: ${e.message}`);
          }
          break;
          
        case 'extract':
          try {
            // Extract object/text from input
            const dataToExtract = typeof inputData === 'object' 
              ? inputData 
              : { text: String(inputData) };
            
            // Safe evaluation of extract transform
            const extractFunction = new Function('data', `
              try {
                const extracted = {};
                ${transformScript}
                return extracted;
              } catch (e) {
                console.error('Extract script error:', e);
                return { error: e.message };
              }
            `);
            
            outputData = extractFunction(dataToExtract);
          } catch (e) {
            throw new Error(`Extract transform error: ${e.message}`);
          }
          break;
          
        default:
          throw new Error(`Unknown transform type: ${transformType}`);
      }
      
      // Return the transformed data
      return {
        success: true,
        outputs: {
          ...outputData,
          // Add these for backward compatibility
          result: outputData,
          transformed: outputData
        }
      };
    } catch (error: any) {
      console.error(`Error executing transform node:`, error);
      return {
        success: false,
        error: error.message || 'Error processing transform',
        outputs: {}
      };
    }
  }
};
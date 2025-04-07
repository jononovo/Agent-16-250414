/**
 * Transform Node Executor
 * 
 * Handles the execution of transform nodes, which modify data between nodes.
 */

import { EnhancedNodeExecutor } from '../types/workflow';

export const transformExecutor: EnhancedNodeExecutor = {
  definition: {
    type: 'transform',
    displayName: 'Transform Node',
    description: 'Transforms data between nodes using JavaScript code',
    icon: 'code',
    category: 'Data Processing',
    version: '1.0',
    inputs: {
      input: {
        type: 'any',
        displayName: 'Input',
        description: 'The input data to transform',
        required: true
      }
    },
    outputs: {
      output: {
        type: 'any',
        displayName: 'Output',
        description: 'The transformed data'
      }
    }
  },
  
  execute: async (nodeData, inputs) => {
    try {
      // Get the input from the connected node
      const inputKeys = Object.keys(inputs);
      let inputData = {};
      
      if (inputKeys.length > 0) {
        const firstInputKey = inputKeys[0];
        const firstInput = inputs[firstInputKey];
        
        // Set the input data based on what's available in NodeExecutionData
        if (firstInput && firstInput.items && firstInput.items.length > 0) {
          // Try to get JSON data with fallbacks
          inputData = firstInput.items[0].json || {};
          
          // Special handling for workflow trigger outputs
          if (inputData && typeof inputData === 'object') {
            // Check if this is a workflow output and extract content/output field
            const objectData = inputData as Record<string, any>;
            if (objectData.output !== undefined) {
              inputData = objectData.output;
            } else if (objectData.content !== undefined) {
              inputData = objectData.content;
            } else if (objectData.result !== undefined) {
              inputData = objectData.result;
            }
          }
        }
      }
      
      // Provide default values if data is still undefined or null
      if (inputData === null || inputData === undefined || 
          (typeof inputData === 'object' && Object.keys(inputData).length === 0)) {
        // Set safe defaults to avoid errors
        inputData = {
          success: false,
          verificationStatus: 'Not Available',
          data: null
        };
      }
      
      // Get transform type and script from node configuration
      const transformType = nodeData.configuration?.transformType || 'text';
      const transformScript = nodeData.configuration?.script || '';
      
      let outputData: any = {};
      
      // Execute the transformation based on type
      switch (transformType) {
        case 'json':
          try {
            // Create a safe sandbox function that explicitly executes the transform script
            // and captures its return value
            const transformFunction = new Function('data', `
              try {
                // Execute the script directly and return its result
                return (function(data) {
                  ${transformScript}
                })(data);
              } catch (e) {
                console.error('Transform script error:', e);
                return { error: e.message, routePath: "help" };
              }
            `);
            
            outputData = transformFunction(JSON.parse(JSON.stringify(inputData)));
            console.log('Transform output data:', outputData);
          } catch (error) {
            const typedError = error as Error;
            throw new Error(`JSON transform error: ${typedError.message}`);
          }
          break;
          
        case 'text':
          try {
            // Extract text from input
            let inputText = '';
            if (typeof inputData === 'object' && inputData !== null) {
              if (typeof (inputData as any).text === 'string') {
                inputText = (inputData as any).text;
              } else if (typeof (inputData as any).output === 'string') {
                inputText = (inputData as any).output;
              } else {
                inputText = JSON.stringify(inputData);
              }
            } else {
              inputText = String(inputData);
            }
            
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
          } catch (error) {
            const typedError = error as Error;
            throw new Error(`Text transform error: ${typedError.message}`);
          }
          break;
          
        case 'filter':
          try {
            // Extract array to filter from input
            let dataToFilter: any[] = [];
            
            if (Array.isArray(inputData)) {
              dataToFilter = inputData;
            } else if (typeof inputData === 'object' && inputData !== null) {
              if (Array.isArray((inputData as any).items)) {
                dataToFilter = (inputData as any).items;
              }
            }
            
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
          } catch (error) {
            const typedError = error as Error;
            throw new Error(`Filter transform error: ${typedError.message}`);
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
          } catch (error) {
            const typedError = error as Error;
            throw new Error(`Extract transform error: ${typedError.message}`);
          }
          break;
          
        default:
          throw new Error(`Unknown transform type: ${transformType}`);
      }
      
      // Return the transformed data in NodeExecutionData format
      const now = new Date();
      
      return {
        items: [
          {
            json: {
              ...outputData,
              result: outputData,
              transformed: outputData
            }
          }
        ],
        meta: {
          startTime: now,
          endTime: now,
          status: 'success'
        }
      };
    } catch (error: any) {
      console.error(`Error executing transform node:`, error);
      const now = new Date();
      
      return {
        items: [
          {
            json: {
              error: error.message || 'Error processing transform'
            }
          }
        ],
        meta: {
          startTime: now,
          endTime: now,
          status: 'error',
          message: error.message || 'Error processing transform'
        }
      };
    }
  }
};
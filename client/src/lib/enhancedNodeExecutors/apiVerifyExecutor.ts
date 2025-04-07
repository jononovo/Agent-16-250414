/**
 * API Verify Node Executor for Client-Centric Architecture
 * 
 * This executor handles API action verification to check if an API call
 * actually performed its intended action, not just returned a success response.
 * 
 * It's especially useful for catching cases where an API reports success but
 * the desired side effect didn't occur.
 */

import { apiClient } from '../apiClient';
import { ApiVerifyNodeSettings } from '../types/apiVerification';

/**
 * Execute an API Verify node with the given settings and input
 * 
 * @param nodeData - The node configuration data
 * @param input - The input data to the node (typically the API response)
 * @returns Verification result: {success, verified, original, verification}
 */
export async function executeApiVerifyNode(nodeData: any, input: any): Promise<any> {
  console.log('Executing API Verify node with input:', JSON.stringify(input));
  
  // Extract settings from node data with defaults
  const settings: ApiVerifyNodeSettings = {
    verificationMethod: nodeData.verificationMethod || 'get_check',
    verificationEndpoint: nodeData.verificationEndpoint || '',
    verificationProperty: nodeData.verificationProperty || 'id',
    verificationValue: nodeData.verificationValue || '',
    verificationValueFrom: nodeData.verificationValueFrom || 'id',
    verificationFunction: nodeData.verificationFunction || '',
    failOnVerificationFailure: nodeData.failOnVerificationFailure || false,
    verificationDelay: nodeData.verificationDelay || 0
  };

  // Prepare result with original input
  const result: {
    success: boolean;
    verified: boolean;
    original: any;
    verification: any;
    error: string | null;
  } = {
    success: true, // Overall operation success
    verified: false, // Whether the API action was verified
    original: input, // Original API response 
    verification: null, // Verification data
    error: null // Error message if any
  };
  
  try {
    // Apply verification delay if specified
    if (settings.verificationDelay && settings.verificationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, settings.verificationDelay));
    }
    
    // Execute verification based on the method
    if (settings.verificationMethod === 'get_check') {
      // Extract the verification value from the original input
      let valueToCheck = settings.verificationValue;
      
      if (settings.verificationValueFrom) {
        // Get the property value from the input
        valueToCheck = input[settings.verificationValueFrom];
        
        // Handle nested properties
        if (settings.verificationValueFrom.includes('.')) {
          const parts = settings.verificationValueFrom.split('.');
          let current = input;
          for (const part of parts) {
            if (current && typeof current === 'object') {
              current = current[part];
            } else {
              current = undefined;
              break;
            }
          }
          valueToCheck = current;
        }
      }
      
      if (!valueToCheck) {
        throw new Error(`Verification value not found in input using key: ${settings.verificationValueFrom}`);
      }
      
      // Make verification request
      const verificationResponse = await apiClient.get(settings.verificationEndpoint);
      
      // Set the verification data
      result.verification = verificationResponse;
      
      // Check for the value in the results
      if (Array.isArray(verificationResponse)) {
        // Search in array of results
        const found = verificationResponse.find(item => {
          // Check if the property exists and matches
          return item && item[settings.verificationProperty] === valueToCheck;
        });
        
        // Set verified based on whether the item was found
        result.verified = !!found;
        
        // If found, include the specific item
        if (found) {
          result.verification = found;
        }
      } else if (typeof verificationResponse === 'object') {
        // Check single object
        result.verified = 
          verificationResponse && 
          verificationResponse[settings.verificationProperty] === valueToCheck;
      }
    } else if (settings.verificationMethod === 'custom_function') {
      // Execute custom verification function
      if (!settings.verificationFunction) {
        throw new Error('Custom verification function not provided');
      }
      
      // Create a function from the string
      const verifyFn = new Function('input', 'apiClient', settings.verificationFunction);
      
      // Execute the function with the input and API client
      const verificationResult = await verifyFn(input, apiClient);
      
      // Set the verification data
      result.verification = verificationResult;
      
      // Determine if verified based on the function result
      if (typeof verificationResult === 'boolean') {
        result.verified = verificationResult;
      } else if (verificationResult && typeof verificationResult === 'object') {
        // If an object is returned, check for verified property
        result.verified = !!verificationResult.verified;
      } else {
        // Any other result is considered unverified
        result.verified = false;
      }
    }
    
    // Handle failure if specified
    if (!result.verified && settings.failOnVerificationFailure) {
      throw new Error('API action verification failed');
    }
    
    return result;
  } catch (error) {
    console.error('API verification error:', error);
    
    // Update result with error information
    result.success = false;
    result.verified = false;
    result.error = error instanceof Error ? error.message : 'Unknown verification error';
    
    // If fail on verification failure is true, throw the error
    if (settings.failOnVerificationFailure) {
      throw error;
    }
    
    // Otherwise, return the result with error information
    return result;
  }
}
/**
 * API Verification Client
 * 
 * This module provides a client interface for verifying API actions.
 * It can be used to check if an API request actually performed its intended
 * action, not just returned a successful status code.
 */

import { apiClient } from './apiClient';
import { ApiVerificationOptions, ApiVerificationResult } from './types/apiVerification';

/**
 * Verify an API action
 * 
 * @param response The response from an API call
 * @param options Verification options
 * @returns A promise resolving to a verification result
 */
export async function verifyApiAction(
  response: any,
  options: ApiVerificationOptions
): Promise<ApiVerificationResult> {
  const result: ApiVerificationResult = {
    verified: false,
    originalResponse: response,
    verificationResponse: null,
  };
  
  try {
    // For GET-type verifications
    if (options.verificationEndpoint) {
      // Extract the value to match
      let valueToMatch = options.value;
      
      if (options.valueFrom) {
        // Extract value from original response
        if (typeof response === 'object' && response !== null) {
          const parts = options.valueFrom.split('.');
          let current = response;
          
          for (const part of parts) {
            if (current && typeof current === 'object') {
              current = current[part];
            } else {
              throw new Error(`Value not found at path ${options.valueFrom} in response`);
            }
          }
          
          valueToMatch = current;
        } else {
          throw new Error('Cannot extract valueFrom from non-object response');
        }
      }
      
      // Perform verification request
      const verificationResponse = await apiClient.get(options.verificationEndpoint);
      result.verificationResponse = verificationResponse;
      
      // Check for match
      if (Array.isArray(verificationResponse)) {
        const found = verificationResponse.find(item => {
          return item && item[options.property] === valueToMatch;
        });
        result.verified = !!found;
      } else if (verificationResponse && typeof verificationResponse === 'object') {
        result.verified = verificationResponse[options.property] === valueToMatch;
      }
      
      // Check for required properties
      if (options.requiredProperties && options.requiredProperties.length > 0) {
        if (Array.isArray(verificationResponse)) {
          // For array responses, check the matching item (if found)
          const matchingItem = verificationResponse.find(
            item => item && item[options.property] === valueToMatch
          );
          
          if (matchingItem) {
            const hasMissingProps = options.requiredProperties.some(
              prop => !(prop in matchingItem)
            );
            result.verified = result.verified && !hasMissingProps;
          }
        } else if (verificationResponse && typeof verificationResponse === 'object') {
          // For object responses, check all required properties
          const hasMissingProps = options.requiredProperties.some(
            prop => !(prop in verificationResponse)
          );
          result.verified = result.verified && !hasMissingProps;
        }
      }
    }
    
    // If custom verification function provided, use it
    if (options.customVerifier) {
      const customResult = await options.customVerifier(
        result.verificationResponse,
        response
      );
      // If custom verifier returns a boolean, use it
      // Otherwise, keep the current verification status
      if (typeof customResult === 'boolean') {
        result.verified = customResult;
      }
    }
    
    // Handle retries if needed
    if (!result.verified && options.retry && options.retryAttempts) {
      let retryCount = 0;
      const maxRetries = options.retryAttempts;
      const retryDelay = options.retryDelay || 1000;
      
      // Function to wait for the specified delay
      const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      // Keep retrying until success or max retries reached
      while (!result.verified && retryCount < maxRetries) {
        retryCount++;
        await wait(retryDelay);
        
        // Perform the same verification again
        const retryResult = await verifyApiAction(response, {
          ...options,
          retry: false, // Prevent further retries to avoid infinite loop
        });
        
        // Update the result
        result.verified = retryResult.verified;
        result.verificationResponse = retryResult.verificationResponse;
        
        // If verified, break out of retry loop
        if (result.verified) {
          result.metadata = {
            ...result.metadata,
            retries: retryCount,
            verified_on_retry: true,
          };
          break;
        }
      }
      
      // Update metadata with retry information
      result.metadata = {
        ...result.metadata,
        retries: retryCount,
        max_retries: maxRetries,
      };
    }
    
    return result;
  } catch (error) {
    console.error('API verification error:', error);
    
    // Add error information to result
    result.error = error instanceof Error ? error.message : 'Unknown verification error';
    result.verified = false;
    
    return result;
  }
}

export const apiVerificationClient = {
  /**
   * Verify an API action
   * 
   * @param response The response from an API call
   * @param options Verification options
   * @returns A promise resolving to a verification result
   */
  verify: verifyApiAction,
  
  /**
   * Verify a resource creation
   * 
   * @param response API response from a creation operation
   * @param resourceType Type of resource (e.g., 'agents', 'workflows')
   * @param idField Field containing the resource ID (default: 'id')
   * @returns Verification result
   */
  verifyCreation: async (
    response: any, 
    resourceType: string,
    idField: string = 'id'
  ): Promise<ApiVerificationResult> => {
    // Extract ID from response
    const id = response[idField];
    
    if (!id) {
      return {
        verified: false,
        originalResponse: response,
        verificationResponse: null,
        error: `Response missing ${idField} field for verification`,
      };
    }
    
    // Verify the resource exists by ID
    return verifyApiAction(response, {
      verificationEndpoint: `/api/${resourceType}/${id}`,
      property: idField,
      value: id,
      retry: true,
      retryAttempts: 3,
      retryDelay: 500,
    });
  },
  
  /**
   * Verify a resource deletion
   * 
   * @param id ID of the deleted resource
   * @param resourceType Type of resource (e.g., 'agents', 'workflows')
   * @returns Verification result
   */
  verifyDeletion: async (
    id: number | string,
    resourceType: string
  ): Promise<ApiVerificationResult> => {
    // Create a dummy response object for verification functions
    const dummyResponse = { id };
    
    // Try to get the resource that should be deleted
    try {
      const getResponse = await apiClient.get(`/api/${resourceType}/${id}`);
      
      // If we successfully got the resource, it wasn't deleted
      return {
        verified: false,
        originalResponse: dummyResponse,
        verificationResponse: getResponse,
        error: 'Resource still exists after deletion',
      };
    } catch (error) {
      // If we get a 404, that's what we want - it's been deleted
      if (error.response && error.response.status === 404) {
        return {
          verified: true,
          originalResponse: dummyResponse,
          verificationResponse: error.response,
          metadata: {
            deleted: true,
            status: error.response.status,
          },
        };
      }
      
      // Any other error is unexpected
      return {
        verified: false,
        originalResponse: dummyResponse,
        verificationResponse: error.response,
        error: `Unexpected error verifying deletion: ${error.message}`,
      };
    }
  },
  
  /**
   * Verify an action with a custom verification function
   */
  verifyWithFunction: async (
    response: any,
    verifierFn: (response: any) => Promise<boolean> | boolean
  ): Promise<ApiVerificationResult> => {
    try {
      const verified = await verifierFn(response);
      
      return {
        verified,
        originalResponse: response,
        verificationResponse: { custom: true },
      };
    } catch (error) {
      return {
        verified: false,
        originalResponse: response,
        verificationResponse: null,
        error: `Custom verification failed: ${error.message}`,
      };
    }
  }
};
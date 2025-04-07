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
import { apiVerificationClient } from '../apiVerificationClient';

/**
 * Execute an API Verify node with the given settings and input
 * 
 * @param nodeData - The node configuration data
 * @param input - The input data to the node (typically the API response)
 * @returns Verification result: {success, verified, original, verification, data}
 */
export async function executeApiVerifyNode(nodeData: any, input: any): Promise<any> {
  console.log('Executing API Verify node with input:', JSON.stringify(input));
  
  // Extract settings from node data with defaults
  const settings = nodeData?.settings || {};
  const resourceType = settings.resourceType || 'agents';
  const idField = settings.idField || 'id';
  const maxRetries = settings.maxRetries || 3;
  const retryDelay = settings.retryDelay || 1000;
  
  // Prepare result with original input
  const result: {
    success: boolean;
    verified: boolean;
    data: any;
    verification: any;
    error: string | null;
  } = {
    success: true, // Overall operation success
    verified: false, // Whether the API action was verified
    data: input, // Original API response data
    verification: null, // Verification data
    error: null // Error message if any
  };
  
  try {
    // Extract the ID to verify from the input
    let idToVerify: string | number | null = null;
    
    if (input && typeof input === 'object') {
      idToVerify = input[idField];
    }
    
    if (!idToVerify) {
      throw new Error(`Verification ID not found in input using field: ${idField}`);
    }
    
    // Verify the resource creation
    const verificationResult = await apiVerificationClient.verifyCreation(
      input,
      resourceType,
      idField
    );
    
    // Update the result with verification information
    result.verified = verificationResult.verified;
    result.verification = verificationResult;
    
    if (!verificationResult.verified) {
      result.error = 'Resource verification failed';
    }
    
    return result;
  } catch (error: unknown) {
    console.error('API verification error:', error);
    
    // Update result with error information
    result.success = false;
    result.verified = false;
    
    if (error instanceof Error) {
      result.error = error.message;
    } else if (typeof error === 'string') {
      result.error = error;
    } else {
      result.error = 'Unknown verification error';
    }
    
    // Return the result with error information
    return result;
  }
}
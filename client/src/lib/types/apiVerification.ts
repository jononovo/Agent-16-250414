/**
 * API Verification Types
 * 
 * Type definitions for API verification functionality.
 */

/**
 * Verification options
 */
export interface ApiVerificationOptions {
  // The endpoint to query for verification
  verificationEndpoint: string;
  
  // Property to match in the verification response
  property: string;
  
  // Value to match in the verification response
  value: any;
  
  // Value from the original response to match against
  valueFrom?: string;
  
  // Array of properties that must be present in verification response
  requiredProperties?: string[];
  
  // Custom verification function
  customVerifier?: (response: any, originalResponse: any) => Promise<boolean> | boolean;
  
  // Whether to retry verification if it fails initially
  retry?: boolean;
  
  // Number of retry attempts
  retryAttempts?: number;
  
  // Delay between retry attempts (ms)
  retryDelay?: number;
}

/**
 * Result of API verification
 */
export interface ApiVerificationResult {
  // Was verification successful
  verified: boolean;
  
  // Original API response
  originalResponse: any;
  
  // Verification response
  verificationResponse: any;
  
  // Any error that occurred during verification
  error?: string;
  
  // Additional metadata about verification
  metadata?: Record<string, any>;
}

/**
 * Type definition for API verification node settings
 */
export interface ApiVerifyNodeSettings {
  // Verification method to use
  verificationMethod: 'get_check' | 'custom_function';
  
  // For get_check method - endpoint to query to verify the action
  verificationEndpoint: string;
  
  // For get_check method - property or field name to look for in results
  verificationProperty: string;
  
  // For get_check method - value to match against (can be a property from original request)
  verificationValue: string;
  
  // For get_check method - property in the input to use as verification value
  verificationValueFrom: string;
  
  // For custom_function - JavaScript function to verify the action
  verificationFunction: string;
  
  // Whether to throw an error if verification fails
  failOnVerificationFailure: boolean;
  
  // Delay before verification (in milliseconds)
  verificationDelay: number;
}
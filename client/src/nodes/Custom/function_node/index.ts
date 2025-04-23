/**
 * Function Node Implementation
 * 
 * This node allows users to define custom JavaScript functions
 * that transform input data and produce output.
 */

import FunctionNode from './ui';

// Default data for the node
export const defaultData = {
  label: 'Function',
  description: 'Custom JavaScript function',
  icon: 'code',
  category: 'code',  // Changed from 'functions' to 'code' to match category
  code: 'function process(input) {\n  // Your code here\n  return input;\n}',
  settingsData: {}
};

// Validator function to ensure the node is properly configured
export const validator = (data: any) => {
  const errors = [];
  
  if (!data.settingsData?.code && !data.code) {
    errors.push('Function code is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Export the component for use in the workflow editor
export const component = FunctionNode;
export default FunctionNode;
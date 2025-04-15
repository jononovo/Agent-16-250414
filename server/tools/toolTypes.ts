/**
 * Tool Types
 * 
 * This file defines the core types used by the tools system.
 */

// Tool parameter schema (using JSON Schema format)
export interface ParameterSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
}

// Result from tool execution
export interface ToolResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

// Options for tool execution
export interface ToolExecuteOptions {
  context?: string;      // The context in which the tool is being executed (e.g., "general", "canvas")
  userId?: number;       // The ID of the user executing the tool
  sessionId?: string;    // A session identifier for tracking related operations
  debug?: boolean;       // Whether to enable debug logging
}

// Core tool interface
export interface Tool {
  name: string;
  description: string;
  category: string;
  parameters?: ParameterSchema;
  contexts?: string[];    // Defines where this tool can be used (e.g., "home", "canvas")
  execute: (params: any, options?: ToolExecuteOptions) => Promise<ToolResult>;
}

// Keeping this for backwards compatibility
export interface ToolWithContext extends Tool {}

// Tool registry configuration
export interface ToolRegistryConfig {
  allowDuplicates?: boolean;   // Whether to allow duplicate tool names
  validateTools?: boolean;     // Whether to validate tools on registration
}
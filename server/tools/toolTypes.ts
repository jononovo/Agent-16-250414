/**
 * Tool Types
 * 
 * This file defines the interfaces for the tool registry system.
 */

/**
 * Tool interface - represents a function that the agent can call
 */
export interface Tool {
  name: string;
  description: string;
  category: string; // For organization: 'agent', 'workflow', 'node', 'platform'
  parameters: Record<string, unknown>; // JSON Schema format
  execute: (params: any) => Promise<any>;
  active?: boolean; // To easily enable/disable tools
}

/**
 * Tool result interface - the expected format for tool execution results
 */
export interface ToolResult {
  success: boolean;
  message?: string;
  error?: string;
  [key: string]: any; // Additional data can be included
}
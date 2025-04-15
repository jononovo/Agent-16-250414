/**
 * Shared Node Type Definitions
 * 
 * This file contains the core type definitions for node interfaces and port definitions
 * to enable consistent data transfer between nodes in workflows.
 * This is the canonical source for shared types used across the client and server.
 */

// ======================================================
// NODE COMPONENT STRUCTURE
// ======================================================

/**
 * Port definition for input/output ports on nodes
 */
export interface PortDefinition {
  type: string;            // Basic data type (string, number, object, array, etc.)
  description: string;     // Human-readable description
  isArray?: boolean;       // Whether this port accepts/produces arrays
  optional?: boolean;      // Whether this input is optional
}

/**
 * Standard interface for node input/output definitions
 */
export interface NodeInterfaceDefinition {
  inputs: Record<string, PortDefinition>;
  outputs: Record<string, PortDefinition>;
}

/**
 * Node Schema
 * Defines the core schema for node configuration
 */
export interface NodeSchema {
  inputs: Record<string, {
    type: string;
    description: string;
    optional?: boolean;
    isArray?: boolean;
  }>;
  outputs: Record<string, {
    type: string;
    description: string;
    optional?: boolean;
    isArray?: boolean;
  }>;
  parameters?: Record<string, {
    type: string;
    description: string;
    default?: any;
    required?: boolean;
    options?: Array<{
      value: string | number | boolean;
      label: string;
    }>;
  }>;
}

/**
 * Node Definition
 * Defines the core attributes and behavior of a node
 */
export interface NodeDefinition {
  type: string;                       // Unique identifier
  name: string;                       // Display name
  description: string;                // What the node does 
  category: string;                   // Grouping category
  version: string;                    // Semantic version
  icon?: string;                      // Icon identifier
  inputs: Record<string, PortDefinition>;   // Input ports
  outputs: Record<string, PortDefinition>;  // Output ports
  configOptions?: NodeConfigOption[]; // Configuration options
  defaultData?: Record<string, any>;  // Default data for node initialization
}

/**
 * Node Configuration Option
 * Defines a configurable parameter for a node
 */
export interface NodeConfigOption {
  key: string;            // Unique identifier
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'json';
  description: string;    // Human-readable description
  default?: any;          // Default value
  options?: Array<{       // For select/multiselect types
    value: string | number | boolean;
    label: string;
  }>;
}

// ======================================================
// EXECUTION DATA STRUCTURES
// ======================================================

/**
 * WorkflowItem - The basic unit of data passed between nodes
 */
export interface WorkflowItem {
  json: any;              // The actual data
  text?: string;          // Text representation
  meta?: {
    source?: string;      // Data source
    timestamp?: Date;     // Creation time
    outputType?: string;  // For multi-output nodes
    context?: Record<string, any>;  // Additional metadata
  };
  binary?: {              // For binary data (images, files, etc.)
    mimeType: string;
    data: string;
    filename?: string;
  };
}

/**
 * NodeExecutionData - Standard output format from node execution
 */
export interface NodeExecutionData {
  items: WorkflowItem[];  // Output data items
  meta: {
    startTime: Date;           // When execution started
    endTime: Date;             // When execution completed
    source?: string;           // Source node identifier
    error?: boolean;           // Whether execution resulted in an error
    errorMessage?: string;     // Error message if error is true
    warning?: string;          // Non-critical warning message
    itemsProcessed?: number;   // Processing count
    sourceOperation?: string;  // Source operation
    [key: string]: any;        // Additional metadata properties
  };
}

/**
 * Enhanced Node Executor
 * Interface for node executor implementations
 */
export interface EnhancedNodeExecutor {
  definition?: any;       // Node definition reference
  execute: (              // Execution function
    nodeData: Record<string, any>, 
    inputs: Record<string, NodeExecutionData>
  ) => Promise<NodeExecutionData>;
}

/**
 * Helper function to create a workflow item
 */
export function createWorkflowItem(
  data: any,
  source: string = 'unknown',
  binary?: WorkflowItem['binary']
): WorkflowItem {
  return {
    json: data,
    text: typeof data === 'string' ? data : JSON.stringify(data),
    meta: {
      source,
      timestamp: new Date()
    },
    binary
  };
}
/**
 * Folder-Based Node System Type Definitions
 * 
 * This file provides the core types for the folder-based node architecture.
 * It defines the structure and interfaces for node definitions, data flow,
 * and execution within the system.
 */

import { PortDefinition as BasePortDefinition } from '../lib/types';

// ======================================================
// NODE COMPONENT STRUCTURE
// ======================================================

/**
 * Node Definition
 * Defines the core attributes and behavior of a node
 */
export interface NodeDefinition {
  type: string;                        // Unique identifier
  name: string;                        // Display name
  description: string;                 // What the node does 
  category: string;                    // Grouping category
  version: string;                     // Semantic version
  icon?: string;                       // Icon identifier
  inputs: Record<string, PortDefinition>;    // Input ports
  outputs: Record<string, PortDefinition>;   // Output ports
  configOptions?: NodeConfigOption[];  // Configuration options
}

/**
 * Port Definition
 * Defines a connection point (input/output)
 * Extends the base port definition to add folder-specific properties
 */
export interface PortDefinition extends BasePortDefinition {
  optional?: boolean;     // Whether port is optional
  isArray?: boolean;      // Whether port accepts arrays
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
 * Workflow Item
 * The basic unit of data passed between nodes
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
 * Node Execution Data
 * Output data structure from node execution
 */
export interface NodeExecutionData {
  items: WorkflowItem[];  // Output data items
  meta: {
    startTime: Date;      // When execution started
    endTime?: Date;       // When execution completed
    itemsProcessed?: number;  // Processing count
    sourceOperation?: string; // Source operation 
    error?: boolean;      // Whether an error occurred
    [key: string]: any;   // Additional metadata
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
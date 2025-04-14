/**
 * Node System Types
 * 
 * This is the consolidated type definition file for the node system.
 * All types related to node definition, configuration, and execution 
 * should be defined here.
 */

// ======= Core Node Structure =======

/**
 * Node definition interface
 * Used to define the characteristics and behavior of a node
 */
export interface NodeDefinition {
  type: string;               // Unique identifier for this node type
  name: string;               // Display name in the UI
  description: string;        // Description of what this node does
  category: string;           // Category for grouping in the UI
  icon: any;                  // Icon for this node
  version?: string;           // Version of this node
  defaultData?: Record<string, any>; // Default data for the node
  inputs: Record<string, PortDefinition>;  // Node inputs
  outputs: Record<string, PortDefinition>; // Node outputs
}

// ======= Connection Interfaces =======

/**
 * Port definition for input/output connection points
 */
export interface PortDefinition {
  type: string;               // Data type (string, number, object, array, etc.)
  description: string;        // Human-readable description
  optional?: boolean;         // Whether this port is optional
  isArray?: boolean;          // Whether this port accepts/produces arrays
}

/**
 * Input/Output schema for node connections (legacy)
 * @deprecated Use PortDefinition instead
 */
export interface PortSchema {
  type: string;
  description: string;
  required?: boolean;
}

// ======= Configuration Types =======

/**
 * Node configuration option
 */
export interface NodeConfigOption {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'json';
  displayName: string;
  description: string;
  default?: any;
  options?: Array<{
    value: string | number | boolean;
    label: string;
  }>;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

/**
 * Parameter schema for node parameters (legacy)
 * @deprecated Use NodeConfigOption instead
 */
export interface ParameterSchema {
  type: string;
  description: string;
  default?: any;
  required?: boolean;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  items?: any;
  properties?: Record<string, ParameterSchema>;
}

// ======= Node Execution Types =======

/**
 * Workflow Item - The basic unit of data passed between nodes
 */
export interface WorkflowItem {
  // The actual data
  json: any;
  // Text representation (for display)
  text?: string;
  // Metadata about this data item
  meta?: {
    // The source of this data
    source?: string;
    // Timestamp when this data was created
    timestamp?: Date;
    // The output type, for nodes with multiple output types
    outputType?: string;
    // Additional context about this data
    context?: Record<string, any>;
  };
  // Binary data if applicable
  binary?: {
    mimeType: string;
    data: string;
    filename?: string;
  };
}

/**
 * Node Execution Data - Data structure for node outputs
 */
export interface NodeExecutionData {
  // Array of workflow items produced by this node
  items: WorkflowItem[];
  // Metadata about the execution
  meta: {
    // When execution started
    startTime: Date;
    // When execution ended
    endTime?: Date;
    // Number of items processed
    itemsProcessed?: number;
    // Source operation that produced this data
    sourceOperation?: string;
    // Error flag
    error?: boolean;
    // Additional metadata
    [key: string]: any;
  };
}

/**
 * Node State - Represents the execution state of a node
 */
export interface NodeState {
  // Current execution status
  status: 'pending' | 'running' | 'completed' | 'error' | 'success' | 'waiting';
  // When execution started
  startTime: Date;
  // When execution ended (if completed)
  endTime: Date | null;
  // Error message (if status is error)
  error?: string;
  // Output data (if status is completed)
  output?: any;
  // Input data that was provided to the node
  input?: any;
  // Name of the node for display
  nodeName?: string;
  // Status or progress message
  message?: string;
}

/**
 * Workflow Execution State - Tracks the execution of a workflow
 */
export interface WorkflowExecutionState {
  // Overall workflow status
  status: 'pending' | 'running' | 'completed' | 'error';
  // Start time of workflow execution
  startTime: Date;
  // End time of workflow execution
  endTime: Date | null;
  // Error message (if status is error)
  error?: string;
  // State of each node
  nodeStates: Record<string, NodeState>;
  // Outputs from each node
  nodeOutputs: Record<string, NodeExecutionData>;
  // Final output of the workflow (if completed)
  output?: NodeExecutionData;
}

/**
 * Enhanced Node Executor - Interface for node executor implementations
 */
export interface EnhancedNodeExecutor {
  // Node definition
  definition?: any;
  // Execute function
  execute: (nodeData: Record<string, any>, inputs: Record<string, NodeExecutionData>) => Promise<NodeExecutionData>;
}

// ======= Legacy Types (for compatibility) =======

/**
 * Complete schema for a node (legacy)
 * @deprecated Use NodeDefinition instead
 */
export interface NodeSchema {
  inputs: Record<string, PortSchema>;
  outputs: Record<string, PortSchema>;
  parameters: Record<string, ParameterSchema>;
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
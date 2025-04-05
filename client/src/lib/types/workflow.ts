/**
 * Enhanced Workflow Engine Type Definitions
 * 
 * This file contains all the type definitions for the enhanced workflow engine.
 * It includes the standardized data structures for workflow execution.
 */

/**
 * Workflow Item - The basic unit of data passed between nodes
 */
export interface WorkflowItem {
  // The actual data
  json: any;
  
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
 * Helper function to create a workflow item
 */
export function createWorkflowItem(
  data: any,
  source: string = 'unknown',
  binary?: WorkflowItem['binary']
): WorkflowItem {
  return {
    json: data,
    meta: {
      source,
      timestamp: new Date()
    },
    binary
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
    
    // Additional metadata
    [key: string]: any;
  };
}

/**
 * Helper function to create execution data from a simple value
 */
export function createExecutionDataFromValue(value: any, source: string = 'unknown'): NodeExecutionData {
  return {
    items: [createWorkflowItem(value, source)],
    meta: {
      startTime: new Date(),
      endTime: new Date(),
      itemsProcessed: 1,
      sourceOperation: source
    }
  };
}

/**
 * Node Definition
 */
export interface NodeDefinition {
  // Unique identifier for this node type
  type: string;
  
  // Display name in the UI
  displayName: string;
  
  // Description of what this node does
  description: string;
  
  // Icon for this node
  icon: string;
  
  // Category for grouping
  category: string;
  
  // Version of this node
  version: string;
  
  // Input parameters
  inputs: Record<string, {
    type: string;
    displayName: string;
    description: string;
    required?: boolean;
    default?: any;
  }>;
  
  // Output parameters
  outputs: Record<string, {
    type: string;
    displayName: string;
    description: string;
  }>;
}

/**
 * Node State - Represents the execution state of a node
 */
export interface NodeState {
  // Current execution status
  status: 'pending' | 'running' | 'completed' | 'error';
  
  // When execution started
  startTime: Date;
  
  // When execution ended (if completed)
  endTime: Date | null;
  
  // Error message (if status is error)
  error?: string;
  
  // Output data (if status is completed)
  output?: NodeExecutionData;
}

/**
 * Workflow Data - Represents a workflow
 */
export interface WorkflowData {
  // Nodes in the workflow
  nodes: Array<{
    id: string;
    type: string;
    data: Record<string, any>;
    position?: { x: number; y: number };
  }>;
  
  // Edges connecting nodes
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>;
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
  definition: NodeDefinition;
  
  // Execute function
  execute: (nodeData: Record<string, any>, inputs: Record<string, NodeExecutionData>) => Promise<NodeExecutionData>;
}
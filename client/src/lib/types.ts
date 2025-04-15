/**
 * Unified Type Definitions for the Node System
 * 
 * This file contains the core type definitions used across the node system,
 * focusing on the folder-based architecture implementation.
 */

import { ReactNode } from 'react';

// =======================================================
// NODE REGISTRATION AND STRUCTURE
// =======================================================

/**
 * Node Metadata
 * Core display and categorization info for a node type
 */
export interface NodeMetadata {
  name: string;          // Display name
  description: string;   // Brief description of functionality
  category: string;      // Category for grouping in UI
  version: string;       // Semantic version
  tags?: string[];       // Tags for filtering/searching
  color?: string;        // Theme color (optional)
}

/**
 * Port Definition
 * Defines an input or output connection point
 */
export interface PortDefinition {
  type: string;          // Data type (string, number, object, etc.)
  description: string;   // Human-readable description
  required?: boolean;    // Whether this port is required
  default?: any;         // Default value if any
}

/**
 * Node Schema
 * Defines the interface and data structure of a node
 */
export interface NodeSchema {
  inputs: Record<string, PortDefinition>;
  outputs: Record<string, PortDefinition>;
  parameters?: Record<string, {
    type: string;
    description: string;
    default?: any;
    options?: any[];     // For select/enum parameters
  }>;
}

// =======================================================
// NODE EXECUTION AND BEHAVIOR
// =======================================================

/**
 * Node Executor
 * Responsible for runtime execution of a node
 */
export interface NodeExecutor<T = any> {
  execute: (data: T, inputs?: Record<string, any>) => Promise<Record<string, any>>;
  defaultData: T;        // Default configuration data
}

/**
 * Validation Result
 * Result of validating node configuration
 */
export interface NodeValidationResult {
  valid: boolean;        // Whether validation passed
  errors: string[];      // Error messages if invalid
}

/**
 * UI Component Props
 * Props passed to node UI components
 */
export interface NodeUIComponentProps<T = any> {
  data: T;               // Node configuration data
  onChange: (data: T) => void;  // Handler for data changes
}

/**
 * Node Registry Entry
 * Complete definition of a node in the registry
 */
export interface NodeRegistryEntry {
  type: string;          // Unique identifier for this node type
  metadata: NodeMetadata;
  schema: NodeSchema;
  executor: NodeExecutor;
  ui: React.FC<NodeUIComponentProps>;
  validator?: (data: any) => NodeValidationResult;
  icon?: ReactNode;      // Node icon for UI
}

/**
 * Node Category
 * Used for grouping nodes in the UI
 */
export interface NodeCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  nodeCount: number;
}
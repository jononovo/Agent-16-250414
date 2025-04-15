/**
 * Node Type Definitions - For Folder-Based Node System
 * 
 * This file contains necessary types for the modern folder-based node system.
 * All execution-related types are imported from '../lib/types/workflow'.
 */

import {
  WorkflowItem,
  NodeExecutionData,
  EnhancedNodeExecutor,
  createWorkflowItem
} from '../lib/types/workflow';

/**
 * Node Schema - Describes the structure of a node for registration
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
 * Port Definition - For node inputs/outputs
 */
export interface PortDefinition {
  type: string;
  description: string;
  optional?: boolean;
  isArray?: boolean;
}

/**
 * Node Definition - Core structure for node registration
 */
export interface NodeDefinition {
  type: string;
  name: string;
  description: string;
  category: string;
  version: string;
  icon?: string;
  inputs: Record<string, PortDefinition>;
  outputs: Record<string, PortDefinition>;
  configOptions?: NodeConfigOption[];
  defaultData?: Record<string, any>;
}

/**
 * Node Configuration Option
 */
export interface NodeConfigOption {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'json';
  description: string;
  default?: any;
  options?: Array<{
    value: string | number | boolean;
    label: string;
  }>;
}

// Re-export execution types from workflow.ts
export { WorkflowItem, NodeExecutionData, EnhancedNodeExecutor, createWorkflowItem };
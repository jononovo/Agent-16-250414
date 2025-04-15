/**
 * IMPORTANT: This file is deprecated. 
 * These types have been consolidated in client/src/lib/types/workflow.ts.
 * 
 * Please import node types from '../lib/types/workflow' instead.
 * 
 * This file is kept for backward compatibility but will be removed in a future update.
 */

import { PortDefinition as BasePortDefinition } from '../lib/types';
import { 
  NodeDefinition as ClientNodeDefinition,
  WorkflowItem,
  NodeExecutionData,
  EnhancedNodeExecutor,
  createWorkflowItem
} from '../lib/types/workflow';

// Define interfaces needed by node definition files
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

export interface PortDefinition {
  type: string;
  description: string;
  optional?: boolean;
  isArray?: boolean;
}

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

// Re-export the execution types from workflow.ts
export { WorkflowItem, NodeExecutionData, EnhancedNodeExecutor, createWorkflowItem };
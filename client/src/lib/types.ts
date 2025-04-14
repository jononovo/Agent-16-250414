/**
 * Shared type definitions for the node system
 * 
 * This file contains the type definitions used across the node system.
 */

import { ReactNode } from 'react';

/**
 * Node Metadata interface
 * 
 * Defines metadata about a node type, including its display properties
 */
export interface NodeMetadata {
  name: string;
  description: string;
  category: string;
  version: string;
  tags?: string[];
  color?: string;
  icon?: ReactNode;
}

/**
 * Node Schema interface
 * 
 * Defines the schema for a node, including its inputs, outputs, and parameters
 */
export interface NodeSchema {
  inputs: Record<string, {
    type: string;
    description: string;
    required?: boolean;
    default?: any;
  }>;
  outputs: Record<string, {
    type: string;
    description: string;
  }>;
  parameters?: Record<string, {
    type: string;
    description: string;
    default?: any;
    options?: any[];
  }>;
}

/**
 * Node Executor interface
 * 
 * Defines the executor functions for a node
 */
export interface NodeExecutor<T = any> {
  execute: (data: T, inputs?: Record<string, any>) => Promise<Record<string, any>>;
  defaultData: T;
}

/**
 * Node Validator Result interface
 * 
 * Defines the result of validating node data
 */
export interface NodeValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Node UI Component Props interface
 * 
 * Defines the props for a node's UI component
 */
export interface NodeUIComponentProps<T = any> {
  data: T;
  onChange: (data: T) => void;
}

/**
 * Node Registry Entry interface
 * 
 * Defines a registry entry for a node type
 */
export interface NodeRegistryEntry {
  type: string;
  metadata: NodeMetadata;
  schema: NodeSchema;
  executor: NodeExecutor;
  ui: React.FC<NodeUIComponentProps>;
  validator?: (data: any) => NodeValidationResult;
  defaultData?: any;
  icon?: React.ReactNode;  // Allow icon to be part of the registry entry
}
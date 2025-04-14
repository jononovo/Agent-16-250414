/**
 * Node Types
 * 
 * Common types used across node definitions
 */

// Parameter schema for node parameters
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

// Input/Output schema for node connections
export interface PortSchema {
  type: string;
  description: string;
  required?: boolean;
}

// Port definition for folder-based nodes
export interface PortDefinition {
  type: string;
  description: string;
}

// Complete schema for a node
export interface NodeSchema {
  inputs: Record<string, PortSchema>;
  outputs: Record<string, PortSchema>;
  parameters: Record<string, ParameterSchema>;
}

// Newer node definition interface for folder-based nodes
export interface NodeDefinition {
  type: string;
  name: string;
  description: string;
  category: string;
  icon: any;
  defaultData?: Record<string, any>;
  inputs: Record<string, PortDefinition>;
  outputs: Record<string, PortDefinition>;
}
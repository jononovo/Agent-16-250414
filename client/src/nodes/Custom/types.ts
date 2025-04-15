/**
 * Node Types Definitions
 * 
 * This file contains type definitions for Custom nodes
 */

/**
 * Node Definition Interface
 * Defines the structure of a node in the workflow system
 */
export interface NodeDefinition {
  type: string;
  name: string;
  description: string;
  icon: string | any;
  category: string;
  version: string;
  inputs: Record<string, InputOutputDefinition>;
  outputs: Record<string, InputOutputDefinition>;
  configOptions?: ConfigOption[];
  defaultData?: Record<string, any>;
}

/**
 * Input/Output Definition Interface
 * Defines the structure of inputs and outputs for nodes
 */
export interface InputOutputDefinition {
  type: string;
  description: string;
  optional?: boolean;
  default?: any;
}

/**
 * Configuration Option Interface
 * Defines the available configuration options for nodes
 */
export interface ConfigOption {
  key: string;
  type: string;
  description: string;
  default?: any;
  options?: string[] | { label: string; value: any }[];
}
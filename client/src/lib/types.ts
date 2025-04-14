/**
 * Common Types
 * 
 * This file contains type definitions used throughout the application
 */

// Node Registry Entry Types
export interface NodeRegistryEntry {
  type: string;
  metadata: {
    name: string;
    description: string;
    category: string;
    version: string;
    tags: string[];
    color: string;
  };
  schema: {
    inputs: Record<string, any>;
    outputs: Record<string, any>;
    parameters: Record<string, any>;
  };
  executor: {
    execute: (nodeData: any, inputs?: any) => Promise<any>;
  };
  ui: {
    component: React.FC<any>;
    defaultData: any;
    validator: (data: any) => { valid: boolean; errors: string[] };
  };
  icon?: React.ReactNode;
}
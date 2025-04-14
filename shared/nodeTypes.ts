/**
 * Shared Node Type Definitions
 * 
 * This file contains the core type definitions for node interfaces and port definitions
 * to enable consistent data transfer between nodes in workflows.
 */

/**
 * Port definition for input/output ports on nodes
 */
export interface PortDefinition {
  type: string;            // Basic data type (string, number, object, array, etc.)
  description: string;     // Human-readable description
  isArray?: boolean;       // Whether this port accepts/produces arrays
  optional?: boolean;      // Whether this input is optional
}

/**
 * Standard interface for node input/output definitions
 */
export interface NodeInterfaceDefinition {
  inputs: Record<string, PortDefinition>;
  outputs: Record<string, PortDefinition>;
}
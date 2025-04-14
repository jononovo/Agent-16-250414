/**
 * Decision Node Definition
 * 
 * This file defines the metadata and schema for the Decision node.
 */

// Node metadata
export const metadata = {
  name: "Decision",
  description: "Create conditional branches in workflows based on rules",
  category: "logic", // Embedded category information
  version: "1.0.0",
  tags: ["logic", "decision", "branch", "condition", "if", "else"],
  color: "#10B981" // Emerald color
};

// Node schema
export const schema = {
  inputs: {
    value: {
      type: "any",
      description: "Value to evaluate against conditions"
    }
  },
  outputs: {
    true: {
      type: "any",
      description: "Output if condition is true"
    },
    false: {
      type: "any",
      description: "Output if condition is false"
    },
    error: {
      type: "string",
      description: "Error message if the condition evaluation fails"
    }
  },
  parameters: {
    condition: {
      type: "string",
      description: "JavaScript expression for the condition (e.g., value > 10)",
      default: "value === true"
    }
  }
};
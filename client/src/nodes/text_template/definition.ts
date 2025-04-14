/**
 * Text Template Node Definition
 * 
 * This file defines the metadata and schema for the Text Template node.
 */

// Node metadata
export const metadata = {
  name: "Text Template",
  description: "Create text templates with variable substitution",
  category: "text", // Embedded category information
  version: "1.0.0",
  tags: ["text", "template", "variables", "formatting"],
  color: "#3B82F6" // Blue color
};

// Node schema
export const schema = {
  inputs: {
    variables: {
      type: "object",
      description: "Variables to substitute in the template"
    }
  },
  outputs: {
    text: {
      type: "string",
      description: "The processed template with variable substitutions"
    },
    error: {
      type: "string",
      description: "Error message if the template processing fails"
    }
  },
  parameters: {
    template: {
      type: "string",
      description: "Template text with variable placeholders (e.g., {{name}})",
      default: "Hello, {{name}}!"
    }
  }
};
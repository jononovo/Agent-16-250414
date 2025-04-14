/**
 * Text Template Node Definition
 * 
 * This file defines the metadata and schema for the Text Template node.
 */

// Node metadata
export const metadata = {
  name: "Text Template",
  description: "Generate text using a template with variable placeholders",
  category: "text", // Embedded category information
  version: "1.0.0",
  tags: ["text", "template", "formatting", "variables"],
  color: "#8B5CF6" // Purple color
};

// Node schema
export const schema = {
  inputs: {
    variables: {
      type: "object",
      description: "Variables to use in the template"
    }
  },
  outputs: {
    text: {
      type: "string",
      description: "Generated text from the template"
    },
    error: {
      type: "string",
      description: "Error message if template processing fails"
    }
  },
  parameters: {
    template: {
      type: "string",
      description: "Template string with variable placeholders (e.g., {{variableName}})",
      default: "Hello, {{name}}!"
    }
  }
};
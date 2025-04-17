/**
 * Claude API Node Schema
 * 
 * This file defines the zod schema for validating node data.
 */

import { z } from 'zod';

// Define schema for Claude node data
const schema = z.object({
  // Model selection
  model: z.string().default('claude-3-sonnet-20240229'),
  
  // Parameters
  temperature: z.number().min(0).max(1).default(0.7),
  maxTokens: z.number().int().min(1).max(100000).default(2000),
  
  // Prompt data
  inputText: z.string().optional(),
  systemPrompt: z.string().optional(),
  
  // API Key
  apiKey: z.string().optional(),
  
  // Status and results
  _isProcessing: z.boolean().optional(),
  _hasError: z.boolean().optional(),
  _errorMessage: z.string().optional(),
  _generatedText: z.string().optional()
});

export default schema;
/**
 * Claude Node Definition
 * Defines the Claude node's properties, appearance, and behavior
 */

import { NodeDefinition } from '../types';
import { Sparkles } from 'lucide-react';
import React from 'react';

// Define default data for the node
const defaultData = {
  model: 'claude-3-opus-20240229',
  temperature: 0.7,
  maxTokens: 1000
};

export const nodeDefinition: NodeDefinition = {
  type: 'claude',
  name: 'Claude AI',
  description: 'Generate text using Anthropic\'s Claude AI model',
  icon: 'sparkles',
  category: 'ai',
  defaultData,
  inputs: {
    prompt: {
      type: 'string',
      description: 'Input prompt to send to Claude'
    },
    systemPrompt: {
      type: 'string',
      description: 'System instructions for Claude'
    }
  },
  outputs: {
    response: {
      type: 'string',
      description: 'Generated response from Claude'
    },
    metadata: {
      type: 'object',
      description: 'Additional metadata about the response'
    }
  }
};

// Additional metadata - not part of NodeDefinition interface but used for UI/rendering
export const nodeMetadata = {
  version: '1.0.0',
  tags: ["ai", "text generation", "claude", "llm"],
  color: "#5646ED",
  reactIcon: React.createElement(Sparkles, { size: 16 }),
  configOptions: [
    {
      key: 'model',
      type: 'select',
      description: 'Claude model to use',
      default: 'claude-3-opus-20240229',
      options: [
        { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
        { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
        { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' }
      ]
    },
    {
      key: 'temperature',
      type: 'number',
      description: 'Temperature for response generation',
      default: 0.7,
      min: 0,
      max: 1
    },
    {
      key: 'maxTokens',
      type: 'number',
      description: 'Maximum tokens to generate',
      default: 1000
    }
  ]
};

export default nodeDefinition;
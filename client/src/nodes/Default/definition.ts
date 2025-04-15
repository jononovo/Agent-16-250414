/**
 * Default Node Definition
 * 
 * This file defines the default node type, with its inputs, outputs,
 * and basic functionality.
 */

import { NodeInterfaceDefinition } from '@/shared/nodeTypes';

/**
 * Default node interface definition
 */
export const defaultNodeDefinition: NodeInterfaceDefinition = {
  inputs: {
    input: {
      type: 'any',
      description: 'General input data'
    }
  },
  outputs: {
    output: {
      type: 'any',
      description: 'General output data'
    }
  }
};

/**
 * Default node metadata
 */
export const defaultNodeInfo = {
  type: 'default',
  name: 'Default Node',
  description: 'A generic node that can be used for any purpose.',
  category: 'general',
  icon: 'box',
  defaultData: {
    label: 'Node',
    description: 'Generic node',
    settings: {}
  }
};
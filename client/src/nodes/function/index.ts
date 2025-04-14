/**
 * Function Node
 * 
 * This node allows users to write and execute custom JavaScript code
 * within their workflows.
 */

import { NodeRegistryEntry } from '../registry';
import metadata from './metadata.json';
import schema from './schema';
import * as executor from './executor';
import * as ui from './ui';
import { Code } from 'lucide-react';
import React from 'react';

const FunctionNode: NodeRegistryEntry = {
  type: 'function',
  metadata,
  schema,
  executor,
  ui: {
    component: ui.component,
    defaultData: ui.defaultData,
    validator: ui.validator
  },
  icon: React.createElement(Code, { size: 16 })
};

export default FunctionNode;
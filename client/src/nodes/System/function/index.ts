/**
 * Function Node
 * 
 * This node allows executing custom JavaScript functions.
 */

import { NodeRegistryEntry } from '../../lib/types';
import { metadata, schema } from './definition';
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
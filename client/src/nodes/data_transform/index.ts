/**
 * Data Transform Node
 * 
 * This node allows users to transform data using JavaScript expressions.
 */

import { NodeRegistryEntry } from '../registry';
import metadata from './metadata.json';
import schema from './schema';
import * as executor from './executor';
import * as ui from './ui';
import { Sparkles } from 'lucide-react';
import React from 'react';

const DataTransformNode: NodeRegistryEntry = {
  type: 'data_transform',
  metadata,
  schema,
  executor,
  ui: {
    component: ui.component,
    defaultData: ui.defaultData,
    validator: ui.validator
  },
  icon: React.createElement(Sparkles, { size: 16 })
};

export default DataTransformNode;
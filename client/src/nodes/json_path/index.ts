/**
 * JSON Path Node
 * 
 * This node allows users to extract specific data from JSON objects
 * using JSONPath expressions.
 */

import { NodeRegistryEntry } from '../registry';
import metadata from './metadata.json';
import schema from './schema';
import * as executor from './executor';
import * as ui from './ui';
import { FileJson } from 'lucide-react';
import React from 'react';

const JsonPathNode: NodeRegistryEntry = {
  type: 'json_path',
  metadata,
  schema,
  executor,
  ui: {
    component: ui.component,
    defaultData: ui.defaultData,
    validator: ui.validator
  },
  icon: React.createElement(FileJson, { size: 16 })
};

export default JsonPathNode;
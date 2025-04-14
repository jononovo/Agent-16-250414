/**
 * Text Template Node
 * 
 * This node allows users to create text templates with variable interpolation.
 */

import { NodeRegistryEntry } from '../registry';
import metadata from './metadata.json';
import schema from './schema';
import * as executor from './executor';
import * as ui from './ui';
import { FileText } from 'lucide-react';
import React from 'react';

const TextTemplateNode: NodeRegistryEntry = {
  type: 'text_template',
  metadata,
  schema,
  executor,
  ui: {
    component: ui.component,
    defaultData: ui.defaultData,
    validator: ui.validator
  },
  icon: React.createElement(FileText, { size: 16 })
};

export default TextTemplateNode;
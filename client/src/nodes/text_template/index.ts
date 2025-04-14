/**
 * Text Template Node
 * 
 * This node processes text templates with variable substitution.
 */

import { NodeRegistryEntry } from '../registry';
import { metadata, schema } from './definition';
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
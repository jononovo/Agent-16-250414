/**
 * Decision Node
 * 
 * This node allows branching in workflows based on conditions.
 */

import { NodeRegistryEntry } from '../registry';
import { metadata, schema } from './definition';
import * as executor from './executor';
import * as ui from './ui';
import { GitBranch } from 'lucide-react';
import React from 'react';

const DecisionNode: NodeRegistryEntry = {
  type: 'decision',
  metadata,
  schema,
  executor,
  ui: {
    component: ui.component,
    defaultData: ui.defaultData,
    validator: ui.validator
  },
  icon: React.createElement(GitBranch, { size: 16 })
};

export default DecisionNode;
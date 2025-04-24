/**
 * Perplexity API Node Definition
 * 
 * This node allows integration with Perplexity's AI search and answer generation API,
 * enabling powerful search capabilities within workflows.
 */

import { NodeDefinition } from '@/nodes/types';

/**
 * The Perplexity API Node definition
 */
const definition: NodeDefinition = {
  type: 'perplexity_api',
  name: 'Perplexity API',
  description: 'Searches the web using Perplexity\'s AI to find answers and information',
  category: 'ai',
  icon: 'search',
  inputs: {
    query: {
      type: 'string',
      required: true,
      description: 'The search query or question to ask',
    },
    system_prompt: {
      type: 'string',
      required: false,
      description: 'Optional system prompt to guide the AI\'s behavior',
      default: 'Be precise and concise.'
    },
    model: {
      type: 'string',
      required: false,
      description: 'The Perplexity model to use',
      default: 'llama-3.1-sonar-small-128k-online'
    },
    temperature: {
      type: 'number',
      required: false,
      description: 'Controls randomness (0-1)',
      default: 0.2
    },
    max_tokens: {
      type: 'number',
      required: false,
      description: 'Maximum tokens in the response',
      default: 1024
    },
    search_domain_filter: {
      type: 'array',
      required: false,
      description: 'Limit search results to specific domains',
      default: []
    },
    search_recency_filter: {
      type: 'string',
      required: false,
      description: 'Filter for freshness of search results',
      default: 'month'
    }
  },
  outputs: {
    answer: {
      type: 'string',
      description: 'The answer provided by Perplexity API',
    },
    citations: {
      type: 'array',
      description: 'List of sources/citations for the answer',
    },
    completion: {
      type: 'object',
      description: 'The full completion object from Perplexity API',
    }
  }
};

export default definition;
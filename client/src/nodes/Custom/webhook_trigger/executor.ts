/**
 * Webhook Trigger Node Executor
 * 
 * This file handles the execution logic for the webhook_trigger node.
 * In reality, this node doesn't directly execute - it's triggered by incoming HTTP requests.
 * This executor primarily handles webhook registration and provides a placeholder execution.
 */

import { createNodeOutput, createErrorOutput } from '../../nodeOutputUtils';

// Define the webhook trigger node data interface
interface WebhookTriggerNodeData {
  path?: string;
  secret?: string;
  authType: 'none' | 'apiKey' | 'bearer';
  methods: string[];
  workflowId?: number;
  nodeId?: string;
}

/**
 * Execute function for the webhook trigger node
 * In practice, this node is not directly executed during workflow execution,
 * but is called by the server when a webhook request is received.
 * This function is primarily used for testing and validation.
 */
export const execute = async (
  nodeData: WebhookTriggerNodeData,
  inputs?: any
): Promise<any> => {
  try {
    const startTime = new Date();
    const { path, methods } = nodeData;
    
    // For testing purposes, simulate a webhook payload
    // In a real scenario, this data would come from an HTTP request
    const simulatedPayload = inputs?.payload || {
      message: "This is a simulated webhook trigger. In production, this node waits for external HTTP requests."
    };
    
    // Generate the webhook URL that would be used in production
    const webhookUrl = generateWebhookUrl(nodeData);
    
    return createNodeOutput(
      {
        payload: simulatedPayload,
        headers: { 'content-type': 'application/json' },
        method: 'POST',
        webhookUrl
      },
      {
        startTime,
        additionalMeta: {
          webhookUrl,
          allowedMethods: methods,
          isSimulated: true
        }
      }
    );
  } catch (error: any) {
    console.error('Error in webhook_trigger executor:', error);
    return createErrorOutput(
      error.message || 'Error processing webhook trigger',
      'webhook_trigger'
    );
  }
};

/**
 * Helper function to generate the webhook URL based on node data
 */
function generateWebhookUrl(nodeData: WebhookTriggerNodeData): string {
  const { path, workflowId, nodeId } = nodeData;
  
  // Use the custom path if provided, otherwise generate a URL with workflowId and nodeId
  const endpoint = path 
    ? `webhooks/${path}` 
    : `webhooks/workflow/${workflowId}/node/${nodeId}`;
  
  // Use window.location if available, otherwise fallback to a placeholder
  let baseUrl = '';
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const host = window.location.host;
    baseUrl = `${protocol}//${host}`;
  } else {
    baseUrl = '[YOUR-APPLICATION-URL]';
  }
  
  return `${baseUrl}/api/${endpoint}`;
}
/**
 * Webhook Response Node UI Component
 * 
 * This component renders the webhook response node in the workflow editor.
 */

import React from 'react';
import { Send, ExternalLink } from 'lucide-react';
import DefaultNode from '../../Default/ui';
import { Badge } from '@/components/ui/badge';

export default function WebhookResponseNode({ id, data }: { id: string, data: any }) {
  // Extract node settings
  const settings = data?.settings || {};
  const url = settings.url || 'No URL configured';
  const method = settings.method || 'POST';
  
  // Get execution status for conditional display
  const isProcessing = data?.isProcessing;
  const isComplete = data?.isComplete;
  const hasError = data?.hasError;
  
  // Function to open URL in new tab
  const openUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  // Get the status badge based on execution state
  const getStatusBadge = () => {
    if (isProcessing) return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Sending</Badge>;
    if (isComplete) return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Sent</Badge>;
    if (hasError) return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>;
    return null;
  };
  
  // Format URL for display (truncate if too long)
  const displayUrl = url.length > 35 ? url.substring(0, 32) + '...' : url;
  
  // Node content
  const nodeContent = (
    <div className="p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Send className="h-4 w-4" />
        <span className="font-medium">Webhook Response</span>
        {getStatusBadge()}
      </div>
      
      <div className="bg-muted/80 p-2 rounded-md flex flex-col">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-muted/50">{method}</Badge>
          <div className="text-xs text-muted-foreground">Destination URL</div>
        </div>
        
        <div 
          onClick={openUrl}
          className="text-xs font-mono mt-1 truncate hover:text-primary cursor-pointer flex items-center"
          title={url}
        >
          {displayUrl}
          <ExternalLink className="h-3 w-3 ml-1 inline" />
        </div>
      </div>
      
      {/* Display retry and timeout settings if configured */}
      {(settings.retryCount > 0 || settings.timeout) && (
        <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
          {settings.retryCount > 0 && (
            <span>Retries: {settings.retryCount}</span>
          )}
          {settings.timeout && (
            <span>Timeout: {settings.timeout}ms</span>
          )}
        </div>
      )}
    </div>
  );

  // Render using the DefaultNode wrapper
  return (
    <DefaultNode 
      id={id} 
      data={{
        ...data,
        hideOutputHandles: false, // Show output handles
        type: 'webhook_response',
        childrenContent: nodeContent, // Use childrenContent instead of children
        // Pass through note properties
        note: data.note,
        showNote: data.showNote,
        // Use global settings drawer only
        useGlobalSettingsOnly: true
      }}
    />
  );
}
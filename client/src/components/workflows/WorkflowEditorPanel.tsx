import { useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  NodeTypes,
  EdgeTypes,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges
} from 'reactflow';
import 'reactflow/dist/style.css';

// Node types
import BaseNode from '../nodes/BaseNode';

interface WorkflowEditorPanelProps {
  flowData: any;
  readOnly?: boolean;
  onNodesChange?: OnNodesChange;
  onEdgesChange?: OnEdgesChange;
  onConnect?: OnConnect;
}

export default function WorkflowEditorPanel({
  flowData,
  readOnly = false,
  onNodesChange,
  onEdgesChange,
  onConnect,
}: WorkflowEditorPanelProps) {
  // Define node types
  const nodeTypes: NodeTypes = {
    default: BaseNode,
    input: BaseNode,
    output: BaseNode,
    process: BaseNode,
    prompt: BaseNode,
    api: BaseNode,
    transform: BaseNode,
    condition: BaseNode,
  };

  // Default handlers if none are provided
  const handleNodesChange = useCallback<OnNodesChange>(
    (changes) => {
      if (onNodesChange) {
        onNodesChange(changes);
      }
    },
    [onNodesChange]
  );

  const handleEdgesChange = useCallback<OnEdgesChange>(
    (changes) => {
      if (onEdgesChange) {
        onEdgesChange(changes);
      }
    },
    [onEdgesChange]
  );

  const handleConnect = useCallback<OnConnect>(
    (connection) => {
      if (onConnect) {
        onConnect(connection);
      }
    },
    [onConnect]
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={flowData.nodes || []}
        edges={flowData.edges || []}
        onNodesChange={!readOnly ? handleNodesChange : undefined}
        onEdgesChange={!readOnly ? handleEdgesChange : undefined}
        onConnect={!readOnly ? handleConnect : undefined}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls position="bottom-right" />
        <MiniMap position="bottom-left" />
      </ReactFlow>
    </div>
  );
}
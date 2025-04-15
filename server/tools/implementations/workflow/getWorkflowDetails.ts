/**
 * Get Workflow Details Tool
 * 
 * This tool retrieves detailed information about a specific workflow,
 * including its nodes and structure.
 */
import { Tool, ToolResult } from '../../toolTypes';
import { storage } from '../../../storage';

const getWorkflowDetailsTool: Tool = {
  name: 'getWorkflowDetails',
  description: 'Get detailed information about a specific workflow',
  category: 'workflow',
  parameters: {
    type: 'object',
    properties: {
      workflowId: {
        type: 'number',
        description: 'The ID of the workflow to retrieve',
      },
      includeNodes: {
        type: 'boolean',
        description: 'Whether to include node details in the result',
        default: true
      }
    },
    required: ['workflowId'],
  },
  
  async execute(params: any): Promise<ToolResult> {
    try {
      const { workflowId, includeNodes = true } = params;
      
      // Get the workflow
      const workflow = await storage.getWorkflow(workflowId);
      
      if (!workflow) {
        return {
          success: false,
          error: `Workflow with ID ${workflowId} not found`
        };
      }
      
      // Parse flow data to analyze nodes and structure
      let nodes: any[] = [];
      let edges: any[] = [];
      let nodeTypes: Record<string, number> = {};
      let structure = {
        inputNodes: 0,
        outputNodes: 0,
        processingNodes: 0,
        connectionCount: 0
      };
      
      try {
        // Parse flowData if it's a string
        let flowData: any;
        if (typeof workflow.flowData === 'string') {
          flowData = JSON.parse(workflow.flowData);
        } else {
          flowData = workflow.flowData;
        }
        
        if (flowData && flowData.nodes && Array.isArray(flowData.nodes)) {
          nodes = flowData.nodes;
          
          // Initialize nodeTypes as Record<string, number>
          const typeCounts: Record<string, number> = {};
          
          // Analyze node types
          nodes.forEach((node: any) => {
            const nodeType = node.type || (node.data && node.data.type) || 'unknown';
            
            // Count node types
            typeCounts[nodeType] = (typeCounts[nodeType] || 0) + 1;
            
            // Assign to nodeTypes
            nodeTypes = typeCounts;
            
            // Categorize nodes
            if (nodeType.includes('input') || (node.data && node.data.category === 'input')) {
              structure.inputNodes++;
            } else if (nodeType.includes('output') || (node.data && node.data.category === 'output')) {
              structure.outputNodes++;
            } else {
              structure.processingNodes++;
            }
          });
        }
        
        if (flowData && flowData.edges && Array.isArray(flowData.edges)) {
          edges = flowData.edges;
          structure.connectionCount = edges.length;
        }
      } catch (error) {
        console.error(`Error parsing workflow flow data:`, error);
      }
      
      // Prepare response
      const result: any = {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        type: workflow.type,
        status: workflow.status,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
        structure,
        nodeTypes,
        stats: {
          totalNodes: nodes.length,
          totalConnections: edges.length
        }
      };
      
      // Include nodes if requested
      if (includeNodes) {
        result.nodes = nodes;
        result.edges = edges;
      }
      
      return {
        success: true,
        message: `Retrieved workflow details for "${workflow.name}"`,
        data: result,
      };
    } catch (error) {
      console.error('Error getting workflow details:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error getting workflow details',
      };
    }
  },
};

export default getWorkflowDetailsTool;
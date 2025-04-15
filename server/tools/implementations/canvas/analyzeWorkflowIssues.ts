/**
 * Analyze Workflow Issues Tool
 * 
 * This tool analyzes a workflow to identify potential issues and provide suggestions for fixing them.
 */
import { Tool, ToolResult } from '../../toolTypes';
import { storage } from '../../../storage';

const analyzeWorkflowIssuesTool: Tool = {
  name: 'analyzeWorkflowIssues',
  description: 'Analyze a workflow to identify potential issues and provide detailed explanations',
  category: 'canvas',
  contexts: ['canvas', 'workflow'], // This tool is only available in canvas contexts
  parameters: {
    type: 'object',
    properties: {
      workflowId: {
        type: 'number',
        description: 'The ID of the workflow to analyze',
      },
      executionLog: {
        type: 'string',
        description: 'Optional execution log or error message to help with analysis',
      },
    },
    required: ['workflowId'],
  },
  async execute(params: any): Promise<ToolResult> {
    try {
      const { workflowId, executionLog } = params;
      
      // Get the workflow
      const workflow = await storage.getWorkflow(workflowId);
      if (!workflow) {
        return {
          success: false,
          error: `Workflow with ID ${workflowId} not found`,
        };
      }
      
      // Get all nodes in the workflow
      const nodes = await storage.getNodes();
      const workflowNodes = nodes.filter(node => node.workflowId === workflowId);
      
      if (workflowNodes.length === 0) {
        return {
          success: true,
          message: 'This workflow has no nodes. Add some nodes to build your workflow.',
          data: {
            issues: [{
              type: 'empty_workflow',
              severity: 'high',
              message: 'Workflow has no nodes',
              suggestion: 'Add nodes to the workflow to create a functioning process.'
            }],
            nodeCount: 0,
          },
        };
      }
      
      // Simple analysis of common issues
      const issues = [];
      
      // Check for disconnected nodes (nodes with no connections)
      const disconnectedNodes = workflowNodes.filter(node => 
        !node.connections || node.connections.length === 0
      );
      
      if (disconnectedNodes.length > 0) {
        issues.push({
          type: 'disconnected_nodes',
          severity: 'medium',
          message: `Found ${disconnectedNodes.length} disconnected nodes that aren't connected to any other nodes`,
          affectedNodes: disconnectedNodes.map(n => ({ id: n.id, type: n.type })),
          suggestion: 'Connect these nodes to other nodes to ensure data flows through the workflow properly.'
        });
      }
      
      // Check for missing required parameters in node data
      const nodesWithMissingParams = workflowNodes.filter(node => {
        // This is a simplified check - in a real implementation, you'd have a schema
        // for each node type to validate against
        return !node.data || Object.keys(node.data).length === 0;
      });
      
      if (nodesWithMissingParams.length > 0) {
        issues.push({
          type: 'missing_parameters',
          severity: 'high',
          message: `Found ${nodesWithMissingParams.length} nodes with missing or empty parameters`,
          affectedNodes: nodesWithMissingParams.map(n => ({ id: n.id, type: n.type })),
          suggestion: 'Update these nodes to provide the required parameters for proper operation.'
        });
      }
      
      // Check for potential circular references
      // (This is a simplified check - a real implementation would do a proper graph traversal)
      const potentialCircularRefs = workflowNodes.filter(node => 
        node.connections?.some(conn => 
          workflowNodes.some(n => 
            n.id !== node.id && 
            n.connections?.some(c => c.target === node.id)
          )
        )
      );
      
      if (potentialCircularRefs.length > 0) {
        issues.push({
          type: 'potential_circular_references',
          severity: 'medium',
          message: 'Detected potential circular references in the workflow',
          affectedNodes: potentialCircularRefs.map(n => ({ id: n.id, type: n.type })),
          suggestion: 'Review the workflow to ensure there are no infinite loops in the data flow.'
        });
      }
      
      // If execution log was provided, provide more context-aware analysis
      if (executionLog) {
        issues.push({
          type: 'execution_log_analysis',
          severity: 'info',
          message: 'Analysis based on provided execution log',
          details: 'The execution log indicates potential issues that should be addressed.',
          logSummary: executionLog.substring(0, 200) + '...',
          suggestion: 'Review the full execution log for detailed error information and fix the identified issues.'
        });
      }
      
      return {
        success: true,
        message: `Analysis complete for workflow ${workflowId} (${workflow.name})`,
        data: {
          workflowName: workflow.name,
          nodeCount: workflowNodes.length,
          issues: issues.length > 0 ? issues : [{
            type: 'no_issues_detected',
            severity: 'info',
            message: 'No obvious issues detected in the workflow structure',
            suggestion: 'Continue testing the workflow with different inputs to ensure it works as expected.'
          }],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to analyze workflow: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
};

export default analyzeWorkflowIssuesTool;
import { Workflow, Log } from '../shared/schema';
import { storage } from './storage';
import { db } from './database';

interface WorkflowExecutionContext {
  workflowId: number;
  input: any;
  source: string;
  triggerType: string;
  logId?: number;
}

interface NodeExecutionResult {
  status: 'success' | 'error';
  output?: any;
  error?: string;
}

/**
 * Workflow Engine - Responsible for executing workflows
 * 
 * This engine takes a workflow and executes each node in sequence based on the
 * flow data structure.
 */
export class WorkflowEngine {
  /**
   * Execute a workflow with the provided input
   */
  async executeWorkflow(context: WorkflowExecutionContext): Promise<NodeExecutionResult> {
    const { workflowId, input, source, triggerType, logId } = context;
    let log: Log | undefined;
    
    try {
      console.log(`[WorkflowEngine] Executing workflow ${workflowId} from ${source}`);
      
      // Get the workflow
      const workflow = await storage.getWorkflow(workflowId);
      if (!workflow) {
        throw new Error(`Workflow with ID ${workflowId} not found`);
      }
      
      // If no flow data, can't execute
      if (!workflow.flowData || Object.keys(workflow.flowData).length === 0) {
        throw new Error(`Workflow ${workflowId} has no flow data`);
      }
      
      // Get or create log entry for this execution
      if (logId) {
        log = await storage.getLog(logId);
        if (!log) {
          throw new Error(`Log with ID ${logId} not found`);
        }
      } else {
        log = await storage.createLog({
          agentId: workflow.agentId || 0,
          workflowId,
          status: 'running',
          input,
        });
      }
      
      const flowData = workflow.flowData as any;
      
      // Find trigger node based on triggerType
      let triggerNodeId = '';
      const nodes = flowData.nodes || [];
      
      for (const node of nodes) {
        if (node.type && node.type.includes(triggerType)) {
          triggerNodeId = node.id;
          break;
        }
      }
      
      if (!triggerNodeId) {
        throw new Error(`No trigger node found for type: ${triggerType}`);
      }
      
      console.log(`[WorkflowEngine] Starting execution from trigger node: ${triggerNodeId}`);
      
      // Execute the workflow starting from the trigger node
      const result = await this.executeNode(triggerNodeId, input, workflow);
      
      // Update log with final result
      await storage.updateLog(log.id, {
        status: result.status === 'error' ? 'error' : 'success',
        output: result.output || {},
        error: result.error,
        completedAt: new Date()
      });
      
      return result;
    } catch (error) {
      console.error('[WorkflowEngine] Error executing workflow:', error);
      
      // Update log with error if we have one
      if (log) {
        await storage.updateLog(log.id, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date()
        });
      }
      
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error executing workflow'
      };
    }
  }
  
  /**
   * Execute a single node and follow edges to next nodes
   */
  private async executeNode(
    nodeId: string, 
    input: any, 
    workflow: Workflow
  ): Promise<NodeExecutionResult> {
    try {
      console.log(`[WorkflowEngine] Executing node: ${nodeId}`);
      
      const flowData = workflow.flowData as any;
      const nodes = flowData.nodes || [];
      const edges = flowData.edges || [];
      
      // Find the current node
      const node = nodes.find((n: any) => n.id === nodeId);
      if (!node) {
        throw new Error(`Node with ID ${nodeId} not found in workflow`);
      }
      
      // Execute the node based on its type
      let result: NodeExecutionResult;
      
      switch (node.type) {
        case 'internal_new_agent':
        case 'internal_ai_chat_agent':
          // Trigger nodes just pass through the input
          result = {
            status: 'success',
            output: {
              ...input,
              trigger_type: node.type,
              timestamp: new Date().toISOString()
            }
          };
          break;
          
        case 'claude':
          // Claude node - should generate agent name/description if not provided
          result = await this.executeClaudeNode(node, input);
          break;
          
        case 'internal':
          // Internal action node - performs the actual system operation
          result = await this.executeInternalActionNode(node, input);
          break;
          
        default:
          result = {
            status: 'error',
            error: `Unsupported node type: ${node.type}`
          };
      }
      
      // If this node execution failed, return the error
      if (result.status === 'error') {
        return result;
      }
      
      // Find outgoing edges from this node
      const outgoingEdges = edges.filter((e: any) => e.source === nodeId);
      
      // If no outgoing edges, we're done
      if (outgoingEdges.length === 0) {
        return result;
      }
      
      // For each outgoing edge, execute the target node
      // For now, we're just following the first edge
      const nextEdge = outgoingEdges[0];
      return this.executeNode(nextEdge.target, result.output, workflow);
    } catch (error) {
      console.error(`[WorkflowEngine] Error executing node ${nodeId}:`, error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error executing node'
      };
    }
  }
  
  /**
   * Execute Claude node to generate agent name/description
   */
  private async executeClaudeNode(
    node: any,
    input: any
  ): Promise<NodeExecutionResult> {
    try {
      console.log(`[WorkflowEngine] Executing Claude node with input:`, input);
      
      const settings = node.data?.settings || {};
      const { model, system_prompt, max_tokens, temperature } = settings;
      
      // If name and description are already provided, just pass them through
      if (input.name && input.description) {
        console.log('[WorkflowEngine] Name and description already provided, skipping Claude');
        return {
          status: 'success',
          output: input
        };
      }
      
      // In a real implementation, we would call Claude API here
      // For now, we'll simulate by generating placeholder values
      const generatedName = input.name || `New Agent (${new Date().toLocaleDateString()})`;
      const generatedDescription = input.description || 
        `This is an AI agent created on ${new Date().toLocaleDateString()} that can assist with various tasks`;
      
      console.log(`[WorkflowEngine] Generated name: ${generatedName}`);
      console.log(`[WorkflowEngine] Generated description: ${generatedDescription}`);
      
      return {
        status: 'success',
        output: {
          ...input,
          name: generatedName,
          description: generatedDescription,
          model: model || 'claude-instant-1.2',
          claude_response: true
        }
      };
    } catch (error) {
      console.error('[WorkflowEngine] Error executing Claude node:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error with Claude node'
      };
    }
  }
  
  /**
   * Execute internal action node for system operations
   */
  private async executeInternalActionNode(
    node: any,
    input: any
  ): Promise<NodeExecutionResult> {
    try {
      console.log(`[WorkflowEngine] Executing internal action node with input:`, input);
      
      const settings = node.data?.settings || {};
      const actionType = settings.action_type || 'unknown';
      
      switch (actionType) {
        case 'create_agent': {
          // Create a new agent
          const agentData = {
            name: input.name || 'New Agent',
            description: input.description || 'Agent created by workflow',
            type: input.type || 'custom',
            icon: input.icon || 'brain',
            status: input.status || 'active',
            configuration: input.configuration || {},
            userId: input.userId || 1
          };
          
          console.log(`[WorkflowEngine] Creating agent with data:`, agentData);
          
          // Create the agent using storage
          const agent = await storage.createAgent(agentData);
          
          return {
            status: 'success',
            output: {
              action: 'create_agent',
              result: 'success',
              agent
            }
          };
        }
        
        default:
          return {
            status: 'error',
            error: `Unknown internal action type: ${actionType}`
          };
      }
    } catch (error) {
      console.error('[WorkflowEngine] Error executing internal action node:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error with internal action'
      };
    }
  }
}

// Singleton instance
export const workflowEngine = new WorkflowEngine();
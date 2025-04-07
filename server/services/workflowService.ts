/**
 * Workflow Service
 * 
 * This service provides API for workflow-related operations.
 * It delegates workflow execution to the client when possible,
 * and provides server-side APIs for operations that need
 * server resources (DB, API keys, etc.)
 */

import { storage } from '../storage';
import type { Agent, Workflow, InsertWorkflow, Log, InsertLog } from '@shared/schema';

/**
 * Client-Centric Workflow Service
 * 
 * This service follows the pattern of delegating workflow execution to the client
 * and providing server-side APIs for persistence and API proxying.
 */
export class WorkflowService {
  /**
   * Get a workflow by ID
   */
  async getWorkflow(id: number): Promise<Workflow | undefined> {
    return storage.getWorkflow(id);
  }
  
  /**
   * Get all workflows, optionally filtered by type
   */
  async getWorkflows(type?: string): Promise<Workflow[]> {
    return storage.getWorkflows(type);
  }
  
  /**
   * Get workflows associated with an agent
   */
  async getWorkflowsByAgentId(agentId: number): Promise<Workflow[]> {
    return storage.getWorkflowsByAgentId(agentId);
  }
  
  /**
   * Create a new workflow
   */
  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
    return storage.createWorkflow(workflow);
  }
  
  /**
   * Update a workflow
   */
  async updateWorkflow(id: number, workflow: Partial<Workflow>): Promise<Workflow | undefined> {
    return storage.updateWorkflow(id, workflow);
  }
  
  /**
   * Delete a workflow
   */
  async deleteWorkflow(id: number): Promise<boolean> {
    return storage.deleteWorkflow(id);
  }
  
  /**
   * Create a log entry for workflow execution
   */
  async createLog(log: InsertLog): Promise<Log> {
    return storage.createLog(log);
  }
  
  /**
   * Update a log entry
   */
  async updateLog(id: number, log: Partial<Log>): Promise<Log | undefined> {
    return storage.updateLog(id, log);
  }
  
  /**
   * Get logs for an agent
   */
  async getLogs(agentId?: number, limit: number = 20): Promise<Log[]> {
    return storage.getLogs(agentId, limit);
  }
  
  /**
   * Get a log by ID
   */
  async getLog(id: number): Promise<Log | undefined> {
    return storage.getLog(id);
  }
  
  /**
   * Link a workflow to an agent
   */
  async linkWorkflowToAgent(workflowId: number, agentId: number): Promise<Workflow | undefined> {
    // First, get the workflow
    const workflow = await storage.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow with ID ${workflowId} not found`);
    }
    
    // Update the workflow with the agent ID
    return storage.updateWorkflow(workflowId, { 
      agentId
    });
  }
}

// Create a singleton instance
export const workflowService = new WorkflowService();
import { z } from "zod";

/**
 * Schema Definitions
 * 
 * This file defines the core data types for the application.
 * These types are used by both the in-memory storage and the frontend.
 */

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  password: z.string()
});

export const insertUserSchema = userSchema.omit({ id: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof userSchema>;

// Agent schema
export const agentSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  type: z.string(), // "internal", "custom", "template", "optimization"
  icon: z.string().nullable().optional(),
  status: z.string().default("active"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  userId: z.number().nullable().optional(),
  configuration: z.record(z.any()).nullable().optional()
});

export const insertAgentSchema = agentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = z.infer<typeof agentSchema>;

// Log schema
export const logSchema = z.object({
  id: z.number(),
  agentId: z.number(),
  workflowId: z.number(),
  status: z.string(), // "success", "error", "running"
  input: z.record(z.any()).default({}),
  output: z.record(z.any()).default({}),
  error: z.string().nullable().optional(),
  startedAt: z.date().default(() => new Date()),
  completedAt: z.date().nullable().optional(),
  executionPath: z.record(z.any()).default({}) // Store the flow path of execution
});

export const insertLogSchema = logSchema.omit({
  id: true,
  startedAt: true
});

export type InsertLog = z.infer<typeof insertLogSchema>;
export type Log = z.infer<typeof logSchema>;

// Workflow schema
export const workflowSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  type: z.string(), // "custom", "template"
  icon: z.string().nullable().optional(),
  status: z.string().default("draft"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  userId: z.number().nullable().optional(),
  agentId: z.number().nullable().optional(),
  flowData: z.record(z.any()).nullable().optional()
});

export const insertWorkflowSchema = workflowSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = z.infer<typeof workflowSchema>;

// Node schema
export const nodeSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  type: z.string(), // "custom", "interface", "workflow", "integration", "internal"
  icon: z.string().nullable().optional(),
  category: z.string().default(""),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  userId: z.number().nullable().optional(),
  configuration: z.record(z.any()).nullable().optional()
});

export const insertNodeSchema = nodeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  category: z.string().default("")
});

export type InsertNode = z.infer<typeof insertNodeSchema>;
export type Node = z.infer<typeof nodeSchema> & {
  // Additional fields used by the frontend
  icon?: any;
  category: string;
};

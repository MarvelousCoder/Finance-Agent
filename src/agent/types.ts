import { z } from "zod"

export type AgentTool = {
    name: string;
    description: string;
    schema: z.ZodSchema<any>;
    jsonSchema: any;
    execute: (input: any) => Promise<any>;
  };

export type ToolResult<T = any> = {
  success: boolean;
  tool: string;
  data?: T;
  error?: string;
  };
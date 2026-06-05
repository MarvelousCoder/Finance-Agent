export type ToolTrace = {
    toolName: string;
    input: any;
    output?: any;
    success: boolean;
    error?: string;
    startTime: number;
    endTime?: number;
    latencyMs: number;
};

export type RequestTrace = {
    requestId: string;
    query: string;
    startTime: number;
    endTime?: number;

    tools: ToolTrace[];

    finalOutput?: any;
  };
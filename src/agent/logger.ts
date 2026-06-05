export const logger = {
    info: (msg: string, data?: any) => {
        console.log(`[INFO] ${msg}`, data || "");
    },

    error: (msg: string, data?: any) => {
        console.error(`[ERROR] ${msg}`, data || "");
    },

    tool: (toolName: string, input: any, output: any) => {
        console.log(`[TOOL] ${toolName}`, {
            input,
            output,
        });
    },
  };
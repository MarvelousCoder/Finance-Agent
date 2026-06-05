import { addToolTrace } from "./traceStore";

export async function runToolWithTrace(
    requestId: string,
    toolName: string,
    input: any,
    toolFn: (input: any) => Promise<any>
) {
    const startTime = Date.now();

    try {
        const output = await toolFn(input);

        const endTime = Date.now();

        addToolTrace(requestId, {
            toolName,
            input,
            output,
            success: true,
            startTime,
            endTime,
            latencyMs: endTime - startTime,
        });

        return output;
    } catch (err: any) {
        const endTime = Date.now();

        addToolTrace(requestId, {
            toolName,
            input,
            success: false,
            error: err.message,
            startTime,
            endTime,
            latencyMs: endTime - startTime,
        });

        throw err;
    }
}
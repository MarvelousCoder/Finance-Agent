export type FailureType =
    | "TOOL_FAILURE"
    | "LLM_FAILURE"
    | "SCHEMA_ERROR"
    | "INVALID_TOOL_CALL"
    | "RUNTIME_ERROR";

export type FailureEvent = {
    requestId: string;
    type: FailureType;
    message: string;
    toolName?: string;
    input?: any;
    stack?: string;
    timestamp: number;
};

const failureStore = new Map<string, FailureEvent[]>();

export function recordFailure(event: FailureEvent) {
    const list = failureStore.get(event.requestId) || [];

    list.push(event);

    failureStore.set(event.requestId, list);

    console.error("[TRACE_FAILURE]", event);
}


export function getFailures(requestId: string) {
    return failureStore.get(requestId) || [];
}
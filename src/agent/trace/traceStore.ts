import {  ToolTrace } from "./types";
import { FailureEvent } from "./failureTracker";

const traceMap = new Map<string, RequestTrace>();

export function createTrace(requestId: string, query: string) {
    traceMap.set(requestId, {
        requestId,
        query,
        startTime: Date.now(),
        tools: []
    });
}

export function addToolTrace(requestId: string, toolTrace: ToolTrace) {
    const trace = traceMap.get(requestId);
    if (!trace) return;

    trace.tools.push(toolTrace);
}

export function getTrace(requestId: string) {
    return traceMap.get(requestId);
}

export function updateTrace(requestId: string, data: Partial<RequestTrace>) {
    const trace = traceMap.get(requestId);
    if (!trace) return;

    traceMap.set(requestId, { ...trace, ...data });
}

export type RequestTrace = {
    requestId: string;
    query: string;
    startTime: number;
    endTime?: number;

    tools: ToolTrace[];

    failures?: FailureEvent[];

    finalOutput?: any;
};
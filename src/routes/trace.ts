import express from "express";
import { getTrace } from "../agent/trace/traceStore";
import { getFailures } from "../agent/trace/failureTracker";

const router = express.Router();

router.get("/:requestId", (req, res) => {
    const { requestId } = req.params;

    const trace = getTrace(requestId);
    const failures = getFailures(requestId);

    if (!trace) {
        return res.status(404).json({
            error: "Trace not found"
        });
    }

    const totalToolTime = trace.tools.reduce(
        (sum, t) => sum + (t.latencyMs || 0),
        0
    );

    const response = {
        requestId: trace.requestId,
        query: trace.query,

        timing: {
            startTime: trace.startTime,
            endTime: trace.endTime,
            totalLatencyMs: trace.endTime
                ? trace.endTime - trace.startTime
                : null,
            toolLatencyMs: totalToolTime,
        },

        tools: trace.tools.map((t) => ({
            toolName: t.toolName,
            success: t.success,
            latencyMs: t.latencyMs,
            input: t.input,
            output: t.output,
            error: t.error,
        })),

        failures: failures.map((f) => ({
            type: f.type,
            message: f.message,
            toolName: f.toolName,
            input: f.input,
            timestamp: f.timestamp,
        })),

        finalOutput: trace.finalOutput,
    };

    return res.json(response);
});

router.get("/:requestId/summary", (req, res) => {
    const trace = getTrace(req.params.requestId);
    const failures = getFailures(req.params.requestId);

    if (!trace) return res.status(404).json({ error: "Not found" });

    return res.json({
        requestId: trace.requestId,
        query: trace.query,
        toolCount: trace.tools.length,
        failureCount: failures.length,
        success: failures.length === 0,
        durationMs: trace.endTime
            ? trace.endTime - trace.startTime
            : null,
    });
});

export default router;
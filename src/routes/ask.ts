import express from "express";
import { financeAgent } from "../agent/financeAgent";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { question } = req.body;

        if (!question) {
            return res.status(400).json({
                error: "Question is required"
            });
        }

        const result = await financeAgent(question);

        const answer =
            (result as any).finalResult ??
            (result as any).result ??
            "No response generated";

        return res.json({
            answer,
            requestId: result.requestId
        });

    } catch {
        return res.status(500).json({
            error: "Agent execution failed"
        });
    }
});

export default router;
import express from "express";
import { financeAgentStream } from "../agent/financeAgentStream";
import { financeAgent } from "../agent/financeAgent";

const router = express.Router();

router.post("/chat", async (req, res) => {
    const { query } = req.body;

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");

    const stream = await financeAgentStream(query);

    try {
        for await (const chunk of stream as any) {
            const content = chunk.choices[0]?.delta?.content;

            if (content) {
                res.write(content); // 🔥 stream to client
            }
        }

        res.end();
    } catch (err) {
        console.error(err);
        res.end("Error streaming response");
    }
});

router.post("/run", async (req, res) => {
    try {
        const { query } = req.body;

        const result = await financeAgent(query);

        res.json(result);
    } catch (err: any) {
        res.status(500).json({
            error: err.message
        });
    }
});

export default router;
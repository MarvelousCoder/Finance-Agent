import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import agentRouter from "./routes/agent";
import traceRouter from "./routes/trace";
import askRouter from "./routes/ask";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "../public")));

/**
 * Routes
 */
app.use("/agent", agentRouter);
app.use("/trace", traceRouter);
app.use("/ask", askRouter);

app.get("/", (_, res) => {
    res.json({
        status: "Provue Finance API running"
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
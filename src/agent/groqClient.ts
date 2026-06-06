import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

//NOTE: Groq uses OpenAI-compatible API

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not set");
}

export const groq = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
});
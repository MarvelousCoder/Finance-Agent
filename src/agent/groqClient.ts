import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

//NOTE: Groq uses OpenAI-compatible API
export const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY!,
    baseURL: "https://api.groq.com/openai/v1",
});
import { groq } from "./groqClient";
import { groqTools } from "./groqTools";
import { systemPrompt } from "./systemPrompt";
// import { toolRegistry } from "./toolRegistry";

export async function financeAgentStream(userQuery: string) {
    const messages: any[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userQuery },
    ];

    const stream = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        tools: groqTools,
        tool_choice: "auto",
        stream: true, // 🔥 IMPORTANT
    });

    return stream;
}
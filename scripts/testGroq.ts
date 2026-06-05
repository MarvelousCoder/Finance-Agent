import { groq } from "../src/agent/groqClient";

async function test() {
    const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            {
                role: "user",
                content: "Hello",
            },
        ],
    });

    console.log(
        response.choices[0].message.content
    );
}

test().catch(console.error);
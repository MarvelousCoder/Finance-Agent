import { groq } from "../src/agent/groqClient";

async function test() {
    const response = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
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
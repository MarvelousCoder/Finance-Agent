// import { zodToJsonSchema } from "zod-to-json-schema";
// import { toolRegistry } from "./toolRegistry";

// export const groqTools = toolRegistry.map((tool) => ({
//     type: "function" as const,

//     function: {
//         name: tool.name,
//         description: tool.description,

//         parameters: zodToJsonSchema(tool.schema as any) as any,
//     },
// }));


// NOTE: 2nd Updation
// import { zodToJsonSchema } from "zod-to-json-schema";
// import { toolRegistry } from "./toolRegistry";

// /**
//  * Hardens JSON schema for Groq tool calling.
//  * Prevents hallucinated fields like "all", "largest", etc.
//  */
// function strictifySchema(schema: any) {
//     return {
//         ...schema,

//         additionalProperties: false,
//         type: "object",

//         // recursively enforce strictness if properties exist
//         properties: schema.properties
//             ? Object.fromEntries(
//                 Object.entries(schema.properties).map(([key, value]: any) => [
//                     key,
//                     {
//                         ...value,
//                         // lock nested objects too
//                         additionalProperties: false,
//                     },
//                 ])
//             )
//             : undefined,
//     };
// }

// export const groqTools = toolRegistry.map((tool) => {
//     const rawSchema = zodToJsonSchema(tool.schema as any);

//     const strictSchema = strictifySchema(rawSchema);

//     return {
//         type: "function" as const,

//         function: {
//             name: tool.name,
//             description: tool.description,

//             parameters: {
//                 ...strictSchema,

//                 // INFO: CRITICAL GROQ SAFETY FLAG (logical enforcement)
//                 additionalProperties: false,
//             },
//         },
//     };
// });

import { toolRegistry } from "./toolRegistry";
import type { ChatCompletionTool } from "openai/resources/chat/completions";

function convertZodToGroqSchema(zodSchema: any) {
    const shape = zodSchema.shape;

    const properties: any = {};
    const required: string[] = [];

    for (const key in shape) {
        const field = shape[key];

        // IMPORTANT FIX: preserve enum types if present
        if (field._def?.typeName === "ZodEnum") {
            properties[key] = {
                type: "string",
                enum: field._def.values,
            };
        } else {
            properties[key] = {
                type: "string",
            };
        }

        if (!field.isOptional()) {
            required.push(key);
        }
    }

    return {
        type: "object",
        properties,
        required,
        additionalProperties: false,
    };
}

export const groqTools: ChatCompletionTool[] = toolRegistry.map((tool) => ({
    type: "function",
    function: {
        name: tool.name,
        description: tool.description,
        parameters: convertZodToGroqSchema(tool.schema),
    },
}));
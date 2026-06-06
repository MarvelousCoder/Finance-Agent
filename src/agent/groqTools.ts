// // NOTE: 1st update
// //src/agent/groqTools.ts
// import { toolRegistry } from "./toolRegistry";
// import type { ChatCompletionTool } from "openai/resources/chat/completions";

// function convertZodToGroqSchema(zodSchema: any) {
//     const shape = zodSchema.shape;

//     const properties: any = {};
//     const required: string[] = [];

//     for (const key in shape) {
//         const field = shape[key];

//         // IMPORTANT FIX: preserve enum types if present
//         if (field._def?.typeName === "ZodEnum") {
//             properties[key] = {
//                 type: "string",
//                 enum: field._def.values,
//             };
//         } else {
//             properties[key] = {
//                 type: "string",
//             };
//         }

//         if (!field.isOptional()) {
//             required.push(key);
//         }
//     }

//     return {
//         type: "object",
//         properties,
//         required,
//         additionalProperties: false,
//     };
// }

// export const groqTools: ChatCompletionTool[] = toolRegistry.map((tool) => ({
//     type: "function",
//     function: {
//         name: tool.name,
//         description: tool.description,
//         parameters: convertZodToGroqSchema(tool.schema),
//     },
// }));

// src/agent/groqTools.ts
import { toolRegistry } from "./toolRegistry";
import type { ChatCompletionTool } from "openai/resources/chat/completions";

function unwrapZodField(field: any): any {
    const typeName = field._def?.typeName;
    // Unwrap ZodDefault → ZodOptional → ZodNullable to get the real inner type
    if (
        typeName === "ZodDefault" ||
        typeName === "ZodOptional" ||
        typeName === "ZodNullable"
    ) {
        return unwrapZodField(field._def.innerType);
    }
    return field;
}

function convertZodToGroqSchema(zodSchema: any) {
    // const shape = zodSchema.shape;
    const shape = zodSchema._def?.shape ?? zodSchema.shape ?? {};

    console.log(`[ZOD DEBUG] shape keys:`, Object.keys(shape));
    const properties: any = {};
    const required: string[] = [];

    for (const key in shape) {
        const raw = shape[key];
        const field = unwrapZodField(raw);
        const typeName = field._def?.typeName;

        // IDEA: To get what is actual groq returning
        console.log(`[ZOD DEBUG] key=${key} raw=${raw._def?.typeName} unwrapped=${field._def?.typeName} values=${JSON.stringify(field._def?.values)}`);

        if (typeName === "ZodEnum") {
            properties[key] = {
                type: "string",
                enum: field._def.values,
                description: `Must be one of: ${field._def.values.join(", ")}`,
            };
        } else if (typeName === "ZodNumber") {
            properties[key] = { type: "number" };
        } else if (typeName === "ZodBoolean") {
            properties[key] = { type: "boolean" };
        } else {
            properties[key] = { type: "string" };
        }

        // A field is required only if the RAW (pre-unwrap) field is not optional/has no default
        const rawTypeName = raw._def?.typeName;
        if (
            rawTypeName !== "ZodOptional" &&
            rawTypeName !== "ZodDefault" &&
            rawTypeName !== "ZodNullable"
        ) {
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
        parameters: tool.jsonSchema,
    },
}));
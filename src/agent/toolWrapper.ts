// import { ToolResult } from "./types";

// export async function safeExecuteTool(
//     name: string,
//     fn: Function,
//     input: any
// ): Promise<ToolResult> {
//     try {
//         const result = await fn(input);

//         return {
//             success: true,
//             tool: name,
//             data: result,
//         };
//     } catch (error: any) {
//         return {
//             success: false,
//             tool: name,
//             error: error.message || "Tool execution failed",
//         };
//     }
// }

import { ToolResult } from "./types";

/**
 * Strict tool input sanitizer
 * Prevents malformed Groq outputs from crashing execution
 */
function sanitizeInput(input: any) {
    // reject null/undefined
    if (!input) return {};

    // if string → try parsing safely
    if (typeof input === "string") {
        try {
            return JSON.parse(input);
        } catch {
            return {};
        }
    }

    // if already object → shallow clone only
    if (typeof input === "object") {
        return { ...input };
    }

    return {};
}

/**
 * Runtime validator for known bad values
 */
function validateToolInput(name: string, input: any) {
    if (!input || typeof input !== "object") return input;

    //IDEA: getTransactions strict rules
    if (name === "getTransactions") {
        const allowedTypes = ["range", "category", "merchant"];

        if (!allowedTypes.includes(input.type)) {
            throw new Error(
                `Invalid tool input: type must be one of ${allowedTypes.join(", ")}`
            );
        }

        // prevent hallucinated values
        if (input.type === "category" && !input.category) {
            throw new Error("Missing category");
        }

        if (input.type === "merchant" && !input.merchant) {
            throw new Error("Missing merchant");
        }
    }

    return input;
}

export async function safeExecuteTool(
    name: string,
    fn: Function,
    input: any
): Promise<ToolResult> {
    try {
        // 1. sanitize raw LLM output
        const cleanInput = sanitizeInput(input);

        // 2. validate against tool rules
        const validatedInput = validateToolInput(name, cleanInput);

        // 3. execute tool safely
        const result = await fn(validatedInput);

        return {
            success: true,
            tool: name,
            data: result,
        };
    } catch (error: any) {
        return {
            success: false,
            tool: name,
            error: error.message || "Tool execution failed",
        };
    }
}
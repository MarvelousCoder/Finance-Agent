import { getMemory } from "../services/memoryService";
import { groq } from "./groqClient";
import { systemPrompt } from "./systemPrompt";
import { toolRegistry } from "./toolRegistry";
import { saveMemory } from "../services/memoryService";
import { generateInsights } from "./insightEngine";
import { groqTools } from "./groqTools";
import { getAllTransactions } from "../services/transactionService";
import { PredictionService } from "../services/predictionService";
import { UnifiedPredictionService } from "../services/unifiedPredictionService";
import { createTrace, updateTrace, getTrace } from "./trace/traceStore";
import { randomUUID } from "crypto";
import { runToolWithTrace } from "./trace/toolSpan";
import { recordFailure } from "./trace/failureTracker";

// export async function financeAgent(userQuery: string) {
//     try {
//         //INFO: Step 1: Send request to Groq model
//         const response = await groq.chat.completions.create({
//             model: "llama-3.3-70b-versatile",
//             messages: [
//                 {
//                     role: "system",
//                     content: systemPrompt,
//                 },
//                 {
//                     role: "user",
//                     content: userQuery,
//                 },
//             ],

//             //IDEA: Phase 4: tool binding (core orchestration)
//             tools: toolRegistry as any,
//             tool_choice: "auto",
//         });

//         const message = response.choices[0].message;

//         //INFO: Step 2: If model calls a tool
//         if (message.tool_calls && message.tool_calls.length > 0) {
//             const toolResults = [];

//             for (const call of message.tool_calls) {
//                 if (call.type !== "function") continue;

//                 const tool = toolRegistry.find(
//                     (t) => t.name === call.function.name
//                 );

//                 if (!tool) continue;

//                 // IDEA: STEP 1: parse args
//                 const rawArgs = JSON.parse(call.function.arguments);

//                 // IDEA: STEP 2: validate via Zod
//                 const validatedArgs = tool.schema.safeParse(rawArgs);

//                 if (!validatedArgs.success) {
//                     toolResults.push({
//                         tool: tool.name,
//                         error: "Invalid arguments",
//                         details: validatedArgs.error.flatten(),
//                     });
//                     continue;
//                 }

//                 // IDEA: STEP 3: execute safely
//                 const result = await tool.execute(validatedArgs.data);

//                 toolResults.push({
//                     tool: tool.name,
//                     result,
//                 });
//             }

//             //INFO: Step 3: Send tool results back to LLM for final answer
//             const finalResponse = await groq.chat.completions.create({
//                 model: "llama-3.3-70b-versatile",
//                 messages: [
//                     { role: "system", content: systemPrompt },
//                     { role: "user", content: userQuery },
//                     {
//                         role: "assistant",
//                         content: JSON.stringify(toolResults),
//                     },
//                 ],
//             });

//             return finalResponse.choices[0].message.content;
//         }

//         // If no tool needed
//         return message.content;
//     } catch (error) {
//         console.error("Agent Error:", error);
//         return "Failed to process finance request.";
//     }
// }


// // NOTE: 2 nd updation
// function compressToolResult(result: any) {
//     const data = result.data;

//     if (Array.isArray(data)) {
//         return {
//             success: result.success,
//             tool: result.tool,
//             count: data.length,
//             sample: data.slice(0, 10),
//         };
//     }

//     return result;
// }

// /**
//  * INFO: Clean tool name (removes Groq artifacts like <function=...>)
//  */
// function sanitizeToolName(name: string) {
//     if (!name) return "";
//     return name.split(" ")[0].split("{")[0].trim();
// }

// /**
//  * INFO: Deterministic largest transaction (NO LLM)
//  */
// function getLargestTransaction(txns: any[]) {
//     return txns.reduce((max, t) =>
//         Math.abs(Number(t.amount)) > Math.abs(Number(max.amount)) ? t : max
//     );
// }

// /**
//  * INFO: Detect intent for deterministic routing
//  */
// function detectIntent(query: string) {
//     const q = query.toLowerCase();

//     return {
//         isLargest: q.includes("largest") || q.includes("highest transaction"),
//         isForecast:
//             q.includes("forecast") ||
//             q.includes("prediction") ||
//             q.includes("spending outlook") ||
//             q.includes("next month"),
//     };
// }

// function safeParseToolArgs(args: any) {
//     if (!args) return {};

//     if (typeof args !== "string") return args;

//     try {
//         // remove function wrapper artifacts
//         let cleaned = args
//             .replace(/<function=.*?>/g, "")
//             .replace(/<\/function>/g, "")
//             .trim();

//         // extract JSON part only
//         const start = cleaned.indexOf("{");
//         const end = cleaned.lastIndexOf("}");

//         if (start === -1 || end === -1) return {};

//         cleaned = cleaned.slice(start, end + 1);

//         return JSON.parse(cleaned);
//     } catch {
//         return {};
//     }
// }

// export async function financeAgent(userQuery: string) {
//     try {
//         // =========================
//         // MEMORY LOAD
//         // =========================
//         const memory = await getMemory("user_1");

//         const memoryContext = memory
//             .slice(0, 5)
//             .map((m) => `${m.type}:${m.key}`)
//             .join("\n");

//         const intent = detectIntent(userQuery);


//         // =========================
//         // TOOL CHAIN SETUP
//         // =========================
//         let messages: any[] = [
//             {
//                 role: "system",
//                 content: `${systemPrompt}

// User Memory:
// ${memoryContext}`,
//             },
//             {
//                 role: "user",
//                 content: userQuery,
//             },
//         ];

//         const collectedToolResults: any[] = [];

//         // =========================
//         // TOOL LOOP
//         // =========================
//         for (let i = 0; i < 5; i++) {
//             const response = await groq.chat.completions.create({
//                 model: "llama-3.3-70b-versatile",
//                 messages,
//                 tools: groqTools,
//                 tool_choice: "auto",
//             });

//             const message = response.choices[0].message;

//             console.log("\n===== TOOL DEBUG =====");
//             console.log("tool_calls:", JSON.stringify(message.tool_calls, null, 2));
//             console.log("content:", message.content);
//             console.log("======================\n");

//             if (!message.tool_calls || message.tool_calls.length === 0) {
//                 break;
//             }

//             const toolMessages: any[] = [];

//             for (const call of message.tool_calls) {
//                 if (call.type !== "function") continue;

//                 const tool = toolRegistry.find(
//                     (t) => t.name === sanitizeToolName(call.function.name)
//                 );

//                 if (!tool) continue;

//                 let rawArgs = {};

//                 try {
//                     // const cleanedArgs =
//                     //     typeof call.function.arguments === "string"
//                     //         ? call.function.arguments
//                     //             .replace(/<.*?>/g, "")
//                     //             .trim()
//                     //         : "{}";

//                     rawArgs = safeParseToolArgs(call.function.arguments);
//                 } catch {
//                     rawArgs = {};
//                 }

//                 const validated = tool.schema.safeParse(rawArgs);

//                 if (!validated.success) {
//                     const errorResult = {
//                         success: false,
//                         tool: tool.name,
//                         error: validated.error.flatten(),
//                     };

//                     collectedToolResults.push(errorResult);

//                     toolMessages.push({
//                         role: "tool",
//                         tool_call_id: call.id,
//                         content: JSON.stringify(errorResult),
//                     });

//                     console.log("❌ TOOL VALIDATION FAILED:", tool.name, validated.error);

//                     continue;
//                 }

//                 try {
//                     const toolData = await tool.execute(validated.data);

//                     const result = {
//                         success: true,
//                         tool: tool.name,
//                         data: toolData,
//                     };

//                     const compressed = compressToolResult(result);
//                     collectedToolResults.push(compressed);

//                     await saveMemory("user_1", "insight", tool.name, {
//                         success: result.success,
//                         tool: result.tool,
//                     });

//                     toolMessages.push({
//                         role: "tool",
//                         tool_call_id: call.id,
//                         content: JSON.stringify(compressed),
//                     });
//                 } catch (err: any) {
//                     const errorResult = {
//                         success: false,
//                         tool: tool.name,
//                         error: err.message,
//                     };

//                     toolMessages.push({
//                         role: "tool",
//                         tool_call_id: call.id,
//                         content: JSON.stringify(errorResult),
//                     });
//                 }
//             }

//             messages.push({
//                 role: "assistant",
//                 content: null,
//                 tool_calls: message.tool_calls,
//             });

//             messages.push(...toolMessages);
//         }

//         // =========================
//         // FINAL OUTPUT (HYBRID ENGINE)
//         // =========================

//         let finalContent = "";

//         const txns = await getAllTransactions();

//         // =========================
//         // Q3: LARGEST TRANSACTION (DETERMINISTIC)
//         // =========================
//         if (intent.isLargest) {
//             const largest = getLargestTransaction(txns);

//             finalContent = `
// The largest transaction is ${Math.round(Math.abs(largest.amount))} to ${largest.merchant}.
//             `.trim();
//         }

//         // =========================
//         // Q4: FORECAST (USE REAL MODEL)
//         // =========================
//         else if (intent.isForecast) {
//             const forecast =
//                 await UnifiedPredictionService.generateForecast();

//             finalContent = `
// Outlook: ${forecast.financialOutlook.toLowerCase()}
// Spending Risk: ${forecast.spendingRisk}
// Investment Risk: ${forecast.investmentRisk}

// Predicted Spending:
// ${forecast.predictions.join("\n")}
//             `.trim();
//         }

//         // =========================
//         // DEFAULT: LLM RESPONSE
//         // =========================
//         else {
//             const finalResponse = await groq.chat.completions.create({
//                 model: "llama-3.3-70b-versatile",
//                 messages,
//             });

//             finalContent =
//                 finalResponse.choices[0].message.content ||
//                 "No response generated.";
//         }

//         // =========================
//         // INSIGHTS ENGINE
//         // =========================
//         const insights = generateInsights(collectedToolResults, memory);

//         return `
// ${finalContent}

// Smart Insights:
// ${insights.length ? insights.join("\n") : "No anomalies detected"}
//         `.trim();
//     } catch (error) {
//         console.error(error);
//         return "Agent execution failed.";
//     }
// }





/**
 * Compress tool result before sending back to LLM
 */
function compressToolResult(result: any) {
    const data = result.data;

    if (Array.isArray(data)) {
        return {
            success: result.success,
            tool: result.tool,
            count: data.length,
            sample: data.filter(Boolean).slice(0, 10),
        };
    }

    return result;
}

/**
 * Clean tool name from Groq artifacts
 */
function sanitizeToolName(name: string) {
    if (!name) return "";
    return name.split(" ")[0].split("{")[0].trim();
}

/**
 * STRICT TOOL VALIDATION
 */
function isValidToolCall(toolName: string, args: any): boolean {
    if (toolName === "getSpendingSummary") {
        return ["total", "category", "merchant"].includes(args?.type);
    }

    if (toolName === "getTransactions") {
        return ["range", "category", "merchant"].includes(args?.type);
    }

    return true;
}

/**
 * SAFE TOOL SANITIZER
 */
function sanitizeToolArgs(toolName: string, args: any) {
    if (!args || typeof args !== "object") return args;

    if (toolName === "getSpendingSummary") {
        if (!["total", "category", "merchant"].includes(args.type)) {
            return { type: "total" };
        }
    }

    if (toolName === "getTransactions") {
        if (!["range", "category", "merchant"].includes(args.type)) {
            return { type: "range" };
        }
    }

    return args;
}

/**
 * SAFE largest transaction (6B FIX)
 */
function getLargestTransaction(txns: any[]) {
    return txns.reduce((max, t) => {
        const tAmt = Math.abs(Number(t?.amount || 0));
        const mAmt = Math.abs(Number(max?.amount || 0));

        return tAmt > mAmt ? t : max;
    }, txns[0] || {});
}

/**
 * Intent detection
 */
function detectIntent(query: string) {
    const q = query.toLowerCase();

    return {
        isLargest: q.includes("largest") || q.includes("highest"),
        isForecast:
            q.includes("forecast") ||
            q.includes("prediction") ||
            q.includes("next month") ||
            q.includes("outlook"),
    };
}

/**
 * Safe tool parser
 */
function safeParseToolArgs(args: any) {
    if (!args) return {};
    if (typeof args !== "string") return args;

    try {
        let cleaned = args
            .replace(/<function=.*?>/g, "")
            .replace(/<\/function>/g, "")
            .trim();

        const start = cleaned.indexOf("{");
        const end = cleaned.lastIndexOf("}");

        if (start === -1 || end === -1) return {};

        cleaned = cleaned.slice(start, end + 1);

        return JSON.parse(cleaned);
    } catch {
        return {};
    }
}

export async function financeAgent(userQuery: string) {

    // 🔷 PHASE 7A — CREATE REQUEST TRACE
    const requestId = randomUUID();
    createTrace(requestId, userQuery);

    try {
        const memory = await getMemory("user_1");

        const memoryContext = memory
            .slice(0, 5)
            .map((m) => `${m.type}:${m.key}`)
            .join("\n");

        const intent = detectIntent(userQuery);

        const txns = await getAllTransactions();

        /**
         * =========================
         * DETERMINISTIC ROUTING
         * =========================
         */
        if (intent.isLargest) {
            const largest = getLargestTransaction(txns);

            const result = `Largest transaction: ${Math.round(
                Math.abs(Number(largest?.amount || 0))
            )} ${largest?.merchant || "unknown"}`;

            updateTrace(requestId, {
                finalOutput: result,
                endTime: Date.now()
            });

            return {result, requestId};
        }

        if (intent.isForecast) {
            const forecast =
                await UnifiedPredictionService.generateForecast();

            const result = `
outlook: ${forecast.financialOutlook}
forecast: ${forecast.predictions.join(", ")}
            `.trim();

            updateTrace(requestId, {
                finalOutput: result,
                endTime: Date.now()
            });

            return {result,requestId};
        }

        /**
         * =========================
         * TOOL FLOW
         * =========================
         */

        const messages: any[] = [
            {
                role: "system",
                content: `${systemPrompt}

User Memory:
${memoryContext}`,
            },
            {
                role: "user",
                content: userQuery,
            },
        ];

        const collectedToolResults: any[] = [];

        for (let i = 0; i < 3; i++) {
            const response = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages,
                tools: groqTools,
                tool_choice: "auto",
            });

            const message = response.choices[0].message;

            if (!message.tool_calls?.length) break;

            const toolMessages: any[] = [];

            for (const call of message.tool_calls) {
                if (call.type !== "function") continue;

                const tool = toolRegistry.find(
                    (t) => t.name === sanitizeToolName(call.function.name)
                );

                if (!tool) {
                    recordFailure({
                        requestId,
                        type: "INVALID_TOOL_CALL",
                        message: "Unknown tool called by model",
                        input: call.function.name,
                        timestamp: Date.now(),
                    });
                    toolMessages.push({
                        role: "tool",
                        tool_call_id: call.id,
                        content: JSON.stringify({
                            success: false,
                            error: "Unknown tool called by model",
                        }),
                    });
                    continue;
                }

                const parsedArgs = safeParseToolArgs(call.function.arguments);
                const sanitizedArgs = sanitizeToolArgs(tool.name, parsedArgs);

                if (!isValidToolCall(tool.name, sanitizedArgs)) {
                    toolMessages.push({
                        role: "tool",
                        tool_call_id: call.id,
                        content: JSON.stringify({
                            success: false,
                            error: "Invalid tool arguments blocked",
                        }),
                    });
                    continue;
                }

                const validated = tool.schema.safeParse(sanitizedArgs);

                if (!validated.success) {

                    recordFailure({
                        requestId,
                        type: "SCHEMA_ERROR",
                        message: "Tool schema validation failed",
                        toolName: tool.name,
                        input: sanitizedArgs,
                        timestamp: Date.now(),
                    });

                    toolMessages.push({
                        role: "tool",
                        tool_call_id: call.id,
                        content: JSON.stringify({
                            success: false,
                            error: validated.error.flatten(),
                        }),
                    });

                    continue;
                }

                try {
                    // const toolData = await tool.execute(validated.data);
                    const toolData = await runToolWithTrace(
                        requestId,
                        tool.name,
                        validated.data,
                        tool.execute.bind(tool)
                    );

                    const result = {
                        success: true,
                        tool: tool.name,
                        data: toolData,
                    };

                    const compressed = compressToolResult(result);
                    collectedToolResults.push(compressed);

                    await saveMemory("user_1", "insight", tool.name, {
                        success: true,
                        tool: tool.name,
                    });

                    toolMessages.push({
                        role: "tool",
                        tool_call_id: call.id,
                        content: JSON.stringify(compressed),
                    });

                } catch (err: any) {

                    recordFailure({
                        requestId,
                        type: "TOOL_FAILURE",
                        message: err.message,
                        toolName: tool.name,
                        input: validated?.data,
                        stack: err.stack,
                        timestamp: Date.now(),
                    });

                    toolMessages.push({
                        role: "tool",
                        tool_call_id: call.id,
                        content: JSON.stringify({
                            success: false,
                            error: err.message,
                        }),
                    });
                }
            }

            messages.push({
                role: "assistant",
                content: null,
                tool_calls: message.tool_calls,
            });

            messages.push(...toolMessages);
        }

        // const finalResponse = await groq.chat.completions.create({
        //     model: "llama-3.3-70b-versatile",
        //     messages,
        // });
        // IDEA: Less generic
        // let finalResponse;

        // try {
        //     finalResponse = await groq.chat.completions.create({
        //         model: "llama-3.3-70b-versatile",
        //         messages,
        //     });

        //     console.log(
        //         "Tool Calls:",
        //         JSON.stringify(finalResponse.choices[0].message.tool_calls, null, 2)
        //     );
        // } catch (err: any) {

        //     recordFailure({
        //         requestId,
        //         type: "LLM_FAILURE",
        //         message: err.message,
        //         stack: err.stack,
        //         timestamp: Date.now(),
        //     });

        //     throw err;
        // }

        // IDEA: More generic

        let finalResponse
        try {
            finalResponse = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages,
            });

        } catch (err: any) {

            recordFailure({
                requestId,
                type: "LLM_FAILURE",
                message: err.message,
                input: err?.error?.failed_generation,
                timestamp: Date.now(),
            });

            throw err;
        }

        const finalContent =
            finalResponse.choices[0].message.content ||
            "No response generated.";

        const insights = generateInsights(collectedToolResults, memory);

        const finalResult = `
${finalContent}

Smart Insights:
${insights.length ? insights.join("\n") : "No anomalies detected"}
        `.trim();

        // PHASE 7A — FINAL TRACE UPDATE
        updateTrace(requestId, {
            finalOutput: finalResult,
            endTime: Date.now()
        });

        return {finalResult,requestId};

    } catch (error:any ) {

        recordFailure({
            requestId,
            type: "RUNTIME_ERROR",
            message: error.message,
            stack: error.stack,
            timestamp: Date.now(),
        });
        console.error(error);

        updateTrace(requestId, {
            endTime: Date.now(),
            finalOutput: "Agent execution failed."
        });

        return {requestId,result:"Agent execution failed."};
    }
}
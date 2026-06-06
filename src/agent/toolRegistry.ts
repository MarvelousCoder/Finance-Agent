import { getTransactionsTool } from "../tools/getTransactionsTool";
import { getSpendingSummaryTool } from "../tools/getSpendingSummaryTool";
import { getFundReturnTool } from "../tools/getFundReturnTool";
import { getHoldingReturnTool } from "../tools/getHoldingReturnTool";
import { normalizeMerchantTool } from "../tools/normalizeMerchantTool";
import { z } from "zod";
import { listFundsTool } from "../tools/listFundsTool";
import { getAllHoldingReturns } from "../services/holdingService";

// // Adapter Layer (VERY IMPORTANT FIX)
// const wrapTool = (name: string, fn: any, description: string, schema: z.ZodSchema<any>): AgentTool => {
//     return {
//         name,
//         description,
//         schema,
//         execute: async (input: any) => {
//             return await fn(input);
//         },
//     };
// };

// export const toolRegistry: AgentTool[] = [

//     wrapTool(
//         "getTransactions",
//         getTransactionsTool,
//         "Fetch raw transactions. DO NOT compute aggregates like totals or largest transaction. Only return data.",
//         z.object({
//             type: z.enum(["range", "category", "merchant", "all"]),
//             startDate: z.string().optional(),
//             endDate: z.string().optional(),
//             category: z.string().optional(),
//             merchant: z.string().optional(),
//         })
//     ),

//     wrapTool(
//         "getSpendingSummary",
//         getSpendingSummaryTool,
//         "Use ONLY for totals or category/merchant breakdown. Not for forecasting or ranking logic.",
//         z.object({
//             type: z.enum(["total", "category", "merchant"]),
//             startDate: z.string().optional(),
//             endDate: z.string().optional(),
//         })
//     ),

//     wrapTool(
//         "getFundReturn",
//         getFundReturnTool,
//         "Fetch mutual fund returns using fundId.",
//         z.object({
//             fundId: z.string(),
//         })
//     ),

//     wrapTool(
//         "getHoldingReturn",
//         getHoldingReturnTool,
//         "Fetch holding returns using holdingId.",
//         z.object({
//             holdingId: z.string(),
//         })
//     ),

//     wrapTool(
//         "normalizeMerchant",
//         normalizeMerchantTool,
//         "Normalize merchant name for grouping ONLY. Do not use for financial calculations.",
//         z.object({
//             merchant: z.string().min(2),
//         })
//     ),
// ];

// src/agent/toolRegistry.ts
export interface AgentTool {
    name: string;
    description: string;
    schema: any; // Zod schema for runtime validation
    jsonSchema: any; // Plain JSON schema for Groq tool definitions
    execute: (input: any) => Promise<any>;
}

const wrapTool = (
    name: string,
    fn: any,
    description: string,
    schema: z.ZodSchema<any>,
    jsonSchema: any
): AgentTool => ({
    name,
    description,
    schema,
    jsonSchema,
    execute: async (input: any) => await fn(input),
});

export const toolRegistry: AgentTool[] = [
    wrapTool(
        "getTransactions",
        getTransactionsTool,
        "Fetch raw transactions. DO NOT compute aggregates like totals or largest transaction. Only return data.",
        z.object({
            type: z.enum(["range", "category", "merchant"]),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            category: z.string().optional(),
            merchant: z.string().optional(),
        }),
        {
            type: "object",
            properties: {
                type: { type: "string", enum: ["range", "category", "merchant"], description: "Must be one of: range, category, merchant" },
                startDate: { type: "string" },
                endDate: { type: "string" },
                category: { type: "string" },
                merchant: { type: "string" },
            },
            required: ["type"],
            additionalProperties: false,
        }
    ),

    wrapTool(
        "getSpendingSummary",
        getSpendingSummaryTool,
        "Use ONLY for totals or category/merchant breakdown. Not for forecasting or ranking logic.",
        z.object({
            type: z.enum(["total", "category", "merchant"]),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
        }),
        {
            type: "object",
            properties: {
                type: { type: "string", enum: ["total", "category", "merchant"], description: "Must be one of: total, category, merchant" },
                startDate: { type: "string" },
                endDate: { type: "string" },
            },
            required: ["type"],
            additionalProperties: false,
        }
    ),
    wrapTool(
        "listFunds",
        listFundsTool,
        "List all available funds and holdings with their IDs. Call this FIRST before getFundReturn or getHoldingReturn to discover valid fundIds.",
        z.object({}),
        {
            type: "object",
            properties: {},
            required: [],
            additionalProperties: false,
        }
    ),

    wrapTool(
        "getFundReturn",
        getFundReturnTool,
        "Fetch mutual fund returns using fundId.",
        z.object({ fundId: z.string() }),
        {
            type: "object",
            properties: { fundId: { type: "string" } },
            required: ["fundId"],
            additionalProperties: false,
        }
    ),

    wrapTool(
        "getHoldingReturn",
        getHoldingReturnTool,
        "Fetch realised return on a user holding. Call listFunds first to get fundIds, then call this once per holding. Always use fundId from listFunds result.",
        z.object({ holdingId: z.string() }),
        {
            type: "object",
            properties: { fundId: { type: "string" } },
            required: ["fundId"],
            additionalProperties: false,
        }
    ),

    wrapTool(
        "getAllHoldingReturns",
        () => getAllHoldingReturns(),
        "Get realised returns for ALL holdings in one call. Shows current value, profit, and return % for each holding. Use this instead of calling getHoldingReturn multiple times.",
        z.object({}),
        {
            type: "object",
            properties: {},
            required: [],
            additionalProperties: false,
        }
    ),

    wrapTool(
        "normalizeMerchant",
        normalizeMerchantTool,
        "Normalize merchant name for grouping ONLY. Do not use for financial calculations.",
        z.object({ merchant: z.string().min(2) }),
        {
            type: "object",
            properties: { merchant: { type: "string" } },
            required: ["merchant"],
            additionalProperties: false,
        }
    ),
];
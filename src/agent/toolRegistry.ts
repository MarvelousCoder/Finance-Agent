import { getTransactionsTool } from "../tools/getTransactionsTool";
import { getSpendingSummaryTool } from "../tools/getSpendingSummaryTool";
import { getFundReturnTool } from "../tools/getFundReturnTool";
import { getHoldingReturnTool } from "../tools/getHoldingReturnTool";
import { normalizeMerchantTool } from "../tools/normalizeMerchantTool";
import { AgentTool } from "./types";
import { z } from "zod";

// Adapter Layer (VERY IMPORTANT FIX)
const wrapTool = (name: string, fn: any, description: string, schema: z.ZodSchema<any>): AgentTool => {
    return {
        name,
        description,
        schema,
        execute: async (input: any) => {
            return await fn(input);
        },
    };
};

// export const toolRegistry: AgentTool[] = [
//     wrapTool(
//         "getTransactions",
//         getTransactionsTool,
//         "Fetch transactions",
//         z.object({
//             type: z.enum(["merchant", "range", "category","largest","all"]),
//             startDate: z.string().optional(),
//             endDate: z.string().optional(),
//             category: z.string().optional(),
//             merchant: z.string().optional(),
//         })
//     ),

//     wrapTool(
//         "getSpendingSummary",
//         getSpendingSummaryTool,
//         "Spending summary",
//         z.object({
//             startDate: z.string().optional(),
//             endDate: z.string().optional(),
//         })
//     ),

//     wrapTool(
//         "getFundReturn",
//         getFundReturnTool,
//         "Fund returns",
//         z.object({
//             fundId: z.string(),
//         })
//     ),

//     wrapTool(
//         "getHoldingReturn",
//         getHoldingReturnTool,
//         "Holding returns",
//         z.object({
//             holdingId: z.string(),
//         })
//     ),

//     wrapTool(
//         "normalizeMerchant",
//         normalizeMerchantTool,
//         "Normalize merchant names",
//         z.object({
//             merchant: z.string(),
//         })
//     ),
//   ];

export const toolRegistry: AgentTool[] = [

    wrapTool(
        "getTransactions",
        getTransactionsTool,
        "Fetch raw transactions. DO NOT compute aggregates like totals or largest transaction. Only return data.",
        z.object({
            type: z.enum(["range", "category", "merchant", "all"]),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            category: z.string().optional(),
            merchant: z.string().optional(),
        })
    ),

    wrapTool(
        "getSpendingSummary",
        getSpendingSummaryTool,
        "Use ONLY for totals or category/merchant breakdown. Not for forecasting or ranking logic.",
        z.object({
            type: z.enum(["total", "category", "merchant"]),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
        })
    ),

    wrapTool(
        "getFundReturn",
        getFundReturnTool,
        "Fetch mutual fund returns using fundId.",
        z.object({
            fundId: z.string(),
        })
    ),

    wrapTool(
        "getHoldingReturn",
        getHoldingReturnTool,
        "Fetch holding returns using holdingId.",
        z.object({
            holdingId: z.string(),
        })
    ),

    wrapTool(
        "normalizeMerchant",
        normalizeMerchantTool,
        "Normalize merchant name for grouping ONLY. Do not use for financial calculations.",
        z.object({
            merchant: z.string().min(2),
        })
    ),
];

// NOTE: 2nd Updation
// import { z } from "zod";
// import {
//     getTransactions,
//     getTransactionsByCategory,
//     getTransactionsByMerchant,
//     getAllTransactions,
// } from "../services/transactionService";

// // INFO: Tool schema
// export const getTransactionsToolSchema = z.object({
//     type: z
//         .enum([
//             "range",
//             "category",
//             "merchant",
//             "largest",
//             "all",
//         ])
//         .default("all"),

//     startDate: z.string().optional(),
//     endDate: z.string().optional(),

//     category: z.string().optional(),
//     merchant: z.string().optional(),
// });

// // INFO: Main tool
// export async function getTransactionsTool(
//     input: z.infer<typeof getTransactionsToolSchema>
// ) {
//     const {
//         type,
//         startDate,
//         endDate,
//         category,
//         merchant,
//     } = input;

//     // =========================
//     // ALL TRANSACTIONS
//     // =========================
//     if (type === "all") {
//         return await getAllTransactions();
//     }

//     // =========================
//     // RANGE QUERY
//     // =========================
//     if (type === "range") {
//         if (!startDate || !endDate) {
//             return await getAllTransactions();
//         }

//         return await getTransactions(
//             startDate,
//             endDate
//         );
//     }

//     // =========================
//     // CATEGORY QUERY
//     // =========================
//     if (type === "category") {
//         if (!category) {
//             throw new Error(
//                 "category is required"
//             );
//         }

//         return await getTransactionsByCategory(
//             category
//         );
//     }

//     // =========================
//     // MERCHANT QUERY
//     // =========================
//     if (type === "merchant") {
//         // If merchant provided
//         if (merchant) {
//             return await getTransactionsByMerchant(
//                 merchant
//             );
//         }

//         // Top merchant analysis
//         const txns =
//             await getAllTransactions();

//         const merchantTotals =
//             txns.reduce(
//                 (acc: any, txn: any) => {
//                     const name =
//                         txn.merchant ||
//                         "Unknown";

//                     acc[name] =
//                         (acc[name] || 0) +
//                         Math.abs(
//                             Number(txn.amount)
//                         );

//                     return acc;
//                 },
//                 {}
//             );

//         return Object.entries(
//             merchantTotals
//         )
//             .map(([merchant, total]) => ({
//                 merchant,
//                 total,
//             }))
//             .sort(
//                 (a: any, b: any) =>
//                     b.total - a.total
//             )
//             .slice(0, 10);
//     }

//     // =========================
//     // LARGEST TRANSACTION
//     // =========================
//     if (type === "largest") {
//         const txns =
//             await getAllTransactions();

//         return txns.sort(
//             (a: any, b: any) =>
//                 Math.abs(
//                     Number(b.amount)
//                 ) -
//                 Math.abs(
//                     Number(a.amount)
//                 )
//         )[0];
//     }

//     return [];
// }

import { z } from "zod";
import {
    getTransactions,
    getTransactionsByCategory,
    getTransactionsByMerchant,
    getAllTransactions,
} from "../services/transactionService";

// =========================
// STRICT TOOL SCHEMA
// =========================
export const getTransactionsToolSchema = z.object({
    type: z.enum([
        "range",
        "category",
        "merchant",
    ]),

    startDate: z.string().optional(),
    endDate: z.string().optional(),

    category: z.string().optional(),
    merchant: z.string().optional(),
});

// =========================
// MAIN TOOL LOGIC
// =========================
export async function getTransactionsTool(
    input: z.infer<typeof getTransactionsToolSchema>
) {
    const { type, startDate, endDate, category, merchant } = input;

    // =========================
    // RANGE QUERY (DEFAULT FOR ALL)
    // =========================
    if (type === "range") {
        // if missing dates → fallback safe full range
        if (!startDate || !endDate) {
            return await getAllTransactions();
        }

        return await getTransactions(startDate, endDate);
    }

    // =========================
    // CATEGORY QUERY
    // =========================
    if (type === "category") {
        if (!category) {
            throw new Error("category is required");
        }

        return await getTransactionsByCategory(category);
    }

    // =========================
    // MERCHANT QUERY
    // =========================
    if (type === "merchant") {
        if (merchant) {
            return await getTransactionsByMerchant(merchant);
        }

        // SAFE fallback: derive merchant stats
        const txns = await getAllTransactions();

        const merchantTotals = txns.reduce((acc: any, txn: any) => {
            const name = txn.merchant || "Unknown";

            acc[name] =
                (acc[name] || 0) +
                Math.abs(Number(txn.amount));

            return acc;
        }, {});

        return Object.entries(merchantTotals)
            .map(([merchant, total]) => ({
                merchant,
                total,
            }))
            .sort((a: any, b: any) => b.total - a.total)
            .slice(0, 10);
    }

    return [];
}
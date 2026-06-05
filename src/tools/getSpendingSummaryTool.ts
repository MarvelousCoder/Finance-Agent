// src/tools/getSpendingSummaryTool.ts

import { z } from "zod";
import {
    getTotalSpending,
    getSpendingByCategory,
    getSpendingByMerchant,
} from "../services/spendingService";

//INFO: Input validation schema
export const spendingSummarySchema = z.object({
    type: z.enum(["total", "category", "merchant"]).default("total"),

    startDate: z.string(),
    endDate: z.string(),
});

//INFO: Tool implementation
export async function getSpendingSummaryTool(
    input: z.infer<typeof spendingSummarySchema>
) {
    const { type, startDate, endDate } = input;

    //INFO: If missing dates → service should decide full range
    const safeStartDate = startDate ?? "1900-01-01";
    const safeEndDate = endDate ?? "2100-01-01";

    //NOTE: Case 1: Total spending
    if (type === "total") {
        return await getTotalSpending(safeStartDate, safeEndDate);
    }

    //NOTE: Case 2: Category breakdown
    if (type === "category") {
        return await getSpendingByCategory(safeStartDate, safeEndDate);
    }
    else throw new Error("Phase7 test failure");

    //NOTE: Case 3: Merchant breakdown
    if (type === "merchant") {
        return await getSpendingByMerchant(safeStartDate, safeEndDate);
    }

    
    // fallback safety
    return await getTotalSpending(
        safeStartDate,
        safeEndDate
    );
    
}
import { z } from "zod";
import {
    getFundNavs,
    getLatestNav,
    getNavBeforeDate,
} from "../services/fundService";

//INFO: Input validation
export const fundReturnSchema = z.object({
    fundId: z.string(),

    startDate: z.string().optional(),
    endDate: z.string().optional(),

    investedAmount: z.number().optional(),
});

//INFO: Simple return calculation helper
function calculateReturn(startNav: number, endNav: number) {
    return ((endNav - startNav) / startNav) * 100;
}

//INFO: Tool implementation
export async function getFundReturnTool(
    input: z.infer<typeof fundReturnSchema>
) {
    const { fundId, startDate, endDate, investedAmount } = input;

    //IDEA: Default: use full available range if not provided
    const start = startDate || "1900-01-01";
    const end = endDate || new Date().toISOString().split("T")[0];

    //IDEA: Get NAV at start and end
    const startNavData = await getNavBeforeDate(fundId, start);
    const endNavData = await getNavBeforeDate(fundId, end);

    if (!startNavData || !endNavData) {
        throw new Error("NAV data not available for given range");
    }

    const startNav = Number(startNavData.nav_value);
    const endNav = Number(endNavData.nav_value);

    const returnPercent = calculateReturn(startNav, endNav);

    //INFO: If user provides investment amount, compute profit
    let profit = null;

    if (investedAmount) {
        profit = (investedAmount * returnPercent) / 100;
    }

    return {
        fundId,
        startNav,
        endNav,
        returnPercent: Number(returnPercent.toFixed(2)),
        investedAmount: investedAmount || null,
        profit,
    };
}
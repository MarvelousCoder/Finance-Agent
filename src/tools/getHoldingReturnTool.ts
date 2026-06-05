import { z } from "zod";
import {
    getHoldingsByFund,
} from "../services/holdingService";

import {
    getLatestNav,
    getNavBeforeDate,
} from "../services/fundService";

//INFO: Input validation
export const holdingReturnSchema = z.object({
    fundId: z.string(),

    //IDEA: optional for historical evaluation
    asOfDate: z.string().optional(),
});

//INFO: Tool implementation
export async function getHoldingReturnTool(
    input: z.infer<typeof holdingReturnSchema>
) {
    const { fundId, asOfDate } = input;

    //INFO: Get holdings
    const holdings = await getHoldingsByFund(fundId);

    if (!holdings.length) {
        throw new Error("No holdings found for fund");
    }

    //INFO: Get NAV (latest or as-of-date)
    const navData = asOfDate
        ? await getNavBeforeDate(fundId, asOfDate)
        : await getLatestNav(fundId);

    if (!navData) {
        throw new Error("NAV data not available");
    }

    const currentNav = Number(navData.nav_value);

    let totalInvested = 0;
    let currentValue = 0;

    //INFO:  Compute portfolio metrics
    for (const h of holdings) {
        const quantity = Number(h.quantity);
        const buyPrice = Number(h.buy_price || h.avg_buy_price || 0);

        totalInvested += quantity * buyPrice;
        currentValue += quantity * currentNav;
    }

    const profit = currentValue - totalInvested;
    const returnPercent = (profit / totalInvested) * 100;

    return {
        fundId,
        totalInvested,
        currentValue,
        profit,
        returnPercent: Number(returnPercent.toFixed(2)),
        navUsed: currentNav,
        asOfDate: asOfDate || navData.nav_date,
    };
}
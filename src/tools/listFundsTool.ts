import { z } from "zod";
import { getAllFunds } from "../services/fundService";
import { getAllHoldings } from "../services/holdingService";

export const listFundsSchema = z.object({});

export async function listFundsTool() {
    const [funds, holdings] = await Promise.all([
        getAllFunds(),
        getAllHoldings(),
    ]);

    return {
        funds,
        holdings,
        note: "Use fund_id from this list when calling getFundReturn or getHoldingReturn"
    };
}
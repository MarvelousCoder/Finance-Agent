// src/services/holdingService.ts

import { pool } from "../db/connection";

//INFO:  Get all holdings for a user/fund snapshot
export async function getHoldings() {
    const result = await pool.query(
        `
    SELECT *
    FROM holdings
    `
    );

    return result.rows;
}

//INFO: Get holdings for a specific fund
export async function getHoldingsByFund(fundId: string) {
    const result = await pool.query(
        `
    SELECT *
    FROM holdings
    WHERE fund_id = $1
    `,
        [fundId]
    );

    return result.rows;
}
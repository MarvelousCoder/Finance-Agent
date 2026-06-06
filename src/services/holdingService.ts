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
        `SELECT h.id, h.fund_id, f.name as fund_name,
                h.units, h.purchase_date, h.purchase_nav
         FROM holdings h
         LEFT JOIN funds f ON h.fund_id = f.id
         WHERE h.fund_id = $1`,
        [fundId]
    );
    return result.rows;
}

export async function getAllHoldings() {
    const result = await pool.query(
        `SELECT h.fund_id, f.name as fund_name, 
                h.units, h.purchase_date, h.purchase_nav
         FROM holdings h
         LEFT JOIN funds f ON h.fund_id = f.id
         ORDER BY f.name`
    );
    return result.rows;
}

export async function getAllHoldingReturns() {
    const result = await pool.query(
        `SELECT h.fund_id, f.name as fund_name,
                h.units, h.purchase_date, h.purchase_nav,
                n.nav_value as current_nav,
                n.nav_date as current_nav_date,
                ROUND((h.units * h.purchase_nav)::numeric, 2) as total_invested,
                ROUND((h.units * n.nav_value)::numeric, 2) as current_value,
                ROUND((h.units * n.nav_value - h.units * h.purchase_nav)::numeric, 2) as profit,
                ROUND(((n.nav_value - h.purchase_nav) / h.purchase_nav * 100)::numeric, 2) as return_percent
         FROM holdings h
         LEFT JOIN funds f ON h.fund_id = f.id
         LEFT JOIN LATERAL (
             SELECT nav_value, nav_date
             FROM fund_navs
             WHERE fund_id = h.fund_id
             ORDER BY nav_date DESC
             LIMIT 1
         ) n ON true
         ORDER BY return_percent DESC`
    );
    return result.rows;
}
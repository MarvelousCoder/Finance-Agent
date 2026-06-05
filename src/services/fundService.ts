// src/services/fundService.ts

import { pool } from "../db/connection";

//INFO: Fetch NAV history for a fund in date range
export async function getFundNavs(fundId: string, startDate: string, endDate: string) {
    const result = await pool.query(
        `
    SELECT nav_date, nav_value
    FROM fund_navs
    WHERE fund_id = $1
      AND nav_date BETWEEN $2 AND $3
    ORDER BY nav_date ASC
    `,
        [fundId, startDate, endDate]
    );

    return result.rows;
}

//INFO:  Get latest NAV for a fund (useful for current valuation)
export async function getLatestNav(fundId: string) {
    const result = await pool.query(
        `
    SELECT nav_date, nav_value
    FROM fund_navs
    WHERE fund_id = $1
    ORDER BY nav_date DESC
    LIMIT 1
    `,
        [fundId]
    );

    return result.rows[0];
}


//INFO: Get NAV on or before a specific date (for entry valuation)
export async function getNavBeforeDate(fundId: string, date: string) {
    const result = await pool.query(
        `
    SELECT nav_date, nav_value
    FROM fund_navs
    WHERE fund_id = $1
      AND nav_date <= $2
    ORDER BY nav_date DESC
    LIMIT 1
    `,
        [fundId, date]
    );

    return result.rows[0];
}

// INFO: Get all fund IDs
export async function getFunds() {
    const result = await pool.query(`
        SELECT id
        FROM funds
    `);

    return result.rows;
}


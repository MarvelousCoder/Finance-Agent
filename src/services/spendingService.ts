// src/services/spendingService.ts

import { pool } from "../db/connection";

//INFO: Total spending in a date range
export async function getTotalSpending(startDate: string, endDate: string) {
    const result = await pool.query(
        `
        SELECT COALESCE(SUM(ABS(amount)), 0) AS total_spend
        FROM transactions
        WHERE txn_date BETWEEN $1 AND $2
        `,
        [startDate, endDate]
    );

    return {
        total_spend: Number(result.rows[0].total_spend),
    };
}

//INFO: Spending grouped by category
export async function getSpendingByCategory(startDate: string, endDate: string) {
    const result = await pool.query(
        `
        SELECT category, COALESCE(SUM(ABS(amount)), 0) AS total_spend
        FROM transactions
        WHERE txn_date BETWEEN $1 AND $2
        GROUP BY category
        ORDER BY total_spend DESC
        `,
        [startDate, endDate]
    );

    return result.rows.map((r) => ({
        category: r.category,
        total_spend: Number(r.total_spend),
    }));
}

//INFO: Spending grouped by merchant
export async function getSpendingByMerchant(startDate: string, endDate: string) {
    const result = await pool.query(
        `
        SELECT merchant, COALESCE(SUM(ABS(amount)), 0) AS total_spend
        FROM transactions
        WHERE txn_date BETWEEN $1 AND $2
        GROUP BY merchant
        ORDER BY total_spend DESC
        `,
        [startDate, endDate]
    );

    return result.rows.map((r) => ({
        merchant: r.merchant,
        total_spend: Number(r.total_spend),
    }));
}
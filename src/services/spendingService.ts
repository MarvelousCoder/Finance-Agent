// src/services/spendingService.ts

import { pool } from "../db/connection";

export async function getTotalSpending(startDate: string, endDate: string) {
    const result = await pool.query(
        `
        SELECT COALESCE(SUM(ABS(amount)), 0) AS total_spend
        FROM transactions
        WHERE txn_date BETWEEN $1 AND $2
          AND category != 'transfer'
          AND amount > 0
        `,
        [startDate, endDate]
    );

    return {
        total_spend: Number(result.rows[0].total_spend),
        currency: "INR",
    };
}

export async function getSpendingByCategory(startDate: string, endDate: string) {
    const result = await pool.query(
        `
        SELECT category, COALESCE(SUM(ABS(amount)), 0) AS total_spend
        FROM transactions
        WHERE txn_date BETWEEN $1 AND $2
          AND category != 'transfer'
          AND amount > 0
        GROUP BY category
        ORDER BY total_spend DESC
        `,
        [startDate, endDate]
    );

    return result.rows.map((r) => ({
        category: r.category,
        total_spend: Number(r.total_spend),
        currency: "INR",
    }));
}

export async function getSpendingByMerchant(startDate: string, endDate: string) {
    const result = await pool.query(
        `
        SELECT merchant, COALESCE(SUM(ABS(amount)), 0) AS total_spend
        FROM transactions
        WHERE txn_date BETWEEN $1 AND $2
          AND category != 'transfer'
          AND amount > 0
        GROUP BY merchant
        ORDER BY total_spend DESC
        LIMIT 20
        `,
        [startDate, endDate]
    );

    return result.rows.map((r) => ({
        merchant: r.merchant,
        total_spend: Number(r.total_spend),
        currency: "INR",
    }));
}
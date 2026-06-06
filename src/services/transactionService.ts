import { pool } from "../db/connection";

// NOTE: 2nd Updation

// function normalizeMerchant(merchant: string = "") {
//     return merchant
//         .toLowerCase()
//         .trim()
//         .replace(/\s+/g, " ")
//         .replace(/[^a-z0-9 ]/g, "");
// }

// function normalizeCategory(category: string = "") {
//     return category
//         .toLowerCase()
//         .trim()
//         .replace(/\s+/g, " ")
//         .replace(/[^a-z0-9 ]/g, "") || "uncategorized";
// }

// function normalizeAmount(amount: any) {
//     const num = Number(amount || 0);
//     return isNaN(num) ? 0 : num;
// }

// /**
//  * SINGLE SOURCE OF TRUTH NORMALIZER
//  */
// function normalizeTxn(tx: any) {
//     if (!tx) return null;

//     return {
//         ...tx,
//         amount: normalizeAmount(tx.amount),
//         category: normalizeCategory(tx.category),
//         merchant: normalizeMerchant(tx.merchant),
//     };
// }

// function classifyTransaction(tx: any) {
//     const merchant = tx.merchant || "";
//     const category = tx.category || "";

//     const isRefund = tx.amount < 0;

//     const isTransfer =
//         merchant.includes("transfer") ||
//         category.includes("transfer") ||
//         merchant.includes("upi") && category.includes("bank");

//     return {
//         ...tx,
//         isRefund,
//         isTransfer,
//     };
// }

// function deduplicateTransactions(txns: any[]) {
//     const seen = new Set();
//     return txns.filter(tx => {
//         const key = `${tx.amount}-${tx.merchant}-${tx.txn_date}`;
//         if (seen.has(key)) return false;
//         seen.add(key);
//         return true;
//     });
// }

// /**
//  * =========================
//  * FETCH HELPERS
//  * =========================
//  */

// // INFO: Fetch transactions within a date range
// export async function getTransactions(startDate: string, endDate: string) {
//     const result = await pool.query(
//         `
//         SELECT *
//         FROM transactions
//         WHERE txn_date BETWEEN $1 AND $2
//         ORDER BY txn_date ASC
//         `,
//         [startDate, endDate]
//     );

//     return deduplicateTransactions(
//         (result.rows || [])
//             .filter(Boolean)
//             .map(normalizeTxn)
//             .map(classifyTransaction)
//     );
// }

// // INFO: Fetch transactions by category
// export async function getTransactionsByCategory(category: string) {
//     const result = await pool.query(
//         `
//         SELECT *
//         FROM transactions
//         WHERE LOWER(category) = LOWER($1)
//         ORDER BY txn_date DESC
//         `,
//         [category]
//     );

//     return deduplicateTransactions(
//         (result.rows || [])
//             .filter(Boolean)
//             .map(normalizeTxn)
//             .map(classifyTransaction)
//     );
// }

// // INFO: Fetch transactions by merchant
// export async function getTransactionsByMerchant(merchant: string) {
//     const result = await pool.query(
//         `
//         SELECT *
//         FROM transactions
//         WHERE LOWER(merchant) = LOWER($1)
//         ORDER BY txn_date DESC
//         `,
//         [merchant]
//     );

//     return deduplicateTransactions(
//         (result.rows || [])
//             .filter(Boolean)
//             .map(normalizeTxn)
//             .map(classifyTransaction)
//     );
// }

// // INFO: Fetch ALL transactions (used for analytics + prediction engine)
// export async function getAllTransactions() {
//     const result = await pool.query(
//         `
//         SELECT *
//         FROM transactions
//         ORDER BY txn_date ASC
//         `
//     );

//     return deduplicateTransactions(
//         (result.rows || [])
//             .filter(Boolean)
//             .map(normalizeTxn)
//             .map(classifyTransaction)
//     );
// }


function normalizeMerchant(merchant: string = "") {
    return merchant
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[^a-z0-9 ]/g, "");
}

function normalizeCategory(category: string = "") {
    return category
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[^a-z0-9 ]/g, "") || "uncategorized";
}

function normalizeAmount(amount: any) {
    const num = Number(amount || 0);
    return isNaN(num) ? 0 : num;
}

// IDEA: CORE TRANSFORM

function normalizeTxn(tx: any) {
    if (!tx) return null;

    return {
        ...tx,
        amount: normalizeAmount(tx.amount),
        category: normalizeCategory(tx.category),
        merchant: normalizeMerchant(tx.merchant),
    };
}

function classifyTransaction(tx: any) {
    const merchant = tx.merchant || "";
    const category = tx.category || "";
    const amount = Number(tx.amount || 0);

    const isRefund = amount < 0;

    const isTransfer =
        merchant.includes("transfer") ||
        category.includes("transfer") ||
        merchant.includes("upi") ||
        merchant.includes("bank") ||
        category.includes("bank");

    return {
        ...tx,
        isRefund,
        isTransfer,
    };
}

// IDEA: DEDUPLICATION (STRICT)

function deduplicateTransactions(txns: any[]) {
    const seen = new Set<string>();

    return (txns || []).filter((tx) => {
        const key = `${tx.amount}-${tx.merchant}-${tx.txn_date}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// IDEA: FETCH HELPERS


export async function getTransactions(startDate: string, endDate: string) {
    const result = await pool.query(
        `
        SELECT *
        FROM transactions
        WHERE txn_date BETWEEN $1 AND $2
        ORDER BY txn_date ASC
        `,
        [startDate, endDate]
    );

    return deduplicateTransactions(
        (result.rows || [])
            .filter(Boolean)
            .map(normalizeTxn)
            .map(classifyTransaction)
    );
}

export async function getTransactionsByCategory(category: string) {
    const result = await pool.query(
        `
        SELECT *
        FROM transactions
        WHERE LOWER(category) = LOWER($1)
        ORDER BY txn_date DESC
        `,
        [category]
    );

    return deduplicateTransactions(
        (result.rows || [])
            .filter(Boolean)
            .map(normalizeTxn)
            .map(classifyTransaction)
    );
}

export async function getTransactionsByMerchant(merchant: string) {
    const result = await pool.query(
        `
        SELECT *
        FROM transactions
        WHERE LOWER(merchant) = LOWER($1)
        ORDER BY txn_date DESC
        `,
        [merchant]
    );

    return deduplicateTransactions(
        (result.rows || [])
            .filter(Boolean)
            .map(normalizeTxn)
            .map(classifyTransaction)
    );
}

export async function getAllTransactions() {
    const result = await pool.query(
        `
        SELECT *
        FROM transactions
        ORDER BY txn_date ASC
        `
    );

    return deduplicateTransactions(
        (result.rows || [])
            .filter(Boolean)
            .map(normalizeTxn)
            .map(classifyTransaction)
    );
}
import fs from "fs/promises";
import path from "path";
import { pool } from "../src/db/connection.js";

async function loadTransactions() {
    const sample = process.argv[2] || "sample_a";

    const filePath = path.join(
        process.cwd(),
        "data",
        sample,
        "transactions.json"
    );

    const raw = await fs.readFile(filePath, "utf-8");
    const transactions = JSON.parse(raw);

    let inserted = 0;

    for (const txn of transactions) {
        const result = await pool.query(
            `
      INSERT INTO transactions (
        id,
        txn_date,
        merchant,
        category,
        amount,
        currency,
        memo
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (id) DO NOTHING
      `,
            [
                txn.id,
                txn.date,
                txn.merchant,
                txn.category,
                txn.amount,
                txn.currency,
                txn.memo,
            ]
        );

        inserted += result.rowCount ?? 0;
    }

    console.log(`Inserted ${inserted} transactions`);

    await pool.end();
}

loadTransactions().catch(console.error);
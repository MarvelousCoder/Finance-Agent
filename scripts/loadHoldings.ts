import fs from "fs/promises";
import path from "path";
import { pool } from "../src/db/connection.js";

async function loadHoldings() {
    const sample = process.argv[2] || "sample-a";

    const filePath = path.join(
        process.cwd(),
        "data",
        sample,
        "holdings.json"
    );

    const raw = await fs.readFile(filePath, "utf-8");
    const holdings = JSON.parse(raw);

    let inserted = 0;

    for (const holding of holdings) {
        const result = await pool.query(
            `
      INSERT INTO holdings (
        fund_id,
        units,
        purchase_date,
        purchase_nav
      )
      VALUES ($1, $2, $3, $4)
      `,
            [
                holding.fund_id,
                holding.units,
                holding.purchase_date,
                holding.purchase_nav
            ]
        );

        inserted += result.rowCount ?? 0;
    }

    console.log(`Inserted ${inserted} holdings`);

    await pool.end();
}

loadHoldings().catch((error) => {
    console.error(error);
    process.exit(1);
});
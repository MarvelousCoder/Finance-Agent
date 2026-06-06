import fs from "fs/promises";
import path from "path";
import { pool } from "../src/db/connection.js";
import { getDataDir } from "./utils/getDataDir.js";

export async function loadHoldings() {
    // const sample = process.argv[2] || "sample_a";
    // const dataDir =
    //     process.env.DATA_DIR ||
    //     path.join(process.cwd(), "data", "sample_a");

    // const filePath = path.join(
    //     process.cwd(),
    //     "data",
    //     "holdings.json"
    // );

    const filePath = path.join(
        getDataDir(),
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

    // await pool.end();
}

// loadHoldings().catch((error) => {
//     console.error(error);
//     process.exit(1);
// });
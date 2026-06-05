import fs from "fs/promises";
import path from "path";
import { pool } from "../src/db/connection.js";

async function loadFunds() {
    const sample = process.argv[2] || "sample_a";

    const filePath = path.join(
        process.cwd(),
        "data",
        sample,
        "funds.json"
    );

    const raw = await fs.readFile(filePath, "utf-8");
    const funds = JSON.parse(raw);

    let fundsInserted = 0;
    let navsInserted = 0;

    for (const fund of funds) {
        const fundResult = await pool.query(
            `
      INSERT INTO funds (
        id,
        name,
        category
      )
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO NOTHING
      `,
            [
                fund.id,
                fund.name,
                fund.category
            ]
        );

        fundsInserted += fundResult.rowCount ?? 0;

        for (const nav of fund.nav) {
            const navResult = await pool.query(
                `
        INSERT INTO fund_navs (
          fund_id,
          nav_date,
          nav_value
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (fund_id, nav_date)
        DO NOTHING
        `,
                [
                    fund.id,
                    nav.date,
                    nav.value
                ]
            );

            navsInserted += navResult.rowCount ?? 0;
        }
    }

    console.log(`Inserted ${fundsInserted} funds`);
    console.log(`Inserted ${navsInserted} NAV records`);

    await pool.end();
}

loadFunds().catch((error) => {
    console.error(error);
    process.exit(1);
});
import { pool } from "./connection";

async function main() {
    const result = await pool.query(
        "SELECT NOW()"
    );

    console.log(result.rows);

    await pool.end();
}

main();
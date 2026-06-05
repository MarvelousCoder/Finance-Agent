import { pool } from "../src/db/connection.js";

async function validateData() {
    const transactions = await pool.query(
        "SELECT COUNT(*) FROM transactions"
    );

    const funds = await pool.query(
        "SELECT COUNT(*) FROM funds"
    );

    const navs = await pool.query(
        "SELECT COUNT(*) FROM fund_navs"
    );

    const holdings = await pool.query(
        "SELECT COUNT(*) FROM holdings"
    );

    console.log("=== DATA VALIDATION ===");
    console.log(
        "Transactions:",
        transactions.rows[0].count
    );
    console.log(
        "Funds:",
        funds.rows[0].count
    );
    console.log(
        "Fund NAVs:",
        navs.rows[0].count
    );
    console.log(
        "Holdings:",
        holdings.rows[0].count
    );

    await pool.end();
}

validateData().catch(console.error);
import { loadTransactions } from "./loadTransactions";
import { loadFunds } from "./loadFunds";
import { loadHoldings } from "./loadHoldings";
import { pool } from "../src/db/connection.js";

async function ingest() {
    console.log(
        `Using dataset: ${process.env.DATA_DIR}`
    );

    await loadTransactions();
    await loadFunds();
    await loadHoldings();

    console.log("Ingestion completed");
}

ingest()
    .catch(console.error)
    .finally(async () => {
        await pool.end();
    });
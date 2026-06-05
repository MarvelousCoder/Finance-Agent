import fs from "fs";
import path from "path";
import { pool } from "../src/db/connection"; 

async function main(){
    const schema  = fs.readFileSync(
        path.join(
            process.cwd(),
            "src/db/schema.sql"
        ),
        "utf-8"
    );

    await pool.query(schema);

    console.log("Schema created successfully");
    
}

main()
    .catch(console.error)
    .finally(()=> pool.end())
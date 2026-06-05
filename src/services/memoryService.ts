import { pool } from "../db/connection";


// INFO: Save memory for a user

export async function saveMemory(
    userId: string,
    type: string,
    key: string,
    value: any
) {
    await pool.query(
        `INSERT INTO user_memory (user_id, type, key, value)
     VALUES ($1, $2, $3, $4)`,
        [userId, type, key, JSON.stringify(value)]
    );
}


// INFO: Fetch memory for a user

export async function getMemory(userId: string, type?: string) {
    const result = await pool.query(
        `SELECT * FROM user_memory
     WHERE user_id = $1
     ${type ? "AND type = $2" : ""}
     ORDER BY created_at DESC`,
        type ? [userId, type] : [userId]
    );
    return result.rows.map((row) => ({
        ...row,
        value:
            typeof row.value === "string"
                ? JSON.parse(row.value)
                : row.value,
    }));
}
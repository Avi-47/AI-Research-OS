require("dotenv").config();
const { Pool } = require("pg");
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL
});
async function createTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS evaluations (
                id SERIAL PRIMARY KEY,
                workflow_id UUID NOT NULL,
                overall_score NUMERIC,
                rule_score NUMERIC,
                llm_score NUMERIC,
                passed BOOLEAN NOT NULL DEFAULT FALSE,
                result JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_evaluations_workflow_id
            ON evaluations(workflow_id);
        `);
        console.log("✅ evaluations table created successfully");
    } catch (error) {
        console.error("❌ Failed to create evaluations table");
        console.error(error);
    } finally {
        await pool.end();
    }
}
createTable();
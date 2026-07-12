// backend/test-db.js

require("dotenv").config();

const pool = require("./src/db/postgres");

async function test() {
    try {
        const result = await pool.query("SELECT current_database()");
        console.log(result.rows);
        console.log("CONNECTED");
    } catch (err) {
        console.error(err);
    }
}

test();
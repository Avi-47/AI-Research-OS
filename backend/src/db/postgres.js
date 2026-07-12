const { Pool } = require("pg");

console.log("DB URL:", process.env.POSTGRES_URL);

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL
});

module.exports = pool;
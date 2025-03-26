const { Pool } = require("pg")
const dotenv = require("dotenv");

dotenv.config();
//  Create a connection pool for PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})

pool.connect()
    .then(() => console.log("Connected to PostgreSQL Database"))
    .catch((err) => console.error("Database Connection Error:", err))

module.exports = pool
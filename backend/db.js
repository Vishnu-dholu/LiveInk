const { Pool } = require("pg")
const dotenv = require("dotenv");

dotenv.config();
//  Create a connection pool for PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "drawing_app",
    password: process.env.DB_PASSWORD || "postgres",
    port: process.env.DB_PORT || 5432,

})

pool.connect()
    .then(() => console.log("Connected to PostgreSQL Database"))
    .catch((err) => console.error("Database Connection Error:", err))

module.exports = pool
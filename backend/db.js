import pkg from "pg"; // Default import from 'pg' (CommonJS)
const { Pool } = pkg; // Access 'Pool' from the default export
import { config } from "dotenv";

config();
//  Create a connection pool for PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})

pool.connect()
    .then(() => console.log("Connected to PostgreSQL Database"))
    .catch((err) => console.error("Database Connection Error:", err))

export default pool
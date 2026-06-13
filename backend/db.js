import pkg from "pg"; // Default import from 'pg' (CommonJS)
const { Pool } = pkg; // Access 'Pool' from the default export
import { config } from "dotenv";

config();
//  Create a connection pool for PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool
  .query("SELECT 1")
  .then(() => console.log("Connected to PostgreSQL Database"))
  .catch((err) => console.error("Database Connection Error:", err));

// Prevent Node.js from crashing if an idle database connection drops or times out
pool.on("error", (err, client) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
});

export default pool;

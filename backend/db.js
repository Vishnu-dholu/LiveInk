import pkg from "pg"; // Default import from 'pg' (CommonJS)
const { Pool } = pkg; // Access 'Pool' from the default export
import "./config/env.js";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "db"]);

// SSL is on for remote databases (e.g. Neon) with certificate verification.
// Override with DATABASE_SSL=true|false, or DATABASE_SSL_INSECURE=true to skip verification.
function resolveSsl() {
  if (process.env.DATABASE_SSL === "false") return false;

  let isLocal = false;
  try {
    isLocal = LOCAL_HOSTS.has(new URL(process.env.DATABASE_URL).hostname);
  } catch {
    // Unparsable URL: let pg report the real error
  }

  if (isLocal && process.env.DATABASE_SSL !== "true") return false;
  return { rejectUnauthorized: process.env.DATABASE_SSL_INSECURE !== "true" };
}

//  Create a connection pool for PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: resolveSsl(),
});

pool
  .query("SELECT 1")
  .then(() => console.log("Connected to PostgreSQL Database"))
  .catch((err) => console.error("Database Connection Error:", err));

// Prevent Node.js from crashing if an idle database connection drops or times out
pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
});

export default pool;

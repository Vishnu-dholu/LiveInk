import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

function requireSecret(name) {
  const value = process.env[name];
  if (value) return value;

  if (isProduction) {
    throw new Error(`${name} must be set when NODE_ENV=production`);
  }

  console.warn(
    `[env] ${name} is not set. Using a random per-process secret; ` +
      "tokens will be invalidated on every restart. Set it in backend/.env.",
  );
  return crypto.randomBytes(32).toString("hex");
}

export const JWT_SECRET = requireSecret("JWT_SECRET");
export const CLIENT_URL = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");
export const SERVER_URL = (process.env.SERVER_URL || "http://localhost:5001").replace(/\/+$/, "");
export const PORT = process.env.PORT || 5001;

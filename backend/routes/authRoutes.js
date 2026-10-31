import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import pool from "../db.js";
import { JWT_SECRET } from "../config/env.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: "Too many requests, please try again later." },
});

// Stricter limit for credential endpoints (brute-force protection)
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many login attempts, please try again later." },
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const router = express.Router();
router.use(generalLimiter);

// Register endpoint
router.post("/register", credentialLimiter, async (req, res) => {
  const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = req.body?.password;

  if (username.length < 2 || username.length > 50) {
    return res.status(400).json({ error: "Username must be 2-50 characters." });
  }
  if (!EMAIL_RE.test(email) || email.length > 255) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }
  // bcrypt only uses the first 72 bytes
  if (typeof password !== "string" || password.length < 8 || password.length > 72) {
    return res.status(400).json({ error: "Password must be 8-72 characters." });
  }

  try {
    const existing = await pool.query(
      "SELECT email, username FROM users WHERE LOWER(email) = $1 OR username = $2",
      [email, username],
    );
    if (existing.rows.length > 0) {
      const emailTaken = existing.rows.some((r) => r.email.toLowerCase() === email);
      return res.status(400).json({
        error: emailTaken ? "User already exists." : "Username is already taken.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id",
      [username, email, hashedPassword],
    );
    const id = newUser.rows[0].id;

    const token = jwt.sign({ id }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { id, username, email } });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "User already exists." });
    }
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login endpoint
router.post("/login", credentialLimiter, async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const { password, rememberMe } = req.body || {};

  if (!email || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const userRes = await pool.query("SELECT * FROM users WHERE LOWER(email) = $1", [email]);
    const user = userRes.rows[0];

    // Same message for unknown user, OAuth-only account and wrong password
    const invalid = { error: "Invalid email or password" };
    if (!user || !user.password) return res.status(400).json(invalid);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json(invalid);

    const token = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: rememberMe ? "30d" : "1h",
    });

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await pool.query("SELECT id, username, email FROM users WHERE id = $1", [req.user.id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

export default router;

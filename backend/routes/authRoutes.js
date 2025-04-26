import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import pool from "../db.js"
import { verifyToken } from "../middleware/authMiddleware.js"

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || "Your_secret_key"

// Register endpoint
router.post("/register", async (req, res) => {
    const { username, email, password } = req.body
    try {
        const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email])
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: "User already exists." })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = await pool.query(
            "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
            [username, email, hashedPassword]
        )

        const token = jwt.sign({ id: newUser.rows[0].id }, JWT_SECRET)

        res.status(201).json({
            token, user: {
                id: newUser.rows[0].id,
                username,
                email
            }
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "Registration failed" })
    }
})

// Login endpoint
router.post("/login", async (req, res) => {
    const { email, password, rememberMe } = req.body
    try {
        const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [email])
        const user = userRes.rows[0]

        if (!user) return res.status(400).json({ error: "User not found" })

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" })

        const token = jwt.sign({ id: user.id }, JWT_SECRET, {
            expiresIn: rememberMe ? "30d" : "1h"
        })

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        })
    } catch (err) {
        res.status(500).json({ error: "Login failed" })
    }
})

router.get("/me", verifyToken, async (req, res) => {
    try {
        const user = await pool.query("SELECT id, username, email FROM users WHERE id = $1", [req.user.id])
        res.json(user.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "Failed to fetch user data" })
    }
})

export default router
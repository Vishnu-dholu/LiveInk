import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import { Strategy as GitHubStrategy } from "passport-github2"
import pool from '../db.js'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

export default function initializePassport() {
    passport.serializeUser((user, done) => {
        done(null, user.id)
    })

    passport.deserializeUser(async (id, done) => {
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [id])
        done(null, result.rows[0])
    })

    passport.use(new GoogleStrategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:5000/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
        const email = profile.emails[0].value
        const username = profile.displayName

        let user = await pool.query("SELECT * FROM users WHERE email = $1", [email])
        if (user.rows.length === 0) {
            user = await pool.query("INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *", [username, email, "google-oauth"])
        }
        done(null, user.rows[0])
    }))

    passport.use(new GitHubStrategy({
        clientID: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET,
        callbackURL: "http://localhost:5000/auth/github/callback"
    }, async (accessToken, refreshToken, profile, done) => {
        const username = profile.username
        const email = profile.email?.[0]?.value || `${username}@github.com`

        let user = await pool.query("SELECT * FROM users WHERE email = $1", [email])
        if (user.rows.length === 0) {
            user = await pool.query("INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *", [username, email, "github-oauth"])
        }
        done(null, user.rows[0])
    }))
}
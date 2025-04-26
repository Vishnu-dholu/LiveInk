import express from "express"
import passport from "passport"
import jwt from "jsonwebtoken"

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || "Your_secret_key"

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }))
router.get("/github", passport.authenticate("github", { scope: ["user:email"] }))

router.get("/google/callback", passport.authenticate("google", { session: false }), (req, res) => {
    const token = jwt.sign({ id: req.user.id }, JWT_SECRET)
    res.redirect(`http://localhost:5173/oauth-success?token=${token}`)
})

router.get("/github/callback", passport.authenticate("github", { session: false }), (req, res) => {
    const token = jwt.sign({ id: req.user.id }, JWT_SECRET)
    res.redirect(`http://localhost:5173/oauth-success?token=${token}`)
})

export default router
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key"

export function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: No token provided" })
    }

    const token = authHeader.split(" ")[1]

    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        req.user = decoded
        next()
    } catch (err) {
        res.status(401).json({ error: "Unauthorized: Invalid token" })
    }
}
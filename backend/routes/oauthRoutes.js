import express from "express";
import crypto from "crypto";
import passport from "passport";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { CLIENT_URL, JWT_SECRET } from "../config/env.js";
import { enabledProviders } from "../config/passport.js";

const router = express.Router();

// One-time codes are exchanged for a JWT so the token never appears in a URL.
// In-memory: use a shared store (e.g. Redis) if you run several instances.
const CODE_TTL_MS = 60 * 1000;
const pendingCodes = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [code, entry] of pendingCodes) {
    if (entry.expires < now) pendingCodes.delete(code);
  }
}, CODE_TTL_MS).unref();

function issueCode(userId) {
  const code = crypto.randomBytes(32).toString("hex");
  pendingCodes.set(code, { userId, expires: Date.now() + CODE_TTL_MS });
  return code;
}

const exchangeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60 });

function providerEnabled(provider) {
  return (req, res, next) => {
    if (!enabledProviders.has(provider)) {
      return res.status(404).json({ error: `${provider} login is not configured` });
    }
    next();
  };
}

function registerProvider(provider, scope) {
  router.get(
    `/${provider}`,
    providerEnabled(provider),
    passport.authenticate(provider, { scope, session: false }),
  );

  router.get(
    `/${provider}/callback`,
    providerEnabled(provider),
    passport.authenticate(provider, {
      session: false,
      failureRedirect: `${CLIENT_URL}/login?error=oauth_failed`,
    }),
    (req, res) => {
      res.redirect(`${CLIENT_URL}/oauth-success?code=${issueCode(req.user.id)}`);
    },
  );
}

registerProvider("google", ["profile", "email"]);
registerProvider("github", ["user:email"]);

router.post("/exchange", exchangeLimiter, (req, res) => {
  const code = req.body?.code;
  const entry = typeof code === "string" ? pendingCodes.get(code) : null;
  if (typeof code === "string") pendingCodes.delete(code); // single use

  if (!entry || entry.expires < Date.now()) {
    return res.status(400).json({ error: "Invalid or expired code" });
  }

  const token = jwt.sign({ id: entry.userId }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
});

export default router;

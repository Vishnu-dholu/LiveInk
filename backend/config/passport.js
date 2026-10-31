import passport from "passport";
import { nanoid } from "nanoid";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import pool from "../db.js";
import { SERVER_URL } from "./env.js";

// Providers that have credentials configured (checked by the OAuth routes)
export const enabledProviders = new Set();

async function uniqueUsername(base) {
  const name = (base || "user").slice(0, 40);
  const taken = await pool.query("SELECT 1 FROM users WHERE username = $1", [name]);
  return taken.rowCount === 0 ? name : `${name}-${nanoid(5)}`;
}

/**
 * Resolves an OAuth identity to a local user.
 * Accounts are never merged by email alone: a password account (or one from
 * another provider) with the same email is rejected instead of taken over.
 */
async function findOrCreateOAuthUser(provider, providerId, email, displayName) {
  const byIdentity = await pool.query(
    "SELECT * FROM users WHERE provider = $1 AND provider_id = $2",
    [provider, providerId],
  );
  if (byIdentity.rows[0]) return byIdentity.rows[0];

  const byEmail = await pool.query("SELECT * FROM users WHERE LOWER(email) = $1", [email]);
  const existing = byEmail.rows[0];
  if (existing) {
    // Legacy OAuth rows created before provider_id existed
    if (existing.provider === provider && !existing.provider_id) {
      const linked = await pool.query(
        "UPDATE users SET provider_id = $1 WHERE id = $2 RETURNING *",
        [providerId, existing.id],
      );
      return linked.rows[0];
    }
    return null;
  }

  const username = await uniqueUsername(displayName);
  const created = await pool.query(
    "INSERT INTO users (username, email, password, provider, provider_id) VALUES ($1, $2, NULL, $3, $4) RETURNING *",
    [username, email, provider, providerId],
  );
  return created.rows[0];
}

function oauthCallback(provider, extractEmail) {
  return async (accessToken, refreshToken, profile, done) => {
    try {
      const email = extractEmail(profile);
      if (!email) return done(null, false);

      const user = await findOrCreateOAuthUser(
        provider,
        String(profile.id),
        email,
        profile.displayName || profile.username,
      );
      done(null, user || false);
    } catch (err) {
      done(err);
    }
  };
}

const verifiedEmail = (profile) => {
  const emails = profile.emails || [];
  const isVerified = (e) => e.verified === true || e.verified === "true";
  const best = emails.find((e) => isVerified(e) && e.primary) || emails.find(isVerified);
  return best?.value?.toLowerCase() || null;
};

export default function initializePassport() {
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const result = await pool.query("SELECT id, username, email FROM users WHERE id = $1", [id]);
      done(null, result.rows[0] || false);
    } catch (err) {
      done(err);
    }
  });

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${SERVER_URL}/auth/google/callback`,
        },
        oauthCallback("google", verifiedEmail),
      ),
    );
    enabledProviders.add("google");
  } else {
    console.warn("Google OAuth disabled: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set");
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL: `${SERVER_URL}/auth/github/callback`,
          scope: ["user:email"],
        },
        oauthCallback(
          "github",
          (profile) =>
            verifiedEmail(profile) || `${profile.id}+${profile.username}@users.noreply.github.com`,
        ),
      ),
    );
    enabledProviders.add("github");
  } else {
    console.warn("GitHub OAuth disabled: GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET not set");
  }
}

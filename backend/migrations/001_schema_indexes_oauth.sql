-- Base tables (no-ops on databases created from init.sql)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rooms (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  password TEXT,
  creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  canvas_state JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(255) REFERENCES rooms(id) ON DELETE CASCADE,
  username VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OAuth identities: no more sentinel passwords
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255);

UPDATE users SET provider = 'google', password = NULL WHERE password = 'google-oauth';
UPDATE users SET provider = 'github', password = NULL WHERE password = 'github-oauth';

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider_identity
  ON users (provider, provider_id) WHERE provider_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_messages_room_timestamp ON messages (room_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_rooms_creator_id ON rooms (creator_id);

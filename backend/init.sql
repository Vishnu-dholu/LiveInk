CREATE TABLE IF NOT EXISTS drawings (
  id SERIAL PRIMARY KEY,
  drawing_data JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
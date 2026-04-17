CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  session_token_hash TEXT,
  session_expires_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS api_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  token_uid TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS status_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'stopped', 'error')),
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE INDEX IF NOT EXISTS idx_api_tokens_project_id ON api_tokens(project_id);
CREATE INDEX IF NOT EXISTS idx_api_tokens_hash_active ON api_tokens(token_hash, revoked_at);
CREATE INDEX IF NOT EXISTS idx_status_events_project_created ON status_events(project_id, created_at DESC);

INSERT OR IGNORE INTO admins (username, password_salt, password_hash, created_at)
VALUES (
  'admin',
  'local-seed-salt',
  '028a903a22a27fad2877704f5247668a51fd4f61953e7a4c3fe099469b4780f8',
  '2026-01-01T00:00:00.000Z'
);

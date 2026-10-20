CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE,
  title_en TEXT NOT NULL, title_fa TEXT NOT NULL DEFAULT '',
  excerpt_en TEXT NOT NULL DEFAULT '', excerpt_fa TEXT NOT NULL DEFAULT '',
  body_en TEXT NOT NULL DEFAULT '', body_fa TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL, published_at TEXT,
  revision INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS posts_published ON posts(status, published_at DESC);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS session_expiry ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS rate_limits (bucket TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS rate_expiry ON rate_limits(expires_at);

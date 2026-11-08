import pg from 'pg';

// Idempotent schema setup. Never drops or clears saved matches.
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await db.connect();
  await db.query('BEGIN');
  await db.query(`CREATE TABLE IF NOT EXISTS matches (
    code text PRIMARY KEY,
    state jsonb NOT NULL,
    seats jsonb NOT NULL,
    names jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`);
  await db.query(`CREATE TABLE IF NOT EXISTS profiles (
    id text PRIMARY KEY,
    name text NOT NULL,
    name_key text NOT NULL UNIQUE,
    salt text NOT NULL,
    hash text NOT NULL,
    wins int NOT NULL DEFAULT 0,
    losses int NOT NULL DEFAULT 0,
    bot_wins int NOT NULL DEFAULT 0,
    bot_losses int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
  )`);
  await db.query(`CREATE TABLE IF NOT EXISTS sessions (
    token_hash text PRIMARY KEY,
    profile_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
  )`);
  await db.query('COMMIT');
} catch (error) {
  await db.query('ROLLBACK').catch(() => {});
  throw error;
} finally {
  await db.end().catch(() => {});
}

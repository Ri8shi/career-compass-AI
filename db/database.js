// db/database.js
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const DB_PATH = path.join(dataDir, 'careercompass.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL'); // Better concurrent read performance
db.pragma('foreign_keys = ON');  // Enforce FK constraints

// ── Schema ──────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS analyses (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_role  TEXT    NOT NULL,
    file_name    TEXT,
    model        TEXT,
    analysis     TEXT    NOT NULL,
    created_at   TEXT    DEFAULT (datetime('now'))
  );
`);

console.log('✅ Database initialized at:', DB_PATH);

export default db;

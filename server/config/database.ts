import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export async function initializeDatabase(): Promise<Database> {
  if (db) return db;

  const dbPath = path.resolve(process.env.DB_PATH || './data/finance.db');
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Enable foreign keys
  await db.exec('PRAGMA foreign_keys = ON');

  // Create tables
  await createTables();
  
  return db;
}

async function createTables() {
  if (!db) throw new Error('Database not initialized');

  // Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      currency TEXT DEFAULT 'USD',
      monthly_budget REAL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_active BOOLEAN DEFAULT 1
    )
  `);

  // Sessions table for JWT token tracking
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Transactions table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      amount REAL NOT NULL,
      description TEXT,
      category TEXT,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // EMIs table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS emis (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      principal REAL NOT NULL,
      rate REAL NOT NULL,
      tenure_months INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      amount REAL NOT NULL,
      paid_months INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Money Lent table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS money_lent (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      person_name TEXT NOT NULL,
      amount REAL NOT NULL,
      reason TEXT,
      date_lent TEXT NOT NULL,
      return_date TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'returned', 'partial')),
      amount_returned REAL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Money Borrowed table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS money_borrowed (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      person_name TEXT NOT NULL,
      amount REAL NOT NULL,
      reason TEXT,
      date_borrowed TEXT NOT NULL,
      return_date TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'returned', 'partial')),
      amount_returned REAL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Reminders table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT NOT NULL,
      type TEXT,
      is_completed BOOLEAN DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // User Settings table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      theme TEXT DEFAULT 'light',
      notifications_enabled BOOLEAN DEFAULT 1,
      two_factor_enabled BOOLEAN DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Indexes for better query performance
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_emis_user_id ON emis(user_id);
    CREATE INDEX IF NOT EXISTS idx_money_lent_user_id ON money_lent(user_id);
    CREATE INDEX IF NOT EXISTS idx_money_borrowed_user_id ON money_borrowed(user_id);
    CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
  `);
}

export function getDatabase(): Database {
  if (!db) throw new Error('Database not initialized. Call initializeDatabase first.');
  return db;
}

export async function closeDatabase() {
  if (db) {
    await db.close();
    db = null;
  }
}

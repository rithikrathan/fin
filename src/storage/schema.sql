-- Fin Manager — SQLite Schema
-- Used by TauriStorageService via tauri-plugin-sql

CREATE TABLE IF NOT EXISTS funds (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  allocation_pct REAL NOT NULL DEFAULT 0,
  allocation_locked INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#ffffff',
  deadline TEXT,
  goal_amount REAL,
  interest_rate REAL,
  interest_frequency TEXT,
  interest_calc_type TEXT,
  is_career_fund INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS milestones (
  id INTEGER PRIMARY KEY,
  fund_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  target_amount REAL NOT NULL,
  reached INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (fund_id) REFERENCES funds(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fund_snapshots (
  id INTEGER PRIMARY KEY,
  fund_id INTEGER NOT NULL,
  balance REAL NOT NULL,
  date TEXT NOT NULL,
  FOREIGN KEY (fund_id) REFERENCES funds(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  notes TEXT DEFAULT '',
  file_id TEXT,
  file_name TEXT,
  name TEXT,
  amount REAL,
  income_type TEXT,
  category TEXT,
  fund_allocation TEXT,
  description TEXT,
  fund_id INTEGER,
  fund_name TEXT,
  planned INTEGER,
  is_misc INTEGER,
  from_fund_id INTEGER,
  to_fund_id INTEGER,
  note TEXT
);

CREATE TABLE IF NOT EXISTS wants (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  target_price REAL NOT NULL,
  current_saved REAL NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  purchased INTEGER NOT NULL DEFAULT 0,
  purchase_date TEXT,
  notes TEXT DEFAULT '',
  days_to_buy INTEGER,
  predicted_date TEXT,
  photo_url TEXT,
  purchase_link TEXT,
  added_at TEXT NOT NULL,
  no_lock INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS needs (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  recurring INTEGER NOT NULL DEFAULT 0,
  frequency TEXT,
  due_date TEXT,
  fund_id INTEGER NOT NULL,
  fund_name TEXT NOT NULL,
  autopay INTEGER NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  reapproval_required INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS investments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  invest_amount REAL NOT NULL,
  current_value REAL NOT NULL,
  purchase_date TEXT NOT NULL,
  notes TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS debts (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  total_principal REAL NOT NULL,
  remaining_balance REAL NOT NULL,
  emi_amount REAL NOT NULL,
  interest_rate REAL NOT NULL,
  due_date INTEGER NOT NULL,
  linked_fund_id INTEGER NOT NULL,
  notes TEXT DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  data BLOB NOT NULL
);

CREATE TABLE IF NOT EXISTS message_patterns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_app TEXT,
  example_sms TEXT NOT NULL DEFAULT '',
  field_selectors TEXT NOT NULL DEFAULT '[]',
  full_regex TEXT NOT NULL DEFAULT '',
  message_type TEXT NOT NULL DEFAULT 'transaction',
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sms_logs (
  id TEXT PRIMARY KEY,
  message_text TEXT NOT NULL,
  message_source TEXT,
  timestamp TEXT NOT NULL,
  pattern_id TEXT,
  matched INTEGER NOT NULL DEFAULT 0,
  parsed_fields TEXT NOT NULL DEFAULT '{}',
  transaction_id INTEGER,
  dismissed INTEGER NOT NULL DEFAULT 0,
  notification_id TEXT
);

CREATE TABLE IF NOT EXISTS detected_transactions (
  id TEXT PRIMARY KEY,
  sms_log_id TEXT NOT NULL,
  amount REAL NOT NULL,
  tx_type TEXT NOT NULL,
  account_number TEXT,
  bank_name TEXT,
  merchant TEXT,
  date TEXT NOT NULL,
  balance_after REAL,
  fund_id INTEGER,
  category TEXT,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'detected',
  created_transaction_id INTEGER
);

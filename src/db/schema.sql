CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,

    txn_date DATE NOT NULL,

    merchant TEXT NOT NULL,

    category TEXT,

    amount NUMERIC(12,2) NOT NULL,

    currency TEXT NOT NULL,

    memo TEXT
);

CREATE INDEX IF NOT EXISTS idx_transactions_date
ON transactions(txn_date);

CREATE INDEX IF NOT EXISTS idx_transactions_category
ON transactions(category);

CREATE INDEX IF NOT EXISTS idx_transactions_merchant
ON transactions(merchant);


CREATE TABLE IF NOT EXISTS funds (
    id TEXT PRIMARY KEY,

    name TEXT NOT NULL,

    category TEXT
);

CREATE INDEX IF NOT EXISTS idx_funds_name
ON funds(name);


CREATE TABLE IF NOT EXISTS fund_navs (
    fund_id TEXT NOT NULL
        REFERENCES funds(id)
        ON DELETE CASCADE,

    nav_date DATE NOT NULL,

    nav_value NUMERIC(12,4) NOT NULL,

    PRIMARY KEY (fund_id, nav_date)
);

CREATE INDEX IF NOT EXISTS idx_navs_fund
ON fund_navs(fund_id);

CREATE INDEX IF NOT EXISTS idx_navs_date
ON fund_navs(nav_date);


CREATE TABLE IF NOT EXISTS holdings (
    id SERIAL PRIMARY KEY,

    fund_id TEXT NOT NULL
        REFERENCES funds(id)
        ON DELETE CASCADE,

    units NUMERIC(14,4) NOT NULL,

    purchase_date DATE NOT NULL,

    purchase_nav NUMERIC(12,4) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_holdings_fund
ON holdings(fund_id);

-- NOTE: User memory table

CREATE TABLE IF NOT EXISTS user_memory (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- spending_pattern | merchant | fund | insight
  key TEXT,
  value JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
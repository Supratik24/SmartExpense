CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE transaction_source AS ENUM ('sms', 'manual', 'import');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE auth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('email_verification', 'password_reset')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE category_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_pattern TEXT NOT NULL,
  category TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  category TEXT NOT NULL DEFAULT 'Others',
  merchant TEXT NOT NULL,
  notes TEXT,
  transaction_date TIMESTAMPTZ NOT NULL,
  type transaction_type NOT NULL,
  source transaction_source NOT NULL DEFAULT 'manual',
  payment_method TEXT,
  account_mask TEXT,
  reference_number TEXT,
  raw_text TEXT,
  confidence NUMERIC(5,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sms_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  sender TEXT,
  raw_text TEXT NOT NULL,
  parser_name TEXT,
  parsed BOOLEAN NOT NULL DEFAULT FALSE,
  error TEXT,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_user_category ON transactions(user_id, category);
CREATE INDEX idx_sms_imports_user_created ON sms_imports(user_id, created_at DESC);

INSERT INTO category_rules (merchant_pattern, category, priority) VALUES
  ('SWIGGY', 'Food', 10),
  ('ZOMATO', 'Food', 10),
  ('UBER', 'Travel', 10),
  ('OLA', 'Travel', 10),
  ('AMAZON', 'Shopping', 10),
  ('FLIPKART', 'Shopping', 10),
  ('NETFLIX', 'Entertainment', 20),
  ('APOLLO', 'Health', 20),
  ('BYJU', 'Education', 20),
  ('LIC', 'Investment', 20),
  ('ELECTRICITY', 'Bills', 20);

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username                    VARCHAR(50)  UNIQUE NOT NULL,
  email                       VARCHAR(255) UNIQUE NOT NULL,
  password_hash               VARCHAR(255),
  oauth_provider              VARCHAR(20),
  oauth_id                    VARCHAR(255),
  avatar_url                  TEXT,
  email_verified              BOOLEAN     DEFAULT FALSE,
  email_verification_token    VARCHAR(255),
  email_verification_expires  TIMESTAMP,
  password_reset_token        VARCHAR(255),
  password_reset_expires      TIMESTAMP,
  plan                        VARCHAR(20) DEFAULT 'lite'
    CHECK (plan IN ('lite','pro','premium')),
  plan_expires_at             TIMESTAMP,
  is_active                   BOOLEAN     DEFAULT TRUE,
  last_login                  TIMESTAMP,
  preferences                 JSONB       DEFAULT '{"theme":"light","language":"en"}',
  created_at                  TIMESTAMP   DEFAULT NOW(),
  updated_at                  TIMESTAMP   DEFAULT NOW()
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID REFERENCES users(id) ON DELETE CASCADE,
  role                 VARCHAR(20) DEFAULT 'admin'
    CHECK (role IN ('super_admin','admin','moderator')),
  permissions          JSONB    DEFAULT '[]',
  invited_by           UUID     REFERENCES admins(id),
  invitation_token     VARCHAR(255),
  invitation_expires   TIMESTAMP,
  invitation_accepted  BOOLEAN  DEFAULT FALSE,
  is_active            BOOLEAN  DEFAULT TRUE,
  created_at           TIMESTAMP DEFAULT NOW(),
  updated_at           TIMESTAMP DEFAULT NOW()
);

-- Boards table
CREATE TABLE IF NOT EXISTS boards (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  title            VARCHAR(255) DEFAULT 'Untitled Board',
  description      TEXT,
  thumbnail_url    TEXT,
  canvas_data      JSONB DEFAULT '{"elements":[],"appState":{},"files":{}}',
  is_public        BOOLEAN DEFAULT FALSE,
  share_token      VARCHAR(255) UNIQUE,
  allow_edit       BOOLEAN DEFAULT FALSE,
  collaborators    JSONB   DEFAULT '[]',
  frame_settings   JSONB   DEFAULT '{}',
  tags             TEXT[],
  is_archived      BOOLEAN   DEFAULT FALSE,
  is_deleted       BOOLEAN   DEFAULT FALSE,
  last_accessed    TIMESTAMP DEFAULT NOW(),
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

-- Board collaborators table
CREATE TABLE IF NOT EXISTS board_collaborators (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id    UUID REFERENCES boards(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  permission  VARCHAR(20) DEFAULT 'view'
    CHECK (permission IN ('view','edit','admin')),
  invited_by  UUID REFERENCES users(id),
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE (board_id, user_id)
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  plan            VARCHAR(20) NOT NULL
    CHECK (plan IN ('lite','pro','premium')),
  status          VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','active','expired','cancelled','failed')),
  order_id        VARCHAR(255) UNIQUE NOT NULL,
  amount          INTEGER NOT NULL,
  payment_method  VARCHAR(50),
  payment_data    JSONB,
  starts_at       TIMESTAMP,
  expires_at      TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  order_id        VARCHAR(255) UNIQUE NOT NULL,
  amount          INTEGER NOT NULL,
  fee             INTEGER DEFAULT 0,
  total_payment   INTEGER NOT NULL,
  payment_method  VARCHAR(50) NOT NULL,
  payment_number  TEXT,
  status          VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','paid','expired','failed','cancelled')),
  expired_at      TIMESTAMP,
  paid_at         TIMESTAMP,
  pakasir_data    JSONB,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- AI Usage table
CREATE TABLE IF NOT EXISTS ai_usage (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  board_id     UUID REFERENCES boards(id) ON DELETE SET NULL,
  tool_type    VARCHAR(50) NOT NULL
    CHECK (tool_type IN ('text_to_diagram','mermaid_to_inkboard','wireframe_to_code')),
  prompt       TEXT,
  result       TEXT,
  tokens_used  INTEGER   DEFAULT 0,
  status       VARCHAR(20) DEFAULT 'success',
  created_at   TIMESTAMP DEFAULT NOW()
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES users(id)  ON DELETE SET NULL,
  admin_id     UUID REFERENCES admins(id) ON DELETE SET NULL,
  action       VARCHAR(100) NOT NULL,
  entity_type  VARCHAR(50),
  entity_id    UUID,
  details      JSONB,
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- Library items (templates) table
CREATE TABLE IF NOT EXISTS library_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  canvas_data   JSONB NOT NULL,
  thumbnail_url TEXT,
  category      VARCHAR(50),
  is_public     BOOLEAN DEFAULT FALSE,
  tags          TEXT[],
  use_count     INTEGER DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  type        VARCHAR(50) DEFAULT 'info',
  is_read     BOOLEAN DEFAULT FALSE,
  action_url  TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Site settings table
CREATE TABLE IF NOT EXISTS site_settings (
  key         VARCHAR(100) PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_by  UUID REFERENCES admins(id),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_email          ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan           ON users(plan);
CREATE INDEX IF NOT EXISTS idx_users_is_active      ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_boards_user_id       ON boards(user_id);
CREATE INDEX IF NOT EXISTS idx_boards_share_token   ON boards(share_token);
CREATE INDEX IF NOT EXISTS idx_boards_is_deleted    ON boards(is_deleted);
CREATE INDEX IF NOT EXISTS idx_payments_order_id    ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id     ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status      ON payments(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user   ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_order  ON subscriptions(order_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id     ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_tool        ON ai_usage(tool_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user   ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin  ON activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user   ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_bc_board_id          ON board_collaborators(board_id);
CREATE INDEX IF NOT EXISTS idx_bc_user_id           ON board_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_library_public       ON library_items(is_public);
CREATE INDEX IF NOT EXISTS idx_admins_user_id       ON admins(user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_library_items_updated_at
  BEFORE UPDATE ON library_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DEFAULT DATA
-- ============================================================
INSERT INTO site_settings (key, value) VALUES
  ('site_name',            '"Inkboard"'),
  ('maintenance_mode',     'false'),
  ('registration_enabled', 'true'),
  ('plans', '{
    "lite":    {"price":     0, "boards":  1, "share_access": false, "share_view": true,  "ai": false, "library": true},
    "pro":     {"price": 15000, "boards": 10, "share_access": true,  "share_view": true,  "ai": false, "library": true},
    "premium": {"price": 30000, "boards": -1, "share_access": true,  "share_view": true,  "ai": true,  "library": true}
  }')
ON CONFLICT (key) DO NOTHING;
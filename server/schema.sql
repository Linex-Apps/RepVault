-- RepVault Database Schema
-- Turso/SQLite

-- Businesses: stores info about each local service business
CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  google_place_id TEXT,
  facebook_page_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Users: business owners / team members
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  stripe_customer_id TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'trial' CHECK(subscription_status IN ('trial', 'active', 'canceled', 'past_due')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Reviews: fetched from Google / Facebook
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK(platform IN ('google', 'facebook')),
  reviewer_name TEXT,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  text TEXT,
  review_date TEXT,
  url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Responses: AI-drafted and/or approved responses to reviews
CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  draft_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'published')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT
);

-- Settings: per-business configuration
CREATE TABLE IF NOT EXISTS settings (
  business_id TEXT PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
  auto_approve INTEGER NOT NULL DEFAULT 0 CHECK(auto_approve IN (0, 1)),
  response_tone TEXT NOT NULL DEFAULT 'Professional' CHECK(response_tone IN ('Professional', 'Friendly', 'Grateful')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_users_business_id ON users(business_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_platform ON reviews(platform);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_responses_review_id ON responses(review_id);
CREATE INDEX IF NOT EXISTS idx_responses_status ON responses(status);
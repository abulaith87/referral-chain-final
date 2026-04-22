-- ReferralChain Database Setup Script
-- Run this in Supabase SQL Editor to initialize all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by TEXT,
  paypal_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  commission_rate DECIMAL(5, 2) NOT NULL,
  affiliate_link TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  trending BOOLEAN DEFAULT FALSE,
  sales_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  referrer_id TEXT NOT NULL,
  referred_id TEXT NOT NULL,
  referral_code TEXT NOT NULL,
  commission_earned DECIMAL(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_id) REFERENCES users(id),
  FOREIGN KEY (referred_id) REFERENCES users(id)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('commission', 'withdrawal', 'deposit')),
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  description TEXT,
  paypal_transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Earnings table
CREATE TABLE IF NOT EXISTS earnings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT,
  referral_id TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  commission_rate DECIMAL(5, 2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (referral_id) REFERENCES referrals(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_earnings_user_id ON earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_earnings_status ON earnings(status);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (TRUE);

-- Create RLS Policies for products table (public read)
CREATE POLICY "Products are publicly readable" ON products
  FOR SELECT USING (TRUE);

-- Create RLS Policies for transactions table
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (TRUE);

-- Create RLS Policies for earnings table
CREATE POLICY "Users can view their own earnings" ON earnings
  FOR SELECT USING (TRUE);

-- Insert sample products
INSERT INTO products (id, name, description, price, commission_rate, affiliate_link, category, trending, sales_count, is_active)
VALUES
  ('prod_1', 'VPN اشتراك سنوي', 'خدمة VPN آمنة وسريعة', 49.99, 15, 'https://example.com/vpn', 'أدوات', TRUE, 2450, TRUE),
  ('prod_2', 'حزمة قوالب تصميم احترافية', 'مجموعة قوالب تصميم عالية الجودة', 29.99, 12, 'https://example.com/templates', 'تصميم', TRUE, 1820, TRUE),
  ('prod_3', 'أداة إدارة مشاريع', 'منصة متكاملة لإدارة المشاريع', 39.99, 18, 'https://example.com/pm-tool', 'أعمال', FALSE, 1540, TRUE),
  ('prod_4', 'حزمة أيقونات احترافية', 'آلاف الأيقونات بجودة عالية', 19.99, 10, 'https://example.com/icons', 'تصميم', TRUE, 2100, TRUE),
  ('prod_5', 'قالب متجر إلكتروني', 'قالب متجر احترافي وسهل الاستخدام', 59.99, 20, 'https://example.com/store', 'تجارة', FALSE, 1280, TRUE),
  ('prod_6', 'إضافة WordPress مدفوعة', 'إضافة قوية لتحسين موقعك', 34.99, 14, 'https://example.com/wp-plugin', 'تطوير', TRUE, 980, TRUE),
  ('prod_7', 'كتاب SEO للمبتدئين', 'دليل شامل لتعلم SEO من الصفر', 14.99, 8, 'https://example.com/seo-book', 'تعليم', FALSE, 3200, TRUE),
  ('prod_8', 'أداة جدولة السوشيال', 'أداة احترافية لجدولة منشورات السوشيال', 24.99, 11, 'https://example.com/social-scheduler', 'تسويق', TRUE, 1650, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON products TO authenticated;
GRANT ALL ON referrals TO authenticated;
GRANT ALL ON transactions TO authenticated;
GRANT ALL ON earnings TO authenticated;

-- Grant public read access to products
GRANT SELECT ON products TO anon;

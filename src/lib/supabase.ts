import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey)
}

// Database types
export interface User {
  id: string
  email: string
  full_name: string
  username: string
  avatar_url?: string
  referral_code: string
  referred_by?: string
  paypal_email?: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  commission_rate: number
  affiliate_link: string
  category: string
  image_url?: string
  trending: boolean
  sales_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  referral_code: string
  commission_earned: number
  status: 'pending' | 'active' | 'cancelled'
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: 'commission' | 'withdrawal' | 'deposit'
  amount: number
  status: 'pending' | 'completed' | 'failed'
  description?: string
  paypal_transaction_id?: string
  created_at: string
}

export interface Earnings {
  id: string
  user_id: string
  product_id?: string
  referral_id?: string
  amount: number
  commission_rate: number
  status: 'pending' | 'confirmed' | 'paid'
  created_at: string
}

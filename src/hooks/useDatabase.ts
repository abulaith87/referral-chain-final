import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Product, Transaction, NetworkStats } from '../types'

/* =========================
   HELPERS
========================= */

// 🔥 جلب UUID الحقيقي من Supabase Auth
const getAuthUserId = async () => {
  const { data, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Auth error:', error)
    return null
  }
  return data.user?.id || null
}

/* =========================
   PRODUCTS (REAL-TIME READY)
========================= */
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()

    // 🔥 Real-time subscription
    const channel = supabase
      .channel('products-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchProducts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchProducts = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sales_count', { ascending: false })

    if (error) {
      console.error('Products error:', error)
    }

    setProducts(data || [])
    setLoading(false)
  }

  return { products, loading, refetch: fetchProducts }
}

/* =========================
   TRANSACTIONS
========================= */
export function useTransactions(userId?: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) fetchTransactions()
  }, [userId])

  const fetchTransactions = async () => {
    const uid = userId || (await getAuthUserId())
    if (!uid) return

    setLoading(true)

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Transactions error:', error)
    }

    setTransactions(data || [])
    setLoading(false)
  }

  return { transactions, loading, refetch: fetchTransactions }
}

/* =========================
   EARNINGS + NETWORK
========================= */
export function useEarnings(userId?: string) {
  const [stats, setStats] = useState<NetworkStats>({
    total_referrals: 0,
    active_referrals: 0,
    total_earnings: 0,
    pending_earnings: 0,
    paid_earnings: 0,
  })

  useEffect(() => {
    if (userId) fetchStats()
  }, [userId])

  const fetchStats = async () => {
    const uid = userId || (await getAuthUserId())
    if (!uid) return

    const [{ data: earnings }, { data: referrals }] = await Promise.all([
      supabase.from('earnings').select('*').eq('user_id', uid),
      supabase.from('referrals').select('*').eq('referrer_id', uid),
    ])

    const pending =
      earnings?.filter(e => e.status === 'pending')
        .reduce((s, e) => s + e.amount, 0) || 0

    const paid =
      earnings?.filter(e => e.status === 'paid')
        .reduce((s, e) => s + e.amount, 0) || 0

    setStats({
      total_referrals: referrals?.length || 0,
      active_referrals:
        referrals?.filter(r => r.status === 'active').length || 0,
      total_earnings: pending + paid,
      pending_earnings: pending,
      paid_earnings: paid,
    })
  }

  return { stats, refetch: fetchStats }
}

/* =========================
   ADMIN (FULL CONTROL)
========================= */
export function useAdmin() {
  const [loading, setLoading] = useState(false)

  const addProduct = async (
    product: Omit<Product, 'id' | 'created_at' | 'sales_count'>
  ) => {
    setLoading(true)

    const { error } = await supabase.from('products').insert([
      {
        id: crypto.randomUUID(),
        ...product,
        sales_count: 0,
        created_at: new Date().toISOString(),
      },
    ])

    setLoading(false)
    return { success: !error, error }
  }

  const updateProduct = async (id: string, data: Partial<Product>) => {
    setLoading(true)

    const { error } = await supabase
      .from('products')
      .update(data)
      .eq('id', id)

    setLoading(false)
    return { success: !error, error }
  }

  const deleteProduct = async (id: string) => {
    setLoading(true)

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    setLoading(false)
    return { success: !error, error }
  }

  return { addProduct, updateProduct, deleteProduct, loading }
}

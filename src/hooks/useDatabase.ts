import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Product, Transaction, Earnings, NetworkStats } from '../types'

/* =========================
   PRODUCTS
========================= */
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('sales_count', { ascending: false })

    if (error || !data || data.length === 0) {
      setProducts(getDefaultProducts())
    } else {
      setProducts(data)
    }

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
    if (!userId) return

    setLoading(true)

    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

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
    if (!userId) return

    const [{ data: earnings }, { data: referrals }] = await Promise.all([
      supabase.from('earnings').select('*').eq('user_id', userId),
      supabase.from('referrals').select('*').eq('referrer_id', userId),
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
   ADMIN
========================= */
export function useAdmin() {
  const [loading, setLoading] = useState(false)

  const addProduct = async (product: Omit<Product, 'id'>) => {
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
    return await supabase.from('products').update(data).eq('id', id)
  }

  const deleteProduct = async (id: string) => {
    return await supabase.from('products').delete().eq('id', id)
  }

  return { addProduct, updateProduct, deleteProduct, loading }
}

/* =========================
   DEFAULT DATA (FALLBACK)
========================= */
function getDefaultProducts(): Product[] {
  return [
    {
      id: '1',
      name: 'VPN Pro',
      price: 49,
      commission_rate: 15,
      affiliate_link: '#',
      category: 'أدوات',
      trending: true,
      sales_count: 1000,
      is_active: true,
    },
    {
      id: '2',
      name: 'Design Pack',
      price: 29,
      commission_rate: 12,
      affiliate_link: '#',
      category: 'تصميم',
      trending: true,
      sales_count: 800,
      is_active: true,
    },
  ]
}

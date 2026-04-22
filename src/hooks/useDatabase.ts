import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Product, Transaction, Earnings, NetworkStats } from '../types'

// Hook for fetching products
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch from Supabase
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('sales_count', { ascending: false })

      if (error) {
        console.warn('Error fetching products:', error)
        // Fallback to default products if database is empty
        setProducts(getDefaultProducts())
      } else if (data && data.length > 0) {
        setProducts(data)
        console.log(`✅ Loaded ${data.length} products from database`)
      } else {
        console.log('No products found in database, using defaults')
        setProducts(getDefaultProducts())
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
      setError('فشل في تحميل المنتجات')
      setProducts(getDefaultProducts())
    }
    setLoading(false)
  }

  return { products, loading, error, refetch: fetchProducts }
}

// Hook for fetching user transactions
export function useTransactions(userId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) fetchTransactions()
  }, [userId])

  const fetchTransactions = async () => {
    if (!userId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.warn('Error fetching transactions:', error)
        setTransactions(getDefaultTransactions(userId))
      } else {
        setTransactions(data || [])
        console.log(`✅ Loaded ${data?.length || 0} transactions for user ${userId}`)
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
      setTransactions(getDefaultTransactions(userId))
    }
    setLoading(false)
  }

  return { transactions, loading, refetch: fetchTransactions }
}

// Hook for user earnings and network stats
export function useEarnings(userId: string | undefined) {
  const [stats, setStats] = useState<NetworkStats>({
    total_referrals: 0,
    active_referrals: 0,
    total_earnings: 0,
    pending_earnings: 0,
    paid_earnings: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) fetchEarnings()
  }, [userId])

  const fetchEarnings = async () => {
    if (!userId) return

    setLoading(true)
    try {
      // Fetch earnings data
      const { data: earningsData, error: earningsError } = await supabase
        .from('earnings')
        .select('*')
        .eq('user_id', userId)

      if (earningsError) throw earningsError

      // Fetch referrals data
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId)

      if (referralsError) throw referralsError

      // Calculate stats
      if (earningsData && earningsData.length > 0) {
        const pending = earningsData
          .filter((e: Earnings) => e.status === 'pending')
          .reduce((sum: number, e: Earnings) => sum + e.amount, 0)
        const confirmed = earningsData
          .filter((e: Earnings) => e.status === 'confirmed')
          .reduce((sum: number, e: Earnings) => sum + e.amount, 0)
        const paid = earningsData
          .filter((e: Earnings) => e.status === 'paid')
          .reduce((sum: number, e: Earnings) => sum + e.amount, 0)

        const totalReferrals = referralsData?.length || 0
        const activeReferrals = referralsData?.filter((r: any) => r.status === 'active').length || 0

        setStats({
          total_referrals: totalReferrals,
          active_referrals: activeReferrals,
          total_earnings: pending + confirmed + paid,
          pending_earnings: pending,
          paid_earnings: paid,
        })

        console.log(`✅ Earnings loaded - Total: $${pending + confirmed + paid}, Pending: $${pending}`)
      } else {
        console.log('No earnings found for user, using defaults')
        setStats({
          total_referrals: referralsData?.length || 0,
          active_referrals: referralsData?.filter((r: any) => r.status === 'active').length || 0,
          total_earnings: 0,
          pending_earnings: 0,
          paid_earnings: 0,
        })
      }
    } catch (err) {
      console.error('Failed to fetch earnings:', err)
      setStats({
        total_referrals: 0,
        active_referrals: 0,
        total_earnings: 0,
        pending_earnings: 0,
        paid_earnings: 0,
      })
    }
    setLoading(false)
  }

  const addEarning = async (amount: number, description: string, productId?: string, referralId?: string) => {
    if (!userId) return

    try {
      // Add to earnings table
      const { error: earningError } = await supabase.from('earnings').insert([{
        id: 'earning_' + Date.now(),
        user_id: userId,
        product_id: productId,
        referral_id: referralId,
        amount,
        commission_rate: 0,
        status: 'pending',
        created_at: new Date().toISOString(),
      }])

      if (earningError) throw earningError

      // Also add to transactions for history
      const { error: txnError } = await supabase.from('transactions').insert([{
        id: 'txn_' + Date.now(),
        user_id: userId,
        type: 'commission',
        amount,
        status: 'completed',
        description,
        created_at: new Date().toISOString(),
      }])

      if (txnError) throw txnError

      // Update local stats
      setStats(prev => ({
        ...prev,
        total_earnings: prev.total_earnings + amount,
        pending_earnings: prev.pending_earnings + amount,
      }))

      console.log(`✅ Earning added: $${amount}`)
    } catch (err) {
      console.error('Failed to add earning:', err)
    }
  }

  return { stats, loading, addEarning, refetch: fetchEarnings }
}

// Default products data (fallback)
function getDefaultProducts(): Product[] {
  return [
    {
      id: 'prod_1',
      name: 'VPN اشتراك سنوي',
      price: 49.99,
      commission_rate: 15,
      affiliate_link: 'https://example.com/vpn',
      category: 'أدوات',
      trending: true,
      sales_count: 2450,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod_2',
      name: 'حزمة قوالب تصميم احترافية',
      price: 29.99,
      commission_rate: 12,
      affiliate_link: 'https://example.com/templates',
      category: 'تصميم',
      trending: true,
      sales_count: 1820,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod_3',
      name: 'أداة إدارة مشاريع',
      price: 39.99,
      commission_rate: 18,
      affiliate_link: 'https://example.com/pm-tool',
      category: 'أعمال',
      trending: false,
      sales_count: 1540,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod_4',
      name: 'حزمة أيقونات احترافية',
      price: 19.99,
      commission_rate: 10,
      affiliate_link: 'https://example.com/icons',
      category: 'تصميم',
      trending: true,
      sales_count: 2100,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod_5',
      name: 'قالب متجر إلكتروني',
      price: 59.99,
      commission_rate: 20,
      affiliate_link: 'https://example.com/store',
      category: 'تجارة',
      trending: false,
      sales_count: 1280,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod_6',
      name: 'إضافة WordPress مدفوعة',
      price: 34.99,
      commission_rate: 14,
      affiliate_link: 'https://example.com/wp-plugin',
      category: 'تطوير',
      trending: true,
      sales_count: 980,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod_7',
      name: 'كتاب SEO للمبتدئين',
      price: 14.99,
      commission_rate: 8,
      affiliate_link: 'https://example.com/seo-book',
      category: 'تعليم',
      trending: false,
      sales_count: 3200,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod_8',
      name: 'أداة جدولة السوشيال',
      price: 24.99,
      commission_rate: 11,
      affiliate_link: 'https://example.com/social-scheduler',
      category: 'تسويق',
      trending: true,
      sales_count: 1650,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]
}

// Default transactions (fallback)
function getDefaultTransactions(userId: string): Transaction[] {
  return [
    { id: '1', user_id: userId, type: 'commission', amount: 42.50, status: 'completed', description: 'عمولة VPN', created_at: new Date().toISOString() },
    { id: '2', user_id: userId, type: 'commission', amount: 87.00, status: 'completed', description: 'عمولة قوالب', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: '3', user_id: userId, type: 'withdrawal', amount: -150.00, status: 'completed', description: 'سحب PayPal', created_at: new Date(Date.now() - 172800000).toISOString() },
  ]
}

// Hook for admin operations
export function useAdmin() {
  const [loading, setLoading] = useState(false)

  const addProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'sales_count'>) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('products').insert([{
        id: 'prod_' + Date.now(),
        ...product,
        sales_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])

      if (error) throw error
      console.log('✅ Product added successfully')
      return { success: true }
    } catch (err) {
      console.error('Failed to add product:', err)
      return { success: false, error: 'فشل في إضافة المنتج' }
    } finally {
      setLoading(false)
    }
  }

  const updateProduct = async (id: string, data: Partial<Product>) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('products').update({
        ...data,
        updated_at: new Date().toISOString(),
      }).eq('id', id)

      if (error) throw error
      console.log('✅ Product updated successfully')
      return { success: true }
    } catch (err) {
      console.error('Failed to update product:', err)
      return { success: false, error: 'فشل في تحديث المنتج' }
    } finally {
      setLoading(false)
    }
  }

  const deleteProduct = async (id: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('products').delete().eq('id', id)

      if (error) throw error
      console.log('✅ Product deleted successfully')
      return { success: true }
    } catch (err) {
      console.error('Failed to delete product:', err)
      return { success: false, error: 'فشل في حذف المنتج' }
    } finally {
      setLoading(false)
    }
  }

  return { addProduct, updateProduct, deleteProduct, loading }
}

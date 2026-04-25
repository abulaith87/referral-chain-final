import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useProducts } from '../hooks/useDatabase'
import { Product } from '../types'

export function Products() {
  const { products, loading } = useProducts()
  const [processingId, setProcessingId] = useState<string | null>(null)

  // جلب المستخدم الحالي من Supabase Auth
  const getUser = async () => {
    const { data } = await supabase.auth.getUser()
    return data.user
  }

  // 🔥 عند الضغط على المنتج يتم تسجيل ربح
  const handleProductClick = async (product: Product) => {
    try {
      setProcessingId(product.id)

      const user = await getUser()
      if (!user) {
        alert('يجب تسجيل الدخول أولاً')
        return
      }

      // حساب العمولة
      const commission = (product.price * product.commission_rate) / 100

      // 1️⃣ تسجيل الأرباح في جدول earnings
      const { error: earningsError } = await supabase.from('earnings').insert([
        {
          id: crypto.randomUUID(),
          user_id: user.id,
          product_id: product.id,
          amount: commission,
          commission_rate: product.commission_rate,
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ])

      if (earningsError) {
        console.error('Earnings error:', earningsError)
        return
      }

      // 2️⃣ تسجيل عملية في transactions
      const { error: txnError } = await supabase.from('transactions').insert([
        {
          id: crypto.randomUUID(),
          user_id: user.id,
          type: 'commission',
          amount: commission,
          status: 'completed',
          description: `ربح من منتج: ${product.name}`,
          created_at: new Date().toISOString(),
        },
      ])

      if (txnError) {
        console.error('Transaction error:', txnError)
        return
      }

      // 3️⃣ تحديث عدد المبيعات للمنتج
      await supabase
        .from('products')
        .update({
          sales_count: product.sales_count + 1,
        })
        .eq('id', product.id)

      // 4️⃣ فتح رابط المنتج (اختياري)
      window.open(product.affiliate_link, '_blank')

      console.log('✅ Commission added:', commission)
    } catch (err) {
      console.error('Click error:', err)
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return <div className="text-white">جاري تحميل المنتجات...</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {products.map((product) => (
        <div
          key={product.id}
          onClick={() => handleProductClick(product)}
          className="bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition"
        >
          <h3 className="text-lg font-bold text-white">{product.name}</h3>

          <p className="text-gray-300 mt-2">
            السعر: ${product.price}
          </p>

          <p className="text-green-400 mt-1">
            عمولة: {product.commission_rate}%
          </p>

          <p className="text-sm text-gray-400 mt-2">
            التصنيف: {product.category}
          </p>

          <p className="text-xs text-gray-500 mt-2">
            المبيعات: {product.sales_count}
          </p>

          {processingId === product.id && (
            <p className="text-yellow-400 mt-2">جاري المعالجة...</p>
          )}
        </div>
      ))}
    </div>
  )
}

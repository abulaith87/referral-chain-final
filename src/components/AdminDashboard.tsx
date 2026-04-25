import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAdmin } from '../hooks/useDatabase'
import { Product } from '../types'

export function AdminDashboard() {
  const { addProduct, loading } = useAdmin()
  const [products, setProducts] = useState<Product[]>([])

  const [form, setForm] = useState({
    name: '',
    price: 0,
    commission_rate: 0,
    affiliate_link: '',
    category: '',
    trending: false,
    is_active: true,
  })

  /* =========================
     FETCH PRODUCTS
  ========================= */
  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    setProducts(data || [])
  }

  useEffect(() => {
    fetchProducts()

    // 🔥 Real-time updates
    const channel = supabase
      .channel('admin-products-live')
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

  /* =========================
     FORM HANDLING
  ========================= */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    setForm(prev => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await addProduct({
      ...form,
      price: Number(form.price),
      commission_rate: Number(form.commission_rate),
    })

    if (res.success) {
      alert('✅ تم إضافة المنتج')
      setForm({
        name: '',
        price: 0,
        commission_rate: 0,
        affiliate_link: '',
        category: '',
        trending: false,
        is_active: true,
      })
    } else {
      alert('❌ فشل الإضافة')
    }
  }

  /* =========================
     UI
  ========================= */
  return (
    <div className="text-white max-w-4xl mx-auto space-y-8">

      <h2 className="text-2xl font-bold">لوحة تحكم المدير</h2>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-3 bg-gray-900 p-5 rounded-xl">
        <input name="name" placeholder="اسم المنتج" value={form.name} onChange={handleChange} className="w-full p-2 bg-gray-800 rounded" />

        <input name="price" type="number" placeholder="السعر" value={form.price} onChange={handleChange} className="w-full p-2 bg-gray-800 rounded" />

        <input name="commission_rate" type="number" placeholder="نسبة العمولة" value={form.commission_rate} onChange={handleChange} className="w-full p-2 bg-gray-800 rounded" />

        <input name="affiliate_link" placeholder="رابط المنتج" value={form.affiliate_link} onChange={handleChange} className="w-full p-2 bg-gray-800 rounded" />

        <input name="category" placeholder="التصنيف" value={form.category} onChange={handleChange} className="w-full p-2 bg-gray-800 rounded" />

        <label className="flex gap-2 items-center">
          <input type="checkbox" name="trending" checked={form.trending} onChange={handleChange} />
          ترند
        </label>

        <button className="w-full bg-green-600 p-2 rounded">
          {loading ? 'جاري...' : 'إضافة المنتج'}
        </button>
      </form>

      {/* PRODUCTS LIST */}
      <div className="bg-gray-900 p-5 rounded-xl">
        <h3 className="text-xl font-bold mb-4">المنتجات</h3>

        {products.length === 0 ? (
          <p>لا يوجد منتجات</p>
        ) : (
          <div className="space-y-3">
            {products.map(p => (
              <div
                key={p.id}
                className="bg-gray-800 p-3 rounded flex justify-between"
              >
                <div>
                  <p className="font-bold">{p.name}</p>
                  <p className="text-sm text-gray-400">
                    ${p.price} | {p.category}
                  </p>
                </div>

                <span className="text-green-400">
                  {p.sales_count} مبيعات
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAdmin } from '../hooks/useDatabase'
import { Product } from '../types'

export function AdminDashboard() {
  const { addProduct, updateProduct, deleteProduct, loading } = useAdmin()

  const [products, setProducts] = useState<Product[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)

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
     LOAD PRODUCTS
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

    const channel = supabase
      .channel('admin-products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => fetchProducts()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  /* =========================
     FORM CHANGE
  ========================= */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target

    setForm(prev => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    }))
  }

  /* =========================
     ADD / UPDATE PRODUCT
  ========================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingId) {
      // UPDATE
      await updateProduct(editingId, {
        ...form,
        price: Number(form.price),
        commission_rate: Number(form.commission_rate),
      })
    } else {
      // ADD
      await addProduct({
        ...form,
        price: Number(form.price),
        commission_rate: Number(form.commission_rate),
      })
    }

    setForm({
      name: '',
      price: 0,
      commission_rate: 0,
      affiliate_link: '',
      category: '',
      trending: false,
      is_active: true,
    })

    setEditingId(null)
  }

  /* =========================
     EDIT PRODUCT
  ========================= */
  const handleEdit = (product: Product) => {
    setForm({
      name: product.name,
      price: product.price,
      commission_rate: product.commission_rate,
      affiliate_link: product.affiliate_link,
      category: product.category,
      trending: product.trending,
      is_active: product.is_active,
    })

    setEditingId(product.id)
  }

  /* =========================
     DELETE PRODUCT
  ========================= */
  const handleDelete = async (id: string) => {
    if (confirm('هل تريد حذف المنتج؟')) {
      await deleteProduct(id)
    }
  }

  /* =========================
     UI
  ========================= */
  return (
    <div className="text-white max-w-5xl mx-auto space-y-8">

      <h2 className="text-2xl font-bold">لوحة تحكم المدير</h2>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="bg-gray-900 p-5 rounded-xl space-y-3">

        <input name="name" placeholder="اسم المنتج" value={form.name} onChange={handleChange} className="w-full p-2 bg-gray-800 rounded" />

        <input name="price" type="number" placeholder="السعر" value={form.price} onChange={handleChange} className="w-full p-2 bg-gray-800 rounded" />

        <input name="commission_rate" type="number" placeholder="العمولة" value={form.commission_rate} onChange={handleChange} className="w-full p-2 bg-gray-800 rounded" />

        <input name="affiliate_link" placeholder="الرابط" value={form.affiliate_link} onChange={handleChange} className="w-full p-2 bg-gray-800 rounded" />

        <input name="category" placeholder="التصنيف" value={form.category} onChange={handleChange} className="w-full p-2 bg-gray-800 rounded" />

        <label className="flex gap-2 items-center">
          <input type="checkbox" name="trending" checked={form.trending} onChange={handleChange} />
          ترند
        </label>

        <button className="w-full bg-green-600 p-2 rounded">
          {editingId ? 'تحديث المنتج' : 'إضافة المنتج'}
        </button>
      </form>

      {/* PRODUCTS */}
      <div className="bg-gray-900 p-5 rounded-xl space-y-3">
        <h3 className="text-xl font-bold">المنتجات</h3>

        {products.map(p => (
          <div key={p.id} className="bg-gray-800 p-3 rounded flex justify-between items-center">

            <div>
              <p className="font-bold">{p.name}</p>
              <p className="text-sm text-gray-400">
                ${p.price} | {p.category}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(p)}
                className="bg-yellow-500 px-3 py-1 rounded"
              >
                تعديل
              </button>

              <button
                onClick={() => handleDelete(p.id)}
                className="bg-red-600 px-3 py-1 rounded"
              >
                حذف
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}

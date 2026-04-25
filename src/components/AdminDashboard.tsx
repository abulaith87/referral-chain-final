import React, { useEffect, useState } from 'react'
import { useAdmin, useProducts } from '../hooks/useDatabase'
import { Product } from '../types'

export function AdminDashboard() {
  const { addProduct, deleteProduct, updateProduct, loading } = useAdmin()
  const { products, refetch } = useProducts()

  const [editingId, setEditingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    commission_rate: 0,
    affiliate_link: '',
    category: '',
    trending: false,
    is_active: true,
  })

  useEffect(() => {
    refetch()
  }, [])

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  const handleSubmit = async () => {
    const res = await addProduct({
      ...form,
      price: Number(form.price),
      commission_rate: Number(form.commission_rate),
    } as any)

    if (res.success) {
      alert('تم إضافة المنتج بنجاح')
      setForm({
        name: '',
        description: '',
        price: 0,
        commission_rate: 0,
        affiliate_link: '',
        category: '',
        trending: false,
        is_active: true,
      })
      refetch()
    } else {
      alert('حدث خطأ')
    }
  }

  const handleDelete = async (id: string) => {
    await deleteProduct(id)
    refetch()
  }

  const handleEdit = (product: Product) => {
    setEditingId(product.id)
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      commission_rate: product.commission_rate,
      affiliate_link: product.affiliate_link,
      category: product.category,
      trending: product.trending,
      is_active: product.is_active,
    })
  }

  const handleUpdate = async () => {
    if (!editingId) return

    const res = await updateProduct(editingId, {
      ...form,
      price: Number(form.price),
      commission_rate: Number(form.commission_rate),
    })

    if (res.success) {
      alert('تم تحديث المنتج')
      setEditingId(null)
      setForm({
        name: '',
        description: '',
        price: 0,
        commission_rate: 0,
        affiliate_link: '',
        category: '',
        trending: false,
        is_active: true,
      })
      refetch()
    } else {
      alert('فشل التحديث')
    }
  }

  return (
    <div className="text-white p-4 space-y-6">

      <h2 className="text-2xl font-bold">لوحة التحكم</h2>

      {/* FORM */}
      <div className="grid gap-2 max-w-md">

        <input
          name="name"
          placeholder="اسم المنتج"
          value={form.name}
          onChange={handleChange}
          className="p-2 text-black"
        />

        <input
          name="description"
          placeholder="الوصف"
          value={form.description}
          onChange={handleChange}
          className="p-2 text-black"
        />

        <input
          name="price"
          type="number"
          placeholder="السعر"
          value={form.price}
          onChange={handleChange}
          className="p-2 text-black"
        />

        <input
          name="commission_rate"
          type="number"
          placeholder="نسبة العمولة"
          value={form.commission_rate}
          onChange={handleChange}
          className="p-2 text-black"
        />

        <input
          name="affiliate_link"
          placeholder="رابط الأفلييت"
          value={form.affiliate_link}
          onChange={handleChange}
          className="p-2 text-black"
        />

        <input
          name="category"
          placeholder="التصنيف"
          value={form.category}
          onChange={handleChange}
          className="p-2 text-black"
        />

        <label className="flex gap-2">
          <input
            type="checkbox"
            name="trending"
            checked={form.trending}
            onChange={handleChange}
          />
          ترند
        </label>

        <label className="flex gap-2">
          <input
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
          />
          نشط
        </label>

        {editingId ? (
          <button onClick={handleUpdate} className="bg-blue-600 p-2">
            تحديث المنتج
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading} className="bg-green-600 p-2">
            {loading ? 'جاري الإضافة...' : 'إضافة منتج'}
          </button>
        )}
      </div>

      {/* PRODUCTS LIST */}
      <div className="mt-6">
        <h3 className="text-xl mb-2">المنتجات الحالية</h3>

        <div className="grid gap-3">
          {products.map((p) => (
            <div key={p.id} className="bg-gray-800 p-3 rounded flex justify-between items-center">

              <div>
                <p className="font-bold">{p.name}</p>
                <p className="text-sm text-gray-400">${p.price}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(p)}
                  className="bg-yellow-600 px-2 py-1"
                >
                  تعديل
                </button>

                <button
                  onClick={() => handleDelete(p.id)}
                  className="bg-red-600 px-2 py-1"
                >
                  حذف
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

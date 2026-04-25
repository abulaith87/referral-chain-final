import React, { useState } from 'react'
import { useAdmin } from '../hooks/useDatabase'

export function AdminDashboard() {
  const { addProduct, deleteProduct, updateProduct, loading } = useAdmin()

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
    } else {
      alert('حدث خطأ')
    }
  }

  return (
    <div className="text-white p-4 space-y-4">

      <h2 className="text-2xl font-bold">لوحة التحكم</h2>

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

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-green-600 p-2"
        >
          {loading ? 'جاري الإضافة...' : 'إضافة منتج'}
        </button>

      </div>
    </div>
  )
}

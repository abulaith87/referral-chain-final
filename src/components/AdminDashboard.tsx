import React, { useState } from 'react'
import { useAdmin } from '../hooks/useDatabase'

export function AdminDashboard() {
  const { addProduct, loading } = useAdmin()

  const [form, setForm] = useState({
    name: '',
    price: 0,
    commission_rate: 0,
    affiliate_link: '',
    category: '',
    trending: false,
    is_active: true,
  })

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
      alert('✅ تم إضافة المنتج بنجاح')

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
      alert('❌ فشل في إضافة المنتج')
    }
  }

  return (
    <div className="text-white max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">لوحة تحكم المدير</h2>

      <form onSubmit={handleSubmit} className="space-y-4 bg-gray-900 p-5 rounded-xl">
        
        <input
          name="name"
          placeholder="اسم المنتج"
          value={form.name}
          onChange={handleChange}
          className="w-full p-2 bg-gray-800 rounded"
        />

        <input
          name="price"
          type="number"
          placeholder="السعر"
          value={form.price}
          onChange={handleChange}
          className="w-full p-2 bg-gray-800 rounded"
        />

        <input
          name="commission_rate"
          type="number"
          placeholder="نسبة العمولة"
          value={form.commission_rate}
          onChange={handleChange}
          className="w-full p-2 bg-gray-800 rounded"
        />

        <input
          name="affiliate_link"
          placeholder="رابط المنتج"
          value={form.affiliate_link}
          onChange={handleChange}
          className="w-full p-2 bg-gray-800 rounded"
        />

        <input
          name="category"
          placeholder="التصنيف"
          value={form.category}
          onChange={handleChange}
          className="w-full p-2 bg-gray-800 rounded"
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="trending"
            checked={form.trending}
            onChange={handleChange}
          />
          ترند
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 p-2 rounded"
        >
          {loading ? 'جاري الإضافة...' : 'إضافة المنتج'}
        </button>
      </form>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Product } from '../types'

export function AdminDashboard() {
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
      .order('created_at', { ascending: false })

    if (!error && data) {
      setProducts(data)
    }

    setLoading(false)
  }

  return (
    <div className="text-white p-4">
      <h2 className="text-2xl font-bold mb-4">لوحة تحكم المدير</h2>

      {loading ? (
        <p>جاري التحميل...</p>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-gray-800 p-3 rounded-lg flex justify-between"
            >
              <div>
                <p className="font-bold">{p.name}</p>
                <p className="text-sm text-gray-400">
                  {p.category} • ${p.price}
                </p>
              </div>

              <div className="text-green-400">
                {p.sales_count} بيع
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

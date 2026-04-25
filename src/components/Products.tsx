import React from 'react'
import { useProducts } from '../hooks/useDatabase'

export function Products() {
  const { products, loading } = useProducts()

  if (loading) {
    return <div className="text-white">جاري تحميل المنتجات...</div>
  }

  return (
    <div className="text-white p-4 grid gap-4">

      <h2 className="text-2xl font-bold mb-4">المنتجات</h2>

      {products.length === 0 && (
        <p>لا توجد منتجات حالياً</p>
      )}

      {products.map((product) => (
        <div
          key={product.id}
          className="border p-3 rounded bg-gray-800"
        >

          <h3 className="text-lg font-bold">{product.name}</h3>

          <p className="text-sm opacity-70">
            {product.description}
          </p>

          <div className="mt-2">
            <p>السعر: ${product.price}</p>
            <p>العمولة: {product.commission_rate}%</p>
            <p>التصنيف: {product.category}</p>
          </div>

          <a
            href={product.affiliate_link}
            target="_blank"
            className="text-blue-400 underline mt-2 block"
          >
            فتح الرابط
          </a>

        </div>
      ))}

    </div>
  )
}

import React from 'react'
import { useEarnings } from '../hooks/useDatabase'

interface Props {
  userId?: string
}

export function StatsDashboard({ userId }: Props) {
  const { stats } = useEarnings(userId)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-white">

      {/* Total Earnings */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-gray-400 text-sm">إجمالي الأرباح</h3>
        <p className="text-2xl font-bold text-green-400">
          ${stats.total_earnings.toFixed(2)}
        </p>
      </div>

      {/* Pending Earnings */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-gray-400 text-sm">أرباح معلّقة</h3>
        <p className="text-2xl font-bold text-yellow-400">
          ${stats.pending_earnings.toFixed(2)}
        </p>
      </div>

      {/* Referrals */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-gray-400 text-sm">عدد الإحالات</h3>
        <p className="text-2xl font-bold text-blue-400">
          {stats.total_referrals}
        </p>
      </div>

      {/* Active Referrals */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-gray-400 text-sm">إحالات نشطة</h3>
        <p className="text-2xl font-bold text-purple-400">
          {stats.active_referrals}
        </p>
      </div>

    </div>
  )
}

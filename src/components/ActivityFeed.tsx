import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Activity = {
  id: string
  message: string
  created_at: string
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])

  const fetchActivities = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setActivities(
        data.map((t: any) => ({
          id: t.id,
          message: `💰 تم تسجيل عمولة: $${t.amount}`,
          created_at: t.created_at,
        }))
      )
    }
  }

  useEffect(() => {
    fetchActivities()

    // 🔥 Real-time updates
    const channel = supabase
      .channel('activity-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        (payload) => {
          const t: any = payload.new

          setActivities((prev) => [
            {
              id: t.id,
              message: `💰 عمولة جديدة: $${t.amount}`,
              created_at: t.created_at,
            },
            ...prev.slice(0, 9),
          ])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="bg-gray-900 p-4 rounded-lg text-white">
      <h3 className="text-lg font-bold mb-3">النشاط المباشر</h3>

      <div className="space-y-2">
        {activities.map((a) => (
          <div
            key={a.id}
            className="bg-gray-800 p-2 rounded text-sm"
          >
            {a.message}
          </div>
        ))}
      </div>
    </div>
  )
}

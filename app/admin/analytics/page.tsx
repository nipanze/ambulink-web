'use client'
import { useState, useEffect } from 'react'
import { Loader2, TrendingUp, DollarSign, Clock, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatUGX } from '@/lib/utils'
import type { DailyStats } from '@/lib/types'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

export default function AdminAnalyticsPage() {
  const [stats,   setStats]   = useState<DailyStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('vw_daily_stats').select('*').limit(30)
      .then(({ data }) => {
        setStats((data ?? []).reverse())
        setLoading(false)
      })
  }, [])

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-gray-400" />
    </div>
  )

  const totalBookings = stats.reduce((s, d) => s + d.total_bookings, 0)
  const totalRevenue  = stats.reduce((s, d) => s + (d.total_revenue ?? 0), 0)
  const totalComplete = stats.reduce((s, d) => s + d.completed_count, 0)
  const avgAssignment = stats.reduce((s, d) => s + (d.avg_assignment_minutes ?? 0), 0) / (stats.filter(d => d.avg_assignment_minutes).length || 1)

  const typeData = [
    { name: 'Emergency',     value: stats.reduce((s, d) => s + d.emergency_count, 0),     color: '#DC2626' },
    { name: 'Scheduled',     value: stats.reduce((s, d) => s + d.scheduled_count, 0),     color: '#2563EB' },
    { name: 'Institutional', value: stats.reduce((s, d) => s + d.institutional_count, 0), color: '#7C3AED' },
    { name: 'Highway',       value: stats.reduce((s, d) => s + d.highway_count, 0),        color: '#EA580C' },
  ]

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      <h1 className="text-2xl font-black">Analytics</h1>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: '🚑', label: 'Total Bookings',    value: totalBookings.toLocaleString(),           color: 'text-red-600'    },
          { icon: '💰', label: 'Total Revenue',     value: formatUGX(totalRevenue),                   color: 'text-green-600'  },
          { icon: '✅', label: 'Completed Trips',   value: totalComplete.toLocaleString(),            color: 'text-blue-600'   },
          { icon: '⚡', label: 'Avg Assignment (min)', value: avgAssignment.toFixed(1),               color: 'text-orange-600' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="card text-center">
            <div className="text-3xl mb-1">{icon}</div>
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Bookings over time */}
      <div className="card">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-red-500" /> Daily Bookings (Last 30 Days)
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={stats}>
            <XAxis dataKey="stat_date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip labelFormatter={l => `Date: ${l}`} />
            <Area type="monotone" dataKey="completed_count" stackId="1" stroke="#16A34A" fill="#dcfce7" name="Completed" />
            <Area type="monotone" dataKey="cancelled_count" stackId="1" stroke="#DC2626" fill="#fee2e2" name="Cancelled" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Revenue chart */}
        <div className="card">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <DollarSign size={16} className="text-green-500" /> Daily Revenue (UGX)
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats}>
              <XAxis dataKey="stat_date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: any) => [`UGX ${Number(v).toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="total_revenue" fill="#DC2626" radius={[4, 4, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Booking type distribution */}
        <div className="card">
          <h2 className="font-bold mb-4">Booking Type Distribution</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={typeData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false} fontSize={11}>
                {typeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Response time chart */}
        <div className="card">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Clock size={16} className="text-blue-500" /> Avg Response Time (min)
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={stats.filter(d => d.avg_response_minutes)}>
              <XAxis dataKey="stat_date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: any) => [`${Number(v).toFixed(1)} min`, 'Avg Response']} />
              <Area type="monotone" dataKey="avg_response_minutes" stroke="#2563EB" fill="#dbeafe" name="Avg Response (min)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Distance chart */}
        <div className="card">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <MapPin size={16} className="text-purple-500" /> Avg Trip Distance (km)
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.filter(d => d.avg_distance_km)}>
              <XAxis dataKey="stat_date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: any) => [`${Number(v).toFixed(1)} km`, 'Avg Distance']} />
              <Bar dataKey="avg_distance_km" fill="#7C3AED" radius={[4, 4, 0, 0]} name="Avg Distance (km)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { Loader2, TrendingUp, Users, Ambulance, Building2, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { StatusBadge, TypeBadge } from '@/components/shared/Badges'
import { timeAgo, formatUGX } from '@/lib/utils'
import type { BookingOverview, DailyStats } from '@/lib/types'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function AdminDashboard() {
  const [overview, setOverview] = useState<BookingOverview[]>([])
  const [stats,    setStats]    = useState<DailyStats[]>([])
  const [counts,   setCounts]   = useState({ drivers: 0, patients: 0, institutions: 0, pending: 0 })
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: ovData }, { data: stData }, { data: uData }, { data: iData }] = await Promise.all([
        supabase.from('vw_booking_overview').select('*').limit(20),
        supabase.from('vw_daily_stats').select('*').limit(14),
        supabase.from('users').select('id, role'),
        supabase.from('institutions').select('id, status'),
      ])
      setOverview(ovData ?? [])
      setStats((stData ?? []).reverse())
      const users = uData ?? []
      setCounts({
        drivers:      users.filter(u => u.role === 'driver').length,
        patients:     users.filter(u => u.role === 'patient').length,
        institutions: (iData ?? []).filter(i => i.status === 'active').length,
        pending:      (iData ?? []).filter(i => i.status === 'pending').length,
      })
      setLoading(false)
    }
    load()
  }, [])

  const todayStats = stats[stats.length - 1]

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Admin Dashboard</h1>
        <span className="badge bg-red-100 text-red-700">🛡️ Admin</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading…
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Ambulance,    label: 'Today\'s Bookings', value: todayStats?.total_bookings ?? 0, color: 'text-red-600',    bg: 'bg-red-50'    },
              { icon: CheckCircle,  label: 'Completed Today',   value: todayStats?.completed_count ?? 0,color: 'text-green-600',  bg: 'bg-green-50'  },
              { icon: Users,        label: 'Total Drivers',      value: counts.drivers,                  color: 'text-blue-600',   bg: 'bg-blue-50'   },
              { icon: Building2,    label: 'Institutions',        value: counts.institutions,             color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="card flex items-center gap-3">
                <div className={`${bg} p-3 rounded-lg`}>
                  <Icon className={color} size={22} />
                </div>
                <div>
                  <p className={`text-2xl font-black ${color}`}>{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue chart */}
          {stats.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-green-500" /> Bookings (Last 14 Days)
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stats}>
                  <XAxis dataKey="stat_date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => [v, 'Bookings']} labelFormatter={l => `Date: ${l}`} />
                  <Area type="monotone" dataKey="total_bookings" stroke="#DC2626" fill="#fee2e2" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Pending institutions alert */}
          {counts.pending > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle size={20} className="text-yellow-600" />
              <div className="flex-1">
                <p className="font-semibold text-yellow-800">{counts.pending} institution(s) pending approval</p>
                <p className="text-sm text-yellow-600">Review and approve them to activate their access.</p>
              </div>
              <a href="/admin/institutions" className="btn-primary text-xs py-1.5">Review</a>
            </div>
          )}

          {/* Live bookings table */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold">Live Booking Overview</h2>
              <a href="/admin/bookings" className="text-sm text-red-600 hover:underline">View all →</a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Ref','Type','Status','Patient','Pickup','Driver','Plate','Time'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {overview.map(b => (
                    <tr key={b.booking_id} className={`hover:bg-gray-50 transition-colors ${b.is_priority ? 'bg-red-50/50' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{b.booking_ref}</td>
                      <td className="px-4 py-3"><TypeBadge type={b.booking_type} /></td>
                      <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{b.patient_name}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[140px] truncate">{b.pickup_address || '—'}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{b.driver_name || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.vehicle_plate || '—'}</td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{timeAgo(b.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

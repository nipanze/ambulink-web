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
  const [assigning, setAssigning] = useState<number | null>(null)
  const [onlineDrivers, setOnlineDrivers] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    async function load() {
      setRefreshing(true)
      const [{ data: ovData }, { data: stData }, { data: uData }, { data: iData }, { data: drData }] = await Promise.all([
        supabase.from('vw_booking_overview').select('*').limit(20).order('created_at', { ascending: false }),
        supabase.from('vw_daily_stats').select('*').limit(14),
        supabase.from('users').select('id, role'),
        supabase.from('institutions').select('id, status'),
        supabase.from('vw_online_drivers').select('*')
      ])
      setOverview(ovData ?? [])
      setStats((stData ?? []).reverse())
      setOnlineDrivers(drData ?? [])
      
      const users = (uData as { role: string }[]) ?? []
      const insts = (iData as { status: string }[]) ?? []
      setCounts({
        drivers:      users.filter(u => u.role === 'driver').length,
        patients:     users.filter(u => u.role === 'patient').length,
        institutions: insts.filter(i => i.status === 'active').length,
        pending:      insts.filter(i => i.status === 'pending').length,
      })
      setLoading(false)
      setRefreshing(false)
    }
    load()

    const channel = supabase.channel('dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, load)
      .subscribe()
    
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function assignDriver(bookingId: number, driverId: number) {
    const { error } = await supabase
      .from('bookings')
      .update({ driver_id: driverId, status: 'assigned', assigned_at: new Date().toISOString() })
      .eq('id', bookingId)
    
    if (error) {
      alert('Assignment failed: ' + error.message)
    } else {
      setAssigning(null)
      // load() will be triggered by realtime sub
    }
  }

  const todayStats = stats[stats.length - 1]

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Admin Dashboard</h1>
        <div className="flex items-center gap-2">
           {refreshing && <Loader2 size={14} className="animate-spin text-gray-400" />}
           <span className="badge bg-red-100 text-red-700">🛡️ Admin</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading…
        </div>
      ) : (
        <>
          {/* Urgent SOS Banner */}
          {overview.some(b => b.status === 'requested') && (
            <div className="bg-red-600 text-white rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse-slow">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center animate-ping">
                   <AlertCircle size={32} />
                </div>
                <div>
                   <h2 className="text-2xl font-black uppercase tracking-tight">Active Emergencies</h2>
                   <p className="opacity-80 font-bold">{overview.filter(b => b.status === 'requested').length} patient(s) awaiting dispatch</p>
                </div>
              </div>
              <a href="/admin/bookings" className="w-full md:w-auto bg-white text-red-600 px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-all shadow-xl">
                 GO TO DISPATCH CENTER
              </a>
            </div>
          )}

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
                    {['Ref','Status','Patient','Pickup','Driver','Time','Action'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {overview.map(b => (
                    <tr key={b.booking_id} className={`hover:bg-gray-50 transition-colors ${b.is_priority ? 'bg-red-50/50' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{b.booking_ref}</td>
                      <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                      <td className="px-4 py-3 text-gray-700 font-bold whitespace-nowrap">{b.patient_name}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[140px] truncate">{b.pickup_address || '—'}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                         {b.driver_name ? (
                           <div className="flex flex-col">
                             <span className="font-bold">{b.driver_name}</span>
                             <span className="text-[10px] font-mono text-gray-400">{b.vehicle_plate}</span>
                           </div>
                         ) : (
                           <span className="text-gray-300 italic text-xs">Unassigned</span>
                         )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{timeAgo(b.created_at)}</td>
                      <td className="px-4 py-3">
                         {b.status === 'requested' && (
                           <button 
                             onClick={() => setAssigning(b.booking_id)}
                             className="text-[10px] font-black uppercase text-red-600 hover:text-white hover:bg-red-600 border border-red-600 px-2 py-1 rounded transition-all"
                           >
                             Assign
                           </button>
                         )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Quick Assign Modal */}
      {assigning && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-red-600 text-white">
              <h3 className="text-lg font-black">Quick Dispatch</h3>
              <button onClick={() => setAssigning(null)} className="opacity-70 hover:opacity-100 uppercase text-[10px] font-black">Close</button>
            </div>
            <div className="p-4 bg-gray-50 text-[11px] font-bold text-gray-500 flex items-center gap-2">
              <Ambulance size={14} /> SELECT AN ONLINE AMBULANCE
            </div>
            <div className="max-h-[300px] overflow-y-auto p-2">
              {onlineDrivers.filter(d => d.status === 'active').length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No drivers currently online</div>
              ) : (
                onlineDrivers.filter(d => d.status === 'active').map(d => (
                  <button 
                    key={d.driver_id} 
                    onClick={() => assignDriver(assigning, d.driver_id)}
                    className="w-full text-left p-4 hover:bg-red-50 hover:border-red-100 border border-transparent rounded-2xl flex items-center justify-between group transition-all"
                  >
                    <div>
                      <p className="font-black text-gray-900 group-hover:text-red-700">{d.full_name}</p>
                      <p className="text-xs text-gray-500 font-medium">{d.vehicle_plate} · {d.vehicle_type}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                      →
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

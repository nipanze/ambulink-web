'use client'
import { useState, useEffect } from 'react'
import { Loader2, Search, RefreshCw, MapPin, Clock, X, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { StatusBadge, TypeBadge, PriorityBadge } from '@/components/shared/Badges'
import { timeAgo, formatUGX } from '@/lib/utils'
import type { BookingOverview, BookingStatus } from '@/lib/types'

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingOverview[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [status,   setStatus]   = useState<BookingStatus | 'all'>('all')
  const [assigning, setAssigning] = useState<number | null>(null)
  const [onlineDrivers, setOnlineDrivers] = useState<any[]>([])

  async function load() {
    setLoading(true)
    let q = supabase.from('vw_booking_overview').select('*').order('created_at', { ascending: false }).limit(100)
    if (status !== 'all') q = q.eq('status', status)
    const { data } = await q
    setBookings((data as BookingOverview[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [status])

  // Real-time
  useEffect(() => {
    const ch = supabase.channel('admin-bookings').on('postgres_changes',
      { event: '*', schema: 'public', table: 'bookings' }, load).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const filtered = bookings.filter(b =>
    !search ||
    b.booking_ref.toLowerCase().includes(search.toLowerCase()) ||
    b.patient_name.toLowerCase().includes(search.toLowerCase()) ||
    (b.driver_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (b.pickup_address ?? '').toLowerCase().includes(search.toLowerCase())
  )

  async function openAssign(bookingId: number) {
    setAssigning(bookingId)
    const { data } = await supabase.from('vw_online_drivers').select('*')
    setOnlineDrivers(data ?? [])
  }

  async function confirmAssign(driverId: number) {
    if (!assigning) return
    const { error } = await supabase
      .from('bookings')
      .update({ 
        driver_id: driverId, 
        status: 'assigned',
        assigned_at: new Date().toISOString()
      })
      .eq('id', assigning)
    
    if (error) {
      toast.error('Assignment failed: ' + error.message)
    } else {
      toast.success('Driver assigned successfully')
      setAssigning(null)
      load()
    }
  }

  const ALL: (BookingStatus | 'all')[] = ['all','requested','assigned','en_route','at_scene','transporting','completed','cancelled']

  return (
    <div className="flex-1 p-4 md:p-6 space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">All Bookings</h1>
        <button onClick={load} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-8" placeholder="Search ref, patient, driver, address…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-full sm:w-40" value={status} onChange={e => setStatus(e.target.value as any)}>
          {ALL.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace('_',' ')}</option>)}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-gray-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No bookings found.</div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['','Ref','Type','Status','Patient','Pickup','Driver','Plate','Fare','Time'].map(h => (
                      <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(b => (
                    <tr key={b.booking_id} className={`hover:bg-gray-50 transition-colors ${b.is_priority ? 'bg-red-50/40' : ''}`}>
                      <td className="px-3 py-3">
                        <PriorityBadge isPriority={b.is_priority} />
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-gray-600">{b.booking_ref}</td>
                      <td className="px-3 py-3"><TypeBadge type={b.booking_type} /></td>
                      <td className="px-3 py-3"><StatusBadge status={b.status} /></td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-gray-800 whitespace-nowrap">{b.patient_name}</p>
                        <p className="text-xs text-gray-400">{b.patient_phone}</p>
                      </td>
                      <td className="px-3 py-3 max-w-[130px]">
                        <p className="text-gray-700 text-xs truncate">{b.pickup_address || '—'}</p>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-700">{b.driver_name || '—'}</td>
                      <td className="px-3 py-3 font-mono text-xs text-gray-500">{b.vehicle_plate || '—'}</td>
                      <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{formatUGX(b.fare_amount)}</td>
                      <td className="px-3 py-3 text-gray-400 whitespace-nowrap text-xs">{timeAgo(b.created_at)}</td>
                      <td className="px-3 py-3 text-right">
                        {b.status === 'requested' && (
                          <button onClick={() => openAssign(b.booking_id)} className="btn-primary text-[10px] py-1 px-2 whitespace-nowrap">
                            Assign Driver
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet View */}
            <div className="lg:hidden divide-y divide-gray-100">
              {filtered.map(b => (
                <div key={b.booking_id} className={`p-4 space-y-3 hover:bg-gray-50 transition-colors ${b.is_priority ? 'bg-red-50/20' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-gray-400">{b.booking_ref}</span>
                      <PriorityBadge isPriority={b.is_priority} />
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">{b.patient_name}</p>
                      <p className="text-xs text-gray-500">{b.patient_phone}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <TypeBadge type={b.booking_type} />
                      <p className="text-sm font-black text-red-600 mt-1">{formatUGX(b.fare_amount)}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50/50 rounded-lg p-2.5 space-y-2">
                    <div className="flex items-start gap-2 text-xs text-gray-700">
                      <MapPin size={12} className="text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-1">{b.pickup_address || 'Current Location'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="font-medium text-gray-400">Driver:</span>
                        <span className="truncate">{b.driver_name || 'Unassigned'}</span>
                      </div>
                      {b.vehicle_plate && <span className="font-mono text-gray-400 border border-gray-200 px-1 rounded">{b.vehicle_plate}</span>}
                    </div>
                  </div>

                    {b.status === 'requested' && (
                      <button onClick={() => openAssign(b.booking_id)} className="btn-primary text-[10px] py-1 w-full mt-2">
                        Assign Driver
                      </button>
                    )}
                    <span className="mt-2 text-right w-full text-[10px] text-gray-400 block">{timeAgo(b.created_at)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      {assigning && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Select Dispatch Driver</h2>
              <button onClick={() => setAssigning(null)} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="max-h-[400px] overflow-y-auto p-2 space-y-1">
              {onlineDrivers.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs italic">No online drivers available for dispatch.</div>
              ) : (
                onlineDrivers.map(d => (
                  <button key={d.driver_id} onClick={() => confirmAssign(d.driver_id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-left transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600 font-black">
                      {d.driver_name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900 line-clamp-1">{d.driver_name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{d.vehicle_plate} · {d.vehicle_type}</p>
                    </div>
                    <ChevronRight size={16} className="ml-auto text-gray-200 group-hover:text-red-300" />
                  </button>
                ))
              )}
            </div>
            <div className="p-4 bg-gray-50 text-[10px] text-gray-400 text-center">
              Only active, online drivers are shown.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

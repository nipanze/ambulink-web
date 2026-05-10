'use client'
import { useState, useEffect, useCallback } from 'react'
import { Clock, Search, MapPin, CheckCircle, XCircle, Loader2, Calendar, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { StatusBadge, TypeBadge } from '@/components/shared/Badges'
import { timeAgo, formatUGX } from '@/lib/utils'
import type { Booking, Driver } from '@/lib/types'

export default function DriverHistoryPage() {
  const [driver,   setDriver]   = useState<Driver | null>(null)
  const [bookings, setBookings]  = useState<Booking[]>([])
  const [loading,  setLoading]   = useState(true)
  const [search,   setSearch]    = useState('')

  const loadHistory = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setLoading(false)
      return
    }

    const res = await fetch('/api/drivers/me', {
       headers: { 'Authorization': `Bearer ${session.access_token}` }
    })
    
    if (res.ok) {
      const data = await res.json()
      setDriver(data.driver)
      // Filter for completed/cancelled bookings
      const history = (data.bookings as Booking[] ?? []).filter(b => 
        ['completed', 'cancelled', 'expired'].includes(b.status)
      )
      setBookings(history)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  const filtered = bookings.filter(b => 
    !search || 
    b.booking_ref.toLowerCase().includes(search.toLowerCase()) ||
    (b.patient?.user?.first_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (b.pickup_address ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <Loader2 size={32} className="animate-spin text-red-600" />
    </div>
  )

  if (!driver) return (
    <div className="flex-1 p-8 text-center bg-gray-50">
      <h2 className="text-xl font-black text-gray-900">Driver profile not found</h2>
      <button className="btn-primary mt-5" onClick={loadHistory}>Retry</button>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      <div className="p-4 md:p-6 bg-white border-b border-gray-100">
        <h1 className="text-2xl font-black text-gray-900">Job History</h1>
        <p className="text-sm text-gray-500">View your past emergencies and earnings</p>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            className="input pl-9" 
            placeholder="Search by ref, patient, or address..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-300">
                <Clock size={32} />
              </div>
              <p className="text-sm font-bold text-gray-400 italic">No history records found.</p>
            </div>
          ) : (
            filtered.map(b => (
              <div key={b.id} className="card p-0 overflow-hidden group hover:shadow-md transition-all">
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                       <span className="font-mono text-[10px] text-gray-400 font-bold">{b.booking_ref}</span>
                       <StatusBadge status={b.status} />
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-black text-red-600">{formatUGX(b.fare_amount || 0)}</p>
                       <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{timeAgo(b.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-100">
                      {b.patient?.user?.first_name?.[0] ?? 'P'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {b.patient?.user?.first_name} {b.patient?.user?.last_name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500">
                        <MapPin size={12} className="text-red-400" />
                        <span className="truncate">{b.pickup_address || 'Unspecified'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                       <div className="flex items-center gap-1">
                          <Calendar size={12} /> {new Date(b.created_at).toLocaleDateString()}
                       </div>
                       <TypeBadge type={b.type} />
                    </div>
                    <div className="text-green-600 font-black text-[10px] uppercase flex items-center gap-1">
                       Details <ChevronRight size={10} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

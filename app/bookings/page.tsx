'use client'
import { useState, useEffect } from 'react'
import { Search, Filter, Loader2, MapPin, Clock } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { StatusBadge, TypeBadge } from '@/components/shared/Badges'
import { timeAgo, formatUGX } from '@/lib/utils'
import type { Booking, BookingStatus } from '@/lib/types'

const ALL_STATUSES: BookingStatus[] = ['requested','assigned','en_route','at_scene','transporting','completed','cancelled','expired']

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState<BookingStatus | 'all'>('all')

  useEffect(() => {
    async function load() {
      let q = supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (filter !== 'all') q = q.eq('status', filter)
      const { data } = await q
      setBookings(data ?? [])
      setLoading(false)
    }
    load()
  }, [filter])

  const filtered = bookings.filter(b =>
    !search ||
    b.booking_ref.toLowerCase().includes(search.toLowerCase()) ||
    (b.pickup_address ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 p-4 md:p-6 space-y-5 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Bookings</h1>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search by ref or address…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-44" value={filter} onChange={e => setFilter(e.target.value as any)}>
          <option value="all">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={20} className="animate-spin mr-2" /> Loading bookings…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No bookings found.</div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    {['Ref','Type','Status','Pickup','Destination','Amount','Time'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{b.booking_ref}</td>
                      <td className="px-4 py-3"><TypeBadge type={b.type} /></td>
                      <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                      <td className="px-4 py-3 max-w-[160px]">
                        <div className="flex items-center gap-1 text-gray-700 truncate">
                          <MapPin size={11} className="flex-shrink-0 text-red-500" />
                          <span className="truncate">{b.pickup_address || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">{b.destination_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{formatUGX(b.fare_amount)}</td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {b.type === 'scheduled' && b.scheduled_at ? (
                          <div className="flex flex-col leading-tight text-purple-600 font-bold">
                            <span>{new Date(b.scheduled_at).toLocaleDateString()}</span>
                            <span>{new Date(b.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ) : (
                          <>
                            <Clock size={11} className="inline mr-1" />{timeAgo(b.created_at)}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-gray-100">
              {filtered.map(b => (
                <div key={b.id} className="p-4 space-y-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-gray-400">{b.booking_ref}</span>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <TypeBadge type={b.type} />
                    <span className="font-black text-gray-900">{formatUGX(b.fare_amount)}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <MapPin size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{b.pickup_address || 'Current Location'}</span>
                    </div>
                    {b.type === 'scheduled' && b.scheduled_at && (
                      <div className="flex items-center gap-2 text-xs text-purple-600 font-bold pl-5">
                        <Clock size={12} />
                        <span>{new Date(b.scheduled_at).toLocaleDateString()} @ {new Date(b.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                    {b.destination_name && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 pl-5">
                        <div className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className="truncate">to {b.destination_name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-1 text-[10px] text-gray-400 pt-1">
                    <Clock size={10} />
                    Created {timeAgo(b.created_at)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

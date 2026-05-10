'use client'
import { useState, useEffect, useCallback } from 'react'
import { AlertCircle, MapPin, Clock, CheckCircle, XCircle, Loader2, Phone, Ambulance, CreditCard } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { StatusBadge, TypeBadge } from '@/components/shared/Badges'
import { timeAgo, formatUGX } from '@/lib/utils'
import type { Booking } from '@/lib/types'
import { toast } from 'sonner'

export default function DashboardPage() {
  const [bookings, setBookings]   = useState<Booking[]>([])
  const [loading,  setLoading]    = useState(true)
  const [sosOpen,  setSosOpen]    = useState(false)
  const [sosForm,  setSosForm]    = useState({ address: '', landmark: '', notes: '' })
  const [sosLoading, setSosLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const fetchBookings = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // Get DB user via secure API
    const userRes = await fetch('/api/users/me', {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    })
    if (!userRes.ok) return
    const dbUser = await userRes.json()

    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('patient_id', dbUser.id)
      .order('created_at', { ascending: false })
      .limit(10)

    setBookings(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('bookings-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchBookings)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchBookings])

  async function submitSOS() {
    setSosLoading(true)
    try {
      // Get GPS
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
      ).catch(() => null)

      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          type: 'emergency',
          pickup_latitude:  pos?.coords.latitude  ?? 0.3176,
          pickup_longitude: pos?.coords.longitude ?? 32.5825,
          pickup_address:   sosForm.address || 'Location via GPS',
          pickup_landmark:  sosForm.landmark,
          patient_notes:    sosForm.notes,
          destination_name: 'Nearest available hospital',
        }),
      })
      if (!res.ok) throw new Error('Failed to create booking')
      toast.success('Emergency request sent! Finding nearest driver…')
      setSosOpen(false)
      fetchBookings()
    } catch (err: any) {
      toast.error(err.message || 'Could not submit SOS request')
    } finally {
      setSosLoading(false)
    }
  }

  const activeBooking = bookings.find(b =>
    ['requested','assigned','en_route','at_scene','transporting'].includes(b.status)
  )

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
        <span className="text-sm text-gray-400">
          {mounted && new Date().toLocaleDateString('en-UG', { weekday:'long', day:'numeric', month:'long' })}
        </span>
      </div>

      {/* Active booking alert */}
      {activeBooking && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <div className="animate-pulse-fast text-red-600 mt-0.5">
            <Loader2 size={18} className="animate-spin" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-red-800">Active Booking — {activeBooking.booking_ref}</p>
            <p className="text-sm text-red-600 mt-0.5">
              <StatusBadge status={activeBooking.status} /> · {activeBooking.pickup_address || 'Pickup location set'}
            </p>
          </div>
          <a href={`/track?booking=${activeBooking.id}`} className="btn-primary text-xs py-1.5">Track</a>
        </div>
      )}

      {/* SOS Button */}
      {!activeBooking && (
        <div className="card flex flex-col items-center py-10">
          <p className="text-sm text-gray-500 mb-6 font-medium">Need an ambulance right now?</p>
          <button className="sos-btn" onClick={() => setSosOpen(true)}>
            <AlertCircle size={40} />
            <span className="text-base font-black tracking-widest">SOS</span>
          </button>
          <p className="text-xs text-gray-400 mt-5">Your GPS location will be shared automatically</p>
        </div>
      )}

      {/* SOS modal */}
      {sosOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-600" size={22} />
              <h2 className="text-lg font-black text-red-600">Emergency Request</h2>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Your address / location</label>
              <input className="input" placeholder="e.g. Makerere University Gate 1" value={sosForm.address} onChange={e => setSosForm(f => ({...f, address: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Nearest landmark (optional)</label>
              <input className="input" placeholder="e.g. Near Shell Petrol Station" value={sosForm.landmark} onChange={e => setSosForm(f => ({...f, landmark: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Patient notes (optional)</label>
              <textarea className="input resize-none" rows={2} placeholder="e.g. Chest pains, 65yo male" value={sosForm.notes} onChange={e => setSosForm(f => ({...f, notes: e.target.value}))} />
            </div>

            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setSosOpen(false)}>Cancel</button>
              <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={submitSOS} disabled={sosLoading}>
                {sosLoading ? <Loader2 size={16} className="animate-spin" /> : <AlertCircle size={16} />}
                {sosLoading ? 'Sending…' : 'Send SOS'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Trips',    value: bookings.length,                                           icon: <Ambulance size={24} />, color: 'text-blue-600' },
          { label: 'Completed',      value: bookings.filter(b => b.status === 'completed').length,     icon: <CheckCircle size={24} />, color: 'text-green-600' },
          { label: 'Cancelled',      value: bookings.filter(b => b.status === 'cancelled').length,     icon: <XCircle size={24} />, color: 'text-gray-500'  },
          { label: 'Unpaid',         value: bookings.filter(b => b.payment_status === 'unpaid').length,icon: <CreditCard size={24} />, color: 'text-orange-500'},
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="card text-center">
            <div className="text-2xl mb-1 flex justify-center">{icon}</div>
            <div className={`text-3xl font-black ${color}`}>{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="card">
        <h2 className="text-lg font-bold mb-4">Recent Bookings</h2>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Loader2 size={20} className="animate-spin mr-2" /> Loading…
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No bookings yet.</p>
            <p className="text-sm mt-1">Press SOS above to request your first ambulance.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map(b => (
              <div key={b.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="text-red-600 mt-1">
                  <Ambulance size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-gray-500">{b.booking_ref}</span>
                    <StatusBadge status={b.status} />
                    <TypeBadge type={b.type} />
                  </div>
                  <p className="text-sm text-gray-700 mt-1 truncate">
                    <MapPin size={12} className="inline mr-1" />{b.pickup_address || '—'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <Clock size={11} className="inline mr-1" />{timeAgo(b.created_at)}
                    {b.fare_amount ? ` · ${formatUGX(b.fare_amount)}` : ''}
                  </p>
                </div>
                {['en_route','assigned','at_scene','transporting'].includes(b.status) && (
                  <a href={`/track?booking=${b.id}`} className="btn-primary text-xs py-1 px-2">Track</a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Emergency contacts */}
      <div className="card">
        <h2 className="text-sm font-bold text-gray-700 mb-3">Emergency Contacts</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {[
            { name: 'AmbuLink Dispatch', number: '+256 800 265 465' },
            { name: 'Police',            number: '999' },
            { name: 'Fire Brigade',      number: '0800 199 699' },
          ].map(({ name, number }) => (
            <a key={name} href={`tel:${number.replace(/\s/g,'')}`}
              className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-red-50 transition-colors text-sm">
              <Phone size={14} className="text-red-600" />
              <div>
                <div className="font-medium text-gray-800">{name}</div>
                <div className="text-xs text-gray-500">{number}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

'use client'
import { useState, useEffect, useCallback } from 'react'
import { AlertCircle, MapPin, Clock, CheckCircle, XCircle, Loader2, Phone, Ambulance, CreditCard } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { StatusBadge, TypeBadge } from '@/components/shared/Badges'
import { timeAgo, formatUGX } from '@/lib/utils'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Booking } from '@/lib/types'
import { toast } from 'sonner'

function DashboardContent() {
  const searchParams = useSearchParams()
  const [bookings, setBookings]   = useState<Booking[]>([])
  const [loading,  setLoading]    = useState(true)
  const [sosOpen,  setSosOpen]    = useState(false)
  const [sosLoading, setSosLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [bookingMode, setBookingMode] = useState<'emergency'|'scheduled'>('emergency')
  const [form, setForm] = useState({ 
    address: '', landmark: '', notes: '', 
    scheduled_at: '', destination: '' 
  })

  useEffect(() => { setMounted(true) }, [])

  // Handle URL params for mode
  useEffect(() => {
    const schedule = searchParams.get('schedule')
    if (schedule === 'true') {
      setBookingMode('scheduled')
      setSosOpen(true)
    }
  }, [searchParams])

  const fetchBookings = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setLoading(false)
      return
    }

    // Get DB user via secure API
    const userRes = await fetch('/api/users/me', {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    })
    if (!userRes.ok) {
      setLoading(false)
      return
    }
    const dbUser = await userRes.json()

    // Redirect non-patients
    if (dbUser.role === 'admin') {
      window.location.href = '/admin'
      return
    }
    if (dbUser.role === 'driver') {
      window.location.href = '/driver'
      return
    }
    if (dbUser.role === 'institution_rep') {
      window.location.href = '/institution'
      return
    }

    const patientId = dbUser.patient_profile?.id
    const { data } = patientId
      ? await supabase
          .from('bookings')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(10)
      : { data: [] }

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

  async function submitBooking() {
    setSosLoading(true)
    try {
      // Validate scheduled date
      if (bookingMode === 'scheduled' && !form.scheduled_at) {
        throw new Error('Please select a date and time for your trip')
      }

      // Get GPS (for emergency) or use address
      let lat = 0.3176, lng = 32.5825
      if (bookingMode === 'emergency') {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
        ).catch(() => null)
        if (pos) {
          lat = pos.coords.latitude
          lng = pos.coords.longitude
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Please sign in before booking')
      
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          type: bookingMode,
          pickup_latitude:  lat,
          pickup_longitude: lng,
          pickup_address:   form.address || (bookingMode === 'emergency' ? 'Location via GPS' : ''),
          pickup_landmark:  form.landmark,
          patient_notes:    form.notes,
          destination_name: form.destination || (bookingMode === 'emergency' ? 'Nearest available hospital' : ''),
          scheduled_at:     bookingMode === 'scheduled' ? form.scheduled_at : null,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create booking')
      }

      toast.success(bookingMode === 'emergency' 
        ? 'Emergency request sent! Finding nearest driver…' 
        : 'Ambulance scheduled successfully!'
      )
      setSosOpen(false)
      fetchBookings()
    } catch (err: any) {
      toast.error(err.message || 'Could not submit request')
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

      {/* SOS Button Area */}
      {!activeBooking && (
        <div className="card flex flex-col items-center py-10">
          <p className="text-sm text-gray-500 mb-6 font-medium">Need an ambulance right now?</p>
          <button className="sos-btn" onClick={() => { setBookingMode('emergency'); setSosOpen(true); }}>
            <AlertCircle size={40} />
            <span className="text-base font-black tracking-widest">SOS</span>
          </button>
          <p className="text-xs text-gray-400 mt-5 mb-4 text-center">Your GPS location will be shared automatically</p>
          
          <button 
            onClick={() => { setBookingMode('scheduled'); setSosOpen(true); }}
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-purple-600 transition-colors py-2 px-4 rounded-full border border-gray-100 hover:border-purple-200 hover:bg-purple-50"
          >
            <Clock size={16} />
            Schedule for Later
          </button>
        </div>
      )}

      {/* Booking modal */}
      {sosOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {bookingMode === 'emergency' ? (
                  <AlertCircle className="text-red-600" size={22} />
                ) : (
                  <Clock className="text-purple-600" size={22} />
                )}
                <h2 className={`text-lg font-black ${bookingMode === 'emergency' ? 'text-red-600' : 'text-purple-600'}`}>
                  {bookingMode === 'emergency' ? 'Emergency SOS' : 'Schedule Trip'}
                </h2>
              </div>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${bookingMode === 'emergency' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500'}`}
                  onClick={() => setBookingMode('emergency')}
                >SOS</button>
                <button 
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${bookingMode === 'scheduled' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500'}`}
                  onClick={() => setBookingMode('scheduled')}
                >LATER</button>
              </div>
            </div>

            {bookingMode === 'scheduled' && (
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Trip Date & Time</label>
                <input 
                  type="datetime-local" 
                  className="input" 
                  value={form.scheduled_at} 
                  onChange={e => setForm(f => ({...f, scheduled_at: e.target.value}))}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                {bookingMode === 'emergency' ? 'Your address / location' : 'Pickup Address'}
              </label>
              <input className="input" placeholder={bookingMode === 'emergency' ? 'e.g. Makerere University Gate 1' : 'e.g. Home address'} value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                {bookingMode === 'emergency' ? 'Nearest landmark (optional)' : 'Destination (Hospital/Home)'}
              </label>
              <input 
                className="input" 
                placeholder={bookingMode === 'emergency' ? 'e.g. Near Shell Petrol Station' : 'e.g. Mulago Hospital'} 
                value={bookingMode === 'emergency' ? form.landmark : form.destination} 
                onChange={e => setForm(f => ({...f, [bookingMode === 'emergency' ? 'landmark' : 'destination']: e.target.value}))} 
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Special Notes (optional)</label>
              <textarea className="input resize-none" rows={2} placeholder="e.g. Patient needs wheelchair assistance" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
            </div>

            <div className="flex gap-3 pt-2">
              <button className="btn-secondary flex-1" onClick={() => setSosOpen(false)}>Cancel</button>
              <button 
                className={`btn-primary flex-1 flex items-center justify-center gap-2 ${bookingMode === 'scheduled' ? 'bg-purple-600 border-purple-700' : ''}`} 
                onClick={submitBooking} 
                disabled={sosLoading}
              >
                {sosLoading ? <Loader2 size={16} className="animate-spin" /> : (bookingMode === 'emergency' ? <AlertCircle size={16} /> : <CheckCircle size={16} />)}
                {sosLoading ? 'Processing…' : (bookingMode === 'emergency' ? 'Send SOS' : 'Confirm')}
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

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>}>
      <DashboardContent />
    </Suspense>
  )
}

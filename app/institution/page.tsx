'use client'
import { useState, useEffect } from 'react'
import { Building2, Loader2, Plus, AlertCircle, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { StatusBadge, TypeBadge } from '@/components/shared/Badges'
import { timeAgo, formatUGX } from '@/lib/utils'
import { toast } from 'sonner'
import type { Booking } from '@/lib/types'

export default function InstitutionPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showNew,  setShowNew]  = useState(false)
  const [form, setForm] = useState({
    pickup_address: '', pickup_landmark: '', destination_name: '',
    patient_notes: '', is_priority: false,
  })

  const [institutionId, setInstitutionId] = useState<number | null>(null)

  useEffect(() => {
    async function fetchPortalData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Resolve DB user via secure API
      const userRes = await fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      if (!userRes.ok) return
      const dbUser = await userRes.json()

      // Resolve institution ID for this representative
      const { data: repData } = await supabase
        .from('institution_reps')
        .select('institution_id')
        .eq('user_id', dbUser.id)
        .single()

      if (!repData) {
        setLoading(false)
        return
      }

      setInstitutionId(repData.institution_id)

      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('institution_id', repData.institution_id)
        .order('created_at', { ascending: false })
        .limit(20)

      setBookings(data ?? [])
      setLoading(false)
    }

    fetchPortalData()
  }, [])

  async function submitBooking() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          ...form,
          type: 'institutional',
          institution_id: institutionId,
          pickup_latitude:  0.3356,
          pickup_longitude: 32.5765,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Institutional booking submitted')
      setShowNew(false)
    } catch {
      toast.error('Failed to submit booking')
    }
  }

  return (
    <div className="flex-1 p-4 md:p-6 space-y-5 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 size={24} className="text-purple-600" />
          <h1 className="text-2xl font-black">Institution Portal</h1>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowNew(true)}>
          <Plus size={16} /> New Booking
        </button>
      </div>

      {/* New booking modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h2 className="font-black text-lg flex items-center gap-2">
              <AlertCircle className="text-purple-600" size={20} /> New Institutional Booking
            </h2>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Pickup Address / Ward</label>
              <input className="input" value={form.pickup_address} onChange={e => setForm(f => ({...f, pickup_address: e.target.value}))} placeholder="Ward 5, Mulago Hospital" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Destination</label>
              <input className="input" value={form.destination_name} onChange={e => setForm(f => ({...f, destination_name: e.target.value}))} placeholder="International Hospital Kampala" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Patient Notes</label>
              <textarea className="input resize-none" rows={2} value={form.patient_notes} onChange={e => setForm(f => ({...f, patient_notes: e.target.value}))} placeholder="Critical burn case, 34yo female…" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_priority} onChange={e => setForm(f => ({...f, is_priority: e.target.checked}))} className="w-4 h-4 accent-red-600" />
              <span className="text-sm font-medium text-red-600">Mark as Priority</span>
            </label>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setShowNew(false)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={submitBooking}>Submit Booking</button>
            </div>
          </div>
        </div>
      )}

      {/* Bookings */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold">Institutional Bookings</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-gray-400" /></div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No institutional bookings yet.</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Ref','Status','Pickup','Destination','Amount','Time'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bookings.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{b.booking_ref}</td>
                      <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                      <td className="px-4 py-3 text-gray-600 max-w-[130px] truncate">{b.pickup_address || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[130px] truncate">{b.destination_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{formatUGX(b.fare_amount)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{timeAgo(b.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <div className="md:hidden divide-y divide-gray-100">
              {bookings.map(b => (
                <div key={b.id} className="p-4 space-y-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-gray-400">{b.booking_ref}</span>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                      <span className="line-clamp-2">{b.pickup_address || 'Current Location'}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-500">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                      <span className="line-clamp-2">{b.destination_name || 'Nearest Hospital'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-gray-900">{formatUGX(b.fare_amount)}</span>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Clock size={10} />
                      {timeAgo(b.created_at)}
                    </div>
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

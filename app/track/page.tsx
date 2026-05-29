'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { Loader2, Ambulance, MapPin, Clock, Phone, AlertCircle } from 'lucide-react'

const TrackingMap = dynamic(() => import('@/components/map/TrackingMap'), { ssr: false })

function TrackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('bookingId')

  const [booking, setBooking] = useState<any>(null)
  const [driverLocation, setDriverLocation] = useState<any>(null)
  const [driverInfo, setDriverInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Time tracking
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!bookingId) {
      setError('No booking ID provided.')
      setLoading(false)
      return
    }

    async function loadData() {
      // 1. Fetch booking
      const { data: bData, error: bErr } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single()
      
      if (bErr || !bData) {
        setError('Booking not found.')
        setLoading(false)
        return
      }

      setBooking(bData)

      // Start elapsed timer based on created_at
      const createdTime = new Date(bData.created_at).getTime()
      setElapsed(Math.floor((Date.now() - createdTime) / 1000))

      // 2. If assigned, fetch driver info & location
      if (bData.driver_id) {
        const { data: dData } = await supabase
          .from('drivers')
          .select('*, users(first_name, last_name, phone)')
          .eq('id', bData.driver_id)
          .single()
        
        if (dData) setDriverInfo(dData)

        const { data: locData } = await supabase
          .from('driver_locations')
          .select('*')
          .eq('driver_id', bData.driver_id)
          .single()
        
        if (locData) {
          setDriverLocation({ lat: locData.latitude, lng: locData.longitude })
        }
      }

      setLoading(false)
    }

    loadData()

    // 3. Realtime subscriptions
    const bookingSub = supabase.channel(`booking-${bookingId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${bookingId}` }, (payload) => {
        setBooking(payload.new)
        // If driver assigned midway, reload
        if (payload.new.driver_id && payload.old.driver_id !== payload.new.driver_id) {
          loadData()
        }
      })
      .subscribe()

    let locSub: any
    if (booking?.driver_id) {
      locSub = supabase.channel(`driver-loc-${booking.driver_id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'driver_locations', filter: `driver_id=eq.${booking.driver_id}` }, (payload) => {
          setDriverLocation({ lat: payload.new.latitude, lng: payload.new.longitude })
        })
        .subscribe()
    }

    // Timer interval
    const timer = setInterval(() => {
      setElapsed(prev => prev + 1)
    }, 1000)

    return () => {
      supabase.removeChannel(bookingSub)
      if (locSub) supabase.removeChannel(locSub)
      clearInterval(timer)
    }
  }, [bookingId, booking?.driver_id]) // Dependency on driver_id to re-subscribe to location if it changes

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 space-y-4">
        <Loader2 className="animate-spin text-red-600" size={40} />
        <p className="text-gray-500 font-semibold tracking-wide">Connecting to dispatch...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 text-center px-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-2xl font-black mb-2 text-gray-900">Oops!</h1>
        <p className="text-gray-500 mb-6">{error}</p>
        <button onClick={() => router.push('/')} className="btn-primary">Return Home</button>
      </div>
    )
  }

  return (
    <main className="h-screen w-full flex flex-col bg-gray-50 relative overflow-hidden">
      
      {/* Top Info Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-col gap-2">
        <div className="bg-white/90 backdrop-blur-md border border-gray-200 shadow-xl rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className={`p-3 rounded-full flex items-center justify-center ${booking.status === 'requested' ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-green-100 text-green-600'}`}>
                <Ambulance size={24} />
             </div>
             <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">Status</p>
                <h1 className="text-xl font-black text-gray-900 capitalize leading-none w-[180px]">
                  {booking.status === 'requested' ? 'Finding Ambulance...' : booking.status.replace('_', ' ')}
                </h1>
             </div>
          </div>

          <div className="flex gap-6 w-full md:w-auto items-center justify-between md:justify-end border-t md:border-t-0 border-gray-100 pt-3 md:pt-0">
             <div className="text-center md:text-right">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Elapsed Time</p>
                <div className="flex items-center gap-1 font-mono text-xl font-black text-gray-800">
                  <Clock size={16} className="text-gray-400" /> {formatTime(elapsed)}
                </div>
             </div>
          </div>
        </div>

        {/* Assigned Driver Card */}
        {driverInfo && (
          <div className="bg-white/90 backdrop-blur-md border border-gray-200 shadow-xl rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Responder</p>
              <h2 className="text-lg font-black text-gray-900">{driverInfo.users.first_name} {driverInfo.users.last_name}</h2>
              <p className="text-sm font-medium text-gray-500">{driverInfo.vehicle_plate} · {driverInfo.vehicle_type}</p>
            </div>
            <a href={`tel:${driverInfo.users.phone}`} className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors shadow-lg active:scale-95">
              <Phone size={20} />
            </a>
          </div>
        )}
      </div>

      {/* Map Area */}
      <div className="flex-1 w-full bg-gray-200">
         <TrackingMap 
           patientCoords={{ lat: booking.pickup_latitude, lng: booking.pickup_longitude }}
           driverCoords={driverLocation} 
         />
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
         <div className="bg-white/90 backdrop-blur-md border border-gray-200 shadow-xl rounded-2xl p-4 flex items-start gap-3">
            <MapPin className="text-red-600 mt-0.5 flex-shrink-0" size={18} />
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pickup Location</p>
              <p className="text-sm font-semibold text-gray-900 truncate pr-4">{booking.pickup_address}</p>
              {booking.patient_notes && (
                <p className="text-xs text-amber-600 font-medium mt-1">Notes: {booking.patient_notes}</p>
              )}
            </div>
         </div>
      </div>
    </main>
  )
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-red-600" size={40} /></div>}>
      <TrackContent />
    </Suspense>
  )
}

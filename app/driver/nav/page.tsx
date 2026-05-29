'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { Loader2, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

const TrackingMap = dynamic(() => import('@/components/map/TrackingMap'), { ssr: false })

function DriverNavContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('bookingId')

  const [booking, setBooking] = useState<any>(null)
  const [driverLocation, setDriverLocation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)

  // Fetch Booking Data
  const loadData = async () => {
    if (!bookingId) {
      setError('No booking ID provided.')
      setLoading(false)
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
       setError('Authentication required.')
       setLoading(false)
       return 
    }

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

    // Ensure we fetch driver's own location
    const { data: locData } = await supabase
      .from('driver_locations')
      .select('*')
      .eq('driver_id', bData.driver_id)
      .single()
    
    if (locData) {
      setDriverLocation({ lat: locData.latitude, lng: locData.longitude })
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()

    if (!bookingId) return

    // Realtime loc tracking
    let curDriverId = booking?.driver_id
    if (!curDriverId) return

    const locSub = supabase.channel(`nav-driver-loc-${curDriverId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'driver_locations', filter: `driver_id=eq.${curDriverId}` }, (payload) => {
        setDriverLocation({ lat: payload.new.latitude, lng: payload.new.longitude })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(locSub)
    }
  }, [bookingId, booking?.driver_id])

  // Fake GPS movement for testing since the geolocation API might not run if the user isn't moving
  useEffect(() => {
    if (!driverLocation || !booking) return
    const interval = setInterval(() => {
       setDriverLocation((prev: any) => {
          if (!prev) return prev
          // Move slightly towards destination
          const dLat = (booking.pickup_latitude - prev.lat) * 0.05
          const dLng = (booking.pickup_longitude - prev.lng) * 0.05
          return { lat: prev.lat + dLat, lng: prev.lng + dLng }
       })
    }, 3000)
    return () => clearInterval(interval)
  }, [booking, driverLocation !== null])

  const handleComplete = async () => {
    setUpdating(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch('/api/drivers/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ booking_id: booking.id, status: 'completed' }),
      })
      
      if (!res.ok) throw new Error('Update failed')
      toast.success('Trip Complete!')
      router.push('/driver')
    } catch (err: any) {
      toast.error(err.message)
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-900 space-y-4 text-white">
        <Loader2 className="animate-spin text-blue-500" size={40} />
        <p className="font-semibold tracking-wide uppercase">Initializing Navigation System...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-900 text-center px-6 text-white">
        <div className="w-16 h-16 bg-red-900/50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-2xl font-black mb-2">Navigation Error</h1>
        <p className="text-gray-400 mb-6">{error}</p>
        <button onClick={() => router.push('/driver')} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full">Exit Navigation</button>
      </div>
    )
  }

  return (
    <main className="h-screen w-full flex flex-col bg-black relative overflow-hidden">
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent pt-6 pb-12 px-4 pointer-events-none">
         <div className="flex items-start justify-between pointer-events-auto">
            <button onClick={() => router.push('/driver')} className="w-12 h-12 bg-gray-800/80 backdrop-blur text-white rounded-full flex items-center justify-center hover:bg-gray-700 active:scale-95 transition-all shadow-lg border border-gray-700">
               <ArrowLeft size={24} />
            </button>
            <div className="bg-blue-600/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg border border-blue-500 text-center">
               <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-0.5">Navigating To</p>
               <h1 className="text-white text-lg font-black leading-tight max-w-[200px] truncate">
                  {booking.pickup_address}
               </h1>
            </div>
         </div>
      </div>

      <div className="flex-1 w-full bg-gray-800 z-0">
          {driverLocation ? (
             <TrackingMap 
               patientCoords={{ lat: booking.pickup_latitude, lng: booking.pickup_longitude }}
               driverCoords={driverLocation}
             />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-white"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
          )}
      </div>

      {/* Bottom Action Bar */}
      <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-col gap-3">
         <button 
           onClick={handleComplete}
           disabled={updating}
           className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-5 rounded-2xl shadow-[0_0_40px_rgba(22,163,74,0.4)] border border-green-500 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 text-lg uppercase tracking-wider"
         >
           {updating ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle size={24} />}
           {updating ? 'Finalizing...' : 'Complete Trip'}
         </button>
      </div>
    </main>
  )
}

export default function DriverNavPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-gray-900"><Loader2 className="animate-spin text-blue-500" size={40} /></div>}>
      <DriverNavContent />
    </Suspense>
  )
}

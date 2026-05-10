'use client'
import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Phone, MapPin, Clock, Navigation, Ambulance, User, ShieldCheck, Map as MapIcon, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { StatusBadge } from '@/components/shared/Badges'
import { timeAgo } from '@/lib/utils'
import type { Booking } from '@/lib/types'

declare global { interface Window { google: any } }

function TrackingContent() {
  const searchParams = useSearchParams()
  const bookingId    = searchParams.get('booking')

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [driverLoc, setDriverLoc] = useState<{lat: number, lng: number} | null>(null)

  const mapRef = useRef<HTMLDivElement>(null)
  const mapObj = useRef<any>(null)
  const patientMarker = useRef<any>(null)
  const ambulanceMarker = useRef<any>(null)

  const fetchBooking = useCallback(async () => {
    const bookingId = searchParams.get('booking')
    const bookingRef = searchParams.get('ref')
    if (!bookingId && !bookingRef) {
      setLoading(false)
      return
    }

    let query = supabase
      .from('bookings')
      .select('*, patient:patients!patient_id(*, user:users!user_id(*)), driver:drivers!driver_id(*, user:users!user_id(*), location:driver_locations(*))')
    
    if (bookingId) {
      query = query.eq('id', bookingId)
    } else {
      query = query.eq('booking_ref', bookingRef)
    }

    const { data, error } = await query.single()
    
    if (error) {
      console.error('Tracking Error:', error)
      setLoading(false)
      return
    }

    if (data) {
      setBooking(data)
      if (data.driver?.location) {
        setDriverLoc({ 
          lat: Number(data.driver.location.latitude), 
          lng: Number(data.driver.location.longitude) 
        })
      }
    }
    setLoading(false)
  }, [searchParams])

  useEffect(() => {
    fetchBooking()
  }, [fetchBooking])

  // Booking status subscription
  useEffect(() => {
    if (!booking?.id) return

    const bookingSub = supabase
      .channel(`booking-${booking.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'bookings',
        filter: `id=eq.${booking.id}`
      }, (payload: any) => setBooking(prev => ({ ...prev, ...payload.new } as Booking)))
      .subscribe()

    return () => { 
      supabase.removeChannel(bookingSub)
    }
  }, [booking?.id])

  // Driver location subscription
  useEffect(() => {
    if (!booking?.driver_id) return

    const locSub = supabase
      .channel(`driver-loc-${booking.driver_id}`)
      .on('postgres_changes', {
        event: '*', 
        schema: 'public', 
        table: 'driver_locations',
        filter: `driver_id=eq.${booking.driver_id}`
      }, (payload: any) => {
        const newLoc = payload.new as any
        if (newLoc) {
          setDriverLoc({ 
            lat: Number(newLoc.latitude), 
            lng: Number(newLoc.longitude) 
          })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(locSub)
    }
  }, [booking?.driver_id])

  // Map initialization & Key Check fallback
  const [mapKeyMissing, setMapKeyMissing] = useState(false)
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
    if (!key || key.startsWith('YOUR_')) {
      setMapKeyMissing(true)
      return
    }

    const initMap = () => {
      if (!mapRef.current || mapObj.current) return
      
      const center = booking
        ? { lat: Number(booking.pickup_latitude), lng: Number(booking.pickup_longitude) }
        : { lat: 0.3176, lng: 32.5825 }

      mapObj.current = new window.google.maps.Map(mapRef.current, {
        zoom: 15,
        center,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] }
        ]
      })
    }

    if (!window.google) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}`
      script.async = true
      script.onload = initMap
      document.head.appendChild(script)
    } else {
      initMap()
    }
  }, [booking])

  // Update Markers (Patient & Ambulance)
  useEffect(() => {
    if (!mapObj.current || !booking || !window.google) return

    // 1. Patient Marker (Static Pickup)
    const patientPos = { lat: Number(booking.pickup_latitude), lng: Number(booking.pickup_longitude) }
    if (!patientMarker.current) {
      patientMarker.current = new window.google.maps.Marker({
        position: patientPos,
        map: mapObj.current,
        label: { text: "📍", fontSize: "24px" },
        title: "Pickup Location"
      })
    } else {
      patientMarker.current.setPosition(patientPos)
    }

    // 2. Ambulance Marker (Live Driver Location)
    if (driverLoc) {
      if (!ambulanceMarker.current) {
        ambulanceMarker.current = new window.google.maps.Marker({
          position: driverLoc,
          map: mapObj.current,
          label: { text: "🚑", fontSize: "24px" },
          title: "Ambulance Team"
        })
      } else {
        ambulanceMarker.current.setPosition(driverLoc)
      }

      const statusWithPan = ['assigned', 'en_route', 'at_scene', 'transporting']
      if (statusWithPan.includes(booking.status)) {
        mapObj.current.panTo(driverLoc)
      }
    } else {
        mapObj.current.panTo(patientPos)
    }
  }, [booking, driverLoc])

  const statusSteps = ['requested','assigned','en_route','at_scene','transporting','completed']
  const currentStep = booking ? statusSteps.indexOf(booking.status) : -1

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 h-screen">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={32} className="animate-spin text-red-600" />
        <p className="text-sm font-medium text-gray-500">Connecting to tracking server…</p>
      </div>
    </div>
  )

  if (!booking) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50 h-screen">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <MapPin size={40} className="text-gray-300" />
      </div>
      <h2 className="text-xl font-black text-gray-900 mb-2">No active tracking session</h2>
      <p className="text-gray-500 max-w-xs mx-auto mb-8">
        Go to your dashboard to track an ongoing emergency or scheduled booking.
      </p>
      <Link href="/dashboard" className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold shadow-lg shadow-red-200">Return to Dashboard</Link>
    </div>
  )

  const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${booking.pickup_latitude},${booking.pickup_longitude}`

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative h-screen bg-white">
      {/* Map or Fallback Area */}
      <div className="h-[45%] md:h-[55%] relative overflow-hidden bg-gray-100">
        {mapKeyMissing ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/30 p-6 text-center">
            <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center mb-4 text-red-600">
               <MapIcon size={32} />
            </div>
            <h3 className="text-lg font-black text-gray-900 leading-tight">Interactive Map Unavailable</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto mb-6">
              Google Maps API is not configured. You can still track via live status updates below or open external maps.
            </p>
            <a href={gmapsUrl} target="_blank" className="btn-primary flex items-center gap-2 px-6">
               <ExternalLink size={16} /> Open External Google Maps
            </a>
          </div>
        ) : (
          <div ref={mapRef} className="h-full w-full z-0">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {typeof window !== 'undefined' && !window.google && (
                <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-sm border border-gray-100 text-xs text-gray-500">
                  Initializing Map Engine…
                </div>
              )}
            </div>
          </div>
        )}

        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-10">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-3 flex items-center gap-3 pointer-events-auto">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <Ambulance size={22} />
            </div>
            <div>
              <p className="font-black text-gray-900 tracking-tight">{booking.booking_ref}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{booking.status.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] rounded-t-[2.5rem] z-20 -mt-8 px-6 py-8 overflow-y-auto">
        <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8 md:hidden" />
        
        <div className="space-y-8 pb-10">
          <div className="flex justify-between relative px-2">
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-100 -z-10" />
            <div 
              className="absolute top-4 left-4 h-0.5 bg-green-500 transition-all duration-700 -z-10" 
              style={{ width: `${Math.max(0, currentStep) * (100 / (statusSteps.length - 1))}%` }}
            />
            
            {statusSteps.map((step, i) => (
              <div key={step} className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all
                  ${i <= currentStep ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-white border-2 border-gray-100 text-gray-300'}
                  ${i === currentStep ? 'ring-4 ring-green-100 scale-110' : ''}
                `}>
                  {i < currentStep ? '✓' : i + 1}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className="w-3 h-3 rounded-full border-2 border-green-500 bg-white flex-shrink-0" />
                <div className="w-px flex-1 bg-gray-200" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">Pickup Location</p>
                <p className="text-gray-900 font-bold leading-tight truncate">{booking.pickup_address || 'Current GPS Location'}</p>
                {booking.pickup_landmark && <p className="text-xs text-gray-500 mt-1">Ref: {booking.pickup_landmark}</p>}
                <p className="text-[10px] text-gray-400 mt-1">Lat: {booking.pickup_latitude}, Lng: {booking.pickup_longitude}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <Navigation size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Navigation</p>
                    <p className="text-sm font-bold text-gray-900">Direct Link Available</p>
                  </div>
               </div>
               <a href={gmapsUrl} target="_blank" className="btn-primary text-xs py-2 px-4 shadow-md shadow-red-100">NAVIGATE NOW</a>
            </div>
          </div>

          {booking.driver && (
            <div className="flex items-center gap-4 p-4 bg-red-50/50 rounded-2xl border border-red-100">
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-red-600 shadow-sm">
                <Ambulance size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ambulance Team</p>
                <p className="font-black text-gray-900 text-lg leading-tight truncate">{(booking.driver as any).user?.first_name} {(booking.driver as any).user?.last_name}</p>
                <p className="text-sm font-bold text-red-600 mt-0.5">
                  {(booking.driver as any).vehicle_plate} · {(booking.driver as any).vehicle_model}
                </p>
              </div>
              <a href={`tel:${(booking.driver as any).user?.phone}`} className="w-12 h-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-gray-900 shadow-sm">
                 <Phone size={20} />
              </a>
            </div>
          )}

          <div className="pt-6 border-t border-gray-50 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Clock size={12} />
              Requested {timeAgo(booking.created_at)}
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={12} />
              Secured trip
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-50"><Loader2 className="animate-spin text-red-600" /></div>}>
      <TrackingContent />
    </Suspense>
  )
}

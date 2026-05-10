'use client'
import { useState, useEffect, useRef } from 'react'
import { Loader2, Ambulance, MapPin, Navigation, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { StatusBadge } from '@/components/shared/Badges'
import Link from 'next/link'

declare global { interface Window { google: any } }

export default function AdminTrackingPage() {
  const [drivers, setDrivers] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapObj = useRef<any>(null)
  const markers = useRef<Map<string, any>>(new Map())

  async function loadData() {
    const [{ data: drData }, { data: bkData }] = await Promise.all([
      supabase.from('drivers').select('*, user:users(*), location:driver_locations(*)').eq('status', 'online'),
      supabase.from('vw_booking_overview').select('*').in('status', ['requested','assigned','en_route','at_scene','transporting']),
    ])
    setDrivers(drData ?? [])
    setBookings(bkData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    const ch1 = supabase.channel('tracking-drivers').on('postgres_changes', { event: '*', schema: 'public', table: 'driver_locations' }, loadData).subscribe()
    const ch2 = supabase.channel('tracking-bookings').on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, loadData).subscribe()
    return () => {
      supabase.removeChannel(ch1)
      supabase.removeChannel(ch2)
    }
  }, [])

  // Map Init
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
    if (!key || !mapRef.current) return

    const initMap = () => {
      if (!mapRef.current || mapObj.current) return
      mapObj.current = new window.google.maps.Map(mapRef.current, {
        zoom: 13,
        center: { lat: 0.3176, lng: 32.5825 }, // Kampala
        disableDefaultUI: true,
        zoomControl: true,
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
  }, [])

  // Update Markers
  useEffect(() => {
    if (!mapObj.current || !window.google) return

    // Clear old markers
    markers.current.forEach(m => m.setMap(null))
    markers.current.clear()

    // Add Driver Markers
    drivers.forEach(d => {
      if (!d.location) return
      const m = new window.google.maps.Marker({
        position: { lat: Number(d.location.latitude), lng: Number(d.location.longitude) },
        map: mapObj.current,
        title: `${d.user?.first_name} (${d.vehicle_plate})`,
        label: { text: "🚑", fontSize: "20px" }
      })
      markers.current.set(`driver-${d.id}`, m)
    })

    // Add Booking Markers (Active)
    bookings.forEach(b => {
      if (!b.pickup_latitude) return
      const m = new window.google.maps.Marker({
        position: { lat: Number(b.pickup_latitude), lng: Number(b.pickup_longitude) },
        map: mapObj.current,
        title: `Booking ${b.booking_ref}`,
        label: { text: "📍", fontSize: "20px" }
      })
      markers.current.set(`booking-${b.booking_id}`, m)
    })

  }, [drivers, bookings])

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between bg-white z-10">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Fleet Tracking</h1>
          <p className="text-sm text-gray-500">Live overview of all active drivers and emergencies</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-green-700">{drivers.length} Drivers Online</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-full border border-red-100">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-red-700">{bookings.length} Active Trips</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        {/* Map Area */}
        <div ref={mapRef} className="flex-1 bg-gray-100" />

        {/* Sidebar info */}
        <div className="w-full md:w-80 bg-white border-l border-gray-100 overflow-y-auto p-4 space-y-6 shadow-2xl z-20">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Active Fleet</h2>
          
          <div className="space-y-3">
            {drivers.length === 0 && !loading && <p className="text-sm text-gray-400 italic">No drivers online</p>}
            {drivers.map(d => (
              <div key={d.id} className="p-3 rounded-xl border border-gray-50 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <Navigation size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">{d.user?.first_name} {d.user?.last_name}</p>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">{d.vehicle_plate} · {d.vehicle_model}</p>
                  </div>
                  <button className="p-2 text-gray-300 hover:text-red-600 transition-colors" onClick={() => mapObj.current?.panTo({lat: Number(d.location.latitude), lng: Number(d.location.longitude)})}>
                    <MapPin size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest pt-4">Live Emergencies</h2>
          <div className="space-y-3">
            {bookings.length === 0 && !loading && <p className="text-sm text-gray-400 italic">No active bookings</p>}
            {bookings.map(b => (
              <div key={b.booking_id} className="p-3 rounded-xl border border-red-50 bg-red-50/30 hover:bg-white hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-[10px] text-red-400 font-bold">{b.booking_ref}</span>
                  <StatusBadge status={b.status} />
                </div>
                <p className="font-bold text-sm text-gray-900 leading-tight">{b.patient_name}</p>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500">
                  <MapPin size={10} className="text-red-500" />
                  <span className="truncate">{b.pickup_address}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                   {b.driver_name && (
                    <div className="flex items-center gap-1.5">
                      <Ambulance size={12} className="text-blue-500" />
                      <span className="text-[10px] font-bold text-gray-700">{b.driver_name}</span>
                    </div>
                  )}
                  <Link href={`/track?booking=${b.booking_id}`} className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline flex items-center gap-1 ml-auto">
                    Details <Info size={10} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

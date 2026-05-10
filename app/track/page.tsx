'use client'
import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Phone, MapPin, Clock, Navigation, Ambulance, User, ShieldCheck, Map as MapIcon, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { StatusBadge } from '@/components/shared/Badges'
import { timeAgo } from '@/lib/utils'
import type { Booking } from '@/lib/types'

// Leaflet Imports (Dynamic)
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

// Dynamic Map components for Next.js SSR
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false })
const MapEvents = null;

// Helper for Routing (Client-side only)
function RoutingMachine({ driverLoc, patientLoc, onUpdate }: { driverLoc: any, patientLoc: any, onUpdate: (dist: string, time: string, secs: number) => void }) {
  const map: any = require('react-leaflet').useMap();
  const routingControlRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const L = require('leaflet');
    require('leaflet-routing-machine');

    if (!map || !driverLoc || !patientLoc) return;

    if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
    }

    routingControlRef.current = L.Routing.control({
      waypoints: [
        L.latLng(driverLoc.lat, driverLoc.lng),
        L.latLng(patientLoc.lat, patientLoc.lng)
      ],
      lineOptions: {
        styles: [{ color: '#ef4444', weight: 4, opacity: 0.8 }]
      },
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      createMarker: () => null // Hide default markers, we use our own
    })
    .on('routesfound', (e: any) => {
        const routes = e.routes;
        const summary = routes[0].summary;
        const dist = (summary.totalDistance / 1000).toFixed(1) + ' km';
        const time = Math.round(summary.totalTime / 60) + ' min';
        const totalSecs = Math.round(summary.totalTime);
        onUpdate(dist, time, totalSecs);
    })
    .addTo(map);

    return () => {
      if (routingControlRef.current && map) {
        map.removeControl(routingControlRef.current);
      }
    };
  }, [map, driverLoc, patientLoc]);

  return null;
}

function TrackingContent() {
  const searchParams = useSearchParams()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [driverLoc, setDriverLoc] = useState<{lat: number, lng: number} | null>(null)
  const [eta, setEta] = useState<string | null>(null)
  const [distance, setDistance] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null) // seconds
  const [L, setL] = useState<any>(null)

  // Countdown Ticker
  useEffect(() => {
    if (countdown === null || countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown(prev => (prev && prev > 0) ? prev - 1 : 0)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const Leaflet = require('leaflet');
        // Fix Leaflet marker icons in Next.js
        delete Leaflet.Icon.Default.prototype._getIconUrl;
        Leaflet.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
        setL(Leaflet);
    }
  }, [])

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
    
    if (bookingId) query = query.eq('id', bookingId)
    else query = query.eq('booking_ref', bookingRef)

    const { data, error } = await query.single()
    if (!error && data) {
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

  useEffect(() => { fetchBooking() }, [fetchBooking])

  // Real-time subscriptions
  useEffect(() => {
    if (!booking?.id) return
    const sub = supabase.channel(`trk-${booking.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${booking.id}` }, 
          payload => setBooking(prev => ({ ...prev, ...payload.new } as Booking)))
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [booking?.id])

  useEffect(() => {
    if (!booking?.driver_id) return
    const sub = supabase.channel(`loc-${booking.driver_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_locations', filter: `driver_id=eq.${booking.driver_id}` }, 
          payload => {
            const loc = payload.new as any
            if (loc) setDriverLoc({ lat: Number(loc.latitude), lng: Number(loc.longitude) })
          })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [booking?.driver_id])

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 h-screen">
      <Loader2 size={32} className="animate-spin text-red-600" />
    </div>
  )

  if (!booking) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50 h-screen text-center">
      <MapPin size={40} className="text-gray-300 mb-4" />
      <h2 className="text-xl font-black mb-2">No active session</h2>
      <Link href="/dashboard" className="btn-primary mt-6">Dashboard</Link>
    </div>
  )

  const patientLoc = { lat: Number(booking.pickup_latitude), lng: Number(booking.pickup_longitude) }
  const driverIcon = L ? new L.DivIcon({
      html: '<div class="relative flex items-center justify-center"><div class="absolute w-12 h-12 bg-red-500/20 rounded-full animate-ping"></div><div class="text-4xl drop-shadow-2xl z-10">🚑</div></div>',
      className: 'bg-transparent',
      iconSize: [48, 48],
      iconAnchor: [24, 24]
  }) : null;

  const patientIcon = L ? new L.DivIcon({
      html: '<div class="text-4xl drop-shadow-xl">📍</div>',
      className: 'bg-transparent',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
  }) : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative h-screen bg-white">
      {/* Map Section */}
      <div className="h-[45%] md:h-[55%] relative overflow-hidden bg-gray-100 z-10">
        {!loading && typeof window !== 'undefined' && (
          <MapContainer center={[patientLoc.lat, patientLoc.lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer 
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            
            {/* Markers */}
            {booking && <Marker position={[patientLoc.lat, patientLoc.lng]} icon={patientIcon as any} />}
            {driverLoc && <Marker position={[driverLoc.lat, driverLoc.lng]} icon={driverIcon as any} />}
            
            {/* Live Routing Component */}
            {driverLoc && <RoutingMachine 
                driverLoc={driverLoc} 
                patientLoc={patientLoc} 
                onUpdate={(dist, time, secs) => {
                    setDistance(dist)
                    setEta(time)
                    setCountdown(secs)
                }} 
            />}
          </MapContainer>
        )}

        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-[100]">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-3 flex items-center gap-3 pointer-events-auto">
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

          {countdown !== null && (
            <div className="bg-red-600 text-white rounded-2xl shadow-2xl px-5 py-4 flex flex-col items-center justify-center pointer-events-auto border-4 border-white animate-pulse-slow">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-none mb-2">Patient Contact In</span>
              <span className="text-3xl font-mono font-black leading-none tracking-tighter">
                {formatCountdown(countdown)}
              </span>
              <span className="text-[10px] font-bold mt-1 opacity-70">({distance})</span>
            </div>
          )}
        </div>
      </div>

      {/* Details Section */}
      <div className="flex-1 bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] rounded-t-[2.5rem] z-20 -mt-8 px-6 py-8 overflow-y-auto">
        <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8 md:hidden" />
        
        <div className="space-y-8 pb-10">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className="w-3 h-3 rounded-full border-2 border-green-500 bg-white" />
                <div className="w-px flex-1 bg-gray-200" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">Pickup Location</p>
                <p className="text-gray-900 font-bold leading-tight truncate">{booking.pickup_address || 'Current GPS Location'}</p>
                {booking.pickup_landmark && <p className="text-xs text-gray-500 mt-1">Ref: {booking.pickup_landmark}</p>}
              </div>
            </div>

            {/* Big Hero Countdown Section */}
            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-3xl p-8 mb-8 text-white shadow-2xl shadow-red-200 border border-red-500 relative overflow-hidden group">
              {/* Background Decor */}
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-1000" />
              
              <div className="relative z-10 flex flex-col items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-4 bg-white/20 px-4 py-1 rounded-full">
                  Ambulance in Transit
                </span>
                
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-7xl md:text-8xl font-mono font-black tracking-tighter drop-shadow-xl">
                    {countdown !== null ? formatCountdown(countdown) : '--:--'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-red-100 font-bold text-sm mb-6 uppercase tracking-wider">
                  <Navigation size={16} className="animate-pulse" />
                  <span>{distance || '-- km'} to your location</span>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full bg-red-900/40 h-3 rounded-full overflow-hidden border border-red-400/30">
                  <div 
                    className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, 100 - ((countdown || 600) / 600) * 100))}%` }}
                  />
                </div>
                <div className="w-full flex justify-between mt-2 px-1">
                  <span className="text-[9px] font-bold uppercase opacity-60">Dispatched</span>
                  <span className="text-[9px] font-bold uppercase opacity-60 text-right">Arrival</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden relative border-2 border-white shadow-sm">
                     {booking.driver?.user?.first_name ? (
                       <div className="absolute inset-0 bg-red-600 flex items-center justify-center text-white font-black text-xl">
                         {booking.driver.user.first_name[0]}
                       </div>
                     ) : <Ambulance size={28} />}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-lg">{booking.driver?.user?.first_name || 'Dispatching'} {booking.driver?.user?.last_name || 'Driver'}</h3>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">{booking.driver?.vehicle_model || 'AmbuLink Medical Unit'}</p>
                  </div>
                </div>
                <a href={`tel:${booking.driver?.user?.phone || ''}`} className="w-12 h-12 rounded-2xl bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-200 active:scale-95 transition-transform">
                  <Phone size={24} />
                </a>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Vehicle Plate</p>
                    <p className="text-sm font-black text-gray-900">{booking.driver?.vehicle_plate || '---'}</p>
                 </div>
                 <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">ETA Basis</p>
                    <p className="text-sm font-black text-gray-900">Live Traffic</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-50 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">
            <div className="flex items-center gap-1.5 mx-auto">
              <ShieldCheck size={12} className="text-green-500" />
              AmbuLink Secure Tracking Active
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

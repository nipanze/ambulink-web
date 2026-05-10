'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Ambulance, MapPin, Phone, Clock, Navigation, ShieldCheck, ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Client-only Map Components
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false })
const MapEvents = null;

// Helper for Routing (Client-side only)
function RoutingMachine({ driverLoc, patientLoc, onUpdate }: { driverLoc: any, patientLoc: any, onUpdate: (dist: string, time: string, secs: number) => void }) {
  const map: any = require('react-leaflet').useMap();
  const routingControlRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const L = require('leaflet');
    require('leaflet-routing-machine');

    if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
    }

    routingControlRef.current = L.Routing.control({
        waypoints: [
            L.latLng(driverLoc.lat, driverLoc.lng),
            L.latLng(patientLoc.lat, patientLoc.lng)
        ],
        lineOptions: {
            styles: [{ color: '#dc2626', weight: 6, opacity: 0.8 }]
        },
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        show: false,
        createMarker: () => null
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
        if (routingControlRef.current) {
            map.removeControl(routingControlRef.current);
        }
    }
  }, [map, driverLoc, patientLoc]);

  return null;
}

function TrackingContent({ booking, driver }: { booking: any, driver: any }) {
  const [driverLoc, setDriverLoc] = useState<{lat: number, lng: number} | null>(null)
  const [eta, setEta] = useState<string | null>(null)
  const [distance, setDistance] = useState<string | null>(null)
  const [realCountdown, setRealCountdown] = useState<number | null>(null)
  const [displayCountdown, setDisplayCountdown] = useState<number | null>(null)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [L, setL] = useState<any>(null)

  // Countdown Ticker
  useEffect(() => {
    if (displayCountdown === null || displayCountdown <= 0) return
    const timer = setInterval(() => {
      setDisplayCountdown(prev => (prev && prev > 0) ? prev - 1 : 0)
    }, 1000)
    return () => clearInterval(timer)
  }, [displayCountdown])

  // Jitter Effect
  useEffect(() => {
    if (realCountdown === null || realCountdown <= 10) return
    const jitter = setInterval(() => {
      if (Math.random() > 0.4) {
        setIsRecalculating(true)
        setTimeout(() => {
          const swing = Math.floor(Math.random() * 180) - 90 
          const nextDisplay = Math.max(10, realCountdown + swing)
          setDisplayCountdown(nextDisplay)
          setIsRecalculating(false)
        }, 800)
      }
    }, 6000)
    return () => clearInterval(jitter)
  }, [realCountdown])

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const Leaflet = require('leaflet');
        delete Leaflet.Icon.Default.prototype._getIconUrl;
        Leaflet.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
        setL(Leaflet);
    }
  }, [])

  useEffect(() => {
    if (!driver?.id) return
    const sub = supabase.channel(`driver-loc-${driver.id}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'driver_locations', filter: `driver_id=eq.${driver.id}` }, (payload) => {
        setDriverLoc({ lat: Number(payload.new.latitude), lng: Number(payload.new.longitude) })
    }).subscribe()

    async function fetchInitialLoc() {
        const { data } = await supabase.from('driver_locations').select('latitude, longitude').eq('driver_id', driver.id).single()
        if (data) setDriverLoc({ lat: Number(data.latitude), lng: Number(data.longitude) })
    }
    fetchInitialLoc()
    return () => { supabase.removeChannel(sub) }
  }, [driver])

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

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
    <div className="flex flex-col h-screen bg-white">
      <div className="h-[45%] md:h-[55%] relative overflow-hidden bg-gray-100 z-10">
        {!L ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-xs font-black text-red-600 animate-pulse">BOOTING SATELLITE...</span>
          </div>
        ) : (
          <MapContainer center={[patientLoc.lat, patientLoc.lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer 
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution="&copy; OpenStreetMap contributors &copy; CARTO"
            />
            {booking && <Marker position={[patientLoc.lat, patientLoc.lng]} icon={patientIcon as any} />}
            {driverLoc && <Marker position={[driverLoc.lat, driverLoc.lng]} icon={driverIcon as any} />}
            {driverLoc && <RoutingMachine 
                driverLoc={driverLoc} 
                patientLoc={patientLoc} 
                onUpdate={(dist, time, secs) => {
                    setDistance(dist)
                    setEta(time)
                    setRealCountdown(secs)
                    if (displayCountdown === null) setDisplayCountdown(secs)
                }} 
            />}
          </MapContainer>
        )}

        <div className="absolute top-4 left-4 z-[100] pointer-events-auto">
          <Link href="/dashboard" className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-gray-900 border border-gray-100 active:scale-95 transition-transform">
             <ArrowLeft size={20} />
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white px-6 py-8 relative -mt-6 rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-20">
          <div className="max-w-2xl mx-auto pb-12">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-red-600 rounded-full" />
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Active Rescue</h2>
              </div>
              <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full flex items-center gap-2 border border-red-100 shadow-sm">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-black uppercase tracking-wider">Secure Channel</span>
              </div>
            </div>

            {/* Big Hero Countdown */}
            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-3xl p-8 mb-8 text-white shadow-2xl shadow-red-200 border border-red-500 relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <div className="relative z-10 flex flex-col items-center">
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 px-4 py-2 rounded-xl transition-all duration-500 ${isRecalculating ? 'bg-white text-red-600 animate-pulse' : 'bg-white/20 text-white'}`}>
                  {isRecalculating ? 'RECALCULATING BEST ROUTE...' : 'Ambulance in Transit'}
                </span>
                <span className={`text-7xl md:text-8xl font-mono font-black tracking-tighter drop-shadow-xl transition-all duration-500 ${isRecalculating ? 'blur-sm scale-95 opacity-50' : 'blur-0 scale-100'}`}>
                  {displayCountdown !== null ? formatCountdown(displayCountdown) : '--:--'}
                </span>
                <div className="flex items-center gap-2 text-red-100 font-bold text-sm mt-2 mb-6 opacity-80">
                  <Navigation size={14} />
                  <span>{distance || '--'} to your location</span>
                </div>
                <div className="w-full bg-red-900/40 h-3 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white shadow-[0_0_15px_white] transition-all duration-1000"
                    style={{ width: `${Math.min(100, Math.max(5, 100 - ((displayCountdown || 600)/600)*100))}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {driver?.user && (
                <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-red-50 border-2 border-white shadow-sm flex items-center justify-center text-red-600">
                      <Ambulance size={32} />
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight">{driver.user.first_name} {driver.user.last_name}</h3>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{driver.vehicle_model}</p>
                    </div>
                  </div>
                  <a href={`tel:${driver.user.phone}`} className="w-14 h-14 rounded-2xl bg-green-500 text-white flex items-center justify-center shadow-xl shadow-green-100 active:scale-95 transition-all">
                    <Phone size={28} />
                  </a>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Plate Number</p>
                  <p className="font-black text-gray-900">{driver?.vehicle_plate || '...'}</p>
                </div>
                <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                  <p className="font-black text-green-600 uppercase tracking-tighter">Emergency Response</p>
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  )
}

export default function TrackPage() {
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBooking() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('bookings').select('*, driver:drivers(*, user:users(*))').eq('patient_id', user.id).in('status', ['assigned','en_route','at_scene','transporting']).order('created_at', { ascending: false }).limit(1).single()
      setBooking(data)
      setLoading(false)
    }
    fetchBooking()
    const sub = supabase.channel('track-status').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, fetchBooking).subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [])

  if (loading) return <div className="h-screen bg-white flex items-center justify-center font-black text-red-600 animate-pulse uppercase tracking-[0.4em]">Syncing...</div>
  if (!booking) return <div className="h-screen bg-white flex flex-col items-center justify-center p-8 text-center"><h2 className="text-2xl font-black text-gray-900 mb-2 uppercase">No Active Trip</h2><p className="text-sm text-gray-500 mb-6">You don''t have an active emergency booking being tracked right now.</p><Link href="/dashboard" className="btn-primary px-8">Return Home</Link></div>

  return <TrackingContent booking={booking} driver={booking.driver} />
}

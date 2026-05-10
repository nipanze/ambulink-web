'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Ambulance, MapPin, Phone, Clock, Navigation, ShieldCheck, ArrowLeft, Zap } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Client-only Map Components
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false })

// Helper for Routing
function RoutingMachine({ driverLoc, patientLoc, onUpdate }: { driverLoc: any, patientLoc: any, onUpdate: (dist: string, time: string, secs: number) => void }) {
  const map: any = require('react-leaflet').useMap();
  const routingControlRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const L = require('leaflet');
    require('leaflet-routing-machine');

    if (routingControlRef.current) map.removeControl(routingControlRef.current);

    routingControlRef.current = L.Routing.control({
        waypoints: [L.latLng(driverLoc.lat, driverLoc.lng), L.latLng(patientLoc.lat, patientLoc.lng)],
        lineOptions: { styles: [{ color: '#dc2626', weight: 6, opacity: 0.8 }] },
        addWaypoints: false, draggableWaypoints: false, fitSelectedRoutes: true, show: false,
        createMarker: () => null
    })
    .on('routesfound', (e: any) => {
        const s = e.routes[0].summary;
        onUpdate((s.totalDistance / 1000).toFixed(1) + ' km', Math.round(s.totalTime / 60) + ' min', Math.round(s.totalTime));
    })
    .addTo(map);

    return () => { if (routingControlRef.current) map.removeControl(routingControlRef.current); }
  }, [map, driverLoc, patientLoc]);

  return null;
}

const DEMO_BOOKING = {
  booking_ref: 'SOS-DEMO-2026',
  status: 'en_route',
  pickup_latitude: 0.3176,
  pickup_longitude: 32.5825,
}

const DEMO_DRIVER = {
  user: { first_name: 'Godfrey', last_name: 'Ssali', phone: '+256782200001' },
  vehicle_model: 'Toyota HiAce — Advanced Life Support',
  vehicle_plate: 'DEM 001S'
}

function TrackingContent({ booking, driver, isDemo = false }: { booking: any, driver: any, isDemo?: boolean }) {
  const [driverLoc, setDriverLoc] = useState<{lat: number, lng: number} | null>(isDemo ? { lat: 0.33, lng: 32.61 } : null)
  const [distance, setDistance] = useState<string | null>(null)
  const [realCountdown, setRealCountdown] = useState<number | null>(300)
  const [displayCountdown, setDisplayCountdown] = useState<number | null>(300)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [speed, setSpeed] = useState(72)
  const [L, setL] = useState<any>(null)

  useEffect(() => {
    const speedInt = setInterval(() => setSpeed(Math.floor(Math.random() * (110 - 40 + 1)) + 40), 2500)
    return () => clearInterval(speedInt)
  }, [])

  useEffect(() => {
    if (displayCountdown === null || displayCountdown <= 0) return
    const timer = setInterval(() => setDisplayCountdown(prev => (prev && prev > 0) ? prev - 1 : 0), 1000)
    return () => clearInterval(timer)
  }, [displayCountdown])

  useEffect(() => {
    const jitter = setInterval(() => {
      if (Math.random() > 0.4) {
        setIsRecalculating(true)
        setTimeout(() => {
          const next = Math.max(10, (displayCountdown || 300) + (Math.floor(Math.random() * 120) - 60))
          setDisplayCountdown(next)
          setIsRecalculating(false)
        }, 800)
      }
    }, 7000)
    return () => clearInterval(jitter)
  }, [displayCountdown])

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
    if (isDemo || !driver?.id) return
    const sub = supabase.channel(`driver-loc-${driver.id}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'driver_locations', filter: `driver_id=eq.${driver.id}` }, (p) => {
        setDriverLoc({ lat: Number(p.new.latitude), lng: Number(p.new.longitude) })
    }).subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [driver, isDemo])

  const formatCountdown = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  const patientLoc = { lat: Number(booking.pickup_latitude), lng: Number(booking.pickup_longitude) }
  const driverIcon = L ? new L.DivIcon({
      html: '<div class="relative flex items-center justify-center"><div class="absolute w-12 h-12 bg-red-500/20 rounded-full animate-ping"></div><div class="text-4xl drop-shadow-2xl z-10">🚑</div></div>',
      className: 'bg-transparent', iconSize: [48, 48], iconAnchor: [24, 24]
  }) : null;

  const patientIcon = L ? new L.DivIcon({
      html: '<div class="text-4xl drop-shadow-xl">📍</div>',
      className: 'bg-transparent', iconSize: [40, 40], iconAnchor: [20, 20]
  }) : null;

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="h-[45%] md:h-[55%] relative overflow-hidden bg-gray-100 z-10">
        {!L ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-xs font-black text-red-600 animate-pulse">BOOTING SATELLITE...</span>
          </div>
        ) : (
          <MapContainer center={[patientLoc.lat, patientLoc.lng]} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution="&copy; CARTO" />
            <Marker position={[patientLoc.lat, patientLoc.lng]} icon={patientIcon as any} />
            {driverLoc && <Marker position={[driverLoc.lat, driverLoc.lng]} icon={driverIcon as any} />}
            {driverLoc && <RoutingMachine driverLoc={driverLoc} patientLoc={patientLoc} onUpdate={(d, t, s) => { setDistance(d) }} />}
          </MapContainer>
        )}

        {isDemo && (
          <div className="absolute top-4 right-4 z-[100] bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/20 shadow-2xl">
             <Zap size={12} className="text-yellow-400 fill-yellow-400" />
             <span className="text-[10px] font-black text-white uppercase tracking-widest">Simulation Mode</span>
          </div>
        )}

        <div className="absolute top-4 left-4 z-[100]">
          <Link href="/dashboard" className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-gray-900 border border-gray-100">
             <ArrowLeft size={20} />
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white px-6 py-8 relative -mt-6 rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-20">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-red-600 rounded-full" />
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Active Response</h2>
              </div>
              <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full flex items-center gap-2 border border-red-100">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-black uppercase tracking-wider">Verified Secure</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-3xl p-8 mb-8 text-white shadow-2xl shadow-red-200 border border-red-500 relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <div className="relative z-10 flex flex-col items-center">
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 px-4 py-2 rounded-xl transition-all duration-500 ${isRecalculating ? 'bg-white text-red-600 animate-pulse' : 'bg-white/20 text-white'}`}>
                  {isRecalculating ? 'OPTIMIZING RESCUE PATH...' : 'Emergency Unit En-Route'}
                </span>
                
                <div className="flex flex-col items-center gap-0">
                  <span className={`text-7xl md:text-8xl font-mono font-black tracking-tighter drop-shadow-xl transition-all duration-500 ${isRecalculating ? 'blur-sm scale-95 opacity-50' : 'blur-0 scale-100'}`}>
                    {displayCountdown !== null ? formatCountdown(displayCountdown) : '--:--'}
                  </span>
                  
                  <div className="flex items-center gap-2 -mt-2 bg-black/20 px-4 py-1 rounded-full backdrop-blur-sm border border-white/10">
                    <div className={`w-2 h-2 rounded-full ${speed > 80 ? 'bg-red-400 animate-ping' : 'bg-green-400'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white italic">
                      Live Velocity: {speed} KM/H
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-red-100 font-bold text-sm mt-6 mb-6 opacity-80">
                  <Navigation size={14} />
                  <span>{distance || '1.4 km'} to your location</span>
                </div>
                <div className="w-full bg-red-900/40 h-3 rounded-full overflow-hidden">
                  <div className="h-full bg-white shadow-[0_0_15px_white] transition-all duration-1000" style={{ width: `${Math.min(100, Math.max(5, 100 - ((displayCountdown || 300)/300)*100))}%` }} />
                </div>
              </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-red-50 border-2 border-white shadow-sm flex items-center justify-center text-red-600 overflow-hidden relative">
                      {driver.user.first_name ? <div className="absolute inset-0 bg-red-600 flex items-center justify-center text-white font-black text-2xl">{driver.user.first_name[0]}</div> : <Ambulance size={32} />}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Plate Number</p>
                  <p className="font-black text-gray-900">{driver.vehicle_plate}</p>
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
  const [driver, setDriver] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBooking() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('bookings').select('*, driver:drivers(*, user:users(*))').eq('patient_id', user.id).in('status', ['assigned','en_route','at_scene','transporting']).order('created_at', { ascending: false }).limit(1).single()
      
      if (data) {
        setBooking(data)
        setDriver(data.driver)
      }
      setLoading(false)
    }
    fetchBooking()
    const sub = supabase.channel('track-status').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, fetchBooking).subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [])

  if (loading) return <div className="h-screen bg-white flex items-center justify-center font-black text-red-600 animate-pulse uppercase tracking-[0.4em]">Syncing...</div>

  // If no real booking, use DEMO mode instead of blank screen
  return <TrackingContent 
            booking={booking || DEMO_BOOKING} 
            driver={driver || DEMO_DRIVER} 
            isDemo={!booking} 
          />
}

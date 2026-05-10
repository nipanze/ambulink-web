'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Loader2, Ambulance, MapPin, Navigation, Info, Map as MapIcon, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { StatusBadge } from '@/components/shared/Badges'
import Link from 'next/link'

// Leaflet Dynamic Imports
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false })
const MapEvents = null; // Removed hook dynamic import

function MapController({ center }: { center: [number, number] | null }) {
  const map: any = require('react-leaflet').useMap();
  useEffect(() => {
    if (center && map) {
      map.panTo(center, { animate: true });
    }
  }, [center, map]);
  return null;
}

export default function AdminTrackingPage() {
  const [drivers, setDrivers] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [L, setL] = useState<any>(null)
  const [focusLocation, setFocusLocation] = useState<[number, number] | null>(null)

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

  const loadData = useCallback(async () => {
    const [{ data: drData }, { data: bkData }] = await Promise.all([
      supabase.from('drivers').select('*, user:users!user_id(*), location:driver_locations(*)').eq('status', 'active').eq('is_online', true),
      supabase.from('vw_booking_overview').select('*').in('status', ['requested','assigned','en_route','at_scene','transporting']),
    ])
    setDrivers(drData ?? [])
    setBookings(bkData ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    const ch1 = supabase.channel('tracking-drivers').on('postgres_changes', { event: '*', schema: 'public', table: 'driver_locations' }, loadData).subscribe()
    const ch2 = supabase.channel('tracking-bookings').on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, loadData).subscribe()
    return () => {
      supabase.removeChannel(ch1)
      supabase.removeChannel(ch2)
    }
  }, [loadData])

  const driverIcon = L ? new L.DivIcon({
      html: '<div class="text-2xl transition-all duration-500 scale-110">🚑</div>',
      className: 'bg-transparent',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
  }) : null;

  const patientIcon = L ? new L.DivIcon({
      html: '<div class="text-2xl">📍</div>',
      className: 'bg-transparent',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
  }) : null;

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between bg-white z-10 shadow-sm relative">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Fleet Tracking</h1>
          <p className="text-sm text-gray-500 font-medium">Live monitoring dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-2xl border border-green-100 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-black text-green-700 uppercase tracking-widest">{drivers.length} Online</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-2xl border border-red-100 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-black text-red-700 uppercase tracking-widest">{bookings.length} SOS</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 relative bg-gray-100 z-10">
          {!loading && typeof window !== 'undefined' && (
            <MapContainer center={[0.3176, 32.5825]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
               <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
               
               {/* Drivers */}
               {drivers.map(d => d.location && (
                  <Marker key={`dr-${d.id}`} position={[Number(d.location.latitude), Number(d.location.longitude)]} icon={driverIcon as any}>
                    <Popup className="rounded-2xl overflow-hidden font-sans">
                      <div className="p-1">
                        <p className="font-black text-gray-900">{d.user?.first_name} {d.user?.last_name}</p>
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{d.vehicle_plate}</p>
                      </div>
                    </Popup>
                  </Marker>
               ))}

               {/* Bookings */}
               {bookings.map(b => b.pickup_latitude && (
                  <Marker key={`bk-${b.booking_id}`} position={[Number(b.pickup_latitude), Number(b.pickup_longitude)]} icon={patientIcon as any}>
                    <Popup>
                      <div className="p-1">
                        <p className="font-bold text-sm">{b.patient_name}</p>
                        <StatusBadge status={b.status} />
                      </div>
                    </Popup>
                  </Marker>
               ))}

               {/* Focus Logic */}
               <MapController center={focusLocation} />
            </MapContainer>
          )}

          {/* Map Overlays */}
          <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-[1001]">
             <div className="p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                Live Network Active
             </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-96 bg-white border-l border-gray-100 overflow-y-auto p-4 space-y-6 shadow-[-10px_0_40px_-15px_rgba(0,0,0,0.05)] z-20">
          <div className="space-y-4">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Active Ambulances</h2>
            <div className="grid grid-cols-1 gap-3">
              {drivers.length === 0 && !loading && (
                <div className="p-8 text-center text-gray-300 font-bold border-2 border-dashed border-gray-100 rounded-3xl">No drivers online</div>
              )}
              {drivers.map(d => (
                <button 
                  key={d.id} 
                  onClick={() => d.location && setFocusLocation([Number(d.location.latitude), Number(d.location.longitude)])}
                  className="p-4 rounded-2xl border border-gray-50 bg-gray-50/50 hover:bg-white hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-left flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-100 group-hover:rotate-12 transition-transform">
                    <Ambulance size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-gray-900 truncate">{d.user?.first_name} {d.user?.last_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                       <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">{d.vehicle_plate}</span>
                       <span className="w-1 h-1 rounded-full bg-gray-300" />
                       <span className="text-[10px] font-bold text-gray-400 truncate">{d.vehicle_model}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Emergencies Awaiting</h2>
            <div className="space-y-3">
              {bookings.length === 0 && !loading && (
                <div className="p-8 text-center text-gray-300 font-bold border-2 border-dashed border-gray-100 rounded-3xl">Clear Skyline</div>
              )}
              {bookings.map(b => (
                <div key={b.booking_id} className="p-5 rounded-3xl border border-red-50 bg-red-50/30 hover:bg-white hover:shadow-2xl transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-mono text-[10px] font-black text-red-400 uppercase tracking-tight px-2 py-1 bg-white rounded-lg shadow-sm">{b.booking_ref}</span>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="font-black text-base text-gray-900 leading-tight mb-2">{b.patient_name}</p>
                  <div className="flex items-start gap-2 mb-4 text-xs font-medium text-gray-500">
                    <MapPin size={14} className="text-red-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{b.pickup_address}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => b.pickup_latitude && setFocusLocation([Number(b.pickup_latitude), Number(b.pickup_longitude)])}
                      className="flex-1 bg-white border border-gray-100 text-[10px] font-black text-gray-900 py-3 rounded-xl uppercase tracking-widest hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <MapIcon size={12} /> Focus
                    </button>
                    <Link 
                      href={`/admin/bookings?id=${b.booking_id}`}
                      className="flex-1 bg-red-600 text-white text-[10px] font-black py-3 rounded-xl uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2"
                    >
                      Dispatch <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

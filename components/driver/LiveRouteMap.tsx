'use client'
import { useState, useEffect, useRef } from 'react'
import { Ambulance, MapPin, Navigation, Clock } from 'lucide-react'
import dynamic from 'next/dynamic'

// Internal Map Engine
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false })

function RouteEngine({ start, end, onUpdate }: { start: any, end: any, onUpdate: (d: string, t: string) => void }) {
  const map: any = require('react-leaflet').useMap();
  const ctrlRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const L = require('leaflet');
    require('leaflet-routing-machine');

    if (ctrlRef.current) map.removeControl(ctrlRef.current);

    ctrlRef.current = L.Routing.control({
      waypoints: [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)],
      lineOptions: { styles: [{ color: '#2563eb', weight: 5, opacity: 0.8 }] },
      addWaypoints: false,
      draggableWaypoints: false,
      createMarker: () => null,
      show: false
    }).on('routesfound', (e: any) => {
      const s = e.routes[0].summary;
      onUpdate((s.totalDistance/1000).toFixed(1) + 'km', Math.round(s.totalTime/60) + 'm');
    }).addTo(map);

    return () => { if(ctrlRef.current) map.removeControl(ctrlRef.current); }
  }, [map, start, end]);

  return null;
}

export default function LiveRouteMap({ pickupLat, pickupLng, driverLat, driverLng }: { pickupLat: number, pickupLng: number, driverLat: number, driverLng: number }) {
  const [stats, setStats] = useState({ d: '--', t: '--' });
  const [L, setL] = useState<any>(null);

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
  }, []);

  const dIcon = L ? new L.DivIcon({ html: '<div class="text-2xl">🚑</div>', className: 'bg-transparent', iconSize:[30,30] }) : null;
  const pIcon = L ? new L.DivIcon({ html: '<div class="text-2xl">📍</div>', className: 'bg-transparent', iconSize:[30,30] }) : null;

  return (
    <div className="relative w-full h-48 rounded-2xl overflow-hidden shadow-inner border border-gray-100">
      <MapContainer center={[pickupLat, pickupLng]} zoom={14} style={{height:'100%', width:'100%'}} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[pickupLat, pickupLng]} icon={pIcon as any} />
          <Marker position={[driverLat, driverLng]} icon={dIcon as any} />
          <RouteEngine start={{lat: driverLat, lng: driverLng}} end={{lat: pickupLat, lng: pickupLng}} onUpdate={(d, t) => setStats({d, t})} />
      </MapContainer>
      
      <div className="absolute top-3 left-3 right-3 flex justify-between pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-2 border border-blue-100">
           <Navigation size={12} className="text-blue-600" />
           <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">{stats.d} TO PATIENT</span>
        </div>
        <div className="bg-red-600 px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-2 border border-white">
           <Clock size={12} className="text-white" />
           <span className="text-[10px] font-black text-white uppercase tracking-widest">{stats.t} ETA</span>
        </div>
      </div>
    </div>
  )
}

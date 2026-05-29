'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default icons in leaflet + next
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
})

const patientIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

function MapBounds({ patient, driver }: { patient: any, driver: any }) {
  const map = useMap()
  useEffect(() => {
    if (patient && driver) {
      const bounds = L.latLngBounds(
        [patient.lat, patient.lng],
        [driver.lat, driver.lng]
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    } else if (patient) {
      map.setView([patient.lat, patient.lng], 15)
    }
  }, [map, patient, driver])
  return null
}

export default function TrackingMap({ patientCoords, driverCoords }: { patientCoords: any, driverCoords: any }) {
  const [route, setRoute] = useState<[number, number][]>([])

  useEffect(() => {
    const fetchRoute = async () => {
      if (!patientCoords || !driverCoords) return
      
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${driverCoords.lng},${driverCoords.lat};${patientCoords.lng},${patientCoords.lat}?overview=full&geometries=geojson`
        const res = await fetch(url)
        const data = await res.json()
        
        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]])
          setRoute(coords)
        }
      } catch (err) {
        console.error("OSRM Error:", err)
      }
    }
    fetchRoute()
    // Refetch the route every time driver coordinates change
  }, [patientCoords, driverCoords])

  if (!patientCoords) return <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">Loading map...</div>

  return (
    <MapContainer 
      center={[patientCoords.lat, patientCoords.lng]} 
      zoom={14} 
      className="w-full h-full z-0"
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      <Marker position={[patientCoords.lat, patientCoords.lng]} icon={patientIcon} />
      
      {driverCoords && (
        <>
          <Marker position={[driverCoords.lat, driverCoords.lng]} icon={driverIcon} />
          {route.length > 0 && (
            <Polyline positions={route} color="#2563EB" weight={5} opacity={0.7} />
          )}
        </>
      )}

      <MapBounds patient={patientCoords} driver={driverCoords} />
    </MapContainer>
  )
}

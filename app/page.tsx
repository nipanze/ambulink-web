'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertTriangle, Car, Building2, Phone } from 'lucide-react'
import SOSModal from '@/components/sos/SOSModal'
import { toast } from 'sonner'

export default function LandingPage() {
  const router = useRouter()
  
  // SOS State
  const [modalOpen, setModalOpen] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingRef, setBookingRef] = useState<string | undefined>()

  const handleSOSClick = () => {
    setModalOpen(true)
    setBookingRef(undefined)
    setCoords(null)

    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      (error) => {
        console.error('GPS Error:', error)
        toast.error('Failed to acquire precise GPS. Using fallback location.')
        // Fallback to a default location (Kampala Center) for testing or when GPS is unavailable
        setCoords({ lat: 0.3476, lng: 32.5825 })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleConfirmSOS = async () => {
    if (!coords) return
    setIsSubmitting(true)
    
    try {
      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: coords.lat,
          longitude: coords.lng,
          type: 'emergency'
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit SOS')

      setBookingRef(data.bookingRef)
      toast.success(data.message || 'SOS Submitted successfully')
      
      // Navigate to tracking page after showing success briefly
      setTimeout(() => {
        router.push(`/track?bookingId=${data.bookingId}`)
      }, 3000)

    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Nav */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-sm border-b border-gray-100 z-10 relative">
        <div className="flex items-center gap-2">
          <Image src="/images/icon.png" alt="AmbuLink Logo" width={32} height={32} className="object-contain" />
          <span className="text-2xl font-black text-red-600 tracking-tighter">AmbuLink</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            Driver / Admin Login
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-12">
        
        <div className="text-center max-w-xl mx-auto space-y-4">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-gray-900 leading-tight">
            Emergency Help,<br />One Tap Away
          </h1>
          <p className="text-lg text-gray-500 font-medium">
            Request immediate ambulance dispatch without an account. We find the nearest responder instantly.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
          
          {/* 1. SOS Emergency */}
          <motion.div 
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSOSClick}
            className="action-card action-card-sos group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
              <AlertTriangle size={120} />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30 group-hover:animate-pulse">
                <AlertTriangle size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-black mb-2">SOS Emergency</h2>
                <p className="text-red-100 font-medium leading-relaxed">
                  Immediate medical ambulance dispatch to your current exact GPS location.
                </p>
              </div>
            </div>
            <div className="relative z-10 mt-8">
              <span className="inline-flex items-center gap-2 bg-white text-red-600 font-black px-6 py-3 rounded-full text-sm uppercase tracking-wide group-hover:bg-red-50 transition-colors">
                Tap to Request <span className="text-lg leading-none">→</span>
              </span>
            </div>
          </motion.div>

          {/* 2. Highway Accident */}
          <Link href="/highway" className="block">
            <motion.div 
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="action-card action-card-highway group h-full"
            >
              <div className="absolute top-0 right-0 p-8 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
                <Car size={120} />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <Car size={32} className="text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black mb-2">Highway Accident</h2>
                  <p className="text-amber-100 font-medium leading-relaxed">
                    Report a road traffic collision on major corridors. Send details & photos.
                  </p>
                </div>
              </div>
              <div className="relative z-10 mt-8">
                <span className="inline-flex items-center gap-2 bg-white/20 text-white font-black px-6 py-3 rounded-full text-sm uppercase tracking-wide group-hover:bg-white/30 transition-colors backdrop-blur-sm">
                  Report Incident <span className="text-lg leading-none">→</span>
                </span>
              </div>
            </motion.div>
          </Link>

          {/* 3. Institutional Dispatch */}
          <Link href="/auth/login?redirect=/institution" className="block">
            <motion.div 
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="action-card action-card-institutional group h-full"
            >
              <div className="absolute top-0 right-0 p-8 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
                <Building2 size={120} />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <Building2 size={32} className="text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black mb-2">Institution Portal</h2>
                  <p className="text-blue-100 font-medium leading-relaxed">
                    Verified hospitals & clinics. Book transfers and scheduled transport.
                  </p>
                </div>
              </div>
              <div className="relative z-10 mt-8">
                <span className="inline-flex items-center gap-2 bg-white/20 text-white font-black px-6 py-3 rounded-full text-sm uppercase tracking-wide group-hover:bg-white/30 transition-colors backdrop-blur-sm">
                  Access Portal <span className="text-lg leading-none">→</span>
                </span>
              </div>
            </motion.div>
          </Link>

        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-500">
        <div className="flex items-center justify-center gap-2 mb-4 font-black text-gray-800">
          <Phone size={18} className="text-red-600" />
          <span>Toll-Free Emergency: 0800 123 456</span>
        </div>
        <p className="text-sm">© 2026 AmbuLink Platform. Kampala International University.</p>
      </footer>

      {/* Modal */}
      <SOSModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        coords={coords}
        isLoading={isSubmitting}
        onConfirm={handleConfirmSOS}
        bookingRef={bookingRef}
      />

    </main>
  )
}

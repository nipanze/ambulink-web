'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, AlertTriangle, CheckCircle2, Loader2, Phone } from 'lucide-react'
import { useState, useEffect } from 'react'

interface SOSModalProps {
  isOpen: boolean
  onClose: () => void
  coords: { lat: number; lng: number } | null
  isLoading: boolean
  onConfirm: () => void
  bookingRef?: string
}

export default function SOSModal({ isOpen, onClose, coords, isLoading, onConfirm, bookingRef }: SOSModalProps) {
  const [countdown, setCountdown] = useState(3)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    if (isOpen && !isSuccess && !isLoading && !bookingRef) {
      const timer = countdown > 0 && setInterval(() => setCountdown(countdown - 1), 1000)
      if (countdown === 0) onConfirm()
      return () => { if (timer) clearInterval(timer) }
    }
  }, [isOpen, countdown, isSuccess, isLoading, bookingRef, onConfirm])

  useEffect(() => {
    if (bookingRef) setIsSuccess(true)
  }, [bookingRef])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg glass-dark rounded-[2.5rem] overflow-hidden p-8 text-white"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={24} />
        </button>

        {!isSuccess ? (
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center animate-sos-pulse">
              <AlertTriangle size={40} className="animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight">SOS EMERGENCY</h2>
              <p className="text-gray-400">Requesting immediate medical assistance</p>
            </div>

            <div className="w-full bg-white/5 rounded-3xl p-6 space-y-4 border border-white/10">
              <div className="flex items-start gap-4">
                <div className="bg-red-500/20 p-2 rounded-lg">
                  <MapPin className="text-red-500" size={20} />
                </div>
                <div className="text-left flex-1">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Detected Location</p>
                  {coords ? (
                    <p className="font-mono text-sm">
                      {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                    </p>
                  ) : (
                    <p className="text-sm italic text-gray-400">Acquiring GPS fix...</p>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full space-y-3">
              <button 
                onClick={onConfirm}
                disabled={isLoading || !coords}
                className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>CONFIRM SOS {countdown > 0 && `(${countdown})`}</>
                )}
              </button>
              <button 
                onClick={onClose}
                className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold text-gray-400 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-6 py-4">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.4)]"
            >
              <CheckCircle2 size={40} />
            </motion.div>

            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight uppercase">Ambulance Dispatched</h2>
              <p className="text-gray-400">A responder is being assigned to your location</p>
            </div>

            <div className="w-full bg-white/5 rounded-3xl p-6 border border-white/10 text-left">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Booking Reference</p>
              <p className="text-2xl font-black text-green-400 tracking-tighter">{bookingRef}</p>
              <p className="text-sm text-gray-400 mt-4 leading-relaxed">
                Stay where you are. Keep your phone line clear. Our dispatchers may call you for more details.
              </p>
            </div>

            <div className="w-full flex gap-3">
              <a 
                href="tel:+256800AMBULINK"
                className="flex-[2] py-4 bg-white text-black rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
              >
                <Phone size={20} /> CALL DISPATCH
              </a>
              <button 
                onClick={onClose}
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold text-gray-400 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

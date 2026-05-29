'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Car, MapPin, UploadCloud, AlertTriangle, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function HighwayPage() {
  const [formData, setFormData] = useState({
    reporterName: '',
    address: '',
    incidentType: '',
    casualties: '',
    description: '',
    corridor: 'other' // default enum
  })
  
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [bookingRef, setBookingRef] = useState('')

  const handleGetLocation = () => {
    setIsLocating(true)
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser.")
      setIsLocating(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        toast.success("Location acquired successfully.")
        setIsLocating(false)
      },
      (err) => {
        console.error(err)
        toast.error("Failed to get location. Please type it manually.")
        setIsLocating(false)
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.address && !coords) {
      toast.error('Please provide a location or use the GPS button.')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const payload = {
        ...formData,
        latitude: coords?.lat,
        longitude: coords?.lng,
      }

      const res = await fetch('/api/highway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit report')

      setBookingRef(data.bookingRef)
      setIsSuccess(true)
      toast.success('Incident reported to highway dispatch.')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-10 rounded-3xl shadow-xl max-w-lg w-full space-y-6">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-3xl font-black text-gray-900">Report Received</h1>
          <p className="text-gray-600">Your report has been forwarded to the highway emergency dispatch center.</p>
          
          <div className="bg-gray-100 p-4 rounded-xl border border-gray-200">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Incident Reference</p>
            <p className="text-2xl font-black text-gray-900 font-mono">{bookingRef}</p>
          </div>
          
          <Link href="/" className="btn-primary w-full block py-4 text-lg">Return to Home</Link>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-12">
      {/* Top Nav */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-black font-semibold transition-colors">
          <ArrowLeft size={18} /> Back
        </Link>
        <span className="font-black text-amber-600 tracking-tight flex items-center gap-2">
          <Car size={18} /> Highway Incident Report
        </span>
        <div className="w-16"></div> {/* Spacer */}
      </nav>

      <div className="max-w-2xl mx-auto pt-8 px-4">
        <div className="bg-amber-100 text-amber-800 p-4 rounded-2xl flex items-start gap-4 mb-8 border border-amber-200">
          <AlertTriangle className="mt-1 flex-shrink-0" />
          <p className="text-sm font-medium">Use this form to report major vehicular accidents along national highway corridors. Dispatchers will review and assign an appropriate level response immediately.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-6 md:p-8 space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-black text-gray-900">Incident Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Incident Type</label>
                <select 
                  className="input py-3" 
                  value={formData.incidentType}
                  onChange={(e) => setFormData({...formData, incidentType: e.target.value})}
                  required
                >
                  <option value="">Select type...</option>
                  <option value="Multi-vehicle collision">Multi-vehicle collision</option>
                  <option value="Single vehicle rollover">Single vehicle rollover</option>
                  <option value="Pedestrian struck">Pedestrian struck</option>
                  <option value="Boda-boda crash">Boda-boda crash</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Est. Casualties</label>
                <input 
                  type="number" 
                  min="0"
                  placeholder="E.g. 3"
                  className="input py-3"
                  value={formData.casualties}
                  onChange={(e) => setFormData({...formData, casualties: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Highway Corridor</label>
              <select 
                className="input py-3" 
                value={formData.corridor}
                onChange={(e) => setFormData({...formData, corridor: e.target.value})}
              >
                <option value="kampala_jinja">Kampala - Jinja</option>
                <option value="kampala_masaka">Kampala - Masaka</option>
                <option value="kampala_mbarara">Kampala - Mbarara</option>
                <option value="kampala_gulu">Kampala - Gulu</option>
                <option value="kampala_fort_portal">Kampala - Fort Portal</option>
                <option value="kampala_mbale">Kampala - Mbale</option>
                <option value="other">Other / Not Sure</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Location / Landmark Details</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="E.g. Near Seeta High School"
                  className="input py-3 flex-1"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
                <button 
                  type="button" 
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 rounded-xl flex flex-col items-center justify-center font-semibold transition-colors disabled:opacity-50 min-w-[70px]"
                >
                  {isLocating ? <Loader2 className="animate-spin" size={20} /> : <MapPin size={20} />}
                  <span className="text-[10px] mt-1 uppercase">GPS</span>
                </button>
              </div>
              {coords && <p className="text-xs text-green-600 mt-2 font-bold tracking-wide">✓ GPS Coordinates Locked: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Additional description</label>
              <textarea 
                className="input py-3 min-h-[100px]"
                placeholder="Any other details? (Vehicle description, hazards etc.)"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              ></textarea>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Photo (Optional)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-colors cursor-pointer relative">
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                <UploadCloud size={32} className="mb-2" />
                <span className="text-sm font-semibold">Tap to select photo / Take photo</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h2 className="text-lg font-black text-gray-900 mb-4">Reporter Information</h2>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Your Name (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Keep blank to report anonymously"
                  className="input py-3"
                  value={formData.reporterName}
                  onChange={(e) => setFormData({...formData, reporterName: e.target.value})}
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black text-lg py-5 rounded-2xl flex items-center justify-center gap-3 transition-colors disabled:opacity-70 active:scale-[0.98]"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'SUBMIT HIGHWAY REPORT'}
          </button>
        </form>
      </div>
    </main>
  )
}

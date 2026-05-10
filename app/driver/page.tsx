'use client'
import { useState, useEffect, useCallback } from 'react'
import { Ambulance, MapPin, Navigation, Phone, CheckCircle, Clock, Loader2, Power, AlertTriangle, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { StatusBadge, TypeBadge } from '@/components/shared/Badges'
import { timeAgo } from '@/lib/utils'
import type { Booking, Driver } from '@/lib/types'
import { toast } from 'sonner'

export default function DriverDashboard() {
  const [driver,   setDriver]   = useState<Driver | null>(null)
  const [activeTab,setActiveTab] = useState<'assigned' | 'history'>('assigned')
  const [bookings, setBookings]  = useState<Booking[]>([])
  const [loading,  setLoading]   = useState(true)
  const [updating, setUpdating]  = useState<number | null>(null)

  const fetchDriverData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // Get DB user
    const userRes = await fetch('/api/users/me', {
       headers: { 'Authorization': `Bearer ${session.access_token}` }
    })
    const dbUser = await userRes.json()

    // Get Driver details
    const { data: drData } = await supabase
      .from('drivers')
      .select('*, user:users(*)')
      .eq('user_id', dbUser.id)
      .single()

    if (drData) {
      setDriver(drData)
      // Fetch bookings for this driver
      const { data: bkData } = await supabase
        .from('bookings')
        .select('*, patient:users!patient_id(*)')
        .eq('driver_id', drData.id)
        .order('created_at', { ascending: false })
      
      setBookings(bkData ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchDriverData() }, [fetchDriverData])

  // Real-time subscription
  useEffect(() => {
    const ch = supabase.channel('driver-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchDriverData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, fetchDriverData)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [fetchDriverData])

  // Location Updates (Simulation/Background)
  useEffect(() => {
    if (!driver?.is_online) return

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, heading, speed } = pos.coords
        await supabase.from('driver_locations').upsert({
          driver_id: driver.id,
          latitude,
          longitude,
          heading:   heading ?? 0,
          speed_kmh: (speed ?? 0) * 3.6,
          updated_at: new Date().toISOString()
        })
      },
      (err) => console.error('Geo Error:', err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [driver?.is_online, driver?.id])

  async function toggleOnline() {
     if (!driver) return
     const newStatus = !driver.is_online
     const { error } = await supabase
       .from('drivers')
       .update({ is_online: newStatus })
       .eq('id', driver.id)
     
     if (error) toast.error('Failed to update status')
     else toast.success(newStatus ? 'You are now ONLINE' : 'You are now OFFLINE')
  }

  async function updateBookingStatus(bookingId: number, nextStatus: string) {
    setUpdating(bookingId)
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', bookingId)
      
      if (error) throw error
      toast.success(`Status updated to ${nextStatus.replace('_', ' ')}`)
      fetchDriverData()
    } catch (err: any) {
      toast.error(err.message || 'Update failed')
    } finally {
      setUpdating(null)
    }
  }

  const activeBookings = bookings.filter(b => !['completed', 'cancelled', 'expired'].includes(b.status))
  const historyBookings = bookings.filter(b => ['completed', 'cancelled', 'expired'].includes(b.status))

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <Loader2 size={32} className="animate-spin text-red-600" />
    </div>
  )

  if (!driver) return (
    <div className="flex-1 p-8 text-center bg-gray-50">
      <h2 className="text-xl font-black text-gray-900">Driver profile not found</h2>
      <p className="text-gray-500 mt-2">Please contact admin to verify your account.</p>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {/* Top Status Bar */}
      <div className={`p-4 transition-colors duration-500 border-b ${driver.is_online ? 'bg-green-600 border-green-700' : 'bg-gray-800 border-gray-900'} text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${driver.is_online ? 'bg-white/20' : 'bg-white/10'}`}>
                <Ambulance size={24} />
             </div>
             <div>
               <p className="font-black text-lg leading-tight uppercase tracking-tight">{driver.vehicle_plate}</p>
               <p className="text-xs font-bold opacity-70 italic">{driver.is_online ? 'Awaiting Emergencies' : 'System Offline'}</p>
             </div>
          </div>
          <button 
            onClick={toggleOnline}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm shadow-xl transition-all active:scale-95
              ${driver.is_online ? 'bg-white text-green-600' : 'bg-green-500 text-white'}
            `}
          >
            <Power size={18} />
            {driver.is_online ? 'GO OFFLINE' : 'GO ONLINE'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Rating', value: driver.average_rating || 5.0, icon: '★' },
            { label: 'Trips',  value: driver.total_trips, icon: '🚑' },
            { label: 'Level',  value: 'Pro', icon: '💎' },
          ].map(s => (
            <div key={s.label} className="card p-3 text-center">
               <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">{s.label}</div>
               <div className="text-xl font-black text-gray-900 mt-0.5">{s.icon} {s.value}</div>
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div className="flex bg-gray-200/50 p-1 rounded-xl">
           <button 
             className={`flex-1 py-2.5 rounded-lg text-xs font-black tracking-widest uppercase transition-all
               ${activeTab === 'assigned' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}
             `}
             onClick={() => setActiveTab('assigned')}
           >
             Active Jobs ({activeBookings.length})
           </button>
           <button 
             className={`flex-1 py-2.5 rounded-lg text-xs font-black tracking-widest uppercase transition-all
               ${activeTab === 'history' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}
             `}
             onClick={() => setActiveTab('history')}
           >
             History
           </button>
        </div>

        {/* List */}
        <div className="space-y-4">
           {(activeTab === 'assigned' ? activeBookings : historyBookings).map(b => (
             <div key={b.id} className="card p-0 overflow-hidden relative border-l-4 border-l-red-600">
               <div className="p-4 space-y-4">
                 <div className="flex justify-between items-start">
                    <div>
                       <span className="font-mono text-[10px] text-gray-400 font-bold">{b.booking_ref}</span>
                       <h3 className="text-lg font-black text-gray-900">{(b.patient as any)?.first_name} {(b.patient as any)?.last_name}</h3>
                    </div>
                    <StatusBadge status={b.status} />
                 </div>

                 <div className="space-y-2">
                    <div className="flex items-start gap-3">
                       <MapPin size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                       <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pickup Address</p>
                          <p className="text-sm font-bold text-gray-800 line-clamp-1">{b.pickup_address || 'Current Location'}</p>
                          {b.pickup_landmark && <p className="text-xs text-blue-600 mt-0.5 font-medium">Near: {b.pickup_landmark}</p>}
                       </div>
                    </div>
                    <div className="flex items-start gap-3">
                       <Navigation size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                       <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Destination</p>
                          <p className="text-sm font-bold text-gray-800 truncate">{b.destination_name || 'Nearest Available Hospital'}</p>
                       </div>
                    </div>
                 </div>

                 <div className="flex gap-2">
                    <a href={`tel:${(b.patient as any)?.phone}`} className="flex-1 flex items-center justify-center gap-2 bg-gray-100 rounded-xl p-3 text-gray-900 font-black text-xs hover:bg-gray-200 transition-all">
                       <Phone size={14} /> CALL PATIENT
                    </a>
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${b.pickup_latitude},${b.pickup_longitude}`} target="_blank" className="flex-1 flex items-center justify-center gap-2 bg-blue-600 rounded-xl p-3 text-white font-black text-xs shadow-lg shadow-blue-100">
                       <Navigation size={14} /> NAVIGATE
                    </a>
                 </div>

                 {/* Status Transition buttons */}
                 {activeTab === 'assigned' && (
                   <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2">
                      {b.status === 'assigned' && (
                        <button 
                          onClick={() => updateBookingStatus(b.id, 'en_route')}
                          disabled={!!updating}
                          className="col-span-2 btn-primary flex items-center justify-center gap-2 py-4 text-base font-black"
                        >
                          {updating === b.id ? <Loader2 className="animate-spin" /> : <Navigation size={20} />} START EN-ROUTE
                        </button>
                      )}
                      {b.status === 'en_route' && (
                        <button 
                          onClick={() => updateBookingStatus(b.id, 'at_scene')}
                          disabled={!!updating}
                          className="col-span-2 bg-orange-500 text-white rounded-xl p-4 flex items-center justify-center gap-2 font-black text-base shadow-lg shadow-orange-100"
                        >
                          {updating === b.id ? <Loader2 className="animate-spin" /> : <MapPin size={20} />} MARK AT SCENE
                        </button>
                      )}
                      {b.status === 'at_scene' && (
                        <button 
                          onClick={() => updateBookingStatus(b.id, 'transporting')}
                          disabled={!!updating}
                          className="col-span-2 bg-blue-600 text-white rounded-xl p-4 flex items-center justify-center gap-2 font-black text-base shadow-lg shadow-blue-100"
                        >
                          {updating === b.id ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />} START TRANSPORT
                        </button>
                      )}
                      {b.status === 'transporting' && (
                        <button 
                          onClick={() => updateBookingStatus(b.id, 'completed')}
                          disabled={!!updating}
                          className="col-span-2 bg-green-600 text-white rounded-xl p-4 flex items-center justify-center gap-2 font-black text-base shadow-lg shadow-green-100"
                        >
                          {updating === b.id ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />} MARK COMPLETED
                        </button>
                      )}
                   </div>
                 )}
               </div>
               
               {/* Time Badge */}
               <div className="absolute top-4 right-4 text-[9px] font-black uppercase text-gray-300">
                  {timeAgo(b.created_at)}
               </div>
             </div>
           ))}

           {(activeTab === 'assigned' ? activeBookings : historyBookings).length === 0 && (
              <div className="py-20 text-center space-y-4">
                 <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-300">
                    <Clock size={40} />
                 </div>
                 <p className="text-sm font-bold text-gray-400">No {activeTab} bookings found.</p>
              </div>
           )}
        </div>
      </div>
      
      {/* Bottom Nav Hint */}
      {driver.is_online && activeBookings.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
           <div className="bg-red-600 text-white p-4 rounded-3xl shadow-2xl animate-bounce-slow flex items-center gap-3">
              <AlertTriangle size={20} />
              <span className="text-xs font-black tracking-widest">ACTIVE JOB PENDING</span>
           </div>
        </div>
      )}
    </div>
  )
}

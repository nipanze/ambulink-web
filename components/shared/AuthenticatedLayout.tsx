'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import type { User } from '@/lib/types'
import { toast } from 'sonner'
import Link from 'next/link'

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen]   = useState(false)
  const [user,   setUser]     = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [badges, setBadges]   = useState<Record<string, number>>({})

  useEffect(() => {
    async function resolveUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setLoading(false)
           return
        }

        const res = await fetch('/api/users/me', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        if (res.ok) {
          const dbUser = await res.json()
          setUser(dbUser)
        }
      } catch (err) {
        console.error('Resolve User Error:', err)
      } finally {
        setLoading(false)
      }
    }
    resolveUser()
  }, [])

  const fetchCounts = useCallback(async () => {
    if (!user) return
    if (user?.role === 'admin') {
      const { count } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'requested')
      setBadges({ 'notifications': count ?? 0 })
    } else if (user?.role === 'driver') {
      const { data: dr } = await supabase.from('drivers').select('id').eq('user_id', user.id).single()
      if (dr) {
        const { count } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('driver_id', dr.id).eq('status', 'assigned')
        setBadges({ 'notifications': count ?? 0 })
      }
    } else if (user?.role === 'patient') {
      const { count } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('patient_id', user.id).in('status', ['assigned','en_route','at_scene','transporting'])
      setBadges({ 'notifications': count ?? 0 })
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    // 1. Admin Emergency SOS Alerts
    const emergencyChannel = supabase.channel('emergency-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, async (payload) => {
        const newBooking = payload.new as any
        if (user.role === 'admin' && newBooking.status === 'requested') {
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3')
            audio.volume = 0.5
            audio.play()
          } catch (e) {}

          toast.error('🚨 NEW EMERGENCY SOS!', {
            description: 'A new emergency request requires your immediate attention.',
            duration: 8000,
            action: { label: 'DISPATCH', onClick: () => window.location.href = '/admin/bookings' }
          })
        }
        fetchCounts()
      })
      .subscribe()

    // 2. Global Status Notifications (for all users, filter by user.id)
    const notifChannel = supabase.channel('global-notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, async (payload) => {
        const newNotif = payload.new as any
        toast(newNotif.title, { description: newNotif.body, duration: 6000 })
        
        if (user.role === 'patient') {
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3')
            audio.volume = 0.3
            audio.play()
          } catch (e) {}
        }
        fetchCounts()
      })
      .subscribe()

    return () => { 
      supabase.removeChannel(emergencyChannel) 
      supabase.removeChannel(notifChannel)
    }
  }, [user, fetchCounts])

  useEffect(() => {
    if (user && !loading) {
        const path = window.location.pathname
        const isCommonPath = path.startsWith('/settings') || path.startsWith('/notifications')
        
        if (user.role === 'admin' && !path.startsWith('/admin') && !isCommonPath) {
           window.location.href = '/admin'
        } else if (user.role === 'driver' && !path.startsWith('/driver') && !isCommonPath) {
           window.location.href = '/driver'
        } else if (user.role === 'institution_rep' && !path.startsWith('/institution') && !isCommonPath) {
           window.location.href = '/institution'
        }
    }
  }, [user, loading])

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50 flex-col gap-4">
      <Loader2 size={40} className="animate-spin text-red-600" />
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Verifying Authority…</p>
    </div>
  )

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-red-50 flex-col p-6 text-center">
        <Image src="/images/icon.png" alt="Logo" width={64} height={64} className="mb-6" />
        <h2 className="text-xl font-black text-gray-900">Profile Synchronization Error</h2>
        <p className="text-sm text-gray-500 max-w-xs mt-2">Sign out and sign in again.</p>
        <button onClick={() => supabase.auth.signOut().then(() => window.location.href = '/auth/login')} className="mt-6 btn-primary px-8">
           Return to Login
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
      <Sidebar user={user} isOpen={isOpen} onClose={() => setIsOpen(false)} badges={badges} />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <TopBar onMenuClick={() => setIsOpen(true)} />
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {children}
        </div>
      </main>
    </div>
  )
}

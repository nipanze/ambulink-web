'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'
import Sidebar from './Sidebar'
import MobileHeader from './MobileHeader'
import type { User } from '@/lib/types'

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen]   = useState(false)
  const [user,   setUser]     = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Image src="/images/icon.png" alt="Logo" width={48} height={48} className="animate-pulse" />
        <p className="text-xs font-black text-red-600 uppercase tracking-widest">Identifying Session…</p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
      <MobileHeader isOpen={isOpen} setIsOpen={setIsOpen} />
      <Sidebar user={user} isOpen={isOpen} onClose={() => setIsOpen(false)} />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {children}
      </main>
    </div>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from './Sidebar'
import MobileHeader from './MobileHeader'
import type { User } from '@/lib/types'

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    async function resolveUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      if (res.ok) {
        const dbUser = await res.json()
        setUser(dbUser)
      }
    }
    resolveUser()
  }, [])

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

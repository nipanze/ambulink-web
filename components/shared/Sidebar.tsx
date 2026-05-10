'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Ambulance, MapPin, Building2,
  Settings, LogOut, Bell, ShieldCheck, ChevronRight, X, Users, Clock
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { User } from '@/lib/types'

interface Props {
  user: User | null
  isOpen: boolean
  onClose: () => void
  badges?: Record<string, number>
}

const patientLinks = [
  { href: '/dashboard',           icon: LayoutDashboard, label: 'Dashboard'  },
  { href: '/bookings',            icon: Ambulance,       label: 'My Bookings' },
  { href: '/track',               icon: MapPin,          label: 'Track'       },
]
const institutionLinks = [
  { href: '/institution',         icon: Building2,       label: 'Institution' },
  { href: '/bookings',            icon: Ambulance,       label: 'Bookings'    },
]
const driverLinks = [
  { href: '/driver',              icon: LayoutDashboard, label: 'Dashboard'  },
  { href: '/driver/history',      icon: Clock,           label: 'Job History' },
  { href: '/settings',            icon: Settings,        label: 'Account'     },
]
const adminLinks = [
  { href: '/admin',               icon: ShieldCheck,     label: 'Admin'       },
  { href: '/admin/tracking',      icon: MapPin,          label: 'Fleet Tracking'},
  { href: '/admin/bookings',      icon: Ambulance,       label: 'All Bookings'},
  { href: '/admin/drivers',       icon: Users,           label: 'Drivers'     },
  { href: '/admin/institutions',  icon: Building2,       label: 'Institutions'},
  { href: '/admin/analytics',     icon: LayoutDashboard, label: 'Analytics'   },
]

export default function Sidebar({ user, isOpen, onClose, badges = {} }: Props) {
  const pathname = usePathname()
  const router   = useRouter()

  const links =
    user?.role === 'admin' ? adminLinks :
    user?.role === 'driver' ? driverLinks :
    user?.role === 'institution_rep' ? institutionLinks :
    user?.role === 'patient' ? patientLinks : []

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/')
  }

  const firstName = user?.first_name || 'AmbuLink'
  const lastName = user?.last_name || 'User'

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed md:sticky top-0 left-0 z-50
        w-64 h-screen bg-white border-r border-gray-100 
        flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Image src="/images/icon.png" alt="AmbuLink Logo" width={28} height={28} />
            <span className="font-black text-red-600 text-xl tracking-tight">AmbuLink</span>
          </div>
          <button onClick={onClose} className="md:hidden p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* User */}
        {user && (
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">
                {firstName[0]}{lastName[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{firstName} {lastName}</p>
                <p className="text-xs text-gray-400 capitalize">{user.role.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${active
                    ? 'bg-red-50 text-red-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <Icon size={17} />
                {label}
                {badges[href] > 0 && (
                  <span className="ml-auto bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {badges[href] > 9 ? '9+' : badges[href]}
                  </span>
                )}
                {active && !badges[href] && <ChevronRight size={13} className="ml-auto" />}
              </Link>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 border-t border-gray-100 space-y-1">
          <Link href="/notifications" onClick={onClose} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900">
            <Bell size={17} /> Notifications
          </Link>
          <Link href="/settings" onClick={onClose} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900">
            <Settings size={17} /> Settings
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 w-full text-left">
            <LogOut size={17} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}

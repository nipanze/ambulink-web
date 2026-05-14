'use client'
import Link from 'next/link'
import { Clock, Menu } from 'lucide-react'

interface Props {
  onMenuClick: () => void
}

export default function TopBar({ onMenuClick }: Props) {
  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 sticky top-0 z-40">
      {/* Mobile Menu Toggle */}
      <button 
        onClick={onMenuClick}
        className="md:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1" />

      {/* Global Actions */}
      <div className="flex items-center gap-2">
        <Link 
          href="/dashboard?schedule=true"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors border border-purple-100 shadow-sm"
        >
          <Clock size={16} />
          <span className="text-[10px] font-black uppercase tracking-wider hidden sm:block">Schedule Ambulance</span>
          <span className="text-[10px] font-black uppercase tracking-wider sm:hidden">Schedule</span>
        </Link>
      </div>
    </header>
  )
}

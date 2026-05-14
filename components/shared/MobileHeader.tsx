'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, Clock } from 'lucide-react'

interface Props {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export default function MobileHeader({ isOpen, setIsOpen }: Props) {
  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <Image src="/images/icon.png" alt="AmbuLink Logo" width={24} height={24} />
        <span className="font-black text-red-600 text-lg tracking-tight">AmbuLink</span>
      </div>
      
      <div className="flex items-center gap-1">
        <Link 
          href="/dashboard?schedule=true"
          className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
        >
          <Clock size={20} />
        </Link>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  )
}

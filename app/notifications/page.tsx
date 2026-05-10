'use client'
import { useState, useEffect, useCallback } from 'react'
import { Bell, Check, Loader2, Calendar, MessageSquare, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { timeAgo } from '@/lib/utils'
import type { Notification } from '@/lib/types'
import { toast } from 'sonner'

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchNotifs = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setNotifs(data)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifs()
  }, [fetchNotifs])

  async function markAsRead(id: number) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      }
    } catch (err) {}
  }

  async function markAllAsRead() {
    setActionLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setActionLoading(false)
      return
    }

    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({ all: true })
      })
      if (res.ok) {
        setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
        toast.success('All marked as read')
      }
    } catch (err) {
      toast.error('Operation failed')
    } finally {
      setActionLoading(false)
    }
  }

  const getIcon = (event: string) => {
    switch (event) {
      case 'booking_created': return <Calendar className="text-blue-500" size={18} />
      case 'driver_assigned': return <Check className="text-green-500" size={18} />
      case 'admin_alert':     return <AlertTriangle className="text-red-500" size={18} />
      default:                return <MessageSquare className="text-gray-500" size={18} />
    }
  }

  const unreadCount = notifs.filter(n => !n.is_read).length

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg text-red-600">
            <Bell size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500">Stay updated on your booking status</p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            disabled={actionLoading}
            className="text-xs font-bold text-red-600 hover:text-red-700 disabled:opacity-50 flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-full transition-colors"
          >
            {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            Mark all as read
          </button>
        )}
      </div>

      <div className="card max-w-2xl mx-auto divide-y divide-gray-50">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="font-medium">Loading alerts…</p>
          </div>
        ) : notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
              <Bell size={32} className="opacity-20" />
            </div>
            <div>
              <p className="font-black text-gray-600 text-lg">All caught up!</p>
              <p className="text-sm">You have no notifications yet.</p>
            </div>
          </div>
        ) : (
          notifs.map((n) => (
            <div 
              key={n.id} 
              onMouseEnter={() => !n.is_read && markAsRead(n.id)}
              className={`p-4 md:p-5 flex gap-4 transition-colors ${!n.is_read ? 'bg-red-50/30' : 'hover:bg-gray-50'}`}
            >
              <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${!n.is_read ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                {getIcon(n.event)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className={`text-sm font-bold truncate ${!n.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                    {n.title}
                  </h3>
                  <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap">
                    {timeAgo(n.created_at)}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed ${!n.is_read ? 'text-gray-700' : 'text-gray-500'}`}>
                  {n.body}
                </p>
              </div>
              {!n.is_read && (
                <div className="flex-shrink-0 mt-1.5 flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

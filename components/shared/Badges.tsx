import { AlertCircle, Calendar, Building2, Navigation, Zap } from 'lucide-react'
import { statusColor, statusLabel, typeColor } from '@/lib/utils'
import type { BookingStatus, BookingType } from '@/lib/types'

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`badge ${statusColor(status)}`}>
      {statusLabel(status)}
    </span>
  )
}

export function TypeBadge({ type }: { type: BookingType }) {
  const configs: Record<BookingType, { label: string, icon: any }> = {
    emergency:     { label: 'Emergency',     icon: AlertCircle },
    scheduled:     { label: 'Scheduled',     icon: Calendar },
    institutional: { label: 'Institutional', icon: Building2 },
    highway:       { label: 'Highway',       icon: Navigation },
  }
  const { label, icon: Icon } = configs[type] || { label: type, icon: AlertCircle }

  return (
    <span className={`badge ${typeColor(type)} inline-flex items-center gap-1`}>
      <Icon size={12} />
      {label}
    </span>
  )
}

export function PriorityBadge({ isPriority }: { isPriority: boolean }) {
  if (!isPriority) return null
  return (
    <span className="badge bg-red-600 text-white inline-flex items-center gap-1">
      <Zap size={12} />
      Priority
    </span>
  )
}

// ── Haversine distance (km) ────────────────────────────────
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R   = 6371
  const dLat = deg2rad(lat2 - lat1)
  const dLng = deg2rad(lng2 - lng1)
  const a   = Math.sin(dLat / 2) ** 2
    + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2))
    * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function deg2rad(d: number) { return d * (Math.PI / 180) }

// ── Booking ref generator ──────────────────────────────────
export function generateBookingRef(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const seq  = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')
  return `AMB-${date}-${seq}`
}

// ── Status label colours ───────────────────────────────────
export function statusColor(status: string): string {
  const map: Record<string, string> = {
    requested:   'bg-yellow-100 text-yellow-800',
    assigned:    'bg-blue-100 text-blue-800',
    en_route:    'bg-indigo-100 text-indigo-800',
    at_scene:    'bg-purple-100 text-purple-800',
    transporting:'bg-orange-100 text-orange-800',
    completed:   'bg-green-100 text-green-800',
    cancelled:   'bg-gray-100 text-gray-600',
    expired:     'bg-red-100 text-red-800',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    requested:   'Requested',
    assigned:    'Assigned',
    en_route:    'En Route',
    at_scene:    'At Scene',
    transporting:'Transporting',
    completed:   'Completed',
    cancelled:   'Cancelled',
    expired:     'Expired',
  }
  return map[status] ?? status
}

// ── Format currency (UGX) ─────────────────────────────────
export function formatUGX(amount?: number | null): string {
  if (amount == null) return '—'
  return `UGX ${amount.toLocaleString()}`
}

// ── Format relative time ──────────────────────────────────
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs  < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// ── Booking type badge ────────────────────────────────────
export function typeColor(type: string): string {
  const map: Record<string, string> = {
    emergency:     'bg-red-100 text-red-700',
    scheduled:     'bg-blue-100 text-blue-700',
    institutional: 'bg-purple-100 text-purple-700',
    highway:       'bg-orange-100 text-orange-700',
  }
  return map[type] ?? 'bg-gray-100 text-gray-600'
}

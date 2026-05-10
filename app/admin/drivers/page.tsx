'use client'
import { useState, useEffect } from 'react'
import { Loader2, CheckCircle, XCircle, Search, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface DriverRow {
  id: number; user_id: number; license_number: string; vehicle_plate: string
  vehicle_type: string; vehicle_model: string; coverage_zone: string
  status: string; is_online: boolean; total_trips: number; average_rating: number
  user: { first_name: string; last_name: string; phone: string; email: string }
}

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<DriverRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('drivers')
      .select('*, user:users!user_id(*)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('FETCH_DRIVERS_ERROR:', error)
      toast.error('Failed to load drivers: ' + error.message)
    }
    
    setDrivers((data as DriverRow[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateStatus(driverId: number, status: string) {
    const { error } = await supabase.from('drivers').update({ status }).eq('id', driverId)
    if (error) { toast.error('Failed to update'); return }
    toast.success(`Driver ${status}`)
    load()
  }

  const filtered = drivers.filter(d => {
    if (!search) return true
    const name = d.user ? `${d.user.first_name} ${d.user.last_name}` : 'Unknown'
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      d.vehicle_plate.toLowerCase().includes(search.toLowerCase()) ||
      d.license_number.toLowerCase().includes(search.toLowerCase())
    )
  })

  const statusStyle: Record<string, string> = {
    active:     'bg-green-100 text-green-700',
    pending:    'bg-yellow-100 text-yellow-700',
    suspended:  'bg-red-100 text-red-700',
    deactivated:'bg-gray-100 text-gray-500',
  }

  return (
    <div className="flex-1 p-4 md:p-6 space-y-5 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Drivers</h1>
        <span className="text-sm text-gray-500 hidden sm:inline">{drivers.length} registered</span>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Search by name, plate, or licence…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-gray-400" /></div>
      ) : (
        <div className="card p-0 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Driver','Plate / Type','Zone','Trips','Rating','Status','Online','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xs font-bold">
                          {d.user?.first_name?.[0] ?? '?'}{d.user?.last_name?.[0] ?? 'D'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{d.user?.first_name ?? 'Unknown'} {d.user?.last_name ?? 'Driver'}</p>
                          <p className="text-xs text-gray-400">{d.user?.phone ?? d.license_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-bold">{d.vehicle_plate}</p>
                      <p className="text-xs text-gray-500 capitalize">{d.vehicle_type} · {d.vehicle_model}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{d.coverage_zone || '—'}</td>
                    <td className="px-4 py-3 font-bold text-center">{d.total_trips}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-yellow-600 font-semibold">
                        ⭐ {d.average_rating?.toFixed(1) ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${statusStyle[d.status] ?? 'bg-gray-100'}`}>{d.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${d.is_online ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {d.status !== 'active' && (
                          <button onClick={() => updateStatus(d.id, 'active')} title="Activate"
                            className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100">
                            <CheckCircle size={14} />
                          </button>
                        )}
                        {d.status === 'active' && (
                          <button onClick={() => updateStatus(d.id, 'suspended')} title="Suspend"
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet List */}
          <div className="lg:hidden divide-y divide-gray-100">
            {filtered.map(d => (
              <div key={d.id} className="p-4 space-y-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-black text-sm">
                      {d.user?.first_name?.[0] ?? '?'}{d.user?.last_name?.[0] ?? 'D'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{d.user?.first_name ?? 'Unknown'} {d.user?.last_name ?? 'Driver'}</p>
                      <p className="text-xs text-gray-500">{d.user?.phone ?? d.license_number}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className={`w-3 h-3 rounded-full ${d.is_online ? 'bg-green-500 animate-pulse' : 'bg-gray-300'} border-2 border-white ring-1 ring-gray-100`} />
                    <span className={`badge text-[10px] py-0.5 ${statusStyle[d.status] ?? 'bg-gray-100'}`}>{d.status}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                  <div>
                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Vehicle</p>
                    <p className="font-mono text-xs font-bold text-gray-700 mt-0.5">{d.vehicle_plate}</p>
                    <p className="text-[10px] text-gray-500 capitalize">{d.vehicle_type}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Rating / Trips</p>
                    <p className="text-xs font-bold text-yellow-600 mt-0.5">⭐ {d.average_rating?.toFixed(1) ?? '—'}</p>
                    <p className="text-[10px] text-gray-500">{d.total_trips} trips</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="font-medium">Zone:</span>
                    <span className="truncate">{d.coverage_zone || 'Global'}</span>
                  </div>
                  <div className="flex gap-2">
                    {d.status !== 'active' && (
                      <button onClick={() => updateStatus(d.id, 'active')}
                        className="btn-primary text-[10px] py-1 px-3 bg-green-600 hover:bg-green-700">
                        Activate
                      </button>
                    )}
                    {d.status === 'active' && (
                      <button onClick={() => updateStatus(d.id, 'suspended')}
                        className="btn-secondary text-[10px] py-1 px-3 text-red-600 hover:bg-red-50">
                        Suspend
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

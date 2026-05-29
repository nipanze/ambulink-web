'use client'
import { useState, useEffect } from 'react'
import { Loader2, Search, CheckCircle, XCircle, Shield, ShieldOff, ShieldCheck, Car, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { timeAgo } from '@/lib/utils'

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('drivers')
      .select('*, user:users!user_id(first_name, last_name, phone, email, is_active)')
      .order('created_at', { ascending: false })
    
    if (error) {
      toast.error('Failed to load drivers: ' + error.message)
    } else {
      setDrivers(data || [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = drivers.filter(d => 
    !search || 
    (d.user?.first_name + ' ' + d.user?.last_name).toLowerCase().includes(search.toLowerCase()) ||
    (d.user?.phone || '').includes(search) ||
    d.vehicle_plate.toLowerCase().includes(search.toLowerCase())
  )

  async function updateStatus(id: number, status: string) {
    const { error } = await supabase.from('drivers').update({ status }).eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success(`Driver marked as ${status}`)
      load()
    }
  }

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Fleet Management</h1>
          <p className="text-sm text-gray-500">Manage ambulance drivers and vehicle assignments.</p>
        </div>
        <div className="relative w-full md:w-64">
           <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
           <input 
             value={search} onChange={e => setSearch(e.target.value)}
             placeholder="Search by name, phone or plate..." 
             className="input pl-9 w-full"
           />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
         <div className="card text-center p-4 py-6">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Total Drivers</p>
            <p className="text-3xl font-black text-blue-600">{drivers.length}</p>
         </div>
         <div className="card text-center p-4 py-6">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Active</p>
            <p className="text-3xl font-black text-green-600">{drivers.filter(d => d.status === 'active').length}</p>
         </div>
         <div className="card text-center p-4 py-6">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Pending Review</p>
            <p className="text-3xl font-black text-amber-500">{drivers.filter(d => d.status === 'pending').length}</p>
         </div>
         <div className="card text-center p-4 py-6">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Suspended</p>
            <p className="text-3xl font-black text-red-600">{drivers.filter(d => d.status === 'suspended').length}</p>
         </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400"><Loader2 className="animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-gray-400">No driver records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold">
                <tr>
                  <th className="px-4 py-4">Driver Profile</th>
                  <th className="px-4 py-4">Vehicle Details</th>
                  <th className="px-4 py-4">Stats</th>
                  <th className="px-4 py-4">Status & Online</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {filtered.map(d => (
                   <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-4">
                         <p className="font-black text-gray-900">{d.user?.first_name} {d.user?.last_name}</p>
                         <p className="text-gray-500 text-xs">{d.user?.phone}</p>
                         <p className="text-gray-400 text-xs mt-0.5">{d.license_number}</p>
                      </td>
                      <td className="px-4 py-4">
                         <div className="flex items-center gap-2">
                           <div className="bg-gray-100 p-2 rounded-lg text-gray-500"><Car size={16} /></div>
                           <div>
                             <p className="font-mono font-bold text-gray-800 tracking-tight">{d.vehicle_plate}</p>
                             <p className="text-xs text-gray-500 uppercase">{d.vehicle_type}</p>
                           </div>
                         </div>
                      </td>
                      <td className="px-4 py-4">
                         <p className="text-sm font-black text-gray-800 flex items-center gap-1"><Star size={14} className="text-amber-500" /> {Number(d.average_rating).toFixed(1)}</p>
                         <p className="text-xs text-gray-500 mt-1">{d.total_trips} matched trips</p>
                      </td>
                      <td className="px-4 py-4">
                         <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-lg ${d.status === 'active' ? 'bg-green-100 text-green-700' : d.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                               {d.status}
                            </span>
                            {d.is_online ? <span className="flex items-center gap-1 text-xs text-green-600 font-bold"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> ONLINE</span> : <span className="text-xs text-gray-400 font-semibold">OFFLINE</span>}
                         </div>
                      </td>
                      <td className="px-4 py-4 w-40 text-right">
                         <div className="flex items-center justify-end gap-2">
                            {d.status !== 'active' && (
                              <button onClick={() => updateStatus(d.id, 'active')} className="p-2 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition-colors tooltip" aria-label="Approve">
                                 <ShieldCheck size={18} />
                              </button>
                            )}
                            {d.status === 'active' && (
                              <button onClick={() => updateStatus(d.id, 'suspended')} className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors tooltip" aria-label="Suspend">
                                 <ShieldOff size={18} />
                              </button>
                            )}
                         </div>
                      </td>
                   </tr>
                 ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

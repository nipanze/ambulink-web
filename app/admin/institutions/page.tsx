'use client'
import { useState, useEffect } from 'react'
import { Loader2, CheckCircle, XCircle, Building2, Phone, Mail, Globe, MapPin, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Institution } from '@/lib/types'

export default function AdminInstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'active' | 'suspended' | 'rejected' | 'all'>('pending')
  const [search, setSearch] = useState('')

  async function load() {
    let q = supabase.from('institutions').select('*').is('deleted_at', null).order('created_at', { ascending: false })
    if (tab !== 'all') q = q.eq('status', tab)
    const { data } = await q
    setInstitutions(data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [tab])

  const filtered = institutions.filter(i => 
    !search || 
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.contact_phone || '').includes(search) ||
    (i.contact_email || '').toLowerCase().includes(search.toLowerCase())
  )

  async function updateStatus(id: number, status: string) {
    const { error } = await supabase.from('institutions').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id)
    if (error) { toast.error('Failed to update status'); return }
    toast.success(`Institution marked as ${status}`)
    load()
  }

  const statusStyle: Record<string, string> = {
    active:   'bg-green-100 text-green-700',
    pending:  'bg-yellow-100 text-yellow-700',
    rejected: 'bg-red-100 text-red-700',
    suspended:'bg-gray-100 text-gray-500',
  }

  return (
    <div className="flex-1 p-4 md:p-6 space-y-5 overflow-y-auto">
      <h1 className="text-2xl font-black text-gray-900">Institutions</h1>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          {(['pending','active','suspended','rejected','all'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap
                ${tab === t ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
           <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
           <input 
             value={search} onChange={e => setSearch(e.target.value)}
             placeholder="Search name, phone or email..." 
             className="input pl-9 w-full"
           />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-gray-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <Building2 size={36} className="mx-auto mb-3 opacity-30" />
          <p>No {tab === 'all' ? '' : tab} institutions found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(i => (
            <div key={i.id} className={`card flex flex-col sm:flex-row items-start gap-4 ${i.status === 'pending' ? 'border-yellow-200 bg-yellow-50/30' : ''}`}>
              <div className="p-3 bg-gray-50 rounded-xl text-gray-400 group-hover:text-red-600 transition-colors">
                <Building2 size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-gray-900">{i.name}</h3>
                  <span className={`badge text-[10px] py-0.5 ${statusStyle[i.status]}`}>{i.status}</span>
                  <span className="badge text-[10px] py-0.5 bg-gray-100 text-gray-500 capitalize">{i.type}</span>
                </div>
                
                <div className="flex items-start gap-2 text-sm text-gray-500 mt-1.5">
                  <MapPin size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
                  <span>{i.address}</span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-xs text-gray-400">
                  {i.contact_phone && (
                     <div className="flex items-center gap-1.5">
                       <Phone size={12} className="text-gray-300" />
                       <span>{i.contact_phone}</span>
                     </div>
                  )}
                  {i.contact_email && (
                     <div className="flex items-center gap-1.5" title={i.contact_email}>
                       <Mail size={12} className="text-gray-300" />
                       <span className="truncate max-w-[120px]">{i.contact_email}</span>
                     </div>
                  )}
                  {i.website && (
                     <a href={i.website} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-blue-500 hover:underline">
                       <Globe size={12} />
                       <span className="truncate max-w-[100px]">Website</span>
                     </a>
                  )}
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto pt-2 sm:pt-0">
                {i.status === 'pending' && (
                  <>
                    <button onClick={() => updateStatus(i.id, 'active')} className="btn-primary flex-1 sm:flex-none text-xs py-1.5 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700">
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button onClick={() => updateStatus(i.id, 'rejected')} className="btn-secondary flex-1 sm:flex-none text-xs py-1.5 flex items-center justify-center gap-1.5 text-red-600 border-red-100 hover:bg-red-50">
                      <XCircle size={14} /> Reject
                    </button>
                  </>
                )}
                {i.status === 'active' && (
                  <button onClick={() => updateStatus(i.id, 'suspended')} className="btn-secondary flex-1 sm:flex-none text-xs py-1.5 flex items-center justify-center gap-1.5 text-red-600 border-red-100 hover:bg-red-50">
                    <XCircle size={14} /> Suspend
                  </button>
                )}
                {i.status === 'suspended' && (
                  <button onClick={() => updateStatus(i.id, 'active')} className="btn-primary flex-1 sm:flex-none text-xs py-1.5 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700">
                    <CheckCircle size={14} /> Reactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { User, Shield, Bell, Loader2, Save, Phone, Mail, Fingerprint } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: ''
  })

  useEffect(() => {
    async function fetchProfile() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          email: data.email || ''
        })
      }
      setLoading(false)
    }
    fetchProfile()
  }, [])

  async function handleSave() {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone
        })
      })
      if (!res.ok) throw new Error('Failed to update profile')
      toast.success('Profile updated successfully')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 md:p-6 space-y-8 overflow-y-auto bg-gray-50/50">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Manage your profile and account preferences</p>
        </div>

        {/* Profile Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-gray-900 border-b border-gray-200 pb-2">
            <User size={18} className="text-red-600" />
            <h2 className="font-bold">Personal Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">First Name</label>
              <input 
                className="input bg-white" 
                value={form.first_name}
                onChange={e => setForm({...form, first_name: e.target.value})}
                placeholder="e.g. Joshua" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Last Name</label>
              <input 
                className="input bg-white" 
                value={form.last_name}
                onChange={e => setForm({...form, last_name: e.target.value})}
                placeholder="e.g. Mukisa" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                  className="input bg-white pl-9" 
                  value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                  placeholder="+256 700 000 000" 
                />
              </div>
            </div>
            <div className="space-y-1 opacity-60">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input className="input bg-gray-100 cursor-not-allowed pl-9" value={form.email} readOnly />
              </div>
              <p className="text-[10px] text-gray-400 mt-1 italic">Email cannot be changed for security reasons</p>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-2 px-6"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Changes
            </button>
          </div>
        </section>

        {/* Security Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-gray-900 border-b border-gray-200 pb-2">
            <Shield size={18} className="text-red-600" />
            <h2 className="font-bold">Security</h2>
          </div>
          <div className="card flex items-center justify-between p-4 bg-white">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                <Fingerprint size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Change Password</p>
                <p className="text-xs text-gray-500">Regularly updating your password keeps your account secure</p>
              </div>
            </div>
            <button className="text-xs font-bold text-red-600 hover:underline">Update</button>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-gray-900 border-b border-gray-200 pb-2">
            <Bell size={18} className="text-red-600" />
            <h2 className="font-bold">Preferences</h2>
          </div>
          <div className="card space-y-4 p-4 bg-white">
            {[
              { label: 'Booking Updates', desc: 'Get notified when a driver is assigned or arrives.' },
              { label: 'Promotional Alerts', desc: 'Receive updates on new features and discounts.' }
            ].map((p, i) => (
              <div key={p.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">{p.label}</p>
                  <p className="text-xs text-gray-500">{p.desc}</p>
                </div>
                <div className="w-10 h-5 bg-red-600 rounded-full relative cursor-pointer">
                  <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Loader2, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { UserRole } from '@/lib/types'

function RegisterForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const defaultRole  = (searchParams.get('role') || 'patient') as UserRole

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '',
    phone: '', password: '', confirm: '', role: defaultRole,
  })
  const [loading, setLoading] = useState(false)

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return }

    setLoading(true)
    try {
      const { error: authErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { first_name: form.first_name, last_name: form.last_name, phone: form.phone, role: form.role } }
      })
      if (authErr) throw authErr

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email, first_name: form.first_name,
          last_name: form.last_name, phone: form.phone,
          role: form.role,
        }),
      })
      if (!res.ok) throw new Error(await res.text())

      toast.success('Account created! Please check your email to verify.')
      router.push('/auth/login')
    } catch (err: any) {
      toast.error(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <Image src="/images/icon.png" alt="AmbuLink Logo" width={40} height={40} />
          </div>
          <h1 className="text-2xl font-black text-red-600">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join AmbuLink today</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
              <input className="input" value={form.first_name} onChange={e => update('first_name', e.target.value)} required placeholder="Joshua" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
              <input className="input" value={form.last_name} onChange={e => update('last_name', e.target.value)} required placeholder="Mukisa" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
            <input className="input" value={form.phone} onChange={e => update('phone', e.target.value)} required placeholder="+256780300001" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
            <input type="email" className="input" value={form.email} onChange={e => update('email', e.target.value)} required placeholder="you@example.com" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">I am registering as</label>
            <select className="input" value={form.role} onChange={e => update('role', e.target.value)}>
              <option value="patient">Patient / Public User</option>
              <option value="driver">Ambulance Driver</option>
              <option value="institution_rep">Institution Representative</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
            <input type="password" className="input" value={form.password} onChange={e => update('password', e.target.value)} required minLength={8} placeholder="Min. 8 characters" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
            <input type="password" className="input" value={form.confirm} onChange={e => update('confirm', e.target.value)} required placeholder="Repeat password" />
          </div>

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 mt-2" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-red-600 font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
       <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={32} className="animate-spin text-red-600" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}

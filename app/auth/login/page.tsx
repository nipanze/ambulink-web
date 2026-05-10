'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirect     = searchParams.get('redirect') || '/dashboard'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const normalizedEmail = email.trim().toLowerCase()
      const { data: { session }, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
      if (error) throw error

      // Call API to get user and trigger any necessary auto-provisioning
      const res = await fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
      
      const dbUser = await res.json()
      if (!res.ok) {
        throw new Error(dbUser.error || 'Profile synchronization failed.')
      }

      let finalRedirect = redirect
      if (redirect === '/dashboard' || !searchParams.has('redirect')) {
        if (dbUser.role === 'admin')           finalRedirect = '/admin'
        else if (dbUser.role === 'driver')     finalRedirect = '/driver'
        else if (dbUser.role === 'institution_rep') finalRedirect = '/institution'
      }

      toast.success(`Welcome back, ${dbUser.first_name}!`)
      router.push(finalRedirect)
    } catch (err: any) {
      const message = err.message === 'Invalid login credentials'
        ? 'Invalid login credentials. Use the full demo email, for example driver.ssali@ambulink.ug, and make sure demo Auth users are seeded.'
        : err.message || 'Login failed. Please check your credentials.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Image src="/images/icon.png" alt="AmbuLink Logo" width={48} height={48} />
          </div>
          <h1 className="text-3xl font-black text-red-600">AmbuLink</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className="input pr-10"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPw(v => !v)}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base font-bold shadow-xl shadow-red-100"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-[10px] space-y-1">
           <p className="text-yellow-800 font-bold uppercase tracking-widest">Demo Accounts:</p>
           <p className="text-yellow-700">Admin: admin@ambulink.ug / ambulink@2026</p>
           <p className="text-yellow-700">Driver: driver.ssali@ambulink.ug / ambulink@2026</p>
           <p className="text-yellow-700">Driver: driver.tendo@ambulink.ug / ambulink@2026</p>
           <p className="text-yellow-700">Patient: patient.mukisa@ambulink.ug / ambulink@2026</p>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          Don't have an account? <Link href="/auth/register" className="text-red-600 font-bold hover:underline">Register</Link>
        </p>

        <div className="text-center mt-4">
           <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">← Back to home</Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-red-600" /></div>}>
      <LoginForm />
    </Suspense>
  )
}

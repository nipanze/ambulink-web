import { supabase } from './supabase'
import type { CurrentUser } from './types'

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession()
  if (!session) return null

  const { data, error } = await supabase
    .from('users')
    .select('*, patient_profile:patients(*), driver_profile:drivers(*), rep_profile:institution_reps(*, institution:institutions(*))')
    .eq('email', session.user.email)
    .single()

  if (error) throw error
  return data as CurrentUser
}

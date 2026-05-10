import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Public client (safe for components)
export const supabase = supabaseUrl && supabaseAnon 
  ? createClient(supabaseUrl, supabaseAnon) 
  : null as any

/**
 * Server-side client with service role (use only in API routes)
 * This avoids top-level execution errors during build.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("SERVER ERROR: SUPABASE_SERVICE_ROLE_KEY is missing. Please add it to your Vercel Environment Variables and redeploy.")
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

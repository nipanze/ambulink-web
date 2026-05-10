import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function missingSupabaseMessage() {
  return 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local or your cloud environment.'
}

// Public client (safe for components)
export const supabase = supabaseUrl && supabaseAnon
  ? createClient(supabaseUrl, supabaseAnon)
  : new Proxy({} as ReturnType<typeof createClient>, {
      get() {
        throw new Error(missingSupabaseMessage())
      },
    })

/**
 * Server-side client with service role (use only in API routes)
 * This avoids top-level execution errors during build.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("SERVER ERROR: Supabase server credentials are missing. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your environment and redeploy.")
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body    = await req.json()
    const supabase = createServiceClient()

    const { data, error } = await supabase.from('users').upsert({
      email:      body.email,
      password_hash: 'managed_by_supabase_auth',
      first_name: body.first_name,
      last_name:  body.last_name,
      phone:      body.phone,
      role:       body.role ?? 'patient',
    }, { onConflict: 'email' }).select().single()

    if (error) throw error
    return NextResponse.json({ success: true, user: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

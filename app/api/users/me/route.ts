import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient()

    // Get authenticated user
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get DB user
    let { data: dbUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single()

    if ((error || !dbUser) && user.email?.endsWith('@ambulink.ug')) {
      // SERVER-SIDE HEAL: Provision missing admin
      const { data: created, error: createErr } = await supabase
        .from('users')
        .insert({
          email: user.email,
          password_hash: 'managed_by_auth',
          first_name: user.user_metadata?.first_name || 'Official',
          last_name:  user.user_metadata?.last_name || 'Admin',
          phone:      user.user_metadata?.phone || '+256700000001',
          role:       'admin'
        })
        .select()
        .single()
      
      if (createErr) throw createErr
      dbUser = created
    }

    if (!dbUser) return NextResponse.json({ error: 'User profile not found' }, { status: 404 })

    return NextResponse.json(dbUser)
  } catch (err: any) {
    console.error('GET /api/users/me:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createServiceClient()
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { first_name, last_name, phone } = body

    const { data, error } = await supabase
      .from('users')
      .update({ first_name, last_name, phone })
      .eq('email', user.email)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('PATCH /api/users/me:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

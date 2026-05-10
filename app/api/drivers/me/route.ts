import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

async function getAuthedDriver(req: NextRequest) {
  const supabase = createServiceClient()
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return { supabase, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user?.email) {
    return { supabase, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: dbUser, error: userErr } = await supabase
    .from('users')
    .select('id, role')
    .eq('email', user.email)
    .single()

  if (userErr || !dbUser) {
    return { supabase, response: NextResponse.json({ error: 'User not found' }, { status: 404 }) }
  }

  if (dbUser.role !== 'driver') {
    return { supabase, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  const { data: driver, error: driverErr } = await supabase
    .from('drivers')
    .select('*, user:users(*), location:driver_locations(*)')
    .eq('user_id', dbUser.id)
    .single()

  if (driverErr || !driver) {
    return { supabase, response: NextResponse.json({ error: 'Driver profile not found' }, { status: 404 }) }
  }

  return { supabase, user: dbUser, driver }
}

export async function GET(req: NextRequest) {
  try {
    const result = await getAuthedDriver(req)
    if ('response' in result) return result.response

    const { data: bookings, error } = await result.supabase
      .from('bookings')
      .select('*, patient:patients!patient_id(*, user:users!user_id(*))')
      .eq('driver_id', result.driver.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ driver: result.driver, bookings: bookings ?? [] })
  } catch (err: any) {
    console.error('GET /api/drivers/me:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const result = await getAuthedDriver(req)
    if ('response' in result) return result.response

    const body = await req.json()

    if (typeof body.is_online === 'boolean') {
      const { error } = await result.supabase
        .from('drivers')
        .update({ is_online: body.is_online })
        .eq('id', result.driver.id)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (body.location) {
      const { error } = await result.supabase
        .from('driver_locations')
        .upsert({
          driver_id: result.driver.id,
          latitude: body.location.latitude,
          longitude: body.location.longitude,
          heading: body.location.heading ?? 0,
          speed_kmh: body.location.speed_kmh ?? 0,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'driver_id' })
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (body.booking_id && body.status) {
      const { error } = await result.supabase
        .from('bookings')
        .update({ status: body.status, updated_at: new Date().toISOString() })
        .eq('id', body.booking_id)
        .eq('driver_id', result.driver.id)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'No supported update supplied' }, { status: 400 })
  } catch (err: any) {
    console.error('PATCH /api/drivers/me:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

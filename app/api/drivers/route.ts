import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)

  const online = searchParams.get('online')

  const query = online === '1'
    ? supabase.from('vw_online_drivers').select('*')
    : supabase
        .from('drivers')
        .select('*, user:users!user_id(*), location:driver_locations(*)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

// Update driver location (called from driver app)
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body     = await req.json()

    const { error } = await supabase
      .from('driver_locations')
      .upsert({
        driver_id:  body.driver_id,
        latitude:   body.latitude,
        longitude:  body.longitude,
        heading:    body.heading,
        speed_kmh:  body.speed_kmh,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'driver_id' })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

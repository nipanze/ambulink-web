import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = createServiceClient()

    // Get authenticated user
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get DB user and the patient profile id used by bookings.patient_id.
    const { data: dbUser } = await supabase
      .from('users')
      .select('id, role, patient_profile:patients(id)')
      .eq('email', user.email)
      .single()
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const dbUserRecord = dbUser as {
      id: number
      patient_profile?: { id: number } | { id: number }[] | null
    }
    let patientId = Array.isArray(dbUserRecord.patient_profile)
      ? dbUserRecord.patient_profile[0]?.id
      : dbUserRecord.patient_profile?.id

    if (!patientId) {
      const { data: patient, error: patientErr } = await supabase
        .from('patients')
        .upsert({ user_id: dbUserRecord.id }, { onConflict: 'user_id' })
        .select('id')
        .single()

      if (patientErr) throw patientErr
      patientId = patient.id
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        booking_ref:         body.booking_ref ?? null,
        patient_id:          patientId,
        type:                body.type ?? 'emergency',
        status:              'requested',
        pickup_latitude:     body.pickup_latitude,
        pickup_longitude:    body.pickup_longitude,
        pickup_address:      body.pickup_address,
        pickup_landmark:     body.pickup_landmark,
        destination_name:    body.destination_name,
        destination_latitude: body.destination_latitude,
        destination_longitude:body.destination_longitude,
        destination_address: body.destination_address,
        scheduled_at:        body.scheduled_at,
        patient_notes:       body.patient_notes,
        road_corridor:       body.road_corridor,
        highway_landmark:    body.highway_landmark,
        institution_id:      body.institution_id,
        is_priority:         body.is_priority ?? false,
      })
      .select()
      .single()

    if (error) throw error

    // Try to auto-assign nearest driver
    const { data: nearestDriver } = await supabase
      .rpc('sp_find_nearest_driver', {
        p_lat:    body.pickup_latitude,
        p_lng:    body.pickup_longitude,
        p_max_km: 50,
      })

    if (nearestDriver && nearestDriver.length > 0) {
      await supabase
        .from('bookings')
        .update({ driver_id: nearestDriver[0].driver_id, status: 'assigned', assigned_at: new Date().toISOString() })
        .eq('id', booking.id)
    }

    return NextResponse.json({ success: true, booking })
  } catch (err: any) {
    console.error('POST /api/bookings:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(req.url)

    let query = supabase
      .from('vw_booking_overview')
      .select('*')
      .order('created_at', { ascending: false })

    const status = searchParams.get('status')
    if (status) query = query.eq('status', status)

    const limit = parseInt(searchParams.get('limit') ?? '50')
    query = query.limit(limit)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

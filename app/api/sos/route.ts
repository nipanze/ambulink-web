import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = createServiceClient()

    // 1. Ensure Guest User exists (email: guest@ambulink.ug)
    // We try to find it first.
    let { data: guestUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'guest@ambulink.ug')
      .single()

    if (!guestUser) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: 'guest@ambulink.ug',
          first_name: 'System',
          last_name: 'Guest',
          role: 'patient',
          phone: '+0000000000', // Differentiator for guest
          is_active: true
        })
        .select('id')
        .single()
      
      if (createError) throw createError
      guestUser = newUser
    }

    // 2. Ensure Patient Profile exists for this guest user
    // The trigger trg_create_patient_profile should handle this, 
    // but let's double check to be safe.
    let { data: guestPatient } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', guestUser.id)
      .single()

    if (!guestPatient) {
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert({ user_id: guestUser.id })
        .select('id')
        .single()
      
      if (patientError) throw patientError
      guestPatient = newPatient
    }

    // 3. Create the emergency booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        patient_id:          guestPatient.id,
        type:                body.type || 'emergency',
        status:              'requested',
        pickup_latitude:     body.latitude,
        pickup_longitude:    body.longitude,
        pickup_address:      body.address || 'SOS Anonymous Location',
        is_priority:         true,
        fare_amount:         50000 // Standard emergency rate
      })
      .select()
      .single()

    if (bookingError) throw bookingError

    // 4. Trigger auto-assignment (nearest driver)
    const { data: nearestDriver } = await supabase
      .rpc('sp_find_nearest_driver', {
        p_lat:    body.latitude,
        p_lng:    body.longitude,
        p_max_km: 50,
      })

    if (nearestDriver && nearestDriver.length > 0) {
      await supabase
        .from('bookings')
        .update({ 
          driver_id: nearestDriver[0].driver_id, 
          status: 'assigned', 
          assigned_at: new Date().toISOString() 
        })
        .eq('id', booking.id)
    }

    return NextResponse.json({ 
      success: true, 
      bookingId: booking.id,
      bookingRef: booking.booking_ref,
      message: nearestDriver?.length > 0 ? 'Ambulance assigned and en route.' : 'Finding nearest ambulance...'
    })

  } catch (err: any) {
    console.error('POST /api/sos error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

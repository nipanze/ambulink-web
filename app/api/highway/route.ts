import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = createServiceClient()

    // 1. Get Guest User/Patient
    let { data: guestUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'guest@ambulink.ug')
      .single()

    if (!guestUser) {
        // Should exist from SOS, but fallback just in case
        return NextResponse.json({ error: 'Guest system profile not found. Submit an SOS first to initialize.' }, { status: 500 })
    }

    let { data: guestPatient } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', guestUser.id)
      .single()

    if (!guestPatient) {
        return NextResponse.json({ error: 'Guest patient profile not found.' }, { status: 500 })
    }

    // 2. Create Highway Booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        patient_id:          guestPatient.id,
        type:                'highway',
        status:              'requested',
        pickup_latitude:     body.latitude || 0, // Fallback if no GPS provided
        pickup_longitude:    body.longitude || 0,
        pickup_address:      body.address || 'Unknown Highway Location',
        patient_notes:       `Incident Type: ${body.incidentType} | Casualties: ${body.casualties} | Reporter: ${body.reporterName || 'Anonymous'} | Details: ${body.description}`,
        is_priority:         true,
        fare_amount:         100000, // Standard highway rate
        road_corridor:       body.corridor
      })
      .select()
      .single()

    if (bookingError) throw bookingError

    // 3. Admin Notification 
    // We insert a notification for the first admin (user_id = 1)
    await supabase.from('notifications').insert({
        user_id: 1,
        event: 'admin_alert',
        title: 'New Highway Incident Reported',
        body: `A new highway accident has been reported at ${body.address || 'an unknown location'}.`,
        related_booking_id: booking.id
    });

    // 4. Auto-assign logic (optional for highway, but we can try)
    if (body.latitude && body.longitude) {
        const { data: nearestDriver } = await supabase
          .rpc('sp_find_nearest_driver', {
            p_lat:    body.latitude,
            p_lng:    body.longitude,
            p_max_km: 100, // wider radius for highway
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
    }

    return NextResponse.json({ 
      success: true, 
      bookingId: booking.id,
      bookingRef: booking.booking_ref,
      message: 'Highway incident reported successfully. Dispatch notified.'
    })

  } catch (err: any) {
    console.error('POST /api/highway error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

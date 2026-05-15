import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { bookingId, method, phone } = await req.json()

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 })
    }

    // Simulate a network delay for the payment gateway
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Update the booking status in the database
    const { data, error } = await supabase
      .from('bookings')
      .update({ 
        payment_status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      message: `Payment of via ${method} successful for ${phone}` 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

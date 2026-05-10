import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let query = supabase.from('institutions').select('*').is('deleted_at', null).order('name')
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body     = await req.json()

    const { data, error } = await supabase
      .from('institutions')
      .insert({
        name:          body.name,
        type:          body.type,
        address:       body.address,
        latitude:      body.latitude,
        longitude:     body.longitude,
        contact_phone: body.contact_phone,
        contact_email: body.contact_email,
        website:       body.website,
        status:        'pending',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, institution: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

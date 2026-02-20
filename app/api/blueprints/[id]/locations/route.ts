import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/blueprints/[id]/locations
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('blueprint_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/blueprints/[id]/locations — upsert a single location
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: blueprint_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const loc = await req.json()

  const { data, error } = await supabase
    .from('locations')
    .upsert({
      id: loc.id,
      blueprint_id,
      name: loc.name,
      // PostGIS geometry point
      coordinates: `POINT(${loc.coordinates.lng} ${loc.coordinates.lat})`,
      category: loc.category ?? [],
      notes: loc.notes ?? '',
      source_type: loc.source?.type ?? 'self',
      source_name: loc.source?.source_name ?? null,
      source_url: loc.source?.source_url ?? null,
      confidence: loc.source?.confidence ?? null,
      enrichment: loc.enrichment ?? {},
    }, { onConflict: 'id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// DELETE /api/blueprints/[id]/locations?location_id=xxx
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: blueprint_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const location_id = searchParams.get('location_id')
  if (!location_id) return NextResponse.json({ error: 'location_id required' }, { status: 400 })

  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', location_id)
    .eq('blueprint_id', blueprint_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/blueprints — list all blueprints for the authenticated user
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('blueprints')
    .select('*')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/blueprints — create a new blueprint
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { story_intent = 'discovery', bounding_context = {}, metadata = {} } = body

  const { data, error } = await supabase
    .from('blueprints')
    .insert({
      owner_id: user.id,
      story_intent,
      bounding_context,
      metadata: { is_public: false, tags: [], ...metadata },
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

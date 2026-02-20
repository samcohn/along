import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

// GET /api/blueprints/[id]
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('blueprints')
    .select('*, locations(*), artifacts(*)')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json(data)
}

// PATCH /api/blueprints/[id]
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  // Only update known schema columns — artifact_type merges into metadata JSONB
  const { artifact_type, metadata, story_intent, bounding_context, title } = body

  // First fetch existing metadata so we can merge, not overwrite
  const { data: existing } = await supabase
    .from('blueprints')
    .select('metadata')
    .eq('id', id)
    .single()

  const mergedMetadata = {
    ...(existing?.metadata ?? { is_public: false, tags: [] }),
    ...(metadata ?? {}),
    ...(artifact_type ? { artifact_type } : {}),
    ...(title ? { title } : {}),
  }

  const safeUpdate: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    metadata: mergedMetadata,
  }
  if (story_intent) safeUpdate.story_intent = story_intent
  if (bounding_context) safeUpdate.bounding_context = bounding_context
  if (title) safeUpdate.title = title

  const { data, error } = await supabase
    .from('blueprints')
    .update(safeUpdate)
    .eq('id', id)
    .eq('owner_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE /api/blueprints/[id]
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('blueprints')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}

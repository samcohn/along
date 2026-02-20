import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/coplanner
// Given current map state (locations, artifact type, destination),
// Claude suggests the next best places to add — context-aware, not generic.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { destination, intent, existing_locations = [], artifact_type = 'discovery_guide' } = await request.json()

  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const anthropic = process.env.ANTHROPIC_API_KEY
    ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    : null

  if (!anthropic) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })

  const existingSummary = existing_locations.length > 0
    ? existing_locations.map((l: { name: string; category?: string[] }) =>
        `- ${l.name}${l.category?.length ? ` (${l.category.slice(0, 2).join(', ')})` : ''}`
      ).join('\n')
    : 'None yet'

  const styleContext: Record<string, string> = {
    discovery_guide:  'editorial city guide, clean and shareable',
    memory_map:       'personal and photo-forward, warm and nostalgic',
    trip_itinerary:   'day-by-day travel sequence with practical timing',
    wilderness:       'nature and terrain-focused, field guide style',
    cinematic:        'cinematic and moody, film or cultural mapping',
    data_cartography: 'data-first, precise, analytical',
    living_dataset:   'real-time, dynamic, filter-friendly',
  }

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `You are a map co-planner. The user is building a ${styleContext[artifact_type] ?? 'map'}.

Destination: ${destination || 'not specified'}
Style: ${artifact_type}
Intent: ${intent || 'general exploration'}
Already on the map:
${existingSummary}

Suggest 5 places that complement what's already there. Avoid duplicating existing places.
Focus on what's MISSING — if they have restaurants, suggest cultural spots. If they have landmarks, suggest hidden gems.

Return a JSON array of exactly 5 suggestions:
[{
  "id": "sugg_1",
  "name": "Specific place name",
  "coordinates": { "lat": 0.0, "lng": 0.0 },
  "category": ["tag1", "tag2"],
  "notes": "1 sentence on why this complements the existing map",
  "source": { "type": "ai", "source_name": "Along Co-planner", "confidence": 0.8 },
  "estimated_duration_minutes": 60
}]

Use real coordinates for real places. Return ONLY a valid JSON array, no markdown.`
    }]
  })

  let suggestions = []
  try {
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '[]'
    const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    const raw = JSON.parse(cleaned)
    suggestions = raw.map((s: Record<string, unknown>, i: number) => ({
      ...s,
      id: `sugg_${Date.now()}_${i}`,
    }))
  } catch {
    return NextResponse.json({ error: 'Failed to parse suggestions' }, { status: 500 })
  }

  return NextResponse.json({ suggestions })
}

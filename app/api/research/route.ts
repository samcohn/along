import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/research
// Takes a vague user prompt, returns a structured trip plan with themes + places
// Two-step: (1) intent parsing → (2) place generation per theme
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { query } = body
  if (!query?.trim()) return NextResponse.json({ error: 'Query is required' }, { status: 400 })

  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const anthropic = process.env.ANTHROPIC_API_KEY
    ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    : null

  if (!anthropic) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  // Single Claude call: interpret intent + generate structured plan
  let plan: ResearchPlan
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `You are a travel research assistant. A user typed: "${query}"

Interpret what they want and return a structured trip plan as JSON.

Return this exact shape:
{
  "title": "Short evocative title for this map (e.g. 'Tokyo Weekend Ramen Run')",
  "summary": "1-2 sentence description of what this map is about",
  "intent": "weekend_trip" | "day_trip" | "food_tour" | "nature" | "culture" | "nightlife" | "shopping" | "custom",
  "themes": [
    {
      "id": "theme_1",
      "name": "Theme name (e.g. 'Morning Coffee', 'Day 1', 'Hidden Bars')",
      "description": "What this theme covers in 1 sentence",
      "places": [
        {
          "name": "Specific real place name",
          "address": "Full address with city and country",
          "why": "1 sentence on why this place fits",
          "category": ["tag1", "tag2"],
          "source_url": "https://..."
        }
      ]
    }
  ]
}

Rules:
- 2-4 themes max
- 3-5 places per theme
- All places must be real, specific, named locations
- Return ONLY valid JSON, no markdown, no explanation`
      }]
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    // Strip markdown code fences if Claude added them despite instructions
    const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    plan = JSON.parse(cleaned)
  } catch (e) {
    console.error('[research] Claude error:', e)
    return NextResponse.json({ error: 'Failed to generate plan', details: String(e) }, { status: 500 })
  }

  // Geocode all places in parallel (best-effort — failures keep the place without coords)
  const KEY = process.env.GOOGLE_GEOCODING_KEY
  const geocodePlace = async (place: RawPlace) => {
    if (!KEY) return { ...place, coordinates: null, formatted_address: place.address }
    try {
      const q = encodeURIComponent(`${place.name} ${place.address}`)
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${q}&key=${KEY}`)
      const data = await res.json()
      if (data.results?.[0]) {
        const loc = data.results[0].geometry.location
        return {
          ...place,
          coordinates: { lat: loc.lat, lng: loc.lng },
          formatted_address: data.results[0].formatted_address,
        }
      }
    } catch { /* skip */ }
    return { ...place, coordinates: null, formatted_address: place.address }
  }

  // Geocode all places across all themes concurrently
  const geocodedThemes = await Promise.all(
    plan.themes.map(async (theme) => ({
      ...theme,
      places: await Promise.all(theme.places.map(geocodePlace)),
    }))
  )

  return NextResponse.json({
    title: plan.title,
    summary: plan.summary,
    intent: plan.intent,
    themes: geocodedThemes,
    query,
  })
}

interface RawPlace {
  name: string
  address: string
  why: string
  category: string[]
  source_url?: string
}

interface ResearchPlan {
  title: string
  summary: string
  intent: string
  themes: Array<{
    id: string
    name: string
    description: string
    places: RawPlace[]
  }>
}

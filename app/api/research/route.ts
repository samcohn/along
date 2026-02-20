import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { inngest } from '@/lib/inngest/client'

// POST /api/research
// Kicks off the research agent pipeline and returns results synchronously
// for the triage UI. For living datasets, also schedules future cron runs.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { query, sources = [], is_living = false, blueprint_id } = await request.json()
  if (!query?.trim()) return NextResponse.json({ error: 'Query is required' }, { status: 400 })

  // Fire Inngest event for observability + living dataset retries
  // Skip gracefully if INNGEST_EVENT_KEY not configured (local dev)
  if (process.env.INNGEST_EVENT_KEY) {
    try {
      await inngest.send({
        name: 'along/research.requested',
        data: { blueprint_id, query, sources, is_living, user_id: user.id },
      })
    } catch (e) {
      console.warn('Inngest send skipped:', e)
    }
  }

  // Run Claude inline for immediate triage UI response
  // We call Claude directly here so the user sees results without polling
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const anthropic = process.env.ANTHROPIC_API_KEY
    ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    : null

  if (!anthropic) {
    return NextResponse.json({
      results: [],
      message: 'ANTHROPIC_API_KEY not configured',
    })
  }

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `Generate a research dataset for: "${query}"

Return a JSON array of 8-12 real, specific places. Each item must have:
- name: string (specific real place name)
- address: string (real full address including city and country)
- description: string (1–2 sentence description of why it's relevant)
- source_url: string (a real plausible URL)
- category: string[] (2–3 tags like ["restaurant", "japanese"])

Return ONLY the JSON array. No markdown, no explanation.`
    }]
  })

  let rawResults: Array<{
    name: string
    address: string
    description: string
    source_url: string
    category: string[]
  }> = []

  try {
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '[]'
    rawResults = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }

  // Geocode each result
  const KEY = process.env.GOOGLE_GEOCODING_KEY
  const geocoded = []

  for (const result of rawResults.slice(0, 15)) {
    try {
      const q = encodeURIComponent(`${result.name} ${result.address}`)
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${q}&key=${KEY}`)
      const data = await res.json()

      if (data.results?.[0]) {
        const loc = data.results[0].geometry.location
        geocoded.push({
          id: `research_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          ...result,
          coordinates: { lat: loc.lat, lng: loc.lng },
          formatted_address: data.results[0].formatted_address,
          source: { type: 'ai', source_name: 'Along Research Agent', source_url: result.source_url, confidence: 0.8 },
        })
      }
    } catch { /* skip */ }
  }

  return NextResponse.json({ results: geocoded, query, count: geocoded.length })
}

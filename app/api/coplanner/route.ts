import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

// POST /api/coplanner
// Body: { blueprint_id, destination, intent, existing_locations, day_structure }
// Returns: suggested Location nodes ready to drop into Blueprint
export async function POST(request: Request) {
  const body = await request.json()
  const { destination, intent, existing_locations = [], day_structure } = body

  // Mock suggestions when Anthropic key not configured
  if (!anthropic) {
    return NextResponse.json({
      suggestions: [
        {
          id: `suggestion_${Date.now()}_1`,
          name: 'Local Coffee Shop',
          coordinates: { lat: 40.7128, lng: -74.006 },
          category: ['cafe', 'breakfast'],
          notes: 'Great for starting your morning',
          source: { type: 'ai', source_name: 'Along AI', confidence: 0.85 },
          estimated_duration_minutes: 45,
        },
        {
          id: `suggestion_${Date.now()}_2`,
          name: 'Central Park',
          coordinates: { lat: 40.7851, lng: -73.9683 },
          category: ['park', 'outdoor'],
          notes: 'Perfect midday outdoor break',
          source: { type: 'ai', source_name: 'Along AI', confidence: 0.92 },
          estimated_duration_minutes: 90,
        },
        {
          id: `suggestion_${Date.now()}_3`,
          name: 'Dinner Spot',
          coordinates: { lat: 40.7282, lng: -73.9942 },
          category: ['restaurant', 'dinner'],
          notes: 'Highly rated local restaurant',
          source: { type: 'ai', source_name: 'Along AI', confidence: 0.78 },
          estimated_duration_minutes: 75,
        },
      ]
    })
  }

  const existingNames = existing_locations.map((l: { name: string }) => l.name).join(', ')

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a travel co-planner for the Along app. Suggest 3-5 specific places to visit.

Destination: ${destination}
Intent: ${intent || 'general exploration'}
Already planned: ${existingNames || 'nothing yet'}
Day structure: ${day_structure || 'flexible'}

Respond ONLY with a JSON array of suggestions. Each suggestion must have:
- name: string (specific place name)
- coordinates: { lat: number, lng: number } (accurate coordinates)
- category: string[] (e.g. ["cafe", "breakfast"])
- notes: string (1 sentence why it's great)
- source_name: string ("Along AI")
- confidence: number (0-1)
- estimated_duration_minutes: number

Return only the JSON array, no other text.`
    }]
  })

  try {
    const content = message.content[0].type === 'text' ? message.content[0].text : '[]'
    const raw = JSON.parse(content)
    const suggestions = raw.map((s: Record<string, unknown>, i: number) => ({
      id: `suggestion_${Date.now()}_${i}`,
      name: s.name,
      coordinates: s.coordinates,
      category: s.category,
      notes: s.notes,
      source: { type: 'ai', source_name: s.source_name ?? 'Along AI', confidence: s.confidence ?? 0.8 },
      estimated_duration_minutes: s.estimated_duration_minutes ?? 60,
    }))
    return NextResponse.json({ suggestions })
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }
}

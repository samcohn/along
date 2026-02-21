import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { ONBOARDING_IMAGES } from '@/lib/onboarding-images'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      imageSelections: string[]   // 3 image IDs from Act 1
      anchorText: string          // Act 2: film/restaurant/record
      bucketListTrip: string      // Act 3a: dream trip
      hardConstraint: string      // Act 3b: never want
    }

    const { imageSelections, anchorText, bucketListTrip, hardConstraint } = body

    // Resolve image moods from selections
    const selectedImages = imageSelections
      .map((id) => ONBOARDING_IMAGES.find((img) => img.id === id))
      .filter(Boolean)

    const imageMoodContext = selectedImages
      .map((img, i) => `Image ${i + 1} "${img!.id}": moods [${img!.mood.join(', ')}] — "${img!.alt}"`)
      .join('\n')

    const prompt = `You are Along, an AI travel concierge. You've just learned something deep about a traveler through their choices. Your job is two things:

1. Extract their taste profile as structured data
2. Write 4-6 short, poetic mirror phrases — things that are TRUE about this person when they travel, revealed by their choices

THE TRAVELER CHOSE THESE THREE IMAGES:
${imageMoodContext}

THEIR CULTURAL ANCHOR:
"${anchorText}"

THEIR DREAM TRIP (bucket list):
"${bucketListTrip}"

THEIR HARD CONSTRAINT (what they never want):
"${hardConstraint}"

MIRROR PHRASES: Write 4-6 phrases that feel like revelations, not descriptions. Each should be:
- Short (max 8 words)
- Declarative, not interrogative
- Specific enough to feel true, not generic
- About their travel *mode*, not destinations
- In second person ("You want...", "Mornings...", "The counter...")

Examples of good phrases:
"You want somewhere that hasn't been optimized."
"Mornings matter more than nights."
"Density, but with exits."
"The counter, not the table."
"Beauty through an open window."
"You'll walk until your feet hurt. Gladly."

TASTE PROFILE: Extract these dimensions based on all evidence:
- formality: 0.0 (underground/raw) to 1.0 (refined/formal)
- density: 0.0 (sparse/empty) to 1.0 (layered/crowded)
- temporality: 0.0 (ancient) to 1.0 (contemporary)
- sociality: 0.0 (solitary) to 1.0 (communal)
- legibility: 0.0 (hidden/obscure) to 1.0 (famous/obvious)
- pace: "slow_deep" | "varied" | "high_coverage"
- discovery_mode: "wander" | "researched" | "local_led"
- taste_summary: A 2-3 sentence narrative of who this traveler is. Used in future trip prompts. Be specific and poetic. Don't mention destinations.

Respond ONLY with valid JSON, no markdown:
{
  "taste_phrases": ["phrase 1", "phrase 2", "phrase 3", "phrase 4"],
  "taste_profile": {
    "anchors": {
      "cultural": "${anchorText}",
      "bucket_list": "${bucketListTrip}",
      "anti_pattern": "${hardConstraint}"
    },
    "dimensions": {
      "formality": 0.0,
      "density": 0.0,
      "temporality": 0.0,
      "sociality": 0.0,
      "legibility": 0.0
    },
    "selected_image_moods": [],
    "pace": "slow_deep",
    "discovery_mode": "wander",
    "taste_summary": ""
  }
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(cleaned) as {
      taste_phrases: string[]
      taste_profile: {
        anchors: Record<string, string>
        dimensions: Record<string, number>
        selected_image_moods: string[]
        pace: string
        discovery_mode: string
        taste_summary: string
      }
    }

    // Add image mood context to profile
    parsed.taste_profile.selected_image_moods = selectedImages.flatMap((img) => img!.mood)

    // Upsert taste_profiles
    await supabase.from('taste_profiles').upsert({
      user_id: user.id,
      anchors: parsed.taste_profile.anchors,
      dimensions: parsed.taste_profile.dimensions,
      pace: parsed.taste_profile.pace,
      discovery_mode: parsed.taste_profile.discovery_mode,
      raw_answers: { imageSelections, anchorText, bucketListTrip, hardConstraint },
      taste_summary: parsed.taste_profile.taste_summary,
      onboarding_completed: true,
      image_selections: imageSelections,
    }, { onConflict: 'user_id' })

    return NextResponse.json({
      taste_phrases: parsed.taste_phrases,
      taste_profile: parsed.taste_profile,
    })
  } catch (err) {
    console.error('POST /api/onboarding error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

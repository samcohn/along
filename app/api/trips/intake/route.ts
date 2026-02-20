import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/trips/intake
// Takes raw intake answers, extracts taste profile via Claude,
// upserts taste_profiles row, creates trip_intent, returns scope options.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { answers } = await request.json()
  if (!answers?.length) return NextResponse.json({ error: 'No answers provided' }, { status: 400 })

  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  // Find the destination answer
  const destinationAnswer = answers.find((a: { question_id: string; answer: string }) => a.question_id === 'destination')
  const destination = destinationAnswer?.answer ?? 'unknown'

  // ── Step 1: Extract taste profile from answers ──────────────────────────
  const profileMsg = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `You are a cultural analyst building a traveler's taste profile.

Analyze these intake answers and extract a rich semantic profile.

ANSWERS:
${answers.map((a: { question: string; answer: string }) => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n')}

Return a JSON object with this exact shape:
{
  "anchors": {
    "restaurants": ["extracted restaurant names"],
    "artists": ["extracted artist/musician/filmmaker/writer names"],
    "spaces": ["any spaces, hotels, or environments mentioned"]
  },
  "dimensions": {
    "formality": 0.0,
    "density": 0.0,
    "temporality": 0.0,
    "sociality": 0.0,
    "legibility": 0.0,
    "materiality": ["material/texture words that emerged"]
  },
  "pace": "slow_deep|varied|high_coverage",
  "meal_philosophy": "counter|table|street|mixed",
  "sleep_pattern": "early_light|night_owl|flexible",
  "discovery_mode": "wander|researched|local_led",
  "hard_constraints": ["things they explicitly don't want"],
  "soft_preferences": ["things they seem to prefer based on signals"],
  "taste_summary": "A 2-3 sentence first-person narrative about who this traveler is and what they're seeking. Write it as if you're briefing a brilliant local fixer about who's arriving. Be specific and cultural, not generic."
}

Dimension scoring guide (0.0 to 1.0):
- formality: 0=raw/underground/unmarked, 1=refined/institutional/celebrated
- density: 0=sparse/minimal/quiet, 1=layered/maximalist/busy
- temporality: 0=ancient/patinated/historical, 1=contemporary/new/cutting-edge
- sociality: 0=solitary/intimate/private, 1=communal/convivial/social
- legibility: 0=hidden/local-only/unmarked, 1=famous/well-reviewed/on-every-list

Return ONLY valid JSON.`
    }]
  })

  let profile: Record<string, unknown>
  try {
    const text = profileMsg.content[0].type === 'text' ? profileMsg.content[0].text : '{}'
    const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    profile = JSON.parse(cleaned)
  } catch {
    return NextResponse.json({ error: 'Failed to parse taste profile' }, { status: 500 })
  }

  // ── Step 2: Upsert taste profile ────────────────────────────────────────
  const { data: tasteProfile } = await supabase
    .from('taste_profiles')
    .upsert({
      user_id: user.id,
      anchors: profile.anchors ?? {},
      dimensions: profile.dimensions ?? {},
      pace: profile.pace as string ?? 'varied',
      meal_philosophy: profile.meal_philosophy as string ?? 'mixed',
      sleep_pattern: profile.sleep_pattern as string ?? 'flexible',
      discovery_mode: profile.discovery_mode as string ?? 'wander',
      raw_answers: answers,
      taste_summary: profile.taste_summary as string ?? '',
    }, { onConflict: 'user_id' })
    .select()
    .single()

  // ── Step 3: Generate 3 scope options ───────────────────────────────────
  const scopeMsg = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `You are planning a trip to ${destination} for someone with this profile:

${profile.taste_summary}

Constraints: ${JSON.stringify(profile.hard_constraints)}
Preferences: ${JSON.stringify(profile.soft_preferences)}

Generate exactly 3 distinct trip scope options. Each should be a genuinely different shape of the trip — not just duration variations but philosophically different approaches.

Return JSON array:
[{
  "id": "scope_1",
  "title": "Short evocative title (e.g. 'The Deep Cut')",
  "tagline": "One sentence that captures the spirit of this scope",
  "duration_days": 7,
  "city_count": 1,
  "cities": ["Tokyo"],
  "pace": "slow_deep|varied|high_coverage",
  "estimated_cost": { "low": 2000, "high": 3500, "currency": "USD" },
  "tradeoffs": "What you gain and what you give up in one sentence",
  "highlights": ["3-4 specific things that define this scope, not generic activities"]
}]

Make the options genuinely different. One could be a single city deep dive. One could span regions. One could be structured around a theme (food, architecture, nature). Return ONLY valid JSON array.`
    }]
  })

  let scopeOptions: unknown[] = []
  try {
    const text = scopeMsg.content[0].type === 'text' ? scopeMsg.content[0].text : '[]'
    const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    scopeOptions = JSON.parse(cleaned)
  } catch {
    scopeOptions = []
  }

  // ── Step 4: Create trip intent ──────────────────────────────────────────
  const { data: tripIntent } = await supabase
    .from('trip_intents')
    .insert({
      owner_id: user.id,
      destination,
      travelers: [{ name: user.email, user_id: user.id, is_owner: true, taste_profile_id: tasteProfile?.id }],
      scope_options: scopeOptions,
      hard_constraints: (profile.hard_constraints as string[]) ?? [],
      soft_preferences: (profile.soft_preferences as string[]) ?? [],
      status: 'scoping',
    })
    .select()
    .single()

  return NextResponse.json({
    trip_intent_id: tripIntent?.id,
    taste_profile: profile,
    scope_options: scopeOptions,
    destination,
  })
}

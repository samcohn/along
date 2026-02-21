import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/profile — returns current user's taste profile if it exists
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ profile: null })

    const { data: profile } = await supabase
      .from('taste_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({ profile: profile ?? null })
  } catch {
    return NextResponse.json({ profile: null })
  }
}

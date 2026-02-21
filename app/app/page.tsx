import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Onboarding gate — first-time users must complete the image séance
  const { data: profile } = await supabase
    .from('taste_profiles')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile?.onboarding_completed) {
    redirect('/app/onboarding')
  }

  const { data: blueprints } = await supabase
    .from('blueprints')
    .select('id, metadata, story_intent, created_at, updated_at')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(20)

  const tripBlueprints = blueprints?.filter(b => b.story_intent === 'travel') ?? []
  const mapBlueprints = blueprints?.filter(b => b.story_intent !== 'travel') ?? []

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-8 py-5 flex items-center justify-between">
        <span className="text-white font-semibold tracking-tight text-lg">Along</span>
        <span className="text-white/25 text-sm">{user.email}</span>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-14">

        {/* ── Primary CTA ──────────────────────────────────────────────── */}
        <div className="mb-16">
          <h1 className="text-3xl font-semibold text-white mb-1">Where next?</h1>
          <p className="text-white/30 text-sm mb-8">Plan a trip, or build a map.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
            {/* Primary: trip planning */}
            <Link
              href="/app/new"
              className="group relative overflow-hidden bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-200"
            >
              <div className="text-3xl mb-4">✈️</div>
              <p className="text-white font-semibold text-base mb-1">Plan a trip</p>
              <p className="text-white/35 text-sm leading-relaxed">
                Tell Along where you want to go. It builds a full itinerary based on your taste.
              </p>
              <div className="mt-5 flex items-center gap-1.5 text-white/50 text-xs group-hover:text-white/70 transition-colors">
                <span>Get started</span>
                <span>→</span>
              </div>
            </Link>

            {/* Secondary: blank map */}
            <Link
              href="/app/new/map"
              className="group relative overflow-hidden bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-white/[0.12] rounded-2xl p-6 transition-all duration-200"
            >
              <div className="text-3xl mb-4">🗺</div>
              <p className="text-white/80 font-medium text-base mb-1">Build a map</p>
              <p className="text-white/25 text-sm leading-relaxed">
                Start with a blank map. Drop pins, explore ideas, build a dream.
              </p>
              <div className="mt-5 flex items-center gap-1.5 text-white/30 text-xs group-hover:text-white/50 transition-colors">
                <span>Open canvas</span>
                <span>→</span>
              </div>
            </Link>
          </div>
        </div>

        {/* ── Trips ─────────────────────────────────────────────────────── */}
        {tripBlueprints.length > 0 && (
          <section className="mb-12">
            <p className="text-white/30 text-[11px] uppercase tracking-widest mb-4">Your trips</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tripBlueprints.map(bp => (
                <BlueprintCard key={bp.id} bp={bp} />
              ))}
            </div>
          </section>
        )}

        {/* ── Maps ──────────────────────────────────────────────────────── */}
        {mapBlueprints.length > 0 && (
          <section>
            <p className="text-white/30 text-[11px] uppercase tracking-widest mb-4">Your maps</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {mapBlueprints.map(bp => (
                <BlueprintCard key={bp.id} bp={bp} />
              ))}
            </div>
          </section>
        )}

        {/* ── Empty state ───────────────────────────────────────────────── */}
        {!blueprints?.length && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <p className="text-white/20 text-sm">Your trips and maps will appear here.</p>
          </div>
        )}
      </div>
    </main>
  )
}

function BlueprintCard({ bp }: { bp: { id: string; metadata: Record<string, unknown> | null; story_intent: string; updated_at: string } }) {
  return (
    <Link
      href={`/app/map/${bp.id}`}
      className="group bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5 hover:bg-white/[0.07] hover:border-white/[0.13] transition-all"
    >
      <div className="w-full h-24 rounded-xl bg-white/[0.04] mb-4 flex items-center justify-center text-2xl">
        {intentEmoji(bp.story_intent)}
      </div>
      <p className="text-white font-medium text-sm truncate">
        {(bp.metadata as Record<string, string> | null)?.title || 'Untitled'}
      </p>
      <p className="text-white/25 text-xs mt-1 capitalize">{bp.story_intent?.replace('_', ' ')}</p>
      <p className="text-white/15 text-xs mt-2">{formatDate(bp.updated_at)}</p>
    </Link>
  )
}

function intentEmoji(intent: string) {
  const map: Record<string, string> = {
    memory: '📷', research: '🔍', discovery: '🗺',
    data_viz: '📊', editorial: '📰', travel: '✈️',
  }
  return map[intent] ?? '🗺'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

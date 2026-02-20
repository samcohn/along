import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: blueprints } = await supabase
    .from('blueprints')
    .select('id, metadata, story_intent, created_at, updated_at')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(20)

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b border-white/8 px-8 py-5 flex items-center justify-between">
        <span className="text-white font-semibold tracking-tight text-lg">Along</span>
        <div className="flex items-center gap-4">
          <span className="text-white/30 text-sm">{user.email}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-12">
        {/* Page title + new map */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="text-2xl font-semibold text-white">Your maps</h1>
            <p className="text-white/35 text-sm mt-1">{blueprints?.length ?? 0} blueprint{blueprints?.length !== 1 ? 's' : ''}</p>
          </div>
          <Link
            href="/app/new"
            className="bg-white text-black rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-white/90 transition"
          >
            + New map
          </Link>
        </div>

        {/* Blueprint grid */}
        {!blueprints?.length ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="text-5xl">🗺</div>
            <p className="text-white/40 text-sm">No maps yet. Create your first one.</p>
            <Link
              href="/app/new"
              className="bg-white text-black rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-white/90 transition mt-2"
            >
              Create a map
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {blueprints.map(bp => (
              <Link
                key={bp.id}
                href={`/app/map/${bp.id}`}
                className="group bg-white/4 border border-white/8 rounded-2xl p-5 hover:bg-white/7 hover:border-white/15 transition-all"
              >
                <div className="w-full h-32 rounded-xl bg-white/5 mb-4 flex items-center justify-center text-3xl">
                  {intentEmoji(bp.story_intent)}
                </div>
                <p className="text-white font-medium text-sm truncate">
                  {bp.metadata?.title || 'Untitled Map'}
                </p>
                <p className="text-white/30 text-xs mt-1 capitalize">{bp.story_intent?.replace('_', ' ')}</p>
                <p className="text-white/20 text-xs mt-2">{formatDate(bp.updated_at)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
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
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

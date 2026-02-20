import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AppPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-semibold">Along</h1>
        <p className="text-white/50 text-sm">Signed in as {user.email}</p>
        <a
          href="/app/new"
          className="inline-block bg-white text-black rounded-lg px-6 py-3 text-sm font-medium hover:bg-white/90 transition"
        >
          New map
        </a>
      </div>
    </main>
  )
}

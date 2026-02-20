import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function NewMapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold">New map</h1>
        <p className="text-white/40 text-sm">Mapbox canvas coming in Phase 1</p>
      </div>
    </main>
  )
}

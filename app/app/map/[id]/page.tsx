import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MapShell from '@/components/map/MapShell'

export default async function MapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify the blueprint exists and belongs to this user
  const { data: bp } = await supabase
    .from('blueprints')
    .select('id, metadata')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (!bp) redirect('/app')

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      <MapShell />
    </main>
  )
}

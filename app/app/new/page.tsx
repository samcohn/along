import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MapShell from '@/components/map/MapShell'

export default async function NewMapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      <MapShell />
    </main>
  )
}

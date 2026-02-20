import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'

// SSR disabled — Mapbox GL requires browser APIs
const MapCanvas = dynamic(() => import('@/components/map/MapCanvas'), { ssr: false })
const PromptBar = dynamic(() => import('@/components/map/PromptBar'), { ssr: false })

export default async function NewMapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Full-bleed map — always primary */}
      <MapCanvas />

      {/* Discovery mode: single floating prompt bar */}
      <PromptBar />
    </main>
  )
}

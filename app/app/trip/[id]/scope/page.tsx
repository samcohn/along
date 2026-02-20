import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ScopeSelector from '@/components/intake/ScopeSelector'

export default async function TripScopePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tripIntent } = await supabase
    .from('trip_intents')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (!tripIntent) redirect('/app')

  return <ScopeSelector tripIntent={tripIntent} />
}

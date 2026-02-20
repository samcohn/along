import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TripIntake from '@/components/intake/TripIntake'

// /app/new — trip intake (replaces blank map as entry point)
export default async function NewTripPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <TripIntake />
}

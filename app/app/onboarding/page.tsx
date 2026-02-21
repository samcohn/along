import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingShell from '@/components/onboarding/OnboardingShell'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // If already completed, skip to dashboard
  const { data: profile } = await supabase
    .from('taste_profiles')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .single()

  if (profile?.onboarding_completed) {
    redirect('/app')
  }

  return <OnboardingShell />
}

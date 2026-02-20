'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useBlueprint } from '@/hooks/useBlueprint'

const MapCanvas        = dynamic(() => import('./MapCanvas'), { ssr: false })
const PromptBar        = dynamic(() => import('./PromptBar'), { ssr: false })
const BuildingPanel    = dynamic(() => import('@/components/panels/BuildingPanel'), { ssr: false })
const SuggestionTray   = dynamic(() => import('@/components/panels/SuggestionTray'), { ssr: false })
const ArtifactSwitcher = dynamic(() => import('./ArtifactSwitcher'), { ssr: false })
const TripReveal       = dynamic(() => import('./TripReveal'), { ssr: false })
const BookingPanel     = dynamic(() => import('./BookingPanel'), { ssr: false })

interface Props {
  reveal?: boolean
}

export default function MapShell({ reveal = false }: Props) {
  useBlueprint()
  const [showReveal, setShowReveal] = useState(reveal)
  const [showBooking, setShowBooking] = useState(false)

  // After the cinematic reveal completes, show the booking panel after a short beat
  const handleRevealComplete = useCallback(() => {
    setShowReveal(false)
    setTimeout(() => setShowBooking(true), 600)
  }, [])

  return (
    <>
      <MapCanvas />
      <PromptBar />
      <BuildingPanel />
      <SuggestionTray />
      <ArtifactSwitcher />
      {showReveal && <TripReveal onComplete={handleRevealComplete} />}
      {showBooking && <BookingPanel onClose={() => setShowBooking(false)} />}
    </>
  )
}

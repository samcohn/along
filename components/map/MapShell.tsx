'use client'

import dynamic from 'next/dynamic'
import { useBlueprint } from '@/hooks/useBlueprint'

// SSR disabled — all map components require browser APIs
const MapCanvas        = dynamic(() => import('./MapCanvas'), { ssr: false })
const PromptBar        = dynamic(() => import('./PromptBar'), { ssr: false })
const BuildingPanel    = dynamic(() => import('@/components/panels/BuildingPanel'), { ssr: false })
const SuggestionTray   = dynamic(() => import('@/components/panels/SuggestionTray'), { ssr: false })
const ArtifactSwitcher = dynamic(() => import('./ArtifactSwitcher'), { ssr: false })

export default function MapShell() {
  useBlueprint()

  return (
    <>
      {/* Map is always the bottom layer */}
      <MapCanvas />

      {/* Floating UI — layered on top, never fully occluding the map */}
      <PromptBar />
      <BuildingPanel />
      <SuggestionTray />

      {/* Artifact type switcher — bottom center */}
      <ArtifactSwitcher />
    </>
  )
}

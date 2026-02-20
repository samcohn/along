'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useMapStore } from '@/store/map'
import { useLocationStore } from '@/store/locations'
import type { Location } from '@/types/blueprint'

// useBlueprint — auto-creates a Blueprint in Supabase on mount,
// then syncs location adds/removes to the DB in the background.
// All saves are fire-and-forget — UI never blocks on them.
export function useBlueprint() {
  const { activeBlueprintId, setActiveBlueprintId, activeArtifactType, viewState } = useMapStore()
  const { locations } = useLocationStore()

  const prevLocationsRef = useRef<Location[]>([])
  const initDone = useRef(false)

  // ── Step 1: Create or resume blueprint on mount ──────────────────────────
  useEffect(() => {
    if (initDone.current) return
    initDone.current = true

    // Check URL for existing blueprint id (e.g. /app/map/[id])
    const urlId = typeof window !== 'undefined'
      ? window.location.pathname.split('/').pop()
      : null
    const isUuid = urlId && /^[0-9a-f-]{36}$/.test(urlId)

    if (isUuid) {
      setActiveBlueprintId(urlId)
      loadBlueprint(urlId)
    } else {
      createBlueprint()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function createBlueprint() {
    try {
      const res = await fetch('/api/blueprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story_intent: 'discovery',
          bounding_context: {
            center: { lat: viewState.latitude, lng: viewState.longitude },
            zoom: viewState.zoom,
          },
          metadata: { is_public: false, tags: [], title: 'Untitled Map' },
        }),
      })
      if (!res.ok) return
      const bp = await res.json()
      setActiveBlueprintId(bp.id)
      // Update URL without a navigation
      window.history.replaceState({}, '', `/app/map/${bp.id}`)
    } catch { /* silent — offline or auth issue */ }
  }

  async function loadBlueprint(id: string) {
    try {
      const res = await fetch(`/api/blueprints/${id}/locations`)
      if (!res.ok) return
      const rows = await res.json()
      const { addLocation } = useLocationStore.getState()
      for (const row of rows) {
        // DB stores geometry as { x: lng, y: lat } after PostGIS parse
        const coords = row.coordinates
        const lng = coords?.x ?? coords?.lng ?? 0
        const lat = coords?.y ?? coords?.lat ?? 0
        addLocation({
          id: row.id,
          name: row.name,
          coordinates: { lat, lng },
          category: row.category ?? [],
          notes: row.notes ?? '',
          timestamp: row.timestamp,
          photos: [],
          relationships: [],
          quantitative_values: {},
          source: {
            type: row.source_type ?? 'self',
            source_name: row.source_name,
            source_url: row.source_url,
            confidence: row.confidence,
          },
          enrichment: row.enrichment ?? {},
        })
      }
    } catch { /* silent */ }
  }

  // ── Step 2: Sync location changes to DB ──────────────────────────────────
  const syncLocation = useCallback(async (loc: Location) => {
    const id = activeBlueprintId
    if (!id) return
    try {
      await fetch(`/api/blueprints/${id}/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loc),
      })
    } catch { /* silent */ }
  }, [activeBlueprintId])

  const deleteLocation = useCallback(async (locId: string) => {
    const id = activeBlueprintId
    if (!id) return
    try {
      await fetch(`/api/blueprints/${id}/locations?location_id=${locId}`, {
        method: 'DELETE',
      })
    } catch { /* silent */ }
  }, [activeBlueprintId])

  useEffect(() => {
    if (!activeBlueprintId) return
    const prev = prevLocationsRef.current
    const curr = locations

    // Find added locations
    const prevIds = new Set(prev.map(l => l.id))
    for (const loc of curr) {
      if (!prevIds.has(loc.id)) syncLocation(loc)
    }

    // Find removed locations
    const currIds = new Set(curr.map(l => l.id))
    for (const loc of prev) {
      if (!currIds.has(loc.id)) deleteLocation(loc.id)
    }

    prevLocationsRef.current = curr
  }, [locations, activeBlueprintId, syncLocation, deleteLocation])

  // ── Step 3: Patch blueprint metadata when artifact type changes ──────────
  useEffect(() => {
    if (!activeBlueprintId) return
    fetch(`/api/blueprints/${activeBlueprintId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artifact_type: activeArtifactType }),
    }).catch(() => {})
  }, [activeArtifactType, activeBlueprintId])

  return { blueprintId: activeBlueprintId }
}

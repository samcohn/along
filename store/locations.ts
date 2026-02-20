import { create } from 'zustand'
import type { Location } from '@/types/blueprint'

export interface Suggestion extends Omit<Location, 'id' | 'photos' | 'relationships' | 'enrichment' | 'quantitative_values'> {
  id: string
  estimated_duration_minutes?: number
}

interface LocationStore {
  // Committed blueprint locations
  locations: Location[]
  addLocation: (loc: Location) => void
  removeLocation: (id: string) => void
  reorderLocations: (from: number, to: number) => void

  // AI suggestions pending review
  suggestions: Suggestion[]
  setSuggestions: (suggestions: Suggestion[]) => void
  acceptSuggestion: (id: string) => void
  dismissSuggestion: (id: string) => void

  // Route polyline from Directions API
  routePolyline: [number, number][]
  setRoutePolyline: (points: [number, number][]) => void

  // Loading states
  isFetchingSuggestions: boolean
  setIsFetchingSuggestions: (v: boolean) => void
}

export const useLocationStore = create<LocationStore>((set, get) => ({
  locations: [],
  addLocation: (loc) => set((s) => ({ locations: [...s.locations, loc] })),
  removeLocation: (id) => set((s) => ({ locations: s.locations.filter((l) => l.id !== id) })),
  reorderLocations: (from, to) => set((s) => {
    const locs = [...s.locations]
    const [moved] = locs.splice(from, 1)
    locs.splice(to, 0, moved)
    return { locations: locs }
  }),

  suggestions: [],
  setSuggestions: (suggestions) => set({ suggestions }),
  acceptSuggestion: (id) => {
    const suggestion = get().suggestions.find((s) => s.id === id)
    if (!suggestion) return
    const asLocation: Location = {
      ...suggestion,
      photos: [],
      relationships: [],
      enrichment: {},
      quantitative_values: {},
    }
    set((s) => ({
      locations: [...s.locations, asLocation],
      suggestions: s.suggestions.filter((s) => s.id !== id),
    }))
  },
  dismissSuggestion: (id) => set((s) => ({
    suggestions: s.suggestions.filter((s) => s.id !== id),
  })),

  routePolyline: [],
  setRoutePolyline: (points) => set({ routePolyline: points }),

  isFetchingSuggestions: false,
  setIsFetchingSuggestions: (v) => set({ isFetchingSuggestions: v }),
}))

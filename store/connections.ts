import { create } from 'zustand'
import type { DuffelOffer } from '@/lib/duffel'

export type ConnectionType = 'flight' | 'hotel' | 'restaurant' | 'calendar' | 'transport' | 'voice_call'
export type ConnectionStatus = 'suggested' | 'searching' | 'available' | 'watching' | 'calling' | 'booked' | 'unavailable'

export interface FlightSegment {
  id: string           // connection row id
  origin_city: string
  destination_city: string
  origin_iata: string
  destination_iata: string
  date: string
  cheapest_offer: DuffelOffer | null
  deep_link_url: string
  status: ConnectionStatus
}

export interface RestaurantConnection {
  id: string           // location id
  name: string
  day: number
  time_of_day: string
  address: string
  deep_link_url: string
}

interface ConnectionsState {
  flightSegments: FlightSegment[]
  restaurantConnections: RestaurantConnection[]
  isPanelOpen: boolean
  isLoadingFlights: boolean

  setFlightSegments: (segments: FlightSegment[]) => void
  updateFlightSegment: (id: string, update: Partial<FlightSegment>) => void
  setRestaurantConnections: (restaurants: RestaurantConnection[]) => void
  openPanel: () => void
  closePanel: () => void
  setLoadingFlights: (v: boolean) => void
}

export const useConnectionsStore = create<ConnectionsState>((set) => ({
  flightSegments: [],
  restaurantConnections: [],
  isPanelOpen: false,
  isLoadingFlights: false,

  setFlightSegments: (segments) => set({ flightSegments: segments }),
  updateFlightSegment: (id, update) =>
    set((state) => ({
      flightSegments: state.flightSegments.map((s) =>
        s.id === id ? { ...s, ...update } : s
      ),
    })),
  setRestaurantConnections: (restaurants) => set({ restaurantConnections: restaurants }),
  openPanel: () => set({ isPanelOpen: true }),
  closePanel: () => set({ isPanelOpen: false }),
  setLoadingFlights: (v) => set({ isLoadingFlights: v }),
}))

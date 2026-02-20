'use client'

import { useEffect, useRef } from 'react'
import { useMap } from 'react-map-gl/mapbox'
import { useLocationStore } from '@/store/locations'

// Renders the trip route polyline directly on the Mapbox canvas
// Uses Mapbox GL source/layer API so it integrates with the map style
export default function RouteLayer() {
  const { current: map } = useMap()
  const { locations, routePolyline, setRoutePolyline } = useLocationStore()
  const prevLocCount = useRef(0)

  // Fetch route whenever committed locations change (2+ locations)
  useEffect(() => {
    if (locations.length < 2) {
      setRoutePolyline([])
      return
    }
    if (locations.length === prevLocCount.current) return
    prevLocCount.current = locations.length

    const waypoints = locations.map((l) => ({ lat: l.coordinates.lat, lng: l.coordinates.lng }))

    fetch('/api/directions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waypoints }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.routes?.[0]?.polyline) {
          setRoutePolyline(data.routes[0].polyline)
        }
      })
      .catch(console.error)
  }, [locations, setRoutePolyline])

  // Draw/update polyline on Mapbox map
  useEffect(() => {
    if (!map) return
    const mapInstance = map.getMap()

    function drawRoute() {
      // Remove existing layers/source
      if (mapInstance.getLayer('along-route-line')) mapInstance.removeLayer('along-route-line')
      if (mapInstance.getLayer('along-route-casing')) mapInstance.removeLayer('along-route-casing')
      if (mapInstance.getSource('along-route')) mapInstance.removeSource('along-route')

      if (routePolyline.length < 2) return

      mapInstance.addSource('along-route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: routePolyline },
        },
      })

      // Casing (thicker, darker) for contrast
      mapInstance.addLayer({
        id: 'along-route-casing',
        type: 'line',
        source: 'along-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#000000', 'line-width': 6, 'line-opacity': 0.3 },
      })

      // Main route line — white to stand out across artifact styles
      mapInstance.addLayer({
        id: 'along-route-line',
        type: 'line',
        source: 'along-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#ffffff', 'line-width': 3, 'line-opacity': 0.9 },
      })
    }

    if (mapInstance.isStyleLoaded()) {
      drawRoute()
    } else {
      mapInstance.once('styledata', drawRoute)
    }

    return () => {
      if (mapInstance.isStyleLoaded()) {
        if (mapInstance.getLayer('along-route-line')) mapInstance.removeLayer('along-route-line')
        if (mapInstance.getLayer('along-route-casing')) mapInstance.removeLayer('along-route-casing')
        if (mapInstance.getSource('along-route')) mapInstance.removeSource('along-route')
      }
    }
  }, [map, routePolyline])

  return null
}

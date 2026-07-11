import { useEffect, useRef } from 'react'
import { loadGoogleMaps } from '../lib/googleMaps'

export function RecapMap({ places }) {
  const mapRef = useRef(null)
  const key = places.map((p) => p.id).join(',')

  useEffect(() => {
    let cancelled = false
    if (places.length === 0) return

    loadGoogleMaps().then(() => {
      if (cancelled || !mapRef.current) return
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 12,
        center: { lat: places[0].lat, lng: places[0].lng },
        disableDefaultUI: true,
        gestureHandling: 'greedy',
      })
      const bounds = new window.google.maps.LatLngBounds()
      const path = []
      places.forEach((p, i) => {
        const position = { lat: p.lat, lng: p.lng }
        new window.google.maps.Marker({
          position,
          map,
          label: String(i + 1),
          title: p.name,
        })
        path.push(position)
        bounds.extend(position)
      })
      if (path.length > 1) {
        new window.google.maps.Polyline({
          path,
          map,
          strokeColor: '#111111',
          strokeOpacity: 0.7,
          strokeWeight: 3,
        })
        map.fitBounds(bounds)
      }
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (places.length === 0) return null

  return <div ref={mapRef} className="places-map recap-map" />
}

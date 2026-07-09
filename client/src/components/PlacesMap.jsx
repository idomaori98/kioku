import { useEffect, useRef } from 'react'
import { loadGoogleMaps } from '../lib/googleMaps'

export function PlacesMap({ places }) {
  const mapRef = useRef(null)
  const key = places.map((p) => p.id).join(',')

  useEffect(() => {
    let cancelled = false
    const valid = places.filter((p) => p.lat != null && p.lng != null)
    if (valid.length === 0) return

    loadGoogleMaps().then(() => {
      if (cancelled || !mapRef.current) return
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 13,
        center: { lat: valid[0].lat, lng: valid[0].lng },
        disableDefaultUI: true,
      })
      const bounds = new window.google.maps.LatLngBounds()
      valid.forEach((p, i) => {
        const marker = new window.google.maps.Marker({
          position: { lat: p.lat, lng: p.lng },
          map,
          label: String(i + 1),
          title: p.name,
        })
        bounds.extend(marker.getPosition())
      })
      if (valid.length > 1) map.fitBounds(bounds)
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (places.filter((p) => p.lat != null && p.lng != null).length === 0) return null

  return <div ref={mapRef} className="places-map" />
}

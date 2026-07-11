import { useEffect, useRef } from 'react'
import { loadGoogleMaps } from '../lib/googleMaps'

export function PlacesMap({ places, focusRequest }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef({})
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
      mapInstanceRef.current = map
      markersRef.current = {}
      const bounds = new window.google.maps.LatLngBounds()
      valid.forEach((p, i) => {
        const marker = new window.google.maps.Marker({
          position: { lat: p.lat, lng: p.lng },
          map,
          label: String(i + 1),
          title: p.name,
        })
        markersRef.current[p.id] = marker
        bounds.extend(marker.getPosition())
      })
      if (valid.length > 1) map.fitBounds(bounds)
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    if (!focusRequest) return
    const map = mapInstanceRef.current
    const marker = markersRef.current[focusRequest.id]
    if (!map || !marker) return
    map.panTo(marker.getPosition())
    if (map.getZoom() < 15) map.setZoom(15)
    marker.setAnimation(window.google.maps.Animation.BOUNCE)
    const timeout = setTimeout(() => marker.setAnimation(null), 1400)
    return () => clearTimeout(timeout)
  }, [focusRequest])

  if (places.filter((p) => p.lat != null && p.lng != null).length === 0) return null

  return <div ref={mapRef} className="places-map" />
}

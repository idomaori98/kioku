import { StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { useTheme } from '@/lib/theme'

export type MapMarker = { lat: number; lng: number; label?: string }

// An interactive Leaflet map inside a WebView (works in Expo Go, no API key).
// Light uses OSM tiles; dark uses CARTO dark tiles so it matches the theme.
export function TripMap({
  markers,
  height = 200,
  interactive = true,
  radius = 12,
}: {
  markers: MapMarker[]
  height?: number
  interactive?: boolean
  radius?: number
}) {
  const KIOKU = useTheme()
  const tiles = KIOKU.isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

  const html = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{height:100%;margin:0;padding:0;background:${KIOKU.surfaceAlt}}.leaflet-container{background:${KIOKU.surfaceAlt}}</style>
</head><body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var MK = ${JSON.stringify(markers)};
  var on = ${interactive ? 'true' : 'false'};
  var map = L.map('map', { zoomControl: on, attributionControl: false, dragging: on, scrollWheelZoom: on, doubleClickZoom: on, boxZoom: on, keyboard: on, tap: on, touchZoom: on });
  L.tileLayer('${tiles}', { maxZoom: 19, subdomains: 'abcd' }).addTo(map);
  var pts = [];
  MK.forEach(function (m) {
    var cm = L.circleMarker([m.lat, m.lng], { radius: 8, color: '#ffffff', weight: 2, fillColor: '${KIOKU.accent}', fillOpacity: 1 }).addTo(map);
    if (m.label) cm.bindPopup(m.label);
    pts.push([m.lat, m.lng]);
  });
  if (pts.length === 1) map.setView(pts[0], 13);
  else if (pts.length > 1) map.fitBounds(pts, { padding: [28, 28] });
  else map.setView([35.68, 139.76], 3);
</script>
</body></html>`

  return (
    <View style={[styles.wrap, { height, borderRadius: radius, borderColor: KIOKU.border }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={{ backgroundColor: KIOKU.surfaceAlt }}
        scrollEnabled={false}
        pointerEvents={interactive ? 'auto' : 'none'}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', borderWidth: 1 },
})

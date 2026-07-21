import { useCallback, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api, type PublicTrip, type PublicDay } from '@/lib/api'
import { KIOKU } from '@/constants/kioku'
import { ErrorState, Loading } from '@/components/ui'

const TRAVEL_LABEL: Record<PublicTrip['travelType'], string> = {
  family: 'Family',
  couple: 'Couple',
  solo: 'Solo',
  friends: 'Friends',
}

function formatRange(start: string, end: string) {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' }
  const s = new Date(`${start.slice(0, 10)}T00:00:00Z`).toLocaleDateString(undefined, opts)
  const e = new Date(`${end.slice(0, 10)}T00:00:00Z`).toLocaleDateString(undefined, { ...opts, year: 'numeric' })
  return `${s} – ${e}`
}

// Mirrors formatDayLabel in client/src/lib/days.js — day is a date key string.
function formatDayLabel(dayKey: string) {
  return new Date(`${dayKey}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [trip, setTrip] = useState<PublicTrip | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!id) return
    setError(null)
    setTrip(null)
    api
      .getItinerary(id)
      .then(setTrip)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
  }, [id])

  useFocusEffect(load)

  const cover = trip?.days.flatMap((d) => d.photos)[0]?.url ?? null

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      {error ? (
        <View style={[styles.centered, { paddingTop: insets.top }]}>
          <ErrorState message={error} onRetry={load} />
        </View>
      ) : !trip ? (
        <View style={[styles.centered, { paddingTop: insets.top }]}>
          <Loading />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
          {/* Hero */}
          <View style={styles.hero}>
            {cover ? (
              <Image source={{ uri: cover }} style={styles.heroImg} contentFit="cover" transition={200} />
            ) : (
              <View style={[styles.heroImg, styles.heroEmpty]}>
                <Ionicons name="image-outline" size={48} color={KIOKU.borderStrong} />
              </View>
            )}
            <View style={styles.heroScrim} />
            <View style={styles.heroText}>
              <Text style={styles.heroName} numberOfLines={2}>
                {trip.name}
              </Text>
              <Text style={styles.heroMeta} numberOfLines={1}>
                {trip.destination ? `${trip.destination} · ` : ''}
                {formatRange(trip.startDate, trip.endDate)}
              </Text>
            </View>
          </View>

          <Pressable
            style={[styles.back, { top: insets.top + 8 }]}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/discover'))}
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>

          {/* Byline + stats */}
          <View style={styles.body}>
            <Text style={styles.byline}>
              by {trip.createdByName ?? 'Unknown'} · {TRAVEL_LABEL[trip.travelType]}
            </Text>

            <View style={styles.stats}>
              <Stat icon="calendar-outline" value={trip.stats.days} label="days" />
              <Stat icon="location-outline" value={trip.stats.places} label="places" />
              <Stat icon="images-outline" value={trip.stats.photos} label="photos" />
              <Stat icon="heart-outline" value={trip.likesCount} label="likes" />
            </View>

            {/* Map placeholder — real map lands with the dev-build step */}
            <View style={styles.mapStub}>
              <Ionicons name="map-outline" size={20} color={KIOKU.inkMuted} />
              <Text style={styles.mapStubText}>Map view coming soon</Text>
            </View>

            {/* Itinerary */}
            <Text style={styles.sectionTitle}>Itinerary</Text>
            {trip.days.map((day, i) => (
              <DayBlock key={day.day} day={day} index={i} />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  )
}

function Stat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={17} color={KIOKU.accent} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function DayBlock({ day, index }: { day: PublicDay; index: number }) {
  const empty = day.places.length === 0 && day.photos.length === 0 && !day.note.trim()
  return (
    <View style={styles.day}>
      <View style={styles.dayHeader}>
        <View style={styles.dayBadge}>
          <Text style={styles.dayBadgeText}>{index + 1}</Text>
        </View>
        <View>
          <Text style={styles.dayTitle}>Day {index + 1}</Text>
          <Text style={styles.dayDate}>{formatDayLabel(day.day)}</Text>
        </View>
      </View>

      {empty ? (
        <Text style={styles.dayEmpty}>No plans logged for this day.</Text>
      ) : (
        <>
          {day.note.trim() ? <Text style={styles.dayNote}>{day.note.trim()}</Text> : null}

          {day.places.map((p) => (
            <View key={p.id} style={styles.place}>
              <Ionicons name="location" size={15} color={KIOKU.accent} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.placeName}>{p.name}</Text>
                {p.address ? (
                  <Text style={styles.placeAddr} numberOfLines={1}>
                    {p.address}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}

          {day.photos.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
              {day.photos.map((ph) => (
                <Image key={ph.id} source={{ uri: ph.url }} style={styles.photo} contentFit="cover" transition={150} />
              ))}
            </ScrollView>
          ) : null}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: KIOKU.bg },
  centered: { flex: 1, justifyContent: 'center' },

  hero: { height: 280, position: 'relative', backgroundColor: KIOKU.surfaceAlt },
  heroImg: { width: '100%', height: '100%' },
  heroEmpty: { alignItems: 'center', justifyContent: 'center' },
  heroScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 140, backgroundColor: 'rgba(24,14,9,0.34)' },
  heroText: { position: 'absolute', left: 20, right: 20, bottom: 18 },
  heroName: { fontSize: 27, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  heroMeta: { fontSize: 14, color: 'rgba(255,255,255,0.94)', marginTop: 3 },

  back: {
    position: 'absolute',
    left: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(24,14,9,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: { paddingHorizontal: 20, paddingTop: 18 },
  byline: { fontSize: 14, color: KIOKU.inkMuted, fontWeight: '600' },

  stats: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: KIOKU.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: KIOKU.border,
    paddingVertical: 14,
  },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontSize: 17, fontWeight: '800', color: KIOKU.ink },
  statLabel: { fontSize: 11.5, color: KIOKU.inkMuted },

  mapStub: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: KIOKU.borderStrong,
    backgroundColor: KIOKU.surfaceAlt,
  },
  mapStubText: { fontSize: 13.5, color: KIOKU.inkMuted, fontWeight: '600' },

  sectionTitle: { fontSize: 20, fontWeight: '800', color: KIOKU.ink, marginTop: 28, marginBottom: 4, letterSpacing: -0.3 },

  day: { marginTop: 18 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  dayBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: KIOKU.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  dayTitle: { fontSize: 17, fontWeight: '700', color: KIOKU.ink },
  dayDate: { fontSize: 12.5, color: KIOKU.inkMuted, marginTop: 1 },
  dayEmpty: { fontSize: 14, color: KIOKU.inkMuted, fontStyle: 'italic' },
  dayNote: { fontSize: 15, lineHeight: 21, color: KIOKU.ink, marginBottom: 10 },

  place: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  placeName: { fontSize: 15, fontWeight: '600', color: KIOKU.ink },
  placeAddr: { fontSize: 13, color: KIOKU.inkMuted, marginTop: 1 },

  photoRow: { marginTop: 4 },
  photo: { width: 130, height: 130, borderRadius: 12, marginRight: 10, backgroundColor: KIOKU.surfaceAlt },
})

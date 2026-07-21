import { useCallback, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api, type Trip } from '@/lib/api'
import { KIOKU } from '@/constants/kioku'
import { EmptyState, ErrorState, Loading, Screen, ScreenTitle } from '@/components/ui'

function formatRange(trip: Trip) {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  const start = new Date(trip.startDate).toLocaleDateString(undefined, opts)
  const end = new Date(trip.endDate).toLocaleDateString(undefined, opts)
  return `${start} – ${end}`
}

export default function TripsScreen() {
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setError(null)
    setTrips(null)
    api
      .listTrips()
      .then(setTrips)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
  }, [])

  useFocusEffect(load)

  return (
    <Screen>
      <ScreenTitle
        title="Your trips"
        subtitle="Plan and revisit your journeys"
        action={
          <Pressable style={styles.addBtn} onPress={() => router.push('/new-trip')} hitSlop={8}>
            <Ionicons name="add" size={24} color="#fff" />
          </Pressable>
        }
      />
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !trips ? (
        <Loading />
      ) : trips.length === 0 ? (
        <EmptyState icon="map-outline" title="No trips yet" message="Your planned trips will appear here." />
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/trip/${item.id}`)}>
              <View style={styles.iconWrap}>
                <Ionicons name="airplane-outline" size={18} color={KIOKU.accent} />
              </View>
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {item.destination ? `${item.destination} · ` : ''}
                  {formatRange(item)}
                </Text>
              </View>
              {item.endedAt ? (
                <Ionicons name="lock-closed-outline" size={15} color={KIOKU.inkMuted} />
              ) : null}
            </Pressable>
          )}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: KIOKU.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: KIOKU.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: KIOKU.border,
    padding: 14,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: KIOKU.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 16, fontWeight: '600', color: KIOKU.ink },
  sub: { fontSize: 13, color: KIOKU.inkMuted, marginTop: 2 },
})

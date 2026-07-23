import { useCallback, useState } from 'react'
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api, type Trip } from '@/lib/api'
import { useStyles, type Theme } from '@/lib/theme'
import { EmptyState, ErrorState, Screen, ScreenTitle } from '@/components/ui'
import { ListSkeleton } from '@/components/Skeleton'
import { SwipeableRow } from '@/components/SwipeableRow'

function formatRange(trip: Trip) {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  const start = new Date(trip.startDate).toLocaleDateString(undefined, opts)
  const end = new Date(trip.endDate).toLocaleDateString(undefined, opts)
  return `${start} – ${end}`
}

export default function TripsScreen() {
  const router = useRouter()
  const [styles, KIOKU] = useStyles(makeStyles)
  const [trips, setTrips] = useState<Trip[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTrips = useCallback((mode: 'load' | 'refresh') => {
    setError(null)
    if (mode === 'load') setTrips(null)
    else setRefreshing(true)
    api
      .listTrips()
      .then(setTrips)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setRefreshing(false))
  }, [])

  const load = useCallback(() => fetchTrips('load'), [fetchTrips])
  useFocusEffect(load)

  function confirmDelete(trip: Trip) {
    Alert.alert(
      `Delete "${trip.name}"?`,
      'This permanently deletes the whole trip — all its days, places, expenses, and photos. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete trip',
          style: 'destructive',
          onPress: () => {
            setTrips((prev) => prev?.filter((t) => t.id !== trip.id) ?? prev)
            api.deleteTrip(trip.id).catch(() => {
              Alert.alert('Could not delete', 'Something went wrong. Pull to refresh and try again.')
              load()
            })
          },
        },
      ]
    )
  }

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
        <ListSkeleton />
      ) : trips.length === 0 ? (
        <EmptyState
          icon="map-outline"
          title="Start your first trip"
          message="Tap the + above to plan a trip — days, places, expenses, and photos."
        />
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchTrips('refresh')} tintColor={KIOKU.accent} colors={[KIOKU.accent]} />
          }
          renderItem={({ item }) => (
            <SwipeableRow containerStyle={styles.swipeRow} onDelete={() => confirmDelete(item)}>
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
            </SwipeableRow>
          )}
        />
      )}
    </Screen>
  )
}

function makeStyles(KIOKU: Theme) {
  return StyleSheet.create({
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: KIOKU.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  swipeRow: { borderRadius: 16, overflow: 'hidden' },
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
}

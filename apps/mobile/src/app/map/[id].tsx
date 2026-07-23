import { useCallback, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api, type PublicTrip } from '@/lib/api'
import { useStyles, type Theme } from '@/lib/theme'
import { EmptyState, ErrorState, Loading } from '@/components/ui'
import { TripMap, type MapMarker } from '@/components/TripMap'

type Pin = MapMarker & { id: string; day: string }

export default function TripMapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [styles, KIOKU] = useStyles(makeStyles)
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

  const pins: Pin[] = trip
    ? trip.days.flatMap((d) =>
        d.places
          .filter((p) => p.lat != null && p.lng != null)
          .map((p) => ({ id: p.id, day: d.day, lat: p.lat as number, lng: p.lng as number, label: p.name }))
      )
    : []

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.topbarBtn}>
          <Ionicons name="chevron-back" size={24} color={KIOKU.ink} />
        </Pressable>
        <Text style={styles.topbarTitle} numberOfLines={1}>
          {trip?.name ?? 'Trip map'}
        </Text>
        <View style={styles.topbarBtn} />
      </View>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !trip ? (
        <Loading />
      ) : pins.length === 0 ? (
        <EmptyState
          icon="map-outline"
          title="No places on the map yet"
          message="Places with a location will appear here as pins."
        />
      ) : (
        <FlatList
          data={pins}
          keyExtractor={(p) => p.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          ListHeaderComponent={
            <View style={styles.mapWrap}>
              <TripMap markers={pins} height={320} radius={0} />
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <View style={styles.pinNum}>
                <Text style={styles.pinNumText}>{index + 1}</Text>
              </View>
              <Text style={styles.rowName}>{item.label}</Text>
            </View>
          )}
        />
      )}
    </View>
  )
}

function makeStyles(KIOKU: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: KIOKU.bg },
    topbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      height: 48,
      borderBottomWidth: 1,
      borderBottomColor: KIOKU.border,
    },
    topbarBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    topbarTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: KIOKU.ink },
    mapWrap: { marginBottom: 8 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: KIOKU.border,
    },
    pinNum: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: KIOKU.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pinNumText: { color: '#fff', fontSize: 13, fontWeight: '800' },
    rowName: { flex: 1, fontSize: 15, fontWeight: '600', color: KIOKU.ink },
  })
}

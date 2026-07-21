import { useCallback, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { api, type FeedCard } from '@/lib/api'
import { KIOKU } from '@/constants/kioku'
import { EmptyState, ErrorState, Loading, Screen, ScreenTitle } from '@/components/ui'

const TRAVEL_LABEL: Record<FeedCard['travelType'], string> = {
  family: 'Family',
  couple: 'Couple',
  solo: 'Solo',
  friends: 'Friends',
}

export default function DiscoverScreen() {
  const [cards, setCards] = useState<FeedCard[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setError(null)
    setCards(null)
    api
      .getFeed()
      .then((res) => setCards(res.cards))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
  }, [])

  useFocusEffect(load)

  return (
    <Screen>
      <ScreenTitle title="Discover" subtitle="Trips shared by fellow travelers" />
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !cards ? (
        <Loading />
      ) : cards.length === 0 ? (
        <EmptyState icon="compass-outline" title="Nothing here yet" message="Published trips will appear here." />
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <FeedCardView card={item} />}
        />
      )}
    </Screen>
  )
}

function FeedCardView({ card }: { card: FeedCard }) {
  const router = useRouter()
  return (
    <Pressable style={styles.card} onPress={() => router.push(`/trip/${card.id}`)}>
      <View style={styles.cover}>
        {card.coverPhotoUrl ? (
          <Image source={{ uri: card.coverPhotoUrl }} style={styles.coverImg} contentFit="cover" transition={200} />
        ) : (
          <View style={[styles.coverImg, styles.coverEmpty]}>
            <Ionicons name="compass-outline" size={40} color={KIOKU.borderStrong} />
          </View>
        )}
        <View style={styles.likePill}>
          <Ionicons name="heart" size={13} color={KIOKU.accent} />
          <Text style={styles.likeText}>{card.likesCount}</Text>
        </View>
        <View style={styles.overlay}>
          <Text style={styles.name} numberOfLines={1}>
            {card.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {card.destination ? `${card.destination} · ` : ''}
            {card.days} day{card.days === 1 ? '' : 's'} · {TRAVEL_LABEL[card.travelType]}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 16 },
  card: { borderRadius: 20, overflow: 'hidden', backgroundColor: KIOKU.surfaceAlt },
  cover: { height: 230, position: 'relative' },
  coverImg: { width: '100%', height: '100%' },
  coverEmpty: { backgroundColor: KIOKU.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  likePill: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  likeText: { fontSize: 12, fontWeight: '700', color: KIOKU.ink },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    paddingTop: 40,
    // simple bottom scrim until the design pass adds a real gradient
    backgroundColor: 'rgba(24,14,9,0.42)',
  },
  name: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  meta: { fontSize: 13.5, color: 'rgba(255,255,255,0.92)', marginTop: 2 },
})

import { useCallback, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { api, type FeedCard } from '@/lib/api'
import { FONT } from '@/constants/kioku'
import { useStyles, type Theme } from '@/lib/theme'
import { EmptyState, ErrorState, Loading, Screen, ScreenTitle } from '@/components/ui'
import { PressableScale } from '@/components/PressableScale'

const TRAVEL_LABEL: Record<FeedCard['travelType'], string> = {
  family: 'Family',
  couple: 'Couple',
  solo: 'Solo',
  friends: 'Friends',
}

type Scope = 'all' | 'following'

export default function DiscoverScreen() {
  const [styles, KIOKU] = useStyles(makeStyles)
  const [scope, setScope] = useState<Scope>('all')
  const [cards, setCards] = useState<FeedCard[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setError(null)
    setCards(null)
    api
      .getFeed(scope === 'following' ? { scope: 'following' } : {})
      .then((res) => setCards(res.cards))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
  }, [scope])

  useFocusEffect(load)

  const toggleLike = useCallback((id: string) => {
    setCards((prev) => {
      if (!prev) return prev
      const card = prev.find((c) => c.id === id)
      if (!card) return prev
      const liked = card.likedByMe
      // Fire-and-forget with optimistic update; revert this card on failure.
      ;(liked ? api.unlikeTrip(id) : api.likeTrip(id)).catch(() => {
        setCards((cur) =>
          cur
            ? cur.map((c) =>
                c.id === id ? { ...c, likedByMe: liked, likesCount: c.likesCount + (liked ? 1 : -1) } : c
              )
            : cur
        )
      })
      return prev.map((c) =>
        c.id === id ? { ...c, likedByMe: !liked, likesCount: c.likesCount + (liked ? -1 : 1) } : c
      )
    })
  }, [])

  return (
    <Screen>
      <ScreenTitle title="Discover" subtitle="Trips shared by fellow travelers" />

      <View style={styles.segment}>
        {(['all', 'following'] as Scope[]).map((s) => (
          <Pressable key={s} style={[styles.segItem, scope === s && styles.segItemOn]} onPress={() => setScope(s)}>
            <Text style={[styles.segText, scope === s && styles.segTextOn]}>
              {s === 'all' ? 'For you' : 'Following'}
            </Text>
          </Pressable>
        ))}
      </View>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !cards ? (
        <Loading />
      ) : cards.length === 0 ? (
        <EmptyState
          icon={scope === 'following' ? 'people-outline' : 'compass-outline'}
          title={scope === 'following' ? 'Nothing from people you follow' : 'Nothing here yet'}
          message={
            scope === 'following'
              ? 'Follow travelers and their published trips show up here.'
              : 'Published trips will appear here.'
          }
        />
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <FeedCardView card={item} onToggleLike={toggleLike} />}
        />
      )}
    </Screen>
  )
}

function FeedCardView({ card, onToggleLike }: { card: FeedCard; onToggleLike: (id: string) => void }) {
  const router = useRouter()
  const [styles, KIOKU] = useStyles(makeStyles)
  return (
    <PressableScale style={styles.card} onPress={() => router.push(`/trip/${card.id}`)}>
      <View style={styles.cover}>
        {card.coverPhotoUrl ? (
          <Image source={{ uri: card.coverPhotoUrl }} style={styles.coverImg} contentFit="cover" transition={200} />
        ) : (
          <View style={[styles.coverImg, styles.coverEmpty]}>
            <Ionicons name="compass-outline" size={40} color={KIOKU.borderStrong} />
          </View>
        )}
        <Pressable style={styles.likePill} onPress={() => onToggleLike(card.id)} hitSlop={8}>
          <Ionicons name={card.likedByMe ? 'heart' : 'heart-outline'} size={14} color={KIOKU.accent} />
          <Text style={styles.likeText}>{card.likesCount}</Text>
        </Pressable>
        <View style={styles.overlay}>
          <Text style={styles.name} numberOfLines={1}>
            {card.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {card.destination ? `${card.destination} · ` : ''}
            {card.days} day{card.days === 1 ? '' : 's'} · {TRAVEL_LABEL[card.travelType]}
          </Text>
          {card.createdByName ? (
            <Pressable
              style={styles.author}
              hitSlop={6}
              onPress={() => router.push(`/user/${card.createdBy}`)}
            >
              <Ionicons name="person-circle-outline" size={15} color="rgba(255,255,255,0.92)" />
              <Text style={styles.authorText}>{card.createdByName}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </PressableScale>
  )
}

function makeStyles(KIOKU: Theme) {
  return StyleSheet.create({
  segment: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: KIOKU.surfaceAlt,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 9 },
  segItemOn: { backgroundColor: KIOKU.surface },
  segText: { fontSize: 14, fontWeight: '700', color: KIOKU.inkMuted },
  segTextOn: { color: KIOKU.ink },

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
  name: { fontSize: 23, fontFamily: FONT.displayHeavy, color: '#fff', letterSpacing: -0.3 },
  meta: { fontSize: 13.5, color: 'rgba(255,255,255,0.92)', marginTop: 2 },
  author: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  authorText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.92)' },
  })
}

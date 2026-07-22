import { useCallback, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { api, type Conversation } from '@/lib/api'
import { useStyles, type Theme } from '@/lib/theme'
import { EmptyState, ErrorState, Screen, ScreenTitle } from '@/components/ui'
import { ListSkeleton } from '@/components/Skeleton'

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function MessagesScreen() {
  const router = useRouter()
  const [styles, KIOKU] = useStyles(makeStyles)
  const [items, setItems] = useState<Conversation[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setError(null)
    api
      .getConversations()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
  }, [])

  useFocusEffect(load)

  return (
    <Screen>
      <ScreenTitle
        title="Messages"
        subtitle="Chats with people you follow"
        action={
          <Pressable style={styles.findBtn} onPress={() => router.push('/search-people')} hitSlop={8}>
            <Ionicons name="search" size={20} color={KIOKU.ink} />
          </Pressable>
        }
      />
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !items ? (
        <ListSkeleton avatarRound />
      ) : items.length === 0 ? (
        <EmptyState
          icon="chatbubble-outline"
          title="No messages yet"
          message="Open someone's profile and tap Message to start a chat."
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.user.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => router.push(`/dm/${item.user.id}?name=${encodeURIComponent(item.user.name)}`)}>
              <View style={styles.avatar}>
                {item.user.photoUrl ? (
                  <Image source={{ uri: item.user.photoUrl }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarInitial}>{item.user.name.charAt(0).toUpperCase()}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.topLine}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.user.name}
                  </Text>
                  <Text style={styles.time}>{timeAgo(item.lastMessageAt)}</Text>
                </View>
                <Text style={[styles.preview, item.unreadCount > 0 && styles.previewUnread]} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              </View>
              {item.unreadCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.unreadCount}</Text>
                </View>
              ) : null}
            </Pressable>
          )}
        />
      )}
    </Screen>
  )
}

function makeStyles(KIOKU: Theme) {
  return StyleSheet.create({
  findBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: KIOKU.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: KIOKU.surface,
    borderWidth: 1,
    borderColor: KIOKU.border,
    borderRadius: 14,
    padding: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: KIOKU.accent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarInitial: { color: '#fff', fontSize: 20, fontWeight: '700' },
  topLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  name: { flex: 1, fontSize: 15.5, fontWeight: '700', color: KIOKU.ink },
  time: { fontSize: 12, color: KIOKU.inkMuted, marginLeft: 8 },
  preview: { fontSize: 14, color: KIOKU.inkMuted },
  previewUnread: { color: KIOKU.ink, fontWeight: '600' },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: KIOKU.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  })
}

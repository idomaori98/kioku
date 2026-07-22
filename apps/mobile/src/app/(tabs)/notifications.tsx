import { useCallback, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { api, type AppNotification, type NotificationType } from '@/lib/api'
import { KIOKU } from '@/constants/kioku'
import { EmptyState, ErrorState, Loading, Screen, ScreenTitle } from '@/components/ui'

const ICON: Record<NotificationType, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  like: { name: 'heart', color: KIOKU.accent },
  comment: { name: 'chatbubble', color: '#3f7cac' },
  follow: { name: 'person-add', color: '#0f6e56' },
  trip_copied: { name: 'copy', color: '#b5548f' },
  friend_request: { name: 'person', color: KIOKU.inkMuted },
  friend_accept: { name: 'people', color: '#0f6e56' },
}

function messageFor(n: AppNotification) {
  const who = n.actor?.name ?? 'Someone'
  switch (n.type) {
    case 'like':
      return `${who} liked ${n.tripName || 'your trip'}`
    case 'comment':
      return `${who} commented on ${n.tripName || 'your trip'}`
    case 'follow':
      return `${who} started following you`
    case 'trip_copied':
      return `${who} copied ${n.tripName || 'your trip'}`
    case 'friend_request':
      return `${who} sent you a friend request`
    case 'friend_accept':
      return `${who} accepted your friend request`
    default:
      return who
  }
}

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

export default function NotificationsScreen() {
  const router = useRouter()
  const [items, setItems] = useState<AppNotification[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setError(null)
    api
      .getNotifications()
      .then((list) => {
        setItems(list)
        // Opening the tab clears the unread state.
        if (list.some((n) => !n.read)) api.markAllNotificationsRead().catch(() => {})
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
  }, [])

  useFocusEffect(load)

  function open(n: AppNotification) {
    if ((n.type === 'like' || n.type === 'comment' || n.type === 'trip_copied') && n.tripId) {
      router.push(`/trip/${n.tripId}`)
    } else if (n.actor) {
      router.push(`/user/${n.actor.id}`)
    }
  }

  return (
    <Screen>
      <ScreenTitle title="Alerts" subtitle="Likes, comments, and new followers" />
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !items ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState icon="notifications-outline" title="No alerts yet" message="Likes, comments, and follows will show up here." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const ic = ICON[item.type]
            return (
              <Pressable style={[styles.row, !item.read && styles.rowUnread]} onPress={() => open(item)}>
                <View style={styles.avatarWrap}>
                  {item.actor?.photoUrl ? (
                    <Image source={{ uri: item.actor.photoUrl }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <Text style={styles.avatarInitial}>{(item.actor?.name ?? '?').charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={[styles.badge, { backgroundColor: ic.color }]}>
                    <Ionicons name={ic.name} size={11} color="#fff" />
                  </View>
                </View>
                <Text style={styles.text}>
                  {messageFor(item)} <Text style={styles.time}>· {timeAgo(item.createdAt)}</Text>
                </Text>
                {!item.read ? <View style={styles.dot} /> : null}
              </Pressable>
            )
          }}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 8 },
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
  rowUnread: { backgroundColor: KIOKU.accentSoft, borderColor: KIOKU.accentSoft },
  avatarWrap: { width: 44, height: 44 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: KIOKU.surfaceAlt },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: KIOKU.accent },
  avatarInitial: { color: '#fff', fontSize: 17, fontWeight: '700' },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: KIOKU.surface,
  },
  text: { flex: 1, fontSize: 14.5, lineHeight: 20, color: KIOKU.ink },
  time: { color: KIOKU.inkMuted, fontWeight: '500' },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: KIOKU.accent },
})

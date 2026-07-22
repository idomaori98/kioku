import { useCallback, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api, type UserLite } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { KIOKU } from '@/constants/kioku'
import { EmptyState, ErrorState, Loading } from '@/components/ui'

export default function ShareTripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [people, setPeople] = useState<UserLite[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sendingTo, setSendingTo] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!user) return
    setError(null)
    // People you can message: anyone you follow or who follows you.
    Promise.all([api.getFollowing(user.id), api.getFollowers(user.id)])
      .then(([following, followers]) => {
        const byId = new Map<string, UserLite>()
        for (const u of [...following, ...followers]) byId.set(u.id, u)
        setPeople([...byId.values()])
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
  }, [user])

  useFocusEffect(load)

  async function share(to: UserLite) {
    if (!id || sendingTo) return
    setSendingTo(to.id)
    try {
      await api.sendMessage(to.id, { sharedTripId: id })
      router.replace(`/dm/${to.id}?name=${encodeURIComponent(to.name)}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not share')
      setSendingTo(null)
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.topbarBtn}>
          <Ionicons name="close" size={24} color={KIOKU.ink} />
        </Pressable>
        <Text style={styles.topbarTitle}>Share trip</Text>
        <View style={styles.topbarBtn} />
      </View>

      {error && !people ? (
        <ErrorState message={error} onRetry={load} />
      ) : !people ? (
        <Loading />
      ) : (
        <FlatList
          data={people}
          keyExtractor={(u) => u.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No one to share with yet"
              message="Follow travelers (or get followers) to share trips in a chat."
            />
          }
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => share(item)} disabled={!!sendingTo}>
              <View style={styles.avatar}>
                {item.photoUrl ? (
                  <Image source={{ uri: item.photoUrl }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarInitial}>{item.name.charAt(0).toUpperCase()}</Text>
                )}
              </View>
              <Text style={styles.name}>{item.name}</Text>
              {sendingTo === item.id ? (
                <Text style={styles.sending}>Sending…</Text>
              ) : (
                <View style={styles.sendPill}>
                  <Ionicons name="paper-plane-outline" size={14} color="#fff" />
                  <Text style={styles.sendText}>Send</Text>
                </View>
              )}
            </Pressable>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
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
  topbarTitle: { fontSize: 17, fontWeight: '700', color: KIOKU.ink },

  list: { padding: 16, gap: 6, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: KIOKU.surface,
    borderWidth: 1,
    borderColor: KIOKU.border,
    borderRadius: 12,
    padding: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: KIOKU.accent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarInitial: { color: '#fff', fontSize: 17, fontWeight: '700' },
  name: { flex: 1, fontSize: 15, fontWeight: '600', color: KIOKU.ink },
  sending: { fontSize: 13, color: KIOKU.inkMuted, fontWeight: '600' },
  sendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: KIOKU.accent,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  sendText: { color: '#fff', fontSize: 13, fontWeight: '700' },
})

import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api, type UserLite } from '@/lib/api'
import { useStyles, type Theme } from '@/lib/theme'
import { EmptyState, ErrorState, Loading } from '@/components/ui'

type Tab = 'followers' | 'following'

export default function ConnectionsScreen() {
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [styles, KIOKU] = useStyles(makeStyles)
  const [active, setActive] = useState<Tab>(tab === 'following' ? 'following' : 'followers')
  const [users, setUsers] = useState<UserLite[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!id) return
    setError(null)
    setUsers(null)
    const req = active === 'followers' ? api.getFollowers(id) : api.getFollowing(id)
    req.then(setUsers).catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
  }, [id, active])

  useEffect(load, [load])

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.topbarBtn}>
          <Ionicons name="chevron-back" size={24} color={KIOKU.ink} />
        </Pressable>
        <Text style={styles.topbarTitle}>Connections</Text>
        <View style={styles.topbarBtn} />
      </View>

      <View style={styles.tabs}>
        {(['followers', 'following'] as Tab[]).map((t) => (
          <Pressable key={t} style={styles.tab} onPress={() => setActive(t)}>
            <Text style={[styles.tabText, active === t && styles.tabTextOn]}>
              {t === 'followers' ? 'Followers' : 'Following'}
            </Text>
            {active === t ? <View style={styles.tabUnderline} /> : null}
          </Pressable>
        ))}
      </View>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !users ? (
        <Loading />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title={active === 'followers' ? 'No followers yet' : 'Not following anyone'}
            />
          }
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => router.push(`/user/${item.id}`)}>
              <View style={styles.avatar}>
                {item.photoUrl ? (
                  <Image source={{ uri: item.photoUrl }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarInitial}>{item.name.charAt(0).toUpperCase()}</Text>
                )}
              </View>
              <Text style={styles.name}>{item.name}</Text>
              <Ionicons name="chevron-forward" size={18} color={KIOKU.borderStrong} />
            </Pressable>
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
  },
  topbarBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topbarTitle: { fontSize: 17, fontWeight: '700', color: KIOKU.ink },

  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: KIOKU.border },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 15, fontWeight: '700', color: KIOKU.inkMuted },
  tabTextOn: { color: KIOKU.ink },
  tabUnderline: { position: 'absolute', bottom: -1, height: 2, width: 60, backgroundColor: KIOKU.accent, borderRadius: 1 },

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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: KIOKU.accent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarInitial: { color: '#fff', fontSize: 17, fontWeight: '700' },
  name: { flex: 1, fontSize: 15, fontWeight: '600', color: KIOKU.ink },
  })
}

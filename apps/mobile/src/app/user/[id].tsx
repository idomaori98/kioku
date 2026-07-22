import { useCallback, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api, type UserProfile, type FeedCard } from '@/lib/api'
import { KIOKU } from '@/constants/kioku'
import { ErrorState, Loading } from '@/components/ui'

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    if (!id) return
    setError(null)
    api
      .getProfile(id)
      .then(setProfile)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
  }, [id])

  useFocusEffect(load)

  async function toggleFollow() {
    if (!profile || busy) return
    const following = profile.isFollowedByMe
    setBusy(true)
    setProfile({
      ...profile,
      isFollowedByMe: !following,
      followerCount: profile.followerCount + (following ? -1 : 1),
    })
    try {
      await (following ? api.unfollowUser(profile.id) : api.followUser(profile.id))
    } catch {
      setProfile((p) =>
        p ? { ...p, isFollowedByMe: following, followerCount: p.followerCount + (following ? 1 : -1) } : p
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.topbarBtn}>
          <Ionicons name="chevron-back" size={24} color={KIOKU.ink} />
        </Pressable>
        <Text style={styles.topbarTitle} numberOfLines={1}>
          {profile?.name ?? 'Profile'}
        </Text>
        <View style={styles.topbarBtn} />
      </View>

      {error && !profile ? (
        <ErrorState message={error} onRetry={load} />
      ) : !profile ? (
        <Loading />
      ) : (
        <FlatList
          data={profile.trips}
          keyExtractor={(t) => t.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24, gap: 12 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.avatarBig}>
                {profile.photoUrl ? (
                  <Image source={{ uri: profile.photoUrl }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarInitial}>{profile.name.charAt(0).toUpperCase()}</Text>
                )}
              </View>
              <Text style={styles.name}>{profile.name}</Text>

              <View style={styles.countRow}>
                <Count value={profile.tripCount} label="trips" />
                <Pressable style={styles.count} onPress={() => router.push(`/connections/${profile.id}?tab=followers`)}>
                  <Text style={styles.countValue}>{profile.followerCount}</Text>
                  <Text style={styles.countLabel}>followers</Text>
                </Pressable>
                <Pressable style={styles.count} onPress={() => router.push(`/connections/${profile.id}?tab=following`)}>
                  <Text style={styles.countValue}>{profile.followingCount}</Text>
                  <Text style={styles.countLabel}>following</Text>
                </Pressable>
              </View>

              {!profile.isMe ? (
                <View style={styles.actionRow}>
                  <Pressable
                    style={[styles.followBtn, profile.isFollowedByMe ? styles.followingBtn : styles.notFollowingBtn]}
                    onPress={toggleFollow}
                    disabled={busy}
                  >
                    <Ionicons
                      name={profile.isFollowedByMe ? 'checkmark' : 'person-add'}
                      size={16}
                      color={profile.isFollowedByMe ? KIOKU.ink : '#fff'}
                    />
                    <Text style={[styles.followText, profile.isFollowedByMe ? { color: KIOKU.ink } : { color: '#fff' }]}>
                      {profile.isFollowedByMe ? 'Following' : 'Follow'}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.msgBtn}
                    onPress={() => router.push(`/dm/${profile.id}?name=${encodeURIComponent(profile.name)}`)}
                  >
                    <Ionicons name="chatbubble-outline" size={18} color={KIOKU.ink} />
                  </Pressable>
                </View>
              ) : null}

              <Text style={styles.tripsLabel}>{profile.tripCount > 0 ? 'Published trips' : ''}</Text>
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No published trips yet.</Text>
          }
          renderItem={({ item }) => <TripTile card={item} onPress={() => router.push(`/trip/${item.id}`)} />}
        />
      )}
    </View>
  )
}

function Count({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.count}>
      <Text style={styles.countValue}>{value}</Text>
      <Text style={styles.countLabel}>{label}</Text>
    </View>
  )
}

function TripTile({ card, onPress }: { card: FeedCard; onPress: () => void }) {
  return (
    <Pressable style={styles.tile} onPress={onPress}>
      {card.coverPhotoUrl ? (
        <Image source={{ uri: card.coverPhotoUrl }} style={styles.tileImg} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.tileImg, styles.tileEmpty]}>
          <Ionicons name="image-outline" size={28} color={KIOKU.borderStrong} />
        </View>
      )}
      <View style={styles.tileScrim} />
      <View style={styles.tileLike}>
        <Ionicons name="heart" size={11} color="#fff" />
        <Text style={styles.tileLikeText}>{card.likesCount}</Text>
      </View>
      <Text style={styles.tileName} numberOfLines={2}>
        {card.name}
      </Text>
    </Pressable>
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
  topbarTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: KIOKU.ink },

  header: { alignItems: 'center', paddingTop: 20, paddingBottom: 8, paddingHorizontal: 16 },
  avatarBig: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: KIOKU.accent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarInitial: { color: '#fff', fontSize: 34, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '800', color: KIOKU.ink, marginTop: 12, letterSpacing: -0.3 },

  countRow: { flexDirection: 'row', gap: 26, marginTop: 16 },
  count: { alignItems: 'center' },
  countValue: { fontSize: 18, fontWeight: '800', color: KIOKU.ink },
  countLabel: { fontSize: 12.5, color: KIOKU.inkMuted, marginTop: 1 },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 999,
    paddingHorizontal: 30,
    paddingVertical: 11,
  },
  msgBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: KIOKU.borderStrong,
    backgroundColor: KIOKU.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFollowingBtn: { backgroundColor: KIOKU.accent },
  followingBtn: { backgroundColor: KIOKU.surface, borderWidth: 1, borderColor: KIOKU.borderStrong },
  followText: { fontSize: 15, fontWeight: '700' },

  tripsLabel: { alignSelf: 'flex-start', fontSize: 15, fontWeight: '800', color: KIOKU.ink, marginTop: 24 },
  empty: { textAlign: 'center', color: KIOKU.inkMuted, marginTop: 20, fontSize: 14 },

  tile: { flex: 1, aspectRatio: 0.82, borderRadius: 16, overflow: 'hidden', backgroundColor: KIOKU.surfaceAlt },
  tileImg: { width: '100%', height: '100%' },
  tileEmpty: { alignItems: 'center', justifyContent: 'center' },
  tileScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, backgroundColor: 'rgba(24,14,9,0.4)' },
  tileLike: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(24,14,9,0.45)',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  tileLikeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  tileName: { position: 'absolute', left: 10, right: 10, bottom: 9, color: '#fff', fontSize: 14, fontWeight: '700' },
})

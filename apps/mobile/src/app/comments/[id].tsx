import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api, type TripComment } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { KIOKU } from '@/constants/kioku'
import { EmptyState, ErrorState, Loading } from '@/components/ui'

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function CommentsScreen() {
  const { id, owner } = useLocalSearchParams<{ id: string; owner?: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const isTripOwner = owner === '1'

  const [comments, setComments] = useState<TripComment[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const load = useCallback(() => {
    if (!id) return
    setError(null)
    api
      .getComments(id)
      .then(setComments)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
  }, [id])

  useFocusEffect(load)

  async function send() {
    const text = draft.trim()
    if (!text || sending || !id) return
    setSending(true)
    try {
      const created = await api.addComment(id, text)
      setComments((prev) => [...(prev ?? []), created])
      setDraft('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not post comment')
    } finally {
      setSending(false)
    }
  }

  function remove(c: TripComment) {
    setComments((prev) => prev?.filter((x) => x.id !== c.id) ?? prev)
    api.deleteComment(id!, c.id).catch(() => load())
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.topbarBtn}>
          <Ionicons name="chevron-back" size={24} color={KIOKU.ink} />
        </Pressable>
        <Text style={styles.topbarTitle}>Comments</Text>
        <View style={styles.topbarBtn} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 44}
      >
        {error && !comments ? (
          <ErrorState message={error} onRetry={load} />
        ) : !comments ? (
          <Loading />
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(c) => c.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyState icon="chatbubble-outline" title="No comments yet" message="Be the first to say something." />
            }
            renderItem={({ item }) => {
              const canDelete = isTripOwner || item.user.id === user?.id
              return (
                <View style={styles.row}>
                  {item.user.photoUrl ? (
                    <Image source={{ uri: item.user.photoUrl }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <Text style={styles.avatarInitial}>{item.user.name.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={styles.rowHead}>
                      <Text style={styles.name} onPress={() => router.push(`/user/${item.user.id}`)}>
                        {item.user.name}
                      </Text>
                      <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
                    </View>
                    <Text style={styles.text}>{item.text}</Text>
                  </View>
                  {canDelete ? (
                    <Pressable onPress={() => remove(item)} hitSlop={8} style={styles.del}>
                      <Ionicons name="trash-outline" size={16} color={KIOKU.inkMuted} />
                    </Pressable>
                  ) : null}
                </View>
              )
            }}
          />
        )}

        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment…"
            placeholderTextColor={KIOKU.inkMuted}
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          <Pressable
            style={[styles.send, (!draft.trim() || sending) && styles.sendOff]}
            onPress={send}
            disabled={!draft.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="arrow-up" size={20} color="#fff" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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

  list: { padding: 16, gap: 18, flexGrow: 1 },
  row: { flexDirection: 'row', gap: 11, alignItems: 'flex-start' },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: KIOKU.surfaceAlt },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: KIOKU.accent },
  avatarInitial: { color: '#fff', fontSize: 16, fontWeight: '700' },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  name: { fontSize: 14.5, fontWeight: '700', color: KIOKU.ink },
  time: { fontSize: 12, color: KIOKU.inkMuted },
  text: { fontSize: 15, lineHeight: 20, color: KIOKU.ink },
  del: { padding: 4 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: KIOKU.border,
    backgroundColor: KIOKU.surface,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: KIOKU.bg,
    borderWidth: 1,
    borderColor: KIOKU.border,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: KIOKU.ink,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: KIOKU.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOff: { backgroundColor: KIOKU.borderStrong },
})

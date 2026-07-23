import { useCallback, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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
import { api, type DirectMessage } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useStyles, type Theme } from '@/lib/theme'
import { ErrorState, Loading } from '@/components/ui'

export default function DmThreadScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [styles, KIOKU] = useStyles(makeStyles)
  const listRef = useRef<FlatList<DirectMessage>>(null)

  const [messages, setMessages] = useState<DirectMessage[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const load = useCallback(() => {
    if (!id) return
    setError(null)
    api
      .getMessages(id)
      .then(setMessages)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
  }, [id])

  useFocusEffect(load)

  async function send() {
    const text = draft.trim()
    if (!text || sending || !id) return
    setSending(true)
    try {
      const created = await api.sendMessage(id, { text })
      setMessages((prev) => [...(prev ?? []), created])
      setDraft('')
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send')
    } finally {
      setSending(false)
    }
  }

  function tryDelete(m: DirectMessage) {
    if (m.senderId !== user?.id) return
    if (Date.now() - new Date(m.createdAt).getTime() > 20 * 60 * 1000) {
      Alert.alert('Too late to delete', 'Messages can only be deleted within 20 minutes of sending.')
      return
    }
    Alert.alert('Delete message?', 'This removes it for both of you.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setMessages((prev) => prev?.filter((x) => x.id !== m.id) ?? prev)
          api.deleteDirectMessage(m.id).catch(() => {
            Alert.alert('Could not delete', 'Please try again.')
            load()
          })
        },
      },
    ])
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.topbarBtn}>
          <Ionicons name="chevron-back" size={24} color={KIOKU.ink} />
        </Pressable>
        <Pressable onPress={() => id && router.push(`/user/${id}`)}>
          <Text style={styles.topbarTitle} numberOfLines={1}>
            {name ?? 'Chat'}
          </Text>
        </Pressable>
        <View style={styles.topbarBtn} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 44}
      >
        {error && !messages ? (
          <ErrorState message={error} onRetry={load} />
        ) : !messages ? (
          <Loading />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={<Text style={styles.empty}>Say hi 👋</Text>}
            renderItem={({ item }) => {
              const mine = item.senderId === user?.id
              return (
                <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
                  <Pressable
                    style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}
                    onLongPress={() => tryDelete(item)}
                    delayLongPress={350}
                  >
                    {item.sharedTrip ? (
                      <Pressable style={styles.tripCard} onPress={() => router.push(`/trip/${item.sharedTrip!.id}`)}>
                        {item.sharedTrip.coverPhotoUrl ? (
                          <Image source={{ uri: item.sharedTrip.coverPhotoUrl }} style={styles.tripCover} contentFit="cover" />
                        ) : null}
                        <Text style={styles.tripName}>{item.sharedTrip.name}</Text>
                      </Pressable>
                    ) : null}
                    {item.text ? (
                      <Text style={[styles.bubbleText, mine ? styles.textMine : styles.textTheirs]}>{item.text}</Text>
                    ) : null}
                  </Pressable>
                </View>
              )
            }}
          />
        )}

        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={styles.input}
            placeholder="Message…"
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
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="arrow-up" size={20} color="#fff" />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  topbarTitle: { fontSize: 17, fontWeight: '700', color: KIOKU.ink, maxWidth: 240 },

  list: { padding: 16, gap: 8, flexGrow: 1 },
  empty: { textAlign: 'center', color: KIOKU.inkMuted, marginTop: 24, fontSize: 15 },
  bubbleRow: { flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { backgroundColor: KIOKU.accent, borderBottomRightRadius: 5 },
  bubbleTheirs: { backgroundColor: KIOKU.surface, borderWidth: 1, borderColor: KIOKU.border, borderBottomLeftRadius: 5 },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  textMine: { color: '#fff' },
  textTheirs: { color: KIOKU.ink },

  tripCard: { width: 200, borderRadius: 12, overflow: 'hidden', backgroundColor: KIOKU.surfaceAlt, marginBottom: 6 },
  tripCover: { width: '100%', height: 110 },
  tripName: { fontSize: 14, fontWeight: '700', color: KIOKU.ink, padding: 8 },

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
}

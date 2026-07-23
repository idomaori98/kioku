import { useCallback, useMemo, useRef, useState } from 'react'
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
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api, type TripMessage } from '@/lib/api'
import {
  buildCandidates,
  findActiveQuery,
  insertMention,
  parseMessageText,
  reconcileMentions,
  serializeForSend,
  type Candidate,
  type MentionRange,
  type MentionType,
} from '@/lib/mentions'
import { useAuth } from '@/lib/auth-context'
import { useStyles, type Theme } from '@/lib/theme'
import { ErrorState, Loading } from '@/components/ui'

const TYPE_ICON: Record<MentionType, keyof typeof Ionicons.glyphMap> = {
  member: 'person',
  place: 'location',
  expense: 'cash-outline',
  photo: 'image-outline',
}

export default function TripChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [styles, KIOKU] = useStyles(makeStyles)
  const listRef = useRef<FlatList<TripMessage>>(null)

  const [messages, setMessages] = useState<TripMessage[] | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [error, setError] = useState<string | null>(null)

  const [text, setText] = useState('')
  const [mentions, setMentions] = useState<MentionRange[]>([])
  const [cursor, setCursor] = useState(0)
  // Only forced transiently to reposition the caret after inserting a mention;
  // controlling `selection` on every keystroke makes the caret lag.
  const [forced, setForced] = useState<{ start: number; end: number } | null>(null)
  const [sending, setSending] = useState(false)

  const load = useCallback(() => {
    if (!id) return
    setError(null)
    Promise.all([api.getTripMessages(id), api.getTrip(id), api.getItinerary(id)])
      .then(([msgs, trip, itinerary]) => {
        setMessages(msgs)
        setCandidates(buildCandidates(trip.members, itinerary))
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
  }, [id])

  useFocusEffect(load)

  const labelFor = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of candidates) m.set(`${c.type}:${c.id}`, c.label)
    return m
  }, [candidates])

  const activeQuery = findActiveQuery(text, mentions, cursor)
  const suggestions = activeQuery
    ? candidates.filter((c) => c.label.toLowerCase().includes(activeQuery.query.toLowerCase())).slice(0, 6)
    : []

  function onChangeText(next: string) {
    setMentions((prev) => reconcileMentions(text, prev, next))
    setText(next)
    // Derive the caret from the edit so @-detection works even where
    // onSelectionChange doesn't fire on every keystroke (e.g. web).
    let suffix = 0
    const max = Math.min(text.length, next.length)
    while (suffix < max && text[text.length - 1 - suffix] === next[next.length - 1 - suffix]) suffix++
    setCursor(next.length - suffix)
  }

  function pick(c: Candidate) {
    if (!activeQuery) return
    const r = insertMention(text, mentions, activeQuery.atIndex, cursor, c)
    setText(r.text)
    setMentions(r.mentions)
    setCursor(r.cursorPos)
    setForced({ start: r.cursorPos, end: r.cursorPos })
  }

  async function send() {
    const payload = serializeForSend(text, mentions).trim()
    if (!payload || sending || !id) return
    setSending(true)
    try {
      const created = await api.sendTripMessage(id, payload)
      setMessages((prev) => [...(prev ?? []), created])
      setText('')
      setMentions([])
      setCursor(0)
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send')
    } finally {
      setSending(false)
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.topbarBtn}>
          <Ionicons name="chevron-back" size={24} color={KIOKU.ink} />
        </Pressable>
        <Text style={styles.topbarTitle}>Trip chat</Text>
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
            ListEmptyComponent={
              <Text style={styles.empty}>No messages yet. Say something — type @ to tag a place, expense, or person.</Text>
            }
            renderItem={({ item }) => {
              const mine = item.sender.id === user?.id
              return (
                <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
                  <View style={{ maxWidth: '82%' }}>
                    {!mine ? <Text style={styles.senderName}>{item.sender.name}</Text> : null}
                    <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                      <Text style={[styles.bubbleText, mine ? styles.textMine : styles.textTheirs]}>
                        {parseMessageText(item.text).map((seg, i) =>
                          seg.kind === 'text' ? (
                            <Text key={i}>{seg.value}</Text>
                          ) : (
                            <Text
                              key={i}
                              style={[styles.chip, mine ? styles.chipMine : styles.chipTheirs]}
                              onPress={
                                seg.mentionType === 'member' ? () => router.push(`/user/${seg.id}`) : undefined
                              }
                            >
                              @{labelFor.get(`${seg.mentionType}:${seg.id}`) ?? seg.mentionType}
                            </Text>
                          )
                        )}
                      </Text>
                    </View>
                  </View>
                </View>
              )
            }}
          />
        )}

        {suggestions.length > 0 ? (
          <View style={styles.suggestions}>
            {suggestions.map((c) => (
              <Pressable key={`${c.type}-${c.id}`} style={styles.suggestion} onPress={() => pick(c)}>
                <Ionicons name={TYPE_ICON[c.type]} size={16} color={KIOKU.accent} />
                <Text style={styles.suggestionText} numberOfLines={1}>
                  {c.label}
                </Text>
                <Text style={styles.suggestionType}>{c.type}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={styles.input}
            placeholder="Message — type @ to tag"
            placeholderTextColor={KIOKU.inkMuted}
            value={text}
            onChangeText={onChangeText}
            selection={forced ?? undefined}
            onSelectionChange={(e) => {
              setCursor(e.nativeEvent.selection.end)
              if (forced) setForced(null)
            }}
            multiline
          />
          <Pressable
            style={[styles.send, (!text.trim() || sending) && styles.sendOff]}
            onPress={send}
            disabled={!text.trim() || sending}
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
    topbarTitle: { fontSize: 17, fontWeight: '700', color: KIOKU.ink },

    list: { padding: 16, gap: 10, flexGrow: 1 },
    empty: { textAlign: 'center', color: KIOKU.inkMuted, marginTop: 30, fontSize: 14.5, lineHeight: 21, paddingHorizontal: 20 },
    bubbleRow: { flexDirection: 'row' },
    rowMine: { justifyContent: 'flex-end' },
    rowTheirs: { justifyContent: 'flex-start' },
    senderName: { fontSize: 12, color: KIOKU.inkMuted, fontWeight: '600', marginBottom: 3, marginLeft: 4 },
    bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
    bubbleMine: { backgroundColor: KIOKU.accent, borderBottomRightRadius: 5 },
    bubbleTheirs: { backgroundColor: KIOKU.surface, borderWidth: 1, borderColor: KIOKU.border, borderBottomLeftRadius: 5 },
    bubbleText: { fontSize: 15, lineHeight: 21 },
    textMine: { color: '#fff' },
    textTheirs: { color: KIOKU.ink },
    chip: { fontWeight: '700' },
    chipMine: { color: '#fff', textDecorationLine: 'underline' },
    chipTheirs: { color: KIOKU.accent },

    suggestions: {
      marginHorizontal: 12,
      marginBottom: 8,
      backgroundColor: KIOKU.surface,
      borderWidth: 1,
      borderColor: KIOKU.border,
      borderRadius: 14,
      overflow: 'hidden',
    },
    suggestion: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: KIOKU.border,
    },
    suggestionText: { flex: 1, fontSize: 15, color: KIOKU.ink, fontWeight: '600' },
    suggestionType: { fontSize: 12, color: KIOKU.inkMuted, textTransform: 'capitalize' },

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

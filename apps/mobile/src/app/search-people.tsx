import { useEffect, useRef, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api, type UserLite } from '@/lib/api'
import { useStyles, type Theme } from '@/lib/theme'
import { PressableScale } from '@/components/PressableScale'

export default function SearchPeopleScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [styles, KIOKU] = useStyles(makeStyles)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserLite[] | null>(null)
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    const q = query.trim()
    if (!q) {
      setResults(null)
      setLoading(false)
      return
    }
    setLoading(true)
    // Debounce so we don't hit the API on every keystroke.
    timer.current = setTimeout(() => {
      api
        .searchUsers(q)
        .then((r) => setResults(r))
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 300)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [query])

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={KIOKU.ink} />
        </Pressable>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={KIOKU.inkMuted} />
          <TextInput
            style={styles.input}
            placeholder="Search people by name"
            placeholderTextColor={KIOKU.inkMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={KIOKU.borderStrong} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={results ?? []}
        keyExtractor={(u) => u.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.hint}>
            <Ionicons
              name={loading ? 'ellipsis-horizontal' : 'people-outline'}
              size={38}
              color={KIOKU.borderStrong}
            />
            <Text style={styles.hintText}>
              {loading
                ? 'Searching…'
                : query.trim()
                  ? 'No one found by that name.'
                  : 'Find travelers to follow and message.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <PressableScale style={styles.row} onPress={() => router.push(`/user/${item.id}`)}>
            <View style={styles.avatar}>
              {item.photoUrl ? (
                <Image source={{ uri: item.photoUrl }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitial}>{item.name.charAt(0).toUpperCase()}</Text>
              )}
            </View>
            <Text style={styles.name}>{item.name}</Text>
            <Ionicons name="chevron-forward" size={18} color={KIOKU.borderStrong} />
          </PressableScale>
        )}
      />
    </View>
  )
}

function makeStyles(KIOKU: Theme) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: KIOKU.bg },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  backBtn: { width: 36, height: 40, alignItems: 'center', justifyContent: 'center' },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: KIOKU.surface,
    borderWidth: 1,
    borderColor: KIOKU.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  input: { flex: 1, fontSize: 15, color: KIOKU.ink },

  list: { padding: 16, gap: 6, flexGrow: 1 },
  hint: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 10 },
  hintText: { fontSize: 14, color: KIOKU.inkMuted, textAlign: 'center', maxWidth: 260 },
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
  })
}

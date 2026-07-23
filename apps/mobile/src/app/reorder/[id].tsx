import { useCallback, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import DraggableFlatList, { ScaleDecorator, type RenderItemParams } from 'react-native-draggable-flatlist'
import { Pressable } from 'react-native-gesture-handler'
import { api } from '@/lib/api'
import { useStyles, type Theme } from '@/lib/theme'
import { ErrorState, Loading } from '@/components/ui'

type Item = { id: string; title: string; subtitle?: string; thumb?: string }

export default function ReorderScreen() {
  const { id, day, kind } = useLocalSearchParams<{ id: string; day: string; kind: 'places' | 'photos' }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [styles, KIOKU] = useStyles(makeStyles)
  const isPhotos = kind === 'photos'

  const [items, setItems] = useState<Item[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!id || !day) return
    setError(null)
    api
      .getItinerary(id)
      .then((trip) => {
        const d = trip.days.find((x) => x.day === day)
        if (!d) return setItems([])
        setItems(
          isPhotos
            ? d.photos.map((p) => ({ id: p.id, title: p.note?.trim() || 'Photo', thumb: p.url }))
            : d.places.map((p) => ({ id: p.id, title: p.name, subtitle: p.address }))
        )
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
  }, [id, day, isPhotos])

  useFocusEffect(load)

  function onDragEnd(data: Item[]) {
    setItems(data)
    if (!id || !day) return
    const orderedIds = data.map((i) => i.id)
    const req = isPhotos ? api.reorderPhotos(id, day, orderedIds) : api.reorderPlaces(id, day, orderedIds)
    req.catch(() => {
      setError('Could not save the new order. Try again.')
      load()
    })
  }

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Item>) => (
    <ScaleDecorator>
      <Pressable style={[styles.row, isActive && styles.rowActive]} onLongPress={drag} delayLongPress={120}>
        <Ionicons name="reorder-three" size={22} color={KIOKU.inkMuted} />
        {isPhotos ? (
          item.thumb ? (
            <Image source={{ uri: item.thumb }} style={styles.thumb} contentFit="cover" />
          ) : (
            <View style={[styles.thumb, styles.thumbEmpty]} />
          )
        ) : (
          <Ionicons name="location" size={18} color={KIOKU.accent} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          {item.subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {item.subtitle}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </ScaleDecorator>
  )

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.topbarBtn}>
          <Ionicons name="chevron-back" size={24} color={KIOKU.ink} />
        </Pressable>
        <Text style={styles.topbarTitle}>Arrange {isPhotos ? 'photos' : 'places'}</Text>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.topbarBtn}>
          <Text style={styles.done}>Done</Text>
        </Pressable>
      </View>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !items ? (
        <Loading />
      ) : (
        <DraggableFlatList
          data={items}
          keyExtractor={(i) => i.id}
          onDragEnd={({ data }) => onDragEnd(data)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          ListHeaderComponent={<Text style={styles.hint}>Hold an item and drag to reorder.</Text>}
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
      borderBottomWidth: 1,
      borderBottomColor: KIOKU.border,
    },
    topbarBtn: { minWidth: 52, height: 40, alignItems: 'center', justifyContent: 'center' },
    topbarTitle: { fontSize: 17, fontWeight: '700', color: KIOKU.ink },
    done: { fontSize: 15, fontWeight: '700', color: KIOKU.accent },
    hint: { fontSize: 13.5, color: KIOKU.inkMuted, marginBottom: 12, textAlign: 'center' },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: KIOKU.surface,
      borderWidth: 1,
      borderColor: KIOKU.border,
      borderRadius: 14,
      padding: 12,
      marginBottom: 10,
    },
    rowActive: { borderColor: KIOKU.accent, backgroundColor: KIOKU.accentSoft },
    thumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: KIOKU.surfaceAlt },
    thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 15, fontWeight: '600', color: KIOKU.ink },
    subtitle: { fontSize: 13, color: KIOKU.inkMuted, marginTop: 1 },
  })
}

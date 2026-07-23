import { useRef } from 'react'
import { FlatList, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export type LightboxPhoto = { id: string; url: string; note?: string }

// Full-screen photo viewer: swipe horizontally between photos, tap X to close.
export function PhotoLightbox({
  photos,
  initialIndex,
  visible,
  onClose,
}: {
  photos: LightboxPhoto[]
  initialIndex: number
  visible: boolean
  onClose: () => void
}) {
  const { width, height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const indexRef = useRef(initialIndex)

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <FlatList
          data={photos}
          keyExtractor={(p) => p.id}
          horizontal
          pagingEnabled
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            indexRef.current = Math.round(e.nativeEvent.contentOffset.x / width)
          }}
          renderItem={({ item }) => (
            <Pressable style={[styles.page, { width, height }]} onPress={onClose}>
              <Image source={{ uri: item.url }} style={styles.image} contentFit="contain" transition={150} />
            </Pressable>
          )}
        />

        <Pressable style={[styles.close, { top: insets.top + 8 }]} onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={26} color="#fff" />
        </Pressable>

        {photos.length > 1 ? (
          <View style={[styles.counter, { bottom: insets.bottom + 20 }]}>
            <Text style={styles.counterText}>
              {Math.min(indexRef.current + 1, photos.length)} / {photos.length}
            </Text>
          </View>
        ) : null}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  page: { alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  close: {
    position: 'absolute',
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  counterText: { color: '#fff', fontSize: 13, fontWeight: '600' },
})

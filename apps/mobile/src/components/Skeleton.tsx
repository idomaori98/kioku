import { useEffect } from 'react'
import { View, type DimensionValue, type ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { useTheme } from '@/lib/theme'

// One pulse driver per skeleton screen — every block shares it so they breathe
// in unison (cheaper than one animation per block).
function usePulse() {
  const o = useSharedValue(0.5)
  useEffect(() => {
    o.value = withRepeat(withTiming(1, { duration: 750 }), -1, true)
  }, [o])
  return useAnimatedStyle(() => ({ opacity: o.value }))
}

function Block({
  w,
  h,
  r = 8,
  style,
  pulse,
}: {
  w: DimensionValue
  h: number
  r?: number
  style?: ViewStyle
  pulse: ReturnType<typeof usePulse>
}) {
  const KIOKU = useTheme()
  return (
    <Animated.View
      style={[{ width: w, height: h, borderRadius: r, backgroundColor: KIOKU.borderStrong }, pulse, style]}
    />
  )
}

// Discover feed — a couple of tall photo cards.
export function FeedSkeleton() {
  const pulse = usePulse()
  return (
    <View style={{ paddingHorizontal: 16, gap: 16 }}>
      {[0, 1, 2].map((i) => (
        <Block key={i} w="100%" h={230} r={20} pulse={pulse} />
      ))}
    </View>
  )
}

// Vertical list rows (Trips, notifications, messages, connections).
export function ListSkeleton({ rows = 6, avatarRound = false }: { rows?: number; avatarRound?: boolean }) {
  const KIOKU = useTheme()
  const pulse = usePulse()
  return (
    <View style={{ paddingHorizontal: 16, gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: KIOKU.surface,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: KIOKU.border,
            padding: 14,
          }}
        >
          <Block w={44} h={44} r={avatarRound ? 22 : 12} pulse={pulse} />
          <View style={{ flex: 1, gap: 8 }}>
            <Block w="55%" h={13} pulse={pulse} />
            <Block w="35%" h={11} pulse={pulse} />
          </View>
        </View>
      ))}
    </View>
  )
}

// Trip detail — hero, stat strip, a few lines.
export function TripDetailSkeleton() {
  const KIOKU = useTheme()
  const pulse = usePulse()
  return (
    <View style={{ flex: 1 }}>
      <Block w="100%" h={260} r={0} pulse={pulse} />
      <View style={{ paddingHorizontal: 20, paddingTop: 18, gap: 16 }}>
        <Block w="45%" h={14} pulse={pulse} />
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            backgroundColor: KIOKU.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: KIOKU.border,
            paddingVertical: 18,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ alignItems: 'center', gap: 8 }}>
              <Block w={26} h={18} pulse={pulse} />
              <Block w={38} h={10} pulse={pulse} />
            </View>
          ))}
        </View>
        <Block w="100%" h={92} r={14} pulse={pulse} style={{ marginTop: 6 }} />
        <Block w="100%" h={60} r={12} pulse={pulse} />
        <Block w="100%" h={60} r={12} pulse={pulse} />
      </View>
    </View>
  )
}

// Profile — avatar, name, counts, a 2-col trip grid.
export function ProfileSkeleton() {
  const pulse = usePulse()
  return (
    <View style={{ alignItems: 'center', paddingTop: 20, gap: 14 }}>
      <Block w={88} h={88} r={44} pulse={pulse} />
      <Block w={140} h={20} pulse={pulse} />
      <Block w={200} h={14} pulse={pulse} />
      <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 12 }}>
        <Block w="48%" h={150} r={16} pulse={pulse} />
        <Block w="48%" h={150} r={16} pulse={pulse} />
      </View>
    </View>
  )
}

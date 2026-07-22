import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// A Pressable that gently scales down while pressed — the standard tactile
// feedback for cards and buttons (HIG/Material: 0.95–1.05 on press).
export function PressableScale({
  children,
  style,
  scaleTo = 0.97,
  ...props
}: Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; scaleTo?: number }) {
  const scale = useSharedValue(1)
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withTiming(scaleTo, { duration: 90 })
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 140 })
      }}
      style={[style, animated]}
      {...props}
    >
      {children}
    </AnimatedPressable>
  )
}

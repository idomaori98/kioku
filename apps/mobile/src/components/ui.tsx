import { ReactNode } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { FONT, KIOKU } from '@/constants/kioku'

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {children}
    </SafeAreaView>
  )
}

export function ScreenTitle({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        {action}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  )
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={KIOKU.accent} />
    </View>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Ionicons name="alert-circle-outline" size={40} color={KIOKU.borderStrong} />
      <Text style={styles.stateTitle}>Something went wrong</Text>
      <Text style={styles.stateMsg}>{message}</Text>
      {onRetry ? (
        <Pressable style={styles.retry} onPress={onRetry}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

export function EmptyState({
  icon = 'sparkles-outline',
  title,
  message,
}: {
  icon?: keyof typeof Ionicons.glyphMap
  title: string
  message?: string
}) {
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={40} color={KIOKU.borderStrong} />
      <Text style={styles.stateTitle}>{title}</Text>
      {message ? <Text style={styles.stateMsg}>{message}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: KIOKU.bg },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 30, fontFamily: FONT.displayHeavy, color: KIOKU.ink, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: KIOKU.inkMuted, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 6 },
  stateTitle: { fontSize: 17, fontFamily: FONT.displaySemi, color: KIOKU.ink, marginTop: 8 },
  stateMsg: { fontSize: 14, color: KIOKU.inkMuted, textAlign: 'center', maxWidth: 300 },
  retry: {
    marginTop: 16,
    backgroundColor: KIOKU.accent,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryText: { color: '#fff', fontWeight: '600' },
})

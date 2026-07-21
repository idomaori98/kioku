import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/lib/auth-context'
import { KIOKU } from '@/constants/kioku'
import { Screen, ScreenTitle } from '@/components/ui'

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  if (!user) return null

  return (
    <Screen>
      <ScreenTitle title="Profile" />
      <View style={styles.body}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>

        <Pressable style={styles.logout} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color={KIOKU.danger} />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  body: { alignItems: 'center', paddingTop: 24, gap: 4 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: KIOKU.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: KIOKU.ink },
  email: { fontSize: 15, color: KIOKU.inkMuted },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
    borderWidth: 1,
    borderColor: KIOKU.borderStrong,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  logoutText: { color: KIOKU.danger, fontWeight: '600' },
})

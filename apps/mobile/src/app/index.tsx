import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth-context'

const COLORS = {
  bg: '#f6f1e7',
  surface: '#ffffff',
  ink: '#2b2620',
  inkMuted: '#8a7f6f',
  accent: '#c1443c',
  border: '#e6dcc9',
  danger: '#a32d2d',
}

export default function Index() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <View style={[styles.fill, styles.center]}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    )
  }

  return user ? <Home name={user.name} email={user.email} onLogout={logout} /> : <AuthForm />
}

function AuthForm() {
  const { login, signup } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const isSignup = mode === 'signup'

  async function submit() {
    setError(null)
    setBusy(true)
    try {
      if (isSignup) await signup(name.trim(), email.trim(), password)
      else await login(email.trim(), password)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView style={styles.fill}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.fill, styles.authWrap]}
      >
        <Text style={styles.kanji}>記憶</Text>
        <Text style={styles.brand}>Kioku</Text>
        <Text style={styles.tagline}>{isSignup ? 'Create your account' : 'Welcome back'}</Text>

        {isSignup && (
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor={COLORS.inkMuted}
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={COLORS.inkMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={COLORS.inkMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.button, busy && styles.buttonDisabled]}
          onPress={submit}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{isSignup ? 'Sign up' : 'Log in'}</Text>
          )}
        </Pressable>

        <Pressable onPress={() => setMode(isSignup ? 'login' : 'signup')}>
          <Text style={styles.switch}>
            {isSignup ? 'Already have an account? Log in' : 'No account? Sign up'}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function Home({ name, email, onLogout }: { name: string; email: string; onLogout: () => void }) {
  return (
    <SafeAreaView style={styles.fill}>
      <View style={[styles.fill, styles.center, { padding: 24 }]}>
        <Text style={styles.kanji}>記憶</Text>
        <Text style={styles.welcome}>You&rsquo;re in, {name.split(' ')[0]}</Text>
        <Text style={styles.tagline}>Signed in to the Kioku mobile app</Text>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Name</Text>
          <Text style={styles.cardValue}>{name}</Text>
          <Text style={[styles.cardLabel, { marginTop: 12 }]}>Email</Text>
          <Text style={styles.cardValue}>{email}</Text>
        </View>
        <Text style={styles.proof}>
          Fetched live from your backend — native → API → MongoDB Atlas.
        </Text>
        <Pressable style={styles.logout} onPress={onLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: COLORS.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  authWrap: { paddingHorizontal: 28, justifyContent: 'center' },
  kanji: { fontSize: 40, fontWeight: '700', color: COLORS.accent, textAlign: 'center' },
  brand: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 6,
    textTransform: 'uppercase',
    color: COLORS.inkMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  tagline: {
    fontSize: 15,
    color: COLORS.inkMuted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  welcome: { fontSize: 26, fontWeight: '700', color: COLORS.ink, textAlign: 'center', marginTop: 12 },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.ink,
    marginBottom: 12,
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  switch: { color: COLORS.accent, textAlign: 'center', marginTop: 18, fontSize: 14 },
  error: { color: COLORS.danger, textAlign: 'center', marginBottom: 10 },
  card: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginTop: 24,
  },
  cardLabel: { fontSize: 12, color: COLORS.inkMuted, textTransform: 'uppercase', letterSpacing: 1 },
  cardValue: { fontSize: 17, color: COLORS.ink, fontWeight: '600', marginTop: 2 },
  proof: {
    fontSize: 13,
    color: COLORS.inkMuted,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  logout: {
    marginTop: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  logoutText: { color: COLORS.danger, fontWeight: '600' },
})

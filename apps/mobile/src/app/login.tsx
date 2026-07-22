import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Redirect } from 'expo-router'
import { useAuth } from '@/lib/auth-context'
import { FONT, KIOKU } from '@/constants/kioku'

export default function LoginScreen() {
  const { user, loading, login, signup } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!loading && user) return <Redirect href="/" />

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
        style={[styles.fill, styles.wrap]}
      >
        <Text style={styles.kanji}>記憶</Text>
        <Text style={styles.brand}>Kioku</Text>
        <Text style={styles.tagline}>{isSignup ? 'Create your account' : 'Welcome back'}</Text>

        {isSignup && (
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor={KIOKU.inkMuted}
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={KIOKU.inkMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={KIOKU.inkMuted}
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

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: KIOKU.bg },
  wrap: { paddingHorizontal: 28, justifyContent: 'center' },
  kanji: { fontSize: 40, fontWeight: '700', color: KIOKU.accent, textAlign: 'center' },
  brand: {
    fontSize: 15,
    fontFamily: FONT.displaySemi,
    letterSpacing: 6,
    textTransform: 'uppercase',
    color: KIOKU.inkMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  tagline: {
    fontSize: 15,
    color: KIOKU.inkMuted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  input: {
    backgroundColor: KIOKU.surface,
    borderWidth: 1,
    borderColor: KIOKU.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: KIOKU.ink,
    marginBottom: 12,
  },
  button: {
    backgroundColor: KIOKU.accent,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  switch: { color: KIOKU.accent, textAlign: 'center', marginTop: 18, fontSize: 14 },
  error: { color: KIOKU.danger, textAlign: 'center', marginBottom: 10 },
})

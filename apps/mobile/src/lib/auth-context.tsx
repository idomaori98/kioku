import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, type User } from './api'
import { clearToken, getToken, setToken } from './auth-storage'

type AuthState = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // On launch, if we already have a stored token, resolve the current user.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const token = await getToken()
      if (!token) {
        if (!cancelled) setLoading(false)
        return
      }
      try {
        const me = await api.me()
        if (!cancelled) setUser(me)
      } catch {
        await clearToken() // token invalid/expired
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function login(email: string, password: string) {
    const { token, user } = await api.login(email, password)
    await setToken(token)
    setUser(user)
  }

  async function signup(name: string, email: string, password: string) {
    const { token, user } = await api.signup(name, email, password)
    await setToken(token)
    setUser(user)
  }

  async function logout() {
    await clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

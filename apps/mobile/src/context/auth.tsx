import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, type User } from '@/lib/api'
import { clearToken, getToken, setToken } from '@/lib/auth-storage'

type AuthContextValue = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({
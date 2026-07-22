import { useEffect, useState } from 'react'
import { ActivityIndicator, AppState, View } from 'react-native'
import { Redirect, Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/theme'

export default function TabsLayout() {
  const { user, loading } = useAuth()
  const KIOKU = useTheme()
  const [alertsCount, setAlertsCount] = useState(0)
  const [messagesCount, setMessagesCount] = useState(0)

  useEffect(() => {
    if (!user) return
    let alive = true
    const refresh = () => {
      api
        .getUnreadCount()
        .then((r) => alive && setAlertsCount(r.count))
        .catch(() => {})
      api
        .getDmUnreadCount()
        .then((r) => alive && setMessagesCount(r.count))
        .catch(() => {})
    }
    refresh()
    const interval = setInterval(refresh, 20000)
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh())
    return () => {
      alive = false
      clearInterval(interval)
      sub.remove()
    }
  }, [user])

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: KIOKU.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={KIOKU.accent} />
      </View>
    )
  }
  if (!user) return <Redirect href="/login" />

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: KIOKU.accent,
        tabBarInactiveTintColor: KIOKU.inkMuted,
        tabBarStyle: { backgroundColor: KIOKU.surface, borderTopColor: KIOKU.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarBadge: alertsCount > 0 ? (alertsCount > 99 ? '99+' : alertsCount) : undefined,
          tabBarBadgeStyle: { backgroundColor: KIOKU.accent, fontSize: 11 },
          tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarBadge: messagesCount > 0 ? (messagesCount > 99 ? '99+' : messagesCount) : undefined,
          tabBarBadgeStyle: { backgroundColor: KIOKU.accent, fontSize: 11 },
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}

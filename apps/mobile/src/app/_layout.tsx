import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { AuthProvider } from '@/lib/auth-context'
import { KIOKU } from '@/constants/kioku'

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: KIOKU.bg },
          }}
        />
      </AuthProvider>
    </GestureHandlerRootView>
  )
}

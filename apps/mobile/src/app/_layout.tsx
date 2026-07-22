import { View } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import {
  useFonts,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque'
import { AuthProvider } from '@/lib/auth-context'
import { KIOKU } from '@/constants/kioku'

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
  })

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: KIOKU.bg }}>
      {fontsLoaded ? (
        <AuthProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: KIOKU.bg },
            }}
          />
        </AuthProvider>
      ) : (
        <View style={{ flex: 1, backgroundColor: KIOKU.bg }} />
      )}
    </GestureHandlerRootView>
  )
}

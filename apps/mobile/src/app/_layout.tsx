import { View } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import {
  useFonts,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque'
import { AuthProvider } from '@/lib/auth-context'
import { useTheme } from '@/lib/theme'

export default function RootLayout() {
  const KIOKU = useTheme()
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
  })

  const base = KIOKU.isDark ? DarkTheme : DefaultTheme
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: KIOKU.bg,
      card: KIOKU.surface,
      border: KIOKU.border,
      primary: KIOKU.accent,
      text: KIOKU.ink,
    },
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: KIOKU.bg }}>
      {fontsLoaded ? (
        <ThemeProvider value={navTheme}>
          <AuthProvider>
            <StatusBar style={KIOKU.isDark ? 'light' : 'dark'} />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: KIOKU.bg },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      ) : (
        <View style={{ flex: 1, backgroundColor: KIOKU.bg }} />
      )}
    </GestureHandlerRootView>
  )
}

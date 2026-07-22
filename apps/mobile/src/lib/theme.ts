import { useMemo } from 'react'
import { useColorScheme } from 'react-native'

// Warm light palette (mirrors client/src/index.css) and a warm — not pure-black —
// dark palette. Same keys in both so screens can build styles from either.
const light = {
  bg: '#f6f1e7',
  surface: '#ffffff',
  surfaceAlt: '#f4ede0',
  ink: '#2b2620',
  inkMuted: '#8a7f6f',
  accent: '#c1443c',
  accentSoft: '#faece7',
  border: '#e6dcc9',
  borderStrong: '#ddd0b5',
  danger: '#a32d2d',
  success: '#0f6e56',
  isDark: false,
}

const dark: typeof light = {
  bg: '#161310',
  surface: '#211d17',
  surfaceAlt: '#2b261d',
  ink: '#f1ebdf',
  inkMuted: '#a89b86',
  accent: '#e0685f',
  accentSoft: '#3a2420',
  border: '#37301f',
  borderStrong: '#4b4230',
  danger: '#ef6b63',
  success: '#57b394',
  isDark: true,
}

export type Theme = typeof light

export function useTheme(): Theme {
  const scheme = useColorScheme()
  return scheme === 'dark' ? dark : light
}

// One-liner for screens: `const [styles, KIOKU] = useStyles(makeStyles)`.
// Returns the theme as `KIOKU` too, so existing inline `KIOKU.x` usages keep working.
export function useStyles<T>(factory: (t: Theme) => T): [T, Theme] {
  const theme = useTheme()
  const styles = useMemo(() => factory(theme), [theme])
  return [styles, theme]
}

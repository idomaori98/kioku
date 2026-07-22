// Kioku brand tokens (mirrors client/src/index.css custom properties).
// Light palette only for now — dark mode lands with the design pass.
export const KIOKU = {
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
} as const

// Display typeface — Bricolage Grotesque gives Kioku its editorial voice on
// the wordmark, screen titles, and hero names. Body/UI stays on the system sans.
export const FONT = {
  display: 'BricolageGrotesque_700Bold',
  displaySemi: 'BricolageGrotesque_600SemiBold',
  displayHeavy: 'BricolageGrotesque_800ExtraBold',
} as const

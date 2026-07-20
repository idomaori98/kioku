// Base URL for the Kioku API. Defaults to the deployed backend so the app works
// on a real device out of the box; override with EXPO_PUBLIC_API_URL for local dev
// (e.g. http://<your-mac-lan-ip>:5050 when pointing at the local Express server).
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://kioku-flame.vercel.app'

import { EmptyState, Screen, ScreenTitle } from '@/components/ui'

export default function MessagesScreen() {
  return (
    <Screen>
      <ScreenTitle title="Messages" />
      <EmptyState icon="chatbubble-outline" title="Coming soon" message="Your conversations and message requests will live here." />
    </Screen>
  )
}

import { EmptyState, Screen, ScreenTitle } from '@/components/ui'

export default function NotificationsScreen() {
  return (
    <Screen>
      <ScreenTitle title="Notifications" />
      <EmptyState icon="notifications-outline" title="Coming soon" message="Likes, comments, follows, and copies will show up here." />
    </Screen>
  )
}

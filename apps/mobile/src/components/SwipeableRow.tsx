import { ReactNode, useRef } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable'
import { Ionicons } from '@expo/vector-icons'
import { useStyles, type Theme } from '@/lib/theme'

// Slide a row left to reveal Edit / Delete, like a native list row.
export function SwipeableRow({
  children,
  onEdit,
  onDelete,
  containerStyle,
}: {
  children: ReactNode
  onEdit?: () => void
  onDelete: () => void
  containerStyle?: object
}) {
  const [styles] = useStyles(makeStyles)
  const ref = useRef<SwipeableMethods>(null)

  function renderRightActions() {
    return (
      <View style={styles.actions}>
        {onEdit ? (
          <Pressable
            style={[styles.action, styles.edit]}
            onPress={() => {
              ref.current?.close()
              onEdit()
            }}
          >
            <Ionicons name="create-outline" size={19} color="#fff" />
            <Text style={styles.label}>Edit</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={[styles.action, styles.del]}
          onPress={() => {
            ref.current?.close()
            onDelete()
          }}
        >
          <Ionicons name="trash-outline" size={19} color="#fff" />
          <Text style={styles.label}>Delete</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <ReanimatedSwipeable
      ref={ref}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
      containerStyle={containerStyle}
    >
      {children}
    </ReanimatedSwipeable>
  )
}

function makeStyles(KIOKU: Theme) {
  return StyleSheet.create({
  actions: { flexDirection: 'row' },
  action: { width: 72, alignItems: 'center', justifyContent: 'center', gap: 3 },
  edit: { backgroundColor: KIOKU.inkMuted },
  del: { backgroundColor: KIOKU.danger },
  label: { color: '#fff', fontSize: 12, fontWeight: '700' },
  })
}

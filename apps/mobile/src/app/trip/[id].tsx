import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'
import {
  api,
  type PublicTrip,
  type PublicDay,
  type PublicPlace,
  type PublicExpense,
  type ExpenseCategory,
} from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { FONT } from '@/constants/kioku'
import { useStyles, type Theme } from '@/lib/theme'
import { ErrorState, Loading } from '@/components/ui'
import { SwipeableRow } from '@/components/SwipeableRow'

const TRAVEL_LABEL: Record<PublicTrip['travelType'], string> = {
  family: 'Family',
  couple: 'Couple',
  solo: 'Solo',
  friends: 'Friends',
}

const CATEGORIES: { value: ExpenseCategory; emoji: string; label: string }[] = [
  { value: 'food', emoji: '🍜', label: 'Food' },
  { value: 'transport', emoji: '🚆', label: 'Transit' },
  { value: 'fun', emoji: '🎡', label: 'Fun' },
  { value: 'shopping', emoji: '🛍️', label: 'Shopping' },
  { value: 'other', emoji: '📦', label: 'Other' },
]
const CATEGORY_EMOJI: Record<ExpenseCategory, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.emoji])
) as Record<ExpenseCategory, string>

const yen = (n: number) => `¥${Math.round(n).toLocaleString()}`

function toYMD(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatRange(start: string, end: string) {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' }
  const s = new Date(`${start.slice(0, 10)}T00:00:00Z`).toLocaleDateString(undefined, opts)
  const e = new Date(`${end.slice(0, 10)}T00:00:00Z`).toLocaleDateString(undefined, { ...opts, year: 'numeric' })
  return `${s} – ${e}`
}

function formatDayLabel(dayKey: string) {
  return new Date(`${dayKey}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [styles, KIOKU] = useStyles(makeStyles)
  const [trip, setTrip] = useState<PublicTrip | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState(0)

  const load = useCallback(
    (keepDay = false) => {
      if (!id) return
      setError(null)
      if (!keepDay) setTrip(null)
      api
        .getItinerary(id)
        .then((t) => {
          setTrip(t)
          if (!keepDay) {
            // Land on today if the trip spans it, else the first day.
            const todayIdx = t.days.findIndex((d) => d.day === toYMD(new Date()))
            setSelected(todayIdx >= 0 ? todayIdx : 0)
          }
        })
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
    },
    [id]
  )

  useFocusEffect(useCallback(() => load(), [load]))

  const [busy, setBusy] = useState(false)

  async function toggleLike() {
    if (!trip) return
    const liked = trip.likedByMe
    // Optimistic — flip locally, reconcile on error.
    setTrip({ ...trip, likedByMe: !liked, likesCount: trip.likesCount + (liked ? -1 : 1) })
    try {
      await (liked ? api.unlikeTrip(trip.id) : api.likeTrip(trip.id))
    } catch {
      setTrip((t) => (t ? { ...t, likedByMe: liked, likesCount: t.likesCount + (liked ? 1 : -1) } : t))
    }
  }

  async function togglePublish() {
    if (!trip || busy) return
    const run = async () => {
      setBusy(true)
      try {
        await (trip.published ? api.unpublishTrip(trip.id) : api.publishTrip(trip.id))
        setTrip((t) => (t ? { ...t, published: !trip.published } : t))
      } catch (e) {
        Alert.alert('Something went wrong', e instanceof Error ? e.message : 'Please try again.')
      } finally {
        setBusy(false)
      }
    }
    if (trip.published) {
      Alert.alert('Unpublish trip?', 'It will be removed from Discover and can no longer be seen or copied by others.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unpublish', style: 'destructive', onPress: run },
      ])
    } else {
      run()
    }
  }

  const isOwner = !!user && !!trip && String(trip.createdBy) === user.id
  const cover = trip?.days.flatMap((d) => d.photos)[0]?.url ?? null
  const day = trip?.days[selected]

  if (error) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ErrorState message={error} onRetry={() => load()} />
      </View>
    )
  }
  if (!trip || !day) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Loading />
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {/* Hero */}
        <View style={styles.hero}>
          {cover ? (
            <Image source={{ uri: cover }} style={styles.heroImg} contentFit="cover" transition={200} />
          ) : (
            <View style={[styles.heroImg, styles.heroEmpty]}>
              <Ionicons name="image-outline" size={48} color={KIOKU.borderStrong} />
            </View>
          )}
          <View style={styles.heroScrim} />
          <View style={styles.heroText}>
            <Text style={styles.heroName} numberOfLines={2}>
              {trip.name}
            </Text>
            <Text style={styles.heroMeta} numberOfLines={1}>
              {trip.destination ? `${trip.destination} · ` : ''}
              {formatRange(trip.startDate, trip.endDate)}
            </Text>
          </View>
        </View>

        <Pressable
          style={[styles.back, { top: insets.top + 8 }]}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>

        <View style={styles.body}>
          <Text style={styles.byline}>
            by{' '}
            <Text style={styles.bylineLink} onPress={() => router.push(`/user/${trip.createdBy}`)}>
              {trip.createdByName ?? 'Unknown'}
            </Text>{' '}
            · {TRAVEL_LABEL[trip.travelType]}
          </Text>

          <View style={styles.stats}>
            <Stat icon="calendar-outline" value={trip.stats.days} label="days" />
            <Stat icon="location-outline" value={trip.stats.places} label="places" />
            <Stat icon="images-outline" value={trip.stats.photos} label="photos" />
            <Stat icon="heart-outline" value={trip.likesCount} label="likes" />
          </View>

          {/* Social actions */}
          <View style={styles.actionRow}>
            {trip.published ? (
              <Pressable style={styles.likeBtn} onPress={toggleLike} hitSlop={6}>
                <Ionicons
                  name={trip.likedByMe ? 'heart' : 'heart-outline'}
                  size={20}
                  color={trip.likedByMe ? KIOKU.accent : KIOKU.ink}
                />
                <Text style={styles.likeText}>{trip.likesCount}</Text>
              </Pressable>
            ) : null}

            {isOwner ? (
              <Pressable
                style={[styles.pubBtn, trip.published ? styles.pubBtnOn : styles.pubBtnOff, busy && { opacity: 0.6 }]}
                onPress={togglePublish}
                disabled={busy}
              >
                <Ionicons
                  name={trip.published ? 'globe-outline' : 'cloud-upload-outline'}
                  size={16}
                  color={trip.published ? KIOKU.success : '#fff'}
                />
                <Text style={[styles.pubText, trip.published ? { color: KIOKU.success } : { color: '#fff' }]}>
                  {trip.published ? 'Published' : 'Publish'}
                </Text>
              </Pressable>
            ) : null}
          </View>

          <Pressable style={styles.recapBtn} onPress={() => router.push(`/recap/${trip.id}`)}>
            <Ionicons name="stats-chart-outline" size={16} color={KIOKU.ink} />
            <Text style={styles.recapText}>View trip recap</Text>
            <Ionicons name="chevron-forward" size={16} color={KIOKU.inkMuted} />
          </Pressable>

          {trip.published ? (
            <>
              <Pressable
                style={styles.recapBtn}
                onPress={() => router.push(`/comments/${trip.id}?owner=${isOwner ? 1 : 0}`)}
              >
                <Ionicons name="chatbubble-outline" size={16} color={KIOKU.ink} />
                <Text style={styles.recapText}>Comments</Text>
                <Ionicons name="chevron-forward" size={16} color={KIOKU.inkMuted} />
              </Pressable>
              <Pressable style={styles.recapBtn} onPress={() => router.push(`/share-trip/${trip.id}`)}>
                <Ionicons name="paper-plane-outline" size={16} color={KIOKU.ink} />
                <Text style={styles.recapText}>Share to a chat</Text>
                <Ionicons name="chevron-forward" size={16} color={KIOKU.inkMuted} />
              </Pressable>
            </>
          ) : null}

          {/* Day pager */}
          <View style={styles.pager}>
            <Pressable
              style={[styles.arrow, selected === 0 && styles.arrowDisabled]}
              onPress={() => setSelected((s) => Math.max(0, s - 1))}
              disabled={selected === 0}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={22} color={selected === 0 ? KIOKU.borderStrong : KIOKU.ink} />
            </Pressable>
            <View style={styles.pagerCenter}>
              <Text style={styles.pagerDay}>Day {selected + 1}</Text>
              <Text style={styles.pagerDate}>
                {formatDayLabel(day.day)}
                {day.day === toYMD(new Date()) ? ' · Today' : ''}
              </Text>
            </View>
            <Pressable
              style={[styles.arrow, selected === trip.days.length - 1 && styles.arrowDisabled]}
              onPress={() => setSelected((s) => Math.min(trip.days.length - 1, s + 1))}
              disabled={selected === trip.days.length - 1}
              hitSlop={8}
            >
              <Ionicons
                name="chevron-forward"
                size={22}
                color={selected === trip.days.length - 1 ? KIOKU.borderStrong : KIOKU.ink}
              />
            </Pressable>
          </View>

          <DayView key={day.day} trip={trip} day={day} isOwner={isOwner} onChanged={() => load(true)} />
        </View>
      </ScrollView>
    </View>
  )
}

function Stat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: number; label: string }) {
  const [styles, KIOKU] = useStyles(makeStyles)
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={17} color={KIOKU.accent} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function DayView({
  trip,
  day,
  isOwner,
  onChanged,
}: {
  trip: PublicTrip
  day: PublicDay
  isOwner: boolean
  onChanged: () => void
}) {
  const [styles, KIOKU] = useStyles(makeStyles)
  const [placeModal, setPlaceModal] = useState<null | { place?: PublicPlace }>(null)
  const [editingNote, setEditingNote] = useState(false)
  const [expenseModal, setExpenseModal] = useState<null | { expense?: PublicExpense }>(null)
  const [uploading, setUploading] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const hasNote = !!day.note.trim()

  function confirmDelete(label: string, run: () => Promise<unknown>) {
    Alert.alert(`Delete ${label}?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await run()
            onChanged()
          } catch (e) {
            Alert.alert('Could not delete', e instanceof Error ? e.message : 'Please try again.')
          }
        },
      },
    ])
  }

  async function addPhoto() {
    setPhotoError(null)
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      setPhotoError('Photo access is needed to add photos.')
      return
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    })
    if (picked.canceled || !picked.assets?.length) return

    setUploading(true)
    try {
      // Re-encode to JPEG (iOS assets are often HEIC, which S3 rejects) and shrink.
      const jpeg = await manipulateAsync(picked.assets[0].uri, [{ resize: { width: 1600 } }], {
        compress: 0.7,
        format: SaveFormat.JPEG,
      })
      const { uploadUrl, key, publicUrl } = await api.getPhotoUploadUrl(trip.id, 'image/jpeg')
      const blob = await (await fetch(jpeg.uri)).blob()
      const put = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body: blob,
      })
      if (!put.ok) throw new Error('Upload to storage failed')
      await api.createPhoto(trip.id, { day: day.day, key, publicUrl })
      onChanged()
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : 'Could not add photo.')
    } finally {
      setUploading(false)
    }
  }

  const dayYen = day.expenses.reduce((s, e) => s + e.amountYen, 0)
  const dayHome = day.expenses.reduce((s, e) => s + e.amountHome, 0)

  return (
    <View style={styles.dayCard}>
      {/* Note */}
      <View style={styles.noteRow}>
        {hasNote ? (
          <Text style={styles.note}>{day.note.trim()}</Text>
        ) : (
          <Text style={styles.notePlaceholder}>{isOwner ? 'No note yet — jot down the plan for the day.' : 'No note for this day.'}</Text>
        )}
        {isOwner ? (
          <Pressable onPress={() => setEditingNote(true)} hitSlop={8} style={styles.noteEdit}>
            <Ionicons name={hasNote ? 'create-outline' : 'add'} size={18} color={KIOKU.accent} />
          </Pressable>
        ) : null}
      </View>

      {/* Places */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionLabel}>Places</Text>
        {isOwner ? (
          <Pressable onPress={() => setPlaceModal({})} hitSlop={8} style={styles.addLink}>
            <Ionicons name="add" size={16} color={KIOKU.accent} />
            <Text style={styles.addLinkText}>Add place</Text>
          </Pressable>
        ) : null}
      </View>

      {day.places.length === 0 ? (
        <Text style={styles.emptyLine}>No places added.</Text>
      ) : (
        day.places.map((p) => {
          const row = (
            <View style={styles.place}>
              <Ionicons name="location" size={16} color={KIOKU.accent} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.placeName}>{p.name}</Text>
                {p.address ? (
                  <Text style={styles.placeAddr} numberOfLines={1}>
                    {p.address}
                  </Text>
                ) : null}
              </View>
            </View>
          )
          return isOwner ? (
            <SwipeableRow
              key={p.id}
              containerStyle={styles.swipeRow}
              onEdit={() => setPlaceModal({ place: p })}
              onDelete={() => confirmDelete('place', () => api.deletePlace(trip.id, p.id))}
            >
              {row}
            </SwipeableRow>
          ) : (
            <View key={p.id} style={styles.rowGap}>
              {row}
            </View>
          )
        })
      )}

      {/* Expenses */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionLabel}>Expenses</Text>
        {isOwner ? (
          <Pressable onPress={() => setExpenseModal({})} hitSlop={8} style={styles.addLink}>
            <Ionicons name="add" size={16} color={KIOKU.accent} />
            <Text style={styles.addLinkText}>Add expense</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.budgetCard}>
        <View style={styles.budgetTopRow}>
          <Text style={styles.budgetToday}>{yen(dayYen)}</Text>
          <Text style={styles.budgetHome}>
            {dayHome.toFixed(2)} {trip.homeCurrency}
          </Text>
        </View>
        <BudgetBar spent={dayYen} budget={trip.dailyBudget} />
      </View>

      {day.expenses.length === 0 ? (
        <Text style={styles.emptyLine}>No expenses logged.</Text>
      ) : (
        day.expenses.map((e) => {
          const row = (
            <View style={styles.expense}>
              <Text style={styles.expenseEmoji}>{CATEGORY_EMOJI[e.category]}</Text>
              <Text style={styles.expenseName} numberOfLines={1}>
                {e.name}
              </Text>
              <View style={styles.expenseAmounts}>
                <Text style={styles.expenseYen}>{yen(e.amountYen)}</Text>
                <Text style={styles.expenseHome}>
                  {e.amountHome.toFixed(2)} {trip.homeCurrency}
                </Text>
              </View>
            </View>
          )
          return isOwner ? (
            <SwipeableRow
              key={e.id}
              containerStyle={styles.swipeRow}
              onEdit={() => setExpenseModal({ expense: e })}
              onDelete={() => confirmDelete('expense', () => api.deleteExpense(trip.id, e.id))}
            >
              {row}
            </SwipeableRow>
          ) : (
            <View key={e.id} style={styles.rowGap}>
              {row}
            </View>
          )
        })
      )}

      {/* Photos */}
      {isOwner || day.photos.length > 0 ? (
        <>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionLabel}>Photos</Text>
            {isOwner ? (
              <Pressable onPress={addPhoto} hitSlop={8} style={styles.addLink} disabled={uploading}>
                {uploading ? (
                  <ActivityIndicator size="small" color={KIOKU.accent} />
                ) : (
                  <>
                    <Ionicons name="add" size={16} color={KIOKU.accent} />
                    <Text style={styles.addLinkText}>Add photo</Text>
                  </>
                )}
              </Pressable>
            ) : null}
          </View>
          {photoError ? <Text style={styles.modalErr}>{photoError}</Text> : null}
          {day.photos.length === 0 ? (
            <Text style={styles.emptyLine}>No photos yet.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 2 }}>
              {day.photos.map((ph) => (
                <View key={ph.id} style={styles.photoWrap}>
                  <Image source={{ uri: ph.url }} style={styles.photo} contentFit="cover" transition={150} />
                  {isOwner ? (
                    <Pressable
                      style={styles.photoDelete}
                      hitSlop={6}
                      onPress={() => confirmDelete('photo', () => api.deletePhoto(trip.id, ph.id))}
                    >
                      <Ionicons name="close" size={15} color="#fff" />
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          )}
        </>
      ) : null}

      <PlaceModal
        state={placeModal}
        tripId={trip.id}
        day={day.day}
        onClose={() => setPlaceModal(null)}
        onSaved={() => {
          setPlaceModal(null)
          onChanged()
        }}
      />
      <EditNoteModal
        visible={editingNote}
        tripId={trip.id}
        day={day.day}
        initial={day.note}
        onClose={() => setEditingNote(false)}
        onSaved={() => {
          setEditingNote(false)
          onChanged()
        }}
      />
      <ExpenseModal
        state={expenseModal}
        tripId={trip.id}
        day={day.day}
        onClose={() => setExpenseModal(null)}
        onSaved={() => {
          setExpenseModal(null)
          onChanged()
        }}
      />
    </View>
  )
}

function BudgetBar({ spent, budget }: { spent: number; budget: number }) {
  const [styles, KIOKU] = useStyles(makeStyles)
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0
  const over = spent > budget
  return (
    <View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%` }, over && styles.barFillOver]} />
      </View>
      <Text style={[styles.barLabel, over && { color: KIOKU.danger }]}>
        {budget <= 0
          ? 'No daily budget set'
          : over
            ? `${yen(spent - budget)} over budget today`
            : `${yen(budget - spent)} left today`}
      </Text>
    </View>
  )
}

function ExpenseModal({
  state,
  tripId,
  day,
  onClose,
  onSaved,
}: {
  state: null | { expense?: PublicExpense }
  tripId: string
  day: string
  onClose: () => void
  onSaved: () => void
}) {
  const [styles, KIOKU] = useStyles(makeStyles)
  const visible = state !== null
  const editing = state?.expense
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('food')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      setName(editing?.name ?? '')
      setAmount(editing ? String(editing.amountYen) : '')
      setCategory(editing?.category ?? 'food')
      setErr(null)
      setBusy(false)
    }
  }, [visible, editing])

  async function save() {
    if (!name.trim()) return setErr('Enter what you spent on.')
    const amountYen = Math.round(Number(amount))
    if (!amountYen || amountYen <= 0) return setErr('Enter an amount in yen.')
    setBusy(true)
    try {
      if (editing) {
        await api.updateExpense(tripId, editing.id, { name: name.trim(), category, amountYen })
      } else {
        await api.addExpense(tripId, { day, name: name.trim(), category, amountYen })
      }
      onSaved()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save expense.')
      setBusy(false)
    }
  }

  return (
    <SheetModal
      visible={visible}
      title={editing ? 'Edit expense' : 'Add expense'}
      onClose={onClose}
      onSave={save}
      busy={busy}
      saveLabel={editing ? 'Save' : 'Add'}
    >
      {err ? <Text style={styles.modalErr}>{err}</Text> : null}
      <TextInput
        style={styles.modalInput}
        placeholder="What was it? (e.g. Ramen lunch)"
        placeholderTextColor={KIOKU.inkMuted}
        value={name}
        onChangeText={setName}
        autoFocus
      />
      <TextInput
        style={styles.modalInput}
        placeholder="Amount in yen (¥)"
        placeholderTextColor={KIOKU.inkMuted}
        value={amount}
        onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
      />
      <View style={styles.catRow}>
        {CATEGORIES.map((c) => {
          const on = category === c.value
          return (
            <Pressable
              key={c.value}
              style={[styles.catChip, on && styles.catChipOn]}
              onPress={() => setCategory(c.value)}
            >
              <Text style={styles.catEmoji}>{c.emoji}</Text>
              <Text style={[styles.catLabel, on && styles.catLabelOn]}>{c.label}</Text>
            </Pressable>
          )
        })}
      </View>
    </SheetModal>
  )
}

function PlaceModal({
  state,
  tripId,
  day,
  onClose,
  onSaved,
}: {
  state: null | { place?: PublicPlace }
  tripId: string
  day: string
  onClose: () => void
  onSaved: () => void
}) {
  const [styles, KIOKU] = useStyles(makeStyles)
  const visible = state !== null
  const editing = state?.place
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      setName(editing?.name ?? '')
      setAddress(editing?.address ?? '')
      setErr(null)
      setBusy(false)
    }
  }, [visible, editing])

  async function save() {
    if (!name.trim()) return setErr('Enter a place name.')
    setBusy(true)
    try {
      if (editing) {
        await api.updatePlace(tripId, editing.id, name.trim())
      } else {
        await api.addPlace(tripId, { day, name: name.trim(), address: address.trim() })
      }
      onSaved()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save place.')
      setBusy(false)
    }
  }

  return (
    <SheetModal
      visible={visible}
      title={editing ? 'Edit place' : 'Add place'}
      onClose={onClose}
      onSave={save}
      busy={busy}
      saveLabel={editing ? 'Save' : 'Add'}
    >
      {err ? <Text style={styles.modalErr}>{err}</Text> : null}
      <TextInput
        style={styles.modalInput}
        placeholder="Place name"
        placeholderTextColor={KIOKU.inkMuted}
        value={name}
        onChangeText={setName}
        autoFocus
      />
      {editing ? null : (
        <TextInput
          style={styles.modalInput}
          placeholder="Address (optional)"
          placeholderTextColor={KIOKU.inkMuted}
          value={address}
          onChangeText={setAddress}
        />
      )}
    </SheetModal>
  )
}

function EditNoteModal({
  visible,
  tripId,
  day,
  initial,
  onClose,
  onSaved,
}: {
  visible: boolean
  tripId: string
  day: string
  initial: string
  onClose: () => void
  onSaved: () => void
}) {
  const [styles, KIOKU] = useStyles(makeStyles)
  const [note, setNote] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      setNote(initial)
      setErr(null)
      setBusy(false)
    }
  }, [visible, initial])

  async function save() {
    setBusy(true)
    try {
      await api.setDayNote(tripId, day, note.trim())
      onSaved()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save note.')
      setBusy(false)
    }
  }

  return (
    <SheetModal visible={visible} title="Day note" onClose={onClose} onSave={save} busy={busy} saveLabel="Save">
      {err ? <Text style={styles.modalErr}>{err}</Text> : null}
      <TextInput
        style={[styles.modalInput, styles.modalTextarea]}
        placeholder="What's the plan for this day?"
        placeholderTextColor={KIOKU.inkMuted}
        value={note}
        onChangeText={setNote}
        multiline
        autoFocus
      />
    </SheetModal>
  )
}

function SheetModal({
  visible,
  title,
  saveLabel,
  busy,
  onClose,
  onSave,
  children,
}: {
  visible: boolean
  title: string
  saveLabel: string
  busy: boolean
  onClose: () => void
  onSave: () => void
  children: React.ReactNode
}) {
  const [styles] = useStyles(makeStyles)
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.modalBackdropFill} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHead}>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={onSave} disabled={busy} hitSlop={8}>
              <Text style={[styles.modalSave, busy && { opacity: 0.5 }]}>{busy ? '…' : saveLabel}</Text>
            </Pressable>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function makeStyles(KIOKU: Theme) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: KIOKU.bg },
  centered: { justifyContent: 'center' },

  hero: { height: 260, position: 'relative', backgroundColor: KIOKU.surfaceAlt },
  heroImg: { width: '100%', height: '100%' },
  heroEmpty: { alignItems: 'center', justifyContent: 'center' },
  heroScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 130, backgroundColor: 'rgba(24,14,9,0.34)' },
  heroText: { position: 'absolute', left: 20, right: 20, bottom: 18 },
  heroName: { fontSize: 28, fontFamily: FONT.displayHeavy, color: '#fff', letterSpacing: -0.4 },
  heroMeta: { fontSize: 14, color: 'rgba(255,255,255,0.94)', marginTop: 3 },

  back: {
    position: 'absolute',
    left: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(24,14,9,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: { paddingHorizontal: 20, paddingTop: 18 },
  byline: { fontSize: 14, color: KIOKU.inkMuted, fontWeight: '600' },
  bylineLink: { color: KIOKU.accent, fontWeight: '700' },

  stats: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: KIOKU.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: KIOKU.border,
    paddingVertical: 14,
  },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontSize: 17, fontWeight: '800', color: KIOKU.ink },
  statLabel: { fontSize: 11.5, color: KIOKU.inkMuted },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: KIOKU.surface,
    borderWidth: 1,
    borderColor: KIOKU.border,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  likeText: { fontSize: 14, fontWeight: '700', color: KIOKU.ink },
  pubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginLeft: 'auto',
  },
  pubBtnOff: { backgroundColor: KIOKU.accent },
  pubBtnOn: { backgroundColor: KIOKU.surface, borderWidth: 1, borderColor: KIOKU.success },
  pubText: { fontSize: 14, fontWeight: '700' },

  recapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: KIOKU.surface,
    borderWidth: 1,
    borderColor: KIOKU.border,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  recapText: { flex: 1, fontSize: 14.5, fontWeight: '700', color: KIOKU.ink },

  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 6,
  },
  arrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: KIOKU.surface,
    borderWidth: 1,
    borderColor: KIOKU.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: { backgroundColor: KIOKU.surfaceAlt, borderColor: KIOKU.surfaceAlt },
  pagerCenter: { flex: 1, alignItems: 'center' },
  pagerDay: { fontSize: 20, fontFamily: FONT.displayHeavy, color: KIOKU.ink, letterSpacing: -0.3 },
  pagerDate: { fontSize: 13.5, color: KIOKU.inkMuted, marginTop: 1 },

  dayCard: { marginTop: 12 },

  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: KIOKU.surface,
    borderWidth: 1,
    borderColor: KIOKU.border,
    borderRadius: 14,
    padding: 14,
  },
  note: { flex: 1, fontSize: 15, lineHeight: 21, color: KIOKU.ink },
  notePlaceholder: { flex: 1, fontSize: 14, color: KIOKU.inkMuted, fontStyle: 'italic' },
  noteEdit: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: KIOKU.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 8 },
  sectionLabel: { fontSize: 16, fontFamily: FONT.displaySemi, color: KIOKU.ink },
  addLink: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  addLinkText: { fontSize: 14, fontWeight: '600', color: KIOKU.accent },
  emptyLine: { fontSize: 14, color: KIOKU.inkMuted, fontStyle: 'italic' },

  rowGap: { marginBottom: 8 },
  swipeRow: { marginBottom: 8, borderRadius: 12, overflow: 'hidden' },
  place: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: KIOKU.surface,
    borderWidth: 1,
    borderColor: KIOKU.border,
    borderRadius: 12,
    padding: 13,
  },
  placeName: { fontSize: 15, fontWeight: '600', color: KIOKU.ink },
  placeAddr: { fontSize: 13, color: KIOKU.inkMuted, marginTop: 1 },

  photoWrap: { position: 'relative', marginRight: 10 },
  photo: { width: 130, height: 130, borderRadius: 12, backgroundColor: KIOKU.surfaceAlt },
  photoDelete: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(24,14,9,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  budgetCard: {
    backgroundColor: KIOKU.surface,
    borderWidth: 1,
    borderColor: KIOKU.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  budgetTopRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 },
  budgetToday: { fontSize: 22, fontWeight: '800', color: KIOKU.ink, letterSpacing: -0.3 },
  budgetHome: { fontSize: 13, color: KIOKU.inkMuted },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: KIOKU.surfaceAlt, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: KIOKU.success },
  barFillOver: { backgroundColor: KIOKU.danger },
  barLabel: { fontSize: 12.5, color: KIOKU.inkMuted, marginTop: 7, fontWeight: '600' },

  expense: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: KIOKU.surface,
    borderWidth: 1,
    borderColor: KIOKU.border,
    borderRadius: 12,
    padding: 13,
  },
  expenseEmoji: { fontSize: 20 },
  expenseName: { flex: 1, fontSize: 15, fontWeight: '600', color: KIOKU.ink },
  expenseAmounts: { alignItems: 'flex-end' },
  expenseYen: { fontSize: 15, fontWeight: '700', color: KIOKU.ink },
  expenseHome: { fontSize: 12, color: KIOKU.inkMuted, marginTop: 1 },

  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: KIOKU.surface,
    borderWidth: 1,
    borderColor: KIOKU.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  catChipOn: { backgroundColor: KIOKU.accentSoft, borderColor: KIOKU.accent },
  catEmoji: { fontSize: 15 },
  catLabel: { fontSize: 13.5, fontWeight: '600', color: KIOKU.inkMuted },
  catLabelOn: { color: KIOKU.ink },

  // modal
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  modalBackdropFill: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(24,14,9,0.4)' },
  modalSheet: {
    backgroundColor: KIOKU.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    paddingBottom: 34,
  },
  modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: KIOKU.ink },
  modalCancel: { fontSize: 15, color: KIOKU.inkMuted },
  modalSave: { fontSize: 15, fontWeight: '700', color: KIOKU.accent },
  modalErr: { color: KIOKU.danger, fontSize: 13.5, marginBottom: 10 },
  modalInput: {
    backgroundColor: KIOKU.surface,
    borderWidth: 1,
    borderColor: KIOKU.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: KIOKU.ink,
    marginBottom: 10,
  },
  modalTextarea: { minHeight: 110, textAlignVertical: 'top' },
  })
}

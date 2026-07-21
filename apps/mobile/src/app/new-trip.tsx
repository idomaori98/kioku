import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import DateTimePicker from '@react-native-community/datetimepicker'
import { api, type Trip } from '@/lib/api'
import { KIOKU } from '@/constants/kioku'

const TRAVEL_TYPES: { value: Trip['travelType']; label: string }[] = [
  { value: 'family', label: 'Family' },
  { value: 'couple', label: 'Couple' },
  { value: 'solo', label: 'Solo' },
  { value: 'friends', label: 'Friends' },
]

function toYMD(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fromYMD(s: string) {
  return new Date(`${s}T00:00:00`)
}

function prettyDate(s: string) {
  return fromYMD(s).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function NewTripScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const today = toYMD(new Date())

  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [dailyBudget, setDailyBudget] = useState('')
  const [homeCurrency, setHomeCurrency] = useState('USD')
  const [tripType, setTripType] = useState<'shared' | 'family'>('shared')
  const [travelType, setTravelType] = useState<Trip['travelType']>('family')

  const [picker, setPicker] = useState<null | 'start' | 'end'>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function onPickDate(_: unknown, d?: Date) {
    if (Platform.OS === 'android') setPicker(null)
    if (!d) return
    const ymd = toYMD(d)
    if (picker === 'start') {
      setStartDate(ymd)
      if (endDate < ymd) setEndDate(ymd)
    } else if (picker === 'end') {
      setEndDate(ymd)
    }
  }

  async function submit() {
    setError(null)
    if (!name.trim()) return setError('Give your trip a name.')
    const budget = Number(dailyBudget)
    if (!budget || budget <= 0) return setError('Daily budget must be a positive number.')
    if (!homeCurrency.trim()) return setError('Home currency is required.')
    if (startDate < today) return setError('Start date cannot be in the past.')
    if (endDate < startDate) return setError('End date cannot be before the start date.')

    setSubmitting(true)
    try {
      const trip = await api.createTrip({
        name: name.trim(),
        destination: destination.trim() || undefined,
        startDate,
        endDate,
        dailyBudget: budget,
        homeCurrency: homeCurrency.trim().toUpperCase(),
        tripType,
        travelType,
      })
      router.replace(`/trip/${trip.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create trip.')
      setSubmitting(false)
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.topbarBtn}>
          <Ionicons name="close" size={24} color={KIOKU.ink} />
        </Pressable>
        <Text style={styles.topbarTitle}>New trip</Text>
        <View style={styles.topbarBtn} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 44}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Field label="Trip name">
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Spring in Kyoto"
              placeholderTextColor={KIOKU.inkMuted}
              returnKeyType="next"
            />
          </Field>

          <Field label="Destination" hint="Optional — helps others find it if you publish">
            <TextInput
              style={styles.input}
              value={destination}
              onChangeText={setDestination}
              placeholder="e.g. Kyoto, Japan"
              placeholderTextColor={KIOKU.inkMuted}
            />
          </Field>

          <View style={styles.row}>
            <Field label="Start date" style={{ flex: 1 }}>
              <Pressable style={styles.input} onPress={() => setPicker(picker === 'start' ? null : 'start')}>
                <Text style={styles.dateText}>{prettyDate(startDate)}</Text>
              </Pressable>
            </Field>
            <Field label="End date" style={{ flex: 1 }}>
              <Pressable style={styles.input} onPress={() => setPicker(picker === 'end' ? null : 'end')}>
                <Text style={styles.dateText}>{prettyDate(endDate)}</Text>
              </Pressable>
            </Field>
          </View>

          {picker ? (
            <DateTimePicker
              value={fromYMD(picker === 'start' ? startDate : endDate)}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              minimumDate={fromYMD(picker === 'end' ? startDate : today)}
              accentColor={KIOKU.accent}
              onChange={onPickDate}
            />
          ) : null}

          <View style={styles.row}>
            <Field label="Daily budget" style={{ flex: 1 }}>
              <TextInput
                style={styles.input}
                value={dailyBudget}
                onChangeText={(t) => setDailyBudget(t.replace(/[^0-9.]/g, ''))}
                placeholder="0"
                placeholderTextColor={KIOKU.inkMuted}
                keyboardType="decimal-pad"
              />
            </Field>
            <Field label="Currency" style={{ flex: 1 }}>
              <TextInput
                style={styles.input}
                value={homeCurrency}
                onChangeText={(t) => setHomeCurrency(t.toUpperCase().slice(0, 3))}
                placeholder="USD"
                placeholderTextColor={KIOKU.inkMuted}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </Field>
          </View>

          <Field label="Expenses">
            <OptionCard
              selected={tripType === 'shared'}
              title="Shared expenses"
              subtitle="Track who paid for each expense"
              onPress={() => setTripType('shared')}
            />
            <OptionCard
              selected={tripType === 'family'}
              title="One pot"
              subtitle="Just log the spending, no splitting"
              onPress={() => setTripType('family')}
            />
          </Field>

          <Field label="Who's traveling?">
            <View style={styles.segment}>
              {TRAVEL_TYPES.map((t) => {
                const on = travelType === t.value
                return (
                  <Pressable
                    key={t.value}
                    style={[styles.segmentItem, on && styles.segmentItemOn]}
                    onPress={() => setTravelType(t.value)}
                  >
                    <Text style={[styles.segmentText, on && styles.segmentTextOn]}>{t.label}</Text>
                  </Pressable>
                )
              })}
            </View>
          </Field>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.submit, submitting && { opacity: 0.6 }]}
            onPress={submit}
            disabled={submitting}
          >
            <Text style={styles.submitText}>{submitting ? 'Creating…' : 'Create trip'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

function Field({
  label,
  hint,
  style,
  children,
}: {
  label: string
  hint?: string
  style?: object
  children: React.ReactNode
}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  )
}

function OptionCard({
  selected,
  title,
  subtitle,
  onPress,
}: {
  selected: boolean
  title: string
  subtitle: string
  onPress: () => void
}) {
  return (
    <Pressable style={[styles.option, selected && styles.optionOn]} onPress={onPress}>
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={20}
        color={selected ? KIOKU.accent : KIOKU.borderStrong}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSub}>{subtitle}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: KIOKU.bg },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: KIOKU.border,
  },
  topbarBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topbarTitle: { fontSize: 17, fontWeight: '700', color: KIOKU.ink },

  field: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: KIOKU.ink, marginBottom: 7 },
  hint: { fontSize: 12, color: KIOKU.inkMuted, marginTop: 5 },
  input: {
    backgroundColor: KIOKU.surface,
    borderWidth: 1,
    borderColor: KIOKU.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: KIOKU.ink,
    justifyContent: 'center',
  },
  dateText: { fontSize: 15, color: KIOKU.ink },
  row: { flexDirection: 'row', gap: 12 },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: KIOKU.surface,
    borderWidth: 1,
    borderColor: KIOKU.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  optionOn: { borderColor: KIOKU.accent, backgroundColor: KIOKU.accentSoft },
  optionTitle: { fontSize: 15, fontWeight: '600', color: KIOKU.ink },
  optionSub: { fontSize: 13, color: KIOKU.inkMuted, marginTop: 1 },

  segment: {
    flexDirection: 'row',
    backgroundColor: KIOKU.surfaceAlt,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 9 },
  segmentItemOn: { backgroundColor: KIOKU.accent },
  segmentText: { fontSize: 13.5, fontWeight: '600', color: KIOKU.inkMuted },
  segmentTextOn: { color: '#fff' },

  error: { color: KIOKU.danger, fontSize: 14, marginBottom: 12, fontWeight: '500' },
  submit: {
    backgroundColor: KIOKU.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})

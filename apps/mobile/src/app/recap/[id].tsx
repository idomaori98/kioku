import { useCallback, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api, type Recap, type PublicTrip, type ExpenseCategory } from '@/lib/api'
import { KIOKU } from '@/constants/kioku'
import { ErrorState, Loading } from '@/components/ui'

const CATEGORY_ORDER: ExpenseCategory[] = ['food', 'transport', 'fun', 'shopping', 'other']

// Build the same recap shape from an itinerary payload, so viewers who aren't
// members (the member-gated /recap 403s for them) still get a recap of a
// published trip. Totals reflect the public view (hidden items already excluded).
function recapFromItinerary(t: PublicTrip): Recap {
  const cats: Partial<Record<ExpenseCategory, { yen: number; home: number }>> = {}
  const days = t.days.map((d) => {
    for (const e of d.expenses) {
      const c = (cats[e.category] ??= { yen: 0, home: 0 })
      c.yen += e.amountYen
      c.home += e.amountHome
    }
    return {
      day: d.day,
      note: d.note,
      expenseYen: d.expenses.reduce((s, e) => s + e.amountYen, 0),
      expenseHome: d.expenses.reduce((s, e) => s + e.amountHome, 0),
      photoCount: d.photos.length,
      placeCount: d.places.length,
    }
  })
  return {
    totals: {
      days: t.stats.days,
      travelers: t.stats.travelers,
      photos: t.stats.photos,
      places: t.stats.places,
      spendYen: t.stats.spendYen,
      spendHome: t.stats.spendHome,
      homeCurrency: t.homeCurrency,
    },
    spendingByCategory: CATEGORY_ORDER.map((category) => ({
      category,
      yen: cats[category]?.yen ?? 0,
      home: cats[category]?.home ?? 0,
    })).filter((c) => c.yen > 0),
    photos: t.days.flatMap((d) => d.photos.map((p) => ({ id: p.id, url: p.url, day: d.day }))),
    places: t.days.flatMap((d) =>
      d.places
        .filter((p) => p.lat != null && p.lng != null)
        .map((p) => ({ id: p.id, name: p.name, lat: p.lat as number, lng: p.lng as number, day: d.day }))
    ),
    days,
  }
}

const CATEGORY_META: Record<ExpenseCategory, { emoji: string; label: string; color: string }> = {
  food: { emoji: '🍜', label: 'Food', color: '#c1443c' },
  transport: { emoji: '🚆', label: 'Transit', color: '#3f7cac' },
  fun: { emoji: '🎡', label: 'Fun', color: '#b5548f' },
  shopping: { emoji: '🛍️', label: 'Shopping', color: '#0f6e56' },
  other: { emoji: '📦', label: 'Other', color: '#8a7f6f' },
}

const yen = (n: number) => `¥${Math.round(n).toLocaleString()}`

function formatDayLabel(dayKey: string) {
  return new Date(`${dayKey}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export default function RecapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [recap, setRecap] = useState<Recap | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setError(null)
    setRecap(null)
    try {
      let r: Recap
      try {
        // Member view — full recap (includes items hidden from the public).
        r = await api.getRecap(id)
      } catch {
        // Non-member viewing a published trip — derive from the public itinerary.
        r = recapFromItinerary(await api.getItinerary(id))
      }
      setRecap(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    }
  }, [id])

  useFocusEffect(useCallback(() => void load(), [load]))

  if (error || !recap) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <TopBar onBack={() => router.back()} />
        <View style={styles.centered}>
          {error ? <ErrorState message={error} onRetry={load} /> : <Loading />}
        </View>
      </View>
    )
  }

  const t = recap.totals
  const maxCatYen = Math.max(...recap.spendingByCategory.map((c) => c.yen), 1)

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <TopBar onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32 }}>
        {/* Totals */}
        <View style={styles.totalsCard}>
          <View style={styles.totalsGrid}>
            <Total value={t.days} label="days" />
            <Total value={t.travelers} label={t.travelers === 1 ? 'traveler' : 'travelers'} />
            <Total value={t.places} label="places" />
            <Total value={t.photos} label="photos" />
          </View>
          <View style={styles.spendRow}>
            <Text style={styles.spendLabel}>Total spend</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.spendYen}>{yen(t.spendYen)}</Text>
              <Text style={styles.spendHome}>
                {t.spendHome.toFixed(2)} {t.homeCurrency}
              </Text>
            </View>
          </View>
        </View>

        {/* Spending by category */}
        {recap.spendingByCategory.length > 0 ? (
          <>
            <Text style={styles.section}>Spending by category</Text>
            <View style={styles.catCard}>
              {recap.spendingByCategory
                .slice()
                .sort((a, b) => b.yen - a.yen)
                .map((c) => {
                  const meta = CATEGORY_META[c.category]
                  return (
                    <View key={c.category} style={styles.catRow}>
                      <Text style={styles.catEmoji}>{meta.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <View style={styles.catTopLine}>
                          <Text style={styles.catLabel}>{meta.label}</Text>
                          <Text style={styles.catAmount}>{yen(c.yen)}</Text>
                        </View>
                        <View style={styles.catTrack}>
                          <View
                            style={[
                              styles.catFill,
                              { width: `${Math.max(4, (c.yen / maxCatYen) * 100)}%`, backgroundColor: meta.color },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  )
                })}
            </View>
          </>
        ) : null}

        {/* Highlights */}
        {recap.photos.length > 0 ? (
          <>
            <Text style={styles.section}>Highlights</Text>
            <View style={styles.photoGrid}>
              {recap.photos.slice(0, 9).map((p) => (
                <Image key={p.id} source={{ uri: p.url }} style={styles.gridPhoto} contentFit="cover" transition={150} />
              ))}
            </View>
          </>
        ) : null}

        {/* Day by day */}
        <Text style={styles.section}>Day by day</Text>
        {recap.days.map((d, i) => (
          <View key={d.day} style={styles.dayRow}>
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dayDate}>{formatDayLabel(d.day)}</Text>
              {d.note.trim() ? (
                <Text style={styles.dayNote} numberOfLines={2}>
                  {d.note.trim()}
                </Text>
              ) : null}
              <Text style={styles.dayMeta}>
                {yen(d.expenseYen)} · {d.placeCount} place{d.placeCount === 1 ? '' : 's'} · {d.photoCount} photo
                {d.photoCount === 1 ? '' : 's'}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

function TopBar({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.topbar}>
      <Pressable onPress={onBack} hitSlop={10} style={styles.topbarBtn}>
        <Ionicons name="chevron-back" size={24} color={KIOKU.ink} />
      </Pressable>
      <Text style={styles.topbarTitle}>Trip recap</Text>
      <View style={styles.topbarBtn} />
    </View>
  )
}

function Total({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.total}>
      <Text style={styles.totalValue}>{value}</Text>
      <Text style={styles.totalLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: KIOKU.bg },
  centered: { flex: 1, justifyContent: 'center' },

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

  totalsCard: {
    backgroundColor: KIOKU.surface,
    borderWidth: 1,
    borderColor: KIOKU.border,
    borderRadius: 16,
    padding: 16,
  },
  totalsGrid: { flexDirection: 'row' },
  total: { flex: 1, alignItems: 'center', gap: 2 },
  totalValue: { fontSize: 22, fontWeight: '800', color: KIOKU.ink },
  totalLabel: { fontSize: 12, color: KIOKU.inkMuted },
  spendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: KIOKU.border,
  },
  spendLabel: { fontSize: 15, fontWeight: '700', color: KIOKU.ink },
  spendYen: { fontSize: 20, fontWeight: '800', color: KIOKU.accent },
  spendHome: { fontSize: 12.5, color: KIOKU.inkMuted },

  section: { fontSize: 18, fontWeight: '800', color: KIOKU.ink, marginTop: 26, marginBottom: 10, letterSpacing: -0.3 },

  catCard: {
    backgroundColor: KIOKU.surface,
    borderWidth: 1,
    borderColor: KIOKU.border,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catEmoji: { fontSize: 20 },
  catTopLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catLabel: { fontSize: 14, fontWeight: '600', color: KIOKU.ink },
  catAmount: { fontSize: 14, fontWeight: '700', color: KIOKU.ink },
  catTrack: { height: 8, borderRadius: 4, backgroundColor: KIOKU.surfaceAlt, overflow: 'hidden' },
  catFill: { height: 8, borderRadius: 4 },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  gridPhoto: {
    width: '32%',
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: KIOKU.surfaceAlt,
  },

  dayRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: KIOKU.surface,
    borderWidth: 1,
    borderColor: KIOKU.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  dayBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: KIOKU.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  dayDate: { fontSize: 15, fontWeight: '700', color: KIOKU.ink },
  dayNote: { fontSize: 13.5, color: KIOKU.ink, marginTop: 3, lineHeight: 19 },
  dayMeta: { fontSize: 12.5, color: KIOKU.inkMuted, marginTop: 5, fontWeight: '600' },
})

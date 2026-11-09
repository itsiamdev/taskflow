import { router } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton, Card, EmptyState, Page, PageHeading } from '@/components/taskflow-ui';
import { Palette } from '@/constants/theme';
import { dateKey, useTaskFlowStore } from '@/store/taskflow-store';

export default function HabitsScreen() {
  const habits = useTaskFlowStore((state) => state.habits);
  const logs = useTaskFlowStore((state) => state.habitLogs);
  const toggleHabit = useTaskFlowStore((state) => state.toggleHabit);
  const deleteHabit = useTaskFlowStore((state) => state.deleteHabit);
  const today = dateKey(new Date());
  const thisWeek = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (day.getDay() + 6) % 7 + index);
    return dateKey(day);
  }), []);
  const completedToday = habits.filter((habit) => logs.some((log) => log.habit_id === habit.id && log.completed_on === today)).length;

  function askDelete(id: string, title: string) {
    Alert.alert('Remove this habit?', `“${title}” and its completion history will be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteHabit(id).catch(showError) },
    ]);
  }

  return (
    <Page>
      <PageHeading
        eyebrow={`${completedToday} of ${habits.length} completed today`}
        title="Your habits"
        subtitle="Gentle routines make meaningful change."
        action={<ActionButton compact label="+ Add" onPress={() => router.push('/habit-create')} />}
      />
      <View style={styles.habits}>
        {habits.length ? habits.map((habit) => {
          const habitLogs = logs.filter((log) => log.habit_id === habit.id);
          const doneToday = habitLogs.some((log) => log.completed_on === today);
          const last7Days = thisWeek.filter((day) => habitLogs.some((log) => log.completed_on === day)).length;
          const streak = getStreak(habitLogs.map((log) => log.completed_on));
          return (
            <Card key={habit.id} style={styles.habitCard}>
              <View style={styles.habitHeader}>
                <View style={styles.habitCopy}>
                  <Pressable onPress={() => router.push({ pathname: '/habit-create', params: { id: habit.id } })}>
                    <Text style={styles.habitTitle}>{habit.title}</Text>
                  </Pressable>
                  {habit.description ? <Text style={styles.habitDescription}>{habit.description}</Text> : null}
                  <Text style={styles.habitDescription}>{habit.frequency}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${habit.title}`}
                  onPress={() => askDelete(habit.id, habit.title)}
                  hitSlop={8}>
                  <Text style={styles.delete}>×</Text>
                </Pressable>
              </View>
              <View style={styles.week}>
                {thisWeek.map((day) => {
                  const done = habitLogs.some((log) => log.completed_on === day);
                  return (
                    <View key={day} style={styles.weekDay}>
                      <View style={[styles.weekDot, done && styles.weekDotDone]}>
                        {done ? <Text style={styles.weekCheck}>✓</Text> : null}
                      </View>
                      <Text style={styles.weekLabel}>{new Intl.DateTimeFormat(undefined, { weekday: 'narrow' }).format(new Date(`${day}T12:00:00`))}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.habitFooter}>
                <Text style={styles.habitStats}>{last7Days}/7 this week  ·  {streak} day streak</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ checked: doneToday }}
                  onPress={() => toggleHabit(habit.id, today).catch(showError)}
                  style={[styles.completeButton, doneToday && styles.completeButtonDone]}>
                  <Text style={[styles.completeText, doneToday && styles.completeTextDone]}>{doneToday ? 'Done' : 'Complete'}</Text>
                </Pressable>
              </View>
            </Card>
          );
        }) : (
          <EmptyState title="Start with one small habit" detail="Create a daily practice and check it off as you go." />
        )}
      </View>
    </Page>
  );
}

function getStreak(days: string[]) {
  const sorted = [...new Set(days)].sort().reverse();
  if (!sorted.length) return 0;
  const today = dateKey(new Date());
  const yesterday = dateKey(new Date(Date.now() - 86400000));
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
  let count = 0;
  let current = new Date(`${sorted[0]}T12:00:00`);
  for (const day of sorted) {
    if (dateKey(current) !== day) break;
    count += 1;
    current.setDate(current.getDate() - 1);
  }
  return count;
}

function showError(error: unknown) {
  Alert.alert('Could not update habit', error instanceof Error ? error.message : 'Please try again.');
}

const styles = StyleSheet.create({
  habits: { gap: 12 },
  habitCard: { gap: 18 },
  habitHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  habitCopy: { flex: 1, gap: 5 },
  habitTitle: { color: Palette.text, fontSize: 16, fontWeight: '700' },
  habitDescription: { color: Palette.muted, fontSize: 12, lineHeight: 18 },
  delete: { color: Palette.muted, fontSize: 23, lineHeight: 24 },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDay: { alignItems: 'center', gap: 6 },
  weekDot: { width: 27, height: 27, borderRadius: 10, borderWidth: 1, borderColor: Palette.border, alignItems: 'center', justifyContent: 'center' },
  weekDotDone: { backgroundColor: Palette.lavender, borderColor: '#DED5F7' },
  weekCheck: { color: Palette.primary, fontWeight: '800', fontSize: 13 },
  weekLabel: { color: Palette.muted, fontSize: 10, fontWeight: '600' },
  habitFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingTop: 14, borderTopWidth: 1, borderTopColor: Palette.border },
  habitStats: { color: Palette.muted, fontSize: 11 },
  completeButton: { backgroundColor: Palette.primary, paddingHorizontal: 15, paddingVertical: 9, borderRadius: 12 },
  completeButtonDone: { backgroundColor: Palette.lavender },
  completeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  completeTextDone: { color: Palette.primaryDark },
});

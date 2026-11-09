import { router } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton, Card, Page, PageHeading, SectionTitle, TaskRow, TextButton } from '@/components/taskflow-ui';
import { Palette } from '@/constants/theme';
import { dateKey, useTaskFlowStore } from '@/store/taskflow-store';

const motivations = [
  'Small steps, every day, add up to remarkable things.',
  'Make space for what matters most today.',
  'Progress is built one thoughtful choice at a time.',
  'You do not have to do it all — just the next thing.',
  'A little focus can change the shape of your day.',
  'Celebrate the progress you have already made.',
  'Your best work begins with a clear next step.',
];

export default function HomeScreen() {
  const tasks = useTaskFlowStore((state) => state.tasks);
  const profileName = useTaskFlowStore((state) => state.profileName);
  const toggleTask = useTaskFlowStore((state) => state.toggleTask);
  const today = dateKey(new Date());
  const todayTasks = useMemo(
    () => tasks.filter((task) => task.dueDate === today),
    [tasks, today],
  );
  const completed = todayTasks.filter((task) => task.status === 'Completed').length;
  const pending = todayTasks.length - completed;
  const progress = todayTasks.length ? Math.round((completed / todayTasks.length) * 100) : 0;
  const dayIndex = Number(today.slice(-2)) % motivations.length;
  const dateLabel = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  const recentDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + index);
    return dateKey(date);
  });
  const weeklyCounts = recentDays.map((day) => tasks.filter((task) => task.completedAt && dateKey(new Date(task.completedAt)) === day).length);
  const weeklyMax = Math.max(1, ...weeklyCounts);
  const weekCompleted = weeklyCounts.reduce((total, count) => total + count, 0);

  return (
    <Page>
      <PageHeading
        eyebrow={dateLabel}
        title={`Good ${getGreeting()},${profileName ? ` ${profileName}` : ''}`}
        subtitle="A little progress is still progress."
        action={
          <Pressable onPress={() => router.push('/profile')} style={styles.avatar}>
            <Text style={styles.avatarText}>{profileName ? profileName[0].toUpperCase() : 'T'}</Text>
          </Pressable>
        }
      />

      <Card style={styles.progressCard}>
        <View style={styles.progressTop}>
          <View>
            <Text style={styles.progressLabel}>Today’s progress</Text>
            <Text style={styles.progressCount}>{completed}<Text style={styles.progressOf}> / {todayTasks.length} tasks</Text></Text>
          </View>
          <View style={styles.progressBadge}><Text style={styles.progressPercent}>{progress}%</Text></View>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressHint}>
          {pending ? `${pending} ${pending === 1 ? 'task' : 'tasks'} left to complete` : todayTasks.length ? 'Everything on your list is done.' : 'Add a task to get your day started.'}
        </Text>
      </Card>

      <View>
        <SectionTitle title="Today’s tasks" action={<TextButton label="See all" onPress={() => router.push('/tasks')} />} />
        {todayTasks.length ? (
          <View style={styles.taskList}>
            {todayTasks.slice(0, 4).map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() => toggleTask(task.id).catch(showError)}
                onPress={() => router.push({ pathname: '/task-create', params: { id: task.id } })}
              />
            ))}
          </View>
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>A clear day, a fresh start.</Text>
            <Text style={styles.emptyCopy}>Add a task and make a little room for what matters.</Text>
          </Card>
        )}
      </View>

      <View>
        <SectionTitle title="Make it yours" />
        <View style={styles.quickActions}>
          <ActionButton label="+  Add a task" onPress={() => router.push('/task-create')} />
          <ActionButton label="+  Add a habit" secondary onPress={() => router.push('/habit-create')} />
          <ActionButton label="Open calendar" secondary onPress={() => router.push('/calendar')} />
        </View>
      </View>

      <Card style={styles.weekCard}>
        <View style={styles.weekHeader}>
          <View>
            <Text style={styles.progressLabel}>A look at your week</Text>
            <Text style={styles.weekCount}>{weekCompleted} completed</Text>
          </View>
          <Text style={styles.weekSymbol}>7 days</Text>
        </View>
        <View style={styles.chart}>
          {recentDays.map((day, index) => (
            <View key={day} style={styles.chartColumn}>
              <View style={styles.chartTrack}>
                <View style={[styles.chartBar, { height: `${Math.max(6, (weeklyCounts[index] / weeklyMax) * 100)}%` }]} />
              </View>
              <Text style={styles.chartLabel}>{new Intl.DateTimeFormat(undefined, { weekday: 'narrow' }).format(new Date(`${day}T12:00:00`))}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={styles.quoteCard}>
        <Text style={styles.quoteEyebrow}>A NOTE FOR TODAY</Text>
        <Text style={styles.quoteText}>“{motivations[dayIndex]}”</Text>
      </Card>

      <Card style={styles.focusCard}>
        <View style={styles.focusCopy}>
          <Text style={styles.focusTitle}>Ready for focused time?</Text>
          <Text style={styles.focusDetail}>Set aside a few minutes for one thing.</Text>
        </View>
        <ActionButton label="Start focus" compact onPress={() => router.push('/focus')} />
      </Card>
    </Page>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function showError(error: unknown) {
  Alert.alert('Could not update task', error instanceof Error ? error.message : 'Please try again.');
}

const styles = StyleSheet.create({
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.lavender,
    borderWidth: 1,
    borderColor: '#E8E0FB',
  },
  avatarText: { color: Palette.primaryDark, fontSize: 17, fontWeight: '800' },
  progressCard: { padding: 20, backgroundColor: '#F6F2FF', borderColor: '#ECE5FC' },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  progressLabel: { color: Palette.muted, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  progressCount: { color: Palette.text, fontSize: 28, fontWeight: '800' },
  progressOf: { color: Palette.muted, fontSize: 13, fontWeight: '500' },
  progressBadge: { width: 50, height: 50, borderRadius: 18, backgroundColor: Palette.surface, alignItems: 'center', justifyContent: 'center' },
  progressPercent: { color: Palette.primary, fontSize: 14, fontWeight: '800' },
  track: { height: 8, overflow: 'hidden', borderRadius: 8, backgroundColor: '#E4DCF8' },
  fill: { height: '100%', borderRadius: 8, backgroundColor: Palette.primary },
  progressHint: { color: Palette.muted, fontSize: 12, marginTop: 10 },
  taskList: { gap: 9 },
  emptyCard: { alignItems: 'center', paddingVertical: 26 },
  emptyTitle: { color: Palette.text, fontSize: 16, fontWeight: '700', marginBottom: 5 },
  emptyCopy: { color: Palette.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  quickActions: { gap: 10 },
  quoteCard: { backgroundColor: Palette.surface, paddingVertical: 21 },
  weekCard: { gap: 18 },
  weekHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekCount: { color: Palette.text, fontSize: 20, fontWeight: '800', marginTop: 3 },
  weekSymbol: { color: Palette.primary, fontSize: 11, fontWeight: '700', backgroundColor: Palette.lavender, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 82, gap: 8 },
  chartColumn: { flex: 1, alignItems: 'center', gap: 7 },
  chartTrack: { width: '100%', maxWidth: 24, height: 60, justifyContent: 'flex-end', overflow: 'hidden', borderRadius: 8, backgroundColor: '#F3F0F9' },
  chartBar: { width: '100%', borderRadius: 8, backgroundColor: Palette.primary },
  chartLabel: { color: Palette.muted, fontSize: 10, fontWeight: '600' },
  quoteEyebrow: { color: Palette.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginBottom: 9 },
  quoteText: { color: Palette.text, fontSize: 16, fontWeight: '600', lineHeight: 24 },
  focusCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  focusCopy: { flex: 1, gap: 4 },
  focusTitle: { color: Palette.text, fontWeight: '700', fontSize: 14 },
  focusDetail: { color: Palette.muted, fontSize: 12, lineHeight: 17 },
});

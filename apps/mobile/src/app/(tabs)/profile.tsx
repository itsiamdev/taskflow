import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { ActionButton, Card, Page, PageHeading, SectionTitle } from '@/components/taskflow-ui';
import { Palette } from '@/constants/theme';
import { dateKey, useTaskFlowStore } from '@/store/taskflow-store';

export default function ProfileScreen() {
  const tasks = useTaskFlowStore((state) => state.tasks);
  const habits = useTaskFlowStore((state) => state.habits);
  const logs = useTaskFlowStore((state) => state.habitLogs);
  const sessions = useTaskFlowStore((state) => state.focusSessions);
  const name = useTaskFlowStore((state) => state.profileName);
  const notificationsEnabled = useTaskFlowStore((state) => state.notificationsEnabled);
  const setNotificationsEnabled = useTaskFlowStore((state) => state.setNotificationsEnabled);
  const setProfileName = useTaskFlowStore((state) => state.setProfileName);
  const [draftName, setDraftName] = useState(name);
  const completed = tasks.filter((task) => task.status === 'Completed').length;
  const pending = tasks.filter((task) => task.status !== 'Completed').length;
  const overdue = tasks.filter((task) => task.status !== 'Completed' && task.dueDate && task.dueDate < dateKey(new Date())).length;
  const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const now = new Date();
  const monthlyCompleted = tasks.filter((task) => task.completedAt && new Date(task.completedAt).getMonth() === now.getMonth() && new Date(task.completedAt).getFullYear() === now.getFullYear()).length;
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const completedThisWeek = tasks.filter((task) => task.completedAt && new Date(task.completedAt) >= weekStart).length;
  const lastWeekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + index);
    return dateKey(date);
  });
  const completedByDay = lastWeekDays.map((day) => tasks.filter((task) => task.completedAt && dateKey(new Date(task.completedAt)) === day).length);
  const habitByDay = lastWeekDays.map((day) => logs.filter((log) => log.completed_on === day).length);
  const habitChecks = habits.reduce(
    (total, habit) => total + logs.filter((log) => log.habit_id === habit.id && lastWeekDays.includes(log.completed_on)).length,
    0,
  );
  const habitRate = habits.length ? Math.round((habitChecks / (habits.length * 7)) * 100) : 0;
  const categoryCounts = [...new Set(tasks.map((task) => task.category))].map((category) => ({
    category,
    count: tasks.filter((task) => task.category === category).length,
  })).sort((a, b) => b.count - a.count);

  function saveName() {
    setProfileName(draftName).catch(showError);
  }

  function toggleNotifications(value: boolean) {
    setNotificationsEnabled(value).catch((error: unknown) => {
      Alert.alert('Notifications unavailable', error instanceof Error ? error.message : 'Please try again.');
    });
  }

  return (
    <Page>
      <PageHeading eyebrow="Your space" title="Profile" subtitle="A snapshot of your progress and preferences." />
      <Card style={styles.profileCard}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{name ? name[0].toUpperCase() : 'T'}</Text></View>
        <View style={styles.profileCopy}>
          <Text style={styles.profileLabel}>YOUR NAME</Text>
          <TextInput
            accessibilityLabel="Your name"
            value={draftName}
            onChangeText={setDraftName}
            onSubmitEditing={saveName}
            placeholder="Add your name"
            placeholderTextColor={Palette.muted}
            style={styles.nameInput}
            returnKeyType="done"
          />
        </View>
        <Pressable onPress={saveName} accessibilityRole="button">
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
      </Card>

      <View>
        <SectionTitle title="Your progress" />
        <View style={styles.statGrid}>
          <Stat label="Completed" value={String(completed)} detail={`${completedThisWeek} this week`} />
          <Stat label="Still to do" value={String(pending)} detail={`${overdue} overdue`} />
          <Stat label="Completion" value={`${completionRate}%`} detail={`${monthlyCompleted} this month`} />
          <Stat label="Habit rate" value={`${habitRate}%`} detail="Past 7 days" />
        </View>
      </View>

      <ChartCard title="Tasks completed" days={lastWeekDays} values={completedByDay} />
      <ChartCard title="Habit activity" days={lastWeekDays} values={habitByDay} />

      <Card style={styles.settingsCard}>
        <Text style={styles.settingTitle}>Tasks by category</Text>
        {categoryCounts.length ? categoryCounts.map(({ category, count }) => (
          <View key={category} style={styles.categoryRow}>
            <Text style={styles.categoryName}>{category}</Text>
            <View style={styles.categoryTrack}>
              <View style={[styles.categoryFill, { width: `${(count / Math.max(1, tasks.length)) * 100}%` }]} />
            </View>
            <Text style={styles.categoryCount}>{count}</Text>
          </View>
        )) : <Text style={styles.settingDetail}>Create tasks to see your category breakdown.</Text>}
      </Card>

      <Card style={styles.settingsCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>Task reminders</Text>
            <Text style={styles.settingDetail}>Allow local reminders for tasks.</Text>
          </View>
          <Switch
            accessibilityLabel="Task notifications"
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: '#D9D6E2', true: '#C4B5FD' }}
            thumbColor={notificationsEnabled ? Palette.primary : '#FFFFFF'}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>Focus sessions</Text>
            <Text style={styles.settingDetail}>{sessions.length} completed on this device.</Text>
          </View>
          <ActionButton label="Start" compact secondary onPress={() => router.push('/focus')} />
        </View>
      </Card>

      <Card style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>TaskFlow</Text>
        <Text style={styles.aboutCopy}>A little more focus, a little less rush.</Text>
        <Text style={styles.aboutVersion}>Your tasks, habits, and focus sessions are stored on this device.</Text>
      </Card>
    </Page>
  );
}

function ChartCard({ title, days, values }: { title: string; days: string[]; values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <Card style={styles.chartCard}>
      <Text style={styles.settingTitle}>{title}</Text>
      <View style={styles.chart}>
        {days.map((day, index) => (
          <View key={day} style={styles.chartColumn}>
            <Text style={styles.chartValue}>{values[index] || ''}</Text>
            <View style={styles.chartTrack}>
              <View style={[styles.chartFill, { height: `${Math.max(values[index] ? 8 : 3, (values[index] / max) * 100)}%` }]} />
            </View>
            <Text style={styles.chartDay}>{new Intl.DateTimeFormat(undefined, { weekday: 'narrow' }).format(new Date(`${day}T12:00:00`))}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statDetail}>{detail}</Text>
    </Card>
  );
}

function showError(error: unknown) {
  Alert.alert('Could not save your profile', error instanceof Error ? error.message : 'Please try again.');
}

const styles = StyleSheet.create({
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  avatar: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: Palette.lavender },
  avatarText: { color: Palette.primaryDark, fontSize: 20, fontWeight: '800' },
  profileCopy: { flex: 1, gap: 4 },
  profileLabel: { color: Palette.muted, fontSize: 9, letterSpacing: 1, fontWeight: '800' },
  nameInput: { padding: 0, color: Palette.text, fontSize: 16, fontWeight: '700' },
  saveText: { color: Palette.primary, fontSize: 13, fontWeight: '700' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48%', flexGrow: 1, padding: 15, gap: 4 },
  statLabel: { color: Palette.muted, fontSize: 11, fontWeight: '600' },
  statValue: { color: Palette.text, fontSize: 23, fontWeight: '800' },
  statDetail: { color: Palette.muted, fontSize: 10 },
  settingsCard: { gap: 16 },
  chartCard: { gap: 14 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 94, gap: 8 },
  chartColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 5, height: '100%' },
  chartValue: { color: Palette.primary, fontSize: 10, fontWeight: '700', height: 13 },
  chartTrack: { width: '100%', maxWidth: 25, height: 56, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden', borderRadius: 8, backgroundColor: '#F3F0F9' },
  chartFill: { width: '100%', borderRadius: 8, backgroundColor: Palette.primary },
  chartDay: { color: Palette.muted, fontSize: 9, fontWeight: '600', height: 12 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  categoryName: { width: 76, color: Palette.muted, fontSize: 11 },
  categoryTrack: { flex: 1, height: 7, borderRadius: 7, backgroundColor: '#F3F0F9', overflow: 'hidden' },
  categoryFill: { height: '100%', borderRadius: 7, backgroundColor: Palette.primary },
  categoryCount: { width: 20, textAlign: 'right', color: Palette.text, fontSize: 11, fontWeight: '700' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  settingCopy: { flex: 1, gap: 4 },
  settingTitle: { color: Palette.text, fontSize: 14, fontWeight: '700' },
  settingDetail: { color: Palette.muted, fontSize: 11, lineHeight: 16 },
  divider: { height: 1, backgroundColor: Palette.border },
  aboutCard: { backgroundColor: '#F6F2FF', borderColor: '#ECE5FC', gap: 6 },
  aboutTitle: { color: Palette.primaryDark, fontSize: 16, fontWeight: '800' },
  aboutCopy: { color: Palette.text, fontSize: 13, fontWeight: '600' },
  aboutVersion: { color: Palette.muted, fontSize: 11, lineHeight: 17, marginTop: 3 },
});

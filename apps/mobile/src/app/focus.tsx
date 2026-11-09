import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/taskflow-ui';
import { Palette } from '@/constants/theme';
import { useTaskFlowStore } from '@/store/taskflow-store';

const modes = [
  { id: 'focus', label: 'Focus', minutes: 25 },
  { id: 'short', label: 'Short break', minutes: 5 },
  { id: 'long', label: 'Long break', minutes: 15 },
] as const;
type FocusMode = (typeof modes)[number]['id'];
const focusDurationPresets = [15, 25, 45, 60];
const minFocusDurationMinutes = 1;
const maxFocusDurationMinutes = 180;

export default function FocusScreen() {
  const allTasks = useTaskFlowStore((state) => state.tasks);
  const tasks = allTasks.filter((task) => task.status !== 'Completed');
  const sessions = useTaskFlowStore((state) => state.focusSessions);
  const saveFocusSession = useTaskFlowStore((state) => state.saveFocusSession);
  const focusDurationMinutes = useTaskFlowStore((state) => state.focusDurationMinutes);
  const setFocusDurationMinutes = useTaskFlowStore((state) => state.setFocusDurationMinutes);
  const [mode, setMode] = useState<FocusMode>('focus');
  const [secondsLeft, setSecondsLeft] = useState(focusDurationMinutes * 60);
  const [durationInput, setDurationInput] = useState(String(focusDurationMinutes));
  const [running, setRunning] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const currentMode = modes.find((item) => item.id === mode) ?? modes[0];
  const currentDurationMinutes = mode === 'focus' ? focusDurationMinutes : currentMode.minutes;
  const progress = (currentDurationMinutes * 60 - secondsLeft) / (currentDurationMinutes * 60);

  useEffect(() => {
    if (!running) return undefined;
    const timer = setTimeout(() => {
      if (secondsLeft <= 1) {
        setSecondsLeft(0);
        setRunning(false);
        if (mode === 'focus') {
          saveFocusSession(currentDurationMinutes, selectedTask).catch((error: unknown) => {
            Alert.alert('Could not save focus session', error instanceof Error ? error.message : 'Please try again.');
          });
        }
      } else {
        setSecondsLeft(secondsLeft - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [currentDurationMinutes, mode, running, saveFocusSession, secondsLeft, selectedTask]);

  function chooseMode(next: FocusMode) {
    setRunning(false);
    setMode(next);
    const selected = modes.find((item) => item.id === next);
    if (selected) setSecondsLeft((next === 'focus' ? focusDurationMinutes : selected.minutes) * 60);
  }

  function reset() {
    setRunning(false);
    setSecondsLeft(currentDurationMinutes * 60);
  }

  function updateFocusDuration(minutes: number) {
    setDurationInput(String(minutes));
    if (mode === 'focus') setSecondsLeft(minutes * 60);
    setFocusDurationMinutes(minutes).catch((error: unknown) => {
      setDurationInput(String(focusDurationMinutes));
      if (mode === 'focus') setSecondsLeft(focusDurationMinutes * 60);
      Alert.alert('Could not update focus duration', error instanceof Error ? error.message : 'Please try again.');
    });
  }

  function commitDurationInput(value: string) {
    const minutes = Number(value);
    if (!Number.isInteger(minutes) || minutes < minFocusDurationMinutes || minutes > maxFocusDurationMinutes) {
      setDurationInput(String(focusDurationMinutes));
      Alert.alert('Invalid focus duration', `Choose between ${minFocusDurationMinutes} and ${maxFocusDurationMinutes} minutes.`);
      return;
    }
    updateFocusDuration(minutes);
  }

  const displayTime = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Stack.Screen options={{ presentation: 'modal' }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}><Text style={styles.close}>×</Text></Pressable>
          <Text style={styles.headerTitle}>Focus mode</Text>
          <View style={styles.spacer} />
        </View>
        <Text style={styles.subtitle}>One thing at a time. You’ve got this.</Text>
        <View style={styles.modeButtons}>
          {modes.map((item) => (
            <Pressable key={item.id} onPress={() => chooseMode(item.id)} style={[styles.modeButton, mode === item.id && styles.modeSelected]}>
              <Text style={[styles.modeText, mode === item.id && styles.modeTextSelected]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
        {mode === 'focus' && !running ? (
          <View style={styles.durationSection}>
            <Text style={styles.sectionTitle}>Custom session length</Text>
            <View style={styles.durationPicker}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Decrease focus duration by one minute"
                onPress={() => updateFocusDuration(Math.max(minFocusDurationMinutes, focusDurationMinutes - 1))}
                style={styles.durationStep}>
                <Text style={styles.durationStepText}>−</Text>
              </Pressable>
              <TextInput
                accessibilityLabel="Focus duration in minutes"
                keyboardType="number-pad"
                maxLength={3}
                onChangeText={(value) => setDurationInput(value.replace(/[^0-9]/g, ''))}
                onEndEditing={(event) => commitDurationInput(event.nativeEvent.text)}
                returnKeyType="done"
                selectTextOnFocus
                style={styles.durationInput}
                value={durationInput}
              />
              <Text style={styles.durationUnit}>min</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Increase focus duration by one minute"
                onPress={() => updateFocusDuration(Math.min(maxFocusDurationMinutes, focusDurationMinutes + 1))}
                style={styles.durationStep}>
                <Text style={styles.durationStepText}>+</Text>
              </Pressable>
            </View>
            <View style={styles.presetButtons}>
              {focusDurationPresets.map((minutes) => (
                <Choice
                  key={minutes}
                  label={`${minutes} min`}
                  selected={focusDurationMinutes === minutes}
                  onPress={() => updateFocusDuration(minutes)}
                />
              ))}
            </View>
          </View>
        ) : null}
        <Card style={styles.timerCard}>
          <View style={styles.ring}>
            <View style={styles.ringInner}>
              <Text style={styles.modeCaption}>{currentMode.label.toUpperCase()}</Text>
              <Text style={styles.time}>{displayTime}</Text>
              <Text style={styles.timerHint}>{running ? 'Stay with this moment' : secondsLeft === 0 ? 'Session complete' : 'Ready when you are'}</Text>
            </View>
          </View>
          <View style={styles.timerTrack}>
            <View style={[styles.timerProgress, { width: `${Math.max(0, Math.min(1, progress)) * 100}%` }]} />
          </View>
          <View style={styles.timerActions}>
            <Pressable onPress={reset} style={styles.resetButton}><Text style={styles.resetText}>Reset</Text></Pressable>
            <Pressable
              onPress={() => {
                if (running) {
                  setRunning(false);
                } else {
                  if (secondsLeft === 0) setSecondsLeft(currentDurationMinutes * 60);
                  setRunning(true);
                }
              }}
              style={styles.playButton}>
              <Text style={styles.playText}>{running ? 'Pause' : secondsLeft === 0 ? 'Start again' : 'Start focus'}</Text>
            </Pressable>
          </View>
        </Card>
        {mode === 'focus' ? (
          <View style={styles.association}>
            <Text style={styles.sectionTitle}>Focus on a task</Text>
            <Text style={styles.sectionDetail}>Optional — choose one thing to work on.</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.taskChoices}>
              <Choice label="No task" selected={!selectedTask} onPress={() => setSelectedTask(null)} />
              {tasks.map((task) => (
                <Choice key={task.id} label={task.title} selected={selectedTask === task.id} onPress={() => setSelectedTask(task.id)} />
              ))}
            </ScrollView>
          </View>
        ) : null}
        <Card style={styles.historyCard}>
          <Text style={styles.historyTitle}>Focus history</Text>
          <Text style={styles.historyCount}>{sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} completed</Text>
          {sessions.slice(0, 3).map((session) => {
            const task = allTasks.find((item) => item.id === session.task_id);
            return (
              <View key={session.id} style={styles.historyRow}>
                <View style={styles.historyDot} />
                <Text numberOfLines={1} style={styles.historyTask}>{task?.title ?? 'Focus session'}</Text>
                <Text style={styles.historyMinutes}>{session.duration_minutes} min</Text>
              </View>
            );
          })}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.taskChoice, selected && styles.taskChoiceSelected]}>
      <Text numberOfLines={1} style={[styles.taskChoiceText, selected && styles.taskChoiceTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Palette.background },
  content: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 22, paddingBottom: 30, gap: 17 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5 },
  close: { color: Palette.muted, fontSize: 30, lineHeight: 34, width: 36 },
  headerTitle: { color: Palette.text, fontSize: 18, fontWeight: '800' },
  spacer: { width: 36 },
  subtitle: { color: Palette.muted, fontSize: 13, textAlign: 'center', marginTop: -7 },
  modeButtons: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  modeButton: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 16, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border },
  modeSelected: { backgroundColor: Palette.lavender, borderColor: '#DED5F7' },
  modeText: { color: Palette.muted, fontSize: 12, fontWeight: '600' },
  modeTextSelected: { color: Palette.primaryDark },
  durationSection: { alignItems: 'center', gap: 12 },
  durationPicker: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  durationStep: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  durationStepText: { color: Palette.primary, fontSize: 24, lineHeight: 28, fontWeight: '600' },
  durationInput: { minWidth: 52, paddingVertical: 6, color: Palette.text, fontSize: 23, fontWeight: '800', textAlign: 'center' },
  durationUnit: { marginLeft: -5, color: Palette.muted, fontSize: 13 },
  presetButtons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 7 },
  timerCard: { alignItems: 'center', paddingVertical: 28, gap: 24 },
  ring: {
    width: 248,
    height: 248,
    borderRadius: 124,
    borderWidth: 9,
    borderColor: '#E8E1F7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9F6FF',
  },
  ringInner: { alignItems: 'center', gap: 6 },
  modeCaption: { color: Palette.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  time: { color: Palette.text, fontSize: 51, fontWeight: '700', letterSpacing: -2 },
  timerHint: { color: Palette.muted, fontSize: 12 },
  timerTrack: { width: '82%', height: 6, overflow: 'hidden', borderRadius: 6, backgroundColor: '#E8E1F7' },
  timerProgress: { height: '100%', borderRadius: 6, backgroundColor: Palette.primary },
  timerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resetButton: { paddingHorizontal: 19, paddingVertical: 13, borderRadius: 14, borderWidth: 1, borderColor: Palette.border },
  resetText: { color: Palette.muted, fontWeight: '700', fontSize: 13 },
  playButton: { minWidth: 142, alignItems: 'center', paddingHorizontal: 20, paddingVertical: 13, borderRadius: 14, backgroundColor: Palette.primary },
  playText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  association: { gap: 6 },
  sectionTitle: { color: Palette.text, fontSize: 15, fontWeight: '700' },
  sectionDetail: { color: Palette.muted, fontSize: 11 },
  taskChoices: { gap: 8, paddingVertical: 7 },
  taskChoice: { maxWidth: 190, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border },
  taskChoiceSelected: { backgroundColor: Palette.lavender, borderColor: '#DED5F7' },
  taskChoiceText: { color: Palette.muted, fontSize: 11, fontWeight: '600' },
  taskChoiceTextSelected: { color: Palette.primaryDark },
  historyCard: { gap: 12 },
  historyTitle: { color: Palette.text, fontSize: 15, fontWeight: '700' },
  historyCount: { color: Palette.muted, fontSize: 11, marginTop: -7 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingTop: 10, borderTopWidth: 1, borderTopColor: Palette.border },
  historyDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Palette.primary },
  historyTask: { flex: 1, color: Palette.text, fontSize: 12, fontWeight: '600' },
  historyMinutes: { color: Palette.muted, fontSize: 11 },
});

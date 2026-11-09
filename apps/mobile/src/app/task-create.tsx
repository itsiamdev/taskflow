import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/taskflow-ui';
import { Palette } from '@/constants/theme';
import { dateKey, useTaskFlowStore, type TaskPriority, type TaskStatus } from '@/store/taskflow-store';

const categories = ['Personal', 'Work', 'Education', 'Health', 'Other'];
const priorities: TaskPriority[] = ['Low', 'Medium', 'High'];
const statuses: TaskStatus[] = ['To Do', 'In Progress', 'Completed'];

export default function TaskCreateScreen() {
  const { id, due } = useLocalSearchParams<{ id?: string; due?: string }>();
  const taskId = typeof id === 'string' ? id : undefined;
  const initialDue = typeof due === 'string' ? due : '';
  const tasks = useTaskFlowStore((state) => state.tasks);
  const addTask = useTaskFlowStore((state) => state.addTask);
  const updateTask = useTaskFlowStore((state) => state.updateTask);
  const existing = taskId ? tasks.find((task) => task.id === taskId) : undefined;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? initialDue);
  const [category, setCategory] = useState(existing?.category ?? 'Personal');
  const [priority, setPriority] = useState<TaskPriority>(existing?.priority ?? 'Medium');
  const [status, setStatus] = useState<TaskStatus>(existing?.status ?? 'To Do');
  const [tag, setTag] = useState(existing?.tag ?? '');
  const [reminder, setReminder] = useState(existing?.reminderAt ? formatReminder(existing.reminderAt) : '');
  const [saving, setSaving] = useState(false);

  async function save() {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      Alert.alert('Add a title', 'Give this task a short, clear name.');
      return;
    }
    if (dueDate && !isValidDay(dueDate)) {
      Alert.alert('Check the date', 'Use the YYYY-MM-DD format for the due date.');
      return;
    }
    const reminderAt = parseReminder(reminder);
    if (reminder.trim() && !reminderAt) {
      Alert.alert('Check the reminder', 'Use the YYYY-MM-DD HH:mm format for the reminder time.');
      return;
    }
    setSaving(true);
    try {
      const input = {
        title: cleanTitle,
        description,
        dueDate: dueDate || null,
        category,
        priority,
        status,
        tag,
        reminderAt,
      };
      if (taskId) await updateTask(taskId, input);
      else await addTask(input);
      router.back();
    } catch (error) {
      Alert.alert('Could not save task', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Stack.Screen options={{ presentation: 'modal' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}><Text style={styles.close}>×</Text></Pressable>
          <Text style={styles.headerTitle}>{taskId ? 'Edit task' : 'New task'}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <Text style={styles.label}>TASK TITLE</Text>
        <TextInput
          accessibilityLabel="Task title"
          value={title}
          onChangeText={setTitle}
          placeholder="What needs to get done?"
          placeholderTextColor="#A6A3AF"
          style={styles.titleInput}
          maxLength={120}
        />
        <Text style={styles.label}>DESCRIPTION</Text>
        <TextInput
          accessibilityLabel="Task description"
          value={description}
          onChangeText={setDescription}
          placeholder="Add a few helpful details"
          placeholderTextColor="#A6A3AF"
          style={[styles.input, styles.multiline]}
          multiline
          textAlignVertical="top"
          maxLength={600}
        />
        <Text style={styles.label}>DUE DATE</Text>
        <TextInput
          accessibilityLabel="Due date"
          value={dueDate}
          onChangeText={setDueDate}
          placeholder={`YYYY-MM-DD  (today: ${dateKey(new Date())})`}
          placeholderTextColor="#A6A3AF"
          style={styles.input}
          autoCapitalize="none"
        />
        <Text style={styles.label}>REMINDER TIME (OPTIONAL)</Text>
        <TextInput
          accessibilityLabel="Reminder time"
          value={reminder}
          onChangeText={setReminder}
          placeholder="YYYY-MM-DD HH:mm"
          placeholderTextColor="#A6A3AF"
          style={styles.input}
          autoCapitalize="none"
        />
        <Text style={styles.label}>CATEGORY</Text>
        <ChoiceRow values={categories} selected={category} onSelect={setCategory} />
        <Text style={styles.label}>PRIORITY</Text>
        <ChoiceRow values={priorities} selected={priority} onSelect={(value) => setPriority(value as TaskPriority)} />
        <Text style={styles.label}>STATUS</Text>
        <ChoiceRow values={statuses} selected={status} onSelect={(value) => setStatus(value as TaskStatus)} />
        <Text style={styles.label}>TAG (OPTIONAL)</Text>
        <TextInput
          accessibilityLabel="Task tag"
          value={tag}
          onChangeText={setTag}
          placeholder="e.g. project, errands"
          placeholderTextColor="#A6A3AF"
          style={styles.input}
        />
        <ActionButton label={saving ? 'Saving…' : taskId ? 'Save changes' : 'Create task'} onPress={() => { void save(); }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ChoiceRow({ values, selected, onSelect }: { values: string[]; selected: string; onSelect: (value: string) => void }) {
  return (
    <View style={styles.choices}>
      {values.map((value) => (
        <Pressable
          key={value}
          accessibilityRole="button"
          onPress={() => onSelect(value)}
          style={[styles.choice, selected === value && styles.choiceSelected]}>
          <Text style={[styles.choiceText, selected === value && styles.choiceTextSelected]}>{value}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function isValidDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && dateKey(date) === value;
}

function parseReminder(value: string) {
  if (!value.trim()) return null;
  const date = new Date(value.trim().replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function formatReminder(value: string) {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Palette.background },
  content: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 22, paddingBottom: 28, gap: 11 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, marginBottom: 5 },
  close: { color: Palette.muted, fontSize: 30, lineHeight: 34, width: 36 },
  headerTitle: { color: Palette.text, fontSize: 18, fontWeight: '800' },
  headerSpacer: { width: 36 },
  label: { color: Palette.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 8 },
  titleInput: { minHeight: 48, color: Palette.text, fontSize: 20, fontWeight: '700', paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: Palette.border, backgroundColor: Palette.surface },
  input: { minHeight: 46, color: Palette.text, fontSize: 14, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: Palette.border, backgroundColor: Palette.surface },
  multiline: { minHeight: 76, paddingTop: 12 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  choice: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 13, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border },
  choiceSelected: { backgroundColor: Palette.lavender, borderColor: '#DCD3F5' },
  choiceText: { color: Palette.muted, fontSize: 12, fontWeight: '600' },
  choiceTextSelected: { color: Palette.primaryDark },
});

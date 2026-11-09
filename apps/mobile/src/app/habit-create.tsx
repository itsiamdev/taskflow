import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/taskflow-ui';
import { Palette } from '@/constants/theme';
import { useTaskFlowStore } from '@/store/taskflow-store';

const frequencies = ['Daily', 'Weekdays', 'Weekly'];

export default function HabitCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const habitId = typeof id === 'string' ? id : undefined;
  const existing = useTaskFlowStore((state) => state.habits.find((habit) => habit.id === habitId));
  const addHabit = useTaskFlowStore((state) => state.addHabit);
  const updateHabit = useTaskFlowStore((state) => state.updateHabit);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [frequency, setFrequency] = useState(existing?.frequency ?? 'Daily');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim()) {
      Alert.alert('Add a name', 'Give your habit a short, clear name.');
      return;
    }
    setSaving(true);
    try {
      if (habitId) await updateHabit(habitId, { title, description, frequency });
      else await addHabit({ title, description, frequency });
      router.back();
    } catch (error) {
      Alert.alert('Could not save habit', error instanceof Error ? error.message : 'Please try again.');
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
          <Text style={styles.headerTitle}>{habitId ? 'Edit habit' : 'A new habit'}</Text>
          <View style={styles.spacer} />
        </View>
        <Text style={styles.label}>HABIT NAME</Text>
        <TextInput
          accessibilityLabel="Habit name"
          value={title}
          onChangeText={setTitle}
          placeholder="What would you like to practice?"
          placeholderTextColor="#A6A3AF"
          style={styles.input}
          maxLength={80}
        />
        <Text style={styles.label}>A LITTLE CONTEXT</Text>
        <TextInput
          accessibilityLabel="Habit description"
          value={description}
          onChangeText={setDescription}
          placeholder="Why does this matter to you?"
          placeholderTextColor="#A6A3AF"
          style={[styles.input, styles.multiline]}
          multiline
          textAlignVertical="top"
          maxLength={400}
        />
        <Text style={styles.label}>HOW OFTEN?</Text>
        <View style={styles.choices}>
          {frequencies.map((item) => (
            <Pressable key={item} onPress={() => setFrequency(item)} style={[styles.choice, frequency === item && styles.selected]}>
              <Text style={[styles.choiceText, frequency === item && styles.selectedText]}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <ActionButton label={saving ? 'Saving…' : habitId ? 'Save changes' : 'Create habit'} onPress={() => { void save(); }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Palette.background },
  content: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 22, paddingBottom: 28, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, marginBottom: 5 },
  close: { color: Palette.muted, fontSize: 30, lineHeight: 34, width: 36 },
  headerTitle: { color: Palette.text, fontSize: 18, fontWeight: '800' },
  spacer: { width: 36 },
  label: { color: Palette.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 8 },
  input: { minHeight: 48, color: Palette.text, fontSize: 15, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: Palette.border, backgroundColor: Palette.surface },
  multiline: { minHeight: 88, paddingTop: 12 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border },
  selected: { backgroundColor: Palette.lavender, borderColor: '#DCD3F5' },
  choiceText: { color: Palette.muted, fontSize: 12, fontWeight: '600' },
  selectedText: { color: Palette.primaryDark },
});

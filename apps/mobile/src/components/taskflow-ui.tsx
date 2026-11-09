import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Palette } from '@/constants/theme';
import type { Task } from '@/store/taskflow-store';

export function Page({ children, contentStyle }: { children: ReactNode; contentStyle?: StyleProp<ViewStyle> }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.pageContent, contentStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function PageHeading({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.heading}>
      <View style={styles.headingCopy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.headingTitle}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionTitleText}>{title}</Text>
      {action}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ActionButton({
  label,
  onPress,
  secondary = false,
  compact = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  compact?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        secondary && styles.secondaryButton,
        compact && styles.compactButton,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.actionText, secondary && styles.secondaryText]}>{label}</Text>
    </Pressable>
  );
}

export function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8}>
      <Text style={styles.textButton}>{label}</Text>
    </Pressable>
  );
}

export function TaskRow({
  task,
  onToggle,
  onPress,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onPress?: () => void;
  onDelete?: () => void;
}) {
  const completed = task.status === 'Completed';
  return (
    <View style={styles.taskCard}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed }}
        accessibilityLabel={`Mark ${task.title} ${completed ? 'incomplete' : 'complete'}`}
        onPress={onToggle}
        style={[styles.check, completed && styles.checked]}>
        {completed ? <Text style={styles.checkmark}>✓</Text> : null}
      </Pressable>
      <Pressable onPress={onPress} style={styles.taskCopy}>
        <Text numberOfLines={1} style={[styles.taskTitle, completed && styles.completedTitle]}>
          {task.title}
        </Text>
        <Text numberOfLines={1} style={styles.taskMeta}>
          {task.category}  ·  {task.dueDate ? task.dueDate : task.priority}
        </Text>
      </Pressable>
      <View style={[styles.priorityDot, { backgroundColor: priorityColor(task.priority) }]} />
      {onDelete ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${task.title}`} onPress={onDelete} hitSlop={8}>
          <Text style={styles.deleteButton}>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyMark}><Text style={styles.emptyMarkText}>+</Text></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDetail}>{detail}</Text>
    </View>
  );
}

export function priorityColor(priority: Task['priority']) {
  if (priority === 'High') return Palette.error;
  if (priority === 'Low') return Palette.success;
  return Palette.warning;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  pageContent: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 36,
    gap: 24,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  headingCopy: { flex: 1, gap: 4 },
  eyebrow: {
    color: Palette.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headingTitle: {
    color: Palette.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -1,
  },
  subtitle: {
    color: Palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleText: {
    color: Palette.text,
    fontSize: 17,
    fontWeight: '700',
  },
  card: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    shadowColor: '#27204E',
    shadowOpacity: 0.045,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  actionButton: {
    minHeight: 48,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: Palette.primary,
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: Palette.lavender,
    borderWidth: 1,
    borderColor: '#E8E0FB',
  },
  secondaryText: { color: Palette.primaryDark },
  compactButton: { minHeight: 40, paddingHorizontal: 14 },
  textButton: { color: Palette.primary, fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  taskCard: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  check: {
    width: 23,
    height: 23,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D6D0E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: { backgroundColor: Palette.primary, borderColor: Palette.primary },
  checkmark: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', lineHeight: 18 },
  taskCopy: { flex: 1, gap: 4 },
  taskTitle: { color: Palette.text, fontSize: 14, fontWeight: '700' },
  completedTitle: { color: Palette.muted, textDecorationLine: 'line-through' },
  taskMeta: { color: Palette.muted, fontSize: 11 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  deleteButton: { color: Palette.muted, fontSize: 22, lineHeight: 24 },
  emptyState: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20, gap: 8 },
  emptyMark: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: Palette.lavender,
  },
  emptyMarkText: { color: Palette.primary, fontSize: 24, fontWeight: '500' },
  emptyTitle: { color: Palette.text, fontWeight: '700', fontSize: 15 },
  emptyDetail: { color: Palette.muted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
});

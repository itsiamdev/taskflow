import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionButton, EmptyState, Page, PageHeading, TaskRow } from '@/components/taskflow-ui';
import { Palette } from '@/constants/theme';
import { dateKey, useTaskFlowStore, type Task } from '@/store/taskflow-store';

const filters = ['All', 'Today', 'Upcoming', 'Overdue', 'Completed'] as const;
type Filter = (typeof filters)[number];
const sortModes = ['Due date', 'Priority', 'Newest'] as const;
type SortMode = (typeof sortModes)[number];

export default function TasksScreen() {
  const tasks = useTaskFlowStore((state) => state.tasks);
  const toggleTask = useTaskFlowStore((state) => state.toggleTask);
  const deleteTask = useTaskFlowStore((state) => state.deleteTask);
  const [filter, setFilter] = useState<Filter>('All');
  const [sortMode, setSortMode] = useState<SortMode>('Due date');
  const [search, setSearch] = useState('');
  const today = dateKey(new Date());
  const visibleTasks = useMemo(
    () => tasks.filter((task) => matchesFilter(task, filter, today))
      .filter((task) => `${task.title} ${task.category} ${task.tag ?? ''}`.toLowerCase().includes(search.toLowerCase()))
      .sort((left, right) => {
        if (sortMode === 'Newest') return right.createdAt.localeCompare(left.createdAt);
        if (sortMode === 'Priority') {
          const rank = { Low: 0, Medium: 1, High: 2 };
          return rank[right.priority] - rank[left.priority];
        }
        return (left.dueDate ?? '9999-12-31').localeCompare(right.dueDate ?? '9999-12-31');
      }),
    [filter, search, sortMode, tasks, today],
  );

  function confirmDelete(task: Task) {
    Alert.alert('Delete this task?', `“${task.title}” will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTask(task.id).catch(showError) },
    ]);
  }

  return (
    <Page>
      <PageHeading
        eyebrow={`${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'} in your space`}
        title="Your tasks"
        subtitle="Keep your next steps in one calm place."
        action={<ActionButton compact label="+ Add" onPress={() => router.push('/task-create')} />}
      />
      <TextInput
        accessibilityLabel="Search tasks"
        value={search}
        onChangeText={setSearch}
        placeholder="Search tasks or categories"
        placeholderTextColor={Palette.muted}
        style={styles.search}
        returnKeyType="search"
      />
      <View style={styles.filters}>
        {filters.map((item) => (
          <Pressable
            accessibilityRole="button"
            key={item}
            onPress={() => setFilter(item)}
            style={[styles.filterButton, filter === item && styles.selectedFilter]}>
            <Text style={[styles.filterText, filter === item && styles.selectedFilterText]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort</Text>
        {sortModes.map((item) => (
          <Pressable key={item} onPress={() => setSortMode(item)} hitSlop={6}>
            <Text style={[styles.sortMode, sortMode === item && styles.sortModeActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.taskList}>
        {visibleTasks.length ? visibleTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onToggle={() => toggleTask(task.id).catch(showError)}
            onPress={() => router.push({ pathname: '/task-create', params: { id: task.id } })}
            onDelete={() => confirmDelete(task)}
          />
        )) : (
          <EmptyState
            title={search ? 'No matching tasks' : `No ${filter.toLowerCase()} tasks`}
            detail={search ? 'Try another search term.' : 'Add a task whenever you are ready.'}
          />
        )}
      </View>
    </Page>
  );
}

function matchesFilter(task: Task, filter: Filter, today: string) {
  if (filter === 'Today') return task.dueDate === today && task.status !== 'Completed';
  if (filter === 'Upcoming') return Boolean(task.dueDate && task.dueDate > today && task.status !== 'Completed');
  if (filter === 'Overdue') return Boolean(task.dueDate && task.dueDate < today && task.status !== 'Completed');
  if (filter === 'Completed') return task.status === 'Completed';
  return true;
}

function showError(error: unknown) {
  Alert.alert('Could not update task', error instanceof Error ? error.message : 'Please try again.');
}

const styles = StyleSheet.create({
  search: {
    minHeight: 48,
    paddingHorizontal: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    color: Palette.text,
    fontSize: 14,
  },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterButton: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border },
  selectedFilter: { backgroundColor: Palette.lavender, borderColor: '#DDD4F7' },
  filterText: { color: Palette.muted, fontSize: 12, fontWeight: '600' },
  selectedFilterText: { color: Palette.primaryDark },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: -7 },
  sortLabel: { color: Palette.muted, fontSize: 11 },
  sortMode: { color: Palette.muted, fontSize: 11, fontWeight: '600' },
  sortModeActive: { color: Palette.primaryDark, fontWeight: '800' },
  taskList: { gap: 9 },
});

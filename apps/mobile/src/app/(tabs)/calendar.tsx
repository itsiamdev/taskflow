import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton, EmptyState, Page, PageHeading, SectionTitle, TaskRow } from '@/components/taskflow-ui';
import { Palette } from '@/constants/theme';
import { dateKey, useTaskFlowStore } from '@/store/taskflow-store';

const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CalendarScreen() {
  const tasks = useTaskFlowStore((state) => state.tasks);
  const toggleTask = useTaskFlowStore((state) => state.toggleTask);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(() => dateKey(new Date()));
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(month);
  const monthDays = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      return { date: day, key: dateKey(day), inMonth: day.getMonth() === month.getMonth() };
    });
  }, [month]);
  const taskDates = useMemo(() => new Set(tasks.map((task) => task.dueDate).filter(Boolean)), [tasks]);
  const selectedTasks = tasks.filter((task) => task.dueDate === selectedDay);

  function moveMonth(offset: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  return (
    <Page>
      <PageHeading eyebrow="Plan with intention" title="Calendar" subtitle="See what’s coming, one day at a time." />
      <View style={styles.calendarCard}>
        <View style={styles.monthHeader}>
          <Pressable onPress={() => moveMonth(-1)} hitSlop={10} accessibilityLabel="Previous month">
            <Text style={styles.arrow}>‹</Text>
          </Pressable>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <Pressable onPress={() => moveMonth(1)} hitSlop={10} accessibilityLabel="Next month">
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        </View>
        <View style={styles.grid}>
          {weekDays.map((day, index) => (
            <Text key={`${day}-${index}`} style={styles.weekDay}>{day}</Text>
          ))}
          {monthDays.map(({ date, key, inMonth }) => {
            const selected = key === selectedDay;
            const today = key === dateKey(new Date());
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={date.toDateString()}
                onPress={() => setSelectedDay(key)}
                style={[styles.dayCell, selected && styles.selectedDay]}>
                <Text style={[styles.dayText, !inMonth && styles.outsideMonth, selected && styles.selectedDayText, today && !selected && styles.todayText]}>
                  {date.getDate()}
                </Text>
                {taskDates.has(key) ? <View style={[styles.dayDot, selected && styles.selectedDot]} /> : <View style={styles.dotSpace} />}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View>
        <SectionTitle
          title={new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(`${selectedDay}T12:00:00`))}
          action={<ActionButton compact label="+ Add" onPress={() => router.push({ pathname: '/task-create', params: { due: selectedDay } })} />}
        />
        <View style={styles.agenda}>
          {selectedTasks.length ? selectedTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={() => toggleTask(task.id).catch(showError)}
              onPress={() => router.push({ pathname: '/task-create', params: { id: task.id } })}
            />
          )) : (
            <EmptyState title="Nothing scheduled" detail="A little breathing room can be a good thing." />
          )}
        </View>
      </View>
    </Page>
  );
}

function showError(error: unknown) {
  Alert.alert('Could not update task', error instanceof Error ? error.message : 'Please try again.');
}

const styles = StyleSheet.create({
  calendarCard: { padding: 18, borderRadius: 22, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  monthLabel: { color: Palette.text, fontSize: 16, fontWeight: '700', textTransform: 'capitalize' },
  arrow: { color: Palette.primary, fontSize: 28, lineHeight: 32, paddingHorizontal: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekDay: { width: '14.285%', textAlign: 'center', color: Palette.muted, fontSize: 11, fontWeight: '700', paddingBottom: 7 },
  dayCell: { width: '14.285%', height: 45, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  selectedDay: { backgroundColor: Palette.primary },
  dayText: { color: Palette.text, fontSize: 13, fontWeight: '600' },
  outsideMonth: { color: '#C4C1CD' },
  selectedDayText: { color: '#FFFFFF' },
  todayText: { color: Palette.primary, fontWeight: '800' },
  dayDot: { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: Palette.primary },
  selectedDot: { backgroundColor: '#FFFFFF' },
  dotSpace: { position: 'absolute', bottom: 4, width: 4, height: 4 },
  agenda: { gap: 9 },
});

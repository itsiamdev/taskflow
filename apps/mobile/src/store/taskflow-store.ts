import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { create } from 'zustand';
import type { SQLiteDatabase } from 'expo-sqlite';

export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'To Do' | 'In Progress' | 'Completed';

export type Task = {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  tag: string | null;
  reminderAt: string | null;
  notificationId: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type Habit = {
  id: string;
  title: string;
  description: string;
  frequency: string;
  createdAt: string;
};

type TaskInput = Pick<Task, 'title' | 'description' | 'dueDate' | 'category' | 'priority' | 'tag' | 'reminderAt' | 'status'>;
type HabitInput = Pick<Habit, 'title' | 'description' | 'frequency'>;
const DEFAULT_FOCUS_DURATION_MINUTES = 25;
const MIN_FOCUS_DURATION_MINUTES = 1;
const MAX_FOCUS_DURATION_MINUTES = 180;
type TaskRow = {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  tag: string | null;
  reminder_at: string | null;
  notification_id: string | null;
  created_at: string;
  completed_at: string | null;
};

type HabitRow = {
  id: string;
  title: string;
  description: string;
  frequency: string;
  created_at: string;
};

type FocusRow = { id: string; duration_minutes: number; completed_at: string; task_id: string | null };
type HabitLogRow = { habit_id: string; completed_on: string };

type TaskFlowStore = {
  db: SQLiteDatabase | null;
  ready: boolean;
  tasks: Task[];
  habits: Habit[];
  habitLogs: HabitLogRow[];
  focusSessions: FocusRow[];
  notificationsEnabled: boolean;
  profileName: string;
  focusDurationMinutes: number;
  initialize: (db: SQLiteDatabase) => Promise<void>;
  addTask: (input: TaskInput) => Promise<void>;
  updateTask: (id: string, input: TaskInput) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addHabit: (input: HabitInput) => Promise<void>;
  updateHabit: (id: string, input: HabitInput) => Promise<void>;
  toggleHabit: (id: string, day: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  saveFocusSession: (durationMinutes: number, taskId: string | null) => Promise<void>;
  setFocusDurationMinutes: (minutes: number) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setProfileName: (name: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const toTask = (row: TaskRow): Task => ({
  id: row.id,
  title: row.title,
  description: row.description,
  dueDate: row.due_date,
  category: row.category,
  priority: row.priority,
  status: row.status,
  tag: row.tag,
  reminderAt: row.reminder_at,
  notificationId: row.notification_id,
  createdAt: row.created_at,
  completedAt: row.completed_at,
});
const toHabit = (row: HabitRow): Habit => ({
  id: row.id,
  title: row.title,
  description: row.description,
  frequency: row.frequency,
  createdAt: row.created_at,
});

async function scheduleReminder(title: string, reminderAt: string | null) {
  if (!reminderAt || Platform.OS === 'web') return null;
  const date = new Date(reminderAt);
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
    throw new Error('Choose a reminder time in the future.');
  }
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw new Error('Notification permission was not granted.');
  return Notifications.scheduleNotificationAsync({
    content: { title: 'TaskFlow reminder', body: title },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}

export const useTaskFlowStore = create<TaskFlowStore>((set, get) => {
  const refresh = async () => {
    const db = get().db;
    if (!db) return;
    const [taskRows, habitRows, logs, sessions, preferences] = await Promise.all([
      db.getAllAsync<TaskRow>('SELECT * FROM tasks ORDER BY due_date IS NULL, due_date, created_at DESC'),
      db.getAllAsync<HabitRow>('SELECT * FROM habits ORDER BY created_at'),
      db.getAllAsync<HabitLogRow>('SELECT * FROM habit_logs ORDER BY completed_on DESC'),
      db.getAllAsync<FocusRow>('SELECT * FROM focus_sessions ORDER BY completed_at DESC'),
      db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM preferences'),
    ]);
    const settings = new Map(preferences.map((item) => [item.key, item.value]));
    const savedFocusDuration = Number(settings.get('focus_duration_minutes'));
    set({
      tasks: taskRows.map(toTask),
      habits: habitRows.map(toHabit),
      habitLogs: logs,
      focusSessions: sessions,
      notificationsEnabled: settings.get('notifications_enabled') !== 'false',
      profileName: settings.get('profile_name') ?? '',
      focusDurationMinutes: Number.isInteger(savedFocusDuration)
        && savedFocusDuration >= MIN_FOCUS_DURATION_MINUTES
        && savedFocusDuration <= MAX_FOCUS_DURATION_MINUTES
        ? savedFocusDuration
        : DEFAULT_FOCUS_DURATION_MINUTES,
    });
  };

  return {
    db: null,
    ready: false,
    tasks: [],
    habits: [],
    habitLogs: [],
    focusSessions: [],
    notificationsEnabled: true,
    profileName: '',
    focusDurationMinutes: DEFAULT_FOCUS_DURATION_MINUTES,
    initialize: async (db) => {
      set({ db });
      await refresh();
      set({ ready: true });
    },
    refresh,
    addTask: async (input) => {
      const db = get().db;
      if (!db) throw new Error('The local database is not ready.');
      const id = makeId();
      const notificationId = get().notificationsEnabled ? await scheduleReminder(input.title, input.reminderAt) : null;
      try {
        await db.runAsync(
          'INSERT INTO tasks (id, title, description, due_date, category, priority, status, tag, reminder_at, notification_id, created_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          id, input.title.trim(), input.description.trim(), input.dueDate, input.category,
          input.priority, input.status, input.tag?.trim() || null, input.reminderAt, notificationId,
          new Date().toISOString(), input.status === 'Completed' ? new Date().toISOString() : null,
        );
        await refresh();
      } catch (error) {
        if (notificationId) await Notifications.cancelScheduledNotificationAsync(notificationId);
        throw error;
      }
    },
    updateTask: async (id, input) => {
      const db = get().db;
      if (!db) throw new Error('The local database is not ready.');
      const task = get().tasks.find((item) => item.id === id);
      if (!task) throw new Error('This task no longer exists.');
      const nextNotificationId = get().notificationsEnabled
        ? await scheduleReminder(input.title, input.reminderAt)
        : null;
      const completedAt = input.status === 'Completed'
        ? task.completedAt ?? new Date().toISOString()
        : null;
      try {
        await db.runAsync(
          'UPDATE tasks SET title = ?, description = ?, due_date = ?, category = ?, priority = ?, status = ?, tag = ?, reminder_at = ?, notification_id = ?, completed_at = ? WHERE id = ?',
          input.title.trim(), input.description.trim(), input.dueDate, input.category,
          input.priority, input.status, input.tag?.trim() || null, input.reminderAt, nextNotificationId,
          completedAt, id,
        );
        if (task.notificationId && Platform.OS !== 'web') {
          await Notifications.cancelScheduledNotificationAsync(task.notificationId);
        }
        await refresh();
      } catch (error) {
        if (nextNotificationId) await Notifications.cancelScheduledNotificationAsync(nextNotificationId);
        throw error;
      }
    },
    toggleTask: async (id) => {
      const db = get().db;
      if (!db) throw new Error('The local database is not ready.');
      const task = get().tasks.find((item) => item.id === id);
      if (!task) throw new Error('This task no longer exists.');
      const status = task.status === 'Completed' ? 'To Do' : 'Completed';
      await db.runAsync(
        'UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?',
        status, status === 'Completed' ? new Date().toISOString() : null, id,
      );
      await refresh();
    },
    deleteTask: async (id) => {
      const db = get().db;
      if (!db) throw new Error('The local database is not ready.');
      const task = get().tasks.find((item) => item.id === id);
      await db.runAsync('DELETE FROM tasks WHERE id = ?', id);
      if (task?.notificationId && Platform.OS !== 'web') {
        await Notifications.cancelScheduledNotificationAsync(task.notificationId);
      }
      await refresh();
    },
    addHabit: async (input) => {
      const db = get().db;
      if (!db) throw new Error('The local database is not ready.');
      await db.runAsync(
        'INSERT INTO habits (id, title, description, frequency, created_at) VALUES (?, ?, ?, ?, ?)',
        makeId(), input.title.trim(), input.description.trim(), input.frequency, new Date().toISOString(),
      );
      await refresh();
    },
    updateHabit: async (id, input) => {
      const db = get().db;
      if (!db) throw new Error('The local database is not ready.');
      await db.runAsync(
        'UPDATE habits SET title = ?, description = ?, frequency = ? WHERE id = ?',
        input.title.trim(), input.description.trim(), input.frequency, id,
      );
      await refresh();
    },
    toggleHabit: async (id, day) => {
      const db = get().db;
      if (!db) throw new Error('The local database is not ready.');
      const exists = get().habitLogs.some((log) => log.habit_id === id && log.completed_on === day);
      if (exists) {
        await db.runAsync('DELETE FROM habit_logs WHERE habit_id = ? AND completed_on = ?', id, day);
      } else {
        await db.runAsync('INSERT INTO habit_logs (habit_id, completed_on) VALUES (?, ?)', id, day);
      }
      await refresh();
    },
    deleteHabit: async (id) => {
      const db = get().db;
      if (!db) throw new Error('The local database is not ready.');
      await db.runAsync('DELETE FROM habits WHERE id = ?', id);
      await refresh();
    },
    saveFocusSession: async (durationMinutes, taskId) => {
      const db = get().db;
      if (!db) throw new Error('The local database is not ready.');
      await db.runAsync(
        'INSERT INTO focus_sessions (id, duration_minutes, completed_at, task_id) VALUES (?, ?, ?, ?)',
        makeId(), durationMinutes, new Date().toISOString(), taskId,
      );
      await refresh();
    },
    setFocusDurationMinutes: async (minutes) => {
      if (!Number.isInteger(minutes) || minutes < MIN_FOCUS_DURATION_MINUTES || minutes > MAX_FOCUS_DURATION_MINUTES) {
        throw new Error(`Choose a focus duration between ${MIN_FOCUS_DURATION_MINUTES} and ${MAX_FOCUS_DURATION_MINUTES} minutes.`);
      }
      const db = get().db;
      if (!db) throw new Error('The local database is not ready.');
      await db.runAsync(
        'INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)',
        'focus_duration_minutes', String(minutes),
      );
      set({ focusDurationMinutes: minutes });
    },
    setNotificationsEnabled: async (enabled) => {
      const db = get().db;
      if (!db) throw new Error('The local database is not ready.');
      if (enabled && Platform.OS !== 'web') {
        let permission = await Notifications.getPermissionsAsync();
        if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
        if (!permission.granted) throw new Error('Notification permission was not granted.');
      }
      await db.runAsync(
        'INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)',
        'notifications_enabled', String(enabled),
      );
      set({ notificationsEnabled: enabled });
      if (!enabled && Platform.OS !== 'web') {
        for (const task of get().tasks) {
          if (task.notificationId) {
            await Notifications.cancelScheduledNotificationAsync(task.notificationId);
            await db.runAsync('UPDATE tasks SET notification_id = NULL WHERE id = ?', task.id);
          }
        }
        await refresh();
      }
    },
    setProfileName: async (name) => {
      const db = get().db;
      if (!db) throw new Error('The local database is not ready.');
      await db.runAsync('INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)', 'profile_name', name.trim());
      set({ profileName: name.trim() });
    },
  };
});

export const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

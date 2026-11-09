import type { SQLiteDatabase } from 'expo-sqlite';

type TableColumn = { name: string };

export async function initializeDatabase(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA foreign_keys = ON');
  const { user_version: version } = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version') ?? {
    user_version: 0,
  };

  await db.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.execAsync(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        due_date TEXT,
        category TEXT NOT NULL DEFAULT 'Personal',
        priority TEXT NOT NULL DEFAULT 'Medium',
        status TEXT NOT NULL DEFAULT 'To Do',
        tag TEXT,
        reminder_at TEXT,
        notification_id TEXT,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        frequency TEXT NOT NULL DEFAULT 'Daily',
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS habit_logs (
        habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        completed_on TEXT NOT NULL,
        PRIMARY KEY (habit_id, completed_on)
      );
      CREATE TABLE IF NOT EXISTS focus_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        duration_minutes INTEGER NOT NULL,
        completed_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS preferences (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);

    if (version < 1) {
      await addColumnIfMissing(transaction, 'tasks', 'completed_at', 'TEXT');
      await addColumnIfMissing(transaction, 'focus_sessions', 'task_id', 'TEXT REFERENCES tasks(id) ON DELETE SET NULL');
    }
    await transaction.execAsync(`
      INSERT OR IGNORE INTO preferences (key, value) VALUES ('notifications_enabled', 'true');
      INSERT OR IGNORE INTO preferences (key, value) VALUES ('profile_name', '');
      INSERT OR IGNORE INTO preferences (key, value) VALUES ('focus_duration_minutes', '25');
      PRAGMA user_version = 1;
    `);
  });
}

async function addColumnIfMissing(
  db: SQLiteDatabase,
  table: 'tasks' | 'focus_sessions',
  column: string,
  definition: string,
) {
  const columns = await db.getAllAsync<TableColumn>(`PRAGMA table_info(${table})`);
  if (!columns.some((item) => item.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

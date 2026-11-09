import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { initializeDatabase } from '@/database';
import { Palette } from '@/constants/theme';
import { useTaskFlowStore } from '@/store/taskflow-store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function AppNavigation() {
  const db = useSQLiteContext();
  const ready = useTaskFlowStore((state) => state.ready);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    useTaskFlowStore.getState().initialize(db).catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : 'Unable to load your local data.');
    });
  }, [db]);

  if (error) {
    return (
      <View style={styles.message}>
        <Text style={styles.errorTitle}>TaskFlow couldn’t open its local database.</Text>
        <Text style={styles.errorMessage}>{error}</Text>
      </View>
    );
  }
  if (!ready) {
    return <ActivityIndicator style={styles.loader} color={Palette.primary} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="task-create" options={{ presentation: 'modal' }} />
      <Stack.Screen name="habit-create" options={{ presentation: 'modal' }} />
      <Stack.Screen name="focus" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="taskflow.db" onInit={initializeDatabase}>
      <AppNavigation />
    </SQLiteProvider>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, backgroundColor: Palette.background },
  message: { flex: 1, justifyContent: 'center', padding: 28, backgroundColor: Palette.background },
  errorTitle: { color: Palette.text, fontSize: 20, fontWeight: '700', marginBottom: 8 },
  errorMessage: { color: Palette.muted, fontSize: 14, lineHeight: 21 },
});

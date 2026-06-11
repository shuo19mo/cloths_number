import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';

import { AppNavigator } from './src/navigation/AppNavigator';
import { AppContext } from './src/state/AppContext';
import { initDatabase } from './src/db/database';
import { getUsers } from './src/services/queries';
import { colors } from './src/theme';
import type { User } from './src/models';

export default function App() {
  const [ready, setReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    initDatabase();
    const users = getUsers();
    setCurrentUser(users[0] ?? null);
    setReady(true);
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
      refreshKey,
      refresh: () => setRefreshKey((key) => key + 1),
    }),
    [currentUser, refreshKey],
  );

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <AppContext.Provider value={value}>
      <NavigationContainer>
        <StatusBar style="dark" />
        <AppNavigator />
      </NavigationContainer>
    </AppContext.Provider>
  );
}

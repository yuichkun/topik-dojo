import '../global.css';
import { Stack } from 'expo-router';
import { Text, View, LogBox } from 'react-native';
import { useFonts, Epilogue_600SemiBold, Epilogue_700Bold } from '@expo-google-fonts/epilogue';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold } from '@expo-google-fonts/manrope';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import database from '../src/database/client';
import { useDataInitialization } from '../src/hooks/useDataInitialization';

LogBox.ignoreLogs(['SafeAreaView has been deprecated']);
import migrations from '../drizzle/migrations';

export default function RootLayout() {
  const { success: migrationSuccess, error: migrationError } = useMigrations(database, migrations);
  const { ready: seedReady, error: seedError } = useDataInitialization(migrationSuccess ?? false);
  const [fontsLoaded] = useFonts({
    Epilogue_600SemiBold,
    Epilogue_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
  });

  if (migrationError) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-red-500">Migration error: {migrationError.message}</Text>
      </View>
    );
  }

  if (seedError) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-red-500">Seed error: {seedError}</Text>
      </View>
    );
  }

  if (!migrationSuccess || !seedReady || !fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#002897' }} />
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="review" />
      <Stack.Screen name="[grade]" />
    </Stack>
  );
}

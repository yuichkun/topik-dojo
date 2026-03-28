import { Stack } from 'expo-router';

export default function GradeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="learning/index" />
      <Stack.Screen name="learning/units" />
      <Stack.Screen name="learning/[unitId]" />
      <Stack.Screen name="test/index" />
      <Stack.Screen name="test/units" />
      <Stack.Screen name="test/reading/[unitId]" />
      <Stack.Screen name="test/listening/[unitId]" />
      <Stack.Screen name="review" />
    </Stack>
  );
}

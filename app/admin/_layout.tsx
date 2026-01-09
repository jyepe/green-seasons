import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

export default function AdminLayout() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="orders" options={{ headerShown: false }} />
      <Stack.Screen name="items" options={{ headerShown: false }} />
      <Stack.Screen name="employees" options={{ headerShown: false }} />
      <Stack.Screen name="restaurants" options={{ headerShown: false }} />
      <Stack.Screen name="revenue-by-day" options={{ headerShown: false }} />
      <Stack.Screen name="orders-by-day" options={{ headerShown: false }} />
      <Stack.Screen name="top-items" options={{ headerShown: false }} />
    </Stack>
  );
}
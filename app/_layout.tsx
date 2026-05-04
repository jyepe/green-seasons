import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
  Theme,
} from '@react-navigation/native';
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useMemo } from 'react';
import { ThemeProvider, useAppColorScheme } from '@/hooks/useTheme';
import { Colors } from '@/constants/Colors';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { logError } from '@/lib/logger';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: error => logError(error, { source: 'query' }),
  }),
  mutationCache: new MutationCache({
    onError: error => logError(error, { source: 'mutation' }),
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    // ErrorUtils is a React Native global — catches unhandled JS errors and
    // fatal exceptions outside the React tree. On Hermes, unhandled promise
    // rejections surface through this same handler.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).ErrorUtils?.setGlobalHandler(
      (error: Error, isFatal: boolean) => {
        logError(error, { source: 'global', isFatal });
      }
    );
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}

function AppContent() {
  const colorScheme = useAppColorScheme();

  // Create custom themes based on our Colors constants (memoized to prevent recreation on every render)
  const CustomDefaultTheme: Theme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        primary: Colors.light.primary,
        background: Colors.light.background,
        card: Colors.light.surface,
        text: Colors.light.text,
        border: Colors.light.border,
        notification: Colors.light.accent,
      },
    }),
    []
  );

  const CustomDarkTheme: Theme = useMemo(
    () => ({
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        primary: Colors.dark.primary,
        background: Colors.dark.background,
        card: Colors.dark.surface,
        text: Colors.dark.text,
        border: Colors.dark.border,
        notification: Colors.dark.accent,
      },
    }),
    []
  );

  // Memoize background color to avoid recalculation
  const backgroundColor = useMemo(
    () =>
      colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    [colorScheme]
  );

  useEffect(() => {
    // Set the native root view background color to match our theme
    // This prevents white flashes during deep navigation transitions
    SystemUI.setBackgroundColorAsync(backgroundColor);
  }, [backgroundColor]);

  return (
    <NavigationThemeProvider
      value={colorScheme === 'dark' ? CustomDarkTheme : CustomDefaultTheme}
    >
      <Stack
        screenOptions={{
          animation: 'slide_from_right',
          animationDuration: 250,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          contentStyle: {
            backgroundColor,
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen
          name="admin"
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="employee"
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="order/[id]"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="favorites"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="orders"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

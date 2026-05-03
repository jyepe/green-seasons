import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
}

const THEME_STORAGE_KEY = '@green_seasons_theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  // Load saved theme preference on mount.
  // Render is NOT gated on this resolving — AsyncStorage on Android+new-arch
  // can hang indefinitely and would otherwise trap the app on the splash
  // screen. Initial render uses the system color scheme; the saved
  // preference swaps in once it loads.
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then(savedTheme => {
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      })
      .catch(() => {
        // Theme preferences are non-critical; fall back to 'system'.
      });
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Silently fail - theme will still work for the current session,
      // but won't persist across app restarts if storage fails.
    }
  };

  // Calculate the effective theme based on mode selection
  const effectiveTheme: 'light' | 'dark' =
    themeMode === 'system' ? (systemColorScheme ?? 'light') : themeMode;

  const isDark = effectiveTheme === 'dark';

  return (
    <ThemeContext.Provider
      value={{ themeMode, effectiveTheme, setThemeMode, isDark }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Custom hook that returns the effective color scheme for the app.
 * This replaces the default useColorScheme when you want the user's
 * preference instead of the system setting.
 */
export function useAppColorScheme(): 'light' | 'dark' {
  const { effectiveTheme } = useTheme();
  return effectiveTheme;
}

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
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        // Silently fail and use default
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('Failed to load theme preference:', error);
        }
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('Failed to save theme preference:', error);
      }
    }
  };

  // Calculate the effective theme based on mode selection
  const effectiveTheme: 'light' | 'dark' =
    themeMode === 'system'
      ? systemColorScheme ?? 'light'
      : themeMode;

  const isDark = effectiveTheme === 'dark';

  // Don't render until theme is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

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

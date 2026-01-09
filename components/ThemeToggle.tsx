import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { ThemeMode, useTheme } from '@/hooks/useTheme';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface ThemeToggleProps {
  colors: (typeof Colors)['light'] | (typeof Colors)['dark'];
}

type IconSymbolName =
  | 'sun.max.fill'
  | 'moon.fill'
  | 'gear'
  | 'house.fill'
  | 'person.fill';

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: IconSymbolName }[] =
  [
    { mode: 'light', label: 'Light', icon: 'sun.max.fill' },
    { mode: 'dark', label: 'Dark', icon: 'moon.fill' },
    { mode: 'system', label: 'System', icon: 'gear' },
  ];

export function ThemeToggle({ colors }: ThemeToggleProps) {
  const { themeMode, setThemeMode } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.label, { color: colors.text }]}>Appearance</Text>
      <View style={styles.optionsContainer}>
        {THEME_OPTIONS.map((option) => {
          const isSelected = themeMode === option.mode;
          return (
            <TouchableOpacity
              key={option.mode}
              style={[
                styles.option,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : colors.inputBackground,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setThemeMode(option.mode)}
              accessibilityLabel={`${option.label} theme`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <IconSymbol
                name={option.icon}
                size={18}
                color={isSelected ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.optionText,
                  { color: isSelected ? '#FFFFFF' : colors.text },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter_600SemiBold',
  },
});

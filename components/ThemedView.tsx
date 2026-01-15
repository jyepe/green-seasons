import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type ViewProps,
} from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'background'
  );

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}

/**
 * Shared loading view with spinner and text.
 * Replaces duplicated "View > ActivityIndicator + Text" patterns.
 */
export function LoadingView({
  message = 'Loading...',
  style,
  ...props
}: ViewProps & { message?: string }) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.loadingContainer, style]} {...props}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
});

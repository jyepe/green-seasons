// components/profile/ProfileSection.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

type Props = {
  title?: string;
  children: React.ReactNode;
};

/**
 * Card container that auto-strips the bottom divider from the last visible row.
 * Children that render `null` (e.g. when conditionally rendered) are filtered
 * out before the last-child decision is made, so the rule is "last *visible*
 * child has no bottom border" rather than "last child in JSX order."
 */
export function ProfileSection({ title, children }: Props) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const visible = React.Children.toArray(children).filter(Boolean);
  if (visible.length === 0) return null;

  const decorated = visible.map((child, i) => {
    if (!React.isValidElement(child)) return child;
    return React.cloneElement(
      child as React.ReactElement<{ isLast?: boolean }>,
      { isLast: i === visible.length - 1 }
    );
  });

  return (
    <View style={styles.wrap}>
      {title ? (
        <Text style={[styles.title, { color: colors.textSecondary }]}>
          {title}
        </Text>
      ) : null}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: isDark ? colors.border : 'transparent',
            borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
            shadowOpacity: isDark ? 0 : 0.06,
          },
        ]}
      >
        {decorated}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 20,
  },
  title: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  card: {
    marginHorizontal: 20,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
});

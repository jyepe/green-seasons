import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { greetingForHour } from './utils';

type Props = {
  /**
   * The user's first name. Orchestrator should pass
   * `userInfo?.first_name || 'there'` so empty strings also fall back.
   */
  firstName: string;
  restaurantName?: string;
  /** When true, replaces firstName + storefront row with skeleton bars. */
  isLoading?: boolean;
};

export function DashboardHeader({
  firstName,
  restaurantName,
  isLoading,
}: Props) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const greeting = useMemo(() => greetingForHour(new Date()), []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.titleBlock}>
        <Text style={[styles.greeting, { color: colors.textSecondary }]}>
          {greeting},
        </Text>

        {isLoading ? (
          <View
            style={[styles.nameSkeleton, { backgroundColor: colors.border }]}
          />
        ) : (
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {firstName}
          </Text>
        )}

        {isLoading ? (
          <View
            style={[
              styles.restaurantSkeleton,
              { backgroundColor: colors.border },
            ]}
          />
        ) : restaurantName ? (
          <View style={styles.restaurantRow}>
            <Ionicons
              name="storefront-outline"
              size={13}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.restaurant, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {restaurantName}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  name: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.26,
    lineHeight: 30,
    marginTop: 1,
  },
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  restaurant: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    flexShrink: 1,
  },
  nameSkeleton: {
    width: 160,
    height: 26,
    borderRadius: 6,
    marginTop: 1,
  },
  restaurantSkeleton: {
    width: 110,
    height: 13,
    borderRadius: 4,
    marginTop: 6,
  },
});

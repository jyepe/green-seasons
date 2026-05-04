import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import type { Order } from '@/lib/supabase';
import { RecentOrderRow } from './RecentOrderRow';
import { EmptyOrdersInline } from './EmptyOrdersInline';

type Props = {
  /** Pre-sliced to at most 3 by the orchestrator. */
  orders: Order[];
  isLoading: boolean;
  onSeeAll: () => void;
  onBrowseProduce: () => void;
  onPressRow: (id: string) => void;
};

function SkeletonRow({
  isLast,
  borderColor,
}: {
  isLast: boolean;
  borderColor: string;
}) {
  return (
    <View
      style={[
        styles.row,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: borderColor,
        },
      ]}
    >
      <View style={[styles.skeletonTile, { backgroundColor: borderColor }]} />
      <View style={styles.skeletonBody}>
        <View
          style={[styles.skeletonBarTop, { backgroundColor: borderColor }]}
        />
        <View
          style={[styles.skeletonBarBottom, { backgroundColor: borderColor }]}
        />
      </View>
    </View>
  );
}

export function RecentOrdersCard({
  orders,
  isLoading,
  onSeeAll,
  onBrowseProduce,
  onPressRow,
}: Props) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const showAction = isLoading || orders.length > 0;

  return (
    <View>
      {/* Section header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Recent orders
        </Text>
        {showAction ? (
          <TouchableOpacity
            onPress={onSeeAll}
            accessibilityRole="button"
            accessibilityLabel="View order history"
          >
            <Text style={[styles.action, { color: colors.primary }]}>
              History
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderWidth: isDark ? 1 : 0,
            borderColor: colors.border,
          },
          !isDark && styles.cardShadow,
        ]}
      >
        {isLoading ? (
          [0, 1, 2].map(i => (
            <SkeletonRow key={i} isLast={i === 2} borderColor={colors.border} />
          ))
        ) : orders.length === 0 ? (
          <EmptyOrdersInline onBrowseProduce={onBrowseProduce} />
        ) : (
          orders.map((o, i, arr) => (
            <RecentOrderRow
              key={o.id}
              order={o}
              isLast={i === arr.length - 1}
              onPress={() => onPressRow(o.id)}
            />
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.17,
  },
  action: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  card: {
    marginHorizontal: 20,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  // Skeleton row mirrors the live RecentOrderRow geometry
  row: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skeletonTile: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  skeletonBody: {
    flex: 1,
    gap: 6,
  },
  skeletonBarTop: {
    width: 130,
    height: 11,
    borderRadius: 4,
  },
  skeletonBarBottom: {
    width: 90,
    height: 9,
    borderRadius: 4,
  },
});

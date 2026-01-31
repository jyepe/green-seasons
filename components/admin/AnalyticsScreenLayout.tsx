import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { ReactNode } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingView } from '../ThemedView';

import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

type AnalyticsScreenLayoutProps = {
  title: string;
  subtitle: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  children: ReactNode;
  contentPadding?: boolean;
};

/**
 * Reusable layout component for analytics screens
 * Provides consistent header, back navigation, and scroll view with refresh control
 */
export function AnalyticsScreenLayout({
  title,
  subtitle,
  isRefreshing,
  onRefresh,
  children,
  contentPadding = true,
}: AnalyticsScreenLayoutProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const router = useRouter();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {title}
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            {subtitle}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          contentPadding && styles.scrollContentWithPadding,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {children}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

type AnalyticsDataListProps<T> = {
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onViewAll?: () => void;
  viewAllText?: string;
  renderItem: (item: T, index: number) => React.ReactNode;
};

/**
 * Reusable list component for analytics data
 * Handles loading state, empty state, and "View All" button
 */
export function AnalyticsDataList<T>({
  data,
  isLoading,
  emptyMessage = 'No data available',
  onViewAll,
  viewAllText = 'View All',
  renderItem,
}: AnalyticsDataListProps<T>) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  if (isLoading) {
    return (
      <LoadingView
        size="small"
        message=""
        style={[styles.loadingContainer, { flex: 0 }]}
      />
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {data.map(renderItem)}

      {onViewAll && (
        <TouchableOpacity
          style={[styles.viewAllButton, { borderColor: colors.primary }]}
          onPress={onViewAll}
          accessibilityLabel={viewAllText}
          accessibilityRole="button"
        >
          <Text style={[styles.viewAllText, { color: colors.primary }]}>
            {viewAllText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

type SimpleDataListProps<T> = Omit<AnalyticsDataListProps<T>, 'renderItem'> & {
  mapItem: (item: T) => { id: string | number; label: string; value: string };
};

/**
 * Simplified wrapper for AnalyticsDataList that handles standard Label + Value rendering
 */
export function SimpleDataList<T>({
  data,
  mapItem,
  ...props
}: SimpleDataListProps<T>) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <AnalyticsDataList
      data={data}
      {...props}
      renderItem={(item, index) => {
        const { id, label, value } = mapItem(item);
        return (
          <View
            key={id}
            style={[
              styles.simpleRow,
              index < data.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.simpleLabel, { color: colors.text }]}>
              {label}
            </Text>
            <Text style={[styles.simpleValue, { color: colors.text }]}>
              {value}
            </Text>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  scrollContentWithPadding: {
    paddingHorizontal: 16,
  },
  bottomSpacer: {
    height: 32,
  },
  // List Styles
  listContainer: {
    paddingVertical: 8,
  },
  loadingContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  viewAllButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  // SimpleDataList Styles
  simpleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  simpleLabel: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  simpleValue: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});

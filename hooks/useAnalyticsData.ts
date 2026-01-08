import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

type AnalyticsDataParams<T> = {
  queryKey: string;
  queryFn: (start: Date, end: Date, limit: number) => Promise<T[]>;
  limit?: number;
};

type AnalyticsDataResult<T> = {
  selectedMonth: { year: number; month: number };
  dateRange: { start: Date; end: Date };
  monthLabel: string;
  query: UseQueryResult<T[], Error>;
  onRefresh: () => void;
};

/**
 * Custom hook for managing analytics data fetching and state
 * Handles URL parameters, date calculations, and query management
 */
export function useAnalyticsData<T>({
  queryKey,
  queryFn,
  limit = -1,
}: AnalyticsDataParams<T>): AnalyticsDataResult<T> {
  // Get month data from URL params (passed from dashboard)
  const { year, month } = useLocalSearchParams<{
    year: string;
    month: string;
  }>();

  // Parse params with fallback to current month
  const selectedMonth = useMemo(() => {
    const now = new Date();
    return {
      year: year ? parseInt(year, 10) : now.getFullYear(),
      month: month ? parseInt(month, 10) : now.getMonth(),
    };
  }, [year, month]);

  // Calculate date range for selected month
  const dateRange = useMemo(() => {
    const now = new Date();
    const start = new Date(selectedMonth.year, selectedMonth.month, 1);
    const isCurrentMonth =
      selectedMonth.year === now.getFullYear() &&
      selectedMonth.month === now.getMonth();

    // If viewing current month, set end to start of tomorrow to include all of today
    // Otherwise, go to start of next month
    const end = isCurrentMonth
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      : new Date(selectedMonth.year, selectedMonth.month + 1, 1);

    return { start, end };
  }, [selectedMonth]);

  // Format month for display
  const monthLabel = useMemo(() => {
    const date = new Date(selectedMonth.year, selectedMonth.month, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // Query data
  const query = useQuery({
    queryKey: [queryKey, dateRange.start.toISOString()],
    queryFn: () => queryFn(dateRange.start, dateRange.end, limit),
  });

  // Refresh data
  const onRefresh = () => {
    query.refetch();
  };

  return {
    selectedMonth,
    dateRange,
    monthLabel,
    query,
    onRefresh,
  };
}

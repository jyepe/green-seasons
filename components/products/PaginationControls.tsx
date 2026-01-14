import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <View
      style={[
        styles.paginationContainer,
        { borderColor: colors.textTertiary },
      ]}
      accessible={true}
      accessibilityLabel={`Pagination, Page ${currentPage} of ${totalPages}`}
    >
      <TouchableOpacity
        style={[
          styles.paginationButton,
          { backgroundColor: colors.surface },
          !hasPrevious && styles.paginationButtonDisabled,
        ]}
        onPress={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={!hasPrevious}
        accessibilityRole="button"
        accessibilityLabel="Previous Page"
        accessibilityState={{ disabled: !hasPrevious }}
      >
        <Ionicons
          name="chevron-back"
          size={18}
          color={!hasPrevious ? colors.textTertiary : colors.text}
        />
      </TouchableOpacity>
      <Text
        style={[styles.paginationLabel, { color: colors.textSecondary }]}
      >
        Page {currentPage} of {totalPages}
      </Text>
      <TouchableOpacity
        style={[
          styles.paginationButton,
          { backgroundColor: colors.surface },
          !hasNext && styles.paginationButtonDisabled,
        ]}
        onPress={() =>
          onPageChange(Math.min(currentPage + 1, totalPages))
        }
        disabled={!hasNext}
        accessibilityRole="button"
        accessibilityLabel="Next Page"
        accessibilityState={{ disabled: !hasNext }}
      >
        <Ionicons
          name="chevron-forward"
          size={18}
          color={!hasNext ? colors.textTertiary : colors.text}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  paginationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    opacity: 0.4,
  },
  paginationLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});

import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

type Token = number | 'ellipsis-left' | 'ellipsis-right';

function buildTokens(current: number, total: number): Token[] {
  if (total <= 1) return [1];
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const tokens: Token[] = [1];
  if (current > 3) tokens.push('ellipsis-left');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) tokens.push(i);
  if (current < total - 2) tokens.push('ellipsis-right');
  tokens.push(total);
  return tokens;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  const tokens = buildTokens(currentPage, totalPages);
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <View
      style={styles.container}
      accessibilityLabel={`Pagination, page ${currentPage} of ${totalPages}`}
    >
      <ChevronBtn
        direction="back"
        disabled={!hasPrevious}
        onPress={() => onPageChange(Math.max(currentPage - 1, 1))}
        colors={colors}
      />
      {tokens.map((tok, idx) => {
        if (tok === 'ellipsis-left' || tok === 'ellipsis-right') {
          return (
            <Text
              key={`${tok}-${idx}`}
              style={[styles.ellipsis, { color: colors.textSecondary }]}
            >
              …
            </Text>
          );
        }
        const active = tok === currentPage;
        return (
          <Pressable
            key={tok}
            onPress={() => onPageChange(tok)}
            disabled={active}
            style={({ pressed }) => [
              styles.pageBtn,
              {
                backgroundColor: active ? colors.primary : 'transparent',
                borderColor: active ? colors.primary : colors.border,
                shadowColor: active ? colors.primary : 'transparent',
              },
              pressed && !active && { backgroundColor: colors.inputBackground },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Page ${tok}${active ? ', current' : ''}`}
            accessibilityState={{ selected: active }}
          >
            <Text
              style={[
                styles.pageText,
                { color: active ? 'white' : colors.text },
              ]}
            >
              {tok}
            </Text>
          </Pressable>
        );
      })}
      <ChevronBtn
        direction="forward"
        disabled={!hasNext}
        onPress={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        colors={colors}
      />
    </View>
  );
}

type ColorTokens = (typeof Colors)['light'];

function ChevronBtn({
  direction,
  disabled,
  onPress,
  colors,
}: {
  direction: 'back' | 'forward';
  disabled: boolean;
  onPress: () => void;
  colors: ColorTokens;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chevron,
        { borderColor: colors.border },
        disabled && styles.chevronDisabled,
        pressed && !disabled && { backgroundColor: colors.inputBackground },
      ]}
      accessibilityRole="button"
      accessibilityLabel={direction === 'back' ? 'Previous page' : 'Next page'}
      accessibilityState={{ disabled }}
    >
      <Ionicons
        name={direction === 'back' ? 'chevron-back' : 'chevron-forward'}
        size={16}
        color={disabled ? colors.textTertiary : colors.text}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  chevron: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronDisabled: {
    opacity: 0.4,
  },
  pageBtn: {
    minWidth: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  pageText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  ellipsis: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    paddingHorizontal: 4,
  },
});

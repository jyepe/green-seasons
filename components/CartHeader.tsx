import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

type CartHeaderProps = {
  restaurantName?: string;
  itemCount: number;
  onClearCart: () => void;
  isClearing: boolean;
};

export function CartHeader({
  restaurantName,
  itemCount,
  onClearCart,
  isClearing,
}: CartHeaderProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.headerContent}>
        <View style={styles.headerTextContainer}>
          <Text
            style={[styles.headerTitle, { color: colors.text }]}
            accessibilityRole="header"
          >
            Cart{restaurantName ? ` • ${restaurantName}` : ''}
          </Text>
          {itemCount > 0 && (
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
          )}
        </View>
        {itemCount > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={onClearCart}
            disabled={isClearing}
            accessibilityRole="button"
            accessibilityLabel="Clear cart"
            accessibilityState={{ disabled: isClearing, busy: isClearing }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isClearing ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <>
                <Ionicons name="trash-outline" size={16} color={colors.error} />
                <Text style={[styles.clearButtonText, { color: colors.error }]}>
                  Clear
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    opacity: 0.7,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

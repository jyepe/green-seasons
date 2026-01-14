import { Ionicons } from '@expo/vector-icons';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LoadingView } from '@/components/ThemedView';
import { SwipeableRow } from './SwipeableRow';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { useAdmin } from '@/hooks/useAdmin';
import type { CartItem } from '@/lib/supabase';

type CartListProps = {
  cartItems: CartItem[];
  isLoading: boolean;
  error: Error | null;
  updatingItemId: string | null;
  itemImageMap: Map<string, string | null>;
  onQuantityChange: (itemId: string, delta: number) => void;
  onDeleteItem: (itemId: string) => void;
  onItemPress: (item: CartItem) => void;
};

export function CartList({
  cartItems,
  isLoading,
  error,
  updatingItemId,
  itemImageMap,
  onQuantityChange,
  onDeleteItem,
  onItemPress,
}: CartListProps) {
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { data: isUserAdmin } = useAdmin();

  if (isLoading) {
    return <LoadingView message="Loading cart..." />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={colors.error}
          style={styles.errorIcon}
        />
        <Text style={[styles.errorText, { color: colors.text }]}>
          Failed to load cart. Please try again.
        </Text>
      </View>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="cart-outline"
          size={80}
          color={colors.textTertiary}
          style={styles.icon}
        />
        <Text style={[styles.title, { color: colors.text }]}>
          Your cart is empty
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Start adding products to your cart to get started
        </Text>
        <TouchableOpacity
          style={[
            styles.startShoppingButton,
            { backgroundColor: colors.primary },
          ]}
          onPress={() =>
            router.push(
              isUserAdmin ? '/admin/(tabs)/explore' : '/(tabs)/explore'
            )
          }
          accessibilityLabel="Start shopping"
          accessibilityRole="button"
        >
          <Text style={styles.startShoppingButtonText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={cartItems}
      renderItem={({ item, index }) => (
        <SwipeableRow
          item={item}
          index={index}
          updatingItemId={updatingItemId}
          itemImageMap={itemImageMap}
          onQuantityChange={onQuantityChange}
          onDeleteItem={onDeleteItem}
          onItemPress={onItemPress}
        />
      )}
      keyExtractor={item => item.item_row_id}
      style={styles.cartContainer}
      contentContainerStyle={styles.cartContent}
      ItemSeparatorComponent={() => (
        <View style={[styles.separator, { backgroundColor: colors.border }]} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 32,
  },
  startShoppingButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  startShoppingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cartContainer: {
    flex: 1,
  },
  cartContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 160,
  },
  separator: {
    height: 1,
    marginLeft: 0,
  },
});

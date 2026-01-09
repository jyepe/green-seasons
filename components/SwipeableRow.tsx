import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { withSpring } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { useSwipeToDelete } from '@/hooks/useSwipeToDelete';
import type { CartItem } from '@/lib/supabase';

const DELETE_ACTION_WIDTH = 90;

type SwipeableRowProps = {
  item: CartItem;
  index: number;
  updatingItemId: string | null;
  itemImageMap: Map<string, string | null>;
  onQuantityChange: (itemId: string, delta: number) => void;
  onDeleteItem: (itemId: string) => void;
  onItemPress: (item: CartItem) => void;
};

export function SwipeableRow({
  item,
  updatingItemId,
  itemImageMap,
  onQuantityChange,
  onDeleteItem,
  onItemPress,
}: SwipeableRowProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  const { panGesture, animatedRowStyle, animatedDeleteStyle, translateX } =
    useSwipeToDelete({
      onDelete: () => onDeleteItem(item.item_id),
      deleteActionWidth: DELETE_ACTION_WIDTH,
    });

  return (
    <View>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedRowStyle}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onItemPress(item)}
          >
            <View style={styles.cartItem}>
              <View
                style={[
                  styles.thumbnailContainer,
                  { backgroundColor: colors.border },
                ]}
              >
                {itemImageMap.get(item.item_id) ? (
                  <Image
                    source={{
                      uri: itemImageMap.get(item.item_id) as string,
                    }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons
                    name="image-outline"
                    size={20}
                    color={colors.textSecondary}
                  />
                )}
              </View>
              <View style={styles.cartItemLeft}>
                <View style={styles.cartItemInfo}>
                  <Text style={[styles.cartItemName, { color: colors.text }]}>
                    {item.item_name}
                  </Text>
                  <Text
                    style={[
                      styles.cartItemUnitPrice,
                      { color: colors.textSecondary },
                    ]}
                  >
                    ${item.item_price.toFixed(2)} each
                  </Text>
                </View>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={[
                      styles.stepperButton,
                      { borderColor: colors.border },
                      (item.quantity <= 1 || updatingItemId === item.item_id) &&
                        styles.stepperButtonDisabled,
                    ]}
                    onPress={() => onQuantityChange(item.item_id, -1)}
                    disabled={
                      item.quantity <= 1 || updatingItemId === item.item_id
                    }
                  >
                    <Ionicons name="remove" size={16} color={colors.text} />
                  </TouchableOpacity>
                  <View style={styles.quantityValueContainer}>
                    {updatingItemId === item.item_id ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text
                        style={[styles.quantityValue, { color: colors.text }]}
                      >
                        {item.quantity}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.stepperButton,
                      { borderColor: colors.border },
                      updatingItemId === item.item_id &&
                        styles.stepperButtonDisabled,
                    ]}
                    onPress={() => onQuantityChange(item.item_id, 1)}
                    disabled={updatingItemId === item.item_id}
                  >
                    <Ionicons name="add" size={16} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={[styles.cartItemSubtotal, { color: colors.text }]}>
                ${item.line_subtotal.toFixed(2)}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
      <Animated.View
        style={[
          styles.deleteAction,
          { backgroundColor: colors.error },
          animatedDeleteStyle,
        ]}
      >
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            translateX.value = withSpring(0);
            onDeleteItem(item.item_id);
          }}
        >
          <Ionicons name="trash" size={20} color="white" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  thumbnailContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  cartItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginRight: 16,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  cartItemUnitPrice: {
    fontSize: 13,
    fontWeight: '400',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  stepperButtonDisabled: {
    opacity: 0.4,
  },
  quantityValueContainer: {
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  cartItemSubtotal: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
    marginRight: 12,
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

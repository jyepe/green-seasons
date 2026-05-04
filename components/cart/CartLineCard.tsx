// components/cart/CartLineCard.tsx
import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import type { CartItem } from '@/lib/supabase';

export type CartLineCardProps = {
  item: CartItem;
  imageUrl: string | null;
  isUpdating: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  onPress: () => void;
};

export function CartLineCard({
  item,
  imageUrl,
  isUpdating,
  onIncrement,
  onDecrement,
  onRemove,
  onPress,
}: CartLineCardProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const isTrashMode = item.quantity === 1;

  const cardSurfaceStyle = [
    styles.card,
    {
      backgroundColor: colors.surface,
      ...(isDark
        ? {
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
          }
        : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
          }),
    },
  ];

  return (
    <Pressable
      onPress={onPress}
      accessibilityActions={[{ name: 'delete', label: 'Delete item' }]}
      onAccessibilityAction={e => {
        if (e.nativeEvent.actionName === 'delete') {
          onRemove();
        }
      }}
      style={({ pressed }) => [cardSurfaceStyle, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.row}>
        {/* Left tile */}
        <View style={styles.tile}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.tileImage}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={[`${colors.primary}33`, `${colors.primary}1A`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tileGradient}
            >
              <Ionicons name="leaf-outline" size={24} color={colors.primary} />
            </LinearGradient>
          )}
        </View>

        {/* Right column */}
        <View style={styles.right}>
          <View style={styles.topRow}>
            <Text
              style={[styles.name, { color: colors.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.item_name}
            </Text>
            <Text style={[styles.subtotal, { color: colors.text }]}>
              ${item.line_subtotal.toFixed(2)}
            </Text>
          </View>

          <Text style={[styles.unitPrice, { color: colors.textSecondary }]}>
            ${item.item_price.toFixed(2)}/each
          </Text>

          <View style={styles.stepperRow}>
            <View
              style={[
                styles.stepperPill,
                {
                  backgroundColor: colors.inputBackground,
                  ...(isDark && {
                    borderWidth: 1,
                    borderColor: colors.border,
                  }),
                },
              ]}
            >
              <Pressable
                onPress={onDecrement}
                disabled={isUpdating}
                accessibilityRole="button"
                accessibilityLabel={
                  isTrashMode
                    ? `Remove ${item.item_name} from cart`
                    : `Decrease quantity of ${item.item_name}`
                }
                accessibilityState={{ disabled: isUpdating, busy: isUpdating }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  pressed && { opacity: 0.6 },
                ]}
              >
                {isTrashMode ? (
                  <Ionicons
                    name="trash-outline"
                    size={16}
                    color={colors.error}
                  />
                ) : (
                  <Ionicons name="remove" size={16} color={colors.text} />
                )}
              </Pressable>

              <View style={styles.qtyValue}>
                {isUpdating ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[styles.qtyText, { color: colors.text }]}>
                    {item.quantity}
                  </Text>
                )}
              </View>

              <Pressable
                onPress={onIncrement}
                disabled={isUpdating}
                accessibilityRole="button"
                accessibilityLabel={`Increase quantity of ${item.item_name}`}
                accessibilityState={{ disabled: isUpdating, busy: isUpdating }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={({ pressed }) => [
                  styles.stepperBtnPrimary,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
              </Pressable>
            </View>

            <Pressable
              onPress={onRemove}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item.item_name} from cart`}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={({ pressed }) => [
                styles.removeBtn,
                pressed && { opacity: 0.5 },
              ]}
            >
              <Text style={[styles.removeText, { color: colors.error }]}>
                Remove
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tile: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    flexShrink: 0,
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  tileGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  subtotal: {
    fontSize: 14,
    fontWeight: '700',
  },
  unitPrice: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 2,
  },
  stepperRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stepperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    padding: 2,
  },
  stepperBtn: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  stepperBtnPrimary: {
    width: 26,
    height: 26,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    minWidth: 24,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '700',
  },
  removeBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  removeText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

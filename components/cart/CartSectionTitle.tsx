// components/cart/CartSectionTitle.tsx
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

type Props = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  actionDisabled?: boolean;
  actionBusy?: boolean;
};

export function CartSectionTitle({
  title,
  actionLabel,
  onActionPress,
  actionDisabled,
  actionBusy,
}: Props) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const showAction = !!actionLabel && !!onActionPress;

  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {showAction && (
        <Pressable
          onPress={onActionPress}
          disabled={actionDisabled || actionBusy}
          accessibilityRole="button"
          accessibilityLabel="Clear cart"
          accessibilityState={{
            disabled: !!actionDisabled,
            busy: !!actionBusy,
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={({ pressed }) => [
            styles.action,
            (pressed || actionDisabled) && { opacity: 0.5 },
          ]}
        >
          {actionBusy ? (
            <ActivityIndicator size="small" color={colors.textTertiary} />
          ) : (
            <Text style={[styles.actionText, { color: colors.textTertiary }]}>
              {actionLabel}
            </Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  action: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

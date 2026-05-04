// components/cart/CartSwipeableLine.tsx
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { withSpring } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { useSwipeToDelete } from '@/hooks/useSwipeToDelete';
import { CartLineCard, type CartLineCardProps } from './CartLineCard';

const DELETE_ACTION_WIDTH = 90;

export function CartSwipeableLine(props: CartLineCardProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  const {
    panGesture,
    animatedRowStyle,
    animatedDeleteStyle,
    translateX,
    isSwiping,
  } = useSwipeToDelete({
    onDelete: props.onRemove,
    deleteActionWidth: DELETE_ACTION_WIDTH,
  });

  // Block tap-to-edit while swiping or partially swiped.
  const handlePress = useCallback(() => {
    if (!isSwiping.value && Math.abs(translateX.value) < 1) {
      props.onPress();
    }
  }, [props, isSwiping, translateX]);

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedRowStyle}>
          <CartLineCard {...props} onPress={handlePress} />
        </Animated.View>
      </GestureDetector>
      <Animated.View
        style={[
          styles.deleteAction,
          { backgroundColor: colors.error },
          animatedDeleteStyle,
        ]}
      >
        <Pressable
          style={styles.deleteButton}
          onPress={() => {
            translateX.value = withSpring(0);
            props.onRemove();
          }}
          accessibilityRole="button"
          accessibilityLabel="Delete item"
        >
          <Ionicons name="trash" size={20} color="#FFFFFF" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_ACTION_WIDTH,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

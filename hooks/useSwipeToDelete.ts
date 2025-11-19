import { Gesture } from 'react-native-gesture-handler';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

type UseSwipeToDeleteProps = {
  onDelete: () => void;
  deleteActionWidth: number;
};

const SWIPE_VELOCITY_THRESHOLD = 500;
const SNAP_POINT_RATIO = 0.2;
const FULL_SWIPE_RATIO = 0.5;

export function useSwipeToDelete({
  onDelete,
  deleteActionWidth,
}: UseSwipeToDeleteProps) {
  const translateX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .onUpdate(e => {
      const deltaX = e.translationX;
      if (deltaX < 0) {
        translateX.value = Math.max(deltaX, -deleteActionWidth);
      } else if (deltaX > 0 && translateX.value < 0) {
        translateX.value = Math.min(deltaX, 0);
      }
    })
    .onEnd(e => {
      const velocity = e.velocityX;
      const currentTranslate = translateX.value;

      if (
        velocity > SWIPE_VELOCITY_THRESHOLD ||
        currentTranslate > -deleteActionWidth * SNAP_POINT_RATIO
      ) {
        translateX.value = withSpring(0, {
          damping: 15,
          stiffness: 200,
        });
      } else if (currentTranslate < -deleteActionWidth * FULL_SWIPE_RATIO) {
        translateX.value = withSpring(-deleteActionWidth, {
          damping: 15,
          stiffness: 200,
        });
      } else {
        translateX.value = withSpring(0, {
          damping: 15,
          stiffness: 200,
        });
      }
    });

  const animatedRowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedDeleteStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -deleteActionWidth * SNAP_POINT_RATIO ? 1 : 0,
    transform: [{ translateX: translateX.value + deleteActionWidth }],
  }));

  return { panGesture, animatedRowStyle, animatedDeleteStyle, translateX };
}

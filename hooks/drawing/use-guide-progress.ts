import { useEffect } from "react";
import {
  Easing,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export function useGuideProgress(currentIndex: number) {
  const progress = useSharedValue(-1);

  useEffect(() => {
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
    );
  }, [currentIndex, progress]);

  return progress;
}

import { DrawnPath, ShakeOffset } from "@/types/drawing";
import { resamplePath } from "@/utils/stroke";
import { SkPath } from "@shopify/react-native-skia";
import { Dispatch, SetStateAction, useEffect, useRef } from "react";

type UsePathAnimationParams = {
  numberOfPoints: number;
  setDrawnPaths: Dispatch<SetStateAction<DrawnPath[]>>;
  setShakeOffset: Dispatch<SetStateAction<ShakeOffset>>;
  setShakingPathId: Dispatch<SetStateAction<number | null>>;
};

export function usePathAnimation({
  numberOfPoints,
  setDrawnPaths,
  setShakeOffset,
  setShakingPathId,
}: UsePathAnimationParams) {
  const shakeTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const morphAnimationRef = useRef<number | null>(null);

  const stopMorphAnimation = () => {
    if (morphAnimationRef.current !== null) {
      cancelAnimationFrame(morphAnimationRef.current);
      morphAnimationRef.current = null;
    }
  };

  const stopShakeAnimation = () => {
    shakeTimersRef.current.forEach(clearTimeout);
    shakeTimersRef.current = [];
    setShakeOffset({ x: 0, y: 0 });
    setShakingPathId(null);
  };

  const stopAllAnimations = () => {
    stopMorphAnimation();
    stopShakeAnimation();
  };

  const playShake = (pathId: number, onComplete?: () => void) => {
    shakeTimersRef.current.forEach(clearTimeout);
    shakeTimersRef.current = [];

    const frames = [
      { at: 0, x: -2, y: 1 },
      { at: 45, x: 2, y: -1 },
      { at: 90, x: -1.5, y: 0.75 },
      { at: 135, x: 1.5, y: -0.75 },
      { at: 180, x: 0, y: 0 },
    ];

    for (const frame of frames) {
      const timer = setTimeout(() => {
        setShakingPathId(pathId);
        setShakeOffset({ x: frame.x, y: frame.y });
      }, frame.at);
      shakeTimersRef.current.push(timer);
    }

    const clearTimer = setTimeout(() => {
      setShakeOffset({ x: 0, y: 0 });
      setShakingPathId((current) => (current === pathId ? null : current));
      onComplete?.();
    }, 230);

    shakeTimersRef.current.push(clearTimer);
  };

  const playMorphToGuide = (
    pathId: number,
    fromPath: SkPath,
    guidePath: SkPath,
    onComplete?: () => void,
  ) => {
    stopMorphAnimation();

    const targetPath = resamplePath(guidePath, numberOfPoints);
    const durationMs = 400;
    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp;
      }

      const progressRatio = Math.min((timestamp - startTime) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progressRatio, 3);

      const interpolated = fromPath.interpolate(targetPath, 1 - eased);
      const framePath =
        interpolated ?? (progressRatio >= 1 ? targetPath : fromPath);

      setDrawnPaths((prev) =>
        prev.map((item) =>
          item.id === pathId
            ? { ...item, color: "#1ea54c", path: framePath }
            : item,
        ),
      );

      if (progressRatio < 1) {
        morphAnimationRef.current = requestAnimationFrame(step);
        return;
      }

      morphAnimationRef.current = null;
      onComplete?.();
    };

    morphAnimationRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    return () => {
      stopAllAnimations();
    };
  }, []);

  return {
    playMorphToGuide,
    playShake,
    stopAllAnimations,
  };
}

import lettersJson from "@/assets/letters.json";
import { LetterGuide } from "@/components/drawing/LetterGuide";
import {
  compareStrokes,
  EMPTY_STROKE_SCORES,
  resamplePath,
} from "@/utils/stroke";
import { Canvas, Path, rect, Skia, SkPath } from "@shopify/react-native-skia";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button, Dimensions, StyleSheet, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const letterPaths = lettersJson.tha;

const { width: windowWidth } = Dimensions.get("window");
const FILE_LETTER_WIDTH = 35;
const FILE_LETTER_HEIGHT = 30;
const numberOfPoints = 50;

type DrawnPath = {
  id: number;
  path: SkPath;
  color: string;
};

const SHAPE_THRESHOLD = 0.6;
const SIZE_THRESHOLD = 0.6;
const CLOSENESS_THRESHOLD = 0.6;

export default function TestPage() {
  const dst = rect(
    0,
    0,
    windowWidth,
    (windowWidth * FILE_LETTER_HEIGHT) / FILE_LETTER_WIDTH,
  );
  const scaleX = windowWidth / FILE_LETTER_WIDTH;
  const scaleY = dst.height / FILE_LETTER_HEIGHT;

  const scaledLetterPaths = useMemo(() => {
    const matrix = Skia.Matrix();
    matrix.scale(scaleX, scaleY);

    return letterPaths.map((svgPath) => {
      const path = Skia.Path.MakeFromSVGString(svgPath);
      if (!path) {
        return Skia.Path.Make();
      }
      path.transform(matrix);

      return path;
    });
  }, [scaleX, scaleY]);

  const pencilPath = useSharedValue(Skia.Path.Make());

  const [currentIndex, setCurrentIndex] = useState(0);
  const [drawnPaths, setDrawnPaths] = useState<DrawnPath[]>([]);
  const [shakingPathId, setShakingPathId] = useState<number | null>(null);
  const progress = useSharedValue(-1);
  const shakeProgress = useSharedValue(0);
  const nextPathIdRef = useRef(1);
  const morphAnimationRef = useRef<number | null>(null);
  const shakeCompletionRef = useRef<(() => void) | undefined>(undefined);

  const shakeTransform = useDerivedValue(() => {
    const shakeFrames = [
      { x: -2, y: 1 },
      { x: 2, y: -1 },
      { x: -1.5, y: 0.75 },
      { x: 1.5, y: -0.75 },
      { x: 0, y: 0 },
    ];

    const phase = shakeProgress.value;
    const frameIndex = Math.min(Math.floor(phase), shakeFrames.length - 1);
    const nextFrameIndex = Math.min(frameIndex + 1, shakeFrames.length - 1);
    const localProgress = phase - frameIndex;

    const currentFrame = shakeFrames[frameIndex];
    const nextFrame = shakeFrames[nextFrameIndex];

    return [
      {
        translateX:
          currentFrame.x + (nextFrame.x - currentFrame.x) * localProgress,
      },
      {
        translateY:
          currentFrame.y + (nextFrame.y - currentFrame.y) * localProgress,
      },
    ];
  });

  const stopMorphAnimation = () => {
    if (morphAnimationRef.current !== null) {
      cancelAnimationFrame(morphAnimationRef.current);
      morphAnimationRef.current = null;
    }
  };

  const finishShake = useCallback((completedPathId: number) => {
    setShakingPathId((current) =>
      current === completedPathId ? null : current,
    );
    shakeCompletionRef.current?.();
    shakeCompletionRef.current = undefined;
  }, []);

  const playShake = (pathId: number, onComplete?: () => void) => {
    cancelAnimation(shakeProgress);
    setShakingPathId(pathId);
    shakeCompletionRef.current = onComplete;

    shakeProgress.value = 0;
    shakeProgress.value = withSequence(
      withTiming(1, { duration: 45, easing: Easing.linear }),
      withTiming(2, { duration: 45, easing: Easing.linear }),
      withTiming(3, { duration: 45, easing: Easing.linear }),
      withTiming(4, { duration: 95, easing: Easing.linear }, (finished) => {
        if (finished) {
          scheduleOnRN(finishShake, pathId);
        }
      }),
    );
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

  // Animate the current path when currentIndex changes
  useEffect(() => {
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
    );
  }, [currentIndex, progress]);

  useEffect(() => {
    return () => {
      stopMorphAnimation();
      cancelAnimation(shakeProgress);
      shakeCompletionRef.current = undefined;
    };
  }, [shakeProgress]);

  const handleReset = () => {
    stopMorphAnimation();
    cancelAnimation(shakeProgress);
    setCurrentIndex(0);
    setDrawnPaths([]);
    setShakingPathId(null);
  };

  const gesture = Gesture.Pan()
    .runOnJS(true)
    .onBegin((event) => {
      pencilPath.value.moveTo(event.x, event.y);
    })
    .onChange((event) => {
      pencilPath.value.lineTo(event.x, event.y);
    })
    .onEnd(() => {
      const pencilSampledPath = resamplePath(pencilPath.value, numberOfPoints);
      const guidePath = scaledLetterPaths[currentIndex];
      const scores = guidePath
        ? compareStrokes(pencilSampledPath, guidePath, numberOfPoints)
        : EMPTY_STROKE_SCORES;
      const passesShape = scores.shapeScore >= SHAPE_THRESHOLD;
      const passesSize = scores.sizeScore >= SIZE_THRESHOLD;
      const passesCloseness = scores.closenessScore >= CLOSENESS_THRESHOLD;
      const isSimilar = passesShape && passesSize && passesCloseness;
      const pathId = nextPathIdRef.current;
      nextPathIdRef.current += 1;

      setDrawnPaths((prev) => [
        ...prev,
        {
          color: isSimilar ? "#1ea54c" : "#d33c3c",
          id: pathId,
          path: pencilSampledPath,
        },
      ]);

      if (isSimilar && guidePath) {
        playMorphToGuide(pathId, pencilSampledPath, guidePath);
        setCurrentIndex(currentIndex + 1);
      }

      if (!isSimilar) {
        playShake(pathId, () => {
          setDrawnPaths((prev) =>
            prev.map((item) =>
              item.id === pathId ? { ...item, color: "transparent" } : item,
            ),
          );
        });
      }

      pencilPath.value = Skia.Path.Make();
    });

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        <Button title="Reset" onPress={handleReset} />
        <GestureDetector gesture={gesture}>
          <Canvas
            style={{
              width: windowWidth,
              height: dst.height,
              backgroundColor: "#fff",
            }}
          >
            <LetterGuide
              activePathIndex={currentIndex}
              progress={progress}
              scaledLetterPaths={scaledLetterPaths}
            />

            <Path
              path={pencilPath}
              color="black"
              style="stroke"
              strokeWidth={6}
              strokeCap="round"
              strokeJoin="round"
            />

            {drawnPaths.map((item) => (
              <Path
                key={`resampled-${item.id}`}
                path={item.path}
                color={item.color}
                style="stroke"
                strokeWidth={6}
                strokeCap="round"
                strokeJoin="round"
                transform={
                  item.id === shakingPathId ? shakeTransform : undefined
                }
              />
            ))}
          </Canvas>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#aaa", flex: 1, paddingTop: 50 },
});

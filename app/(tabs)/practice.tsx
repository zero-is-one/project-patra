import lettersJson from "@/assets/letters.json";
import { LetterGuide } from "@/components/drawing/LetterGuide";
import {
  CLOSENESS_THRESHOLD,
  NUMBER_OF_POINTS,
  SHAPE_THRESHOLD,
  SIZE_THRESHOLD,
} from "@/constants/drawing";
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
import { Button, StyleSheet, useWindowDimensions, View } from "react-native";
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

type DrawingPracticeCanvasProps = {
  svgPaths?: string[];
  letterWidth?: number;
  letterHeight?: number;
  char?: string;
  onNext?: () => void;
  isLast?: boolean;
};

type LetterPathBundle = {
  paths: string[];
  width: number;
  height: number;
};

type LetterPathMap = Record<string, LetterPathBundle>;

const DEFAULT_LETTER_WIDTH = 35;
const DEFAULT_LETTER_HEIGHT = 30;

type DrawnPath = {
  id: number;
  path: SkPath;
  color: string;
};

export function DrawingPracticeCanvas({
  svgPaths,
  letterWidth,
  letterHeight,
  char,
  onNext,
  isLast,
}: DrawingPracticeCanvasProps) {
  const { width: windowWidth } = useWindowDimensions();
  const fallbackBundle = (lettersJson as LetterPathMap).tha;
  const sourceWidth =
    letterWidth ?? fallbackBundle?.width ?? DEFAULT_LETTER_WIDTH;
  const sourceHeight =
    letterHeight ?? fallbackBundle?.height ?? DEFAULT_LETTER_HEIGHT;

  const dst = rect(
    0,
    0,
    windowWidth,
    (windowWidth * sourceHeight) / sourceWidth,
  );
  const scaleX = windowWidth / sourceWidth;
  const scaleY = dst.height / sourceHeight;

  // If svgPaths is provided, use those paths; else use all from lettersJson.tha.
  const scaledLetterPaths = useMemo(() => {
    const matrix = Skia.Matrix();
    matrix.scale(scaleX, scaleY);
    if (svgPaths?.length) {
      return svgPaths.map((pathString) => {
        const path = Skia.Path.MakeFromSVGString(pathString);
        if (!path) {
          return Skia.Path.Make();
        }
        path.transform(matrix);
        return path;
      });
    }
    // fallback: all
    const fallbackPaths = fallbackBundle?.paths ?? [];
    return fallbackPaths.map((svgPath) => {
      const path = Skia.Path.MakeFromSVGString(svgPath);
      if (!path) {
        return Skia.Path.Make();
      }
      path.transform(matrix);
      return path;
    });
  }, [fallbackBundle?.paths, scaleX, scaleY, svgPaths]);

  const pencilPath = useSharedValue(Skia.Path.Make());

  const [currentIndex, setCurrentIndex] = useState(0);
  const [drawnPaths, setDrawnPaths] = useState<DrawnPath[]>([]);
  const [shakingPathId, setShakingPathId] = useState<number | null>(null);
  const [morphingPathId, setMorphingPathId] = useState<number | null>(null);
  const isComplete = currentIndex >= scaledLetterPaths.length;
  const progress = useSharedValue(-1);
  const shakeProgress = useSharedValue(0);
  const morphPath = useSharedValue(Skia.Path.Make());
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

  const stopMorphAnimation = useCallback(() => {
    if (morphAnimationRef.current !== null) {
      cancelAnimationFrame(morphAnimationRef.current);
      morphAnimationRef.current = null;
    }
  }, []);

  const finishShake = useCallback((completedPathId: number) => {
    setShakingPathId((current) =>
      current === completedPathId ? null : current,
    );
    shakeCompletionRef.current?.();
    shakeCompletionRef.current = undefined;
  }, []);

  const playShake = useCallback(
    (pathId: number, onComplete?: () => void) => {
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
    },
    [finishShake, shakeProgress],
  );

  const playMorphToGuide = useCallback(
    (
      pathId: number,
      fromPath: SkPath,
      guidePath: SkPath,
      onComplete?: () => void,
    ) => {
      stopMorphAnimation();
      setMorphingPathId(pathId);
      morphPath.value = fromPath.copy();

      const targetPath = resamplePath(guidePath, NUMBER_OF_POINTS);
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
        morphPath.value = framePath;

        if (progressRatio < 1) {
          morphAnimationRef.current = requestAnimationFrame(step);
          return;
        }

        morphAnimationRef.current = null;
        setMorphingPathId((current) => (current === pathId ? null : current));
        morphPath.value = Skia.Path.Make();
        setDrawnPaths((prev) =>
          prev.map((item) =>
            item.id === pathId
              ? { ...item, color: "#1ea54c", path: targetPath }
              : item,
          ),
        );
        onComplete?.();
      };

      morphAnimationRef.current = requestAnimationFrame(step);
    },
    [morphPath, stopMorphAnimation],
  );

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
  }, [shakeProgress, stopMorphAnimation]);

  const handleReset = () => {
    stopMorphAnimation();
    cancelAnimation(shakeProgress);
    morphPath.value = Skia.Path.Make();
    nextPathIdRef.current = 1;
    setCurrentIndex(0);
    setDrawnPaths([]);
    setMorphingPathId(null);
    setShakingPathId(null);
  };

  const commitStroke = useCallback(
    (completedPath: SkPath) => {
      if (currentIndex >= scaledLetterPaths.length) {
        return;
      }

      const pencilSampledPath = resamplePath(completedPath, NUMBER_OF_POINTS);
      const guidePath = scaledLetterPaths[currentIndex];
      const scores = guidePath
        ? compareStrokes(pencilSampledPath, guidePath, NUMBER_OF_POINTS)
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
          color: isSimilar ? "transparent" : "#d33c3c",
          id: pathId,
          path: pencilSampledPath,
        },
      ]);

      if (isSimilar && guidePath) {
        playMorphToGuide(pathId, pencilSampledPath, guidePath);
        setCurrentIndex((prev) => Math.min(prev + 1, scaledLetterPaths.length));
      }

      if (!isSimilar) {
        playShake(pathId, () => {
          setDrawnPaths((prev) => prev.filter((item) => item.id !== pathId));
        });
      }
    },
    [currentIndex, playMorphToGuide, playShake, scaledLetterPaths],
  );

  const gesture = Gesture.Pan()
    .enabled(!isComplete)
    .onBegin((event) => {
      pencilPath.value.moveTo(event.x, event.y);
    })
    .onChange((event) => {
      pencilPath.value.lineTo(event.x, event.y);
    })
    .onEnd(() => {
      const completedPath = pencilPath.value.copy();
      pencilPath.value = Skia.Path.Make();
      scheduleOnRN(commitStroke, completedPath);
    });

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        {char && (
          <View style={{ alignItems: "center", marginBottom: 8 }}>
            <Button title={char} disabled />
          </View>
        )}
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

            {morphingPathId !== null && (
              <Path
                path={morphPath}
                color="#1ea54c"
                style="stroke"
                strokeWidth={6}
                strokeCap="round"
                strokeJoin="round"
              />
            )}
          </Canvas>
        </GestureDetector>
        {isComplete && onNext && (
          <Button
            title={isLast ? "Finish Lesson" : "Next Character"}
            onPress={onNext}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#aaa", flex: 1, paddingTop: 50 },
});

export default function PracticeScreen() {
  return <DrawingPracticeCanvas />;
}

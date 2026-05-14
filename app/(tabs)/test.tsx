import {
  compareStrokes,
  EMPTY_STROKE_SCORES,
  resamplePath,
} from "@/utils/stroke";
import { Canvas, Path, rect, Skia, SkPath } from "@shopify/react-native-skia";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Dimensions, StyleSheet, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import {
  Easing,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import lettersJson from "../../assets/letters.json";
const letterPaths = lettersJson.tha2;

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
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0 });
  const progress = useSharedValue(-1);
  const nextPathIdRef = useRef(1);
  const shakeTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const morphAnimationRef = useRef<number | null>(null);

  const stopMorphAnimation = () => {
    if (morphAnimationRef.current !== null) {
      cancelAnimationFrame(morphAnimationRef.current);
      morphAnimationRef.current = null;
    }
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
      shakeTimersRef.current.forEach(clearTimeout);
      shakeTimersRef.current = [];
    };
  }, []);

  const handleReset = () => {
    stopMorphAnimation();
    setCurrentIndex(0);
    setDrawnPaths([]);
  };

  const gesture = Gesture.Pan()
    .runOnJS(true)
    .onBegin((event) => {
      pencilPath.value.moveTo(event.x, event.y);
      //pencilPath.modify();
    })
    .onChange((event) => {
      pencilPath.value.lineTo(event.x, event.y);
      //pencilPath.modify();
    })
    .onEnd(() => {
      const equalPath = resamplePath(pencilPath.value, numberOfPoints);
      const guidePath = scaledLetterPaths[currentIndex];
      const scores = guidePath
        ? compareStrokes(equalPath, guidePath, numberOfPoints)
        : EMPTY_STROKE_SCORES;
      const passesShape = scores.shapeScore >= SHAPE_THRESHOLD;
      const passesSize = scores.sizeScore >= SIZE_THRESHOLD;
      const passesCloseness = scores.closenessScore >= CLOSENESS_THRESHOLD;
      const isSimilar = passesShape && passesSize && passesCloseness;
      console.log(
        "shapeScore:",
        scores.shapeScore.toFixed(2),
        "sizeScore:",
        scores.sizeScore.toFixed(2),
        "closenessScore:",
        scores.closenessScore.toFixed(2),
        isSimilar ? "✓" : "✗",
      );
      const pathId = nextPathIdRef.current;
      nextPathIdRef.current += 1;

      setDrawnPaths((prev) => [
        ...prev,
        {
          color: isSimilar ? "#1ea54c" : "#d33c3c",
          id: pathId,
          path: equalPath,
        },
      ]);

      if (isSimilar && guidePath) {
        playMorphToGuide(pathId, equalPath, guidePath);
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
            {scaledLetterPaths.map((path, index) => (
              <Path
                key={`guide-base-${index}`}
                path={path}
                style="stroke"
                strokeWidth={10}
                color="#a9a9a9"
                strokeCap="round"
              />
            ))}
            {scaledLetterPaths.map((path, index) => (
              <Path
                key={`guide-active-${index}`}
                path={path}
                style="stroke"
                strokeWidth={10}
                color="#7d7d7d"
                end={index === currentIndex ? progress : 0}
                strokeCap="round"
              />
            ))}

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
                  item.id === shakingPathId
                    ? [
                        { translateX: shakeOffset.x },
                        { translateY: shakeOffset.y },
                      ]
                    : undefined
                }
              />
            ))}

            {/* <Path path={morphPath} color="red" style="stroke" strokeWidth={6} /> */}
          </Canvas>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#aaa", flex: 1, paddingTop: 50 },
});

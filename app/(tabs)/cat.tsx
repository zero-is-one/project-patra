import { Canvas, Path, Skia, SkPath } from "@shopify/react-native-skia";
import React, { useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import {
  runOnJS,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

/**
 * Resamples a path to a specific point count.
 * This is marked as a worklet to run safely on the UI thread.
 */
const resamplePath = (source: SkPath, targetCount: number): SkPath => {
  "worklet";
  const newPath = Skia.Path.Make();
  const sourceCount = source.countPoints();
  if (sourceCount < 2) return source;

  for (let i = 0; i < targetCount; i++) {
    const t = i / (targetCount - 1);
    // Find the fractional index in the original path
    const index = Math.min(Math.floor(t * (sourceCount - 1)), sourceCount - 1);
    const point = source.getPoint(index);

    if (i === 0) {
      newPath.moveTo(point.x, point.y);
    } else {
      newPath.lineTo(point.x, point.y);
    }
  }
  return newPath;
};

export default function StrokeMorph() {
  const [firstPathData, setFirstPathData] = useState<{
    svg: string;
    points: number;
  } | null>(null);

  const currentPath = useSharedValue(Skia.Path.Make());
  const progress = useSharedValue(0);
  const isMorphing = useSharedValue(false);

  const displayPath = useDerivedValue(() => {
    if (isMorphing.value && firstPathData) {
      const p1 = Skia.Path.MakeFromSVGString(firstPathData.svg);
      const p2 = currentPath.value;

      // Interpolate only if point counts match
      if (p1 && p2 && p1.countPoints() === p2.countPoints()) {
        const interpolated = p2.interpolate(p1, progress.value);
        return interpolated || p2;
      }
    }
    return currentPath.value;
  });

  const gesture = Gesture.Pan()
    .onBegin(() => {
      if (!isMorphing.value) {
        currentPath.value = Skia.Path.Make();
      }
    })
    .onUpdate((e) => {
      if (isMorphing.value) return;
      const nextPath = currentPath.value.copy();
      if (nextPath.countPoints() === 0) {
        nextPath.moveTo(e.x, e.y);
      } else {
        nextPath.lineTo(e.x, e.y);
      }
      currentPath.value = nextPath;
    })
    .onEnd(() => {
      if (!firstPathData) {
        // Step 1: Save first stroke
        const svg = currentPath.value.toSVGString();
        const points = currentPath.value.countPoints();
        runOnJS(setFirstPathData)({ svg, points });
        currentPath.value = Skia.Path.Make();
      } else {
        // Step 2: Resample second stroke to match first stroke's point count
        const targetPoints = firstPathData.points;
        const normalized = resamplePath(currentPath.value, targetPoints);
        currentPath.value = normalized;

        // Step 3: Animate morph
        isMorphing.value = true;
        progress.value = withTiming(1, { duration: 600 }, (finished) => {
          if (finished) {
            runOnJS(setFirstPathData)(null);
            isMorphing.value = false;
            progress.value = 0;
            currentPath.value = Skia.Path.Make();
          }
        });
      }
    });

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        <GestureDetector gesture={gesture}>
          <Canvas style={styles.canvas}>
            <Path
              path={displayPath}
              color="black"
              style="stroke"
              strokeWidth={6}
              strokeCap="round"
              strokeJoin="round"
            />
          </Canvas>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  canvas: { flex: 1, width, height },
});

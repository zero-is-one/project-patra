import { Canvas, FitBox, Path, rect, Skia } from "@shopify/react-native-skia";
import React, { useEffect, useState } from "react";
import { Button, Dimensions, StyleSheet, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import lettersJson from "../../assets/letters.json";

const { width, height } = Dimensions.get("window");

const pathA = Skia.Path.MakeFromSVGString("M 0 0 L 100 0 L 100 100 Z");
const pathB = Skia.Path.MakeFromSVGString("M 50 50 L 150 50 L 150 150 Z");

export default function TestPage() {
  const letterPaths = lettersJson.tha;
  // Use shared value for Skia Path, following reference example
  const currentPath = useSharedValue(Skia.Path.Make());
  const [currentIndex, setCurrentIndex] = useState(0);
  const progress = useSharedValue(-1);

  const drawMorphProgess = useSharedValue(0);

  // Use Reanimated's useDerivedValue to handle the interpolation
  const interpolatedPath = useDerivedValue(() => {
    return pathA!.interpolate(pathB!, progress.value);
  });

  // Animate the current path when currentIndex changes
  useEffect(() => {
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
    );
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < letterPaths.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(-1); // Reset to first path
    }
  };

  const src = rect(0, 0, 35, 30); // Original dimensions
  const dst = rect(0, 0, width, (width * 30) / 35); // Target dimensions
  const gesture = Gesture.Pan()
    .onBegin((event) => {
      currentPath.value.moveTo(event.x, event.y);
      //currentPath.modify();
    })
    .onChange((event) => {
      currentPath.value.lineTo(event.x, event.y);
      //currentPath.modify();
    })
    .onEnd(() => {
      // currentPath.value.reset();
      // currentPath.modify();
    });
  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        <Button title="Next Stroke" onPress={handleNext} />
        <GestureDetector gesture={gesture}>
          <Canvas
            style={{ width, height: dst.height, backgroundColor: "#fff" }}
          >
            <FitBox src={src} dst={dst}>
              {letterPaths.map((path, index) => (
                <Path
                  key={index}
                  path={path}
                  style="stroke"
                  strokeWidth={4}
                  color="#a2a2ff"
                  strokeCap="round"
                />
              ))}
              {letterPaths.map((path, index) => (
                <Path
                  key={index}
                  path={path}
                  style="stroke"
                  strokeWidth={4}
                  color="#4b4b74"
                  end={index === currentIndex ? progress : 0}
                  strokeCap="round"
                />
              ))}
            </FitBox>

            <Path
              path={currentPath}
              color="black"
              style="stroke"
              strokeWidth={6}
              strokeCap="round"
              strokeJoin="round"
            />

            <Path path={interpolatedPath} color="blue" />
          </Canvas>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#aaa", flex: 1, paddingTop: 50 },
});

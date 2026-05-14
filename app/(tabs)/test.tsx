import { DrawingSurface } from "@/components/drawing";
import { NUMBER_OF_POINTS } from "@/constants/drawing";
import {
  useDrawingGesture,
  useGuideProgress,
  usePathAnimation,
} from "@/hooks/drawing";
import { DrawnPath, ShakeOffset } from "@/types/drawing";
import { rect, Skia } from "@shopify/react-native-skia";
import React, { useMemo, useRef, useState } from "react";
import { Button, Dimensions, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";

import lettersJson from "../../assets/letters.json";
const letterPaths = lettersJson.tha2;

const { width: windowWidth } = Dimensions.get("window");
const FILE_LETTER_WIDTH = 35;
const FILE_LETTER_HEIGHT = 30;

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
  const [shakeOffset, setShakeOffset] = useState<ShakeOffset>({ x: 0, y: 0 });
  const progress = useGuideProgress(currentIndex);
  const nextPathIdRef = useRef(1);
  const { playMorphToGuide, playShake, stopAllAnimations } = usePathAnimation({
    numberOfPoints: NUMBER_OF_POINTS,
    setDrawnPaths,
    setShakeOffset,
    setShakingPathId,
  });

  const handleReset = () => {
    stopAllAnimations();
    setCurrentIndex(0);
    setDrawnPaths([]);
  };

  const gesture = useDrawingGesture({
    currentIndex,
    numberOfPoints: NUMBER_OF_POINTS,
    nextPathIdRef,
    pencilPath,
    playMorphToGuide,
    playShake,
    scaledLetterPaths,
    setCurrentIndex,
    setDrawnPaths,
  });

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        <Button title="Reset" onPress={handleReset} />
        <DrawingSurface
          currentIndex={currentIndex}
          drawnPaths={drawnPaths}
          gesture={gesture}
          height={dst.height}
          pencilPath={pencilPath}
          progress={progress}
          scaledLetterPaths={scaledLetterPaths}
          shakeOffset={shakeOffset}
          shakingPathId={shakingPathId}
          width={windowWidth}
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#aaa", flex: 1, paddingTop: 50 },
});

import {
  CLOSENESS_THRESHOLD,
  SHAPE_THRESHOLD,
  SIZE_THRESHOLD,
} from "@/constants/drawing";
import { DrawnPath } from "@/types/drawing";
import {
  compareStrokes,
  EMPTY_STROKE_SCORES,
  resamplePath,
} from "@/utils/stroke";
import { Skia, SkPath } from "@shopify/react-native-skia";
import { Dispatch, MutableRefObject, SetStateAction } from "react";
import { Gesture } from "react-native-gesture-handler";
import { SharedValue } from "react-native-reanimated";

type UseDrawingGestureParams = {
  currentIndex: number;
  numberOfPoints: number;
  nextPathIdRef: MutableRefObject<number>;
  pencilPath: SharedValue<SkPath>;
  playMorphToGuide: (
    pathId: number,
    fromPath: SkPath,
    guidePath: SkPath,
  ) => void;
  playShake: (pathId: number, onComplete?: () => void) => void;
  scaledLetterPaths: SkPath[];
  setCurrentIndex: Dispatch<SetStateAction<number>>;
  setDrawnPaths: Dispatch<SetStateAction<DrawnPath[]>>;
};

export function useDrawingGesture({
  currentIndex,
  numberOfPoints,
  nextPathIdRef,
  pencilPath,
  playMorphToGuide,
  playShake,
  scaledLetterPaths,
  setCurrentIndex,
  setDrawnPaths,
}: UseDrawingGestureParams) {
  return Gesture.Pan()
    .runOnJS(true)
    .onBegin((event) => {
      pencilPath.value.moveTo(event.x, event.y);
    })
    .onChange((event) => {
      pencilPath.value.lineTo(event.x, event.y);
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
        setCurrentIndex((prev) => prev + 1);
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
}

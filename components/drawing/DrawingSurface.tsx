import { GuidePathLayer } from "@/components/drawing/GuidePathLayer";
import { UserPathLayer } from "@/components/drawing/UserPathLayer";
import { DrawnPath, ShakeOffset } from "@/types/drawing";
import { Canvas, SkPath } from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { SharedValue } from "react-native-reanimated";

type DrawingSurfaceProps = {
  currentIndex: number;
  drawnPaths: DrawnPath[];
  gesture: ReturnType<typeof Gesture.Pan>;
  height: number;
  pencilPath: SharedValue<SkPath>;
  progress: SharedValue<number>;
  scaledLetterPaths: SkPath[];
  shakeOffset: ShakeOffset;
  shakingPathId: number | null;
  width: number;
};

export function DrawingSurface({
  currentIndex,
  drawnPaths,
  gesture,
  height,
  pencilPath,
  progress,
  scaledLetterPaths,
  shakeOffset,
  shakingPathId,
  width,
}: DrawingSurfaceProps) {
  return (
    <GestureDetector gesture={gesture}>
      <Canvas
        style={{
          width,
          height,
          backgroundColor: "#fff",
        }}
      >
        <GuidePathLayer
          currentIndex={currentIndex}
          progress={progress}
          scaledLetterPaths={scaledLetterPaths}
        />
        <UserPathLayer
          drawnPaths={drawnPaths}
          pencilPath={pencilPath}
          shakeOffset={shakeOffset}
          shakingPathId={shakingPathId}
        />
      </Canvas>
    </GestureDetector>
  );
}

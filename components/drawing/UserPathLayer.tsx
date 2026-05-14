import { DrawnPath, ShakeOffset } from "@/types/drawing";
import { Path, SkPath } from "@shopify/react-native-skia";
import { SharedValue } from "react-native-reanimated";

type UserPathLayerProps = {
  drawnPaths: DrawnPath[];
  pencilPath: SharedValue<SkPath>;
  shakeOffset: ShakeOffset;
  shakingPathId: number | null;
};

export function UserPathLayer({
  drawnPaths,
  pencilPath,
  shakeOffset,
  shakingPathId,
}: UserPathLayerProps) {
  return (
    <>
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
              ? [{ translateX: shakeOffset.x }, { translateY: shakeOffset.y }]
              : undefined
          }
        />
      ))}
    </>
  );
}

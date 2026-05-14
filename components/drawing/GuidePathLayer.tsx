import { Path, SkPath } from "@shopify/react-native-skia";
import { SharedValue } from "react-native-reanimated";

type GuidePathLayerProps = {
  currentIndex: number;
  progress: SharedValue<number>;
  scaledLetterPaths: SkPath[];
};

export function GuidePathLayer({
  currentIndex,
  progress,
  scaledLetterPaths,
}: GuidePathLayerProps) {
  return (
    <>
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
    </>
  );
}

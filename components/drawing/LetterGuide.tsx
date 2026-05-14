import { Path, SkPath } from "@shopify/react-native-skia";
import { SharedValue } from "react-native-reanimated";

type LetterGuideProps = {
  activePathIndex: number;
  scaledLetterPaths: SkPath[];
  progress: SharedValue<number>;
};

export function LetterGuide({
  activePathIndex,
  scaledLetterPaths,
  progress,
}: LetterGuideProps) {
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
          end={index === activePathIndex ? progress : 0}
          strokeCap="round"
        />
      ))}
    </>
  );
}

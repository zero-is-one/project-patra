import { SkPath } from "@shopify/react-native-skia";

export type DrawnPath = {
  id: number;
  path: SkPath;
  color: string;
};

export type ShakeOffset = {
  x: number;
  y: number;
};

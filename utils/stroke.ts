import { Skia, SkPath } from "@shopify/react-native-skia";

export type StrokeScores = {
  closenessScore: number;
  shapeScore: number;
  sizeScore: number;
};

export const EMPTY_STROKE_SCORES: StrokeScores = {
  closenessScore: 0,
  shapeScore: 0,
  sizeScore: 0,
};

export const resamplePath = (path: SkPath, numPoints: number): SkPath => {
  if (numPoints < 2) {
    return path;
  }

  const iterator = Skia.ContourMeasureIter(path, false, 1);
  const contour = iterator.next();
  const newPath = Skia.Path.Make();

  if (!contour) {
    console.warn("Path has no contours, cannot resample");
    return path;
  }

  const length = contour.length();
  if (length <= 0) {
    console.warn("Path contour has zero length, cannot resample");
    return path;
  }

  const step = length / (numPoints - 1);

  for (let i = 0; i < numPoints; i++) {
    const distance = Math.min(i * step, length);
    const posTan = contour.getPosTan(distance);

    if (!posTan) {
      continue;
    }

    const [position] = posTan;

    if (i === 0) {
      newPath.moveTo(position.x, position.y);
    } else {
      newPath.lineTo(position.x, position.y);
    }
  }

  return newPath;
};

const samplePathPoints = (
  path: SkPath,
  numPoints: number,
): { x: number; y: number }[] => {
  if (numPoints < 2) {
    return [];
  }

  const iterator = Skia.ContourMeasureIter(path, false, 1);
  const contour = iterator.next();

  if (!contour) {
    return [];
  }

  const length = contour.length();
  if (length <= 0) {
    return [];
  }

  const step = length / (numPoints - 1);
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < numPoints; i++) {
    const distance = Math.min(i * step, length);
    const posTan = contour.getPosTan(distance);
    if (!posTan) {
      continue;
    }

    const [position] = posTan;
    points.push({ x: position.x, y: position.y });
  }

  return points;
};

const normalizePoints = (points: { x: number; y: number }[]) => {
  if (points.length === 0) {
    return points;
  }

  let cx = 0;
  let cy = 0;
  for (const point of points) {
    cx += point.x;
    cy += point.y;
  }
  cx /= points.length;
  cy /= points.length;

  let rms = 0;
  for (const point of points) {
    const dx = point.x - cx;
    const dy = point.y - cy;
    rms += dx * dx + dy * dy;
  }
  rms = Math.sqrt(rms / points.length);

  if (rms <= 1e-6) {
    return points.map(() => ({ x: 0, y: 0 }));
  }

  return points.map((point) => ({
    x: (point.x - cx) / rms,
    y: (point.y - cy) / rms,
  }));
};

const getCentroid = (points: { x: number; y: number }[]) => {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }

  let x = 0;
  let y = 0;
  for (const point of points) {
    x += point.x;
    y += point.y;
  }

  return { x: x / points.length, y: y / points.length };
};

const getRmsScale = (points: { x: number; y: number }[]) => {
  if (points.length === 0) {
    return 0;
  }

  const center = getCentroid(points);
  let sum = 0;
  for (const point of points) {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    sum += dx * dx + dy * dy;
  }

  return Math.sqrt(sum / points.length);
};

const getBounds = (points: { x: number; y: number }[]) => {
  if (points.length === 0) {
    return { maxX: 0, maxY: 0, minX: 0, minY: 0 };
  }

  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;

  for (const point of points) {
    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.y > maxY) maxY = point.y;
  }

  return { maxX, maxY, minX, minY };
};

export const compareStrokes = (
  strokeA: SkPath,
  strokeB: SkPath,
  numPoints: number,
): StrokeScores => {
  const rawPointsA = samplePathPoints(strokeA, numPoints);
  const rawPointsB = samplePathPoints(strokeB, numPoints);

  const count = Math.min(rawPointsA.length, rawPointsB.length);
  if (count < 2) {
    return EMPTY_STROKE_SCORES;
  }

  const pointsA = normalizePoints(rawPointsA);
  const pointsB = normalizePoints(rawPointsB);

  const normalizedCount = Math.min(pointsA.length, pointsB.length);

  let distanceSum = 0;
  for (let i = 0; i < normalizedCount; i++) {
    const dx = pointsA[i].x - pointsB[i].x;
    const dy = pointsA[i].y - pointsB[i].y;
    distanceSum += Math.sqrt(dx * dx + dy * dy);
  }

  const avgDistance = distanceSum / normalizedCount;
  const shapeScore = Math.max(0, Math.min(1, 1 - avgDistance / 2));

  const scaleA = getRmsScale(rawPointsA);
  const scaleB = getRmsScale(rawPointsB);
  const maxScale = Math.max(scaleA, scaleB, 1e-6);
  const minScale = Math.min(scaleA, scaleB);
  const sizeScore = Math.max(0, Math.min(1, minScale / maxScale));

  const centerA = getCentroid(rawPointsA);
  const centerB = getCentroid(rawPointsB);
  const centerDistance = Math.sqrt(
    (centerA.x - centerB.x) * (centerA.x - centerB.x) +
      (centerA.y - centerB.y) * (centerA.y - centerB.y),
  );

  const boundsB = getBounds(rawPointsB);
  const guideWidth = boundsB.maxX - boundsB.minX;
  const guideHeight = boundsB.maxY - boundsB.minY;
  const guideDiagonal = Math.max(
    Math.sqrt(guideWidth * guideWidth + guideHeight * guideHeight),
    1e-6,
  );
  const closenessScore = Math.max(
    0,
    Math.min(1, 1 - centerDistance / guideDiagonal),
  );

  return {
    closenessScore,
    shapeScore,
    sizeScore,
  };
};

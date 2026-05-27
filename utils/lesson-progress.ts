export type LessonProgress = {
  stars: number;
  mistakes: number;
  totalAttempts: number;
  accuracy: number;
  completedAt: string;
};

const lessonProgressStore: Record<string, LessonProgress> = {};

export function getLessonProgress(lessonName: string): LessonProgress | null {
  return lessonProgressStore[lessonName] ?? null;
}

export function saveLessonProgress(
  lessonName: string,
  progress: LessonProgress,
): LessonProgress {
  lessonProgressStore[lessonName] = progress;
  return progress;
}

export function calculateStars(mistakes: number, requiredCorrect: number) {
  if (requiredCorrect <= 0) {
    return 0;
  }

  if (mistakes <= 0) {
    return 3;
  }

  const attempts = requiredCorrect + mistakes;
  const accuracy = requiredCorrect / attempts;

  if (accuracy >= 0.8) {
    return 2;
  }

  return 1;
}

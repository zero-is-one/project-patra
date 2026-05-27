import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  getDrawableLettersForLesson,
  getLessonByName,
} from "@/utils/lesson-data";
import { calculateStars, saveLessonProgress } from "@/utils/lesson-progress";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DrawingPracticeCanvas } from "./(tabs)/practice";

const REQUIRED_CORRECT_PER_LETTER = 3;

type ScoreByKey = Record<string, number>;

function pickRandomKey(keys: string[]) {
  if (keys.length === 0) {
    return null;
  }

  const index = Math.floor(Math.random() * keys.length);
  return keys[index];
}

function getPendingKeys(scoreByKey: ScoreByKey, allKeys: string[]) {
  return allKeys.filter(
    (key) => (scoreByKey[key] ?? 0) < REQUIRED_CORRECT_PER_LETTER,
  );
}

function renderStars(stars: number) {
  return new Array(3).fill(0).map((_, index) => {
    const filled = index < stars;
    return (
      <IconSymbol
        key={`result-star-${index}`}
        name={filled ? "star.fill" : "star"}
        size={26}
        color={filled ? "#f59e0b" : "#94a3b8"}
      />
    );
  });
}

export default function LessonTestScreen() {
  const router = useRouter();
  const { lesson: lessonParam } = useLocalSearchParams();
  const lessonName = Array.isArray(lessonParam) ? lessonParam[0] : lessonParam;

  const lesson = useMemo(() => getLessonByName(lessonName), [lessonName]);
  const letters = useMemo(() => getDrawableLettersForLesson(lesson), [lesson]);
  const letterKeys = useMemo(
    () => letters.map((entry) => entry.key),
    [letters],
  );

  const [scoreByKey, setScoreByKey] = useState<ScoreByKey>({});
  const [currentLetterKey, setCurrentLetterKey] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [resultStars, setResultStars] = useState(0);

  useEffect(() => {
    const initialScores = Object.fromEntries(letterKeys.map((key) => [key, 0]));
    setScoreByKey(initialScores);
    setCurrentLetterKey(pickRandomKey(letterKeys));
    setMistakes(0);
    setIsComplete(false);
    setResultStars(0);
  }, [letterKeys]);

  useEffect(() => {
    if (isComplete || !lesson || letters.length === 0) {
      return;
    }

    const allComplete = letters.every(
      (entry) => (scoreByKey[entry.key] ?? 0) >= REQUIRED_CORRECT_PER_LETTER,
    );

    if (!allComplete) {
      return;
    }

    const requiredCorrect = letters.length * REQUIRED_CORRECT_PER_LETTER;
    const totalAttempts = requiredCorrect + mistakes;
    const stars = calculateStars(mistakes, requiredCorrect);
    const accuracy = requiredCorrect / totalAttempts;

    saveLessonProgress(lesson.name, {
      accuracy,
      completedAt: new Date().toISOString(),
      mistakes,
      stars,
      totalAttempts,
    });

    setResultStars(stars);
    setIsComplete(true);
  }, [isComplete, lesson, letters, mistakes, scoreByKey]);

  const currentLetter = useMemo(
    () => letters.find((entry) => entry.key === currentLetterKey),
    [letters, currentLetterKey],
  );

  function handleAttemptResult(isCorrect: boolean) {
    if (isComplete || !currentLetterKey) {
      return;
    }

    if (!isCorrect) {
      setMistakes((value) => value + 1);
      setScoreByKey((prev) => ({
        ...prev,
        [currentLetterKey]: 0,
      }));
      return;
    }

    setScoreByKey((prev) => ({
      ...prev,
      [currentLetterKey]: Math.min(
        (prev[currentLetterKey] ?? 0) + 1,
        REQUIRED_CORRECT_PER_LETTER,
      ),
    }));
  }

  function handleNextLetter() {
    setCurrentLetterKey((prevKey) => {
      const pending = getPendingKeys(scoreByKey, letterKeys);
      if (pending.length === 0) {
        return prevKey;
      }

      if (pending.length === 1) {
        return pending[0];
      }

      const withoutCurrent = pending.filter((key) => key !== prevKey);
      return pickRandomKey(
        withoutCurrent.length > 0 ? withoutCurrent : pending,
      );
    });
  }

  if (!lesson) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Lesson not found</Text>
        <Pressable style={styles.actionButton} onPress={() => router.back()}>
          <Text style={styles.actionButtonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  if (letters.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>No testable letters in this lesson yet</Text>
        <Pressable style={styles.actionButton} onPress={() => router.back()}>
          <Text style={styles.actionButtonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  if (isComplete) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Test complete</Text>
        <View style={styles.starsRow}>{renderStars(resultStars)}</View>
        <Text style={styles.subtext}>Mistakes: {mistakes}</Text>
        <Pressable
          style={styles.actionButton}
          onPress={() =>
            router.replace({
              pathname: "/lesson",
              params: { lesson: lesson.name },
            })
          }
        >
          <Text style={styles.actionButtonText}>Back To Lesson</Text>
        </Pressable>
      </View>
    );
  }

  if (!currentLetter) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Preparing test...</Text>
      </View>
    );
  }

  const correctForCurrent = scoreByKey[currentLetter.key] ?? 0;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{lesson.name}</Text>
        <Text style={styles.headerText}>No tracing guide in test mode</Text>
        <Text style={styles.headerText}>Current: {currentLetter.char}</Text>
        <Text style={styles.headerText}>
          Current streak: {correctForCurrent}/{REQUIRED_CORRECT_PER_LETTER}
        </Text>
        <Text style={styles.headerText}>Mistakes: {mistakes}</Text>
      </View>

      <View style={styles.canvasContainer}>
        <DrawingPracticeCanvas
          key={`test-${currentLetter.key}`}
          char={currentLetter.char}
          svgPaths={currentLetter.bundle.paths}
          letterWidth={currentLetter.bundle.width}
          letterHeight={currentLetter.bundle.height}
          hideGuide
          onAttemptResult={handleAttemptResult}
          onNext={handleNextLetter}
          isLast={false}
          nextButtonLabel="Next Test Letter"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f8fafc",
    flex: 1,
  },
  header: {
    backgroundColor: "#e2e8f0",
    borderBottomColor: "#cbd5e1",
    borderBottomWidth: 1,
    gap: 2,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "700",
  },
  headerText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "500",
  },
  canvasContainer: {
    flex: 1,
  },
  center: {
    alignItems: "center",
    flex: 1,
    gap: 12,
    justifyContent: "center",
    padding: 16,
  },
  title: {
    color: "#0f172a",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  subtext: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "500",
  },
  starsRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    alignItems: "center",
    backgroundColor: "#1d4ed8",
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 180,
    paddingHorizontal: 14,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});

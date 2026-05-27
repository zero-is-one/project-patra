import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  getDrawableLettersForLesson,
  getLessonByName,
} from "@/utils/lesson-data";
import { getLessonProgress } from "@/utils/lesson-progress";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function renderStars(stars: number, starSize: number) {
  const safeStars = Math.max(0, Math.min(3, stars));
  const slotSize = starSize + 16;
  return new Array(3).fill(0).map((_, index) => {
    const filled = index < safeStars;
    return (
      <View
        key={`star-${index}`}
        style={[
          styles.starIconSlot,
          { width: slotSize, height: slotSize },
          filled && styles.starIconSlotFilled,
        ]}
      >
        <IconSymbol
          name={filled ? "star.fill" : "star"}
          size={starSize}
          color={filled ? "#f59e0b" : "#94a3b8"}
        />
      </View>
    );
  });
}

export default function LessonScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { lesson: lessonParam } = useLocalSearchParams();
  const lessonName = Array.isArray(lessonParam) ? lessonParam[0] : lessonParam;
  const starSize = Math.min(width * 0.2, 100);

  const lesson = useMemo(() => getLessonByName(lessonName), [lessonName]);
  const letters = useMemo(() => getDrawableLettersForLesson(lesson), [lesson]);
  const [stars, setStars] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!lesson?.name) {
        return;
      }

      const progress = getLessonProgress(lesson.name);
      setStars(progress?.stars ?? 0);
    }, [lesson?.name]),
  );

  if (!lesson) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Lesson not found</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerTopRow}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.push("/")}
            accessibilityRole="button"
            accessibilityLabel="Back to lessons"
          >
            <IconSymbol name="chevron.left" size={18} color="#0f172a" />
          </Pressable>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.title}>{lesson.name}</Text>
        </View>

        <View style={styles.ratingCard}>
          <View style={styles.starsRow}>{renderStars(stars, starSize)}</View>
        </View>

        <Text style={styles.sectionTitle}>Lesson characters</Text>
        <View style={styles.lettersGrid}>
          {letters.map((letter) => (
            <Pressable
              key={letter.key}
              style={({ pressed }) => [
                styles.letterIcon,
                pressed && styles.letterIconPressed,
              ]}
              onPress={() =>
                router.push({
                  pathname: "/lesson-letter",
                  params: { letterKey: letter.key, lesson: lesson.name },
                })
              }
            >
              <Text style={styles.letterChar}>{letter.char}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            router.push({
              pathname: "/lesson-test",
              params: { lesson: lesson.name },
            })
          }
        >
          <Text style={styles.primaryButtonText}>Start Test</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f8fafc",
    flex: 1,
  },
  content: {
    gap: 12,
    padding: 16,
    paddingBottom: 120,
    paddingTop: 20,
  },
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  title: {
    color: "#0f172a",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  headerTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  titleRow: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: "#e2e8f0",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 36,
    minWidth: 36,
    width: 36,
  },
  ratingCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  starsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  starIconSlot: {
    alignItems: "center",
    justifyContent: "center",
  },
  starIconSlotFilled: {
    backgroundColor: "transparent",
  },
  sectionTitle: {
    color: "#1e293b",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
  },
  lettersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  letterIcon: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 12,
    borderWidth: 1,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  letterIconPressed: {
    opacity: 0.7,
  },
  letterChar: {
    color: "#111827",
    fontSize: 34,
    textAlign: "center",
  },
  bottomBar: {
    backgroundColor: "#f8fafc",
    borderTopColor: "#e2e8f0",
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    padding: 16,
    position: "absolute",
    right: 0,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#1d4ed8",
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});

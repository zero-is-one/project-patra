import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  getDrawableLettersForLesson,
  getLessonByName,
} from "@/utils/lesson-data";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { DrawingPracticeCanvas } from "./(tabs)/practice";

export default function LessonLetterScreen() {
  const router = useRouter();
  const { lesson: lessonParam, letterKey: letterKeyParam } =
    useLocalSearchParams();
  const lessonName = Array.isArray(lessonParam) ? lessonParam[0] : lessonParam;
  const letterKey = Array.isArray(letterKeyParam)
    ? letterKeyParam[0]
    : letterKeyParam;

  const lesson = useMemo(() => getLessonByName(lessonName), [lessonName]);
  const letter = useMemo(() => {
    const drawableLetters = getDrawableLettersForLesson(lesson);
    return drawableLetters.find((entry) => entry.key === letterKey);
  }, [lesson, letterKey]);

  if (!lesson || !letter) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Letter not found</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          style={styles.soundButton}
          onPress={() =>
            Alert.alert("Audio placeholder", "Letter audio will be added soon.")
          }
        >
          <IconSymbol name="speaker.wave.2.fill" size={18} color="#0f172a" />
          <Text style={styles.soundButtonText}>Play Sound</Text>
        </Pressable>
        <Text style={styles.letterTitle}>{letter.char}</Text>
      </View>

      <View style={styles.canvasContainer}>
        <DrawingPracticeCanvas
          key={`${lesson.name}-${letter.key}`}
          char={letter.char}
          svgPaths={letter.bundle.paths}
          letterWidth={letter.bundle.width}
          letterHeight={letter.bundle.height}
          onNext={() => router.back()}
          isLast
          nextButtonLabel="Done"
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
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  soundButton: {
    alignItems: "center",
    backgroundColor: "#e2e8f0",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  soundButtonText: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "600",
  },
  letterTitle: {
    color: "#0f172a",
    fontSize: 40,
    fontWeight: "700",
  },
  canvasContainer: {
    flex: 1,
    marginTop: 8,
  },
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  title: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  backButton: {
    backgroundColor: "#1d4ed8",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
});

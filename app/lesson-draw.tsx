import lessonsData from "@/assets/lessons.json";
import lettersJson from "@/assets/letters.json";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Button, StyleSheet, View } from "react-native";
import { DrawingPracticeCanvas } from "./(tabs)/practice";

type LetterPathBundle = {
  paths: string[];
  width: number;
  height: number;
};

type LetterPathMap = Record<string, LetterPathBundle>;

function loadLetterPaths(key: string): LetterPathBundle | null {
  const normalizedKey = key.trim().toLowerCase();
  const map = lettersJson as unknown as LetterPathMap;
  const bundle = map[normalizedKey];
  return bundle && bundle.paths.length > 0 ? bundle : null;
}

type LessonLetter = {
  char: string;
  transliteration?: string;
};

type Lesson = {
  name: string;
  letters: LessonLetter[];
};

export default function LessonDrawScreen() {
  const { lesson: lessonName } = useLocalSearchParams();
  const router = useRouter();
  const [charIndex, setCharIndex] = useState(0);
  const [letterBundle, setLetterBundle] = useState<LetterPathBundle | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const lesson = useMemo(() => {
    const lessons = (lessonsData as { lessons: Lesson[] }).lessons;
    const targetLessonName = Array.isArray(lessonName)
      ? lessonName[0]
      : lessonName;
    return lessons.find((l) => l.name === targetLessonName);
  }, [lessonName]);

  const availableLetters = useMemo(() => {
    const letters = lesson?.letters ?? [];
    return letters.filter((letter) => {
      if (!letter.transliteration) {
        return false;
      }
      return !!loadLetterPaths(letter.transliteration);
    });
  }, [lesson]);

  const currentLetter = availableLetters[charIndex];
  const currentChar = currentLetter?.char;
  const currentKey = currentLetter?.transliteration ?? "";

  useFocusEffect(
    useCallback(() => {
      setCharIndex(0);
    }, []),
  );

  useEffect(() => {
    setLoading(true);
    if (!currentChar) {
      setLetterBundle(null);
      setLoading(false);
      return;
    }
    const bundle = loadLetterPaths(currentKey);
    setLetterBundle(bundle);
    setLoading(false);
  }, [currentChar, currentKey]);

  if (!lesson) {
    return (
      <View style={styles.center}>
        <Button title="Back" onPress={() => router.back()} />
        <View>
          <Button title="Lesson not found" disabled />
        </View>
      </View>
    );
  }

  if (availableLetters.length === 0) {
    return (
      <View style={styles.center}>
        <Button title="Back" onPress={() => router.back()} />
        <View style={{ height: 8 }} />
        <Button title="No drawable letters in this lesson yet" disabled />
      </View>
    );
  }

  if (!currentChar) {
    return (
      <View style={styles.center}>
        <Button title="Done! Back to lessons" onPress={() => router.back()} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!letterBundle) {
    return (
      <View style={styles.center}>
        <Button title="Back" onPress={() => router.back()} />
        <View style={{ height: 8 }} />
        <Button title={`No path data for ${currentChar}`} disabled />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <DrawingPracticeCanvas
        key={`${currentKey}-${charIndex}`}
        svgPaths={letterBundle.paths}
        letterWidth={letterBundle.width}
        letterHeight={letterBundle.height}
        char={currentChar}
        onNext={() => setCharIndex((i) => i + 1)}
        isLast={charIndex === availableLetters.length - 1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});

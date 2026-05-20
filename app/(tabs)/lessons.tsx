import lessonsData from "@/assets/lessons.json";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

type Lesson = {
  name: string;
  letters: {
    char: string;
    transliteration: string;
  }[];
};

export default function LessonsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const lessons = (lessonsData as { lessons: Lesson[] }).lessons;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {lessons.map((lesson) => (
          <Pressable
            key={lesson.name}
            onPress={() =>
              router.push({
                pathname: "/lesson-draw",
                params: { lesson: lesson.name },
              })
            }
            style={({ pressed }) => [
              styles.card,
              {
                borderColor: Colors[colorScheme].icon,
                backgroundColor: isDark ? "#1f2327" : "#f8fafc",
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <ThemedText type="subtitle" style={styles.lessonName}>
              {lesson.name}
            </ThemedText>
            <ThemedText type="subtitle" style={styles.lessonName}>
              {lesson.name}
            </ThemedText>

            <View style={styles.charactersRow}>
              {lesson.letters.map((letter) => (
                <ThemedView
                  key={`${lesson.name}-${letter.char}`}
                  style={[
                    styles.characterChip,
                    {
                      borderColor: Colors[colorScheme].tint,
                      backgroundColor: isDark ? "#151718" : "#ffffff",
                    },
                  ]}
                >
                  <ThemedText style={styles.characterText}>
                    {letter.char}
                  </ThemedText>
                </ThemedView>
              ))}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  lessonName: {
    lineHeight: 26,
  },
  charactersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  characterChip: {
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  characterText: {
    fontSize: 22,
    lineHeight: 28,
    textAlign: "center",
  },
});

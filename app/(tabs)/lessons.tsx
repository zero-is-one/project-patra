import coursesData from "@/assets/courses.json";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ScrollView, StyleSheet, View } from "react-native";

type Course = {
  name: string;
  letters: {
    char: string;
    transliteration: string;
  }[];
};

export default function LessonsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const courses = (coursesData as { courses: Course[] }).courses;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {courses.map((course) => (
          <ThemedView
            key={course.name}
            style={[
              styles.card,
              {
                borderColor: Colors[colorScheme].icon,
                backgroundColor: isDark ? "#1f2327" : "#f8fafc",
              },
            ]}
          >
            <ThemedText type="subtitle" style={styles.courseName}>
              {course.name}
            </ThemedText>

            <View style={styles.charactersRow}>
              {course.letters.map((letter) => (
                <ThemedView
                  key={`${course.name}-${letter.char}`}
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
          </ThemedView>
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
  courseName: {
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

import lessonsData from "@/assets/lessons.json";
import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";

type Lesson = {
  name: string;
  letters: {
    char: string;
    transliteration: string;
  }[];
};

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const lessons = (lessonsData as { lessons: Lesson[] }).lessons;

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <View style={styles.headerImageContainer}>
          <Image
            source={require("@/assets/images/partial-react-logo.png")}
            style={styles.reactLogo}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            onPress={() => router.push("/modal")}
            style={({ pressed }) => [
              styles.settingsButton,
              styles.headerSettingsButton,
              pressed && styles.pressed,
            ]}
          >
            <IconSymbol name="gearshape.fill" size={20} color="#111827" />
          </Pressable>
        </View>
      }
    >
      <ThemedView style={styles.headerRow}>
        <ThemedText type="title">Lessons</ThemedText>
      </ThemedView>

      <View style={styles.content}>
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
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImageContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  settingsButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(17, 24, 39, 0.35)",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 8,
  },
  headerSettingsButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
  },
  pressed: {
    opacity: 0.7,
  },
  content: {
    gap: 12,
    paddingBottom: 20,
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
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});

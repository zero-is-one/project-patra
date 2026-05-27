import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="lesson"
          options={{ headerShown: false, title: "Lesson" }}
        />
        <Stack.Screen
          name="lesson-letter"
          options={{ headerShown: false, title: "Letter" }}
        />
        <Stack.Screen
          name="lesson-test"
          options={{ headerShown: false, title: "Lesson Test" }}
        />
        <Stack.Screen
          name="lesson-draw"
          options={{ headerShown: false, title: "Lesson" }}
        />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

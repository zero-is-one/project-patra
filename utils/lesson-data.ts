import lessonsData from "@/assets/lessons.json";
import lettersJson from "@/assets/letters.json";
import {
  DrawableLessonLetter,
  Lesson,
  LessonCatalog,
  LessonLetter,
  LetterPathMap,
} from "@/types/lesson";

const lessonCatalog = lessonsData as LessonCatalog;
const letterPathMap = lettersJson as LetterPathMap;

function getLetterKey(letter: LessonLetter) {
  return (letter.code ?? letter.transliteration ?? "").trim().toLowerCase();
}

export function getLessons() {
  return lessonCatalog.lessons;
}

export function getLessonByName(name?: string | null): Lesson | undefined {
  if (!name) {
    return undefined;
  }
  return lessonCatalog.lessons.find((lesson) => lesson.name === name);
}

export function getDrawableLettersForLesson(
  lesson?: Lesson,
): DrawableLessonLetter[] {
  if (!lesson) {
    return [];
  }

  return lesson.letters
    .map((letter) => {
      const key = getLetterKey(letter);
      const bundle = key ? letterPathMap[key] : undefined;
      if (!key || !bundle || bundle.paths.length === 0) {
        return null;
      }
      return {
        bundle,
        char: letter.char,
        key,
      };
    })
    .filter((entry): entry is DrawableLessonLetter => entry !== null);
}
